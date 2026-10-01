import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Edit2,
  X,
  FileText,
  Briefcase,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Clock,
  History
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  setHRData,
  approveIndent,
  generateEnquiryId,
  addActivityLog
} from '../../services/hrStorageService';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function HRIndentApprovalPage() {
  const navigate = useNavigate();
  const indents = useHRStorage(HR_KEYS.INDENTS, []);
  const enquiries = useHRStorage(HR_KEYS.JOB_ENQUIRIES, []);

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [approvalForm, setApprovalForm] = useState({
    approvalStatus: 'Approved',
    approvedBy: 'Meenakshi Sundaram (VP HR)',
    approvalDate: new Date().toISOString().split('T')[0],
    approvalRemarks: 'Budget and headcount approved. Open for candidate sourcing.'
  });

  const handleOpenApprovalModal = (indent) => {
    setSelectedIndent(indent);
    setApprovalForm({
      approvalStatus: indent.status === 'Approved' ? 'Approved' : 'Approved',
      approvedBy: indent.approvedBy || 'Meenakshi Sundaram (VP HR)',
      approvalDate: new Date().toISOString().split('T')[0],
      approvalRemarks: indent.remarks || 'Budget and headcount approved. Open for candidate sourcing.'
    });
    setIsApprovalModalOpen(true);
  };

  const handleProcessApproval = (e) => {
    e.preventDefault();
    if (!selectedIndent) return;

    if (approvalForm.approvalStatus === 'Approved') {
      approveIndent(selectedIndent.id, approvalForm.approvedBy, approvalForm.approvalRemarks);

      // Auto-create or ensure initial Job Enquiry placeholder exists if not already present
      const exists = enquiries.some(e => e.indentNumber === selectedIndent.indentNumber);
      if (!exists) {
        const updatedEnquiries = [...enquiries];
        updatedEnquiries.unshift({
          id: generateEnquiryId(),
          enquiryId: generateEnquiryId(),
          indentNumber: selectedIndent.indentNumber,
          candidateName: 'Candidate Inbound Pipeline',
          mobile: 'Multiple',
          email: 'careers@gimbooks.com',
          source: 'Website',
          resume: '',
          appliedDesignation: selectedIndent.designation,
          experience: selectedIndent.requiredExperience,
          currentCompany: 'Various Applicants',
          currentSalary: 'As per norms',
          expectedSalary: selectedIndent.salaryRange,
          noticePeriod: 'Immediate to 30 Days',
          location: selectedIndent.location,
          remarks: `Opening created for approved Indent ${selectedIndent.indentNumber}. Ready for resume intake.`,
          status: 'New',
          createdAt: new Date().toISOString()
        });
        setHRData(HR_KEYS.JOB_ENQUIRIES, updatedEnquiries);
      }

      setIsApprovalModalOpen(false);
      if (window.confirm(`Indent ${selectedIndent.indentNumber} Approved! Sourcing pipeline initialized. Navigate to Job Enquiry sourcing now?`)) {
        navigate(`/hr/job-enquiry?indentNumber=${selectedIndent.indentNumber}`);
      }
    } else {
      // Rejected
      const updatedIndents = indents.map(i => {
        if (i.id === selectedIndent.id) {
          return {
            ...i,
            status: 'Rejected',
            approvedBy: approvalForm.approvedBy,
            approvalDate: approvalForm.approvalDate,
            remarks: approvalForm.approvalRemarks
          };
        }
        return i;
      });
      setHRData(HR_KEYS.INDENTS, updatedIndents);
      addActivityLog(approvalForm.approvedBy, 'Rejected Indent', 'Recruitment', selectedIndent.indentNumber, 'Pending Approval', 'Rejected', approvalForm.approvalRemarks);
      setIsApprovalModalOpen(false);
    }
  };

  const pendingApprovals = indents.filter(i => i.status === 'Pending Approval');
  const historyApprovals = indents.filter(i => i.status !== 'Pending Approval');

  const filteredIndents = indents.filter(i => {
    if (activeTab === 'pending' && i.status !== 'Pending Approval') return false;
    if (activeTab === 'history' && i.status === 'Pending Approval') return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        i.indentNumber?.toLowerCase().includes(q) ||
        i.designation?.toLowerCase().includes(q) ||
        i.department?.toLowerCase().includes(q) ||
        i.requestedBy?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-amber-950 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-amber-800/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px] tracking-wider uppercase border border-amber-500/30">
              Stage 2 • Manpower Approval
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-white">
            Indent Approvals & Job Sourcing Release
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Review proposed positions, budget justification, and headcounts. Approved indents immediately unlock the <strong>Job Enquiry & Candidate Sourcing</strong> stage.
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

      {/* Search */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search pending approvals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-400">
          {activeTab === 'pending' ? 'Pending Review: ' : 'Completed: '}
          <strong className="text-amber-600 font-bold">{filteredIndents.length}</strong>
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Indent No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4 text-center">Positions</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4">Status</th>
                {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredIndents.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 10 : 12} className="py-12 text-center text-slate-400 text-xs">
                    No {activeTab} indent approvals found.
                  </td>
                </tr>
              ) : (
                filteredIndents.map((indent) => (
                  <tr key={indent.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-blue-600 dark:text-blue-400">
                      {indent.indentNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {indent.requirementDate}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                      {indent.department}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {indent.designation}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black">
                      {indent.numberOfPositions}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200 bg-amber-50 text-amber-700">
                        {indent.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {indent.requestedBy}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        indent.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        indent.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {indent.status}
                      </span>
                    </td>
                    {activeTab === 'pending' ? (
                      <PlannedTd plannedDate={indent.requiredJoiningDate || indent.requirementDate} />
                    ) : (
                      <HistoryTatTd
                        plannedDate={indent.requiredJoiningDate || indent.requirementDate}
                        actualDate={indent.approvalDate || indent.updatedAt?.split('T')[0] || indent.requirementDate}
                      />
                    )}
                    <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        title="View Indent"
                        onClick={() => {
                          setSelectedIndent(indent);
                          setIsViewModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {indent.status !== 'Approved' ? (
                        <button
                          onClick={() => handleOpenApprovalModal(indent)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg shadow-xs cursor-pointer"
                        >
                          Review & Decide
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/hr/job-enquiry?indentNumber=${indent.indentNumber}`)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Briefcase className="w-3 h-3" />
                          <span>Sourcing Active</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVAL DECISION MODAL */}
      {isApprovalModalOpen && selectedIndent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Approve Indent: {selectedIndent.indentNumber}
                  </h2>
                  <p className="text-xs text-slate-400">{selectedIndent.designation} • {selectedIndent.department}</p>
                </div>
              </div>
              <button onClick={() => setIsApprovalModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs space-y-1.5">
              <div>Positions: <strong>{selectedIndent.numberOfPositions}</strong></div>
              <div>Salary Range: <strong>{selectedIndent.salaryRange}</strong></div>
              <div>Target Date: <strong>{selectedIndent.requiredJoiningDate}</strong></div>
              <div>Justification: <span className="text-slate-600 dark:text-slate-300">{selectedIndent.reasonForRequirement}</span></div>
            </div>

            <form onSubmit={handleProcessApproval} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Approval Decision *
                </label>
                <select
                  value={approvalForm.approvalStatus}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approvalStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="Approved">Approved (Release to Job Enquiry Sourcing)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Approval Remarks *
                </label>
                <textarea
                  rows={3}
                  required
                  value={approvalForm.approvalRemarks}
                  onChange={(e) => setApprovalForm({ ...approvalForm, approvalRemarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer ${
                    approvalForm.approvalStatus === 'Approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedIndent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl p-6 md:p-8 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Indent Summary: {selectedIndent.indentNumber}
              </h3>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div>Role: <strong>{selectedIndent.designation}</strong></div>
              <div>Department: <strong>{selectedIndent.department}</strong></div>
              <div>Positions: <strong>{selectedIndent.numberOfPositions}</strong></div>
              <div>Salary Range: <strong>{selectedIndent.salaryRange}</strong></div>
              <div>Status: <strong>{selectedIndent.status}</strong></div>
              <div>Approved by: <strong>{selectedIndent.approvedBy || 'Pending'}</strong></div>
              <div>Remarks: <strong>{selectedIndent.remarks || 'None'}</strong></div>
            </div>
            <div className="flex justify-end pt-3 border-t">
              <button onClick={() => setIsViewModalOpen(false)} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
