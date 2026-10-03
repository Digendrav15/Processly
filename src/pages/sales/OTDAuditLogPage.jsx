import React from 'react';
import { ShieldCheck, Activity, UserCheck, Clock } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS } from '../../services/otdStorageService';

export function OTDAuditLogPage() {
  const auditLogs = useOTDStorage(STORAGE_KEYS.AUDIT_LOGS, []);

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            OTD Security
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Audit Trail & History</h1>
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        {auditLogs.length === 0 ? (
          <div className="py-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Audit Logs Recorded</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              System actions will automatically append to this local audit log.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-3 px-3">Timestamp</th>
                  <th className="pb-3 px-3">Action</th>
                  <th className="pb-3 px-3">Module</th>
                  <th className="pb-3 px-3">Record ID</th>
                  <th className="pb-3 px-3">User</th>
                  <th className="pb-3 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{log.module}</td>
                    <td className="py-3 px-3 font-extrabold text-indigo-600">{log.recordId}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">{log.user}</td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
