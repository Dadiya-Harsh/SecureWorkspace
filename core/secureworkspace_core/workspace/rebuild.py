"""
Metadata database rebuilder for SecureWorkspace.
Reconstructs the SQLite metadata database from an in-memory or encrypted WorkspaceCatalog (SWC1).
"""

from pathlib import Path
from typing import Optional

from secureworkspace_core.crypto.keys import derive_meta_key
from secureworkspace_core.workspace.catalog import WorkspaceCatalog
from secureworkspace_core.workspace.db import FileRecord, WorkspaceDB


def rebuild_db_from_catalog(
    catalog: WorkspaceCatalog,
    db: WorkspaceDB,
    base_version: int = 1,
    clear_existing: bool = False,
) -> int:
    """
    Rebuilds the SQLite metadata database from a WorkspaceCatalog.
    Populates the 'files' table with zero-plaintext encrypted paths and updates 'workspace_state'.
    Returns the number of restored file records.
    """
    if clear_existing:
        with db.conn:
            db.conn.execute("DELETE FROM files")

    restored_count = 0
    entries = catalog.list_entries()

    for entry in entries:
        record = FileRecord(
            file_id=entry.file_id_hex,
            path=entry.path,
            size=entry.size,
            mtime_ms=entry.mtime_ms,
            sha256=entry.sha256,
            sync_status="SYNCED",
        )
        db.upsert_file(record)
        restored_count += 1

    db.set_state("base_version", str(base_version))
    return restored_count


def rebuild_db_from_encrypted_catalog(
    catalog_ciphertext: bytes,
    wmk: bytes,
    db: WorkspaceDB,
    base_version: int = 1,
    clear_existing: bool = False,
) -> int:
    """
    Decrypts an encrypted SWC1 catalog blob using WMK and rebuilds the SQLite database.
    Returns the number of restored file records.
    """
    catalog = WorkspaceCatalog.deserialize_encrypted(catalog_ciphertext, wmk)
    return rebuild_db_from_catalog(
        catalog=catalog,
        db=db,
        base_version=base_version,
        clear_existing=clear_existing,
    )


def rebuild_workspace_db(
    catalog_ciphertext: bytes,
    wmk: bytes,
    db_path: str | Path,
    base_version: int = 1,
) -> int:
    """
    Convenience function to derive meta_key from WMK, open the WorkspaceDB at db_path,
    and rebuild it completely from an encrypted catalog.
    """
    meta_key = derive_meta_key(wmk)
    with WorkspaceDB(db_path, meta_key) as db:
        return rebuild_db_from_encrypted_catalog(
            catalog_ciphertext=catalog_ciphertext,
            wmk=wmk,
            db=db,
            base_version=base_version,
            clear_existing=True,
        )
