import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  Clock,
  Calendar,
  UserCheck,
  UserX,
  Building,
  User,
  AlertCircle,
  X,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  addActivityLog
} from '../../services/hrStorageService';

export function HRAttendancePage() {
  const { data: attendanceLogs, setItem: setAttendanceLogs } = useHRStorage(HR_KEYS.ATTENDANCE, []);
  const { data: employees } = useHRStorage(HR_KEYS.EMPLOYEES, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Mark attendance modal
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markData, setMarkData] = useState({
    employeeId: '',
    employeeName: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:15 AM',
    checkOut: '06:30 PM',
    status: 'Present',
    workHours: '9h 15m'
  });

  // Filter attendance
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter(log => {
      const matchesSearch =
        (log.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDate = !dateFilter || log.date === dateFilter;
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [attendanceLogs, searchTerm, dateFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const presentCount = attendanceLogs.filter(a => a.status === 'Present' || a.status === 'On-Time').length;
    const lateCount = attendanceLogs.filter(a => a.status === 'Late Arrival').length;
    const wfhCount = attendanceLogs.filter(a => a.status === 'WFH').length;
    const onTimeRate = attendanceLogs.length > 0 ? Math.round((presentCount / attendanceLogs.length) * 100) : 95;

    return {
      totalLogs: attendanceLogs.length,
      present: presentCount,
      late: lateCount,
      wfh: wfhCount,
      onTimeRate: `${onTimeRate}%`
    };
  }, [attendanceLogs]);

  // Handle Mark Attendance Submit
  const handleMarkSubmit = (e) => {
    e.preventDefault();
    if (!markData.employeeName.trim()) {
      alert('Please select an employee');
      return;
    }

    const newLog = {
      id: `ATT-${Date.now()}`,
      employeeId: markData.employeeId,
      employeeName: markData.employeeName,
      date: markData.date,
      checkIn: markData.checkIn,
      checkOut: markData.checkOut,
      workHours: markData.workHours || '9h 00m',
      status: markData.status
    };

    setAttendanceLogs([newLog, ...attendanceLogs]);
    addActivityLog('HR Attendance Officer', 'Manual Punch Marked', 'Attendance', markData.employeeId, null, markData.status, `Marked ${markData.status} for ${markData.employeeName}`);

    setShowMarkModal(false);
  };

  const handleSelectEmp = (empId) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) {
      setMarkData(prev => ({
        ...prev,
        employeeId: emp.employeeId,
        employeeName: emp.name
      }));
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-200 dark:border-cyan-800/80">
            HR FMS • Stage 9A
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Daily Attendance & Punch Register
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Total: <strong className="text-slate-900 dark:text-white">{stats.totalLogs}</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-emerald-600 dark:text-emerald-400">Present: <strong>{stats.present}</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-amber-600 dark:text-amber-400">Late: <strong>{stats.late}</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-cyan-600 dark:text-cyan-400">WFH: <strong>{stats.wfh}</strong></span>
          </div>

          <button
            onClick={() => setShowMarkModal(true)}
            className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Punch</span>
          </button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="All">All Statuses</option>
          <option value="Present">Present / On-Time</option>
          <option value="Late Arrival">Late Arrival</option>
          <option value="Half Day">Half Day</option>
          <option value="WFH">Work From Home</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      {/* Attendance Register High Density Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 px-3">Employee</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Check-In</th>
                <th className="py-2 px-3">Check-Out</th>
                <th className="py-2 px-3">Total Work Hours</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <p className="font-semibold">No attendance entries match filters</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr
                    key={log.id || idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Employee */}
                    <td className="py-1.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white text-[11.5px] flex items-center gap-1.5">
                        <span>{log.employeeName}</span>
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 text-[10px]">({log.employeeId})</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                      {log.date}
                    </td>

                    {/* Check In */}
                    <td className="py-1.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      {log.checkIn}
                    </td>

                    {/* Check Out */}
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-600 dark:text-slate-400 text-[11px]">
                      {log.checkOut || '--:--'}
                    </td>

                    {/* Work Hours */}
                    <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white text-[11px]">
                      {log.workHours}
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                          log.status === 'Present' || log.status === 'On-Time'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : log.status === 'Late Arrival'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : log.status === 'WFH'
                            ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Punch Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 rounded-xl">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Log Manual Punch</h3>
                  <p className="text-xs text-slate-400">Record check-in/out and shift attendance</p>
                </div>
              </div>
              <button
                onClick={() => setShowMarkModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Employee *
                </label>
                <select
                  value={markData.employeeId}
                  onChange={(e) => handleSelectEmp(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.employeeId} value={e.employeeId}>
                      {e.name} ({e.employeeId}) - {e.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={markData.date}
                    onChange={(e) => setMarkData({ ...markData, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Attendance Status *
                  </label>
                  <select
                    value={markData.status}
                    onChange={(e) => setMarkData({ ...markData, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Present">Present (On-Time)</option>
                    <option value="Late Arrival">Late Arrival</option>
                    <option value="Half Day">Half Day</option>
                    <option value="WFH">Work From Home</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="text"
                    value={markData.checkIn}
                    onChange={(e) => setMarkData({ ...markData, checkIn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Check-Out Time
                  </label>
                  <input
                    type="text"
                    value={markData.checkOut}
                    onChange={(e) => setMarkData({ ...markData, checkOut: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Save Punch Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
