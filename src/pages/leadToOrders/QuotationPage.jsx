import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Search,
  Eye,
  Edit2,
  Share2,
  Send,
  CheckCircle2,
  Clock,
  History,
  Printer,
  X,
  AlertCircle,
  TrendingUp,
  FileCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Download
} from 'lucide-react';
import { useLeadStorage } from '../../hooks/useLeadStorage';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import {
  LTO_KEYS,
  saveQuotation,
  generateQuotationNumber
} from '../../services/leadToOrderStorageService';
import { STORAGE_KEYS as OTD_KEYS, getCurrentUser } from '../../services/otdStorageService';
import { QuotationPDFBuilderModal } from '../../components/leadToOrders/QuotationPDFBuilderModal';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function QuotationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const leads = useLeadStorage(LTO_KEYS.LEADS, []);
  const quotations = useLeadStorage(LTO_KEYS.QUOTATIONS, []);
  const products = useOTDStorage(OTD_KEYS.PRODUCTS, []);
  const currentUser = getCurrentUser();

  const todayStr = new Date().toISOString().split('T')[0];

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeQuotation, setActiveQuotation] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Quotation Form State
  const initialQuotationState = {
    quotationNo: '',
    quotationDate: todayStr,
    leadId: '',
    customer: '',
    contactPerson: '',
    mobile: '',
    email: '',
    billingAddress: '',
    shippingAddress: '',
    items: [
      {
        srNo: 1,
        productService: '',
        description: '',
        quantity: 1,
        unit: 'Pcs',
        rate: 500,
        discount: 0,
        taxPercent: 18,
        taxAmount: 90,
        total: 590
      }
    ],
    subTotal: 0,
    totalDiscount: 0,
    taxableAmount: 0,
    totalTax: 0,
    grandTotal: 0,
    paymentTerms: '50% Advance with PO, 50% prior to dispatch',
    deliveryTerms: 'Door Delivery, Freight Included',
    quotationValidity: '30 Days from date of issue',
    expectedDeliveryDate: '',
    remarks: '',
    attachment: '',
    status: 'Draft',
    createdBy: currentUser?.name || 'Sales Officer'
  };

  const [form, setForm] = useState(initialQuotationState);

  // Check for leadId from URL params (e.g. ?leadId=LD-1004&action=create)
  useEffect(() => {
    const qLeadId = searchParams.get('leadId');
    if (qLeadId && (searchParams.get('action') === 'create' || !quotations.some(q => q.leadId === qLeadId))) {
      const targetLead = leads.find(l => l.leadId === qLeadId);
      if (targetLead) {
        handleOpenCreateModal(targetLead);
      }
    }
  }, [searchParams, leads]);

  const handleOpenCreateModal = (leadObj = null) => {
    const lead = leadObj || leads[0];
    const newQuoteNo = generateQuotationNumber();

    const initialItem = {
      srNo: 1,
      productService: lead?.productService || (products[0]?.name || 'Standard Industrial Product'),
      description: lead?.initialRequirement || 'High standard commercial grade',
      quantity: parseFloat(lead?.expectedQuantity) || 10,
      unit: 'Pcs',
      rate: 1500,
      discount: 0,
      taxPercent: 18,
      taxAmount: 2700,
      total: 17700
    };

    const newForm = {
      ...initialQuotationState,
      quotationNo: newQuoteNo,
      quotationDate: todayStr,
      leadId: lead?.leadId || '',
      customer: lead?.customerName || '',
      contactPerson: lead?.contactPerson || '',
      mobile: lead?.mobile || '',
      email: lead?.email || '',
      billingAddress: lead?.address ? `${lead.address}, ${lead.city || ''} ${lead.state || ''}` : '',
      shippingAddress: lead?.address ? `${lead.address}, ${lead.city || ''} ${lead.state || ''}` : '',
      items: [initialItem],
      status: 'Draft'
    };

    setForm(recalculateTotals(newForm));
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (quote) => {
    setForm(recalculateTotals({ ...quote }));
    setIsFormModalOpen(true);
  };

  const handleLeadSelect = (leadId) => {
    const lead = leads.find(l => l.leadId === leadId);
    if (!lead) return;
    setForm(prev => recalculateTotals({
      ...prev,
      leadId: lead.leadId,
      customer: lead.customerName,
      contactPerson: lead.contactPerson,
      mobile: lead.mobile,
      email: lead.email || '',
      billingAddress: lead.address ? `${lead.address}, ${lead.city || ''} ${lead.state || ''}` : '',
      shippingAddress: lead.address ? `${lead.address}, ${lead.city || ''} ${lead.state || ''}` : ''
    }));
  };

  // Math recalculation
  const recalculateTotals = (formData) => {
    let sub = 0;
    let disc = 0;
    let tax = 0;

    const items = formData.items.map((item, idx) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const lineSub = qty * rate;
      const discountPct = parseFloat(item.discount) || 0;
      const discAmt = lineSub * (discountPct / 100);
      const taxable = lineSub - discAmt;
      const taxPct = parseFloat(item.taxPercent) || 0;
      const taxAmt = taxable * (taxPct / 100);
      const lineTotal = taxable + taxAmt;

      sub += lineSub;
      disc += discAmt;
      tax += taxAmt;

      return {
        ...item,
        srNo: idx + 1,
        taxAmount: Math.round(taxAmt * 100) / 100,
        total: Math.round(lineTotal * 100) / 100
      };
    });

    const taxableAmount = sub - disc;
    const grand = taxableAmount + tax;

    return {
      ...formData,
      items,
      subTotal: Math.round(sub * 100) / 100,
      totalDiscount: Math.round(disc * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      totalTax: Math.round(tax * 100) / 100,
      grandTotal: Math.round(grand * 100) / 100
    };
  };

  // Item Table handlers
  const handleAddItem = () => {
    const newItem = {
      srNo: form.items.length + 1,
      productService: '',
      description: '',
      quantity: 1,
      unit: 'Pcs',
      rate: 1000,
      discount: 0,
      taxPercent: 18,
      taxAmount: 180,
      total: 1180
    };
    const updated = { ...form, items: [...form.items, newItem] };
    setForm(recalculateTotals(updated));
  };

  const handleRemoveItem = (index) => {
    if (form.items.length === 1) {
      alert('Quotation must contain at least one line item.');
      return;
    }
    const filtered = form.items.filter((_, i) => i !== index);
    setForm(recalculateTotals({ ...form, items: filtered }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setForm(recalculateTotals({ ...form, items: updatedItems }));
  };

  // Submit / Save actions
  const handleSave = (targetStatus = 'Draft') => {
    if (!form.leadId) {
      alert('Please select a Lead ID');
      return;
    }
    if (!form.customer.trim()) {
      alert('Customer Name is required');
      return;
    }
    if (form.items.length === 0) {
      alert('At least one item is required');
      return;
    }

    const payload = {
      ...form,
      status: targetStatus
    };

    saveQuotation(payload);
    setIsFormModalOpen(false);

    if (targetStatus === 'Under Negotiation') {
      if (window.confirm('Quotation submitted for Negotiation! Navigate to Negotiation stage now?')) {
        navigate(`/lead-to-orders/negotiation?leadId=${form.leadId}&quotationNo=${form.quotationNo}`);
      }
    } else if (targetStatus === 'Submitted for Approval') {
      if (window.confirm('Quotation submitted for Approval! Navigate to Approval portal now?')) {
        navigate(`/lead-to-orders/approval?leadId=${form.leadId}&quotationNo=${form.quotationNo}`);
      }
    }
  };

  // Pending / History split
  const pendingQuotes = quotations.filter(q => q.status !== 'Approved' && q.status !== 'Rejected');
  const historyQuotes = quotations.filter(q => q.status === 'Approved' || q.status === 'Rejected');
  const baseQuotes = activeTab === 'pending' ? pendingQuotes : historyQuotes;

  // Filtering
  const filteredQuotations = baseQuotes.filter(q => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const match =
        q.quotationNo?.toLowerCase().includes(s) ||
        q.leadId?.toLowerCase().includes(s) ||
        q.customer?.toLowerCase().includes(s) ||
        q.contactPerson?.toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'submitted for approval':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'under negotiation':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'sent':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] tracking-wider uppercase border border-indigo-200 dark:border-indigo-800/80">
            Commercial Quotes
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Quotations & Rate Schedules
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-2 py-1 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({pendingQuotes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-2 py-1 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({historyQuotes.length})</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer transform active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Quotation</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Quote No, Lead ID, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Under Negotiation">Under Negotiation</option>
            <option value="Submitted for Approval">Submitted for Approval</option>
            <option value="Approved">Approved</option>
          </select>
          <span className="text-xs text-slate-400">
            Total Quotations: <strong className="text-slate-700 dark:text-slate-200">{filteredQuotations.length}</strong>
          </span>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-2 px-3">Quotation No</th>
                <th className="py-2 px-3">Lead ID</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Contact</th>
                <th className="py-2 px-3 text-right">Subtotal</th>
                <th className="py-2 px-3 text-right">Tax (GST)</th>
                <th className="py-2 px-3 text-right">Grand Total</th>
                <th className="py-2 px-3">Status</th>
                {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                    No quotation records found. Click "+ Create Quotation" to generate your first proposal.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quote) => (
                  <tr key={quote.id || quote.quotationNo} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-1.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {quote.quotationNo}
                    </td>
                    <td className="py-1.5 px-3 font-extrabold text-violet-600 dark:text-violet-400">
                      {quote.leadId}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">
                      {quote.quotationDate}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                      {quote.customer}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">
                      <div>{quote.contactPerson}</div>
                      <span className="text-[10px] text-slate-400">{quote.mobile}</span>
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      ₹ {Number(quote.subTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1.5 px-3 text-right text-slate-600 dark:text-slate-400">
                      ₹ {Number(quote.totalTax || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                      ₹ {Number(quote.grandTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    {activeTab === 'pending' ? (
                      <PlannedTd plannedDate={quote.expectedDeliveryDate || quote.quotationDate} />
                    ) : (
                      <HistoryTatTd
                        plannedDate={quote.expectedDeliveryDate || quote.quotationDate}
                        actualDate={quote.updatedAt?.split('T')[0] || quote.quotationDate}
                      />
                    )}
                    <td className="py-1.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Preview / Print */}
                        <button
                          title="Preview Quotation"
                          onClick={() => {
                            setActiveQuotation(quote);
                            setIsPreviewModalOpen(true);
                          }}
                          className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          title="Edit Quotation"
                          onClick={() => handleOpenEditModal(quote)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Share */}
                        <button
                          title="Share Quotation"
                          onClick={() => {
                            setActiveQuotation(quote);
                            setIsShareModalOpen(true);
                          }}
                          className="p-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT QUOTATION (WITH LIVE MATH RECALCULATION)            */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Quotation Generator: {form.quotationNo}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Draft proposal, itemized pricing, GST calculation & commercial terms
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Quotation No (Auto)
                </label>
                <input
                  type="text"
                  disabled
                  value={form.quotationNo}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Quotation Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.quotationDate}
                  onChange={(e) => setForm({ ...form, quotationDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Select Lead ID *
                </label>
                <select
                  value={form.leadId}
                  onChange={(e) => handleLeadSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-violet-600 dark:text-violet-400 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Lead --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.leadId}>
                      {l.leadId} - {l.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Customer / Company *
                </label>
                <input
                  type="text"
                  required
                  value={form.customer}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Quotation Validity
                </label>
                <input
                  type="text"
                  value={form.quotationValidity}
                  onChange={(e) => setForm({ ...form, quotationValidity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={form.billingAddress}
                  onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Shipping / Delivery Site Address
                </label>
                <textarea
                  rows={2}
                  value={form.shippingAddress}
                  onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Interactive Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                  Line Items & Product Breakdown
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Sr</th>
                      <th className="p-2.5 min-w-[180px]">Product / Service</th>
                      <th className="p-2.5 min-w-[150px]">Description</th>
                      <th className="p-2.5 w-20">Qty</th>
                      <th className="p-2.5 w-20">Unit</th>
                      <th className="p-2.5 w-24">Rate (₹)</th>
                      <th className="p-2.5 w-16">Disc %</th>
                      <th className="p-2.5 w-16">Tax %</th>
                      <th className="p-2.5 w-24 text-right">Tax Amt</th>
                      <th className="p-2.5 w-28 text-right">Total (₹)</th>
                      <th className="p-2.5 w-10 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {form.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            placeholder="Item name"
                            value={item.productService}
                            onChange={(e) => handleItemChange(idx, 'productService', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Specs/grade"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxPercent}
                            onChange={(e) => handleItemChange(idx, 'taxPercent', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center"
                          />
                        </td>
                        <td className="p-2 text-right font-medium text-slate-500">
                          ₹ {Number(item.taxAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 text-right font-extrabold text-slate-900 dark:text-white">
                          ₹ {Number(item.total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Summary Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Terms and Conditions */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Delivery Terms
                  </label>
                  <input
                    type="text"
                    value={form.deliveryTerms}
                    onChange={(e) => setForm({ ...form, deliveryTerms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={form.expectedDeliveryDate}
                      onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Remarks / Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Test certs included"
                      value={form.remarks}
                      onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Total Calculation Panel */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹ {Number(form.subTotal || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Total Discount:</span>
                  <span>- ₹ {Number(form.totalDiscount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Taxable Amount:</span>
                  <span className="font-semibold">₹ {Number(form.taxableAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>GST Amount (Tax):</span>
                  <span className="font-semibold">₹ {Number(form.totalTax || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline text-sm">
                  <span className="font-extrabold text-slate-900 dark:text-white">Grand Total:</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 text-base">
                    ₹ {Number(form.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave('Draft')}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('Sent')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Save & Send
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('Under Negotiation')}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Submit for Negotiation</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('Submitted for Approval')}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Submit for Approval</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: 1-CLICK PROFESSIONAL QUOTATION PDF BUILDER & GENERATOR            */}
      {/* ========================================================================= */}
      <QuotationPDFBuilderModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        quotation={activeQuotation}
      />

      {/* ========================================================================= */}
      {/* MODAL 3: SHARE MODAL                                                      */}
      {/* ========================================================================= */}
      {isShareModalOpen && activeQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Share Quotation {activeQuotation.quotationNo}
              </h3>
              <button onClick={() => setIsShareModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              Send proposal directly to <strong>{activeQuotation.customer}</strong> ({activeQuotation.contactPerson})
            </p>

            <div className="space-y-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Dear ${activeQuotation.contactPerson},\nPlease find commercial quotation ${activeQuotation.quotationNo} for amount INR ${activeQuotation.grandTotal}.\nThank you,\nGimBooks Enterprise ERP`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <span>Share via WhatsApp</span>
              </a>

              <a
                href={`mailto:${activeQuotation.email || ''}?subject=Quotation ${activeQuotation.quotationNo}&body=Dear ${activeQuotation.contactPerson},%0D%0A%0D%0APlease find attached quotation ${activeQuotation.quotationNo} for amount INR ${activeQuotation.grandTotal}.%0D%0A%0D%0ARegards,%0D%0ASales Team`}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <span>Share via Email</span>
              </a>
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400">
              Quotation total: ₹ {Number(activeQuotation.grandTotal || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
