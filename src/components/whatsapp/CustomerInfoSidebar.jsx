import React, { useState } from 'react';
import {
  X,
  Phone,
  Building2,
  Mail,
  MapPin,
  TrendingUp,
  ShoppingCart,
  FileSpreadsheet,
  DollarSign,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Send,
  Lock,
  Unlock,
  Tag,
  Paperclip,
  FileText
} from 'lucide-react';
import { ERP_AGENTS } from '../../services/whatsappStorageService';

export default function CustomerInfoSidebar({
  chat,
  isOpen,
  onClose,
  onAssignAgent,
  onToggleStatus,
  onSendQuickReminder
}) {
  if (!isOpen || !chat) return null;

  const erp = chat.erpData || {};
  const isClosed = chat.status === 'closed';

  // Extract shared media from messages
  const mediaMessages = (chat.messages || []).filter(
    (m) => m.mediaType === 'image' || m.mediaType === 'document'
  );

  return (
    <div className="w-80 md:w-88 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 overflow-y-auto animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Customer & ERP Profile
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 text-xs">
        {/* Profile Card */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-18 h-18 rounded-full object-cover mx-auto border-2 border-emerald-500 shadow-md"
            />
            <span
              className={`absolute bottom-0 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${
                isClosed ? 'bg-slate-500' : 'bg-emerald-500'
              }`}
            >
              {chat.status}
            </span>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {chat.name}
            </h2>
            <p className="text-slate-500 font-medium">{chat.company}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60">
            <Phone className="w-3.5 h-3.5" />
            <span>{chat.phone}</span>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onToggleStatus(chat.id)}
            className={`px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
              isClosed
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isClosed ? 'Reopen Chat' : 'Close Chat'}</span>
          </button>

          <button
            onClick={() => alert(`Simulated dialing WhatsApp audio call to ${chat.phone}`)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Contact</span>
          </button>
        </div>

        {/* Assigned Agent Selector */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Assigned ERP Executive
          </label>
          <select
            value={chat.assignedTo || 'Unassigned'}
            onChange={(e) => onAssignAgent(chat.id, e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="Unassigned">-- Unassigned --</option>
            {ERP_AGENTS.map((agent) => (
              <option key={agent.id} value={agent.name}>
                {agent.name} ({agent.role})
              </option>
            ))}
          </select>
        </div>

        {/* ERP Cross-Module Linkages */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Connected ERP Records
          </span>

          {/* Related Lead */}
          {erp.leadId && (
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Related Lead
                </span>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {erp.leadId}
                </span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Stage: {erp.leadStage || 'Active'}
              </p>
              <p className="text-[11px] text-slate-500">
                Pipeline Value:{' '}
                <strong className="text-slate-900 dark:text-white">
                  ₹{Number(erp.leadValue || 0).toLocaleString('en-IN')}
                </strong>
              </p>
            </div>
          )}

          {/* Recent Orders */}
          {erp.orders && erp.orders.length > 0 && (
            <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Recent Orders ({erp.orders.length})
                </span>
              </div>
              {erp.orders.map((ord) => (
                <div key={ord.id} className="text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="font-mono text-purple-700 dark:text-purple-300">
                      {ord.id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold">
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 truncate">{ord.title}</p>
                  <p className="text-slate-400 text-[10px]">
                    ₹{Number(ord.amount).toLocaleString('en-IN')} • {ord.date}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Quotations */}
          {erp.quotations && erp.quotations.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Quotations
                </span>
              </div>
              {erp.quotations.map((q) => (
                <div key={q.id} className="flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                      {q.id}
                    </span>
                    <span className="text-slate-400 text-[10px]">{q.status}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{Number(q.total).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pending Payment Card & Reminder Button */}
          {erp.pendingPayment > 0 ? (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Pending Payment
                </span>
                <span className="font-mono text-sm font-black text-rose-700 dark:text-rose-300">
                  ₹{Number(erp.pendingPayment).toLocaleString('en-IN')}
                </span>
              </div>
              <button
                onClick={() =>
                  onSendQuickReminder(
                    `Dear ${chat.name} ji, gentle reminder regarding pending balance of ₹${Number(
                      erp.pendingPayment
                    ).toLocaleString('en-IN')} for your company ${chat.company}. Please share settlement update.`
                  )
                }
                className="w-full px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Payment Reminder</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Zero outstanding balance. All accounts settled.</span>
            </div>
          )}

          {/* Address */}
          {erp.billingAddress && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Site / Billing Location
              </span>
              <p className="text-[11px] leading-relaxed">{erp.billingAddress}</p>
            </div>
          )}

          {/* View Customer Button */}
          <button
            onClick={() =>
              alert(
                `Navigating to ERP Central Customer Master record for ${chat.name} (${erp.customerId || 'CUST-001'})`
              )
            }
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>View Full Customer Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Shared Media in Chat */}
        {mediaMessages.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Shared Media & Docs ({mediaMessages.length})
            </span>
            <div className="space-y-1.5">
              {mediaMessages.map((m) => (
                <div
                  key={m.id}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{m.fileName || 'Attachment'}</span>
                  </div>
                  <span className="text-slate-400 text-[10px] ml-2">{m.fileSize || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
