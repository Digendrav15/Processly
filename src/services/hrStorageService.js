/**
 * HR Flow Management System (HR FMS) Storage & Lifecycle Workflow Service
 * Pure LocalStorage driven implementation with reactive event dispatching.
 */

// Storage Keys
export const HR_KEYS = {
  INDENTS: 'hr_indents',
  INDENT_APPROVALS: 'hr_indent_approvals',
  JOB_ENQUIRIES: 'hr_job_enquiries',
  CANDIDATES: 'hr_candidates',
  INTERVIEWS: 'hr_interviews',
  OFFERS: 'hr_offers',
  JOININGS: 'hr_joinings',
  EMPLOYEES: 'hr_employees',
  ATTENDANCE: 'hr_attendance',
  LEAVES: 'hr_leaves',
  PAYROLL: 'hr_payroll',
  RESIGNATIONS: 'hr_resignations',
  CLEARANCE: 'hr_clearance',
  FNF: 'hr_fnf',
  INACTIVE_EMPLOYEES: 'hr_inactive_employees',
  DOCUMENTS: 'hr_documents',
  LETTERS: 'hr_letters',
  ACTIVITY_LOGS: 'hr_activity_logs',

  // Counters
  INDENT_COUNTER: 'hr_indent_counter',
  ENQUIRY_COUNTER: 'hr_enquiry_counter',
  CANDIDATE_COUNTER: 'hr_candidate_counter',
  INTERVIEW_COUNTER: 'hr_interview_counter',
  OFFER_COUNTER: 'hr_offer_counter',
  EMPLOYEE_COUNTER: 'hr_employee_counter',
  RESIGNATION_COUNTER: 'hr_resignation_counter',
  CLEARANCE_COUNTER: 'hr_clearance_counter',
  FNF_COUNTER: 'hr_fnf_counter',
  LETTER_COUNTER: 'hr_letter_counter',
  SEEDED: 'hr_seeded_v1'
};

// Dispatch storage event
export function notifyHRUpdate(key = 'ALL') {
  window.dispatchEvent(new CustomEvent('hr_storage_update', { detail: { key } }));
}

// Generic CRUD
export function getHRData(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'null' || raw === 'undefined') return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
    return defaultValue;
  }
}

export function setHRData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyHRUpdate(key);
    return true;
  } catch (err) {
    console.error(`Error saving ${key} to LocalStorage:`, err);
    return false;
  }
}

// Auto Sequential ID Generators
export function generateIndentNumber() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.INDENT_COUNTER) || '100', 10) + 1;
  localStorage.setItem(HR_KEYS.INDENT_COUNTER, counter.toString());
  return `HR-IND-${counter.toString().padStart(3, '0')}`;
}

export function generateEnquiryId() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.ENQUIRY_COUNTER) || '200', 10) + 1;
  localStorage.setItem(HR_KEYS.ENQUIRY_COUNTER, counter.toString());
  return `HR-ENQ-${counter.toString().padStart(3, '0')}`;
}

export function generateCandidateId() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.CANDIDATE_COUNTER) || '300', 10) + 1;
  localStorage.setItem(HR_KEYS.CANDIDATE_COUNTER, counter.toString());
  return `CND-${counter.toString().padStart(3, '0')}`;
}

export function generateInterviewId() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.INTERVIEW_COUNTER) || '400', 10) + 1;
  localStorage.setItem(HR_KEYS.INTERVIEW_COUNTER, counter.toString());
  return `INT-${counter.toString().padStart(3, '0')}`;
}

export function generateOfferId() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.OFFER_COUNTER) || '500', 10) + 1;
  localStorage.setItem(HR_KEYS.OFFER_COUNTER, counter.toString());
  return `OFF-${counter.toString().padStart(3, '0')}`;
}

export function generateEmployeeId() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.EMPLOYEE_COUNTER) || '100', 10) + 1;
  localStorage.setItem(HR_KEYS.EMPLOYEE_COUNTER, counter.toString());
  return `EMP-${counter.toString().padStart(3, '0')}`;
}

export function generateResignationId() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.RESIGNATION_COUNTER) || '600', 10) + 1;
  localStorage.setItem(HR_KEYS.RESIGNATION_COUNTER, counter.toString());
  return `RES-${counter.toString().padStart(3, '0')}`;
}

export function generateClearanceId() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.CLEARANCE_COUNTER) || '700', 10) + 1;
  localStorage.setItem(HR_KEYS.CLEARANCE_COUNTER, counter.toString());
  return `CLR-${counter.toString().padStart(3, '0')}`;
}

export function generateFnFId() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.FNF_COUNTER) || '800', 10) + 1;
  localStorage.setItem(HR_KEYS.FNF_COUNTER, counter.toString());
  return `FNF-${counter.toString().padStart(3, '0')}`;
}

export function generateLetterId() {
  const counter = parseInt(localStorage.getItem(HR_KEYS.LETTER_COUNTER) || '900', 10) + 1;
  localStorage.setItem(HR_KEYS.LETTER_COUNTER, counter.toString());
  return `LTR-${counter.toString().padStart(3, '0')}`;
}

// Activity & Audit Logger
export function addActivityLog(user = 'System Admin', action, moduleName, recordId, prevStatus = null, newStatus = null, remarks = '') {
  const logs = getHRData(HR_KEYS.ACTIVITY_LOGS, []);
  const now = new Date();
  const entry = {
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user: user || 'HR Executive',
    action,
    module: moduleName,
    recordId,
    previousStatus: prevStatus,
    newStatus,
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: now.toISOString(),
    remarks: remarks || `Status changed to ${newStatus || action}`
  };
  logs.unshift(entry);
  setHRData(HR_KEYS.ACTIVITY_LOGS, logs);
  return entry;
}

// Default Seed Data
export const DEFAULT_HR_INDENTS = [
  {
    id: 'HR-IND-001',
    indentNumber: 'HR-IND-001',
    requirementDate: '2026-09-18',
    department: 'Technology & IT',
    designation: 'Senior Full Stack Engineer',
    numberOfPositions: 2,
    employmentType: 'Full-time',
    location: 'Gurugram HQ',
    reportingManager: 'Vikas Sharma (CTO)',
    requiredQualification: 'B.Tech / MCA in Computer Science',
    requiredExperience: '4 - 6 Years',
    skillsRequired: 'React, Node.js, TypeScript, PostgreSQL, AWS',
    salaryRange: '₹ 14,00,000 - ₹ 18,00,000 P.A.',
    priority: 'Urgent',
    requiredJoiningDate: '2026-10-15',
    jobDescription: 'Lead frontend ERP architecture and scalable API integration.',
    reasonForRequirement: 'Expansion for ERP module roadmap and multi-tenant scaling.',
    remarks: 'Approved by management. Expedite technical screening.',
    attachment: 'JD_Senior_FullStack_2026.pdf',
    status: 'Approved',
    requestedBy: 'Vikas Sharma',
    approvedBy: 'Meenakshi Sundaram (VP HR)',
    approvalDate: '2026-09-19',
    createdAt: '2026-09-18T10:00:00.000Z'
  },
  {
    id: 'HR-IND-002',
    indentNumber: 'HR-IND-002',
    requirementDate: '2026-09-21',
    department: 'Sales & Commercial',
    designation: 'Corporate Sales Manager',
    numberOfPositions: 3,
    employmentType: 'Full-time',
    location: 'Mumbai Regional Office',
    reportingManager: 'Rahul Mehta (Head of Sales)',
    requiredQualification: 'MBA in Marketing / Any Graduate',
    requiredExperience: '3 - 5 Years in B2B / Industrial Sales',
    skillsRequired: 'Client Acquisition, Negotiation, Lead Closing, CRM',
    salaryRange: '₹ 8,00,000 - ₹ 12,00,000 P.A. + Incentives',
    priority: 'High',
    requiredJoiningDate: '2026-10-20',
    jobDescription: 'Acquisition of tier-1 EPC clients and infrastructure builders.',
    reasonForRequirement: 'New Western Region territory expansion.',
    remarks: 'Awaiting final management budget sign-off.',
    attachment: 'Sales_JD_Mumbai.pdf',
    status: 'Pending Approval',
    requestedBy: 'Rahul Mehta',
    createdAt: '2026-09-21T11:30:00.000Z'
  }
];

export const DEFAULT_HR_JOB_ENQUIRIES = [
  {
    id: 'HR-ENQ-201',
    enquiryId: 'HR-ENQ-201',
    indentNumber: 'HR-IND-001',
    candidateName: 'Rohan Verma',
    mobile: '+91 98112 34567',
    email: 'rohan.verma@gmail.com',
    source: 'LinkedIn',
    resume: 'Rohan_Verma_Resume_2026.pdf',
    appliedDesignation: 'Senior Full Stack Engineer',
    experience: '5.2 Years',
    currentCompany: 'Infosys Ltd',
    currentSalary: '₹ 12,50,000 P.A.',
    expectedSalary: '₹ 16,00,000 P.A.',
    noticePeriod: '30 Days',
    location: 'Noida, UP',
    remarks: 'Strong React and cloud experience. Passed initial screening.',
    status: 'Interview',
    createdAt: '2026-09-20T14:00:00.000Z'
  },
  {
    id: 'HR-ENQ-202',
    enquiryId: 'HR-ENQ-202',
    indentNumber: 'HR-IND-001',
    candidateName: 'Pooja Deshmukh',
    mobile: '+91 98220 99881',
    email: 'pooja.deshmukh@outlook.com',
    source: 'Naukri',
    resume: 'Pooja_Deshmukh_CV.pdf',
    appliedDesignation: 'Senior Full Stack Engineer',
    experience: '4.8 Years',
    currentCompany: 'Cognizant',
    currentSalary: '₹ 11,80,000 P.A.',
    expectedSalary: '₹ 15,00,000 P.A.',
    noticePeriod: '15 Days (Buyout option)',
    location: 'Pune',
    remarks: 'Resume shortlisted for technical round.',
    status: 'Screening Pending',
    createdAt: '2026-09-22T09:15:00.000Z'
  }
];

export const DEFAULT_HR_CANDIDATES = [
  {
    id: 'CND-301',
    candidateId: 'CND-301',
    enquiryId: 'HR-ENQ-201',
    candidateName: 'Rohan Verma',
    indentNumber: 'HR-IND-001',
    designation: 'Senior Full Stack Engineer',
    qualification: 'B.Tech IT (2020)',
    experience: '5.2 Years',
    relevantExperience: '4.5 Years in React/Node',
    currentSalary: '₹ 12,50,000',
    expectedSalary: '₹ 16,00,000',
    noticePeriod: '30 Days',
    location: 'Noida',
    skills: 'React, Node.js, Postgres, Docker',
    screeningResult: 'Shortlisted',
    screeningRemarks: 'Technically sound, excellent communication.',
    screenedBy: 'Priya Sharma (HR Lead)',
    screeningDate: '2026-09-20',
    status: 'Selected',
    createdAt: '2026-09-20T15:00:00.000Z'
  }
];

export const DEFAULT_HR_INTERVIEWS = [
  {
    id: 'INT-401',
    interviewId: 'INT-401',
    candidateId: 'CND-301',
    candidate: 'Rohan Verma',
    indentNumber: 'HR-IND-001',
    designation: 'Senior Full Stack Engineer',
    interviewRound: 'Technical Round',
    interviewType: 'Video Call',
    interviewer: 'Vikas Sharma (CTO)',
    interviewDate: '2026-09-22',
    interviewTime: '15:00',
    location: 'https://meet.google.com/abc-xyz-pqr',
    followUpDate: '2026-09-23',
    interviewFeedback: 'Exceptional problem-solving, built a live reactive state component cleanly.',
    rating: 5,
    remarks: 'Strong hire recommendation. Proceed to salary offer.',
    nextFollowUpDate: '2026-09-24',
    status: 'Selected',
    createdAt: '2026-09-22T16:00:00.000Z'
  }
];

export const DEFAULT_HR_OFFERS = [
  {
    id: 'OFF-501',
    offerId: 'OFF-501',
    candidateId: 'CND-301',
    candidate: 'Rohan Verma',
    indentNumber: 'HR-IND-001',
    designation: 'Senior Full Stack Engineer',
    department: 'Technology & IT',
    proposedSalary: 1550000,
    basicSalary: 64583,
    allowances: 45417,
    deductions: 9500,
    grossSalary: 110000,
    netSalary: 100500,
    joiningDate: '2026-10-15',
    salaryRemarks: 'Offered ₹ 15.5 LPA CTC with standard corporate medical insurance.',
    approvedBy: 'Meenakshi Sundaram (VP HR)',
    approvalDate: '2026-09-23',
    approvalStatus: 'Approved',
    status: 'Approved',
    createdAt: '2026-09-23T10:30:00.000Z'
  }
];

export const DEFAULT_HR_JOININGS = [
  {
    id: 'JOIN-601',
    offerId: 'OFF-501',
    candidateName: 'Rohan Verma',
    employeeId: 'EMP-106',
    joiningDate: '2026-10-15',
    department: 'Technology & IT',
    designation: 'Senior Full Stack Engineer',
    reportingManager: 'Vikas Sharma',
    employmentType: 'Full-time',
    salary: 1550000,
    location: 'Gurugram HQ',
    officialEmail: 'rohan.verma@gimbooks.com',
    mobile: '+91 98112 34567',
    address: 'Sector 56, Gurugram, Haryana',
    bankDetails: 'HDFC Bank - A/c 5010022334455, IFSC: HDFC0000123',
    emergencyContact: 'Suman Verma (Father) - +91 98112 34500',
    qualification: 'B.Tech Computer Science',
    previousExperience: '5.2 Years at Infosys Ltd',
    documents: {
      aadhaar: true,
      pan: true,
      photo: true,
      resume: true,
      educationCertificate: true,
      experienceCertificate: true,
      bankDocument: true,
      addressProof: true
    },
    status: 'Joining Pending',
    createdAt: '2026-09-23T11:00:00.000Z'
  }
];

export const DEFAULT_HR_EMPLOYEES = [
  {
    id: 'EMP-101',
    employeeId: 'EMP-101',
    name: 'Aarav Singhania',
    profilePhoto: '',
    department: 'Technology & IT',
    designation: 'Principal Architect',
    joiningDate: '2023-04-10',
    reportingManager: 'Vikas Sharma',
    employmentType: 'Full-time',
    mobile: '+91 98110 11223',
    email: 'aarav.s@gimbooks.com',
    address: 'DLF Phase 2, Gurugram, Haryana',
    salary: 2400000,
    bankDetails: 'ICICI Bank - A/c 002101554433, IFSC: ICIC0000021',
    emergencyContact: 'Anita Singhania (Spouse) - +91 98110 99887',
    status: 'Active',
    createdAt: '2023-04-10T09:00:00.000Z'
  },
  {
    id: 'EMP-102',
    employeeId: 'EMP-102',
    name: 'Priya Sharma',
    profilePhoto: '',
    department: 'Human Resources',
    designation: 'HR Lead & Operations',
    joiningDate: '2023-06-01',
    reportingManager: 'Meenakshi Sundaram',
    employmentType: 'Full-time',
    mobile: '+91 98230 44556',
    email: 'priya.s@gimbooks.com',
    address: 'South City 1, Gurugram, Haryana',
    salary: 1100000,
    bankDetails: 'HDFC Bank - A/c 5010011223344, IFSC: HDFC0000123',
    emergencyContact: 'Rajesh Sharma - +91 98230 11223',
    status: 'Active',
    createdAt: '2023-06-01T09:00:00.000Z'
  },
  {
    id: 'EMP-103',
    employeeId: 'EMP-103',
    name: 'Rahul Mehta',
    profilePhoto: '',
    department: 'Sales & Commercial',
    designation: 'Regional Sales Manager',
    joiningDate: '2024-01-15',
    reportingManager: 'Karan Mehra',
    employmentType: 'Full-time',
    mobile: '+91 98200 66778',
    email: 'rahul.m@gimbooks.com',
    address: 'Bandra West, Mumbai',
    salary: 1350000,
    bankDetails: 'Axis Bank - A/c 9120100445566, IFSC: UTIB0000004',
    emergencyContact: 'Kavita Mehta - +91 98200 33221',
    status: 'Active',
    createdAt: '2024-01-15T09:00:00.000Z'
  },
  {
    id: 'EMP-104',
    employeeId: 'EMP-104',
    name: 'Karan Dave',
    profilePhoto: '',
    department: 'Finance & Accounts',
    designation: 'Senior Accountant',
    joiningDate: '2024-03-01',
    reportingManager: 'Sunil Mathur',
    employmentType: 'Full-time',
    mobile: '+91 97110 55443',
    email: 'karan.d@gimbooks.com',
    address: 'Sector 43, Noida',
    salary: 850000,
    bankDetails: 'SBI - A/c 30124567890, IFSC: SBIN0001234',
    emergencyContact: 'Dinesh Dave - +91 97110 11009',
    status: 'On Notice',
    createdAt: '2024-03-01T09:00:00.000Z'
  },
  {
    id: 'EMP-105',
    employeeId: 'EMP-105',
    name: 'Deepak Joshi',
    profilePhoto: '',
    department: 'Supply Chain & Logistics',
    designation: 'Dispatch Officer',
    joiningDate: '2024-05-10',
    reportingManager: 'Vikram Malhotra',
    employmentType: 'Full-time',
    mobile: '+91 98114 77889',
    email: 'deepak.j@gimbooks.com',
    address: 'Faridabad, Haryana',
    salary: 620000,
    bankDetails: 'PNB - A/c 0123000123456, IFSC: PUNB0012300',
    emergencyContact: 'Suman Joshi - +91 98114 00998',
    status: 'Resigned',
    createdAt: '2024-05-10T09:00:00.000Z'
  }
];

export const DEFAULT_HR_ATTENDANCE = [
  {
    id: 'ATT-101-2026-09-23',
    employeeId: 'EMP-101',
    employeeName: 'Aarav Singhania',
    date: '2026-09-23',
    punchIn: '09:12',
    punchOut: '18:15',
    workingHours: 9.05,
    status: 'Present',
    remarks: 'On-time punch in'
  },
  {
    id: 'ATT-102-2026-09-23',
    employeeId: 'EMP-102',
    employeeName: 'Priya Sharma',
    date: '2026-09-23',
    punchIn: '09:05',
    punchOut: '18:00',
    workingHours: 8.92,
    status: 'Present',
    remarks: 'Normal day'
  },
  {
    id: 'ATT-103-2026-09-23',
    employeeId: 'EMP-103',
    employeeName: 'Rahul Mehta',
    date: '2026-09-23',
    punchIn: '09:45',
    punchOut: '18:30',
    workingHours: 8.75,
    status: 'Late',
    remarks: 'Traffic on Western Expressway'
  },
  {
    id: 'ATT-104-2026-09-23',
    employeeId: 'EMP-104',
    employeeName: 'Karan Dave',
    date: '2026-09-23',
    punchIn: '—',
    punchOut: '—',
    workingHours: 0,
    status: 'Absent',
    remarks: 'Sick leave approved'
  }
];

export const DEFAULT_HR_LEAVES = [
  {
    id: 'LEV-101',
    employeeId: 'EMP-104',
    employeeName: 'Karan Dave',
    leaveType: 'Sick Leave',
    fromDate: '2026-09-23',
    toDate: '2026-09-24',
    numberOfDays: 2,
    reason: 'Viral fever and doctor consultation',
    approvalStatus: 'Approved',
    approvedBy: 'Meenakshi Sundaram',
    remarks: 'Approved with medical certificate',
    createdAt: '2026-09-22T17:00:00.000Z'
  },
  {
    id: 'LEV-102',
    employeeId: 'EMP-103',
    employeeName: 'Rahul Mehta',
    leaveType: 'Casual Leave',
    fromDate: '2026-09-28',
    toDate: '2026-09-29',
    numberOfDays: 2,
    reason: 'Family function in Pune',
    approvalStatus: 'Pending',
    approvedBy: '',
    remarks: '',
    createdAt: '2026-09-23T11:00:00.000Z'
  }
];

export const DEFAULT_HR_PAYROLL = [
  {
    id: 'PAY-2026-08-EMP-101',
    employeeId: 'EMP-101',
    employeeName: 'Aarav Singhania',
    department: 'Technology & IT',
    designation: 'Principal Architect',
    payrollMonth: 'August 2026',
    basicSalary: 100000,
    allowances: 75000,
    overtime: 0,
    incentive: 25000,
    grossSalary: 200000,
    leaveDeduction: 0,
    pf: 1800,
    esi: 0,
    tds: 18200,
    otherDeduction: 0,
    totalDeduction: 20000,
    netSalary: 180000,
    paymentStatus: 'Paid',
    paymentDate: '2026-08-31',
    remarks: 'Processed via Bank Transfer'
  },
  {
    id: 'PAY-2026-08-EMP-102',
    employeeId: 'EMP-102',
    employeeName: 'Priya Sharma',
    department: 'Human Resources',
    designation: 'HR Lead & Operations',
    payrollMonth: 'August 2026',
    basicSalary: 45000,
    allowances: 35000,
    overtime: 0,
    incentive: 11666,
    grossSalary: 91666,
    leaveDeduction: 0,
    pf: 1800,
    esi: 0,
    tds: 5866,
    otherDeduction: 0,
    totalDeduction: 7666,
    netSalary: 84000,
    paymentStatus: 'Paid',
    paymentDate: '2026-08-31',
    remarks: 'Processed via Bank Transfer'
  }
];

export const DEFAULT_HR_RESIGNATIONS = [
  {
    id: 'RES-601',
    resignationId: 'RES-601',
    employeeId: 'EMP-105',
    employeeName: 'Deepak Joshi',
    department: 'Supply Chain & Logistics',
    designation: 'Dispatch Officer',
    resignationDate: '2026-09-15',
    reason: 'Relocating to hometown for personal family commitments.',
    noticePeriod: '30 Days',
    lastWorkingDate: '2026-10-15',
    resignationLetter: 'Resignation_Deepak_Joshi.pdf',
    remarks: 'Approved by Reporting Manager. Exit clearance initiated.',
    status: 'Exit Pending',
    createdAt: '2026-09-15T11:00:00.000Z'
  }
];

export const DEFAULT_HR_CLEARANCES = [
  {
    id: 'CLR-701',
    resignationId: 'RES-601',
    employeeId: 'EMP-105',
    employeeName: 'Deepak Joshi',
    department: 'IT',
    clearanceItem: 'Laptop & Email Account',
    responsiblePerson: 'IT Admin (Rakesh)',
    status: 'Cleared',
    assetReturned: true,
    documentReturned: true,
    pendingAmount: 0,
    remarks: 'ThinkPad L14 returned with charger in working order.',
    clearanceDate: '2026-09-22'
  },
  {
    id: 'CLR-702',
    resignationId: 'RES-601',
    employeeId: 'EMP-105',
    employeeName: 'Deepak Joshi',
    department: 'Admin & Store',
    clearanceItem: 'ID Card, Uniform & SIM',
    responsiblePerson: 'Admin Officer',
    status: 'Pending',
    assetReturned: false,
    documentReturned: true,
    pendingAmount: 0,
    remarks: 'Company SIM and badge to be surrendered on final day.',
    clearanceDate: ''
  },
  {
    id: 'CLR-703',
    resignationId: 'RES-601',
    employeeId: 'EMP-105',
    employeeName: 'Deepak Joshi',
    department: 'Finance',
    clearanceItem: 'Salary Advance & Travel Expense',
    responsiblePerson: 'Finance Controller',
    status: 'Cleared',
    assetReturned: true,
    documentReturned: true,
    pendingAmount: 0,
    remarks: 'No pending travel claims or unadjusted advances.',
    clearanceDate: '2026-09-21'
  }
];

export const DEFAULT_HR_FNF = [
  {
    id: 'FNF-801',
    resignationId: 'RES-601',
    employeeId: 'EMP-105',
    employeeName: 'Deepak Joshi',
    lastWorkingDate: '2026-10-15',
    salaryDue: 26000,
    leaveEncashment: 8500,
    incentive: 3000,
    bonus: 5000,
    overtime: 0,
    noticePeriodRecovery: 0,
    loanAdvanceRecovery: 0,
    otherDeduction: 1200,
    grossSettlement: 42500,
    totalDeduction: 1200,
    netSettlement: 41300,
    paymentDate: '',
    paymentMode: 'NEFT Bank Transfer',
    remarks: 'Clearance in progress. Pending admin SIM handover.',
    status: 'Under Process',
    createdAt: '2026-09-22T14:00:00.000Z'
  }
];

export const DEFAULT_HR_INACTIVE = [
  {
    id: 'INACT-001',
    employeeId: 'EMP-088',
    employeeName: 'Sanjay Deshmukh',
    department: 'Sales Operations',
    designation: 'Executive Sales',
    joiningDate: '2022-01-15',
    lastWorkingDate: '2026-06-30',
    resignationDate: '2026-05-31',
    exitReason: 'Career Advancement / Relocation',
    fnfStatus: 'Closed',
    exitStatus: 'Cleared',
    employeeStatus: 'Inactive',
    relievingLetterIssued: true,
    experienceLetterIssued: true
  }
];

export const DEFAULT_HR_LETTERS = [
  {
    id: 'LTR-901',
    letterType: 'Offer Letter',
    title: 'Offer Letter - Rohan Verma',
    candidateOrEmployeeId: 'CND-301',
    recipientName: 'Rohan Verma',
    designation: 'Senior Full Stack Engineer',
    department: 'Technology & IT',
    effectiveDate: '2026-10-15',
    ctc: '₹ 15,50,000 P.A.',
    issuedBy: 'Meenakshi Sundaram (VP HR)',
    createdAt: '2026-09-23T10:45:00.000Z'
  },
  {
    id: 'LTR-902',
    letterType: 'Relieving Letter',
    title: 'Relieving Letter - Sanjay Deshmukh',
    candidateOrEmployeeId: 'EMP-088',
    recipientName: 'Sanjay Deshmukh',
    designation: 'Executive Sales',
    department: 'Sales Operations',
    effectiveDate: '2026-06-30',
    ctc: '₹ 7,20,000 P.A.',
    issuedBy: 'Meenakshi Sundaram (VP HR)',
    createdAt: '2026-07-02T12:00:00.000Z'
  }
];

// Initialize Seed Data
export function initHRData() {
  const seedIfEmpty = (key, defaultVal) => {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'null' || raw === 'undefined' || raw === '[]') {
      setHRData(key, defaultVal);
    }
  };

  seedIfEmpty(HR_KEYS.INDENTS, DEFAULT_HR_INDENTS);
  seedIfEmpty(HR_KEYS.JOB_ENQUIRIES, DEFAULT_HR_JOB_ENQUIRIES);
  seedIfEmpty(HR_KEYS.CANDIDATES, DEFAULT_HR_CANDIDATES);
  seedIfEmpty(HR_KEYS.INTERVIEWS, DEFAULT_HR_INTERVIEWS);
  seedIfEmpty(HR_KEYS.OFFERS, DEFAULT_HR_OFFERS);
  seedIfEmpty(HR_KEYS.JOININGS, DEFAULT_HR_JOININGS);
  seedIfEmpty(HR_KEYS.EMPLOYEES, DEFAULT_HR_EMPLOYEES);
  seedIfEmpty(HR_KEYS.ATTENDANCE, DEFAULT_HR_ATTENDANCE);
  seedIfEmpty(HR_KEYS.LEAVES, DEFAULT_HR_LEAVES);
  seedIfEmpty(HR_KEYS.PAYROLL, DEFAULT_HR_PAYROLL);
  seedIfEmpty(HR_KEYS.RESIGNATIONS, DEFAULT_HR_RESIGNATIONS);
  seedIfEmpty(HR_KEYS.CLEARANCE, DEFAULT_HR_CLEARANCES);
  seedIfEmpty(HR_KEYS.FNF, DEFAULT_HR_FNF);
  seedIfEmpty(HR_KEYS.INACTIVE_EMPLOYEES, DEFAULT_HR_INACTIVE);
  seedIfEmpty(HR_KEYS.LETTERS, DEFAULT_HR_LETTERS);

  if (!localStorage.getItem(HR_KEYS.SEEDED)) {
    localStorage.setItem(HR_KEYS.SEEDED, 'true');
    notifyHRUpdate();
  }
}

// Ensure seeded on load
initHRData();

// =========================================================================
// AUTOMATED WORKFLOW LIFECYCLE TRANSITION APIs
// =========================================================================

/**
 * 1. Approve Indent -> Automatically creates/opens linked Job Enquiry
 */
export function approveIndent(indentId, approvedBy = 'Director', remarks = '') {
  const indents = getHRData(HR_KEYS.INDENTS, DEFAULT_HR_INDENTS);
  const idx = indents.findIndex(i => i.id === indentId || i.indentNumber === indentId);
  if (idx === -1) return { success: false, message: 'Indent not found' };

  const nowStr = new Date().toISOString().split('T')[0];
  const prev = indents[idx].status;
  indents[idx].status = 'Approved';
  indents[idx].approvedBy = approvedBy;
  indents[idx].approvalDate = nowStr;
  indents[idx].remarks = remarks || indents[idx].remarks;
  setHRData(HR_KEYS.INDENTS, indents);

  addActivityLog(approvedBy, 'Approved Indent', 'Recruitment', indents[idx].indentNumber, prev, 'Approved', remarks);
  return { success: true, indent: indents[idx] };
}

/**
 * 2. Candidate Shortlisted -> Advances to Follow-up / Interview
 */
export function shortlistCandidate(candidateId, result = 'Shortlisted', remarks = '', screenedBy = 'HR Lead') {
  const candidates = getHRData(HR_KEYS.CANDIDATES, DEFAULT_HR_CANDIDATES);
  const idx = candidates.findIndex(c => c.id === candidateId || c.candidateId === candidateId);
  if (idx === -1) return { success: false, message: 'Candidate not found' };

  const prev = candidates[idx].screeningResult;
  candidates[idx].screeningResult = result;
  candidates[idx].screeningRemarks = remarks;
  candidates[idx].screenedBy = screenedBy;
  candidates[idx].screeningDate = new Date().toISOString().split('T')[0];
  candidates[idx].status = result === 'Shortlisted' ? 'Interview' : result;

  setHRData(HR_KEYS.CANDIDATES, candidates);

  // Update linked Job Enquiry
  const enquiries = getHRData(HR_KEYS.JOB_ENQUIRIES, DEFAULT_HR_JOB_ENQUIRIES);
  const enqIdx = enquiries.findIndex(e => e.enquiryId === candidates[idx].enquiryId);
  if (enqIdx >= 0) {
    enquiries[enqIdx].status = result === 'Shortlisted' ? 'Interview' : result;
    setHRData(HR_KEYS.JOB_ENQUIRIES, enquiries);
  }

  addActivityLog(screenedBy, 'Candidate Screening', 'Recruitment', candidates[idx].candidateId, prev, result, remarks);
  return { success: true, candidate: candidates[idx] };
}

/**
 * 3. Candidate Interview Selected -> Advances to Offer / Salary Approval
 */
export function recordInterviewSelection(interviewId, rating = 5, feedback = '', nextRound = 'Selected') {
  const interviews = getHRData(HR_KEYS.INTERVIEWS, DEFAULT_HR_INTERVIEWS);
  const idx = interviews.findIndex(i => i.id === interviewId || i.interviewId === interviewId);
  if (idx === -1) return { success: false, message: 'Interview not found' };

  interviews[idx].rating = rating;
  interviews[idx].interviewFeedback = feedback;
  interviews[idx].status = nextRound;
  setHRData(HR_KEYS.INTERVIEWS, interviews);

  const candidateId = interviews[idx].candidateId;
  const candidates = getHRData(HR_KEYS.CANDIDATES, DEFAULT_HR_CANDIDATES);
  const cIdx = candidates.findIndex(c => c.candidateId === candidateId);
  if (cIdx >= 0) {
    candidates[cIdx].status = nextRound;
    setHRData(HR_KEYS.CANDIDATES, candidates);
  }

  addActivityLog('Interviewer', 'Interview Evaluated', 'Recruitment', interviews[idx].interviewId, 'Scheduled', nextRound, feedback);
  return { success: true, interview: interviews[idx] };
}

/**
 * 4. Approve Salary Offer -> Advances candidate to Joining
 */
export function approveSalaryOffer(offerId, approvedBy = 'Director', remarks = '') {
  const offers = getHRData(HR_KEYS.OFFERS, DEFAULT_HR_OFFERS);
  const idx = offers.findIndex(o => o.id === offerId || o.offerId === offerId);
  if (idx === -1) return { success: false, message: 'Offer not found' };

  const offer = offers[idx];
  offer.approvalStatus = 'Approved';
  offer.status = 'Approved';
  offer.approvedBy = approvedBy;
  offer.approvalDate = new Date().toISOString().split('T')[0];
  offer.salaryRemarks = remarks || offer.salaryRemarks;
  setHRData(HR_KEYS.OFFERS, offers);

  // Auto-create/upsert into Joining table
  const joinings = getHRData(HR_KEYS.JOININGS, DEFAULT_HR_JOININGS);
  const existingJoin = joinings.find(j => j.offerId === offer.offerId);
  if (!existingJoin) {
    const newEmpId = generateEmployeeId();
    joinings.unshift({
      id: `JOIN-${Date.now()}`,
      offerId: offer.offerId,
      candidateName: offer.candidate,
      employeeId: newEmpId,
      joiningDate: offer.joiningDate || new Date().toISOString().split('T')[0],
      department: offer.department,
      designation: offer.designation,
      reportingManager: 'Department Head',
      employmentType: 'Full-time',
      salary: offer.proposedSalary,
      location: 'Corporate HQ',
      officialEmail: `${offer.candidate?.toLowerCase().replace(/\s+/g, '.')}@gimbooks.com`,
      mobile: '+91 98000 12345',
      address: 'Corporate Employee Transit',
      bankDetails: 'Pending Submission',
      emergencyContact: 'Pending',
      qualification: 'Degree Verified',
      previousExperience: 'Verified',
      documents: {
        aadhaar: true,
        pan: true,
        photo: true,
        resume: true,
        educationCertificate: false,
        experienceCertificate: false,
        bankDocument: false,
        addressProof: true
      },
      status: 'Joining Pending',
      createdAt: new Date().toISOString()
    });
    setHRData(HR_KEYS.JOININGS, joinings);
  }

  // Also auto-generate official Offer Letter
  const letters = getHRData(HR_KEYS.LETTERS, DEFAULT_HR_LETTERS);
  letters.unshift({
    id: generateLetterId(),
    letterType: 'Offer Letter',
    title: `Offer Letter - ${offer.candidate}`,
    candidateOrEmployeeId: offer.candidateId || offer.candidate,
    recipientName: offer.candidate,
    designation: offer.designation,
    department: offer.department,
    effectiveDate: offer.joiningDate,
    ctc: `₹ ${Number(offer.proposedSalary).toLocaleString('en-IN')} P.A.`,
    issuedBy: approvedBy,
    createdAt: new Date().toISOString()
  });
  setHRData(HR_KEYS.LETTERS, letters);

  addActivityLog(approvedBy, 'Offer Approved', 'Recruitment', offer.offerId, 'Pending Approval', 'Approved', remarks);
  return { success: true, offer };
}

/**
 * 5. Complete Joining -> Automatically converts into Active Employee Master!
 */
export function completeJoining(joiningId, employeeCustomData = {}) {
  const joinings = getHRData(HR_KEYS.JOININGS, DEFAULT_HR_JOININGS);
  const idx = joinings.findIndex(j => j.id === joiningId || j.offerId === joiningId);
  if (idx === -1) return { success: false, message: 'Joining record not found' };

  const join = joinings[idx];
  join.status = 'Joined';
  setHRData(HR_KEYS.JOININGS, joinings);

  // Add into Active Employees
  const employees = getHRData(HR_KEYS.EMPLOYEES, DEFAULT_HR_EMPLOYEES);
  const exists = employees.some(e => e.employeeId === join.employeeId);
  let newEmp = null;

  if (!exists) {
    newEmp = {
      id: join.employeeId,
      employeeId: join.employeeId,
      name: join.candidateName,
      profilePhoto: '',
      department: join.department,
      designation: join.designation,
      joiningDate: join.joiningDate,
      reportingManager: join.reportingManager,
      employmentType: join.employmentType,
      mobile: join.mobile,
      email: join.officialEmail,
      address: join.address,
      salary: join.salary,
      bankDetails: join.bankDetails,
      emergencyContact: join.emergencyContact,
      status: 'Active',
      createdAt: new Date().toISOString(),
      ...employeeCustomData
    };
    employees.unshift(newEmp);
    setHRData(HR_KEYS.EMPLOYEES, employees);
  }

  addActivityLog('HR Operations', 'Employee Onboarded', 'Employee', join.employeeId, 'Joining Pending', 'Active', 'Joined active employee roster');
  return { success: true, employee: newEmp || join };
}

/**
 * 6. Approve Resignation -> Automatically generates Department Clearances
 */
export function approveResignation(resignationId, approvedBy = 'VP HR', remarks = '') {
  const resignations = getHRData(HR_KEYS.RESIGNATIONS, DEFAULT_HR_RESIGNATIONS);
  const idx = resignations.findIndex(r => r.id === resignationId || r.resignationId === resignationId);
  if (idx === -1) return { success: false, message: 'Resignation record not found' };

  const res = resignations[idx];
  res.status = 'Exit Pending';
  res.remarks = remarks || res.remarks;
  setHRData(HR_KEYS.RESIGNATIONS, resignations);

  // Update employee status to 'Resigned' / 'On Notice'
  const employees = getHRData(HR_KEYS.EMPLOYEES, DEFAULT_HR_EMPLOYEES);
  const eIdx = employees.findIndex(e => e.employeeId === res.employeeId);
  if (eIdx >= 0) {
    employees[eIdx].status = 'On Notice';
    setHRData(HR_KEYS.EMPLOYEES, employees);
  }

  // Create standard department clearance checklist items if not already present
  const clearances = getHRData(HR_KEYS.CLEARANCE, DEFAULT_HR_CLEARANCES);
  const hasClearances = clearances.some(c => c.employeeId === res.employeeId);

  if (!hasClearances) {
    const deptClearanceItems = [
      { dept: 'IT', item: 'Laptop, Monitor, Email & Access Revocation', responsible: 'IT Helpdesk' },
      { dept: 'Admin', item: 'Company ID Card, Access Keycard, Parking Pass', responsible: 'Facility Admin' },
      { dept: 'Finance', item: 'Salary Advance, Corporate Credit Card, Travel Claims', responsible: 'Finance Head' },
      { dept: 'Reporting Manager', item: 'Project Handover, Code Repository & Doc Transfer', responsible: 'Manager' },
      { dept: 'HR', item: 'Exit Interview, Benefits & Insurance Deactivation', responsible: 'HR Manager' }
    ];

    deptClearanceItems.forEach(d => {
      clearances.unshift({
        id: generateClearanceId(),
        resignationId: res.resignationId,
        employeeId: res.employeeId,
        employeeName: res.employeeName,
        department: d.dept,
        clearanceItem: d.item,
        responsiblePerson: d.responsible,
        status: 'Pending',
        assetReturned: false,
        documentReturned: false,
        pendingAmount: 0,
        remarks: 'Clearance initiated',
        clearanceDate: ''
      });
    });
    setHRData(HR_KEYS.CLEARANCE, clearances);
  }

  addActivityLog(approvedBy, 'Resignation Approved', 'Exit Management', res.resignationId, 'Submitted', 'Exit Pending', remarks);
  return { success: true, resignation: res };
}

/**
 * 7. Settle Full & Final (F&F) -> Automatically moves Employee to Inactive
 */
export function settleFnF(fnfId, paymentMode = 'Bank Transfer', remarks = '') {
  const fnfList = getHRData(HR_KEYS.FNF, DEFAULT_HR_FNF);
  const idx = fnfList.findIndex(f => f.id === fnfId || f.employeeId === fnfId);
  if (idx === -1) return { success: false, message: 'F&F voucher not found' };

  const fnf = fnfList[idx];
  fnf.status = 'Paid';
  fnf.paymentDate = new Date().toISOString().split('T')[0];
  fnf.paymentMode = paymentMode;
  fnf.remarks = remarks || fnf.remarks;
  setHRData(HR_KEYS.FNF, fnfList);

  // Move Employee from Active to Inactive
  const employees = getHRData(HR_KEYS.EMPLOYEES, DEFAULT_HR_EMPLOYEES);
  const inactives = getHRData(HR_KEYS.INACTIVE_EMPLOYEES, DEFAULT_HR_INACTIVE);

  const eIdx = employees.findIndex(e => e.employeeId === fnf.employeeId);
  if (eIdx >= 0) {
    const emp = employees[eIdx];
    emp.status = 'Inactive';
    employees.splice(eIdx, 1);
    setHRData(HR_KEYS.EMPLOYEES, employees);

    inactives.unshift({
      id: `INACT-${emp.employeeId}`,
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joiningDate,
      lastWorkingDate: fnf.lastWorkingDate,
      resignationDate: fnf.lastWorkingDate,
      exitReason: 'Full & Final Settled',
      fnfStatus: 'Closed',
      exitStatus: 'Cleared',
      employeeStatus: 'Inactive',
      relievingLetterIssued: true,
      experienceLetterIssued: true
    });
    setHRData(HR_KEYS.INACTIVE_EMPLOYEES, inactives);

    // Auto-create Relieving and Experience letters
    const letters = getHRData(HR_KEYS.LETTERS, DEFAULT_HR_LETTERS);
    letters.unshift({
      id: generateLetterId(),
      letterType: 'Relieving Letter',
      title: `Relieving Letter - ${emp.name}`,
      candidateOrEmployeeId: emp.employeeId,
      recipientName: emp.name,
      designation: emp.designation,
      department: emp.department,
      effectiveDate: fnf.lastWorkingDate,
      ctc: `₹ ${Number(emp.salary || 0).toLocaleString('en-IN')}`,
      issuedBy: 'HR Operations',
      createdAt: new Date().toISOString()
    });
    letters.unshift({
      id: generateLetterId(),
      letterType: 'Experience Letter',
      title: `Experience Certificate - ${emp.name}`,
      candidateOrEmployeeId: emp.employeeId,
      recipientName: emp.name,
      designation: emp.designation,
      department: emp.department,
      effectiveDate: fnf.lastWorkingDate,
      ctc: `₹ ${Number(emp.salary || 0).toLocaleString('en-IN')}`,
      issuedBy: 'HR Operations',
      createdAt: new Date().toISOString()
    });
    setHRData(HR_KEYS.LETTERS, letters);
  }

  addActivityLog('Finance & HR', 'Full & Final Settled', 'Exit Management', fnf.employeeId, 'Under Process', 'Paid / Inactive', remarks);
  return { success: true, fnf };
}
