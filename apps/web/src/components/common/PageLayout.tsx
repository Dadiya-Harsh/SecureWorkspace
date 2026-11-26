import React, { type ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollProgress } from './ScrollProgress';

/** Shared page shell: scroll progress bar, sticky nav, content, footer. */
export const PageLayout: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#EDF0ED] flex flex-col justify-between selection:bg-[#DCECE6] selection:text-[#0F5C4D] overflow-x-clip">
    <ScrollProgress />
    <Navbar />
    <div className="pt-16 flex-1 flex flex-col w-full overflow-x-clip">
      {children}
    </div>
    <Footer />
  </div>
);
