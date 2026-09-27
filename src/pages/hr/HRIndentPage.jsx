import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Building,
  User,
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  setHRData,
  generateIndentNumber,
  addActivityLog
} from '../../services/hrStorageService';

const DEPARTMENTS = [
  'Technology & IT',
  'Sales & Commercial',
  'Human Resources',
  'Finance & Accounts',
  'Supply Chain & Logistics',
  'Operations & Plant',
  'Legal & Secretarial',
  'Administration'
];

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contractual', 'Internship'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['All', 'Pending Approval', 'Approved', 'Rejected', 'Draft', 'Closed'];

export function HRIndentPage() {
  const navigate = useNavigate();
  const indents = useHRStorage(HR_KEYS.INDENTS, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const initialForm = {
    indentNumber: '',
    requirementDate: new Date().toISOString().split('T')[0],
    department: 'Technology & IT',
    designation: '',
    numberOfPositions: 1,
    employmentType: 'Full-time',
    location: 'Corporate HQ',
    reportingManager: '',
    requiredQualification: '',
    requiredExperience: '',
    skillsRequired: '',
    salaryRange: '',
    priority: 'Medium',
    requiredJoiningDate: '',
    jobDescription: '',
    reasonForRequirement: '',
    remarks: '',
    attachment: '',
    status: 'Pending Approval',
    requestedBy: 'Department Head'
  };

  const [form, setForm] = useState(initialForm);

  const handleOpenCreateModal = () => {
    setSelectedIndent(null);
    setForm({
      ...initialForm,
      indentNumber: generateIndentNumber()
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (indent) => {
    setSelectedIndent(indent);
    setForm({ ...indent });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.designation.trim()) return alert('Designation is required');

    const updatedIndents = [...indents];
    if (selectedIndent) {
      const idx = updatedIndents.findIndex(i => i.id === selectedIndent.id);
      if (idx >= 0) {
        updatedIndents[idx] = { ...form, updatedAt: new Date().toISOString() };
        addActivityLog('User', 'Updated Indent', 'Recruitment', form.indentNumber, selectedIndent.status, form.status, 'Updated requirements');
      }
    } else {
      const newIndent = {
        ...form,
        id: form.indentNumber,
        createdAt: new Date().toISOString()
      };
      updatedIndents.unshift(newIndent);
      addActivityLog('User', 'Created Indent', 'Recruitment', newIndent.indentNumber, 'New', 'Pending Approval', 'New manpower indent submitted');
    }

    setHRData(HR_KEYS.INDENTS, updatedIndents);
    setIsModalOpen(false);

    if (!selectedIndent) {
      if (window.confirm(`Manpower Indent ${form.indentNumber} submitted! Navigate to Indent Approval page now?`)) {
        navigate('/hr/indent-approval');
      }
    }
  };

  const handleDelete = (indent) => {
    if (window.confirm(`Are you sure you want to delete indent ${indent.indentNumber}?`)) {
      const filtered = indents.filter(i => i.id !== indent.id);
      setHRData(HR_KEYS.INDENTS, filtered);
      addActivityLog('User', 'Deleted Indent', 'Recruitment', indent.indentNumber, indent.status, 'Deleted', 'Removed record');
    }
  };

  const filteredIndents = indents.filter(i => {
    if (statusFilter !== 'All' && i.status !== statusFilter) return false;
    if (departmentFilter !== 'All' && i.department !== departmentFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        i.indentNumber?.toLowerCase().includes(q) ||
        i.designation?.toLowerCase().includes(q) ||
        i.department?.toLowerCase().includes(q) ||
        i.reportingManager?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200';
      case 'high': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200';
      case 'medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200';
      case 'pending approval': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-3.5 py-2.5 rounded-xl text-white shadow-md border border-blue-800/30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/30">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-black text-[9px] uppercase tracking-wider border border-blue-500/30">
                HR FMS • Stage 1
              </span>
              <h1 className="text-base font-extrabold tracking-tight text-white">
                Indent & Manpower Requirements
              </h1>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">Raise department hiring requisitions for approval and job sourcing</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Raise Indent</span>
        </button>
      </div>

      {/* Compact Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search indents, roles, departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <span className="text-[11px] text-slate-400">
            Total: <strong className="text-slate-700 dark:text-slate-200">{filteredIndents.length}</strong>
          </span>
        </div>
      </div>

      {/* Indents High Density Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-black bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2 px-3">Indent No</th>
                <th className="py-2 px-3">Req Date</th>
                <th className="py-2 px-3">Department</th>
                <th className="py-2 px-3">Designation</th>
                <th className="py-2 px-3 text-center">Positions</th>
                <th className="py-2 px-3">Priority</th>
                <th className="py-2 px-3">Requested By</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredIndents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                    No manpower indents found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIndents.map((indent) => (
                  <tr key={indent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-1.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                      {indent.indentNumber}
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                      {indent.requirementDate}
                    </td>
                    <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-100 text-[11px]">
                      {indent.department}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white text-[11.5px]">
                      {indent.designation}
                    </td>
                    <td className="py-1.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                      {indent.numberOfPositions}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${getPriorityBadge(indent.priority)}`}>
                        {indent.priority}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                      {indent.requestedBy || 'Dept Head'}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${getStatusBadge(indent.status)}`}>
                        {indent.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="View Details"
                          onClick={() => {
                            setSelectedIndent(indent);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Edit Indent"
                          onClick={() => handleOpenEditModal(indent)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Delete Indent"
                          onClick={() => handleDelete(indent)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedIndent ? `Edit Indent: ${form.indentNumber}` : 'Raise Manpower Indent'}
                  </h2>
                  <p className="text-xs text-slate-400">Formal hiring specification and position justification</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Indent Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={form.indentNumber}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Requirement Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.requirementDate}
                    onChange={(e) => setForm({ ...form, requirementDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Department *
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Designation / Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    No. of Positions *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.numberOfPositions}
                    onChange={(e) => setForm({ ...form, numberOfPositions: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Employment Type
                  </label>
                  <select
                    value={form.employmentType}
                    onChange={(e) => setForm({ ...form, employmentType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Reporting Manager
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikas Sharma (CTO)"
                    value={form.reportingManager}
                    onChange={(e) => setForm({ ...form, reportingManager: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Required Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="B.Tech, MBA, MCA..."
                    value={form.requiredQualification}
                    onChange={(e) => setForm({ ...form, requiredQualification: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Required Experience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4 - 6 Years"
                    value={form.requiredExperience}
                    onChange={(e) => setForm({ ...form, requiredExperience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Salary Range (CTC)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹ 14L - ₹ 18L P.A."
                    value={form.salaryRange}
                    onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Hiring Priority *
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Target Joining Date
                  </label>
                  <input
                    type="date"
                    value={form.requiredJoiningDate}
                    onChange={(e) => setForm({ ...form, requiredJoiningDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Skills Required
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, TypeScript, PostgreSQL, AWS"
                  value={form.skillsRequired}
                  onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Job Description & Role Summary
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Key responsibilities and deliverable expectations..."
                    value={form.jobDescription}
                    onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Reason for Requirement & Justification
                  </label>
                  <textarea
                    rows={3}
                    placeholder="New project expansion, replacement, workload surge..."
                    value={form.reasonForRequirement}
                    onChange={(e) => setForm({ ...form, reasonForRequirement: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {selectedIndent ? 'Update Indent' : 'Submit Indent for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewModalOpen && selectedIndent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedIndent.indentNumber}: {selectedIndent.designation}
                  </h2>
                  <p className="text-xs text-slate-400">{selectedIndent.department} • Positions: {selectedIndent.numberOfPositions}</p>
                </div>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2">
                <div>Priority: <strong className="text-rose-600">{selectedIndent.priority}</strong></div>
                <div>Employment Type: <strong>{selectedIndent.employmentType}</strong></div>
                <div>Location: <strong>{selectedIndent.location}</strong></div>
                <div>Reporting: <strong>{selectedIndent.reportingManager}</strong></div>
                <div>Salary Range: <strong>{selectedIndent.salaryRange}</strong></div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2">
                <div>Required Qualification: <strong>{selectedIndent.requiredQualification}</strong></div>
                <div>Experience: <strong>{selectedIndent.requiredExperience}</strong></div>
                <div>Target Joining: <strong>{selectedIndent.requiredJoiningDate}</strong></div>
                <div>Requested By: <strong>{selectedIndent.requestedBy}</strong></div>
                <div>Status: <span className={`px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(selectedIndent.status)}`}>{selectedIndent.status}</span></div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs space-y-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Skills & Description</h4>
              <p><strong>Skills:</strong> {selectedIndent.skillsRequired}</p>
              <p><strong>Job Description:</strong> {selectedIndent.jobDescription}</p>
              <p><strong>Reason for Hiring:</strong> {selectedIndent.reasonForRequirement}</p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  navigate('/hr/indent-approval');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Go to Indent Approval Portal</span>
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
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
