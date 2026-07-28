@echo off
cd /d "%~dp0"
title Mars VR Server
echo ============================================
echo   Mars VR - Jezero Crater
echo   URL: http://localhost:8123/viewer/
echo   Close this window to stop the server
echo ============================================
echo Ingesting new models (models\_inbox) ...
python scripts\ingest_models.py
echo Fetching Perseverance position and photos (10 s, cached on failure) ...
python scripts\update_mission.py
start "" "http://localhost:8123/viewer/"
python -m http.server 8123
echo.
echo [Note] If the server stopped immediately:
echo        - port 8123 may be in use (a previous instance still running)
echo        - or Python is not installed / not on PATH
pause
