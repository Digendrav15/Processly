import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Plus,
  Bell,
  Calendar,
  Layers,
  X,
  ChevronRight,
  Target,
  Users,
  FileText,
  Boxes,
  Truck,
  CreditCard,
  ShoppingCart,
  FileSpreadsheet,
  Receipt,
  UserCheck,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Files,
  RefreshCw,
  Sliders,
  Package,
  Users2,
  MessageSquare,
  Radio,
  Bookmark,
  TrendingUp,
  Clock,
  FileCheck
} from 'lucide-react';

// Curated primary tabs for each module
const MODULE_CONFIG = {
  checklist: {
    tabs: [
      { label: 'Dashboard', path: '/checklist/dashboard', icon: LayoutDashboard },
      { label: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
      { label: 'Alerts', path: '/notifications', icon: Bell },
    ],
    action: { label: 'Assign', path: '/task-assignment' },
    color: 'from-indigo-600 to-purple-600'
  },
  'lead-to-orders': {
    tabs: [
      { label: 'Pipeline', path: '/lead-to-orders/dashboard', icon: Target },
      { label: 'Leads', path: '/lead-to-orders/leads', icon: Users },
      { label: 'Quotations', path: '/lead-to-orders/quotation', icon: FileText },
    ],
    action: { label: 'New Lead', path: '/lead-to-orders/leads' },
    color: 'from-violet-600 to-purple-600'
  },
  sales: {
    tabs: [
      { label: 'Dashboard', path: '/sales/dashboard', icon: LayoutDashboard },
      { label: 'Stock', path: '/sales/stock-check', icon: Boxes },
      { label: 'Dispatch', path: '/sales/dispatch', icon: Truck },
    ],
    action: { label: 'New Order', path: '/sales/new-order' },
    color: 'from-emerald-500 to-teal-600'
  },
  purchase: {
    tabs: [
      { label: 'Indents', path: '/purchase/indent', icon: FileText },
      { label: 'PO', path: '/purchase/po', icon: FileSpreadsheet },
      { label: 'GRN', path: '/purchase/grn', icon: Receipt },
    ],
    action: { label: 'New Indent', path: '/purchase/indent' },
    color: 'from-amber-500 to-orange-600'
  },
  hr: {
    tabs: [
      { label: 'Overview', path: '/hr/dashboard', icon: LayoutDashboard },
      { label: 'Employees', path: '/hr/active-employees', icon: Users },
      { label: 'Attendance', path: '/hr/attendance', icon: CheckSquare },
    ],
    action: { label: 'New Indent', path: '/hr/indent' },
    color: 'from-cyan-500 to-blue-600'
  },
  'petty-expenses': {
    tabs: [
      { label: 'Ledger', path: '/petty-expenses/dashboard', icon: LayoutDashboard },
      { label: 'Received', path: '/petty-expenses/received', icon: ArrowDownLeft },
      { label: 'Expenses', path: '/petty-expenses/outgoings', icon: ArrowUpRight },
    ],
    action: { label: 'Expense', path: '/petty-expenses/outgoings' },
    color: 'from-teal-500 to-emerald-600'
  },
  'doc-subscription': {
    tabs: [
      { label: 'Overview', path: '/doc-subscription/dashboard', icon: LayoutDashboard },
      { label: 'Docs', path: '/doc-subscription/documents', icon: Files },
      { label: 'Subs', path: '/doc-subscription/subscriptions', icon: RefreshCw },
    ],
    action: { label: 'Upload', path: '/doc-subscription/documents' },
    color: 'from-blue-600 to-indigo-600'
  },
  'master-system': {
    tabs: [
      { label: 'Overview', path: '/master-system/overview', icon: LayoutDashboard },
      { label: 'Vendors', path: '/master-system/vendors', icon: Users2 },
      { label: 'Products', path: '/master-system/products', icon: Package },
    ],
    action: { label: 'Masters', path: '/master-system/overview' },
    color: 'from-rose-500 to-pink-600'
  },
  whatsapp: {
    tabs: [
      { label: 'Inbox', path: '/whatsapp/inbox', icon: MessageSquare },
      { label: 'Broadcasts', path: '/whatsapp/broadcasts', icon: Radio },
      { label: 'Templates', path: '/whatsapp/templates', icon: Bookmark },
    ],
    action: { label: 'Chat', path: '/whatsapp/inbox' },
    color: 'from-green-500 to-emerald-600'
  },
  inventory: {
    tabs: [
      { label: 'Dashboard', path: '/inventory/dashboard', icon: LayoutDashboard },
      { label: 'In / Out', path: '/inventory/in-out', icon: ArrowLeftRight },
      { label: 'Indent', path: '/inventory/indent', icon: ShoppingCart },
    ],
    action: { label: 'Adjust', path: '/inventory/in-out' },
    color: 'from-amber-500 to-orange-600'
  }
};

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentSystem, activeSystemId } = useSystem();
  const { isAdmin, isManager, user } = useAuth();
  const [showPagesSheet, setShowPagesSheet] = useState(false);

  const isMainDashboard = location.pathname === '/dashboard';

  // Get active system config or fallback to checklist
  const systemKey = activeSystemId || 'checklist';
  const activeConfig = MODULE_CONFIG[systemKey] || MODULE_CONFIG.checklist;

  // Filter all navItems for the bottom sheet
  const validNavItems = (currentSystem?.navItems || []).filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.requiresSelfAssignOrManager) {
      if (isAdmin || isManager) return true;
      return user?.self_assign_enabled !== false;
    }
    return true;
  });

  // If on global dashboard, show global shortcuts
  if (isMainDashboard) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-3 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around relative">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5 font-semibold">Dashboard</span>
          </NavLink>

          <NavLink
            to="/my-tasks"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5 font-semibold">My Task</span>
          </NavLink>

          {/* Central Action */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => navigate('/task-assignment')}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 ring-4 ring-slate-50 dark:ring-slate-950 transform active:scale-95 transition-all cursor-pointer"
              title="Assign New Task"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight mt-0.5">
              Assign
            </span>
          </div>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <Bell className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5 font-semibold">Alerts</span>
          </NavLink>

          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5 font-semibold">Calendar</span>
          </NavLink>
        </div>
      </div>
    );
  }

  // Active module tabs
  const tab1 = activeConfig.tabs[0];
  const tab2 = activeConfig.tabs[1];
  const tab3 = activeConfig.tabs[2];
  const action = activeConfig.action;

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DYNAMIC CONTEXTUAL BOTTOM NAVIGATION                  */}
      {/* ======================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-3 py-1.5 shadow-2xl">
        <div className="flex items-center justify-around relative">
          
          {/* Tab 1 */}
          {tab1 && (
            <NavLink
              to={tab1.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <tab1.icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 font-semibold truncate max-w-[60px]">
                {tab1.label}
              </span>
            </NavLink>
          )}

          {/* Tab 2 */}
          {tab2 && (
            <NavLink
              to={tab2.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <tab2.icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 font-semibold truncate max-w-[60px]">
                {tab2.label}
              </span>
            </NavLink>
          )}

          {/* Central Dynamic Floating Action Button (+) */}
          {action && (
            <div className="relative -top-5 flex flex-col items-center">
              <button
                onClick={() => navigate(action.path)}
                className={`w-12 h-12 rounded-full bg-gradient-to-tr ${activeConfig.color} text-white flex items-center justify-center shadow-lg shadow-indigo-600/35 ring-4 ring-slate-50 dark:ring-slate-950 transform active:scale-95 transition-all cursor-pointer`}
                title={action.label}
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-0.5">
                {action.label}
              </span>
            </div>
          )}

          {/* Tab 3 / Secondary Feature */}
          {tab3 && (
            <NavLink
              to={tab3.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <tab3.icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 font-semibold truncate max-w-[60px]">
                {tab3.label}
              </span>
            </NavLink>
          )}

          {/* Tab 4: All Module Pages (Bottom Sheet Trigger) */}
          <button
            onClick={() => setShowPagesSheet(true)}
            className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              showPagesSheet
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Layers className="w-5 h-5" />
              {validNavItems.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {validNavItems.length}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-semibold">Pages</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MODULE ALL-PAGES BOTTOM SHEET                         */}
      {/* ======================================================== */}
      {showPagesSheet && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setShowPagesSheet(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Sheet Header */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {currentSystem.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {validNavItems.length} Available Pages & Tools
                </p>
              </div>
              <button
                onClick={() => setShowPagesSheet(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Body (Grid of all pages for this module) */}
            <div className="p-4 overflow-y-auto space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {validNavItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = location.pathname === item.path;

                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setShowPagesSheet(false);
                      }}
                      className={`flex items-center space-x-2.5 p-3 rounded-2xl text-left border transition-all active:scale-95 cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold block truncate leading-tight">
                          {item.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">
                            Current Page
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
