import { taskService } from './taskService';
import { getData as getOTDData, STORAGE_KEYS as OTD_KEYS } from './otdStorageService';
import { getPurchaseData, PURCHASE_STORAGE_KEYS } from './purchaseStorageService';
import { getData as getLTOData, LTO_KEYS } from './leadToOrderStorageService';
import { getHRData, HR_KEYS } from './hrStorageService';
import { INITIAL_USERS } from './mockData';
import { calculateDelayInfo, parseDateSafe } from './tatCalculationService';

export const misSummaryService = {
  async getAllUsersAndScoring(systemFilter = 'ALL') {
    // 1. Fetch Users
    const users = INITIAL_USERS;

    // 2. Fetch Tasks from Checklist & Delegation
    const checklistTasks = (await taskService.getTasks()) || [];

    // 3. Fetch OTD Orders & Stage History
    const otdOrders = getOTDData(OTD_KEYS.ORDERS, []) || [];
    const otdHistory = getOTDData(OTD_KEYS.STAGE_HISTORY, []) || [];

    // 4. Fetch Purchase Indents
    const purchaseIndents = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []) || [];

    // 5. Fetch Lead To Order Data
    const leads = getLTOData(LTO_KEYS.LEADS, []) || [];
    const followUps = getLTOData(LTO_KEYS.FOLLOW_UPS, []) || [];
    const quotations = getLTOData(LTO_KEYS.QUOTATIONS, []) || [];
    const approvals = getLTOData(LTO_KEYS.APPROVALS, []) || [];

    // 6. Fetch HR Data
    const hrIndents = getHRData(HR_KEYS.INDENTS, []) || [];
    const hrCandidates = getHRData(HR_KEYS.CANDIDATES, []) || [];
    const hrInterviews = getHRData(HR_KEYS.INTERVIEWS, []) || [];
    const hrOffers = getHRData(HR_KEYS.OFFERS, []) || [];
    const hrJoinings = getHRData(HR_KEYS.JOININGS, []) || [];

    // Build unified task / activity records across all 5 systems
    const allActivities = [];

    // --- System 1: Checklist & Delegation ---
    checklistTasks.forEach(t => {
      const isCompleted = t.status === 'Completed';
      const plannedDate = t.due_date || t.start_date;
      const actualDate = isCompleted ? (t.completion_date || t.updated_at || new Date().toISOString()) : null;
      const delayInfo = calculateDelayInfo(plannedDate, actualDate, !isCompleted);

      allActivities.push({
        id: `CHK-${t.id}`,
        code: t.task_code || `TSK-${t.id}`,
        title: t.title || t.description || 'Checklist / Delegation Task',
        system: 'Checklist & Delegation',
        systemId: 'checklist',
        stage: t.type === 'checklist' ? 'Checklist Execution' : 'Delegated Task',
        assignedToId: t.assigned_to,
        assignedToName: t.assigned_to_name,
        assignedBy: t.assigned_by_name || 'Manager',
        plannedDate,
        actualDate,
        timeDelay: delayInfo.text,
        delayDays: delayInfo.days,
        isDelayed: delayInfo.isDelayed,
        score: delayInfo.score,
        status: t.status,
        isCompleted
      });
    });

    // --- System 2: Order To Delivery ---
    otdOrders.forEach(o => {
      const isClosed = o.currentStage === 'Order Closed' || o.status === 'Closed';
      const plannedDate = o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate;
      const actualDate = isClosed ? (o.deliveryDate || o.updatedAt || new Date().toISOString()) : (o.deliveryDate || null);
      const delayInfo = calculateDelayInfo(plannedDate, actualDate, !isClosed);

      // Match user by salesperson or default
      const matchedUser = users.find(u =>
        (u.full_name && o.salesperson && u.full_name.toLowerCase().includes(o.salesperson.toLowerCase())) ||
        (u.role === 'Sales Head' || u.role === 'Sales Officer')
      ) || users[2];

      allActivities.push({
        id: `OTD-${o.id}`,
        code: o.orderNumber,
        title: `Order: ${o.orderNumber} - ${o.customerName}`,
        system: 'Order To Delivery',
        systemId: 'sales',
        stage: o.currentStage || 'Order Processing',
        assignedToId: matchedUser.id,
        assignedToName: matchedUser.full_name,
        assignedBy: 'Commercial Head',
        plannedDate,
        actualDate,
        timeDelay: delayInfo.text,
        delayDays: delayInfo.days,
        isDelayed: delayInfo.isDelayed,
        score: delayInfo.score,
        status: isClosed ? 'Completed' : (o.status || 'In Progress'),
        isCompleted: isClosed
      });
    });

    // Also include OTD stage completions from history
    otdHistory.forEach((h, idx) => {
      const delayInfo = calculateDelayInfo(h.plannedDate, h.completionDate, false);
      const matchedUser = users.find(u => u.full_name === h.employee) || users[idx % users.length];

      allActivities.push({
        id: `OTD-HIST-${h.id || idx}`,
        code: h.orderNumber,
        title: `${h.stage} Completion (${h.orderNumber})`,
        system: 'Order To Delivery',
        systemId: 'sales',
        stage: h.stage,
        assignedToId: matchedUser.id,
        assignedToName: matchedUser.full_name,
        assignedBy: 'System Operations',
        plannedDate: h.plannedDate,
        actualDate: h.completionDate,
        timeDelay: delayInfo.text,
        delayDays: delayInfo.days,
        isDelayed: delayInfo.isDelayed,
        score: delayInfo.score,
        status: 'Completed',
        isCompleted: true
      });
    });

    // --- System 3: Purchase System ---
    purchaseIndents.forEach((item, idx) => {
      const isDone = item.currentStage === 'Completed' || item.status === 'Procurement Closed';
      const plannedDate = item.requiredByDate || item.indentDate;
      const actualDate = isDone ? (item.updatedAt || new Date().toISOString()) : null;
      const delayInfo = calculateDelayInfo(plannedDate, actualDate, !isDone);

      const matchedUser = users.find(u =>
        u.full_name === item.indentorName ||
        (u.department_name && u.department_name.toLowerCase().includes('purchase'))
      ) || users[idx % users.length];

      allActivities.push({
        id: `PUR-${item.id}`,
        code: item.indentNumber,
        title: `Indent: ${item.indentNumber} - ${item.preferredVendor || item.department}`,
        system: 'Purchase System',
        systemId: 'purchase',
        stage: item.currentStage || 'Purchase Indent',
        assignedToId: matchedUser.id,
        assignedToName: matchedUser.full_name,
        assignedBy: 'HOD Purchase',
        plannedDate,
        actualDate,
        timeDelay: delayInfo.text,
        delayDays: delayInfo.days,
        isDelayed: delayInfo.isDelayed,
        score: delayInfo.score,
        status: isDone ? 'Completed' : (item.status || 'In Progress'),
        isCompleted: isDone
      });
    });

    // --- System 4: Lead To Order ---
    followUps.forEach((flw, idx) => {
      const isCompleted = flw.status === 'Completed' || !!flw.actualDate;
      const plannedDate = flw.followUpDate || flw.nextFollowUpDate;
      const actualDate = isCompleted ? (flw.actualDate || flw.createdAt) : null;
      const delayInfo = calculateDelayInfo(plannedDate, actualDate, !isCompleted);

      const matchedUser = users.find(u => u.full_name === flw.followUpBy) || users[2];

      allActivities.push({
        id: `LTO-FLW-${flw.id || idx}`,
        code: flw.followUpId || `FLW-${flw.leadId}`,
        title: `Follow-up: ${flw.customer || flw.leadId} (${flw.followUpMode})`,
        system: 'Lead To Order',
        systemId: 'lead-to-orders',
        stage: 'Follow-up / Enquiry',
        assignedToId: matchedUser.id,
        assignedToName: matchedUser.full_name,
        assignedBy: 'Sales Manager',
        plannedDate,
        actualDate,
        timeDelay: delayInfo.text,
        delayDays: delayInfo.days,
        isDelayed: delayInfo.isDelayed,
        score: delayInfo.score,
        status: isCompleted ? 'Completed' : 'Pending',
        isCompleted
      });
    });

    quotations.forEach(q => {
      const isApproved = q.status === 'Approved';
      const plannedDate = q.expectedDeliveryDate || q.quotationDate;
      const actualDate = isApproved ? (q.updatedAt || q.quotationDate) : null;
      const delayInfo = calculateDelayInfo(plannedDate, actualDate, !isApproved);
      const matchedUser = users.find(u => u.full_name === q.createdBy) || users[2];

      allActivities.push({
        id: `LTO-QT-${q.quotationNo}`,
        code: q.quotationNo,
        title: `Quotation: ${q.quotationNo} (${q.customer})`,
        system: 'Lead To Order',
        systemId: 'lead-to-orders',
        stage: 'Quotation Preparation',
        assignedToId: matchedUser.id,
        assignedToName: matchedUser.full_name,
        assignedBy: 'Sales Operations',
        plannedDate,
        actualDate,
        timeDelay: delayInfo.text,
        delayDays: delayInfo.days,
        isDelayed: delayInfo.isDelayed,
        score: delayInfo.score,
        status: isApproved ? 'Completed' : (q.status || 'Pending'),
        isCompleted: isApproved
      });
    });

    // --- System 5: HR System ---
    hrInterviews.forEach((intv, idx) => {
      const isCompleted = intv.status === 'Selected' || intv.status === 'Completed' || intv.status === 'Rejected';
      const plannedDate = intv.interviewDate || intv.scheduledDate;
      const actualDate = isCompleted ? (intv.conductedDate || intv.updatedAt || plannedDate) : null;
      const delayInfo = calculateDelayInfo(plannedDate, actualDate, !isCompleted);
      const matchedUser = users.find(u => u.full_name === intv.interviewer) || users[3];

      allActivities.push({
        id: `HR-INT-${intv.id || idx}`,
        code: `INT-${intv.candidateName?.replace(/\s+/g, '').slice(0, 4) || 'CAND'}`,
        title: `Interview: ${intv.candidateName} (${intv.roundName || 'Technical Round'})`,
        system: 'HR System',
        systemId: 'hr',
        stage: 'Follow-up / Interview',
        assignedToId: matchedUser.id,
        assignedToName: matchedUser.full_name,
        assignedBy: 'HR Head',
        plannedDate,
        actualDate,
        timeDelay: delayInfo.text,
        delayDays: delayInfo.days,
        isDelayed: delayInfo.isDelayed,
        score: delayInfo.score,
        status: isCompleted ? 'Completed' : 'Scheduled',
        isCompleted
      });
    });

    hrIndents.forEach((hri, idx) => {
      const isApproved = hri.status === 'Approved';
      const plannedDate = hri.requiredJoiningDate || hri.requirementDate;
      const actualDate = isApproved ? (hri.approvalDate || hri.updatedAt || hri.requirementDate) : null;
      const delayInfo = calculateDelayInfo(plannedDate, actualDate, !isApproved);
      const matchedUser = users.find(u => u.full_name === hri.requestedBy) || users[idx % users.length];

      allActivities.push({
        id: `HR-IND-${hri.id}`,
        code: hri.indentNumber,
        title: `HR Requirement: ${hri.designation} (${hri.department})`,
        system: 'HR System',
        systemId: 'hr',
        stage: 'Requirement & Approval',
        assignedToId: matchedUser.id,
        assignedToName: matchedUser.full_name,
        assignedBy: 'Management',
        plannedDate,
        actualDate,
        timeDelay: delayInfo.text,
        delayDays: delayInfo.days,
        isDelayed: delayInfo.isDelayed,
        score: delayInfo.score,
        status: isApproved ? 'Completed' : (hri.status || 'Pending Approval'),
        isCompleted: isApproved
      });
    });

    // Filter activities by system if requested
    const filteredActivities = systemFilter === 'ALL'
      ? allActivities
      : allActivities.filter(a => a.systemId === systemFilter || a.system === systemFilter);

    // Compute User Metrics & Scoring
    const userReports = users.map(user => {
      const userTasks = filteredActivities.filter(a => a.assignedToId === user.id || a.assignedToName === user.full_name);
      const totalCount = userTasks.length;
      const completedList = userTasks.filter(t => t.isCompleted);
      const pendingList = userTasks.filter(t => !t.isCompleted);

      const completedOnTime = completedList.filter(t => !t.isDelayed).length;
      const completedDelayed = completedList.filter(t => t.isDelayed).length;
      const overduePending = pendingList.filter(t => t.isDelayed).length;

      // Calculate total and average delay in days
      const totalDelayDays = userTasks.reduce((acc, t) => acc + (t.delayDays || 0), 0);
      const avgDelayDays = totalCount > 0 ? (totalDelayDays / totalCount).toFixed(1) : 0;

      // Scoring Engine based on [Planned Date, Actual Date, Time Delay]
      // Every task has an individual score (0 to 100). Overall user score is the average.
      let overallScore = 100;
      if (totalCount > 0) {
        const sumScores = userTasks.reduce((acc, t) => acc + t.score, 0);
        overallScore = Math.round(sumScores / totalCount);
      }

      // Performance Grade Badge
      let grade = 'A+';
      let gradeText = 'Star Performer';
      let gradeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800';

      if (overallScore >= 90) {
        grade = 'A+';
        gradeText = 'Star Performer';
        gradeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800';
      } else if (overallScore >= 80) {
        grade = 'A';
        gradeText = 'Excellent (On Track)';
        gradeColor = 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-800';
      } else if (overallScore >= 70) {
        grade = 'B';
        gradeText = 'Good (Minor Delays)';
        gradeColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800';
      } else if (overallScore >= 55) {
        grade = 'C';
        gradeText = 'Needs Improvement';
        gradeColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800';
      } else {
        grade = 'D';
        gradeText = 'Critical Delay';
        gradeColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800';
      }

      return {
        user,
        userId: user.id,
        userName: user.full_name,
        role: user.role,
        department: user.department_name || 'General Operations',
        avatarUrl: user.avatar_url,
        totalTasks: totalCount,
        completedTasks: completedList.length,
        pendingTasks: pendingList.length,
        completedOnTime,
        completedDelayed,
        overduePending,
        totalDelayDays,
        avgDelayDays,
        overallScore,
        grade,
        gradeText,
        gradeColor,
        tasks: userTasks
      };
    });

    // Summary Totals
    const totalActivitiesCount = filteredActivities.length;
    const totalCompleted = filteredActivities.filter(a => a.isCompleted).length;
    const totalDelayed = filteredActivities.filter(a => a.isDelayed).length;
    const avgOrgScore = userReports.length > 0
      ? Math.round(userReports.reduce((acc, u) => acc + u.overallScore, 0) / userReports.length)
      : 100;

    return {
      users: userReports,
      allActivities: filteredActivities,
      metrics: {
        totalUsers: users.length,
        totalActivitiesCount,
        totalCompleted,
        totalDelayed,
        avgOrgScore
      }
    };
  }
};
