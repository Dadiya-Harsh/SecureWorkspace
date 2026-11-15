/**
 * Secure ephemeral memory zeroization utilities.
 * Ensures decrypted buffers, derived keys, and KEKs are zeroed
 * immediately upon lock or completion.
 */

export function wipeBuffer(buf: Uint8Array | null | undefined): void {
  if (buf && buf.length > 0) {
    buf.fill(0);
  }
}

export function wipeBuffers(...buffers: (Uint8Array | null | undefined)[]): void {
  for (const buf of buffers) {
    wipeBuffer(buf);
  }
}
