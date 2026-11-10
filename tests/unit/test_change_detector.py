"""
Unit tests for ChangeDetector.
Tests fast (size, mtime) checks, streaming SHA-256 fallback,
ignore patterns (.secureworkspace, .git, Thumbs.db, .DS_Store),
and categorization into SYNCED, NEW, MODIFIED, and DELETED.
"""

import os
from pathlib import Path
import time
import pytest
import nacl.utils

from secureworkspace_core.workspace.change_detector import (
    ChangeDetector,
    compute_file_sha256,
)
from secureworkspace_core.workspace.db import FileRecord, WorkspaceDB


@pytest.fixture
def meta_key() -> bytes:
    return nacl.utils.random(32)


@pytest.fixture
def workspace_setup(tmp_path: Path, meta_key: bytes):
    ws_dir = tmp_path / "test_workspace"
    ws_dir.mkdir(parents=True, exist_ok=True)
    db_path = ws_dir / ".secureworkspace" / "metadata.db"
    db = WorkspaceDB(db_path, meta_key)
    yield ws_dir, db
    db.close()


def test_empty_workspace(workspace_setup):
    ws_dir, db = workspace_setup
    detector = ChangeDetector(ws_dir, db)
    result = detector.scan()

    assert not result.has_changes
    assert result.total_changes == 0
    assert len(result.new_files) == 0
    assert len(result.modified_files) == 0
    assert len(result.deleted_files) == 0
    assert len(result.synced_files) == 0


def test_new_files_detection(workspace_setup):
    ws_dir, db = workspace_setup

    # Create files on disk
    f1 = ws_dir / "notes.txt"
    f1.write_text("Hello world", encoding="utf-8")

    sub = ws_dir / "project" / "sub"
    sub.mkdir(parents=True, exist_ok=True)
    f2 = sub / "code.py"
    f2.write_text("print('test')", encoding="utf-8")

    detector = ChangeDetector(ws_dir, db)
    result = detector.scan()

    assert result.has_changes
    assert result.total_changes == 2
    assert len(result.new_files) == 2

    paths = {f.path for f in result.new_files}
    assert paths == {"notes.txt", "project/sub/code.py"}
    for f in result.new_files:
        assert f.status == "NEW"
        assert f.sha256 is not None
        assert f.size > 0


def test_synced_and_modified_files(workspace_setup):
    ws_dir, db = workspace_setup

    file_path = ws_dir / "doc.txt"
    file_path.write_bytes(b"initial content 123")
    stat = file_path.stat()
    sha256 = compute_file_sha256(file_path)

    # Record in DB as SYNCED
    record = FileRecord(
        file_id="fid_001",
        path="doc.txt",
        size=stat.st_size,
        mtime_ms=int(stat.st_mtime * 1000),
        sha256=sha256,
        sync_status="SYNCED",
    )
    db.upsert_file(record)

    detector = ChangeDetector(ws_dir, db)

    # 1. Immediate scan: exactly matches size and mtime -> SYNCED
    res1 = detector.scan()
    assert not res1.has_changes
    assert len(res1.synced_files) == 1
    assert res1.synced_files[0].path == "doc.txt"

    # 2. Content modified: same size, different bytes
    file_path.write_bytes(b"initial content 456")
    res2 = detector.scan()
    assert res2.has_changes
    assert len(res2.modified_files) == 1
    assert res2.modified_files[0].path == "doc.txt"

    # 3. Size changed:
    file_path.write_bytes(b"longer content appended to file")
    res3 = detector.scan()
    assert res3.has_changes
    assert len(res3.modified_files) == 1
    assert res3.modified_files[0].size == len(b"longer content appended to file")


def test_mtime_touched_with_identical_content(workspace_setup):
    ws_dir, db = workspace_setup

    file_path = ws_dir / "untouched.txt"
    content = b"Exact same content across mtime touches"
    file_path.write_bytes(content)
    sha256 = compute_file_sha256(file_path)

    # Insert into DB with an older mtime
    record = FileRecord(
        file_id="fid_002",
        path="untouched.txt",
        size=len(content),
        mtime_ms=int((time.time() - 3600) * 1000),
        sha256=sha256,
        sync_status="SYNCED",
    )
    db.upsert_file(record)

    detector = ChangeDetector(ws_dir, db)

    # When quick=False: SHA-256 matches, correctly identified as SYNCED!
    res = detector.scan(quick=False)
    assert not res.has_changes
    assert len(res.synced_files) == 1
    assert res.synced_files[0].path == "untouched.txt"


def test_deleted_files_detection(workspace_setup):
    ws_dir, db = workspace_setup

    # Record a file in DB that does NOT exist on disk
    record = FileRecord(
        file_id="fid_003",
        path="missing.txt",
        size=100,
        mtime_ms=1000,
        sha256="fakehash",
        sync_status="SYNCED",
    )
    db.upsert_file(record)

    # Also record an already DELETED file
    deleted_record = FileRecord(
        file_id="fid_004",
        path="already_deleted.txt",
        size=50,
        mtime_ms=1000,
        sha256="fakehash2",
        sync_status="DELETED",
    )
    db.upsert_file(deleted_record)

    detector = ChangeDetector(ws_dir, db)
    res = detector.scan()

    assert res.has_changes
    assert len(res.deleted_files) == 1
    assert res.deleted_files[0].path == "missing.txt"
    assert res.deleted_files[0].status == "DELETED"


def test_ignore_patterns(workspace_setup):
    ws_dir, db = workspace_setup

    # 1. .secureworkspace directory and files
    sw_file = ws_dir / ".secureworkspace" / "metadata.db"
    assert sw_file.exists()

    # 2. .git directory and files
    git_dir = ws_dir / ".git" / "objects"
    git_dir.mkdir(parents=True, exist_ok=True)
    (git_dir / "pack1.pack").write_bytes(b"git object")

    # 3. System junk
    (ws_dir / "Thumbs.db").write_bytes(b"thumbs")
    (ws_dir / ".DS_Store").write_bytes(b"ds_store")
    (ws_dir / "desktop.ini").write_bytes(b"desktop_ini")

    # 4. __pycache__ and .pyc
    pycache = ws_dir / "src" / "__pycache__"
    pycache.mkdir(parents=True, exist_ok=True)
    (pycache / "module.cpython-312.pyc").write_bytes(b"pyc")

    # 5. Normal tracked file
    (ws_dir / "src" / "valid.py").write_text("print('hello')", encoding="utf-8")

    # 6. Custom ignored file
    (ws_dir / "debug.log").write_text("log output", encoding="utf-8")

    detector = ChangeDetector(ws_dir, db, ignore_patterns=["*.log"])
    res = detector.scan()

    # Only valid.py should be detected
    assert len(res.new_files) == 1
    assert res.new_files[0].path == "src/valid.py"
