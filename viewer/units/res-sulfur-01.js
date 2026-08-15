// res-sulfur-01 硫提取厂（硫酸盐还原焙烧 + Claus 回收）
// 1 单位 = 1 米；原点在场地中心地面，+Y 向上，工艺开放剖切面朝 +Z。
// 工艺流向沿 +X：受料 → 预热塔 → 回转还原窑 → 旋风 → Claus ×2 → 冷凝 → 液硫罐。
// 同色因果链：赭黄=高硫酸盐选矿 · 亮黄=硫产品 · 灰白=脱硫尾料（颜色本身就是账）。

export const meta = {
  id: 'res-sulfur-01',
  name: '硫提取厂（硫酸盐焙烧·Claus 回收）',
  name_en: 'Sulfur Extraction Plant (sulfate roast + Claus)',
  size_m: 43,                 // 实测包围盒长边（validate_unit 复核），禁止整体缩放
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = 'res-sulfur-01';

  // ---------- 材质 ----------
  const M = {
    pad:       new THREE.MeshLambertMaterial({ color: 0x8a6047 }),   // 压实场地
    soil:      new THREE.MeshLambertMaterial({ color: 0x96543a }),
    ore:       new THREE.MeshLambertMaterial({ color: 0xb59a4e }),   // 赭黄：高硫酸盐选矿
    oreDS:     new THREE.MeshLambertMaterial({ color: 0xb59a4e, side: THREE.DoubleSide }),
    sulfur:    new THREE.MeshLambertMaterial({ color: 0xe8c832 }),   // 亮黄：硫产品
    sulfurDS:  new THREE.MeshLambertMaterial({ color: 0xe8c832, side: THREE.DoubleSide }),
    tail:      new THREE.MeshLambertMaterial({ color: 0xa39c92 }),   // 灰白：脱硫尾料
    white:     new THREE.MeshLambertMaterial({ color: 0xe8e8e4 }),
    whiteDust: new THREE.MeshLambertMaterial({ color: 0xd9d2c8 }),
    whiteDS:   new THREE.MeshLambertMaterial({ color: 0xe8e8e4, side: THREE.DoubleSide }),
    orange:    new THREE.MeshLambertMaterial({ color: 0xe07020 }),   // 安全橙
    dark:      new THREE.MeshLambertMaterial({ color: 0x3a3a3c }),
    grey:      new THREE.MeshLambertMaterial({ color: 0x9a9a96 }),
    greyDS:    new THREE.MeshLambertMaterial({ color: 0x9a9a96, side: THREE.DoubleSide }),
    steel:     new THREE.MeshLambertMaterial({ color: 0xb0aca4 }),
    refract:   new THREE.MeshLambertMaterial({ color: 0xc9b9a2, side: THREE.DoubleSide }), // 窑内耐火衬
    cat:       new THREE.MeshLambertMaterial({ color: 0x4a4238 }),   // Claus 催化剂床
    hotpipe:   new THREE.MeshLambertMaterial({ color: 0xa8562e }),   // 聚变余热管（保温外皮）
    pv:        new THREE.MeshLambertMaterial({ color: 0x1c2a52 }),
  };
  // 夜光/自发光件 -> userData.nightMats
  const winMat   = new THREE.MeshStandardMaterial({ color: 0x332a18, emissive: 0xffc46a, emissiveIntensity: 1.2, roughness: 0.6 });
  const lampMat  = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, emissive: 0xfff0d8, emissiveIntensity: 1.5, roughness: 0.5 });
  const ledMat   = new THREE.MeshStandardMaterial({ color: 0x0a2a0a, emissive: 0x35e055, emissiveIntensity: 1.4, roughness: 0.5 });
  // 窑内灼热料床 & 液硫池：昼夜都微亮（这是"核心在运行"的视觉证据）
  const charMat  = new THREE.MeshStandardMaterial({ color: 0x5a2a12, emissive: 0xff6a18, emissiveIntensity: 0.9, roughness: 0.8 });
  const moltenMat= new THREE.MeshStandardMaterial({ color: 0x8a6a10, emissive: 0xffc21e, emissiveIntensity: 0.85, roughness: 0.4 });

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const cyl = (rt, rb, h, mat, x, y, z, seg, parent, open) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24, 1, !!open), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };

  // ---------- 质感工具（确定性种子：同输入每次一致） ----------
  let _seed = 20260801;
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
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);   // 顶点半径实为 φ≈1.618

  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {   // 两点放方梁
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    (parent || group).add(m);
    return m;
  };
  const pipe = (ax, ay, az, bx, by, bz, r, mat, parent) => {   // 两点放圆管
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, _ba.distanceTo(_bb), 12), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _bb.clone().sub(_ba).normalize());
    (parent || group).add(m);
    return m;
  };
  const makePile = (x, z, r, h, hexA, hexB, baseY, chunks) => {
    const geo = new THREE.ConeGeometry(r, h, 40, 6);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(hexA), cB = new THREE.Color(hexB), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      let px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      if (Math.hypot(px, pz) > 0.05 && py < h / 2 - 0.05) {
        const k = 1 + (vnoise(px * 1.6 + x, py * 1.6, pz * 1.6 + z) - 0.5) * 0.17;
        px *= k; pz *= k; pos.setX(i, px); pos.setZ(i, pz);
      }
      const n = 0.6 * vnoise(px * 2.1 + x, py * 2.1, pz * 2.1 + z) +
                0.4 * vnoise(px * 4.7, py * 4.7 + 5, pz * 4.7);
      tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n * 0.85 + 0.2 * (1 - (py + h / 2) / h))));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const p = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    p.position.set(x, baseY + h / 2, z);
    group.add(p);
    for (let i = 0; i < (chunks || 0); i++) {
      const a = rnd() * 6.283, d = r * (0.85 + rnd() * 0.4), s = 0.09 + rnd() * 0.1;
      const rk = new THREE.Mesh(rockGeo, new THREE.MeshLambertMaterial({ color: rnd() < 0.5 ? hexA : hexB }));
      rk.position.set(x + Math.cos(a) * d, baseY - 0.3 * s + 1.62 * s, z + Math.sin(a) * d);
      rk.scale.set(s, s * 0.8, s);
      rk.rotation.y = rnd() * 6.28;
      group.add(rk);
    }
    return p;
  };
  const railing = (x0, z0, x1, z1, y, parent) => {           // 安全橙护栏
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.4));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      box(0.07, 1.0, 0.07, M.orange, x0 + (x1 - x0) * t, y + 0.5, z0 + (z1 - z0) * t, parent);
    }
    beam(x0, y + 1.0, z0, x1, y + 1.0, z1, 0.07, M.orange, parent);
  };
  const ladder = (x, z, y0, y1, parent) => {
    for (const s of [-1, 1]) box(0.06, y1 - y0, 0.06, M.dark, x + s * 0.22, (y0 + y1) / 2, z, parent);
    for (let y = y0 + 0.3; y < y1; y += 0.32) box(0.46, 0.05, 0.05, M.dark, x, y, z, parent);
  };

  const spinners = [];

  // ---------- 场地 ----------
  box(42, 0.16, 24, M.pad, 0, 0.08, 0);
  // 场地双尺度顶点色由料堆承担；此处加压实带与车辙
  for (const zz of [-9.4, -8.5]) box(34, 0.04, 0.5, M.soil, -2, 0.17, zz);   // 车辙一对
  box(2.6, 0.05, 15, M.soil, -19.6, 0.17, 2);                                // 进场路口

  // ================= 1. 受料斗 + 螺旋给料（x ≈ -17） =================
  {
    const hx = -17, hz = 0;
    for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]])
      box(0.22, 2.6, 0.22, M.dark, hx + dx * 1.35, 1.3, hz + dz * 1.35);
    for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]])          // 腿-沿口角撑
      beam(hx + dx * 1.35, 2.2, hz + dz * 1.35, hx + dx * 0.5, 3.4, hz + dz * 0.5, 0.1, M.grey);
    // 开口料斗：露出斗内赭黄矿料（开口容器手法）
    const hop = cyl(1.75, 0.45, 1.9, M.whiteDS, hx, 3.55, hz, 20, null, true);
    hop.material = M.whiteDS;
    cyl(1.62, 0.42, 1.75, M.oreDS, hx, 3.5, hz, 20);                       // 斗内料面
    cyl(1.8, 1.8, 0.16, M.orange, hx, 4.5, hz, 20);                        // 沿口压条
    box(0.7, 0.6, 0.7, M.dark, hx, 2.35, hz);                              // 底部卸料阀
    // 螺旋给料机：斜管 + 检修天窗（证明里面是转的螺旋）
    pipe(hx + 0.4, 2.4, hz, -12.4, 5.6, hz, 0.34, M.white);
    for (let t = 0.25; t < 0.9; t += 0.3) {
      const px = hx + 0.4 + (-12.4 - hx - 0.4) * t, py = 2.4 + (5.6 - 2.4) * t;
      box(0.5, 0.06, 0.36, M.dark, px, py + 0.3, hz);
    }
    box(0.5, 0.5, 0.5, M.dark, hx + 0.15, 2.05, hz + 0.5);                 // 给料电机
    ladder(hx + 1.9, hz, 0.2, 4.6);
  }
  makePile(-17.5, 7.5, 3.0, 2.1, 0xb59a4e, 0x8e7434, 0.16, 7);             // 赭黄选矿堆
  makePile(-14.2, 8.6, 1.6, 1.2, 0xb59a4e, 0x8e7434, 0.16, 4);

  // ================= 2. 预热塔（x ≈ -11，剖切） =================
  {
    const tx = -11, tz = 0, H = 8.4;
    box(3.2, H, 0.3, M.white, tx, H / 2 + 0.16, tz - 1.5);                 // 背墙
    for (const s of [-1, 1]) box(0.3, H, 3.0, M.white, tx + s * 1.45, H / 2 + 0.16, tz);
    box(3.4, 0.3, 3.2, M.whiteDust, tx, H + 0.3, tz);                      // 顶盖
    for (const s of [-1, 1]) box(0.3, H, 0.3, M.white, tx + s * 1.45, H / 2 + 0.16, tz + 1.45);
    // 内部：逆流换热的三段料柱（自上而下由赭黄渐热）
    for (let i = 0; i < 3; i++) {
      const y = 1.6 + i * 2.2;
      cyl(1.05, 1.05, 1.5, M.oreDS, tx, y, tz + 0.18 * (2 - i), 18);       // 逐层错位露前缘
      cyl(1.12, 1.12, 0.14, M.steel, tx, y + 0.85, tz + 0.18 * (2 - i), 18);
    }
    // 聚变余热接入：保温热管 + 法兰（低温段预热的能量来源）
    pipe(-20.5, 5.2, -3.2, tx - 1.6, 3.0, tz - 0.6, 0.26, M.hotpipe);
    cyl(0.4, 0.4, 0.3, M.orange, tx - 1.5, 3.0, tz - 0.6, 14).rotation.z = Math.PI / 2;
    box(0.5, 0.7, 0.45, M.dark, -20.2, 5.9, -3.2);                         // 热网接线箱
    // 顶部平台与护栏
    box(3.8, 0.12, 1.4, M.grey, tx, H + 0.52, tz + 1.0);
    railing(tx - 1.8, tz + 1.7, tx + 1.8, tz + 1.7, H + 0.58);
    ladder(tx + 1.8, tz + 1.2, 0.2, H + 0.5);
  }

  // ================= 3. 回转还原焙烧窑（核心，x ≈ -1） =================
  {
    const kiln = new THREE.Group();
    kiln.name = 'kiln';
    kiln.position.set(-1.2, 4.3, 0);
    kiln.rotation.z = -0.07;                    // 4° 倾角：料靠重力向低端走
    group.add(kiln);

    const L = 11, R = 1.35;
    // 静态剖切筒壳：留 ~110° 开口朝 +Z，看得见内部（科学城原则：核心不做黑盒）
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, L, 32, 1, true, Math.PI * 0.28, Math.PI * 1.44), M.whiteDS);
    shell.rotation.z = Math.PI / 2;
    kiln.add(shell);
    const lining = new THREE.Mesh(                                          // 耐火衬（内层）
      new THREE.CylinderGeometry(R - 0.13, R - 0.13, L - 0.1, 32, 1, true, Math.PI * 0.28, Math.PI * 1.44), M.refract);
    lining.rotation.z = Math.PI / 2;
    kiln.add(lining);
    // 剖口两侧壁厚边（读出"这是被剖开的"）
    for (const a of [Math.PI * 0.28, Math.PI * 1.72]) {
      const e = box(0.13, 0.13, L, M.steel, 0, 0, 0, kiln);
      e.position.set(0, Math.cos(a) * (R - 0.06), Math.sin(a) * (R - 0.06));
    }
    // 灼热料床：沿轴的一段浅弧，向低端(+X)略厚——重力输送的可视证据
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const b = box(L / 9.4, 0.16 + t * 0.1, 1.5 - t * 0.15, charMat,
        -L / 2 + L * (i + 0.5) / 9, -R + 0.42 + t * 0.03, 0.05, kiln);
      b.rotation.x = 0.06;
    }
    // 内部抄板（转动件）：6 片扬料板，spinner 绕筒轴
    const flights = new THREE.Group();
    flights.name = 'kiln_flights';
    kiln.add(flights);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const v = box(L - 0.6, 0.42, 0.1, M.steel, 0,
        Math.cos(a) * (R - 0.36), Math.sin(a) * (R - 0.36), flights);
      v.rotation.x = -a;
    }
    spinners.push({ node: 'kiln_flights', axis: 'x', rpm: 1.5 });
    // 滚圈 + 托轮 + 齿圈/小齿轮 + 电机（动力核心可见）
    for (const px of [-3.4, 3.4]) {
      cyl(R + 0.16, R + 0.16, 0.34, M.steel, px, 0, 0, 28, kiln).rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) {
        const roll = cyl(0.42, 0.42, 0.5, M.dark, px, -R - 0.42, s * 0.85, 16, kiln);
        roll.rotation.z = Math.PI / 2;
      }
    }
    cyl(R + 0.26, R + 0.26, 0.26, M.dark, 1.0, 0, 0, 34, kiln).rotation.z = Math.PI / 2;  // 齿圈
    const pinion = cyl(0.44, 0.44, 0.3, M.steel, 1.0, -R - 0.5, 0, 18, kiln);
    pinion.name = 'kiln_pinion';
    pinion.rotation.z = Math.PI / 2;
    spinners.push({ node: 'kiln_pinion', axis: 'x', rpm: 9 });
    box(1.1, 0.8, 0.9, M.dark, 2.2, -R - 0.5, 0, kiln);                     // 主传动电机
    // 支墩：底面贴场地顶面(y=0.16)，顶面托住托轮(y≈2.5)
    for (const px of [-3.4, 3.4]) {
      box(1.6, 2.35, 2.6, M.grey, -1.2 + px, 1.335, 0);
      beam(-1.2 + px - 0.8, 1.0, -1.3, -1.2 + px + 0.8, 2.4, 1.3, 0.14, M.grey);
    }
    // 高端进料溜槽（接预热塔）与低端排料罩
    pipe(-9.6, 6.4, 0, -6.9, 5.0, 0, 0.4, M.white);
    box(2.0, 2.4, 2.2, M.white, 5.0, 3.6, 0);                               // 排料罩
    box(2.1, 0.22, 2.3, M.orange, 5.0, 4.85, 0);
    // H₂ 还原气进气（来自 res-isru-01 电解）：细管 + 阀组 + 标识色
    pipe(5.6, 1.2, -3.6, 5.6, 3.4, -0.8, 0.16, M.steel);
    pipe(5.6, 1.2, -3.6, 12.0, 1.2, -6.2, 0.16, M.steel);
    box(0.4, 0.5, 0.4, M.orange, 5.6, 3.0, -1.4);                           // 还原气阀
  }

  // ================= 4. 旋风除尘 + 5. Claus 反应器 ×2（x ≈ 8~13） =================
  {
    // 旋风：筒 + 锥 + 上升管
    cyl(1.05, 1.05, 2.4, M.white, 8.2, 6.4, -3.4, 20);
    cyl(1.05, 0.28, 2.0, M.white, 8.2, 4.2, -3.4, 20);
    cyl(0.34, 0.34, 1.6, M.steel, 8.2, 8.0, -3.4, 14);
    box(0.6, 0.6, 0.6, M.dark, 8.2, 3.0, -3.4);                             // 灰斗卸灰
    for (const s of [-1, 1]) beam(8.2 + s * 0.9, 0.2, -3.4 - 0.9, 8.2 + s * 0.9, 5.2, -3.4 + 0.9, 0.13, M.grey);
    pipe(6.0, 5.6, 0, 8.2, 7.2, -3.4, 0.34, M.white);                       // 窑气 → 旋风

    // Claus 两级：卧式反应器，朝 +Z 剖开露催化剂床
    const claus = (cx, cz, len) => {
      const g2 = new THREE.Group();
      g2.position.set(cx, 2.5, cz);
      group.add(g2);
      const sh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.05, len, 24, 1, true, Math.PI * 0.3, Math.PI * 1.4), M.whiteDS);
      sh.rotation.z = Math.PI / 2;
      g2.add(sh);
      box(len - 0.2, 0.5, 1.5, M.cat, 0, -0.28, 0.1, g2);                   // 催化剂床
      box(len - 0.2, 0.06, 1.6, M.steel, 0, 0.02, 0.1, g2);                 // 床上格栅
      for (const s of [-1, 1]) cyl(1.05, 1.05, 0.12, M.white, s * len / 2, 0, 0, 24, g2).rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) {                                            // 鞍座
        box(1.0, 1.6, 1.4, M.grey, s * (len / 2 - 0.9), -1.7, 0, g2);
      }
      box(0.42, 0.5, 0.42, M.orange, len / 2 - 0.5, 1.1, -0.4, g2);         // 顶部安全阀
      return g2;
    };
    claus(9.6, 1.6, 4.2);
    claus(14.6, 1.6, 3.6);
    pipe(11.8, 2.5, 1.6, 12.7, 2.5, 1.6, 0.3, M.steel);
    pipe(8.2, 3.0, -3.0, 9.0, 2.9, 0.6, 0.3, M.steel);
  }

  // ================= 6. 硫冷凝器 + 液硫池（x ≈ 17） =================
  {
    // 卧式冷凝器
    cyl(0.85, 0.85, 3.4, M.white, 17.4, 3.5, 1.2, 20).rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) box(0.9, 1.4, 1.2, M.grey, 17.4 + s * 1.3, 2.1, 1.2);
    pipe(16.4, 2.6, 1.6, 16.6, 3.4, 1.3, 0.28, M.steel);
    // 液硫池：开口，池面自发光琥珀（"产物在这里出现"）
    box(3.6, 0.9, 2.8, M.white, 17.6, 0.62, -2.2);
    box(3.2, 0.12, 2.4, moltenMat, 17.6, 1.06, -2.2);                       // 液硫面
    box(3.8, 0.16, 3.0, M.orange, 17.6, 1.14, -2.2).visible = false;        // (占位，避免遮挡)
    railing(15.8, -3.8, 19.4, -3.8, 1.1);
    pipe(17.4, 2.6, 1.2, 17.6, 1.3, -1.2, 0.24, M.steel);                   // 冷凝器 → 池
    // 保温伴热的液硫溜槽 → 储罐
    pipe(18.6, 1.0, -2.2, 19.4, 1.6, 2.6, 0.22, M.orange);
  }

  // ================= 7. 液硫储罐（带伴热） =================
  {
    const tx = 19.4, tz = 4.6;
    cyl(1.7, 1.7, 4.4, M.white, tx, 2.4, tz, 22);
    cyl(1.78, 1.78, 0.18, M.orange, tx, 4.7, tz, 22);
    cyl(1.6, 1.6, 0.2, M.whiteDust, tx, 4.9, tz, 22);
    for (let y = 1.0; y < 4.4; y += 0.75)                                   // 伴热带
      cyl(1.73, 1.73, 0.08, M.orange, tx, y, tz, 22);
    box(0.6, 0.4, 0.6, M.dark, tx + 0.5, 5.05, tz - 0.3);                   // 人孔
    for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]])
      box(0.18, 0.4, 0.18, M.dark, tx + dx * 1.2, 0.36, tz + dz * 1.2);
    ladder(tx - 1.8, tz, 0.2, 4.9);
    // 出料管：离场朝 ops-printer-01 方向
    pipe(tx - 1.6, 1.4, tz + 1.4, 14.0, 1.4, 10.6, 0.2, M.orange);
    box(0.5, 0.7, 0.5, M.dark, 14.0, 1.0, 10.9);                            // 计量撬
  }

  // ================= 8. 尾气洗涤塔 =================
  {
    cyl(0.75, 0.75, 5.6, M.white, 13.2, 3.0, -6.4, 18);
    cyl(0.4, 0.4, 2.2, M.steel, 13.2, 6.9, -6.4, 14);
    cyl(0.5, 0.5, 0.2, M.orange, 13.2, 8.05, -6.4, 14);
    const fan = cyl(0.55, 0.55, 0.16, M.dark, 13.2, 1.1, -5.5, 14);         // 引风机
    fan.name = 'tailfan';
    spinners.push({ node: 'tailfan', axis: 'z', rpm: 90 });
    pipe(15.0, 2.6, 1.0, 13.4, 4.4, -5.6, 0.26, M.steel);
    for (const s of [-1, 1]) beam(13.2 + s * 0.7, 0.2, -7.1, 13.2 + s * 0.7, 4.4, -5.7, 0.11, M.grey);
  }

  // ================= 9. 产物与尾料（同色因果链的落点） =================
  makePile(9.5, 9.2, 2.7, 2.0, 0xa39c92, 0x7d7770, 0.16, 6);                // 脱硫尾料（灰白）
  makePile(5.6, 10.2, 1.5, 1.1, 0xa39c92, 0x7d7770, 0.16, 3);
  // 尾料输送：窑排料罩 → 尾料堆
  pipe(5.6, 3.2, 0.9, 9.0, 1.5, 7.2, 0.42, M.white);
  for (let t = 0.3; t < 0.95; t += 0.32) {                                   // 检修天窗
    box(0.55, 0.06, 0.4, M.dark, 5.6 + 3.4 * t, 3.2 - 1.7 * t + 0.36, 0.9 + 6.3 * t);
  }
  // 硫黄成品：亮黄浇铸块垛（不是粉堆——液硫浇模冷却成块）
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    if (i === 2 && j === 2) continue;
    box(1.15, 0.55, 0.85, M.sulfur, 20.2 + (j - 1) * 1.25, 0.44 + i * 0.55, -5.4 + (j % 2) * 0.06);
  }
  box(3.9, 0.14, 1.2, M.dark, 20.2, 0.23, -5.4);                            // 垛底托板

  // ================= 10. 控制间 + 电源撬块 =================
  {
    const cx = -5.6, cz = 8.6;
    box(4.6, 0.2, 3.2, M.grey, cx, 0.26, cz);
    box(4.2, 2.6, 2.8, M.white, cx, 1.66, cz);
    box(4.5, 0.22, 3.1, M.whiteDust, cx, 3.05, cz);                         // 顶盖压条
    box(4.4, 0.3, 2.95, M.orange, cx, 0.5, cz);                             // 底裙边
    for (const dx of [-1.1, 0.3]) box(1.1, 0.7, 0.06, winMat, cx + dx, 2.0, cz + 1.42);
    // 密封门：框+扇+闩+双铰链
    box(1.06, 2.02, 0.07, M.orange, cx + 1.6, 1.25, cz + 1.44);
    box(0.9, 1.86, 0.09, M.whiteDust, cx + 1.6, 1.25, cz + 1.4);
    box(0.1, 0.26, 0.08, M.dark, cx + 1.92, 1.24, cz + 1.34);
    for (const yy of [1.88, 0.62]) box(0.14, 0.1, 0.06, M.dark, cx + 1.23, yy, cz + 1.36);
    box(0.24, 0.24, 0.24, ledMat, cx - 1.9, 2.5, cz + 1.0);                 // 状态灯
    cyl(0.05, 0.05, 1.5, M.dark, cx + 1.9, 3.8, cz - 0.8, 8);
    cyl(0.16, 0.16, 0.3, lampMat, cx - 2.0, 3.3, cz, 12);                   // 场地灯
    // 电源撬块 + 地面电缆导管
    box(2.4, 0.16, 1.5, M.dark, cx - 3.8, 0.24, cz - 0.4);
    box(2.2, 1.1, 1.3, M.white, cx - 3.8, 0.87, cz - 0.4);
    box(2.24, 0.24, 1.34, M.orange, cx - 3.8, 1.34, cz - 0.4);
    box(1.6, 0.4, 0.05, M.dark, cx - 3.8, 0.8, cz + 0.28);                  // 通风格栅
    box(0.3, 0.1, 7.4, M.dark, cx + 0.4, 0.21, cz - 4.4);                   // 导管去工艺区
    box(9.0, 0.1, 0.3, M.dark, cx + 4.8, 0.21, cz - 8.0);
    // 光伏顶板（仪表待机电）
    box(2.6, 0.09, 1.6, M.pv, cx - 3.8, 1.62, cz - 0.4).rotation.x = -0.18;
  }

  // ---------- 作业痕迹：散落砾石 ----------
  const scatter = (n, fx, fz, s0) => {
    for (let i = 0; i < n; i++) {
      const s = s0 * (0.7 + rnd() * 0.7), sy = s * (0.55 + rnd() * 0.45);
      const g3 = new THREE.Mesh(rockGeo, M.soil);
      g3.position.set(fx(), 0.16 - 0.3 * sy + 1.62 * sy, fz());
      g3.scale.set(s, sy, s);
      g3.rotation.y = rnd() * 6.28;
      group.add(g3);
    }
  };
  scatter(12, () => -19 + rnd() * 12, () => -6 + rnd() * 13, 0.26);
  scatter(10, () => 6 + rnd() * 16, () => -8 + rnd() * 6, 0.24);
  scatter(8, () => 2 + rnd() * 12, () => 6 + rnd() * 6, 0.26);

  // ---------- POI 锚点（MODELS.md §5） ----------
  const anchor = (name, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = name;
    a.position.set(x, y, z);
    group.add(a);
  };
  anchor('poi_receiving', -17, 4.4, 0);
  anchor('poi_preheat', -11, 6.0, 1.2);
  anchor('poi_kiln', -1.2, 5.9, 1.4);
  anchor('poi_claus', 11.5, 3.4, 1.6);
  anchor('poi_sulfur', 18.2, 2.0, -2.2);
  anchor('poi_tailings', 9.5, 2.2, 9.2);
  anchor('poi_control', -5.6, 2.6, 10.2);

  // ---------- 尘膜 pass ----------
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.whiteDust, M.whiteDS, M.grey, M.greyDS, M.orange, M.steel, M.dark,
   M.sulfur, M.sulfurDS, M.ore, M.oreDS, M.tail, M.pv, M.hotpipe]
    .forEach(m => m.color.lerp(dust, 0.05));

  // ---------- 引擎接口 ----------
  group.userData.spinners = spinners;                     // 窑内抄板 / 小齿轮 / 引风机
  group.userData.nightMats = [winMat, lampMat, ledMat, charMat, moltenMat];
  group.userData.lights = [
    { color: 0xffb060, pos: [-1.2, 5.0, 1.6], range: 26 },   // 窑口暖光
    { color: 0xffc21e, pos: [17.6, 1.6, -2.2], range: 18 },  // 液硫池
    { color: 0xfff0d8, pos: [-5.6, 4.0, 8.6], range: 22 },   // 控制间场地灯
  ];

  return group;
}
