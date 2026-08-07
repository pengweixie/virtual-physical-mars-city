@echo off
cd /d "%~dp0.."
title Starship Launch/Landing Animation
echo ============================================
echo   Starship launch/landing demo  veh-rocket-01
echo   URL: http://localhost:8126/dev/dev-anim-rocket.html
echo.
echo   26 s looping timeline (from the L2 sims):
echo     1 powered descent  2 night on pad
echo     3 ignition ramp    4 gravity-turn ascent
echo.
echo   Close this window to stop the server
echo ============================================
start "" "http://localhost:8126/dev/dev-anim-rocket.html"
python -m http.server 8126
pause

