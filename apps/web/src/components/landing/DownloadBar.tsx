import React from 'react';
import { Link } from 'react-router-dom';
import { Download, ArrowRight, Shield } from 'lucide-react';
import { Button } from '../common/Button';

export const DownloadBar: React.FC = () => {
  return (
    <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6" id="download">
      <div className="bg-[#0F1D19] rounded-2xl p-8 sm:p-12 text-center text-white border border-[#25362F] shadow-lg relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#0F5C4D]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#3FB89A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A2C27] border border-[#25362F] text-xs font-mono text-[#3FB89A] mb-6">
            <Shield className="w-3.5 h-3.5" />
            <span>SecureWorkspace for Windows</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Protect your files today.
          </h2>

          <p className="text-sm sm:text-base text-[#A0ACA8] leading-relaxed mb-8">
            Download the native Windows desktop app for full authoring, automatic
            push/pull synchronization, and offline backup, or use the instant
            read-only web viewer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a
              href="https://github.com/Dadiya-Harsh/SecureWorkspace/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                size="lg"
                icon={<Download className="w-5 h-5 text-[#3FB89A]" />}
                className="w-full sm:w-auto bg-[#0F5C4D] hover:bg-[#0C4B3E]"
              >
                Download for Windows (x64)
              </Button>
            </a>
            <Link to="/viewer" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                icon={<ArrowRight className="w-5 h-5 text-[#14201C]" />}
                className="w-full sm:w-auto"
              >
                Open web viewer
              </Button>
            </Link>
          </div>

          <p className="text-xs font-mono text-[#5A6662]">
            Version 1.0.0 · Apache 2.0 Licensed · Free & Open Source Forever
          </p>
        </div>
      </div>
    </section>
  );
};
