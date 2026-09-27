import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock,
  FileText,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowRight,
  Search,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { useLeadStorage } from '../../hooks/useLeadStorage';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import {
  LTO_KEYS,
  convertApprovalToOrderToDelivery
} from '../../services/leadToOrderStorageService';
import { STORAGE_KEYS as OTD_KEYS } from '../../services/otdStorageService';

export function LeadDashboardPage() {
  const navigate = useNavigate();

  const leads = useLeadStorage(LTO_KEYS.LEADS, []);
  const followUps = useLeadStorage(LTO_KEYS.FOLLOW_UPS, []);
  const quotations = useLeadStorage(LTO_KEYS.QUOTATIONS, []);
  const negotiations = useLeadStorage(LTO_KEYS.NEGOTIATIONS, []);
  const approvals = useLeadStorage(LTO_KEYS.APPROVALS, []);
  const otdOrders = useOTDStorage(OTD_KEYS.ORDERS, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // 10 Metric Calculations
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New' || l.currentStage === 'Lead Creation').length;
  const verificationPending = leads.filter(
    l => l.status === 'Verification Pending' || l.currentStage === 'Lead Verification'
  ).length;
  const followUpsToday = followUps.filter(f => f.followUpDate === todayStr).length;
  const quotationPending = leads.filter(
    l => l.status === 'Quotation' || l.currentStage === 'Quotation'
  ).length;
  const inNegotiation = leads.filter(
    l => l.status === 'Negotiation' || l.currentStage === 'Negotiation'
  ).length;
  const approvalPending = approvals.filter(a => a.approvalStatus === 'Pending').length;
  const approvedLeads = leads.filter(l => l.status === 'Approved').length;
  const rejectedLeads = leads.filter(l => l.status === 'Rejected').length;
  const convertedToOrder = leads.filter(
    l => l.convertedOrderId || l.status === 'Approved' || l.currentStage === 'Order to Delivery'
  ).length;

  // Recent Leads (last 5)
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  // Today's Follow-ups
  const todaysFollowUpsList = followUps.filter(f => f.followUpDate === todayStr).slice(0, 4);

  // Pending Approvals
  const pendingApprovalsList = approvals.filter(a => a.approvalStatus === 'Pending').slice(0, 4);

  // Recently Approved Orders
  const recentlyApprovedOrders = otdOrders
    .filter(o => o.convertedFromLead || o.leadId)
    .slice(0, 4);

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900';
      case 'high':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'medium':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'converted to order':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'approval pending':
      case 'under negotiation':
      case 'negotiation':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'verification pending':
      case 'new':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'rejected':
      case 'closed':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
    }
  };

  const metricCards = [
    { label: 'Total Leads', count: totalLeads, icon: Users, color: 'from-violet-500 to-indigo-600', link: '/lead-to-orders/leads?tab=all' },
    { label: 'New Leads', count: newLeads, icon: UserPlus, color: 'from-blue-500 to-cyan-600', link: '/lead-to-orders/leads?tab=new' },
    { label: 'Verification Pending', count: verificationPending, icon: ShieldCheck, color: 'from-amber-500 to-orange-600', link: '/lead-to-orders/leads?tab=verification' },
    { label: 'Follow-ups Today', count: followUpsToday, icon: Clock, color: 'from-sky-500 to-blue-600', link: '/lead-to-orders/follow-up?tab=today' },
    { label: 'Quotation Pending', count: quotationPending, icon: FileText, color: 'from-indigo-500 to-violet-600', link: '/lead-to-orders/quotation' },
    { label: 'In Negotiation', count: inNegotiation, icon: TrendingUp, color: 'from-purple-500 to-pink-600', link: '/lead-to-orders/negotiation' },
    { label: 'Approval Pending', count: approvalPending, icon: FileCheck, color: 'from-amber-500 to-rose-600', link: '/lead-to-orders/approval' },
    { label: 'Approved', count: approvedLeads, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', link: '/lead-to-orders/leads?tab=approved' },
    { label: 'Rejected', count: rejectedLeads, icon: XCircle, color: 'from-rose-500 to-red-600', link: '/lead-to-orders/leads?tab=rejected' },
    { label: 'Converted to Order', count: convertedToOrder, icon: ShoppingBag, color: 'from-teal-500 to-emerald-600', link: '/sales/orders' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-violet-950 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-violet-800/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 font-extrabold text-[11px] tracking-wider uppercase border border-violet-500/30">
              Lead To Order FMS Pipeline
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
              <Calendar className="w-3 h-3" /> Today: {todayStr}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 text-white">
            Commercial Lead Pipeline & Conversion
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Complete qualification funnel: Lead Creation → Verification → Follow-up → Quotation → Negotiation → Approval. Approved leads automatically bridge into Order to Delivery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/lead-to-orders/leads?action=create')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer transform active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Create New Lead</span>
          </button>
        </div>
      </div>

      {/* 10 Dashboard Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {card.label}
                </span>
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-xs`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {card.count}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Conversion Funnel Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Lead Conversion Funnel</h2>
          </div>
          <span className="text-xs text-slate-500">
            Conversion Rate: <span className="font-black text-emerald-600 dark:text-emerald-400">{totalLeads > 0 ? ((convertedToOrder / totalLeads) * 100).toFixed(1) : 0}%</span>
          </span>
        </div>
        
        {/* Stage Pills Flow */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="block text-[10px] font-bold text-slate-500 uppercase">1. Created</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">{totalLeads}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">2. Verified</span>
            <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">{leads.filter(l => l.status !== 'New' && l.status !== 'Rejected').length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50">
            <span className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">3. Follow-up</span>
            <span className="text-sm font-extrabold text-sky-700 dark:text-sky-300">{followUps.length} logs</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
            <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">4. Quotation</span>
            <span className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">{quotations.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
            <span className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">5. Negotiation</span>
            <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">{negotiations.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">6. Approval</span>
            <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">{approvals.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">7. Order to Delivery</span>
            <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">{convertedToOrder}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Recent Leads & Today's Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Leads */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span>Recent Leads</span>
              </h2>
              <p className="text-[11px] text-slate-400">Newly captured prospect inquiries awaiting progression</p>
            </div>
            <button
              onClick={() => navigate('/lead-to-orders/leads')}
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All Leads</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Lead ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Product / Service</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-violet-600 dark:text-violet-400">
                      {lead.leadId}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{lead.customerName}</div>
                      <div className="text-[10px] text-slate-400">{lead.contactPerson} • {lead.mobile}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                      {lead.productService}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/lead-to-orders/leads?leadId=${lead.leadId}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-violet-100 dark:bg-slate-800 dark:hover:bg-violet-900/40 text-slate-700 hover:text-violet-700 dark:text-slate-300 dark:hover:text-violet-300 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Today's Follow-ups */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" />
                <span>Today's Follow-ups</span>
              </h2>
              <p className="text-[11px] text-slate-400">Scheduled client touchpoints for today</p>
            </div>
            <button
              onClick={() => navigate('/lead-to-orders/follow-up')}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {todaysFollowUpsList.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No follow-ups scheduled for today.
              </div>
            ) : (
              todaysFollowUpsList.map((flw) => (
                <div
                  key={flw.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-violet-600 dark:text-violet-400">{flw.leadId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      {flw.followUpMode} @ {flw.followUpTime || '11:00'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">{flw.customer}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{flw.discussion}</p>
                  <div className="pt-1.5 flex items-center justify-between border-t border-slate-200 dark:border-slate-700/50 text-[10px]">
                    <span className="text-slate-400">Next: <strong className="text-slate-700 dark:text-slate-300">{flw.nextAction}</strong></span>
                    <button
                      onClick={() => navigate(`/lead-to-orders/follow-up?leadId=${flw.leadId}`)}
                      className="text-sky-600 font-bold hover:underline"
                    >
                      Open Log
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Section: Pending Approvals & Recently Approved Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-500" />
                <span>Pending Approvals</span>
              </h2>
              <p className="text-[11px] text-slate-400">Quotations finalized & waiting for management sign-off</p>
            </div>
            <button
              onClick={() => navigate('/lead-to-orders/approval')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Approval Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingApprovalsList.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No quotations currently pending approval.
              </div>
            ) : (
              pendingApprovalsList.map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-amber-700 dark:text-amber-400">{app.approvalId} • Quote: {app.quotationNo}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      ₹ {Number(app.quotationAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{app.customer}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{app.approvalRemarks}</p>
                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">Submitted by: {app.submittedBy}</span>
                    <button
                      onClick={() => navigate('/lead-to-orders/approval')}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer"
                    >
                      Review & Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Approved Orders (Bridged into Order to Delivery) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <span>Recently Approved Orders</span>
              </h2>
              <p className="text-[11px] text-slate-400">Successfully bridged into the Order to Delivery module</p>
            </div>
            <button
              onClick={() => navigate('/sales/orders')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View in Order to Delivery</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentlyApprovedOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No orders converted yet. Approve a quotation in the Approval stage to push into Order to Delivery.
              </div>
            ) : (
              recentlyApprovedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {ord.orderNumber}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      ₹ {Number(ord.grandTotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{ord.customerName}</div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span>Lead: <strong>{ord.leadId || 'N/A'}</strong></span>
                    <span>Quote: <strong>{ord.quotationNo || 'N/A'}</strong></span>
                    <span>Stage: <strong className="text-emerald-700 dark:text-emerald-400">{ord.currentStage || 'Order Verification'}</strong></span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">Status: {ord.status}</span>
                    <button
                      onClick={() => navigate('/sales/verification')}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer"
                    >
                      <span>Track Order</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
