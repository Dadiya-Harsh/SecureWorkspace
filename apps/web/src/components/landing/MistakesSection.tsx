import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History, Laptop, FileText } from 'lucide-react';
import { Reveal } from '../common/Reveal';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface SnapshotFile {
  name: string;
  meta: string;
}

interface VersionData {
  version: number;
  time: string;
  message: string;
  device: string;
  filesCount: number;
  fullDate: string;
  files: SnapshotFile[];
}

const VERSIONS: Record<number, VersionData> = {
  2: {
    version: 2,
    time: '14 Nov 11:32 pm',
    message: 'test changes',
    device: 'desktop',
    filesCount: 3,
    fullDate: '14 Nov, 11:32 pm',
    files: [
      { name: 'test-101.txt', meta: '35 B · sha d05ed695da...' },
      { name: 'test-102.docx', meta: '5 KB · sha 826d0ee37f...' },
      { name: 'test-102.pdf', meta: '15 KB · sha b3ca5f5364...' },
    ],
  },
  1: {
    version: 1,
    time: '14 Nov 07:55 pm',
    message: 'Version commit',
    device: 'desktop',
    filesCount: 3,
    fullDate: '14 Nov, 07:55 pm',
    files: [
      { name: 'test-101.txt', meta: '28 B · sha 4a81c20e1b...' },
      { name: 'test-102.docx', meta: '4.8 KB · sha 19dfb4a2c0...' },
      { name: 'test-102.pdf', meta: '14.2 KB · sha 7ec9014bfa...' },
    ],
  },
};

export const MistakesSection: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [selectedVersion, setSelectedVersion] = useState<number>(2);
  const [snapshotsCount, setSnapshotsCount] = useState<number>(0);
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRestoreFile = () => {
    setSnapshotsCount(1);
    setToastVisible(true);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const activeVersionData = VERSIONS[selectedVersion] || VERSIONS[2];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column in <Reveal> */}
        <Reveal className="lg:col-span-5 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111816] tracking-tight leading-tight">
            Mistakes are never final.
          </h2>

          <p className="text-base text-[#5A6662] leading-relaxed">
            Every push is saved as a version. Before the app overwrites anything on your PC, it saves a safety snapshot. Go back to any version, or restore a single file.
          </p>

          <div className="pt-2">
            <Link
              to="/how-it-works#going-back"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F5C4D] hover:underline group"
            >
              <span>See version history</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>

        {/* Right Column: Two-Column History & Snapshots Window Mockup in <Reveal delay={150}> */}
        <Reveal delay={150} className="lg:col-span-7 w-full">
          <div className="rounded-2xl border border-[#D5DDD6] bg-white shadow-xl p-5 sm:p-6 text-xs select-none">
            {/* Window Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EDF0ED]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#0F5C4D]" />
                <div>
                  <span className="font-bold text-sm text-[#14201C] block leading-tight">
                    Workspace History &amp; Snapshots
                  </span>
                  <span className="text-[10px] text-[#8EA39C] hidden sm:block">
                    Browse remote versions, rollback whole states, or restore single files from pre-pull snapshots.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0F5C4D] text-white">
                  Remote Versions (2)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDF0ED] text-[#5A6662] transition-colors duration-300">
                  Local Safety Snapshots ({snapshotsCount})
                </span>
              </div>
            </div>

            {/* Split View: Left Timeline (1/3) + Right Details (2/3) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Version Timeline */}
              <div className="md:col-span-5 space-y-2.5 border-r md:border-[#EDF0ED] pr-0 md:pr-3">
                <div className="text-[10px] font-bold text-[#8EA39C] uppercase tracking-wider px-1">
                  Version Timeline
                </div>

                {/* Version 2 Card (HEAD) */}
                <button
                  type="button"
                  onClick={() => setSelectedVersion(2)}
                  className={`w-full text-left p-3 rounded-xl border space-y-2 cursor-pointer transition-all duration-200 hover:translate-x-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C4D] ${
                    selectedVersion === 2
                      ? 'border-[#CAD2CD] bg-[#F8FAF8] shadow-2xs'
                      : 'border-[#EDF0ED] bg-white hover:bg-[#F8FAF8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#14201C] text-xs">
                        Version 2
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#DCECE6] text-[#0F5C4D]">
                        HEAD
                      </span>
                    </div>
                    <span className="text-[9px] text-[#8EA39C]">
                      14 Nov 11:32 pm
                    </span>
                  </div>

                  <div className="text-[11px] text-[#14201C] font-medium">
                    test changes
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#5A6662] pt-1">
                    <span className="flex items-center gap-1">
                      <Laptop className="w-3 h-3 text-[#8EA39C]" /> desktop
                    </span>
                    <span className="text-[#8EA39C]">3 files</span>
                  </div>
                </button>

                {/* Version 1 Card */}
                <button
                  type="button"
                  onClick={() => setSelectedVersion(1)}
                  className={`w-full text-left p-3 rounded-xl border space-y-2 cursor-pointer transition-all duration-200 hover:translate-x-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C4D] ${
                    selectedVersion === 1
                      ? 'border-[#CAD2CD] bg-[#F8FAF8] shadow-2xs'
                      : 'border-[#EDF0ED] bg-white hover:bg-[#F8FAF8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#5A6662] text-xs">
                      Version 1
                    </span>
                    <span className="text-[9px] text-[#8EA39C]">
                      14 Nov 07:55 pm
                    </span>
                  </div>

                  <div className="text-[11px] text-[#5A6662]">
                    Version commit
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#5A6662] pt-1">
                    <span className="flex items-center gap-1">
                      <Laptop className="w-3 h-3 text-[#8EA39C]" /> desktop
                    </span>
                    <span className="text-[#8EA39C]">3 files</span>
                  </div>
                </button>
              </div>

              {/* Right Column: Selected Version Detail */}
              <div
                key={`version-detail-${selectedVersion}`}
                className="md:col-span-7 space-y-3.5 pl-0 md:pl-1"
                style={
                  prefersReducedMotion
                    ? undefined
                    : {
                        animation:
                          'fade-and-rise 300ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                      }
                }
              >
                {/* Header of Selected Version */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#14201C] text-sm">
                      Version {activeVersionData.version}
                    </span>
                    {selectedVersion === 2 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DCECE6] text-[#0F5C4D]">
                        Current Workspace
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8EA39C]">
                    Committed on {activeVersionData.fullDate} by device{' '}
                    {activeVersionData.device}
                  </div>
                </div>

                {/* Commit Message Box */}
                <div className="bg-[#F8FAF8] border border-[#E2E6E3] rounded-lg px-3 py-2 text-[11px] font-mono text-[#14201C]">
                  "{activeVersionData.message}"
                </div>

                {/* Snapshot Files Table */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-bold text-[#8EA39C] uppercase tracking-wider px-1">
                    <span>
                      Snapshot Files ({activeVersionData.files.length})
                    </span>
                    <span>Action</span>
                  </div>

                  <div className="bg-white rounded-lg border border-[#E2E6E3] divide-y divide-[#F2F5F2]">
                    {activeVersionData.files.map((file, fileIdx) => (
                      <div
                        key={file.name}
                        className="flex items-center justify-between p-2.5"
                        style={
                          prefersReducedMotion
                            ? undefined
                            : {
                                animation:
                                  'stagger-in 300ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
                                animationDelay: `${fileIdx * 70}ms`,
                              }
                        }
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-[#0F5C4D] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-mono text-[#14201C] text-[11px] truncate">
                              {file.name}
                            </div>
                            <div className="text-[9px] text-[#8EA39C] font-mono">
                              {file.meta}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRestoreFile}
                          className="shrink-0 px-2.5 py-1 rounded border border-[#CAD2CD] text-[10px] font-medium text-[#14201C] bg-[#F8FAF8] hover:bg-[#EDF0ED] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C4D]"
                        >
                          ⤺ Restore File
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Toast Notification */}
      {toastVisible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F1D19] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-toast pointer-events-none"
        >
          <span>Safety snapshot saved · file restored</span>
        </div>
      )}
    </section>
  );
};
