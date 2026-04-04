import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingAboutSection from '@/components/landing/LandingAboutSection';
import LandingComparisonSection from '@/components/landing/LandingComparisonSection';
import LandingCoreFeaturesSection from '@/components/landing/LandingCoreFeaturesSection';
import LandingCultureSection from '@/components/landing/LandingCultureSection';
import LandingFeatureShowcaseSection from '@/components/landing/LandingFeatureShowcaseSection';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingHero from '@/components/landing/LandingHero';
import LandingStatsSection from '@/components/landing/LandingStatsSection';
import Header from '@/components/layout/Header';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  const aboutRef = useScrollReveal<HTMLElement>();
  const statsRef = useScrollReveal<HTMLElement>();
  const featuresRef = useScrollReveal<HTMLElement>();
  const minorRef = useScrollReveal<HTMLDivElement>();
  const comparisonRef = useScrollReveal<HTMLElement>();
  const coreFeatRef = useScrollReveal<HTMLElement>();
  const cultureRef = useScrollReveal<HTMLElement>();

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-warm text-text-primary">
      <Header />
      <LandingHero
        scrollY={scrollY}
        onBrowseMurals={() => navigate('/murals')}
        onCreateProject={() => navigate('/projects')}
      />
      <LandingAboutSection sectionRef={aboutRef} />
      <LandingStatsSection sectionRef={statsRef} />
      <LandingFeatureShowcaseSection sectionRef={featuresRef} minorSectionRef={minorRef} />
      <LandingComparisonSection sectionRef={comparisonRef} />
      <LandingCoreFeaturesSection sectionRef={coreFeatRef} />
      <LandingCultureSection sectionRef={cultureRef} />
      <LandingFooter />
    </div>
  );
}
