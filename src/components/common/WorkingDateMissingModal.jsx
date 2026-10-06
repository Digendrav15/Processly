import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  X,
  ArrowRight,
  ShieldAlert,
  Clock,
  ExternalLink,
} from 'lucide-react';

export function WorkingDateMissingModal({ isOpen: propIsOpen, onClose: propOnClose, missingDateInfo: propInfo }) {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalInfo, setInternalInfo] = useState(null);

  // Listen to global event so any module can trigger it easily
  useEffect(() => {
    const handleGlobalTrigger = (e) => {
      if (e?.detail) {
        setInternalInfo(e.detail);
        setInternalOpen(true);
      }
    };

    window.addEventListener('working_date_missing_popup', handleGlobalTrigger);
    return () => window.removeEventListener('working_date_missing_popup', handleGlobalTrigger);
  }, []);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;
  const info = propInfo || internalInfo || {
    date: 'N/A',
    dayDDD: 'N/A',
    weekNo: 'N/A',
    endDate: 'N/A',
  };

  const handleClose = () => {
    if (propOnClose) propOnClose();
    setInternalOpen(false);
  };

  const handleGoToMasters = () => {
    handleClose();
    navigate('/masters?tab=WorkingDayCalendar');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-100 dark:border-amber-950 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/25 shrink-0">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Date Range Boundary</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Working Date Missing
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The requested task planned date cannot be generated or scheduled because it exceeds your enterprise{' '}
            <strong className="text-slate-900 dark:text-white font-semibold">Working Day Calendar</strong>.
            {info.endDate && info.endDate !== 'N/A' && (
              <span className="block mt-1 text-slate-500 dark:text-slate-400">
                Current calendar validity ends on:{' '}
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{info.endDate}</span>.
              </span>
            )}
          </p>

          {/* Requested Data Table: [ Date , Day (DDD) , Week No. ] */}
          <div className="overflow-hidden rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
            <div className="bg-amber-100/70 dark:bg-amber-900/30 px-4 py-2 border-b border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Boundary Violation Details</span>
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-mono">
                {info.date > info.endDate ? 'Exceeds End Date' : 'Missing'}
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-amber-200/40 dark:border-amber-800/30 text-[11px] text-slate-500 dark:text-slate-400 font-semibold bg-white/50 dark:bg-slate-900/50">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Day (DDD)</th>
                  <th className="py-2.5 px-4">Week No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200/30 dark:divide-amber-800/20 font-mono text-slate-800 dark:text-slate-200">
                <tr className="hover:bg-amber-100/30 dark:hover:bg-amber-950/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>{info.date}</span>
                  </td>
                  <td className="py-3 px-4 font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      {info.dayDDD}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                    {info.weekNo}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">💡 Note:</span>
            <span>
              To allow tasks in future years (e.g. up to 2028 or beyond), update the End Date in the{' '}
              <strong>Working Day Calendar</strong> under Masters.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Adjust Date
          </button>
          <button
            onClick={handleGoToMasters}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition-all"
          >
            <span>Open Calendar in Masters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default WorkingDateMissingModal;
