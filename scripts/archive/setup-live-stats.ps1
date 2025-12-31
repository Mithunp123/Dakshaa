# =====================================================
# LIVE STATS DASHBOARD - QUICK SETUP
# =====================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   LIVE STATS DASHBOARD SETUP           " -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📊 Real-Time Public Statistics Display" -ForegroundColor Yellow
Write-Host "   - Total Students Onboarded" -ForegroundColor White
Write-Host "   - Total Event Registrations" -ForegroundColor White
Write-Host "   - Instant Live Updates`n" -ForegroundColor White

# Copy SQL to clipboard
Get-Content "database\live_stats.sql" -Raw | Set-Clipboard

Write-Host "✅ SQL copied to clipboard!`n" -ForegroundColor Green

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray

Write-Host "1. DATABASE SETUP" -ForegroundColor Yellow
Write-Host "   → Open Supabase Dashboard" -ForegroundColor White
Write-Host "   → Go to SQL Editor" -ForegroundColor White
Write-Host "   → Paste and run the SQL (Ctrl+V)" -ForegroundColor White
Write-Host ""

Write-Host "2. ENABLE REALTIME" -ForegroundColor Yellow
Write-Host "   → Database → Replication" -ForegroundColor White
Write-Host "   → Enable: profiles ✓" -ForegroundColor White
Write-Host "   → Enable: registrations ✓`n" -ForegroundColor White

Write-Host "3. ACCESS THE PAGE" -ForegroundColor Yellow
Write-Host "   → Local: http://localhost:5173/live-stats" -ForegroundColor Cyan
Write-Host "   → Production: https://yourdomain.com/live-stats`n" -ForegroundColor Cyan

Write-Host "FEATURES:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray

Write-Host "🔴 Real-time updates" -ForegroundColor White
Write-Host "📊 Big board scoreboard design" -ForegroundColor White
Write-Host "🎯 Odometer animations" -ForegroundColor White
Write-Host "🔒 Secure (no user data exposed)" -ForegroundColor White
Write-Host "📱 Fully responsive" -ForegroundColor White
Write-Host "🌐 Public access (no login)  `n" -ForegroundColor White

Write-Host "VENUE SETUP:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray

Write-Host "1. Connect laptop to projector/monitor" -ForegroundColor White
Write-Host "2. Open browser in fullscreen (F11)" -ForegroundColor White
Write-Host "3. Navigate to /live-stats" -ForegroundColor White
Write-Host "4. Watch numbers update in real-time! 🚀`n" -ForegroundColor White

Write-Host "📖 Full documentation: LIVE_STATS_GUIDE.md`n" -ForegroundColor Magenta

Write-Host "Ready to build hype! 🎉" -ForegroundColor Green
Write-Host ""
