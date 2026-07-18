// hab-lift-01 —— 地下城人员电梯站（地表井口楼）
// 契约：米制；原点 = 门口地面中心；门朝 +Z；贴地 minY=0；<=5 万面。
// 设计：地下城的垂直交通地表端——人员日常进出不走车辆气闸大门，走竖井
//   电梯。地表只需井口楼（竖井向下是叙事，不真挖），打印土层墙 + 顶部
//   提升机房，与 hab-tunnel-01 同语言；对应地下端 = hab-foyer-01 玄关的
//   电梯门组（垂直对应原则：地表设施正下方是城内对应节点）。
// userData.nightMats 夜光；userData.blinkMats 信标闪烁；userData.lights 点光。

export const meta = {
  id: 'hab-lift-01',
  name: '地下城人员电梯站',
  size_m: 8,                // 基座坪宽 8 m（1 单位 = 1 米）
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260714);

  /* ---------------- 材质（系列配色） ---------------- */
  const M = {
    print:    new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93 }), // 打印土层
    printDim: new THREE.MeshStandardMaterial({ color: 0xa8895f, roughness: 0.94 }),
    white:    new THREE.MeshStandardMaterial({ color: 0xd9d5cb, roughness: 0.8, metalness: 0.1 }), // 机房白
    steel:    new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.7 }), // 电梯门不锈钢
    metal:    new THREE.MeshStandardMaterial({ color: 0x555a61, roughness: 0.55, metalness: 0.65 }),
    dark:     new THREE.MeshStandardMaterial({ color: 0x26292d, roughness: 0.5, metalness: 0.6 }),
    grille:   new THREE.MeshStandardMaterial({ color: 0x8e8a80, roughness: 0.75, metalness: 0.3 }),
    hazardY:  new THREE.MeshStandardMaterial({ color: 0xd9a422, roughness: 0.7 }),
    hazardK:  new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.7 }),
  };
  const G = {
    sign:   new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0, roughness: 0.6 }), // 站名标志板
    ind:    new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xffb030, emissiveIntensity: 2.0, roughness: 0.5 }), // 楼层指示条
    port:   new THREE.MeshStandardMaterial({ color: 0x241d12, emissive: 0xffe2b0, emissiveIntensity: 2.2, roughness: 0.5 }), // 舷窗
    ledR:   new THREE.MeshStandardMaterial({ color: 0x1a0806, emissive: 0xff4034, emissiveIntensity: 2.0, roughness: 0.5 }),
    ledG:   new THREE.MeshStandardMaterial({ color: 0x061a0a, emissive: 0x3ee06a, emissiveIntensity: 2.0, roughness: 0.5 }),
    beacon: new THREE.MeshStandardMaterial({ color: 0x1a0806, emissive: 0xff3326, emissiveIntensity: 2.0, roughness: 0.5 }),
  };
  nightMats.push(G.sign, G.ind, G.port, G.ledR, G.ledG, G.beacon);

  function box(w, h, d, mat, x, y, z, ry = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    group.add(m);
    return m;
  }
  function cyl(rt, rb, h, seg, mat, x, y, z, axis = 'Y') {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    if (axis === 'Z') m.rotation.x = Math.PI / 2;
    else if (axis === 'X') m.rotation.z = Math.PI / 2;
    group.add(m);
    return m;
  }
  function poi(name, x, y, z) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + name;
    a.position.set(x, y, z);
    group.add(a);
  }

  /* ---------- 1. 基座坪 + 防撞柱 + 门前斑马 ---------- */
  box(8, 0.35, 8, M.printDim, 0, 0.175, -1.8);           // 坪 z -5.8..+2.2，顶面 0.35
  for (const [px, pz] of [[3.3, 1.7], [-3.3, 1.7], [3.3, -5.3], [-3.3, -5.3]]) {
    cyl(0.12, 0.12, 0.5, 10, M.hazardY, px, 0.6, pz);    // 防撞柱（黄段）
    cyl(0.12, 0.12, 0.4, 10, M.hazardK, px, 1.05, pz);   // 黑段
  }
  for (let i = 0; i < 5; i++) {                          // 门前黄黑斑马
    box(2.2, 0.02, 0.3, i % 2 === 0 ? M.hazardY : M.hazardK, 0, 0.365, 0.75 + i * 0.32);
  }

  /* ---------- 2. 井口主楼（打印层收分墙）+ 顶板 ---------- */
  for (let i = 0; i < 9; i++) {
    const shrink = i * 0.045;
    const w = (5.0 - shrink) * (i % 2 === 0 ? 1 : 0.965) + (rng() - 0.5) * 0.04;
    const d = (4.5 - shrink) * (i % 2 === 0 ? 1 : 0.965) + (rng() - 0.5) * 0.04;
    box(w, 0.52, d, M.print, 0, 0.35 + (i + 0.5) * 0.5, -3.05);
  }
  box(5.0, 0.25, 4.5, M.printDim, 0, 4.97, -3.05);       // 顶板（y≈4.85..5.10）

  /* ---------- 3. 提升机房（白盒 + 格栅 + 检修门 + 通风帽） ---------- */
  box(2.8, 2.2, 2.2, M.white, 0, 6.2, -3.6);
  for (let i = 0; i < 3; i++) {                          // 侧面散热格栅
    box(2.86, 0.1, 1.6, M.grille, 0, 5.6 + i * 0.45, -3.6);
  }
  box(0.7, 1.2, 0.08, M.dark, 0.6, 5.75, -2.48);         // 检修门（前面）
  cyl(0.22, 0.22, 0.55, 12, M.white, 0.85, 7.55, -4.25); // 通风帽柱
  cyl(0.32, 0.32, 0.1, 12, M.grille, 0.85, 7.85, -4.25); // 帽盖
  // 吊装梁（工字梁前伸 + 端部滑轮 + 黄色吊钩）
  box(0.18, 0.22, 3.2, M.metal, 0, 7.42, -2.2);          // 梁 z -3.8..-0.6
  cyl(0.13, 0.13, 0.1, 14, M.dark, 0, 7.28, -0.75, 'X'); // 滑轮
  box(0.05, 0.35, 0.05, M.metal, 0, 7.05, -0.75);        // 吊索短杆
  box(0.16, 0.18, 0.08, M.hazardY, 0, 6.8, -0.75);       // 吊钩块
  // 桅顶信标（→ blinkMats：引擎驱动红色警示闪烁）
  box(0.05, 0.45, 0.05, M.metal, -0.95, 7.5, -4.3);
  box(0.13, 0.13, 0.13, G.beacon, -0.95, 7.77, -4.3);

  /* ---------- 4. 门斗（气闸小厅）+ 电梯门 + 灯与标志 ---------- */
  box(2.6, 3.0, 1.2, M.print, 0, 1.85, -0.25);           // 门斗体 z -0.85..0.35
  // 双扇不锈钢电梯门（中缝 0.02）
  box(0.92, 2.3, 0.08, M.steel, -0.47, 1.5, 0.36);
  box(0.92, 2.3, 0.08, M.steel, 0.47, 1.5, 0.36);
  // 门套线
  box(0.16, 2.5, 0.1, M.dark, -1.05, 1.6, 0.37);
  box(0.16, 2.5, 0.1, M.dark, 1.05, 1.6, 0.37);
  box(2.26, 0.16, 0.1, M.dark, 0, 2.77, 0.37);
  // 门楣状态灯（红 2 绿 2）
  for (let i = 0; i < 4; i++) {
    box(0.16, 0.16, 0.06, i < 2 ? G.ledR : G.ledG, -0.45 + i * 0.3, 3.0, 0.38);
  }
  box(1.7, 0.42, 0.1, G.sign, 0, 3.78, -0.88);           // 发光站名板（贴主楼墙面、门斗顶上方）
  box(1.85, 0.06, 0.14, M.dark, 0, 4.03, -0.88);         // 板顶檐
  // 楼层指示柱（暗条内嵌琥珀发光条）
  box(0.22, 2.4, 0.1, M.dark, 1.5, 1.75, 0.31);
  box(0.08, 2.0, 0.05, G.ind, 1.5, 1.75, 0.37);
  // 门斗侧壁舷窗（厅内有人的暖光）
  cyl(0.16, 0.16, 0.06, 18, G.port, -1.31, 1.9, -0.25, 'X');
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 18), M.metal);
  rim.rotation.y = Math.PI / 2;
  rim.position.set(-1.31, 1.9, -0.25);
  group.add(rim);

  /* ---------- 5. 通风 + 电缆桥架（走向 -Z，通往入口山丘/城内） ---------- */
  box(0.12, 0.8, 1.2, M.grille, -2.46, 3.2, -3.0);       // 侧壁百叶
  cyl(0.15, 0.15, 1.8, 12, M.white, -2.56, 4.4, -3.0);   // 排风立管
  cyl(0.24, 0.24, 0.08, 12, M.grille, -2.56, 5.34, -3.0);
  box(0.4, 4.6, 0.15, M.dark, 1.6, 2.65, -5.36);         // 背面竖桥架
  box(0.4, 0.12, 0.9, M.dark, 1.6, 0.41, -5.35);         // 坪面走线段（沿背缘，向井道走线）

  /* ---------- POI 锚点 ---------- */
  poi('airlock', 0, 1.5, 0.4);          // 人员气闸门
  poi('machine_room', 0, 6.2, -3.6);    // 提升机房
  poi('shaft', 0, 2.2, -3.05);          // 竖井井口

  /* ---------- 贴地归一化 + userData ---------- */
  const bb = new THREE.Box3().setFromObject(group);
  const dy = isFinite(bb.min.y) ? bb.min.y : 0;
  if (Math.abs(dy) > 1e-4) for (const c of group.children) c.position.y -= dy;

  group.userData = {
    lights: [{ color: 0xffd9a0, pos: [0, 2.6 - dy, 1.4], range: 10 }], // 门口暖光
    beams: [],
    nightMats,
    blinkMats: [G.beacon],
  };
  return group;
}
