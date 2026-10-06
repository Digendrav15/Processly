import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ProfilePage } from './pages/auth/ProfilePage';
import { DashboardRouter } from './pages/dashboards/DashboardRouter';
import { MainAdminDashboard } from './pages/dashboards/MainAdminDashboard';
import { UnifiedDashboard } from './pages/dashboards/UnifiedDashboard';
import { ChecklistListPage } from './pages/checklist/ChecklistListPage';
import { CreateChecklistPage } from './pages/checklist/CreateChecklistPage';
import { DelegationListPage } from './pages/delegation/DelegationListPage';
import { CreateDelegationPage } from './pages/delegation/CreateDelegationPage';
import { MyTasksPage } from './pages/tasks/MyTasksPage';
import { TaskAssignmentPage } from './pages/tasks/TaskAssignmentPage';
import { UniqueTasksPage } from './pages/tasks/UniqueTasksPage';
import { ChecklistTasksPage } from './pages/tasks/ChecklistTasksPage';
import { DelegationTasksPage } from './pages/tasks/DelegationTasksPage';
import { LeaveRequestsPage } from './pages/leave/LeaveRequestsPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { HolidaysPage } from './pages/holidays/HolidaysPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { MastersPage } from './pages/masters/MastersPage';
import { WorkingDateMissingModal } from './components/common/WorkingDateMissingModal';

import { SalesDashboardPage } from './pages/sales/SalesDashboardPage';
import { OTDTasksPage } from './pages/sales/OTDTasksPage';
import { SalesOrdersPage } from './pages/sales/SalesOrdersPage';
import { OrderTrackingPage } from './pages/sales/OrderTrackingPage';
import { CustomersPage } from './pages/sales/CustomersPage';
import { ProductsPage } from './pages/sales/ProductsPage';
import { EmployeesPage } from './pages/sales/EmployeesPage';
import { OTDMastersPage } from './pages/sales/OTDMastersPage';
import { OTDTatPage } from './pages/sales/OTDTatPage';
import { OTDReportsPage } from './pages/sales/OTDReportsPage';
import { OTDAuditLogPage } from './pages/sales/OTDAuditLogPage';
import { OTDDataManagementPage } from './pages/sales/OTDDataManagementPage';

// 12 Workflow Stage Pages for Order To Delivery
import { NewOrderPage } from './pages/sales/NewOrderPage';
import { OrderVerificationPage } from './pages/sales/OrderVerificationPage';
import { OrderApprovalPage } from './pages/sales/OrderApprovalPage';
import { AdvancePaymentPage } from './pages/sales/AdvancePaymentPage';
import { StockCheckPage } from './pages/sales/StockCheckPage';
import { OrderProcessingPage } from './pages/sales/OrderProcessingPage';
import { QualityCheckPage } from './pages/sales/QualityCheckPage';
import { ReadyForDispatchPage } from './pages/sales/ReadyForDispatchPage';
import { DispatchPage } from './pages/sales/DispatchPage';
import { DeliveredPage } from './pages/sales/DeliveredPage';
import { PaymentCollectionPage } from './pages/sales/PaymentCollectionPage';
import { OrderClosedPage } from './pages/sales/OrderClosedPage';

// Master System Module Pages
import { MasterOverviewPage } from './pages/masterSystem/MasterOverviewPage';
import { MasterCompanyDetailsPage } from './pages/masterSystem/MasterCompanyDetailsPage';
import { MasterVendorsPage } from './pages/masterSystem/MasterVendorsPage';
import { MasterDepartmentsPage } from './pages/masterSystem/MasterDepartmentsPage';
import { MasterHolidaysPage } from './pages/masterSystem/MasterHolidaysPage';
import { MasterWorkingCalendarPage } from './pages/masterSystem/MasterWorkingCalendarPage';

// 9 Workflow Stage Pages for Purchase System
import { PurchaseIndentPage } from './pages/purchase/PurchaseIndentPage';
import { IndentApprovalPage } from './pages/purchase/IndentApprovalPage';
import { PurchaseOrderPage } from './pages/purchase/PurchaseOrderPage';
import { MaterialLiftingPage } from './pages/purchase/MaterialLiftingPage';
import { MaterialDeliveryPage } from './pages/purchase/MaterialDeliveryPage';
import { MaterialReceivingPage } from './pages/purchase/MaterialReceivingPage';
import { PurchaseQCPage } from './pages/purchase/PurchaseQCPage';
import { GRNPage } from './pages/purchase/GRNPage';
import { PurchasePaymentPage } from './pages/purchase/PurchasePaymentPage';

// Lead To Orders System Pages
import { LeadDashboardPage } from './pages/leadToOrders/LeadDashboardPage';
import { LeadsManagementPage } from './pages/leadToOrders/LeadsManagementPage';
import { FollowUpPage } from './pages/leadToOrders/FollowUpPage';
import { QuotationPage } from './pages/leadToOrders/QuotationPage';
import { NegotiationPage } from './pages/leadToOrders/NegotiationPage';
import { ApprovalPage } from './pages/leadToOrders/ApprovalPage';
import { LeadReportsPage } from './pages/leadToOrders/LeadReportsPage';

// HR Flow Management System (HR FMS) Pages
import { HRDashboardPage } from './pages/hr/HRDashboardPage';
import { HRIndentPage } from './pages/hr/HRIndentPage';
import { HRIndentApprovalPage } from './pages/hr/HRIndentApprovalPage';
import { HRJobEnquiryPage } from './pages/hr/HRJobEnquiryPage';
import { HRCandidateScreeningPage } from './pages/hr/HRCandidateScreeningPage';
import { HRInterviewPage } from './pages/hr/HRInterviewPage';
import { HROfferApprovalPage } from './pages/hr/HROfferApprovalPage';
import { HRJoiningPage } from './pages/hr/HRJoiningPage';
import { HRActiveEmployeesPage } from './pages/hr/HRActiveEmployeesPage';
import { HRInactiveEmployeesPage } from './pages/hr/HRInactiveEmployeesPage';
import { HRAttendancePage } from './pages/hr/HRAttendancePage';
import { HRLeavePage } from './pages/hr/HRLeavePage';
import { HRPayrollPage } from './pages/hr/HRPayrollPage';
import { HRPayslipsPage } from './pages/hr/HRPayslipsPage';
import { HRExitManagementPage } from './pages/hr/HRExitManagementPage';
import { HRDocumentsLettersPage } from './pages/hr/HRDocumentsLettersPage';
import { HRReportsPage } from './pages/hr/HRReportsPage';

// Petty Expenses Module Pages
import { PettyDashboardPage } from './pages/petty/PettyDashboardPage';
import { PettyReceivedPage } from './pages/petty/PettyReceivedPage';
import { PettyOutgoingsPage } from './pages/petty/PettyOutgoingsPage';
import { ChequeTrackerPage } from './pages/petty/ChequeTrackerPage';
import { PettyReportsPage } from './pages/petty/PettyReportsPage';

// Document & Subscription System Pages
import DocSubDashboardPage from './pages/docSub/DocSubDashboardPage';
import DocumentsManagementPage from './pages/docSub/DocumentsManagementPage';
import SubscriptionsManagementPage from './pages/docSub/SubscriptionsManagementPage';
import RenewalExpiryPage from './pages/docSub/RenewalExpiryPage';
import PaymentTrackingPage from './pages/docSub/PaymentTrackingPage';
import DocSubHistoryPage from './pages/docSub/DocSubHistoryPage';

// WhatsApp Inbox Module Pages
import WhatsAppInboxPage from './pages/whatsapp/WhatsAppInboxPage';
import WhatsAppTemplatesPage from './pages/whatsapp/WhatsAppTemplatesPage';
import WhatsAppSettingsPage from './pages/whatsapp/WhatsAppSettingsPage';
import { MISSummaryPage } from './pages/misSummary/MISSummaryPage';

// Inventory Management System Pages - 3 Core Pages
import { InventoryDashboardPage } from './pages/inventory/InventoryDashboardPage';
import { InventoryInOutPage } from './pages/inventory/InventoryInOutPage';
import { InventoryIndentPage } from './pages/inventory/InventoryIndentPage';

import { useSystem } from './context/SystemContext';
import { Outlet } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnlyRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function TaskAssignmentRoute({ children }) {
  const { user, isAdmin, isManager } = useAuth();
  if (isAdmin || isManager) return children;
  if (user?.self_assign_enabled !== false) return children;
  return <Navigate to="/my-tasks" replace />;
}

function ModuleRoute({ systemId, children }) {
  const { hasModuleAccess, systemsList } = useSystem();
  if (!hasModuleAccess(systemId)) {
    const fallbackPath = systemsList[0]?.defaultPath || '/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }
  return children || <Outlet />;
}

export default function App() {
  return (
    <>
      <WorkingDateMissingModal />
      <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Checklist & Delegation System Routes */}
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route
          path="admin/dashboard"
          element={
            <AdminOnlyRoute>
              <MainAdminDashboard />
            </AdminOnlyRoute>
          }
        />
        {/* Dedicated Checklist & Delegation Dashboard */}
        <Route path="checklist/dashboard" element={<UnifiedDashboard />} />
        <Route path="checklist" element={<Navigate to="/checklist/dashboard" replace />} />
        <Route path="checklist/list" element={<ChecklistListPage />} />
        <Route path="checklist/create" element={<CreateChecklistPage />} />
        <Route path="delegation" element={<DelegationListPage />} />
        <Route path="delegation/list" element={<DelegationListPage />} />
        <Route path="delegation/create" element={<CreateDelegationPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route
          path="task-assignment"
          element={
            <TaskAssignmentRoute>
              <TaskAssignmentPage />
            </TaskAssignmentRoute>
          }
        />
        <Route path="my-tasks" element={<MyTasksPage />} />
        <Route path="tasks/unique" element={<UniqueTasksPage />} />
        <Route path="tasks/checklist" element={<ChecklistTasksPage />} />
        <Route path="tasks/delegation" element={<DelegationTasksPage />} />
        <Route path="checklist/tasks" element={<Navigate to="/tasks/checklist" replace />} />
        <Route path="delegation/tasks" element={<Navigate to="/tasks/delegation" replace />} />
        <Route path="leave-requests" element={<LeaveRequestsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="holidays" element={<Navigate to="/master-system/holidays" replace />} />
        <Route
          path="masters"
          element={
            <AdminOnlyRoute>
              <MastersPage />
            </AdminOnlyRoute>
          }
        />
        <Route path="profile" element={<ProfilePage />} />

        {/* Order To Delivery System Routes */}
        <Route path="sales" element={<ModuleRoute systemId="sales" />}>
          <Route path="new-order" element={<NewOrderPage />} />
          <Route path="verification" element={<OrderVerificationPage />} />
          <Route path="approval" element={<OrderApprovalPage />} />
          <Route path="advance-payment" element={<AdvancePaymentPage />} />
          <Route path="stock-check" element={<StockCheckPage />} />
          <Route path="processing" element={<OrderProcessingPage />} />
          <Route path="qc" element={<QualityCheckPage />} />
          <Route path="ready-dispatch" element={<ReadyForDispatchPage />} />
          <Route path="dispatch" element={<DispatchPage />} />
          <Route path="delivered" element={<DeliveredPage />} />
          <Route path="payment-collection" element={<PaymentCollectionPage />} />
          <Route path="closed" element={<OrderClosedPage />} />

          <Route path="dashboard" element={<SalesDashboardPage />} />
          <Route path="tasks" element={<OTDTasksPage />} />
          <Route path="orders" element={<SalesOrdersPage />} />
          <Route path="tracking" element={<OrderTrackingPage />} />
          <Route path="reports" element={<OTDReportsPage />} />
          <Route path="audit-log" element={<OTDAuditLogPage />} />
          <Route path="data-management" element={<OTDDataManagementPage />} />
        </Route>

        {/* Master System Module Routes */}
        <Route path="master-system" element={<ModuleRoute systemId="master-system" />}>
          <Route path="overview" element={<MasterOverviewPage />} />
          <Route path="company-details" element={<MasterCompanyDetailsPage />} />
          <Route path="vendors" element={<MasterVendorsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="departments" element={<MasterDepartmentsPage />} />
          <Route path="users" element={<EmployeesPage />} />
          <Route path="tat" element={<OTDTatPage />} />
          <Route path="working-calendar" element={<MasterWorkingCalendarPage />} />
          <Route path="holidays" element={<MasterHolidaysPage />} />
        </Route>

        {/* Purchase System Routes */}
        <Route path="purchase" element={<ModuleRoute systemId="purchase" />}>
          <Route path="indent" element={<PurchaseIndentPage />} />
          <Route path="indent-approval" element={<IndentApprovalPage />} />
          <Route path="po" element={<PurchaseOrderPage />} />
          <Route path="lifting-dispatch" element={<MaterialLiftingPage />} />
          <Route path="delivery" element={<MaterialDeliveryPage />} />
          <Route path="receiving" element={<MaterialReceivingPage />} />
          <Route path="qc" element={<PurchaseQCPage />} />
          <Route path="grn" element={<GRNPage />} />
          <Route path="payment" element={<PurchasePaymentPage />} />
        </Route>

        {/* Lead To Orders System Routes */}
        <Route path="lead-to-orders" element={<ModuleRoute systemId="lead-to-orders" />}>
          <Route path="dashboard" element={<LeadDashboardPage />} />
          <Route path="leads" element={<LeadsManagementPage />} />
          <Route path="follow-up" element={<FollowUpPage />} />
          <Route path="quotation" element={<QuotationPage />} />
          <Route path="negotiation" element={<NegotiationPage />} />
          <Route path="approval" element={<ApprovalPage />} />
          <Route path="reports" element={<LeadReportsPage />} />

          {/* Legacy route fallbacks */}
          <Route path="pipeline" element={<Navigate to="/lead-to-orders/dashboard" replace />} />
          <Route path="deals" element={<Navigate to="/lead-to-orders/negotiation" replace />} />
          <Route path="conversions" element={<Navigate to="/lead-to-orders/reports" replace />} />
        </Route>

        {/* HR Flow Management System (HR FMS) Routes */}
        <Route path="hr" element={<ModuleRoute systemId="hr" />}>
          <Route index element={<Navigate to="/hr/dashboard" replace />} />
          <Route path="dashboard" element={<HRDashboardPage />} />
          <Route path="indent" element={<HRIndentPage />} />
          <Route path="indent-approval" element={<HRIndentApprovalPage />} />
          <Route path="job-enquiry" element={<HRJobEnquiryPage />} />
          <Route path="candidate-screening" element={<HRCandidateScreeningPage />} />
          <Route path="interviews" element={<HRInterviewPage />} />
          <Route path="offer-approval" element={<HROfferApprovalPage />} />
          <Route path="joining" element={<HRJoiningPage />} />
          <Route path="active-employees" element={<HRActiveEmployeesPage />} />
          <Route path="employees" element={<Navigate to="/hr/active-employees" replace />} />
          <Route path="inactive-employees" element={<HRInactiveEmployeesPage />} />
          <Route path="attendance" element={<HRAttendancePage />} />
          <Route path="leave" element={<HRLeavePage />} />
          <Route path="payroll" element={<HRPayrollPage />} />
          <Route path="payslips" element={<HRPayslipsPage />} />
          <Route path="resignation" element={<HRExitManagementPage />} />
          <Route path="clearance" element={<HRExitManagementPage />} />
          <Route path="fnf" element={<HRExitManagementPage />} />
          <Route path="exit" element={<Navigate to="/hr/resignation" replace />} />
          <Route path="exit-management" element={<Navigate to="/hr/resignation" replace />} />
          <Route path="documents" element={<HRDocumentsLettersPage />} />
          <Route path="letters" element={<HRDocumentsLettersPage />} />
          <Route path="reports" element={<HRReportsPage />} />
        </Route>

        {/* Petty Expenses System Routes */}
        <Route path="petty-expenses" element={<ModuleRoute systemId="petty-expenses" />}>
          <Route index element={<Navigate to="/petty-expenses/dashboard" replace />} />
          <Route path="dashboard" element={<PettyDashboardPage />} />
          <Route path="received" element={<PettyReceivedPage />} />
          <Route path="outgoings" element={<PettyOutgoingsPage />} />
          <Route path="cheques" element={<ChequeTrackerPage />} />
          <Route path="reports" element={<PettyReportsPage />} />
        </Route>

        {/* Document & Subscription System Routes */}
        <Route path="doc-subscription" element={<ModuleRoute systemId="doc-subscription" />}>
          <Route index element={<Navigate to="/doc-subscription/dashboard" replace />} />
          <Route path="dashboard" element={<DocSubDashboardPage />} />
          <Route path="documents" element={<DocumentsManagementPage />} />
          <Route path="subscriptions" element={<SubscriptionsManagementPage />} />
          <Route path="renewals" element={<RenewalExpiryPage />} />
          <Route path="payments" element={<PaymentTrackingPage />} />
          <Route path="history" element={<DocSubHistoryPage />} />
        </Route>

        {/* WhatsApp Inbox System Routes */}
        <Route path="whatsapp" element={<ModuleRoute systemId="whatsapp" />}>
          <Route index element={<Navigate to="/whatsapp/inbox" replace />} />
          <Route path="inbox" element={<WhatsAppInboxPage />} />
          <Route path="templates" element={<WhatsAppTemplatesPage />} />
          <Route path="settings" element={<WhatsAppSettingsPage />} />
        </Route>

        {/* MIS Summary Module Routes */}
        <Route path="mis-summary" element={<ModuleRoute systemId="mis-summary" />}>
          <Route index element={<MISSummaryPage />} />
        </Route>

        {/* Inventory System Routes - Exactly 3 Pages */}
        <Route path="inventory" element={<ModuleRoute systemId="inventory" />}>
          <Route index element={<Navigate to="/inventory/dashboard" replace />} />
          <Route path="dashboard" element={<InventoryDashboardPage />} />
          <Route path="in-out" element={<InventoryInOutPage />} />
          <Route path="indent" element={<InventoryIndentPage />} />

          {/* Legacy fallback redirects */}
          <Route path="inward" element={<Navigate to="/inventory/in-out" replace />} />
          <Route path="outward" element={<Navigate to="/inventory/in-out" replace />} />
          <Route path="adjustments" element={<Navigate to="/inventory/in-out" replace />} />
          <Route path="alerts" element={<Navigate to="/inventory/indent" replace />} />
          <Route path="items" element={<Navigate to="/inventory/dashboard" replace />} />
          <Route path="reports" element={<Navigate to="/inventory/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  );
}
