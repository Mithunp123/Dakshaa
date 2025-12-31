#!/usr/bin/env pwsh
# Setup and Run DaKshaa Application
# This script fixes all errors and starts the application

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   DAKSHAA T26 - FULL SETUP & FIX GUIDE" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env files exist
Write-Host "Step 1: Checking Environment Files..." -ForegroundColor Green
if (Test-Path "Frontend\.env") {
    Write-Host "✅ Frontend .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend .env missing - creating..." -ForegroundColor Yellow
    @"
VITE_SUPABASE_URL=https://ltmyqtcirhsgfyortgfo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_VP9VW_jByG-ifTFUQLNTlw_AwY2uGce
VITE_API_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_APP_NAME=DaKshaa T26
"@ | Set-Content "Frontend\.env"
    Write-Host "✅ Frontend .env created" -ForegroundColor Green
}

if (Test-Path "Backend\.env") {
    Write-Host "✅ Backend .env file found" -ForegroundColor Green
} else {
    Write-Host "❌ Backend .env missing - creating..." -ForegroundColor Yellow
    @"
SUPABASE_URL=https://ltmyqtcirhsgfyortgfo.supabase.co
SUPABASE_ANON_KEY=sb_publishable_VP9VW_jByG-ifTFUQLNTlw_AwY2uGce
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bXlxdGNpcmhzZ2Z5b3J0Z2ZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMjM4MCwiZXhwIjoyMDgxOTg4MzgwfQ.m8gILbz29MZq9UrBgJjqyktuzkyMZgQSoRM-hZBvTlk
PORT=3000
EMAIL_USER=pavithranai19@gmail.com
EMAIL_PASSWORD=qnsgrfyslzvblczt
"@ | Set-Content "Backend\.env"
    Write-Host "✅ Backend .env created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Critical Fixes Required in Supabase" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: You must fix the RLS policies in Supabase to avoid infinite recursion errors:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Supabase Dashboard: https://app.supabase.com" -ForegroundColor White
Write-Host "2. Go to SQL Editor" -ForegroundColor White
Write-Host "3. Open and run this file: database/fix_rls_policies.sql" -ForegroundColor Cyan
Write-Host "4. This will fix:" -ForegroundColor White
Write-Host "   - Infinite recursion in teams table policies" -ForegroundColor Gray
Write-Host "   - 404 errors for accommodation table" -ForegroundColor Gray
Write-Host "   - RLS policy issues for lunch bookings" -ForegroundColor Gray
Write-Host ""

$fixCompleted = Read-Host "Have you run the RLS fix in Supabase? (y/n)"

if ($fixCompleted -eq "y") {
    Write-Host ""
    Write-Host "Step 3: Installing Dependencies..." -ForegroundColor Green
    
    # Backend dependencies
    Write-Host "Installing Backend dependencies..." -ForegroundColor Cyan
    Set-Location Backend
    npm install 2>&1 | Select-Object -Last 5
    Set-Location ..
    
    # Frontend dependencies
    Write-Host "Installing Frontend dependencies..." -ForegroundColor Cyan
    Set-Location Frontend
    npm install 2>&1 | Select-Object -Last 5
    Set-Location ..
    
    Write-Host ""
    Write-Host "✅ Dependencies installed!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Step 4: Starting Application" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📌 OPEN TWO NEW TERMINALS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Terminal 1 (Backend):" -ForegroundColor Cyan
    Write-Host "  cd Backend" -ForegroundColor Gray
    Write-Host "  npm start" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Terminal 2 (Frontend):" -ForegroundColor Cyan
    Write-Host "  cd Frontend" -ForegroundColor Gray
    Write-Host "  npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Application will start at: http://localhost:5173" -ForegroundColor Green
    Write-Host ""
    
    # Ask if user wants to start services
    $startServices = Read-Host "Start services now? (y/n)"
    if ($startServices -eq "y") {
        Write-Host ""
        Write-Host "Starting Backend Server..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\Backend'; npm start"
        
        Start-Sleep -Seconds 3
        
        Write-Host "Starting Frontend Development Server..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\Frontend'; npm run dev"
        
        Write-Host ""
        Write-Host "✅ Both servers started in new windows!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access the application at: http://localhost:5173" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "⚠️  Please run the RLS fix in Supabase first!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "File to run: database/fix_rls_policies.sql" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
