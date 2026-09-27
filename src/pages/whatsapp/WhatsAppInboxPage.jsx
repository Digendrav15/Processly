import React, { useState, useEffect } from 'react';
import ChatList from '../../components/whatsapp/ChatList';
import ChatWindow from '../../components/whatsapp/ChatWindow';
import CustomerInfoSidebar from '../../components/whatsapp/CustomerInfoSidebar';
import {
  getWhatsAppChats,
  markChatAsRead,
  assignChatToAgent,
  toggleChatStatus,
  sendWhatsAppMessage,
  initWhatsAppSeedData
} from '../../services/whatsappStorageService';
import { useAuth } from '../../context/AuthContext';

export default function WhatsAppInboxPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isCustomerSidebarOpen, setIsCustomerSidebarOpen] = useState(true);

  const loadChats = () => {
    initWhatsAppSeedData();
    const data = getWhatsAppChats();
    setChats(data);

    // Auto-select first chat on initial desktop load if none selected
    if (!selectedChatId && data.length > 0 && window.innerWidth >= 768) {
      setSelectedChatId(data[0].id);
      markChatAsRead(data[0].id);
    }
  };

  useEffect(() => {
    loadChats();

    const handleUpdate = () => {
      const data = getWhatsAppChats();
      setChats(data);
    };

    window.addEventListener('whatsapp_storage_update', handleUpdate);
    return () => window.removeEventListener('whatsapp_storage_update', handleUpdate);
  }, []);

  const handleSelectChat = (id) => {
    setSelectedChatId(id);
    markChatAsRead(id);
  };

  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;

  return (
    <div className="h-[calc(100vh-4rem)] max-w-full overflow-hidden flex bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      {/* Column 1: Chat List (Left) */}
      <div
        className={`${
          selectedChatId ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 flex-col flex-shrink-0 h-full`}
      >
        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          currentUserName={user?.name || 'Administrator'}
        />
      </div>

      {/* Column 2: Chat Window (Center) */}
      <div
        className={`${
          !selectedChatId ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col h-full min-w-0`}
      >
        <ChatWindow
          chat={selectedChat}
          allChats={chats}
          onBackMobile={() => setSelectedChatId(null)}
          isSidebarOpen={isCustomerSidebarOpen}
          onToggleSidebar={() => setIsCustomerSidebarOpen(!isCustomerSidebarOpen)}
        />
      </div>

      {/* Column 3: Customer Info Sidebar (Right) */}
      {selectedChat && isCustomerSidebarOpen && (
        <div className="hidden lg:flex h-full">
          <CustomerInfoSidebar
            chat={selectedChat}
            isOpen={isCustomerSidebarOpen}
            onClose={() => setIsCustomerSidebarOpen(false)}
            onAssignAgent={(chatId, agent) => assignChatToAgent(chatId, agent)}
            onToggleStatus={(chatId) => toggleChatStatus(chatId)}
            onSendQuickReminder={(reminderText) => {
              sendWhatsAppMessage(selectedChat.id, {
                text: reminderText,
                mediaType: 'text'
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
