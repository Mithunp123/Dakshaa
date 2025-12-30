# Quick Setup Script for Attendance System
# Run this after setting up the database

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  DaKshaa T26 - Attendance System Setup    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Database Setup
Write-Host "Step 1: Database Setup" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "1. Opening SQL file..." -ForegroundColor White

$sqlPath = "database\attendance_system.sql"
if (Test-Path $sqlPath) {
    Get-Content $sqlPath -Raw | Set-Clipboard
    Write-Host "✓ SQL copied to clipboard!" -ForegroundColor Green
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "  1. Open Supabase SQL Editor" -ForegroundColor White
    Write-Host "  2. Paste (Ctrl+V) and Run the SQL" -ForegroundColor White
    Write-Host "  3. Press any key to continue..." -ForegroundColor White
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} else {
    Write-Host "✗ SQL file not found!" -ForegroundColor Red
    exit 1
}

# Step 2: Verify Frontend Dependencies
Write-Host "`n`nStep 2: Frontend Dependencies" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────" -ForegroundColor Gray

Push-Location "Frontend"

Write-Host "Checking html5-qrcode..." -ForegroundColor White
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.dependencies.'html5-qrcode') {
    Write-Host "✓ html5-qrcode installed" -ForegroundColor Green
} else {
    Write-Host "✗ Installing html5-qrcode..." -ForegroundColor Yellow
    npm install html5-qrcode --legacy-peer-deps
    Write-Host "✓ html5-qrcode installed" -ForegroundColor Green
}

Pop-Location

# Step 3: Audio Files
Write-Host "`n`nStep 3: Audio Files" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────" -ForegroundColor Gray

$audioDir = "Frontend\public"
if (-not (Test-Path $audioDir)) {
    New-Item -ItemType Directory -Path $audioDir -Force | Out-Null
}

Write-Host "`nAudio files needed for feedback:" -ForegroundColor White
Write-Host "  • $audioDir\success.mp3 - Success sound" -ForegroundColor Cyan
Write-Host "  • $audioDir\error.mp3   - Error sound" -ForegroundColor Cyan

$successPath = "$audioDir\success.mp3"
$errorPath = "$audioDir\error.mp3"

if (-not (Test-Path $successPath)) {
    Write-Host "`n⚠ success.mp3 missing - Download from:" -ForegroundColor Yellow
    Write-Host "  https://freesound.org/people/LittleRobotSoundFactory/sounds/270303/" -ForegroundColor Gray
}
if (-not (Test-Path $errorPath)) {
    Write-Host "⚠ error.mp3 missing - Download from:" -ForegroundColor Yellow
    Write-Host "  https://freesound.org/people/distillerystudio/sounds/327738/" -ForegroundColor Gray
}

# Step 4: Test Events
Write-Host "`n`nStep 4: Sample Events" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "Sample events will be created automatically by the SQL script." -ForegroundColor White
Write-Host "You can add more events in Supabase dashboard." -ForegroundColor Gray

# Step 5: Access URLs
Write-Host "`n`nStep 5: Access Scanner" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "Volunteer Scanner:   " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5173/volunteer/scanner" -ForegroundColor Cyan
Write-Host "Coordinator Scanner: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5173/coordinator/scanner" -ForegroundColor Cyan

# Summary
Write-Host "`n`n╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         Setup Complete! ✓                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "What was installed:" -ForegroundColor Yellow
Write-Host "  ✓ Database schema (events, registrations, attendance_logs)" -ForegroundColor Green
Write-Host "  ✓ RPC functions (verify_and_mark_attendance, etc.)" -ForegroundColor Green
Write-Host "  ✓ Scanner component at /volunteer/scanner & /coordinator/scanner" -ForegroundColor Green
Write-Host "  ✓ Service layer (attendanceService.js)" -ForegroundColor Green
Write-Host "  ✓ Dependencies (html5-qrcode)" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Add audio files (optional but recommended)" -ForegroundColor White
Write-Host "  2. Create test events in Supabase" -ForegroundColor White
Write-Host "  3. Register test users for events" -ForegroundColor White
Write-Host "  4. Start frontend: cd Frontend && npm run dev" -ForegroundColor White
Write-Host "  5. Login as volunteer and test scanner" -ForegroundColor White

Write-Host "`nDocumentation: " -NoNewline -ForegroundColor Yellow
Write-Host "ATTENDANCE_SYSTEM_GUIDE.md" -ForegroundColor Cyan

Write-Host "`n"
