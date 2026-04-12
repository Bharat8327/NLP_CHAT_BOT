import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei';
import useChatStore from '../../store/chatStore';
import useChat from '../../hooks/useChat';
import useVoiceInput from '../../hooks/useVoiceInput';
import useVoiceOutput from '../../hooks/useVoiceOutput';
import MicrophoneButton from '../VoiceControls/MicrophoneButton';

/**
 * 3D Avatar head that reacts to speaking state.
 */
function AvatarHead({ isSpeaking = false }) {
  const meshRef = useRef();
  const eyeL = useRef();
  const eyeR = useRef();
  const mouthRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Breathing / idle bobbing
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 1.5) * 0.05;
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }

    // Blink every ~4s
    const blinkCycle = t % 4;
    const blinkScale = blinkCycle < 0.15 ? 0.1 : 1;
    if (eyeL.current) eyeL.current.scale.y = blinkScale;
    if (eyeR.current) eyeR.current.scale.y = blinkScale;

    // Mouth movement when speaking
    if (mouthRef.current) {
      if (isSpeaking) {
        mouthRef.current.scale.y = 0.5 + Math.abs(Math.sin(t * 8)) * 0.8;
        mouthRef.current.scale.x = 0.8 + Math.abs(Math.cos(t * 6)) * 0.3;
      } else {
        mouthRef.current.scale.y = 0.4;
        mouthRef.current.scale.x = 0.8;
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* Head */}
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh>
          <sphereGeometry args={[1.2, 64, 64]} />
          <MeshDistortMaterial
            color="#818cf8"
            distort={isSpeaking ? 0.15 : 0.05}
            speed={isSpeaking ? 4 : 1.5}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </Float>

      {/* Left Eye */}
      <mesh ref={eyeL} position={[-0.4, 0.25, 1.0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="#1e1b4b" emissive="#312e81" emissiveIntensity={0.5} />
      </mesh>

      {/* Right Eye */}
      <mesh ref={eyeR} position={[0.4, 0.25, 1.0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="#1e1b4b" emissive="#312e81" emissiveIntensity={0.5} />
      </mesh>

      {/* Eye glint L */}
      <mesh position={[-0.35, 0.3, 1.12]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>

      {/* Eye glint R */}
      <mesh position={[0.45, 0.3, 1.12]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.35, 1.05]}>
        <boxGeometry args={[0.4, 0.12, 0.1]} />
        <meshStandardMaterial
          color={isSpeaking ? '#f472b6' : '#6366f1'}
          emissive={isSpeaking ? '#ec4899' : '#4f46e5'}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Glow ring when speaking */}
      {isSpeaking && (
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[1.6, 0.03, 16, 64]} />
          <meshStandardMaterial
            color="#818cf8"
            emissive="#6366f1"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * Background particles
 */
function Particles() {
  const count = 50;
  const meshRef = useRef();

  const positions = useRef(
    new Float32Array(
      Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 10)
    )
  ).current;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#818cf8" size={0.03} transparent opacity={0.4} />
    </points>
  );
}

/**
 * Immersive Avatar UI — 3D character with lip-sync, chat overlay.
 */
export default function AvatarUI() {
  const { isTyping, lastBotMessage } = useChatStore();
  const messages = useChatStore((s) => s.getActiveMessages());
  const voiceSettings = useChatStore((s) => s.voiceSettings);

  const { sendMessage: sendChatMessage } = useChat();
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef(null);

  const voiceInput = useVoiceInput({
    language: voiceSettings.language,
    onResult: (text) => sendChatMessage(text, voiceSettings.language),
  });

  const voiceOutput = useVoiceOutput();

  // Auto speak
  useEffect(() => {
    if (lastBotMessage) {
      voiceOutput.speak(lastBotMessage);
    }
  }, [lastBotMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendChatMessage(inputValue, voiceSettings.language);
    setInputValue('');
  };

  const lastMessages = messages.slice(-6);

  return (
    <div className="flex h-full w-full overflow-hidden relative bg-gray-950">
      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-white/40">Loading avatar...</p>
              </div>
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0, 4], fov: 50 }}
            dpr={[1, 2]}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.3} />
            <pointLight position={[5, 5, 5]} intensity={0.8} color="#818cf8" />
            <pointLight position={[-5, -5, 5]} intensity={0.3} color="#f472b6" />
            <spotLight
              position={[0, 5, 3]}
              angle={0.3}
              penumbra={1}
              intensity={0.5}
              color="#e0e7ff"
            />

            <AvatarHead isSpeaking={voiceOutput.isSpeaking} />
            <Particles />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 1.8}
              minPolarAngle={Math.PI / 3}
            />
          </Canvas>
        </Suspense>

        {/* Status overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {voiceOutput.isSpeaking && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 backdrop-blur-md border border-indigo-500/20">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-xs text-indigo-300">Speaking...</span>
              <button
                onClick={voiceOutput.stop}
                className="text-xs text-white/30 hover:text-red-400 ml-1"
              >
                ✕
              </button>
            </div>
          )}
          {isTyping && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-white/40">Thinking...</span>
            </div>
          )}
        </div>

        {/* Mic button overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <MicrophoneButton
            isRecording={voiceInput.status === 'recording'}
            onClick={voiceInput.status === 'recording' ? voiceInput.stop : voiceInput.start}
            size="lg"
            disabled={!voiceInput.supported}
          />
          {voiceInput.status === 'recording' && (
            <p className="text-xs text-red-400 text-center mt-2 animate-pulse">Listening...</p>
          )}
        </div>
      </div>

      {/* ── Chat Panel (right side) ──────────── */}
      <div className="hidden md:flex w-80 bg-gray-900/60 backdrop-blur-xl border-l border-white/5 flex-col">
        <div className="p-3 border-b border-white/5">
          <h3 className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
            💬 Chat
          </h3>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin">
          {lastMessages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl px-3 py-2 text-xs ${
                msg.type === 'user'
                  ? 'bg-indigo-500/15 text-white/80 ml-4'
                  : msg.type === 'system'
                    ? 'bg-red-500/10 text-red-300'
                    : 'bg-white/5 text-white/70 mr-4'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className="text-white/20 mt-1">{msg.timestamp}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/5 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder-white/20 outline-none focus:border-indigo-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-3 py-2 rounded-lg bg-indigo-500 text-white text-xs disabled:opacity-30 hover:bg-indigo-400 transition-colors"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
