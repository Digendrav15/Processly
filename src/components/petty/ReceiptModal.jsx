import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { INCOMING_CATEGORIES, PAYMENT_MODES, saveTransaction, saveCheque } from '../../services/pettyStorageService';
import { ArrowDownLeft, Calendar, DollarSign, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function ReceiptModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    amount: initialData?.amount || '',
    category: initialData?.category || INCOMING_CATEGORIES[0],
    paymentMode: initialData?.paymentMode || 'Cash',
    partyName: initialData?.partyName || '',
    receivedBy: initialData?.receivedBy || 'Accounts Cashier',
    billRef: initialData?.billRef || '',
    description: initialData?.description || '',
    // Cheque specific fields if mode is Cheque
    chequeNo: '',
    bankName: '',
    branchName: '',
    chequeDate: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!formData.partyName.trim()) {
      setError('Please specify the party / payer from whom amount was received.');
      return;
    }

    if (formData.paymentMode === 'Cheque') {
      if (!formData.chequeNo.trim()) {
        setError('Please enter the 6-digit Cheque Number.');
        return;
      }
      if (!formData.bankName.trim()) {
        setError('Please enter the Issuing Bank Name.');
        return;
      }

      // Record as received cheque in Cheque Tracker
      saveCheque({
        chequeNo: formData.chequeNo.trim(),
        type: 'received',
        partyName: formData.partyName.trim(),
        bankName: formData.bankName.trim(),
        branchName: formData.branchName.trim() || 'Main Branch',
        amount: Number(formData.amount),
        chequeDate: formData.chequeDate,
        category: formData.category,
        depositStatus: 'Not Deposited',
        clearanceStatus: 'Pending',
        remarks: formData.description || `Cheque received from ${formData.partyName}`
      });
    } else {
      // Direct Cash, UPI, or Bank Transfer
      saveTransaction({
        ...(initialData?.id ? { id: initialData.id } : {}),
        type: 'incoming',
        date: formData.date,
        amount: Number(formData.amount),
        category: formData.category,
        paymentMode: formData.paymentMode,
        partyName: formData.partyName.trim(),
        receivedBy: formData.receivedBy.trim(),
        billRef: formData.billRef.trim(),
        description: formData.description.trim() || `${formData.category} received from ${formData.partyName}`,
        status: 'Completed'
      });
    }

    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Amount Received" : "Record Amount Received (Petty Inflow)"} maxWidth="max-w-xl">
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
              Receipt Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Amount (₹) *
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
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Mode *
            </label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Inflow Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
            >
              {INCOMING_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Cheque Form Fields if Payment Mode is Cheque */}
        {formData.paymentMode === 'Cheque' && (
          <div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 rounded-2xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Cheque Tracker Auto-Registration</span>
            </div>
            <p className="text-[11px] text-teal-700 dark:text-teal-400/90 leading-relaxed">
              This cheque will be registered in the <strong>Cheque Tracker</strong> with status <em>"Not Deposited"</em>. Once you deposit and clear the cheque, it will automatically reflect in your active received cashbook balance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cheque Number (6 Digits) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 581902"
                  maxLength={6}
                  value={formData.chequeNo}
                  onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Issuing Bank Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Branch / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nariman Point, Mumbai"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
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
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Received From (Party / Person) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Apex Tech Solutions / Director"
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Received By (Cashier / Staff)
            </label>
            <input
              type="text"
              placeholder="e.g. Rajesh Sharma"
              value={formData.receivedBy}
              onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Reference / Receipt / Slip No.
          </label>
          <input
            type="text"
            placeholder="e.g. REC-2026/099 or Bank Ref #"
            value={formData.billRef}
            onChange={(e) => setFormData({ ...formData, billRef: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Remarks & Description
          </label>
          <textarea
            rows={2}
            placeholder="Detailed purpose of petty cash inflow..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
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
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-600/30 transition-all cursor-pointer active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Save Received Amount</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
