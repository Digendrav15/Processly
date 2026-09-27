import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { usePurchaseStorage } from '../../hooks/usePurchaseStorage';
import {
  PURCHASE_STORAGE_KEYS,
  advancePurchaseStage
} from '../../services/purchaseStorageService';
import { useNavigate } from 'react-router-dom';

export function IndentApprovalPage() {
  const navigate = useNavigate();
  const indents = usePurchaseStorage(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"HOD Operations"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalIndent, setModalIndent] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [approvalDecision, setApprovalDecision] = useState('Approved');
  const [approvedBudget, setApprovedBudget] = useState(0);
  const [approvedBy, setApprovedBy] = useState(currentUser.name || 'HOD Operations');
  const [approvalDate, setApprovalDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // 1. Pending Approvals
  const pendingIndents = useMemo(() => {
    return indents.filter((item) => {
      const isPending = item.currentStage === 'Indent Approval';
      if (!isPending) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.indentNumber || '').toLowerCase().includes(q) ||
          (item.department || '').toLowerCase().includes(q) ||
          (item.indentorName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm]);

  // 2. History Approvals
  const historyIndents = useMemo(() => {
    return indents.filter((item) => {
      const hasHistory =
        !!item.approvalDecision ||
        (item.stageDetails && !!item.stageDetails['Indent Approval']);

      if (!hasHistory) return false;

      if (statusFilter !== 'ALL' && (item.approvalDecision || 'Approved') !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.indentNumber || '').toLowerCase().includes(q) ||
          (item.department || '').toLowerCase().includes(q) ||
          (item.indentorName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm, statusFilter]);

  const currentList = activeTab === 'pending' ? pendingIndents : historyIndents;

  const handleOpenAction = (indent, viewOnly = false) => {
    setModalIndent(indent);
    setIsViewOnly(viewOnly);

    const estVal = parseFloat(indent.totalEstimatedValue || 0);

    if (viewOnly && indent.approvalDecision) {
      setApprovalDecision(indent.approvalDecision || 'Approved');
      setApprovedBudget(indent.approvedBudget !== undefined ? indent.approvedBudget : estVal);
      setApprovedBy(indent.approvedBy || currentUser.name || 'HOD Operations');
      setApprovalDate(indent.approvalDate || new Date().toISOString().split('T')[0]);
      setRemarks(indent.approvalRemarks || '');
    } else {
      setApprovalDecision('Approved');
      setApprovedBudget(estVal);
      setApprovedBy(currentUser.name || 'HOD Operations');
      setApprovalDate(new Date().toISOString().split('T')[0]);
      setRemarks('Requisition verified against department budget and approved for PO.');
    }
  };

  const handleCloseModal = () => {
    setModalIndent(null);
    setIsViewOnly(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalIndent) return;

    const isApprove = approvalDecision === 'Approved';
    const payload = {
      approvalDecision,
      approvedBudget: parseFloat(approvedBudget || 0),
      approvedBy,
      approvalDate,
      approvalRemarks: remarks,
      nextStage: isApprove ? 'PO' : 'Purchase Indent',
      status: isApprove ? 'PO Pending' : `Indent ${approvalDecision}`,
    };

    advancePurchaseStage(
      modalIndent.id,
      payload,
      `Indent ${approvalDecision} by ${approvedBy} (Sanctioned: ₹${approvedBudget})`
    );

    alert(`Indent ${modalIndent.indentNumber} ${approvalDecision}! Moving to Purchase Order (PO).`);
    handleCloseModal();
    if (isApprove) {
      navigate('/purchase/po');
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 px-3.5 py-2.5 rounded-xl text-white shadow-sm border border-blue-500/20">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-extrabold text-[10px] uppercase tracking-wider border border-blue-500/30">
            Procurement • Step 2
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Indent Approval</h1>
          <p className="text-[11px] text-slate-400">Review department requisitions, verify budget sanctions, and approve for PO generation.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingIndents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historyIndents.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Indent #, Dept, Indentor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-[11px] text-slate-500 font-bold">Decision:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
            >
              <option value="ALL">All Decisions</option>
              <option value="Approved">Approved</option>
              <option value="Correction Required">Correction Required</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Indents Awaiting Approval' : 'Indent Approval History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
            <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No indents currently pending approval' : 'No approval history found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">Indent #</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Indentor</th>
                  <th className="py-2 px-3 text-center">Priority</th>
                  <th className="py-2 px-3 text-right">Est. Amount (₹)</th>
                  <th className="py-2 px-3 text-center">Decision</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((item) => {
                  const estVal = parseFloat(item.totalEstimatedValue || 0);
                  const dec = item.approvalDecision || (activeTab === 'pending' ? 'Pending Approval' : 'Approved');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-blue-600 dark:text-blue-400">
                        {item.indentNumber}
                      </td>
                      <td className="py-1.5 px-3 text-slate-500 font-medium">{item.indentDate}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{item.department}</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 font-medium">{item.indentorName}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800">
                          {item.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                        ₹ {estVal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            dec === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : dec === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {dec}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(item, false)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>Review & Approve</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(item, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Details</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {modalIndent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Approval Record (Read-Only)' : 'Indent Review & Sanction'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Indent: {modalIndent.indentNumber} ({modalIndent.department})
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 block font-bold">Indentor</span>
                  <span className="font-extrabold">{modalIndent.indentorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Required Date</span>
                  <span className="font-extrabold">{modalIndent.requiredByDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Total Est. Value</span>
                  <span className="font-black text-emerald-600">
                    ₹ {parseFloat(modalIndent.totalEstimatedValue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Priority</span>
                  <span className="font-extrabold text-amber-600">{modalIndent.priority}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Requisitioned Materials</label>
                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b">
                      <tr>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Est. Rate</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {modalIndent.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold">{it.productName}</td>
                          <td className="p-2.5 text-center">{it.quantity} {it.unit}</td>
                          <td className="p-2.5 text-right">₹ {parseFloat(it.estimatedRate || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-right font-extrabold">₹ {parseFloat(it.amount || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Decision and Sanction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Approval Decision *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {approvalDecision}
                    </div>
                  ) : (
                    <select
                      value={approvalDecision}
                      onChange={(e) => setApprovalDecision(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Approved">Approved (Sanctioned for PO)</option>
                      <option value="Correction Required">Correction Required (Send back to Indentor)</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Sanctioned Budget (₹) *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-extrabold text-emerald-600">
                      ₹ {parseFloat(approvedBudget || 0).toLocaleString('en-IN')}
                    </div>
                  ) : (
                    <input
                      type="number"
                      required
                      value={approvedBudget}
                      onChange={(e) => setApprovedBudget(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Approved By
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {approvedBy}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Approval Date
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {approvalDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={approvalDate}
                      onChange={(e) => setApprovalDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Approval Notes / Justification
                </label>
                {isViewOnly ? (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium">
                    {remarks || 'None'}
                  </div>
                ) : (
                  <textarea
                    rows="2"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter approval notes or budget allocation details..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                {!isViewOnly && (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    <span>Submit Decision & Proceed</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
