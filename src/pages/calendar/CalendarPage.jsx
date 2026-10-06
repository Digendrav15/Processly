import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, PartyPopper } from 'lucide-react';
import { getStatusBadgeStyle } from '../../lib/utils';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS } from '../../services/otdStorageService';
import { holidayService } from '../../services/holidayService';

export function CalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [viewMode, setViewMode] = useState('Month'); // Month, Week, Day
  const holidays = useOTDStorage(STORAGE_KEYS.HOLIDAYS, holidayService.getHolidaysSync());

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getTasks({ user });
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks for calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Interactive Task Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual schedule of daily checklists, due dates, and completed operational tasks
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {['Month', 'Week', 'Day'].map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === m
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Month Stepper */}
          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button onClick={prevMonth} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-28 text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase py-3">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800 min-h-[500px]">
          {days.map((day) => {
            const dayTasks = tasks.filter((t) => isSameDay(new Date(t.due_date), day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            const dayFormatted = format(day, 'yyyy-MM-dd');
            const dayHoliday = holidays.find((h) => {
              const hDate = (h.date || '').split('T')[0];
              return hDate === dayFormatted && h.status !== 'Inactive';
            });

            return (
              <div
                key={day.toString()}
                className={`p-2 min-h-[100px] transition-colors ${
                  !isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-400' : 'bg-white dark:bg-slate-900'
                } ${dayHoliday ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">{dayTasks.length} tasks</span>
                  )}
                </div>

                {dayHoliday && (
                  <div
                    className="mb-1.5 px-1.5 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[10px] font-extrabold flex items-center gap-1 shadow-2xs truncate"
                    title={`${dayHoliday.name} (${dayHoliday.type})`}
                  >
                    <PartyPopper className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate">{dayHoliday.name}</span>
                  </div>
                )}

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer truncate shadow-2xs border ${getStatusBadgeStyle(
                        t.status
                      )}`}
                      title={`${t.task_code} - ${t.title}`}
                    >
                      {t.task_code}: {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 block px-1">
                      +{dayTasks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskDetailModal
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
      />
    </div>
  );
}
