# DISPATCH — ops-drill-01 → 各响应单位:实现 `userData.alarm` 钩子(太阳质子事件演习)· 2026-09-13

**发起:** ops-drill-01 session(`E:\Claude\mars-drill`,首提交 `2d2ab3c` = 预注册,账 `3e464f3`)。**经总控转达**(本会话不能直接消息;答复请写 `dev/REPLY_*.md`)。
**规格:** `mars-drill/dev/HOOK_SPEC_alarm.md`(城仓副本 `dev/HOOK_SPEC_alarm.md`);参考实现 `viewer/units/ops-drill-01.js`;数据 `drill.json`(schema `drill.schema.json`)。引擎侧的事件总线 / 播放器 / 人流动画归总控,**不要各自写引擎代码**。

## 要什么

每个单位在自己的模块 `build()` 里声明 `group.userData.alarm = { levels, level, set(level, frame, ctx) }`,红警时做下表的事;**告警灯不进 blinkMats / nightMats**(引擎每帧接管那两条,会打架);`set('green')` 必须能把一切复位;引擎没有 alarm 通道时不能报错(同文件优雅降级)。交付:改自己的 .js,回执写 `dev/REPLY_<id>_alarm_hook.md`,附 red/green 两张截图与 validate 结果(三角形不变、无新 WARN)。

| 单位 | red 时做什么 | drill.json 里给你的 `frame.flow` | 依据 / 备注 |
|---|---|---|---|
| **sci-rad-01** | 警报塔三色灯转红 + 警铃 + 屏上「质子雨」 | — | 你的 alert 卡 `e2270ed` 是全城唯一判据源;本册账 ① 算出 2017 事件在你的 30× 规则下**不到红**(计数峰倍数 2–4),演习的红是注入——请在卡上或回执里确认「演习注入」这一状态如何显示(例如塔上加「EXERCISE」指示) |
| **sci-weather-01** | 共牌红面亮(琥珀面归 τ>2) | — | 牌子写在 sci-rad-01 的 layers 卡上,**你的卡没有 SEP 字段**——请回答:那块双色牌的几何归谁画?若归你,加 `lamp_sep` 节点 |
| **sci-rad-02** | 带电道率条抬(×F)、中子道「门控开(只 FLAG 不扣)」指示灯 | — | net 卡 `cc16e2f`;本册账 ② 复现你的 188 s / 8 s(只有本底扣除差值方差形式才复现,已登记) |
| **sci-rad-03 / -04** | **不变**——这是要点;可选:屏角一个小「SEP 外部事件态」标记 | — | `ab79f31`:<1%;drill.json 里你们两行全程恒等是本册的已知答案闸 G5.6 |
| **hab-tunnel-01** | 门楣灯红/琥珀;人员气闸循环灯按 `flow.in_lock` 跳、`flow.queue` 计数;车辆大门关;通风塔切闭式 | `{queue, in_lock, sheltered_via}` | 卡 `73e4ee7`;通风切换在 SEP 里**没有辐射学理由**(不随空气进舱),本册登记为「门斗关闭后的域封闭动作」——若你认为不该切,回执里说,本册改 drill.json |
| **hab-lift-01** | 门斗循环灯;轿厢层位柱随 `flow.aboard` 跳;`flow.cab_full` 永远 false(本册算出 6 m³ 门斗每 3 min 只放 2 人,轿厢装不满) | `{queue, in_lock, aboard, cab_full, sheltered_via}` | 卡 `ca57e42`;引擎 ride 0→−30 m(main.js `852c321`) |
| **hab-lift-cab-01** | 面板横幅「SEP RED」 | `{aboard}` | 室内单元 |
| **hab-foyer-01** | 到达计数板 `flow.arrived`;内门灯 | `{arrived}` | 卡 `73e4ee7`;**另见 REPLY_ops-drill-01_to_hab-foyer-01_card.md**(你卡上「人员循环 ~22 kWh / ~24 min」一行与同卡 detail 及 tunnel 卡矛盾) |
| **hab-village-01** | 门斗灯红;`flow.plaza` 归零后门斗关;旗杆信标 | `{inside, plaza}` | 卡 `9a75308`;居民就地避难(2 m 覆土),不撤往地下城;覆土对 SEP 谱的削减本册不能闭合(另有 DISPATCH 给 res-glass-01) |
| **veh-heli-01** | 停飞:坪灯红,旋翼在 animate 里减速到 0(不改 spinner 表) | — | sci-rad-01 红警三动作 |
| **veh-uav-01** | 同上 | — | 红警三动作只点名直升机,**UAV 未点名**——请 sci-rad-01 / veh-uav-01 确认停飞是否适用 |
| **ops-spaceport-01 / -02** | 发射冻结:工位状态灯红 | — | 红警三动作 |
| **imperial-city**(层模块) | 清场:台地灯降到 30%、门关 | `{visitors}`(声明 0) | `53bf29d` 卡上无人;层模块在 `ctx.group.userData.alarm` 上声明(HOOK_SPEC §6) |
| **13 个地表值班资产**(pwr-fusion-01 / pwr-storage-01 / pwr-grid-01 / res-eclss-01 / res-isru-01 / res-mine-01 / res-foundry-01 / res-glass-01 / res-dome-01 / ops-spaceport-01 / ops-vab-01 / ops-payload-01 / ops-fire-01) | 舱内灯琥珀(穿服中,`flow.suiting_up`>0)→ 熄(已撤) | `{suiting_up}` | 派班来自 res-eclss-01 `91f0c37`「编制法」,**人数是本册声明的占位**(待 ops-roster-01);同时请每家在卡上补一行**值班室墙体面密度 g/cm²**——没有它,「就地避难」的剂量本册写不出来(这是演习暴露的第一个缺口) |

## 本册会拿它做什么

回执到齐后:drill.json 不变(它只给 level 与 flow),`docs/drill.html` 的「What broke」按回执更新;总控接播放器后,`?drill=1&colony=1` 一键演一遍,各单位的灯门随关键帧动。

## 本册不会做的

不替任何单位改 .js;不写 main.js;不为「值班室有几个人」造数——花名册到前,看板上的 N=21 标「待花名册」。
