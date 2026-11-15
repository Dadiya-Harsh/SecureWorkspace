import sodium from 'libsodium-wrappers-sumo';
import { CRYPTO_CONSTANTS } from './constants';

/**
 * Ensures libsodium WASM is fully initialized before crypto operations.
 */
export async function getSodium() {
  await sodium.ready;
  return sodium;
}

/**
 * Derives a 32-byte Key Encryption Key (KEK) from a password using Argon2id.
 */
export async function deriveKekFromPassword(
  password: string,
  salt: Uint8Array,
  opslimit: number = CRYPTO_CONSTANTS.ARGON2_PARAMS.iterations,
  memlimit: number = CRYPTO_CONSTANTS.ARGON2_MEMLIMIT_INTERACTIVE
): Promise<Uint8Array> {
  const s = await getSodium();
  if (salt.length !== CRYPTO_CONSTANTS.SALT_BYTES) {
    throw new Error(`Salt must be exactly ${CRYPTO_CONSTANTS.SALT_BYTES} bytes, got ${salt.length}`);
  }

  return s.crypto_pwhash(
    CRYPTO_CONSTANTS.KEY_BYTES,
    password,
    salt,
    opslimit,
    memlimit,
    s.crypto_pwhash_ALG_ARGON2ID13
  );
}

/**
 * Derives a 32-byte Key Encryption Key (KEK) from 256-bit recovery entropy using Argon2id.
 */
export async function deriveKekFromRecoveryEntropy(
  entropy: Uint8Array,
  salt: Uint8Array,
  opslimit: number = CRYPTO_CONSTANTS.ARGON2_PARAMS.iterations,
  memlimit: number = CRYPTO_CONSTANTS.ARGON2_MEMLIMIT_INTERACTIVE
): Promise<Uint8Array> {
  const s = await getSodium();
  if (entropy.length !== CRYPTO_CONSTANTS.KEY_BYTES) {
    throw new Error(`Entropy must be exactly ${CRYPTO_CONSTANTS.KEY_BYTES} bytes, got ${entropy.length}`);
  }
  if (salt.length !== CRYPTO_CONSTANTS.SALT_BYTES) {
    throw new Error(`Salt must be exactly ${CRYPTO_CONSTANTS.SALT_BYTES} bytes, got ${salt.length}`);
  }

  return s.crypto_pwhash(
    CRYPTO_CONSTANTS.KEY_BYTES,
    entropy,
    salt,
    opslimit,
    memlimit,
    s.crypto_pwhash_ALG_ARGON2ID13
  );
}

/**
 * Generic BLAKE2b subkey derivation with 16-byte personalization
 * matching Python PyNaCl nacl.hash.generichash(..., person=...).
 */
export async function deriveSubkeyBlake2b(
  wmk: Uint8Array,
  inputData: Uint8Array,
  personalization: string
): Promise<Uint8Array> {
  const s = await getSodium();
  if (wmk.length !== CRYPTO_CONSTANTS.KEY_BYTES) {
    throw new Error(`WMK must be ${CRYPTO_CONSTANTS.KEY_BYTES} bytes, got ${wmk.length}`);
  }

  const lib = (s as unknown as { libsodium: Record<string, unknown> }).libsodium;
  const malloc = lib._malloc as (size: number) => number;
  const free = lib._free as (ptr: number) => void;
  const heapU8 = lib.HEAPU8 as Uint8Array;
  const hashFn = lib._crypto_generichash_blake2b_salt_personal as (
    out: number,
    outlen: number,
    inPtr: number,
    inlenLow: number,
    inlenHigh: number,
    keyPtr: number,
    keylen: number,
    saltPtr: number,
    personPtr: number
  ) => number;

  const outPtr = malloc(32);
  const inPtr = malloc(inputData.length);
  const keyPtr = malloc(wmk.length);
  const personPtr = malloc(16);

  try {
    heapU8.set(inputData, inPtr);
    heapU8.set(wmk, keyPtr);

    // 16-byte buffer for personalization, zero-padded
    heapU8.fill(0, personPtr, personPtr + 16);
    const personBytes = new TextEncoder().encode(personalization);
    heapU8.set(personBytes.subarray(0, 16), personPtr);

    const ret = hashFn(
      outPtr,
      32,
      inPtr,
      inputData.length,
      0,
      keyPtr,
      wmk.length,
      0, // null salt
      personPtr
    );

    if (ret !== 0) {
      throw new Error(`BLAKE2b subkey derivation failed with code ${ret}`);
    }

    return new Uint8Array(heapU8.subarray(outPtr, outPtr + 32).slice());
  } finally {
    free(outPtr);
    free(inPtr);
    free(keyPtr);
    free(personPtr);
  }
}

/**
 * Derives a deterministic 256-bit per-file encryption key from WMK and 16-byte fileId.
 */
export async function deriveFileKey(wmk: Uint8Array, fileId: Uint8Array): Promise<Uint8Array> {
  return deriveSubkeyBlake2b(wmk, fileId, CRYPTO_CONSTANTS.CONTEXT_FILE_KEY);
}

/**
 * Derives the 256-bit index encryption key from WMK for manifest files.
 */
export async function deriveIndexKey(wmk: Uint8Array): Promise<Uint8Array> {
  const input = new TextEncoder().encode("workspace_index_catalog");
  return deriveSubkeyBlake2b(wmk, input, CRYPTO_CONSTANTS.CONTEXT_INDEX_KEY);
}

/**
 * Derives the 256-bit metadata encryption key from WMK for catalog DB.
 */
export async function deriveMetaKey(wmk: Uint8Array): Promise<Uint8Array> {
  const input = new TextEncoder().encode("workspace_metadata_db");
  return deriveSubkeyBlake2b(wmk, input, CRYPTO_CONSTANTS.CONTEXT_META_KEY);
}
