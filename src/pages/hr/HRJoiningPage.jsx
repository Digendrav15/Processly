import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  History,
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  completeJoining,
  addActivityLog
} from '../../services/hrStorageService';
import {
  PlannedTh,
  PlannedTd,
  HistoryTatTh,
  HistoryTatTd
} from '../../components/common/TatColumns';

export function HRJoiningPage() {
  const { data: joinings, setItem: setJoinings } = useHRStorage(HR_KEYS.JOININGS, []);
  const { data: employees } = useHRStorage(HR_KEYS.EMPLOYEES, []);

  // Tab State
  const [activeTab, setActiveTab] = useState('pending');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedJoining, setSelectedJoining] = useState(null);

  // Complete Joining form state
  const [onboardingData, setOnboardingData] = useState({
    actualJoiningDate: new Date().toISOString().split('T')[0],
    reportingManager: 'Amitabh Sharma (Tech Lead)',
    officialEmail: '',
    workLocation: 'Bangalore HQ',
    employmentType: 'Full-Time Regular',
    remarks: 'Documents verified and asset handover scheduled.'
  });

  // Checklist state for documents verification
  const [docChecklist, setDocChecklist] = useState({
    aadhaar: true,
    pan: true,
    education: true,
    relievingLetter: true,
    payslips: true,
    bankDetails: true
  });

  const pendingJoinings = joinings.filter(j => j.status !== 'Joined');
  const historyJoinings = joinings.filter(j => j.status === 'Joined');

  // Filtered list
  const filteredJoinings = useMemo(() => {
    return joinings.filter(item => {
      if (activeTab === 'pending' && item.status === 'Joined') return false;
      if (activeTab === 'history' && item.status !== 'Joined') return false;

      const matchesSearch =
        (item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.designation?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.offerId?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesDept = departmentFilter === 'All' || item.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [joinings, activeTab, searchTerm, statusFilter, departmentFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: joinings.length,
      pending: joinings.filter(j => j.status === 'Joining Pending').length,
      joined: joinings.filter(j => j.status === 'Joined').length,
      delayed: joinings.filter(j => j.status === 'Delayed').length
    };
  }, [joinings]);

  // Open complete joining modal
  const handleOpenComplete = (joining) => {
    setSelectedJoining(joining);
    const firstName = joining.candidateName.split(' ')[0].toLowerCase();
    setOnboardingData({
      actualJoiningDate: joining.joiningDate || new Date().toISOString().split('T')[0],
      reportingManager: joining.reportingManager || 'Amitabh Sharma (Tech Lead)',
      officialEmail: `${firstName}.${joining.employeeId.toLowerCase()}@taskflow.os`,
      workLocation: 'Bangalore HQ',
      employmentType: 'Full-Time Regular',
      remarks: 'All mandatory KYC and onboarding checks verified successfully.'
    });
    setShowCompleteModal(true);
  };

  // Submit complete joining
  const handleConfirmJoining = (e) => {
    e.preventDefault();
    if (!selectedJoining) return;

    const res = completeJoining(
      selectedJoining.id || selectedJoining.offerId,
      {
        joiningDate: onboardingData.actualJoiningDate,
        reportingManager: onboardingData.reportingManager,
        officialEmail: onboardingData.officialEmail,
        workLocation: onboardingData.workLocation,
        employmentType: onboardingData.employmentType
      }
    );

    if (res.success) {
      setShowCompleteModal(false);
      setSelectedJoining(null);
    } else {
      alert(res.message || 'Error completing joining');
    }
  };

  // Save document checklist
  const handleSaveChecklist = () => {
    if (!selectedJoining) return;
    const allChecked = Object.values(docChecklist).every(Boolean);

    const updated = joinings.map(j => {
      if ((j.id || j.employeeId) === (selectedJoining.id || selectedJoining.employeeId)) {
        return {
          ...j,
          documentStatus: allChecked ? 'Verified' : 'Partially Verified',
          documentsVerified: allChecked
        };
      }
      return j;
    });

    setJoinings(updated);
    addActivityLog('HR Operations', 'Document Audit Updated', 'Recruitment', selectedJoining.employeeId, null, allChecked ? 'Verified' : 'Pending', `Audit completed for ${selectedJoining.candidateName}`);
    setShowChecklistModal(false);
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-black text-[9px] uppercase tracking-wider border border-cyan-500/30">
                HR FMS • Stage 7
              </span>
              <h1 className="text-base font-extrabold tracking-tight">
                Candidate Joining & Onboarding
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Pre-joining verification, background checks & active employee roster enrollment</p>
          </div>
        </div>
        {/* Tab Switcher */}
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex space-x-1 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingJoinings.length})</span>
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
            <span>History ({historyJoinings.length})</span>
          </button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, Employee ID, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="All">All Joining Statuses</option>
            <option value="Joining Pending">Joining Pending</option>
            <option value="Joined">Successfully Joined</option>
            <option value="Delayed">Delayed</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="All">All Departments</option>
            <option value="Technology">Technology</option>
            <option value="Product & Design">Product & Design</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance & Accounts">Finance & Accounts</option>
          </select>
        </div>
      </div>

      {/* Joinings Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-black bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2 px-3">Allotted Emp ID</th>
                <th className="py-2 px-3">Candidate & Role</th>
                <th className="py-2 px-3">Department & Manager</th>
                <th className="py-2 px-3">Target Joining Date</th>
                {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                <th className="py-2 px-3">KYC & Documents</th>
                <th className="py-2 px-3">Joining Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredJoinings.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 8 : 10} className="py-12 text-center text-slate-400">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold">No joining candidates match filters</p>
                  </td>
                </tr>
              ) : (
                filteredJoinings.map((joinItem) => (
                  <tr
                    key={joinItem.id || joinItem.employeeId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Emp ID */}
                    <td className="py-2 px-3 font-mono font-black text-cyan-600 dark:text-cyan-400">
                      {joinItem.employeeId}
                    </td>

                    {/* Candidate */}
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {joinItem.candidateName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{joinItem.designation}</span>
                        <span>•</span>
                        <span className="font-mono text-cyan-500">{joinItem.offerId}</span>
                      </div>
                    </td>

                    {/* Department & Manager */}
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {joinItem.department}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Mgr: {joinItem.reportingManager || 'Amitabh Sharma'}
                      </div>
                    </td>

                    {/* Joining Date */}
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{joinItem.joiningDate}</span>
                      </div>
                    </td>

                    {activeTab === 'pending' ? (
                      <PlannedTd plannedDate={joinItem.joiningDate || joinItem.plannedDate || '2026-10-02'} />
                    ) : (
                      <HistoryTatTd
                        plannedDate={joinItem.joiningDate || joinItem.plannedDate || '2026-10-02'}
                        actualDate={joinItem.actualJoiningDate || joinItem.actualDate || joinItem.joiningDate || '2026-10-02'}
                      />
                    )}

                    {/* Documents */}
                    <td className="py-2 px-3">
                      <button
                        onClick={() => {
                          setSelectedJoining(joinItem);
                          setShowChecklistModal(true);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          joinItem.documentsVerified
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <FileCheck className="w-3 h-3" />
                        <span>{joinItem.documentsVerified ? 'Documents Verified' : 'Check Documents'}</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          joinItem.status === 'Joined'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : joinItem.status === 'Joining Pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        }`}
                      >
                        {joinItem.status === 'Joined' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {joinItem.status || 'Joining Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {joinItem.status !== 'Joined' ? (
                          <button
                            onClick={() => handleOpenComplete(joinItem)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-[11px] font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Complete Joining</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active Employee</span>
                          </span>
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

      {/* Complete Joining & Onboarding Modal */}
      {showCompleteModal && selectedJoining && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Complete Joining & Onboarding</h3>
                  <p className="text-xs text-slate-400">Enrolls candidate into Stage 8: Active Employees roster</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmJoining} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">New Employee</span>
                  <span className="font-mono font-black text-cyan-600">{selectedJoining.employeeId}</span>
                </div>
                <p className="font-black text-slate-900 dark:text-white text-sm">{selectedJoining.candidateName}</p>
                <p className="text-slate-500">{selectedJoining.designation} • {selectedJoining.department}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Joining Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={onboardingData.actualJoiningDate}
                    onChange={(e) => setOnboardingData({ ...onboardingData, actualJoiningDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reporting Manager *
                  </label>
                  <input
                    type="text"
                    required
                    value={onboardingData.reportingManager}
                    onChange={(e) => setOnboardingData({ ...onboardingData, reportingManager: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={onboardingData.officialEmail}
                    onChange={(e) => setOnboardingData({ ...onboardingData, officialEmail: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={onboardingData.workLocation}
                    onChange={(e) => setOnboardingData({ ...onboardingData, workLocation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Onboarding Notes & Asset Allocation
                </label>
                <textarea
                  rows={2}
                  value={onboardingData.remarks}
                  onChange={(e) => setOnboardingData({ ...onboardingData, remarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Upon completion, this candidate will automatically be added to <strong>Active Employees</strong>, assigned an official ID, and enabled for attendance, leave management, and monthly payroll.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Confirm Joining & Onboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Verification Checklist Modal */}
      {showChecklistModal && selectedJoining && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">KYC & Document Checklist</h3>
                  <p className="text-xs text-slate-400">{selectedJoining.candidateName} ({selectedJoining.employeeId})</p>
                </div>
              </div>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { key: 'aadhaar', label: 'Government Identity Proof (Aadhaar / Passport)' },
                { key: 'pan', label: 'PAN Card Verification (Tax compliance)' },
                { key: 'education', label: 'Highest Educational Degree & Certificates' },
                { key: 'relievingLetter', label: 'Relieving & Experience Letter from Previous Employer' },
                { key: 'payslips', label: 'Last 3 Months Salary Slips' },
                { key: 'bankDetails', label: 'Cancelled Cheque & Bank Account Passbook' }
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={docChecklist[item.key]}
                    onChange={(e) => setDocChecklist({ ...docChecklist, [item.key]: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</span>
                </label>
              ))}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChecklistModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveChecklist}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold shadow-md shadow-cyan-500/20"
                >
                  Save Verification Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
