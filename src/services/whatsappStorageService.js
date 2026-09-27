/**
 * WhatsApp Interface Storage & Lifecycle Service
 *
 * Architecture designed for future Meta WhatsApp Cloud API integration:
 * React UI -> Storage Layer -> Future Backend API / Webhook -> Meta Cloud API
 *
 * Current implementation manages state cleanly in LocalStorage without
 * requiring backend or external credentials.
 */

export const WHATSAPP_KEYS = {
  CHATS: 'wa_chats_v1',
  TEMPLATES: 'wa_templates_v1',
  SETTINGS: 'wa_settings_v1',
  SEEDED: 'wa_seeded_v1'
};

// Event Dispatcher for cross-component reactivity
export function notifyWhatsAppUpdate(key = 'ALL', detail = {}) {
  window.dispatchEvent(
    new CustomEvent('whatsapp_storage_update', {
      detail: { key, ...detail }
    })
  );
}

// LocalStorage Helpers
export function getWAData(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'null' || raw === 'undefined') return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from LocalStorage:`, err);
    return defaultValue;
  }
}

export function setWAData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyWhatsAppUpdate(key);
    return true;
  } catch (err) {
    console.error(`Error saving ${key} to LocalStorage:`, err);
    return false;
  }
}

// Available Agents in the ERP
export const ERP_AGENTS = [
  { id: 'usr-admin-1', name: 'Vikramaditya Sharma', role: 'System Admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { id: 'usr-manager-1', name: 'Ananya Roy', role: 'Operations Manager', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
  { id: 'usr-finance-1', name: 'Pooja Iyer', role: 'Finance Head', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 'usr-sales-1', name: 'Rahul Verma', role: 'Sales Executive', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
];

// Pre-configured WhatsApp Business Message Templates (Canned Responses)
export const DEFAULT_TEMPLATES = [
  {
    id: 'TPL-001',
    name: 'Order Dispatch & Tracking',
    category: 'Logistics',
    language: 'en_IN',
    text: 'Dear {{customer_name}}, your order {{order_id}} has been dispatched via {{courier}} (LR No: {{tracking_no}}). Expected delivery: {{delivery_date}}. Track here: {{tracking_link}}',
    preview: 'Dear Rajesh ji, your order ORD-9821 has been dispatched via V-Trans Logistics...'
  },
  {
    id: 'TPL-002',
    name: 'Payment Due Reminder',
    category: 'Billing',
    language: 'en_IN',
    text: 'Hello {{customer_name}}, this is a gentle reminder regarding pending balance ₹{{amount}} against invoice {{invoice_no}}. Please arrange settlement via NEFT/UPI to account {{account_no}}.',
    preview: 'Hello Amit ji, gentle reminder regarding pending balance ₹85,000...'
  },
  {
    id: 'TPL-003',
    name: 'Quotation Proposal Shared',
    category: 'Sales',
    language: 'en_IN',
    text: 'Namaste {{customer_name}}, we have prepared the official commercial quotation {{quote_no}} for your requirement. Total amount: ₹{{total_amount}}. Valid until {{validity_date}}.',
    preview: 'Namaste Pooja ma\'am, we have prepared commercial quotation QT-2026-112...'
  },
  {
    id: 'TPL-004',
    name: 'Welcome & Inquiry Acknowledged',
    category: 'Customer Support',
    language: 'en_IN',
    text: 'Thank you for contacting our Corporate Sales & Support desk! Our technical representative {{agent_name}} will review your inquiry and connect with you shortly.',
    preview: 'Thank you for contacting our Corporate Sales & Support desk...'
  },
  {
    id: 'TPL-005',
    name: 'Quality Check & Ready Notice',
    category: 'Production',
    language: 'en_IN',
    text: 'Good news! Your consignment for order {{order_id}} has successfully passed Quality Check (QC) inspection and is staged for transport pickup.',
    preview: 'Good news! Your consignment for order has passed QC...'
  }
];

// Seed realistic ERP chat conversations
export function initWhatsAppSeedData() {
  const seeded = localStorage.getItem(WHATSAPP_KEYS.SEEDED);
  if (seeded === 'true') return;

  const now = Date.now();
  const formatTime = (diffMs) => new Date(now - diffMs).toISOString();

  const initialChats = [
    {
      id: 'chat-001',
      name: 'Rajesh Khanna',
      phone: '+91 98201 55432',
      company: 'Khanna Industrial Supplies Ltd.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'open', // 'open' | 'closed'
      assignedTo: 'Ananya Roy',
      unreadCount: 1,
      tags: ['High Priority', 'Active Order', 'Customer'],
      lastMessage: 'Aur quotation QT-2026-88 ka revised GST invoice bhi bhej dijiye.',
      lastMessageTime: formatTime(10 * 60 * 1000), // 10 mins ago
      erpData: {
        customerId: 'CUST-2041',
        leadId: 'LEAD-1042',
        leadStage: 'Won / Customer',
        leadValue: 450000,
        orders: [
          { id: 'ORD-9821', title: 'Industrial Bearings & Gears Pack', amount: 320000, status: 'In QC', date: '25 Sep 2026' }
        ],
        quotations: [
          { id: 'QT-2026-88', total: 450000, status: 'Approved' }
        ],
        pendingPayment: 125000,
        billingAddress: 'Plot 44, MIDC Industrial Area, Pune 411026'
      },
      messages: [
        {
          id: 'msg-101',
          sender: 'customer',
          text: 'Namaste team, hamare order ORD-9821 ka current status kya hai? Site delivery kab tak expected hai?',
          timestamp: formatTime(120 * 60 * 1000),
          status: 'read'
        },
        {
          id: 'msg-102',
          sender: 'agent',
          text: 'Hello Rajesh ji! Good afternoon. Aapka order Quality Check (QC) stage me hai, aaj sham tak Ready for Dispatch ho jayega.',
          timestamp: formatTime(110 * 60 * 1000),
          status: 'read',
          senderName: 'Ananya Roy'
        },
        {
          id: 'msg-103',
          sender: 'customer',
          text: 'Bahut badhiya! Dispatch note aur driver contact number WhatsApp par share kar dena please.',
          timestamp: formatTime(85 * 60 * 1000),
          status: 'read'
        },
        {
          id: 'msg-104',
          sender: 'agent',
          text: 'Ji bilkul, jaise hi dispatch team consignment handover karegi, live tracking link aur LR copy yahan bhej denge.',
          timestamp: formatTime(60 * 60 * 1000),
          status: 'read',
          senderName: 'Ananya Roy',
          reactions: ['👍']
        },
        {
          id: 'msg-105',
          sender: 'customer',
          text: 'Aur quotation QT-2026-88 ka revised GST invoice bhi bhej dijiye.',
          timestamp: formatTime(10 * 60 * 1000),
          status: 'delivered'
        }
      ]
    },
    {
      id: 'chat-002',
      name: 'Pooja Hegde',
      phone: '+91 91672 88901',
      company: 'Sun Pharma & Life Sciences',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      status: 'open',
      assignedTo: 'Vikramaditya Sharma',
      unreadCount: 2,
      tags: ['Enterprise', 'Lead', 'Proposal Sent'],
      lastMessage: 'Can we close this by tomorrow? We need the purchase order approved before month-end.',
      lastMessageTime: formatTime(25 * 60 * 1000), // 25 mins ago
      erpData: {
        customerId: 'CUST-3099',
        leadId: 'LEAD-1077',
        leadStage: 'Commercial Negotiation',
        leadValue: 1280000,
        orders: [],
        quotations: [
          { id: 'QT-2026-112', total: 1280000, status: 'Negotiation' }
        ],
        pendingPayment: 0,
        billingAddress: 'Sun Pharma R&D Towers, Goregaon East, Mumbai 400063'
      },
      messages: [
        {
          id: 'msg-201',
          sender: 'customer',
          text: 'Hi Vikramaditya, we reviewed your commercial proposal for Cleanroom Lab Equipment.',
          timestamp: formatTime(180 * 60 * 1000),
          status: 'read'
        },
        {
          id: 'msg-202',
          sender: 'customer',
          mediaType: 'document',
          fileName: 'Cleanroom_Specifications_V2.pdf',
          fileSize: '3.4 MB',
          text: 'Here are the technical compliance requirements our QA head signed off on.',
          timestamp: formatTime(170 * 60 * 1000),
          status: 'read'
        },
        {
          id: 'msg-203',
          sender: 'agent',
          text: 'Thank you Pooja ma\'am! We can accommodate the HEPA filter upgrades within the quoted budget of ₹12.8 Lakhs.',
          timestamp: formatTime(90 * 60 * 1000),
          status: 'read',
          senderName: 'Vikramaditya Sharma'
        },
        {
          id: 'msg-204',
          sender: 'customer',
          text: 'Can we close this by tomorrow? We need the purchase order approved before month-end.',
          timestamp: formatTime(25 * 60 * 1000),
          status: 'delivered'
        }
      ]
    },
    {
      id: 'chat-003',
      name: 'Amit Patel',
      phone: '+91 94260 77112',
      company: 'Gujarat Polyfilms Pvt. Ltd.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'open',
      assignedTo: 'Pooja Iyer',
      unreadCount: 0,
      tags: ['Payment Pending', 'Customer'],
      lastMessage: 'Received the cheque copy Amit ji. Thank you for the confirmation!',
      lastMessageTime: formatTime(45 * 60 * 1000),
      erpData: {
        customerId: 'CUST-1088',
        leadId: 'LEAD-0994',
        leadStage: 'Won / Customer',
        leadValue: 215000,
        orders: [
          { id: 'ORD-9804', title: 'BOPP Packaging Film Rolls', amount: 215000, status: 'Delivered', date: '18 Sep 2026' }
        ],
        quotations: [
          { id: 'QT-2026-64', total: 215000, status: 'Invoiced' }
        ],
        pendingPayment: 85000,
        billingAddress: 'GIDC Industrial Estate, Ankleshwar, Gujarat 393002'
      },
      messages: [
        {
          id: 'msg-301',
          sender: 'agent',
          text: 'Dear Amit ji, gentle reminder regarding pending balance ₹85,000 against invoice INV-2026-4401 (Order ORD-9804).',
          timestamp: formatTime(240 * 60 * 1000),
          status: 'read',
          senderName: 'Pooja Iyer'
        },
        {
          id: 'msg-302',
          sender: 'customer',
          text: 'Accounts team cheque ready kar rahi hai, kal deposit ho jayega. Cheque copy yahan share kar deta hoon.',
          timestamp: formatTime(180 * 60 * 1000),
          status: 'read'
        },
        {
          id: 'msg-303',
          sender: 'customer',
          mediaType: 'image',
          fileName: 'Cheque_Scan_HDFC_85000.jpg',
          fileSize: '1.2 MB',
          mediaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
          text: 'Cheque #882014 HDFC Bank for ₹85,000 dated 28-09-2026.',
          timestamp: formatTime(60 * 60 * 1000),
          status: 'read'
        },
        {
          id: 'msg-304',
          sender: 'agent',
          text: 'Received the cheque copy Amit ji. Thank you for the confirmation!',
          timestamp: formatTime(45 * 60 * 1000),
          status: 'delivered',
          senderName: 'Pooja Iyer',
          reactions: ['🙏']
        }
      ]
    },
    {
      id: 'chat-004',
      name: 'Sneha Kulkarni',
      phone: '+91 97654 33219',
      company: 'Tata Motors Supply Chain Division',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'open',
      assignedTo: 'Ananya Roy',
      unreadCount: 0,
      tags: ['OEM Partner', 'Vendor Contract', 'VIP'],
      lastMessage: 'Consignment vehicle MH-14-GH-8812 is on schedule.',
      lastMessageTime: formatTime(2 * 3600 * 1000),
      erpData: {
        customerId: 'CUST-0092',
        leadId: 'LEAD-1102',
        leadStage: 'Production Run',
        leadValue: 2800000,
        orders: [
          { id: 'ORD-9755', title: 'Stamping Dies & Assembly Fixtures', amount: 1540000, status: 'Ready for Dispatch', date: '22 Sep 2026' }
        ],
        quotations: [
          { id: 'QT-2026-99', total: 2800000, status: 'Under Fulfillment' }
        ],
        pendingPayment: 0,
        billingAddress: 'Tata Motors Car Plant, Pimpri, Pune 411018'
      },
      messages: [
        {
          id: 'msg-401',
          sender: 'customer',
          text: 'Hi Ananya, is the stamping dies batch cleared for dispatch from your Chakan plant?',
          timestamp: formatTime(4 * 3600 * 1000),
          status: 'read'
        },
        {
          id: 'msg-402',
          sender: 'agent',
          text: 'Yes Sneha! Final lifting inspection was approved by QC engineer Rahul Verma this morning.',
          timestamp: formatTime(3 * 3600 * 1000),
          status: 'read',
          senderName: 'Ananya Roy'
        },
        {
          id: 'msg-403',
          sender: 'agent',
          text: 'Consignment vehicle MH-14-GH-8812 is on schedule.',
          timestamp: formatTime(2 * 3600 * 1000),
          status: 'read',
          senderName: 'Ananya Roy'
        }
      ]
    },
    {
      id: 'chat-005',
      name: 'Ramesh Sharma',
      phone: '+91 98110 44221',
      company: 'Balaji Engineering Works',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      status: 'closed',
      assignedTo: 'Vikramaditya Sharma',
      unreadCount: 0,
      tags: ['Closed Query', 'Resolved'],
      lastMessage: 'Thank you for resolving the warranty replacement quickly!',
      lastMessageTime: formatTime(24 * 3600 * 1000),
      erpData: {
        customerId: 'CUST-1402',
        leadId: 'LEAD-0820',
        leadStage: 'Closed',
        leadValue: 95000,
        orders: [
          { id: 'ORD-9102', title: 'Hydraulic Valve Replacement', amount: 95000, status: 'Closed', date: '10 Aug 2026' }
        ],
        quotations: [],
        pendingPayment: 0,
        billingAddress: 'Sector 58, Ballabgarh, Faridabad 121004'
      },
      messages: [
        {
          id: 'msg-501',
          sender: 'customer',
          text: 'Thank you for resolving the warranty replacement quickly!',
          timestamp: formatTime(24 * 3600 * 1000),
          status: 'read'
        }
      ]
    },
    {
      id: 'chat-006',
      name: 'Kavita Sundaram',
      phone: '+91 98450 66782',
      company: 'Apex Precision Tools Chennai',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      status: 'open',
      assignedTo: 'Unassigned',
      unreadCount: 3,
      tags: ['New Inquiry', 'Inquiry'],
      lastMessage: 'Please share your product catalog for CNC cutting tools.',
      lastMessageTime: formatTime(5 * 60 * 1000), // 5 mins ago
      erpData: {
        customerId: 'CUST-NEW-01',
        leadId: 'LEAD-1140',
        leadStage: 'New Inquiry',
        leadValue: 350000,
        orders: [],
        quotations: [],
        pendingPayment: 0,
        billingAddress: 'Ambattur Industrial Estate, Chennai 600058'
      },
      messages: [
        {
          id: 'msg-601',
          sender: 'customer',
          text: 'Hello, we came across your listing on IndiaMART.',
          timestamp: formatTime(15 * 60 * 1000),
          status: 'delivered'
        },
        {
          id: 'msg-602',
          sender: 'customer',
          text: 'Do you supply tungsten carbide inserts in bulk?',
          timestamp: formatTime(10 * 60 * 1000),
          status: 'delivered'
        },
        {
          id: 'msg-603',
          sender: 'customer',
          text: 'Please share your product catalog for CNC cutting tools.',
          timestamp: formatTime(5 * 60 * 1000),
          status: 'delivered'
        }
      ]
    }
  ];

  const initialSettings = {
    phoneNumber: '+91 98200 12345',
    phoneNumberId: '109283746591024',
    wabaId: '201938475610293',
    webhookUrl: 'https://api.yourerp.com/webhooks/whatsapp',
    verifyToken: 'erp_wa_secure_webhook_token_2026',
    accessToken: 'EAABw92x78k10LMN... (Simulated Meta Cloud API)',
    syncStatus: 'Active (Sandbox / Demo Mode)',
    businessName: 'Multi Systems ERP Official',
    autoReplyEnabled: true,
    lastSyncTime: new Date().toISOString()
  };

  setWAData(WHATSAPP_KEYS.CHATS, initialChats);
  setWAData(WHATSAPP_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
  setWAData(WHATSAPP_KEYS.SETTINGS, initialSettings);
  localStorage.setItem(WHATSAPP_KEYS.SEEDED, 'true');
}

// -------------------------------------------------------------
// Chats Query & Messaging Operations
// -------------------------------------------------------------

export function getWhatsAppChats() {
  initWhatsAppSeedData();
  return getWAData(WHATSAPP_KEYS.CHATS, []);
}

export function getWhatsAppChatById(chatId) {
  const chats = getWhatsAppChats();
  return chats.find((c) => c.id === chatId) || null;
}

export function sendWhatsAppMessage(chatId, messagePayload) {
  const chats = getWhatsAppChats();
  const targetIndex = chats.findIndex((c) => c.id === chatId);
  if (targetIndex === -1) return null;

  const targetChat = { ...chats[targetIndex] };
  const newMsgId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newMsg = {
    id: newMsgId,
    sender: 'agent',
    senderName: messagePayload.senderName || 'Administrator',
    text: messagePayload.text || '',
    mediaType: messagePayload.mediaType || 'text', // 'text' | 'image' | 'document' | 'audio'
    mediaUrl: messagePayload.mediaUrl || null,
    fileName: messagePayload.fileName || null,
    fileSize: messagePayload.fileSize || null,
    replyTo: messagePayload.replyTo || null,
    timestamp: new Date().toISOString(),
    status: 'sent', // 'sent' -> simulates delivery
    reactions: []
  };

  targetChat.messages = [...targetChat.messages, newMsg];
  targetChat.lastMessage = newMsg.text || `[${newMsg.mediaType.toUpperCase()}]`;
  targetChat.lastMessageTime = newMsg.timestamp;

  chats[targetIndex] = targetChat;
  setWAData(WHATSAPP_KEYS.CHATS, chats);

  // Simulate delivery and blue tick after brief delay
  setTimeout(() => {
    simulateMessageStatusUpdate(chatId, newMsgId, 'read');
  }, 1800);

  return newMsg;
}

export function simulateCustomerReply(chatId, replyText = 'Thank you! Got your message.') {
  const chats = getWhatsAppChats();
  const targetIndex = chats.findIndex((c) => c.id === chatId);
  if (targetIndex === -1) return;

  const targetChat = { ...chats[targetIndex] };
  const replyMsg = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sender: 'customer',
    text: replyText,
    timestamp: new Date().toISOString(),
    status: 'delivered',
    reactions: []
  };

  targetChat.messages = [...targetChat.messages, replyMsg];
  targetChat.lastMessage = replyText;
  targetChat.lastMessageTime = replyMsg.timestamp;
  targetChat.unreadCount = (targetChat.unreadCount || 0) + 1;

  chats[targetIndex] = targetChat;
  setWAData(WHATSAPP_KEYS.CHATS, chats);
}

export function simulateMessageStatusUpdate(chatId, messageId, newStatus) {
  const chats = getWAData(WHATSAPP_KEYS.CHATS, []);
  const target = chats.find((c) => c.id === chatId);
  if (!target) return;

  target.messages = target.messages.map((m) =>
    m.id === messageId ? { ...m, status: newStatus } : m
  );
  setWAData(WHATSAPP_KEYS.CHATS, chats);
}

export function markChatAsRead(chatId) {
  const chats = getWhatsAppChats();
  const updated = chats.map((c) => {
    if (c.id === chatId && c.unreadCount > 0) {
      return {
        ...c,
        unreadCount: 0,
        messages: c.messages.map((m) =>
          m.sender === 'customer' ? { ...m, status: 'read' } : m
        )
      };
    }
    return c;
  });
  setWAData(WHATSAPP_KEYS.CHATS, updated);
}

export function addMessageReaction(chatId, messageId, emoji) {
  const chats = getWhatsAppChats();
  const updated = chats.map((c) => {
    if (c.id === chatId) {
      return {
        ...c,
        messages: c.messages.map((m) => {
          if (m.id === messageId) {
            const currentReactions = m.reactions || [];
            // Toggle reaction
            const hasEmoji = currentReactions.includes(emoji);
            const newReactions = hasEmoji
              ? currentReactions.filter((e) => e !== emoji)
              : [...currentReactions, emoji];
            return { ...m, reactions: newReactions };
          }
          return m;
        })
      };
    }
    return c;
  });
  setWAData(WHATSAPP_KEYS.CHATS, updated);
}

export function deleteWhatsAppMessage(chatId, messageId) {
  const chats = getWhatsAppChats();
  const updated = chats.map((c) => {
    if (c.id === chatId) {
      const filtered = c.messages.filter((m) => m.id !== messageId);
      const last = filtered[filtered.length - 1];
      return {
        ...c,
        messages: filtered,
        lastMessage: last ? last.text || `[${last.mediaType}]` : '',
        lastMessageTime: last ? last.timestamp : c.lastMessageTime
      };
    }
    return c;
  });
  setWAData(WHATSAPP_KEYS.CHATS, updated);
}

export function assignChatToAgent(chatId, agentName) {
  const chats = getWhatsAppChats();
  const updated = chats.map((c) => {
    if (c.id === chatId) {
      return { ...c, assignedTo: agentName };
    }
    return c;
  });
  setWAData(WHATSAPP_KEYS.CHATS, updated);
}

export function toggleChatStatus(chatId) {
  const chats = getWhatsAppChats();
  let nextStatus = 'closed';
  const updated = chats.map((c) => {
    if (c.id === chatId) {
      nextStatus = c.status === 'open' ? 'closed' : 'open';
      return { ...c, status: nextStatus };
    }
    return c;
  });
  setWAData(WHATSAPP_KEYS.CHATS, updated);
  return nextStatus;
}

export function forwardWhatsAppMessage(fromChatId, toChatId, messageId) {
  const chats = getWhatsAppChats();
  const sourceChat = chats.find((c) => c.id === fromChatId);
  const targetIndex = chats.findIndex((c) => c.id === toChatId);
  if (!sourceChat || targetIndex === -1) return false;

  const msg = sourceChat.messages.find((m) => m.id === messageId);
  if (!msg) return false;

  const targetChat = { ...chats[targetIndex] };
  const forwardedMsg = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sender: 'agent',
    senderName: 'Administrator',
    text: msg.text || '',
    mediaType: msg.mediaType || 'text',
    mediaUrl: msg.mediaUrl,
    fileName: msg.fileName,
    fileSize: msg.fileSize,
    isForwarded: true,
    timestamp: new Date().toISOString(),
    status: 'sent',
    reactions: []
  };

  targetChat.messages = [...targetChat.messages, forwardedMsg];
  targetChat.lastMessage = forwardedMsg.text || `[Forwarded ${forwardedMsg.mediaType}]`;
  targetChat.lastMessageTime = forwardedMsg.timestamp;

  chats[targetIndex] = targetChat;
  setWAData(WHATSAPP_KEYS.CHATS, chats);
  return true;
}

// -------------------------------------------------------------
// Message Templates & Settings
// -------------------------------------------------------------

export function getWhatsAppTemplates() {
  initWhatsAppSeedData();
  return getWAData(WHATSAPP_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
}

export function saveWhatsAppTemplate(templateData) {
  const templates = getWhatsAppTemplates();
  let updated;
  if (templateData.id) {
    updated = templates.map((t) => (t.id === templateData.id ? { ...t, ...templateData } : t));
  } else {
    const newTpl = {
      ...templateData,
      id: `TPL-${Date.now().toString().slice(-4)}`
    };
    updated = [newTpl, ...templates];
  }
  setWAData(WHATSAPP_KEYS.TEMPLATES, updated);
  return updated;
}

export function deleteWhatsAppTemplate(templateId) {
  const templates = getWhatsAppTemplates();
  const updated = templates.filter((t) => t.id !== templateId);
  setWAData(WHATSAPP_KEYS.TEMPLATES, updated);
  return updated;
}

export function getWhatsAppSettings() {
  initWhatsAppSeedData();
  return getWAData(WHATSAPP_KEYS.SETTINGS, {});
}

export function saveWhatsAppSettings(settingsData) {
  const current = getWhatsAppSettings();
  const updated = {
    ...current,
    ...settingsData,
    lastSyncTime: new Date().toISOString()
  };
  setWAData(WHATSAPP_KEYS.SETTINGS, updated);
  return updated;
}

// Summary Metrics for Sidebar & Dashboard Badges
export function getWhatsAppSummary() {
  const chats = getWhatsAppChats();
  const unreadChats = chats.filter((c) => (c.unreadCount || 0) > 0);
  const totalUnreadCount = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const openChatsCount = chats.filter((c) => c.status === 'open').length;
  const unassignedChatsCount = chats.filter(
    (c) => !c.assignedTo || c.assignedTo === 'Unassigned'
  ).length;

  return {
    totalChatsCount: chats.length,
    openChatsCount,
    unreadChatsCount: unreadChats.length,
    totalUnreadMessages: totalUnreadCount,
    unassignedChatsCount
  };
}
