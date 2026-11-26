import React from 'react';
import { PageLayout } from '../components/common/PageLayout';
import { HowItWorksScrollScene } from '../components/how/HowItWorksScrollScene';
import { HowItWorksTimeline } from '../components/how/HowItWorksTimeline';

export const HowItWorksPage: React.FC = () => {
  return (
    <PageLayout>
      <main className="overflow-x-clip">
        {/* Top Header */}
        <section
          className="pt-16 sm:pt-24 pb-6 px-4 sm:px-6"
          data-a="How it works"
          data-b="Three steps. No account, no server."
        >
          <div className="max-w-[1100px] mx-auto">
            <h1 className="text-[clamp(36px,5.4vw,60px)] font-extrabold tracking-tight text-[#14201C] leading-[1.05]">
              How it works
            </h1>
            <p className="text-[#4A5A54] text-lg sm:text-[19px] mt-2.5 max-w-[620px]">
              Three steps. No account with us and no server. Scroll to follow one file.
            </p>
          </div>
        </section>

        {/* 3D Pinned Scroll Scene (300vh) */}
        <HowItWorksScrollScene />

        {/* Interactive Steps Timeline */}
        <HowItWorksTimeline />
      </main>
    </PageLayout>
  );
};
