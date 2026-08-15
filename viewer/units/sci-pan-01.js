// sci-pan-01 —— MiniPAN 穿透粒子分析仪 v2(卫星载荷)。ORBITAL PAYLOAD——
// 不进 manifest;引擎把它挂到 com-relay-01 主星的天顶(-Z)甲板上。只建模,不做分析。
//
// v2:对照真实机械稿 mPAN_Symetrical_V3 (CATIA V5 装配 STEP) 逐件重建。
// 实测装配数据(自写 AP203 解析器提取,坐标 mm,z=望远镜轴):
//   外壳 FrontBox/BackBox 双半壳 165×165,合缝 z≈+29;
//   微条 9 层分三组:中央 X/Y/X @ -2.32/-1.94/+5.68,
//     外模块 ×2 (X/Y/X) @ ±56.32 / ±67.68 / ±68.06(X 25μm×2048 / Y 400μm×128);
//   磁体环 ×2 @ z=±31:孔径 Ø50 / 环体 Ø70 / 法兰 Ø76(CIRCLE 半径直读);
//   TPX3 像素组件(2×2 quad 拼片,板 120×120)@ ±78;
//   TOF 组件:背框(深 18)+ EJ-230 闪烁体 + DPNC468 SiPM 板 ×2 + 压紧件 ×4
//     + 前框 + 遮光罩,伸到 z≈±107;ECUE 低剖面前端盒 + Firefly 链路贴侧壁;
//   四角 BN613 M6×75 通杆 + Ø6 导销。
// 升级叙事:±56.3 两层换为 4H-SiC LGAD(青灰,E:\Claude\LGAD d17 结构),
//   其余 7 层为在役金黄硅微条;基板上备件盒装在轨换装的飞行备件。
//
// 1 unit = 1 m。原点 = 探测器体心;-y 面朝甲板(引擎侧 rotation.x=-π/2 安装)。
// 动画:userData.animate 纯 t 事件闪(周期 8 s 粒子径迹扫过层叠);
//   TOF 触发灯走 userData.blinkMats(引擎统一节奏,不自驱)。

export const meta = {
  id: 'sci-pan-01',
  name: 'MiniPAN 穿透粒子分析仪',
  name_en: 'MiniPAN Penetrating-particle ANalyser',
  size_m: 0.267,
  size_axis: 'height',
  kind: 'orbital-payload',      // viewer attaches it to one relay satellite
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'sci-pan-01';
  const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const M = {
    alu: L(0x9aa0a6),                                   // machined housing halves
    frame: L(0x83888e),                                 // internal frames / rings
    mli: L(0xb9902f),                                   // gold MLI blankets
    rad: L(0xe3e7e6),                                   // zenith radiator panel
    copper: L(0xb87333),                                // thermal straps
    pcb: L(0x2f6b35),                                   // strip carrier boards
    si: L(0xc9a227, { emissive: 0x3d2e08, emissiveIntensity: 0.35 }),   // Si strips
    sic: L(0x7fa8b5, { emissive: 0x0e3a42, emissiveIntensity: 0.55 }),  // SiC-LGAD
    tpx: L(0x6d3fc4),                                   // TimePix3 quad board
    chip: L(0x2a2d33),                                  // ASIC dies
    magnet: L(0xd96a1e),                                // NdFeB ring bodies
    magsteel: L(0x5b5f66, { side: THREE.DoubleSide }),  // bore / caps (seen inside)
    tof: L(0x2fae72, { emissive: 0x0c3d24, emissiveIntensity: 0.5 }),   // EJ-230
    sipmpcb: L(0x1e3a6e),                               // DPNC468 SiPM boards
    sipm: L(0xd8d8d8),                                  // SiPM windows
    baffle: L(0x33363b),                                // light baffles
    dark: L(0x4c5054),                                  // feet / bolts / cases
    steel: L(0xaeb4ba),                                 // guide pins / latches
    gold: L(0xcfa53a),                                  // SMA connectors
    ledTofA: L(0xff4030, { emissive: 0x7a1008, emissiveIntensity: 0.8 }),
    ledTofB: L(0xff4030, { emissive: 0x7a1008, emissiveIntensity: 0.8 }),
    ledOk: L(0x35d06a, { emissive: 0x0c4a1f, emissiveIntensity: 0.9 }),
    ledHv: L(0xf0b23c, { emissive: 0x5a3c08, emissiveIntensity: 0.9 }),
    foam: L(0x2c2f33),
  };
  const box = (w, h, d, mat, x, y, z, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const cyl = (r, h, mat, x, y, z, seg = 16, parent = g) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = name;
    a.position.set(x, y, z);
    g.add(a);
  };

  // ---------------- housing: two machined halves, 165×165, seam at z=+0.029
  const HW = 0.0825, WT = 0.006, Z0 = -0.058, Z1 = 0.060;
  const hzc = (Z0 + Z1) / 2, hzl = Z1 - Z0;
  box(WT, 2 * HW - 0.006, hzl, M.alu, -HW + WT / 2, 0, hzc);       // -x service wall
  box(2 * HW, WT, hzl, M.alu, 0, HW - WT / 2, hzc);                // +y wall (radiator)
  box(2 * HW, WT, hzl, M.alu, 0, -HW + WT / 2, hzc);               // -y wall
  // +x side left open (cutaway) — three narrow ribs keep the box readable
  for (const rz of [Z0 + 0.006, 0.029, Z1 - 0.006])
    box(WT, 2 * HW - 0.006, 0.010, M.alu, HW - WT / 2, 0, rz);
  // split flange (FrontBox/BackBox joint): proud strips + latches, open on +x
  box(0.171, 0.006, 0.004, M.frame, 0, HW + 0.0015, 0.029);
  box(0.171, 0.006, 0.004, M.frame, 0, -HW - 0.0015, 0.029);
  box(0.006, 0.171, 0.004, M.frame, -HW - 0.0015, 0, 0.029);
  for (const sy of [1, -1]) {                                       // +x corner tabs
    box(0.006, 0.03, 0.004, M.frame, HW + 0.0015, sy * 0.07, 0.029);
    box(0.006, 0.014, 0.018, M.steel, -HW - 0.004, sy * 0.045, 0.029); // latches
  }
  // end bulkheads: square rings with 80 mm apertures (particle entry/exit)
  for (const ez of [Z0 - 0.0025, Z1 + 0.0025]) {
    box(0.165, 0.0425, 0.005, M.frame, 0, 0.0613, ez);
    box(0.165, 0.0425, 0.005, M.frame, 0, -0.0613, ez);
    box(0.0425, 0.080, 0.005, M.frame, 0.0613, 0, ez);
    box(0.0425, 0.080, 0.005, M.frame, -0.0613, 0, ez);
  }
  // corner through-bolts (BN613 M6x75) on the front bulkhead, guide pins aft
  for (const [bx, by] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const b = cyl(0.0035, 0.008, M.dark, bx * 0.0725, by * 0.0725, Z0 - 0.009, 10);
    b.rotation.x = Math.PI / 2;
  }
  for (const s of [1, -1]) {
    const p = cyl(0.003, 0.010, M.steel, s * 0.0725, -s * 0.0625, Z1 + 0.010, 10);
    p.rotation.x = Math.PI / 2;
  }
  // MLI blankets: -x / -y exteriors + aft-half wrap; radiator on +y (zenith)
  box(0.002, 0.158, 0.112, M.mli, -HW - 0.001, 0, hzc);
  box(0.158, 0.002, 0.112, M.mli, 0, -HW - 0.001, hzc);
  box(0.169, 0.002, 0.028, M.mli, 0, HW + 0.004, 0.045);            // aft wrap top
  box(0.002, 0.169, 0.028, M.mli, -HW - 0.004, 0, 0.045);
  box(0.150, 0.003, 0.110, M.rad, 0, HW + 0.0045, -0.003);          // radiator panel
  for (const gx of [-0.045, 0, 0.045])                              // embedded pipes
    box(0.004, 0.0035, 0.104, M.copper, gx, HW + 0.0048, -0.003);

  // ---------------- magnet rings ×2: bore Ø50 / body Ø70 / flange Ø76, z=±31
  for (const s of [1, -1]) {
    const mg = new THREE.Group();
    mg.position.z = s * 0.031;
    g.add(mg);
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.025, 28, 1, true), M.magnet);
    outer.rotation.x = Math.PI / 2;
    mg.add(outer);
    const bore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.025, 24, 1, true), M.magsteel);
    bore.rotation.x = Math.PI / 2;
    mg.add(bore);
    for (const c of [1, -1]) {
      const cap = new THREE.Mesh(new THREE.RingGeometry(0.025, 0.035, 28), M.magsteel);
      cap.position.z = c * 0.0125;
      mg.add(cap);
    }
    const flange = new THREE.Mesh(new THREE.RingGeometry(0.025, 0.038, 28), M.magnet);
    flange.position.z = s * 0.0125 + s * 0.0001;
    mg.add(flange);
    // mounting ears to the walls (real part reaches x=±62.5)
    box(0.024, 0.012, 0.020, M.frame, -0.049, 0, 0, mg);
    box(0.014, 0.012, 0.020, M.frame, 0.042, 0, 0, mg);
    // magnet thermal strap (0.25 mm interface) to the -x wall
    box(0.022, 0.0025, 0.012, M.copper, -0.062, 0.012, 0, mg);
  }

  // ---------------- silicon-strip stack: 9 planes in 3 modules (6X + 3Y)
  // upgrade narrative: the ±56.3 planes are swapped to 4H-SiC LGAD (cyan-grey)
  const planes = [                       // [z, isY, isSiC, stagger index]
    [-0.0681, false, false, 0], [-0.0677, true, false, 1], [-0.0563, false, true, 2],
    [-0.0023, false, false, 0], [-0.0019, true, false, 1], [0.0057, false, false, 2],
    [0.0563, false, true, 2], [0.0677, true, false, 1], [0.0681, false, false, 0],
  ];
  const stripPlaneZ = [];
  for (const [pz, isY, isSiC, k] of planes) {
    const ext = k * 0.004;                              // cutaway edge stagger
    box(0.142 + ext, 0.120, 0.0016, M.pcb, ext / 2, 0, pz);
    box(0.0512, 0.0512, 0.0022, isSiC ? M.sic : M.si, 0, 0, pz);
    box(0.010, 0.006, 0.0035, M.chip, 0.062 + ext, isY ? 0.03 : -0.03, pz); // FE hybrid
    stripPlaneZ.push(pz);
  }
  // module support frames (CentralFrameStrips / ExternalFrameStrips): corner posts
  for (const [mz, ml] of [[-0.0622, 0.020], [0.0017, 0.016], [0.0622, 0.020]])
    for (const [px, py] of [[1, 1], [1, -1], [-1, 1], [-1, -1]])
      box(0.008, 0.008, ml, M.frame, px * 0.066, py * 0.066, mz);
  // Firefly data links + 0.38 mm thermal interface strips to the -x wall
  for (const mz of [-0.0622, 0.0017, 0.0622]) {
    box(0.010, 0.008, 0.014, M.chip, -0.070, 0.044, mz);            // Firefly shell
    box(0.014, 0.0025, 0.010, M.copper, -0.073, -0.050, mz);
  }

  // ---------------- TPX3 pixel assemblies ×2 @ z=±78 (quad 2×2, board 120×120)
  for (const s of [1, -1]) {
    const pz = s * 0.078;
    box(0.165, 0.010, 0.006, M.frame, 0, 0.0775, pz);               // pixel frame ring
    box(0.165, 0.010, 0.006, M.frame, 0, -0.0775, pz);
    box(0.010, 0.145, 0.006, M.frame, -0.0775, 0, pz);
    box(0.010, 0.060, 0.006, M.frame, 0.0775, 0.05, pz);            // open-side stub
    box(0.120, 0.120, 0.002, M.tpx, 0, 0, pz);
    for (const [cx, cy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]])
      box(0.0135, 0.0135, 0.0014, M.chip, cx * 0.0071, cy * 0.0071, pz - s * 0.0017);
    box(0.016, 0.008, 0.005, M.chip, -0.052, -0.045, pz);           // board connector
  }

  // ---------------- TOF assemblies ×2: back frame(18 deep) + scint + SiPM + front
  for (const s of [1, -1]) {
    const tg = new THREE.Group();                       // built at +z; -z copy is
    tg.position.z = s * 0.087;                          // flipped about x (keeps the
    if (s < 0) tg.rotation.x = Math.PI;                 // cutaway side on +x, avoids
    g.add(tg);                                          // negative-scale winding flip
    // back frame: deep ring z -9..+9 local (open +x rib style)
    box(0.165, 0.008, 0.018, M.alu, 0, 0.0785, 0, tg);
    box(0.165, 0.008, 0.018, M.alu, 0, -0.0785, 0, tg);
    box(0.008, 0.149, 0.018, M.alu, -0.0785, 0, 0, tg);
    box(0.008, 0.050, 0.018, M.alu, 0.0785, -0.05, 0, tg);
    // scintillator EJ-230 84×84×6 + two DPNC468 SiPM boards on ±y edges
    box(0.084, 0.084, 0.006, M.tof, 0, 0, 0.001, tg);
    for (const e of [1, -1]) {
      box(0.070, 0.010, 0.014, M.sipmpcb, 0, e * 0.049, 0.001, tg);
      for (const cx of [-0.02, 0, 0.02])
        box(0.006, 0.0035, 0.0025, M.sipm, cx, e * 0.0435, 0.001, tg);
    }
    // presser clips (PresserSys ×4) + aluminium presser bars
    for (const [px, py] of [[0.0177, 0], [-0.0177, 0], [0, 0.0177], [0, -0.0177]])
      box(0.012, 0.005, 0.004, M.steel, px, py, 0.0055, tg);
    // front frame plate ring
    box(0.165, 0.0425, 0.005, M.frame, 0, 0.0613, 0.0115, tg);
    box(0.165, 0.0425, 0.005, M.frame, 0, -0.0613, 0.0115, tg);
    box(0.0425, 0.080, 0.005, M.frame, 0.0613, 0, 0.0115, tg);
    box(0.0425, 0.080, 0.005, M.frame, -0.0613, 0, 0.0115, tg);
    // light baffle hood: skirt + face plate with 70 mm square aperture
    for (const [bw, bh, bx, by] of [[0.153, 0.004, 0, 0.0745], [0.153, 0.004, 0, -0.0745],
                                    [0.004, 0.145, 0.0745, 0], [0.004, 0.145, -0.0745, 0]])
      box(bw, bh, 0.007, M.baffle, bx, by, 0.0165, tg);
    for (const [bw, bh, bx, by] of [[0.153, 0.0415, 0, 0.0558], [0.153, 0.0415, 0, -0.0558],
                                    [0.0415, 0.070, 0.0558, 0], [-0.0415, 0.070, -0.0558, 0]])
      box(Math.abs(bw), bh, 0.003, M.baffle, bx, by, 0.0195, tg);
    // TOF trigger LED (blinkMats — engine-driven pulse)
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 10, 8),
      s > 0 ? M.ledTofA : M.ledTofB);
    led.position.set(0.0785, 0.070, 0);
    tg.add(led);
  }

  // ---------------- front-end electronics: ECUE cases + harness on -x wall
  for (const [i, ez] of [-0.030, 0, 0.030].entries()) {
    box(0.014, 0.024, 0.017, M.dark, -HW - 0.009, -0.022, ez);
    box(0.002, 0.020, 0.013, M.steel, -HW - 0.017, -0.022, ez);     // latch face
    if (i === 1) box(0.004, 0.004, 0.004, M.ledOk, -HW - 0.018, -0.010, ez);
  }
  box(0.004, 0.008, 0.096, M.chip, -HW - 0.006, -0.048, 0.002);     // cable conduit
  for (const [sy, sz] of [[0.030, Z1 + 0.006], [0.048, Z1 + 0.006]]) {
    const sma = cyl(0.0028, 0.009, M.gold, -0.058, sy, sz, 10);
    sma.rotation.x = Math.PI / 2;
  }
  box(0.004, 0.004, 0.004, M.ledHv, -HW - 0.004, 0.060, Z1 - 0.010); // HV status

  // ---------------- mounting: baseplate + legs + spare-kit shelf (deck at y=-0.18)
  box(0.165, 0.005, 0.135, M.dark, 0, -0.1275, 0);
  for (const [lx, lz] of [[0.06, 0.06], [-0.06, 0.06], [0.06, -0.06], [-0.06, -0.06]]) {
    box(0.012, 0.05, 0.012, M.dark, lx, -0.155, lz);
    box(0.020, 0.005, 0.020, M.dark, lx, -0.1775, lz);
  }
  box(0.100, 0.005, 0.062, M.dark, 0.020, -0.1275, -0.113);         // shelf extension
  for (const lx of [0.055, -0.015]) {
    box(0.010, 0.05, 0.010, M.dark, lx, -0.155, -0.132);
    box(0.016, 0.005, 0.016, M.dark, lx, -0.1775, -0.132);
  }

  // spare-kit box: flight spares for on-orbit layer swap (2× SiC-LGAD + 1× Si)
  {
    const kit = new THREE.Group();
    kit.position.set(0.020, -0.125, -0.113);
    g.add(kit);
    box(0.076, 0.006, 0.056, M.alu, 0, 0, 0, kit);
    box(0.076, 0.020, 0.003, M.alu, 0, 0.013, -0.0265, kit);        // walls
    box(0.076, 0.020, 0.003, M.alu, 0, 0.013, 0.0265, kit);
    box(0.003, 0.020, 0.056, M.alu, -0.0365, 0.013, 0, kit);
    box(0.003, 0.020, 0.056, M.alu, 0.0365, 0.013, 0, kit);
    const lid = box(0.076, 0.002, 0.054, M.alu, 0, 0.030, -0.052, kit);
    lid.rotation.x = -1.95;                                          // hinged open
    box(0.068, 0.008, 0.048, M.foam, 0, 0.007, 0, kit);             // foam insert
    const wafers = [[M.sic, -0.012], [M.sic, 0.000], [M.si, 0.012]];
    for (const [wm, wz] of wafers) {
      const w = box(0.052, 0.0015, 0.052, wm, 0, 0.030, wz, kit);
      w.rotation.x = -0.35;                                          // leaning display
    }
  }

  // ---------------- event flash: one particle track sweeps the stack every 8 s
  // (pure-t deterministic; bend between the magnet rings tells the spectrometer
  // story: straight in, curved in the field region, kinked out)
  const hitPlanes = stripPlaneZ.concat([-0.078, 0.078, -0.088, 0.088]);
  const XIN = -0.008, ZB = 0.033, KOUT = 0.18, A = KOUT / (2 * ZB);
  const pathX = (z) => z < -ZB ? XIN
    : z < ZB ? XIN + A * (z + ZB) * (z + ZB) / 2
    : XIN + A * (2 * ZB) * (2 * ZB) / 2 + KOUT * (z - ZB);
  const pathS = (z) => z < -ZB ? 0 : z < ZB ? A * (z + ZB) : KOUT;
  const hitMats = [], hitT = [];
  const ZA = -0.115, ZSPAN = 0.230, TFLY = 0.5, TPER = 8;
  for (const hz of hitPlanes) {
    const hm = new THREE.MeshLambertMaterial({ color: 0x9ff0ff, emissive: 0x9ff0ff,
      emissiveIntensity: 0, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(0.007, 0.007), hm);
    q.position.set(pathX(hz), 0.004, hz + (hz > 0 ? 0.0022 : -0.0022));
    g.add(q);
    hitMats.push(hm);
    hitT.push(TFLY * (hz - ZA) / ZSPAN);
  }
  const tracerMat = new THREE.MeshLambertMaterial({ color: 0xdffbff,
    emissive: 0xbdf6ff, emissiveIntensity: 1.6 });
  const tracer = new THREE.Mesh(new THREE.BoxGeometry(0.0028, 0.0028, 0.022), tracerMat);
  tracer.position.set(XIN, 0.004, ZA);
  tracer.visible = false;
  g.add(tracer);

  g.userData.animate = (t) => {
    const tt = t % TPER;
    if (tt < TFLY) {
      const z = ZA + ZSPAN * (tt / TFLY);
      tracer.visible = true;
      tracer.position.set(pathX(z), 0.004, z);
      tracer.rotation.y = -Math.atan(pathS(z));
    } else {
      tracer.visible = false;
    }
    for (let i = 0; i < hitMats.length; i++) {
      const k = Math.max(0, 1 - Math.max(0, tt - hitT[i]) * 5)
        * (tt >= hitT[i] ? 1 : 0);
      hitMats[i].emissiveIntensity = k;
      hitMats[i].opacity = k * 0.9;
    }
  };
  g.userData.blinkMats = [M.ledTofA, M.ledTofB];

  // ---------------- knowledge-card anchors (orbit-view inspect tier)
  poi('poi_pan_mag', 0, 0, 0.031);
  poi('poi_pan_struct', 0, 0.085, 0.029);
  poi('poi_pan_tof', 0, 0, -0.095);
  poi('poi_pan_lgad', 0.035, 0, 0.0563);
  poi('poi_pan_sep', 0, 0, 0.105);
  poi('poi_pan_net', -0.095, -0.022, 0);

  return g;
}
