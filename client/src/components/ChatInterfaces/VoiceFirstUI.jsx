import { useState, useRef, useEffect } from 'react';
import useChatStore from '../../store/chatStore';
import useChat from '../../hooks/useChat';
import useVoiceInput from '../../hooks/useVoiceInput';
import useVoiceOutput from '../../hooks/useVoiceOutput';
import useAudioVisualizer from '../../hooks/useAudioVisualizer';
import MicrophoneButton from '../VoiceControls/MicrophoneButton';
import VoiceVisualizer from '../VoiceControls/VoiceVisualizer';
import TranscriptionDisplay from '../VoiceControls/TranscriptionDisplay';

/**
 * Voice-First UI — mobile-optimized, centered mic, minimal text.
 */
export default function VoiceFirstUI() {
  const { isTyping, lastBotMessage } = useChatStore();
  const messages = useChatStore((s) => s.getActiveMessages());
  const voiceSettings = useChatStore((s) => s.voiceSettings);
  const updateVoiceSettings = useChatStore((s) => s.updateVoiceSettings);

  const { sendMessage: sendChatMessage } = useChat();
  const [showHistory, setShowHistory] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  const voiceInput = useVoiceInput({
    language: voiceSettings.language,
    onResult: (text) => {
      sendChatMessage(text, voiceSettings.language);
    },
  });

  const voiceOutput = useVoiceOutput();
  const visualizer = useAudioVisualizer();
  const lastSpokenId = useRef(lastBotMessage?.id);

  // Auto-play TTS for voice-first mode
  useEffect(() => {
    if (lastBotMessage && lastBotMessage.id !== lastSpokenId.current) {
      lastSpokenId.current = lastBotMessage.id;
      const textToSpeak = typeof lastBotMessage === 'string' ? lastBotMessage : lastBotMessage.text;
      if (textToSpeak) voiceOutput.speak(textToSpeak);
    }
  }, [lastBotMessage, voiceOutput]);

  // Manage visualizer with recording state
  useEffect(() => {
    if (voiceInput.status === 'recording') {
      visualizer.start();
    } else {
      visualizer.stop();
    }
  }, [voiceInput.status]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTextSend = () => {
    if (!inputText.trim()) return;
    sendChatMessage(inputText, voiceSettings.language);
    setInputText('');
  };

  const lastBotMsg = [...messages].reverse().find(
    (m) => m.type === 'bot' || m.type === 'bot-temp'
  );
  const lastUserMsg = [...messages].reverse().find((m) => m.type === 'user');

  const LANGUAGES = [
    { code: 'en-US', label: '🇺🇸 EN' },
    { code: 'hi-IN', label: '🇮🇳 HI' },
    { code: 'es-ES', label: '🇪🇸 ES' },
    { code: 'fr-FR', label: '🇫🇷 FR' },
    { code: 'de-DE', label: '🇩🇪 DE' },
    { code: 'zh-CN', label: '🇨🇳 ZH' },
    { code: 'ja-JP', label: '🇯🇵 JA' },
    { code: 'ar-SA', label: '🇸🇦 AR' },
    { code: 'pt-BR', label: '🇧🇷 PT' },
    { code: 'ko-KR', label: '🇰🇷 KO' },
    { code: 'ru-RU', label: '🇷🇺 RU' },
  ];

  return (
    <div className="flex flex-col h-full w-full items-center justify-center relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: voiceInput.status === 'recording'
            ? 'radial-gradient(circle at 50% 60%, rgba(239,68,68,0.08) 0%, transparent 50%)'
            : 'radial-gradient(circle at 50% 60%, rgba(99,102,241,0.06) 0%, transparent 50%)',
          transition: 'background 1s ease',
        }}
      />

      {/* Top bar — language + history toggle */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20">
        <select
          value={voiceSettings.language}
          onChange={(e) => updateVoiceSettings({ language: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 outline-none cursor-pointer"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-gray-900">
              {l.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 hover:text-white/80 text-xs transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 max-w-md w-full z-10">
        {/* AI Response bubble */}
        {lastBotMsg && !showHistory && (
          <div className="w-full max-h-48 overflow-y-auto rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-4 animate-fadeIn">
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
              {lastBotMsg.content}
            </p>
            {voiceOutput.isSpeaking && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-indigo-400">🔊 Speaking...</span>
                <button
                  onClick={voiceOutput.stop}
                  className="text-xs text-white/30 hover:text-red-400"
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 px-6 py-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-white/40">Processing...</span>
            </div>
          </div>
        )}

        {/* Waveform visualizer */}
        <VoiceVisualizer
          getFrequencyData={visualizer.getFrequencyData}
          isActive={voiceInput.status === 'recording'}
          variant="bars"
          width={280}
          height={60}
          barColor="#818cf8"
        />

        {/* THE MIC BUTTON */}
        <MicrophoneButton
          isRecording={voiceInput.status === 'recording'}
          onClick={voiceInput.status === 'recording' ? voiceInput.stop : voiceInput.start}
          size="xl"
          disabled={!voiceInput.supported}
        />

        {/* Transcription display */}
        <TranscriptionDisplay
          transcript={voiceInput.transcript}
          interimTranscript={voiceInput.interimTranscript}
          confidence={voiceInput.confidence}
          isRecording={voiceInput.status === 'recording'}
          language={voiceSettings.language}
          className="w-full"
        />

        {/* User's last message */}
        {lastUserMsg && !showHistory && (
          <div className="w-full text-center animate-fadeIn">
            <p className="text-xs text-white/30 mb-1">You said:</p>
            <p className="text-sm text-white/60 italic">"{lastUserMsg.content}"</p>
          </div>
        )}

        {/* Quick text input fallback */}
        <div className="w-full flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
            placeholder="Or type here..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={handleTextSend}
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 text-sm disabled:opacity-30 hover:bg-indigo-500/30 transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* History panel (slide-up) */}
      {showHistory && (
        <div className="absolute inset-x-0 bottom-0 top-14 bg-gray-950/95 backdrop-blur-xl z-30 overflow-y-auto px-4 py-4 animate-slideUp">
          <div className="max-w-md mx-auto space-y-3">
            <h3 className="text-sm font-semibold text-white/60 mb-3">Conversation History</h3>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                    msg.type === 'user'
                      ? 'bg-indigo-500/20 text-white/80'
                      : msg.type === 'system'
                        ? 'bg-red-500/10 text-red-300'
                        : 'bg-white/5 text-white/70'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-white/20 mt-1">{msg.timestamp}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* Error display */}
      {voiceInput.error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-xs text-red-400 text-center z-20">
          {voiceInput.error}
        </div>
      )}
    </div>
  );
}
