import React, { useState } from 'react';
import { X, Bookmark, Search, Send, Sparkles, Check } from 'lucide-react';
import { getWhatsAppTemplates } from '../../services/whatsappStorageService';

export default function TemplatesModal({ isOpen, onClose, onSelectTemplate, customer = null }) {
  const [search, setSearch] = useState('');
  const templates = getWhatsAppTemplates();

  if (!isOpen) return null;

  const filtered = templates.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
  });

  const personalizeText = (templateText) => {
    if (!customer) return templateText;
    let res = templateText;
    res = res.replace(/{{customer_name}}/g, customer.name || 'Valued Customer');
    res = res.replace(/{{company}}/g, customer.company || 'Corporate Client');
    const firstOrder = customer.erpData?.orders?.[0];
    res = res.replace(/{{order_id}}/g, firstOrder?.id || 'ORD-2026-001');
    res = res.replace(/{{amount}}/g, Number(customer.erpData?.pendingPayment || 50000).toLocaleString('en-IN'));
    const firstQuote = customer.erpData?.quotations?.[0];
    res = res.replace(/{{quote_no}}/g, firstQuote?.id || 'QT-2026-101');
    res = res.replace(/{{total_amount}}/g, Number(firstQuote?.total || 150000).toLocaleString('en-IN'));
    res = res.replace(/{{agent_name}}/g, customer.assignedTo || 'Our Support Team');
    res = res.replace(/{{courier}}/g, 'V-Trans Logistics');
    res = res.replace(/{{tracking_no}}/g, 'VT-9920148');
    res = res.replace(/{{delivery_date}}/g, '28 Sep 2026');
    res = res.replace(/{{tracking_link}}/g, 'https://track.vtrans.in');
    res = res.replace(/{{invoice_no}}/g, 'INV-2026-4401');
    res = res.replace(/{{account_no}}/g, 'HDFC Bank A/c 502000123456');
    res = res.replace(/{{validity_date}}/g, '15 Oct 2026');
    return res;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-xl">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                WhatsApp Business Templates
              </h3>
              <p className="text-[11px] text-slate-400">
                Official pre-approved templates & canned quick responses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates by name, keyword, category..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Templates List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-3 space-y-2">
          {filtered.map((tpl) => {
            const formatted = personalizeText(tpl.text);
            return (
              <div
                key={tpl.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-slate-50/50 dark:bg-slate-800/30 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {tpl.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {tpl.category}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectTemplate(formatted);
                      onClose();
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
                  >
                    <span>Use Template</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                  {formatted}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
