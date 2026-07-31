// ops-fab-01 —— 地下城芯片厂(洁净室,一厂三线) · v2 质感升级版
// 契约(室内场景 §4b):米制;原点=厅中心地面;入口朝 +Z;引擎平地 y=0。
// 设计真源(知识卡数字全部有锚点):
//   数字线  E:\Claude\mars-bigram   MB-1 sky130 RTL→GDS(die 1660×1080 µm,~2100 单元)
//   模拟线  E:\Claude\mars_spad_rox TSMC CRN65LP(DRC 29 轮/LVS 11 CORRECT/PEX 3/后仿 4)
//   超导线  E:\Claude\quantum-computing QP-20(双角度蒸发结/修调 σ≤0.5%/311 空气桥)
// v2(对齐 qp20_machine 质感基线):光泽 PBR 机身、CatmullRom 弧形线缆束、
//   三条产线主机底座发光环(青=数字/铜=模拟/紫=超导)、RIE 观察窗等离子体辉光、
//   吊顶服务立管、暗色对比布光;POI/门位/entry/exit 与 v1 完全一致。
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
    evapGlow: new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xff8c40, emissiveIntensity: 1.6 }),
    plasma: new THREE.MeshStandardMaterial({ color: 0x1a0a2a, emissive: 0xc06aff, emissiveIntensity: 1.8 }),  // RIE 等离子体
    // 三条产线底座光环
    ringDig: new THREE.MeshStandardMaterial({ color: 0x08202a, emissive: 0x4fd8e8, emissiveIntensity: 1.5,
      transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    ringAna: new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xe8a05a, emissiveIntensity: 1.5,
      transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    ringSC:  new THREE.MeshStandardMaterial({ color: 0x160a2a, emissive: 0xb06aff, emissiveIntensity: 1.5,
      transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
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
  // 3b. 光刻机 v2:雕塑机身(层叠收分)+ 曝光柱 + 反白操作台 + 底座光环
  glowRing(1.7, 2.05, G.ringDig, -7.3, -4.4);
  box(2.6, 0.5, 2.4, M.frame, -7.3, 0.25, -4.6);         // 底盘
  box(2.4, 1.5, 2.2, M.tool, -7.3, 1.25, -4.6);          // 主体一层
  box(2.0, 0.9, 1.8, M.toolB, -7.3, 2.45, -4.7);         // 二层收分
  box(1.0, 1.3, 1.0, M.tool, -7.4, 3.55, -4.8);          // 照明塔
  box(1.06, 0.16, 1.06, M.frame, -7.4, 4.28, -4.8);      // 塔顶檐
  cyl(0.3, 0.4, 1.0, M.toolB, -7.3, 2.0, -3.3, 18);      // 投影镜筒(前伸)
  cyl(0.42, 0.42, 0.14, M.frame, -7.3, 2.55, -3.3, 18);  // 镜筒法兰
  const beam = cyl(0.1, 0.28, 0.55, G.beam, -7.3, 1.3, -3.3, 14, true);
  box(1.1, 0.1, 1.1, M.steel, -7.3, 0.98, -3.3);         // 晶圆台
  cyl(0.2, 0.2, 0.025, M.wafer, -7.3, 1.05, -3.3, 18);
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
  box(0.7, 0.5, 0.5, M.toolB, -8.9, 0.95, -3.1);         // 掩模版库
  box(0.5, 0.04, 0.04, G.ledA, -8.9, 1.24, -2.85);
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
  endEff.position.set(0, 0.13, 1.1);
  armPivot.add(endEff);
  const held = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 18), M.wafer);
  held.position.set(0, 0.16, 1.1);
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
  const tiltStage = box(0.5, 0.04, 0.4, M.copper, 1.2, 2.25, -7.6, 0.5);
  const tiltChip = cyl(0.14, 0.14, 0.03, M.wafer, 1.2, 2.33, -7.52, 14);
  tiltChip.rotation.x = 0.5;
  for (const sx of [-0.22, 0.22]) {
    cyl(0.07, 0.09, 0.1, M.copper, 1.2 + sx, 1.33, -7.6, 10);
    cyl(0.04, 0.05, 0.03, G.evapGlow, 1.2 + sx, 1.39, -7.6, 10);
  }
  cyl(0.14, 0.14, 0.5, M.steel, 2.05, 1.0, -7.6, 12);    // 涡轮泵
  cyl(0.17, 0.17, 0.06, M.frame, 2.05, 1.28, -7.6, 12);
  box(0.5, 0.4, 0.06, G.teal, 0.4, 1.4, -6.95, 0, -0.2);
  tube([[1.2, 2.72, -7.6], [1.3, 3.6, -7.7], [1.6, 4.6, -7.8], [1.7, 5.6, -7.8]], 0.05, M.hose);
  // 5b. RIE 刻蚀机(模拟线,铜环):卧式圆腔 + 等离子体观察窗 + 气路排管
  glowRing(1.35, 1.65, G.ringAna, 4.6, -7.6);
  box(1.7, 0.18, 1.35, M.frame, 4.6, 0.09, -8.15);
  box(1.6, 1.75, 1.2, M.tool, 4.6, 1.06, -8.2);
  const rie = cyl(0.5, 0.5, 0.9, M.chamber, 4.6, 1.15, -7.35, 20);
  rie.rotation.x = Math.PI / 2;
  const rieDoor = cyl(0.56, 0.56, 0.1, M.frame, 4.6, 1.15, -6.9, 20);
  rieDoor.rotation.x = Math.PI / 2;
  const plasmaWin = cyl(0.2, 0.2, 0.05, G.plasma, 4.6, 1.15, -6.83, 14);   // 等离子体辉光窗
  plasmaWin.rotation.x = Math.PI / 2;
  for (let k = 0; k < 6; k++) {                          // 腔门螺栓圈
    const a = (k / 6) * Math.PI * 2;
    box(0.05, 0.05, 0.04, M.steel, 4.6 + Math.cos(a) * 0.5, 1.15 + Math.sin(a) * 0.5, -6.86);
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
  cyl(0.3, 0.34, 0.12, M.toolB, 6.8, 0.95, 1.6, 16);
  cyl(0.19, 0.19, 0.02, M.wafer, 6.8, 1.03, 1.6, 18);
  box(0.12, 0.8, 0.12, M.toolB, 7.35, 1.3, 1.3);
  const lens = cyl(0.09, 0.11, 0.3, M.panel, 7.1, 1.55, 1.55, 12);
  lens.rotation.x = 0.5;
  box(1.5, 0.75, 0.9, M.glass, 6.8, 1.45, 1.6);          // 防振玻璃罩
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
  poi('probe', 6.4, 1.2, 1.6);
  poi('bond', 8.4, 1.1, 4.6);

  /* ==========================================================
   * 7. 尾墙大屏(晶圆图 + MB-1 版图)
   * ========================================================== */
  box(6.4, 3.0, 0.12, M.panel, 2.2, 2.7, -9.1);
  box(6.1, 2.7, 0.06, G.screen, 2.2, 2.7, -9.02);
  const dieMats = [];
  for (let ix = 0; ix < 7; ix++) {
    for (let iy = 0; iy < 7; iy++) {
      const dx = ix - 3, dy = iy - 3;
      if (dx * dx + dy * dy > 10.5) continue;
      const bad = (ix * 31 + iy * 17) % 11 === 0;
      const m = (bad ? G.dieNG : G.dieOK).clone();
      box(0.24, 0.24, 0.03, m, 0.2 + ix * 0.3, 1.75 + iy * 0.3, -8.98);
      if (bad) dieMats.push(m);
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
  ];
  group.userData.oscillators = [
    { node: armPivot, axis: 'y', prop: 'rotation', amp: 1.15, period: 7 },   // 摆臂扫摆
    { node: carriage, axis: 'x', prop: 'position', amp: 1.5, period: 11 },   // 小车沿轨滑移
  ];
  group.userData.animate = (t) => {
    for (let i = 0; i < stepperLeds.length; i++) {
      stepperLeds[i].emissiveIntensity = 0.6 + (Math.sin(t * 2.4 + i * 1.1) > 0.2 ? 1.8 : 0);
    }
    G.beam.opacity = 0.25 + 0.3 * Math.max(0, Math.sin(t * 1.8));
    G.evapGlow.emissiveIntensity = 1.2 + 0.7 * Math.max(0, Math.sin(t * 2.6));
    G.plasma.emissiveIntensity = 1.3 + 0.7 * Math.sin(t * 5.2) * Math.sin(t * 0.9); // 等离子体闪烁
    for (const m of dieMats) m.emissiveIntensity = 1.2 + 0.9 * Math.sin(t * 2.0);
    G.ringDig.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 1.1);
    G.ringAna.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 1.1 + 2.1);
    G.ringSC.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 1.1 + 4.2);
  };
  group.userData.entry = { pos: [0, 0, 6.6], yaw: 0 };
  group.userData.exitZone = { pos: [-6.2, 7.3], radius: 1.2 };
  return group;
}
