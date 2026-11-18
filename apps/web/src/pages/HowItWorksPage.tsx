import React from 'react';
import { PageLayout } from '../components/common/PageLayout';
import { WordHeadline } from '../components/common/WordHeadline';
import { Reveal } from '../components/common/Reveal';
import { DocDivider } from '../components/common/DocLayout';
import { OverviewFlow } from '../components/how/OverviewFlow';
import { ScrollTimeline, type TimelineStep } from '../components/how/ScrollTimeline';
import { CreateVaultDemo } from '../components/how/CreateVaultDemo';
import { PushDemo } from '../components/how/PushDemo';
import { UnlockDemo } from '../components/how/UnlockDemo';

const STEPS: TimelineStep[] = [
  {
    heading: '1. Create a vault',
    text: 'Pick a folder on your PC, set a master password, and save your 24-word recovery key. The app makes you type it back to prove you saved it.',
    demo: <CreateVaultDemo />,
  },
  {
    heading: '2. Push to your Google Drive',
    text: 'Files are encrypted on your PC before upload. Each push becomes a numbered version. Google stores encrypted files and never gets your password or key.',
    demo: <PushDemo />,
  },
  {
    heading: '3. Read it anywhere',
    text: 'Pull on another PC, or open the read-only web viewer: sign in with Google, enter your password, and your browser decrypts the file. Changes are made in the desktop app.',
    demo: <UnlockDemo />,
  },
];

export const HowItWorksPage: React.FC = () => {
  return (
    <PageLayout>
      <main className="max-w-[960px] mx-auto px-4 sm:px-6 pt-12 sm:pt-[52px] pb-16">
        <WordHeadline className="mb-3">How it works</WordHeadline>

        <Reveal as="p" delay={300} className="text-lg text-[#5A6662] max-w-[700px]">
          Three steps. No account with us and no server.
        </Reveal>

        <Reveal delay={450} className="mt-10 mb-16">
          <OverviewFlow />
        </Reveal>

        <ScrollTimeline steps={STEPS} />

        <div className="max-w-[700px] text-[15px] text-[#4A5A54] leading-relaxed">
          <section id="going-back" className="scroll-mt-24 space-y-2">
            <Reveal as="h2" className="text-[22px] sm:text-[28px] font-bold tracking-tight text-[#14201C]">
              Going back
            </Reveal>
            <Reveal as="p" delay={100}>
              Every push is a version you can return to. Before anything is overwritten, the app saves a local safety snapshot.
            </Reveal>
          </section>

          <DocDivider />

          <section className="pt-9 space-y-2">
            <Reveal as="h2" className="text-[22px] sm:text-[28px] font-bold tracking-tight text-[#14201C]">
              If you lose both
            </Reveal>
            <Reveal as="p" delay={100}>
              If you lose your password and your recovery key, nobody can open your files. That is the price of zero knowledge.
            </Reveal>
          </section>
        </div>
      </main>
    </PageLayout>
  );
};
