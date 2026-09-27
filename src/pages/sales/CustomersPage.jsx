import React, { useState } from 'react';
import { Users2, Plus, Edit2, Trash2, Building2, MapPin, Phone, Mail, UserCheck } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, logAuditAction } from '../../services/otdStorageService';

export function CustomersPage() {
  const customers = useOTDStorage(STORAGE_KEYS.CUSTOMERS, []);

  const [showModal, setShowModal] = useState(false);
  const [editingCust, setEditingCust] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'Corporate',
    contactPerson: '',
    mobile: '',
    email: '',
    billingAddress: '',
    shippingAddress: '',
    city: '',
    state: '',
    pincode: '',
    status: 'Active'
  });

  const handleOpenModal = (cust = null) => {
    if (cust) {
      setEditingCust(cust);
      setForm({ ...cust });
    } else {
      setEditingCust(null);
      setForm({
        code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        type: 'Corporate',
        contactPerson: '',
        mobile: '',
        email: '',
        billingAddress: '',
        shippingAddress: '',
        city: '',
        state: '',
        pincode: '',
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Customer Name is required');

    let updated;
    if (editingCust) {
      updated = customers.map((c) => (c.id === editingCust.id ? { ...c, ...form } : c));
      logAuditAction('Customer Updated', 'Customer Master', editingCust.id, form);
    } else {
      const newCust = { id: generateId('CUST'), ...form, createdAt: new Date().toISOString() };
      updated = [...customers, newCust];
      logAuditAction('Customer Created', 'Customer Master', newCust.id, form);
    }

    setData(STORAGE_KEYS.CUSTOMERS, updated);
    setShowModal(false);
  };

  const handleDeleteCustomer = (id) => {
    if (!window.confirm('Are you sure you want to delete this Customer?')) return;
    const cust = customers.find((c) => c.id === id);
    const updated = customers.filter((c) => c.id !== id);
    setData(STORAGE_KEYS.CUSTOMERS, updated);
    logAuditAction('Customer Deleted', 'Customer Master', id, cust);
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase border border-emerald-500/30">
              Order To Delivery
            </span>
          </div>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Customer Master</h1>
          <p className="text-[11px] text-slate-400">Manage corporate clients, billing details, and contact info.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customer List / Empty State */}
      {customers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
          <Users2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Customers Added</h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
            You have not created any customer records yet. Add a customer to begin creating orders.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Customer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {customers.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{c.code}</span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{c.name}</h3>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => handleOpenModal(c)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteCustomer(c.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs space-y-1.5 text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                {c.contactPerson && (
                  <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" /> {c.contactPerson}
                  </p>
                )}
                {c.mobile && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.mobile}
                  </p>
                )}
                {c.email && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}
                  </p>
                )}
                {(c.city || c.state) && (
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {[c.city, c.state, c.pincode].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Type: <strong className="text-slate-600 dark:text-slate-300">{c.type}</strong></span>
                <span className={`px-2 py-0.5 rounded-full font-bold ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'}`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {editingCust ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    <option value="Corporate">Corporate</option>
                    <option value="Retail">Retail</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Leather Pvt Ltd"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  placeholder="Full billing address..."
                  value={form.billingAddress}
                  onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Shipping Address</label>
                <textarea
                  rows={2}
                  placeholder="Shipping address (or same as billing)..."
                  value={form.shippingAddress}
                  onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
