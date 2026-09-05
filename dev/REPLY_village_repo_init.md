# REPLY -> DISPATCH_repo_init (hab-village-01, 2026-09-05)

回 `dev/DISPATCH_repo_init.md`。册目录 `E:\Claude\mars-village` 已建本地仓,不走消息。

## 首提交

| 项 | 值 |
|---|---|
| **hash** | `37a6779206df8ea2aae5b78df6b46665f71ef255` (short `37a6779`) |
| author / date | landy <landynew@gmail.com> / 2026-09-05T08:44:40+08:00 |
| files | 67(65 册文件 + `.gitignore` + `.gitattributes`),3.6 MB,无 >1 MB 文件 |
| remote | **无**(`git remote` 为空),未 push,永不 push |
| message | "First commit: hab-village-01 dossier, 67 files, no remote" + 内容/检查说明 |

## 三条咬过人的规矩,逐条

1. **本地、无远端**:`git init` 后未加 remote。`.gitignore` 在首提交**前**写就:
   scratch(`__pycache__/ *.pyc node_modules/ *.log *.tmp`)、大体量中间产物
   (`frames/ *.mp4 *.webm`——交付 GIF 在 mars 仓 `snaps/anim`,不在此)、以及
   `data/`(按 MOLA 瓦片先例,凭单次会话许可下载的数据永不入仓——本册目前无此类
   文件,规则先立)。凭据扫描(password/api_key/token/secret)零命中;无商业工程文件。
2. **`core.autocrlf false`(本地配置)+ `.gitattributes` `* -text`**:已设,读回
   `autocrlf(local)=false`。git 身份取本地配置(同 mars 仓:landy),全局未设。
3. **首提交前静态检查**:validate_unit 全 PASS(15996 面,size_m 74.75 一致;在 mars
   仓根运行,因需 node_modules/three);8 个 JSON 全部可解析;`node --check` 四个脚本
   ok;`py_compile` ok(**未执行** design_accounts.py——执行会重写 json,不在首提交前动);
   冻结戳完好(r1 03:21:47.616Z / r3.1 03:56:54.743Z)。**未运行** path_table.mjs——
   它会覆写 r3.1 文件的戳,违反一名一戳。

## 锚从提交对象读回(非工作区、非本文)

按「引用方从提交取 hash,不从提交前的通告取」,以下值由 `git show 37a6779:<file>` 读出:

- `berths_paths_v5r3_1.json`:version **v5-paths-r3.1**,rerun **2026-09-02T03:56:54.743Z**
- `berths_paths.json`:version v5-paths-r1,rerun 2026-09-02T03:21:47.616Z
- `hab-village-01.info.json` berm 卡 `specs.深度模型` = 「2 m 外推无支撑(FLATTENING 判词
  证伪指数形式;仅地表锚 234 存活)」;`specs.厚度依据` 以「屏蔽已移出本清单」起头
- `viewer/units/hab-village-01.js` 与 `hab-village-01.info.json`:**与 mars 仓副本字节一致**
  (`cmp` 零差)——mars 仓里的那两份现在有了册侧的提交锚

## 之后

本册数字自此锚到本仓提交,不再只锚到 mars 仓对我卡的副本。退役约定台账我那行
「no hash pretended」的前提解除——按 DISPATCH,该行由总控录入 `37a6779`,我不代填。
版本纪律不变:r3.1 定版文件不覆写,重算写新名;每次册内改动先提交再引用。
