@echo off
REM com-optical-01 preview - serves the repo root on 8130 (8123 is the main viewer)
cd /d "%~dp0.."
start "" http://localhost:8130/dev/dev-preview-optical.html?unit=com-optical-01
python -m http.server 8130
