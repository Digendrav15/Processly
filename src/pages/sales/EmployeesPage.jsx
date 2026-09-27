import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, Phone, Mail, CheckCircle2, UserCheck, Lock } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, getCurrentUser, setCurrentUser, logAuditAction, initEmployees } from '../../services/otdStorageService';
import { SYSTEMS_CONFIG } from '../../config/systemsConfig';
import { useAuth } from '../../context/AuthContext';

export function EmployeesPage() {
  const employees = useOTDStorage(STORAGE_KEYS.EMPLOYEES, []);
  const currentUser = getCurrentUser();
  const { switchUser } = useAuth();

  useEffect(() => {
    initEmployees();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);

  const ALL_MODULE_IDS = SYSTEMS_CONFIG.map((sys) => sys.id);

  const [form, setForm] = useState({
    code: '',
    name: '',
    department: 'Sales',
    designation: 'Executive',
    userGroup: 'Sales User',
    mobile: '',
    email: '',
    allowedModules: ALL_MODULE_IDS,
    status: 'Active'
  });

  const handleOpenModal = (emp = null) => {
    if (emp) {
      setEditingEmp(emp);
      setForm({
        ...emp,
        allowedModules: emp.allowedModules || ALL_MODULE_IDS
      });
    } else {
      setEditingEmp(null);
      setForm({
        code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        department: 'Sales',
        designation: 'Sales Executive',
        userGroup: 'Sales User',
        mobile: '',
        email: '',
        allowedModules: ALL_MODULE_IDS,
        status: 'Active'
      });
    }
    setShowModal(true);
  };

  const handleToggleModulePermission = (moduleId) => {
    const current = form.allowedModules || [];
    let updated;
    if (current.includes(moduleId)) {
      updated = current.filter((id) => id !== moduleId);
    } else {
      updated = [...current, moduleId];
    }
    setForm({ ...form, allowedModules: updated });
  };

  const handleSaveEmployee = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Employee Name is required');

    let updated;
    if (editingEmp) {
      updated = employees.map((emp) => (emp.id === editingEmp.id ? { ...emp, ...form } : emp));
      logAuditAction('Employee Updated', 'User Master', editingEmp.id, form);
    } else {
      const newEmp = { id: generateId('EMP'), ...form, createdAt: new Date().toISOString() };
      updated = [...employees, newEmp];
      logAuditAction('Employee Created', 'User Master', newEmp.id, form);
    }

    setData(STORAGE_KEYS.EMPLOYEES, updated);

    // If active session user was modified, update active user session in storage
    if (currentUser?.id === editingEmp?.id) {
      setCurrentUser({ ...currentUser, ...form });
    }

    setShowModal(false);
  };

  const handleDeleteEmployee = (id) => {
    if (!window.confirm('Are you sure you want to delete this User?')) return;
    const emp = employees.find((e) => e.id === id);
    const updated = employees.filter((e) => e.id !== id);
    setData(STORAGE_KEYS.EMPLOYEES, updated);
    logAuditAction('Employee Deleted', 'User Master', id, emp);
  };

  const handleSetCurrentUser = (emp) => {
    setCurrentUser(emp);
    switchUser({
      id: emp.id,
      employee_id: emp.code,
      name: emp.name,
      full_name: emp.name,
      email: emp.email || `${emp.code.toLowerCase()}@corporate.com`,
      role: emp.userGroup === 'Admin' ? 'ADMIN' : emp.userGroup === 'Manager' ? 'MANAGER' : 'EMPLOYEE',
      userGroup: emp.userGroup,
      department_name: emp.department,
      designation: emp.designation,
      allowedModules: emp.allowedModules || ALL_MODULE_IDS,
      is_active: emp.status === 'Active'
    });
    logAuditAction('Local User Switched', 'User Session', emp.id, { userName: emp.name });
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-black text-[9px] uppercase tracking-wider border border-rose-500/30">
                Master System
              </span>
              <h1 className="text-base font-extrabold tracking-tight">User / Employee Master</h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Manage user permissions, roles, and module access controls</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Active Session Compact Bar */}
      <div className="bg-indigo-950/60 border border-indigo-800/40 px-3 py-2 rounded-xl text-white flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-indigo-400" />
          <span>Active Session: <strong className="text-white">{currentUser?.name || 'Default Admin'}</strong> ({currentUser?.designation} • {currentUser?.userGroup || 'Admin'})</span>
        </div>
        <div className="text-[11px] text-indigo-300">
          Permitted Modules: <strong>{currentUser?.allowedModules ? currentUser.allowedModules.length : 'All (Admin)'}</strong> module(s).
        </div>
      </div>

      {/* High Density Table */}
      {employees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
          No users added yet. Click &quot;Add User&quot; to configure employees and permissions.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="px-3 py-2 w-28">Actions</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Department & Role</th>
                  <th className="px-3 py-2">User Group</th>
                  <th className="px-3 py-2">Allowed Modules</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Session Switch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {employees.map((emp) => {
                  const isActiveUser = currentUser?.id === emp.id || currentUser?.code === emp.code;
                  const empModules = emp.allowedModules || ALL_MODULE_IDS;

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isActiveUser ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="px-3 py-1.5 font-semibold">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenModal(emp)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-rose-600 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                        {emp.code}
                      </td>
                      <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white text-[11.5px]">
                        <div className="flex items-center gap-1.5">
                          <span>{emp.name}</span>
                          {isActiveUser && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        {emp.designation} • {emp.department}
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                          <Shield className="w-2.5 h-2.5" />
                          {emp.userGroup}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {SYSTEMS_CONFIG.map((sys) => {
                            const hasPerm = empModules.includes(sys.id);
                            return (
                              <span
                                key={sys.id}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                  hasPerm
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                    : 'bg-slate-100 text-slate-400 line-through opacity-40'
                                }`}
                              >
                                {sys.shortName}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          onClick={() => handleSetCurrentUser(emp)}
                          disabled={isActiveUser}
                          className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all ${
                            isActiveUser
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs cursor-pointer'
                          }`}
                        >
                          {isActiveUser ? 'Active Session' : 'Switch'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPLOYEE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {editingEmp ? 'Edit User / Employee' : 'Add User / Employee'}
            </h3>
            <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">User Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">User Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="Designation"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">User Group / Role</label>
                  <select
                    value={form.userGroup}
                    onChange={(e) => setForm({ ...form, userGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Sales User">Sales User</option>
                    <option value="QC User">QC User</option>
                    <option value="Dispatch User">Dispatch User</option>
                    <option value="Accounts User">Accounts User</option>
                  </select>
                </div>
              </div>

              {/* MODULE PERMISSION CHECKBOXES */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-500" /> Module Permissions (Access Control)
                </label>
                <p className="text-[11px] text-slate-400">Only permitted modules will appear in the System Switcher dropdown for this user.</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {SYSTEMS_CONFIG.map((sys) => {
                    const isChecked = (form.allowedModules || []).includes(sys.id);
                    return (
                      <label key={sys.id} className="flex items-center space-x-2 cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModulePermission(sys.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{sys.name}</span>
                      </label>
                    );
                  })}
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
