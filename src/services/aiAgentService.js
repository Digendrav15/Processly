/**
 * Enterprise AI Chat Agent Service
 * Cross-module intelligence engine for ERP Multi System App.
 * Real-time analysis of Purchase, Sales (OTD), Leads, Tasks, WhatsApp, HR, and Expenses.
 */

import { PURCHASE_STORAGE_KEYS, getPurchaseData, PURCHASE_STAGE_ORDER } from './purchaseStorageService';
import { STORAGE_KEYS, getData } from './otdStorageService';
import { LTO_KEYS } from './leadToOrderStorageService';
import { getWhatsAppChats } from './whatsappStorageService';
import { HR_KEYS, getHRData } from './hrStorageService';
import { PETTY_KEYS, getPettyData } from './pettyStorageService';
import { getInventoryMetrics, getInventoryItems } from './inventoryStorageService';

// Audio feedback chime using Web Audio API
export function playAgentSound(type = 'reply') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'reply') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'send') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

// Extract real data from all modules
export function getSystemSnapshot(currentUser = null) {
  // 1. Purchase
  const indents = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const purchaseStages = {};
  PURCHASE_STAGE_ORDER.forEach((s) => {
    purchaseStages[s] = 0;
  });
  indents.forEach((item) => {
    const stage = item.currentStage || 'Purchase Indent';
    purchaseStages[stage] = (purchaseStages[stage] || 0) + 1;
  });

  // 2. Sales / OTD
  const orders = getData(STORAGE_KEYS.ORDERS, []);
  const salesStages = {};
  orders.forEach((o) => {
    const stg = o.currentStage || o.stage || 'New Order';
    salesStages[stg] = (salesStages[stg] || 0) + 1;
  });

  // 3. Leads
  const leads = getData(LTO_KEYS.LEADS, []);
  const quotations = getData(LTO_KEYS.QUOTATIONS, []);
  const leadStatuses = { new: 0, in_progress: 0, quotation: 0, won: 0, lost: 0 };
  leads.forEach((l) => {
    const s = (l.status || 'new').toLowerCase().replace(/\s+/g, '_');
    leadStatuses[s] = (leadStatuses[s] || 0) + 1;
  });

  // 4. Tasks & Delegations
  let tasks = [];
  try {
    const raw = localStorage.getItem('corporate_system_tasks');
    if (raw) tasks = JSON.parse(raw);
  } catch (err) {
    tasks = [];
  }
  const myTasks = currentUser
    ? tasks.filter((t) => t.assigned_to === currentUser.id || t.assigned_to_name === currentUser.name)
    : tasks;
  const pendingTasks = myTasks.filter((t) => t.status !== 'completed');
  const overdueTasks = pendingTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date());

  // 5. WhatsApp
  const chats = getWhatsAppChats() || [];
  const unreadChats = chats.filter((c) => (c.unreadCount || 0) > 0);
  const openChats = chats.filter((c) => c.status !== 'closed');

  // 6. HR
  const employees = getHRData(HR_KEYS.EMPLOYEES, []);
  const hrIndents = getHRData(HR_KEYS.INDENTS, []);
  const hrLeaves = getHRData(HR_KEYS.LEAVES, []);

  // 7. Petty
  const pettyTxns = getPettyData(PETTY_KEYS.TRANSACTIONS, []);
  const totalPettyIn = pettyTxns.filter((t) => t.type === 'in').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalPettyOut = pettyTxns.filter((t) => t.type === 'out').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const pettyBalance = totalPettyIn - totalPettyOut;

  return {
    purchase: {
      total: indents.length,
      stages: purchaseStages,
      pendingGRN: purchaseStages['GRN'] || 0,
      pendingQC: purchaseStages['Quality Check'] || 0,
      pendingPO: purchaseStages['PO'] || 0,
      pendingApproval: purchaseStages['Indent Approval'] || 0,
      recent: indents.slice(0, 5)
    },
    sales: {
      total: orders.length,
      stages: salesStages,
      readyDispatch: salesStages['Ready For Dispatch'] || salesStages['Ready for Dispatch'] || 0,
      inQC: salesStages['Quality Check'] || salesStages['QC'] || 0,
      delivered: salesStages['Delivered'] || 0,
      recent: orders.slice(0, 5)
    },
    leads: {
      total: leads.length,
      statuses: leadStatuses,
      quotationsCount: quotations.length,
      recent: leads.slice(0, 5)
    },
    tasks: {
      total: tasks.length,
      myTotal: myTasks.length,
      pending: pendingTasks.length,
      overdue: overdueTasks.length,
      overdueItems: overdueTasks.slice(0, 3)
    },
    whatsapp: {
      totalChats: chats.length,
      openChats: openChats.length,
      unreadCount: unreadChats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
    },
    hr: {
      activeEmployees: employees.filter((e) => e.status !== 'inactive').length,
      pendingLeaves: hrLeaves.filter((l) => l.status === 'pending').length,
      pendingIndents: hrIndents.filter((i) => i.status === 'pending').length
    },
    petty: {
      balance: pettyBalance,
      totalIn: totalPettyIn,
      totalOut: totalPettyOut
    },
    inventory: getInventoryMetrics()
  };
}

// Search across all entities by keyword or identifier
export function searchEntities(keyword) {
  if (!keyword || keyword.trim().length < 2) return null;
  const q = keyword.trim().toLowerCase();

  const results = {
    indents: [],
    orders: [],
    leads: [],
    tasks: []
  };

  // Search Indents
  const indents = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
  results.indents = indents
    .filter(
      (i) =>
        i.indentNumber?.toLowerCase().includes(q) ||
        i.poNumber?.toLowerCase().includes(q) ||
        i.grnNumber?.toLowerCase().includes(q) ||
        i.materialDescription?.toLowerCase().includes(q) ||
        i.preferredVendor?.toLowerCase().includes(q) ||
        i.currentStage?.toLowerCase().includes(q)
    )
    .slice(0, 4);

  // Search Orders
  const orders = getData(STORAGE_KEYS.ORDERS, []);
  results.orders = orders
    .filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.productName?.toLowerCase().includes(q) ||
        o.currentStage?.toLowerCase().includes(q)
    )
    .slice(0, 4);

  // Search Leads
  const leads = getData(LTO_KEYS.LEADS, []);
  results.leads = leads
    .filter(
      (l) =>
        l.leadId?.toLowerCase().includes(q) ||
        l.leadName?.toLowerCase().includes(q) ||
        l.companyName?.toLowerCase().includes(q) ||
        l.contactPerson?.toLowerCase().includes(q)
    )
    .slice(0, 4);

  // Search Inventory Items
  const invItems = getInventoryItems();
  results.inventory = invItems
    .filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        item.hsnCode?.toLowerCase().includes(q)
    )
    .slice(0, 4);

  const hasAny =
    results.indents.length > 0 ||
    results.orders.length > 0 ||
    results.leads.length > 0 ||
    results.inventory.length > 0;

  return hasAny ? results : null;
}

// Generate intelligent contextual response
export function generateAgentResponse(userQuery, context = {}) {
  const { _currentPath = '/', currentUser = null } = context;
  const q = (userQuery || '').trim().toLowerCase();
  const snapshot = getSystemSnapshot(currentUser);

  // Check direct navigation triggers
  const navMap = [
    { triggers: ['grn', 'goods receipt'], path: '/purchase/grn', name: 'GRN Page' },
    { triggers: ['purchase qc', 'purchase quality'], path: '/purchase/qc', name: 'Purchase QC' },
    { triggers: ['purchase indent', 'indent list', 'indent page'], path: '/purchase/indent', name: 'Purchase Indents' },
    { triggers: ['purchase po', 'purchase order page', 'po page'], path: '/purchase/po', name: 'Purchase Orders (PO)' },
    { triggers: ['purchase payment'], path: '/purchase/payment', name: 'Purchase Payments' },
    { triggers: ['material lifting', 'lifting dispatch'], path: '/purchase/lifting-dispatch', name: 'Material Lifting' },
    { triggers: ['material receiving'], path: '/purchase/receiving', name: 'Material Receiving' },
    { triggers: ['sales order', 'otd orders', 'sales page'], path: '/sales/orders', name: 'Sales Orders' },
    { triggers: ['new order', 'create order'], path: '/sales/new-order', name: 'New Sales Order' },
    { triggers: ['dispatch page', 'ready dispatch'], path: '/sales/ready-dispatch', name: 'Ready for Dispatch' },
    { triggers: ['lead page', 'leads list', 'leads management'], path: '/lead-to-orders/leads', name: 'Leads Management' },
    { triggers: ['quotation', 'quotes'], path: '/lead-to-orders/quotation', name: 'Quotations' },
    { triggers: ['my task', 'my tasks'], path: '/my-tasks', name: 'My Tasks' },
    { triggers: ['task assignment', 'assign task'], path: '/task-assignment', name: 'Task Assignment' },
    { triggers: ['whatsapp', 'wa inbox', 'chat inbox'], path: '/whatsapp/inbox', name: 'WhatsApp Inbox' },
    { triggers: ['hr dashboard', 'hr employees'], path: '/hr/active-employees', name: 'HR Active Employees' },
    { triggers: ['petty', 'expenses'], path: '/petty-expenses/dashboard', name: 'Petty Expenses' },
    { triggers: ['inventory', 'stock dashboard', 'inventory dashboard'], path: '/inventory/dashboard', name: 'Inventory Dashboard' },
    { triggers: ['stock items', 'sku catalog', 'item list'], path: '/inventory/items', name: 'Stock Items Catalog' },
    { triggers: ['stock inward', 'material inward'], path: '/inventory/inward', name: 'Stock Inward' },
    { triggers: ['stock outward', 'material outward'], path: '/inventory/outward', name: 'Stock Outward' },
    { triggers: ['low stock', 'reorder alerts'], path: '/inventory/alerts', name: 'Low Stock Alerts' },
    { triggers: ['warehouses', 'depots'], path: '/inventory/warehouses', name: 'Warehouses Master' },
    { triggers: ['mis', 'summary report'], path: '/mis-summary', name: 'MIS Summary' }
  ];

  const wantsNavigation =
    q.includes('go to') ||
    q.includes('open') ||
    q.includes('navigate') ||
    q.includes('le chalo') ||
    q.includes('kholo') ||
    q.includes('dikhao page');

  if (wantsNavigation) {
    for (const item of navMap) {
      if (item.triggers.some((t) => q.includes(t))) {
        return {
          text: `Sure! Main aapko **${item.name}** par lekar chal raha hoon. Aap neeche diye button par click kar sakte hain ya auto-redirect le sakte hain:`,
          actions: [{ label: `Go to ${item.name}`, path: item.path, primary: true }],
          navigateTo: item.path
        };
      }
    }
  }

  // Check ID search (IND-XXXX, PO-XXXX, ORD-XXXX, LD-XXXX, GRN-XXXX)
  const idRegex = /(ind-\d+|po-\d+|grn-\d+|ord-\d+|ld-\d+|flw-\d+|qt-\d+)/i;
  const idMatch = q.match(idRegex);
  if (idMatch) {
    const searchId = idMatch[0].toUpperCase();
    const searchRes = searchEntities(searchId);
    if (searchRes) {
      let detailsText = `🔎 **Search Result for "${searchId}":**\n\n`;
      const actions = [];

      if (searchRes.indents.length > 0) {
        searchRes.indents.forEach((i) => {
          detailsText += `• **Purchase Indent:** \`${i.indentNumber}\`\n  - Item: *${i.materialDescription || 'N/A'}*\n  - Stage: **${i.currentStage || 'Purchase Indent'}**\n  - Vendor: ${i.preferredVendor || 'N/A'}\n  - PO: \`${i.poNumber || 'Not created'}\` | GRN: \`${i.grnNumber || 'Pending'}\`\n\n`;
        });
        actions.push({ label: 'View in Purchase System', path: '/purchase/indent' });
      }

      if (searchRes.orders.length > 0) {
        searchRes.orders.forEach((o) => {
          detailsText += `• **Sales Order:** \`${o.orderNumber}\`\n  - Customer: *${o.customerName || 'N/A'}*\n  - Product: ${o.productName || 'N/A'}\n  - Stage: **${o.currentStage || o.stage || 'New Order'}**\n  - Amount: ₹${Number(o.totalAmount || 0).toLocaleString('en-IN')}\n\n`;
        });
        actions.push({ label: 'View in Sales Orders', path: '/sales/orders' });
      }

      if (searchRes.leads.length > 0) {
        searchRes.leads.forEach((l) => {
          detailsText += `• **Lead Record:** \`${l.leadId}\`\n  - Contact: *${l.leadName || l.contactPerson}*\n  - Company: ${l.companyName || 'N/A'}\n  - Status: **${l.status || 'Active'}**\n\n`;
        });
        actions.push({ label: 'View in Leads', path: '/lead-to-orders/leads' });
      }

      return { text: detailsText, actions };
    }
  }

  // 1. Purchase Queries (GRN, QC, Indent, PO, Purchase status)
  if (
    q.includes('purchase') ||
    q.includes('grn') ||
    q.includes('indent') ||
    q.includes('po') ||
    q.includes('lifting') ||
    q.includes('vendor')
  ) {
    const p = snapshot.purchase;
    let text = `📦 **Purchase System Real-Time Status:**\n\n`;
    text += `• **Total Indents in System:** ${p.total}\n`;
    text += `• **Pending Indent Approval:** ${p.pendingApproval}\n`;
    text += `• **Pending Purchase Orders (PO):** ${p.pendingPO}\n`;
    text += `• **Material In Quality Check (QC):** ${p.pendingQC}\n`;
    text += `• **Pending GRN (Goods Receipt Note):** ${p.pendingGRN}\n\n`;

    if (p.recent.length > 0) {
      text += `📋 **Recent Indents:**\n`;
      p.recent.forEach((item) => {
        text += `- \`${item.indentNumber}\`: ${item.materialDescription || 'General Material'} → *${item.currentStage || 'Purchase Indent'}*\n`;
      });
      text += `\n`;
    }

    if (q.includes('how') || q.includes('kaise') || q.includes('process') || q.includes('workflow')) {
      text += `💡 **Purchase 9-Stage Flow:**\n1. Indent Creation → 2. Approval → 3. PO Issuance → 4. Lifting/Dispatch → 5. Delivery → 6. Receiving → 7. QC Inspection → 8. GRN Generation → 9. Accounts Payment.\n`;
    }

    return {
      text,
      actions: [
        { label: 'Open GRN Page', path: '/purchase/grn' },
        { label: 'Purchase QC', path: '/purchase/qc' },
        { label: 'View All Indents', path: '/purchase/indent' }
      ]
    };
  }

  // Inventory Queries
  if (
    q.includes('inventory') ||
    q.includes('stock') ||
    q.includes('warehouse') ||
    q.includes('godown') ||
    q.includes('sku') ||
    q.includes('inward') ||
    q.includes('outward')
  ) {
    const inv = snapshot.inventory;
    let text = `📦 **Inventory & Warehouse System Live Status:**\n\n`;
    text += `• **Total Managed SKUs:** ${inv.totalSKUs} Items\n`;
    text += `• **Total Inventory Capital Valuation:** ₹${inv.totalValuation.toLocaleString('en-IN')}\n`;
    text += `• **Healthy Stock Items:** ${inv.inStockCount} items\n`;
    text += `• **Low Stock / Reorder Trigger:** ${inv.lowStockCount} items\n`;
    text += `• **Out of Stock Items:** ${inv.outOfStockCount > 0 ? `⚠️ ${inv.outOfStockCount} zero stock items!` : '✅ None'}\n\n`;

    if (inv.lowStockItems && inv.lowStockItems.length > 0) {
      text += `🚨 **Items Needing Replenishment:**\n`;
      inv.lowStockItems.slice(0, 3).forEach((item) => {
        text += `- **${item.name}**: Stock is ${item.currentStock} ${item.unit} (Min: ${item.minStock})\n`;
      });
      text += `\n`;
    }

    return {
      text,
      actions: [
        { label: 'Inventory Dashboard', path: '/inventory/dashboard' },
        { label: 'Stock Items / SKU', path: '/inventory/items' },
        { label: 'Stock Inward (GRN)', path: '/inventory/inward' },
        { label: 'Low Stock Alerts', path: '/inventory/alerts' }
      ]
    };
  }

  // 2. Sales / OTD Queries
  if (
    q.includes('sale') ||
    q.includes('order') ||
    q.includes('dispatch') ||
    q.includes('delivery') ||
    q.includes('customer')
  ) {
    const s = snapshot.sales;
    let text = `🚀 **Sales & Order to Delivery (OTD) Status:**\n\n`;
    text += `• **Total Active Orders:** ${s.total}\n`;
    text += `• **Ready for Dispatch:** ${s.readyDispatch} orders\n`;
    text += `• **Currently in Quality Check:** ${s.inQC} orders\n`;
    text += `• **Successfully Delivered:** ${s.delivered} orders\n\n`;

    if (s.recent.length > 0) {
      text += `📦 **Recent Orders:**\n`;
      s.recent.forEach((ord) => {
        text += `- \`${ord.orderNumber}\` (${ord.customerName || 'Client'}): Stage → *${ord.currentStage || ord.stage || 'New'}*\n`;
      });
    }

    return {
      text,
      actions: [
        { label: 'View Sales Orders', path: '/sales/orders' },
        { label: 'Ready for Dispatch', path: '/sales/ready-dispatch' },
        { label: 'Sales Dashboard', path: '/sales/dashboard' }
      ]
    };
  }

  // 3. Lead to Orders Queries
  if (
    q.includes('lead') ||
    q.includes('quotation') ||
    q.includes('quote') ||
    q.includes('negotiation') ||
    q.includes('deal')
  ) {
    const l = snapshot.leads;
    let text = `🎯 **Lead to Orders Pipeline Overview:**\n\n`;
    text += `• **Total Active Leads:** ${l.total}\n`;
    text += `• **New Leads:** ${l.statuses.new || 0}\n`;
    text += `• **In Progress / Follow-Up:** ${l.statuses.in_progress || 0}\n`;
    text += `• **Quotations Prepared:** ${l.quotationsCount}\n`;
    text += `• **Won / Converted:** ${l.statuses.won || 0}\n\n`;

    if (l.recent.length > 0) {
      text += `👥 **Recent Leads:**\n`;
      l.recent.forEach((ld) => {
        text += `- \`${ld.leadId}\`: ${ld.leadName || ld.contactPerson} (${ld.companyName || 'Retail'}) - *${ld.status || 'Active'}*\n`;
      });
    }

    return {
      text,
      actions: [
        { label: 'Open Leads Management', path: '/lead-to-orders/leads' },
        { label: 'View Quotations', path: '/lead-to-orders/quotation' },
        { label: 'Lead Dashboard', path: '/lead-to-orders/dashboard' }
      ]
    };
  }

  // 4. Tasks & Delegations Queries
  if (
    q.includes('task') ||
    q.includes('checklist') ||
    q.includes('delegation') ||
    q.includes('todo') ||
    q.includes('kaam')
  ) {
    const t = snapshot.tasks;
    let text = `📋 **Tasks & Checklist Status:**\n\n`;
    text += `• **My Assigned Tasks:** ${t.myTotal}\n`;
    text += `• **Pending Tasks:** ${t.pending}\n`;
    text += `• **Overdue Alerts:** ${t.overdue > 0 ? `⚠️ ${t.overdue} tasks overdue!` : '✅ Zero overdue tasks'}\n`;
    text += `• **Total System Tasks:** ${t.total}\n\n`;

    if (t.overdueItems.length > 0) {
      text += `🚨 **Urgent Overdue Tasks:**\n`;
      t.overdueItems.forEach((item) => {
        text += `- **${item.title || item.task_name}** (Due: ${item.due_date || 'Overdue'})\n`;
      });
    }

    return {
      text,
      actions: [
        { label: 'Open My Tasks', path: '/my-tasks' },
        { label: 'Task Assignment', path: '/task-assignment' },
        { label: 'Checklist List', path: '/checklist/list' }
      ]
    };
  }

  // 5. WhatsApp Queries
  if (
    q.includes('whatsapp') ||
    q.includes('message') ||
    q.includes('wa') ||
    q.includes('inbox')
  ) {
    const wa = snapshot.whatsapp;
    let text = `💬 **WhatsApp Business Inbox Status:**\n\n`;
    text += `• **Total Conversations:** ${wa.totalChats}\n`;
    text += `• **Active Open Chats:** ${wa.openChats}\n`;
    text += `• **Unread Messages:** ${wa.unreadCount > 0 ? `🔥 ${wa.unreadCount} unread!` : '✨ All read'}\n\n`;
    text += `Aap WhatsApp Inbox me jaakar customer chat manage aur direct templates send kar sakte hain.`;

    return {
      text,
      actions: [
        { label: 'Open WhatsApp Inbox', path: '/whatsapp/inbox' },
        { label: 'Message Templates', path: '/whatsapp/templates' }
      ]
    };
  }

  // 6. Overall MIS / Summary Queries
  if (
    q.includes('summary') ||
    q.includes('overview') ||
    q.includes('mis') ||
    q.includes('report') ||
    q.includes('sab batao') ||
    q.includes('status')
  ) {
    let text = `✨ **ERP Multi-System Executive Summary:**\n\n`;
    text += `📦 **Purchase System:** ${snapshot.purchase.total} Indents | ${snapshot.purchase.pendingGRN} Pending GRN | ${snapshot.purchase.pendingQC} in QC\n`;
    text += `🚀 **Sales & OTD:** ${snapshot.sales.total} Orders | ${snapshot.sales.readyDispatch} Ready for Dispatch\n`;
    text += `🎯 **Leads:** ${snapshot.leads.total} Leads | ${snapshot.leads.quotationsCount} Quotations\n`;
    text += `📋 **Tasks:** ${snapshot.tasks.pending} Pending | ${snapshot.tasks.overdue} Overdue\n`;
    text += `💬 **WhatsApp:** ${snapshot.whatsapp.unreadCount} Unread customer chats\n`;
    text += `👥 **HR Active Staff:** ${snapshot.hr.activeEmployees} employees\n`;
    text += `💵 **Petty Cash Balance:** ₹${snapshot.petty.balance.toLocaleString('en-IN')}\n\n`;
    text += `Aap kisi bhi module ke baare me detail me pooch sakte hain ya direct navigate kar sakte hain!`;

    return {
      text,
      actions: [
        { label: 'MIS Summary', path: '/mis-summary' },
        { label: 'Sales Dashboard', path: '/sales/dashboard' },
        { label: 'Purchase Indents', path: '/purchase/indent' }
      ]
    };
  }

  // 7. General Greetings / Help / Capabilities
  if (
    q.includes('hi') ||
    q.includes('hello') ||
    q.includes('hey') ||
    q.includes('kaun ho') ||
    q.includes('who are you') ||
    q.includes('help') ||
    q.includes('kya kar sakte ho')
  ) {
    const userName = currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : '';
    const text = `👋 **Namaste${userName}! Main aapka ERP AI Chat Agent hoon.**\n\nMain aapke pure Enterprise Multi System App ka live data monitor karta hoon aur in cheezon me madad kar sakta hoon:\n\n` +
      `• **📦 Purchase System:** Indent count, Pending PO, QC status, aur GRN updates.\n` +
      `• **🚀 Sales (OTD):** Order lifecycle stages, Dispatch status, delayed orders.\n` +
      `• **🎯 Lead to Orders:** Active leads, pending quotations, conversions.\n` +
      `• **📋 Tasks & Delegations:** My tasks, overdue alerts, team assignments.\n` +
      `• **💬 WhatsApp Inbox:** Customer unread chats aur communications.\n` +
      `• **🔍 Instant Search:** Kisi bhi ID jaise \`IND-0101\`, \`ORD-1002\`, \`LD-1001\` ka live status.\n` +
      `• **🧭 Fast Navigation:** Kisi bhi page par 1 click me redirect karna.\n\n` +
      `*Aap mujhse Hindi, Hinglish ya English me kuch bhi pooch sakte hain!*`;

    return {
      text,
      actions: [
        { label: 'Check GRN Status', path: '/purchase/grn' },
        { label: 'View My Tasks', path: '/my-tasks' },
        { label: 'Overall Summary', path: '/mis-summary' }
      ]
    };
  }

  // Fallback with smart recommendation
  return {
    text: `Samajh gaya! Aapne poocha: *"${userQuery}"*.\n\nMain is query ko verify kar raha hoon. Aap neeche diye quick options me se select kar sakte hain ya exact Order/Indent ID (\`IND-XXXX\`, \`ORD-XXXX\`) likh kar live status check kar sakte hain:`,
    actions: [
      { label: 'Purchase & GRN Status', path: '/purchase/grn' },
      { label: 'Sales Orders Pipeline', path: '/sales/orders' },
      { label: 'My Pending Tasks', path: '/my-tasks' },
      { label: 'Full System Summary', path: '/mis-summary' }
    ]
  };
}
