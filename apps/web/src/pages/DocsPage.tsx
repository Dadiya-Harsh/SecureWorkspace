import React from 'react';
import { Link } from 'react-router-dom';
import { DocLayout, DocSection, DocDivider, CodeChip } from '../components/common/DocLayout';
import { Reveal } from '../components/common/Reveal';

const TOC = [
  { id: 'quick-start', label: 'Quick start' },
  { id: 'recovery', label: 'Emergency recovery guide' },
  { id: 'version-history', label: 'Version history & snapshots' },
  { id: 'backups', label: 'Offline backups' },
  { id: 'support', label: 'Questions & support' },
];

const LINK = 'text-[#0F5C4D] font-medium link-draw';

export const DocsPage: React.FC = () => {
  return (
    <DocLayout
      title="Documentation"
      subtitle="Guides for setup, daily use, recovery, and offline backups."
      toc={TOC}
    >
      <DocSection id="quick-start" title="Quick start">
        <Reveal as="p">
          <strong>1. Create your vault:</strong> Download and install the desktop app. Pick a local directory, choose a strong master password, and write down your 24-word BIP-39 recovery key on paper.
        </Reveal>
        <Reveal as="p" delay={90}>
          <strong>2. Edit files natively:</strong> While your vault is unlocked on your PC, files reside in your local working folder. Open, save, and edit them directly in Microsoft Office, Notepad, or VS Code.
        </Reveal>
        <Reveal as="p" delay={180}>
          <strong>3. Push to Google Drive:</strong> When you finish editing, click <em>Push Changes</em>. Files are chunked and encrypted with libsodium XChaCha20-Poly1305 before uploading. Google only sees random-looking ciphertext blocks.
        </Reveal>
        <Reveal as="p" delay={270}>
          <strong>4. Read in any browser:</strong> Open the <Link to="/viewer" className={LINK}>Web Viewer</Link> on any computer or mobile device. Sign in with Google, enter your password, and read your decrypted documents directly in your browser tab.
        </Reveal>
      </DocSection>
      <DocDivider />

      <DocSection id="recovery" title="Emergency recovery guide">
        <Reveal as="p">
          Your <CodeChip>workspace.header</CodeChip> uses dual-path envelope encryption. Your master key is wrapped twice: once with your password, and once with your 24-word recovery phrase.
        </Reveal>
        <Reveal as="p">
          If you ever lose or forget your master password, or need to restore your vault onto a new computer:
        </Reveal>
        <ol className="list-decimal list-inside space-y-1.5 pl-1">
          <Reveal as="li">On the unlock screen (desktop or web viewer), click <strong>"Use recovery key instead"</strong>.</Reveal>
          <Reveal as="li" delay={90}>Enter your 24-word phrase separated by single spaces.</Reveal>
          <Reveal as="li" delay={180}>The app derives the key via Argon2id, verifies the checksum, and unlocks your vault.</Reveal>
        </ol>
      </DocSection>
      <DocDivider />

      <DocSection id="version-history" title="Version history &amp; snapshots">
        <Reveal as="p">
          Every push to Google Drive creates an immutable numbered version. You can roll back your entire workspace to a previous version or restore a single file from the History tab at any time.
        </Reveal>
        <Reveal as="p" delay={90}>
          Before any pull or revert overwrites files on your PC, SecureWorkspace creates a local safety snapshot so you can never accidentally lose unpushed work.
        </Reveal>
      </DocSection>
      <DocDivider />

      <DocSection id="backups" title="Offline backups">
        <Reveal as="p">
          From the <em>Backups</em> tab in the desktop app, you can export a self-contained encrypted backup package to an external USB drive or local NAS.
        </Reveal>
        <Reveal as="p" delay={90}>
          Every backup bundle contains the encrypted header, manifests, and ciphertext objects with an SHA-256 verification hash, allowing full restoration even if Google Drive is completely unavailable.
        </Reveal>
      </DocSection>
      <DocDivider />

      <DocSection id="support" title="Questions &amp; support">
        <Reveal as="p">
          Have questions or need assistance? Join our discussions on{' '}
          <a
            href="https://github.com/Dadiya-Harsh/SecureWorkspace/discussions"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            GitHub Discussions
          </a>.
        </Reveal>
      </DocSection>
    </DocLayout>
  );
};
