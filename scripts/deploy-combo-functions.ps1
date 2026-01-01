# ============================================
# Deploy Combo Management Functions to Supabase
# This enables full edit/delete/toggle functionality in admin panel
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMBO FUNCTIONS DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if SQL file exists
$sqlFile = ".\database\deploy_combo_functions.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: SQL file not found at $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Found SQL file: $sqlFile" -ForegroundColor Green
Write-Host ""

# Instructions for manual deployment
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "DEPLOYMENT INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "To deploy the combo management functions:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "   - Go to https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host "   - Select your project" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Navigate to SQL Editor:" -ForegroundColor Cyan
Write-Host "   - Click 'SQL Editor' in the left sidebar" -ForegroundColor Gray
Write-Host "   - Click '+ New Query'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Copy and paste the SQL:" -ForegroundColor Cyan
Write-Host "   - Open: database\deploy_combo_functions.sql" -ForegroundColor Gray
Write-Host "   - Copy ALL the contents" -ForegroundColor Gray
Write-Host "   - Paste into Supabase SQL Editor" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Run the query:" -ForegroundColor Cyan
Write-Host "   - Click 'Run' button (or press Ctrl+Enter)" -ForegroundColor Gray
Write-Host "   - Wait for success message" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Verify deployment:" -ForegroundColor Cyan
Write-Host "   - You should see 'Success. No rows returned'" -ForegroundColor Gray
Write-Host "   - This means all functions were created successfully" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to open the SQL file
Write-Host "Would you like to open the SQL file now? (Y/N): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "📝 Opening SQL file..." -ForegroundColor Green
    Start-Process notepad $sqlFile
    Write-Host ""
    Write-Host "✅ SQL file opened in Notepad" -ForegroundColor Green
    Write-Host "   Copy the contents and paste into Supabase SQL Editor" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "WHAT THIS WILL FIX" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Enable EDIT button functionality" -ForegroundColor Green
Write-Host "✅ Enable DELETE button functionality" -ForegroundColor Green
Write-Host "✅ Enable TOGGLE active/inactive status" -ForegroundColor Green
Write-Host "✅ Create new combos with category quotas" -ForegroundColor Green
Write-Host "✅ Prevent deletion of combos with purchases" -ForegroundColor Green
Write-Host ""
Write-Host "After deployment, refresh your admin panel to test!" -ForegroundColor Yellow
Write-Host ""
