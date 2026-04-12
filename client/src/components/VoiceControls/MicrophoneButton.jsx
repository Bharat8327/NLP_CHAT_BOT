import { useState } from 'react';

/**
 * Animated microphone button with recording-state visuals.
 * Shows pulsing rings when recording, idle state otherwise.
 */
export default function MicrophoneButton({
  isRecording = false,
  onClick,
  size = 'md',
  disabled = false,
  className = '',
}) {
  const [pressed, setPressed] = useState(false);

  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Pulsing rings when recording */}
      {isRecording && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          <span
            className="absolute rounded-full bg-red-500/10"
            style={{
              width: size === 'xl' ? '160%' : '140%',
              height: size === 'xl' ? '160%' : '140%',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <span
            className="absolute rounded-full bg-red-500/5"
            style={{
              width: size === 'xl' ? '200%' : '180%',
              height: size === 'xl' ? '200%' : '180%',
              animation: 'pulse 2s ease-in-out infinite 0.5s',
            }}
          />
        </>
      )}

      <button
        onClick={onClick}
        disabled={disabled}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        className={`
          ${sizes[size]} relative z-10 rounded-full flex items-center justify-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-40 disabled:cursor-not-allowed
          ${
            isRecording
              ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 focus:ring-red-400 scale-110'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 focus:ring-indigo-400'
          }
          ${pressed ? 'scale-95' : ''}
        `}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          /* Stop icon (square) */
          <svg className={iconSizes[size]} viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          /* Microphone icon */
          <svg
            className={iconSizes[size]}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 10v2a7 7 0 01-14 0v-2"
            />
            <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
            <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
          </svg>
        )}
      </button>
    </div>
  );
}
