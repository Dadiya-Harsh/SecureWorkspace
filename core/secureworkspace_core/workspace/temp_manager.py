"""
Safe temporary file manager for SecureWorkspace.
Ensures zero lingering plaintext files on disk via managed staging and secure overwrite cleanup.
"""

import atexit
from contextlib import contextmanager
import os
from pathlib import Path
import secrets
import time
from typing import Generator, List, Optional


class TempFileManager:
    """
    Manages temporary files staged during encryption, decryption, and editing.
    Ensures safe, bounded lifetimes and overwrite cleanup.
    """

    def __init__(self, temp_dir: str | Path, auto_clean_on_exit: bool = True):
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self._tracked_files: set[Path] = set()

        if auto_clean_on_exit:
            atexit.register(self.cleanup_all)

    def create_temp_file(self, suffix: str = "", prefix: str = "sw_tmp_") -> Path:
        """
        Creates a new empty temporary file with random name in managed directory.
        """
        random_tag = secrets.token_hex(8)
        filename = f"{prefix}{random_tag}{suffix}"
        path = self.temp_dir / filename
        path.touch(mode=0o600, exist_ok=False)
        self._tracked_files.add(path)
        return path

    @contextmanager
    def temp_file(
        self, suffix: str = "", prefix: str = "sw_tmp_"
    ) -> Generator[Path, None, None]:
        """Context manager for temporary file that is guaranteed to be securely cleaned up."""
        path = self.create_temp_file(suffix=suffix, prefix=prefix)
        try:
            yield path
        finally:
            self.secure_delete(path)

    @staticmethod
    def secure_delete(path: Path) -> bool:
        """
        Overwrites file contents with zeros before unlinking to prevent data remnants.
        Returns True if deleted, False if file did not exist.
        """
        if not path.is_file():
            return False

        try:
            size = path.stat().st_size
            if size > 0:
                with open(path, "r+b") as f:
                    # Overwrite in chunks
                    remaining = size
                    chunk_sz = 64 * 1024
                    zeros = b"\x00" * chunk_sz
                    while remaining > 0:
                        write_len = min(remaining, chunk_sz)
                        f.write(zeros[:write_len])
                        remaining -= write_len
                    f.flush()
                    os.fsync(f.fileno())
        except OSError:
            # File might be read-only or opened elsewhere, continue to attempt unlink
            pass

        try:
            path.unlink(missing_ok=True)
            return True
        except OSError:
            return False

    def cleanup_temp(self, max_age_seconds: float = 0.0) -> int:
        """
        Cleans up temporary files in temp_dir older than max_age_seconds.
        If max_age_seconds <= 0, deletes all files in temp_dir.
        Returns count of files cleaned.
        """
        count = 0
        now = time.time()

        if not self.temp_dir.exists():
            return 0

        for item in self.temp_dir.iterdir():
            if item.is_file():
                try:
                    mtime = item.stat().st_mtime
                    if max_age_seconds <= 0.0 or (now - mtime) >= max_age_seconds:
                        if self.secure_delete(item):
                            count += 1
                            self._tracked_files.discard(item)
                except OSError:
                    continue

        return count

    def cleanup_all(self) -> int:
        """Cleans up all tracked and untracked files in the managed temp directory."""
        return self.cleanup_temp(max_age_seconds=0.0)
