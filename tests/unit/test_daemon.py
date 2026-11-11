"""
Unit tests for SecureWorkspace Daemon IPC (stdin/stdout JSON lines).
"""

from io import StringIO
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import pytest

from secureworkspace_core.api import APIErrorCode, SecureWorkspaceAPI
from secureworkspace_core.daemon import DaemonServer
from secureworkspace_core.storage.mock import MockStorageAdapter


@pytest.fixture
def temp_ws_dir():
    with tempfile.TemporaryDirectory() as tmp:
        yield Path(tmp)


def test_daemon_ping_and_version():
    """Verify built-in ping handshake command with request id correlation."""
    daemon = DaemonServer()

    # Ping without id
    resp_raw = daemon.handle_line('{"method": "ping"}')
    assert resp_raw is not None
    resp = json.loads(resp_raw)
    assert resp["success"] is True
    assert resp["data"]["pong"] is True
    assert resp["data"]["version"] == DaemonServer.DAEMON_VERSION
    assert "id" not in resp

    # Ping with id
    resp_raw = daemon.handle_line('{"id": "req-123", "method": "ping"}')
    assert resp_raw is not None
    resp = json.loads(resp_raw)
    assert resp["success"] is True
    assert resp["id"] == "req-123"
    assert resp["data"]["pong"] is True


def test_daemon_malformed_input():
    """Verify graceful error responses for malformed JSON and bad requests."""
    daemon = DaemonServer()

    # Empty / whitespace line returns None
    assert daemon.handle_line("   \n") is None

    # Invalid JSON
    resp_raw = daemon.handle_line("{invalid json")
    assert resp_raw is not None
    resp = json.loads(resp_raw)
    assert resp["success"] is False
    assert resp["error_code"] == APIErrorCode.INVALID_ARGUMENT

    # JSON Array instead of Object
    resp_raw = daemon.handle_line("[1, 2, 3]")
    assert resp_raw is not None
    resp = json.loads(resp_raw)
    assert resp["success"] is False
    assert resp["error_code"] == APIErrorCode.INVALID_ARGUMENT

    # Missing method
    resp_raw = daemon.handle_line('{"id": 42}')
    assert resp_raw is not None
    resp = json.loads(resp_raw)
    assert resp["success"] is False
    assert resp["id"] == 42
    assert "method" in resp["message"].lower()

    # Invalid params type
    resp_raw = daemon.handle_line('{"id": 43, "method": "ping", "params": 12345}')
    assert resp_raw is not None
    resp = json.loads(resp_raw)
    assert resp["success"] is False
    assert resp["id"] == 43


def test_daemon_api_routing(temp_ws_dir):
    """Verify routing of core API calls through the daemon."""
    daemon = DaemonServer()

    try:
        # 1. Initialize workspace via daemon
        init_cmd = {
            "id": "init-1",
            "method": "workspace_create",
            "params": {
                "workspace_path": str(temp_ws_dir),
                "name": "Daemon Workspace",
                "password": "Password-1234-Daemon-Test",
            },
        }
        resp_raw = daemon.handle_line(json.dumps(init_cmd))
        resp = json.loads(resp_raw)
        assert resp["success"] is True
        assert resp["id"] == "init-1"
        assert "recovery_phrase" in resp["data"]
        recovery_phrase = resp["data"]["recovery_phrase"]

        # 2. Check lock
        resp_raw = daemon.handle_line(json.dumps({"id": "lock-1", "method": "workspace_lock"}))
        resp = json.loads(resp_raw)
        assert resp["success"] is True
        assert resp["id"] == "lock-1"
        assert resp["data"]["locked"] is True

        # 3. Unlock with recovery key
        unlock_cmd = {
            "id": "unlock-1",
            "method": "workspace_unlock",
            "params": {
                "workspace_path": str(temp_ws_dir),
                "password_or_recovery_key": recovery_phrase,
            },
        }
        resp_raw = daemon.handle_line(json.dumps(unlock_cmd))
        resp = json.loads(resp_raw)
        assert resp["success"] is True
        assert resp["id"] == "unlock-1"
        assert "workspace_id" in resp["data"]

        # 4. Query list_files
        list_cmd = {"id": "list-1", "method": "list_files"}
        resp_raw = daemon.handle_line(json.dumps(list_cmd))
        resp = json.loads(resp_raw)
        assert resp["success"] is True
        assert resp["id"] == "list-1"
        assert "files" in resp["data"]

        # 5. Connect mock storage and test status
        daemon.api.connect_storage(MockStorageAdapter())

        status_cmd = {"id": "stat-1", "method": "status"}
        resp_raw = daemon.handle_line(json.dumps(status_cmd))
        resp = json.loads(resp_raw)
        assert resp["success"] is True
        assert resp["id"] == "stat-1"
        assert resp["data"]["is_up_to_date"] is True

    finally:
        if getattr(daemon.api, "_wmk", None) is not None:
            daemon.api.workspace_lock()


def test_daemon_exit_command(temp_ws_dir):
    """Verify exit command locks workspace and terminates run loop."""
    daemon = DaemonServer()
    try:
        daemon.api.workspace_create(
            workspace_path=str(temp_ws_dir),
            name="Exit Test",
            password="Password-1234-Exit",
        )
        assert daemon.api._wmk is not None

        resp_raw = daemon.handle_line('{"id": "exit-1", "method": "exit"}')
        resp = json.loads(resp_raw)
        assert resp["success"] is True
        assert resp["id"] == "exit-1"
        assert resp["data"]["status"] == "exiting"
        assert daemon.api._wmk is None
    finally:
        if getattr(daemon.api, "_wmk", None) is not None:
            daemon.api.workspace_lock()


def test_daemon_run_loop_stream():
    """Verify DaemonServer.run() reading lines from stdin stream and writing to stdout stream."""
    commands = [
        json.dumps({"id": 1, "method": "ping"}),
        json.dumps({"id": 2, "method": "unknown_function"}),
        json.dumps({"id": 3, "method": "quit"}),
    ]
    input_stream = StringIO("\n".join(commands) + "\n")
    output_stream = StringIO()

    daemon = DaemonServer(stdin_stream=input_stream, stdout_stream=output_stream)
    exit_code = daemon.run()
    assert exit_code == 0

    output_lines = [line.strip() for line in output_stream.getvalue().splitlines() if line.strip()]
    assert len(output_lines) == 3

    resp1 = json.loads(output_lines[0])
    assert resp1["id"] == 1
    assert resp1["success"] is True

    resp2 = json.loads(output_lines[1])
    assert resp2["id"] == 2
    assert resp2["success"] is False

    resp3 = json.loads(output_lines[2])
    assert resp3["id"] == 3
    assert resp3["data"]["status"] == "exiting"


def test_daemon_subprocess_execution():
    """Verify real subprocess execution of python -m secureworkspace_core.daemon."""
    python_exe = sys.executable
    proc = subprocess.Popen(
        [python_exe, "-m", "secureworkspace_core.daemon"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=str(Path(__file__).resolve().parent.parent.parent / "core"),
        env=os.environ.copy(),
    )

    try:
        # Send ping
        req = json.dumps({"id": "subproc-1", "method": "ping"}) + "\n"
        proc.stdin.write(req)
        proc.stdin.flush()

        line = proc.stdout.readline()
        resp = json.loads(line)
        assert resp["id"] == "subproc-1"
        assert resp["success"] is True
        assert resp["data"]["pong"] is True

        # Send exit command
        exit_cmd = json.dumps({"id": "subproc-2", "method": "exit"}) + "\n"
        proc.stdin.write(exit_cmd)
        proc.stdin.flush()

        line = proc.stdout.readline()
        resp = json.loads(line)
        assert resp["id"] == "subproc-2"
        assert resp["data"]["status"] == "exiting"

        proc.wait(timeout=5)
        assert proc.returncode == 0

    finally:
        if proc.poll() is None:
            proc.kill()
