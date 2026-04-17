import { lazy, Suspense } from 'react';
import useChatStore from '../store/chatStore';
import UISelector from '../components/UISelector';
import UserProfile from '../components/UserProfile';
import ClassicChatUI from '../components/ChatInterfaces/ClassicChatUI';
import VoiceFirstUI from '../components/ChatInterfaces/VoiceFirstUI';
import DashboardUI from '../components/ChatInterfaces/DashboardUI';

// Lazy load the heavy Avatar UI
const AvatarUI = lazy(() =>
  import('../components/ChatInterfaces/AvatarUI')
);

const LoadingSpinner = () => (
  <div className="h-full w-full flex items-center justify-center bg-gray-950">
    <div className="flex flex-col items-center gap-4 animate-fadeIn">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-indigo-500/30 rounded-full" />
        <div className="absolute inset-0 w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm text-white/30 font-medium">Loading interface...</p>
    </div>
  </div>
);

const HomePage = () => {
  const uiMode = useChatStore((s) => s.uiMode);

  const renderUI = () => {
    switch (uiMode) {
      case 'voice':
        return <VoiceFirstUI />;
      case 'dashboard':
        return <DashboardUI />;
      case 'avatar':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AvatarUI />
          </Suspense>
        );
      case 'classic':
      default:
        return <ClassicChatUI />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      {/* Top bar */}
      <header className="h-14 flex items-center justify-between px-3 sm:px-4 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold gradient-text tracking-tight hidden sm:block">
            NLP AI Assistant
          </h1>
          <h1 className="text-lg font-bold gradient-text tracking-tight sm:hidden">
            AI
          </h1>
          <span className="hidden lg:inline-flex px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold uppercase tracking-wider">
            Pro
          </span>
        </div>

        <UISelector />

        <UserProfile />
      </header>

      {/* Active UI */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {renderUI()}
      </main>
    </div>
  );
};

export default HomePage;
