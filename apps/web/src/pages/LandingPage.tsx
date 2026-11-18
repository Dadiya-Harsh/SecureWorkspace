import React from 'react';
import { PageLayout } from '../components/common/PageLayout';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { MistakesSection } from '../components/landing/MistakesSection';
import { DarkViewerBanner } from '../components/landing/DarkViewerBanner';
import { LimitsCallout } from '../components/landing/LimitsCallout';
import { FaqSection } from '../components/landing/FaqSection';
import { BottomCtaBanner } from '../components/landing/BottomCtaBanner';

export const LandingPage: React.FC = () => {
  return (
    <PageLayout>
        <main>
          <HeroSection />
          <HowItWorks />
          <MistakesSection />
          <DarkViewerBanner />
          <LimitsCallout />
          <FaqSection />
          <BottomCtaBanner />
        </main>
    </PageLayout>
  );
};