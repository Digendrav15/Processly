import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Check,
  CheckCheck,
  User,
  Users,
  Clock,
  Tag,
  Circle,
  MessageSquare,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

export default function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  currentUserName = 'Vikramaditya Sharma'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'assigned' | 'closed'

  // Tab counters
  const counts = useMemo(() => {
    let unread = 0;
    let assigned = 0;
    let closed = 0;

    chats.forEach((c) => {
      if ((c.unreadCount || 0) > 0) unread++;
      if (c.assignedTo && c.assignedTo !== 'Unassigned') assigned++;
      if (c.status === 'closed') closed++;
    });

    return {
      all: chats.filter((c) => c.status !== 'closed').length,
      unread,
      assigned,
      closed
    };
  }, [chats]);

  // Filtered Chats
  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      // 1. Tab Filter
      if (activeTab === 'unread' && (!chat.unreadCount || chat.unreadCount === 0)) {
        return false;
      }
      if (activeTab === 'assigned' && (!chat.assignedTo || chat.assignedTo === 'Unassigned')) {
        return false;
      }
      if (activeTab === 'closed' && chat.status !== 'closed') {
        return false;
      }
      if (activeTab !== 'closed' && chat.status === 'closed') {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = chat.name?.toLowerCase().includes(q);
        const matchCompany = chat.company?.toLowerCase().includes(q);
        const matchPhone = chat.phone?.toLowerCase().includes(q);
        const matchMsg = chat.lastMessage?.toLowerCase().includes(q);
        const matchTags = chat.tags?.some((t) => t.toLowerCase().includes(q));
        return matchName || matchCompany || matchPhone || matchMsg || matchTags;
      }

      return true;
    });
  }, [chats, activeTab, searchQuery]);

  const formatChatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const dt = new Date(isoString);
      const now = new Date();
      const isToday = dt.toDateString() === now.toDateString();
      if (isToday) {
        return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getTagColor = (tag) => {
    switch (tag) {
      case 'High Priority':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      case 'VIP':
      case 'Enterprise':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
      case 'Payment Pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      case 'Lead':
      case 'New Inquiry':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
      case 'Active Order':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* Search Header */}
      <div className="p-3 space-y-2 border-b border-slate-100 dark:border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Unread</span>
            {counts.unread > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                {counts.unread}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'assigned'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Assigned ({counts.assigned})
          </button>

          <button
            onClick={() => setActiveTab('closed')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'closed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Closed ({counts.closed})
          </button>
        </div>
      </div>

      {/* Chat List Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No chats found</p>
            <p>Try searching another name, phone number, or tag.</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === selectedChatId;
            const hasUnread = (chat.unreadCount || 0) > 0;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`px-3.5 py-3 flex items-start gap-3 cursor-pointer transition-colors relative ${
                  isSelected
                    ? 'bg-slate-100/90 dark:bg-slate-800/90 border-l-4 border-emerald-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Customer Profile Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  {chat.status === 'open' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  )}
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        hasUnread
                          ? 'text-slate-900 dark:text-white font-extrabold'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {chat.name}
                    </span>
                    <span
                      className={`text-[10px] whitespace-nowrap ${
                        hasUnread
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {formatChatTime(chat.lastMessageTime)}
                    </span>
                  </div>

                  {/* Company Name */}
                  <p className="text-[11px] text-slate-400 truncate mb-1">
                    {chat.company}
                  </p>

                  {/* Message Snippet & Unread Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs truncate ${
                        hasUnread
                          ? 'text-slate-800 dark:text-slate-100 font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {chat.lastMessage || 'Start conversation...'}
                    </p>

                    {hasUnread && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Tags & Assigned Agent Chip */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {chat.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${getTagColor(
                          tag
                        )}`}
                      >
                        {tag}
                      </span>
                    ))}
                    {chat.assignedTo && chat.assignedTo !== 'Unassigned' && (
                      <span className="text-[9px] font-medium text-slate-400 flex items-center gap-0.5 ml-auto truncate max-w-[100px]">
                        <User className="w-2.5 h-2.5 text-slate-400" />
                        <span className="truncate">{chat.assignedTo}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
