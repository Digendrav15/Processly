import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import {
  X,
  Building2,
  LayoutDashboard,
  Layers,
  ChevronRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export function MobileDrawer({ isOpen, onClose }) {
  const { user, isAdmin, isManager } = useAuth();
  const { activeSystemId, switchSystem, systemsList } = useSystem();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleSelectModule = (sys) => {
    switchSystem(sys.id, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden bg-slate-950/70 backdrop-blur-xs flex animate-in fade-in duration-150">
      <div className="w-[85%] max-w-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 min-h-screen flex flex-col justify-between shadow-2xl p-4 overflow-y-auto sidebar-scrollbar border-r border-slate-200 dark:border-slate-800">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800 mb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block leading-none">
                  Processly
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Enterprise OS</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Main Dashboard Link */}
          <div className="mb-3.5">
            <NavLink
              to="/dashboard"
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>{isAdmin ? 'Admin Dashboard' : isManager ? 'Manager Dashboard' : 'My Dashboard'}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </NavLink>
          </div>

          {/* Module Switcher Header */}
          <div className="px-1 py-1 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-3.5 h-3.5" /> Switch Module
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {systemsList.length} Modules
            </span>
          </div>

          {/* Clean 1-Tap Module Cards (NO internal pages cluttering the sidebar) */}
          <div className="space-y-1.5">
            {systemsList.map((sys) => {
              const SysIcon = sys.icon;
              const isActive = activeSystemId === sys.id;

              return (
                <button
                  key={sys.id}
                  type="button"
                  onClick={() => handleSelectModule(sys)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all active:scale-98 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      <SysIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-extrabold truncate ${
                            isActive
                              ? 'text-indigo-950 dark:text-white'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {sys.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate font-medium">
                        {sys.badge || sys.description}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0 bg-indigo-100/60 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mt-4">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">
              Role: <strong className="text-slate-800 dark:text-slate-200">{user?.role || 'Admin'}</strong>
            </span>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-bold">
            v2.4
          </span>
        </div>
      </div>
      <div className="flex-1 cursor-pointer" onClick={onClose} />
    </div>
  );
}

