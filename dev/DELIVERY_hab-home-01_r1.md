# DELIVERY — hab-home-01 家电账与样板间 r1(2026-09-09)

**册子:** `E:\Claude\mars-home`(本地仓,无远端)· 首提交 `8e3b0a8`(4 文件 = 预注册在数据前)· 八本账 `036a7e8` · 几何与公开页 `a60ac7c`。
**预注册:** `dev/REPLY_hab-home-01_prereg.md`(城仓)= 册内 `dev/PREREG_hab-home-01.md`。**交账:** `dev/REPLY_hab-home-01_ledgers.md`(账先于几何,已先交)。
**城仓改动:** 只动自己的文件、manifest 自己的一条、CHECKLIST 自己的一行、RETIREMENT_CONVENTIONS 自己的一行;`viewer/main.js` **未动**(sha256 前 16 位 e0e0806bd4207052,与本轮开始时一致)。不 commit 城仓,由总控按路径提交。

## 1. 八本账记分卡(详见 REPLY_hab-home-01_ledgers.md)

35 闸 = 34 绿 + 1 预注册红(G7.3:res-eclss-01「声速高约 20%」方向错,c = 329 vs 344 m/s;G7.3b 纯气已知答案证明公式对);57 预期 = 34 命中 / 17 偏出 / 6 不可判,偏出不改照印。头条:70 kPa 沸点 89.99 °C 使压力锅成为主粮必需件;res-recycle-01 进料表无洗衣/洗碗行(+955 L/sol = 1.45×,净补水 30.3 → 47.5);湿气 +92 kg/sol = 冷凝线 +34%;马桶 86 mL/次由冲洗线反推;冰箱同面积冷凝器 COP −17%;十一件家电按 30 dB(A) 睡眠阈全部出舱室;48 V ≤1.5 kW 插座 / 400 V 固定接线两级;全城 91 台 2.80 t(进口 1.06 t),不给制造率。**不能闭合两项**(气闸尘带入 g/循环、尿预处理投加量)已派发,卡上写 NOT CLOSABLE 不写数。

## 2. 资产 hab-home-01(mars-unit-flow 全流程)

| 项 | 结果 |
|---|---|
| 几何 | 室内单元 kind:interior,洞室净 12 × 9 m(bbox 13.41 × 5.22 × 10.42),入口 +Z;厨房 L 形铸石台面(电磁灶/烤箱/洗碗/微波架/抽油烟机/压力锅/冰箱/热水器/盆)· 卫浴隔间(真空马桶 + 橙色预处理罐 + 去 VCD 管、再循环淋浴 MF+UV、盆)· 洗衣角(洗衣/热泵烘干/吸尘器/48 V 蓝插座面板/400 V 橙接线盒/排水到灰水线)· 床位(床/衣柜/盆栽/18 m² 隔音板)· ECLSS 回风机组(油烟机风管接入)· 记分屏(八行青/红条 = out/*.json scorecard)· 应急竖井龛(exitZone) |
| 部件库 | `viewer/units/home-parts.js`:`HomeParts(THREE, palette?)` → 13 个构建函数(hob/oven/microwave/fridge/washer/dryer/dishwasher/toilet/shower/waterHeater/vacuum/rangeHood/pressureCooker/socketPanel),不 import three,动件在各自 `userData.spinners` 由宿主合并;供稿见 `dev/DISPATCH_hab-home-01_parts_offer.md` |
| 动画 | 全声明式,零 animate:8 spinner(烤箱对流风机 90 / 冰箱冷凝风扇 60 / 洗衣滚筒 50 / 烘干滚筒 40 / 洗碗喷臂 30 / 淋浴泵 120 / 油烟机 400 / 回风机 45 rpm);nightMats 20;lights 6 |
| skill validate_unit.mjs | 三角形 5,948 / 8 万(室内);bbox 13.41 = size_m 13.4;minY −0.00;**0 WARN**;1 FAIL = 「模块内有 import」——`./home-parts.js` 相对导入,与 ops-compute-01 复用 mb1-demo-board.js 的先例相同(references/eda-to-3d.md) |
| 城仓 validate_units.mjs | 不覆盖室内单元(hab-quarter-01 / hab-foyer-01 亦不在其列),其余单位状态与本轮开始一致 |
| y 包络 | 静态 minY 0.00(地坪面 y 0.02);无 animate,无循环包络项 |
| 城内烟测 | `viewer/index.html?interior=hab-home-01&debug=1`(mars `d819d45` 工作树 + 本轮文件):`inInterior.id === 'hab-home-01'`、group.scale [1,1,1]、54 资产、**console 零报错**、8 spinner 泵帧 600 帧:冰箱扇 10.0 转 / 洗衣滚筒 8.33 转(60 / 50 rpm 精确)、entry (0,0,3.3) yaw 0、exitZone (5.95,3.6) r1.1 |
| POI ↔ 卡 | 12 锚:hob / oven / fridge / dishwasher / toilet / shower / laundry / vacuum / power / bed / eclss / screen ↔ info.json 12 张,零孤儿;每张 label/detail/specs/sim/physics 五字段双语,sim 引 mars-home ledger 脚本与城卡提交号 |
| 定妆照 | `docs/assets/home/r1-{kitchen,overview,laundry,bath_laundry}.jpg`(1280×720,40–70 KB,引擎内相机手动摆位 + toDataURL);册内 `shots/` 同四张 |
| 公开页 | `docs/home.html`:英文;shared tokens 与模板逐字一致(仅 accent = amber);台账表 39 行每行 Produced by + 状态列(account / estimate / conditional / not closable / approximation / known-answer gate / measured);What broke 6 条;无外链(GitHub 导航除外)、无本地绝对路径;375 px 无横向溢出;图全部 ≤400 KB |
| 动图 | **未交付**(r1 只交静态照;GIF 留 r2) |

## 3. 需要总控接的 main.js 改动(本册未动 main.js)

`INTERIOR_DOORS` 加两条,照 hab-quarter-01 / ops-fab-01 的先例(玄关右墙实体段 z=−8 空着:芯片厂门在 −2.5,消防柜在 −12,电梯在 −15.5):

```js
  // 玄关右墙中段 → 家用电器样板间(厨房/卫浴/洗衣角/床位/记分屏)
  { from: 'hab-foyer-01', pos: [5.4, -8], radius: 1.6, to: 'hab-home-01',
    label: '样板间(家电)', label_en: 'Show home (appliances)' },
  { from: 'hab-home-01', pos: [0, 4.0], radius: 1.5, to: 'hab-foyer-01',
    label: '玄关', label_en: 'Foyer',
    entry: { pos: [4.6, 0, -8], yaw: Math.PI / 2 } },
```

hab-foyer-01 右墙 z=−8 的门组几何(门套/门扇/标志板)属 hab-foyer-01 持有者,本册未画;引擎的 makePortalMarker 会自动在该点放标记,门组几何可后补。

## 4. index.html 卡与 README 行(总控加)

- 一句描述:**The Home — eight appliance ledgers for a 70 kPa cabin, and a walk-in show home built from them.**
- 两项数据:**Water boils at 89.99 °C (pressure cooker mandatory)** · **Laundry + dishes = 1.45× the recycle plant's intake**。
- slug `home`,accent amber;Prev/Next 我写成 undercity ↔ town,按你的环序改。

## 5. 城仓文件清单与 SHA-256(前 16 位)

| 文件 | 改动 | sha256 |
|---|---|---|
| viewer/units/hab-home-01.js | 新增 | 71b7573baae591ca |
| viewer/units/home-parts.js | 新增(部件库) | f37f363dd7fb1ba5 |
| viewer/units/hab-home-01.info.json | 新增(12 卡) | d604fcd8a94088e1 |
| docs/home.html | 新增 | ec4df2f5574d9afc |
| docs/assets/home/r1-kitchen.jpg | 新增 | 13d6268012d9f390 |
| docs/assets/home/r1-overview.jpg | 新增 | 5d456d73518bfdc1 |
| docs/assets/home/r1-laundry.jpg | 新增 | aca8a96ae95c5b27 |
| docs/assets/home/r1-bath_laundry.jpg | 新增 | ecb79af19580e190 |
| models/manifest.json | hab-quarter-01 之后插入 hab-home-01 一条(kind interior,pos null,size_m 13.4);行尾 LF、末尾换行保持 | b5c6ac1b563458b3 |
| CHECKLIST.md | 仅第 70 行(hab-quarter-01 之后)新增自己的行;工作树在本轮开始前已是 LF 且被别的会话改动(git status M),本册未动行尾 | 1466a6145d1c00b5 |
| dev/RETIREMENT_CONVENTIONS.md | ops-compute-01 行之后新增 hab-home-01 一行 | 3e69d5513be0ec2d |
| dev/REPLY_hab-home-01_prereg.md | 新增(= 册内 PREREG,首提交) | a2ef6a9a6fed69c7 |
| dev/REPLY_hab-home-01_ledgers.md | 新增(交账) | a0facf20a98b120c |
| dev/DISPATCH_hab-home-01_dust_ingress.md | 新增 → hab-foyer-01 / hab-tunnel-01 / hab-village-01 | 5c6ba9c6f77d2618 |
| dev/DISPATCH_hab-home-01_recycle_lines.md | 新增 → res-recycle-01(抄 rodwell / eclss) | 00baa394adc8a2eb |
| dev/DISPATCH_hab-home-01_parts_offer.md | 新增 → hab-quarter-01 / hab-village-01 | 61a5ec4ee22cefed |
| dev/DELIVERY_hab-home-01_r1.md | 本文 | — |
| viewer/main.js | **未动** | e0e0806bd4207052 |

册内产物(mars-home `036a7e8`):`out/01_cooking.json` 34296132ff5b6df1 · `02_refrigeration.json` d527c8dc84c98ab0 · `03_laundry.json` 2829970131434f34 · `04_sanitation.json` ef5cf316332d5877 · `05_dust.json` 41900f5ff3fa8cb9 · `06_electrical.json` a546429b5d5eae98 · `07_acoustics.json` fcd162ecb4391ec2 · `08_make_or_import.json` 962669852c0d0f9f。

`dev/REPLY_sci-rad-01_*.md`、`viewer/units/sci-rad-01.*` 是别的会话的未提交改动,本轮未动。

## 6. 给别的单位(只报不改;引提交号)

见 REPLY_hab-home-01_ledgers.md §5:res-recycle-01(水卡缺两行、预处理投加量、滤芯绿流规则)、res-rodwell-01(生保占井 8 → 12.5%)、res-eclss-01(声速句方向错、冷凝 +34%、炊事与冰箱排热)、hab-quarter-01(舱室不放电机类电器、公共区厨台配置、洞室热平衡缺卡、部件库)、pwr-grid-01(插座两级、CO₂ 系数只作闸)、ops-fire-01(CO₂ 制冷剂在 30% O₂ 当量下的安全性)。

Produced by: hab-home-01 session(mars-home)。引数引 mars-home `8e3b0a8` / `036a7e8` / `a60ac7c`,城卡以总控提交为准,不引本文。
