// viewer/units/res-eclss-01.js
// 制氧与气体储配站 —— 全城氧气/缓冲气的产、储、配总站。
// 设计册：E:\Claude\mars-eclss（L0 人口与代谢总账 / L1 制氧路线 / L2 闭环率 / L4 气体储配）
// 几何叙事（核心不做黑盒）：
//   左端 高氯酸盐脱除支线（毒物→氧）→ 中央 电解槽厅（剖开露电极堆）
//   → 压缩机橇 → 后排 O2/N2/Ar 立式罐组（EN 1089-3 色标）→ 右端 充装台
//   一条白管（氧）从硫厂进来穿过全站；一条灰管（大气）从进气塔进来分离出缓冲气。
export const meta = {
  id: 'res-eclss-01',
  name: '制氧与气体储配站',
  name_en: 'Oxygen & Gas Storage Plant',
  size_m: 48,
  effects: ['glow_windows'],
};

export function build(THREE) {
  const g = new THREE.Group();

  // ---------- 确定性伪随机 & 噪声 ----------
  let _seed = 20260809;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  const vnoise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    let a = 0;
    for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 1; dy++) for (let dz = 0; dz <= 1; dz++)
      a += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    return a;
  };

  // ---------- 材质 ----------
  const lam = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const M = {
    white:    lam(0xd8d5cd),        // 工艺白（壳体/罐体）
    whiteDust:lam(0xc2bcb0),
    grey:     lam(0x8d8a84),
    dark:     lam(0x3a3835),
    steel:    lam(0x9aa0a6),
    orange:   lam(0xd97a2b),        // 安全橙（护栏/警示）
    copper:   lam(0xb2704a),        // 铜母排
    o2:       lam(0xe9eef2),        // O2 罐体（EN 1089-3：白）
    o2sh:     lam(0x2f6fb0),        // O2 肩环（本城加蓝识别环）
    n2:       lam(0x2a2a2c),        // N2 肩环（黑）
    ar:       lam(0x1d5c3a),        // Ar 肩环（深绿）
    pipeO2:   lam(0xeceff1),        // 氧管：白
    pipeAtm:  lam(0x6f6a63),        // 大气/缓冲气管：灰
    pipeCO2:  lam(0x3f9d92),        // CO2 母管：青（与 quarter/ISRU 同色）
    pipeH2O:  lam(0x2f6fb0),        // 水管：蓝
    hot:      lam(0x8c3b23),        // 高温段（分解炉）
    glowWin:  lam(0xffd9a0, { emissive: 0xffd9a0, emissiveIntensity: 0.0 }),
    glowScr:  lam(0x9fe8dc, { emissive: 0x9fe8dc, emissiveIntensity: 0.0 }),
    glowGrn:  lam(0x8ef0a8, { emissive: 0x8ef0a8, emissiveIntensity: 0.0 }),
    blink:    lam(0xd8422b, { emissive: 0xd8422b, emissiveIntensity: 2.0 }),
    elec:     lam(0x394a5a),        // 电极堆暗面
    elecHot:  lam(0xc45a2e, { emissive: 0xc45a2e, emissiveIntensity: 0.35 }), // 800C 堆芯
    soil:     lam(0x9e5b3d),
    salt:     lam(0xcfc4a8),        // 洗盐蒸残（高氯酸盐）
    saltOut:  lam(0x8e8778),        // 分解后残盐 MgCl2
  };

  // ---------- 快捷函数 ----------
  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || g).add(m);
    return m;
  };
  const cyl = (r1, r2, h, mat, x, y, z, seg, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 12), mat);
    m.position.set(x, y, z);
    (parent || g).add(m);
    return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    (parent || g).add(m);
    return m;
  };
  // 水平管段（沿 X 或 Z）
  const pipeX = (x0, x1, y, z, r, mat, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), 8), mat);
    m.rotation.z = Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, z);
    (parent || g).add(m); return m;
  };
  const pipeZ = (z0, z1, y, x, r, mat, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), 8), mat);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, (z0 + z1) / 2);
    (parent || g).add(m); return m;
  };
  const anchor = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); g.add(a); return a;
  };
  // 安全橙护栏（沿 X 的一段）
  const rail = (x0, x1, y, z, parent) => {
    const n = Math.max(2, Math.round(Math.abs(x1 - x0) / 1.6));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      box(0.07, 1.0, 0.07, M.orange, x, y + 0.5, z, parent);
    }
    box(Math.abs(x1 - x0), 0.07, 0.07, M.orange, (x0 + x1) / 2, y + 1.0, z, parent);
    box(Math.abs(x1 - x0), 0.06, 0.06, M.orange, (x0 + x1) / 2, y + 0.55, z, parent);
  };

  const nightMats = [M.glowWin, M.glowScr, M.glowGrn, M.elecHot];
  const blinkMats = [M.blink];
  const spinners = [];

  // ======================================================================
  // 0. 场坪：烧结硬化坪 + 车辙 + 散落砾石
  // ======================================================================
  {
    const W = 46, D = 30;
    const geo = new THREE.PlaneGeometry(W, D, 14, 10);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(0x8a6a55), cB = new THREE.Color(0xa8836a), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), pz = pos.getZ(i);
      pos.setY(i, (vnoise(px * 0.35, 0, pz * 0.35) - 0.5) * 0.09);
      const n = 0.6 * vnoise(px * 0.14, 0, pz * 0.14) + 0.4 * vnoise(px * 0.9, 3, pz * 0.9);
      tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n)));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const pad = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    pad.position.y = 0.06;
    g.add(pad);
    // 车辙（进站道，朝 +Z 出口）
    box(0.55, 0.03, 26, M.dark, 8.0, 0.10, 1.5);
    box(0.55, 0.03, 26, M.dark, 9.9, 0.10, 1.5);
    // 散落砾石
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    for (let i = 0; i < 16; i++) {
      const s = 0.10 + rnd() * 0.13, sy = s * (0.55 + rnd() * 0.45);
      const rk = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.soil : M.whiteDust);
      rk.scale.set(s, sy, s);
      rk.rotation.y = rnd() * 6.283;
      rk.position.set(-22 + rnd() * 44, 0.12 - 0.2 * sy + 1.618 * sy, -14 + rnd() * 28);
      g.add(rk);
    }
  }

  // ======================================================================
  // 1. 电解槽厅（剖切：三面墙 + 顶盖 + 开口面边柱，朝 +Z 敞开）
  //    内含 4 台电解模块，逐台前伸错位，露出电极堆前缘
  // ======================================================================
  const HX = -5.0, HZ = -7.0, HW = 18.0, HD = 8.0, HH = 6.2;   // 厅心/跨度/进深/高
  {
    const t = 0.3;
    box(HW, HH, t, M.white, HX, HH / 2, HZ - HD / 2);                     // 背墙
    box(t, HH, HD, M.white, HX - HW / 2, HH / 2, HZ);                     // 左墙
    box(t, HH, HD, M.white, HX + HW / 2, HH / 2, HZ);                     // 右墙
    box(HW + 0.4, 0.3, HD + 0.4, M.whiteDust, HX, HH + 0.15, HZ);         // 顶盖
    box(HW + 0.7, 0.16, HD + 0.7, M.grey, HX, HH + 0.36, HZ);             // 顶盖压条
    box(t, HH, t, M.white, HX - HW / 2, HH / 2, HZ + HD / 2);             // 开口面边柱
    box(t, HH, t, M.white, HX + HW / 2, HH / 2, HZ + HD / 2);
    box(HW, 0.4, t, M.grey, HX, HH - 0.2, HZ + HD / 2);                   // 开口面上过梁
    box(HW + 0.5, 0.35, HD + 0.5, M.grey, HX, 0.18, HZ);                  // 底部裙边
    // 背墙夜光窗带
    for (let i = 0; i < 5; i++)
      box(1.5, 0.7, 0.1, M.glowWin, HX - 6.4 + i * 3.2, 4.6, HZ - HD / 2 + 0.2);
    // 屋面桁架（开口面看得见）
    for (let i = 0; i <= 4; i++) {
      const x = HX - HW / 2 + i * HW / 4;
      beam(x, HH, HZ - HD / 2, x, HH, HZ + HD / 2, 0.16, M.steel);
      beam(x, HH - 1.1, HZ + HD / 2, x, HH, HZ + HD / 2 - 1.4, 0.12, M.steel);
    }
  }

  // --- 4 台电解模块：#1/#2 = SOEC 高温水蒸气电解，#3/#4 = SOXE CO2 电解 ---
  const stacks = [];
  for (let i = 0; i < 4; i++) {
    const sx = HX - 6.6 + i * 4.4;
    const sz = HZ - 1.6 + (i % 2) * 0.9;              // 逐台错位，都露前缘
    const isCO2 = i >= 2;
    const mod = new THREE.Group();
    mod.position.set(sx, 0, sz);
    g.add(mod);
    // 基座 + 保温外壳（背侧封闭，前侧敞开露电极堆）
    box(3.4, 0.5, 3.0, M.grey, 0, 0.25, 0, mod);
    box(3.4, 3.6, 0.25, M.white, 0, 2.3, -1.38, mod);           // 后壳
    box(0.25, 3.6, 2.8, M.white, -1.58, 2.3, 0, mod);           // 侧壳
    box(0.25, 3.6, 2.8, M.white, 1.58, 2.3, 0, mod);
    box(3.4, 0.28, 3.0, M.whiteDust, 0, 4.24, 0, mod);          // 顶盖
    // 电极堆：一叠薄板（前缘露出），热区自发光
    const NP = 9;
    for (let k = 0; k < NP; k++) {
      const y = 1.0 + k * 0.26;
      box(2.5, 0.15, 2.2, k % 2 ? M.elec : M.steel, 0, y, 0.1, mod);
      box(2.62, 0.07, 0.16, M.elecHot, 0, y, 1.16, mod);        // 前缘热边（800 C）
    }
    // 堆压紧端板 + 拉杆
    box(2.8, 0.3, 2.5, M.dark, 0, 0.85, 0.05, mod);
    box(2.8, 0.3, 2.5, M.dark, 0, 1.0 + NP * 0.26, 0.05, mod);
    for (const dx of [-1.2, 1.2]) for (const dz of [-0.9, 0.9])
      cyl(0.06, 0.06, NP * 0.26 + 0.5, M.steel, dx, 1.15 + NP * 0.26 / 2, dz + 0.05, 6, mod);
    // 铜母排（正负极，露在开口侧）
    box(0.14, 0.5, 2.4, M.copper, -1.35, 2.4, 0.4, mod);
    box(0.14, 0.5, 2.4, M.copper, 1.35, 2.4, 0.4, mod);
    // 进料/产气管：SOEC 走蓝（水/蒸汽），SOXE 走灰（大气 CO2）；出气一律白（O2）
    cyl(0.13, 0.13, 1.4, isCO2 ? M.pipeAtm : M.pipeH2O, -1.05, 4.9, -0.6, 8, mod);
    cyl(0.15, 0.15, 1.6, M.pipeO2, 1.05, 5.0, -0.6, 8, mod);
    // 尾气（CO2 电解的 CO 侧 / SOEC 的 H2 侧）
    cyl(0.10, 0.10, 1.2, M.pipeCO2, 0, 4.8, -1.1, 8, mod);
    // 铭牌与状态灯
    box(1.1, 0.34, 0.06, M.dark, 0, 3.9, 1.42, mod);
    box(0.16, 0.16, 0.07, isCO2 ? M.glowScr : M.glowGrn, -0.42, 3.9, 1.45, mod);
    stacks.push(mod);
  }
  // 厅前操作平台与护栏
  box(HW - 1.0, 0.25, 1.6, M.grey, HX, 0.62, HZ + HD / 2 - 0.4);
  rail(HX - HW / 2 + 0.6, HX + HW / 2 - 0.6, 0.74, HZ + HD / 2 + 0.32);
  anchor('poi_stack', HX + 1.0, 3.4, HZ + 4.6);

  // ======================================================================
  // 2. 高氯酸盐脱除支线（左端）：进料斗 → 回转分解炉 → 冷凝/集氧 → 残盐堆
  // ======================================================================
  {
    const PX = -19.0, PZ = -2.0;
    // 进料斗（开口容器：DoubleSide 锥筒，内放盐色料面）
    const hopGeo = new THREE.CylinderGeometry(1.25, 0.5, 1.9, 14, 1, true);
    const hop = new THREE.Mesh(hopGeo, new THREE.MeshLambertMaterial({
      color: 0xb9b3a6, side: THREE.DoubleSide,
    }));
    hop.position.set(PX, 3.4, PZ - 1.6); g.add(hop);
    const lid = new THREE.Mesh(new THREE.CircleGeometry(1.12, 14), M.salt);
    lid.rotation.x = -Math.PI / 2; lid.position.set(PX, 4.05, PZ - 1.6); g.add(lid);
    cyl(0.28, 0.28, 1.0, M.salt, PX, 4.3, PZ - 1.6, 10);        // 略高出沿口的小料尖
    // 斗腿排架（beam 桁架，不用光杆）
    for (const [dx, dz] of [[-1.0, -1.0], [1.0, -1.0], [-1.0, 1.0], [1.0, 1.0]]) {
      beam(PX + dx, 0.1, PZ - 1.6 + dz, PX + dx * 0.45, 2.5, PZ - 1.6 + dz * 0.45, 0.14, M.steel);
      beam(PX + dx, 1.3, PZ - 1.6 + dz, PX + dx * 0.45, 2.5, PZ - 1.6 + dz * 0.45, 0.09, M.steel);
    }
    // 回转分解炉（4 度倾斜，350~450 C —— 低于硫厂窑，刻意的）
    const kiln = new THREE.Group();
    kiln.position.set(PX + 0.4, 2.4, PZ + 1.9);
    kiln.rotation.z = -4 * Math.PI / 180;
    g.add(kiln);
    cyl(0.72, 0.72, 6.4, M.hot, 0, 0, 0, 14, kiln).rotation.z = Math.PI / 2;
    // 齿圈与托轮（动力核心可见）
    for (const dx of [-1.8, 1.6]) {
      const ring = cyl(0.86, 0.86, 0.22, M.steel, dx, 0, 0, 16, kiln);
      ring.rotation.z = Math.PI / 2;
    }
    const gear = cyl(1.02, 1.02, 0.3, M.dark, -1.8, 0, 0, 18, kiln);
    gear.rotation.z = Math.PI / 2;
    gear.name = 'perc_gear';
    spinners.push({ node: 'perc_gear', axis: 'y', rpm: 6 });
    box(1.0, 0.9, 0.9, M.grey, PX - 1.6, 1.5, PZ + 1.9);        // 传动电机壳
    cyl(0.22, 0.22, 0.6, M.dark, PX - 1.05, 1.9, PZ + 1.9, 10).rotation.z = Math.PI / 2;
    // 保温外壳（半开：只做背侧与顶，前侧露筒身）
    box(6.8, 0.22, 1.9, M.whiteDust, PX + 0.4, 3.35, PZ + 1.9);
    box(6.8, 1.6, 0.22, M.white, PX + 0.4, 2.6, PZ + 1.05);
    // 出气头（氧！）→ 白管接总站
    box(1.2, 1.4, 1.2, M.steel, PX + 3.9, 2.6, PZ + 1.9);
    cyl(0.16, 0.16, 2.4, M.pipeO2, PX + 3.9, 4.4, PZ + 1.9, 8);
    // 残盐（MgCl2）落料堆：颜色从盐白变灰 —— 脱氧完成的可视证据
    {
      const geo = new THREE.ConeGeometry(1.5, 1.1, 20, 5);
      const pos = geo.attributes.position;
      const col = new Float32Array(pos.count * 3);
      const cA = new THREE.Color(0x8e8778), cB = new THREE.Color(0xb5ad9b), tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        let px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
        if (Math.hypot(px, pz) > 0.05 && py < 0.5) {
          const k = 1 + (vnoise(px * 1.6, py * 1.6, pz * 1.6) - 0.5) * 0.18;
          px *= k; pz *= k; pos.setX(i, px); pos.setZ(i, pz);
        }
        const n = 0.6 * vnoise(px * 2.1, py * 2.1, pz * 2.1) + 0.4 * vnoise(px * 4.7, py * 4.7 + 5, pz * 4.7);
        tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n * 0.85)));
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.computeVertexNormals();
      const pile = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
      pile.position.set(PX + 4.6, 0.60, PZ + 3.6);
      g.add(pile);
    }
    // 洗盐液蒸残进料箱（与 dome-hall 洗盐卡互引）
    box(1.6, 1.2, 1.4, M.grey, PX - 1.2, 0.6, PZ + 4.2);
    box(1.3, 0.14, 1.1, M.salt, PX - 1.2, 1.25, PZ + 4.2);
    pipeZ(PZ + 4.9, PZ + 8.0, 1.0, PX - 1.2, 0.10, M.pipeH2O);   // 洗盐液自 dome 来
    anchor('poi_perc', PX + 1.2, 3.8, PZ + 4.2);
  }

  // ======================================================================
  // 3. 立式储罐组（后排，EN 1089-3 色标：O2 白 / N2 黑 / Ar 深绿）
  //    4 只 O2 + 4 只 N2 + 3 只 Ar，D1.2 x H4.0（圆柱+半球端）
  // ======================================================================
  const TANK_Z = 8.2;
  const tankSpecs = [];
  for (let i = 0; i < 4; i++) tankSpecs.push(['o2', -20.0 + i * 2.6]);
  for (let i = 0; i < 4; i++) tankSpecs.push(['n2', -8.2 + i * 2.6]);
  for (let i = 0; i < 3; i++) tankSpecs.push(['ar', 3.6 + i * 2.6]);
  {
    // 共用基础梁 + 防撞墩
    box(38.0, 0.45, 2.2, M.grey, -6.0, 0.22, TANK_Z);
    box(38.4, 0.2, 2.6, M.dark, -6.0, 0.46, TANK_Z);
    const D = 1.2, H = 4.0, r = D / 2, Lc = H - D;
    for (const [kind, tx] of tankSpecs) {
      const shoulder = kind === 'o2' ? M.o2sh : (kind === 'n2' ? M.n2 : M.ar);
      const grp = new THREE.Group();
      grp.position.set(tx, 0.45, TANK_Z);
      g.add(grp);
      // 支腿裙座
      cyl(r * 0.95, r * 1.05, 0.7, M.steel, 0, 0.35, 0, 10, grp);
      // 罐身
      cyl(r, r, Lc, M.o2, 0, 0.7 + r + Lc / 2, 0, 10, grp);
      // 上下半球封头
      const capT = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2), M.o2);
      capT.position.set(0, 0.7 + r + Lc, 0); grp.add(capT);
      const capB = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 3, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.o2);
      capB.position.set(0, 0.7 + r, 0); grp.add(capB);
      // 肩环色标（EN 1089-3 就画在肩上）
      cyl(r * 1.02, r * 1.02, 0.42, shoulder, 0, 0.7 + r + Lc - 0.18, 0, 10, grp);
      // 顶阀组 + 出口短管
      box(0.34, 0.3, 0.34, M.dark, 0, 0.7 + r + Lc + r + 0.12, 0, grp);
      cyl(0.09, 0.09, 0.5, kind === 'o2' ? M.pipeO2 : M.pipeAtm, 0, 0.7 + r + Lc + r + 0.45, 0, 6, grp);
      // 液位/压力标尺（竖白条 + 刻度块）
      box(0.05, Lc * 0.8, 0.05, M.dark, r * 0.98, 0.7 + r + Lc / 2, 0.32, grp);
      for (let k = 0; k < 4; k++)
        box(0.16, 0.05, 0.05, M.orange, r * 0.98, 0.9 + r + k * (Lc * 0.75 / 3), 0.32, grp);
    }
    // 罐区栏杆 + 泄压导流墙
    rail(-21.4, 6.4, 0.45, TANK_Z - 1.35);
    box(38.0, 1.1, 0.3, M.whiteDust, -6.0, 0.55, TANK_Z + 1.3);
    // 罐区汇管（白=氧，灰=缓冲气）与竖立管
    pipeX(-20.6, -7.0, 5.3, TANK_Z - 0.9, 0.13, M.pipeO2);
    pipeX(-8.8, 8.6, 5.3, TANK_Z - 0.9, 0.13, M.pipeAtm);
    for (const [kind, tx] of tankSpecs)
      cyl(0.07, 0.07, 1.5, kind === 'o2' ? M.pipeO2 : M.pipeAtm, tx, 4.6, TANK_Z - 0.9, 6);
    anchor('poi_tanks', -6.0, 4.0, TANK_Z - 2.6);
  }

  // ======================================================================
  // 4. 压缩机橇（两台，飞轮可见并旋转）+ 干燥吸附塔对
  // ======================================================================
  {
    const CX = 8.5, CZ = -6.0;
    box(9.0, 0.4, 5.0, M.grey, CX, 0.2, CZ);                    // 橇座
    for (let i = 0; i < 2; i++) {
      const x = CX - 2.1 + i * 4.2;
      box(3.2, 1.5, 1.9, M.white, x, 1.15, CZ - 0.5);           // 机体
      box(3.4, 0.18, 2.1, M.grey, x, 1.95, CZ - 0.5);           // 顶压条
      box(1.5, 1.1, 1.3, M.dark, x - 1.9, 0.95, CZ - 0.5);      // 电机
      // 飞轮 / 联轴护罩（动力核心可见）
      const fw = cyl(0.62, 0.62, 0.22, M.steel, x + 1.85, 1.15, CZ - 0.5, 14);
      fw.rotation.z = Math.PI / 2;
      fw.name = 'comp_fw_' + i;
      spinners.push({ node: 'comp_fw_' + i, axis: 'y', rpm: 110 });
      // 级间冷却器（翅片）
      for (let k = 0; k < 6; k++)
        box(0.1, 0.9, 1.6, M.steel, x - 1.0 + k * 0.4, 2.5, CZ + 1.1);
      box(3.0, 0.24, 1.8, M.grey, x, 3.02, CZ + 1.1);
      // 吸入/排出管：白进白出（氧线），灰线另一台
      cyl(0.12, 0.12, 1.4, i ? M.pipeAtm : M.pipeO2, x - 1.5, 2.7, CZ - 1.3, 8);
      cyl(0.14, 0.14, 2.6, i ? M.pipeAtm : M.pipeO2, x + 1.5, 3.4, CZ - 1.3, 8);
      box(0.5, 0.34, 0.12, M.glowScr, x, 1.9, CZ + 0.48);       // 本地状态屏
    }
    // 干燥吸附塔对（双塔切换：一塔吸附一塔再生）
    for (let i = 0; i < 2; i++) {
      const x = CX + 5.2 + i * 1.5;
      cyl(0.55, 0.55, 3.4, M.white, x, 2.1, CZ + 1.2, 12);
      cyl(0.58, 0.58, 0.3, i ? M.orange : M.o2sh, x, 3.7, CZ + 1.2, 12);
      cyl(0.55, 0.2, 0.5, M.steel, x, 0.45, CZ + 1.2, 12);
    }
    pipeX(CX + 5.2, CX + 6.7, 4.1, CZ + 1.2, 0.1, M.pipeO2);
    rail(CX - 4.4, CX + 4.4, 0.4, CZ + 2.6);
    anchor('poi_comp', CX, 2.6, CZ + 3.2);
  }

  // ======================================================================
  // 5. 充装台（EVA 背包瓶 + 巡逻车瓶组）：充装臂 + 待充瓶架 + 已充瓶架
  // ======================================================================
  {
    const FX = 18.0, FZ = 1.5;
    box(6.0, 0.3, 7.0, M.grey, FX, 0.15, FZ);                   // 台面
    box(6.2, 0.16, 7.2, M.dark, FX, 0.33, FZ);
    // 顶棚（三面开敞，只做顶 + 后柱）
    for (const [dx, dz] of [[-2.6, -3.0], [2.6, -3.0], [-2.6, 3.0], [2.6, 3.0]])
      beam(FX + dx, 0.3, FZ + dz, FX + dx, 3.4, FZ + dz, 0.16, M.steel);
    box(6.4, 0.2, 7.4, M.whiteDust, FX, 3.5, FZ);
    box(6.6, 0.12, 7.6, M.grey, FX, 3.66, FZ);
    // 充装汇管（从压缩机来的白管）
    pipeX(11.5, FX - 2.4, 3.1, FZ - 2.2, 0.12, M.pipeO2);
    box(1.0, 0.7, 0.5, M.dark, FX - 2.0, 2.9, FZ - 2.2);        // 计量盘
    // 6 支充装软管接头（橙色，垂下）
    for (let i = 0; i < 6; i++) {
      const x = FX - 2.0 + (i % 3) * 2.0, z = FZ - 2.2 + Math.floor(i / 3) * 1.6;
      cyl(0.05, 0.05, 1.1, M.orange, x, 2.4, z, 6);
      box(0.18, 0.18, 0.18, M.dark, x, 1.82, z);
    }
    // 待充瓶架（灰帽）与已充瓶架（蓝帽）—— 状态对照
    for (let i = 0; i < 5; i++) {
      cyl(0.16, 0.16, 1.15, M.steel, FX - 2.2 + i * 1.1, 0.95, FZ + 2.5, 8);
      cyl(0.17, 0.17, 0.16, M.grey, FX - 2.2 + i * 1.1, 1.60, FZ + 2.5, 8);
    }
    for (let i = 0; i < 5; i++) {
      cyl(0.16, 0.16, 1.15, M.o2, FX - 2.2 + i * 1.1, 0.95, FZ + 0.9, 8);
      cyl(0.17, 0.17, 0.16, M.o2sh, FX - 2.2 + i * 1.1, 1.60, FZ + 0.9, 8);
    }
    box(1.4, 0.2, 0.8, M.orange, FX, 0.42, FZ + 3.2);           // 瓶车踏板
    anchor('poi_fill', FX, 2.2, FZ + 3.6);
  }

  // ======================================================================
  // 6. 大气进气塔（缓冲气 N2/Ar 与 CO2 的源头）+ 泄放立管 + 状态屏
  // ======================================================================
  {
    // --- 进气塔：过滤帽 + 多级压缩 + 低温分离柱
    const AX = 19.0, AZ = -9.0;
    box(3.0, 0.4, 3.0, M.grey, AX, 0.2, AZ);
    for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
      beam(AX + dx, 0.4, AZ + dz, AX + dx * 0.55, 9.0, AZ + dz * 0.55, 0.16, M.steel);
      beam(AX + dx, 4.2, AZ + dz, AX - dx * 0.55, 5.6, AZ - dz * 0.55, 0.09, M.steel);
    }
    cyl(0.62, 0.62, 7.4, M.white, AX, 5.0, AZ, 12);             // 分离柱
    cyl(0.68, 0.68, 0.3, M.pipeAtm, AX, 8.4, AZ, 12);
    // 进气过滤帽（尘暴季的第一道关口）
    cyl(1.05, 0.7, 0.8, M.grey, AX, 9.3, AZ, 14);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      box(0.5, 0.5, 0.08, M.dark, AX + Math.cos(a) * 0.86, 9.25, AZ + Math.sin(a) * 0.86)
        .rotation.y = -a;
    }
    // 冷箱（CO2 冻出的地方，蓝白）
    box(2.2, 2.0, 1.8, M.white, AX - 2.4, 1.4, AZ + 0.6);
    box(2.36, 0.16, 1.96, M.o2sh, AX - 2.4, 2.5, AZ + 0.6);
    cyl(0.14, 0.14, 2.2, M.pipeCO2, AX - 2.4, 3.6, AZ + 0.6, 8);   // CO2 出料 → Sabatier
    cyl(0.12, 0.12, 1.6, M.pipeAtm, AX - 1.1, 4.2, AZ, 8);         // 缓冲气 → 罐区
    pipeX(AX - 2.4, 11.0, 4.7, AZ + 0.6, 0.13, M.pipeCO2);
    box(0.9, 0.6, 0.12, M.glowGrn, AX - 2.4, 1.7, AZ + 1.52);
    anchor('poi_intake', AX - 1.0, 5.0, AZ + 2.4);

    // --- 泄放立管（超压安全排放，全站最高点，顶端红灯）
    const VX = -22.6, VZ = -10.4;
    box(1.6, 0.4, 1.6, M.grey, VX, 0.2, VZ);
    cyl(0.26, 0.26, 12.0, M.steel, VX, 6.2, VZ, 10);
    cyl(0.42, 0.42, 0.6, M.orange, VX, 12.0, VZ, 10);
    for (const dz of [-1.0, 1.0]) beam(VX, 0.4, VZ + dz, VX, 5.4, VZ + dz * 0.2, 0.10, M.steel);
    box(0.34, 0.34, 0.34, M.blink, VX, 12.5, VZ);               // 障碍灯
    // 泄放前的消音/扩散罐
    cyl(0.5, 0.5, 1.4, M.white, VX + 1.3, 0.9, VZ + 0.6, 10);
    pipeX(VX + 1.3, VX + 3.4, 1.5, VZ + 0.6, 0.1, M.pipeO2);

    // --- 站前状态大屏（全城代谢总账）
    const SX = -1.5, SZ = 4.0;
    for (const dx of [-2.7, 2.7]) beam(SX + dx, 0, SZ, SX + dx, 3.2, SZ, 0.18, M.steel);
    box(6.0, 2.4, 0.22, M.dark, SX, 3.9, SZ);
    box(5.6, 2.05, 0.08, M.glowScr, SX, 3.9, SZ + 0.14);
    // 屏上三条"账目条"：氧 / 水 / 缓冲气 —— 与卡片同色
    box(4.8, 0.24, 0.05, M.glowGrn, SX - 0.2, 4.55, SZ + 0.2);
    box(3.1, 0.24, 0.05, M.o2sh, SX - 1.05, 4.05, SZ + 0.2);
    box(2.0, 0.24, 0.05, M.orange, SX - 1.6, 3.55, SZ + 0.2);
    box(6.3, 0.16, 0.3, M.grey, SX, 5.18, SZ);
    anchor('poi_screen', SX, 3.9, SZ + 1.6);
  }

  // ======================================================================
  // 7. 站间管廊（进/出城的四条线，颜色即用途）
  //    白=氧（自 res-sulfur-01 来 / 去地下城）  青=CO2（去 res-isru-01）
  //    灰=大气/缓冲气   蓝=水（自 Rodwell 支线）
  // ======================================================================
  {
    for (let i = 0; i <= 5; i++) {                 // 管墩
      const x = -21 + i * 8.5;
      box(0.6, 2.4, 0.6, M.grey, x, 1.2, 13.4);
      box(1.0, 0.2, 1.0, M.dark, x, 2.4, 13.4);
    }
    pipeX(-22, 22, 2.72, 13.15, 0.15, M.pipeO2);
    pipeX(-22, 22, 2.72, 13.65, 0.13, M.pipeCO2);
    pipeX(-22, 22, 2.44, 13.15, 0.11, M.pipeAtm);
    pipeX(-22, 22, 2.44, 13.65, 0.10, M.pipeH2O);
    // 支管下到罐区/厅
    pipeZ(10.0, 13.0, 2.72, -14.0, 0.13, M.pipeO2);
    pipeZ(10.0, 13.0, 2.44, 2.0, 0.10, M.pipeH2O);
    // 硫厂来的氧接收阀站（白管进站的第一站）
    box(1.8, 1.6, 1.4, M.white, -21.0, 0.8, 11.4);
    box(1.94, 0.16, 1.54, M.o2sh, -21.0, 1.66, 11.4);
    cyl(0.15, 0.15, 1.5, M.pipeO2, -21.0, 2.3, 11.4, 8);
    box(0.6, 0.4, 0.1, M.glowGrn, -21.0, 1.0, 12.12);
  }

  // ======================================================================
  // 8. 尘膜 pass（结尾统一执行）
  // ======================================================================
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.whiteDust, M.grey, M.orange, M.steel, M.o2, M.copper,
   M.pipeO2, M.pipeAtm, M.pipeCO2, M.pipeH2O, M.o2sh, M.n2, M.ar,
   M.salt, M.saltOut, M.hot].forEach(m => m.color.lerp(dust, 0.05));

  // ---------- 引擎钩子 ----------
  g.userData.spinners = spinners;
  g.userData.nightMats = nightMats;
  g.userData.blinkMats = blinkMats;
  g.userData.lights = [
    { color: 0xffd9a0, pos: [-5, 5.6, -3.2], range: 26 },     // 电解厅
    { color: 0xbfe6ff, pos: [-6, 4.6, 7.0], range: 24 },      // 罐区
    { color: 0xffd9a0, pos: [18, 3.2, 1.5], range: 18 },      // 充装台
  ];
  return g;
}
