import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  History,
  FileCheck,
  User,
  Calendar,
  CheckSquare
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';
import { calculateDelayInfo, formatShortDate } from '../../services/tatCalculationService';

export function OrderVerificationPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);

  // Main Tab: 'pending' | 'history'
  const [activeTab, setActiveTab] = useState('pending');

  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // 1. Pending Orders (Awaiting Verification)
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch =
        o.currentStage === 'Order Verification' || o.status === 'Verification Pending';
      const isAlreadyVerified = o.verificationStatus === 'Verified';

      if (!isStageMatch || isAlreadyVerified) return false;

      // Priority
      if (priorityFilter !== 'ALL' && (o.priority || 'Normal') !== priorityFilter) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.salesPerson || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, searchTerm, priorityFilter]);

  // 2. History Orders (Already Verified or Updated in this stage)
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const hasVerificationHistory =
        o.verificationStatus === 'Verified' ||
        o.verificationStatus === 'Correction Required' ||
        o.verificationStatus === 'Rejected' ||
        (o.stageDetails && o.stageDetails['Order Verification']);

      if (!hasVerificationHistory) return false;

      // Priority
      if (priorityFilter !== 'ALL' && (o.priority || 'Normal') !== priorityFilter) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.salesPerson || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, searchTerm, priorityFilter]);

  // Current list based on active tab
  const currentList = activeTab === 'pending' ? pendingOrders : historyOrders;

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Active selected order
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = currentList.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId);
      if (found) return found;
    }
    return currentList[0] || null;
  }, [currentList, selectedOrderId]);

  // Form State for Pending Order Verification
  const [verifications, setVerifications] = useState({
    customerVerified: true,
    productVerified: true,
    quantityVerified: true,
    rateVerified: true,
    addressVerified: true,
    deliveryDateVerified: true,
    paymentTermsVerified: true,
  });

  const [verificationStatus, setVerificationStatus] = useState('Verified');
  const [remarks, setRemarks] = useState('All customer and order parameters verified.');

  const handleAction = (statusOverride, nextPath) => {
    if (!activeOrder) {
      alert('No active order selected for verification.');
      return;
    }

    const finalStatus = statusOverride || verificationStatus;
    const isVerified = finalStatus === 'Verified';

    const payload = {
      verifications,
      verificationStatus: finalStatus,
      verificationRemarks: remarks || 'Verified and approved for next stage.',
      remarks: remarks || 'Verified',
      verifiedDate: new Date().toLocaleString('en-IN'),
      nextStage: isVerified ? 'Order Approval' : 'Order Verification',
      status: isVerified ? 'Pending Approval' : finalStatus === 'Rejected' ? 'Rejected' : 'Correction Required',
    };

    const updated = advanceOrderStage(activeOrder.id, payload, remarks);

    if (updated) {
      alert(`Order ${activeOrder.orderNumber} successfully ${finalStatus}! Moved to History & Stage advanced.`);
      // Switch to history tab or navigate to approval if user chooses
      if (nextPath) {
        navigate(nextPath);
      } else {
        setActiveTab('history');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            Order To Delivery
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Order Verification</h1>
        </div>

        {/* Pending / History Primary Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex space-x-1 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('pending');
              setSelectedOrderId(null);
            }}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingOrders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedOrderId(null);
            }}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historyOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order #, Customer, Salesperson..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto text-xs items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {(searchTerm || priorityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPriorityFilter('ALL');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {currentList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-12 text-center text-xs text-slate-400 space-y-3">
          <ShieldCheck className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-base font-bold text-slate-600 dark:text-slate-300">
            {activeTab === 'pending'
              ? 'No orders pending verification'
              : 'No verification history recorded yet'}
          </p>
          <p>
            {activeTab === 'pending'
              ? 'New orders created in New Order stage will appear here for verification.'
              : 'Verified orders will be listed here as permanent audit records.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order List Column */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {activeTab === 'pending' ? 'Pending Orders' : 'Verified History'} ({currentList.length})
              </h3>
              <span className="text-[11px] text-indigo-600 font-semibold">Select Order</span>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {currentList.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    activeOrder?.id === o.id
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{o.orderNumber}</span>
                    <span className="font-extrabold text-emerald-600">
                      ₹ {parseFloat(o.grandTotal || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {o.customerName}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>Date: {o.orderDate}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        o.verificationStatus === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.verificationStatus === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : o.verificationStatus === 'Correction Required'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {o.verificationStatus || 'Pending Verification'}
                    </span>
                  </div>

                  {/* Planned / History TAT tags */}
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">
                      Planned: <strong className="text-slate-700 dark:text-slate-300">{formatShortDate(o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate)}</strong>
                    </span>
                    {activeTab === 'history' && (
                      <span className={`px-1.5 py-0.5 rounded font-bold ${calculateDelayInfo(o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate, o.verificationDate || o.updatedAt).badgeClass}`}>
                        {calculateDelayInfo(o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate, o.verificationDate || o.updatedAt).text}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details & Actions / History View */}
          {activeOrder && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b">
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Order Information (Read-Only) - <span className="text-indigo-600 font-mono">{activeOrder.orderNumber}</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-full">
                    Priority: {activeOrder.priority || 'Normal'}
                  </span>
                  {activeTab === 'history' && (
                    <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                      Stage: {activeOrder.currentStage || 'Verified'}
                    </span>
                  )}
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Customer Name</span>
                  <strong className="text-slate-900 dark:text-white">{activeOrder.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Order Date</span>
                  <strong className="text-slate-900 dark:text-white">{activeOrder.orderDate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Planned Completion</span>
                  <strong className="text-indigo-600 font-extrabold">
                    {formatShortDate(activeOrder.plannedCompletionDate || activeOrder.expectedDeliveryDate || activeOrder.orderDate)}
                  </strong>
                </div>
                {activeTab === 'history' && (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Actual Date</span>
                      <strong className="text-emerald-600 font-extrabold">
                        {formatShortDate(activeOrder.verificationDate || activeOrder.updatedAt)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Time Delay</span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                          calculateDelayInfo(
                            activeOrder.plannedCompletionDate || activeOrder.expectedDeliveryDate || activeOrder.orderDate,
                            activeOrder.verificationDate || activeOrder.updatedAt
                          ).badgeClass
                        }`}
                      >
                        {
                          calculateDelayInfo(
                            activeOrder.plannedCompletionDate || activeOrder.expectedDeliveryDate || activeOrder.orderDate,
                            activeOrder.verificationDate || activeOrder.updatedAt
                          ).text
                        }
                      </span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-slate-400 block text-[11px]">Grand Total</span>
                  <strong className="text-emerald-600 font-extrabold text-sm">
                    ₹ {parseFloat(activeOrder.grandTotal || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Terms</span>
                  <strong className="text-slate-900 dark:text-white">{activeOrder.paymentTerms || 'Standard'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Sales Person</span>
                  <strong className="text-slate-900 dark:text-white">{activeOrder.salesPerson || 'N/A'}</strong>
                </div>
              </div>

              {/* TAB CONTENT: PENDING (FORM) VS HISTORY (COMPLETED DETAILS) */}
              {activeTab === 'pending' ? (
                <>
                  {/* Verification Checkpoints */}
                  <div className="space-y-3 pt-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Verification Checkpoints</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {Object.entries({
                        customerVerified: 'Customer Verified',
                        productVerified: 'Product Verified',
                        quantityVerified: 'Quantity Verified',
                        rateVerified: 'Rate Verified',
                        addressVerified: 'Address Verified',
                        deliveryDateVerified: 'Delivery Date Verified',
                        paymentTermsVerified: 'Payment Terms Verified',
                      }).map(([key, label]) => (
                        <label
                          key={key}
                          className="flex items-center space-x-2.5 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-indigo-50/50 transition-colors border"
                        >
                          <input
                            type="checkbox"
                            checked={verifications[key]}
                            onChange={(e) => setVerifications({ ...verifications, [key]: e.target.checked })}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Verification Status & Remarks */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Verification Status</label>
                      <select
                        value={verificationStatus}
                        onChange={(e) => setVerificationStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-slate-900 dark:text-white"
                      >
                        <option value="Verified">Verified</option>
                        <option value="Correction Required">Correction Required</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Verification Remarks *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Enter verification notes or required correction details..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => handleAction('Correction Required')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Send Back
                    </button>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleAction('Rejected')}
                        className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction('Verified', '/sales/approval')}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <span>Verify & Continue</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* HISTORY VIEW (READ-ONLY VERIFICATION AUDIT) */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                          Verification Completed
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 font-mono">
                        {activeOrder.verifiedDate || activeOrder.updatedAt || 'Recorded'}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                      <p><strong>Remarks:</strong> {activeOrder.verificationRemarks || activeOrder.remarks || 'Verified successfully.'}</p>
                      <p className="mt-1"><strong>Status:</strong> {activeOrder.verificationStatus || 'Verified'}</p>
                      <p className="mt-1"><strong>Current Stage:</strong> <span className="text-indigo-600 font-bold">{activeOrder.currentStage}</span></p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Verified Checkpoints Record
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries({
                        customerVerified: 'Customer Verified',
                        productVerified: 'Product Verified',
                        quantityVerified: 'Quantity Verified',
                        rateVerified: 'Rate Verified',
                        addressVerified: 'Address Verified',
                        deliveryDateVerified: 'Delivery Date Verified',
                        paymentTermsVerified: 'Payment Terms Verified',
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 size={14} />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => navigate('/sales/approval')}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Go to Order Approval Stage</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
