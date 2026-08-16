// ops-vab-01 —— 卧式总装测试厂房（总装线 + 回收检修线合一）
//
// v2 设计翻案（08-15）：v1 建成 86 m 高的加压垂直总装厂房，两条硬伤——
//   ① 101 m 包围盒是全城第二高，而城里最高的**建筑** hab-tunnel-01 只有 20 m；
//   ② 压型钢板墙 + 蓝腰带是地球工业园配色，与全城「就地取材」语汇脱节。
// 根因是同一条：v1 自己的知识卡就写着「早期基地养不起 86 m 高的加压厂房」——
// 那就不该建它。火星上正确的做法是**卧式总装**：箭躺着装配测试、躺着运到工位，
// 到那里再由起竖臂立起——ops-spaceport-02 的 85 m 勤务塔（5 组回转平台 + 顶部
// 吊机房）本来就是干垂直作业的，v1 等于在 170 m 外又盖了一座冗余的塔。
// 卧式之后：高度 101 → 13.6 m，结构从加压钢盒变成**烧结砖拱 + 覆土**，
// 与 hab-village-01 的夯土拱壳/掩土同一套语汇（拱形在内压下是薄膜受力，
// 覆土同时管辐射与昼夜温波——那本账已经算过）。
//
// 组件：双联砖拱（主拱=总装线 72 m / 副拱=检修线 40 m）+ 覆土培坡 + 端头拱门
//   + 拱下单轨吊 + 卧在起竖运输车上的箭体 + 检修线拆件（发动机/栅格舵/网捕挂钩）
//   + 半掩体控制间 + 门外转运铁轨
// 核心不做黑盒：两座拱门常开、内部沿轴逐段错位，从 +Z 一眼读两条线——
//   主拱里箭躺在起竖车上正在对接，副拱里回收的一子级正在拆检。
//
// 契约：1u=1m；原点 = 主拱内地坪中心；+Y 上；**出箭方向朝 +Z**。
// 动画：拱下单轨吊小车往复（oscillators）、门口障碍灯（blinkMats）。
// POI：poi_hall / poi_refurb / poi_erector / poi_vault / poi_control

export const meta = {
  id: 'ops-vab-01',
  name: '卧式总装测试厂房',
  name_en: 'Horizontal Integration & Refurbishment Hall',
  size_m: 94,                 // 实测最大边（长向）——manifest 同值，禁止缩放
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

const DEG = Math.PI / 180;

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'ops-vab-01';

  let _seed = 20260815;
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

  // ---------------------------------------------------------------- 材质
  // 全部取自城内「就地取材」调色板（res-mine-01 / hab-village-01 / ops-depot-01）
  const std = (color, roughness = 0.9, metalness = 0.03) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const M = {
    brick:   std(0xb46b46, 0.94),        // 烧结风化层砖（锈红，比覆土亮以便分离）
    brickD:  std(0x8f4f34, 0.96),        // 砖箍/暗砖带
    vaultIn: std(0xa46c50, 0.95),        // 拱内壁（略亮，背光可读）
    rammed:  std(0x8a8378, 0.96),        // 夯土隔墙
    soil:    std(0x96543a, 1.0),         // 覆土
    soilB:   std(0x7a4630, 1.0),
    pad:     std(0x8a6047, 0.98),        // 压实地坪
    floor:   std(0xa39683, 0.95),        // 拱内地坪（浅夯土）
    steel:   std(0x6a7076, 0.5, 0.6),    // 结构钢
    dark:    std(0x24272c, 0.7),
    white:   std(0xe8e8e4, 0.55, 0.15),  // 机械白（只用于设备）
    orange:  std(0xe07020, 0.7),         // 安全橙
    rocket:  std(0xe8e4da, 0.55, 0.15),  // 箭体
    engine:  std(0xb0b6bc, 0.5, 0.35),
    nozzle:  std(0x8a6a4a, 0.55, 0.3),
    grid:    std(0x9a9a96, 0.6, 0.3),
    rail:    std(0x6e7378, 0.55, 0.4),
    tread:   std(0x6e4a33, 0.98),
    tire:    std(0x1c1e20, 0.95),
  };
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffe6bf, emissive: 0xffd9a0, emissiveIntensity: 1.0, roughness: 0.35 });
  const bayLamp = new THREE.MeshStandardMaterial({
    color: 0xfff4e2, emissive: 0xffe9c6, emissiveIntensity: 1.0, roughness: 0.4 });
  const blinkMat = new THREE.MeshStandardMaterial({
    color: 0xff4030, emissive: 0xff2515, emissiveIntensity: 2.0, roughness: 0.4 });
  g.userData.nightMats = [windowMat, bayLamp];
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
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2.6));
    beam(x0, y + 1.0, z0, x1, y + 1.0, z1, 0.08, M.orange, parent);
    for (let i = 0; i <= n; i++)
      box(0.08, 1.0, 0.08, M.orange, x0 + (x1 - x0) * i / n, y, z0 + (z1 - z0) * i / n, 0, parent);
  };
  const anchor = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); g.add(a);
  };

  // 覆土棱柱：2D 剖面沿 Z 挤出 + 双尺度顶点色（质感六招 #2，"就地取材"的主表面）
  const berm = (profile, z0, z1, cA, cB) => {
    const n = profile.length, pos = [], col = [];
    const ca = new THREE.Color(cA), cb = new THREE.Color(cB), tmp = new THREE.Color();
    const push = (x, y, z) => {
      const j = 0.55 * vnoise(x * 0.14, y * 0.14, z * 0.14) + 0.45 * vnoise(x * 0.9, y * 0.9, z * 0.9);
      tmp.copy(ca).lerp(cb, Math.min(1, Math.max(0, j * 0.9 + 0.05)));
      pos.push(x, y, z); col.push(tmp.r, tmp.g, tmp.b);
    };
    const seg = 6;                                   // 沿 Z 分段，让顶点色有变化
    for (let s = 0; s < seg; s++) {
      const za = z0 + (z1 - z0) * s / seg, zb = z0 + (z1 - z0) * (s + 1) / seg;
      for (let i = 0; i < n; i++) {                  // 侧面
        const [ax, ay] = profile[i], [bx, by] = profile[(i + 1) % n];
        push(ax, ay, za); push(bx, by, za); push(bx, by, zb);
        push(ax, ay, za); push(bx, by, zb); push(ax, ay, zb);
      }
    }
    for (const [zc, flip] of [[z0, false], [z1, true]]) {   // 两端封盖（扇形三角化）
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

  // 砖拱筒壳（轴沿 Z，上半圆；内外双层 + 砖缝暗带），DoubleSide 保证内壁可读
  const vault = (cx, spring, rIn, rOut, z0, z1) => {
    const len = z1 - z0, zc = (z0 + z1) / 2;
    const shell = (r, mat, side) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, len, 28, 1, true, Math.PI / 2, Math.PI),
        new THREE.MeshStandardMaterial({ color: mat.color, roughness: 0.95, side }));
      m.position.set(cx, spring, zc);
      m.rotation.x = Math.PI / 2;
      g.add(m);
      return m;
    };
    shell(rOut, M.brick, THREE.FrontSide);
    shell(rIn, M.vaultIn, THREE.BackSide);
    // 环向砖箍（每 6 m 一道，凸出外壳 → 读作砌体分段）
    const nb = Math.max(2, Math.round(len / 6));
    for (let i = 0; i <= nb; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(rOut + 0.05, 0.28, 5, 22, Math.PI), M.brickD);
      ring.position.set(cx, spring, z0 + len * i / nb);
      g.add(ring);
    }
    return { cx, spring, rIn, rOut, z0, z1 };
  };

  // 拱形端墙（门洞上方的月牙填充 + 两侧墙垛）
  const archEnd = (cx, spring, rIn, rOut, z, doorR, doorPier) => {
    const tym = new THREE.Mesh(
      new THREE.RingGeometry(doorR, rOut, 24, 1, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: M.brick.color, roughness: 0.95, side: THREE.DoubleSide }));
    tym.position.set(cx, spring, z);
    g.add(tym);
    for (const sx of [-1, 1])                                  // 门洞两侧墙垛
      box(rOut - doorR, spring, 0.9, M.brick, cx + sx * (doorR + rOut) / 2, 0, z);
    box(doorR * 2 + 1.2, 0.5, 1.3, M.brickD, cx, spring + rOut - 0.2, z);   // 门楣压顶
    void doorPier;
  };

  // ================================================================
  // 0. 场地：压实地坪 + 车辙 + 散落砾石
  // ================================================================
  box(78, 0.3, 92, M.pad, -4, -0.18, 4);
  for (const tx of [-3.4, 3.4]) box(0.55, 0.03, 16, M.tread, tx, 0.13, 43);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 30; i++) {
    const rx = -44 + rnd() * 82, rz = -44 + rnd() * 96;
    if (rx > -34 && rx < 16 && rz > -40 && rz < 40) continue;
    const s = 0.16 + rnd() * 0.22, sy = s * (0.5 + rnd() * 0.5);
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.soil : M.pad);
    rock.position.set(rx, 0.12 - 0.3 * sy + 1.618 * sy, rz);
    rock.scale.set(s, sy, s);
    rock.rotation.y = rnd() * 6.28;
    g.add(rock);
  }

  // ================================================================
  // 1. 主拱：总装线（内跨 16 m、内高 12.2、长 72）
  // ================================================================
  const SP = 4.2, RI = 8.0, RO = 8.7, Z0 = -36, Z1 = 36;
  box(17.6, 0.35, 72, M.floor, 0, 0.12, 0);                    // 拱内地坪
  for (const sx of [-1, 1]) box(1.4, SP, 72, M.brick, sx * (RI + 0.7), 0, 0);  // 起拱墙
  vault(0, SP, RI, RO, Z0, Z1);
  archEnd(0, SP, RI, RO, Z1, 6.2);                             // +Z 出箭端（门常开）
  box(RI * 2 + 1.4, SP + RO, 0.9, M.brick, 0, 0, Z0);          // -Z 端封墙
  // 覆土培坡（贴两侧起拱墙，坡到拱腰）
  berm([[8.5, 0], [17.5, 0], [8.5, 6.6]], Z0, Z1, 0x8a4a30, 0x6b3823);
  berm([[-8.5, 0], [-8.5, 6.6], [-17.5, 0]], Z0, Z1, 0x8a4a30, 0x6b3823);
  // 拱顶通风/泄压竖井 ×3（覆土建筑的必需件）
  for (const zz of [-22, 0, 22]) {
    cyl(0.75, 2.2, M.rammed, 0, SP + RO + 0.6, zz, 10);
    cyl(0.95, 0.35, M.brickD, 0, SP + RO + 1.85, zz, 10);
  }
  // 拱下单轨吊（沿拱顶纵梁，小车往复）——比 v1 的 39 m 双梁桥吊小一个量级
  box(0.5, 0.5, 68, M.steel, 0, SP + RI - 1.4, 0);
  const trolley = new THREE.Group();
  trolley.name = 'crane_trolley';
  trolley.position.set(0, SP + RI - 1.9, 6);
  g.add(trolley);
  box(1.6, 0.9, 2.2, M.orange, 0, -0.45, 0, 0, trolley);
  cyl(0.06, 4.2, M.dark, 0, -2.6, 0, 6, trolley);
  box(0.7, 0.5, 0.35, M.orange, 0, -5.0, 0, 0, trolley);
  // 内部灯带（夜光）
  for (const zz of [-24, -8, 8, 24]) for (const sx of [-1, 1]) {
    const dx = sx * 5.5, yArch = SP + Math.sqrt(RI * RI - (Math.abs(dx) + 0.25) ** 2);
    box(0.5, 0.22, 7, bayLamp, dx, yArch - 0.4, zz);
  }

  // ---- 总装线：箭体两段卧在起竖运输车上正在对接 ----
  const ER = new THREE.Group();                                 // 起竖运输车（卧姿）
  ER.position.set(0, 0, -2);
  g.add(ER);
  box(3.4, 0.9, 62, M.steel, 0, 0.5, 0, 0, ER);                 // 起竖大梁
  for (let k = 0; k < 7; k++) {                                 // 台车轮组
    const bz = -27 + k * 9;
    box(4.6, 0.7, 1.6, M.dark, 0, 0.12, bz, 0, ER);
    for (const sx of [-1, 1]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.42, 10), M.tire);
      wh.position.set(sx * 2.1, 0.5, bz); wh.rotation.z = Math.PI / 2;
      ER.add(wh);
    }
  }
  box(2.4, 1.6, 3.2, M.orange, 0, 1.4, 30.5, 0, ER);            // 起竖液压缸座（尾端铰）
  cyl(0.42, 5.0, M.steel, 0, 2.6, 27.5, 10, ER).rotation.x = 62 * DEG;
  for (const zz of [-24, -12, 2, 16, 26]) {                     // 抱箭鞍座（含分离面）
    box(5.6, 1.5, 1.5, M.orange, 0, 1.4, zz, 0, ER);
    box(6.2, 0.35, 1.9, M.steel, 0, 2.9, zz, 0, ER);
  }
  const st1 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 40, 20), M.rocket);
  st1.position.set(0, 5.6, -12); st1.rotation.x = Math.PI / 2;
  ER.add(st1);                                                  // 一子级（在位）
  const st2 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 18, 20), M.rocket);
  st2.position.set(0, 5.6, 20); st2.rotation.x = Math.PI / 2;
  ER.add(st2);                                                  // 二子级（待对接，留 2 m 缝）
  cyl(2.56, 0.5, M.orange, 0, 5.6, 8.4, 20, ER).rotation.x = Math.PI / 2;   // 级间对接环
  // 对接工作架（跨在缝上，人从这儿接线）
  for (const sx of [-1, 1]) {
    box(0.4, 6.4, 0.4, M.steel, sx * 4.2, 0.12, 8.4);
    box(3.2, 0.3, 4.4, M.steel, sx * 4.6, 6.5, 8.4);
    railing(sx * 6.1, 6.6, sx * 6.1, 10.2, 6.8);
  }
  box(1.2, 0.9, 1.2, M.white, 5.6, 6.8, 6.6);                   // 测试机柜
  box(0.9, 0.35, 0.12, windowMat, 5.6, 7.3, 7.22);

  // ================================================================
  // 2. 副拱：回收检修线（内跨 12.8、长 40，中心 x=-24）
  // ================================================================
  const RX = -24, RSP = 3.6, RRI = 6.4, RRO = 7.0, RZ0 = -20, RZ1 = 20;
  box(14, 0.35, 40, M.floor, RX, 0.12, 0);
  for (const sx of [-1, 1]) box(1.2, RSP, 40, M.brick, RX + sx * (RRI + 0.6), 0, 0);
  vault(RX, RSP, RRI, RRO, RZ0, RZ1);
  archEnd(RX, RSP, RRI, RRO, RZ1, 4.8);
  box(RRI * 2 + 1.2, RSP + RRO, 0.9, M.brick, RX, 0, RZ0);
  berm([[RX - 6.9, 0], [RX - 6.9, 5.4], [RX - 14.5, 0]], RZ0, RZ1, 0x8a4a30, 0x6b3823);
  // 两拱之间的夯土技术夹层（共用墙 + 顶部管廊）
  box(7.4, 4.6, 40, M.rammed, -12.8, 0, 0);
  box(8.2, 0.6, 40, M.brickD, -12.8, 4.6, 0);
  for (const zz of [-14, 0, 14]) cyl(0.28, 5.6, M.steel, -12.8, 3.0, zz, 8);
  box(0.5, 0.2, 6, bayLamp, RX, RSP + RRI - 2.2, 0);
  box(0.5, 0.2, 6, bayLamp, RX, RSP + RRI - 2.2, -13);

  // ---- 卧放的一子级 + 拆件（网捕回收的证据链）----
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 22, 20), M.rocket);
  stage.position.set(RX - 0.5, 4.2, -2); stage.rotation.x = Math.PI / 2;
  g.add(stage);
  for (const sz of [-1, 1]) {
    box(5.6, 2.0, 1.6, M.steel, RX - 0.5, 0.12, -2 + sz * 7);
    box(6.2, 0.5, 2.0, M.orange, RX - 0.5, 2.12, -2 + sz * 7);
  }
  box(5.2, 5.2, 0.25, M.dark, RX - 0.5, 1.6, 9.1);              // 发动机安装法兰（竖直朝门）
  for (let k = 0; k < 6; k++) {
    const a = k * 60 * DEG;
    box(0.7, 0.5, 0.5, M.engine, RX - 0.5 + 1.7 * Math.cos(a), 4.2 + 1.7 * Math.sin(a), 9.2);
  }
  for (let k = 0; k < 2; k++) {                                 // 拆下的发动机 ×2
    const ex = RX + 4.6, ez = -12 + k * 6;
    box(3.0, 0.5, 2.6, M.steel, ex, 1.0, ez);
    for (const sx of [-1, 1]) box(0.3, 1.0, 0.3, M.steel, ex + sx * 1.2, 0.12, ez);
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.05, 2.4, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.55, metalness: 0.3, side: THREE.DoubleSide }));
    noz.position.set(ex, 2.7, ez);
    g.add(noz);
    cyl(0.62, 1.3, M.engine, ex, 4.4, ez, 12);
    box(0.9, 0.5, 0.9, M.engine, ex, 5.0, ez);
  }
  // 栅格舵检查架
  const fin = new THREE.Group();
  fin.position.set(RX - 4.4, 0.12, 12);
  g.add(fin);
  box(0.5, 2.6, 0.5, M.steel, 0, 0, 0, 0, fin);
  box(2.6, 0.3, 1.2, M.steel, 0, 2.6, 0, 0, fin);
  box(3.2, 0.35, 0.3, M.grid, 0, 2.9, 0, 0, fin);
  box(3.2, 0.35, 0.3, M.grid, 0, 5.5, 0, 0, fin);
  for (const sx of [-1, 1]) box(0.3, 2.95, 0.3, M.grid, sx * 1.45, 2.9, 0, 0, fin);
  for (let i = -1; i <= 1; i++) box(0.16, 2.6, 0.22, M.grid, i * 0.85, 3.0, 0, 0, fin);
  for (let i = 0; i < 3; i++) box(2.9, 0.16, 0.22, M.grid, 0, 3.5 + i * 0.8, 0, 0, fin);
  // 网捕挂钩 ×2 在检查台（呼应 ops-spaceport-02 网架）
  box(3.4, 0.9, 1.8, M.steel, RX + 4.2, 0.12, 13);
  for (const sx of [-1, 1]) {
    const hk = new THREE.Group();
    hk.position.set(RX + 4.2 + sx * 0.9, 1.02, 13);
    g.add(hk);
    box(0.34, 1.5, 0.34, M.orange, 0, 0, 0, 0, hk);
    beam(0, 1.45, 0, 0, 1.95, sx * 0.75, 0.32, M.orange, hk);
  }

  // ================================================================
  // 3. 半掩体控制间（+X 侧嵌进覆土坡）+ 门外转运铁轨
  // ================================================================
  const CX = 19;
  box(13, 5.0, 20, M.rammed, CX, 0, -4);
  box(13.6, 0.6, 20.6, M.brickD, CX, 5.0, -4);                  // 压顶
  berm([[CX + 6.5, 0], [CX + 14, 0], [CX + 6.5, 5.0]], -14, 6, 0x8a4a30, 0x6b3823);
  box(9, 1.1, 0.28, windowMat, CX, 2.5, 6.05);                  // 朝出箭方向观察窗
  box(1.0, 2.0, 0.14, M.orange, CX - 4.6, 0.12, 6.02);          // 密封门
  box(0.9, 1.86, 0.16, M.rammed, CX - 4.6, 0.2, 5.96);
  cyl(0.18, 3.4, M.steel, CX + 4, 6.7, -10, 8);                 // 屋顶天线杆
  box(1.6, 0.4, 1.6, M.dark, CX + 4, 5.6, -10);
  // 门外铁轨（与 ops-spaceport-02 门前四轨同制，箭躺着运出去）
  box(24, 0.35, 14, M.pad, 0, -0.02, 44);
  for (const sx of [-1, 1]) {
    box(0.4, 0.42, 14, M.rail, sx * 3.2, 0.33, 44);
    box(0.4, 0.42, 14, M.rail, sx * 9.6, 0.33, 44);
  }
  for (let i = 0; i < 5; i++) box(21, 0.18, 0.55, M.dark, 0, 0.33, 38.5 + i * 2.9);
  // 门口障碍灯 ×2 + 泛光
  for (const sx of [-1, 1]) {
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), blinkMat);
    bl.position.set(sx * 7.4, SP + RO + 0.4, Z1 + 0.3);
    g.add(bl);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.7), bayLamp);
    hd.position.set(sx * 9.8, 6.4, Z1 + 1.2);
    hd.lookAt(0, 0, 46);
    g.add(hd);
    box(0.3, 6.4, 0.3, M.steel, sx * 9.8, 0.12, Z1 + 1.2);
  }

  // ---------------------------------------------------------------- POI
  anchor('poi_hall', 0, 9, 4);
  anchor('poi_refurb', RX, 7, -2);
  anchor('poi_erector', 0, 3, 26);
  anchor('poi_vault', 0, 13, -26);
  anchor('poi_control', CX, 4, 2);

  // ---------------------------------------------------------------- 引擎接口
  g.userData.lights = [
    { color: 0xffe4bc, pos: [0, 8, 0], range: 44 },       // 主拱内
    { color: 0xffdcae, pos: [RX, 6, -2], range: 30 },     // 检修拱内
    { color: 0xdfe8ff, pos: [0, 7, 44], range: 30 },      // 门外转运区
  ];
  g.userData.beams = [];
  g.userData.oscillators = [
    { node: 'crane_trolley', prop: 'position', axis: 'z', amp: 26, period: 40 },
  ];

  // ---------------------------------------------------------------- 尘膜 pass
  const dust = new THREE.Color(0x9e5b3d);
  [M.brick, M.brickD, M.vaultIn, M.rammed, M.pad, M.floor, M.steel, M.white,
   M.orange, M.rocket, M.engine, M.grid, M.rail, M.dark].forEach(m => m.color.lerp(dust, 0.05));

  return g;
}
