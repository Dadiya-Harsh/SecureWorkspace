import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { DownloadBar } from '../components/landing/DownloadBar';
import { Footer } from '../components/common/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <div>
        <Navbar />
        <main>
          <HeroSection />
          <HowItWorks />
          <FeatureGrid />
          <DownloadBar />
        </main>
      </div>
      <Footer />
    </div>
  );
};
