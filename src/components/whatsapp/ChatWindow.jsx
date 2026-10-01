import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Search,
  MoreVertical,
  User,
  PanelRight,
  ArrowLeft,
  Lock,
  Unlock,
  CheckCircle2,
  Copy,
  Forward,
  ShieldCheck,
  Check
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import ForwardMessageModal from './ForwardMessageModal';
import TemplatesModal from './TemplatesModal';
import {
  sendWhatsAppMessage,
  addMessageReaction,
  deleteWhatsAppMessage,
  forwardWhatsAppMessage,
  assignChatToAgent,
  toggleChatStatus
} from '../../services/whatsappStorageService';

export default function ChatWindow({
  chat,
  allChats,
  onBackMobile,
  isSidebarOpen,
  onToggleSidebar
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [inChatSearch, setInChatSearch] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages?.length]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  if (!chat) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center select-none">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
          <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.983.538 1.834.814 2.79.815 3.18 0 5.767-2.587 5.768-5.766.001-3.18-2.586-5.767-5.767-5.801zm3.376 8.214c-.149.42-.871.799-1.21.848-.339.05-.72.072-2.138-.517-1.745-.727-2.868-2.5-2.955-2.617-.087-.116-.708-.942-.708-1.799s.446-1.277.605-1.45c.159-.174.348-.217.464-.217.116 0 .232.002.333.007.106.005.249-.04.389.297.149.362.508 1.238.552 1.328.044.09.073.195.015.312-.058.116-.087.189-.174.29-.087.102-.183.228-.261.306-.087.087-.179.182-.077.357.102.174.453.748.971 1.21.67.597 1.233.782 1.408.87.174.087.276.073.378-.044.102-.116.436-.508.552-.682.116-.174.232-.145.39-.087.159.058 1.008.475 1.182.562.174.087.29.131.333.203.044.072.044.42-.105.84zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.438 5.168L2 22l4.981-1.307A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-black text-slate-800 dark:text-white mb-1">
          WhatsApp Business for ERP
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
          Select a customer from the left to start live chatting, share quotations, send order dispatch alerts, and track payment receipts.
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
          <ShieldCheck className="w-4 h-4" />
          <span>Meta Cloud API & Webhook Ready Architecture</span>
        </div>
      </div>
    );
  }

  // Filter messages if search is active
  const displayedMessages = inChatSearch.trim()
    ? (chat.messages || []).filter((m) =>
        m.text?.toLowerCase().includes(inChatSearch.toLowerCase())
      )
    : chat.messages || [];

  const handleSendMessage = (payload) => {
    sendWhatsAppMessage(chat.id, payload);
    setReplyingTo(null);
  };

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const handleForwardConfirm = (targetChatId, messageId) => {
    const success = forwardWhatsAppMessage(chat.id, targetChatId, messageId);
    if (success) {
      showToast('Message forwarded successfully!');
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Header */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button for Mobile */}
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Customer Avatar */}
          <div className="relative flex-shrink-0 cursor-pointer" onClick={onToggleSidebar}>
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            {chat.status === 'open' && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-slate-900" />
            )}
          </div>

          {/* Customer Info */}
          <div className="min-w-0 cursor-pointer" onClick={onToggleSidebar}>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {chat.name}
              </h2>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black" title="Verified Customer">
                ✓
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <span className="font-mono">{chat.phone}</span>
              <span>•</span>
              <span className="truncate">{chat.company}</span>
            </p>
          </div>
        </div>

        {/* Right Header Action Icons */}
        <div className="flex items-center gap-1">
          {/* In-chat search toggle */}
          {showSearchInput ? (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={inChatSearch}
                onChange={(e) => setInChatSearch(e.target.value)}
                placeholder="Search in chat..."
                className="w-28 sm:w-40 text-xs bg-transparent border-none focus:outline-none text-slate-800 dark:text-white"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearchInput(false);
                  setInChatSearch('');
                }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearchInput(true)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Search conversation"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Audio call simulation */}
          <button
            onClick={() => alert(`Simulated calling ${chat.name} (${chat.phone})`)}
            className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Toggle Customer Info Panel */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl transition-colors ${
              isSidebarOpen
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Customer & ERP Profile Sidebar"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Date / Security Notice Pill */}
        <div className="flex justify-center my-2">
          <span className="px-3 py-1 rounded-lg text-[10px] font-semibold bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs text-slate-500 shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
            Messages are end-to-end connected with Processly
          </span>
        </div>

        {displayedMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onReply={(m) => setReplyingTo(m)}
            onCopy={handleCopyText}
            onForward={(m) => setForwardingMessage(m)}
            onDelete={(id) => deleteWhatsAppMessage(chat.id, id)}
            onReact={(id, emoji) => addMessageReaction(chat.id, id, emoji)}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Message Composer */}
      <MessageComposer
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onOpenTemplates={() => setShowTemplatesModal(true)}
      />

      {/* Forward Modal */}
      {forwardingMessage && (
        <ForwardMessageModal
          isOpen={true}
          onClose={() => setForwardingMessage(null)}
          message={forwardingMessage}
          chats={allChats}
          currentChatId={chat.id}
          onConfirmForward={handleForwardConfirm}
        />
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <TemplatesModal
          isOpen={true}
          onClose={() => setShowTemplatesModal(false)}
          onSelectTemplate={(templateText) => {
            handleSendMessage({ text: templateText, mediaType: 'text' });
            showToast('Template message sent!');
          }}
          customer={chat}
        />
      )}
    </div>
  );
}
