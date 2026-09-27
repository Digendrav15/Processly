/**
 * Petty Expenses & Cheque Lifecycle Storage Service
 * Handles:
 * - Petty Cash Inflow (Amount Received)
 * - Petty Cash Outflow (Expenses / Outgoings)
 * - Cheque Tracker with Deposit Tracking & Auto-clearing into Received (In) or Outgoing (Out) ledgers.
 */

export const PETTY_KEYS = {
  TRANSACTIONS: 'petty_transactions',
  CHEQUES: 'petty_cheques',
  SETTINGS: 'petty_settings',
  TXN_COUNTER: 'petty_txn_counter',
  CHQ_COUNTER: 'petty_chq_counter',
  SEEDED: 'petty_seeded_v2'
};

// Dispatch storage update
export function notifyPettyUpdate(key = 'ALL') {
  window.dispatchEvent(new CustomEvent('petty_storage_update', { detail: { key } }));
}

// LocalStorage helpers
export function getPettyData(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'null' || raw === 'undefined') return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
    return defaultValue;
  }
}

export function setPettyData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyPettyUpdate(key);
    return true;
  } catch (err) {
    console.error(`Error saving ${key} to LocalStorage:`, err);
    return false;
  }
}

// Sequential ID Generators
export function generateTxnId() {
  const counter = parseInt(localStorage.getItem(PETTY_KEYS.TXN_COUNTER) || '100', 10) + 1;
  localStorage.setItem(PETTY_KEYS.TXN_COUNTER, counter.toString());
  return `TXN-${counter.toString().padStart(4, '0')}`;
}

export function generateVoucherNo(type = 'incoming') {
  const counter = parseInt(localStorage.getItem(PETTY_KEYS.TXN_COUNTER) || '100', 10);
  const prefix = type === 'incoming' ? 'RCV' : 'EXP';
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${counter.toString().padStart(4, '0')}`;
}

export function generateChequeId() {
  const counter = parseInt(localStorage.getItem(PETTY_KEYS.CHQ_COUNTER) || '200', 10) + 1;
  localStorage.setItem(PETTY_KEYS.CHQ_COUNTER, counter.toString());
  return `CHQ-${counter.toString().padStart(4, '0')}`;
}

// Standard Categories
export const INCOMING_CATEGORIES = [
  'Imprest Top-up',
  'Owner / Director Inflow',
  'Bank Cash Withdrawal',
  'Client Direct Payment',
  'Staff Advance Return',
  'Scrap / Asset Sale',
  'Cheque Clearance Inflow',
  'Miscellaneous Inflow'
];

export const OUTGOING_CATEGORIES = [
  'Office Tea & Refreshments',
  'Stationery & Printing',
  'Local Conveyance & Travel',
  'Courier & Postal Charges',
  'Office Maintenance & Repairs',
  'Electricity & Utility Bills',
  'Daily Wages & Labor Charges',
  'Staff Welfare & Pantry',
  'Cleaning & Sanitation',
  'Hardware & IT Peripherals',
  'Vendor Petty Settlement',
  'Cheque Payment Outflow',
  'Miscellaneous Expense'
];

export const PAYMENT_MODES = ['Cash', 'Online / UPI', 'Bank Transfer', 'Cheque'];

export const DEPOSIT_BANKS = [
  'HDFC Bank - Current A/C #9482',
  'State Bank of India - CA #1120',
  'ICICI Bank - CA #7731',
  'Axis Bank - CA #4055',
  'Punjab National Bank - CA #6201'
];

// Seed initial realistic data
export function initPettyData() {
  const seeded = localStorage.getItem(PETTY_KEYS.SEEDED);
  if (seeded === 'true') return;

  const today = new Date();
  const d = (offsetDays) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offsetDays);
    return dt.toISOString().split('T')[0];
  };

  const initialCheques = [
    {
      id: 'CHQ-0201',
      chequeNo: '489201',
      type: 'received',
      partyName: 'Apex Tech Solutions',
      bankName: 'HDFC Bank',
      branchName: 'Nariman Point, Mumbai',
      amount: 45000,
      chequeDate: d(-4),
      category: 'Client Direct Payment',
      depositStatus: 'Deposited',
      depositDate: d(-2),
      depositBank: 'HDFC Bank - Current A/C #9482',
      depositSlipNo: 'SLIP-8849',
      clearanceStatus: 'Pending',
      clearanceDate: '',
      utrRef: '',
      bounceReason: '',
      bounceDate: '',
      linkedTransactionId: null,
      remarks: 'Quarterly maintenance fee advance cheque',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'CHQ-0202',
      chequeNo: '671240',
      type: 'received',
      partyName: 'Bright Horizon Corp',
      bankName: 'ICICI Bank',
      branchName: 'Sector 62, Noida',
      amount: 25000,
      chequeDate: d(-1),
      category: 'Imprest Top-up',
      depositStatus: 'Not Deposited',
      depositDate: '',
      depositBank: '',
      depositSlipNo: '',
      clearanceStatus: 'Pending',
      clearanceDate: '',
      utrRef: '',
      bounceReason: '',
      bounceDate: '',
      linkedTransactionId: null,
      remarks: 'Cheque received in office safe, pending deposit slip preparation',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'CHQ-0203',
      chequeNo: '109832',
      type: 'issued',
      partyName: 'City Stationery & Paper Mills',
      bankName: 'HDFC Bank - Current A/C #9482',
      branchName: 'Main Branch',
      amount: 14500,
      chequeDate: d(-3),
      category: 'Stationery & Printing',
      depositStatus: 'Presented',
      depositDate: d(-2),
      depositBank: 'HDFC Bank',
      depositSlipNo: '',
      clearanceStatus: 'Pending',
      clearanceDate: '',
      utrRef: '',
      bounceReason: '',
      bounceDate: '',
      linkedTransactionId: null,
      remarks: 'Issued for annual printing papers and files stock',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'CHQ-0204',
      chequeNo: '551980',
      type: 'received',
      partyName: 'Global Logistics Ltd',
      bankName: 'State Bank of India',
      branchName: 'Andheri East',
      amount: 35000,
      chequeDate: d(-10),
      category: 'Imprest Top-up',
      depositStatus: 'Deposited',
      depositDate: d(-8),
      depositBank: 'State Bank of India - CA #1120',
      depositSlipNo: 'SLIP-7721',
      clearanceStatus: 'Cleared',
      clearanceDate: d(-6),
      utrRef: 'UTR-SBI-9938210',
      bounceReason: '',
      bounceDate: '',
      linkedTransactionId: 'TXN-0103',
      remarks: 'Monthly imprest replenishment cheque cleared successfully',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 'CHQ-0205',
      chequeNo: '882044',
      type: 'issued',
      partyName: 'Vanguard Facility Care',
      bankName: 'State Bank of India - CA #1120',
      branchName: 'Main Branch',
      amount: 18000,
      chequeDate: d(-9),
      category: 'Office Maintenance & Repairs',
      depositStatus: 'Presented',
      depositDate: d(-7),
      depositBank: 'State Bank of India',
      depositSlipNo: '',
      clearanceStatus: 'Cleared',
      clearanceDate: d(-5),
      utrRef: 'UTR-VFC-449102',
      bounceReason: '',
      bounceDate: '',
      linkedTransactionId: 'TXN-0104',
      remarks: 'Office deep cleaning and AC servicing contract payment cleared',
      createdAt: new Date(Date.now() - 9 * 86400000).toISOString()
    },
    {
      id: 'CHQ-0206',
      chequeNo: '339105',
      type: 'received',
      partyName: 'Delta Associates',
      bankName: 'Punjab National Bank',
      branchName: 'Connaught Place',
      amount: 15000,
      chequeDate: d(-12),
      category: 'Miscellaneous Inflow',
      depositStatus: 'Deposited',
      depositDate: d(-10),
      depositBank: 'Punjab National Bank - CA #6201',
      depositSlipNo: 'SLIP-6610',
      clearanceStatus: 'Bounced',
      clearanceDate: '',
      utrRef: '',
      bounceReason: 'Insufficient Funds in drawer account',
      bounceDate: d(-7),
      linkedTransactionId: null,
      remarks: 'Party informed, replacement cheque or RTGS requested',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
    }
  ];

  const initialTransactions = [
    {
      id: 'TXN-0101',
      voucherNo: 'RCV-2026-0101',
      type: 'incoming',
      date: d(-14),
      amount: 50000,
      paymentMode: 'Cash',
      category: 'Imprest Top-up',
      partyName: 'Head Office Imprest Fund',
      receivedBy: 'Rajesh Sharma (Cashier)',
      description: 'Opening monthly petty cash replenishment from main bank cash withdrawal',
      billRef: 'BR-2026/041',
      chequeRefId: null,
      status: 'Completed',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
    },
    {
      id: 'TXN-0102',
      voucherNo: 'EXP-2026-0102',
      type: 'outgoing',
      date: d(-12),
      amount: 3200,
      paymentMode: 'Cash',
      category: 'Office Tea & Refreshments',
      partyName: 'Chai Point & Local Bakeries',
      paidBy: 'Sunil Verma',
      description: 'Tea, coffee, sugar, milk and evening biscuits for team pantry',
      billRef: 'INV-CP-892',
      chequeRefId: null,
      status: 'Completed',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
    },
    {
      id: 'TXN-0103',
      voucherNo: 'RCV-CHQ-551980',
      type: 'incoming',
      date: d(-6),
      amount: 35000,
      paymentMode: 'Cheque',
      category: 'Cheque Clearance Inflow',
      partyName: 'Global Logistics Ltd',
      receivedBy: 'Accounts Dept',
      description: 'Auto-credited upon Cheque Clearance #551980 (State Bank of India) deposited in State Bank of India - CA #1120',
      billRef: 'UTR-SBI-9938210',
      chequeRefId: 'CHQ-0204',
      status: 'Completed',
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
    },
    {
      id: 'TXN-0104',
      voucherNo: 'EXP-CHQ-882044',
      type: 'outgoing',
      date: d(-5),
      amount: 18000,
      paymentMode: 'Cheque',
      category: 'Cheque Payment Outflow',
      partyName: 'Vanguard Facility Care',
      paidBy: 'Accounts Dept',
      description: 'Auto-debited upon Cheque Clearance #882044 (State Bank of India - CA #1120) for Office Maintenance & Repairs',
      billRef: 'UTR-VFC-449102',
      chequeRefId: 'CHQ-0205',
      status: 'Completed',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'TXN-0105',
      voucherNo: 'EXP-2026-0105',
      type: 'outgoing',
      date: d(-4),
      amount: 2450,
      paymentMode: 'Online / UPI',
      category: 'Courier & Postal Charges',
      partyName: 'BlueDart Express Ltd',
      paidBy: 'Rajesh Sharma',
      description: 'Urgent legal documents dispatch to regional branches',
      billRef: 'BD-AWB-99201',
      chequeRefId: null,
      status: 'Completed',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'TXN-0106',
      voucherNo: 'EXP-2026-0106',
      type: 'outgoing',
      date: d(-3),
      amount: 4800,
      paymentMode: 'Cash',
      category: 'Local Conveyance & Travel',
      partyName: 'Field Staff Reimbursements',
      paidBy: 'Vikram Singh',
      description: 'Client visit cab and metro fares for sales executive team',
      billRef: 'CONV-CLAIM-014',
      chequeRefId: null,
      status: 'Completed',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'TXN-0107',
      voucherNo: 'RCV-2026-0107',
      type: 'incoming',
      date: d(-2),
      amount: 10000,
      paymentMode: 'Online / UPI',
      category: 'Owner / Director Inflow',
      partyName: 'Director Personal Infusion',
      receivedBy: 'Rajesh Sharma',
      description: 'Direct UPI transfer to meet weekend event petty expenses',
      billRef: 'UPI-DIR-40291',
      chequeRefId: null,
      status: 'Completed',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'TXN-0108',
      voucherNo: 'EXP-2026-0108',
      type: 'outgoing',
      date: d(-1),
      amount: 1850,
      paymentMode: 'Cash',
      category: 'Office Maintenance & Repairs',
      partyName: 'Plumbing Works & Hardware',
      paidBy: 'Sunil Verma',
      description: 'Washroom tap replacement & pantry sink pipeline leak repair',
      billRef: 'HARD-REC-331',
      chequeRefId: null,
      status: 'Completed',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ];

  setPettyData(PETTY_KEYS.CHEQUES, initialCheques);
  setPettyData(PETTY_KEYS.TRANSACTIONS, initialTransactions);
  localStorage.setItem(PETTY_KEYS.TXN_COUNTER, '108');
  localStorage.setItem(PETTY_KEYS.CHQ_COUNTER, '206');
  localStorage.setItem(PETTY_KEYS.SEEDED, 'true');
}

// -------------------------------------------------------------
// Transaction Operations (Cash Book Ledger)
// -------------------------------------------------------------

export function getTransactions() {
  return getPettyData(PETTY_KEYS.TRANSACTIONS, []);
}

export function saveTransaction(txnData) {
  const transactions = getTransactions();
  let updated;

  if (txnData.id) {
    updated = transactions.map((t) => (t.id === txnData.id ? { ...t, ...txnData, updatedAt: new Date().toISOString() } : t));
  } else {
    const id = generateTxnId();
    const voucherNo = txnData.voucherNo || generateVoucherNo(txnData.type);
    const newTxn = {
      ...txnData,
      id,
      voucherNo,
      amount: Number(txnData.amount) || 0,
      status: txnData.status || 'Completed',
      createdAt: new Date().toISOString()
    };
    updated = [newTxn, ...transactions];
  }

  setPettyData(PETTY_KEYS.TRANSACTIONS, updated);
  return updated;
}

export function deleteTransaction(txnId) {
  const transactions = getTransactions();
  const target = transactions.find((t) => t.id === txnId);

  // If this transaction was linked to a cleared cheque, unlink the cheque
  if (target && target.chequeRefId) {
    const cheques = getCheques();
    const updatedCheques = cheques.map((chq) => {
      if (chq.id === target.chequeRefId) {
        return {
          ...chq,
          clearanceStatus: 'Pending',
          clearanceDate: '',
          utrRef: '',
          linkedTransactionId: null
        };
      }
      return chq;
    });
    setPettyData(PETTY_KEYS.CHEQUES, updatedCheques);
  }

  const updated = transactions.filter((t) => t.id !== txnId);
  setPettyData(PETTY_KEYS.TRANSACTIONS, updated);
  return updated;
}

// -------------------------------------------------------------
// Cheque Operations & Tracker Engine
// -------------------------------------------------------------

export function getCheques() {
  return getPettyData(PETTY_KEYS.CHEQUES, []);
}

export function saveCheque(chequeData) {
  const cheques = getCheques();
  let updated;

  if (chequeData.id) {
    updated = cheques.map((c) => (c.id === chequeData.id ? { ...c, ...chequeData, updatedAt: new Date().toISOString() } : c));
  } else {
    const id = generateChequeId();
    const newCheque = {
      ...chequeData,
      id,
      amount: Number(chequeData.amount) || 0,
      depositStatus: chequeData.depositStatus || (chequeData.type === 'received' ? 'Not Deposited' : 'Issued / In Hand'),
      clearanceStatus: chequeData.clearanceStatus || 'Pending',
      linkedTransactionId: null,
      createdAt: new Date().toISOString()
    };
    updated = [newCheque, ...chequeData.clearanceStatus === 'Cleared' ? [] : cheques];
    if (chequeData.clearanceStatus === 'Cleared') {
      // If directly created as cleared, trigger clear logic
      updated = [newCheque, ...cheques];
      setPettyData(PETTY_KEYS.CHEQUES, updated);
      clearCheque(id, {
        clearanceDate: chequeData.clearanceDate || new Date().toISOString().split('T')[0],
        utrRef: chequeData.utrRef || ''
      });
      return getCheques();
    }
  }

  setPettyData(PETTY_KEYS.CHEQUES, updated);
  return updated;
}

export function deleteCheque(chequeId) {
  const cheques = getCheques();
  const chq = cheques.find((c) => c.id === chequeId);

  // If cheque had a linked ledger transaction, remove it as well
  if (chq && chq.linkedTransactionId) {
    const txns = getTransactions().filter((t) => t.id !== chq.linkedTransactionId);
    setPettyData(PETTY_KEYS.TRANSACTIONS, txns);
  }

  const updated = cheques.filter((c) => c.id !== chequeId);
  setPettyData(PETTY_KEYS.CHEQUES, updated);
  return updated;
}

/**
 * Deposit Cheque
 * Marks a received cheque as Deposited in Bank
 */
export function depositCheque(chequeId, { depositDate, depositBank, depositSlipNo = '' }) {
  const cheques = getCheques();
  const updated = cheques.map((chq) => {
    if (chq.id === chequeId) {
      return {
        ...chq,
        depositStatus: chq.type === 'received' ? 'Deposited' : 'Presented',
        depositDate: depositDate || new Date().toISOString().split('T')[0],
        depositBank: depositBank || chq.depositBank || 'HDFC Bank - Current A/C #9482',
        depositSlipNo: depositSlipNo || chq.depositSlipNo || ''
      };
    }
    return chq;
  });

  setPettyData(PETTY_KEYS.CHEQUES, updated);
  return updated;
}

/**
 * Clear Cheque
 * CRITICAL USER REQUIREMENT:
 * "Check Clear Hone Par ' Received , Out ' Me Track Hoga"
 * - If Cheque Type == 'received' -> Automatically posts into 'incoming' (Amount Received)
 * - If Cheque Type == 'issued'   -> Automatically posts into 'outgoing' (Outgoings / Expenses)
 */
export function clearCheque(chequeId, { clearanceDate, utrRef = '' } = {}) {
  const cheques = getCheques();
  const chq = cheques.find((c) => c.id === chequeId);
  if (!chq) return cheques;

  const cDate = clearanceDate || new Date().toISOString().split('T')[0];
  const transactions = getTransactions();

  let linkedTxnId = chq.linkedTransactionId;

  if (chq.type === 'received') {
    // 1. Post to "Amount Received" (Incoming)
    if (!linkedTxnId || !transactions.some((t) => t.id === linkedTxnId)) {
      linkedTxnId = generateTxnId();
      const newTxn = {
        id: linkedTxnId,
        voucherNo: `RCV-CHQ-${chq.chequeNo}`,
        type: 'incoming',
        date: cDate,
        amount: Number(chq.amount),
        paymentMode: 'Cheque',
        category: chq.category || 'Cheque Clearance Inflow',
        partyName: chq.partyName,
        receivedBy: 'Bank Clearance Automation',
        description: `Auto-credited upon Cheque Clearance #${chq.chequeNo} (${chq.bankName})${chq.depositBank ? ` into ${chq.depositBank}` : ''}`,
        billRef: utrRef || `CHQ-${chq.chequeNo}`,
        chequeRefId: chq.id,
        status: 'Completed',
        createdAt: new Date().toISOString()
      };
      transactions.unshift(newTxn);
    } else {
      // Update existing linked transaction if needed
      const idx = transactions.findIndex((t) => t.id === linkedTxnId);
      if (idx !== -1) {
        transactions[idx] = {
          ...transactions[idx],
          amount: Number(chq.amount),
          date: cDate,
          partyName: chq.partyName,
          status: 'Completed'
        };
      }
    }
  } else {
    // 2. Post to "Expenses (Out)" (Outgoing)
    if (!linkedTxnId || !transactions.some((t) => t.id === linkedTxnId)) {
      linkedTxnId = generateTxnId();
      const newTxn = {
        id: linkedTxnId,
        voucherNo: `EXP-CHQ-${chq.chequeNo}`,
        type: 'outgoing',
        date: cDate,
        amount: Number(chq.amount),
        paymentMode: 'Cheque',
        category: chq.category || 'Cheque Payment Outflow',
        partyName: chq.partyName,
        paidBy: 'Bank Clearance Automation',
        description: `Auto-debited upon Cheque Clearance #${chq.chequeNo} (${chq.bankName}) issued to ${chq.partyName}`,
        billRef: utrRef || `CHQ-${chq.chequeNo}`,
        chequeRefId: chq.id,
        status: 'Completed',
        createdAt: new Date().toISOString()
      };
      transactions.unshift(newTxn);
    } else {
      const idx = transactions.findIndex((t) => t.id === linkedTxnId);
      if (idx !== -1) {
        transactions[idx] = {
          ...transactions[idx],
          amount: Number(chq.amount),
          date: cDate,
          partyName: chq.partyName,
          status: 'Completed'
        };
      }
    }
  }

  // Update Cheque record
  const updatedCheques = cheques.map((item) => {
    if (item.id === chequeId) {
      return {
        ...item,
        clearanceStatus: 'Cleared',
        clearanceDate: cDate,
        utrRef: utrRef || item.utrRef || '',
        linkedTransactionId: linkedTxnId,
        // Auto mark deposited if not already
        depositStatus: item.type === 'received' ? 'Deposited' : 'Presented',
        depositDate: item.depositDate || cDate
      };
    }
    return item;
  });

  // Save both
  setPettyData(PETTY_KEYS.TRANSACTIONS, transactions);
  setPettyData(PETTY_KEYS.CHEQUES, updatedCheques);
  return updatedCheques;
}

/**
 * Mark Cheque as Bounced
 * Reverts any created transaction if it was previously marked cleared
 */
export function bounceCheque(chequeId, { bounceDate, bounceReason = '' } = {}) {
  const cheques = getCheques();
  const chq = cheques.find((c) => c.id === chequeId);
  if (!chq) return cheques;

  const bDate = bounceDate || new Date().toISOString().split('T')[0];

  // If this cheque had created an incoming or outgoing transaction, remove it to keep ledger balanced
  if (chq.linkedTransactionId) {
    const transactions = getTransactions().filter((t) => t.id !== chq.linkedTransactionId);
    setPettyData(PETTY_KEYS.TRANSACTIONS, transactions);
  }

  const updatedCheques = cheques.map((item) => {
    if (item.id === chequeId) {
      return {
        ...item,
        clearanceStatus: 'Bounced',
        bounceDate: bDate,
        bounceReason: bounceReason || 'Cheque Returned / Insufficient Funds',
        linkedTransactionId: null
      };
    }
    return item;
  });

  setPettyData(PETTY_KEYS.CHEQUES, updatedCheques);
  return updatedCheques;
}

/**
 * Revert Cheque to Pending
 */
export function revertChequeToPending(chequeId) {
  const cheques = getCheques();
  const chq = cheques.find((c) => c.id === chequeId);
  if (!chq) return cheques;

  if (chq.linkedTransactionId) {
    const transactions = getTransactions().filter((t) => t.id !== chq.linkedTransactionId);
    setPettyData(PETTY_KEYS.TRANSACTIONS, transactions);
  }

  const updatedCheques = cheques.map((item) => {
    if (item.id === chequeId) {
      return {
        ...item,
        clearanceStatus: 'Pending',
        clearanceDate: '',
        bounceDate: '',
        bounceReason: '',
        linkedTransactionId: null
      };
    }
    return item;
  });

  setPettyData(PETTY_KEYS.CHEQUES, updatedCheques);
  return updatedCheques;
}

// -------------------------------------------------------------
// Metric Aggregators & Calculations
// -------------------------------------------------------------

export function getPettySummary() {
  const transactions = getTransactions();
  const cheques = getCheques();

  // Completed transactions
  const activeTxns = transactions.filter((t) => t.status !== 'Cancelled');

  const incomingTxns = activeTxns.filter((t) => t.type === 'incoming');
  const outgoingTxns = activeTxns.filter((t) => t.type === 'outgoing');

  const totalReceived = incomingTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalOutgoings = outgoingTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netBalance = totalReceived - totalOutgoings;

  // Cheque Metrics
  const receivedCheques = cheques.filter((c) => c.type === 'received');
  const issuedCheques = cheques.filter((c) => c.type === 'issued');

  // Undeposited Cheques In-Hand (Received Cheques where depositStatus === 'Not Deposited')
  const undepositedInHand = receivedCheques.filter(
    (c) => c.depositStatus === 'Not Deposited' && c.clearanceStatus !== 'Cancelled'
  );
  const undepositedAmount = undepositedInHand.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  // Deposited awaiting clearance (In clearing pipeline)
  const inClearingReceived = receivedCheques.filter(
    (c) => c.depositStatus === 'Deposited' && c.clearanceStatus === 'Pending'
  );
  const inClearingReceivedAmount = inClearingReceived.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const inClearingIssued = issuedCheques.filter((c) => c.clearanceStatus === 'Pending');
  const inClearingIssuedAmount = inClearingIssued.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  // Cleared Cheques
  const clearedReceived = receivedCheques.filter((c) => c.clearanceStatus === 'Cleared');
  const clearedReceivedAmount = clearedReceived.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const clearedIssued = issuedCheques.filter((c) => c.clearanceStatus === 'Cleared');
  const clearedIssuedAmount = clearedIssued.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  // Bounced Cheques
  const bouncedCheques = cheques.filter((c) => c.clearanceStatus === 'Bounced');
  const bouncedAmount = bouncedCheques.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  // Cash In Hand vs Bank/Digital
  const cashReceived = incomingTxns.filter((t) => t.paymentMode === 'Cash').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const cashSpent = outgoingTxns.filter((t) => t.paymentMode === 'Cash').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const cashInHand = cashReceived - cashSpent;

  return {
    netBalance,
    totalReceived,
    totalOutgoings,
    cashInHand,
    totalTxnCount: activeTxns.length,
    incomingCount: incomingTxns.length,
    outgoingCount: outgoingTxns.length,

    // Cheques
    totalChequesCount: cheques.length,
    undepositedCount: undepositedInHand.length,
    undepositedAmount,
    inClearingReceivedCount: inClearingReceived.length,
    inClearingReceivedAmount,
    inClearingIssuedCount: inClearingIssued.length,
    inClearingIssuedAmount,
    clearedReceivedCount: clearedReceived.length,
    clearedReceivedAmount,
    clearedIssuedCount: clearedIssued.length,
    clearedIssuedAmount,
    bouncedCount: bouncedCheques.length,
    bouncedAmount,

    // Action items requiring user attention
    pendingActionCount: undepositedInHand.length + inClearingReceived.length + inClearingIssued.length
  };
}
