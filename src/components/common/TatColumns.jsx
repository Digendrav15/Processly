import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { calculateDelayInfo, formatShortDate } from '../../services/tatCalculationService';

/**
 * Standard Table Header for [ Pending ] Tab: "Planned"
 */
export function PlannedTh({ className = '' }) {
  return (
    <th className={`py-2 px-3 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap text-center ${className}`}>
      <div className="inline-flex items-center gap-1">
        <Calendar className="w-3 h-3 text-indigo-500" />
        <span>Planned</span>
      </div>
    </th>
  );
}

/**
 * Standard Table Cell for [ Pending ] Tab: "Planned"
 */
export function PlannedTd({ plannedDate, className = '' }) {
  const delay = calculateDelayInfo(plannedDate, null, true);
  return (
    <td className={`py-1.5 px-3 text-center whitespace-nowrap ${className}`}>
      <div className="inline-flex flex-col items-center">
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
          {delay.plannedText}
        </span>
        {delay.isDelayed && (
          <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">
            {delay.text}
          </span>
        )}
      </div>
    </td>
  );
}

/**
 * Standard Table Headers for [ History ] Tab: "Planned Date", "Actual Date", "Time Delay"
 */
export function HistoryTatTh({ className = '' }) {
  return (
    <>
      <th className={`py-2 px-3 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap text-center ${className}`}>
        <div className="inline-flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Planned Date</span>
        </div>
      </th>
      <th className={`py-2 px-3 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap text-center ${className}`}>
        <div className="inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Actual Date</span>
        </div>
      </th>
      <th className={`py-2 px-3 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap text-center ${className}`}>
        <div className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>Time Delay</span>
        </div>
      </th>
    </>
  );
}

/**
 * Standard Table Cells for [ History ] Tab: "Planned Date", "Actual Date", "Time Delay"
 */
export function HistoryTatTd({ plannedDate, actualDate, className = '' }) {
  const delay = calculateDelayInfo(plannedDate, actualDate, false);

  return (
    <>
      <td className={`py-1.5 px-3 text-center text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap ${className}`}>
        {delay.plannedText}
      </td>
      <td className={`py-1.5 px-3 text-center text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap ${className}`}>
        {delay.actualText}
      </td>
      <td className={`py-1.5 px-3 text-center whitespace-nowrap ${className}`}>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${delay.badgeClass}`}
        >
          {delay.text}
        </span>
      </td>
    </>
  );
}

export function DelayBadge({ plannedDate, actualDate, isPending = false }) {
  const delay = calculateDelayInfo(plannedDate, actualDate, isPending);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${delay.badgeClass}`}>
      {delay.isDelayed ? <AlertTriangle className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
      <span>{delay.text}</span>
    </span>
  );
}
