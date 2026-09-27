import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  FileSpreadsheet,
  ShieldCheck,
  FileText,
  CreditCard,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Calendar,
  User
} from 'lucide-react';
import {
  getDocSubData,
  DOC_SUB_KEYS,
  formatDate
} from '../../services/docSubStorageService';

export default function DocSubHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('All');
  const [selectedAction, setSelectedAction] = useState('All');

  const loadLogs = () => {
    setLogs(getDocSubData(DOC_SUB_KEYS.AUDIT_LOGS, []));
  };

  useEffect(() => {
    loadLogs();
    const handleUpdate = () => loadLogs();
    window.addEventListener('docsub_storage_update', handleUpdate);
    return () => window.removeEventListener('docsub_storage_update', handleUpdate);
  }, []);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedEntity !== 'All' && log.entityType !== selectedEntity) return false;
      if (selectedAction !== 'All' && log.action !== selectedAction) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = log.title?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchPerf = log.performedBy?.toLowerCase().includes(q);
        const matchId = log.entityId?.toLowerCase().includes(q);
        return matchTitle || matchDetails || matchPerf || matchId;
      }

      return true;
    });
  }, [logs, selectedEntity, selectedAction, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Entity Type', 'Entity ID', 'Action', 'Title', 'Details', 'Performed By'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.entityType,
      l.entityId,
      l.action,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.performedBy
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'Verified':
      case 'Payment Paid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Renewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'Rejected':
      case 'Expiry Alert':
      case 'Payment Overdue':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      case 'Deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      case 'Created':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-slate-700 text-white rounded-xl shadow-md shadow-slate-700/20">
              <Clock className="w-5 h-5" />
            </div>
            Activity & Audit History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete compliance trail for document verifications, validity renewals, payments, and modifications
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export Audit Trail
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="All">All Entities</option>
            <option value="Document">Documents Only</option>
            <option value="Subscription">Subscriptions Only</option>
            <option value="Payment">Payments Only</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="All">All Actions</option>
            <option value="Created">Created</option>
            <option value="Updated">Updated</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
            <option value="Renewed">Renewed</option>
            <option value="Payment Paid">Payment Paid</option>
            <option value="Expiry Alert">Expiry Alert</option>
            <option value="Deleted">Deleted</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filteredLogs.length}</strong> activity logs
        </div>
      </div>

      {/* History Log Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No audit records match your filters
          </h3>
          <p className="text-xs text-slate-400">All system events are logged in real-time.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-start gap-4"
              >
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                    log.entityType === 'Document'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                      : log.entityType === 'Subscription'
                      ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  {log.entityType === 'Document' ? (
                    <FileText className="w-5 h-5" />
                  ) : log.entityType === 'Subscription' ? (
                    <CreditCard className="w-5 h-5" />
                  ) : (
                    <DollarSign className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                    <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {log.entityId}
                    </span>
                    <span className="text-[11px] text-slate-400">({log.entityType})</span>
                    <span className="text-[11px] text-slate-400 ml-auto">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {log.title}
                  </h4>

                  {log.details && (
                    <p className="text-xs text-slate-500 mt-0.5">{log.details}</p>
                  )}

                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    Performed by: <strong className="text-slate-600 dark:text-slate-300">{log.performedBy}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
