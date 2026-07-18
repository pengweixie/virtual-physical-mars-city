@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Starship Preview Server
echo ============================================
echo   星舰单体预览 veh-rocket-01
echo   地址: http://localhost:8125/dev-preview-rocket.html
echo.
echo   机位参数 ?cam=   full 正面 / tiles 瓦面 / base 裙部
echo                    nose 鼻锥 / eng 发动机仰视
echo   夜景: 后面加 ^&mode=night
echo   剖面: ?cam=cut^&cut=1 全身 / cutcrew^&cut=1 乘员段
echo         / cuteng^&cut=1 推力段
echo.
echo   关闭本窗口即停止服务器
echo ============================================
start "" "http://localhost:8125/dev-preview-rocket.html?cam=full"
python -m http.server 8125
pause
