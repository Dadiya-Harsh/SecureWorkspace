import * as bip39 from 'bip39';

/**
 * Validates and converts a 24-word BIP-39 recovery phrase into 32 bytes (256-bit) entropy.
 */
export function recoveryPhraseToEntropy(phrase: string): Uint8Array {
  const normalized = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
  const words = normalized.split(' ');
  if (words.length !== 24) {
    throw new Error(`Recovery phrase must contain exactly 24 words, got ${words.length}`);
  }

  // Convert to entropy hex and return Uint8Array
  try {
    const entropyHex = bip39.mnemonicToEntropy(normalized);
    const bytes = new Uint8Array(entropyHex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(entropyHex.substr(i * 2, 2), 16);
    }
    if (bytes.length !== 32) {
      throw new Error(`Expected 32 bytes of entropy, got ${bytes.length}`);
    }
    return bytes;
  } catch (err) {
    throw new Error(
      `Recovery key validation failed: ${err instanceof Error ? err.message : 'Invalid mnemonic'}`
    );
  }
}
