import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_USERS } from '../../services/mockData';
import { leaveService } from '../../services/leaveService';
import { SYSTEMS_CONFIG } from '../../config/systemsConfig';
import { TaskCalendarView } from '../../components/calendar/TaskCalendarView';
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
  Sparkles,
  Loader2,
  PartyPopper,
  CalendarDays,
  Search,
  Filter
} from 'lucide-react';
import { storageService, PROFILE_BUCKET } from '../../services/storageService';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS } from '../../services/otdStorageService';
import { holidayService } from '../../services/holidayService';

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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const fileInputRef = useRef(null);

  // Active Tab for Portal Forms: 'leave' | 'advance' | 'holidays' | 'calendar'
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeFormTab, setActiveFormTab] = useState(
    tabParam && ['leave', 'advance', 'holidays', 'calendar'].includes(tabParam) ? tabParam : 'leave'
  );

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['leave', 'advance', 'holidays', 'calendar'].includes(t)) {
      setActiveFormTab(t);
    }
  }, [searchParams]);

  // Company Holidays configured by Admin
  const holidays = useOTDStorage(STORAGE_KEYS.HOLIDAYS, holidayService.getHolidaysSync());
  const [holidaySearch, setHolidaySearch] = useState('');
  const [holidayTypeFilter, setHolidayTypeFilter] = useState('ALL');

  // Helper for holiday countdown
  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const sortedHolidays = [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextHoliday = sortedHolidays.find((h) => {
    const d = getDaysRemaining(h.date);
    return d !== null && d >= 0;
  });

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

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again if needed
    e.target.value = '';

    setAvatarUploading(true);
    setAvatarError('');
    setSavedMessage('');

    try {
      // 1. Upload to Supabase 'Profile_Images' bucket and update user profile in DB
      const { publicUrl } = await storageService.updateUserAvatar(user?.id, file, true);
      setAvatarUrl(publicUrl);
      setSavedMessage(`Profile image uploaded to "${PROFILE_BUCKET}" bucket & saved!`);
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err) {
      console.error('Failed to upload avatar to Profile_Images:', err);
      // Fallback: If RLS blocked, show a detailed message
      setAvatarError(err.message || 'Failed to upload image to Profile_Images bucket.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setAvatarError('');
    try {
      await updateProfile({ full_name: fullName, mobile, avatar_url: avatarUrl });
      setSavedMessage('Profile details saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      setAvatarError(err.message || 'Failed to save profile changes');
    }
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
                  className={`w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md transition-all group-hover:opacity-90 ${avatarUploading ? 'opacity-40 animate-pulse' : ''}`}
                />
                {avatarUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl text-white">
                    <Loader2 className="w-6 h-6 animate-spin text-white mb-1" />
                    <span className="text-[9px] font-bold">Uploading...</span>
                  </div>
                )}
                <button
                  type="button"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  title={`Change Profile Picture (Saves to ${PROFILE_BUCKET} bucket)`}
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

              {/* Bucket info indicator */}
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-medium">
                <span>Storage Bucket:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{PROFILE_BUCKET}</span>
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

            {avatarError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start space-x-2 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <p className="font-bold">{avatarError}</p>
                  {avatarError.includes('RLS') && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      Run the Storage RLS policy in Supabase SQL Editor to allow public uploads to bucket '{PROFILE_BUCKET}'.
                    </p>
                  )}
                </div>
              </div>
            )}

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

          {/* INTERACTIVE DATE-WISE TASK CALENDAR QUICK WIDGET */}
          <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200 dark:border-indigo-900/60 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">Date-Wise Task Calendar</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Schedule
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              View your daily checklists, unique tasks, and delegated work items arranged by date.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFormTab('calendar');
                setSearchParams({ tab: 'calendar' });
              }}
              className="w-full mt-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>View Date-Wise Calendar</span>
            </button>
          </div>

          {/* UPCOMING COMPANY HOLIDAY QUICK WIDGET */}
          <div className="bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-rose-200 dark:border-rose-900/60 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
                <PartyPopper className="w-4 h-4" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider">Next Official Holiday</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                Gazetted
              </span>
            </div>

            {nextHoliday ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                      {nextHoliday.name}
                    </p>
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                      {new Date(nextHoliday.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                    {(() => {
                      const days = getDaysRemaining(nextHoliday.date);
                      if (days === 0) return 'Today 🎉';
                      if (days === 1) return 'Tomorrow';
                      return `In ${days} days`;
                    })()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFormTab('holidays');
                    setSearchParams({ tab: 'holidays' });
                  }}
                  className="w-full mt-1 py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View All Holidays ({holidays.length})</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No upcoming holidays scheduled by Admin.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FORMS & CALENDAR */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs for Forms */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setActiveFormTab('calendar');
                setSearchParams({ tab: 'calendar' });
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${activeFormTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Date-Wise Task Calendar</span>
            </button>

            <button
              onClick={() => {
                setActiveFormTab('leave');
                setSearchParams({ tab: 'leave' });
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${activeFormTab === 'leave'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <Plane className="w-4 h-4" />
              <span>Leave Request Form</span>
            </button>

            <button
              onClick={() => {
                setActiveFormTab('advance');
                setSearchParams({ tab: 'advance' });
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${activeFormTab === 'advance'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Advance Request</span>
            </button>

            <button
              onClick={() => {
                setActiveFormTab('holidays');
                setSearchParams({ tab: 'holidays' });
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all cursor-pointer ${activeFormTab === 'holidays'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
            >
              <PartyPopper className="w-4 h-4 text-rose-500" />
              <span>Official Holidays ({holidays.length})</span>
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

          {/* TAB 3: COMPANY & GAZETTED HOLIDAYS TAB */}
          {activeFormTab === 'holidays' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/60 shadow-xs">
                      <PartyPopper className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          Official Company Holidays Calendar
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Live Admin Gazette
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Gazetted and corporate holidays published by company administration. These dates are non-working days for team task delegation.
                      </p>
                    </div>
                  </div>

                  {nextHoliday && (
                    <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 rounded-2xl shrink-0">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">
                        Upcoming Next
                      </p>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                        {nextHoliday.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {new Date(nextHoliday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' • '}
                        <strong className="text-rose-600 dark:text-rose-400">
                          {(() => {
                            const d = getDaysRemaining(nextHoliday.date);
                            if (d === 0) return 'Today!';
                            if (d === 1) return 'Tomorrow';
                            return `In ${d} days`;
                          })()}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>

                {/* Metrics Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Total Announced</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{holidays.length}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Upcoming</p>
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                      {holidays.filter((h) => {
                        const d = getDaysRemaining(h.date);
                        return d !== null && d >= 0;
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Past in Cycle</p>
                    <p className="text-lg font-black text-slate-600 dark:text-slate-400 mt-0.5">
                      {holidays.filter((h) => {
                        const d = getDaysRemaining(h.date);
                        return d !== null && d < 0;
                      }).length}
                    </p>
                  </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search holiday name or month..."
                      value={holidaySearch}
                      onChange={(e) => setHolidaySearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'Public Holiday', 'Company Holiday', 'Restricted Holiday'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setHolidayTypeFilter(type)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          holidayTypeFilter === type
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {type === 'ALL' ? 'All Types' : type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Holidays Cards List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Gazetted Holidays Schedule
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    Showing {sortedHolidays.filter((h) => {
                      if (holidayTypeFilter !== 'ALL' && h.type !== holidayTypeFilter) return false;
                      if (holidaySearch && !h.name?.toLowerCase().includes(holidaySearch.toLowerCase()) && !h.date?.includes(holidaySearch)) return false;
                      return true;
                    }).length} Holidays
                  </span>
                </div>

                {(() => {
                  const filtered = sortedHolidays.filter((h) => {
                    if (holidayTypeFilter !== 'ALL' && h.type !== holidayTypeFilter) return false;
                    if (holidaySearch && !h.name?.toLowerCase().includes(holidaySearch.toLowerCase()) && !h.date?.includes(holidaySearch)) return false;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center space-y-2">
                        <PartyPopper className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {holidaySearch || holidayTypeFilter !== 'ALL'
                            ? 'No holidays match your filter criteria'
                            : 'No company holidays configured yet'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          When the company administrator adds official holidays in Master System, they will automatically be displayed here.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filtered.map((hol) => {
                        const daysLeft = getDaysRemaining(hol.date);
                        const isUpcoming = daysLeft !== null && daysLeft >= 0;
                        const isToday = daysLeft === 0;
                        const dateObj = new Date(hol.date);

                        return (
                          <div
                            key={hol.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              isToday
                                ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 shadow-md ring-1 ring-emerald-400'
                                : isUpcoming
                                ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-900/60 shadow-xs'
                                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                            }`}
                          >
                            <div className="flex items-start sm:items-center space-x-3.5">
                              {/* Date Calendar Box */}
                              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border font-mono ${
                                isToday
                                  ? 'bg-emerald-500 text-white border-emerald-600'
                                  : isUpcoming
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                              }`}>
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                  {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                                <span className="text-lg font-black leading-none mt-0.5">
                                  {dateObj.getDate()}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">
                                  {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                              </div>

                              {/* Holiday Name and Details */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-black text-sm text-slate-900 dark:text-white">
                                    {hol.name}
                                  </h5>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    hol.type === 'Public Holiday'
                                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                      : hol.type === 'Company Holiday'
                                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                      : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                                  }`}>
                                    {hol.type || 'Public Holiday'}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {hol.description || (hol.type === 'Public Holiday' ? 'National Gazetted Holiday' : 'Official Corporate Holiday')}
                                  {' • '}
                                  <span className="font-mono text-[11px] font-medium">{hol.date}</span>
                                </p>
                              </div>
                            </div>

                            {/* Status & Relative Countdown */}
                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                              {isToday ? (
                                <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs animate-bounce">
                                  Today 🎉
                                </span>
                              ) : daysLeft === 1 ? (
                                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-xs">
                                  Tomorrow
                                </span>
                              ) : isUpcoming ? (
                                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 font-mono">
                                  In {daysLeft} days
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                  Passed
                                </span>
                              )}

                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                Official
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: DATE-WISE TASK CALENDAR */}
          {activeFormTab === 'calendar' && (
            <div className="space-y-4">
              <TaskCalendarView embedded={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
