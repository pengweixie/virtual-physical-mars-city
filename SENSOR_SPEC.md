# 感知资产通道（Sensor Channel）规格 + 交接记录

> 状态：**已实现并验证**（2026-07-17，由 mars_soil 设计 session 实施，经用户授权修改引擎）。
> 本文件 = 正式规格 + 给总控 session 的交接说明。简版契约见 MODELS.md §4c。
> 引擎改动**未提交 git**——是否入库由总控决定。

## 1. 这是什么、为什么要有

让资产能"看着世界行动"：资产声明一台感知相机，引擎按预算把该相机的离屏渲染
像素交回资产，资产在统一动画入口 `animate(t,dt,ctx)` 里消费像素做决策。

设计动机（res-mine-01 挖矿机器人是首个用户）：
- 机器人的自主避障/采掘需要**真实的第一视角图像**（不是脚本），而渲染权必须留在
  引擎手里——资产直接拿 renderer 会破坏渲染预算与 XR 兼容性；
- 通道做成**声明式**（与 spinners/oscillators 同族），符合本项目"统一运动词汇"的
  架构哲学（MODELS.md §4）；
- 未来复用：发射场跟踪相机、巡逻车避障、天文台导星等都走同一通道，引擎不再改。

## 2. 资产侧契约

```js
// build() 里创建相机、挂到载体节点，然后声明：
group.userData.sensors = [{
  id: 'nav',              // 传感器名（字符串，资产内唯一）
  camera: eyeCam,         // THREE.Camera 对象，或节点名字符串（引擎 getObjectByName 解析）
  width: 64, height: 64,  // 离屏分辨率，默认 64×64
  hz: 5,                  // 期望采样率（Hz），引擎按预算尽力，不保证
  // ↓ 以下字段由引擎回填，资产只读：
  // data:  Uint8Array(width*height*4)，RGBA，原点左下（readRenderTargetPixels 原生序）
  // frame: 递增帧号——资产用它判断"有没有新帧"
  // stamp: 该帧的拍摄时刻 t（秒，clock.elapsedTime 域）
}];
```

**消费模式**（推荐写法，res-mine-01 即此模式）：

```js
let lastFrame = 0, autoOn = false;
group.userData.animate = (t, dt, ctx) => {
  if (sensor.frame > 0) autoOn = true;          // 引擎供数据 → 进自主（粘性）
  if (!autoOn) { bakedLoop(t); return; }        // 引擎无通道 → 永远烘焙动画
  if (sensor.frame !== lastFrame) {             // 有新帧才跑感知（感知比控制低频）
    lastFrame = sensor.frame;
    perceive(sensor.data);
  }
  control(dt);                                  // 控制每帧都跑（用最近一次感知结果）
};
```

**优雅降级是硬要求**：同一模块文件在没有传感器通道的引擎（旧版本/其他查看器）
里必须正常工作（退回烘焙动画）。判据就是 `sensor.frame` 是否曾 >0。

## 3. 引擎侧实现（main.js，三处，共 ~60 行）

| 位置 | 内容 |
|---|---|
| 声明区（`unitAnims` 旁） | `const unitSensors = []` + `sensorRR` 轮转指针 |
| `registerMotion(g)` 末尾 | 解析 `ud.sensors`：resolveNode 相机、校验 isCamera、按 width/height 设 aspect + updateProjectionMatrix、初始化 data/frame/stamp/_rt/_next、push 进 unitSensors |
| `driveSensors(t)`（registerMotion 后） | 调度器本体，见下 |
| 主循环 `if (colonyGroup.visible)` 内、unitAnims 之前 | `if (!renderer.xr.isPresenting) driveSensors(clock.elapsedTime);` |
| 文件尾 `?debug=1` | `window.__mars = { units, unitSensors, unitAnims, colonyGroup, scene, renderer, camera, rig, driveSensors, clock }` |

**调度器语义**（driveSensors）：
- **全局每引擎帧最多渲染 1 个传感器**（`return` 在首个执行后），多传感器按
  round-robin 轮转，各自按 `hz` 节流（`_next` 时间戳）；
- 渲染序列：`setRenderTarget(rt) → render(scene, cam) → readRenderTargetPixels
  → setRenderTarget(null)`，然后 `frame++`、`stamp = t`；
- RT 与 data 缓冲**懒创建**（首次到期才分配）；
- 调度在 unitAnims **之前**执行——资产的 animate 在同一帧就能吃到新像素。

**门控**（何时不跑）：轨道视角分支不跑；室内分支不跑；`colonyGroup.visible=false`
不跑；`renderer.xr.isPresenting` 不跑（XR 帧内同步 readPixels 有风险，一期禁用）。

## 4. 性能预算

- 顶点成本：每次传感器渲染 = 整景重渲（地形 210 万三角形），64×64@5Hz 时
  顶点吞吐 ~10M/s 量级，GPU 零头；
- 真实成本是 `readRenderTargetPixels` 的 CPU-GPU 同步（64×64 约 ~1ms 级），
  每帧 ≤1 次的全局限额兜底；
- 传感器相机 far=90m（资产自设），天空盒/远景照常渲染（机器人需要地平线）。

## 5. 首个应用：res-mine-01（已落位 180,-120）

链路：桅杆导航相机(64×64@5Hz) → **CIS 传感器成像模型**（CIS 自研 CMOS
的五阶段验证参数：QE 0.60 / 满阱 17,880e⁻ / 读噪 1.76e⁻ / 暗电流 170e⁻/s /
10-bit ADC LSB 16.5e⁻；含散粒噪声、量化、坏点注入、自动曝光）→ 近场亮度自适应
阈值避障 → 状态机（挖掘/运土/对准/卸料/找新挖点）+ 航位推算 + 地理围栏。

## 6. 验证记录（07-17，城内实测）

- 落位：scale=1.0000（manifest size_m=79 为实测包围盒值，防 placeUnit 重缩放）；
  14 资产加载、控制台零报错；既有 13 资产回归无影响（通道对未声明者纯旁路）。
- 功能：泵帧 15s → 传感器 70 帧（5Hz 如约）；机器人自主完成挖掘→运土→卸料
  状态转移（位移 3.46m）；CIS 自动曝光 12→57ms 收敛于**城内真实火星时光照**
  （与 mars_soil 预览页的 90ms 不同，光照环境不同所致，物理自洽）。
- **验证注意事项**：隐藏标签页 rAF 挂起 → 整个引擎循环（含传感器）暂停。无头
  验证要用 `?debug=1` 手动泵帧：`__mars.driveSensors(t)` + 遍历 `__mars.unitAnims`。
  主循环钩子调用点经代码审查确认，前台页面即每帧真跑。

## 7. 已知限制（一期取舍）与升级路径

| 限制 | 说明 | 升级路径 |
|---|---|---|
| POI 点/浮签对传感器可见 | 未做图层隔离；亮色小 sprite 对暗区避障无实质影响 | 引擎给 UI 元素统一设 layer，传感器相机 disable 该 layer |
| readPixels 同步 | 64×64 代价可接受 | `readRenderTargetPixelsAsync`（three r160+，PBO），帧延迟 +1 |
| 一期无 `?sensorview` PIP | 调试看 `__mars.unitSensors[i].data` 或资产自带遥测 | 主画面角落 scissor 渲传感器相机（mars_soil/_preview.html 有现成实现可抄） |
| XR 内禁用 | 同步读回风险 | async 读回落地后重新评估 |
| 多传感器公平性 | 轮转 + 每帧 1 次，传感器很多时各自实际 hz 会低于声明 | 预算提升为"每帧 N 次"或按分辨率加权 |

## 8. 给总控的接口承诺

- 对未声明 `sensors` 的资产：**行为完全不变**（通道纯旁路）；
- `animate(t,dt,ctx)` 签名与调用时机：**未动**；
- 新增公共面：`userData.sensors` 声明字段 + `?debug=1` 的 `window.__mars`；
- 文档：MODELS.md §4c（资产作者视角）、本文件（引擎维护者视角）、
  STATUS.md「感知资产通道」小节（进度快照）、CHECKLIST res-mine-01 行已勾。
