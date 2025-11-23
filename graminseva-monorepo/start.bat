@echo off
REM ============================================
REM  GraminSeva - Quick Start Script
REM  Runs Backend + Frontend Simultaneously
REM ============================================

echo.
echo ========================================
echo  Starting GraminSeva Platform
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js found: 
node --version
echo.

REM Kill any existing Node processes
echo [INFO] Cleaning up existing Node processes...
taskkill /F /IM node.exe >nul 2>nul
timeout /t 2 /nobreak >nul

REM Start Backend Server
echo.
echo ========================================
echo  Starting Backend Server (Port 5001)
echo ========================================
start "GraminSeva Backend" cmd /k "cd backend && node index.js"
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo.
echo ========================================
echo  Starting Frontend Server (Port 3000)
echo ========================================
start "GraminSeva Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  GraminSeva Platform Started!
echo ========================================
echo.
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo Press any key to open the application in browser...
pause >nul

REM Open browser
start http://localhost:3000

echo.
echo Application opened in browser!
echo.
echo To stop the servers:
echo 1. Close the Backend and Frontend terminal windows
echo 2. Or run: taskkill /F /IM node.exe
echo.
pause
