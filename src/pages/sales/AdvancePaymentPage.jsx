import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Clock,
  History,
  Search,
  Filter,
  Eye,
  X
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function AdvancePaymentPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentProof, setPaymentProof] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Received');
  const [remarks, setRemarks] = useState('');

  // 1. Pending advance
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch = o.currentStage === 'Advance Payment' || o.status === 'Payment Pending';
      const isPaid = (o.advanceAmount > 0 || o.totalPaid > 0) && o.currentStage !== 'Advance Payment';
      if (!isStageMatch || isPaid) return false;

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

  // 2. History advance
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const hasAdvanceHistory =
        o.advanceAmount > 0 ||
        o.totalPaid > 0 ||
        (o.stageDetails && o.stageDetails['Advance Payment']);

      if (!hasAdvanceHistory) return false;

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

  const currentList = activeTab === 'pending' ? pendingOrders : historyOrders;

  const handleOpenAction = (order, viewOnly = false) => {
    setModalOrder(order);
    setIsViewOnly(viewOnly);
    const total = parseFloat(order.grandTotal || 0);
    setAdvanceAmount(order.advanceAmount || Math.round(total * 0.3));
    setPaymentMode(order.paymentMode || 'Bank Transfer');
    setTransactionRef(order.transactionRef || '');
    setPaymentDate(order.paymentDate || new Date().toISOString().split('T')[0]);
    setPaymentProof(order.paymentProof || '');
    setPaymentStatus(order.paymentStatus || 'Received');
    setRemarks(order.advancePaymentRemarks || '');
  };

  const handleCloseModal = () => {
    setModalOrder(null);
    setIsViewOnly(false);
  };

  const orderTotal = parseFloat(modalOrder?.grandTotal || 0);
  const paidNow = parseFloat(advanceAmount || 0);
  const balanceAmount = Math.max(0, orderTotal - paidNow);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalOrder) return;

    const payload = {
      advanceAmount: paidNow,
      paymentMode,
      transactionRef,
      paymentDate,
      paymentProof,
      paymentStatus,
      totalPaid: paidNow,
      balanceAmount,
      advancePaymentRemarks: remarks,
      nextStage: 'Stock Check',
      status: 'Stock Check Pending',
    };

    advanceOrderStage(modalOrder.id, payload, `Advance payment logged: ₹${paidNow} (${paymentStatus})`);
    alert(`Advance payment saved for Order ${modalOrder.orderNumber}! Moved to History & Stock Check.`);

    handleCloseModal();
    navigate('/sales/stock-check');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
            Order To Delivery
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Advance Payment</h1>
          <p className="text-[11px] text-slate-400">Record and verify advance customer payments prior to stock checking.</p>
        </div>

        {/* Tabs */}
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

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order # or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Pending Advance Payment' : 'Advance Payment History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CreditCard className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders pending advance payment' : 'No advance payment history found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3">Order Date</th>
                  {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="py-2 px-3 text-right">Order Total (₹)</th>
                  <th className="py-2 px-3 text-right">Advance Req. (₹)</th>
                  <th className="py-2 px-3 text-right">Total Paid (₹)</th>
                  <th className="py-2 px-3 text-right">Balance (₹)</th>
                  <th className="py-2 px-3 text-center">Payment Status</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const grand = parseFloat(o.grandTotal || 0);
                  const advReq = parseFloat(o.advanceRequired || grand * 0.3);
                  const paid = parseFloat(o.advanceAmount || o.totalPaid || 0);
                  const bal = Math.max(0, grand - paid);

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{o.customerName}</td>
                      <td className="py-1.5 px-3 text-slate-500 font-medium">{o.orderDate}</td>

                      {/* Planned or History TAT columns */}
                      {activeTab === 'pending' ? (
                        <PlannedTd plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate}
                          actualDate={o.paymentDate || o.updatedAt}
                        />
                      )}

                      <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                        ₹ {grand.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-indigo-600">
                        ₹ {advReq.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-right font-extrabold text-emerald-600">
                        ₹ {paid.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-rose-600">
                        ₹ {bal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            o.paymentStatus === 'Received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.paymentStatus === 'Partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {o.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer"
                          >
                            Record Payment
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(o, true)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs transition-all flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Eye size={12} />
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

      {/* PAYMENT ENTRY / VIEW MODAL */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            <div className="flex justify-between items-center p-5 border-b bg-slate-900 text-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Advance Payment Entry
                </span>
                <h3 className="text-base font-extrabold">{modalOrder.orderNumber} - {modalOrder.customerName}</h3>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl">
                <div><span className="text-slate-400 block text-[11px]">Order Total</span><strong className="text-emerald-600 text-sm">₹ {orderTotal.toLocaleString('en-IN')}</strong></div>
                <div><span className="text-slate-400 block text-[11px]">Payment Terms</span><strong>{modalOrder.paymentTerms || 'Advance 30%'}</strong></div>
                <div><span className="text-slate-400 block text-[11px]">Advance Required</span><strong className="text-indigo-600">₹ {(modalOrder.advanceRequired || orderTotal * 0.3).toLocaleString('en-IN')}</strong></div>
                <div><span className="text-slate-400 block text-[11px]">Order Date</span><strong>{modalOrder.orderDate}</strong></div>
              </div>

              {!isViewOnly ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">Advance Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-bold text-slate-900 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Payment Mode *</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold"
                      >
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Transaction / Reference Number</label>
                      <input
                        type="text"
                        placeholder="e.g. UTR12345678"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Payment Date</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Payment Status</label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold"
                      >
                        <option value="Received">Received</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Payment Proof (Attachment Name/URL)</label>
                      <input
                        type="text"
                        placeholder="Receipt ref"
                        value={paymentProof}
                        onChange={(e) => setPaymentProof(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Remarks</label>
                    <textarea
                      rows={2}
                      placeholder="Payment notes..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Total Paid (Auto)</span>
                      <strong className="text-emerald-600 text-sm">₹ {paidNow.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Balance Amount (Auto)</span>
                      <strong className="text-rose-600 text-sm">₹ {balanceAmount.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg hover:bg-emerald-500 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Save Advance & Advance Stage</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                /* View Receipt / Record */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                          Payment Status: {modalOrder.paymentStatus || 'Received'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700">{modalOrder.paymentDate || 'Recorded'}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      <div><span className="text-slate-400 block">Amount Paid</span><strong className="text-emerald-600 font-extrabold">₹ {parseFloat(modalOrder.advanceAmount || modalOrder.totalPaid || 0).toLocaleString('en-IN')}</strong></div>
                      <div><span className="text-slate-400 block">Payment Mode</span><strong>{modalOrder.paymentMode || 'Bank Transfer'}</strong></div>
                      <div><span className="text-slate-400 block">Txn Ref #</span><strong className="font-mono">{modalOrder.transactionRef || 'N/A'}</strong></div>
                      <div><span className="text-slate-400 block">Balance Pending</span><strong className="text-rose-600">₹ {parseFloat(modalOrder.balanceAmount || 0).toLocaleString('en-IN')}</strong></div>
                    </div>
                    {modalOrder.advancePaymentRemarks && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                        <strong>Remarks:</strong> {modalOrder.advancePaymentRemarks}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleCloseModal}
                      className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
