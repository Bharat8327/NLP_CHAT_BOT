import { useEffect, useRef, useState } from 'react';

const langList = [
  { code: 'en-US', name: 'English' },
  { code: 'hi-IN', name: 'Hindi' },
];

export default function ChatWithVoice({ onSendText, lastBotMessage }) {
  const [recognizing, setRecognizing] = useState(false);
  const [lang, setLang] = useState('en-US');

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const lastSpokenRef = useRef(''); // Track last spoken message to avoid duplicates

  // 🎙️ Speech to Text
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return alert('Speech Recognition not supported');

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setRecognizing(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      // Send voice text directly — no setTimeout race condition
      if (text.trim()) {
        onSendText(text);
      }
      setRecognizing(false);
    };

    rec.onerror = () => {
      setRecognizing(false);
      recognitionRef.current = null;
    };
    
    rec.onend = () => {
      setRecognizing(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    rec.start();
    setRecognizing(true);
  };

  // 🔊 Speak AI Response
  useEffect(() => {
    if (!lastBotMessage || lastBotMessage === lastSpokenRef.current) return;
    lastSpokenRef.current = lastBotMessage;
    speak(lastBotMessage);
  }, [lastBotMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    synthRef.current.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    synthRef.current.speak(utter);
  };

  return (
    <div className="flex gap-1 items-center">
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="border rounded text-xs px-1 text-white bg-gray-700"
      >
        {langList.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>

      <button
        onClick={startListening}
        className={`px-2 py-1 rounded ${
          recognizing ? 'bg-green-600 text-white' : 'bg-gray-300'
        }`}
      >
        {recognizing ? '🎙️' : '🎤'}
      </button>
    </div>
  );
}
