import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Clock,
  Calendar,
  DollarSign,
  Building,
  User,
  Mail,
  Phone,
  ArrowRight,
  FileText,
  X,
  Tag,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  generateCandidateId,
  shortlistCandidate,
  addActivityLog
} from '../../services/hrStorageService';

export function HRCandidateScreeningPage() {
  const { data: candidates, setItem: setCandidates } = useHRStorage(HR_KEYS.CANDIDATES, []);
  const { data: indents } = useHRStorage(HR_KEYS.INDENTS, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Shortlist form state
  const [shortlistRound, setShortlistRound] = useState('Round 1 - Technical Assessment');
  const [shortlistRemarks, setShortlistRemarks] = useState('');

  // Reject form state
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Add Candidate form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    indentNumber: '',
    designation: '',
    department: 'Technology',
    qualification: 'B.Tech / MCA',
    experience: '4 Years',
    currentCTC: '7,50,000',
    expectedCTC: '10,00,000',
    noticePeriod: '30 Days',
    skills: 'React, Node.js, SQL',
    evaluationNotes: ''
  });

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch =
        (c.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.candidateId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.designation?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesStatus = statusFilter === 'All' || c.screeningStatus === statusFilter;
      const matchesDept = departmentFilter === 'All' || c.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [candidates, searchTerm, statusFilter, departmentFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: candidates.length,
      pending: candidates.filter(c => c.screeningStatus === 'Pending' || c.screeningStatus === 'In Review').length,
      shortlisted: candidates.filter(c => c.screeningStatus === 'Shortlisted').length,
      rejected: candidates.filter(c => c.screeningStatus === 'Rejected').length,
      hold: candidates.filter(c => c.screeningStatus === 'Hold').length
    };
  }, [candidates]);

  // Handle Shortlist confirmation
  const handleConfirmShortlist = () => {
    if (!selectedCandidate) return;

    const res = shortlistCandidate(
      selectedCandidate.candidateId || selectedCandidate.id,
      shortlistRound,
      shortlistRemarks
    );

    if (res.success) {
      setShowShortlistModal(false);
      setSelectedCandidate(null);
      setShortlistRemarks('');
    } else {
      alert(res.message || 'Error shortlisting candidate');
    }
  };

  // Handle Reject confirmation
  const handleConfirmReject = () => {
    if (!selectedCandidate) return;

    const updated = candidates.map(c => {
      if ((c.candidateId || c.id) === (selectedCandidate.candidateId || selectedCandidate.id)) {
        return {
          ...c,
          screeningStatus: 'Rejected',
          rejectionReason: rejectRemarks || 'Not meeting minimum criteria'
        };
      }
      return c;
    });

    setCandidates(updated);
    addActivityLog(
      'HR Screener',
      'Candidate Rejected',
      'Recruitment',
      selectedCandidate.candidateId || selectedCandidate.id,
      selectedCandidate.screeningStatus,
      'Rejected',
      rejectRemarks
    );

    setShowRejectModal(false);
    setSelectedCandidate(null);
    setRejectRemarks('');
  };

  // Handle Put on Hold
  const handlePutOnHold = (cand) => {
    const updated = candidates.map(c => {
      if ((c.candidateId || c.id) === (cand.candidateId || cand.id)) {
        return { ...c, screeningStatus: 'Hold' };
      }
      return c;
    });
    setCandidates(updated);
    addActivityLog(
      'HR Screener',
      'Candidate Put on Hold',
      'Recruitment',
      cand.candidateId || cand.id,
      cand.screeningStatus,
      'Hold',
      'Profile kept on future pool bench'
    );
  };

  // Handle Create Candidate manually
  const handleCreateCandidate = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter candidate name');
      return;
    }

    const newCandId = generateCandidateId();
    const newCandidate = {
      id: newCandId,
      candidateId: newCandId,
      name: formData.name.trim(),
      email: formData.email.trim(),
      mobile: formData.mobile.trim(),
      indentNumber: formData.indentNumber || (indents[0]?.indentNumber || 'HR-IND-001'),
      designation: formData.designation || 'Software Engineer',
      department: formData.department || 'Technology',
      qualification: formData.qualification,
      experience: formData.experience,
      currentCTC: formData.currentCTC,
      expectedCTC: formData.expectedCTC,
      noticePeriod: formData.noticePeriod,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : ['General'],
      screeningStatus: 'Pending',
      evaluationNotes: formData.evaluationNotes || 'Screening profile created directly',
      screeningDate: new Date().toISOString().split('T')[0]
    };

    setCandidates([newCandidate, ...candidates]);
    addActivityLog('HR Screener', 'Added Candidate for Screening', 'Recruitment', newCandId, null, 'Pending', `Candidate: ${newCandidate.name}`);

    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      mobile: '',
      indentNumber: '',
      designation: '',
      department: 'Technology',
      qualification: 'B.Tech / MCA',
      experience: '4 Years',
      currentCTC: '7,50,000',
      expectedCTC: '10,00,000',
      noticePeriod: '30 Days',
      skills: 'React, Node.js, SQL',
      evaluationNotes: ''
    });
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-black text-[9px] uppercase tracking-wider border border-cyan-500/30">
                HR FMS • Stage 4
              </span>
              <h1 className="text-base font-extrabold tracking-tight">
                Candidate Screening & Evaluation
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Resume review, CTC alignment, qualification audit & interview shortlisting</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Candidate Profile</span>
        </button>
      </div>

      {/* Compact Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, ID, position, skills..."
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
            <option value="All">All Screening Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Shortlisted">Shortlisted for Interview</option>
            <option value="Hold">On Hold</option>
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
            <option value="Sales & Marketing">Sales & Marketing</option>
          </select>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-black bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2 px-3">Candidate ID</th>
                <th className="py-2 px-3">Candidate & Contacts</th>
                <th className="py-2 px-3">Position & Indent</th>
                <th className="py-2 px-3">Exp & Notice</th>
                <th className="py-2 px-3">CTC (Current / Exp)</th>
                <th className="py-2 px-3">Skills</th>
                <th className="py-2 px-3">Screening Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold">No candidates match your current filter criteria</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => (
                  <tr
                    key={cand.candidateId || cand.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Candidate ID */}
                    <td className="py-2 px-3 font-medium">
                      <div className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {cand.candidateId || cand.id}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {cand.screeningDate || 'Today'}
                      </div>
                    </td>

                    {/* Candidate Name */}
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {cand.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {cand.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            {cand.email}
                          </span>
                        )}
                        {cand.mobile && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {cand.mobile}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Position */}
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {cand.designation}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Tag className="w-2.5 h-2.5 text-cyan-500" />
                        <span>{cand.indentNumber || 'HR-IND-001'}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>{cand.department}</span>
                      </div>
                    </td>

                    {/* Experience & Notice */}
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {cand.experience || '3 Yrs'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Notice: <span className="font-semibold text-cyan-600">{cand.noticePeriod || '30 Days'}</span>
                      </div>
                    </td>

                    {/* CTC */}
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        ₹ {cand.currentCTC}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        Exp: ₹ {cand.expectedCTC}
                      </div>
                    </td>

                    {/* Skills */}
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(Array.isArray(cand.skills) ? cand.skills : [cand.skills || 'Technical']).slice(0, 3).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Screening Status */}
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          cand.screeningStatus === 'Shortlisted'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : cand.screeningStatus === 'Rejected'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : cand.screeningStatus === 'Hold'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {cand.screeningStatus === 'Shortlisted' && <CheckCircle2 className="w-3 h-3" />}
                        {cand.screeningStatus === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {cand.screeningStatus === 'Hold' && <PauseCircle className="w-3 h-3" />}
                        {cand.screeningStatus === 'Pending' && <Clock className="w-3 h-3" />}
                        {cand.screeningStatus || 'Pending'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCandidate(cand);
                            setShowDetailModal(true);
                          }}
                          title="View Profile Details"
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {cand.screeningStatus !== 'Shortlisted' && cand.screeningStatus !== 'Rejected' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedCandidate(cand);
                                setShowShortlistModal(true);
                              }}
                              title="Shortlist for Interview"
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Shortlist</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCandidate(cand);
                                setShowRejectModal(true);
                              }}
                              title="Reject Candidate"
                              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handlePutOnHold(cand)}
                              title="Put on Hold"
                              className="p-1 text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {cand.screeningStatus === 'Shortlisted' && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Interviewing</span>
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

      {/* Shortlist Modal */}
      {showShortlistModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                  <ThumbsUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Shortlist for Interview</h3>
                  <p className="text-xs text-slate-400">Advance to Stage 5: Follow-up / Interview</p>
                </div>
              </div>
              <button
                onClick={() => setShowShortlistModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Candidate</span>
                <p className="font-black text-slate-900 dark:text-white text-sm">{selectedCandidate.name}</p>
                <p className="text-slate-500">{selectedCandidate.designation} • {selectedCandidate.department}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign First Interview Round *
                </label>
                <select
                  value={shortlistRound}
                  onChange={(e) => setShortlistRound(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Round 1 - Technical Assessment">Round 1 - Technical Assessment</option>
                  <option value="Round 1 - HR & Cultural Fit">Round 1 - HR & Cultural Fit</option>
                  <option value="Round 1 - Machine Coding Test">Round 1 - Machine Coding Test</option>
                  <option value="Round 1 - Managerial Discussion">Round 1 - Managerial Discussion</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Screening Feedback & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Strong foundational knowledge in system architecture, recommended for tech evaluation..."
                  value={shortlistRemarks}
                  onChange={(e) => setShortlistRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowShortlistModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmShortlist}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <span>Confirm & Move to Interview</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-xl">
                  <ThumbsDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Reject Candidate</h3>
                  <p className="text-xs text-slate-400">Log rejection rationale for audit record</p>
                </div>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Candidate</span>
                <p className="font-black text-slate-900 dark:text-white text-sm">{selectedCandidate.name}</p>
                <p className="text-slate-500">{selectedCandidate.designation}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rejection *
                </label>
                <select
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white mb-2"
                >
                  <option value="">Select standard reason...</option>
                  <option value="CTC mismatch (Expectation exceeds budget)">CTC mismatch (Expectation exceeds budget)</option>
                  <option value="Notice period too long (Need immediate joinee)">Notice period too long (Need immediate joinee)</option>
                  <option value="Lack of required tech stack hands-on experience">Lack of required tech stack hands-on experience</option>
                  <option value="Location / Relocation constraints">Location / Relocation constraints</option>
                  <option value="Under-qualified for senior designation">Under-qualified for senior designation</option>
                </select>
                <textarea
                  rows={2}
                  placeholder="Or enter custom rejection notes..."
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/20"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Add Candidate for Screening</h3>
                  <p className="text-xs text-slate-400">Directly enter profile details for evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCandidate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Varma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="rahul.varma@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 12345"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Developer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Experience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 Years"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current CTC (₹)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8,00,000"
                    value={formData.currentCTC}
                    onChange={(e) => setFormData({ ...formData, currentCTC: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expected CTC (₹)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11,00,000"
                    value={formData.expectedCTC}
                    onChange={(e) => setFormData({ ...formData, expectedCTC: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Key Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="React.js, Next.js, Redux, TailwindCSS"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Screening Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on communication, relevant projects, CTC flexibility..."
                  value={formData.evaluationNotes}
                  onChange={(e) => setFormData({ ...formData, evaluationNotes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Save to Screening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {showDetailModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-mono font-bold text-xs text-cyan-500">{selectedCandidate.candidateId}</span>
                <h3 className="font-black text-lg text-slate-900 dark:text-white mt-0.5">{selectedCandidate.name}</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Applying For</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedCandidate.designation}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Department</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedCandidate.department}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Experience</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedCandidate.experience}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Notice Period</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedCandidate.noticePeriod}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Current CTC:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">₹ {selectedCandidate.currentCTC}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Expected CTC:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹ {selectedCandidate.expectedCTC}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Email:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCandidate.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Phone:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCandidate.mobile}</span>
                </div>
              </div>

              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
                <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase">Screening Notes</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1">{selectedCandidate.evaluationNotes || 'Profile screened and verified against job requirement.'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
