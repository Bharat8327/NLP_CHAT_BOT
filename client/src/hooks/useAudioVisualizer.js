import { useRef, useCallback, useState } from 'react';

/**
 * Provides real-time audio frequency data from a mic stream
 * for canvas-based waveform/bar visualization.
 */
export default function useAudioVisualizer() {
  const [isActive, setIsActive] = useState(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const dataArrayRef = useRef(new Uint8Array(64));
  const rafRef = useRef(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      setIsActive(true);
    } catch (err) {
      console.warn('Audio visualizer: mic access denied', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current = null;
    setIsActive(false);
  }, []);

  const getFrequencyData = useCallback(() => {
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    }
    return dataArrayRef.current;
  }, []);

  const getWaveformData = useCallback(() => {
    if (analyserRef.current) {
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    }
    return dataArrayRef.current;
  }, []);

  return {
    isActive,
    start,
    stop,
    getFrequencyData,
    getWaveformData,
  };
}
