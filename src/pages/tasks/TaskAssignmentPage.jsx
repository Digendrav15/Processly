import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENTS, FREQUENCIES, TASK_PRIORITY } from '../../config/constants';
import { INITIAL_USERS } from '../../services/mockData';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../lib/utils';
import { Plus, Edit2, Trash2, Search, Users, Check, ChevronDown, X, AlertCircle } from 'lucide-react';

export function TaskAssignmentPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form Fields - REQUIREMENT #1: Task Title is REMOVED! Only Description is used.
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('dept-ops');
  const [assignFrom, setAssignFrom] = useState(user?.id || INITIAL_USERS[0].id);
  const [selectedDoerIds, setSelectedDoerIds] = useState([]);
  const [priority, setPriority] = useState('Medium');
  const [frequency, setFrequency] = useState('One Time');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [requiredAttachment, setRequiredAttachment] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [formError, setFormError] = useState('');

  // Doer Dropdown Popover State
  const [showDoerDropdown, setShowDoerDropdown] = useState(false);

  // Table Filters
  const [filters, setFilters] = useState({
    search: '',
    department: 'All',
    doerId: 'All',
    frequency: 'All',
  });

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getTasks(filters);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load assigned tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDoer = (doerId) => {
    setSelectedDoerIds((prev) =>
      prev.includes(doerId) ? prev.filter((id) => id !== doerId) : [...prev, doerId]
    );
  };

  const handleSelectAllDoers = () => {
    if (selectedDoerIds.length === INITIAL_USERS.length) {
      setSelectedDoerIds([]);
    } else {
      setSelectedDoerIds(INITIAL_USERS.map((u) => u.id));
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setDescription('');
    setDepartmentId('dept-ops');
    setAssignFrom(user?.id || INITIAL_USERS[0].id);
    setSelectedDoerIds([]);
    setPriority('Medium');
    setFrequency('One Time');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setRequiredAttachment(false);
    setReminderEnabled(true);
    setFormError('');
    setShowDoerDropdown(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t) => {
    setEditingTask(t);
    setDescription(t.description || t.title || '');
    setDepartmentId(t.department_id || 'dept-ops');
    setAssignFrom(t.assigned_by);
    setSelectedDoerIds([t.assigned_to]);
    setPriority(t.priority || 'Medium');
    setFrequency(t.frequency || (t.type === 'delegation' ? 'One Time' : 'Daily'));
    setStartDate(t.start_date ? t.start_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setDueDate(t.due_date ? new Date(t.due_date).toISOString().slice(0, 16) : '');
    setRequiredAttachment(Boolean(t.required_attachment));
    setReminderEnabled(Boolean(t.reminder_enabled));
    setFormError('');
    setShowDoerDropdown(false);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setFormError('Please enter Task Description.');
      return;
    }

    if (!dueDate) {
      setFormError('Please specify End Date / Due Date.');
      return;
    }

    if (!editingTask && selectedDoerIds.length === 0) {
      setFormError('Please select at least one Doer (employee).');
      return;
    }

    setFormError('');

    try {
      const selectedDept = DEPARTMENTS.find((d) => d.id === departmentId);
      const deptName = selectedDept?.name || 'Operations';
      const taskTitle = description.length > 60 ? `${description.slice(0, 60)}...` : description;

      if (editingTask) {
        await taskService.updateTask(
          editingTask.id,
          {
            title: taskTitle,
            description,
            department_id: departmentId,
            department_name: deptName,
            priority,
            frequency,
            start_date: startDate,
            due_date: new Date(dueDate).toISOString(),
            required_attachment: requiredAttachment,
            reminder_enabled: reminderEnabled,
          },
          user
        );
      } else {
        const doerObjs = INITIAL_USERS.filter((u) => selectedDoerIds.includes(u.id)).map((u) => ({
          id: u.id,
          name: u.full_name,
        }));

        await taskService.createTaskAssignment(
          {
            title: taskTitle,
            description,
            department_id: departmentId,
            department_name: deptName,
            doers: doerObjs,
            priority,
            frequency,
            start_date: startDate,
            due_date: dueDate,
            required_attachment: requiredAttachment,
            reminder_enabled: reminderEnabled,
          },
          user
        );
      }

      setIsModalOpen(false);
      loadTasks();
    } catch (err) {
      setFormError(err.message || 'Failed to assign tasks.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this assigned task?')) return;
    try {
      await taskService.deleteTask(taskId, user);
      loadTasks();
    } catch (err) {
      alert(err.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Top Header & + New Task Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-xs">
        <div>
          <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">
            Task Assignment Hub
          </h1>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            Assign tasks to single or multiple doers with automatic frequency routing & action controls
          </span>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search task description, code..."
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
            value={filters.doerId}
            onChange={(e) => setFilters({ ...filters, doerId: e.target.value })}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
          >
            <option value="All">All Doers (Employees)</option>
            {INITIAL_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filters.frequency}
            onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
          >
            <option value="All">All Frequencies</option>
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table: 1st Column = Action */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading assigned tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No assigned tasks found.</div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2 w-20">Action</th>
                  <th className="px-3 py-2">Task Code</th>
                  <th className="px-3 py-2">Task Description</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Assign From</th>
                  <th className="px-3 py-2">Doer's Name</th>
                  <th className="px-3 py-2">Frequency</th>
                  <th className="px-3 py-2">End Date</th>
                  <th className="px-3 py-2">Attachment</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-1.5 font-semibold">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md transition-colors cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-md transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="px-3 py-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">{t.task_code}</td>
                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white max-w-sm truncate text-[11.5px]">
                      {t.description || t.title}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px]">{t.department_name}</td>
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px]">{t.assigned_by_name || 'Manager'}</td>
                    <td className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200 text-[11px]">{t.assigned_to_name}</td>
                    <td className="px-3 py-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {t.frequency || (t.type === 'delegation' ? 'One Time' : 'Daily')}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px]">{formatDate(t.due_date)}</td>
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

      {/* Task Form Modal - NO Task Title Input */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Assigned Task' : 'Assign New Task'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center space-x-2 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign From (Assigner) *</label>
              <select
                value={assignFrom}
                onChange={(e) => setAssignFrom(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                {INITIAL_USERS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* REQUIREMENT #1: Doer's Name Multi-Select Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Doer's Name (Select Multiple Employees) *
            </label>
            <div
              onClick={() => setShowDoerDropdown(!showDoerDropdown)}
              className="w-full min-h-[38px] p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-indigo-500"
            >
              <div className="flex flex-wrap gap-1.5 items-center">
                {selectedDoerIds.length === 0 ? (
                  <span className="text-xs text-slate-400">Select one or multiple doers...</span>
                ) : (
                  INITIAL_USERS.filter((u) => selectedDoerIds.includes(u.id)).map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold"
                    >
                      <span>{u.full_name}</span>
                      <X
                        className="w-3 h-3 hover:text-rose-500 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDoer(u.id);
                        }}
                      />
                    </span>
                  ))
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </div>

            {/* Dropdown Popover */}
            {showDoerDropdown && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 max-h-48 overflow-y-auto space-y-1">
                <div
                  onClick={handleSelectAllDoers}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1"
                >
                  <span>Select All / Deselect All</span>
                  {selectedDoerIds.length === INITIAL_USERS.length && <Check className="w-4 h-4 text-indigo-600" />}
                </div>

                {INITIAL_USERS.map((u) => {
                  const isSelected = selectedDoerIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleDoer(u.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <div>
                        <span>{u.full_name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-normal">({u.department_name})</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* REQUIREMENT #1: TASK DESCRIPTION ONLY (No Task Title input) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Description & Instructions *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Enter detailed task instructions, work specifications & deliverable requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date / Due Date *</label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Frequency *</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-bold"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f} {f === 'One Time' ? '(Delegation)' : '(Checklist)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiredAttachment}
                onChange={(e) => setRequiredAttachment(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Required Attachment</span>
                <span className="text-[10px] text-slate-400 block">Mandatory file upload on complete</span>
              </div>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Reminder Alerts</span>
                <span className="text-[10px] text-slate-400 block">Enable notification alerts</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20"
            >
              {editingTask ? 'Save Changes' : `Assign to ${selectedDoerIds.length} Doer(s)`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
