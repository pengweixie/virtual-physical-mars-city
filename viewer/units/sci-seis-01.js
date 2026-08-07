// sci-seis-01 火震监测站(InSight SEIS 血统)——城市的听诊器
// 设计册:mars-seis(五本账:VBB 摆/噪声预算/城市噪声/主动源/震波屏)
// 布局:夯实安装座+WTS 风热罩(裙边压石)/ 吊罩展示位(真空球剖切露 VBB 摆机构)
//      / 系缆-负载分流环 / 电子柜 / 太阳板 / 实时震波屏(确定性哈希,禁 Math.random)
//      / 信标 / 发射方位指向牌。零转动部件是设计特征:安静本身就是仪器的一部分。
// 发射联动:meta.schedule 在 ltst 14:00(长十乙例行发射同刻)触发 '接收发射信号',
//      屏上 2 s 后(P 波走时)出现发射特征波形——纯引擎词汇,未改 main.js。

export const meta = {
  id: 'sci-seis-01',
  name: '火震监测站',
  name_en: 'Seismic Monitoring Station',
  size_m: 13.2,                       // validate 实测包围盒(x=z=13.20)
  effects: ['glow_windows', 'blink'],
  schedule: { action: '接收发射信号', ltst: 14.0 },
};

export function build(THREE) {
  const g = new THREE.Group();

  // ---------- 确定性工具 ----------
  let _seed = 20260807;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hashf = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
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
  const L = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const M = {
    white: L(0xd8d2c8), whiteDust: L(0xcfc6b8), grey: L(0x8a8f96), dark: L(0x3a3d42),
    orange: L(0xc96f2f), steel: L(0xa9b0b8), gold: L(0xc9a54a, { emissive: 0x6a5420, emissiveIntensity: 0.12 }),
    copper: L(0xb0703c), pv: L(0x27394f, { emissive: 0x101c2c, emissiveIntensity: 0.25 }),
    soil: L(0x9e5b3d), gravel: L(0x8a5a40),
    sphere: L(0xbfc6cc, { emissive: 0x3c4248, emissiveIntensity: 0.18, side: THREE.DoubleSide }),
    mech: L(0x5a4632, { emissive: 0x2a2015, emissiveIntensity: 0.2 }),
    screenBg: L(0x0d1218, { emissive: 0x0d1218, emissiveIntensity: 0.6 }),
    pcb: L(0x2d6b3f), heater: L(0x6b2a20, { emissive: 0x8a2413, emissiveIntensity: 0.4 }),
    led: L(0x2a2f2a, { emissive: 0x35e08a, emissiveIntensity: 1.4 }),
    beacon: L(0x7a2020, { emissive: 0xff2a1a, emissiveIntensity: 2.0 }),
  };
  // 震道三色(自发光,昼夜可读;自管不进 nightMats)
  const traceMat = [
    L(0x0f2a24, { emissive: 0x39d9b0, emissiveIntensity: 1.5 }),
    L(0x102030, { emissive: 0x53a8e8, emissiveIntensity: 1.5 }),
    L(0x14260f, { emissive: 0x7fd455, emissiveIntensity: 1.5 }),
  ];
  const legendMat = L(0x202020, { emissive: 0x35e08a, emissiveIntensity: 1.8 });

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const cyl = (r1, r2, h, seg, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5); m.lookAt(_bb);
    (parent || g).add(m); return m;
  };
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);   // 顶点半径 φ≈1.618(坑账 3)
  const rock = (x, z, s, sy, mat) => {
    const m = new THREE.Mesh(rockGeo, mat);
    m.scale.set(s, sy, s); m.rotation.y = rnd() * 6.28;
    m.position.set(x, -0.3 * sy + 1.618 * sy, z); g.add(m); return m;
  };

  // ---------- 场坪:碎石垫层(双尺度顶点色) ----------
  {
    const geo = new THREE.CylinderGeometry(6.2, 6.6, 0.07, 40, 1);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(0x9a5f41), cB = new THREE.Color(0x7e4a32), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), pz = pos.getZ(i);
      const n = 0.6 * vnoise(px * 0.4, 0, pz * 0.4) + 0.4 * vnoise(px * 1.7, 5, pz * 1.7);
      tmp.copy(cA).lerp(cB, Math.max(0, Math.min(1, n)));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pad = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    pad.position.y = 0.035; g.add(pad);
  }
  // 走道板 + 安装车辙(用过的场地)
  for (let i = 0; i < 4; i++) box(0.9, 0.05, 1.1, M.grey, -0.4 - i * 0.55 * 0, 0.08, 4.6 - i * 1.2);
  box(0.5, 0.03, 7.5, M.dark, -1.35, 0.075, 0.6).rotation.y = 0.18;
  box(0.5, 0.03, 7.5, M.dark, -3.05, 0.075, 0.6).rotation.y = 0.18;
  for (let i = 0; i < 12; i++) {
    const a = rnd() * 6.28, d = 3.4 + rnd() * 2.4, s = 0.07 + rnd() * 0.1;
    rock(Math.cos(a) * d, Math.sin(a) * d, s, s * (0.6 + rnd() * 0.4), rnd() < 0.5 ? M.soil : M.gravel);
  }

  // ---------- 夯实安装座(安装工艺卡的几何身份) ----------
  const RING = { x: -2.6, z: 2.3 };
  {
    const geo = new THREE.CylinderGeometry(1.55, 1.75, 0.12, 32, 1);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(0xb08054), cB = new THREE.Color(0x8f6240), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const n = vnoise(pos.getX(i) * 2.1 + 3, 0, pos.getZ(i) * 2.1);
      tmp.copy(cA).lerp(cB, n);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const ring = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    ring.position.set(RING.x, 0.09, RING.z); g.add(ring);
  }
  cyl(0.46, 0.5, 0.16, 6, M.whiteDust, RING.x, 0.2, RING.z);        // 六角调平墩
  for (let k = 0; k < 3; k++) {                                      // 灌浆垫
    const a = k * 2.094 + 0.5;
    box(0.16, 0.05, 0.16, M.grey, RING.x + Math.cos(a) * 0.62, 0.14, RING.z + Math.sin(a) * 0.62);
  }

  // ---------- WTS 风热罩(可复用构建器) ----------
  const domeMat = L(0xd8d2c8, { side: THREE.DoubleSide, emissive: 0x3a332c, emissiveIntensity: 0.12 });
  const mkWTS = () => {
    const w = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 12, 0, Math.PI * 2, 0, 1.25), domeMat);
    dome.scale.y = 0.62; dome.position.y = 0.22; w.add(dome);
    for (const [rr, yy] of [[0.5, 0.42], [0.34, 0.52]]) {            // 罩内蜂窝隔热肋(吊起可见)
      const rib = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.015, 5, 20), M.gold);
      rib.rotation.x = Math.PI / 2; rib.position.y = yy; w.add(rib);
    }
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.63, 0.86, 0.24, 24, 1, true),
      L(0xc4bcae, { side: THREE.DoubleSide }));
    skirt.position.y = 0.12; w.add(skirt);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.022, 6, 24), M.dark);
    hem.rotation.x = Math.PI / 2; hem.position.y = 0.022; w.add(hem);
    const cap = cyl(0.16, 0.2, 0.05, 12, M.gold, 0, 0.585, 0, w);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 12), M.steel);
    hook.position.y = 0.66; w.add(hook);
    return w;
  };
  const wtsDeployed = mkWTS();
  wtsDeployed.position.set(RING.x, 0.26, RING.z); g.add(wtsDeployed);
  for (let k = 0; k < 8; k++) {                                      // 裙边压石
    const a = k * 0.785 + 0.35, s = 0.1 + hashf(k) * 0.07;
    const r = new THREE.Mesh(rockGeo, k % 2 ? M.soil : M.gravel);
    r.scale.set(s, s * 0.7, s); r.rotation.y = hashf(k + 9) * 6.28;
    r.position.set(RING.x + Math.cos(a) * 0.92, 0.26 - 0.3 * s * 0.7 + 1.618 * s * 0.7 - 0.14, RING.z + Math.sin(a) * 0.92);
    g.add(r);
  }

  // ---------- 展示位:吊起的罩 + 调平三脚架 + 剖切真空球 + VBB 摆机构 ----------
  const STAND = { x: 2.5, z: 2.5 };
  box(1.8, 0.26, 1.8, M.grey, STAND.x, 0.13, STAND.z);               // 台座
  box(1.9, 0.05, 1.9, M.orange, STAND.x, 0.285, STAND.z);            // 检修橙沿
  const disp = new THREE.Group(); disp.position.set(STAND.x, 0.31, STAND.z); g.add(disp);
  // 调平三脚架(LVL):电机筒+斜腿+足盘
  for (let k = 0; k < 3; k++) {
    const a = k * 2.094 + 0.35;
    const fx = Math.cos(a) * 0.62, fz = Math.sin(a) * 0.62;
    cyl(0.05, 0.05, 0.2, 10, M.steel, Math.cos(a) * 0.34, 0.5, Math.sin(a) * 0.34, disp);
    beam(Math.cos(a) * 0.34, 0.46, Math.sin(a) * 0.34, fx, 0.05, fz, 0.045, M.steel, disp);
    cyl(0.09, 0.11, 0.05, 10, M.dark, fx, 0.03, fz, disp);
  }
  const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.032, 8, 20), M.steel);
  cradle.rotation.x = Math.PI / 2; cradle.position.y = 0.58; disp.add(cradle);
  // 真空球(钛壳,朝前开 100° 剖切窗)
  const sph = new THREE.Mesh(
    new THREE.SphereGeometry(0.31, 28, 18, Math.PI * 0.28, Math.PI * 1.44, 0, Math.PI), M.sphere);
  sph.position.y = 0.82; sph.rotation.y = Math.PI / 2;               // 开口对 +Z(观察侧)
  disp.add(sph);
  const flange = new THREE.Mesh(new THREE.TorusGeometry(0.315, 0.02, 6, 24), M.steel);
  flange.rotation.x = Math.PI / 2; flange.position.y = 0.82; disp.add(flange);
  cyl(0.05, 0.05, 0.06, 10, M.copper, 0.22, 1.08, 0.08, disp);       // 抽气口/馈通
  cyl(0.03, 0.03, 0.1, 8, M.copper, -0.2, 1.06, 0.14, disp);
  // VBB 摆机构 ×3(120° 斜置倒摆:枢轴柱+摆臂+检验质量+片簧+电容极板)
  const hub = cyl(0.045, 0.045, 0.3, 10, M.dark, 0, 0.82, 0, disp);
  for (let k = 0; k < 3; k++) {
    const a = k * 2.094 - 0.5;
    const arm = new THREE.Group(); arm.position.y = 0.82; arm.rotation.y = a; disp.add(arm);
    const armBeam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.024, 0.04), M.mech);
    armBeam.position.set(0.12, 0.03, 0); arm.add(armBeam);           // 摆臂
    const mass = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.06), M.copper);
    mass.position.set(0.225, 0.03, 0); arm.add(mass);
    for (let s = 0; s < 3; s++) {                                    // 片簧(三段折线)
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.006, 0.03), M.gold);
      sp.position.set(0.05 + s * 0.055, 0.1 - s * 0.024, 0);
      sp.rotation.z = -0.5 + s * 0.18; arm.add(sp);
    }
    const capU = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.008, 12), M.steel);
    capU.position.set(0.225, 0.085, 0); arm.add(capU);               // 差分电容极板
    const capD = capU.clone(); capD.position.y = -0.025; arm.add(capD);
  }
  // A 字吊架 + 吊起的 WTS 罩(核心不做黑盒:吊罩 + 剖切双保险)
  const HOIST_H = 2.5;
  beam(STAND.x - 0.95, 0, STAND.z - 0.75, STAND.x, HOIST_H, STAND.z, 0.07, M.orange);
  beam(STAND.x + 0.95, 0, STAND.z - 0.75, STAND.x, HOIST_H, STAND.z, 0.07, M.orange);
  beam(STAND.x - 0.95, 0, STAND.z + 0.75, STAND.x, HOIST_H, STAND.z, 0.07, M.orange);
  beam(STAND.x + 0.95, 0, STAND.z + 0.75, STAND.x, HOIST_H, STAND.z, 0.07, M.orange);
  box(0.1, 0.1, 0.5, M.orange, STAND.x, HOIST_H + 0.03, STAND.z);
  cyl(0.012, 0.012, 0.62, 6, M.dark, STAND.x, HOIST_H - 0.34, STAND.z);   // 吊索
  const wtsLifted = mkWTS();
  wtsLifted.position.set(STAND.x, HOIST_H - 0.68, STAND.z);
  wtsLifted.rotation.z = 0.1; g.add(wtsLifted);

  // ---------- 电子柜(E-box)+ 系缆(负载分流环) ----------
  const EB = { x: -0.3, z: -2.7 };
  for (const [dx, dz] of [[-0.48, -0.26], [0.48, -0.26], [-0.48, 0.26], [0.48, 0.26]])
    box(0.08, 0.26, 0.08, M.dark, EB.x + dx, 0.13, EB.z + dz);
  box(1.15, 0.68, 0.68, M.white, EB.x, 0.6, EB.z);
  box(1.2, 0.07, 0.73, M.gold, EB.x, 0.975, EB.z);                   // MLI 顶
  for (let k = 0; k < 4; k++) box(0.02, 0.5, 0.3, M.steel, EB.x - 0.5 + k * 0.33, 0.62, EB.z - 0.36);
  for (let k = 0; k < 3; k++) cyl(0.035, 0.035, 0.06, 8, M.dark, EB.x - 0.3 + k * 0.3, 0.52, EB.z + 0.36);
  box(0.34, 0.05, 0.02, M.led, EB.x + 0.28, 0.82, EB.z + 0.35);      // 状态灯条(夜光)
  box(0.3, 0.2, 0.02, M.whiteDust, EB.x - 0.25, 0.75, EB.z + 0.351); // 铭牌
  // 系缆:WTS→E-box,贴地扁缆 + 近罩端负载分流 S 环(隔离电子柜微振)
  {
    const p0 = new THREE.Vector3(RING.x + 0.55, 0.07, RING.z - 0.7);
    const p1 = new THREE.Vector3(EB.x - 0.1, 0.07, EB.z + 0.42);
    const NSEG = 9;
    for (let i = 0; i < NSEG; i++) {
      const a = p0.clone().lerp(p1, i / NSEG), b = p0.clone().lerp(p1, (i + 1) / NSEG);
      const mid = a.clone().lerp(b, 0.5);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.022, a.distanceTo(b) * 1.04), M.dark);
      seg.position.copy(mid);
      seg.position.x += Math.sin(i * 1.7) * 0.09;                    // 缆的自然蜿蜒
      seg.lookAt(b.x, b.y, b.z); g.add(seg);
    }
    const shunt = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 6, 16, Math.PI * 1.5), M.dark);
    shunt.position.set(RING.x + 0.62, 0.16, RING.z - 0.62); shunt.rotation.y = 0.6; g.add(shunt);
  }
  // E-box→屏/太阳板细缆
  beam(EB.x + 0.55, 0.1, EB.z, 3.4, 0.08, -1.5, 0.028, M.dark);
  beam(EB.x - 0.55, 0.1, EB.z, -2.9, 0.08, -2.2, 0.028, M.dark);

  // ---------- 太阳板 + 电池箱 ----------
  const PV = { x: -3.3, z: -2.4 };
  cyl(0.05, 0.06, 1.5, 8, M.steel, PV.x, 0.75, PV.z);
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 1.0), M.pv);
    p.position.set(PV.x + s * 0.79, 1.5, PV.z);
    p.rotation.z = -s * 0.35; g.add(p);
  }
  beam(PV.x - 0.4, 1.42, PV.z, PV.x + 0.4, 1.42, PV.z, 0.05, M.steel); // 翼展横梁
  box(0.6, 0.4, 0.45, M.whiteDust, PV.x, 0.2, PV.z + 0.75);
  box(0.64, 0.05, 0.49, M.gold, PV.x, 0.43, PV.z + 0.75);

  // ---------- 实时震波屏 ----------
  const SCR = { x: 3.9, z: -1.5, yaw: -0.42 };
  const scr = new THREE.Group();
  scr.position.set(SCR.x, 0, SCR.z); scr.rotation.y = SCR.yaw; g.add(scr);
  box(0.09, 0.55, 0.09, M.steel, -1.0, 0.275, 0, scr);
  box(0.09, 0.55, 0.09, M.steel, 1.0, 0.275, 0, scr);
  box(2.5, 1.62, 0.1, M.grey, 0, 1.36, 0, scr);
  box(2.34, 1.46, 0.02, M.screenBg, 0, 1.36, 0.055, scr);
  const NCOL = 56, DTCOL = 0.28, ROWY = [1.88, 1.36, 0.84], HALF = 0.21;
  const cols = [[], [], []];
  const colGeo = new THREE.BoxGeometry(0.032, HALF * 2, 0.012);
  for (let ch = 0; ch < 3; ch++) {
    box(2.24, 0.008, 0.014, M.dark, 0, ROWY[ch], 0.062, scr);        // 基线
    box(0.05, 0.14, 0.016, traceMat[ch], -1.1, ROWY[ch], 0.064, scr);// 通道色标
    for (let i = 0; i < NCOL; i++) {
      const c = new THREE.Mesh(colGeo, traceMat[ch]);
      c.position.set(-0.96 + 0.038 * i, ROWY[ch], 0.066);
      c.scale.y = 0.06; scr.add(c); cols[ch].push(c);
    }
  }
  const legend = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.03), legendMat);
  legend.position.set(1.08, 2.06, 0.05); scr.add(legend);
  box(0.5, 0.12, 0.03, M.orange, -0.98, 2.06, 0.05, scr);            // 台标条

  // ---------- 信标桅杆 + 发射方位指向牌 + 备件节点架 ----------
  const BM = { x: -4.3, z: -3.3 };
  cyl(0.05, 0.07, 3.0, 8, M.steel, BM.x, 1.5, BM.z);
  const bcn = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.14), M.beacon);
  bcn.position.set(BM.x, 3.1, BM.z); g.add(bcn);
  cyl(0.012, 0.012, 0.9, 6, M.dark, BM.x + 0.12, 3.3, BM.z);         // UHF 鞭状天线
  box(0.3, 0.4, 0.06, M.whiteDust, BM.x, 1.1, BM.z + 0.08);          // 接线箱
  // 指向牌:箭头指向 ops-spaceport-02(城内方位账,落位后总控可微调 rotation)
  const PT = { x: 4.7, z: 1.9 };
  cyl(0.04, 0.05, 1.2, 8, M.steel, PT.x, 0.6, PT.z);
  const plate = new THREE.Group(); plate.position.set(PT.x, 1.3, PT.z); g.add(plate);
  const pl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.04), M.whiteDust); plate.add(pl);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 4), M.orange);
  tip.rotation.z = -Math.PI / 2; tip.position.x = 0.45; plate.add(tip);
  box(0.5, 0.06, 0.05, M.orange, -0.05, 0, 0, plate);
  plate.rotation.y = -1.1;                                           // 朝东北(发射场向)
  // 备件节点架(与 sci-seis-net-01 散件呼应)
  const RK = { x: -3.9, z: 0.8 };
  box(1.3, 0.09, 0.55, M.grey, RK.x, 0.3, RK.z);
  for (const [dx, dz] of [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]])
    box(0.07, 0.3, 0.07, M.grey, RK.x + dx, 0.15, RK.z + dz);
  for (let k = 0; k < 2; k++) {
    const sp = new THREE.Group(); sp.position.set(RK.x - 0.25 + k * 0.5, 0.42, RK.z); g.add(sp);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.85, 10), M.whiteDust);
    tube.rotation.z = Math.PI / 2; sp.add(tube);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6, 0, 6.283, 0, 1.4), M.orange);
    cap.rotation.z = -Math.PI / 2; cap.position.x = 0.43; sp.add(cap);
    box(0.06, 0.04, 0.5, M.dark, 0, 0.08, 0, sp);
  }
  // 场界警示桩 ×2(安静区)
  for (const [px, pz] of [[-5.2, 3.6], [5.2, 3.4]]) {
    cyl(0.035, 0.045, 0.9, 6, M.whiteDust, px, 0.45, pz);
    cyl(0.04, 0.04, 0.14, 6, M.orange, px, 0.95, pz);
  }

  // ---------- v2 深挖 A:VBB 单摆放大剖视教学台(6×,账 6 的几何身份) ----------
  // 同色因果链:金=弹簧系(片簧/TCDM 上层) 铜=动质量系(检验质量/反馈音圈)
  //            钢=传感系(DCS 极板) 白=热补偿系(TCDM 下层)
  const teach = new THREE.Group();
  teach.position.set(1.35, 0, -0.5); teach.rotation.y = -0.35; g.add(teach);
  const tb = (w, h, d, mat, x, y, z) => box(w, h, d, mat, x, y, z, teach);
  tb(1.05, 0.55, 0.72, M.grey, 0, 0.275, 0);                         // 台座
  tb(1.1, 0.045, 0.77, M.orange, 0, 0.575, 0);
  const plaque = tb(0.46, 0.28, 0.03, M.whiteDust, 0.02, 0.5, 0.36); // 斜铭牌(搁台沿)
  plaque.rotation.x = -0.42;
  tb(0.04, 0.16, 0.03, M.grey, -0.17, 0.42, 0.38);                   // 铭牌撑脚 ×2
  tb(0.04, 0.16, 0.03, M.grey, 0.21, 0.42, 0.38);
  for (let k = 0; k < 4; k++)                                        // 色标条(对卡叙述)
    tb(0.09, 0.05, 0.02, [M.gold, M.copper, M.steel, M.white][k], -0.3 + k * 0.2, 0.35, 0.375);
  tb(0.92, 0.04, 0.56, M.dark, 0, 0.62, 0);                          // 机构底板
  tb(0.07, 0.75, 0.5, M.steel, -0.41, 1.02, 0);                      // 后立柱板
  // 枢轴:十字片簧(两片正交)+ 枢轴块
  const px1 = tb(0.016, 0.2, 0.11, M.gold, -0.3, 0.95, 0); px1.rotation.z = 0.785;
  const px2 = tb(0.016, 0.2, 0.11, M.gold, -0.3, 0.95, 0); px2.rotation.z = -0.785;
  tb(0.09, 0.09, 0.09, M.dark, -0.3, 1.08, 0);
  // 摆臂 + 检验质量
  tb(0.52, 0.036, 0.09, M.mech, -0.02, 0.95, 0);
  tb(0.17, 0.17, 0.13, M.copper, 0.23, 0.95, 0);
  // 主消刚度片簧:三段弧从立柱顶平滑拱到质量上方(端点相接)
  {
    const pts = [[-0.36, 1.36], [-0.16, 1.30], [0.05, 1.20], [0.22, 1.06]];
    for (let s = 0; s < 3; s++) {
      const [x1, y1] = pts[s], [x2, y2] = pts[s + 1];
      const sp = tb(Math.hypot(x2 - x1, y2 - y1) + 0.01, 0.014, 0.1,
        M.gold, (x1 + x2) / 2, (y1 + y2) / 2, 0);
      sp.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    }
  }
  // TCDM 双金属条(上金下白)搭在片簧根部——账 6:温漂补偿 ~20×
  const tc1 = tb(0.24, 0.012, 0.07, M.gold, -0.33, 1.4, 0.0); tc1.rotation.z = -0.3;
  const tc2 = tb(0.24, 0.012, 0.07, M.white, -0.33, 1.386, 0.0); tc2.rotation.z = -0.3;
  // DCS 差分电容:质量上下极板 + 梳齿
  for (const sgn of [1, -1]) {
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.014, 14), M.steel);
    pl.position.set(0.23, 0.95 + sgn * 0.125, 0); teach.add(pl);
    for (let k = 0; k < 3; k++) tb(0.02, 0.03, 0.08, M.steel, 0.16 + k * 0.07, 0.95 + sgn * 0.1, 0);
  }
  // 反馈音圈(铜)插入磁体杯(暗)——账 6:静漂从位移转成电流
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.1, 12), M.copper);
  coil.rotation.x = Math.PI / 2; coil.position.set(0.23, 0.95, -0.12); teach.add(coil);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.12, 12, 1, true),
    L(0x3a3d42, { side: THREE.DoubleSide }));
  cup.rotation.x = Math.PI / 2; cup.position.set(0.23, 0.95, -0.2); teach.add(cup);
  tb(0.06, 0.33, 0.06, M.dark, 0.23, 0.62 + 0.165, -0.24);           // 磁体支架
  tb(0.16, 0.1, 0.1, M.dark, -0.44, 0.72, 0.18);                     // 接线盒
  beam(-0.44, 0.68, 0.22, -0.34, 0.05, 0.55, 0.024, M.dark, teach);  // 引线(台座局部系)

  // ---------- v2 深挖 B:SP 短周期三分量模块(剖开盒,三轴色=屏三道色) ----------
  const spg = new THREE.Group(); spg.position.set(3.95, 0, 2.75); spg.rotation.y = -0.6; g.add(spg);
  cyl(0.17, 0.2, 0.5, 10, M.grey, 0, 0.25, 0, spg);
  const sb = (w, h, d, mat, x, y, z) => box(w, h, d, mat, x, y, z, spg);
  sb(0.34, 0.34, 0.02, M.white, 0, 0.67, -0.16);                     // 背
  sb(0.02, 0.34, 0.32, M.white, -0.16, 0.67, 0);                     // 左右
  sb(0.02, 0.34, 0.32, M.white, 0.16, 0.67, 0);
  sb(0.34, 0.02, 0.32, M.white, 0, 0.84, 0);                         // 顶底
  sb(0.34, 0.02, 0.32, M.white, 0, 0.5, 0);
  // 三个正交微摆(色标与震波屏三通道一致——同色因果链)
  const axMat = [traceMat[0], traceMat[1], traceMat[2]];
  const spAxis = (mat, x, y, rot) => {
    const a = new THREE.Group(); a.position.set(x, y, 0.02); a.rotation.z = rot; spg.add(a);
    box(0.02, 0.1, 0.02, M.steel, 0, 0.05, 0, a);
    box(0.09, 0.012, 0.05, mat, 0.045, 0.1, 0, a);                   // 微型摆片
    box(0.045, 0.045, 0.045, M.copper, 0.09, 0.08, 0, a);
  };
  spAxis(axMat[0], -0.09, 0.55, 0);                                  // Z 竖摆
  spAxis(axMat[1], 0.02, 0.57, 1.57);                                // N 横摆
  spAxis(axMat[2], 0.04, 0.72, -1.57);                               // E 横摆
  sb(0.24, 0.02, 0.1, M.pcb, 0, 0.53, 0.1);                          // ASIC 板
  sb(0.2, 0.14, 0.02, M.whiteDust, 0, 0.28, 0.17);                   // 铭牌

  // ---------- v2 深挖 C:电子柜检修门(ADC/反馈/电源三板 + 加热片) ----------
  box(0.02, 0.5, 0.54, M.dark, EB.x + 0.578, 0.62, EB.z);            // 腔口
  box(0.016, 0.4, 0.13, M.pcb, EB.x + 0.595, 0.62, EB.z - 0.17);     // ADC 板(绿)
  box(0.016, 0.4, 0.13, M.copper, EB.x + 0.595, 0.62, EB.z);         // 反馈板(铜)
  box(0.016, 0.4, 0.13, M.pcb, EB.x + 0.595, 0.62, EB.z + 0.17);     // 采集板
  box(0.012, 0.12, 0.3, M.heater, EB.x + 0.585, 0.42, EB.z);         // 加热片(暗红)
  {
    const door = new THREE.Group();
    door.position.set(EB.x + 0.585, 0.62, EB.z - 0.29); g.add(door); // 铰在 -z 边
    const dp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.52, 0.56), M.white);
    dp.position.z = 0.28; door.add(dp);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.03), M.dark);
    hd.position.set(-0.03, 0, 0.5); door.add(hd);
    door.rotation.y = 1.25;                                          // 外翻 ~72°
  }

  // ---------- v3 深挖 D:方位定位盘(账 7 的几何身份) ----------
  // 指针指向最近一次事件的反方位角(与屏共享事件调度=同一个地震);
  // 置信弧宽度 = 该类事件的 σ_baz:本地窄 / 区域中 / 远震宽 —— 观众直接看到
  // "远震方位定不准"(P 波太竖,水平分量上信号按 sin(i) 打折)。
  const BZ = { x: 4.15, z: 0.55 };
  const bz = new THREE.Group();
  bz.position.set(BZ.x, 1.28, BZ.z); bz.rotation.y = -0.42; g.add(bz);
  cyl(0.045, 0.06, 1.28, 8, M.steel, BZ.x, 0.64, BZ.z);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 28), M.grey);
  dial.rotation.x = Math.PI / 2; bz.add(dial);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.012, 28), M.screenBg);
  face.rotation.x = Math.PI / 2; face.position.z = 0.032; bz.add(face);
  for (let k = 0; k < 12; k++) {                                     // 方位刻度
    const a = k * Math.PI / 6;
    const tk = new THREE.Mesh(new THREE.BoxGeometry(0.016, k % 3 ? 0.045 : 0.075, 0.008),
      k % 3 ? M.whiteDust : M.orange);
    tk.position.set(Math.sin(a) * 0.375, Math.cos(a) * 0.375, 0.04);
    tk.rotation.z = -a; bz.add(tk);
  }
  box(0.055, 0.055, 0.01, M.orange, 0, 0.375, 0.045, bz);               // N 标
  // 已知方位标记:发射工位(红)+ 三远端节点(青)
  const azMark = (aDeg, mat, w) => {
    const a = aDeg * Math.PI / 180;
    const m = new THREE.Mesh(new THREE.ConeGeometry(w, 0.05, 3), mat);
    m.position.set(Math.sin(a) * 0.325, Math.cos(a) * 0.325, 0.045);
    m.rotation.set(Math.PI / 2, 0, -a); bz.add(m);
  };
  azMark(56, M.beacon, 0.028);                                       // → ops-spaceport-02
  [140, 235, 330].forEach(d => azMark(d, traceMat[1], 0.02));        // → 远端节点
  // 置信弧三档(账 7:σ_baz 2.8° / 8.4° / 25.5°),按事件类型显隐
  const arcMat = L(0x1a3a2a, { emissive: 0x2fd08a, emissiveIntensity: 1.1,
    side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
  const arcs = [2.8, 8.4, 25.5].map(sig => {
    const half = sig * Math.PI / 180;
    const ar = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.39, 28, 1, Math.PI / 2 - half, 2 * half), arcMat);
    ar.position.z = 0.038; ar.visible = false; bz.add(ar);
    return ar;
  });
  const needle = new THREE.Group(); needle.position.z = 0.05; bz.add(needle);
  box(0.013, 0.26, 0.012, M.orange, 0, 0.13, 0, needle);
  const nTip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 4), M.orange);
  nTip.position.y = 0.28; needle.add(nTip);
  const hubMat = L(0x2a2f2a, { emissive: 0x35e08a, emissiveIntensity: 1.4 });
  const dialHub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), hubMat);
  dialHub.rotation.x = Math.PI / 2; dialHub.position.z = 0.055; bz.add(dialHub);
  box(0.4, 0.1, 0.02, M.whiteDust, 0, -0.53, 0.02, bz);            // 铭牌

  // ---------- v3 深挖 E:城网接入柱(账 8 的矛盾做成实物) ----------
  // 供电进来、振动不许进来:埋地电缆沟 → 隔振墩(混凝土+弹性垫)→ 立式 Ω
  // 应力消除环 → 双路配电箱(绿=城网主供 / 琥珀=PV 应急备份)→ E-box。
  const GR = { x: -2.15, z: -4.15 };
  for (let i = 0; i < 4; i++)                                        // 埋地电缆沟(朝城方向)
    box(0.42, 0.035, 0.95, M.dark, GR.x - 0.5 - i * 0.42, 0.022, GR.z - 0.45 - i * 0.5);
  box(0.62, 0.34, 0.5, M.grey, GR.x, 0.17, GR.z);                    // 混凝土隔振墩
  box(0.66, 0.05, 0.54, M.dark, GR.x, 0.36, GR.z);                   // 弹性垫(深色)
  {                                                                  // 立式 Ω 应力消除环
    const om = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 6, 18, Math.PI * 1.7), M.dark);
    om.position.set(GR.x + 0.05, 0.6, GR.z + 0.1); om.rotation.y = 0.5; g.add(om);
  }
  const pdu = new THREE.Group(); pdu.position.set(GR.x + 0.62, 0, GR.z + 0.42); g.add(pdu);
  box(0.48, 0.62, 0.34, M.white, 0, 0.55, 0, pdu);                   // 双路配电箱
  box(0.52, 0.05, 0.38, M.gold, 0, 0.88, 0, pdu);
  for (const [dx, dz] of [[-0.19, -0.13], [0.19, -0.13], [-0.19, 0.13], [0.19, 0.13]])
    box(0.05, 0.24, 0.05, M.dark, dx, 0.12, dz, pdu);
  const gridMat = L(0x1c3324, { emissive: 0x2fd08a, emissiveIntensity: 1.5 });
  const pvMat = L(0x33270f, { emissive: 0xe0982a, emissiveIntensity: 0.9 });
  box(0.14, 0.04, 0.02, gridMat, -0.1, 0.72, 0.175, pdu);            // 绿=城网主供
  box(0.14, 0.04, 0.02, pvMat, 0.1, 0.72, 0.175, pdu);               // 琥珀=PV 备份
  box(0.3, 0.16, 0.02, M.whiteDust, 0, 0.55, 0.176, pdu);            // 铭牌
  box(0.09, 0.14, 0.06, M.orange, 0.16, 0.34, 0.17, pdu);            // 断路手柄
  beam(GR.x + 0.2, 0.42, GR.z + 0.1, GR.x + 0.62, 0.32, GR.z + 0.42, 0.04, M.dark);
  beam(GR.x + 0.72, 0.3, GR.z + 0.55, EB.x - 0.5, 0.12, EB.z - 0.3, 0.036, M.dark);
  // PV 侧标注:应急备份(账 8:积灰 0.25 %/sol,sol 474 全负载掉线)
  box(0.34, 0.14, 0.02, M.whiteDust, PV.x, 0.62, PV.z + 0.99);

  // ---------- v4 深挖 F:信号链展板(账 9/10 的几何身份) ----------
  // 八级链条,每级色块 = 实物件颜色(同色因果链的收口):
  // 铜=摆与反馈音圈 / 钢=DCS 电容 / 绿=前放与 ADC 板 / 白=抗混叠 / 青=抽取 FIR
  // / 蓝=OCXO 时间戳 / 琥珀=城市链路。animate 让"信号包"逐级点亮走完全链。
  const CH = { x: 2.25, z: -3.35 };
  const chg = new THREE.Group();
  chg.position.set(CH.x, 0, CH.z); chg.rotation.y = 0.22; g.add(chg);
  box(0.08, 1.12, 0.08, M.steel, -0.78, 0.56, 0, chg);
  box(0.08, 1.12, 0.08, M.steel, 0.78, 0.56, 0, chg);
  box(1.86, 0.7, 0.07, M.grey, 0, 1.42, 0, chg);
  box(1.72, 0.58, 0.02, M.screenBg, 0, 1.42, 0.042, chg);
  box(1.7, 0.055, 0.02, M.orange, 0, 1.72, 0.045, chg);            // 台头条
  const STAGES = [
    { c: 0xb0703c, n: 'pendulum' },      // 铜:摆 + 检验质量
    { c: 0xa9b0b8, n: 'DCS' },           // 钢:差分电容换能
    { c: 0x2fd08a, n: 'preamp' },        // 绿:前放/解调板
    { c: 0xb0703c, n: 'feedback' },      // 铜:反馈音圈(回到机械)
    { c: 0xd8d2c8, n: 'anti-alias' },    // 白:2 极点模拟滤波
    { c: 0x2fd08a, n: 'Σ-Δ ADC' },      // 绿:51.2 kHz 调制器
    { c: 0x53a8e8, n: 'decimate' },      // 青:抽取 FIR
    { c: 0x2f6fd0, n: 'OCXO stamp' },    // 蓝:授时打戳
  ];
  const chainMats = [], chainBase = [];
  STAGES.forEach((s, i) => {
    const x = -0.75 + i * 0.214;
    const m = L(s.c, { emissive: s.c, emissiveIntensity: 0.25 });
    chainMats.push(m); chainBase.push(new THREE.Color(s.c));
    box(0.155, 0.2, 0.018, m, x, 1.5, 0.055, chg);                 // 级色块
    box(0.155, 0.035, 0.016, M.whiteDust, x, 1.33, 0.055, chg);    // 级标签条
    if (i < STAGES.length - 1)                                     // 级间箭头
      box(0.045, 0.02, 0.014, M.whiteDust, x + 0.107, 1.5, 0.055, chg);
  });
  // 反馈回环箭头(第 4 级折回第 1 级——反馈是环不是链)
  box(1.0, 0.018, 0.014, M.copper, -0.43, 1.19, 0.055, chg);
  box(0.018, 0.12, 0.014, M.copper, -0.75, 1.25, 0.055, chg);
  box(0.018, 0.12, 0.014, M.copper, 0.07, 1.25, 0.055, chg);
  const outMat = L(0xe0982a, { emissive: 0xe0982a, emissiveIntensity: 0.3 });
  box(0.1, 0.14, 0.018, outMat, 0.83, 1.5, 0.055, chg);            // 出口:城市链路
  box(0.4, 0.1, 0.02, M.whiteDust, 0, 1.06, 0.045, chg);           // 铭牌

  // ---------- v4 深挖 G:标定线圈(账 9)+ 授时单元(账 10) ----------
  // 标定线圈独立于反馈音圈:注入已知力验证极点零点,精度不受噪声限制(SNR~1e8),
  // 受线圈常数温漂与系统延迟重复性(50 µs)限制。
  const calMat = L(0xc9a54a, { emissive: 0xc9a54a, emissiveIntensity: 0.3 });
  {
    const cc = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 6, 16), calMat);
    cc.rotation.y = Math.PI / 2; cc.position.set(0.23, 0.95, 0.13); teach.add(cc);
    const cc2 = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.016, 6, 16), calMat);
    cc2.rotation.y = Math.PI / 2; cc2.position.set(0.23, 0.95, 0.165); teach.add(cc2);
    box(0.05, 0.05, 0.09, M.dark, 0.23, 0.95, 0.23, teach);        // 线圈骨架座
    beam(0.23, 0.93, 0.27, -0.42, 0.74, 0.2, 0.016, calMat, teach); // 标定引线去接线盒
  }
  // OCXO 授时模块:E-box 检修腔内第四块板(深蓝)+ 顶部授时天线朝中继星
  const ocxoMat = L(0x2f6fd0, { emissive: 0x2f6fd0, emissiveIntensity: 0.55 });
  box(0.016, 0.34, 0.1, ocxoMat, EB.x + 0.595, 0.55, EB.z + 0.36);
  box(0.03, 0.06, 0.03, M.gold, EB.x + 0.6, 0.75, EB.z + 0.36);    // 恒温槽指示
  {
    const mast = cyl(0.02, 0.024, 0.42, 6, M.steel, EB.x + 0.42, 1.19, EB.z - 0.22);
    const patch = box(0.11, 0.03, 0.11, M.gold, EB.x + 0.42, 1.41, EB.z - 0.22);
    patch.rotation.set(0.5, 0.7, 0);                               // 朝 com-station-01 仰角
    box(0.14, 0.04, 0.14, M.dark, EB.x + 0.42, 1.38, EB.z - 0.22);
  }

  // ---------- POI 锚点(7 卡) ----------
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); g.add(a);
  };
  poi('poi_wts', RING.x, 1.15, RING.z);
  poi('poi_vbb', STAND.x, 1.35, STAND.z);
  poi('poi_mount', RING.x + 1.2, 0.45, RING.z - 1.1);
  poi('poi_quiet', BM.x, 2.4, BM.z);
  poi('poi_launch', PT.x, 1.55, PT.z);
  poi('poi_screen', SCR.x, 2.3, SCR.z);
  poi('poi_science', EB.x, 1.25, EB.z);
  poi('poi_feedback', 1.35, 1.75, -0.5);   // 教学台(账 6:反馈/TCDM/量化)
  poi('poi_sp', 3.95, 1.1, 2.75);          // SP 模块(锚可多于卡,坑账 23)
  poi('poi_baz', BZ.x, 1.85, BZ.z);        // 方位定位盘(账 7)
  poi('poi_grid', GR.x + 0.62, 1.15, GR.z + 0.42);  // 城网接入柱(账 8)
  poi('poi_chain', CH.x, 2.0, CH.z);       // 信号链展板(账 10)
  poi('poi_cal', 1.62, 1.28, -0.35);       // 标定线圈(账 9)
  poi('poi_time', EB.x + 0.42, 1.62, EB.z - 0.22);  // 授时单元(惰性锚,坑账 23)

  // ---------- 震波程序(与设计册 sim/05 逐式对应;纯 t,确定性) ----------
  const micro = (t, seed) => {
    const gst = 0.62 + 0.38 * Math.sin(6.2832 * t / 37.0 + seed * 2.1) * Math.sin(6.2832 * t / 11.3 + seed);
    let w = 0;
    for (let k = 0; k < 4; k++) {
      const fk = 0.4 + 0.28 * k + 0.05 * hashf(seed * 7 + k);
      w += (0.5 - 0.09 * k) * Math.sin(6.2832 * fk * t + hashf(seed * 13 + k) * 6.283);
    }
    w += 0.14 * Math.sin(6.2832 * (3.1 + 0.6 * hashf(seed + 5)) * t + seed);
    return 0.16 * gst * w;
  };
  // 事件调度种子 sched 与通道无关(同一地震三分量同时到),ch 只影响相位与幅比
  const eventW = (t, T, sched, ch, amp, fP, fS, tS, cod) => {
    let w = 0;
    const n0 = Math.floor(t / T);
    for (const n of [n0 - 1, n0]) {
      if (hashf(n * 3.7 + sched) > 0.78) continue;                   // 22% 空窗
      const t0 = n * T + hashf(n * 9.1 + sched) * T * 0.6;
      const tau = t - t0;
      if (tau <= 0 || tau > 60) continue;
      const chAmp = amp * (0.75 + 0.5 * hashf(n * 5.3 + sched + ch * 7.0));  // 每通道幅比
      const eP = Math.min(tau / 0.9, 1) * Math.exp(-Math.max(tau - 0.9, 0) / 2.2);
      w += chAmp * eP * Math.sin(6.2832 * fP * tau + hashf(n + sched + ch * 3.0) * 6.28);
      const tauS = tau - tS;
      if (tauS > 0) {
        const eS = Math.min(tauS / 1.6, 1) * Math.exp(-Math.max(tauS - 1.6, 0) / cod);
        w += 1.9 * chAmp * eS * Math.sin(6.2832 * fS * tauS + hashf(n * 2 + sched + ch * 3.0) * 6.28);
      }
    }
    return w;
  };
  const launchW = (tau) => {
    if (tau < 0 || tau > 45) return 0;
    const env = Math.min(tau / 3, 1) * (tau < 15 ? 1 : Math.exp(-(tau - 15) / 9));
    const w = Math.sin(6.2832 * 1.8 * tau) + 0.6 * Math.sin(6.2832 * 2.7 * tau + 1.3)
      + 0.35 * Math.sin(6.2832 * 4.1 * tau + hashf(Math.floor(tau * 3)) * 6.28);
    return 3.4 * env * w;
  };
  // 最近一次事件的定位解(纯 t:遍历当前与前一窗口取 t0 最大者)。
  // 与 eventW 共用调度种子 12/23 —— 屏上那一道波和盘上这个方位是同一个地震。
  const lastEvent = (t) => {
    let best = null;
    for (const [T, sched, kind] of [[90.0, 12.0, 0], [210.0, 23.0, 1]]) {
      const n0 = Math.floor(t / T);
      for (const n of [n0 - 1, n0]) {
        if (hashf(n * 3.7 + sched) > 0.78) continue;
        const t0 = n * T + hashf(n * 9.1 + sched) * T * 0.6;
        if (t0 > t) continue;
        if (!best || t0 > best.t0) {
          // 小事件多为本地(σ 2.8°),中事件按 hash 分区域/远震(8.4°/25.5°)
          const far = kind === 1 ? (hashf(n * 6.7 + sched) > 0.4 ? 2 : 1) : 0;
          best = { t0, baz: hashf(n * 4.1 + sched) * 6.2832, band: far };
        }
      }
    }
    return best;
  };
  const st = { pending: false, launchT0: -1e9, lastT: 0 };
  // 标定序列(账 9):每 300 s 经标定线圈注入 20 s 已知正弦,验证极点零点。
  // 屏上此时是一条干净的 1 Hz 正弦——观众看得出"这不是地震,是仪器在自检"。
  const CAL_PERIOD = 300.0, CAL_LEN = 20.0;
  const calPhase = (t) => {
    const tt = t % CAL_PERIOD;
    if (tt > CAL_LEN) return -1;
    return tt / CAL_LEN;                                             // 0..1 进行度
  };
  const wave = (t, ch) => {
    const cp = calPhase(t);
    if (cp >= 0) {
      // 标定不是单频而是**扫频**:0.15→2 Hz 线性 chirp 一次量完整条传递函数的幅相。
      // 屏上因此从疏到密——观众一眼看出这不是地震,是仪器在自检。
      const tau = cp * CAL_LEN, F0C = 0.15, F1C = 2.0;
      const k = (F1C - F0C) / CAL_LEN;
      const ph = 6.2832 * (F0C * tau + 0.5 * k * tau * tau);
      const env = Math.min(cp * 8, 1) * Math.min((1 - cp) * 8, 1);
      return 1.9 * env * Math.sin(ph + ch * 2.094);
    }
    const seed = 11.0 + ch * 17.0;
    let w = micro(t, seed);
    w += eventW(t, 90.0, 12.0, ch, 0.55, 2.3, 1.15, 2.4, 6.0);       // 小事件 ~90 s
    w += eventW(t, 210.0, 23.0, ch, 1.60, 1.8, 0.85, 4.2, 16.0);     // 中事件 ~210 s
    if (ch > 0) w *= 1.25;                                           // 水平分量 S 偏大
    w += launchW(t - st.launchT0);
    return w;
  };

  g.userData.actions = {
    '接收发射信号': () => { st.pending = true; },                     // ltst 14:00 引擎自动触发
  };
  const legendCol = { calm: new THREE.Color(0x35e08a), evt: new THREE.Color(0xffb02e), lch: new THREE.Color(0xff3524) };
  g.userData.animate = (t) => {
    st.lastT = t;
    if (st.pending) { st.pending = false; st.launchT0 = t + 2.0; }   // P 波走时 ~2 s 后到台
    const inLaunch = (t - st.launchT0) > 0 && (t - st.launchT0) < 45;
    let peak = 0;
    for (let ch = 0; ch < 3; ch++) {
      const arr = cols[ch];
      for (let i = 0; i < NCOL; i++) {
        const v = wave(t - (NCOL - 1 - i) * DTCOL, ch);
        const a = Math.min(1, Math.abs(v) / 4.2);                     // 4.2 = 满栅(发射削顶)
        arr[i].scale.y = Math.max(0.045, a);
        if (i === NCOL - 1 && ch === 0) peak = Math.abs(v);
      }
    }
    legendMat.emissive.copy(inLaunch ? legendCol.lch : (peak > 0.9 ? legendCol.evt : legendCol.calm));

    // 方位盘:指针保持最近一次定位解,置信弧按事件类型换档
    const ev = inLaunch
      ? { t0: st.launchT0, baz: 56 * Math.PI / 180, band: 0 }   // 发射=已知位置,窄弧
      : lastEvent(t);
    if (ev) {
      needle.rotation.z = -ev.baz;
      for (let k = 0; k < 3; k++) {
        arcs[k].visible = (k === ev.band);
        if (k === ev.band) arcs[k].rotation.z = -ev.baz;
      }
      const age = t - ev.t0;
      const live = age < 30 ? Math.max(0.25, 1 - age / 30) : 0.18;   // 解算新鲜度
      arcMat.opacity = 0.2 + 0.5 * live;
      hubMat.emissive.copy(inLaunch ? legendCol.lch
        : (age < 12 ? legendCol.evt : legendCol.calm));
    }

    // 信号链展板:信号包逐级点亮走完全链(4.8 s 一趟);标定期整链转琥珀
    const cp = calPhase(t);
    const head = (t % 4.8) / 4.8 * (STAGES.length + 0.6);
    for (let k = 0; k < STAGES.length; k++) {
      const d = head - k;
      const lit = (d >= 0 && d < 1.6) ? 1 - d / 1.6 : 0;            // 拖尾式点亮
      const m = chainMats[k];
      if (cp >= 0) {                                                 // 标定态:整链琥珀呼吸
        const br = 0.5 + 0.5 * Math.sin(6.2832 * 2.0 * t);
        m.emissive.setHex(0xe0982a);
        m.emissiveIntensity = 0.3 + 1.1 * br;
      } else {
        m.emissive.copy(chainBase[k]);
        m.emissiveIntensity = 0.22 + 1.5 * lit;
      }
    }
    outMat.emissiveIntensity = cp >= 0 ? 0.3
      : 0.25 + 1.3 * (head > STAGES.length ? 1 : 0);
    calMat.emissiveIntensity = cp >= 0 ? 1.6 : 0.25;                 // 标定线圈同步亮
  };

  // ---------- 引擎词汇 ----------
  g.userData.nightMats = [M.led, M.pv];
  g.userData.blinkMats = [M.beacon];
  g.userData.label = '火震监测站 sci-seis-01';

  // ---------- 尘膜 pass ----------
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.whiteDust, M.grey, M.orange, M.steel, M.pv, M.sphere].forEach(m => m.color.lerp(dust, 0.05));

  return g;
}
