import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Printer,
  Calendar,
  User,
  Building,
  DollarSign,
  Download,
  CreditCard,
  Award,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHRStorage } from '../../hooks/useHRStorage';
import { HR_KEYS } from '../../services/hrStorageService';

export function HRPayslipsPage() {
  const [searchParams] = useSearchParams();
  const initialEmpId = searchParams.get('empId') || '';
  const initialMonth = searchParams.get('month') || 'September 2026';

  const { data: payrollList } = useHRStorage(HR_KEYS.PAYROLL, []);
  const { data: employees } = useHRStorage(HR_KEYS.EMPLOYEES, []);

  const [selectedEmpId, setSelectedEmpId] = useState(initialEmpId);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  useEffect(() => {
    if (initialEmpId) setSelectedEmpId(initialEmpId);
    if (initialMonth) setSelectedMonth(initialMonth);
  }, [initialEmpId, initialMonth]);

  // Default to first employee if none selected
  useEffect(() => {
    if (!selectedEmpId && employees.length > 0) {
      setSelectedEmpId(employees[0].employeeId);
    }
  }, [employees, selectedEmpId]);

  // Find payroll record or derive from employee
  const currentPay = useMemo(() => {
    const found = payrollList.find(
      p => p.employeeId === selectedEmpId && (!selectedMonth || p.month === selectedMonth)
    );
    if (found) return found;

    // Fallback: derive from employee record
    const emp = employees.find(e => e.employeeId === selectedEmpId);
    if (emp) {
      const gross = Math.round((Number(emp.salary) || 600000) / 12);
      const basic = Math.round(gross * 0.50);
      const hra = Math.round(gross * 0.25);
      const special = gross - basic - hra;
      const pf = 1800;
      const pt = 200;
      const totalDeductions = pf + pt;
      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.department,
        designation: emp.designation,
        month: selectedMonth,
        daysWorked: 26,
        grossSalary: gross,
        basicSalary: basic,
        hra: hra,
        specialAllowance: special,
        pfDeduction: pf,
        esiDeduction: 0,
        taxDeduction: pt,
        totalDeductions: totalDeductions,
        netSalary: gross - totalDeductions,
        status: 'Processed'
      };
    }
    return null;
  }, [payrollList, employees, selectedEmpId, selectedMonth]);

  const currentEmp = useMemo(() => {
    return employees.find(e => e.employeeId === selectedEmpId) || {};
  }, [employees, selectedEmpId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Controls (Screen only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/hr/payroll"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-md shadow-cyan-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Employee Salary Slip
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official statement of earnings, statutory withholdings and net bank transfer
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Employee Selector */}
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {employees.map(e => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.name} ({e.employeeId})
              </option>
            ))}
          </select>

          {/* Month Selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="September 2026">September 2026</option>
            <option value="August 2026">August 2026</option>
            <option value="July 2026">July 2026</option>
          </select>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-black rounded-xl text-xs font-bold shadow-md shadow-slate-900/20 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Payslip</span>
          </button>
        </div>
      </div>

      {/* Corporate Printable Payslip Container */}
      {currentPay ? (
        <div className="bg-white text-slate-900 rounded-3xl border border-slate-300 p-8 shadow-xl space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Letterhead Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">TASKFLOW ENTERPRISES PVT. LTD.</h2>
              <p className="text-xs text-slate-500">Corporate Tower, Tech Park Phase 2, Bangalore - 560100</p>
              <p className="text-xs text-slate-500">CIN: U72200KA2024PTC123456 • payroll@taskflow.os</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider bg-cyan-50 px-2 py-1 rounded">
                PAYSLIP FOR {currentPay.month.toUpperCase()}
              </span>
              <p className="text-xs text-slate-500 mt-2 font-mono">Disbursed via Direct Bank Transfer</p>
            </div>
          </div>

          {/* Employee Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Employee ID</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{currentPay.employeeId}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Employee Name</span>
              <p className="font-bold text-slate-900 mt-0.5">{currentPay.employeeName}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Designation</span>
              <p className="font-semibold text-slate-800 mt-0.5">{currentPay.designation}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Department</span>
              <p className="font-semibold text-slate-800 mt-0.5">{currentPay.department}</p>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Bank Name</span>
              <p className="font-medium text-slate-800 mt-0.5">{currentEmp.bankDetails?.bankName || 'HDFC Bank'}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Bank A/C No.</span>
              <p className="font-mono font-medium text-slate-800 mt-0.5">{currentEmp.bankDetails?.accountNumber || '••••4567'}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">PAN Number</span>
              <p className="font-mono font-medium text-slate-800 mt-0.5">{currentEmp.bankDetails?.pan || 'ABCDE1234F'}</p>
            </div>
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px]">Days Worked / Paid</span>
              <p className="font-bold text-slate-900 mt-0.5">{currentPay.daysWorked || 26} / 26 Days</p>
            </div>
          </div>

          {/* Earnings vs Deductions Comparative Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <div className="p-3 border-r border-slate-200 flex justify-between">
                <span>Earnings Description</span>
                <span>Amount (₹)</span>
              </div>
              <div className="p-3 flex justify-between">
                <span>Deductions Description</span>
                <span>Amount (₹)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200">
              {/* Earnings Column */}
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Basic Salary (50%)</span>
                  <span className="font-mono font-medium">₹ {Number(currentPay.basicSalary || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>House Rent Allowance (HRA)</span>
                  <span className="font-mono font-medium">₹ {Number(currentPay.hra || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Special & Flexible Allowance</span>
                  <span className="font-mono font-medium">₹ {Number(currentPay.specialAllowance || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Conveyance / Travel</span>
                  <span className="font-mono font-medium">₹ 0</span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-rose-600">
                  <span>Provident Fund (PF - Employee)</span>
                  <span className="font-mono font-medium">₹ {Number(currentPay.pfDeduction || 1800).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>ESI / Medical Health</span>
                  <span className="font-mono font-medium">₹ {Number(currentPay.esiDeduction || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Professional Tax (PT)</span>
                  <span className="font-mono font-medium">₹ {Number(currentPay.taxDeduction || 200).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Income Tax / TDS</span>
                  <span className="font-mono font-medium">₹ 0</span>
                </div>
              </div>
            </div>

            {/* Subtotals */}
            <div className="grid grid-cols-2 divide-x divide-slate-200 bg-slate-50 border-t border-slate-200 font-bold">
              <div className="p-3 flex justify-between text-slate-900">
                <span>Total Gross Earnings</span>
                <span className="font-mono">₹ {Number(currentPay.grossSalary || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 flex justify-between text-rose-600">
                <span>Total Deductions</span>
                <span className="font-mono">- ₹ {Number(currentPay.totalDeductions || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight Box */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                Net Salary Transferred to Bank Account
              </span>
              <p className="text-xs text-emerald-700 mt-0.5">
                Mode: NEFT / Direct Payroll Batch
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono font-black text-2xl text-emerald-800">
                ₹ {Number(currentPay.netSalary || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Signatures & Corporate Stamp */}
          <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900">TaskFlow Enterprises Pvt. Ltd.</p>
              <div className="h-10"></div>
              <p className="font-bold text-slate-700">Authorized Payroll Manager</p>
              <p className="text-[10px] text-slate-400">Finance & People Operations</p>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-900">Employee Acknowledgement</p>
              <div className="h-10"></div>
              <p className="font-bold text-slate-700">{currentPay.employeeName}</p>
              <p className="text-[10px] text-slate-400">System Generated Payslip (No physical signature required)</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p>Please select an employee and month to preview payslip</p>
        </div>
      )}
    </div>
  );
}
