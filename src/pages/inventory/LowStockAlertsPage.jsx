import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShoppingCart,
  Boxes,
  ArrowRight,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';
import { useInventoryStorage } from '../../hooks/useInventoryStorage';
import { INV_KEYS } from '../../services/inventoryStorageService';

export function LowStockAlertsPage() {
  const navigate = useNavigate();
  const items = useInventoryStorage(INV_KEYS.ITEMS, []);
  const warehouses = useInventoryStorage(INV_KEYS.WAREHOUSES, []);

  // Filter low stock & out of stock
  const alertItems = useMemo(() => {
    return items
      .filter((i) => i.currentStock <= i.minStock)
      .sort((a, b) => (a.currentStock / (a.minStock || 1)) - (b.currentStock / (b.minStock || 1)));
  }, [items]);

  const outOfStockCount = alertItems.filter((i) => i.currentStock <= 0).length;
  const lowStockCount = alertItems.filter((i) => i.currentStock > 0).length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            Low Stock & Reorder Trigger Hub
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Automated alerts for items at or below minimum safety threshold.
          </p>
        </div>

        <button
          onClick={() => navigate('/purchase/indent')}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Raise Purchase Indent</span>
        </button>
      </div>

      {/* Alert KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {alertItems.length} SKUs
          </div>
          <div className="text-[11px] text-slate-400">Require supplier replenishment</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Out of Stock (Zero)</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {outOfStockCount} SKUs
          </div>
          <div className="text-[11px] text-rose-500 font-semibold">Immediate production risk!</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Low Stock Buffer</span>
            <Boxes className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {lowStockCount} SKUs
          </div>
          <div className="text-[11px] text-amber-600 font-semibold">Below safety buffer level</div>
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Procurement Reorder Matrix
          </h2>
          <span className="text-xs text-slate-400">
            Suggested Reorder Qty = (Max Capacity - Current Stock)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Warehouse Depot</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Min Threshold</th>
                <th className="py-3 px-3">Suggested Reorder</th>
                <th className="py-3 px-3">Urgency Status</th>
                <th className="py-3 px-4 text-right">Procure Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {alertItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      All inventory stock levels are optimal!
                    </p>
                    <p className="text-xs">No items currently below minimum safety thresholds.</p>
                  </td>
                </tr>
              ) : (
                alertItems.map((item) => {
                  const wh = warehouses.find((w) => w.id === item.warehouseId);
                  const isZero = item.currentStock <= 0;
                  const suggestedReorder = Math.max(
                    item.minStock * 2,
                    (item.maxStock || item.minStock * 4) - item.currentStock
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                          {item.sku}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {item.category}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{wh ? wh.name.split('(')[0] : 'Central'}</div>
                        <div className="text-[10px] text-slate-400">{item.locationRack || 'Store'}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`font-black font-mono text-sm ${
                            isZero ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400">
                        {item.minStock} {item.unit}
                      </td>

                      <td className="py-3 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                        +{suggestedReorder} {item.unit}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isZero
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {isZero ? 'CRITICAL (OUT OF STOCK)' : 'LOW STOCK WARNING'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate('/purchase/indent')}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>Indent</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
