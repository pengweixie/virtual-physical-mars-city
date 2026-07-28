@echo off
cd /d "%~dp0"
title Starship Preview Server
echo ============================================
echo   Starship single-asset preview  veh-rocket-01
echo   URL: http://localhost:8125/dev-preview-rocket.html
echo.
echo   Camera param ?cam=  full / tiles / base / nose / eng
echo   Night: append ^&mode=night
echo   Cutaway: ?cam=cut^&cut=1  or cutcrew / cuteng
echo.
echo   Close this window to stop the server
echo ============================================
start "" "http://localhost:8125/dev-preview-rocket.html?cam=full"
python -m http.server 8125
pause
