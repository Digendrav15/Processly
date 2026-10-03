import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Calendar,
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  Building,
  User,
  Eye,
  FileSpreadsheet,
  Receipt,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  addActivityLog
} from '../../services/hrStorageService';

export function HRPayrollPage() {
  const { data: payrollList, setItem: setPayrollList } = useHRStorage(HR_KEYS.PAYROLL, []);
  const { data: employees } = useHRStorage(HR_KEYS.EMPLOYEES, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filtered list
  const filteredPayroll = useMemo(() => {
    return payrollList.filter(item => {
      const matchesSearch =
        (item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.department?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesMonth = !selectedMonth || item.month === selectedMonth;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [payrollList, searchTerm, selectedMonth, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalGross = filteredPayroll.reduce((sum, p) => sum + (Number(p.grossSalary) || 0), 0);
    const totalDeductions = filteredPayroll.reduce((sum, p) => sum + (Number(p.totalDeductions) || 0), 0);
    const totalNet = filteredPayroll.reduce((sum, p) => sum + (Number(p.netSalary) || 0), 0);
    const paidCount = filteredPayroll.filter(p => p.status === 'Paid').length;

    return {
      totalEmployees: filteredPayroll.length,
      grossTotal: `₹ ${(totalGross / 100000).toFixed(2)} L`,
      deductionsTotal: `₹ ${(totalDeductions / 1000).toFixed(1)} K`,
      netTotal: `₹ ${(totalNet / 100000).toFixed(2)} L`,
      paidCount: `${paidCount} / ${filteredPayroll.length}`
    };
  }, [filteredPayroll]);

  // Run / Regenerate Monthly Payroll
  const handleRunPayroll = () => {
    const newRegister = employees.map(emp => {
      const monthlyGross = Math.round((Number(emp.salary) || 600000) / 12);
      const basic = Math.round(monthlyGross * 0.50);
      const hra = Math.round(monthlyGross * 0.25);
      const special = monthlyGross - basic - hra;
      const pf = 1800;
      const esi = 0;
      const pt = 200;
      const totalDeductions = pf + esi + pt;
      const net = monthlyGross - totalDeductions;

      return {
        id: `PAY-${emp.employeeId}-${selectedMonth.replace(/\s+/g, '-')}`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.department,
        designation: emp.designation,
        month: selectedMonth,
        daysWorked: 26,
        grossSalary: monthlyGross,
        basicSalary: basic,
        hra: hra,
        specialAllowance: special,
        pfDeduction: pf,
        esiDeduction: esi,
        taxDeduction: pt,
        totalDeductions: totalDeductions,
        netSalary: net,
        status: 'Processed'
      };
    });

    setPayrollList(newRegister);
    addActivityLog('HR Payroll Specialist', 'Processed Monthly Payroll', 'Payroll', selectedMonth, null, 'Processed', `Processed payroll register for ${employees.length} employees`);
  };

  // Disburse / Mark All Paid
  const handleDisburseAll = () => {
    const updated = payrollList.map(p => {
      if (p.month === selectedMonth) {
        return { ...p, status: 'Paid', paymentDate: new Date().toISOString().split('T')[0] };
      }
      return p;
    });

    setPayrollList(updated);
    addActivityLog('Finance Payroll Head', 'Payroll Disbursed', 'Payroll', selectedMonth, 'Processed', 'Paid', `Transferred salaries via direct bank NEFT/RTGS`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Month', 'Gross (₹)', 'Deductions (₹)', 'Net Salary (₹)', 'Status'];
    const rows = filteredPayroll.map(p => [
      p.employeeId,
      `"${p.employeeName}"`,
      `"${p.department}"`,
      `"${p.designation}"`,
      p.month,
      p.grossSalary,
      p.totalDeductions,
      p.netSalary,
      p.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payroll_Register_${selectedMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2.5">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-200 dark:border-cyan-800/80">
            HR FMS • Stage 10
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Payroll Register
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleRunPayroll}
            className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Run</span>
          </button>

          <button
            onClick={handleDisburseAll}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Disburse</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Badges Bar */}
      <div className="hidden lg:flex items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500 dark:text-slate-400">Gross: <strong className="text-slate-900 dark:text-white font-mono">{stats.grossTotal}</strong></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-rose-500">Deductions: <strong className="font-mono">{stats.deductionsTotal}</strong></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-emerald-500">Net Disbursed: <strong className="font-mono">{stats.netTotal}</strong></span>
        </div>
        <div>
          <span className="text-cyan-600 dark:text-cyan-400">Paid Count: <strong>{stats.paidCount}</strong></span>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name, ID or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-bold"
        >
          <option value="September 2026">September 2026</option>
          <option value="August 2026">August 2026</option>
          <option value="July 2026">July 2026</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Processed">Processed</option>
        </select>
      </div>

      {/* Payroll High Density Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 px-3">Emp ID</th>
                <th className="py-2 px-3">Employee Details</th>
                <th className="py-2 px-3">Gross Salary</th>
                <th className="py-2 px-3">Basic Pay</th>
                <th className="py-2 px-3">HRA & Special</th>
                <th className="py-2 px-3">Deductions</th>
                <th className="py-2 px-3">Net Salary</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <p className="font-semibold">No payroll records for this period</p>
                    <p className="text-[11px] text-slate-500 mt-1">Click &quot;Run Payroll&quot; to generate register</p>
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((pay) => (
                  <tr
                    key={pay.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Emp ID */}
                    <td className="py-1.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">
                      {pay.employeeId}
                    </td>

                    {/* Employee */}
                    <td className="py-1.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white text-[11.5px]">
                        {pay.employeeName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {pay.designation} • {pay.department}
                      </div>
                    </td>

                    {/* Gross */}
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      ₹ {Number(pay.grossSalary || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Basic */}
                    <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      ₹ {Number(pay.basicSalary || 0).toLocaleString('en-IN')}
                    </td>

                    {/* HRA & Special */}
                    <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      ₹ {(Number(pay.hra || 0) + Number(pay.specialAllowance || 0)).toLocaleString('en-IN')}
                    </td>

                    {/* Deductions */}
                    <td className="py-1.5 px-3 font-mono text-rose-500 text-[11px]">
                      - ₹ {Number(pay.totalDeductions || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Net Pay */}
                    <td className="py-1.5 px-3 font-mono font-black text-emerald-600 dark:text-emerald-400 text-[11px]">
                      ₹ {Number(pay.netSalary || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                          pay.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {pay.status === 'Paid' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {pay.status || 'Processed'}
                      </span>
                    </td>

                    {/* Payslip Link */}
                    <td className="py-1.5 px-3 text-right">
                      <Link
                        to={`/hr/payslips?empId=${pay.employeeId}&month=${encodeURIComponent(pay.month)}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 rounded text-[11px] font-bold transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Payslip</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
