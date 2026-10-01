import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Clock,
  History,
  Search,
  Filter,
  Eye,
  X,
  ShieldCheck
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function OrderApprovalPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"Management Admin"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal State
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [approvalStatus, setApprovalStatus] = useState('Approved');
  const [approvalRemarks, setApprovalRemarks] = useState('Order approved for processing and advance collection.');

  // 1. Pending approval
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch = o.currentStage === 'Order Approval' || o.status === 'Pending Approval';
      const isAlreadyApproved = o.approvalStatus === 'Approved';
      if (!isStageMatch || isAlreadyApproved) return false;

      if (priorityFilter !== 'ALL' && (o.priority || 'Normal') !== priorityFilter) return false;
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

  // 2. History approval
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const hasApprovalHistory =
        o.approvalStatus === 'Approved' ||
        o.approvalStatus === 'Rejected' ||
        o.approvalStatus === 'Hold' ||
        (o.stageDetails && o.stageDetails['Order Approval']);

      if (!hasApprovalHistory) return false;

      if (priorityFilter !== 'ALL' && (o.priority || 'Normal') !== priorityFilter) return false;
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

  const currentList = activeTab === 'pending' ? pendingOrders : historyOrders;

  const handleOpenAction = (order, viewOnly = false) => {
    setModalOrder(order);
    setIsViewOnly(viewOnly);
    setApprovalStatus(order.approvalStatus || 'Approved');
    setApprovalRemarks(order.approvalRemarks || 'Order approved for next stage.');
  };

  const handleCloseModal = () => {
    setModalOrder(null);
    setIsViewOnly(false);
  };

  const handleApprovalSubmit = (statusOverride) => {
    if (!modalOrder) return;

    const finalStatus = statusOverride || approvalStatus;
    const isApproved = finalStatus === 'Approved';

    const payload = {
      approvalStatus: finalStatus,
      approvalRemarks,
      approvedBy: currentUser.name || currentUser.username || 'Management Admin',
      approvalDateTime: new Date().toLocaleString('en-IN'),
      nextStage: isApproved ? 'Advance Payment' : 'Order Approval',
      status: isApproved ? 'Payment Pending' : finalStatus,
    };

    advanceOrderStage(modalOrder.id, payload, `Approval set to ${finalStatus}: ${approvalRemarks}`);
    alert(`Order ${modalOrder.orderNumber} ${finalStatus}! Moved to History & Stage updated.`);

    handleCloseModal();
    if (isApproved) {
      navigate('/sales/advance-payment');
    } else {
      setActiveTab('history');
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider border border-indigo-500/30">
            Order To Delivery
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Order Approval</h1>
          <p className="text-[11px] text-slate-400">Management approval & review for verified customer orders.</p>
        </div>

        {/* Pending & History Tabs */}
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

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2 items-center justify-between">
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

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-500">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Orders Table Format */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Pending Approval' : 'Approval History'} ({currentList.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold">
            {activeTab === 'pending' ? 'Select Action to Approve' : 'Approved Records'}
          </span>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <FileCheck className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders pending approval' : 'No approval history found'}
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
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3 text-center">Total Items</th>
                  <th className="py-2 px-3 text-center">Total Quantity</th>
                  <th className="py-2 px-3 text-right">Grand Total (₹)</th>
                  <th className="py-2 px-3">Payment Terms</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const totalQty = o.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) || o.quantity || 1;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">
                        {o.customerName}
                      </td>
                      <td className="py-1.5 px-3 text-slate-500 font-medium">{o.orderDate}</td>

                      {/* Planned or History TAT columns */}
                      {activeTab === 'pending' ? (
                        <PlannedTd plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate}
                          actualDate={o.approvalDate || o.updatedAt}
                        />
                      )}

                      <td className="py-1.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                            o.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : o.priority === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {o.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold">{o.items?.length || 1}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{totalQty}</td>
                      <td className="py-1.5 px-3 text-right font-extrabold text-emerald-600">
                        ₹ {parseFloat(o.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 font-medium">{o.paymentTerms || 'N/A'}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            o.approvalStatus === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.approvalStatus === 'Hold'
                              ? 'bg-amber-100 text-amber-800'
                              : o.approvalStatus === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {o.approvalStatus || 'Pending Approval'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer"
                          >
                            Approve / Review
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(o, true)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs transition-all flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>View Record</span>
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

      {/* ACTION / REVIEW MODAL */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            <div className="flex justify-between items-center p-5 border-b bg-slate-900 text-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  Order Approval Action
                </span>
                <h3 className="text-base font-extrabold">{modalOrder.orderNumber} - {modalOrder.customerName}</h3>
              </div>
              <button onClick={handleCloseModal} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl">
                <div><span className="text-slate-400 block text-[11px]">Grand Total</span><strong className="text-emerald-600 text-sm">₹ {parseFloat(modalOrder.grandTotal || 0).toLocaleString('en-IN')}</strong></div>
                <div><span className="text-slate-400 block text-[11px]">Total Items</span><strong>{modalOrder.items?.length || 1}</strong></div>
                <div><span className="text-slate-400 block text-[11px]">Expected Delivery</span><strong>{modalOrder.expectedDeliveryDate || 'N/A'}</strong></div>
                <div><span className="text-slate-400 block text-[11px]">Payment Terms</span><strong>{modalOrder.paymentTerms || 'Standard'}</strong></div>
              </div>

              {!isViewOnly ? (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold mb-1.5 text-slate-800 dark:text-slate-200">Approval Decision *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Approved', 'Hold', 'Rejected'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setApprovalStatus(st)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            approvalStatus === st
                              ? st === 'Approved'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                : st === 'Hold'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                : 'bg-rose-600 text-white border-rose-600 shadow-md'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-800 dark:text-slate-200">Approval Remarks</label>
                    <textarea
                      rows={3}
                      value={approvalRemarks}
                      onChange={(e) => setApprovalRemarks(e.target.value)}
                      placeholder="Add remarks for approval, hold, or rejection..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-[11px]">
                    <div><span className="text-slate-400 block">Approved By (Auto)</span><strong className="text-indigo-600">{currentUser.name || 'Management Admin'}</strong></div>
                    <div><span className="text-slate-400 block">Approval Date/Time (Auto)</span><strong>{new Date().toLocaleString('en-IN')}</strong></div>
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
                      type="button"
                      onClick={() => handleApprovalSubmit()}
                      className="px-6 py-2 bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg hover:bg-emerald-500 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Submit Approval Decision</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* History View Modal */
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                          {modalOrder.approvalStatus || 'Approved'} by {modalOrder.approvedBy || 'Management'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {modalOrder.approvalDateTime || 'Recorded'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 dark:text-emerald-200">
                      <strong>Remarks:</strong> {modalOrder.approvalRemarks || 'Order approved.'}
                    </p>
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
