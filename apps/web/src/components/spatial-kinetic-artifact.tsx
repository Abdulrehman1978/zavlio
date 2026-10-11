'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
  }
  return () => {};
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * Luminous mathematical spatial artifact rendering an interactive parametric
 * wave mesh and orbiting geometric ring on an HTML5 canvas.
 * Zero external bundle weight, automatically pauses when scrolled off-screen via
 * IntersectionObserver, and honors prefers-reduced-motion with an instant static rendering.
 */
export function SpatialKineticArtifact({
  className = '',
  height = 420,
}: {
  className?: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [isVisible, setIsVisible] = useState(true);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function') {
      const el = containerRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry?.isIntersecting ?? true);
        },
        { threshold: 0.1 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const resize = () => {
      if (typeof canvas.getBoundingClientRect !== 'function') return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min((typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1, 2);
      canvas.width = (rect.width || 480) * dpr;
      canvas.height = (rect.height || height) * dpr;
      if (typeof ctx.scale === 'function') {
        ctx.scale(dpr, dpr);
      }
    };

    resize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resize);
    }

    const render = () => {
      const rect =
        typeof canvas.getBoundingClientRect === 'function'
          ? canvas.getBoundingClientRect()
          : { width: 480, height };
      const w = rect.width || 480;
      const h = rect.height || height;

      if (typeof ctx.clearRect === 'function') {
        ctx.clearRect(0, 0, w, h);
      }

      // Draw subtle ambient glow in background
      const ambientGrad = ctx.createRadialGradient(
        w * 0.65,
        h * 0.45,
        10,
        w * 0.65,
        h * 0.45,
        w * 0.6,
      );
      ambientGrad.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
      ambientGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.04)');
      ambientGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw parametric wave mesh
      const numLines = 26;
      const stepY = h / (numLines + 2);
      const mouse = mouseRef.current;

      for (let i = 1; i <= numLines; i++) {
        const yBase = i * stepY;
        ctx.beginPath();

        const points = 36;
        const stepX = w / points;

        for (let j = 0; j <= points; j++) {
          const x = j * stepX;
          const wavePhase = (x / w) * Math.PI * 3.5 + (reducedMotion ? 0 : t * 0.8);
          const distanceCenter = 1 - Math.abs((x - w * 0.5) / (w * 0.5));
          let waveAmplitude = Math.sin(wavePhase + i * 0.22) * 16 * distanceCenter;

          // Mouse proximity influence
          if (mouse.active) {
            const dx = x - mouse.x;
            const dy = yBase - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140) {
              const force = (1 - dist / 140) * 18;
              waveAmplitude += Math.sin(dist * 0.08 - t * 2) * force;
            }
          }

          const y = yBase + waveAmplitude;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Color coding waves with luminous gradient hues
        if (i % 6 === 0) {
          const grad = ctx.createLinearGradient(0, yBase, w, yBase);
          grad.addColorStop(0, 'rgba(79, 70, 229, 0.85)');
          grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.9)');
          grad.addColorStop(1, 'rgba(14, 165, 233, 0.85)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.75;
        } else if (i % 3 === 0) {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
          ctx.lineWidth = 0.75;
        }

        ctx.stroke();
      }

      // Draw central orbital isometric artifact
      const centerX = w * 0.72;
      const centerY = h * 0.5;
      const radius = Math.min(w, h) * 0.24;

      ctx.save();
      ctx.translate(centerX, centerY);
      if (!reducedMotion) {
        ctx.rotate(t * 0.2);
      }

      // Outer hexagonal ring with luminous indigo stroke
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const angle = (k * Math.PI * 2) / 6;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing vertices
      for (let k = 0; k < 6; k++) {
        const angle = (k * Math.PI * 2) / 6;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#06B6D4';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Inner rotated hex facet
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const angle = (k * Math.PI * 2) / 6 + Math.PI / 6;
        const px = Math.cos(angle) * (radius * 0.58);
        const py = Math.sin(angle) * (radius * 0.58);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 1.75;
      ctx.stroke();

      // Center core point
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4F46E5';
      ctx.fill();

      ctx.restore();

      if (!reducedMotion && isVisible && typeof requestAnimationFrame === 'function') {
        t += 0.016;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', resize);
      }
      if (animationFrameId && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [height, isVisible, reducedMotion]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full rounded-3xl bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/30 border border-slate-200/80 shadow-[0_20px_50px_-15px_rgba(79,70,229,0.12)] p-6 sm:p-8 backdrop-blur-md overflow-hidden ${className}`}
      style={{ minHeight: height }}
      aria-label="Interactive Parametric Spatial Artifact"
    >
      {/* Top telemetry status bar */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-4 text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-slate-800">SPATIAL TELEMETRY · ENGINE V2</span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
          60 FPS · DYNAMIC CANVAS
        </span>
      </div>

      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair transition-opacity duration-300"
        style={{ height: height - 100 }}
      />

      {/* Bottom parameters bar */}
      <div className="flex items-center justify-between border-t border-slate-200/70 pt-3 text-[10px] font-mono text-slate-400">
        <span>PARAMETRIC WAVE HARMONICS</span>
        <span className="text-indigo-600 font-medium">HOVER TO INTERACT</span>
      </div>
    </div>
  );
}
