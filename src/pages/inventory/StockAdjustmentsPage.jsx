import React, { useState } from 'react';
import {
  CheckCircle2,
  Scale
} from 'lucide-react';
import { useInventoryStorage } from '../../hooks/useInventoryStorage';
import {
  INV_KEYS,
  recordStockMovement
} from '../../services/inventoryStorageService';
import { useAuth } from '../../context/AuthContext';

export function StockAdjustmentsPage() {
  const { user } = useAuth();
  const items = useInventoryStorage(INV_KEYS.ITEMS, []);
  const transactions = useInventoryStorage(INV_KEYS.TRANSACTIONS, []);

  const adjustmentTxns = transactions.filter((t) => t.type === 'ADJUSTMENT');

  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [physicalCount, setPhysicalCount] = useState('');
  const [reason, setReason] = useState('Damaged / Expired');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];
  const bookStock = selectedItem ? Number(selectedItem.currentStock) || 0 : 0;
  const counted = physicalCount !== '' ? Number(physicalCount) : bookStock;
  const variance = counted - bookStock;

  const handleAdjustmentSubmit = (e) => {
    e.preventDefault();
    if (physicalCount === '' || isNaN(counted) || counted < 0) {
      alert('Please enter a valid physical count.');
      return;
    }

    if (variance === 0) {
      alert('Physical count matches book stock exactly (Variance = 0). No adjustment needed.');
      return;
    }

    try {
      recordStockMovement({
        type: 'ADJUSTMENT',
        itemId: selectedItemId,
        quantity: variance, // positive or negative
        fromWarehouse: variance < 0 ? 'Stock Write-off' : 'Audit Found',
        toWarehouse: variance > 0 ? 'Physical Audit In' : 'Scrap / Loss',
        referenceType: 'STOCK_AUDIT',
        referenceNo: `ADJ-${Date.now().toString().slice(-5)}`,
        notes: `Physical reconciliation. Book: ${bookStock}, Counted: ${counted}. Reason: ${reason}. ${notes}`,
        date: new Date().toISOString(),
        performedBy: user?.name || 'Inventory Auditor'
      });

      setSuccessMsg(`Stock reconciled! Variance of ${variance > 0 ? `+${variance}` : variance} ${selectedItem.unit} recorded.`);
      setPhysicalCount('');
      setNotes('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Adjustment failed.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 rounded-xl">
            <Scale className="w-5 h-5" />
          </div>
          Stock Adjustments & Physical Audit Reconciliation
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Reconcile physical floor counts with book stock, log discrepancies & write-offs.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adjustment Form */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Log Physical Count
          </h2>

          <form onSubmit={handleAdjustmentSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Select Item to Audit *
              </label>
              <select
                required
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setPhysicalCount('');
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Book vs Physical Comparison */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Book Stock (System):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {bookStock} {selectedItem?.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Counted Physical Stock:</span>
                <span className="font-bold text-indigo-600 font-mono">
                  {physicalCount !== '' ? physicalCount : '—'} {selectedItem?.unit}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Variance:</span>
                <span
                  className={`font-black font-mono text-sm ${
                    variance === 0
                      ? 'text-slate-500'
                      : variance > 0
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {variance > 0 ? `+${variance}` : variance} {selectedItem?.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Actual Physical Count ({selectedItem?.unit || 'Units'}) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={physicalCount}
                onChange={(e) => setPhysicalCount(e.target.value)}
                placeholder={`Current book is ${bookStock}`}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Discrepancy Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
              >
                <option value="Damaged / Expired">Damaged / Expired Goods</option>
                <option value="Shrinkage / Spillage">Evaporation / Shrinkage</option>
                <option value="Data Entry Correction">Prior Entry Correction</option>
                <option value="Theft / Lost">Lost / Missing</option>
                <option value="Surplus Found">Unrecorded Surplus Found</option>
                <option value="Cycle Count Audit">Routine Audit Calibration</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Auditor Notes & Justification
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details of physical audit, inspection team sign-off"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Apply Adjustment</span>
            </button>
          </form>
        </div>

        {/* Adjustments Audit Log */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Reconciliation Audit History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Audit ID & Date</th>
                  <th className="py-2.5 px-3">Item & SKU</th>
                  <th className="py-2.5 px-3">Variance</th>
                  <th className="py-2.5 px-3">Reason & Notes</th>
                  <th className="py-2.5 px-3">Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {adjustmentTxns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Zero stock discrepancies recorded. All balances healthy!
                    </td>
                  </tr>
                ) : (
                  adjustmentTxns.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{tx.id}</div>
                        <div className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{tx.itemName}</div>
                        <div className="font-mono text-[10px] text-indigo-500">{tx.sku}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                            tx.quantity > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {tx.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[220px]">
                        <div className="text-[11px] font-medium leading-tight">{tx.notes}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{tx.performedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
