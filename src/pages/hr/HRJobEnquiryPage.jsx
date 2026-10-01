import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Eye,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  X,
  Share2,
  Globe,
  Tag,
  History
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  generateEnquiryId,
  generateCandidateId,
  addActivityLog
} from '../../services/hrStorageService';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function HRJobEnquiryPage() {
  const { data: enquiries, setItem: setEnquiries } = useHRStorage(HR_KEYS.JOB_ENQUIRIES, []);
  const { data: indents } = useHRStorage(HR_KEYS.INDENTS, []);
  const { data: candidates, setItem: setCandidates } = useHRStorage(HR_KEYS.CANDIDATES, []);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState('pending');
  const todayStr = new Date().toISOString().split('T')[0];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedIndent, setSelectedIndent] = useState('All');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // New enquiry form state
  const [formData, setFormData] = useState({
    indentNumber: '',
    department: '',
    designation: '',
    source: 'LinkedIn',
    candidateName: '',
    email: '',
    mobile: '',
    qualification: 'B.Tech / MCA',
    totalExperience: '3 Years',
    currentLocation: 'Bangalore',
    noticePeriod: '30 Days',
    keySkills: '',
    resumeLink: '',
    remarks: ''
  });

  // Approved indents available for sourcing
  const approvedIndents = useMemo(() => {
    return indents.filter(i => i.status === 'Approved');
  }, [indents]);

  const handleIndentChange = (indentNo) => {
    const found = approvedIndents.find(i => i.indentNumber === indentNo);
    if (found) {
      setFormData(prev => ({
        ...prev,
        indentNumber: indentNo,
        department: found.department || '',
        designation: found.designation || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        indentNumber: indentNo
      }));
    }
  };

  // Add new enquiry
  const handleCreateEnquiry = (e) => {
    e.preventDefault();
    if (!formData.candidateName.trim()) {
      alert('Please enter Candidate Name');
      return;
    }

    const newEnquiryId = generateEnquiryId();
    const newEnquiry = {
      id: newEnquiryId,
      enquiryId: newEnquiryId,
      indentNumber: formData.indentNumber || (approvedIndents[0]?.indentNumber || 'HR-IND-001'),
      source: formData.source,
      candidateName: formData.candidateName.trim(),
      email: formData.email.trim(),
      mobile: formData.mobile.trim(),
      department: formData.department || 'Technology',
      designation: formData.designation || 'Software Engineer',
      qualification: formData.qualification,
      totalExperience: formData.totalExperience,
      currentLocation: formData.currentLocation,
      noticePeriod: formData.noticePeriod,
      keySkills: formData.keySkills,
      enquiryDate: new Date().toISOString().split('T')[0],
      status: 'In Sourcing',
      resumeLink: formData.resumeLink || 'Uploaded_Resume.pdf',
      remarks: formData.remarks || 'Direct sourcing entry'
    };

    setEnquiries([newEnquiry, ...enquiries]);
    addActivityLog('HR Recruiter', 'Logged Job Application', 'Recruitment', newEnquiryId, null, 'In Sourcing', `Candidate ${newEnquiry.candidateName} for ${newEnquiry.designation}`);

    setShowAddModal(false);
    setFormData({
      indentNumber: '',
      department: '',
      designation: '',
      source: 'LinkedIn',
      candidateName: '',
      email: '',
      mobile: '',
      qualification: 'B.Tech / MCA',
      totalExperience: '3 Years',
      currentLocation: 'Bangalore',
      noticePeriod: '30 Days',
      keySkills: '',
      resumeLink: '',
      remarks: ''
    });
  };

  // Move to Screening action
  const handleMoveToScreening = (enquiry) => {
    // 1. Update enquiry status
    const updatedEnquiries = enquiries.map(e => {
      if (e.id === enquiry.id) {
        return { ...e, status: 'Moved to Screening' };
      }
      return e;
    });
    setEnquiries(updatedEnquiries);

    // 2. Add or ensure in candidates list
    const candidateExists = candidates.some(c => c.email && c.email.toLowerCase() === enquiry.email?.toLowerCase());
    if (!candidateExists) {
      const newCandId = generateCandidateId();
      const newCandidate = {
        id: newCandId,
        candidateId: newCandId,
        enquiryId: enquiry.enquiryId || enquiry.id,
        indentNumber: enquiry.indentNumber,
        name: enquiry.candidateName,
        email: enquiry.email,
        mobile: enquiry.mobile,
        designation: enquiry.designation,
        department: enquiry.department,
        qualification: enquiry.qualification || 'Graduation',
        experience: enquiry.totalExperience || '3 Years',
        currentCTC: '6,00,000',
        expectedCTC: '8,50,000',
        noticePeriod: enquiry.noticePeriod || '30 Days',
        skills: enquiry.keySkills ? enquiry.keySkills.split(',').map(s => s.trim()) : ['General'],
        screeningStatus: 'Pending',
        evaluationNotes: `Moved from Sourcing stage (${enquiry.source})`,
        screeningDate: new Date().toISOString().split('T')[0]
      };
      setCandidates([newCandidate, ...candidates]);
    }

    addActivityLog('HR Recruiter', 'Advanced to Screening', 'Recruitment', enquiry.enquiryId || enquiry.id, 'In Sourcing', 'Candidate Screening', `Moved ${enquiry.candidateName} to Screening stage`);
  };

  const pendingEnquiries = enquiries.filter(e => e.status !== 'Moved to Screening' && e.status !== 'Rejected');
  const historyEnquiries = enquiries.filter(e => e.status === 'Moved to Screening' || e.status === 'Rejected');

  // Filtered list
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(item => {
      if (activeTab === 'pending' && (item.status === 'Moved to Screening' || item.status === 'Rejected')) return false;
      if (activeTab === 'history' && item.status !== 'Moved to Screening' && item.status !== 'Rejected') return false;

      const matchesSearch =
        (item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.designation?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.enquiryId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.indentNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSource = selectedSource === 'All' || item.source === selectedSource;
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
      const matchesIndent = selectedIndent === 'All' || item.indentNumber === selectedIndent;

      return matchesSearch && matchesSource && matchesStatus && matchesIndent;
    });
  }, [enquiries, activeTab, searchTerm, selectedSource, selectedStatus, selectedIndent]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: enquiries.length,
      inSourcing: enquiries.filter(e => e.status === 'In Sourcing' || e.status === 'Open').length,
      movedToScreening: enquiries.filter(e => e.status === 'Moved to Screening').length,
      linkedIndents: new Set(enquiries.map(e => e.indentNumber)).size
    };
  }, [enquiries]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-md shadow-cyan-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Job Enquiries & Candidate Sourcing
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stage 3: Multi-channel candidate acquisition linked to approved hiring indents
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              <span>Pending ({pendingEnquiries.length})</span>
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
              <span>History ({historyEnquiries.length})</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Candidate Application</span>
          </button>
        </div>
      </div>


      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates, designation, ID or Indent #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="All">All Sourcing Channels</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Naukri.com">Naukri.com</option>
            <option value="Indeed">Indeed</option>
            <option value="Employee Referral">Employee Referral</option>
            <option value="Company Careers Portal">Company Careers</option>
            <option value="Recruitment Agency">Recruitment Agency</option>
            <option value="Walk-in">Walk-in</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="All">All Statuses</option>
            <option value="In Sourcing">In Sourcing Pool</option>
            <option value="Moved to Screening">Moved to Screening</option>
          </select>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Sourced Applications Register
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
              {filteredEnquiries.length} records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4">Enquiry ID / Date</th>
                <th className="py-3 px-4">Candidate & Contacts</th>
                <th className="py-3 px-4">Indent & Position</th>
                <th className="py-3 px-4">Experience & Skills</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 8 : 10} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold">No {activeTab} candidate enquiries match the current filters</p>
                    <p className="text-[11px] text-slate-500 mt-1">Try resetting filters or log a new candidate</p>
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enq) => (
                  <tr
                    key={enq.id || enq.enquiryId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* ID & Date */}
                    <td className="py-3.5 px-4 font-medium">
                      <div className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {enq.enquiryId || enq.id}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {enq.enquiryDate || 'Today'}
                      </div>
                    </td>

                    {/* Candidate */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{enq.candidateName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {enq.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            {enq.email}
                          </span>
                        )}
                        {enq.mobile && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {enq.mobile}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Indent & Designation */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {enq.designation}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Tag className="w-2.5 h-2.5 text-cyan-500" />
                        <span>Indent: {enq.indentNumber}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span>{enq.department}</span>
                      </div>
                    </td>

                    {/* Experience & Skills */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {enq.totalExperience} • {enq.qualification}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                        {enq.keySkills || 'Full Stack, React, Node.js'}
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <Share2 className="w-2.5 h-2.5 text-cyan-500" />
                        {enq.source}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          enq.status === 'Moved to Screening'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {enq.status === 'Moved to Screening' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {enq.status || 'In Sourcing'}
                      </span>
                    </td>

                    {activeTab === 'pending' ? (
                      <PlannedTd plannedDate={enq.enquiryDate || enq.createdAt?.split('T')[0] || todayStr} />
                    ) : (
                      <HistoryTatTd
                        plannedDate={enq.enquiryDate || enq.createdAt?.split('T')[0] || todayStr}
                        actualDate={enq.updatedAt?.split('T')[0] || enq.enquiryDate || todayStr}
                      />
                    )}

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedItem(enq);
                            setShowDetailModal(true);
                          }}
                          title="View Profile Details"
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {enq.status !== 'Moved to Screening' ? (
                          <button
                            onClick={() => handleMoveToScreening(enq)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <span>Move to Screening</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Screening</span>
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

      {/* Add New Sourcing / Enquiry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Log Candidate Application</h3>
                  <p className="text-xs text-slate-400">Capture candidate enquiry into sourcing pool</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="space-y-4 text-xs">
              {/* Select Indent */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Link with Approved Indent Requisition *
                </label>
                <select
                  value={formData.indentNumber}
                  onChange={(e) => handleIndentChange(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Select an Approved Indent</option>
                  {approvedIndents.map(ind => (
                    <option key={ind.indentNumber} value={ind.indentNumber}>
                      {ind.indentNumber} - {ind.designation} ({ind.department})
                    </option>
                  ))}
                  {approvedIndents.length === 0 && (
                    <option value="HR-IND-001">HR-IND-001 - Senior Full Stack Engineer (Tech)</option>
                  )}
                </select>
              </div>

              {/* Sourcing Channel */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sourcing Channel *
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Naukri.com">Naukri.com</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Employee Referral">Employee Referral</option>
                    <option value="Company Careers Portal">Company Careers Portal</option>
                    <option value="Recruitment Agency">Recruitment Agency</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Experience *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4.5 Years"
                    value={formData.totalExperience}
                    onChange={(e) => setFormData({ ...formData, totalExperience: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Candidate Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.candidateName}
                    onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="priya.sharma@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notice Period
                  </label>
                  <select
                    value={formData.noticePeriod}
                    onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="90 Days">90 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Key Skills & Qualifications
                </label>
                <input
                  type="text"
                  placeholder="e.g. React.js, Node.js, TypeScript, PostgreSQL"
                  value={formData.keySkills}
                  onChange={(e) => setFormData({ ...formData, keySkills: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recruiter Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Initial profile impression, sourcing notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Save Enquiry & Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-mono font-bold text-xs text-cyan-500">{selectedItem.enquiryId}</span>
                <h3 className="font-black text-lg text-slate-900 dark:text-white mt-0.5">{selectedItem.candidateName}</h3>
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
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedItem.designation}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Department</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedItem.department}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Linked Indent</span>
                  <p className="font-mono font-bold text-cyan-600 mt-0.5">{selectedItem.indentNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Sourcing Channel</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedItem.source}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Contact Email:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Mobile:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.mobile || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Experience:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.totalExperience}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Notice Period:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.noticePeriod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Key Skills:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedItem.keySkills || 'Full Stack'}</span>
                </div>
              </div>

              {selectedItem.remarks && (
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
                  <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 uppercase">Recruiter Notes</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-1">{selectedItem.remarks}</p>
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
              {selectedItem.status !== 'Moved to Screening' && (
                <button
                  onClick={() => {
                    handleMoveToScreening(selectedItem);
                    setShowDetailModal(false);
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  <span>Advance to Screening</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
