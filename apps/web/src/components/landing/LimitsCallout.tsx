import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '../common/Reveal';

const LIMITS_ITEMS = [
  {
    title: 'It is a beta.',
    description: 'Keep your original files until you have tested a restore.',
  },
  {
    title: 'Google still sees sizes and timing.',
    description: 'Never contents, names or folders.',
  },
  {
    title: 'Opened files are plaintext on your PC.',
    description: 'Malware on your device can read them.',
  },
  {
    title: 'No password and no recovery key means no files.',
    description: 'Nobody can reset them, including us.',
  },
];

export const LimitsCallout: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <Reveal>
        <h2 className="text-3xl font-bold text-[#14201C] tracking-tight mb-10">
          The honest limits
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {LIMITS_ITEMS.map((item, index) => (
          <Reveal
            key={item.title}
            delay={index * 80}
            className="pt-4 border-t border-[#CAD2CD] space-y-1.5 transition-all duration-300 hover:border-[#0F5C4D] hover:pl-2"
          >
            <h3 className="text-sm font-bold text-[#14201C]">{item.title}</h3>
            <p className="text-xs sm:text-sm text-[#5A6662] leading-relaxed">
              {item.description}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal delay={320} className="pt-8">
        <Link
          to="/security"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F5C4D] hover:underline group"
        >
          <span>Read the full security model</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </section>
  );
};
