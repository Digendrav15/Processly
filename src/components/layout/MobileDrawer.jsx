import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { SYSTEMS_CONFIG } from '../../config/systemsConfig';
import {
  X,
  Building2,
  LayoutDashboard,
  Layers,
  ChevronRight
} from 'lucide-react';

export function MobileDrawer({ isOpen, onClose }) {
  const { user, role, isAdmin, isManager } = useAuth();
  const { switchSystem, systemsList } = useSystem();

  const [expandedModules, setExpandedModules] = useState(() => ({
    checklist: true,
    sales: false,
    purchase: false,
    'lead-to-orders': false,
    hr: false,
    'master-system': false,
    'petty-expenses': false,
    'doc-subscription': false,
    whatsapp: false
  }));

  if (!isOpen) return null;

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-sm flex">
      <div className="w-4/5 max-w-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 min-h-screen flex flex-col justify-between shadow-2xl p-4 overflow-y-auto sidebar-scrollbar border-r border-slate-200 dark:border-slate-800">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">Multi Systems App</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Dashboard Link */}
          <div className="mb-3">
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-2.5 p-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-white border border-indigo-200 dark:border-slate-700 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isAdmin ? 'Admin Dashboard' : isManager ? 'Manager Dashboard' : 'My Dashboard'}</span>
            </NavLink>
          </div>

          <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-2">
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-3 h-3" /> System Modules
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
              {systemsList.length}
            </span>
          </div>

          {/* Modules List */}
          <div className="space-y-1.5">
            {systemsList.map((sys) => {
              const SysIcon = sys.icon;
              const isExpanded = !!expandedModules[sys.id];
              const navItems = sys.navItems.filter((item) => {
                if (item.adminOnly && !isAdmin) return false;
                if (item.requiresSelfAssignOrManager) {
                  if (isAdmin || isManager) return true;
                  return user?.self_assign_enabled !== false;
                }
                return true;
              });

              return (
                <div key={sys.id} className="rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleModule(sys.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-100 dark:border-transparent"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <SysIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="truncate">{sys.name}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-90 text-indigo-600 dark:text-indigo-400' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="pl-4 pr-1 py-1 space-y-1 mt-1 border-l-2 border-slate-200 dark:border-slate-800 ml-3">
                      {navItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => {
                              switchSystem(sys.id, false);
                              onClose();
                            }}
                            className={({ isActive }) =>
                              `flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                isActive
                                  ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold border-l-2 border-indigo-500'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`
                            }
                          >
                            <SubIcon className="w-3.5 h-3.5 opacity-80" />
                            <span className="truncate">{subItem.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mt-4">
          <span>Role: <strong className="text-indigo-600 dark:text-indigo-400">{user?.role || 'Admin'}</strong></span>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 font-semibold">
            Enterprise OS
          </span>
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}
