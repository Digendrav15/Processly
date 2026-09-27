import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { clearCheque } from '../../services/pettyStorageService';
import { CheckCircle2, Calendar, FileText, AlertCircle, ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';

export function ChequeClearModal({ isOpen, onClose, cheque, onSuccess }) {
  const [clearanceDate, setClearanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [utrRef, setUtrRef] = useState('');
  const [error, setError] = useState('');

  if (!cheque) return null;

  const isReceived = cheque.type === 'received';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clearanceDate) {
      setError('Please select the clearance date.');
      return;
    }

    clearCheque(cheque.id, {
      clearanceDate,
      utrRef: utrRef.trim()
    });

    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Clear Cheque & Auto-Sync to Ledger" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Highlight User Automation Notice */}
        <div
          className={`p-4 rounded-2xl border ${
            isReceived
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80'
              : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isReceived ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
            <span className={`text-xs font-bold ${isReceived ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'}`}>
              Automatic Ledger Sync
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
            {isReceived ? (
              <>
                Clearing this received cheque will <strong>automatically create an Amount Received (Incoming) entry</strong> for{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  ₹{Number(cheque.amount).toLocaleString('en-IN')}
                </strong>{' '}
                in your Petty Cashbook ledger.
              </>
            ) : (
              <>
                Clearing this issued cheque will <strong>automatically create an Expense (Outgoing) entry</strong> for{' '}
                <strong className="text-rose-600 dark:text-rose-400">
                  ₹{Number(cheque.amount).toLocaleString('en-IN')}
                </strong>{' '}
                in your Petty Expenses ledger.
              </>
            )}
          </p>
        </div>

        {/* Cheque Summary */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              Cheque #{cheque.chequeNo}
            </span>
            <div className="flex items-center gap-1">
              {isReceived ? (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Received
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Issued
                </span>
              )}
            </div>
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-white">
            {cheque.partyName}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {cheque.bankName} {cheque.depositBank ? `• Deposited in ${cheque.depositBank}` : ''}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Bank Clearance Date *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="date"
              required
              value={clearanceDate}
              onChange={(e) => setClearanceDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Bank UTR / Transaction Reference Number
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. UTR-HDFC-9938210 or CLR-REF-01"
              value={utrRef}
              onChange={(e) => setUtrRef(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>
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
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Cleared & Track to Ledger</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
