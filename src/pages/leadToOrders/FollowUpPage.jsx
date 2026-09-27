import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Plus,
  Search,
  Filter,
  Calendar,
  Phone,
  MessageSquare,
  Mail,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  X,
  ArrowRight,
  ChevronRight,
  Eye,
  History
} from 'lucide-react';
import { useLeadStorage } from '../../hooks/useLeadStorage';
import {
  LTO_KEYS,
  addFollowUp,
  generateFollowUpId
} from '../../services/leadToOrderStorageService';
import { getCurrentUser } from '../../services/otdStorageService';

const FOLLOW_UP_MODES = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Visit', 'Other'];

const NEXT_ACTIONS = [
  'Call Back',
  'Send Quotation',
  'Meeting',
  'Send Details',
  'Negotiation',
  'Wait for Customer',
  'Other'
];

export function FollowUpPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const leads = useLeadStorage(LTO_KEYS.LEADS, []);
  const followUps = useLeadStorage(LTO_KEYS.FOLLOW_UPS, []);
  const currentUser = getCurrentUser();

  const todayStr = new Date().toISOString().split('T')[0];

  // Active View Tab: 'today', 'pending', 'upcoming', 'history'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeadIdFilter, setSelectedLeadIdFilter] = useState(searchParams.get('leadId') || 'ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewHistoryLead, setViewHistoryLead] = useState(null);

  // Form State
  const initialForm = {
    followUpId: '',
    leadId: '',
    followUpDate: todayStr,
    followUpTime: '11:00',
    customer: '',
    contactPerson: '',
    followUpMode: 'Call',
    discussion: '',
    customerRequirement: '',
    customerResponse: '',
    nextFollowUpDate: todayStr,
    nextAction: 'Call Back',
    remarks: '',
    attachment: '',
    followUpBy: currentUser?.name || 'Sales Officer'
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const qLeadId = searchParams.get('leadId');
    if (qLeadId) {
      setSelectedLeadIdFilter(qLeadId);
      const lead = leads.find(l => l.leadId === qLeadId);
      if (lead && searchParams.get('action') === 'add') {
        handleOpenAddModal(lead);
      }
    }
  }, [searchParams, leads]);

  const handleOpenAddModal = (preselectedLead = null) => {
    const targetLead = preselectedLead || (selectedLeadIdFilter !== 'ALL' ? leads.find(l => l.leadId === selectedLeadIdFilter) : leads[0]);
    setForm({
      ...initialForm,
      followUpId: generateFollowUpId(),
      leadId: targetLead?.leadId || '',
      customer: targetLead?.customerName || '',
      contactPerson: targetLead?.contactPerson || '',
      followUpDate: todayStr,
      followUpTime: new Date().toTimeString().slice(0, 5),
      nextFollowUpDate: todayStr
    });
    setIsModalOpen(true);
  };

  const handleLeadSelectInForm = (leadId) => {
    const lead = leads.find(l => l.leadId === leadId);
    if (!lead) return;
    setForm({
      ...form,
      leadId: lead.leadId,
      customer: lead.customerName,
      contactPerson: lead.contactPerson
    });
  };

  const handleSubmitFollowUp = (e) => {
    e.preventDefault();
    if (!form.leadId) {
      alert('Please select a Lead ID');
      return;
    }
    if (!form.discussion.trim()) {
      alert('Discussion notes are required');
      return;
    }

    addFollowUp(form);
    setIsModalOpen(false);

    // If next action is "Send Quotation", offer direct jump to quotation creation
    if (form.nextAction === 'Send Quotation') {
      if (window.confirm(`Next action is "Send Quotation". Would you like to create Quotation for ${form.leadId} now?`)) {
        navigate(`/lead-to-orders/quotation?leadId=${form.leadId}&action=create`);
      }
    }
  };

  // Filter follow-ups by tab
  const getTabFilteredFollowUps = () => {
    return followUps.filter(f => {
      // 1. Lead ID filter
      if (selectedLeadIdFilter !== 'ALL' && f.leadId !== selectedLeadIdFilter) {
        return false;
      }

      // 2. Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          f.leadId?.toLowerCase().includes(q) ||
          f.customer?.toLowerCase().includes(q) ||
          f.contactPerson?.toLowerCase().includes(q) ||
          f.discussion?.toLowerCase().includes(q) ||
          f.followUpBy?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 3. Tab date logic
      if (activeTab === 'today') {
        return f.followUpDate === todayStr || f.nextFollowUpDate === todayStr;
      }
      if (activeTab === 'pending') {
        // nextFollowUpDate < today
        return f.nextFollowUpDate && f.nextFollowUpDate < todayStr;
      }
      if (activeTab === 'upcoming') {
        // nextFollowUpDate > today
        return f.nextFollowUpDate && f.nextFollowUpDate > todayStr;
      }
      // 'history'
      return true;
    });
  };

  const displayedFollowUps = getTabFilteredFollowUps();

  const getModeIcon = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'call': return <Phone className="w-3.5 h-3.5 text-blue-500" />;
      case 'whatsapp': return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case 'email': return <Mail className="w-3.5 h-3.5 text-indigo-500" />;
      case 'meeting':
      case 'visit': return <Users className="w-3.5 h-3.5 text-purple-500" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 px-3.5 py-2.5 rounded-xl text-white shadow-md border border-sky-800/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-extrabold text-[10px] tracking-wider uppercase border border-sky-500/30">
              Enquiry Engagement & Follow-up Tracking
            </span>
          </div>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5 text-white">
            Client Follow-ups & Activity History
          </h1>
          <p className="text-[11px] text-slate-300 max-w-2xl">
            Maintain complete sequential interaction logs for every lead. Multiple touchpoints are logged non-destructively to preserve full conversation context.
          </p>
        </div>
        <button
          onClick={() => handleOpenAddModal()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-sm shadow-sky-600/30 transition-all cursor-pointer transform active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Log Follow-up</span>
        </button>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Today's Follow-ups ({followUps.filter(f => f.followUpDate === todayStr || f.nextFollowUpDate === todayStr).length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Pending / Overdue ({followUps.filter(f => f.nextFollowUpDate && f.nextFollowUpDate < todayStr).length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Upcoming Follow-ups ({followUps.filter(f => f.nextFollowUpDate && f.nextFollowUpDate > todayStr).length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Follow-up History ({followUps.length})
          </button>
        </div>

        {/* Lead Selector & Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedLeadIdFilter}
            onChange={(e) => setSelectedLeadIdFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
          >
            <option value="ALL">All Leads</option>
            {leads.map(l => (
              <option key={l.id} value={l.leadId}>
                {l.leadId} - {l.customerName}
              </option>
            ))}
          </select>

          <div className="relative flex-1 md:w-52">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search follow-ups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Follow-up Cards & History List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedFollowUps.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No follow-up records found in this category. Click "+ Log Follow-up" to record a discussion.
          </div>
        ) : (
          displayedFollowUps.map((flw) => {
            const lead = leads.find(l => l.leadId === flw.leadId);
            const leadFollowUps = followUps.filter(f => f.leadId === flw.leadId);

            return (
              <div
                key={flw.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {flw.followUpId} • {flw.leadId}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {getModeIcon(flw.followUpMode)}
                      <span>{flw.followUpMode}</span>
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {flw.customer}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Contact: <strong className="text-slate-700 dark:text-slate-300">{flw.contactPerson || lead?.contactPerson || 'Direct'}</strong>
                    </p>
                  </div>

                  {/* Discussion Body */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Discussion Points:</div>
                    <p className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed">
                      {flw.discussion}
                    </p>
                    {flw.customerRequirement && (
                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500">
                        <strong className="text-slate-700 dark:text-slate-300">Requirement:</strong> {flw.customerRequirement}
                      </div>
                    )}
                    {flw.customerResponse && (
                      <div className="text-[11px] text-slate-500">
                        <strong className="text-slate-700 dark:text-slate-300">Response:</strong> {flw.customerResponse}
                      </div>
                    )}
                  </div>

                  {/* Next Step Info */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Next Action</span>
                      <strong className="text-sky-600 dark:text-sky-400 font-extrabold">{flw.nextAction}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Next Follow-up Date</span>
                      <strong className="text-slate-700 dark:text-slate-300">{flw.nextFollowUpDate || '—'}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Logged by: <strong className="text-slate-600 dark:text-slate-300">{flw.followUpBy}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* View Lead History Modal */}
                    <button
                      onClick={() => setViewHistoryLead(flw.leadId)}
                      title="View all history for this lead"
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3 h-3" />
                      <span>{leadFollowUps.length} Logs</span>
                    </button>

                    {/* Progress to Quotation */}
                    <button
                      onClick={() => navigate(`/lead-to-orders/quotation?leadId=${flw.leadId}&action=create`)}
                      className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Quote</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD FOLLOW-UP RECORD (CREATES SEPARATE CHRONOLOGICAL ENTRY)       */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Log Customer Follow-up & Discussion
                  </h2>
                  <p className="text-xs text-slate-400">
                    Creates a new chronological entry without overwriting previous logs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFollowUp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Follow-up ID (Auto)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={form.followUpId}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Select Lead ID *
                  </label>
                  <select
                    required
                    value={form.leadId}
                    onChange={(e) => handleLeadSelectInForm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="">-- Choose Lead --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.leadId}>
                        {l.leadId} - {l.customerName}
                      </option>
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
                    value={form.customer}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Follow-up Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.followUpDate}
                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Follow-up Time
                  </label>
                  <input
                    type="time"
                    value={form.followUpTime}
                    onChange={(e) => setForm({ ...form, followUpTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Follow-up Mode *
                  </label>
                  <select
                    value={form.followUpMode}
                    onChange={(e) => setForm({ ...form, followUpMode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {FOLLOW_UP_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Discussion Points *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the interaction, questions asked, terms discussed..."
                  value={form.discussion}
                  onChange={(e) => setForm({ ...form, discussion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Customer Specific Requirement
                  </label>
                  <input
                    type="text"
                    placeholder="Specific delivery lot, grade, testing requirement..."
                    value={form.customerRequirement}
                    onChange={(e) => setForm({ ...form, customerRequirement: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Customer Response / Feedback
                  </label>
                  <input
                    type="text"
                    placeholder="Positive, pricing concern, needs sample..."
                    value={form.customerResponse}
                    onChange={(e) => setForm({ ...form, customerResponse: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Next Action *
                  </label>
                  <select
                    value={form.nextAction}
                    onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400"
                  >
                    {NEXT_ACTIONS.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Next Follow-up Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.nextFollowUpDate}
                    onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Follow-up By
                  </label>
                  <input
                    type="text"
                    value={form.followUpBy}
                    onChange={(e) => setForm({ ...form, followUpBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-600/30 transition-all cursor-pointer transform active:scale-95"
                >
                  Save Follow-up Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMPLETE INTERACTION HISTORY FOR A LEAD                          */}
      {/* ========================================================================= */}
      {viewHistoryLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Sequential Follow-up Timeline: {viewHistoryLead}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Every touchpoint recorded for this client in chronological order
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewHistoryLead(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {followUps.filter(f => f.leadId === viewHistoryLead).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  No interaction history recorded yet for this lead.
                </div>
              ) : (
                followUps
                  .filter(f => f.leadId === viewHistoryLead)
                  .map((log, idx) => (
                    <div
                      key={log.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-black text-[11px] flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100">
                            {log.followUpMode} on {log.followUpDate} @ {log.followUpTime || '11:00'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          By: {log.followUpBy}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                        {log.discussion}
                      </p>
                      <div className="pl-8 pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                        <span className="text-slate-500">
                          Next Action: <strong className="text-sky-600 dark:text-sky-400">{log.nextAction}</strong>
                        </span>
                        <span className="text-slate-500">
                          Target Date: <strong>{log.nextFollowUpDate}</strong>
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setViewHistoryLead(null)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
