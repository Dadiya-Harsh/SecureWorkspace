# SecureWorkspace Desktop App Build Script
# Usage: .\scripts\build_desktop.ps1

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Write-Host "=== Step 1/2: Bundling Python Daemon Sidecar ===" -ForegroundColor Cyan
& "$repoRoot\.venv\Scripts\python.exe" "$repoRoot\scripts\bundle_daemon.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Daemon bundling failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "`n=== Step 2/2: Building Tauri Release Installers ===" -ForegroundColor Cyan
Set-Location "$repoRoot\apps\desktop"
npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tauri build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "`n=== Build Complete! Generated Installers ===" -ForegroundColor Green
$bundleDir = "$repoRoot\apps\desktop\src-tauri\target\release\bundle"
Get-ChildItem -Recurse $bundleDir -Include *.exe, *.msi | ForEach-Object {
    Write-Host "  -> $($_.FullName) ($([math]::Round($_.Length / 1MB, 2)) MB)" -ForegroundColor Yellow
}
