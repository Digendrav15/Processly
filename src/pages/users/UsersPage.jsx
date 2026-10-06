import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { Modal } from '../../components/common/Modal';
import { DEPARTMENTS } from '../../config/constants';
import {
  Users,
  Plus,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertCircle,
  Edit2,
  Upload,
  Loader2,
  Camera,
} from 'lucide-react';
import { storageService, PROFILE_BUCKET } from '../../services/storageService';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [departmentId, setDepartmentId] = useState('dept-ops');
  const [designation, setDesignation] = useState('Operations Associate');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setMobile('');
    setRole('EMPLOYEE');
    setDepartmentId('dept-ops');
    setDesignation('Operations Associate');
    setAvatarUrl('');
    setAvatarError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (userObj) => {
    setEditingUser(userObj);
    setFullName(userObj.full_name || '');
    setEmail(userObj.email || '');
    setMobile(userObj.mobile || userObj.phone || '');
    setRole(userObj.role || 'EMPLOYEE');
    setDepartmentId(userObj.department_id || 'dept-ops');
    setDesignation(userObj.designation || 'Operations Associate');
    setAvatarUrl(userObj.avatar_url || '');
    setAvatarError('');
    setIsModalOpen(true);
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
        editingUser?.id || editingUser?.employee_id || 'employee'
      );
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Failed to upload user image to Profile_Images:', err);
      setAvatarError(err.message || 'Failed to upload user profile image to bucket.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmitUser = async (e) => {
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
          avatar_url: avatarUrl,
        });
      }

      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to save user');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await userService.toggleUserStatus(userId);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            User Management & Employee Access
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage employee profiles, assign roles, departments, designations, update profile images in "{PROFILE_BUCKET}" bucket, and activate/deactivate accounts
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Emp ID</th>
                  <th className="px-4 py-3.5">Employee Name</th>
                  <th className="px-4 py-3.5">Email / Mobile</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-500">{u.employee_id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center space-x-2.5">
                      <img
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.full_name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
                      />
                      <div>
                        <p>{u.full_name}</p>
                        <span className="text-[10px] text-slate-400 font-normal">{u.designation}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <div>{u.email}</div>
                      <span className="text-[10px] text-slate-400">{u.mobile || u.phone || 'No Mobile'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{u.department_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN' || u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : u.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                          title="Edit User Profile & Photo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                            u.is_active
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Employee Profile' : 'Add New Employee'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitUser} className="space-y-4">
          {/* Avatar Upload Section - Saves to Profile_Images bucket */}
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
                  <span>{avatarUploading ? 'Uploading...' : 'Upload Image'}</span>
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
                    Storage RLS policy needs to be enabled for bucket '{PROFILE_BUCKET}'.
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
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
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
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

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={avatarUploading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20"
            >
              {editingUser ? 'Update Employee' : 'Save Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
