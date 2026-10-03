import React, { useState } from 'react';
import { Clock, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, logAuditAction } from '../../services/otdStorageService';

export function OTDTatPage() {
  const tatConfigs = useOTDStorage(STORAGE_KEYS.TAT, []);
  const systems = useOTDStorage(STORAGE_KEYS.SYSTEMS, []);
  const stages = useOTDStorage(STORAGE_KEYS.STAGES, []);

  const [showModal, setShowModal] = useState(false);
  const [editingTat, setEditingTat] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    systemName: '',
    stageName: '',
    tatValue: 2,
    tatUnit: 'Hours',
    status: 'Active'
  });

  const availableStages = stages.filter(
    (stg) => stg.status === 'Active' && stg.systemName === form.systemName
  );

  const handleOpenModal = (tat = null) => {
    setErrorMessage('');
    if (tat) {
      setEditingTat(tat);
      setForm({
        systemName: tat.systemName,
        stageName: tat.stageName,
        tatValue: tat.tatValue,
        tatUnit: tat.tatUnit || 'Hours',
        status: tat.status || 'Active'
      });
    } else {
      setEditingTat(null);
      const defaultSys = systems[0]?.name || '';
      const defaultStage = stages.find((s) => s.systemName === defaultSys)?.stageName || '';
      setForm({
        systemName: defaultSys,
        stageName: defaultStage,
        tatValue: 2,
        tatUnit: 'Hours',
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleSystemChange = (systemName) => {
    const defaultStage = stages.find((s) => s.systemName === systemName)?.stageName || '';
    setForm({ ...form, systemName, stageName: defaultStage });
    setErrorMessage('');
  };

  const handleSaveTat = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.systemName) return setErrorMessage('Please select a System');
    if (!form.stageName) return setErrorMessage('Please select a Stage');
    if (!form.tatValue || parseFloat(form.tatValue) <= 0) return setErrorMessage('TAT Value must be greater than 0');

    // TAT Unique Rule: 1 System + 1 Stage = 1 active TAT configuration
    if (form.status === 'Active') {
      const duplicate = tatConfigs.find(
        (t) =>
          t.id !== editingTat?.id &&
          t.status === 'Active' &&
          t.systemName?.toLowerCase() === form.systemName.toLowerCase() &&
          t.stageName?.toLowerCase() === form.stageName.toLowerCase()
      );

      if (duplicate) {
        setErrorMessage('TAT is already configured for this stage. Please edit the existing configuration.');
        return;
      }
    }

    let updated;
    if (editingTat) {
      updated = tatConfigs.map((t) => (t.id === editingTat.id ? { ...t, ...form } : t));
      logAuditAction('TAT Updated', 'TAT Management', editingTat.id, form);
    } else {
      const newTat = { id: generateId('TAT'), ...form, createdAt: new Date().toISOString() };
      updated = [...tatConfigs, newTat];
      logAuditAction('TAT Created', 'TAT Management', newTat.id, form);
    }

    setData(STORAGE_KEYS.TAT, updated);
    setShowModal(false);
  };

  const handleDeleteTat = (id) => {
    if (!window.confirm('Are you sure you want to delete this TAT configuration?')) return;
    const tat = tatConfigs.find((t) => t.id === id);
    const updated = tatConfigs.filter((t) => t.id !== id);
    setData(STORAGE_KEYS.TAT, updated);
    logAuditAction('TAT Deleted', 'TAT Management', id, tat);
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            OTD Config
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">TAT Management</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={systems.length === 0 || stages.length === 0}
          className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add TAT Config</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        {systems.length === 0 || stages.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Prerequisites Required</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Please create at least one System and Stage in "System & Stages" before setting up TAT configurations.
            </p>
          </div>
        ) : tatConfigs.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No TAT Configuration Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No Turn Around Time configs added. Configure target durations for workflow stages.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add TAT</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-3 px-3">System Name</th>
                  <th className="pb-3 px-3">Stage Name</th>
                  <th className="pb-3 px-3">TAT Value</th>
                  <th className="pb-3 px-3">TAT Unit</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {tatConfigs.map((tat) => (
                  <tr key={tat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{tat.systemName}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{tat.stageName}</td>
                    <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">{tat.tatValue}</td>
                    <td className="py-3 px-3 font-medium text-slate-500">{tat.tatUnit}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tat.status === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {tat.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(tat)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-emerald-600 dark:text-emerald-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTat(tat.id)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-rose-600 dark:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TAT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {editingTat ? 'Edit TAT Configuration' : 'Add TAT Configuration'}
            </h3>

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveTat} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">System Name *</label>
                <select
                  required
                  value={form.systemName}
                  onChange={(e) => handleSystemChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                >
                  <option value="">-- Select System --</option>
                  {systems.map((sys) => (
                    <option key={sys.id} value={sys.name}>
                      {sys.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Stage Name *</label>
                <select
                  required
                  value={form.stageName}
                  onChange={(e) => {
                    setForm({ ...form, stageName: e.target.value });
                    setErrorMessage('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                >
                  <option value="">-- Select Stage --</option>
                  {availableStages.map((stg) => (
                    <option key={stg.id} value={stg.stageName}>
                      {stg.stageName}
                    </option>
                  ))}
                </select>
                {form.systemName && availableStages.length === 0 && (
                  <p className="text-[11px] text-amber-500 mt-1">No active stages found for this System.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">TAT Value *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    placeholder="e.g. 2"
                    value={form.tatValue}
                    onChange={(e) => setForm({ ...form, tatValue: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">TAT Unit *</label>
                  <select
                    value={form.tatUnit}
                    onChange={(e) => setForm({ ...form, tatUnit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    <option value="Minutes">Minutes</option>
                    <option value="Hours">Hours</option>
                    <option value="Days">Days</option>
                  </select>
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
                  Save TAT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
