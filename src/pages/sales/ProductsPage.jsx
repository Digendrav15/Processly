import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Tag, Percent, IndianRupee } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, logAuditAction } from '../../services/otdStorageService';

export function ProductsPage() {
  const products = useOTDStorage(STORAGE_KEYS.PRODUCTS, []);

  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: 'Goods',
    subCategory: '',
    unit: 'Pcs',
    taxRate: 18,
    defaultRate: 500,
    status: 'Active'
  });

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingProd(prod);
      setForm({ ...prod });
    } else {
      setEditingProd(null);
      setForm({
        code: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        category: 'Goods',
        subCategory: '',
        unit: 'Pcs',
        taxRate: 18,
        defaultRate: 500,
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Product Name is required');

    let updated;
    if (editingProd) {
      updated = products.map((p) => (p.id === editingProd.id ? { ...p, ...form } : p));
      logAuditAction('Product Updated', 'Product Master', editingProd.id, form);
    } else {
      const newProd = { id: generateId('PRD'), ...form, createdAt: new Date().toISOString() };
      updated = [...products, newProd];
      logAuditAction('Product Created', 'Product Master', newProd.id, form);
    }

    setData(STORAGE_KEYS.PRODUCTS, updated);
    setShowModal(false);
  };

  const handleDeleteProduct = (id) => {
    if (!window.confirm('Are you sure you want to delete this Product?')) return;
    const prod = products.find((p) => p.id === id);
    const updated = products.filter((p) => p.id !== id);
    setData(STORAGE_KEYS.PRODUCTS, updated);
    logAuditAction('Product Deleted', 'Product Master', id, prod);
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase tracking-wider border border-emerald-500/30">
                Order To Delivery
              </span>
              <h1 className="text-base font-extrabold tracking-tight">Product Master</h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Manage catalog items, pricing, tax units, and categories</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Product List / Empty State */}
      {products.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
          No products added yet. Click &quot;Add Product&quot; to populate your catalog.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2 w-20">Actions</th>
                  <th className="px-3 py-2">Product Code</th>
                  <th className="px-3 py-2">Product Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Tax/GST %</th>
                  <th className="px-3 py-2">Default Rate</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-1.5 font-semibold">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-emerald-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      {p.code}
                    </td>
                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white text-[11.5px]">
                      {p.name}
                    </td>
                    <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      {p.category} {p.subCategory ? `(${p.subCategory})` : ''}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300 text-[11px]">
                      {p.unit}
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                      {p.taxRate}%
                    </td>
                    <td className="px-3 py-1.5 font-extrabold text-slate-900 dark:text-white text-[11px]">
                      ₹ {parseFloat(p.defaultRate || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {editingProd ? 'Edit Product' : 'Add New Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Product Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Meter">Meter</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Sets">Sets</option>
                    <option value="Liters">Liters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leather Bag"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sub Category</label>
                  <input
                    type="text"
                    placeholder="Sub Category"
                    value={form.subCategory}
                    onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Default Rate (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form.defaultRate}
                    onChange={(e) => setForm({ ...form, defaultRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tax/GST %</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
