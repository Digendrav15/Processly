import React, { useState, useMemo } from 'react';
import {
  Navigation,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Building2
} from 'lucide-react';
import { usePurchaseStorage } from '../../hooks/usePurchaseStorage';
import {
  PURCHASE_STORAGE_KEYS,
  advancePurchaseStage
} from '../../services/purchaseStorageService';
import { useNavigate } from 'react-router-dom';

export function MaterialDeliveryPage() {
  const navigate = useNavigate();
  const indents = usePurchaseStorage(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"Gate Security"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalIndent, setModalIndent] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [gateEntryNo, setGateEntryNo] = useState('');
  const [gateEntryDate, setGateEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [gateEntryTime, setGateEntryTime] = useState(new Date().toTimeString().slice(0, 5));
  const [gateIncharge, setGateIncharge] = useState(currentUser.name || 'Security Gate Officer');
  const [deliveryStatus, setDeliveryStatus] = useState('Arrived at Gate');
  const [remarks, setRemarks] = useState('');

  // 1. Pending Delivery / Gate Inward
  const pendingIndents = useMemo(() => {
    return indents.filter((item) => {
      const isPending = item.currentStage === 'Material Delivery';
      if (!isPending) return false;

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

  // 2. History
  const historyIndents = useMemo(() => {
    return indents.filter((item) => {
      const hasHistory =
        !!item.gateEntryNo ||
        (item.stageDetails && !!item.stageDetails['Material Delivery']);

      if (!hasHistory) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.poNumber || '').toLowerCase().includes(q) ||
          (item.vendorName || '').toLowerCase().includes(q) ||
          (item.gateEntryNo || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm]);

  const currentList = activeTab === 'pending' ? pendingIndents : historyIndents;

  const handleOpenAction = (indent, viewOnly = false) => {
    setModalIndent(indent);
    setIsViewOnly(viewOnly);

    if (viewOnly && indent.gateEntryNo) {
      setGateEntryNo(indent.gateEntryNo);
      setGateEntryDate(indent.gateEntryDate || new Date().toISOString().split('T')[0]);
      setGateEntryTime(indent.gateEntryTime || '10:00');
      setGateIncharge(indent.gateIncharge || 'Security Officer');
      setDeliveryStatus(indent.deliveryStatus || 'Arrived at Gate');
      setRemarks(indent.gateRemarks || '');
    } else {
      setGateEntryNo(`GATE-2026-${Math.floor(100 + Math.random() * 900)}`);
      setGateEntryDate(new Date().toISOString().split('T')[0]);
      setGateEntryTime(new Date().toTimeString().slice(0, 5));
      setGateIncharge(currentUser.name || 'Security Gate Officer');
      setDeliveryStatus('Arrived at Gate');
      setRemarks('Vehicle arrived at main factory gate. Physical documents & driver ID verified.');
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
      gateEntryNo,
      gateEntryDate,
      gateEntryTime,
      gateIncharge,
      deliveryStatus,
      gateRemarks: remarks,
      nextStage: 'Material Receiving',
      status: 'Awaiting Unloading',
    };

    advancePurchaseStage(
      modalIndent.id,
      payload,
      `Material arrived at gate (Gate Pass #${gateEntryNo})`
    );

    alert(`Gate entry logged for PO ${modalIndent.poNumber}! Moving to Store Material Receiving.`);
    handleCloseModal();
    navigate('/purchase/receiving');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 px-3.5 py-2.5 rounded-xl text-white shadow-sm border border-purple-500/20">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-extrabold text-[10px] uppercase tracking-wider border border-purple-500/30">
            Procurement • Step 5
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Material Delivery</h1>
          <p className="text-[11px] text-slate-400">Track in-transit consignments, record factory security gate inward arrivals, and issue gate passes.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>In-Transit ({pendingIndents.length})</span>
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
            <span>Arrived History ({historyIndents.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO #, Vendor, Gate Pass #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'In-Transit Consignments Awaiting Gate Arrival' : 'Gate Delivery Records'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
            <Navigation className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No consignments currently in transit' : 'No arrival records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">PO Number</th>
                  <th className="py-2 px-3">Vendor Name</th>
                  <th className="py-2 px-3">Carrier / LR #</th>
                  <th className="py-2 px-3">Vehicle Number</th>
                  <th className="py-2 px-3">Gate Pass #</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-center">Arrival Date</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((item) => {
                  const poNum = item.poNumber || `PO-Ref-${item.indentNumber}`;
                  const vName = item.vendorName || item.preferredVendor || 'Vendor';
                  const lr = item.lrAwbNumber || '-';
                  const gate = item.gateEntryNo || '-';
                  const st = item.deliveryStatus || (activeTab === 'pending' ? 'In Transit' : 'Arrived at Gate');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-purple-600 dark:text-purple-400">
                        {poNum}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{vName}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400">{lr}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400">{item.vehicleNumber || '-'}</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-indigo-600">{gate}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            st === 'Arrived at Gate'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {item.gateEntryDate || item.dispatchDate || '-'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(item, false)}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Log Gate Entry</span>
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

      {/* Gate Entry Modal */}
      {modalIndent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Security Gate Inward Record (Read-Only)' : 'Security Gate Inward Registration'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  PO: {modalIndent.poNumber} ({modalIndent.vendorName})
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
                    Gate Entry Number *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold text-purple-600">
                      {gateEntryNo}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={gateEntryNo}
                      onChange={(e) => setGateEntryNo(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>

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
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Arrived at Gate">Arrived at Gate (Verified)</option>
                      <option value="Delayed in Transit">Delayed in Transit</option>
                      <option value="Diverted / Redirected">Diverted / Redirected</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Gate Inward Date
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {gateEntryDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      required
                      value={gateEntryDate}
                      onChange={(e) => setGateEntryDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Arrival Time
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {gateEntryTime}
                    </div>
                  ) : (
                    <input
                      type="time"
                      required
                      value={gateEntryTime}
                      onChange={(e) => setGateEntryTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Gate Officer / Security Personnel
                </label>
                {isViewOnly ? (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                    {gateIncharge}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={gateIncharge}
                    onChange={(e) => setGateIncharge(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Gate Security Remarks
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
                    placeholder="Enter seal status, driver identity verification..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-purple-500/20"
                  >
                    <span>Authorize Entry & Move to Receiving</span>
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
