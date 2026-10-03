import React, { useState } from 'react';
import { FileSpreadsheet, Clock, DollarSign, Truck, ShoppingBag, Download } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS } from '../../services/otdStorageService';

export function OTDReportsPage() {
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const stageHistory = useOTDStorage(STORAGE_KEYS.STAGE_HISTORY, []);

  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            OTD System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Order Report</span>
        </button>
        <button
          onClick={() => setActiveTab('tat')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tat'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>TAT Performance Report</span>
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payment'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Payment Report</span>
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'delivery'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery Report</span>
        </button>
      </div>

      {/* Main Report Tables */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Data Available</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Reports use actual LocalStorage records only. No dummy data is pre-populated.
            </p>
          </div>
        ) : (
          <div>
            {/* 1. ORDER REPORT */}
            {activeTab === 'orders' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 px-3">Order Number</th>
                      <th className="pb-3 px-3">Customer</th>
                      <th className="pb-3 px-3">Order Date</th>
                      <th className="pb-3 px-3">Amount</th>
                      <th className="pb-3 px-3">Current Stage</th>
                      <th className="pb-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-bold text-indigo-600">{o.orderNumber}</td>
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">{o.customerName}</td>
                        <td className="py-3 px-3 text-slate-500">{o.orderDate}</td>
                        <td className="py-3 px-3 font-bold text-emerald-600">₹ {parseFloat(o.grandTotal || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{o.currentStage}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. TAT REPORT */}
            {activeTab === 'tat' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 px-3">Order #</th>
                      <th className="pb-3 px-3">Stage</th>
                      <th className="pb-3 px-3">Target TAT</th>
                      <th className="pb-3 px-3">Planned Date</th>
                      <th className="pb-3 px-3">Actual Date</th>
                      <th className="pb-3 px-3">Time Taken</th>
                      <th className="pb-3 px-3">TAT Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {stageHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-bold text-indigo-600">{h.orderNumber}</td>
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">{h.stage}</td>
                        <td className="py-3 px-3 text-slate-500">{h.tatValue ? `${h.tatValue} ${h.tatUnit}` : 'N/A'}</td>
                        <td className="py-3 px-3 text-slate-500">{h.plannedDate ? new Date(h.plannedDate).toLocaleString('en-IN') : 'N/A'}</td>
                        <td className="py-3 px-3 text-slate-500">{new Date(h.completionDate).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 font-bold">{h.actualTimeMinutes} mins</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              h.tatStatus === 'Completed Within TAT'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {h.tatStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. PAYMENT REPORT */}
            {activeTab === 'payment' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 px-3">Order Number</th>
                      <th className="pb-3 px-3">Customer</th>
                      <th className="pb-3 px-3">Total Amount</th>
                      <th className="pb-3 px-3">Payment Terms</th>
                      <th className="pb-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-bold text-indigo-600">{o.orderNumber}</td>
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">{o.customerName}</td>
                        <td className="py-3 px-3 font-bold text-emerald-600">₹ {parseFloat(o.grandTotal || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-slate-500">{o.paymentTerms || 'Standard'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. DELIVERY REPORT */}
            {activeTab === 'delivery' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 px-3">Order Number</th>
                      <th className="pb-3 px-3">Customer</th>
                      <th className="pb-3 px-3">Order Date</th>
                      <th className="pb-3 px-3">Expected Delivery</th>
                      <th className="pb-3 px-3">Current Stage</th>
                      <th className="pb-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-bold text-indigo-600">{o.orderNumber}</td>
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">{o.customerName}</td>
                        <td className="py-3 px-3 text-slate-500">{o.orderDate}</td>
                        <td className="py-3 px-3 font-bold text-indigo-600">{o.expectedDeliveryDate || 'N/A'}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{o.currentStage}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
