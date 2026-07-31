// res-dome-01 —— 农业温室穹顶(地表,⌀26 m ETFE 双层膜 + 网壳)
// 契约:米制;原点=基座中心地面;+Y 上;正面(气闸门廊)朝 +Z;≤5 万面。
// 故事线:ops-printer-01 龙门打印机的「半成穹顶」竣工版——基础环与压载墙
//   就是隔壁打印工地打的;水线接 Rodwell,CO₂ 富集线接 ISRU。
// 核心不做黑盒:玻璃透明,内部三圈梯田与中央灌溉塔从外面直接可读;
//   夜里整穹发暖光(nightMats)——城市地表唯一的"活物灯笼"。
export const meta = {
  id: 'res-dome-01',
  name: '农业温室穹顶',
  name_en: 'Agricultural Greenhouse Dome',
  size_m: 32.3,          // 实测包围盒最大边(validate_unit: z=32.25)
  size_axis: 'width',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  const M = {
    conc:   new THREE.MeshStandardMaterial({ color: 0x9a8468, roughness: 0.95 }),                  // 打印基础环
    concD:  new THREE.MeshStandardMaterial({ color: 0x86735a, roughness: 0.95 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: 0.45, metalness: 0.7 }),
    frame:  new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.55, metalness: 0.55 }),
    white:  new THREE.MeshStandardMaterial({ color: 0xd8dde0, roughness: 0.6 }),
    glass:  new THREE.MeshStandardMaterial({ color: 0xbfe0e8, roughness: 0.08, metalness: 0.05,
      transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    soil:   new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 1.0 }),
    leaf:   new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 0.9 }),
    leafY:  new THREE.MeshStandardMaterial({ color: 0x6a9a45, roughness: 0.9 }),
    tray:   new THREE.MeshStandardMaterial({ color: 0xc8cdd0, roughness: 0.6 }),
    pipe:   new THREE.MeshStandardMaterial({ color: 0x6a8a9a, roughness: 0.5, metalness: 0.5 }),
    hazardY: new THREE.MeshStandardMaterial({ color: 0xc7a03c, roughness: 0.7 }),
    rail:   new THREE.MeshStandardMaterial({ color: 0xc06a28, roughness: 0.6 }),
  };
  const G = {
    warm:  new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0xffd9a0, emissiveIntensity: 0.0 }), // 夜间补光(nightMats 驱动)
    grow:  new THREE.MeshStandardMaterial({ color: 0x2a0a2a, emissive: 0xe85ae8, emissiveIntensity: 0.0 }), // 植物灯
    sign:  new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0 }),
    ledG:  new THREE.MeshStandardMaterial({ color: 0x11220f, emissive: 0x4fe86a, emissiveIntensity: 2.0 }),
  };
  const nightMats = [G.warm, G.grow];

  function box(w, h, d, mat, x, y, z, ry = 0, parent = group) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  }
  function cyl(r1, r2, h, mat, x, y, z, seg = 16, parent = group) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function poi(id, x, y, z) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(x, y, z);
    group.add(a);
  }
  const R = 13;                                        // 穹顶半径

  /* —— 1. 打印基础环 + 压载墙(printer 工地的成果)—— */
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.9, R + 1.2, 1.1, 36, 1, true), M.conc);
  ring.position.y = 0.55;
  group.add(ring);
  const ringTop = new THREE.Mesh(new THREE.TorusGeometry(R + 1.0, 0.35, 8, 36), M.concD);
  ringTop.rotation.x = Math.PI / 2;
  ringTop.position.y = 1.1;
  group.add(ringTop);
  cyl(R + 0.6, R + 0.9, 0.5, M.concD, 0, 0.25, 0, 36); // 内圈台阶
  // 打印层纹(压载墙外面 8 条水平压条)
  for (let k = 0; k < 3; k++) {
    const b = new THREE.Mesh(new THREE.TorusGeometry(R + 1.05 + k * 0.04, 0.06, 6, 36), M.concD);
    b.rotation.x = Math.PI / 2;
    b.position.y = 0.25 + k * 0.35;
    group.add(b);
  }

  /* —— 2. ETFE 玻璃穹壳 + 网壳骨架 —— */
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.glass);
  dome.position.y = 1.1;
  group.add(dome);
  for (let k = 0; k < 3; k++) {                        // 纬向环梁
    const lat = (k + 1) * (Math.PI / 8);
    const rr = R * Math.sin(Math.PI / 2 - lat + Math.PI / 8 * 0);
    const ry = R * Math.cos(lat);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(R * Math.sin(lat + Math.PI / 8), 0.09, 6, 32), M.frame);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = 1.1 + R * Math.cos(lat + Math.PI / 8);
    group.add(hoop);
  }
  for (let k = 0; k < 12; k++) {                       // 经向肋(3 段折线近似)
    const a = (k / 12) * Math.PI * 2;
    for (let s = 0; s < 3; s++) {
      const t1 = (s / 3) * (Math.PI / 2), t2 = ((s + 1) / 3) * (Math.PI / 2);
      const p1 = [Math.sin(t1) * R, Math.cos(t1) * R], p2 = [Math.sin(t2) * R, Math.cos(t2) * R];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, len, 0.12), M.frame);
      const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
      rib.position.set(Math.cos(a) * mx, 1.1 + my, Math.sin(a) * mx);
      rib.rotation.z = -Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
      rib.rotation.y = -a;
      group.add(rib);
    }
  }
  cyl(0.5, 0.7, 0.5, M.steel, 0, 1.1 + R - 0.1, 0, 12); // 顶部通风帽

  /* —— 3. 内部速写(隔玻璃可读):三圈梯田 + 中央灌溉塔 + 旋转喷灌臂 —— */
  for (let t = 0; t < 3; t++) {                        // 梯田环(内高外低)
    const tr = 9.5 - t * 3.2;
    const th = 0.5 + t * 0.55;
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(tr, tr + 0.3, 0.35, 28, 1, true), M.tray);
    bed.position.y = th;
    group.add(bed);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(tr - 0.05, tr - 0.05, 0.1, 28), M.soil);
    soil.position.y = th + 0.14;
    group.add(soil);
    for (let p = 0; p < 16 - t * 4; p++) {             // 作物球
      const a = (p / (16 - t * 4)) * Math.PI * 2 + t * 0.4;
      const g = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + (p % 3) * 0.07, 0),
        p % 2 === 0 ? M.leaf : M.leafY);
      g.position.set(Math.cos(a) * (tr - 0.9), th + 0.42, Math.sin(a) * (tr - 0.9));
      group.add(g);
    }
  }
  cyl(0.35, 0.5, 7.5, M.steel, 0, 3.75, 0, 12);        // 中央灌溉塔
  const boomPivot = new THREE.Group();                 // 旋转喷灌臂(spinner)
  boomPivot.position.set(0, 6.8, 0);
  group.add(boomPivot);
  for (const s of [1, -1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 8.6), M.pipe);
    arm.position.set(0, 0, s * 4.5);
    boomPivot.add(arm);
    for (let n = 0; n < 4; n++) {
      const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), M.pipe);
      drop.position.set(0, -0.28, s * (1.6 + n * 2.0));
      boomPivot.add(drop);
    }
  }
  // 夜间补光灯环(塔上两圈,夜里点亮)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    box(0.35, 0.1, 0.2, k % 2 === 0 ? G.warm : G.grow, Math.cos(a) * 1.2, 6.2, Math.sin(a) * 1.2, -a);
  }
  // 夜光内幕:半透明暖光穹(夜里被 nightMats 拉亮 → 整穹变灯笼)
  const glowShell = new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xffc878,
    emissiveIntensity: 0.0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
  nightMats.push(glowShell);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(R * 0.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glowShell);
  lantern.position.y = 1.0;
  group.add(lantern);

  /* —— 4. 气闸门廊(+Z,E 传送门落点)+ 服务撬块 —— */
  box(4.2, 3.4, 0.5, M.white, 0, 1.7, R + 0.4);        // 门廊端墙(嵌进环)
  box(3.2, 3.0, 3.0, M.white, 0, 1.5, R + 1.9);        // 气闸厅
  box(3.4, 0.3, 3.2, M.steel, 0, 3.1, R + 1.9);        // 顶盖压条
  box(1.5, 2.2, 0.16, M.frame, 0, 1.1, R + 3.42);      // 外门
  box(1.7, 0.4, 0.1, G.sign, 0, 2.7, R + 3.45);        // 发光门牌
  box(0.08, 0.1, 0.1, G.ledG, 0.95, 1.9, R + 3.42);
  for (let i = 0; i < 4; i++) {                        // 门前警示垫
    box(0.5, 0.04, 1.2, i % 2 === 0 ? M.hazardY : M.conc, -0.9 + i * 0.6, 0.06, R + 4.3);
  }
  for (const sx of [-1.9, 1.9]) {                      // 门廊斜撑(格构意思)
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), M.frame);
    st.position.set(sx, 1.3, R + 3.0);
    st.rotation.x = -0.35;
    group.add(st);
  }
  // 服务撬块(-X 侧):水线泵撬 + CO₂ 富集橇 + 管线爬穹
  box(2.2, 1.1, 1.4, M.white, -(R + 2.6), 0.55, -3);
  cyl(0.4, 0.4, 1.3, M.steel, -(R + 2.2), 0.65, -4.6, 14);
  box(0.5, 0.4, 0.06, G.sign, -(R + 2.6), 1.35, -2.2);
  const wline = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 6.0, 8), M.pipe);
  wline.rotation.z = 1.05;
  wline.position.set(-(R - 0.8), 2.6, -3);
  group.add(wline);
  const co2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.4, 8), M.steel);
  co2.rotation.z = 1.15;
  co2.position.set(-(R - 1.2), 2.2, -4.4);
  group.add(co2);

  /* —— 5. POI 锚点 —— */
  poi('shell', 0, 8, R * 0.6);
  poi('ring', R * 0.75, 1.2, R * 0.6);
  poi('terrace', -6, 2.2, 4);
  poi('service', -(R + 2.4), 1.2, -3.6);

  /* —— 6. 声明 —— */
  group.userData.nightMats = nightMats;                // 夜里 emissive 拉起(引擎接管)
  group.userData.spinners = [
    { node: boomPivot, axis: 'y', rpm: 0.5 },          // 喷灌臂缓转(2 min/圈)
  ];
  group.userData.lights = [];                          // 地表资产不加常亮灯
  // 尘膜 pass:涂装材质染一点火星尘
  for (const m of [M.white, M.steel, M.tray]) m.color.lerp(new THREE.Color(0x9e5b3d), 0.05);
  return group;
}
