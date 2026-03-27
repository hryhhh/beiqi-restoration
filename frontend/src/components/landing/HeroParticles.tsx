import { useEffect, useRef } from 'react';

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

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      fadeDir: number;
      trail: { x: number; y: number }[];

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = (Math.random() - 0.5) * 0.25;
        this.size = Math.random() * 1.5 + 0.8;
        this.opacity = Math.random() * 0.4 + 0.15;
        this.fadeDir = Math.random() > 0.5 ? 1 : -1;
        this.trail = [];
      }

      update(w: number, h: number) {
        this.opacity += this.fadeDir * 0.002;
        if (this.opacity > 0.55) this.fadeDir = -1;
        if (this.opacity < 0.08) this.fadeDir = 1;
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 18) this.trail.shift();
      }

      draw(ctx: CanvasRenderingContext2D) {
        // 光绘轨迹
        if (this.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(this.trail[0].x, this.trail[0].y);
          for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
          }
          ctx.strokeStyle = `rgba(201, 166, 107, ${this.opacity * 0.12})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
        // 发光晕
        const g = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 5,
        );
        g.addColorStop(0, `rgba(201, 166, 107, ${this.opacity * 0.7})`);
        g.addColorStop(0.3, `rgba(201, 166, 107, ${this.opacity * 0.25})`);
        g.addColorStop(1, 'rgba(201, 166, 107, 0)');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        // 核心亮点
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 135, ${this.opacity * 0.85})`;
        ctx.fill();
      }
    }

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
        () => new Particle(w, h),
      );
    };

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.update(w, h);
        p.draw(ctx);
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
