// ops-depot-01 —— 物流场站(集装箱堆场 + 龙门吊 + 拱仓)
// 契约(MODELS.md §4):1u=1m;原点=场坪中心地面点;+Y 上;正面(装卸坪)朝 +Z;
// THREE 传入;无外部资源;确定性伪随机。
// 使命:密度资产 —— 城市的物资吞吐节点。东干道旁,承接 CZ-10B 发射场
//   (进出口集装箱)与矿场/ISRU(散货)之间的转运。
// 账本挂钩:长十乙 ISRU 战役账(200 kWe → 3.3 发/会合窗口,LMO 18~24 t)
//   → 每窗口进出口箱量;0.38 g 起重账 → 同吨位吊具轻 2.6×。
// 动画全声明式:oscillators(吊车小车沿主梁往复) + blinkMats(梁端警示灯)
//   + nightMats(灯杆/仓门灯)。

export const meta = {
  id: 'ops-depot-01',
  name: '物流场站',
  name_en: 'Logistics Depot',
  size_m: 46,
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = meta.id;
  const nightMats = [], blinkMats = [];
  const hash = (k) => { const s = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  const M = {
    steel:  new THREE.MeshStandardMaterial({ color: 0x6a7076, roughness: 0.5, metalness: 0.6 }),
    crane:  new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.55, metalness: 0.35 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x24272c, roughness: 0.7 }),
    hull:   new THREE.MeshStandardMaterial({ color: 0xcfcac0, roughness: 0.75 }),
    trim:   new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.55, metalness: 0.4 }),
    slab:   new THREE.MeshStandardMaterial({ color: 0x8d857a, roughness: 0.95 }),
    line:   new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.9 }),
    tire:   new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.9 }),
  };
  const boxMats = [0x8a3a2e, 0x33608a, 0x777d82, 0xc06a28, 0x5a6a4a].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffd9a0, emissiveIntensity: 1.0, roughness: 0.5 });
  const doorLit = new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffc37a, emissiveIntensity: 0.7, roughness: 0.5 });
  const beacon  = new THREE.MeshStandardMaterial({ color: 0x3a1210, emissive: 0xff3020, emissiveIntensity: 1.4, roughness: 0.5 });
  nightMats.push(lampMat, doorLit);
  blinkMats.push(beacon);

  const box = (p, w, h, d, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); if (ry) m.rotation.y = ry; p.add(m); return m;
  };
  const cyl = (p, r, h, mat, x, y, z, seg = 10, rz = 0) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, y, z); if (rz) m.rotation.z = rz; p.add(m); return m;
  };

  /* ---------------- 场坪(压实烧结板,吃地形起伏) ---------------- */
  box(g, 44, 0.5, 28, M.slab, 0, 0.05, 0);
  // 装卸坪泊位标线(+Z 前沿三个泊位)
  for (let i = 0; i < 3; i++) {
    const bx = -12 + i * 12;
    box(g, 0.24, 0.03, 6.5, M.line, bx - 3.6, 0.33, 10.2);
    box(g, 0.24, 0.03, 6.5, M.line, bx + 3.6, 0.33, 10.2);
    box(g, 7.4, 0.03, 0.24, M.line, bx, 0.33, 7.0);
  }

  /* ---------------- 龙门吊(跨堆场,x 向主梁) ---------------- */
  const crane = new THREE.Group();
  crane.position.set(0, 0, -1.5);
  // A 字腿 ×2(x=±10)+ 轨道垫梁
  for (const sx of [-10, 10]) {
    for (const sz of [-3.2, 3.2]) {
      const leg = cyl(crane, 0.28, 9.6, M.crane, sx, 4.8, sz * 0.55, 8);
      leg.rotation.x = sz > 0 ? -0.32 : 0.32;
    }
    box(crane, 1.4, 0.5, 7.6, M.crane, sx, 0.45, 0);        // 行走底梁
    for (const sz of [-2.9, 2.9])
      cyl(crane, 0.5, 0.4, M.dark, sx, 0.5, sz, 12, Math.PI / 2); // 行走轮
    box(crane, 1.2, 0.5, 1.2, M.crane, sx, 9.35, 0);        // 腿顶节点
  }
  box(crane, 22, 0.9, 1.5, M.crane, 0, 9.55, 0);            // 主梁
  box(crane, 22, 0.16, 0.9, M.trim, 0, 9.0, 0);             // 走台
  box(crane, 0.3, 0.3, 0.3, beacon, -10.8, 10.15, 0);       // 梁端警示灯
  box(crane, 0.3, 0.3, 0.3, beacon, 10.8, 10.15, 0);
  // 小车 + 吊具(oscillator 沿梁往复)
  const trolley = new THREE.Group();
  trolley.name = 'depot_trolley';
  trolley.position.set(0, 9.1, 0);
  box(trolley, 1.8, 0.6, 1.9, M.dark, 0, 0.2, 0);
  cyl(trolley, 0.09, 3.4, M.dark, -0.55, -1.9, 0, 6);
  cyl(trolley, 0.09, 3.4, M.dark, 0.55, -1.9, 0, 6);
  box(trolley, 2.2, 0.35, 1.1, M.crane, 0, -3.75, 0);       // 吊架
  for (const cx of [-0.95, 0.95])
    box(trolley, 0.14, 0.5, 0.14, M.dark, cx, -4.1, 0);     // 转锁爪
  crane.add(trolley);
  // 司机室
  box(crane, 1.3, 1.2, 1.1, M.hull, 8.6, 8.3, 1.15);
  box(crane, 1.0, 0.5, 0.06, doorLit, 8.6, 8.35, 1.72);
  g.add(crane);

  /* ---------------- 集装箱堆场(吊下两列,错落堆 1~2 层) ---------------- */
  const stacks = [[-7.5, -3.8, 2], [-2.5, -3.8, 1], [2.5, -3.8, 2], [7.5, -3.8, 1],
                  [-7.5, 0.8, 1], [-2.5, 0.8, 2], [7.5, 0.8, 1]];
  stacks.forEach(([sx, sz, n], i) => {
    for (let k = 0; k < n; k++) {
      const ry = (hash(i * 7.3 + k) - 0.5) * 0.06;
      const c = box(g, 4.4, 2.2, 2.4, boxMats[Math.floor(hash(i * 3.1 + k * 5.7) * 5)],
        sx + (hash(i + k * 2.3) - 0.5) * 0.3, 0.3 + 1.1 + k * 2.2, sz, ry);
      // 端门筋线
      box(g, 0.06, 2.0, 0.08, M.dark, sx + 2.21, 0.3 + 1.1 + k * 2.2, sz, ry);
    }
  });

  /* ---------------- 拱仓(散货/备件,-Z 后排,轴沿 x) ---------------- */
  const arch = new THREE.Group();
  arch.position.set(0, 0, -11.5);
  {
    const shellG = new THREE.CylinderGeometry(4.2, 4.2, 17, 16, 1, true, 0, Math.PI);
    shellG.rotateZ(Math.PI / 2);                 // 轴沿 x,半拱朝 +Y
    const shell = new THREE.Mesh(shellG, M.hull);
    shell.position.y = 0.3; arch.add(shell);
    const capG = new THREE.CircleGeometry(4.2, 16, 0, Math.PI);
    for (const [sx, ry] of [[-8.5, -Math.PI / 2], [8.5, Math.PI / 2]]) {
      const cap = new THREE.Mesh(capG, M.hull);
      cap.position.set(sx, 0.3, 0); cap.rotation.y = ry; arch.add(cap);
    }
    // 端门(东):卷帘门 + 门灯
    box(arch, 0.25, 3.4, 3.0, M.trim, 8.6, 2.0, 0);
    box(arch, 0.1, 3.0, 2.6, M.dark, 8.72, 1.8, 0);
    box(arch, 0.1, 0.35, 0.7, doorLit, 8.72, 3.9, 0);
    // 屋顶排风帽 ×2
    for (const vx of [-4, 3])
      cyl(arch, 0.3, 0.8, M.steel, vx, 4.7, 0, 8);
  }
  g.add(arch);

  /* ---------------- 平板拖车(泊位上,载一只箱) ---------------- */
  const trl = new THREE.Group();
  trl.position.set(0, 0.3, 10); trl.rotation.y = 0.08;
  box(trl, 5.6, 0.3, 2.4, M.steel, 0, 0.75, 0);
  for (const wx of [-1.9, 1.9]) for (const wz of [-1.05, 1.05]) {
    const w = cyl(trl, 0.42, 0.3, M.tire, wx, 0.42, wz, 12);
    w.rotation.x = Math.PI / 2;
  }
  box(trl, 0.5, 0.5, 2.2, M.dark, -2.9, 0.65, 0);           // 牵引销座
  box(trl, 4.4, 2.2, 2.4, boxMats[1], 0.4, 2.0, 0);
  g.add(trl);

  /* ---------------- 灯杆 ×2 + 充电桩 + 轮挡散件 ---------------- */
  for (const [lx, lz] of [[-19, 8], [19, 8]]) {
    cyl(g, 0.09, 7.5, M.steel, lx, 3.75 + 0.3, lz, 8);
    box(g, 0.9, 0.14, 0.5, M.trim, lx, 7.68, lz);
    box(g, 0.8, 0.06, 0.4, lampMat, lx, 7.58, lz);
  }
  box(g, 0.5, 1.15, 0.4, M.steel, -16.5, 0.85, 6);          // 充电桩
  box(g, 0.36, 0.2, 0.06, doorLit, -16.5, 1.28, 6.21);
  for (let i = 0; i < 4; i++)
    box(g, 0.5, 0.22, 0.22, M.trim, -14 + hash(i * 9.1) * 4, 0.41, 4 + hash(i * 4.7) * 2, hash(i) * 1.5);

  /* ---------------- POI 锚点 ---------------- */
  const poi = (id, x, y, z) => {
    const a = new THREE.Object3D(); a.name = 'poi_' + id;
    a.position.set(x, y, z); g.add(a);
  };
  poi('gantry', 0, 10.5, -1.5);
  poi('stack', -2.5, 4.2, -2.6);
  poi('arch', 0, 5.2, -11.5);
  poi('apron', 0, 2.2, 9.5);

  /* ---------------- 尘膜 ---------------- */
  const dust = new THREE.Color(0x9e5b3d);
  [M.steel, M.crane, M.hull, M.trim, M.slab, ...boxMats].forEach((m) => m.color.lerp(dust, 0.06));

  g.userData.nightMats = nightMats;
  g.userData.blinkMats = blinkMats;
  g.userData.oscillators = [
    { node: 'depot_trolley', prop: 'position', axis: 'x', amp: 6.5, period: 16 },
  ];
  g.userData.lights = [
    { color: 0xffd9a0, pos: [-19, 7.4, 8], range: 30 },
    { color: 0xffd9a0, pos: [19, 7.4, 8], range: 30 },
  ];
  return g;
}
