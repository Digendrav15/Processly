import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, logAuditAction } from '../../services/otdStorageService';

export function MasterDepartmentsPage() {
  const departments = useOTDStorage(STORAGE_KEYS.DEPARTMENTS, []);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', headName: '', status: 'Active' });

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ ...item });
    } else {
      setEditingItem(null);
      setForm({
        code: `DPT-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        headName: '',
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Department Name is required');

    let updated;
    if (editingItem) {
      updated = departments.map((d) => (d.id === editingItem.id ? { ...d, ...form } : d));
      logAuditAction('Department Updated', 'Department Master', editingItem.id, form);
    } else {
      const newItem = { id: generateId('DPT'), ...form, createdAt: new Date().toISOString() };
      updated = [...departments, newItem];
      logAuditAction('Department Created', 'Department Master', newItem.id, form);
    }

    setData(STORAGE_KEYS.DEPARTMENTS, updated);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this Department?')) return;
    const item = departments.find((d) => d.id === id);
    const updated = departments.filter((d) => d.id !== id);
    setData(STORAGE_KEYS.DEPARTMENTS, updated);
    logAuditAction('Department Deleted', 'Department Master', id, item);
  };

  return (
    <div className="space-y-2.5">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border border-rose-200 dark:border-rose-800/80">
            Master System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Department Master</h1>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Department</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {departments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No Departments added yet. Click &quot;Add Department&quot; to configure your organization units.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2 w-20">Actions</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Department Name</th>
                  <th className="px-3 py-2">Head of Department</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-1.5 font-semibold">
                      <div className="flex items-center space-x-1">
                        <button onClick={() => handleOpenModal(d)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-600 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">{d.code}</td>
                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white text-[11.5px]">{d.name}</td>
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px]">{d.headName || '-'}</td>
                    <td className="px-3 py-1.5">
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {editingItem ? 'Edit Department' : 'Add Department'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Code *</label>
                <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Department Name *</label>
                <input type="text" required placeholder="e.g. Quality Control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Head of Department</label>
                <input type="text" placeholder="HOD Name" value={form.headName} onChange={(e) => setForm({ ...form, headName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
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
