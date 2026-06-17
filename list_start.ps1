$ErrorActionPreference = 'Stop'

$scriptPath = $PSScriptRoot
$originalLocation = Get-Location

try {
    Set-Location $scriptPath

    Write-Host "`n=====================================" -ForegroundColor Cyan
    Write-Host "Daily Inspection Checklist" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan

    Write-Host "`n[1/3] Checking Node.js..." -ForegroundColor Yellow
    
    try {
        $nodeVersion = node --version
        Write-Host "      [OK] Node.js found: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "      [ERROR] Node.js not found!" -ForegroundColor Red
        Write-Host "        Please install Node.js from https://nodejs.org/" -ForegroundColor Red
        Write-Host "`nPress any key to exit..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
        exit 1
    }

    Write-Host "`n[2/3] Checking dependencies..." -ForegroundColor Yellow

    if (-not (Test-Path -Path "node_modules" -PathType Container)) {
        Write-Host "      Installing dependencies..." -ForegroundColor Cyan
        
        try {
            npm install
            Write-Host "      [OK] Dependencies installed successfully" -ForegroundColor Green
        } catch {
            Write-Host "      [ERROR] npm install failed" -ForegroundColor Red
            Write-Host "        Error: $_" -ForegroundColor Red
            Write-Host "`nPress any key to exit..." -ForegroundColor Gray
            $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
            exit 1
        }
    } else {
        Write-Host "      [OK] Dependencies already installed" -ForegroundColor Green
    }

    Write-Host "`n[3/3] Starting development server..." -ForegroundColor Yellow
    Write-Host "      URL: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "`n      Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host "`n-------------------------------------`n" -ForegroundColor DarkGray

    npm run dev
}
catch {
    Write-Host "`n[ERROR] Unexpected error: $_" -ForegroundColor Red
    Write-Host "`nPress any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 1
}
finally {
    Set-Location $originalLocation
}
