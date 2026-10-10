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
 * Lightweight mathematical spatial artifact rendering a parametric wireframe
 * surface on an HTML5 canvas. Performs zero external bundle imports, automatically
 * pauses when scrolled off-screen via IntersectionObserver, and honors
 * prefers-reduced-motion with an instant static rendering.
 * Fully guarded for SSR and headless/JSDOM environments.
 */
export function SpatialKineticArtifact({
  className = '',
  height = 360,
}: {
  className?: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    // Intersection observer to pause rendering when offscreen
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
      canvas.width = (rect.width || 400) * dpr;
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
          : { width: 400, height };
      const w = rect.width || 400;
      const h = rect.height || height;

      if (typeof ctx.clearRect === 'function') {
        ctx.clearRect(0, 0, w, h);
      }

      // Draw subtle warm background grid lines
      ctx.strokeStyle = 'rgba(216, 212, 202, 0.4)';
      ctx.lineWidth = 1;

      // Draw parametric rings / concentric isometric planes
      const numLines = 24;
      const stepY = h / (numLines + 2);

      for (let i = 1; i <= numLines; i++) {
        const yBase = i * stepY;
        ctx.beginPath();

        const points = 32;
        const stepX = w / points;

        for (let j = 0; j <= points; j++) {
          const x = j * stepX;
          // Parametric wave deformation
          const wavePhase = (x / w) * Math.PI * 4 + (reducedMotion ? 0 : t);
          const distanceCenter = 1 - Math.abs((x - w / 2) / (w / 2));
          const waveAmplitude = Math.sin(wavePhase + i * 0.2) * 14 * distanceCenter;

          const y = yBase + waveAmplitude;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Highlight selected lines with brand ink
        if (i % 6 === 0) {
          ctx.strokeStyle = 'rgba(13, 13, 13, 0.65)';
          ctx.lineWidth = 1.25;
        } else {
          ctx.strokeStyle = 'rgba(216, 212, 202, 0.55)';
          ctx.lineWidth = 0.8;
        }

        ctx.stroke();
      }

      // Draw central focal geometric artifact
      const centerX = w * 0.75;
      const centerY = h * 0.5;
      const radius = Math.min(w, h) * 0.22;

      ctx.save();
      ctx.translate(centerX, centerY);
      if (!reducedMotion) {
        ctx.rotate(t * 0.15);
      }

      // Draw multifaceted isometric geometric ring
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const angle = (k * Math.PI * 2) / 6;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = '#0D0D0D';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner accent facet
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const angle = (k * Math.PI * 2) / 6 + Math.PI / 6;
        const px = Math.cos(angle) * (radius * 0.55);
        const py = Math.sin(angle) * (radius * 0.55);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = '#D8FF45';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      if (!reducedMotion && isVisible && typeof requestAnimationFrame === 'function') {
        t += 0.015;
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

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden border border-[#D8D4CA] bg-[#FAF8F4] select-none ${className}`}
      style={{ height }}
      aria-label="Interactive kinetic system sculpture"
      role="img"
    >
      <canvas ref={canvasRef} className="h-full w-full block" />
      <div className="absolute bottom-3 left-4 flex items-center gap-2 font-mono text-[10px] tracking-wider uppercase text-[#646059]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D8FF45] border border-[#0D0D0D]" />
        <span>Kinetic Spatial System · Interactive Canvas</span>
      </div>
    </div>
  );
}
