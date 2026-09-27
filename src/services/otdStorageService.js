/**
 * Storage Service for Order to Delivery (OTD) Management System
 * Pure LocalStorage driven implementation. Zero external backend.
 */

import { INITIAL_USERS } from './mockData';

// LocalStorage Keys
export const STORAGE_KEYS = {
  ORDERS: 'otd_orders',
  ORDER_ITEMS: 'otd_order_items',
  CUSTOMERS: 'otd_customers',
  PURCHASE_VENDORS: 'otd_purchase_vendors',
  COMPANY_DETAILS: 'otd_company_details',
  PRODUCTS: 'otd_products',
  TRANSPORTERS: 'otd_transporters',
  DEPARTMENTS: 'otd_departments',
  EMPLOYEES: 'otd_employees',
  HOLIDAYS: 'otd_holidays',
  SYSTEMS: 'otd_systems',
  STAGES: 'otd_stages',
  TAT: 'otd_tat',
  PAYMENTS: 'otd_payments',
  STAGE_HISTORY: 'otd_stage_history',
  NOTIFICATIONS: 'otd_notifications',
  AUDIT_LOGS: 'otd_audit_logs',
  SETTINGS: 'otd_settings',
  CURRENT_USER: 'otd_current_user',
  ORDER_COUNTER: 'otd_order_counter'
};

// Default Company Details for Master & PO
export const DEFAULT_COMPANY_DETAILS = {
  companyName: 'Acme Corporate Enterprise Ltd',
  brandName: 'GimBooks',
  gstin: '07AAACA1234F1Z8',
  address: 'Plot No. 42, Udyog Vihar Phase IV',
  city: 'Gurugram',
  state: 'Haryana',
  pincode: '122015',
  email: 'purchase@gimbooks.com',
  contactNumber: '+91 (0124) 450-8900',
  phone: '+91 (0124) 450-8900',
  website: 'www.gimbooks.com',
  fax: '(0124) 450-8999',
  pan: 'AAACA1234F',
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200012345678',
  ifsc: 'HDFC0000123'
};

// Default Purchase Vendors
export const DEFAULT_PURCHASE_VENDORS = [
  {
    id: 'VND-1001',
    code: 'VND-1001',
    name: 'Tata Steel Ltd',
    contactPerson: 'Rakesh Sharma (Industrial Sales)',
    mobile: '+91 98765 43210',
    email: 'sales.industrial@tatasteel.com',
    gstin: '20AAACT2727Q1ZW',
    address: 'Tata Steel Works, P.O. Bistupur',
    city: 'Jamshedpur, Jharkhand 831001',
    status: 'Active'
  },
  {
    id: 'VND-1002',
    code: 'VND-1002',
    name: 'Havells Industrial Cables',
    contactPerson: 'Sunil Mathur (Regional Sales Head)',
    mobile: '+91 98110 55443',
    email: 'industrial.cables@havells.com',
    gstin: '07AAACH0098A1ZT',
    address: 'QRG Towers, 2D Sector 126, Expressway',
    city: 'Noida, Uttar Pradesh 201304',
    status: 'Active'
  },
  {
    id: 'VND-1003',
    code: 'VND-1003',
    name: 'SKF Bearings India',
    contactPerson: 'Amitabh Joshi (Product Engineer)',
    mobile: '+91 98230 11223',
    email: 'orders.india@skf.com',
    gstin: '27AAACS1234F1Z5',
    address: 'Plot 2, Chinchwad MIDC Industrial Area',
    city: 'Pune, Maharashtra 411033',
    status: 'Active'
  },
  {
    id: 'VND-1004',
    code: 'VND-1004',
    name: 'Bosch Rexroth Pneumatics',
    contactPerson: 'Vikram Malhotra (Automation Head)',
    mobile: '+91 99001 88776',
    email: 'sales.rexroth@bosch.com',
    gstin: '29AAACB1987M1Z2',
    address: 'Post Box No. 3000, Hosur Road, Adugodi',
    city: 'Bangalore, Karnataka 560030',
    status: 'Active'
  },
  {
    id: 'VND-1005',
    code: 'VND-1005',
    name: 'Corrugation Packaging Krafts',
    contactPerson: 'Pooja Agarwal (Client Relations)',
    mobile: '+91 97112 33445',
    email: 'kraftbox@corrugation.com',
    gstin: '06AAACC5544B1ZV',
    address: 'Plot 44, Sector 24 Industrial Area',
    city: 'Faridabad, Haryana 121005',
    status: 'Active'
  }
];

// Generic LocalStorage Utilities
export function getData(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
    return defaultValue;
  }
}

export function setData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger custom window event so UI components can re-render reactively
    window.dispatchEvent(new CustomEvent('otd_storage_update', { detail: { key } }));
    return true;
  } catch (err) {
    console.error(`Error saving ${key} to LocalStorage:`, err);
    return false;
  }
}

export function updateData(key, updateFn) {
  const current = getData(key, []);
  const updated = updateFn(current);
  setData(key, updated);
  return updated;
}

export function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Generate unique sequential order number ORD-0001, ORD-0002...
export function generateOrderNumber() {
  const counter = parseInt(localStorage.getItem(STORAGE_KEYS.ORDER_COUNTER) || '0', 10) + 1;
  localStorage.setItem(STORAGE_KEYS.ORDER_COUNTER, counter.toString());
  const numStr = counter.toString().padStart(4, '0');
  return `ORD-${numStr}`;
}

// Audit Log Helper
export function logAuditAction(action, moduleName, recordId, details = {}, previousValue = null, newValue = null) {
  const currentUser = getCurrentUser();
  const logs = getData(STORAGE_KEYS.AUDIT_LOGS, []);
  const newLog = {
    id: generateId('LOG'),
    action,
    module: moduleName,
    recordId,
    user: currentUser?.name || currentUser?.userName || 'System Admin',
    userId: currentUser?.id || 'admin',
    timestamp: new Date().toISOString(),
    details,
    previousValue,
    newValue
  };
  logs.unshift(newLog);
  setData(STORAGE_KEYS.AUDIT_LOGS, logs);
}

// Current User Management (Synchronized with Auth session)
export function getCurrentUser() {
  const otdUser = getData(STORAGE_KEYS.CURRENT_USER, null);
  if (otdUser) {
    const isAdmin = otdUser.role === 'ADMIN' || otdUser.userGroup === 'Admin';
    let mod = false;
    if (isAdmin && Array.isArray(otdUser.allowedModules)) {
      if (!otdUser.allowedModules.includes('petty-expenses')) {
        otdUser.allowedModules.push('petty-expenses');
        mod = true;
      }
      if (!otdUser.allowedModules.includes('doc-subscription')) {
        otdUser.allowedModules.push('doc-subscription');
        mod = true;
      }
      if (!otdUser.allowedModules.includes('whatsapp')) {
        otdUser.allowedModules.push('whatsapp');
        mod = true;
      }
    }
    if (mod) {
      setData(STORAGE_KEYS.CURRENT_USER, otdUser);
    }
    return otdUser;
  }

  // Fallback to corporate auth user if present
  try {
    const authStored = localStorage.getItem('corporate_system_mock_user');
    if (authStored) {
      const parsed = JSON.parse(authStored);
      if (parsed) {
        const isAdmin = parsed.role === 'ADMIN' || parsed.userGroup === 'Admin';
        let mod = false;
        if (isAdmin && Array.isArray(parsed.allowedModules)) {
          if (!parsed.allowedModules.includes('petty-expenses')) {
            parsed.allowedModules.push('petty-expenses');
            mod = true;
          }
          if (!parsed.allowedModules.includes('doc-subscription')) {
            parsed.allowedModules.push('doc-subscription');
            mod = true;
          }
          if (!parsed.allowedModules.includes('whatsapp')) {
            parsed.allowedModules.push('whatsapp');
            mod = true;
          }
        }
        if (mod) {
          localStorage.setItem('corporate_system_mock_user', JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (e) {
    // Ignore JSON error
  }

  // Default fallback user: Admin
  const defaultUser = INITIAL_USERS[0];
  setData(STORAGE_KEYS.CURRENT_USER, defaultUser);
  return defaultUser;
}

export function setCurrentUser(user) {
  setData(STORAGE_KEYS.CURRENT_USER, user);
  try {
    localStorage.setItem('corporate_system_mock_user', JSON.stringify(user));
  } catch (e) {
    // Ignore
  }
  window.dispatchEvent(new CustomEvent('user_session_update', { detail: user }));
  window.dispatchEvent(new CustomEvent('otd_storage_update', { detail: { key: STORAGE_KEYS.CURRENT_USER } }));
}

// Seed default employees for Master System -> Users if empty
export function initEmployees() {
  const existing = getData(STORAGE_KEYS.EMPLOYEES, []);
  if (!existing || existing.length === 0) {
    const seeded = INITIAL_USERS.map((u) => ({
      id: u.id,
      code: u.employee_id,
      name: u.full_name,
      email: u.email,
      mobile: u.mobile,
      department: u.department_name,
      designation: u.designation,
      userGroup: u.userGroup || (u.role === 'ADMIN' ? 'Admin' : u.role === 'MANAGER' ? 'Manager' : 'User'),
      allowedModules: u.allowedModules || ['checklist'],
      status: 'Active',
      createdAt: new Date().toISOString()
    }));
    setData(STORAGE_KEYS.EMPLOYEES, seeded);
  }
}

// TAT & Planned Completion Calculations
export function calculatePlannedDate(startDateStr, tatValue, tatUnit) {
  if (!startDateStr || !tatValue) return null;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return null;

  const val = parseFloat(tatValue);
  const result = new Date(start);

  const unitLower = (tatUnit || 'hours').toLowerCase();
  if (unitLower.startsWith('minute')) {
    result.setMinutes(result.getMinutes() + val);
  } else if (unitLower.startsWith('hour')) {
    result.setHours(result.getHours() + val);
  } else if (unitLower.startsWith('day')) {
    result.setDate(result.getDate() + val);
  } else {
    result.setHours(result.getHours() + val);
  }

  return result.toISOString();
}

export function calculateRemainingTime(plannedDateStr, isCompleted = false) {
  if (!plannedDateStr) return { text: 'N/A', minutes: 0, isOverdue: false };
  if (isCompleted) return { text: 'Completed', minutes: 0, isOverdue: false };

  const planned = new Date(plannedDateStr).getTime();
  const now = new Date().getTime();
  const diffMs = planned - now;
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 0) {
    const absMins = Math.abs(diffMins);
    const hrs = Math.floor(absMins / 60);
    const mins = absMins % 60;
    const days = Math.floor(hrs / 24);
    let timeStr = `${mins}m`;
    if (hrs > 0) timeStr = `${hrs % 24}h ${mins}m`;
    if (days > 0) timeStr = `${days}d ${hrs % 24}h`;
    return { text: `Overdue by ${timeStr}`, minutes: diffMins, isOverdue: true };
  } else {
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const days = Math.floor(hrs / 24);
    let timeStr = `${mins}m`;
    if (hrs > 0) timeStr = `${hrs % 24}h ${mins}m`;
    if (days > 0) timeStr = `${days}d ${hrs % 24}h`;
    return { text: `${timeStr} left`, minutes: diffMins, isOverdue: false };
  }
}

export function calculateTATStatus(startDateStr, plannedDateStr, actualCompletionDateStr = null) {
  if (!startDateStr) return 'Not Started';
  
  if (actualCompletionDateStr && plannedDateStr) {
    const actual = new Date(actualCompletionDateStr).getTime();
    const planned = new Date(plannedDateStr).getTime();
    return actual <= planned ? 'Completed Within TAT' : 'Completed Late';
  }

  if (!plannedDateStr) return 'On Track';

  const planned = new Date(plannedDateStr).getTime();
  const now = new Date().getTime();
  const diffMins = (planned - now) / (1000 * 60);

  if (diffMins < 0) return 'Overdue';
  if (diffMins <= 60) return 'Due Soon';
  return 'On Track';
}

// Stage Progression Utility
export function getTATConfigForStage(systemName, stageName) {
  const tatConfigs = getData(STORAGE_KEYS.TAT, []);
  return tatConfigs.find(
    (t) =>
      t.status === 'Active' &&
      t.systemName?.toLowerCase() === systemName?.toLowerCase() &&
      t.stageName?.toLowerCase() === stageName?.toLowerCase()
  );
}

export const OTD_STAGE_ORDER = [
  'New Order',
  'Order Verification',
  'Order Approval',
  'Advance Payment',
  'Stock Check',
  'Order Processing',
  'Quality Check (QC)',
  'Ready for Dispatch',
  'Dispatch',
  'Delivered',
  'Payment Collection',
  'Order Closed'
];

// Complete Order Stage & Move to Next Stage
export function advanceOrderStage(orderId, updatedStageData, remarks = '') {
  const orders = getData(STORAGE_KEYS.ORDERS, []);
  const orderIndex = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
  if (orderIndex === -1) return null;

  const order = orders[orderIndex];
  const nowStr = new Date().toISOString();

  // Find Stages for the Order's System
  const stages = getData(STORAGE_KEYS.STAGES, [])
    .filter((s) => s.status === 'Active' && s.systemName === (order.systemName || 'Order To Delivery'))
    .sort((a, b) => (parseInt(a.sequence, 10) || 0) - (parseInt(b.sequence, 10) || 0));

  const currentStageName = order.currentStage || 'New Order';

  // Identify Next Stage
  let nextStageName = currentStageName;
  let isClosed = false;

  if (updatedStageData?.nextStage) {
    nextStageName = updatedStageData.nextStage;
  } else if (stages.length > 0) {
    const currentStageIdx = stages.findIndex((s) => s.stageName === currentStageName);
    if (currentStageIdx >= 0 && currentStageIdx < stages.length - 1) {
      nextStageName = stages[currentStageIdx + 1].stageName;
    } else if (currentStageIdx === stages.length - 1) {
      nextStageName = stages[currentStageIdx].stageName;
      if (updatedStageData?.closeOrder || currentStageName === 'Order Closed' || currentStageName === 'Delivered') {
        isClosed = true;
      }
    }
  } else {
    // Fallback to standard 12 OTD sequential stages
    const currentStageIdx = OTD_STAGE_ORDER.findIndex(
      (s) => s.toLowerCase() === currentStageName.toLowerCase()
    );
    if (currentStageIdx >= 0 && currentStageIdx < OTD_STAGE_ORDER.length - 1) {
      nextStageName = OTD_STAGE_ORDER[currentStageIdx + 1];
    } else if (currentStageIdx === OTD_STAGE_ORDER.length - 1) {
      nextStageName = OTD_STAGE_ORDER[currentStageIdx];
      isClosed = true;
    }
  }

  if (currentStageName === 'Order Closed' || updatedStageData?.closeOrder || updatedStageData?.finalOrderStatus === 'Closed') {
    isClosed = true;
    nextStageName = 'Order Closed';
  }

  // Record Stage Completion in History
  const history = getData(STORAGE_KEYS.STAGE_HISTORY, []);
  const stageHistoryEntry = {
    id: generateId('HIS'),
    orderId: order.id,
    orderNumber: order.orderNumber,
    system: order.systemName || 'Order To Delivery',
    stage: currentStageName,
    employee: getCurrentUser()?.name || 'System User',
    startDate: order.stageStartDate || order.createdAt || nowStr,
    plannedDate: order.plannedCompletionDate || null,
    completionDate: nowStr,
    tatValue: order.currentTatValue || null,
    tatUnit: order.currentTatUnit || null,
    actualTimeMinutes: order.stageStartDate ? Math.round((new Date(nowStr) - new Date(order.stageStartDate)) / 60000) : 0,
    tatStatus: calculateTATStatus(order.stageStartDate, order.plannedCompletionDate, nowStr),
    remarks: remarks || updatedStageData?.remarks || 'Stage Completed'
  };
  history.push(stageHistoryEntry);
  setData(STORAGE_KEYS.STAGE_HISTORY, history);

  // Look up TAT for Next Stage
  const nextTat = getTATConfigForStage(order.systemName || 'Order To Delivery', nextStageName);
  const nextPlannedDate = nextTat ? calculatePlannedDate(nowStr, nextTat.tatValue, nextTat.tatUnit) : null;

  // Update Order
  const prevStage = order.currentStage;
  order.currentStage = nextStageName;
  order.stageStartDate = nowStr;
  order.plannedCompletionDate = nextPlannedDate;
  order.currentTatValue = nextTat ? nextTat.tatValue : null;
  order.currentTatUnit = nextTat ? nextTat.tatUnit : null;
  order.status = isClosed ? 'Closed' : updatedStageData?.status || 'In Progress';
  order.updatedAt = nowStr;
  
  // Merge stage specific details
  if (updatedStageData) {
    Object.assign(order, updatedStageData);
    order.currentStage = nextStageName; // Preserve determined nextStageName
    order.stageDetails = {
      ...(order.stageDetails || {}),
      [currentStageName]: updatedStageData
    };
  }

  orders[orderIndex] = order;
  setData(STORAGE_KEYS.ORDERS, orders);

  logAuditAction('Stage Completed', 'Order Workflow', order.orderNumber, {
    fromStage: prevStage,
    toStage: nextStageName,
    remarks
  });

  return order;
}

// Backup & Data Management Utility
export function exportAllData() {
  const exportPayload = {
    appName: 'Order To Delivery Management System',
    exportedAt: new Date().toISOString(),
    data: {}
  };
  Object.values(STORAGE_KEYS).forEach((key) => {
    exportPayload.data[key] = getData(key, null);
  });
  return JSON.stringify(exportPayload, null, 2);
}

export function importAllData(jsonString) {
  try {
    const payload = JSON.parse(jsonString);
    if (!payload.data || typeof payload.data !== 'object') {
      throw new Error('Invalid backup file format');
    }
    Object.entries(payload.data).forEach(([key, val]) => {
      if (val !== null) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    });
    window.dispatchEvent(new CustomEvent('otd_storage_update', { detail: { key: 'ALL' } }));
    return { success: true, message: 'Data imported successfully' };
  } catch (err) {
    return { success: false, message: err.message || 'Failed to parse JSON file' };
  }
}

export function clearAllOTDData() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  window.dispatchEvent(new CustomEvent('otd_storage_update', { detail: { key: 'ALL' } }));
}

// Seed Initial Orders for Stage Reports & Kanban demo
export function initOTDData() {
  initEmployees();
  const existing = localStorage.getItem(STORAGE_KEYS.ORDERS);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) return;
    } catch (e) {
      // Re-seed on parse error
    }
  }

  const initialOrders = [
    {
      id: 'ORD-MOCK-1',
      orderNumber: 'ORD-1001',
      soNumber: 'SO-2026-081',
      customerName: 'Foto dugros B.V.',
      contactPerson: 'Arjen Van Dijk',
      email: 'arjen@fotodugros.nl',
      mobile: '+31 6 12345678',
      deliveryLocation: 'Rotterdam Distribution Center, Netherlands',
      orderDate: '2026-09-18',
      expectedDeliveryDate: '2026-09-24',
      stageStartDate: '2026-09-18T10:00:00Z',
      plannedCompletionDate: '2026-09-22T18:00:00Z',
      currentStage: 'New Order',
      status: 'Verification Pending',
      priority: 'Urgent',
      salesPerson: 'Deepak Rao',
      items: [
        { productName: 'Charm London Brand Patch In Black Silver Text', quantity: 2000, unit: 'Pcs', rate: 72.5, amount: 145000 }
      ],
      grandTotal: 145000,
      remarks: 'European export order; export customs clearance required.'
    },
    {
      id: 'ORD-MOCK-2',
      orderNumber: 'ORD-1002',
      soNumber: 'SO-2026-082',
      customerName: 'DUGROS B.V.',
      contactPerson: 'Kees Dugros',
      email: 'kees@dugros.nl',
      mobile: '+31 6 98765432',
      deliveryLocation: 'Amsterdam Logistics Hub',
      orderDate: '2026-09-15',
      expectedDeliveryDate: '2026-09-22',
      stageStartDate: '2026-09-15T09:00:00Z',
      plannedCompletionDate: '2026-09-20T17:00:00Z',
      currentStage: 'Order Verification',
      status: 'Verification In Progress',
      priority: 'Urgent',
      salesPerson: 'Priya Sharma',
      items: [
        { productName: 'Chamada B All Ornaments & Leather Accessories', quantity: 1500, unit: 'Sets', rate: 190, amount: 285000 }
      ],
      grandTotal: 285000,
      remarks: 'Technical specifications verified with buyer.'
    },
    {
      id: 'ORD-MOCK-3',
      orderNumber: 'ORD-1003',
      soNumber: 'SO-2026-083',
      customerName: 'Prestige Infrastructure Corp',
      contactPerson: 'Sneha Kulkarni',
      email: 'sneha.k@prestigeconstructions.com',
      mobile: '+91 98450 11223',
      deliveryLocation: 'Prestige Tech Cloud Site, Bengaluru',
      orderDate: '2026-09-14',
      expectedDeliveryDate: '2026-09-23',
      stageStartDate: '2026-09-14T11:00:00Z',
      plannedCompletionDate: '2026-09-21T18:00:00Z',
      currentStage: 'Order Approval',
      status: 'Approval Pending',
      priority: 'Normal',
      salesPerson: 'Rahul Mehta',
      items: [
        { productName: 'Heavy High Tensile Fasteners & Hex Bolts M24', quantity: 20000, unit: 'Pcs', rate: 17, amount: 340000 }
      ],
      grandTotal: 340000,
      remarks: 'Commercial signoff awaiting CFO approval.'
    },
    {
      id: 'ORD-MOCK-4',
      orderNumber: 'ORD-1004',
      soNumber: 'SO-2026-084',
      customerName: 'Shapoorji Pallonji EPC Ltd',
      contactPerson: 'Vikramaditya Sengupta',
      email: 'v.sengupta@shapoorji.com',
      mobile: '+91 98200 45678',
      deliveryLocation: 'Metro Line Girder Site, Thane Yard',
      orderDate: '2026-09-12',
      expectedDeliveryDate: '2026-09-21',
      stageStartDate: '2026-09-12T14:00:00Z',
      plannedCompletionDate: '2026-09-19T18:00:00Z',
      currentStage: 'Advance Payment',
      status: 'Advance Pending',
      priority: 'High',
      salesPerson: 'Amitabh Joshi',
      items: [
        { productName: 'Structural Steel Girder Beams ISMB 400 (120 MT)', quantity: 120, unit: 'MT', rate: 7666, amount: 920000 }
      ],
      grandTotal: 920000,
      remarks: '20% advance milestone payment pending remittance.'
    },
    {
      id: 'ORD-MOCK-5',
      orderNumber: 'ORD-1005',
      soNumber: 'SO-2026-085',
      customerName: 'Godrej Process Equipment',
      contactPerson: 'Rajesh Nambiar',
      email: 'r.nambiar@godrej.com',
      mobile: '+91 99670 98765',
      deliveryLocation: 'Plant 13, Vikhroli East, Mumbai',
      orderDate: '2026-09-11',
      expectedDeliveryDate: '2026-09-20',
      stageStartDate: '2026-09-11T16:00:00Z',
      plannedCompletionDate: '2026-09-18T18:00:00Z',
      currentStage: 'Stock Check',
      status: 'Stock Check Ongoing',
      priority: 'Normal',
      salesPerson: 'Rahul Mehta',
      items: [
        { productName: 'Pressure Vessel Flanges SS316L (50 Nos)', quantity: 50, unit: 'Nos', rate: 8200, amount: 410000 }
      ],
      grandTotal: 410000,
      remarks: 'Inventory allocation for raw forged rings in warehouse.'
    },
    {
      id: 'ORD-MOCK-6',
      orderNumber: 'ORD-1006',
      soNumber: 'SO-2026-086',
      customerName: 'Tata Projects Ltd',
      contactPerson: 'Arunav Banerjee',
      email: 'a.banerjee@tataprojects.com',
      mobile: '+91 98190 77665',
      deliveryLocation: 'Thermal Power Expansion Site, Mundra',
      orderDate: '2026-09-09',
      expectedDeliveryDate: '2026-09-18',
      stageStartDate: '2026-09-09T10:00:00Z',
      plannedCompletionDate: '2026-09-16T18:00:00Z',
      currentStage: 'Order Processing',
      status: 'Machining In Progress',
      priority: 'High',
      salesPerson: 'Priya Sharma',
      items: [
        { productName: 'Industrial Submersible Pumps 15HP Heavy Duty', quantity: 5, unit: 'Sets', rate: 55000, amount: 275000 }
      ],
      grandTotal: 275000,
      remarks: 'Assembly line station 3 running final impeller balance.'
    },
    {
      id: 'ORD-MOCK-7',
      orderNumber: 'ORD-1007',
      soNumber: 'SO-2026-087',
      customerName: 'L&T Construction Engineering',
      contactPerson: 'Muralidharan S',
      email: 'murali.s@larsentoubro.com',
      mobile: '+91 94440 22334',
      deliveryLocation: 'Bridge Fabrication Yard, Hazira',
      orderDate: '2026-09-08',
      expectedDeliveryDate: '2026-09-17',
      stageStartDate: '2026-09-08T09:00:00Z',
      plannedCompletionDate: '2026-09-14T18:00:00Z',
      currentStage: 'Quality Check (QC)',
      status: 'QC Inspection Pending',
      priority: 'Urgent',
      salesPerson: 'Deepak Rao',
      items: [
        { productName: 'Heavy Earthmoving Hydraulic Fittings & Cylinders', quantity: 40, unit: 'Sets', rate: 14000, amount: 560000 }
      ],
      grandTotal: 560000,
      remarks: 'Hydrostatic pressure test report pending inspector signoff.'
    },
    {
      id: 'ORD-MOCK-8',
      orderNumber: 'ORD-1008',
      soNumber: 'SO-2026-088',
      customerName: 'Reliance Retail Supply Chain',
      contactPerson: 'Saurabh Mittal',
      email: 'saurabh.mittal@ril.com',
      mobile: '+91 98210 99887',
      deliveryLocation: 'Mega Fulfillment Center, Bhiwandi',
      orderDate: '2026-09-05',
      expectedDeliveryDate: '2026-09-15',
      stageStartDate: '2026-09-05T12:00:00Z',
      plannedCompletionDate: '2026-09-12T18:00:00Z',
      currentStage: 'Ready for Dispatch',
      status: 'Packaging Complete',
      priority: 'Normal',
      salesPerson: 'Amitabh Joshi',
      items: [
        { productName: 'Warehouse Automation Pallet Conveyors & Rollers', quantity: 20, unit: 'Sections', rate: 41500, amount: 830000 }
      ],
      grandTotal: 830000,
      remarks: 'Palletized, shrink-wrapped, and staged in Bay 4.'
    },
    {
      id: 'ORD-MOCK-9',
      orderNumber: 'ORD-1009',
      soNumber: 'SO-2026-089',
      customerName: 'Siemens India Energy',
      contactPerson: 'Karan Mehra',
      email: 'karan.mehra@siemens.com',
      mobile: '+91 98201 33445',
      deliveryLocation: 'Substation Project, Kalwa Works, Navi Mumbai',
      orderDate: '2026-09-03',
      expectedDeliveryDate: '2026-09-12',
      stageStartDate: '2026-09-03T14:00:00Z',
      plannedCompletionDate: '2026-09-10T18:00:00Z',
      currentStage: 'Dispatch',
      status: 'In Transit',
      priority: 'High',
      salesPerson: 'Rahul Mehta',
      items: [
        { productName: '4-Core Armoured Copper Power Cables 16sqmm', quantity: 500, unit: 'Meters', rate: 390, amount: 195000 }
      ],
      grandTotal: 195000,
      remarks: 'Dispatched via VRL Logistics; LR# VRL-77884.'
    },
    {
      id: 'ORD-MOCK-10',
      orderNumber: 'ORD-1010',
      soNumber: 'SO-2026-090',
      customerName: 'Adani Solar Infrastructure',
      contactPerson: 'Hemant Trivedi',
      email: 'hemant.trivedi@adani.com',
      mobile: '+91 97120 44556',
      deliveryLocation: 'Khavda Renewable Energy Park, Kutch, Gujarat',
      orderDate: '2026-08-28',
      expectedDeliveryDate: '2026-09-09',
      stageStartDate: '2026-08-28T10:00:00Z',
      plannedCompletionDate: '2026-09-08T18:00:00Z',
      currentStage: 'Delivered',
      status: 'Delivered at Site',
      priority: 'Normal',
      salesPerson: 'Priya Sharma',
      items: [
        { productName: 'Solar Inverter Matrix Modules 10kVA', quantity: 8, unit: 'Units', rate: 83750, amount: 670000 }
      ],
      grandTotal: 670000,
      remarks: 'Signed POD received from site material manager.'
    },
    {
      id: 'ORD-MOCK-11',
      orderNumber: 'ORD-1011',
      soNumber: 'SO-2026-091',
      customerName: 'Mahindra & Mahindra Automotive',
      contactPerson: 'Aniket Jadhav',
      email: 'jadhav.aniket@mahindra.com',
      mobile: '+91 98220 66778',
      deliveryLocation: 'Automotive Plant, Chakan MIDC, Pune',
      orderDate: '2026-08-24',
      expectedDeliveryDate: '2026-09-05',
      stageStartDate: '2026-08-24T11:00:00Z',
      plannedCompletionDate: '2026-09-04T18:00:00Z',
      currentStage: 'Payment Collection',
      status: 'Payment Pending',
      priority: 'Normal',
      salesPerson: 'Deepak Rao',
      items: [
        { productName: 'Pneumatic Control Cylinders 50mm Standard Bore', quantity: 25, unit: 'Pcs', rate: 5920, amount: 148000 }
      ],
      grandTotal: 148000,
      remarks: 'Invoice INV-2026-041 submitted; 30-day payment cycle.'
    },
    {
      id: 'ORD-MOCK-12',
      orderNumber: 'ORD-1012',
      soNumber: 'SO-2026-092',
      customerName: 'Bharat Forge Ltd',
      contactPerson: 'Sunil Rathi',
      email: 's.rathi@bharatforge.com',
      mobile: '+91 98900 11224',
      deliveryLocation: 'Mundhwa Plant, Pune',
      orderDate: '2026-08-15',
      expectedDeliveryDate: '2026-08-30',
      stageStartDate: '2026-08-15T09:00:00Z',
      plannedCompletionDate: '2026-08-30T18:00:00Z',
      currentStage: 'Order Closed',
      status: 'Order Completed & Paid',
      priority: 'Normal',
      salesPerson: 'Amitabh Joshi',
      items: [
        { productName: 'Forged Alloy High Pressure Flanges (Special Grade)', quantity: 20, unit: 'Sets', rate: 24500, amount: 490000 }
      ],
      grandTotal: 490000,
      remarks: 'Full settlement received. Order archived successfully.'
    }
  ];

  setData(STORAGE_KEYS.ORDERS, initialOrders);
}

