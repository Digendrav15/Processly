import React, { useState } from 'react';
import { CheckSquare, Clock, ArrowRight, UserCheck, AlertTriangle, AlertCircle, ShoppingBag } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, getCurrentUser, calculateRemainingTime, calculateTATStatus } from '../../services/otdStorageService';
import { OrderStageModal } from './OrderStageModal';

export function OTDTasksPage() {
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const stages = useOTDStorage(STORAGE_KEYS.STAGES, []);
  const currentUser = getCurrentUser();

  const [selectedOrderForStage, setSelectedOrderForStage] = useState(null);

  // Active open order tasks (non closed orders)
  const myTasks = orders.filter((o) => o.status !== 'Closed');

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            OTD System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">My Tasks</h1>
        </div>
        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs self-start sm:self-auto">
          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-slate-600 dark:text-slate-300">User: <strong className="text-slate-900 dark:text-white">{currentUser?.name || 'Local Admin'}</strong></span>
        </div>
      </div>

      {/* Task List / Empty State */}
      {myTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Pending Tasks</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You have no active pending stage tasks right now. When new orders enter workflow stages, tasks will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 px-3">Order #</th>
                <th className="pb-3 px-3">Customer</th>
                <th className="pb-3 px-3">Current Stage</th>
                <th className="pb-3 px-3">Start Date</th>
                <th className="pb-3 px-3">Planned Date</th>
                <th className="pb-3 px-3">Remaining Time</th>
                <th className="pb-3 px-3">TAT Status</th>
                <th className="pb-3 px-3">Priority</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {myTasks.map((task) => {
                const remaining = calculateRemainingTime(task.plannedCompletionDate);
                const tatStatus = calculateTATStatus(task.stageStartDate, task.plannedCompletionDate);

                return (
                  <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-extrabold text-indigo-600 dark:text-indigo-400">{task.orderNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{task.customerName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                        {task.currentStage}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{task.stageStartDate ? new Date(task.stageStartDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</td>
                    <td className="py-3 px-3 text-slate-500">{task.plannedCompletionDate ? new Date(task.plannedCompletionDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</td>
                    <td className="py-3 px-3">
                      <span className={`font-bold ${remaining.isOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {remaining.text}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tatStatus === 'Overdue'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : tatStatus === 'Due Soon'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {tatStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}
                      >
                        {task.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedOrderForStage(task)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                      >
                        <span>Update Stage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* STAGE EXECUTION MODAL */}
      {selectedOrderForStage && (
        <OrderStageModal
          order={selectedOrderForStage}
          isOpen={!!selectedOrderForStage}
          onClose={() => setSelectedOrderForStage(null)}
          onSuccess={() => setSelectedOrderForStage(null)}
        />
      )}
    </div>
  );
}
