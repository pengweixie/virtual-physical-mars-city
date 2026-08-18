// hab-rec-01 —— 地下城娱乐中心（总控自建,先例:场站/温室排/管廊）
// 契约（内部场景变体，同 hab-foyer-01）：米制；原点 = 入口地面中心；
//   房间向 -Z 延伸，门开口朝 +Z；y >= 0（室内地面 y=0）；<=5 万面。
// 布局：前区 = 酒吧(右) + 街机角(左)；中区 = 低重力篮球半场(左) +
//   台球×2/乒乓(右)；后区 = 8 m 攀岩墙(后墙整面) + 影院包间(左后)。
// 物理主题：0.38 g 把每种运动各改写了一条规则——篮球人人能扣、
//   攀岩人人是高手、台球要重新学走位、乒乓在 70 kPa 下旋转失灵、
//   啤酒泡沫经久不散。账都在 info.json。
// userData.nightMats = 发光材质（室内常亮）；userData.lights = 点光源锚点。

export const meta = {
  id: 'hab-rec-01',
  name: '地下城娱乐中心',
  name_en: 'Undercity Recreation Hall',
  size_m: 30.5,
  size_axis: 'width',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];

  const W = 26, D = 30, H = 6.5, T = 0.3;   // 洞厅：宽×深×高、墙厚

  /* ---------------- 材质 ---------------- */
  const M = {
    rock:   new THREE.MeshStandardMaterial({ color: 0x6a5f52, roughness: 0.95 }),            // 开凿岩壁
    skirt:  new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93 }),            // 打印土层裙脚（全城语言）
    floor:  new THREE.MeshStandardMaterial({ color: 0xa8a29a, roughness: 0.6 }),             // 树脂地坪
    court:  new THREE.MeshStandardMaterial({ color: 0xb08a4a, roughness: 0.55 }),            // 球场木纹色
    line:   new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.5 }),             // 场地画线
    trim:   new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.5, metalness: 0.4 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.7 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.4 }),
    felt:   new THREE.MeshStandardMaterial({ color: 0x1f6e46, roughness: 0.85 }),            // 台呢
    wood:   new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.7 }),             // 台球桌身
    ppTop:  new THREE.MeshStandardMaterial({ color: 0x2a5a8a, roughness: 0.6 }),             // 乒乓台面
    red:    new THREE.MeshStandardMaterial({ color: 0xb03024, roughness: 0.6 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xd9b021, roughness: 0.6 }),
    seat:   new THREE.MeshStandardMaterial({ color: 0x5a2a2a, roughness: 0.8 }),             // 影院座椅绒
    bar:    new THREE.MeshStandardMaterial({ color: 0x3a2e24, roughness: 0.45, metalness: 0.2 }), // 吧台木
    white:  new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.8 }),
  };
  const G = {
    panel:  new THREE.MeshStandardMaterial({ color: 0x2a2a24, emissive: 0xfff4d8, emissiveIntensity: 2.2, roughness: 0.7 }),  // 顶灯板
    neon:   new THREE.MeshStandardMaterial({ color: 0x1a0a14, emissive: 0xe6459a, emissiveIntensity: 2.2, roughness: 0.5 }),  // 吧台霓虹
    bottle: new THREE.MeshStandardMaterial({ color: 0x101a14, emissive: 0x58c890, emissiveIntensity: 1.4, roughness: 0.3 }),  // 酒架背光
    arcade: new THREE.MeshStandardMaterial({ color: 0x081018, emissive: 0x4aa6ff, emissiveIntensity: 1.9, roughness: 0.5 }),  // 街机屏
    screen: new THREE.MeshStandardMaterial({ color: 0x0c0c10, emissive: 0x9ab8d8, emissiveIntensity: 1.1, roughness: 0.4 }),  // 影院银幕（暗场微光）
    scoreb: new THREE.MeshStandardMaterial({ color: 0x140a04, emissive: 0xff9030, emissiveIntensity: 2.0, roughness: 0.5 }),  // 记分牌
    exit:   new THREE.MeshStandardMaterial({ color: 0x04180a, emissive: 0x30e060, emissiveIntensity: 1.8, roughness: 0.5 }),
    holdA:  new THREE.MeshStandardMaterial({ color: 0x1a0808, emissive: 0xe65040, emissiveIntensity: 0.9, roughness: 0.6 }),  // 岩点红线
    holdB:  new THREE.MeshStandardMaterial({ color: 0x081a10, emissive: 0x40d890, emissiveIntensity: 0.9, roughness: 0.6 }),  // 岩点绿线
  };
  for (const k in G) nightMats.push(G[k]);

  /* ---------------- 工具 ---------------- */
  function box(parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    parent.add(m); return m;
  }
  function cyl(parent, r1, r2, h, mat, x, y, z, rx = 0, ry = 0, rz = 0, seg = 12) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    parent.add(m); return m;
  }
  function poi(name, x, y, z) {
    const a = new THREE.Object3D(); a.name = 'poi_' + name; a.position.set(x, y, z);
    group.add(a);
  }

  /* ==========================================================
   * A. 洞厅本体：岩壁 + 裙脚 + 地坪 + 顶
   * ========================================================== */
  box(group, W, 0.2, D, M.floor, 0, -0.1, -D / 2);
  // 四壁（门开口在 +Z 墙中央,宽 3）
  box(group, T, H, D, M.rock, -W / 2, H / 2, -D / 2);
  box(group, T, H, D, M.rock, W / 2, H / 2, -D / 2);
  box(group, W, H, T, M.rock, 0, H / 2, -D);
  box(group, (W - 3) / 2, H, T, M.rock, -(3 + (W - 3) / 2) / 2 - 0.75, H / 2, 0);
  box(group, (W - 3) / 2, H, T, M.rock, (3 + (W - 3) / 2) / 2 + 0.75, H / 2, 0);
  box(group, 3.4, H - 3.0, T, M.rock, 0, 3.0 + (H - 3.0) / 2, 0);   // 门楣
  // 裙脚（打印土层,全城语言）
  for (const s of [[-W / 2 + T, -D / 2], [W / 2 - T, -D / 2]])
    box(group, 0.12, 0.9, D - 0.2, M.skirt, s[0], 0.45, s[1]);
  box(group, W - 0.2, 0.9, 0.12, M.skirt, 0, 0.45, -D + T);
  // 顶：平顶 + 三道岩拱肋（示意开凿）
  box(group, W, 0.25, D, M.rock, 0, H + 0.12, -D / 2);
  for (const z of [-6, -15, -24])
    box(group, W, 0.5, 0.8, M.rock, 0, H - 0.25, z);
  // 顶灯板阵
  for (const gx of [-8.5, -3, 3, 8.5])
    for (const gz of [-3.5, -9.5, -15.5, -21.5, -27]) {
      box(group, 1.6, 0.06, 0.8, G.panel, gx, H - 0.16, gz);
      box(group, 1.7, 0.05, 0.9, M.trim, gx, H - 0.1, gz);
    }
  // 出口标识（门内侧上方）
  box(group, 1.2, 0.4, 0.08, G.exit, 0, 3.3, -0.22);

  /* ==========================================================
   * B. 低重力篮球半场（中区左）：地板 + 画线 + 双篮架
   *    地球筐 3.05 m + 火星筐 4.66 m（同一起跳,高度 ×2.63/1.53 折中账见卡）
   * ========================================================== */
  const CX = -6.2, CZ = -13.5, CW = 11, CD = 13;   // 场地中心/尺寸
  box(group, CW, 0.06, CD, M.court, CX, 0.03, CZ);
  // 画线：边界 + 罚球圈 + 中线
  const L = 0.08;
  box(group, CW, 0.02, L, M.line, CX, 0.062, CZ - CD / 2);
  box(group, CW, 0.02, L, M.line, CX, 0.062, CZ + CD / 2);
  box(group, L, 0.02, CD, M.line, CX - CW / 2, 0.062, CZ);
  box(group, L, 0.02, CD, M.line, CX + CW / 2, 0.062, CZ);
  cyl(group, 1.8, 1.8, 0.02, M.line, CX, 0.055, CZ, 0, 0, 0, 24);
  cyl(group, 1.65, 1.65, 0.025, M.court, CX, 0.058, CZ, 0, 0, 0, 24);
  // 篮架 ×2：地球规格(南) + 火星规格(北,更高,筐口红色)
  const hoop = (z, rimH, rimMat) => {
    cyl(group, 0.09, 0.12, rimH + 0.9, M.steel, CX, (rimH + 0.9) / 2, z);
    box(group, 1.8, 1.05, 0.06, M.white, CX, rimH + 0.45, z + (z < CZ ? 0.35 : -0.35));
    box(group, 0.6, 0.45, 0.04, rimMat === M.red ? M.red : M.yellow, CX, rimH + 0.28, z + (z < CZ ? 0.32 : -0.32));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 8, 20), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(CX, rimH, z + (z < CZ ? 0.62 : -0.62));
    group.add(rim);
  };
  hoop(CZ - CD / 2 - 0.6, 3.05, M.yellow);   // 地球规则筐
  hoop(CZ + CD / 2 + 0.6, 4.66, M.red);      // 火星规则筐
  // 记分牌（挂左墙）
  box(group, 2.4, 1.2, 0.12, M.dark, -W / 2 + 0.4, 4.2, CZ, 0, Math.PI / 2);
  box(group, 2.1, 0.9, 0.05, G.scoreb, -W / 2 + 0.48, 4.2, CZ, 0, Math.PI / 2);
  poi('court', CX, 1.5, CZ);

  /* ==========================================================
   * C. 台球×2 + 乒乓（中区右）
   * ========================================================== */
  const table = (x, z, ry) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = ry;
    box(t, 2.9, 0.18, 1.6, M.felt, 0, 0.86, 0);
    box(t, 3.1, 0.14, 1.8, M.wood, 0, 0.74, 0);
    box(t, 3.1, 0.1, 0.12, M.wood, 0, 0.94, 0.84); box(t, 3.1, 0.1, 0.12, M.wood, 0, 0.94, -0.84);
    box(t, 0.12, 0.1, 1.8, M.wood, 1.49, 0.94, 0); box(t, 0.12, 0.1, 1.8, M.wood, -1.49, 0.94, 0);
    for (const lx of [-1.3, 1.3]) for (const lz of [-0.6, 0.6])
      box(t, 0.16, 0.72, 0.16, M.dark, lx, 0.36, lz);
    // 三角摆球 + 白球（小球体,低段数）
    let n = 0;
    for (let r = 0; r < 3; r++) for (let i = 0; i <= r; i++) {
      const bm = (n++ % 2) ? M.red : M.yellow;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), bm);
      b.position.set(0.6 + r * 0.08, 0.99, (i - r / 2) * 0.095);
      t.add(b);
    }
    const cue = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), M.white);
    cue.position.set(-0.8, 0.99, 0); t.add(cue);
    group.add(t); return t;
  };
  table(6.8, -10.5, 0);
  table(6.8, -14.5, 0);
  // 乒乓台（网 + 中线）
  const pp = new THREE.Group(); pp.position.set(6.8, 0, -18.8);
  box(pp, 2.74, 0.06, 1.525, M.ppTop, 0, 0.76, 0);
  box(pp, 2.74, 0.02, 0.03, M.line, 0, 0.795, 0);
  box(pp, 0.03, 0.18, 1.7, M.white, 0, 0.88, 0);
  for (const lx of [-1.1, 1.1]) for (const lz of [-0.55, 0.55])
    box(pp, 0.08, 0.73, 0.08, M.dark, lx, 0.365, lz);
  group.add(pp);
  // 球杆架（右墙）
  box(group, 0.08, 1.6, 1.2, M.wood, W / 2 - 0.3, 1.3, -12.5);
  poi('cue', 6.8, 1.2, -13.5);

  /* ==========================================================
   * D. 攀岩墙（后墙整面 8 m 宽 × 6 m 高,向内倾 8°）+ 缓冲垫
   * ========================================================== */
  const wall = new THREE.Group();
  wall.position.set(3.5, 0, -D + 0.6); wall.rotation.x = -0.14;
  box(wall, 8, 6.2, 0.25, M.skirt, 0, 3.1, 0);
  // 岩点：两条路线（红/绿发光）+ 灰点,确定性伪随机摆放
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 64; i++) {
    const hx = (rnd() - 0.5) * 7.2, hy = 0.4 + rnd() * 5.4;
    const mat = i % 5 === 0 ? G.holdA : (i % 5 === 1 ? G.holdB : M.trim);
    box(wall, 0.16 + rnd() * 0.1, 0.09, 0.14, mat, hx, hy, 0.16, 0, rnd() * 3.14);
  }
  group.add(wall);
  box(group, 9, 0.28, 2.6, M.red, 3.5, 0.14, -D + 1.9);        // 缓冲垫
  box(group, 8.4, 0.06, 2.2, M.dark, 3.5, 0.31, -D + 1.9);
  poi('climb', 3.5, 2.5, -D + 1.6);

  /* ==========================================================
   * E. 影院包间（左后,内嵌房间 9×7,银幕 + 三排座椅）
   * ========================================================== */
  const cin = new THREE.Group(); cin.position.set(-8, 0, -25.5);
  box(cin, 6.2, 3.6, 0.2, M.white, -1.4, 1.8, 3.5);            // 前墙左段
  box(cin, 1.2, 3.6, 0.2, M.white, 3.9, 1.8, 3.5);             // 前墙右段（中留 1.6 m 门洞）
  box(cin, 9.2, 1.0, 0.2, M.white, 0, 3.1, 3.5);               // 门楣
  box(cin, 1.8, 0.5, 0.1, G.neon, 2.4, 2.35, 3.56);            // 门口霓虹招牌
  box(cin, 0.2, 3.6, 7, M.white, 4.5, 1.8, 0);
  box(cin, 9, 0.15, 7, M.dark, 0, 3.55, 0);                    // 包间顶
  box(cin, 5.4, 2.6, 0.1, G.screen, 0, 1.7, -3.2);             // 银幕
  box(cin, 5.8, 2.9, 0.06, M.dark, 0, 1.7, -3.28);
  for (let r = 0; r < 3; r++)
    for (let s = 0; s < 5; s++) {
      const sx = (s - 2) * 1.05, sz = -0.6 + r * 1.15, sy = 0.12 + r * 0.18;
      box(cin, 0.8, 0.5, 0.15, M.seat, sx, sy + 0.75, sz + 0.3);   // 靠背
      box(cin, 0.8, 0.14, 0.75, M.seat, sx, sy + 0.42, sz);        // 座面
      box(cin, 0.8, 0.4, 0.7, M.dark, sx, sy + 0.2, sz);
    }
  group.add(cin);
  poi('cinema', -8, 1.5, -24);

  /* ==========================================================
   * F. 酒吧（前区右）：L 形吧台 + 吧凳 + 发光酒架 + 霓虹
   * ========================================================== */
  box(group, 5.6, 1.1, 0.7, M.bar, 8.6, 0.55, -3.2);
  box(group, 0.7, 1.1, 2.6, M.bar, 11.05, 0.55, -4.85);
  box(group, 5.8, 0.06, 0.8, M.trim, 8.6, 1.13, -3.2);
  for (const bx of [6.6, 7.8, 9.0, 10.2])
    { cyl(group, 0.18, 0.18, 0.06, M.seat, bx, 0.62, -2.2); cyl(group, 0.04, 0.06, 0.6, M.steel, bx, 0.3, -2.2); }
  // 酒架（右墙,背光）
  box(group, 4.2, 2.0, 0.16, M.dark, 9.4, 1.9, -0.4 - T);
  box(group, 4.0, 1.8, 0.05, G.bottle, 9.4, 1.9, -0.32 - T);
  for (let i = 0; i < 12; i++)
    cyl(group, 0.05, 0.05, 0.32, M.dark, 7.6 + (i % 6) * 0.72, 1.35 + Math.floor(i / 6) * 0.75, -0.34 - T, 0, 0, 0, 8);
  // 霓虹字位（吧台上方）
  box(group, 2.6, 0.3, 0.06, G.neon, 9.4, 3.0, -0.36 - T);
  poi('bar', 8.6, 1.3, -3.0);

  /* ==========================================================
   * G. 街机角（前区左）：机柜×4 + 摇杆台,一台是 MB-1 彩蛋
   * ========================================================== */
  for (let i = 0; i < 4; i++) {
    const ax = -10.8 + i * 1.5;
    const cab = new THREE.Group(); cab.position.set(ax, 0, -2.2); cab.rotation.y = Math.PI;
    box(cab, 1.1, 1.9, 0.9, M.dark, 0, 0.95, 0);
    box(cab, 0.9, 0.7, 0.06, G.arcade, 0, 1.35, -0.43, -0.18);
    box(cab, 1.0, 0.12, 0.5, M.trim, 0, 0.95, -0.5, -0.35);
    box(cab, 1.1, 0.25, 0.95, i === 3 ? M.yellow : M.red, 0, 1.98, 0);
    group.add(cab);
  }
  poi('arcade', -10, 1.3, -3.2);

  /* ---------------- 贴地归一化 + userData ---------------- */
  const bb = new THREE.Box3().setFromObject(group);
  const dy = isFinite(bb.min.y) ? bb.min.y : 0;
  if (Math.abs(dy) > 1e-4) for (const c of group.children) c.position.y -= dy;

  group.userData = {
    lights: [
      { color: 0xfff4d8, pos: [0, 5.4 - dy, -4], range: 18 },     // 前区顶光
      { color: 0xfff4d8, pos: [-6, 5.4 - dy, -13], range: 18 },   // 球场顶光
      { color: 0xfff4d8, pos: [7, 5.4 - dy, -14], range: 16 },    // 台球区顶光
      { color: 0xfff4d8, pos: [0, 5.4 - dy, -21], range: 18 },    // 中后区顶光
      { color: 0xe6459a, pos: [9.4, 2.8 - dy, -1.2], range: 7 },  // 吧台霓虹
      { color: 0x4aa6ff, pos: [-10, 1.6 - dy, -2.8], range: 6 },  // 街机屏光
      { color: 0x9ab8d8, pos: [-8, 1.8 - dy, -24.5], range: 7 },  // 影院银幕微光
      { color: 0xfff4d8, pos: [3.5, 5.0 - dy, -27], range: 12 },  // 攀岩墙顶光
    ],
    beams: [],
    nightMats,
  };
  return group;
}
