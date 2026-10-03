import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Building,
  Video,
  MapPin,
  Star,
  Award,
  ArrowRight,
  X,
  FileText,
  AlertCircle,
  Phone,
  Mail,
  Send,
  RotateCcw,
  History
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  generateInterviewId,
  recordInterviewSelection,
  addActivityLog
} from '../../services/hrStorageService';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function HRInterviewPage() {
  const { data: interviews, setItem: setInterviews } = useHRStorage(HR_KEYS.INTERVIEWS, []);
  const { data: candidates } = useHRStorage(HR_KEYS.CANDIDATES, []);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('pending');
  const todayStr = new Date().toISOString().split('T')[0];
  const [searchTerm, setSearchTerm] = useState('');
  const [roundFilter, setRoundFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Schedule form state
  const [scheduleData, setScheduleData] = useState({
    candidateId: '',
    candidateName: '',
    designation: '',
    department: 'Technology',
    roundName: 'Round 1 - Technical Assessment',
    interviewerName: 'Amitabh Sharma (Tech Lead)',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '11:00 AM',
    mode: 'Google Meet',
    meetingLink: 'https://meet.google.com/xyz-hr-tech',
    venue: 'Conference Room Alpha',
    remarks: 'Focus on System Design & Coding'
  });

  // Feedback & Evaluation state
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    techScore: 4,
    commScore: 4,
    cultureFit: 5,
    decision: 'Selected',
    offeredCTC: '11,00,000',
    notes: 'Exceptional candidate, clear architecture concepts, strongly recommended for offer.'
  });

  // Shortlisted candidates available for scheduling
  const availableCandidates = useMemo(() => {
    return candidates.filter(c => c.screeningStatus === 'Shortlisted' || c.screeningStatus === 'Pending');
  }, [candidates]);

  const handleSelectCandidate = (candId) => {
    const found = candidates.find(c => (c.candidateId || c.id) === candId);
    if (found) {
      setScheduleData(prev => ({
        ...prev,
        candidateId: candId,
        candidateName: found.name,
        designation: found.designation || 'Software Engineer',
        department: found.department || 'Technology'
      }));
    }
  };

  // Submit new interview
  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleData.candidateName.trim()) {
      alert('Please select or specify a candidate');
      return;
    }

    const newIntId = generateInterviewId();
    const newInterview = {
      id: newIntId,
      interviewId: newIntId,
      candidateId: scheduleData.candidateId || 'CND-NEW',
      candidateName: scheduleData.candidateName,
      designation: scheduleData.designation,
      department: scheduleData.department,
      roundName: scheduleData.roundName,
      interviewerName: scheduleData.interviewerName,
      scheduledDate: scheduleData.scheduledDate,
      scheduledTime: scheduleData.scheduledTime,
      mode: scheduleData.mode,
      meetingLink: scheduleData.meetingLink,
      venue: scheduleData.venue,
      status: 'Scheduled',
      rating: 0,
      feedback: '',
      evaluationScores: {},
      remarks: scheduleData.remarks
    };

    setInterviews([newInterview, ...interviews]);
    addActivityLog('HR Scheduler', 'Scheduled Interview', 'Recruitment', newIntId, null, 'Scheduled', `${newInterview.roundName} with ${newInterview.candidateName}`);

    setShowScheduleModal(false);
    setScheduleData({
      candidateId: '',
      candidateName: '',
      designation: '',
      department: 'Technology',
      roundName: 'Round 1 - Technical Assessment',
      interviewerName: 'Amitabh Sharma (Tech Lead)',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '11:00 AM',
      mode: 'Google Meet',
      meetingLink: 'https://meet.google.com/xyz-hr-tech',
      venue: 'Conference Room Alpha',
      remarks: ''
    });
  };

  // Submit Feedback & Evaluation
  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!selectedInterview) return;

    if (feedbackData.decision === 'Selected') {
      // Trigger complete automated selection and offer creation workflow!
      const res = recordInterviewSelection(
        selectedInterview.interviewId || selectedInterview.id,
        {
          rating: feedbackData.rating,
          feedback: feedbackData.notes,
          offeredCTC: feedbackData.offeredCTC,
          interviewer: selectedInterview.interviewerName
        }
      );

      if (res.success) {
        setShowFeedbackModal(false);
        setSelectedInterview(null);
      } else {
        alert(res.message || 'Error recording evaluation');
      }
    } else if (feedbackData.decision === 'Next Round Required') {
      // Update current interview to Completed
      const updated = interviews.map(i => {
        if ((i.interviewId || i.id) === (selectedInterview.interviewId || selectedInterview.id)) {
          return {
            ...i,
            status: 'Completed',
            rating: feedbackData.rating,
            feedback: feedbackData.notes
          };
        }
        return i;
      });

      // Create Next Round
      const nextId = generateInterviewId();
      const nextRound = {
        id: nextId,
        interviewId: nextId,
        candidateId: selectedInterview.candidateId,
        candidateName: selectedInterview.candidateName,
        designation: selectedInterview.designation,
        department: selectedInterview.department,
        roundName: 'Round 2 - Department Head & Culture',
        interviewerName: 'VP / Director',
        scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        scheduledTime: '03:00 PM',
        mode: 'Google Meet',
        meetingLink: 'https://meet.google.com/xyz-next-round',
        status: 'Scheduled',
        rating: 0,
        feedback: ''
      };

      setInterviews([nextRound, ...updated]);
      addActivityLog('HR Scheduler', 'Moved to Next Round', 'Recruitment', nextId, 'Round 1 Completed', 'Scheduled', `Scheduled Next Round for ${selectedInterview.candidateName}`);

      setShowFeedbackModal(false);
      setSelectedInterview(null);
    } else {
      // Rejected in Interview
      const updated = interviews.map(i => {
        if ((i.interviewId || i.id) === (selectedInterview.interviewId || selectedInterview.id)) {
          return {
            ...i,
            status: 'Rejected',
            rating: feedbackData.rating,
            feedback: feedbackData.notes
          };
        }
        return i;
      });
      setInterviews(updated);
      addActivityLog('Interviewer', 'Candidate Rejected in Interview', 'Recruitment', selectedInterview.interviewId || selectedInterview.id, 'Scheduled', 'Rejected', feedbackData.notes);

      setShowFeedbackModal(false);
      setSelectedInterview(null);
    }
  };

  const pendingInterviews = interviews.filter(i => i.status === 'Scheduled');
  const historyInterviews = interviews.filter(i => i.status !== 'Scheduled');

  // Filtered interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter(item => {
      if (activeTab === 'pending' && item.status !== 'Scheduled') return false;
      if (activeTab === 'history' && item.status === 'Scheduled') return false;

      const matchesSearch =
        (item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.interviewId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.interviewerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.designation?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRound = roundFilter === 'All' || item.roundName.includes(roundFilter);
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesRound && matchesStatus;
    });
  }, [interviews, activeTab, searchTerm, roundFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: interviews.length,
      scheduled: interviews.filter(i => i.status === 'Scheduled').length,
      selected: interviews.filter(i => i.status === 'Selected').length,
      completed: interviews.filter(i => i.status === 'Completed').length,
      rejected: interviews.filter(i => i.status === 'Rejected').length
    };
  }, [interviews]);

  return (
    <div className="space-y-2.5">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-200 dark:border-cyan-800/80">
            HR FMS • Stage 5
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Interview Operations
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
              <span>Pending ({pendingInterviews.length})</span>
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
              <span>History ({historyInterviews.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Schedule</span>
          </button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, interviewer, role or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="All">All Interview Rounds</option>
            <option value="Technical">Technical Rounds</option>
            <option value="HR">HR & Cultural Fit</option>
            <option value="Head">Department Head</option>
            <option value="Final">Final / Leadership</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Selected">Selected</option>
            <option value="Completed">Completed / Next Round</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Interviews Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-black bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2 px-3">Interview ID</th>
                <th className="py-2 px-3">Candidate & Role</th>
                <th className="py-2 px-3">Round & Mode</th>
                <th className="py-2 px-3">Interviewer</th>
                <th className="py-2 px-3">Date & Time</th>
                <th className="py-2 px-3">Rating & Result</th>
                <th className="py-2 px-3">Status</th>
                {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 9 : 11} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold">No {activeTab} interviews found</p>
                  </td>
                </tr>
              ) : (
                filteredInterviews.map((intItem) => (
                  <tr
                    key={intItem.interviewId || intItem.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* ID */}
                    <td className="py-2 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {intItem.interviewId || intItem.id}
                    </td>

                    {/* Candidate */}
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {intItem.candidateName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{intItem.designation}</span>
                        <span>•</span>
                        <span className="font-mono text-cyan-500">{intItem.candidateId}</span>
                      </div>
                    </td>

                    {/* Round & Mode */}
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {intItem.roundName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        {intItem.mode === 'Google Meet' || intItem.mode === 'Zoom' ? (
                          <Video className="w-3 h-3 text-cyan-500" />
                        ) : (
                          <MapPin className="w-3 h-3 text-amber-500" />
                        )}
                        <span>{intItem.mode || 'Online Video'}</span>
                      </div>
                    </td>

                    {/* Interviewer */}
                    <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {intItem.interviewerName}
                    </td>

                    {/* Date & Time */}
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {intItem.scheduledDate}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {intItem.scheduledTime}
                      </div>
                    </td>

                    {/* Rating & Result */}
                    <td className="py-2 px-3">
                      {intItem.rating > 0 ? (
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{intItem.rating} / 5</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Not rated yet</span>
                      )}
                      {intItem.feedback && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {intItem.feedback}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          intItem.status === 'Selected'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : intItem.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : intItem.status === 'Completed'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {intItem.status === 'Selected' && <CheckCircle2 className="w-3 h-3" />}
                        {intItem.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {intItem.status === 'Scheduled' && <Clock className="w-3 h-3" />}
                        {intItem.status || 'Scheduled'}
                      </span>
                    </td>

                    {activeTab === 'pending' ? (
                      <PlannedTd plannedDate={intItem.scheduledDate || todayStr} />
                    ) : (
                      <HistoryTatTd
                        plannedDate={intItem.scheduledDate || todayStr}
                        actualDate={intItem.completedDate || intItem.updatedAt?.split('T')[0] || intItem.scheduledDate || todayStr}
                      />
                    )}

                    {/* Actions */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedInterview(intItem);
                            setShowDetailModal(true);
                          }}
                          title="View Round Details"
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {intItem.status === 'Scheduled' && (
                          <button
                            onClick={() => {
                              setSelectedInterview(intItem);
                              setShowFeedbackModal(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <span>Evaluate</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {intItem.status === 'Selected' && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>Offer Pending</span>
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

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Schedule Interview Round</h3>
                  <p className="text-xs text-slate-400">Set interview date, round details & panelist</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              {/* Select Shortlisted Candidate */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Candidate (from Shortlisted Pool) *
                </label>
                <select
                  value={scheduleData.candidateId}
                  onChange={(e) => handleSelectCandidate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Choose Shortlisted Candidate</option>
                  {availableCandidates.map(c => (
                    <option key={c.candidateId || c.id} value={c.candidateId || c.id}>
                      {c.name} - {c.designation} ({c.candidateId})
                    </option>
                  ))}
                  <option value="CUSTOM">Or type custom candidate name below</option>
                </select>
              </div>

              {!scheduleData.candidateId || scheduleData.candidateId === 'CUSTOM' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Candidate Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={scheduleData.candidateName}
                      onChange={(e) => setScheduleData({ ...scheduleData, candidateName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Backend Lead"
                      value={scheduleData.designation}
                      onChange={(e) => setScheduleData({ ...scheduleData, designation: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : null}

              {/* Round & Interviewer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Interview Round *
                  </label>
                  <select
                    value={scheduleData.roundName}
                    onChange={(e) => setScheduleData({ ...scheduleData, roundName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Round 1 - Technical Assessment">Round 1 - Technical Assessment</option>
                    <option value="Round 2 - Live Coding & Problem Solving">Round 2 - Live Coding</option>
                    <option value="Round 3 - Department Head & Fitment">Round 3 - Dept Head / Fitment</option>
                    <option value="Round 4 - Final Director Discussion">Round 4 - Final Director Discussion</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Interviewer / Panelist *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amitabh Sharma (Tech Lead)"
                    value={scheduleData.interviewerName}
                    onChange={(e) => setScheduleData({ ...scheduleData, interviewerName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Interview Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleData.scheduledDate}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time Slot *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:30 AM"
                    value={scheduleData.scheduledTime}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Mode & Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mode of Interview
                  </label>
                  <select
                    value={scheduleData.mode}
                    onChange={(e) => setScheduleData({ ...scheduleData, mode: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Google Meet">Google Meet (Online)</option>
                    <option value="Zoom">Zoom Meeting</option>
                    <option value="In-Person">In-Person (Office)</option>
                    <option value="Telephonic">Telephonic Screening</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Meeting Link or Room
                  </label>
                  <input
                    type="text"
                    placeholder="https://meet.google.com/..."
                    value={scheduleData.meetingLink}
                    onChange={(e) => setScheduleData({ ...scheduleData, meetingLink: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluation & Feedback Modal */}
      {showFeedbackModal && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Record Interview Evaluation</h3>
                  <p className="text-xs text-slate-400">Score performance & determine next lifecycle action</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Candidate Details</span>
                <p className="font-black text-slate-900 dark:text-white text-sm">{selectedInterview.candidateName}</p>
                <p className="text-slate-500">{selectedInterview.designation} • {selectedInterview.roundName}</p>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Overall Star Rating (1 to 5) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                      className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          feedbackData.rating >= star
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-slate-700 dark:text-slate-300 ml-2">
                    {feedbackData.rating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Decision */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Evaluation Verdict / Decision *
                </label>
                <select
                  value={feedbackData.decision}
                  onChange={(e) => setFeedbackData({ ...feedbackData, decision: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                >
                  <option value="Selected">Select Candidate (Unlock Stage 6: Offer Approval)</option>
                  <option value="Next Round Required">Next Round Required (Schedule Follow-up)</option>
                  <option value="Rejected">Reject (Drop Profile)</option>
                </select>
              </div>

              {feedbackData.decision === 'Selected' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Recommended Annual CTC for Offer (₹) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 11,50,000"
                    value={feedbackData.offeredCTC}
                    onChange={(e) => setFeedbackData({ ...feedbackData, offeredCTC: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                    * This will initialize Stage 6: Offer & Salary Approval with automated salary breakdown
                  </p>
                </div>
              )}

              {/* Feedback notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Interviewer Detailed Notes & Technical Assessment *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Strengths, weaknesses, communication, project problem solving..."
                  value={feedbackData.notes}
                  onChange={(e) => setFeedbackData({ ...feedbackData, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {showDetailModal && selectedInterview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-mono font-bold text-xs text-cyan-500">{selectedInterview.interviewId}</span>
                <h3 className="font-black text-lg text-slate-900 dark:text-white mt-0.5">{selectedInterview.candidateName}</h3>
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
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Round</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedInterview.roundName}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Interviewer</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedInterview.interviewerName}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Date & Time</span>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">{selectedInterview.scheduledDate} at {selectedInterview.scheduledTime}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Mode</span>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">{selectedInterview.mode}</p>
                </div>
              </div>

              {selectedInterview.meetingLink && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Link:</span>
                  <a
                    href={selectedInterview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-500 hover:underline font-mono truncate max-w-xs"
                  >
                    {selectedInterview.meetingLink}
                  </a>
                </div>
              )}

              {selectedInterview.feedback && (
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
                  <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase">Interviewer Feedback</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-1">{selectedInterview.feedback}</p>
                </div>
              )}
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
