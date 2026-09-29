import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { DOCUMENT_CATEGORIES, DEPARTMENTS, saveDocument } from '../../services/docSubStorageService';
import {
  FileText,
  Calendar,
  Building2,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  ShieldCheck
} from 'lucide-react';
import { AIDocumentScanner } from './AIDocumentScanner';

export function AddDocumentModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || DOCUMENT_CATEGORIES[0],
    docNumber: initialData?.docNumber || '',
    issuer: initialData?.issuer || '',
    issueDate: initialData?.issueDate || new Date().toISOString().split('T')[0],
    expiryDate: initialData?.expiryDate || '',
    isPerpetual: initialData?.isPerpetual || false,
    department: initialData?.department || DEPARTMENTS[0],
    custodian: initialData?.custodian || 'Administrator',
    criticality: initialData?.criticality || 'High',
    fileName: initialData?.fileName || '',
    notes: initialData?.notes || ''
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Please provide a document title / name.');
      return;
    }
    if (!formData.docNumber.trim()) {
      setError('Please provide a document / certificate registration number.');
      return;
    }
    if (!formData.isPerpetual && !formData.expiryDate) {
      setError('Please provide an expiry date, or check "Permanent / Perpetual Validity".');
      return;
    }

    saveDocument({
      ...(initialData?.id ? { id: initialData.id } : {}),
      title: formData.title.trim(),
      category: formData.category,
      docNumber: formData.docNumber.trim(),
      issuer: formData.issuer.trim(),
      issueDate: formData.issueDate,
      expiryDate: formData.isPerpetual ? '' : formData.expiryDate,
      isPerpetual: formData.isPerpetual,
      department: formData.department,
      custodian: formData.custodian.trim(),
      criticality: formData.criticality,
      fileName: formData.fileName.trim() || `${formData.title.replace(/\s+/g, '_')}.pdf`,
      fileSize: initialData?.fileSize || '2.1 MB',
      notes: formData.notes.trim()
    });

    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Document Record" : "Register New Document"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* AI / OCR Document Scanner */}
        {!initialData && (
          <AIDocumentScanner
            onApplyData={(extracted) => {
              setFormData((prev) => ({
                ...prev,
                title: extracted.title || prev.title,
                category: extracted.category || prev.category,
                docNumber: extracted.docNumber || prev.docNumber,
                issuer: extracted.issuer || prev.issuer,
                issueDate: extracted.issueDate || prev.issueDate,
                expiryDate: extracted.expiryDate || prev.expiryDate,
                isPerpetual: extracted.isPerpetual !== undefined ? extracted.isPerpetual : prev.isPerpetual,
                department: extracted.department || prev.department,
                custodian: extracted.custodian || prev.custodian,
                criticality: extracted.criticality || prev.criticality,
                fileName: extracted.fileName || prev.fileName,
                notes: extracted.notes || prev.notes
              }));
            }}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Document Title / Certificate Name *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Head Office Lease Agreement or Factory License"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Document / License / Policy Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 27AAACG0192Q1ZV or LEASE-2026-09"
              value={formData.docNumber}
              onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Document Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Issuing Authority / Agency / Counterparty
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Ministry of Corporate Affairs, ICICI Lombard"
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Department *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Issue / Effective Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                required
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Expiry / Renewal Due Date
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPerpetual}
                  onChange={(e) => setFormData({ ...formData, isPerpetual: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  Permanent / Perpetual
                </span>
              </label>
            </div>
            <input
              type="date"
              disabled={formData.isPerpetual}
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden ${
                formData.isPerpetual ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Custodian / Owner
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Vikramaditya Sharma / Legal Officer"
                value={formData.custodian}
                onChange={(e) => setFormData({ ...formData, custodian: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Criticality / Priority Level
            </label>
            <select
              value={formData.criticality}
              onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="High">High (Statutory / Crucial)</option>
              <option value="Medium">Medium (Operational)</option>
              <option value="Low">Low (Informational)</option>
            </select>
          </div>
        </div>

        {/* Upload Simulation */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            File Attachment (PDF / Scanned Copy)
          </label>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <UploadCloud className="w-5 h-5 text-blue-500 shrink-0" />
              <span className="truncate">{formData.fileName || 'Attach certified PDF, DOCX or scanned copy'}</span>
            </div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setFormData({ ...formData, fileName: file.name });
              }}
            />
            <label
              htmlFor="file-upload"
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Browse
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Remarks & Clause Summary
          </label>
          <textarea
            rows={2}
            placeholder="Key terms, escalation clause, locker location, or renewal notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
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
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{initialData ? "Save Changes" : "Register Document"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddDocumentModal;
