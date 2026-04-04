import { ArrowDownOutlined } from '@ant-design/icons';
import HeroParticles from '@/components/landing/HeroParticles';
import heroImg from '@/assets/images/hero.jpg';

interface LandingHeroProps {
  scrollY: number;
  onBrowseMurals: () => void;
  onCreateProject: () => void;
}

export default function LandingHero({
  scrollY,
  onBrowseMurals,
  onCreateProject,
}: LandingHeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div
        className="absolute inset-0 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url(${heroImg})`,
          transform: `translateY(${scrollY * 0.3}px) scale(1.08)`,
          filter: 'brightness(0.55) saturate(0.8) blur(1px)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(42,33,24,0.45) 0%, rgba(42,33,24,0.3) 60%, rgba(42,33,24,0.5) 100%)',
        }}
      />

      <HeroParticles />

      <div className="relative z-10 text-center px-6 max-w-3xl py-20">
        <h1
          className="text-4xl md:text-5xl lg:text-[72px] font-bold mb-5 tracking-[0.15em] leading-tight"
          style={{
            color: '#C9A66B',
            textShadow: '0 2px 20px rgba(201,166,107,0.3), 0 0 60px rgba(201,166,107,0.1)',
            animation: 'heroFadeUp 1s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          守护北齐千年壁画
        </h1>
        <p
          className="text-base md:text-lg mb-2 font-medium"
          style={{
            color: 'rgba(255,255,255,0.85)',
            animation: 'heroFadeIn 0.7s ease both',
            animationDelay: '0.4s',
          }}
        >
          太原北齐壁画数字化修复管理平台
        </p>
        <p
          className="text-sm mb-12 font-medium tracking-widest"
          style={{
            color: '#D4AF87',
            animation: 'heroFadeIn 0.7s ease both, goldGlow 3.5s ease-in-out infinite',
            animationDelay: '0.7s, 1.4s',
          }}
        >
          以文化之光，守千年之宝
        </p>
        <div
          className="flex gap-5 justify-center flex-wrap"
          style={{ animation: 'heroFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '1s' }}
        >
          <button className="hero-btn-primary" onClick={onBrowseMurals}>
            进入壁画库
          </button>
          <button className="hero-btn-ghost" onClick={onCreateProject}>
            新建修复项目
          </button>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        style={{
          animation: 'heroFadeIn 0.5s ease both, arrowBreathe 2.5s ease-in-out infinite',
          animationDelay: '1.8s, 2.3s',
        }}
      >
        <ArrowDownOutlined style={{ fontSize: 20, color: '#C9A66B' }} />
      </div>
    </section>
  );
}
