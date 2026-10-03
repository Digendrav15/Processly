import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  Calendar,
  User,
  FileText,
  Sliders,
  TrendingUp,
  TrendingDown,
  Building2,
  Boxes
} from 'lucide-react';
import {
  getUnifiedStockLedger,
  getInventoryItems,
  recordManualStockAdjustment
} from '../../services/inventoryStorageService';

export function InventoryInOutPage() {
  const [ledger, setLedger] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'inward' | 'outward' | 'manual'
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Manual Adjustment Form State
  const [adjustType, setAdjustType] = useState('INWARD'); // 'INWARD' | 'OUTWARD'
  const [selectedItemId, setSelectedItemId] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Physical Audit Adjustment');
  const [adjustRef, setAdjustRef] = useState('');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = () => {
    setLedger(getUnifiedStockLedger());
    setItems(getInventoryItems());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('inventory_storage_update', handleUpdate);
    window.addEventListener('purchase_storage_update', handleUpdate);
    window.addEventListener('otd_storage_update', handleUpdate);

    return () => {
      window.removeEventListener('inventory_storage_update', handleUpdate);
      window.removeEventListener('purchase_storage_update', handleUpdate);
      window.removeEventListener('otd_storage_update', handleUpdate);
    };
  }, []);

  // Filtered transactions
  const filteredLedger = useMemo(() => {
    return ledger.filter((entry) => {
      // Tab filter
      if (activeTab === 'inward' && entry.type !== 'INWARD') return false;
      if (activeTab === 'outward' && entry.type !== 'OUTWARD') return false;
      if (activeTab === 'manual' && entry.source !== 'MANUAL_ADJUSTMENT') return false;

      // Category filter
      if (selectedCategory !== 'All' && entry.category !== selectedCategory) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (entry.itemName || '').toLowerCase().includes(q);
        const matchRef = (entry.referenceNo || '').toLowerCase().includes(q);
        const matchParty = (entry.party || '').toLowerCase().includes(q);
        const matchSource = (entry.sourceLabel || '').toLowerCase().includes(q);
        return matchName || matchRef || matchParty || matchSource;
      }

      return true;
    });
  }, [ledger, activeTab, selectedCategory, searchTerm]);

  // Aggregate metrics
  const totalInwardQty = useMemo(() => {
    return ledger.filter((e) => e.type === 'INWARD').reduce((acc, e) => acc + (Number(e.quantity) || 0), 0);
  }, [ledger]);

  const totalOutwardQty = useMemo(() => {
    return ledger.filter((e) => e.type === 'OUTWARD').reduce((acc, e) => acc + (Number(e.quantity) || 0), 0);
  }, [ledger]);

  const purchaseInwardCount = useMemo(() => {
    return ledger.filter((e) => e.source === 'PURCHASE').length;
  }, [ledger]);

  const salesOutwardCount = useMemo(() => {
    return ledger.filter((e) => e.source === 'SALES_OTD').length;
  }, [ledger]);

  const manualCount = useMemo(() => {
    return ledger.filter((e) => e.source === 'MANUAL_ADJUSTMENT').length;
  }, [ledger]);

  const categories = useMemo(() => {
    const set = new Set(ledger.map((e) => e.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [ledger]);

  const selectedItemObj = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  const handleOpenAdjustModal = (type = 'INWARD') => {
    setAdjustType(type);
    setSelectedItemId(items[0]?.id || '');
    setAdjustQty('');
    setAdjustReason('Physical Audit Adjustment');
    setAdjustRef(`ADJ-${Date.now().toString().slice(-4)}`);
    setAdjustRemarks('');
    setFormError('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedItemId) {
      setFormError('Please select a stock item.');
      return;
    }

    const qty = Number(adjustQty);
    if (!qty || qty <= 0) {
      setFormError('Please enter a valid positive quantity.');
      return;
    }

    if (adjustType === 'OUTWARD' && selectedItemObj && selectedItemObj.currentStock < qty) {
      if (!window.confirm(`Warning: Selected quantity (${qty}) exceeds current stock (${selectedItemObj.currentStock}). Proceed with negative adjustment?`)) {
        return;
      }
    }

    try {
      recordManualStockAdjustment({
        itemId: selectedItemId,
        type: adjustType,
        quantity: qty,
        reason: adjustReason,
        referenceNo: adjustRef,
        remarks: adjustRemarks,
        performedBy: 'Store Incharge'
      });

      setIsAdjustModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to record adjustment');
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] uppercase tracking-wider border border-orange-200 dark:border-orange-800/80">
            Inventory Flow
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Stock In & Out Ledger
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => handleOpenAdjustModal('INWARD')}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Manual Stock Adjust (IN / OUT)</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total Inward (IN)</span>
            <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {totalInwardQty.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">units</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Purchase GRN ({purchaseInwardCount}) + Manual IN
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total Outward (OUT)</span>
            <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-black text-rose-600 dark:text-rose-400">
              {totalOutwardQty.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">units</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Sales OTD ({salesOutwardCount}) + Manual OUT
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Net Flow Balance</span>
            <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-lg font-black ${totalInwardQty >= totalOutwardQty ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600'}`}>
              {(totalInwardQty - totalOutwardQty).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">net</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Current Physical Turnover
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Manual Adjustments</span>
            <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Sliders className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              {manualCount}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">logs</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Audit & Stock corrections
          </span>
        </div>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Movements ({ledger.length})
          </button>
          <button
            onClick={() => setActiveTab('inward')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inward'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900'
            }`}
          >
            Inward (IN)
          </button>
          <button
            onClick={() => setActiveTab('outward')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'outward'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:text-rose-900'
            }`}
          >
            Outward (OUT)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:text-amber-900'
            }`}
          >
            Manual Adjustments
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search item, GRN, Order #, party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-hidden"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-hidden"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="px-3 py-2">Date / Time</th>
                <th className="px-3 py-2">Movement Type</th>
                <th className="px-3 py-2">Item Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Quantity</th>
                <th className="px-3 py-2">Source / System</th>
                <th className="px-3 py-2">Reference #</th>
                <th className="px-3 py-2">Party / Purpose</th>
                <th className="px-3 py-2">Remarks / Handler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-3 py-8 text-center text-xs text-slate-400">
                    No In/Out transactions match your criteria.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((row) => {
                  const isInward = row.type === 'INWARD';
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap text-slate-500 font-mono text-[10.5px]">
                        {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isInward
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          {isInward ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isInward ? 'INWARD' : 'OUTWARD'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 dark:text-white text-[11.5px]">
                        {row.itemName}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                          {row.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <span className={`font-black text-xs ${isInward ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isInward ? '+' : '-'}{Number(row.quantity).toLocaleString('en-IN')} {row.unit}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.source === 'PURCHASE'
                              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : row.source === 'SALES_OTD'
                              ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {row.sourceLabel || row.source}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono font-bold text-slate-700 dark:text-slate-300 text-[10.5px]">
                        {row.referenceNo || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-xs">
                        {row.party || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[10.5px] truncate max-w-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block">{row.performedBy}</span>
                        <span className="text-[10px]">{row.remarks}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL STOCK ADJUSTMENT MODAL */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-orange-500" />
                  Manual Stock Adjustment Form
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manually adjust physical inventory balance with formal justification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-3.5 text-xs">
              {/* Type Switcher: INWARD or OUTWARD */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Adjustment Mode *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('INWARD')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      adjustType === 'INWARD'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>+ Stock IN (Inward)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('OUTWARD')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                      adjustType === 'OUTWARD'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>- Stock OUT (Issue)</span>
                  </button>
                </div>
              </div>

              {/* Item Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Stock Item *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden font-medium"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.category}) — In Stock: {it.currentStock} {it.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Adjustment Quantity *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="Enter qty"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedItemObj?.unit || 'Pcs'}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                >
                  <option value="Physical Audit Adjustment">Physical Audit Adjustment (Discrepancy)</option>
                  <option value="Damaged / Scrap / Leakage">Damaged / Scrap / Written Off</option>
                  <option value="Production Consumption">Production Line Consumption</option>
                  <option value="Supplier Return">Supplier Return (Defective Batch)</option>
                  <option value="Customer Return (RTO)">Customer Return / RTO</option>
                  <option value="Sample / Quality Testing">Sample / Quality Testing</option>
                  <option value="Opening Balance Correction">Opening Balance Correction</option>
                  <option value="Other">Other / Exceptional</option>
                </select>
              </div>

              {/* Reference Document */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reference Document / Slip No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. AUDIT-SLIP-091 or MEMO-12"
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden font-mono"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Notes explaining why this manual adjustment was executed..."
                  value={adjustRemarks}
                  onChange={(e) => setAdjustRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden resize-none"
                />
              </div>

              {/* Live Impact Preview Card */}
              {selectedItemObj && adjustQty && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">Current Stock</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                      {selectedItemObj.currentStock} {selectedItemObj.unit}
                    </span>
                  </div>
                  <span className="text-slate-400 font-black">➔</span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block">After Adjustment</span>
                    <span className={`font-black text-sm ${adjustType === 'INWARD' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {adjustType === 'INWARD'
                        ? selectedItemObj.currentStock + Number(adjustQty)
                        : Math.max(0, selectedItemObj.currentStock - Number(adjustQty))}{' '}
                      {selectedItemObj.unit}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer ${
                    adjustType === 'INWARD'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Submit Stock {adjustType === 'INWARD' ? 'IN' : 'OUT'} Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
