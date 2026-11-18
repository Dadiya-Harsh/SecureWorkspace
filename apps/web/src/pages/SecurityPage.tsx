import React, { type ReactNode } from 'react';
import { PageLayout } from '../components/common/PageLayout';
import { WordHeadline } from '../components/common/WordHeadline';
import { Reveal } from '../components/common/Reveal';
import { KeysDiagram } from '../components/security/KeysDiagram';
import { NoServerDiagram } from '../components/security/NoServerDiagram';

const Band: React.FC<{ white?: boolean; id?: string; children: ReactNode }> = ({
  white = false,
  id,
  children,
}) => (
  <section id={id} className={`py-14 sm:py-[72px] scroll-mt-24 ${white ? 'bg-white' : ''}`}>
    <div className="max-w-[960px] mx-auto px-4 sm:px-6">{children}</div>
  </section>
);

const H2: React.FC<{ children: ReactNode }> = ({ children }) => (
  <Reveal as="h2" className="text-[22px] sm:text-[28px] font-bold tracking-tight text-[#14201C] mb-2.5">
    {children}
  </Reveal>
);

const P = 'text-[15px] text-[#4A5A54] leading-relaxed max-w-[700px]';

const CAN_SEE = ['File sizes', 'Timing', 'Your account', 'A folder called SecureWorkspace'];
const CANNOT_SEE = ['File contents', 'File names', 'Folders', 'Your password', 'Your keys'];
const LIMITS = [
  'Opened files are plaintext on your screen and in memory. Malware on your device can read them.',
  "Chrome's PDF viewer has its own Download and Print buttons.",
  'This is beta software and has not had an independent security review.',
];

/** Card listing what Google can / cannot see; items slide in from the card's side, staggered. */
const Pane: React.FC<{
  tone: 'no' | 'yes';
  title: string;
  items: string[];
  from: 'left' | 'right';
  mark: string;
}> = ({ tone, title, items, from, mark }) => {
  const yes = tone === 'yes';
  return (
    <div
      className={`rounded-[14px] border px-[22px] py-5 ${
        yes ? 'bg-[#EEF6F0] border-[#BFD9C8]' : 'bg-[#FBF4E1] border-[#EBD9A6]'
      }`}
    >
      <h3 className={`text-[15px] font-bold mb-1.5 ${yes ? 'text-[#0B4F40]' : 'text-[#5F4205]'}`}>
        {title}
      </h3>
      <ul className="list-none m-0 p-0">
        {items.map((item, i) => (
          <Reveal
            as="li"
            key={item}
            from={from}
            delay={i * 80}
            className="flex items-center gap-2.5 py-[11px] border-t border-[#14201C]/10 first:border-t-0 text-[15px] text-[#14201C]"
          >
            <i
              aria-hidden="true"
              className={`not-italic font-bold w-5 shrink-0 ${yes ? 'text-[#137333]' : 'text-[#8A6508]'}`}
            >
              {mark}
            </i>
            {item}
          </Reveal>
        ))}
      </ul>
    </div>
  );
};

export const SecurityPage: React.FC = () => {
  return (
    <PageLayout>
      <main>
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 pt-12 sm:pt-[52px] pb-12 sm:pb-14">
          <WordHeadline className="mb-3">Security model</WordHeadline>
          <Reveal as="p" delay={300} className="text-lg text-[#5A6662] max-w-[700px]">
            What is protected, what is not, and what you are trusting.
          </Reveal>
        </div>

        {/* What Google can see */}
        <Band white>
          <H2>What Google can see</H2>
          <div className="grid md:grid-cols-2 gap-4 mt-[22px]">
            <Pane tone="no" title="Google can see" from="left" items={CAN_SEE} mark="▪" />
            <Pane tone="yes" title="Google cannot see" from="right" items={CANNOT_SEE} mark="✓" />
          </div>
        </Band>

        {/* How the keys work */}
        <Band>
          <Reveal>
            <H2>How the keys work</H2>
            <p className={P}>
              Your password goes through Argon2id to unlock a random master key. The 24-word recovery phrase unlocks the same key. Files use XChaCha20-Poly1305 from libsodium. No home-made crypto.
            </p>
          </Reveal>
          <Reveal delay={150} className="mt-8">
            <KeysDiagram />
          </Reveal>
        </Band>

        {/* No server of ours */}
        <Band white>
          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-9 items-start">
            <Reveal>
              <H2>No server of ours</H2>
              <p className={P}>
                No accounts, no database. The app and the viewer talk to Google directly.
              </p>
            </Reveal>
            <Reveal delay={150}>
              <NoServerDiagram />
            </Reveal>
          </div>
        </Band>

        {/* Web viewer: what you trust */}
        <Band>
          <Reveal className="max-w-[800px] mx-auto bg-white border border-[#D3DAD5] rounded-2xl px-6 py-6 sm:px-7">
            <h2 className="text-[22px] sm:text-[28px] font-bold tracking-tight text-[#14201C] mb-2.5">
              Web viewer: what you trust
            </h2>
            <p className={P}>
              The page decrypts in your browser, but its code comes from this site on every visit. If the site were ever compromised, a bad script could steal your password. We use static hosting, a strict content policy and pinned builds to reduce that. Use the viewer on a device you trust.
            </p>
          </Reveal>
        </Band>

        {/* Known limits */}
        <Band white id="limits">
          <H2>Known limits</H2>
          <div className="grid md:grid-cols-3 gap-7 mt-[22px]">
            {LIMITS.map((text, i) => (
              <Reveal
                key={text}
                delay={i * 80}
                className="border-t border-[#CAD2CD] pt-3.5 transition-[border-color,padding-left] duration-300 hover:border-[#0F5C4D] hover:pl-2"
              >
                <p className="text-[15px] text-[#14201C] leading-relaxed">{text}</p>
              </Reveal>
            ))}
          </div>
        </Band>

        {/* Report a problem */}
        <Band>
          <div className="max-w-[800px] mx-auto">
            <H2>Report a problem</H2>
            <Reveal as="p" delay={100} className={P}>
              Report problems and join the discussion on{' '}
              <a
                href="https://github.com/Dadiya-Harsh/SecureWorkspace/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0F5C4D] font-medium link-draw"
              >
                GitHub Discussions
              </a>.
            </Reveal>
          </div>
        </Band>
      </main>
    </PageLayout>
  );
};
