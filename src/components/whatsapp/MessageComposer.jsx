import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Mic,
  MicOff,
  X,
  Sparkles,
  Bookmark,
  Reply,
  UploadCloud,
  Check
} from 'lucide-react';

const EMOJI_CATEGORIES = {
  'Frequently Used': ['👍', '🙏', '❤️', '😊', '🔥', '🎉', '✅', '💼'],
  'Smileys & People': ['😀', '😃', '😄', '😁', '😅', '😂', '🙂', '😉', '😍', '🤔', '😎', '🤝'],
  'Business & Office': ['📊', '📈', '📄', '📁', '💼', '📦', '🚚', '💰', '💳', '💵', '🏢', '📑'],
  'Symbols & Objects': ['⭐', '⚠️', '⚡', '💡', '📞', '📧', '⏰', '🔒', '🔑', '🎯', '📍', '🚀']
};

export default function MessageComposer({
  onSendMessage,
  replyingTo,
  onCancelReply,
  onOpenTemplates
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // File Upload State
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Voice note timer simulation
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSend = () => {
    if (!inputText.trim() && !pendingAttachment) return;

    if (pendingAttachment) {
      onSendMessage({
        text: inputText.trim(),
        mediaType: pendingAttachment.type,
        mediaUrl: pendingAttachment.url,
        fileName: pendingAttachment.name,
        fileSize: pendingAttachment.size,
        replyTo: replyingTo
      });
      setPendingAttachment(null);
    } else {
      onSendMessage({
        text: inputText.trim(),
        mediaType: 'text',
        replyTo: replyingTo
      });
    }

    setInputText('');
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
    if (onCancelReply) onCancelReply();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Simulated image pick
  const handleImagePicked = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPendingAttachment({
        type: 'image',
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        url: url
      });
      setShowAttachmentMenu(false);
    }
  };

  // Simulated document pick
  const handleDocPicked = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingAttachment({
        type: 'document',
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        url: null
      });
      setShowAttachmentMenu(false);
    }
  };

  const sendVoiceNote = () => {
    setIsRecording(false);
    onSendMessage({
      text: '',
      mediaType: 'audio',
      replyTo: replyingTo
    });
    if (onCancelReply) onCancelReply();
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 relative">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImagePicked}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDocPicked}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
        className="hidden"
      />

      {/* Reply-to Preview Banner */}
      {replyingTo && (
        <div className="mb-2 px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border-l-4 border-emerald-500 rounded-lg flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Replying to {replyingTo.sender === 'agent' ? 'You' : 'Customer'}
              </span>
              <p className="truncate text-slate-500 dark:text-slate-400 text-[11px]">
                {replyingTo.text || `[${replyingTo.mediaType || 'Attachment'}]`}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Attachment Preview Banner */}
      {pendingAttachment && (
        <div className="mb-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {pendingAttachment.type === 'image' ? (
              <img
                src={pendingAttachment.url}
                alt="Upload preview"
                className="w-10 h-10 object-cover rounded-lg border border-emerald-300"
              />
            ) : (
              <div className="p-2 bg-emerald-600 text-white rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {pendingAttachment.name}
              </p>
              <p className="text-[11px] text-slate-500">{pendingAttachment.size} • Ready to send</p>
            </div>
          </div>
          <button
            onClick={() => setPendingAttachment(null)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Composer Controls Bar */}
      <div className="flex items-end gap-2">
        {/* Emoji Picker Button & Popup */}
        <div className="relative">
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowAttachmentMenu(false);
            }}
            className={`p-2.5 rounded-xl transition-colors ${
              showEmojiPicker
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Emoji Picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Emoji Popup Box */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-40 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Select Emoji 😊
                </span>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      {cat}
                    </p>
                    <div className="grid grid-cols-6 gap-1">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleSelectEmoji(emoji)}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-transform hover:scale-120"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Attachment Options Button & Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAttachmentMenu(!showAttachmentMenu);
              setShowEmojiPicker(false);
            }}
            className={`p-2.5 rounded-xl transition-colors ${
              showAttachmentMenu
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Attach Document / Media"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Attachment Popup Menu */}
          {showAttachmentMenu && (
            <div className="absolute bottom-12 left-0 z-40 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 shadow-2xl animate-in zoom-in-95 duration-150 space-y-1">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span>Photos & Videos</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Document (PDF/DOC)</span>
              </button>

              <button
                onClick={() => {
                  setShowAttachmentMenu(false);
                  if (onOpenTemplates) onOpenTemplates();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Bookmark className="w-4 h-4" />
                </div>
                <span>Quick Templates 📋</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Canned Template shortcut button */}
        <button
          onClick={onOpenTemplates}
          className="hidden sm:flex p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Insert WhatsApp Template"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Text Input or Voice Recording Indicator */}
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span className="font-semibold">Recording voice message...</span>
              <span className="font-mono font-bold">
                0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRecording(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={sendVoiceNote}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
              >
                Send Voice
              </button>
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or press Enter to send..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none max-h-32 placeholder:text-slate-400"
          />
        )}

        {/* Mic or Send Button */}
        {inputText.trim() || pendingAttachment ? (
          <button
            onClick={handleSend}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-3 rounded-2xl transition-all flex-shrink-0 ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600'
            }`}
            title="Record Voice Note"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
