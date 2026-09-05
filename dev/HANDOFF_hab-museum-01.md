# HANDOFF — hab-museum-01 火星城博物馆(双件套)

交付 session:mars-museum(设计册 E:\Claude\mars-museum,端口 8133)· 2026-08-21

## 1. 交付物

| 文件 | 说明 |
|---|---|
| viewer/units/hab-museum-01.js | 地表壳:半埋覆土 + 玻璃前厅。4,704 面,validate 0 WARN,实测 bbox 39.4×7.5×40.7 |
| viewer/units/hab-museum-01.info.json | 2 卡双语(观众账 / 选址与覆土) |
| viewer/units/hab-museum-hall-01.js | 室内馆(kind:interior,契约同 hab-clinic-01)。6,564 面,0 WARN,实测 30.8×4.9×22.7 |
| viewer/units/hab-museum-hall-01.info.json | 6 卡双语(五展区 + 空墙) |
| models/manifest.json | 两条登记:地表 pos:null(候选见 §2);室内 kind:interior |
| dev/dev-preview-museum.html + preview-museum.bat | 预览页(?unit= 双件通用) |
| E:\Claude\mars-museum\DESIGN.md | 设计册:三本账 + 纪年选目 + 展陈总案 |

静态资产(仅 nightMats/blink),按约定免动图;若总控想收一张,夜景 `?inspect=hab-museum-01&t=20.5` 环视即可。

## 2. 落位候选(pos:null 报总控裁决;两候选 audit_layout 实跑全绿)

先交代被否的方案:直觉候选「村东广场侧 (-205,-95)」压 **pipe-o2-city-2 + G-R2** 双线
(res-glass session 的 HANDOFF_GLASS §2 旁观报告的就是这个,已确认并放弃);
「玄关侧 (-336,-92)」压 hub 放射路四条,同弃。村/玄关门口全是走廊,40 m 足迹放不进。

- **候选 A(推荐)(-262, -170),rotation 0(前厅朝 +Z,面向村)**:村北走廊空带,
  距村心广场 ~124 m、地下城入口 ~156 m;最近工业邻居 pwr-grid-01 ~189 m(静设备),
  矿场 ~444 m、发射区 >1.1 km;四向走廊净距 ≥52 m,audit 0 报错。
- **候选 B(-285, -160),rotation 0**:同一空带偏西,略偏向玄关/枢纽方向,audit 0 报错。
- 无工艺管线接驳需求(用电走埋地网),不需要管廊端头;若总控想再贴村一点,
  瓶颈是含前庭的 ~41 m 深足迹——可接受把前庭与步道共面的话,建筑本体深 29 m,
  能再北挪 ~6 m,需重跑审计。
- 烟测在旧点 (-205,-95) 跑过:落位 scale=1、地形贴合正常(该验证与坐标无关)。

## 3. 门对期望(总控接 INTERIOR_DOORS / PORTALS)

- 地表触发口:hab-museum-01 前厅正门,**本地坐标 (0, 0, 10.6),朝 +Z**
  (随 manifest rotation 旋转)。
- 目标室内:hab-museum-hall-01。模块 userData 已声明:
  `entry: { pos:[0,0,-2.0], yaw:0 }`(进门面向展厅深处)·
  `exitZone: { pos:[0,0.5], radius:1.0 }`(门内圈,与 entry 拉开 2.5 m)。
- `?interior=hab-museum-hall-01` 直达已验证可用。

## 4. 语义红线(用户定,已执行,请验收时复核)

1. **「眼镜」/"headset" 永远带引号**:执行于室内卡 origin(detail/specs 双语)与
   起源厅第 3 格几何(面罩两侧各一对引号刻线)。展签不解读「或为障眼法」之外的任何结论。
2. **第七格 51%/49% 只提问不作答**:卡文案止于问句;几何上两条色带几乎等长、不标胜负。
3. **数据署名**:NASA/JPL/University of Arizona(地形)+ NASA Mars 2020 (Perseverance)
   公开 API(任务数据),与 HUD/THIRD_PARTY_NOTICES 同口径,写在 rover 卡 detail/specs。

## 5. 数据屏口径(毅力号厅)

- 屏为**烘焙快照**:sol 1947 / 里程 11.9 km / 途经点主干 24 点(site 3→37)+ 红色
  现位点(blinkMats,引擎脉动)。与 data/mission/mission.json 交付时点一致。
- 活口径说明已写进卡(sim 字段):任务图层与 HUD 本来就是每日拉取的真数据,
  博物馆屏是它的展陈化。若总控未来想让屏上数字跟活数据走,建议引擎侧做
  `effects:["museum_live"]`,由我方(或任一 session)把 sol 数字改成具名节点组
  (digit_0..3)再接——当前版本不阻塞验收。

## 6. 需代改的回引文本(各资产归属 session / 总控择机)

- **docs/origin.html §3 sightings 表**(总控):可加一行
  `The page, physically | The Origin Hall of the city museum - the seven panels enlarged,
  the manuscript in a climate case, the quotes intact | viewer/units/hab-museum-hall-01.js`。
- **hab-rec-01 arcade 卡 physics 尾**(总控自建资产):可加一句
  「同账另一面见博物馆观众账卡:讲解员轮值是心理维护的生产端。/ The museum's audience
  card holds the other side of this ledger: docenting on rotation is the production side
  of psychological maintenance.」
- **sci-astro-01 样品库卡**(Grok session):可加一句
  「展示件分工:退役/复制样进 hab-museum-hall-01 物质厅,监管链原样永不出库。/
  Display split: retired or replica samples go to the museum's Mars Matter Hall;
  chain-of-custody originals never leave this vault.」
- **res-glass-01(同日交付,已确认在库)**:玻璃彩蛋**已写**——本馆 berm 卡
  specs「前厅玻璃:产自本城(res-glass-01 玻璃厂)」+ physics 尾句,双语。
  若 glass session 愿意,可在其浮法线卡回引一句「首批建筑玻璃用户:hab-museum-01
  玻璃前厅 / First architectural-glass customer: the museum foyer」(非必需)。

## 7. 空墙展签文案(全馆情感锚点,已在 emptywall 卡)

> 这面墙,留给第一个在火星出生的人。
> This wall is reserved for the first person born on Mars.

学校问题保持开放:卡内只写「总控未决,本馆预留」,不替世界观作答。

## 8'. 级联更正回执(给总控,08-22)

总控通知的村账剂量级联(λ_p 44→67.1 撤回)**已改完**:berm 卡 specs 双语
「234 → 7.6 mSv/yr(31×)」,连带 detail「三十一分之一」、physics 衰减长度推论
(41 cm,2 m≈5 个,残余八成次级中子 + ×2~3 不确定度与取值密度两条附带提醒)、
模块头注释、DESIGN.md、CHECKLIST 本行,本地提交 de9c38d。发消息时总控 session
已离线,以本节代「回我一句」。旁观:res-glass-01 账 16(Geant4)给的覆土削减 5.2×
超出 ×2~3 带,其回引 ⑲ 待裁——若村账再变,请再叫本资产级联一次。

## 8. 烟测记录

- 临时 pos (-205,-95) 下 `?colony=1&inspect=hab-museum-01&debug=1`:48 资产全载,
  博物馆 scale === 1(size_m 实测口径正确),无模块相关报错;截图
  E:\Claude\mars-museum\shots\city-museum*.jpg。烟测后 pos 已改回 null。
- `?interior=hab-museum-hall-01&debug=1`:进入正常,灯光/空墙射灯/数据屏全亮;
  截图 shots\city-interior.jpg。
- 预览:dev/dev-preview-museum.html?unit=hab-museum-01|hab-museum-hall-01(8133)。
- 8462 截图服务已停;8133 为本 session 预览端口(8123 未占用)。
