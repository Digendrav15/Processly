import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  Boxes,
  FileCheck,
  CheckCircle2,
  Package
} from 'lucide-react';
import { usePurchaseStorage } from '../../hooks/usePurchaseStorage';
import {
  PURCHASE_STORAGE_KEYS,
  advancePurchaseStage,
  generateGRNNumber
} from '../../services/purchaseStorageService';
import { useNavigate } from 'react-router-dom';

export function GRNPage() {
  const navigate = useNavigate();
  const indents = usePurchaseStorage(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"Store Manager"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalIndent, setModalIndent] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [grnNumber, setGrnNumber] = useState('');
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split('T')[0]);
  const [acceptedQty, setAcceptedQty] = useState(0);
  const [binLocation, setBinLocation] = useState('Rack R-02 (Bin 14)');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('');
  const [storeIncharge, setStoreIncharge] = useState(currentUser.name || 'Store Head');
  const [stockLedgerUpdated, setStockLedgerUpdated] = useState(true);
  const [remarks, setRemarks] = useState('');

  // 1. Pending GRN
  const pendingIndents = useMemo(() => {
    return indents.filter((item) => {
      const isPending = item.currentStage === 'GRN';
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

  // 2. History GRN
  const historyIndents = useMemo(() => {
    return indents.filter((item) => {
      const hasHistory =
        !!item.grnNumber ||
        (item.stageDetails && !!item.stageDetails['GRN']);

      if (!hasHistory) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.grnNumber || '').toLowerCase().includes(q) ||
          (item.poNumber || '').toLowerCase().includes(q) ||
          (item.vendorName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm]);

  const currentList = activeTab === 'pending' ? pendingIndents : historyIndents;

  const handleOpenAction = (indent, viewOnly = false) => {
    setModalIndent(indent);
    setIsViewOnly(viewOnly);

    const acc = indent.acceptedQuantity || indent.receivedQuantity || 10;

    if (viewOnly && indent.grnNumber) {
      setGrnNumber(indent.grnNumber);
      setGrnDate(indent.grnDate || new Date().toISOString().split('T')[0]);
      setAcceptedQty(indent.acceptedQuantity || acc);
      setBinLocation(indent.binLocation || 'Rack R-02');
      setVendorInvoiceNo(indent.vendorInvoiceNo || indent.vendorBillNumber || `INV-${indent.poNumber}`);
      setStoreIncharge(indent.storeIncharge || 'Store Manager');
      setStockLedgerUpdated(indent.stockLedgerUpdated !== false);
      setRemarks(indent.grnRemarks || '');
    } else {
      setGrnNumber(generateGRNNumber());
      setGrnDate(new Date().toISOString().split('T')[0]);
      setAcceptedQty(acc);
      setBinLocation('Rack R-02 (Bin 14)');
      setVendorInvoiceNo(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
      setStoreIncharge(currentUser.name || 'Store Head');
      setStockLedgerUpdated(true);
      setRemarks('GRN generated. Stock ledger credited and material binned in inventory.');
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
      grnNumber,
      grnDate,
      acceptedQuantity: parseFloat(acceptedQty || 0),
      binLocation,
      vendorInvoiceNo,
      storeIncharge,
      stockLedgerUpdated,
      grnRemarks: remarks,
      nextStage: 'Payment',
      status: 'Payment Pending',
    };

    advancePurchaseStage(
      modalIndent.id,
      payload,
      `GRN ${grnNumber} generated for PO ${modalIndent.poNumber} (Location: ${binLocation})`
    );

    alert(`Goods Receipt Note ${grnNumber} posted! Moving to Accounts Payment.`);
    handleCloseModal();
    navigate('/purchase/payment');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 px-3.5 py-2.5 rounded-xl text-white shadow-sm border border-emerald-500/20">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
            Procurement • Step 8
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">GRN (Goods Receipt Note)</h1>
          <p className="text-[11px] text-slate-400">Official inventory inward booking, stock ledger posting, and warehouse bin allocation.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
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
            <span>GRN History ({historyIndents.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search GRN #, PO #, Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'QC Passed Materials Pending GRN Generation' : 'Posted Goods Receipt Notes'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
            <Receipt className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No materials awaiting GRN creation' : 'No GRN history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">GRN Number</th>
                  <th className="py-2 px-3">PO Number</th>
                  <th className="py-2 px-3">Vendor Name</th>
                  <th className="py-2 px-3 text-center">Accepted Qty</th>
                  <th className="py-2 px-3 text-center">Bin Location</th>
                  <th className="py-2 px-3 text-center">GRN Date</th>
                  <th className="py-2 px-3 text-center">Store Incharge</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((item) => {
                  const grn = item.grnNumber || 'GRN Pending';
                  const poNum = item.poNumber || `PO-Ref-${item.indentNumber}`;
                  const acc = item.acceptedQuantity || item.receivedQuantity || 10;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {grn}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-slate-600 dark:text-slate-400 font-semibold">{poNum}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{item.vendorName || 'Vendor'}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{acc}</td>
                      <td className="py-1.5 px-3 text-center font-medium text-slate-600 dark:text-slate-400">
                        {item.binLocation || (activeTab === 'pending' ? 'Pending Bay' : 'Rack R-02')}
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {item.grnDate || item.qcDate || '-'}
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {item.storeIncharge || 'Store Head'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(item, false)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Generate GRN</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(item, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View GRN</span>
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

      {/* GRN Modal */}
      {modalIndent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Goods Receipt Note Dossier (Read-Only)' : 'Goods Receipt Note Generation'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  GRN: {grnNumber} (PO: {modalIndent.poNumber})
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
                    GRN Number *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold text-emerald-600">
                      {grnNumber}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={grnNumber}
                      onChange={(e) => setGrnNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    GRN Date *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {grnDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      required
                      value={grnDate}
                      onChange={(e) => setGrnDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Accepted Stock-In Quantity
                  </label>
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-600">
                    {acceptedQty} Units (QC Verified)
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Warehouse Bin / Rack Location *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {binLocation}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={binLocation}
                      onChange={(e) => setBinLocation(e.target.value)}
                      placeholder="e.g. Rack R-02 (Bin 14)"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Vendor Invoice / Bill Number *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold">
                      {vendorInvoiceNo}
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={vendorInvoiceNo}
                      onChange={(e) => setVendorInvoiceNo(e.target.value)}
                      placeholder="Vendor Tax Invoice No."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Store Manager / Incharge
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {storeIncharge}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={storeIncharge}
                      onChange={(e) => setStoreIncharge(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-xl flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="stock-ledger-chk"
                  disabled={isViewOnly}
                  checked={stockLedgerUpdated}
                  onChange={(e) => setStockLedgerUpdated(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="stock-ledger-chk" className="text-xs font-bold text-emerald-900 dark:text-emerald-300 cursor-pointer">
                  Auto-Credit Inventory Stock Ledger & Update Available Stock Quantity
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  GRN Remarks
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
                    placeholder="Enter store inward confirmation notes..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <span>Post GRN & Advance to Payment</span>
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
