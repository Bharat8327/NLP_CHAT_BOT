import useChatStore from '../store/chatStore';

const UI_MODES = [
  {
    id: 'classic',
    label: 'Classic',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    description: 'Full chat with sidebar',
  },
  {
    id: 'voice',
    label: 'Voice',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
      </svg>
    ),
    description: 'Voice-first interface',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    description: 'Analytics & metrics',
  },
  {
    id: 'avatar',
    label: 'Avatar',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: '3D AI avatar',
  },
];

export default function UISelector({ className = '' }) {
  const uiMode = useChatStore((s) => s.uiMode);
  const setUIMode = useChatStore((s) => s.setUIMode);

  return (
    <div className={`flex items-center gap-1 p-1 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 ${className}`}>
      {UI_MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setUIMode(mode.id)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
            transition-all duration-300 ease-out
            ${
              uiMode === mode.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }
          `}
          title={mode.description}
          aria-label={`Switch to ${mode.label} UI`}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
