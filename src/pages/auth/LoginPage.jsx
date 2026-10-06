import React, { useState } from 'react';
<<<<<<< HEAD
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, ShieldAlert, Users, UserCheck, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@corporate.com');
  const [password, setPassword] = useState('password123');
=======
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Layers,
  Sparkles,
  KeyRound
} from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
>>>>>>> daf8de7 ( .gitignore update)
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
=======
    if (!identifier.trim() || !password) {
      setError('Please provide both Email/Employee ID and Password.');
      return;
    }

>>>>>>> daf8de7 ( .gitignore update)
    setLoading(true);
    setError('');

    try {
<<<<<<< HEAD
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/dashboard');
      else if (user.role === 'MANAGER') navigate('/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleLogin = async (role) => {
    setLoading(true);
    try {
      await switchRole(role);
      navigate('/dashboard');
    } catch (err) {
      setError('Role switch failed');
=======
      const loggedUser = await login(identifier.trim(), password);
      // Seamlessly redirect to main dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please verify your Email/Employee ID and Password.');
>>>>>>> daf8de7 ( .gitignore update)
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Processly</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Checklist & Delegation Management System
          </p>
        </div>

        {/* Quick Demo Login Preset Buttons */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider">
            Quick One-Click Demo Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickRoleLogin('ADMIN')}
              className="py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickRoleLogin('MANAGER')}
              className="py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all"
            >
              Manager
            </button>
            <button
              onClick={() => handleQuickRoleLogin('EMPLOYEE')}
              className="py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all"
            >
              Employee
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center space-x-2 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Corporate Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-slate-600 dark:text-slate-400">Remember Me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Account'}
          </button>
        </form>
=======
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:1.5s]" />
      <div className="absolute -top-32 right-1/3 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Glassmorphic Login Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl p-7 sm:p-9 space-y-6">
          
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/10">
                <Building2 className="w-7 h-7" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center" title="Live Database Connected">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h1 className="text-2xl font-black text-white tracking-tight">Processly</h1>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ERP
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Enterprise Multi-System & Operations Platform
              </p>
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs rounded-2xl flex items-start gap-2.5 shadow-inner animate-in fade-in-50 duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Secure Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Employee ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 tracking-wide">
                Corporate Email / Employee ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. admin@processly.com or EMP-001"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-800/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 tracking-wide">
                  Password
                </label>
                <span className="text-[11px] text-slate-500">
                  Plain text verified
                </span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-800/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <span className="text-xs font-medium text-slate-400">Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/45 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Supabase User Auth
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              RBAC Multi-System
            </span>
          </div>

        </div>

        {/* Bottom System Subtext */}
        <p className="text-center text-slate-600 text-[11px] mt-4">
          Processly ERP Operations Hub • Cross-Module Central Access
        </p>
>>>>>>> daf8de7 ( .gitignore update)
      </div>
    </div>
  );
}
