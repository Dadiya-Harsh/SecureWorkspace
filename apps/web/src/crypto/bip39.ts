import { sha256 } from '@noble/hashes/sha256';
import { BIP39_WORD_INDEX } from './wordlist';

/**
 * Validates and converts a 24-word BIP-39 recovery phrase into 32 bytes (256-bit) entropy.
 * Pure TypeScript implementation without Node.js Buffer dependencies for seamless Web Worker execution.
 * Resilient against numbering prefixes (e.g. '1. word'), commas, newlines, and varied whitespace.
 */
export function recoveryPhraseToEntropy(phrase: string): Uint8Array {
  // 1. Sanitize and extract lowercase alphabetical words
  const words = phrase
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z]/g, ''))
    .filter(Boolean);

  if (words.length !== 24) {
    throw new Error(`Recovery phrase must contain exactly 24 words, got ${words.length}.`);
  }

  // 2. Convert 24 words into 264 bits (24 * 11 bits) using BigInt
  let combined = 0n;
  for (let i = 0; i < 24; i++) {
    const word = words[i];
    const index = BIP39_WORD_INDEX.get(word);
    if (index === undefined) {
      throw new Error(`Invalid recovery word "${word}" at position ${i + 1}. Please check spelling.`);
    }
    combined = (combined << 11n) | BigInt(index);
  }

  // 3. Separate 256-bit entropy and 8-bit checksum
  const extractedChecksum = Number(combined & 0xffn);
  let temp = combined >> 8n;
  const entropy = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    entropy[i] = Number(temp & 0xffn);
    temp >>= 8n;
  }

  // 4. Verify SHA-256 checksum (first 8 bits of SHA-256(entropy))
  const hash = sha256(entropy);
  const expectedChecksum = hash[0];

  if (extractedChecksum !== expectedChecksum) {
    throw new Error(
      'Recovery key validation failed: checksum mismatch. Please check for typos or word order.'
    );
  }

  return entropy;
}
