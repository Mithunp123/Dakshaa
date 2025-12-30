# 🚀 Quick Deploy Script - DaKshaa T26

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DaKshaa T26 - Quick Deploy Script   " -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "This script will help you deploy DaKshaa T26 to production`n" -ForegroundColor Yellow

# Step 1: Database
Write-Host "STEP 1: Database Setup" -ForegroundColor Magenta
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "1. Open your Supabase project SQL Editor"
Write-Host "2. Copy the complete database schema:"
Write-Host ""

$dbFile = "database\complete_production_schema.sql"
if (Test-Path $dbFile) {
    Get-Content $dbFile -Raw | Set-Clipboard
    Write-Host "✅ Database schema copied to clipboard!" -ForegroundColor Green
    Write-Host "   Paste and run in Supabase SQL Editor`n" -ForegroundColor Cyan
} else {
    Write-Host "❌ Database file not found!" -ForegroundColor Red
}

Read-Host "Press Enter when database setup is complete"

# Step 2: Environment Variables
Write-Host "`nSTEP 2: Environment Variables" -ForegroundColor Magenta
Write-Host "----------------------------------------" -ForegroundColor Gray

$supabaseUrl = Read-Host "Enter your Supabase URL"
$supabaseKey = Read-Host "Enter your Supabase Anon Key"

# Create Frontend .env
$frontendEnv = @"
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=DaKshaa T26
VITE_ENABLE_REGISTRATION=true
VITE_ENABLE_ACCOMMODATION=true
VITE_ENABLE_LUNCH_BOOKING=true
VITE_ENABLE_REFERRAL_SYSTEM=true
VITE_ENABLE_TEAMS=true
"@

Set-Content -Path "Frontend\.env" -Value $frontendEnv
Write-Host "✅ Frontend .env created" -ForegroundColor Green

# Step 3: Install Dependencies
Write-Host "`nSTEP 3: Installing Dependencies" -ForegroundColor Magenta
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "Installing Frontend dependencies..."
Set-Location Frontend
npm install
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

Set-Location ..

if (Test-Path "Backend") {
    Write-Host "Installing Backend dependencies..."
    Set-Location Backend
    npm install
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    Set-Location ..
}

# Step 4: Build Frontend
Write-Host "`nSTEP 4: Building Frontend" -ForegroundColor Magenta
Write-Host "----------------------------------------" -ForegroundColor Gray

Set-Location Frontend
npm run build
Write-Host "✅ Frontend build complete" -ForegroundColor Green
Set-Location ..

# Step 5: Deployment Options
Write-Host "`nSTEP 5: Choose Deployment Method" -ForegroundColor Magenta
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "1. Vercel (Recommended)"
Write-Host "2. Netlify"
Write-Host "3. Manual (just build)"
$deployChoice = Read-Host "Enter choice (1-3)"

switch ($deployChoice) {
    "1" {
        Write-Host "`nDeploying to Vercel..." -ForegroundColor Cyan
        Set-Location Frontend
        
        # Check if Vercel CLI is installed
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if (-not $vercelInstalled) {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host "Running Vercel deployment..." -ForegroundColor Cyan
        vercel --prod
        
        Set-Location ..
        Write-Host "✅ Deployed to Vercel!" -ForegroundColor Green
    }
    "2" {
        Write-Host "`nDeploying to Netlify..." -ForegroundColor Cyan
        Set-Location Frontend
        
        # Check if Netlify CLI is installed
        $netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
        if (-not $netlifyInstalled) {
            Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
            npm install -g netlify-cli
        }
        
        Write-Host "Running Netlify deployment..." -ForegroundColor Cyan
        netlify deploy --prod --dir=dist
        
        Set-Location ..
        Write-Host "✅ Deployed to Netlify!" -ForegroundColor Green
    }
    "3" {
        Write-Host "✅ Build complete. Deploy dist/ folder manually." -ForegroundColor Green
    }
}

# Final Steps
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE!                 " -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. ✅ Database: Set up and migrated"
Write-Host "2. ✅ Frontend: Built and deployed"
Write-Host "3. ⚠️  Create Super Admin account (see below)"
Write-Host "4. ⚠️  Configure payment gateway"
Write-Host "5. ⚠️  Test all features"
Write-Host ""

Write-Host "Create Super Admin:" -ForegroundColor Cyan
Write-Host "Run this in Supabase SQL Editor:" -ForegroundColor White
Write-Host "UPDATE profiles SET role = 'super_admin' WHERE email = 'your-admin@email.com';" -ForegroundColor Gray
Write-Host ""

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "- Full Guide: PRODUCTION_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "- Site Map: COMPLETE_SITE_MAP.md" -ForegroundColor White
Write-Host ""

Write-Host "Support: Check documentation for troubleshooting" -ForegroundColor Magenta
Write-Host ""
