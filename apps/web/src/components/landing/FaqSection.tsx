import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'lost-password',
    question: 'What if I lose my master password?',
    answer:
      'Use your 24-word recovery phrase on the unlock screen. If you lose both, nobody can recover your files, including us.',
  },
  {
    id: 'lost-device',
    question: 'What if my laptop is lost or stolen?',
    answer:
      'Revoke Google Drive access from your Google account security settings. Because your files on Drive are encrypted with your master key, nobody can read them without your password or 24-word recovery phrase.',
  },
  {
    id: 'google-read',
    question: 'Can Google read my files?',
    answer:
      'No. Files are encrypted with XChaCha20-Poly1305 on your machine before upload. Google only sees random-looking .bin ciphertext blocks and manifest metadata.',
  },
  {
    id: 'vs-cryptomator',
    question: 'Why not Cryptomator or rclone crypt?',
    answer:
      'Cryptomator and rclone are great tools. SecureWorkspace is built specifically around Google Drive with zero configuration, versioned immutable pushes, safety snapshots before overwrite, and an in-browser zero-knowledge viewer without installing anything.',
  },
  {
    id: 'audit',
    question: 'Has it been independently audited?',
    answer:
      'Not yet. SecureWorkspace is in open beta. The cryptography relies entirely on audited, standard libraries (libsodium / libsodium-wrappers for XChaCha20-Poly1305 and Argon2id), with zero home-made crypto. The complete code and test vectors are open source on GitHub.',
  },
];

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('lost-password');

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="bg-white py-16 sm:py-24 border-t border-[#E2E6E3] scroll-mt-12" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-bold text-[#14201C] tracking-tight mb-8">
          Questions
        </h2>

        <div className="divide-y divide-[#E2E6E3] border-t border-[#E2E6E3]">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="py-4">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-2.5 text-left font-bold text-sm sm:text-base text-[#14201C] hover:text-[#0F5C4D] transition-colors cursor-pointer select-none py-1"
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#0F5C4D] shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#5A6662] shrink-0" />
                  )}
                  <span>{item.question}</span>
                </button>

                {isOpen && (
                  <div className="pl-6 pt-2 pb-1 text-xs sm:text-sm text-[#5A6662] leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};