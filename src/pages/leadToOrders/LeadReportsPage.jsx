import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';
import { useLeadStorage } from '../../hooks/useLeadStorage';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { LTO_KEYS } from '../../services/leadToOrderStorageService';
import { STORAGE_KEYS as OTD_KEYS } from '../../services/otdStorageService';

export function LeadReportsPage() {
  const navigate = useNavigate();

  const leads = useLeadStorage(LTO_KEYS.LEADS, []);
  const followUps = useLeadStorage(LTO_KEYS.FOLLOW_UPS, []);
  const quotations = useLeadStorage(LTO_KEYS.QUOTATIONS, []);
  const negotiations = useLeadStorage(LTO_KEYS.NEGOTIATIONS, []);
  const approvals = useLeadStorage(LTO_KEYS.APPROVALS, []);
  const otdOrders = useOTDStorage(OTD_KEYS.ORDERS, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');

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

  // Export CSV
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
    link.setAttribute('download', `Lead_to_Order_Traceability_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-teal-800/30">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 font-extrabold text-[11px] tracking-wider uppercase border border-teal-500/30">
              Commercial Analytics & Traceability
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-white">
            Lead to Order Performance Reports
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Audit conversion velocity, inspect full ID relationships across LD-xxxx, QT-xxxx, APP-xxxx, ORD-xxxx, and export complete commercial pipeline logs.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/30 transition-all cursor-pointer transform active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* 2-Column Analytics: Funnel Progress & Source Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel Bars */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              <span>Conversion Stage Distribution</span>
            </h2>
            <span className="text-[11px] text-slate-400">Total volume per phase</span>
          </div>

          <div className="space-y-3 pt-2">
            {stageStats.map((st, i) => {
              const maxVal = Math.max(...stageStats.map(s => s.count), 1);
              const pct = Math.round((st.count / maxVal) * 100);

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{st.name}</span>
                    <span className="font-black text-slate-900 dark:text-white">{st.count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${st.color} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Source Performance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Lead Source Conversion Rate</span>
            </h2>
            <span className="text-[11px] text-slate-400">Effectiveness by acquisition channel</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">Lead Source</th>
                  <th className="py-2.5 px-3 text-center">Inquiries</th>
                  <th className="py-2.5 px-3 text-center">Orders Converted</th>
                  <th className="py-2.5 px-3 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sourceData.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{s.source}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-600 dark:text-slate-400">{s.total}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{s.converted}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">{s.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Complete Traceability Log Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>Full Pipeline Traceability Matrix (Lead ID → Quote → Approval → Order)</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Preserved unbroken relational chain from initial contact to active Order to Delivery stage
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search matrix..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-400 border-y border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3">Lead ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Product / Service</th>
                <th className="py-3 px-3">Quotation No</th>
                <th className="py-3 px-3 text-right">Quote Value</th>
                <th className="py-3 px-3">Approval ID</th>
                <th className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400">Order ID (OTD)</th>
                <th className="py-3 px-3">OTD Workflow Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTraceability.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No matching traceability records found.
                  </td>
                </tr>
              ) : (
                filteredTraceability.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-violet-600 dark:text-violet-400">
                      {row.leadId}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">
                      {row.customerName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                      {row.product}
                    </td>
                    <td className="py-3 px-3 font-semibold text-indigo-600 dark:text-indigo-400">
                      {row.quotationNo}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-800 dark:text-slate-200">
                      {row.quoteAmount > 0 ? `₹ ${Number(row.quoteAmount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-amber-600 dark:text-amber-400">
                      {row.approvalId}
                    </td>
                    <td className="py-3 px-3">
                      {row.orderId !== '—' ? (
                        <button
                          onClick={() => navigate('/sales/orders')}
                          className="font-black text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{row.orderId}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {row.otdStage !== '—' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {row.otdStage}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
