/**
 * Purchase System Storage Service
 * Pure LocalStorage driven implementation with reactive event dispatching.
 */

export const PURCHASE_STORAGE_KEYS = {
  INDENTS: 'purchase_indents',
  COUNTER: 'purchase_indent_counter',
  PO_COUNTER: 'purchase_po_counter',
  GRN_COUNTER: 'purchase_grn_counter',
};

export const PURCHASE_STAGE_ORDER = [
  'Purchase Indent',
  'Indent Approval',
  'PO',
  'Material Lifting / Dispatch',
  'Material Delivery',
  'Material Receiving',
  'Quality Check',
  'GRN',
  'Payment'
];

export function getPurchaseData(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
    return defaultValue;
  }
}

export function notifyPurchaseUpdate(key = 'ALL') {
  window.dispatchEvent(new CustomEvent('purchase_storage_update', { detail: { key } }));
}

export function setPurchaseData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyPurchaseUpdate(key);
    return true;
  } catch (err) {
    console.error(`Error saving ${key} to LocalStorage:`, err);
    return false;
  }
}

export function generateIndentNumber() {
  const counter = parseInt(localStorage.getItem(PURCHASE_STORAGE_KEYS.COUNTER) || '100', 10) + 1;
  localStorage.setItem(PURCHASE_STORAGE_KEYS.COUNTER, counter.toString());
  return `IND-${counter.toString().padStart(4, '0')}`;
}

export function generatePONumber() {
  const counter = parseInt(localStorage.getItem(PURCHASE_STORAGE_KEYS.PO_COUNTER) || '200', 10) + 1;
  localStorage.setItem(PURCHASE_STORAGE_KEYS.PO_COUNTER, counter.toString());
  return `PO-2026-${counter.toString().padStart(4, '0')}`;
}

export function generateGRNNumber() {
  const counter = parseInt(localStorage.getItem(PURCHASE_STORAGE_KEYS.GRN_COUNTER) || '500', 10) + 1;
  localStorage.setItem(PURCHASE_STORAGE_KEYS.GRN_COUNTER, counter.toString());
  return `GRN-${counter.toString().padStart(4, '0')}`;
}

// Complete Purchase Stage & Advance to Next Stage
export function advancePurchaseStage(indentId, updatedStageData, remarks = '') {
  const indents = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const index = indents.findIndex((item) => item.id === indentId || item.indentNumber === indentId);
  if (index === -1) return null;

  const item = indents[index];
  const nowStr = new Date().toISOString();
  const currentStageName = item.currentStage || 'Purchase Indent';

  // Identify next stage
  let nextStageName = currentStageName;
  let isCompleted = false;

  if (updatedStageData?.nextStage) {
    nextStageName = updatedStageData.nextStage;
  } else {
    const currentIdx = PURCHASE_STAGE_ORDER.findIndex(
      (s) => s.toLowerCase() === currentStageName.toLowerCase()
    );
    if (currentIdx >= 0 && currentIdx < PURCHASE_STAGE_ORDER.length - 1) {
      nextStageName = PURCHASE_STAGE_ORDER[currentIdx + 1];
    } else if (currentIdx === PURCHASE_STAGE_ORDER.length - 1) {
      nextStageName = 'Completed';
      isCompleted = true;
    }
  }

  // Update stage details audit trail
  const stageDetails = item.stageDetails || {};
  stageDetails[currentStageName] = {
    completedAt: nowStr,
    completedBy: updatedStageData?.actionBy || 'System Admin',
    remarks: remarks || updatedStageData?.remarks || 'Stage Completed',
    payload: updatedStageData
  };

  const updatedIndent = {
    ...item,
    ...updatedStageData,
    currentStage: isCompleted ? 'Completed' : nextStageName,
    stageDetails,
    updatedAt: nowStr,
    status: isCompleted ? 'Procurement Closed' : (updatedStageData?.status || `${nextStageName} Pending`)
  };

  indents[index] = updatedIndent;
  setPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, indents);
  return updatedIndent;
}

export function initializePurchaseData() {
  const existing = localStorage.getItem(PURCHASE_STORAGE_KEYS.INDENTS);
  if (!existing || existing === 'null' || existing === 'undefined') {
    setPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
  }
}

export const initPurchaseData = initializePurchaseData;

// Ensure initial purchase data is seeded
initializePurchaseData();

