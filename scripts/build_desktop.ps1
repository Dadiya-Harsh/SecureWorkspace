# SecureWorkspace Desktop App Clean Build Script
# Usage: .\scripts\build_desktop.ps1

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Write-Host "=== Step 1/3: Cleaning Build Caches ===" -ForegroundColor Cyan

# Remove stale build directories
@("$repoRoot\dist", "$repoRoot\build", "$repoRoot\apps\desktop\dist", "$repoRoot\apps\desktop\src-tauri\target\release\bundle") | ForEach-Object {
    if (Test-Path $_) {
        Write-Host "  Removing stale: $_"
        Remove-Item -Recurse -Force $_ -ErrorAction SilentlyContinue
    }
}

Write-Host "`n=== Step 2/3: Bundling Python Daemon Sidecar ===" -ForegroundColor Cyan
& "$repoRoot\.venv\Scripts\python.exe" "$repoRoot\scripts\bundle_daemon.py"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Daemon bundling failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "`n=== Step 3/3: Building Fresh Tauri Frontend & Release Installers ===" -ForegroundColor Cyan
Set-Location "$repoRoot\apps\desktop"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tauri build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "`n=== Build Complete! Fresh Generated Installers ===" -ForegroundColor Green
$bundleDir = "$repoRoot\apps\desktop\src-tauri\target\release\bundle"
Get-ChildItem -Recurse $bundleDir -Include *.exe, *.msi | ForEach-Object {
    Write-Host "  -> $($_.FullName) ($([math]::Round($_.Length / 1MB, 2)) MB) [Built: $($_.LastWriteTime)]" -ForegroundColor Yellow
}

