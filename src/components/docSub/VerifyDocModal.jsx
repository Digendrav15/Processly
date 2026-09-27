import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { verifyDocument } from '../../services/docSubStorageService';
import { ShieldCheck, CheckCircle2, XCircle, FileText, AlertCircle } from 'lucide-react';

export function VerifyDocModal({ isOpen, onClose, document, onSuccess }) {
  const [status, setStatus] = useState('Verified');
  const [notes, setNotes] = useState('');
  const [verifiedBy, setVerifiedBy] = useState('Administrator');

  if (!document) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyDocument(document.id, {
      status,
      verifiedBy,
      notes: notes.trim()
    });
    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compliance & Document Verification" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Header Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500">
            <span>{document.id}</span>
            <span className="uppercase text-blue-600 dark:text-blue-400">{document.category}</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            {document.title}
          </div>
          <div className="text-xs text-slate-500">
            Doc #: <strong>{document.docNumber}</strong> • Dept: {document.department}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Verification Decision *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('Verified')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                status === 'Verified'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve (Verified)</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('Rejected')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                status === 'Rejected'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Document</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Verified By (Officer Name)
          </label>
          <input
            type="text"
            required
            value={verifiedBy}
            onChange={(e) => setVerifiedBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Verification Remarks / Findings
          </label>
          <textarea
            rows={2}
            placeholder="Attestation notes, seal verification, or rejection reasons..."
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
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm Verification</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default VerifyDocModal;
