import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Search,
  Eye,
  X,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  FileText,
  User,
  Building,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useLeadStorage } from '../../hooks/useLeadStorage';
import {
  LTO_KEYS,
  saveApproval,
  convertApprovalToOrderToDelivery
} from '../../services/leadToOrderStorageService';
import { getCurrentUser } from '../../services/otdStorageService';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected', 'Hold'];

export function ApprovalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const leads = useLeadStorage(LTO_KEYS.LEADS, []);
  const quotations = useLeadStorage(LTO_KEYS.QUOTATIONS, []);
  const approvals = useLeadStorage(LTO_KEYS.APPROVALS, []);
  const currentUser = getCurrentUser();

  const todayStr = new Date().toISOString().split('T')[0];

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('pending');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [activeApproval, setActiveApproval] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [conversionSuccessData, setConversionSuccessData] = useState(null);

  // Approval Form
  const [approvalForm, setApprovalForm] = useState({
    approvalStatus: 'Approved',
    approvedBy: currentUser?.name || 'Executive Director',
    approvalDate: todayStr,
    approvalRemarks: 'Approved for Order Processing & Fulfillment.'
  });

  // Handle URL params
  useEffect(() => {
    const qLeadId = searchParams.get('leadId');
    const qQuoteNo = searchParams.get('quotationNo');
    if (qLeadId || qQuoteNo) {
      const match = approvals.find(a => a.leadId === qLeadId || a.quotationNo === qQuoteNo);
      if (match) {
        setActiveApproval(match);
        setIsReviewModalOpen(true);
      }
    }
  }, [searchParams, approvals]);

  const handleOpenReviewModal = (app) => {
    setActiveApproval(app);
    setApprovalForm({
      approvalStatus: app.approvalStatus === 'Approved' ? 'Approved' : 'Approved',
      approvedBy: app.approvedBy || currentUser?.name || 'Managing Director',
      approvalDate: todayStr,
      approvalRemarks: app.approvalRemarks || 'Commercial terms approved. Proceed to Order to Delivery.'
    });
    setIsReviewModalOpen(true);
  };

  const handleOpenDetailModal = (app) => {
    setActiveApproval(app);
    setIsDetailModalOpen(true);
  };

  const handleProcessApproval = (e) => {
    e.preventDefault();
    if (!activeApproval) return;

    if (approvalForm.approvalStatus === 'Approved') {
      // CRITICAL: Convert directly to Order to Delivery!
      const result = convertApprovalToOrderToDelivery(
        activeApproval.approvalId,
        approvalForm.approvedBy,
        approvalForm.approvalRemarks
      );

      if (result.success) {
        setIsReviewModalOpen(false);
        setConversionSuccessData(result);
      } else {
        alert(result.message || 'Failed to convert order to Order to Delivery.');
      }
    } else {
      // Rejected or Hold or Pending
      saveApproval({
        ...activeApproval,
        approvalStatus: approvalForm.approvalStatus,
        approvedBy: approvalForm.approvedBy,
        approvalDate: approvalForm.approvalDate,
        approvalRemarks: approvalForm.approvalRemarks
      });
      setIsReviewModalOpen(false);
    }
  };

  // Quick Action
  const handleQuickApprove = (app) => {
    if (window.confirm(`Approve quotation ${app.quotationNo} and convert customer into Order to Delivery module?`)) {
      const result = convertApprovalToOrderToDelivery(
        app.approvalId,
        currentUser?.name || 'Managing Director',
        'Direct 1-click Approval'
      );
      if (result.success) {
        setConversionSuccessData(result);
      }
    }
  };

  // Pending / History split
  const pendingApprovals = approvals.filter(a => a.approvalStatus !== 'Approved' && a.approvalStatus !== 'Rejected');
  const historyApprovals = approvals.filter(a => a.approvalStatus === 'Approved' || a.approvalStatus === 'Rejected');

  // Filter list
  const filteredApprovals = approvals.filter(a => {
    if (activeTab === 'pending' && (a.approvalStatus === 'Approved' || a.approvalStatus === 'Rejected')) return false;
    if (activeTab === 'history' && a.approvalStatus !== 'Approved' && a.approvalStatus !== 'Rejected') return false;
    if (statusFilter !== 'ALL' && a.approvalStatus !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        a.approvalId?.toLowerCase().includes(q) ||
        a.leadId?.toLowerCase().includes(q) ||
        a.quotationNo?.toLowerCase().includes(q) ||
        a.customer?.toLowerCase().includes(q) ||
        a.submittedBy?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'rejected':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'hold':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    }
  };

  // Linked items for detailed modal
  const activeLead = activeApproval ? leads.find(l => l.leadId === activeApproval.leadId) : null;
  const activeQuotation = activeApproval ? quotations.find(q => q.quotationNo === activeApproval.quotationNo || q.leadId === activeApproval.leadId) : null;

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-gradient-to-r from-slate-900 via-amber-950 to-indigo-950 px-3.5 py-2.5 rounded-xl text-white shadow-md border border-amber-800/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[10px] tracking-wider uppercase border border-amber-500/30">
              Commercial Deal Approval & Bridge to Delivery
            </span>
          </div>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5 text-white">
            Quotation Approvals & Order Conversion
          </h1>
          <p className="text-[11px] text-slate-300 max-w-2xl">
            Review finalized quotations and commercial terms. Approving a proposal automatically pushes the complete customer and order details directly into the <strong>Order to Delivery module</strong>.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex space-x-1 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingApprovals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historyApprovals.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Approval ID, Lead ID, Customer..."
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
            {APPROVAL_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <span className="text-xs text-slate-400">
            Total Approvals: <strong className="text-slate-700 dark:text-slate-200">{filteredApprovals.length}</strong>
          </span>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-2 px-3">Approval ID</th>
                <th className="py-2 px-3">Lead ID</th>
                <th className="py-2 px-3">Quotation No</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3 text-right">Quotation Amount</th>
                <th className="py-2 px-3 text-center">Discount</th>
                <th className="py-2 px-3">Submitted By</th>
                <th className="py-2 px-3">Submitted Date</th>
                <th className="py-2 px-3">Approval Status</th>
                {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredApprovals.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                    No {activeTab} approval requests found in this view.
                  </td>
                </tr>
              ) : (
                filteredApprovals.map((app) => (
                  <tr key={app.id || app.approvalId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-1.5 px-3 font-black text-amber-600 dark:text-amber-400">
                      {app.approvalId}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-violet-600 dark:text-violet-400">
                      {app.leadId}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {app.quotationNo}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                      <div>{app.customer}</div>
                      {app.orderNumber && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Order: {app.orderNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                      ₹ {Number(app.quotationAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-1.5 px-3 text-center font-semibold text-rose-600 dark:text-rose-400">
                      {app.discount || '—'}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">
                      {app.submittedBy || 'Sales Rep'}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">
                      {app.submittedDate || '—'}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(app.approvalStatus)}`}>
                        {app.approvalStatus}
                      </span>
                    </td>
                    {activeTab === 'pending' ? (
                      <PlannedTd plannedDate={app.submittedDate || todayStr} />
                    ) : (
                      <HistoryTatTd
                        plannedDate={app.submittedDate || todayStr}
                        actualDate={app.approvalDate || app.updatedAt?.split('T')[0] || todayStr}
                      />
                    )}
                    <td className="py-1.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Quotation Info */}
                        <button
                          title="View Details"
                          onClick={() => handleOpenDetailModal(app)}
                          className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Review / Approve Form */}
                        {app.approvalStatus !== 'Approved' ? (
                          <button
                            title="Review & Take Decision"
                            onClick={() => handleOpenReviewModal(app)}
                            className="px-2 py-0.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-[10px] rounded-md shadow-xs transition-all cursor-pointer"
                          >
                            Decide
                          </button>
                        ) : (
                          <button
                            title="Open in Order to Delivery"
                            onClick={() => navigate('/sales/orders')}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-md shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>In OTD</span>
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
      {/* MODAL 1: APPROVAL DECISION FORM (APPROVE, REJECT, HOLD)                    */}
      {/* ========================================================================= */}
      {isReviewModalOpen && activeApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Approval Portal: {activeApproval.approvalId}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Lead: {activeApproval.leadId} • Quotation: {activeApproval.quotationNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Proposal Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900 dark:text-white">{activeApproval.customer}</span>
                <span className="font-black text-base text-amber-600 dark:text-amber-400">
                  ₹ {Number(activeApproval.quotationAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount: <strong>{activeApproval.discount}</strong></span>
                <span>Submitted by: <strong>{activeApproval.submittedBy}</strong> on {activeApproval.submittedDate}</span>
              </div>
            </div>

            {/* Crucial Automation Alert Notice */}
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300">
                <strong>Automatic Pipeline Conversion:</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  Upon selecting <strong>Approved</strong> and submitting, this customer and quotation will be automatically converted into the active <strong>Order to Delivery module</strong> (starting at Order Verification stage) with linked Order ID.
                </p>
              </div>
            </div>

            {/* Approval Decision Form */}
            <form onSubmit={handleProcessApproval} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Approval Decision *
                </label>
                <select
                  value={approvalForm.approvalStatus}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approvalStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="Approved">Approved (Convert to Order to Delivery)</option>
                  <option value="Hold">Hold (Requires Clarification / Margin Review)</option>
                  <option value="Rejected">Rejected (Commercial terms unacceptable)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Approval Remarks & Executive Comments *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record commercial justifications, credit terms accepted..."
                  value={approvalForm.approvalRemarks}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approvalRemarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Approved By *
                  </label>
                  <input
                    type="text"
                    required
                    value={approvalForm.approvedBy}
                    onChange={(e) => setApprovalForm({ ...approvalForm, approvedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Approval Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={approvalForm.approvalDate}
                    onChange={(e) => setApprovalForm({ ...approvalForm, approvalDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer transform active:scale-95 ${
                    approvalForm.approvalStatus === 'Approved'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                      : approvalForm.approvalStatus === 'Rejected'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  }`}
                >
                  {approvalForm.approvalStatus === 'Approved'
                    ? 'Approve & Convert to Order'
                    : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMPLETE PROPOSAL DETAIL VIEW FOR APPROVAL                       */}
      {/* ========================================================================= */}
      {isDetailModalOpen && activeApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Approval Dossier: {activeApproval.approvalId}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Quotation: {activeApproval.quotationNo} • Lead: {activeApproval.leadId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quotation Items if available */}
            {activeQuotation && (
              <div className="space-y-3 text-xs">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Approved Line Items & Scope
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5 text-right">Rate</th>
                        <th className="p-2.5 text-center">Disc</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeQuotation.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{it.productService}</td>
                          <td className="p-2.5">{it.quantity} {it.unit}</td>
                          <td className="p-2.5 text-right">₹ {Number(it.rate || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-center">{it.discount || 0}%</td>
                          <td className="p-2.5 text-right font-extrabold text-slate-900 dark:text-white">
                            ₹ {Number(it.total || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Terms</span>
                    <strong>{activeQuotation.paymentTerms}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Delivery Terms</span>
                    <strong>{activeQuotation.deliveryTerms}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Decision Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Current Approval Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(activeApproval.approvalStatus)}`}>
                  {activeApproval.approvalStatus}
                </span>
              </div>
              <div>Approved by: <strong>{activeApproval.approvedBy || 'Pending sign-off'}</strong></div>
              <div>Approval remarks: <span className="text-slate-600 dark:text-slate-300">{activeApproval.approvalRemarks || 'None'}</span></div>
              {activeApproval.orderNumber && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-extrabold">
                  Converted Order ID: {activeApproval.orderNumber}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {activeApproval.approvalStatus !== 'Approved' ? (
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenReviewModal(activeApproval);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Approve This Order Now
                </button>
              ) : (
                <button
                  onClick={() => navigate('/sales/orders')}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View in Order to Delivery</span>
                </button>
              )}

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONVERSION SUCCESS DIALOG (CROSS-SYSTEM BRIDGING)                */}
      {/* ========================================================================= */}
      {conversionSuccessData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-500/30 shadow-2xl w-full max-w-lg p-6 md:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-xs uppercase tracking-wider">
                Successfully Converted
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-3">
                Order Pushed to Order to Delivery!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Lead qualification complete. Order ID has been automatically created in the existing Order to Delivery workflow.
              </p>
            </div>

            {/* Traceability Link Pills */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-left text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Order ID (OTD)</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  {conversionSuccessData.orderNumber}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Approval ID</span>
                <strong className="text-amber-600 dark:text-amber-400 font-bold">
                  {conversionSuccessData.approvalId}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Quotation No</span>
                <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {conversionSuccessData.quotationNo}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Lead ID</span>
                <strong className="text-violet-600 dark:text-violet-400 font-bold">
                  {conversionSuccessData.leadId}
                </strong>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setConversionSuccessData(null);
                  navigate('/sales/verification');
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Open in Order to Delivery (Verification Stage)</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={() => setConversionSuccessData(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Stay on Approvals Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
