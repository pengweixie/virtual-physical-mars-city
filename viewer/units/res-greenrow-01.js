// res-greenrow-01 —— 温室生产排(4 条薄膜隧道温室)
// 契约(MODELS.md §4):1u=1m;原点=排中心地面点;+Y 上;正面(端门)朝 +X 一侧
//   但整体读作一排,rotation 由 manifest 定;THREE 传入;无外部资源。
// 使命:密度资产 + 生产逻辑 —— res-dome-01 是展示型温室(人可进,55 kPa),
//   本排是产能型(低压 25 kPa 富 CO₂,作物专用,服务舱段进出)。
//   水线走 res-dome 同一条 Rodwell 管网(pipe-h2o 的下游分支)。
// 夜景:LED 补光把整排隧道点成粉紫色 —— 村子(hab-village-01)的餐桌就指着这排。
// 动画全声明式:nightMats(补光膜/门灯);无转件。

export const meta = {
  id: 'res-greenrow-01',
  name: '温室生产排',
  name_en: 'Greenhouse Production Row',
  size_m: 34,
  size_axis: 'width',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = meta.id;
  const nightMats = [];
  const hash = (k) => { const s = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  const M = {
    film: new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.35, metalness: 0.05,
      transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }),
    rib:  new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.5, metalness: 0.55 }),
    end:  new THREE.MeshStandardMaterial({ color: 0xcfcac0, roughness: 0.75 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.55, metalness: 0.4 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x5a3d2a, roughness: 1.0 }),
    green:new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.8 }),
    green2:new THREE.MeshStandardMaterial({ color: 0x6a9a4a, roughness: 0.8 }),
    pipe: new THREE.MeshStandardMaterial({ color: 0x4a7a9a, roughness: 0.45, metalness: 0.5 }),
    steel:new THREE.MeshStandardMaterial({ color: 0x6a7076, roughness: 0.5, metalness: 0.6 }),
    slab: new THREE.MeshStandardMaterial({ color: 0x8d857a, roughness: 0.95 }),
  };
  // LED 补光:白天几乎不可见的淡粉,夜里被引擎推亮成整排粉紫灯笼
  const grow = new THREE.MeshStandardMaterial({ color: 0x3a2030, emissive: 0xff5a9a,
    emissiveIntensity: 0.5, roughness: 0.6 });
  const doorLit = new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffc37a,
    emissiveIntensity: 0.7, roughness: 0.5 });
  nightMats.push(grow, doorLit);

  const box = (p, w, h, d, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); if (ry) m.rotation.y = ry; p.add(m); return m;
  };
  const cyl = (p, r, h, mat, x, y, z, seg = 10, rz = 0) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, y, z); if (rz) m.rotation.z = rz; p.add(m); return m;
  };

  /* ---------------- 共享几何 ---------------- */
  const R = 2.75, L = 18;
  const shellG = new THREE.CylinderGeometry(R, R, L, 18, 1, true, 0, Math.PI);
  shellG.rotateZ(Math.PI / 2);                    // 轴沿 x,拱顶朝 +Y
  const capG = new THREE.CircleGeometry(R, 18, 0, Math.PI);
  const ribG = new THREE.TorusGeometry(R, 0.05, 6, 14, Math.PI);

  /* ---------------- 4 条隧道 ---------------- */
  const rows = [-12, -4, 4, 12];
  rows.forEach((rz, i) => {
    const t = new THREE.Group();
    t.position.set(0, 0, rz);
    // 基槛 + 苗床土垄(膜外可见的绿色)
    box(t, L + 0.6, 0.35, 2 * R + 0.5, M.slab, 0, 0.17, 0);
    for (const bz of [-1.35, 0, 1.35]) {
      box(t, L - 2, 0.5, 0.9, M.soil, 0, 0.55, bz);
      for (let k = 0; k < 10; k++)
        box(t, 0.5, 0.35, 0.6, hash(i * 5 + k) > 0.5 ? M.green : M.green2,
          -L / 2 + 1.8 + k * (L - 3.4) / 9, 0.95, bz + (hash(i + k * 3.3) - 0.5) * 0.25);
    }
    // 补光条 ×2(拱内高处,夜里点亮整条膜)
    box(t, L - 2.5, 0.09, 0.32, grow, 0, R - 0.45, -0.7);
    box(t, L - 2.5, 0.09, 0.32, grow, 0, R - 0.45, 0.7);
    // 肋 + 膜(膜最后画,透明体)
    for (let k = 0; k <= 6; k++) {
      const rib = new THREE.Mesh(ribG, M.rib);
      rib.position.set(-L / 2 + k * (L / 6), 0.35, 0);
      rib.rotation.y = Math.PI / 2;
      t.add(rib);
    }
    // 端墙(西实墙接管沟,东端服务门)
    const capW = new THREE.Mesh(capG, M.end);
    capW.position.set(-L / 2, 0.35, 0); capW.rotation.y = -Math.PI / 2; t.add(capW);
    const capE = new THREE.Mesh(capG, M.end);
    capE.position.set(L / 2, 0.35, 0); capE.rotation.y = Math.PI / 2; t.add(capE);
    box(t, 0.22, 2.0, 1.1, M.trim, L / 2 + 0.06, 1.35, 0);   // 门框
    box(t, 0.1, 1.8, 0.9, M.steel, L / 2 + 0.12, 1.25, 0);   // 服务舱门
    box(t, 0.08, 0.22, 0.5, doorLit, L / 2 + 0.14, 2.6, 0);  // 门灯
    const shell = new THREE.Mesh(shellG, M.film);
    shell.position.y = 0.35; shell.renderOrder = 2; t.add(shell);
    g.add(t);
  });

  /* ---------------- 集水总管(西端,沿 z 连四条隧道) ---------------- */
  const header = new THREE.Group();
  header.position.set(-L / 2 - 1.6, 0, 0);
  cyl(header, 0.22, 27, M.pipe, 0, 0.75, 0, 10, Math.PI / 2).rotation.x = Math.PI / 2;
  for (const rz of rows) {
    cyl(header, 0.13, 1.8, M.pipe, 0.9, 0.75, rz, 8, Math.PI / 2); // 支管进隧道
    box(header, 0.34, 0.5, 0.3, M.steel, 0.2, 0.75, rz);           // 支阀
  }
  for (const pz of [-10, 0, 10]) cyl(header, 0.08, 0.8, M.steel, 0, 0.4, pz, 6);
  box(header, 1.1, 1.3, 1.0, M.steel, -0.2, 0.65, -13.8);          // 泵撬
  g.add(header);

  /* ---------------- 设备棚(东端,配电 + 营养液) ---------------- */
  const shed = new THREE.Group();
  shed.position.set(L / 2 + 2.6, 0, -8);
  box(shed, 3.2, 2.6, 3.6, M.end, 0, 1.3, 0);
  box(shed, 3.4, 0.2, 3.8, M.trim, 0, 2.7, 0);
  box(shed, 0.1, 1.7, 0.9, M.steel, 1.62, 0.85, 0.6);
  box(shed, 0.08, 0.2, 0.4, doorLit, 1.66, 2.1, 0.6);
  for (const tz of [-1.0, 0.2])
    cyl(shed, 0.42, 1.7, M.pipe, -0.8, 0.85, tz, 12);              // 营养液罐 ×2
  g.add(shed);

  /* ---------------- 田埂痕迹:排间小径 + 散石 ---------------- */
  for (const pz of [-8, 0, 8]) box(g, L + 4, 0.04, 0.9, M.slab, 0, 0.06, pz);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockM = new THREE.MeshStandardMaterial({ color: 0x9e6b48, roughness: 1.0 });
  for (let i = 0; i < 10; i++) {
    const s = 0.08 + hash(i * 5.9) * 0.12;
    const m = new THREE.Mesh(rockGeo, rockM);
    m.scale.set(s, s * 0.7, s);
    m.position.set((hash(i * 3.3) - 0.5) * 30, 0.05, (hash(i * 7.7) - 0.5) * 34);
    g.add(m);
  }

  /* ---------------- POI 锚点 ---------------- */
  const poi = (id, x, y, z) => {
    const a = new THREE.Object3D(); a.name = 'poi_' + id;
    a.position.set(x, y, z); g.add(a);
  };
  poi('tunnel', 0, 3.4, -12);
  poi('grow', 0, 2.6, 4);
  poi('header', -10.6, 1.6, 0);
  poi('shed', 11.6, 2.2, -8);

  const dust = new THREE.Color(0x9e5b3d);
  [M.rib, M.end, M.trim, M.steel, M.slab, M.pipe].forEach((m) => m.color.lerp(dust, 0.06));

  g.userData.nightMats = nightMats;
  g.userData.lights = [
    { color: 0xff8ab5, pos: [0, 2.4, 0], range: 30 },      // 排中补光泛光
  ];
  return g;
}
