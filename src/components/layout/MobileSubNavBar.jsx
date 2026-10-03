import React, { useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { useAuth } from '../../context/AuthContext';

export function MobileSubNavBar() {
  const { currentSystem } = useSystem();
  const location = useLocation();
  const { isAdmin, isManager, user } = useAuth();
  const scrollRef = useRef(null);

  const isMainDashboard = location.pathname === '/dashboard' || location.pathname === '/admin/dashboard';

  const validNavItems = (currentSystem?.navItems || []).filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.requiresSelfAssignOrManager) {
      if (isAdmin || isManager) return true;
      return user?.self_assign_enabled !== false;
    }
    return true;
  });

  // Auto-scroll active pill into view - always called unconditionally
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [location.pathname]);

  if (isMainDashboard || validNavItems.length <= 1) return null;

  return (
    <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 -mx-3 -mt-3 mb-3.5 px-3 py-2 sticky top-16 z-20 shadow-xs">
      <div
        ref={scrollRef}
        className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {validNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              data-active={isActive ? 'true' : 'false'}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
