import React, { useState, useEffect, useMemo } from 'react';
import {
  getTransactions,
  getPettySummary,
  initPettyData,
  deleteTransaction,
  OUTGOING_CATEGORIES
} from '../../services/pettyStorageService';
import { ExpenseModal } from '../../components/petty/ExpenseModal';
import { VoucherReceiptModal } from '../../components/petty/VoucherReceiptModal';
import {
  ArrowUpRight,
  Plus,
  Search,
  Calendar,
  FileText,
  Printer,
  Trash2,
  CheckCircle2,
  DollarSign,
  Landmark,
  CreditCard,
  Banknote,
  Receipt,
  PieChart
} from 'lucide-react';

export function PettyOutgoingsPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = () => {
    initPettyData();
    const all = getTransactions();
    const outgoingOnly = all.filter((t) => t.type === 'outgoing');
    setTransactions(outgoingOnly);
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

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (modeFilter !== 'ALL' && t.paymentMode !== modeFilter) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.partyName?.toLowerCase().includes(q) ||
          t.voucherNo?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, categoryFilter, modeFilter, startDate, endDate, searchQuery]);

  const totalFilteredAmount = useMemo(() => {
    return filtered.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filtered]);

  // Breakdown metrics
  const cashSpent = useMemo(() => {
    return transactions.filter((t) => t.paymentMode === 'Cash').reduce((s, t) => s + Number(t.amount), 0);
  }, [transactions]);

  const chequeSpent = useMemo(() => {
    return transactions.filter((t) => t.paymentMode === 'Cheque').reduce((s, t) => s + Number(t.amount), 0);
  }, [transactions]);

  const digitalSpent = useMemo(() => {
    return transactions.filter((t) => t.paymentMode === 'Online / UPI' || t.paymentMode === 'Bank Transfer').reduce((s, t) => s + Number(t.amount), 0);
  }, [transactions]);

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border border-rose-200 dark:border-rose-800/80">
            Petty System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Expenses & Outgoings (Out)</h1>
        </div>

        <button
          onClick={() => setShowExpenseModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>+ Record Expense</span>
        </button>
      </div>

      {/* 3 Metric Cards Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cash Spent */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cash Expenses</span>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              ₹{cashSpent.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Paid directly from petty cash box</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Cheque Outflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cheques Cleared Outflow</span>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              ₹{chequeSpent.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Auto-debited upon Cheque Clearance
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* UPI / Digital Spent */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Digital & UPI Payments</span>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              ₹{digitalSpent.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Direct scanner & bank payouts</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by vendor, voucher #, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-hidden"
            >
              <option value="ALL">All Categories</option>
              {OUTGOING_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
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
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Expense Voucher #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Paid To (Vendor / Staff)</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Payment Mode</th>
                <th className="px-4 py-3">Bill Ref #</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <p className="text-xs font-semibold">No expense records found matching criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {e.voucherNo}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {e.date}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {e.partyName}
                      {e.description && (
                        <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[200px]">
                          {e.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.paymentMode === 'Cheque'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {e.paymentMode === 'Cheque' ? '🏦 Cheque Cleared' : e.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                      {e.billRef || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 whitespace-nowrap text-sm">
                      -₹{Number(e.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setViewingVoucher(e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Print Payment Voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this expense entry?')) {
                              deleteTransaction(e.id);
                            }
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Entry"
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

        {/* Footer Subtotal */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">
            Showing {filtered.length} expense vouchers
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Filtered Total Outgoings: <strong className="text-rose-600 dark:text-rose-400 font-mono text-sm">₹{totalFilteredAmount.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={loadData}
      />
      <VoucherReceiptModal
        isOpen={!!viewingVoucher}
        onClose={() => setViewingVoucher(null)}
        transaction={viewingVoucher}
      />
    </div>
  );
}
