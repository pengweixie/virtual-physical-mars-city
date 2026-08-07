# HANDOFF — sci-ir-01 热红外成像站(8–14 µm)

**交付 session**:mars-thermal(2026-08-07)· 设计册真源 `mars-ir`(五本账 sim/01–05 + out/*.json,已本地 git 提交,未推远端)

## 交付物

| 文件 | 说明 |
|---|---|
| `viewer/units/sci-ir-01.js` | 模块,5.0k 面,validate PASS(3 WARN 均有意,见下) |
| `viewer/units/sci-ir-01.info.json` | 7 卡双语,sim 全部引 mars-ir/out/*.json |
| `models/manifest.json` | 已登记,`pos: null` 待总控落位 |
| `snaps/anim/sci-ir-01.gif` | 10 s / 960 px / 0.39 MB,60 s 整循环首尾闭合 |
| `dev/dev-preview-sci-ir-01.html` | 预览页(`?unit=sci-ir-01`,引用 `../viewer/units/`) |
| CHECKLIST / STATUS | 各自加行(只动自己的行) |

## 落位建议(pos:null,报总控)

- **候选 A(推荐)**:`(318, -262) rot -135`,环境预警组团——已实际烟测 + audit clean
  (距 sci-rad-01 14 m、sci-weather-01 42 m)。叙事:气象站报尘、辐射站报粒子、
  热像仪报漏热,"尘-粒子-热"三联预警。
- **候选 B**:任一俯瞰全城的更高点(IFOV 0.857 mrad,400 m 处 34 cm/像元,
  高点覆盖更广)。塔基足印 ~5.2×6.4 m(含车辙散石),`sink_m 0.25` 已设。

## 引擎注意事项

1. **传感器通道**:声明 `sensors:[{id:'ir', 64×64, hz:2}]`——§4c 第三个用户。
   城内实测引擎回填 20 帧/10 s,伪彩热屏工作;引擎无通道时模块自动退回
   程序化热场(已在预览页验证降级路径)。
2. **validate 3 WARN 均有意**:
   - 屏幕 2 网格用 MeshBasicMaterial(顶点色自发光屏;Standard 的 emissive
     不与 vertexColors 相乘,夜里会黑屏);
   - `minY = -0.60`:设备柜/操作台入地裙边(斜坡防悬空,hab-village 同法),
     `sink_m` 照常用;
   - `size_m = 7.36` 为实测值(含入地裙边),manifest 已同步。
3. **未提交 git**:mars 工作树里有其他 session 的未提交文件(sci-radio/seis/
   thz/uv 等),为避免裹挟他人工作,本 session 未在 mars 做 commit——文件已就位,
   提交时机由总控定。设计册 mars-ir 已独立本地提交。
4. **坑账**:8462 截图上传服务存在旧 session 残留实例(双进程同端口),POST 会被
   旧实例抢答、文件落 `mars-radio\shots\`——用完请 kill,或按落盘目录找片。

## 验收数字(实测)

- validate:4948→5.0k 面(终版),exports/无 import/确定性全过
- 全循环包络扫描(61 s × 0.25 s 步):maxY 6.80 / minY 0(塔体),极限位无干涉
- 城内:scale === 1、oscillator 引擎驱动实测 az=1.05 rad 极值、console 除
  info.json 未建时的 404(现已建)外零报错
- 设计闭环:NETD 47.3 mK < 60 目标 @f/1 300 K;τ 7.7 ms < 12;FD 交叉验证 +9.9%
- **器件轮补账(08-07,mars-ir 账 07/08/09)**:
  - 吸收腔 TMM:λ/4 谐振腔带平均 η = 0.868(正入射)/ 0.883(f/1 锥内)。
    **01 账假设的 η=0.80 是下界不是估值** → NETD 47.3 mK 是保守值,实际 42–47 mK。
    头条数字**不下调**,光学买到的裕度留着不花。
  - VOx 负 TCR 电热耦合(此前完全漏掉):恒压偏置下读出脉冲超热失控判据 44×,
    靠 0.195% 占空压住;自热 16.3 → 20.4 K(正反馈)。**新硬约束**:发散时间
    173 µs 对 65 µs 行时只有 2.7× 裕度 —— 锁定 512 行 @30 Hz、V_b ≤ 2 V,
    行数翻倍会把像元推进失控。副产偏置源稳定度指标 < 147 ppm。
  - Sentaurus TCAD 无头 TMM 交叉验证:R(λ) 25 点与解析 TMM 一致到 **0.001%**,PASS。
- **COMSOL 3D 热 FEM 交叉验证(08-07 补账,mars-ir sim/pixel_fem.java)**:稳态
  G_fem=1.030e-8 W/K(−1.0% 对解析);瞬态 63.2% 上升 τ=9.45 ms——集总 7.67 →
  1D FD 8.43 → 3D FEM 9.45 ms 单调链(分布腿热容+多模响应),30 Hz 判据 τ<12 ms
  仍闭合(裕度 36%→21%);fpa 知识卡 sim 已回填此账
