@echo off
cd /d "%~dp0.."
title Museum Preview Server (8133)
echo ============================================
echo   Mars City Museum preview  hab-museum-01 / hab-museum-hall-01
echo   Exterior: http://localhost:8133/dev/dev-preview-museum.html?unit=hab-museum-01
echo   Interior: http://localhost:8133/dev/dev-preview-museum.html?unit=hab-museum-hall-01
echo   In-city interior direct: viewer/index.html?interior=hab-museum-hall-01
echo.
echo   Night: press the moon button in page UI
echo   Close this window to stop the server
echo ============================================
start "" "http://localhost:8133/dev/dev-preview-museum.html?unit=hab-museum-01"
python -m http.server 8133
pause
