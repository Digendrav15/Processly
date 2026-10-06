import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSystem } from '../../context/SystemContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
<<<<<<< HEAD
import { Bell, Menu, User, LogOut, CheckCircle, Check, Shield, Users as UsersIcon, Search } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { INITIAL_USERS } from '../../services/mockData';
=======
import { formatRelativeTime } from '../../services/notificationService';
import { Bell, Menu, User, LogOut, CheckCircle, Check, Shield, Search, Building2, IdCard, Plus } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ComposeNotificationModal } from '../notifications/ComposeNotificationModal';
>>>>>>> daf8de7 ( .gitignore update)

export function Header({ onOpenMobileMenu }) {
  const { user, isAdmin, isManager, logout, switchUser } = useAuth();
  const { currentSystem } = useSystem();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
<<<<<<< HEAD
=======
  const [isComposeOpen, setIsComposeOpen] = useState(false);
>>>>>>> daf8de7 ( .gitignore update)
  const navigate = useNavigate();
  const location = useLocation();

  const isMainDashboard = location.pathname === '/dashboard';
  const dashboardTitle = isAdmin ? 'Admin Dashboard' : isManager ? 'Manager Dashboard' : 'My Dashboard';
  const dashboardBadge = isAdmin ? 'All Systems Hub' : isManager ? 'Team Review' : 'My Workspace';

  // Global Ctrl + K / Cmd + K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowGlobalSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <GlobalSearchModal isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
<<<<<<< HEAD
=======
      <ComposeNotificationModal isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)} />
>>>>>>> daf8de7 ( .gitignore update)
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left Mobile Menu Toggle + Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Processly</p>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>{isMainDashboard ? dashboardTitle : currentSystem.name}</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium px-2 py-0.5 rounded-full">
                {isMainDashboard ? dashboardBadge : currentSystem.badge}
              </span>
            </h2>
          </div>
        </div>

        {/* Center Quick Search Bar (Ctrl + K) */}
        <button
          onClick={() => setShowGlobalSearch(true)}
          className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-100/80 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-medium transition-all cursor-pointer shadow-xs w-64 lg:w-96 justify-between group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
            <span className="truncate">Search Orders, Leads, POs, Employees...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-500 shadow-2xs shrink-0">
            Ctrl K
          </kbd>
        </button>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
            title="Global Search (Ctrl + K)"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Dark Mode Toggle */}
          <ThemeToggle />

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifPopover(!showNotifPopover)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
            >
              <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifPopover && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
<<<<<<< HEAD
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
=======
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(isAdmin || isManager) && (
                    <button
                      onClick={() => {
                        setShowNotifPopover(false);
                        setIsComposeOpen(true);
                      }}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                      title="Create targeted notification with @ mention"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Mark read</span>
                    </button>
                  )}
                </div>
>>>>>>> daf8de7 ( .gitignore update)
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        setShowNotifPopover(false);
                        if (n.link_url) navigate(n.link_url);
<<<<<<< HEAD
                      }}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${!n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                        }`}
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
=======
                        else navigate('/notifications');
                      }}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        !n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{n.title}</p>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        {(n.sender_email || n.email) && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono truncate max-w-[170px]">
                            {n.sender_email || n.email}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>
>>>>>>> daf8de7 ( .gitignore update)
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifPopover(false)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
<<<<<<< HEAD
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.full_name}
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/30"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 font-medium">{user?.designation || user?.role}</p>
=======
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user?.full_name || 'User'}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs ring-2 ring-indigo-500/30">
                {user?.full_name
                  ? user.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                  : 'U'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {user?.full_name || 'User Profile'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {user?.designation || user?.department || user?.role || 'Employee'}
              </p>
>>>>>>> daf8de7 ( .gitignore update)
            </div>
          </button>

          {showProfileMenu && (
<<<<<<< HEAD
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in-50 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.full_name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {user?.role || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {user?.allowedModules ? `${user.allowedModules.length} Modules` : 'All Modules'}
=======
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in-50 duration-150">
              <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
                      {user?.full_name
                        ? user.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.full_name || 'Authenticated User'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {user?.role || 'User'}
                      </span>
                      {user?.employee_id && (
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {user.employee_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Department & Designation Details */}
              <div className="px-4 py-2.5 text-xs border-b border-slate-100 dark:border-slate-800 space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {user?.department || 'Operations'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Designation:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {user?.designation || 'Associate'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Systems Access:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {user?.allowed_systems
                      ? `${user.allowed_systems.length} Systems`
                      : user?.allowedModules
                      ? `${user.allowedModules.length} Systems`
                      : 'Full Access'}
>>>>>>> daf8de7 ( .gitignore update)
                  </span>
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile & Requests</span>
              </Link>

<<<<<<< HEAD
              {/* Quick Switch User & Test Module Access */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="px-4 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <UsersIcon className="w-3 h-3 text-indigo-500" /> Switch User (Module Test)
                  </span>
                </div>
                <div className="py-1 max-h-48 overflow-y-auto space-y-0.5">
                  {INITIAL_USERS.map((u) => {
                    const isCurrent = (user?.id === u.id || user?.email === u.email);
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u);
                          setShowProfileMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-left text-xs transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-[11px] leading-tight font-bold">{u.full_name}</p>
                          <span className="text-[10px] text-slate-400 font-normal block truncate">
                            {u.designation} • {u.allowedModules ? `${u.allowedModules.length} Mod` : 'Full'}
                          </span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
=======
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
>>>>>>> daf8de7 ( .gitignore update)
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
