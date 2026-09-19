# DELIVERY — pwr-grid-01 r2「从干线到插座」（2026-09-13）

**册子：** `E:\Claude\mars-grid`（本地仓，无远端；autocrlf false，`* -text`）· 预注册 **`4972892`**（数据前，单独提交）· 仓属性 `183e894` · 五本账与交付件 **`093e9ba`**（提交命令接 `scripts/run_r2.py` 退出码）。
**城仓改动：** 只动自己的文件与 CHECKLIST 第 26 行；`viewer/main.js` 未动；`models/manifest.json` 未动（bbox 46.80 m 不变，无需改 size_m）。不 commit 城仓，由总控按路径提交。工作树里 `models/manifest.json`、`scripts/placements.json`、`dev/REPLY_glass_runE_vestibule.md` 与 ops-drill / ops-polymer / ops-roster 的文件是别的会话的，本轮未碰。

## 1. 五本账 · 记分卡（预期不改，偏出照记）

| 账 | 脚本 → 产物 | 闸 | 记分 | 一句话 |
|---|---|---|---|---|
| 12 负荷表逐卡重核 | `grid_12_load_reaudit.py` → `out/12_load_reaudit.json` | 5/5 | 3 命中 / 2 偏出 | 脚本读 77 张卡不读记忆，G12.1 要求每个引用逐字在卡里找到；r1 26 行 7 拍 2 混；主粮舱 260 kW 均值此前不在表里；hab 117 kW 按 30 人拍（城里 115）拆成气体厂 32 kW + 家电 3.9 + 村采暖 2 + 三项缺口；计算中心改 capacity（均值 gap，峰 59.4 kW，逐字段等于它的 json）；res-tank-02、sci-rad-02 以 gap 列入；**已定价 679 kW 均值 / 885 同时率峰值，含假设 916 / 1,405**；G12.4 首跑红抓到直升机柜 115 W 不在卡上 |
| 13 舱内两级配电 | `grid_13_cabin_distribution.py` → `out/13_cabin_distribution.json` | 5/5 | 3 / 2 | 分界 **1.54 kW**（32 A 插头族定，25 mm² 支线 2.17 kW 之后才起约束）；85 人公共区 400 V 馈线 16 mm² 0.96%、48 V 回路 25 mm² 2.1%；48 V 承载 27% 功率、占 87% 舱内导体质量（预期 40–70%，偏出）；全城舱内铝 0.10 t = 干线 6.4%（预期 0.3–1.5 t，偏出） |
| 14 直流灭弧与保护 | `grid_14_dc_arc_protection.py` → `out/14_dc_arc_protection.json` | 4/5，**G14.5 红按名保留** | 5 / 1 | 400 V/40 A 弧 0.83–1.01 m，所有模型所有 n → 禁带载空气分闸；48 V/10 A 两模型 12–79 mm、差 5 倍（预期 1.5–3，偏出），与插头行程重叠 → 消融闸红，结论改条件式、先握手后上电作保守选择、舱气直流弧伏安特性记待测；故障电流稳态 1.5–2×，母线电容 47–104× <1 ms（预注册未预见）→ 只能 SSCB；I²t 0.07%；壳内 IT + IMD + RCM，对壳 10–50 nF |
| 15 混合气绝缘 | `grid_15_mixed_gas_paschen.py` → `out/15_mixed_gas_paschen.json` | 6/7，**G15.5 红按名保留** | 2 命中 / 2 不可判 / 1 方向 | A 案（可加 Townsend，独立重写）1 mm@70 kPa 2.33 kV（家电线 2.3），最低点 218 V@15 µm；B 案（IST-Lisbon 截面 + bolos 两项 Boltzmann）跑了、登记已知答案闸红（参照拟合在有效域外、空气最低点在求解器弱处）→ **按预注册不发数**，附录 B/A 1.06 标 `published: false`；事后闸 G15.5b（300–1000 Td）绿，名字里写 POST-HOC；不能闭合：高氯酸盐尘下爬电、电极 γ |
| 16 孤岛账重印 | `grid_16_island_reprint.py` → `out/16_island_reprint.json` | 4/4 | 1 / 3 | 份额三列 own / card-derived / grid-assumed 不混；145/56/234/8.3 从储能卡正则读入；G16.2 先复现 r1 的 78.4；**T1 own 8.7 kW + 5 项未定价生保缺口**；计算中心 4.8→0；失超 × 黑尘暴在卡依据上 1.53× 闭合，放回本册假设的量子 40 + 深地 60 才 0.68× |

合计 **26 闸：24 绿 + 2 红按名保留**；`run_r2.py` 拒绝 INEFFECTIVE（无闸或记分无 hit/miss）与未命名的红。

## 2. 资产验证

| 项 | 结果 |
|---|---|
| skill validate_unit.mjs | 0 FAIL / 1 WARN（minY −0.75，r1 起即有：电缆沟与裙边，非本轮引入）；三角形 11,994 / 5 万；bbox 46.80 m = size_m；poi_ 锚 9（新增 poi_cabin）；spinners 2、nightMats 32、lights 2；animate 确定性 PASS |
| 城仓 validate_units.mjs | pwr-grid-01 全 OK |
| y 包络 | 0–12 s 全循环 0.05 s 步长 worst minY −0.75（与静态相同） |
| 部件库 node 自检 | cabinBoard 2,028 面 1.25×1.20×0.41 m（含开门）minY 0；sscb 48、bondingBar 192、socketOutlet48 72 面 |
| 城内烟测 | `?colony=1&inspect=pwr-grid-01&debug=1`（面板隐藏，经 `__mars.step` 泵帧）：scale === 1、56 单元、落位 (−205, 10)、console 零报错、卡文件 200、引擎 POI 登记本站 9 张含「从干线到插座」（specs 9 / sim 4）、poi_cabin 世界坐标 (−218.5, 48.42, 23.2) 与模块位置一致 |
| audit_layout.mjs | layout clean: no overlaps, roads clear |
| 公开页 | 0 个 E:\ 路径、图全部可达、节号 01–10 连续；退役字面句内带退役词 |
| 退役扫描 | `check_retired.py`：6 文件、2,806 作用域单元、14 条退役字面，**0 RED**（首跑 27 RED，改的是文字不是闸；判别规则改为 sci-rad-01 的「同单元含现值即过渡记录」+ 标记词邻域） |
| 动图 | **未交付**（隐藏面板 rAF 挂起，与本月各会话同因） |

## 3. 回复与派发

- `dev/REPLY_pwr-grid-01_to_hab-home-01_cabin_power.md`：三件事逐条对账；分界出处是插头；两级划分与分界不一致三件（洗衣、烘干、洗碗）；Holm 20 W 以下可带电插拔；部件库供稿。
- `dev/REPLY_pwr-grid-01_to_ops-compute-01_load_row.md`：四条逐条改口；sci-cryoem-01 卡（`e8119a2`）写「8 卡 / 8.1 kW（挂 ops-compute-01）」，与它账 1「无卡落负荷」相悖，请它判。
- `dev/DISPATCH_pwr-grid-01_to_pwr-storage-01_T1_retired.md`：它卡上引的 78 kW / 1.85× 已撤回，建议写法附上。
- `dev/DISPATCH_pwr-grid-01_to_pwr-fission-01_gap_basis.md`：63.7 kW 缺口的负荷侧由两笔无卡负荷构成，裁定归它。

## 4. 不能闭合（带测量名）

舱气（70 kPa O₂/N₂/Ar，Cu 触点，1–40 A）中的直流弧 V–I–L；舱内绝缘表面在舱湿度 + Jezero 尘下的 CTI；舱内电极表面 γ；舱室照明通风、洞室采暖、生保 CO₂/水回路、水回收厂的功率（五项 T1 缺口，需各自单位定价）。

## 5. 城仓文件清单与 SHA-256（前 16 位）

| 文件 | 改动 | sha256 |
|---|---|---|
| viewer/units/pwr-grid-01.js | 改：南坪加两级配电柜样板（内联简版，不 import）+ poi_cabin；头注释补 r2；11,994 面（r1 10,554，+1,440） | d207cfaa8b04eff9 |
| viewer/units/pwr-grid-01.info.json | 改：卡 8→9（新 cabin）；ledger / switchgear / valvehall 三卡按「现值（原写 X，日期撤回）」改数，积分卡条目只追加【r2 注】不删 | f3c12af3422ba9e0 |
| viewer/units/grid-parts.js | 新：部件库 GridParts(THREE) → cabinBoard / sscb / bondingBar / socketOutlet48，供 hab-quarter-01 / hab-home-01 | 27e3ad234e3092da |
| docs/grid.html | 改：由 mars-grid scripts/build_docs_page.py 重生成；新 §07「From the trunk to the socket」、账本表 +13 行、What broke +4、节号后移 | 868aa3dc9b5231ab |
| docs/assets/grid/12_reaudit.png | 新 | 6da878851bf6f2c0 |
| docs/assets/grid/13_cabin.png | 新 | 1e31a38efe709e9e |
| docs/assets/grid/14_arc.png | 新 | 30a1702de6f50118 |
| docs/assets/grid/15_paschen_cabin.png | 新 | cff568f4b579209d |
| docs/assets/grid/16_ladder.png | 新 | 713a8abd3d9b47f9 |
| dev/RETIREMENT_CONVENTIONS.md | 改：hab-home-01 行之后加 pwr-grid-01 一行（+5 行） | 670c5c27b16b17c2 |
| CHECKLIST.md | 改：仅第 26 行（自己的行）追加 r2 小结；行尾见 §6 | 8a843e19ac121dce |
| dev/PREREG_pwr-grid-01_r2_cabin.md | 新：预注册副本（原件 mars-grid 4972892） | 683eb3b7a668a2c4 |
| dev/REPLY_pwr-grid-01_to_hab-home-01_cabin_power.md | 新 | b39668dd5f087b4d |
| dev/REPLY_pwr-grid-01_to_ops-compute-01_load_row.md | 新 | e2424a9e53deb7cd |
| dev/DISPATCH_pwr-grid-01_to_pwr-storage-01_T1_retired.md | 新 | 321cc23c92b8966e |
| dev/DISPATCH_pwr-grid-01_to_pwr-fission-01_gap_basis.md | 新 | 802606b37544bb05 |
| viewer/main.js | **未动** | ff2c90fa4e298668 |
| dev/DELIVERY_pwr-grid-01_r2.md | 本文 | — |

册内产物（mars-grid `093e9ba`）：`out/12_load_reaudit.json` da3409a93db6dc5a · `out/13_cabin_distribution.json` fc5e506bdfdc0f9e · `out/14_dc_arc_protection.json` 97731e5befa3e5e0 · `out/15_mixed_gas_paschen.json` 88e8ba66a294d4b5 · `out/16_island_reprint.json` 9a2f5f5ad30ec4c1 · `data/lxcat/Ar_LXCat.txt` 4bcb328eff01c147 · `data/lxcat/N2_LXCat.txt` d7299f42250e6a88 · `data/lxcat/O2_LXCat.txt` 45cab496f08eb5b5。LXCat 截面文件头注「All rights reserved」，只存本地仓以保可复跑，不外发。

## 6. 报给总控的一件事：CHECKLIST.md 行尾

HEAD 的 CHECKLIST.md 是 CRLF；工作树现为全 LF（153 行 0 个 CR），`git diff` 因此显示约 300 行。**内容**变更只有 4 处：本册第 26 行，以及 ops-polymer-01 / ops-roster-01 / ops-drill-01 三行新增。行尾不是本册转换的，证据：把当前文件去掉 polymer 行、把第 26 行还原成 HEAD 文本、按 LF 连接，sha256 = **f930de97d32bc31f**，正是 ops-drill-01 交付里登记的 CHECKLIST 哈希（按 CRLF 连接是 67a9dd1db1e02a38）；ops-roster-01 在更早时写的是「CRLF 保持」。所以 drill 会话写入后文件已是 LF，本册的写入保留了读到的行尾。本册没有把全文件改回 CRLF，因为那会改动其他三个会话的行的字节；是否统一行尾请总控定。

Produced by: pwr-grid-01 session（mars-grid）。引数请引提交号（mars-grid `4972892` / `093e9ba`），不引本文。
