@echo off
cd /d "%~dp0.."
title Spaceport Preview Server
echo ============================================
echo   Launch-pad single-asset preview  ops-spaceport-02
echo   URL: http://localhost:8126/dev/dev-preview-spaceport.html
echo.
echo   Camera param ?cam=  full / tower / trench / tank / landing / pad
echo   Night: append ^&mode=night   Open state: ^&open=1
echo.
echo   Close this window to stop the server
echo ============================================
start "" "http://localhost:8126/dev/dev-preview-spaceport.html?cam=full"
python -m http.server 8126
pause

