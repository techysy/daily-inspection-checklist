$ErrorActionPreference = "Continue"
$script:logFile = Join-Path $PWD "startup.log"

function Write-Log {
    param([string]$message)
    $logLine = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $message"
    Add-Content -Path $script:logFile -Value $logLine
    Write-Host $message
}

function Show-Menu {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "        每日巡检清单 - 管理菜单" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. 重新启动开发服务器"
    Write-Host "2. 构建生产版本"
    Write-Host "3. 查看启动日志"
    Write-Host "4. 打开项目目录"
    Write-Host "5. 退出"
    Write-Host ""
    Write-Host "请输入选项 (1-5): " -NoNewline
}

function Start-Server {
    Write-Log ""
    Write-Log "Starting development server..."
    Write-Log "Server URL: http://localhost:5173"
    Write-Log "Press Ctrl+C to stop and return to menu"
    Write-Log ""

    npm run dev

    Write-Log ""
    Write-Log "Server stopped"
}

function Build-Project {
    Write-Log ""
    Write-Log "Building production version..."
    npm run build 2>&1 | ForEach-Object { Write-Log $_ }
    if ($LASTEXITCODE -eq 0) {
        Write-Log "OK: Build completed successfully"
    } else {
        Write-Log "ERROR: Build failed"
    }
}

function View-Log {
    Write-Log ""
    Write-Log "Displaying startup log..."
    Write-Log "-----------------------------------------"
    Get-Content -Path $script:logFile | Select-Object -Last 50
    Write-Log "-----------------------------------------"
}

function Open-Directory {
    Write-Log ""
    Write-Log "Opening project directory..."
    Start-Process $PWD
}

Write-Log "=========================================="
Write-Log "Daily Inspection Checklist - Dev Server"
Write-Log "=========================================="
Write-Log "Log file: $script:logFile"
Write-Log ""

try {
    Write-Log "Checking Node.js installation..."
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "ERROR: Node.js is not installed"
        Write-Log "Please install Node.js from https://nodejs.org/"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Log "OK: Node.js version $nodeVersion"

    Write-Log ""
    Write-Log "Checking npm installation..."
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "ERROR: npm is not installed"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Log "OK: npm version $npmVersion"

    Write-Log ""
    if (-not (Test-Path "node_modules")) {
        Write-Log "Installing dependencies..."
        npm install 2>&1 | ForEach-Object { Write-Log $_ }
        if ($LASTEXITCODE -ne 0) {
            Write-Log "ERROR: Failed to install dependencies"
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Log "OK: Dependencies installed successfully"
    }
    else {
        Write-Log "OK: Dependencies already exist"
    }

    Start-Server

    do {
        Show-Menu
        $choice = Read-Host

        switch ($choice) {
            '1' { Start-Server }
            '2' { Build-Project }
            '3' { View-Log }
            '4' { Open-Directory }
            '5' { 
                Write-Log ""
                Write-Log "Exit..."
                exit 0 
            }
            default {
                Write-Log "ERROR: Invalid option. Please enter 1-5"
            }
        }
    } while ($true)
}
catch {
    Write-Log "ERROR: $($_.Exception.Message)"
    Read-Host "Press Enter to exit"
    exit 1
}
