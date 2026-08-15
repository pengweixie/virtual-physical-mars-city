@echo off
cd /d "%~dp0.."
title sci-cray-01 High-Energy Cosmic-Ray Station Preview
echo ============================================
echo   sci-cray-01  High-Energy Cosmic-Ray Station (knee-region direct measurement)
echo.
echo   Standalone module preview:
echo     http://localhost:8128/dev/dev-preview-cray.html
echo   In-city smoke test (needs a pos in manifest.json):
echo     http://localhost:8128/viewer/index.html?colony=1^&inspect=sci-cray-01^&debug=1
echo   English cards:  append ^&lang=en
echo.
echo   Design book: E:\Claude\mars-cray  (7 ledgers, 29 gates)
echo   Zero moving parts is a design feature - the animation lives on the event display.
echo.
echo   Close this window to stop the server (8123 is reserved for the main viewer)
echo ============================================
start "" "http://localhost:8128/dev/dev-preview-cray.html"
python -m http.server 8128
pause
