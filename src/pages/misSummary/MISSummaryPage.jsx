import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Printer,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  UserCheck,
  Eye,
  X,
  FileSpreadsheet,
  CheckSquare
} from 'lucide-react';
import { misSummaryService } from '../../services/misSummaryService';
import { exportService } from '../../services/exportService';
import { formatShortDate } from '../../services/tatCalculationService';

export function MISSummaryPage() {
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const activeView = viewParam === 'tasks' ? 'tasks' : 'users';

  const [data, setData] = useState({ users: [], allActivities: [], metrics: {} });
  const [loading, setLoading] = useState(true);
  const [systemFilter, setSystemFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected user for task drilldown modal
  const [selectedUserModal, setSelectedUserModal] = useState(null);

  useEffect(() => {
    loadMISData();
  }, [systemFilter]);

  const loadMISData = async () => {
    setLoading(true);
    try {
      const res = await misSummaryService.getAllUsersAndScoring(systemFilter);
      setData(res);
    } catch (err) {
      console.error('Failed to load MIS summary data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Users list
  const filteredUsers = useMemo(() => {
    return (data.users || []).filter((u) => {
      if (departmentFilter !== 'ALL' && u.department !== departmentFilter) return false;
      if (gradeFilter !== 'ALL' && u.grade !== gradeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          u.userName?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.users, departmentFilter, gradeFilter, searchTerm]);

  // Unique departments for filter dropdown
  const departmentsList = useMemo(() => {
    const set = new Set((data.users || []).map((u) => u.department).filter(Boolean));
    return Array.from(set);
  }, [data.users]);

  // Export handlers
  const handleExportCSV = () => {
    const rows = filteredUsers.map((u) => ({
      'Employee Name': u.userName,
      'Role': u.role,
      'Department': u.department,
      'Total Tasks Handled': u.totalTasks,
      'On Time Completed': u.completedOnTime,
      'Delayed Completed': u.completedDelayed,
      'Pending / Overdue': u.pendingTasks,
      'Average Delay (Days)': u.avgDelayDays,
      'MIS Timeliness Score (%)': `${u.overallScore}%`,
      'Performance Grade': `${u.grade} - ${u.gradeText}`
    }));
    exportService.exportToCSV(rows, 'MIS_Summary_User_Scoring_Report.csv');
  };

  const handleExportExcel = () => {
    const rows = filteredUsers.map((u) => ({
      'Employee Name': u.userName,
      'Role': u.role,
      'Department': u.department,
      'Total Tasks Handled': u.totalTasks,
      'On Time Completed': u.completedOnTime,
      'Delayed Completed': u.completedDelayed,
      'Pending / Overdue': u.pendingTasks,
      'Average Delay (Days)': u.avgDelayDays,
      'MIS Timeliness Score (%)': `${u.overallScore}%`,
      'Performance Grade': `${u.grade} - ${u.gradeText}`
    }));
    exportService.exportToExcel(rows, 'MIS_Summary_User_Scoring_Report.xlsx');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-4 sm:p-5 rounded-2xl text-white shadow-lg border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-[11px] uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              Executive MIS Summary & Scoring Engine
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-[10px]">
              Multi-System TAT Audit
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
            MIS Summery & User Task Scoring
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Turnaround Time (TAT) efficiency report and performance scoring across Checklist & Delegation, Order To Delivery, Purchase System, Lead To Order, and HR System evaluated on{' '}
            <strong className="text-amber-300 font-bold">[ Planned Date, Actual Date, Time Delay ]</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Users Evaluated */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Users Evaluated</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {data.metrics?.totalUsers || filteredUsers.length}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Active roster across 5 systems</span>
        </div>

        {/* Card 2: Total Activities */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tasks & Stages</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {data.metrics?.totalActivitiesCount || 0}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            {data.metrics?.totalCompleted || 0} Completed ({Math.round(((data.metrics?.totalCompleted || 0) / Math.max(1, data.metrics?.totalActivitiesCount || 1)) * 100)}%)
          </span>
        </div>

        {/* Card 3: Delayed Actions */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delayed Actions</span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/60 rounded-lg text-rose-600 dark:text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {data.metrics?.totalDelayed || 0}
          </div>
          <span className="text-[10px] text-rose-500 font-medium">Exceeded stage planned date</span>
        </div>

        {/* Card 4: Avg MIS Score */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Org Timeliness Score</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {data.metrics?.avgOrgScore || 100}%
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Weighted Planned vs Actual TAT</span>
        </div>
      </div>

      {/* Filter Toolbar & View Switcher */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Active View Indicator */}
        <div className="flex items-center space-x-2">
          {activeView === 'users' ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-xs">
              <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>User Scoring Report ({filteredUsers.length} Users)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>All Tasks TAT Audit Log ({data.allActivities?.length || 0})</span>
            </span>
          )}
        </div>

        {/* Right: Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* System Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">System:</span>
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All 5 Systems</option>
              <option value="checklist">Checklist & Delegation</option>
              <option value="sales">Order To Delivery</option>
              <option value="purchase">Purchase System</option>
              <option value="lead-to-orders">Lead To Order</option>
              <option value="hr">HR System</option>
            </select>
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Performance Grades</option>
            <option value="A+">Grade A+ (Star Performer 90-100%)</option>
            <option value="A">Grade A (Excellent 80-89%)</option>
            <option value="B">Grade B (Good 70-79%)</option>
            <option value="C">Grade C (Needs Improvement)</option>
            <option value="D">Grade D (Critical Delay)</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 w-40 sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border">
          Aggregating user reports and scoring TAT metrics across 5 systems...
        </div>
      ) : activeView === 'users' ? (
        /* USER-WISE SCORING TABLE */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                User Scoring & Performance Register
              </h3>
              <span className="text-[11px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold rounded-full">
                {filteredUsers.length} Users
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Evaluated strictly on: <strong>[ Planned Date , Actual Date , Time Delay ]</strong>
            </span>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-230px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-black bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Employee / User</th>
                  <th className="py-2.5 px-3">Role & Dept</th>
                  <th className="py-2.5 px-3 text-center">Tasks Handled</th>
                  <th className="py-2.5 px-3 text-center">On Time</th>
                  <th className="py-2.5 px-3 text-center">Delayed</th>
                  <th className="py-2.5 px-3 text-center">Pending / Overdue</th>
                  <th className="py-2.5 px-3 text-center">Avg Time Delay</th>
                  <th className="py-2.5 px-3">Scoring (0-100)</th>
                  <th className="py-2.5 px-3 text-center">Performance Grade</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-xs text-slate-400">
                      No users match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.userId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* User Info */}
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={
                              u.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.userName)}`
                            }
                            alt={u.userName}
                            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border shrink-0 object-cover"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block text-[11.5px]">
                              {u.userName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {u.user?.employee_id || u.userId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px]">
                          {u.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {u.department}
                        </span>
                      </td>

                      {/* Total Tasks */}
                      <td className="py-2 px-3 text-center font-black text-slate-800 dark:text-slate-200 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          {u.totalTasks}
                        </span>
                      </td>

                      {/* On Time */}
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold text-[10px]">
                          {u.completedOnTime}
                        </span>
                      </td>

                      {/* Delayed */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.completedDelayed > 0
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {u.completedDelayed}
                        </span>
                      </td>

                      {/* Pending / Overdue */}
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-semibold text-[10px]">
                          {u.pendingTasks}
                          {u.overduePending > 0 ? ` (${u.overduePending} Overdue)` : ''}
                        </span>
                      </td>

                      {/* Avg Delay */}
                      <td className="py-2 px-3 text-center font-mono font-bold text-xs">
                        <span
                          className={
                            parseFloat(u.avgDelayDays) > 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {u.avgDelayDays} d
                        </span>
                      </td>

                      {/* Score Progress Bar */}
                      <td className="py-2 px-3 w-40">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-extrabold">
                            <span className="text-slate-500">Score</span>
                            <span
                              className={
                                u.overallScore >= 80
                                  ? 'text-emerald-600 font-black'
                                  : u.overallScore >= 60
                                  ? 'text-blue-600 font-black'
                                  : 'text-rose-600 font-black'
                              }
                            >
                              {u.overallScore} / 100
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                u.overallScore >= 85
                                  ? 'bg-emerald-500'
                                  : u.overallScore >= 70
                                  ? 'bg-blue-500'
                                  : u.overallScore >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${u.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Grade Badge */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${u.gradeColor}`}
                        >
                          {u.grade} • {u.gradeText}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => setSelectedUserModal(u)}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Audit Tasks</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ALL TASKS TAT AUDIT TABLE */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-4 py-2.5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
            <h3 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Comprehensive Multi-System Task & Stage Audit List ({data.allActivities?.length || 0})
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              Columns strictly verifying: Planned Date, Actual Date, and Time Delay
            </span>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-230px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-black bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Entity / Code</th>
                  <th className="py-2.5 px-3">Title & Details</th>
                  <th className="py-2.5 px-3">System</th>
                  <th className="py-2.5 px-3">Workflow Stage</th>
                  <th className="py-2.5 px-3">Responsible User</th>
                  <th className="py-2.5 px-3 text-center">Planned Date</th>
                  <th className="py-2.5 px-3 text-center">Actual Date</th>
                  <th className="py-2.5 px-3 text-center">Time Delay</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {(data.allActivities || []).map((act) => (
                  <tr
                    key={act.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {act.code}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {act.title}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-[10px]">
                        {act.system}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {act.stage}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {act.assignedToName}
                    </td>
                    <td className="py-2 px-3 text-center font-medium text-slate-600 dark:text-slate-400">
                      {formatShortDate(act.plannedDate)}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-900 dark:text-white">
                      {formatShortDate(act.actualDate)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          act.isDelayed
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                        }`}
                      >
                        {act.timeDelay}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-black">
                      <span
                        className={
                          act.score >= 80
                            ? 'text-emerald-600'
                            : act.score >= 50
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }
                      >
                        {act.score}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                          act.isCompleted
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USER AUDIT DRILLDOWN MODAL */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    selectedUserModal.avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedUserModal.userName)}`
                  }
                  alt={selectedUserModal.userName}
                  className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedUserModal.userName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${selectedUserModal.gradeColor}`}
                    >
                      Score: {selectedUserModal.overallScore}% ({selectedUserModal.grade})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedUserModal.role} • {selectedUserModal.department} • Total Handled:{' '}
                    <strong>{selectedUserModal.tasks?.length || 0}</strong> tasks & stage operations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Task List */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">On Time Done</span>
                  <span className="text-base font-black text-emerald-600">
                    {selectedUserModal.completedOnTime}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Delayed Done</span>
                  <span className="text-base font-black text-rose-600">
                    {selectedUserModal.completedDelayed}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending / Overdue</span>
                  <span className="text-base font-black text-amber-600">
                    {selectedUserModal.pendingTasks}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Average Delay</span>
                  <span className="text-base font-black text-slate-800 dark:text-slate-200">
                    {selectedUserModal.avgDelayDays} Days
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 font-extrabold text-xs text-slate-800 dark:text-slate-200 flex justify-between items-center">
                  <span>Task & Stage Performance Breakdown</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Scoring based on [ Planned Date , Actual Date , Time Delay ]
                  </span>
                </div>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 border-b text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Code / Ref</th>
                        <th className="py-2 px-3">Task Title / Operation</th>
                        <th className="py-2 px-3">System</th>
                        <th className="py-2 px-3 text-center">Planned Date</th>
                        <th className="py-2 px-3 text-center">Actual Date</th>
                        <th className="py-2 px-3 text-center">Time Delay</th>
                        <th className="py-2 px-3 text-center">Task Score</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedUserModal.tasks?.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {t.code}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                            {t.title}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-semibold">
                              {t.system}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-medium text-slate-600 dark:text-slate-400">
                            {formatShortDate(t.plannedDate)}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-900 dark:text-white">
                            {formatShortDate(t.actualDate)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                t.isDelayed
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                              }`}
                            >
                              {t.timeDelay}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-black">
                            <span
                              className={
                                t.score >= 80
                                  ? 'text-emerald-600'
                                  : t.score >= 50
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                              }
                            >
                              {t.score} / 100
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                t.isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
