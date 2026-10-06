<<<<<<< HEAD
import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
=======
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
>>>>>>> daf8de7 ( .gitignore update)

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
<<<<<<< HEAD
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await notificationService.getNotifications(user.id);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
=======
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await notificationService.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Fetch on component mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, user]);

  // Setup Supabase Realtime Subscription
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setRealtimeStatus('offline');
      return;
    }

    const channel = notificationService.subscribeToNotifications(
      // On INSERT
      (newNotif) => {
        if (!newNotif) return;
        setNotifications((prev) => {
          // Avoid duplicate entries
          const exists = prev.some((n) => n.id === newNotif.id);
          if (exists) return prev;
          return [newNotif, ...prev];
        });
      },
      // On UPDATE
      (updatedNotif) => {
        if (!updatedNotif) return;
        setNotifications((prev) =>
          prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
        );
      },
      // On DELETE
      (deletedRecord) => {
        if (!deletedRecord?.id) return;
        setNotifications((prev) => prev.filter((n) => n.id !== deletedRecord.id));
      }
    );

    if (channel) {
      setRealtimeStatus('connected');
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAsUnread = async (id) => {
    await notificationService.markAsUnread(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: false } : n))
    );
  };

  const markAllAsRead = async () => {
    const allIds = notifications.map((n) => n.id);
    await notificationService.markAllAsRead(allIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const updateStatus = async (id, newStatus) => {
    await notificationService.updateStatus(id, newStatus);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n))
    );
  };

  const addReply = async (notificationId, replyText) => {
    const reply = await notificationService.addReply(notificationId, replyText, user);
    if (reply) {
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id === notificationId) {
            const currentReplies = n.replies || [];
            return { ...n, replies: [...currentReplies, reply] };
          }
          return n;
        })
      );
    }
    return reply;
  };

  // User-filtered notifications (Admin/Manager see all; regular employee sees only targeted to them or public)
  const visibleNotifications = React.useMemo(() => {
    return notifications.filter((n) => notificationService.isNotificationVisibleToUser(n, user));
  }, [notifications, user]);

  const unreadCount = visibleNotifications.filter((n) => !n.is_read).length;
>>>>>>> daf8de7 ( .gitignore update)

  return (
    <NotificationContext.Provider
      value={{
<<<<<<< HEAD
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
=======
        notifications: visibleNotifications,
        allNotifications: notifications,
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
>>>>>>> daf8de7 ( .gitignore update)
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
<<<<<<< HEAD
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
=======
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
>>>>>>> daf8de7 ( .gitignore update)
  return context;
}
