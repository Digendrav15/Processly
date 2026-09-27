import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  DollarSign,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  TrendingUp,
  Receipt
} from 'lucide-react';
import {
  getDocSubData,
  DOC_SUB_KEYS,
  getSubscriptions,
  formatDate
} from '../../services/docSubStorageService';
import RecordPaymentModal from '../../components/docSub/RecordPaymentModal';

export default function PaymentTrackingPage() {
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('All');
  const [showRecordModal, setShowRecordModal] = useState(false);

  const loadData = () => {
    setPayments(getDocSubData(DOC_SUB_KEYS.PAYMENTS, []));
    setSubscriptions(getSubscriptions());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('docsub_storage_update', handleUpdate);
    return () => window.removeEventListener('docsub_storage_update', handleUpdate);
  }, []);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (selectedMode !== 'All' && p.paymentMode !== selectedMode) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchService = p.serviceName?.toLowerCase().includes(q);
        const matchInv = p.invoiceNumber?.toLowerCase().includes(q);
        const matchRef = p.transactionRef?.toLowerCase().includes(q);
        const matchPaidBy = p.paidBy?.toLowerCase().includes(q);
        return matchService || matchInv || matchRef || matchPaidBy;
      }

      return true;
    });
  }, [payments, selectedMode, searchQuery]);

  // Aggregate stats
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const paymentDueCount = subscriptions.filter(
    (s) => s.paymentStatus === 'Payment Due' || s.paymentStatus === 'Overdue'
  ).length;

  const annualCommitment = subscriptions.reduce((sum, s) => {
    const amt = Number(s.amount) || 0;
    return s.billingCycle === 'Monthly' ? sum + amt * 12 : sum + amt;
  }, 0);

  const handleExportCSV = () => {
    const headers = [
      'Payment ID',
      'Service Name',
      'Amount (INR)',
      'Payment Date',
      'Invoice Number',
      'Payment Mode',
      'Transaction Ref',
      'Period Covered',
      'Paid By',
      'Remarks'
    ];

    const rows = filteredPayments.map((p) => [
      p.id,
      `"${p.serviceName.replace(/"/g, '""')}"`,
      p.amount,
      p.paymentDate,
      `"${p.invoiceNumber || ''}"`,
      `"${p.paymentMode}"`,
      `"${p.transactionRef || ''}"`,
      `"${p.periodCovered || ''}"`,
      `"${p.paidBy || ''}"`,
      `"${(p.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payments_tracking_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            Subscription Payment Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Settlement ledger for SaaS tools, cloud infrastructure invoices, and payment receipts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Ledger
          </button>
          <button
            onClick={() => setShowRecordModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Invoices Settled
            </span>
            <Receipt className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{totalPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 mt-1">Across {payments.length} transactions</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Annual SaaS Run-Rate
            </span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{annualCommitment.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Approx. ₹{Math.round(annualCommitment / 12).toLocaleString('en-IN')}/month
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payments Pending Settlement
            </span>
            <CreditCard className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">
            {paymentDueCount} Subscriptions
          </p>
          <p className="text-xs text-slate-400 mt-1">Requires approval or payment transfer</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search service, invoice #, UTR ref..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="All">All Payment Modes</option>
            <option value="Corporate Credit Card">Corporate Credit Card</option>
            <option value="Auto-Debit Net Banking">Auto-Debit Net Banking</option>
            <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Bank Transfer</option>
            <option value="UPI / QR Code">UPI / QR Code</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filteredPayments.length}</strong> payments
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No payments recorded yet
          </h3>
          <p className="text-xs text-slate-400">
            Click 'Record Payment' to record a subscription invoice settlement.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Payment ID</th>
                  <th className="px-4 py-3.5">Service / Tool</th>
                  <th className="px-4 py-3.5">Amount (₹)</th>
                  <th className="px-4 py-3.5">Date Paid</th>
                  <th className="px-4 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Payment Mode & Ref</th>
                  <th className="px-4 py-3.5">Period</th>
                  <th className="px-4 py-3.5">Paid By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-600 dark:text-slate-400">
                      {p.id}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      {p.serviceName}
                    </td>

                    <td className="px-4 py-3.5 font-black text-emerald-600 dark:text-emerald-400">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>

                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                      {formatDate(p.paymentDate)}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                      {p.invoiceNumber || '—'}
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{p.paymentMode}</p>
                      {p.transactionRef && (
                        <p className="text-[11px] font-mono text-slate-400">{p.transactionRef}</p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {p.periodCovered || '1 Month'}
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {p.paidBy || 'Administrator'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
