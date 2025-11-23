# PowerShell script to start ngrok and help with setup

Write-Host "🚀 Starting ngrok tunnel for port 3000..." -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
try {
    $ngrokVersion = ngrok version
    Write-Host "✅ ngrok is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok not found. Please install it first:" -ForegroundColor Red
    Write-Host "   Download from: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "   Or use: choco install ngrok (if you have Chocolatey)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📝 Important steps:" -ForegroundColor Yellow
Write-Host "   1. Copy the https://xxxx.ngrok.io URL that appears below" -ForegroundColor White
Write-Host "   2. Update NEXT_PUBLIC_APP_URL in your .env file" -ForegroundColor White
Write-Host "   3. Update Twilio webhook URL in Twilio Console" -ForegroundColor White
Write-Host ""
Write-Host "Starting ngrok..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Start ngrok
ngrok http 3000
