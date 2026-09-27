import React, { useState, useMemo } from 'react';
import {
  Plane,
  Search,
  Filter,
  Plus,
  Clock,
  Calendar,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  addActivityLog
} from '../../services/hrStorageService';

export function HRLeavePage() {
  const { data: leaves, setItem: setLeaves } = useHRStorage(HR_KEYS.LEAVES, []);
  const { data: employees } = useHRStorage(HR_KEYS.EMPLOYEES, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [decisionRemarks, setDecisionRemarks] = useState('Approved by Manager');

  // New leave form state
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    department: 'Technology',
    leaveType: 'Casual Leave (CL)',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: 'Personal engagement'
  });

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter(item => {
      const matchesSearch =
        (item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.reason?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = leaveTypeFilter === 'All' || item.leaveType.includes(leaveTypeFilter);
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [leaves, searchTerm, leaveTypeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'Pending').length,
      approved: leaves.filter(l => l.status === 'Approved').length,
      rejected: leaves.filter(l => l.status === 'Rejected').length
    };
  }, [leaves]);

  // Handle employee select
  const handleSelectEmp = (empId) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.department || 'Technology'
      }));
    }
  };

  // Submit Leave Request
  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeName.trim()) {
      alert('Please select an employee');
      return;
    }

    const newLeave = {
      id: `LV-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: formData.employeeName,
      department: formData.department,
      leaveType: formData.leaveType,
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      totalDays: Number(formData.totalDays) || 1,
      reason: formData.reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    setLeaves([newLeave, ...leaves]);
    addActivityLog('Employee Portal', 'Leave Applied', 'Leave', formData.employeeId, null, 'Pending', `${formData.totalDays} days ${formData.leaveType}`);

    setShowApplyModal(false);
  };

  // Approve / Reject Leave
  const handleConfirmDecision = (approved) => {
    if (!selectedLeave) return;

    const newStatus = approved ? 'Approved' : 'Rejected';
    const updated = leaves.map(l => {
      if (l.id === selectedLeave.id) {
        return {
          ...l,
          status: newStatus,
          approvedBy: 'HR / Manager',
          decisionRemarks: decisionRemarks
        };
      }
      return l;
    });

    setLeaves(updated);
    addActivityLog('HR Operations', `Leave ${newStatus}`, 'Leave', selectedLeave.employeeId, 'Pending', newStatus, decisionRemarks);

    setShowDecisionModal(false);
    setSelectedLeave(null);
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-black text-[9px] uppercase tracking-wider border border-cyan-500/30">
                HR FMS • Stage 9B
              </span>
              <h1 className="text-base font-extrabold tracking-tight">
                Leave Applications & Absence Approval
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Time-off management, Casual/Sick/Earned leaves & approval decisions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Stats Badges */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px]">
            <span className="text-slate-300">Total: <strong className="text-white">{stats.total}</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400">Pending: <strong>{stats.pending}</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">Approved: <strong>{stats.approved}</strong></span>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name, ID or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        <select
          value={leaveTypeFilter}
          onChange={(e) => setLeaveTypeFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="All">All Leave Types</option>
          <option value="Casual">Casual Leave (CL)</option>
          <option value="Sick">Sick Leave (SL)</option>
          <option value="Earned">Earned Leave (EL)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Leaves High Density Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 px-3">Employee</th>
                <th className="py-2 px-3">Leave Type</th>
                <th className="py-2 px-3">Duration & Dates</th>
                <th className="py-2 px-3">Total Days</th>
                <th className="py-2 px-3">Reason</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <p className="font-semibold">No leave applications match filters</p>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((lv) => (
                  <tr
                    key={lv.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Employee */}
                    <td className="py-1.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white text-[11.5px] flex items-center gap-1.5">
                        <span>{lv.employeeName}</span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 text-[10px]">({lv.employeeId})</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-1.5 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                        {lv.leaveType}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                      {lv.fromDate} {lv.fromDate !== lv.toDate ? `to ${lv.toDate}` : ''}
                    </td>

                    {/* Total Days */}
                    <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white text-[11px]">
                      {lv.totalDays} Day{lv.totalDays > 1 ? 's' : ''}
                    </td>

                    {/* Reason */}
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-xs text-[11px]">
                      {lv.reason}
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                          lv.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : lv.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {lv.status === 'Approved' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {lv.status === 'Pending' && <Clock className="w-2.5 h-2.5" />}
                        {lv.status === 'Rejected' && <XCircle className="w-2.5 h-2.5" />}
                        {lv.status || 'Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-1.5 px-3 text-right">
                      {lv.status === 'Pending' ? (
                        <button
                          onClick={() => {
                            setSelectedLeave(lv);
                            setShowDecisionModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Review</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Decided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && selectedLeave && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Review Leave Application</h3>
                  <p className="text-xs text-slate-400">{selectedLeave.employeeName} ({selectedLeave.employeeId})</p>
                </div>
              </div>
              <button
                onClick={() => setShowDecisionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Leave Type:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedLeave.leaveType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Period:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedLeave.fromDate} to {selectedLeave.toDate} ({selectedLeave.totalDays} Days)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Reason:</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedLeave.reason}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Manager / Approver Remarks
                </label>
                <textarea
                  rows={2}
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleConfirmDecision(false)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDecision(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Approve Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Apply for Leave</h3>
                  <p className="text-xs text-slate-400">Submit employee leave requisition</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Employee *
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => handleSelectEmp(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.employeeId} value={e.employeeId}>
                      {e.name} ({e.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Leave Type *
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                  <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                  <option value="Earned Leave (EL)">Earned Leave (EL)</option>
                  <option value="Maternity / Paternity">Maternity / Paternity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    From Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    To Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Absence *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Reason for time off..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
