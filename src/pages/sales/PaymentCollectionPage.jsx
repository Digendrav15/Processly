import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building2,
  Calendar
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';

export function PaymentCollectionPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [currentPayment, setCurrentPayment] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('Received');
  const [remarks, setRemarks] = useState('');

  // 1. Pending Payment Orders
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch =
        o.currentStage === 'Payment Collection' ||
        o.status === 'Payment Collection Pending';
      const isAlreadyPaid =
        (o.finalPaymentStatus === 'Received' || o.remainingAmount === 0) &&
        o.currentStage !== 'Payment Collection';

      if (!isStageMatch || isAlreadyPaid) return false;

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

  // 2. History Orders
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const hasHistory =
        o.finalPaymentStatus === 'Received' ||
        !!o.finalPaymentDate ||
        (o.stageDetails && !!o.stageDetails['Payment Collection']);

      if (!hasHistory) return false;

      if (statusFilter !== 'ALL' && (o.finalPaymentStatus || 'Received') !== statusFilter) return false;

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

    const total = parseFloat(order.grandTotal || 0);
    const advance = parseFloat(order.advanceAmount || order.totalPaid || 0);
    const balDue = Math.max(0, total - advance);

    if (viewOnly && (order.finalPaymentStatus || order.finalPaymentDate)) {
      setCurrentPayment(order.currentPaymentAmount || balDue);
      setPaymentMode(order.finalPaymentMode || 'Bank Transfer');
      setTransactionRef(order.finalTransactionRef || `TXN-${Math.floor(100000 + Math.random() * 900000)}`);
      setPaymentDate(order.finalPaymentDate || new Date().toISOString().split('T')[0]);
      setPaymentStatus(order.finalPaymentStatus || 'Received');
      setRemarks(order.paymentCollectionRemarks || '');
    } else {
      setCurrentPayment(balDue);
      setPaymentMode('Bank Transfer');
      setTransactionRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentStatus('Received');
      setRemarks('Final invoice balance collected and verified in account.');
    }
  };

  const handleCloseModal = () => {
    setModalOrder(null);
    setIsViewOnly(false);
  };

  const total = parseFloat(modalOrder?.grandTotal || 0);
  const advance = parseFloat(modalOrder?.advanceAmount || modalOrder?.totalPaid || 0);
  const balBefore = Math.max(0, total - advance);
  const payNow = parseFloat(currentPayment || 0);
  const remainingBal = Math.max(0, balBefore - payNow);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalOrder) return;

    const isFullyPaid = remainingBal <= 0 && paymentStatus === 'Received';
    const payload = {
      previousPaidAmount: advance,
      currentPaymentAmount: payNow,
      totalPaidAmount: advance + payNow,
      remainingAmount: remainingBal,
      finalPaymentMode: paymentMode,
      finalTransactionRef: transactionRef,
      finalPaymentDate: paymentDate,
      finalPaymentStatus: isFullyPaid ? 'Received' : paymentStatus,
      paymentCollectionRemarks: remarks,
      nextStage: 'Order Closed',
      status: 'Ready to Close',
    };

    advanceOrderStage(modalOrder.id, payload, `Final payment received: ₹${payNow} (${paymentStatus})`);
    alert(`Payment logged for Order ${modalOrder.orderNumber}! Moved to Final Order Closure.`);

    handleCloseModal();
    navigate('/sales/closed');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
            Order To Delivery
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Payment Collection</h1>
          <p className="text-[11px] text-slate-400">Collect final balances against delivered invoices and reconcile ledger receipts.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
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
            placeholder="Search Order # or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-bold">Payment Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Pending Balance Payment' : 'Payment Collection History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <DollarSign className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders currently pending balance collection' : 'No payment collection history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3 text-right">Grand Total (₹)</th>
                  <th className="py-2 px-3 text-right">Advance Paid (₹)</th>
                  <th className="py-2 px-3 text-right">Balance Due (₹)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Payment Date</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const grand = parseFloat(o.grandTotal || 0);
                  const adv = parseFloat(o.advanceAmount || o.totalPaid || 0);
                  const bal = Math.max(0, grand - adv);
                  const st = o.finalPaymentStatus || (activeTab === 'pending' ? 'Due' : 'Received');

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{o.customerName}</td>
                      <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                        ₹ {grand.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-slate-600 dark:text-slate-400">
                        ₹ {adv.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-right font-extrabold text-amber-600 dark:text-amber-400">
                        ₹ {bal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            st === 'Received'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {o.finalPaymentDate || o.paymentDate || '-'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect Payment</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(o, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Receipt</span>
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

      {/* Payment Action Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Payment Receipt Record (Read-Only)' : 'Record Balance Payment Collection'}
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
                  <span className="text-slate-400 block font-bold">Grand Total</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    ₹ {total.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Advance Paid</span>
                  <span className="font-bold text-emerald-600">
                    ₹ {advance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Balance Due</span>
                  <span className="font-black text-amber-600">
                    ₹ {balBefore.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Invoice Ref</span>
                  <span className="font-mono font-bold text-purple-600">
                    {modalOrder.invoiceNo || `INV-${modalOrder.orderNumber}`}
                  </span>
                </div>
              </div>

              {/* Amount & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount Received (₹) *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-extrabold text-emerald-600">
                      ₹ {payNow.toLocaleString('en-IN')}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      max={balBefore}
                      required
                      value={currentPayment}
                      onChange={(e) => setCurrentPayment(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Remaining Balance (₹)
                  </label>
                  <div className={`p-2.5 border rounded-xl text-xs font-black ${remainingBal > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                    ₹ {remainingBal.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Mode *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {paymentMode}
                    </div>
                  ) : (
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI / QR Code">UPI / QR Code</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Transaction Ref & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Transaction Ref / Cheque No *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold text-indigo-600">
                      {transactionRef}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. UTR / UPI / CHQ # 987452"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Date *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {paymentDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Collection Remarks & Bank Notes
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
                    placeholder="Enter settlement notes or bank ledger remarks..."
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
                    <span>Confirm Receipt & Advance to Order Closure</span>
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
