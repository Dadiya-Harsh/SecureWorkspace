export const CRYPTO_CONSTANTS = {
  HEADER_MAGIC: "SWH1",
  FILE_MAGIC: "SWF1",
  CATALOG_MAGIC: "SWC1",
  FORMAT_VERSION: 1,
  EXPECTED_HEADER_SIZE: 246,

  KEY_BYTES: 32,
  NONCE_BYTES: 24,
  SALT_BYTES: 16,
  SECRETSTREAM_HEADER_BYTES: 24,
  TAG_BYTES: 17, // 1 byte tag + 16 bytes Poly1305 MAC
  CHUNK_SIZE: 65536, // 64 KB

  // BLAKE2b personalization strings (exactly 8 ASCII characters)
  CONTEXT_FILE_KEY: "SW_FKEY_",
  CONTEXT_INDEX_KEY: "SW_INDX_",
  CONTEXT_META_KEY: "SW_META_",

  // Argon2id interactive limits (matching Python core)
  ARGON2_OPSLIMIT_INTERACTIVE: 3,
  ARGON2_MEMLIMIT_INTERACTIVE: 67108864, // 64 MB (65536 KiB)

  // Default Argon2 params for hash-wasm
  ARGON2_PARAMS: {
    memorySize: 65536, // in KiB
    iterations: 3,
    parallelism: 1,
    hashLength: 32,
  },
} as const;
