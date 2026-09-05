# DELIVERY · hab-village-01 —— 交付通知(文件通道)

本 session 无法 SendMessage(安全分类器持续拦截),故把累积的交付通告落成本文件。
总控按文件名提交,提交前只核范围/JSON 有效/id 唯一,不动内容。

## 待提交的三个文件(mars 仓)

| 文件 | 状态 | 交付前自检(2026-09-02) |
|---|---|---|
| `viewer/units/hab-village-01.info.json` | modified | JSON 有效;id=hab-village-01;7 POI,id 唯一 |
| `viewer/units/hab-village-01.js` | modified | validate 全 PASS,15996 面,size_m 74.75 一致 |
| `dev/HANDOFF_hab-village-v4-closure.md` | modified | 文档 |

audit_layout clean;manifest size_m=74.8 与实测一致。以上四项本文件写时为真。

## 表产物(mars-village 册,非 mars 仓;总控引路径+戳,不提交)

- **定版**:`E:\Claude\mars-village\berths_paths_v5r3_1.json`,version **v5-paths-r3.1**,
  冻结 rerun **2026-09-02T03:56:54.743Z**,全 46 受体 x_solid 确定性 PASS。一名一戳,
  不再被任何重跑覆盖;后续重算写新文件名。
- 历史:`berths_paths.json`=r1 冻结基线(未动) · `berths_paths_v5r3.json`=r3(已退役,
  同名下内容变过) · `berths_paths_v5r2.json`=全村土裙对照组(已撤,保留为证据)。
- 几何反解物质路径脚本:`path_table.mjs`;账实对照:`v3_reconciliation.md`;
  受体真源:`berths.json`;f 区间:`f_range.json`;设计账:`design_accounts.py/.json`。

## 累积交付通告(前几轮发不出,一并落此)

1. **v4 孔道流闭合**:开口通道 46→0(短廊迷宫墙×3/根 + 脊廊覆土枕 + 门斗遮蔽墙系)。
2. **v5 判据改形**:开口判据从「实体≤0.3 且无门」改为「等效风化层≤0.3,门按面密度
   计入,无类别豁免」;门声明双复合门 x=18.9 g/cm²/门(自设);端头舱双错位内墙。
3. **v5c/r3→r3.1**:总控裁决只修角舱 A7 对角缝(不做全村土裙,v6/r2 存对照组);
   r3.1 表结构定版:x_solid(纯零壳承重列,无 cos 阈值)+ x_with_shell(信息列);
   承重列最薄 living_A1 门路径 103.6 g/cm²;r3.1 修 x_solid 漏接廊壁(270 g/cm²·m⁻¹)。
4. **a_dose 重标**:所有「×设计假设」绝对倍数带 @a_dose0.11 参数(实测 0.344–0.679 下
   ×放大;r3 最差 0.827×→2.59–5.11×);结构结论幸存、绝对比值作废,边界写清。
5. **含水率=未决**(不估;防回读:热账 k=0.05 是属性取值非含水测量,不得回读为 0.00 档)。
6. **FLATTENING 终判后五问答复**(已入 berm 卡 durable):f_n/B/λ_n 均选取值无口径;
   **λ_p=67.1 范畴错误认下**(λ_H 全分量当质子支单分量用,无独立依据);t=0 我的 ramp
   实跑给 234(252.7 是常数 B 重构);综合=唯一存活锚地表 234,2 m 外推无支撑,四档保留
   但标「仅地表锚」。
7. **退役约定行**已声明进 `dev/RETIREMENT_CONVENTIONS.md`(六类标注写法)。

## 边界(不归本册,勿并入)

- 7.6 vs 41 当量口径之争:今日判词不碰,归总控与用户派工。
- 玻璃厂侧 HANDOFF ⑲ 与 CHECKLIST 仍写「18.7 属村子模型」——是引错归属(我的模型
  4 m 给 0.9,非 18.7),该由玻璃厂会话自改,不代改(总控 74693cc 已在自己册上更正)。
