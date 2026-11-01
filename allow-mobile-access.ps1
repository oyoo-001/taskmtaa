# PowerShell script to allow mobile access
# Run as Administrator

Write-Host "🔥 Adding Windows Firewall Rules for Mobile Access..." -ForegroundColor Green

# Allow Vite Dev Server (Port 5173)
New-NetFirewallRule `
    -DisplayName "TaskMtaa - Vite Dev Server" `
    -Direction Inbound `
    -LocalPort 5173 `
    -Protocol TCP `
    -Action Allow `
    -Profile Domain,Private `
    -ErrorAction SilentlyContinue

if ($?) {
    Write-Host "✅ Allowed port 5173 (Vite)" -ForegroundColor Green
} else {
    Write-Host "⚠️ Rule for port 5173 may already exist" -ForegroundColor Yellow
}

# Allow Node Backend (Port 5000)
New-NetFirewallRule `
    -DisplayName "TaskMtaa - Node Backend" `
    -Direction Inbound `
    -LocalPort 5000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Domain,Private `
    -ErrorAction SilentlyContinue

if ($?) {
    Write-Host "✅ Allowed port 5000 (Backend)" -ForegroundColor Green
} else {
    Write-Host "⚠️ Rule for port 5000 may already exist" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Firewall configured!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start dev server: npm run dev" -ForegroundColor White
Write-Host "2. On your phone, open: http://192.168.0.106:5173" -ForegroundColor White
Write-Host "3. Make sure phone is on same WiFi network" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
