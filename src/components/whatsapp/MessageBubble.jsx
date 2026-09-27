import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  MoreVertical,
  Reply,
  Copy,
  Forward,
  Trash2,
  FileText,
  Download,
  Image as ImageIcon,
  Play,
  Pause,
  Smile
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];

export default function MessageBubble({
  message,
  onReply,
  onCopy,
  onForward,
  onDelete,
  onReact
}) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isAgent = message.sender === 'agent';

  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderStatusTicks = () => {
    if (!isAgent) return null;
    if (message.status === 'read') {
      return <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline ml-1" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline ml-1" />;
    }
    return <Check className="w-3.5 h-3.5 text-slate-400 inline ml-1" />;
  };

  return (
    <div
      className={`group relative flex flex-col mb-3 ${
        isAgent ? 'items-end' : 'items-start'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Floating Hover Action Menu */}
      {showActions && (
        <div
          className={`absolute -top-7 z-20 flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150 ${
            isAgent ? 'right-2' : 'left-2'
          }`}
        >
          {/* Reaction Emoji Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="React"
              className="p-1 rounded-full text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {/* Quick Emoji Bar Popup */}
            {showEmojiPicker && (
              <div className="absolute bottom-8 left-0 z-30 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 shadow-xl">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="hover:scale-125 transition-transform p-1 text-sm leading-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onReply(message)}
            title="Reply"
            className="p-1 rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onCopy(message.text || message.fileName)}
            title="Copy Text"
            className="p-1 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onForward(message)}
            title="Forward"
            className="p-1 rounded-full text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Forward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(message.id)}
            title="Delete"
            className="p-1 rounded-full text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-sm sm:max-w-md md:max-w-lg rounded-2xl px-3.5 py-2.5 shadow-sm text-xs sm:text-sm ${
          isAgent
            ? 'bg-emerald-600 text-white rounded-tr-xs'
            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs'
        }`}
      >
        {/* Forwarded Header Indicator */}
        {message.isForwarded && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-300 italic mb-1">
            <Forward className="w-3 h-3" />
            <span>Forwarded</span>
          </div>
        )}

        {/* Sender Name in group/agent mode */}
        {isAgent && message.senderName && (
          <p className="text-[10px] font-bold text-emerald-100/90 mb-0.5">
            {message.senderName} (You)
          </p>
        )}

        {/* Reply To Preview Context */}
        {message.replyTo && (
          <div
            className={`mb-2 p-2 rounded-lg border-l-3 text-xs ${
              isAgent
                ? 'bg-emerald-700/60 border-white text-white/90'
                : 'bg-slate-100 dark:bg-slate-700/50 border-emerald-500 text-slate-600 dark:text-slate-300'
            }`}
          >
            <p className="font-bold text-[11px] opacity-90">
              {message.replyTo.sender === 'agent' ? 'You' : 'Customer'}
            </p>
            <p className="truncate line-clamp-1 opacity-80 text-[11px]">
              {message.replyTo.text || `[${message.replyTo.mediaType || 'Attachment'}]`}
            </p>
          </div>
        )}

        {/* Media Attachments */}
        {message.mediaType === 'image' && (
          <div className="mb-2 overflow-hidden rounded-xl">
            <img
              src={message.mediaUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600'}
              alt={message.fileName || 'Image'}
              className="max-h-60 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => window.open(message.mediaUrl, '_blank')}
            />
          </div>
        )}

        {message.mediaType === 'document' && (
          <div
            className={`mb-2 p-2.5 rounded-xl flex items-center justify-between gap-3 ${
              isAgent ? 'bg-emerald-700/60' : 'bg-slate-100 dark:bg-slate-700/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-lg ${
                  isAgent ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{message.fileName || 'Document.pdf'}</p>
                <p className="text-[10px] opacity-80">{message.fileSize || '2.4 MB'}</p>
              </div>
            </div>
            <button
              onClick={() => alert(`Simulated downloading: ${message.fileName || 'Document.pdf'}`)}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}

        {message.mediaType === 'audio' && (
          <div
            className={`mb-2 p-2.5 rounded-xl flex items-center gap-3 ${
              isAgent ? 'bg-emerald-700/60' : 'bg-slate-100 dark:bg-slate-700/60'
            }`}
          >
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`p-2 rounded-full ${
                isAgent ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
              }`}
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <div className="flex-1 space-y-1">
              {/* Audio waveform simulation */}
              <div className="flex items-center gap-0.5 h-4">
                {[40, 70, 30, 90, 60, 100, 45, 80, 20, 65, 85, 35, 75, 50, 95].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-1 rounded-full ${
                      isAgent ? 'bg-white/70' : 'bg-emerald-500'
                    } ${isPlayingAudio ? 'animate-pulse' : ''}`}
                  />
                ))}
              </div>
              <p className="text-[10px] opacity-80">Voice Note • 0:42</p>
            </div>
          </div>
        )}

        {/* Text Message Content */}
        {message.text && (
          <p className="whitespace-pre-wrap break-words leading-relaxed select-text">
            {message.text}
          </p>
        )}

        {/* Timestamp and Delivery Ticks */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
            isAgent ? 'text-emerald-100/80' : 'text-slate-400 dark:text-slate-400'
          }`}
        >
          <span>{formatMessageTime(message.timestamp)}</span>
          {renderStatusTicks()}
        </div>
      </div>

      {/* Message Reactions Display */}
      {message.reactions && message.reactions.length > 0 && (
        <div
          className={`flex items-center gap-0.5 -mt-2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 shadow-sm text-xs ${
            isAgent ? 'mr-3' : 'ml-3'
          }`}
        >
          {message.reactions.map((r, i) => (
            <span key={i} className="leading-none">
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
