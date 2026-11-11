"""
SecureWorkspace Daemon - Headless CLI / Sidecar Process.
Provides a JSON Lines IPC bridge over stdin/stdout for Tauri (Desktop) and CLI hosts.
Calls SecureWorkspaceAPI.dispatch() to execute commands against the core.
"""

from io import TextIOBase
import json
import logging
import os
import signal
import sys
from typing import Any, Dict, Optional, TextIO

from secureworkspace_core.api import APIErrorCode, SecureWorkspaceAPI, error_response, success_response

# Configure logger to output STRICTLY to stderr, preserving stdout for IPC
logger = logging.getLogger("secureworkspace.daemon")


class DaemonServer:
    """
    Manages the lifecycle and stdin/stdout JSON lines loop for SecureWorkspaceAPI.
    """

    DAEMON_VERSION = "0.1.0"

    def __init__(
        self,
        api: Optional[SecureWorkspaceAPI] = None,
        stdin_stream: Optional[TextIO] = None,
        stdout_stream: Optional[TextIO] = None,
        stderr_stream: Optional[TextIO] = None,
    ):
        self.api = api or SecureWorkspaceAPI()
        self.stdin = stdin_stream or sys.stdin
        self.stdout = stdout_stream or sys.stdout
        self.stderr = stderr_stream or sys.stderr
        self._running = False

    def handle_line(self, line: str) -> Optional[str]:
        """
        Processes a single input JSON line and returns the response JSON string.
        Returns None if line was blank/whitespace.
        """
        line = line.strip()
        if not line:
            return None

        # 1. Parse JSON Request
        try:
            req: Dict[str, Any] = json.loads(line)
        except Exception as e:
            logger.warning(f"Malformed JSON received: {e}")
            resp = error_response(APIErrorCode.INVALID_ARGUMENT, f"Malformed JSON: {e}")
            return json.dumps(resp)

        if not isinstance(req, dict):
            resp = error_response(APIErrorCode.INVALID_ARGUMENT, "Request must be a JSON object")
            return json.dumps(resp)

        req_id = req.get("id")
        method = req.get("method")

        if not method or not isinstance(method, str):
            resp = error_response(APIErrorCode.INVALID_ARGUMENT, "Missing or invalid 'method' field")
            if req_id is not None:
                resp["id"] = req_id
            return json.dumps(resp)

        # 2. Validate Params Format
        raw_params = req.get("params", {})
        if isinstance(raw_params, dict):
            params_json = json.dumps(raw_params)
        elif isinstance(raw_params, str):
            params_json = raw_params
        elif raw_params is None:
            params_json = "{}"
        else:
            resp = error_response(APIErrorCode.INVALID_ARGUMENT, "'params' must be an object or JSON string")
            if req_id is not None:
                resp["id"] = req_id
            return json.dumps(resp)

        # 3. Handle Daemon-level Commands
        if method == "ping":
            resp = success_response(data={"pong": True, "version": self.DAEMON_VERSION})
            if req_id is not None:
                resp["id"] = req_id
            return json.dumps(resp)

        if method in ("exit", "quit", "shutdown"):
            logger.info("Received daemon shutdown request")
            self._running = False
            # Safely lock workspace on shutdown if active
            try:
                if getattr(self.api, "_wmk", None) is not None:
                    self.api.workspace_lock()
            except Exception as e:
                logger.error(f"Error locking workspace on shutdown: {e}")

            resp = success_response(data={"status": "exiting"})
            if req_id is not None:
                resp["id"] = req_id
            return json.dumps(resp)

        # 4. Route to SecureWorkspaceAPI
        raw_api_resp = self.api.dispatch(method, params_json)

        # 4. Attach Request ID if present
        try:
            resp_obj = json.loads(raw_api_resp)
        except Exception:
            resp_obj = error_response(APIErrorCode.INTERNAL_ERROR, "API returned invalid JSON response")

        if req_id is not None:
            resp_obj["id"] = req_id

        return json.dumps(resp_obj)

    def run(self) -> int:
        """
        Executes the main I/O loop until EOF or shutdown command.
        Returns 0 on success.
        """
        self._running = True
        logger.info(f"SecureWorkspace Daemon v{self.DAEMON_VERSION} started")

        try:
            while self._running:
                line = self.stdin.readline()
                if not line:
                    # End of Stream (parent process closed stdin / terminated)
                    logger.info("Stdin EOF encountered. Exiting.")
                    break

                response = self.handle_line(line)
                if response is not None:
                    self.stdout.write(response + "\n")
                    self.stdout.flush()

        except KeyboardInterrupt:
            logger.info("Daemon received KeyboardInterrupt. Exiting.")
        except Exception as e:
            logger.exception(f"Unexpected exception in daemon loop: {e}")
            return 1
        finally:
            self._running = False
            try:
                if getattr(self.api, "_wmk", None) is not None:
                    self.api.workspace_lock()
            except Exception:
                pass
            logger.info("SecureWorkspace Daemon stopped")

        return 0


def setup_logging(stream: Optional[TextIO] = None) -> None:
    log_level = os.environ.get("SECUREWORKSPACE_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, log_level, logging.INFO)
    handler = logging.StreamHandler(stream or sys.stderr)
    formatter = logging.Formatter("[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.setLevel(level)
    if not logger.handlers:
        logger.addHandler(handler)


def main() -> int:
    setup_logging()

    daemon = DaemonServer()

    # Register OS signal handlers for graceful shutdown
    def _sig_handler(signum, frame):
        logger.info(f"Received signal {signum}, initiating clean shutdown")
        daemon._running = False
        try:
            if getattr(daemon.api, "_wmk", None) is not None:
                daemon.api.workspace_lock()
        except Exception:
            pass
        sys.exit(0)

    try:
        signal.signal(signal.SIGINT, _sig_handler)
    except (ValueError, AttributeError):
        pass

    try:
        signal.signal(signal.SIGTERM, _sig_handler)
    except (ValueError, AttributeError):
        pass

    return daemon.run()


if __name__ == "__main__":
    sys.exit(main())
