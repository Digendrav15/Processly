import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SYSTEMS_CONFIG } from '../config/systemsConfig';
import { useAuth } from './AuthContext';

const SystemContext = createContext();

export function SystemProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSystemId, setActiveSystemId] = useState(() => {
    return localStorage.getItem('taskflow_active_system') || 'checklist';
  });

  // Strict Module Permission Filtering
  const systemsList = useMemo(() => {
    const roleUpper = (user?.role || '').toUpperCase();
    const isAdmin =
      roleUpper === 'SUPER_ADMIN' ||
      roleUpper === 'ADMIN' ||
      user?.userGroup === 'Admin' ||
      (typeof user?.userGroup === 'string' && user.userGroup.toLowerCase() === 'admin');

    if (isAdmin) {
      return SYSTEMS_CONFIG;
    }

    // 2. Explicit allowedModules list for non-admin users
    const allowed = user?.allowedModules;
    if (Array.isArray(allowed) && allowed.length > 0) {
      const filtered = SYSTEMS_CONFIG.filter((sys) => allowed.includes(sys.id));
      if (filtered.length > 0) return filtered;
    }

    // 3. Default fallback
    return [SYSTEMS_CONFIG[0]];
  }, [user]);

  const hasModuleAccess = (systemId) => {
    return systemsList.some((sys) => sys.id === systemId);
  };

  const currentSystem = systemsList.find((sys) => sys.id === activeSystemId) || systemsList[0] || SYSTEMS_CONFIG[0];

  // If current activeSystem is not in systemsList, fallback immediately
  useEffect(() => {
    if (systemsList.length > 0 && !systemsList.some((s) => s.id === activeSystemId)) {
      setActiveSystemId(systemsList[0].id);
      localStorage.setItem('taskflow_active_system', systemsList[0].id);
    }
  }, [systemsList, activeSystemId]);

  const switchSystem = (systemId, shouldNavigate = true) => {
    const targetSystem = systemsList.find((sys) => sys.id === systemId);
    if (!targetSystem) return;

    setActiveSystemId(systemId);
    localStorage.setItem('taskflow_active_system', systemId);

    if (shouldNavigate) {
      navigate(targetSystem.defaultPath);
    }
  };

  // Sync current active system if URL path belongs directly to a specific system
  useEffect(() => {
    const currentPath = location.pathname;

    // Find matching system for current path
    const matchingSystem = systemsList.find((sys) => {
      if (sys.id === 'checklist' && (
        currentPath.startsWith('/checklist') ||
        currentPath.startsWith('/delegation') ||
        currentPath.startsWith('/my-tasks') ||
        currentPath.startsWith('/task-assignment') ||
        currentPath.startsWith('/notifications') ||
        currentPath.startsWith('/calendar') ||
        currentPath.startsWith('/holidays')
      )) return true;
      if (sys.id === 'hr' && currentPath.startsWith('/hr')) return true;
      if (sys.id === 'petty-expenses' && currentPath.startsWith('/petty-expenses')) return true;
      if (sys.id === 'doc-subscription' && currentPath.startsWith('/doc-subscription')) return true;
      if (sys.id === 'whatsapp' && currentPath.startsWith('/whatsapp')) return true;
      if (sys.id === 'sales' && currentPath.startsWith('/sales')) return true;
      if (sys.id === 'purchase' && currentPath.startsWith('/purchase')) return true;
      if (sys.id === 'lead-to-orders' && currentPath.startsWith('/lead-to-orders')) return true;
      if (sys.id === 'master-system' && currentPath.startsWith('/master-system')) return true;
      if (sys.id === 'inventory' && currentPath.startsWith('/inventory')) return true;
      return sys.navItems.some((item) => item.path === currentPath);
    });

    if (matchingSystem && matchingSystem.id !== activeSystemId) {
      setActiveSystemId(matchingSystem.id);
      localStorage.setItem('taskflow_active_system', matchingSystem.id);
    }
  }, [location.pathname, systemsList, activeSystemId]);

  return (
    <SystemContext.Provider
      value={{
        activeSystemId,
        currentSystem,
        switchSystem,
        systemsList,
        hasModuleAccess,
        currentUser: user,
        user
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
