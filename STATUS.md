# 项目状态（收尾快照 · 2026-07-05；v0 闭环达成 · 2026-07-13；硅片合拢 · 2026-07-18）

**★ v0 完成**：计算中心 ops-compute-01 收官——大屏在浏览器里真实运行一个字符级
bigram 语言模型（nanoGPT 教程的起点模型），live 生成火星文本。闭环成立：真实火星
→ HiRISE 数字孪生 → 城内计算中心 → 运行真实 AI 代码 → 生成关于火星的文本。整座城
（地形/任务层/时间/轨道星座/科技城全套装备/魔幻城/穿门室内场景）作为 v0 交付。

**★ 硅片合拢（07-18 · mars-bigram session）**：大屏跑的这个 bigram 算法已被做成真芯片
**MB-1**（char-level bigram 推理 ASIC，RTL→FPGA→sky130 GDS 全流程 + 出厂 PCB，见
`mars-bigram`）。一块 MB-1 评估板作为刀片插进 ops-compute-01 的 2 号机架、
数据缆连向大屏——**软件孪生在屏上，硅片本体在架里，同一个 bigram 两种实现**。板 3D 是
`viewer/units/mb1-demo-board.js`（纹理绘自真实版图 467 段走线，不 import three，契约合规），
被 ops-compute-01.js 复用；info.json 加了 `mb1` POI 知识卡；预览
`dev-preview-mb1-compute.html`。闭环最后一环补上：AI 的硅实现就插在算它的机架上。



阅读顺序：README.md（怎么跑）→ 本文件（进度与待办）→ MODELS.md（资产契约）。

## 已完成

**数据管线**（scripts/）
- download_data.py：HiRISE Jezero DTM + 正射影像下载（断点续传）
- process_terrain.py：DTM → 高度网格/纹理/meta（含地理参考）
- update_mission.py：毅力号轨迹/位置/最新照片，启动时自动更新
- ingest_models.py：models/_inbox 投放箱自动入库（解压/转GLB/归档/登记 manifest）

**查看器**（viewer/main.js，单文件，无构建步骤）
- 3.8 km × 3.8 km 真实地形（1 m/px，210 万三角形）+ WebXR
- 毅力号任务层：轨迹线、漫游车模型（Sol 707 途经点）、每日新照片墙（P 键传送）
- 火星时间系统：Allison-McEwen 星历，真太阳时驱动天光/雾/星空，右下滑块
- 轨道视角（M 键）：火星全球 + Jezero 标记 + 3 静止中继星（对地波束）
  + 400 km 科学轨道器（动画）+ 日-火 L2 CMB 巡天站（晕轨道动画，示意距离）
- 科技城开关（C 键）：穹顶/掩土居住舱/温室/光伏/裂变堆/着陆坪/巡逻车/道路网/夜灯
- 魔幻城开关（X 键）：法师塔（螺旋坡道+水晶冠）/水晶簇（自写菲涅尔着色器）
  /悬浮岩岛/符文石环传送门/发光蘑菇/光路，+ Rodin 水晶王城
  （models/crystal/2/base_tex.glb，280 m，PBR + 夜间自发光）
- 启动：双击"启动火星VR.bat"（自动 ingest + 任务数据更新 + 开服 8123 + 开浏览器）

**工作流约定**
- Rodin 资产（魔幻城）：丢 models/_inbox/<资产ID>/，启动自动入库
- Claude 直建资产（科技城）：viewer/units/<资产ID>.js 代码模块，契约见 MODELS.md 第 4 节

## 加载器合并（07-13 修复）

并行开发期间出现过**两套 manifest 加载器**（`loadUnits` + `loadManifestAssets`），
导致 code 资产被加载两遍、且分属 colonyGroup / surfaceGroup 显隐不一致。已合并为
**单一 `loadUnits`**：统一处理 code + model + scatter，全部挂 colonyGroup（随 C 键显隐），
POI 知识卡 + 设备浮标签 + blink（blink_ 节点与 userData.blinkMats 两种约定）+ 昼夜
灯光 + inspect 全部走一套数组。已删除重复加载器。

**已落位资产（13 项，manifest 全部有 pos）**：pwr-fusion / pwr-radiator /
pwr-storage / res-isru / res-rodwell / res-tank-02 / ops-printer / sci-lidar /
sci-obs / veh-rocket / veh-raptor / env-scatter（14 件荒野散件）/ hab-tunnel。
CMB 巡天站在轨道视角 L2（`?view=cmb`，知识卡已接 cosmic_microwave 设计结论）。

**已知小缺口（非阻断）**：
- `spinners` 效果（pwr-storage 声明）引擎侧未实现 → 该部件静止，不报错
- 知识卡 info.json 仅 lidar/obs/rodwell/tank/scatter 有；fusion/radiator/storage/
  rocket/raptor/tunnel 用模块内置 userData.label 浮标签（无距离LOD知识卡）
- res-rodwell/res-tank/sci-lidar 在 models/ 下有历史 GLB 残留（manifest 用 code 版），可删
- ~~未交付：ops-spaceport-01~~ 已由 **ops-spaceport-02 长十乙发射工位**取代并落位 (750,250)；res-mine-01 已于 07-17 交付（见下"感知资产通道"）；**veh-rocket-02 长十乙已于 07-17/18 交付落位**（见下节）

## 动画架构（07-13）+ 标签策略

- **标签仅环视显示**：主页面/自由行走不再显示任何浮标签；子设备标签与 POI 名称
  只在环视(V)某资产时出现（proximity 知识卡仍在走近时弹出，那是面板不是浮标签）。
- **动画分两类**（MODELS.md §4）：
  - 连续循环 → `userData.animate(t,dt,ctx)`，"未来火星"层可见时每帧驱动
    （挖矿机器人、打印臂等）；GLB 的 `loop_*` clip 由 AnimationMixer 自动播放。
  - 一次性触发 → `userData.actions={名称:fn}`，环视该资产时生成"▶ 名称"按钮点触；
    `meta.schedule={action,ltst}` 可按火星时定点自动触发（如每天 14:00 发射）。
  - 引擎侧机制已全部实现并回归验证；等 res-mine-01 / ops-spaceport-01 交付即生效。

## 感知资产通道 + res-mine-01 交付（07-17 · mars_soil session）

引擎新增**传感器通道**（MODELS.md §4c）：资产声明 `userData.sensors=[{camera,hz,width,height}]`，
引擎按预算（全局每帧≤1 次渲染、XR 中暂停、随 colonyGroup 门控）渲染离屏帧并回填
`sensor.data/frame/stamp`；资产在统一的 `animate(t,dt,ctx)` 里消费像素。改动三处共 ~60 行
（unitSensors 注册于 registerMotion / driveSensors 调度器 / 主循环一行钩子），对未声明
sensors 的资产是纯旁路，13 项既有资产零影响（回归通过）。

**res-mine-01 土壤矿场已交付落位**（180,-120，size_m 79 实测免缩放，模块 + info.json 5 张
知识卡 + manifest + CHECKLIST 已更新）。挖矿机器人为城内首个**感知自主资产**：桅杆导航
相机（64×64@5Hz）→ CIS 传感器成像模型（自研 CMOS 项目 CIS 的验证参数：QE 0.60、
满阱 17.9ke⁻、读噪 1.76e⁻、10-bit ADC，含散粒/暗电流/量化噪声与自动曝光）→ 亮度阈值
避障 → 状态机自主采掘循环。引擎无传感器通道时同文件自动退回烘焙动画（优雅降级）。
城内实测：15s 泵帧 70 传感器帧、自动曝光 12→57ms 收敛于城内真实光照、机器人完成
挖掘→运土→卸料自主转移。`?debug=1` 现暴露 `window.__mars` 内窥句柄（units/unitSensors/
driveSensors 等，真浏览器验证用）。注：隐藏标签页 rAF 挂起会暂停整个引擎循环（含传感器），
无头验证需手动泵帧（`__mars.driveSensors(t)` + `unitAnims` 循环）。

## 长十乙发射回收链（07-17/18 · mars_rocket2 session）

- **veh-rocket-02 长十乙**（竖立待发）交付并落到 ops-spaceport-02 发射台托架上
  （manifest：pos 同工位 [750,250]、rot -108、sink_m **-6.95**=托架面 8.1m-箭底 1.0m-工位 sink 0.15）。
  5 张知识卡含 7 个仿真的蒸馏结论；`发射` action + schedule ltst=14.0 每火星日例行发射
  （升空 1600 m 自动复位归位）。资产含 stage1/upper 命名子组（分离动画契约）。
- **ops-spaceport-02 修复覆盖**：boxT 助手补 parent 参数（4 避雷塔顶平台曾悬浮原点上空 95 m）。
- **仿真套件**（scripts/sim_*_veh_rocket_02.py，7 件 + PNG）：升轨/返场/挂缆缓冲/蒙特卡洛/
  舵效包线/ISRU 战役/跳跃演示弹道；关键数：火星 RTLS 构型 GLOW 298 t、LMO 18~24 t、
  返场储备裕度 13%、网捕概率 100%、ISRU 200 kWe 即 3.3 发/窗口。
- **发射回收演示**：mars_rocket2/dev-demo-recovery.html（弹道驱动的两体演示：升空→热分离→
  上面级续飞→一子级挂缆网捕→绞车放缆触台）；弹道数据 units/veh-rocket-02.flight.json 已随资产入库。

## 工具账本（07-18 盘点 · 各系统自行维护）

全程用到的仿真/设计/验证工具与使用次数。**统计口径 = 落库产物**（session 内部
迭代不计）。主城行由总控维护；另册行由各设计 session 自行填报（**07-18 已全部
填报完毕**）。总控同日对 TCAD / Geant4 / Virtuoso / MB-1 四册做了**独立落盘复核**
（直接扫项目目录数产物），与自报口径一致；复核补充的落盘数字以「复核」标注。

### 仿真

| 工具 | 次数（落库口径） | 产物 / 归属 |
|---|---|---|
| Python/NumPy 动力学（RK4/MC） | 14 脚本 + 14 图 | 星舰 7 + 长十乙 7（mars_rocket2） |
| COMSOL | 3 项研究（卡片引用 9 处） | 防热瓦传热（comsol/）、中继星热平衡、太阳翼模态 |
| 解析物理计算 | 72 条 📐 进卡 | 辐射平衡/帕邢/屏蔽账/链路预算/覆盖几何/气闸经济学… |
| 机制层推导 | 34 条 🔬 进卡 | sim 数字背后的定律层 |
| CIS 成像模型 | 1 套参数，5 Hz 持续运行 | 矿场机器人相机全链噪声（唯一"在跑"的仿真） |
| MuJoCo 动力学（火星重力+等效切削载荷） | 1 MJCF 模型 · 4 轮全循环仿真 · 3 通道×192 样本曲线烘焙 | 矿场 RASSOR 臂角/俯仰/起伏（sim/rassor-01，mars_soil session） |
| Sentaurus TCAD | **~18 战役 · 器件变体 ~18 个**（T10/iproc10/iw1–6/iwG97/iwJ14/iwK 系列/iwK115/iwL20）· 宽倍增工艺迭代 **7 轮**收敛 iwK115 · 每变体 McIntyre BP 击穿扫描 **8 偏压点** · BV(T) 173–293 K 温度扫 · DCR/B2B 分层扫（多 T×多偏压）· Geiger 瞬态 **1 次**（8h CPU 收敛）· 边缘环 iwL20 **1 轮** · iwK115 终验 BV(T) 4 温 + PDE(λ) 4 带 · 落库 1 套焦面参数 + ~20 图；**mars_lidar SPAD(spad40_nir/sci-lidar-01,另一器件系)**：结构 4 版 p10c→p10h→p10i→p10j(TCAD VM 自跑 2 轮剂量修整定版 p10j@60V) · pre-tapeout 5 项全关(dBV/dT +9.3mV·K / V_sus 45.8V / PDE(V) 52–76V 平坦 / AP<0.1% / DTI 版图铁律) · McIntyre 击穿+PDE 重构+DCR+Geiger 瞬态 · 交付 PDE@905 40.3% · B2B 253 cps·cell⁻¹ · 阵列 DCR 2.65e5@-40℃（详尽逐轮 chain 数在 spad40_nir 项目册）；**复核**（07-18 扫 spad40_mars/nir/sentaurus 三仓落盘）：SDE 结构脚本 **60** · sdevice deck **104** / 落盘 .plt **109** · sprocess **42** · 后处理 py **74** + 图 **70** | spad40 → 天文台卡（88 V / 0.383 Hz/px）；spad40_nir → sci-lidar-01 探测器（60 V / 905 nm 微脉冲） |
| Geant4 系 MC | com-relay：**1 次生产输运**（spe_dose.mac，2×10⁵ 质子，QGSP_BIC_EMY，40 层剂量-深度，一次过零返工）→ TID 曲线；深地：**几何提取 1 表**（8 个 G4 探测器源文件 → 40+ 实测尺寸，GEOMETRY_REF.md）· **信号链响应模型 1 套**（G4 本体未实跑：gate941 缺 yaml-cpp/jsoncpp，经批准改 NEST 风格 Python）→ JSON 1（348 KB，PMT 1521+1791 坐标+3 事件波形）+ 图 4 · 尺度/事件可视化 3 脚本 → GIF 2 + 静图 3 · viewer 事件动画 2 接口（playNeutrinoEvent/playEntryCutscene，浏览器实测 0 错）· Fable review 1 轮 12 findings 全修 + 复查抓 1 残留（回灌 1 份 BUILD_SPEC） | 中继星 bus 卡 TID（2/4/10 mm→11.2/7.1/2.9 krad）+ solar EOL 5.4 kW + 质量预算屏蔽 23 kg；深地暗物质实验室 |
| Ansys HFSS（com-relay） | **2 次落库求解**（32 GHz 锥喇叭全波方向图 ffgain.csv；28–36 GHz S11 扫频 s11rep.csv）；SBR+ 整碗 3 试受阻未落库（脚本留档 hfss_sbr_dish.py，非图形 AnalyzeAll 挂死） | ka 卡 58.2 dBi/0.226°/S11 −26.6 dB + artifact §04/§06 |
| Python/NumPy 数值仿真（com-relay） | **6 脚本 + 6 图落库**：PO 口径积分、位保 J2+C22/S22 传播（先 GEO 验证 1.76 m/s/yr）、780 d 会合周期数据流 DES、LDPC min-sum 自研蒙卡、M/G/2 调度 DES、质量预算 | skeep/dte/rf/bus 卡 + artifact §12–§16（65 Tb/周期、109 m/s/15 yr、距香农 1.8 dB、湿重 1362 kg） |
| Cadence Virtuoso | **版图单元 12 个**（SKILL nograph 批绘于 cen618）· **Calibre DRC 迭代 ~29 轮**（sense_inv 5→0 / div2 2 / cnt2 1 / fe_ls 4 / px_pixel 3 / px15 3→2→0 / arr4 51→0 / rowdrv 1 / collatch 2 / hbpad 3 / tile 25→6→0）· **LVS CORRECT 11 次**（全 0 差异）· **xRC PEX 提取 3 次**（px_pixel / px15 / px_arr4）· **后仿 4 次**（px15 3/3 光子 · arr4 列复用 0101 · 全链 SI→COL）· 前仿 Spectre ~10 TB（全角含 ss/−100 °C）· 落库 1 条读出链；**复核**（07-18 扫 mars_spad_rox 落盘）：GDS **29**（含 div2 v1–v7 等迭代版，去重 12 cell）· 仿真 psfascii **10** + MC trip-point **40** · 版图/波形图 **12**（DRC/LVS 报告在 VM，本地文档口径与自报一致） | SPAD 像素/阵列/瓦片 DRC+LVS+后仿 |
| RTL 仿真/FPGA 验证 | 7 RTL 模块 · 自检 TB 5 组(含 12×随机回归) · iverilog+xsim 双仿真器逐拍一致(1134185ns) · Python 金标准 6 项自测 · 4 工具位级对拍 · 抓修 2 RTL bug(+review 4) · FPGA Arty A7-35T bitstream 时序 MET(WNS+3.29ns)；**mars_lidar MCS(sci-lidar-01)**：4 RTL 模块(axil_mcs/mcs_histogram/trigger_gen/pulse_sync) · 自检 TB 2 组 12 用例(tb_mcs T0–T6 / tb_axil A1–A5) · iverilog 全绿 · Vivado synth+P&R 1 轮收敛(496 LUT/447 FF/1 BRAM36,WNS+1.39ns) · 抓修 2 真 bug(BRAM 模板爆 95k LUT / 2 拍间隔丢计数) · MCU 固件主机测试 2 套 12 用例(test_mcs 7 / test_tec 5,对同源热模型闭环) | MB-1 char-level bigram ASIC（mars-bigram）；mars_lidar MCS 直方图 → sci-lidar-01 采集 |
| Python/FreeGS 0D-系统（mars-tokamak 另册 `tokamak`） | **19 脚本 + 28 图落库**（0D 系统设计/1.5D 输运/偏滤器 2 点+Lengyel/氚循环/失超/破裂 VDE/ISRU/质量/寿命，8 报告 + 12 章 artifact）· FreeGS **2 自由边界 GS 平衡**（双零基准 + X 点靶长腿 fx≥20，各含 q95 校准重解） | pwr-fusion/pwr-radiator 设计（v4 基线：R0 3.70 m/B0 8.85 T/Pfus 848 MW/净电 176 MWe） |
| COMSOL（mars-tokamak） | **2 求解研究**（TF 磁体跑道→D 形，J×B 体载荷+固体力学，~667 s/次）+ 膜应力后处理 + **3 云图导出**（5 java） | 峰值应力 3361→999 MPa（D 形消弯矩）→ pwr-fusion TF 加强肋 |
| Geant4 系 MC（mars-tokamak） | **18 生产输运落库**（2×10⁵ 源中子/次 @14.06 MeV，Shielding 物理表）跨 4 轮（FLiBe 厚度/Be 增倍/LiPb/屏蔽）+ 能谱双档 TF 计数 → scan_report.md 4 章 + 5 图（Ubuntu VM，conda 工具链） | 净 TBR 1.10@88% / REBCO 屏蔽寿命 / 磁体核热 → pwr-fusion 包层 |
| Ansys HFSS（mars-tokamak） | **1 落库求解**（40×8.5 mm 矩形波导 TE10，3–8 GHz 频扫 101 点，43 s）→ sparams.csv | LHCD 截止 3.75 GHz 验证↔解析 c/2a 吻合 → pwr-fusion RF 模块 |
| COMSOL（TES/CMB 探测器，另册 `TES`） | **~22 batch 求解**（纯 Java 无头流 comsolcompile→comsolbatch 自建）· 悬空岛非线性热 FEM 定 **6 器件热学基线腿长**（150 基线 117μm→MFT140/166 886/967.5→方案A 135.7/171.7 1096/1024→P_sat 回填 745.7/709.7→非均匀腿 dual140/166 742.6/953.4）· 每基线 **2–4 轮细网格夹逼收敛**（抓真缺陷：裸 SiN 岛 +5.6 mK 扩散热阻→加 Au 热扩展层+缩腿；粗网格假收敛→autoMeshSize(2) 复验）· 落库 6 腿长 + results.txt | TES 热学基线（G=15.7 pW/K@140、Tc 171 mK、τ_eff 2.6 ms）→ cosmic_microwave 探测器层 → CMB L2 巡天站 |
| Ansys HFSS / pyaedt（TES/CMB 探测器） | **~48 落库求解**（pyaedt 无头全流程自建）：Nb 微带 Z0 收敛(S11 −15→−34 dB) · 双缝天线 4 版(560→684μm) · BPF140/166 定稿 + 方案A 重综合(9 变体网格+高收敛判定 MaxPasses 20) · 宽扫 450 GHz 抓 3f0 谐波重入(407/515) · μMUX 单谐振器 13 solve+2 本征模定 f0=3.718 GHz/Qc 耦合器 · **天线-匹配-双工-BPF 级联全波 4 版收敛 77/78%**(=任务 0.80 链路预算，审计抓 4 处集成缺陷) · 119+195 级联负结果 72.6/**42.0%**(天线 76% 带宽墙，救回坏决策) | MFT 140/166 双色像素微波链定稿 + μMUX 读出 + 频段配对可行边界 |
| gdstk GDS + 电路综合 + 容差 MC（TES） | **GDS 掩模 ~10**（像素 150/140/166/dualband v1-v2 + 4×8 与 8×8 阵列 + μMUX 64 谐振器 + witness 标定片 + rf-SQUID 单元）· BPF 电路综合 4 频段(ABCD+差分进化) · 双工物理拓扑优化多轮 · **蒙特卡洛容差**(P_sat 裕量 2.50±0.07 / μMUX 频梳 σf-vs-通道良率) · Neumann 细丝互感验证 · **回执 6 版**应答任务评审 5 项 | 流片级掩模 + PDK 询价包(JJ_PDK_MAPPING) + witness n_eff 标定流程 → cosmic_microwave 器件侧闭环 |
| 电池储能仿真链（pwr-storage 另册 `mars_pwr_storage`） | L0~L3 五层闭环：**5 脚本**(Python 4 + COMSOL java 1) · **PyBaMM 电化学 6 解**(SPMe+集总热/Prada2013 LFP：sol 循环 1 + 倍率扫描 5×) · **COMSOL L2 稳态传热 6 工况**(3 冷却×2 产热,1 .mph) · **L3 调度 3 场景**(晴 sol / 60-sol 尘暴 / 生存包线 5 点) · **L0v2 闭环校准 2 PCS 方案** → 落库 **4 design_point JSON + 5 图** | 储能场 pwr-storage-01（设计点 833 kW）+ info.json 7 POI 卡数字全部背书 |
| PET/CT 重建扫描（复用 pet-ct-design projector/recon，GPU/cupy） | 1 次机器人扫描 = 2 CT-FDK（单色 60 keV + 多色 120 kVp bowtie/噪声/水BHC）+ 1 CTAC（HU→μ@511 双线性）+ 1 PET AC-MLEM（40 it）· 定量 CT 7 部位 HU vs 真值、PET 4 热源恢复 → 落库 1 六联图 + 1 JSON | 医疗室 PET/CT 机器人受检者演示（mars_medical/out/scan，07-18 · mars_medical session）|

### 设计

| 工具 | 次数 | 产物 |
|---|---|---|
| three.js 程序化建模 | 21 模块 | 16 地表 code 资产 + 2 室内 + 中继星 + MB-1 展板×2 |
| Blender 脚本建模 | 2 座（后移植 three.js） | 托卡马克、散热阵原型 |
| gpt-image-2 + Rodin 2.5D | 3 轮生成 → 1 座落位 | 水晶王城（仅魔幻城管线） |
| trimesh 转换/烘焙 | ~5 次 | 3 个 GLB 入库 + 水晶 2 轮贴图烘入 |
| EasyEDA Pro | LNA 偏置板（com-station 册）：库检索 32 次(43 器件全解析) · 原理图 2 版(A:41件105脚/B:43件109线) · 连通性真值表 2 轮均 0 短路 0 失配 · A* 布线 5 轮全 0 布不通(219–227 线/54–58 孔) · 推送+铺铜+Gerber 出厂 6 次 · DRC/分析 ~12 轮(终态 44 间距违规档案化=网格布线器下限) · EDA 崩溃恢复 2 次 · 评审 1 轮→4 发现→rev B 落 3 修复；**MB-1 评估板**：库检索全解析 27 器件(+中途 USB-C→Micro-USB 改型) · 原理图连通性真值表 129 脚 0 短路 0 失配 · A* 布线 13 轮到 0-fail(补丁版路由器解 LQFP/USB 逃逸) · push/铺铜多轮 · DRC 到 Connection 0(Clearance 57 残留待 1h 精修) · Gerber+BOM+CPL 出厂 · EDA 崩溃恢复 1 次；**mars_lidar 三板(sci-lidar-01)**：原生 API 建原理图 3 板(FE 55脚 / LD 52脚 / CTRL 73脚,连通性真值表各 0 短路 0 失配) · 图框美化+可视导线重排 3 板再校验 0 失配 · A* 布线 3 板 fails=0(LD 含 0.4mm EPC2212/LMG1020 wcsp) · 按层飞线校验+GND 缝合(LD 3桥 / FE 2桥) · CTRL 返工:删重复封装+连接器同孔短路修复→重布线→DRC 迭代 5+ 轮至 Clearance 0/Connection 0(触碰网清假报 + 过孔删重建 + 铺铜重建) · Gerber+BOM+CPL 出厂 3 套 · 沉淀 pcb_skill 技能 | MB-1 评估板 467 段走线 → 城内 3D；LNA 偏置板 rev B Gerber → com-station-01 馈源卡引用（mars-com-station/hw）；mars_lidar FE/LD/CTRL 三板 Gerber(hw/fab) → 城内 sci-lidar-01 |
| sky130 GDS 流程 | 1 颗芯片 · Yosys→sky130 HD 综合(SRAM 黑盒,2 次修正,逻辑 0.033mm²) · OpenROAD P&R 6 轮收敛(每轮钉 1 个物理问题,终态布线 DRC 0) · 4×OpenRAM SRAM 宏(等价 TB 11069 读校验 0 失配) · klayout 出 GDS 26.3MB · hold+0.14ns MET | MB-1 bigram ASIC |
| Blender GLB 导出（petct_full.blend → three.js） | 1 件（petct.glb，32 421 tri，gantry+bed 双节点，3 自发光材质，+Y up 落地 y=0）| 医疗室 PET/CT 整机资产（mars_medical/out，07-18 · mars_medical session；医疗室内景暂挂待接入）|

### 验证

| 工具 | 次数 |
|---|---|
| validate_units（契约校验） | 10+ 轮，现 17 资产全绿 |
| 真浏览器闭环验证（mars_soil） | 全循环 y 包络扫描 6 轮（0.05~0.25s 步长 × 全 mesh Box3）· 视觉自主 150s 长测 3 轮（状态循环数/避障最小间距/围栏触发）· 传感器坏点/亮点二维扫参基准 1 套 · 城内泵帧实测 1 轮（70 传感器帧/曝光收敛） |
| audit_layout（SAT 防重叠） | ~6 轮（揪出 1 次四连重叠；mate 白名单 07-18 加入） |
| headless Edge + raw CDP | 累计 20+ 场景截图/数值探针（07-18 单日 5 批 15 场景） |
| 知识卡体系 | **124 张 POI 卡**，其中 58% 带仿真结论 |

配比画像：约 1/3 建模、1/3 算账、1/3 质检。

## 未来 action list（用户规划，暂挂）

- **hab-foyer-01 地下城内景**：已交付但暂挂沙盒——它是室内场景，套不进主项目的
  地表摆放模型；等档位3整体方案连同"穿门加载"机制一起接入。
- **深地实验室 sci-deeplab-01（-3000 m，100t 暗物质实验 / dark matter experiment）**：
  施工单已定稿 `mars_deep_lab/BUILD_SPEC_sci-deeplab-01.md`——从开源深地液氙 TPC
  参考几何线性 3.0× 放大到 100t（场笼⌀3.55m、水罐⌀14×15m、洞室22m）。室内场景，
  交付到 `viewer/interiors/`，等"穿门/竖井下降"机制接入。可选 GDML 直转。
- **医疗室 PET/CT**：地下城内挂一台 PET/CT（用户自有设计），扫一个机器人（机器人
  暂不细化）。同属室内场景。
- ~~以上三项都依赖"室内场景加载"机制~~ **穿门加载机制已实现（07-13）**：地表走到
  门/竖井触发区按 E 淡入独立室内 scene（`viewer/interiors/*.js`，独立光照/无昼夜），
  Esc 或走到出口淡出返回地表；已提供占位 `interiors/hab-foyer-01.js` 并绑到
  hab-tunnel-01 入口，`?interior=<id>` 可直达。契约见 MODELS.md §4b。深地实验室/
  医疗室/hab-foyer 真版按此契约交付即接入。

## 通讯卫星（已算，见下方决策）

地表通讯覆盖计算完成（scripts 见 scratchpad）。结论：**核心 3 颗火星静止轨道
（连续覆盖 ±71° 纬度，含所有现实基地），稳妥 +1 备份=4；全球含两极 +2 极轨=5 或
改 8 颗 MEO Walker；地球链路抗上合 +1~2 颗日-火 L4/L5**。当前查看器已有 3 静止 +
1 低轨科学器 + CMB L2 中继跳——已达"3 连续 + 中继"基线。

## 动画统一（07-13）

所有建筑的运动统一到一套**声明式运动词汇**（MODELS.md §4），引擎每帧用同一
ctx `{t,dt,night}` 驱动，不再各写各的转动代码：
- `userData.spinners=[{node,axis,rpm}]` 连续旋转（雷达碟/风机/浮环）
- `userData.oscillators=[{node,axis,prop,amp,period,phase}]` 正弦往复（臂/快门）
- `userData.animate(t,dt,ctx)` 自定义（机器人路径、屏幕程序、状态机）
- `blinkMats`/`blink_` 闪烁；`actions`+`meta.schedule` 一次性触发
引擎侧 `registerMotion(g)` 是唯一注册入口；GLB 资产用 `effects:[...]`（observatory/
beam_nir）作等价物。**迁移提示**：现有手写转动的模块（及 pwr-storage 的
`effects:['spinners']`→应改 `userData.spinners`）交付更新时按此收敛。

## Review 与修复（07-13 · Fable 审阅）

审计结论与已执行修复：
- ✅ **git 已建库**：首次提交 b6507cb（58 文件），仓库本地 `.git`。
  .gitignore 已改为排除大文件但**追踪 models/manifest.json 与全部 info.json**。
  bat 为 GBK+CRLF，repo 配置 core.autocrlf=false 保字节精确。
- ✅ **beam_nir 契约修复**：引擎现优先读模块的 `userData.beams=[{pos,dir}]`
  （MODELS.md §4 规则5），旧硬编码降级为无锚兜底。validate_units 全过。
- ✅ **STALE GLB 归档**：res-rodwell/res-tank/sci-lidar 的旧 GLB 移入
  `models/_archive/`（session 标注"留档"，故不删）。
- ✅ **com-relay-01 孤儿已修复（07-16 · com-relay session，双 Fable 评审 B1 项）**：
  已实例化到静止轨道环（3 主 + 1 备份替换简易星，`relaySat()`，+Z 天底），轨道视角
  两级知识卡（<8000 km 汇总 / <2500 km 最近子设备全卡，8 张含 🔬/📐 双层）。有意
  **不进 manifest**（防地表加载器把它当无位地面资产）。同轮修复 5 处几何 bug + 7 处
  数字声明（评审报告见 artifact §09），卡片全部真解背书（12 次仿真，另册已入账）。
- 遗留债（P2/P3）：main.js 2084 行单文件待 v1 拆分；5 资产缺知识卡；
  无头截图验证 flaky（建议真浏览器 + ?debug=1 为主）；scatter/PORTALS 硬编码。

## 待办（按优先级）

0. ~~manifest 统一加载器 + POI 系统~~ **已完成（2026-07-05）**：
   type:"model"/"code" 双通道加载、size_m 缩放、sink_m 嵌地、userData.nightMats/
   lights 昼夜接线、effects 钩子（beam_nir 905nm 光束可视化、observatory 圆顶
   夜间开缝+巡天铰接动画）、POI 三级 LOD（圆点→名称→知识卡，同屏 3 标签限流）。
   已落位：聚变堆(-140,40)、散热阵(-60,200)、星舰(120,200)、LiDAR站(-480,-80)、
   天文台(-560,-220)；LiDAR/天文台 info.json 知识卡已写（源自设计项目蒸馏）。
   **未做**：scatter 撒放、blinkMats 闪烁钩子（调味包交付时补）；
   代码资产的 info.json（聚变堆等 4 个由设计 session 按 MODELS.md 第 5 节补交）
   —— 追加（07-05 晚）：**设备环视模式**：V 键环视最近设备（按包围球自动取景，
   拖动旋转/滚轮缩放，该设备 POI 标签常显，V/Esc 返回原位）；URL 直达
   `?inspect=<资产ID>`；资产交付入库进度看板见 CHECKLIST.md
2. **科技城 11 项装备**：设计说明已全部交付给设计 session（见下），等模块回来逐个落位
   - sci-obs-01 天文台 / sci-lidar-01 激光雷达站（夜间绿色光束引擎侧做）
   - res-isru-01 燃料厂 / res-rodwell-01 水冰井架 / res-mine-01 矿场
   - pwr-fusion-01 托卡马克 / pwr-storage-01 储能场
   - ops-printer-01 打印工地 / ops-spaceport-01 发射回收站（含未来发射动画钩子 userData.rocket）
   - env-scatter-01 荒野调味包（8 种小件）/ hab-tunnel-01 地下城入口
3. **落位规划**（引擎侧，我管）：分区布局 + 道路/管线连接 + 效果接线（光束/火炬/闪烁/发射事件）
4. 远期备选：地形扩到整条 25 km DTM 条带或瓦片化、加压廊道网、多人、
   魔幻城传送门真传送、CMB 站精模替换

## 已知事项

- 端口 8123 若被其他 session 占用，视觉验证临时换端口（曾用 8931）
- .bat 必须 GBK + CRLF 编码（含中文时）；重写用 scratchpad 的 UTF-8 源转换
- 无头截图验证：贴图分离的 GLB 会输给虚拟时间竞态——贴图一律烤进 GLB
- ?y= URL 参数是本地高度（地形 0..153 m），给低了相机会钻进地下（画面诡异）
- models/crystal/1 与 crystal/2/src 是历史归档；crystal/2/base_conv.glb（无贴图中间产物）可删
