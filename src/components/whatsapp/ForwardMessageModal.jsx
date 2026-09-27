import React, { useState } from 'react';
import { X, Search, Forward, CheckCircle2, User } from 'lucide-react';

export default function ForwardMessageModal({
  isOpen,
  onClose,
  message,
  chats,
  currentChatId,
  onConfirmForward
}) {
  const [search, setSearch] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');

  if (!isOpen || !message) return null;

  const eligibleChats = chats.filter((c) => c.id !== currentChatId);
  const filtered = eligibleChats.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const handleForward = () => {
    if (!selectedTargetId) return;
    onConfirmForward(selectedTargetId, message.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 rounded-xl">
              <Forward className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Forward Message to Contact
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Message Preview
          </span>
          <p className="text-slate-700 dark:text-slate-300 italic line-clamp-2">
            "{message.text || `[${message.mediaType || 'Attachment'}]`}"
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contact or company..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-transparent focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
          {filtered.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">No contacts found</p>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedTargetId(c.id)}
                className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                  selectedTargetId === c.id
                    ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{c.company}</p>
                  </div>
                </div>

                {selectedTargetId === c.id && (
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={!selectedTargetId}
            className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Forward className="w-3.5 h-3.5" />
            <span>Forward Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
