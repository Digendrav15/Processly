import React, { useState, useMemo } from 'react';
import {
  Cog,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Wrench,
  UserCheck
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import {
  STORAGE_KEYS,
  advanceOrderStage,
  getTATConfigForStage,
  calculatePlannedDate
} from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function OrderProcessingPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const tatConfigs = useOTDStorage(STORAGE_KEYS.TAT_CONFIGS, []);

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [batchNo, setBatchNo] = useState('');
  const [processedQty, setProcessedQty] = useState(0);
  const [assignedStation, setAssignedStation] = useState('Line-A Production');
  const [assignedOperator, setAssignedOperator] = useState('Ramesh Sharma');
  const [processingStatus, setProcessingStatus] = useState('Completed');
  const [priorityLevel, setPriorityLevel] = useState('Normal');
  const [expectedCompletion, setExpectedCompletion] = useState('');
  const [remarks, setRemarks] = useState('');

  // Stage TAT calculation
  const stageTat = getTATConfigForStage(tatConfigs, 'Order Processing');
  const tatHours = stageTat ? stageTat.tatHours : 24;

  // 1. Pending Orders (Awaiting Processing)
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch =
        o.currentStage === 'Order Processing' ||
        o.status === 'Processing Pending' ||
        o.status === 'Processing In Progress';
      const hasCompleted = o.processingStatus === 'Completed' && o.currentStage !== 'Order Processing';
      if (!isStageMatch || hasCompleted) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.batchNo || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, searchTerm]);

  // 2. History Orders (Already Processed)
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const hasHistory =
        o.processingStatus === 'Completed' ||
        !!o.actualCompletionDateTime ||
        (o.stageDetails && !!o.stageDetails['Order Processing']);

      if (!hasHistory) return false;

      if (statusFilter !== 'ALL' && (o.processingStatus || 'Completed') !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.batchNo || '').toLowerCase().includes(q)
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
      order.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) ||
      parseFloat(order.quantity || 1);

    setBatchNo(order.batchNo || `BATCH-${order.orderNumber}`);
    setProcessedQty(order.processedQuantity !== undefined ? order.processedQuantity : totalQty);
    setAssignedStation(order.assignedStation || 'Line-A Production');
    setAssignedOperator(order.assignedOperator || 'Ramesh Sharma');
    setProcessingStatus(order.processingStatus || (viewOnly ? 'Completed' : 'Completed'));
    setPriorityLevel(order.priority || 'Normal');
    setExpectedCompletion(
      order.expectedCompletionDate ||
        calculatePlannedDate(order.orderDate || new Date().toISOString(), tatHours)
    );
    setRemarks(order.processingRemarks || 'Order fulfillment and assembly processed as per specifications.');
  };

  const handleCloseModal = () => {
    setModalOrder(null);
    setIsViewOnly(false);
  };

  const totalRequiredQty =
    modalOrder?.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) ||
    parseFloat(modalOrder?.quantity || 1);
  const pendingQty = Math.max(0, totalRequiredQty - parseFloat(processedQty || 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalOrder) return;

    const payload = {
      batchNo,
      requiredQuantity: totalRequiredQty,
      processedQuantity: parseFloat(processedQty || 0),
      pendingQuantity: pendingQty,
      assignedStation,
      assignedOperator,
      processingStatus,
      processingPriority: priorityLevel,
      tatHours,
      plannedCompletion: expectedCompletion,
      actualCompletionDateTime: new Date().toLocaleString('en-IN'),
      processingRemarks: remarks,
      nextStage: 'Quality Check (QC)',
      status: 'QC Pending',
    };

    advanceOrderStage(modalOrder.id, payload, `Processing finished: ${processingStatus} (Batch: ${batchNo})`);
    alert(`Order ${modalOrder.orderNumber} processing recorded! Moving to Quality Check (QC).`);

    handleCloseModal();
    navigate('/sales/qc');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-extrabold text-[10px] uppercase tracking-wider border border-purple-200 dark:border-purple-800/80">
            Order To Delivery
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Order Processing</h1>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex space-x-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
            placeholder="Search Order #, Customer or Batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Pending Processing' : 'Order Processing History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Cog className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders pending processing' : 'No processing history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer Name</th>
                  {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="py-2 px-3">Batch / Card No</th>
                  <th className="py-2 px-3 text-center">Req. Qty</th>
                  <th className="py-2 px-3 text-center">Processed Qty</th>
                  <th className="py-2 px-3 text-center">Processing Status</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const reqQ =
                    o.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) ||
                    parseFloat(o.quantity || 1);
                  const procQ = o.processedQuantity !== undefined ? o.processedQuantity : (activeTab === 'history' ? reqQ : 0);
                  const st = o.processingStatus || (activeTab === 'pending' ? 'In Progress' : 'Completed');

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-purple-600 dark:text-purple-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{o.customerName}</td>

                      {/* Planned or History TAT columns */}
                      {activeTab === 'pending' ? (
                        <PlannedTd plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate}
                          actualDate={o.actualCompletionDateTime || o.stockCheckDate || o.updatedAt}
                        />
                      )}

                      <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                        {o.batchNo || `BATCH-${o.orderNumber}`}
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {reqQ}
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold text-purple-600 dark:text-purple-400">
                        {procQ}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            st === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : st === 'In Progress'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {o.actualCompletionDateTime || o.stockCheckDate || '-'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <Cog className="w-3.5 h-3.5" />
                            <span>Process Order</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(o, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
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

      {/* Processing Action / View Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Order Processing Record (Read-Only)' : 'Process Order Fulfillment'}
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
                  <span className="text-slate-400 block font-bold">Total Ordered Qty</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400">{totalRequiredQty} Items</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Expected Delivery</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{modalOrder.expectedDeliveryDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Priority</span>
                  <span className="font-extrabold text-amber-600">{modalOrder.priority || 'Normal'}</span>
                </div>
              </div>

              {/* Processing Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Batch / Job Card Number *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold">
                      {batchNo}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={batchNo}
                      onChange={(e) => setBatchNo(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Processing Status *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {processingStatus}
                    </div>
                  ) : (
                    <select
                      value={processingStatus}
                      onChange={(e) => setProcessingStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Completed">Completed (Ready for QC)</option>
                      <option value="In Progress">In Progress (Partially Finished)</option>
                      <option value="On Hold">On Hold (Pending Material)</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Required Quantity
                  </label>
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                    {totalRequiredQty}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Processed Quantity *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold text-purple-600">
                      {processedQty}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max={totalRequiredQty}
                      value={processedQty}
                      onChange={(e) => setProcessedQty(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Pending Quantity
                  </label>
                  <div className={`p-2.5 border rounded-xl text-xs font-bold ${pendingQty > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                    {pendingQty}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Machine / Line
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {assignedStation}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={assignedStation}
                      onChange={(e) => setAssignedStation(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Assigned Operator / Supervisor
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {assignedOperator}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={assignedOperator}
                      onChange={(e) => setAssignedOperator(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Processing Remarks / Fulfillment Notes
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
                    placeholder="Enter production or processing details..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-purple-500/20"
                  >
                    <span>Complete Processing & Move to QC</span>
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
