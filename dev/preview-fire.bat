@echo off
REM ops-fire-01 preview - serves the repo root on 8129 (8123 is the main viewer)
cd /d "%~dp0.."
start "" http://localhost:8129/dev/dev-preview-fire.html?unit=ops-fire-01
python -m http.server 8129
