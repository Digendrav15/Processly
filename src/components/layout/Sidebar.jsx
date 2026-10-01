import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { SYSTEMS_CONFIG } from '../../config/systemsConfig';
import { taskService } from '../../services/taskService';
import { getData as getOTDData, STORAGE_KEYS as OTD_KEYS } from '../../services/otdStorageService';
import { getPurchaseData, PURCHASE_STORAGE_KEYS } from '../../services/purchaseStorageService';
import { getData as getLTOData, LTO_KEYS } from '../../services/leadToOrderStorageService';
import { getHRData, HR_KEYS } from '../../services/hrStorageService';
import { getPettySummary, initPettyData } from '../../services/pettyStorageService';
import { getDocSubSummary, initDocSubData } from '../../services/docSubStorageService';
import { getWhatsAppSummary, initWhatsAppSeedData } from '../../services/whatsappStorageService';
import {
  Building2,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  ChevronRight,
  Layers
} from 'lucide-react';

export function Sidebar() {
  const { user, isAdmin, isManager } = useAuth();
  const { switchSystem, systemsList } = useSystem();
  const location = useLocation();

  // Sidebar collapsed / expanded preference
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('taskflow_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('taskflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  // State to track which modules are expanded (multi-accordion)
  const [expandedModules, setExpandedModules] = useState(() => {
    const initial = {
      checklist: false,
      sales: false,
      purchase: false,
      'lead-to-orders': false,
      hr: false,
      'master-system': false,
      'petty-expenses': false,
      'doc-subscription': false,
      whatsapp: false,
      'mis-summary': false
    };
    const path = window.location.pathname;
    if (path.startsWith('/mis-summary')) initial['mis-summary'] = true;
    else if (path.startsWith('/hr')) initial.hr = true;
    else if (path.startsWith('/petty-expenses')) initial['petty-expenses'] = true;
    else if (path.startsWith('/doc-subscription')) initial['doc-subscription'] = true;
    else if (path.startsWith('/whatsapp')) initial.whatsapp = true;
    else if (path.startsWith('/purchase')) initial.purchase = true;
    else if (path.startsWith('/sales')) initial.sales = true;
    else if (path.startsWith('/lead-to-orders')) initial['lead-to-orders'] = true;
    else if (path.startsWith('/master-system')) initial['master-system'] = true;
    else if (
      path.startsWith('/checklist') ||
      path.startsWith('/delegation') ||
      path.startsWith('/my-tasks') ||
      path.startsWith('/task-assignment') ||
      path.startsWith('/notifications') ||
      path.startsWith('/calendar') ||
      path.startsWith('/holidays') ||
      path.startsWith('/masters')
    ) {
      initial.checklist = true;
    }
    return initial;
  });

  // Auto-expand module when navigating to one of its subpages
  useEffect(() => {
    const currentPath = location.pathname;
    SYSTEMS_CONFIG.forEach((sys) => {
      const matches = sys.navItems.some(
        (item) =>
          item.path === currentPath ||
          (item.path !== '/dashboard' && currentPath.startsWith(item.path.split('?')[0]))
      );
      if (matches) {
        setExpandedModules((prev) => ({ ...prev, [sys.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleModule = (moduleId) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      localStorage.setItem('taskflow_sidebar_collapsed', 'false');
    }
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Real-time Pending Badge Counts across all modules
  const [pendingBadges, setPendingBadges] = useState({
    checklist: 0,
    sales: 0,
    purchase: 0,
    'lead-to-orders': 0,
    hr: 0,
    'master-system': 0,
    'petty-expenses': 0,
    'doc-subscription': 0,
    whatsapp: 0
  });

  const refreshBadges = async () => {
    try {
      initPettyData();
      initDocSubData();
      initWhatsAppSeedData();

      // 1. Checklist pending tasks
      const tasks = (await taskService.getTasks()) || [];
      const pendingTasks = tasks.filter(
        (t) => t.status === 'Pending' || t.status === 'In Progress' || t.status === 'Overdue'
      ).length;

      // 2. OTD active orders
      const orders = getOTDData(OTD_KEYS.ORDERS, []);
      const pendingOrders = orders.filter(
        (o) => o.status !== 'Delivered' && o.status !== 'Order Closed'
      ).length;

      // 3. Purchase pending
      const indents = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
      const pendingPurchase = indents.filter(
        (p) => p.status === 'Pending Approval' || p.stage === 'Indent Approval' || p.stage === 'Quality Check'
      ).length;

      // 4. Lead to Orders
      const leads = getLTOData(LTO_KEYS.LEADS, []);
      const pendingLeads = leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost').length;

      // 5. HR pending
      const hrIndents = getHRData(HR_KEYS.INDENTS, []);
      const hrInterviews = getHRData(HR_KEYS.INTERVIEWS, []);
      const hrPending =
        hrIndents.filter((i) => i.status === 'Pending Approval').length +
        hrInterviews.filter((i) => i.status === 'Scheduled').length;

      // 6. Petty Expenses pending action items (undeposited cheques + cheques in clearing)
      const pettySummary = getPettySummary();
      const pettyPending = pettySummary.pendingActionCount || 0;

      // 7. Doc & Subscription pending action items (pending verifications, expiring soon, renewal due, payment due)
      const docSubSummary = getDocSubSummary();
      const docSubPending = docSubSummary.pendingActionsCount || 0;

      // 8. WhatsApp unread messages badge
      const waSummary = getWhatsAppSummary();
      const waPending = waSummary.totalUnreadMessages || 0;

      setPendingBadges({
        checklist: pendingTasks,
        sales: pendingOrders,
        purchase: pendingPurchase,
        'lead-to-orders': pendingLeads,
        hr: hrPending,
        'master-system': 0,
        'petty-expenses': pettyPending,
        'doc-subscription': docSubPending,
        whatsapp: waPending
      });
    } catch (e) {
      console.error('Error refreshing sidebar badges:', e);
    }
  };

  useEffect(() => {
    refreshBadges();
    const handleStorageUpdate = () => refreshBadges();

    window.addEventListener('task_update', handleStorageUpdate);
    window.addEventListener('otd_storage_update', handleStorageUpdate);
    window.addEventListener('purchase_storage_update', handleStorageUpdate);
    window.addEventListener('lead_storage_update', handleStorageUpdate);
    window.addEventListener('hr_storage_update', handleStorageUpdate);
    window.addEventListener('petty_storage_update', handleStorageUpdate);
    window.addEventListener('docsub_storage_update', handleStorageUpdate);
    window.addEventListener('whatsapp_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('task_update', handleStorageUpdate);
      window.removeEventListener('otd_storage_update', handleStorageUpdate);
      window.removeEventListener('purchase_storage_update', handleStorageUpdate);
      window.removeEventListener('lead_storage_update', handleStorageUpdate);
      window.removeEventListener('hr_storage_update', handleStorageUpdate);
      window.removeEventListener('petty_storage_update', handleStorageUpdate);
      window.removeEventListener('docsub_storage_update', handleStorageUpdate);
      window.removeEventListener('whatsapp_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // System Theme Color & Glow mapping
  const getSystemTheme = (sysId) => {
    switch (sysId) {
      case 'whatsapp':
        return {
          color: 'text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          activeSub: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-l-2 border-emerald-500'
        };
      case 'doc-subscription':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
          activeSub: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold border-l-2 border-blue-500'
        };
      case 'petty-expenses':
        return {
          color: 'text-teal-600 dark:text-teal-400',
          iconBg: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400',
          activeSub: 'bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold border-l-2 border-teal-500'
        };
      case 'hr':
        return {
          color: 'text-cyan-600 dark:text-cyan-400',
          iconBg: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
          activeSub: 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold border-l-2 border-cyan-500'
        };
      case 'purchase':
        return {
          color: 'text-amber-600 dark:text-amber-400',
          iconBg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
          activeSub: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border-l-2 border-amber-500'
        };
      case 'sales':
        return {
          color: 'text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          activeSub: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-l-2 border-emerald-500'
        };
      case 'lead-to-orders':
        return {
          color: 'text-violet-600 dark:text-violet-400',
          iconBg: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
          activeSub: 'bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-bold border-l-2 border-violet-500'
        };
      case 'master-system':
        return {
          color: 'text-rose-600 dark:text-rose-400',
          iconBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
          activeSub: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold border-l-2 border-rose-500'
        };
      default:
        return {
          color: 'text-indigo-600 dark:text-indigo-400',
          iconBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
          activeSub: 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold border-l-2 border-indigo-500'
        };
    }
  };

  const isMainDashboardActive = location.pathname === '/dashboard' || location.pathname === '/admin/dashboard';

  return (
    <aside
      className={`hidden md:flex flex-col bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 h-screen sticky top-0 self-start border-r border-slate-200 dark:border-slate-800/90 shrink-0 transition-all duration-300 z-40 ${isCollapsed ? 'w-20' : 'w-72'
        }`}
    >
      {/* Brand Header */}
      {!isCollapsed ? (
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-800/90 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight leading-tight truncate">
                Processly
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Enterprise OS
              </span>
            </div>
          </div>

          {/* Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Collapsed Header: Centered Logo Button */
        <div className="flex items-center justify-center h-16 border-b border-slate-200 dark:border-slate-800/90 shrink-0">
          <button
            onClick={toggleCollapse}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 hover:scale-105 transition-all cursor-pointer"
            title="Click to expand sidebar"
          >
            <Building2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Navigation Area */}
      <div className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden sidebar-scrollbar">
        {/* 1. Main Dashboard Link (Role-aware: Admin Dashboard only for Admin) */}
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `w-full flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer group ${isCollapsed ? 'justify-center px-2' : ''
            } ${isActive
              ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-white font-bold border border-indigo-200 dark:border-slate-700/80 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
            }`
          }
          title={isCollapsed ? (isAdmin ? 'Admin Dashboard' : isManager ? 'Manager Dashboard' : 'My Dashboard') : undefined}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${isMainDashboardActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate tracking-tight">
                  {isAdmin ? 'Admin Dashboard' : isManager ? 'Manager Dashboard' : 'My Dashboard'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                  {isAdmin ? 'All Systems Tracking' : isManager ? 'Team & Task Review' : 'My Daily Overview'}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
          )}
        </NavLink>

        {/* Section Label: MODULES (matching reference screenshot) */}
        {!isCollapsed ? (
          <div className="pt-3 pb-1 px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            MODULES
          </div>
        ) : (
          <div className="border-t border-slate-200 dark:border-slate-800 my-2" />
        )}

        {/* Modules List (Directly in Sidebar, click to unhide pages) */}
        {systemsList.map((sys) => {
          const SysIcon = sys.icon;
          const isExpanded = !!expandedModules[sys.id];
          const sysTheme = getSystemTheme(sys.id);
          const pendingCount = pendingBadges[sys.id] || 0;

          // Check if any sub-item is currently active
          const isChildActive = sys.navItems.some(
            (item) => item.path === location.pathname || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
          );

          // Accessible nav items
          const navItems = sys.navItems.filter((item) => {
            if (item.adminOnly && !isAdmin) return false;
            if (item.requiresSelfAssignOrManager) {
              if (isAdmin || isManager) return true;
              return user?.self_assign_enabled !== false;
            }
            return true;
          });

          return (
            <div key={sys.id} className="rounded-xl overflow-hidden transition-all">
              {/* Module Row (Click to toggle expansion) */}
              <button
                onClick={() => toggleModule(sys.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${isCollapsed ? 'justify-center px-2' : ''
                  } ${isChildActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-slate-700/80 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                title={isCollapsed ? `${sys.name} (${pendingCount} pending)` : undefined}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${sysTheme.iconBg}`}>
                    <SysIcon className="w-4 h-4" />
                  </div>
                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block truncate tracking-tight">
                        {sys.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">
                        {sys.badge}
                      </span>
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Red Notification Badge (matching reference screenshot) */}
                    {pendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                        {pendingCount}
                      </span>
                    )}
                    {/* Expandable Chevron Indicator */}
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-indigo-600 dark:text-indigo-400' : ''
                        }`}
                    />
                  </div>
                )}
              </button>

              {/* Unhidden Sub-Pages (Revealed upon clicking the module) */}
              {isExpanded && !isCollapsed && (
                <div className="pl-4 pr-1 py-1 space-y-1 mt-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4.5 animate-in slide-in-from-top-2 duration-150">
                  {navItems.map((subItem, idx) => {
                    const SubIcon = subItem.icon;
                    const prevSub = navItems[idx - 1];
                    const isNewSection = subItem.section && (!prevSub || prevSub.section !== subItem.section);

                    return (
                      <React.Fragment key={subItem.path}>
                        {isNewSection && (
                          <div className="pt-2 pb-0.5 px-2 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {subItem.section}
                          </div>
                        )}
                        {(() => {
                          const currentFullPath = location.pathname + location.search;
                          const isSubActive = subItem.path.includes('?')
                            ? subItem.path === currentFullPath ||
                              (subItem.path.endsWith('?tab=all') && location.pathname === subItem.path.split('?')[0] && !location.search) ||
                              (subItem.path.endsWith('?view=users') && location.pathname === subItem.path.split('?')[0] && !location.search)
                            : location.pathname === subItem.path && (!location.search || subItem.path === '/mis-summary');

                          return (
                            <NavLink
                              to={subItem.path}
                              onClick={() => switchSystem(sys.id, false)}
                              className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all group ${isSubActive
                                ? sysTheme.activeSub
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <SubIcon className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover:opacity-100" />
                              <span className="truncate tracking-tight font-medium text-[11.5px]">
                                {subItem.label}
                              </span>
                            </NavLink>
                          );
                        })()}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/90 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-indigo-500/20">
                {(user?.full_name || user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.full_name || user?.name || 'Administrator'}
                </p>
                <div className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {user?.designation || user?.role || 'Admin'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              {systemsList.length} {systemsList.length === 1 ? 'System' : 'Systems'}
            </div>
          </div>
        ) : (
          <div
            className="flex justify-center"
            title={`${user?.name || 'Admin'} (${user?.role || 'Admin'})`}
          >
            <button
              onClick={toggleCollapse}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md shadow-indigo-500/20 hover:scale-105 transition-all cursor-pointer"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
