import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { userService } from '../../services/userService';
import {
  Bell,
  X,
  Send,
  AtSign,
  User,
  Users,
  Shield,
  Lock,
  Globe,
  Sparkles,
  Check,
} from 'lucide-react';

export function ComposeNotificationModal({ isOpen, onClose }) {
  const { user, isAdmin, isManager } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTargetUser, setSelectedTargetUser] = useState(null); // specific recipient
  const [type, setType] = useState('text'); // 'text', 'email', 'order_received', 'support_query'
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // @ Mention Dropdown State
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef(null);

  const canCompose = isAdmin || isManager;

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setTitle('');
      setMessage('');
      setSelectedTargetUser(null);
      setSuccessMsg('');
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const uList = await userService.getUsers();
      // Exclude current user from mention target list if desired, or keep all
      setUsers(uList || []);
    } catch (err) {
      console.warn('Failed to load users for mention:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtered users for @ mention
  const filteredUsers = users.filter((u) => {
    if (!mentionQuery) return true;
    const q = mentionQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.designation?.toLowerCase().includes(q)
    );
  });

  // Handle textarea text change and @ detection
  const handleTextChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setMessage(val);

    // Look back from cursor to see if user typed @
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const queryAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // If there's no newline or space after @, show mention menu
      if (!queryAfterAt.includes(' ') && !queryAfterAt.includes('\n')) {
        setMentionQuery(queryAfterAt);
        setShowMentionMenu(true);
        setMentionIndex(0);
        return;
      }
    }

    setShowMentionMenu(false);
  };

  // Insert mention into textarea
  const handleSelectMention = (userObj) => {
    if (!userObj) return;
    const cursorPos = textareaRef.current?.selectionStart || message.length;
    const textBeforeCursor = message.slice(0, cursorPos);
    const textAfterCursor = message.slice(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const prefix = lastAtIndex !== -1 ? textBeforeCursor.slice(0, lastAtIndex) : textBeforeCursor;
    const mentionTag = `@${userObj.full_name} `;
    const updatedMessage = prefix + mentionTag + textAfterCursor;

    setMessage(updatedMessage);
    setSelectedTargetUser(userObj);
    setShowMentionMenu(false);

    // Default title if empty
    if (!title) {
      setTitle(`Direct Message for @${userObj.full_name}`);
    }

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (!showMentionMenu) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex((prev) => (prev + 1) % (filteredUsers.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % (filteredUsers.length || 1));
    } else if (e.key === 'Enter' && filteredUsers[mentionIndex]) {
      e.preventDefault();
      handleSelectMention(filteredUsers[mentionIndex]);
    } else if (e.key === 'Escape') {
      setShowMentionMenu(false);
    }
  };

  // Send Notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setSuccessMsg('');

    try {
      const { notificationService } = await import('../../services/notificationService');

      // Compose targeted metadata
      const isTargeted = Boolean(selectedTargetUser);
      const finalTitle = title.trim() || (isTargeted ? `Message for @${selectedTargetUser.full_name}` : 'Team Announcement');

      await notificationService.sendNotification({
        userId: selectedTargetUser?.id || null,
        email: selectedTargetUser?.email || null,
        senderId: user?.id || 'admin',
        senderEmail: user?.email || 'admin@processly.com',
        title: finalTitle,
        message: message.trim(),
        type: isTargeted ? 'text' : type,
        status: 'sent',
        linkUrl: '/notifications',
        isEmailSent: isTargeted,
        metadata: {
          target_user_id: selectedTargetUser?.id || null,
          target_user_name: selectedTargetUser?.full_name || null,
          target_user_email: selectedTargetUser?.email || null,
          is_targeted: isTargeted,
          sender_name: user?.full_name || 'Manager',
          sender_role: user?.role || 'ADMIN',
          replies: [],
        },
      });

      setSuccessMsg('Notification successfully sent!');
      fetchNotifications();

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      alert(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  // Role Gate check: Only Admin & Manager can send
  if (!canCompose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Admin / Manager Access Only</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Only Admins and Managers have permission to broadcast or mention users in notifications. As an employee, you can view your notifications and reply to them.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Create & Send Notification</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  @ Mention Ready
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Type @ in message to mention & target a specific employee privately
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSendNotification} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Target Recipient Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-indigo-500" />
                <span>Target Recipient (Mention Person)</span>
              </span>
              <span className="text-[10px] font-normal text-slate-400">
                {selectedTargetUser ? '🔒 Private to Person' : '🌐 Public / Team'}
              </span>
            </label>
            <select
              value={selectedTargetUser?.id || ''}
              onChange={(e) => {
                const selected = users.find((u) => u.id === e.target.value);
                setSelectedTargetUser(selected || null);
                if (selected && !message.includes(`@${selected.full_name}`)) {
                  setMessage((prev) => `@${selected.full_name} ` + prev);
                }
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            >
              <option value="">🌐 Everyone (Public Broadcast to Team)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  👤 {u.full_name} ({u.role} - {u.designation || u.department_name})
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Alert Badge */}
          {selectedTargetUser ? (
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
              <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                <strong>Confidential Notice:</strong> Only <strong>{selectedTargetUser.full_name}</strong> and Admins/Managers will be able to see this notification.
              </span>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Visible to all team members across the organization.</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Notification Subject / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Project Delivery Review / Urgent Task Notice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-medium"
            />
          </div>

          {/* Message Area with @ Mention Trigger */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Message Content</span>
              </label>
              <span className="text-[10px] text-slate-400">Type @ for team list</span>
            </div>

            <textarea
              ref={textareaRef}
              rows={4}
              required
              placeholder="Type your notification here... Type @ to mention a person"
              value={message}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white leading-relaxed resize-none"
            ></textarea>

            {/* Mention Floating Autocomplete Menu */}
            {showMentionMenu && (
              <div className="absolute left-2 bottom-full mb-1 z-50 w-72 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mention Team Member ({filteredUsers.length})</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">No user matching "@{mentionQuery}"</div>
                  ) : (
                    filteredUsers.map((u, idx) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectMention(u)}
                        className={`p-2.5 flex items-center gap-2.5 cursor-pointer text-xs transition-colors ${
                          idx === mentionIndex
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            idx === mentionIndex
                              ? 'bg-white text-indigo-600'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                          }`}
                        >
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{u.full_name}</p>
                          <p
                            className={`text-[10px] truncate ${
                              idx === mentionIndex ? 'text-indigo-100' : 'text-slate-400'
                            }`}
                          >
                            {u.designation || u.role} • {u.email}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notification Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('text')}
                className={`p-2 text-xs font-bold rounded-xl border transition-all text-center ${
                  type === 'text'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                💬 Text Note
              </button>
              <button
                type="button"
                onClick={() => setType('email')}
                className={`p-2 text-xs font-bold rounded-xl border transition-all text-center ${
                  type === 'email'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                ✉️ Email Alert
              </button>
              <button
                type="button"
                onClick={() => setType('support_query')}
                className={`p-2 text-xs font-bold rounded-xl border transition-all text-center ${
                  type === 'support_query'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                🎧 Support
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send Notification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default ComposeNotificationModal;
