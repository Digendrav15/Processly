import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Edit,
  Trash2,
  FileSpreadsheet,
  Layers,
  Building2,
  User,
  Users,
  Check,
  XCircle
} from 'lucide-react';
import {
  getSubscriptions,
  deleteSubscription,
  getDaysDiff,
  formatDate,
  SUBSCRIPTION_CATEGORIES
} from '../../services/docSubStorageService';
import AddSubscriptionModal from '../../components/docSub/AddSubscriptionModal';
import RenewModal from '../../components/docSub/RenewModal';
import RecordPaymentModal from '../../components/docSub/RecordPaymentModal';

export default function SubscriptionsManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';

  const [subscriptions, setSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCycle, setSelectedCycle] = useState('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [renewingSub, setRenewingSub] = useState(null);
  const [payingSub, setPayingSub] = useState(null);

  const loadSubs = () => {
    setSubscriptions(getSubscriptions());
  };

  useEffect(() => {
    loadSubs();
    const handleUpdate = () => loadSubs();
    window.addEventListener('docsub_storage_update', handleUpdate);
    return () => window.removeEventListener('docsub_storage_update', handleUpdate);
  }, []);

  // Handle ?tab=add from navigation
  useEffect(() => {
    if (activeTab === 'add') {
      setShowAddModal(true);
    }
  }, [activeTab]);

  // Tab counters
  const tabCounts = useMemo(() => {
    let renewalDue = 0;
    let paymentDue = 0;
    let expired = 0;

    subscriptions.forEach((s) => {
      const days = getDaysDiff(s.nextRenewalDate);
      if (s.status === 'Expired' || (days !== null && days < 0)) {
        expired++;
      } else if (days !== null && days >= 0 && days <= 30) {
        renewalDue++;
      }

      if (s.paymentStatus === 'Payment Due' || s.paymentStatus === 'Overdue') {
        paymentDue++;
      }
    });

    return {
      all: subscriptions.length,
      renewalDue,
      paymentDue,
      expired
    };
  }, [subscriptions]);

  // Filtered subscriptions
  const filteredSubs = useMemo(() => {
    return subscriptions.filter((sub) => {
      // 1. Tab filter
      const days = getDaysDiff(sub.nextRenewalDate);
      if (activeTab === 'renewalDue') {
        if (days === null || days < 0 || days > 30) return false;
      }
      if (activeTab === 'paymentDue') {
        if (sub.paymentStatus !== 'Payment Due' && sub.paymentStatus !== 'Overdue') return false;
      }
      if (activeTab === 'expired') {
        if (sub.status !== 'Expired' && (days === null || days >= 0)) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && sub.category !== selectedCategory) {
        return false;
      }

      // 3. Billing cycle
      if (selectedCycle !== 'All' && sub.billingCycle !== selectedCycle) {
        return false;
      }

      // 4. Payment status
      if (selectedPaymentStatus !== 'All' && sub.paymentStatus !== selectedPaymentStatus) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sub.serviceName?.toLowerCase().includes(q);
        const matchProv = sub.provider?.toLowerCase().includes(q);
        const matchOwner = sub.owner?.toLowerCase().includes(q);
        const matchPlan = sub.planName?.toLowerCase().includes(q);
        const matchDept = sub.assignedDepartment?.toLowerCase().includes(q);
        return matchName || matchProv || matchOwner || matchPlan || matchDept;
      }

      return true;
    });
  }, [subscriptions, activeTab, selectedCategory, selectedCycle, selectedPaymentStatus, searchQuery]);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      deleteSubscription(id);
      loadSubs();
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Sub ID',
      'Service Name',
      'Provider',
      'Plan Name',
      'Seats',
      'Billing Cycle',
      'Amount (INR)',
      'Next Renewal',
      'Next Payment Due',
      'Payment Status',
      'Auto Renew',
      'Department',
      'Owner',
      'Status'
    ];

    const rows = filteredSubs.map((s) => [
      s.id,
      `"${s.serviceName.replace(/"/g, '""')}"`,
      `"${s.provider}"`,
      `"${s.planName || ''}"`,
      s.seatsCount || 1,
      s.billingCycle,
      s.amount,
      s.nextRenewalDate,
      s.nextPaymentDueDate || '',
      s.paymentStatus,
      s.autoRenew ? 'Yes' : 'No',
      s.assignedDepartment,
      s.owner,
      s.status
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `subscriptions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 flex-wrap">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <span>SaaS & Infrastructure Subscriptions</span>
            {activeTab === 'renewalDue' && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Renewal Due (&le;30d) ({tabCounts.renewalDue})
              </span>
            )}
            {activeTab === 'paymentDue' && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 rounded-full border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Payment Due ({tabCounts.paymentDue})
              </span>
            )}
            {activeTab === 'expired' && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 rounded-full border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Expired ({tabCounts.expired})
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track software licenses, cloud servers, domains, renewal deadlines, and billing cycles
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingSub(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Subscription
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search service, provider, owner..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Categories</option>
              {SUBSCRIPTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Billing Cycle */}
          <div>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Billing Cycles</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Yearly">Yearly</option>
              <option value="Multi-Year">Multi-Year</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Payment Due">Payment Due</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong>{filteredSubs.length}</strong> of {subscriptions.length} subscriptions
          </span>
        </div>
      </div>

      {/* Subscriptions Grid Cards */}
      {filteredSubs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No subscriptions found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new tool using the Add Subscription button.
          </p>
          <button
            onClick={() => {
              setEditingSub(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            Add New Subscription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubs.map((sub) => {
            const days = getDaysDiff(sub.nextRenewalDate);
            const isExp = sub.status === 'Expired' || (days !== null && days < 0);
            const isRenewalSoon = days !== null && days >= 0 && days <= 30;
            const isUnpaid = sub.paymentStatus === 'Payment Due' || sub.paymentStatus === 'Overdue';

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {sub.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isUnpaid
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {sub.paymentStatus}
                      </span>
                      {sub.autoRenew && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          Auto-Renew
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Plan */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {sub.serviceName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{sub.provider}</span>
                        {sub.loginUrl && (
                          <a
                            href={sub.loginUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 inline-flex items-center"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900 dark:text-white block">
                        ₹{Number(sub.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        / {sub.billingCycle}
                      </span>
                    </div>
                  </div>

                  {/* Plan Badge & Seats */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                      {sub.planName}
                    </span>
                    {sub.seatsCount && (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {sub.seatsCount} Seats
                      </span>
                    )}
                  </div>

                  {/* Renewal & Expiry countdown block */}
                  <div className="mt-3.5 space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Next Renewal:</span>
                      <span
                        className={`font-semibold ${
                          isExp
                            ? 'text-rose-600'
                            : isRenewalSoon
                            ? 'text-amber-600'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {formatDate(sub.nextRenewalDate)}
                        <span className="text-[11px] font-normal ml-1">
                          ({isExp ? `Expired ${Math.abs(days)}d ago` : `${days}d left`})
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Owner / Custodian:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {sub.owner || 'Administrator'} ({sub.assignedDepartment})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Payment Method:</span>
                      <span className="text-slate-700 dark:text-slate-300">{sub.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSub(sub);
                        setShowAddModal(true);
                      }}
                      title="Edit"
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      title="Delete"
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRenewingSub(sub)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Renew
                    </button>
                    <button
                      onClick={() => setPayingSub(sub)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Pay
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddSubscriptionModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSub(null);
        }}
        initialSub={editingSub}
        onSuccess={loadSubs}
      />
      {renewingSub && (
        <RenewModal
          isOpen={true}
          onClose={() => setRenewingSub(null)}
          type="Subscription"
          item={renewingSub}
          onSuccess={loadSubs}
        />
      )}
      {payingSub && (
        <RecordPaymentModal
          isOpen={true}
          onClose={() => setPayingSub(null)}
          initialSub={payingSub}
          onSuccess={loadSubs}
        />
      )}
    </div>
  );
}
