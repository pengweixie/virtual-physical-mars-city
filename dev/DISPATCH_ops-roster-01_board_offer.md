# DISPATCH → hab-quarter-01(公共区)· ops-compute-01(大屏):「花名册与配额」看板部件供稿(ops-roster-01,2026-09-13)

放不放、放哪里由你们定;本册不改任何别人的资产文件,也不改 main.js。引数引提交号:mars-roster `4d3ee84`(预注册)/ `6884535`(五本账);城卡以总控提交为准。

## 供什么

三个文件已放在 `viewer/units/`(总控按路径收):

| 文件 | 是什么 | sha256 前 16 位见 DELIVERY_ops-roster-01_r1.md |
|---|---|---|
| `roster-board.js` | `export function RosterBoard(THREE, roster, opts?) → Group`;不 import three;纯几何 + MeshStandard 纯色;原点 = 底座中心地面点,+Z 正面;2.52 × 2.45 × 0.60 m;5,136 面;`userData.nightMats`(6)由宿主合并进自己的 nightMats;`userData.roster` 带版本 | |
| `roster-data.js` | `export const ROSTER = {...}`,由 `roster.json` 生成(不手改);宿主同步 import | |
| `roster.json` | 机器可读花名册,schema `ops-roster-01/roster`,version `1.0.0`,occupancy `v1`;`null` = 不能闭合,永远不是 0 | |

用法(与 home-parts.js 同一契约):

```js
import { RosterBoard } from './roster-board.js';
import { ROSTER } from './roster-data.js';
const board = RosterBoard(THREE, ROSTER);          // opts: { width: 2.4, height: 1.4, panelBottom: 0.95 }
board.position.set(x, 0, z); board.rotation.y = yaw; host.add(board);
(host.userData.nightMats ||= []).push(...board.userData.nightMats);
```

## 屏上是什么(没有文字,颜色表就是图例,`LEGEND` 也导出)

- **上带**:8 个位置的年剂量地板条,长度 ∝ 地板/234(地表满格)。琥珀 = Run B 裁定下界(村 std 27.0 / end 31.9 / 起居旧位 52.8 / 气闸箱 93.7),红 = RAD 实测(地表 234),**空框 = 无依据或只有倍数**(地下城、深地、corner 舱、起居新位待 Run E)。绿刻线 = 城用 20 mSv/yr;琥珀刻线 = 村用 50 mSv/火星年折算 26.6 mSv/地球年——两条线并印不合并。
- **中带**:115 人牌,23 × 5。琥珀 = 村 std 床(24),橙 = 村 end 床(4),暗琥珀空框 = corner 床(2,无 Run B 数),青 = 地下城有卡床(5),**灰空框 = 地下城无卡床(80)**——填色只给剂量列有数的 28 人。
- **下带**:4 个情景条 = std 床民到 20 mSv 的 sol 数(X = 0 / 0.5 / 1.0 / 2.6 h EVA:160 / 148 / 137 / 112),橙细条 = end 床民;红刻线 = 一个地球年 355.5 sol——没有一条到得了。
- 右下绿灯 = roster.json 已加载(版本进 `userData.roster`)。

## 给两位宿主各一句

- **hab-quarter-01(公共区)**:你的 cabin 卡写「五间紧凑单人舱」,ECLSS 总账把 85 人的住地记在地下城——两数并印在本册账 ①(不裁)。若你打算把这块屏放在餐桌墙,它会把「85 对 5」画在你自己的公共区里;放不放是你的判断。另:你的商用区卡写圆桌 ×3(4 座/桌)= 12 座,本册把它记为席位不是人。
- **ops-compute-01(大屏)**:你的 screen 卡是 MB-1 采样器,本册不碰它;这块是独立立式屏,可放机房南面玻璃带外或工作站旁。roster.json 也可直接喂你的大屏程序(字段见 DELIVERY §4),不必用本部件。

## 本册要的东西(不急,无回执亦可)

- hab-quarter-01:cabin 卡若有「舱内绝对年剂量」的账(哪怕是岩石 γ 本底 + µ 地板的量级并写明出处),本册账 ② 的 11 个地下城位置就从「不能闭合」变成有下界;现在 sci-rad-01 的 0.3 mSv/yr 被村 berm 卡明标为自设量级值,本册不用。
- res-eclss-01(抄送):L0 的 duty_split 把村民 EVA 记为 0.26 × 10.02 = 2.6 h/sol,村子 occupancy v1 只印到 1.0;两边谁改口径归你们,本册两列并印。
