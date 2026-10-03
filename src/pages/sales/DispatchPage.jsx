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
  Navigation,
  FileText,
  User,
  Phone,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function DispatchPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const transporters = useOTDStorage(STORAGE_KEYS.TRANSPORTERS, []);

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [transporterName, setTransporterName] = useState('');
  const [transportMode, setTransportMode] = useState('Surface Transport');
  const [lrAwbNumber, setLrAwbNumber] = useState('');
  const [lrDate, setLrDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [dispatchDateTime, setDispatchDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState('In Transit');
  const [remarks, setRemarks] = useState('');

  // 1. Pending Dispatch Orders
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch = o.currentStage === 'Dispatch' || o.status === 'Dispatch Pending';
      const hasCompleted = (!!o.lrAwbNumber || o.status === 'In Transit') && o.currentStage !== 'Dispatch';
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
        !!o.lrAwbNumber ||
        !!o.dispatchDateTime ||
        o.status === 'In Transit' ||
        (o.stageDetails && !!o.stageDetails['Dispatch']);

      if (!hasHistory) return false;

      if (statusFilter !== 'ALL' && (o.dispatchStatus || 'In Transit') !== statusFilter) return false;

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

    const defaultTransporter = transporters[0]?.name || 'VRL Logistics';

    if (viewOnly && (order.lrAwbNumber || order.dispatchDateTime)) {
      setTransporterName(order.transporterName || defaultTransporter);
      setTransportMode(order.transportMode || order.transportType || 'Surface Transport');
      setLrAwbNumber(order.lrAwbNumber || '');
      setLrDate(order.lrDate || new Date().toISOString().split('T')[0]);
      setVehicleNumber(order.vehicleNumber || '');
      setDriverName(order.driverName || '');
      setDriverMobile(order.driverMobile || '');
      setDispatchDateTime(order.dispatchDateTime || new Date().toISOString().slice(0, 16));
      setExpectedDeliveryDate(order.expectedDeliveryDate || '');
      setDispatchStatus(order.dispatchStatus || 'In Transit');
      setRemarks(order.dispatchRemarks || '');
    } else {
      setTransporterName(order.transporterName || defaultTransporter);
      setTransportMode('Surface Transport');
      setLrAwbNumber(`LR-${Math.floor(100000 + Math.random() * 900000)}`);
      setLrDate(new Date().toISOString().split('T')[0]);
      setVehicleNumber('DL-01-AB-4567');
      setDriverName('Manoj Kumar');
      setDriverMobile('9876543210');
      setDispatchDateTime(new Date().toISOString().slice(0, 16));
      setExpectedDeliveryDate(order.expectedDeliveryDate || '');
      setDispatchStatus('In Transit');
      setRemarks('Consignment handed over to carrier with LR and Tax Invoice copies.');
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
      transporterName,
      transportMode,
      lrAwbNumber,
      lrDate,
      vehicleNumber,
      driverName,
      driverMobile,
      dispatchDateTime,
      expectedDeliveryDate,
      dispatchStatus,
      dispatchRemarks: remarks,
      nextStage: 'Delivered',
      status: 'In Transit',
    };

    advanceOrderStage(modalOrder.id, payload, `Dispatched via ${transporterName} (LR: ${lrAwbNumber})`);
    alert(`Order ${modalOrder.orderNumber} successfully dispatched! Moved to Delivery Tracking.`);

    handleCloseModal();
    navigate('/sales/delivered');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] uppercase tracking-wider border border-blue-200 dark:border-blue-800/80">
            Order To Delivery
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Dispatch</h1>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex space-x-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-xs'
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
                ? 'bg-blue-600 text-white shadow-xs'
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
            placeholder="Search Order #, Customer or LR #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-bold">Transit Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="Dispatched">Dispatched</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-1.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Pending Logistics Dispatch' : 'Dispatch & Transit History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Truck className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders pending dispatch handover' : 'No dispatch history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3">Carrier / Transporter</th>
                  <th className="py-2 px-3">LR / AWB Number</th>
                  <th className="py-2 px-3">Vehicle Number</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Dispatch Date</th>
                  {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const carrier = o.transporterName || 'Pending Assignment';
                  const lr = o.lrAwbNumber || '-';
                  const veh = o.vehicleNumber || '-';
                  const st = o.dispatchStatus || (activeTab === 'pending' ? 'Pending Dispatch' : 'In Transit');

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-blue-600 dark:text-blue-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{o.customerName}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{carrier}</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{lr}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-medium">{veh}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            st === 'In Transit'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                              : st === 'Dispatched'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {o.dispatchDateTime ? o.dispatchDateTime.split('T')[0] : (o.readyDateTime?.split(' ')[0] || o.orderDate)}
                      </td>
                      {activeTab === 'pending' ? (
                        <PlannedTd plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate}
                          actualDate={o.dispatchDateTime || o.lrDate || o.stageDetails?.['Dispatch']?.completedAt || o.updatedAt}
                        />
                      )}
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch Order</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(o, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View LR</span>
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

      {/* Dispatch Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Dispatch & LR Record (Read-Only)' : 'Logistics Dispatch Handover'}
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
                  <span className="text-slate-400 block font-bold">Destination</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                    {modalOrder.shippingAddress || modalOrder.city || 'Delhi NCR'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Boxes / Weight</span>
                  <span className="font-bold text-blue-600">
                    {modalOrder.packageCount || 1} Pkgs ({modalOrder.totalWeight || '5.0'} Kg)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Invoice Ref</span>
                  <span className="font-mono font-bold text-purple-600">{modalOrder.invoiceNo || `INV-${modalOrder.orderNumber}`}</span>
                </div>
              </div>

              {/* Carrier & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Transporter / Carrier Name *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {transporterName}
                    </div>
                  ) : (
                    <input
                      type="text"
                      list="transporter-options"
                      required
                      value={transporterName}
                      onChange={(e) => setTransporterName(e.target.value)}
                      placeholder="Select or enter transporter name..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  <datalist id="transporter-options">
                    {transporters.map((t, idx) => (
                      <option key={idx} value={t.name} />
                    ))}
                    <option value="VRL Logistics" />
                    <option value="TCI Express" />
                    <option value="Delhivery Surface" />
                    <option value="Blue Dart Express" />
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Transport Mode
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {transportMode}
                    </div>
                  ) : (
                    <select
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Surface Transport">Surface Transport (Truck / Fleet)</option>
                      <option value="Express Air Cargo">Express Air Cargo</option>
                      <option value="Direct Courier">Direct Courier</option>
                      <option value="Self Delivery">Company Self Delivery Van</option>
                    </select>
                  )}
                </div>
              </div>

              {/* LR Number & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    LR / AWB / Docket Number *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold text-blue-600">
                      {lrAwbNumber}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={lrAwbNumber}
                      onChange={(e) => setLrAwbNumber(e.target.value)}
                      placeholder="e.g. LR-9874521"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    LR / Bilty Date
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {lrDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={lrDate}
                      onChange={(e) => setLrDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* Vehicle & Driver Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Vehicle Number
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {vehicleNumber || 'N/A'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. DL-01-AB-4567"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Driver / Courier Person Name
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {driverName || 'N/A'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Driver Name"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Driver Mobile Number
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {driverMobile || 'N/A'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={driverMobile}
                      onChange={(e) => setDriverMobile(e.target.value)}
                      placeholder="Mobile No."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Dispatch Remarks & Handover Notes
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
                    placeholder="Enter dispatch notes, tracking link, or contact person details..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    <span>Confirm Dispatch & Start Tracking</span>
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
