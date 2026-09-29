import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  ArrowRight,
  Clock,
  History,
  Building2,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  Calendar,
  Eye,
  Plus,
  Trash2,
  Check,
  Edit3,
  Save,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Award
} from 'lucide-react';
import { usePurchaseStorage } from '../../hooks/usePurchaseStorage';
import {
  PURCHASE_STORAGE_KEYS,
  advancePurchaseStage,
  generatePONumber,
  getPurchaseData,
  setPurchaseData
} from '../../services/purchaseStorageService';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import {
  STORAGE_KEYS,
  DEFAULT_COMPANY_DETAILS,
  DEFAULT_PURCHASE_VENDORS
} from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';
import { ComparativeMatrixModal } from '../../components/purchase/ComparativeMatrixModal';

// Master Vendor Profile Lookup Helper
function getVendorProfile(vendorName, storedVendors = []) {
  const vendorsPool = storedVendors && storedVendors.length > 0 ? storedVendors : DEFAULT_PURCHASE_VENDORS;
  const found = vendorsPool.find(
    (v) => (v.name || '').trim().toLowerCase() === (vendorName || '').trim().toLowerCase()
  );

  if (found) {
    return {
      name: found.name,
      contactPerson: found.contactPerson || 'Sales & Accounts Dept',
      mobile: found.mobile || found.phone || '+91 98765 43210',
      email: found.email || 'sales@vendor.com',
      gstin: found.gstin || '20AAACT2727Q1ZW',
      address: found.address || `${found.city || 'Industrial Area'}, India`,
      city: found.city || 'Industrial Area',
    };
  }

  // Realistic defaults for master vendors
  const defaults = {
    'Tata Steel Ltd': {
      name: 'Tata Steel Ltd',
      contactPerson: 'Rakesh Sharma (Industrial Sales)',
      mobile: '+91 98765 43210',
      email: 'sales.industrial@tatasteel.com',
      gstin: '20AAACT2727Q1ZW',
      address: 'Tata Steel Works, P.O. Bistupur',
      city: 'Jamshedpur, Jharkhand 831001'
    },
    'Havells Industrial Cables': {
      name: 'Havells Industrial Cables',
      contactPerson: 'Sunil Mathur (Regional Sales Head)',
      mobile: '+91 98110 55443',
      email: 'industrial.cables@havells.com',
      gstin: '07AAACH0098A1ZT',
      address: 'QRG Towers, 2D Sector 126, Expressway',
      city: 'Noida, Uttar Pradesh 201304'
    },
    'SKF Bearings India': {
      name: 'SKF Bearings India',
      contactPerson: 'Amitabh Joshi (Product Engineer)',
      mobile: '+91 98230 11223',
      email: 'orders.india@skf.com',
      gstin: '27AAACS1234F1Z5',
      address: 'Plot 2, Chinchwad MIDC Industrial Area',
      city: 'Pune, Maharashtra 411033'
    },
    'Bosch Rexroth Pneumatics': {
      name: 'Bosch Rexroth Pneumatics',
      contactPerson: 'Vikram Malhotra (Automation Head)',
      mobile: '+91 99001 88776',
      email: 'sales.rexroth@bosch.com',
      gstin: '29AAACB1987M1Z2',
      address: 'Post Box No. 3000, Hosur Road, Adugodi',
      city: 'Bangalore, Karnataka 560030'
    },
    'Corrugation Packaging Krafts': {
      name: 'Corrugation Packaging Krafts',
      contactPerson: 'Pooja Agarwal (Client Relations)',
      mobile: '+91 97112 33445',
      email: 'kraftbox@corrugation.com',
      gstin: '06AAACC5544B1ZV',
      address: 'Plot 44, Sector 24 Industrial Area',
      city: 'Faridabad, Haryana 121005'
    }
  };

  return defaults[vendorName] || {
    name: vendorName || 'Selected Vendor',
    contactPerson: 'Sales Department',
    mobile: '+91 98765 00000',
    email: 'contact@vendor.com',
    gstin: '27AAACC0000A1Z0',
    address: 'Plot 12, Phase 1 Industrial Area',
    city: 'Industrial Hub, India 100001'
  };
}

export function PurchaseOrderPage() {
  const navigate = useNavigate();
  const indents = usePurchaseStorage(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const masterVendors = useOTDStorage(STORAGE_KEYS.PURCHASE_VENDORS, DEFAULT_PURCHASE_VENDORS);
  const companyDetails = useOTDStorage(STORAGE_KEYS.COMPANY_DETAILS, DEFAULT_COMPANY_DETAILS);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"Digendra Verma"}');

  // Active View Tab: 'document' (Direct PO Format on page) | 'history' (Past PO Table)
  const [activeView, setActiveView] = useState('document');
  const [historySearch, setHistorySearch] = useState('');
  const [isComparativeMatrixOpen, setIsComparativeMatrixOpen] = useState(false);

  // PO Revision Mode State
  const [isRevising, setIsRevising] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');

  // 1. FILTER ONLY INDENTS WHOSE "Indent Approval" IS DONE!
  const approvedIndents = useMemo(() => {
    return indents.filter((item) => {
      // Indents ready for PO or where Indent Approval was approved
      const isApprovedForPO =
        item.currentStage === 'PO' ||
        item.status === 'PO Pending' ||
        item.approvalDecision === 'Approved' ||
        (item.stageDetails && !!item.stageDetails['Indent Approval']);

      return isApprovedForPO;
    });
  }, [indents]);

  // Selected Approved Indent ID
  const [selectedIndentId, setSelectedIndentId] = useState('');

  // Active Indent for the PO Document
  const activeIndent = useMemo(() => {
    if (selectedIndentId) {
      const found = approvedIndents.find((i) => i.id === selectedIndentId || i.indentNumber === selectedIndentId);
      if (found) return found;
    }
    const pendingFirst = approvedIndents.find(i => i.currentStage === 'PO' || i.status === 'PO Pending');
    return pendingFirst || approvedIndents[0] || null;
  }, [approvedIndents, selectedIndentId]);

  // Initialize selected indent
  useEffect(() => {
    if (!selectedIndentId && approvedIndents.length > 0) {
      const pendingFirst = approvedIndents.find(i => i.currentStage === 'PO' || i.status === 'PO Pending');
      setSelectedIndentId(pendingFirst ? pendingFirst.id : approvedIndents[0].id);
    }
  }, [approvedIndents, selectedIndentId]);

  // PO Header & Commercial Details
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorDetails, setVendorDetails] = useState({
    name: '',
    contactPerson: '',
    address: '',
    city: '',
    gstin: '',
    email: '',
    mobile: ''
  });

  const [shipToDetails, setShipToDetails] = useState({
    name: 'Store Incharge (Inward Dock)',
    company: 'Multi Systems App Engineering Plant',
    address: 'Survey No. 88, National Highway 48',
    cityStateZip: 'Bhiwadi, Rajasthan 301019',
    phone: '+91 (01493) 245-100'
  });

  const [requisitioner, setRequisitioner] = useState('');
  const [shipVia, setShipVia] = useState('VRL Logistics Surface Express');
  const [fob, setFob] = useState('F.O.B. Destination Plant');
  const [shippingTerms, setShippingTerms] = useState('30 Days Net');
  const [specialInstructions, setSpecialInstructions] = useState('Delivery between 9:00 AM - 5:00 PM. Inspection certificate and duplicate tax invoice must accompany material.');

  // Items in the PO
  const [poItems, setPoItems] = useState([]);
  const [taxPercent, setTaxPercent] = useState(18);
  const [shippingCost, setShippingCost] = useState(0);

  // When active indent changes -> Auto populate Vendor Details from Master & Products below!
  useEffect(() => {
    if (activeIndent) {
      const vName = activeIndent.vendorName || activeIndent.preferredVendor || 'Tata Steel Ltd';
      const prof = getVendorProfile(vName, masterVendors);

      setVendorDetails({
        name: prof.name,
        contactPerson: prof.contactPerson,
        address: prof.address,
        city: prof.city,
        gstin: prof.gstin,
        email: prof.email,
        mobile: prof.mobile
      });

      setPoNumber(activeIndent.poNumber || generatePONumber());
      setPoDate(activeIndent.poDate || new Date().toISOString().split('T')[0]);
      setRequisitioner(activeIndent.indentorName || currentUser.name || 'Digendra Verma');
      setShippingTerms(activeIndent.paymentTerms || '30 Days Net');

      // Populate items
      if (activeIndent.items && activeIndent.items.length > 0) {
        setPoItems(
          activeIndent.items.map((it) => ({
            productCode: it.productCode || 'RAW-001',
            productName: it.productName || 'Material Item',
            quantity: parseFloat(it.quantity || 1),
            unit: it.unit || 'Pcs',
            unitPrice: parseFloat(it.estimatedRate || it.rate || it.unitPrice || 150),
            total: parseFloat(it.amount || (parseFloat(it.quantity || 1) * parseFloat(it.estimatedRate || it.rate || it.unitPrice || 150)))
          }))
        );
      } else {
        setPoItems([
          { productCode: '23423423', productName: 'Product XYZ', quantity: 15, unit: 'Pcs', unitPrice: 150, total: 2250 },
          { productCode: '45645645', productName: 'Product ABC', quantity: 1, unit: 'Pcs', unitPrice: 75, total: 75 }
        ]);
      }
    }
  }, [activeIndent, masterVendors]);

  // Calculate Totals
  const subTotal = poItems.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
  const taxAmount = (subTotal * parseFloat(taxPercent || 0)) / 100;
  const grandTotal = subTotal + taxAmount + parseFloat(shippingCost || 0);

  // Line Item Revision Handlers
  const handleAddRevisionItem = () => {
    setPoItems((prev) => [
      ...prev,
      {
        productCode: `RAW-${Math.floor(100 + Math.random() * 900)}`,
        productName: 'Additional Product Material',
        quantity: 1,
        unit: 'Pcs',
        unitPrice: 250,
        total: 250
      }
    ]);
  };

  const handleUpdateItem = (index, field, val) => {
    setPoItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = parseFloat(field === 'quantity' ? val : item.quantity) || 0;
        const price = parseFloat(field === 'unitPrice' ? val : item.unitPrice) || 0;
        item.total = qty * price;
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleDeleteItem = (index) => {
    if (poItems.length <= 1) {
      alert('A Purchase Order must contain at least 1 product line item.');
      return;
    }
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Save PO Revision
  const handleSaveRevision = (e) => {
    e?.preventDefault();
    if (!activeIndent) return;

    const revCount = (activeIndent.revisionCount || 0) + 1;
    const nowStr = new Date().toISOString();
    const revHistory = activeIndent.revisionHistory || [];

    const newRevEntry = {
      revisionNumber: revCount,
      revisedAt: nowStr,
      revisedBy: currentUser.name || 'Digendra Verma',
      reason: revisionReason || 'PO commercial & item details revised',
      previousTotal: activeIndent.totalPOValue || 0,
      newTotal: grandTotal,
      items: poItems
    };

    const indentsList = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
    const idx = indentsList.findIndex((i) => i.id === activeIndent.id || i.indentNumber === activeIndent.indentNumber);
    if (idx === -1) return;

    const updated = {
      ...indentsList[idx],
      items: poItems,
      totalEstimatedValue: grandTotal,
      totalPOValue: grandTotal,
      subTotal,
      taxAmount,
      shippingCost,
      requisitioner,
      shipVia,
      fob,
      paymentTerms: shippingTerms,
      poRemarks: specialInstructions,
      revisionCount: revCount,
      lastRevisedAt: nowStr,
      revisionHistory: [...revHistory, newRevEntry]
    };

    indentsList[idx] = updated;
    setPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, indentsList);

    setIsRevising(false);
    setRevisionReason('');
    alert(`Purchase Order ${poNumber} successfully revised! (Revision #${revCount} • Total: ₹${grandTotal.toLocaleString('en-IN')})`);
  };

  // Handle PO Issue / Save
  const handleIssuePO = (e) => {
    e?.preventDefault();
    if (!activeIndent) {
      alert('Please select an approved indent from the vendor dropdown first.');
      return;
    }

    const payload = {
      poNumber,
      poDate,
      vendorName: vendorDetails.name,
      vendorDetails,
      shipToDetails,
      paymentTerms: shippingTerms,
      requisitioner,
      shipVia,
      fob,
      totalPOValue: grandTotal,
      subTotal,
      taxAmount,
      shippingCost,
      poItems,
      poRemarks: specialInstructions,
      nextStage: 'Material Lifting / Dispatch',
      status: 'Dispatch Pending'
    };

    advancePurchaseStage(
      activeIndent.id,
      payload,
      `Vendor PO ${poNumber} issued to ${vendorDetails.name} (Value: ₹${grandTotal.toLocaleString('en-IN')})`
    );

    alert(`Purchase Order ${poNumber} successfully issued to ${vendorDetails.name}! Moved to Material Lifting / Dispatch.`);
    navigate('/purchase/lifting-dispatch');
  };

  // Apply Winning Quote from Comparative Matrix (L1/L2/L3)
  const handleApplyWinningQuote = (winningQuote, deviationReason) => {
    const profile = getVendorProfile(winningQuote.vendorName, masterVendors);
    setVendorDetails(profile);
    if (winningQuote.paymentTerms) {
      setShippingTerms(winningQuote.paymentTerms);
    }
    if (winningQuote.freightCharges) {
      setShippingCost(winningQuote.freightCharges);
    }
    // Update items rate and total
    setPoItems(prev => prev.map(item => ({
      ...item,
      unitPrice: winningQuote.quotedRate || item.unitPrice,
      total: (winningQuote.quotedRate || item.unitPrice) * item.qty
    })));
  };

  // Print Document Function
  const handlePrintDocument = () => {
    window.print();
  };

  // PO History List (All indents where PO is issued)
  const historyPOs = useMemo(() => {
    return indents.filter((item) => {
      const hasPO =
        !!item.poNumber ||
        (item.stageDetails && !!item.stageDetails['PO']);

      if (!hasPO) return false;

      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        return (
          (item.poNumber || '').toLowerCase().includes(q) ||
          (item.vendorName || '').toLowerCase().includes(q) ||
          (item.indentNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, historySearch]);

  return (
    <div className="space-y-2.5 pb-6">
      {/* Print Specific CSS to print ONLY the PO format */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-po-document, #printable-po-document * {
            visibility: visible;
          }
          #printable-po-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 24px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header Banner */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 px-3.5 py-2.5 rounded-xl text-white shadow-sm border border-emerald-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
              Procurement • Step 3
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border border-amber-500/30">
              Vendor PO
            </span>
          </div>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Purchase Order (PO)</h1>
          <p className="text-[11px] text-slate-400">
            Vendor-wise Purchase Order document. Select approved vendor to auto-load master details & products.
          </p>
        </div>

        {/* View Switcher & Compare Quotes */}
        <div className="flex items-center gap-2">
          {activeIndent && (
            <button
              type="button"
              onClick={() => setIsComparativeMatrixOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer transform active:scale-95"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Compare Quotes (L1/L2/L3)</span>
            </button>
          )}

          <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveView('document')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${activeView === 'document'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>PO Document</span>
            </button>

            <button
              onClick={() => setActiveView('history')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${activeView === 'history'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>PO History ({historyPOs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* PO Revision Mode Alert Banner */}
      {isRevising && activeView === 'document' && (
        <div className="no-print bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-amber-300 shadow-md">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-200">
                  PO Revision Mode Active ({poNumber})
                </h4>
                {activeIndent?.revisionCount ? (
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                    Current: Rev #{activeIndent.revisionCount}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                You can edit product descriptions, quantities, unit prices, add/delete items, or change terms. Click "Save Revised PO" at the bottom when finished.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Revision reason (e.g. Revised prices after vendor negotiation)"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-72 shadow-inner"
            />
            <button
              onClick={() => setIsRevising(false)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ACTIVE VIEW: THE PO FORMAT DIRECTLY ON THE PAGE                        */}
      {/* ========================================================================= */}
      {activeView === 'document' && (
        <div className="space-y-6">
          {/* THE PO FORMAT DOCUMENT (100% Matching Screenshot directly on page) */}
          <div className="flex justify-center bg-slate-200 dark:bg-slate-950 p-4 sm:p-8 rounded-3xl border border-slate-300 dark:border-slate-800 shadow-inner">
            <div
              id="printable-po-document"
              className="bg-white text-slate-900 w-full max-w-[820px] p-8 sm:p-10 border-2 border-emerald-600 shadow-2xl space-y-6 text-[12px] font-sans relative"
            >
              {/* 1. Header: Company Branding & Big Bold Title */}
              <div className="flex justify-between items-start border-b pb-4 border-slate-100">
                {/* Left: Brand / Logo / Company Info (FROM MASTER: OUR COMPANY DETAILS) */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white shadow-xs font-black text-lg border border-amber-500">
                      📄
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 block leading-none">
                        {companyDetails.brandName || companyDetails.companyName}
                      </span>
                      <h2 className="text-2xl font-black text-emerald-600 leading-tight">
                        {companyDetails.brandName || companyDetails.companyName}
                      </h2>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 leading-tight pt-1">
                    <p>{companyDetails.address}</p>
                    <p>{companyDetails.city}, {companyDetails.state} {companyDetails.pincode}</p>
                    <p>GSTIN: <span className="font-mono font-bold text-emerald-700">{companyDetails.gstin}</span></p>
                    <p>Phone: {companyDetails.contactNumber || companyDetails.phone}</p>
                    <p>Email: {companyDetails.email}</p>
                    {companyDetails.website && <p>Website: {companyDetails.website}</p>}
                  </div>
                </div>

                {/* Right: Big Bold Title "PURCHASE ORDER" */}
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600">
                      PURCHASE ORDER
                    </h1>
                    {activeIndent?.revisionCount ? (
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
                        REV-{activeIndent.revisionCount}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-[11px] space-y-1">
                    <div className="flex justify-end items-center gap-3 font-semibold">
                      <span className="text-slate-500 font-bold uppercase">DATE</span>
                      <input
                        type="date"
                        value={poDate}
                        onChange={(e) => setPoDate(e.target.value)}
                        className="font-mono font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-400 focus:outline-none text-right w-28"
                      />
                    </div>
                    <div className="flex justify-end items-center gap-3 font-semibold">
                      <span className="text-slate-500 font-bold uppercase">PO #</span>
                      <input
                        type="text"
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                        className="font-mono font-black text-slate-900 bg-transparent border-b border-dashed border-slate-400 focus:outline-none text-right w-32"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Two Solid Green Boxes: VENDOR & SHIP TO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* VENDOR Box (With inline dropdown & Auto Loaded Details from Master) */}
                <div className="space-y-1">
                  <div className="bg-emerald-600 text-white font-black text-[11px] px-3 py-1 uppercase tracking-wider flex justify-between items-center">
                    <span>VENDOR</span>
                    <span className="text-[9px] font-semibold bg-emerald-700 text-emerald-100 px-1.5 py-0.5 rounded no-print">
                      Indent Approved
                    </span>
                  </div>
                  <div className="p-3 text-[11px] text-slate-700 leading-tight border border-slate-200 min-h-[140px] bg-slate-50/50 space-y-1.5">
                    {/* Dropdown directly inside the VENDOR section */}
                    <div className="no-print pb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                        Select Vendor:
                      </label>
                      <select
                        value={selectedIndentId}
                        onChange={(e) => setSelectedIndentId(e.target.value)}
                        className="w-full p-1.5 bg-white border border-emerald-500 text-slate-950 font-black text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
                      >
                        {approvedIndents.length === 0 ? (
                          <option value="">No Approved Indents</option>
                        ) : (
                          approvedIndents.map((item) => {
                            const vName = item.vendorName || item.preferredVendor || 'Vendor';
                            return (
                              <option key={item.id} value={item.id}>
                                {vName} ({item.indentNumber})
                              </option>
                            );
                          })
                        )}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <p className="font-black text-slate-950 text-xs flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 inline no-print" />
                        <span>{vendorDetails.name || 'Company Name'}</span>
                      </p>
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-900">Address: </span>
                        <span>{vendorDetails.address}{vendorDetails.city ? `, ${vendorDetails.city}` : ''}</span>
                      </p>
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-900">GST No.: </span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">{vendorDetails.gstin}</span>
                      </p>
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-900">Email ID: </span>
                        <span>{vendorDetails.email}</span>
                      </p>
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-900">Contact Number: </span>
                        <span>{vendorDetails.mobile}</span>
                      </p>
                      <p className="text-slate-600">
                        <span className="font-semibold text-slate-900">Contact Person: </span>
                        <span>{vendorDetails.contactPerson}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* SHIP TO Box (Using Company Details from Master) */}
                <div className="space-y-1">
                  <div className="bg-emerald-600 text-white font-black text-[11px] px-3 py-1 uppercase tracking-wider">
                    SHIP TO
                  </div>
                  <div className="p-3 text-[11px] text-slate-700 leading-tight border border-slate-200 min-h-[140px] bg-slate-50/50 space-y-1">
                    <p className="font-black text-slate-950 text-xs">{shipToDetails.name}</p>
                    <p className="text-slate-900 font-bold">{companyDetails.companyName}</p>
                    <p className="text-slate-700">{companyDetails.address}</p>
                    <p className="text-slate-700">{companyDetails.city}, {companyDetails.state} {companyDetails.pincode}</p>
                    <p className="text-slate-700"><span className="font-bold text-slate-900">Phone: </span>{companyDetails.contactNumber || shipToDetails.phone}</p>
                  </div>
                </div>
              </div>

              {/* 3. 4-Column Bar with Solid Green Headers */}
              <div className="border border-emerald-600">
                <div className="grid grid-cols-4 bg-emerald-600 text-white font-black text-[10px] text-center uppercase tracking-wider divide-x divide-emerald-500 py-1">
                  <div>REQUISITIONER</div>
                  <div>SHIP VIA</div>
                  <div>F.O.B.</div>
                  <div>SHIPPING TERMS</div>
                </div>
                <div className="grid grid-cols-4 text-center text-[11px] font-semibold text-slate-800 divide-x divide-slate-200 py-1.5 bg-white">
                  <div className="px-1 truncate">{requisitioner || 'Digendra Verma'}</div>
                  <div className="px-1 truncate">{shipVia}</div>
                  <div className="px-1 truncate">{fob}</div>
                  <div className="px-1 truncate">{shippingTerms}</div>
                </div>
              </div>

              {/* 4. Line Items Table with Solid Green Header (NICHE ME PRODUCTS) */}
              <div className="border border-emerald-600 min-h-[260px] flex flex-col justify-between">
                <div>
                  <div className="grid grid-cols-12 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider py-1.5 px-2">
                    <div className="col-span-2">ITEM #</div>
                    <div className="col-span-5">DESCRIPTION</div>
                    <div className="col-span-1 text-center">QTY</div>
                    <div className="col-span-2 text-right">UNIT PRICE</div>
                    <div className="col-span-2 text-right">TOTAL</div>
                  </div>

                  <div className="divide-y divide-slate-100 text-[11px]">
                    {poItems.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 py-2 px-2 text-slate-800 items-center hover:bg-slate-50/60">
                        {isRevising ? (
                          <>
                            <div className="col-span-2 pr-1">
                              <input
                                type="text"
                                value={it.productCode}
                                onChange={(e) => handleUpdateItem(idx, 'productCode', e.target.value)}
                                className="w-full font-mono font-bold text-xs p-1 bg-amber-50/80 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div className="col-span-5 pr-1">
                              <input
                                type="text"
                                value={it.productName}
                                onChange={(e) => handleUpdateItem(idx, 'productName', e.target.value)}
                                className="w-full font-semibold text-xs p-1 bg-amber-50/80 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div className="col-span-1 pr-1">
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                                className="w-full text-center font-bold text-xs p-1 bg-amber-50/80 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div className="col-span-2 pr-1">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={it.unitPrice}
                                onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                                className="w-full text-right font-mono font-bold text-xs p-1 bg-amber-50/80 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-1 font-mono font-black text-slate-950">
                              <span>{parseFloat(it.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(idx)}
                                className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer transition-colors"
                                title="Delete Line Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="col-span-2 font-mono font-bold text-slate-700 truncate">
                              {it.productCode}
                            </div>
                            <div className="col-span-5 font-semibold text-slate-900 truncate">
                              {it.productName}
                            </div>
                            <div className="col-span-1 text-center font-bold">
                              {it.quantity} {it.unit ? <span className="text-[10px] text-slate-400 font-normal">{it.unit}</span> : ''}
                            </div>
                            <div className="col-span-2 text-right font-mono font-medium">
                              {parseFloat(it.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="col-span-2 text-right font-mono font-black text-slate-950">
                              {parseFloat(it.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Add Item row in revision mode */}
                    {isRevising && (
                      <div className="p-2 bg-amber-50/40 border-t border-dashed border-amber-300 flex justify-center">
                        <button
                          type="button"
                          onClick={handleAddRevisionItem}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Product Line</span>
                        </button>
                      </div>
                    )}

                    {/* Empty filler rows when not revising */}
                    {!isRevising && Array.from({ length: Math.max(2, 6 - poItems.length) }).map((_, i) => (
                      <div key={i} className="grid grid-cols-12 py-1.5 px-2 text-slate-400 select-none">
                        <div className="col-span-2">-</div>
                        <div className="col-span-5">-</div>
                        <div className="col-span-1 text-center">-</div>
                        <div className="col-span-2 text-right">-</div>
                        <div className="col-span-2 text-right">-</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Bottom Section: Comments & Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-1">
                {/* Left: Comments or Special Instructions */}
                <div className="sm:col-span-7 space-y-1">
                  <div className="bg-emerald-600 text-white font-black text-[11px] px-3 py-1 uppercase tracking-wider">
                    Comments or Special Instructions
                  </div>
                  <div className="p-3 border border-slate-200 min-h-[100px] text-[11px] text-slate-700 bg-slate-50/50">
                    <textarea
                      rows="3"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full bg-transparent focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Right: Subtotal, Tax, Shipping & TOTAL */}
                <div className="sm:col-span-5 space-y-1 text-[11px]">
                  <div className="flex justify-between py-1 px-2 bg-slate-50 border-b border-slate-200">
                    <span className="font-bold text-slate-600 uppercase">SUBTOTAL</span>
                    <span className="font-mono font-bold text-slate-900">
                      {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 px-2">
                    <span className="font-bold text-slate-600 uppercase">TAX ({taxPercent}%)</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {taxAmount > 0 ? taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 px-2">
                    <span className="font-bold text-slate-600 uppercase">SHIPPING</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {shippingCost > 0 ? shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 px-2">
                    <span className="font-bold text-slate-600 uppercase">OTHER</span>
                    <span className="font-mono text-slate-500">-</span>
                  </div>

                  {/* Yellow highlighted TOTAL row matching screenshot exactly */}
                  <div className="flex justify-between items-center py-2 px-3 bg-amber-400 text-slate-950 font-black text-sm rounded-sm shadow-xs mt-1">
                    <span className="uppercase tracking-wider">TOTAL</span>
                    <span className="font-mono text-base font-black">
                      ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Footer Inquiry Note */}
              <div className="text-center text-[10px] text-slate-500 pt-6 border-t border-slate-200">
                If you have any questions about this purchase order, please contact{' '}
                <span className="font-bold text-slate-800">
                  [{companyDetails.companyName}, Phone: {companyDetails.contactNumber || '+91-9876543210'}, E-mail: {companyDetails.email || 'purchase@company.com'}]
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Call-To-Action buttons (Print PO and Issue & Save PO at bottom as requested) */}
          <div className="no-print flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrintDocument}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl flex items-center space-x-2 cursor-pointer shadow-md transition-all border border-slate-700"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print PO</span>
            </button>

            {isRevising ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRevising(false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRevision}
                  className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-2xl flex items-center space-x-2 cursor-pointer shadow-xl shadow-amber-400/30 transition-all"
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Revised PO</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleIssuePO}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl flex items-center space-x-2 cursor-pointer shadow-xl shadow-emerald-500/30 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Issue & Save PO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PO HISTORY TAB (Table view of all issued purchase orders)              */}
      {/* ========================================================================= */}
      {activeView === 'history' && (
        <div className="space-y-2.5">
          <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex justify-between items-center">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search PO #, Vendor, Indent #..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              Total Issued POs: {historyPOs.length}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {historyPOs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600 dark:text-slate-300">No issued purchase orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3">PO Number</th>
                      <th className="py-2 px-3">Indent Ref</th>
                      <th className="py-2 px-3">Vendor Name</th>
                      <th className="py-2 px-3">Department</th>
                      <th className="py-2 px-3 text-right">PO Total (₹)</th>
                      <th className="py-2 px-3 text-center">PO Date</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historyPOs.map((item) => {
                      const poVal = parseFloat(item.totalPOValue || item.approvedBudget || item.totalEstimatedValue || 0);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-1.5 px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            <div className="flex items-center gap-1.5">
                              <span>{item.poNumber || 'PO-OK'}</span>
                              {item.revisionCount ? (
                                <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full">
                                  R{item.revisionCount}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">{item.indentNumber}</td>
                          <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">
                            {item.vendorName || item.preferredVendor}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 font-medium">{item.department}</td>
                          <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                            ₹ {poVal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                            {item.poDate || item.indentDate}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedIndentId(item.id);
                                  setActiveView('document');
                                  setIsRevising(false);
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 transition-all cursor-pointer shadow-xs"
                                title="View & Print PO"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedIndentId(item.id);
                                  setActiveView('document');
                                  setIsRevising(true);
                                }}
                                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold flex items-center space-x-1 transition-all cursor-pointer shadow-xs"
                                title="Edit & Revise this PO"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Revise</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparative Quotation Matrix (L1/L2/L3) Modal */}
      <ComparativeMatrixModal
        isOpen={isComparativeMatrixOpen}
        onClose={() => setIsComparativeMatrixOpen(false)}
        indent={activeIndent}
        masterVendors={masterVendors}
        onApplyWinningQuote={handleApplyWinningQuote}
      />
    </div>
  );
}
