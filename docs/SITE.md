# SITE.md — 火星城网站子页面契约

主页 `docs/index.html` 与本规则由总控维护。每个分区(district)一个子页面,由各设计
session 认领制作。**凡与本文件冲突的做法,以本文件为准;想改规则先找总控。**

## 0. 一句话定位

这不是文档站,是**作品集**——每页讲一个分区的工程故事:它是什么、机理怎么走、
每个数字出自哪次仿真、中间摔过什么坑。口吻对齐 Luna 项目主页:克制、数字密集、
诚实(踩坑章节是读者最爱看的)。

## 1. 文件与命名

- 每个分区一个文件:`docs/<slug>.html`。slug 已在 index.html 的分区卡片里定死:
  `power / rockets / science / comms / detectors / resources / compute / quantum /
  fab / undercity / perception / origin`——不许改名、不许加别的顶层 html。
- 图片放 `docs/assets/<slug>/`,只用相对路径引用。共享图(`assets/hero.png` 等)只读。
- 从 `docs/_template.html` 复制起步。模板顶部标注 `▸ REPLACE` 的都要换掉。

## 2. 设计系统(硬约束)

- **模板 `<style>` 里「shared tokens」段一个字都不许改**;页面专属样式追加在
  标注行之下。整站观感一致性靠这个。
- 每页设 `--accent` 为自己分区的强调色,**必须与 index.html 里自己卡片的
  `--accent` 一致**(amber/red/cyan/green/violet/rust)。
- 系统字体栈,**不引外部字体、不引任何 CDN/外链资源**——页面离线打开必须完整。
- 深浅双主题已由 tokens + 右下角按钮实现,不要另写主题逻辑。
- 移动端自查:375px 宽不出横向滚动条(表格允许在 .tablewrap 内滚)。

## 3. 内容规则

- **全英文**(GitHub 面向内容规则)。中文只允许出现在图片内已有的内容里。
- 章节结构:编号 band ×3–6,建议弧线:
  `01 What it is → 02 How it works → 03 The ledger → 04 What broke → 05 Try it`。
- **The ledger 是必选章节**:一张表,把页面上每个标题数字对到产生它的
  脚本/求解/蒙卡(`Produced by` 列用 mono 字体写脚本名或工程名)。
  没有台账锚点的数字不许上页面。
- **What broke 强烈建议保留**:真实的 bug、被否掉的方案、返工轮数——写具体。
- 图:优先用真渲染/真仿真图(`mars/snaps/`、各项目 `out/` 里现成的很多)。
  单图 ≤400 KB(大图先压缩/裁切),整页资产合计 ≤6 MB。加 `loading="lazy"`。
- 尾注 Sources:设计台账与关键脚本的位置。**禁止本地绝对路径**(`E:\...` 一律不上页),
  写项目名相对形式(如 `quantum-computing/sim/11_….py`)。
- 命名红线:暗物质实验统一叫 "the dark-matter experiment"(不写内部实验名);
  MiniPAN 只描述几何与搭载,不引仿真源码。医疗内容只允许出现在 undercity 页
  的 clinic 小节,别的页面不放。

## 4. 导航与登记

- 顶栏保留:`MARS CITY`(回主页)/ All districts / Prev / Next / GitHub。
  Prev/Next 按 index.html 卡片顺序连成环(第一页的 Prev 指最后一页)。
- 页面完成后,**只改 index.html 里自己那张卡**:`data-status="planned"` → `"live"`。
  别的卡、别的章节一律不碰。

## 5. 验证与交付

1. 本地起服务自查(**8123 是主查看器的,用别的端口**),深浅两主题、375/768/1280
   三档宽度各截一张图留档。
2. 离线自查:断网(或直接 file:// 打开)页面完整——任何外链资源都是违规。
3. 交付 = git commit(英文信息,一页一提交)+ 给总控一段摘要:
   页面路径 / 台账表行数 / 图片来源清单 / 已知余留。
   GitHub 同步与 Pages 发布由总控统一做,别自己 push 远端。

## 6. 认领表(总控更新)

| slug | 分区 | 状态 | 认领 session |
|---|---|---|---|
| power | Power | ✅ | tokamak(主)× mars_pwr_storage(储能场三节补稿) |
| rockets | Rockets | ✅ | veh-rocket-01 session × mars_rocket2(合稿:舰/箭各半区) |
| science | Science | ✅ | mars_observatory × mars_lidar × spad40(器件供稿) |
| comms | Comms | ✅ | mars-com-relay × mars-com-station(地面站补稿) |
| detectors | Deep Physics | ✅ | mars_deep_lab(主) × cosmic_microwave+TES(合稿:05节TES station/台账10行/坑账4条,凭§7器件供稿包) |
| resources | Resources | ✅ | mars_soil |
| compute | Compute & Silicon | ✅ | mars-bigram |
| quantum | Quantum | ✅ | quantum-computing |
| fab | Chip Fab | ✅ | fab session(含光刻成像/注入/Dolan 设计轮四锚点) |
| undercity | Undercity | ✅ | mars_hab_tunnel × mars-bot × mars_medical(clinic 小节) |
| perception | Perception & Robots | ✅ | mars_soil |
| origin | The Origin | ✅ | 总控(idea_worldAB 素材原作者) |
| spectrum | The Spectrum Net | ⬜ 待认领 | 建议 mars-thermal / mars-uv / mars-thz / mars-swir / mars-radio / mars-seis 六册合稿,一家主笔其余按 §7 供稿 |
| gravity | Gravitational Waves | ⬜ 待认领 | 建议 gravity-wave session(设计册真源在其手上) |
| environment | Environment Watch | ⬜ 待认领 | 建议 mars-weather × mars_rad 合稿 |
| flight | Flight Ops | ⬜ 待认领 | 建议 mars-heli session |
| town | The Town | ✅ | 总控(村落数字取自 mars-village 五本账;场站/温室排/管廊为总控自建资产) |
| grid | The Grid | ✅ | mars-grid session |
| works | The Works | ⬜ 待认领 | 重工业与大科学装置合稿(sci-fel-01 / sci-cryoem-01 / res-sulfur-01 / res-eclss-01+recycle / 发射园区 VAB+载荷楼+履带车)。建议 mars-fel 主笔(账最厚),其余按 §7 供稿 |

## 7. 器件级素材供稿(器件/芯片 session 侧)

页面涉及器件级内容(TES 像素、SPAD、μMUX 读出芯片、PCB、GDS 版图、滤波器
S 参数等)时,**素材由对应器件 session 按本节整理供稿,页面组装归认领 session**。
供稿是素材包不是页面——别自己写 html。

**供稿包(放 `docs/assets/<slug>/` 同目录):**

1. **图** `dev-*.jpg/png`,单张 ≤400 KB:优先真实设计产物(版图预览、S 参数/
   IV/温度场曲线、结构剖面、FEM 收敛图)。图内文字英文(既有中文截图可保留,
   但新导出的一律英文轴标)。
2. **数字+锚点清单** `dev-notes.md`:上页的每个数字一行,格式
   `数字 | 一句话说明 | Produced by(脚本/工程名,项目名相对路径)`。
   口径与自己项目 STATUS.md 工具账本一致(落库产物);**没有锚点的数字不给**。
3. **What broke 素材** 2–4 条:真实返工/负结果,一条一句带轮数
   (如"BPF166 首版综合选出 0.55 μm 线宽,带内 −2.9 dB 台阶,重综合约束线宽
   ≥1.0 μm 后消除")。这类内容最有读者缘,别藏。

**红线(在 §3 基础上追加):**

- 禁止本地绝对路径(`E:\...`)、禁止上传原始工程文件(.aedt/.mph/.gds 不进 docs)。
- 商用 PDK 的具体规则数值不上页,写 "per PDK design rules";
  工艺敏感参数(靶材配方、具体膜厚容差账)同理模糊化。
- 器件性能数字与任务级数字冲突时,以**双方 session 联合冻结的接口文件**为准
  (如 REPLY/FEEDBACK 信箱里的定案值),别各写各的。

**交接:** 供稿完成后在自己项目的跨 session 信箱(REPLY/FEEDBACK 文件)留一行
"docs 素材已就位 + 清单路径",页面认领 session 凭 dev-notes.md 直接引用;
页面文字最终解释权归认领 session,数字锚点争议以器件 session 台账为准。
