import React from 'react';
import { DocLayout, DocSection, DocDivider, CodeChip } from '../components/common/DocLayout';
import { Reveal } from '../components/common/Reveal';

const TOC = [
  { id: 'desktop-app', label: 'What the desktop app handles' },
  { id: 'web-viewer', label: 'The web viewer' },
  { id: 'google-data', label: 'Google data we access' },
  { id: 'not-collected', label: 'What we do not collect' },
  { id: 'choices', label: 'Your choices' },
  { id: 'contact', label: 'Contact & Questions' },
];

export const PrivacyPage: React.FC = () => {
  return (
    <DocLayout
      title="Privacy policy"
      subtitle="Short version: we run no server and collect nothing about you."
      toc={TOC}
    >
      <DocSection id="desktop-app" title="What the desktop app handles">
        <Reveal as="p">
          Your files stay on your PC and, encrypted, in your own Google Drive. The Google sign-in token is stored strictly on your device. The app sends no analytics, telemetry, or crash reports.
        </Reveal>
      </DocSection>

      <DocSection id="web-viewer" title="The web viewer">
        <Reveal as="p">
          No accounts, no cookies, no analytics. Keys and decrypted files stay in your browser tab's volatile RAM. The viewer communicates directly with Google's APIs via client-side OAuth tokens. The site is hosted statically and maintains zero user databases.
        </Reveal>
      </DocSection>

      <DocSection id="google-data" title="Google data we access">
        <Reveal as="p">
          Only the <CodeChip>drive.file</CodeChip> permission: files this app created or you choose to open with it. Your Google account email is used purely on screen for account identification and is never transmitted to any third party.
        </Reveal>
      </DocSection>

      <DocSection id="not-collected" title="What we do not collect">
        <Reveal as="p">
          File contents, file names, passwords, recovery keys, personal identities, or usage analytics.
        </Reveal>
      </DocSection>

      <DocSection id="choices" title="Your choices">
        <Reveal as="p">
          Disconnect Google in Settings, remove access in your Google account security settings, or delete the SecureWorkspace folder in your Google Drive at any time.
        </Reveal>
      </DocSection>
      <DocDivider />

      <DocSection id="contact" title="Contact &amp; Questions">
        <Reveal as="p">
          Questions or concerns? Please open a discussion or issue on our{' '}
          <a
            href="https://github.com/Dadiya-Harsh/SecureWorkspace/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0F5C4D] font-medium link-draw"
          >
            GitHub Discussions
          </a>.
        </Reveal>
      </DocSection>
    </DocLayout>
  );
};
