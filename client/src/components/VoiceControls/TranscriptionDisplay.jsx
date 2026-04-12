/**
 * Displays real-time interim transcription with typing animation,
 * confidence indicator, and language badge.
 */
export default function TranscriptionDisplay({
  transcript = '',
  interimTranscript = '',
  confidence = 0,
  isRecording = false,
  language = 'en-US',
  className = '',
}) {
  if (!isRecording && !transcript && !interimTranscript) return null;

  const langNames = {
    'en-US': 'English',
    'en-GB': 'English (UK)',
    'hi-IN': 'Hindi',
    'es-ES': 'Spanish',
    'fr-FR': 'French',
    'de-DE': 'German',
    'zh-CN': 'Chinese',
    'ja-JP': 'Japanese',
    'ar-SA': 'Arabic',
    'pt-BR': 'Portuguese',
    'ko-KR': 'Korean',
    'ru-RU': 'Russian',
  };

  return (
    <div
      className={`rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-4 transition-all duration-300 ${className}`}
    >
      {/* Language badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
          {langNames[language] || language}
        </span>

        {isRecording && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            Listening...
          </span>
        )}
      </div>

      {/* Transcription text */}
      <div className="min-h-[1.5rem]">
        {transcript && (
          <p className="text-white/90 text-sm font-medium animate-fadeIn">
            {transcript}
          </p>
        )}
        {interimTranscript && (
          <p className="text-white/50 text-sm italic animate-fadeIn">
            {interimTranscript}
            <span className="inline-block w-0.5 h-4 bg-white/50 ml-0.5 animate-blink" />
          </p>
        )}
        {isRecording && !transcript && !interimTranscript && (
          <p className="text-white/30 text-sm italic">
            Speak now...
            <span className="inline-block w-0.5 h-4 bg-white/30 ml-0.5 animate-blink" />
          </p>
        )}
      </div>

      {/* Confidence bar */}
      {confidence > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-white/40">Confidence</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${confidence}%`,
                background:
                  confidence > 80
                    ? 'linear-gradient(90deg, #34d399, #10b981)'
                    : confidence > 50
                      ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                      : 'linear-gradient(90deg, #f87171, #ef4444)',
              }}
            />
          </div>
          <span className="text-xs text-white/60 font-mono">{confidence}%</span>
        </div>
      )}
    </div>
  );
}
