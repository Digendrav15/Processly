import React from 'react';
import {
  X,
  FileText,
  Calendar,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  User,
  Tag,
  Download,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react';
import { getDaysDiff, formatDate } from '../../services/docSubStorageService';

export default function DocumentViewModal({
  isOpen,
  onClose,
  doc,
  onVerify,
  onRenew,
  onEdit,
  onDelete
}) {
  if (!isOpen || !doc) return null;

  const daysLeft = doc.isPerpetual ? null : getDaysDiff(doc.expiryDate);
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {doc.id}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    doc.verificationStatus === 'Verified'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : doc.verificationStatus === 'Rejected'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {doc.verificationStatus}
                </span>
                {doc.criticality && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      doc.criticality === 'High'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {doc.criticality} Criticality
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {doc.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Expiry Banner */}
          {doc.isPerpetual ? (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <div className="text-xs">
                <span className="font-semibold">Perpetual Document:</span> This document has no expiration date and remains valid indefinitely unless superseded.
              </div>
            </div>
          ) : isExpired ? (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300">
              <div className="flex items-center gap-2.5 text-xs">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <div>
                  <span className="font-bold">EXPIRED:</span> Expired {Math.abs(daysLeft)} days ago on{' '}
                  <span className="font-semibold">{formatDate(doc.expiryDate)}</span>. Immediate renewal required.
                </div>
              </div>
              {onRenew && (
                <button
                  onClick={() => {
                    onClose();
                    onRenew(doc);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Renew Now
                </button>
              )}
            </div>
          ) : isExpiringSoon ? (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2.5 text-xs">
                <Clock className="w-5 h-5 flex-shrink-0 text-amber-600" />
                <div>
                  <span className="font-bold">EXPIRING SOON:</span> Valid for only{' '}
                  <span className="font-semibold">{daysLeft} days</span> (Expires on {formatDate(doc.expiryDate)}).
                </div>
              </div>
              {onRenew && (
                <button
                  onClick={() => {
                    onClose();
                    onRenew(doc);
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Renew
                </button>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl flex items-center gap-3 text-blue-800 dark:text-blue-300 text-xs">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600" />
              <div>
                <span className="font-semibold">Active & Valid:</span> Expires in {daysLeft} days on{' '}
                <span className="font-semibold">{formatDate(doc.expiryDate)}</span>.
              </div>
            </div>
          )}

          {/* Grid Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Category</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{doc.category || 'General'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Doc / Reg Number</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{doc.docNumber || 'N/A'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Issuing Authority / Party</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{doc.issuer || 'N/A'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Issue Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatDate(doc.issueDate)}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Expiry Date</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {doc.isPerpetual ? 'Never (Perpetual)' : formatDate(doc.expiryDate)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Custodian / Owner</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{doc.custodian || 'Administrator'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Department</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{doc.department || 'Corporate'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Verified By</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {doc.verifiedBy ? `${doc.verifiedBy} (${formatDate(doc.verifiedAt)})` : 'Not yet verified'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block mb-1">Attachment File</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 truncate block">
                {doc.fileName || 'document.pdf'}
              </span>
            </div>
          </div>

          {/* Notes */}
          {doc.notes && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Compliance Notes & Remarks:
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{doc.notes}</p>
            </div>
          )}

          {/* File Attachment Box */}
          <div className="p-3.5 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {doc.fileName || 'Contract_Document.pdf'}
                </p>
                <p className="text-[11px] text-slate-400">{doc.fileSize || '1.8 MB'} • Encrypted Storage</p>
              </div>
            </div>
            <button
              onClick={() => alert(`Simulated downloading: ${doc.fileName || 'document.pdf'}`)}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${doc.title}?`)) {
                    onDelete(doc.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(doc);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onVerify && doc.verificationStatus !== 'Verified' && (
              <button
                onClick={() => {
                  onClose();
                  onVerify(doc);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verify
              </button>
            )}
            {!doc.isPerpetual && onRenew && (
              <button
                onClick={() => {
                  onClose();
                  onRenew(doc);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Renew
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
