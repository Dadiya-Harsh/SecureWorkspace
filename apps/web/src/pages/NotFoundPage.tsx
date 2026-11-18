import React from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/common/PageLayout';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <PageLayout>
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#E2E6E3] shadow-xs space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#E6F4F1] border border-[#CAD2CD] flex items-center justify-center mx-auto text-[#0F5C4D]">
              <ShieldAlert className="w-8 h-8 stroke-[1.8]" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#5A6662]">
                Error 404
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14201C] tracking-tight">
                Page Not Found
              </h1>
              <p className="text-sm text-[#5A6662] max-w-md mx-auto">
                The address you visited doesn't exist or has moved. Your encrypted data remains completely safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/">
                <button className="w-full sm:w-auto bg-[#0F5C4D] hover:bg-[#0C4B3E] text-white px-5 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Home</span>
                </button>
              </Link>
              <Link to="/viewer">
                <button className="w-full sm:w-auto bg-white hover:bg-[#F8FAF8] border border-[#CAD2CD] text-[#14201C] px-5 py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-colors cursor-pointer shadow-xs">
                  Open Web Viewer
                </button>
              </Link>
            </div>
          </div>
        </main>
    </PageLayout>
  );
};
