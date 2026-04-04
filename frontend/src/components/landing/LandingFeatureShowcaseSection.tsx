import type { RefObject } from 'react';
import { majorFeatures, minorFeatures } from './landingContent';

interface LandingFeatureShowcaseSectionProps {
  sectionRef: RefObject<HTMLElement | null>;
  minorSectionRef: RefObject<HTMLDivElement | null>;
}

export default function LandingFeatureShowcaseSection({
  sectionRef,
  minorSectionRef,
}: LandingFeatureShowcaseSectionProps) {
  return (
    <section ref={sectionRef} className="py-20 px-6 bg-bg-warm">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-7">
        {majorFeatures.map((feature, index) => (
          <div
            key={feature.title}
            className={`animate-on-scroll stagger-${index + 1} feature-card bg-bg-card rounded-2xl p-7 border border-border-warm flex flex-col min-h-[260px]`}
          >
            <div className="bg-bg-cream rounded-xl h-32 flex items-center justify-center mb-5">
              <span
                className="feature-icon text-4xl"
                style={{
                  background: 'linear-gradient(135deg, #C9A66B, #8B3A2F)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {feature.icon}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
            <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      <div ref={minorSectionRef} className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 mt-8">
        {minorFeatures.map((feature, index) => (
          <div
            key={feature.title}
            className={`animate-on-scroll stagger-${index + 1} feature-card bg-bg-card rounded-xl p-5 text-center border border-border-warm`}
          >
            <span className="feature-icon text-2xl block mb-2" style={{ color: '#A8864E' }}>
              {feature.icon}
            </span>
            <p className="text-sm font-medium text-text-primary">{feature.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
