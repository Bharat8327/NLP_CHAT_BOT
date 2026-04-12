import { useState, useRef, useEffect, useMemo } from 'react';
import useChatStore from '../../store/chatStore';
import useChat from '../../hooks/useChat';
import useVoiceInput from '../../hooks/useVoiceInput';
import useVoiceOutput from '../../hooks/useVoiceOutput';
import MicrophoneButton from '../VoiceControls/MicrophoneButton';

/**
 * Dashboard/Analytics UI — chat + metrics side by side.
 */
export default function DashboardUI() {
  const {
    chats,
    activeChatId,
    setActiveChat,
    createChat,
    isTyping,
    lastBotMessage,
  } = useChatStore();
  const messages = useChatStore((s) => s.getActiveMessages());
  const voiceSettings = useChatStore((s) => s.voiceSettings);

  const { sendMessage: sendChatMessage } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // chat | metrics | sessions
  const chatEndRef = useRef(null);

  const voiceInput = useVoiceInput({
    language: voiceSettings.language,
    onResult: (text) => sendChatMessage(text, voiceSettings.language),
  });

  const voiceOutput = useVoiceOutput();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendChatMessage(inputValue, voiceSettings.language);
    setInputValue('');
  };

  // Compute metrics
  const metrics = useMemo(() => {
    const allChats = Object.values(chats);
    let totalMsgs = 0;
    let userMsgs = 0;
    let botMsgs = 0;
    const langs = new Set();

    allChats.forEach((c) => {
      c.messages.forEach((m) => {
        totalMsgs++;
        if (m.type === 'user') {
          userMsgs++;
          if (m.lang) langs.add(m.lang);
        }
        if (m.type === 'bot') botMsgs++;
      });
    });

    return {
      totalSessions: allChats.length,
      totalMessages: totalMsgs,
      userMessages: userMsgs,
      botMessages: botMsgs,
      languages: Array.from(langs),
      avgMsgsPerSession: allChats.length
        ? Math.round(totalMsgs / allChats.length)
        : 0,
    };
  }, [chats]);

  const exportConversation = () => {
    const data = {
      chatId: activeChatId,
      messages: messages.map((m) => ({
        role: m.type,
        content: m.content,
        timestamp: m.timestamp,
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${activeChatId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const MetricCard = ({ label, value, icon, color }) => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:bg-white/8 transition-colors">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
        style={{
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white/90">{value}</p>
        <p className="text-xs text-white/40">{label}</p>
      </div>
    </div>
  );

  // Simple bar chart component
  const MiniBarChart = ({ data, height = 80 }) => {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-indigo-500 to-purple-500 transition-all duration-500"
              style={{
                height: `${(d.value / max) * height * 0.85}px`,
                minHeight: '2px',
              }}
            />
            <span className="text-[9px] text-white/30">{d.label}</span>
          </div>
        ))}
      </div>
    );
  };

  const chatList = Object.values(chats).sort((a, b) =>
    b.id.localeCompare(a.id)
  );

  // Build per-session message count chart data
  const chartData = chatList.slice(0, 8).map((c) => ({
    label: c.title.slice(0, 4),
    value: c.messages.length,
  }));

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Left: Chat Panel ───────────────────── */}
      <div className="hidden md:flex flex-1 flex-col min-w-0 border-r border-white/5">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 bg-gray-900/30">
          {['chat', 'sessions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={exportConversation}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-white/40 hover:text-white/70 text-xs transition-colors"
            title="Export conversation"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>

        {activeTab === 'chat' ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.type === 'user'
                        ? 'bg-indigo-500/20 text-white/80'
                        : msg.type === 'system'
                          ? 'bg-red-500/10 text-red-300'
                          : 'bg-white/5 text-white/70'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs text-white/20 mt-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-1 px-3 py-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-indigo-500/50"
              />
              <MicrophoneButton
                isRecording={voiceInput.status === 'recording'}
                onClick={voiceInput.status === 'recording' ? voiceInput.stop : voiceInput.start}
                size="sm"
                disabled={!voiceInput.supported}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm disabled:opacity-30 hover:bg-indigo-400 transition-colors"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          /* Sessions tab */
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            <button
              onClick={() => { createChat(); setActiveTab('chat'); }}
              className="w-full px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-300 text-sm hover:bg-indigo-500/20 transition-colors mb-2"
            >
              + New Session
            </button>
            {chatList.map((chat) => (
              <div
                key={chat.id}
                onClick={() => { setActiveChat(chat.id); setActiveTab('chat'); }}
                className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm ${
                  activeChatId === chat.id
                    ? 'bg-indigo-500/15 border border-indigo-500/20 text-white/80'
                    : 'bg-white/3 text-white/50 hover:bg-white/5 border border-transparent'
                }`}
              >
                <p className="font-medium truncate">{chat.title}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {chat.messages.length} messages · {chat.timestamp}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Metrics Panel ───────────────── */}
      <div className="w-full md:w-80 lg:w-96 bg-gray-900/40 backdrop-blur-sm flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            📊 Analytics
          </h3>
        </div>

        <div className="p-4 space-y-3">
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Sessions" value={metrics.totalSessions} icon="💬" color="#818cf8" />
            <MetricCard label="Messages" value={metrics.totalMessages} icon="✉️" color="#a78bfa" />
            <MetricCard label="Your msgs" value={metrics.userMessages} icon="👤" color="#34d399" />
            <MetricCard label="AI replies" value={metrics.botMessages} icon="🤖" color="#f472b6" />
          </div>

          {/* Avg per session */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">Avg. messages/session</p>
            <p className="text-3xl font-bold text-white/90">
              {metrics.avgMsgsPerSession}
            </p>
          </div>

          {/* languages used */}
          {metrics.languages.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-2">Languages Used</p>
              <div className="flex flex-wrap gap-1.5">
                {metrics.languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bar chart */}
          {chartData.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-3">Messages per Session</p>
              <MiniBarChart data={chartData} height={70} />
            </div>
          )}

          {/* Voice quality info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40 mb-2">Voice Status</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Speech-to-Text</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  voiceInput.supported ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {voiceInput.supported ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Text-to-Speech</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                  {voiceOutput.voices.length} voices
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">TTS Playing</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  voiceOutput.isSpeaking ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-white/30'
                }`}>
                  {voiceOutput.isSpeaking ? 'Active' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
