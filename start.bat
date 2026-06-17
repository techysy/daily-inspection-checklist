@echo off
title Daily Inspection Checklist
cd /d "%~dp0"

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js OK
echo.

if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
    echo Dependencies installed
    echo.
)

echo Starting dev server...
echo URL: http://localhost:5173
echo.

npm run dev

echo.
echo Server stopped
echo.
pause