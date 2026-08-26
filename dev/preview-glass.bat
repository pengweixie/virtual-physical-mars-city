@echo off
rem res-glass-01 预览(端口 8132;8123 为主城保留端口)
cd /d "%~dp0.."
start "" http://localhost:8132/dev/dev-preview-glass.html?unit=res-glass-01
python -m http.server 8132
