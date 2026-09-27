import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileText,
  CreditCard,
  ShieldAlert,
  Search,
  CheckCircle2,
  Filter,
  ArrowRight
} from 'lucide-react';
import {
  getDocuments,
  getSubscriptions,
  getDaysDiff,
  formatDate
} from '../../services/docSubStorageService';
import RenewModal from '../../components/docSub/RenewModal';
import DocumentViewModal from '../../components/docSub/DocumentViewModal';

export default function RenewalExpiryPage() {
  const [documents, setDocuments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Document' | 'Subscription'
  const [urgencyFilter, setUrgencyFilter] = useState('All'); // 'All' | 'Expired' | 'Critical (<=7d)' | 'Soon (<=30d)' | 'Upcoming'

  // Modals
  const [renewingItem, setRenewingItem] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  const loadData = () => {
    setDocuments(getDocuments());
    setSubscriptions(getSubscriptions());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('docsub_storage_update', handleUpdate);
    return () => window.removeEventListener('docsub_storage_update', handleUpdate);
  }, []);

  // Merge and sort both docs and subs by expiry date
  const combinedItems = useMemo(() => {
    const list = [];

    // Documents (non-perpetual)
    documents.forEach((d) => {
      if (!d.isPerpetual && d.expiryDate) {
        const days = getDaysDiff(d.expiryDate);
        list.push({
          id: d.id,
          title: d.title,
          type: 'Document',
          category: d.category,
          dueDate: d.expiryDate,
          daysLeft: days,
          owner: d.custodian,
          department: d.department,
          amount: null,
          billingCycle: null,
          rawItem: d
        });
      }
    });

    // Subscriptions
    subscriptions.forEach((s) => {
      if (s.nextRenewalDate) {
        const days = getDaysDiff(s.nextRenewalDate);
        list.push({
          id: s.id,
          title: s.serviceName,
          type: 'Subscription',
          category: s.category,
          dueDate: s.nextRenewalDate,
          daysLeft: days,
          owner: s.owner,
          department: s.assignedDepartment,
          amount: s.amount,
          billingCycle: s.billingCycle,
          rawItem: s
        });
      }
    });

    // Sort ascending by daysLeft (most urgent/expired first)
    return list.sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));
  }, [documents, subscriptions]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return combinedItems.filter((item) => {
      // Type filter
      if (typeFilter !== 'All' && item.type !== typeFilter) return false;

      // Urgency filter
      if (urgencyFilter === 'Expired' && item.daysLeft >= 0) return false;
      if (urgencyFilter === 'Critical' && (item.daysLeft < 0 || item.daysLeft > 7)) return false;
      if (urgencyFilter === 'Soon' && (item.daysLeft < 0 || item.daysLeft > 30)) return false;
      if (urgencyFilter === 'Upcoming' && item.daysLeft <= 30) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchOwner = item.owner?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        return matchTitle || matchOwner || matchCat;
      }

      return true;
    });
  }, [combinedItems, typeFilter, urgencyFilter, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    let expired = 0;
    let critical = 0;
    let soon = 0;

    combinedItems.forEach((i) => {
      if (i.daysLeft < 0) expired++;
      else if (i.daysLeft <= 7) critical++;
      else if (i.daysLeft <= 30) soon++;
    });

    return { expired, critical, soon, total: combinedItems.length };
  }, [combinedItems]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 text-white rounded-xl shadow-md shadow-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            Renewal & Expiry Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unified countdown engine tracking statutory document expirations and SaaS subscription renewal dates
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setUrgencyFilter('Expired')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            urgencyFilter === 'Expired'
              ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Expired
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {stats.expired}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Require immediate renewal</p>
        </div>

        <div
          onClick={() => setUrgencyFilter('Critical')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            urgencyFilter === 'Critical'
              ? 'bg-orange-50 border-orange-300 dark:bg-orange-950/40 dark:border-orange-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Critical (&le; 7 Days)
            </span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-2">
            {stats.critical}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Expiring this week</p>
        </div>

        <div
          onClick={() => setUrgencyFilter('Soon')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            urgencyFilter === 'Soon'
              ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Due Soon (&le; 30 Days)
            </span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.soon}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Expiring this month</p>
        </div>

        <div
          onClick={() => setUrgencyFilter('All')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            urgencyFilter === 'All'
              ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              All Monitored Items
            </span>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {stats.total}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Total pipeline items</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expiring items..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="Document">Documents Only</option>
            <option value="Subscription">Subscriptions Only</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filteredItems.length}</strong> items in pipeline
        </div>
      </div>

      {/* Expiry Pipeline Rows */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No items matching your criteria
          </h3>
          <p className="text-xs text-slate-400">Everything is in safe standing!</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map((item) => {
              const isExp = item.daysLeft < 0;
              const isCrit = item.daysLeft >= 0 && item.daysLeft <= 7;
              const isSoon = item.daysLeft > 7 && item.daysLeft <= 30;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        item.type === 'Document'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300'
                      }`}
                    >
                      {item.type === 'Document' ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.type === 'Document'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-[11px] text-slate-400">• {item.category}</span>
                      </div>

                      <h3
                        onClick={() => {
                          if (item.type === 'Document') setViewingDoc(item.rawItem);
                        }}
                        className={`text-sm font-bold text-slate-900 dark:text-white truncate ${
                          item.type === 'Document' ? 'hover:text-blue-600 cursor-pointer' : ''
                        }`}
                      >
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Department: <strong>{item.department}</strong> • Owner: <strong>{item.owner}</strong>
                        {item.amount && (
                          <span className="ml-2 font-semibold text-slate-800 dark:text-slate-200">
                            (₹{Number(item.amount).toLocaleString('en-IN')}/{item.billingCycle})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: Days countdown and Renew Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(item.dueDate)}
                      </p>
                      <span
                        className={`inline-block text-xs font-black px-2.5 py-0.5 rounded-full ${
                          isExp
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : isCrit
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                            : isSoon
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isExp
                          ? `Expired ${Math.abs(item.daysLeft)} days ago`
                          : isCrit
                          ? `Expiring in ${item.daysLeft} days!`
                          : `${item.daysLeft} days remaining`}
                      </span>
                    </div>

                    <button
                      onClick={() => setRenewingItem({ type: item.type, item: item.rawItem })}
                      className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Renew
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {renewingItem && (
        <RenewModal
          isOpen={true}
          onClose={() => setRenewingItem(null)}
          type={renewingItem.type}
          item={renewingItem.item}
          onSuccess={loadData}
        />
      )}
      {viewingDoc && (
        <DocumentViewModal
          isOpen={true}
          onClose={() => setViewingDoc(null)}
          doc={viewingDoc}
          onRenew={(d) => setRenewingItem({ type: 'Document', item: d })}
        />
      )}
    </div>
  );
}
