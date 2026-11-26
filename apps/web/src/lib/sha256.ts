import { createSHA256 } from 'hash-wasm';

const CHUNK_BYTES = 4 * 1024 * 1024;

/**
 * Streaming SHA-256 of a local file, computed entirely in the browser.
 * Reads in 4 MB slices so large installers never sit fully in memory.
 */
export async function sha256File(
  file: File,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal
): Promise<string> {
  const hasher = await createSHA256();
  hasher.init();

  let offset = 0;
  while (offset < file.size) {
    if (signal?.aborted) throw new DOMException('Hashing cancelled', 'AbortError');
    const buf = await file.slice(offset, offset + CHUNK_BYTES).arrayBuffer();
    hasher.update(new Uint8Array(buf));
    offset += buf.byteLength;
    onProgress?.(Math.min(1, offset / file.size));
  }

  onProgress?.(1);
  return hasher.digest('hex');
}
