import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();

    const handleSessionUpdate = (e) => {
      if (e?.detail && typeof e.detail === 'object' && e.detail.id) {
        setUser(e.detail);
      } else {
        loadUser();
      }
    };

    window.addEventListener('user_session_update', handleSessionUpdate);
    window.addEventListener('otd_storage_update', handleSessionUpdate);
    window.addEventListener('storage', handleSessionUpdate);

    return () => {
      window.removeEventListener('user_session_update', handleSessionUpdate);
      window.removeEventListener('otd_storage_update', handleSessionUpdate);
      window.removeEventListener('storage', handleSessionUpdate);
    };
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Auth load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      notificationService.notifyLogin(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const newUser = await authService.signup(userData);
      setUser(newUser);
      notificationService.notifyLogin(newUser);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user) {
        notificationService.notifyLogout(user);
      }
      await authService.logout();
      localStorage.removeItem('otd_current_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (targetRole) => {
    setLoading(true);
    try {
      const switchedUser = await authService.switchDemoRole(targetRole);
      localStorage.setItem('otd_current_user', JSON.stringify(switchedUser));
      setUser(switchedUser);
      notificationService.notifyLogin(switchedUser);
      window.dispatchEvent(new CustomEvent('user_session_update', { detail: switchedUser }));
      window.dispatchEvent(new CustomEvent('otd_storage_update', { detail: { key: 'otd_current_user' } }));
      return switchedUser;
    } finally {
      setLoading(false);
    }
  };

  const switchUser = (userObj) => {
    if (!userObj) return;
    localStorage.setItem('corporate_system_mock_user', JSON.stringify(userObj));
    localStorage.setItem('otd_current_user', JSON.stringify(userObj));
    setUser(userObj);
    notificationService.notifyLogin(userObj);
    window.dispatchEvent(new CustomEvent('user_session_update', { detail: userObj }));
    window.dispatchEvent(new CustomEvent('otd_storage_update', { detail: { key: 'otd_current_user' } }));
  };

  const updateProfile = async (updateData) => {
    if (!user) return;
    const updated = await authService.updateProfile(user.id, updateData);
    localStorage.setItem('otd_current_user', JSON.stringify(updated));
    setUser(updated);
    window.dispatchEvent(new CustomEvent('user_session_update', { detail: updated }));
    return updated;
  };

  const userRole = (user?.role || (user?.userGroup === 'Admin' ? 'ADMIN' : 'EMPLOYEE')).toUpperCase();
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || user?.userGroup === 'Admin';
  const isManager = userRole === 'MANAGER' || (user?.userGroup && user.userGroup.toLowerCase().includes('manager'));

  // Normalize allowed systems from Supabase public.users
  const allowedModules = React.useMemo(() => {
    if (isAdmin) {
      return [
        'checklist',
        'sales',
        'master-system',
        'purchase',
        'lead-to-orders',
        'hr',
        'petty-expenses',
        'doc-subscription',
        'whatsapp',
        'inventory',
        'mis-summary'
      ];
    }
    const raw = user?.allowed_systems || user?.allowedModules || ['tasks'];
    return raw.map((id) => {
      if (id === 'tasks') return 'checklist';
      if (id === 'petty_expenses') return 'petty-expenses';
      if (id === 'lead_to_orders') return 'lead-to-orders';
      if (id === 'doc_subscription') return 'doc-subscription';
      if (id === 'mis_summary') return 'mis-summary';
      return id;
    });
  }, [user, isAdmin]);

  const value = {
    user,
    role: userRole,
    isAdmin,
    isManager,
    isEmployee: !isAdmin && !isManager,
    allowedModules,
    loading,
    login,
    signup,
    logout,
    switchRole,
    switchUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
