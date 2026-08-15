@echo off
cd /d "%~dp0.."
title sci-fel-01 FEL Preview Server
echo ============================================
echo   sci-fel-01  Infrared / Terahertz FEL  (kind:interior)
echo.
echo   Standalone module preview:
echo     http://localhost:8124/dev/dev-preview-fel.html
echo   In-engine interior deep link (portals not required):
echo     http://localhost:8124/viewer/index.html?interior=sci-fel-01^&debug=1
echo   English cards:  append ^&lang=en
echo.
echo   Preview buttons: overview / undulator / dump / beamlines,
echo   plus a full-cycle (T=48 s) envelope scan.
echo.
echo   Close this window to stop the server (8123 is reserved for the main viewer)
echo ============================================
start "" "http://localhost:8124/dev/dev-preview-fel.html"
python -m http.server 8124
pause
