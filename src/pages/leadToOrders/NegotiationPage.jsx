import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  FileText,
  X,
  History,
  AlertCircle,
  ArrowRight,
  User,
  Building
} from 'lucide-react';
import { useLeadStorage } from '../../hooks/useLeadStorage';
import {
  LTO_KEYS,
  addNegotiation,
  generateNegotiationId
} from '../../services/leadToOrderStorageService';
import { getCurrentUser } from '../../services/otdStorageService';

const NEGOTIATION_STATUSES = ['Negotiation', 'Accepted', 'Rejected', 'Hold'];

export function NegotiationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const leads = useLeadStorage(LTO_KEYS.LEADS, []);
  const quotations = useLeadStorage(LTO_KEYS.QUOTATIONS, []);
  const negotiations = useLeadStorage(LTO_KEYS.NEGOTIATIONS, []);
  const currentUser = getCurrentUser();

  const todayStr = new Date().toISOString().split('T')[0];

  // Filters
  const [selectedLeadIdFilter, setSelectedLeadIdFilter] = useState(searchParams.get('leadId') || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [historyLeadId, setHistoryLeadId] = useState(null);

  // Form State
  const initialFormState = {
    negotiationId: '',
    leadId: '',
    quotationNo: '',
    customerName: '',
    negotiationDate: todayStr,
    customerExpectedPrice: 0,
    companyOfferedPrice: 0,
    discount: 0,
    revisedPrice: 0,
    paymentTerms: '',
    deliveryTerms: '',
    discussion: '',
    customerResponse: '',
    negotiationRemarks: '',
    nextFollowUpDate: todayStr,
    negotiatedBy: currentUser?.name || 'Sales Manager',
    status: 'Negotiation'
  };

  const [form, setForm] = useState(initialFormState);

  // Auto open modal if ?action=create or ?leadId is in params
  useEffect(() => {
    const qLeadId = searchParams.get('leadId');
    const qQuoteNo = searchParams.get('quotationNo');
    if (qLeadId) {
      setSelectedLeadIdFilter(qLeadId);
      const targetLead = leads.find(l => l.leadId === qLeadId);
      const targetQuote = quotations.find(q => q.quotationNo === qQuoteNo || q.leadId === qLeadId);
      if (searchParams.get('action') === 'create' || !negotiations.some(n => n.leadId === qLeadId)) {
        handleOpenAddModal(targetLead, targetQuote);
      }
    }
  }, [searchParams, leads, quotations]);

  const handleOpenAddModal = (leadObj = null, quoteObj = null) => {
    const lead = leadObj || leads[0];
    const quote = quoteObj || quotations.find(q => q.leadId === lead?.leadId) || quotations[0];

    const offeredPrice = quote?.grandTotal || 100000;
    const expectedPrice = Math.round(offeredPrice * 0.9);
    const revisedPrice = Math.round(offeredPrice * 0.95);
    const discount = Math.round(((offeredPrice - revisedPrice) / offeredPrice) * 100 * 10) / 10;

    setForm({
      ...initialFormState,
      negotiationId: generateNegotiationId(),
      leadId: lead?.leadId || '',
      quotationNo: quote?.quotationNo || lead?.quotationNo || '',
      customerName: lead?.customerName || quote?.customer || '',
      customerExpectedPrice: expectedPrice,
      companyOfferedPrice: offeredPrice,
      discount,
      revisedPrice,
      paymentTerms: quote?.paymentTerms || '30 Days credit',
      deliveryTerms: quote?.deliveryTerms || 'Free freight included',
      negotiationDate: todayStr,
      nextFollowUpDate: todayStr,
      discussion: 'Client requested commercial discount of 5-10% to match competing offers.'
    });
    setIsAddModalOpen(true);
  };

  const handleSelectLeadInForm = (leadId) => {
    const lead = leads.find(l => l.leadId === leadId);
    const quote = quotations.find(q => q.leadId === leadId) || quotations.find(q => q.quotationNo === lead?.quotationNo);

    const offered = quote?.grandTotal || 0;
    const expected = Math.round(offered * 0.9);
    const revised = Math.round(offered * 0.95);

    setForm({
      ...form,
      leadId: lead?.leadId || '',
      customerName: lead?.customerName || '',
      quotationNo: quote?.quotationNo || lead?.quotationNo || '',
      companyOfferedPrice: offered,
      customerExpectedPrice: expected,
      revisedPrice: revised,
      discount: offered > 0 ? Math.round(((offered - revised) / offered) * 100 * 10) / 10 : 0,
      paymentTerms: quote?.paymentTerms || '',
      deliveryTerms: quote?.deliveryTerms || ''
    });
  };

  // Live calculation of revised price / discount
  const handlePriceChange = (field, val) => {
    const num = parseFloat(val) || 0;
    if (field === 'revisedPrice') {
      const offered = form.companyOfferedPrice || 1;
      const disc = Math.round(((offered - num) / offered) * 100 * 10) / 10;
      setForm({ ...form, revisedPrice: num, discount: Math.max(0, disc) });
    } else if (field === 'discount') {
      const offered = form.companyOfferedPrice || 0;
      const revised = Math.round(offered * (1 - num / 100));
      setForm({ ...form, discount: num, revisedPrice: revised });
    } else {
      setForm({ ...form, [field]: num });
    }
  };

  const handleSubmitNegotiation = (e) => {
    e.preventDefault();
    if (!form.leadId) {
      alert('Please select a Lead ID');
      return;
    }
    if (!form.discussion.trim()) {
      alert('Discussion notes are required');
      return;
    }

    addNegotiation(form);
    setIsAddModalOpen(false);

    if (form.status === 'Accepted') {
      if (window.confirm('Negotiation marked as Accepted! Navigate to Approval portal now?')) {
        navigate(`/lead-to-orders/approval?leadId=${form.leadId}&quotationNo=${form.quotationNo}`);
      }
    }
  };

  // Filter list
  const filteredNegotiations = negotiations.filter(n => {
    if (selectedLeadIdFilter !== 'ALL' && n.leadId !== selectedLeadIdFilter) return false;
    if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        n.negotiationId?.toLowerCase().includes(q) ||
        n.leadId?.toLowerCase().includes(q) ||
        n.quotationNo?.toLowerCase().includes(q) ||
        n.customerName?.toLowerCase().includes(q) ||
        n.discussion?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'hold':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 px-3.5 py-2.5 rounded-xl text-white shadow-md border border-purple-800/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-extrabold text-[10px] tracking-wider uppercase border border-purple-500/30">
              Commercial Deal Closure & Bargaining
            </span>
          </div>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5 text-white">
            Price Negotiation & Revision Logs
          </h1>
          <p className="text-[11px] text-slate-300 max-w-2xl">
            Maintain complete negotiation history. Record client counter-offers, concessions, and delivery terms. When customer accepts the final price, the deal transitions straight to Approval!
          </p>
        </div>
        <button
          onClick={() => handleOpenAddModal()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm shadow-purple-600/30 transition-all cursor-pointer transform active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Record Negotiation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search negotiations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Lead Filter */}
          <select
            value={selectedLeadIdFilter}
            onChange={(e) => setSelectedLeadIdFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Leads</option>
            {leads.map(l => (
              <option key={l.id} value={l.leadId}>{l.leadId} - {l.customerName}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            {NEGOTIATION_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <span className="text-xs text-slate-400">
            Total Records: <strong className="text-slate-700 dark:text-slate-200">{filteredNegotiations.length}</strong>
          </span>
        </div>
      </div>

      {/* Negotiation History Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNegotiations.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No negotiation logs found. Click "+ Record Negotiation" to log customer price discussions.
          </div>
        ) : (
          filteredNegotiations.map((neg) => {
            const leadLogs = negotiations.filter(n => n.leadId === neg.leadId);

            return (
              <div
                key={neg.id || neg.negotiationId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-purple-600 dark:text-purple-400">
                      {neg.negotiationId} • {neg.leadId}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(neg.status)}`}>
                      {neg.status}
                    </span>
                  </div>

                  {/* Customer & Quote */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {neg.customerName || 'Valued Customer'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Quote Ref: <strong className="text-indigo-600 dark:text-indigo-400">{neg.quotationNo || 'Direct'}</strong> • Date: {neg.negotiationDate}
                    </p>
                  </div>

                  {/* Pricing Comparison Grid */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-slate-200 dark:border-slate-700/60">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">Offered</span>
                        <strong className="text-slate-700 dark:text-slate-300 font-extrabold">
                          ₹ {Number(neg.companyOfferedPrice || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">Expected</span>
                        <strong className="text-rose-600 dark:text-rose-400 font-extrabold">
                          ₹ {Number(neg.customerExpectedPrice || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Revised</span>
                        <strong className="text-emerald-700 dark:text-emerald-300 font-black">
                          ₹ {Number(neg.revisedPrice || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Discount Concession: <strong>{neg.discount || 0}%</strong></span>
                      <span>By: <strong className="text-slate-700 dark:text-slate-300">{neg.negotiatedBy}</strong></span>
                    </div>
                  </div>

                  {/* Discussion Text */}
                  <div className="text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Discussion Notes:</span>
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                      {neg.discussion}
                    </p>
                    {neg.paymentTerms && (
                      <p className="text-[10px] text-slate-500">
                        Terms: <strong>{neg.paymentTerms}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setHistoryLeadId(neg.leadId)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <History className="w-3 h-3" />
                    <span>{leadLogs.length} Rounds</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* If accepted, navigate to Approval */}
                    <button
                      onClick={() => navigate(`/lead-to-orders/approval?leadId=${neg.leadId}&quotationNo=${neg.quotationNo}`)}
                      className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <FileCheck className="w-3 h-3" />
                      <span>Proceed to Approval</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEGOTIATION ROUND                                            */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Record Negotiation Round
                  </h2>
                  <p className="text-xs text-slate-400">
                    Saves a new negotiation record while keeping prior rounds intact
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNegotiation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Negotiation ID (Auto)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={form.negotiationId}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Select Lead ID *
                  </label>
                  <select
                    required
                    value={form.leadId}
                    onChange={(e) => handleSelectLeadInForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.leadId}>{l.leadId} - {l.customerName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Customer / Company
                  </label>
                  <input
                    type="text"
                    disabled
                    value={form.customerName}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Quotation Reference No.
                  </label>
                  <input
                    type="text"
                    value={form.quotationNo}
                    onChange={(e) => setForm({ ...form, quotationNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 font-bold"
                  />
                </div>
              </div>

              {/* Price Row: Offered vs Expected vs Revised */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Company Offered Price (₹)
                  </label>
                  <input
                    type="number"
                    value={form.companyOfferedPrice}
                    onChange={(e) => handlePriceChange('companyOfferedPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Customer Expected (₹)
                  </label>
                  <input
                    type="number"
                    value={form.customerExpectedPrice}
                    onChange={(e) => handlePriceChange('customerExpectedPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Revised Agreed Price (₹)
                  </label>
                  <input
                    type="number"
                    value={form.revisedPrice}
                    onChange={(e) => handlePriceChange('revisedPrice', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-600 rounded-xl text-xs font-black text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Discount Concession (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.discount}
                    onChange={(e) => handlePriceChange('discount', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Negotiation Date
                  </label>
                  <input
                    type="date"
                    value={form.negotiationDate}
                    onChange={(e) => setForm({ ...form, negotiationDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Negotiation Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400"
                  >
                    {NEGOTIATION_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Discussion Points & Bargaining Scope *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record commercial arguments, competitor pricing discussed, concessions granted..."
                  value={form.discussion}
                  onChange={(e) => setForm({ ...form, discussion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Payment Terms Agreed
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10% Advance, 90% against BL"
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Delivery Terms Agreed
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Free door delivery by Oct 15"
                    value={form.deliveryTerms}
                    onChange={(e) => setForm({ ...form, deliveryTerms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={form.nextFollowUpDate}
                    onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Negotiated By
                  </label>
                  <input
                    type="text"
                    value={form.negotiatedBy}
                    onChange={(e) => setForm({ ...form, negotiatedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer transform active:scale-95"
                >
                  Save Negotiation Round
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NEGOTIATION ROUND HISTORY FOR A LEAD                             */}
      {/* ========================================================================= */}
      {historyLeadId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Negotiation History: {historyLeadId}
                  </h2>
                  <p className="text-xs text-slate-400">
                    All bargaining rounds logged for this proposal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryLeadId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {negotiations.filter(n => n.leadId === historyLeadId).map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                      Round #{idx + 1} ({item.negotiationId}) on {item.negotiationDate}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                    <div>Offered: ₹ {Number(item.companyOfferedPrice || 0).toLocaleString('en-IN')}</div>
                    <div className="text-rose-600">Expected: ₹ {Number(item.customerExpectedPrice || 0).toLocaleString('en-IN')}</div>
                    <div className="font-extrabold text-emerald-600">Revised: ₹ {Number(item.revisedPrice || 0).toLocaleString('en-IN')}</div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300">
                    {item.discussion}
                  </p>
                  <div className="pt-2 flex justify-between border-t border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-400">
                    <span>Negotiated by: {item.negotiatedBy}</span>
                    <span>Terms: {item.paymentTerms || 'Standard'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setHistoryLeadId(null)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
