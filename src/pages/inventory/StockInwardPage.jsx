import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  Package
} from 'lucide-react';
import { useInventoryStorage } from '../../hooks/useInventoryStorage';
import {
  INV_KEYS,
  recordStockMovement
} from '../../services/inventoryStorageService';
import { useAuth } from '../../context/AuthContext';

export function StockInwardPage() {
  const { user } = useAuth();
  const items = useInventoryStorage(INV_KEYS.ITEMS, []);
  const warehouses = useInventoryStorage(INV_KEYS.WAREHOUSES, []);
  const transactions = useInventoryStorage(INV_KEYS.TRANSACTIONS, []);

  // Filter inward transactions only
  const inwardTxns = transactions.filter((t) => t.type === 'INWARD');

  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [toWarehouse, setToWarehouse] = useState(warehouses[0]?.name || 'Central Warehouse');
  const [vendorSource, setVendorSource] = useState('');
  const [referenceType, setReferenceType] = useState('GRN');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const handleInwardSubmit = (e) => {
    e.preventDefault();
    if (!selectedItemId || !quantity || Number(quantity) <= 0) {
      alert('Please enter a valid item and received quantity.');
      return;
    }

    try {
      recordStockMovement({
        type: 'INWARD',
        itemId: selectedItemId,
        quantity: Number(quantity),
        fromWarehouse: vendorSource || 'Supplier Delivery',
        toWarehouse,
        referenceType,
        referenceNo: referenceNo || 'DIRECT-IN',
        notes,
        date: new Date().toISOString(),
        performedBy: user?.name || 'Store Executive'
      });

      setSuccessMsg(`Successfully received ${quantity} ${selectedItem?.unit || 'units'} into stock!`);
      setQuantity('');
      setReferenceNo('');
      setVendorSource('');
      setNotes('');

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to record inward movement.');
    }
  };

  const filteredInward = inwardTxns.filter((t) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.itemName?.toLowerCase().includes(q) ||
      t.sku?.toLowerCase().includes(q) ||
      t.referenceNo?.toLowerCase().includes(q) ||
      t.fromWarehouse?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          Material Inward & Receiving (Stock In)
        </h1>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          Receive raw materials, finished stock & purchase consignments into warehouse locations.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in-50 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Inward Entry Form (Left) & Live Inward Ledger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Inward Form Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Record Stock Inward
              </h2>
              <p className="text-[11px] text-slate-400">
                Auto-updates item current balance in ledger
              </p>
            </div>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <form onSubmit={handleInwardSubmit} className="space-y-3.5 text-xs">
            {/* Item Selection */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Select Stock Item (SKU) *
              </label>
              <select
                required
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.sku}) - Cur: {i.currentStock} {i.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Item Quick Info Pill */}
            {selectedItem && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-xl flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-slate-400">Category:</span>{' '}
                  <strong className="text-slate-700 dark:text-slate-300">{selectedItem.category}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Current Qty:</span>{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {selectedItem.currentStock} {selectedItem.unit}
                  </strong>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Received Quantity ({selectedItem?.unit || 'Units'}) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Destination Warehouse */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Receiving Warehouse *
              </label>
              <select
                value={toWarehouse}
                onChange={(e) => setToWarehouse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor / Supplier */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Supplier / Vendor Source
              </label>
              <input
                type="text"
                value={vendorSource}
                onChange={(e) => setVendorSource(e.target.value)}
                placeholder="e.g. Jindal Aluminum Ltd"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="GRN">Purchase GRN</option>
                  <option value="PO">Purchase Order</option>
                  <option value="INVOICE">Vendor Invoice</option>
                  <option value="RETURN">Customer Return</option>
                  <option value="PRODUCTION">Production Floor</option>
                  <option value="DIRECT">Direct Stock In</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ref / GRN No.
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. GRN-0501"
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Notes / Remarks */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Inspection & Quality Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="QC inspection remarks, batch condition, etc."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Confirm & Inward Stock</span>
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Inward Transactions History */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Inward Transactions Log
              </h2>
              <p className="text-xs text-slate-500">
                Verified goods receipts into inventory
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search inward records..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date & ID</th>
                  <th className="py-2.5 px-3">Item Name & SKU</th>
                  <th className="py-2.5 px-3">Received Qty</th>
                  <th className="py-2.5 px-3">Warehouse In</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInward.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No material inward transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredInward.map((tx) => (
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
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                          +{tx.quantity} {tx.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold">{tx.toWarehouse}</div>
                        <div className="text-[10px] text-slate-400">From: {tx.fromWarehouse}</div>
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
