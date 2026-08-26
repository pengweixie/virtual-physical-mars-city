@echo off
rem res-foundry-01 冶金与机加工车间 预览(端口 8128;8123 是主城保留端口)
cd /d "%~dp0.."
start "" http://localhost:8128/dev/dev-preview-foundry.html?unit=res-foundry-01
python -m http.server 8128
