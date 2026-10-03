import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Globe,
  Radio,
  ExternalLink,
  Save,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';
import {
  getWhatsAppSettings,
  saveWhatsAppSettings,
  simulateCustomerReply,
  getWhatsAppChats
} from '../../services/whatsappStorageService';

export default function WhatsAppSettingsPage() {
  const [settings, setSettings] = useState(getWhatsAppSettings());
  const [copiedKey, setCopiedKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulation test state
  const [chats, setChats] = useState([]);
  const [simContactId, setSimContactId] = useState('');
  const [simText, setSimText] = useState('Bhaiya, hamare dispatch ka update bhej dijiye please.');
  const [simFeedback, setSimFeedback] = useState('');

  useEffect(() => {
    const loaded = getWhatsAppSettings();
    setSettings(loaded);
    const allChats = getWhatsAppChats();
    setChats(allChats);
    if (allChats.length > 0) setSimContactId(allChats[0].id);
  }, []);

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveWhatsAppSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSimulateIncoming = () => {
    if (!simContactId || !simText.trim()) return;
    simulateCustomerReply(simContactId, simText.trim());
    setSimFeedback('Simulated message delivered to Inbox!');
    setTimeout(() => setSimFeedback(''), 3000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <Settings className="w-5 h-5" />
            </div>
            WhatsApp API & Webhook Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Future-ready architecture for Meta Official WhatsApp Cloud API & Webhook connectivity
          </p>
        </div>
      </div>

      {/* Meta API Integration Architecture Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Meta Cloud API Ready (Decoupled Frontend UI)
            </span>
          </div>

          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Clean Architecture: React UI ➔ Backend Webhook ➔ Meta Cloud API
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            This module operates purely on reactive local storage state with zero external dependencies. When your engineering team is ready to connect the live Meta WhatsApp Business API, simply plug your backend endpoint into the parameters below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                Step 1: Frontend UI
              </span>
              <span className="font-semibold text-white">React + Tailwind (Completed)</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                Step 2: Webhook Endpoint
              </span>
              <span className="font-semibold text-white">Node.js / Python / Go</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                Step 3: Meta Official Cloud
              </span>
              <span className="font-semibold text-white">WhatsApp Business Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Globe className="w-4 h-4 text-emerald-600" />
          Meta WhatsApp Cloud API Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              WhatsApp Business Phone Number
            </label>
            <input
              type="text"
              value={settings.phoneNumber || '+91 98200 12345'}
              onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Verified Business Name
            </label>
            <input
              type="text"
              value={settings.businessName || 'Processly ERP'}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Phone Number ID (Meta Graph API)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={settings.phoneNumberId || ''}
                onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={() => handleCopy('phoneId', settings.phoneNumberId)}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {copiedKey === 'phoneId' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              WhatsApp Business Account ID (WABA ID)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={settings.wabaId || ''}
                onChange={(e) => setSettings({ ...settings, wabaId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={() => handleCopy('wabaId', settings.wabaId)}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {copiedKey === 'wabaId' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Configuration Block */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
            Incoming Webhook Callback Setup
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Webhook Callback URL
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={settings.webhookUrl || ''}
                  onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleCopy('webhookUrl', settings.webhookUrl)}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {copiedKey === 'webhookUrl' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                Verify Token
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={settings.verifyToken || ''}
                  onChange={(e) => setSettings({ ...settings, verifyToken: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleCopy('verifyToken', settings.verifyToken)}
                  className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {copiedKey === 'verifyToken' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings updated!
            </span>
          )}
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>

      {/* Interactive Webhook Simulator Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              Webhook Tester & Incoming Simulator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate an incoming WhatsApp customer reply directly into your inbox to test notifications
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Sender Contact
            </label>
            <select
              value={simContactId}
              onChange={(e) => setSimContactId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {chats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
              Simulated Inbound Message
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Type customer reply..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSimulateIncoming}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Inbound</span>
              </button>
            </div>
          </div>
        </div>

        {simFeedback && (
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> {simFeedback}
          </p>
        )}
      </div>
    </div>
  );
}
