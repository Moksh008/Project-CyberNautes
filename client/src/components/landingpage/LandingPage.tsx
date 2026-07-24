
import { LandingStyles } from './LandingStyles';
import { Navbar1 } from './Navbar';
import { Hero } from './Hero';
import { LogoCloud } from './LogoCloud';
import { Problem } from './Problem';
import { FeatureCards } from './FeatureCards';
import { Mission } from './Mission';
import { Features } from './Features';
import { CTA } from './CTA';
import { Footer } from './Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <LandingStyles />
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      <Navbar1 />
      <Hero />
      <LogoCloud />
      <FeatureCards />
      <Problem />
      <Mission />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
};


export default LandingPage;
