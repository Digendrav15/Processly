import React, { useState, useEffect, useMemo } from 'react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { TaskUpdateModal } from '../tasks/TaskUpdateModal';
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
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  endOfDay
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PartyPopper,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ListTodo,
  UserCheck,
  Eye,
  Edit3,
  CalendarDays,
  Filter
} from 'lucide-react';
import { getStatusBadgeStyle } from '../../lib/utils';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS } from '../../services/otdStorageService';
import { holidayService } from '../../services/holidayService';

export function TaskCalendarView({ embedded = false }) {
  const { user, isAdmin, isManager } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('Month'); // 'Month' | 'Week' | 'Day'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'unique' | 'checklist' | 'delegation'

  // Modal States
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState(null);

  const holidays = useOTDStorage(STORAGE_KEYS.HOLIDAYS, holidayService.getHolidaysSync());

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // User only sees their tasks unless Admin/Manager
      const data = await taskService.getTasks({
        user: !isAdmin && !isManager ? user : undefined
      });
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load tasks for calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks by classification type
  const filteredTasks = useMemo(() => {
    if (typeFilter === 'ALL') return tasks;
    return tasks.filter((t) => {
      if (typeFilter === 'unique') {
        return t.type === 'unique' || t.task_code?.startsWith('UNQ-') || (t.frequency === 'One Time' && t.assigned_by === t.assigned_to);
      }
      if (typeFilter === 'checklist') {
        return t.type === 'checklist' || t.task_code?.startsWith('TSK-') || (t.frequency && t.frequency !== 'One Time');
      }
      if (typeFilter === 'delegation') {
        return t.type === 'delegation' || t.task_code?.startsWith('DEL-') || (t.frequency === 'One Time' && t.assigned_by !== t.assigned_to);
      }
      return true;
    });
  }, [tasks, typeFilter]);

  // Calendar dates generation based on view mode
  const days = useMemo(() => {
    if (viewMode === 'Month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: startDate, end: endDate });
    }
    if (viewMode === 'Week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
    // Day view
    return [currentDate];
  }, [currentDate, viewMode]);

  // Stepper Handlers
  const handleNext = () => {
    if (viewMode === 'Month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'Week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handlePrev = () => {
    if (viewMode === 'Month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'Week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now);
  };

  // Tasks due on selected date
  const selectedDayTasks = useMemo(() => {
    return filteredTasks.filter((t) => isSameDay(new Date(t.due_date), selectedDay));
  }, [filteredTasks, selectedDay]);

  const selectedDayHoliday = useMemo(() => {
    const formatted = format(selectedDay, 'yyyy-MM-dd');
    return holidays.find((h) => (h.date || '').split('T')[0] === formatted && h.status !== 'Inactive');
  }, [holidays, selectedDay]);

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Date-Wise Task Schedule
              </h2>
              <p className="text-[11px] text-slate-400">
                Click any date to inspect and complete scheduled operational deliverables
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              {['Month', 'Week', 'Day'].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === m
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Stepper with Today Button */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={handlePrev}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2 py-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-900 rounded-md transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs font-black text-slate-800 dark:text-slate-200 px-2 py-1 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
              {format(currentDate, viewMode === 'Day' ? 'EEEE, d MMMM yyyy' : 'MMMM yyyy')}
            </span>
          </div>
        </div>

        {/* Task Type Classification Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter By:
          </span>
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setTypeFilter('unique')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
              typeFilter === 'unique'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Unique Tasks</span>
          </button>
          <button
            onClick={() => setTypeFilter('checklist')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
              typeFilter === 'checklist'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ListTodo className="w-3 h-3" />
            <span>Checklist Tasks</span>
          </button>
          <button
            onClick={() => setTypeFilter('delegation')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
              typeFilter === 'delegation'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Delegation Tasks</span>
          </button>
        </div>
      </div>

      {/* Main Grid + Selected Date Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar Grid (Takes 3 columns on desktop) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Cells */}
          <div className={`grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800 ${viewMode === 'Month' ? 'min-h-[520px]' : 'min-h-[300px]'}`}>
            {days.map((day) => {
              const dayTasks = filteredTasks.filter((t) => isSameDay(new Date(t.due_date), day));
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDay);
              const dayFormatted = format(day, 'yyyy-MM-dd');
              const dayHoliday = holidays.find((h) => {
                const hDate = (h.date || '').split('T')[0];
                return hDate === dayFormatted && h.status !== 'Inactive';
              });

              return (
                <div
                  key={day.toString()}
                  onClick={() => setSelectedDay(day)}
                  className={`p-1.5 sm:p-2 min-h-[90px] sm:min-h-[105px] transition-all cursor-pointer ${
                    !isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-400' : 'bg-white dark:bg-slate-900'
                  } ${dayHoliday ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''} ${
                    isSelected ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/30 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isSelected
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Holiday Badge */}
                  {dayHoliday && (
                    <div
                      className="mb-1 px-1.5 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-[9px] font-extrabold flex items-center gap-1 shadow-2xs truncate"
                      title={`${dayHoliday.name} (${dayHoliday.type})`}
                    >
                      <PartyPopper className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                      <span className="truncate">{dayHoliday.name}</span>
                    </div>
                  )}

                  {/* Tasks List for Day */}
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(t.id);
                        }}
                        className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-semibold cursor-pointer truncate shadow-2xs border ${getStatusBadgeStyle(
                          t.status
                        )}`}
                        title={`${t.task_code}: ${t.description || t.title}`}
                      >
                        {t.task_code}: {t.description || t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 block px-1">
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Inspector Sidebar (Takes 1 column on desktop) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Selected Date</p>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {format(selectedDay, 'EEEE, d MMM yyyy')}
              </h3>
            </div>
            {isSameDay(selectedDay, new Date()) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Today
              </span>
            )}
          </div>

          {/* Holiday Alert if Applicable */}
          {selectedDayHoliday && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-black">
                <PartyPopper className="w-4 h-4" />
                <span>{selectedDayHoliday.name}</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                Official {selectedDayHoliday.type} Holiday declared by company.
              </p>
            </div>
          )}

          {/* Tasks on this date */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[460px] custom-scrollbar pr-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Tasks Due ({selectedDayTasks.length})</span>
            </div>

            {selectedDayTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No tasks scheduled for this day.
              </div>
            ) : (
              selectedDayTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2 hover:border-indigo-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {t.task_code}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                        {t.description || t.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Priority: {t.priority}</span>
                    <span className="font-semibold">{t.status}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() => setSelectedTaskForUpdate(t)}
                      className="flex-1 py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Update</span>
                    </button>
                    <button
                      onClick={() => setSelectedTaskId(t.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailModal
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
      />

      {/* Task Update Modal */}
      <TaskUpdateModal
        isOpen={Boolean(selectedTaskForUpdate)}
        onClose={() => setSelectedTaskForUpdate(null)}
        task={selectedTaskForUpdate}
        onSuccess={loadTasks}
      />
    </div>
  );
}

export default TaskCalendarView;
