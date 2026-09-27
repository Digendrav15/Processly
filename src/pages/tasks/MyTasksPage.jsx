import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { FilterBar } from '../../components/common/FilterBar';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { TaskUpdateModal } from '../../components/tasks/TaskUpdateModal';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { formatDate } from '../../lib/utils';
import { Eye, Edit3, CheckSquare, ListTodo, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MyTasksPage() {
  const { user, isAdmin, isManager } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Checklist'); // Checklist OR Delegation only!

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    priority: 'All',
    department: 'All',
  });

  // Modal States
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState(null);
  const [selectedTaskIdForDetail, setSelectedTaskIdForDetail] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [user, filters, activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const combinedFilters = {
        ...filters,
        user,
        taskType: activeTab === 'Checklist' ? 'checklist' : 'delegation',
      };

      const data = await taskService.getTasks(combinedFilters);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load my tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'All',
      priority: 'All',
      department: 'All',
    });
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Page Header with Integrated Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">My Tasks</h1>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              Assigned checklists & delegated operational work items
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Integrated 2 Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('Checklist')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'Checklist'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Checklist</span>
            </button>
            <button
              onClick={() => setActiveTab('Delegation')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'Delegation'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Delegation</span>
            </button>
          </div>

          {(isAdmin || isManager) && (
            <Link
              to="/task-assignment"
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
            >
              <span>Task Assignment Hub</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} onReset={handleResetFilters} />

      {/* High Density Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading your tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No assigned tasks found under {activeTab}.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2 w-28">Action</th>
                  <th className="px-3 py-2">Task Code</th>
                  <th className="px-3 py-2">Task Title</th>
                  <th className="px-3 py-2">Frequency</th>
                  <th className="px-3 py-2">Assigned By</th>
                  <th className="px-3 py-2">Due Date</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Attachment</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Action */}
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
                          title="View History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-3 py-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                      {t.task_code}
                    </td>
                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white max-w-sm truncate text-[11.5px]">
                      {t.title}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t.frequency || (activeTab === 'Delegation' ? 'One Time' : 'Daily')}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                      {t.assigned_by_name || 'Manager'}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                      {formatDate(t.due_date)}
                    </td>
                    <td className="px-3 py-1.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-3 py-1.5">
                      {t.required_attachment ? (
                        <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Optional</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskUpdateModal
        isOpen={Boolean(selectedTaskForUpdate)}
        onClose={() => setSelectedTaskForUpdate(null)}
        task={selectedTaskForUpdate}
        onSuccess={loadTasks}
      />

      <TaskDetailModal
        isOpen={Boolean(selectedTaskIdForDetail)}
        onClose={() => setSelectedTaskIdForDetail(null)}
        taskId={selectedTaskIdForDetail}
      />
    </div>
  );
}

