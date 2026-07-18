@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Spaceport Preview Server
echo ============================================
echo   发射工位单体预览 ops-spaceport-02
echo   地址: http://localhost:8126/dev-preview-spaceport.html
echo.
echo   机位参数 ?cam=   full 全景 / tower 勤务塔 / trench 导流槽
echo                    tank 加注区 / landing 网式回收阵位 / pad 发射台
echo   夜景: 后面加 ^&mode=night
echo   发射准备展开态: 后面加 ^&open=1
echo.
echo   关闭本窗口即停止服务器
echo ============================================
start "" "http://localhost:8126/dev-preview-spaceport.html?cam=full"
python -m http.server 8126
pause
