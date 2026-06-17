@echo off
chcp 65001 >nul
title 每日巡检清单 - 开发服务器

echo ==========================================
echo      每日巡检清单 - 开发服务器
echo ==========================================
echo.

echo 正在检查 Node.js 安装...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js 未安装
    echo 请从 https://nodejs.org/ 安装 Node.js
    pause
    exit /b 1
)
echo OK: Node.js 已安装
echo.

echo 正在检查 npm 安装...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm 未安装
    pause
    exit /b 1
)
echo OK: npm 已安装
echo.

if not exist node_modules (
    echo 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: 依赖安装失败
        pause
        exit /b 1
    )
    echo OK: 依赖安装成功
    echo.
) else (
    echo OK: 依赖已存在
    echo.
)

echo 正在启动开发服务器...
echo 服务器地址: http://localhost:5173
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

echo.
echo 服务器已停止
echo.

:menu
cls
echo ==========================================
echo        每日巡检清单 - 管理菜单
echo ==========================================
echo.
echo 1. 重新启动开发服务器
echo 2. 构建生产版本
echo 3. 打开项目目录
echo 4. 退出
echo.
set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto build_project
if "%choice%"=="3" goto open_dir
if "%choice%"=="4" goto exit_script

echo 无效选项，请输入 1-4
pause
goto menu

:start_server
cls
echo 正在重新启动开发服务器...
echo 服务器地址: http://localhost:5173
echo 按 Ctrl+C 停止服务器
echo.
npm run dev
goto menu

:build_project
cls
echo 正在构建生产版本...
echo.
npm run build
if %errorlevel% equ 0 (
    echo.
    echo OK: 构建成功
) else (
    echo.
    echo ERROR: 构建失败
)
echo.
pause
goto menu

:open_dir
start .
goto menu

:exit_script
exit /b 0
