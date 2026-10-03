import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Building,
  User,
  Mail,
  Phone,
  DollarSign,
  Award,
  CheckCircle2,
  Clock,
  Briefcase,
  FileText,
  CreditCard,
  ShieldCheck,
  Plane,
  X,
  MapPin,
  Heart,
  LogOut
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  generateEmployeeId,
  addActivityLog
} from '../../services/hrStorageService';

export function HRActiveEmployeesPage() {
  const { data: employees, setItem: setEmployees } = useHRStorage(HR_KEYS.EMPLOYEES, []);
  const { data: attendance } = useHRStorage(HR_KEYS.ATTENDANCE, []);
  const { data: leaves } = useHRStorage(HR_KEYS.LEAVES, []);
  const { data: payroll } = useHRStorage(HR_KEYS.PAYROLL, []);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [profileActiveTab, setProfileActiveTab] = useState('personal');

  // New employee form state
  const [formData, setFormData] = useState({
    name: '',
    department: 'Technology',
    designation: 'Senior Software Engineer',
    joiningDate: new Date().toISOString().split('T')[0],
    reportingManager: 'Amitabh Sharma',
    employmentType: 'Full-Time Regular',
    mobile: '+91 98765 43210',
    email: '',
    address: 'Bangalore, Karnataka',
    salary: 1200000,
    emergencyContact: 'Family Member - +91 98765 00000',
    bankName: 'HDFC Bank',
    accountNumber: '50100234567890',
    ifsc: 'HDFC0001234',
    pan: 'ABCDE1234F'
  });

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        (emp.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.email?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;
      const matchesType = employmentTypeFilter === 'All' || emp.employmentType === employmentTypeFilter;

      return matchesSearch && matchesDept && matchesType;
    });
  }, [employees, searchTerm, departmentFilter, employmentTypeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalPayroll = employees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
    const avgSalary = employees.length > 0 ? Math.round(totalPayroll / employees.length) : 0;
    return {
      total: employees.length,
      techCount: employees.filter(e => e.department?.includes('Tech') || e.department?.includes('IT')).length,
      fullTime: employees.filter(e => !e.employmentType || e.employmentType?.includes('Full')).length,
      avgSalary: `₹ ${(avgSalary / 100000).toFixed(1)} LPA`
    };
  }, [employees]);

  // Add Employee submit
  const handleAddEmployee = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter employee name');
      return;
    }

    const newEmpId = generateEmployeeId();
    const newEmp = {
      id: newEmpId,
      employeeId: newEmpId,
      name: formData.name.trim(),
      profilePhoto: '',
      department: formData.department,
      designation: formData.designation,
      joiningDate: formData.joiningDate,
      reportingManager: formData.reportingManager,
      employmentType: formData.employmentType,
      mobile: formData.mobile,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@taskflow.os`,
      address: formData.address,
      salary: Number(formData.salary) || 600000,
      emergencyContact: formData.emergencyContact,
      bankDetails: {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifsc: formData.ifsc,
        pan: formData.pan
      },
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    setEmployees([newEmp, ...employees]);
    addActivityLog('HR Admin', 'Employee Created', 'Employee', newEmpId, null, 'Active', `Direct entry: ${newEmp.name} (${newEmp.designation})`);

    setShowAddModal(false);
    setFormData({
      name: '',
      department: 'Technology',
      designation: 'Senior Software Engineer',
      joiningDate: new Date().toISOString().split('T')[0],
      reportingManager: 'Amitabh Sharma',
      employmentType: 'Full-Time Regular',
      mobile: '+91 98765 43210',
      email: '',
      address: 'Bangalore, Karnataka',
      salary: 1200000,
      emergencyContact: 'Family Member - +91 98765 00000',
      bankName: 'HDFC Bank',
      accountNumber: '50100234567890',
      ifsc: 'HDFC0001234',
      pan: 'ABCDE1234F'
    });
  };

  // Open 360 profile
  const handleOpenProfile = (emp) => {
    setSelectedEmployee(emp);
    setProfileActiveTab('personal');
    setShowProfileModal(true);
  };

  return (
    <div className="space-y-2.5">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-lg border border-cyan-100 dark:border-cyan-800">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                HR FMS • Stage 8
              </span>
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Active Employee Master Roster</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Stats Badges */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
            <span className="text-slate-500">Total: <strong className="text-slate-900 dark:text-white">{stats.total}</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-cyan-600 dark:text-cyan-400">Tech: <strong>{stats.techCount}</strong></span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-emerald-600 dark:text-emerald-400">FullTime: <strong>{stats.fullTime}</strong></span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* Compact Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name, ID, role or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="All">All Departments</option>
          <option value="Technology">Technology</option>
          <option value="Product & Design">Product & Design</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Finance & Accounts">Finance & Accounts</option>
          <option value="Sales & Marketing">Sales & Marketing</option>
        </select>

        <select
          value={employmentTypeFilter}
          onChange={(e) => setEmploymentTypeFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="All">All Types</option>
          <option value="Full-Time Regular">Full-Time Regular</option>
          <option value="Probationary">Probationary</option>
          <option value="Contractor">Contractor</option>
        </select>
      </div>

      {/* Employees High Density Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 px-3">Emp ID</th>
                <th className="py-2 px-3">Employee Details</th>
                <th className="py-2 px-3">Department & Role</th>
                <th className="py-2 px-3">Joining Date</th>
                <th className="py-2 px-3">Reporting Manager</th>
                <th className="py-2 px-3">Annual CTC</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold">No active employees found</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.employeeId || emp.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Emp ID */}
                    <td className="py-1.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">
                      {emp.employeeId}
                    </td>

                    {/* Employee Details */}
                    <td className="py-1.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11.5px]">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <span>{emp.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({emp.email})</span>
                      </div>
                    </td>

                    {/* Dept & Role */}
                    <td className="py-1.5 px-3 text-[11px]">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {emp.designation} <span className="text-slate-400">• {emp.department}</span>
                      </div>
                    </td>

                    {/* Joining Date */}
                    <td className="py-1.5 px-3 font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                      {emp.joiningDate || 'N/A'}
                    </td>

                    {/* Reporting Manager */}
                    <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                      {emp.reportingManager || 'Management'}
                    </td>

                    {/* Salary */}
                    <td className="py-1.5 px-3 font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      ₹ {Number(emp.salary || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-3">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{emp.status || 'Active'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-1.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenProfile(emp)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 rounded text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive 360° Employee Profile Modal */}
      {showProfileModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-cyan-500/20">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">{selectedEmployee.name}</h3>
                    <span className="font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
                      {selectedEmployee.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedEmployee.designation} • {selectedEmployee.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
              {[
                { key: 'personal', label: 'Personal & KYC', icon: User },
                { key: 'employment', label: 'Employment Info', icon: Briefcase },
                { key: 'salary', label: 'Compensation & Bank', icon: CreditCard },
                { key: 'attendance', label: 'Attendance & Leave', icon: Clock }
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setProfileActiveTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                      profileActiveTab === t.key
                        ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="text-xs space-y-4 min-h-[220px]">
              {profileActiveTab === 'personal' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Contact Mobile</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmployee.mobile || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Official Email</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmployee.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Residential Address</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{selectedEmployee.address || 'Bangalore, India'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Emergency Contact</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{selectedEmployee.emergencyContact || 'Family Member'}</p>
                    </div>
                  </div>
                </div>
              )}

              {profileActiveTab === 'employment' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Department</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Designation</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmployee.designation}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Date of Joining</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmployee.joiningDate}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Reporting Manager</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedEmployee.reportingManager || 'Leadership'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Employment Type</span>
                      <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{selectedEmployee.employmentType || 'Full-Time Regular'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Current Status</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedEmployee.status || 'Active'}</p>
                    </div>
                  </div>
                </div>
              )}

              {profileActiveTab === 'salary' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-500">Annual CTC Package:</span>
                      <span className="font-mono text-cyan-600 text-sm">
                        ₹ {Number(selectedEmployee.salary || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Monthly Estimated Gross:</span>
                      <span className="font-mono">
                        ₹ {Math.round((Number(selectedEmployee.salary || 0) / 12)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Bank Name:</span>
                      <span>{selectedEmployee.bankDetails?.bankName || 'HDFC Bank'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Account Number:</span>
                      <span className="font-mono">{selectedEmployee.bankDetails?.accountNumber || '•••••••••4567'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>IFSC Code:</span>
                      <span className="font-mono">{selectedEmployee.bankDetails?.ifsc || 'HDFC0001234'}</span>
                    </div>
                  </div>
                </div>
              )}

              {profileActiveTab === 'attendance' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Present Days</span>
                      <p className="text-lg font-black text-emerald-600 mt-1">22 / 22</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Casual Leave (CL)</span>
                      <p className="text-lg font-black text-cyan-600 mt-1">8 Days Left</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Sick Leave (SL)</span>
                      <p className="text-lg font-black text-purple-600 mt-1">5 Days Left</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Add Employee to Roster</h3>
                  <p className="text-xs text-slate-400">Direct active employee registration</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Mahindra"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Architect"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Joining *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Annual CTC (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reporting Manager
                  </label>
                  <input
                    type="text"
                    value={formData.reportingManager}
                    onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
