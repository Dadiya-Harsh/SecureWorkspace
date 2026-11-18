import React from 'react';
import { DocLayout, DocSection, DocDivider } from '../components/common/DocLayout';
import { Reveal } from '../components/common/Reveal';

const TOC = [
  { id: 'beta', label: 'Beta software' },
  { id: 'keys', label: 'Your password and recovery key' },
  { id: 'open-source', label: 'Open source' },
  { id: 'google', label: 'Google services' },
  { id: 'acceptable-use', label: 'Acceptable use' },
  { id: 'liability', label: 'Limitation of liability' },
  { id: 'changes', label: 'Changes & Inquiries' },
];

export const TermsPage: React.FC = () => {
  return (
    <DocLayout
      title="Terms and conditions"
      subtitle="Plain-language terms for an open-source, client-side encryption tool."
      toc={TOC}
    >
      <DocSection id="beta" title="Beta software">
        <Reveal as="p">
          Provided as is, without warranty of any kind. Keep your original files backed up until you have tested and verified a restore.
        </Reveal>
      </DocSection>

      <DocSection id="keys" title="Your password and recovery key">
        <Reveal as="p">
          They are yours alone. Because SecureWorkspace operates with zero server infrastructure, we cannot reset, unwrap, or recover your keys. If you lose both your master password and your 24-word recovery phrase, your data is mathematically unrecoverable.
        </Reveal>
      </DocSection>

      <DocSection id="open-source" title="Open source">
        <Reveal as="p">
          The source code is licensed under the Apache License 2.0. The license text governs your use, modification, and distribution of the code.
        </Reveal>
      </DocSection>

      <DocSection id="google" title="Google services">
        <Reveal as="p">
          Your use of Google Drive and Google OAuth authentication is governed by Google's own terms of service and privacy policies.
        </Reveal>
      </DocSection>

      <DocSection id="acceptable-use" title="Acceptable use">
        <Reveal as="p">
          Do not use the desktop app or web viewer to store, transmit, or access data you are not legally authorized to access.
        </Reveal>
      </DocSection>

      <DocSection id="liability" title="Limitation of liability">
        <Reveal as="p">
          To the maximum extent permitted by applicable law, the authors and contributors of SecureWorkspace shall not be liable for any direct, indirect, incidental, or consequential damages, including loss of data, arising out of the use or inability to use this software.
        </Reveal>
      </DocSection>
      <DocDivider />

      <DocSection id="changes" title="Changes &amp; Inquiries">
        <Reveal as="p">
          These terms may be updated alongside open-source releases. For inquiries, please participate via{' '}
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
