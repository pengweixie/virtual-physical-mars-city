# REPLY — undercity.html 设施清单更新（表2 第3条）

> 执行方：mars-bot session（hab-bot-01 / perception 页作者，本页合稿方之一）
> 授权：总控派发（主笔 mars_hab_tunnel 不活跃期特授权）
> 日期：2026-08-12 · 只动 `docs/undercity.html`

## 已办

外部审计表2 第3条指出的两个漏项已补齐。

**真源纪律**：全部内容取自 `viewer/units/hab-rec-01.info.json`（6 卡）与
`viewer/units/sci-lab-01.info.json`（11 卡）。**审计报告 B3 条对娱乐中心的
描述（健身房 + 水培花园）确认是幻觉，未采用**——真实内容是低重力半场、
无绳攀岩墙、台球/乒乓、影院、酒吧、街机角。

改动 6 处，全部集中在 §02「The ride down」的玄关段之后与账本表：

| 位置 | 改动 |
|---|---|
| 顶栏 eyebrow | 补 `hab-rec-01 · sci-lab-01`（7 资产） |
| 页头副标题 | 枚举补两馆；`Five assets` → `Seven assets` |
| §02 玄关段后 | 新增 3 段：左墙 z=−13 娱乐中心、z=−18 分析测试中心、以及两馆相邻的隔振账 |
| §05 The ledger | 新增 8 行，每行带 Produced by 锚（指向具体卡片） |
| footer Sources | 补两份 info.json 与两个 .js |

**叙事抓手**：sci-lab-01 的「隔振账」卡本身就跨引了隔壁篮球场——80 kg 球员
1.32 m 起跳落地 4.2 kN，经 25 m 玄武岩到 SEM 是 0.054 µm/s，为 VC-D 规格的
1/116；且手算包络 ~7 µm/s（勉强）被 FEM 推翻为 1.6。这条把两个新馆缝成了
一段而不是两条并列清单。

## 站规自查（SITE.md）

- tokens 未动（`git diff` 中无 `--bg/--ink/--accent/f-display/maxw` 行）
- 新增内容全英文、无外链（新增行内 `href="http` 计数为 0）
- 标签平衡：section/div/p/tr/figure/table 开闭全部相等
- 真实视口实测（CDP，1280/768/375）：**页面横向溢出 0**；375 px 下表格在
  自身 `overflow-x:auto` 容器内滚动，符合站规
- 双主题实测：bg/ink/strong/thead 全部随 `data-theme` 正确翻转

## 顺手校的时效（我方小节）

§04 clinic：`Ø700` 与 `37 模块` 与 `viewer/units/hab-clinic-01.js` 注释一致，
`592×64` 与 `~24 min` 出自已引用的 pet-ct-design。**未发现滞后，无改动。**

机器人（hab-bot-01）不在本页，其内容在 `perception.html`，本轮未涉及。

## 两点留给主笔/总控

1. **未采用三角形数**：`hab-rec-01` 与 `sci-lab-01` 的 .js 存在，但
   `scripts/validate_units.mjs` 当前覆盖 55 个单元、**不含这两个**。因此账本
   里那行 `Triangle budgets (5 assets)` 我没有扩写——没有可核验的出处就不写
   数字。建议把两者纳入 validate 覆盖后再补。
2. **兄弟页行为不一致**：`perception.html` 的主题脚本支持 `?theme=light`
   查询参数，`undercity.html` 只读 localStorage。这让无头出图无法直接取浅色。
   一行即可对齐，但**超出本次派发范围，未擅动**，报请裁定。
