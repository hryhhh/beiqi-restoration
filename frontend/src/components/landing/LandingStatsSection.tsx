import type { RefObject } from 'react';
import CountUpBlock from '@/components/landing/CountUpBlock';
import { stats, statsCaption } from './landingContent';

interface LandingStatsSectionProps {
  sectionRef: RefObject<HTMLElement | null>;
}

export default function LandingStatsSection({ sectionRef }: LandingStatsSectionProps) {
  return (
    <section ref={sectionRef} className="py-16 px-6 bg-bg-cream">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
        {stats.map((item, index) => (
          <CountUpBlock
            key={item.label}
            target={item.target}
            label={item.label}
            duration={item.duration}
            suffix={item.suffix}
            icon={item.icon}
            className={`animate-on-scroll stagger-${index + 1}`}
          />
        ))}
      </div>
      <p className="animate-on-scroll stagger-4 text-center text-xs mt-8" style={{ color: '#A89888' }}>
        {statsCaption}
      </p>
    </section>
  );
}
