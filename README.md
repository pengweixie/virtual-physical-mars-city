# Mars VR — Jezero Crater

基于真实 NASA HiRISE 数据的火星地形 VR 查看器。地点是耶泽罗撞击坑
（Jezero Crater，18.4°N 77.4°E）——毅力号 Mars 2020 的着陆区，
覆盖古河流三角洲，1 m/像素真实高程与影像。

浏览器里即可漫游；接上 VR 头显（支持 WebXR 的浏览器）可点 Enter VR
进入沉浸模式。

## 快速开始

日常使用：双击项目根目录的 **启动火星VR.bat**，会自动启动服务器并打开浏览器。
关闭那个黑色命令行窗口即停止服务器。

首次搭建（数据和依赖就绪后不再需要）：

```
pip install rasterio numpy pillow
npm install                          # 本地安装 three.js（不依赖 CDN）
python scripts/download_data.py      # 下载 DTM + 正射影像（约 415 MB，可断点续传）
python scripts/process_terrain.py    # 生成 data/processed/ 下的地形资产
python -m http.server 8123           # 在项目根目录启动
# 打开 http://localhost:8123/viewer/
```

## 操作

| 输入 | 动作 |
|---|---|
| 点击画面 | 锁定鼠标视角 |
| WASD / Shift | 移动 / 加速 |
| F | 切换行走（贴地）/ 飞行模式 |
| M / 右上角按钮 | 切换轨道视角（整颗火星）与地表视角 |
| P | 传送到毅力号（轨迹终点 + 最新照片墙） |
| C / 右上角按钮 | "未来火星"科技城：掩土居住舱、温室绿植、道路、着陆场、巡逻车，夜晚亮灯 |
| X / 右上角按钮 | "魔幻火星"城：螺旋塔、水晶林、悬浮岩岛、发光蘑菇、传送门（`?magic=1`）；首次开启会加载 models/crystal 的水晶王城模型（50MB，按钮显示进度） |

轨道视角中常驻显示通信基础设施：3 颗火星静止轨道（17,000 km）中继星
（其一定点悬停在耶泽罗上空，画有对地波束）+ 1 颗 400 km 低轨科学轨道器（动画运行）。
| 右下角滑块 | 调整火星当地时间（日出/黄昏/夜晚），"实时"回到真实时间 |
| VR 左手摇杆 | 移动（跟随视线方向） |
| VR 右手摇杆 | 快速转身（30° snap turn） |

URL 参数可指定视点：`?x=0&z=600&y=900&yaw=0&pitch=-0.55&fly=1`（米 / 弧度）；
轨道视角：`?view=orbit&lat=-8&lon=290`（如水手谷上空）；`?t=18.2` 锁定火星时刻；
`?colony=1` 直接开启未来火星模式。

## 结构

```
scripts/download_data.py    从 HiRISE PDS 归档下载原始数据（公有领域）
scripts/process_terrain.py  PDS .IMG DTM + JP2 正射影像 → heights.bin / texture.jpg / meta.json
scripts/update_mission.py   拉取毅力号最新轨迹/位置/照片（启动脚本自动运行）
viewer/                     Three.js + WebXR 查看器（无构建步骤，直接静态服务）
data/raw/                   原始下载（git 忽略）
data/processed/             生成的地形资产（git 忽略）
data/mission/               毅力号任务数据缓存（git 忽略）
```

## 项目状态

进度快照与待办清单见 [STATUS.md](STATUS.md)（收尾/交接从这份读起）。

## 模型资产

外部模型（Rodin 等生成）的命名、目录与接入规范见 [MODELS.md](MODELS.md)。

## 数据来源

- DTM 立体对：ESP_045994_1985 / ESP_046060_1985，产品
  `DTEEC_045994_1985_046060_1985_U01`
- NASA/JPL/University of Arizona HiRISE，公有领域
- https://www.uahirise.org/dtm/ESP_045994_1985
- 轨道视角全球纹理：Solar System Scope（CC BY 4.0）
- 毅力号轨迹与原始照片：NASA/JPL-Caltech Mars 2020 公开接口，每次启动自动更新
- 火星太阳时：Allison & McEwen (2000) 近似算法

## 已知限制（v1）

- 单块 3.8 km × 3.8 km 地形，1024² 高度网格（约 4 m/顶点）——近地面
  细节偏平滑，站定环顾时无沙粒级细节
- 纹理为 RED 波段灰度图着色，非真彩色
- 天空为简单渐变着色器，无大气散射模拟、无时间系统
