'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

/**
 * ReactBits-inspired living atmospheric background:
 * slow breathing radial wash + gently drifting warm light motes on parchment.
 */
export function LivingPaperBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Particle[] = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.12 - Math.random() * 0.18,
      radius: 1.2 + Math.random() * 2.2,
      alpha: 0.08 + Math.random() * 0.14,
    }));

    let rafId = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!prefersReduced) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }
        const isDark = document.documentElement.classList.contains('dark');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(242, 239, 230, ${p.alpha * 0.7})`
          : `rgba(7, 61, 53, ${p.alpha})`;
        ctx.fill();
      }
      if (!prefersReduced) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Slow breathing organic radial washes */}
      <div
        className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full blur-3xl dark:opacity-0"
        style={{
          background: 'radial-gradient(circle, rgba(7, 61, 53, 0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-[-15%] left-[-8%] h-[460px] w-[460px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(255, 142, 121, 0.10) 0%, transparent 70%)',
        }}
      />
      <canvas ref={canvasRef} className="h-full w-full opacity-80" />
    </div>
  );
}
