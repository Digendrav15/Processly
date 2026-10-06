import React from 'react';
import { CalendarDays, ShieldCheck } from 'lucide-react';
import { WorkingDayCalendarMaster } from '../../components/masters/WorkingDayCalendarMaster';

export function MasterWorkingCalendarPage() {
  return (
    <div className="space-y-4 pb-8">
      {/* Clean Compact Header matching Master System standard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border border-rose-200 dark:border-rose-800/80">
            Master System
          </span>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
              Working Day Calendar
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Operational Date Window & Weekly Off Rules
          </span>
        </div>
      </div>

      {/* Main Working Day Calendar Master Component */}
      <WorkingDayCalendarMaster />
    </div>
  );
}
