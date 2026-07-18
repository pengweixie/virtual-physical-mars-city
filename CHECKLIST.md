# 资产入库清单

**子 session 使用说明**：交付完成后，把自己那行的"交付"格改为 ✅ 并填日期；
"落位"和"知识卡"两列由总控 session 维护，不要动。新资产（清单外的）自行加行。
交付标准见 MODELS.md（代码资产=模块进 viewer/units/ + manifest 登记；
GLB 资产=丢 models/_inbox/ 跑一次启动脚本）。

状态图例：✅ 完成 · 🔶 部分（登记了 manifest 但没交模块）· ⬜ 未交付

**动画交付约定（给 res-mine-01 / ops-spaceport-01 等带动画的资产）**：引擎侧
钩子已就绪（MODELS.md §4），模块只写逻辑、无需接线：
- 连续动作（挖矿机器人避障/挖掘、打印臂）→ `group.userData.animate = (t,dt,ctx)=>{}`，
  "未来火星"层可见时每帧驱动；机器人路径/避障时序自己在 animate 里编排。
- 一次性事件（火箭发射）→ `group.userData.actions = { '发射': ()=>{置标志} }`，
  环视(V)时自动生成"▶ 发射"按钮；逐帧推进由 animate 读标志演进。可选
  `meta.schedule = { action:'发射', ltst:14.0 }` 按火星时每天定点自动触发。
- 一次性事件**不要写成循环**。

## 能源 pwr

| 交付 | 资产ID | 名称 | 类型 | 知识卡 info.json | 落位 | 日期/备注 |
|---|---|---|---|---|---|---|
| ✅ | pwr-fusion-01 | 托卡马克聚变电站 | code | ✅ 8卡（功率账本与散热阵互校验） | ✅ (-140,40) | 07-12 交付；07-18 补 info.json 8 POI |
| ✅ | pwr-radiator-01 | 废热散热阵 429m | code | ✅ 3卡（600K 辐射平衡 610≥585MW 闭合） | ✅ (-80,370) | 07-12 交付；07-17 北迁清重叠；07-18 补 info.json |
| ✅ | pwr-storage-01 | 储能场（电池阵+再生燃料电池） | code | ✅ 7卡（含 L0~L3 仿真结论） | ✅ (-230,90) | 07-13 交付（模块+info.json 7 POI，真实米制 60m，L0~L3 仿真链闭环校准设计点 833kW，validate 全过） |

## 资源 res

| 交付 | 资产ID | 名称 | 类型 | 知识卡 | 落位 | 日期/备注 |
|---|---|---|---|---|---|---|
| ✅ | res-isru-01 | ISRU 推进剂工厂 | model | ⬜ | ✅ (40,25) | GLB 已交付并落位 |
| ✅ | res-rodwell-01 | Rodwell 水冰井架 | code | ✅ 7卡 | ✅ (-5,110) | 07-13 交付（模块+info.json 7 卡，GLB 留档 models/） |
| ✅ | res-tank-02 | 备用储水罐 13m³ | code | ✅ 3卡 | ✅ (-16,118) | 07-13 交付（模块+info.json 3 卡，GLB 留档 models/） |
| ✅ | res-mine-01 | 土壤矿场 | code | ✅ | ✅ (180,-120) | 07-17 交付（模块+info.json 5 卡）；机器人=感知自主（传感器通道 MODELS.md §4c，引擎无通道时退回烘焙循环） |

## 科学 sci

| 交付 | 资产ID | 名称 | 类型 | 知识卡 | 落位 | 日期/备注 |
|---|---|---|---|---|---|---|
| ✅ | sci-lidar-01 | 大气激光雷达站 | code | ✅ 8卡 | ✅ (-480,-80) | 07-13 升级为 code 资产（模块+info.json 8 卡，真实米制，POI/beam/夜光活锚，validate 全过；GLB 留档 models/）；07-10 首版 |
| ✅ | sci-obs-01 | 光学天文台 | model | ✅ 6卡（含 spad_rox 焦面仿真结论） | ✅ (-560,-220) | 07-12 交付，夜间开缝巡天动画已接 |
| ✅ | sci-pan-01 | MiniPAN 穿透粒子分析仪 | code(orbital-payload) | ⬜（按约定只建模不做分析） | ✅ com-relay-01 主星天顶甲板 | 07-18 按 Codex/PAN 的 PANSim MiniPAN_Sep2022 几何移植：双 NdFeB 环磁体 + TOF×2 + TPX3×2 + 硅微条×8，200×200×250 mm，1.7k 面；不进 manifest，引擎挂载 |

## 运维 ops

| 交付 | 资产ID | 名称 | 类型 | 知识卡 | 落位 | 日期/备注 |
|---|---|---|---|---|---|---|
| ✅ | ops-compute-01 | 计算中心（v0 收官★） | code | ✅ 4卡 | ✅ (-90,120) | **v0 闭环单元**：大屏 live 运行字符级 bigram(nanoGPT 起点模型)生成火星文本；机架 blink、芯片展台、辐射散热；夜间屏光洒满机房。userData.animate 驱动。**07-18 接入 MB-1 评估板刀片**(mars-bigram 项目的 bigram 硅片,插 2 号机架,数据缆喂大屏,mb1 POI 知识卡)——闭环合拢:屏上软件孪生↔架里硅片本体 |
| ✅ | ops-printer-01 | 3D 打印工地 | model | ⬜ | ✅ (95,5) | GLB 已交付并落位 |
| ⬜ | ops-spaceport-01 | 火箭发射回收站 | code | ⬜ | ⬜ | 设计说明已发；**发射用 userData.actions{'发射'} 触发按钮 + 可选 meta.schedule 定时**（见顶部动画约定） |
| ✅ | ops-spaceport-02 | 长十乙发射工位（网系回收） | code | ✅ 5卡 | ✅ (750,250) rot-108 | 07-17 交付，同日按首飞新闻照重做 v2：蓝色密格勤务塔+橙色发射台（海南商发二号工位实照涂装）、**网式回收阵位**（"领航者"号构型上岸：四内倾格构柱+顶部环框+井字缆网兜+张紧绞车，箭体 4 挂钩无腿捕获，info.json poi_net 详卡）；回转平台+摆杆 actions{'发射准备','合拢复位'} 状态机、避雷塔/网架障碍灯 blinkMats、风杯 spinner、转运轨道；14.3k 面，validate 全绿；dev-preview-spaceport.html 可目检；**07-18 修复**：boxT 助手忽略第 10 参 parent，4 避雷塔顶平台曾悬浮 (0,95,0)（mars_rocket2 session 覆盖交付） |

## 载具 veh

| 交付 | 资产ID | 名称 | 类型 | 知识卡 | 落位 | 日期/备注 |
|---|---|---|---|---|---|---|
| ✅ | veh-rocket-01 | 星舰（着陆状态） | code | 🔶 6 POI + L1/L2 推进仿真（升轨+着陆轨迹/T-W/ISRU耦合） | ✅ (120,200) | 07-12 交付；07-13 深挖外形/表面/内构/6猛禽 + info.json 6卡；L2 仿真×6(升轨Δv4.02km/s / 再入走廊[-13°,-12°] / 翻转≥4km点火 / 反推~38t / 倾覆坡度极限11° / 羽流冲刷~1.4MPa坪载+3km喷砂) + L3 防热瓦传热(COMSOL+FD交叉验证，3cm瓦钢壁仅300K) + 返回任务账本(总Δv6.43带133t)，发射/回收全链闭环见 EQUIPMENT.md §9 |
| ✅ | veh-rocket-02 | 长十乙运载火箭（竖立待发） | code | ✅ 5卡 + 仿真×7 | ✅ (750,250) 发射台托架 sink-6.95 | 07-17 交付（mars_rocket2 session）：Ø5m×67m 单芯+梦舟飞船+逃逸塔、7×YF-100K、栅格舵/着陆腿收放 actions、CanvasTexture 铭牌、stage1/upper 分离子组+上面级真空机；actions{发射}+schedule ltst14.0（升空自动复位，日更例行发射）；07-18 仿真套件×7（scripts/sim_*_veh_rocket_02.py）：RTLS 构型 GLOW 298t 升轨Δv4.13、返场 41.6/48t 裕度13%、挂缆缓冲单钩95kN裕度2.6×、MC N=500 捕获率100%（σ0.55m）、舵效包线<20%（栅格舵=网捕挂钩）、ISRU 每发215t/1174MWh 200kWe→3.3发/窗口、SSTO旁证可行；发射回收演示弹道 veh-rocket-02.flight.json + dev-demo-recovery.html（mars_rocket2） |
| ✅ | veh-raptor-01 | 猛禽发动机（检修展示台） | code | 🔶 4 POI + Raptor2 性能卡 | ✅ (138,188) | 07-13 交付；单台猛禽检修展示台 11.4k面，info.json 4卡（室压/膨胀比/Isp/全流量循环）|

## 居住 hab

| 交付 | 资产ID | 名称 | 类型 | 知识卡 | 落位 | 日期/备注 |
|---|---|---|---|---|---|---|
| ✅ | hab-tunnel-01 | 地下城入口 | code | ✅ 7卡（屏蔽账/气闸经济学） | ✅ (-330,-30) | 07-13 交付+落位（居住区旁平地）；真实米制 60m，13.9k 面，nightMats/lights 齐；07-18 补 info.json 7 POI |
| ✅ | hab-lift-01 | 地下城人员电梯站 | code | ✅ 4卡（-3000m 竖井对齐 tunnel 设定；绳长 1/g、耳压 52Pa/s、功率 47kW、漏射立体角四本解析账） | ✅ (-372,-18) 居住区旁、隧道口西 42m；PORTALS 已挂"按 E 进地下城（电梯）" | 07-18 交付（清单外新资产）：地下城垂直交通地表端——打印层井口楼+提升机房+吊装梁，8m 坪 1.4k 面，validate 全绿；建议落位 hab-tunnel-01 山丘旁；地下端=玄关 hab-foyer-01 电梯门组；同日补 info.json 4 POI（3 几何锚点 + 1 pos） |
| ✅ | hab-foyer-01 | 地下城玄关（内部场景） | code | ⬜（已埋 poi_lift） | ✅ 穿门已接（隧道口+电梯站两个 PORTAL；总控补 entry/exitZone 契约与 manifest 驱动加载，07-18 实测入内零报错） | 07-18 交付（kind:interior，validate 按设计跳过）：车辆气闸厅 20×12 + 观景窗看城市空腔 diorama（塔楼剪影+发光窗点阵+街灯+天穹光带）+ 城际电梯门组（对应地表 hab-lift-01）；挂接 hab-tunnel-01 大门内侧，等引擎穿门加载机制；2.7k 面，贴地 minY=0 |
| ✅ | hab-clinic-01 | 地下城医务室（内部场景） | code | ⬜（已埋 poi_petct/bore/console/hotlab） | ✅ ?interior=hab-clinic-01 直达实测通过（PET-CT 青环/升降床在场）；玄关内门→医务室的室内互通待 v1 机制 | 07-18 交付（kind:interior）：PET-CT 影像套间——按 . 真机参数复刻整机（Ø700 孔径/青色喇叭发光环/37 模块 PET 环/两级升降病床）+ 铅玻璃观察窗操作间 + FDG 热室传递窗 + 抢救车等；8.1k 面，贴地 minY=0；该项目后续将供 petct.glb 高模可替换 |

## 环境 env

| 交付 | 资产ID | 名称 | 类型 | 知识卡 | 落位 | 日期/备注 |
|---|---|---|---|---|---|---|
| ✅ | env-scatter-01 | 荒野调味包（8 种小件） | scatter | ⬜ | ✅ 14 件撒放 | 07-13 交付（含 5 个 poi_ 锚点 + info.json）；引擎 scatter/blinkMats 钩子已实现 |

## 通讯 com（轨道资产——不进 manifest，引擎在轨道视角实例化）

| 交付 | 资产ID | 名称 | 类型 | 知识卡 | 落位 | 日期/备注 |
|---|---|---|---|---|---|---|
| ✅ | com-relay-01 | 火星静止轨道中继星 | code(orbital) | ✅ 8卡（轨道视角两级近距卡） | ✅ 静止轨道 3主+1备 | 07-16 交付；07-18 运动改声明式（SADA 翼 spinner ×2 + 对地天线 gimbal oscillator ×2），引擎新增 orbitAnims 通道——轨道视角下翅膀/天线此前是冻结的，现已驱动 |
| ✅ | com-station-01 | 通讯基站（地面站） | code | ✅ 8 卡（链路预算 sim + physics，13 个 poi_ 锚点） | ✅ (-350,-280) 总控确认（manifest 补 module 字段） | 07-18 交付（原清单名 com-ground-01，按设计说明 meta.id=com-station-01）：12m 主碟+馈电网络+低温 LNA+HPA+频标+DTE+信标全套；全声明式动画（oscillator ×3 + blinkMats ×2 + nightMats）；size_m 17.7 实测免缩放 14.2k 面；?inspect=com-station-01 引擎实测 placed/scale=1/振荡精确 |

## 魔幻城 mag（Rodin 管线）

| 交付 | 资产ID | 名称 | 类型 | 知识卡 | 落位 | 日期/备注 |
|---|---|---|---|---|---|---|
| ✅ | mag-palace-01 | 水晶王城 | model | ⬜ | ✅ (-170,-730) 280m | 现路径 models/crystal/2/base_tex.glb（历史命名） |
