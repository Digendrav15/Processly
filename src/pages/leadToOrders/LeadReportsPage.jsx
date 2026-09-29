import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ShieldAlert,
  AlertTriangle,
  Award,
  DollarSign,
  Building2,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { useLeadStorage } from '../../hooks/useLeadStorage';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { LTO_KEYS, getDealLossAnalytics } from '../../services/leadToOrderStorageService';
import { STORAGE_KEYS as OTD_KEYS } from '../../services/otdStorageService';

export function LeadReportsPage() {
  const navigate = useNavigate();

  const leads = useLeadStorage(LTO_KEYS.LEADS, []);
  const followUps = useLeadStorage(LTO_KEYS.FOLLOW_UPS, []);
  const quotations = useLeadStorage(LTO_KEYS.QUOTATIONS, []);
  const negotiations = useLeadStorage(LTO_KEYS.NEGOTIATIONS, []);
  const approvals = useLeadStorage(LTO_KEYS.APPROVALS, []);
  const otdOrders = useOTDStorage(OTD_KEYS.ORDERS, []);

  // View state: 'traceability' | 'dealloss'
  const [activeTab, setActiveTab] = useState('traceability');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [lossReasonFilter, setLossReasonFilter] = useState('ALL');

  // Deal Loss Analytics computation
  const lossAnalytics = useMemo(() => {
    return getDealLossAnalytics(leads, quotations);
  }, [leads, quotations]);

  // Funnel calculations
  const stageStats = [
    { name: '1. Lead Creation', count: leads.length, color: 'bg-violet-500' },
    { name: '2. Lead Verification', count: leads.filter(l => l.status !== 'New').length, color: 'bg-blue-500' },
    { name: '3. Follow-up / Enquiry', count: followUps.length, color: 'bg-sky-500' },
    { name: '4. Quotation', count: quotations.length, color: 'bg-indigo-500' },
    { name: '5. Negotiation', count: negotiations.length, color: 'bg-purple-500' },
    { name: '6. Approval', count: approvals.length, color: 'bg-amber-500' },
    { name: '7. Converted to Order', count: leads.filter(l => l.convertedOrderId || l.status === 'Approved').length, color: 'bg-emerald-500' }
  ];

  // Lead Source Analysis
  const sources = ['Website', 'WhatsApp', 'Phone', 'Email', 'Reference', 'Social Media', 'Walk-in', 'Other'];
  const sourceData = sources.map(src => {
    const total = leads.filter(l => l.leadSource === src).length;
    const converted = leads.filter(l => l.leadSource === src && (l.convertedOrderId || l.status === 'Approved')).length;
    const rate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
    return { source: src, total, converted, rate };
  }).filter(s => s.total > 0);

  // Traceability Records
  const traceabilityList = leads.map(l => {
    const q = quotations.find(qt => qt.quotationNo === l.quotationNo || qt.leadId === l.leadId);
    const a = approvals.find(ap => ap.leadId === l.leadId || ap.approvalId === l.approvalId);
    const o = otdOrders.find(ord => ord.orderNumber === l.convertedOrderId || ord.leadId === l.leadId);

    return {
      leadId: l.leadId,
      customerName: l.customerName,
      source: l.leadSource,
      product: l.productService,
      priority: l.priority,
      status: l.status,
      quotationNo: q?.quotationNo || l.quotationNo || '—',
      quoteAmount: q?.grandTotal || a?.quotationAmount || 0,
      approvalId: a?.approvalId || l.approvalId || '—',
      approvalStatus: a?.approvalStatus || '—',
      orderId: o?.orderNumber || l.convertedOrderId || '—',
      otdStage: o?.currentStage || '—'
    };
  });

  const filteredTraceability = traceabilityList.filter(item => {
    if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const match =
        item.leadId?.toLowerCase().includes(s) ||
        item.customerName?.toLowerCase().includes(s) ||
        item.quotationNo?.toLowerCase().includes(s) ||
        item.approvalId?.toLowerCase().includes(s) ||
        item.orderId?.toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  // Filtered Lost Leads for Tab 2
  const filteredLostLeads = useMemo(() => {
    return lossAnalytics.lostLeads.filter(item => {
      if (lossReasonFilter !== 'ALL' && item.lossReason !== lossReasonFilter) return false;
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const match =
          item.leadId?.toLowerCase().includes(s) ||
          item.customerName?.toLowerCase().includes(s) ||
          item.competitorName?.toLowerCase().includes(s) ||
          item.lossReason?.toLowerCase().includes(s) ||
          item.lostRemarks?.toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });
  }, [lossAnalytics.lostLeads, lossReasonFilter, searchTerm]);

  // Export Traceability CSV
  const handleExportCSV = () => {
    const headers = [
      'Lead ID',
      'Customer',
      'Source',
      'Product / Service',
      'Priority',
      'Lead Status',
      'Quotation No',
      'Quotation Amount',
      'Approval ID',
      'Approval Status',
      'Order ID (OTD)',
      'OTD Current Stage'
    ];

    const rows = filteredTraceability.map(r => [
      r.leadId,
      `"${r.customerName}"`,
      r.source,
      `"${r.product}"`,
      r.priority,
      r.status,
      r.quotationNo,
      r.quoteAmount,
      r.approvalId,
      r.approvalStatus,
      r.orderId,
      r.otdStage
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lead_Traceability_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Deal Loss CSV
  const handleExportLossCSV = () => {
    const headers = [
      'Lead ID',
      'Customer',
      'Product / Requirement',
      'Lost Deal Value (INR)',
      'Primary Loss Reason',
      'Winning Competitor',
      'Competitor Price',
      'Loss Date',
      'Client Feedback Remarks'
    ];

    const rows = filteredLostLeads.map(l => [
      l.leadId,
      `"${l.customerName}"`,
      `"${l.productService}"`,
      l.estimatedValue || 0,
      `"${l.lossReason || 'Other'}"`,
      `"${l.competitorName || '—'}"`,
      l.competitorPrice || 0,
      l.lostDate || '—',
      `"${(l.lostRemarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Deal_Loss_Analysis_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 p-5 rounded-3xl text-white shadow-xl border border-teal-800/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-extrabold text-[10px] tracking-wider uppercase border border-teal-500/30">
              Intelligence & Pipeline Audit
            </span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight mt-1 text-white">
            Lead Reports & Deal Loss Analytics
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Monitor complete end-to-end sales conversion lifecycle, audit won vs lost deals, and analyze competitor pricing drivers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
          <button
            onClick={() => setActiveTab('traceability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'traceability'
                ? 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Traceability & Funnel</span>
          </button>
          <button
            onClick={() => setActiveTab('dealloss')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dealloss'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Deal Loss Analysis</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-200 text-[10px]">
              {lossAnalytics.totalLostCount}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CONVERSION FUNNEL & TRACEABILITY                                   */}
      {/* ========================================================================= */}
      {activeTab === 'traceability' && (
        <div className="space-y-4">
          {/* Funnel Progress */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Conversion Funnel & Drop-off Tracker</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {stageStats.map((st, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-[10px] font-bold uppercase text-slate-500 truncate mb-1">
                    {st.name}
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {st.count}
                  </div>
                  <div className={`h-1.5 w-full rounded-full ${st.color} mt-2 opacity-80`} />
                </div>
              ))}
            </div>
          </div>

          {/* Traceability Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Lead, Customer, Quote #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Sources</option>
                  {sources.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Lead ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Product / Req</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Quote #</th>
                    <th className="py-2.5 px-3 text-right">Quote Value</th>
                    <th className="py-2.5 px-3">OTD Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTraceability.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-extrabold text-indigo-600 dark:text-indigo-400">
                        {item.leadId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {item.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {item.product}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {item.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {item.status}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                        {item.quotationNo}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        ₹ {Number(item.quoteAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.orderId !== '—' ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-800">
                            {item.orderId}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEAL LOSS & COMPETITOR INTELLIGENCE ANALYTICS                       */}
      {/* ========================================================================= */}
      {activeTab === 'dealloss' && (
        <div className="space-y-4">
          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Deals Lost */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deals Lost / Rejected</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{lossAnalytics.totalLostCount}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Out of {lossAnalytics.totalLostCount + lossAnalytics.totalWonCount} closed deals</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>

            {/* 2. Total Lost Value */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pipeline Revenue Lost</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  ₹ {(lossAnalytics.totalLostValue / 100000).toFixed(1)} L
                </h3>
                <p className="text-[11px] text-rose-500 font-semibold mt-0.5">Direct opportunity cost</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* 3. Win-Loss Ratio */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Win Rate</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{lossAnalytics.winRate}%</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{lossAnalytics.totalWonCount} Won vs {lossAnalytics.totalLostCount} Lost</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* 4. Top Loss Driver */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Top Loss Driver</p>
                <h3 className="text-base font-extrabold text-purple-600 truncate mt-1">
                  {lossAnalytics.reasonBreakdown[0]?.reason || 'Budget Constraint'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {lossAnalytics.reasonBreakdown[0]?.count || 0} deals lost
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Loss Reasons Breakdown & Competitor Intelligence Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Loss Drivers Distribution */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-rose-600" />
                  <span>Loss Reasons Breakdown (By Value & Deals)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">Sorted by Lost Value</span>
              </div>

              <div className="space-y-3">
                {lossAnalytics.reasonBreakdown.map((r, idx) => {
                  const percentOfTotal = lossAnalytics.totalLostValue > 0
                    ? ((r.totalValue / lossAnalytics.totalLostValue) * 100).toFixed(0)
                    : 0;

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {r.reason}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-bold">{r.count} Deals</span>
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            ₹ {Number(r.totalValue).toLocaleString('en-IN')} ({percentOfTotal}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentOfTotal}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Competitor Win Matrix */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>Competitor Steal Matrix (Who is taking deals?)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">Market Intelligence</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-2">Competitor</th>
                      <th className="p-2 text-center">Deals Won</th>
                      <th className="p-2 text-right">Lost Value (₹)</th>
                      <th className="p-2">Recommended Counter-Measure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lossAnalytics.topCompetitors.map((comp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2 font-bold text-slate-900 dark:text-white">
                          {comp.competitor}
                        </td>
                        <td className="p-2 text-center font-extrabold text-rose-600">
                          {comp.dealsWonAgainstUs}
                        </td>
                        <td className="p-2 text-right font-black text-slate-800 dark:text-slate-200">
                          ₹ {Number(comp.lostRevenue).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                          {idx === 0 ? 'Offer 30-day credit & volume rebate' : 'Highlight BIS Grade 1 & warranty assurance'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Deal Loss Actionable Recommendations Playbook */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-amber-900 dark:text-amber-200 tracking-wider">
                Strategic Recommendations for Sales & Negotiation Team
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                1. <strong>Pricing Flexibility:</strong> 38% of deals are lost on price. Consider introducing tiered volume discounts or milestone-based retention pricing during initial quotation.
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                2. <strong>Delivery Lead Time (TAT):</strong> Fast-track inventory buffering for high-turnover structural steel to counter competitor 7-day fulfillment.
              </p>
            </div>
          </div>

          {/* Detailed Lost Deals Log Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search lost deals by client, competitor, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={lossReasonFilter}
                  onChange={(e) => setLossReasonFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Loss Drivers</option>
                  {lossAnalytics.reasonBreakdown.map(r => (
                    <option key={r.reason} value={r.reason}>{r.reason}</option>
                  ))}
                </select>

                <button
                  onClick={handleExportLossCSV}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Lost Deals CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Lead ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Requirement</th>
                    <th className="py-2.5 px-3 text-right">Lost Value (₹)</th>
                    <th className="py-2.5 px-3">Primary Loss Reason</th>
                    <th className="py-2.5 px-3">Winning Competitor</th>
                    <th className="py-2.5 px-3 text-right">Competitor Rate</th>
                    <th className="py-2.5 px-3">Debrief & Client Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLostLeads.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-extrabold text-rose-600 dark:text-rose-400">
                        {l.leadId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {l.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {l.productService}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-600">
                        ₹ {Number(l.estimatedValue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-extrabold text-[10px] border border-rose-200 dark:border-rose-800">
                          {l.lossReason || 'Unspecified'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {l.competitorName || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                        {l.competitorPrice ? `₹ ${Number(l.competitorPrice).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                        {l.lostRemarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
