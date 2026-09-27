import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { DEPARTMENTS } from '../../config/constants';

export function FilterBar({ filters, onFilterChange, onReset }) {
  const hasActiveFilters =
    filters.search ||
    filters.status !== 'All' ||
    filters.priority !== 'All' ||
    filters.taskType !== 'All' ||
    filters.department !== 'All';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 rounded-xl shadow-xs mb-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, code, employee..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
          />
        </div>

        {/* Status */}
        <div className="w-28 sm:w-32">
          <select
            value={filters.status || 'All'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Not Done">Not Done</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Priority */}
        <div className="w-28 sm:w-32">
          <select
            value={filters.priority || 'All'}
            onChange={(e) => onFilterChange('priority', e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Task Type */}
        <div className="w-28 sm:w-32">
          <select
            value={filters.taskType || 'All'}
            onChange={(e) => onFilterChange('taskType', e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
          >
            <option value="All">All Types</option>
            <option value="checklist">Checklist</option>
            <option value="delegation">Delegation</option>
          </select>
        </div>

        {/* Department */}
        <div className="w-32 sm:w-36">
          <select
            value={filters.department || 'All'}
            onChange={(e) => onFilterChange('department', e.target.value)}
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

        {/* Clear Filters (Inline) */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-bold border border-rose-200 dark:border-rose-900 transition-colors shrink-0"
            title="Reset All Filters"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
