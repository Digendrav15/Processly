import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_USERS } from '../../services/mockData';
import { leaveService } from '../../services/leaveService';
import { SYSTEMS_CONFIG } from '../../config/systemsConfig';
import {
  User,
  Mail,
  Save,
  CheckCircle2,
  Calendar,
  Plane,
  Send,
  AlertCircle,
  Clock,
  UserCheck,
  Camera,
  Upload,
  Lock,
  Eye,
  EyeOff,
  DollarSign,
  ShieldCheck,
  Building2,
  FileText,
  CreditCard,
  Layers,
  Sparkles
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
];

const LOCAL_ADVANCE_KEY = 'corporate_system_advance_requests';

export function ProfilePage() {
  const { user, updateProfile, isAdmin } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [savedMessage, setSavedMessage] = useState('');
  const fileInputRef = useRef(null);

  // Active Tab for Portal Forms: 'leave' | 'advance'
  const [activeFormTab, setActiveFormTab] = useState('leave');

  // Password Update States
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState(user?.password || '••••••••');
  const [confirmPassword, setConfirmPassword] = useState(user?.password || '••••••••');
  const [passwordFeedback, setPasswordFeedback] = useState('');

  // Leave Form States
  const [reason, setReason] = useState('');
  const [leaveDays, setLeaveDays] = useState('1 Day');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [wantTransfer, setWantTransfer] = useState(true);
  const [preferredSubstituteId, setPreferredSubstituteId] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');
  const [myLeaves, setMyLeaves] = useState([]);

  // Advance Form States
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceCategory, setAdvanceCategory] = useState('Salary Advance');
  const [requiredDate, setRequiredDate] = useState(new Date().toISOString().split('T')[0]);
  const [advanceReason, setAdvanceReason] = useState('');
  const [repaymentTenure, setRepaymentTenure] = useState('1 Month (Full deduction)');
  const [advanceRemarks, setAdvanceRemarks] = useState('');
  const [advanceSubmitting, setAdvanceSubmitting] = useState(false);
  const [advanceSuccess, setAdvanceSuccess] = useState('');
  const [advanceError, setAdvanceError] = useState('');
  const [myAdvances, setMyAdvances] = useState([]);

  useEffect(() => {
    if (user?.id) {
      setFullName(user.full_name || '');
      setMobile(user.mobile || '');
      setAvatarUrl(user.avatar_url || '');
      if (user.password) {
        setNewPassword(user.password);
        setConfirmPassword(user.password);
      }
      loadMyLeaves();
      loadMyAdvances();
      const fallback = INITIAL_USERS.find((u) => u.id !== user.id);
      if (fallback) setPreferredSubstituteId(fallback.id);
    }
  }, [user]);

  const loadMyLeaves = async () => {
    try {
      const data = await leaveService.getLeaveRequests({ userId: user?.id });
      setMyLeaves(data);
    } catch (err) {
      console.error('Failed to load leave history:', err);
    }
  };

  const loadMyAdvances = () => {
    try {
      const stored = localStorage.getItem(LOCAL_ADVANCE_KEY);
      const all = stored ? JSON.parse(stored) : [];
      setMyAdvances(all.filter((adv) => adv.userId === user?.id));
    } catch (e) {
      setMyAdvances([]);
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({ full_name: fullName, mobile, avatar_url: avatarUrl });
    setSavedMessage('Profile & picture updated successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordFeedback('Password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback('Passwords do not match!');
      return;
    }

    await updateProfile({ password: newPassword });
    setPasswordFeedback('Password updated successfully!');
    setTimeout(() => setPasswordFeedback(''), 3500);
  };

  // Leave Submit
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveError('');
    setLeaveSuccess('');

    if (!reason.trim()) {
      setLeaveError('Please enter reason for leave.');
      return;
    }
    if (!startDate || !endDate) {
      setLeaveError('Please select both Start Date and End Date.');
      return;
    }

    if (wantTransfer && !preferredSubstituteId) {
      setLeaveError('Please select an employee to transfer your tasks to.');
      return;
    }

    setLeaveSubmitting(true);
    try {
      await leaveService.createLeaveRequest(
        {
          reason,
          leave_days: leaveDays,
          start_date: startDate,
          end_date: endDate,
          want_transfer: wantTransfer,
          preferred_substitute_id: preferredSubstituteId,
        },
        user
      );

      setLeaveSuccess('Leave request submitted successfully! Awaiting Admin Approval.');
      setReason('');
      setLeaveDays('1 Day');
      loadMyLeaves();
      setTimeout(() => setLeaveSuccess(''), 4000);
    } catch (err) {
      setLeaveError(err.message || 'Failed to submit leave request.');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // Advance Submit
  const handleAdvanceSubmit = (e) => {
    e.preventDefault();
    setAdvanceError('');
    setAdvanceSuccess('');

    const amt = parseFloat(advanceAmount);
    if (!amt || amt <= 0) {
      setAdvanceError('Please enter a valid Advance Amount.');
      return;
    }
    if (!advanceReason.trim()) {
      setAdvanceError('Please specify the reason for advance request.');
      return;
    }

    setAdvanceSubmitting(true);
    try {
      const stored = localStorage.getItem(LOCAL_ADVANCE_KEY);
      const all = stored ? JSON.parse(stored) : [];

      const newAdvance = {
        id: `ADV-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: user?.id,
        userName: user?.full_name || 'Employee',
        employeeId: user?.employee_id || 'EMP-001',
        department: user?.department_name || 'Operations',
        amount: amt,
        category: advanceCategory,
        requiredDate,
        reason: advanceReason,
        repaymentTenure,
        remarks: advanceRemarks,
        status: 'Pending Approval',
        requestDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      const updated = [newAdvance, ...all];
      localStorage.setItem(LOCAL_ADVANCE_KEY, JSON.stringify(updated));

      setAdvanceSuccess(`Advance request for ₹${amt.toLocaleString('en-IN')} submitted successfully!`);
      setAdvanceAmount('');
      setAdvanceReason('');
      setAdvanceRemarks('');
      loadMyAdvances();
      setTimeout(() => setAdvanceSuccess(''), 4000);
    } catch (err) {
      setAdvanceError('Failed to submit advance request.');
    } finally {
      setAdvanceSubmitting(false);
    }
  };

  // Accessible Modules Determination
  const userAllowedModuleIds = user?.allowedModules || (isAdmin ? SYSTEMS_CONFIG.map((s) => s.id) : ['checklist', 'sales']);

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-8">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/80">
            Account Portal
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">User Profile & Requests</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Profile Card, Avatar Change, Password & Modules Access */}
        <div className="space-y-6">
          {/* Profile Details & Image Change */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5">
            <div className="text-center space-y-3">
              {/* Interactive Avatar with Upload Camera Overlay */}
              <div className="relative w-24 h-24 mx-auto group">
                <img
                  src={avatarUrl || user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={user?.full_name}
                  className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md transition-all group-hover:opacity-90"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  title="Change Profile Picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{user?.full_name}</h2>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{user?.designation || user?.role}</p>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">
                  {user?.employee_id} • {user?.department_name || 'General'}
                </span>
              </div>

              {/* Quick Preset Avatars Picker */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block mb-1.5 font-bold uppercase tracking-wider">
                  Quick Avatar Presets:
                </span>
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {PRESET_AVATARS.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Preset"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-7 h-7 rounded-lg object-cover cursor-pointer border-2 transition-all ${avatarUrl === url ? 'border-indigo-600 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {savedMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center space-x-2 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{savedMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Profile Image URL (Or Upload Above)</label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-800 dark:text-white"
                  />
                  <Upload
                    className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 cursor-pointer hover:text-indigo-600"
                    onClick={() => fileInputRef.current?.click()}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Corporate Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 border rounded-xl cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-800 dark:text-white font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Info</span>
              </button>
            </form>
          </div>

          {/* USER KA PASSWORD SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">User Password</h3>
            </div>
            <p className="text-xs text-slate-400">View or update your account login password.</p>

            {passwordFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 ${passwordFeedback.includes('successfully')
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordFeedback}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-xs text-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-xs text-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Update Password</span>
              </button>
            </form>
          </div>

          {/* JO MODULES KA ACCESS HAI WO SHOW KAREGA */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Accessible Modules</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {isAdmin ? 'All Permitted' : `${userAllowedModuleIds.length} Active`}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              System modules that your employee profile currently has access permission to:
            </p>

            <div className="space-y-2 text-xs">
              {SYSTEMS_CONFIG.map((sys) => {
                const Icon = sys.icon;
                const isAllowed = isAdmin || userAllowedModuleIds.includes(sys.id);

                return (
                  <div
                    key={sys.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isAllowed
                        ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-100/50 opacity-40 border-slate-200'
                      }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-lg ${isAllowed ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{sys.name}</p>
                        <p className="text-[10px] text-slate-400">{sys.badge}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                        }`}
                    >
                      {isAllowed ? 'Active Access' : 'No Access'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FORMS (LEAVE KA FORM & ADVANCE KA FORM) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs for Forms */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex space-x-2 border">
            <button
              onClick={() => setActiveFormTab('leave')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${activeFormTab === 'leave'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <Plane className="w-4 h-4" />
              <span>Leave Request Form</span>
            </button>

            <button
              onClick={() => setActiveFormTab('advance')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${activeFormTab === 'advance'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Advance Request </span>
            </button>
          </div>

          {/* TAB 1: LEAVE KA FORM */}
          {activeFormTab === 'leave' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Submit Leave Request</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Request leave and optionally nominate a substitute employee for task transfer.
                    </p>
                  </div>
                </div>

                {leaveError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center space-x-2 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{leaveError}</span>
                  </div>
                )}

                {leaveSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center space-x-2 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{leaveSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  {/* Prefilled Auto User Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      User Name (Auto-Prefilled)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.full_name || ''}
                      className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border rounded-xl cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reason of Leaving *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Enter detailed reason for leave (e.g., Family Function, Sick Leave, Urgent Work)..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Day of Leave *</label>
                      <select
                        value={leaveDays}
                        onChange={(e) => setLeaveDays(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                      >
                        <option value="Half Day">Half Day</option>
                        <option value="1 Day">1 Day</option>
                        <option value="2 Days">2 Days</option>
                        <option value="3 Days">3 Days</option>
                        <option value="4+ Days">4+ Days (Long Leave)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Task Transfer Preference */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border space-y-3">
                    <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
                      Kya aap apna task kisi user ko transfer karna chahte hain? *
                    </label>
                    <div className="flex items-center space-x-6 text-xs font-semibold">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="wantTransfer"
                          checked={wantTransfer === true}
                          onChange={() => setWantTransfer(true)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-slate-800 dark:text-slate-200">Yes, Transfer My Tasks</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="wantTransfer"
                          checked={wantTransfer === false}
                          onChange={() => setWantTransfer(false)}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-slate-600 dark:text-slate-400">No, Keep Tasks Pending</span>
                      </label>
                    </div>

                    {wantTransfer && (
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Select Preferred Substitute Employee *
                        </label>
                        <select
                          value={preferredSubstituteId}
                          onChange={(e) => setPreferredSubstituteId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border rounded-xl font-bold"
                        >
                          {INITIAL_USERS.filter((u) => u.id !== user?.id).map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name} ({u.role} - {u.department_name})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={leaveSubmitting}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center space-x-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{leaveSubmitting ? 'Submitting Request...' : 'Submit Leave Request'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Leave History */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>My Leave Request History</span>
                </h3>

                {myLeaves.length === 0 ? (
                  <p className="text-xs text-slate-400">No past leave requests submitted yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myLeaves.map((l) => (
                      <div key={l.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white">{l.leave_days}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 dark:text-slate-300 font-mono">
                              {l.start_date} to {l.end_date}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">{l.reason}</p>
                        </div>

                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${l.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : l.status === 'Rejected'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            {l.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADVANCE KA FORM */}
          {activeFormTab === 'advance' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Submit Advance Request</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Apply for salary advance, travel allowance or emergency funds approval.
                    </p>
                  </div>
                </div>

                {advanceError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center space-x-2 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{advanceError}</span>
                  </div>
                )}

                {advanceSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center space-x-2 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{advanceSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAdvanceSubmit} className="space-y-4 text-xs">
                  {/* Auto details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Employee Name</span>
                      <strong className="text-slate-900 dark:text-white">{user?.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Employee Code & Dept</span>
                      <strong className="text-indigo-600">{user?.employee_id} ({user?.department_name || 'Operations'})</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">Advance Amount Required (₹) *</label>
                      <input
                        type="number"
                        required
                        min="500"
                        placeholder="e.g. 15000"
                        value={advanceAmount}
                        onChange={(e) => setAdvanceAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-emerald-600 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Advance Category *</label>
                      <select
                        value={advanceCategory}
                        onChange={(e) => setAdvanceCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                      >
                        <option value="Salary Advance">Salary Advance</option>
                        <option value="Medical Emergency">Medical Emergency</option>
                        <option value="Travel & Conveyance">Travel & Conveyance</option>
                        <option value="Project Expense">Project Expense</option>
                        <option value="Festive Advance">Festive Advance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Required By Date *</label>
                      <input
                        type="date"
                        required
                        value={requiredDate}
                        onChange={(e) => setRequiredDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1">Repayment / Deduction Tenure</label>
                      <select
                        value={repaymentTenure}
                        onChange={(e) => setRepaymentTenure(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                      >
                        <option value="1 Month (Full deduction)">1 Month (Full deduction next salary)</option>
                        <option value="2 Months (50% each)">2 Months (50% each month)</option>
                        <option value="3 Months (Equated 33%)">3 Months (Equated 33% each month)</option>
                        <option value="6 Months (EMI Deduction)">6 Months (EMI Deduction)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Reason for Advance *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Explain the purpose and justification for the advance payment..."
                      value={advanceReason}
                      onChange={(e) => setAdvanceReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Additional Remarks / Bank Account Note</label>
                    <input
                      type="text"
                      placeholder="Optional notes or account details confirmation..."
                      value={advanceRemarks}
                      onChange={(e) => setAdvanceRemarks(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={advanceSubmitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-2 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>{advanceSubmitting ? 'Submitting Request...' : 'Submit Advance Request'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Advance History */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>My Advance Requests History</span>
                </h3>

                {myAdvances.length === 0 ? (
                  <p className="text-xs text-slate-400">No past advance requests submitted yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myAdvances.map((adv) => (
                      <div key={adv.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-emerald-600 text-sm">
                              ₹ {parseFloat(adv.amount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-bold text-slate-900 dark:text-white">{adv.category}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 font-mono text-[11px]">{adv.requestDate}</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">{adv.reason}</p>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            Tenure: {adv.repaymentTenure}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${adv.status === 'Approved' || adv.status === 'Disbursed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : adv.status === 'Rejected'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            {adv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
