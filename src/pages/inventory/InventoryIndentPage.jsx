import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  FileText,
  Boxes,
  Send,
  History
} from 'lucide-react';
import {
  getInventoryItems,
  getInventoryIndents,
  raiseInventoryIndent
} from '../../services/inventoryStorageService';

export function InventoryIndentPage() {
  const [items, setItems] = useState([]);
  const [indents, setIndents] = useState([]);
  const [activeTab, setActiveTab] = useState('lowStock'); // 'lowStock' | 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [selectedItemForIndent, setSelectedItemForIndent] = useState(null);
  const [indentQty, setIndentQty] = useState('');
  const [indentPriority, setIndentPriority] = useState('High');
  const [indentDate, setIndentDate] = useState('');
  const [indentNotes, setIndentNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = () => {
    setItems(getInventoryItems());
    setIndents(getInventoryIndents());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('inventory_storage_update', handleUpdate);
    window.addEventListener('purchase_storage_update', handleUpdate);

    return () => {
      window.removeEventListener('inventory_storage_update', handleUpdate);
      window.removeEventListener('purchase_storage_update', handleUpdate);
    };
  }, []);

  // Filter low stock items: currentStock <= reorderLevel
  const lowStockItems = useMemo(() => {
    return items.filter((item) => {
      const isLow = Number(item.currentStock) <= Number(item.reorderLevel);
      if (!isLow) return false;

      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchCode = (item.code || item.sku || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        return matchName || matchCode || matchCat;
      }

      return true;
    });
  }, [items, selectedCategory, searchTerm]);

  // Filtered indents history
  const filteredIndents = useMemo(() => {
    return indents.filter((ind) => {
      if (selectedCategory !== 'All' && ind.category !== selectedCategory) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (ind.itemName || '').toLowerCase().includes(q);
        const matchNum = (ind.indentNumber || '').toLowerCase().includes(q);
        return matchName || matchNum;
      }

      return true;
    });
  }, [indents, selectedCategory, searchTerm]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [items]);

  const handleOpenIndentModal = (item) => {
    setSelectedItemForIndent(item);
    setIndentQty(item.suggestedIndentQty || item.moq || 100);
    setIndentPriority(item.currentStock <= 0 ? 'Urgent' : 'High');

    const now = new Date();
    const exp = new Date(now.getTime() + (item.leadTimeDays || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setIndentDate(exp);
    setIndentNotes(`Auto Indent Trigger: Stock ${item.currentStock} ${item.unit} <= ROL ${item.reorderLevel} ${item.unit}. Lead time is ${item.leadTimeDays} days.`);
    setSuccessMsg('');
  };

  const handleSaveIndent = (e) => {
    e.preventDefault();
    if (!selectedItemForIndent) return;

    const qty = Number(indentQty);
    if (!qty || qty <= 0) {
      alert('Please enter a valid indent quantity.');
      return;
    }

    try {
      raiseInventoryIndent({
        itemId: selectedItemForIndent.id,
        itemName: selectedItemForIndent.name,
        quantity: qty,
        priority: indentPriority,
        expectedDate: indentDate,
        reason: indentNotes,
        raisedBy: 'Inventory Controller'
      });

      setSuccessMsg(`Indent successfully generated for "${selectedItemForIndent.name}" (${qty} ${selectedItemForIndent.unit}) and synced to Purchase Indents!`);
      setSelectedItemForIndent(null);
      loadData();
      setActiveTab('history');
    } catch (err) {
      alert(err.message || 'Failed to generate indent.');
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border border-amber-200 dark:border-amber-800/80">
            Auto Replenishment
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Low Stock & Indent Management
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('lowStock')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lowStock'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:text-amber-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Items ({lowStockItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Raised Indents History ({indents.length})</span>
          </button>
        </div>
      </div>

      {/* Formula & Policy Notification Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-amber-500 text-white shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-amber-900 dark:text-amber-300">
              Low Stock Reorder Trigger Active
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
              Items whose Current Stock $\le$ ROL are automatically populated below.
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 ml-1">
                ROL = Average Daily Consumption (ADC) × Lead Time (Days) × Safety Factor
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 shadow-xs font-bold text-slate-700 dark:text-slate-300">
            Critical (0 Stock): <span className="text-rose-600 font-extrabold">{items.filter((i) => i.currentStock <= 0).length}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 shadow-xs font-bold text-slate-700 dark:text-slate-300">
            Below ROL: <span className="text-amber-600 font-extrabold">{lowStockItems.length}</span>
          </div>
        </div>
      </div>

      {/* Success alert message */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search low stock item name, SKU code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">Category:</span>
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

      {/* TAB 1: LOW STOCK (INDENT REQUIRED) TABLE */}
      {activeTab === 'lowStock' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-290px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2 w-24">Action</th>
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Current Stock</th>
                  <th className="px-3 py-2 text-right">Avg Daily Cons.</th>
                  <th className="px-3 py-2 text-right">Lead Time</th>
                  <th className="px-3 py-2 text-right">Safety Factor</th>
                  <th className="px-3 py-2 text-right">Reorder Level (ROL)</th>
                  <th className="px-3 py-2 text-right">MOQ</th>
                  <th className="px-3 py-2 text-right">Max Level</th>
                  <th className="px-3 py-2 text-right">Shortfall</th>
                  <th className="px-3 py-2 text-right">Suggested Indent</th>
                  <th className="px-3 py-2">Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="px-3 py-10 text-center text-xs text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          All Inventory Items Are Healthy!
                        </span>
                        <span className="text-[11px] text-slate-400">
                          No items are currently below their Reorder Level (ROL).
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((item) => {
                    const isZero = item.currentStock <= 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenIndentModal(item)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Raise Indent</span>
                          </button>
                        </td>

                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white text-[11.5px]">
                          <div>{item.name}</div>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            {item.code}
                          </span>
                        </td>

                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                            {item.category}
                          </span>
                        </td>

                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <span className={`font-black text-xs ${isZero ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {item.currentStock} {item.unit}
                          </span>
                        </td>

                        <td className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                          {item.avgDailyConsumption} {item.unit}/day
                        </td>

                        <td className="px-3 py-2 text-right font-bold text-amber-600 dark:text-amber-400 text-[11px] whitespace-nowrap">
                          {item.leadTimeDays} days
                        </td>

                        <td className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-300 text-[11px] whitespace-nowrap">
                          {item.safetyFactor}x
                        </td>

                        <td className="px-3 py-2 text-right font-black text-amber-700 dark:text-amber-300 text-[11.5px] whitespace-nowrap bg-amber-50/50 dark:bg-amber-950/20">
                          {item.reorderLevel} {item.unit}
                        </td>

                        <td className="px-3 py-2 text-right font-bold text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {item.moq}
                        </td>

                        <td className="px-3 py-2 text-right font-bold text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {item.maxLevel}
                        </td>

                        <td className="px-3 py-2 text-right font-extrabold text-rose-600 dark:text-rose-400 text-[11px] whitespace-nowrap">
                          {item.shortfall} {item.unit}
                        </td>

                        <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap bg-emerald-50/30 dark:bg-emerald-950/20">
                          {item.suggestedIndentQty} {item.unit}
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isZero
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {isZero ? 'Stock Out' : 'Below ROL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RAISED INDENTS HISTORY TABLE */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-290px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2">Indent Number</th>
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Requested Qty</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Expected Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Reason / Lead Trigger</th>
                  <th className="px-3 py-2">Raised By / Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredIndents.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-3 py-8 text-center text-xs text-slate-400">
                      No indents have been raised yet.
                    </td>
                  </tr>
                ) : (
                  filteredIndents.map((ind) => (
                    <tr key={ind.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap font-mono font-extrabold text-amber-600 dark:text-amber-400 text-[11px]">
                        {ind.indentNumber}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900 dark:text-white text-[11.5px]">
                        {ind.itemName}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                          {ind.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                        {Number(ind.quantity).toLocaleString('en-IN')} {ind.unit}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ind.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {ind.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                        {ind.expectedDate}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                          {ind.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-[10.5px] truncate max-w-xs">
                        {ind.reason}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[10px] whitespace-nowrap">
                        <span className="font-semibold block">{ind.raisedBy}</span>
                        <span>{new Date(ind.createdAt).toLocaleDateString('en-GB')}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RAISE INDENT MODAL */}
      {selectedItemForIndent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-amber-500" />
                  Raise Purchase Indent
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pre-filled using engineering parameters (ADC × Lead Time × Safety Factor)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForIndent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIndent} className="space-y-3.5 text-xs">
              {/* Item Card Overview */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                    {selectedItemForIndent.name}
                  </span>
                  <span className="font-mono text-[10px] text-amber-700 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                    {selectedItemForIndent.code}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10.5px] pt-1">
                  <div>
                    <span className="text-slate-500 block">Current Stock:</span>
                    <span className="font-black text-rose-600">
                      {selectedItemForIndent.currentStock} {selectedItemForIndent.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Reorder Level:</span>
                    <span className="font-extrabold text-amber-800 dark:text-amber-300">
                      {selectedItemForIndent.reorderLevel} {selectedItemForIndent.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Lead Time:</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">
                      {selectedItemForIndent.leadTimeDays} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Indent Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Indent Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={indentQty}
                    onChange={(e) => setIndentQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden font-black text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    MOQ: {selectedItemForIndent.moq} | Max: {selectedItemForIndent.maxLevel}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedItemForIndent.unit}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Priority & Expected Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Procurement Priority
                  </label>
                  <select
                    value={indentPriority}
                    onChange={(e) => setIndentPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden font-semibold"
                  >
                    <option value="Urgent">Urgent (Stock Out)</option>
                    <option value="High">High (Below ROL)</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Inward Date
                  </label>
                  <input
                    type="date"
                    required
                    value={indentDate}
                    onChange={(e) => setIndentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Justification Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Procurement Justification / Notes
                </label>
                <textarea
                  rows="2"
                  value={indentNotes}
                  onChange={(e) => setIndentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedItemForIndent(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Generate & Send Indent</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
