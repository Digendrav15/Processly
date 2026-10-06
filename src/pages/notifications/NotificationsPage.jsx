<<<<<<< HEAD
import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  LogIn,
  LogOut,
  ClipboardList,
  Plane,
  ArrowRightLeft,
  Activity,
  Check,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, AUTH, TASKS, LEAVE
  const [searchQuery, setSearchQuery] = useState('');

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_login':
        return <LogIn className="w-4 h-4 text-emerald-500" />;
      case 'user_logout':
        return <LogOut className="w-4 h-4 text-rose-500" />;
      case 'task_assigned':
      case 'task_edited':
      case 'task_completed':
        return <ClipboardList className="w-4 h-4 text-indigo-500" />;
      case 'task_transferred':
        return <ArrowRightLeft className="w-4 h-4 text-amber-500" />;
      case 'leave_requested':
      case 'leave_approved':
      case 'leave_rejected':
        return <Plane className="w-4 h-4 text-sky-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    // Tab Filter
    if (activeTab === 'AUTH' && n.type !== 'user_login' && n.type !== 'user_logout') return false;
    if (
      activeTab === 'TASKS' &&
      n.type !== 'task_assigned' &&
      n.type !== 'task_edited' &&
      n.type !== 'task_completed' &&
      n.type !== 'task_deleted'
    )
      return false;
    if (
      activeTab === 'LEAVE' &&
      n.type !== 'leave_requested' &&
      n.type !== 'leave_approved' &&
      n.type !== 'leave_rejected' &&
      n.type !== 'task_transferred'
    )
      return false;

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }

    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            <span>Activity Log & Notification Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realtime activity feed: user login/logout events, task assignments, leave requests & transfer logs
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveTab('AUTH')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'AUTH'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Login/Logout Logs
          </button>
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'TASKS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Task Assignments
          </button>
          <button
            onClick={() => setActiveTab('LEAVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'LEAVE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Leave & Transfers
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No activity records found under this filter.</div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markAsRead(n.id);
                if (n.link_url) navigate(n.link_url);
              }}
              className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-start justify-between gap-4 transition-colors ${
                !n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                    !n.is_read
                      ? 'bg-indigo-100 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {getActivityIcon(n.type)}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{n.title}</span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block shrink-0"></span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-1.5 font-mono">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(n.id);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
=======
import React, { useState, useMemo } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../services/notificationService';
import { ComposeNotificationModal } from '../../components/notifications/ComposeNotificationModal';
import {
  Bell,
  Mail,
  Package,
  Headphones,
  MessageSquare,
  Clock,
  ExternalLink,
  CheckCircle2,
  Check,
  CheckCheck,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Inbox,
  AlertCircle,
  Send,
  Hash,
  Plus,
  Lock,
  AtSign,
  MessageCircle,
  CornerDownRight,
  User,
} from 'lucide-react';

export function NotificationsPage() {
  const { user, isAdmin, isManager } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    realtimeStatus,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    updateStatus,
    addReply,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('ALL'); // ALL, DRAFTS, SENT, ORDERS, EMAILS, TEXT, MENTIONS
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Replies state: { [notifId]: string }
  const [replyTextMap, setReplyTextMap] = useState({});
  const [sendingReplyId, setSendingReplyId] = useState(null);

  const canCompose = isAdmin || isManager;

  // Filtered and searched notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Unread only toggle
      if (unreadOnly && item.is_read) return false;

      // Tab Filtering
      if (activeTab === 'DRAFTS' && item.status !== 'draft') return false;
      if (activeTab === 'SENT' && item.status !== 'sent') return false;
      if (activeTab === 'ORDERS' && item.type !== 'order_received') return false;
      if (activeTab === 'EMAILS' && item.type !== 'email') return false;
      if (activeTab === 'MENTIONS' && !item.is_targeted) return false;
      if (
        activeTab === 'TEXT' &&
        item.type !== 'text' &&
        item.type !== 'support_query' &&
        item.raw?.message?.type !== 'human' &&
        item.raw?.message?.type !== 'ai'
      ) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = item.title?.toLowerCase().includes(q);
        const inMessage = item.message?.toLowerCase().includes(q);
        const inSender = item.sender_email?.toLowerCase().includes(q) || item.sender_raw?.toLowerCase().includes(q);
        const inSession = item.session_id?.toLowerCase().includes(q);
        const inTarget = item.target_user_name?.toLowerCase().includes(q) || item.target_user_email?.toLowerCase().includes(q);
        return inTitle || inMessage || inSender || inSession || inTarget;
      }

      return true;
    });
  }, [notifications, activeTab, unreadOnly, searchQuery]);

  // Statistics counters
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
      drafts: notifications.filter((n) => n.status === 'draft').length,
      sent: notifications.filter((n) => n.status === 'sent').length,
      orders: notifications.filter((n) => n.type === 'order_received').length,
      emails: notifications.filter((n) => n.type === 'email').length,
      mentions: notifications.filter((n) => n.is_targeted).length,
    };
  }, [notifications]);

  // Copy text helper with timeout
  const handleCopyText = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Gmail redirect handler
  const handleOpenInGmail = (item) => {
    markAsRead(item.id);
    const threadId = item.metadata?.thread_id;
    if (threadId) {
      window.open(`https://mail.google.com/mail/u/0/#inbox/${threadId}`, '_blank', 'noopener,noreferrer');
    } else {
      const query = item.sender_email || item.title || '';
      window.open(`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Mark draft as sent
  const handleMarkAsSent = async (item, e) => {
    e.stopPropagation();
    setStatusUpdatingId(item.id);
    try {
      await updateStatus(item.id, 'sent');
      await markAsRead(item.id);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Submit reply to notification thread
  const handleSendReply = async (notificationId, e) => {
    e.preventDefault();
    const text = replyTextMap[notificationId];
    if (!text || !text.trim()) return;

    setSendingReplyId(notificationId);
    try {
      await addReply(notificationId, text.trim());
      setReplyTextMap((prev) => ({ ...prev, [notificationId]: '' }));
    } catch (err) {
      alert(err.message || 'Failed to post reply');
    } finally {
      setSendingReplyId(null);
    }
  };

  // Type Badge Renderer
  const renderTypeBadge = (type) => {
    switch (type) {
      case 'order_received':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
            <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>📦 Order</span>
          </span>
        );
      case 'support_query':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800">
            <Headphones className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>🎧 Support</span>
          </span>
        );
      case 'text':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800">
            <MessageSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>💬 Text</span>
          </span>
        );
      case 'email':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
            <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>✉️ Email</span>
          </span>
        );
    }
  };

  // Status Badge Renderer
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Draft Ready</span>
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Sent</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800">
            <Clock className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>Pending</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status || 'General'}
          </span>
        );
    }
  };

  return (
    <>
      <ComposeNotificationModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />

      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-500/20">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                  <span>Email & Text Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 text-xs font-black bg-rose-500 text-white rounded-full ring-2 ring-rose-300 dark:ring-rose-950 animate-pulse">
                      {unreadCount} Unread
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Realtime notification feed • Direct @ user mentions, replies & AI draft responses
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Live Realtime Indicator */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
              title="Supabase PostgreSQL Realtime Channel Status"
            >
              <span className="relative flex h-2 w-2">
                {realtimeStatus === 'connected' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    realtimeStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span>{realtimeStatus === 'connected' ? 'Live Realtime' : 'Connecting...'}</span>
            </div>

            {/* Compose Notification Button (Admins & Managers Only) */}
            {canCompose && (
              <button
                onClick={() => setIsComposeOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                title="Compose and mention team members privately"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Compose / @ Mention</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh from Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Mark All As Read */}
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Messages</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{counts.all}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Unread</p>
              {counts.unread > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
            </div>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{counts.unread}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Drafts Ready</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{counts.drafts}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Dispatched / Sent</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{counts.sent}</p>
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setActiveTab('MENTIONS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'MENTIONS'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🔒 @ Mentions</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                {counts.mentions}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('DRAFTS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'DRAFTS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🟡 Drafts</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                {counts.drafts}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('SENT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'SENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🟢 Sent</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                {counts.sent}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ORDERS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>📦 Orders</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                {counts.orders}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('EMAILS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'EMAILS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>✉️ Emails</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10">
                {counts.emails}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('TEXT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'TEXT'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              💬 Text / Chat
            </button>
          </div>

          {/* Search & Unread Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUnreadOnly((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                unreadOnly
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${unreadOnly ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
              <span>Unread Only</span>
            </button>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search sender, @user, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Failed to sync with Supabase: {error}</span>
            </div>
            <button
              onClick={fetchNotifications}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && notifications.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((skeletonKey) => (
              <div
                key={skeletonKey}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    <div className="w-24 h-5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    <div className="w-36 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                  <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
                <div className="w-2/3 h-4 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No notifications found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No messages matched "${searchQuery}". Try modifying your search.`
                : unreadOnly
                ? 'Great job! You have no unread notifications right now.'
                : 'There are no notification records under this category.'}
            </p>
            {(searchQuery || unreadOnly || activeTab !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setUnreadOnly(false);
                  setActiveTab('ALL');
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          /* Notifications List */
          <div className="space-y-3">
            {filteredNotifications.map((item) => {
              const isExpanded = expandedId === item.id;
              const isCopied = copiedId === item.id;
              const isDraft = item.status === 'draft';
              const repliesCount = item.replies?.length || 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-xs transition-all duration-200 overflow-hidden ${
                    !item.is_read
                      ? 'border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/30 dark:bg-indigo-950/20 border-l-4 border-l-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Main Card Header & Preview */}
                  <div
                    className="p-4 sm:p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    {/* Top Badges & Meta Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Type Badge */}
                        {renderTypeBadge(item.type)}

                        {/* Status Badge */}
                        {renderStatusBadge(item.status)}

                        {/* Targeted User Mention Badge */}
                        {item.is_targeted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800">
                            <Lock className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                            <span>@{item.target_user_name || item.target_user_email || 'Direct'}</span>
                          </span>
                        )}

                        {/* Sender Email Badge */}
                        {item.sender_email && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{item.sender_email}</span>
                          </span>
                        )}

                        {/* Session ID Pill */}
                        {item.session_id && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyText(item.id + '_session', item.session_id);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Click to copy Session ID"
                          >
                            <Hash className="w-2.5 h-2.5" />
                            <span>{item.session_id.slice(0, 10)}...</span>
                          </span>
                        )}
                      </div>

                      {/* Relative Timestamp */}
                      <div
                        className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium"
                        title={new Date(item.created_at).toLocaleString()}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatRelativeTime(item.created_at)}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {!item.is_read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block shrink-0 animate-ping"></span>
                        )}
                        <span>{item.title}</span>
                      </h3>

                      <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Message Preview */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                      {item.message || 'No content preview available'}
                    </p>

                    {/* Replies count indicator */}
                    {repliesCount > 0 && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{repliesCount} {repliesCount === 1 ? 'reply' : 'replies'} in thread</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Bar */}
                  <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Left Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Mark as Read / Unread */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.is_read) {
                            markAsUnread(item.id);
                          } else {
                            markAsRead(item.id);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-medium transition-colors ${
                          item.is_read
                            ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                        }`}
                      >
                        {item.is_read ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Mark Unread</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Read</span>
                          </>
                        )}
                      </button>

                      {/* Reply Button (available to all roles) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(item.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Reply {repliesCount > 0 ? `(${repliesCount})` : ''}</span>
                      </button>

                      {/* Open in Gmail Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInGmail(item);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Open in Gmail</span>
                      </button>

                      {/* Mark as Sent (if draft) */}
                      {isDraft && (
                        <button
                          onClick={(e) => handleMarkAsSent(item, e)}
                          disabled={statusUpdatingId === item.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-medium hover:bg-emerald-100 transition-colors shadow-2xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{statusUpdatingId === item.id ? 'Updating...' : 'Mark as Sent'}</span>
                        </button>
                      )}
                    </div>

                    {/* Right Action: Expand/Collapse Toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      {isExpanded ? 'Hide Details' : 'View Full Details & Thread'}
                    </button>
                  </div>

                  {/* Expanded Details Drawer */}
                  {isExpanded && (
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      {/* Full Draft / Message Body */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>
                              {isDraft ? 'AI Drafted Reply Body:' : 'Complete Message Content:'}
                            </span>
                          </span>
                          <button
                            onClick={() => handleCopyText(item.id, item.message)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-sans text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-2xs selection:bg-indigo-100">
                          {item.message}
                        </div>
                      </div>

                      {/* Thread Replies Section */}
                      <div className="space-y-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                            <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Discussion & Replies ({repliesCount})</span>
                          </h4>
                          {item.is_targeted && (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Lock className="w-3 h-3 text-indigo-500" />
                              <span>Private conversation</span>
                            </span>
                          )}
                        </div>

                        {/* List of Previous Replies */}
                        {repliesCount > 0 ? (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {item.replies.map((rep, idx) => (
                              <div
                                key={rep.id || idx}
                                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1 shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                      {rep.sender_name?.charAt(0) || 'U'}
                                    </div>
                                    <span>{rep.sender_name || 'Team Member'}</span>
                                    {rep.sender_role && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                                        {rep.sender_role}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {formatRelativeTime(rep.created_at)}
                                  </span>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 pl-6 leading-relaxed">
                                  {rep.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                            No replies yet. Type below to reply to this message.
                          </div>
                        )}

                        {/* Reply Input Form */}
                        <form
                          onSubmit={(e) => handleSendReply(item.id, e)}
                          className="flex items-center gap-2 pt-1"
                        >
                          <div className="relative flex-1">
                            <input
                              type="text"
                              required
                              placeholder="Write a reply to this notification..."
                              value={replyTextMap[item.id] || ''}
                              onChange={(e) =>
                                setReplyTextMap((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="w-full text-xs pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                            />
                            <CornerDownRight className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                          </div>
                          <button
                            type="submit"
                            disabled={sendingReplyId === item.id || !replyTextMap[item.id]?.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                          >
                            <Send className="w-3 h-3" />
                            <span>{sendingReplyId === item.id ? 'Sending...' : 'Reply'}</span>
                          </button>
                        </form>
                      </div>

                      {/* Technical Info */}
                      <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/60 dark:border-slate-800/80 text-[11px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-slate-500 dark:text-slate-400 font-mono">
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Database ID:</span>{' '}
                          {item.id}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Session:</span>{' '}
                          {item.session_id}
                        </div>
                        {item.target_user_name && (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Mentioned:</span> @
                            {item.target_user_name}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Created:</span>{' '}
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
export default NotificationsPage;
>>>>>>> daf8de7 ( .gitignore update)
