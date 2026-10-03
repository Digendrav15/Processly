import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import { getData as getOTDData, STORAGE_KEYS as OTD_KEYS, initOTDData } from '../../services/otdStorageService';
import { getPurchaseData, PURCHASE_STORAGE_KEYS, initPurchaseData } from '../../services/purchaseStorageService';
import { getData as getLTOData, LTO_KEYS, initLTOData } from '../../services/leadToOrderStorageService';
import { getHRData, HR_KEYS, initHRData } from '../../services/hrStorageService';
import { getPettyData, PETTY_KEYS, getPettySummary, initPettyData } from '../../services/pettyStorageService';
import { getDocSubData, DOC_SUB_KEYS, getDocSubSummary, initDocSubData } from '../../services/docSubStorageService';
import { getWhatsAppSummary, initWhatsAppSeedData } from '../../services/whatsappStorageService';
import { StageKanbanReports } from '../../components/dashboard/StageKanbanReports';

export function MainAdminDashboard() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);

  // System Data States
  const [tasks, setTasks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [leads, setLeads] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [hrIndents, setHrIndents] = useState([]);
  const [hrEnquiries, setHrEnquiries] = useState([]);
  const [hrInterviews, setHrInterviews] = useState([]);
  const [hrOffers, setHrOffers] = useState([]);
  const [hrJoinings, setHrJoinings] = useState([]);
  const [hrClearances, setHrClearances] = useState([]);
  const [hrFnf, setHrFnf] = useState([]);
  const [petty, setPetty] = useState(null);
  const [pettyTxns, setPettyTxns] = useState([]);
  const [pettyCheques, setPettyCheques] = useState([]);
  const [docSub, setDocSub] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [whatsApp, setWhatsApp] = useState(null);

  // Load all system data across modules
  const loadAllSystemData = async () => {
    setLoading(true);
    try {
      initHRData();
      initPurchaseData();
      initOTDData();
      initLTOData();
      initPettyData();
      initDocSubData();
      initWhatsAppSeedData();

      // 1. Checklist & Tasks
      const tasksData = await taskService.getTasks();
      setTasks(tasksData || []);

      // 2. Order To Delivery
      const ordersData = getOTDData(OTD_KEYS.ORDERS, []);
      setOrders(ordersData || []);

      // 3. Purchase System
      const purchaseData = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
      setPurchases(purchaseData || []);

      // 4. Lead To Orders
      const leadsData = getLTOData(LTO_KEYS.LEADS, []);
      setLeads(leadsData || []);
      const quotesData = getLTOData(LTO_KEYS.QUOTATIONS, []);
      setQuotations(quotesData || []);

      // 5. HR System
      setHrIndents(getHRData(HR_KEYS.INDENTS, []));
      setHrEnquiries(getHRData(HR_KEYS.JOB_ENQUIRIES, []));
      setHrInterviews(getHRData(HR_KEYS.INTERVIEWS, []));
      setHrOffers(getHRData(HR_KEYS.OFFERS, []));
      setHrJoinings(getHRData(HR_KEYS.JOININGS, []));
      setHrClearances(getHRData(HR_KEYS.CLEARANCE, []));
      setHrFnf(getHRData(HR_KEYS.FNF, []));

      // 6. Petty Expenses & Cheques
      setPetty(getPettySummary());
      setPettyTxns(getPettyData(PETTY_KEYS.TRANSACTIONS, []));
      setPettyCheques(getPettyData(PETTY_KEYS.CHEQUES, []));

      // 7. Document & Subscription
      setDocSub(getDocSubSummary());
      setDocuments(getDocSubData(DOC_SUB_KEYS.DOCUMENTS, []));
      setSubscriptions(getDocSubData(DOC_SUB_KEYS.SUBSCRIPTIONS, []));

      // 8. WhatsApp Inbox & Live Chats
      setWhatsApp(getWhatsAppSummary());
    } catch (err) {
      console.error('Failed to load multi-system dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSystemData();

    // Listen to real-time events across systems
    const handleUpdate = () => loadAllSystemData();
    window.addEventListener('task_update', handleUpdate);
    window.addEventListener('otd_storage_update', handleUpdate);
    window.addEventListener('purchase_storage_update', handleUpdate);
    window.addEventListener('lead_storage_update', handleUpdate);
    window.addEventListener('hr_storage_update', handleUpdate);
    window.addEventListener('petty_storage_update', handleUpdate);
    window.addEventListener('docsub_storage_update', handleUpdate);
    window.addEventListener('whatsapp_storage_update', handleUpdate);

    return () => {
      window.removeEventListener('task_update', handleUpdate);
      window.removeEventListener('otd_storage_update', handleUpdate);
      window.removeEventListener('purchase_storage_update', handleUpdate);
      window.removeEventListener('lead_storage_update', handleUpdate);
      window.removeEventListener('hr_storage_update', handleUpdate);
      window.removeEventListener('petty_storage_update', handleUpdate);
      window.removeEventListener('docsub_storage_update', handleUpdate);
      window.removeEventListener('whatsapp_storage_update', handleUpdate);
    };
  }, []);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="pb-12">
      {/* Central Multi-System Stage-Wise Kanban Pipeline Reports */}
      <StageKanbanReports
        tasks={tasks}
        orders={orders}
        purchases={purchases}
        leads={leads}
        hrIndents={hrIndents}
        hrInterviews={hrInterviews}
        hrOffers={hrOffers}
        hrJoinings={hrJoinings}
        hrClearances={hrClearances}
        hrFnf={hrFnf}
        pettyTxns={pettyTxns}
        pettyCheques={pettyCheques}
        documents={documents}
        subscriptions={subscriptions}
        onRefresh={loadAllSystemData}
      />
    </div>
  );
}

