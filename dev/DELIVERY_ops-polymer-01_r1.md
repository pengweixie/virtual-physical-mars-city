# DELIVERY — ops-polymer-01 聚合物线 r1(2026-09-13)

**册子:** `E:\Claude\mars-polymer`(本地仓,无远端;autocrlf false + `* -text`)· 预注册 `12d349b`(首提交,数据前)· 五本账 `358d389` · README 与退役扫描 `1d508b0` · 几何回灌 `d6dcbe6`(工作树干净)。
**城仓:** 只动自己的文件与 CHECKLIST 自己那行;不 commit 城仓;`viewer/main.js` **未动**(sha256 ff2c90fa4e298668,与开工时一致)。引数引册子提交号,不引本文。
**回执/派发:** `dev/REPLY_ops-polymer-01_prereg.md`、`_repo_init.md`、`_ledgers.md`(§7 为几何回灌更正);`dev/DISPATCH_ops-polymer-01_to_hab-village-01.md`、`_to_hab-home-01.md`、`_water_readings.md`。

## 0. 结论

**能造,代价是水不是电。** 选甲醇制烯烃(MTO:SOXE 造 CO + 电解 H₂ → 20 bar 甲醇 → SAPO-34 → 气相聚合 HDPE)。每 kg PE 净耗井水 1.28 L(丙烯有去向)/ 3.03 L(丙烯放掉);井的未分配份额 157 L/sol(按井卡 193 L/sol 的读法)把铭牌压到 **50 kg PE/sol**。电 52 kWh/kg(SOEC,PE-only 基),对铸造厂 298 门槛余 5.7×。费托与氧化偶联在副产记零口径下撞门槛。全线舱外,唯一增压体是控制间。副产氧 400 kg/sol,是硫厂的 2 倍。村衬里 101 t 在 50 kg/sol 下要 2 020 sol(2.7 窗口),177.7 t 要 3 554 sol。

## 1. 记分卡(预期不改,偏出照记)

| 账 | 脚本 → 产物 | 闸 | 记分(命中/偏出) | 一句话 |
|---|---|---|---|---|
| 1 路线 | `ledger/01_routes.py` → `out/01_routes.json` | 13/13(G1.1 首版同义反复,换三道外部已知答案) | 20 / 5 | MTO;电解地板 PEM 23.1 / SOEC 18.3 kWh/kg −CH₂−(预注册 13–15 忘了回收水再电解);每 kg 乙烯 MTO 63 / FT 292 / OCM 316 kWh(副产记零) |
| 2 物料能耗 | `02_mass_energy.py` | 9/9(G2.1c 首版红→H/C 闭合) | 12 / 7 | 每吨 PE:CO₂ 3.14、水 1.28、H₂ 0.143、O₂ 3.43 t;井三读法并印不选 |
| 3 产能需求 | `03_demand_nameplate.py` | 4/5(**G3.3 按自身规则判红保留**;G3.5 NOT EVALUABLE ≠ PASSED→G3.5b) | 11 / 2 | 铭牌 50(预期 100);家电塑料 278 kg 全记热解丝材,「1.06 t 全进口」前提不成立 |
| 4 副产安全 | `04_safety_byproducts.py` | 7/7 | 11 / 3 | 乙烯 1.74 kg 填满一段 78 m³ 脊廊到 LFL,爆燃 11.2× 壳压;舱外 LOC 裕度 62×、淬熄 21 cm |
| 5 造还是运 | `05_make_or_import.py` + `geom_export.mjs` | 12/12(5 预注册 + 7 几何后加;G5.9 首版红留档) | 9 / 2 | 24 件 **233 t**,进口 10.05 t(4.3%);基础 77 t、料仓 96 t 从模块实量 |
| **合计** | `ledger/run_all.py`(提交接其退出码) | **45/46** | **63 / 19**(82 条) | 退役扫描 0 RED |

## 2. 几何回灌(账后、几何时发现,已回写账本)

- **账 5 的散装件质量是拍的。** 首版「防尘棚 + 地坪 20 t」按画出的 46 × 30 m 只有 6 mm 硫混凝土;料仓账里 6 t、卡与回执转抄成 12 t,实量 96 t。现由 `ledger/geom_export.mjs` 构建交付模块、按命名网格量尺寸,账 5 读 `out/geom_dims.json` 算质量。全线 65.7 t 撤回,现值 233 t;进口不变。
- **站址不平。** 引擎自导 1 m 格双线性地形(`ledger/data/terrain_sites.json`,非手抄):B (40,130) 足迹内起伏 1.48 m,A (−54,70) 1.47 m。首版 1.35 m 平台被西侧地形顶穿,现平台 1.65 m、sink_m 1.10,顶面高出最高点 0.16 m,底面距最低点 -0.002 m。设计为就地挖填平衡 330 m³(不运土);全填方要 2.9 kt = 矿余量 0.847 t/sol 的 3426 sol。**城内地形不能开挖,几何按填方画,是声明的资产债。**
- **G5.9 首版判红并留档**:「双线性对最近顶点 ≤0.05 m」最大 0.082 m——顶点间距 3.70 m,带子定错。替换为顶点精确(容差先写 1e-6 m 又错,改 float32 世界坐标能分辨的 1e-4 m)+ 四顶点夹逼。

## 3. 资产(mars-unit-flow 全流程)

| 项 | 结果 |
|---|---|
| 几何 | 防尘棚(不增压,玻璃厂同形)下沿 +X 流向:SOXE 热箱 + 水电解撬 / 合成气压缩 / 20 bar 球铁甲醇塔(剖切露 Cu/ZnO 管束)/ 铸石衬里 MTO 流化床 + 再生器(剖切露灼热床)/ 冷箱三塔 + 级联制冷 / 气相聚合釜(剖切露 PE 粉床)+ 循环气冷却器 / CO₂ 吹扫脱气仓 / 挤出造粒棚(剖切露螺杆)/ 两只打印土料仓 / 棚后 108 m² 辐射板场 / 控制间(唯一增压体)+ 气闸 + 中控屏 / 放空立管 / 进口件箱与催化剂桶架 / 压实土平台 + 10 块基础 + 拖车坡道;同色因果链 青 CO₂ · 蓝水 · 橙红 H₂ · 琥珀甲醇 · 紫烯烃 · 乳白 PE · 白 O₂ |
| 契约自检(skill validate_unit.mjs) | 三角形 13,260 / 5 万;bbox 58.25 × 14.41 × 49.00 m;size_m 58.3 与实测一致;minY 0.00;无 import、无外部资源;**0 WARN** |
| 城仓 validate_units.mjs | ops-polymer-01 全部 OK;该脚本退出码 1 来自既有的 sci-radio-01 / sci-cray-01 / sci-astro-01 / com-l4-01 / sci-orbiter-01 minY,与本单元无关 |
| 声明式动画 | spinners 5(合成气/制冷/循环压缩机飞轮、挤出螺杆、切粒头)、oscillators 2(料仓下料阀)、nightMats 6、blinkMats 1(放空立管信标)、lights 3;无 animate、无 sensors |
| y 包络 | 静态 minY 0.00(平台与坡道底贴 y=0)。spinner/oscillator 24 步全周扫描是在加平台之前跑的(minY −0.000),加平台后运动件整体抬高 1.65 m,未重跑扫描 |
| 城内烟测 | `?colony=1&inspect=ops-polymer-01&debug=1`,手动泵帧:scale 1、57 资产、落位世界高 41.978 = 引擎地形中心 43.078 − sink 1.10;plinth/ramp/10 基础/10 poi_ 锚在;下料阀摆幅 1.200 rad(= 2 × amp 0.6)、螺杆 10 s 转 4.99 圈(30 rpm 应 5.00)。控制台错误 2 条,均为 `viewer/units/sci-rad-05.info.json` 404(别的会话的单元);本单元模块与卡均 200 |
| POI ↔ 卡 | 10 锚 route / syngas / methanol / mto / separation / polymer / pellets / byproducts / safety / make ↔ 10 张双语卡;每张 sim 引册子账本与城卡提交号;卡 sim 只追加,几何回灌条目在 make 卡末尾 |
| 退役扫描 | `ledger/check_retired.py` 扫卡、模块、页、README:13 条退役字面/短语,**0 RED** |
| 落位 / 审计 | 建议 **B (40,130)** sink 1.1;备选 **A (−54,70)**。两案均用最终足迹(含 11 m 坡道,49 m 深)跑 `audit_layout.mjs`:**layout clean: no overlaps, roads clear**;测 A 时临时改 pos,测完恢复,manifest 与 placements 哈希与测前逐字节一致。B 近 ECLSS 进气塔 CO₂ 母管与井,A 起伏不更小 |
| 公开页 | `docs/polymer.html`(英文):账本表 34 行、每行 Produced by 与状态列;What broke 12 条;两张引擎内渲染(隐标签);共享 tokens 与 home.html 逐行一致,仅 `--accent` 为 rust;无本地绝对路径、无外链资源,全部内链可达 |
| 动图 | **未交付**:`scripts/capture_gif.mjs` 产出 5 KB、120 帧单色(246,246,246)的无效文件(无头 rAF 挂起,与其他册同一故障),已删,不留坏文件 |

## 4. 请总控接的

1. **页面登记**:SITE.md 认领表与 index.html 没有 `polymer` 这个 slug。本页顶栏暂设 Prev = works.html、Next = origin.html;works.html 的 Next、origin.html 的 Prev 与 index 卡归总控,本册未动。
2. **按块提交**:`models/manifest.json`、`scripts/placements.json`、`CHECKLIST.md`、`dev/RETIREMENT_CONVENTIONS.md` 工作树里同时有其他会话的并发改动(sci-rad-05、ops-drill-01、ops-roster-01、pwr-grid-01;约定表里 ops-compute-01 也改写了自己那行,本册那行在第 43 行未被触动);本册只改了第 5 节表里注明的那一处。
3. **落位裁定**:B 或 A。
4. **端口 8462 双绑定**:本会话的截图上传服务(skill 默认目录)与 ops-compute-01 会话 10:51 起的同端口服务并存(Windows 上 Python 允许地址复用)。本会话的上传全部落在自己目录并已核验;反方向有两张 `compute-r11-board-day/night.jpg`(11:00)落进了 skill 共享的 shots 目录,不在该会话的 scratchpad 里。本会话的服务已停,对方文件未动。
5. **本册点名的待答**:井的三种读法与 SOEC 氢去向(DISPATCH_water_readings)、村衬里面积口径与门芯(DISPATCH_to_hab-village-01)、家电失效率与耐温/阻燃份额(DISPATCH_to_hab-home-01)。

## 5. 城仓文件与 SHA-256(前 16 位)

| 文件 | 改动 | sha256 |
|---|---|---|
| viewer/units/ops-polymer-01.js | 新增 | 806fe918f36ec602 |
| viewer/units/ops-polymer-01.info.json | 新增(10 卡双语) | 4d5728ce3fd94289 |
| docs/polymer.html | 新增 | 016981389264cf66 |
| docs/assets/polymer/r1-day.jpg | 新增(81 KB,引擎内渲染,隐标签) | 1cab62f7c5a5b0eb |
| docs/assets/polymer/r1-core.jpg | 新增(66 KB) | 56ad0ae77594ff56 |
| models/manifest.json | 仅 ops-polymer-01 一条:pos [40,130]、size_m 58.3、sink_m 1.1 | 86cf952abd7c7c51 |
| scripts/placements.json | 仅 ops-polymer-01 一条 [40,130] | 77b758135e63b509 |
| CHECKLIST.md | 仅自己一行(插在 ops-fire-01 之后) | c4d2f53030a8ff2f |
| dev/RETIREMENT_CONVENTIONS.md | 新增 ops-polymer-01 一行(第 43 行);哈希含其他会话 11:04 前后加的行 | 50ea53035d716431 |
| dev/REPLY_ops-polymer-01_prereg.md | 新增(预注册原文副本) | 0ae6795e658bebcc |
| dev/REPLY_ops-polymer-01_repo_init.md | 新增 | 2c73aa421ec7e84d |
| dev/REPLY_ops-polymer-01_ledgers.md | 新增;§7 为几何回灌更正(追加,不改上文) | 657390339d04a4c6 |
| dev/DISPATCH_ops-polymer-01_to_hab-village-01.md | 新增 | c9ec6806a57a2615 |
| dev/DISPATCH_ops-polymer-01_to_hab-home-01.md | 新增 | d0e451ee4017d8dc |
| dev/DISPATCH_ops-polymer-01_water_readings.md | 新增 | 426cdd1c3949d587 |
| viewer/main.js | **未动** | ff2c90fa4e298668 |
| dev/DELIVERY_ops-polymer-01_r1.md | 本文 | — |

模块哈希与账 5 实量时记录的 `out/geom_dims.json` 中 module_sha256 一致(本脚本断言过)。

册内产物(mars-polymer `d6dcbe6`):`dev/PREREG_ops-polymer-01.md` 0da9e493a42f874f · `README.md` 302a2a311d59fc38 · `ledger/thermo.py` f50f44dfce7277dd · `ledger/city.py` aa46f861b409ce44 · `ledger/01_routes.py` 5ab4692453f6830f · `ledger/02_mass_energy.py` b2159d6ee9f0fbdc · `ledger/03_demand_nameplate.py` 50ba73002e6290b6 · `ledger/04_safety_byproducts.py` a41029202a2be4df · `ledger/05_make_or_import.py` 5589342929b4b13e · `ledger/geom_export.mjs` fa12ad7c0de56240 · `ledger/run_all.py` e3eafea3e3b6e8e2 · `ledger/check_retired.py` 25472bbd11eb8d4b · `ledger/data/terrain_sites.json` b819fe506523bfb1 · `out/01_routes.json` f209a425df6041c8 · `out/02_mass_energy.json` 31d1d280afba4573 · `out/03_demand_nameplate.json` ab659039985633df · `out/04_safety_byproducts.json` 050bbe811d765856 · `out/05_make_or_import.json` d0af9642bc8905b1 · `out/geom_dims.json` 567d5e5effad0e8f · `out/summary.json` 4395b07dddf3745e

Produced by: ops-polymer-01 session(mars-polymer)。哈希与账 5 数字由 `make_delivery` 脚本从文件计算写入,非手抄。
