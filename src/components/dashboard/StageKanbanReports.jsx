import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import {
  ShoppingCart,
  TrendingUp,
  Target,
  Users,
  CheckSquare,
  Search,
  Filter,
  Columns,
  List,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Eye,
  Building2,
  User,
  ArrowUpRight,
  FileText,
  DollarSign,
  Package,
  Layers,
  X,
  Flag,
  Sparkles,
  Wallet,
  Files,
  RefreshCw
} from 'lucide-react';

export function StageKanbanReports({
  tasks = [],
  orders = [],
  purchases = [],
  leads = [],
  hrIndents = [],
  hrInterviews = [],
  hrOffers = [],
  hrJoinings = [],
  hrClearances = [],
  hrFnf = [],
  pettyTxns = [],
  pettyCheques = [],
  documents = [],
  subscriptions = [],
  onRefresh
}) {
  const navigate = useNavigate();
  const { switchSystem } = useSystem();

  // Active module state: 'checklist' | 'otd' | 'purchase' | 'leads' | 'hr' | 'petty' | 'docsub'
  const [activeModule, setActiveModule] = useState('otd');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'overdue' | 'upcoming'
  const [selectedCard, setSelectedCard] = useState(null);

  // Calculate days overdue or remaining using real date strings
  const calculateAging = (targetDateStr, isCompleted = false) => {
    if (!targetDateStr) return { text: 'On Track', isOverdue: false, isDueSoon: false, isUpcoming: true, days: 0 };
    if (isCompleted) return { text: 'Completed', isOverdue: false, isDueSoon: false, isUpcoming: false, days: 0 };

    const target = new Date(targetDateStr).getTime();
    if (isNaN(target)) return { text: 'On Track', isOverdue: false, isDueSoon: false, isUpcoming: true, days: 0 };

    const now = new Date().getTime();
    const diffMs = target - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const delayDays = Math.abs(diffDays);
      return {
        text: `${delayDays}d delay`,
        isOverdue: true,
        isDueSoon: false,
        isUpcoming: false,
        days: delayDays
      };
    } else if (diffDays === 0) {
      return { text: 'Due Today', isOverdue: false, isDueSoon: true, isUpcoming: false, days: 0 };
    } else if (diffDays <= 3) {
      return { text: `${diffDays}d left`, isOverdue: false, isDueSoon: true, isUpcoming: false, days: diffDays };
    }
    return { text: `${diffDays}d left`, isOverdue: false, isDueSoon: false, isUpcoming: true, days: diffDays };
  };

  // Format currency
  const formatCurrency = (val) => {
    if (!val && val !== 0) return '—';
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Format date display
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // ==========================================
  // 1. CHECKLIST & DELEGATION (REAL SYSTEM TASKS)
  // ==========================================
  const checklistStages = useMemo(() => [
    { id: 'Pending', label: '1. Todo / Pending', sub: 'Assigned tasks pending execution', color: 'indigo' },
    { id: 'In Progress', label: '2. In Progress', sub: 'Tasks currently under execution', color: 'blue' },
    { id: 'Overdue', label: '3. Overdue Attention', sub: 'Exceeded target completion deadline', color: 'rose' },
    { id: 'Completed', label: '4. Completed Tasks', sub: 'Finished and verified tasks', color: 'emerald' }
  ], []);

  const checklistCards = useMemo(() => {
    return tasks.map((t) => {
      const isDone = t.status === 'Completed';
      const aging = calculateAging(t.due_date, isDone);
      let stage = t.status || 'Pending';
      if (t.status === 'In Progress') stage = 'In Progress';
      else if (t.status === 'Completed') stage = 'Completed';
      else if (t.status === 'Overdue' || aging.isOverdue) stage = 'Overdue';
      else stage = 'Pending';

      const tag = t.category ? t.category.slice(0, 4).toUpperCase() : 'TSK';
      const assigneeName = t.assigned_to_name || t.assigned_to || 'Assigned Staff';

      return {
        id: t.id ? `tsk-${t.id}` : `tsk-${Math.random()}`,
        code: t.task_code || t.code || `TSK-${t.id || '101'}`,
        tag,
        title: t.title || t.task_name || 'Operational Task',
        vendorOrCustomer: `Employee: ${assigneeName}`,
        entityType: 'employee',
        department: t.department || t.category || 'Operations',
        assignee: assigneeName,
        stage,
        quote: t.description ? `TASK "${t.description.slice(0, 30)}"` : '',
        statLabel: 'PRIORITY / DEPT',
        statValue: `${t.priority || 'Normal'} • ${t.department || 'General'}`,
        status: t.status || 'Pending',
        priority: t.priority || 'Normal',
        value: 0,
        formattedValue: t.priority || 'Normal',
        startDate: t.start_date || t.created_at?.split('T')[0] || '',
        targetDate: t.due_date || '',
        aging,
        raw: t,
        systemId: 'checklist',
        stagePath: '/my-tasks'
      };
    });
  }, [tasks]);

  // ==========================================
  // 2. ORDER TO DELIVERY (REAL OTD ORDERS)
  // ==========================================
  const otdStages = useMemo(() => [
    { id: 'New Order', label: '1. New Order', sub: 'Newly created order entries', color: 'blue' },
    { id: 'Order Verification', label: '2. Order Verification', sub: 'Commercial & technical specification audit', color: 'indigo' },
    { id: 'Order Approval', label: '3. Order Approval', sub: 'Management signoff & finance clearance', color: 'purple' },
    { id: 'Advance Payment', label: '4. Advance Payment', sub: 'Advance milestone collection', color: 'amber' },
    { id: 'Stock Check', label: '5. Stock Check', sub: 'Inventory availability & sourcing', color: 'cyan' },
    { id: 'Order Processing', label: '6. Order Processing', sub: 'Production execution & processing', color: 'emerald' },
    { id: 'Quality Check (QC)', label: '7. Quality Check (QC)', sub: 'Pre-dispatch quality assurance', color: 'rose' },
    { id: 'Ready for Dispatch', label: '8. Ready for Dispatch', sub: 'Finished packaging & shipment ready', color: 'teal' },
    { id: 'Dispatch', label: '9. Dispatch', sub: 'In-transit carrier logistics', color: 'orange' },
    { id: 'Delivered', label: '10. Delivered', sub: 'Confirmed customer delivery receipt', color: 'emerald' }
  ], []);

  const otdCards = useMemo(() => {
    return orders.map((o) => {
      const isDone = o.status === 'Delivered' || o.status === 'Closed' || o.currentStage === 'Delivered';
      const aging = calculateAging(o.expectedDeliveryDate || o.plannedCompletionDate, isDone);
      const buyerName = o.customerName || 'Direct Customer';
      const tag = o.customerName ? o.customerName.slice(0, 4).toUpperCase() : 'ORD';
      const firstItem = o.items?.[0];
      const itemTitle = firstItem?.productName || o.remarks || `Order ${o.orderNumber}`;
      const totalQty = o.items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) || (firstItem?.quantity || 1);
      const unit = firstItem?.unit || 'Pcs';
      const grandTotal = o.grandTotal || (firstItem?.amount || 0);

      // Real currentStage from order
      const stage = o.currentStage || 'Order Verification';

      return {
        id: o.id || o.orderNumber,
        code: o.soNumber ? `${o.orderNumber} | ${o.soNumber}` : o.orderNumber,
        tag,
        title: itemTitle,
        vendorOrCustomer: `Customer: ${buyerName}`,
        entityType: 'customer',
        department: o.salesPerson ? `Sales: ${o.salesPerson}` : 'Sales & Merchandising',
        assignee: o.salesPerson || o.contactPerson || 'Account Lead',
        stage,
        quote: o.remarks ? `REMARKS "${o.remarks.slice(0, 32)}"` : (o.deliveryLocation ? `DELIVERY "${o.deliveryLocation.slice(0, 32)}"` : ''),
        statLabel: 'QUANTITY',
        statValue: `${totalQty} ${unit}`,
        status: o.status || 'In Progress',
        priority: o.priority || 'Normal',
        value: grandTotal,
        formattedValue: formatCurrency(grandTotal),
        startDate: o.orderDate || '',
        targetDate: o.expectedDeliveryDate || o.plannedCompletionDate?.split('T')[0] || '',
        aging,
        raw: o,
        systemId: 'sales',
        stagePath: '/sales/dashboard'
      };
    });
  }, [orders]);

  // ==========================================
  // 3. PURCHASE SYSTEM (REAL INDENTS & PO)
  // ==========================================
  const purchaseStages = useMemo(() => [
    { id: 'Purchase Indent', label: '1. Purchase Indent', sub: 'Store raw material requisition', color: 'indigo' },
    { id: 'Indent Approval', label: '2. Indent Approval', sub: 'HOD approval & signoff', color: 'amber' },
    { id: 'PO', label: '3. Purchase Order (PO)', sub: 'PO issued to supplier', color: 'blue' },
    { id: 'Material Lifting / Dispatch', label: '4. Lifting / Dispatch', sub: 'Vendor dispatched & in-transit', color: 'cyan' },
    { id: 'Material Delivery', label: '5. Material Delivery', sub: 'Security gate delivery entry', color: 'teal' },
    { id: 'Material Receiving', label: '6. Material Receiving', sub: 'Store gate entry & MRN receipt', color: 'purple' },
    { id: 'Quality Check', label: '7. Quality Check (QC)', sub: 'Inward technical inspection', color: 'rose' },
    { id: 'GRN', label: '8. Goods Receipt (GRN)', sub: 'GRN generated & stock booked', color: 'teal' },
    { id: 'Payment', label: '9. Vendor Payment', sub: 'Vendor commercial clearance', color: 'emerald' }
  ], []);

  const purchaseCards = useMemo(() => {
    return purchases.map((p) => {
      const isDone = (p.currentStage === 'Payment' || p.currentStage === 'Vendor Payment') && p.status === 'Paid';
      const aging = calculateAging(p.requiredByDate || p.poDate, isDone);
      const vendorName = p.vendorName || p.preferredVendor || 'Supplier';
      const tag = p.vendorName ? p.vendorName.slice(0, 4).toUpperCase() : 'PO';
      const firstItem = p.items?.[0];
      const title = firstItem?.productName || p.purpose || `Indent ${p.indentNumber}`;
      const totalVal = p.totalPOValue || p.totalEstimatedValue || 0;

      const stage = p.currentStage || 'Purchase Indent';

      return {
        id: p.id || p.indentNumber,
        code: p.poNumber ? `${p.poNumber} | ${p.indentNumber}` : p.indentNumber,
        tag,
        title,
        vendorOrCustomer: `Vendor: ${vendorName}`,
        entityType: 'vendor',
        department: p.department || 'Stores & Procurement',
        assignee: p.indentorName || p.approvedBy || 'Buyer Officer',
        stage,
        quote: p.purpose ? `PURPOSE "${p.purpose.slice(0, 30)}"` : (firstItem?.productCode ? `ITEM CODE "${firstItem.productCode}"` : ''),
        statLabel: 'PO VALUE',
        statValue: formatCurrency(totalVal),
        status: p.status || 'Active',
        priority: p.priority || 'Normal',
        value: totalVal,
        formattedValue: formatCurrency(totalVal),
        startDate: p.indentDate || p.createdAt?.split('T')[0] || '',
        targetDate: p.requiredByDate || '',
        aging,
        raw: p,
        systemId: 'purchase',
        stagePath: '/purchase/dashboard'
      };
    });
  }, [purchases]);

  // ==========================================
  // 4. LEAD TO ORDER (REAL CRM LEADS & QUOTES)
  // ==========================================
  const leadStages = useMemo(() => [
    { id: 'Lead Creation', label: '1. Lead Creation', sub: 'Inbound prospective lead created', color: 'blue' },
    { id: 'Lead Verification', label: '2. Lead Verification', sub: 'Requirement & contact qualification', color: 'cyan' },
    { id: 'Follow-up', label: '3. Follow-up / Demo', sub: 'Product demo & discussions', color: 'indigo' },
    { id: 'Quotation', label: '4. Quotation', sub: 'Commercial quote submitted', color: 'purple' },
    { id: 'Negotiation', label: '5. Negotiation', sub: 'Price & contract negotiation', color: 'amber' },
    { id: 'Approval', label: '6. Approval', sub: 'Commercial approval by management', color: 'rose' },
    { id: 'Order to Delivery', label: '7. Won / Converted', sub: 'Deal won & converted to OTD', color: 'emerald' }
  ], []);

  const leadCards = useMemo(() => {
    return leads.map((l) => {
      const isDone = l.status === 'Converted to Order' || l.status === 'Won';
      const aging = calculateAging(l.expectedPurchaseDate, isDone);
      const clientName = l.customerName || 'Prospective Client';
      const tag = l.customerName ? l.customerName.slice(0, 4).toUpperCase() : 'LEAD';
      const title = l.productService || l.initialRequirement || `Lead ${l.leadId}`;
      const totalVal = l.dealValue || 0;

      let stage = l.currentStage || 'Lead Creation';
      if (stage === 'Follow-up / Enquiry') stage = 'Follow-up';

      return {
        id: l.id || l.leadId,
        code: l.quotationNo ? `${l.leadId} | ${l.quotationNo}` : l.leadId,
        tag,
        title,
        vendorOrCustomer: `Customer: ${clientName}`,
        entityType: 'customer',
        department: l.customerType || 'Corporate Sales',
        assignee: l.assignedTo || 'Account Rep',
        stage,
        quote: l.initialRequirement ? `REQUIREMENT "${l.initialRequirement.slice(0, 30)}"` : '',
        statLabel: 'DEAL VALUE',
        statValue: formatCurrency(totalVal),
        status: l.status || 'Active',
        priority: l.priority || 'Normal',
        value: totalVal,
        formattedValue: formatCurrency(totalVal),
        startDate: l.leadDate || l.createdAt?.split('T')[0] || '',
        targetDate: l.expectedPurchaseDate || '',
        aging,
        raw: l,
        systemId: 'lead-to-orders',
        stagePath: '/lead-to-orders/dashboard'
      };
    });
  }, [leads]);

  // ==========================================
  // 5. HR SYSTEM (REAL HR FMS CANDIDATES & STAFF)
  // ==========================================
  const hrStages = useMemo(() => [
    { id: 'Manpower Indent', label: '1. Manpower Indent', sub: 'Department hiring requisition', color: 'cyan' },
    { id: 'Indent Approval', label: '2. Indent Approval', sub: 'Management budget signoff', color: 'indigo' },
    { id: 'Interview Rounds', label: '3. Interview Rounds', sub: 'Technical evaluation rounds', color: 'amber' },
    { id: 'Offer Approval', label: '4. Offer / Salary', sub: 'Compensation signoff & release', color: 'rose' },
    { id: 'Joining Pending', label: '5. Joining Pending', sub: 'Onboarding & induction ready', color: 'teal' },
    { id: 'Exit & F&F', label: '6. Exit Clearance & F&F', sub: 'Department clearance & final settlement', color: 'slate' }
  ], []);

  const hrCards = useMemo(() => {
    const cards = [];

    // Real Indents
    hrIndents.forEach((ind) => {
      const aging = calculateAging(ind.targetJoiningDate || ind.expectedDate, ind.status === 'Approved');
      cards.push({
        id: ind.id || ind.indentNumber,
        code: ind.indentNumber,
        tag: 'INDENT',
        title: `${ind.designation || 'Staff'} (${ind.vacancies || 1} Openings)`,
        vendorOrCustomer: `Department: ${ind.department || 'Operations'}`,
        entityType: 'department',
        department: ind.department,
        assignee: ind.hiringManager || ind.indentorName || 'HOD',
        stage: ind.status === 'Pending Approval' ? 'Indent Approval' : 'Manpower Indent',
        quote: ind.budgetMax ? `BUDGET "₹ ${(ind.budgetMax / 100000).toFixed(1)} LPA"` : '',
        statLabel: 'BUDGET',
        statValue: ind.budgetMax ? `₹ ${(ind.budgetMax / 100000).toFixed(1)} LPA` : 'TBA',
        status: ind.status || 'Active',
        priority: ind.priority || 'Normal',
        value: ind.budgetMax || 0,
        formattedValue: ind.budgetMax ? `₹ ${(ind.budgetMax / 100000).toFixed(1)} LPA` : 'TBA',
        startDate: ind.indentDate || '',
        targetDate: ind.targetJoiningDate || '',
        aging,
        raw: ind,
        systemId: 'hr',
        stagePath: '/hr/indent-approval'
      });
    });

    // Real Interviews
    hrInterviews.forEach((intv) => {
      const aging = calculateAging(intv.interviewDate, intv.status === 'Selected' || intv.status === 'Rejected');
      cards.push({
        id: intv.id,
        code: intv.interviewId || `INTV-${intv.id?.slice(0, 4)}`,
        tag: 'INTV',
        title: `Candidate: ${intv.candidateName || 'Applicant'}`,
        vendorOrCustomer: `Role: ${intv.designation || 'Position'}`,
        entityType: 'candidate',
        department: intv.department || 'Technical',
        assignee: intv.interviewer || 'Panel HOD',
        stage: 'Interview Rounds',
        quote: `ROUND "${intv.roundName || 'Technical'} - ${intv.status || 'Scheduled'}"`,
        statLabel: 'ROUND',
        statValue: intv.roundName || 'Technical',
        status: intv.status || 'Scheduled',
        priority: 'Urgent',
        value: 0,
        formattedValue: intv.roundName || 'Technical',
        startDate: intv.scheduledDate || '',
        targetDate: intv.interviewDate || '',
        aging,
        raw: intv,
        systemId: 'hr',
        stagePath: '/hr/interviews'
      });
    });

    // Real Offers
    hrOffers.forEach((off) => {
      const aging = calculateAging(off.joiningDate, off.status === 'Accepted');
      cards.push({
        id: off.id,
        code: off.offerId || `OFF-${off.id?.slice(0, 4)}`,
        tag: 'OFFER',
        title: `Candidate: ${off.candidateName || 'Candidate'}`,
        vendorOrCustomer: `Designation: ${off.designation || 'Selected Candidate'}`,
        entityType: 'candidate',
        department: off.department || 'Corporate',
        assignee: off.approvedBy || 'HR Director',
        stage: 'Offer Approval',
        quote: off.offeredCtc ? `CTC "₹ ${(off.offeredCtc / 100000).toFixed(2)} LPA"` : '',
        statLabel: 'OFFERED CTC',
        statValue: off.offeredCtc ? `₹ ${(off.offeredCtc / 100000).toFixed(2)} LPA` : 'TBA',
        status: off.status || 'Pending Approval',
        priority: 'High',
        value: off.offeredCtc || 0,
        formattedValue: off.offeredCtc ? `₹ ${(off.offeredCtc / 100000).toFixed(2)} LPA` : 'TBA',
        startDate: off.offerDate || '',
        targetDate: off.joiningDate || '',
        aging,
        raw: off,
        systemId: 'hr',
        stagePath: '/hr/offer-approval'
      });
    });

    // Real Joinings
    hrJoinings.forEach((j) => {
      const aging = calculateAging(j.joiningDate, j.status === 'Joined');
      cards.push({
        id: j.id,
        code: j.joiningId || `JOIN-${j.id?.slice(0, 4)}`,
        tag: 'JOIN',
        title: `New Joiner: ${j.candidateName || 'Employee'}`,
        vendorOrCustomer: `Department: ${j.department || 'Operations'}`,
        entityType: 'candidate',
        department: j.department || 'Operations',
        assignee: 'Induction Incharge',
        stage: 'Joining Pending',
        quote: j.joiningDate ? `JOINING DATE "${formatDate(j.joiningDate)}"` : '',
        statLabel: 'STATUS',
        statValue: j.status || 'Joining Pending',
        status: j.status || 'Joining Pending',
        priority: 'Normal',
        value: 0,
        formattedValue: 'Induction Ready',
        startDate: j.createdAt?.split('T')[0] || '',
        targetDate: j.joiningDate || '',
        aging,
        raw: j,
        systemId: 'hr',
        stagePath: '/hr/joining-induction'
      });
    });

    // Real Clearances
    hrClearances.forEach((c) => {
      const aging = calculateAging(c.lastWorkingDay, c.status === 'Clearance Completed');
      cards.push({
        id: c.id,
        code: c.clearanceId || `CLR-${c.id?.slice(0, 4)}`,
        tag: 'EXIT',
        title: `Exit Clearance: ${c.employeeName || 'Staff Member'}`,
        vendorOrCustomer: `Department: ${c.department || 'Operations'}`,
        entityType: 'candidate',
        department: c.department || 'Admin',
        assignee: 'HR Operations',
        stage: 'Exit & F&F',
        quote: c.lastWorkingDay ? `LAST WORKING DAY "${formatDate(c.lastWorkingDay)}"` : '',
        statLabel: 'STATUS',
        statValue: c.status || 'Pending Clearance',
        status: c.status || 'Pending Clearance',
        priority: 'High',
        value: 0,
        formattedValue: 'Exit Formalities',
        startDate: c.resignationDate || '',
        targetDate: c.lastWorkingDay || '',
        aging,
        raw: c,
        systemId: 'hr',
        stagePath: '/hr/clearance-status'
      });
    });

    return cards;
  }, [hrIndents, hrInterviews, hrOffers, hrJoinings, hrClearances]);

  // ==========================================
  // 6. PETTY EXPENSES (REAL CASH & CHEQUES)
  // ==========================================
  const pettyStages = useMemo(() => [
    { id: 'Cash In-Hand', label: '1. Cash In-Hand', sub: 'Available cash balance in drawer', color: 'emerald' },
    { id: 'Undeposited Cheques', label: '2. In-Hand Cheques', sub: 'Received cheques awaiting bank deposit', color: 'amber' },
    { id: 'In-Clearing Deposits', label: '3. Clearing Deposits', sub: 'Cheques deposited in banking clearing', color: 'cyan' },
    { id: 'Expense Outgoings Pending', label: '4. Expense Vouchers', sub: 'Petty cash expense bills & outgoings', color: 'rose' },
    { id: 'Cleared & Reconciled', label: '5. Cleared & Reconciled', sub: 'Reconciled cheques & settled cash entries', color: 'purple' }
  ], []);

  const pettyCards = useMemo(() => {
    const cards = [];

    // Real Cheques
    pettyCheques.forEach((chq) => {
      const isCleared = chq.status === 'cleared';
      const aging = calculateAging(chq.depositDueDate || chq.chequeDate, isCleared);
      let stage = 'Undeposited Cheques';
      if (chq.status === 'cleared') stage = 'Cleared & Reconciled';
      else if (chq.status === 'in_clearing' || chq.status === 'deposited') stage = 'In-Clearing Deposits';

      const party = chq.partyName || chq.payee || 'Direct Party';
      const tag = chq.bankName ? chq.bankName.slice(0, 4).toUpperCase() : 'CHQ';

      cards.push({
        id: chq.id || `chq-${chq.chequeNumber}`,
        code: `CHQ #${chq.chequeNumber}`,
        tag,
        title: `Cheque: ${chq.bankName || 'Bank'} #${chq.chequeNumber}`,
        vendorOrCustomer: `Party: ${party}`,
        entityType: 'vendor',
        department: chq.bankName || 'Bank',
        assignee: chq.drawer || 'Accounts Cashier',
        stage,
        quote: chq.remarks ? `REMARKS "${chq.remarks.slice(0, 30)}"` : `BANK "${chq.bankName || 'Bank'}"`,
        statLabel: 'AMOUNT',
        statValue: formatCurrency(chq.amount || 0),
        status: chq.status || 'Undeposited',
        priority: chq.amount > 50000 ? 'High' : 'Normal',
        value: Number(chq.amount) || 0,
        formattedValue: formatCurrency(chq.amount || 0),
        startDate: chq.chequeDate || '',
        targetDate: chq.depositDueDate || '',
        aging,
        raw: chq,
        systemId: 'petty-expenses',
        stagePath: '/petty-expenses/cheque-tracker'
      });
    });

    // Real Cash Transactions
    pettyTxns.forEach((txn) => {
      const isCompleted = txn.status === 'cleared' || txn.status === 'approved';
      const aging = calculateAging(txn.date, isCompleted);
      let stage = 'Cash In-Hand';
      if (txn.type === 'outgoing') stage = 'Expense Outgoings Pending';
      else if (txn.status === 'cleared') stage = 'Cleared & Reconciled';

      const party = txn.paidTo || txn.receivedFrom || 'General Expense';
      const tag = txn.type === 'incoming' ? 'RCV' : 'EXP';

      cards.push({
        id: txn.id || `txn-${txn.txnId}`,
        code: txn.voucherNo || txn.txnId || 'TXN',
        tag,
        title: `${txn.type === 'incoming' ? 'Received' : 'Expense'}: ${txn.purpose || txn.category || 'Voucher'}`,
        vendorOrCustomer: `Payee / Vendor: ${party}`,
        entityType: 'vendor',
        department: txn.category || 'Administration',
        assignee: txn.approvedBy || txn.handedTo || 'Accounts',
        stage,
        quote: txn.purpose ? `PURPOSE "${txn.purpose.slice(0, 30)}"` : '',
        statLabel: 'AMOUNT',
        statValue: formatCurrency(txn.amount || 0),
        status: txn.status || 'Active',
        priority: 'Normal',
        value: Number(txn.amount) || 0,
        formattedValue: formatCurrency(txn.amount || 0),
        startDate: txn.date || '',
        targetDate: txn.date || '',
        aging,
        raw: txn,
        systemId: 'petty-expenses',
        stagePath: '/petty-expenses/dashboard'
      });
    });

    return cards;
  }, [pettyCheques, pettyTxns]);

  // ==========================================
  // 7. DOCUMENT & SUBSCRIPTION (REAL DOCS & SAAS)
  // ==========================================
  const docSubStages = useMemo(() => [
    { id: 'Pending Verification', label: '1. Pending Audit', sub: 'Documents requiring verification', color: 'amber' },
    { id: 'Active & Compliant', label: '2. Active & Compliant', sub: 'Verified legal documents & active SaaS', color: 'emerald' },
    { id: 'Expiring Soon (30d)', label: '3. Expiring Soon (30d)', sub: 'Licenses & renewals within 30 days', color: 'orange' },
    { id: 'Expired Documents', label: '4. Expired Critical', sub: 'Overdue licenses requiring immediate action', color: 'rose' },
    { id: 'SaaS Renewal Due', label: '5. Renewal Due', sub: 'Upcoming subscription contract renewal', color: 'purple' },
    { id: 'Subscription Payment Due', label: '6. Payment Due', sub: 'SaaS invoices awaiting billing clearance', color: 'blue' }
  ], []);

  const docSubCards = useMemo(() => {
    const cards = [];

    // Real Documents
    documents.forEach((doc) => {
      const isVerified = doc.verificationStatus === 'verified' && doc.status !== 'expired';
      const aging = calculateAging(doc.expiryDate, isVerified);
      let stage = 'Active & Compliant';
      if (doc.verificationStatus === 'pending') stage = 'Pending Verification';
      else if (doc.status === 'expired' || aging.isOverdue) stage = 'Expired Documents';
      else if (aging.isDueSoon) stage = 'Expiring Soon (30d)';

      const authority = doc.issuingAuthority || doc.category || 'Govt Authority';
      const tag = doc.category ? doc.category.slice(0, 4).toUpperCase() : 'DOC';

      cards.push({
        id: doc.id || doc.documentId,
        code: doc.documentId || doc.docNumber || 'DOC',
        tag,
        title: doc.title || doc.documentName || 'Official License',
        vendorOrCustomer: `Authority: ${authority}`,
        entityType: 'vendor',
        department: doc.department || 'Legal & Compliance',
        assignee: doc.custodian || 'Compliance Officer',
        stage,
        quote: doc.documentType ? `TYPE "${doc.documentType}"` : '',
        statLabel: 'EXPIRY DATE',
        statValue: formatDate(doc.expiryDate),
        status: doc.status || 'Active',
        priority: doc.status === 'expired' ? 'Urgent' : 'Normal',
        value: 0,
        formattedValue: doc.verificationStatus || 'Verified',
        startDate: doc.issueDate || '',
        targetDate: doc.expiryDate || '',
        aging,
        raw: doc,
        systemId: 'doc-subscription',
        stagePath: '/doc-subscription/all-documents'
      });
    });

    // Real Subscriptions
    subscriptions.forEach((sub) => {
      const isOk = sub.status === 'active' && sub.paymentStatus === 'paid';
      const aging = calculateAging(sub.renewalDate || sub.nextBillingDate, isOk);
      let stage = 'Active & Compliant';
      if (sub.paymentStatus === 'payment_due') stage = 'Subscription Payment Due';
      else if (sub.status === 'renewal_due' || aging.isDueSoon) stage = 'SaaS Renewal Due';
      else if (aging.isOverdue) stage = 'Expired Documents';

      const vendor = sub.vendor || sub.provider || 'Software Vendor';
      const tag = sub.category ? sub.category.slice(0, 4).toUpperCase() : 'SAAS';

      cards.push({
        id: sub.id || sub.subscriptionId,
        code: sub.subscriptionId || sub.subId || 'SUB',
        tag,
        title: sub.name || sub.toolName || 'Enterprise Tool',
        vendorOrCustomer: `Vendor: ${vendor}`,
        entityType: 'vendor',
        department: sub.department || 'IT Infrastructure',
        assignee: sub.custodian || 'IT Admin',
        stage,
        quote: sub.billingCycle ? `CYCLE "${sub.billingCycle} Renewal"` : '',
        statLabel: 'ANNUAL COST',
        statValue: formatCurrency(sub.annualCost || sub.cost || 0),
        status: sub.status || 'Active',
        priority: sub.paymentStatus === 'payment_due' ? 'High' : 'Normal',
        value: Number(sub.annualCost || sub.cost) || 0,
        formattedValue: formatCurrency(sub.annualCost || sub.cost || 0),
        startDate: sub.startDate || '',
        targetDate: sub.renewalDate || '',
        aging,
        raw: sub,
        systemId: 'doc-subscription',
        stagePath: '/doc-subscription/all-subscriptions'
      });
    });

    return cards;
  }, [documents, subscriptions]);

  // Master Modules Definition (Exact names requested by user)
  const modulesList = useMemo(() => [
    {
      id: 'checklist',
      label: 'Checklist & Delegation',
      shortLabel: 'Checklist',
      icon: CheckSquare,
      iconBg: 'bg-indigo-600',
      badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
      desc: 'Assigned tasks, recurring checklists & daily operations',
      entityLabel: 'Employee',
      stages: checklistStages,
      cards: checklistCards,
      systemId: 'checklist'
    },
    {
      id: 'otd',
      label: 'Order To Delivery',
      shortLabel: 'Order To Delivery',
      icon: TrendingUp,
      iconBg: 'bg-emerald-600',
      badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      desc: '10-stage order fulfillment & manufacturing delivery pipeline',
      entityLabel: 'Customer',
      stages: otdStages,
      cards: otdCards,
      systemId: 'sales'
    },
    {
      id: 'purchase',
      label: 'Purchase',
      shortLabel: 'Purchase',
      icon: ShoppingCart,
      iconBg: 'bg-amber-500',
      badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      desc: 'Purchase indents, PO issuance, store MRN & supplier payments',
      entityLabel: 'Vendor',
      stages: purchaseStages,
      cards: purchaseCards,
      systemId: 'purchase'
    },
    {
      id: 'leads',
      label: 'Lead to Order',
      shortLabel: 'Lead to Order',
      icon: Target,
      iconBg: 'bg-violet-600',
      badgeColor: 'bg-violet-500/20 text-violet-600 dark:text-violet-400',
      desc: 'Customer leads, follow-ups, quotations & order conversions',
      entityLabel: 'Lead',
      stages: leadStages,
      cards: leadCards,
      systemId: 'lead-to-orders'
    },
    {
      id: 'hr',
      label: 'HR System',
      shortLabel: 'HR System',
      icon: Users,
      iconBg: 'bg-cyan-600',
      badgeColor: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
      desc: 'Manpower indents, candidate interviews, offers & clearances',
      entityLabel: 'Employee',
      stages: hrStages,
      cards: hrCards,
      systemId: 'hr'
    },
    {
      id: 'petty',
      label: 'Petty Expense',
      shortLabel: 'Petty Expense',
      icon: Wallet,
      iconBg: 'bg-teal-600',
      badgeColor: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
      desc: 'Cash in-hand, bank cheques tracking & expense vouchers',
      entityLabel: 'Vendor / Payee',
      stages: pettyStages,
      cards: pettyCards,
      systemId: 'petty-expenses'
    },
    {
      id: 'docsub',
      label: 'Document & Subscription',
      shortLabel: 'Doc & Sub',
      icon: Files,
      iconBg: 'bg-blue-600',
      badgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      desc: 'Statutory compliance, legal audits & SaaS renewals',
      entityLabel: 'Compliance / Vendor',
      stages: docSubStages,
      cards: docSubCards,
      systemId: 'doc-subscription'
    }
  ], [
    checklistStages, checklistCards,
    otdStages, otdCards,
    purchaseStages, purchaseCards,
    leadStages, leadCards,
    hrStages, hrCards,
    pettyStages, pettyCards,
    docSubStages, docSubCards
  ]);

  // Current active module config
  const activeModuleConfig = useMemo(() => {
    return modulesList.find((m) => m.id === activeModule) || modulesList[0];
  }, [modulesList, activeModule]);

  // Filter cards based on search and status filter
  const filteredCards = useMemo(() => {
    let result = activeModuleConfig.cards;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((c) =>
        c.title?.toLowerCase().includes(q) ||
        c.code?.toLowerCase().includes(q) ||
        c.vendorOrCustomer?.toLowerCase().includes(q) ||
        c.assignee?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q) ||
        c.stage?.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'pending') {
      result = result.filter((c) =>
        c.status !== 'Completed' && c.status !== 'Closed' && c.status !== 'Delivered' &&
        c.stage !== 'Completed' && c.stage !== 'Delivered' && !c.aging.isOverdue
      );
    } else if (statusFilter === 'overdue') {
      result = result.filter((c) => c.aging.isOverdue || c.status === 'Overdue' || c.status === 'expired');
    } else if (statusFilter === 'upcoming') {
      result = result.filter((c) => c.aging.isUpcoming && !c.aging.isOverdue);
    }

    return result;
  }, [activeModuleConfig.cards, searchTerm, statusFilter]);

  // Total active items across all modules
  const totalActiveAcrossAllModules = useMemo(() => {
    return modulesList.reduce((acc, m) => {
      const activeInModule = m.cards.filter((c) =>
        c.status !== 'Completed' && c.status !== 'Closed' && c.status !== 'Delivered'
      ).length;
      return acc + activeInModule;
    }, 0);
  }, [modulesList]);

  // Counts for the active module
  const activeModuleActiveCount = useMemo(() => {
    return activeModuleConfig.cards.filter((c) =>
      c.status !== 'Completed' && c.status !== 'Closed' && c.status !== 'Delivered'
    ).length;
  }, [activeModuleConfig.cards]);

  const pendingCount = useMemo(() => {
    return activeModuleConfig.cards.filter((c) =>
      c.status !== 'Completed' && c.status !== 'Closed' && c.status !== 'Delivered' && !c.aging.isOverdue
    ).length;
  }, [activeModuleConfig.cards]);

  const overdueCount = useMemo(() => {
    return activeModuleConfig.cards.filter((c) => c.aging.isOverdue || c.status === 'Overdue').length;
  }, [activeModuleConfig.cards]);

  const upcomingCount = useMemo(() => {
    return activeModuleConfig.cards.filter((c) => c.aging.isUpcoming && !c.aging.isOverdue).length;
  }, [activeModuleConfig.cards]);

  // Navigate to stage page
  const handleOpenStage = (systemId, path) => {
    if (switchSystem && path) {
      switchSystem(systemId, false);
      navigate(path);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP BAR: Total Active Items & Permitted Pipelines Selector */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Total Active Items Badge */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-2.5 rounded-2xl flex items-center gap-3.5 shadow-md border border-slate-800">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">
              TOTAL ACTIVE ITEMS
            </span>
            <span className="text-2xl font-black text-white leading-tight">
              {totalActiveAcrossAllModules}
            </span>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Sync all pipelines"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Side: Permitted Pipelines Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <div className={`p-2 rounded-xl text-white ${activeModuleConfig.iconBg} shadow-sm`}>
              <activeModuleConfig.icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                {activeModuleConfig.label}
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                {activeModuleConfig.stages.length} Stages • {activeModuleActiveCount} active
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
              {activeModuleActiveCount}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Dropdown Card */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  PERMITTED PIPELINES ({modulesList.length})
                </span>
                <span className="text-[10px] font-bold text-slate-400">Click to switch</span>
              </div>
              <div className="space-y-1 mt-1 max-h-96 overflow-y-auto custom-scrollbar">
                {modulesList.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => {
                      setActiveModule(mod.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition-all text-left cursor-pointer ${
                      activeModule === mod.id
                        ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl text-white ${mod.iconBg} shrink-0`}>
                        <mod.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold leading-tight truncate">{mod.label}</h5>
                        <p className="text-[10px] text-slate-400 truncate">{mod.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {mod.cards.length}
                      </span>
                      {activeModule === mod.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN INSPECTION CONTAINER (Card Layout) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
        {/* Module Sub-Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl text-white ${activeModuleConfig.iconBg} shadow-md`}>
              <activeModuleConfig.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {activeModuleConfig.label}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                  {activeModuleActiveCount} Active Items
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeModuleConfig.stages.length}-stage milestone pipeline for {activeModuleConfig.entityLabel} tracking & operational velocity
              </p>
            </div>
          </div>

          {/* Search Input & Status Filter Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeModuleConfig.entityLabel} or code...`}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips: All, Pendings, Overdues, Upcoming */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({activeModuleConfig.cards.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-600 hover:text-amber-700'
                }`}
              >
                Pendings ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('overdue')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'overdue'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-rose-600 hover:text-rose-700'
                }`}
              >
                Overdues ({overdueCount})
              </button>
              <button
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Upcoming ({upcomingCount})
              </button>
            </div>
          </div>
        </div>

        {/* 4. HORIZONTAL KANBAN STAGE COLUMNS (Card Layout) */}
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 min-w-max items-start">
            {activeModuleConfig.stages.map((stage) => {
              // Match stage cards
              const stageCards = filteredCards.filter((c) => {
                const s1 = (c.stage || '').toLowerCase().trim();
                const s2 = (stage.id || '').toLowerCase().trim();
                return s1 === s2 || s1.includes(s2) || s2.includes(s1);
              });

              // Dot colors per stage
              const stageDotColor =
                stage.color === 'rose'
                  ? 'bg-rose-500'
                  : stage.color === 'amber' || stage.color === 'orange'
                  ? 'bg-amber-500'
                  : stage.color === 'emerald' || stage.color === 'teal'
                  ? 'bg-emerald-500'
                  : stage.color === 'cyan'
                  ? 'bg-cyan-500'
                  : 'bg-blue-500';

              return (
                <div
                  key={stage.id}
                  className="w-80 sm:w-84 flex-shrink-0 bg-slate-50/70 dark:bg-slate-800/30 rounded-3xl p-3.5 border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[780px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/70 dark:border-slate-700/70">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${stageDotColor}`} />
                        <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider truncate">
                          {stage.id}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5" title={stage.sub || stage.label}>
                        {stage.sub || stage.label}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="w-6 h-6 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[11px] flex items-center justify-center">
                        {stageCards.length}
                      </span>
                      {stage.path && (
                        <button
                          onClick={() => handleOpenStage(activeModuleConfig.systemId, stage.path)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Open stage module"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cards Stack inside Column */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[140px]">
                    {stageCards.length === 0 ? (
                      <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/40">
                        <CheckCircle2 className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1.5" />
                        <span className="text-[11px] text-slate-400 font-medium">No items pending in this stage</span>
                      </div>
                    ) : (
                      stageCards.map((card) => {
                        const isOverdue = card.aging.isOverdue;
                        const isDueSoon = card.aging.isDueSoon;

                        // Border styling
                        const borderClass = isOverdue
                          ? 'border-rose-400 dark:border-rose-500/90'
                          : isDueSoon
                          ? 'border-amber-400 dark:border-amber-500/90'
                          : 'border-blue-300 dark:border-blue-500/60';

                        // Status pill badge with bullet dot
                        const statusPillClass = isOverdue
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                          : isDueSoon
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60';

                        const dotClass = isOverdue ? 'bg-rose-500' : isDueSoon ? 'bg-amber-500' : 'bg-blue-500';

                        return (
                          <div
                            key={card.id}
                            onClick={() => setSelectedCard(card)}
                            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 ${borderClass} shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between`}
                          >
                            <div>
                              {/* Top Row: Tag & Status Badge */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs font-mono truncate max-w-[130px]">
                                  {card.code}
                                </span>

                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusPillClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                                  <span>{card.aging.text}</span>
                                </span>
                              </div>

                              {/* Title (Real product, task, role, doc name) */}
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {card.title}
                              </h4>

                              {/* Entity Line (Real Vendor, Customer, Lead, Employee) */}
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2.5 truncate">
                                {card.vendorOrCustomer}
                              </p>

                              {/* Quote Box (Only if real quote/remarks exist) */}
                              {card.quote && (
                                <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 mb-3 flex items-center justify-between gap-2 text-[11px]">
                                  <span className="font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 text-[10px] shrink-0">
                                    {card.stage}
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-300 font-mono text-xs truncate italic">
                                    "{card.quote}"
                                  </span>
                                </div>
                              )}

                              {/* Middle Stats Grid (Real quantity, value, category) */}
                              <div className="grid grid-cols-2 gap-2 text-[10px] mb-3 p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                <div>
                                  <span className="text-slate-400 font-bold uppercase tracking-wider block">
                                    {card.statLabel || 'QUANTITY / VAL'}
                                  </span>
                                  <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate block mt-0.5">
                                    {card.statValue || card.formattedValue || '—'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase tracking-wider block">
                                    CURRENT STAGE
                                  </span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs truncate block mt-0.5">
                                    {card.stage}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Bar: Real Dates & Assignee Pill */}
                            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  {formatDate(card.startDate)}
                                  {card.targetDate ? ` - ${formatDate(card.targetDate)}` : ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 text-[10px] font-bold">
                                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] font-black">
                                  {card.assignee ? card.assignee[0].toUpperCase() : 'S'}
                                </span>
                                <span className="truncate max-w-[90px]">{card.assignee}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE CARD DETAIL MODAL */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {selectedCard.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      selectedCard.priority === 'Urgent'
                        ? 'bg-rose-500 text-white'
                        : selectedCard.priority === 'High'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    {selectedCard.priority} Priority
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {selectedCard.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Entity Details Box (Vendor / Customer / Employee) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {selectedCard.entityType === 'vendor' ? 'Associated Vendor Details' : 'Customer & Entity Details'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Name / Party</span>
                  <strong className="text-slate-900 dark:text-white text-sm">{selectedCard.vendorOrCustomer}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Current Stage</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold">
                    {selectedCard.stage}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Department / Assignee</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {selectedCard.department} • {selectedCard.assignee}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Date & Aging</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(selectedCard.targetDate)} ({selectedCard.aging.text})
                  </span>
                </div>
              </div>
            </div>

            {/* Item Breakdown or Financial Details */}
            {selectedCard.raw?.items && selectedCard.raw.items.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Item Specifications & BOQ</h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">Item / Product</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Rate</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedCard.raw.items.map((it, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">{it.productName}</td>
                          <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400 font-mono">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400 font-mono">
                            {formatCurrency(it.estimatedRate || it.rate || 0)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                            {formatCurrency(it.amount || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedCard(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>

              {selectedCard.stagePath && (
                <button
                  onClick={() => {
                    const path = selectedCard.stagePath;
                    setSelectedCard(null);
                    handleOpenStage(selectedCard.systemId, path);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Open Stage Workflow</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
