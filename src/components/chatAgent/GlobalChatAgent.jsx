import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Copy,
  Check,
  ArrowRight,
  GripVertical
} from 'lucide-react';
import {
<<<<<<< HEAD
  generateAgentResponse,
  playAgentSound
=======
  queryProcesslyAgent,
  playAgentSound,
  N8N_CONFIG,
  getOrCreateConversationId,
  resetConversationId
>>>>>>> daf8de7 ( .gitignore update)
} from '../../services/aiAgentService';

const CHAT_STORAGE_KEY = 'erp_ai_chat_agent_history_v1';
const SOUND_STORAGE_KEY = 'erp_ai_chat_sound_enabled';

const INITIAL_GREETING = {
  id: 'init-msg',
  sender: 'agent',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
<<<<<<< HEAD
  text: `👋 **Namaste! Main aapka ERP AI Chat Agent hoon.**\n\nMain aapke ERP systems (Purchase, Sales, Leads, Tasks, WhatsApp, HR) ka real-time data monitor karta hoon. Aap mujhse kisi bhi indent, order, ya module ka status pooch sakte hain ya direct page par navigate kar sakte hain!`,
  actions: [
    { label: '📊 System Overview', query: 'Show complete ERP summary' },
    { label: '📦 GRN & Purchase Status', query: 'What is the status of purchase and GRN?' },
    { label: '🚀 Ready for Dispatch Orders', query: 'Show orders ready for dispatch' },
    { label: '📋 My Tasks Summary', query: 'Show my pending tasks' }
=======
  text: `👋 **Namaste! Main aapka "Processly Agent" hoon.**\n\nMain aapke ERP systems (Supply Chain Status, Order Pipelines, Pending Approvals, aur System Summaries) ka real-time data monitor karta hoon. Aap mujhse kisi bhi indent, order ya module ka live status pooch sakte hain!`,
  quick_actions: [
    'Purchase & GRN Status',
    'Sales Orders Pipeline',
    'My Pending Tasks',
    'Full System Summary'
  ],
  actions: [
    { label: '📦 Purchase & GRN Status', query: 'Purchase & GRN Status' },
    { label: '🚀 Sales Orders Pipeline', query: 'Sales Orders Pipeline' },
    { label: '📋 My Pending Tasks', query: 'My Pending Tasks' },
    { label: '📊 Full System Summary', query: 'Full System Summary' }
>>>>>>> daf8de7 ( .gitignore update)
  ]
};

export function GlobalChatAgent() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
  });

  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
    return [INITIAL_GREETING];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
<<<<<<< HEAD
=======
  // Active Conversation UUID (generated via browser built-in crypto.randomUUID)
  const [conversationId, setConversationId] = useState(() => getOrCreateConversationId());
>>>>>>> daf8de7 ( .gitignore update)

  // Draggable position state (saved in localStorage)
  const [btnPos, setBtnPos] = useState(() => {
    try {
      const saved = localStorage.getItem('processly_agent_btn_pos');
<<<<<<< HEAD
      if (saved) return JSON.parse(saved);
=======
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          // If legacy format with x on right side, convert to right-anchored
          if (parsed.right === undefined && parsed.x !== undefined) {
            const screenW = typeof window !== 'undefined' ? window.innerWidth : 1366;
            if (parsed.x > screenW / 2) {
              const converted = {
                right: Math.max(16, screenW - (parsed.x + 50)),
                top: parsed.y,
                isRight: true,
              };
              localStorage.setItem('processly_agent_btn_pos', JSON.stringify(converted));
              return converted;
            }
          }
          return parsed;
        }
      }
>>>>>>> daf8de7 ( .gitignore update)
    } catch (e) {
      // Ignore
    }
    return null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, hasMoved: false });
  const buttonRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Detect current module name from URL
  const getCurrentModuleLabel = () => {
    const p = location.pathname;
    if (p.startsWith('/purchase')) return 'Purchase System';
    if (p.startsWith('/sales')) return 'Sales & OTD';
    if (p.startsWith('/lead-to-orders')) return 'Lead To Orders';
    if (p.startsWith('/tasks') || p.startsWith('/my-tasks') || p.startsWith('/checklist') || p.startsWith('/delegation'))
      return 'Tasks & Checklist';
    if (p.startsWith('/whatsapp')) return 'WhatsApp Inbox';
    if (p.startsWith('/hr')) return 'HR FMS';
    if (p.startsWith('/petty-expenses')) return 'Petty Expenses';
    if (p.startsWith('/doc-subscription')) return 'Doc & Subscription';
    if (p.startsWith('/mis-summary')) return 'MIS Summary';
    if (p.startsWith('/inventory')) return 'Inventory System';
    return 'Processly Assistant';
  };

  // Save chat to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to persist chat messages:', e);
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-IN'; // Works for Indian English and Hindi terms

      recog.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recog.onerror = () => setIsListening(false);
      recog.onend = () => setIsListening(false);
      recognitionRef.current = recog;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

<<<<<<< HEAD
  const handleSendMessage = (textToSend = null) => {
=======
  const handleSendMessage = async (textToSend = null) => {
>>>>>>> daf8de7 ( .gitignore update)
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    if (soundEnabled) playAgentSound('send');

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

<<<<<<< HEAD
    // Realistic brief agent thinking delay
    setTimeout(() => {
      const response = generateAgentResponse(query, {
        currentPath: location.pathname,
        currentUser: user
=======
    try {
      const response = await queryProcesslyAgent(query, {
        currentPath: location.pathname,
        currentUser: user,
        conversationId,
        sessionId: conversationId
>>>>>>> daf8de7 ( .gitignore update)
      });

      const agentMsg = {
        id: `agt-${Date.now()}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: response.text,
<<<<<<< HEAD
        actions: response.actions || []
=======
        quick_actions: response.quick_actions || [],
        actions: response.actions || [],
        source: response.source || 'n8n'
>>>>>>> daf8de7 ( .gitignore update)
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);

      if (soundEnabled) playAgentSound('reply');

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }

      // Auto-navigate if triggered
      if (response.navigateTo) {
        setTimeout(() => {
          navigate(response.navigateTo);
        }, 1200);
      }
<<<<<<< HEAD
    }, 600);
=======
    } catch (err) {
      console.warn('Agent processing error:', err);
      const agentMsg = {
        id: `agt-${Date.now()}`,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `⚠️ **n8n Connection Error:**\n\n${err.message || 'Request failed'}\n\nPlease check kijiye ki n8n server active hai.`,
        quick_actions: ['Retry'],
        actions: [],
        source: 'error'
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);

      if (soundEnabled) playAgentSound('reply');
    }
>>>>>>> daf8de7 ( .gitignore update)
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChatHistory = () => {
<<<<<<< HEAD
    if (window.confirm('Kya aap chat history clear karna chahte hain?')) {
=======
    if (window.confirm('Kya aap chat history clear karke nayi conversation shuru karna chahte hain?')) {
      const newUuid = resetConversationId();
      setConversationId(newUuid);
>>>>>>> daf8de7 ( .gitignore update)
      setMessages([INITIAL_GREETING]);
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem(SOUND_STORAGE_KEY, String(nextVal));
  };

  // Helper to format text with Markdown bold and bullet points
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Format bold text **text** and inline code `code`
          const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return (
                <code
                  key={pIdx}
                  className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-semibold"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return part;
          });

          // Bullet point styling
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-indigo-500 font-bold">•</span>
                <span className="flex-1">{formattedLine}</span>
              </div>
            );
          }

          return <div key={idx}>{formattedLine}</div>;
        })}
      </div>
    );
  };

  // Handle dragging anywhere on the screen
<<<<<<< HEAD
=======
  // Handle dragging anywhere on the screen
>>>>>>> daf8de7 ( .gitignore update)
  const handleDragStart = (e) => {
    if (e.type === 'mousedown' && e.button !== 0) return;

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    const rect = buttonRef.current?.getBoundingClientRect();
<<<<<<< HEAD
    const currentX = rect ? rect.left : window.innerWidth - 180;
    const currentY = rect ? rect.top : window.innerHeight - 80;
=======
    const currentLeft = rect ? rect.left : window.innerWidth - 60;
    const currentTop = rect ? rect.top : window.innerHeight - 80;
>>>>>>> daf8de7 ( .gitignore update)

    dragInfoRef.current = {
      startX: clientX,
      startY: clientY,
<<<<<<< HEAD
      initialX: currentX,
      initialY: currentY,
=======
      initialLeft: currentLeft,
      initialTop: currentTop,
>>>>>>> daf8de7 ( .gitignore update)
      hasMoved: false
    };

    setIsDragging(true);

    const onMove = (moveEvt) => {
      const curX = moveEvt.type === 'touchmove' ? moveEvt.touches[0].clientX : moveEvt.clientX;
      const curY = moveEvt.type === 'touchmove' ? moveEvt.touches[0].clientY : moveEvt.clientY;

      const deltaX = curX - dragInfoRef.current.startX;
      const deltaY = curY - dragInfoRef.current.startY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        dragInfoRef.current.hasMoved = true;
      }

<<<<<<< HEAD
      const btnWidth = buttonRef.current?.offsetWidth || 150;
      const btnHeight = buttonRef.current?.offsetHeight || 44;

      const clampedX = Math.max(12, Math.min(dragInfoRef.current.initialX + deltaX, window.innerWidth - btnWidth - 12));
      const clampedY = Math.max(12, Math.min(dragInfoRef.current.initialY + deltaY, window.innerHeight - btnHeight - 12));

      setBtnPos({ x: clampedX, y: clampedY });
=======
      const btnWidth = buttonRef.current?.offsetWidth || 50;
      const btnHeight = buttonRef.current?.offsetHeight || 44;

      const targetLeft = dragInfoRef.current.initialLeft + deltaX;
      const clampedY = Math.max(12, Math.min(dragInfoRef.current.initialTop + deltaY, window.innerHeight - btnHeight - 12));

      // When on the right half, anchor from RIGHT so hover expands to the LEFT into the page
      if (targetLeft > window.innerWidth / 2) {
        const clampedRight = Math.max(12, Math.min(window.innerWidth - targetLeft - btnWidth, window.innerWidth - btnWidth - 12));
        setBtnPos({ right: clampedRight, top: clampedY, isRight: true });
      } else {
        const clampedX = Math.max(12, Math.min(targetLeft, window.innerWidth - btnWidth - 12));
        setBtnPos({ left: clampedX, top: clampedY, isRight: false });
      }
>>>>>>> daf8de7 ( .gitignore update)
    };

    const onEnd = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);

      if (dragInfoRef.current.hasMoved) {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
<<<<<<< HEAD
          const finalPos = { x: rect.left, y: rect.top };
          try {
            localStorage.setItem('processly_agent_btn_pos', JSON.stringify(finalPos));
=======
          const isRight = rect.left > window.innerWidth / 2;
          const posToSave = isRight
            ? { right: Math.max(12, window.innerWidth - rect.right), top: rect.top, isRight: true }
            : { left: Math.max(12, rect.left), top: rect.top, isRight: false };

          setBtnPos(posToSave);
          try {
            localStorage.setItem('processly_agent_btn_pos', JSON.stringify(posToSave));
>>>>>>> daf8de7 ( .gitignore update)
          } catch (e) {
            // Ignore
          }
        }
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  const handleLauncherClick = () => {
    if (dragInfoRef.current.hasMoved) {
      dragInfoRef.current.hasMoved = false;
      return;
    }
    setIsOpen(true);
  };

  // Adjust button position if browser window resized
  useEffect(() => {
    const handleResize = () => {
      setBtnPos((prev) => {
        if (!prev) return null;
<<<<<<< HEAD
        const btnWidth = buttonRef.current?.offsetWidth || 150;
        const btnHeight = buttonRef.current?.offsetHeight || 44;
        const clampedX = Math.max(12, Math.min(prev.x, window.innerWidth - btnWidth - 12));
        const clampedY = Math.max(12, Math.min(prev.y, window.innerHeight - btnHeight - 12));
        return { x: clampedX, y: clampedY };
=======
        const btnHeight = buttonRef.current?.offsetHeight || 44;
        const clampedY = Math.max(12, Math.min(prev.top ?? prev.y ?? 100, window.innerHeight - btnHeight - 12));
        if (prev.isRight || prev.right !== undefined) {
          return { ...prev, top: clampedY };
        }
        const btnWidth = buttonRef.current?.offsetWidth || 50;
        const clampedX = Math.max(12, Math.min(prev.left ?? prev.x ?? 12, window.innerWidth - btnWidth - 12));
        return { ...prev, left: clampedX, top: clampedY };
>>>>>>> daf8de7 ( .gitignore update)
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

<<<<<<< HEAD
=======
  // Compute fixed position style: If right side, anchor right so hover expands to the LEFT
  const getLauncherStyle = () => {
    if (!btnPos) return undefined;

    const isRightAnchored =
      btnPos.right !== undefined ||
      btnPos.isRight === true ||
      (btnPos.x !== undefined && btnPos.x > window.innerWidth / 2);

    if (isRightAnchored) {
      const rightDistance =
        btnPos.right !== undefined
          ? btnPos.right
          : Math.max(16, window.innerWidth - ((btnPos.x || 0) + (buttonRef.current?.offsetWidth || 50)));

      const topDistance = btnPos.top ?? btnPos.y ?? 100;

      return {
        right: `${rightDistance}px`,
        top: `${topDistance}px`,
        left: 'auto',
      };
    }

    return {
      left: `${btnPos.left ?? btnPos.x ?? 16}px`,
      top: `${btnPos.top ?? btnPos.y ?? 100}px`,
      right: 'auto',
    };
  };

>>>>>>> daf8de7 ( .gitignore update)
  return (
    <>
      {/* Floating Action Button (FAB) - Draggable Ask Agent Pill */}
      {!isOpen && (
        <div
          ref={buttonRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
<<<<<<< HEAD
          style={
            btnPos
              ? { left: `${btnPos.x}px`, top: `${btnPos.y}px` }
              : undefined
          }
          className={`fixed z-50 flex items-center select-none ${
=======
          style={getLauncherStyle()}
          className={`fixed z-50 flex items-center justify-end select-none pointer-events-auto ${
>>>>>>> daf8de7 ( .gitignore update)
            !btnPos ? 'bottom-20 md:bottom-6 right-4 md:right-6' : ''
          }`}
        >
          <button
            id="erp-chat-agent-launcher"
            onClick={handleLauncherClick}
<<<<<<< HEAD
            className={`flex items-center p-2.5 hover:px-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 ease-in-out group ${
              isDragging
                ? 'cursor-grabbing scale-105 shadow-2xl ring-2 ring-indigo-500/40 opacity-95'
                : 'cursor-grab hover:scale-[1.03] active:scale-95 shadow-indigo-500/10 hover:shadow-indigo-500/25'
            }`}
            title="Ask Agent • Click to open (Drag anywhere)"
          >
            {/* Star Icon (Always visible initially) */}
            <div className="relative flex items-center justify-center pointer-events-none">
              <Sparkles className="w-5 h-5 text-amber-500 group-hover:rotate-12 transition-transform duration-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
              )}
            </div>

            {/* Unhides smoothly on hover */}
            <div className="max-w-0 opacity-0 group-hover:max-w-48 group-hover:opacity-100 group-hover:ml-2 overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap flex items-center gap-2 pointer-events-none">
=======
            className={`flex items-center p-2 hover:px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 ease-out group ${
              isDragging
                ? 'cursor-grabbing scale-105 shadow-2xl ring-2 ring-indigo-500/40 opacity-95'
                : 'cursor-grab hover:scale-[1.02] active:scale-95 shadow-indigo-500/10 hover:shadow-indigo-500/25'
            }`}
            title="Ask Agent • Click to open (Drag anywhere)"
          >
            {/* Unhides smoothly on hover - SLIDES OPEN TO THE LEFT */}
            <div className="max-w-0 opacity-0 group-hover:max-w-56 group-hover:opacity-100 group-hover:mr-2 overflow-hidden transition-all duration-300 ease-out whitespace-nowrap flex items-center gap-1.5 pointer-events-none">
              <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
>>>>>>> daf8de7 ( .gitignore update)
              <span className="tracking-tight text-xs font-bold text-slate-800 dark:text-slate-100">
                Ask Agent...
              </span>
              <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 rounded-md text-[10px] font-extrabold uppercase">
                AI
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white font-extrabold text-[10px] rounded-full shadow-xs animate-bounce">
                  {unreadCount}
                </span>
              )}
<<<<<<< HEAD
              <GripVertical className="w-3.5 h-3.5 text-slate-400" />
=======
            </div>

            {/* Star Icon (Always visible on the right) */}
            <div className="relative flex items-center justify-center pointer-events-none w-7 h-7 rounded-full bg-amber-500/10 dark:bg-amber-400/10 shrink-0">
              <Sparkles className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform duration-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
              )}
>>>>>>> daf8de7 ( .gitignore update)
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Drawer / Dialog */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-3 md:inset-6 rounded-2xl md:rounded-3xl'
              : 'bottom-2 md:bottom-6 right-2 md:right-6 w-[calc(100vw-1rem)] sm:w-[420px] md:w-[460px] h-[calc(100vh-5.5rem)] sm:h-[620px] max-h-[92vh] rounded-2xl md:rounded-3xl'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
                    Processly Agent
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
<<<<<<< HEAD
=======
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                    title={`N8N Webhook: ${N8N_CONFIG.getWebhookUrl()}`}
                  >
                    N8N Connected
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50"
                    title={`Active Conversation UUID: ${conversationId}`}
                  >
                    UUID: {conversationId ? `${conversationId.slice(0, 8)}...` : ''}
                  </span>
>>>>>>> daf8de7 ( .gitignore update)
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>Context:</span>
                  <span className="font-semibold text-white bg-indigo-800/60 px-1.5 py-0.2 rounded-md">
                    {getCurrentModuleLabel()}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={soundEnabled ? 'Mute Audio Chime' : 'Unmute Audio Chime'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                onClick={clearChatHistory}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear Conversation History"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isExpanded ? 'Restore Normal Size' : 'Maximize Window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors ml-1"
                title="Close Agent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50 dark:bg-slate-900/40">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group animate-in fade-in-50 duration-200`}
                >
                  <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[85%]">
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 mb-1 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`relative px-4 py-3 rounded-2xl shadow-xs ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                      }`}
                    >
                      {/* Message Content */}
                      <div>{renderFormattedText(msg.text)}</div>

<<<<<<< HEAD
                      {/* Interactive Navigation Action Buttons inside Message */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 flex flex-wrap gap-1.5">
                          {msg.actions.map((act, actIdx) => (
                            <button
                              key={actIdx}
                              onClick={() => {
                                if (act.path) {
                                  navigate(act.path);
                                  if (window.innerWidth < 768) {
                                    setIsOpen(false);
                                  }
                                } else if (act.query) {
                                  handleSendMessage(act.query);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                act.primary
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80'
                              }`}
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ))}
=======
                      {/* Interactive Quick Actions & Navigation Buttons */}
                      {((msg.quick_actions && msg.quick_actions.length > 0) || (msg.actions && msg.actions.length > 0)) && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 flex flex-wrap gap-1.5">
                          {msg.quick_actions && msg.quick_actions.length > 0
                            ? msg.quick_actions.map((qa, qaIdx) => (
                                <button
                                  key={`qa-${qaIdx}`}
                                  onClick={() => handleSendMessage(qa)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:scale-[1.02] active:scale-95"
                                >
                                  <span>{qa}</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                                </button>
                              ))
                            : msg.actions.map((act, actIdx) => (
                                <button
                                  key={`act-${actIdx}`}
                                  onClick={() => {
                                    if (act.path) {
                                      navigate(act.path);
                                      if (window.innerWidth < 768) {
                                        setIsOpen(false);
                                      }
                                    } else if (act.query) {
                                      handleSendMessage(act.query);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                    act.primary
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80'
                                  }`}
                                >
                                  <span>{act.label}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              ))}
>>>>>>> daf8de7 ( .gitignore update)
                        </div>
                      )}

                      {/* Footer: Timestamp & Copy */}
                      <div
                        className={`flex items-center justify-end gap-2 mt-1.5 text-[10px] ${
                          isUser ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <button
                            onClick={() => copyToClipboard(msg.id, msg.text)}
                            className="hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-500 animate-in fade-in-50 duration-200">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-semibold text-slate-400 ml-1">
                    Analyzing ERP records...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Action Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Voice Speech Recognition Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Speak your query (Speech to Text)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about Purchase, GRN, Orders, Leads, or type IND-0101..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
                />
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className={`p-2.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center cursor-pointer ${
                  inputMessage.trim()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 scale-100 active:scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Live Cross-System AI Engine
              </span>
              <span>Press Enter ↵ to send</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
