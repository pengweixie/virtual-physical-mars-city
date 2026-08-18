# HANDOFF — res-eclss-01 / res-recycle-01 交接（给总控）

日期：2026-08-09 · 设计册 `E:\Claude\mars-eclss` · 账本正文见 `LEDGER.md`

---

## 1. 已交付（本 session 直接落库到 `E:\Claude\mars`）

| 文件 | 说明 |
|---|---|
| `viewer/units/res-eclss-01.js` | 制氧与气体储配站，**11,790 三角形**（预算 1.2 万），实测 bbox 48.20 × 12.72 × 30.00 |
| `viewer/units/res-eclss-01.info.json` | **6 张双语卡**（screen / stack / perc / tanks / intake / fill），全带 `sim` + `physics` |
| `viewer/units/res-recycle-01.js` | 水与固废回收厂，**6,846 三角形**，实测 bbox 44.00 × 9.10 × 30.60 |
| `viewer/units/res-recycle-01.info.json` | **6 张双语卡**（water / urine / compost / sort / metal / hazmat） |
| `models/manifest.json` | 两条记录已加（含 `name_en`），**`pos: null`**，`sink_m: 0.3` |
| `CHECKLIST.md` | 资源 res 段新增两行，交付格 ✅ |
| `snaps/anim/res-eclss-01.gif` · `res-recycle-01.gif` | §6a 动图，各 960×540 / ≤12 s / ≤3.7 MB（详见 §6b） |

`validate_unit.mjs` 两个模块全绿；`scripts/audit_layout.mjs` 在两组候选位下均 `layout clean`。

---

## 2. 落位：两组候选，都已过布局审计（**请总控二选一**）

`pos: null` 会被 `loadUnits` 直接跳过，所以这两个资产**现在不会出现在城里**——
需要总控填 pos 才落地。两组候选我都用真 bbox 跑过 `audit_layout.mjs`，均 `layout clean`。

### res-eclss-01（48.2 × 30.0 m，rot 0，sink 0.3）

| | 候选 | 理由 | 最近邻净距 |
|---|---|---|---|
| **A（推荐）** | **`[5, 60]`** | 卡在 ISRU(40,25) 与 Rodwell 井(-5,110) 之间的水/气走廊上：氧管去地下城、CO₂ 管去 Sabatier、水管接井线，四条管都是最短路 | res-isru-01 49 m · res-rodwell-01 51 m · pipe-h2o 走廊 41 m |
| B | `[-200, 20]` | 贴储能场一带（pwr-storage-01 现役 250 kW 电解槽是本站的应急备份电解列），电气距离最短 | pwr-fusion-01 63 m（净 8 m）· pwr-storage-01 76 m |

> B 的短板：离硫厂（70,-70）270 m，而硫厂副产氧是本站的**基荷进料**——氧管要拉最长的一条。
> 所以推荐 A。

### res-recycle-01（44.0 × 30.6 m，rot 0，sink 0.3）

| | 候选 | 理由 | 最近邻净距 |
|---|---|---|---|
| **A（推荐）** | **`[-300, 40]`** | 贴地下城入口 hab-tunnel-01(-330,-30) 北侧：污水/中水主管最短，压块直接就近回填覆土丘（L3 §5.3 的"垃圾变屏蔽"在这里是真实运距 80 m） | hab-tunnel-01 76 m · hub→solar 道路 49 m |
| B | `[-210, -100]` | 贴掩土村 hab-village-01(-250,-46) 东南：村子那 30 人的水与废物就近处理，不必全线拉回地下城 | hab-village-01 67 m · hub→pad 道路 38 m |

> 若两站都要放：A+A 与 B+B 都已验过 clean，混搭（A/B 或 B/A）同样安全（两站相距 >300 m）。

**朝向**：两站的剖切面都朝 **+Z**（电解槽厅开口、堆肥转鼓剖面、危废间开口），
`rotation_deg: 0` 时观察侧是南向。若总控希望主路一侧看到剖面，按主路方位调 rot 即可，
所有 POI 锚点随几何走，无需改卡。

---

## 3. 需要总控铺设的管廊（走廊清单）

两站各自把管墩与站内接管做全了（几何已在模块内），**站间那几段要总控在 `main.js` 的
`pipeRack` 里铺**，并同步 `scripts/audit_layout.mjs` 的 `roads` 表与 `ROAD_EXEMPT`。

以候选 A 组（eclss `[5,60]` / recycle `[-300,40]`）为例：

| 管线 id 建议 | 起 | 讫 | 输送 | 备注 |
|---|---|---|---|---|
| `pipe-o2-sulfur` | res-sulfur-01 `(70,-70)` | res-eclss-01 `(5,60)` | **O₂（白）** | 基荷氧：硫厂副产 200 kg/sol。全城氧账的主动脉，**优先级最高** |
| `pipe-o2-city` | res-eclss-01 `(5,60)` | hab-tunnel-01 `(-330,-30)` | O₂（白） | 送地下城生保母管；沿途可分支到 hab-village-01 |
| `pipe-co2-sab` | res-eclss-01 `(5,60)` | res-isru-01 `(40,25)` | CO₂（青） | 进气塔冻出的 CO₂ + 城内呼出 CO₂ → Sabatier。可与现有 `pipe-h2o-isru` 共墩 |
| `pipe-h2o-eclss` | `pipe-h2o` 支点 ~`(30,90)` | res-eclss-01 `(5,60)` | 水（蓝） | SOEC 进料水（备份路线才用，日常流量很小） |
| `pipe-sew` | hab-tunnel-01 `(-330,-30)` | res-recycle-01 `(-300,40)` | 污水（蓝） | 659 kg/sol 进料 |
| `pipe-h2o-rec` | res-recycle-01 `(-300,40)` | hab-tunnel-01 `(-330,-30)` | 中水（清蓝） | 647 kg/sol 回城，与 `pipe-sew` 同墩双管 |
| `pipe-o2-rec` | res-eclss-01 | res-recycle-01 | O₂（白） | 堆肥好氧供氧 12.1 kg/sol —— 可搭 `pipe-o2-city` 顺路分支，不必单独铺 |
| `pipe-co2-rec` | res-recycle-01 | `pipe-co2-sab` 汇入点 | CO₂（青） | 堆肥排气 16.6 kg/sol |
| `pipe-haz-fab` | 地下城 fab 竖井口 | res-recycle-01 | **危废三色分管** | ⚠️ **酸/HF/CMP 三条管全程不合流**（见 L3 §D 红线 1）。若走同一管墩，标注三色分管即可 |
| `pipe-compost` | res-recycle-01 | res-dome-01 `(95,70)` | 堆肥（固体，非管线） | 9.44 t/火星年，走**公路运输**而非管廊——不需要新管，但需要一条可走拖车的路 |

**最小可用集**（若只铺三条）：`pipe-o2-sulfur`、`pipe-sew` + `pipe-h2o-rec`（同墩）、`pipe-haz-fab`。
其余可用现有 `pipe-h2o` / `pipe-h2o-isru` 走廊搭车。

---

## 4. 建议总控代改的存量卡（本 session **未动**他人资产文件）

红线要求不改他人卡，以下是**建议文本**，请总控代改。每条都注明依据。

### 4.1 `res-rodwell-01.info.json` → `tank` 卡

- 现文 specs：`"乘组需求": "380 L/sol（4 人）"`
- **改为**：`"井产能": "380 L/sol"` + 新增 `"生保占用": "30.3 L/sol（8%，全城 115 人，见 res-eclss-01 总账屏卡）"`
- 依据：LEDGER §4.1。380 L/sol 是产能上限不是需求；4 人是 R1 单井口径。
- 建议在 `sim` 末尾追加一句：
  > 「额度分配：生保（含农业与 fab）30.3 L/sol 占 8%，ISRU 推进剂制氢 193 L/sol 占 51%——这口井的主要客户不是人，是火箭。」
- 英文：`"Well capacity": "380 L/sol"` / `"Life-support draw": "30.3 L/sol (8% of capacity, 115 people city-wide)"`

### 4.2 `res-sulfur-01.info.json` → `control` 卡

- 现文 specs：`"副产氧": "8.2 kg/h（200 kg/sol）"`（保留），
  sim 里的「乘组 3.4 kg O₂/sol」是 4 人口径。
- **改为**：「乘组 99.1 kg O₂/sol（115 人）」，并追加：
  > 「本厂副产氧 200 kg/sol 是全城代谢氧的**第一供应商**，覆盖需求（含气闸损失与堆肥好氧）1.57 倍——这条接线在 res-eclss-01 交付时才第一次被写进氧账。」
- 英文：`"Crew O2": "99.1 kg/sol (115 people)"`；
  > "This plant's 200 kg/sol of by-product oxygen is the city's primary metabolic supply, covering demand 1.57x."

### 4.3 `res-sulfur-01.info.json` → `preheat` 卡（**这条是工程建议，不只是口径**）

- 建议在 specs 增：`"高氯酸盐脱除": "350~450 °C 段先脱除并抽走 O₂（3.9 kg O₂/sol）"`
- sim 追加：
  > 「窑内是 H₂ 还原气氛：高氯酸盐若随料进 900 °C 窑，分解出的氧会当场与氢化合成水——等于烧氢。在预热塔 350~450 °C 段先脱除，每 sol 白拿 3.9 kg O₂，同时省下 0.49 kg H₂（约 27 kWh 电解电）。出料接 res-eclss-01 高氯酸盐支线。」
- 依据：LEDGER §3.3。

### 4.4 `hab-quarter-01.info.json` → `eclss` 卡

- 现文 specs：`"农场反哺": "29 m² 冠层 ≈ 1.5 人份 O₂（光期）"`
- **改为**：`"农场反哺": "毛值 ~0.66 人份 O₂（光期）；净贡献 0——碳被吃回/堆肥氧化回去"`
- sim 追加：
  > 「作物在氧账上净贡献为零：可食部分被乘组吃掉后按 RQ 原样呼回，不可食部分进堆肥被好氧氧化。碳没有离开城市，氧就没有净增。全城的氧来自 res-sulfur-01 副产氧（200 kg/sol），见 res-eclss-01 总账屏卡。」
- 英文 specs：`"Farm credit": "gross ~0.66 person-equivalents during light hours; net contribution zero"`
- 依据：LEDGER §3.4 / L3 §B。

### 4.5 `hab-quarter-01.info.json` → `farm` 卡

- 现文两个数字互相矛盾 30 倍：`"产能": "叶菜 ~25 kg/月量级"` 对应 0.0287 kg 鲜/m²/天，
  而 `eclss` 卡的 O₂ 值对应 0.163 kg 鲜/m²/天。
- **建议统一到光量子法**：PPFD 400 µmol/m²/s × 16 h × 冠层量子产率 0.030 mol CO₂/mol 光子
  → 0.0221 kg O₂/m²/天、0.0208 kg 干物质/m²/天。
  29 m² → 鲜菜 ~4.9 kg/sol（≈150 kg/月），毛产氧 0.66 kg/sol。
- 依据：L3 §B。**这条改动会让 farm 卡的产量提高约 6 倍**，请总控确认口径后再改。

### 4.6 `res-dome-hall-01.info.json` → `soil` 卡

- 现文：`"上层": "洗盐 regolith + 堆肥接菌"`——堆肥无来源。
- sim 追加：
  > 「堆肥来源：res-recycle-01 的堆肥反应器，9.44 t/火星年（干粪+不可食生物量+厨余+纤维素调理料，C/N 配到 27，55~65 °C 灭菌 3 天）。按掺 10 wt%、上层 0.3 m 计，可支持每火星年新建 210 m² 苗床——现有 320 m² 约 1.5 个火星年翻一倍。」
- 同卡「洗出液送电解产氧」→ 建议明确为：
  > 「洗出液蒸干后的高氯酸盐残盐送 res-eclss-01 脱除支线，Mg(ClO₄)₂ → MgCl₂ + 4O₂ 放热分解，0.573 kg O₂/kg 盐，边际电耗 0.24 kWh/kg O₂。」

### 4.7 `ops-fab-01.info.json` → `wetbench` 卡

- 现文只有进料，无排放去向。sim 追加：
  > 「排放去向（res-recycle-01 危废中和间）：食人鱼液 30 L/sol 经 MnO₂ 分解 H₂O₂ 后用 Ca(OH)₂ 中和成石膏 8.2 kg/sol——**正是 res-sulfur-01 回转窑的原料**，fab 的废酸最后变回硫和氧；稀 HF 10 L/sol 独立管路独立槽沉淀成 CaF₂ 0.39 kg/sol（**严禁与酸废合流**）；fab 中水自成回路，不进城市中水母管、不进农业回路。」

### 4.8 `ops-fab-01.info.json` → `cmp` 卡

- sim 追加：
  > 「浆料排放：20 L/sol 经 FeCl₃ 混凝沉降成 SiO₂/Al₂O₃ 滤饼 1.5 kg/sol，回 ops-printer-01 作打印骨料（res-recycle-01 危废间）。」

### 4.9 `hab-tunnel-01.info.json` → `gate` 卡 · `hab-foyer-01.info.json` → `hall` 卡

**这条是本册最有价值的一条工程建议，请优先考虑。**

- 现文：车辆气闸 ~500 m³、一次循环 ~15 kWh / ~20 min、**回收 90%**。
- sim 追加：
  > 「气闸损气账（res-eclss-01 充装台卡）：按 90% 回收，全城气闸每 sol 放掉 181.8 kg 舱气，其中 O₂ 50.1 kg——等于乘组代谢的一半，**车辆气闸是全城第二大氧气去向，仅次于人肺**。把回收率提到 97%（多级泵抽到 2.1 kPa）多花泵电 31 kWh/sol，省下的气折电 707 kWh/sol，**收益/成本 23:1**。缓冲气重造要 5.27 kWh/kg（29 kg 火星大气才得 1 kg，比氧还贵）——所以『别把气放掉』永远比『多造气』划算。」
- 若总控采纳，`hab-tunnel-01` / `hab-foyer-01` 的 specs 里 `"车辆循环"` 可改为
  `"~22 kWh / ~24 min（97% 回收）"`。

### 4.10 `hab-village-01.info.json` → `plaza` 卡

- 现文：床位 28~32，但村里的人不在任何气/水/食物账里。
- specs 增：`"生保接入": "水/中水接 res-recycle-01，氧与缓冲气接 res-eclss-01（全城 115 人总账内）"`
- sim 追加：
  > 「这 30 人此前是生保账上的黑户：不在 hab-quarter-01 的代谢账里，也不在 Rodwell 那个按 4 人算的 380 L/sol 里。res-eclss-01 的全城总账（115 人 = 地下城 85 + 本村 30）把他们并了进来——村子的两座端头气闸每 sol 放掉 12.4 kg 舱气，也第一次上了账。」

### 4.11 `ops-depot-01.info.json` → `stack` 卡（**GAP，需要决策**）

- 现文：进港「地球来的精密件与备件」，吞吐 60~80 t/窗口。**粮食一克没算。**
- 实际需求：到岸食物 94.3 kg/sol = **71.6 t/会合窗口**（干基 + 包装，本地自给 8.3% 之后）。
- 建议 sim 追加（并请总控在 A/B/C 里定一条）：
  > 「粮食上货单：全城 115 人本地热量自给率只有 8.3%（种植面 519 m²），进口主粮 71.6 t/窗口——等于现有 60~80 t 包线的全部。出路：A 把吞吐包线重述为 ~128 t/窗口（食物 55%）；B 把种植面扩到 5175 m²；C 两者对半（推荐）。堆肥自举给出断奶时间表：约 16 个火星年后种植面可达全热量自给（见 res-recycle-01 堆肥反应器卡）。」

---

## 5. 建议新开的资产（本册算出需求，但不在本轮范围）

| 建议 ID | 名称 | 依据 | 规模 |
|---|---|---|---|
| `res-grain-01` | 主粮种植舱 | LEDGER §4.4 出路 B/C | 需 +2300~4700 m² 种植面才能把食物自给从 8.3% 拉到 50~100% |
| `ops-smelt-01` | 金属重熔线 | LEDGER §5.3 | 13.4 t/火星年废金属现在只能"待熔"；两个火星年的积存 ≈ 半船地球来货 |

---

## 6. 验证记录（可复查）

| 项 | 结果 |
|---|---|
| `validate_unit.mjs res-eclss-01.js` | 全绿 · **11,790** 三角形 · bbox 48.20/12.72/30.00 · size_m 与实测一致 · spinners ×3 / nightMats ×4 / lights ×3 / 7 个 poi_ 锚点 |
| `validate_unit.mjs res-recycle-01.js` | 全绿 · **6,846** 三角形 · bbox 44.00/9.10/30.60 · spinners ×8 / nightMats ×3 / lights ×3 / 7 个 poi_ 锚点 |
| `audit_layout.mjs`（候选 A 组） | `layout clean: no overlaps, roads clear` |
| `audit_layout.mjs`（候选 B 组） | `layout clean: no overlaps, roads clear` |
| 城内烟测（临时给 pos 跑，跑完已还原 null） | 两资产 `group.scale === [1,1,1]`；控制台唯一 404 是 `res-cryo-01.info.json`（**他人资产，非本 session**） |
| 泵帧 15 s 断言 | `compost_paddles` 3.927 rad（2.5 rpm × 15 s = 0.625 转 ✓）· `settler_rake` 1.885 rad（1.2 rpm ✓）· `sort_drum_0` 34.56 rad（22 rpm ✓） |
| 全循环包络扫描（0~52 s，步长 0.2 s） | 见下方"误报说明" |
| 夜景 | `nightMats` 生效：状态屏、电极堆热边、UV 柱、发光窗全部点亮 |
| 截图 | `out/shots/*.jpg`（eclss 正/等轴/夜 · recycle 正/等轴/堆肥特写/夜） |

**包络扫描的一处误报（记在这里免得下一位重查）**：
扫描报 `res-recycle-01` 最低点 −0.187 m @ t=4.8，定位到 `compost_gear`。
这是**测量方法的误差**不是几何问题：该网格是 `rotation.z = π/2` 的圆盘再叠 spinner 的
`rotation.x`，用"旋转后的 AABB 再取 AABB"会把 r=1.9 的盘按 √2 倍膨胀。
真实最低点 = 2.5 − 1.9 = 0.6 m。两站的**静态** bbox 最低点都是 −0.05 m
（来自场坪顶点噪声与散落砾石），`sink_m: 0.3` 完全覆盖。

---

## 6b. 动件返工与动图（§6a）

**先说一个我自己犯的错，因为它值得进 skill 坑账。**
首轮交付时我用"泵帧后读 `node.rotation` 数值"来验证动画，三个 spinner 全部对上理论转角，
判定通过。但**转角对 ≠ 看得见**：那三个节点全是光面圆柱绕自身轴旋转，屏幕上一个像素都不变。
拍动图时按坑账 19 改数"变化像素"，半圈只差 2 px，才把这件事抓出来。

顺带查出第二个更硬的错：**朝向与自转叠在同一个节点上**。
把 `rotation.z = π/2`（摆朝向）和 spinner 的 `rotation.y`（自转）放在同一 mesh 上，
欧拉 XYZ 复合下 `Rx·Ry·Rz` 会让轮轴在平面里**摆动**而不是自转——光面圆柱看不出来，
一加辐条就露馅。分选滚筒（`rotation.x` 朝向 + 绕 z 自转）更严重，是**翻跟头**。

**修法（两站统一）**：朝向交给一层 pivot Group，自转留给网格自身的 y 轴。
另外补上"转起来看得见"的特征件，并修了两处几何事实错误：

| 站 | 改动 |
|---|---|
| res-eclss-01 | 压缩机飞轮 → pivot + 十字轮辐 + 橙色配重销；高氯酸盐窑 → **整只筒带齿圈转**（girth gear 12 齿 + 3 条纵向焊缝条 + 托轮滚圈同组）。原来只有齿圈转、筒不动，回转窑不是那样工作的。11,538→11,790 面 |
| res-recycle-01 | 分选滚筒/RO 泵/VCD 飞轮 → 全部拆 pivot，滚筒加纵向橙条纹；堆肥齿圈加 14 齿；刮泥机加橙色标记臂；**中和槽搅拌桨叶重新挂到搅拌轴上**（原来轴转桨不动）；**抄板改大并贴近筒壁**（1.1×1.25@r0.85 → 1.5×1.40@r0.95，剖口 1.20π→1.08π）——原尺寸在剖口外几乎看不见，改后同机位运动像素 2549→4786。6,582→6,846 面 |

**交付**

| 文件 | 规格 | 循环验收（变化像素，阈值 >25 灰度） |
|---|---|---|
| `snaps/anim/res-eclss-01.gif` | 960×540 · 10.0 s · 100 帧 · 3.7 MB | 窑整一转=天然循环；相邻帧步长 5660 px、**接缝 5715 px 相差 1%**；峰值运动 6.8k px（1.3%） |
| `snaps/anim/res-recycle-01.gif` | 960×540 · 12.0 s · 120 帧 · 2.2 MB | 抄板螺旋排布**无 6 重对称**，真实周期是整一转 24 s，按 §6a 上限 2× 变速压到 12 s；24 s 残差 65 px（运动量 1.4%）、**接缝 1333 px vs 相邻帧 1116 px**；峰值运动 5.5k px |

两张都是 960 px 宽、8~12 s、≤8 MB、画面内无 HUD 与标签（sprite 全部置不可见）。

**拍法坑（建议进 mars-unit-flow skill，两条都是新的）**

1. **`scripts/capture_gif.mjs` 在当前城市规模下拍不出动画。** headless Edge + SwiftShader 下
   全城 48 资产只有 0.5~2 fps；更要命的是 **headless 里 rAF 不推进，录出来的 GIF 是静止的**
   （我第一版 10 s GIF 半圈只差 2 px）。这与 sci-seis-01 记的"headless 白片坑"同源。
   另外它的 `--eval` 在固定 `--wait` 后只跑一次，而资产要 60 s 以上才加载完 —— `--eval`
   应写成**轮询到资产出现再返回的 Promise**（工具用了 `awaitPromise: true`，可以这么写）。
2. **可行替代：可见页确定性逐帧驱动。** 每帧手动
   `for (const f of __mars.unitAnims) f(0, dt, 0)` → `renderer.render()` → `toDataURL` → POST 上传，
   再 `ffmpeg -framerate <1/dt>` 合成。100 帧只要 5 s，且 dt 完全可控，
   循环长度可以精确对齐机构周期。本轮两张图都是这么拍的。
3. 端口仍要自选（本轮用 8481）：8462/8466/8123 都被并行 session 占着。

## 7. 本 session 未做 / 边界声明

- **未改 `viewer/main.js`**，未改任何他人资产文件（村子/居住区/fab/硫厂/井/温室的卡一字未动）——
  所有回引都写成 §4 的建议文本报总控代改。
- **未推 GitHub**，提交留本地。
- 动图（§6a）**已交**，见下方 §6b。
- `res-cryo-01`（另一 session 并行交付）的 `info.json` 缺失导致城内一条 404——**不是本 session 的**，
  一并报给总控。
- **端口事故报备**：本 session 曾把截图上传服务绑在 8462，与另一 session（res-cryo-01）的
  同端口约定冲突，收到过一张不属于本册的 `city_cryo.jpg`（已留在 `out/shots/`，未删）。
  发现后立即释放 8462、改用 8473。若对方丢过一张截图，原因在此。
