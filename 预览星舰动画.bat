@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Starship Launch/Landing Animation
echo ============================================
echo   星舰 发射/着陆 动画演示 veh-rocket-01
echo   地址: http://localhost:8126/dev-anim-rocket.html
echo.
echo   26 秒循环时间线(源自 L2 仿真):
echo     ① 动力下降反推着陆  ② 坐地夜停
echo     ③ 点火推力建立      ④ 上升重力转弯
echo   演示钩子: 喷焰挂点 / 翼面铰点 / 发动机摆动 / 夜窗
echo.
echo   关闭本窗口即停止服务器
echo ============================================
start "" "http://localhost:8126/dev-anim-rocket.html"
python -m http.server 8126
pause
