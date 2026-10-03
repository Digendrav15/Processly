/**
 * Inventory Management Storage & Workflow Service
 * Pure LocalStorage driven implementation with reactive event dispatching.
 * Auto calculates In/Out from Purchase System & Order To Delivery (Sales) modules,
 * supports manual stock adjustments, and generates indents for items below reorder level.
 */

import { getPurchaseData, PURCHASE_STORAGE_KEYS, setPurchaseData, generateIndentNumber } from './purchaseStorageService';
import { getData as getOTDData, STORAGE_KEYS as OTD_KEYS } from './otdStorageService';

export const INV_KEYS = {
  ITEMS: 'inv_stock_items',
  TRANSACTIONS: 'inv_transactions',
  ADJUSTMENTS: 'inv_adjustments',
  INDENTS: 'inv_indents',
  WAREHOUSES: 'inv_warehouses',
  SEEDED: 'inv_seeded_v2',
  ITEM_COUNTER: 'inv_item_counter',
  TXN_COUNTER: 'inv_txn_counter',
  ADJ_COUNTER: 'inv_adj_counter',
  INDENT_COUNTER: 'inv_indent_counter'
};

export const ITEM_CATEGORIES = [
  'Raw Materials',
  'Finished Goods',
  'Packaging Materials',
  'Spare Parts & Consumables',
  'Tools & Equipment',
  'Goods'
];

export const ITEM_UNITS = ['Pcs', 'Kg', 'Mtr', 'Ltr', 'Box', 'Set', 'Roll', 'Bag'];

// Initial Seed Data with Master Columns:
// [Item Name, Category, Average Daily Consumption, Lead Time (Days), Safety Factor, MOQ, Max Level]
const INITIAL_ITEMS = [
  {
    id: 'ITEM-1001',
    code: 'SKU-ALU-ROD-20',
    name: 'Industrial Aluminum Rod 20mm',
    category: 'Raw Materials',
    unit: 'Kg',
    avgDailyConsumption: 25,
    leadTimeDays: 10,
    safetyFactor: 1.2,
    moq: 200,
    maxLevel: 1000,
    currentStock: 480,
    initialStock: 480,
    unitPrice: 340,
    locationRack: 'Shed 2 - Rack B-04',
    status: 'In Stock',
    createdAt: '2026-09-10T10:00:00Z',
    lastUpdated: '2026-10-01T14:20:00Z'
  },
  {
    id: 'ITEM-1002',
    code: 'SKU-SS-BOLT-M8',
    name: 'Stainless Steel Hex Bolts M8 x 40mm',
    category: 'Spare Parts & Consumables',
    unit: 'Box',
    avgDailyConsumption: 8,
    leadTimeDays: 7,
    safetyFactor: 1.25,
    moq: 100,
    maxLevel: 300,
    currentStock: 45, // ROL = 8 * 7 * 1.25 = 70 -> 45 is LOW STOCK!
    initialStock: 45,
    unitPrice: 450,
    locationRack: 'Main - Bin C-12',
    status: 'Low Stock',
    createdAt: '2026-09-12T11:30:00Z',
    lastUpdated: '2026-10-02T09:15:00Z'
  },
  {
    id: 'ITEM-1003',
    code: 'SKU-BOX-CORR-L',
    name: 'Heavy Duty 5-Ply Corrugated Cartons (Large)',
    category: 'Packaging Materials',
    unit: 'Pcs',
    avgDailyConsumption: 60,
    leadTimeDays: 5,
    safetyFactor: 1.15,
    moq: 500,
    maxLevel: 2500,
    currentStock: 850,
    initialStock: 850,
    unitPrice: 38,
    locationRack: 'Main - Bay P-01',
    status: 'In Stock',
    createdAt: '2026-09-15T09:00:00Z',
    lastUpdated: '2026-10-01T16:00:00Z'
  },
  {
    id: 'ITEM-1004',
    code: 'SKU-VALVE-BALL-2IN',
    name: 'Brass Ball Valve 2-Inch High Pressure',
    category: 'Finished Goods',
    unit: 'Pcs',
    avgDailyConsumption: 5,
    leadTimeDays: 14,
    safetyFactor: 1.3,
    moq: 50,
    maxLevel: 250,
    currentStock: 120,
    initialStock: 120,
    unitPrice: 1250,
    locationRack: 'FG - Rack F-08',
    status: 'In Stock',
    createdAt: '2026-09-18T14:45:00Z',
    lastUpdated: '2026-10-02T11:00:00Z'
  },
  {
    id: 'ITEM-1005',
    code: 'SKU-HYD-OIL-68',
    name: 'Industrial Hydraulic Oil ISO VG 68 (20L Drum)',
    category: 'Spare Parts & Consumables',
    unit: 'Ltr',
    avgDailyConsumption: 6,
    leadTimeDays: 8,
    safetyFactor: 1.25,
    moq: 40,
    maxLevel: 200,
    currentStock: 30, // ROL = 6 * 8 * 1.25 = 60 -> 30 is LOW STOCK!
    initialStock: 30,
    unitPrice: 220,
    locationRack: 'Shed 2 - Drum Yard D-1',
    status: 'Low Stock',
    createdAt: '2026-09-20T10:15:00Z',
    lastUpdated: '2026-10-02T10:30:00Z'
  },
  {
    id: 'ITEM-1006',
    code: 'SKU-PUMP-SUB-1HP',
    name: 'Submersible Water Pump 1HP Heavy Cast',
    category: 'Finished Goods',
    unit: 'Set',
    avgDailyConsumption: 2,
    leadTimeDays: 15,
    safetyFactor: 1.2,
    moq: 15,
    maxLevel: 80,
    currentStock: 0, // 0 is OUT OF STOCK / CRITICAL!
    initialStock: 0,
    unitPrice: 7800,
    locationRack: 'FG - Floor Area G',
    status: 'Out of Stock',
    createdAt: '2026-09-22T13:00:00Z',
    lastUpdated: '2026-10-01T18:00:00Z'
  },
  {
    id: 'ITEM-1007',
    code: 'SKU-COPPER-WIRE-4SQ',
    name: 'Industrial Insulated Copper Wire 4 sq mm',
    category: 'Raw Materials',
    unit: 'Roll',
    avgDailyConsumption: 4,
    leadTimeDays: 7,
    safetyFactor: 1.25,
    moq: 20,
    maxLevel: 150,
    currentStock: 65,
    initialStock: 65,
    unitPrice: 2150,
    locationRack: 'Shed 2 - Rack W-02',
    status: 'In Stock',
    createdAt: '2026-09-25T15:30:00Z',
    lastUpdated: '2026-10-02T12:00:00Z'
  }
];

const INITIAL_MANUAL_ADJUSTMENTS = [
  {
    id: 'ADJ-1001',
    type: 'INWARD',
    itemId: 'ITEM-1001',
    itemName: 'Industrial Aluminum Rod 20mm',
    quantity: 50,
    unit: 'Kg',
    reason: 'Opening Balance Correction',
    referenceNo: 'PHY-AUDIT-2026-09',
    remarks: 'Physical stock physical audit matched and adjusted',
    date: '2026-09-30T10:00:00Z',
    performedBy: 'Store Manager'
  },
  {
    id: 'ADJ-1002',
    type: 'OUTWARD',
    itemId: 'ITEM-1005',
    itemName: 'Industrial Hydraulic Oil ISO VG 68 (20L Drum)',
    quantity: 2,
    unit: 'Ltr',
    reason: 'Damaged / Scrap',
    referenceNo: 'SCRAP-LOG-441',
    remarks: 'Drum seal leaked during shifting. Scrapped.',
    date: '2026-10-01T15:30:00Z',
    performedBy: 'Quality Inspector'
  }
];

// Helper to get raw data
export function getInvData(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
    return defaultValue;
  }
}

// Reactive notify
export function notifyInventoryUpdate(key = 'ALL') {
  window.dispatchEvent(new CustomEvent('inventory_storage_update', { detail: { key } }));
}

// Set data
export function setInvData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyInventoryUpdate(key);
    return true;
  } catch (err) {
    console.error(`Error saving ${key} to LocalStorage:`, err);
    return false;
  }
}

// Seed Initial Inventory Data
export function initInventorySeedData() {
  if (!localStorage.getItem(INV_KEYS.SEEDED)) {
    if (!localStorage.getItem(INV_KEYS.ITEMS)) {
      setInvData(INV_KEYS.ITEMS, INITIAL_ITEMS);
    }
    if (!localStorage.getItem(INV_KEYS.ADJUSTMENTS)) {
      setInvData(INV_KEYS.ADJUSTMENTS, INITIAL_MANUAL_ADJUSTMENTS);
    }
    if (!localStorage.getItem(INV_KEYS.INDENTS)) {
      setInvData(INV_KEYS.INDENTS, []);
    }
    localStorage.setItem(INV_KEYS.SEEDED, 'true');
    localStorage.setItem(INV_KEYS.ITEM_COUNTER, '1008');
    localStorage.setItem(INV_KEYS.ADJ_COUNTER, '1003');
    localStorage.setItem(INV_KEYS.INDENT_COUNTER, '1001');
  }
}

// ID Generators
export function generateItemId() {
  const counter = parseInt(localStorage.getItem(INV_KEYS.ITEM_COUNTER) || '1000', 10) + 1;
  localStorage.setItem(INV_KEYS.ITEM_COUNTER, counter.toString());
  return `ITEM-${counter}`;
}

export function generateAdjustmentId() {
  const counter = parseInt(localStorage.getItem(INV_KEYS.ADJ_COUNTER) || '1000', 10) + 1;
  localStorage.setItem(INV_KEYS.ADJ_COUNTER, counter.toString());
  return `ADJ-${counter}`;
}

export function generateInvIndentId() {
  const counter = parseInt(localStorage.getItem(INV_KEYS.INDENT_COUNTER) || '1000', 10) + 1;
  localStorage.setItem(INV_KEYS.INDENT_COUNTER, counter.toString());
  return `IND-INV-${counter}`;
}

// Compute Reorder Level (ROL)
export function calculateReorderLevel(adc, leadTimeDays, safetyFactor = 1.2) {
  const val = (Number(adc) || 0) * (Number(leadTimeDays) || 0) * (Number(safetyFactor) || 1.2);
  return Math.max(1, Math.ceil(val));
}

// Get Items with live stock & reorder levels
export function getInventoryItems() {
  initInventorySeedData();
  const rawItems = getInvData(INV_KEYS.ITEMS, []);
  const manualAdjustments = getInvData(INV_KEYS.ADJUSTMENTS, []);

  // Compute manual adjustment deltas per item
  const adjustmentDeltas = {};
  manualAdjustments.forEach((adj) => {
    const itId = adj.itemId || adj.itemName;
    if (!itId) return;
    const qty = Number(adj.quantity) || 0;
    if (!adjustmentDeltas[itId]) adjustmentDeltas[itId] = 0;
    if (adj.type === 'INWARD') {
      adjustmentDeltas[itId] += qty;
    } else {
      adjustmentDeltas[itId] -= qty;
    }
  });

  return rawItems.map((item) => {
    const adc = Number(item.avgDailyConsumption) || 0;
    const leadTime = Number(item.leadTimeDays) || 0;
    const safety = Number(item.safetyFactor) || 1.2;
    const moq = Number(item.moq) || 1;
    const maxLevel = Number(item.maxLevel) || Math.max(100, (adc * leadTime * safety * 3));
    const reorderLevel = calculateReorderLevel(adc, leadTime, safety);

    const baseStock = Number(item.initialStock !== undefined ? item.initialStock : item.currentStock) || 0;
    const manualDelta = (adjustmentDeltas[item.id] || 0) + (adjustmentDeltas[item.name] || 0);

    const effectiveStock = Math.max(0, baseStock + manualDelta);

    let status = 'In Stock';
    if (effectiveStock <= 0) {
      status = 'Out of Stock';
    } else if (effectiveStock <= reorderLevel) {
      status = 'Low Stock';
    }

    const shortfall = Math.max(0, maxLevel - effectiveStock);
    const suggestedIndentQty = effectiveStock <= reorderLevel ? Math.max(moq, shortfall) : 0;

    return {
      ...item,
      avgDailyConsumption: adc,
      leadTimeDays: leadTime,
      safetyFactor: safety,
      moq,
      maxLevel,
      reorderLevel,
      currentStock: effectiveStock,
      status,
      shortfall,
      suggestedIndentQty
    };
  });
}

// Save or Update Item
export function saveInventoryItem(itemData) {
  const items = getInvData(INV_KEYS.ITEMS, []);
  const nowStr = new Date().toISOString();

  const adc = Number(itemData.avgDailyConsumption) || 0;
  const leadTime = Number(itemData.leadTimeDays) || 0;
  const safety = Number(itemData.safetyFactor) || 1.2;
  const moq = Number(itemData.moq) || 1;
  const maxLevel = Number(itemData.maxLevel) || 500;
  const reorderLevel = calculateReorderLevel(adc, leadTime, safety);

  const payload = {
    ...itemData,
    code: itemData.code || itemData.sku || `SKU-${Date.now().toString().slice(-6)}`,
    name: itemData.name.trim(),
    category: itemData.category || 'Goods',
    unit: itemData.unit || 'Pcs',
    avgDailyConsumption: adc,
    leadTimeDays: leadTime,
    safetyFactor: safety,
    moq,
    maxLevel,
    reorderLevel,
    initialStock: Number(itemData.initialStock !== undefined ? itemData.initialStock : itemData.currentStock) || 0,
    currentStock: Number(itemData.currentStock) || 0,
    unitPrice: Number(itemData.unitPrice || itemData.defaultRate) || 0,
    lastUpdated: nowStr
  };

  let updated;
  if (itemData.id) {
    updated = items.map((i) => (i.id === itemData.id ? { ...i, ...payload } : i));
  } else {
    payload.id = generateItemId();
    payload.createdAt = nowStr;
    updated = [payload, ...items];
  }

  setInvData(INV_KEYS.ITEMS, updated);
  return payload;
}

// Synchronize Master Products with Inventory Items
export function syncMasterProductWithInventory(product) {
  if (!product || !product.name) return;
  const items = getInvData(INV_KEYS.ITEMS, []);
  const existing = items.find((i) => i.id === product.id || i.name.toLowerCase() === product.name.toLowerCase());

  const itemPayload = {
    id: existing?.id || product.id,
    code: product.code || existing?.code,
    name: product.name,
    category: product.category || 'Goods',
    unit: product.unit || 'Pcs',
    avgDailyConsumption: product.avgDailyConsumption || existing?.avgDailyConsumption || 10,
    leadTimeDays: product.leadTimeDays || existing?.leadTimeDays || 7,
    safetyFactor: product.safetyFactor || existing?.safetyFactor || 1.25,
    moq: product.moq || existing?.moq || 50,
    maxLevel: product.maxLevel || existing?.maxLevel || 500,
    unitPrice: product.defaultRate || product.unitPrice || existing?.unitPrice || 0,
    initialStock: existing?.initialStock || product.initialStock || 50,
    currentStock: existing?.currentStock || product.initialStock || 50,
  };

  saveInventoryItem(itemPayload);
}

// Delete Item
export function deleteInventoryItem(itemId) {
  const items = getInvData(INV_KEYS.ITEMS, []);
  const updated = items.filter((i) => i.id !== itemId);
  setInvData(INV_KEYS.ITEMS, updated);
  return true;
}

/**
 * UNIFIED STOCK IN & OUT LEDGER
 * Automatically aggregates:
 * 1. INWARD: From Purchase System (GRN / Material Receiving)
 * 2. OUTWARD: From Order To Delivery (Sales Dispatches / Deliveries)
 * 3. MANUAL IN / OUT: From Inventory Stock Adjustments Form
 */
export function getUnifiedStockLedger() {
  initInventorySeedData();
  const ledger = [];

  // 1. INWARD: Purchase Module (GRN, Material Receiving, Completed)
  try {
    const purchaseIndents = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
    purchaseIndents.forEach((ind) => {
      const stage = ind.currentStage || '';
      const isReceivedOrGRN =
        stage === 'GRN' ||
        stage === 'Payment' ||
        stage === 'Completed' ||
        stage === 'Material Receiving' ||
        (ind.stageDetails && (ind.stageDetails['GRN'] || ind.stageDetails['Material Receiving']));

      if (isReceivedOrGRN) {
        const qty = Number(ind.receivedQty || ind.passedQty || ind.indentQty || ind.quantity) || 100;
        const dt = ind.grnDate || ind.receivingDate || ind.stageDetails?.['GRN']?.completedAt || ind.updatedAt || ind.createdAt || new Date().toISOString();

        ledger.push({
          id: `LEDGER-PUR-${ind.id}`,
          date: dt,
          type: 'INWARD',
          source: 'PURCHASE',
          sourceLabel: 'Purchase (GRN / Receiving)',
          referenceType: 'Goods Receipt Note (GRN)',
          referenceNo: ind.grnNumber || ind.poNumber || ind.indentNumber,
          itemName: ind.productName || ind.itemName || ind.itemDescription || 'Industrial Raw Material',
          category: ind.category || 'Raw Materials',
          quantity: qty,
          unit: ind.unit || 'Kg',
          party: ind.vendorName || ind.preferredVendor || 'Approved Vendor',
          remarks: ind.remarks || `Inward received against Purchase PO ${ind.poNumber || ind.indentNumber}`,
          performedBy: ind.receivedBy || ind.stageDetails?.['GRN']?.completedBy || 'Store Receiver'
        });
      }
    });
  } catch (err) {
    console.error('Failed to read purchase inward transactions:', err);
  }

  // 2. OUTWARD: Order To Delivery (Sales Dispatched / Delivered / Closed)
  try {
    const otdOrders = getOTDData(OTD_KEYS.ORDERS, []);
    otdOrders.forEach((ord) => {
      const stage = ord.currentStage || '';
      const isDispatchedOrDelivered =
        stage === 'Dispatch' ||
        stage === 'Delivered' ||
        stage === 'Payment Collection' ||
        stage === 'Order Closed' ||
        stage === 'Closed' ||
        ord.status === 'Delivered' ||
        (ord.stageDetails && (ord.stageDetails['Dispatch'] || ord.stageDetails['Delivered']));

      if (isDispatchedOrDelivered) {
        const dt = ord.dispatchDate || ord.deliveryDate || ord.stageDetails?.['Dispatch']?.completedAt || ord.updatedAt || ord.createdAt || new Date().toISOString();

        if (Array.isArray(ord.items) && ord.items.length > 0) {
          ord.items.forEach((item, idx) => {
            ledger.push({
              id: `LEDGER-OTD-${ord.id}-${idx}`,
              date: dt,
              type: 'OUTWARD',
              source: 'SALES_OTD',
              sourceLabel: 'Order To Delivery (Sales)',
              referenceType: 'Sales Dispatch',
              referenceNo: ord.orderNumber,
              itemName: item.productName || item.name || 'Finished Goods',
              category: item.category || 'Finished Goods',
              quantity: Number(item.qty || item.quantity) || 1,
              unit: item.unit || 'Pcs',
              party: ord.customerName || 'Client Order',
              remarks: `Dispatched against Sales Order ${ord.orderNumber} (LR: ${ord.lrNumber || 'Direct'})`,
              performedBy: ord.dispatchedBy || ord.stageDetails?.['Dispatch']?.completedBy || 'Dispatch Supervisor'
            });
          });
        } else {
          ledger.push({
            id: `LEDGER-OTD-${ord.id}`,
            date: dt,
            type: 'OUTWARD',
            source: 'SALES_OTD',
            sourceLabel: 'Order To Delivery (Sales)',
            referenceType: 'Sales Dispatch',
            referenceNo: ord.orderNumber,
            itemName: ord.productName || 'Industrial Assembly System',
            category: 'Finished Goods',
            quantity: Number(ord.quantity) || 1,
            unit: ord.unit || 'Set',
            party: ord.customerName || 'Client Order',
            remarks: `Dispatched against Sales Order ${ord.orderNumber}`,
            performedBy: ord.dispatchedBy || ord.stageDetails?.['Dispatch']?.completedBy || 'Dispatch Supervisor'
          });
        }
      }
    });
  } catch (err) {
    console.error('Failed to read sales outward transactions:', err);
  }

  // 3. MANUAL IN & OUT ADJUSTMENTS
  try {
    const adjustments = getInvData(INV_KEYS.ADJUSTMENTS, []);
    adjustments.forEach((adj) => {
      ledger.push({
        id: `LEDGER-ADJ-${adj.id}`,
        date: adj.date || new Date().toISOString(),
        type: adj.type || 'INWARD',
        source: 'MANUAL_ADJUSTMENT',
        sourceLabel: 'Manual Adjustment',
        referenceType: 'Manual Stock Adjustment',
        referenceNo: adj.referenceNo || adj.id,
        itemName: adj.itemName,
        category: adj.category || 'Store Inventory',
        quantity: Number(adj.quantity) || 0,
        unit: adj.unit || 'Pcs',
        party: adj.reason || 'Audit / Store Balance',
        remarks: adj.remarks || 'Stock correction form submitted',
        performedBy: adj.performedBy || 'Store Incharge'
      });
    });
  } catch (err) {
    console.error('Failed to read manual adjustments:', err);
  }

  // Sort newest first
  return ledger.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Record Manual Stock Adjustment (Form Submission)
export function recordManualStockAdjustment(adjData) {
  initInventorySeedData();
  const items = getInventoryItems();
  const adjustments = getInvData(INV_KEYS.ADJUSTMENTS, []);

  const targetItem = items.find((i) => i.id === adjData.itemId || i.name.toLowerCase() === (adjData.itemName || '').toLowerCase());
  if (!targetItem) {
    throw new Error('Please select a valid Stock Item.');
  }

  const qty = Number(adjData.quantity);
  if (!qty || qty <= 0) {
    throw new Error('Please enter a valid positive quantity.');
  }

  const newAdj = {
    id: generateAdjustmentId(),
    type: adjData.type === 'OUTWARD' ? 'OUTWARD' : 'INWARD',
    itemId: targetItem.id,
    itemName: targetItem.name,
    category: targetItem.category,
    quantity: qty,
    unit: targetItem.unit,
    reason: adjData.reason || 'Physical Count Adjustment',
    referenceNo: adjData.referenceNo || `ADJ-${Date.now().toString().slice(-4)}`,
    remarks: adjData.remarks || 'Stock adjustment recorded via manual form',
    date: adjData.date || new Date().toISOString(),
    performedBy: adjData.performedBy || 'Store Manager'
  };

  const updatedAdjustments = [newAdj, ...adjustments];
  setInvData(INV_KEYS.ADJUSTMENTS, updatedAdjustments);
  notifyInventoryUpdate('STOCK_ADJUSTMENT');
  return newAdj;
}

// Get Low Stock Items that trigger Indents
export function getLowStockItemsForIndent() {
  const items = getInventoryItems();
  return items.filter((item) => item.currentStock <= item.reorderLevel);
}

// Raise Indent from Inventory (Jo item ka qty low rahega wo indent page me show karega)
export function raiseInventoryIndent(indentPayload) {
  initInventorySeedData();
  const items = getInventoryItems();
  const indents = getInvData(INV_KEYS.INDENTS, []);

  const targetItem = items.find((i) => i.id === indentPayload.itemId || i.name.toLowerCase() === (indentPayload.itemName || '').toLowerCase());
  if (!targetItem) {
    throw new Error('Target stock item not found.');
  }

  const qty = Number(indentPayload.quantity) || targetItem.suggestedIndentQty || targetItem.moq;
  const indentNo = generateInvIndentId();
  const now = new Date();
  const expectedDate = new Date(now.getTime() + (targetItem.leadTimeDays || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const newIndent = {
    id: indentNo,
    indentNumber: indentNo,
    itemId: targetItem.id,
    itemName: targetItem.name,
    category: targetItem.category,
    currentStock: targetItem.currentStock,
    reorderLevel: targetItem.reorderLevel,
    avgDailyConsumption: targetItem.avgDailyConsumption,
    leadTimeDays: targetItem.leadTimeDays,
    safetyFactor: targetItem.safetyFactor,
    moq: targetItem.moq,
    maxLevel: targetItem.maxLevel,
    quantity: qty,
    unit: targetItem.unit,
    priority: indentPayload.priority || (targetItem.currentStock <= 0 ? 'Urgent' : 'High'),
    reason: indentPayload.reason || `Low Stock Alert: Current stock (${targetItem.currentStock} ${targetItem.unit}) <= ROL (${targetItem.reorderLevel} ${targetItem.unit})`,
    expectedDate: indentPayload.expectedDate || expectedDate,
    department: indentPayload.department || 'Store & Inventory',
    status: 'Indent Raised',
    createdAt: now.toISOString(),
    raisedBy: indentPayload.raisedBy || 'Inventory Controller'
  };

  // 1. Save in Inventory Indents
  setInvData(INV_KEYS.INDENTS, [newIndent, ...indents]);

  // 2. Cross-sync with Purchase System Indents (so Purchase module team sees it!)
  try {
    const purchaseIndents = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
    const purchaseIndentRecord = {
      id: generateIndentNumber(),
      indentNumber: generateIndentNumber(),
      productName: targetItem.name,
      category: targetItem.category,
      indentQty: qty,
      unit: targetItem.unit,
      estimatedRate: targetItem.unitPrice,
      estimatedCost: qty * targetItem.unitPrice,
      priority: newIndent.priority,
      reason: `Auto Inventory Shortfall: ${targetItem.name}`,
      currentStage: 'Purchase Indent',
      status: 'Indent Approval Pending',
      department: 'Inventory / Warehouse',
      requestedBy: newIndent.raisedBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      source: 'INVENTORY_AUTO_INDENT'
    };
    setPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, [purchaseIndentRecord, ...purchaseIndents]);
  } catch (err) {
    console.error('Failed to sync indent to purchase module:', err);
  }

  notifyInventoryUpdate('INDENT_RAISED');
  return newIndent;
}

// Get Raised Inventory Indents
export function getInventoryIndents() {
  initInventorySeedData();
  return getInvData(INV_KEYS.INDENTS, []);
}

// Executive KPI & Valuation calculations
export function getInventoryMetrics() {
  const items = getInventoryItems();
  const ledger = getUnifiedStockLedger();

  const totalSKUs = items.length;
  let totalValuation = 0;
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  const categoryBreakdown = {};

  items.forEach((item) => {
    const val = (Number(item.currentStock) || 0) * (Number(item.unitPrice) || 0);
    totalValuation += val;

    if (item.status === 'Out of Stock' || item.currentStock <= 0) {
      outOfStockCount++;
    } else if (item.status === 'Low Stock' || item.currentStock <= item.reorderLevel) {
      lowStockCount++;
    } else {
      inStockCount++;
    }

    const cat = item.category || 'General';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + val;
  });

  // Calculate total Inward and Outward
  let totalInwardQty = 0;
  let totalOutwardQty = 0;
  let purchaseInwardQty = 0;
  let salesOutwardQty = 0;
  let manualInQty = 0;
  let manualOutQty = 0;

  ledger.forEach((entry) => {
    const q = Number(entry.quantity) || 0;
    if (entry.type === 'INWARD') {
      totalInwardQty += q;
      if (entry.source === 'PURCHASE') purchaseInwardQty += q;
      if (entry.source === 'MANUAL_ADJUSTMENT') manualInQty += q;
    } else if (entry.type === 'OUTWARD') {
      totalOutwardQty += q;
      if (entry.source === 'SALES_OTD') salesOutwardQty += q;
      if (entry.source === 'MANUAL_ADJUSTMENT') manualOutQty += q;
    }
  });

  return {
    totalSKUs,
    totalValuation,
    inStockCount,
    lowStockCount,
    outOfStockCount,
    totalInwardQty,
    totalOutwardQty,
    purchaseInwardQty,
    salesOutwardQty,
    manualInQty,
    manualOutQty,
    categoryBreakdown,
    recentTransactions: ledger.slice(0, 8),
    lowStockItems: items.filter((i) => i.currentStock <= i.reorderLevel)
  };
}
