import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  FileCheck,
  X,
  Upload,
  Calendar,
  Building,
  Phone,
  Mail,
  MapPin,
  Tag,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useLeadStorage } from '../../hooks/useLeadStorage';
import {
  LTO_KEYS,
  saveLead,
  updateLead,
  deleteLead,
  generateLeadId
} from '../../services/leadToOrderStorageService';
import { getCurrentUser } from '../../services/otdStorageService';
import { MarkDealLostModal } from '../../components/leadToOrders/MarkDealLostModal';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

const LEAD_TABS = [
  { id: 'all', label: 'All Leads' },
  { id: 'new', label: 'New Leads' },
  { id: 'verification', label: 'Verification Pending' },
  { id: 'follow-up', label: 'Follow-up / Enquiry' },
  { id: 'quotation', label: 'Quotation' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'approval-pending', label: 'Approval Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'closed', label: 'Closed' }
];

const LEAD_SOURCES = [
  'Website',
  'WhatsApp',
  'Phone',
  'Email',
  'Reference',
  'Social Media',
  'Walk-in',
  'Other'
];

const CUSTOMER_TYPES = [
  'Corporate',
  'Retail',
  'Distributor',
  'OEM',
  'Government',
  'Other'
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export function LeadsManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const leads = useLeadStorage(LTO_KEYS.LEADS, []);
  const currentUser = getCurrentUser();

  // Active Tab
  const activeTab = searchParams.get('tab') || 'all';
  const setActiveTab = (tabId) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isHistoryTab = activeTab === 'approved' || activeTab === 'rejected' || activeTab === 'closed';

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form State for Lead Creation / Editing
  const initialFormState = {
    leadId: '',
    leadDate: new Date().toISOString().split('T')[0],
    leadSource: 'Website',
    customerType: 'Corporate',
    customerName: '',
    contactPerson: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    productService: '',
    expectedQuantity: '',
    expectedPurchaseDate: '',
    priority: 'Medium',
    assignedTo: currentUser?.name || 'Rahul Mehta',
    initialRequirement: '',
    remarks: '',
    attachment: ''
  };

  const [leadForm, setLeadForm] = useState(initialFormState);

  // Verification Form State
  const [verificationForm, setVerificationForm] = useState({
    verificationStatus: 'Verified',
    contactVerified: true,
    customerDetailsVerified: true,
    requirementValid: true,
    duplicateLead: false,
    verificationRemarks: '',
    verifiedBy: currentUser?.name || 'Senior Sales Officer',
    verificationDate: new Date().toISOString().split('T')[0]
  });

  // Open create modal if URL says ?action=create
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      handleOpenCreateModal();
    }
    const highlightLeadId = searchParams.get('leadId');
    if (highlightLeadId) {
      const target = leads.find(l => l.leadId === highlightLeadId);
      if (target) {
        setSelectedLead(target);
        setIsDetailModalOpen(true);
      }
    }
  }, [searchParams, leads]);

  const handleOpenCreateModal = () => {
    setLeadForm({
      ...initialFormState,
      leadId: generateLeadId(),
      leadDate: new Date().toISOString().split('T')[0]
    });
    setIsEditMode(false);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (lead) => {
    setSelectedLead(lead);
    setLeadForm({ ...lead });
    setIsEditMode(true);
    setIsCreateModalOpen(true);
  };

  const handleOpenVerifyModal = (lead) => {
    setSelectedLead(lead);
    setVerificationForm({
      verificationStatus: 'Verified',
      contactVerified: true,
      customerDetailsVerified: true,
      requirementValid: true,
      duplicateLead: false,
      verificationRemarks: 'Customer details verified and requirement is valid for quoting.',
      verifiedBy: currentUser?.name || 'Senior Sales Officer',
      verificationDate: new Date().toISOString().split('T')[0]
    });
    setIsVerifyModalOpen(true);
  };

  const handleOpenDetailModal = (lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  // Submit Lead Form
  const handleSubmitLeadForm = (e) => {
    e.preventDefault();
    if (!leadForm.customerName.trim()) {
      alert('Customer / Company Name is required');
      return;
    }
    if (!leadForm.mobile.trim()) {
      alert('Mobile Number is required');
      return;
    }

    if (isEditMode && selectedLead) {
      updateLead(selectedLead.id, leadForm);
    } else {
      saveLead({
        ...leadForm,
        status: 'New',
        currentStage: 'Lead Verification'
      });
    }

    setIsCreateModalOpen(false);
    // Remove action from url if present
    if (searchParams.get('action')) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      });
    }
  };

  // Submit Verification Form
  const handleSubmitVerification = (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    if (verificationForm.verificationStatus === 'Verified') {
      updateLead(selectedLead.id, {
        status: 'Verified',
        currentStage: 'Follow-up / Enquiry',
        verificationDetails: { ...verificationForm }
      });
    } else if (verificationForm.verificationStatus === 'Rejected') {
      updateLead(selectedLead.id, {
        status: 'Rejected',
        currentStage: 'Closed',
        verificationDetails: { ...verificationForm }
      });
    } else {
      // Hold
      updateLead(selectedLead.id, {
        status: 'Hold',
        currentStage: 'Lead Verification',
        verificationDetails: { ...verificationForm }
      });
    }

    setIsVerifyModalOpen(false);
  };

  // Quick Reject / Record Deal Loss
  const handleQuickReject = (lead) => {
    setSelectedLead(lead);
    setIsLossModalOpen(true);
  };

  // Delete Lead
  const handleDeleteLead = (lead) => {
    if (window.confirm(`Permanently delete lead ${lead.leadId}?`)) {
      deleteLead(lead.id);
      if (selectedLead?.id === lead.id) {
        setIsDetailModalOpen(false);
      }
    }
  };

  // Filter Leads based on activeTab, search, priority
  const filteredLeads = leads.filter(lead => {
    // 1. Tab match
    if (activeTab === 'new') {
      if (lead.status !== 'New') return false;
    } else if (activeTab === 'verification') {
      if (lead.currentStage !== 'Lead Verification' && lead.status !== 'Verification Pending') return false;
    } else if (activeTab === 'follow-up') {
      if (lead.currentStage !== 'Follow-up / Enquiry' && lead.status !== 'Follow-up / Enquiry') return false;
    } else if (activeTab === 'quotation') {
      if (lead.currentStage !== 'Quotation' && lead.status !== 'Quotation') return false;
    } else if (activeTab === 'negotiation') {
      if (lead.currentStage !== 'Negotiation' && lead.status !== 'Negotiation') return false;
    } else if (activeTab === 'approval-pending') {
      if (lead.status !== 'Approval Pending' && lead.currentStage !== 'Approval') return false;
    } else if (activeTab === 'approved') {
      if (lead.status !== 'Approved' && lead.currentStage !== 'Order to Delivery') return false;
    } else if (activeTab === 'rejected') {
      if (lead.status !== 'Rejected') return false;
    } else if (activeTab === 'closed') {
      if (lead.status !== 'Closed' && lead.currentStage !== 'Closed') return false;
    }

    // 2. Search match
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        lead.leadId?.toLowerCase().includes(q) ||
        lead.customerName?.toLowerCase().includes(q) ||
        lead.contactPerson?.toLowerCase().includes(q) ||
        lead.mobile?.includes(q) ||
        lead.productService?.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 3. Priority match
    if (priorityFilter !== 'ALL' && lead.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900';
      case 'high':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'converted to order':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'approval pending':
      case 'negotiation':
      case 'under negotiation':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'new':
      case 'verification pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'rejected':
      case 'closed':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 font-extrabold text-[10px] tracking-wider uppercase border border-violet-200 dark:border-violet-800/80">
            Leads Repository
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Lead Qualification & Stage Control
          </h1>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer transform active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Create New Lead</span>
        </button>
      </div>

      {/* Tabs Navigation (10 sub-views) */}
      <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {LEAD_TABS.map((tab) => {
            const count = leads.filter(lead => {
              if (tab.id === 'all') return true;
              if (tab.id === 'new') return lead.status === 'New';
              if (tab.id === 'verification') return lead.currentStage === 'Lead Verification' || lead.status === 'Verification Pending';
              if (tab.id === 'follow-up') return lead.currentStage === 'Follow-up / Enquiry' || lead.status === 'Follow-up / Enquiry';
              if (tab.id === 'quotation') return lead.currentStage === 'Quotation' || lead.status === 'Quotation';
              if (tab.id === 'negotiation') return lead.currentStage === 'Negotiation' || lead.status === 'Negotiation';
              if (tab.id === 'approval-pending') return lead.status === 'Approval Pending' || lead.currentStage === 'Approval';
              if (tab.id === 'approved') return lead.status === 'Approved' || lead.currentStage === 'Order to Delivery';
              if (tab.id === 'rejected') return lead.status === 'Rejected';
              if (tab.id === 'closed') return lead.status === 'Closed' || lead.currentStage === 'Closed';
              return false;
            }).length;

            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Lead ID, Customer, Mobile, Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400">
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredLeads.length}</strong> leads
          </span>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-2 px-3">Lead ID</th>
                <th className="py-2 px-3">Lead Date</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Contact Person</th>
                <th className="py-2 px-3">Mobile</th>
                <th className="py-2 px-3">Product / Service</th>
                <th className="py-2 px-3">Assigned To</th>
                <th className="py-2 px-3">Priority</th>
                <th className="py-2 px-3">Status</th>
                {isHistoryTab ? <HistoryTatTh /> : <PlannedTh />}
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={isHistoryTab ? 13 : 11} className="py-12 text-center text-slate-400 text-xs">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-1.5 px-3 font-bold text-violet-600 dark:text-violet-400">
                      {lead.leadId}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">
                      {lead.leadDate || lead.createdAt?.split('T')[0]}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                      <div>{lead.customerName}</div>
                      <span className="text-[10px] font-normal text-slate-400">{lead.customerType} • {lead.city || 'India'}</span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                      {lead.contactPerson || '—'}
                    </td>
                    <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300">
                      {lead.mobile}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                      {lead.productService || '—'}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">
                      {lead.assignedTo || 'Unassigned'}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    {isHistoryTab ? (
                      <HistoryTatTd
                        plannedDate={lead.leadDate || lead.createdAt?.split('T')[0] || todayStr}
                        actualDate={lead.updatedAt?.split('T')[0] || lead.leadDate || todayStr}
                      />
                    ) : (
                      <PlannedTd plannedDate={lead.leadDate || lead.createdAt?.split('T')[0] || todayStr} />
                    )}
                    <td className="py-1.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Details */}
                        <button
                          title="View Lead Details"
                          onClick={() => handleOpenDetailModal(lead)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          title="Edit Lead"
                          onClick={() => handleOpenEditModal(lead)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Verify (Available for New / Verification stages) */}
                        {(lead.status === 'New' || lead.status === 'Verification Pending' || lead.currentStage === 'Lead Verification') && (
                          <button
                            title="Verify Lead"
                            onClick={() => handleOpenVerifyModal(lead)}
                            className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verify</span>
                          </button>
                        )}

                        {/* Reject */}
                        {lead.status !== 'Rejected' && lead.status !== 'Approved' && (
                          <button
                            title="Reject Lead"
                            onClick={() => handleQuickReject(lead)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
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
      {/* MODAL 1: LEAD CREATION / EDITING FORM                                     */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {isEditMode ? `Edit Lead: ${leadForm.leadId}` : 'Create New Prospective Lead'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isEditMode ? 'Update inquiry specifications' : 'Lead ID will be automatically generated and tracked through conversion'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLeadForm} className="space-y-6">
              {/* Row 1: Identification & Lead Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Lead ID (Auto)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={leadForm.leadId}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-violet-600 dark:text-violet-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Lead Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={leadForm.leadDate}
                    onChange={(e) => setLeadForm({ ...leadForm, leadDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Lead Source *
                  </label>
                  <select
                    value={leadForm.leadSource}
                    onChange={(e) => setLeadForm({ ...leadForm, leadSource: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Customer Type
                  </label>
                  <select
                    value={leadForm.customerType}
                    onChange={(e) => setLeadForm({ ...leadForm, customerType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    {CUSTOMER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Customer / Company Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Customer / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shapoorji Pallonji EPC Ltd"
                    value={leadForm.customerName}
                    onChange={(e) => setLeadForm({ ...leadForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Sengupta"
                    value={leadForm.contactPerson}
                    onChange={(e) => setLeadForm({ ...leadForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98200 45678"
                    value={leadForm.mobile}
                    onChange={(e) => setLeadForm({ ...leadForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Alternate Mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="Optional secondary phone"
                    value={leadForm.alternateMobile}
                    onChange={(e) => setLeadForm({ ...leadForm, alternateMobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="procurement@company.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Row 3: Address & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="Street, Industrial Area or Building"
                    value={leadForm.address}
                    onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={leadForm.city}
                    onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    State & Pincode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="State"
                      value={leadForm.state}
                      onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={leadForm.pincode}
                      onChange={(e) => setLeadForm({ ...leadForm, pincode: e.target.value })}
                      className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Product / Commercial Requirement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Product / Service Inquired *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Structural Steel Beams & Girders"
                    value={leadForm.productService}
                    onChange={(e) => setLeadForm({ ...leadForm, productService: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Expected Quantity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 120 MT or 5,000 Pcs"
                    value={leadForm.expectedQuantity}
                    onChange={(e) => setLeadForm({ ...leadForm, expectedQuantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Expected Purchase Date
                  </label>
                  <input
                    type="date"
                    value={leadForm.expectedPurchaseDate}
                    onChange={(e) => setLeadForm({ ...leadForm, expectedPurchaseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Row 5: Priority, Assignee & Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Lead Priority *
                  </label>
                  <select
                    value={leadForm.priority}
                    onChange={(e) => setLeadForm({ ...leadForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-bold"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    placeholder="Representative Name"
                    value={leadForm.assignedTo}
                    onChange={(e) => setLeadForm({ ...leadForm, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Attachment (Specs / BOQ)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Specs_Document.pdf"
                    value={leadForm.attachment}
                    onChange={(e) => setLeadForm({ ...leadForm, attachment: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Requirement Details & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Initial Requirement & Technical Scope
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specific product standards, IS/ASTM grades, delivery requirements..."
                    value={leadForm.initialRequirement}
                    onChange={(e) => setLeadForm({ ...leadForm, initialRequirement: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Commercial Remarks & Next Step
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Urgency notes, competitor references, credit terms requested..."
                    value={leadForm.remarks}
                    onChange={(e) => setLeadForm({ ...leadForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer transform active:scale-95"
                >
                  {isEditMode ? 'Update Lead' : 'Save & Move to Lead Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LEAD VERIFICATION FORM                                           */}
      {/* ========================================================================= */}
      {isVerifyModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Verify Lead: {selectedLead.leadId}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Validate customer authenticity, contact veracity, and requirements
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lead Summary Header Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-violet-600 dark:text-violet-400">{selectedLead.customerName}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold border ${getPriorityBadge(selectedLead.priority)}`}>
                  {selectedLead.priority}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>Contact: <strong>{selectedLead.contactPerson}</strong></div>
                <div>Mobile: <strong>{selectedLead.mobile}</strong></div>
                <div className="col-span-2">Product: <strong>{selectedLead.productService}</strong></div>
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Verification Status *
                </label>
                <select
                  value={verificationForm.verificationStatus}
                  onChange={(e) => setVerificationForm({ ...verificationForm, verificationStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="Verified">Verified (Advance to Follow-up / Enquiry)</option>
                  <option value="Rejected">Rejected (Close Lead)</option>
                  <option value="Hold">Hold (Keep in Verification Stage)</option>
                </select>
              </div>

              {/* Checklist Toggles */}
              <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationForm.contactVerified}
                    onChange={(e) => setVerificationForm({ ...verificationForm, contactVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Contact Verified (Phone / WhatsApp reached successfully)
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationForm.customerDetailsVerified}
                    onChange={(e) => setVerificationForm({ ...verificationForm, customerDetailsVerified: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Customer Details Verified (Genuine company / business entity)
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationForm.requirementValid}
                    onChange={(e) => setVerificationForm({ ...verificationForm, requirementValid: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Requirement Valid (Fits our manufacturing & supply scope)
                  </span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationForm.duplicateLead}
                    onChange={(e) => setVerificationForm({ ...verificationForm, duplicateLead: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Duplicate Lead Flag (Check if already dealt with by another rep)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Verification Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Verification findings, notes from verification call..."
                  value={verificationForm.verificationRemarks}
                  onChange={(e) => setVerificationForm({ ...verificationForm, verificationRemarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Verified By
                  </label>
                  <input
                    type="text"
                    value={verificationForm.verifiedBy}
                    onChange={(e) => setVerificationForm({ ...verificationForm, verifiedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Verification Date
                  </label>
                  <input
                    type="date"
                    value={verificationForm.verificationDate}
                    onChange={(e) => setVerificationForm({ ...verificationForm, verificationDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer transform active:scale-95"
                >
                  Submit Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW COMPLETE LEAD DETAILS                                       */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-violet-600 dark:text-violet-400 text-lg">
                      {selectedLead.leadId}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {selectedLead.customerName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  navigate(`/lead-to-orders/follow-up?leadId=${selectedLead.leadId}`);
                }}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Log / View Follow-ups</span>
              </button>

              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  navigate(`/lead-to-orders/quotation?leadId=${selectedLead.leadId}`);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create Quotation</span>
              </button>

              {selectedLead.convertedOrderId && (
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    navigate('/sales/orders');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Order to Delivery ({selectedLead.convertedOrderId})</span>
                </button>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                  Customer & Contact
                </h4>
                <div>Customer Type: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.customerType}</strong></div>
                <div>Contact Person: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.contactPerson}</strong></div>
                <div>Mobile: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.mobile}</strong></div>
                {selectedLead.alternateMobile && <div>Alt Mobile: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.alternateMobile}</strong></div>}
                <div>Email: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.email || '—'}</strong></div>
                <div>Location: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.city || '—'}, {selectedLead.state || '—'} ({selectedLead.pincode || '—'})</strong></div>
                <div>Address: <span className="text-slate-600 dark:text-slate-400">{selectedLead.address || '—'}</span></div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                  Commercial & Requirement
                </h4>
                <div>Product / Service: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.productService}</strong></div>
                <div>Expected Quantity: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.expectedQuantity || '—'}</strong></div>
                <div>Purchase Date: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.expectedPurchaseDate || '—'}</strong></div>
                <div>Priority: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.priority}</strong></div>
                <div>Source: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.leadSource}</strong></div>
                <div>Assigned Rep: <strong className="text-slate-800 dark:text-slate-200">{selectedLead.assignedTo}</strong></div>
                <div>Quotation No: <strong className="text-indigo-600 dark:text-indigo-400">{selectedLead.quotationNo || 'Pending'}</strong></div>
                <div>Approval ID: <strong className="text-amber-600 dark:text-amber-400">{selectedLead.approvalId || 'Pending'}</strong></div>
              </div>
            </div>

            {/* Requirement Notes */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Requirement Details & Remarks
              </h4>
              <p className="text-slate-700 dark:text-slate-300">
                {selectedLead.initialRequirement || 'No additional technical requirements specified.'}
              </p>
              {selectedLead.remarks && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-slate-500">
                  Remarks: {selectedLead.remarks}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleDeleteLead(selectedLead)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Lead</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Deal Loss Modal */}
      <MarkDealLostModal
        isOpen={isLossModalOpen}
        onClose={() => setIsLossModalOpen(false)}
        lead={selectedLead}
      />
    </div>
  );
}
