import { useState, useRef, useEffect, useCallback } from 'react';
import useChatStore from '../../store/chatStore';
import useChat from '../../hooks/useChat';
import useVoiceInput from '../../hooks/useVoiceInput';
import useVoiceOutput from '../../hooks/useVoiceOutput';
import MicrophoneButton from '../VoiceControls/MicrophoneButton';
import AudioPlayer from '../VoiceControls/AudioPlayer';

const EMPTY_MESSAGES = [];

/**
 * Classic Desktop Chat UI — sidebar + message threads + voice controls.
 */
export default function ClassicChatUI() {
  const {
    chats,
    activeChatId,
    setActiveChat,
    createChat,
    deleteChat,
    isTyping,
    lastBotMessage,
  } = useChatStore();
  const messages = useChatStore((s) => s.chats[s.activeChatId]?.messages || EMPTY_MESSAGES);
  const voiceSettings = useChatStore((s) => s.voiceSettings);
  const updateVoiceSettings = useChatStore((s) => s.updateVoiceSettings);

  const { sendMessage: sendChatMessage } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  const voiceInput = useVoiceInput({
    language: voiceSettings.language,
    onResult: (text) => {
      sendChatMessage(text, voiceSettings.language, true); // true = isVoiceInput
    },
  });

  const voiceOutput = useVoiceOutput();

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-play TTS
  useEffect(() => {
    if (lastBotMessage?.text && (voiceSettings.autoPlay || lastBotMessage.forceSpeak)) {
      voiceOutput.speak(lastBotMessage.text);
    }
  }, [lastBotMessage, voiceSettings.autoPlay]);

  // Stop speaking if chat changes
  useEffect(() => {
    voiceOutput.stop();
  }, [activeChatId]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    sendChatMessage(inputValue, voiceSettings.language);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = '44px';
  }, [inputValue, sendChatMessage, voiceSettings.language]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = '44px';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  };

  const chatList = Object.values(chats).sort(
    (a, b) => b.id.localeCompare(a.id)
  );

  const filteredChats = searchQuery
    ? chatList.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chatList;

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
  };

  const speakMessage = (text) => {
    voiceOutput.stop();
    voiceOutput.speak(text);
  };

  const LANGUAGES = [
    { code: 'en-US', label: 'English' },
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'zh-CN', label: 'Chinese' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'ar-SA', label: 'Arabic' },
    { code: 'pt-BR', label: 'Portuguese' },
    { code: 'ko-KR', label: 'Korean' },
    { code: 'ru-RU', label: 'Russian' },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside
        className={`${
          sidebarOpen ? 'w-full md:w-72 translate-x-0' : 'w-0 -translate-x-full'
        } absolute md:relative z-30 flex-shrink-0 bg-gray-900/95 backdrop-blur-3xl border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden h-full`}
      >
        {/* Sidebar header */}
        <div className="p-3 border-b border-white/5 flex gap-2">
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => {
              createChat();
              if (window.innerWidth <= 768) setSidebarOpen(false);
            }}
            className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Chat</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 scrollbar-thin">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                setActiveChat(chat.id);
                if (window.innerWidth <= 768) setSidebarOpen(false);
              }}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeChatId === chat.id
                  ? 'bg-indigo-500/15 border border-indigo-500/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{chat.title}</p>
                <p className="text-xs text-white/30">{chat.timestamp}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="md:opacity-0 md:group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Language selector */}
        <div className="p-3 border-t border-white/5">
          <select
            value={voiceSettings.language}
            onChange={(e) => updateVoiceSettings({ language: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-gray-900">
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </aside>

      {/* ── Main Chat Area ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hidden md:block">
              AI Assistant
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => voiceOutput.toggleAutoPlay()}
              className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                voiceSettings.autoPlay
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-white/30'
              }`}
              title="Auto-play voice responses"
            >
              🔊 Auto
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group max-w-[75%] rounded-2xl px-4 py-3 shadow-lg transition-all ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : msg.type === 'system'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                      : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white/90'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs opacity-40">{msg.timestamp}</span>

                  {/* Actions for bot messages */}
                  {msg.type.includes('bot') && msg.type !== 'bot-temp' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyMessage(msg.content)}
                        className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70"
                        title="Copy"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => speakMessage(msg.content)}
                        className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70"
                        title="Speak"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* TTS Player (when speaking) */}
        {voiceOutput.isSpeaking && (
          <div className="px-4 pb-2">
            <AudioPlayer
              isSpeaking={voiceOutput.isSpeaking}
              isPaused={voiceOutput.isPaused}
              progress={voiceOutput.progress}
              voices={voiceOutput.voices}
              selectedVoice={voiceOutput.selectedVoice}
              onSelectVoice={voiceOutput.setSelectedVoice}
              speed={voiceOutput.speed}
              onSpeedChange={voiceOutput.setSpeed}
              volume={voiceOutput.volume}
              onVolumeChange={voiceOutput.setVolume}
              onPlay={() => voiceOutput.speak(lastBotMessage?.text || '')}
              onPause={voiceOutput.pause}
              onResume={voiceOutput.resume}
              onStop={voiceOutput.stop}
            />
          </div>
        )}

        {/* Input area */}
        <div className="p-2 sm:p-3 border-t border-white/5 bg-gray-900/30 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-end gap-1.5 sm:gap-2 max-w-4xl mx-auto">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-white/90 placeholder-white/20 resize-none outline-none focus:border-indigo-500/50 transition-colors"
              style={{ minHeight: '40px', maxHeight: '160px' }}
            />
            <MicrophoneButton
              isRecording={voiceInput.status === 'recording'}
              onClick={voiceInput.status === 'recording' ? voiceInput.stop : voiceInput.start}
              size={window.innerWidth < 640 ? 'sm' : 'md'}
              disabled={!voiceInput.supported}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white disabled:opacity-30 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          {voiceInput.status === 'recording' && (
            <p className="text-[10px] sm:text-xs text-red-400 mt-1 text-center animate-pulse">
              🎙️ Listening... speak now
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
