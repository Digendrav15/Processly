import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { SUBSCRIPTION_CATEGORIES, BILLING_CYCLES, DEPARTMENTS, saveSubscription } from '../../services/docSubStorageService';
import {
  Repeat,
  Calendar,
  Building2,
  DollarSign,
  User,
  Globe,
  AlertCircle,
  CreditCard,
  CheckCircle2
} from 'lucide-react';

export function AddSubscriptionModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    serviceName: initialData?.serviceName || '',
    category: initialData?.category || SUBSCRIPTION_CATEGORIES[0],
    provider: initialData?.provider || '',
    planName: initialData?.planName || '',
    billingCycle: initialData?.billingCycle || 'Monthly',
    amount: initialData?.amount || '',
    currency: initialData?.currency || 'INR',
    nextRenewalDate: initialData?.nextRenewalDate || new Date().toISOString().split('T')[0],
    nextPaymentDueDate: initialData?.nextPaymentDueDate || new Date().toISOString().split('T')[0],
    paymentStatus: initialData?.paymentStatus || 'Payment Due',
    autoRenew: initialData?.autoRenew !== undefined ? initialData.autoRenew : true,
    paymentMethod: initialData?.paymentMethod || 'Corporate Credit Card',
    assignedDepartment: initialData?.assignedDepartment || DEPARTMENTS[0],
    owner: initialData?.owner || 'Administrator',
    loginUrl: initialData?.loginUrl || '',
    seatsCount: initialData?.seatsCount || 1,
    status: initialData?.status || 'Active',
    description: initialData?.description || ''
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.serviceName.trim()) {
      setError('Please provide the SaaS / Service Name.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid subscription cost / amount.');
      return;
    }
    if (!formData.nextRenewalDate) {
      setError('Please select the next renewal date.');
      return;
    }

    saveSubscription({
      ...(initialData?.id ? { id: initialData.id } : {}),
      serviceName: formData.serviceName.trim(),
      category: formData.category,
      provider: formData.provider.trim(),
      planName: formData.planName.trim() || 'Standard Tier',
      billingCycle: formData.billingCycle,
      amount: Number(formData.amount),
      currency: formData.currency,
      nextRenewalDate: formData.nextRenewalDate,
      nextPaymentDueDate: formData.nextPaymentDueDate || formData.nextRenewalDate,
      paymentStatus: formData.paymentStatus,
      autoRenew: formData.autoRenew,
      paymentMethod: formData.paymentMethod,
      assignedDepartment: formData.assignedDepartment,
      owner: formData.owner.trim(),
      loginUrl: formData.loginUrl.trim(),
      seatsCount: Number(formData.seatsCount) || 1,
      status: formData.status,
      description: formData.description.trim()
    });

    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Subscription Details" : "Add SaaS / Tool Subscription"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Software / Service Name *
            </label>
            <div className="relative">
              <Repeat className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Google Workspace, AWS Cloud, GitHub Enterprise, Zoom"
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              {SUBSCRIPTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Vendor / Provider Name
            </label>
            <input
              type="text"
              placeholder="e.g. Google LLC, Amazon Web Services, Microsoft"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Plan / License Tier
            </label>
            <input
              type="text"
              placeholder="e.g. Enterprise Plus, Team Pro, Organization"
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Billing Frequency / Cycle *
            </label>
            <select
              value={formData.billingCycle}
              onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              {BILLING_CYCLES.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {cycle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cost / Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 font-bold text-slate-400 text-xs">₹</span>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              License Seats / User Count
            </label>
            <input
              type="number"
              min="1"
              value={formData.seatsCount}
              onChange={(e) => setFormData({ ...formData, seatsCount: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Next Renewal Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                required
                value={formData.nextRenewalDate}
                onChange={(e) => setFormData({ ...formData, nextRenewalDate: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Next Payment Due Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="date"
                required
                value={formData.nextPaymentDueDate}
                onChange={(e) => setFormData({ ...formData, nextPaymentDueDate: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Status *
            </label>
            <select
              value={formData.paymentStatus}
              onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              <option value="Paid">Paid</option>
              <option value="Payment Due">Payment Due</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              <option value="Corporate Credit Card">Corporate Credit Card</option>
              <option value="Auto-Debit Net Banking">Auto-Debit Net Banking</option>
              <option value="Invoice / Bank NEFT">Invoice / Bank NEFT</option>
              <option value="UPI / QR Code">UPI / QR Code</option>
              <option value="PayPal / Stripe">PayPal / Stripe</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Department
            </label>
            <select
              value={formData.assignedDepartment}
              onChange={(e) => setFormData({ ...formData, assignedDepartment: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subscription Owner / Manager
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Vikramaditya Sharma"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Auto-Renew Enabled</span>
                <span className="text-[11px] text-slate-500">Service automatically charges company account upon renewal date</span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoRenew}
                onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Admin Console / Login URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="url"
                placeholder="https://admin.service.com"
                value={formData.loginUrl}
                onChange={(e) => setFormData({ ...formData, loginUrl: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Usage Description & Purpose
          </label>
          <textarea
            rows={2}
            placeholder="Operational scope, team allocated, SLA notes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{initialData ? "Save Changes" : "Add Subscription"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddSubscriptionModal;
