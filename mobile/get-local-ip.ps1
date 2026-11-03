# Get Local IP Address for Mobile App Development
# This script helps you find your computer's local IP address
# to configure the mobile app's API_URL

Write-Host "`n=== TaskMtaa Mobile Setup - Local IP Finder ===" -ForegroundColor Cyan
Write-Host ""

# Get all network adapters with IPv4 addresses
$adapters = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { 
        $_.IPAddress -notlike "127.*" -and 
        $_.IPAddress -notlike "169.254.*" 
    } |
    Select-Object IPAddress, InterfaceAlias

if ($adapters.Count -eq 0) {
    Write-Host "❌ No network adapters found!" -ForegroundColor Red
    Write-Host "Make sure you're connected to WiFi or Ethernet." -ForegroundColor Yellow
    exit
}

Write-Host "📡 Found network adapters:" -ForegroundColor Green
Write-Host ""

$adapters | ForEach-Object {
    Write-Host "  Interface: $($_.InterfaceAlias)" -ForegroundColor White
    Write-Host "  IP Address: $($_.IPAddress)" -ForegroundColor Yellow
    Write-Host ""
}

# Get the most likely candidate (usually the first non-loopback address)
$primaryIP = $adapters[0].IPAddress

Write-Host "✅ Recommended IP for mobile development:" -ForegroundColor Green
Write-Host "  $primaryIP" -ForegroundColor Cyan -BackgroundColor Black
Write-Host ""

Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Open mobile\.env file"
Write-Host "2. Set: API_URL=http://$primaryIP:5000"
Write-Host "3. Save the file"
Write-Host "4. Run: npm start"
Write-Host ""

Write-Host "💡 Note: Make sure your phone and computer are on the same WiFi network!" -ForegroundColor Yellow
Write-Host ""
