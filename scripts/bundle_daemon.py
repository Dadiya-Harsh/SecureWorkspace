#!/usr/bin/env python3
"""
Bundle the SecureWorkspace Python daemon into a standalone Windows binary using PyInstaller.
Places the output in apps/desktop/src-tauri/bin/ for Tauri sidecar packaging.
"""

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

def main():
    repo_root = Path(__file__).resolve().parent.parent
    core_dir = repo_root / "core"
    daemon_entry = core_dir / "secureworkspace_core" / "daemon.py"
    target_bin_dir = repo_root / "apps" / "desktop" / "src-tauri" / "bin"
    target_bin_dir.mkdir(parents=True, exist_ok=True)

    venv_python = repo_root / ".venv" / "Scripts" / "python.exe"
    pyinstaller = repo_root / ".venv" / "Scripts" / "pyinstaller.exe"

    if not pyinstaller.exists():
        print(f"Error: PyInstaller not found at {pyinstaller}")
        sys.exit(1)

    print("=== Building standalone SecureWorkspace daemon ===")
    temp_build_root = Path(tempfile.gettempdir()) / "secureworkspace_daemon_bundle"
    if temp_build_root.exists():
        shutil.rmtree(temp_build_root, ignore_errors=True)
    temp_build_root.mkdir(parents=True, exist_ok=True)

    dist_dir = temp_build_root / "dist"
    work_dir = temp_build_root / "work"
    spec_dir = temp_build_root / "spec"

    cmd = [
        str(pyinstaller),
        "--noconfirm",
        "--onefile",
        "--noconsole",
        "--clean",
        "--name", "secureworkspace-daemon",
        "--distpath", str(dist_dir),
        "--workpath", str(work_dir),
        "--specpath", str(spec_dir),
        "--paths", str(core_dir),
        "--hidden-import", "secureworkspace_core",
        "--hidden-import", "nacl",
        "--hidden-import", "cryptography",
        "--hidden-import", "keyring",
        "--hidden-import", "keyring.backends.Windows",
        "--hidden-import", "win32ctypes",
        "--hidden-import", "google.auth",
        "--hidden-import", "google_auth_oauthlib",
    ]

    # Include desktop client secret in frozen binary if present
    desktop_secret = repo_root / "google outh clients" / "client_secret_desktop.json"
    if desktop_secret.is_file():
        cmd.extend(["--add-data", f"{desktop_secret};."])
        print(f"Bundling desktop OAuth credentials from: {desktop_secret}")

    cmd.append(str(daemon_entry))

    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=str(repo_root))
    if result.returncode != 0:
        print("PyInstaller build failed!")
        sys.exit(result.returncode)

    built_exe = dist_dir / "secureworkspace-daemon.exe"
    if not built_exe.exists():
        print(f"Error: Expected binary not found at {built_exe}")
        sys.exit(1)

    # Copy to Tauri sidecar locations
    dest_plain = target_bin_dir / "secureworkspace-daemon.exe"
    dest_triple = target_bin_dir / "secureworkspace-daemon-x86_64-pc-windows-msvc.exe"

    shutil.copy2(built_exe, dest_plain)
    shutil.copy2(built_exe, dest_triple)

    size_mb = dest_plain.stat().st_size / (1024 * 1024)
    print(f"Successfully bundled daemon ({size_mb:.2f} MB):")
    print(f"  -> {dest_plain}")
    print(f"  -> {dest_triple}")

    # Clean up temp
    shutil.rmtree(temp_build_root, ignore_errors=True)

if __name__ == "__main__":
    main()
