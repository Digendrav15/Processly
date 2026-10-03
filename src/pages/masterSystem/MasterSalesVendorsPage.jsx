import React, { useState } from 'react';
import { Users2, Plus, Edit2, Trash2, Building2, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, logAuditAction } from '../../services/otdStorageService';

export function MasterSalesVendorsPage() {
  const vendors = useOTDStorage(STORAGE_KEYS.CUSTOMERS, []);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
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

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ ...item });
    } else {
      setEditingItem(null);
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

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Sales Vendor / Customer Name is required');

    let updated;
    if (editingItem) {
      updated = vendors.map((v) => (v.id === editingItem.id ? { ...v, ...form } : v));
      logAuditAction('Sales Vendor Updated', 'Master System', editingItem.id, form);
    } else {
      const newItem = { id: generateId('CUST'), ...form, createdAt: new Date().toISOString() };
      updated = [...vendors, newItem];
      logAuditAction('Sales Vendor Created', 'Master System', newItem.id, form);
    }

    setData(STORAGE_KEYS.CUSTOMERS, updated);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this Sales Vendor?')) return;
    const item = vendors.find((v) => v.id === id);
    const updated = vendors.filter((v) => v.id !== id);
    setData(STORAGE_KEYS.CUSTOMERS, updated);
    logAuditAction('Sales Vendor Deleted', 'Master System', id, item);
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border border-rose-200 dark:border-rose-800/80">
            Master System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Sales Vendors (Customers) Master</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Vendor</span>
        </button>
      </div>

      {/* Main List */}
      {vendors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <Users2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Sales Vendors Added</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create sales vendor records here. Order forms will draw customer options directly from this master.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Sales Vendor</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                <th className="pb-3 px-3">Code</th>
                <th className="pb-3 px-3">Customer / Vendor Name</th>
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">Contact Person</th>
                <th className="pb-3 px-3">Mobile & Email</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3 font-extrabold text-rose-600 dark:text-rose-400">{v.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{v.name}</td>
                  <td className="py-3 px-3 text-slate-500">{v.type}</td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{v.contactPerson || '-'}</td>
                  <td className="py-3 px-3 text-slate-500">{v.mobile} {v.email ? `(${v.email})` : ''}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button onClick={() => handleOpenModal(v)} className="p-1 hover:bg-slate-100 rounded text-indigo-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="p-1 hover:bg-slate-100 rounded text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {editingItem ? 'Edit Sales Vendor' : 'Add Sales Vendor'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Vendor Code *</label>
                  <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl">
                    <option value="Corporate">Corporate</option>
                    <option value="Retail">Retail</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Sales Vendor / Customer Name *</label>
                <input type="text" required placeholder="e.g. ABC Leather Pvt Ltd" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Contact Person</label>
                  <input type="text" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Mobile</label>
                  <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
