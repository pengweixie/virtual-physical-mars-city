# DELIVERY — ops-compute-01 r1.2(2026-09-18):登记 sci-rad-05 的 φ(>LET) 表;查出单位列 100 倍的错

**起因:** `dev/DISPATCH_sci-rad-05_to_ops-compute-01.md`(落盘 09-17)。
**册子:** `E:\Claude\mars-bigram`,账 4 r1.2 提交 `728f1b4`(r1.1 `c3dcdda`,r1 `0ff5840`,无远端)。
**城仓:** 只动本单元的知识卡、公开页、CHECKLIST 自己一行、一份回执与本文件。模块与 `viewer/main.js` 未动(main.js sha256 前 16 位 ff2c90fa4e298668,`git diff` 空)。不 commit 城仓。r1.1 的城仓改动此刻仍未被总控提交,本轮改动叠在其上。

## 1. 做了什么

| 项 | 结果 |
|---|---|
| 登记 | sci-rad-05 表 2b 五行进账 4(`sci_rad_05_table_2b`),等级「设计仿真产品,无数据」;其 r4 未评估项(Z=1 停止类里的氦)与反冲产生率原样登记;**不用它算任何率** |
| 查出的错 | 它的 MeV·cm²/mg 列用 `1/2.33`,应为 `1/233`,大 100 倍;它的闸 G4.3 拿常数对自己比。sci-rad-01 回执的「30 keV/µm ≈ 13 MeV·cm²/mg」同错 |
| 本站自己的份 | r1.1 把「~13 MeV cm2/mg」抄进了账 4 JSON 的 `sel.why`(卡与公开页未带);本轮撤回 |
| 新闸 G4.5 | 换算两条路线:量纲(÷2330 mg/cm³)与 PDG 最小电离(1.664 MeV·cm²/g → 300 µm 硅 116.3 keV,教科书 116);换上错的常数此闸变红(1.16 keV) |
| 新闸 G4.6 | 表的单调性、下半球 φ(>1) 低于 sci-rad-01 总通量 3、下半球 = 视锥 ÷ sin²36.9°。第一版变红:本站把视锥写成真立体角,持有方的平面投影立体角是对的;改的是本站的闸 |
| 结论变化 | 「SEL 由 ≳30 keV/µm 决定」改登**未定**:那条线靠错的常数才与器件单位对上。按正确单位,sci-rad-05 的表覆盖 0.0043–0.43 MeV·cm²/mg,sci-rad-01 的箱到 4.3;器件阈值是采购数据,不选值 |
| 结构读法 | SEU 分两个通道登记:直接电离(φ(>L)×σ(L),暴风里 3 keV/µm 以上基本不动)与质子在器件内打反冲(质子通量×σ_p,暴风驱动;r1.1 的 SEP 扫描标度的是这一条) |
| 状态 | 账 4 仍**不能闭合**;6 闸全绿;记分不变(1 命中 / 2 偏出,本轮无新预期) |

## 2. 验证

`check_retired.py`:21 处退役字面,0 RED。知识卡 JSON 有效,11 卡。公开页标签全闭合,台账 33 个 `<tr>`(含表头),What broke 10 条。模块未动,r1.1 的校验与烟测结果仍适用。上轮记的 404(`sci-rad-05.info.json`)已不存在:该卡现已落盘。

## 3. 文件与 SHA-256(前 16 位)

| 文件 | 改动 | sha256 |
|---|---|---|
| viewer/units/ops-compute-01.info.json | radiation 卡:SEL 行改登未定、新增表登记行、sim 追加 r1.2(中英) | 8f5114842b9de321 |
| docs/compute.html | 台账加两行,What broke 加一条 | e33d6b8b2055c58c |
| CHECKLIST.md | 仅 ops-compute-01 一行追加 r1.2 | d557e28701daaef1 |
| dev/REPLY_ops-compute-01_to_sci-rad-05_let_table.md | 新增(抄 sci-rad-01) | 51a90e92bde946d4 |
| dev/DELIVERY_ops-compute-01_r1_2.md | 本文 | — |
| viewer/units/ops-compute-01.js | 未动(r1.1 值) | 8baf0677413a9c00 |

册内:`ledger/out/04_radiation.json` 249f094de9d93613(`728f1b4`)。

Produced by: ops-compute-01 session(mars-bigram)。引数请引提交号,不引本文。
