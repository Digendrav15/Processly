import React, { useState, useEffect, useMemo } from 'react';
import {
  getCheques,
  getPettySummary,
  initPettyData,
  deleteCheque,
  revertChequeToPending
} from '../../services/pettyStorageService';
import { ChequeModal } from '../../components/petty/ChequeModal';
import { ChequeDepositModal } from '../../components/petty/ChequeDepositModal';
import { ChequeClearModal } from '../../components/petty/ChequeClearModal';
import { ChequeBounceModal } from '../../components/petty/ChequeBounceModal';
import { ChequeLeafModal } from '../../components/petty/ChequeLeafModal';
import {
  Landmark,
  Plus,
  Search,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Printer,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function ChequeTrackerPage() {
  const [cheques, setCheques] = useState([]);
  const [summary, setSummary] = useState(null);

  // Modals
  const [showNewChequeModal, setShowNewChequeModal] = useState(false);
  const [editingCheque, setEditingCheque] = useState(null);
  const [depositingCheque, setDepositingCheque] = useState(null);
  const [clearingCheque, setClearingCheque] = useState(null);
  const [bouncingCheque, setBouncingCheque] = useState(null);
  const [viewingLeafCheque, setViewingLeafCheque] = useState(null);

  // Filter State
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'received', 'issued', 'undeposited', 'in-clearing', 'cleared', 'bounced'
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = () => {
    initPettyData();
    setCheques(getCheques());
    setSummary(getPettySummary());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('petty_storage_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('petty_storage_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const filteredCheques = useMemo(() => {
    return cheques.filter((c) => {
      // Tab filter
      if (activeTab === 'received' && c.type !== 'received') return false;
      if (activeTab === 'issued' && c.type !== 'issued') return false;
      if (activeTab === 'undeposited' && (c.depositStatus !== 'Not Deposited' || c.clearanceStatus === 'Cancelled')) return false;
      if (activeTab === 'in-clearing' && (c.clearanceStatus !== 'Pending' || c.depositStatus === 'Not Deposited')) return false;
      if (activeTab === 'cleared' && c.clearanceStatus !== 'Cleared') return false;
      if (activeTab === 'bounced' && c.clearanceStatus !== 'Bounced') return false;

      // Date range
      if (startDate && c.chequeDate < startDate) return false;
      if (endDate && c.chequeDate > endDate) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.chequeNo?.toLowerCase().includes(q) ||
          c.partyName?.toLowerCase().includes(q) ||
          c.bankName?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.depositBank?.toLowerCase().includes(q) ||
          c.remarks?.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [cheques, activeTab, startDate, endDate, searchQuery]);

  const totalFilteredAmount = useMemo(() => {
    return filteredCheques.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [filteredCheques]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this cheque record? If it was cleared, the linked ledger transaction will also be removed.')) {
      deleteCheque(id);
    }
  };

  const handleRevert = (id) => {
    if (window.confirm('Revert this cheque to Pending Clearance? The auto-posted ledger transaction will be removed.')) {
      revertChequeToPending(id);
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-extrabold text-[10px] uppercase tracking-wider border border-teal-200 dark:border-teal-800/80">
            Petty System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Cheque Clearance Tracker</h1>
        </div>

        <button
          onClick={() => setShowNewChequeModal(true)}
          className="flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>+ Register Cheque</span>
        </button>
      </div>

      {/* 4 Grand Cheque Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Not Deposited (In Hand) */}
        <div
          onClick={() => setActiveTab('undeposited')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'undeposited'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Not Deposited (In Hand)</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              ₹{(summary?.undepositedAmount || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
              {summary?.undepositedCount || 0} Cheques waiting to be deposited
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: In Clearing Pipeline */}
        <div
          onClick={() => setActiveTab('in-clearing')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'in-clearing'
              ? 'border-sky-500 ring-2 ring-sky-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-sky-400'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span>In Clearing (Bank)</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              ₹{((summary?.inClearingReceivedAmount || 0) + (summary?.inClearingIssuedAmount || 0)).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
              {summary?.inClearingReceivedCount || 0} Inflow • {summary?.inClearingIssuedCount || 0} Outflow
            </p>
          </div>
          <div className="p-3 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 rounded-2xl">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Cleared & Auto-Tracked */}
        <div
          onClick={() => setActiveTab('cleared')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'cleared'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cleared & Synced</span>
            </div>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{((summary?.clearedReceivedAmount || 0) + (summary?.clearedIssuedAmount || 0)).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              Reflected in Received & Out Ledgers
            </p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Returned / Bounced */}
        <div
          onClick={() => setActiveTab('bounced')}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'bounced'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-rose-400'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Returned / Bounced</span>
            </div>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              ₹{(summary?.bouncedAmount || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-rose-500 font-semibold mt-1">
              {summary?.bouncedCount || 0} Cheques Dishonored
            </p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Cheques Master Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Cheques ({cheques.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'received'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Received (Inflow)
            </button>
            <button
              onClick={() => setActiveTab('issued')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'issued'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Issued (Outflow)
            </button>
            <button
              onClick={() => setActiveTab('undeposited')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'undeposited'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🟡 Pending Deposit ({summary?.undepositedCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('in-clearing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'in-clearing'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔵 In Clearing
            </button>
            <button
              onClick={() => setActiveTab('cleared')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cleared'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🟢 Cleared ({summary?.clearedReceivedCount + summary?.clearedIssuedCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('bounced')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bounced'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔴 Bounced ({summary?.bouncedCount || 0})
            </button>
          </div>

          {/* Search & Dates */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search cheque #, party, bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center space-x-1 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-hidden"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Cheques Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Cheque #</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Party Name</th>
                <th className="px-4 py-3">Bank Details</th>
                <th className="px-4 py-3">Cheque Date</th>
                <th className="px-4 py-3">Deposit Status</th>
                <th className="px-4 py-3">Clearance Status</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3 text-center">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredCheques.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Landmark className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-semibold">No cheque records found in this view.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCheques.map((c) => {
                  const isReceived = c.type === 'received';
                  const isCleared = c.clearanceStatus === 'Cleared';
                  const isBounced = c.clearanceStatus === 'Bounced';
                  const isUndeposited = isReceived && c.depositStatus === 'Not Deposited' && !isCleared && !isBounced;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Cheque # */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setViewingLeafCheque(c)}
                            className="font-mono font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 cursor-pointer"
                            title="Click to view digital cheque leaf"
                          >
                            <span>#{c.chequeNo}</span>
                            <Eye className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {c.id}
                        </span>
                      </td>

                      {/* Direction Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isReceived
                              ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {isReceived ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isReceived ? 'Received (In)' : 'Issued (Out)'}
                        </span>
                      </td>

                      {/* Party */}
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        <div className="truncate max-w-[190px]" title={c.partyName}>
                          {c.partyName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {c.category}
                        </div>
                      </td>

                      {/* Bank Details */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                          {c.bankName}
                        </div>
                        {c.branchName && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {c.branchName}
                          </div>
                        )}
                      </td>

                      {/* Cheque Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {c.chequeDate}
                      </td>

                      {/* Deposit Status (Deposit Huaa Hai Ki Nhi) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isReceived ? (
                          c.depositStatus === 'Deposited' ? (
                            <div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 inline-flex items-center gap-1">
                                🔵 Deposited
                              </span>
                              {c.depositDate && (
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  on {c.depositDate}
                                </span>
                              )}
                              {c.depositBank && (
                                <span className="block text-[9px] text-slate-400 truncate max-w-[140px]" title={c.depositBank}>
                                  {c.depositBank}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 inline-flex items-center gap-1 animate-pulse">
                                🟡 Not Deposited (In Hand)
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Presented
                          </span>
                        )}
                      </td>

                      {/* Clearance Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isCleared ? (
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Cleared</span>
                            </span>
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                              {c.clearanceDate ? `on ${c.clearanceDate}` : ''}
                            </span>
                            <span className="block text-[9px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                              ✓ Auto-Tracked in {isReceived ? 'Received' : 'Out'} Ledger
                            </span>
                          </div>
                        ) : isBounced ? (
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Bounced</span>
                            </span>
                            {c.bounceReason && (
                              <span className="block text-[10px] text-rose-500 mt-0.5 truncate max-w-[150px]" title={c.bounceReason}>
                                {c.bounceReason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending in Bank</span>
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap text-sm">
                        ₹{Number(c.amount).toLocaleString('en-IN')}
                      </td>

                      {/* Lifecycle Action Buttons */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* 1. Deposit Button (if received & not deposited) */}
                          {isUndeposited && (
                            <button
                              onClick={() => setDepositingCheque(c)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1"
                              title="Deposit Cheque into Bank Account"
                            >
                              <Landmark className="w-3.5 h-3.5" />
                              <span>Deposit</span>
                            </button>
                          )}

                          {/* 2. Clear Button (if pending clearance) */}
                          {!isCleared && !isBounced && (
                            <button
                              onClick={() => setClearingCheque(c)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1"
                              title="Clear Cheque - Automatically reflects into Received or Out ledger"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Clear Cheque</span>
                            </button>
                          )}

                          {/* 3. Mark Bounced */}
                          {!isCleared && !isBounced && (
                            <button
                              onClick={() => setBouncingCheque(c)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Mark Bounced / Returned"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Revert to Pending if cleared or bounced */}
                          {(isCleared || isBounced) && (
                            <button
                              onClick={() => handleRevert(c.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Revert back to Pending"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Leaf Specimen */}
                          <button
                            onClick={() => setViewingLeafCheque(c)}
                            className="p-1 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Cheque Specimen Leaf"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingCheque(c)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Cheque"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Subtotal */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500">
            Showing {filteredCheques.length} cheque items
          </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Filtered Cheque Volume: <strong className="text-teal-600 dark:text-teal-400 font-mono text-sm">₹{totalFilteredAmount.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      {/* Modals */}
      <ChequeModal
        isOpen={showNewChequeModal || !!editingCheque}
        onClose={() => {
          setShowNewChequeModal(false);
          setEditingCheque(null);
        }}
        initialData={editingCheque}
        onSuccess={loadData}
      />

      <ChequeDepositModal
        isOpen={!!depositingCheque}
        onClose={() => setDepositingCheque(null)}
        cheque={depositingCheque}
        onSuccess={loadData}
      />

      <ChequeClearModal
        isOpen={!!clearingCheque}
        onClose={() => setClearingCheque(null)}
        cheque={clearingCheque}
        onSuccess={loadData}
      />

      <ChequeBounceModal
        isOpen={!!bouncingCheque}
        onClose={() => setBouncingCheque(null)}
        cheque={bouncingCheque}
        onSuccess={loadData}
      />

      <ChequeLeafModal
        isOpen={!!viewingLeafCheque}
        onClose={() => setViewingLeafCheque(null)}
        cheque={viewingLeafCheque}
      />
    </div>
  );
}
