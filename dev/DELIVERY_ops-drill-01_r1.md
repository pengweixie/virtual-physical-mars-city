# DELIVERY — ops-drill-01 太阳质子事件演习 r1(2026-09-13)

**册子:** `E:\Claude\mars-drill`(本地仓,无远端;autocrlf false,`* -text`)· 预注册首提交 **`2d2ab3c`**(数据前)· 五本账 `3e464f3` · 交付件 `930bf13` · 收尾 `8e5a65d`(本文在其后一提交)。
**预注册:** 城仓 `dev/REPLY_ops-drill-01_prereg.md` = 册内 `dev/PREREG_ops-drill-01.md`(首提交)。
**城仓改动:** 只动自己的文件、manifest 自己的一条(`ops-drill-01`,diff 18 行全是该条)、CHECKLIST 自己的一行(ops 段,ops-roster-01 行之后)、RETIREMENT_CONVENTIONS 自己的一行(表末);`viewer/main.js` **未动**(sha256 前 16 位 `ff2c90fa4e298668`,与本轮开始时一致)。不 commit 城仓,由总控按路径提交。城仓工作树里另有 ops-roster-01 / ops-polymer-01 / sci-rad-05 的未提交文件,本册未碰。

## 1. 五本账记分卡(`python ledger/run_all.py` 退出码 0 = 31 闸全绿;预期不改,偏出照印)

| 账 | 脚本 → 产物 | 闸 | 记分 | 一句话 |
|---|---|---|---|---|
| ① 事件 | `ledger/01_event.py` → `out/01_event.json` + `01_event.png` | 7/7 | 3 命中 / **2 偏出** | 输入 = RAD 2017-09-10/11(起始 19:50 UT、次日上午到峰、~10 h 平台、418 µGy Si、峰 2–3×;Zeitlin / Ehresmann / Hassler 2018)。形状声明、两积分为闸:τ_d 31.8 / 7.9 h(峰 2× / 3×);事件 = 1.94 平静 sol;地表站计数峰倍数 2–4× ⇒ **红警(30×)排除、黄警不能确立**,演习红为注入。偏出:E1.2 有效时长 47.8 h(预期 20–40;预注册那行用了 0.25 mGy/day 而 E1.1 用 0.21——自己的算术)、E1.3 峰值 26.2 µGy/h(预期 ≤26)。**预注册声明的 2 h 爬升在读到 Ehresmann 摘要后被文献形状取代,2 h 留作消融**,首小时避难剂量对形状敏感 6×,账 ④ 两案并印 |
| ② 预警 | `02_warning.py` → `out/02_warning.json` | 6/6 | 4 命中 / 1 偏出(措辞) | 独立复现 sci-rad-01 账 5:17.0 / 32.2 / 39.6 / 117.1 min、窗口 77.5(<1%);地面自身提前量 0(恒等);EPS 100 MeV 前锋相对地表 −22.7 / −11.8 / −7.4 min(首批 / 245 MeV 主体 / 166 MeV 全带);围界柱 5σ 188 / 8.5 s **只有本底扣除差值方差形式才复现**(登记);黄警在 4× 事件下距首批到达 12.5–13.8 min。不对称:排除任何 ≥1 min 的地面级正提前量;日冕仪 1–3 d 的命中率不评 |
| ③ 疏散 | `03_evacuation.py` → `out/03_evacuation.json` | 7/7 | 6 命中 / **1 偏出**(排序) | 确定性 DES:**T_clear 40.9 min**(N=21 = 值班 16 + EVA 3 + 广场 2,待花名册;p=2、穿服 15 声明);最后进门 = 发射场:穿服 15 + 步行 22.6 + 等待 0 + 气闸 3 + 电梯 0.3。**瓶颈实算:步行 22.6 > 穿服 15 > 气闸最长等待 2.5 min——预注册押的是气闸队列第一,偏出**(13 岗错峰到达)。对表:F=10⁴ 的 26.7 min 从 N=7 起清不完(预注册 N≥8,命中);穿服 0 → 25.9(擦线);远岗位坐车(声明 5 m/s)穿服 15/5/0 → 31.7/22.3/17.3;车辆气闸 0/4/8 座 → 40.9/39.4/39.4(永远不是杠杆);电梯 698 人/h 是门斗的 17×;**电梯满载 0 趟**;花名册区间 30.7(全在变电站)–49.9(全在发射场);ops-roster-01 r1 派班按比例摊 16 人 → **41.2 min,同头条** |
| ④ 避难剂量 | `04_shelter_dose.py` → `out/04_shelter_dose.json` | 5/5 | 3 命中 / **1 偏出** / 1 不能闭合 | 最后进门者(41 min 在地表)多吃 **0.2 / 0.3 µGy**(峰 2×/3×,文献形状;2 h 形状 1.0 / 2.0)= 事件千分之一;90% 剂量在 82 / 32 h 后才送达 → **难的是待在下面 1.3–3.3 sol**;F=10³ / 10⁴ 下同一 41 min = 3.1 / **30.6 mSv**(超职业年限);村床位 SEP 上界 ≤48 µGy(仅上界,真值不能闭合);地下城 ≤4 µGy、深地 0;已知答案闸 0.66/(0.21×1.0275)=3.06≈<Q>3.05。偏出:E4.1 预期 5–20 µGy,算得 0.2–0.3(文献形状把峰推到 12 h 后),结论「撤得快慢不改剂量」两种形状下都成立 |
| ⑤ 编排 | `05_drill.py` → `drill.json` + `drill.schema.json` + `out/05_drill.json` | 6/6 | 2 命中 / **2 偏出** | schema 校验、每分钟守恒、路径连续、T_clear 与 ③ 同数、两次生成 sha256 相同、sci-rad-03/04 行全程恒等。偏出:有关键帧的单位 27(预期 14–18;13 个地表值班资产各占一行)、电梯满载 0 趟(预注册已写明可能)。通风切换登记为「门斗关闭后的域封闭动作」,非辐射学动作 |

**交叉矩阵已核:** D(t) 只在 `eventlib.py` 一处(① ④ 共用,04 从 01 的 JSON 读参数再调同一函数);t=0 定义(注入红 = 事件起始)② → ④ ⑤;N 与每人就位时刻 ③ → ④ ⑤ 读同一 `people[]`;3 min / 12 人 / 115 人 / F 表只在 `constants.py`;sol = 1.0275 d 与 roster 同一闸(1.881 ± 0.001)。

**不能闭合(每条点名谁能量,已派发 `DISPATCH_ops-drill-01_missing_measurements.md`):** 地下城床位数(ops-roster-01 账 ① 已答:按卡 35)· 地表值班室墙体面密度(13 家持有者)· 加压乘员车座位数(veh-ground-01)· 覆土对 SEP 谱的削减(res-glass-01 一个 Geant4 run)· 2017 事件逐时剂量率表(RAD PDS)· 日冕仪预报命中率(com-l4-01)· 瞬时地表人数(ops-roster-01 的 roster.json 没有地表值班位置,只有派班)。

**推翻了自己什么(What broke,页上同,10 条):** 瓶颈押错;事件形状在数据前声明、被摘要取代;E1.2 一行两个本底;RAD 实测事件不响本城的铃;「电梯满载」做不到;通风切换无辐射学理由;哨兵 188 s 只有一种公式复现;hab-foyer-01 卡自相矛盾(已 REPLY);27 单位 vs 14–18;花名册到了却没有地表。

## 2. 资产 ops-drill-01(mars-unit-flow 全流程)

| 项 | 结果 |
|---|---|
| 几何 | 演习控制台:打印土坪 3.0×2.0 m + 4 m 钢桅杆(三色灯柱 + 警笛喇叭 + 接线箱/导管)+ 2.4×1.5 m 看板(六根计数条 = 每分钟位置计数、三格等级 LED、进度条、压缩比铭牌)+ 规程铭牌 + 橙色护栏;bbox **3.25 × 4.37 × 2.10 m**,size_m 4.37(height),尘膜 pass |
| 钩子(参考实现) | `userData.alarm = {levels, level, set(level, frame, ctx)}`:set 只改自己的三色灯与看板(告警灯**不进** blinkMats / nightMats),幂等可回退;`actions['演习开始'/'复位']`;`animate` 在引擎无播放器时用 `ops-drill-01.data.js`(由 `ledger/gen_data_module.py` 从 drill.json 生成,7.2 KB)以 60× 压缩自演,`ctx.drill` 存在则不自演(同文件优雅降级);`userData.drill` 暴露时间线 |
| validate_unit.mjs | 三角形 **1006** / 5 万;bbox 4.37 = size_m;minY −0.00;nightMats ×2、lights ×1、poi_ ×5;animate 确定性;**0 WARN**;1 FAIL = 「模块内有 import」(`./ops-drill-01.data.js` 相对导入,与 hab-home-01 / ops-compute-01 / ops-roster-01 先例同) |
| y 包络 | `tools/measure.mjs`(用城仓的 three):静态 minY 0;演习全程 60 s 扫描 worstY 0、maxTop 4.37;60 s 后 t_min=51、等级自动回 green;复位后 green |
| 落位 | manifest `(327, −268)` rot 0 sink 0.15,环境预警组团(sci-rad-01 东 17 m);`scripts/audit_layout.mjs`:**layout clean: no overlaps, roads clear** |
| 城内烟测 | `viewer/index.html?colony=1&inspect=ops-drill-01&debug=1`(mars `c5510dc` 工作树 + 本轮文件,127.0.0.1:8127):group.scale **[1,1,1]**、**55 资产**、落点 (327, 45.95, −268)、**console 零报错**、场景内实例 1;泵帧 1500 帧(25 s):t_min 25、red、条 transit 0.476 / lock 0.095 / sheltered 0.429、红灯 emissive 2.2;再 2000 帧:t_min 51、green、running=false;复位 green |
| POI ↔ 卡 | 5 锚(mast / board / siren / plaque / hook)↔ `ops-drill-01.info.json` 5 张,零孤儿;每张 label/detail/specs/sim/physics 五字段双语,sim 引 mars-drill ledger 脚本与城卡提交号 |
| 定妆照 | `docs/assets/drill/console-hero-red-20min.jpg`(页面 hero)、`console-hero-green.jpg`、`console-{green,red-20min,red-40min}.jpg`(inspect 取景,58 KB 级);1280×720,`renderer.setSize(1280,720,false)` + toDataURL + 上传服务 |
| 公开页 | `docs/drill.html`:英文;shared tokens 与模板逐字一致(accent = red);台账 **29 行**每行 Produced by + 状态列(literature / cited card / account / cross-implementation / declared / bound only / prereg miss / declared gap);What broke **10 条**;三张账图 + hero;无外链(GitHub 导航除外)、无本地绝对路径;实测 375 px 无横向滚动、深浅双主题翻转、3 图与 3 内链全 200 |
| 动图 | **未交付**:`scripts/capture_gif.mjs` 跑完 360 帧却产出 5 KB 无效文件(隐藏面板 rAF 挂起,与本轮前几册同一失败模式),不交陈旧件 |

## 3. 需要总控接的引擎侧(本册未动 main.js;接口全文在 `dev/HOOK_SPEC_alarm.md` §4)

1. `city.alarm = {level, source, t0}` + `setAlarm(level, source)`:遍历 units 与室内单元,对有 `userData.alarm` 的调 `alarm.set(level, null, ctx)`;来源只允许 sci-rad-01 的单一判据源或 `'exercise'`。
2. 演习播放器 `__mars.drill = {load(url), start(ratio=60), stop(), t_min}`:读 `viewer/units/drill.json`,每帧 `t_min += dt·ratio/60`,越过关键帧即 `alarm.set(kf.level, kf, ctx)`;`stop()` 回 green;URL `?drill=1&colony=1` 自动开始;`ctx.drill` 传给 animate 让控制台停止自演。
3. 人流动画:按 `paths[].legs` 在 transit 段沿 from→to 插值放 1.7 m 人形小件(≤200 三角形,实例化 21 个),queue/lock 段停在入口,sheltered 隐藏;`flow[]` 每分钟一行给 HUD 计数条。
4. 层模块(imperial-city):播放器按 `units[].id === 'imperial-city'` 找 `imperialGroup.userData.alarm`。
5. index.html 卡(slug `drill`,accent red;Prev/Next 我写成 radiation ↔ undercity,按环序改);一句描述:**The Drill — a RAD-measured storm run through the city's alarm bus: 40.9 min to clear the surface, and the run is not the hard part.** 两项数据:**Ground lead over its own dose: 0 min** · **1972-class event: nobody from the far posts reaches the tunnel in 26.7 min**。

## 4. 派发与回执(城仓 dev/)

- `DISPATCH_ops-drill-01_hooks.md` → 13 类单位:实现钩子;两处待确认(共牌几何归谁画;UAV 是否停飞);13 个地表值班资产各补一行墙体面密度。
- `DISPATCH_ops-drill-01_missing_measurements.md` → res-glass-01(SEP 谱 run)/ ops-roster-01(地表按班次)/ veh-ground-01(座位)/ 地表持有者(墙体)/ hab-foyer-01(卡行)/ sci-rad-01(信息)。
- `REPLY_ops-drill-01_to_hab-foyer-01_card.md`:hall 卡「人员循环 ~22 kWh / ~24 min」疑复制车辆行;本册按 0.2 kWh / 3 min;若真是 24 min,T_clear 将 >60 min 且排队反成瓶颈——承重,请给值。
- `REPLY_ops-drill-01_prereg.md`:预注册副本。

## 5. 城仓文件清单与 SHA-256(前 16 位)

| 文件 | 改动 | sha256 |
|---|---|---|
| `viewer/units/ops-drill-01.js` | 新 | 32f2b07aa8d58a6c |
| `viewer/units/ops-drill-01.data.js` | 新(生成) | 280e12485b80cd26 |
| `viewer/units/ops-drill-01.info.json` | 新 | 8bb972fc7e7c7141 |
| `viewer/units/drill.json` | 新(引擎数据) | 17f07f0139e73195 |
| `viewer/units/drill.schema.json` | 新 | 0d313fe3b359c7ad |
| `docs/drill.html` | 新 | 46304892e0deec7e |
| `docs/assets/drill/event_curve.png` · `flow.png` · `scan_N.png` | 新 | 57303a1c194b18f5 · 620db71b77c5e9b9 · aff9f834057d4753 |
| `docs/assets/drill/console-hero-red-20min.jpg` · `console-hero-green.jpg` | 新 | 0e97ec33ef7653e9 · 431b268565db1be8 |
| `docs/assets/drill/console-green.jpg` · `console-red-20min.jpg` · `console-red-40min.jpg` | 新 | 1fe413706a954f69 · 46aefd7bea7f7b73 · 5242304b2b0cf5dc |
| `dev/REPLY_ops-drill-01_prereg.md` | 新 | 6fbb6e8485b638ca |
| `dev/HOOK_SPEC_alarm.md` | 新 | dafbe8ee96b96867 |
| `dev/DISPATCH_ops-drill-01_hooks.md` | 新 | 5b75626593a81ab3 |
| `dev/DISPATCH_ops-drill-01_missing_measurements.md` | 新 | ba0162c7460e4809 |
| `dev/REPLY_ops-drill-01_to_hab-foyer-01_card.md` | 新 | 41b9d6fa21472e9c |
| `dev/DELIVERY_ops-drill-01_r1.md` | 新(本文) | — |
| `models/manifest.json` | +1 条(ops-drill-01) | 00ed76211d6177c1 |
| `CHECKLIST.md` | +1 行(ops 段) | f930de97d32bc31f |
| `dev/RETIREMENT_CONVENTIONS.md` | +1 行(表末) | 2280169c852651b7 |
| `viewer/main.js` | **未动** | ff2c90fa4e298668 |

Produced by: ops-drill-01 session(mars-drill `8e5a65d`;本文提交 `6b6177c`)。消息只用来通知文件存在;数字以本文与 `ledger/out/*.json` 为准。
