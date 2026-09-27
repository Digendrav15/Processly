import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  MapPin,
  FileCheck,
  User,
  Phone,
  Star,
  AlertTriangle
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';

export function DeliveredPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState(new Date().toTimeString().slice(0, 5));
  const [receivedBy, setReceivedBy] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [deliveredQuantity, setDeliveredQuantity] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState('Delivered');
  const [podNumber, setPodNumber] = useState('');
  const [customerRating, setCustomerRating] = useState('5 Stars');
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');

  // 1. Pending Delivery Orders
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch =
        o.currentStage === 'Delivered' ||
        o.status === 'In Transit' ||
        o.status === 'Dispatched';
      const hasDelivered = o.deliveryStatus === 'Delivered' && o.currentStage !== 'Delivered';
      if (!isStageMatch || hasDelivered) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.lrAwbNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, searchTerm]);

  // 2. History Orders
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const hasHistory =
        o.deliveryStatus === 'Delivered' ||
        !!o.actualDeliveryDateTime ||
        (o.stageDetails && !!o.stageDetails['Delivered']);

      if (!hasHistory) return false;

      if (statusFilter !== 'ALL' && (o.deliveryStatus || 'Delivered') !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.lrAwbNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter]);

  const currentList = activeTab === 'pending' ? pendingOrders : historyOrders;

  const handleOpenAction = (order, viewOnly = false) => {
    setModalOrder(order);
    setIsViewOnly(viewOnly);

    const totalQty =
      order.dispatchQuantity ||
      order.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) ||
      parseFloat(order.quantity || 1);

    if (viewOnly && order.deliveryStatus) {
      setDeliveryDate(order.deliveryDate || new Date().toISOString().split('T')[0]);
      setDeliveryTime(order.deliveryTime || '14:30');
      setReceivedBy(order.receivedBy || order.customerName || '');
      setReceiverMobile(order.receiverMobile || order.mobileNumber || '');
      setDeliveredQuantity(order.deliveredQuantity || totalQty);
      setDeliveryStatus(order.deliveryStatus || 'Delivered');
      setPodNumber(order.podNumber || `POD-${order.orderNumber}`);
      setCustomerRating(order.customerRating || '5 Stars');
      setRejectionReason(order.rejectionReason || '');
      setRemarks(order.deliveryRemarks || '');
    } else {
      setDeliveryDate(new Date().toISOString().split('T')[0]);
      setDeliveryTime(new Date().toTimeString().slice(0, 5));
      setReceivedBy(order.contactPerson || order.customerName || '');
      setReceiverMobile(order.mobileNumber || '9876543210');
      setDeliveredQuantity(totalQty);
      setDeliveryStatus('Delivered');
      setPodNumber(`POD-${order.orderNumber}`);
      setCustomerRating('5 Stars');
      setRejectionReason('');
      setRemarks('Material safely delivered in pristine condition and signed for by receiver.');
    }
  };

  const handleCloseModal = () => {
    setModalOrder(null);
    setIsViewOnly(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalOrder) return;

    const payload = {
      deliveryDate,
      deliveryTime,
      actualDeliveryDateTime: `${deliveryDate} ${deliveryTime}`,
      receivedBy,
      receiverMobile,
      deliveredQuantity: parseFloat(deliveredQuantity || 0),
      deliveryStatus,
      podNumber,
      customerRating,
      returnRejectionReason: deliveryStatus !== 'Delivered' ? rejectionReason : '',
      deliveryRemarks: remarks,
      nextStage: 'Payment Collection',
      status: 'Payment Collection Pending',
    };

    advanceOrderStage(modalOrder.id, payload, `Delivery confirmed: ${deliveryStatus} (Received by ${receivedBy})`);
    alert(`Order ${modalOrder.orderNumber} confirmed as ${deliveryStatus}! Moved to Payment Collection.`);

    handleCloseModal();
    navigate('/sales/payment-collection');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
            Order To Delivery
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Delivered</h1>
          <p className="text-[11px] text-slate-400">Record official delivery handover, receiver acknowledgement, and Proof of Delivery (POD).</p>
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
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historyOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order #, Customer, or LR #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-bold">Delivery Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Delivered">Delivered</option>
              <option value="Partial Delivered">Partial Delivered</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Pending Delivery Confirmation' : 'Delivered Orders History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders currently in transit pending delivery' : 'No delivery history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3">Carrier / LR #</th>
                  <th className="py-2 px-3">Received By</th>
                  <th className="py-2 px-3 text-center">Delivery Status</th>
                  <th className="py-2 px-3 text-center">Delivered On</th>
                  <th className="py-2 px-3 text-center">Customer Rating</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const lr = o.lrAwbNumber || '-';
                  const rec = o.receivedBy || (activeTab === 'pending' ? 'Awaiting Handover' : o.customerName);
                  const st = o.deliveryStatus || (activeTab === 'pending' ? 'In Transit' : 'Delivered');
                  const dt = o.actualDeliveryDateTime || (o.deliveryDate ? `${o.deliveryDate} ${o.deliveryTime || ''}` : '-');

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{o.customerName}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">{lr}</td>
                      <td className="py-1.5 px-3 text-slate-700 dark:text-slate-300 font-medium">{rec}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            st === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : st === 'In Transit'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">{dt}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-amber-500">
                        {o.customerRating || '5 Stars'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Delivery</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(o, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View POD</span>
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

      {/* Delivery Confirmation Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Proof of Delivery (POD) (Read-Only)' : 'Record Delivery Handover & POD'}
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
                  <span className="text-slate-400 block font-bold">Customer</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{modalOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Carrier & LR</span>
                  <span className="font-mono font-bold text-blue-600">
                    {modalOrder.transporterName || 'Carrier'} / {modalOrder.lrAwbNumber || 'LR-N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Dispatched Qty</span>
                  <span className="font-bold text-emerald-600">
                    {modalOrder.dispatchQuantity || modalOrder.quantity || 1} Units
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Expected Date</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{modalOrder.expectedDeliveryDate || 'Immediate'}</span>
                </div>
              </div>

              {/* Delivery Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Actual Delivery Date *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {deliveryDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      required
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Delivery Time *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {deliveryTime}
                    </div>
                  ) : (
                    <input
                      type="time"
                      required
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              {/* Received By and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Received By (Person Name) *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {receivedBy}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      placeholder="e.g. Ramesh Kumar (Store Manager)"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Receiver Contact Number *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {receiverMobile}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={receiverMobile}
                      onChange={(e) => setReceiverMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              {/* Status and Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Delivery Status *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {deliveryStatus}
                    </div>
                  ) : (
                    <select
                      value={deliveryStatus}
                      onChange={(e) => setDeliveryStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Delivered">Delivered (Successfully Handed Over)</option>
                      <option value="Partial Delivered">Partial Delivered</option>
                      <option value="Rejected">Rejected / Refused by Customer</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    POD Reference / No.
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold">
                      {podNumber}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={podNumber}
                      onChange={(e) => setPodNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Customer Feedback / Rating
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold text-amber-500">
                      {customerRating}
                    </div>
                  ) : (
                    <select
                      value={customerRating}
                      onChange={(e) => setCustomerRating(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="5 Stars">⭐⭐⭐⭐⭐ Excellent (5 Stars)</option>
                      <option value="4 Stars">⭐⭐⭐⭐ Good (4 Stars)</option>
                      <option value="3 Stars">⭐⭐⭐ Satisfactory (3 Stars)</option>
                      <option value="2 Stars">⭐⭐ Needs Improvement (2 Stars)</option>
                      <option value="1 Star">⭐ Unsatisfied (1 Star)</option>
                    </select>
                  )}
                </div>
              </div>

              {deliveryStatus !== 'Delivered' && (
                <div>
                  <label className="text-xs font-bold text-rose-600 block mb-1">
                    Return / Rejection Reason *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800">
                      {rejectionReason || 'None'}
                    </div>
                  ) : (
                    <textarea
                      rows="2"
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain customer refusal, shortage, damaged box, etc..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Delivery Remarks & Handover Notes
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
                    placeholder="Enter handover details or notes..."
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
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span>Confirm Delivery & Move to Payment Collection</span>
                    <ArrowRight className="w-4 h-4" />
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
