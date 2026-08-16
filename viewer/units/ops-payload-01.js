// ops-payload-01 —— 载荷处理厂房（洁净总装 · 加注 · 卧式合罩 · 转运）
//
// v2 设计翻案（08-15）：v1 建成 32 m 高的白色钢板洁净厂房，与 ops-vab-01 同两条
// 硬伤——比城里最高的建筑（hab-tunnel-01 20 m）还高，且配色是地球工业园。
// 改因同源：ops-vab-01 转卧式总装后，载荷也不再需要竖着装罩——**整流罩两半
// 卧放在托架上合拢**，厂房净高只由 Ø5.2 m 罩体决定而不是 12.5 m 罩高，
// 32 m → 12.4 m。结构随之换成烧结砖双拱 + 覆土（与 hab-village-01 / ops-vab-01
// 同语汇）：洁净室尤其吃这套——覆土给的是昼夜温波衰减与辐射屏蔽，
// 而拱壳在内压下是薄膜受力，不像方盒要抗弯。
//
// 组件：主拱=洁净总装间（卫星三轴支架 + 环形工作架）· 副拱=合罩间（整流罩两半
//   卧放成槽形，开口朝上露消声衬层）· 气闸风淋 · 土堤加注间 · 半埋 FFU 机房
//   · 出货装卸台与端门敞开的空载荷容器
// 核心不做黑盒：两座拱门常开朝 +Z，一眼看进去左罩右星；FFU 机房半埋但风管外露。
//
// 契约：1u=1m；原点 = 主拱内地坪中心；+Y 上；出货口朝 +Z。
// 动画：拱下单轨吊往复 + 加注间风向标（oscillators）；门口障碍灯（blinkMats）。
// POI：poi_cleanroom / poi_fairing / poi_fuel / poi_ffu / poi_dock

export const meta = {
  id: 'ops-payload-01',
  name: '载荷处理厂房',
  name_en: 'Payload Processing Facility',
  size_m: 72,                 // 实测最大边——manifest 同值，禁止缩放
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

const DEG = Math.PI / 180;

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'ops-payload-01';

  let _seed = 20260816;
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

  // ---------------------------------------------------------------- 材质（城内就地取材调色板）
  const std = (color, roughness = 0.9, metalness = 0.03) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const M = {
    brick:   std(0xb46b46, 0.94),
    brickD:  std(0x8f4f34, 0.96),
    vaultIn: std(0xa8735a, 0.94),        // 洁净拱内壁（涂封层，比 vab 略亮）
    rammed:  std(0x8a8378, 0.96),
    pad:     std(0x8a6047, 0.98),
    floor:   std(0xb3ab98, 0.9),         // 洁净地坪（封闭涂层）
    steel:   std(0x6a7076, 0.5, 0.6),
    dark:    std(0x24272c, 0.7),
    white:   std(0xe8e8e4, 0.55, 0.15),  // 机械白（设备专用）
    orange:  std(0xe07020, 0.7),
    fairing: std(0xded9cf, 0.6, 0.12),   // 整流罩壳（复材浅米）
    liner:   std(0x6f7378, 0.95),
    sat:     std(0xd8dce0, 0.55, 0.3),
    gold:    std(0xc9a24a, 0.45, 0.55),
    panel:   std(0x1e2a44, 0.45, 0.35),  // 太阳翼（城内光伏同色）
    duct:    std(0xb4bac0, 0.6, 0.25),
    tread:   std(0x6e4a33, 0.98),
  };
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffe6bf, emissive: 0xffd9a0, emissiveIntensity: 1.0, roughness: 0.35 });
  const cleanLamp = new THREE.MeshStandardMaterial({
    color: 0xf2fbff, emissive: 0xe8f6ff, emissiveIntensity: 1.0, roughness: 0.35 });
  const litGreen = new THREE.MeshStandardMaterial({
    color: 0x54ff7a, emissive: 0x3fe864, emissiveIntensity: 1.0, roughness: 0.4 });
  const blinkMat = new THREE.MeshStandardMaterial({
    color: 0xff4030, emissive: 0xff2515, emissiveIntensity: 2.0, roughness: 0.4 });
  g.userData.nightMats = [windowMat, cleanLamp, litGreen];
  g.userData.blinkMats = [blinkMat];

  // ---------------------------------------------------------------- 助手
  const box = (w, h, d, mat, x, y0, z, ry = 0, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y0 + h / 2, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  };
  const cyl = (r, h, mat, x, yc, z, seg = 12, parent = g) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, yc, z);
    parent.add(m);
    return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent = g) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    parent.add(m);
    return m;
  };
  const railing = (x0, z0, x1, z1, y, parent = g) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2.4));
    beam(x0, y + 1.0, z0, x1, y + 1.0, z1, 0.08, M.orange, parent);
    for (let i = 0; i <= n; i++)
      box(0.08, 1.0, 0.08, M.orange, x0 + (x1 - x0) * i / n, y, z0 + (z1 - z0) * i / n, 0, parent);
  };
  const anchor = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); g.add(a);
  };
  const berm = (profile, z0, z1, cA, cB) => {
    const n = profile.length, pos = [], col = [];
    const ca = new THREE.Color(cA), cb = new THREE.Color(cB), tmp = new THREE.Color();
    const push = (x, y, z) => {
      const j = 0.55 * vnoise(x * 0.14, y * 0.14, z * 0.14) + 0.45 * vnoise(x * 0.9, y * 0.9, z * 0.9);
      tmp.copy(ca).lerp(cb, Math.min(1, Math.max(0, j * 0.9 + 0.05)));
      pos.push(x, y, z); col.push(tmp.r, tmp.g, tmp.b);
    };
    const seg = 5;
    for (let s = 0; s < seg; s++) {
      const za = z0 + (z1 - z0) * s / seg, zb = z0 + (z1 - z0) * (s + 1) / seg;
      for (let i = 0; i < n; i++) {
        const [ax, ay] = profile[i], [bx, by] = profile[(i + 1) % n];
        push(ax, ay, za); push(bx, by, za); push(bx, by, zb);
        push(ax, ay, za); push(bx, by, zb); push(ax, ay, zb);
      }
    }
    for (const [zc, flip] of [[z0, false], [z1, true]]) {
      for (let i = 1; i < n - 1; i++) {
        const a = profile[0], b = profile[i], c = profile[i + 1];
        if (flip) { push(a[0], a[1], zc); push(c[0], c[1], zc); push(b[0], b[1], zc); }
        else { push(a[0], a[1], zc); push(b[0], b[1], zc); push(c[0], c[1], zc); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 1.0, metalness: 0 }));
    g.add(m);
    return m;
  };
  const vault = (cx, spring, rIn, rOut, z0, z1) => {
    const len = z1 - z0, zc = (z0 + z1) / 2;
    const shell = (r, col, side) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, len, 26, 1, true, Math.PI / 2, Math.PI),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.94, side }));
      m.position.set(cx, spring, zc);
      m.rotation.x = Math.PI / 2;
      g.add(m);
    };
    shell(rOut, M.brick.color, THREE.FrontSide);
    shell(rIn, M.vaultIn.color, THREE.BackSide);
    const nb = Math.max(2, Math.round(len / 5.5));
    for (let i = 0; i <= nb; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(rOut + 0.05, 0.26, 5, 20, Math.PI), M.brickD);
      ring.position.set(cx, spring, z0 + len * i / nb);
      g.add(ring);
    }
  };
  const archEnd = (cx, spring, rOut, z, doorR) => {
    const tym = new THREE.Mesh(
      new THREE.RingGeometry(doorR, rOut, 22, 1, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: M.brick.color, roughness: 0.94, side: THREE.DoubleSide }));
    tym.position.set(cx, spring, z);
    g.add(tym);
    for (const sx of [-1, 1])
      box(rOut - doorR, spring, 0.85, M.brick, cx + sx * (doorR + rOut) / 2, 0, z);
    box(doorR * 2 + 1.0, 0.45, 1.2, M.brickD, cx, spring + rOut - 0.2, z);
  };

  // ================================================================
  // 0. 场地
  // ================================================================
  box(70, 0.3, 68, M.pad, -8, -0.18, 4);
  for (const tx of [-1.4, 4.6]) box(0.5, 0.03, 14, M.tread, tx, 0.13, 27);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 22; i++) {
    const rx = -40 + rnd() * 62, rz = -30 + rnd() * 64;
    if (rx > -34 && rx < 12 && rz > -26 && rz < 32) continue;
    const s = 0.14 + rnd() * 0.2, sy = s * (0.5 + rnd() * 0.5);
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.pad : M.rammed);
    rock.position.set(rx, 0.12 - 0.3 * sy + 1.618 * sy, rz);
    rock.scale.set(s, sy, s);
    rock.rotation.y = rnd() * 6.28;
    g.add(rock);
  }

  // ================================================================
  // 1. 主拱：洁净总装间（内跨 14、内高 10.6、长 34）
  // ================================================================
  const SP = 3.6, RI = 7.0, RO = 7.6, Z0 = -17, Z1 = 17;
  box(15.4, 0.3, 34, M.floor, 0, 0.12, 0);
  for (const sx of [-1, 1]) box(1.2, SP, 34, M.brick, sx * (RI + 0.6), 0, 0);
  vault(0, SP, RI, RO, Z0, Z1);
  archEnd(0, SP, RO, Z1, 5.4);
  box(RI * 2 + 1.2, SP + RO, 0.85, M.brick, 0, 0, Z0);
  berm([[8.2, 0], [15.5, 0], [8.2, 5.6]], Z0, Z1, 0x8a4a30, 0x6b3823);
  // 拱顶洁净送风竖井 ×2（FFU 上来的风从这儿下）
  for (const zz of [-9, 7]) {
    cyl(0.8, 2.0, M.duct, 0, SP + RO + 0.5, zz, 10);
    cyl(1.0, 0.3, M.brickD, 0, SP + RO + 1.65, zz, 10);
  }
  // 顶部满铺送风面（垂直单向流，夜光）——高度沿拱内面走，避免穿出拱壳
  for (const dx of [-3.6, 0, 3.6]) {          // 按条的**外边缘**取拱高，整条才不穿壳
    const hw = 1.6, yArch = SP + Math.sqrt(Math.max(0.01, RI * RI - (Math.abs(dx) + hw) ** 2));
    box(hw * 2, 0.2, 26, cleanLamp, dx, yArch - 0.34, 0);
  }
  // 拱下单轨吊
  box(0.4, 0.4, 30, M.steel, 0, SP + RI - 1.6, 0);
  const trolley = new THREE.Group();
  trolley.name = 'pl_trolley';
  trolley.position.set(0, SP + RI - 2.0, 2);
  g.add(trolley);
  box(1.3, 0.8, 1.8, M.orange, 0, -0.4, 0, 0, trolley);
  cyl(0.05, 3.2, M.dark, 0, -2.2, 0, 6, trolley);
  box(0.6, 0.4, 0.3, M.orange, 0, -4.0, 0, 0, trolley);

  // ---- 卫星：三轴支架，太阳翼收拢（发射状态）----
  const sat = new THREE.Group();
  sat.position.set(-3.2, 0.27, -5);
  g.add(sat);
  box(3.2, 1.1, 3.2, M.steel, 0, 0, 0, 0, sat);
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    beam(sx * 1.3, 1.1, sz * 1.3, sx * 0.7, 2.5, sz * 0.7, 0.2, M.steel, sat);
  box(2.6, 2.8, 2.4, M.sat, 0, 2.5, 0, 0, sat);
  box(2.68, 0.9, 2.48, M.gold, 0, 3.6, 0, 0, sat);
  for (const sx of [-1, 1]) box(0.26, 2.4, 2.0, M.panel, sx * 1.43, 2.7, 0, 0, sat);
  cyl(0.72, 0.14, M.white, 0, 5.42, 0, 14, sat);
  cyl(0.09, 0.45, M.dark, 0, 5.15, 0, 6, sat);
  box(0.5, 0.5, 0.5, M.dark, 0, 5.3, 0.9, 0, sat);
  // 环绕工作架
  box(7.6, 0.22, 1.1, M.steel, -3.2, 4.1, -2.0);
  railing(-6.8, -1.5, 0.4, -1.5, 4.32);
  for (const sx of [-1, 1]) box(0.28, 4.1, 0.28, M.steel, -3.2 + sx * 3.4, 0.27, -1.8);

  // ================================================================
  // 2. 副拱：合罩间（整流罩两半**卧放成槽形**，开口朝上露消声衬层）
  // ================================================================
  const FX = -22, FSP = 3.2, FRI = 5.8, FRO = 6.4, FZ0 = -15, FZ1 = 15;
  box(13, 0.3, 30, M.floor, FX, 0.12, 0);
  for (const sx of [-1, 1]) box(1.1, FSP, 30, M.brick, FX + sx * (FRI + 0.55), 0, 0);
  vault(FX, FSP, FRI, FRO, FZ0, FZ1);
  archEnd(FX, FSP, FRO, FZ1, 4.4);
  box(FRI * 2 + 1.1, FSP + FRO, 0.85, M.brick, FX, 0, FZ0);
  berm([[FX - 7.0, 0], [FX - 7.0, 5.0], [FX - 14.0, 0]], FZ0, FZ1, 0x8a4a30, 0x6b3823);
  box(0.4, 0.18, 20, cleanLamp, FX, FSP + FRI - 1.2, 0);
  // 两拱之间的夯土技术夹层
  box(6.4, 4.2, 30, M.rammed, -11.4, 0, 0);
  box(7.2, 0.55, 30, M.brickD, -11.4, 4.2, 0);

  // 整流罩半罩（轴沿 Z，开口朝上 → 槽形；thetaStart=-π/2 取下半壳）
  const fairMat = new THREE.MeshStandardMaterial({
    color: M.fairing.color, roughness: 0.6, metalness: 0.12, side: THREE.DoubleSide });
  const linerMat = new THREE.MeshStandardMaterial({
    color: M.liner.color, roughness: 0.95, side: THREE.DoubleSide,
    emissive: 0x24282c, emissiveIntensity: 0.2 });
  const fairHalf = (px) => {
    const h = new THREE.Group();
    h.position.set(px, 3.4, -1);
    g.add(h);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.6, 7.5, 18, 1, true, -Math.PI / 2, Math.PI), fairMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -2.4);
    h.add(barrel);
    const lin = new THREE.Mesh(
      new THREE.CylinderGeometry(2.42, 2.42, 7.2, 18, 1, true, -Math.PI / 2, Math.PI), linerMat);
    lin.rotation.x = Math.PI / 2;
    lin.position.set(0, 0, -2.4);
    h.add(lin);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2.6, 5.0, 18, 1, true, -Math.PI / 2, Math.PI), fairMat);
    cone.rotation.x = -Math.PI / 2;          // 锥尖朝 +Z
    cone.position.set(0, 0, 3.85);
    h.add(cone);
    for (const sx of [-1, 1])                // 分离面纵梁（沿开口两侧上缘）
      box(0.28, 0.3, 12.2, M.steel, sx * 2.5, -0.15, -0.5, 0, h);
    for (const zz of [-5.2, 0.4]) {          // 托架鞍座（底面恰落在地坪 y=0）
      box(6.2, 0.8, 1.3, M.steel, 0, -3.4, zz, 0, h);
      for (const sx of [-1, 1]) box(0.5, 1.4, 1.1, M.steel, sx * 2.4, -2.6, zz, 0, h);
    }
    return h;
  };
  fairHalf(FX - 2.9);
  fairHalf(FX + 2.9);
  box(1.0, 0.8, 1.0, M.orange, FX, 0.27, 9.5);          // 合罩对中工装
  box(0.3, 4.2, 0.3, M.steel, FX, 1.07, 9.5);

  // ================================================================
  // 3. 气闸风淋（+Z 主拱侧）+ 土堤加注间（-X 端）+ 半埋 FFU 机房（-Z）
  // ================================================================
  const AL = 11.5;
  box(8, 4.2, 6.5, M.rammed, AL, 0, 20);
  box(8.6, 0.5, 7.0, M.brickD, AL, 4.2, 20);
  berm([[AL + 4.3, 0], [AL + 9.5, 0], [AL + 4.3, 4.2]], 17, 23.2, 0x8a4a30, 0x6b3823);
  box(4.8, 0.85, 0.22, windowMat, AL, 2.2, 23.3);
  box(1.0, 2.0, 0.14, M.orange, AL - 2.6, 0.12, 23.28);
  box(0.5, 0.5, 0.14, litGreen, AL + 2.8, 2.6, 23.3);   // 压差合格（绿）
  cyl(0.38, 1.8, M.duct, AL, 5.3, 18.6, 10);            // 风淋机组

  const GX = FX - 13;                                    // 加注间
  box(9, 5.2, 11, M.rammed, GX, 0, 2);
  box(9.6, 0.5, 11.6, M.brickD, GX, 5.2, 2);
  box(18, 2.4, 3.2, M.brick, GX + 1, 0, -5.4);          // 防爆隔墙（内侧砖面，外侧培土）
  berm([[GX - 4.5, 0], [GX - 10, 0], [GX - 4.5, 5.2]], -3.5, 7.5, 0x8a4a30, 0x6b3823);
  berm([[GX + 5.5, 0], [GX + 12, 0], [GX + 5.5, 2.4]], -7.2, -3.6, 0x8a4a30, 0x6b3823);
  box(2.6, 0.7, 0.2, windowMat, GX, 3.2, 7.55);
  box(1.0, 2.0, 0.14, M.orange, GX + 3, 0.12, 7.53);
  for (let i = 0; i < 4; i++)                            // 气瓶组（蓝=电推进工质/橙=单组元）
    cyl(0.38, 2.4, i < 2 ? M.steel : M.orange, GX - 3 + i * 1.3, 1.32, 9.2, 10);
  box(5.6, 0.3, 0.3, M.steel, GX - 1.05, 2.7, 9.2);
  box(1.1, 1.5, 0.9, M.dark, GX + 3.4, 0.12, 9.2);
  const vane = new THREE.Group();                        // 风向标
  vane.name = 'wind_vane';
  vane.position.set(GX - 5.5, 7.2, 8);
  g.add(vane);
  box(0.16, 0.16, 2.0, M.orange, 0, 0, 0.8, 0, vane);
  box(0.05, 0.8, 1.0, M.orange, 0, 0, 1.9, 0, vane);
  box(0.26, 7.2, 0.26, M.steel, GX - 5.5, 0.12, 8);

  // 半埋 FFU/HEPA 机房（-Z 端，风管外露上拱顶）
  box(16, 4.0, 8, M.rammed, -6, 0, -22.5);
  box(16.6, 0.5, 8.6, M.brickD, -6, 4.0, -22.5);
  berm([[-14.2, 0], [-20.5, 0], [-14.2, 4.0]], -26.5, -18.5, 0x8a4a30, 0x6b3823);
  for (const sx of [-1, 1]) cyl(0.85, 1.6, M.duct, -6 + sx * 4.5, 5.3, -22.5, 10);  // 进风罩
  for (const dx of [-2.5, 2.5]) {                        // 外露风管爬上主拱
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 12.5, 12), M.duct);
    d.position.set(dx, 6.6, -19.4);
    d.rotation.x = 62 * DEG;
    g.add(d);
    box(1.5, 0.8, 1.5, M.duct, dx, 4.0, -22.0);
    box(1.3, 0.7, 1.3, M.duct, dx, 9.7, -16.4);
  }
  box(3.2, 0.7, 0.2, windowMat, -6, 2.2, -18.3);

  // ================================================================
  // 4. 出货装卸台 + 端门敞开的空载荷容器（装好的已被平板车拉走）
  // ================================================================
  const DK = 26;
  box(15, 0.45, 11, M.pad, 1.5, 0.13, DK);
  railing(-6, DK + 5.5, -6, DK - 5.5, 0.58);
  box(15.4, 0.35, 0.35, M.orange, 1.5, 0.58, DK - 5.6);
  const cont = new THREE.Group();
  cont.position.set(1.5, 0.58, DK);
  g.add(cont);
  box(4.6, 0.5, 12.4, M.steel, 0, 0, 0, 0, cont);
  box(4.6, 3.9, 0.3, M.white, 0, 0.5, -6.2, 0, cont);
  box(0.3, 3.9, 12.4, M.white, -2.15, 0.5, 0, 0, cont);
  box(0.3, 3.9, 12.4, M.white, 2.15, 0.5, 0, 0, cont);
  box(4.8, 0.3, 12.6, M.white, 0, 4.4, 0, 0, cont);
  for (const sz of [-1, 0, 1])                           // 三道橙色识别带（城内安全橙）
    box(4.85, 4.0, 0.4, M.orange, 0, 0.45, sz * 5.1, 0, cont);
  const door = new THREE.Group();
  door.position.set(2.15, 0.5, 6.2);
  door.rotation.y = -100 * DEG;
  cont.add(door);
  box(4.4, 3.9, 0.2, M.white, -2.2, 0, 0, 0, door);
  box(0.5, 0.5, 0.24, M.orange, -2.2, 1.7, 0.12, 0, door);
  box(0.14, 0.8, 0.14, M.dark, -0.35, 1.5, 0.15, 0, door);
  for (const sz of [-1, 1]) box(3.6, 0.6, 0.9, M.steel, 0, 0.5, sz * 3.2, 0, cont);
  box(0.32, 0.26, 0.32, litGreen, 1.6, 4.45, -5.0, 0, cont);
  // 门口障碍灯 + 场区灯杆
  for (const [cx0, ro0, sp0] of [[0, RO, SP], [FX, FRO, FSP]]) {
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), blinkMat);
    bl.position.set(cx0, sp0 + ro0 + 0.35, (cx0 === 0 ? Z1 : FZ1) + 0.3);
    g.add(bl);
  }
  for (const lx of [-9, 12]) {
    box(0.28, 6.5, 0.28, M.steel, lx, 0.12, DK + 6.5);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.65), windowMat);
    hd.position.set(lx, 6.7, DK + 6.5);
    hd.lookAt(0, 0, 12);
    g.add(hd);
  }

  // ---------------------------------------------------------------- POI
  anchor('poi_cleanroom', -3.2, 7, -5);
  anchor('poi_fairing', FX, 6.5, -1);
  anchor('poi_fuel', GX, 5, 4);
  anchor('poi_ffu', -6, 6, -22.5);
  anchor('poi_dock', 1.5, 4, DK);

  // ---------------------------------------------------------------- 引擎接口
  g.userData.lights = [
    { color: 0xeaf6ff, pos: [0, 7, 0], range: 32 },       // 洁净拱内
    { color: 0xf0e0ff, pos: [FX, 6, 0], range: 26 },      // 合罩拱内
    { color: 0xffd9a0, pos: [GX, 4, 6], range: 20 },      // 加注间
    { color: 0xdfe8ff, pos: [1.5, 6, DK], range: 24 },    // 装卸口
  ];
  g.userData.beams = [];
  g.userData.oscillators = [
    { node: 'pl_trolley', prop: 'position', axis: 'z', amp: 11, period: 30 },
    { node: 'wind_vane', prop: 'rotation', axis: 'y', amp: 0.55, period: 9 },
  ];

  // ---------------------------------------------------------------- 尘膜 pass
  const dust = new THREE.Color(0x9e5b3d);
  [M.brick, M.brickD, M.vaultIn, M.rammed, M.pad, M.floor, M.steel, M.dark,
   M.white, M.orange, M.duct, M.fairing, M.sat, M.gold, M.panel].forEach(m => m.color.lerp(dust, 0.05));
  fairMat.color.lerp(dust, 0.05);

  return g;
}
