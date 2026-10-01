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

// Clean initial HR data arrays (Desktop Local & Supabase Ready)
export const DEFAULT_HR_INDENTS = [];
export const DEFAULT_HR_JOB_ENQUIRIES = [];
export const DEFAULT_HR_CANDIDATES = [];
export const DEFAULT_HR_INTERVIEWS = [];
export const DEFAULT_HR_OFFERS = [];
export const DEFAULT_HR_JOININGS = [];
export const DEFAULT_HR_EMPLOYEES = [];
export const DEFAULT_HR_ATTENDANCE = [];
export const DEFAULT_HR_LEAVES = [];
export const DEFAULT_HR_PAYROLL = [];
export const DEFAULT_HR_RESIGNATIONS = [];
export const DEFAULT_HR_CLEARANCES = [];
export const DEFAULT_HR_FNF = [];
export const DEFAULT_HR_INACTIVE = [];
export const DEFAULT_HR_LETTERS = [];

// Initialize Clean Local HR Data
export function initHRData() {
  const seedIfEmpty = (key, defaultVal = []) => {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'null' || raw === 'undefined') {
      setHRData(key, defaultVal);
    }
  };

  seedIfEmpty(HR_KEYS.INDENTS, []);
  seedIfEmpty(HR_KEYS.JOB_ENQUIRIES, []);
  seedIfEmpty(HR_KEYS.CANDIDATES, []);
  seedIfEmpty(HR_KEYS.INTERVIEWS, []);
  seedIfEmpty(HR_KEYS.OFFERS, []);
  seedIfEmpty(HR_KEYS.JOININGS, []);
  seedIfEmpty(HR_KEYS.EMPLOYEES, []);
  seedIfEmpty(HR_KEYS.ATTENDANCE, []);
  seedIfEmpty(HR_KEYS.LEAVES, []);
  seedIfEmpty(HR_KEYS.PAYROLL, []);
  seedIfEmpty(HR_KEYS.RESIGNATIONS, []);
  seedIfEmpty(HR_KEYS.CLEARANCE, []);
  seedIfEmpty(HR_KEYS.FNF, []);
  seedIfEmpty(HR_KEYS.INACTIVE_EMPLOYEES, []);
  seedIfEmpty(HR_KEYS.LETTERS, []);

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
