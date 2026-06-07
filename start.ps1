5# ============================================================
#   Carbon Credit Exchange - One-Click Startup Script
#   Double-click this file or run it in PowerShell to start
# ============================================================

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Carbon Credit Exchange - Starting Up  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Increase Node.js memory limit to prevent OOM crash ---
$env:NODE_OPTIONS = "--max-old-space-size=4096"
Write-Host "  Memory limit set to 4GB for Node.js" -ForegroundColor DarkGray
Write-Host ""

# --- Step 1: Check Node.js is installed ---
Write-Host "[1/4] Checking Node.js installation..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "  Please install it from https://nodejs.org and re-run this script." -ForegroundColor Red
    pause
    exit 1
}
$nodeVersion = node --version
Write-Host "  Node.js found: $nodeVersion" -ForegroundColor Green

# --- Step 2: Remove conflicting lockfiles from parent folder ---
Write-Host ""
Write-Host "[2/4] Cleaning up conflicting lockfiles in parent folder..." -ForegroundColor Yellow
$ParentLock = Join-Path (Split-Path -Parent $ProjectRoot) "package-lock.json"
if (Test-Path $ParentLock) {
    Remove-Item $ParentLock -Force
    Write-Host "  Removed conflicting package-lock.json from parent folder." -ForegroundColor Green
} else {
    Write-Host "  No conflicts found." -ForegroundColor Green
}

# --- Step 3: Install dependencies ---
Write-Host ""
Write-Host "[3/4] Installing packages (npm install)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed! Check errors above." -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  Packages installed successfully!" -ForegroundColor Green

# --- Step 4: Start the dev server ---
Write-Host ""
Write-Host "[4/4] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  App running at: http://localhost:3000  " -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop the server       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
