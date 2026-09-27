import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { usePurchaseStorage } from '../../hooks/usePurchaseStorage';
import {
  PURCHASE_STORAGE_KEYS,
  advancePurchaseStage
} from '../../services/purchaseStorageService';
import { useNavigate } from 'react-router-dom';

export function PurchaseQCPage() {
  const navigate = useNavigate();
  const indents = usePurchaseStorage(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"QC Engineer"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalIndent, setModalIndent] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form Fields
  const [inspectedQty, setInspectedQty] = useState(0);
  const [acceptedQty, setAcceptedQty] = useState(0);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [qcStatus, setQcStatus] = useState('Passed');
  const [inspectorName, setInspectorName] = useState(currentUser.name || 'Digendra QC Specialist');
  const [qcDate, setQcDate] = useState(new Date().toISOString().split('T')[0]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [remarks, setRemarks] = useState('');

  // 1. Pending QC
  const pendingIndents = useMemo(() => {
    return indents.filter((item) => {
      const isPending = item.currentStage === 'Quality Check';
      if (!isPending) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.poNumber || '').toLowerCase().includes(q) ||
          (item.vendorName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm]);

  // 2. History QC
  const historyIndents = useMemo(() => {
    return indents.filter((item) => {
      const hasHistory =
        !!item.qcStatus ||
        (item.stageDetails && !!item.stageDetails['Quality Check']);

      if (!hasHistory) return false;

      if (statusFilter !== 'ALL' && item.qcStatus !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.poNumber || '').toLowerCase().includes(q) ||
          (item.vendorName || '').toLowerCase().includes(q) ||
          (item.qcInspector || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm, statusFilter]);

  const currentList = activeTab === 'pending' ? pendingIndents : historyIndents;

  const handleOpenAction = (indent, viewOnly = false) => {
    setModalIndent(indent);
    setIsViewOnly(viewOnly);

    const rec = parseFloat(indent.receivedQuantity || indent.items?.[0]?.quantity || 10);

    if (viewOnly && indent.qcStatus) {
      setInspectedQty(indent.inspectedQuantity || rec);
      setAcceptedQty(indent.acceptedQuantity || rec);
      setRejectedQty(indent.rejectedQuantity || 0);
      setQcStatus(indent.qcStatus || 'Passed');
      setInspectorName(indent.qcInspector || 'QC Engineer');
      setQcDate(indent.qcDate || new Date().toISOString().split('T')[0]);
      setRejectionReason(indent.rejectionReason || '');
      setRemarks(indent.qcRemarks || '');
    } else {
      setInspectedQty(rec);
      setAcceptedQty(rec);
      setRejectedQty(0);
      setQcStatus('Passed');
      setInspectorName(currentUser.name || 'Digendra QC Specialist');
      setQcDate(new Date().toISOString().split('T')[0]);
      setRejectionReason('');
      setRemarks('Material tested against chemical/physical grade tolerances. 100% compliant.');
    }
  };

  const handleCloseModal = () => {
    setModalIndent(null);
    setIsViewOnly(false);
  };

  const handleAcceptedChange = (val) => {
    const acc = Math.max(0, parseFloat(val || 0));
    setAcceptedQty(acc);
    const rej = Math.max(0, parseFloat(inspectedQty || 0) - acc);
    setRejectedQty(rej);
    if (rej > 0 && qcStatus === 'Passed') {
      setQcStatus('Conditional Pass');
    } else if (rej === 0) {
      setQcStatus('Passed');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalIndent) return;

    const isFailed = qcStatus === 'Rejected';
    const payload = {
      inspectedQuantity: parseFloat(inspectedQty || 0),
      acceptedQuantity: parseFloat(acceptedQty || 0),
      rejectedQuantity: parseFloat(rejectedQty || 0),
      qcStatus,
      qcInspector: inspectorName,
      qcDate,
      rejectionReason: rejectedQty > 0 ? rejectionReason : '',
      qcRemarks: remarks,
      nextStage: isFailed ? 'Quality Check' : 'GRN',
      status: isFailed ? 'QC Rejected' : 'GRN Pending',
    };

    advancePurchaseStage(
      modalIndent.id,
      payload,
      `QC inspection result: ${qcStatus} (Accepted: ${acceptedQty}, Rejected: ${rejectedQty})`
    );

    alert(`Quality inspection report logged for PO ${modalIndent.poNumber}! Moving to GRN generation.`);
    handleCloseModal();
    if (!isFailed) {
      navigate('/purchase/grn');
    }
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 px-3.5 py-2.5 rounded-xl text-white shadow-sm border border-emerald-500/20">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/30">
            Procurement • Step 7
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Quality Check</h1>
          <p className="text-[11px] text-slate-400">Conduct inspections, approve good material, and record rejections.</p>
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
            <span>QC History ({historyIndents.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO #, Vendor, Inspector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-[11px] text-slate-500 font-bold">QC Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Passed">Passed</option>
              <option value="Conditional Pass">Conditional Pass</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Received Materials Pending QC Inspection' : 'QC Inspection History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No materials awaiting technical QC inspection' : 'No QC records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">PO Number</th>
                  <th className="py-2 px-3">Vendor Name</th>
                  <th className="py-2 px-3 text-center">Inspected</th>
                  <th className="py-2 px-3 text-center">Accepted</th>
                  <th className="py-2 px-3 text-center">Rejected</th>
                  <th className="py-2 px-3 text-center">QC Status</th>
                  <th className="py-2 px-3 text-center">Inspector</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((item) => {
                  const poNum = item.poNumber || `PO-Ref-${item.indentNumber}`;
                  const insp = item.inspectedQuantity || item.receivedQuantity || 10;
                  const acc = item.acceptedQuantity !== undefined ? item.acceptedQuantity : (activeTab === 'history' ? insp : '-');
                  const rej = item.rejectedQuantity || 0;
                  const st = item.qcStatus || (activeTab === 'pending' ? 'Inspection Pending' : 'Passed');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {poNum}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{item.vendorName || 'Vendor'}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">{insp}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{acc}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-rose-600 dark:text-rose-400">{rej}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            st === 'Passed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : st === 'Conditional Pass'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : st === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {item.qcInspector || 'Inspector'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(item, false)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Perform QC</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(item, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View QC</span>
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
      {modalIndent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'QC Certificate & Report (Read-Only)' : 'Perform Quality Assurance Testing'}
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
                    Inspected Quantity *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {inspectedQty}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      required
                      value={inspectedQty}
                      onChange={(e) => setInspectedQty(Math.max(1, parseFloat(e.target.value || 0)))}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Accepted Quantity *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-600">
                      {acceptedQty}
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max={inspectedQty}
                      required
                      value={acceptedQty}
                      onChange={(e) => handleAcceptedChange(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Rejected Quantity
                  </label>
                  <div className={`p-2.5 border rounded-xl text-xs font-bold ${rejectedQty > 0 ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-400 bg-slate-50'}`}>
                    {rejectedQty}
                  </div>
                </div>
              </div>

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
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Passed">Passed (100% Acceptable)</option>
                      <option value="Conditional Pass">Conditional Pass (Slight deviation)</option>
                      <option value="Rejected">Rejected (Return to Vendor)</option>
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
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              {rejectedQty > 0 && (
                <div>
                  <label className="text-xs font-bold text-rose-600 block mb-1">
                    Rejection / Defect Details *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800">
                      {rejectionReason || 'None'}
                    </div>
                  ) : (
                    <textarea
                      rows="2"
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specify rejection reason (e.g. chemical test deviation, scratches, size off)..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  QC Testing Remarks & Observations
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
                    placeholder="Enter test parameters, lab reports or inspection certificates..."
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
                    <span>Approve QC & Move to GRN</span>
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
