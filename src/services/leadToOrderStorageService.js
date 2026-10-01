/**
 * Lead to Order (LTO) Storage & Flow Management Service
 * Pure LocalStorage driven implementation with cross-module event dispatching.
 */

import {
  STORAGE_KEYS as OTD_KEYS,
  getData,
  setData,
  generateId,
  generateOrderNumber,
  getTATConfigForStage,
  calculatePlannedDate,
  logAuditAction,
  getCurrentUser
} from './otdStorageService';

export { getData, setData };

// Storage keys for Lead to Order system
export const LTO_KEYS = {
  LEADS: 'lto_leads',
  FOLLOW_UPS: 'lto_follow_ups',
  QUOTATIONS: 'lto_quotations',
  NEGOTIATIONS: 'lto_negotiations',
  APPROVALS: 'lto_approvals',
  LEAD_COUNTER: 'lto_lead_counter',
  QUOTATION_COUNTER: 'lto_quotation_counter',
  FOLLOWUP_COUNTER: 'lto_followup_counter',
  NEGOTIATION_COUNTER: 'lto_negotiation_counter',
  APPROVAL_COUNTER: 'lto_approval_counter',
  SEEDED: 'lto_seeded_v1'
};

// Dispatch storage update for Lead to Order
export function notifyLTOUpdate(key = 'ALL') {
  window.dispatchEvent(new CustomEvent('lead_storage_update', { detail: { key } }));
}

// Sequential ID Generators
export function generateLeadId() {
  const counter = parseInt(localStorage.getItem(LTO_KEYS.LEAD_COUNTER) || '1000', 10) + 1;
  localStorage.setItem(LTO_KEYS.LEAD_COUNTER, counter.toString());
  return `LD-${counter.toString().padStart(4, '0')}`;
}

export function generateQuotationNumber() {
  const counter = parseInt(localStorage.getItem(LTO_KEYS.QUOTATION_COUNTER) || '100', 10) + 1;
  localStorage.setItem(LTO_KEYS.QUOTATION_COUNTER, counter.toString());
  return `QT-${counter.toString().padStart(4, '0')}`;
}

export function generateFollowUpId() {
  const counter = parseInt(localStorage.getItem(LTO_KEYS.FOLLOWUP_COUNTER) || '500', 10) + 1;
  localStorage.setItem(LTO_KEYS.FOLLOWUP_COUNTER, counter.toString());
  return `FLW-${counter.toString().padStart(4, '0')}`;
}

export function generateNegotiationId() {
  const counter = parseInt(localStorage.getItem(LTO_KEYS.NEGOTIATION_COUNTER) || '300', 10) + 1;
  localStorage.setItem(LTO_KEYS.NEGOTIATION_COUNTER, counter.toString());
  return `NEG-${counter.toString().padStart(4, '0')}`;
}

export function generateApprovalId() {
  const counter = parseInt(localStorage.getItem(LTO_KEYS.APPROVAL_COUNTER) || '200', 10) + 1;
  localStorage.setItem(LTO_KEYS.APPROVAL_COUNTER, counter.toString());
  return `APP-${counter.toString().padStart(4, '0')}`;
}

// Stage Definitions
export const LEAD_STAGES = [
  'Lead Creation',
  'Lead Verification',
  'Follow-up / Enquiry',
  'Quotation',
  'Negotiation',
  'Approval',
  'Approved',
  'Order to Delivery'
];

export const LEAD_STATUS_OPTIONS = [
  'New',
  'Verification Pending',
  'Verified',
  'Follow-up / Enquiry',
  'Quotation',
  'Negotiation',
  'Approval Pending',
  'Approved',
  'Converted to Order',
  'Rejected',
  'Lost',
  'Closed',
  'Hold'
];

export const DEAL_LOSS_REASONS = [
  'High Price / Budget Issue',
  'Competitor Won',
  'Delivery Delay / Long Lead Time',
  'Product Specifications / Quality Mismatch',
  'Project Cancelled / Deferred',
  'Payment Terms Dispute',
  'Lack of Follow-up / Response',
  'Other'
];

// Clean initial data arrays (Desktop Local & Supabase Ready)
export const DEFAULT_LEADS = [];
export const DEFAULT_FOLLOW_UPS = [];
export const DEFAULT_QUOTATIONS = [];
export const DEFAULT_NEGOTIATIONS = [];
export const DEFAULT_APPROVALS = [];

// Initialize Clean Local Data
export function initLTOData() {
  const isSeeded = localStorage.getItem(LTO_KEYS.SEEDED);
  if (!isSeeded) {
    if (!localStorage.getItem(LTO_KEYS.LEADS)) {
      setData(LTO_KEYS.LEADS, []);
    }
    if (!localStorage.getItem(LTO_KEYS.FOLLOW_UPS)) {
      setData(LTO_KEYS.FOLLOW_UPS, []);
    }
    if (!localStorage.getItem(LTO_KEYS.QUOTATIONS)) {
      setData(LTO_KEYS.QUOTATIONS, []);
    }
    if (!localStorage.getItem(LTO_KEYS.NEGOTIATIONS)) {
      setData(LTO_KEYS.NEGOTIATIONS, []);
    }
    if (!localStorage.getItem(LTO_KEYS.APPROVALS)) {
      setData(LTO_KEYS.APPROVALS, []);
    }
    localStorage.setItem(LTO_KEYS.SEEDED, 'true');
    notifyLTOUpdate();
  }
}

// Ensure seeded on module load
initLTOData();

// Leads CRUD & Transition APIs
export function getLeads() {
  return getData(LTO_KEYS.LEADS, DEFAULT_LEADS);
}

export function saveLead(leadData) {
  const leads = getLeads();
  const nowStr = new Date().toISOString();
  
  const leadId = leadData.leadId || generateLeadId();
  const newLead = {
    ...leadData,
    id: leadData.id || `lead-${Date.now()}`,
    leadId,
    status: leadData.status || 'New',
    currentStage: leadData.currentStage || 'Lead Verification',
    createdAt: leadData.createdAt || nowStr,
    updatedAt: nowStr
  };

  const updated = [newLead, ...leads];
  setData(LTO_KEYS.LEADS, updated);
  notifyLTOUpdate(LTO_KEYS.LEADS);

  logAuditAction('Lead Created', 'Lead to Orders', newLead.leadId, {
    customer: newLead.customerName,
    product: newLead.productService,
    priority: newLead.priority
  });

  return newLead;
}

export function updateLead(leadIdOrId, updates) {
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === leadIdOrId || l.leadId === leadIdOrId);
  if (idx === -1) return null;

  const nowStr = new Date().toISOString();
  const updatedLead = {
    ...leads[idx],
    ...updates,
    updatedAt: nowStr
  };

  leads[idx] = updatedLead;
  setData(LTO_KEYS.LEADS, leads);
  notifyLTOUpdate(LTO_KEYS.LEADS);

  logAuditAction('Lead Updated', 'Lead to Orders', updatedLead.leadId, updates);
  return updatedLead;
}

export function deleteLead(leadIdOrId) {
  const leads = getLeads();
  const filtered = leads.filter(l => l.id !== leadIdOrId && l.leadId !== leadIdOrId);
  setData(LTO_KEYS.LEADS, filtered);
  notifyLTOUpdate(LTO_KEYS.LEADS);
  return true;
}

// Follow-ups API (Multiple records per Lead ID, complete history maintained)
export function getFollowUps(leadId = null) {
  const list = getData(LTO_KEYS.FOLLOW_UPS, DEFAULT_FOLLOW_UPS);
  if (!leadId) return list;
  return list.filter(f => f.leadId === leadId);
}

export function addFollowUp(followUpData) {
  const followUps = getData(LTO_KEYS.FOLLOW_UPS, DEFAULT_FOLLOW_UPS);
  const nowStr = new Date().toISOString();
  const followUpId = followUpData.followUpId || generateFollowUpId();

  const newEntry = {
    ...followUpData,
    id: followUpId,
    followUpId,
    createdAt: nowStr
  };

  const updated = [newEntry, ...followUps];
  setData(LTO_KEYS.FOLLOW_UPS, updated);
  notifyLTOUpdate(LTO_KEYS.FOLLOW_UPS);

  // Update lead's stage/status if nextAction indicates progress
  if (newEntry.leadId) {
    let nextStageUpdates = {
      status: 'Follow-up / Enquiry',
      currentStage: 'Follow-up / Enquiry'
    };
    if (newEntry.nextAction === 'Send Quotation') {
      nextStageUpdates.status = 'Quotation';
      nextStageUpdates.currentStage = 'Quotation';
    } else if (newEntry.nextAction === 'Negotiation') {
      nextStageUpdates.status = 'Negotiation';
      nextStageUpdates.currentStage = 'Negotiation';
    }
    updateLead(newEntry.leadId, nextStageUpdates);
  }

  logAuditAction('Follow-up Logged', 'Lead to Orders', newEntry.leadId, {
    followUpId: newEntry.followUpId,
    mode: newEntry.followUpMode,
    nextAction: newEntry.nextAction
  });

  return newEntry;
}

// Quotations API
export function getQuotations(leadId = null) {
  const list = getData(LTO_KEYS.QUOTATIONS, DEFAULT_QUOTATIONS);
  if (!leadId) return list;
  return list.filter(q => q.leadId === leadId);
}

export function saveQuotation(quotationData) {
  const quotations = getData(LTO_KEYS.QUOTATIONS, DEFAULT_QUOTATIONS);
  const nowStr = new Date().toISOString();
  const quotationNo = quotationData.quotationNo || generateQuotationNumber();

  const existingIdx = quotations.findIndex(q => q.quotationNo === quotationNo);
  let savedQuotation;

  if (existingIdx >= 0) {
    savedQuotation = {
      ...quotations[existingIdx],
      ...quotationData,
      updatedAt: nowStr
    };
    quotations[existingIdx] = savedQuotation;
  } else {
    savedQuotation = {
      ...quotationData,
      id: quotationNo,
      quotationNo,
      createdAt: nowStr,
      updatedAt: nowStr
    };
    quotations.unshift(savedQuotation);
  }

  setData(LTO_KEYS.QUOTATIONS, quotations);
  notifyLTOUpdate(LTO_KEYS.QUOTATIONS);

  // Link quotationNo to lead & update lead stage
  if (savedQuotation.leadId) {
    updateLead(savedQuotation.leadId, {
      quotationNo: savedQuotation.quotationNo,
      status: savedQuotation.status === 'Submitted for Approval' ? 'Approval Pending' : 
              savedQuotation.status === 'Under Negotiation' ? 'Negotiation' : 'Quotation',
      currentStage: savedQuotation.status === 'Submitted for Approval' ? 'Approval' : 
                    savedQuotation.status === 'Under Negotiation' ? 'Negotiation' : 'Quotation'
    });
  }

  logAuditAction('Quotation Saved', 'Lead to Orders', savedQuotation.quotationNo, {
    leadId: savedQuotation.leadId,
    amount: savedQuotation.grandTotal,
    status: savedQuotation.status
  });

  return savedQuotation;
}

// Negotiations API (Multiple negotiation records per Lead/Quotation, complete history)
export function getNegotiations(leadId = null) {
  const list = getData(LTO_KEYS.NEGOTIATIONS, DEFAULT_NEGOTIATIONS);
  if (!leadId) return list;
  return list.filter(n => n.leadId === leadId);
}

export function addNegotiation(negotiationData) {
  const negotiations = getData(LTO_KEYS.NEGOTIATIONS, DEFAULT_NEGOTIATIONS);
  const nowStr = new Date().toISOString();
  const negotiationId = negotiationData.negotiationId || generateNegotiationId();

  const newEntry = {
    ...negotiationData,
    id: negotiationId,
    negotiationId,
    createdAt: nowStr
  };

  const updated = [newEntry, ...negotiations];
  setData(LTO_KEYS.NEGOTIATIONS, updated);
  notifyLTOUpdate(LTO_KEYS.NEGOTIATIONS);

  // If negotiation is accepted, advance lead to Approval stage
  if (newEntry.status === 'Accepted' && newEntry.leadId) {
    updateLead(newEntry.leadId, {
      status: 'Approval Pending',
      currentStage: 'Approval'
    });

    // Auto-create or update Approval record
    const approvals = getApprovals();
    const existingApp = approvals.find(a => a.leadId === newEntry.leadId);
    if (!existingApp) {
      saveApproval({
        leadId: newEntry.leadId,
        quotationNo: newEntry.quotationNo,
        customer: newEntry.customerName || 'Valued Customer',
        quotationAmount: newEntry.revisedPrice || newEntry.companyOfferedPrice || 0,
        discount: `${newEntry.discount || 0}%`,
        submittedBy: newEntry.negotiatedBy || getCurrentUser()?.name || 'Sales Officer',
        submittedDate: new Date().toISOString().split('T')[0],
        approvalStatus: 'Pending',
        approvalRemarks: `Agreed during negotiation #${newEntry.negotiationId}. Expected price: ₹ ${newEntry.customerExpectedPrice}, Revised: ₹ ${newEntry.revisedPrice}.`
      });
    }
  }

  logAuditAction('Negotiation Logged', 'Lead to Orders', newEntry.negotiationId, {
    leadId: newEntry.leadId,
    revisedPrice: newEntry.revisedPrice,
    status: newEntry.status
  });

  return newEntry;
}

// Approvals API
export function getApprovals() {
  return getData(LTO_KEYS.APPROVALS, DEFAULT_APPROVALS);
}

export function saveApproval(approvalData) {
  const approvals = getApprovals();
  const nowStr = new Date().toISOString();
  const approvalId = approvalData.approvalId || generateApprovalId();

  const existingIdx = approvals.findIndex(a => a.approvalId === approvalId);
  let savedApproval;

  if (existingIdx >= 0) {
    savedApproval = {
      ...approvals[existingIdx],
      ...approvalData,
      updatedAt: nowStr
    };
    approvals[existingIdx] = savedApproval;
  } else {
    savedApproval = {
      ...approvalData,
      id: approvalId,
      approvalId,
      approvalStatus: approvalData.approvalStatus || 'Pending',
      createdAt: nowStr,
      updatedAt: nowStr
    };
    approvals.unshift(savedApproval);
  }

  setData(LTO_KEYS.APPROVALS, approvals);
  notifyLTOUpdate(LTO_KEYS.APPROVALS);

  // Link approval ID to lead
  if (savedApproval.leadId) {
    updateLead(savedApproval.leadId, {
      approvalId: savedApproval.approvalId,
      status: savedApproval.approvalStatus === 'Approved' ? 'Approved' : 'Approval Pending',
      currentStage: savedApproval.approvalStatus === 'Approved' ? 'Order to Delivery' : 'Approval'
    });
  }

  return savedApproval;
}

// =========================================================================
// CRITICAL INTEGRATION: CONVERT APPROVED LEAD/QUOTATION INTO ORDER TO DELIVERY
// =========================================================================
export function convertApprovalToOrderToDelivery(approvalId, approvedBy = '', remarks = '') {
  const approvals = getApprovals();
  const appIdx = approvals.findIndex(a => a.approvalId === approvalId || a.id === approvalId);
  if (appIdx === -1) return { success: false, message: 'Approval record not found' };

  const approval = approvals[appIdx];
  const leads = getLeads();
  const lead = leads.find(l => l.leadId === approval.leadId || l.id === approval.leadId);
  const quotations = getQuotations();
  const quotation = quotations.find(q => q.quotationNo === approval.quotationNo || q.leadId === approval.leadId);

  const nowStr = new Date().toISOString();
  const todayDateStr = nowStr.split('T')[0];

  // Generate unique sequential order number ORD-0001, ORD-0002... from OTD system
  const orderNumber = generateOrderNumber();

  // 1. Prepare items array for Order to Delivery
  const orderItems = quotation?.items?.map((item, idx) => ({
    id: generateId('ITEM'),
    productId: `PRD-${100 + idx}`,
    productCode: `PRD-${100 + idx}`,
    productName: item.productService,
    description: item.description || '',
    quantity: parseFloat(item.quantity) || 1,
    unit: item.unit || 'Pcs',
    rate: parseFloat(item.rate) || 0,
    discount: parseFloat(item.discount) || 0,
    gstPercent: parseFloat(item.taxPercent) || 18,
    amount: parseFloat(item.total) || 0
  })) || [
    {
      id: generateId('ITEM'),
      productId: 'PRD-101',
      productCode: 'PRD-101',
      productName: lead?.productService || 'Custom Product / Service',
      description: lead?.initialRequirement || 'Supplied as per approved quotation',
      quantity: parseFloat(lead?.expectedQuantity) || 1,
      unit: 'Pcs',
      rate: approval.quotationAmount || 100000,
      discount: 0,
      gstPercent: 18,
      amount: approval.quotationAmount || 100000
    }
  ];

  // 2. Prepare Customer Details for OTD
  const customerDetails = {
    code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    name: lead?.customerName || approval.customer || 'Valued Customer',
    type: lead?.customerType || 'Corporate',
    contactPerson: lead?.contactPerson || '',
    mobile: lead?.mobile || '',
    email: lead?.email || '',
    billingAddress: quotation?.billingAddress || lead?.address || '',
    shippingAddress: quotation?.shippingAddress || quotation?.billingAddress || lead?.address || '',
    city: lead?.city || 'Mumbai',
    state: lead?.state || 'Maharashtra',
    pincode: lead?.pincode || '400001'
  };

  // 3. Upsert customer in OTD customers table if not exists
  const existingCustomers = getData(OTD_KEYS.CUSTOMERS, []);
  const customerExists = existingCustomers.some(
    c => c.name?.toLowerCase() === customerDetails.name?.toLowerCase() ||
         (c.mobile && c.mobile === customerDetails.mobile)
  );
  if (!customerExists) {
    existingCustomers.unshift({
      id: generateId('CUST'),
      ...customerDetails,
      status: 'Active',
      createdAt: nowStr
    });
    setData(OTD_KEYS.CUSTOMERS, existingCustomers);
  }

  // 4. Calculate planned completion date for initial OTD stage (Order Verification)
  const systemName = 'Order To Delivery';
  const initialStage = 'Order Verification';
  const tat = getTATConfigForStage(systemName, initialStage);
  const plannedDate = tat ? calculatePlannedDate(nowStr, tat.tatValue, tat.tatUnit) : null;

  // 5. Construct Order Object for Order to Delivery (otd_orders)
  const newOrder = {
    id: generateId('ORD'),
    orderNumber,
    systemName,
    customerDetails,
    customerName: customerDetails.name,
    customerCode: customerDetails.code,
    orderDetails: {
      orderNumber,
      orderDate: todayDateStr,
      expectedDeliveryDate: quotation?.expectedDeliveryDate || lead?.expectedPurchaseDate || '',
      priority: lead?.priority || 'Normal',
      salesPerson: lead?.assignedTo || approval.submittedBy || 'Sales Executive',
      paymentTerms: quotation?.paymentTerms || 'As per approved commercial terms',
      deliveryTerms: quotation?.deliveryTerms || 'Standard Road Dispatch',
      remarks: remarks || approval.approvalRemarks || 'Converted from Lead to Order pipeline',
      attachmentName: quotation?.attachment || lead?.attachment || ''
    },
    orderDate: todayDateStr,
    expectedDeliveryDate: quotation?.expectedDeliveryDate || lead?.expectedPurchaseDate || '',
    priority: lead?.priority || 'Normal',
    salesPerson: lead?.assignedTo || approval.submittedBy || 'Sales Executive',
    paymentTerms: quotation?.paymentTerms || 'As per approved terms',
    deliveryTerms: quotation?.deliveryTerms || 'Standard Dispatch',
    remarks: remarks || approval.approvalRemarks || '',
    attachmentName: quotation?.attachment || lead?.attachment || '',
    items: orderItems,
    subTotal: quotation?.subTotal || approval.quotationAmount || 0,
    totalDiscount: quotation?.totalDiscount || 0,
    totalGst: quotation?.totalTax || 0,
    grandTotal: quotation?.grandTotal || approval.quotationAmount || 0,
    currentStage: initialStage,
    stageStartDate: nowStr,
    plannedCompletionDate: plannedDate,
    currentTatValue: tat ? tat.tatValue : null,
    currentTatUnit: tat ? tat.tatUnit : null,
    status: 'Verification Pending',
    createdAt: nowStr,
    updatedAt: nowStr,
    // Cross-system traceability links
    leadId: lead?.leadId || approval.leadId,
    quotationNo: quotation?.quotationNo || approval.quotationNo,
    approvalId: approval.approvalId,
    convertedFromLead: true
  };

  // 6. Push into OTD Orders LocalStorage
  const existingOrders = getData(OTD_KEYS.ORDERS, []);
  existingOrders.unshift(newOrder);
  setData(OTD_KEYS.ORDERS, existingOrders);

  // 7. Update Approval Record to APPROVED
  approval.approvalStatus = 'Approved';
  approval.approvedBy = approvedBy || getCurrentUser()?.name || 'Authorized Director';
  approval.approvalDate = todayDateStr;
  approval.approvalRemarks = remarks || approval.approvalRemarks || 'Approved for Order Processing';
  approval.orderNumber = orderNumber;
  approval.convertedAt = nowStr;
  approvals[appIdx] = approval;
  setData(LTO_KEYS.APPROVALS, approvals);

  // 8. Update Lead Status to APPROVED & CONVERTED TO ORDER
  if (lead) {
    updateLead(lead.id, {
      status: 'Approved',
      currentStage: 'Order to Delivery',
      convertedOrderId: orderNumber,
      approvalId: approval.approvalId,
      orderConvertedAt: nowStr
    });
  }

  // 9. Update Quotation Status
  if (quotation) {
    const allQuotes = getData(LTO_KEYS.QUOTATIONS, DEFAULT_QUOTATIONS);
    const qIdx = allQuotes.findIndex(q => q.quotationNo === quotation.quotationNo);
    if (qIdx >= 0) {
      allQuotes[qIdx].status = 'Approved';
      allQuotes[qIdx].orderNumber = orderNumber;
      setData(LTO_KEYS.QUOTATIONS, allQuotes);
    }
  }

  // 10. Audit Logging
  logAuditAction('Lead Converted to Order', 'Lead to Orders', lead?.leadId || approval.leadId, {
    orderNumber,
    approvalId: approval.approvalId,
    quotationNo: approval.quotationNo,
    customer: customerDetails.name,
    amount: newOrder.grandTotal
  });

  // 11. Dispatch notifications for both systems
  notifyLTOUpdate();
  window.dispatchEvent(new CustomEvent('otd_storage_update', { detail: { key: OTD_KEYS.ORDERS } }));

  return {
    success: true,
    orderNumber,
    newOrder,
    leadId: lead?.leadId,
    quotationNo: quotation?.quotationNo,
    approvalId: approval.approvalId
  };
}

/**
 * Mark a Lead or Negotiation as Lost with structured loss driver metadata
 */
export function markLeadAsLost(leadId, lossData = {}) {
  const leads = getData(LTO_KEYS.LEADS, DEFAULT_LEADS);
  const updated = leads.map(l => {
    if (l.id === leadId || l.leadId === leadId) {
      return {
        ...l,
        status: 'Lost',
        currentStage: 'Closed',
        lossReason: lossData.lossReason || 'Other',
        competitorName: lossData.competitorName || '—',
        competitorPrice: Number(lossData.competitorPrice || 0),
        lostRemarks: lossData.lostRemarks || '',
        lostDate: lossData.lostDate || new Date().toISOString().split('T')[0],
        estimatedValue: Number(lossData.estimatedValue || l.estimatedValue || 250000),
        updatedAt: new Date().toISOString()
      };
    }
    return l;
  });
  setData(LTO_KEYS.LEADS, updated);
  logAuditAction('Lead Marked as Lost', 'Lead to Orders', leadId, lossData);
  notifyLTOUpdate(LTO_KEYS.LEADS);
  return updated;
}

/**
 * Computes Deal Loss & Win/Loss Analytics metrics across leads and quotations
 */
export function getDealLossAnalytics(leads = [], quotations = []) {
  const lostLeads = leads.filter(l => l.status === 'Lost' || l.status === 'Rejected');
  const wonLeads = leads.filter(l => l.status === 'Approved' || l.convertedOrderId);

  const totalLostValue = lostLeads.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);
  const totalWonValue = wonLeads.reduce((acc, l) => {
    const q = quotations.find(qt => qt.leadId === l.leadId || qt.quotationNo === l.quotationNo);
    return acc + (Number(q?.grandTotal) || Number(l.estimatedValue) || 0);
  }, 0);

  const totalClosedDeals = lostLeads.length + wonLeads.length;
  const winRate = totalClosedDeals > 0 ? ((wonLeads.length / totalClosedDeals) * 100).toFixed(1) : '0.0';

  // Group by Reason
  const reasonMap = {};
  lostLeads.forEach(l => {
    const r = l.lossReason || 'Unspecified / Other';
    if (!reasonMap[r]) {
      reasonMap[r] = { reason: r, count: 0, totalValue: 0 };
    }
    reasonMap[r].count += 1;
    reasonMap[r].totalValue += (Number(l.estimatedValue) || 0);
  });

  const reasonBreakdown = Object.values(reasonMap).sort((a, b) => b.totalValue - a.totalValue);

  // Group by Competitor
  const competitorMap = {};
  lostLeads.forEach(l => {
    const comp = l.competitorName && l.competitorName !== '—' && l.competitorName !== 'None' ? l.competitorName : null;
    if (comp) {
      if (!competitorMap[comp]) {
        competitorMap[comp] = { competitor: comp, dealsWonAgainstUs: 0, lostRevenue: 0 };
      }
      competitorMap[comp].dealsWonAgainstUs += 1;
      competitorMap[comp].lostRevenue += (Number(l.estimatedValue) || 0);
    }
  });

  const topCompetitors = Object.values(competitorMap).sort((a, b) => b.lostRevenue - a.lostRevenue);

  return {
    totalLostCount: lostLeads.length,
    totalWonCount: wonLeads.length,
    totalLostValue,
    totalWonValue,
    winRate,
    reasonBreakdown,
    topCompetitors,
    lostLeads
  };
}

