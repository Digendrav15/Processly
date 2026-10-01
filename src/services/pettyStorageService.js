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

// Initialize Clean Petty Data (Desktop Local & Supabase Ready)
export function initPettyData() {
  const seeded = localStorage.getItem(PETTY_KEYS.SEEDED);
  if (seeded === 'true') return;

  if (!localStorage.getItem(PETTY_KEYS.CHEQUES)) {
    setPettyData(PETTY_KEYS.CHEQUES, []);
  }
  if (!localStorage.getItem(PETTY_KEYS.TRANSACTIONS)) {
    setPettyData(PETTY_KEYS.TRANSACTIONS, []);
  }
  localStorage.setItem(PETTY_KEYS.TXN_COUNTER, '100');
  localStorage.setItem(PETTY_KEYS.CHQ_COUNTER, '200');
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
