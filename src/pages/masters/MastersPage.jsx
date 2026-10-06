import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { masterService } from '../../services/masterService';
import { userService } from '../../services/userService';
import { DEPARTMENTS } from '../../config/constants';
import { Modal } from '../../components/common/Modal';
import { Plus, Edit2, Trash2, Users, Building2, Award, AlertCircle, Camera, Upload, Loader2, Check, Calendar } from 'lucide-react';
import { storageService, PROFILE_BUCKET } from '../../services/storageService';
import { WorkingDayCalendarMaster } from '../../components/masters/WorkingDayCalendarMaster';

export function MastersPage() {
  const location = useLocation();
  const [masters, setMasters] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'Users';
  }); // Users, Departments, Designations, WorkingDayCalendar

  // Modals & Edit States
  // 1. User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [departmentId, setDepartmentId] = useState('dept-ops');
  const [designation, setDesignation] = useState('Operations Associate');
  const [selfAssignEnabled, setSelfAssignEnabled] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // 2. Department Modal & Inputs
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');

  // 3. Designation Modal & Inputs
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState(null);
  const [desigTitle, setDesigTitle] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const mData = await masterService.getMasters();
      const uData = await userService.getUsers();
      setMasters(mData);
      setUsers(uData);
    } catch (err) {
      console.error('Failed to load masters data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- USER HANDLERS ---
  const handleOpenUserModal = (userObj = null) => {
    setAvatarError('');
    if (userObj) {
      setEditingUser(userObj);
      setFullName(userObj.full_name);
      setEmail(userObj.email);
      setMobile(userObj.mobile || '');
      setRole(userObj.role);
      setDepartmentId(userObj.department_id || 'dept-ops');
      setDesignation(userObj.designation || 'Operations Associate');
      setSelfAssignEnabled(userObj.self_assign_enabled !== false);
      setAvatarUrl(userObj.avatar_url || '');
    } else {
      setEditingUser(null);
      setFullName('');
      setEmail('');
      setMobile('');
      setRole('EMPLOYEE');
      setDepartmentId('dept-ops');
      setDesignation('Operations Associate');
      setSelfAssignEnabled(true);
      setAvatarUrl('');
    }
    setIsUserModalOpen(true);
  };

  const handleUserAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setAvatarUploading(true);
    setAvatarError('');
    try {
      // Upload to bucket 'Profile_Images'
      const { publicUrl } = await storageService.uploadProfileImage(
        file,
        editingUser?.id || editingUser?.employee_id || 'user'
      );
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Failed to upload user image to Profile_Images:', err);
      setAvatarError(err.message || 'Failed to upload user profile image to bucket.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const selectedDept = DEPARTMENTS.find((d) => d.id === departmentId);
      const deptName = selectedDept?.name || 'Operations';

      if (editingUser) {
        await userService.updateUser(editingUser.id, {
          full_name: fullName,
          email,
          mobile,
          role,
          department_id: departmentId,
          department_name: deptName,
          designation,
          self_assign_enabled: selfAssignEnabled,
          avatar_url: avatarUrl,
        });
      } else {
        await userService.createUser({
          full_name: fullName,
          email,
          mobile,
          role,
          department_id: departmentId,
          department_name: deptName,
          designation,
          self_assign_enabled: selfAssignEnabled,
          avatar_url: avatarUrl,
        });
      }

      setIsUserModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save user.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user profile?')) return;
    try {
      await userService.deleteUser(userId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const handleToggleSelfAssign = async (userId) => {
    try {
      await userService.toggleSelfAssign(userId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await userService.toggleUserStatus(userId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- DEPARTMENT HANDLERS ---
  const handleOpenDeptModal = (deptObj = null) => {
    if (deptObj) {
      setEditingDept(deptObj);
      setDeptName(deptObj.name);
      setDeptCode(deptObj.code);
    } else {
      setEditingDept(null);
      setDeptName('');
      setDeptCode('');
    }
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    try {
      if (editingDept) {
        await masterService.updateDepartment(editingDept.id, deptName, deptCode);
      } else {
        await masterService.addDepartment(deptName, deptCode);
      }
      setIsDeptModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save department.');
    }
  };

  const handleDeleteDept = async (deptId) => {
    if (!window.confirm('Delete this department entry?')) return;
    try {
      await masterService.deleteDepartment(deptId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete department.');
    }
  };

  // --- DESIGNATION HANDLERS ---
  const handleOpenDesigModal = (desigObj = null) => {
    if (desigObj) {
      setEditingDesig(desigObj);
      setDesigTitle(desigObj.title);
    } else {
      setEditingDesig(null);
      setDesigTitle('');
    }
    setIsDesigModalOpen(true);
  };

  const handleSaveDesig = async (e) => {
    e.preventDefault();
    if (!desigTitle) return;
    try {
      if (editingDesig) {
        await masterService.updateDesignation(editingDesig.id, desigTitle, masters.departments[0]?.id);
      } else {
        await masterService.addDesignation(desigTitle, masters.departments[0]?.id);
      }
      setIsDesigModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save designation.');
    }
  };

  const handleDeleteDesig = async (desigId) => {
    if (!window.confirm('Delete this designation entry?')) return;
    try {
      await masterService.deleteDesignation(desigId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete designation.');
    }
  };

  if (loading || !masters) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Master Management...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Master Management Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete management with Edit ✏️ and Delete 🗑️ capabilities for Users, Departments, and Designations
          </p>
        </div>

        {activeTab === 'Users' && (
          <button
            onClick={() => handleOpenUserModal(null)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create User / Employee</span>
          </button>
        )}
        {activeTab === 'Departments' && (
          <button
            onClick={() => handleOpenDeptModal(null)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        )}
        {activeTab === 'Designations' && (
          <button
            onClick={() => handleOpenDesigModal(null)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Designation</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('Users')}
          className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'Users'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Creation & Access</span>
        </button>

        <button
          onClick={() => setActiveTab('Departments')}
          className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'Departments'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments</span>
        </button>

        <button
          onClick={() => setActiveTab('Designations')}
          className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'Designations'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Designations</span>
        </button>

        <button
          onClick={() => setActiveTab('WorkingDayCalendar')}
          className={`flex items-center space-x-2 px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
            activeTab === 'WorkingDayCalendar'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Working Day Calendar</span>
        </button>
      </div>

      {/* 1. USERS TAB TABLE WITH EDIT & DELETE */}
      {activeTab === 'Users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-24">Action</th>
                  <th className="px-4 py-3.5">Emp ID</th>
                  <th className="px-4 py-3.5">Employee Name</th>
                  <th className="px-4 py-3.5">Email / Mobile</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5 text-center">Self Assign</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    {/* ACTION COLUMN FOR USERS */}
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenUserModal(u)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-slate-500">{u.employee_id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <img
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.full_name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <p>{u.full_name}</p>
                        <span className="text-[10px] text-slate-400 font-normal">{u.designation}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <div>{u.email}</div>
                      <span className="text-[10px] text-slate-400">{u.mobile || 'No Mobile'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{u.department_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleSelfAssign(u.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          u.self_assign_enabled !== false
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-300'
                        }`}
                        title="Click to toggle self task assignment"
                      >
                        {u.self_assign_enabled !== false ? 'Enabled ✓' : 'Disabled ✗'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DEPARTMENTS TAB TABLE WITH EDIT & DELETE */}
      {activeTab === 'Departments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-24">Action</th>
                  <th className="px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Department Name</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {masters.departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {/* ACTION COLUMN FOR DEPARTMENTS */}
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenDeptModal(d)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                          title="Edit Department"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(d.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                          title="Delete Department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-indigo-600">{d.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{d.name}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">{d.status || 'Active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. DESIGNATIONS TAB TABLE WITH EDIT & DELETE */}
      {activeTab === 'Designations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-24">Action</th>
                  <th className="px-4 py-3.5">Designation Title</th>
                  <th className="px-4 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {masters.designations.map((des) => (
                  <tr key={des.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {/* ACTION COLUMN FOR DESIGNATIONS */}
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenDesigModal(des)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                          title="Edit Designation"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDesig(des.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                          title="Delete Designation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{des.title}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">{des.status || 'Active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. WORKING DAY CALENDAR TAB */}
      {activeTab === 'WorkingDayCalendar' && (
        <WorkingDayCalendarMaster />
      )}

      {/* User Edit / Create Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Edit Employee Profile' : 'Create New Employee'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {/* Avatar Upload to Profile_Images Bucket */}
          <div className="flex items-center space-x-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative w-14 h-14 shrink-0">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt="Profile"
                className={`w-14 h-14 rounded-xl object-cover ring-2 ring-indigo-500/20 shadow-xs ${avatarUploading ? 'opacity-30' : ''}`}
              />
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                Profile Photo
              </label>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-2">
                <span>Uploads to bucket:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                  {PROFILE_BUCKET}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatarUploading ? 'Uploading...' : 'Upload to Bucket'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={avatarUploading}
                    onChange={handleUserAvatarUpload}
                    className="hidden"
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {avatarError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start space-x-2 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px]">
                <p className="font-bold">{avatarError}</p>
                {avatarError.includes('RLS') && (
                  <p className="mt-0.5 text-slate-500">
                    Supabase Storage RLS policy needs to be enabled for bucket '{PROFILE_BUCKET}'.
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                placeholder="ramesh@corporate.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation Title</label>
            <input
              type="text"
              placeholder="e.g. Operations Associate"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selfAssignEnabled}
                onChange={(e) => setSelfAssignEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Enable Self Assignment Permission
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Allows this user to assign tasks to themselves
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20"
            >
              {editingUser ? 'Save Profile Changes' : 'Save Employee User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Department Edit / Create Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Add Department'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Quality Assurance"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. QA"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white uppercase"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Designation Edit / Create Modal */}
      <Modal
        isOpen={isDesigModalOpen}
        onClose={() => setIsDesigModalOpen(false)}
        title={editingDesig ? 'Edit Designation' : 'Add Designation'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveDesig} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Lead Auditor"
              value={desigTitle}
              onChange={(e) => setDesigTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDesigModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20"
            >
              Save Designation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
