import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col relative overflow-x-hidden">  {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm sm:text-lg shadow-lg shadow-indigo-500/20">
            AI
          </div>
          <span className="font-bold text-lg sm:text-xl tracking-tight hidden sm:block">Antigravity NLP</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
          <Link to="/about" className="text-white/60 hover:text-white transition-colors">
            About
          </Link>
          <Link to="/login" className="text-white/60 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            to="/chat"
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs sm:text-sm transition-colors whitespace-nowrap"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto mt-12 mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Next-Gen AI Interface
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-slideUp" style={{ animationDelay: '100ms' }}>
          Voice-Powered AI <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Reimagined.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl leading-relaxed animate-slideUp" style={{ animationDelay: '200ms' }}>
          Experience the future of human-computer interaction with our multi-interface NLP Chatbot. Featuring real-time voice synthesis, multi-lingual intelligence, and 3D Avatar responses.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-slideUp" style={{ animationDelay: '300ms' }}>
          <Link
            to="/chat"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:shadow-xl hover:shadow-indigo-500/20 transition-all hover:-translate-y-1 w-full sm:w-auto"
          >
            Start Chatting For Free
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all w-full sm:w-auto"
          >
            View Source
          </a>
        </div>
      </main>

      {/* Feature Grid */}
      <div className="relative z-10 bg-gray-900/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white/90">Native Voice Input</h3>
              <p className="text-white/50 text-sm leading-relaxed">Communicate naturally with high-accuracy speech-to-text built directly into the browser. Includes live waveform visualization.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white/90">Multi-Lingual TTS</h3>
              <p className="text-white/50 text-sm leading-relaxed">Our AI automatically reads responses aloud with native accent detection, supporting English, Hindi, Spanish, French, and more.</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white/90">Four Bespoke UIs</h3>
              <p className="text-white/50 text-sm leading-relaxed">Switch seamlessly between a Classic Chat, Voice-First, Dashboard, or immersive 3D Avatar modes tailored to your device.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
