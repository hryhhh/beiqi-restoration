import type { RefObject } from 'react';
import comparisonSampleImg from '@/assets/images/show.jpg';
import { comparisonCase } from './landingContent';

interface LandingComparisonSectionProps {
  sectionRef: RefObject<HTMLElement | null>;
}

export default function LandingComparisonSection({ sectionRef }: LandingComparisonSectionProps) {
  return (
    <section ref={sectionRef} className="py-20 px-6 bg-bg-cream">
      <div className="max-w-5xl mx-auto">
        <div className="animate-on-scroll comparison-container h-72 md:h-[400px] flex items-center justify-center mb-8 group cursor-pointer">
          <img
            src={comparisonSampleImg}
            alt={comparisonCase.alt}
            className="comparison-preview-image"
          />
          <div className="comparison-preview-shade" />
          <div className="comparison-center-line" />
          <span className="comparison-chip comparison-chip-left">修复前</span>
          <span className="comparison-chip comparison-chip-right">修复后</span>
        </div>

        <div className="animate-on-scroll stagger-2 max-w-2xl">
          <h3 className="text-xl font-bold text-text-primary mb-3">{comparisonCase.title}</h3>
          <p className="text-text-secondary text-sm leading-[1.9]">{comparisonCase.description}</p>
        </div>
      </div>
    </section>
  );
}
