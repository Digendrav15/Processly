/**
 * Data Cleanup & Migration Service
 * Ensures desktop local storage is completely purged of legacy dummy / seed data
 * across all modules (HR, LTO, Purchase, OTD/Sales, Petty, DocSub, WhatsApp, Tasks).
 * Makes it 100% clean and ready for direct Supabase connectivity.
 */

import { HR_KEYS, notifyHRUpdate } from './hrStorageService';
import { LTO_KEYS, notifyLTOUpdate } from './leadToOrderStorageService';
import { PURCHASE_STORAGE_KEYS, notifyPurchaseUpdate } from './purchaseStorageService';
import { STORAGE_KEYS as OTD_KEYS } from './otdStorageService';
import { PETTY_KEYS, notifyPettyUpdate } from './pettyStorageService';
import { DOC_SUB_KEYS, notifyDocSubUpdate } from './docSubStorageService';
import { WHATSAPP_KEYS, notifyWhatsAppUpdate } from './whatsappStorageService';

export const CLEAN_DATA_FLAG = 'system_cleaned_dummy_v2';

/**
 * Purge all mock/dummy data across all ERP modules in LocalStorage
 * Preserves user authentication session and core system configurations.
 */
export function cleanAllModulesDummyData() {
  try {
    // 1. HR Flow Management Module
    const hrDataKeys = [
      HR_KEYS.INDENTS,
      HR_KEYS.INDENT_APPROVALS,
      HR_KEYS.JOB_ENQUIRIES,
      HR_KEYS.CANDIDATES,
      HR_KEYS.INTERVIEWS,
      HR_KEYS.OFFERS,
      HR_KEYS.JOININGS,
      HR_KEYS.EMPLOYEES,
      HR_KEYS.ATTENDANCE,
      HR_KEYS.LEAVES,
      HR_KEYS.PAYROLL,
      HR_KEYS.RESIGNATIONS,
      HR_KEYS.CLEARANCE,
      HR_KEYS.FNF,
      HR_KEYS.INACTIVE_EMPLOYEES,
      HR_KEYS.DOCUMENTS,
      HR_KEYS.LETTERS,
      HR_KEYS.ACTIVITY_LOGS
    ];
    hrDataKeys.forEach((k) => localStorage.setItem(k, JSON.stringify([])));
    localStorage.setItem(HR_KEYS.INDENT_COUNTER, '100');
    localStorage.setItem(HR_KEYS.ENQUIRY_COUNTER, '200');
    localStorage.setItem(HR_KEYS.CANDIDATE_COUNTER, '300');
    localStorage.setItem(HR_KEYS.INTERVIEW_COUNTER, '400');
    localStorage.setItem(HR_KEYS.OFFER_COUNTER, '500');
    localStorage.setItem(HR_KEYS.EMPLOYEE_COUNTER, '600');
    localStorage.setItem(HR_KEYS.SEEDED, 'true');

    // 2. Lead To Orders Module
    const ltoDataKeys = [
      LTO_KEYS.LEADS,
      LTO_KEYS.FOLLOW_UPS,
      LTO_KEYS.QUOTATIONS,
      LTO_KEYS.NEGOTIATIONS,
      LTO_KEYS.APPROVALS
    ];
    ltoDataKeys.forEach((k) => localStorage.setItem(k, JSON.stringify([])));
    localStorage.setItem(LTO_KEYS.LEAD_COUNTER, '100');
    localStorage.setItem(LTO_KEYS.QUOTATION_COUNTER, '100');
    localStorage.setItem(LTO_KEYS.APPROVAL_COUNTER, '100');
    localStorage.setItem(LTO_KEYS.FOLLOW_UP_COUNTER, '100');
    localStorage.setItem(LTO_KEYS.SEEDED, 'true');

    // 3. Purchase Module
    localStorage.setItem(PURCHASE_STORAGE_KEYS.INDENTS, JSON.stringify([]));

    // 4. Order To Delivery (Sales / OTD) Module
    localStorage.setItem(OTD_KEYS.ORDERS, JSON.stringify([]));
    localStorage.setItem(OTD_KEYS.STAGE_HISTORY, JSON.stringify([]));
    localStorage.setItem(OTD_KEYS.ORDER_COUNTER, '1000');

    // 5. Petty Cash & Banking Module
    localStorage.setItem(PETTY_KEYS.CHEQUES, JSON.stringify([]));
    localStorage.setItem(PETTY_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(PETTY_KEYS.TRANSFERS, JSON.stringify([]));
    localStorage.setItem(PETTY_KEYS.APPROVALS, JSON.stringify([]));
    localStorage.setItem(PETTY_KEYS.TXN_COUNTER, '100');
    localStorage.setItem(PETTY_KEYS.CHQ_COUNTER, '200');
    localStorage.setItem(PETTY_KEYS.SEEDED, 'true');

    // 6. Documents & Subscriptions Module
    localStorage.setItem(DOC_SUB_KEYS.DOCUMENTS, JSON.stringify([]));
    localStorage.setItem(DOC_SUB_KEYS.SUBSCRIPTIONS, JSON.stringify([]));
    localStorage.setItem(DOC_SUB_KEYS.PAYMENTS, JSON.stringify([]));
    localStorage.setItem(DOC_SUB_KEYS.AUDIT_LOGS, JSON.stringify([]));
    localStorage.setItem(DOC_SUB_KEYS.APPROVALS, JSON.stringify([]));
    localStorage.setItem(DOC_SUB_KEYS.DOC_COUNTER, '100');
    localStorage.setItem(DOC_SUB_KEYS.SUB_COUNTER, '200');
    localStorage.setItem(DOC_SUB_KEYS.PAY_COUNTER, '500');
    localStorage.setItem(DOC_SUB_KEYS.SEEDED, 'true');

    // 7. WhatsApp Module
    localStorage.setItem(WHATSAPP_KEYS.CHATS, JSON.stringify([]));
    localStorage.setItem(WHATSAPP_KEYS.BROADCASTS, JSON.stringify([]));
    localStorage.setItem(WHATSAPP_KEYS.AUTOMATIONS, JSON.stringify([]));
    localStorage.setItem(WHATSAPP_KEYS.SEEDED, 'true');

    // 8. Core Task & Checklist System
    localStorage.setItem('corporate_system_tasks', JSON.stringify([]));
    localStorage.setItem('corporate_system_checklists', JSON.stringify([]));
    localStorage.setItem('corporate_system_history', JSON.stringify([]));
    localStorage.setItem('corporate_system_leave_requests', JSON.stringify([]));
    localStorage.setItem('corporate_system_notifications', JSON.stringify([]));

    // Mark as clean
    localStorage.setItem(CLEAN_DATA_FLAG, 'true');

    // Dispatch reactive events across modules
    notifyHRUpdate();
    notifyLTOUpdate();
    notifyPurchaseUpdate();
    notifyPettyUpdate();
    notifyDocSubUpdate();
    notifyWhatsAppUpdate();
    window.dispatchEvent(new CustomEvent('otd_storage_update', { detail: { key: 'ALL' } }));
    window.dispatchEvent(new CustomEvent('storage'));

    console.log('[DataCleanupService] Successfully cleaned all modules dummy data. Desktop local storage is clean.');
    return { success: true, message: 'All module dummy data cleaned successfully! Desktop local storage is now ready for Supabase.' };
  } catch (err) {
    console.error('[DataCleanupService] Error cleaning module dummy data:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Runs automatically on startup if the clean flag is missing.
 */
export function checkAndRunAutoCleanup() {
  if (typeof window === 'undefined') return;
  const isCleaned = localStorage.getItem(CLEAN_DATA_FLAG);
  if (!isCleaned) {
    console.log('[DataCleanupService] First time clean detection: purging legacy seed data...');
    cleanAllModulesDummyData();
  }
}
