# DELIVERY — ops-compute-01 细化轮 r1(2026-09-06)

**册子:** `E:\Claude\mars-bigram`(本地仓,无远端)· 首提交 `4ae2dca`(130 文件)· 本轮账与产物 `0ff5840`(31 文件)
**预注册:** `dev/REPLY_ops-compute-01_prereg.md`(数据前写下;六本账各自的记分见下)
**城仓改动:** 只动自己的文件与 CHECKLIST 第 89 行;`viewer/main.js` 未动(sha256 前 16 位 e0e0806bd4207052,与本轮开始时一致)。不 commit 城仓,由总控按路径提交。

## 1. 六本账 · 记分卡(预期不改,偏出照记)

| 账 | 脚本 → 产物 | 闸 | 记分 | 一句话 |
|---|---|---|---|---|
| 1 负载 | `ledger/01_load.py` → `out/01_load.json` | 4/4 绿 | 4 命中 / 1 不可判 | 35 行带卡提交号,8 行缺口不估。**没有任何城卡把算力负荷落在本站**;摄入 15.4 GB/sol、归档 10.3 TB/火星年;E1.1「本站 IT 0.5–10 kW」判**不可判**(不是数小,是无卡定价);孪生实测 2.97 M 三角形 / 55.7 ms/帧 |
| 2 供电 | `02_power.py` → `out/02_power.json` | 4/4 | 4/4 | 无冷水机:泵 1.9 kW @55 kW(3.5%)+ 变流 1.94 kW,PUE 1.08;G-C 北干线 1200 kW 载 70 kW(5.8%),无村支线那类缺陷;孤岛份额 0 kW,电网册 4.8 kW「SCADA UPS」不背书;储能余量 66.6 kW ≥ 55 kW 峰,覆盖倍数 1.85→1.09 若全峰进岛;黑尘暴下份额必为 0 |
| 3 散热 | `03_thermal.py` → `out/03_thermal.json` | 5/5(G3.4 第一版红→改模型) | **1 命中 / 3 偏出** | v0 竖鳍墙 320 K 排 69 夜 / 57 昼 / 49 昼含日 kW(预注册 20–45,方向错);积尘 α0.68 下朝天面正午被吃一半;最优族 70° 近竖直南北向:570 W/m² 板面最坏昼 / 889 夜;59.4 kW 需 104 m²,建 3 × 12×4.5 = 162 m²(夜 144 / 最坏昼 92 / 地面 280 K 79 kW);ISS 闸 259 vs 147 W/m²(×1.76);pwr-radiator-01 610 MW 复现 609.8 |
| 4 辐射 | `04_radiation.py` → `out/04_radiation.json` | 3/3(G4.3 第一版是「愿望闸」,红→改机理闸) | 2 命中 / 1 偏出 | **不能闭合**:缺 Jezero 地表微分谱/LET 谱(已派发 sci-rad-01)、器件 σ 与 SEL 阈(采购)。通量上界 8.93 /cm²/s(sci-rad-01 卡 62 hit/s ÷ 6.94 cm²);SEU 按 σ 1e-15…1e-13 扫描:SEC-DED 判决在扫描内翻转(σ 1e-13 时 1 h 刷新也不够)→ 刷新周期是策略旋钮,σ 到手前定不了;SEL、MB-1 sky130 抗辐射:未知 |
| 5 MB-1 真源审计 | `05_mb1_audit.py` → `out/05_mb1_audit.json` | 3/3 | 5/5 | 23 条主张:11 支撑、5 支撑带限、3 部分、2 设计非实物、1 无产物、1 与产物矛盾。撤回:「金盖陶瓷工程样片」(无流片)、「fabbed eval board」(未下单,57 clearance DRC 未清)、「267 LUT」→ 212(utilization.rpt)、「四工具位级对拍」→ 三仿真器 + 综合、「UART 吐字」为芯片接口 → 并行 CHAR/VALID/READY;补写 setup −0.02 ns @100 MHz(页原只写 hold);「与大屏同源」在 v0 不成立 → 本轮把表和算术搬上屏才成立 |
| 6 数据链 | `06_datalink.py` → `out/06_datalink.json` | 4/4 | 4/4 | 收 15.4 GB/sol,对地均值 0.965 Mbps = 10.7 GB/sol,收/发 1.44:本站是科学数据落地/压缩/留存点;上合缓存 0.22 TB 不构成约束;那根光缆 = UART 115.2 kbit/s(用 133 bit/s),MB-1 满速 25 Mbit/s 会跑赢它 200× |

**交叉矩阵已核:** IT 功率(账 1→2→3 同一字段 55 kW)、板温 320 K(账 2 PUE ↔ 账 3 面积)、摄入量(账 1 ↔ 账 6 同表)、天空 210/240 K(账 3 ↔ pwr-radiator-01 / pwr-grid-01)。

**推翻了自己什么(What broke,页上同):** 散热账 4 条预期错 3 条(鳍间逃逸 31% 不是 ~10%;积尘太阳项;地面项);腔体孔径模型高 20%(超出小孔假设,换平行板视因子 + 反射级数后两法差 1.3%);辐射账第一版闸断言了希望的结果;卡与页的 5 句「做出来了」实为「设计过」;新包络压到 pipe-heat-2 管廊(东移 8 m);GIF 抓取工具在本会话产出 5 KB 无效文件,**未交付动图**。

## 2. 给 pwr-grid-01 的回执(引 mars-grid@8f74f29 的三份 json)

- `01_load_ledger.json` ops-compute-01 「mean 40 / peak 55,derived: 8 racks × ~5 kW」:是从 v0 画的 8 个盒子读出的**装机容量**,城内无卡把负荷落在本站。建议改写为「装机容量(按图),负荷未定价」。本站新几何仍是 8 机架,登记值可保留为容量。
- `08_load_second_closure.json` 「辐射墙 ~100 m² 有效、320 K 对 210 K,43.6 kW,与 40 一致(9%)」:那面墙按本账是 49–69 kW(昼含日/昼/夜),你的数不算错;但两条路线互证的是同一张图,不是负荷。新辐射场容量 92–144 kW。
- `04_islanding.json` tier 3 「ops-compute-01 island 4.8 kW,SCADA UPS inside」:本站无 SCADA(你自己的 scada 卡把它放在控制间),这 4.8 kW 请撤;本册登记 0 kW 强制份额。
- `03_transmission.json` G-C 北干线:按村支线的法子核过,四单位峰值和 70 kW = 5.8%,无缺陷;res-tank-02、sci-rad-02 不在你的负荷表,列出未定价。

## 3. 派发与待回

- `dev/DISPATCH_ops-compute-01_to_sci-rad-01_spectrum.md`:地表微分谱、中子谱、SEP 最坏、LET 谱、口径、薄墙是否算屏蔽。回执前账 4 保持「不能闭合」。
- 待办(本册):户外回路工质(硅油类 / 伴热)未定;sci-weather-01 的 τ 记录到位后替换账 3 的 τ 0.5;负载表随新卡增行。

## 4. 资产细化(mars-unit-flow 全流程)

| 项 | 结果 |
|---|---|
| 几何 | 42.4 × 8.5 × 20.9 m;机房 24 × 16 × 6 m(南面玻璃带 + 实体门洞 1.4 × 2.3 + 气闸廊,可走入);8 机架 42U 级 + 后门液冷 + 顶部歧管;CDU(西墙内,双泵 spinner 90 rpm)+ 穿墙套管 + 干管;辐射场 3 × 12×4.5 m 倾 70° 朝北排距 6.5 m + A 形撑 + 底部集管 + 安全橙护栏 + 警示桅(blink);东墙变流/UPS 柜 + 光纤入口柜;工作站 + 版图铭板展台(canvas 画自 GDS 的 2×2 宏);屋顶剂量节点;车辙 + 确定性散石;尘膜 pass |
| 大屏 | **live** 跑 MB-1 逐比特一致采样器(`mb1-cdf-data.js`,表 sha256 660ebf90b488bbbe);开机自检 220 字符对 Python 金标准:Node **PASS**、城内 **PASS**;boot 日志如实写「board design present, no silicon fitted」 |
| MB-1 刀片 | 2 号机架托盘,复用 `mb1-demo-board.js`(scale 0.7);道具属性写在卡上 |
| interior | **不做独立室内单元**:一块屏、一份 animate、保留昼夜(屏光夜洒机房是 v0 证据);地表建筑本身可走入;三角形 5.9 k(DOM 6.5 k)远未到预算 |
| 预览页校验(skill validate_unit.mjs) | 三角形 5,912 / 5 万;bbox 42.40 m = size_m 42.4;minY −0.00;spinners 2、nightMats 4、lights 4、10 poi_ 锚;animate 确定性 PASS;**0 WARN**;1 FAIL = 「模块内有 import」——两个 import 是纯数据/纯几何 helper(`mb1-demo-board.js`、`mb1-cdf-data.js`),references/eda-to-3d.md 记录的合规写法,与 v0 相同 |
| 城仓 validate_units.mjs | ops-compute-01 SKIP(DOM 依赖,与 v0 同),其余单位状态与本轮开始一致(5 个既有 minY XX 与本单元无关) |
| y 包络 | 静态 minY 0.00(基座 0..0.4 在 root,其余抬 0.4);全循环扫描 0–12 s worstY 0.000 |
| 城内烟测 | `?colony=1&inspect=ops-compute-01&debug=1`(mars@2129e35 工作树 + 本轮文件):scale === 1、54 资产、console 零报错、`group.userData.mb1SelfTest === 'PASS'`、CDU 泵 600 帧转 15 圈、落位 (−82, 44.5, 120) |
| 落位 / 审计 | 新包络 42 m 压 pipe-heat-2(x −109 ± 4)→ ROAD CLASH;pos (−90,120)→(−82,120),`models/manifest.json` 与 `scripts/placements.json` 同改;`audit_layout.mjs`:**layout clean: no overlaps, roads clear** |
| POI ↔ 卡 | 10 锚:screen / mb1 / racks / cdu / radiator / power / datalink / radiation / die / airlock ↔ info.json 10 张,一一对应;v0 的 chip、cooling 空壳卡撤,由 die、radiator 取代 |
| 知识卡 | 5 → 10 张,中英双语,每张 sim 引本轮账的 json 与城卡提交号;`ledger/check_retired.py` 对卡/模块/页/README 扫描退役字面:15 处出现、**0 RED** |
| 公开页 | `docs/compute.html` 重写:台账 27 行,每行 Produced by + 状态列(measured / log / report / estimate / account / declared gap);What broke 8 条;新增两张实拍 `assets/compute/r1-day.jpg`(74 KB)、`r1-night.jpg`(74 KB),旧图说明改为「design, not built」;共享 tokens 段未动;无外链 |
| 动图 | **未交付**:`scripts/capture_gif.mjs` 两次(inspect 取景 / 手动机位)均产出 ~5 KB 无效文件(本会话浏览器面板隐藏、rAF 挂起的已知坑),已删除,不留坏文件 |

## 5. 城仓文件清单与 SHA-256(前 16 位)

| 文件 | 改动 | sha256 |
|---|---|---|
| viewer/units/ops-compute-01.js | 重写 | ab0389164f473e6b |
| viewer/units/ops-compute-01.info.json | 重写(10 卡) | d58cdb057faae3c1 |
| viewer/units/mb1-cdf-data.js | 新增(生成) | ee4707e7b20d8b8f |
| docs/compute.html | 重写 | 588108db58665a65 |
| docs/assets/compute/r1-day.jpg | 新增 | a4f370471052b27f |
| docs/assets/compute/r1-night.jpg | 新增 | cd2d88b32a294427 |
| models/manifest.json | ops-compute-01: size_m 26→42.4,pos →[-82,120] | 3c170d48648fe711 |
| scripts/placements.json | ops-compute-01 →[-82,120] | 90f43ce44b86fdd8 |
| CHECKLIST.md | 仅第 89 行(自己的行)追加 r1 小结;CRLF 保持 | 14a4776f7b67e9fc |
| dev/RETIREMENT_CONVENTIONS.md | 新增 ops-compute-01 一行(res-glass-01 行之后) | a76e1e617eecd439 |
| dev/REPLY_ops-compute-01_prereg.md | 新增 | cca2b8db3a63335f |
| dev/REPLY_ops-compute-01_repo_init.md | 新增 | bd48da2b40e83f0b |
| dev/DISPATCH_ops-compute-01_to_sci-rad-01_spectrum.md | 新增 | 5bb0378c5a872b75 |
| dev/DELIVERY_ops-compute-01_r1.md | 本文 | — |
| viewer/main.js | **未动** | e0e0806bd4207052 |

册内产物(mars-bigram@0ff5840):`ledger/out/01_load.json` 2c370d5ff2256017 · `02_power.json` 6b3c2b9d77324913 · `03_thermal.json` eeec215ed60e7d25 · `04_radiation.json` 870ad65d253a0d2a · `05_mb1_audit.json` 0eb39a411bcf1b1b · `06_datalink.json` 81777733e34d08da;日志 `ledger/logs/{iverilog_tb_mb1,xsim_tb_mb1,iverilog_tb_cdf_sram_equiv,vivado_impl_arty}.log`;`tools/mb1_model.py` 语料改为城市七句、`build/`、`web/mb1_twin.html`、`fpga/arty_build/mb1_arty.bit` 均按新表重生成。

`dev/REPLY_glass_runD_liner.md` 是别的会话的未跟踪文件,本轮未动。

Produced by: ops-compute-01 session(mars-bigram)。引数请引提交号(mars-bigram `4ae2dca` / `0ff5840`,城卡以总控提交为准),不引本文。
