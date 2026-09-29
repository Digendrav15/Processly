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

// Initial Seed Data for immediate testing & demo
export const DEFAULT_LEADS = [
  {
    id: 'lto-lead-001',
    leadId: 'LD-1001',
    leadDate: '2026-09-20',
    leadSource: 'Website',
    customerType: 'Corporate',
    customerName: 'Shapoorji Pallonji EPC Ltd',
    contactPerson: 'Vikramaditya Sengupta',
    mobile: '+91 98200 45678',
    alternateMobile: '+91 98200 45679',
    email: 'v.sengupta@shapoorji.com',
    address: 'SP Centre, 41/44 Minoo Desai Marg, Colaba',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400005',
    productService: 'Structural Steel Beams & Girders',
    expectedQuantity: '120 MT',
    expectedPurchaseDate: '2026-10-15',
    priority: 'High',
    assignedTo: 'Rahul Mehta',
    initialRequirement: 'Requirement for ongoing metro line girder fabrication. Needs BIS certified IS 2062 Grade E250.',
    remarks: 'Key institutional client. Fast-track approval needed.',
    attachment: 'Metro_Tender_Specs_SP.pdf',
    status: 'Approval Pending',
    currentStage: 'Approval',
    approvalId: 'APP-0201',
    quotationNo: 'QT-0101',
    createdAt: '2026-09-20T10:30:00.000Z',
    updatedAt: '2026-09-23T12:00:00.000Z'
  },
  {
    id: 'lto-lead-002',
    leadId: 'LD-1002',
    leadDate: '2026-09-21',
    leadSource: 'WhatsApp',
    customerType: 'Distributor',
    customerName: 'Prestige Infrastructure Corp',
    contactPerson: 'Sneha Kulkarni',
    mobile: '+91 98450 11223',
    alternateMobile: '',
    email: 'sneha.k@prestigeconstructions.com',
    address: 'Prestige Falcon Tower, Brunton Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560025',
    productService: 'Heavy Industrial Fasteners & Bolts',
    expectedQuantity: '25,000 Pcs',
    expectedPurchaseDate: '2026-10-05',
    priority: 'Urgent',
    assignedTo: 'Priya Sharma',
    initialRequirement: 'High tensile fasteners grade 8.8 and 10.9 for commercial tower erection.',
    remarks: 'Sample batch already passed client inspection.',
    attachment: 'BOQ_Prestige_Fasteners.xlsx',
    status: 'Negotiation',
    currentStage: 'Negotiation',
    quotationNo: 'QT-0102',
    createdAt: '2026-09-21T09:15:00.000Z',
    updatedAt: '2026-09-23T14:30:00.000Z'
  },
  {
    id: 'lto-lead-003',
    leadId: 'LD-1003',
    leadDate: '2026-09-22',
    leadSource: 'Reference',
    customerType: 'OEM',
    customerName: 'Godrej Process Equipment',
    contactPerson: 'Rajesh Nambiar',
    mobile: '+91 99670 98765',
    alternateMobile: '+91 99670 98766',
    email: 'r.nambiar@godrej.com',
    address: 'Plant 13, Pirojshanagar, Vikhroli East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400079',
    productService: 'Pressure Vessel Flanges & Pipes',
    expectedQuantity: '50 Nos',
    expectedPurchaseDate: '2026-10-25',
    priority: 'Medium',
    assignedTo: 'Amitabh Joshi',
    initialRequirement: 'Stainless steel 316L forged nozzles and weld neck flanges for refinery project.',
    remarks: 'Quotation sent; awaiting follow-up call today.',
    attachment: 'Datasheet_Refinery_Godrej.pdf',
    status: 'Quotation',
    currentStage: 'Quotation',
    quotationNo: 'QT-0103',
    createdAt: '2026-09-22T11:00:00.000Z',
    updatedAt: '2026-09-23T15:00:00.000Z'
  },
  {
    id: 'lto-lead-004',
    leadId: 'LD-1004',
    leadDate: '2026-09-22',
    leadSource: 'Phone',
    customerType: 'Corporate',
    customerName: 'Larsen & Toubro ECC Div',
    contactPerson: 'Karan Mehra',
    mobile: '+91 98190 22334',
    alternateMobile: '',
    email: 'karan.mehra@larsentoubro.com',
    address: 'L&T House, Ballard Estate',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    productService: 'Reinforcement TMT Rebars Fe550D',
    expectedQuantity: '200 MT',
    expectedPurchaseDate: '2026-10-10',
    priority: 'Urgent',
    assignedTo: 'Rahul Mehta',
    initialRequirement: 'Primary steel TMT bars for bridge construction project in Surat.',
    remarks: 'Enquiry received via direct call. Follow-up scheduled for this afternoon.',
    attachment: '',
    status: 'Follow-up / Enquiry',
    currentStage: 'Follow-up / Enquiry',
    createdAt: '2026-09-22T14:45:00.000Z',
    updatedAt: '2026-09-23T11:20:00.000Z'
  },
  {
    id: 'lto-lead-005',
    leadId: 'LD-1005',
    leadDate: '2026-09-23',
    leadSource: 'Email',
    customerType: 'Retail',
    customerName: 'Apex ElectroTech Solutions',
    contactPerson: 'Mohit Agnihotri',
    mobile: '+91 97110 88990',
    alternateMobile: '',
    email: 'mohit@apexelectro.in',
    address: 'Plot 88, Udyog Vihar Phase 1',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122016',
    productService: 'Electrical Busbars & Panels',
    expectedQuantity: '15 Sets',
    expectedPurchaseDate: '2026-11-01',
    priority: 'Low',
    assignedTo: 'Priya Sharma',
    initialRequirement: 'Control panel copper busbars 40x10mm annealed finish.',
    remarks: 'Brand new lead arrived via sales email. Verification pending.',
    attachment: '',
    status: 'New',
    currentStage: 'Lead Verification',
    createdAt: '2026-09-23T08:30:00.000Z',
    updatedAt: '2026-09-23T08:30:00.000Z'
  },
  {
    id: 'lto-lead-006',
    leadId: 'LD-1006',
    leadDate: '2026-09-18',
    leadSource: 'Website',
    customerType: 'Corporate',
    customerName: 'Tata Projects Limited',
    contactPerson: 'Anirudh Roy',
    mobile: '+91 98300 77665',
    alternateMobile: '+91 98300 77666',
    email: 'aroy@tataprojects.com',
    address: 'One Forbes, Dr V.B. Gandhi Marg, Kala Ghoda',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    productService: 'Galvanized Cable Trays & Accessories',
    expectedQuantity: '1,500 Metres',
    expectedPurchaseDate: '2026-09-30',
    priority: 'High',
    assignedTo: 'Amitabh Joshi',
    initialRequirement: 'Perforated GI cable trays with coupler plates and hardware.',
    remarks: 'Fully approved and converted into Order to Delivery module.',
    attachment: 'Tata_Project_Cable_BOQ.pdf',
    status: 'Approved',
    currentStage: 'Order to Delivery',
    approvalId: 'APP-0200',
    quotationNo: 'QT-0100',
    convertedOrderId: 'ORD-0001',
    createdAt: '2026-09-18T10:00:00.000Z',
    updatedAt: '2026-09-23T09:00:00.000Z'
  },
  {
    id: 'lto-lead-007',
    leadId: 'LD-1007',
    leadDate: '2026-09-15',
    leadSource: 'Reference',
    customerType: 'Corporate',
    customerName: 'Jindal Steel & Power Sub-Pkg',
    contactPerson: 'Sunil Aggarwal',
    mobile: '+91 98112 33445',
    email: 'sunil.a@jindalsteel.com',
    productService: 'Structural Heavy Angles & Channels',
    expectedQuantity: '80 MT',
    estimatedValue: 4800000,
    priority: 'High',
    assignedTo: 'Rahul Mehta',
    status: 'Lost',
    currentStage: 'Closed',
    lossReason: 'High Price / Budget Issue',
    competitorName: 'Kamdhenu Steel Ltd',
    competitorPrice: 4450000,
    lostRemarks: 'Client had rigid budget cap. Competitor offered 7.5% lower rate with 45-day credit line.',
    lostDate: '2026-09-22',
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-22T16:00:00.000Z'
  },
  {
    id: 'lto-lead-008',
    leadId: 'LD-1008',
    leadDate: '2026-09-16',
    leadSource: 'Website',
    customerType: 'Corporate',
    customerName: 'DLF CyberCity Phase 3 HVAC',
    contactPerson: 'Rajesh Varma',
    mobile: '+91 99100 22881',
    email: 'rvarma@dlf.in',
    productService: 'Spiral Galvanized Ducting Works',
    expectedQuantity: '4,000 Sqft',
    estimatedValue: 2850000,
    priority: 'Urgent',
    assignedTo: 'Sneha Kulkarni',
    status: 'Lost',
    currentStage: 'Closed',
    lossReason: 'Competitor Won',
    competitorName: 'Blue Star Industrial HVAC',
    competitorPrice: 2720000,
    lostRemarks: 'Competitor had existing corporate vendor master tie-up with DLF real estate arm.',
    lostDate: '2026-09-24',
    createdAt: '2026-09-16T11:30:00.000Z',
    updatedAt: '2026-09-24T14:15:00.000Z'
  },
  {
    id: 'lto-lead-009',
    leadId: 'LD-1009',
    leadDate: '2026-09-17',
    leadSource: 'Phone',
    customerType: 'OEM',
    customerName: 'Adani Solar Plant Structure',
    contactPerson: 'Bhavin Patel',
    mobile: '+91 98250 88991',
    email: 'bhavin.p@adanisolar.com',
    productService: 'Solar Module Mounting Structures (MMS)',
    expectedQuantity: '250 Sets',
    estimatedValue: 6200000,
    priority: 'Urgent',
    assignedTo: 'Amitabh Joshi',
    status: 'Lost',
    currentStage: 'Closed',
    lossReason: 'Delivery Delay / Long Lead Time',
    competitorName: 'Vikram Solar Structure',
    competitorPrice: 6150000,
    lostRemarks: 'Client project commission was strict 10 days away. Our factory lead time was 24 days.',
    lostDate: '2026-09-23',
    createdAt: '2026-09-17T09:00:00.000Z',
    updatedAt: '2026-09-23T11:00:00.000Z'
  },
  {
    id: 'lto-lead-010',
    leadId: 'LD-1010',
    leadDate: '2026-09-19',
    leadSource: 'WhatsApp',
    customerType: 'OEM',
    customerName: 'Hero MotoCorp Component Line',
    contactPerson: 'Sandeep Khurana',
    mobile: '+91 98110 99443',
    email: 's.khurana@heromotocorp.com',
    productService: 'Custom Stamping Die Fixtures',
    expectedQuantity: '12 Units',
    estimatedValue: 1450000,
    priority: 'Medium',
    assignedTo: 'Priya Sharma',
    status: 'Lost',
    currentStage: 'Closed',
    lossReason: 'Product Specifications / Quality Mismatch',
    competitorName: 'Minda Corp Tooling',
    competitorPrice: 1520000,
    lostRemarks: 'Client tooling required JIS G3141 standard steel which was not available in our current billet stock.',
    lostDate: '2026-09-25',
    createdAt: '2026-09-19T14:00:00.000Z',
    updatedAt: '2026-09-25T15:30:00.000Z'
  },
  {
    id: 'lto-lead-011',
    leadId: 'LD-1011',
    leadDate: '2026-09-20',
    leadSource: 'Email',
    customerType: 'Corporate',
    customerName: 'Max Healthcare Hospital Expansion',
    contactPerson: 'Dr. Vivek Saxena',
    mobile: '+91 98100 66778',
    email: 'v.saxena@maxhealthcare.com',
    productService: 'Stainless Medical Gas Piping 316L',
    expectedQuantity: '800 Metres',
    estimatedValue: 1850000,
    priority: 'Low',
    assignedTo: 'Rahul Mehta',
    status: 'Lost',
    currentStage: 'Closed',
    lossReason: 'Project Cancelled / Deferred',
    competitorName: 'None (Dropped)',
    competitorPrice: 0,
    lostRemarks: 'Hospital board deferred the phase 2 wing expansion until Q2 next financial year.',
    lostDate: '2026-09-26',
    createdAt: '2026-09-20T16:00:00.000Z',
    updatedAt: '2026-09-26T17:00:00.000Z'
  }
];

export const DEFAULT_FOLLOW_UPS = [
  {
    id: 'FLW-0501',
    followUpId: 'FLW-0501',
    leadId: 'LD-1004',
    customer: 'Larsen & Toubro ECC Div',
    contactPerson: 'Karan Mehra',
    followUpDate: '2026-09-23',
    followUpTime: '11:00',
    followUpMode: 'Call',
    discussion: 'Discussed project delivery timeline for Surat Bridge site. Customer verified requirement of 200 MT Fe550D TMT rebars in phases.',
    customerRequirement: 'Delivery in 4 lots of 50 MT every 10 days starting Oct 1st.',
    customerResponse: 'Agreed to standard length of 12 meters with mill test certificates.',
    nextFollowUpDate: '2026-09-23',
    nextAction: 'Send Quotation',
    remarks: 'Ready for quotation generation today.',
    attachment: '',
    followUpBy: 'Rahul Mehta',
    createdAt: '2026-09-23T11:20:00.000Z'
  },
  {
    id: 'FLW-0502',
    followUpId: 'FLW-0502',
    leadId: 'LD-1003',
    customer: 'Godrej Process Equipment',
    contactPerson: 'Rajesh Nambiar',
    followUpDate: '2026-09-23',
    followUpTime: '14:00',
    followUpMode: 'Meeting',
    discussion: 'Technical discussion regarding SS 316L metallurgy and test pressure requirements (45 Bar Hydro).',
    customerRequirement: 'Third-party inspection by Bureau Veritas required at shop floor.',
    customerResponse: 'Client verified standard commercial terms.',
    nextFollowUpDate: '2026-09-24',
    nextAction: 'Negotiation',
    remarks: 'Client requested 3% volume discount on bulk order.',
    attachment: 'MOM_Godrej_23Sep.pdf',
    followUpBy: 'Amitabh Joshi',
    createdAt: '2026-09-23T14:40:00.000Z'
  },
  {
    id: 'FLW-0503',
    followUpId: 'FLW-0503',
    leadId: 'LD-1002',
    customer: 'Prestige Infrastructure Corp',
    contactPerson: 'Sneha Kulkarni',
    followUpDate: '2026-09-22',
    followUpTime: '16:30',
    followUpMode: 'WhatsApp',
    discussion: 'Sent revised product brochure and compliance certificates for Grade 10.9 fasteners.',
    customerRequirement: 'Zinc flakes coating finish required.',
    customerResponse: 'Client satisfied with sample testing.',
    nextFollowUpDate: '2026-09-23',
    nextAction: 'Negotiation',
    remarks: 'Moving to price negotiation stage.',
    attachment: '',
    followUpBy: 'Priya Sharma',
    createdAt: '2026-09-22T16:45:00.000Z'
  }
];

export const DEFAULT_QUOTATIONS = [
  {
    id: 'QT-0101',
    quotationNo: 'QT-0101',
    quotationDate: '2026-09-22',
    leadId: 'LD-1001',
    customer: 'Shapoorji Pallonji EPC Ltd',
    contactPerson: 'Vikramaditya Sengupta',
    mobile: '+91 98200 45678',
    email: 'v.sengupta@shapoorji.com',
    billingAddress: 'SP Centre, 41/44 Minoo Desai Marg, Colaba, Mumbai 400005',
    shippingAddress: 'Metro Line 4 Casting Yard, Thane West, Maharashtra',
    items: [
      {
        srNo: 1,
        productService: 'Structural Steel Beams ISMB 400',
        description: 'IS 2062 Grade E250 Fe410WA Standard Steel Beams',
        quantity: 80,
        unit: 'MT',
        rate: 62500,
        discount: 2,
        taxPercent: 18,
        taxAmount: 882000,
        total: 5782000
      },
      {
        srNo: 2,
        productService: 'Fabricated Girder Stiffeners',
        description: 'CNC cut & drilled gusset plates 20mm thk',
        quantity: 40,
        unit: 'MT',
        rate: 71000,
        discount: 3,
        taxPercent: 18,
        taxAmount: 496584,
        total: 3255384
      }
    ],
    subTotal: 7840000,
    totalDiscount: 184000,
    taxableAmount: 7656000,
    totalTax: 1378584,
    grandTotal: 9034584,
    paymentTerms: '20% Advance with PO, 80% against Proforma Invoice before dispatch',
    deliveryTerms: 'FOR Destination, Freight paid by Seller to Thane Yard',
    quotationValidity: '30 Days from date of issue',
    expectedDeliveryDate: '2026-10-15',
    remarks: 'Includes third party test certificate and mill TC.',
    attachment: 'Quotation_QT-0101_Shapoorji.pdf',
    status: 'Submitted for Approval',
    createdBy: 'Rahul Mehta',
    createdAt: '2026-09-22T14:00:00.000Z'
  },
  {
    id: 'QT-0102',
    quotationNo: 'QT-0102',
    quotationDate: '2026-09-22',
    leadId: 'LD-1002',
    customer: 'Prestige Infrastructure Corp',
    contactPerson: 'Sneha Kulkarni',
    mobile: '+91 98450 11223',
    email: 'sneha.k@prestigeconstructions.com',
    billingAddress: 'Prestige Falcon Tower, Brunton Road, Bengaluru 560025',
    shippingAddress: 'Prestige Tech Cloud Site, Devanahalli, Bengaluru',
    items: [
      {
        srNo: 1,
        productService: 'High Tensile Hex Bolts M24 x 120mm Gr 10.9',
        description: 'Hot dip galvanized high tensile structure bolts',
        quantity: 15000,
        unit: 'Pcs',
        rate: 145,
        discount: 5,
        taxPercent: 18,
        taxAmount: 371925,
        total: 2438175
      },
      {
        srNo: 2,
        productService: 'Heavy Duty Structural Washers M24',
        description: 'Hardened washer IS 6649 Grade 10',
        quantity: 10000,
        unit: 'Pcs',
        rate: 35,
        discount: 5,
        taxPercent: 18,
        taxAmount: 59850,
        total: 392350
      }
    ],
    subTotal: 2525000,
    totalDiscount: 126250,
    taxableAmount: 2398750,
    totalTax: 431775,
    grandTotal: 2830525,
    paymentTerms: '30 Days credit against PDC / Bank Guarantee',
    deliveryTerms: 'Ex-Works warehouse dispatch within 7 days',
    quotationValidity: '15 Days',
    expectedDeliveryDate: '2026-10-05',
    remarks: 'Special project pricing applied.',
    attachment: '',
    status: 'Under Negotiation',
    createdBy: 'Priya Sharma',
    createdAt: '2026-09-22T16:00:00.000Z'
  }
];

export const DEFAULT_NEGOTIATIONS = [
  {
    id: 'NEG-0301',
    negotiationId: 'NEG-0301',
    leadId: 'LD-1002',
    quotationNo: 'QT-0102',
    negotiationDate: '2026-09-23',
    customerExpectedPrice: 2600000,
    companyOfferedPrice: 2750000,
    discount: 7.5,
    revisedPrice: 2720000,
    paymentTerms: '10% Advance, balance 30 days credit',
    deliveryTerms: 'Free freight up to Bengaluru site',
    discussion: 'Customer requested matching competition price at ₹ 26 Lakhs. We offered ₹ 27.20 Lakhs all inclusive with complimentary freight and 7.5% volume discount.',
    customerResponse: 'Client agreed to ₹ 27.20 Lakhs subject to free door delivery.',
    negotiationRemarks: 'Deal agreed verbally. Submitting for final management approval.',
    nextFollowUpDate: '2026-09-24',
    negotiatedBy: 'Priya Sharma',
    status: 'Accepted',
    createdAt: '2026-09-23T14:30:00.000Z'
  }
];

export const DEFAULT_APPROVALS = [
  {
    id: 'APP-0201',
    approvalId: 'APP-0201',
    leadId: 'LD-1001',
    quotationNo: 'QT-0101',
    customer: 'Shapoorji Pallonji EPC Ltd',
    quotationAmount: 9034584,
    discount: '₹ 1,84,000 (2.3%)',
    submittedBy: 'Rahul Mehta',
    submittedDate: '2026-09-23',
    approvalStatus: 'Pending',
    approvalRemarks: 'High value metro project order. Margin is 18.5%. Recommended for approval.',
    approvedBy: '',
    approvalDate: '',
    createdAt: '2026-09-23T12:00:00.000Z'
  }
];

// Initialize Seed Data
export function initLTOData() {
  const isSeeded = localStorage.getItem(LTO_KEYS.SEEDED);
  if (!isSeeded) {
    if (!localStorage.getItem(LTO_KEYS.LEADS)) {
      setData(LTO_KEYS.LEADS, DEFAULT_LEADS);
    }
    if (!localStorage.getItem(LTO_KEYS.FOLLOW_UPS)) {
      setData(LTO_KEYS.FOLLOW_UPS, DEFAULT_FOLLOW_UPS);
    }
    if (!localStorage.getItem(LTO_KEYS.QUOTATIONS)) {
      setData(LTO_KEYS.QUOTATIONS, DEFAULT_QUOTATIONS);
    }
    if (!localStorage.getItem(LTO_KEYS.NEGOTIATIONS)) {
      setData(LTO_KEYS.NEGOTIATIONS, DEFAULT_NEGOTIATIONS);
    }
    if (!localStorage.getItem(LTO_KEYS.APPROVALS)) {
      setData(LTO_KEYS.APPROVALS, DEFAULT_APPROVALS);
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

