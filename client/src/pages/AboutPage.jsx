import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col relative">
      {/* Header */}
      <header className="px-6 py-6 max-w-4xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
            AI
          </div>
          <span className="font-bold tracking-tight">Antigravity NLP</span>
        </div>
        <Link to="/" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
          &larr; Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 gradient-text">
          About The Project
        </h1>

        <div className="space-y-8 text-white/70 leading-relaxed text-lg">
          <p>
            The Antigravity NLP Chatbot is a highly advanced, multi-interface web application designed to demonstrate the ultimate potential of Generative AI paired with deeply integrated Web APIs.
          </p>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-2xl font-semibold text-white/90 mb-4">Core Technology Stack</h2>
            <ul className="space-y-3 list-disc list-inside">
              <li><strong>Frontend:</strong> React 19, Vite, TailwindCSS v4, React-Three-Fiber, Zustand</li>
              <li><strong>Backend:</strong> Express 5.x, Node.js</li>
              <li><strong>AI Engine:</strong> Google Generative AI (Gemini 2.5 Flash) via Server-Sent Events (SSE)</li>
              <li><strong>Database:</strong> MongoDB via Mongoose</li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold text-white/90 pt-4">Why We Built This</h2>
          <p>
            Traditional chatbots rely on a rigid, text-only chat interface. Our goal was to break the mold by offering users the flexibility to communicate with AI in the format that best suits their current context.
          </p>
          <p>
            Whether you are on a desktop using the <strong className="text-indigo-400">Classic View</strong>, walking outside using the minimalist <strong className="text-pink-400">Voice-First View</strong>, or looking for an immersive experience with the <strong className="text-purple-400">3D Avatar</strong>, the context and state of your session follows you seamlessly.
          </p>

          <h2 className="text-2xl font-semibold text-white/90 pt-4">Voice Synthesis (TTS) and Recognition</h2>
          <p>
            We utilize native Browser Speech APIs for lightning-fast voice data transcription and synthesis. We implemented smart auto-detection capable of dynamically mapping AI responses to the correct regional accent and language, bridging the communication gap instantly.
          </p>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex justify-center">
          <Link
            to="/chat"
            className="px-8 py-4 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors"
          >
            Launch The Chatbot
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
