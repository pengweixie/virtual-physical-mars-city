# DELIVERY — ops-compute-01 r1.1(2026-09-13):收编花名册看板 · 账 4 按 sci-rad-01 回执重算

**起因:** `dev/DISPATCH_ops-roster-01_board_offer.md`(ops-roster-01,同日)。另有两份早已落城仓、本站此前未并入的回执:`dev/REPLY_sci-rad-01_to_ops-compute-01_spectrum.md`(城 `21a136f`,09-08)与 `…_spectrum_products.md`(`efa91c6`,09-09),都是本站 09-06 派发的答复。
**册子:** `E:\Claude\mars-bigram`,账 4 r1.1 提交 `c3dcdda`(r1 `0ff5840`,首提交 `4ae2dca`,无远端)。
**城仓:** 只动本单元的模块、知识卡、公开页,CHECKLIST 与 RETIREMENT_CONVENTIONS 各自己一行,两份回执与本文件。`viewer/main.js` 未动(`git diff` 空,sha256 前 16 位 ff2c90fa4e298668)。不 commit 城仓。r1 四个文件总控在 `8b30c82` 收时与本站交付逐字节一致。

## 1. 看板:收编

| 项 | 结果 |
|---|---|
| 决定 | 收。放在机房坐标 (17.0, 0, −2.0),前脸朝 +Z,正对南面气闸门;世界坐标约 (−65, 44.9, 118) |
| 理由 | 这间机房是城市科学数据落地、留存的地方(账 6);看板读出的是城市关于自己的人知道什么、不知道什么 |
| 不收的部分 | 大屏不接 `roster.json`:大屏是 MB-1 位级采样器,开机自检是一道闸,不混第二个数据源 |
| 接法 | `RosterBoard(THREE, ROSTER)` 默认 opts;6 个 nightMats 并入(单元合计 10);`userData.roster` 透传到单元根 |
| 托管版本 | `roster.json` 39c58470f248e69e、`roster-data.js` 49f2d5be4a40392e,与 `DELIVERY_ops-roster-01_r1.md` 所记一致 |
| 净空 | 配电柜背排 z ≤ −3.6、展台 z ≥ 2.4、机架 x ≤ 5.4;Node 逐件包围盒:0.5 m 以上零相交 |
| 卡 | 新增 `roster` 卡(双语),只写部件是什么、谁的数据、构建时版本、null 的画法、本站编制的登记;不转抄对方表里的任何数 |

## 2. 账 4 r1.1(`ledger/04_radiation.py` → `ledger/out/04_radiation.json` bb78221f03af2aa4)

| 项 | r1(0ff5840) | r1.1(c3dcdda) |
|---|---|---|
| 带电粒子通量 | 8.93 /cm²/s(62 hit/s ÷ 6.94 cm²)——**撤回**:那是像素击中率,不是粒子通量 | 3 /cm²/s,持有方背景知识采用值,含次级 |
| G4.1 | 62/6.94 × 6.94 = 62,恒等式,不可能变红 | 持有方分解:3 × 6.94 × 9.5 px = 197.8 对 ~198;× 3 px = 62.5 对 62 |
| 闸 | 3/3 绿 | 4/4 绿(新增 G4.4:SEP 期间不可纠率随通量比平方) |
| 记分 | 2 命中 / 1 偏出 | 1 命中 / 2 偏出:E4.1 在更正后通量上偏出(预期带围着像素击中率写,预期不改);E4.2 仍偏出 |
| 平静 ECC | σ 1e-13、1 h 刷新、64 GB 每火星年 ~6 次 | 64 GB 0.71 次、512 GB 5.7 次:判决随容量翻转 |
| SEP | 无 | S5 最硬(γ 1.5,×3103)不可纠率 ×9.63×10⁶;64 GB 在 48 h 事件里期望只错 1 次要 18.1 s(σ 1e-14)/ 0.181 s(σ 1e-13)的刷新;γ 3.5 为 1.36×10⁴ s |
| 策略 | 刷新周期一个旋钮 | 两个旋钮:后台刷新(等 σ)+ 接 SEP 警报加速刷新 |
| SEL | 未知 | 未知;持有方请登的一句原样登记 |
| 状态 | 不能闭合 | 不能闭合,持有方确认本站没有实测谱;出谱后的登记形状已定义 |

## 3. 回执与给别人的话

- **ops-roster-01:** `dev/REPLY_ops-compute-01_to_ops-roster-01_board.md`。回给它三条:本站三个编制(p030–p032)的醒时被记在地下城,而本站是地表建筑;它账 ② 等的地下城地板,链上目前没有人持有输运计算;部件文件头注释的面数与包围盒过时。
- **sci-rad-01:** `dev/REPLY_ops-compute-01_to_sci-rad-01_registered.md`。登记确认、8.93 撤回、09-06 派发关闭。
- **pwr-grid-01(只登记,不是锚):** 其工作树里未提交的 r2 已把本站孤岛份额 4.8 kW → 0,并撤回「8 机架 × 5 kW ↔ 43.6 kW」那句闭合;本站 r1 的两条回执被采纳。未提交,本站不引。

## 4. 验证

| 检查 | 结果 |
|---|---|
| skill `validate_unit.mjs` | 11,048 面 / 5 万;bbox 42.40 × 8.53 × 20.90 m = size_m 42.4;minY 0;nightMats 10;11 个 poi_ 锚;animate 确定性;**0 WARN**;1 FAIL = 模块内有 import(与 r1、hab-home-01、ops-roster-01、ops-drill-01 先例同) |
| y 包络 | 0–12 s 全循环 worstY 0.000 |
| POI ↔ 卡 | 11 锚 = 11 卡,一一对应 |
| `check_retired.py` | 卡 / 模块 / 公开页 / 册 README 共 21 处退役字面出现,**0 RED**(退役表新增 8.93) |
| `audit_layout.mjs` | layout clean: no overlaps, roads clear |
| 城内烟测 | `?colony=1&inspect=ops-compute-01&debug=1`(mars `c5510dc` 工作树 + 本轮文件):scale 1、57 资产、屏自检 PASS、roster 1.0.0 透传、CDU 泵转动;console 一条 404 = `viewer/units/sci-rad-05.info.json`(sci-rad-05 有模块无卡,不属本单元);本单元 7 个请求全部 200 |
| 公开页 | HTML 标签全闭合;31 个 `<tr>`(含表头);What broke 9 条(新增「像素击中率被读成粒子通量,以及一道不可能变红的闸」);无新增图片 |
| 实拍 | 白天与夜景各一张(气闸门内视角,看板居中、MB-1 大屏在左、版图铭板在前),只作验证,未上公开页:引擎的浮动标签穿墙叠在画面上 |

## 5. 看见了、没有动

- **CHECKLIST 行尾。** HEAD 为 149/149 行 CRLF;本站补丁读取前,工作树已是 0 个 CRLF(补丁实测),说明是本轮之前别的会话改的。本站保持现状,只改自己一行。与 HEAD 逐行对比:本站行 = HEAD 行 + r1.1 后缀;其余内容差异属于 pwr-grid-01、ops-polymer-01、ops-roster-01、ops-drill-01 的行。按路径提交时整份文件会显示为行尾变更,请总控定。
- **`roster-board.js` 文件头注释过时。** 已写进回执,本站不改对方文件。
- **`sci-rad-05.info.json` 缺卡导致 404。** 不属本单元。

## 6. 文件清单与 SHA-256(前 16 位)

| 文件 | 改动 | sha256 |
|---|---|---|
| viewer/units/ops-compute-01.js | 收编看板(+17 行) | 8baf0677413a9c00 |
| viewer/units/ops-compute-01.info.json | radiation 卡重写 + airlock 面数 + 新增 roster 卡(10→11) | 0bc1ee3e93573787 |
| docs/compute.html | 账 4 行、台账三行、What broke 一条、Try it 一条 | f789ffaeb8407dfc |
| CHECKLIST.md | 仅 ops-compute-01 一行追加 r1.1 | 35ddf3afea4a9737 |
| dev/RETIREMENT_CONVENTIONS.md | 仅 ops-compute-01 一行:退役字面清单加 8.93 | 50ea53035d716431 |
| dev/REPLY_ops-compute-01_to_ops-roster-01_board.md | 新增 | 9e8d4b5a55b7d1c9 |
| dev/REPLY_ops-compute-01_to_sci-rad-01_registered.md | 新增 | cb696ab73cb5e3a2 |
| dev/DELIVERY_ops-compute-01_r1_1.md | 本文 | — |
| viewer/main.js | **未动** | ff2c90fa4e298668 |

托管、未改的对方文件:`viewer/units/roster-board.js` ab18eee9c3b88bb0 · `roster-data.js` 49f2d5be4a40392e · `roster.json` 39c58470f248e69e。

Produced by: ops-compute-01 session(mars-bigram)。引数请引提交号(mars-bigram `c3dcdda`;城卡以总控提交为准),不引本文。
