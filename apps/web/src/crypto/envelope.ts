import { CRYPTO_CONSTANTS } from './constants';
import {
  deriveKekFromPassword,
  deriveKekFromRecoveryEntropy,
  deriveFileKey,
  deriveIndexKey,
  getSodium,
} from './kdf';
import { recoveryPhraseToEntropy } from './bip39';
import { wipeBuffer, wipeBuffers } from './memory';
import type { WorkspaceHeader, VersionManifestData } from '../types/crypto';

/**
 * Parses and validates a 246-byte binary workspace header.
 */
export function parseWorkspaceHeader(data: Uint8Array): WorkspaceHeader {
  if (data.length !== CRYPTO_CONSTANTS.EXPECTED_HEADER_SIZE) {
    throw new Error(
      `Invalid header size: expected ${CRYPTO_CONSTANTS.EXPECTED_HEADER_SIZE} bytes, got ${data.length}`
    );
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // 1. Magic (4 bytes)
  const magic = new TextDecoder().decode(data.subarray(0, 4));
  if (magic !== CRYPTO_CONSTANTS.HEADER_MAGIC) {
    throw new Error(`Invalid workspace header magic: expected ${CRYPTO_CONSTANTS.HEADER_MAGIC}, got ${magic}`);
  }

  // 2. Version (2 bytes, big-endian)
  const version = view.getUint16(4, false);
  if (version !== CRYPTO_CONSTANTS.FORMAT_VERSION) {
    throw new Error(`Unsupported workspace header version: ${version}`);
  }

  // 3. Workspace ID (16 bytes UUID)
  const workspaceId = data.slice(6, 22);

  // 4. opslimit (4 bytes uint32) & memlimit (4 bytes uint32)
  const opslimit = view.getUint32(22, false);
  const memlimit = view.getUint32(26, false);

  // 5. Salts & Nonces
  const passwordSalt = data.slice(30, 46); // 16 bytes
  const recoverySalt = data.slice(46, 62); // 16 bytes
  const passwordNonce = data.slice(62, 86); // 24 bytes
  const wrappedWmkPassword = data.slice(86, 134); // 48 bytes
  const recoveryNonce = data.slice(134, 158); // 24 bytes
  const wrappedWmkRecovery = data.slice(158, 206); // 48 bytes

  // 6. Created at (8 bytes int64, big-endian)
  const createdAtMs = Number(view.getBigInt64(206, false));

  // 7. Workspace Name (32 bytes null-padded UTF-8)
  const rawNameBytes = data.subarray(214, 246);
  let nameEnd = 0;
  while (nameEnd < rawNameBytes.length && rawNameBytes[nameEnd] !== 0) {
    nameEnd++;
  }
  const name = new TextDecoder('utf-8', { fatal: false }).decode(rawNameBytes.subarray(0, nameEnd));

  return {
    magic,
    version,
    workspaceId,
    opslimit,
    memlimit,
    passwordSalt,
    recoverySalt,
    passwordNonce,
    wrappedWmkPassword,
    recoveryNonce,
    wrappedWmkRecovery,
    createdAtMs,
    name,
  };
}

/**
 * Unwraps the Workspace Master Key (WMK) using the master password.
 */
export async function unwrapWmkWithPassword(
  header: WorkspaceHeader,
  password: string
): Promise<Uint8Array> {
  const s = await getSodium();
  const kek = await deriveKekFromPassword(
    password,
    header.passwordSalt,
    header.opslimit,
    header.memlimit
  );

  try {
    return s.crypto_secretbox_open_easy(
      header.wrappedWmkPassword,
      header.passwordNonce,
      kek
    );
  } catch {
    throw new Error('Failed to unwrap Workspace Master Key: incorrect master password or corrupted header.');
  } finally {
    wipeBuffer(kek);
  }
}

/**
 * Unwraps the Workspace Master Key (WMK) using the 24-word recovery phrase.
 */
export async function unwrapWmkWithRecoveryPhrase(
  header: WorkspaceHeader,
  phrase: string
): Promise<Uint8Array> {
  const s = await getSodium();
  const entropy = recoveryPhraseToEntropy(phrase);
  let kek: Uint8Array | null = null;

  try {
    kek = await deriveKekFromRecoveryEntropy(
      entropy,
      header.recoverySalt,
      header.opslimit,
      header.memlimit
    );

    return s.crypto_secretbox_open_easy(
      header.wrappedWmkRecovery,
      header.recoveryNonce,
      kek
    );
  } catch (err) {
    throw new Error(
      `Failed to unwrap Workspace Master Key using recovery phrase: ${
        err instanceof Error ? err.message : 'authentication failed'
      }`
    );
  } finally {
    wipeBuffers(entropy, kek);
  }
}

/**
 * Decrypts a SecretStream file envelope (SWF1) chunk-by-chunk.
 */
export async function decryptSecretStream(
  ciphertext: Uint8Array,
  key: Uint8Array
): Promise<Uint8Array> {
  const s = await getSodium();

  // 1. Verify Magic (4 bytes)
  if (ciphertext.length < 30) {
    throw new Error('Ciphertext too short to contain SecretStream header.');
  }
  const magic = new TextDecoder().decode(ciphertext.subarray(0, 4));
  if (magic !== CRYPTO_CONSTANTS.FILE_MAGIC) {
    throw new Error(`Invalid file magic: expected ${CRYPTO_CONSTANTS.FILE_MAGIC}, got ${magic}`);
  }

  // 2. Verify Version (2 bytes)
  const view = new DataView(ciphertext.buffer, ciphertext.byteOffset, ciphertext.byteLength);
  const version = view.getUint16(4, false);
  if (version !== CRYPTO_CONSTANTS.FORMAT_VERSION) {
    throw new Error(`Unsupported file envelope format version: ${version}`);
  }

  // 3. Read SecretStream Header (24 bytes)
  const streamHeader = ciphertext.subarray(6, 30);
  const statePull = s.crypto_secretstream_xchacha20poly1305_init_pull(streamHeader, key);

  let offset = 30;
  const chunks: Uint8Array[] = [];
  let totalPlainBytes = 0;
  let finalSeen = false;

  while (offset < ciphertext.length) {
    if (offset + 4 > ciphertext.length) {
      throw new Error('Truncated file: missing chunk length header.');
    }
    const chunkLen = view.getUint32(offset, false);
    offset += 4;

    if (offset + chunkLen > ciphertext.length) {
      throw new Error('Truncated file: missing ciphertext chunk payload.');
    }

    const chunkCipher = ciphertext.subarray(offset, offset + chunkLen);
    offset += chunkLen;

    const pullResult = s.crypto_secretstream_xchacha20poly1305_pull(statePull, chunkCipher, null);
    if (!pullResult || typeof pullResult !== 'object') {
      throw new Error('SecretStream chunk decryption failed: corrupted chunk or authentication mismatch.');
    }
    const plainChunk = pullResult.message as Uint8Array;
    chunks.push(plainChunk);
    totalPlainBytes += plainChunk.length;

    if (pullResult.tag === s.crypto_secretstream_xchacha20poly1305_TAG_FINAL) {
      finalSeen = true;
      break;
    }
  }

  if (!finalSeen) {
    throw new Error('Corrupted or truncated stream: stream ended before TAG_FINAL marker.');
  }

  // Assemble into contiguous buffer
  const result = new Uint8Array(totalPlainBytes);
  let writeOffset = 0;
  for (const c of chunks) {
    result.set(c, writeOffset);
    writeOffset += c.length;
  }

  return result;
}

/**
 * Decrypts a version manifest file from Google Drive (versions/00000X.manifest).
 */
export async function decryptManifest(
  ciphertext: Uint8Array,
  wmk: Uint8Array
): Promise<VersionManifestData> {
  const indexKey = await deriveIndexKey(wmk);
  let plainBytes: Uint8Array | null = null;
  try {
    plainBytes = await decryptSecretStream(ciphertext, indexKey);
    const jsonStr = new TextDecoder('utf-8').decode(plainBytes);
    return JSON.parse(jsonStr) as VersionManifestData;
  } finally {
    wipeBuffers(indexKey, plainBytes);
  }
}

/**
 * Decrypts a file object from Google Drive (objects/{file_id_hex}).
 */
export async function decryptFileObject(
  ciphertext: Uint8Array,
  wmk: Uint8Array,
  fileIdBytes: Uint8Array
): Promise<Uint8Array> {
  const fileKey = await deriveFileKey(wmk, fileIdBytes);
  try {
    return await decryptSecretStream(ciphertext, fileKey);
  } finally {
    wipeBuffer(fileKey);
  }
}
