import React, { useState, useEffect, useMemo } from 'react';
import {
  workingCalendarService,
  formatDateYYYYMMDD,
  getDayDDD,
  getWeekNumber,
} from '../../services/workingCalendarService';
import {
  Calendar,
  Check,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

const WEEKDAYS = [
  { id: 0, ddd: 'Sun', name: 'Sunday' },
  { id: 1, ddd: 'Mon', name: 'Monday' },
  { id: 2, ddd: 'Tue', name: 'Tuesday' },
  { id: 3, ddd: 'Wed', name: 'Wednesday' },
  { id: 4, ddd: 'Thu', name: 'Thursday' },
  { id: 5, ddd: 'Fri', name: 'Friday' },
  { id: 6, ddd: 'Sat', name: 'Saturday' },
];

export function WorkingDayCalendarMaster() {
  const [config, setConfig] = useState(() => workingCalendarService.getConfig());
  const [startDate, setStartDate] = useState(config.startDate || '2026-01-01');
  const [endDate, setEndDate] = useState(config.endDate || '2028-12-31');
  const [weeklyOffs, setWeeklyOffs] = useState(config.weeklyOffDays || [0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Month navigation for Table
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [dayFilter, setDayFilter] = useState('ALL'); // ALL, WORKING, OFF

  // Planned Date Tester state
  const [testDate, setTestDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDateYYYYMMDD(d);
  });
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    runDateTest(testDate);
  }, [testDate, config]);

  const handleSaveRangeAndOffs = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    if (startDate > endDate) {
      alert('Start Date must be before or equal to End Date');
      return;
    }

    const updated = workingCalendarService.saveConfig({
      startDate,
      endDate,
      weeklyOffDays: weeklyOffs,
    });

    setConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const toggleWeeklyOff = (dayIndex) => {
    setWeeklyOffs((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((d) => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  // Run tester
  const runDateTest = (dateStr) => {
    if (!dateStr) {
      setTestResult(null);
      return;
    }
    const res = workingCalendarService.validatePlannedDate(dateStr);
    setTestResult(res);
  };

  // Days in selected Month
  const calendarDays = useMemo(() => {
    return workingCalendarService.getCalendarDaysForMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth, config]);

  const filteredDays = useMemo(() => {
    return calendarDays.filter((d) => {
      if (dayFilter === 'WORKING' && !d.isWorkingDay) return false;
      if (dayFilter === 'OFF' && d.isWorkingDay) return false;
      return true;
    });
  }, [calendarDays, dayFilter]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const toggleSingleDateOff = (ymd) => {
    const customOffs = [...(config.customOffDates || [])];
    let newCustomOffs;
    if (customOffs.includes(ymd)) {
      newCustomOffs = customOffs.filter((d) => d !== ymd);
    } else {
      newCustomOffs = [...customOffs, ymd];
    }
    const updated = workingCalendarService.saveConfig({
      customOffDates: newCustomOffs,
    });
    setConfig(updated);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Rule Explanation Banner */}
      <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-100 dark:border-indigo-900/60 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enterprise Task Planned Date Engine</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Working Day Calendar Configuration
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Define the valid working date range (e.g. 2026 to 2028). Any task planned beyond the End Date will automatically trigger the{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-semibold">Working Date Missing</strong> modal with [Date, Day (DDD), Week No.].
              Tasks falling on a Week Off (e.g. Sunday) will roll over to the next working day (Monday).
            </p>
          </div>

          <div className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs shrink-0 font-mono text-xs">
            <p className="text-slate-400 font-sans text-[11px]">Calendar Validity Window</p>
            <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {config.startDate} ➔ {config.endDate}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Date Range & Weekly Off Setting */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Start Date & End Date Setup */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Active Calendar Date Range</h3>
                  <p className="text-xs text-slate-400">Planned dates will only be generated up to the specified End Date</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveRangeAndOffs} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>End Date (Enforcement Boundary)</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Planned Date Limit</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Weekly Off Days Selection */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Configure Weekly Off Days (Tasks will not be planned on these days)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {WEEKDAYS.map((w) => {
                    const isOff = weeklyOffs.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleWeeklyOff(w.id)}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          isOff
                            ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm font-black">{w.ddd}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          {isOff ? 'Week Off' : 'Working'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Example: If <strong className="text-slate-700 dark:text-slate-300">Sunday</strong> is Week Off, tasks that land on Sunday will automatically be planned for <strong className="text-indigo-600 dark:text-indigo-400">Monday</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-400">
                  {savedSuccess && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Check className="w-4 h-4" />
                      <span>Calendar Settings Successfully Saved!</span>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                >
                  Save Calendar & Week Off Rules
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Interactive Calendar Browser Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Monthly Calendar & Working Days View
                </h3>
                <p className="text-xs text-slate-400">
                  Showing: [ Date , Day (DDD) , Week No. ]
                </p>
              </div>

              {/* Month Selector & Filter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 font-bold font-mono">
                    {monthNames[viewMonth]} {viewYear}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                >
                  <option value="ALL">All Days</option>
                  <option value="WORKING">Working Days Only</option>
                  <option value="OFF">Week Offs & Holidays</option>
                </select>
              </div>
            </div>

            {/* Requested Columns: [ Date , Day (DDD) , Week No. ] */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Day (DDD)</th>
                    <th className="py-2.5 px-4">Week No.</th>
                    <th className="py-2.5 px-4">Working Status</th>
                    <th className="py-2.5 px-4 text-right">Day Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredDays.map((day) => {
                    const isWithin = day.withinRange;
                    return (
                      <tr
                        key={day.date}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          !day.isWorkingDay ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                          <span>{day.date}</span>
                          {!isWithin && (
                            <span className="ml-2 text-[10px] text-amber-500 font-normal">
                              (Out of Range)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              !day.isWorkingDay
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {day.dayDDD}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                          {day.weekNo}
                        </td>
                        <td className="py-2.5 px-4">
                          {day.isWorkingDay ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Working Day</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Week Off</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => toggleSingleDateOff(day.date)}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                          >
                            {day.isWorkingDay ? 'Mark Off' : 'Mark Working'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Live Planned Date Simulator & Missing Popup Tester */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Planned Date Logic Tester
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Test how any planned date will behave when generated in Tasks, Checklist, or Delegations:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Test Planned Date
              </label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono dark:text-white"
              />
            </div>

            {testResult && (
              <div className="space-y-3 pt-2">
                {testResult.isMissing ? (
                  /* Case 1: Exceeds End Date -> "Working Date Missing" */
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Popup Alert: Working Date Missing</span>
                    </div>
                    <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                      Date exceeds the configured calendar limit ({config.endDate}). An alert popup will block task generation until the calendar range is extended.
                    </p>
                    <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-xl font-mono text-[11px] grid grid-cols-3 text-center border border-amber-200/60 dark:border-amber-900">
                      <div>
                        <span className="text-slate-400 block text-[9px]">Date</span>
                        <span className="font-bold text-rose-600">{testResult.info.date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Day (DDD)</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{testResult.info.dayDDD}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Week No.</span>
                        <span className="font-bold text-indigo-600">{testResult.info.weekNo}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => workingCalendarService.triggerWorkingDateMissingPopup(testResult.info)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Trigger Popup Modal Preview
                    </button>
                  </div>
                ) : testResult.wasAdjusted ? (
                  /* Case 2: On Week Off (e.g. Sunday) -> Rollover to Monday */
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Automatic Next Working Day Rollover</span>
                    </div>
                    <p className="text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                      Date <strong className="font-mono">{testResult.originalDate}</strong> ({testResult.info.dayDDD}) is a Week Off. Task will not be shown on this day.
                    </p>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 font-mono text-xs">
                      <span className="text-slate-400 block text-[10px]">Rolled Over Planned Date:</span>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        ➔ {testResult.adjustedDate} ({testResult.adjustedDayDDD} - {testResult.adjustedWeekNo})
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Case 3: Standard Valid Working Day */
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Valid Working Day</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Date is within range ({testResult.info.weekNo}) and falls on a scheduled working day. Tasks will be planned directly.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>How Rules are Applied:</span>
            </h4>
            <ul className="space-y-2 list-disc pl-4 text-[11px] leading-relaxed">
              <li>
                <strong>Calendar Validity Limit:</strong> If anyone sets or generates a planned date past <strong>{config.endDate}</strong>, task creation stops and the <em>Working Date Missing</em> alert is presented.
              </li>
              <li>
                <strong>Week Off Exclusion:</strong> Tasks are never assigned or scheduled on Week Off days. They smoothly move forward to the next business day.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
export default WorkingDayCalendarMaster;
