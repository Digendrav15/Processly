import React, { useState, useMemo } from 'react';
import {
  PackageCheck,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  Boxes,
  MapPin,
  UserCheck,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { usePurchaseStorage } from '../../hooks/usePurchaseStorage';
import {
  PURCHASE_STORAGE_KEYS,
  advancePurchaseStage
} from '../../services/purchaseStorageService';
import { useNavigate } from 'react-router-dom';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function MaterialReceivingPage() {
  const navigate = useNavigate();
  const indents = usePurchaseStorage(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"Store Incharge"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalIndent, setModalIndent] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [receivingDate, setReceivingDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedQty, setReceivedQty] = useState(0);
  const [shortageQty, setShortageQty] = useState(0);
  const [unloadedAt, setUnloadedAt] = useState('Bay-1 Central Inward Dock');
  const [receivedBy, setReceivedBy] = useState(currentUser.name || 'Suresh Nair (Store Head)');
  const [remarks, setRemarks] = useState('');

  // 1. Pending Store Receiving
  const pendingIndents = useMemo(() => {
    return indents.filter((item) => {
      const isPending = item.currentStage === 'Material Receiving';
      if (!isPending) return false;

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

  // 2. History
  const historyIndents = useMemo(() => {
    return indents.filter((item) => {
      const hasHistory =
        !!item.unloadedAt ||
        !!item.receivedQuantity ||
        (item.stageDetails && !!item.stageDetails['Material Receiving']);

      if (!hasHistory) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.poNumber || '').toLowerCase().includes(q) ||
          (item.vendorName || '').toLowerCase().includes(q) ||
          (item.unloadedAt || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm]);

  const currentList = activeTab === 'pending' ? pendingIndents : historyIndents;

  const handleOpenAction = (indent, viewOnly = false) => {
    setModalIndent(indent);
    setIsViewOnly(viewOnly);

    const totalExpected = indent.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) || 10;

    if (viewOnly && indent.unloadedAt) {
      setReceivingDate(indent.receivingDate || new Date().toISOString().split('T')[0]);
      setReceivedQty(indent.receivedQuantity || totalExpected);
      setShortageQty(indent.shortageQuantity || 0);
      setUnloadedAt(indent.unloadedAt || 'Bay-1 Central Inward Dock');
      setReceivedBy(indent.receivedBy || 'Store Incharge');
      setRemarks(indent.receivingRemarks || '');
    } else {
      setReceivingDate(new Date().toISOString().split('T')[0]);
      setReceivedQty(totalExpected);
      setShortageQty(0);
      setUnloadedAt('Bay-1 Central Inward Dock');
      setReceivedBy(currentUser.name || 'Store Incharge');
      setRemarks('Consignment physically unloaded, verified with vendor packing list, no external damage observed.');
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
      receivingDate,
      receivedQuantity: parseFloat(receivedQty || 0),
      shortageQuantity: parseFloat(shortageQty || 0),
      unloadedAt,
      receivedBy,
      receivingRemarks: remarks,
      nextStage: 'Quality Check',
      status: 'QC Inspection Pending',
    };

    advancePurchaseStage(
      modalIndent.id,
      payload,
      `Unloaded ${receivedQty} units at ${unloadedAt} (Store Incharge: ${receivedBy})`
    );

    alert(`Material successfully received in store! Moving to Quality Check.`);
    handleCloseModal();
    navigate('/purchase/qc');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 px-3.5 py-2.5 rounded-xl text-white shadow-sm border border-teal-500/20">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-400 font-extrabold text-[10px] uppercase tracking-wider border border-teal-500/30">
            Procurement • Step 6
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Material Receiving</h1>
          <p className="text-[11px] text-slate-400">Physical dock unloading, box count reconciliation, and store bay staging for incoming material.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
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
            <span>Received History ({historyIndents.length})</span>
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
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Materials Arrived at Gate Awaiting Store Inward' : 'Material Receiving Inward History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
            <PackageCheck className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No incoming consignments waiting for unloading' : 'No inward history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">PO Number</th>
                  <th className="py-2 px-3">Vendor Name</th>
                  <th className="py-2 px-3">Gate Pass #</th>
                  <th className="py-2 px-3 text-center">Expected Qty</th>
                  <th className="py-2 px-3 text-center">Received Qty</th>
                  <th className="py-2 px-3 text-center">Storage Bay</th>
                  <th className="py-2 px-3 text-center">Inward Date</th>
                  {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((item) => {
                  const poNum = item.poNumber || `PO-Ref-${item.indentNumber}`;
                  const expQty = item.items?.reduce((acc, i) => acc + (parseFloat(i.quantity) || 0), 0) || 10;
                  const recQty = item.receivedQuantity !== undefined ? item.receivedQuantity : (activeTab === 'history' ? expQty : '-');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-teal-600 dark:text-teal-400">
                        {poNum}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{item.vendorName || 'Vendor'}</td>
                      <td className="py-1.5 px-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{item.gateEntryNo || 'N/A'}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{expQty}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-teal-600 dark:text-teal-400">{recQty}</td>
                      <td className="py-1.5 px-3 text-center font-medium text-slate-600 dark:text-slate-400">
                        {item.unloadedAt || (activeTab === 'pending' ? 'Pending Dock' : 'Bay-1')}
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {item.receivingDate || item.gateEntryDate || '-'}
                      </td>
                      {activeTab === 'pending' ? (
                        <PlannedTd plannedDate={item.requiredByDate || item.indentDate} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={item.requiredByDate || item.indentDate}
                          actualDate={item.receivingDate || item.stageDetails?.['Material Receiving']?.completedAt || item.updatedAt}
                        />
                      )}
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(item, false)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <PackageCheck className="w-3 h-3" />
                            <span>Receive Material</span>
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

      {/* Receiving Modal */}
      {modalIndent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Inward Receiving Record (Read-Only)' : 'Material Store Inward Unloading'}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Receiving Date *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {receivingDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      required
                      value={receivingDate}
                      onChange={(e) => setReceivingDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Quantity Received *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold text-teal-600">
                      {receivedQty}
                    </div>
                  ) : (
                    <input
                      type="number"
                      required
                      min="1"
                      value={receivedQty}
                      onChange={(e) => setReceivedQty(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Shortage / Damaged Qty
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {shortageQty}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={shortageQty}
                      onChange={(e) => setShortageQty(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Unloaded Storage Bay / Location *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {unloadedAt}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={unloadedAt}
                      onChange={(e) => setUnloadedAt(e.target.value)}
                      placeholder="e.g. Bay-1 Central Inward Dock"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Received By (Store Incharge)
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {receivedBy}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Store Unloading Remarks
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
                    placeholder="Enter box conditions, seal remarks, inward remarks..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20"
                  >
                    <span>Confirm Unloading & Move to QC</span>
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
