import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { bounceCheque } from '../../services/pettyStorageService';
import { AlertTriangle, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const COMMON_BOUNCE_REASONS = [
  'Insufficient Funds (Account Balance Low)',
  'Signature Differs / Incomplete Signature',
  'Post-dated or Stale Cheque',
  'Stop Payment Order by Drawer',
  'Alteration on Cheque without Confirmation',
  'Account Frozen / Blocked',
  'Words & Figures Differ',
  'Other / Technical Return'
];

export function ChequeBounceModal({ isOpen, onClose, cheque, onSuccess }) {
  const [bounceDate, setBounceDate] = useState(new Date().toISOString().split('T')[0]);
  const [bounceReason, setBounceReason] = useState(COMMON_BOUNCE_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  if (!cheque) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = bounceReason === 'Other / Technical Return' ? customReason.trim() : bounceReason;
    if (!finalReason) {
      setError('Please provide a reason for the cheque bounce/return.');
      return;
    }

    bounceCheque(cheque.id, {
      bounceDate,
      bounceReason: finalReason
    });

    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Cheque as Returned / Bounced" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 rounded-2xl space-y-1 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Cheque Dishonor Notice</span>
          </div>
          <p className="text-[11px] text-rose-700 dark:text-rose-400/90 leading-relaxed">
            Marking this cheque as Bounced will update its status. Any previously recorded ledger entry will be reversed so your balances remain accurate.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              Cheque #{cheque.chequeNo}
            </span>
            <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
              ₹{Number(cheque.amount).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {cheque.partyName}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Return Memo Date *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="date"
              required
              value={bounceDate}
              onChange={(e) => setBounceDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Bank Return Reason *
          </label>
          <select
            value={bounceReason}
            onChange={(e) => setBounceReason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
          >
            {COMMON_BOUNCE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {bounceReason === 'Other / Technical Return' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Specify Return Reason *
            </label>
            <input
              type="text"
              placeholder="e.g. Clearing house technical cutoff failure"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
            />
          </div>
        )}

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
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Mark Bounced</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
