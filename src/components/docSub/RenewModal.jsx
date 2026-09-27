import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { renewDocument, renewSubscription } from '../../services/docSubStorageService';
import { Calendar, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function RenewModal({ isOpen, onClose, target, type = 'document', onSuccess }) {
  const [newExpiryDate, setNewExpiryDate] = useState(() => {
    // Default to +1 year from today
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState(target?.amount || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!target) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newExpiryDate) {
      setError('Please select a valid new renewal / expiry date.');
      return;
    }

    if (type === 'document') {
      renewDocument(target.id, {
        newExpiryDate,
        notes: notes.trim(),
        renewedBy: 'Administrator'
      });
    } else {
      renewSubscription(target.id, {
        nextRenewalDate: newExpiryDate,
        nextPaymentDueDate: newExpiryDate,
        amount: amount ? Number(amount) : target.amount,
        notes: notes.trim(),
        renewedBy: 'Administrator'
      });
    }

    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'document' ? "Renew / Extend Document Validity" : "Renew Subscription Contract"}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
          <div className="text-xs font-mono font-bold text-slate-400">{target.id}</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {target.title || target.serviceName}
          </div>
          <div className="text-xs text-slate-500">
            Current Expiry / Renewal:{' '}
            <strong className="text-rose-600 dark:text-rose-400">
              {target.expiryDate || target.nextRenewalDate || 'Expired'}
            </strong>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            New Validity / Renewal Date *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="date"
              required
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {type === 'subscription' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Renewal Fee / Cost (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Renewal Notes / Terms Changes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. 5% price increase, 12 months extended as per amended SLA..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-hidden"
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
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Confirm Renewal</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default RenewModal;
