import React from 'react';
import { ShoppingCart, Package, Truck, Boxes, DollarSign, ArrowUpRight, Plus, FileCheck } from 'lucide-react';

export function PurchaseDashboardPage() {
  const metrics = [
    { title: 'Total Purchase Spend', value: '₹ 18,40,000', change: '+6.5%', icon: DollarSign, color: 'amber' },
    { title: 'Open Requisitions', value: '18 Pending', change: '4 Urgents', icon: FileCheck, color: 'orange' },
    { title: 'Active Purchase Orders', value: '29 Orders', change: '8 In-Transit', icon: Package, color: 'amber' },
    { title: 'Approved Vendors', value: '45 Suppliers', change: '98% On-time', icon: Truck, color: 'emerald' },
  ];

  const recentPOs = [
    { id: 'PO-8821', vendor: 'Jindal Steel & Power', item: 'Raw Steel Sheets 5mm', qty: '50 Tons', total: '₹ 8,50,000', status: 'Dispatched' },
    { id: 'PO-8820', vendor: 'Finolex Cables Ltd', item: 'Industrial Armored Cables', qty: '1200 Mtr', total: '₹ 3,20,000', status: 'Approved' },
    { id: 'PO-8819', vendor: 'Supreme Polymers', item: 'High Density PVC Granules', qty: '15 Tons', total: '₹ 4,10,000', status: 'Delivered' },
  ];

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border border-amber-200 dark:border-amber-800/80">
            Purchase System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Procurement & Supplier Management</h1>
        </div>
        <button className="flex items-center space-x-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all self-start sm:self-auto cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Requisition</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{m.title}</span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{m.value}</p>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-2">{m.change}</p>
            </div>
          );
        })}
      </div>

      {/* PO List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">Active Purchase Orders (PO)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 px-2">PO #</th>
                <th className="pb-3 px-2">Supplier Vendor</th>
                <th className="pb-3 px-2">Material / Item</th>
                <th className="pb-3 px-2">Quantity</th>
                <th className="pb-3 px-2">Total Amount</th>
                <th className="pb-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {recentPOs.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-2 font-bold text-amber-600 dark:text-amber-400">{po.id}</td>
                  <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">{po.vendor}</td>
                  <td className="py-3 px-2 text-slate-500">{po.item}</td>
                  <td className="py-3 px-2 font-mono text-slate-600 dark:text-slate-400">{po.qty}</td>
                  <td className="py-3 px-2 font-extrabold text-slate-900 dark:text-white">{po.total}</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
