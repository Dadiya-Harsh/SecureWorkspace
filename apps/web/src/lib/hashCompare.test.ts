import { describe, expect, it } from 'vitest';
import { compareHashes, extractHash } from './hashCompare';

const H = '0694728e2dd0ab5a259667efe2db34af37347e900ca819fdf35dbecd209eea94';

describe('extractHash', () => {
  it('accepts a bare hash in any case', () => {
    expect(extractHash(H.toUpperCase())).toBe(H);
  });

  it('pulls the hash out of PowerShell Get-FileHash output', () => {
    const out = `Algorithm       Hash                                                                   Path\n---------       ----                                                                   ----\nSHA256          ${H.toUpperCase()}       C:\\Users\\me\\Downloads\\setup.exe`;
    expect(extractHash(out)).toBe(H);
  });

  it('pulls the hash out of shasum / sha256sum output', () => {
    expect(extractHash(`${H}  SecureWorkspace_0.1.0_x64-setup.exe`)).toBe(H);
  });

  it('handles a sha256: prefix', () => {
    expect(extractHash(`sha256:${H}`)).toBe(H);
  });

  it('keeps partial input for diffing', () => {
    expect(extractHash('06 94 72')).toBe('069472');
  });
});

describe('compareHashes', () => {
  it('reports empty input', () => {
    expect(compareHashes(H, '   ').status).toBe('empty');
  });

  it('matches identical hashes', () => {
    const r = compareHashes(H, H);
    expect(r.status).toBe('match');
    expect(r.differences).toBe(0);
    expect(r.cells).toHaveLength(64);
  });

  it('counts substituted characters', () => {
    const tampered = H.slice(0, 5) + (H[5] === 'a' ? 'b' : 'a') + H.slice(6);
    const r = compareHashes(H, tampered);
    expect(r.status).toBe('mismatch');
    expect(r.differences).toBe(1);
    expect(r.cells[5].ok).toBe(false);
  });

  it('flags truncated input as a mismatch', () => {
    const r = compareHashes(H, H.slice(0, 60));
    expect(r.status).toBe('mismatch');
    expect(r.differences).toBe(4);
    expect(r.enteredLength).toBe(60);
  });
});
