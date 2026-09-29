import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  DollarSign,
  Building,
  FileText,
  Calendar,
  ShieldAlert,
  Save
} from 'lucide-react';
import { DEAL_LOSS_REASONS, markLeadAsLost } from '../../services/leadToOrderStorageService';

export function MarkDealLostModal({ isOpen, onClose, lead }) {
  if (!isOpen || !lead) return null;

  const [form, setForm] = useState({
    lossReason: DEAL_LOSS_REASONS[0],
    competitorName: '',
    competitorPrice: '',
    estimatedValue: lead.estimatedValue || 250000,
    lostRemarks: '',
    lostDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.lossReason) {
      alert('Please select a loss reason');
      return;
    }

    markLeadAsLost(lead.id || lead.leadId, form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Record Deal Loss Analysis
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                Lead: {lead.leadId} • {lead.customerName || lead.customer}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Primary Loss Driver / Reason *
            </label>
            <select
              value={form.lossReason}
              onChange={(e) => setForm({ ...form, lossReason: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {DEAL_LOSS_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Winning Competitor
              </label>
              <input
                type="text"
                placeholder="e.g. Kamdhenu / Tata Steel"
                value={form.competitorName}
                onChange={(e) => setForm({ ...form, competitorName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Competitor Quoted Rate (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 420000"
                value={form.competitorPrice}
                onChange={(e) => setForm({ ...form, competitorPrice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Lost Deal Value (₹) *
              </label>
              <input
                type="number"
                required
                value={form.estimatedValue}
                onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Loss Date
              </label>
              <input
                type="date"
                value={form.lostDate}
                onChange={(e) => setForm({ ...form, lostDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Client Feedback & Debrief Notes
            </label>
            <textarea
              rows={3}
              placeholder="Why did the client decline? (e.g. Price difference, delivery timeline, credit terms, warranty clauses)..."
              value={form.lostRemarks}
              onChange={(e) => setForm({ ...form, lostRemarks: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Record Deal Loss</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
