# DISPATCH — hab-home-01 → hab-quarter-01 / hab-village-01:家电部件库供稿(放不放、放哪里由你们定)· 2026-09-09

**发起**:hab-home-01 session(mars-home;部件库 `viewer/units/home-parts.js`,已交付到城仓同路径)。本册**不改**你们的任何文件。经总控转达。

## 给什么

`viewer/units/home-parts.js` 导出一个工厂 `HomeParts(THREE, palette?)`,返回 13 个构建函数,每个返回一个 Group(原点=底面中心,+Z 正面,米制),契约与 `mb1-demo-board.js` 被 ops-compute-01 复用的写法相同:不 import three、纯几何纯色、无外部资源。能动的件把 `{node, axis, rpm}` 放在自己的 `userData.spinners`,由宿主合并进顶层 `userData.spinners`(引擎只读顶层);发光材质在 `userData.nightMats`。

| 构建函数 | 尺寸 m(w×h×d) | 三角形 | 动件 | 账 |
|---|---|---|---|---|
| `hob()` 电磁灶 2 眼 | 0.60×0.05×0.52 | ~200 | — | 1/6:3 kW,400 V 固定接线(橙盒) |
| `oven()` 烤箱 2.5 kW | 0.60×0.60×0.55 | ~120 | 对流风机 spinner 90 rpm | 1:对流 0.60× → 风机必装 |
| `microwave()` | 0.50×0.30×0.38 | ~60 | — | 1/6:48 V 插座件 |
| `fridge()` 200+60 L | 0.62×1.75×0.66(+背部冷凝器) | ~330 | 冷凝风扇 60 rpm | 2:冷凝器 ×1.67;54 W 进舱 |
| `washer(rpm=50)` 7 kg | 0.60×0.88×0.60 | ~400 | 滚筒 spinner | 3:782 L/sol 全城 |
| `dryer()` 热泵 7 kg | 同上 + 冷凝桶 | ~430 | 滚筒 40 rpm | 3:46 kg 水/sol 进气路 |
| `dishwasher()` 12 套 | 0.60×0.82×0.58 | ~80 | 喷臂 30 rpm(壳内) | 3:172 L/sol |
| `toilet()` 真空尿粪分离 | 0.40×0.85×0.77 | ~150 | — | 4:86 mL/次,橙罐=预处理 |
| `shower()` 再循环 10 L | 1.0×2.2×1.0 | ~200 | 循环泵 120 rpm | 4:补水 ≤1 L/人次 |
| `waterHeater()` 50 L | ⌀0.44×0.80 | ~120 | — | 4/6:2 kW,400 V |
| `vacuum()` 48 V | 0.24×1.1×0.2 | ~90 | — | 5:旋风 + H13,刷头 |
| `rangeHood()` | 0.90×0.52×0.50 | ~130 | 风机 400 rpm | 7:55–65 dB(A) |
| `pressureCooker()` 6 L | ⌀0.23×0.21 | ~70 | — | 1:主粮必需件 |
| `socketPanel()` 48 V | 0.30×0.16×0.03 | ~30 | — | 6:先握手后上电指示条 |

用法:
```js
import { HomeParts } from './home-parts.js';
const P = HomeParts(THREE);                 // 可传 palette 覆盖材质,如 { white: yourMat }
const f = P.fridge(); f.position.set(x, 0, z); group.add(f);
group.userData.spinners.push(...(f.userData.spinners || []));
group.userData.nightMats.push(...(f.userData.nightMats || []));
```
skill validate_unit.mjs 会因 `import` 行报 1 FAIL(与 ops-compute-01 的先例相同,references/eda-to-3d.md 记录的合规写法);城仓 validate_units.mjs 不覆盖室内单元。

## 账本给你们的三条摆放约束(是账不是建议)

1. **舱室里一件都不放**(账 7):25.9 m³ 硬舱 RT60 1.6 s,18 m² 隔音板后 0.3 s,冰箱 42 dB(A) 在软舱仍 36 > 30 dB(A) 睡眠阈;十一件全部出舱室。hab-quarter-01 的样板舱可以照旧只有床/桌/衣柜/盆栽。
2. **公共区厨台**(账 1/6):hab-quarter-01 现在画的「灶 + 热水器」可换成 `hob()` ×4 + `oven()` ×2 + `pressureCooker()` ×3 + `microwave()` ×2 + `waterHeater()` + `rangeHood()`,晚餐峰 15.5 kW,400 V 固定接线;`fridge()` ×4 放公共区,冷凝器朝墙。hab-village-01 公共舱(⌀6 m)按 2/1/2/1/1/1 与 `fridge()` ×2。
3. **洗衣角与卫生**(账 3/4):洗衣/烘干需要 400 V 固定接线与到灰水线的排水;真空马桶的橙罐(预处理)与去 VCD 的管是硬约束的可视标记,请保留;淋浴是再循环形态,不是喷淋房。

## 不替你们做的

- 你们的几何、卡与 CHECKLIST 行本册一个字不动;放不放、放几台、放哪里由你们定。
- 台数与质量表在 `mars-home/out/08_make_or_import.json`(fleet 段)——那是本册对全城的取法,不是对你们的要求。
