import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';

export function QualityCheckPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"QC Inspector"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [inspectedQty, setInspectedQty] = useState(0);
  const [passedQty, setPassedQty] = useState(0);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [qcStatus, setQcStatus] = useState('Passed');
  const [inspectorName, setInspectorName] = useState(currentUser.name || 'Digendra Verma');
  const [qcDate, setQcDate] = useState(new Date().toISOString().split('T')[0]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');

  // Checkpoints
  const [checkpoints, setCheckpoints] = useState({
    dimensionsVerified: true,
    visualCosmeticCheck: true,
    functionalityCheck: true,
    barcodePackagingValid: true,
  });

  // 1. Pending QC Orders
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch = o.currentStage === 'Quality Check (QC)' || o.status === 'QC Pending';
      const hasCompleted = !!o.qcStatus && o.currentStage !== 'Quality Check (QC)';
      if (!isStageMatch || hasCompleted) return false;

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

  // 2. History QC Orders
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const hasHistory =
        !!o.qcStatus ||
        !!o.qcDateTime ||
        (o.stageDetails && !!o.stageDetails['Quality Check (QC)']);

      if (!hasHistory) return false;

      if (statusFilter !== 'ALL' && o.qcStatus !== statusFilter) return false;

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

    const ordered =
      order.processedQuantity ||
      order.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) ||
      parseFloat(order.quantity || 1);

    if (viewOnly && order.qcStatus) {
      setInspectedQty(order.checkedQuantity || order.inspectedQuantity || ordered);
      setPassedQty(order.passedQuantity || ordered);
      setRejectedQty(order.failedQuantity || order.rejectedQuantity || 0);
      setQcStatus(order.qcStatus || 'Passed');
      setInspectorName(order.qcBy || currentUser.name || 'QC Inspector');
      setQcDate(order.qcDate || order.qcDateTime?.split(' ')[0] || new Date().toISOString().split('T')[0]);
      setRejectionReason(order.defectDetails || order.rejectionReason || '');
      setRemarks(order.qcRemarks || '');
      if (order.qcCheckpoints) {
        setCheckpoints(order.qcCheckpoints);
      }
    } else {
      setInspectedQty(ordered);
      setPassedQty(ordered);
      setRejectedQty(0);
      setQcStatus('Passed');
      setInspectorName(currentUser.name || 'Digendra Verma');
      setQcDate(new Date().toISOString().split('T')[0]);
      setRejectionReason('');
      setRemarks('Quality parameters verified. Ready for dispatch packaging.');
      setCheckpoints({
        dimensionsVerified: true,
        visualCosmeticCheck: true,
        functionalityCheck: true,
        barcodePackagingValid: true,
      });
    }
  };

  const handleCloseModal = () => {
    setModalOrder(null);
    setIsViewOnly(false);
  };

  const handlePassedChange = (val) => {
    const passed = Math.max(0, parseFloat(val || 0));
    setPassedQty(passed);
    const rej = Math.max(0, parseFloat(inspectedQty || 0) - passed);
    setRejectedQty(rej);
    if (rej > 0 && qcStatus === 'Passed') {
      setQcStatus('Conditional Pass');
    } else if (rej === 0) {
      setQcStatus('Passed');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalOrder) return;

    const payload = {
      inspectedQuantity: parseFloat(inspectedQty || 0),
      passedQuantity: parseFloat(passedQty || 0),
      rejectedQuantity: parseFloat(rejectedQty || 0),
      qcStatus,
      qcBy: inspectorName,
      qcDate,
      qcDateTime: new Date().toLocaleString('en-IN'),
      qcCheckpoints: checkpoints,
      rejectionReason: rejectedQty > 0 ? rejectionReason : '',
      qcRemarks: remarks,
      nextStage: 'Ready for Dispatch',
      status: qcStatus === 'Failed' ? 'QC Failed' : 'Ready Check Pending',
    };

    advanceOrderStage(modalOrder.id, payload, `QC Inspection: ${qcStatus} (Passed: ${passedQty}, Rejected: ${rejectedQty})`);
    alert(`QC Report saved for Order ${modalOrder.orderNumber}! Moved to Ready for Dispatch.`);

    handleCloseModal();
    navigate('/sales/ready-dispatch');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-400 font-extrabold text-[10px] uppercase tracking-wider border border-teal-500/30">
            Order To Delivery
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Quality Check (QC)</h1>
          <p className="text-[11px] text-slate-400">Conduct rigorous quality assurance checks, record defects, and generate inspection certificates.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-teal-600 text-white shadow-xs'
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
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-bold">QC Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Passed">Passed</option>
              <option value="Conditional Pass">Conditional Pass</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Pending Quality Check' : 'Quality Check History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders awaiting quality inspection' : 'No QC history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3 text-center">Inspected</th>
                  <th className="py-2 px-3 text-center">Approved</th>
                  <th className="py-2 px-3 text-center">Rejected</th>
                  <th className="py-2 px-3 text-center">QC Status</th>
                  <th className="py-2 px-3 text-center">Inspector</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const total =
                    o.processedQuantity ||
                    o.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) ||
                    parseFloat(o.quantity || 1);
                  const insp = o.inspectedQuantity || o.checkedQuantity || (activeTab === 'history' ? total : total);
                  const pass = o.passedQuantity !== undefined ? o.passedQuantity : (activeTab === 'history' ? total : total);
                  const rej = o.rejectedQuantity || o.failedQuantity || 0;
                  const st = o.qcStatus || (activeTab === 'pending' ? 'Pending' : 'Passed');

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-teal-600 dark:text-teal-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{o.customerName}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{insp}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{pass}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">{rej}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            st === 'Passed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : st === 'Conditional Pass'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : st === 'Failed'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {o.qcBy || 'Inspector'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Perform QC</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(o, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Report</span>
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

      {/* QC Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Quality Inspection Report (Read-Only)' : 'Quality Assurance Inspection'}
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
                  <span className="text-slate-400 block font-bold">Processed Qty</span>
                  <span className="font-extrabold text-teal-600 dark:text-teal-400">
                    {inspectedQty} Units
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Delivery Due</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{modalOrder.expectedDeliveryDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Batch Reference</span>
                  <span className="font-mono font-bold text-purple-600">{modalOrder.batchNo || `BATCH-${modalOrder.orderNumber}`}</span>
                </div>
              </div>

              {/* Quantity Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Total Inspected Quantity
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {inspectedQty}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      value={inspectedQty}
                      onChange={(e) => setInspectedQty(Math.max(1, parseFloat(e.target.value || 0)))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Approved / Passed Quantity *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-600">
                      {passedQty}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max={inspectedQty}
                      value={passedQty}
                      onChange={(e) => handlePassedChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Rejected Quantity
                  </label>
                  <div className={`p-2.5 border rounded-xl text-xs font-bold ${rejectedQty > 0 ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-500 bg-slate-50'}`}>
                    {rejectedQty}
                  </div>
                </div>
              </div>

              {/* Status & Inspector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    QC Final Result *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {qcStatus}
                    </div>
                  ) : (
                    <select
                      value={qcStatus}
                      onChange={(e) => setQcStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Passed">Passed (100% Quality Assurance)</option>
                      <option value="Conditional Pass">Conditional Pass (Acceptable with deviation)</option>
                      <option value="Failed">Failed (Requires rework / scraping)</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    QC Inspector Name
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {inspectorName}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>
              </div>

              {/* QC Checkpoints */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Mandatory QC Checkpoints
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'dimensionsVerified', label: 'Dimensions & Specifications Compliant' },
                    { key: 'visualCosmeticCheck', label: 'Visual & Cosmetic Finish Approved' },
                    { key: 'functionalityCheck', label: 'Functional / Performance Testing Passed' },
                    { key: 'barcodePackagingValid', label: 'Barcode, Part Labeling & Serial Verified' },
                  ].map((cp) => (
                    <label
                      key={cp.key}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold ${
                        checkpoints[cp.key] ? 'bg-teal-50/50 border-teal-200 text-teal-900 dark:bg-teal-950/20 dark:text-teal-300' : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isViewOnly}
                        checked={checkpoints[cp.key]}
                        onChange={(e) => setCheckpoints({ ...checkpoints, [cp.key]: e.target.checked })}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                      />
                      <span>{cp.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {rejectedQty > 0 && (
                <div>
                  <label className="text-xs font-bold text-rose-600 block mb-1">
                    Rejection / Defect Details *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800">
                      {rejectionReason || 'None noted.'}
                    </div>
                  ) : (
                    <textarea
                      rows="2"
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specify cause of failure, scratch, tolerance issue, etc..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  QC Remarks & Observations
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
                    placeholder="Enter final QC observations..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    <span>Approve QC & Move to Dispatch Readiness</span>
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
