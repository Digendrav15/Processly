import React, { useState, useMemo } from 'react';
import {
  Archive,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  CheckCircle2,
  Lock,
  Star,
  FileCheck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';

export function OrderClosedPage() {
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"System Admin"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [finalStatus, setFinalStatus] = useState('Successfully Completed');
  const [satisfactionRating, setSatisfactionRating] = useState('5 Stars');
  const [closedBy, setClosedBy] = useState(currentUser.name || 'System Admin');
  const [closureDate, setClosureDate] = useState(new Date().toISOString().split('T')[0]);
  const [archiveOrder, setArchiveOrder] = useState(true);
  const [remarks, setRemarks] = useState('');

  // 1. Pending Closure Orders
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isReadyToClose =
        o.currentStage === 'Order Closed' ||
        o.status === 'Ready to Close' ||
        o.status === 'Pending Close' ||
        (o.deliveryStatus === 'Delivered' && (o.finalPaymentStatus === 'Received' || o.remainingAmount === 0));

      const isAlreadyClosed = o.status === 'Closed' || o.finalOrderStatus === 'Closed';

      if (!isReadyToClose || isAlreadyClosed) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, searchTerm]);

  // 2. History Orders (Closed)
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const isClosed =
        o.status === 'Closed' ||
        o.finalOrderStatus === 'Closed' ||
        (o.stageDetails && !!o.stageDetails['Order Closed']);

      if (!isClosed) return false;

      if (statusFilter !== 'ALL' && (o.finalOrderStatus || 'Closed') !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter]);

  const currentList = activeTab === 'pending' ? pendingOrders : historyOrders;

  const handleOpenAction = (order, viewOnly = false) => {
    setModalOrder(order);
    setIsViewOnly(viewOnly);

    if (viewOnly && (order.status === 'Closed' || order.finalOrderStatus)) {
      setFinalStatus(order.finalOrderStatus || 'Successfully Completed');
      setSatisfactionRating(order.customerSatisfactionRating || order.customerRating || '5 Stars');
      setClosedBy(order.closedBy || currentUser.name || 'System Admin');
      setClosureDate(order.closingDateTime?.split(' ')[0] || new Date().toISOString().split('T')[0]);
      setArchiveOrder(order.isArchived !== false);
      setRemarks(order.closingRemarks || '');
    } else {
      setFinalStatus('Successfully Completed');
      setSatisfactionRating(order.customerRating || '5 Stars');
      setClosedBy(currentUser.name || 'System Admin');
      setClosureDate(new Date().toISOString().split('T')[0]);
      setArchiveOrder(true);
      setRemarks('All stages from Verification to Delivery & Payment Collection successfully validated.');
    }
  };

  const handleCloseModal = () => {
    setModalOrder(null);
    setIsViewOnly(false);
  };

  const isDeliveryDone = modalOrder?.deliveryStatus === 'Delivered';
  const isPaymentDone =
    modalOrder?.finalPaymentStatus === 'Received' ||
    parseFloat(modalOrder?.remainingAmount || 0) <= 0 ||
    parseFloat(modalOrder?.balanceAmount || 0) <= 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalOrder) return;

    const payload = {
      finalOrderStatus: 'Closed',
      closureType: finalStatus,
      customerSatisfactionRating: satisfactionRating,
      closedBy,
      closingDateTime: new Date().toLocaleString('en-IN'),
      isArchived: archiveOrder,
      closingRemarks: remarks,
      currentStage: 'Order Closed',
      status: 'Closed',
    };

    advanceOrderStage(modalOrder.id, payload, `Order closed & archived by ${closedBy} (${finalStatus})`);
    alert(`Order ${modalOrder.orderNumber} is now officially CLOSED & ARCHIVED! Moved to History.`);

    handleCloseModal();
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
            Order To Delivery
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Order Closed</h1>
          <p className="text-[11px] text-slate-400">Final closure, audit sign-off, and permanent archiving of fulfilled orders.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Closed History ({historyOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order # or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Ready for Closure & Archiving' : 'Archived & Closed Orders'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Archive className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders currently awaiting final closure' : 'No closed orders found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3 text-right">Order Total (₹)</th>
                  <th className="py-2 px-3 text-center">Delivery</th>
                  <th className="py-2 px-3 text-center">Payment</th>
                  <th className="py-2 px-3 text-center">Order Status</th>
                  <th className="py-2 px-3 text-center">Closed Date</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const grand = parseFloat(o.grandTotal || 0);
                  const isDel = o.deliveryStatus === 'Delivered';
                  const isPay = o.finalPaymentStatus === 'Received' || o.remainingAmount === 0;
                  const st = o.status === 'Closed' ? 'Closed' : 'Ready to Close';

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{o.customerName}</td>
                      <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                        ₹ {grand.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDel ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDel ? 'Delivered' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPay ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPay ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            st === 'Closed'
                              ? 'bg-slate-900 text-white dark:bg-slate-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {o.closingDateTime ? o.closingDateTime.split(' ')[0] : '-'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Close Order</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(o, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Dossier</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closure Confirmation Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Order Closed Dossier (Archived)' : 'Confirm Order Closure'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Order: {modalOrder.orderNumber} - {modalOrder.customerName}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Order Info Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border text-xs">
                <div>
                  <span className="text-slate-400 block font-bold">Total Invoiced</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    ₹ {parseFloat(modalOrder.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Delivery Status</span>
                  <span className="font-extrabold text-emerald-600">
                    {modalOrder.deliveryStatus || 'Delivered'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Payment Status</span>
                  <span className="font-extrabold text-emerald-600">
                    {modalOrder.finalPaymentStatus || 'Received'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Salesperson</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">
                    {modalOrder.salesPerson || 'Digendra'}
                  </span>
                </div>
              </div>

              {/* Status & Satisfaction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Final Order Status *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {finalStatus}
                    </div>
                  ) : (
                    <select
                      value={finalStatus}
                      onChange={(e) => setFinalStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Successfully Completed">Successfully Completed & Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Returned & Refunded">Returned & Refunded</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer Satisfaction Rating
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold text-amber-500">
                      {satisfactionRating}
                    </div>
                  ) : (
                    <select
                      value={satisfactionRating}
                      onChange={(e) => setSatisfactionRating(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="5 Stars">⭐⭐⭐⭐⭐ 5 Stars (Highly Satisfied)</option>
                      <option value="4 Stars">⭐⭐⭐⭐ 4 Stars (Satisfied)</option>
                      <option value="3 Stars">⭐⭐⭐ 3 Stars (Average)</option>
                      <option value="2 Stars">⭐⭐ 2 Stars (Needs Improvement)</option>
                      <option value="1 Star">⭐ 1 Star (Unsatisfied)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Closed By & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Order Closed By
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {closedBy}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={closedBy}
                      onChange={(e) => setClosedBy(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Closure Date
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {closureDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={closureDate}
                      onChange={(e) => setClosureDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Final Closure Remarks
                </label>
                {isViewOnly ? (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300">
                    {remarks || 'None'}
                  </div>
                ) : (
                  <textarea
                    rows="2"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter final closure notes or audit approval remarks..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>

                {!isViewOnly && (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-slate-900/20"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Confirm Final Closure & Archive</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
