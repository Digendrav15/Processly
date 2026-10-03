import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  CheckCircle2,
  Package,
  FileCheck,
  ShieldCheck,
  Weight
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function ReadyForDispatchPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"Dispatch Officer"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [packageCount, setPackageCount] = useState(1);
  const [totalWeight, setTotalWeight] = useState(5.5);
  const [packagingDate, setPackagingDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [readyStatus, setReadyStatus] = useState('Ready for Dispatch');
  const [preparedBy, setPreparedBy] = useState(currentUser.name || 'Digendra Verma');
  const [remarks, setRemarks] = useState('');

  // Readiness Checklist
  const [checklist, setChecklist] = useState({
    packagingVerified: true,
    labelingVerified: true,
    invoiceGenerated: true,
    ewayBillGenerated: true,
    packingListAttached: true,
  });

  // 1. Pending Ready for Dispatch Orders
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch =
        o.currentStage === 'Ready for Dispatch' ||
        o.status === 'Ready Check Pending';
      const hasCompleted = !!o.readyStatus && o.currentStage !== 'Ready for Dispatch';
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

  // 2. History Orders
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const hasHistory =
        !!o.readyStatus ||
        !!o.readyDateTime ||
        (o.stageDetails && !!o.stageDetails['Ready for Dispatch']);

      if (!hasHistory) return false;

      if (statusFilter !== 'ALL' && o.readyStatus !== statusFilter) return false;

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

    if (viewOnly && order.readyStatus) {
      setPackageCount(order.packageCount || 1);
      setTotalWeight(order.totalWeight || 5.5);
      setPackagingDate(order.packagingDate || order.readyDateTime?.split(' ')[0] || new Date().toISOString().split('T')[0]);
      setInvoiceNo(order.invoiceNo || `INV-${order.orderNumber}`);
      setReadyStatus(order.readyStatus || 'Ready for Dispatch');
      setPreparedBy(order.dispatchPreparedBy || currentUser.name || 'Digendra Verma');
      setRemarks(order.readyRemarks || '');
      if (order.dispatchChecklist) {
        setChecklist(order.dispatchChecklist);
      }
    } else {
      setPackageCount(order.packageCount || 1);
      setTotalWeight(order.totalWeight || 5.0);
      setPackagingDate(new Date().toISOString().split('T')[0]);
      setInvoiceNo(order.invoiceNo || `INV-${order.orderNumber}`);
      setReadyStatus('Ready for Dispatch');
      setPreparedBy(currentUser.name || 'Digendra Verma');
      setRemarks('Packaging inspected, verified, and tagged. Order is fully ready for dispatch.');
      setChecklist({
        packagingVerified: true,
        labelingVerified: true,
        invoiceGenerated: true,
        ewayBillGenerated: true,
        packingListAttached: true,
      });
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
      packageCount: parseInt(packageCount || 1, 10),
      totalWeight: parseFloat(totalWeight || 0),
      packagingDate,
      invoiceNo,
      dispatchChecklist: checklist,
      readyStatus,
      dispatchPreparedBy: preparedBy,
      readyDateTime: new Date().toLocaleString('en-IN'),
      readyRemarks: remarks,
      nextStage: 'Dispatch',
      status: 'Dispatch Pending',
    };

    advanceOrderStage(modalOrder.id, payload, `Ready for dispatch confirmed: ${readyStatus} (${packageCount} Boxes)`);
    alert(`Order ${modalOrder.orderNumber} confirmed Ready for Dispatch! Moved to Dispatch.`);

    handleCloseModal();
    navigate('/sales/dispatch');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-200 dark:border-cyan-800/80">
            Order To Delivery
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Ready for Dispatch</h1>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex space-x-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-cyan-600 text-white shadow-xs'
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
                ? 'bg-cyan-600 text-white shadow-xs'
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
            placeholder="Search Order # or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-bold">Readiness:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Ready for Dispatch">Ready for Dispatch</option>
              <option value="Packaging In Progress">Packaging In Progress</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Pending Dispatch Readiness' : 'Ready for Dispatch History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders pending packaging and readiness verification' : 'No dispatch readiness history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3 text-center">Boxes / Packages</th>
                  <th className="py-2 px-3 text-center">Weight (Kg)</th>
                  <th className="py-2 px-3">Invoice Ref</th>
                  <th className="py-2 px-3 text-center">Readiness Status</th>
                  <th className="py-2 px-3 text-center">Packaging Date</th>
                  {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const pkgs = o.packageCount || 1;
                  const wt = o.totalWeight || '5.0';
                  const inv = o.invoiceNo || `INV-${o.orderNumber}`;
                  const st = o.readyStatus || (activeTab === 'pending' ? 'Pending Check' : 'Ready for Dispatch');

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-cyan-600 dark:text-cyan-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{o.customerName}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {pkgs} Box(es)
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                        {wt} Kg
                      </td>
                      <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-medium">
                        {inv}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            st === 'Ready for Dispatch'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : st === 'Packaging In Progress'
                              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {o.packagingDate || o.readyDateTime?.split(' ')[0] || o.orderDate}
                      </td>
                      {activeTab === 'pending' ? (
                        <PlannedTd plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate}
                          actualDate={o.packagingDate || o.readyDateTime || o.stageDetails?.['Ready for Dispatch']?.completedAt || o.updatedAt}
                        />
                      )}
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Verify Readiness</span>
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

      {/* Readiness Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Dispatch Readiness Record (Read-Only)' : 'Dispatch Readiness & Packaging Check'}
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
                  <span className="text-slate-400 block font-bold">Shipping Address</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                    {modalOrder.shippingAddress || modalOrder.billingAddress || 'Local Delivery'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Grand Total</span>
                  <span className="font-bold text-emerald-600">
                    ₹ {parseFloat(modalOrder.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">QC Status</span>
                  <span className="font-extrabold text-teal-600">{modalOrder.qcStatus || 'Passed'}</span>
                </div>
              </div>

              {/* Packaging Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Number of Boxes / Packages *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {packageCount} Box(es)
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      required
                      value={packageCount}
                      onChange={(e) => setPackageCount(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Total Gross Weight (Kg) *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {totalWeight} Kg
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={totalWeight}
                      onChange={(e) => setTotalWeight(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tax Invoice Reference
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold">
                      {invoiceNo}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>
              </div>

              {/* Status and Prepared By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Ready for Dispatch Status *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {readyStatus}
                    </div>
                  ) : (
                    <select
                      value={readyStatus}
                      onChange={(e) => setReadyStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="Ready for Dispatch">Ready for Dispatch (100% Prepared)</option>
                      <option value="Packaging In Progress">Packaging In Progress</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Prepared By
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {preparedBy}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={preparedBy}
                      onChange={(e) => setPreparedBy(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>
              </div>

              {/* Readiness Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-cyan-600" />
                  Pre-Dispatch Verification Checklist
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'packagingVerified', label: 'Protective Packaging & Seals Verified' },
                    { key: 'labelingVerified', label: 'Shipping Label & Customer Details Verified' },
                    { key: 'invoiceGenerated', label: 'Tax Invoice Attached to Consignment' },
                    { key: 'ewayBillGenerated', label: 'E-Way Bill Generated & Verified' },
                    { key: 'packingListAttached', label: 'Itemized Packing Slip Placed Inside' },
                  ].map((chk) => (
                    <label
                      key={chk.key}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-semibold ${
                        checklist[chk.key] ? 'bg-cyan-50/50 border-cyan-200 text-cyan-900 dark:bg-cyan-950/20 dark:text-cyan-300' : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isViewOnly}
                        checked={checklist[chk.key]}
                        onChange={(e) => setChecklist({ ...checklist, [chk.key]: e.target.checked })}
                        className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                      />
                      <span>{chk.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Readiness Remarks
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
                    placeholder="Enter box markings, handling instructions..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <span>Confirm Ready & Move to Dispatch</span>
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
