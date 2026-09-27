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
  Sparkles
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
  onRefresh
}) {
  const navigate = useNavigate();
  const { switchSystem, hasModuleAccess } = useSystem();

  // Active module tab with permission verification
  const [activeModule, setActiveModule] = useState(() => {
    if (hasModuleAccess && hasModuleAccess('purchase')) return 'purchase';
    if (hasModuleAccess && hasModuleAccess('sales')) return 'otd';
    if (hasModuleAccess && hasModuleAccess('lead-to-orders')) return 'leads';
    if (hasModuleAccess && hasModuleAccess('hr')) return 'hr';
    return 'checklist';
  });

  // Keep activeModule in sync if permissions change
  React.useEffect(() => {
    if (hasModuleAccess) {
      const allowedMap = {
        purchase: hasModuleAccess('purchase'),
        otd: hasModuleAccess('sales'),
        leads: hasModuleAccess('lead-to-orders'),
        hr: hasModuleAccess('hr'),
        checklist: hasModuleAccess('checklist'),
      };
      if (!allowedMap[activeModule]) {
        const firstAllowed = Object.keys(allowedMap).find((k) => allowedMap[k]) || 'checklist';
        setActiveModule(firstAllowed);
      }
    }
  }, [hasModuleAccess, activeModule]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'overdue'
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [selectedCard, setSelectedCard] = useState(null); // For detail modal

  // Calculate days overdue or remaining
  const calculateAging = (targetDateStr, isCompleted = false) => {
    if (!targetDateStr) return { text: 'On Track', isOverdue: false, days: 0 };
    if (isCompleted) return { text: 'Completed', isOverdue: false, days: 0 };

    const target = new Date(targetDateStr).getTime();
    const now = new Date().getTime();
    const diffMs = target - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        text: `${overdueDays} ${overdueDays === 1 ? 'DAY' : 'DAYS'}`,
        isOverdue: true,
        days: overdueDays
      };
    } else if (diffDays === 0) {
      return { text: 'DUE TODAY', isOverdue: false, isDueSoon: true, days: 0 };
    } else if (diffDays <= 3) {
      return { text: `${diffDays}D LEFT`, isOverdue: false, isDueSoon: true, days: diffDays };
    }
    return { text: 'ON TRACK', isOverdue: false, days: diffDays };
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

  // 1. PURCHASE MODULE STAGES & MAPPING
  const purchaseStages = useMemo(() => [
    { id: 'Purchase Indent', label: '1. Purchase Indent', path: '/purchase/indent', color: 'indigo' },
    { id: 'Indent Approval', label: '2. Indent Approval', path: '/purchase/indent-approval', color: 'amber' },
    { id: 'PO', label: '3. Purchase Order (PO)', path: '/purchase/po', color: 'blue' },
    { id: 'Material Lifting / Dispatch', label: '4. Lifting / Dispatch', path: '/purchase/lifting-dispatch', color: 'cyan' },
    { id: 'Material Delivery', label: '5. In-Transit Delivery', path: '/purchase/delivery', color: 'emerald' },
    { id: 'Material Receiving', label: '6. Material Receiving', path: '/purchase/receiving', color: 'purple' },
    { id: 'Quality Check', label: '7. Quality Check (QC)', path: '/purchase/quality-check', color: 'rose' },
    { id: 'GRN', label: '8. Goods Receipt (GRN)', path: '/purchase/grn', color: 'teal' },
    { id: 'Payment', label: '9. Vendor Payment', path: '/purchase/payment', color: 'emerald' }
  ], []);

  const purchaseCards = useMemo(() => {
    return purchases.map((p) => {
      const aging = calculateAging(p.requiredByDate || p.poDate, p.currentStage === 'Payment' && p.status === 'Paid');
      const vendor = p.vendorName || p.preferredVendor || 'Vendor Not Assigned';
      const itemsDesc = p.items?.map((i) => i.productName).join(', ') || p.purpose || 'General Requisition';
      const totalVal = p.totalPOValue || p.totalEstimatedValue || 0;

      return {
        id: p.id || p.indentNumber,
        code: p.poNumber ? `${p.poNumber} | ${p.indentNumber}` : p.indentNumber,
        title: itemsDesc,
        vendorOrCustomer: vendor,
        entityType: 'vendor',
        department: p.department || 'Stores',
        assignee: p.indentorName || p.approvedBy || 'Buyer Officer',
        stage: p.currentStage || 'Purchase Indent',
        status: p.status || 'Active',
        priority: p.priority || 'Normal',
        value: totalVal,
        formattedValue: formatCurrency(totalVal),
        startDate: p.indentDate || p.createdAt?.split('T')[0] || '2026-09-10',
        targetDate: p.requiredByDate || '2026-09-25',
        aging,
        raw: p,
        systemId: 'purchase',
        stagePath: purchaseStages.find((s) => s.id === p.currentStage)?.path || '/purchase/dashboard'
      };
    });
  }, [purchases, purchaseStages]);

  // 2. OTD MODULE STAGES & MAPPING
  const otdStages = useMemo(() => [
    { id: 'New Order', label: '1. New Order', path: '/sales/orders', color: 'blue' },
    { id: 'Order Verification', label: '2. Order Verification', path: '/sales/verification', color: 'indigo' },
    { id: 'Order Approval', label: '3. Order Approval', path: '/sales/approval', color: 'purple' },
    { id: 'Advance Payment', label: '4. Advance Payment', path: '/sales/advance-payment', color: 'amber' },
    { id: 'Stock Check', label: '5. Stock Check', path: '/sales/stock-check', color: 'cyan' },
    { id: 'Order Processing', label: '6. Order Processing', path: '/sales/processing', color: 'emerald' },
    { id: 'Quality Check (QC)', label: '7. Quality Check (QC)', path: '/sales/quality-check', color: 'rose' },
    { id: 'Ready for Dispatch', label: '8. Ready for Dispatch', path: '/sales/ready-for-dispatch', color: 'teal' },
    { id: 'Dispatch', label: '9. Dispatch', path: '/sales/dispatch', color: 'orange' },
    { id: 'Delivered', label: '10. Delivered', path: '/sales/delivered', color: 'emerald' },
    { id: 'Payment Collection', label: '11. Payment Collection', path: '/sales/payment-collection', color: 'violet' },
    { id: 'Order Closed', label: '12. Order Closed', path: '/sales/closed', color: 'slate' }
  ], []);

  const otdCards = useMemo(() => {
    return orders.map((o) => {
      const aging = calculateAging(o.plannedCompletionDate || o.expectedDeliveryDate, o.status === 'Closed' || o.currentStage === 'Order Closed');
      const customer = o.customerName || 'Direct Customer';
      const itemsDesc = o.items?.map((i) => i.productName).join(', ') || o.remarks || 'Standard Order Items';
      const totalVal = o.grandTotal || 0;

      return {
        id: o.id || o.orderNumber,
        code: o.soNumber ? `${o.orderNumber} | ${o.soNumber}` : o.orderNumber,
        title: itemsDesc,
        vendorOrCustomer: customer,
        entityType: 'customer',
        department: o.salesPerson ? `Sales: ${o.salesPerson}` : 'Sales Team',
        assignee: o.salesPerson || 'Account Lead',
        stage: o.currentStage || 'New Order',
        status: o.status || 'In Progress',
        priority: o.priority || 'Normal',
        value: totalVal,
        formattedValue: formatCurrency(totalVal),
        startDate: o.orderDate || o.createdAt?.split('T')[0] || '2026-09-12',
        targetDate: o.expectedDeliveryDate || '2026-09-26',
        aging,
        raw: o,
        systemId: 'sales',
        stagePath: otdStages.find((s) => s.id === o.currentStage)?.path || '/sales/dashboard'
      };
    });
  }, [orders, otdStages]);

  // 3. LEAD TO ORDERS MODULE STAGES & MAPPING
  const leadStages = useMemo(() => [
    { id: 'Lead Creation', label: '1. Lead Creation', path: '/lead-to-orders/leads', color: 'blue' },
    { id: 'Lead Verification', label: '2. Verification', path: '/lead-to-orders/leads', color: 'cyan' },
    { id: 'Follow-up / Enquiry', label: '3. Follow-up', path: '/lead-to-orders/follow-up', color: 'indigo' },
    { id: 'Quotation', label: '4. Quotation', path: '/lead-to-orders/quotation', color: 'purple' },
    { id: 'Negotiation', label: '5. Negotiation', path: '/lead-to-orders/negotiation', color: 'amber' },
    { id: 'Approval', label: '6. Approval', path: '/lead-to-orders/approval', color: 'rose' },
    { id: 'Order to Delivery', label: '7. Won / To OTD', path: '/lead-to-orders/dashboard', color: 'emerald' }
  ], []);

  const leadCards = useMemo(() => {
    return leads.map((l) => {
      const aging = calculateAging(l.expectedPurchaseDate, l.status === 'Converted to Order' || l.status === 'Won');
      const client = l.customerName || 'Institutional Client';
      const itemsDesc = l.productService || l.initialRequirement || 'Sales Requirement';
      const totalVal = l.dealValue || 185000;

      return {
        id: l.id || l.leadId,
        code: l.quotationNo ? `${l.leadId} | ${l.quotationNo}` : l.leadId,
        title: itemsDesc,
        vendorOrCustomer: client,
        entityType: 'customer',
        department: l.customerType || 'Corporate',
        assignee: l.assignedTo || 'Sales Rep',
        stage: l.currentStage || 'Lead Creation',
        status: l.status || 'Active',
        priority: l.priority || 'Normal',
        value: totalVal,
        formattedValue: formatCurrency(totalVal),
        startDate: l.leadDate || l.createdAt?.split('T')[0] || '2026-09-15',
        targetDate: l.expectedPurchaseDate || '2026-10-10',
        aging,
        raw: l,
        systemId: 'lead-to-orders',
        stagePath: leadStages.find((s) => s.id === l.currentStage)?.path || '/lead-to-orders/dashboard'
      };
    });
  }, [leads, leadStages]);

  // 4. HR FLOW MANAGEMENT SYSTEM (HR FMS) STAGES & MAPPING
  const hrStages = useMemo(() => [
    { id: 'Manpower Indent', label: '1. Manpower Indent', path: '/hr/manpower-indent', color: 'cyan' },
    { id: 'Indent Approval', label: '2. Indent Approval', path: '/hr/indent-approval', color: 'indigo' },
    { id: 'Job Sourcing', label: '3. Job Sourcing', path: '/hr/job-enquiry', color: 'blue' },
    { id: 'Candidate Screening', label: '4. Screening', path: '/hr/candidate-database', color: 'purple' },
    { id: 'Interview Rounds', label: '5. Interviews', path: '/hr/interviews', color: 'amber' },
    { id: 'Offer Approval', label: '6. Offer / Salary', path: '/hr/offer-approval', color: 'rose' },
    { id: 'Joining Pending', label: '7. Joining Pending', path: '/hr/joining-induction', color: 'teal' },
    { id: 'Exit & F&F', label: '8. Exit Clearance & F&F', path: '/hr/fnf-statement', color: 'slate' }
  ], []);

  const hrCards = useMemo(() => {
    const cards = [];

    // Map HR Indents
    hrIndents.forEach((ind) => {
      const aging = calculateAging(ind.targetJoiningDate || ind.expectedDate, ind.status === 'Approved');
      cards.push({
        id: ind.id || ind.indentNumber,
        code: ind.indentNumber,
        title: `${ind.designation || 'Role'} (${ind.vacancies || 1} Openings)`,
        vendorOrCustomer: `Requisition: ${ind.department || 'Operations'}`,
        entityType: 'department',
        department: ind.department,
        assignee: ind.hiringManager || ind.indentorName || 'HR Lead',
        stage: ind.status === 'Pending Approval' ? 'Indent Approval' : 'Manpower Indent',
        status: ind.status || 'Active',
        priority: ind.priority || 'High',
        value: ind.budgetMin ? ind.budgetMax || ind.budgetMin : 450000,
        formattedValue: ind.budgetMax ? `₹ ${(ind.budgetMax / 100000).toFixed(1)} LPA` : 'Budget TBA',
        startDate: ind.indentDate || '2026-09-12',
        targetDate: ind.targetJoiningDate || '2026-10-15',
        aging,
        raw: ind,
        systemId: 'hr',
        stagePath: '/hr/indent-approval'
      });
    });

    // Map Interviews
    hrInterviews.forEach((intv) => {
      const aging = calculateAging(intv.interviewDate, intv.status === 'Selected' || intv.status === 'Rejected');
      cards.push({
        id: intv.id,
        code: intv.interviewId || `INTV-${intv.id?.slice(0, 4)}`,
        title: `Candidate: ${intv.candidateName || 'Applicant'}`,
        vendorOrCustomer: `Role: ${intv.designation || 'Position'}`,
        entityType: 'candidate',
        department: intv.department || 'Technical',
        assignee: intv.interviewer || 'Panel HOD',
        stage: 'Interview Rounds',
        status: intv.status || 'Scheduled',
        priority: 'Urgent',
        value: 0,
        formattedValue: `Round: ${intv.roundName || 'Technical'}`,
        startDate: intv.scheduledDate || '2026-09-18',
        targetDate: intv.interviewDate || '2026-09-24',
        aging,
        raw: intv,
        systemId: 'hr',
        stagePath: '/hr/interviews'
      });
    });

    // Map Offers
    hrOffers.forEach((off) => {
      const aging = calculateAging(off.joiningDate, off.status === 'Accepted');
      cards.push({
        id: off.id,
        code: off.offerId || `OFF-${off.id?.slice(0, 4)}`,
        title: `Offer: ${off.candidateName || 'Candidate'}`,
        vendorOrCustomer: `CTC: ₹ ${((off.offeredCtc || 600000) / 100000).toFixed(2)} LPA`,
        entityType: 'candidate',
        department: off.department || 'Corporate',
        assignee: off.approvedBy || 'HR Director',
        stage: 'Offer Approval',
        status: off.status || 'Pending Approval',
        priority: 'High',
        value: off.offeredCtc || 600000,
        formattedValue: `₹ ${((off.offeredCtc || 600000) / 100000).toFixed(2)} LPA`,
        startDate: off.offerDate || '2026-09-14',
        targetDate: off.joiningDate || '2026-10-01',
        aging,
        raw: off,
        systemId: 'hr',
        stagePath: '/hr/offer-approval'
      });
    });

    // Map Joinings
    hrJoinings.forEach((j) => {
      const aging = calculateAging(j.joiningDate, j.status === 'Joined');
      cards.push({
        id: j.id,
        code: j.joiningId || `JOIN-${j.id?.slice(0, 4)}`,
        title: `Induction: ${j.candidateName || 'New Joiner'}`,
        vendorOrCustomer: `Department: ${j.department || 'Operations'}`,
        entityType: 'candidate',
        department: j.department || 'Operations',
        assignee: 'Induction Incharge',
        stage: 'Joining Pending',
        status: j.status || 'Joining Pending',
        priority: 'Normal',
        value: 0,
        formattedValue: 'Induction Ready',
        startDate: j.createdAt?.split('T')[0] || '2026-09-16',
        targetDate: j.joiningDate || '2026-09-28',
        aging,
        raw: j,
        systemId: 'hr',
        stagePath: '/hr/joining-induction'
      });
    });

    // Map Clearances & FNF
    hrClearances.forEach((c) => {
      const aging = calculateAging(c.lastWorkingDay, c.status === 'Clearance Completed');
      cards.push({
        id: c.id,
        code: c.clearanceId || `CLR-${c.id?.slice(0, 4)}`,
        title: `Exit Clearance: ${c.employeeName || 'Staff'}`,
        vendorOrCustomer: `Dept: ${c.department || 'Operations'}`,
        entityType: 'candidate',
        department: c.department || 'Admin',
        assignee: 'HR Operations',
        stage: 'Exit & F&F',
        status: c.status || 'Pending Clearance',
        priority: 'High',
        value: 0,
        formattedValue: 'Exit Formalities',
        startDate: c.resignationDate || '2026-09-01',
        targetDate: c.lastWorkingDay || '2026-09-25',
        aging,
        raw: c,
        systemId: 'hr',
        stagePath: '/hr/clearance-status'
      });
    });

    return cards;
  }, [hrIndents, hrInterviews, hrOffers, hrJoinings, hrClearances]);

  // 5. CHECKLIST & TASKS STAGES & MAPPING
  const taskStages = useMemo(() => [
    { id: 'Pending', label: '1. Pending / Todo', path: '/my-tasks', color: 'indigo' },
    { id: 'In Progress', label: '2. In Progress', path: '/my-tasks', color: 'blue' },
    { id: 'Overdue', label: '3. Overdue Attention', path: '/my-tasks', color: 'rose' },
    { id: 'Completed', label: '4. Completed Tasks', path: '/my-tasks', color: 'emerald' }
  ], []);

  const taskCards = useMemo(() => {
    return tasks.map((t) => {
      const aging = calculateAging(t.due_date, t.status === 'Completed');
      const assigned = t.assigned_to || t.user_name || 'Staff User';

      return {
        id: t.id,
        code: t.task_code || `TSK-${t.id?.slice(0, 4)}`,
        title: t.title || 'Operational Checklist Item',
        vendorOrCustomer: `Assignee: ${assigned}`,
        entityType: 'department',
        department: t.department || 'Operations',
        assignee: assigned,
        stage: t.status === 'Completed' ? 'Completed' : t.status === 'In Progress' ? 'In Progress' : aging.isOverdue ? 'Overdue' : 'Pending',
        status: t.status || 'Pending',
        priority: t.priority || 'Normal',
        value: 0,
        formattedValue: t.frequency || 'Daily Task',
        startDate: t.created_at?.split('T')[0] || '2026-09-18',
        targetDate: t.due_date?.split('T')[0] || '2026-09-24',
        aging,
        raw: t,
        systemId: 'checklist',
        stagePath: '/my-tasks'
      };
    });
  }, [tasks]);

  // Active module data selector
  const activeModuleData = useMemo(() => {
    switch (activeModule) {
      case 'purchase':
        return {
          title: 'Purchase & Procurement System',
          description: '9-Stage Vendor Procurement Flow: Requisition to Payment',
          stages: purchaseStages,
          cards: purchaseCards,
          systemId: 'purchase',
          entityLabel: 'Vendor',
          themeColor: 'amber'
        };
      case 'otd':
        return {
          title: 'Order To Delivery (OTD) Management',
          description: '12-Stage Customer Sales & Fulfillment Flow',
          stages: otdStages,
          cards: otdCards,
          systemId: 'sales',
          entityLabel: 'Customer',
          themeColor: 'emerald'
        };
      case 'leads':
        return {
          title: 'Lead To Orders (Sales Funnel)',
          description: '7-Stage Client Lead Conversion & Quotation Pipeline',
          stages: leadStages,
          cards: leadCards,
          systemId: 'lead-to-orders',
          entityLabel: 'Client',
          themeColor: 'violet'
        };
      case 'hr':
        return {
          title: 'HR Flow Management System (HR FMS)',
          description: '8-Stage Employee LifeCycle: Requisition to Exit Clearance',
          stages: hrStages,
          cards: hrCards,
          systemId: 'hr',
          entityLabel: 'Candidate / Dept',
          themeColor: 'cyan'
        };
      case 'checklist':
      default:
        return {
          title: 'Checklist & Task Delegation',
          description: 'Daily Recurring Operations & Task Execution Board',
          stages: taskStages,
          cards: taskCards,
          systemId: 'checklist',
          entityLabel: 'Assignee',
          themeColor: 'indigo'
        };
    }
  }, [activeModule, purchaseStages, purchaseCards, otdStages, otdCards, leadStages, leadCards, hrStages, hrCards, taskStages, taskCards]);

  // Filter cards by search and status
  const filteredCards = useMemo(() => {
    let result = activeModuleData.cards;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.vendorOrCustomer.toLowerCase().includes(q) ||
          c.assignee.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'pending') {
      result = result.filter((c) => c.status !== 'Completed' && c.status !== 'Closed' && c.status !== 'Delivered' && c.stage !== 'Order Closed' && c.stage !== 'Completed');
    } else if (statusFilter === 'overdue') {
      result = result.filter((c) => c.aging.isOverdue || c.status === 'Overdue');
    }

    return result;
  }, [activeModuleData.cards, searchTerm, statusFilter]);

  // Aggregate metrics for active module
  const summaryMetrics = useMemo(() => {
    const total = activeModuleData.cards.length;
    const pending = activeModuleData.cards.filter((c) => c.status !== 'Completed' && c.status !== 'Closed' && c.status !== 'Delivered' && c.stage !== 'Order Closed' && c.stage !== 'Completed').length;
    const overdue = activeModuleData.cards.filter((c) => c.aging.isOverdue || c.status === 'Overdue').length;
    const totalValue = activeModuleData.cards.reduce((sum, c) => sum + (c.value || 0), 0);

    return { total, pending, overdue, totalValue };
  }, [activeModuleData.cards]);

  // Navigate to stage page
  const handleOpenStage = (systemId, path) => {
    switchSystem(systemId, false);
    navigate(path);
  };

  return (
    <div className="space-y-4">
      {/* 1. Module Selector Tabs & Summary Badge Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        {/* Module Selector Tabs (Purchase, OTD, Leads, HR, Checklist) */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
          {/* Tab 1: Purchase */}
          {(!hasModuleAccess || hasModuleAccess('purchase')) && (
            <button
              onClick={() => setActiveModule('purchase')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeModule === 'purchase'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Purchase System</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeModule === 'purchase' ? 'bg-black/20 text-white' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                {purchases.length}
              </span>
            </button>
          )}

          {/* Tab 2: OTD */}
          {(!hasModuleAccess || hasModuleAccess('sales')) && (
            <button
              onClick={() => setActiveModule('otd')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeModule === 'otd'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Order To Delivery (OTD)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeModule === 'otd' ? 'bg-black/20 text-white' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                {orders.length}
              </span>
            </button>
          )}

          {/* Tab 3: Lead To Orders */}
          {(!hasModuleAccess || hasModuleAccess('lead-to-orders')) && (
            <button
              onClick={() => setActiveModule('leads')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeModule === 'leads'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Lead To Orders</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeModule === 'leads' ? 'bg-black/20 text-white' : 'bg-violet-500/20 text-violet-600 dark:text-violet-400'
              }`}>
                {leads.length}
              </span>
            </button>
          )}

          {/* Tab 4: HR Flow */}
          {(!hasModuleAccess || hasModuleAccess('hr')) && (
            <button
              onClick={() => setActiveModule('hr')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeModule === 'hr'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/25 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>HR Flow (HR FMS)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeModule === 'hr' ? 'bg-black/20 text-white' : 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
              }`}>
                {hrCards.length}
              </span>
            </button>
          )}

          {/* Tab 5: Checklist */}
          {(!hasModuleAccess || hasModuleAccess('checklist')) && (
            <button
              onClick={() => setActiveModule('checklist')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeModule === 'checklist'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Checklist & Tasks</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeModule === 'checklist' ? 'bg-black/20 text-white' : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
              }`}>
                {tasks.length}
              </span>
            </button>
          )}
        </div>

        {/* Quick Metrics Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block font-bold uppercase">Total</span>
              <span className="font-extrabold text-slate-900 dark:text-white">{summaryMetrics.total}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-rose-500 text-[10px] block font-bold uppercase">Pending</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">{summaryMetrics.pending}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-amber-500 text-[10px] block font-bold uppercase">Overdue</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">{summaryMetrics.overdue}</span>
            </div>
            {summaryMetrics.totalValue > 0 && (
              <>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                <div>
                  <span className="text-emerald-500 text-[10px] block font-bold uppercase">Value</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(summaryMetrics.totalValue)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>


      {/* 3. Search & Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeModuleData.entityLabel} name, code, product or person...`}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter pills */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All ({activeModuleData.cards.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Pending ({summaryMetrics.pending})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'overdue'
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Overdue ({summaryMetrics.overdue})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Kanban Columns View"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN KANBAN BOARD (Columns matching reference screenshot) */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 min-w-max items-start">
            {activeModuleData.stages.map((stage, idx) => {
              // Get cards for this stage
              const stageCards = filteredCards.filter((c) => {
                const s1 = c.stage?.toLowerCase().trim();
                const s2 = stage.id.toLowerCase().trim();
                return s1 === s2 || s1.includes(s2) || s2.includes(s1);
              });

              // Stage financial sum
              const stageSum = stageCards.reduce((acc, c) => acc + (c.value || 0), 0);

              return (
                <div
                  key={stage.id}
                  className="w-72 sm:w-80 flex-shrink-0 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[750px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex-1 mr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate" title={stage.label}>
                          {stage.label}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        {stageCards.length} {stageCards.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {stageSum > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          {formatCurrency(stageSum)}
                        </span>
                      )}
                      <button
                        onClick={() => handleOpenStage(activeModuleData.systemId, stage.path)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Open this stage page"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Column Cards Stack */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[120px]">
                    {stageCards.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
                        <span className="text-[11px] text-slate-400 font-medium">No items pending in this stage</span>
                      </div>
                    ) : (
                      stageCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => setSelectedCard(card)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top: Code & Priority */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-mono text-[11px] font-extrabold text-slate-700 dark:text-slate-200 truncate">
                                {card.code}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  card.priority === 'Urgent'
                                    ? 'bg-rose-500 text-white'
                                    : card.priority === 'High'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {card.priority}
                              </span>
                            </div>

                            {/* Card Main Title / Product / Requirement */}
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed mb-2.5">
                              {card.title}
                            </h4>

                            {/* CRITICAL USER REQUIREMENT: Highlighted Vendor / Customer Name */}
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 mb-3">
                              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                {card.entityType === 'vendor' ? (
                                  <>
                                    <Building2 className="w-3 h-3 text-amber-500" />
                                    <span>Vendor</span>
                                  </>
                                ) : card.entityType === 'customer' ? (
                                  <>
                                    <User className="w-3 h-3 text-emerald-500" />
                                    <span>Customer</span>
                                  </>
                                ) : (
                                  <>
                                    <Users className="w-3 h-3 text-cyan-500" />
                                    <span>{activeModuleData.entityLabel}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                                {card.vendorOrCustomer}
                              </p>
                            </div>
                          </div>

                          {/* Card Bottom: Timeline Flags & Red Aging Badge (Matching Screenshot) */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                            {/* Target Date with Flag */}
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px]">
                              <Flag className="w-3 h-3 text-slate-400" />
                              <span>{card.targetDate}</span>
                            </div>

                            {/* Overdue Badge (Red Pill matching screenshot: [1 DAY], [19 DAYS]) */}
                            <div className="flex items-center gap-2">
                              {card.aging.isOverdue ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] tracking-wide animate-pulse">
                                  {card.aging.text}
                                </span>
                              ) : card.aging.isDueSoon ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                  {card.aging.text}
                                </span>
                              ) : null}

                              {card.value > 0 && (
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                  {card.formattedValue}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 5. TABLE / LIST VIEW */
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-bold">Code</th>
                <th className="py-3 px-4 font-bold">{activeModuleData.entityLabel} Name</th>
                <th className="py-3 px-4 font-bold">Item / Description</th>
                <th className="py-3 px-4 font-bold">Current Stage</th>
                <th className="py-3 px-4 font-bold">Value</th>
                <th className="py-3 px-4 font-bold">Target Due</th>
                <th className="py-3 px-4 font-bold">Aging Status</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching records found
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {card.code}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      {card.vendorOrCustomer}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {card.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                        {card.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      {card.formattedValue}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {card.targetDate}
                    </td>
                    <td className="py-3 px-4">
                      {card.aging.isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px]">
                          {card.aging.text}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-semibold text-[10px]">
                          {card.aging.text}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCard(card)}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer mr-1"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. INTERACTIVE CARD DETAIL MODAL */}
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

            {/* Entity Details Box (Vendor / Customer) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {selectedCard.entityType === 'vendor' ? 'Associated Vendor Details' : 'Customer & Delivery Information'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Name</span>
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
                    {selectedCard.targetDate} ({selectedCard.aging.text})
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

              <button
                onClick={() => {
                  const path = selectedCard.stagePath;
                  setSelectedCard(null);
                  handleOpenStage(selectedCard.systemId, path);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <span>Jump to Stage Workflow</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
