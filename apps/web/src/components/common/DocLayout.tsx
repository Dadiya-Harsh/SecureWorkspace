import React, { type ReactNode } from 'react';
import { PageLayout } from './PageLayout';
import { WordHeadline } from './WordHeadline';
import { Reveal } from './Reveal';
import { useInView } from '../../hooks/useInView';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useScrollSpy } from '../../hooks/useScrollSpy';

export interface DocTocItem {
  id: string;
  label: string;
}

export const CodeChip: React.FC<{ children: ReactNode }> = ({ children }) => (
  <code className="text-xs bg-[#E1E6E2] px-1.5 py-0.5 rounded font-mono text-[#14201C]">
    {children}
  </code>
);

/** Hairline between sections; draws in from the left when scrolled into view. */
export const DocDivider: React.FC = () => {
  const [ref, inView] = useInView<HTMLDivElement>(0.15);
  const reduced = usePrefersReducedMotion();
  const drawn = reduced || inView;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`h-px bg-[#CAD2CD] mt-10 origin-left transition-transform duration-[800ms] ${
        drawn ? 'scale-x-100' : 'scale-x-0'
      }`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}
    />
  );
};

export const DocSection: React.FC<{
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}> = ({ id, title, children, className = '' }) => (
  <section id={id} className={`scroll-mt-24 pt-9 space-y-3 ${className}`}>
    <Reveal as="h2" className="text-lg font-bold text-[#14201C]">
      {title}
    </Reveal>
    {children}
  </section>
);

const DocToc: React.FC<{ items: DocTocItem[] }> = ({ items }) => {
  const [activeId, setActiveId] = useScrollSpy(items.map((i) => i.id));
  const reduced = usePrefersReducedMotion();

  const go = (id: string) => {
    setActiveId(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <Reveal
      as="aside"
      delay={500}
      className="hidden md:flex sticky top-24 flex-col gap-0.5 border-l-2 border-[#D3DAD5] pl-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#4A5A54] mb-2">
        On this page
      </p>
      <nav aria-label="On this page" className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              aria-current={active ? 'true' : undefined}
              className={`relative text-left py-1.5 text-sm cursor-pointer transition-[color,transform] duration-200 ${
                active
                  ? 'text-[#0F5C4D] font-semibold translate-x-1 before:content-[""] before:absolute before:-left-[18px] before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-[#0F5C4D]'
                  : 'text-[#4A5A54] hover:text-[#14201C]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </Reveal>
  );
};

/** Shared layout for Docs, Privacy and Terms: headline, 700px column, sticky "On this page". */
export const DocLayout: React.FC<{
  title: string;
  subtitle: string;
  toc: DocTocItem[];
  children: ReactNode;
}> = ({ title, subtitle, toc, children }) => (
  <PageLayout>
    <main className="max-w-[1010px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="grid md:grid-cols-[minmax(0,700px)_200px] gap-14 justify-center items-start">
        <div className="text-sm text-[#4A5A54] leading-relaxed">
          <WordHeadline className="mb-3">{title}</WordHeadline>
          <Reveal as="p" delay={300} className="text-base text-[#5A6662] mb-3">
            {subtitle}
          </Reveal>
          {children}
        </div>
        <DocToc items={toc} />
      </div>
    </main>
  </PageLayout>
);
