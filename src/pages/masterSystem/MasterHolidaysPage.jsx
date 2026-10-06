import React, { useState } from 'react';
<<<<<<< HEAD
import { Calendar, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, logAuditAction } from '../../services/otdStorageService';

export function MasterHolidaysPage() {
  const holidays = useOTDStorage(STORAGE_KEYS.HOLIDAYS, []);
=======
import { Calendar, Plus, Edit2, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, logAuditAction } from '../../services/otdStorageService';
import { holidayService } from '../../services/holidayService';

export function MasterHolidaysPage() {
  const holidays = useOTDStorage(STORAGE_KEYS.HOLIDAYS, holidayService.getHolidaysSync());
>>>>>>> daf8de7 ( .gitignore update)

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    type: 'Public Holiday',
    status: 'Active'
  });

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ ...item });
    } else {
      setEditingItem(null);
      setForm({
        date: new Date().toISOString().split('T')[0],
        name: '',
        type: 'Public Holiday',
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return alert('Holiday Name and Date are required');

    let updated;
    if (editingItem) {
      updated = holidays.map((h) => (h.id === editingItem.id ? { ...h, ...form } : h));
      logAuditAction('Holiday Updated', 'Holidays Master', editingItem.id, form);
    } else {
      const newItem = { id: generateId('HOL'), ...form, createdAt: new Date().toISOString() };
      updated = [...holidays, newItem];
      logAuditAction('Holiday Created', 'Holidays Master', newItem.id, form);
    }

    setData(STORAGE_KEYS.HOLIDAYS, updated);
<<<<<<< HEAD
=======
    try {
      localStorage.setItem('corporate_system_holidays', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
>>>>>>> daf8de7 ( .gitignore update)
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this Holiday?')) return;
    const item = holidays.find((h) => h.id === id);
    const updated = holidays.filter((h) => h.id !== id);
    setData(STORAGE_KEYS.HOLIDAYS, updated);
<<<<<<< HEAD
=======
    try {
      localStorage.setItem('corporate_system_holidays', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
>>>>>>> daf8de7 ( .gitignore update)
    logAuditAction('Holiday Deleted', 'Holidays Master', id, item);
  };

  return (
    <div className="space-y-2.5">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border border-rose-200 dark:border-rose-800/80">
            Master System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Holidays Master</h1>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Holiday</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {holidays.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No Holidays added yet. Click &quot;Add Holiday&quot; to configure official holidays.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2 w-20">Actions</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Holiday Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-1.5 font-semibold">
                      <div className="flex items-center space-x-1">
                        <button onClick={() => handleOpenModal(h)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(h.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-600 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 font-bold text-rose-600 dark:text-rose-400 text-[11px]">{h.date}</td>
                    <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white text-[11.5px]">{h.name}</td>
                    <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">{h.type}</td>
                    <td className="px-3 py-1.5">
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{h.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {editingItem ? 'Edit Holiday' : 'Add Holiday'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
<<<<<<< HEAD
                <label className="block font-bold mb-1">Holiday Name *</label>
                <input type="text" required placeholder="e.g. Independence Day" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Holiday Date *</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Holiday Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">
                  <option value="Public Holiday">Public Holiday</option>
                  <option value="Company Holiday">Company Holiday</option>
                  <option value="Restricted Holiday">Restricted Holiday</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl">Save</button>
=======
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Holiday Date *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Holiday Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                >
                  <option value="Public Holiday" className="dark:bg-slate-800 text-slate-900 dark:text-white">Public Holiday</option>
                  <option value="Company Holiday" className="dark:bg-slate-800 text-slate-900 dark:text-white">Company Holiday</option>
                  <option value="Restricted Holiday" className="dark:bg-slate-800 text-slate-900 dark:text-white">Restricted Holiday</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save
                </button>
>>>>>>> daf8de7 ( .gitignore update)
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
