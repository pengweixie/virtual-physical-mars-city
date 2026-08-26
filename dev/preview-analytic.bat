@echo off
rem sci-lab-01 分析测试中心预览（8131 = 本册专用端口；8123 是主城保留端口）
cd /d "%~dp0.."
start "" http://localhost:8131/dev/dev-preview-analytic.html?unit=sci-lab-01
python -m http.server 8131
