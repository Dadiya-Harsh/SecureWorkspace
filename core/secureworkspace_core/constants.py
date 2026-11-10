"""
Global constants for secureworkspace-core.
"""

# Binary Magic Markers
WORKSPACE_HEADER_MAGIC = b"SWH1"  # SecureWorkspace Header v1
FILE_MAGIC = b"SWF1"              # SecureWorkspace File v1
CATALOG_MAGIC = b"SWC1"           # SecureWorkspace Catalog v1

# Format Version
FORMAT_VERSION = 1

# Stream & Buffer Sizes
CHUNK_SIZE = 64 * 1024  # 64 KB chunk size for streaming encryption
HEADER_BYTES = 24       # libsodium secretstream header length
KEY_BYTES = 32          # 256-bit symmetric keys
SALT_BYTES = 16         # 128-bit KDF salts
NONCE_BYTES = 24        # XChaCha20 / SecretBox nonce length
MAC_BYTES = 16          # Poly1305 MAC tag length

# Subkey Contexts (must be exactly 8 bytes for libsodium crypto_kdf)
CONTEXT_FILE_KEY = b"SW_FKEY_"
CONTEXT_INDEX_KEY = b"SW_INDX_"
