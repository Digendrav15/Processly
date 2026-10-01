import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LogOut,
  ShieldCheck,
  CreditCard,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  History,
  Building,
  User,
  AlertCircle,
  X,
  ArrowRight,
  Printer,
  Calendar,
  CheckSquare,
  FileText,
  DollarSign
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  generateResignationId,
  generateClearanceId,
  generateFnFId,
  approveResignation,
  settleFnF,
  addActivityLog
} from '../../services/hrStorageService';
import {
  PlannedTh,
  PlannedTd,
  HistoryTatTh,
  HistoryTatTd
} from '../../components/common/TatColumns';

export function HRExitManagementPage() {
  const location = useLocation();

  // Sub Tab for Pending vs History
  const [subTab, setSubTab] = useState('pending');

  // Determine active tab from URL path or fallback
  const getInitialTab = () => {
    if (location.pathname.includes('clearance')) return 'clearance';
    if (location.pathname.includes('fnf')) return 'fnf';
    return 'resignation';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  // Storage hooks
  const { data: resignations, setItem: setResignations } = useHRStorage(HR_KEYS.RESIGNATIONS, []);
  const { data: clearances, setItem: setClearances } = useHRStorage(HR_KEYS.CLEARANCE, []);
  const { data: fnfList, setItem: setFnfList } = useHRStorage(HR_KEYS.FNF, []);
  const { data: employees } = useHRStorage(HR_KEYS.EMPLOYEES, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [showFnfModal, setShowFnfModal] = useState(false);
  const [showFnfPrintModal, setShowFnfPrintModal] = useState(false);

  const [selectedResignation, setSelectedResignation] = useState(null);
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [selectedFnf, setSelectedFnf] = useState(null);

  // Resignation form state
  const [resignationData, setResignationData] = useState({
    employeeId: '',
    employeeName: '',
    department: 'Technology',
    designation: '',
    resignationDate: new Date().toISOString().split('T')[0],
    lastWorkingDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    reason: 'Better Career Opportunity',
    remarks: 'Resignation letter submitted via employee portal'
  });

  // Approval state
  const [approverName, setApproverName] = useState('VP HR');
  const [approvalRemarks, setApprovalRemarks] = useState('Resignation acknowledged and notice period waived / accepted.');

  // Settle F&F state
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [settlementRemarks, setSettlementRemarks] = useState('All dues cleared and final settlement processed.');

  // Handle employee select for resignation
  const handleSelectEmp = (empId) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) {
      setResignationData(prev => ({
        ...prev,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.department,
        designation: emp.designation
      }));
    }
  };

  // Submit Resignation
  const handleSubmitResignation = (e) => {
    e.preventDefault();
    if (!resignationData.employeeName.trim()) {
      alert('Please select an employee');
      return;
    }

    const newResId = generateResignationId();
    const newRes = {
      id: newResId,
      resignationId: newResId,
      employeeId: resignationData.employeeId,
      employeeName: resignationData.employeeName,
      department: resignationData.department,
      designation: resignationData.designation,
      resignationDate: resignationData.resignationDate,
      lastWorkingDate: resignationData.lastWorkingDate,
      reason: resignationData.reason,
      status: 'Submitted',
      remarks: resignationData.remarks
    };

    setResignations([newRes, ...resignations]);
    addActivityLog('Employee', 'Resignation Submitted', 'Exit Management', newResId, null, 'Submitted', `Resignation for ${newRes.employeeName} (${newRes.reason})`);

    setShowApplyModal(false);
  };

  // Confirm Resignation Approval
  const handleConfirmApproval = () => {
    if (!selectedResignation) return;

    const res = approveResignation(
      selectedResignation.resignationId || selectedResignation.id,
      approverName,
      approvalRemarks
    );

    if (res.success) {
      setShowApproveModal(false);
      setSelectedResignation(null);
    } else {
      alert(res.message || 'Error approving resignation');
    }
  };

  // Mark Clearance Item Cleared
  const handleToggleClearance = (clr) => {
    const newStatus = clr.status === 'Cleared' ? 'Pending' : 'Cleared';
    const updated = clearances.map(c => {
      if (c.id === clr.id) {
        return {
          ...c,
          status: newStatus,
          assetReturned: newStatus === 'Cleared',
          documentReturned: newStatus === 'Cleared',
          clearanceDate: newStatus === 'Cleared' ? new Date().toISOString().split('T')[0] : ''
        };
      }
      return c;
    });

    setClearances(updated);
    addActivityLog('Department Head', `Clearance Marked ${newStatus}`, 'Exit Management', clr.employeeId, clr.status, newStatus, `${clr.department} clearance updated`);
  };

  // Confirm F&F Settlement
  const handleConfirmFnf = () => {
    if (!selectedFnf) return;

    const res = settleFnF(
      selectedFnf.id || selectedFnf.employeeId,
      paymentMode,
      settlementRemarks
    );

    if (res.success) {
      setShowFnfModal(false);
      setSelectedFnf(null);
    } else {
      alert(res.message || 'Error settling F&F');
    }
  };

  const activeCounts = useMemo(() => {
    if (activeTab === 'resignation') {
      return {
        pending: resignations.filter(r => r.status !== 'Approved' && r.status !== 'Completed').length,
        history: resignations.filter(r => r.status === 'Approved' || r.status === 'Completed').length
      };
    } else if (activeTab === 'clearance') {
      return {
        pending: clearances.filter(c => c.status !== 'Cleared').length,
        history: clearances.filter(c => c.status === 'Cleared').length
      };
    } else {
      return {
        pending: fnfList.filter(f => f.status !== 'Paid' && f.status !== 'Settled').length,
        history: fnfList.filter(f => f.status === 'Paid' || f.status === 'Settled').length
      };
    }
  }, [activeTab, resignations, clearances, fnfList]);

  // Filtered Resignations
  const filteredResignations = useMemo(() => {
    return resignations.filter(r => {
      const isPending = r.status !== 'Approved' && r.status !== 'Completed';
      if (subTab === 'pending' && !isPending) return false;
      if (subTab === 'history' && isPending) return false;
      return (
        r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.resignationId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [resignations, subTab, searchTerm]);

  // Filtered Clearances
  const filteredClearances = useMemo(() => {
    return clearances.filter(c => {
      const isPending = c.status !== 'Cleared';
      if (subTab === 'pending' && !isPending) return false;
      if (subTab === 'history' && isPending) return false;
      return (
        c.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [clearances, subTab, searchTerm]);

  // Filtered FNF
  const filteredFnf = useMemo(() => {
    return fnfList.filter(f => {
      const isPending = f.status !== 'Paid' && f.status !== 'Settled';
      if (subTab === 'pending' && !isPending) return false;
      if (subTab === 'history' && isPending) return false;
      return (
        f.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [fnfList, subTab, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-md shadow-cyan-500/20">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Exit & Offboarding Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stages 11-13: Resignation approval, 5-department clearances and Full & Final settlement
              </p>
            </div>
          </div>
        </div>

        {activeTab === 'resignation' && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Submit Resignation</span>
          </button>
        )}
      </div>

      {/* 3-Stage Exit Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <Link
          to="/hr/resignation"
          onClick={() => setActiveTab('resignation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'resignation'
              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>Stage 11: Resignation ({resignations.length})</span>
        </Link>

        <Link
          to="/hr/clearance"
          onClick={() => setActiveTab('clearance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'clearance'
              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Stage 12: Clearances ({clearances.length})</span>
        </Link>

        <Link
          to="/hr/fnf"
          onClick={() => setActiveTab('fnf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'fnf'
              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Stage 13: Full & Final ({fnfList.length})</span>
        </Link>
      </div>

      {/* Search Bar & Sub-Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name, ID or record #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex space-x-1 text-xs font-bold shrink-0">
          <button
            onClick={() => setSubTab('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              subTab === 'pending'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({activeCounts.pending})</span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              subTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({activeCounts.history})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: RESIGNATIONS */}
      {activeTab === 'resignation' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Resignation Submissions Register
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
              {filteredResignations.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Resignation ID</th>
                  <th className="py-3 px-4">Employee Details</th>
                  <th className="py-3 px-4">Resignation Date</th>
                  <th className="py-3 px-4">Last Working Date</th>
                  {subTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="py-3 px-4">Reason for Leaving</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredResignations.length === 0 ? (
                  <tr>
                    <td colSpan={subTab === 'pending' ? 8 : 10} className="py-12 text-center text-slate-400">
                      <LogOut className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold">No resignation records found</p>
                    </td>
                  </tr>
                ) : (
                  filteredResignations.map((res) => (
                    <tr
                      key={res.resignationId || res.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {res.resignationId || res.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {res.employeeName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {res.employeeId} • {res.designation}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {res.resignationDate}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {res.lastWorkingDate}
                      </td>
                      {subTab === 'pending' ? (
                        <PlannedTd plannedDate={res.resignationDate || '2026-10-02'} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={res.resignationDate || '2026-10-02'}
                          actualDate={res.approvedDate || res.actualDate || res.lastWorkingDate || '2026-10-02'}
                        />
                      )}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {res.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            res.status === 'Exit Pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : res.status === 'Submitted'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {res.status === 'Submitted' ? (
                          <button
                            onClick={() => {
                              setSelectedResignation(res);
                              setShowApproveModal(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Approve & Initiate Clearances</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Clearances Active</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLEARANCES */}
      {activeTab === 'clearance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Department No-Objection Clearances
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
              {filteredClearances.length} checklist items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department / Authority</th>
                  <th className="py-3 px-4">Clearance Items</th>
                  <th className="py-3 px-4">Responsible Person</th>
                  {subTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="py-3 px-4">Clearance Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredClearances.length === 0 ? (
                  <tr>
                    <td colSpan={subTab === 'pending' ? 7 : 9} className="py-12 text-center text-slate-400">
                      <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold">No pending department clearances</p>
                    </td>
                  </tr>
                ) : (
                  filteredClearances.map((clr) => (
                    <tr
                      key={clr.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {clr.employeeName}
                        </div>
                        <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
                          {clr.employeeId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {clr.department}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {clr.clearanceItem}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {clr.responsiblePerson}
                      </td>
                      {subTab === 'pending' ? (
                        <PlannedTd plannedDate={clr.plannedDate || '2026-10-02'} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={clr.plannedDate || '2026-10-02'}
                          actualDate={clr.clearedDate || clr.actualDate || '2026-10-02'}
                        />
                      )}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            clr.status === 'Cleared'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {clr.status === 'Cleared' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {clr.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleClearance(clr)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                            clr.status === 'Cleared'
                              ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {clr.status === 'Cleared' ? 'Revert to Pending' : 'Mark Cleared'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FULL & FINAL SETTLEMENT */}
      {activeTab === 'fnf' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Full & Final (F&F) Settlement Register
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
              {filteredFnf.length} vouchers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Voucher ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Last Working Day</th>
                  {subTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="py-3 px-4">Salary Payable</th>
                  <th className="py-3 px-4">Leave Encashment</th>
                  <th className="py-3 px-4">Gratuity</th>
                  <th className="py-3 px-4">Net Settled Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredFnf.length === 0 ? (
                  <tr>
                    <td colSpan={subTab === 'pending' ? 10 : 12} className="py-12 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold">No Full & Final vouchers</p>
                    </td>
                  </tr>
                ) : (
                  filteredFnf.map((fnf) => (
                    <tr
                      key={fnf.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {fnf.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {fnf.employeeName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {fnf.employeeId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {fnf.lastWorkingDate}
                      </td>
                      {subTab === 'pending' ? (
                        <PlannedTd plannedDate={fnf.lastWorkingDate || '2026-10-02'} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={fnf.lastWorkingDate || '2026-10-02'}
                          actualDate={fnf.settledDate || fnf.actualDate || '2026-10-02'}
                        />
                      )}
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        ₹ {Number(fnf.salaryPayable || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        ₹ {Number(fnf.leaveEncashment || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        ₹ {Number(fnf.gratuity || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                        ₹ {Number(fnf.netPayable || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            fnf.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {fnf.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedFnf(fnf);
                              setShowFnfPrintModal(true);
                            }}
                            title="Print Voucher"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {fnf.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                setSelectedFnf(fnf);
                                setShowFnfModal(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              Settle & Pay Dues
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
      )}

      {/* Submit Resignation Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Submit Resignation</h3>
                  <p className="text-xs text-slate-400">Initiate employee separation process</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResignation} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Employee *
                </label>
                <select
                  value={resignationData.employeeId}
                  onChange={(e) => handleSelectEmp(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.employeeId} value={e.employeeId}>
                      {e.name} ({e.employeeId}) - {e.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resignation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={resignationData.resignationDate}
                    onChange={(e) => setResignationData({ ...resignationData, resignationDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Last Working Day *
                  </label>
                  <input
                    type="date"
                    required
                    value={resignationData.lastWorkingDate}
                    onChange={(e) => setResignationData({ ...resignationData, lastWorkingDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Reason for Separation *
                </label>
                <select
                  value={resignationData.reason}
                  onChange={(e) => setResignationData({ ...resignationData, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Better Career Opportunity">Better Career Opportunity</option>
                  <option value="Higher Education / Studies">Higher Education / Studies</option>
                  <option value="Relocation / Family">Relocation / Family</option>
                  <option value="Health / Personal Reasons">Health / Personal Reasons</option>
                  <option value="Career Transition">Career Transition</option>
                </select>
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20"
                >
                  Submit Resignation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Resignation Modal */}
      {showApproveModal && selectedResignation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Approve Resignation</h3>
                  <p className="text-xs text-slate-400">Generates 5-department clearance checklist</p>
                </div>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Separating Employee</span>
                <p className="font-black text-slate-900 dark:text-white text-sm">{selectedResignation.employeeName}</p>
                <p className="text-slate-500">Last Working Date: {selectedResignation.lastWorkingDate}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Approval Notes / Handover Instructions
                </label>
                <textarea
                  rows={3}
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm & Initiate Clearances</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settle F&F Modal */}
      {showFnfModal && selectedFnf && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Settle Full & Final Dues</h3>
                  <p className="text-xs text-slate-400">Moves employee to Inactive and issues Relieving Letter</p>
                </div>
              </div>
              <button
                onClick={() => setShowFnfModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Employee:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedFnf.employeeName} ({selectedFnf.employeeId})</span>
                </div>
                <div className="flex items-center justify-between font-bold text-emerald-600">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono text-sm">₹ {Number(selectedFnf.netPayable || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Direct Bank Transfer (NEFT)">Direct Bank Transfer (NEFT)</option>
                  <option value="RTGS Transfer">RTGS Transfer</option>
                  <option value="Account Payee Cheque">Account Payee Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Remarks / Voucher Notes
                </label>
                <textarea
                  rows={2}
                  value={settlementRemarks}
                  onChange={(e) => setSettlementRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
                <p className="text-[10px] leading-relaxed">
                  * Marking this paid will automatically move the employee from <strong>Active</strong> to <strong>Inactive Employees (Stage 14)</strong> and auto-generate their formal <strong>Relieving Letter & Experience Certificate</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFnfModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFnf}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Execute Settlement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print FNF Voucher Modal */}
      {showFnfPrintModal && selectedFnf && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 my-8 border border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-black text-sm uppercase text-slate-600">Full & Final Settlement Voucher</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button onClick={() => setShowFnfPrintModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-xs space-y-3">
              <div className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-black text-sm">{selectedFnf.employeeName}</p>
                  <p className="text-slate-500">ID: {selectedFnf.employeeId}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-cyan-600">{selectedFnf.id}</p>
                  <p className="text-slate-500">LWD: {selectedFnf.lastWorkingDate}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200">
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="p-2 font-sans">Unpaid Salary Dues</td>
                    <td className="p-2 text-right">₹ {Number(selectedFnf.salaryPayable || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans">Leave Encashment (Earned Leave)</td>
                    <td className="p-2 text-right">₹ {Number(selectedFnf.leaveEncashment || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans">Gratuity Amount</td>
                    <td className="p-2 text-right">₹ {Number(selectedFnf.gratuity || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans text-rose-600">Less: Deductions / Notice Recovery</td>
                    <td className="p-2 text-right text-rose-600">- ₹ {Number(selectedFnf.deductions || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold font-sans text-emerald-900 text-sm">
                    <td className="p-2">Net Payable Amount</td>
                    <td className="p-2 text-right font-mono">₹ {Number(selectedFnf.netPayable || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-4 flex justify-between text-xs">
                <div>
                  <p className="font-bold">Prepared By</p>
                  <p className="text-slate-400 mt-6">HR & Payroll Manager</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Employee Acceptance</p>
                  <p className="text-slate-400 mt-6">Signature / Acknowledged</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
