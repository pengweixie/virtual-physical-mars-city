@echo off
cd /d "%~dp0"
title Mars VR Server
echo ============================================
echo   火星 VR - Jezero Crater
echo   地址: http://localhost:8123/viewer/
echo   关闭本窗口即停止服务器
echo ============================================
echo 正在整理新模型（models\_inbox）…
python scripts\ingest_models.py
echo 正在获取毅力号最新位置和照片（约10秒，失败则用缓存）…
python scripts\update_mission.py
start "" "http://localhost:8123/viewer/"
python -m http.server 8123
echo.
echo [提示] 服务器已停止。若是刚双击就看到这行，说明启动失败：
echo        - 端口 8123 被占用（服务器可能已在运行，页面照样能开）
echo        - 或未安装 Python / 未加入 PATH
pause
