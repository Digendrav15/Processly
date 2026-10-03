import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  ChevronDown,
  ChevronsUpDown,
  Check,
  Layers,
  Search,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export function SystemSelector({ variant = 'default', isCollapsed = false }) {
  const { currentSystem, switchSystem, systemsList } = useSystem();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const CurrentIcon = currentSystem.icon;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectSystem = (systemId) => {
    switchSystem(systemId, true);
    setIsOpen(false);
    setSearchQuery('');
  };

  const filteredSystems = useMemo(() => {
    if (!searchQuery.trim()) return systemsList;
    const q = searchQuery.toLowerCase();
    return systemsList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortName?.toLowerCase().includes(q) ||
        s.badge?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    );
  }, [systemsList, searchQuery]);

  // Color mapping helper for radiant visual accents
  const getSystemTheme = (sysId) => {
    switch (sysId) {
      case 'hr':
        return {
          glow: 'from-cyan-500 to-blue-600',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          activeBg: 'bg-gradient-to-r from-cyan-600/30 to-blue-600/20 border-cyan-500/50 text-cyan-200'
        };
      case 'purchase':
        return {
          glow: 'from-amber-500 to-orange-600',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          activeBg: 'bg-gradient-to-r from-amber-600/30 to-orange-600/20 border-amber-500/50 text-amber-200'
        };
      case 'sales':
        return {
          glow: 'from-emerald-500 to-teal-600',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          activeBg: 'bg-gradient-to-r from-emerald-600/30 to-teal-600/20 border-emerald-500/50 text-emerald-200'
        };
      case 'lead-to-orders':
        return {
          glow: 'from-violet-500 to-purple-600',
          badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
          activeBg: 'bg-gradient-to-r from-violet-600/30 to-purple-600/20 border-violet-500/50 text-violet-200'
        };
      case 'master-system':
        return {
          glow: 'from-rose-500 to-pink-600',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          activeBg: 'bg-gradient-to-r from-rose-600/30 to-pink-600/20 border-rose-500/50 text-rose-200'
        };
      case 'inventory':
        return {
          glow: 'from-orange-500 to-amber-600',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          activeBg: 'bg-gradient-to-r from-orange-600/30 to-amber-600/20 border-orange-500/50 text-orange-200'
        };
      default:
        return {
          glow: 'from-indigo-500 to-purple-600',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          activeBg: 'bg-gradient-to-r from-indigo-600/30 to-purple-600/20 border-indigo-500/50 text-indigo-200'
        };
    }
  };

  const currentTheme = getSystemTheme(currentSystem.id);

  // Header compact pill style
  if (variant === 'header') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-all text-left shadow-xs cursor-pointer"
        >
          <div className={`p-1.5 rounded-lg ${currentSystem.bgLight} shrink-0`}>
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                {currentSystem.name}
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                Active
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Switch System</span>
                <p className="text-[10px] text-slate-400">Select active module workspace</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                {systemsList.length} Modules
              </span>
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 sidebar-scrollbar">
              {systemsList.map((sys) => {
                const SysIcon = sys.icon;
                const isSelected = sys.id === currentSystem.id;
                const sysTheme = getSystemTheme(sys.id);
                return (
                  <button
                    key={sys.id}
                    onClick={() => handleSelectSystem(sys.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${sys.bgLight}`}>
                        <SysIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{sys.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight">{sys.badge}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Sidebar expanded / collapsed card style
  return (
    <div className="relative px-3 py-2" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600/80 transition-all text-slate-200 group cursor-pointer shadow-xs ${
          isCollapsed ? 'justify-center px-2' : ''
        }`}
        title={isCollapsed ? `Active System: ${currentSystem.name}` : undefined}
      >
        <div className="flex items-center space-x-3 overflow-hidden min-w-0">
          <div
            className={`p-2 rounded-xl bg-gradient-to-tr ${currentTheme.glow} text-white shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform`}
          >
            <CurrentIcon className="w-4 h-4" />
          </div>

          {!isCollapsed && (
            <div className="text-left truncate min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">
                  Active System
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <h3 className="text-xs font-bold text-white truncate tracking-tight">
                {currentSystem.name}
              </h3>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <ChevronsUpDown
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0 transition-transform duration-200 ml-1 ${
              isOpen ? 'rotate-180 text-indigo-400' : ''
            }`}
          />
        )}
      </button>

      {/* Floating System Switcher Flyout Modal */}
      {isOpen && (
        <>
          {/* Backdrop overlay for focus and quick dismiss */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating Workspace Switcher Popover */}
          <div
            className="fixed z-50 w-84 bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl p-3 text-slate-100 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: isCollapsed ? '84px' : '272px',
              top: '64px'
            }}
          >
            {/* Header */}
            <div className="px-2 py-1.5 border-b border-slate-800/90 mb-2.5 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-white">System Modules</span>
                </div>
                <p className="text-[10px] text-slate-400">Switch workspace to reveal module pages</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative mb-2 px-1">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search systems..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-2 text-slate-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Systems List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 sidebar-scrollbar">
              {filteredSystems.map((sys) => {
                const SysIcon = sys.icon;
                const isSelected = sys.id === currentSystem.id;
                const sysTheme = getSystemTheme(sys.id);

                return (
                  <button
                    key={sys.id}
                    onClick={() => handleSelectSystem(sys.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                      isSelected
                        ? `${sysTheme.activeBg} border shadow-md font-medium`
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isSelected
                            ? `bg-gradient-to-tr ${sysTheme.glow} text-white shadow-md shadow-indigo-500/20`
                            : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                        }`}
                      >
                        <SysIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold truncate text-white">{sys.name}</p>
                          {isSelected && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate leading-tight">
                          {sys.badge} • {sys.navItems?.length || 0} pages
                        </p>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/40">
                        <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Switch →
                      </span>
                    )}
                  </button>
                );
              })}

              {filteredSystems.length === 0 && (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No system found matching "{searchQuery}"
                </div>
              )}
            </div>

            {/* Bottom info pill */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 px-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3 h-3 text-indigo-400" /> All modules unlocked
              </span>
              <span className="text-slate-500">TaskFlow ERP</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
