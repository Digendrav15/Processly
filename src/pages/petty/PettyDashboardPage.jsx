import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTransactions,
  getCheques,
  getPettySummary,
  initPettyData,
  deleteTransaction
} from '../../services/pettyStorageService';
import { ReceiptModal } from '../../components/petty/ReceiptModal';
import { ExpenseModal } from '../../components/petty/ExpenseModal';
import { ChequeModal } from '../../components/petty/ChequeModal';
import { VoucherReceiptModal } from '../../components/petty/VoucherReceiptModal';
import { ChequeLeafModal } from '../../components/petty/ChequeLeafModal';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Plus,
  Search,
  Filter,
  Calendar,
  FileText,
  Printer,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  DollarSign
} from 'lucide-react';

export function PettyDashboardPage() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [summary, setSummary] = useState(null);

  // Modals state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState(null);
  const [viewingCheque, setViewingCheque] = useState(null);

  // Filter state
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'incoming', 'outgoing', 'cheques'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = () => {
    initPettyData();
    const txns = getTransactions();
    const chqs = getCheques();
    const sum = getPettySummary();
    setTransactions(txns);
    setCheques(chqs);
    setSummary(sum);
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

  // Filtered transactions for the Ledger
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Tab filter
      if (activeTab === 'incoming' && t.type !== 'incoming') return false;
      if (activeTab === 'outgoing' && t.type !== 'outgoing') return false;
      if (activeTab === 'cheques' && t.paymentMode !== 'Cheque') return false;

      // Category filter
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      // Mode filter
      if (paymentModeFilter !== 'ALL' && t.paymentMode !== paymentModeFilter) return false;

      // Date range filter
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const partyMatch = t.partyName?.toLowerCase().includes(q);
        const voucherMatch = t.voucherNo?.toLowerCase().includes(q);
        const descMatch = t.description?.toLowerCase().includes(q);
        const catMatch = t.category?.toLowerCase().includes(q);
        if (!partyMatch && !voucherMatch && !descMatch && !catMatch) return false;
      }

      return true;
    });
  }, [transactions, activeTab, categoryFilter, paymentModeFilter, startDate, endDate, searchQuery]);

  // Compute Running Balance for all transactions (chronological order)
  const transactionsWithRunningBalance = useMemo(() => {
    // Sort transactions oldest to newest to compute running balance
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    const withBal = sorted.map((t) => {
      if (t.type === 'incoming') {
        running += Number(t.amount) || 0;
      } else {
        running -= Number(t.amount) || 0;
      }
      return { ...t, runningBalance: running };
    });
    // Return newest first for display
    return withBal.reverse();
  }, [filteredTransactions]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this ledger entry?')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 border border-teal-800/40 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 via-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/25 shrink-0">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">Petty Expenses & Cashbook</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-extrabold uppercase border border-teal-500/30">
                Cash, Outgoings & Cheques
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Petty Cash Receipts, Expenses & Cheque Lifecycle Management with Automatic Ledger Synchronization
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReceiptModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/30 cursor-pointer active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Amount Received</span>
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => setShowChequeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Landmark className="w-4 h-4 text-teal-400" />
            <span>New Cheque</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Grand KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Live Net Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Net Petty Cash Balance</span>
            <h3
              className={`text-2xl font-black mt-1 ${
                (summary?.netBalance || 0) >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              ₹{(summary?.netBalance || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Cash In Hand: <strong>₹{(summary?.cashInHand || 0).toLocaleString('en-IN')}</strong>
            </p>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Received (Inflow) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Amount Received (In)</span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{(summary?.totalReceived || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" /> {summary?.incomingCount || 0} Inflow Receipts
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Outgoings (Expenses) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Expenses (Outgoings)</span>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              ₹{(summary?.totalOutgoings || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> {summary?.outgoingCount || 0} Expense Payments
            </p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Cheques Pipeline Tracker */}
        <div
          onClick={() => navigate('/petty-expenses/cheques')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between cursor-pointer hover:border-teal-400 dark:hover:border-teal-600 transition-all group"
        >
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cheques In-Hand / Clearing</span>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              ₹{((summary?.undepositedAmount || 0) + (summary?.inClearingReceivedAmount || 0)).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {summary?.undepositedCount || 0} In-Hand • {summary?.inClearingReceivedCount || 0} in Clearing
              </span>
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-105 transition-transform">
            <Landmark className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Cheque Action Alerts Banner if any cheques need attention */}
      {((summary?.undepositedCount || 0) > 0 || (summary?.inClearingReceivedCount || 0) > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-indigo-500/10 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cheque Tracker Pending Actions</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white">
                  {(summary?.undepositedCount || 0) + (summary?.inClearingReceivedCount || 0)} Action Items
                </span>
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {summary?.undepositedCount > 0 && (
                  <span className="mr-3">
                    🟡 <strong>{summary.undepositedCount} Received Cheques</strong> (₹{summary.undepositedAmount.toLocaleString('en-IN')}) are waiting to be deposited into bank.
                  </span>
                )}
                {summary?.inClearingReceivedCount > 0 && (
                  <span>
                    🔵 <strong>{summary.inClearingReceivedCount} Cheques</strong> (₹{summary.inClearingReceivedAmount.toLocaleString('en-IN')}) are in clearing. Once cleared, they will auto-credit to Received (In)!
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/petty-expenses/cheques')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <span>Open Cheque Tracker</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Ledger Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Navigation Tabs & Search / Filter Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Entries ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'incoming'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Amount Received (In)
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'outgoing'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Outgoings / Expenses (Out)
            </button>
            <button
              onClick={() => setActiveTab('cheques')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cheques'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cheque Settlements
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search party, voucher #, note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-hidden"
            >
              <option value="ALL">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Online / UPI">Online / UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>

            <div className="flex items-center space-x-1 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-hidden"
                title="From Date"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-hidden"
                title="To Date"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Voucher #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Party / Beneficiary</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3 text-right">Inflow (₹)</th>
                <th className="px-4 py-3 text-right">Outflow (₹)</th>
                <th className="px-4 py-3 text-right">Running Balance (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {transactionsWithRunningBalance.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-semibold">No petty transactions found matching your filter criteria.</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCategoryFilter('ALL');
                          setPaymentModeFilter('ALL');
                          setStartDate('');
                          setEndDate('');
                          setActiveTab('all');
                        }}
                        className="text-xs text-teal-600 hover:underline font-bold"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactionsWithRunningBalance.map((t) => {
                  const isIncoming = t.type === 'incoming';
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {t.voucherNo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {t.date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isIncoming
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isIncoming ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isIncoming ? 'Received' : 'Outgoing'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        <div className="truncate max-w-[200px]" title={t.partyName}>
                          {t.partyName}
                        </div>
                        {t.description && (
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-[220px]" title={t.description}>
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {t.category}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.paymentMode === 'Cheque'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {t.paymentMode === 'Cheque' && '🏦 '}
                          {t.paymentMode}
                        </span>
                        {t.chequeRefId && (
                          <button
                            onClick={() => {
                              const chq = cheques.find((c) => c.id === t.chequeRefId);
                              if (chq) setViewingCheque(chq);
                              else navigate('/petty-expenses/cheques');
                            }}
                            className="block text-[9px] text-teal-600 dark:text-teal-400 hover:underline font-bold mt-0.5"
                          >
                            View Cheque ↗
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {isIncoming ? `+₹${Number(t.amount).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {!isIncoming ? `-₹${Number(t.amount).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                        ₹{(t.runningBalance || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setViewingVoucher(t)}
                            className="p-1 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View / Print Voucher Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onSuccess={loadData}
      />
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={loadData}
      />
      <ChequeModal
        isOpen={showChequeModal}
        onClose={() => setShowChequeModal(false)}
        onSuccess={loadData}
      />
      <VoucherReceiptModal
        isOpen={!!viewingVoucher}
        onClose={() => setViewingVoucher(null)}
        transaction={viewingVoucher}
      />
      <ChequeLeafModal
        isOpen={!!viewingCheque}
        onClose={() => setViewingCheque(null)}
        cheque={viewingCheque}
      />
    </div>
  );
}
