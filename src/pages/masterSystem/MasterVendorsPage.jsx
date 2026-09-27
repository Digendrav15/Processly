import React, { useState } from 'react';
import { Users2, ShoppingCart, Truck, Plus, Edit2, Trash2, AlertTriangle, Building2, Phone, Mail } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, logAuditAction } from '../../services/otdStorageService';

export function MasterVendorsPage() {
  const [subTab, setSubTab] = useState('sales'); // 'sales', 'purchase', 'transporter'

  const salesVendors = useOTDStorage(STORAGE_KEYS.CUSTOMERS, []);
  const purchaseVendors = useOTDStorage(STORAGE_KEYS.PURCHASE_VENDORS, []);
  const transporters = useOTDStorage(STORAGE_KEYS.TRANSPORTERS, []);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenModal = (item = null) => {
    setErrorMsg('');
    if (item) {
      setEditingItem(item);
      setForm({ ...item });
    } else {
      setEditingItem(null);
      if (subTab === 'sales') {
        setForm({
          code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
          name: '',
          type: 'Corporate',
          contactPerson: '',
          mobile: '',
          email: '',
          city: '',
          status: 'Active'
        });
      } else if (subTab === 'purchase') {
        setForm({
          code: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
          name: '',
          contactPerson: '',
          mobile: '',
          email: '',
          gstin: '',
          city: '',
          status: 'Active'
        });
      } else {
        setForm({
          code: `TRN-${Math.floor(100 + Math.random() * 900)}`,
          name: '',
          contactPerson: '',
          mobile: '',
          vehicleTypes: 'Truck, Container',
          status: 'Active'
        });
      }
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.name.trim()) return setErrorMsg('Vendor / Transporter Name is required');

    if (subTab === 'sales') {
      const updated = editingItem
        ? salesVendors.map((c) => (c.id === editingItem.id ? { ...c, ...form } : c))
        : [...salesVendors, { id: generateId('CUST'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.CUSTOMERS, updated);
      logAuditAction(editingItem ? 'Sales Vendor Updated' : 'Sales Vendor Created', 'Vendors Master', editingItem?.id || 'NEW', form);
    } else if (subTab === 'purchase') {
      const updated = editingItem
        ? purchaseVendors.map((v) => (v.id === editingItem.id ? { ...v, ...form } : v))
        : [...purchaseVendors, { id: generateId('VND'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.PURCHASE_VENDORS, updated);
      logAuditAction(editingItem ? 'Purchase Vendor Updated' : 'Purchase Vendor Created', 'Vendors Master', editingItem?.id || 'NEW', form);
    } else if (subTab === 'transporter') {
      const updated = editingItem
        ? transporters.map((t) => (t.id === editingItem.id ? { ...t, ...form } : t))
        : [...transporters, { id: generateId('TRN'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.TRANSPORTERS, updated);
      logAuditAction(editingItem ? 'Transporter Updated' : 'Transporter Created', 'Vendors Master', editingItem?.id || 'NEW', form);
    }

    setShowModal(false);
  };

  const handleDelete = (id, label, storageKey, currentList) => {
    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;
    const item = currentList.find((x) => x.id === id);
    const updated = currentList.filter((x) => x.id !== id);
    setData(storageKey, updated);
    logAuditAction(`${label} Deleted`, 'Vendors Master', id, item);
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-rose-900 to-slate-900 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
            <Users2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-black text-[9px] uppercase tracking-wider border border-rose-500/30">
                Master System
              </span>
              <h1 className="text-base font-extrabold tracking-tight">Vendors & Logistics Master</h1>
            </div>
            <p className="text-[11px] text-rose-200 mt-0.5">Manage Sales Vendors (Customers), Purchase Vendors, and Transporters</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-Tabs */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setSubTab('sales')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                subTab === 'sales'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Sales ({salesVendors.length})</span>
            </button>
            <button
              onClick={() => setSubTab('purchase')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                subTab === 'purchase'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Purchase ({purchaseVendors.length})</span>
            </button>
            <button
              onClick={() => setSubTab('transporter')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                subTab === 'transporter'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Transporters ({transporters.length})</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {subTab === 'sales' ? 'Add Sales' : subTab === 'purchase' ? 'Add Purchase' : 'Add Transporter'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* SUB TAB 1: SALES VENDORS */}
        {subTab === 'sales' && (
          <div>
            {salesVendors.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No Sales Vendors added yet. Order creation forms draw customer options directly from this master.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="px-3 py-2 w-20">Actions</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Customer / Sales Vendor</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Contact Person</th>
                      <th className="px-3 py-2">Mobile & Email</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {salesVendors.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-1.5 font-semibold">
                          <div className="flex items-center space-x-1">
                            <button onClick={() => handleOpenModal(c)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(c.id, 'Sales Vendor', STORAGE_KEYS.CUSTOMERS, salesVendors)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-600 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 font-mono font-bold text-rose-600 dark:text-rose-400 text-[11px]">{c.code}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white text-[11.5px]">{c.name}</td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">{c.type}</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{c.contactPerson || '-'}</td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">{c.mobile} {c.email ? `(${c.email})` : ''}</td>
                        <td className="px-3 py-1.5">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUB TAB 2: PURCHASE VENDORS */}
        {subTab === 'purchase' && (
          <div>
            {purchaseVendors.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No Purchase Vendors added yet.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="px-3 py-2 w-20">Actions</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Purchase Vendor Name</th>
                      <th className="px-3 py-2">GSTIN</th>
                      <th className="px-3 py-2">Contact Person</th>
                      <th className="px-3 py-2">Mobile & Email</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {purchaseVendors.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-1.5 font-semibold">
                          <div className="flex items-center space-x-1">
                            <button onClick={() => handleOpenModal(v)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(v.id, 'Purchase Vendor', STORAGE_KEYS.PURCHASE_VENDORS, purchaseVendors)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-600 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px]">{v.code}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white text-[11.5px]">{v.name}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{v.gstin || '-'}</td>
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px]">{v.contactPerson || '-'}</td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">{v.mobile} {v.email ? `(${v.email})` : ''}</td>
                        <td className="px-3 py-1.5">
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{v.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUB TAB 3: TRANSPORTERS */}
        {subTab === 'transporter' && (
          <div>
            {transporters.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No Transporters added yet. Dispatch stage courier dropdowns will source from here.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <th className="px-3 py-2 w-20">Actions</th>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Transporter / Courier</th>
                      <th className="px-3 py-2">Contact Person</th>
                      <th className="px-3 py-2">Mobile</th>
                      <th className="px-3 py-2">Vehicle Types</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {transporters.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-1.5 font-semibold">
                          <div className="flex items-center space-x-1">
                            <button onClick={() => handleOpenModal(t)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(t.id, 'Transporter', STORAGE_KEYS.TRANSPORTERS, transporters)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-600 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 font-mono font-bold text-purple-600 dark:text-purple-400 text-[11px]">{t.code}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white text-[11.5px]">{t.name}</td>
                        <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px]">{t.contactPerson || '-'}</td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">{t.mobile}</td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">{t.vehicleTypes || 'General'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {editingItem
                ? `Edit ${subTab === 'sales' ? 'Sales Vendor' : subTab === 'purchase' ? 'Purchase Vendor' : 'Transporter'}`
                : `Add ${subTab === 'sales' ? 'Sales Vendor' : subTab === 'purchase' ? 'Purchase Vendor' : 'Transporter'}`}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Code *</label>
                  <input type="text" required value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                </div>
                {subTab === 'sales' && (
                  <div>
                    <label className="block font-bold mb-1">Type</label>
                    <select value={form.type || 'Corporate'} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">
                      <option value="Corporate">Corporate</option>
                      <option value="Retail">Retail</option>
                      <option value="Distributor">Distributor</option>
                    </select>
                  </div>
                )}
                {subTab === 'purchase' && (
                  <div>
                    <label className="block font-bold mb-1">GSTIN</label>
                    <input type="text" placeholder="GSTIN #" value={form.gstin || ''} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1">Name *</label>
                <input type="text" required placeholder="Name..." value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Contact Person</label>
                  <input type="text" value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold mb-1">Mobile</label>
                  <input type="tel" value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Email</label>
                <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
