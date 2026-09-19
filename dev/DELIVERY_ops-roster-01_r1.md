# DELIVERY — ops-roster-01 火星城人员与剂量花名册 r1(2026-09-13)

**册子:** `E:\Claude\mars-roster`(本地仓,无远端)· 首提交 `4d3ee84`(4 文件 = 预注册在数据前)· 五本账 `6884535` · 部件与公开页 `21f4b73`。
**预注册:** `dev/REPLY_ops-roster-01_prereg.md`(城仓)= 册内 `dev/PREREG_ops-roster-01.md`(首提交)。
**城仓改动:** 只动自己的文件、CHECKLIST 自己的一行(ops 段,ops-fire-01 之后)、RETIREMENT_CONVENTIONS 自己的一行(hab-home-01 行之后);**不建新楼、不动 manifest**(部件不是资产);`viewer/main.js` **未动**(git status 无 M;sha256 前 16 位 ff2c90fa4e298668 = 本轮开始时的工作树值)。不 commit 城仓,由总控按路径提交。
**注意:** 本轮开始时城仓工作树已有别的会话的未提交改动(`dev/RETIREMENT_CONVENTIONS.md` 末尾 sci-rad-05 / ops-polymer-01 两行、`dev/REPLY_glass_runE_vestibule.md`、若干 `REPLY_*_prereg.md`);本册的行插在 hab-home-01 行之后,未碰它们的文本。

## 1. 五本账 · 记分卡(预期不改,偏出照记;`python ledger/run_all.py` 退出码 0 = 23 闸全绿 + roster.json 两次 sha256 相同)

| 账 | 脚本 → 产物(sha256 前 16 位) | 闸 | 记分 | 一句话 |
|---|---|---|---|---|
| ① 普查 | `ledger/01_census.py` → `out/01_census.json` d8ca17ffc6089b55 | 6/6 | 4 命中 / **1 偏出** / 1 声明 | 居住床位按卡 **35**(村 30 + 地下城 5 单人舱)+ 2 临时 + 5 非居住(样板 1、星舰铺位 4);E1.1 预期 40–70 **偏出**。全城人数只有 res-eclss-01 一张卡给(115 = 85 + 30,编制法推导,非自报);10 张卡明说自己的人(8 张说无人);**42 个资产常驻人数是缺口**。ECLSS 记 85 人住地下城,地下城唯一居住卡写 5 间单人舱 → **80 人按卡无床**。工位≠人(轿厢 12、乘员 3–7 推定、兼职消防 16、影院 15 座、餐桌 12 座)全部不入合计。res-isru-01「480 sol 无人期」vs ECLSS「6 人连续」两卡不一致,**登记不裁**。口径:派发词 82 / manifest 79 / 单位模块 78 / 卡 80,差集打印,不凑 |
| ② 剂量地图 | `02_dose_map.py` → `out/02_dose_map.json` 9e4a10e5fe82c489 | 4/4 | 3 命中 / 2 不能闭合 | **27 个位置只有 6 个有数**:村 Run B 四类下界(27.0 / 31.9 / 52.8 / 93.7,mars b2077f4)+ RAD 地表 234 + EVA 0.66;地下城 11 位置与深地只有屏蔽倍数(>5000 g/cm²、52 强子 e 折、µ ×0.03 / ×1e-6),**绝对地板不能闭合:缺岩石 K/U/Th γ 本底与 µ 地板实测**(sci-rad-01 的 0.3 mSv/yr 被村 berm 卡明标自设量级值,本册不用);地表建筑内全部无依据;村公共舱与 corner 舱无 Run B 数;起居新位待 Run E。G2.2:234/365.25×1.0275 = 0.658,与 0.66 差 0.26% |
| ③ 配额 | `03_quota.py` → `out/03_quota.json` 282fff5e066b08eb | 4/4 | 4 命中 | 三条线并印不合并:城 20/地球年、村 50/火星年、职业(NASA-STD-3001 Vol.1 Rev.C 600 mSv 终身;ICRP 103 20/yr 五年均、任一年 ≤50)。**独立重写复现村表**:263/228/201、0.1250/0.1354/0.1457 → 160/148/137、50 线 658/569/502、400/369/343(±1 sol)。每 sol 配额:城线 0.0563 vs 村线 0.0748 mSv/sol → **村线松 1.33×**(村卡「比 20 更严」只在零 EVA 折算舱内值时成立)。终身 600 @v1 X=0.5:**4,431 sol = 6.63 火星年 = 12.5 地球年**;地表常住 2.56 年;ICRP 五年均在村子任何作息下越线(27 > 20);对 <30 年停留年线永远先到 |
| ④ 排班 | `04_roster.py` → `out/04_roster.json` d02259714caaef76 · **`roster.json` 1.0.0** 39c58470f248e69e · `roster-data.js` 49f2d5be4a40392e | 6/6(G4.1 第一版红:闸实现把 round(5) 后的分量求和,改闸实现不改闸带;G4.2 第一版不可能红,补非零对照) | 3 命中 / 1 不能闭合 | 115 人展开(ECLSS 22 行派班,住地 85/30;村民按 berths.json v5d 分床 std 24 / end 4 / corner 2);**76% 的剂量列是 null——不是 0**(85 地下城 + 2 corner);EVA 是卡上唯一的逐人数:ECLSS duty_split 村民 **2.6 h/sol**、地下城 0.3;村子 v1 只印到 1.0 → 并印第四列:**X=2.6 下 std 床民到 20 mSv 只剩 112 sol**(v1 X=0.5 是 148);排班能改的只有 X(0.5→0 多 8.3%);守恒两路径 5.0369 = 5.0369;schema 校验;确定性 |
| ⑤ 压力 | `05_stress.py` → `out/05_stress.json` 645efbc1a622621c | 4/4 | 2 命中 / **1 偏出** | 全住满不改任何人的地板(逐人相等闸);卡给了全城 EVA **104 人·h/sol**(村份额 78.2):N 24→32 时每人 3.27→2.45 h,std 床民到 20:104→114 sol。SEP 只引 RAD 2017-09-10/11 实测 **418 µGy(Si)**(Zeitlin 2018 GRL):Si→水 1.3 声明、Q 1.0–1.5 扫描不选值 → **0.54–0.82 mSv = 0.82–1.23 sol 地表 GCR = 20 mSv 的 2.7–4.1%**、600 的 0.14%;E5.1 上界 4% 被 4.1% 擦过,**按字面判偏出不改带**。不对称:能排除「RAD 级 SEP 立刻触发轮换」,不能给「SEP 安全」——更大事件(1972/1989/2003 级)RAD 未在火星测过,本册不造;村内/地下折减无 run,只写 ≤ 地表值 |

**交叉矩阵已核:** 人数与分床(① → ④ → ⑤ 读同一 JSON);地板只在 `ledger/constants.py` 一处(② ③ ④ ⑤);时间常数一处(G3.3 断言 668.6×1.0275/365.25 = 1.881);occupancy v1 结构冻结(G4.6);EVA 0.66 ↔ 234(G2.2);全城 EVA 人·时 roster 104.2 vs 卡 104——**同源(都是 L0 的 duty_split),不是互证**,已写明。

**推翻了自己什么(What broke,页上同):** E1.1 床位 40–70 → 35;E2.2 地下城 <5 → 不能闭合(没写 0.3);两卡不一致不裁(ISRU);G4.1 第一版红是闸的实现;G4.2 第一版不可能红;村 v1 表止于 1.0 h EVA 而 ECLSS 给村民 2.6 h(跨册乘法);E5.1 4.1% 对 4% 判偏出不圆。

## 2. 派发与待回

- `dev/DISPATCH_ops-roster-01_board_offer.md` → hab-quarter-01(公共区)/ ops-compute-01(大屏):部件供稿,放不放由它们定;顺带各一句(85 对 5;screen 卡不碰);要的东西:地下城舱内绝对年剂量的账(哪怕量级带出处);抄送 res-eclss-01:村民 EVA 2.6 vs 村 v1 ≤1.0 谁改口径归你们。
- 不派发但登记:sci-rad-01 的 0.3 mSv/yr µ 地板若有实测或输运码背书,账 ② 的 12 个 card_shielding 位置可从「不能闭合」变「有下界」。

## 3. 资产:看板部件(不建新楼;mars-unit-flow 全流程)

| 项 | 结果 |
|---|---|
| 部件 | `viewer/units/roster-board.js`:`RosterBoard(THREE, roster, opts?) → Group`,不 import three、无贴图、无 DOM、无 CanvasTexture;纯几何条形图:上带 8 位置地板条(长度 ∝ 地板/234;琥珀 = Run B,红 = RAD,**空框 = 无依据**;绿刻线 20/yr、琥珀刻线 50/火星年折 26.6)、中带 115 人牌 23×5(填色只给 28 个有数的人,**null 画空框**)、下带 4 情景条(到 20 的 sol,X = 0/0.5/1.0/2.6;红刻线 = 一地球年 355.5 sol,没有一条到)、右下版本灯;`userData.nightMats`(6)、`userData.roster`(版本)、`LEGEND` 导出 |
| 数据 | `viewer/units/roster.json`(schema `ops-roster-01/roster`,1.0.0,occupancy v1,`jsonschema` 校验 `ledger/roster.schema.json`)+ `viewer/units/roster-data.js`(由 04 生成,不手改) |
| skill validate_unit.mjs(经册内薄包装 `dev/roster-board-preview-unit.js`,不交付) | 三角形 **5,136** / 5 万;bbox 2.52 × 2.45 × 0.60;minY −0.00;size_m 2.52 实测一致;nightMats ×6;**0 WARN**;1 FAIL = 包装的 import(部件 + 数据模块,与 hab-home-01 / ops-compute-01 先例同) |
| 城仓 validate_units.mjs | 不覆盖(部件不在 manifest);其余单位状态与本轮开始一致 |
| y 包络 | 静态 minY 0.00;无 animate / spinners,无循环包络项 |
| 城内烟测 | `viewer/index.html?colony=1&debug=1&inspect=ops-compute-01`(mars `c5510dc` 工作树 + 本轮文件,127.0.0.1:8131):console 动态 import 两模块、`RosterBoard(THREE, ROSTER)` 加到 colonyGroup 于计算中心前 14 m (−82, 44.75, 134):**scale 1、54 资产、console 零报错**、5,136 面、bbox 同上、minY(世界)0.000、nightMats 6、`userData.roster.n_with_number` 28;白天/夜景/远景三张 toDataURL 落盘(隐藏面板:setSize(1280,720,false) 强制尺寸;夜景把 timeSlider 拨到 20.6 后 updateSun) |
| POI ↔ 卡 | 无:部件不是资产,不写卡(CHECKLIST 知识卡列 ⬜ 并注明);宿主收编后由宿主决定是否加 poi_ |
| 定妆照 | `docs/assets/people/r1-board-{day,night,wide}.jpg`(90 / 70 / 67 KB) |
| 公开页 | `docs/people.html`:英文;shared tokens 与模板逐字一致(accent = amber);台账 30 行每行 Produced by + 状态列(measured / census / ruled / cited / account / derived / declared gap / not closable / known-answer gate / literature / declared conversion);What broke 6 条;05 节印 roster.json 数据接口;无外链(GitHub 导航除外)、无本地绝对路径;375 px 实测 scrollWidth = clientWidth = 375 无横向溢出;图三张全 200 且 ≤ 400 KB;内链 index/home/perception 全 200。Prev/Next 暂写 home ↔ perception,按 index.html 环序改 |
| 动图 | 不适用(部件无动作) |

## 4. 数据接口(引擎侧「人在哪」图层由总控接;本册只定义数据)

`viewer/units/roster.json`(或 `import { ROSTER } from './units/roster-data.js'`):

```
schema "ops-roster-01/roster" · version "1.0.0" · occupancy "v1" · generated · generated_from{prereg, cards{id: commit}, run_b, berths, eclss_billets, ledgers[]}
constants{sol_h 24.65, sol_d 1.0275, earth_year_d 365.25, mars_year_sol 668.6, eva_msv_per_sol 0.66, sleep_h 8.0, formula}
quotas{city20_msv_per_earth_yr, village50_msv_per_mars_yr, nasa_std_3001_rev_c_career_msv, icrp103_annual_avg_msv, icrp103_annual_max_msv}
locations[]{id, unit, status: ruled|measured|card_shielding|pending|none, floor_msv_per_earth_yr|null, beds|null, note}
people[]{id p001..p115, home: undercity|village, billet, sleep_location, awake_location, eva_h_per_sol,
         dose_msv_per_sol|null, components{habitat_sleep|null, habitat_awake|null, eva}, remaining{city20_sol, village50_sol, nasa600_sol}|nulls,
         rotation_sol|null, gap: "不能闭合:缺 …"|null}
scenarios[]{id, eva_h_per_sol, n_people, n_with_number, dose_msv_per_sol_std, city20_sol_std, dose_msv_per_sol_end, city20_sol_end, source}
totals{n_people, n_with_number, null_share, n_village, n_undercity, eva_person_h_per_sol, eva_person_h_eclss_card, sum_dose_*, beds_residential_cards, people_without_card_bed}
gates{name: bool} · lineage{supersedes|null, note}
```

引擎若要画「人在哪」:`sleep_location` / `awake_location` 是位置 id,映射到资产 id 在 `locations[].unit`(村 = hab-village-01,床位锚点用 mars-village `berths.json` 的 `berth_*` 名,顺序与 people 展开顺序一致:std 24 → end 4 → corner 2);地下城 85 人里只有 5 人有卡床(`undercity_cabin`),其余 `undercity_no_card_bed`——**引擎侧不要替它们发明床位**。`null` 永远表示不能闭合。版本变更:任何输入变更递增 `version`,旧版另存 `roster_v<old>.json`,`lineage.supersedes` 指向。

## 5. 城仓文件清单与 SHA-256(前 16 位)

| 文件 | 改动 | sha256 |
|---|---|---|
| viewer/units/roster-board.js | 新增(部件) | ab18eee9c3b88bb0 |
| viewer/units/roster-data.js | 新增(生成) | 49f2d5be4a40392e |
| viewer/units/roster.json | 新增(1.0.0) | 39c58470f248e69e |
| docs/people.html | 新增 | 4d693a745d1ee9df |
| docs/assets/people/r1-board-day.jpg | 新增 | 346725180fbce6c8 |
| docs/assets/people/r1-board-night.jpg | 新增 | 57a5ae2a78676dec |
| docs/assets/people/r1-board-wide.jpg | 新增 | 21a2bef2a0e475a8 |
| CHECKLIST.md | 仅 ops 段 ops-fire-01 行之后新增自己的行;CRLF 保持 | 0c571e2a9142a4e0 |
| dev/RETIREMENT_CONVENTIONS.md | hab-home-01 行之后新增 ops-roster-01 一行(文件另有别的会话未提交的两行,未动) | 8bcb0bd975316f58 |
| dev/REPLY_ops-roster-01_prereg.md | 新增(= 册内 PREREG,首提交) | cb560c79c58599dd |
| dev/DISPATCH_ops-roster-01_board_offer.md | 新增 → hab-quarter-01 / ops-compute-01(抄送 res-eclss-01) | f0cc751f0a15f701 |
| dev/DELIVERY_ops-roster-01_r1.md | 本文 | — |
| models/manifest.json | **未动**(不建新楼) | acc388423f04b88f |
| viewer/main.js | **未动** | ff2c90fa4e298668 |

册内产物(mars-roster `6884535` / `21f4b73`):`ledger/out/01_census.json` d8ca17ffc6089b55 · `02_dose_map.json` 9e4a10e5fe82c489 · `03_quota.json` 282fff5e066b08eb · `04_roster.json` d02259714caaef76 · `05_stress.json` 645efbc1a622621c · `roster.json` 39c58470f248e69e · `viewer/roster-data.js` 49f2d5be4a40392e · `viewer/roster-board.js` ab18eee9c3b88bb0(与城仓副本字节同)。

## 6. index.html 卡与 README 行(总控加;本册不改 index.html)

- 一句描述:**The People — a city of 82 assets and no people layer: 115 people on one card, 35 beds on the rest, a dose map that is 78% blank, and a roster that says null where the cards say nothing.**
- 两项数据:**80 people without a card bed** · **112 sols to the 20 mSv line at the life-support EVA share**。
- slug `people`,accent amber;Prev/Next 我写成 home ↔ perception,按环序改。

## 7. 给别的单位(只报不改;引提交号)

- **hab-quarter-01**(`73e4ee7`):cabin 卡 5 单人舱 vs ECLSS 85 人住地下城——并印不裁;舱内绝对年剂量若有账请给出处(见 DISPATCH)。
- **res-eclss-01**(`91f0c37`):L0 duty_split 村民 EVA 2.6 h/sol 对村 v1 ≤1.0;两边并印;另 L0 与 res-isru-01 卡「480 sol 无人期」不一致,登记。
- **hab-village-01**(`9a75308`):表复现无误(±1 sol);corner 舱 A7 两床与公共舱 B5 无 Run B 数,roster 里为 null;每 sol 配额口径下城线比村线严 1.33×,与 plaza 卡「比 20 更严」那句的适用条件(零 EVA 折算舱内值)并印。
- **sci-rad-01**(`e2270ed`):0.3 mSv/yr µ 地板被村 berm 卡标为自设,本册不引;若有实测/输运背书,账 ② 12 个位置可升为下界。
- **hab-clinic-01**(无卡,模块 `d3be253`):缺卡、缺床位数、缺常驻人数;几何里的病床不入账。

Produced by: ops-roster-01 session(mars-roster)。引数引 mars-roster `4d3ee84` / `6884535` / `21f4b73`,城卡以总控提交为准,不引本文。
