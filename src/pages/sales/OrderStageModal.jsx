import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, FileText, ArrowRight, ShieldCheck, DollarSign, PackageCheck, Truck, Clock, X, UserCheck, Image, ShieldAlert } from 'lucide-react';
import { advanceOrderStage, calculatePlannedDate, getTATConfigForStage, STORAGE_KEYS } from '../../services/otdStorageService';
import { useOTDStorage } from '../../hooks/useOTDStorage';

export function OrderStageModal({ order, isOpen, onClose, onSuccess }) {
  const transporters = useOTDStorage(STORAGE_KEYS.TRANSPORTERS, []);
  const [remarks, setRemarks] = useState('');
  const [stageFormData, setStageFormData] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !order) return null;

  const currentStage = order.currentStage || 'New Order';
  const systemName = order.systemName || 'Order To Delivery';
  const tatConfig = getTATConfigForStage(systemName, currentStage);

  // Auto calculate planned date for custom stage inputs if start date changes
  const autoPlannedDate = tatConfig
    ? calculatePlannedDate(new Date().toISOString(), tatConfig.tatValue, tatConfig.tatUnit)
    : null;

  const handleAdvance = (overrideStatus = null, closeOrderFlag = false) => {
    setErrorMsg('');
    try {
      const stagePayload = {
        ...stageFormData,
        status: overrideStatus || stageFormData.status || 'Completed',
        remarks: remarks || stageFormData.remarks || 'Stage completed',
        closeOrder: closeOrderFlag
      };

      const updated = advanceOrderStage(order.id, stagePayload, remarks);
      if (updated) {
        if (onSuccess) onSuccess(updated);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update stage');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                {order.orderNumber}
              </span>
              <span className="text-xs text-slate-400">• {order.customerName}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              Current Stage: <span className="text-indigo-600 dark:text-indigo-400">{currentStage}</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAT Information Banner */}
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Active TAT: {tatConfig ? `${tatConfig.tatValue} ${tatConfig.tatUnit}` : 'Not Configured'}
              </p>
              <p className="text-slate-400 text-[11px]">
                Target Completion: {order.plannedCompletionDate ? new Date(order.plannedCompletionDate).toLocaleString() : (autoPlannedDate ? new Date(autoPlannedDate).toLocaleString() : 'N/A')}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
            Auto TAT Enabled
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dynamic Form Sections based on Stage Name */}
        <div className="space-y-4 text-xs">
          {/* 1. VERIFICATION STAGE */}
          {currentStage.toLowerCase().includes('verif') && !currentStage.toLowerCase().includes('payment verif') && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white">Order Verification Checkpoints</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                {['Customer Details', 'Product Specs', 'Quantity & Rate', 'Tax / GST', 'Billing & Shipping Address', 'Delivery Date', 'Payment Terms'].map((item, idx) => (
                  <label key={idx} className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <input
                      type="checkbox"
                      defaultChecked
                      onChange={(e) => setStageFormData({ ...stageFormData, [item]: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>{item} Verified</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 2. APPROVAL STAGE */}
          {currentStage.toLowerCase().includes('approval') && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white">Management Approval</h4>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Approval Decision</label>
                <select
                  onChange={(e) => setStageFormData({ ...stageFormData, approvalStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Approved">Approved</option>
                  <option value="Hold">Hold</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          )}

          {/* 3. PAYMENT / ADVANCE STAGE */}
          {(currentStage.toLowerCase().includes('payment / advance') || currentStage.toLowerCase().includes('payment collection')) && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white">Payment Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Total Order Amount (₹)</label>
                  <input
                    type="number"
                    disabled
                    value={order.grandTotal || 0}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment / Advance Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    onChange={(e) => {
                      const paid = parseFloat(e.target.value) || 0;
                      const pending = (order.grandTotal || 0) - paid;
                      setStageFormData({ ...stageFormData, paidAmount: paid, pendingAmount: pending });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                  <select
                    onChange={(e) => setStageFormData({ ...stageFormData, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Txn / Ref Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN987654321"
                    onChange={(e) => setStageFormData({ ...stageFormData, txnNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. STOCK CHECK STAGE */}
          {currentStage.toLowerCase().includes('stock') && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white">Stock Availability Verification</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Required Qty</label>
                  <input
                    type="number"
                    value={order.totalQty || 100}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Available Stock Qty</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    onChange={(e) => {
                      const avail = parseFloat(e.target.value) || 0;
                      const req = order.totalQty || 100;
                      const short = Math.max(0, req - avail);
                      setStageFormData({ ...stageFormData, availableQty: avail, shortQty: short, stockStatus: short === 0 ? 'In Stock' : 'Partial / Out of Stock' });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Short Qty</label>
                  <input
                    type="number"
                    disabled
                    value={stageFormData.shortQty ?? 0}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-rose-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. QUALITY CHECK STAGE */}
          {currentStage.toLowerCase().includes('quality') || currentStage.toLowerCase().includes('qc') ? (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white">Quality Inspection (QC)</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Checked Qty</label>
                  <input
                    type="number"
                    placeholder="Total Checked"
                    onChange={(e) => setStageFormData({ ...stageFormData, checkedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Passed Qty</label>
                  <input
                    type="number"
                    placeholder="Passed Qty"
                    onChange={(e) => setStageFormData({ ...stageFormData, passedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-emerald-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Failed / Rejected Qty</label>
                  <input
                    type="number"
                    placeholder="Failed Qty"
                    onChange={(e) => setStageFormData({ ...stageFormData, failedQty: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-rose-600 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Defect Details / Observations</label>
                <input
                  type="text"
                  placeholder="Notes on defect or quality observations..."
                  onChange={(e) => setStageFormData({ ...stageFormData, defectDetails: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          ) : null}

          {/* 6. DISPATCH STAGE */}
          {currentStage.toLowerCase().includes('dispatch') && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white">Dispatch & Courier Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transport / Courier Name *</label>
                  {transporters.length > 0 ? (
                    <select
                      onChange={(e) => setStageFormData({ ...stageFormData, courier: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    >
                      <option value="">-- Select Transporter --</option>
                      {transporters.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. VRL Logistics / BlueDart"
                      onChange={(e) => setStageFormData({ ...stageFormData, courier: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">LR / AWB Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AWB9876123"
                    onChange={(e) => setStageFormData({ ...stageFormData, lrNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MH 12 AB 1234"
                    onChange={(e) => setStageFormData({ ...stageFormData, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Driver Name & Mobile</label>
                  <input
                    type="text"
                    placeholder="Driver details"
                    onChange={(e) => setStageFormData({ ...stageFormData, driverDetails: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. DELIVERED STAGE */}
          {currentStage.toLowerCase().includes('deliver') && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white">Delivery Proof & Confirmation</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Received By (Name)</label>
                  <input
                    type="text"
                    placeholder="Receiver Name"
                    onChange={(e) => setStageFormData({ ...stageFormData, receivedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Receiver Mobile</label>
                  <input
                    type="tel"
                    placeholder="Mobile number"
                    onChange={(e) => setStageFormData({ ...stageFormData, receiverMobile: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Common Stage Remarks Input */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Stage Action Remarks *</label>
            <textarea
              rows={2}
              required
              placeholder="Provide completion remarks or status notes for history audit..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleAdvance('On Hold')}
              className="px-3 py-2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold rounded-xl hover:bg-amber-200 transition-colors"
            >
              Hold Stage
            </button>
            <button
              type="button"
              onClick={() => handleAdvance('Send Back')}
              className="px-3 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Send Back
            </button>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAdvance('Completed', currentStage === 'Order Closed')}
              className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
            >
              <span>Complete & Move Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
