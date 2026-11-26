import React from 'react';
import { PageLayout } from '../components/common/PageLayout';
import { KeyLens } from '../components/common/KeyLens';
import { SecurityKeyDiagram } from '../components/security/SecurityKeyDiagram';
import { MarchingDash } from '../components/common/MarchingDash';

export const SecurityPage: React.FC = () => {
  return (
    <PageLayout>
      <main className="overflow-x-clip">
        {/* Top Header */}
        <section
          className="pt-16 sm:pt-24 pb-8 px-4 sm:px-6 border-b border-[#D3DAD5] bg-[#D3DAD5]/20"
          data-a="Security model"
          data-b="What is protected, what is not."
        >
          <div className="max-w-[1100px] mx-auto">
            <h1 className="text-[clamp(36px,5.4vw,60px)] font-extrabold tracking-tight text-[#14201C] leading-[1.05]">
              Security model
            </h1>
            <p className="text-[#4A5A54] text-lg sm:text-[19px] mt-2.5 max-w-[680px]">
              What is protected, what is not, and what you are trusting.
            </p>
          </div>
        </section>

        {/* 1. What Google can see */}
        <section
          className="py-14 sm:py-20 px-4 sm:px-6"
          data-a="What Google can see"
          data-b="Move the key over the files."
        >
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
              What Google can see
            </h2>
            <p className="text-[#4A5A54] text-[17px] mt-2.5 max-w-[620px]">
              Sizes and timing are visible. Move your cursor (or tap) over the folder to see what stays hidden.
            </p>

            <KeyLens />

            <p className="text-[13px] text-[#4A5A54] mt-3">
              Mock data. Sizes and dates are examples.
            </p>

            {/* Comparison Side-by-Side Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
              {/* Amber: Google can see */}
              <div className="rounded-2xl p-5 sm:p-6 border border-[#D3DAD5] bg-[#F4E3BC] text-[#5F4205]">
                <h3 className="text-base font-bold mb-2">Google can see</h3>
                <ul className="space-y-2 text-base">
                  <li className="flex items-center gap-2">▪ File sizes</li>
                  <li className="flex items-center gap-2">▪ Timing</li>
                  <li className="flex items-center gap-2">▪ Your account</li>
                  <li className="flex items-center gap-2">▪ A folder called SecureWorkspace</li>
                </ul>
              </div>

              {/* Soft Green: Google cannot see */}
              <div className="rounded-2xl p-5 sm:p-6 border border-[#D3DAD5] bg-[#D9EADF] text-[#0B4F40]">
                <h3 className="text-base font-bold mb-2">Google cannot see</h3>
                <ul className="space-y-2 text-base">
                  <li className="flex items-center gap-2">✓ File contents</li>
                  <li className="flex items-center gap-2">✓ File names</li>
                  <li className="flex items-center gap-2">✓ Folders</li>
                  <li className="flex items-center gap-2">✓ Your password</li>
                  <li className="flex items-center gap-2">✓ Your keys</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 2. How the keys work */}
        <section
          className="py-14 sm:py-20 px-4 sm:px-6 border-t border-[#D3DAD5]"
          data-a="How the keys work"
          data-b="One master key, two ways in."
        >
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
              How the keys work
            </h2>
            <p className="text-[#4A5A54] text-[17px] mt-2.5 max-w-[720px] leading-relaxed">
              Your password goes through Argon2id to unlock a random master key.
              The 24-word recovery phrase unlocks the same key. Files use
              XChaCha20-Poly1305 from libsodium. No home-made crypto.
            </p>

            <SecurityKeyDiagram />
          </div>
        </section>

        {/* 3. No server of ours */}
        <section
          className="py-14 sm:py-20 px-4 sm:px-6 border-t border-[#D3DAD5]"
          data-a="No server of ours"
          data-b="The app and viewer talk to Google directly."
        >
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
              No server of ours
            </h2>
            <p className="text-[#4A5A54] text-[17px] mt-2.5 max-w-[720px]">
              No accounts, no database. The app and the viewer talk to Google directly.
            </p>

            <div className="mt-8 space-y-3.5">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full bg-[#F8FAF8] border border-[#D3DAD5] rounded-xl p-4 text-left">
                  <small className="block text-xs font-bold text-[#4A5A54]">
                    DESKTOP APP
                  </small>
                  <b className="block text-lg text-[#14201C] mt-0.5">Your PC</b>
                </div>

                <div className="w-full sm:w-20 py-2 sm:py-0">
                  <MarchingDash active={true} orientation="horizontal" hasDot={false} />
                </div>

                <div className="flex-1 w-full bg-[#F8FAF8] border border-[#D3DAD5] rounded-xl p-4 text-left">
                  <small className="block text-xs font-bold text-[#4A5A54]">
                    GOOGLE
                  </small>
                  <b className="block text-lg text-[#14201C] mt-0.5">Your Drive</b>
                </div>

                <div className="w-full sm:w-20 py-2 sm:py-0">
                  <MarchingDash active={true} orientation="horizontal" hasDot={false} />
                </div>

                <div className="flex-1 w-full bg-[#F8FAF8] border border-[#D3DAD5] rounded-xl p-4 text-left">
                  <small className="block text-xs font-bold text-[#4A5A54]">
                    WEB VIEWER
                  </small>
                  <b className="block text-lg text-[#14201C] mt-0.5">Your browser</b>
                </div>
              </div>

              <div className="border-2 border-dashed border-[#D3DAD5] rounded-xl p-4 text-center text-[#4A5A54]">
                <small className="block text-xs font-bold">OUR SERVER</small>
                <b className="block text-lg text-[#14201C]">None</b>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Web viewer: what you trust */}
        <section
          className="py-14 sm:py-20 px-4 sm:px-6 border-t border-[#D3DAD5]"
          data-a="What you trust"
          data-b="The web viewer's code comes from this site."
        >
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
              Web viewer: what you trust
            </h2>
            <p className="text-[#4A5A54] text-[17px] mt-2.5 max-w-[720px] leading-relaxed">
              The page decrypts in your browser, but its code comes from this site on every visit.
              If the site were ever compromised, a bad script could steal your password.
              We use static hosting, a strict content policy and pinned builds to reduce that.
              Use the viewer on a device you trust.
            </p>
          </div>
        </section>

        {/* 5. Known limits & Report problem */}
        <section
          className="py-14 sm:py-20 px-4 sm:px-6 border-t border-[#D3DAD5]"
          data-a="Known limits"
          data-b="Read these before you rely on it."
        >
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-[clamp(28px,4.2vw,46px)] font-bold tracking-tight text-[#14201C] leading-[1.08] text-balance">
              Known limits
            </h2>

            <div className="mt-5 space-y-3">
              <div className="bg-[#F8FAF8] border border-[#D3DAD5] border-l-[6px] border-l-[#C89A2B] rounded-xl p-4 text-[17px] text-[#14201C]">
                Opened files are plaintext on your screen and in memory. Malware on your device can read them.
              </div>
              <div className="bg-[#F8FAF8] border border-[#D3DAD5] border-l-[6px] border-l-[#C89A2B] rounded-xl p-4 text-[17px] text-[#14201C]">
                Chrome’s PDF viewer has its own Download and Print buttons.
              </div>
              <div className="bg-[#F8FAF8] border border-[#D3DAD5] border-l-[6px] border-l-[#C89A2B] rounded-xl p-4 text-[17px] text-[#14201C]">
                This is beta software and has not had an independent security review.
              </div>
            </div>

            <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight text-[#14201C] mt-14">
              Report a problem
            </h2>
            <p className="text-[#4A5A54] text-[17px] mt-2">
              Report problems and join the discussion on{' '}
              <a
                href="https://github.com/Dadiya-Harsh/SecureWorkspace/discussions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0F5C4D] font-semibold hover:underline"
              >
                GitHub Discussions →
              </a>
            </p>
          </div>
        </section>
      </main>
    </PageLayout>
  );
};
