import type { RefObject } from 'react';
import { aboutDescription } from './landingContent';

interface LandingAboutSectionProps {
  sectionRef: RefObject<HTMLElement | null>;
}

export default function LandingAboutSection({ sectionRef }: LandingAboutSectionProps) {
  return (
    <section ref={sectionRef} className="py-20 px-6 bg-bg-warm">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="animate-on-scroll text-2xl md:text-3xl font-bold mb-6 tracking-wide" style={{ color: '#8B3A2F' }}>
          关于北齐壁画系统
        </h2>
        <p className="animate-on-scroll stagger-1 text-text-secondary leading-loose text-sm md:text-base">
          {aboutDescription}
        </p>
      </div>
    </section>
  );
}
