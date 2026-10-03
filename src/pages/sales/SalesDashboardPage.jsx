import React from 'react';
import { LayoutDashboard, ShoppingBag, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, Plus, Users, DollarSign, Layers } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, calculateRemainingTime, calculateTATStatus } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';

export function SalesDashboardPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const customers = useOTDStorage(STORAGE_KEYS.CUSTOMERS, []);
  const stages = useOTDStorage(STORAGE_KEYS.STAGES, []);
  const systems = useOTDStorage(STORAGE_KEYS.SYSTEMS, []);

  // Compute actual metrics from local data
  const totalOrdersCount = orders.length;
  const newOrdersCount = orders.filter((o) => o.status === 'New Order' || o.currentStage === 'New Order').length;
  const inProgressCount = orders.filter((o) => o.status !== 'Closed' && o.status !== 'Delivered').length;

  let tatDueSoonCount = 0;
  let tatOverdueCount = 0;

  orders.forEach((o) => {
    if (o.status !== 'Closed' && o.plannedCompletionDate) {
      const status = calculateTATStatus(o.stageStartDate, o.plannedCompletionDate);
      if (status === 'Due Soon') tatDueSoonCount++;
      if (status === 'Overdue') tatOverdueCount++;
    }
  });

  const deliveredCount = orders.filter((o) => o.currentStage === 'Delivered' || o.status === 'Delivered').length;
  const closedCount = orders.filter((o) => o.status === 'Closed' || o.currentStage === 'Order Closed').length;

  const totalRevenueSum = orders.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            OTD System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Order To Delivery Dashboard</h1>
        </div>
        <button
          onClick={() => navigate('/sales/orders')}
          className="flex items-center justify-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create New Order</span>
        </button>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            ₹ {totalRevenueSum.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{totalOrdersCount} Total Orders</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{inProgressCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">{newOrdersCount} New Orders</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TAT Due Soon</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">{tatDueSoonCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Requires Attention</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TAT Overdue</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">{tatOverdueCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Exceeded TAT Target</p>
        </div>
      </div>

      {/* Main Content Area */}
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <LayoutDashboard className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Empty Dashboard State</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No dummy data is pre-inserted. Add Systems, Stages, TAT configs, Customers, Products, and Orders to view real-time data metrics.
          </p>
          <div className="flex items-center justify-center space-x-3 mt-4">
            <button
              onClick={() => navigate('/master-system/systems-stages')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
            >
              1. Add System & Stages
            </button>
            <button
              onClick={() => navigate('/master-system/sales-vendors')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
            >
              2. Add Sales Vendor
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Active Orders Summary</h3>
              <button
                onClick={() => navigate('/sales/orders')}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline"
              >
                View All Orders →
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-3 px-2">Order ID</th>
                    <th className="pb-3 px-2">Customer</th>
                    <th className="pb-3 px-2">Amount</th>
                    <th className="pb-3 px-2">Current Stage</th>
                    <th className="pb-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-2 font-bold text-indigo-600 dark:text-indigo-400">{o.orderNumber}</td>
                      <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-200">{o.customerName}</td>
                      <td className="py-3 px-2 font-extrabold text-slate-900 dark:text-white">
                        ₹ {parseFloat(o.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">{o.currentStage}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Metrics Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
              Workflow Overview
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">Delivered Orders:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{deliveredCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">Closed Orders:</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{closedCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">Configured Systems:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{systems.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500">Configured Stages:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{stages.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
