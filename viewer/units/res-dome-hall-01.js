// res-dome-hall-01 —— 温室穹顶内部(⌀24 净空,三圈梯田 + 中央灌溉塔)
// 契约(室内场景 §4b):米制;原点=穹心地面;入口(气闸内门)朝 +Z;引擎平地 y=0。
// 室内无真日光:穹壳内衬「天光膜」低发光模拟透膜天色,补光塔为主光源。
// 核心不做黑盒:梯田内高外低(采光互不遮挡的几何原因直接可见),
//   灌溉臂在头顶缓转,水路从塔顶分配到每一圈;土槽端头切开露出土层剖面。
export const meta = {
  id: 'res-dome-hall-01',
  name: '温室穹顶内部',
  name_en: 'Greenhouse Dome Hall',
  kind: 'interior',
  size_m: 26.2,          // 实测包围盒最大边(validate 后回填)
};

export function build(THREE) {
  const group = new THREE.Group();
  const M = {
    floor:  new THREE.MeshStandardMaterial({ color: 0x8a7663, roughness: 0.9 }),                   // 压实土路
    path:   new THREE.MeshStandardMaterial({ color: 0xb0a48e, roughness: 0.85 }),                  // 步道
    conc:   new THREE.MeshStandardMaterial({ color: 0x9a8468, roughness: 0.95 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: 0.45, metalness: 0.7 }),
    frame:  new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.55, metalness: 0.55 }),
    white:  new THREE.MeshStandardMaterial({ color: 0xd8dde0, roughness: 0.6 }),
    tray:   new THREE.MeshStandardMaterial({ color: 0xc8cdd0, roughness: 0.6 }),
    soil:   new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 1.0 }),
    soilDeep: new THREE.MeshStandardMaterial({ color: 0x3a2c20, roughness: 1.0 }),
    gravel: new THREE.MeshStandardMaterial({ color: 0x6a6258, roughness: 0.95 }),
    leaf:   new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 0.9 }),
    leafY:  new THREE.MeshStandardMaterial({ color: 0x6a9a45, roughness: 0.9 }),
    leafD:  new THREE.MeshStandardMaterial({ color: 0x2e5c2a, roughness: 0.9 }),
    tomato: new THREE.MeshStandardMaterial({ color: 0xc44a30, roughness: 0.7 }),
    pipe:   new THREE.MeshStandardMaterial({ color: 0x6a8a9a, roughness: 0.5, metalness: 0.5 }),
    rail:   new THREE.MeshStandardMaterial({ color: 0xc06a28, roughness: 0.6 }),
    hazardY: new THREE.MeshStandardMaterial({ color: 0xc7a03c, roughness: 0.7 }),
    hazardK: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
  };
  const G = {
    skyMem: new THREE.MeshStandardMaterial({ color: 0x1a2126, emissive: 0xbfd8e8,
      emissiveIntensity: 0.55, side: THREE.BackSide }),                                            // 天光膜(内衬)
    warm:  new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0xffd9a0, emissiveIntensity: 2.2 }),
    grow:  new THREE.MeshStandardMaterial({ color: 0x2a0a2a, emissive: 0xe85ae8, emissiveIntensity: 2.0 }),
    teal:  new THREE.MeshStandardMaterial({ color: 0x0a2a30, emissive: 0x4fd8e8, emissiveIntensity: 2.0 }),
    sign:  new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0 }),
    ledG:  new THREE.MeshStandardMaterial({ color: 0x11220f, emissive: 0x4fe86a, emissiveIntensity: 2.0 }),
  };

  function box(w, h, d, mat, x, y, z, ry = 0, parent = group) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  }
  function cyl(r1, r2, h, mat, x, y, z, seg = 16, open = false, parent = group) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg, 1, open), mat);
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
  const R = 12;                                        // 净空半径

  /* —— 1. 地面 + 穹壳内衬(天光膜)+ 网壳骨架内视 —— */
  cyl(R + 1, R + 1.2, 0.3, M.floor, 0, -0.14, 0, 36);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R + 0.8, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), G.skyMem);
  shell.position.y = 0.2;
  group.add(shell);
  for (let k = 0; k < 12; k++) {                       // 经向肋(内视,2 段)
    const a = (k / 12) * Math.PI * 2;
    for (let s = 0; s < 2; s++) {
      const t1 = (s / 2) * (Math.PI / 2), t2 = ((s + 1) / 2) * (Math.PI / 2);
      const p1 = [Math.sin(t1) * (R + 0.55), Math.cos(t1) * (R + 0.55)];
      const p2 = [Math.sin(t2) * (R + 0.55), Math.cos(t2) * (R + 0.55)];
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.1, len, 0.1), M.frame);
      rib.position.set(Math.cos(a) * (p1[0] + p2[0]) / 2, 0.2 + (p1[1] + p2[1]) / 2, Math.sin(a) * (p1[0] + p2[0]) / 2);
      rib.rotation.z = -Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
      rib.rotation.y = -a;
      group.add(rib);
    }
  }
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(R * 0.72, 0.08, 6, 32), M.frame);
  hoop.rotation.x = Math.PI / 2;
  hoop.position.y = 0.2 + (R + 0.55) * Math.cos(Math.PI / 4) - 0.6;
  group.add(hoop);
  // 十字步道(压条)+ 环道
  box(1.6, 0.06, 2 * R, M.path, 0, 0.03, 0);
  box(2 * R, 0.06, 1.6, M.path, 0, 0.03, 0);
  const walk = new THREE.Mesh(new THREE.TorusGeometry(R - 1.2, 0.5, 4, 36), M.path);
  walk.rotation.x = Math.PI / 2;
  walk.position.y = 0.02;
  walk.scale.set(1, 1, 0.1);
  group.add(walk);

  /* —— 2. 三圈梯田(内高外低)+ 作物 + 端头土层剖面 —— */
  // 每环 = 4 段圆弧(十字走廊处留豁口);土面用环带(RingGeometry 弧段),不再是实心盘
  const GAP = 0.16;                                    // 走廊半宽(弧度)
  for (let t = 0; t < 3; t++) {
    const tr = 9.0 - t * 3.0;                          // 名义半径
    const th = 0.45 + t * 0.55;                        // 内圈更高
    for (let q = 0; q < 4; q++) {
      const a0 = q * Math.PI / 2 + GAP, aLen = Math.PI / 2 - 2 * GAP;
      const outerW = new THREE.Mesh(
        new THREE.CylinderGeometry(tr + 0.55, tr + 0.7, th, 12, 1, true, a0, aLen), M.conc);
      outerW.position.y = th / 2;
      group.add(outerW);
      const innerW = new THREE.Mesh(
        new THREE.CylinderGeometry(tr - 1.4, tr - 1.5, th, 12, 1, true, a0, aLen), M.conc);
      innerW.position.y = th / 2;
      group.add(innerW);
      const soil = new THREE.Mesh(
        new THREE.RingGeometry(tr - 1.4, tr + 0.55, 12, 1, a0 + Math.PI / 2, aLen), M.soil);
      soil.rotation.x = -Math.PI / 2;
      soil.position.y = th + 0.01;
      group.add(soil);
    }
    for (let p = 0; p < 26 - t * 6; p++) {             // 两品种作物 + 番茄点缀(避开走廊)
      const a = (p / (26 - t * 6)) * Math.PI * 2 + t * 0.5;
      if (Math.abs(Math.sin(a)) < 0.2 || Math.abs(Math.cos(a)) < 0.2) continue;
      const rr = tr - 0.45;
      const kind = p % 3;
      const g = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 + kind * 0.06, 0),
        kind === 0 ? M.leaf : kind === 1 ? M.leafY : M.leafD);
      g.position.set(Math.cos(a) * rr, th + 0.28, Math.sin(a) * rr);
      group.add(g);
      if (kind === 2) {
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), M.tomato);
        f.position.set(Math.cos(a) * rr + 0.16, th + 0.2, Math.sin(a) * rr);
        group.add(f);
      }
    }
  }
  // 端头剖面(外圈梯田被步道切开处):土/砾石/防渗层三色断面
  for (const sa of [0.07, Math.PI - 0.07]) {
    const cx = Math.cos(sa) * 9.0, cz = Math.sin(sa) * 9.0;
    box(0.16, 0.5, 1.3, M.soilDeep, cx * 1.0, 0.28, cz, -sa);
    box(0.14, 0.22, 1.26, M.gravel, cx * 1.0 + 0.02, 0.13, cz, -sa);
    box(0.13, 0.06, 1.24, M.frame, cx * 1.0 + 0.03, 0.04, cz, -sa);
  }
  poi('terrace', 5.5, 1.2, 3);
  poi('soil', 9.0, 0.8, 1.2);

  /* —— 3. 中央灌溉塔 + 旋转喷灌臂 + 补光环 + 控制柱 —— */
  cyl(0.35, 0.55, 7.0, M.steel, 0, 3.5, 0, 14);
  cyl(0.5, 0.5, 0.5, M.pipe, 0, 7.1, 0, 12);           // 塔顶水箱
  const boomPivot = new THREE.Group();
  boomPivot.position.set(0, 6.4, 0);
  group.add(boomPivot);
  for (const s of [1, -1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 8.8), M.pipe);
    arm.position.set(0, 0, s * 4.6);
    boomPivot.add(arm);
    for (let n = 0; n < 4; n++) {
      const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), M.pipe);
      drop.position.set(0, -0.32, s * (1.5 + n * 2.1));
      boomPivot.add(drop);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 8), M.steel);
      head.position.set(0, -0.66, s * (1.5 + n * 2.1));
      head.rotation.x = Math.PI;
      boomPivot.add(head);
    }
  }
  for (let k = 0; k < 8; k++) {                        // 补光环(暖/洋红相间)
    const a = (k / 8) * Math.PI * 2;
    box(0.4, 0.12, 0.22, k % 2 === 0 ? G.warm : G.grow, Math.cos(a) * 1.3, 5.8, Math.sin(a) * 1.3, -a);
  }
  box(0.5, 1.2, 0.4, M.white, 1.1, 0.6, -0.9);         // 控制柱
  box(0.36, 0.3, 0.05, G.teal, 1.1, 1.05, -0.66);
  poi('tower', 0, 3.5, 1.5);

  /* —— 4. 授粉与环控角(风振授粉扇 + CO₂ 释放头 + 温湿度桩) —— */
  const fanPivot = new THREE.Group();
  fanPivot.position.set(-6.5, 2.0, -6.5);
  group.add(fanPivot);
  cyl(0.08, 0.1, 1.9, M.frame, -6.5, 0.95, -6.5, 8);   // 扇立杆
  for (let k = 0; k < 3; k++) {
    const arm = new THREE.Group();
    arm.rotation.y = (k / 3) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.4), M.white);
    blade.position.set(0, 0, 0.24);
    arm.add(blade);
    fanPivot.add(arm);
  }
  for (const [px, pz] of [[6.5, -6.5], [-6.5, 6.5]]) { // CO₂ 释放头 ×2
    cyl(0.05, 0.05, 1.4, M.steel, px, 0.7, pz, 8);
    cyl(0.12, 0.09, 0.22, M.pipe, px, 1.5, pz, 10);
  }
  for (const [px, pz] of [[4, 7], [-7, -2]]) {         // 温湿度桩
    cyl(0.03, 0.03, 1.1, M.steel, px, 0.55, pz, 6);
    box(0.14, 0.2, 0.1, M.white, px, 1.2, pz);
    box(0.08, 0.04, 0.02, G.ledG, px, 1.28, pz + 0.06);
  }
  poi('pollination', -6.0, 1.6, -6.0);
  poi('env', 6.0, 1.2, -6.0);

  /* —— 5. 气闸内门(+Z,回地表)—— */
  box(3.0, 3.0, 0.4, M.white, 0, 1.5, R - 0.4);
  box(1.5, 2.2, 0.16, M.frame, 0, 1.1, R - 0.62);
  box(1.7, 0.4, 0.1, G.sign, 0, 2.7, R - 0.66);
  for (let i = 0; i < 4; i++) {
    box(0.5, 0.03, 1.0, i % 2 === 0 ? M.hazardY : M.hazardK, -0.9 + i * 0.6, 0.05, R - 1.6);
  }

  /* —— 6. 声明 —— */
  group.userData.lights = [
    { color: 0xfff2dc, pos: [0, 8.5, 0], range: 30 },   // 穹心主光(拟日)
    { color: 0xffe0b8, pos: [6, 4.5, 6], range: 14 },
    { color: 0xffe0b8, pos: [-6, 4.5, -6], range: 14 },
    { color: 0xe86ae8, pos: [0, 5.6, 3], range: 8 },    // 补光环洋红氛围
  ];
  group.userData.spinners = [
    { node: boomPivot, axis: 'y', rpm: 0.5 },           // 喷灌臂 2 min/圈
    { node: fanPivot, axis: 'y', rpm: 30 },             // 授粉扇
  ];
  group.userData.animate = (t) => {
    G.skyMem.emissiveIntensity = 0.5 + 0.1 * Math.sin(t * 0.25);   // 天光缓变
    G.grow.emissiveIntensity = 1.8 + 0.4 * Math.sin(t * 0.8);
  };
  group.userData.entry = { pos: [0, 0, R - 4.6], yaw: 0 };         // 落在外圈梯田与气闸之间
  group.userData.exitZone = { pos: [0, R - 1.2], radius: 1.2 };    // 走回气闸门
  return group;
}
