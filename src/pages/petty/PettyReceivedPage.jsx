import React, { useState, useEffect, useMemo } from 'react';
import {
  getTransactions,
  getPettySummary,
  initPettyData,
  deleteTransaction
} from '../../services/pettyStorageService';
import { ReceiptModal } from '../../components/petty/ReceiptModal';
import { VoucherReceiptModal } from '../../components/petty/VoucherReceiptModal';
import {
  ArrowDownLeft,
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
  RefreshCw
} from 'lucide-react';

export function PettyReceivedPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [viewingVoucher, setViewingVoucher] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = () => {
    initPettyData();
    const all = getTransactions();
    const incomingOnly = all.filter((t) => t.type === 'incoming');
    setTransactions(incomingOnly);
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
  }, [transactions, modeFilter, startDate, endDate, searchQuery]);

  const totalFilteredAmount = useMemo(() => {
    return filtered.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filtered]);

  // Breakdown by mode
  const cashTotal = useMemo(() => {
    return transactions.filter((t) => t.paymentMode === 'Cash').reduce((s, t) => s + Number(t.amount), 0);
  }, [transactions]);

  const chequeTotal = useMemo(() => {
    return transactions.filter((t) => t.paymentMode === 'Cheque').reduce((s, t) => s + Number(t.amount), 0);
  }, [transactions]);

  const onlineTotal = useMemo(() => {
    return transactions.filter((t) => t.paymentMode === 'Online / UPI' || t.paymentMode === 'Bank Transfer').reduce((s, t) => s + Number(t.amount), 0);
  }, [transactions]);

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            Petty System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Amount Received (Inflow)</h1>
        </div>

        <button
          onClick={() => setShowReceiptModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>+ Record Received</span>
        </button>
      </div>

      {/* 3 Metric Cards Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cash Inflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cash Received</span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{cashTotal.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Physical currency received into office safe</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        {/* Cheques Cleared Inflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cheques Cleared Inflow</span>
            <h3 className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
              ₹{chequeTotal.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
              Auto-credited from Cheque Tracker
            </p>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* Online / UPI / Bank Transfer Inflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Online / UPI Inflow</span>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              ₹{onlineTotal.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Digital bank & UPI receipts</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipts by party, voucher #, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-hidden"
            >
              <option value="ALL">All Payment Modes</option>
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
                <th className="px-4 py-3">Receipt Voucher #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Received From (Payer)</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Payment Mode</th>
                <th className="px-4 py-3">Received By</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <p className="text-xs font-semibold">No amount received records found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {r.voucherNo}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {r.partyName}
                      {r.description && (
                        <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[200px]">
                          {r.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.paymentMode === 'Cheque'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {r.paymentMode === 'Cheque' ? '🏦 Cheque Cleared' : r.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {r.receivedBy || 'Staff'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-sm">
                      +₹{Number(r.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setViewingVoucher(r)}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Print Receipt Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this received entry?')) {
                              deleteTransaction(r.id);
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
            Showing {filtered.length} receipt records
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Filtered Total: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">₹{totalFilteredAmount.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      {/* Modals */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
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
