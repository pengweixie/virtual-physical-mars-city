# 模型资产命名与接入规范

## 0. 投放箱（你只需要做这一步）

建完的模型**不用手动整理**，丢进投放箱即可：

```
models/_inbox/<资产ID>/     ← Rodin 导出的所有东西直接扔这里
```

例：把天文台的全部导出（zip、glb、obj、贴图，混着都行）丢进
`models/_inbox/sci-obs-01/`，然后**双击"启动火星VR.bat"**——启动时自动：
解压 → 选最优源（pbr.glb > glb > obj+贴图 > stl）→ 需要时转换并烤入贴图 →
归档到 `models/sci-obs-01/`（原始文件进 src/）→ 登记进 manifest.json。

手动触发同样可以：`python scripts/ingest_models.py`。
已存在的资产不会被覆盖；转换失败的会留在投放箱并提示原因。

**交付后最后一步**：到项目根 `CHECKLIST.md` 找到自己那行，把"交付"格改为
✅ 并填日期（只动自己那行的交付格，落位/知识卡列由总控维护）。

**端口约定**：`8123` 是主城查看器的保留端口（启动脚本用）。设计 session
自己的预览服务器请用其他端口（如 8124+）——8123 被占会让启动脚本的服务器
静默绑不上，主页面 404（2026-07-18 实发过一次）。

## 1. 资产 ID 与目录

每个设备一个文件夹：`models/<资产ID>/`，资产 ID 格式：

```
<区域码>-<设备码>-<编号>     例：sci-lidar-01
```

**区域码**（科技城按系统分区）：

| 码 | 系统 | 例子 |
|---|---|---|
| pwr | 能源 | pwr-fusion-01 聚变堆 · pwr-radiator-01 散热阵 · pwr-fission-01 裂变堆 |
| res | 资源/ISRU | res-isru-01 燃料厂 · res-rodwell-01 水冰井架 · res-tank-01 储罐区 |
| sci | 科学设施 | sci-obs-01 天文台 · sci-lidar-01 激光雷达站 · sci-drill-01 深钻平台 |
| hab | 居住 | hab-dome-01 主穹顶 · hab-green-01 温室 · hab-shelter-01 避难堡 |
| ops | 运维 | ops-printer-01 3D打印工地 · ops-garage-01 车库 · ops-helipad-01 停机坪 |
| veh | 载具 | veh-rover-01 巡逻车 · veh-heli-01 直升机 · veh-rocket-01 火箭 |
| mag | 魔幻城 | mag-palace-01 水晶王城 · mag-tower-01 法师塔 |

编号从 01 起；同型号第二台就是 -02（例：两台激光雷达 sci-lidar-01 / -02）。

## 2. 文件夹内文件名（固定）

```
models/sci-lidar-01/
  model.glb        ← 最终使用文件（带 UV + PBR 贴图内嵌）。Rodin 直接导出或由转换管线生成
  src/             ← 原始导出（base.obj / base.stl / texture_*.png / zip），只存档不加载
  ref.png          ← 生成时的主视图参考图（可选，便于对照）
```

Rodin 没有 GLB 导出时：把 obj/stl + 贴图丢进 `src/`，转换管线
（trimesh 离线转换，贴图烤入）负责产出 `model.glb`。

## 3. manifest.json（场景接入清单）

`models/manifest.json` 每个设备一条记录，查看器读它自动放置：

```json
{
  "id": "sci-lidar-01",
  "name": "大气激光雷达站",
  "size_m": 2.2,
  "size_axis": "height",
  "pos": [-260, -180],
  "rotation_deg": 30,
  "sink_m": 0.2,
  "effects": ["beam:532nm", "glow_windows"]
}
```

- `size_m` + `size_axis`（height/width）：真实尺寸标定，引擎按此缩放——写在生成 prompt 里的那个尺寸
- `pos`：地形本地坐标（米，x 东正 / z 南正），不填则我按分区规划安排
- `sink_m`：底座嵌入地面深度（掩护地形起伏）；负值=抬高（如火箭抬上发射台托架）
- `mate`：刻意共位声明——本资产与 `mate` 指向的资产足迹允许重叠
  （如 veh-rocket-02 立在 ops-spaceport-02 发射台上），布局审计
  `scripts/audit_layout.mjs` 对该对免检，其余任何重叠仍然报错
- `effects`：引擎侧动态效果钩子。已支持/规划：`beam:*`（LiDAR 光束）、`flare`（火炬火焰）、`glow_windows`（夜窗）、`blink`（信标闪烁）、`spin:<轴>`（天线/雷达旋转）

## 4. 代码资产（Claude 直建的科学建筑）

科学/科技城建筑由 Claude 直接写 three.js 程序化几何，不走 Rodin。交付为一个
ES 模块，放到 `viewer/units/<资产ID>.js`，契约如下：

```js
// viewer/units/pwr-fusion-01.js
export const meta = {
  id: 'pwr-fusion-01',
  name: '托卡马克聚变电站',
  size_m: 45,               // 实建尺寸自检用；模块内 1 单位 = 1 米
  effects: ['glow_windows'],
};

// THREE 由查看器传入（不要自己 import，保证单实例）
// 返回一个 Group：原点在基座中心地面处，+Y 向上，正面朝 +Z
export function build(THREE) {
  const g = new THREE.Group();
  // ... 按真实米制尺寸搭建，材质用 MeshLambert/MeshStandard ...
  return g;
}
```

**给设计 session 的硬性规则**：

1. **真实米制**，1 单位 = 1 米，不做任何缩放——查看器按原尺寸落地
2. 原点 = 基座中心的**地面点**（y=0 是地表），+Y 向上
3. 不 import three（函数收 THREE 参数），不引用外部贴图/网络资源，纯几何+材质
4. 夜间发光部件（窗、指示灯）：材质自发光即可，并把这些材质塞进
   `group.userData.nightMats = [...]`——引擎会随昼夜调 emissiveIntensity
5. 需要挂点光源/光束的位置：`group.userData.lights = [{ color: 0xffd9a0,
   pos: [x, y, z], range: 40 }]`、`group.userData.beams = [{ pos, dir }]`
6. 多边形预算：单资产 ≤ 5 万三角形；粗构件优先，避免细杆
7. 交付后在 `models/manifest.json` 登记：`{"id": "pwr-fusion-01",
   "type": "code", "module": "units/pwr-fusion-01.js", "pos": null, ...}`
   （GLB 资产则是 `"type": "model"`，二者共用放置字段）

### 动画：统一运动词汇（所有建筑用同一套，别各写各的）

引擎每帧用同一个 ctx `{t, dt, night}` 驱动所有动画（该资产层可见时）。**优先用
声明式**（不写代码），只有复杂逻辑才落 `animate`：

| 声明（放 `group.userData`） | 用途 | 例 |
|---|---|---|
| `spinners=[{node,axis,rpm}]` | 连续旋转 | 雷达碟/风机/涡轮/浮环 `{node:'dish',axis:'y',rpm:2}` |
| `oscillators=[{node,axis,prop,amp,period,phase}]` | 正弦往复 | 打印臂/摆臂/快门 `{node:'arm',prop:'position',axis:'x',amp:3,period:6}` |
| `blinkMats=[mat,…]` / 命名 `blink_*` 网格 | 红色警示闪烁 | 信标灯 |
| `animate(t,dt,ctx)` | **自定义**每帧逻辑 | 挖矿机器人避障路径、屏幕程序、状态机 |

- `node` 可传对象或**节点名字符串**（引擎 `getObjectByName` 解析）；`axis` 'x'/'y'/'z'；
  `prop` 'rotation'（默认）/'position'。
- GLB 资产带 glTF 动画轨道时，命名 clip 为 `loop_*` 引擎自动循环播放。
- **一次性事件用 `animate` 之外的通道**（下），别写进循环：
  - `group.userData.actions = { '发射': ()=>{置标志} }` → 环视(V)时生成"▶ 名称"按钮；
    逐帧推进仍由 `animate` 读标志演进时间线。
  - `meta.schedule = { action:'发射', ltst:14.0 }` → 按火星时每天定点自动触发。

**统一原则**：能用 spinners/oscillators/blink 声明的，就别写 animate；只有真正需要
状态机/路径规划（机器人、屏幕程序）才用 animate。引擎侧对 GLB 资产的等价物是
`effects:[...]`（如 `observatory` 开缝巡天、`beam_nir` 光束），仅在无模块可写时用。

**变体：散件包（kind: 'scatter'）**——一包多个全图撒放的小件（气象桩、
信标、残骸等）。不导出单一 build，而是导出一组构建器，撒放位置和数量由
引擎管：

```js
export const meta = { id: 'env-scatter-01', name: '荒野散件包', kind: 'scatter' };
export const builders = {
  weatherMast(THREE) { /* 返回 Group */ },
  navBeacon(THREE) { ... },
};
```

散件单件 ≤800 三角形（会有几十个实例）；夜光材质照旧塞返回 Group 的
`userData.nightMats`，需要**闪烁**的塞 `userData.blinkMats`（引擎驱动红色
警示闪烁节奏）。其余规则与普通代码资产相同。

设计参考：本项目此前给出的各设备工程化描述（组件清单、尺寸标定）直接作为
设计输入用——它们本来就是按施工说明书写的。

## 4b. 室内场景（穿门加载，interior）

地下/室内场景（地下城门厅、深地实验室、医疗室等）走独立机制：模块照常交付到
`viewer/units/<资产ID>.js` 并在 manifest 登记 `"kind": "interior"`（`pos` 填
null——室内无地表落位），玩家在地表走到"门/竖井"触发区按 E 淡入进入，
Esc 或走到出口淡出返回地表。引擎侧已实现（穿门加载 + 独立室内光照/无昼夜；
引擎按 manifest 的 kind:interior 找模块，`viewer/interiors/` 仅作历史回退路径）。

```js
export const meta = { id: 'hab-foyer-01', name: '地下城门厅',
  kind: 'interior', size_m: 24 };            // size_m = 洞室跨度,用于边界夹取
export function build(THREE) {
  const g = new THREE.Group();               // 原点在地面中心,+Y 上,入口朝 +Z
  // ... 自带地面/岩壁/顶围合成封闭空间(玩家在里面看)...
  g.userData.lights = [{ color, pos:[x,y,z], range }];   // 常亮(室内无昼夜)
  g.userData.entry  = { pos:[x,0,z], yaw };  // 进入时玩家落点与朝向
  g.userData.exitZone = { pos:[x,z], radius };// 走进此圈=返回地表
  return g;
}
```

规则同代码资产（1u=1m、传入 THREE、无外部资源）；室内**灯常亮不接火星时**；
面数可放宽到 8 万。地表触发口（PORTALS）由引擎登记，绑到对应地表资产的门
（如 hab-foyer 绑 hab-tunnel-01 入口与 hab-lift-01 电梯站）。
`entry`/`exitZone` 请务必声明且**两者拉开距离**——缺省值同点，引擎虽有
"出口需先离开一次才触发"的保护，但正确的门位体验才对。
`?interior=<id>` URL 可直达（测试/分享）。

## 4c. 感知资产（传感器通道，sensors）

需要"看着世界行动"的资产（自主机器人、跟踪相机等）声明感知相机，引擎按预算
渲染离屏帧并把像素交回资产——资产在 `animate(t,dt,ctx)` 里消费像素做决策。
**资产永远不直接碰 renderer**，渲染预算归引擎。

```js
// build() 里创建相机并挂到载体节点上，然后声明：
group.userData.sensors = [{
  id: 'nav',            // 传感器名
  camera: eyeCam,       // PerspectiveCamera 对象（或节点名字符串）
  width: 64, height: 64,// 离屏分辨率（默认 64×64）
  hz: 5,                // 期望采样率，引擎按预算尽力
  // ↓ 引擎回填，资产只读：
  // data:  Uint8Array(w*h*4) RGBA 像素（原点左下）
  // frame: 递增帧号（资产用它判断有没有新帧）
  // stamp: 拍摄时刻 t
}];
```

- 引擎调度：**全局每帧最多 1 次传感器渲染**，多传感器轮转按 hz 尽力；
  WebXR 会话中暂停；殖民地层不可见时暂停（与动画同门控）。
- 资产侧模式判定建议：`sensor.frame > 0` 说明引擎供数据 → 进自主逻辑；
  引擎无此通道（老版本）则 frame 恒 0 → 退回烘焙动画，**同一文件优雅降级**。
- 首个应用：res-mine-01 挖矿机器人（桅杆导航相机 → CIS 传感器成像模型 →
  亮度阈值避障 → 状态机自主采掘）。

## 5. 子设备标注与知识卡（POI 系统）

每个建筑多轮挖掘出的子设备介绍、核心参数、仿真/计算结论，统一沉淀为
"几何锚点 + 旁车 JSON"，引擎按距离分级显示（远处无标注，走近浮现名称，
贴近弹出详情卡）。

**几何侧**（设计 session 在 build() 里做）：在子设备中心位置放命名空节点：

```js
const anchor = new THREE.Object3D();
anchor.name = 'poi_cryostat';      // 前缀 poi_ + 子设备 id
anchor.position.set(0, 8, 0);
g.add(anchor);
```

**内容侧**：旁车文件 `viewer/units/<资产ID>.info.json`
（Rodin 资产则放 `models/<资产ID>/info.json`，pos 手工填坐标）：

```json
{
  "id": "pwr-fusion-01",
  "pois": [
    {
      "id": "cryostat",
      "label": "低温恒温器",
      "range": 25,
      "detail": "不锈钢真空容器，隔绝 4.5 K 超导磁体与火星环境。18 组 D 形 Nb3Sn 线圈……",
      "specs": { "直径": "14 m", "线圈工作温度": "4.5 K", "真空度": "1e-4 Pa" },
      "sim": "磁面平衡计算：q95 = 3.2，归一化 β_N = 2.8（详见设计轮记录）"
    }
  ]
}
```

- `label` 短名（走近显示）；`detail` 一段介绍；`specs` 参数表（键值对）；
  `sim` 仿真/计算结论（可选，字符串或字符串数组）
- `physics` 机制层（可选，字符串或字符串数组）：这个数字背后的物理定律/机理，
  渲染在 `sim` 之上（🔬 前缀紫色，`sim` 为 📐 绿色）——`sim` 是账本，`physics` 是它凭什么
- `range` 标注可见半径（米，默认 25；大型子设备如散热阵可给 40）
- 锚点在几何里的（poi_ 节点）不用写 pos；无锚点的条目补 `"pos": [x, y, z]`
- 每资产建议 3~8 个 POI，只标核心子设备，不要给每颗螺丝写卡

**引擎行为**（查看器实现，资产侧无需关心）：距离 LOD 三级（点 → 名称 →
详情卡），同屏最多 6 个标签，详情卡含参数表与仿真结论，VR 内用纹理面板。

## 6. 模型内部节点命名（可选，进阶）

若在 Blender 等工具里组装多部件模型，节点名用功能前缀，引擎自动识别：

| 前缀 | 行为 |
|---|---|
| `emit_*` | 夜间自发光部件（窗、指示灯面板） |
| `light_*` | 点光源锚点（空节点即可，引擎在此挂灯） |
| `beam_*` | 光束起点锚（LiDAR 出光口） |
| `spin_y_*` | 绕 Y 轴慢转（雷达天线、风向标） |
| `blink_*` | 红色警示闪烁 |

Rodin 单体融合网格没有子节点，此层不适用；留给以后精修的资产。
