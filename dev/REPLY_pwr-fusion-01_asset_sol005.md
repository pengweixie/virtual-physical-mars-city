# REPLY · pwr-fusion-01(tokamak)—— 资产外径改正 Ø17.15 → Ø16.99(用户 2026-09-18 裁定「请修改」)

收件:总控。来由:`REPLY_pwr-fusion-01_T_rederivation.md` §四的待裁项(资产按 Ø17.15 建,声明几何为 Ø16.99,差 0.9%)。用户裁定修改;本方只动自己的两个文件与 CHECKLIST 自己那行,**未提交城仓**(总控同步),未动 main.js、manifest、层栈厚度。

## 改了什么

外板首壁间隙 0.13 m 是一维中子学模型自己的间隙(源圆柱 1.200 → 层栈 1.330),不是设计值;设计的刮削层是 **0.05 m**(`tokamak_0d.py`)。资产里一个常量:`R_FW = R0 + a + 0.13` → `R0 + a + SOL_OUT(0.05)`。层栈厚度一字未动,所有半径随之内移 0.08 m。卡片与标签里的数由脚本从 R0、a、SOL 与层厚算出后替换,无手打。

| 量 | 旧(已作废) | 新 | 出处 |
|---|---|---|---|
| 外板首壁 | 5.368 m | **5.288 m** | R0 3.8225 + a 1.4157 + 0.05 |
| 恒温器外面 | Ø16.55 m | **Ø16.39 m** | + 层栈 2.905 |
| 生物屏蔽外面 | Ø17.15 m | **Ø16.99 m** | + 硼化混凝土 0.30(建造厚度声明,09-13 机器几何重推后不变) |
| 总高 | 11.51 m | 11.51 m(不变) | 2 × (κa + 3.205) |

新半径与 chain3(机器几何重推)二进制打印的层表逐面一致:首壁外 5.293、LiPb 外 6.313、恒温器外 8.193、混凝土外 8.493。

| 文件 | sha256(前 16) |
|---|---|
| `viewer/units/pwr-fusion-01.js` | `6b46a519edf8a365` |
| `viewer/units/pwr-fusion-01.info.json` | `87b3c785364cb22f` |

卡片:本体卡的标签、detail(中/英)、specs「机器包络」(中/英)改为新值;旧值 17.15 / 16.55 并入【已撤】句并写明原因。其余 7 张卡未动。

## 验证(全部实跑)

| 项 | 结果 |
|---|---|
| `validate_unit.mjs` | 全部通过,0 WARN:无 import、无外部资源、返回 Group、nightMats ×2、lights ×2 |
| 三角形 | **14,680**(预算 5 万;与改前相同) |
| 整资产包络 | x 62.00 × y 13.41 × z 46.00 m,minY 0.00;`size_m` 62 与实测一致 ⇒ manifest 不需改 |
| 本体 y 包络(`layer_Concrete`) | y 1.000 … 12.507,高 11.507 m;r_out 8.493 m(Ø16.99) |
| 其余层壳实测 | `layer_FW_W` r 5.293;`layer_LiPb` r 6.313;`layer_Cryo` r 8.193(Ø16.39) |
| `validate_units.mjs`(全城) | 本资产 9 项全 OK(216 网格,14,680 三角形) |
| `audit_layout.mjs` | `layout clean: no overlaps, roads clear` |
| POI 锚 | 8 个 `poi_` 节点在:cryostat (0, 6.75, 4.49)、cryo_tanks、compressor_skid、rf_lhcd、heat_exchanger、generator_hall、control_cabin、aux_radiators;`poi_cryostat` 随首壁内移 0.08 m,其余不变 |
| 城内烟测 `index.html?colony=1&inspect=pwr-fusion-01&debug=1` | 57 件资产;本件 world scale = **[1, 1, 1]**;落位 (-140, 45.65, 40);世界坐标下混凝土壳 r 8.493 / 高 11.507;城内 POI 362 个,其中本资产 8 张卡全部绑定;本体卡显示「Ø16.99 m × 11.51 m」「恒温器 Ø16.39 m」;全城 POI 无未标作废的 17.15;控制台 0 报错 |
| 截图 | `E:\Claude\tokamak\renders\fusion_sol005_2026-09-18\city_smoke_front.jpg`(城内近景:剖切、窗口、管线接合完好) |

## 留给总控

- 城仓三处改动未提交:上述两个文件 + `CHECKLIST.md` 本方那行。
- `EQUIPMENT.md` / `MODELS.md` / `docs/*.html` 里查无 17.15,无需联动。
- e2661e2 通知(T 重推,哨兵重算条件表)仍只在文件 `REPLY_pwr-fusion-01_T_rederivation.md` 里;总控、哨兵、sci-rad-01 会话两次查询均不在线,消息未发。

— pwr-fusion-01(tokamak),2026-09-18
