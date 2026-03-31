import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  fadeDir: number;
  trail: { x: number; y: number }[];
}

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
    size: Math.random() * 1.5 + 0.8,
    opacity: Math.random() * 0.4 + 0.15,
    fadeDir: Math.random() > 0.5 ? 1 : -1,
    trail: [],
  };
}

function updateParticle(p: Particle, w: number, h: number) {
  p.opacity += p.fadeDir * 0.002;
  if (p.opacity > 0.55) p.fadeDir = -1;
  if (p.opacity < 0.08) p.fadeDir = 1;
  p.x += p.vx;
  p.y += p.vy;
  if (p.x < 0 || p.x > w) p.vx *= -1;
  if (p.y < 0 || p.y > h) p.vy *= -1;
  p.trail.push({ x: p.x, y: p.y });
  if (p.trail.length > 18) p.trail.shift();
}

function drawParticle(p: Particle, ctx: CanvasRenderingContext2D) {
  // 光绘轨迹
  if (p.trail.length > 2) {
    ctx.beginPath();
    ctx.moveTo(p.trail[0].x, p.trail[0].y);
    for (let i = 1; i < p.trail.length; i++) {
      ctx.lineTo(p.trail[i].x, p.trail[i].y);
    }
    ctx.strokeStyle = `rgba(201, 166, 107, ${p.opacity * 0.12})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  // 发光晕
  const g = ctx.createRadialGradient(
    p.x, p.y, 0,
    p.x, p.y, p.size * 5,
  );
  g.addColorStop(0, `rgba(201, 166, 107, ${p.opacity * 0.7})`);
  g.addColorStop(0.3, `rgba(201, 166, 107, ${p.opacity * 0.25})`);
  g.addColorStop(1, 'rgba(201, 166, 107, 0)');
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  // 核心亮点
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(212, 175, 135, ${p.opacity * 0.85})`;
  ctx.fill();
}

/**
 * AI 修复粒子动画（明亮版）
 * 暖金色发光粒子 + 柔和光绘线条，在浅色背景上优雅流动
 */
export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      resize();
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const count = Math.floor((w * h) / 30000);
      particles = Array.from(
        { length: Math.min(count, 35) },
        () => createParticle(w, h),
      );
    };

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        updateParticle(p, w, h);
        drawParticle(p, ctx);
      }
      animId = requestAnimationFrame(animate);
    };

    init();
    animate();
    window.addEventListener('resize', init);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-2"
    />
  );
}
