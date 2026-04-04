import type { RefObject } from 'react';
import { cultureParagraphs, trustBadges } from './landingContent';

interface LandingCultureSectionProps {
  sectionRef: RefObject<HTMLElement | null>;
}

export default function LandingCultureSection({ sectionRef }: LandingCultureSectionProps) {
  return (
    <section ref={sectionRef} className="py-20 px-6 bg-bg-cream">
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="animate-on-scroll text-2xl md:text-3xl font-bold mb-6 tracking-[0.2em]"
          style={{ color: '#C9A66B', textShadow: '0 0 20px rgba(201,166,107,0.15)' }}
        >
          千载古韵 · 守望传承
        </h2>
        <p className="animate-on-scroll stagger-1 text-text-secondary leading-loose text-sm max-w-2xl mx-auto mb-3">
          {cultureParagraphs[0]}
        </p>
        <p className="animate-on-scroll stagger-2 text-text-secondary leading-loose text-sm max-w-2xl mx-auto mb-14">
          {cultureParagraphs[1]}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {trustBadges.map((badge, index) => (
            <div key={badge.label} className={`animate-on-scroll stagger-${index + 1} flex flex-col items-center gap-3`}>
              <div className="trust-badge">{badge.icon}</div>
              <span className="text-sm font-medium text-text-primary">{badge.label}</span>
              <span className="text-xs text-text-light">{badge.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
