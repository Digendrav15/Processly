<<<<<<< HEAD
import { INITIAL_NOTIFICATIONS } from './mockData';

const LOCAL_NOTIFS_KEY = 'corporate_system_notifications';
=======
import { INITIAL_NOTIFICATIONS } from './mockData.js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const LOCAL_NOTIFS_KEY = 'corporate_system_notifications';
const READ_IDS_KEY = 'processly_read_notification_ids';

/**
 * Get locally saved read notification IDs
 */
export function getStoredReadIds() {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
}

/**
 * Save read notification IDs to localStorage
 */
export function saveStoredReadIds(idSet) {
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(idSet)));
  } catch (e) {
    console.warn('Failed to save read IDs to localStorage:', e);
  }
}

/**
 * Format relative time (e.g. "Just now", "5 mins ago", "2 hours ago")
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSecs < 45) return 'Just now';
  const diffInMins = Math.floor(diffInSecs / 60);
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Normalize and parse notifications from Supabase `notifications` table or local storage
 * Supports:
 * - Direct columns: id, session_id, message (jsonb), status
 * - Nested JSON or Stringified JSON in `message` column
 * - LangChain / AI human-in-the-loop records: { type: "human" | "ai", content: "..." }
 * - Structured payloads: { title, content, sender, type, metadata: { thread_id, draft_id } }
 */
export function parseNotification(row, readIds = getStoredReadIds()) {
  if (!row) return null;

  let msgObj = {};
  let rawText = '';

  if (typeof row.message === 'string') {
    try {
      msgObj = JSON.parse(row.message);
    } catch (e) {
      rawText = row.message;
    }
  } else if (typeof row.message === 'object' && row.message !== null) {
    msgObj = row.message;
  }

  // Base fields from root row or inside message JSON
  let title = row.title || msgObj.title || '';
  let content =
    row.message && typeof row.message === 'string' && !msgObj.title
      ? rawText || row.message
      : msgObj.content || msgObj.message || msgObj.body || rawText || '';
  let senderEmail =
    row.sender_email || msgObj.sender_email || msgObj.sender || msgObj.email || '';
  let type = row.type || msgObj.type || 'email';
  let status = row.status || msgObj.status || 'draft';
  let metadata = row.metadata || msgObj.metadata || {};
  let isEmailSent = row.is_email_sent ?? msgObj.is_email_sent ?? false;

  // Extract from LangChain / AI agent format (Human vs AI draft)
  if (msgObj.type === 'human' && msgObj.content) {
    type = 'email';
    const senderMatch = msgObj.content.match(/Sender:\s*([^\n\r]+)/i);
    const subjectMatch = msgObj.content.match(/Subject:\s*([^\n\r]+)/i);
    const contentMatch = msgObj.content.match(/Content:\s*([\s\S]*?)(?:\n\n|\r\n\r\n|$)/i);

    if (subjectMatch) title = 'Email: ' + subjectMatch[1].trim();
    else title = 'Incoming Email Inquiry';

    if (senderMatch) senderEmail = senderMatch[1].trim();
    if (contentMatch) content = contentMatch[1].trim();
    else content = msgObj.content;
  } else if (msgObj.type === 'ai' && msgObj.content) {
    type = 'email';
    title = 'AI Drafted Reply';
    content = msgObj.content;
  }

  // Extract clean email if wrapped in angle brackets <test@example.com>
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const match = senderEmail.match(emailRegex);
  const cleanEmail = match ? match[1] : senderEmail;

  // Derive sensible default title if empty
  if (!title) {
    if (type === 'order_received') title = 'New Order Received';
    else if (type === 'support_query') title = 'Support Query';
    else if (type === 'text') title = 'Text Notification';
    else title = `Notification #${row.id}`;
  }

  // Thread ID & Draft ID for Gmail / External linking
  const threadId = metadata.thread_id || msgObj.thread_id || row.thread_id || '';
  const draftId = metadata.draft_id || msgObj.draft_id || row.draft_id || '';

  // Targeted mention details
  const targetUserId = metadata.target_user_id || msgObj.target_user_id || msgObj.user_id || row.user_id || null;
  const targetUserName = metadata.target_user_name || msgObj.target_user_name || '';
  const targetUserEmail = metadata.target_user_email || msgObj.target_user_email || msgObj.email || row.email || '';
  const isTargeted = Boolean(metadata.is_targeted || msgObj.is_targeted || targetUserId || targetUserEmail);
  const replies = Array.isArray(msgObj.replies)
    ? msgObj.replies
    : Array.isArray(metadata.replies)
    ? metadata.replies
    : [];

  // Determine read state
  const isRead = Boolean(
    readIds.has(row.id) ||
    row.is_read ||
    msgObj.is_read ||
    status === 'read'
  );

  return {
    id: row.id,
    session_id: row.session_id || 'general-session',
    title,
    message: content,
    sender_email: cleanEmail,
    sender_raw: senderEmail,
    sender_id: metadata.sender_id || msgObj.sender_id || '',
    sender_name: metadata.sender_name || msgObj.sender_name || '',
    sender_role: metadata.sender_role || msgObj.sender_role || '',
    target_user_id: targetUserId,
    target_user_name: targetUserName,
    target_user_email: targetUserEmail,
    is_targeted: isTargeted,
    replies,
    type: type.toLowerCase(),
    status: (status || 'draft').toLowerCase(),
    is_read: isRead,
    is_email_sent: Boolean(isEmailSent),
    metadata: {
      ...metadata,
      thread_id: threadId,
      draft_id: draftId,
      target_user_id: targetUserId,
      target_user_name: targetUserName,
      target_user_email: targetUserEmail,
      is_targeted: isTargeted,
      replies,
    },
    created_at: row.created_at || msgObj.created_at || new Date().toISOString(),
    raw: row,
  };
}
>>>>>>> daf8de7 ( .gitignore update)

function getStoredNotifications() {
  const stored = localStorage.getItem(LOCAL_NOTIFS_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
}

function saveNotifications(notifs) {
  localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(notifs));
}

export const notificationService = {
<<<<<<< HEAD
  async getNotifications(userId) {
    const all = getStoredNotifications();
    if (!userId) return all;
    return all.filter((n) => n.user_id === userId || !n.user_id);
  },

  async markAsRead(id) {
=======
  /**
   * Fetch notifications from Supabase `notifications` table or local storage
   */
  async getNotifications() {
    const readIds = getStoredReadIds();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('id', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((row) => parseNotification(row, readIds));
        }
        if (error) {
          console.warn('[notificationService] Supabase getNotifications warning:', error.message);
        }
      } catch (err) {
        console.warn('Failed to fetch from Supabase notifications, using local fallback:', err);
      }
    }

    const all = getStoredNotifications();
    return all.map((row) => parseNotification(row, readIds));
  },

  /**
   * Mark a notification as read (updates Supabase jsonb/columns & localStorage)
   */
  async markAsRead(id) {
    const readIds = getStoredReadIds();
    readIds.add(id);
    saveStoredReadIds(readIds);

    if (isSupabaseConfigured && id) {
      try {
        // Try updating message JSONB with is_read: true
        const { data: row } = await supabase
          .from('notifications')
          .select('message, status')
          .eq('id', id)
          .single();

        if (row) {
          let parsed = typeof row.message === 'string' ? JSON.parse(row.message) : { ...row.message };
          parsed.is_read = true;
          await supabase
            .from('notifications')
            .update({ message: parsed })
            .eq('id', id);
        }
      } catch (err) {
        // Handled silently
      }
    }

>>>>>>> daf8de7 ( .gitignore update)
    const all = getStoredNotifications();
    const index = all.findIndex((n) => n.id === id);
    if (index !== -1) {
      all[index].is_read = true;
      saveNotifications(all);
    }
  },

<<<<<<< HEAD
  async markAllAsRead(userId) {
    const all = getStoredNotifications();
    const updated = all.map((n) => (n.user_id === userId ? { ...n, is_read: true } : n));
    saveNotifications(updated);
  },

  async sendNotification({ userId, title, message, type, linkUrl }) {
    const all = getStoredNotifications();
    const newNotif = {
      id: `notif-${Date.now()}`,
      user_id: userId,
      title,
      message,
      type: type || 'general',
      link_url: linkUrl || '/my-tasks',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    all.unshift(newNotif);
    saveNotifications(all);
    return newNotif;
  },

  // Event Helper Notifications
  async notifyTaskAssigned({ doerId, taskTitle, assignedByName }) {
    return this.sendNotification({
      userId: doerId,
      title: '📋 New Task Assigned',
      message: `${assignedByName} assigned you a new task: "${taskTitle}"`,
      type: 'task_assigned',
      linkUrl: '/my-tasks',
    });
  },

  async notifyTaskEdited({ doerId, taskTitle, editedByName }) {
    return this.sendNotification({
      userId: doerId,
      title: '✏️ Task Updated',
      message: `${editedByName} updated task details for "${taskTitle}"`,
      type: 'task_edited',
      linkUrl: '/my-tasks',
    });
  },

  async notifyTaskDeleted({ doerId, taskTitle, deletedByName }) {
    return this.sendNotification({
      userId: doerId,
      title: '❌ Task Removed',
      message: `${deletedByName} deleted task "${taskTitle}"`,
=======
  /**
   * Mark a notification as unread
   */
  async markAsUnread(id) {
    const readIds = getStoredReadIds();
    readIds.delete(id);
    saveStoredReadIds(readIds);

    if (isSupabaseConfigured && id) {
      try {
        const { data: row } = await supabase
          .from('notifications')
          .select('message')
          .eq('id', id)
          .single();

        if (row) {
          let parsed = typeof row.message === 'string' ? JSON.parse(row.message) : { ...row.message };
          parsed.is_read = false;
          await supabase
            .from('notifications')
            .update({ message: parsed })
            .eq('id', id);
        }
      } catch (err) {
        // Handled silently
      }
    }

    const all = getStoredNotifications();
    const index = all.findIndex((n) => n.id === id);
    if (index !== -1) {
      all[index].is_read = false;
      saveNotifications(all);
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(allIds = []) {
    const readIds = getStoredReadIds();
    allIds.forEach((id) => readIds.add(id));
    saveStoredReadIds(readIds);

    const all = getStoredNotifications();
    const updated = all.map((n) => ({ ...n, is_read: true }));
    saveNotifications(updated);
  },

  /**
   * Update notification status (e.g. 'draft' -> 'sent') in Supabase
   */
  async updateStatus(id, newStatus) {
    if (isSupabaseConfigured && id) {
      try {
        await supabase
          .from('notifications')
          .update({ status: newStatus })
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to update status in Supabase:', err);
      }
    }

    const all = getStoredNotifications();
    const idx = all.findIndex((n) => n.id === id);
    if (idx !== -1) {
      all[idx].status = newStatus;
      saveNotifications(all);
    }
  },

  /**
   * Add a reply to a notification thread
   */
  async addReply(notificationId, replyText, currentUser) {
    if (!notificationId || !replyText.trim()) return null;

    const newReply = {
      id: `reply-${Date.now()}`,
      sender_id: currentUser?.id || 'user',
      sender_name: currentUser?.full_name || 'Team Member',
      sender_email: currentUser?.email || 'user@processly.com',
      sender_role: currentUser?.role || 'EMPLOYEE',
      text: replyText.trim(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: row } = await supabase
          .from('notifications')
          .select('message')
          .eq('id', notificationId)
          .single();

        if (row) {
          let parsed = typeof row.message === 'string' ? JSON.parse(row.message) : { ...row.message };
          const replies = Array.isArray(parsed.replies) ? parsed.replies : [];
          replies.push(newReply);
          parsed.replies = replies;

          await supabase
            .from('notifications')
            .update({ message: parsed })
            .eq('id', notificationId);
        }
      } catch (err) {
        console.warn('Failed to update reply in Supabase:', err);
      }
    }

    const all = getStoredNotifications();
    const idx = all.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      if (!all[idx].message.replies) all[idx].message.replies = [];
      all[idx].message.replies.push(newReply);
      saveNotifications(all);
    }

    return newReply;
  },

  /**
   * Visibility Rule:
   * - Admin and Manager can see ALL notifications.
   * - If a notification is targeted/mentioned to a user, ONLY that user (and admin/manager) can see it!
   * - Other employees will NOT see it.
   */
  isNotificationVisibleToUser(notif, currentUser) {
    if (!notif) return false;
    if (!currentUser) return true;

    const role = (currentUser.role || '').toUpperCase();
    const isAdminOrManager =
      role === 'SUPER_ADMIN' ||
      role === 'ADMIN' ||
      role === 'MANAGER' ||
      currentUser.userGroup === 'Admin';

    // Admins and Managers see everything
    if (isAdminOrManager) return true;

    // If targeted to a specific person
    if (notif.is_targeted) {
      const isTargetedToMe =
        (notif.target_user_id && notif.target_user_id === currentUser.id) ||
        (notif.target_user_email && notif.target_user_email.toLowerCase() === currentUser.email?.toLowerCase());

      const wasSentByMe =
        (notif.sender_id && notif.sender_id === currentUser.id) ||
        (notif.sender_email && notif.sender_email.toLowerCase() === currentUser.email?.toLowerCase());

      const isMentionedInText =
        currentUser.full_name &&
        notif.message &&
        notif.message.toLowerCase().includes(`@${currentUser.full_name.toLowerCase()}`);

      return isTargetedToMe || wasSentByMe || isMentionedInText;
    }

    // Untargeted (public/system broadcast) is visible to everyone
    return true;
  },

  /**
   * Setup Supabase Realtime channel listener for INSERT, UPDATE, DELETE events
   */
  subscribeToNotifications(onInsert, onUpdate, onDelete) {
    if (!isSupabaseConfigured) return null;

    const channelName = `notifications_realtime_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          const readIds = getStoredReadIds();
          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(parseNotification(payload.new, readIds));
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(parseNotification(payload.new, readIds));
          } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete(payload.old);
          }
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Send notification with email support
   */
  async sendNotification({
    userId = null,
    email = null,
    senderId = null,
    senderEmail = null,
    title,
    message,
    type = 'email',
    status = 'draft',
    linkUrl = '/notifications',
    isEmailSent = false,
    metadata = {},
  }) {
    const sessionId = `session_${Date.now()}`;
    const messagePayload = {
      title,
      content: message,
      sender: senderEmail || 'system@processly.com',
      sender_email: senderEmail || 'system@processly.com',
      type: type || 'email',
      user_id: userId,
      email: email || 'system@processly.com',
      sender_id: senderId,
      link_url: linkUrl || '/notifications',
      is_read: false,
      is_email_sent: isEmailSent,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    const newNotif = {
      id: `notif-${Date.now()}`,
      session_id: sessionId,
      message: messagePayload,
      status: status || 'draft',
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            session_id: sessionId,
            message: messagePayload,
            status: status || 'draft',
          })
          .select()
          .single();

        if (!error && data) {
          newNotif.id = data.id;
        }
      } catch (err) {
        // Continue with local storage
      }
    }

    const all = getStoredNotifications();
    all.unshift(newNotif);
    saveNotifications(all);
    return parseNotification(newNotif);
  },

  // Event Helper Notifications
  async notifyTaskAssigned({ doerId, doerEmail, taskTitle, assignedByName, assignedByEmail }) {
    return this.sendNotification({
      userId: doerId,
      email: doerEmail,
      senderEmail: assignedByEmail,
      title: '📋 New Task Assigned',
      message: `${assignedByName || 'Manager'} assigned you a new task: "${taskTitle}"`,
      type: 'task_assigned',
      linkUrl: '/my-tasks',
      isEmailSent: true,
    });
  },

  async notifyTaskEdited({ doerId, doerEmail, taskTitle, editedByName, editedByEmail }) {
    return this.sendNotification({
      userId: doerId,
      email: doerEmail,
      senderEmail: editedByEmail,
      title: '✏️ Task Updated',
      message: `${editedByName || 'Manager'} updated task details for "${taskTitle}"`,
      type: 'task_edited',
      linkUrl: '/my-tasks',
      isEmailSent: false,
    });
  },

  async notifyTaskDeleted({ doerId, doerEmail, taskTitle, deletedByName, deletedByEmail }) {
    return this.sendNotification({
      userId: doerId,
      email: doerEmail,
      senderEmail: deletedByEmail,
      title: '❌ Task Removed',
      message: `${deletedByName || 'Manager'} deleted task "${taskTitle}"`,
>>>>>>> daf8de7 ( .gitignore update)
      type: 'task_deleted',
      linkUrl: '/my-tasks',
    });
  },

<<<<<<< HEAD
  async notifyTaskCompleted({ managerId, taskTitle, doerName }) {
    return this.sendNotification({
      userId: managerId,
      title: '✅ Task Completed',
      message: `${doerName} completed task "${taskTitle}"`,
      type: 'task_completed',
      linkUrl: '/task-assignment',
    });
  },

  async notifyTaskTransferred({ toUserId, fromUserName, taskCount, reason }) {
    return this.sendNotification({
      userId: toUserId,
=======
  async notifyTaskCompleted({ managerId, managerEmail, taskTitle, doerName, doerEmail }) {
    return this.sendNotification({
      userId: managerId,
      email: managerEmail,
      senderEmail: doerEmail,
      title: '✅ Task Completed',
      message: `${doerName || 'Associate'} completed task "${taskTitle}"`,
      type: 'task_completed',
      linkUrl: '/task-assignment',
      isEmailSent: true,
    });
  },

  async notifyTaskTransferred({ toUserId, toUserEmail, fromUserName, fromUserEmail, taskCount, reason }) {
    return this.sendNotification({
      userId: toUserId,
      email: toUserEmail,
      senderEmail: fromUserEmail,
>>>>>>> daf8de7 ( .gitignore update)
      title: '🔄 Tasks Transferred (Leave Coverage)',
      message: `${taskCount} task(s) transferred to you from ${fromUserName} due to leave (${reason || 'Leave Delegation'})`,
      type: 'task_transferred',
      linkUrl: '/my-tasks',
<<<<<<< HEAD
=======
      isEmailSent: true,
>>>>>>> daf8de7 ( .gitignore update)
    });
  },

  // User Activity Tracking (Login / Logout / Leave)
  async notifyLogin(user) {
    if (!user) return;
    return this.sendNotification({
<<<<<<< HEAD
      userId: null, // Broadcast to activity center
      title: '🟢 User Session Started',
      message: `User ${user.full_name} (${user.role} - ${user.department_name || 'Operations'}) logged into the system.`,
=======
      userId: null,
      email: user.email || 'all@processly.com',
      senderEmail: user.email,
      title: '🟢 User Session Started',
      message: `User ${user.full_name || user.name} (${user.role} - ${user.department_name || user.department || 'Operations'}) logged into the system.`,
>>>>>>> daf8de7 ( .gitignore update)
      type: 'user_login',
      linkUrl: '/notifications',
    });
  },

  async notifyLogout(user) {
    if (!user) return;
    return this.sendNotification({
<<<<<<< HEAD
      userId: null, // Broadcast to activity center
      title: '🔴 User Logged Out',
      message: `User ${user.full_name} (${user.role}) logged out of the system.`,
=======
      userId: null,
      email: user.email || 'all@processly.com',
      senderEmail: user.email,
      title: '🔴 User Logged Out',
      message: `User ${user.full_name || user.name} (${user.role}) logged out of the system.`,
>>>>>>> daf8de7 ( .gitignore update)
      type: 'user_logout',
      linkUrl: '/notifications',
    });
  },

  async notifyLeaveRequested({ user, startDate, endDate, reason, wantTransfer, preferredSubstituteName }) {
    const transferMsg = wantTransfer && preferredSubstituteName
      ? ` (Requested task transfer to ${preferredSubstituteName})`
      : '';
    return this.sendNotification({
      userId: null,
<<<<<<< HEAD
=======
      email: user.email,
      senderEmail: user.email,
>>>>>>> daf8de7 ( .gitignore update)
      title: '✈️ New Leave Request Submitted',
      message: `${user.full_name} submitted a leave request from ${startDate} to ${endDate}. Reason: "${reason}"${transferMsg}`,
      type: 'leave_requested',
      linkUrl: '/leave-requests',
<<<<<<< HEAD
=======
      isEmailSent: true,
>>>>>>> daf8de7 ( .gitignore update)
    });
  },

  async notifyLeaveApproved({ leaveRequest, approvedBy, substituteName, transferredCount }) {
    const subMsg = substituteName
      ? ` (Tasks transferred to ${substituteName} - ${transferredCount} task(s))`
      : '';
    return this.sendNotification({
      userId: leaveRequest.user_id,
<<<<<<< HEAD
=======
      email: leaveRequest.user_email || 'employee@processly.com',
      senderEmail: approvedBy.email,
>>>>>>> daf8de7 ( .gitignore update)
      title: '✅ Leave Approved',
      message: `Admin ${approvedBy.full_name} approved your leave request for ${leaveRequest.start_date} to ${leaveRequest.end_date}${subMsg}`,
      type: 'leave_approved',
      linkUrl: '/leave-requests',
<<<<<<< HEAD
=======
      isEmailSent: true,
>>>>>>> daf8de7 ( .gitignore update)
    });
  },

  async notifyLeaveRejected({ leaveRequest, rejectedBy, reason }) {
    return this.sendNotification({
      userId: leaveRequest.user_id,
<<<<<<< HEAD
=======
      email: leaveRequest.user_email || 'employee@processly.com',
      senderEmail: rejectedBy.email,
>>>>>>> daf8de7 ( .gitignore update)
      title: '❌ Leave Request Declined',
      message: `Admin ${rejectedBy.full_name} declined your leave request (${leaveRequest.start_date} to ${leaveRequest.end_date}). Reason: ${reason || 'N/A'}`,
      type: 'leave_rejected',
      linkUrl: '/leave-requests',
<<<<<<< HEAD
=======
      isEmailSent: true,
>>>>>>> daf8de7 ( .gitignore update)
    });
  },
};
