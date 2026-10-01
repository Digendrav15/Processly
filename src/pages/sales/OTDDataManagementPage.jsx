import React, { useState } from 'react';
import { Database, Download, Upload, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { exportAllData, importAllData, clearAllOTDData, logAuditAction } from '../../services/otdStorageService';
import { cleanAllModulesDummyData } from '../../services/dataCleanupService';

export function OTDDataManagementPage() {
  const [feedback, setFeedback] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  // Export JSON
  const handleExport = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-to-delivery-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logAuditAction('Data Exported', 'Data Management', 'ALL', { file: link.download });
    setFeedback({ type: 'success', message: 'Local application data backup exported successfully as JSON!' });
  };

  // Import JSON
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = importAllData(evt.target.result);
      if (res.success) {
        logAuditAction('Data Imported', 'Data Management', 'ALL', { fileName: file.name });
        setFeedback({ type: 'success', message: 'Backup JSON data imported successfully! All records restored.' });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    };
    reader.readAsText(file);
  };

  // Clear All Data
  const handleClearAll = () => {
    cleanAllModulesDummyData();
    clearAllOTDData();
    logAuditAction('Data Reset', 'Data Management', 'ALL', {});
    setShowClearModal(false);
    setFeedback({ type: 'success', message: 'All module dummy data has been completely cleared. Desktop local storage is clean and ready for Supabase.' });
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs tracking-wider uppercase border border-emerald-500/30">
              Order To Delivery
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2">Data Management & Local Backups</h1>
          <p className="text-xs text-slate-400 mt-1">Export JSON backups, restore application data, or reset local database.</p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center space-x-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Export JSON Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Export Data Backup</h3>
            <p className="text-xs text-slate-400 mt-1">
              Download all Orders, Customers, Products, Employees, Stages, and TAT configs as a JSON file.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Backup</span>
          </button>
        </div>

        {/* Import JSON Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Import & Restore JSON</h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload a previously saved `.json` backup file to restore application records into LocalStorage.
            </p>
          </div>
          <label className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Select JSON File</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {/* Clear Data Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Reset / Clear All Data</h3>
            <p className="text-xs text-slate-400 mt-1">
              Purge all local application data and reset system to complete empty initial state.
            </p>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR CLEAR ALL DATA */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Are you sure?</h3>
              <p className="text-xs text-rose-600 font-bold mt-2">
                "Are you sure you want to delete all local application data? This action cannot be undone."
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30"
              >
                Yes, Purge Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
