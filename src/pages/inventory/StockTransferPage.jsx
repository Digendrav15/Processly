import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { useInventoryStorage } from '../../hooks/useInventoryStorage';
import {
  INV_KEYS,
  recordStockMovement
} from '../../services/inventoryStorageService';
import { useAuth } from '../../context/AuthContext';

export function StockTransferPage() {
  const { user } = useAuth();
  const items = useInventoryStorage(INV_KEYS.ITEMS, []);
  const warehouses = useInventoryStorage(INV_KEYS.WAREHOUSES, []);
  const transactions = useInventoryStorage(INV_KEYS.TRANSACTIONS, []);

  const transferTxns = transactions.filter((t) => t.type === 'TRANSFER');

  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState(warehouses[0]?.name || 'Central Warehouse');
  const [toWarehouse, setToWarehouse] = useState(warehouses[1]?.name || 'Raw Material Shed 2');
  const [referenceNo, setReferenceNo] = useState(`TRF-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (fromWarehouse === toWarehouse) {
      setErrorMsg('Source warehouse and destination warehouse cannot be the same.');
      return;
    }

    if (!selectedItemId || !quantity || Number(quantity) <= 0) {
      setErrorMsg('Please specify an item and valid transfer quantity.');
      return;
    }

    if (selectedItem && Number(quantity) > selectedItem.currentStock) {
      setErrorMsg(`Insufficient stock in source depot. Available: ${selectedItem.currentStock} ${selectedItem.unit}.`);
      return;
    }

    try {
      recordStockMovement({
        type: 'TRANSFER',
        itemId: selectedItemId,
        quantity: Number(quantity),
        fromWarehouse,
        toWarehouse,
        referenceType: 'INTERNAL_TRANSFER',
        referenceNo: referenceNo || 'TRF-TRANSFER',
        notes: notes || `Internal stock transfer from ${fromWarehouse} to ${toWarehouse}`,
        date: new Date().toISOString(),
        performedBy: user?.name || 'Warehouse Logistics Mgr'
      });

      setSuccessMsg(`Successfully transferred ${quantity} ${selectedItem.unit} to ${toWarehouse}!`);
      setQuantity('');
      setReferenceNo(`TRF-${Date.now().toString().slice(-6)}`);
      setNotes('');

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Transfer failed.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </div>
          Inter-Warehouse Stock Transfer
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Relocate material inventory between depots, processing floors & storage yards.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Create Transfer Order
          </h2>

          <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Stock Item to Transfer *
              </label>
              <select
                required
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.sku}) - Current: {i.currentStock} {i.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Source Depot *
                </label>
                <select
                  value={fromWarehouse}
                  onChange={(e) => setFromWarehouse(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.name}>{w.name.split('(')[0]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Depot *
                </label>
                <select
                  value={toWarehouse}
                  onChange={(e) => setToWarehouse(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.name}>{w.name.split('(')[0]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Transfer Qty ({selectedItem?.unit || 'Units'}) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                max={selectedItem?.currentStock || 0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Transfer Memo / Challan No.
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Reason / Purpose
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Line replenishment, seasonal transfer"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={selectedItem?.currentStock <= 0}
              className={`w-full py-2.5 text-white rounded-xl font-extrabold shadow-md flex items-center justify-center gap-1.5 ${
                selectedItem?.currentStock <= 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Execute Transfer</span>
            </button>
          </form>
        </div>

        {/* Transfer History Table */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Inter-Depot Transfers History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Transfer ID & Date</th>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Movement Route</th>
                  <th className="py-2.5 px-3">Authorizer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transferTxns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No inter-warehouse transfer records yet.
                    </td>
                  </tr>
                ) : (
                  transferTxns.map((tx) => (
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
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800">
                          {tx.quantity} {tx.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span>{tx.fromWarehouse.split('(')[0]}</span>
                          <ArrowRight className="w-3 h-3 text-blue-500" />
                          <span className="text-blue-600 dark:text-blue-400">{tx.toWarehouse.split('(')[0]}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{tx.notes}</div>
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
