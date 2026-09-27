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

// Initial Realistic Seed Data
export function initDocSubData() {
  const seeded = localStorage.getItem(DOC_SUB_KEYS.SEEDED);
  if (seeded === 'true') return;

  const today = new Date();
  const d = (offsetDays) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offsetDays);
    return dt.toISOString().split('T')[0];
  };

  const initialDocs = [
    {
      id: 'DOC-0101',
      title: 'Company Certificate of Incorporation',
      category: 'Company Registration & Incorporation',
      docNumber: 'U72900MH2018PTC309112',
      issuer: 'Ministry of Corporate Affairs, Registrar of Companies',
      issueDate: d(-1800),
      expiryDate: '', // Permanent
      isPerpetual: true,
      verificationStatus: 'Verified',
      verifiedBy: 'Sanjay Deshmukh (Legal Officer)',
      verifiedAt: d(-1790),
      department: 'Legal & Compliance',
      custodian: 'Vikramaditya Sharma',
      criticality: 'High',
      fileName: 'ROC_Incorporation_Certificate_2018.pdf',
      fileSize: '2.4 MB',
      notes: 'Master incorporation certificate stored in head office safe locker',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'DOC-0102',
      title: 'GST Registration Certificate (Form REG-06)',
      category: 'GST & Tax Compliance',
      docNumber: '27AAACG0192Q1ZV',
      issuer: 'Goods and Services Tax Department, Government of India',
      issueDate: d(-1400),
      expiryDate: '', // Permanent
      isPerpetual: true,
      verificationStatus: 'Verified',
      verifiedBy: 'Pooja Iyer (Finance Head)',
      verifiedAt: d(-1390),
      department: 'Finance & Accounts',
      custodian: 'Pooja Iyer',
      criticality: 'High',
      fileName: 'GST_Certificate_Form_REG06.pdf',
      fileSize: '1.1 MB',
      notes: 'Active Maharashtra state GST registration',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'DOC-0103',
      title: 'Commercial Head Office Lease & License Agreement',
      category: 'Commercial Property Lease Deed',
      docNumber: 'LEASE-BKC-2024-44',
      issuer: 'Godrej Properties & Leasing Consortium',
      issueDate: d(-340),
      expiryDate: d(25), // Expiring in 25 days!
      isPerpetual: false,
      verificationStatus: 'Verified',
      verifiedBy: 'Sanjay Deshmukh',
      verifiedAt: d(-335),
      department: 'Legal & Compliance',
      custodian: 'Ananya Roy',
      criticality: 'High',
      fileName: 'Godrej_BKC_HeadOffice_Lease_Agreement.pdf',
      fileSize: '4.8 MB',
      notes: '11-month lease expiring soon. Landlord sent renewal draft with 7% escalation.',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 'DOC-0104',
      title: 'Corporate Comprehensive Asset & Fire Insurance Policy',
      category: 'Insurance Policy (Asset / Fire / Health)',
      docNumber: 'POL-ICICI-LOMB-990142',
      issuer: 'ICICI Lombard General Insurance Co.',
      issueDate: d(-350),
      expiryDate: d(15), // Expiring in 15 days!
      isPerpetual: false,
      verificationStatus: 'Verified',
      verifiedBy: 'Pooja Iyer',
      verifiedAt: d(-348),
      department: 'Finance & Accounts',
      custodian: 'Vikramaditya Sharma',
      criticality: 'High',
      fileName: 'ICICI_Lombard_Fire_Asset_Policy_2025-26.pdf',
      fileSize: '3.2 MB',
      notes: 'Sum insured: ₹5.50 Crore. Renewal quotation received from broker.',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
      id: 'DOC-0105',
      title: 'Municipal Trade & Shop Establishment License',
      category: 'Trade & Factory License',
      docNumber: 'MCD-SHOP-DELHI-88910',
      issuer: 'Municipal Corporation of Delhi',
      issueDate: d(-390),
      expiryDate: d(-25), // Expired 25 days ago!
      isPerpetual: false,
      verificationStatus: 'Verified',
      verifiedBy: 'Sanjay Deshmukh',
      verifiedAt: d(-380),
      department: 'Operations & Logistics',
      custodian: 'Rahul Verma',
      criticality: 'High',
      fileName: 'MCD_Trade_Establishment_License.pdf',
      fileSize: '1.4 MB',
      notes: 'EXPIRED! Late penalty applicable. Renewal fee receipt awaiting upload.',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
    },
    {
      id: 'DOC-0106',
      title: 'Vendor Master Framework Agreement - Apex Logistics',
      category: 'Vendor / Supplier Contract',
      docNumber: 'VEND-AGR-APX-2026',
      issuer: 'Apex Tech & Logistics Solutions Pvt Ltd',
      issueDate: d(-5),
      expiryDate: d(360),
      isPerpetual: false,
      verificationStatus: 'Pending Verification',
      verifiedBy: '',
      verifiedAt: '',
      department: 'Operations & Logistics',
      custodian: 'Rahul Verma',
      criticality: 'Medium',
      fileName: 'Apex_Logistics_Master_Service_Agreement_Signed.pdf',
      fileSize: '2.1 MB',
      notes: 'Countersigned copy received via courier. Awaiting legal compliance verification.',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'DOC-0107',
      title: 'ISO 27001:2022 Information Security Management Certification',
      category: 'ISO & Quality Certification',
      docNumber: 'BSI-ISMS-77401',
      issuer: 'British Standards Institution (BSI India)',
      issueDate: d(-200),
      expiryDate: d(530),
      isPerpetual: false,
      verificationStatus: 'Verified',
      verifiedBy: 'Vikramaditya Sharma',
      verifiedAt: d(-195),
      department: 'Information Technology',
      custodian: 'Vikramaditya Sharma',
      criticality: 'High',
      fileName: 'ISO_27001_ISMS_Certification_BSI.pdf',
      fileSize: '1.9 MB',
      notes: 'Surveillance audit scheduled for November 2026',
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
    },
    {
      id: 'DOC-0108',
      title: 'Annual Plant Pest Control & Hygiene Sanitary Certificate',
      category: 'Trade & Factory License',
      docNumber: 'HYG-SAN-2025-09',
      issuer: 'State Public Health & Hygiene Directorate',
      issueDate: d(-380),
      expiryDate: d(-15), // Expired 15 days ago!
      isPerpetual: false,
      verificationStatus: 'Verified',
      verifiedBy: 'Ananya Roy',
      verifiedAt: d(-375),
      department: 'Operations & Logistics',
      custodian: 'Sunil Verma',
      criticality: 'Medium',
      fileName: 'Plant_Hygiene_Certificate.pdf',
      fileSize: '890 KB',
      notes: 'Renewal inspection completed yesterday, waiting for fresh certificate issue.',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    }
  ];

  const initialSubs = [
    {
      id: 'SUB-0201',
      serviceName: 'Google Workspace Enterprise',
      category: 'Collaboration & Communication',
      provider: 'Google Cloud India / MediaAgility',
      planName: 'Enterprise Plus (75 Licenses)',
      billingCycle: 'Yearly',
      amount: 145000,
      currency: 'INR',
      nextRenewalDate: d(18), // Due in 18 days!
      nextPaymentDueDate: d(15), // Due in 15 days!
      paymentStatus: 'Payment Due',
      autoRenew: true,
      paymentMethod: 'Corporate Credit Card',
      assignedDepartment: 'Information Technology',
      owner: 'Vikramaditya Sharma',
      loginUrl: 'https://admin.google.com',
      seatsCount: 75,
      status: 'Active',
      description: 'Primary corporate emails, Google Meet, 5TB Drive storage per user',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
    },
    {
      id: 'SUB-0202',
      serviceName: 'AWS Cloud Hosting (Production & Staging)',
      category: 'Cloud Infrastructure & Hosting',
      provider: 'Amazon Web Services Inc.',
      planName: 'Dedicated EC2, RDS Aurora & S3 Bucket',
      billingCycle: 'Monthly',
      amount: 48500,
      currency: 'INR',
      nextRenewalDate: d(5), // Due in 5 days!
      nextPaymentDueDate: d(5),
      paymentStatus: 'Payment Due',
      autoRenew: true,
      paymentMethod: 'Auto-Debit Net Banking',
      assignedDepartment: 'Information Technology',
      owner: 'Vikramaditya Sharma',
      loginUrl: 'https://aws.amazon.com/console',
      seatsCount: 1,
      status: 'Active',
      description: 'Production web application hosting, databases, daily backup snapshots',
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString()
    },
    {
      id: 'SUB-0203',
      serviceName: 'GitHub Enterprise Cloud',
      category: 'Software Development & Git Tools',
      provider: 'GitHub Inc.',
      planName: 'Enterprise Cloud (30 Seats)',
      billingCycle: 'Yearly',
      amount: 72000,
      currency: 'INR',
      nextRenewalDate: d(120),
      nextPaymentDueDate: d(120),
      paymentStatus: 'Paid',
      autoRenew: true,
      paymentMethod: 'Corporate Credit Card',
      assignedDepartment: 'Information Technology',
      owner: 'Vikramaditya Sharma',
      loginUrl: 'https://github.com/enterprises',
      seatsCount: 30,
      status: 'Active',
      description: 'Code repositories, CI/CD Actions, automated vulnerability scanning',
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString()
    },
    {
      id: 'SUB-0204',
      serviceName: 'Figma Organization Suite',
      category: 'Design & Creative Suite',
      provider: 'Figma Inc.',
      planName: 'Organization Tier (12 Full Design Seats)',
      billingCycle: 'Monthly',
      amount: 18200,
      currency: 'INR',
      nextRenewalDate: d(8), // Due in 8 days!
      nextPaymentDueDate: d(8),
      paymentStatus: 'Payment Due',
      autoRenew: true,
      paymentMethod: 'Corporate Credit Card',
      assignedDepartment: 'Sales & Marketing',
      owner: 'Ananya Roy',
      loginUrl: 'https://www.figma.com',
      seatsCount: 12,
      status: 'Active',
      description: 'UI/UX product design, interactive prototypes, design system libraries',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'SUB-0205',
      serviceName: 'Zoom Workplace Enterprise Video Conferencing',
      category: 'Collaboration & Communication',
      provider: 'Zoom Video Communications',
      planName: 'Business Plan (20 Licensed Hosts)',
      billingCycle: 'Yearly',
      amount: 38400,
      currency: 'INR',
      nextRenewalDate: d(-8), // Expired 8 days ago!
      nextPaymentDueDate: d(-8),
      paymentStatus: 'Overdue',
      autoRenew: false,
      paymentMethod: 'Invoice / Bank NEFT',
      assignedDepartment: 'Human Resources',
      owner: 'Pooja Iyer',
      loginUrl: 'https://zoom.us',
      seatsCount: 20,
      status: 'Expired',
      description: 'Meeting duration capped to 40 mins due to lapsed subscription! Needs urgent payment.',
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
    },
    {
      id: 'SUB-0206',
      serviceName: 'Corporate Domain Registrations & SSL (GoDaddy)',
      category: 'Domain & DNS Management',
      provider: 'GoDaddy India Domains',
      planName: '5 Brand Domains + Wildcard SSL Certs',
      billingCycle: 'Yearly',
      amount: 24500,
      currency: 'INR',
      nextRenewalDate: d(22), // Due in 22 days!
      nextPaymentDueDate: d(20),
      paymentStatus: 'Payment Due',
      autoRenew: false,
      paymentMethod: 'Corporate Net Banking',
      assignedDepartment: 'Information Technology',
      owner: 'Vikramaditya Sharma',
      loginUrl: 'https://godaddy.com',
      seatsCount: 5,
      status: 'Active',
      description: 'Primary corporate domains + SAN SSL certificates',
      createdAt: new Date(Date.now() - 50 * 86400000).toISOString()
    }
  ];

  const initialPayments = [
    {
      id: 'PAY-0501',
      subscriptionId: 'SUB-0203',
      serviceName: 'GitHub Enterprise Cloud',
      amount: 72000,
      paymentDate: d(-90),
      invoiceNumber: 'INV-GH-2026-9901',
      paymentMode: 'Corporate Credit Card',
      transactionRef: 'TXN-HDFC-99120',
      periodCovered: '1 Year (2026 - 2027)',
      paidBy: 'Pooja Iyer',
      remarks: 'Annual renewal processed smoothly',
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString()
    },
    {
      id: 'PAY-0502',
      subscriptionId: 'SUB-0202',
      serviceName: 'AWS Cloud Hosting (Production & Staging)',
      amount: 47200,
      paymentDate: d(-25),
      invoiceNumber: 'INV-AWS-8891024',
      paymentMode: 'Auto-Debit Net Banking',
      transactionRef: 'ACH-SBI-440192',
      periodCovered: '1 Month',
      paidBy: 'Auto-Debit Scheduled',
      remarks: 'Monthly consumption bill paid',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 'PAY-0503',
      subscriptionId: 'SUB-0204',
      serviceName: 'Figma Organization Suite',
      amount: 18200,
      paymentDate: d(-22),
      invoiceNumber: 'INV-FIGMA-33910',
      paymentMode: 'Corporate Credit Card',
      transactionRef: 'CC-HDFC-88190',
      periodCovered: '1 Month',
      paidBy: 'Vikramaditya Sharma',
      remarks: 'Design team monthly seat billing',
      createdAt: new Date(Date.now() - 22 * 86400000).toISOString()
    }
  ];

  const initialLogs = [
    {
      id: 'LOG-001',
      action: 'Verified',
      entityType: 'Document',
      entityId: 'DOC-0107',
      title: 'ISO 27001 ISMS Certification Approved',
      details: 'Audit report reviewed and verified valid until 2027',
      performedBy: 'Vikramaditya Sharma',
      timestamp: new Date(Date.now() - 8 * 86400000).toISOString()
    },
    {
      id: 'LOG-002',
      action: 'Expiry Alert',
      entityType: 'Document',
      entityId: 'DOC-0104',
      title: 'Fire & Asset Insurance Due in 15 Days',
      details: 'Automated notification triggered to Finance & Compliance',
      performedBy: 'System Automation',
      timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'LOG-003',
      action: 'Payment Overdue',
      entityType: 'Subscription',
      entityId: 'SUB-0205',
      title: 'Zoom Enterprise Video Lapsed',
      details: 'Annual renewal invoice not settled; service features downgraded',
      performedBy: 'System Automation',
      timestamp: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ];

  setDocSubData(DOC_SUB_KEYS.DOCUMENTS, initialDocs);
  setDocSubData(DOC_SUB_KEYS.SUBSCRIPTIONS, initialSubs);
  setDocSubData(DOC_SUB_KEYS.PAYMENTS, initialPayments);
  setDocSubData(DOC_SUB_KEYS.AUDIT_LOGS, initialLogs);
  localStorage.setItem(DOC_SUB_KEYS.DOC_COUNTER, '108');
  localStorage.setItem(DOC_SUB_KEYS.SUB_COUNTER, '206');
  localStorage.setItem(DOC_SUB_KEYS.PAY_COUNTER, '503');
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
