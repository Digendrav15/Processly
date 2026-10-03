import React, { useState } from 'react';
import { Workflow, CheckCircle2, Circle, ArrowRight, Clock, Search, Layers, FileText } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, calculateRemainingTime, calculateTATStatus } from '../../services/otdStorageService';

export function OrderTrackingPage() {
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const stages = useOTDStorage(STORAGE_KEYS.STAGES, []);
  const stageHistory = useOTDStorage(STORAGE_KEYS.STAGE_HISTORY, []);

  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');

  const activeOrder = orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || orders[0];

  const systemName = activeOrder?.systemName || 'Order To Delivery';
  const configuredStages = stages
    .filter((s) => s.status === 'Active' && s.systemName === systemName)
    .sort((a, b) => (parseInt(a.sequence, 10) || 0) - (parseInt(b.sequence, 10) || 0));

  const currentStageName = activeOrder?.currentStage || 'New Order';
  const currentStageIndex = configuredStages.findIndex((s) => s.stageName === currentStageName);

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            OTD System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Order Tracking & Timeline</h1>
        </div>
      </div>

      {/* Main Content */}
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <Workflow className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Orders Available</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create an order in Orders Management to view dynamic workflow timeline tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Selector List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
              Select Order to Track
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {orders.map((o) => {
                const isSelected = o.id === activeOrder?.id;
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">{o.orderNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {o.currentStage}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs mt-1 truncate">{o.customerName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Grand Total: ₹ {parseFloat(o.grandTotal || 0).toLocaleString('en-IN')}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline View */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">{activeOrder?.systemName}</span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Tracking Order: <span className="text-indigo-600 dark:text-indigo-400">{activeOrder?.orderNumber}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Customer: <strong>{activeOrder?.customerName}</strong></p>
              </div>
              <div className="text-xs text-right">
                <p className="text-slate-400">Current Stage</p>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">{activeOrder?.currentStage}</span>
              </div>
            </div>

            {/* Dynamic Stage Timeline */}
            {configuredStages.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active stages configured for System "{systemName}". Configure Stage Master in Masters page.
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  Dynamic Stage Progress Timeline
                </h3>
                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {configuredStages.map((stg, idx) => {
                    const isCompleted = idx < currentStageIndex || activeOrder?.status === 'Closed';
                    const isCurrent = idx === currentStageIndex && activeOrder?.status !== 'Closed';
                    const isUpcoming = idx > currentStageIndex && activeOrder?.status !== 'Closed';

                    const historyRecord = stageHistory.find(
                      (h) => h.orderNumber === activeOrder?.orderNumber && h.stage === stg.stageName
                    );

                    return (
                      <div key={stg.id} className="relative flex items-start space-x-4">
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white dark:ring-slate-900 ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-indigo-600 text-white animate-pulse'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? '→' : '○'}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 w-full space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                              #{stg.sequence}. {stg.stageName}
                            </h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : isCurrent
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                              }`}
                            >
                              {isCompleted ? 'Completed ✓' : isCurrent ? 'Active Stage →' : 'Upcoming Stage'}
                            </span>
                          </div>

                          {historyRecord && (
                            <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <p>Completed by: <strong>{historyRecord.employee}</strong></p>
                              <p>Completion Date: {new Date(historyRecord.completionDate).toLocaleString('en-IN')}</p>
                              <p>TAT Status: <strong className="text-emerald-600">{historyRecord.tatStatus}</strong></p>
                              {historyRecord.remarks && <p className="text-slate-400 italic">Remarks: "{historyRecord.remarks}"</p>}
                            </div>
                          )}

                          {isCurrent && activeOrder?.plannedCompletionDate && (
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-100 dark:border-slate-800 font-semibold">
                              Target Planned Date: {new Date(activeOrder.plannedCompletionDate).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
