import React, { useState, useEffect, useMemo } from 'react';
import {
  getTransactions,
  getCheques,
  getPettySummary,
  initPettyData,
  OUTGOING_CATEGORIES,
  INCOMING_CATEGORIES
} from '../../services/pettyStorageService';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  TrendingUp,
  PieChart as PieIcon,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

const COLORS = ['#0d9488', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#6366f1', '#64748b'];

export function PettyReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [summary, setSummary] = useState(null);

  const [dateRange, setDateRange] = useState('ALL'); // 'ALL', '30D', '90D'

  const loadData = () => {
    initPettyData();
    setTransactions(getTransactions());
    setCheques(getCheques());
    setSummary(getPettySummary());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('petty_storage_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('petty_storage_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Category distribution for pie chart
  const categoryData = useMemo(() => {
    const expenseTxns = transactions.filter((t) => t.type === 'outgoing');
    const counts = {};

    expenseTxns.forEach((t) => {
      const cat = t.category || 'Other';
      counts[cat] = (counts[cat] || 0) + (Number(t.amount) || 0);
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Mode distribution
  const modeData = useMemo(() => {
    const counts = { Cash: 0, 'Online / UPI': 0, 'Bank Transfer': 0, Cheque: 0 };
    transactions.forEach((t) => {
      if (counts[t.paymentMode] !== undefined) {
        counts[t.paymentMode] += Number(t.amount) || 0;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Daily cashflow trend
  const dailyCashflowData = useMemo(() => {
    const dayMap = {};

    transactions.forEach((t) => {
      if (!dayMap[t.date]) {
        dayMap[t.date] = { date: t.date, in: 0, out: 0 };
      }
      if (t.type === 'incoming') {
        dayMap[t.date].in += Number(t.amount) || 0;
      } else {
        dayMap[t.date].out += Number(t.amount) || 0;
      }
    });

    return Object.values(dayMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [transactions]);

  // Export to Excel function using XLSX
  const exportToExcel = () => {
    try {
      // 1. Transactions Sheet
      const txnRows = transactions.map((t) => ({
        'Voucher No': t.voucherNo,
        'Type': t.type === 'incoming' ? 'Received (In)' : 'Expense (Out)',
        'Date': t.date,
        'Amount (₹)': Number(t.amount),
        'Payment Mode': t.paymentMode,
        'Category': t.category,
        'Party / Beneficiary': t.partyName,
        'Staff / Handler': t.paidBy || t.receivedBy || '',
        'Bill / Ref No': t.billRef || '',
        'Description': t.description || '',
        'Linked Cheque': t.chequeRefId ? `Yes (#${t.chequeRefId})` : 'No',
        'Status': t.status
      }));

      // 2. Cheques Sheet
      const chqRows = cheques.map((c) => ({
        'Cheque ID': c.id,
        'Cheque No': c.chequeNo,
        'Type': c.type === 'received' ? 'Received Cheque (In)' : 'Issued Cheque (Out)',
        'Party Name': c.partyName,
        'Amount (₹)': Number(c.amount),
        'Cheque Date': c.chequeDate,
        'Bank Name': c.bankName,
        'Branch': c.branchName || '',
        'Category': c.category || '',
        'Deposit Status': c.depositStatus,
        'Deposit Date': c.depositDate || '',
        'Deposit Bank': c.depositBank || '',
        'Clearance Status': c.clearanceStatus,
        'Clearance Date': c.clearanceDate || '',
        'UTR / Ref': c.utrRef || '',
        'Bounce Reason': c.bounceReason || '',
        'Linked Ledger Txn': c.linkedTransactionId || 'None',
        'Remarks': c.remarks || ''
      }));

      const wb = XLSX.utils.book_new();
      const wsTxns = XLSX.utils.json_to_sheet(txnRows);
      const wsChqs = XLSX.utils.json_to_sheet(chqRows);

      XLSX.utils.book_append_sheet(wb, wsTxns, 'Petty Cashbook Ledger');
      XLSX.utils.book_append_sheet(wb, wsChqs, 'Cheque Register & Tracker');

      XLSX.writeFile(wb, `Petty_Expenses_Statement_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Failed to export to Excel:', err);
      alert('Error generating Excel file. Please try again.');
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-extrabold text-[10px] uppercase tracking-wider border border-teal-200 dark:border-teal-800/80">
            Petty System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Petty Expenses Reports & Analytics</h1>
        </div>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Excel (.xlsx)</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Cashflow Inflow vs Outflow Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Cashflow Timeline: Inflow vs Outflow</span>
              </h3>
              <p className="text-[11px] text-slate-500">Daily movement of petty receipts and expenses</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Inflow
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Outflow
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyCashflowData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: 'none'
                  }}
                />
                <Area type="monotone" dataKey="in" name="Received" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="out" name="Outgoings" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expense Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Expense Category Distribution</span>
              </h3>
              <p className="text-[11px] text-slate-500">Breakdown of disbursements by head of expense</p>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Total: ₹{(summary?.totalOutgoings || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: 'none'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cheque Management Health Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-teal-600" />
              <span>Cheque Portfolio & Clearance Rate</span>
            </h3>
            <p className="text-[11px] text-slate-500">Status of received and issued cheques registered in the system</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Registered</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {summary?.totalChequesCount || 0} Cheques
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Inflow & Outflow</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">Pending Deposit</span>
            <div className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1">
              ₹{(summary?.undepositedAmount || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
              {summary?.undepositedCount || 0} In-Hand
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Successfully Cleared</span>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              ₹{((summary?.clearedReceivedAmount || 0) + (summary?.clearedIssuedAmount || 0)).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
              100% Tracked to Cashbook
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80">
            <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Dishonored / Bounced</span>
            <div className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1">
              ₹{(summary?.bouncedAmount || 0).toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block">
              {summary?.bouncedCount || 0} Bounced Cheques
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
