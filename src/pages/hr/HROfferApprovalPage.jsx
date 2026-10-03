import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Calendar,
  Building,
  User,
  ArrowRight,
  X,
  CreditCard,
  ShieldCheck,
  Award,
  Send,
  Download,
  Clock,
  History
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  generateOfferId,
  approveSalaryOffer,
  addActivityLog
} from '../../services/hrStorageService';
import {
  PlannedTh,
  PlannedTd,
  HistoryTatTh,
  HistoryTatTd
} from '../../components/common/TatColumns';

export function HROfferApprovalPage() {
  const { data: offers, setItem: setOffers } = useHRStorage(HR_KEYS.OFFERS, []);
  const { data: candidates } = useHRStorage(HR_KEYS.CANDIDATES, []);

  // Tab State
  const [activeTab, setActiveTab] = useState('pending');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Approval review state
  const [approverName, setApproverName] = useState('VP HR');
  const [approvalRemarks, setApprovalRemarks] = useState('Salary package approved in accordance with band guidelines.');

  // Create Custom Offer state
  const [customOfferData, setCustomOfferData] = useState({
    candidateName: '',
    candidateId: '',
    designation: '',
    department: 'Technology',
    annualCTC: 1200000,
    joiningDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0]
  });

  const pendingOffers = offers.filter(o => o.status === 'Pending Approval');
  const historyOffers = offers.filter(o => o.status !== 'Pending Approval');

  // Filtered offers
  const filteredOffers = useMemo(() => {
    return offers.filter(item => {
      if (activeTab === 'pending' && item.status !== 'Pending Approval') return false;
      if (activeTab === 'history' && item.status === 'Pending Approval') return false;

      const matchesSearch =
        (item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.offerId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.designation?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.candidateId?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesDept = departmentFilter === 'All' || item.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [offers, activeTab, searchTerm, statusFilter, departmentFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalCTC = offers.reduce((acc, o) => acc + (Number(o.annualCTC) || 0), 0);
    return {
      total: offers.length,
      pending: offers.filter(o => o.status === 'Pending Approval').length,
      approved: offers.filter(o => o.status === 'Approved').length,
      accepted: offers.filter(o => o.status === 'Accepted' || o.status === 'Offer Sent').length,
      totalCTCBudget: `₹ ${(totalCTC / 100000).toFixed(1)} Lakhs`
    };
  }, [offers]);

  // Execute Offer Approval
  const handleConfirmApproval = () => {
    if (!selectedOffer) return;

    const res = approveSalaryOffer(
      selectedOffer.offerId || selectedOffer.id,
      approverName,
      approvalRemarks
    );

    if (res.success) {
      setShowApproveModal(false);
      setSelectedOffer(null);
    } else {
      alert(res.message || 'Error approving offer');
    }
  };

  // Reject Offer
  const handleRejectOffer = (offer) => {
    const reason = prompt('Please enter rejection remarks:', 'Salary expectation exceeds departmental budget ceiling');
    if (!reason) return;

    const updated = offers.map(o => {
      if ((o.offerId || o.id) === (offer.offerId || offer.id)) {
        return { ...o, status: 'Rejected', rejectionReason: reason };
      }
      return o;
    });
    setOffers(updated);
    addActivityLog('VP HR', 'Offer Rejected', 'Recruitment', offer.offerId || offer.id, offer.status, 'Rejected', reason);
  };

  // Create custom offer
  const handleCreateOfferSubmit = (e) => {
    e.preventDefault();
    const annual = Number(customOfferData.annualCTC) || 600000;
    const monthlyGross = Math.round(annual / 12);
    const basic = Math.round(monthlyGross * 0.50);
    const hra = Math.round(monthlyGross * 0.25);
    const specialAllowance = monthlyGross - basic - hra;
    const pfDeduction = 1800;
    const netSalary = monthlyGross - pfDeduction;

    const newOfferId = generateOfferId();
    const newOffer = {
      id: newOfferId,
      offerId: newOfferId,
      candidateId: customOfferData.candidateId || 'CND-EXT',
      candidateName: customOfferData.candidateName,
      department: customOfferData.department,
      designation: customOfferData.designation,
      annualCTC: annual,
      monthlyGross: monthlyGross,
      basicSalary: basic,
      hra: hra,
      specialAllowance: specialAllowance,
      pfDeduction: pfDeduction,
      netSalary: netSalary,
      joiningDate: customOfferData.joiningDate,
      offerDate: new Date().toISOString().split('T')[0],
      status: 'Pending Approval',
      approvedBy: ''
    };

    setOffers([newOffer, ...offers]);
    addActivityLog('HR Compensation Lead', 'Prepared Salary Offer', 'Recruitment', newOfferId, null, 'Pending Approval', `Prepared offer of ₹${annual.toLocaleString('en-IN')} for ${newOffer.candidateName}`);

    setShowCreateModal(false);
    setCustomOfferData({
      candidateName: '',
      candidateId: '',
      designation: '',
      department: 'Technology',
      annualCTC: 1200000,
      joiningDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-2.5">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-200 dark:border-cyan-800/80">
            HR FMS • Stage 6
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Offer & Salary Approval
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Tab Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80 flex space-x-1 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({pendingOffers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({historyOffers.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Offer</span>
          </button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, offer ID, designation..."
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
            <option value="All">All Offer Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Accepted">Accepted by Candidate</option>
            <option value="Rejected">Rejected</option>
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

      {/* Offers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-black bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2 px-3">Offer ID</th>
                <th className="py-2 px-3">Candidate & Position</th>
                <th className="py-2 px-3">Annual CTC</th>
                <th className="py-2 px-3">Monthly Gross</th>
                <th className="py-2 px-3">Net Take-Home</th>
                <th className="py-2 px-3">Expected Joining</th>
                {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 9 : 11} className="py-12 text-center text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold">No offers match the current filters</p>
                  </td>
                </tr>
              ) : (
                filteredOffers.map((off) => (
                  <tr
                    key={off.offerId || off.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Offer ID */}
                    <td className="py-2 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {off.offerId || off.id}
                    </td>

                    {/* Candidate */}
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {off.candidateName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{off.designation}</span>
                        <span>•</span>
                        <span>{off.department}</span>
                      </div>
                    </td>

                    {/* Annual CTC */}
                    <td className="py-2 px-3 font-mono font-black text-slate-900 dark:text-white">
                      ₹ {Number(off.annualCTC || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Monthly Gross */}
                    <td className="py-2 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      ₹ {Number(off.monthlyGross || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Net Take-Home */}
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹ {Number(off.netSalary || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Joining Date */}
                    <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {off.joiningDate || 'TBD'}
                    </td>

                    {activeTab === 'pending' ? (
                      <PlannedTd plannedDate={off.offerDate || off.plannedDate || '2026-10-02'} />
                    ) : (
                      <HistoryTatTd
                        plannedDate={off.offerDate || off.plannedDate || '2026-10-02'}
                        actualDate={off.approvalDate || off.actualDate || off.offerDate || '2026-10-02'}
                      />
                    )}

                    {/* Status */}
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          off.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : off.status === 'Pending Approval'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : off.status === 'Accepted'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {off.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                        {off.status === 'Pending Approval' && <ShieldCheck className="w-3 h-3" />}
                        {off.status || 'Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedOffer(off);
                            setShowLetterModal(true);
                          }}
                          title="Preview & Print Official Offer Letter"
                          className="p-1.5 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {off.status === 'Pending Approval' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedOffer(off);
                                setShowApproveModal(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectOffer(off)}
                              title="Reject Offer"
                              className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {off.status === 'Approved' && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Joining Pending</span>
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

      {/* Approval Confirmation Modal */}
      {showApproveModal && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Approve Salary & Offer</h3>
                  <p className="text-xs text-slate-400">Generates formal Offer Letter & unlocks Stage 7 Joining</p>
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
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Candidate</span>
                <p className="font-black text-slate-900 dark:text-white text-sm">{selectedOffer.candidateName}</p>
                <p className="text-slate-500">{selectedOffer.designation} • {selectedOffer.department}</p>
              </div>

              {/* Salary Structure Breakdown */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Annual CTC:</span>
                  <span className="text-cyan-600 font-mono text-sm">
                    ₹ {Number(selectedOffer.annualCTC || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Monthly Gross:</span>
                  <span className="font-mono">₹ {Number(selectedOffer.monthlyGross || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Basic Pay (50%):</span>
                  <span className="font-mono">₹ {Number(selectedOffer.basicSalary || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>HRA (25%):</span>
                  <span className="font-mono">₹ {Number(selectedOffer.hra || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Special Allowance:</span>
                  <span className="font-mono">₹ {Number(selectedOffer.specialAllowance || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-rose-500">
                  <span>Statutory PF / ESI:</span>
                  <span className="font-mono">- ₹ {Number(selectedOffer.pfDeduction || 1800).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-extrabold text-emerald-600 dark:text-emerald-400">
                  <span>Net Monthly In-Hand:</span>
                  <span className="font-mono text-sm">₹ {Number(selectedOffer.netSalary || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Approving Officer / Authority *
                </label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Approval Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                  <span>Confirm & Authorize Offer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Offer Letter Preview & Print Modal */}
      {showLetterModal && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 border border-slate-300">
            {/* Action Bar (Not printed) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-600" />
                <span className="font-black text-sm uppercase tracking-wider text-slate-600">
                  Official Corporate Offer Letter
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-black rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowLetterModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">TASKFLOW ENTERPRISES PVT. LTD.</h2>
                <p className="text-xs text-slate-500">Corporate Tower, Tech Park Phase 2, Bangalore - 560100</p>
                <p className="text-xs text-slate-500">CIN: U72200KA2024PTC123456 • hr@taskflow.os</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Offer Ref No.</span>
                <p className="font-mono font-black text-sm text-cyan-600">{selectedOffer.offerId}</p>
                <p className="text-xs text-slate-500 mt-1">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Candidate Address */}
            <div className="text-xs space-y-1">
              <p className="font-bold text-slate-900">To,</p>
              <p className="font-black text-sm text-slate-900">{selectedOffer.candidateName}</p>
              <p className="text-slate-600">Candidate ID: {selectedOffer.candidateId}</p>
              <p className="text-slate-600">Subject: <span className="font-bold">Formal Offer of Employment for the position of {selectedOffer.designation}</span></p>
            </div>

            {/* Body */}
            <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
              <p>
                Dear <strong>{selectedOffer.candidateName}</strong>,
              </p>
              <p>
                We are delighted to extend an offer of employment with <strong>TaskFlow Enterprises Pvt. Ltd.</strong> for the role of <strong>{selectedOffer.designation}</strong> in our <strong>{selectedOffer.department}</strong> department.
              </p>
              <p>
                Your Total Cost to Company (CTC) will be <strong>₹ {Number(selectedOffer.annualCTC || 0).toLocaleString('en-IN')}</strong> per annum. The detailed break-up of your monthly and annual compensation structure is outlined below:
              </p>
            </div>

            {/* CTC Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Salary Component</th>
                    <th className="py-2 px-3 text-right">Monthly (₹)</th>
                    <th className="py-2 px-3 text-right">Annualized (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-1.5 px-3 font-sans text-slate-800">Basic Salary (50%)</td>
                    <td className="py-1.5 px-3 text-right">₹ {Number(selectedOffer.basicSalary || 0).toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-3 text-right">₹ {(Number(selectedOffer.basicSalary || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans text-slate-800">House Rent Allowance (HRA)</td>
                    <td className="py-1.5 px-3 text-right">₹ {Number(selectedOffer.hra || 0).toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-3 text-right">₹ {(Number(selectedOffer.hra || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-sans text-slate-800">Special & Flexible Allowances</td>
                    <td className="py-1.5 px-3 text-right">₹ {Number(selectedOffer.specialAllowance || 0).toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-3 text-right">₹ {(Number(selectedOffer.specialAllowance || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-slate-900 font-sans">
                    <td className="py-2 px-3">Gross Total Remuneration</td>
                    <td className="py-2 px-3 text-right font-mono">₹ {Number(selectedOffer.monthlyGross || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right font-mono">₹ {Number(selectedOffer.annualCTC || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="text-rose-600">
                    <td className="py-1.5 px-3 font-sans">Less: Provident Fund (Employee Contribution)</td>
                    <td className="py-1.5 px-3 text-right">- ₹ {Number(selectedOffer.pfDeduction || 1800).toLocaleString('en-IN')}</td>
                    <td className="py-1.5 px-3 text-right">- ₹ {(Number(selectedOffer.pfDeduction || 1800) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-800 font-bold font-sans">
                    <td className="py-2 px-3">Net Estimated Take-Home Salary</td>
                    <td className="py-2 px-3 text-right font-mono">₹ {Number(selectedOffer.netSalary || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right font-mono">₹ {(Number(selectedOffer.netSalary || 0) * 12).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Joining Terms */}
            <div className="text-xs text-slate-600 space-y-1">
              <p>• Expected Date of Joining: <strong>{selectedOffer.joiningDate || 'Immediate'}</strong></p>
              <p>• Work Location: <strong>Bangalore Corporate Office</strong></p>
              <p>• Probation Period: <strong>6 Months from joining date</strong></p>
            </div>

            {/* Signatures */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">For TaskFlow Enterprises Pvt. Ltd.</p>
                <div className="h-10"></div>
                <p className="font-bold text-slate-700">Authorized Human Resources Signatory</p>
                <p className="text-[10px] text-slate-400">VP - People & Culture</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900">Accepted & Agreed By</p>
                <div className="h-10"></div>
                <p className="font-bold text-slate-700">{selectedOffer.candidateName}</p>
                <p className="text-[10px] text-slate-400">Signature of Candidate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Salary Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Create Salary Offer</h3>
                  <p className="text-xs text-slate-400">Configure CTC, designation & onboarding target</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfferSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sneha Reddy"
                    value={customOfferData.candidateName}
                    onChange={(e) => setCustomOfferData({ ...customOfferData, candidateName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Engineer"
                    value={customOfferData.designation}
                    onChange={(e) => setCustomOfferData({ ...customOfferData, designation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={customOfferData.department}
                    onChange={(e) => setCustomOfferData({ ...customOfferData, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Joining Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={customOfferData.joiningDate}
                    onChange={(e) => setCustomOfferData({ ...customOfferData, joiningDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Annual Cost to Company (CTC in ₹) *
                </label>
                <input
                  type="number"
                  required
                  step="50000"
                  value={customOfferData.annualCTC}
                  onChange={(e) => setCustomOfferData({ ...customOfferData, annualCTC: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * Automatic breakdown: 50% Basic, 25% HRA, remainder Special Allowance, minus standard statutory PF
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Create Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
