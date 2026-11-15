import { describe, it, expect } from 'vitest';
import {
  deriveKekFromPassword,
  deriveKekFromRecoveryEntropy,
  deriveFileKey,
  deriveIndexKey,
  getSodium,
} from './kdf';
import { recoveryPhraseToEntropy } from './bip39';
import {
  parseWorkspaceHeader,
  unwrapWmkWithPassword,
  unwrapWmkWithRecoveryPhrase,
  decryptSecretStream,
} from './envelope';
import { CRYPTO_CONSTANTS } from './constants';
import testVectors from '../../../../specs/encryption-format/test_vectors.json';

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/^0x/i, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

describe('Cryptographic Engine & Test Vectors Parity', () => {
  it('passes Argon2id Password KEK test vector bit-for-bit', async () => {
    const salt = hexToBytes(testVectors.kdf.password_salt_hex);
    const kek = await deriveKekFromPassword(
      testVectors.kdf.password,
      salt,
      2, // opslimit
      67108864 // memlimit (64 MB)
    );

    expect(bytesToHex(kek)).toBe(testVectors.kdf.derived_password_kek_hex);
  });

  it('passes BIP-39 recovery entropy decoding and Argon2id KEK test vector', async () => {
    const entropy = recoveryPhraseToEntropy(testVectors.kdf.recovery_phrase);
    expect(bytesToHex(entropy)).toBe(testVectors.kdf.recovery_entropy_hex);

    const salt = hexToBytes(testVectors.kdf.recovery_salt_hex);
    const kek = await deriveKekFromRecoveryEntropy(
      entropy,
      salt,
      2,
      67108864
    );

    expect(bytesToHex(kek)).toBe(testVectors.kdf.derived_recovery_kek_hex);
  });

  it('passes BLAKE2b Subkey Derivation test vectors bit-for-bit', async () => {
    const wmk = hexToBytes(testVectors.subkeys.wmk_hex);
    const fileId = hexToBytes(testVectors.subkeys.file_id_hex);

    // Derived file key
    const fileKey = await deriveFileKey(wmk, fileId);
    expect(bytesToHex(fileKey)).toBe(testVectors.subkeys.derived_file_key_hex);

    // Derived index key
    const indexKey = await deriveIndexKey(wmk);
    expect(bytesToHex(indexKey)).toBe(testVectors.subkeys.derived_index_key_hex);
  });

  it('correctly unwraps WMK from a 246-byte header with both password and recovery phrase', async () => {
    const s = await getSodium();
    const wmk = hexToBytes(testVectors.subkeys.wmk_hex);

    const pwdSalt = hexToBytes(testVectors.kdf.password_salt_hex);
    const recSalt = hexToBytes(testVectors.kdf.recovery_salt_hex);
    const pwdNonce = s.randombytes_buf(CRYPTO_CONSTANTS.NONCE_BYTES);
    const recNonce = s.randombytes_buf(CRYPTO_CONSTANTS.NONCE_BYTES);

    const pwdKek = hexToBytes(testVectors.kdf.derived_password_kek_hex);
    const recKek = hexToBytes(testVectors.kdf.derived_recovery_kek_hex);

    const wrappedPwd = s.crypto_secretbox_easy(wmk, pwdNonce, pwdKek);
    const wrappedRec = s.crypto_secretbox_easy(wmk, recNonce, recKek);

    // Build 246-byte header
    const headerBytes = new Uint8Array(246);
    const view = new DataView(headerBytes.buffer);

    // Magic (4B)
    headerBytes.set(new TextEncoder().encode('SWH1'), 0);
    // Version (2B)
    view.setUint16(4, 1, false);
    // Workspace ID (16B)
    headerBytes.set(hexToBytes('0102030405060708090a0b0c0d0e0f10'), 6);
    // opslimit (4B) & memlimit (4B)
    view.setUint32(22, 2, false);
    view.setUint32(26, 67108864, false);
    // passwordSalt (16B)
    headerBytes.set(pwdSalt, 30);
    // recoverySalt (16B)
    headerBytes.set(recSalt, 46);
    // passwordNonce (24B)
    headerBytes.set(pwdNonce, 62);
    // wrappedWmkPassword (48B)
    headerBytes.set(wrappedPwd, 86);
    // recoveryNonce (24B)
    headerBytes.set(recNonce, 134);
    // wrappedWmkRecovery (48B)
    headerBytes.set(wrappedRec, 158);
    // createdAtMs (8B)
    view.setBigInt64(206, BigInt(1700000000000), false);
    // Name (32B)
    const nameBytes = new TextEncoder().encode('Personal Vault');
    headerBytes.set(nameBytes, 214);

    const parsedHeader = parseWorkspaceHeader(headerBytes);
    expect(parsedHeader.name).toBe('Personal Vault');
    expect(parsedHeader.opslimit).toBe(2);
    expect(parsedHeader.memlimit).toBe(67108864);

    // Test unwrap with password
    const unwrappedFromPwd = await unwrapWmkWithPassword(parsedHeader, testVectors.kdf.password);
    expect(bytesToHex(unwrappedFromPwd)).toBe(testVectors.subkeys.wmk_hex);

    // Test unwrap with recovery phrase
    const unwrappedFromRec = await unwrapWmkWithRecoveryPhrase(parsedHeader, testVectors.kdf.recovery_phrase);
    expect(bytesToHex(unwrappedFromRec)).toBe(testVectors.subkeys.wmk_hex);
  });

  it('roundtrips multi-chunk SecretStream envelope decryption (SWF1)', async () => {
    const s = await getSodium();
    const key = hexToBytes(testVectors.subkeys.derived_file_key_hex);

    // Generate 150 KB test payload (spans 3 chunks: 64KB + 64KB + 22KB)
    const plaintext = new Uint8Array(150 * 1024);
    for (let i = 0; i < plaintext.length; i++) {
      plaintext[i] = (i * 7 + 13) & 0xff;
    }

    // Encrypt in SecretStream chunks
    const statePush = s.crypto_secretstream_xchacha20poly1305_init_push(key);
    const header = statePush.header;

    const chunk1 = plaintext.subarray(0, 65536);
    const chunk2 = plaintext.subarray(65536, 131072);
    const chunk3 = plaintext.subarray(131072);

    const c1 = s.crypto_secretstream_xchacha20poly1305_push(
      statePush.state,
      chunk1,
      null,
      s.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
    );
    const c2 = s.crypto_secretstream_xchacha20poly1305_push(
      statePush.state,
      chunk2,
      null,
      s.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
    );
    const c3 = s.crypto_secretstream_xchacha20poly1305_push(
      statePush.state,
      chunk3,
      null,
      s.crypto_secretstream_xchacha20poly1305_TAG_FINAL
    );

    // Assemble SWF1 envelope: [SWF1] [0x0001] [Header 24B] + ([len 4B] [c1]) + ([len 4B] [c2]) + ([len 4B] [c3])
    const totalLen = 4 + 2 + 24 + (4 + c1.length) + (4 + c2.length) + (4 + c3.length);
    const envelope = new Uint8Array(totalLen);
    const view = new DataView(envelope.buffer);

    envelope.set(new TextEncoder().encode('SWF1'), 0);
    view.setUint16(4, 1, false);
    envelope.set(header, 6);

    let offset = 30;
    view.setUint32(offset, c1.length, false);
    offset += 4;
    envelope.set(c1, offset);
    offset += c1.length;

    view.setUint32(offset, c2.length, false);
    offset += 4;
    envelope.set(c2, offset);
    offset += c2.length;

    view.setUint32(offset, c3.length, false);
    offset += 4;
    envelope.set(c3, offset);
    offset += c3.length;

    // Decrypt with decryptSecretStream
    const decrypted = await decryptSecretStream(envelope, key);

    expect(decrypted.length).toBe(plaintext.length);
    expect(decrypted).toEqual(plaintext);
  });
});
