import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { compareHashes } from '../../lib/hashCompare';
import { sha256File } from '../../lib/sha256';

export interface ReleaseFile {
  id: string;
  name: string;
  label: string;
  sha256: string;
}

type Shell = 'powershell' | 'macos' | 'linux';
type Mode = 'paste' | 'file';

interface FileState {
  name: string;
  progress: number;
  hash: string | null;
  error: string | null;
}

const SHELLS: Array<{ id: Shell; label: string; prompt: string; cmd: (f: string) => string }> = [
  { id: 'powershell', label: 'Windows', prompt: 'PS>', cmd: (f) => `Get-FileHash -Algorithm SHA256 .\\${f}` },
  { id: 'macos', label: 'macOS', prompt: '$', cmd: (f) => `shasum -a 256 ${f}` },
  { id: 'linux', label: 'Linux', prompt: '$', cmd: (f) => `sha256sum ${f}` },
];

const chip = (active: boolean) =>
  `px-3.5 py-2 min-h-9 rounded-lg border text-[13px] font-semibold cursor-pointer transition-colors ${
    active
      ? 'bg-[#14201C] border-[#14201C] text-white'
      : 'bg-white border-[#D3DAD5] text-[#14201C] hover:border-[#0F5C4D]'
  }`;

/**
 * Lets people check a download against the published SHA-256, two ways:
 * paste the hash their terminal printed, or pick the file and hash it here.
 * Nothing is uploaded; the comparison runs in the browser.
 */
export const HashVerifier: React.FC<{ files: ReleaseFile[] }> = ({ files }) => {
  const reduced = usePrefersReducedMotion();
  const [selectedId, setSelectedId] = useState(files[0]?.id ?? '');
  const [shell, setShell] = useState<Shell>('powershell');
  const [mode, setMode] = useState<Mode>('paste');
  const [pasted, setPasted] = useState('');
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [dragging, setDragging] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const selected = files.find((f) => f.id === selectedId) ?? files[0];
  if (!selected) return null;

  const shellDef = SHELLS.find((s) => s.id === shell) ?? SHELLS[0];
  const entered = mode === 'paste' ? pasted : (fileState?.hash ?? '');
  const result = compareHashes(selected.sha256, entered);

  const pick = (id: string) => {
    setSelectedId(id);
    setPasted('');
    setFileState(null);
    abortRef.current?.abort();
  };

  const hashFile = async (file: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // If the file is one of the published installers, compare against that one.
    const sameName = files.find((f) => f.name === file.name);
    if (sameName) setSelectedId(sameName.id);

    setFileState({ name: file.name, progress: 0, hash: null, error: null });
    try {
      const hash = await sha256File(
        file,
        (progress) => setFileState((s) => (s ? { ...s, progress } : s)),
        controller.signal
      );
      setFileState({ name: file.name, progress: 1, hash, error: null });
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
      setFileState({ name: file.name, progress: 0, hash: null, error: 'Could not read that file.' });
    }
  };

  const hashing = !!fileState && !fileState.hash && !fileState.error;
  const nameMismatch = mode === 'file' && fileState?.hash && fileState.name !== selected.name;

  return (
    <div className="bg-white border border-[#D3DAD5] rounded-[14px] p-5">
      {/* Which file */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="File to check">
        {files.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={f.id === selected.id}
            onClick={() => pick(f.id)}
            className={chip(f.id === selected.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Terminal command */}
      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Your system">
        {SHELLS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === shell}
            onClick={() => setShell(s.id)}
            className={`${chip(s.id === shell)} !min-h-8 !py-1 !text-xs`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <code className="block mt-2.5 bg-[#0F1D19] text-[#D7E6DF] rounded-[10px] px-4 py-3.5 font-mono text-[13px] overflow-x-auto whitespace-nowrap">
        <span className="text-[#3FB89A]">{shellDef.prompt}</span> {shellDef.cmd(selected.name)}
      </code>

      {/* Mode */}
      <div className="mt-5 flex gap-1.5 border-b border-[#E2E6E3] pb-3" role="group" aria-label="How to check">
        <button type="button" aria-pressed={mode === 'paste'} onClick={() => setMode('paste')} className={chip(mode === 'paste')}>
          Paste the hash
        </button>
        <button type="button" aria-pressed={mode === 'file'} onClick={() => setMode('file')} className={chip(mode === 'file')}>
          Choose the file
        </button>
      </div>

      {mode === 'paste' ? (
        <div className="mt-4">
          <label htmlFor="hash-input" className="block text-sm font-semibold text-[#14201C]">
            Hash from your terminal
          </label>
          <textarea
            id="hash-input"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Paste the output here…"
            spellCheck={false}
            className="w-full mt-1.5 min-h-16 resize-y rounded-[10px] border border-[#B9C5BE] bg-white p-2.5 font-mono text-[12.5px] text-[#14201C] focus:outline-2 focus:outline-[#0F5C4D] focus:border-[#0F5C4D]"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            <button type="button" onClick={() => setPasted('')} className="text-xs font-semibold px-3 min-h-8 rounded-md border border-[#D3DAD5] bg-white hover:bg-[#F2F5F2] cursor-pointer">
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void hashFile(f);
            }}
            className={`block cursor-pointer rounded-xl border-2 border-dashed px-4 py-7 text-center text-sm transition-colors focus-within:outline-2 focus-within:outline-[#0F5C4D] ${
              dragging ? 'border-[#0F5C4D] bg-[#EEF6F0]' : 'border-[#B9C5BE] bg-[#F8FAF8] hover:border-[#0F5C4D]'
            }`}
          >
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void hashFile(f);
                e.target.value = '';
              }}
            />
            <span className="font-semibold text-[#14201C]">Drop the downloaded file here</span>
            <span className="block text-xs text-[#4A5A54] mt-1">or click to choose it. It is hashed in your browser and never uploaded.</span>
          </label>

          {fileState && (
            <div className="mt-3 text-[13px] text-[#4A5A54]">
              <div className="flex justify-between gap-3">
                <span className="truncate font-mono">{fileState.name}</span>
                <span>{hashing ? `${Math.round(fileState.progress * 100)}%` : ''}</span>
              </div>
              {hashing && (
                <div className="mt-1.5 h-1.5 rounded-full bg-[#E4E9E5] overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-[#0F5C4D] transition-[width] duration-150" style={{ width: `${fileState.progress * 100}%` }} />
                </div>
              )}
              {fileState.error && <p className="mt-1 text-[#8C1D17]">{fileState.error}</p>}
              {nameMismatch && (
                <p className="mt-1">
                  This file is named differently from <span className="font-mono">{selected.name}</span>; checking it against that one anyway.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Per-character match grid */}
      {result.status !== 'empty' && (
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-[3px] mt-4" aria-hidden="true">
          {result.cells.map((cell, i) => (
            <i
              key={`${selected.id}-${i}-${cell.got}`}
              className={`not-italic font-mono text-[11px] text-center py-[5px] rounded ${reduced ? '' : 'animate-pop'} ${
                cell.ok ? 'bg-[#D4ECD9] text-[#137333]' : 'bg-[#F7D4D1] text-[#B3261E]'
              }`}
              style={reduced ? undefined : { animationDelay: `${i * 12}ms` }}
            >
              {cell.got || '·'}
            </i>
          ))}
        </div>
      )}

      <div
        role="status"
        aria-live="polite"
        className={`mt-3 px-3.5 py-3 rounded-[10px] text-sm font-semibold ${
          result.status === 'match'
            ? 'bg-[#D4ECD9] text-[#0E5A27]'
            : result.status === 'mismatch'
              ? 'bg-[#F7D4D1] text-[#8C1D17]'
              : 'bg-[#EEF1EE] text-[#4A5A54]'
        }`}
      >
        {hashing
          ? 'Calculating…'
          : result.status === 'empty'
            ? mode === 'paste'
              ? 'Waiting for a hash…'
              : 'Waiting for a file…'
            : result.status === 'match'
              ? '✓ Match. This file is the one that was released.'
              : `✗ Do not run it. ${result.differences} difference${result.differences > 1 ? 's' : ''}${
                  mode === 'paste' && result.enteredLength !== 64 ? ` (you entered ${result.enteredLength} of 64 characters)` : ''
                }. Download it again from the official release.`}
      </div>
    </div>
  );
};
