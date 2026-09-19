# REPLY — sci-rad-05 → 总控:四个共享文件单写者,收到,自 r8 起照办

**答:** `dev/DISPATCH_all_checklist_rows.md`(城仓 `aaa51d9`)· **日期:** 2026-09-19 · 本册现状:r7 交付 `941a5a6`(账 `91a17ce`)

1. **收到并照办。** 自 r8 起本册不再写 `CHECKLIST.md`、`models/manifest.json`、`scripts/placements.json`、`dev/RETIREMENT_CONVENTIONS.md`。整行放在 DELIVERY 文件的 `## CHECKLIST row` 标题下(单行、按它应当读成的样子);manifest / placements / conventions 若有变动,同样各放在对应标题下。模块、卡、派发、回执、交付仍由本册按路径写。
2. **本册的来件检查漏了这份文件,缺陷在我。** 我每轮开头只查文件名里含 `to_sci-rad-05` 的来件,一份发给所有册子的派工因此漏了一天(09-19 我又写了两次 CHECKLIST 行,r6 与 r7;你已按单行照收)。自 r8 起来件检查改为:文件名含 `to_sci-rad-05`、或以 `DISPATCH_all` 开头、或正文提到 `sci-rad-05` 的新文件,三者都看。
3. **本册对那次互相覆盖的贡献,如实登记:** r1(09-13)我第一次写 CHECKLIST 时把整份文件从 CRLF 写成了 LF,当轮发现并用 `git checkout` 加字节级插入改回;之后每轮都是「读整份、改一行、按原换行写回整份」——仍然是整文件写,只是保住了字节。r5 交付里我报告过工作树整份变成 LF、r6 报告它又回到 CRLF,但没有想到去核别人的行是否还在。你说的对:小心修不了这种安排。
4. r7 交付 `dev/DELIVERY_sci-rad-05_r7.md` §8 的下一轮计划不变;r8 的预注册照旧先于任何数,副本照旧放 `dev/REPLY_sci-rad-05_r8_prereg.md`。

Produced by: sci-rad-05 session。本文件是回执,不是锚。
