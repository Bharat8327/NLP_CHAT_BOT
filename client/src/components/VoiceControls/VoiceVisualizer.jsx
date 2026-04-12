import { useRef, useEffect, useCallback } from 'react';

/**
 * Canvas-based waveform/bars visualizer reacting to audio frequency data.
 * Accepts a `getFrequencyData` function or a static `data` array.
 */
export default function VoiceVisualizer({
  getFrequencyData,
  isActive = false,
  variant = 'bars', // bars | wave | circle
  width = 300,
  height = 80,
  barColor = '#818cf8',
  className = '',
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const data = getFrequencyData?.() || new Uint8Array(64);

    ctx.clearRect(0, 0, width, height);

    if (variant === 'bars') {
      const barCount = Math.min(data.length, 32);
      const barW = (width / barCount) * 0.7;
      const gap = (width / barCount) * 0.3;

      for (let i = 0; i < barCount; i++) {
        const val = isActive ? data[i] / 255 : 0.05 + Math.sin(Date.now() / 500 + i) * 0.03;
        const barH = Math.max(2, val * height * 0.9);
        const x = i * (barW + gap) + gap / 2;
        const y = (height - barH) / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barH);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, '#6366f1');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 2);
        ctx.fill();
      }
    } else if (variant === 'wave') {
      ctx.beginPath();
      ctx.strokeStyle = barColor;
      ctx.lineWidth = 2;
      const sliceWidth = width / data.length;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = isActive ? data[i] / 255 : 0.5;
        const y = v * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    } else if (variant === 'circle') {
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) * 0.6;
      const segments = Math.min(data.length, 32);

      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
        const val = isActive ? data[i] / 255 : 0.1;
        const r = radius + val * radius * 0.5;
        const x1 = cx + Math.cos(angle) * radius;
        const y1 = cy + Math.sin(angle) * radius;
        const x2 = cx + Math.cos(angle) * r;
        const y2 = cy + Math.sin(angle) * r;

        ctx.beginPath();
        ctx.strokeStyle = barColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [getFrequencyData, isActive, variant, width, height, barColor]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`${className}`}
    />
  );
}
