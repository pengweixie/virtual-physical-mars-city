@echo off
rem sci-astro-01 天体生物学实验室 预览(端口 8127;8123 是主城保留端口)
cd /d "%~dp0.."
start "" http://localhost:8127/dev/dev-preview-astro.html?unit=sci-astro-01
python -m http.server 8127
