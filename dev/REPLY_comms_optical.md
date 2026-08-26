# REPLY — docs/comms.html 光通信小节增补(mars-optical session → 总控)

日期:2026-08(总控派发当日)
授权:总控 2026-08 授权(认领方 mars-com-relay × mars-com-station 近期不活跃);
依据外部审计 `REVIEW_site_gemini.md` 表2 第2条「该页完全未提及激光对地」。
**原认领 session 回归后对本小节有最终解释权**;本小节数字锚以 `mars-optical` 台账为准。

---

## 1. 交付摘要(按 SITE.md §5 口径)

| 项 | 值 |
|---|---|
| 页面路径 | `docs/comms.html` |
| 新增小节 | `05 The laser is a ramp, not a trunk`(插在原 04 之后) |
| 台账表新增行 | **18 行**(该页 ledger 由 20 行 → 38 行) |
| 图片 | 2 张,`docs/assets/comms/optical-pair.jpg`(99 KB)· `optical-night.jpg`(37 KB) |
| 顶栏 eyebrow | `com-relay-01 · com-station-01` → 追加 `· com-optical-01` |
| 结构顺延 | 原 05/06/07 → 06/07/08,`band`/`band--alt` 交替底色相应翻转 |

## 2. 图片来源清单

| 文件 | 来源 | 说明 |
|---|---|---|
| `optical-pair.jpg` | 城内实拍(`viewer/index.html?colony=1&inspect=com-optical-01`,1600×900,HUD sprite 全部隐藏后渲染) | 前景光学终端 + 39 m 外 12 m Ka 碟同框;**城内实测两站间距 39.4 m**,与设计册 o06 的 39 m 逐位对上 |
| `optical-night.jpg` | 资产预览页夜景(`dev/dev-preview-optical.html`,1280×800) | 上行信标光柱 + 夜光窗;图注已标注为终端本体视图 |

两张均为本项目自产渲染,无外部素材;单张 <400 KB,页面新增资产合计 136 KB。

## 3. 规矩自查(SITE.md §2/§3)

- ✅ **shared tokens 一字未改**——只新增 section 与 table 行,未触 `<style>`。
- ✅ `--accent` 未动(该页 cyan,与 index.html 卡片一致);两主题下 accent 实测生效
  (深 `rgb(99,180,216)` / 浅 `rgb(34,104,143)`)。
- ✅ **全英文**;无外链(全页 `http` 引用只剩顶栏既有 GitHub 一处)。
- ✅ **每个数字都有 Produced by 锚**,写 `mars-optical/sim/oXX_*.py` 与
  `mars-optical/comsol/*.java` 相对路径,**无本地绝对路径**。
- ✅ 移动端:375 / 768 / 1280 三档实测文档无横向滚动;宽表按 SITE.md 允许在
  `.tablewrap` 内滚(524 px)。图片 `loading="lazy"` + `alt` 齐备。
- ⚠️ **截图留档未做**:本 session 无头环境的截图通道对非 WebGL 页面不可用
  (Browser pane 未显示 → 不合成帧)。改用 DOM 度量做等价自查(上述三档宽度、
  两主题 computed style、图片 200 与实际尺寸、章节编号与交替底色)。若总控需要
  留档图,请在有显示的环境补截或告知,我改用别的通道重做。

## 4. 边界遵守情况

- **既有中继星/地面站的数字与叙事一字未改**。唯一动到既有文本的是 ledger 的
  lead 句:原「Twelve simulations reached the archive」→ 补成「twelve on the radio
  side and thirteen ledgers on the optical side — 40 gates, all green」,因为表里
  多了 18 行光学账,原句会与表不符。**若认为此句也应保持原样,请告知,我改回并
  把光学总数移到新小节内说明。**
- **无口径冲突**:小节里引用射频侧的数字全部取该页既有口径(尘暴 9.5 dB 不掉线、
  X-DTE 0.2–5 Mbps、三级射频链),未新造射频数字。光/射频对比表两端资产均写明
  (本站 40 cm → 地球 5 m 望远镜 vs 中继 2.5 m 碟 → DSN 34 m),防口径混淆。
- 未改 `index.html`(comms 卡片本就是 live)、未改导航环、未 push 远端。

## 5. 小节内容要点(供总控速览)

1. **速率**:52 Mbps @2.67 AU / 832 Mbps @0.38 AU,对 X-DTE 259× / 166×;
   同模型代入 DSOC 参数复现其实测 25 Mbps 与 267/622 Mbps 封顶(已知答案闸)。
2. **可用性(头条)**:300 火星年 τ 时序蒙卡 → 长期 **93.3%**,GDS 年 **85.6%**,
   最长单段断链 **94 sol** 不可调度 → **「光是高速斜坡,射频永远是主链路」**。
3. **切换准则**:τ<1 光主 / 1–2 降级 / 2–3.5 高价值队列 / **τ≥3.5 关罩回 Ka**;
   GDS 积压 ~47 TB,晴后约 80 sol 排空。
4. **火星特有的三条便宜**:r₀≈30 m 白昼免 AO、地球距角 ≤41°(白昼运行是唯一模式)、
   白昼背景赢在小视场 6.6×(**不是天更暗**——火星天空反而亮)。
5. **代价**:提前量角 360 µrad = 93 个波束宽。
6. **What broke**(写在小节内,未动既有 07 What broke 小节):壳瓣裸铝板一阶
   7.99 Hz 撞涡脱判不合格 → 改夹层 45.2 Hz;阵列 16→64 px 连带打破冷预算
   (直连 1.50× 裕)→ 8:1 射频频分复用回到 3.4×。

## 6. 另:总控问的回引文本状态(HANDOFF_OPTICAL.md §4)

落位定 A 后已**逐条复核并更新**,现为 **6 条**,全部写好可直接代改:

| # | 收方 | 状态 |
|---|---|---|
| 1 | pwr-grid-01 | 台账新增一行(3.7 kW 均值 / 4.3 kW 峰值),未变 |
| 2 | sci-weather-01 | **已更新**:断链阈 τ=3 → **τ=3.5**(滤光片定版 0.30 nm,背景降 5.2 dB) |
| 3 | sci-seis-01 | **已更新**:振源登记按已落位 A,距 407 m 在 400 m 红线外,登记备查无需整改 |
| 4 | com-relay-01 / com-station-01 | **已更新**:速率改 832 Mbps 口径、可用率 93.3%、阈值 3.5 |
| 5 | sci-swir-01 | **新增**:定 A 后两站相距 193 m(B 案曾 38 m),尘散射杂光弱 25.8× → 从「硬互斥」**降级为排程知会** |
| 6 | com-station-01 | **新增**:同址 800 W Ka 旁瓣 vs SNSPD 前端的 EMC 规格,**双方都未做屏蔽效能计算**,建议两站验收单各加一条实测项;实测前两站同时工作按「可用但需监视」对待 |

第 6 条是本次落位带来的**新增真实需求**,建议优先派发给 com-station 认领方。

---

设计册:`mars-optical`(十三本账 `sim/o01–o13` + `comsol/` 两个 COMSOL 模型,42 闸全绿(评审轮程序化清点),
自我修正 12 处)。页面每个数字都能在其中找到对应脚本。
