@echo off
REM res-cryo-01 preview — serves the repo root on 8124 (8123 is the main viewer)
cd /d "%~dp0.."
start "" http://localhost:8124/dev/dev-preview-cryo.html?unit=res-cryo-01
python -m http.server 8124
