import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_USERS } from '../../services/mockData';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { TaskCompletionModal } from '../../components/tasks/TaskCompletionModal';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { formatDate } from '../../lib/utils';
import {
  CheckSquare,
  ListTodo,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Eye,
  User,
  Plus,
  Send,
  TrendingUp,
  Calendar,
  Sparkles,
  UserCheck,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export function UnifiedDashboard() {
  const { user, isAdmin, isManager } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [checklistsCount, setChecklistsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Admin/Manager filter for viewing specific user stats
  const [selectedUserId, setSelectedUserId] = useState('ALL');
  // Task Type Filter: ALL, checklist, delegation
  const [selectedTaskType, setSelectedTaskType] = useState('ALL');

  // Modals
  const [selectedTaskForCompletion, setSelectedTaskForCompletion] = useState(null);
  const [selectedTaskIdForDetail, setSelectedTaskIdForDetail] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getTasks();
      setAllTasks(data || []);

      const templates = await taskService.getChecklists();
      setChecklistsCount((templates || []).length);
    } catch (err) {
      console.error('Failed to load checklist & delegation dashboard tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading Checklist & Delegation Dashboard...
        </p>
      </div>
    );
  }

  // Filter tasks based on selected employee / user scope
  let scopedTasks = allTasks;
  if (!isAdmin && !isManager) {
    // Employee role: strictly filter for current user
    scopedTasks = allTasks.filter((t) => t.assigned_to === user?.id);
  } else if (selectedUserId !== 'ALL') {
    // Admin/Manager filtering specific employee
    scopedTasks = allTasks.filter((t) => t.assigned_to === selectedUserId);
  }

  // Counts for tabs
  const countAll = scopedTasks.length;
  const countChecklists = scopedTasks.filter((t) => t.type === 'checklist').length;
  const countDelegations = scopedTasks.filter((t) => t.type === 'delegation').length;

  // Task Type Filter (Checklist vs Delegation)
  let displayedTasks = scopedTasks;
  if (selectedTaskType === 'checklist') {
    displayedTasks = scopedTasks.filter((t) => t.type === 'checklist');
  } else if (selectedTaskType === 'delegation') {
    displayedTasks = scopedTasks.filter((t) => t.type === 'delegation');
  }

  // 4 Key Metric Cards Calculations
  const totalTasksCount = displayedTasks.length;
  const pendingTasksCount = displayedTasks.filter(
    (t) => t.status === 'Pending' || t.status === 'In Progress'
  ).length;
  const overdueTasksCount = displayedTasks.filter((t) => t.status === 'Overdue').length;
  const completedTasksCount = displayedTasks.filter((t) => t.status === 'Completed').length;

  // Additional Sub-Breakdown Metrics
  const checklistCompleted = displayedTasks.filter(
    (t) => t.type === 'checklist' && t.status === 'Completed'
  ).length;
  const delegationCompleted = displayedTasks.filter(
    (t) => t.type === 'delegation' && t.status === 'Completed'
  ).length;
  const completionRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const highPriorityPending = displayedTasks.filter(
    (t) => t.priority === 'High' && t.status !== 'Completed'
  ).length;

  // Compute Daily Completion & Overdue Trend data for Recharts (Real data)
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyTrendData = daysOfWeek.map((day, idx) => {
    const dayTasks = displayedTasks.filter((t) => {
      if (!t.due_date) return false;
      const d = new Date(t.due_date);
      const dayIndex = (d.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
      return dayIndex === idx;
    });

    const completed = dayTasks.filter((t) => t.status === 'Completed').length;
    const overdue = dayTasks.filter((t) => t.status === 'Overdue').length;

    return {
      day,
      'Completed Tasks': completed,
      'Overdue Tasks': overdue,
    };
  });

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/80">
            Checklist & Delegation
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Operational Dashboard
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {(isAdmin || isManager) && (
            <>
              <Link
                to="/checklist/create"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Checklist</span>
              </Link>

              <Link
                to="/delegation/create"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Delegate</span>
              </Link>
            </>
          )}

          <Link
            to="/my-tasks"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>My Tasks</span>
          </Link>
        </div>
      </div>

      {/* Operational Highlights Banner */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <ListTodo className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Recurring Checklists
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate block">
              {countChecklists} Active • {checklistCompleted} Done
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Delegated Tasks
            </span>
            <span className="font-extrabold text-slate-900 dark:text-white truncate block">
              {countDelegations} Tasks • {delegationCompleted} Done
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              Completion Rate
            </span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 truncate block">
              {completionRate}% Completed
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
              High Priority Pending
            </span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400 truncate block">
              {highPriorityPending} Urgent
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filters: Task Type Switcher & Employee Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Task Type Filter Pills */}
        <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setSelectedTaskType('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedTaskType === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Tasks ({countAll})
          </button>

          <button
            onClick={() => setSelectedTaskType('checklist')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              selectedTaskType === 'checklist'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Checklists ({countChecklists})</span>
          </button>

          <button
            onClick={() => setSelectedTaskType('delegation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              selectedTaskType === 'delegation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Delegations ({countDelegations})</span>
          </button>
        </div>

        {/* Admin/Manager User Filter */}
        {(isAdmin || isManager) && (
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <Filter className="w-4 h-4 text-indigo-600 ml-1.5" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Assignee:</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white cursor-pointer"
            >
              <option value="ALL">All Team Members</option>
              {INITIAL_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role} - {u.department_name})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Tasks */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Operational Tasks
              </p>
              <h3 className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
                {totalTasksCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-3 block">
            {countChecklists} Checklists • {countDelegations} Delegations
          </span>
        </div>

        {/* 2. Pending Tasks */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-800 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pending Tasks
              </p>
              <h3 className="text-3xl font-extrabold text-amber-500 dark:text-amber-400 mt-2">
                {pendingTasksCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-3 block">Tasks awaiting execution</span>
        </div>

        {/* 3. Overdue Tasks */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-800 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Overdue Tasks
              </p>
              <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
                {overdueTasksCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-3 block">Tasks delayed past due date</span>
        </div>

        {/* 4. Completed Tasks */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Completed Tasks
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                {completedTasksCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-3 block">
            {completionRate}% success rate
          </span>
        </div>
      </div>

      {/* 4. Daily Task Completion & Overdue Trend Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Checklist & Delegation Weekly Execution Trend</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparison of completed tasks vs overdue tasks across the week
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Completed Tasks" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="Overdue Tasks" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Recent Task Activity Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Recent Checklist & Delegation Tasks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live tasks currently in progress, pending update, or recently marked completed
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Showing {Math.min(displayedTasks.length, 10)} of {displayedTasks.length} tasks
          </span>
        </div>

        {displayedTasks.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              No tasks found for the selected scope.
            </p>
            {(isAdmin || isManager) && (
              <div className="flex items-center justify-center space-x-3 pt-2">
                <Link
                  to="/checklist/create"
                  className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Create Checklist
                </Link>
                <Link
                  to="/delegation/create"
                  className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-xs"
                >
                  Delegate Task
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Task Code</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Assigned Doer</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {displayedTasks.slice(0, 10).map((t) => {
                  const isChecklist = t.type === 'checklist';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {t.task_code}
                      </td>
                      <td className="px-4 py-3">
                        {isChecklist ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <ListTodo className="w-3 h-3" />
                            <span>Checklist ({t.frequency || 'Daily'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <UserCheck className="w-3 h-3" />
                            <span>Delegation</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {t.title || t.description}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                        {t.assigned_to_name || 'Assigned User'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                        {formatDate(t.due_date)}
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {t.status !== 'Completed' && t.assigned_to === user?.id && (
                            <button
                              onClick={() => setSelectedTaskForCompletion(t)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              Update
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTaskIdForDetail(t.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Update / Completion Modal */}
      {selectedTaskForCompletion && (
        <TaskCompletionModal
          isOpen={Boolean(selectedTaskForCompletion)}
          onClose={() => setSelectedTaskForCompletion(null)}
          task={selectedTaskForCompletion}
          onSuccess={loadTasks}
        />
      )}

      {/* Task Details Modal */}
      {selectedTaskIdForDetail && (
        <TaskDetailModal
          isOpen={Boolean(selectedTaskIdForDetail)}
          onClose={() => setSelectedTaskIdForDetail(null)}
          taskId={selectedTaskIdForDetail}
        />
      )}
    </div>
  );
}
