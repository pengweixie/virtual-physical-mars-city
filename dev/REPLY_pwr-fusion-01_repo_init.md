# REPLY · pwr-fusion-01(E:\Claude\tokamak)建仓回执

答 `dev/DISPATCH_repo_init.md`。写成文件,不走消息。

| 项 | 值 |
|---|---|
| 仓库 | `E:\Claude\tokamak`(本地,无远端,不推送) |
| **首提交哈希** | **`b555457a7df960858d473a31332ff46e8fb574c9`** |
| 提交时间 | 2026-09-05 08:42:52 +0800 |
| 提交信息 | `first commit, 356 files, no remote` |
| 文件数 | 356(`git ls-files`) |
| 远端数 | 0 |
| 分支 | 默认(本地) |

## 派工三条的落实

1. **只本地**:`git init`,未配置任何远端。`.gitignore` 在首提交前写好:COMSOL 项目文件(`comsol/*.mph`、编译产物 `*.class` 及其 `.status/.recovery`)、HFSS 项目与结果(`hfss/*.aedt`、`hfss/*.aedt.lock`、`hfss/*.aedtresults/`)、Blender 备份 `*.blend1`、`__pycache__/`、会话合成目录与生成器测试产物。本仓库内无凭据文件、无按会话许可下载的数据文件(MOLA 类数据不在此仓)。暂存区经 grep 核过:商业项目/备份文件进入数 = 0。
2. **不做行尾转换**:`.gitattributes` 为 `* -text`;`git config core.autocrlf false`(本地配置)。理由同哨兵网发现:闸门按字节改写并哈希文件。
3. **提交前静态检查**:`python run_gates.py` —— 必需项 selftest_retired / meta_selftest / check_retired(237 份)/ selftest_gen_source_term / check_provenance(12/12)全部 PASS;check_vm_sync 报 UNKNOWN(构建机今日不可达;UNKNOWN ≠ PASS,报告项非必需)。

## 保留在仓内的大件(有意)

`neutronics/` 下各链段/切段/探针的面源记录与日志约 107 MB(`ss_*.txt`、`*.log`):它们是交付件每个数的输入与证据,`gen_source_term.py` 从中生成,目录清单哈希覆盖它们;本地仓库承受得了,故不忽略。`.git` 现 58 MB。

## 此后

本册的数自此锚在自己的提交上:引用者从提交取哈希,不从公告取。交付件 `neutronics/SOURCE_TERM_DELIVERY.md`、门控要求 `sysdesign/SAFETY_REQ_sep_gating.md`、约定声明 `sysdesign/RETIREMENT_CONVENTIONS_tokamak.md` 均在首提交内。

— pwr-fusion-01(tokamak),2026-09-05
