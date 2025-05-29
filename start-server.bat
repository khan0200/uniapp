@echo off
title UniApp Local Server
color 0A

echo.
echo ========================================
echo    🚀 UniApp Local Server Starter
echo ========================================
echo.

cd /d "%~dp0"

echo 📁 Current directory: %CD%
echo.

echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found!
echo.

echo 🌐 Starting HTTP server on port 8000...
echo.
echo 📋 Your app will be available at:
echo    👉 http://localhost:8000
echo.
echo 📱 Available pages:
echo    • Main app: http://localhost:8000/index.html
echo    • Students: http://localhost:8000/studentlist.html  
echo    • Payments: http://localhost:8000/payments.html
echo    • Cache Demo: http://localhost:8000/cache-demo.html
echo.
echo 🛑 Press Ctrl+C to stop the server
echo ========================================
echo.

timeout /t 3 /nobreak >nul

echo 🚀 Starting server...
npx http-server -p 8000 -c-1 --cors

echo.
echo 🛑 Server stopped.
pause 