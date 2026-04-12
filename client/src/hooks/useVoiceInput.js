import { useState, useRef, useCallback, useEffect } from 'react';

const SUPPORTED =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

/**
 * Custom hook for microphone-based speech-to-text.
 * States: idle → recording → processing → done
 */
export default function useVoiceInput({ language = 'en-US', onResult } = {}) {
  const [status, setStatus] = useState('idle'); // idle | recording | processing
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  const [supported] = useState(!!SUPPORTED);

  const recognitionRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const dataArrayRef = useRef(new Uint8Array(64));

  // Create analyser for waveform visualization
  const setupAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch {
      // If mic access denied, we'll still work without visualizer
    }
  }, []);

  const teardownAnalyser = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
  }, []);

  const start = useCallback(() => {
    if (!SUPPORTED) {
      setError('Speech Recognition is not supported in this browser.');
      return;
    }

    // If already recording, stop
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = language;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setStatus('recording');
      setupAnalyser();
    };

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
          setConfidence(Math.round(result[0].confidence * 100));
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        setTranscript(final);
        setInterimTranscript('');
        onResult?.(final);
      } else {
        setInterimTranscript(interim);
      }
    };

    rec.onerror = (e) => {
      if (e.error !== 'aborted') {
        setError(`Speech error: ${e.error}`);
      }
      setStatus('idle');
      teardownAnalyser();
      recognitionRef.current = null;
    };

    rec.onend = () => {
      setStatus('idle');
      teardownAnalyser();
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    rec.start();
  }, [language, onResult, setupAnalyser, teardownAnalyser]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus('idle');
    teardownAnalyser();
  }, [teardownAnalyser]);

  // Get frequency data for visualization
  const getFrequencyData = useCallback(() => {
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    }
    return dataArrayRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      teardownAnalyser();
    };
  }, [teardownAnalyser]);

  return {
    status,
    transcript,
    interimTranscript,
    confidence,
    error,
    supported,
    start,
    stop,
    getFrequencyData,
  };
}
