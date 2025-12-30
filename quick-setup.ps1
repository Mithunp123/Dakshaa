# Database Connection Quick Setup
Write-Host ""
Write-Host "========================================"
Write-Host "  DAKSHAA Admin - Quick DB Setup"
Write-Host "========================================"
Write-Host ""

$envExample = "Frontend\.env.example"
$envFile = "Frontend\.env"

# Check if .env.example exists
if (-not (Test-Path $envExample)) {
    Write-Host "[ERROR] .env.example not found!" -ForegroundColor Red
    Write-Host "Make sure you are in the correct directory" -ForegroundColor Yellow
    exit 1
}

# Create .env file
if (Test-Path $envFile) {
    Write-Host "[INFO] .env file already exists" -ForegroundColor Yellow
} else {
    Copy-Item $envExample $envFile
    Write-Host "[SUCCESS] Created .env file" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================"
Write-Host "  NEXT STEPS"
Write-Host "========================================"
Write-Host ""
Write-Host "1. Configure .env file:"
Write-Host "   - Open: Frontend\.env"
Write-Host "   - Get credentials from: https://app.supabase.com"
Write-Host "   - Settings -> API"
Write-Host ""
Write-Host "2. Run database setup in Supabase SQL Editor:"
Write-Host "   - Open file: database\setup_admin_modules.sql"
Write-Host "   - Copy and run in Supabase"
Write-Host ""
Write-Host "3. Verify setup:"
Write-Host "   - Run file: database\verify_setup.sql"
Write-Host ""
Write-Host "4. Create super admin (replace email):"
Write-Host "   UPDATE profiles SET role = 'super_admin'"
Write-Host "   WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');"
Write-Host ""
Write-Host "5. Start frontend:"
Write-Host "   cd Frontend"
Write-Host "   npm install"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "For detailed instructions: CONNECT_TO_DB.md"
Write-Host "========================================"
Write-Host ""
