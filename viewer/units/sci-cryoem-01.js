// sci-cryoem-01 —— 地下城冷冻电镜实验室（300 kV 单颗粒，城市的分子之眼）
// 契约（室内场景 MODELS.md §4b）：米制 1u=1m；原点 = 洞室地面中心；入口朝 +Z；
//   自带地面/岩壁/顶围合；室内灯常亮不接火星时；面数预算 ≤2.5 万。
//
// 设计真源：E:\Claude\mars-cryoem（7 本解析账，37 个已知答案闸全绿）
//   账1 剂量墙   50 e⁻/Å² / 64 MGy —— 一张快照的剂量预算换一个结构
//   账2 分辨率链 λ=1.9687 pm → Scherzer 2.50 Å → 信息极限 1.51 Å → 常规 2.5 Å
//   账3 振动+恒温 城市线 1.2e-6 m/s/√Hz 需 3 级隔振；30 m 岩层 6.8 µK/h（比地表好 1.5 万倍）
//   账4 氮经济   27.3 kg/sol = 全城缓冲气逸散的 56%；113 sol 抽干全城氮储备 → 全量回收
//   账5 探测器   计数模式带内 DQE 0.72 vs 积分 0.37 = 剂量白拿 1.92 倍；自产硬缺口 3 道
//   账6 算力     7366 电影/sol、5.2 TB/sol、226 GPU-h/结构；机房 8.1 kW > 镜筒 7.5 kW
//   账7 样品流   乙烷 1.55e5 K/s vs 液氮 2.5e3 K/s；高氯酸盐 35 wt% 时衬度精确归零
//   账15 保存极限 岩石内禀 U/Th/K 在 3.5 Gyr 交付 9.56 MGy，把 300 kDa 复合物打断 991 次
//         → **建站叙事修正**：主力样品不是 35 亿年前的化石分子（辐射寿命仅 ~6 Myr），
//           而是本城自己的生物系统（115 人微生物组/根际/堆肥菌群）+ 现存生物 + 矿物纳米结构
//
// 几何原则（科学城：核心不做黑盒）：
//   镜筒**整根前向剖切**（保留 -Z 半壳，+Z 面全开），电子枪→聚光镜→样品台→
//   物镜→能量过滤器→探测器逐级色标，电子束是一根可见的发光轴线，
//   在聚光镜与物镜处各收一次腰（交叉点）—— 光路因果一眼读懂。
//
// 动画：纯 t 分段时间线 T=96 s，无 Math.random、不累积状态，任意 t 跳入成立、首尾闭合。
//   取盒 → 送样 → 台位稳定（屏上漂移曲线指数收敛）→ 采集（束亮、探测器灯、
//   显微图逐颗浮现、FFT Thon 环由模糊到清晰）→ 束闭、退样、复位。
export const meta = {
  id: 'sci-cryoem-01',
  name: '冷冻电镜实验室（300 kV 单颗粒）',
  name_en: 'Cryo-EM Laboratory (300 kV single-particle)',
  kind: 'interior',
  size_m: 22,          // 洞室跨度；交付前以 validate_unit 实测值回填
};

export function build(THREE) {
  const group = new THREE.Group();

  /* ==========================================================
   * 0. 材质
   * ========================================================== */
  const M = {
    rock:   new THREE.MeshStandardMaterial({ color: 0x5a4438, roughness: 0.96 }),
    rockD:  new THREE.MeshStandardMaterial({ color: 0x463328, roughness: 0.97 }),
    liner:  new THREE.MeshStandardMaterial({ color: 0xb9bcbe, roughness: 0.88 }),
    floor:  new THREE.MeshStandardMaterial({ color: 0x8d949b, roughness: 0.42, metalness: 0.12 }),
    floorD: new THREE.MeshStandardMaterial({ color: 0x6a7178, roughness: 0.46, metalness: 0.12 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0xa6aeb4, roughness: 0.40, metalness: 0.34 }),
    frame:  new THREE.MeshStandardMaterial({ color: 0x3f4750, roughness: 0.48, metalness: 0.32 }),
    tool:   new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.32, metalness: 0.22 }),
    toolB:  new THREE.MeshStandardMaterial({ color: 0x6e7885, roughness: 0.38, metalness: 0.28 }),
    panel:  new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.28, metalness: 0.3 }),
    granite: new THREE.MeshStandardMaterial({ color: 0x3c3f45, roughness: 0.62, metalness: 0.2 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x23262a, roughness: 0.85 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xbe7442, roughness: 0.36, metalness: 0.52 }),
    brass:  new THREE.MeshStandardMaterial({ color: 0xc6a04c, roughness: 0.36, metalness: 0.50 }),
    cryo:   new THREE.MeshStandardMaterial({ color: 0xd7dde2, roughness: 0.30, metalness: 0.28 }),
    hazY:   new THREE.MeshStandardMaterial({ color: 0xc7a03c, roughness: 0.7 }),
    hazK:   new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
    glass:  new THREE.MeshStandardMaterial({ color: 0x9fc8d8, roughness: 0.07, metalness: 0.1,
      transparent: true, opacity: 0.20, side: THREE.DoubleSide }),
    hose:   new THREE.MeshStandardMaterial({ color: 0x5b656f, roughness: 0.46, metalness: 0.25 }),
    cable:  new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 0.5, metalness: 0.3 }),
    // 镜筒逐级色标（剖切后可见的内构件）；外半壳统一 shell
    // 剖切半壳：DoubleSide 的内表面法线朝外会发黑，用低自发光托底（坑账第 4 条同源）
    shell:  new THREE.MeshStandardMaterial({ color: 0xc4cad0, roughness: 0.34, metalness: 0.42,
      side: THREE.DoubleSide, emissive: 0x39424b, emissiveIntensity: 0.85 }),
    cGun:   new THREE.MeshStandardMaterial({ color: 0x7fb6ff, roughness: 0.38, metalness: 0.30 }),
    cCond:  new THREE.MeshStandardMaterial({ color: 0x3fd3d8, roughness: 0.38, metalness: 0.30 }),
    cStage: new THREE.MeshStandardMaterial({ color: 0xe8bf47, roughness: 0.38, metalness: 0.32 }),
    cObj:   new THREE.MeshStandardMaterial({ color: 0xf08a3c, roughness: 0.38, metalness: 0.30 }),
    cProj:  new THREE.MeshStandardMaterial({ color: 0xe45fae, roughness: 0.38, metalness: 0.30 }),
    cFilt:  new THREE.MeshStandardMaterial({ color: 0xa274f0, roughness: 0.38, metalness: 0.30 }),
    cDet:   new THREE.MeshStandardMaterial({ color: 0x5fd97a, roughness: 0.38, metalness: 0.30 }),
  };
  // 发光/屏幕材质（室内常亮，进 nightMats 只为兼容引擎）
  const G = {
    lampW:  new THREE.MeshStandardMaterial({ color: 0x2a2c30, emissive: 0xeef4ff, emissiveIntensity: 2.0 }),
    lampC:  new THREE.MeshStandardMaterial({ color: 0x18242a, emissive: 0x9fd8e8, emissiveIntensity: 1.6 }),
    beam:   new THREE.MeshStandardMaterial({ color: 0x0a2030, emissive: 0x7fe0ff, emissiveIntensity: 2.4,
      transparent: true, opacity: 0.0, depthWrite: false }),
    filament: new THREE.MeshStandardMaterial({ color: 0x2a2410, emissive: 0xffd070, emissiveIntensity: 1.0 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x05080c, emissive: 0x0a1620, emissiveIntensity: 1.2 }),
    micro:  new THREE.MeshStandardMaterial({ color: 0x0a0f14, emissive: 0x243642, emissiveIntensity: 1.0 }),
    partic: new THREE.MeshStandardMaterial({ color: 0x0e1a20, emissive: 0x8fe8ff, emissiveIntensity: 0.0,
      transparent: true, opacity: 0.0 }),
    ring:   null,   // 逐环单独建（Thon 环要各自的强度）
    ledG:   new THREE.MeshStandardMaterial({ color: 0x0e2210, emissive: 0x4fe86a, emissiveIntensity: 2.0 }),
    ledA:   new THREE.MeshStandardMaterial({ color: 0x2a1c08, emissive: 0xffb050, emissiveIntensity: 1.6 }),
    ledR:   new THREE.MeshStandardMaterial({ color: 0x2a0c08, emissive: 0xff4a30, emissiveIntensity: 1.6 }),
    ledB:   new THREE.MeshStandardMaterial({ color: 0x0a1626, emissive: 0x5fa8ff, emissiveIntensity: 1.8 }),
    cryoGl: new THREE.MeshStandardMaterial({ color: 0x14202a, emissive: 0x7fd6ff, emissiveIntensity: 1.0 }),
    plasma: new THREE.MeshStandardMaterial({ color: 0x1a0a2a, emissive: 0xc06aff, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.55 }),
    sign:   new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 1.8 }),
    drift:  new THREE.MeshStandardMaterial({ color: 0x0e2218, emissive: 0x54e0a0, emissiveIntensity: 1.6 }),
    ln2:    new THREE.MeshStandardMaterial({ color: 0x9fd8ee, roughness: 0.1, metalness: 0.1,
      emissive: 0x2a6a88, emissiveIntensity: 0.6 }),
    amber:  new THREE.MeshStandardMaterial({ color: 0x6a4a10, roughness: 0.2,
      emissive: 0x8a5a10, emissiveIntensity: 0.5, transparent: true, opacity: 0.8 }),
    clear:  new THREE.MeshStandardMaterial({ color: 0x9fc8d8, roughness: 0.1,
      emissive: 0x2a5a6a, emissiveIntensity: 0.4, transparent: true, opacity: 0.6 }),
  };

  /* ==========================================================
   * 1. 工具
   * ========================================================== */
  const B = new THREE.BoxGeometry(1, 1, 1);
  const CY = new THREE.CylinderGeometry(1, 1, 1, 16);
  const CY8 = new THREE.CylinderGeometry(1, 1, 1, 10);
  function box(w, h, d, m, x, y, z, parent) {
    const o = new THREE.Mesh(B, m);
    o.scale.set(w, h, d); o.position.set(x, y, z);
    (parent || group).add(o); return o;
  }
  function cyl(r, h, m, x, y, z, parent, lo) {
    const o = new THREE.Mesh(lo ? CY8 : CY, m);
    o.scale.set(r, h, r); o.position.set(x, y, z);
    (parent || group).add(o); return o;
  }
  function tapered(rTop, rBot, h, m, x, y, z, parent) {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 16), m);
    o.position.set(x, y, z); (parent || group).add(o); return o;
  }
  // 剖切半壳：保留 -Z 半（θ 90°~270°），+Z 面全开 —— 观察侧看进内部
  function halfShell(r, h, m, x, y, z, parent) {
    const o = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 18, 1, true, Math.PI / 2, Math.PI), m);
    o.position.set(x, y, z); (parent || group).add(o); return o;
  }
  function poi(id, x, y, z, parent) {
    const a = new THREE.Object3D(); a.name = 'poi_' + id;
    a.position.set(x, y, z); (parent || group).add(a); return a;
  }
  const sstep = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  // 确定性伪随机（禁 Math.random）
  const rnd = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  // 洞室净半宽/半深 = 10.4 —— 与引擎的室内夹取半径 (size_m/2 − 0.6) 精确对齐，
  // 玩家被夹在净墙面之内，不会穿墙（updateInterior 只做方形夹取，不做几何碰撞）。
  const HX = 10.4, HZ = 10.4, CEIL = 8.0;

  /* ==========================================================
   * 2. 洞室壳体：地面 + 岩壁 + 拱顶（自带围合）
   * ========================================================== */
  box(2 * HX + 1.2, 0.06, 2 * HZ + 1.2, M.floor, 0, -0.03, 0);   // 地坪板（顶面 y=0）
  // 中央深色作业带（镜筒区）
  box(7.0, 0.02, 9.0, M.floorD, 0, 0.011, -0.4);
  // 地面走线槽盖板
  for (let i = 0; i < 5; i++) box(0.42, 0.03, 9.0, M.frame, -4.2 + i * 2.1, 0.016, 4.4);
  // 黄黑警示带（隔振基座外圈）
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    box(0.5, 0.02, 0.16, i % 2 ? M.hazY : M.hazK,
      Math.sin(a) * 3.55, 0.017, Math.cos(a) * 3.1).rotation.y = a;
  }

  // 岩壁四面（内衬白 0.6 厚，外表面恰在 ±11.0 → 实测包围盒 22.0 = meta.size_m）
  const wallH = 5.2;
  box(2 * HX + 1.2, wallH, 0.6, M.liner, 0, wallH / 2, -HZ - 0.3);      // -Z
  box(2 * HX + 1.2, wallH, 0.6, M.liner, 0, wallH / 2, HZ + 0.3);       // +Z
  box(0.6, wallH, 2 * HZ, M.liner, -HX - 0.3, wallH / 2, 0);            // -X
  box(0.6, wallH, 2 * HZ, M.liner, HX + 0.3, wallH / 2, 0);             // +X
  // 岩体（内衬之上的裸岩带，封闭洞室；全部收在 ±11.0 之内）
  box(2 * HX + 1.2, CEIL - wallH, 0.6, M.rockD, 0, (CEIL + wallH) / 2, -HZ - 0.3);
  box(2 * HX + 1.2, CEIL - wallH, 0.6, M.rockD, 0, (CEIL + wallH) / 2, HZ + 0.3);
  box(0.6, CEIL - wallH, 2 * HZ, M.rockD, -HX - 0.3, (CEIL + wallH) / 2, 0);
  box(0.6, CEIL - wallH, 2 * HZ, M.rockD, HX + 0.3, (CEIL + wallH) / 2, 0);
  // 折面拱顶（4 段，收在净跨之内）+ 顶板
  for (let i = 0; i < 4; i++) {
    const s = i < 2 ? -1 : 1, k = i % 2;
    const seg = box(HX * 0.62, 0.42, 2 * HZ + 1.0, M.rock,
      s * (HX * 0.52 - k * 0.9), wallH + 0.5 + k * 0.95, 0);
    seg.rotation.z = s * (0.30 + k * 0.26);
  }
  box(2 * HX + 1.2, 0.42, 2 * HZ + 1.0, M.rock, 0, CEIL - 0.21, 0);
  // 顶部服务立管与桥架
  for (const zz of [-6.4, 0.4, 6.4]) {
    box(2 * HX - 1.6, 0.16, 0.5, M.frame, 0, CEIL - 0.72, zz);
    for (let i = 0; i < 4; i++) cyl(0.055, 0.6, M.hose, -6.6 + i * 4.4, CEIL - 1.1, zz, null, true);
  }
  // 岩锚（洞室支护，工业细节）
  for (let i = 0; i < 16; i++) {
    const s = i < 8 ? -1 : 1, j = i % 8;
    cyl(0.075, 0.34, M.steel, s * (HX - 0.12), 1.4 + (j % 4) * 1.2, -7.5 + Math.floor(j / 4) * 7.6,
      null, true).rotation.z = Math.PI / 2;
  }

  /* ==========================================================
   * 3. 入口门龛（+Z，通玄关）与出口标志
   * ========================================================== */
  const doorX = -6.4;
  box(3.0, 3.0, 0.22, M.frame, doorX, 1.5, HZ - 0.02);
  box(1.26, 2.4, 0.09, M.steel, doorX - 0.64, 1.2, HZ - 0.16);
  box(1.26, 2.4, 0.09, M.steel, doorX + 0.64, 1.2, HZ - 0.16);
  box(2.9, 0.34, 0.12, M.frame, doorX, 2.62, HZ - 0.16);
  box(1.5, 0.20, 0.05, G.sign, doorX, 2.62, HZ - 0.23);      // 「↑ 玄关」发光牌
  for (let i = 0; i < 6; i++)                                  // 门前警示垫
    box(0.36, 0.02, 1.5, i % 2 ? M.hazY : M.hazK, doorX - 0.9 + i * 0.36, 0.016, HZ - 1.0);
  // 气闸式风淋（进洁净区）
  box(3.4, 3.2, 0.35, M.liner, doorX, 1.6, HZ - 1.9);
  box(1.5, 2.3, 0.06, M.glass, doorX, 1.25, HZ - 2.08);
  for (const s of [-1, 1]) box(0.1, 0.1, 0.1, G.ledB, doorX + s * 1.0, 2.6, HZ - 2.09);

  /* ---- 3b. 网格库与备件区（+Z 侧，把大厅用满）---- */
  {
    const g = new THREE.Group(); g.position.set(3.4, 0, 7.4); group.add(g);
    // 三只网格储存杜瓦（冻好的样品排队等机时 —— 一次会合窗口的科学产出都在这里）
    for (let i = 0; i < 3; i++) {
      const x = -1.3 + i * 1.3;
      cyl(0.42, 0.95, M.cryo, x, 0.48, 0, g);
      cyl(0.45, 0.06, M.frame, x, 0.98, 0, g);
      cyl(0.16, 0.12, M.steel, x, 1.06, 0, g, true);
      box(0.08, 0.08, 0.05, G.ledB, x, 1.16, 0.30, g);
      box(0.30, 0.10, 0.03, G.sign, x, 0.70, 0.44, g);          // 编号牌
    }
    box(4.4, 0.10, 1.3, M.frame, 0, 0.05, 0, g);
    poi('gridstore', 3.4, 1.75, 7.4);
  }
  {   // 备件货架（相机头是耗材，账 5 的备件策略）
    const g = new THREE.Group(); g.position.set(8.2, 0, 6.6); group.add(g);
    for (let i = 0; i < 4; i++) box(2.6, 0.07, 0.85, M.frame, 0, 0.35 + i * 0.62, 0, g);
    for (const s of [-1, 1]) for (const s2 of [-1, 1])
      cyl(0.05, 2.3, M.frame, s * 1.24, 1.15, s2 * 0.38, g, true);
    for (let i = 0; i < 6; i++) {
      const bx = -0.95 + (i % 3) * 0.95, by = 0.52 + Math.floor(i / 3) * 1.24;
      box(0.7, 0.30, 0.6, i === 1 ? M.tool : M.toolB, bx, by, 0, g);
    }
  }

  /* ==========================================================
   * 4. 隔振基座（账 3）：气浮腿 + 惯性块 + 柱内隔振
   * ========================================================== */
  const isoG = new THREE.Group(); group.add(isoG);
  // ① 气浮腿 ×4（f0 = 1.5 Hz）
  for (let i = 0; i < 4; i++) {
    const x = (i % 2 ? 1 : -1) * 1.55, z = (i < 2 ? -1 : 1) * 1.25;
    cyl(0.34, 0.16, M.frame, x, 0.08, z, isoG);          // 底盘
    cyl(0.26, 0.30, M.rubber, x, 0.31, z, isoG);         // 空气弹簧囊（腰鼓）
    cyl(0.30, 0.06, M.steel, x, 0.49, z, isoG);          // 顶盘
    cyl(0.035, 0.34, M.hose, x + 0.30, 0.30, z, isoG, true); // 供气管
  }
  // ② 惯性块（花岗岩，8 t）
  box(4.0, 0.46, 3.3, M.granite, 0, 0.75, 0, isoG);
  box(4.16, 0.06, 3.46, M.frame, 0, 0.99, 0, isoG);      // 台面压条
  // 惯性块侧面的三级隔振铭牌灯（三级 = 三盏）
  for (let i = 0; i < 3; i++) box(0.14, 0.05, 0.05, G.ledG, -0.5 + i * 0.5, 0.66, 1.68, isoG);
  // ③ 柱内隔振（镜筒底座与惯性块之间的软连接，露 4 只减振支柱）
  for (let i = 0; i < 4; i++) {
    const x = (i % 2 ? 1 : -1) * 0.62, z = (i < 2 ? -1 : 1) * 0.55;
    cyl(0.09, 0.20, M.rubber, x, 1.12, z, isoG, true);
    cyl(0.12, 0.05, M.steel, x, 1.245, z, isoG, true);
  }
  poi('iso', 2.35, 0.72, 1.75);

  /* ==========================================================
   * 5. 镜筒立柱（核心，整根前向剖切）
   *    电子枪 → 聚光镜 → 样品台 → 物镜 → 能量过滤器 → 探测器
   * ========================================================== */
  const col = new THREE.Group(); col.position.set(0, 0, 0); group.add(col);
  const Y0 = 1.30;                     // 柱底（柱内隔振之上）
  box(1.5, 0.14, 1.4, M.frame, 0, Y0 - 0.06, 0, col);

  // 分级定义：[名称, 底y, 顶y, 外壳半径, 色标材质]
  const ST = {
    det:   [Y0 + 0.00, Y0 + 0.52, 0.46, M.cDet],
    filt:  [Y0 + 0.52, Y0 + 1.24, 0.52, M.cFilt],
    proj:  [Y0 + 1.24, Y0 + 1.86, 0.36, M.cProj],
    obj:   [Y0 + 1.86, Y0 + 2.58, 0.50, M.cObj],
    stage: [Y0 + 2.58, Y0 + 2.96, 0.42, M.cStage],
    cond:  [Y0 + 2.96, Y0 + 3.72, 0.34, M.cCond],
    gun:   [Y0 + 3.72, Y0 + 4.42, 0.40, M.cGun],
  };
  // 每级：外半壳（-Z 侧）+ 上下法兰环 + **朝观察侧的色标立板**
  // 色标必须朝 +Z（观察侧）才读得到 —— 第一版画在 -Z 半环上，从剖切面看是全黑的，
  // 预览截图当场判死。改为剖口两侧各竖一条发光色标板 + 一块顶铭牌。
  for (const k of Object.keys(ST)) {
    const [y0, y1, r, mat] = ST[k];
    const h = y1 - y0, yc = (y0 + y1) / 2;
    halfShell(r, h, M.shell, 0, yc, 0, col);
    cyl(r + 0.05, 0.05, M.frame, 0, y0 + 0.025, 0, col);     // 下法兰
    cyl(r + 0.05, 0.05, M.frame, 0, y1 - 0.025, 0, col);     // 上法兰
    // 色标：剖口两侧的竖板（自发光，任何光照下都读得到）
    const cm = mat.clone();
    cm.emissive = new THREE.Color(mat.color.getHex());
    cm.emissiveIntensity = 0.85;
    for (const s of [-1, 1])
      box(0.075, h - 0.10, 0.11, cm, s * (r - 0.01), yc, r * 0.10 + 0.03, col);
    // 顶部一小块同色铭牌（俯视也读得到）
    box(0.30, 0.03, 0.13, cm, 0, y1 - 0.05, r * 0.55, col);
  }

  // —— 5a. 电子枪（肖特基场发射，账 2 信息极限 1.51 Å 的来源）——
  {
    const [y0, y1] = ST.gun;
    box(0.62, 0.30, 0.62, M.toolB, 0, y1 + 0.16, 0, col);           // 枪室顶盖
    cyl(0.20, 0.26, M.cGun, 0, y1 - 0.16, 0, col);                  // 抑制极
    tapered(0.02, 0.13, 0.22, M.brass, 0, y1 - 0.42, 0, col);       // 发射尖锥
    const tip = cyl(0.030, 0.055, G.filament, 0, y1 - 0.55, 0, col, true);
    cyl(0.24, 0.07, M.steel, 0, y1 - 0.68, 0, col);                 // 引出极
    // 加速管：8 级分压环（账 8 A.4 —— 长度由陶瓷沿面闪络 1.5 kV/mm 定，
    // 300 kV / 1.5 = 20 cm，每级 37.5 kV / 25 mm。第一版只画 3 圈，本轮补齐）
    for (let i = 0; i < 8; i++) {
      const y = y0 + 0.10 + i * 0.025;
      cyl(0.215, 0.016, M.cGun, 0, y, 0, col, true);                 // 陶瓷绝缘段
      cyl(0.235, 0.009, M.steel, 0, y + 0.0125, 0, col, true);       // 分压电极环
    }
    cyl(0.26, 0.07, M.steel, 0, y0 + 0.32, 0, col);                 // 加速极（末级）
    col.userData.tip = tip;
  }
  // 高压电缆（枪 → -X 侧 300 kV 电源柜）—— 贴 -Z 走，不跨控制间视线
  {
    const pts = [new THREE.Vector3(-0.30, ST.gun[1] + 0.14, -0.16),
      new THREE.Vector3(-1.5, ST.gun[1] + 0.35, -1.3),
      new THREE.Vector3(-3.4, 3.6, -3.4),
      new THREE.Vector3(-4.6, 2.2, -5.4),
      new THREE.Vector3(-4.9, 1.5, -6.9)];
    const cv = new THREE.CatmullRomCurve3(pts);
    col.add(new THREE.Mesh(new THREE.TubeGeometry(cv, 16, 0.075, 6), M.cable));
  }
  // 300 kV 高压罐（3 bar 本地 CO₂）+ 励磁电源柜（账 8 A 的实体）
  {
    const g = new THREE.Group(); g.position.set(-5.4, 0, -7.6); group.add(g);
    // 左/右：励磁与控制电源柜（账 2 的 ΔI/I 0.5 ppm、ΔV/V 1 ppm 住在这里）
    for (const x of [-1.15, 1.15]) {
      box(1.0, 2.1, 0.9, M.toolB, x, 1.05, 0, g);
      box(1.04, 0.07, 0.94, M.frame, x, 2.12, 0, g);
      box(0.5, 0.26, 0.03, G.screen, x, 1.72, 0.46, g);
      box(0.08, 0.08, 0.03, G.ledG, x + 0.34, 1.72, 0.46, g);
      for (let k = 0; k < 4; k++) box(0.72, 0.045, 0.02, M.frame, x, 0.5 + k * 0.24, 0.46, g);
    }
    // 中：高压罐 —— 卧式压力容器，充 3 bar 本地 CO₂ 代替进口 SF₆（账 8 A.5）
    const tank = new THREE.Group(); tank.position.set(0, 1.18, 0); g.add(tank);
    const tk = cyl(0.44, 1.05, M.cryo, 0, 0, 0, tank);
    tk.rotation.z = Math.PI / 2;                                     // 卧置，轴沿 X
    for (const s of [-1, 1]) {                                        // 半球封头
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.44, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.cryo);
      cap.position.set(s * 0.525, 0, 0); cap.rotation.z = s * Math.PI / 2; tank.add(cap);
    }
    for (const s of [-1, 1]) box(0.10, 0.94, 0.94, M.frame, s * 0.30, 0, 0, tank);  // 加强箍
    box(1.1, 0.16, 0.9, M.frame, 0, 0.62, 0, g);                     // 鞍座横梁
    for (const s of [-1, 1]) box(0.14, 0.54, 0.5, M.frame, s * 0.42, 0.29, 0, g);   // 鞍座立柱
    // 压力表 + CO₂ 标识牌 + 高压警示灯 + 充气/回收接口（走 eclss CO₂ 母管）
    cyl(0.10, 0.05, M.steel, 0, 1.18, 0.46, g).rotation.x = Math.PI / 2;
    box(0.30, 0.14, 0.03, G.sign, 0, 1.62, 0.46, g);                 // 「CO₂ 3 bar」牌
    box(0.10, 0.10, 0.05, G.ledR, 0.32, 1.62, 0.46, g);              // 高压带电警示（blink）
    cyl(0.05, 0.34, M.hose, -0.60, 1.18, 0.30, g, true).rotation.z = Math.PI / 2;
    // 高压套管：罐 → 柱（与 5a 的电缆同一根的落点）
    cyl(0.13, 0.55, M.cGun, 0.62, 1.55, 0.10, g).rotation.z = -0.9;
    box(2.6, 0.14, 1.0, M.frame, 0, 0.06, 0, g);
    box(2.4, 0.16, 0.03, G.sign, 0, 2.42, 0.4, g);
    poi('hvsupply', -5.4, 2.75, -6.9);
  }

  // —— 5b. 聚光镜 C1/C2（照明半角 α=50 µrad，账 2 空间相干项）——
  {
    const [y0, y1] = ST.cond;
    for (let i = 0; i < 2; i++) {
      const y = y0 + 0.20 + i * 0.36;
      cyl(0.30, 0.15, M.copper, 0, y, 0, col);                       // 励磁线圈
      cyl(0.30, 0.15, M.copper, 0, y, 0, col).scale.set(0.30, 0.15, 0.30);
      cyl(0.15, 0.19, M.cCond, 0, y, 0, col);                        // 磁极靴
      cyl(0.055, 0.21, M.frame, 0, y, 0, col, true);                 // 极靴孔
    }
    // 聚光光阑（可见的一片带孔板）
    cyl(0.16, 0.02, M.frame, 0, y1 - 0.10, 0, col, true);
  }

  // —— 5c. 样品台 + autoloader 侧装口（账 7 的终点）——
  const stageG = new THREE.Group(); col.add(stageG);
  {
    const [y0, y1] = ST.stage;
    const yc = (y0 + y1) / 2;
    box(0.66, 0.14, 0.46, M.cStage, 0, yc, 0, stageG);               // 台体
    box(0.20, 0.06, 0.20, M.brass, 0, yc + 0.10, 0, stageG);         // 样品杯座
    // 侧装口（+X 朝 autoloader）
    box(0.30, 0.26, 0.30, M.toolB, 0.52, yc, 0, col);
    cyl(0.11, 0.16, M.steel, 0.70, yc, 0, col, true).rotation.z = Math.PI / 2;
    box(0.06, 0.16, 0.16, G.ledA, 0.79, yc, 0, col);                 // 装载口状态灯
    // 冷杆热锚（样品台 ~100 K，账 7）
    for (let i = 0; i < 3; i++)
      cyl(0.035, 0.30, M.copper, -0.42, yc - 0.04 + i * 0.05, -0.18 + i * 0.02, col, true)
        .rotation.z = Math.PI / 2;
    stageG.userData.y0 = yc;
  }
  const sampleHolder = box(0.13, 0.03, 0.13, M.brass, 0, 0, 0, stageG);
  sampleHolder.position.set(0, ST.stage[0] + 0.30, 0);
  sampleHolder.visible = false;

  // —— 5d. 物镜（Cs=2.7 mm，Scherzer 2.50 Å 的出处）——
  {
    const [y0, y1] = ST.obj;
    const yc = (y0 + y1) / 2;
    cyl(0.46, 0.50, M.copper, 0, yc, 0, col);                        // 大励磁线圈
    cyl(0.30, 0.54, M.cObj, 0, yc, 0, col);                          // 上下极靴
    box(0.62, 0.05, 0.62, M.frame, 0, yc, 0, col);                   // 极靴间隙（可见的缝）
    cyl(0.075, 0.56, M.frame, 0, yc, 0, col, true);                  // 极靴孔
    cyl(0.14, 0.02, M.frame, 0, y0 + 0.14, 0, col, true);            // 物镜光阑
    // 像散校正器（8 极）
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      cyl(0.028, 0.10, M.copper, Math.sin(a) * 0.13, y0 + 0.06, Math.cos(a) * 0.13, col, true)
        .rotation.z = Math.PI / 2;
    }
  }

  // —— 5e. 中间镜 / 投影镜 ——
  {
    const [y0, y1] = ST.proj;
    for (let i = 0; i < 2; i++) {
      const y = y0 + 0.16 + i * 0.30;
      cyl(0.28, 0.13, M.copper, 0, y, 0, col);
      cyl(0.14, 0.16, M.cProj, 0, y, 0, col);
      cyl(0.05, 0.18, M.frame, 0, y, 0, col, true);
    }
  }

  // —— 5f. 能量过滤器（Ω 型；账 2 的"背景乘子"实体）——
  {
    const [y0, y1] = ST.filt;
    const yc = (y0 + y1) / 2;
    // 箱体只留 -Z 后半（深 0.24），剖口全开 —— 否则 Ω 光路被自己的壳挡死（预览判死过一次）
    box(0.86, 0.62, 0.24, M.toolB, 0, yc, -0.30, col);
    // Ω 形磁偏转（四段圆弧，自发光，剖切面正对观察侧）
    const omMat = M.cFilt.clone();
    omMat.emissive = new THREE.Color(0xa274f0); omMat.emissiveIntensity = 0.7;
    const om = new THREE.Group(); om.position.set(0, yc, 0.04); col.add(om);
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.032, 5, 10, Math.PI * 1.15), omMat);
      t.position.set((i % 2 ? 1 : -1) * 0.15, (i < 2 ? 1 : -1) * 0.13, 0);
      t.rotation.z = (i < 2 ? 1 : -1) * (i % 2 ? -1 : 1) * 0.9;
      om.add(t);
    }
    box(0.20, 0.025, 0.14, M.brass, 0, yc - 0.27, 0.04, col);        // 能量选择缝（10~20 eV）
    box(0.05, 0.05, 0.05, G.ledB, 0.40, yc + 0.20, 0.10, col);
  }

  // —— 5g. 探测器（账 5：计数模式 DED）——
  const detG = new THREE.Group(); col.add(detG);
  {
    const [y0, y1] = ST.det;
    const yc = (y0 + y1) / 2;
    box(0.80, 0.30, 0.30, M.tool, 0, yc - 0.06, -0.26, detG);        // 相机头（退到 -Z，剖口不挡）
    // 传感器面朝上接束：绿色色标 + 背照减薄硅（黑）+ 四周读出环
    box(0.46, 0.04, 0.46, M.cDet, 0, yc + 0.14, 0.02, detG);
    const sens = box(0.30, 0.014, 0.30, M.panel, 0, yc + 0.168, 0.02, detG);
    box(0.24, 0.30, 0.30, M.toolB, 0.58, yc - 0.04, -0.10, detG);    // 读出电子学盒
    for (let i = 0; i < 4; i++)                                       // 数据口指示灯（采集时高速闪）
      box(0.05, 0.05, 0.05, G.ledG, 0.58 + (i % 2) * 0.11 - 0.055,
        yc + 0.06 - Math.floor(i / 2) * 0.10, 0.06, detG);
    detG.userData.sensor = sens;
    // 相机水冷软管
    for (const s of [-1, 1]) cyl(0.035, 0.5, M.hose, s * 0.32, yc - 0.20, -0.34, detG, true).rotation.x = 0.9;
  }
  const detLeds = [];
  detG.traverse((o) => { if (o.material === G.ledG) detLeds.push(o); });

  // —— 5h. 电子束（一根发光轴，两处收腰=交叉点）——
  const beamSegs = [];
  const beamDefs = [
    [ST.gun[1] - 0.55, ST.cond[1], 0.045, 0.012],     // 枪 → 聚光镜（第一交叉）
    [ST.cond[1], ST.stage[0] + 0.30, 0.012, 0.085],   // 展开成平行照明
    [ST.stage[0] + 0.30, ST.obj[0] + 0.20, 0.085, 0.014], // 样品 → 物镜后焦（衍射面）
    [ST.obj[0] + 0.20, ST.filt[1] - 0.26, 0.014, 0.055],  // 放大 → 能量选择缝
    [ST.filt[1] - 0.26, ST.det[1] - 0.05, 0.055, 0.16],   // 缝 → 探测器
  ];
  for (const [ya, yb, ra, rb] of beamDefs) {
    const m = G.beam.clone();
    const s = new THREE.Mesh(new THREE.CylinderGeometry(rb, ra, yb - ya, 10, 1, true), m);
    s.position.set(0, (ya + yb) / 2, 0);
    col.add(s); beamSegs.push(m);
  }

  // —— 5g2. 柱内冷阱 / 防污染器（账 4 的 12 W、账 7 的 129 单层/h 就是它）——
  // 第一版只有账没有实体，违反「核心不做黑盒」；本轮补建在样品台正下方，
  // 剖口正对观察侧：一块比样品更冷的板 + 铜编织带 + 通向杜瓦的冷指。
  {
    const yc = ST.stage[0] - 0.10;
    const trapMat = M.cryo.clone();
    trapMat.emissive = new THREE.Color(0x2a5a72); trapMat.emissiveIntensity = 0.5;
    box(0.44, 0.028, 0.30, trapMat, 0, yc, 0.05, col);              // 冷阱板（~80 K）
    for (let i = 0; i < 5; i++)                                      // 冷指翅片
      box(0.40, 0.05, 0.012, trapMat, 0, yc - 0.045, -0.02 + i * 0.035, col);
    // 铜编织热带 → +X 侧穿出柱壁，接 autoloader 杜瓦冷区
    const braid = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.20, yc - 0.02, 0.02),
      new THREE.Vector3(0.44, yc - 0.10, -0.02),
      new THREE.Vector3(0.60, yc - 0.06, -0.06)]);
    col.add(new THREE.Mesh(new THREE.TubeGeometry(braid, 8, 0.022, 6), M.copper));
    box(0.05, 0.05, 0.05, G.cryoGl, 0.30, yc + 0.10, 0.16, col);    // 冷阱温度灯
  }

  // 真空：离子泵 + 涡分（挂在柱侧 -X）
  cyl(0.24, 0.44, M.toolB, -0.72, Y0 + 1.5, -0.25, col);
  box(0.34, 0.34, 0.34, M.frame, -0.78, Y0 + 0.55, -0.25, col);
  cyl(0.20, 0.30, M.steel, -0.78, Y0 + 2.9, -0.22, col);
  for (const y of [Y0 + 0.9, Y0 + 2.2, Y0 + 3.3])
    cyl(0.045, 0.5, M.hose, -0.70, y, -0.25, col, true).rotation.z = 1.2;
  // 真空规读数灯
  box(0.05, 0.05, 0.05, G.ledB, -0.78, Y0 + 1.82, -0.05, col);

  poi('column', 0.0, ST.obj[1] + 0.15, 0.95);
  poi('detector', 0.95, ST.det[0] + 0.30, 0.62);

  /* ==========================================================
   * 6. autoloader + LN₂ 杜瓦 + 取盒机械臂（动画主角）
   * ========================================================== */
  const alBase = new THREE.Group(); alBase.position.set(3.35, 0, 0.55); group.add(alBase);
  box(1.9, 0.9, 1.6, M.toolB, 0, 0.45, 0, alBase);                 // 机柜
  box(2.0, 0.06, 1.7, M.frame, 0, 0.93, 0, alBase);
  // LN₂ / 缓冲液杜瓦（账 4：装的是城内缓冲气原液，不是纯氮）
  const dew = new THREE.Group(); dew.position.set(-0.35, 0.96, 0); alBase.add(dew);
  cyl(0.52, 1.10, M.cryo, 0, 0.55, 0, dew);
  cyl(0.56, 0.07, M.frame, 0, 1.08, 0, dew);
  cyl(0.20, 0.14, M.steel, 0, 1.16, 0, dew);                        // 颈管
  // 液位窗（竖直玻璃条 + 液柱，动画中缓慢升降）
  box(0.10, 0.86, 0.05, M.glass, 0, 0.55, 0.53, dew);
  const ln2Level = box(0.075, 0.62, 0.03, G.ln2, 0, 0.42, 0.545, dew);
  // 蒸发气回收接口（→ 压缩机橇）
  cyl(0.06, 0.24, M.steel, 0.30, 1.14, 0, dew, true).rotation.z = Math.PI / 2;
  box(0.05, 0.05, 0.05, G.ledB, 0.30, 1.28, 0, dew);
  // 12 位 cassette 仓（露盒，开口容器原则）
  const mag = new THREE.Group(); mag.position.set(0, 1.02, 0); dew.add(mag);
  cyl(0.30, 0.14, M.frame, 0, 0.0, 0, mag);
  const pucks = [];
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    const p = cyl(0.045, 0.05, M.brass, Math.sin(a) * 0.20, 0.06, Math.cos(a) * 0.20, mag, true);
    pucks.push(p);
  }
  // 三轴机械臂：立柱 + 可转臂 + 滑架 + 夹爪
  const armCol = new THREE.Group(); armCol.position.set(0.55, 0.96, 0); alBase.add(armCol);
  cyl(0.14, 1.9, M.steel, 0, 0.95, 0, armCol);
  const armYaw = new THREE.Group(); armYaw.position.set(0, 1.55, 0); armCol.add(armYaw);
  box(1.5, 0.14, 0.20, M.tool, -0.60, 0, 0, armYaw);                // 悬臂（向 -X 伸）
  const carriage = new THREE.Group(); carriage.position.set(-0.55, -0.10, 0); armYaw.add(carriage);
  box(0.20, 0.16, 0.22, M.toolB, 0, 0, 0, carriage);
  cyl(0.035, 0.34, M.steel, 0, -0.24, 0, carriage, true);
  const gripper = new THREE.Group(); gripper.position.set(0, -0.44, 0); carriage.add(gripper);
  for (const s of [-1, 1]) box(0.035, 0.11, 0.10, M.steel, s * 0.055, 0, 0, gripper);
  const heldPuck = cyl(0.045, 0.05, M.brass, 0, -0.05, 0, gripper, true);
  heldPuck.visible = false;
  // 过渡真空腔（cassette 进柱前）
  box(0.6, 0.5, 0.5, M.tool, -1.35, 1.32, 0, alBase);
  box(0.06, 0.22, 0.22, G.ledA, -1.66, 1.32, 0, alBase);
  poi('autoloader', 3.35, 2.15, 1.55);

  /* ==========================================================
   * 7. 氮回收压缩机橇（账 4 的实体）—— 自带弹簧隔振基座
   * ========================================================== */
  const skid = new THREE.Group(); skid.position.set(8.4, 0, -2.6); group.add(skid);
  // 弹簧隔振底座（f0 = 3 Hz，账 3 A.5 的自证对象）
  box(3.2, 0.20, 2.4, M.frame, 0, 0.10, 0, skid);
  for (let i = 0; i < 4; i++) {
    const x = (i % 2 ? 1 : -1) * 1.35, z = (i < 2 ? -1 : 1) * 0.95;
    cyl(0.13, 0.22, M.copper, x, 0.31, z, skid, true);              // 弹簧
  }
  box(3.0, 0.34, 2.2, M.granite, 0, 0.59, 0, skid);                 // 2.8 t 惯性底座
  // 无油往复压缩机 + 电机 + 飞轮（spinner）
  box(1.2, 0.72, 0.9, M.toolB, -0.75, 1.12, 0, skid);
  cyl(0.26, 0.6, M.tool, -0.75, 1.70, 0, skid).rotation.z = Math.PI / 2;
  const flywheel = cyl(0.42, 0.14, M.steel, 0.15, 1.28, 0, skid);
  flywheel.rotation.z = Math.PI / 2; flywheel.name = 'flywheel';
  for (let i = 0; i < 6; i++) {                                      // 飞轮辐条
    const a = i * Math.PI / 3;
    box(0.06, 0.06, 0.72, M.frame, 0, 0, 0, flywheel).rotation.y = a;
  }
  box(0.9, 0.62, 0.72, M.frame, 0.85, 1.06, 0, skid);               // 电机
  // 缓冲罐（蒸发气先进这里 —— 夜间只留它运行，压缩机白天跑，账 3 A.5）
  cyl(0.42, 1.8, M.cryo, 1.15, 1.66, -0.72, skid);
  cyl(0.44, 0.07, M.frame, 1.15, 2.58, -0.72, skid);
  box(0.05, 0.05, 0.05, G.ledG, 1.15, 2.66, -0.72, skid);
  // 液化冷箱（回热器 + 膨胀机；账 4 的 1.23 kWh/kg 就在这里付）
  const cbox = new THREE.Group(); cbox.position.set(0.6, 0, 0.85); skid.add(cbox);
  box(1.5, 2.1, 0.95, M.cryo, 0, 1.82, 0, cbox);
  for (let i = 0; i < 5; i++) box(1.56, 0.07, 1.0, M.frame, 0, 1.05 + i * 0.38, 0, cbox); // 保温压条
  box(0.5, 0.34, 0.05, G.screen, 0, 2.55, 0.50, cbox);
  const cboxLed = box(0.09, 0.09, 0.05, G.ledB, 0.55, 2.55, 0.50, cbox);
  // 管线：杜瓦 → 缓冲罐 → 压缩机 → 冷箱 → 回杜瓦（闭环可读）
  {
    const mk = (pts, r, m) => {
      const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
      group.add(new THREE.Mesh(new THREE.TubeGeometry(c, 16, r, 6), m));
    };
    mk([[3.65, 2.12, 0.55], [5.4, 2.5, -0.6], [7.2, 2.6, -2.0], [9.55, 2.4, -3.32]], 0.055, M.steel);   // 蒸发气去
    mk([[9.0, 1.9, -1.75], [8.2, 1.7, -1.2], [7.6, 1.75, -1.0]], 0.05, M.hose);
    mk([[9.0, 3.5, -1.75], [6.5, 3.3, -0.4], [4.6, 2.6, 0.4], [3.72, 2.16, 0.55]], 0.05, M.cryo);       // 液体回
  }
  poi('n2', 8.4, 2.9, -0.9);

  /* ==========================================================
   * 8. 制样区（-X）：等离子清洗 / plunge 冷冻 / 脱盐台
   * ========================================================== */
  // —— 8a. 等离子清洗台 ——
  {
    const g = new THREE.Group(); g.position.set(-8.6, 0, 3.4); group.add(g);
    box(2.0, 0.80, 0.95, M.tool, 0, 0.40, 0, g);
    box(2.1, 0.06, 1.02, M.frame, 0, 0.83, 0, g);
    cyl(0.26, 0.40, M.glass, -0.45, 1.06, 0, g);                   // 钟罩
    cyl(0.28, 0.05, M.steel, -0.45, 1.29, 0, g);
    const glow = cyl(0.20, 0.30, G.plasma, -0.45, 1.04, 0, g);     // 辉光
    box(0.34, 0.26, 0.05, G.screen, 0.55, 1.05, 0.44, g);
    box(0.07, 0.07, 0.05, G.ledA, 0.80, 1.05, 0.44, g);
    for (const s of [-1, 1]) cyl(0.04, 0.4, M.hose, 0.2, 0.2, s * 0.4, g, true);
    g.userData.glow = glow;
    group.userData._plasmaGlow = glow;
    poi('clean', -8.6, 1.62, 0.55, g);
  }
  // —— 8b. plunge 冷冻工作站（乙烷；账 7 的莱顿弗罗斯特）——
  const plunge = new THREE.Group(); plunge.position.set(-8.5, 0, 0.4); group.add(plunge);
  {
    box(1.5, 0.85, 1.2, M.toolB, 0, 0.42, 0, plunge);
    box(1.6, 0.06, 1.28, M.frame, 0, 0.88, 0, plunge);
    // 环境腔（湿度控制）+ 立柱
    box(1.3, 1.9, 1.15, M.tool, 0, 1.86, -0.06, plunge);
    box(1.02, 1.35, 0.05, M.glass, 0, 1.72, 0.55, plunge);          // 前观察窗（开放剖切感）
    // 内部：冷媒浴 + 乙烷杯（金色）+ 吸纸臂
    cyl(0.30, 0.24, M.cryo, -0.28, 1.09, 0.05, plunge);
    cyl(0.25, 0.05, G.ln2, -0.28, 1.20, 0.05, plunge, true);        // 浴液面
    cyl(0.085, 0.13, M.brass, -0.28, 1.24, 0.05, plunge, true);     // 乙烷杯（93 K）
    for (const s of [-1, 1])                                         // 吸纸臂
      box(0.06, 0.05, 0.34, M.steel, 0.10 + s * 0.16, 1.52, 0.05, plunge);
    // 垂直插入杆（动画：慢升 → 急降）
    const rodG = new THREE.Group(); rodG.position.set(-0.28, 0, 0); plunge.add(rodG);
    cyl(0.028, 0.75, M.steel, 0, 2.05, 0.05, rodG, true);
    box(0.10, 0.05, 0.05, M.frame, 0, 1.70, 0.05, rodG);            // 镊子
    box(0.05, 0.008, 0.05, M.copper, 0, 1.68, 0.05, rodG);          // 铜网
    plunge.userData.rod = rodG;
    box(0.42, 0.30, 0.05, G.screen, 0.42, 1.95, 0.58, plunge);
    box(0.07, 0.07, 0.05, G.ledG, 0.42, 1.62, 0.58, plunge);
    poi('plunge', -8.5, 3.05, 0.05);
  }
  // —— 8c. 高氯酸盐脱除台（火星专属；与 res-dome-hall-01 洗盐卡互引）——
  {
    const g = new THREE.Group(); g.position.set(-8.6, 0, -3.2); group.add(g);
    box(2.2, 0.80, 0.95, M.tool, 0, 0.40, 0, g);
    box(2.3, 0.06, 1.02, M.frame, 0, 0.83, 0, g);
    box(2.3, 1.5, 0.10, M.liner, 0, 1.6, -0.46, g);                 // 后挡板
    // 三根脱盐柱：琥珀（含盐提取液）→ 中间 → 清亮（<50 mM）
    const cols = [G.amber, G.clear, G.clear];
    for (let i = 0; i < 3; i++) {
      const x = -0.68 + i * 0.68;
      cyl(0.075, 0.80, M.glass, x, 1.28, 0, g);
      cyl(0.058, 0.60 - i * 0.10, cols[i], x, 1.12 + i * 0.05, 0, g, true);
      cyl(0.09, 0.05, M.frame, x, 1.70, 0, g, true);
      cyl(0.09, 0.05, M.frame, x, 0.88, 0, g, true);
      box(0.10, 0.10, 0.06, i === 2 ? G.ledG : G.ledA, x, 1.86, -0.40, g);
    }
    // 离心机 + 超滤管架
    cyl(0.26, 0.26, M.tool, 0.85, 0.96, 0.22, g);
    cyl(0.27, 0.04, M.frame, 0.85, 1.11, 0.22, g);
    for (let i = 0; i < 4; i++) cyl(0.028, 0.14, G.clear, -0.30 + i * 0.16, 0.93, 0.34, g, true);
    poi('desalt', -8.6, 2.15, -0.10, g);
  }
  // —— 8d. 转移工作台（冷媒浴中装盒）——
  {
    const g = new THREE.Group(); g.position.set(-4.9, 0, 2.6); group.add(g);
    box(1.6, 0.85, 1.0, M.tool, 0, 0.42, 0, g);
    box(1.7, 0.06, 1.08, M.frame, 0, 0.88, 0, g);
    cyl(0.34, 0.20, M.cryo, -0.20, 1.01, 0, g);
    cyl(0.28, 0.04, G.ln2, -0.20, 1.10, 0, g, true);
    for (let i = 0; i < 4; i++)
      cyl(0.045, 0.05, M.brass, -0.32 + (i % 2) * 0.24, 1.13, -0.12 + Math.floor(i / 2) * 0.24, g, true);
    cyl(0.20, 0.16, M.steel, 0.50, 0.99, 0, g);                     // 双目镜筒（装盒用）
    box(0.16, 0.22, 0.16, M.toolB, 0.50, 1.16, 0, g);
  }

  /* ==========================================================
   * 9. 控制间（-Z）：双屏 —— 实况显微图 + FFT Thon 环
   * ========================================================== */
  const ctrl = new THREE.Group(); ctrl.position.set(2.6, 0, -8.95); group.add(ctrl);
  box(7.4, 0.16, 2.4, M.floorD, 0, 0.08, 0, ctrl);                  // 抬高地台
  box(7.4, 3.0, 0.16, M.liner, 0, 1.66, -1.16, ctrl);               // 后墙
  for (const s of [-1, 1]) box(0.16, 3.0, 2.4, M.liner, s * 3.62, 1.66, 0, ctrl);
  box(7.4, 0.9, 0.20, M.frame, 0, 3.6, 1.14, ctrl);                 // 门楣
  box(7.0, 2.1, 0.05, M.glass, 0, 2.2, 1.16, ctrl);                 // 玻璃隔断
  box(7.4, 0.14, 0.24, M.frame, 0, 1.10, 1.16, ctrl);
  // 操作台
  box(5.4, 0.75, 0.85, M.toolB, 0, 0.54, 0.35, ctrl);
  box(5.5, 0.05, 0.92, M.tool, 0, 0.94, 0.35, ctrl);
  for (let i = 0; i < 3; i++) {                                      // 三只操作椅（有人用的场地）
    const x = -1.6 + i * 1.6;
    cyl(0.22, 0.06, M.frame, x, 0.62, 1.05, ctrl, true);
    cyl(0.05, 0.44, M.steel, x, 0.40, 1.05, ctrl, true);
    box(0.42, 0.40, 0.06, M.rubber, x, 0.86, 1.24, ctrl);
  }
  // 双屏：左 = 实况显微图；右 = FFT（Thon 环）
  const SY = 2.30, SZ = -1.05;
  box(2.30, 1.42, 0.07, M.frame, -1.55, SY, SZ, ctrl);
  box(2.30, 1.42, 0.07, M.frame, 1.55, SY, SZ, ctrl);
  const microScreen = box(2.12, 1.26, 0.02, G.micro, -1.55, SY, SZ + 0.05, ctrl);
  const fftScreen = box(2.12, 1.26, 0.02, G.screen, 1.55, SY, SZ + 0.05, ctrl);
  // 左屏：24 颗"颗粒"（采集时逐颗浮现）
  const particles = [];
  for (let i = 0; i < 24; i++) {
    const m = G.partic.clone();
    const px = -1.55 + (-0.86 + (i % 6) * 0.345 + (rnd(i) - 0.5) * 0.10);
    const py = SY + (0.42 - Math.floor(i / 6) * 0.30 + (rnd(i + 40) - 0.5) * 0.08);
    const o = new THREE.Mesh(new THREE.CircleGeometry(0.052 + rnd(i + 9) * 0.018, 8), m);
    o.position.set(px, py, SZ + 0.065); ctrl.add(o);
    particles.push({ m, ord: i });
  }
  // 右屏：7 圈 Thon 环（由内向外逐圈清晰）
  const rings = [];
  for (let i = 0; i < 7; i++) {
    const r0 = 0.085 + i * 0.078;
    const m = new THREE.MeshStandardMaterial({
      color: 0x0a1a22, emissive: 0x7fe0ff, emissiveIntensity: 0.0,
      transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false });
    const o = new THREE.Mesh(new THREE.RingGeometry(r0, r0 + 0.030, 30), m);
    o.position.set(1.55, SY, SZ + 0.065); ctrl.add(o);
    rings.push({ m, i });
  }
  box(0.24, 0.24, 0.02, G.screen, 1.55, SY, SZ + 0.055, ctrl);       // FFT 中心亮斑底
  const fftDC = box(0.10, 0.10, 0.02, G.ledB, 1.55, SY, SZ + 0.07, ctrl);
  // 屏下漂移曲线条（26 根，指数收敛）
  const driftBars = [];
  for (let i = 0; i < 26; i++) {
    const m = G.drift.clone();
    const o = box(0.052, 0.02, 0.02, m, -1.55 + (-0.85 + i * 0.068), SY - 0.86, SZ + 0.065, ctrl);
    driftBars.push({ o, m, i });
  }
  box(1.9, 0.012, 0.02, M.frame, -1.55, SY - 0.88, SZ + 0.06, ctrl); // 基线
  // 小屏群（束流/真空/温度/氮位）
  for (let i = 0; i < 4; i++)
    box(0.52, 0.34, 0.03, G.screen, -2.55 + i * 1.7, 1.32, SZ + 0.05, ctrl);
  // 急停 + 状态灯
  box(0.12, 0.12, 0.06, G.ledR, 3.2, 1.35, 1.10, ctrl);
  poi('control', 2.6, 3.35, -4.0);
  poi('compute', 5.4, 1.8, -7.6);

  // 机房链路（本站→ops-compute-01 的专线，墙上光缆盘）
  {
    const g = new THREE.Group(); g.position.set(7.6, 0, -9.7); group.add(g);
    box(1.2, 2.0, 0.5, M.frame, 0, 1.05, 0, g);
    for (let i = 0; i < 6; i++) box(1.05, 0.10, 0.06, G.ledG, 0, 0.35 + i * 0.28, 0.28, g);
    box(0.9, 0.34, 0.04, G.screen, 0, 2.0, 0.26, g);
    // 专线光缆：沿墙上行进顶部桥架（不跨控制间玻璃 —— 第一版跨了，预览判死）
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(7.6, 2.1, -9.4), new THREE.Vector3(8.6, 4.6, -8.8),
      new THREE.Vector3(8.8, 6.6, -7.6), new THREE.Vector3(7.4, 7.1, -6.4)]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.05, 6), M.cable));
  }

  /* ==========================================================
   * 10. 教学展板：岩层剖面（账 3）与测量谱系（账 2）
   * ========================================================== */
  // 10a. 岩层剖面板（-Z 墙左段）—— 30 m 岩层的温度衰减
  {
    const g = new THREE.Group(); g.position.set(-7.2, 0, -10.02); group.add(g);
    box(3.0, 2.6, 0.10, M.frame, 0, 2.0, 0, g);
    const strata = [0x7a5a42, 0x6b4e3a, 0x8a6a4a, 0x5d4433, 0x76563f, 0x4f3a2c];
    for (let i = 0; i < 6; i++)
      box(2.7, 0.36, 0.04, new THREE.MeshStandardMaterial({ color: strata[i], roughness: 0.95 }),
        0, 3.06 - i * 0.38, 0.07, g);
    // 温度衰减曲线（8 段，越深越平）
    for (let i = 0; i < 8; i++) {
      const w = 0.9 * Math.exp(-i * 0.62) + 0.03;
      box(w, 0.05, 0.03, G.drift, -0.95 + w / 2, 3.02 - i * 0.28, 0.10, g);
    }
    box(2.6, 0.24, 0.03, G.sign, 0, 0.82, 0.08, g);
    poi('rock', -7.2, 3.6, -9.4);
  }
  // 10b. 测量谱系板（+Z 墙右段）—— λ 从射电到 1.97 pm
  {
    const g = new THREE.Group(); g.position.set(6.6, 0, HZ - 0.62); group.add(g);
    box(3.4, 1.9, 0.10, M.frame, 0, 2.1, 0, g);
    const cols = [0xd9534f, 0xe8923c, 0xe8d23c, 0x5fd97a, 0x3fd3d8, 0x5fa8ff, 0xa274f0, 0xffffff];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.MeshStandardMaterial({ color: cols[i], emissive: cols[i],
        emissiveIntensity: 0.5, roughness: 0.5 });
      box(0.34, 0.10 + i * 0.055, 0.03, m, -1.42 + i * 0.40, 1.55 + (0.10 + i * 0.055) / 2, -0.07, g);
    }
    box(3.1, 0.05, 0.03, M.steel, 0, 1.50, -0.07, g);
    box(0.42, 0.22, 0.04, G.ledB, 1.38, 2.62, -0.07, g);            // 最右端高亮：电子波
    box(3.0, 0.20, 0.03, G.sign, 0, 2.90, -0.07, g);
    poi('lineage', 6.6, 3.35, HZ - 1.2);
  }

  /* ==========================================================
   * 11. 场地细节：安全橙护栏 / 铭牌 / 走线 / 灰尘痕迹
   * ========================================================== */
  const rail = new THREE.MeshStandardMaterial({ color: 0xd07a2a, roughness: 0.62 });
  for (const [x0, z0, x1, z1] of [[-2.8, 2.4, 2.8, 2.4], [-2.8, -2.3, 2.8, -2.3]]) {
    const n = 5;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n;
      cyl(0.035, 1.0, rail, x, 0.50, z, null, true);
    }
    box(Math.abs(x1 - x0), 0.05, 0.05, rail, (x0 + x1) / 2, 1.0, (z0 + z1) / 2);
    box(Math.abs(x1 - x0), 0.04, 0.04, rail, (x0 + x1) / 2, 0.55, (z0 + z1) / 2);
  }
  // 使用痕迹：地面确定性散落小件（工具箱/线盘/备件箱）
  for (let i = 0; i < 11; i++) {
    const x = -9.4 + rnd(i) * 18.8, z = -9.4 + rnd(i + 3) * 18.8;
    if (Math.abs(x) < 4.2 && Math.abs(z) < 3.4) continue;
    box(0.34 + rnd(i + 7) * 0.2, 0.2, 0.28, M.frame, x, 0.10, z).rotation.y = rnd(i + 11) * 3.14;
  }
  // 尘膜 pass（地下城也有尘，只是少）
  for (const m of Object.values(M)) if (m.color) m.color.lerp(new THREE.Color(0x9e5b3d), 0.04);

  /* ==========================================================
   * 12. 声明：灯光 / 旋转 / 出入口
   * ========================================================== */
  group.userData.lights = [
    { color: 0xeef4ff, pos: [0, 5.4, 1.6], range: 18 },       // 镜筒区主照明
    { color: 0xffffff, pos: [0, 4.4, 2.4], range: 9 },        // 镜筒剖切面补光（上段）
    { color: 0xdfeaf4, pos: [0, 1.7, 2.2], range: 7 },        // 剖切面补光（探测器/过滤器段）
    { color: 0xbcd4e8, pos: [0, 3.4, -4.6], range: 14 },
    { color: 0xffe8c8, pos: [-7.6, 3.4, 1.0], range: 13 },    // 制样区暖光
    { color: 0xffe8c8, pos: [-7.6, 3.2, -3.2], range: 11 },
    { color: 0xd8e8ff, pos: [6.4, 3.4, -1.6], range: 13 },    // 氮橇区
    { color: 0x8ab8ff, pos: [2.6, 2.8, -8.6], range: 10 },     // 控制间冷调
    { color: 0xe8eef4, pos: [-5.4, 3.2, -6.2], range: 11 },    // 高压罐/电源柜区（账 8）
    { color: 0xeef4ff, pos: [-6.4, 3.0, 8.6], range: 11 },
    { color: 0xdfe8f0, pos: [4.6, 3.2, 7.0], range: 12 },    // 门厅
  ];
  group.userData.spinners = [
    { node: flywheel, axis: 'y', rpm: 210 },                   // 飞轮（已绕 Z 转，本地 y = 世界 x）
  ];
  group.userData.nightMats = [G.lampW, G.lampC, G.sign, G.ledB, G.ledG, G.ledA];
  group.userData.blinkMats = [G.ledR];

  /* ==========================================================
   * 13. 烘焙时间线 T = 96 s（纯 t 分段，确定性）
   *   0~13   臂转向杜瓦、下爪取盒
   *   13~24  臂回转 → 过渡腔 → 装入样品台
   *   24~44  台位稳定：漂移曲线指数收敛（账 7.5 的 exp 衰减）
   *   44~82  采集：束亮、探测器灯闪、显微图逐颗浮现、Thon 环由内向外清晰
   *   82~90  束闭、退样
   *   90~96  复位（首尾闭合）
   * ========================================================== */
  const T = 96;
  group.userData.animate = (t) => {
    const tt = ((t % T) + T) % T;

    // ---- 机械臂：yaw + 滑架高度 + 夹爪 ----
    // yaw: 0 = 悬臂指向杜瓦(-X)；-1.35 rad = 指向柱侧装口
    const toCol = sstep(14, 21, tt) - sstep(84, 90, tt);
    armYaw.rotation.y = -1.30 * toCol;
    // 滑架升降：取盒时下探，运送时抬起
    const dip = Math.max(0,
      sstep(4, 8, tt) - sstep(10, 13, tt) + sstep(22, 25, tt) - sstep(27, 30, tt)
      + sstep(76, 79, tt) - sstep(81, 84, tt));
    carriage.position.y = -0.10 - 0.62 * dip;
    gripper.position.y = -0.44 - 0.10 * dip;
    heldPuck.visible = (tt >= 9 && tt < 26) || (tt >= 79 && tt < 92);
    // 仓里第 3 号盒在被取走的那段隐藏（因果可读）
    pucks[3].visible = !(tt >= 9 && tt < 92);

    // ---- 样品在台上 ----
    const onStage = tt >= 25.5 && tt < 78.5;
    sampleHolder.visible = onStage;
    stageG.position.y = onStage ? 0 : 0;

    // ---- 台位稳定：漂移曲线（exp(-t/45)，账 7.5）----
    const set0 = 25.5;
    for (const b of driftBars) {
      // 每根条 = 稳定过程中的一个时间采样点
      const tb = set0 + b.i * 0.72;
      const shown = tt >= tb && tt < 82;
      const v = 0.30 * Math.exp(-(b.i * 0.72) / 5.2) + 0.012;
      // box() 用单位立方 + scale，故 scale.y 直接就是米
      const h = shown ? v : 0.006;
      b.o.scale.y = h;
      b.o.position.y = (SY - 0.86) + h / 2;
      b.m.emissiveIntensity = shown ? (b.i < 8 ? 2.2 : 1.4) : 0.15;
      b.m.emissive.setHex(shown && b.i >= 8 ? 0x54e0a0 : (shown ? 0xffb050 : 0x203028));
    }

    // ---- 采集窗口 ----
    const acq = Math.max(0, sstep(44, 45.5, tt) - sstep(80, 81.5, tt));
    // 电子束：稳定前不开（剂量预算不许浪费，账 1）
    for (let i = 0; i < beamSegs.length; i++)
      beamSegs[i].opacity = acq * (0.52 + 0.16 * Math.sin(t * 6 + i));
    col.userData.tip.emissiveIntensity = 0.9 + acq * 2.2;
    // 探测器数据灯：采集时高速闪（1500 fps 计数模式的拟人化）
    for (let i = 0; i < detLeds.length; i++)
      detLeds[i].material.emissiveIntensity =
        0.35 + acq * (Math.sin(t * 11 + i * 1.7) > 0 ? 2.2 : 0.4);
    fftDC.material.emissiveIntensity = 0.5 + acq * 2.0;

    // ---- 左屏：颗粒逐颗浮现（一张电影 = 一批颗粒）----
    for (const p of particles) {
      const tp = 46 + p.ord * 1.28;
      const on = tt >= tp && tt < 82;
      const fade = on ? sstep(tp, tp + 0.9, tt) * (1 - sstep(80, 82, tt)) : 0;
      p.m.opacity = 0.85 * fade;
      p.m.emissiveIntensity = 1.4 * fade;
    }
    G.micro.emissiveIntensity = 1.0 + acq * 0.7;

    // ---- 右屏：Thon 环由内向外逐圈清晰（账 2 的判片依据）----
    for (const r of rings) {
      const tr = 48 + r.i * 3.6;                 // 外圈更晚出现 = 高分辨信息更难传
      const app = sstep(tr, tr + 2.6, tt) * (1 - sstep(80, 82, tt));
      r.m.opacity = 0.92 * app;
      r.m.emissiveIntensity = 2.4 * app;
    }

    // ---- 等离子清洗台：与采集异步的独立小循环 T2=26 s ----
    const t2 = t % 26;
    G.plasma.emissiveIntensity = 0.15 + (sstep(3, 4.5, t2) - sstep(16, 18, t2)) * 1.9;
    G.plasma.opacity = 0.25 + (sstep(3, 4.5, t2) - sstep(16, 18, t2)) * 0.45;

    // ---- plunge 冷冻站：T3=34 s，慢升 → 急降（1~2 m/s，账 7）----
    const t3 = t % 34;
    const up = sstep(2, 7, t3), down = sstep(20, 20.55, t3), back = sstep(27, 31, t3);
    plunge.userData.rod.position.y = 0.42 * up - 0.55 * down + 0.13 * back;

    // ---- LN₂ 液位：缓慢下降 + 回收补液（账 4 的闭环）----
    const t4 = t % 180;
    const lv = 0.62 - 0.16 * sstep(0, 150, t4) + 0.16 * sstep(152, 168, t4);
    ln2Level.scale.y = lv;
    ln2Level.position.y = 0.42 - (0.62 - lv) / 2;
    // 冷箱指示灯随补液段变亮（液化机在干活）
    cboxLed.material.emissiveIntensity = 0.6 + 2.0 * (sstep(150, 153, t4) - sstep(166, 169, t4));
  };

  /* ==========================================================
   * 14. 穿门契约（§4b）：entry 与 exitZone 必须拉开
   * ========================================================== */
  group.userData.entry = { pos: [0, 0, 8.4], yaw: 0 };          // 落在风淋内侧、面向厅内(-Z)，与出口拉开 6.5 m
  group.userData.exitZone = { pos: [doorX, HZ - 1.0], radius: 1.35 }; // 走回 -X 侧门龛 = 返回玄关
  return group;
}
