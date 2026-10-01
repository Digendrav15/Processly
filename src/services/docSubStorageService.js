/**
 * Document & Subscription Management Storage & Lifecycle Service
 * Handles:
 * - Documents (Company, Legal, Tax, Licenses, Vendor Contracts, Employee documents)
 * - Verification Workflow (Pending Verification, Verified, Rejected)
 * - Expiry & Renewal Alerts (Expiring Soon within 30/60 days, Expired)
 * - Subscriptions (SaaS, Cloud Infrastructure, Tools, Domain/Hosting, Services)
 * - Renewal Due, Payment Due, Active, Expired
 * - Payment Tracking (Invoices, Spend by department/cycle)
 * - History & Audit Logs
 */

export const DOC_SUB_KEYS = {
  DOCUMENTS: 'docsub_documents',
  SUBSCRIPTIONS: 'docsub_subscriptions',
  PAYMENTS: 'docsub_payments',
  AUDIT_LOGS: 'docsub_audit_logs',
  DOC_COUNTER: 'docsub_doc_counter',
  SUB_COUNTER: 'docsub_sub_counter',
  PAY_COUNTER: 'docsub_pay_counter',
  SEEDED: 'docsub_seeded_v1'
};

// Event Dispatcher
export function notifyDocSubUpdate(key = 'ALL') {
  window.dispatchEvent(new CustomEvent('docsub_storage_update', { detail: { key } }));
}

// LocalStorage helpers
export function getDocSubData(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'null' || raw === 'undefined') return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
    return defaultValue;
  }
}

export function setDocSubData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyDocSubUpdate(key);
    return true;
  } catch (err) {
    console.error(`Error saving ${key} to LocalStorage:`, err);
    return false;
  }
}

// Sequential IDs
export function generateDocId() {
  const counter = parseInt(localStorage.getItem(DOC_SUB_KEYS.DOC_COUNTER) || '100', 10) + 1;
  localStorage.setItem(DOC_SUB_KEYS.DOC_COUNTER, counter.toString());
  return `DOC-${counter.toString().padStart(4, '0')}`;
}

export function generateSubId() {
  const counter = parseInt(localStorage.getItem(DOC_SUB_KEYS.SUB_COUNTER) || '200', 10) + 1;
  localStorage.setItem(DOC_SUB_KEYS.SUB_COUNTER, counter.toString());
  return `SUB-${counter.toString().padStart(4, '0')}`;
}

export function generatePayId() {
  const counter = parseInt(localStorage.getItem(DOC_SUB_KEYS.PAY_COUNTER) || '500', 10) + 1;
  localStorage.setItem(DOC_SUB_KEYS.PAY_COUNTER, counter.toString());
  return `PAY-${counter.toString().padStart(4, '0')}`;
}

// Audit Logger
export function logDocSubActivity({ action, entityType, entityId, title, details, performedBy = 'Administrator' }) {
  const logs = getDocSubData(DOC_SUB_KEYS.AUDIT_LOGS, []);
  const newLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    entityType, // 'Document' | 'Subscription' | 'Payment'
    entityId,
    title,
    details,
    performedBy,
    timestamp: new Date().toISOString()
  };
  setDocSubData(DOC_SUB_KEYS.AUDIT_LOGS, [newLog, ...logs]);
}

// Categories & Constants
export const DOCUMENT_CATEGORIES = [
  'Company Registration & Incorporation',
  'GST & Tax Compliance',
  'Trade & Factory License',
  'Vendor / Supplier Contract',
  'Client Service Agreement (SLA)',
  'Non-Disclosure Agreement (NDA)',
  'Commercial Property Lease Deed',
  'Insurance Policy (Asset / Fire / Health)',
  'ISO & Quality Certification',
  'Intellectual Property / Trademark',
  'Import / Export License (IEC)',
  'Bank Guarantee / Financial Security',
  'Employee Agreement / Bond',
  'Other Statutory Compliance'
];

export const SUBSCRIPTION_CATEGORIES = [
  'Cloud Infrastructure & Hosting',
  'Software Development & Git Tools',
  'Design & Creative Suite',
  'Collaboration & Communication',
  'CRM & Sales Automation',
  'HRMS, Payroll & Accounting',
  'Cybersecurity & Antivirus',
  'Domain & DNS Management',
  'Project Management & Productivity',
  'Marketing, SEO & Social Media',
  'AI & Machine Learning Services',
  'Office Utilities & Broadband'
];

export const BILLING_CYCLES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-Time'];
export const DEPARTMENTS = ['Information Technology', 'Human Resources', 'Finance & Accounts', 'Operations & Logistics', 'Legal & Compliance', 'Sales & Marketing', 'Management'];

// Helper to calculate days difference
export function getDaysDiff(targetDate) {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper to format date nicely
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const dt = new Date(dateString);
    if (isNaN(dt.getTime())) return dateString;
    return dt.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// Initialize Clean DocSub Data (Desktop Local & Supabase Ready)
export function initDocSubData() {
  const seeded = localStorage.getItem(DOC_SUB_KEYS.SEEDED);
  if (seeded === 'true') return;

  if (!localStorage.getItem(DOC_SUB_KEYS.DOCUMENTS)) {
    setDocSubData(DOC_SUB_KEYS.DOCUMENTS, []);
  }
  if (!localStorage.getItem(DOC_SUB_KEYS.SUBSCRIPTIONS)) {
    setDocSubData(DOC_SUB_KEYS.SUBSCRIPTIONS, []);
  }
  if (!localStorage.getItem(DOC_SUB_KEYS.PAYMENTS)) {
    setDocSubData(DOC_SUB_KEYS.PAYMENTS, []);
  }
  if (!localStorage.getItem(DOC_SUB_KEYS.AUDIT_LOGS)) {
    setDocSubData(DOC_SUB_KEYS.AUDIT_LOGS, []);
  }
  localStorage.setItem(DOC_SUB_KEYS.DOC_COUNTER, '100');
  localStorage.setItem(DOC_SUB_KEYS.SUB_COUNTER, '200');
  localStorage.setItem(DOC_SUB_KEYS.PAY_COUNTER, '500');
  localStorage.setItem(DOC_SUB_KEYS.SEEDED, 'true');
}

// -------------------------------------------------------------
// Document CRUD & Verification Methods
// -------------------------------------------------------------

export function getDocuments() {
  return getDocSubData(DOC_SUB_KEYS.DOCUMENTS, []);
}

export function saveDocument(docData) {
  const docs = getDocuments();
  let updated;

  if (docData.id) {
    updated = docs.map((d) => (d.id === docData.id ? { ...d, ...docData, updatedAt: new Date().toISOString() } : d));
    logDocSubActivity({
      action: 'Updated',
      entityType: 'Document',
      entityId: docData.id,
      title: `Document Updated: ${docData.title}`,
      details: `Category: ${docData.category}`
    });
  } else {
    const id = generateDocId();
    const newDoc = {
      ...docData,
      id,
      verificationStatus: docData.verificationStatus || 'Pending Verification',
      criticality: docData.criticality || 'Medium',
      createdAt: new Date().toISOString()
    };
    updated = [newDoc, ...docs];
    logDocSubActivity({
      action: 'Created',
      entityType: 'Document',
      entityId: id,
      title: `New Document Registered: ${newDoc.title}`,
      details: `Category: ${newDoc.category}, Department: ${newDoc.department}`
    });
  }

  setDocSubData(DOC_SUB_KEYS.DOCUMENTS, updated);
  return updated;
}

export function verifyDocument(docId, { status = 'Verified', verifiedBy = 'Administrator', notes = '' } = {}) {
  const docs = getDocuments();
  const updated = docs.map((d) => {
    if (d.id === docId) {
      return {
        ...d,
        verificationStatus: status,
        verifiedBy,
        verifiedAt: new Date().toISOString().split('T')[0],
        verificationNotes: notes || d.verificationNotes
      };
    }
    return d;
  });

  const doc = docs.find((d) => d.id === docId);
  logDocSubActivity({
    action: status,
    entityType: 'Document',
    entityId: docId,
    title: `Document ${status}: ${doc?.title || docId}`,
    details: `Verified by ${verifiedBy}. Notes: ${notes || 'None'}`,
    performedBy: verifiedBy
  });

  setDocSubData(DOC_SUB_KEYS.DOCUMENTS, updated);
  return updated;
}

export function renewDocument(docId, { newExpiryDate, issueDate, notes = '', renewedBy = 'Administrator' }) {
  const docs = getDocuments();
  const updated = docs.map((d) => {
    if (d.id === docId) {
      return {
        ...d,
        expiryDate: newExpiryDate,
        issueDate: issueDate || d.issueDate,
        notes: notes ? `${d.notes ? d.notes + ' | ' : ''}Renewed on ${new Date().toISOString().split('T')[0]}: ${notes}` : d.notes
      };
    }
    return d;
  });

  const doc = docs.find((d) => d.id === docId);
  logDocSubActivity({
    action: 'Renewed',
    entityType: 'Document',
    entityId: docId,
    title: `Document Renewed: ${doc?.title || docId}`,
    details: `Extended validity to ${newExpiryDate}`,
    performedBy: renewedBy
  });

  setDocSubData(DOC_SUB_KEYS.DOCUMENTS, updated);
  return updated;
}

export function deleteDocument(docId) {
  const docs = getDocuments();
  const target = docs.find((d) => d.id === docId);
  const updated = docs.filter((d) => d.id !== docId);

  logDocSubActivity({
    action: 'Deleted',
    entityType: 'Document',
    entityId: docId,
    title: `Document Deleted: ${target?.title || docId}`,
    details: `Removed by Administrator`
  });

  setDocSubData(DOC_SUB_KEYS.DOCUMENTS, updated);
  return updated;
}

// -------------------------------------------------------------
// Subscriptions CRUD & Payment Tracking
// -------------------------------------------------------------

export function getSubscriptions() {
  return getDocSubData(DOC_SUB_KEYS.SUBSCRIPTIONS, []);
}

export function saveSubscription(subData) {
  const subs = getSubscriptions();
  let updated;

  if (subData.id) {
    updated = subs.map((s) => (s.id === subData.id ? { ...s, ...subData, updatedAt: new Date().toISOString() } : s));
    logDocSubActivity({
      action: 'Updated',
      entityType: 'Subscription',
      entityId: subData.id,
      title: `Subscription Updated: ${subData.serviceName}`,
      details: `Plan: ${subData.planName}`
    });
  } else {
    const id = generateSubId();
    const newSub = {
      ...subData,
      id,
      amount: Number(subData.amount) || 0,
      currency: subData.currency || 'INR',
      status: subData.status || 'Active',
      paymentStatus: subData.paymentStatus || 'Payment Due',
      createdAt: new Date().toISOString()
    };
    updated = [newSub, ...subs];
    logDocSubActivity({
      action: 'Created',
      entityType: 'Subscription',
      entityId: id,
      title: `New Subscription Added: ${newSub.serviceName}`,
      details: `Provider: ${newSub.provider}, Plan: ${newSub.planName}, Cost: ₹${newSub.amount}`
    });
  }

  setDocSubData(DOC_SUB_KEYS.SUBSCRIPTIONS, updated);
  return updated;
}

export function renewSubscription(subId, { nextRenewalDate, nextPaymentDueDate, amount, renewedBy = 'Administrator', notes = '' }) {
  const subs = getSubscriptions();
  const updated = subs.map((s) => {
    if (s.id === subId) {
      return {
        ...s,
        nextRenewalDate: nextRenewalDate || s.nextRenewalDate,
        nextPaymentDueDate: nextPaymentDueDate || nextRenewalDate || s.nextPaymentDueDate,
        amount: amount ? Number(amount) : s.amount,
        status: 'Active',
        paymentStatus: 'Payment Due'
      };
    }
    return s;
  });

  const sub = subs.find((s) => s.id === subId);
  logDocSubActivity({
    action: 'Renewed',
    entityType: 'Subscription',
    entityId: subId,
    title: `Subscription Renewed: ${sub?.serviceName || subId}`,
    details: `Next renewal: ${nextRenewalDate}. ${notes}`,
    performedBy: renewedBy
  });

  setDocSubData(DOC_SUB_KEYS.SUBSCRIPTIONS, updated);
  return updated;
}

export function recordSubscriptionPayment(paymentData) {
  const payments = getDocSubData(DOC_SUB_KEYS.PAYMENTS, []);
  const payId = generatePayId();

  const newPay = {
    ...paymentData,
    id: payId,
    amount: Number(paymentData.amount) || 0,
    paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  const updatedPayments = [newPay, ...payments];
  setDocSubData(DOC_SUB_KEYS.PAYMENTS, updatedPayments);

  // Update subscription payment status
  if (paymentData.subscriptionId) {
    const subs = getSubscriptions();
    const updatedSubs = subs.map((s) => {
      if (s.id === paymentData.subscriptionId) {
        return {
          ...s,
          paymentStatus: 'Paid',
          status: 'Active',
          lastPaymentDate: newPay.paymentDate,
          lastPaymentRef: newPay.transactionRef || newPay.invoiceNumber || ''
        };
      }
      return s;
    });
    setDocSubData(DOC_SUB_KEYS.SUBSCRIPTIONS, updatedSubs);
  }

  logDocSubActivity({
    action: 'Payment Paid',
    entityType: 'Payment',
    entityId: payId,
    title: `Payment Recorded for ${newPay.serviceName}`,
    details: `Amount: ₹${newPay.amount.toLocaleString('en-IN')}, Mode: ${newPay.paymentMode}, Inv: ${newPay.invoiceNumber}`,
    performedBy: newPay.paidBy || 'Administrator'
  });

  return updatedPayments;
}

export function deleteSubscription(subId) {
  const subs = getSubscriptions();
  const target = subs.find((s) => s.id === subId);
  const updated = subs.filter((s) => s.id !== subId);

  logDocSubActivity({
    action: 'Deleted',
    entityType: 'Subscription',
    entityId: subId,
    title: `Subscription Removed: ${target?.serviceName || subId}`,
    details: `Removed by Administrator`
  });

  setDocSubData(DOC_SUB_KEYS.SUBSCRIPTIONS, updated);
  return updated;
}

// -------------------------------------------------------------
// Metric Aggregators & Calculations
// -------------------------------------------------------------

export function getDocSubSummary() {
  const docs = getDocuments();
  const subs = getSubscriptions();
  const payments = getDocSubData(DOC_SUB_KEYS.PAYMENTS, []);

  // 1. Documents Metrics
  const pendingVerificationDocs = docs.filter((d) => d.verificationStatus === 'Pending Verification');
  const verifiedDocs = docs.filter((d) => d.verificationStatus === 'Verified');

  const expiringSoonDocs = docs.filter((d) => {
    if (d.isPerpetual || !d.expiryDate) return false;
    const days = getDaysDiff(d.expiryDate);
    return days !== null && days >= 0 && days <= 30;
  });

  const expiredDocs = docs.filter((d) => {
    if (d.isPerpetual || !d.expiryDate) return false;
    const days = getDaysDiff(d.expiryDate);
    return days !== null && days < 0;
  });

  // 2. Subscriptions Metrics
  const activeSubs = subs.filter((s) => s.status === 'Active');
  const expiredSubs = subs.filter((s) => s.status === 'Expired');

  const renewalDueSubs = subs.filter((s) => {
    if (!s.nextRenewalDate) return false;
    const days = getDaysDiff(s.nextRenewalDate);
    return days !== null && days >= 0 && days <= 30;
  });

  const paymentDueSubs = subs.filter(
    (s) => s.paymentStatus === 'Payment Due' || s.paymentStatus === 'Overdue'
  );

  // Financial Estimates
  const totalAnnualSaaSSpend = subs.reduce((sum, s) => {
    const amt = Number(s.amount) || 0;
    if (s.billingCycle === 'Monthly') return sum + amt * 12;
    if (s.billingCycle === 'Quarterly') return sum + amt * 4;
    return sum + amt;
  }, 0);

  const monthlySaaSSpend = Math.round(totalAnnualSaaSSpend / 12);

  const totalPaymentsRecorded = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Total Action Items requiring Attention
  const pendingActionsCount =
    pendingVerificationDocs.length +
    expiringSoonDocs.length +
    expiredDocs.length +
    renewalDueSubs.length +
    paymentDueSubs.length;

  return {
    // Documents
    totalDocsCount: docs.length,
    verifiedDocsCount: verifiedDocs.length,
    pendingVerificationCount: pendingVerificationDocs.length,
    expiringSoonDocsCount: expiringSoonDocs.length,
    expiredDocsCount: expiredDocs.length,

    // Subscriptions
    totalSubsCount: subs.length,
    activeSubsCount: activeSubs.length,
    expiredSubsCount: expiredSubs.length,
    renewalDueSubsCount: renewalDueSubs.length,
    paymentDueSubsCount: paymentDueSubs.length,

    // Spend
    totalAnnualSaaSSpend,
    monthlySaaSSpend,
    totalPaymentsRecorded,

    // Total Action Items
    pendingActionsCount
  };
}
