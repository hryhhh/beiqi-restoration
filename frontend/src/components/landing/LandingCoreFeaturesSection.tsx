import type { RefObject } from 'react';
import coreFeaturesBg from '@/assets/images/hexin.jpg';
import { coreFeatures } from './landingContent';

interface LandingCoreFeaturesSectionProps {
  sectionRef: RefObject<HTMLElement | null>;
}

export default function LandingCoreFeaturesSection({ sectionRef }: LandingCoreFeaturesSectionProps) {
  return (
    <section
      ref={sectionRef}
      className="py-20 px-6 bg-bg-warm"
      style={{
        backgroundImage:
          `linear-gradient(180deg, rgba(250,247,242,0.42) 0%, rgba(250,247,242,0.56) 45%, rgba(250,247,242,0.68) 100%), url(${coreFeaturesBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="animate-on-scroll text-2xl md:text-3xl font-bold text-center mb-12 tracking-wide" style={{ color: '#8B3A2F' }}>
          核心功能
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {coreFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`animate-on-scroll stagger-${index + 1} feature-card p-6 rounded-xl bg-bg-card border border-border-warm`}
            >
              <span className="feature-icon text-3xl block mb-4" style={{ color: '#8B3A2F' }}>
                {feature.icon}
              </span>
              <h3 className="text-base font-semibold mb-2 text-text-primary">{feature.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
