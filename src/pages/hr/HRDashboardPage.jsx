import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Clock,
  DollarSign,
  UserPlus,
  CheckSquare,
  Plane,
  Receipt,
  LogOut,
  CreditCard,
  UserX,
  TrendingUp,
  ArrowRight,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Activity,
  Award,
  Sparkles
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import { HR_KEYS } from '../../services/hrStorageService';

export function HRDashboardPage() {
  const navigate = useNavigate();

  const indents = useHRStorage(HR_KEYS.INDENTS, []);
  const enquiries = useHRStorage(HR_KEYS.JOB_ENQUIRIES, []);
  const candidates = useHRStorage(HR_KEYS.CANDIDATES, []);
  const interviews = useHRStorage(HR_KEYS.INTERVIEWS, []);
  const offers = useHRStorage(HR_KEYS.OFFERS, []);
  const joinings = useHRStorage(HR_KEYS.JOININGS, []);
  const employees = useHRStorage(HR_KEYS.EMPLOYEES, []);
  const attendance = useHRStorage(HR_KEYS.ATTENDANCE, []);
  const leaves = useHRStorage(HR_KEYS.LEAVES, []);
  const payroll = useHRStorage(HR_KEYS.PAYROLL, []);
  const resignations = useHRStorage(HR_KEYS.RESIGNATIONS, []);
  const clearances = useHRStorage(HR_KEYS.CLEARANCE, []);
  const fnf = useHRStorage(HR_KEYS.FNF, []);
  const inactives = useHRStorage(HR_KEYS.INACTIVE_EMPLOYEES, []);
  const activityLogs = useHRStorage(HR_KEYS.ACTIVITY_LOGS, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // 15 Key Metrics
  const totalIndents = indents.length;
  const pendingIndentApprovals = indents.filter(i => i.status === 'Pending Approval').length;
  const openJobEnquiries = enquiries.filter(e => e.status !== 'Rejected' && e.status !== 'Selected').length;
  const totalCandidates = candidates.length;
  const totalInterviews = interviews.length;
  const selectedCandidates = interviews.filter(i => i.status === 'Selected').length;
  const pendingJoining = joinings.filter(j => j.status === 'Joining Pending').length;
  const activeEmployees = employees.filter(e => e.status === 'Active' || e.status === 'On Notice').length;
  const presentToday = attendance.filter(a => a.date === todayStr && a.status === 'Present').length;
  const onLeaveToday = leaves.filter(l => l.approvalStatus === 'Approved' && l.fromDate <= todayStr && l.toDate >= todayStr).length;
  const latestPayrollSpend = payroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const activeResignations = resignations.filter(r => r.status !== 'Rejected' && r.status !== 'Exit Completed').length;
  const exitPending = clearances.filter(c => c.status === 'Pending').length;
  const fnfPending = fnf.filter(f => f.status === 'Under Process' || f.status === 'Pending').length;
  const inactiveEmployees = inactives.length;

  const metricCards = [
    { label: 'Total Indents', value: totalIndents, icon: FileText, color: 'from-blue-500 to-indigo-600', link: '/hr/indent' },
    { label: 'Pending Indent Approvals', value: pendingIndentApprovals, icon: ShieldCheck, color: 'from-amber-500 to-orange-600', link: '/hr/indent-approval' },
    { label: 'Open Job Enquiries', value: openJobEnquiries, icon: Briefcase, color: 'from-violet-500 to-purple-600', link: '/hr/job-enquiry' },
    { label: 'Screened Candidates', value: totalCandidates, icon: UserCheck, color: 'from-cyan-500 to-blue-600', link: '/hr/candidate-screening' },
    { label: 'Interviews Scheduled', value: totalInterviews, icon: Clock, color: 'from-sky-500 to-cyan-600', link: '/hr/interviews' },
    { label: 'Selected Candidates', value: selectedCandidates, icon: Award, color: 'from-emerald-500 to-teal-600', link: '/hr/offer-approval' },
    { label: 'Pending Joining', value: pendingJoining, icon: UserPlus, color: 'from-teal-500 to-emerald-600', link: '/hr/joining' },
    { label: 'Active Employees', value: activeEmployees, icon: Users, color: 'from-indigo-500 to-blue-600', link: '/hr/active-employees' },
    { label: 'Attendance Today', value: `${presentToday} Present`, icon: CheckSquare, color: 'from-emerald-500 to-green-600', link: '/hr/attendance' },
    { label: 'On Leave Today', value: `${onLeaveToday} On Leave`, icon: Plane, color: 'from-rose-500 to-pink-600', link: '/hr/leave' },
    { label: 'Payroll Processed', value: `₹ ${(latestPayrollSpend / 100000).toFixed(1)} L`, icon: DollarSign, color: 'from-purple-500 to-indigo-600', link: '/hr/payroll' },
    { label: 'Resignations', value: activeResignations, icon: LogOut, color: 'from-orange-500 to-amber-600', link: '/hr/resignation' },
    { label: 'Exit Clearances', value: exitPending, icon: ShieldCheck, color: 'from-amber-500 to-rose-600', link: '/hr/clearance' },
    { label: 'F&F Pending', value: fnfPending, icon: CreditCard, color: 'from-rose-500 to-red-600', link: '/hr/fnf' },
    { label: 'Inactive Employees', value: inactiveEmployees, icon: UserX, color: 'from-slate-500 to-slate-700', link: '/hr/inactive-employees' },
  ];

  // Pipeline stages
  const pipelineStages = [
    { name: '1. Requirement', count: indents.length, color: 'bg-blue-500' },
    { name: '2. Sourcing', count: enquiries.length, color: 'bg-indigo-500' },
    { name: '3. Screening', count: candidates.length, color: 'bg-cyan-500' },
    { name: '4. Interview', count: interviews.length, color: 'bg-sky-500' },
    { name: '5. Offer Approved', count: offers.filter(o => o.approvalStatus === 'Approved').length, color: 'bg-teal-500' },
    { name: '6. Joining Pending', count: joinings.filter(j => j.status === 'Joining Pending').length, color: 'bg-emerald-500' },
    { name: '7. Active Staff', count: activeEmployees, color: 'bg-emerald-600' },
    { name: '8. Resigned / Exit', count: resignations.length, color: 'bg-amber-500' },
    { name: '9. F&F Settled', count: inactives.length, color: 'bg-slate-500' }
  ];

  // Upcoming Interviews
  const upcomingInterviews = interviews.slice(0, 4);

  // Upcoming Joining
  const upcomingJoiningList = joinings.filter(j => j.status === 'Joining Pending').slice(0, 4);

  // Recent Resignations
  const recentResignationsList = resignations.slice(0, 4);

  // Pending Approvals
  const pendingApprovals = [
    ...indents.filter(i => i.status === 'Pending Approval').map(i => ({ type: 'Manpower Indent', ref: i.indentNumber, title: `${i.designation} (${i.department})`, link: '/hr/indent-approval' })),
    ...offers.filter(o => o.approvalStatus === 'Pending Approval').map(o => ({ type: 'Salary Offer', ref: o.offerId, title: `${o.candidate} - ₹ ${Number(o.proposedSalary).toLocaleString('en-IN')}`, link: '/hr/offer-approval' })),
    ...leaves.filter(l => l.approvalStatus === 'Pending').map(l => ({ type: 'Leave Request', ref: l.employeeName, title: `${l.leaveType} (${l.numberOfDays} Days)`, link: '/hr/leave' }))
  ].slice(0, 4);

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-200 dark:border-cyan-800/80">
            HR FMS System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
            Human Resources Hub
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => navigate('/hr/indent')}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>+ Raise Indent</span>
          </button>
          <button
            onClick={() => navigate('/hr/active-employees')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employee Master</span>
          </button>
        </div>
      </div>

      {/* 15 Summary Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-cyan-300 dark:hover:border-cyan-700 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                  {card.label}
                </span>
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-xs shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View <ChevronRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage-wise HR Pipeline Funnel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              End-to-End HR Lifecycle Pipeline
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Workforce Active Retention: <strong className="text-emerald-600 dark:text-emerald-400">{activeEmployees > 0 ? ((activeEmployees / (activeEmployees + inactiveEmployees || 1)) * 100).toFixed(1) : 100}%</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 pt-1 text-center">
          {pipelineStages.map((stg, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="block text-[9px] font-bold text-slate-400 uppercase line-clamp-1">{stg.name}</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 block">{stg.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Section: Pending Approvals & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Pending HR Approvals</span>
              </h2>
              <p className="text-[11px] text-slate-400">Indents, salary proposals & leave requests waiting for sign-off</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {pendingApprovals.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                All requests reviewed. No pending approvals.
              </div>
            ) : (
              pendingApprovals.map((app, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(app.link)}
                  className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-between hover:bg-amber-100/50 cursor-pointer transition-colors text-xs"
                >
                  <div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200">
                      {app.type}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white mt-1">{app.title}</h4>
                    <span className="text-[10px] text-slate-400">Ref: {app.ref}</span>
                  </div>
                  <button className="px-3 py-1 bg-amber-500 text-white rounded-lg font-bold text-[10px] shadow-xs">
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" />
                <span>Upcoming Interviews</span>
              </h2>
              <p className="text-[11px] text-slate-400">Scheduled candidate technical and HR rounds</p>
            </div>
            <button
              onClick={() => navigate('/hr/interviews')}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingInterviews.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No interviews scheduled.
              </div>
            ) : (
              upcomingInterviews.map((int) => (
                <div
                  key={int.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{int.candidate}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      {int.interviewRound} ({int.interviewType})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Role: <strong>{int.designation}</strong> • Time: {int.interviewDate} @ {int.interviewTime}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/50">
                    <span>Interviewer: <strong>{int.interviewer}</strong></span>
                    <button
                      onClick={() => navigate(`/hr/interviews?interviewId=${int.interviewId}`)}
                      className="text-sky-600 font-bold hover:underline"
                    >
                      Open Evaluation
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Section: Upcoming Joining Dates & Recent Resignations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Joining Dates */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span>Upcoming Joining Dates</span>
              </h2>
              <p className="text-[11px] text-slate-400">Accepted candidates completing onboarding formalities</p>
            </div>
            <button
              onClick={() => navigate('/hr/joining')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Onboarding Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {upcomingJoiningList.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No pending joinings scheduled.
              </div>
            ) : (
              upcomingJoiningList.map((j) => (
                <div
                  key={j.id}
                  className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white">{j.candidateName}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded text-[10px]">
                      Joining: {j.joiningDate}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dept: <strong>{j.department}</strong> • Proposed ID: <strong>{j.employeeId}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[10px]">
                    <span className="text-slate-400">Offer CTC: ₹ {Number(j.salary).toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => navigate('/hr/joining')}
                      className="text-emerald-700 dark:text-emerald-400 font-extrabold hover:underline"
                    >
                      Complete Onboarding
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Resignations & Clearances */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <LogOut className="w-4 h-4 text-orange-500" />
                <span>Recent Resignations & Exit Tasks</span>
              </h2>
              <p className="text-[11px] text-slate-400">Staff serving notice period and departmental clearance</p>
            </div>
            <button
              onClick={() => navigate('/hr/resignation')}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Exit Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentResignationsList.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                No active resignations recorded.
              </div>
            ) : (
              recentResignationsList.map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-orange-50/40 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white">{res.employeeName} ({res.employeeId})</span>
                    <span className="font-bold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded text-[10px]">
                      {res.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dept: <strong>{res.department}</strong> • LWD: <strong>{res.lastWorkingDate}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    Reason: {res.reason}
                  </div>
                  <div className="flex justify-end pt-1 border-t border-orange-200/60 dark:border-orange-900/40 text-[10px]">
                    <button
                      onClick={() => navigate('/hr/clearance')}
                      className="text-orange-700 dark:text-orange-400 font-extrabold hover:underline"
                    >
                      Manage Clearance & F&F
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Activity / Audit History Stream */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" />
            <span>Recent HR Activity & Audit History</span>
          </h2>
          <span className="text-[11px] text-slate-400">LocalStorage persistent log</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {activityLogs.slice(0, 6).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100">{log.action}: </span>
                <span className="text-slate-600 dark:text-slate-300">{log.remarks || `${log.module} - ${log.recordId}`}</span>
                <div className="text-[10px] text-slate-400 mt-0.5">By {log.user} on {log.date} @ {log.time}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {log.module}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
