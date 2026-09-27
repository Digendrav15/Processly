import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { getSubscriptions, recordSubscriptionPayment } from '../../services/docSubStorageService';

export default function RecordPaymentModal({ isOpen, onClose, onSuccess, initialSub = null }) {
  const [subs, setSubs] = useState([]);
  const [formData, setFormData] = useState({
    subscriptionId: '',
    serviceName: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    paymentMode: 'Corporate Credit Card',
    transactionRef: '',
    periodCovered: '1 Month',
    paidBy: 'Administrator',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allSubs = getSubscriptions();
      setSubs(allSubs);

      if (initialSub) {
        setFormData({
          subscriptionId: initialSub.id,
          serviceName: initialSub.serviceName,
          amount: initialSub.amount || '',
          paymentDate: new Date().toISOString().split('T')[0],
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          paymentMode: initialSub.paymentMethod || 'Corporate Credit Card',
          transactionRef: '',
          periodCovered: initialSub.billingCycle || '1 Month',
          paidBy: 'Administrator',
          remarks: `Payment for ${initialSub.serviceName}`
        });
      } else {
        const first = allSubs[0];
        setFormData({
          subscriptionId: first ? first.id : '',
          serviceName: first ? first.serviceName : '',
          amount: first ? first.amount : '',
          paymentDate: new Date().toISOString().split('T')[0],
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          paymentMode: 'Corporate Credit Card',
          transactionRef: '',
          periodCovered: first ? first.billingCycle : '1 Month',
          paidBy: 'Administrator',
          remarks: ''
        });
      }
    }
  }, [isOpen, initialSub]);

  const handleSubChange = (e) => {
    const subId = e.target.value;
    const selected = subs.find((s) => s.id === subId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        subscriptionId: selected.id,
        serviceName: selected.serviceName,
        amount: selected.amount,
        periodCovered: selected.billingCycle,
        paymentMode: selected.paymentMethod || prev.paymentMode,
        remarks: `Payment for ${selected.serviceName}`
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subscriptionId: '',
        serviceName: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.serviceName || !formData.amount) {
      alert('Please fill in service and amount');
      return;
    }

    setIsSubmitting(true);
    try {
      recordSubscriptionPayment({
        subscriptionId: formData.subscriptionId,
        serviceName: formData.serviceName,
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate,
        invoiceNumber: formData.invoiceNumber,
        paymentMode: formData.paymentMode,
        transactionRef: formData.transactionRef,
        periodCovered: formData.periodCovered,
        paidBy: formData.paidBy,
        remarks: formData.remarks
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Subscription Payment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Capture settlement invoice & update renewal cycle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Select Subscription / Service *
            </label>
            <select
              value={formData.subscriptionId}
              onChange={handleSubChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">-- Choose Subscription --</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.serviceName} ({s.planName}) - ₹{Number(s.amount).toLocaleString('en-IN')}/{s.billingCycle}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Amount Paid (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Date *
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Invoice / Bill Number
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="INV-2026-001"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Payment Mode
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Corporate Credit Card">Corporate Credit Card</option>
                <option value="Auto-Debit Net Banking">Auto-Debit Net Banking</option>
                <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Bank Transfer</option>
                <option value="UPI / QR Code">UPI / QR Code</option>
                <option value="Corporate Cheque">Corporate Cheque</option>
                <option value="PayPal / Wire">PayPal / International Wire</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Transaction / UTR Ref
              </label>
              <input
                type="text"
                value={formData.transactionRef}
                onChange={(e) => setFormData({ ...formData, transactionRef: e.target.value })}
                placeholder="TXN-XXXX-XXXX"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Period Covered
              </label>
              <input
                type="text"
                value={formData.periodCovered}
                onChange={(e) => setFormData({ ...formData, periodCovered: e.target.value })}
                placeholder="e.g. 1 Month, 1 Year"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Remarks & Billing Notes
            </label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Renewal invoice settled via HDFC card ending 4022"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
