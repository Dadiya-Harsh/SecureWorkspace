import React from 'react';
import { PageLayout } from '../components/common/PageLayout';
import { WordHeadline } from '../components/common/WordHeadline';
import { Reveal } from '../components/common/Reveal';
import { DocSection, DocDivider } from '../components/common/DocLayout';

const LINK = 'text-[#0F5C4D] font-medium link-draw';

export const ContactPage: React.FC = () => {
  return (
    <PageLayout>
      <main className="max-w-[700px] mx-auto px-4 sm:px-6 py-12 sm:py-16 pb-20 text-sm text-[#4A5A54] leading-relaxed">
        <WordHeadline className="mb-3">Contact</WordHeadline>

        <Reveal as="p" delay={300} className="text-base text-[#5A6662] mb-3">
          SecureWorkspace is an open-source project maintained on GitHub.
        </Reveal>

        <DocSection id="discussions" title="GitHub Discussions &amp; Issues">
          <Reveal as="p">
            Have a question, need assistance, or encountered an issue? Join the community conversation on{' '}
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              GitHub Discussions
            </a>{' '}
            or open a{' '}
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              GitHub Issue
            </a>.
          </Reveal>
        </DocSection>
        <DocDivider />

        <DocSection id="source" title="Source code &amp; contributions">
          <Reveal as="p">
            The complete cryptographic core, desktop application, and web viewer are public and open source under Apache 2.0 on{' '}
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              GitHub
            </a>.
          </Reveal>
        </DocSection>
        <DocDivider />

        <DocSection id="maintainer" title="Maintainer">
          <Reveal as="p">
            Maintained by Harsh Dadiya ({' '}
            <a
              href="https://harshdadiya.in"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              harshdadiya.in
            </a>{' '}
            ).
          </Reveal>
        </DocSection>
      </main>
    </PageLayout>
  );
};
