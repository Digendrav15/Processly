import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Boxes,
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  ChevronRight,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Sliders,
  DollarSign
} from 'lucide-react';
import {
  getInventoryMetrics,
  getInventoryItems,
  getUnifiedStockLedger
} from '../../services/inventoryStorageService';

export function InventoryDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [items, setItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const loadData = () => {
    setMetrics(getInventoryMetrics());
    setItems(getInventoryItems());
    setRecentTransactions(getUnifiedStockLedger().slice(0, 7));
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('inventory_storage_update', handleUpdate);
    window.addEventListener('purchase_storage_update', handleUpdate);
    window.addEventListener('otd_storage_update', handleUpdate);

    return () => {
      window.removeEventListener('inventory_storage_update', handleUpdate);
      window.removeEventListener('purchase_storage_update', handleUpdate);
      window.removeEventListener('otd_storage_update', handleUpdate);
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchCode = (item.code || item.sku || '').toLowerCase().includes(q);
        return matchName || matchCode;
      }
      return true;
    });
  }, [items, categoryFilter, searchTerm]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter((i) => Number(i.currentStock) <= Number(i.reorderLevel)).length;
  }, [items]);

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Inventory Dashboard...</div>;
  }

  return (
    <div className="space-y-3 pb-8">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] uppercase tracking-wider border border-orange-200 dark:border-orange-800/80">
            Inventory System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Inventory Executive Dashboard
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => navigate('/inventory/in-out')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>In & Out Ledger</span>
          </button>

          <button
            onClick={() => navigate('/inventory/indent')}
            className={`flex items-center gap-1.5 px-3 py-1 text-white font-extrabold text-xs rounded-lg shadow-xs transition-all cursor-pointer ${
              lowStockCount > 0
                ? 'bg-amber-600 hover:bg-amber-500 animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Low Stock Indents ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Total Valuation */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10.5px] font-bold text-slate-500 block">Total Valuation</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-black text-slate-900 dark:text-white">
              ₹{(metrics.totalValuation || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{metrics.totalSKUs} active items</span>
        </div>

        {/* Total Inward */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-500">Inward (Purchase)</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              +{metrics.totalInwardQty.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">GRN & Inward stock</span>
        </div>

        {/* Total Outward */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-500">Outward (Sales)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-black text-rose-600 dark:text-rose-400">
              -{metrics.totalOutwardQty.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">OTD Dispatched orders</span>
        </div>

        {/* Manual Adjustments */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10.5px] font-bold text-slate-500 block">Manual Adjustments</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
              {metrics.manualInQty + metrics.manualOutQty}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">units</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Physical Audit & Scrap</span>
        </div>

        {/* Low Stock Items (Indents Needed) */}
        <div
          onClick={() => navigate('/inventory/indent')}
          className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black text-amber-800 dark:text-amber-300">Need Indent (ROL)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-black text-amber-700 dark:text-amber-300">
              {lowStockCount}
            </span>
            <span className="text-[10px] text-amber-600 font-bold">items</span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 block font-semibold underline">
            Open Indent Page ➔
          </span>
        </div>

        {/* Critical Out of Stock */}
        <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black text-rose-800 dark:text-rose-300">Critical (0 Qty)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-black text-rose-700 dark:text-rose-300">
              {metrics.outOfStockCount}
            </span>
            <span className="text-[10px] text-rose-600 font-bold">items</span>
          </div>
          <span className="text-[10px] text-rose-700 dark:text-rose-400 mt-0.5 block font-semibold">
            Urgent Replenishment
          </span>
        </div>
      </div>

      {/* Low Stock Warning Banner if items need indents */}
      {lowStockCount > 0 && (
        <div className="p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300 dark:border-amber-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-amber-900 dark:text-amber-200">
                Action Required: {lowStockCount} Items are below Reorder Level (ROL)!
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Based on Average Daily Consumption and Supplier Lead Time, procurement indents should be raised immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/inventory/indent')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-lg shadow-sm whitespace-nowrap cursor-pointer transition-all self-start sm:self-auto"
          >
            Review & Raise Indents ➔
          </button>
        </div>
      )}

      {/* Main Grid: Stock Catalog with Master Engineering Columns & Recent In/Out Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left (2 Cols): Live Items Catalog with all 7 requested parameters */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter stock items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-hidden"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[11px] font-bold text-slate-400">
              Showing {filteredItems.length} SKUs
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    <th className="px-3 py-2">Item Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Current Stock</th>
                    <th className="px-3 py-2 text-right">ADC</th>
                    <th className="px-3 py-2 text-right">Lead Time</th>
                    <th className="px-3 py-2 text-right">SF</th>
                    <th className="px-3 py-2 text-right">ROL</th>
                    <th className="px-3 py-2 text-right">MOQ</th>
                    <th className="px-3 py-2 text-right">Max Level</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredItems.map((item) => {
                    const isLow = item.currentStock <= item.reorderLevel;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white text-[11.5px]">
                          <div>{item.name}</div>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            {item.code}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <span className={`font-black text-xs ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                          {item.avgDailyConsumption}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                          {item.leadTimeDays}d
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-500 text-[11px] whitespace-nowrap">
                          {item.safetyFactor}x
                        </td>
                        <td className="px-3 py-2 text-right font-black text-amber-700 dark:text-amber-300 text-[11px] whitespace-nowrap bg-amber-50/40 dark:bg-amber-950/20">
                          {item.reorderLevel}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {item.moq}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {item.maxLevel}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {isLow ? (
                            <Link
                              to="/inventory/indent"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200 border border-amber-300"
                            >
                              <span>Indent Needed</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                              Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right (1 Col): Recent In/Out Flow feed */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-orange-500" />
              Live In / Out Flow
            </h3>
            <button
              onClick={() => navigate('/inventory/in-out')}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Full Ledger ➔
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No stock transactions logged yet.
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const isIn = tx.type === 'INWARD';
                return (
                  <div key={tx.id} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`p-1 rounded-md text-[10px] font-extrabold ${
                            isIn
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                          }`}
                        >
                          {isIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-[11.5px]">
                          {tx.itemName}
                        </span>
                      </div>
                      <span className={`font-black text-xs ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIn ? '+' : '-'}{tx.quantity} {tx.unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-1">
                      <span>{tx.sourceLabel || tx.source}</span>
                      <span className="font-mono text-slate-400">
                        {new Date(tx.date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
