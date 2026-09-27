import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { OUTGOING_CATEGORIES, PAYMENT_MODES, saveTransaction, saveCheque } from '../../services/pettyStorageService';
import { ArrowUpRight, Calendar, DollarSign, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function ExpenseModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    amount: initialData?.amount || '',
    category: initialData?.category || OUTGOING_CATEGORIES[0],
    paymentMode: initialData?.paymentMode || 'Cash',
    partyName: initialData?.partyName || '',
    paidBy: initialData?.paidBy || 'Staff Member',
    billRef: initialData?.billRef || '',
    description: initialData?.description || '',
    // Cheque specific fields if mode is Cheque
    chequeNo: '',
    bankName: 'HDFC Bank - Current A/C #9482',
    chequeDate: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }
    if (!formData.partyName.trim()) {
      setError('Please specify the payee / vendor to whom payment was made.');
      return;
    }

    if (formData.paymentMode === 'Cheque') {
      if (!formData.chequeNo.trim()) {
        setError('Please enter the 6-digit Issued Cheque Number.');
        return;
      }

      // Record as issued cheque in Cheque Tracker
      saveCheque({
        chequeNo: formData.chequeNo.trim(),
        type: 'issued',
        partyName: formData.partyName.trim(),
        bankName: formData.bankName.trim() || 'HDFC Bank - Current A/C #9482',
        branchName: 'Main Branch',
        amount: Number(formData.amount),
        chequeDate: formData.chequeDate,
        category: formData.category,
        depositStatus: 'Presented',
        clearanceStatus: 'Pending',
        remarks: formData.description || `Cheque issued to ${formData.partyName} for ${formData.category}`
      });
    } else {
      // Direct Cash, UPI, or Bank Transfer
      saveTransaction({
        ...(initialData?.id ? { id: initialData.id } : {}),
        type: 'outgoing',
        date: formData.date,
        amount: Number(formData.amount),
        category: formData.category,
        paymentMode: formData.paymentMode,
        partyName: formData.partyName.trim(),
        paidBy: formData.paidBy.trim(),
        billRef: formData.billRef.trim(),
        description: formData.description.trim() || `${formData.category} paid to ${formData.partyName}`,
        status: 'Completed'
      });
    }

    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Outgoing Expense" : "Record Expense (Outgoings / Payment)"} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expense Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expense Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 font-bold text-slate-400 text-xs">₹</span>
              <input
                type="number"
                required
                min="1"
                step="any"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expense Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
            >
              {OUTGOING_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Mode *
            </label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Cheque Fields if Payment Mode is Cheque */}
        {formData.paymentMode === 'Cheque' && (
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Issued Cheque Tracker Entry</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
              This issued cheque will be registered in the <strong>Cheque Tracker</strong>. Once it clears / debits from the bank account, it will automatically reflect as an Outgoing expense transaction.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issued Cheque Number (6 Digits) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 109402"
                  maxLength={6}
                  value={formData.chequeNo}
                  onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company Bank Account *
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cheque Date
                </label>
                <input
                  type="date"
                  value={formData.chequeDate}
                  onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Paid To (Vendor / Person / Store) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Chai Point, Stationers, Courier Boy"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Paid By / Claimed By (Staff)
            </label>
            <input
              type="text"
              placeholder="e.g. Sunil Verma / Office Boy"
              value={formData.paidBy}
              onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Bill / Invoice / Cash Memo Ref #
          </label>
          <input
            type="text"
            placeholder="e.g. BILL-99201 or CASH-MEMO-44"
            value={formData.billRef}
            onChange={(e) => setFormData({ ...formData, billRef: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Purpose & Details
          </label>
          <textarea
            rows={2}
            placeholder="Itemized items or justification for this petty expenditure..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Record Outgoing Expense</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
