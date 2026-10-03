import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, Tag, Percent, IndianRupee, Layers, Clock, ShieldCheck, ShoppingCart, TrendingUp } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, logAuditAction } from '../../services/otdStorageService';
import { syncMasterProductWithInventory } from '../../services/inventoryStorageService';

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
    avgDailyConsumption: 10,
    leadTimeDays: 7,
    safetyFactor: 1.25,
    moq: 50,
    maxLevel: 500,
    taxRate: 18,
    defaultRate: 500,
    status: 'Active'
  });

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingProd(prod);
      setForm({
        ...prod,
        avgDailyConsumption: prod.avgDailyConsumption !== undefined ? prod.avgDailyConsumption : 10,
        leadTimeDays: prod.leadTimeDays !== undefined ? prod.leadTimeDays : 7,
        safetyFactor: prod.safetyFactor !== undefined ? prod.safetyFactor : 1.25,
        moq: prod.moq !== undefined ? prod.moq : 50,
        maxLevel: prod.maxLevel !== undefined ? prod.maxLevel : 500
      });
    } else {
      setEditingProd(null);
      setForm({
        code: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        category: 'Raw Materials',
        subCategory: '',
        unit: 'Pcs',
        avgDailyConsumption: 10,
        leadTimeDays: 7,
        safetyFactor: 1.25,
        moq: 50,
        maxLevel: 500,
        taxRate: 18,
        defaultRate: 500,
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Item / Product Name is required');

    const productPayload = {
      ...form,
      avgDailyConsumption: Number(form.avgDailyConsumption) || 0,
      leadTimeDays: Number(form.leadTimeDays) || 0,
      safetyFactor: Number(form.safetyFactor) || 1.2,
      moq: Number(form.moq) || 1,
      maxLevel: Number(form.maxLevel) || 100,
      defaultRate: Number(form.defaultRate) || 0,
      taxRate: Number(form.taxRate) || 0,
    };

    let updated;
    if (editingProd) {
      updated = products.map((p) => (p.id === editingProd.id ? { ...p, ...productPayload } : p));
      logAuditAction('Product Updated', 'Product Master', editingProd.id, productPayload);
    } else {
      const newProd = { id: generateId('PRD'), ...productPayload, createdAt: new Date().toISOString() };
      updated = [...products, newProd];
      logAuditAction('Product Created', 'Product Master', newProd.id, productPayload);
    }

    setData(STORAGE_KEYS.PRODUCTS, updated);

    // Sync seamlessly with Inventory module
    syncMasterProductWithInventory(editingProd ? { ...editingProd, ...productPayload } : { id: generateId('PRD'), ...productPayload });

    setShowModal(false);
  };

  const handleDeleteProduct = (id) => {
    if (!window.confirm('Are you sure you want to delete this Product / Item?')) return;
    const prod = products.find((p) => p.id === id);
    const updated = products.filter((p) => p.id !== id);
    setData(STORAGE_KEYS.PRODUCTS, updated);
    logAuditAction('Product Deleted', 'Product Master', id, prod);
  };

  return (
    <div className="space-y-2.5">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            Master Catalog
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Item & Product Master</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Item / Product</span>
        </button>
      </div>

      {/* Product List / Empty State */}
      {products.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
          No items added yet. Click &quot;+ Add Item / Product&quot; to populate your catalog.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2 w-16">Actions</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Avg Daily Cons.</th>
                  <th className="px-3 py-2 text-right">Lead Time</th>
                  <th className="px-3 py-2 text-right">Safety Factor</th>
                  <th className="px-3 py-2 text-right">MOQ</th>
                  <th className="px-3 py-2 text-right">Max Level</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2 text-right">Rate</th>
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
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-slate-800 dark:text-slate-200 text-right text-[11px]">
                      {p.avgDailyConsumption || 10} {p.unit || 'units'}/day
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-amber-600 dark:text-amber-400 text-right text-[11px]">
                      {p.leadTimeDays || 7} days
                    </td>
                    <td className="px-3 py-1.5 font-semibold text-slate-600 dark:text-slate-300 text-right text-[11px]">
                      {p.safetyFactor || 1.25}x
                    </td>
                    <td className="px-3 py-1.5 font-bold text-indigo-600 dark:text-indigo-400 text-right text-[11px]">
                      {p.moq || 50}
                    </td>
                    <td className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300 text-right text-[11px]">
                      {p.maxLevel || 500}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-slate-600 dark:text-slate-300 text-[11px]">
                      {p.unit}
                    </td>
                    <td className="px-3 py-1.5 font-extrabold text-slate-900 dark:text-white text-right text-[11px]">
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

      {/* PRODUCT / ITEM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-xl shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {editingProd ? 'Edit Item / Product' : 'Add New Item / Product'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure Item attributes for both Sales Master & Inventory Low-Stock calculations
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              {/* Item Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Item Code / SKU *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Industrial Aluminum Rod 20mm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category, Subcategory, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Packaging Materials">Packaging Materials</option>
                    <option value="Spare Parts & Consumables">Spare Parts & Consumables</option>
                    <option value="Tools & Equipment">Tools & Equipment</option>
                    <option value="Goods">Goods</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sub Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Metals / Fasteners"
                    value={form.subCategory}
                    onChange={(e) => setForm({ ...form, subCategory: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit of Measure *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Mtr">Mtr</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Box">Box</option>
                    <option value="Set">Set</option>
                    <option value="Roll">Roll</option>
                    <option value="Bag">Bag</option>
                  </select>
                </div>
              </div>

              {/* INVENTORY ENGINEERING PARAMETERS SECTION */}
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-800/60 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Inventory Engineering & Auto-Indent Parameters
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1" title="Average Daily Consumption">
                      Avg Daily Cons. (ADC) *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      placeholder="e.g. 15"
                      value={form.avgDailyConsumption}
                      onChange={(e) => setForm({ ...form, avgDailyConsumption: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1" title="Lead time from raising indent to physical receipt">
                      Lead Time (Days) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 10"
                      value={form.leadTimeDays}
                      onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1" title="Buffer factor for demand surges">
                      Safety Factor (SF) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.05"
                      required
                      placeholder="e.g. 1.25"
                      value={form.safetyFactor}
                      onChange={(e) => setForm({ ...form, safetyFactor: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1" title="Minimum Order Quantity">
                      MOQ *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 100"
                      value={form.moq}
                      onChange={(e) => setForm({ ...form, moq: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1" title="Maximum Stock Level">
                      Max Level *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 500"
                      value={form.maxLevel}
                      onChange={(e) => setForm({ ...form, maxLevel: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1" title="Calculated Reorder Level (ADC × Lead Time × SF)">
                      Calculated ROL
                    </label>
                    <div className="w-full px-3 py-1.5 bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-lg font-black text-amber-800 dark:text-amber-300">
                      {Math.ceil((Number(form.avgDailyConsumption) || 0) * (Number(form.leadTimeDays) || 0) * (Number(form.safetyFactor) || 1.25))} {form.unit}
                    </div>
                  </div>
                </div>
              </div>

              {/* Commercials: Rate & Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tax / GST %</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
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
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingProd ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
