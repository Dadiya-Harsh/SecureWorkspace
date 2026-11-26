const HEX64 = /[a-fA-F0-9]{64}/;

/**
 * Pull a SHA-256 out of whatever the user pasted: a bare hash, "sha256:abc…",
 * spaced/colon-separated output, or a whole PowerShell Get-FileHash table.
 * Returns lowercase hex with separators stripped.
 */
export function extractHash(input: string): string {
  const found = input.match(HEX64);
  if (found) return found[0].toLowerCase();
  // Fall back to the cleaned text so partial/incorrect input can still be diffed.
  return input
    .replace(/^\s*sha-?256\s*[:=]?/i, '')
    .replace(/[^a-fA-F0-9]/g, '')
    .toLowerCase();
}

export interface HashCell {
  /** Character the user entered at this position (empty if too short). */
  got: string;
  ok: boolean;
}

export interface HashComparison {
  status: 'empty' | 'match' | 'mismatch';
  cells: HashCell[];
  /** Positions that differ, plus any extra characters beyond the expected length. */
  differences: number;
  enteredLength: number;
}

/** Compare an entered hash against the expected one, character by character. */
export function compareHashes(expected: string, entered: string): HashComparison {
  const want = expected.toLowerCase();
  const got = extractHash(entered);
  if (!got) {
    return { status: 'empty', cells: [], differences: 0, enteredLength: 0 };
  }

  const cells: HashCell[] = Array.from(want).map((c, i) => ({
    got: got[i] ?? '',
    ok: got[i] === c,
  }));
  const wrong = cells.filter((c) => !c.ok).length;
  const extra = Math.max(0, got.length - want.length);
  const differences = wrong + extra;

  return {
    status: differences === 0 ? 'match' : 'mismatch',
    cells,
    differences,
    enteredLength: got.length,
  };
}
