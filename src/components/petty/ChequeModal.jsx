import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { INCOMING_CATEGORIES, OUTGOING_CATEGORIES, DEPOSIT_BANKS, saveCheque } from '../../services/pettyStorageService';
import { Landmark, Calendar, User, FileText, CheckCircle2, AlertCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export function ChequeModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [type, setType] = useState(initialData?.type || 'received');
  const [formData, setFormData] = useState({
    chequeNo: initialData?.chequeNo || '',
    partyName: initialData?.partyName || '',
    bankName: initialData?.bankName || (initialData?.type === 'issued' ? 'HDFC Bank - Current A/C #9482' : ''),
    branchName: initialData?.branchName || '',
    amount: initialData?.amount || '',
    chequeDate: initialData?.chequeDate || new Date().toISOString().split('T')[0],
    category: initialData?.category || (initialData?.type === 'issued' ? OUTGOING_CATEGORIES[0] : INCOMING_CATEGORIES[0]),
    depositStatus: initialData?.depositStatus || (initialData?.type === 'issued' ? 'Presented' : 'Not Deposited'),
    depositBank: initialData?.depositBank || DEPOSIT_BANKS[0],
    depositDate: initialData?.depositDate || '',
    depositSlipNo: initialData?.depositSlipNo || '',
    remarks: initialData?.remarks || ''
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.chequeNo.trim() || formData.chequeNo.trim().length < 4) {
      setError('Please enter a valid Cheque Number (typically 6 digits).');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid Cheque Amount greater than 0.');
      return;
    }
    if (!formData.partyName.trim()) {
      setError(type === 'received' ? 'Please specify the Drawer / Payer Name.' : 'Please specify the Payee / Beneficiary Name.');
      return;
    }
    if (!formData.bankName.trim()) {
      setError('Please specify the Bank Name.');
      return;
    }

    saveCheque({
      ...(initialData?.id ? { id: initialData.id } : {}),
      type,
      chequeNo: formData.chequeNo.trim(),
      partyName: formData.partyName.trim(),
      bankName: formData.bankName.trim(),
      branchName: formData.branchName.trim() || 'Main Branch',
      amount: Number(formData.amount),
      chequeDate: formData.chequeDate,
      category: formData.category,
      depositStatus: formData.depositStatus,
      depositBank: formData.depositStatus === 'Deposited' ? formData.depositBank : '',
      depositDate: formData.depositStatus === 'Deposited' ? (formData.depositDate || new Date().toISOString().split('T')[0]) : '',
      depositSlipNo: formData.depositSlipNo.trim(),
      clearanceStatus: initialData?.clearanceStatus || 'Pending',
      remarks: formData.remarks.trim()
    });

    onSuccess?.();
    onClose();
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setFormData((prev) => ({
      ...prev,
      category: newType === 'received' ? INCOMING_CATEGORIES[0] : OUTGOING_CATEGORIES[0],
      depositStatus: newType === 'received' ? 'Not Deposited' : 'Presented',
      bankName: newType === 'issued' ? 'HDFC Bank - Current A/C #9482' : prev.bankName
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Cheque Entry" : "New Cheque Registration"} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cheque Direction Selector */}
        {!initialData && (
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('received')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'received'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-teal-500" />
              <span>Cheque Received (Inflow)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('issued')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'issued'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
              <span>Cheque Issued (Outflow)</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cheque Number (6-digits) *
            </label>
            <div className="relative">
              <Landmark className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                maxLength={8}
                placeholder="e.g. 489201"
                value={formData.chequeNo}
                onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
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
              {type === 'received' ? 'Drawer / Party Name (Received From) *' : 'Payee / Beneficiary (Issued To) *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder={type === 'received' ? 'e.g. Apex Tech Solutions' : 'e.g. City Stationery Mills'}
                value={formData.partyName}
                onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cheque Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                required
                value={formData.chequeDate}
                onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {type === 'received' ? 'Party Bank Name *' : 'Issuing Company Bank *'}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Bank / SBI / ICICI"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Branch / Location
            </label>
            <input
              type="text"
              placeholder="e.g. Connaught Place, New Delhi"
              value={formData.branchName}
              onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </div>
        </div>

        {/* Deposit Tracking Field for Received Cheques */}
        {type === 'received' && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Deposit Status (Deposit Huaa Hai Ki Nhi)
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, depositStatus: 'Not Deposited' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    formData.depositStatus === 'Not Deposited'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  🟡 Not Deposited (In Hand)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, depositStatus: 'Deposited' })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    formData.depositStatus === 'Deposited'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  🔵 Deposited in Bank
                </button>
              </div>
            </div>

            {formData.depositStatus === 'Deposited' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Deposited Bank Account
                  </label>
                  <select
                    value={formData.depositBank}
                    onChange={(e) => setFormData({ ...formData, depositBank: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
                  >
                    {DEPOSIT_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Deposit Date
                  </label>
                  <input
                    type="date"
                    value={formData.depositDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, depositDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Category / Ledger Purpose
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-hidden"
          >
            {(type === 'received' ? INCOMING_CATEGORIES : OUTGOING_CATEGORIES).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Remarks & Purpose
          </label>
          <textarea
            rows={2}
            placeholder="Special instructions or notes for bank clearance..."
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
            <CheckCircle2 className="w-4 h-4" />
            <span>{initialData ? "Update Cheque" : "Register Cheque"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
