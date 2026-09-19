# HOOK SPEC — `userData.alarm`:单位模块对城市告警等级的响应钩子(ops-drill-01,r1)

**状态:** 规格 + 参考实现(`viewer/units/ops-drill-01.js`)。各单位自己实现自己的反应;引擎侧的事件总线、drill.json 播放器与人流动画由总控接(接口在 §4)。本文不改 `viewer/main.js`。

## 1. 一句话

单位模块在 `group.userData.alarm` 上声明「我对 green / yellow / red 各做什么」;引擎(或演习播放器)在等级变化时调用 `alarm.set(level, frame, ctx)`,单位改自己的灯、门、动画。**灯的驱动权归单位自己的 set()**,不要把告警灯塞进 `blinkMats` / `nightMats`——那两条是引擎每帧接管的通道,双驱动会打架(mars-unit-flow 坑账 20/21)。

## 2. 契约

```js
// build() 里,在几何搭完之后:
group.userData.alarm = {
  levels: ['green', 'yellow', 'red'],   // 本单位响应的等级(可少写;没写的等级 = 无反应)
  level: 'green',                       // 当前等级,引擎可读;set() 内自己更新
  // 引擎/播放器在等级变化时调用一次;frame = 本单位在 drill.json 里该时刻的关键帧(非演习时为 null)
  set(level, frame, ctx) {
    this.level = level;
    // 灯:自己改 emissiveIntensity / color(不经 blinkMats)
    // 门:改 door 节点的姿态或触发 oscillator 基准
    // 动画:置标志,由 animate(t,dt,ctx) 逐帧演进(一次性动作照 MODELS.md §4 的 actions 通道)
    // 可选:frame.flow(本单位的人流计数,如 {queue, in_lock, aboard})用来驱动计数灯/门循环
  },
  // 可选,纯声明式(没有 set 时引擎按此表直接改材质;有 set 时忽略此表):
  lights: {
    red:    [{ node: 'lamp_sep', color: 0xff3020, intensity: 2.0 }],
    yellow: [{ node: 'lamp_sep', color: 0xffb030, intensity: 1.6 }],
    green:  [{ node: 'lamp_sep', color: 0x3ee06a, intensity: 1.2 }],
  },
  doors: { red: [{ node: 'gate_leaf', prop: 'position', axis: 'x', value: 0.0 }] },   // 目标姿态,引擎插值 1 s
};
```

- `level` 只有三个值;演习注入也走同一等级(播放器给 `frame.note` 标 exercise)。
- `set()` 必须**幂等**且**可回退**(red → green 要能把灯与门复位),因为演习结束、误报解除都会回落。
- `set()` 不做几何创建、不加载资源、不碰 renderer;每帧逻辑留给 `animate`。
- 与引擎现有词汇的关系:`spinners/oscillators` 照旧;告警只改它们的**基准**(例如停飞 = 把 rotor 的 spinner rpm 置 0 需要引擎支持——r1 里单位在 animate 里自己判 `alarm.level` 做减速)。
- 室内单元(kind:interior)同样可声明;`ctx.player` 可用于「玩家在场时才响警铃」。
- **同文件优雅降级**:引擎没有 alarm 通道(老版本)时,`alarm.set` 永远不会被调用,单位保持 green 外观——不能因此报错。

## 3. drill.json 与关键帧

`drill.json`(本册产物,schema `drill.schema.json`)的 `units[]` 每项 `{id, hook:'userData.alarm', keyframes:[{t_min, level, lights, doors, vent, flow, note}]}`,只在字段变化时出帧。`lights/doors/vent` 是**给人读的状态描述**(与页面台账同文),不是引擎指令——引擎指令只有 `level` 与 `flow`;单位据 level 自己决定灯门。`flow` 是本单位的人数计数(队列/闸内/轿厢内/已到达),给计数灯与门循环动画用。

`paths[]` 每个人一条:`{id, kind, origin, entrance, shelter, legs:[{state, t0, t1, at|from,to}]}`,坐标是地形本地 (x, z);`flow[]` 每分钟一行全城位置计数。**t 单位是分钟(真实时间)**;播放器自选压缩比并印在屏上(与 hab-lift-cab-01 的「时间压缩倍数」同一规矩,不冒充实时)。

## 4. 引擎侧接口(总控接,本册不动 main.js)

1. `city.alarm = { level:'green', source:null, t0:null }`;`setAlarm(level, source)`:遍历 `units` 与室内单元,对有 `userData.alarm` 的调 `alarm.set(level, null, ctx)`;来源只允许一个判据源(sci-rad-01 卡:3×/30× 是全城地表 SEP 事件态的单一判据源),演习来源写 `'exercise'`。
2. 演习播放器:`__mars.drill = { load(url), start(ratio=60), stop(), t_min }`;每帧 `t_min += dt*ratio/60`;对每个单位,当 `t_min` 越过一个 keyframe 就调 `alarm.set(kf.level, kf, ctx)`;`stop()` 回 green。URL `?drill=1&colony=1` 自动开始。
3. 人流动画:按 `paths[].legs` 在 transit 段沿 from→to 线性插值放一个 1.7 m 的人形小件(env-scatter 风格,≤200 三角形,实例化),queue/lock 段停在入口,sheltered 段隐藏;每分钟一行的 `flow[]` 给 HUD 计数条。
4. 参考实现 `ops-drill-01.js` 在**没有**引擎播放器时自己能演:`actions['演习开始']` 置标志,`animate` 用内嵌的 `ops-drill-01.data.js`(由 drill.json 生成)以 60× 压缩演一遍,只驱动自己的灯与计数条。引擎播放器就绪后,总控把 `__mars.drill.start()` 接到这个按钮上即可(单位侧检测 `ctx.drill` 存在则不自演)。

## 5. 各单位该声明什么(与 DISPATCH_ops-drill-01_hooks.md 同表)

| 单位 | red 时 | 依据 |
|---|---|---|
| sci-rad-01 | 警报塔三色灯转红、警铃、屏上「质子雨」 | alert 卡 e2270ed(30× 红警三动作) |
| sci-weather-01 | 共牌红面亮(琥珀面归 τ>2) | sci-rad-01 layers 卡;气象站卡无 SEP 字段——**请确认牌子归谁画** |
| sci-rad-02 | 带电道率条抬、中子道「门控开」指示 | net 卡 cc16e2f |
| sci-rad-03 / -04 | **不变**(这是要点) | ab79f31:<1% |
| hab-tunnel-01 | 门楣灯红/琥珀、人员气闸循环灯按 `flow.in_lock` 跳、车辆大门关、通风塔闭式(域封闭动作,非辐射学动作) | 卡 73e4ee7 |
| hab-lift-01 | 门斗循环灯、轿厢层位柱随 `flow.aboard` 跳 | 卡 ca57e42 |
| hab-lift-cab-01 | 面板横幅「SEP RED」 | 室内单元 |
| hab-foyer-01 | 到达计数板、内门灯 | 卡 73e4ee7 |
| hab-village-01 | 门斗灯红、门斗关(`flow.plaza`=0 后)、旗杆信标 | 卡 9a75308;居民就地避难 |
| veh-heli-01 / veh-uav-01 | 停飞:坪灯红、旋翼减速到 0 | 红警三动作;UAV 卡未点名——**请确认** |
| ops-spaceport-01 / -02 | 发射冻结:工位灯红 | 红警三动作 |
| imperial-city | 清场:台地灯降到 30%、门关(层模块,ctx 契约不同,见 §6) | 53bf29d 无人 |
| 地表值班资产(13 个) | 舱内灯琥珀(穿服中)→ 空 | ECLSS 91f0c37 派班;计数待花名册 |

## 6. 层模块(magic / imperial)

层模块的 `build(ctx)` 没有 `group.userData` 约定之外的钩子;建议同样在 `ctx.group.userData.alarm` 上声明,播放器按 `units[].id === 'imperial-city'` 找 `imperialGroup.userData.alarm`。清场 = `lights[]` 强度 ×0.3 + 门节点关;无人员。

## 7. 验证(单位自己做,交付时写进 REPLY)

- `alarm.set('red')` → 截图;`alarm.set('green')` → 与初始截图逐像素一致(幂等回退);
- 有 spinner 的:red 后 rpm 归零不抖(animate 里做减速,不改 spinner 表);
- validate_unit.mjs 不新增 WARN;三角形预算不变(灯不是新几何,是材质)。
