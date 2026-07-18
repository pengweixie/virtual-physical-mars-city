// veh-raptor-01 —— 猛禽发动机(检修展示台)— 代码资产,MODELS.md §4 契约。
// 1:1 单台海平面猛禽立在橙色维修滑橇架上,钟口朝下。真实参照:全高 ~3.1 m,
// 海平面喷管出口 Ø1.3 m,全流量分级燃烧循环(双预燃器、双涡轮泵)。
// 原点 = 滑橇中心地面点,+Y 向上,正面(工作台阶一侧)朝 +Z。
// THREE 由查看器注入,不 import;纯几何 + 材质,无外部资源。

export const meta = {
  id: 'veh-raptor-01',
  name: '猛禽发动机(检修展示台)',
  name_en: 'Raptor engine on service cradle',
  size_m: 3.0, size_axis: 'height',   // 自检用,引擎不缩放
  effects: ['glow_windows'],           // 仅架上一盏琥珀工作灯参与夜光
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'veh-raptor-01';
  const UP = new THREE.Vector3(0, 1, 0);

  // ---------------------------------------------------------------- 材质
  const copperC = new THREE.MeshStandardMaterial({ color: 0xb5713c, metalness: 0.55, roughness: 0.35 });  // 再生冷却铜室
  const copperD = new THREE.MeshStandardMaterial({ color: 0x8a5530, metalness: 0.5, roughness: 0.45 });   // 铜管路
  const bellM = new THREE.MeshStandardMaterial({ color: 0x4c4238, metalness: 0.6, roughness: 0.42, flatShading: true, side: THREE.DoubleSide });
  const steelM = new THREE.MeshStandardMaterial({ color: 0x9aa0a5, metalness: 0.5, roughness: 0.4 });     // 泵体/结构钢
  const steelD = new THREE.MeshStandardMaterial({ color: 0x565b60, metalness: 0.5, roughness: 0.5 });     // 法兰/深色件
  const inox = new THREE.MeshStandardMaterial({ color: 0xc9ced2, metalness: 0.45, roughness: 0.35 });     // 不锈钢管
  const orange = new THREE.MeshStandardMaterial({ color: 0xd97a35, metalness: 0.2, roughness: 0.7 });     // 维修架
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1c1e21, metalness: 0.1, roughness: 0.9 });
  const lampM = new THREE.MeshStandardMaterial({ color: 0x2a2014, emissive: 0xffb347, emissiveIntensity: 0.0, roughness: 0.5 });

  // ---------------------------------------------------------------- 小工具
  const add = (m) => { g.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, ry = 0) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    o.position.set(x, y, z); if (ry) o.rotation.y = ry; return add(o);
  };
  const cyl = (rt, rb, h, mat, x, y, z, seg = 16, open = false) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat);
    o.position.set(x, y, z); return add(o);
  };
  const torus = (r, tube, mat, y, x = 0, z = 0, seg = 28) => {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, seg), mat);
    o.rotation.x = Math.PI / 2; o.position.set(x, y, z); return add(o);
  };
  // 两点直管;flange=true 时两端加法兰盘
  const pipe = (x1, y1, z1, x2, y2, z2, r, mat, flange = false) => {
    const a = new THREE.Vector3(x1, y1, z1), d = new THREE.Vector3(x2, y2, z2).sub(a);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), mat);
    p.position.copy(a).addScaledVector(d, 0.5);
    p.quaternion.setFromUnitVectors(UP, d.clone().normalize());
    add(p);
    if (flange) for (const t of [0.06, 0.94]) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.55, r * 1.55, 0.05, 14), steelD);
      f.position.copy(a).addScaledVector(d, t);
      f.quaternion.copy(p.quaternion);
      add(f);
    }
    return p;
  };
  // 多点折线管(自动在拐点放小球做弯头)
  const run = (pts, r, mat) => {
    for (let i = 0; i < pts.length - 1; i++) pipe(...pts[i], ...pts[i + 1], r, mat);
    for (let i = 1; i < pts.length - 1; i++) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(r * 1.15, 10, 8), mat);
      e.position.set(...pts[i]); add(e);
    }
  };

  // ---------------------------------------------------------------- 喷管(钟形,喉部 y1.60 → 出口 y0.25)
  const THROAT_R = 0.16, EXIT_R = 0.65, BELL_TOP = 1.6, BELL_LEN = 1.35;
  const bellR = (t) => THROAT_R + (EXIT_R - THROAT_R) * Math.pow(t, 0.62);
  const bellY = (t) => BELL_TOP - BELL_LEN * t;
  {
    const pts = [];
    for (let k = 0; k <= 10; k++) pts.push(new THREE.Vector2(bellR(k / 10), bellY(k / 10)));
    const bell = new THREE.Mesh(new THREE.LatheGeometry(pts, 44), bellM);
    add(bell);
  }
  torus(EXIT_R + 0.012, 0.05, steelD, bellY(1));                     // 出口加强环
  torus(bellR(0.55) + 0.015, 0.045, steelD, bellY(0.55));           // 中部燃料歧管环
  torus(bellR(0.02) + 0.05, 0.055, copperD, BELL_TOP - 0.02);       // 喉部歧管环
  // 上段冷却槽肋条 ×20(喉部到中部,贴曲面走两折)
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const s = Math.sin(a), c = Math.cos(a);
    pipe(s * bellR(0.06), bellY(0.06), c * bellR(0.06),
         s * bellR(0.3), bellY(0.3), c * bellR(0.3), 0.022, copperD);
    pipe(s * bellR(0.3), bellY(0.3), c * bellR(0.3),
         s * bellR(0.55), bellY(0.55), c * bellR(0.55), 0.022, copperD);
  }
  // 歧管环 → 燃烧室 的回流管 ×6
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26;
    const s = Math.sin(a), c = Math.cos(a);
    run([[s * (bellR(0.55) + 0.03), bellY(0.55), c * (bellR(0.55) + 0.03)],
         [s * 0.46, 1.7, c * 0.46],
         [s * 0.34, 1.98, c * 0.34]], 0.032, copperD);
  }

  // ---------------------------------------------------------------- 燃烧室(铜,带 20 道纵向冷却肋)+ 点火器
  cyl(0.3, 0.22, 0.72, copperC, 0, 1.96, 0, 24);
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    const rib = box(0.05, 0.66, 0.035, copperC, Math.sin(a) * 0.295, 1.96, Math.cos(a) * 0.295, a);
    rib.rotation.x = 0.055;                                          // 顺着室壁微收
  }
  cyl(0.07, 0.07, 0.2, inox, 0.22, 2.4, 0.22, 8);                    // 火炬点火器
  box(0.16, 0.12, 0.08, steelD, 0.24, 2.52, 0.24);

  // ---------------------------------------------------------------- 万向节 + 顶部接口板 + 作动器耳片
  box(0.42, 0.26, 0.42, steelM, 0, 2.45, 0);                         // 万向节块
  const pinA = cyl(0.055, 0.055, 0.6, steelD, 0, 2.45, 0, 10); pinA.rotation.z = Math.PI / 2;   // 十字轴
  const pinB = cyl(0.055, 0.055, 0.6, steelD, 0, 2.52, 0, 10); pinB.rotation.x = Math.PI / 2;
  cyl(0.46, 0.46, 0.09, steelM, 0, 2.68, 0, 24);                     // 发动机接口板
  torus(0.4, 0.035, steelD, 2.72);
  for (const s of [-1, 1]) box(0.09, 0.3, 0.18, steelD, s * 0.36, 2.28, -0.18);  // TVC 作动器耳片 ×2

  // ---------------------------------------------------------------- 双涡轮泵组(CH4 左 / LOX 右)+ 预燃器
  for (const s of [-1, 1]) {
    const px = s * 0.47;
    const pump = cyl(0.17, 0.17, 0.68, steelM, px, 1.98, 0.06, 18);
    pump.rotation.z = s * 0.3;                                        // 泵轴微倾
    const vol = torus(0.16, 0.075, steelM, 1.68, px + s * 0.1, 0.06, 22);  // 蜗壳
    vol.rotation.x = Math.PI / 2 - s * 0.3;
    const pre = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), s < 0 ? copperC : steelM);
    pre.position.set(px + s * 0.12, 2.4, 0.06); add(pre);             // 预燃器(CH4 侧富燃=铜色)
    cyl(0.1, 0.1, 0.3, steelD, px + s * 0.12, 2.58, 0.06, 12);        //   预燃器阀组
    // 主推进剂下行管(接口板 → 预燃器 → 泵)带法兰
    pipe(s * 0.24, 2.66, 0, px + s * 0.12, 2.52, 0.05, 0.085, inox, true);
    // 泵出口 → 喉部歧管高压管
    run([[px + s * 0.05, 1.62, 0.1], [s * 0.36, 1.5, 0.3], [0.0, 1.56, bellR(0.02) + 0.04]], 0.05, inox);
    // 预燃器 → 燃烧室顶富燃/富氧燃气管
    run([[px + s * 0.12, 2.32, 0.06], [s * 0.3, 2.2, -0.12], [s * 0.14, 2.3, -0.05]], 0.055, copperD);
  }
  // 电气接线盒 + 线缆导管
  box(0.2, 0.26, 0.1, steelD, -0.05, 2.1, -0.34);
  run([[-0.05, 2.0, -0.36], [-0.05, 1.66, -0.4], [0.2, 1.6, -0.3]], 0.022, rubber);
  run([[0.02, 2.24, -0.34], [0.02, 2.6, -0.3], [0.15, 2.66, -0.1]], 0.022, rubber);

  // ---------------------------------------------------------------- 维修滑橇架(安全橙)+ 工作灯 + 台阶
  for (const sz of [-0.85, 0.85]) box(2.5, 0.16, 0.42, orange, 0, 0.08, sz);      // 滑橇纵梁
  for (const sx of [-0.95, 0.95]) box(0.42, 0.16, 1.9, orange, sx, 0.08, 0);      // 横联
  for (const [sx, sz] of [[-0.85, -0.72], [0.85, -0.72], [-0.85, 0.72], [0.85, 0.72]]) {
    box(0.16, 1.1, 0.16, orange, sx, 0.71, sz);                                    // 立柱 ×4
    pipe(sx, 1.22, sz, sx * 0.62, 1.28, sz * 0.62, 0.045, orange);                 // 斜撑到抱环
  }
  {
    const clamp = torus(0.62, 0.055, orange, 1.28);                                // 抱环(夹持喷管中部)
    clamp.scale.set(1, 1, 1);
    for (const a of [0.6, 2.2, 4.0, 5.5]) {                                        // 抱环橡胶垫块
      box(0.12, 0.1, 0.16, rubber, Math.sin(a) * 0.56, 1.28, Math.cos(a) * 0.56, a);
    }
  }
  box(0.7, 0.18, 0.5, orange, 0, 0.26, 1.2);                                       // 工作台阶(+Z 正面)
  box(0.7, 0.18, 0.4, orange, 0, 0.53, 1.02);
  cyl(0.05, 0.05, 1.9, steelD, -1.05, 1.11, 0.72, 8);                              // 工作灯杆
  box(0.22, 0.14, 0.14, lampM, -1.05, 2.1, 0.72);                                  // 琥珀工作灯 → 夜光
  box(0.5, 0.35, 0.35, steelD, 1.0, 0.34, -1.15);                                  // 工具箱
  box(0.46, 0.06, 0.31, orange, 1.0, 0.55, -1.15);

  // ---------------------------------------------------------------- POI 锚点(卡片见 veh-raptor-01.info.json)
  for (const [n, x, y, z] of [
    ['chamber',    0, 1.96, 0],     // 再生冷却燃烧室
    ['turbopumps', 0.47, 2.0, 0.1], // 双涡轮泵 + 预燃器
    ['nozzle',     0, 0.9, 0],      // 钟形喷管
    ['gimbal',     0, 2.55, 0],     // 万向节
  ]) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + n;
    a.position.set(x, y, z);
    g.add(a);
  }

  // ---------------------------------------------------------------- 引擎接口
  g.userData.nightMats = [lampM];
  g.userData.lights = [{ color: 0xffc98a, pos: [-1.05, 2.1, 0.72], range: 8 }];
  g.userData.beams = [];
  return g;
}
