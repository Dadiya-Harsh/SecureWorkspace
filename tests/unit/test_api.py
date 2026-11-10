"""
Unit tests for Core Public JSON API Facade (SecureWorkspaceAPI).
Validates every endpoint in the PRD Section 7 API contract,
structured JSON response envelopes, error codes, and Chaquopy dispatch IPC.
"""

import json
from pathlib import Path
import pytest

from secureworkspace_core.api import APIErrorCode, SecureWorkspaceAPI
from secureworkspace_core.storage.mock import MockStorageAdapter


@pytest.fixture
def api() -> SecureWorkspaceAPI:
    return SecureWorkspaceAPI()


def test_workspace_create_and_recovery_verification(tmp_path: Path, api: SecureWorkspaceAPI):
    ws_dir = tmp_path / "test_ws"

    # 1. Invalid short password
    short_res = api.workspace_create(str(ws_dir), "My Vault", "short")
    assert not short_res["success"]
    assert short_res["error_code"] == APIErrorCode.INVALID_ARGUMENT

    # 2. Valid creation
    create_res = api.workspace_create(str(ws_dir), "My Vault", "ValidPassword#2026")
    assert create_res["success"]
    assert "recovery_phrase" in create_res["data"]
    recovery_phrase = create_res["data"]["recovery_phrase"]
    assert len(recovery_phrase.split()) == 24
    assert (ws_dir / "workspace.header").is_file()

    # 3. Duplicate creation fails
    dup_res = api.workspace_create(str(ws_dir), "My Vault", "ValidPassword#2026")
    assert not dup_res["success"]
    assert dup_res["error_code"] == APIErrorCode.INVALID_ARGUMENT

    # 4. Recovery test verification
    # Wrong phrase
    bad_verify = api.verify_recovery_test("abandon " * 24)
    assert not bad_verify["success"]
    assert bad_verify["error_code"] == APIErrorCode.WRONG_PASSWORD

    # Correct phrase
    good_verify = api.verify_recovery_test(recovery_phrase)
    assert good_verify["success"]
    assert good_verify["data"]["verified"] is True

    api.workspace_lock()


def test_workspace_lock_and_unlock(tmp_path: Path, api: SecureWorkspaceAPI):
    ws_dir = tmp_path / "lock_test_ws"
    create_res = api.workspace_create(str(ws_dir), "Test Lock", "Password123#")
    rec_phrase = create_res["data"]["recovery_phrase"]

    # Lock workspace
    lock_res = api.workspace_lock()
    assert lock_res["success"]

    # Calling file ops while locked fails
    list_res = api.list_files()
    assert not list_res["success"]
    assert list_res["error_code"] == APIErrorCode.NOT_UNLOCKED

    # Unlock with wrong password fails
    bad_unlock = api.workspace_unlock(str(ws_dir), "WrongPassword#")
    assert not bad_unlock["success"]
    assert bad_unlock["error_code"] == APIErrorCode.WRONG_PASSWORD

    # Unlock with correct password succeeds
    good_unlock = api.workspace_unlock(str(ws_dir), "Password123#")
    assert good_unlock["success"]
    assert api.is_unlocked()["data"]["is_unlocked"] is True

    # Lock again and unlock with 24-word recovery phrase
    api.workspace_lock()
    rec_unlock = api.workspace_unlock(str(ws_dir), rec_phrase)
    assert rec_unlock["success"]
    assert api.is_unlocked()["data"]["is_unlocked"] is True

    api.workspace_lock()


def test_change_password_and_regenerate_recovery(tmp_path: Path, api: SecureWorkspaceAPI):
    ws_dir = tmp_path / "cred_test_ws"
    create_res = api.workspace_create(str(ws_dir), "Cred Vault", "OldPassword#1")
    old_phrase = create_res["data"]["recovery_phrase"]

    # 1. Change password
    chg_res = api.change_password("BrandNewPassword#2026")
    assert chg_res["success"]

    api.workspace_lock()

    # Old password fails
    assert not api.workspace_unlock(str(ws_dir), "OldPassword#1")["success"]
    # New password succeeds
    assert api.workspace_unlock(str(ws_dir), "BrandNewPassword#2026")["success"]

    # 2. Regenerate recovery phrase
    regen_res = api.regenerate_recovery_phrase()
    assert regen_res["success"]
    new_phrase = regen_res["data"]["new_recovery_phrase"]
    assert new_phrase != old_phrase

    api.workspace_lock()
    # Old phrase fails
    assert not api.workspace_unlock(str(ws_dir), old_phrase)["success"]
    # New phrase succeeds
    assert api.workspace_unlock(str(ws_dir), new_phrase)["success"]

    api.workspace_lock()


def test_file_operations_and_open_save_flow(tmp_path: Path, api: SecureWorkspaceAPI):
    ws_dir = tmp_path / "files_ws"
    api.workspace_create(str(ws_dir), "Files Vault", "SecurePassword#")

    # Prepare external file to add
    external_file = tmp_path / "external_source.txt"
    external_file.write_text("Hello from external file", encoding="utf-8")

    # 1. Add file
    add_res = api.add_file(str(external_file), "docs/sample.txt")
    assert add_res["success"]
    assert (ws_dir / "docs" / "sample.txt").is_file()

    # 2. Open file (stages in managed temp location)
    open_res = api.open_file("docs/sample.txt")
    assert open_res["success"]
    temp_path = Path(open_res["data"]["temp_path"])
    assert temp_path.is_file()
    assert temp_path.read_text(encoding="utf-8") == "Hello from external file"

    # 3. Edit temp file and save back
    temp_path.write_text("Edited content in external editor", encoding="utf-8")
    save_res = api.save_file("docs/sample.txt", str(temp_path))
    assert save_res["success"]
    assert (ws_dir / "docs" / "sample.txt").read_text(encoding="utf-8") == "Edited content in external editor"
    # Temp file should be securely deleted
    assert not temp_path.exists()

    # 4. Delete file
    del_res = api.delete_file("docs/sample.txt")
    assert del_res["success"]
    assert not (ws_dir / "docs" / "sample.txt").exists()

    api.workspace_lock()


def test_sync_operations_lifecycle(tmp_path: Path, api: SecureWorkspaceAPI):
    ws_dir = tmp_path / "sync_ws"
    api.workspace_create(str(ws_dir), "Sync Vault", "SecurePassword#")

    # Calling sync before storage connected fails
    st_no_storage = api.status()
    assert not st_no_storage["success"]
    assert st_no_storage["error_code"] == APIErrorCode.STORAGE_NOT_CONNECTED

    # Connect storage
    mock_storage = MockStorageAdapter()
    api.connect_storage(mock_storage)

    # Add a file
    (ws_dir / "project.md").write_text("# Project Notes", encoding="utf-8")

    # Status check
    st_res = api.status()
    assert st_res["success"]
    assert st_res["data"]["has_local_changes"] is True
    assert st_res["data"]["remote_head"] == 0

    # Push Preview & Push v1
    prev_push = api.push_preview()
    assert prev_push["success"]
    assert prev_push["data"]["upload_count"] == 1

    push_res = api.push(message="Add project notes")
    assert push_res["success"]
    assert push_res["data"]["new_version"] == 1

    # Status is now clean
    st_after = api.status()
    assert st_after["data"]["is_up_to_date"] is True

    # List remote versions
    versions_res = api.list_remote_versions()
    assert versions_res["success"]
    assert len(versions_res["data"]["versions"]) == 1

    # List file versions
    file_vers = api.list_versions("project.md")
    assert file_vers["success"]
    assert len(file_vers["data"]["versions"]) == 1

    api.workspace_lock()


def test_chaquopy_json_dispatcher_ipc(tmp_path: Path, api: SecureWorkspaceAPI):
    ws_dir = tmp_path / "ipc_ws"

    # 1. Invalid method name
    bad_call = api.dispatch("non_existent_method", "{}")
    bad_dict = json.loads(bad_call)
    assert not bad_dict["success"]
    assert bad_dict["error_code"] == APIErrorCode.INVALID_ARGUMENT

    # 2. workspace_create via JSON string
    create_params = json.dumps(
        {
            "workspace_path": str(ws_dir),
            "name": "IPC Vault",
            "password": "PasswordForIPC#2026",
        }
    )
    create_call = api.dispatch("workspace_create", create_params)
    create_dict = json.loads(create_call)
    assert create_dict["success"]
    assert "recovery_phrase" in create_dict["data"]

    # 3. is_unlocked via JSON string
    status_call = api.dispatch("is_unlocked", "{}")
    status_dict = json.loads(status_call)
    assert status_dict["success"]
    assert status_dict["data"]["is_unlocked"] is True
    assert status_dict["data"]["name"] == "IPC Vault"

    # 4. workspace_lock via JSON string
    lock_call = api.dispatch("workspace_lock", "{}")
    lock_dict = json.loads(lock_call)
    assert lock_dict["success"]
    assert lock_dict["data"]["locked"] is True
