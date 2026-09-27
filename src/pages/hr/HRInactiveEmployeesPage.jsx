import React, { useState, useMemo } from 'react';
import {
  UserX,
  Search,
  Filter,
  Eye,
  FileText,
  Printer,
  Calendar,
  Building,
  User,
  ShieldCheck,
  CreditCard,
  Award,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import { HR_KEYS } from '../../services/hrStorageService';

export function HRInactiveEmployeesPage() {
  const { data: inactives } = useHRStorage(HR_KEYS.INACTIVE_EMPLOYEES, []);
  const { data: letters } = useHRStorage(HR_KEYS.LETTERS, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [letterType, setLetterType] = useState('Relieving Letter');

  // Filtered list
  const filteredInactives = useMemo(() => {
    return inactives.filter(emp => {
      const matchesSearch =
        (emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [inactives, searchTerm, departmentFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: inactives.length,
      lettersIssued: inactives.filter(e => e.relievingLetterIssued).length,
      fnfClosed: inactives.filter(e => e.fnfStatus === 'Closed').length
    };
  }, [inactives]);

  // Open letter view
  const handleOpenLetter = (emp, type) => {
    setLetterType(type);
    const existing = letters.find(l => l.candidateOrEmployeeId === emp.employeeId && l.letterType === type);

    setSelectedLetter(existing || {
      letterType: type,
      recipientName: emp.employeeName,
      candidateOrEmployeeId: emp.employeeId,
      designation: emp.designation,
      department: emp.department,
      effectiveDate: emp.lastWorkingDate,
      joiningDate: emp.joiningDate,
      ctc: '₹ 12,00,000'
    });
    setShowLetterModal(true);
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
            <UserX className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-black text-[9px] uppercase tracking-wider border border-cyan-500/30">
                HR FMS • Stage 14
              </span>
              <h1 className="text-base font-extrabold tracking-tight">
                Inactive & Separated Employee Archive
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Historical alumni repository, completed separation records & relieving letter delivery</p>
          </div>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alumni name, ID or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* Inactive Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-black bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2 px-3">Emp ID</th>
                <th className="py-2 px-3">Alumni Name & Role</th>
                <th className="py-2 px-3">Tenure (Joining - LWD)</th>
                <th className="py-2 px-3">Separation Reason</th>
                <th className="py-2 px-3">Clearance</th>
                <th className="py-2 px-3">F&F Status</th>
                <th className="py-2 px-3 text-right">Official Letters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredInactives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserX className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold">No inactive employee records found</p>
                  </td>
                </tr>
              ) : (
                filteredInactives.map((emp) => (
                  <tr
                    key={emp.employeeId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-2 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {emp.employeeId}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {emp.employeeName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {emp.designation} • {emp.department}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                      {emp.joiningDate} to <span className="font-bold text-slate-800 dark:text-slate-200">{emp.lastWorkingDate}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                      {emp.exitReason || 'Resigned'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Cleared</span>
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CreditCard className="w-3 h-3" />
                        <span>Closed</span>
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenLetter(emp, 'Relieving Letter')}
                          className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Relieving Letter
                        </button>
                        <button
                          onClick={() => handleOpenLetter(emp, 'Experience Letter')}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Experience Cert
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

      {/* Relieving / Experience Letter Modal */}
      {showLetterModal && selectedLetter && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 border border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-600" />
                <span className="font-black text-sm uppercase text-slate-600">{letterType}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button onClick={() => setShowLetterModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
              <div>
                <h2 className="text-xl font-black text-slate-900">TASKFLOW ENTERPRISES PVT. LTD.</h2>
                <p className="text-xs text-slate-500">Corporate Tower, Tech Park Phase 2, Bangalore - 560100</p>
                <p className="text-xs text-slate-500">hr@taskflow.os • CIN: U72200KA2024PTC123456</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold text-slate-500">Ref: {selectedLetter.candidateOrEmployeeId}/SEP</p>
                <p className="text-xs text-slate-500 mt-1">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Content */}
            <div className="text-xs text-slate-700 space-y-4 leading-relaxed">
              <p className="font-bold text-center text-sm uppercase underline tracking-wider text-slate-900">
                {letterType === 'Relieving Letter' ? 'RELIEVING LETTER & NO DUES CERTIFICATE' : 'CERTIFICATE OF SERVICE & EXPERIENCE'}
              </p>

              <p>To Whomsoever It May Concern,</p>

              {letterType === 'Relieving Letter' ? (
                <p>
                  This is to certify that <strong>{selectedLetter.recipientName}</strong> (Employee ID: <strong>{selectedLetter.candidateOrEmployeeId}</strong>) was employed with TaskFlow Enterprises Pvt. Ltd. as <strong>{selectedLetter.designation}</strong> in the <strong>{selectedLetter.department}</strong> department, and has been formally relieved from their duties at the close of business hours on <strong>{selectedLetter.effectiveDate}</strong>.
                </p>
              ) : (
                <p>
                  This is to certify that <strong>{selectedLetter.recipientName}</strong> (Employee ID: <strong>{selectedLetter.candidateOrEmployeeId}</strong>) worked with TaskFlow Enterprises Pvt. Ltd. from <strong>{selectedLetter.joiningDate || '2024-01-15'}</strong> to <strong>{selectedLetter.effectiveDate}</strong> as <strong>{selectedLetter.designation}</strong>. During their tenure, their conduct and performance were found to be commendable.
                </p>
              )}

              <p>
                All company assets, documents, and financial dues have been successfully settled and verified. We wish <strong>{selectedLetter.recipientName}</strong> all the very best in all their future endeavors.
              </p>
            </div>

            {/* Signature */}
            <div className="pt-8 border-t border-slate-200 flex justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">For TaskFlow Enterprises Pvt. Ltd.</p>
                <div className="h-10"></div>
                <p className="font-bold text-slate-700">Authorized Human Resources Officer</p>
                <p className="text-[10px] text-slate-400">People & Talent Operations</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
