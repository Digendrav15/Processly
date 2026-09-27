import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { DEPOSIT_BANKS, depositCheque } from '../../services/pettyStorageService';
import { Landmark, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function ChequeDepositModal({ isOpen, onClose, cheque, onSuccess }) {
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositBank, setDepositBank] = useState(DEPOSIT_BANKS[0]);
  const [depositSlipNo, setDepositSlipNo] = useState('');
  const [error, setError] = useState('');

  if (!cheque) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!depositDate) {
      setError('Please select the date the cheque was deposited.');
      return;
    }
    if (!depositBank) {
      setError('Please select the deposit bank account.');
      return;
    }

    depositCheque(cheque.id, {
      depositDate,
      depositBank,
      depositSlipNo: depositSlipNo.trim()
    });

    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deposit Cheque into Bank" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cheque Summary Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              Cheque #{cheque.chequeNo}
            </span>
            <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">
              ₹{Number(cheque.amount).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {cheque.partyName}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-slate-400" />
            <span>{cheque.bankName} {cheque.branchName ? `(${cheque.branchName})` : ''}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Deposit Date *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="date"
              required
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Deposited into Company Bank Account *
          </label>
          <select
            value={depositBank}
            onChange={(e) => setDepositBank(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
          >
            {DEPOSIT_BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Bank Pay-in Slip / Counterfoil Ref #
          </label>
          <input
            type="text"
            placeholder="e.g. SLIP-8849 or ACK-012"
            value={depositSlipNo}
            onChange={(e) => setDepositSlipNo(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
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
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark as Deposited</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
