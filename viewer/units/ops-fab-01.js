// ops-fab-01 —— 地下城芯片厂(洁净室,一厂三线) · v2 质感升级版
// 契约(室内场景 §4b):米制;原点=厅中心地面;入口朝 +Z;引擎平地 y=0。
// 设计真源(知识卡数字全部有锚点):
//   数字线  E:\Claude\mars-bigram   MB-1 sky130 RTL→GDS(die 1660×1080 µm,~2100 单元)
//   模拟线  E:\Claude\mars_spad_rox TSMC CRN65LP(DRC 29 轮/LVS 11 CORRECT/PEX 3/后仿 4)
//   超导线  E:\Claude\quantum-computing QP-20(双角度蒸发结/修调 σ≤0.5%/311 空气桥)
// v2(对齐 qp20_machine 质感基线):光泽 PBR 机身、CatmullRom 弧形线缆束、
//   三条产线主机底座发光环(青=数字/铜=模拟/紫=超导)、RIE 观察窗等离子体辉光、
//   吊顶服务立管、暗色对比布光;POI/门位/entry/exit 与 v1 完全一致。
// v3(晶圆全流程编舞 + 三台新设备 + callout):
//   - AGV 物流车沿全厂闭环(T=104 s 纯 t 分段时间线,任意 t 跳入成立,首尾闭合):
//     AGV舱→轨道装载口→旋涂→背面出片口→机器人接驳→光刻装载台→曝光→显影
//     →AGV 穿厂→RIE(铰链腔门开合,门关后等离子体点亮)→探针台(晶圆图大屏同步)
//     →划片台(晶圆溶解=切割),空车回充电桩;曝光光束/等离子体/晶圆图
//     由编舞相位门控——因果可读。
//   - 新设备:湿法清洗台(三色药液槽)、CD-SEM 量测柱、离子注入机(源-加速-磁分析-终端)
//   - callout 引线铭板×4(几何版无文字,名字归 POI)、EMO 急停×7、设备铭牌、
//     地面走线槽盖板、FOUP 传递互锁窗、AGV 充电桩;探针罩改三面玻璃留东口。
//   - URL 参数 fabT0=<秒> 平移编舞相位(拍 GIF 用),缺省行为不变。
export const meta = {
  id: 'ops-fab-01',
  name: '地下城芯片厂(洁净室)',
  name_en: 'Undercity Chip Fab (cleanroom)',
  kind: 'interior',
  size_m: 19.6,          // 实测包围盒最大边(validate_unit: x=19.60)
};

export function build(THREE) {
  const group = new THREE.Group();
  const M = {
    floor:  new THREE.MeshStandardMaterial({ color: 0x9ba1a8, roughness: 0.35, metalness: 0.15 }), // 环氧自流平(微光泽)
    aisle:  new THREE.MeshStandardMaterial({ color: 0x6d747c, roughness: 0.4, metalness: 0.15 }),  // 中央通道深色
    tile:   new THREE.MeshStandardMaterial({ color: 0x848a90, roughness: 0.55 }),
    wall:   new THREE.MeshStandardMaterial({ color: 0xdde1e4, roughness: 0.85 }),
    wallDim: new THREE.MeshStandardMaterial({ color: 0xc6ccd0, roughness: 0.9 }),
    hepa:   new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.9 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: 0.4, metalness: 0.75 }),
    frame:  new THREE.MeshStandardMaterial({ color: 0x2e343c, roughness: 0.45, metalness: 0.6 }),  // 深钢
    tool:   new THREE.MeshStandardMaterial({ color: 0xe2e6e9, roughness: 0.3, metalness: 0.25 }),  // 设备白(光泽)
    toolB:  new THREE.MeshStandardMaterial({ color: 0x4c545e, roughness: 0.35, metalness: 0.5 }),  // 设备深灰蓝(光泽)
    panel:  new THREE.MeshStandardMaterial({ color: 0x181b20, roughness: 0.3, metalness: 0.3 }),   // 黑面板(镜面感)
    chamber: new THREE.MeshStandardMaterial({ color: 0xb6bec4, roughness: 0.22, metalness: 0.9, side: THREE.DoubleSide }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb0653a, roughness: 0.3, metalness: 0.9 }),
    hazardY: new THREE.MeshStandardMaterial({ color: 0xc7a03c, roughness: 0.7 }),
    hazardK: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
    glass:  new THREE.MeshStandardMaterial({ color: 0x9fc8d8, roughness: 0.08, metalness: 0.1,
      transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
    yglass: new THREE.MeshStandardMaterial({ color: 0xd8b45a, roughness: 0.08, metalness: 0.1,
      transparent: true, opacity: 0.3, side: THREE.DoubleSide }),
    suit:   new THREE.MeshStandardMaterial({ color: 0xe4e8ea, roughness: 0.8 }),
    wafer:  new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.12, metalness: 0.95 }),
    foupA:  new THREE.MeshStandardMaterial({ color: 0x7c5a9e, roughness: 0.3, transparent: true, opacity: 0.85 }),
    foupB:  new THREE.MeshStandardMaterial({ color: 0x4a7c9e, roughness: 0.3, transparent: true, opacity: 0.85 }),
    cable:  new THREE.MeshStandardMaterial({ color: 0x23272e, roughness: 0.5, metalness: 0.3 }),   // 线缆束
    hose:   new THREE.MeshStandardMaterial({ color: 0x5a6570, roughness: 0.45, metalness: 0.4 }),  // 气路软管
    emoR:   new THREE.MeshStandardMaterial({ color: 0xd42020, roughness: 0.5 }),                   // 急停红钮
    pod:    new THREE.MeshStandardMaterial({ color: 0x7c5a9e, roughness: 0.3, transparent: true, opacity: 0.45, side: THREE.DoubleSide }), // AGV 开顶晶圆舱
  };
  const G = {
    lampW:  new THREE.MeshStandardMaterial({ color: 0x2a2c22, emissive: 0xf2f6ff, emissiveIntensity: 2.0 }),
    lampY:  new THREE.MeshStandardMaterial({ color: 0x2a2612, emissive: 0xffc832, emissiveIntensity: 2.2 }),
    teal:   new THREE.MeshStandardMaterial({ color: 0x0a2a30, emissive: 0x4fd8e8, emissiveIntensity: 2.0 }),
    ledG:   new THREE.MeshStandardMaterial({ color: 0x11220f, emissive: 0x4fe86a, emissiveIntensity: 2.2 }),
    ledA:   new THREE.MeshStandardMaterial({ color: 0x2a1c08, emissive: 0xffb050, emissiveIntensity: 2.0 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x060a0e, emissive: 0x0d1a22, emissiveIntensity: 1.4 }),
    dieOK:  new THREE.MeshStandardMaterial({ color: 0x0d2210, emissive: 0x3fe86a, emissiveIntensity: 1.6 }),
    dieNG:  new THREE.MeshStandardMaterial({ color: 0x2a0808, emissive: 0xff4030, emissiveIntensity: 1.8 }),
    gds1:   new THREE.MeshStandardMaterial({ color: 0x101a2a, emissive: 0x4a7ce8, emissiveIntensity: 1.5 }),
    gds2:   new THREE.MeshStandardMaterial({ color: 0x2a101a, emissive: 0xe84a9e, emissiveIntensity: 1.5 }),
    gds3:   new THREE.MeshStandardMaterial({ color: 0x1a2a10, emissive: 0x9ee84a, emissiveIntensity: 1.5 }),
    sign:   new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0 }),
    beam:   new THREE.MeshStandardMaterial({ color: 0x2a2612, emissive: 0xffdc60, emissiveIntensity: 1.4,
      transparent: true, opacity: 0.5 }),
    evapL:  new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xff8c40, emissiveIntensity: 0.4 }),  // 左蒸发源
    evapR:  new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xff8c40, emissiveIntensity: 0.4 }),  // 右蒸发源
    oxid:   new THREE.MeshStandardMaterial({ color: 0x1a1030, emissive: 0xb08aff, emissiveIntensity: 0.8,
      transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),                            // 原位氧化辉光
    plasma: new THREE.MeshStandardMaterial({ color: 0x1a0a2a, emissive: 0xc06aff, emissiveIntensity: 1.8 }),  // RIE 等离子体
    // 三条产线底座光环
    ringDig: new THREE.MeshStandardMaterial({ color: 0x08202a, emissive: 0x4fd8e8, emissiveIntensity: 1.5,
      transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    ringAna: new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xe8a05a, emissiveIntensity: 1.5,
      transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    ringSC:  new THREE.MeshStandardMaterial({ color: 0x160a2a, emissive: 0xb06aff, emissiveIntensity: 1.5,
      transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    // v3:编舞晶圆缘环 / callout 铭板三产线色 / 湿法台三色药液
    waferGlow: new THREE.MeshStandardMaterial({ color: 0x06282e, emissive: 0x4fd8e8, emissiveIntensity: 1.3 }),
    furn:   new THREE.MeshStandardMaterial({ color: 0x2a1204, emissive: 0xff9a40, emissiveIntensity: 1.6 }),  // 炉膛辉光
    slur:   new THREE.MeshStandardMaterial({ color: 0x0c2030, emissive: 0x9ad8ff, emissiveIntensity: 0.9 }),  // CMP 浆料
    calloutT: new THREE.MeshStandardMaterial({ color: 0x08242a, emissive: 0x4fd8e8, emissiveIntensity: 1.5 }),
    calloutC: new THREE.MeshStandardMaterial({ color: 0x2a1608, emissive: 0xe8a05a, emissiveIntensity: 1.5 }),
    calloutP: new THREE.MeshStandardMaterial({ color: 0x180a2a, emissive: 0xb06aff, emissiveIntensity: 1.5 }),
    beamH:  new THREE.MeshStandardMaterial({ color: 0x2a2612, emissive: 0xffdc60, emissiveIntensity: 1.4,
      transparent: true, opacity: 0.05, depthWrite: false }),                                                 // 光刻光路管(曝光时亮)
    reticle: new THREE.MeshStandardMaterial({ color: 0x10141a, emissive: 0x4a9ee8, emissiveIntensity: 1.3 }), // 在位掩模(按圈换色)
    retHeld: new THREE.MeshStandardMaterial({ color: 0x10141a, emissive: 0xe84a9e, emissiveIntensity: 1.3 }), // 换版臂上的下一层掩模
    liqA:   new THREE.MeshStandardMaterial({ color: 0x2a1a06, emissive: 0xffa030, emissiveIntensity: 0.8 }),  // 食人鱼液(琥珀)
    liqB:   new THREE.MeshStandardMaterial({ color: 0x1c2a26, emissive: 0xbfe8dc, emissiveIntensity: 0.5 }),  // 稀 HF(近透明)
    liqC:   new THREE.MeshStandardMaterial({ color: 0x082228, emissive: 0x4fd8e8, emissiveIntensity: 0.8 }),  // DI 冲洗(青)
  };

  function box(w, h, d, mat, x, y, z, rx = 0, rz = 0, parent = group) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (rz) m.rotation.z = rz;
    parent.add(m);
    return m;
  }
  function cyl(r1, r2, h, mat, x, y, z, seg = 14, open = false, parent = group) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg, 1, open), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  // 弧形线缆/软管束(CatmullRom + Tube)——qp20_machine 同款语汇
  function tube(pts, r, mat, seg = 20) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 6, false), mat);
    group.add(m);
    return m;
  }
  // 设备底座发光环
  function glowRing(rIn, rOut, mat, x, z) {
    const m = new THREE.Mesh(new THREE.RingGeometry(rIn, rOut, 36), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.015, z);
    group.add(m);
    return m;
  }
  // v3 细节语法三件套 ------------------------------------------------
  // qp20 同款 callout:细杆引线 + 发光小铭板(几何版,无文字——名字归 POI 系统)
  function callout(x, yBase, z, h, mat, faceX) {
    box(0.026, h, 0.026, M.frame, x, yBase + h / 2, z);
    box(0.06, 0.06, 0.06, mat, x, yBase + 0.02, z);
    const py = yBase + h + 0.16;
    if (faceX) { box(0.04, 0.36, 0.68, M.panel, x, py, z); box(0.055, 0.26, 0.56, mat, x, py, z); }
    else { box(0.68, 0.36, 0.04, M.panel, x, py, z); box(0.56, 0.26, 0.055, mat, x, py, z); }
  }
  // EMO 急停:黄底板 + 红蘑菇钮(nx/nz 为面法线方向)
  function emo(x, y, z, nx, nz) {
    if (nx) {
      box(0.03, 0.15, 0.15, M.hazardY, x, y, z);
      const b = cyl(0.045, 0.05, 0.05, M.emoR, x + nx * 0.04, y, z, 12);
      b.rotation.z = Math.PI / 2;
    } else {
      box(0.15, 0.15, 0.03, M.hazardY, x, y, z);
      const b = cyl(0.045, 0.05, 0.05, M.emoR, x, y, z + nz * 0.04, 12);
      b.rotation.x = Math.PI / 2;
    }
  }
  // 设备铭牌:黑面板 + 产线色角标
  function plate(x, y, z, chipMat, faceX) {
    if (faceX) { box(0.02, 0.13, 0.3, M.panel, x, y, z); box(0.025, 0.05, 0.07, chipMat, x, y + 0.03, z + 0.1); }
    else { box(0.3, 0.13, 0.02, M.panel, x, y, z); box(0.07, 0.05, 0.025, chipMat, x - 0.1, y + 0.03, z + 0.005); }
  }
  function poi(id, x, y, z) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(x, y, z);
    group.add(a);
  }

  /* ==========================================================
   * 1. 洁净室壳体:净 19×17;墙 5.9 通顶,层流平顶 y5.72
   * ========================================================== */
  box(19.6, 0.3, 17.8, M.floor, 0, -0.14, -0.5);
  box(3.2, 0.302, 17.4, M.aisle, 0, -0.138, -0.5);       // 中央深色通道
  box(0.06, 0.303, 17.4, G.teal, -1.62, -0.137, -0.5);   // 通道导引光带
  box(0.06, 0.303, 17.4, G.teal,  1.62, -0.137, -0.5);
  for (let i = -4; i <= 4; i++) box(0.04, 0.02, 17.2, M.tile, i * 2.2, 0.02, -0.5);
  for (let j = -3; j <= 3; j++) box(19.0, 0.02, 0.04, M.tile, 0, 0.02, j * 2.4 - 0.5);
  box(0.35, 5.9, 17.8, M.wall, -9.55, 2.95, -0.5);
  box(0.35, 5.9, 17.8, M.wall,  9.55, 2.95, -0.5);
  box(19.6, 5.9, 0.35, M.wall, 0, 2.95, -9.35);
  box(7.3, 5.9, 0.35, M.wall, -6.1, 2.95, 8.15);
  box(7.3, 5.9, 0.35, M.wall,  6.1, 2.95, 8.15);
  box(4.9, 2.9, 0.35, M.wallDim, 0, 4.35, 8.15);
  for (const wy of [1.5, 3.0]) {
    box(0.06, 0.08, 17.6, M.wallDim, -9.36, wy, -0.5);
    box(0.06, 0.08, 17.6, M.wallDim,  9.36, wy, -0.5);
    box(19.4, 0.08, 0.06, M.wallDim, 0, wy, -9.16);
  }
  box(19.6, 0.25, 17.8, M.hepa, 0, 5.72, -0.5);
  for (let i = -4; i <= 4; i++) box(0.1, 0.1, 17.4, M.wallDim, i * 2.2, 5.56, -0.5);
  for (let j = -3; j <= 3; j++) box(19.2, 0.1, 0.1, M.wallDim, 0, 5.56, j * 2.4 - 0.5);
  for (const [lx, lz] of [[-6, -5], [-6, 0.5], [2, -5], [2, 0.5], [6.5, -5], [6.5, 0.5], [0, 5.5], [-6, 5.5], [6.5, 5.5]]) {
    const yellow = lx < -2 && lz < 2;
    box(3.0, 0.06, 0.3, yellow ? G.lampY : G.lampW, lx, 5.5, lz);
  }

  /* ==========================================================
   * 2. 入口门组 + 更衣段 + 地表电梯龛(与 v1 同位)
   * ========================================================== */
  box(0.3, 3.0, 0.24, M.frame, -2.15, 1.5, 7.9);
  box(0.3, 3.0, 0.24, M.frame,  2.15, 1.5, 7.9);
  box(4.6, 0.3, 0.24, M.frame, 0, 3.0, 7.9);
  box(1.9, 2.75, 0.14, M.steel, -1.0, 1.38, 7.96);
  box(1.9, 2.75, 0.14, M.steel,  1.0, 1.38, 7.96);
  box(2.6, 0.5, 0.12, G.sign, 0, 3.55, 7.95);
  for (let i = 0; i < 5; i++) {
    box(0.6, 0.02, 1.2, i % 2 === 0 ? M.hazardY : M.hazardK, -1.5 + i * 0.62, 0.03, 6.9);
  }
  box(6.9, 3.2, 0.08, M.glass, -4.75, 1.6, 5.2);
  box(6.9, 3.2, 0.08, M.glass,  4.75, 1.6, 5.2);
  box(0.12, 3.2, 0.12, M.steel, -1.3, 1.6, 5.2);
  box(0.12, 3.2, 0.12, M.steel,  1.3, 1.6, 5.2);
  box(2.6, 0.3, 0.16, M.steel, 0, 3.35, 5.2);
  box(0.7, 0.06, 0.06, G.teal, 0, 3.15, 5.16);
  for (let k = 0; k < 4; k++) {
    const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 4, 10), M.suit);
    s.position.set(-6.8 + k * 0.7, 1.6, 5.65);
    group.add(s);
  }
  box(3.0, 0.06, 0.6, M.steel, -6, 0.45, 6.6);
  for (const bx of [-7.2, -4.8]) box(0.06, 0.45, 0.5, M.frame, bx, 0.22, 6.6);
  box(0.16, 2.7, 2.4, M.frame, -6.2, 1.35, 7.95);
  box(1.0, 2.3, 0.08, M.steel, -6.7, 1.15, 8.02);
  box(1.0, 2.3, 0.08, M.steel, -5.7, 1.15, 8.02);
  box(1.7, 0.35, 0.07, G.sign, -6.2, 2.95, 8.0);

  /* ==========================================================
   * 3. 黄光区:涂胶轨道(四模块) + 光刻机(v2 雕塑机身) + 晶圆盒架
   * ========================================================== */
  box(0.06, 3.4, 10.6, M.yglass, -2, 1.7, -3.9);
  box(0.1, 3.4, 0.1, M.steel, -2, 1.7, 1.3);
  box(0.1, 3.4, 0.1, M.steel, -2, 1.7, -9.1);
  // 3a. 涂胶显影轨道:四段工艺模块(涂胶/软烘/显影/坚膜)彩条区分 + 状态灯条
  box(3.6, 0.18, 1.55, M.frame, -6.6, 0.09, 0.2);        // 底橇
  const trackMods = [
    { x: -8.0, c: M.toolB }, { x: -7.1, c: M.tool }, { x: -6.2, c: M.toolB }, { x: -5.3, c: M.tool }];
  for (const md of trackMods) {
    box(0.82, 1.1, 1.4, md.c, md.x, 0.73, 0.2);
    box(0.82, 0.1, 1.45, M.frame, md.x, 1.32, 0.2);      // 模块顶檐
  }
  box(3.5, 0.04, 0.08, G.teal, -6.65, 1.02, 0.94);       // 前脸状态灯条
  for (const px of [-7.9, -7.1]) {                       // 前置装载口
    cyl(0.22, 0.22, 0.14, M.frame, px, 1.42, 0.62, 14);
    cyl(0.18, 0.18, 0.2, M.foupB, px, 1.6, 0.62, 14);
  }
  box(0.8, 0.55, 0.06, M.glass, -5.7, 0.72, 0.94);       // 旋涂观察窗
  const chuck = new THREE.Group();
  chuck.position.set(-5.7, 0.52, 0.55);
  group.add(chuck);
  const chuckDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 18), M.wafer);
  chuck.add(chuckDisc);
  const chuckMark = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.18), M.copper);
  chuckMark.position.set(0.1, 0.025, 0);
  chuck.add(chuckMark);
  // 轨道 → 吊顶服务立管 + 弧形线缆束
  cyl(0.09, 0.09, 4.3, M.frame, -7.6, 3.5, -0.3, 10);
  tube([[-6.4, 1.4, 0.2], [-6.9, 2.2, -0.1], [-7.5, 3.0, -0.3], [-7.6, 4.4, -0.3]], 0.05, M.cable);
  // v3:轨道背面出片口 + 交接台(编舞中机器人的取放点)
  box(0.44, 0.32, 0.06, M.panel, -5.3, 1.05, -0.51);     // 出片口(坚膜模块背面)
  box(0.24, 0.07, 0.2, M.frame, -5.3, 0.05, -0.55);
  box(0.12, 0.86, 0.12, M.frame, -5.3, 0.5, -0.55);
  box(0.3, 0.05, 0.3, M.steel, -5.3, 0.985, -0.55);      // 交接台面
  callout(-6.6, 1.42, 0.2, 0.7, G.calloutT, true);       // 轨道 callout(数字线青)
  emo(-4.86, 1.0, 0.2, 1, 0);
  plate(-5.3, 1.13, 0.915, G.calloutT, false);
  // 3b. 光刻机 v2:雕塑机身(层叠收分)+ 曝光柱 + 反白操作台 + 底座光环
  glowRing(1.7, 2.05, G.ringDig, -7.3, -4.4);
  box(2.6, 0.5, 2.4, M.frame, -7.3, 0.25, -4.6);         // 底盘
  box(2.4, 1.5, 2.2, M.tool, -7.3, 1.25, -4.6);          // 主体一层
  box(2.0, 0.9, 1.8, M.toolB, -7.3, 2.45, -4.7);         // 二层收分
  box(1.0, 1.3, 1.0, M.tool, -7.4, 3.55, -4.8);          // 照明塔
  box(1.06, 0.16, 1.06, M.frame, -7.4, 4.28, -4.8);      // 塔顶檐
  cyl(0.3, 0.4, 1.0, M.toolB, -7.3, 2.0, -3.3, 18);      // 投影镜筒(前伸)
  cyl(0.42, 0.42, 0.14, M.frame, -7.3, 2.55, -3.3, 18);  // 镜筒法兰
  // v5 光路显形:照明塔出光窗 → 横向光管 → 45° 折镜 → 竖光管 → 掩模 → 镜筒
  // (光管材质曝光相位门控——曝光时整条链路点亮,与晶圆上台同相)
  box(0.26, 0.26, 0.06, G.lampY, -7.3, 3.32, -4.26);     // 塔前脸出光窗
  box(0.09, 0.09, 0.9, G.beamH, -7.3, 3.32, -3.79);      // 横向光管
  const foldMir = box(0.2, 0.2, 0.05, M.panel, -7.3, 3.32, -3.3);   // 45° 折镜
  foldMir.rotation.x = Math.PI / 4;
  box(0.24, 0.06, 0.24, M.frame, -7.3, 3.46, -3.3);      // 折镜罩
  box(0.09, 0.58, 0.09, G.beamH, -7.3, 3.0, -3.3);       // 竖光管(下行进镜筒)
  box(0.26, 0.016, 0.26, G.reticle, -7.3, 2.64, -3.3);   // 在位掩模版(层色按圈交替)
  box(0.05, 0.05, 0.28, M.frame, -7.44, 2.64, -3.3);     // 掩模夹爪×2
  box(0.05, 0.05, 0.28, M.frame, -7.16, 2.64, -3.3);
  const beam = cyl(0.1, 0.28, 0.55, G.beam, -7.3, 1.3, -3.3, 14, true);
  box(1.1, 0.1, 1.1, M.steel, -7.3, 0.98, -3.3);         // 晶圆台(编舞晶圆停靠位,不放静态片)
  // v3:光刻机装载台(机器人放片点)+ callout + EMO + 铭牌
  box(0.24, 0.07, 0.2, M.frame, -7.3, 0.05, -2.65);
  box(0.12, 0.86, 0.12, M.frame, -7.3, 0.5, -2.65);
  box(0.3, 0.05, 0.22, M.steel, -7.3, 0.985, -2.65);
  callout(-7.4, 4.38, -4.8, 0.5, G.calloutT, true);
  emo(-6.08, 1.5, -4.2, 1, 0);
  plate(-6.7, 1.6, -3.49, G.calloutT, false);
  box(0.9, 0.62, 0.06, G.teal, -6.0, 1.75, -4.2, 0, -0.28); // 侧控制屏
  box(0.5, 0.06, 0.3, M.panel, -6.05, 1.28, -4.15, 0, -0.28); // 键盘
  const stepperLeds = [];
  for (let k = 0; k < 5; k++) {
    const led = box(0.05, 0.05, 0.02, G.ledG.clone(), -6.08, 0.55 + k * 0.24, -5.2);
    stepperLeds.push(led.material);
  }
  // 照明塔 → 吊顶弧形脐带缆(双股)
  tube([[-7.4, 4.2, -4.8], [-7.2, 4.9, -4.9], [-6.7, 5.3, -5.0], [-6.4, 5.62, -5.0]], 0.06, M.cable);
  tube([[-7.6, 4.2, -4.7], [-7.8, 4.8, -4.6], [-8.2, 5.2, -4.4], [-8.4, 5.62, -4.3]], 0.045, M.hose);
  // v5 掩模版库(挪至机身装版口正下)+ 换版机械手(升降塔+推送爪,曝光后换版)
  box(0.55, 0.72, 0.4, M.frame, -8.6, 0.35, -4.2);       // 库支座
  box(0.7, 0.5, 0.5, M.toolB, -8.6, 0.95, -4.2);         // 掩模版库
  box(0.5, 0.04, 0.04, G.ledA, -8.6, 1.24, -3.94);
  box(0.06, 0.1, 0.4, M.panel, -8.31, 2.4, -4.2);        // 机身装版口
  box(0.1, 2.7, 0.1, M.frame, -8.72, 1.35, -4.55);       // 换版塔立柱
  const retLift = new THREE.Group();                     // 升降滑块
  retLift.name = 'fab_retLift';
  retLift.position.set(-8.72, 1.28, -4.55);
  group.add(retLift);
  const liftBlk = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), M.toolB);
  retLift.add(liftBlk);
  const liftArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.5), M.steel);
  liftArm.position.set(0, 0, 0.25);
  retLift.add(liftArm);
  const retPush = new THREE.Group();                     // 水平推送爪(把版送进装版口)
  retPush.position.set(0.12, 0, 0.35);
  retLift.add(retPush);
  const gripHead = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.12), M.frame);
  retPush.add(gripHead);
  const heldRet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.014, 0.24), G.retHeld);
  heldRet.position.set(0, -0.04, 0);
  heldRet.visible = false;
  retPush.add(heldRet);
  // 3c. 晶圆盒货架
  box(2.6, 0.06, 0.55, M.steel, -6.5, 1.0, -8.8);
  box(2.6, 0.06, 0.55, M.steel, -6.5, 1.8, -8.8);
  for (let k = 0; k < 6; k++) {
    box(0.34, 0.42, 0.4, k % 2 === 0 ? M.foupA : M.foupB, -7.5 + k * 0.42, k < 3 ? 1.28 : 2.08, -8.8);
  }
  poi('track', -6.6, 1.4, 0.9);
  poi('stepper', -7.0, 2.0, -3.6);

  /* ==========================================================
   * 4. 晶圆传送机器人:滑轨小车(oscillator 平移)+ 双节摆臂
   * ========================================================== */
  box(4.2, 0.14, 0.34, M.frame, -5.4, 0.07, -1.6);       // 地轨
  box(4.2, 0.03, 0.06, M.steel, -5.4, 0.155, -1.72);     // 导轨条
  const carriage = new THREE.Group();                    // 小车(沿轨滑动)
  carriage.position.set(-5.4, 0.17, -1.6);
  group.add(carriage);
  const carBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.4), M.toolB);
  carBase.position.y = 0.09;
  carriage.add(carBase);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 12), M.tool);
  mast.position.y = 0.45;
  carriage.add(mast);
  const armPivot = new THREE.Group();                    // 摆臂关节(yaw 扫摆)
  armPivot.position.set(0, 0.72, 0);
  carriage.add(armPivot);
  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.7), M.steel);
  arm1.position.set(0, 0, 0.32);
  armPivot.add(arm1);
  const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10), M.frame);
  elbow.position.set(0, 0.05, 0.64);
  armPivot.add(elbow);
  const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.5), M.steel);
  arm2.position.set(0, 0.09, 0.86);
  armPivot.add(arm2);
  const endEff = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.025, 0.28), M.toolB);
  endEff.position.set(0, 0.13, 1.05);                    // 臂端半径 1.05:θ=0 对交接台,θ=π 对装载台
  armPivot.add(endEff);
  const held = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 18), M.wafer);
  held.position.set(0, 0.16, 1.05);
  held.visible = false;                                  // 只在编舞搬运段显示
  armPivot.add(held);

  /* ==========================================================
   * 5. 白光区:蒸发台 + RIE(等离子辉光) + 溅射台——各配光环/气路
   * ========================================================== */
  // 5a. 双角度蒸发台(超导线,紫环)
  glowRing(1.25, 1.55, G.ringSC, 1.2, -7.6);
  box(1.6, 0.18, 1.3, M.frame, 1.2, 0.09, -7.6);
  box(1.5, 0.95, 1.2, M.tool, 1.2, 0.66, -7.6);
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 1.5, 22, 1, true, Math.PI * 0.7, Math.PI * 1.6), M.chamber);
  bell.position.set(1.2, 1.9, -7.6);
  group.add(bell);
  cyl(0.62, 0.62, 0.09, M.frame, 1.2, 2.69, -7.6, 22);
  cyl(0.6, 0.6, 0.07, M.chamber, 1.2, 2.62, -7.6, 22);
  // v4 双角度蒸发编舞:样品台绕 z 滚摆 ±0.5 rad 朝向两只蒸发源,交替点亮;
  // 中间充氧辉光 = 原位氧化 1 nm AlOx 势垒——Dolan 工艺三步全部可见
  const tiltPivot = new THREE.Group();
  tiltPivot.name = 'fab_tiltStage';
  tiltPivot.position.set(1.2, 2.25, -7.6);
  group.add(tiltPivot);
  const tsPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), M.copper);
  tiltPivot.add(tsPlate);
  const tsChip = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 14), M.wafer);
  tsChip.position.set(0, 0.035, 0.02);
  tiltPivot.add(tsChip);
  cyl(0.07, 0.09, 0.1, M.copper, 0.98, 1.33, -7.6, 10);  // 左/右蒸发源坩埚
  cyl(0.07, 0.09, 0.1, M.copper, 1.42, 1.33, -7.6, 10);
  cyl(0.04, 0.05, 0.03, G.evapL, 0.98, 1.39, -7.6, 10);
  cyl(0.04, 0.05, 0.03, G.evapR, 1.42, 1.39, -7.6, 10);
  cyl(0.45, 0.45, 1.15, G.oxid, 1.2, 1.95, -7.6, 18, true);  // 原位氧化辉光(充氧时显形)
  cyl(0.14, 0.14, 0.5, M.steel, 2.05, 1.0, -7.6, 12);    // 涡轮泵
  cyl(0.17, 0.17, 0.06, M.frame, 2.05, 1.28, -7.6, 12);
  box(0.5, 0.4, 0.06, G.teal, 0.4, 1.4, -6.95, 0, -0.2);
  tube([[1.2, 2.72, -7.6], [1.3, 3.6, -7.7], [1.6, 4.6, -7.8], [1.7, 5.6, -7.8]], 0.05, M.hose);
  // 5b. RIE 刻蚀机(模拟线,铜环):卧式圆腔 + 等离子体观察窗 + 气路排管
  glowRing(1.35, 1.65, G.ringAna, 4.6, -7.6);
  box(1.7, 0.18, 1.35, M.frame, 4.6, 0.09, -8.15);
  box(1.6, 1.75, 1.2, M.tool, 4.6, 1.06, -8.2);
  const rie = cyl(0.5, 0.5, 0.9, M.chamber, 4.6, 1.15, -7.35, 20, true);   // v3 开口腔:门开可见内部
  rie.rotation.x = Math.PI / 2;
  const rieGlow = cyl(0.42, 0.42, 0.05, G.plasma, 4.6, 1.15, -7.72, 16);   // 腔内等离子体盘
  rieGlow.rotation.x = Math.PI / 2;
  const rieDoor = new THREE.Group();                     // v3 铰链腔门(编舞开合,铰链在 -x 侧)
  rieDoor.name = 'fab_rieDoor';
  rieDoor.position.set(4.04, 1.15, -6.9);
  group.add(rieDoor);
  const doorDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.1, 20), M.frame);
  doorDisc.rotation.x = Math.PI / 2;
  doorDisc.position.set(0.56, 0, 0);
  rieDoor.add(doorDisc);
  const doorWin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 14), G.plasma);  // 门上观察窗
  doorWin.rotation.x = Math.PI / 2;
  doorWin.position.set(0.56, 0, 0.07);
  rieDoor.add(doorWin);
  for (let k = 0; k < 6; k++) {                          // 腔门螺栓圈
    const a = (k / 6) * Math.PI * 2;
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.04), M.steel);
    bolt.position.set(0.56 + Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0.04);
    rieDoor.add(bolt);
  }
  box(0.5, 0.35, 0.5, M.toolB, 4.6, 2.15, -8.2);         // RF 匹配盒
  box(0.05, 0.05, 0.02, G.ledA, 4.15, 1.95, -7.6);
  for (let k = 0; k < 3; k++) {                          // 工艺气路排管(带弯)
    tube([[5.4, 0.4 + k * 0.2, -8.6], [5.6, 1.0 + k * 0.25, -8.5], [5.5, 1.8 + k * 0.3, -8.3],
      [5.2, 2.1 + k * 0.3, -8.2]], 0.025, M.hose, 14);
  }
  cyl(0.06, 0.06, 0.1, M.steel, 5.55, 0.32, -8.6, 8);    // 气瓶阀
  // 5c. 磁控溅射台(α-Ta):立式腔 + 靶法兰 + 冷却盘管
  box(1.5, 0.18, 1.2, M.frame, 7.6, 0.09, -8.1);
  box(1.4, 0.85, 1.1, M.tool, 7.6, 0.6, -8.1);
  cyl(0.45, 0.45, 1.1, M.chamber, 7.6, 1.6, -8.1, 20);
  cyl(0.52, 0.52, 0.12, M.copper, 7.6, 2.2, -8.1, 20);   // Ta 靶法兰
  cyl(0.3, 0.3, 0.08, M.frame, 7.6, 2.3, -8.1, 16);
  tube([[7.15, 1.3, -7.7], [7.0, 1.6, -7.6], [7.15, 1.9, -7.7], [7.3, 2.1, -7.85]], 0.03, M.copper, 16); // 冷却盘管
  box(0.5, 0.4, 0.06, G.teal, 6.7, 1.35, -7.5, 0, -0.2);
  tube([[7.6, 2.36, -8.1], [7.7, 3.4, -8.2], [8.0, 4.6, -8.3], [8.1, 5.6, -8.3]], 0.05, M.hose);
  // v3:白光区 callout + EMO + 铭牌
  callout(0.6, 1.14, -7.15, 1.6, G.calloutP, false);     // 蒸发台(超导线紫)
  callout(4.6, 2.33, -8.2, 0.7, G.calloutC, false);      // RIE(模拟线铜)
  emo(5.15, 1.45, -7.58, 0, 1);
  emo(8.05, 1.0, -7.53, 0, 1);
  plate(4.15, 1.6, -7.59, G.calloutC, false);
  plate(7.15, 0.9, -7.54, G.calloutP, false);
  plate(0.72, 1.0, -6.99, G.calloutP, false);
  poi('evap', 1.2, 1.9, -6.9);
  poi('etch', 5.6, 1.4, -7.2);

  /* ==========================================================
   * 6. 测试与封装区:探针台(玻璃罩) + 划片机 + 键合机
   * ========================================================== */
  box(1.8, 0.1, 1.1, M.frame, 6.8, 0.05, 1.6);           // 探针台底盘
  box(1.7, 0.06, 1.0, M.tool, 6.8, 0.85, 1.6);
  for (const [lx, lz] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) {
    box(0.07, 0.85, 0.07, M.frame, 6.8 + lx, 0.42, 1.6 + lz);
  }
  cyl(0.3, 0.34, 0.12, M.toolB, 6.8, 0.95, 1.6, 16);     // 测试吸盘(编舞晶圆停靠位)
  box(0.12, 0.8, 0.12, M.toolB, 7.35, 1.3, 1.3);
  const lens = cyl(0.09, 0.11, 0.3, M.panel, 7.1, 1.55, 1.55, 12);
  lens.rotation.x = 0.5;
  box(1.4, 0.04, 0.9, M.glass, 6.75, 1.82, 1.6);         // v3 防振罩:顶+三面玻璃,东面留晶圆进出口
  box(0.04, 0.75, 0.9, M.glass, 6.07, 1.45, 1.6);
  box(1.4, 0.75, 0.04, M.glass, 6.75, 1.45, 1.18);
  box(1.4, 0.75, 0.04, M.glass, 6.75, 1.45, 2.02);
  box(0.05, 0.78, 0.05, M.steel, 7.42, 1.44, 1.2);       // 东口边柱
  box(0.05, 0.78, 0.05, M.steel, 7.42, 1.44, 2.0);
  box(0.7, 0.45, 0.05, G.teal, 6.1, 1.6, 0.9, 0, -0.25);
  // 划片机 + 主轴刀片
  box(1.2, 1.0, 0.9, M.tool, 8.6, 0.5, 3.6);
  box(1.25, 0.12, 0.95, M.frame, 8.6, 1.06, 3.6);
  const bladePivot = new THREE.Group();
  bladePivot.position.set(8.25, 1.22, 3.6);
  bladePivot.rotation.z = Math.PI / 2;
  group.add(bladePivot);
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 22), M.steel);
  bladePivot.add(blade);
  box(0.5, 0.04, 0.5, M.toolB, 8.6, 1.14, 3.6);
  box(0.3, 0.04, 0.03, G.lampW, 8.35, 1.5, 3.4);          // 工作灯
  // 键合机
  box(1.2, 0.95, 0.9, M.tool, 8.6, 0.48, 5.6);
  box(0.5, 0.08, 0.3, M.toolB, 8.5, 1.2, 5.6);
  box(0.06, 0.35, 0.06, M.steel, 8.4, 1.35, 5.6);
  box(0.3, 0.2, 0.06, G.ledA, 8.75, 1.35, 5.3);
  plate(8.25, 0.7, 4.06, G.calloutT, false);             // 划片机铭牌
  plate(8.3, 0.65, 6.06, G.calloutT, false);             // 键合机铭牌
  poi('probe', 6.4, 1.2, 1.6);
  poi('bond', 8.4, 1.1, 4.6);

  /* ==========================================================
   * 6b. v3 新设备:AGV 物流车 + 湿法清洗台 + CD-SEM + 离子注入机
   *     + FOUP 传递互锁窗 + 地面走线槽 + 编舞晶圆
   * ========================================================== */
  // AGV 充电桩(编舞起点/巢位)
  box(0.95, 0.024, 0.95, M.toolB, -7.0, 0.032, 1.7);
  box(0.14, 0.55, 0.28, M.frame, -7.62, 0.32, 1.7);
  box(0.03, 0.08, 0.1, G.ledG, -7.54, 0.42, 1.7);
  // AGV 物流车(编舞主角之一,开顶透明晶圆舱)
  const agv = new THREE.Group();
  agv.name = 'fab_agv';
  agv.position.set(-7.0, 0, 1.7);
  group.add(agv);
  box(0.54, 0.08, 0.82, M.frame, 0, 0.12, 0, 0, 0, agv); // 底裙
  box(0.5, 0.24, 0.78, M.toolB, 0, 0.26, 0, 0, 0, agv);  // 车体
  box(0.46, 0.03, 0.7, M.steel, 0, 0.395, 0, 0, 0, agv); // 顶板
  for (const [wx, wz] of [[-0.24, 0.28], [0.24, 0.28], [-0.24, -0.28], [0.24, -0.28]]) {
    const w = cyl(0.09, 0.09, 0.06, M.frame, wx, 0.105, wz, 10, false, agv);
    w.rotation.z = Math.PI / 2;
  }
  const puck = cyl(0.05, 0.06, 0.06, M.panel, 0, 0.32, 0.42, 10, false, agv); // 前向激光避障
  puck.rotation.x = Math.PI / 2;
  box(0.3, 0.03, 0.02, G.teal, 0, 0.2, 0.41, 0, 0, agv); // 前灯带
  box(0.05, 0.06, 0.05, G.ledA, 0.18, 0.44, -0.3, 0, 0, agv); // 信标
  box(0.46, 0.03, 0.46, M.frame, 0, 0.42, 0, 0, 0, agv); // 舱底座
  box(0.44, 0.26, 0.02, M.pod, 0, 0.57, 0.22, 0, 0, agv); // 开顶舱四壁(晶圆从顶部升降)
  box(0.44, 0.26, 0.02, M.pod, 0, 0.57, -0.22, 0, 0, agv);
  box(0.02, 0.26, 0.44, M.pod, 0.22, 0.57, 0, 0, 0, agv);
  box(0.02, 0.26, 0.44, M.pod, -0.22, 0.57, 0, 0, 0, agv);
  for (const [px, pz] of [[-0.22, 0.22], [0.22, 0.22], [-0.22, -0.22], [0.22, -0.22]]) {
    box(0.03, 0.36, 0.03, M.frame, px, 0.61, pz, 0, 0, agv);
  }
  // 编舞晶圆(青色缘环便于全程追踪)
  const heroW = new THREE.Group();
  heroW.name = 'fab_heroWafer';
  heroW.position.set(-7.0, 0.58, 1.7);
  group.add(heroW);
  const heroDisc = cyl(0.19, 0.19, 0.02, M.wafer, 0, 0, 0, 20, false, heroW);
  const heroRing = new THREE.Mesh(new THREE.RingGeometry(0.145, 0.185, 24), G.waferGlow);
  heroRing.rotation.x = -Math.PI / 2;
  heroRing.position.y = 0.013;
  heroW.add(heroRing);
  const cutLines = new THREE.Group();                    // v4 划片:先见切割道,再裂成 die
  heroW.add(cutLines);
  for (const o of [-0.095, 0, 0.095]) {
    const lx = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.014, 0.016), M.frame);
    lx.position.set(0, 0.012, o);
    cutLines.add(lx);
    const lz = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.014, 0.4), M.frame);
    lz.position.set(o, 0.012, 0);
    cutLines.add(lz);
  }
  cutLines.visible = false;
  const diceMat = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.12,
    metalness: 0.95, transparent: true, opacity: 1 });
  const diceSet = new THREE.Group();
  heroW.add(diceSet);
  const diceDies = [];
  for (let gx = 0; gx < 4; gx++) {
    for (let gz = 0; gz < 4; gz++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.014, 0.078), diceMat);
      diceDies.push({ d, ux: gx - 1.5, uz: gz - 1.5 });
      diceSet.add(d);
    }
  }
  diceSet.visible = false;
  // 湿法清洗台(右墙,前脸朝 -x;三色药液槽:食人鱼/稀HF/DI 冲洗)
  const wb = new THREE.Group();
  wb.position.set(8.95, 0, -2.2);
  wb.rotation.y = -Math.PI / 2;
  group.add(wb);
  box(2.0, 0.12, 0.9, M.frame, 0, 0.06, 0, 0, 0, wb);    // 踢脚
  box(2.0, 0.82, 0.85, M.tool, 0, 0.53, 0, 0, 0, wb);    // 柜体
  box(2.05, 0.06, 0.9, M.toolB, 0, 0.94, 0, 0, 0, wb);   // 台面
  const liq = [G.liqA, G.liqB, G.liqC];
  for (let k = 0; k < 3; k++) {
    const tx = -0.62 + k * 0.62;
    box(0.5, 0.09, 0.56, M.steel, tx, 1.0, 0, 0, 0, wb); // 槽沿
    box(0.4, 0.02, 0.46, liq[k], tx, 1.06, 0, 0, 0, wb); // 药液面
  }
  box(2.05, 1.25, 0.08, M.tool, 0, 1.6, -0.42, 0, 0, wb);           // 背板
  box(1.95, 0.65, 0.04, M.glass, 0, 1.62, 0.28, 0.45, 0, wb);       // 通风柜斜拉门
  cyl(0.09, 0.09, 3.3, M.hose, -0.6, 3.85, -0.35, 10, false, wb);   // 排风立管
  cyl(0.05, 0.05, 0.5, M.steel, 0.8, 0.25, 0.2, 8, false, wb);      // 排液管
  box(0.04, 0.04, 0.02, G.ledG, 0.9, 1.15, 0.44, 0, 0, wb);
  plate(8.5, 0.7, -2.95, G.calloutC, true);              // 铭牌/EMO 在前脸(世界坐标,面朝 -x)
  emo(8.47, 0.68, -1.35, -1, 0);
  // CD-SEM 量测柱(电子束线宽量测)
  const sem = new THREE.Group();
  sem.position.set(4.6, 0, 0.5);
  group.add(sem);
  box(1.05, 0.08, 0.95, M.frame, 0, 0.04, 0, 0, 0, sem); // 防振基座
  box(0.95, 0.72, 0.85, M.tool, 0, 0.44, 0, 0, 0, sem);
  box(0.62, 0.5, 0.6, M.toolB, 0, 1.05, 0, 0, 0, sem);   // 样品腔
  const semDoor = cyl(0.16, 0.16, 0.04, M.steel, 0, 1.05, 0.31, 14, false, sem);
  semDoor.rotation.x = Math.PI / 2;
  cyl(0.19, 0.17, 0.55, M.tool, 0, 1.58, 0, 16, false, sem);        // 镜筒
  cyl(0.12, 0.12, 0.3, M.toolB, 0, 2.0, 0, 14, false, sem);
  cyl(0.07, 0.07, 0.18, M.steel, 0, 2.24, 0, 12, false, sem);       // 电子枪
  box(0.22, 0.3, 0.22, M.copper, -0.5, 1.05, 0, 0, 0, sem);         // 离子泵
  const semScr = box(0.4, 0.3, 0.03, G.teal, 0.62, 1.25, 0.15, 0, 0, sem);
  semScr.rotation.y = -0.5;
  // 离子注入机(黄光区后场:胶膜即注入掩模——源柜→加速管→分析磁铁→终端台)
  box(0.62, 1.15, 0.85, M.toolB, -4.35, 0.58, -7.3);     // 离子源柜
  box(0.3, 0.5, 0.3, M.frame, -4.35, 1.4, -7.55);        // 源气柜
  cyl(0.08, 0.08, 0.35, M.copper, -4.22, 1.42, -7.12, 10);          // 源气瓶
  box(0.6, 0.08, 0.02, M.hazardY, -4.35, 1.2, -6.86);    // 高压警示条
  for (let k = 0; k < 3; k++) {                          // 高压绝缘子堆
    const ins = cyl(0.2, 0.2, 0.05, M.tool, -4.02 + k * 0.08, 1.0, -7.3, 12);
    ins.rotation.z = Math.PI / 2;
  }
  const acc = cyl(0.13, 0.13, 0.85, M.chamber, -3.5, 1.0, -7.3, 14);  // 加速管
  acc.rotation.z = Math.PI / 2;
  for (const fx of [-3.72, -3.5, -3.28]) {               // 均压环
    const fin = cyl(0.19, 0.19, 0.04, M.frame, fx, 1.0, -7.3, 14);
    fin.rotation.z = Math.PI / 2;
  }
  box(0.5, 0.8, 0.95, M.frame, -2.95, 1.0, -7.3);        // 分析磁铁轭
  box(0.54, 0.24, 0.55, M.copper, -2.95, 1.38, -7.3);    // 磁铁线圈(上/下)
  box(0.54, 0.24, 0.55, M.copper, -2.95, 0.62, -7.3);
  box(0.58, 1.2, 0.9, M.tool, -2.45, 0.6, -7.3);         // 终端台(晶圆室)
  const impWin = cyl(0.11, 0.11, 0.04, M.panel, -2.45, 1.0, -6.84, 12);
  impWin.rotation.x = Math.PI / 2;
  const impGlow = cyl(0.07, 0.07, 0.04, G.ledG, -2.45, 1.0, -6.82, 10);
  impGlow.rotation.x = Math.PI / 2;
  box(0.05, 0.05, 0.02, G.ledA, -2.3, 1.35, -6.84);
  tube([[-4.35, 1.2, -7.6], [-4.5, 2.5, -7.7], [-4.4, 4.2, -7.7], [-4.35, 5.6, -7.6]], 0.05, M.cable);
  emo(-2.7, 1.05, -6.83, 0, 1);
  plate(-2.45, 0.72, -6.84, G.calloutT, false);
  // FOUP 传递互锁窗(琥珀隔断上,黄光↔白光唯一传片口;绿=可开,琥珀=互锁)
  box(0.3, 0.9, 0.85, M.frame, -2, 1.35, -2.4);
  const ptDoorY = box(0.04, 0.62, 0.58, M.steel, -2.16, 1.33, -2.4);  // v5 黄光侧滑门
  const ptDoorW = box(0.04, 0.62, 0.58, M.steel, -1.84, 1.33, -2.4);  // v5 白光侧滑门
  box(0.03, 0.78, 0.64, M.frame, -2.18, 1.33, -2.98);    // 门袋罩板(门滑入处)
  box(0.03, 0.78, 0.64, M.frame, -1.82, 1.33, -2.98);
  const ptLedY = G.ledA.clone(), ptLedW = G.ledG.clone();// 互锁灯独立材质(亮=本侧门开)
  box(0.02, 0.05, 0.12, ptLedY, -2.17, 1.78, -2.4);
  box(0.02, 0.05, 0.12, ptLedW, -1.83, 1.78, -2.4);
  box(0.4, 0.05, 0.55, M.steel, -2.35, 0.86, -2.4);      // 两侧搁台
  box(0.4, 0.05, 0.55, M.steel, -1.65, 0.86, -2.4);
  const ptFoup = box(0.3, 0.36, 0.34, M.foupB, -1.65, 1.06, -2.4);    // v5 往返传递的 FOUP
  // 地面走线槽盖板(三条干线 + 横筋)
  box(7.4, 0.035, 0.42, M.frame, 4.1, 0.045, -6.5);
  for (let k = 0; k < 6; k++) box(0.07, 0.045, 0.46, M.steel, 1.2 + k * 1.24, 0.048, -6.5);
  box(0.42, 0.035, 5.2, M.frame, 9.0, 0.045, 2.9);
  for (let k = 0; k < 4; k++) box(0.46, 0.045, 0.07, M.steel, 9.0, 0.048, 1.0 + k * 1.3);
  box(0.42, 0.035, 6.4, M.frame, -8.95, 0.045, -3.2);
  for (let k = 0; k < 5; k++) box(0.46, 0.045, 0.07, M.steel, -8.95, 0.048, -5.8 + k * 1.35);
  emo(2.75, 1.4, 7.96, 0, -1);                           // 入口墙全线急停
  // v4 HEPA 层流可视化:十字对板半透光带自顶向下漂移(单向活塞流,~0.7 m/s)
  const airBands = [];
  const airLocs = [[-1.0, -2.5], [1.0, 0.8], [-0.8, 3.0], [0.9, -5.2], [-1.1, -7.0], [1.1, 4.6]];
  for (let k = 0; k < airLocs.length; k++) {
    const m = new THREE.MeshStandardMaterial({ color: 0x0a0c10, emissive: 0xcfe8ff,
      emissiveIntensity: 0.7, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const gband = new THREE.Group();
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.3, 0.015), m);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 1.3, 0.55), m);
    gband.add(p1);
    gband.add(p2);
    gband.position.set(airLocs[k][0], 4.5, airLocs[k][1]);
    group.add(gband);
    airBands.push({ gband, m, ph: k * 0.83 });
  }
  // v4 DRC 收敛点阵屏(模拟线:29 轮违例清零的可视化)——后墙 RIE 与溅射台之间;
  // 5×8 红点按打散次序逐个转绿,清零后铜色边条闪贺,然后重置下一轮
  box(0.78, 0.56, 0.04, M.panel, 6.15, 1.7, -9.12);
  box(0.1, 0.06, 0.05, M.frame, 6.15, 1.36, -9.13);
  const drcBorder = new THREE.MeshStandardMaterial({ color: 0x2a1608, emissive: 0xe8a05a, emissiveIntensity: 0.5 });
  box(0.8, 0.03, 0.045, drcBorder, 6.15, 1.99, -9.12);
  box(0.8, 0.03, 0.045, drcBorder, 6.15, 1.41, -9.12);
  const drcDots = [];
  for (let k = 0; k < 40; k++) {
    const cx = 6.15 + ((k % 8) - 3.5) * 0.088, cy = 1.88 - Math.floor(k / 8) * 0.088;
    const m = new THREE.MeshStandardMaterial({ color: 0x220a08, emissive: 0xff4030, emissiveIntensity: 1.2 });
    box(0.055, 0.055, 0.02, m, cx, cy, -9.09);
    drcDots.push({ m, ord: (k * 17) % 40 });
  }
  poi('wetbench', 8.3, 1.2, -2.2);
  poi('sem', 4.6, 1.6, 1.1);
  poi('implant', -3.5, 1.5, -6.7);
  poi('agv', -7.0, 0.8, 1.7);

  /* ==========================================================
   * 6c. v6 三台新设备:氧化/退火炉管 · LPCVD 沉积炉 · CMP 抛光机
   *     (第 9/10/12 轮工艺账各自的"家")
   * ========================================================== */
  // 炉管(黄光区后墙,三管卧式 + 石英舟装载臂缓慢进出)
  box(2.3, 0.2, 0.85, M.frame, -3.5, 0.1, -8.6);
  box(2.2, 1.5, 0.75, M.tool, -3.5, 0.95, -8.6);
  for (let k = 0; k < 3; k++) {
    const ty = 0.62 + k * 0.42;
    const tq = cyl(0.13, 0.13, 2.3, M.chamber, -3.5, ty, -8.6, 14);
    tq.rotation.z = Math.PI / 2;
    const fl2 = cyl(0.16, 0.16, 0.1, M.frame, -2.38, ty, -8.6, 12);
    fl2.rotation.z = Math.PI / 2;
    const mo2 = cyl(0.1, 0.1, 0.05, G.furn, -2.33, ty, -8.6, 12);
    mo2.rotation.z = Math.PI / 2;
  }
  box(0.5, 0.36, 0.06, G.teal, -4.5, 1.7, -8.2, 0, -0.2); // 温控屏
  box(0.05, 0.05, 0.02, G.ledA, -2.6, 1.75, -8.2);
  const boat = new THREE.Group();                       // 石英舟装载臂
  boat.name = 'fab_boat';
  boat.position.set(-1.85, 1.04, -8.6);
  group.add(boat);
  const paddle = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.14), M.chamber);
  paddle.position.set(-0.5, 0, 0);
  boat.add(paddle);
  for (let k = 0; k < 6; k++) {
    const wf = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 14), M.wafer);
    wf.rotation.z = Math.PI / 2;
    wf.position.set(-0.25 - k * 0.11, 0.06, 0);
    boat.add(wf);
  }
  box(0.12, 0.98, 0.12, M.frame, -1.5, 0.5, -8.6);      // 装载站立柱
  // LPCVD 沉积炉(白光区后墙:冷壁腔+穹顶+三路气源+泵)
  box(1.1, 0.2, 1.0, M.frame, -0.7, 0.1, -8.35);
  box(1.0, 1.0, 0.9, M.tool, -0.7, 0.7, -8.35);
  cyl(0.42, 0.42, 0.5, M.chamber, -0.7, 1.45, -8.35, 20);
  cyl(0.42, 0.26, 0.22, M.chamber, -0.7, 1.81, -8.35, 20);   // 穹顶收分
  cyl(0.26, 0.08, 0.14, M.frame, -0.7, 1.99, -8.35, 14);
  box(0.9, 0.6, 0.1, M.toolB, -0.7, 1.0, -8.88);        // 气源面板
  tube([[-1.0, 1.0, -8.85], [-1.05, 1.5, -8.7], [-0.95, 1.6, -8.5]], 0.022, M.copper, 12);
  tube([[-0.7, 1.05, -8.85], [-0.75, 1.62, -8.66], [-0.7, 1.7, -8.5]], 0.022, M.hose, 12);
  tube([[-0.4, 1.0, -8.85], [-0.35, 1.5, -8.7], [-0.45, 1.6, -8.5]], 0.022, M.steel, 12);
  cyl(0.12, 0.12, 0.45, M.steel, -1.35, 0.85, -8.1, 12); // 真空泵
  box(0.04, 0.04, 0.02, G.ledG, -0.25, 1.35, -7.92);
  plate(-0.7, 0.75, -7.89, G.calloutP, false);
  // CMP 抛光机(右墙湿区,与湿法台成排:转盘+反转载头+浆料点)
  box(1.0, 0.68, 1.1, M.tool, 8.68, 0.34, -4.7);
  const splash = cyl(0.5, 0.5, 0.16, M.steel, 8.68, 0.78, -4.7, 24, true);
  const platen = new THREE.Group();
  platen.name = 'fab_platen';
  platen.position.set(8.68, 0.76, -4.7);
  group.add(platen);
  const plDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 26), M.frame);
  platen.add(plDisc);
  const plPad = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.02, 26),
    new THREE.MeshStandardMaterial({ color: 0x3a4148, roughness: 0.9 }));
  plPad.position.y = 0.04;
  platen.add(plPad);
  box(0.14, 1.1, 0.14, M.steel, 9.05, 0.9, -5.35);      // 载头立柱(靠墙角)
  box(0.7, 0.08, 0.13, M.toolB, 8.85, 1.42, -5.05, 0.6);// 悬臂(斜向盘心)
  const cmpHead = new THREE.Group();
  cmpHead.position.set(8.6, 0.86, -4.78);
  group.add(cmpHead);
  const headD = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 18), M.toolB);
  cmpHead.add(headD);
  cyl(0.05, 0.05, 0.5, M.steel, 8.6, 1.2, -4.78, 10);   // 头轴
  cyl(0.055, 0.055, 0.012, G.slur, 8.45, 0.795, -4.5, 10); // 浆料点
  tube([[8.25, 1.2, -4.35], [8.35, 1.0, -4.42], [8.45, 0.84, -4.5]], 0.02, M.hose, 10);
  box(0.4, 0.3, 0.05, G.teal, 8.2, 1.35, -5.3, 0, 0.5); // 控制屏
  emo(8.2, 0.6, -4.15, -1, 0);
  poi('furnace', -3.5, 1.5, -7.9);
  poi('cvd', -0.7, 1.4, -7.7);
  poi('cmp', 8.15, 1.1, -4.7);

  /* ==========================================================
   * 7. 尾墙大屏(晶圆图 + MB-1 版图)
   * ========================================================== */
  box(6.4, 3.0, 0.12, M.panel, 2.2, 2.7, -9.1);
  box(6.1, 2.7, 0.06, G.screen, 2.2, 2.7, -9.02);
  const dies = [];   // v4:全部 die 独立材质——探针相位逐格点亮(真的在逐 die 测)
  for (let ix = 0; ix < 7; ix++) {
    for (let iy = 0; iy < 7; iy++) {
      const dx = ix - 3, dy = iy - 3;
      if (dx * dx + dy * dy > 10.5) continue;
      const bad = (ix * 31 + iy * 17) % 11 === 0;
      const m = (bad ? G.dieNG : G.dieOK).clone();
      box(0.24, 0.24, 0.03, m, 0.2 + ix * 0.3, 1.75 + iy * 0.3, -8.98);
      dies.push({ m, bad });
    }
  }
  box(2.2, 2.4, 0.05, G.gds1, 4.35, 2.7, -8.99);
  for (const [gx, gy] of [[-0.55, 0.6], [0.55, 0.6], [-0.55, -0.6], [0.55, -0.6]]) {
    box(0.85, 0.9, 0.04, G.gds2, 4.35 + gx, 2.7 + gy, -8.95);
  }
  box(1.9, 0.35, 0.04, G.gds3, 4.35, 2.7, -8.94);
  poi('screen', 2.2, 2.4, -8.4);
  poi('cleanroom', 0, 2.2, 3.4);

  /* ==========================================================
   * 8. 声明:灯光(暗色对比布光) / 动画 / 出入口
   * ========================================================== */
  group.userData.lights = [
    { color: 0xf2f6ff, pos: [4.5, 5.0, -4], range: 16 },
    { color: 0xf2f6ff, pos: [4.5, 5.0, 3], range: 16 },
    { color: 0xf2f6ff, pos: [-4.5, 5.0, 6.2], range: 13 },
    { color: 0xffc040, pos: [-6, 4.8, -2], range: 14 },      // 黄光区
    { color: 0xffc040, pos: [-6, 4.8, -7], range: 12 },
    { color: 0x8ab8ff, pos: [2.2, 3.6, -7.4], range: 7 },    // 白光区冷调补光
    { color: 0xffe8c8, pos: [7.6, 3.2, 2.6], range: 8 },     // 测试角暖工作光
  ];
  group.userData.spinners = [
    { node: chuck, axis: 'y', rpm: 180 },
    { node: bladePivot, axis: 'y', rpm: 240 },
    { node: platen, axis: 'y', rpm: 22 },
    { node: cmpHead, axis: 'y', rpm: -48 },
  ];
  group.userData.oscillators = [
    { node: boat, axis: 'x', prop: 'position', amp: 0.3, period: 26 },  // 石英舟缓慢进出
  ];

  /* ----------------------------------------------------------
   * 晶圆全流程编舞:周期 T=104 s 的纯 t 分段时间线。
   * 不累积状态——机器人/AGV/晶圆/腔门/灯效全部是 tt 的纯函数,
   * 任意 t 跳入成立、首尾闭合。曝光光束、RIE 等离子体、晶圆图
   * 大屏由编舞相位门控:光只在晶圆就位时亮(因果可读)。
   * ---------------------------------------------------------- */
  const TT = 104;
  let T0 = 0;   // fabT0 URL 参数:平移编舞相位(拍 GIF 定起点用)
  try {
    if (typeof location !== 'undefined') {
      T0 = parseFloat(new URLSearchParams(location.search).get('fabT0')) || 0;
    }
  } catch (e) { /* node 校验环境无 location */ }
  const sstep = (a, b, x) => {
    const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return u * u * (3 - 2 * u);
  };
  // AGV 路径关键帧 [t, x, z]:巢位→轨道装载→(黄光区处理时待命)→RIE→测试角→回巢
  const AGV_KF = [
    [0, -7.0, 1.7], [50, -7.0, 1.7], [53, -2.0, 1.95], [55.5, 2.8, 1.3],
    [59.5, 2.8, -6.1], [61, 4.6, -6.15], [72, 4.6, -6.15], [74.5, 7.8, -6.3],
    [78.7, 7.8, 1.6], [79.5, 7.8, 2.6], [94, 7.8, 2.6], [95.5, 5.2, 2.75],
    [97, 5.2, 4.5], [102.5, -7.0, 4.5], [104, -7.0, 1.7],
  ];
  const AGV_H = [];
  for (let i = 0; i < AGV_KF.length - 1; i++) {
    const dx = AGV_KF[i + 1][1] - AGV_KF[i][1], dz = AGV_KF[i + 1][2] - AGV_KF[i][2];
    AGV_H.push(Math.hypot(dx, dz) > 0.01 ? Math.atan2(dx, dz) : null);
  }
  for (let i = 0; i < AGV_H.length; i++) {
    if (AGV_H[i] === null) AGV_H[i] = AGV_H[(i - 1 + AGV_H.length) % AGV_H.length] ?? Math.PI;
  }
  // 机器人关键帧 [t, 小车x, 肩关节θ]:θ=0 臂指 +z(交接台),θ=π 指 -z(装载台)
  const ROB_KF = [
    [0, -6.2, 1.4], [10, -5.3, 0], [17.5, -5.3, 0], [25, -7.3, Math.PI],
    [36.7, -7.3, Math.PI], [43.5, -5.3, 0], [54, -5.6, 0.9], [74, -6.9, 2.2],
    [90, -5.8, 0.7], [104, -6.2, 1.4],
  ];
  // 晶圆关键帧 [t, spec]:spec = [x,y,z] | 'POD'(在 AGV 舱) | 'ARM'(在机器人手上) | null(机内不可见)
  const W_KF = [
    [0, 'POD'], [1.5, 'POD'], [3, [-7.5, 1.5, 1.2]], [4.5, [-7.9, 1.72, 0.62]],
    [6.5, [-7.9, 1.5, 0.62]], [7, null],                          // 进轨道:旋涂(看观察窗吸盘)
    [15, [-5.3, 1.05, -0.3]], [16.5, [-5.3, 1.05, -0.55]],        // 背面出片口滑出
    [17.5, 'ARM'], [25, 'ARM'],                                   // 机器人搬运→光刻装载台
    [25.5, [-7.3, 1.05, -2.65]], [28, [-7.3, 1.05, -3.3]],
    [34, [-7.3, 1.05, -3.3]], [36, [-7.3, 1.05, -2.65]],          // 曝光(光束门控 28~34)
    [36.7, 'ARM'], [43.5, 'ARM'],                                 // 搬回轨道显影
    [44, [-5.3, 1.05, -0.55]], [45.5, [-5.3, 1.05, -0.3]], [46, null],
    [47.5, [-7.9, 1.5, 0.62]], [48.4, [-7.5, 1.5, 1.2]], [49.5, 'POD'],
    [62.5, 'POD'], [63.2, [4.6, 1.15, -6.4]], [64.5, [4.6, 1.15, -7.25]],
    [70, [4.6, 1.15, -7.25]], [70.9, [4.6, 1.15, -6.4]], [71.5, 'POD'], // RIE 进出(腔门开合)
    [81, 'POD'], [81.8, [7.75, 1.3, 1.75]], [82.6, [6.8, 1.03, 1.6]],
    [88.5, [6.8, 1.03, 1.6]], [89.3, [7.75, 1.3, 1.75]], [90, 'POD'],   // 探针台(东口进出)
    [90.6, 'POD'], [91.4, [8.2, 1.5, 2.8]], [92.3, [8.6, 1.18, 3.75]],
    [104, [8.6, 1.18, 3.75]],                                     // 划片台:93.5 起溶解=切割
  ];
  const segIdx = (kfs, tt) => {
    for (let i = 0; i < kfs.length - 1; i++) if (tt < kfs[i + 1][0]) return i;
    return kfs.length - 2;
  };
  // EMO 急停演示(一次性事件走 actions 通道,契约 §4):按下=全厂编舞冻结+红光警示,
  // 8 s 后自动复位。冻结用"暂停累计钟"实现——恢复时编舞从停点继续,无跳变;
  // 不触发时 pauseAcc 恒 0,animate 仍是 t 的纯函数(确定性校验不受影响)。
  let emoReq = false, emoT = -1e9, pauseAcc = 0;
  group.userData.actions = { '急停演示': () => { emoReq = true; } };
  group.userData.animate = (t, dt) => {
    if (emoReq) { emoReq = false; if (t - emoT > 9) emoT = t; }
    const e = t - emoT;
    const fz = Math.max(0, Math.min(1, sstep(0, 0.35, e) - sstep(6.5, 8, e)));  // 1=全停
    pauseAcc += (dt || 0.016) * fz;
    const tc = t - pauseAcc;       // 编舞时钟(急停时冻结,缓释恢复)
    const tt = (tc + T0) % TT;
    // --- AGV:位置 + 朝向(段首 25% 平滑转向) ---
    let i = segIdx(AGV_KF, tt);
    let a = AGV_KF[i], b = AGV_KF[i + 1];
    let s = sstep(a[0], b[0], tt);
    const ax = a[1] + (b[1] - a[1]) * s, az = a[2] + (b[2] - a[2]) * s;
    const hPrev = AGV_H[(i - 1 + AGV_H.length) % AGV_H.length];
    let hd = AGV_H[i] - hPrev;
    hd = ((hd + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    const hk = Math.min(1, (tt - a[0]) / Math.max(0.6, (b[0] - a[0]) * 0.25));
    agv.position.set(ax, 0, az);
    agv.rotation.y = hPrev + hd * hk;
    // --- 机器人:小车 x + 肩关节 θ ---
    i = segIdx(ROB_KF, tt);
    a = ROB_KF[i]; b = ROB_KF[i + 1];
    s = sstep(a[0], b[0], tt);
    carriage.position.x = a[1] + (b[1] - a[1]) * s;
    armPivot.rotation.y = a[2] + (b[2] - a[2]) * s;
    held.visible = (tt >= 17.5 && tt < 25) || (tt >= 36.7 && tt < 43.5);
    // --- 换版机械手(曝光结束、晶圆送显影后的空档换掩模) ---
    const cyc = Math.floor((tc + T0) / TT);              // 圈计数:掩模层色/良率批次都用它
    const lift = Math.max(0, Math.min(1, sstep(46, 48, tt) - sstep(50.5, 52, tt)));
    retLift.position.y = 1.28 + 1.12 * lift;
    const push = Math.max(0, Math.min(1, sstep(48, 49.3, tt) - sstep(50, 50.6, tt)));
    retPush.position.x = 0.12 + 0.29 * push;
    heldRet.visible = tt >= 44.5 && tt < 49.9;           // 版:库中取出→送入装版口即消失
    G.reticle.emissive.setHex(cyc % 2 ? 0xe84a9e : 0x4a9ee8);  // 在位掩模按圈换层色
    G.retHeld.emissive.setHex(cyc % 2 ? 0x4a9ee8 : 0xe84a9e); // 换版臂上恰是下一层
    // --- 编舞晶圆 ---
    const resolve = (p) => (p === 'POD' ? [ax, 0.58, az] : p);
    i = segIdx(W_KF, tt);
    const pa = W_KF[i][1], pb = W_KF[i + 1][1];
    let wPos = null;
    if (pa === null || pb === null || (pa === 'ARM' && pb === 'ARM')) wPos = null;
    else if (pa === 'ARM') wPos = resolve(pb);            // 交接瞬间停在目标点(与臂端重合)
    else if (pb === 'ARM') wPos = resolve(pa);
    else {
      const A = resolve(pa), B = resolve(pb);
      s = sstep(W_KF[i][0], W_KF[i + 1][0], tt);
      wPos = [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s, A[2] + (B[2] - A[2]) * s];
    }
    const sc = tt < 1.2 ? tt / 1.2 : 1;
    heroW.visible = !!wPos && sc > 0.02 && tt < 97;      // 97 后 = 已切割清台
    if (wPos) heroW.position.set(wPos[0], wPos[1], wPos[2]);
    else heroW.position.set(-7.9, 1.1, 0.62);            // 隐藏段固定归位(确定性:任意 t 跳入一致)
    heroW.scale.setScalar(Math.max(0.01, sc));
    // 划片三段:切割道显现(92.6)→ 整片裂成 4×4 die 散开(93.5)→ 淡出(95.5~97)
    const split = sstep(93.5, 96, tt);
    heroDisc.visible = heroRing.visible = tt < 93.5;
    cutLines.visible = tt >= 92.6 && tt < 93.5;
    diceSet.visible = tt >= 93.5 && tt < 97;
    const pitch = 0.095 + split * 0.055;
    for (const dd of diceDies) dd.d.position.set(dd.ux * pitch, 0, dd.uz * pitch);
    diceMat.opacity = 1 - sstep(95.5, 97, tt);
    // 良率分支:每 11 圈一片坏批(≈9%,对上晶圆图口径)——探针判决后缘环转红,切出的 die 发暗
    const badLot = cyc % 11 === 0;
    G.waferGlow.emissive.setHex(badLot && tt >= 84.5 ? 0xff4030 : 0x4fd8e8);
    diceMat.color.setHex(badLot ? 0x9a5a52 : 0x8a9096);
    // --- RIE 铰链腔门(向外摆 109°) ---
    const open = Math.max(0, Math.min(1,
      sstep(61, 62.5, tt) - sstep(64.5, 65.5, tt) + sstep(69, 70, tt) - sstep(71.7, 72.7, tt)));
    rieDoor.rotation.y = -1.9 * open;
    // --- 相位门控灯效:光只在晶圆就位时亮 ---
    const expo = sstep(28.3, 29, tt) - sstep(33.5, 34.2, tt);           // 曝光
    G.beam.opacity = 0.05 + expo * (0.28 + 0.3 * Math.max(0, Math.sin(t * 7)));
    G.beamH.opacity = 0.05 + expo * (0.3 + 0.25 * Math.max(0, Math.sin(t * 7)));  // 整条光路同相点亮
    const pw = sstep(64.8, 65.6, tt) - sstep(69, 69.8, tt);             // 等离子体(门关后点亮)
    G.plasma.emissiveIntensity = 0.35 + pw * (1.5 + 0.8 * Math.abs(Math.sin(t * 5.2) * Math.sin(t * 0.9)));
    // 晶圆图逐 die 点亮:探针落下(82.6)清屏,之后按次序逐格落判决;其余时间保持整图
    for (let k = 0; k < dies.length; k++) {
      const tk = 83 + (k / dies.length) * 4.5;
      const lit = tt < 82.6 || tt >= tk;
      dies[k].m.emissiveIntensity = lit
        ? (dies[k].bad ? 1.5 + 0.6 * Math.sin(t * 2 + k) : 1.5)
        : 0.12;
    }
    // --- 自由呼吸(其余产线各跑各的批次) ---
    for (let k = 0; k < stepperLeds.length; k++) {
      stepperLeds[k].emissiveIntensity = 0.6 + (Math.sin(t * 2.4 + k * 1.1) > 0.2 ? 1.8 : 0);
    }
    // 双角度蒸发独立短循环(T=32 s):倾→蒸Al①→回正→充氧氧化→反倾→蒸Al②→回正
    const t2 = tc % 32;
    tiltPivot.rotation.z = 0.5 * (sstep(0, 3, t2) - sstep(9, 12, t2))
                         - 0.5 * (sstep(17, 20, t2) - sstep(26, 29, t2));
    G.evapL.emissiveIntensity = 0.4 + (sstep(3, 4, t2) - sstep(8, 9, t2)) * (1.6 + 0.6 * Math.max(0, Math.sin(t * 2.6)));
    G.evapR.emissiveIntensity = 0.4 + (sstep(20, 21, t2) - sstep(25, 26, t2)) * (1.6 + 0.6 * Math.max(0, Math.sin(t * 2.6)));
    G.oxid.opacity = 0.3 * (sstep(12, 13.5, t2) - sstep(15.5, 17, t2));
    // HEPA 下洗光带(端点淡入淡出,循环下漂)
    for (const ab of airBands) {
      const u = (t * 0.16 + ab.ph) % 1;
      ab.gband.position.y = 5.1 - u * 4.4;
      ab.m.opacity = 0.1 * Math.sin(Math.PI * u);
    }
    // DRC 收敛屏:22 s 一轮,2~17.6 s 逐点清零,18~21 s 边条闪贺,然后重置
    const t3 = tc % 22;
    for (const dd of drcDots) {
      const ok = t3 >= 2 + dd.ord * 0.4;
      dd.m.emissive.setHex(ok ? 0x3fe86a : 0xff4030);
      dd.m.emissiveIntensity = ok ? 1.5 : 1.0 + 0.3 * Math.sin(t * 3 + dd.ord);
    }
    drcBorder.emissiveIntensity = 0.5 + 2.0 * (sstep(18, 18.6, t3) - sstep(20.5, 21.5, t3));
    // FOUP 传递互锁窗小循环(T=24 s):两侧门永不同开(互锁),FOUP 白→黄→白往返
    const t4 = tc % 24;
    const dW = Math.min(1, Math.max(0, sstep(0, 1.5, t4) - sstep(4, 5.5, t4) + sstep(18, 19.5, t4) - sstep(21.5, 23, t4)));
    const dY = Math.min(1, Math.max(0, sstep(5.5, 7, t4) - sstep(10.5, 12, t4) + sstep(13, 14.5, t4) - sstep(16.5, 18, t4)));
    ptDoorW.position.z = -2.4 - 0.55 * dW;
    ptDoorY.position.z = -2.4 - 0.55 * dY;
    ptLedW.emissiveIntensity = 0.5 + 2.0 * dW;
    ptLedY.emissiveIntensity = 0.5 + 2.0 * dY;
    ptFoup.position.x = -1.65 - 0.35 * (sstep(2, 4, t4) + sstep(7, 10, t4) - sstep(14.5, 16.5, t4) - sstep(19.5, 21.5, t4));
    // 三产线光环:急停时全场转红闪,复位后回产线色呼吸
    if (e >= 0 && e < 8) {
      const fl = 0.5 + 1.7 * Math.abs(Math.sin(t * 6));
      for (const rm of [G.ringDig, G.ringAna, G.ringSC]) {
        rm.emissive.setHex(0xff3020);
        rm.emissiveIntensity = fl * (0.3 + 0.7 * fz);
      }
    } else {
      G.ringDig.emissive.setHex(0x4fd8e8);
      G.ringAna.emissive.setHex(0xe8a05a);
      G.ringSC.emissive.setHex(0xb06aff);
      G.ringDig.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 1.1);
      G.ringAna.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 1.1 + 2.1);
      G.ringSC.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 1.1 + 4.2);
    }
  };
  group.userData.entry = { pos: [0, 0, 6.6], yaw: 0 };
  group.userData.exitZone = { pos: [-6.2, 7.3], radius: 1.2 };
  return group;
}
