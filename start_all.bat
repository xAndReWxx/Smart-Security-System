@echo off
title Smart Monitoring System Launcher
color 0A

echo ======================================
echo   🚀 Starting Smart Monitoring System
echo ======================================
echo.

REM ===== 1) MAIN SERVER =====
echo ▶ Starting Main Server...
start "Main Server" cmd /k python Servers/mainServer.py
timeout /t 3 >nul

REM ===== 2) NFC + MOTOR SERVER =====
echo ▶ Starting NFC & Motor Server...
start "NFC Server" cmd /k python Servers/MotorAndNfcAndLcd.py
timeout /t 2 >nul

REM ===== 3) Esp Cam SERVER =====
echo ▶ Starting EspCam Server...
start "Telegram Server" cmd /k python Servers/ESPCAM/EspCam.py
timeout /t 2 >nul

REM ===== 4) TELEGRAM BOT SERVER =====
echo ▶ Starting Telegram Bot Server...
start "Telegram Server" cmd /k python Servers/Telegram/TelegramBotServer.py
timeout /t 2 >nul


REM ===== 5) REACT WEBSITE =====
echo ▶ Starting React Website...
start "React Website" cmd /k npm run dev

echo.
echo ✅ All services are starting...
echo Do NOT close this window.
pause
