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

// Initialize Clean WhatsApp Data (Desktop Local & Supabase Ready)
export function initWhatsAppSeedData() {
  const seeded = localStorage.getItem(WHATSAPP_KEYS.SEEDED);
  if (seeded === 'true') return;

  if (!localStorage.getItem(WHATSAPP_KEYS.CHATS)) {
    setWAData(WHATSAPP_KEYS.CHATS, []);
  }
  if (!localStorage.getItem(WHATSAPP_KEYS.TEMPLATES)) {
    setWAData(WHATSAPP_KEYS.TEMPLATES, DEFAULT_TEMPLATES);
  }
  if (!localStorage.getItem(WHATSAPP_KEYS.SETTINGS)) {
    setWAData(WHATSAPP_KEYS.SETTINGS, {
      phoneNumberId: '',
      wabaId: '',
      verifyToken: '',
      accessToken: '',
      syncStatus: 'Disconnected',
      businessName: 'Corporate WhatsApp Portal',
      autoReplyEnabled: false,
      lastSyncTime: null
    });
  }
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
