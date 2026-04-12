/**
 * TTS audio playback controls: play/pause, speed, volume, progress,
 * voice selector, and stop.
 */
export default function AudioPlayer({
  isSpeaking = false,
  isPaused = false,
  progress = 0,
  voices = [],
  selectedVoice = '',
  onSelectVoice,
  speed = 1,
  onSpeedChange,
  volume = 1,
  onVolumeChange,
  onPlay,
  onPause,
  onResume,
  onStop,
  className = '',
}) {
  return (
    <div
      className={`rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 ${className}`}
    >
      {/* Progress bar */}
      <div className="w-full h-1 bg-white/10 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2">
        {/* Play / Pause / Resume */}
        {!isSpeaking ? (
          <button
            onClick={onPlay}
            className="w-9 h-9 rounded-full bg-indigo-500 hover:bg-indigo-400 flex items-center justify-center text-white transition-colors"
            aria-label="Play"
          >
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center text-white transition-colors"
            aria-label="Resume"
          >
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onPause}
            className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-white transition-colors"
            aria-label="Pause"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </button>
        )}

        {/* Stop */}
        <button
          onClick={onStop}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          aria-label="Stop"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>

        {/* Speed control */}
        <div className="flex items-center gap-1 ml-2 px-2 py-1 rounded-lg bg-white/5">
          <span className="text-xs text-white/50">Speed</span>
          <select
            value={speed}
            onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
            className="bg-transparent text-white/80 text-xs border-none outline-none cursor-pointer"
          >
            <option value="0.5" className="bg-gray-800">0.5×</option>
            <option value="0.75" className="bg-gray-800">0.75×</option>
            <option value="1" className="bg-gray-800">1×</option>
            <option value="1.25" className="bg-gray-800">1.25×</option>
            <option value="1.5" className="bg-gray-800">1.5×</option>
            <option value="2" className="bg-gray-800">2×</option>
          </select>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5 ml-auto">
          <svg className="w-3.5 h-3.5 text-white/40" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5zm2 3.5a4 4 0 010 7m2.5-9.5a8 8 0 010 12" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
            className="w-16 h-1 accent-indigo-500 cursor-pointer"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Voice selector */}
      {voices.length > 1 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-white/40">Voice</span>
          <select
            value={selectedVoice}
            onChange={(e) => onSelectVoice?.(e.target.value)}
            className="flex-1 bg-white/5 text-white/70 text-xs border border-white/10 rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            {voices.slice(0, 15).map((v) => (
              <option key={v.voiceURI} value={v.voiceURI} className="bg-gray-800">
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
