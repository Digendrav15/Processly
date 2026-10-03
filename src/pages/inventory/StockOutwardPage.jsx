import React, { useState } from 'react';
import {
  ArrowUpRight,
  Search,
  CheckCircle2,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { useInventoryStorage } from '../../hooks/useInventoryStorage';
import {
  INV_KEYS,
  recordStockMovement
} from '../../services/inventoryStorageService';
import { useAuth } from '../../context/AuthContext';

export function StockOutwardPage() {
  const { user } = useAuth();
  const items = useInventoryStorage(INV_KEYS.ITEMS, []);
  const warehouses = useInventoryStorage(INV_KEYS.WAREHOUSES, []);
  const transactions = useInventoryStorage(INV_KEYS.TRANSACTIONS, []);

  // Filter outward transactions only
  const outwardTxns = transactions.filter((t) => t.type === 'OUTWARD');

  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState(warehouses[0]?.name || 'Central Warehouse');
  const [customerDestination, setCustomerDestination] = useState('');
  const [referenceType, setReferenceType] = useState('SALES_ORDER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleOutwardSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedItemId || !quantity || Number(quantity) <= 0) {
      setErrorMsg('Please select an item and enter a valid quantity.');
      return;
    }

    if (selectedItem && Number(quantity) > selectedItem.currentStock) {
      setErrorMsg(`Insufficient stock! Available in stock is only ${selectedItem.currentStock} ${selectedItem.unit}.`);
      return;
    }

    try {
      recordStockMovement({
        type: 'OUTWARD',
        itemId: selectedItemId,
        quantity: Number(quantity),
        fromWarehouse,
        toWarehouse: customerDestination || 'Customer / Client Dispatch',
        referenceType,
        referenceNo: referenceNo || 'DIRECT-OUT',
        notes,
        date: new Date().toISOString(),
        performedBy: user?.name || 'Dispatch Executive'
      });

      setSuccessMsg(`Successfully dispatched ${quantity} ${selectedItem?.unit || 'units'} from inventory!`);
      setQuantity('');
      setReferenceNo('');
      setCustomerDestination('');
      setNotes('');

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record outward dispatch.');
    }
  };

  const filteredOutward = outwardTxns.filter((t) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.itemName?.toLowerCase().includes(q) ||
      t.sku?.toLowerCase().includes(q) ||
      t.referenceNo?.toLowerCase().includes(q) ||
      t.toWarehouse?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          Material Outward & Dispatch (Stock Issue)
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Issue stock against verified Sales Orders, internal consumption or dealer dispatches.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in-50 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in-50 duration-200">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Outward Form (Left) & Live Outward Ledger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Outward Form Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Record Stock Outward
              </h2>
              <p className="text-[11px] text-slate-400">
                Deducts stock immediately upon dispatch
              </p>
            </div>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          <form onSubmit={handleOutwardSubmit} className="space-y-3.5 text-xs">
            {/* Item Selection */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Select Stock Item (SKU) *
              </label>
              <select
                required
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.sku}) - Avail: {i.currentStock} {i.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Item Quick Info Pill */}
            {selectedItem && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-slate-400">Location:</span>{' '}
                  <strong className="text-slate-700 dark:text-slate-300">{selectedItem.locationRack || 'Store'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Available:</span>{' '}
                  <strong
                    className={`font-bold ${
                      selectedItem.currentStock <= 0
                        ? 'text-rose-600'
                        : selectedItem.currentStock <= selectedItem.minStock
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {selectedItem.currentStock} {selectedItem.unit}
                  </strong>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Dispatch Quantity ({selectedItem?.unit || 'Units'}) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                max={selectedItem?.currentStock || 0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 20"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Dispatching Warehouse */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Issuing Warehouse *
              </label>
              <select
                value={fromWarehouse}
                onChange={(e) => setFromWarehouse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Destination */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Customer / Consignee Destination *
              </label>
              <input
                type="text"
                required
                value={customerDestination}
                onChange={(e) => setCustomerDestination(e.target.value)}
                placeholder="e.g. Apex Industrial Solutions Ltd"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Reference Type & No */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Reference Type
                </label>
                <select
                  value={referenceType}
                  onChange={(e) => setReferenceType(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="SALES_ORDER">Sales Order</option>
                  <option value="DISPATCH_CHALLAN">Delivery Challan</option>
                  <option value="INTERNAL_CONSUMPTION">Internal Department</option>
                  <option value="R&D">Testing / Sample</option>
                  <option value="DIRECT">Direct Issue</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Order / Challan No.
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. ORD-1002"
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Notes / Remarks */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Dispatch Remarks & Transporter
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Consignment tracking no, packaging notes, etc."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={selectedItem?.currentStock <= 0}
              className={`w-full py-2.5 text-white rounded-xl font-extrabold shadow-md transition-colors flex items-center justify-center gap-1.5 ${
                selectedItem?.currentStock <= 0
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-700 cursor-pointer'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Confirm & Issue Stock</span>
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Outward Transactions History */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Outward Transactions Log
              </h2>
              <p className="text-xs text-slate-500">
                Audited stock issues and dispatches
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search outward records..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date & ID</th>
                  <th className="py-2.5 px-3">Item Name & SKU</th>
                  <th className="py-2.5 px-3">Dispatched Qty</th>
                  <th className="py-2.5 px-3">Warehouse Out</th>
                  <th className="py-2.5 px-3">Order / Reference</th>
                  <th className="py-2.5 px-3">Issued By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOutward.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No material outward transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredOutward.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {tx.id}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {tx.itemName}
                        </div>
                        <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
                          {tx.sku}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800">
                          -{tx.quantity} {tx.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{tx.fromWarehouse}</div>
                        <div className="text-[10px] text-slate-400">To: {tx.toWarehouse}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {tx.referenceNo}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{tx.referenceType}</span>
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {tx.performedBy}
                      </td>
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
