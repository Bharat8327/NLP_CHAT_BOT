import { useState, useRef, useCallback, useEffect } from 'react';
import useChatStore from '../store/chatStore';

/**
 * Custom hook for Text-to-Speech playback with queue, speed, volume,
 * voice selection, word-highlight sync, and auto-play preference.
 */
export default function useVoiceOutput() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100
  const [currentWord, setCurrentWord] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  
  const voiceSettings = useChatStore((s) => s.voiceSettings);
  const updateVoiceSettings = useChatStore((s) => s.updateVoiceSettings);
  const speed = voiceSettings.speed || 1;
  const volume = voiceSettings.volume || 1;
  const autoPlay = voiceSettings.autoPlay || false;

  const utteranceRef = useRef(null);
  const queueRef = useRef([]);
  const totalCharsRef = useRef(0);
  const spokenCharsRef = useRef(0);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis?.getVoices() || [];
      setVoices(v);
      if (v.length && !selectedVoice) {
        const english = v.find((x) => x.lang.startsWith('en'));
        setSelectedVoice(english?.voiceURI || v[0].voiceURI);
      }
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () =>
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      setIsSpeaking(false);
      setProgress(0);
      return;
    }

    const rawItem = queueRef.current.shift();
    let text = '';
    if (typeof rawItem === 'string') text = rawItem;
    else if (rawItem && typeof rawItem === 'object') text = rawItem.text || rawItem.content || '';
    else if (rawItem) text = String(rawItem);

    if (!text) {
      processQueue();
      return;
    }
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = speed;
    utter.volume = volume;

    let voice = voices.find((v) => v.voiceURI === selectedVoice);
    
    // Automatically fallback to matching language voice if current voice doesn't match
    const langPrefix = voiceSettings.language?.split('-')[0] || 'en';
    if (!voice || !voice.lang.startsWith(langPrefix)) {
      const matchLangVoice = voices.find((v) => v.lang.startsWith(langPrefix));
      if (matchLangVoice) voice = matchLangVoice;
    }

    if (voice) utter.voice = voice;

    totalCharsRef.current = text.length;
    spokenCharsRef.current = 0;

    utter.onboundary = (e) => {
      if (e.name === 'word') {
        spokenCharsRef.current = e.charIndex;
        setProgress(
          Math.round((e.charIndex / totalCharsRef.current) * 100)
        );
        setCurrentWord(text.slice(e.charIndex, e.charIndex + e.charLength));
      }
    };

    utter.onend = () => {
      setProgress(100);
      setCurrentWord('');
      utteranceRef.current = null;
      // Process next in queue
      processQueue();
    };

    utter.onerror = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
    };

    utteranceRef.current = utter;
    setIsSpeaking(true);
    setIsPaused(false);
    synth.speak(utter);
  }, [speed, volume, selectedVoice, voices, voiceSettings.language]);

  const speak = useCallback(
    (rawText) => {
      let text = '';
      if (typeof rawText === 'string') text = rawText;
      else if (rawText && typeof rawText === 'object') text = rawText.text || rawText.content || '';
      else if (rawText) text = String(rawText);

      if (!text || !window.speechSynthesis) return;
      queueRef.current.push(text);
      if (!isSpeaking) {
        processQueue();
      }
    },
    [isSpeaking, processQueue]
  );

  const pause = useCallback(() => {
    window.speechSynthesis?.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis?.resume();
    setIsPaused(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    queueRef.current = [];
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentWord('');
  }, []);

  const toggleAutoPlay = useCallback(() => {
    updateVoiceSettings({ autoPlay: !autoPlay });
  }, [autoPlay, updateVoiceSettings]);

  return {
    isSpeaking,
    isPaused,
    progress,
    currentWord,
    voices,
    selectedVoice,
    setSelectedVoice,
    speed,
    setSpeed: (v) => updateVoiceSettings({ speed: v }),
    volume,
    setVolume: (v) => updateVoiceSettings({ volume: v }),
    autoPlay,
    toggleAutoPlay,
    speak,
    pause,
    resume,
    stop: stopSpeaking,
  };
}
