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
  Calendar,
  User,
  Phone,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { usePurchaseStorage } from '../../hooks/usePurchaseStorage';
import {
  PURCHASE_STORAGE_KEYS,
  advancePurchaseStage
} from '../../services/purchaseStorageService';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';

export function MaterialLiftingPage() {
  const navigate = useNavigate();
  const indents = usePurchaseStorage(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const transporters = useOTDStorage(STORAGE_KEYS.TRANSPORTERS, []);

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalIndent, setModalIndent] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [lrAwbNumber, setLrAwbNumber] = useState('');
  const [dispatchedQty, setDispatchedQty] = useState(1);
  const [remarks, setRemarks] = useState('');

  // 1. Pending
  const pendingIndents = useMemo(() => {
    return indents.filter((item) => {
      const isPending = item.currentStage === 'Material Lifting / Dispatch';
      if (!isPending) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.poNumber || '').toLowerCase().includes(q) ||
          (item.vendorName || '').toLowerCase().includes(q) ||
          (item.indentNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm]);

  // 2. History
  const historyIndents = useMemo(() => {
    return indents.filter((item) => {
      const hasHistory =
        !!item.lrAwbNumber ||
        !!item.dispatchDate ||
        (item.stageDetails && !!item.stageDetails['Material Lifting / Dispatch']);

      if (!hasHistory) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.poNumber || '').toLowerCase().includes(q) ||
          (item.vendorName || '').toLowerCase().includes(q) ||
          (item.lrAwbNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm]);

  const currentList = activeTab === 'pending' ? pendingIndents : historyIndents;

  const handleOpenAction = (indent, viewOnly = false) => {
    setModalIndent(indent);
    setIsViewOnly(viewOnly);

    const totalQty = indent.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) || 10;

    if (viewOnly && (indent.lrAwbNumber || indent.dispatchDate)) {
      setDispatchDate(indent.dispatchDate || new Date().toISOString().split('T')[0]);
      setTransporterName(indent.transporterName || 'VRL Logistics');
      setVehicleNumber(indent.vehicleNumber || 'DL-01-AB-1234');
      setDriverName(indent.driverName || 'Ramesh Kumar');
      setDriverMobile(indent.driverMobile || '9876543210');
      setLrAwbNumber(indent.lrAwbNumber || 'LR-12345');
      setDispatchedQty(indent.dispatchedQuantity || totalQty);
      setRemarks(indent.liftingRemarks || '');
    } else {
      setDispatchDate(new Date().toISOString().split('T')[0]);
      setTransporterName(transporters[0]?.name || 'VRL Logistics');
      setVehicleNumber('MH-12-DE-7788');
      setDriverName('Rajesh Yadav');
      setDriverMobile('9876543210');
      setLrAwbNumber(`LR-PUR-${Math.floor(100000 + Math.random() * 900000)}`);
      setDispatchedQty(totalQty);
      setRemarks('Material inspected and lifted from supplier plant into transport vehicle.');
    }
  };

  const handleCloseModal = () => {
    setModalIndent(null);
    setIsViewOnly(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalIndent) return;

    const payload = {
      dispatchDate,
      transporterName,
      vehicleNumber,
      driverName,
      driverMobile,
      lrAwbNumber,
      dispatchedQuantity: parseFloat(dispatchedQty || 0),
      liftingRemarks: remarks,
      nextStage: 'Material Delivery',
      status: 'In Transit',
    };

    advancePurchaseStage(
      modalIndent.id,
      payload,
      `Dispatched via ${transporterName} (LR: ${lrAwbNumber})`
    );

    alert(`Material Lifting logged for PO ${modalIndent.poNumber}! Moving to Material Delivery tracking.`);
    handleCloseModal();
    navigate('/purchase/delivery');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-900 px-3.5 py-2.5 rounded-xl text-white shadow-sm border border-cyan-500/20">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-500/30">
            Procurement • Step 4
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Material Lifting / Dispatch</h1>
          <p className="text-[11px] text-slate-400">Record supplier ex-works material lifting, dispatch logistics, and bilty / LR consignment numbers.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingIndents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historyIndents.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO #, Vendor, LR #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Purchase Orders Pending Material Lifting' : 'Lifting & Dispatch History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
            <Truck className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No purchase orders awaiting dispatch lifting' : 'No lifting records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">PO Number</th>
                  <th className="py-2 px-3">Vendor Name</th>
                  <th className="py-2 px-3">Carrier / Transporter</th>
                  <th className="py-2 px-3">Vehicle Number</th>
                  <th className="py-2 px-3">LR / Bilty #</th>
                  <th className="py-2 px-3 text-center">Dispatch Date</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((item) => {
                  const poNum = item.poNumber || `PO-Ref-${item.indentNumber}`;
                  const vName = item.vendorName || item.preferredVendor || 'Vendor';
                  const carrier = item.transporterName || 'Pending Assignment';
                  const lr = item.lrAwbNumber || '-';
                  const st = item.status || (activeTab === 'pending' ? 'Awaiting Lifting' : 'In Transit');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-cyan-600 dark:text-cyan-400">
                        {poNum}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{vName}</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 font-medium">{carrier}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400">{item.vehicleNumber || '-'}</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-blue-600">{lr}</td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">{item.dispatchDate || item.poDate || '-'}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(item, false)}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Log Lifting</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(item, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
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

      {/* Lifting Modal */}
      {modalIndent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Lifting Record (Read-Only)' : 'Log Material Lifting & Dispatch'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  PO: {modalIndent.poNumber} - {modalIndent.vendorName}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Dispatch / Lifting Date *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {dispatchDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      required
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Transporter Name *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {transporterName}
                    </div>
                  ) : (
                    <input
                      type="text"
                      list="transporter-list"
                      required
                      value={transporterName}
                      onChange={(e) => setTransporterName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                  <datalist id="transporter-list">
                    {transporters.map((t, i) => (
                      <option key={i} value={t.name} />
                    ))}
                    <option value="VRL Logistics" />
                    <option value="TCI Freight" />
                    <option value="Delhivery Surface" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Vehicle Number *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold">
                      {vehicleNumber}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. MH-12-DE-7788"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    LR / Bilty / Docket Number *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold text-blue-600">
                      {lrAwbNumber}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. LR-998822"
                      value={lrAwbNumber}
                      onChange={(e) => setLrAwbNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Driver Name
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {driverName}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Driver Mobile Number
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {driverMobile}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={driverMobile}
                      onChange={(e) => setDriverMobile(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Lifting / Dispatch Remarks
                </label>
                {isViewOnly ? (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium">
                    {remarks || 'None'}
                  </div>
                ) : (
                  <textarea
                    rows="2"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter notes on packaging condition, weight slip or vehicle seal..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                )}
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                {!isViewOnly && (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <span>Confirm Lifting & Advance to Delivery</span>
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
