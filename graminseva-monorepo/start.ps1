# GraminSeva - AI Health Assistant

Write-Host "Starting GraminSeva Application..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "[1/2] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/2] Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "GraminSeva Started Successfully!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5001" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Servers are running in separate windows." -ForegroundColor Cyan
Write-Host "Close those windows to stop the servers." -ForegroundColor Cyan
