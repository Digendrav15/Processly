import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  PieChart,
  BarChart3,
  CheckCircle2,
  Building
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import { HR_KEYS } from '../../services/hrStorageService';

export function HRReportsPage() {
  const { data: indents } = useHRStorage(HR_KEYS.INDENTS, []);
  const { data: enquiries } = useHRStorage(HR_KEYS.JOB_ENQUIRIES, []);
  const { data: candidates } = useHRStorage(HR_KEYS.CANDIDATES, []);
  const { data: interviews } = useHRStorage(HR_KEYS.INTERVIEWS, []);
  const { data: offers } = useHRStorage(HR_KEYS.OFFERS, []);
  const { data: joinings } = useHRStorage(HR_KEYS.JOININGS, []);
  const { data: employees } = useHRStorage(HR_KEYS.EMPLOYEES, []);
  const { data: resignations } = useHRStorage(HR_KEYS.RESIGNATIONS, []);
  const { data: inactives } = useHRStorage(HR_KEYS.INACTIVE_EMPLOYEES, []);
  const { data: payroll } = useHRStorage(HR_KEYS.PAYROLL, []);

  // Department counts
  const deptCounts = useMemo(() => {
    const counts = {};
    employees.forEach(e => {
      const d = e.department || 'Other';
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [employees]);

  // Funnel calculations
  const funnel = useMemo(() => {
    return [
      { stage: 'Requisitions Raised', count: indents.length, color: 'bg-blue-500' },
      { stage: 'Candidates Sourced', count: enquiries.length, color: 'bg-cyan-500' },
      { stage: 'Candidate Screened', count: candidates.length, color: 'bg-teal-500' },
      { stage: 'Interviews Conducted', count: interviews.length, color: 'bg-amber-500' },
      { stage: 'Offers Extended', count: offers.length, color: 'bg-purple-500' },
      { stage: 'New Joinees Onboarded', count: joinings.filter(j => j.status === 'Joined').length, color: 'bg-emerald-500' }
    ];
  }, [indents, enquiries, candidates, interviews, offers, joinings]);

  // Export any dataset
  const exportDataset = (filename, data, headers) => {
    const rows = data.map(item => headers.map(h => `"${item[h.key] ?? ''}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.map(h => h.label).join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* Compact Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-black text-[9px] uppercase tracking-wider border border-cyan-500/30">
                HR FMS • Analytics
              </span>
              <h1 className="text-base font-extrabold tracking-tight">
                HR Intelligence & Analytics Reports
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">End-to-end recruitment funnel, departmental headcount and operational insights</p>
          </div>
        </div>
      </div>

      {/* Recruitment Funnel Visual */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              End-to-End Talent Acquisition Pipeline Funnel
            </h2>
            <p className="text-xs text-slate-400">
              Stages 1 through 7 conversion progression
            </p>
          </div>
          <button
            onClick={() => exportDataset('Recruitment_Funnel', funnel, [{ label: 'Stage', key: 'stage' }, { label: 'Count', key: 'count' }])}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span>Export Funnel</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {funnel.map((step, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Step {idx + 1}</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{step.stage}</p>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">{step.count}</div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full ${step.color}`}
                  style={{ width: `${Math.min(100, Math.max(15, (step.count / (indents.length || 1)) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: Department Breakdown & Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Department Headcount */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Headcount by Department
            </h2>
            <Building className="w-4 h-4 text-cyan-500" />
          </div>

          <div className="space-y-3">
            {Object.entries(deptCounts).map(([dept, count]) => {
              const pct = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{dept}</span>
                    <span className="font-mono">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Data Sheets Portal */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Export Comprehensive Audit Data
            </h2>
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Active Employee Master List</p>
                <p className="text-[11px] text-slate-400">{employees.length} records including CTC, bank & DOJ</p>
              </div>
              <button
                onClick={() => exportDataset('Active_Employees_Master', employees, [
                  { label: 'Emp ID', key: 'employeeId' },
                  { label: 'Name', key: 'name' },
                  { label: 'Department', key: 'department' },
                  { label: 'Designation', key: 'designation' },
                  { label: 'Joining Date', key: 'joiningDate' },
                  { label: 'Salary', key: 'salary' }
                ])}
                className="p-2 text-cyan-600 hover:text-cyan-700 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Payroll Register Sheet</p>
                <p className="text-[11px] text-slate-400">{payroll.length} processed pay vouchers</p>
              </div>
              <button
                onClick={() => exportDataset('Payroll_Register_Full', payroll, [
                  { label: 'Emp ID', key: 'employeeId' },
                  { label: 'Name', key: 'employeeName' },
                  { label: 'Month', key: 'month' },
                  { label: 'Gross', key: 'grossSalary' },
                  { label: 'Net', key: 'netSalary' },
                  { label: 'Status', key: 'status' }
                ])}
                className="p-2 text-cyan-600 hover:text-cyan-700 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Candidate Recruitment Log</p>
                <p className="text-[11px] text-slate-400">{candidates.length} candidates evaluated</p>
              </div>
              <button
                onClick={() => exportDataset('Candidates_Screening_Register', candidates, [
                  { label: 'Candidate ID', key: 'candidateId' },
                  { label: 'Name', key: 'name' },
                  { label: 'Designation', key: 'designation' },
                  { label: 'Experience', key: 'experience' },
                  { label: 'Status', key: 'screeningStatus' }
                ])}
                className="p-2 text-cyan-600 hover:text-cyan-700 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
