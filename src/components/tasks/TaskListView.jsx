import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_USERS } from '../../services/mockData';
import { DEPARTMENTS, TASK_PRIORITY } from '../../config/constants';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { TaskUpdateModal } from './TaskUpdateModal';
import { TaskDetailModal } from './TaskDetailModal';
import { formatDate } from '../../lib/utils';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../common/TatColumns';
import {
  Search,
  Plus,
  Clock,
  History as HistoryIcon,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Eye,
  Filter,
  CheckSquare,
  ListTodo,
  UserCheck,
  Sparkles,
  Paperclip,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

export function TaskListView({
  category = 'unique', // 'unique' | 'checklist' | 'delegation' | 'all'
  title = 'Unique Task',
  subtitle = 'Manage single, non-recurring deliverables & ad-hoc operational tasks',
  icon: Icon = Sparkles,
  badgeText = 'One-Time Tasks',
  accentColor = 'indigo',
}) {
  const { user, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('pending'); // 'pending' | 'history'

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    priority: 'All',
    department: 'All',
    doerId: 'All',
  });

  // Modal States
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState(null);
  const [selectedTaskIdForDetail, setSelectedTaskIdForDetail] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [user, filters, category]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const queryFilters = {
        ...filters,
        taskType: category === 'all' ? undefined : category,
        // Regular employees only see their assigned tasks
        user: !isAdmin && !isManager ? user : undefined,
      };

      const data = await taskService.getTasks(queryFilters);
      setTasks(data || []);
    } catch (err) {
      console.error(`Failed to load ${category} tasks:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'All',
      priority: 'All',
      department: 'All',
      doerId: 'All',
    });
  };

  // Metrics
  const totalCount = tasks.length;
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status !== 'Completed'), [tasks]);
  const historyTasks = useMemo(() => tasks.filter((t) => t.status === 'Completed'), [tasks]);
  const overdueCount = useMemo(() => tasks.filter((t) => t.status === 'Overdue').length, [tasks]);

  const currentList = statusTab === 'pending' ? pendingTasks : historyTasks;

  const colorStyles = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
      activeTab: 'bg-indigo-600 text-white',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/60',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20',
      activeTab: 'bg-purple-600 text-white',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      activeTab: 'bg-emerald-600 text-white',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
      activeTab: 'bg-blue-600 text-white',
    },
  }[accentColor] || {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
    activeTab: 'bg-indigo-600 text-white',
  };

  return (
    <div className="space-y-3">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colorStyles.bg} ${colorStyles.text}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{title}</h1>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${colorStyles.bg} ${colorStyles.text} border ${colorStyles.border}`}>
                {badgeText}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs: Pending vs History */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setStatusTab('pending')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({pendingTasks.length})</span>
            </button>
            <button
              onClick={() => setStatusTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span>History ({historyTasks.length})</span>
            </button>
          </div>

          {/* Quick Action Button */}
          {(isAdmin || isManager) && (
            <Link
              to={`/task-assignment?type=${category}`}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${colorStyles.btn}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {category === 'unique'
                  ? 'Assign Unique Task'
                  : category === 'checklist'
                  ? 'Assign Checklist'
                  : category === 'delegation'
                  ? 'Delegate Task'
                  : 'Assign Task'}
              </span>
            </Link>
          )}

          {category === 'checklist' && (isAdmin || isManager) && (
            <Link
              to="/checklist/list"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Templates</span>
            </Link>
          )}
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total {title}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Pending Execution</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{pendingTasks.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Completed (History)</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{historyTasks.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Overdue SLA</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{overdueCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="relative lg:col-span-2">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${title} by code, instructions, person...`}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
          />
        </div>

        <div>
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
          >
            <option value="All">All Priorities</option>
            {Object.values(TASK_PRIORITY).map((p) => (
              <option key={p} value={p}>
                {p} Priority
              </option>
            ))}
          </select>
        </div>

        {(isAdmin || isManager) ? (
          <div>
            <select
              value={filters.doerId}
              onChange={(e) => setFilters({ ...filters, doerId: e.target.value })}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
            >
              <option value="All">All Employees</option>
              {INITIAL_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading {title.toLowerCase()} list...</div>
        ) : currentList.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              No {statusTab === 'pending' ? 'pending' : 'completed'} {title.toLowerCase()} found.
            </p>
            <p className="text-[11px] text-slate-400">
              {filters.search || filters.department !== 'All'
                ? 'Try adjusting your search and filter criteria.'
                : 'All caught up! Check back later or create a new task.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2 w-28">Action</th>
                  <th className="px-3 py-2">Task Code</th>
                  <th className="px-3 py-2">Description / Instructions</th>
                  <th className="px-3 py-2">Frequency</th>
                  <th className="px-3 py-2">Assigned By</th>
                  <th className="px-3 py-2">Doer (Assigned To)</th>
                  {statusTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Proof</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {currentList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Action Column */}
                    <td className="px-3 py-1.5 font-semibold">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setSelectedTaskForUpdate(t)}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                        <button
                          onClick={() => setSelectedTaskIdForDetail(t.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View History & Timeline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Task Code */}
                    <td className="px-3 py-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px] whitespace-nowrap">
                      {t.task_code}
                    </td>

                    {/* Task Description */}
                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white max-w-sm truncate text-[11.5px]" title={t.description || t.title}>
                      {t.description || t.title}
                    </td>

                    {/* Frequency */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t.frequency || (category === 'unique' ? 'One Time' : category === 'delegation' ? 'One Time' : 'Daily')}
                      </span>
                    </td>

                    {/* Assigner */}
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px] whitespace-nowrap">
                      {t.assigned_by_name || 'System / Manager'}
                    </td>

                    {/* Doer */}
                    <td className="px-3 py-1.5 text-slate-800 dark:text-slate-200 font-semibold text-[11px] whitespace-nowrap">
                      {t.assigned_to_name || 'Assignee'}
                    </td>

                    {/* Planned / History TAT */}
                    {statusTab === 'pending' ? <PlannedTd task={t} /> : <HistoryTatTd task={t} />}

                    {/* Priority */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>

                    {/* Attachment Required */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {t.required_attachment ? (
                        <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Optional</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Update Modal */}
      <TaskUpdateModal
        isOpen={Boolean(selectedTaskForUpdate)}
        onClose={() => setSelectedTaskForUpdate(null)}
        task={selectedTaskForUpdate}
        onSuccess={loadTasks}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={Boolean(selectedTaskIdForDetail)}
        onClose={() => setSelectedTaskIdForDetail(null)}
        taskId={selectedTaskIdForDetail}
      />
    </div>
  );
}
