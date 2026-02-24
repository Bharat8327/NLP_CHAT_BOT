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
      onSendText(text);
      setRecognizing(false);
    };

    rec.onerror = () => setRecognizing(false);
    rec.onend = () => setRecognizing(false);

    recognitionRef.current = rec;
    rec.start();
    setRecognizing(true);
  };

  // 🔊 Speak AI Response
  useEffect(() => {
    if (!lastBotMessage) return;
    speak(lastBotMessage);
  }, [lastBotMessage]);

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
