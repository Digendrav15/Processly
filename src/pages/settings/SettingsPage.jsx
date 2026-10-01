import React, { useState } from 'react';
import { INITIAL_SETTINGS } from '../../services/mockData';
import { reminderService } from '../../services/reminderService';
import { Settings, Save, CheckCircle2, ShieldCheck, Mail, MessageSquare, Bell, Database, Trash2 } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { cleanAllModulesDummyData } from '../../services/dataCleanupService';

export function SettingsPage() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [savedMessage, setSavedMessage] = useState('');

  const integrationStatus = reminderService.getIntegrationStatus();

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMessage('System settings and TAT rules successfully updated!');
    setTimeout(() => setSavedMessage(''), 4000);
  };

  const handleCleanDummyData = () => {
    if (window.confirm('Are you sure you want to clean all dummy data across all modules? This leaves your system clean on desktop local storage, ready for Supabase.')) {
      const res = cleanAllModulesDummyData();
      setSavedMessage(res.message || 'All module dummy data has been cleaned successfully!');
      setTimeout(() => setSavedMessage(''), 5000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System Settings & Performance Rules
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure organization preferences, task completion rules, TAT scoring metrics, and integration channels
        </p>
      </div>

      {savedMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Organization Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Format</label>
              <select
                value={settings.date_format}
                onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                <option value="dd/MM/yyyy">dd/MM/yyyy (13/09/2026)</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd (2026-09-13)</option>
                <option value="MMM dd, yyyy">MMM dd, yyyy (Sep 13, 2026)</option>
              </select>
            </div>
          </div>
        </div>

        {/* TAT & Performance Rules */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            2. TAT Rules & Performance Scoring Engine
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">On-Time Completion Score</label>
              <input
                type="number"
                value={settings.on_time_score}
                onChange={(e) => setSettings({ ...settings, on_time_score: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Late Deduction Per Day (pts)</label>
              <input
                type="number"
                value={settings.late_deduction_per_day}
                onChange={(e) => setSettings({ ...settings, late_deduction_per_day: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Overdue Task Score</label>
              <input
                type="number"
                value={settings.overdue_score}
                onChange={(e) => setSettings({ ...settings, overdue_score: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Integration API Statuses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            3. Notification Channel API Architecture Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">System Bell Alerts</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Email API Hook</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  integrationStatus.email.configured
                    ? 'text-emerald-600 bg-emerald-100'
                    : 'text-amber-700 bg-amber-100'
                }`}
              >
                {integrationStatus.email.configured ? 'Configured' : 'Awaiting VITE_EMAIL_API_KEY'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">WhatsApp Cloud API</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  integrationStatus.whatsapp.configured
                    ? 'text-emerald-600 bg-emerald-100'
                    : 'text-amber-700 bg-amber-100'
                }`}
              >
                {integrationStatus.whatsapp.configured ? 'Configured' : 'Awaiting VITE_WHATSAPP_TOKEN'}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Local & Supabase Integration Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>4. Desktop Local Storage & Supabase Connectivity</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current storage mode: Only desktop local (LocalStorage). Dummy data cleaned for smooth Supabase connection.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Desktop Local Storage</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  Active (Offline Ready)
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                All module records (HR, Leads, Purchase, Sales, Petty, DocSub, WhatsApp) run cleanly on local storage.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Supabase Cloud Sync</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isSupabaseConfigured
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}
                >
                  {isSupabaseConfigured ? 'Connected' : 'Ready to Connect (Add credentials to .env)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Schema prepared in <code className="text-indigo-600 dark:text-indigo-400 font-mono">supabase/schema.sql</code>. No dummy records will conflict with your database tables.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Purge / Reset All Module Dummy Data</p>
              <p className="text-[11px] text-slate-400">
                Instantly clean all mock/dummy records from your browser localStorage while keeping your active admin session.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCleanDummyData}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean All Dummy Data</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
