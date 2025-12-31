# Database Connection Setup Script
# Run this in PowerShell to set up your database connection

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DAKSHAA Admin Modules - DB Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if .env.example exists
$envExample = "Frontend\.env.example"
$envFile = "Frontend\.env"

if (-not (Test-Path $envExample)) {
    Write-Host "❌ .env.example not found!" -ForegroundColor Red
    Write-Host "   Make sure you're in the DaKshaaWeb-main v2 directory`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "📝 Step 1: Creating .env file..." -ForegroundColor Green

if (Test-Path $envFile) {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "   Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "   Keeping existing .env file`n" -ForegroundColor Cyan
    } else {
        Copy-Item $envExample $envFile -Force
        Write-Host "✅ .env file created!`n" -ForegroundColor Green
    }
} else {
    Copy-Item $envExample $envFile
    Write-Host "✅ .env file created!`n" -ForegroundColor Green
}

Write-Host "📋 Step 2: Configure Supabase Credentials`n" -ForegroundColor Green
Write-Host "   You need to get these from Supabase Dashboard:" -ForegroundColor White
Write-Host "   1. Go to: https://app.supabase.com" -ForegroundColor Gray
Write-Host "   2. Select your project" -ForegroundColor Gray
Write-Host "   3. Settings → API" -ForegroundColor Gray
Write-Host "   4. Copy Project URL and anon/public key`n" -ForegroundColor Gray

$configNow = Read-Host "   Do you want to configure credentials now? (y/n)"

if ($configNow -eq "y") {
    Write-Host "`n📝 Enter your Supabase credentials:`n" -ForegroundColor Cyan
    
    $supabaseUrl = Read-Host "   Supabase URL (https://xxxxx.supabase.co)"
    $supabaseKey = Read-Host "   Supabase Anon Key (eyJhbG...)"
    
    if ($supabaseUrl -and $supabaseKey) {
        # Read current .env content
        $envContent = Get-Content $envFile -Raw
        
        # Replace placeholders
        $envContent = $envContent -replace "your_supabase_url", $supabaseUrl
        $envContent = $envContent -replace "your_supabase_anon_key", $supabaseKey
        
        # Write back
        Set-Content -Path $envFile -Value $envContent
        
        Write-Host "`n✅ Credentials saved to .env file!" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  No credentials entered. Please edit Frontend\.env manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n📝 Manual setup required:" -ForegroundColor Yellow
    Write-Host "   1. Open: Frontend\.env" -ForegroundColor Gray
    Write-Host "   2. Replace 'your_supabase_url' with your URL" -ForegroundColor Gray
    Write-Host "   3. Replace 'your_supabase_anon_key' with your key`n" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1️⃣  Run Database Setup in Supabase:" -ForegroundColor White
Write-Host "   • Open: https://app.supabase.com" -ForegroundColor Gray
Write-Host "   • Go to SQL Editor" -ForegroundColor Gray
Write-Host "   • Run: database\setup_admin_modules.sql" -ForegroundColor Gray
Write-Host "   • Run: database\verify_setup.sql`n" -ForegroundColor Gray

Write-Host "2️⃣  Create Super Admin:" -ForegroundColor White
Write-Host "   • In SQL Editor, replace YOUR_EMAIL and run:" -ForegroundColor Gray
Write-Host "     UPDATE profiles SET role = 'super_admin'" -ForegroundColor DarkGray
Write-Host "     WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL')`n" -ForegroundColor DarkGray

Write-Host "3️⃣  Start Frontend:" -ForegroundColor White
Write-Host "   cd Frontend" -ForegroundColor DarkGray
Write-Host "   npm install" -ForegroundColor DarkGray
Write-Host "   npm run dev`n" -ForegroundColor DarkGray

Write-Host "4️⃣  Test Admin Modules:" -ForegroundColor White
Write-Host "   • Login at http://localhost:5173/login" -ForegroundColor Gray
Write-Host "   • Go to http://localhost:5173/admin" -ForegroundColor Gray
Write-Host "   • Check new admin modules" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "   • CONNECT_TO_DB.md (step-by-step guide)" -ForegroundColor Gray
Write-Host "   • DATABASE_SETUP.md (database details)" -ForegroundColor Gray
Write-Host "   • SETUP_GUIDE.md (complete setup)" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
