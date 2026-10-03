import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Printer,
  TrendingUp
} from 'lucide-react';
import { useInventoryStorage } from '../../hooks/useInventoryStorage';
import { INV_KEYS } from '../../services/inventoryStorageService';

export function InventoryReportsPage() {
  const items = useInventoryStorage(INV_KEYS.ITEMS, []);
  const transactions = useInventoryStorage(INV_KEYS.TRANSACTIONS, []);

  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' or 'valuation'
  const [txnFilter, setTxnFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Total Portfolio Valuation
  const totalValuation = useMemo(() => {
    return items.reduce(
      (acc, i) => acc + (Number(i.currentStock) || 0) * (Number(i.unitPrice) || 0),
      0
    );
  }, [items]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (txnFilter !== 'ALL' && t.type !== txnFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          t.itemName?.toLowerCase().includes(q) ||
          t.sku?.toLowerCase().includes(q) ||
          t.referenceNo?.toLowerCase().includes(q) ||
          t.fromWarehouse?.toLowerCase().includes(q) ||
          t.toWarehouse?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, txnFilter, searchTerm]);

  // Export Ledger to CSV
  const handleExportLedgerCSV = () => {
    const headers = ['Txn ID', 'Date', 'Type', 'SKU', 'Item Name', 'Quantity', 'Unit', 'Unit Price', 'Total Amount', 'From', 'To', 'Reference Type', 'Reference No', 'Audited By'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      t.type,
      t.sku,
      `"${(t.itemName || '').replace(/"/g, '""')}"`,
      t.quantity,
      t.unit,
      t.unitPrice,
      t.totalAmount,
      `"${t.fromWarehouse || ''}"`,
      `"${t.toWarehouse || ''}"`,
      t.referenceType,
      t.referenceNo,
      `"${t.performedBy || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Movement_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            Inventory Reports & Stock Valuation
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Financial stock valuation summaries and audited movement ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportLedgerCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Movement Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          className={`pb-3 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === 'valuation'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Valuation Matrix (₹{totalValuation.toLocaleString('en-IN')})
        </button>
      </div>

      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-slate-500">Transaction Type:</span>
              <select
                value={txnFilter}
                onChange={(e) => setTxnFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Types</option>
                <option value="INWARD">Inward (Stock In)</option>
                <option value="OUTWARD">Outward (Stock Out)</option>
                <option value="TRANSFER">Transfer (Inter-Depot)</option>
                <option value="ADJUSTMENT">Adjustment (Physical Audit)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ledger entries..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Txn ID & Date</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Item & SKU</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">Unit Cost</th>
                    <th className="py-3 px-3">Movement Value</th>
                    <th className="py-3 px-3">Route (From → To)</th>
                    <th className="py-3 px-4">Ref Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{tx.id}</div>
                        <div className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString('en-IN')}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            tx.type === 'INWARD'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.type === 'OUTWARD'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : tx.type === 'TRANSFER'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{tx.itemName}</div>
                        <div className="font-mono text-[10px] text-indigo-500">{tx.sku}</div>
                      </td>

                      <td className="py-3 px-3 font-bold">
                        {tx.type === 'INWARD' ? '+' : tx.type === 'OUTWARD' ? '-' : ''}
                        {tx.quantity} {tx.unit}
                      </td>

                      <td className="py-3 px-3 text-slate-500">
                        ₹{Number(tx.unitPrice || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        ₹{Math.abs(Number(tx.totalAmount || 0)).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                        <div>From: {tx.fromWarehouse}</div>
                        <div>To: {tx.toWarehouse}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {tx.referenceNo}
                        </div>
                        <div className="text-[10px] text-slate-400">{tx.referenceType}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'valuation' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Total Capital Valuation</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{totalValuation.toLocaleString('en-IN')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Calculated using Weighted Moving Average unit pricing</p>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">SKU & Item Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Current Stock</th>
                    <th className="py-3 px-3">Unit Valuation Price</th>
                    <th className="py-3 px-3">Total Holding Value</th>
                    <th className="py-3 px-4 text-right">% Portfolio Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => {
                    const holdingValue = (Number(item.currentStock) || 0) * (Number(item.unitPrice) || 0);
                    const share = totalValuation > 0 ? ((holdingValue / totalValuation) * 100).toFixed(1) : 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="font-mono text-[10px] text-indigo-500">{item.sku}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                          {item.category}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">
                          ₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                          ₹{holdingValue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {share}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
