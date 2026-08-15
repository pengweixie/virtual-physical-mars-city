@echo off
cd /d "%~dp0.."
title magic-city layer preview
echo ============================================
echo   magic-city  Magic Mars layer (X key overlay)
echo.
echo   Standalone module preview:
echo     http://localhost:8130/dev/dev-preview-magic.html
echo   Triangle delta vs HEAD - generate the baseline first, then ?rev=base:
echo     git show HEAD:viewer/magic/magic-city.js ^> dev/_magic-city-baseline.js
echo     http://localhost:8130/dev/dev-preview-magic.html?rev=base
echo   In-city smoke test (first X pulls the 50 MB palace GLB, allow ~40 s):
echo     http://localhost:8130/viewer/index.html?magic=1^&t=1^&debug=1
echo     http://localhost:8130/viewer/index.html?magic=1^&t=15^&debug=1
echo.
echo   Art layer - no info.json cards. Handoff: dev/HANDOFF_magic-city.md
echo.
echo   Close this window to stop the server (8123 is reserved for the main viewer)
echo ============================================
start "" "http://localhost:8130/dev/dev-preview-magic.html"
python -m http.server 8130
pause
