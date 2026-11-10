@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0hotel-backend\start-hotel.ps1" %*
exit /b %ERRORLEVEL%
