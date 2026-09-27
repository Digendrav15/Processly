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

export function setPurchaseData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('purchase_storage_update', { detail: { key } }));
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

// Initial Mock Purchase Data
export function initializePurchaseData() {
  const existing = localStorage.getItem(PURCHASE_STORAGE_KEYS.INDENTS);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) return;
    } catch (e) {
      // Re-seed on corruption
    }
  }

  const initialIndents = [
    {
      id: 'IND-MOCK-1',
      indentNumber: 'IND-0101',
      indentDate: '2026-09-15',
      requiredByDate: '2026-09-28',
      department: 'Production',
      indentorName: 'Rajesh Sharma',
      priority: 'High',
      preferredVendor: 'Tata Steel Ltd',
      purpose: 'Raw material procurement for Q3 sheet metal fabrication batch.',
      currentStage: 'Purchase Indent',
      status: 'Indent Created',
      items: [
        { productCode: 'RAW-001', productName: 'Steel Sheets (Grade 304)', quantity: 50, unit: 'Sheets', estimatedRate: 2500, amount: 125000 },
        { productCode: 'RAW-002', productName: 'Welding Electrodes (E6013)', quantity: 20, unit: 'Packets', estimatedRate: 850, amount: 17000 }
      ],
      totalEstimatedValue: 142000,
      createdAt: '2026-09-15T09:30:00Z',
      stageDetails: {}
    },
    {
      id: 'IND-MOCK-2',
      indentNumber: 'IND-0102',
      indentDate: '2026-09-14',
      requiredByDate: '2026-09-24',
      department: 'Maintenance',
      indentorName: 'Amit Verma',
      priority: 'Urgent',
      preferredVendor: 'SKF Bearings India',
      purpose: 'Urgent conveyor gearbox replacement parts.',
      currentStage: 'Indent Approval',
      status: 'Approval Pending',
      items: [
        { productCode: 'SP-088', productName: 'Deep Groove Ball Bearings 6205', quantity: 15, unit: 'Pcs', estimatedRate: 1200, amount: 18000 },
        { productCode: 'LUB-012', productName: 'Industrial Synthetic Gear Oil VG220', quantity: 4, unit: 'Buckets', estimatedRate: 4500, amount: 18000 }
      ],
      totalEstimatedValue: 36000,
      createdAt: '2026-09-14T11:00:00Z',
      stageDetails: {
        'Purchase Indent': { completedAt: '2026-09-14T11:05:00Z', completedBy: 'Amit Verma', remarks: 'Requisition raised' }
      }
    },
    {
      id: 'IND-MOCK-3',
      indentNumber: 'IND-0103',
      indentDate: '2026-09-12',
      requiredByDate: '2026-09-22',
      department: 'Electrical',
      indentorName: 'Sunil Mehta',
      priority: 'Normal',
      preferredVendor: 'Havells Industrial Cables',
      purpose: 'Control panel wiring cables & distribution box fittings.',
      currentStage: 'PO',
      status: 'PO Pending',
      approvedBy: 'HOD - Operations',
      approvalDate: '2026-09-13',
      items: [
        { productCode: 'EL-045', productName: 'Copper Armoured Cable 4-Core 6sqmm', quantity: 200, unit: 'Meters', estimatedRate: 380, amount: 76000 },
        { productCode: 'EL-090', productName: 'MCB 32A Triple Pole C-Curve', quantity: 10, unit: 'Pcs', estimatedRate: 950, amount: 9500 }
      ],
      totalEstimatedValue: 85500,
      createdAt: '2026-09-12T14:15:00Z',
      stageDetails: {
        'Purchase Indent': { completedAt: '2026-09-12T14:20:00Z', completedBy: 'Sunil Mehta' },
        'Indent Approval': { completedAt: '2026-09-13T10:00:00Z', completedBy: 'HOD - Operations', remarks: 'Budget verified and approved' }
      }
    },
    {
      id: 'IND-MOCK-4',
      indentNumber: 'IND-0104',
      poNumber: 'PO-2026-0204',
      poDate: '2026-09-13',
      indentDate: '2026-09-10',
      requiredByDate: '2026-09-20',
      department: 'Assembly',
      indentorName: 'Vikram Joshi',
      priority: 'Normal',
      vendorName: 'Bosch Rexroth Pneumatics',
      paymentTerms: '30 Days Net',
      deliveryLocation: 'Plant-1 Central Stores',
      currentStage: 'Material Lifting / Dispatch',
      status: 'Dispatch Pending',
      items: [
        { productCode: 'PN-011', productName: 'Pneumatic Cylinders 50mm Bore', quantity: 8, unit: 'Pcs', estimatedRate: 4200, amount: 33600 }
      ],
      totalEstimatedValue: 33600,
      totalPOValue: 33600,
      createdAt: '2026-09-10T10:00:00Z',
      stageDetails: {
        'Purchase Indent': { completedAt: '2026-09-10T10:05:00Z', completedBy: 'Vikram Joshi' },
        'Indent Approval': { completedAt: '2026-09-11T12:00:00Z', completedBy: 'Plant Head' },
        'PO': { completedAt: '2026-09-13T15:30:00Z', completedBy: 'Purchase Officer', remarks: 'PO issued to vendor' }
      }
    },
    {
      id: 'IND-MOCK-5',
      indentNumber: 'IND-0105',
      poNumber: 'PO-2026-0205',
      poDate: '2026-09-11',
      transporterName: 'VRL Logistics',
      vehicleNumber: 'KA-04-E-8899',
      lrAwbNumber: 'LR-PUR-99882',
      dispatchDate: '2026-09-14',
      department: 'Packing',
      indentorName: 'Pooja Nair',
      priority: 'Normal',
      vendorName: 'Corrugation Packaging Krafts',
      currentStage: 'Material Delivery',
      status: 'In Transit',
      items: [
        { productCode: 'BOX-09', productName: 'Heavy Duty 5-Ply Corrugated Cartons', quantity: 500, unit: 'Boxes', estimatedRate: 85, amount: 42500 }
      ],
      totalEstimatedValue: 42500,
      totalPOValue: 42500,
      createdAt: '2026-09-08T09:00:00Z',
      stageDetails: {
        'Purchase Indent': { completedAt: '2026-09-08T09:10:00Z', completedBy: 'Pooja Nair' },
        'Indent Approval': { completedAt: '2026-09-09T14:00:00Z', completedBy: 'Store Head' },
        'PO': { completedAt: '2026-09-11T11:00:00Z', completedBy: 'Purchase Lead' },
        'Material Lifting / Dispatch': { completedAt: '2026-09-14T17:00:00Z', completedBy: 'Vendor Logistics' }
      }
    },
    {
      id: 'IND-MOCK-6',
      indentNumber: 'IND-0106',
      poNumber: 'PO-2026-0206',
      vehicleNumber: 'MH-12-PQ-3344',
      lrAwbNumber: 'LR-PUR-77661',
      gateEntryNo: 'GATE-2026-045',
      gateEntryDate: '2026-09-16',
      department: 'Production',
      indentorName: 'Deepak Patel',
      priority: 'High',
      vendorName: 'Jindal Aluminium Works',
      currentStage: 'Material Receiving',
      status: 'At Gate / Unloading',
      items: [
        { productCode: 'AL-500', productName: 'Extruded Aluminium Profiles 6063-T6', quantity: 120, unit: 'Bars', estimatedRate: 920, amount: 110400 }
      ],
      totalEstimatedValue: 110400,
      totalPOValue: 110400,
      createdAt: '2026-09-05T10:00:00Z',
      stageDetails: {
        'Purchase Indent': { completedAt: '2026-09-05T10:05:00Z', completedBy: 'Deepak Patel' },
        'Indent Approval': { completedAt: '2026-09-06T11:00:00Z', completedBy: 'Director' },
        'PO': { completedAt: '2026-09-08T15:00:00Z', completedBy: 'Buyer' },
        'Material Lifting / Dispatch': { completedAt: '2026-09-12T16:00:00Z', completedBy: 'Vendor' },
        'Material Delivery': { completedAt: '2026-09-16T08:30:00Z', completedBy: 'Security Gate' }
      }
    },
    {
      id: 'IND-MOCK-7',
      indentNumber: 'IND-0107',
      poNumber: 'PO-2026-0207',
      receivedQuantity: 30,
      unloadedAt: 'Bay-3 Chemical Store',
      department: 'Tool Room',
      indentorName: 'Sanjay Deshmukh',
      priority: 'Normal',
      vendorName: 'Hardcarb Special Alloys',
      currentStage: 'Quality Check',
      status: 'Inspection Pending',
      items: [
        { productCode: 'TL-101', productName: 'Carbide End Mills 10mm 4-Flute', quantity: 30, unit: 'Pcs', estimatedRate: 1850, amount: 55500 }
      ],
      totalEstimatedValue: 55500,
      totalPOValue: 55500,
      createdAt: '2026-09-03T11:00:00Z',
      stageDetails: {
        'Purchase Indent': { completedAt: '2026-09-03T11:10:00Z', completedBy: 'Sanjay Deshmukh' },
        'Indent Approval': { completedAt: '2026-09-04T16:00:00Z', completedBy: 'Tooling Head' },
        'PO': { completedAt: '2026-09-06T10:00:00Z', completedBy: 'Buyer' },
        'Material Lifting / Dispatch': { completedAt: '2026-09-10T12:00:00Z', completedBy: 'Vendor' },
        'Material Delivery': { completedAt: '2026-09-14T09:00:00Z', completedBy: 'Gate Staff' },
        'Material Receiving': { completedAt: '2026-09-15T14:00:00Z', completedBy: 'Store Officer' }
      }
    },
    {
      id: 'IND-MOCK-8',
      indentNumber: 'IND-0108',
      poNumber: 'PO-2026-0208',
      qcStatus: 'Passed',
      inspectedQuantity: 40,
      acceptedQuantity: 40,
      rejectedQuantity: 0,
      qcInspector: 'Mahesh Patil',
      qcDate: '2026-09-16',
      department: 'Safety & PPE',
      indentorName: 'Ritu Sen',
      priority: 'Normal',
      vendorName: 'Karam Safety Products',
      currentStage: 'GRN',
      status: 'GRN Pending',
      items: [
        { productCode: 'SAF-01', productName: 'Industrial Safety Helmets with Chin Strap', quantity: 40, unit: 'Pcs', estimatedRate: 450, amount: 18000 }
      ],
      totalEstimatedValue: 18000,
      totalPOValue: 18000,
      createdAt: '2026-09-01T09:00:00Z',
      stageDetails: {
        'Purchase Indent': { completedAt: '2026-09-01T09:10:00Z', completedBy: 'Ritu Sen' },
        'Indent Approval': { completedAt: '2026-09-02T11:00:00Z', completedBy: 'Safety Officer' },
        'PO': { completedAt: '2026-09-04T12:00:00Z', completedBy: 'Buyer' },
        'Material Lifting / Dispatch': { completedAt: '2026-09-08T15:00:00Z', completedBy: 'Vendor' },
        'Material Delivery': { completedAt: '2026-09-12T10:00:00Z', completedBy: 'Gate Incharge' },
        'Material Receiving': { completedAt: '2026-09-14T11:00:00Z', completedBy: 'Store Incharge' },
        'Quality Check': { completedAt: '2026-09-16T16:00:00Z', completedBy: 'Mahesh Patil', remarks: 'All batches certified' }
      }
    },
    {
      id: 'IND-MOCK-9',
      indentNumber: 'IND-0109',
      poNumber: 'PO-2026-0209',
      grnNumber: 'GRN-2026-0509',
      grnDate: '2026-09-16',
      vendorBillNumber: 'INV-TATA-88741',
      totalBillAmount: 75000,
      vendorName: 'Tata Power Solar Systems',
      department: 'Electrical',
      indentorName: 'Sunil Mehta',
      priority: 'High',
      currentStage: 'Payment',
      status: 'Payment Pending',
      items: [
        { productCode: 'SOL-05', productName: 'Solar Inverter Module 5kVA', quantity: 1, unit: 'Set', estimatedRate: 75000, amount: 75000 }
      ],
      totalEstimatedValue: 75000,
      totalPOValue: 75000,
      createdAt: '2026-08-25T10:00:00Z',
      stageDetails: {
        'Purchase Indent': { completedAt: '2026-08-25T10:05:00Z', completedBy: 'Sunil Mehta' },
        'Indent Approval': { completedAt: '2026-08-26T14:00:00Z', completedBy: 'CFO' },
        'PO': { completedAt: '2026-08-28T16:00:00Z', completedBy: 'Senior Buyer' },
        'Material Lifting / Dispatch': { completedAt: '2026-09-05T10:00:00Z', completedBy: 'Carrier' },
        'Material Delivery': { completedAt: '2026-09-10T12:00:00Z', completedBy: 'Gate Staff' },
        'Material Receiving': { completedAt: '2026-09-12T15:00:00Z', completedBy: 'Store Officer' },
        'Quality Check': { completedAt: '2026-09-14T11:00:00Z', completedBy: 'Chief QC' },
        'GRN': { completedAt: '2026-09-16T14:00:00Z', completedBy: 'Store Incharge' }
      }
    }
  ];

  setPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, initialIndents);
}

export const initPurchaseData = initializePurchaseData;

// Ensure initial purchase data is seeded
initializePurchaseData();

