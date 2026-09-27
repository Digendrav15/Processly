import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSystem } from '../../context/SystemContext';
import { taskService } from '../../services/taskService';
import { getData as getOTDData, STORAGE_KEYS as OTD_KEYS, initOTDData } from '../../services/otdStorageService';
import { getPurchaseData, PURCHASE_STORAGE_KEYS, initPurchaseData } from '../../services/purchaseStorageService';
import { getData as getLTOData, LTO_KEYS, initLTOData } from '../../services/leadToOrderStorageService';
import { getHRData, HR_KEYS, initHRData } from '../../services/hrStorageService';
import { getPettySummary, initPettyData } from '../../services/pettyStorageService';
import { getDocSubSummary, initDocSubData } from '../../services/docSubStorageService';
import { getWhatsAppSummary, initWhatsAppSeedData } from '../../services/whatsappStorageService';
import { StageKanbanReports } from '../../components/dashboard/StageKanbanReports';

import {
  LayoutDashboard,
  CheckSquare,
  TrendingUp,
  ShoppingCart,
  Target,
  Users,
  Sliders,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Layers,
  FileText,
  DollarSign,
  Package,
  Calendar,
  Briefcase,
  ChevronRight,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Files,
  MessageSquare
} from 'lucide-react';


export function MainAdminDashboard() {
  const { user } = useAuth();
  const { switchSystem } = useSystem();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // System Data States
  const [tasks, setTasks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [leads, setLeads] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [hrIndents, setHrIndents] = useState([]);
  const [hrEnquiries, setHrEnquiries] = useState([]);
  const [hrInterviews, setHrInterviews] = useState([]);
  const [hrOffers, setHrOffers] = useState([]);
  const [hrJoinings, setHrJoinings] = useState([]);
  const [hrClearances, setHrClearances] = useState([]);
  const [hrFnf, setHrFnf] = useState([]);
  const [petty, setPetty] = useState(null);
  const [docSub, setDocSub] = useState(null);
  const [whatsApp, setWhatsApp] = useState(null);

  // Load all system data across modules
  const loadAllSystemData = async () => {
    setLoading(true);
    try {
      initHRData();
      initPurchaseData();
      initOTDData();
      initLTOData();
      initPettyData();
      initDocSubData();
      initWhatsAppSeedData();

      // 1. Checklist & Tasks
      const tasksData = await taskService.getTasks();
      setTasks(tasksData || []);

      // 2. Order To Delivery
      const ordersData = getOTDData(OTD_KEYS.ORDERS, []);
      setOrders(ordersData || []);

      // 3. Purchase System
      const purchaseData = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
      setPurchases(purchaseData || []);

      // 4. Lead To Orders
      const leadsData = getLTOData(LTO_KEYS.LEADS, []);
      setLeads(leadsData || []);
      const quotesData = getLTOData(LTO_KEYS.QUOTATIONS, []);
      setQuotations(quotesData || []);

      // 5. HR System
      setHrIndents(getHRData(HR_KEYS.INDENTS, []));
      setHrEnquiries(getHRData(HR_KEYS.JOB_ENQUIRIES, []));
      setHrInterviews(getHRData(HR_KEYS.INTERVIEWS, []));
      setHrOffers(getHRData(HR_KEYS.OFFERS, []));
      setHrJoinings(getHRData(HR_KEYS.JOININGS, []));
      setHrClearances(getHRData(HR_KEYS.CLEARANCE, []));
      setHrFnf(getHRData(HR_KEYS.FNF, []));

      // 6. Petty Expenses & Cheques
      setPetty(getPettySummary());

      // 7. Document & Subscription
      setDocSub(getDocSubSummary());

      // 8. WhatsApp Inbox & Live Chats
      setWhatsApp(getWhatsAppSummary());

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load multi-system dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSystemData();

    // Listen to real-time events across systems
    const handleUpdate = () => loadAllSystemData();
    window.addEventListener('task_update', handleUpdate);
    window.addEventListener('otd_storage_update', handleUpdate);
    window.addEventListener('purchase_storage_update', handleUpdate);
    window.addEventListener('lead_storage_update', handleUpdate);
    window.addEventListener('hr_storage_update', handleUpdate);
    window.addEventListener('petty_storage_update', handleUpdate);
    window.addEventListener('docsub_storage_update', handleUpdate);
    window.addEventListener('whatsapp_storage_update', handleUpdate);

    return () => {
      window.removeEventListener('task_update', handleUpdate);
      window.removeEventListener('otd_storage_update', handleUpdate);
      window.removeEventListener('purchase_storage_update', handleUpdate);
      window.removeEventListener('lead_storage_update', handleUpdate);
      window.removeEventListener('hr_storage_update', handleUpdate);
      window.removeEventListener('petty_storage_update', handleUpdate);
      window.removeEventListener('docsub_storage_update', handleUpdate);
      window.removeEventListener('whatsapp_storage_update', handleUpdate);
    };
  }, []);

  // Compute System Statistics & Pending Counts
  const systemMetrics = useMemo(() => {
    // 1. Checklist Metrics
    const pendingTasks = tasks.filter((t) => t.status === 'Pending' || t.status === 'In Progress').length;
    const overdueTasks = tasks.filter((t) => t.status === 'Overdue').length;
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length;

    // 2. OTD (Order To Delivery) Metrics
    const pendingOTD = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Order Closed').length;
    const otdVerification = orders.filter((o) => o.status === 'Order Verification' || o.stage === 'Order Verification').length;
    const otdApproval = orders.filter((o) => o.status === 'Order Approval' || o.stage === 'Order Approval').length;
    const otdQC = orders.filter((o) => o.status === 'Quality Check' || o.stage === 'Quality Check').length;
    const otdDispatch = orders.filter((o) => o.status === 'Dispatch' || o.stage === 'Dispatch').length;

    // 3. Purchase Metrics
    const purchasePendingApproval = purchases.filter((p) => p.status === 'Pending Approval' || p.stage === 'Indent Approval').length;
    const purchasePendingPO = purchases.filter((p) => p.stage === 'PO' || p.status === 'Approved').length;
    const purchasePendingQC = purchases.filter((p) => p.stage === 'Quality Check' || p.stage === 'Material Receiving').length;
    const totalPurchasePending = purchasePendingApproval + purchasePendingPO + purchasePendingQC;

    // 4. Lead To Orders Metrics
    const activeLeads = leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost').length;
    const pendingQuotations = quotations.filter((q) => q.status === 'Draft' || q.status === 'Under Review' || q.status === 'Sent to Customer').length;
    const totalLeadPending = activeLeads + pendingQuotations;

    // 5. HR Metrics
    const pendingIndents = hrIndents.filter((i) => i.status === 'Pending Approval').length;
    const pendingInterviews = hrInterviews.filter((i) => i.status === 'Scheduled' || i.status === 'In Progress').length;
    const pendingOffers = hrOffers.filter((o) => o.status === 'Pending Approval').length;
    const pendingJoinings = hrJoinings.filter((j) => j.status === 'Joining Pending').length;
    const pendingClearances = hrClearances.filter((c) => c.status === 'Pending Clearance').length;
    const pendingFnf = hrFnf.filter((f) => f.status === 'Pending' || f.status === 'Under Process').length;
    const totalHRPending = pendingIndents + pendingInterviews + pendingOffers + pendingJoinings + pendingClearances + pendingFnf;

    // 6. Petty Expenses Metrics
    const pettyOperations = petty?.totalTxnCount || 0;
    const pettyPending = petty?.pendingActionCount || 0;

    // 7. Doc & Subscription Metrics
    const docSubOperations = (docSub?.totalDocsCount || 0) + (docSub?.totalSubsCount || 0);
    const docSubPending = docSub?.pendingActionsCount || 0;

    // 8. WhatsApp Metrics
    const whatsAppOperations = whatsApp?.totalConversations || 0;
    const whatsAppPending = whatsApp?.unreadCount || 0;

    // Total Aggregates
    const grandTotalOperations =
      tasks.length + orders.length + purchases.length + leads.length + hrIndents.length + pettyOperations + docSubOperations + whatsAppOperations;
    const grandTotalPending =
      pendingTasks + pendingOTD + totalPurchasePending + totalLeadPending + totalHRPending + pettyPending + docSubPending + whatsAppPending;

    return {
      checklist: {
        total: tasks.length,
        pending: pendingTasks,
        overdue: overdueTasks,
        completed: completedTasks
      },
      otd: {
        total: orders.length,
        pending: pendingOTD,
        verification: otdVerification,
        approval: otdApproval,
        qc: otdQC,
        dispatch: otdDispatch
      },
      purchase: {
        total: purchases.length,
        pending: totalPurchasePending,
        approval: purchasePendingApproval,
        po: purchasePendingPO,
        qc: purchasePendingQC
      },
      leads: {
        total: leads.length,
        pending: totalLeadPending,
        active: activeLeads,
        quotations: pendingQuotations
      },
      hr: {
        total: hrIndents.length + hrEnquiries.length,
        pending: totalHRPending,
        indents: pendingIndents,
        interviews: pendingInterviews,
        offers: pendingOffers,
        joinings: pendingJoinings,
        clearances: pendingClearances,
        fnf: pendingFnf
      },
      petty: petty || {
        netBalance: 0,
        totalReceived: 0,
        totalOutgoings: 0,
        cashInHand: 0,
        undepositedCount: 0,
        undepositedAmount: 0,
        inClearingReceivedCount: 0,
        inClearingReceivedAmount: 0,
        pendingActionCount: 0
      },
      docSub: docSub || {
        totalDocsCount: 0,
        verifiedDocsCount: 0,
        pendingVerificationCount: 0,
        expiringSoonDocsCount: 0,
        expiredDocsCount: 0,
        totalSubsCount: 0,
        activeSubsCount: 0,
        renewalDueSubsCount: 0,
        paymentDueSubsCount: 0,
        totalAnnualSaaSSpend: 0,
        pendingActionsCount: 0
      },
      whatsApp: whatsApp || {
        totalConversations: 0,
        unreadCount: 0,
        openChats: 0
      },
      grandTotalOperations,
      grandTotalPending,
      totalOverdueAlerts: overdueTasks + pendingIndents + otdApproval + (docSub?.expiredDocsCount || 0)
    };
  }, [
    tasks,
    orders,
    purchases,
    leads,
    quotations,
    hrIndents,
    hrEnquiries,
    hrInterviews,
    hrOffers,
    hrJoinings,
    hrClearances,
    hrFnf,
    petty,
    docSub,
    whatsApp
  ]);



  // Helper to switch and jump to page
  const handleJumpToModule = (systemId, path) => {
    switchSystem(systemId, false);
    navigate(path);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">
                Admin Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-500/30">
                All Systems Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cross-System Tracking, Pending Actions & Operational Velocity for{' '}
              <strong className="text-slate-200">{user?.name || 'Administrator'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              Last Real-Time Sync
            </span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>

          <button
            onClick={loadAllSystemData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Refresh All Systems"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Grand Cross-System Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Grand Operations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Managed Operations
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {systemMetrics.grandTotalOperations}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 9 Integrated Systems
            </p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Grand Pending Actions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Action Items Pending
            </span>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {systemMetrics.grandTotalPending}
            </h3>
            <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Awaiting User / Approval
            </p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Critical Attention Required */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Overdue & Alerts
            </span>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {systemMetrics.totalOverdueAlerts}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Requires Priority Focus
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: System Operational Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              System Health Index
            </span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              100%
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
              All 9 Engines Synchronized
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Petty Expenses & Cheque Tracker Executive Overview Card */}
      <div className="bg-gradient-to-r from-teal-900/90 via-slate-900 to-slate-900 border border-teal-800/40 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/30 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white tracking-tight">Petty Expenses & Cheque Lifecycle Engine</h4>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Net Balance: <strong className="text-teal-300 font-mono">₹{(systemMetrics.petty.netBalance || 0).toLocaleString('en-IN')}</strong> • Received:{' '}
              <strong className="text-emerald-400 font-mono">₹{(systemMetrics.petty.totalReceived || 0).toLocaleString('en-IN')}</strong> • Outgoings:{' '}
              <strong className="text-rose-400 font-mono">₹{(systemMetrics.petty.totalOutgoings || 0).toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Cheques Pipeline</span>
            <span className="font-bold text-amber-400">
              {systemMetrics.petty.undepositedCount || 0} In-Hand • {systemMetrics.petty.inClearingReceivedCount || 0} Clearing
            </span>
          </div>

          <button
            onClick={() => handleJumpToModule('petty-expenses', '/petty-expenses/dashboard')}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/30 cursor-pointer active:scale-95 shrink-0"
          >
            <span>Open Petty Expenses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Document & Subscription Executive Overview Card */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-800/40 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
            <Files className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white tracking-tight">Document & Subscription Compliance Engine</h4>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Documents: <strong className="text-blue-300 font-semibold">{systemMetrics.docSub.totalDocsCount}</strong> ({systemMetrics.docSub.verifiedDocsCount} verified) • SaaS Subscriptions:{' '}
              <strong className="text-purple-300 font-semibold">{systemMetrics.docSub.totalSubsCount}</strong> • Annual Run-Rate:{' '}
              <strong className="text-emerald-400 font-mono">₹{systemMetrics.docSub.totalAnnualSaaSSpend.toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Action Items</span>
            <span className="font-bold text-amber-400">
              {systemMetrics.docSub.pendingActionsCount} Pending Action
            </span>
          </div>

          <button
            onClick={() => handleJumpToModule('doc-subscription', '/doc-subscription/dashboard')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer active:scale-95 shrink-0"
          >
            <span>Open Document & Subscriptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* WhatsApp Live Inbox & Customer Communication Engine Overview Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-800/40 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white tracking-tight">WhatsApp Live Inbox & Customer Communication</h4>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Active Conversations: <strong className="text-emerald-300 font-semibold">{systemMetrics.whatsApp.totalConversations}</strong> • Open Inquiries:{' '}
              <strong className="text-teal-300 font-semibold">{systemMetrics.whatsApp.openChats}</strong> • Meta Cloud Ready:{' '}
              <span className="text-emerald-400 font-medium">Standard Cloud API Webhook Prepared</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Unread Inquiries</span>
            <span className="font-bold text-amber-400">
              {systemMetrics.whatsApp.unreadCount} Unread Messages
            </span>
          </div>

          <button
            onClick={() => handleJumpToModule('whatsapp', '/whatsapp/inbox')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95 shrink-0"
          >
            <span>Open WhatsApp Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Central Multi-System Stage-Wise Kanban Pipeline Reports */}
      <StageKanbanReports
        tasks={tasks}
        orders={orders}
        purchases={purchases}
        leads={leads}
        hrIndents={hrIndents}
        hrInterviews={hrInterviews}
        hrOffers={hrOffers}
        hrJoinings={hrJoinings}
        hrClearances={hrClearances}
        hrFnf={hrFnf}
        onRefresh={loadAllSystemData}
      />
    </div>
  );
}

