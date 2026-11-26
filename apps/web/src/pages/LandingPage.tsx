import React from 'react';
import { PageLayout } from '../components/common/PageLayout';
import { HeroInteractive } from '../components/landing/HeroInteractive';
import { SealScrollScene } from '../components/landing/SealScrollScene';
import { KeyLens } from '../components/common/KeyLens';
import { UnlockInteractive } from '../components/landing/UnlockInteractive';
import { VersionsScrollScene } from '../components/landing/VersionsScrollScene';
import { RecoveryWordsSection } from '../components/landing/RecoveryWordsSection';
import { LimitsCallout } from '../components/landing/LimitsCallout';
import { FaqSection } from '../components/landing/FaqSection';
import { BottomCtaBanner } from '../components/landing/BottomCtaBanner';

export const LandingPage: React.FC = () => {
  return (
    <PageLayout>
      <main className="overflow-x-clip">
        {/* 1. Hero with 3D draggable floating files */}
        <HeroInteractive />

        {/* 2. Pinned 3D Seal Scene (420vh) */}
        <SealScrollScene />

        {/* 3. KeyLens Band */}
        <section
          className="py-14 sm:py-20 px-4 sm:px-6"
          data-a="What Google sees"
          data-b="Move the key over the files."
        >
          <div className="max-w-[1180px] mx-auto">
            <KeyLens
              heading="Google stores sealed boxes. Only your key reads them."
              lead="Move your cursor (or tap) over the folder. The key shows what’s inside. To anyone else, every file is the same random-looking box."
            />
          </div>
        </section>

        {/* 4. Unlock in browser with demo password */}
        <UnlockInteractive />

        {/* 5. Pinned 3D Versions Scene (260vh) */}
        <VersionsScrollScene />

        {/* 6. 24 Recovery Words */}
        <RecoveryWordsSection />

        {/* 7. Preserved Live Site Sections: Honest Limits, FAQ, Download */}
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 space-y-16">
          <LimitsCallout />
          <FaqSection />
          <BottomCtaBanner />
        </div>
      </main>
    </PageLayout>
  );
};
