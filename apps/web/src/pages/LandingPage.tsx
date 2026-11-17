import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { MistakesSection } from '../components/landing/MistakesSection';
import { DarkViewerBanner } from '../components/landing/DarkViewerBanner';
import { LimitsCallout } from '../components/landing/LimitsCallout';
import { FaqSection } from '../components/landing/FaqSection';
import { BottomCtaBanner } from '../components/landing/BottomCtaBanner';
import { Footer } from '../components/common/Footer';
import { ScrollProgress } from '../components/common/ScrollProgress';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D]">
      <ScrollProgress />
      <div>
        <Navbar />
        <main>
          <HeroSection />
          <HowItWorks />
          <MistakesSection />
          <DarkViewerBanner />
          <LimitsCallout />
          <FaqSection />
          <BottomCtaBanner />
        </main>
      </div>
      <Footer />
    </div>
  );
};