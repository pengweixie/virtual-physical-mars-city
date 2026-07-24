# Virtual-Physical Mars City

*A Mars city digital twin closing the loop: real HiRISE terrain → WebXR city →
simulation-backed engineering → a real chip running the city's AI.*

![火星城全景](snaps/panorama.png)

从 NASA HiRISE 真实地形(耶泽罗撞击坑,1 m/px)出发,在浏览器里建起一座
火星城数字孪生:20+ 座程序化建模的建筑装备、124 张带仿真背书的知识卡、
毅力号实时任务层、火星真太阳时驱动的昼夜——以及一个完成
**真实世界 → 数字孪生 → AI → 芯片** 闭环的计算中心:大屏上跑着字符级
bigram 语言模型,同一个算法被做成真芯片(sky130 全流程 GDS + 出厂 PCB),
插在旁边的机架里。

## 快速开始

```
python -m http.server 8123        # 仓库根目录
# 浏览器打开 http://localhost:8123/viewer/
```

Windows 可直接双击 `启动火星VR.bat`(自动入库新模型 + 更新毅力号任务数据 +
开服 + 开浏览器)。three.js 已随仓库附带(MIT)。支持 WebXR 的浏览器可
点 Enter VR 进入沉浸模式。

按键:`WASD` 移动 · `F` 飞行 · `V` 环视设备(含发射等动作按钮)·
`M` 轨道视角 · `E` 进入地下城 · `P` 传送到毅力号 · 右下滑块调火星时。

## 城里有什么

| 系统 | 亮点 |
|---|---|
| 能源 | 托卡马克聚变电站(390 MWe)+ 429 m 废热散热阵(600 K 辐射平衡闭合)+ 储能场 L0~L3 仿真链 |
| 火箭 | 星舰(再入走廊/羽流/防热瓦双验)+ 长十乙(网捕回收蒙卡 N=500 捕获率 100%),每火星日定点发射 |
| 科学 | SPAD 激光雷达(白天 5.1 km/夜 15 km 链路预算)+ 光学天文台(512×512 SPAD 焦面)+ 挂在中继星上的 MiniPAN 磁谱望远镜 |
| 通讯 | 3+1 静止轨道星座(全波天线/辐射输运/热弹/轨道积分/排队论/编码蒙卡六线闭环)+ 12 m 深空地面站 |
| 资源 | Rodwell 水冰井(Stefan 校核 669 sol 井寿)+ Sabatier 推进剂厂 + regolith 3D 打印工地 |
| 地下城 | 穿门加载的玄关(城市空腔 diorama)+ PET/CT 医务室(GATE 蒙卡重建,受检者是一台机器人) |
| 感知 | 矿场机器人用声明式传感器通道自主避障——引擎离屏渲染 → CIS CMOS 成像模型 → 5 Hz 感知控制闭环 |

## 海报

| | |
|---|---|
| ![双箭](snaps/rockets-poster.png) | ![科学双站](snaps/science-poster.png) |
| ![通讯链](snaps/comms-poster.png) | ![粒子探测三重奏](snaps/detectors-poster.png) |
| ![资源与算力](snaps/resources-poster.png) | ![轨道视角](snaps/orbit-city.png) |
| ![托卡马克](snaps/tokamak-poster.png) | ![土壤矿场](snaps/mine-poster.png) |
| ![TES 与 CMB 巡天站](snaps/tes-poster.png) | ![MiniPAN](snaps/pan-hero2.png) |

## 目录

- `viewer/` — 引擎(main.js)+ 21 个程序化资产模块 + 知识卡 info.json
- `scripts/` — 数据管线(HiRISE 下载/地形处理/任务更新/模型入库)+
  14 个火箭动力学仿真 + 布局审计/契约校验工具
- `models/` — GLB 资产与 manifest
- `data/processed/` — 地形成品(原始 HiRISE 由 `scripts/download_data.py` 重新获取)
- `snaps/` — 海报与实拍(HTML 源随附,可重渲)
- `extras/tof-pet/` — PET 外壳模型 + GATE→MLEM 重建链 + 机器人扫描
- 协作契约与进度:`MODELS.md` · `CHECKLIST.md` · `STATUS.md` ·
  `SENSOR_SPEC.md` · `EQUIPMENT.md`

本项目由多个 AI session 并行协作建成:总控维护引擎与契约(MODELS.md),
各设计 session 按契约交付资产模块与知识卡,布局与质量由工具把关
(SAT 重叠审计、契约校验、运行时验证)。

## 收录边界(刻意为之)

1. **商业软件仿真(Sentaurus TCAD / COMSOL / ANSYS HFSS 等)**:只收录
   最终的 Python 绘图脚本与导出数据,不含商业工具的工程/模型文件。
   免费/开源工具链(Blender、EasyEDA、Geant4/GATE、CASToR、
   Yosys/OpenROAD 等)的产物按原样收录。
2. **TOF-PET**:只保留外壳模型、重建算法与机器人受检者扫描;
   探测器与前端电子学设计不在本仓库范围。
3. **暗物质实验与 MiniPAN**:蒙卡/仿真源码均不在本仓库(另册项目),
   城内仅含 3D 资产模块与结果图。

## 数据来源与致谢

- 地形:NASA/JPL/University of Arizona — HiRISE DTM & 正射影像
- 任务数据:NASA Mars 2020 (Perseverance) 公开 API,启动脚本每日拉取
- 火星时间:Allison & McEwen (2000) 星历自实现

## 许可

代码:MIT · 资产/文档:CC BY 4.0 —— 见 [LICENSE](LICENSE)。
第三方组件见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
