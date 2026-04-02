@echo off
echo ==========================================
echo    Starting WhatsApp Bot & Dashboard
echo ==========================================

echo [1/2] Starting WhatsApp Bot Backend...
start "WhatsApp Bot Backend" cmd /k "npm run dev"

echo [2/2] Starting Dashboard Frontend...
start "Dashboard" cmd /k "cd dashboard && npm run dev"

echo ==========================================
echo  Services are launching in new windows!
echo  Close this window to continue...
echo ==========================================
pause
