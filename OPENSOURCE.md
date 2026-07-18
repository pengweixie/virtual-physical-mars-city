# Mars City Digital Twin — 开源发布包 v0

从 NASA HiRISE 真实地形出发的火星城数字孪生：浏览器/WebXR 查看器、
多 session 协作的资产管线、124 张带仿真背书的知识卡、以及一个完成
"真实世界 → 数字孪生 → AI → 芯片"闭环的计算中心。

## 快速开始

```
python -m http.server 8123        # 仓库根目录
# 浏览器打开 http://localhost:8123/viewer/
```

Windows 用户可直接双击 `启动火星VR.bat`（自动入库新模型 + 更新毅力号
任务数据 + 开服 + 开浏览器）。three.js 已随包附带（node_modules/，MIT）。

按键：WASD 移动 · F 飞行 · V 环视设备（含动作按钮）· M 轨道视角 ·
E 进入地下城 · P 传送到毅力号 · 右下滑块调火星时。

## 目录

- `viewer/` — 引擎（main.js）+ 21 个程序化资产模块 + 知识卡 info.json
- `scripts/` — 数据管线（HiRISE 下载/地形处理/任务更新/模型入库）+
  14 个火箭动力学仿真 + 布局审计/契约校验工具
- `models/` — GLB 资产与 manifest（水晶城仅保留成品 base_tex.glb）
- `data/processed/` — 地形成品（原始 HiRISE 由 `scripts/download_data.py` 重新获取）
- `snaps/` — 六大系统海报及其 HTML 源
- `extras/tof-pet/` — 见下方"收录边界"
- 协作契约与进度：`MODELS.md` · `CHECKLIST.md` · `STATUS.md` ·
  `SENSOR_SPEC.md` · `EQUIPMENT.md`

## 收录边界（刻意为之）

1. **商业软件仿真（Sentaurus TCAD / COMSOL / ANSYS HFSS 等）**：
   只收录**最终的 Python 绘图脚本与导出数据**，不含商业工具的工程/
   模型文件（`comsol/` 内 .mph/.java/.class 已移除，保留导出数据
   `qdot_entry.txt`；防热瓦结论另有 `scripts/` 内的有限差分交叉验证，
   可独立复算）。免费/开源工具链（Blender、EasyEDA、Geant4/GATE、
   CASToR、Yosys/OpenROAD 等）的产物按原样收录。
2. **TOF-PET**：只保留三样——外壳模型（`extras/tof-pet/shell/petct.glb`
   + Blender 导出脚本）、重建算法（`extras/tof-pet/recon/`，GATE 3D
   蒙卡→MLEM/散射校正链的 Python 实现与绘图）、机器人受检者扫描
   （`extras/tof-pet/robot-scan/`，含成品图与报告）。探测器与前端
   电子学设计不在本包范围。
3. **暗物质实验与 MiniPAN**：两者的蒙卡/仿真源码均**不在本包**
   （另册项目）。城内仅含各自的 3D 资产模块（three.js 几何）与
   结果图片（PMT 点亮图、能量分辨、磁场示意等）。

## 数据来源与致谢

- 地形：NASA/JPL/University of Arizona — HiRISE DTM & 正射影像
  （Jezero Crater, 1 m/px）
- 任务数据：NASA Mars 2020 (Perseverance) 公开 API，启动脚本每日拉取
- 火星时间：Allison & McEwen (2000) 星历自实现

## 许可

代码:MIT · 资产/文档:CC BY 4.0 —— 见 `LICENSE`。
第三方组件与数据来源见 `THIRD_PARTY_NOTICES.md`。
