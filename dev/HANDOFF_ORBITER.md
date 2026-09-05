# HANDOFF_ORBITER — sci-orbiter-01(400 km 科学轨道器)交接

mars-orbiter session · 2026-08-26 · 设计册 `E:\Claude\mars-orbiter`
(v1–v3 共 14 落库:12 本 Python 账 + HFSS 偶极全波 + COMSOL 热 FEM 双工况)

## 1. 交付物清单

| 文件 | 说明 |
|---|---|
| `viewer/units/sci-orbiter-01.js` | 模块,1420 面,validate 全 PASS(2 WARN 见 §5) |
| `viewer/units/sci-orbiter-01.info.json` | 7 卡双语(平台/雷达/SWIR/掩星/Ka 链路/轨道裁决/电源热控) |
| `models/manifest.json` | 已登记 kind:"orbital" + pos:null(照 com-polar-01/com-l4-01 先例) |
| `dev/dev-preview-orbiter.html` + `dev/preview-orbiter.bat` | 预览(端口 8135;8123 保留未占) |
| `CHECKLIST.md` sci 区自己那行 · `STATUS.md` 工具账本 2 行 | 已填 |

## 2. 轨道视图接线(替换占位星,main.js 归总控)

现状:main.js ~2958 行 `loSpin` 块用 `buildSat(1.9)` 通用总线 + 0.65 rad 倾斜圈。
建议改动(照 com-relay-01 的接法):

```js
// import { build as buildSciOrbiter } from './units/sci-orbiter-01.js';
const lo = buildSciOrbiter(THREE);
lo.scale.setScalar(150);              // 放大倍数建议,理由见下
lo.position.set(LO_R, 0, 0);
lo.lookAt(0, 0, 0);                   // 模型 +Z = 天底(com-relay 同约定)
lo.rotateY(Math.PI);
registerMotion(lo, orbitAnims);       // SADA 翼 spinner ×2 + Ka gimbal osc ×2
// POI 接卡(如需近距卡,照 Jezero 主星做法 traverse poi_* 收锚点)
```

- **放大倍数 ×150**:本星最大特征是 10 m 偶极杆,×150 = 1500 视图单位,与中继星
  30 m×60=1800 同一表观量级(「距离真实、硬件放大」惯例)。若嫌偶极杆细,可再给
  杆径单独加粗,但整星倍数别超 ×200(会与静止环视觉抢位)。
- **轨道圈改画(裁决账,orbit 卡有完整理由)**:倾角 0.65 rad(37°)→ **92.91° 近极
  太阳同步**(`loTilt.rotation` 改为绕 Z/X 使圈面近极;微逆行)。高度 400 km 不变
  (LO_R = ORBIT_R + 400 保留)。周期真值 118.4 min,若视图带角速度可按 12.5 圈/sol。
- **标签文案更新**(T.orbLbl.lowOrbiter,两语言):
  - zh:`科学轨道器 · 400 km 太阳同步 · 穿冰雷达+SWIR 高光谱+无线电掩星`
  - en:`Science orbiter · 400 km SSO · ice radar + SWIR imager + radio occultation`
  - (旧文案「代传地面数据」正是本册立项要消灭的那句)

## 3. 问总控的裁决项

1. **轨道资产 pos 规则**:已照 com-polar/com-l4 先例登记 manifest(kind:orbital,
   pos:null,loadUnits 跳过)。CHECKLIST 行放在了 **sci 区**(ID 分区制)而非
   「通讯 com(轨道资产)」小节——如总控倾向所有轨道资产集中在那个小节,请代挪。
2. **动图**:轨道视图无 ?inspect 通道,GIF 需接线后在 M 键视图取景——接线完成后
   可回叫本 session 补拍,或总控用 capture_gif 自定机位直接拍。
3. validate 仅剩 1 WARN:minY=−5 是质心原点(com-relay 同款,轨道资产无地面
   约束,预期内)。size_axis 已按评审改为 'height'(10 m 偶极跨度在 Y 轴,
   原 'width' 会让 validator 误比 X 轴翼展 7.25)。

## 4. 跨资产回引建议文本(红线:不改他人资产,请总控代改)

**4.1 → res-rodwell-01.info.json(well2 卡 sim 数组追加一条)**
> zh:「下一井选址升级:sci-orbiter-01 穿冰雷达(15–35 MHz,冰内分辨率 4.2 m)
> 将把设备册『~30 m 冰层(Jezero 区域假定)』变成测量值——100 m 格网交付
> {冰顶埋深 d, 冰厚 h, 距城 s},硬闸 h≥30 m(TS-01 一火星年井寿所需)且 d≤10 m
> (套管作业深度),评分 h·exp(−d/10 m)/s;WELL-3 及独立 10 kWe 部署的第三井位
> 从此按图选址,不再按假定。注意:浅于 4 m 的冰顶按『≤4 m 上限』交付(现井
> 3.4 m 套管情形处在雷达最小可测边缘)。」
> en: "Well-3 siting upgrade: the sci-orbiter-01 ice radar (15-35 MHz, 4.2 m
> in-ice resolution) turns the equipment ledger's '~30 m ice layer (assumed)'
> into a measurement — a 100 m grid of {ice-top depth d, thickness h, distance
> s}, hard gates h >= 30 m (TS-01 one-Mars-year well life) and d <= 10 m
> (casing reach), score h exp(-d/10 m)/s. Ice tops shallower than 4 m are
> delivered as '<= 4 m upper bound' (the current well's 3.4 m sits at the
> detection edge)."

**4.2 → res-glass-01.info.json(clear 卡 sim 数组追加一条)**
> zh:「原料层位从文献变成地图:透明线依赖的『三角洲边缘水成硅沉积』此前仅凭
> 轨道蛋白石探测记录背书;sci-orbiter-01 SWIR(1.0–2.6 µm,20 m 像元)按硅质
> 三联带深(1.41/1.91/2.21 µm)×(1−尘盖)出 200 m 找矿优先级格网,新选采层位
> 按格网圈定并给品位排序(目标 SiO₂ ~70%)。」
> en: "The feedstock horizon goes from citation to map: the clear line's
> 'hydrated silica at the delta margin' rested on literature orbital
> detections; sci-orbiter-01's SWIR (1.0-2.6 um, 20 m pixels) delivers a 200 m
> prospecting-priority grid from the silica band-depth triplet (1.41/1.91/2.21
> um) x (1 - dust cover), so the new selective-mining horizon is flagged and
> grade-ranked (~70% SiO2 target) off the grid."

**4.3 → sci-swir-01.info.json(camera 卡 sim 数组追加一条)**
> zh:「谱系上天:sci-orbiter-01 轨道版复用本站 5/9 模块(CTIA ROIC/混成/冷腔
> 机械/数采链/TCAD 暗流方法学),吸收层换延展 InGaAs 上探 2.6 µm——室温暗流罚
> ~4000× 被轨道推扫 6.7 ms 驻留的预算松弛(13500×)吃掉,本册 TCAD 拟合的减半
> 间隔定律(5.95 K@233 K)外推 182 K 工作点仍成立;地面找冰、轨道找矿,同一套
> 带深算法两处服役。」
> en: "The lineage flies: sci-orbiter-01's orbital imager reuses 5/9 modules
> of this station (CTIA ROIC, hybridization, cold-chamber mechanics, data
> chain, TCAD dark-current methodology), swapping the absorber for extended
> InGaAs to 2.6 um — the ~4000x room-temperature dark-current penalty is eaten
> by the 13,500x budget relaxation of a 6.7 ms pushbroom dwell, and this
> ledger's halving-interval law (5.95 K at 233 K) extrapolates cleanly to the
> 182 K operating point. Ice-finding on the ground, ore-finding from orbit,
> one band-depth algorithm serving both."

**4.4 → sci-thz-01.info.json(receiver 或 link 卡 sim 数组追加一条)**
> 【08-26 总控验收注记:本条按「只声明出品、不替接收方推演」规矩由总控改稿后派发,
> 平均核数字用 sci-thz-01 冻结值 0.43(**单次抽样;120 次系综 0.52±0.08 宁静、0.82±0.03 尘暴抬升——该层受先验主导的结论稳,0.43 非设计常数**,09-02 thz 自纠);sci-thz-01 已核定:20–60 km 有价值、不作 T(z) 主源。
> ro 卡接口段已同步改为产品声明式(含水平足印 ~300–550 km 声明)。下文为原稿存档。】
> zh:「独立验证源接入:sci-orbiter-01 无线电掩星每 sol 63 条 T/p 廓线(±30°
> 低纬 ~14 条,σ_T ~1 K@<40 km,覆盖 0–60 km)——与 com-polar-01 星间掩星
> 只够到 20–60 km 不同,本源直抵本站 95.8% 温度敏感度所在的 20 km 以下层段;
> 20–40 km『受约束上界』层段(平均核对角 0.43,单次抽样;系综 0.52±0.08)亦首次获得独立测量。」
> en: "Independent validation arrives: sci-orbiter-01 radio occultation
> delivers 63 T/p profiles per sol (~14 within +/-30 deg, sigma_T ~1 K below
> 40 km, spanning 0-60 km). Unlike the com-polar-01 crosslink occultation,
> which only reaches 20-60 km, this source reaches below 20 km where 95.8%
> of this station's temperature sensitivity lives; the 20-40 km 'constrained
> upper bound' layer (averaging-kernel diagonal 0.43, a single draw; ensemble 0.52+-0.08) also gets its first
> independent measurement."

> **注(总控 08-29)**:本条只声明轨道器**能提供什么**,不声明 sci-thz-01
> 能拿它当什么——原稿写的「以 1 K 级直接喂 OEM 先验替代 GCM」是替对方推演,
> 属 com-gap §8 教训所指的越界(推演归持有前向模型的一方);平均核数字亦已
> 从评审前的 0.47/53% 更新为冻结值 0.43/57%(09-02 补:0.43 为单次抽样,系综 0.52±0.08,见上)。派发时请 sci-thz-01 自行核实
> 该源能否作 T(z) 先验主源,并由其决定卡上写法。

> **注(总控 09-02)**:ro 卡「p₀ 锚定于 sci-weather-01」一支已改为「相对变化比对」
> (weather 自报 0.1 Pa 为分辨率非绝对准确度;总控裁定,orbiter e69e760)。
> weather 随后立账 #18 气压计绝对准确度(49110f8),判决**绝对锚不成立**:
> 出厂 U = 0.39 Pa(k=2)过预注册阈值 X = 1.0 Pa,但真空参考腔最佳档漏率 1.19 Pa/火星年
> + 封装零漂 0.45 → 标定后约 243 sol 越线;站上无一级基准、同型双膜盒同向漂移测不出,
> 时限内合格但不可复溯 = 不满足;足印高程归算(0.3/1/2 km → 16.4/53.0/101.4 Pa)是仪器
> 预算的 40–260×,瓶颈在几何。翻案条件:(a) 城内活塞式传递基准每 ≤243 sol 复标或异体制
> 第二表在位检漂;且 (b) 足印归算到共同位势面。(a) 是否建基准归用户。
> **账 #19(weather,cc59ba6,09-02 稍后)**:(a) 站侧**成立**——方案 A(城内 FPG 类力平衡活塞基准
> u = 0.030 Pa k=1 + 便携石英谐振表异体制传递)传递链 U = 0.11 Pa(k=2),复标周期 100 sol,站上绝对
> 准确度复标后 0.27、周期末 0.47 Pa(k=2),过预注册 X = 1.0 Pa;前提:基准处用绝对重力仪实测局地 g
> 一次(全球 ±0.7% ⇒ 4.3 Pa 系统差)。(b) 足印侧**不成立**:足印 16.4/53.0/101.4 Pa 为站侧的
> 35/114/217×,轨道器自身 6.4 Pa 亦远大于站侧 ⇒ **绝对锚整体仍不成立,翻案只剩 (b)**;主口径
> 「相对变化比对」不动。建不建基准归用户(成本估计在 weather 册 JSON,不上卡)。

> **注(总控 09-02,撤销一句)**:上文 4.4 原稿 zh/en 里「20–40 km『受约束上界』层段
> (平均核对角 0.43)亦首次获得独立测量」这句是**串量**——0.43 是 sci-thz-01 的**水汽**
> 平均核,掩星给的是**温度**,T 在其前向模型里是固定输入,弱的水汽核不构成温度约束的入口;
> thz 于 09-02 自查后撤销了这个因果。原句保留为历史,不再作为接口依据;
> sci-orbiter-01 ro 卡同句由其自改(删因果、留事实)。
> **更正(总控 09-02,同日稍后)**:上一段初版把 com-polar-01 星间掩星的「改登记 0–20 km、
> 待代表性关」也写到了本产品头上——那是 com-polar-01 的登记变更,与 sci-orbiter-01 无关;
> **本产品的交叉验证角色由 sci-thz-01 按本产品的 σ_T 另判,待其判定**。thz 另问本产品:
> 「水平足印 ~300–550 km」是全宽、半宽还是等效 σ(三者差 2–3 倍,直接落在其代表性数上),
> 已转 orbiter 声明。**已答(orbiter 卡,09-02)**:沿射线权重 ≈ exp(−x²/2aH),σ = √(aH) = 194 km;
> 分位半宽 50/80/95% = ±131/±249/±381 km(与 com-gap 分位制同口径);1/e 全宽 549 km(含 84.3%
> 权重)= weather 复现的 546 km;旧「~300–550 km」作废。本文 4.4 段里的「~300–550 km」按此读。
> **连带更正(thz,09-02)**:thz 原按「沿轨跨度均值 425 km」算的代表性误差 4.1–7.3 K 偏大 2.2×
> (高斯加权的均方根位移就是 σ = 194 km),更正为 **1.9–3.3 K**;足印/σ_T 由 3.7–6.6× 改 **1.7–3.0×**;
> 尘暴合并柱项增益改 5–12%;「σ 花不到最想花的地方」句收回(1.7× 下是削弱不是浪费)。
> 四个采纳角色与 95.8%/4.2% 劈分不动。教训:没有声明口径的几何量要问,不要猜。
> thz 按本产品自报 σ = 194 km 的代表性表已落其卡(717d2e9):静稳 1.85 K、晨昏 3.31 K,对本产品
> σ_T 1.1 K 为 1.7×;与 com-polar-01 那张(σ 197→184 km)分开印,不合表。地形项仍按跨度缩放、
> 未沿任一方真实地面轨迹量过(待派项:DEM 沿轨遍历,归用户)。
> **再更正(thz,09-02 稍后,册 4731e87)**:地形项改用 com-gap 对城内原始 14.4×6.7 km HiRISE DTM
> 的实测(1.5 km 跨度起伏 11 窗口中位 36.89 m、指数 0.643;s20 的 21.99 m 是落区裁切的低侧离群值)
> 上推到 σ = 194 km 得 841 m,对 thz 原 685 m 为 1.23×;因幂律须外推 1.5 个数量级,改发区间:
> 本产品代表性 **静稳 2.22 K(1.44–4.15 K)、晨昏 3.53 K,对 σ_T 1.1 K 为 2.0×**;上文 1.85 K / 1.7×
> 与更早的 1.9–3.3 K / 1.7–3.0× 均作废。引方口径:按中位立预算并引区间。在 MOLA 沿轨真数
> (待 com-gap 用户许可下载)之前,这个区间就是答案,不是占位符。一处误归:总控曾转述
> 「thz 用 21.99 m 替换了缩放假设」——thz 册无此数,它用的是 1.5 km 起伏/425 km 跨度线性缩放;
> 「1.5 km 起伏」与「1.5 km 跨度」同串数字不同量,「低 3 倍」不成立。
> **三度更正(thz,09-03,册 19f977c / 卡 bd6ab64 / CHECKLIST a56841b)**:上一条那个区间
> **2.22 K(1.44–4.15 K)已作废**——MOLA 沿轨真数到手后,thz 改取城址总量 1438 m、未改正,
> 得 **3.59 K**(按其册 2.5 K/km),本产品 3.3×、com-polar-01 4.6×,两台均触发它的 >2× 门限。
> 它的理由:用户在 Jezero 而非「普通地方」;「可改正」是该项的性质、不是交付状态(切点轨迹、
> DEM、递减率三样它都没有);坡只在足印中心压住城址时才抵消,而 d>81 km 即超过整个粗糙度项。
> 口径 = 总量/城址/未改正/以米为准量;米折 K 两册不同(com-gap 1.4 K/km、thz 2.5 K/km,同样的米
> 差 1.79×,**两个都不是测的**),并列发布 552 m(1.38 K)作地板。
> **注(总控 09-03):此裁定作出时 com-gap 尚未答复。** 它随后给出(`dev/REPLY_comgap_terrain_
> questions.md`,提交 744054a):整个 136.6 火星日拍频周期内,切点离城址最近 2248 km、800 km
> 内零次过境,**城址地形是掩星不采样的地面**;其「6 个切点聚成一簇」实为同一次过境的采样。
> 按 thz 自己写下的判据(d>81 km 即超过整个粗糙度项),d=2248 km 远在其外——该判据在本裁定
> 里未被考虑到这个量级。重裁派工已发:`dev/DISPATCH_thz_reruling_terrain.md`(提交 76d3bde)。
> 取哪一行仍归 thz,com-gap 不代选,本册也不代选。**在重裁落地前,3.59 K 与 2.22 K 均不得引用。**

**4.5 → sci-weather-01.info.json(ats 卡 sim 数组追加一条)**
> zh:「桅杆之上有人接班:ATS 到 1.75 m 为止的温度剖面,由 sci-orbiter-01 掩星
> 补齐 0–60 km(63 条/sol,~1 K);反向地,本站气压计的 p₀ 锚定掩星反演的底
> 边界——双向咬合。」
> en: "Someone takes over above the mast: the ATS profile ends at 1.75 m, and
> sci-orbiter-01 occultation fills 0-60 km (63/sol, ~1 K); in return this
> station's barometer p0 anchors the retrieval's lower boundary — the
> interlock runs both ways."

## 4.9 双代理独立评审记录(交付前,照 com-relay 先例)

- **代码/契约代理**(node 实跑):无致命项。几何自洽全过(6 硬件 POI 距最近 mesh
  ≤0.09 m、偶极实测恰 ±5.000 m、spinners/oscillators 节点均为真子孙、41 mesh 全
  在包络、1420 面),集成边界干净(main.js 未动、git status 恰好只列允许的 8 个
  路径),manifest 与 com-polar 先例逐字段同形,info.json 7 卡与 poi_ 锚点精确互配。
  **抓到并已修 3 处**:①我的插行脚本把 CHECKLIST/STATUS 整文件 CRLF→LF 重写
  (io.open 通用换行翻译,已恢复 CRLF,diff 收敛到真实 +7/−1)②size_axis 'width'
  →'height'(消 validator 误报)③翼尖注释 ±3.0→±3.6 m。
  **报总控知情**:工作区另有并行 session 的未提交改动(sci-radio-01 行内 Fable R2
  复审记录、com-polar/com-l4 两行、com-gap 工具账行)——非本 session 所写,提交时
  会一并入库。
- **物理/声明代理**(自写 numpy 逐位重演,含独立掩星传播器):承重数字全部复现
  (SSO 92.914°/雷达链逐项/HFSS 曲线逐点/SWIR SNR 279/177/134/掩星独立数出
  62–65 条/链路 C/N₀ 105.85/电池 609 Wh),无致命项。**抓到并已修 6 处**:
  ①SWIR 卡信号电子数区间写错(4.6万→7.9万,SNR 本身没错)②太阳翼「恰好闭合」
  是按需反解的构造等式,且印出的乘法差 4 W——改为诚实表述 ③「20×20 km 一次
  侧摆全覆盖」超幅宽,改两次过境 ④「每 sol 西移 1620 km」标签错,实为相邻轨道
  间距(sol 间半间距交错 810 km)⑤功率行「峰值×占空」标签与均值对不上,改均值
  记账口径 ⑥推进剂按未含裕度干重定容(唯一不带裕度的行),改按 204 kg 定容
  → 6.3 kg,湿重 209→210。另 5 处简化级口径收紧(35 yr 标量级、125k 循环标上限、
  沿轨分辨率标未聚焦上限、90 sol 标估算、载荷占比 20%→19%)。中英孪生无分叉。

## 4.95 v2 深挖轮(08-26 二续,补 4 本账,共 10 本)

对照任务书自查后补齐的四块浅层——其中第一条是任务书点名而首轮漏掉的:

1. **SWIR 辐射环境**(`sim/radiation.py`):行星遮挡 0.72 × com-relay Geant4 阶梯
   → TID 5.1 krad@4 mm/15 yr,耐辐射级足够;位移损伤增暗流经 GR 减半定律降到
   182 K 只占预算 0.01%——毫秒驻留的红利把 15 年质子一并吸收;大 SPE 停成像,
   雷达/掩星不受影响。
2. **雷达匹配网络**(`sim/matching.py`):对 HFSS 实测 Z(f) 优化出串 L 5.3 µH +
   并 C 6 pF + 29:1 变换器,带内均值失配 1.23 dB(双程 2.5 dB,被增益红利盖住);
   Bode-Fano 界证明差距是拓扑简单性不是物理。
3. **电离层与杂波定量**(`sim/ionosphere.py`):日侧色散 97× 压缩脉冲(不校正
   ~730 m)、夜侧 19% 免费——夜测优先有了数;**新列一笔债**:崎岖三角洲的 30 m
   级探测需 MOLA 级地形杂波仿真背书,本册未做。
4. **掩星误差预算推导**(`sim/ro_budget.py`):仪器项 0.02–0.6 K(USO 限)+
   球对称项 ~1 K 静稳/~4 K 尘暴;卡片精度声明更新为 1.1 K@<40 km 静稳;
   两轮自我修正入册(折射率常数形式错被 N₀ 闸抓住;纯硬件预算比 GNSS-RO 已知值
   干净三个量级,暴露真地板)。Ka 单频电离层免疫是意外红利。

## 4.97 v3 还债轮(08-26 三续,补 3 本 Python + 1 COMSOL,共 14 落库)

v2 列的三笔债全部还清,闭环闸门连抓四错:

1. **杂波面元仿真**(`sim/clutter.py`):30 m 冰界面 −17.1 dB 对地表;**平原余量
   +5.8 dB 边缘可测**(多次过境叠栈补足)、**三角洲崖壁 −4.4 dB 杂波掩埋**(需 DEM
   杂波扣除或交叉轨)。对罗德威尔是好消息:井打平原,平原恰是可测区。DEM 为合成
   (Jezero 台地量级),真 MOLA 数据到位脚本原样重跑。闸门抓错 ×2:平坦镜面闸毙掉
   外给 ψ₀ 的首版;6.5 km 旁距闸抓出 v2 的 2d/n vs 2dn 几何错(3.7→6.5 km,良性)。
2. **COMSOL 热 FEM**(`sim/orbiter_thermal.java`,双工况):总舱板均温 278.6 K 对
   解析 280 ✓、能量闭合 0.2% ✓,**但热点 324.7 K(61 K 梯度)——TWTA 基板下要嵌
   热管/加厚扩散板**,这是解析等温假设看不见的结论;SWIR 冷板 152.4 K,低于 182 K
   需求 30 K 裕量,被动方案 FEM 坐实。能量闭合闸先毙掉两次坏解(手工 sol 序列
   T=NaN;Box 'inside' 静默选空,186 W 没进模型)。
3. **ADCS 指向账**(`sim/adcs.py`):全面宽裕(GG 1.1 µNm@1°、轮存 13 mNms、卸载
   0.38 vs 2 m/s/yr、SWIR 拖影 2.5×、杆模态与带宽隔两个十倍程——对比 com-relay
   30 m 翼压带宽,本星挠性天生温和)。**其交叉闸抓出跨账本陈值**:阻力 ΔV 按
   600 kg 假想星弹道系数算,实建 210 kg——orbit→mass→adcs 全链闭环重跑:
   阻力 0.39→**0.73 m/s/yr**、无维护寿命 35→**~18 yr**、ΔV 66→**71 m/s**、
   推进剂 **6.8 kg**、湿重 **211 kg**。裁决不变(维持仍近零成本),数字全链一致。

剩余债(仅一笔半):真 MOLA/HRSC DEM 的三角洲杂波重跑(声明:三角洲区 30 m 探测
在此之前不宣布);星蚀瞬态热(稳态已 FEM 签核,瞬态只影响加热器占空定容,解析界已记)。

## 5. 验证记录与坑账

- validate_unit.mjs 全 PASS(1420 面);2 WARN 属轨道资产预期(§3.3)。
- 预览目检 4 机位 + 夜景(shots/ 在设计册):偶极杆/双翼/SWIR 筒/Ka 金网碟可辨。
- 预览模板有地面平面,轨道资产下半身(−Y 杆)会被埋——目检时 `__unit.position.y=6`
  抬起再环视(本册照此做,建议进 mars-unit-flow 坑账)。
- 上传服务坑复现(与 sci-ir/thz/swir 同源第 4 次):单线程 HTTPServer 被一次误发的
  GET 挂死(无 do_GET,连接不关);另 Git Bash 里 PowerShell `$_` 被吞成乱码——
  进程清理一律走 PowerShell 工具本体,起服务用 Start-Process。
- HFSS:pyaedt 1.0 `insert_infinite_sphere` 参数是 theta_*/phi_*;`SolutionData.
  data_real` 已删,取数走 create_report + export_report_to_csv(skill 已记,仍踩了半脚)。

## 6. 设计册摘要(细节见 E:\Claude\mars-orbiter\README.md 与 7 张卡)

三载荷:雷达 15–35 MHz(冰内 4.2 m 分辨率/1.8 km 穿透,HFSS 全波背书);SWIR
1.0–2.6 µm(20 m 像元,延展 InGaAs 182 K 被动,复用 sci-swir-01 55%);掩星
63 廓线/sol(零新硬件,USO 2 kg)。平台湿重 211 kg / 均功 190 W。轨道裁决:400 km 留,
倾角改 92.91° SSO。链路裁决:Ka 0.5 m(UHF 17 kbps 判死)。闸门:地球 SSO
97.03°、ISS 寿命 1.42 yr、SHARAD/MARSIS/CRISM/TCAD 减半间隔全部复现后才出数。
