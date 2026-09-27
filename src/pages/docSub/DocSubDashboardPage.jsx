import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  Plus,
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Eye,
  ArrowUpRight,
  BarChart3,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import {
  initDocSubData,
  getDocSubSummary,
  getDocuments,
  getSubscriptions,
  getDocSubData,
  DOC_SUB_KEYS,
  formatDate,
  getDaysDiff
} from '../../services/docSubStorageService';
import AddDocumentModal from '../../components/docSub/AddDocumentModal';
import AddSubscriptionModal from '../../components/docSub/AddSubscriptionModal';
import VerifyDocModal from '../../components/docSub/VerifyDocModal';
import RenewModal from '../../components/docSub/RenewModal';
import RecordPaymentModal from '../../components/docSub/RecordPaymentModal';
import DocumentViewModal from '../../components/docSub/DocumentViewModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function DocSubDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  // Modal states
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showRecordPay, setShowRecordPay] = useState(false);
  const [verifyingDoc, setVerifyingDoc] = useState(null);
  const [renewingItem, setRenewingItem] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  const loadData = () => {
    initDocSubData();
    const sum = getDocSubSummary();
    setSummary(sum);
    setDocuments(getDocuments());
    setSubscriptions(getSubscriptions());
    const logs = getDocSubData(DOC_SUB_KEYS.AUDIT_LOGS, []);
    setRecentLogs(logs.slice(0, 6));
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('docsub_storage_update', handleUpdate);
    return () => window.removeEventListener('docsub_storage_update', handleUpdate);
  }, []);

  if (!summary) return null;

  // Urgent attention items (Docs expiring soon or expired, Subs renewal/payment due or expired)
  const urgentDocs = documents
    .filter((d) => {
      if (d.isPerpetual || !d.expiryDate) return false;
      const days = getDaysDiff(d.expiryDate);
      return days !== null && days <= 30;
    })
    .sort((a, b) => getDaysDiff(a.expiryDate) - getDaysDiff(b.expiryDate));

  const urgentSubs = subscriptions
    .filter((s) => {
      const days = getDaysDiff(s.nextRenewalDate);
      return s.status === 'Expired' || s.paymentStatus === 'Payment Due' || s.paymentStatus === 'Overdue' || (days !== null && days <= 30);
    })
    .sort((a, b) => getDaysDiff(a.nextRenewalDate) - getDaysDiff(b.nextRenewalDate));

  // Chart data: Spend by department
  const deptSpendMap = subscriptions.reduce((acc, sub) => {
    const dept = sub.assignedDepartment || 'General';
    const annualAmt = sub.billingCycle === 'Monthly' ? sub.amount * 12 : sub.amount;
    acc[dept] = (acc[dept] || 0) + annualAmt;
    return acc;
  }, {});

  const deptChartData = Object.entries(deptSpendMap).map(([name, value]) => ({
    name,
    spend: value
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  // Status breakdown for documents
  const docStatusData = [
    { name: 'Verified', count: summary.verifiedDocsCount, color: '#10b981' },
    { name: 'Pending Verification', count: summary.pendingVerificationCount, color: '#f59e0b' },
    { name: 'Expiring Soon', count: summary.expiringSoonDocsCount, color: '#f97316' },
    { name: 'Expired', count: summary.expiredDocsCount, color: '#ef4444' }
  ].filter((item) => item.count > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Compliance & Subscriptions Engine
            </span>
            <span className="text-xs text-indigo-200">Real-time Expiry & Billing Tracker</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Document & Subscription Hub
          </h1>
          <p className="text-sm text-indigo-200 max-w-2xl">
            Centralized corporate vault for statutory contracts, licenses, ISO documents, SaaS subscriptions, renewal alerts, and payment settlements.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddDoc(true)}
            className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            Add Document
          </button>
          <button
            onClick={() => setShowAddSub(true)}
            className="px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-400/30 rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <CreditCard className="w-4 h-4 text-indigo-200" />
            Add Subscription
          </button>
          <button
            onClick={() => setShowRecordPay(true)}
            className="px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <DollarSign className="w-4 h-4 text-emerald-200" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <Link
          to="/doc-subscription/documents"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Corporate Documents
            </span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.totalDocsCount}
            </span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              {summary.verifiedDocsCount} verified
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>Pending: <strong className="text-amber-600 font-semibold">{summary.pendingVerificationCount}</strong></span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Expiring / Expired Docs */}
        <Link
          to="/doc-subscription/renewals"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Expiry Alerts
            </span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.expiringSoonDocsCount + summary.expiredDocsCount}
            </span>
            <span className="text-xs font-medium text-rose-600">
              {summary.expiredDocsCount} expired
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>Expiring &lt;30d: <strong className="text-amber-600 font-semibold">{summary.expiringSoonDocsCount}</strong></span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Active Subscriptions */}
        <Link
          to="/doc-subscription/subscriptions"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              SaaS Subscriptions
            </span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.totalSubsCount}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {summary.activeSubsCount} active
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>Renewal Due: <strong className="text-amber-600 font-semibold">{summary.renewalDueSubsCount}</strong></span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* SaaS Annual & Monthly Spend */}
        <Link
          to="/doc-subscription/payments"
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Annual SaaS Run-Rate
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{(summary.totalAnnualSaaSSpend / 1000).toFixed(0)}k
            </span>
            <span className="text-xs font-medium text-slate-500">
              (₹{(summary.monthlySaaSSpend / 1000).toFixed(1)}k/mo)
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>Payment Due: <strong className="text-rose-600 font-semibold">{summary.paymentDueSubsCount}</strong></span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Two Column Layout: Urgent Items & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Attention Items (Docs & Subscriptions) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Documents Alert Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Documents Requiring Action
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pending verification or expiring within 30 days
                  </p>
                </div>
              </div>
              <Link
                to="/doc-subscription/renewals"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View Expiry Tracker <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {urgentDocs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  All documents are verified and within safe validity periods!
                </div>
              ) : (
                urgentDocs.slice(0, 4).map((doc) => {
                  const days = getDaysDiff(doc.expiryDate);
                  const isExp = days < 0;
                  return (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-lg ${
                            isExp
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{doc.category}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {doc.custodian}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isExp
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {isExp ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`}
                        </span>
                        <button
                          onClick={() => setRenewingItem({ type: 'Document', item: doc })}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Urgent Subscriptions Alert Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Upcoming Renewals & Unpaid Subscriptions
                  </h3>
                  <p className="text-xs text-slate-500">
                    SaaS services due for renewal or invoice settlement
                  </p>
                </div>
              </div>
              <Link
                to="/doc-subscription/subscriptions"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                All Subscriptions <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {urgentSubs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  All subscriptions are paid up and active!
                </div>
              ) : (
                urgentSubs.slice(0, 4).map((sub) => {
                  const days = getDaysDiff(sub.nextRenewalDate);
                  const isExp = sub.status === 'Expired' || days < 0;
                  return (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {sub.serviceName}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{sub.provider}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              ₹{Number(sub.amount).toLocaleString('en-IN')}/{sub.billingCycle}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            sub.paymentStatus === 'Payment Due' || sub.paymentStatus === 'Overdue'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {sub.paymentStatus}
                        </span>
                        <button
                          onClick={() => {
                            setRenewingItem({ type: 'Subscription', item: sub });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => {
                            setShowRecordPay(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Spend Breakdown & Recent Audit Feed */}
        <div className="space-y-6">
          {/* SaaS Spend by Department Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Annual Spend by Department
            </h3>
            <p className="text-xs text-slate-500 mb-4">Software & Cloud subscriptions run-rate</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Annual Spend']}
                    contentStyle={{ borderRadius: 12, fontSize: 12, backgroundColor: '#1e293b', color: '#fff', border: 'none' }}
                  />
                  <Bar dataKey="spend" radius={[0, 6, 6, 0]} barSize={16}>
                    {deptChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent History / Activity Feed */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Recent Audit Trail
              </h3>
              <Link
                to="/doc-subscription/history"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full History
              </Link>
            </div>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="text-xs flex items-start gap-2.5 pb-2 border-b border-slate-50 dark:border-slate-800/40 last:border-none">
                    <span
                      className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                        log.action === 'Verified' || log.action === 'Payment Paid'
                          ? 'bg-emerald-500'
                          : log.action === 'Renewed'
                          ? 'bg-blue-500'
                          : log.action === 'Expiry Alert' || log.action === 'Payment Overdue'
                          ? 'bg-rose-500'
                          : 'bg-indigo-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {log.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{log.details}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.performedBy}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddDocumentModal
        isOpen={showAddDoc}
        onClose={() => setShowAddDoc(false)}
        onSuccess={loadData}
      />
      <AddSubscriptionModal
        isOpen={showAddSub}
        onClose={() => setShowAddSub(false)}
        onSuccess={loadData}
      />
      <RecordPaymentModal
        isOpen={showRecordPay}
        onClose={() => setShowRecordPay(false)}
        onSuccess={loadData}
      />
      {verifyingDoc && (
        <VerifyDocModal
          isOpen={true}
          onClose={() => setVerifyingDoc(null)}
          doc={verifyingDoc}
          onSuccess={loadData}
        />
      )}
      {renewingItem && (
        <RenewModal
          isOpen={true}
          onClose={() => setRenewingItem(null)}
          type={renewingItem.type}
          item={renewingItem.item}
          onSuccess={loadData}
        />
      )}
      {viewingDoc && (
        <DocumentViewModal
          isOpen={true}
          onClose={() => setViewingDoc(null)}
          doc={viewingDoc}
          onVerify={(d) => setVerifyingDoc(d)}
          onRenew={(d) => setRenewingItem({ type: 'Document', item: d })}
        />
      )}
    </div>
  );
}
