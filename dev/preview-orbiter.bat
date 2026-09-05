@echo off
cd /d "%~dp0.."
start "" "http://localhost:8135/dev/dev-preview-orbiter.html?unit=sci-orbiter-01"
python -m http.server 8135
