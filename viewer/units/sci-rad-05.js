// viewer/units/sci-rad-05.js — 地表粒子望远镜(ΔE–E 叠层:Si A/B/C + CsI D + 塑闪 E + 反符合 F,
// 外加 20 µm 前层的低能段望远镜)。sci-rad-01 (Timepix4 相机) 的邻居:同一场,两种探测器。
// 契约:MODELS.md §4(1u = 1 m,原点=基座中心地面点,+Y 上,正面 +Z,THREE 由 build 传入)。
// 设计册:E:\Claude\mars-rad-telescope(账 00–06,预注册 f2d7cb7);知识卡 sci-rad-05.info.json。
export const meta = {
  id: 'sci-rad-05',
  name: '地表粒子望远镜(ΔE–E)',
  name_en: 'Surface Particle Telescope (dE-E)',
  size_m: 8.25,              // 实测包围盒最大边(validate_unit bbox x=8.25,含散落砾石与车辙);manifest 同值
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'sci-rad-05';
  // ---------- 确定性伪随机 ----------
  let _seed = 20260913;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash3 = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };
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
  const lam = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
  const M = {
    slab: lam(0xa8967f), slabDark: lam(0x8d7a64),
    white: lam(0xe8e4dc), whiteDust: lam(0xd9cfc0), grey: lam(0x8a8f96), dark: lam(0x3a3d42),
    orange: lam(0xe3772b), yellow: lam(0xe0b02a), steel: lam(0xb8bcc2), copper: lam(0xb0703a),
    csi: lam(0xf1e7c9), pvt: lam(0x5aa3d8), si: lam(0x2b2f3a), veto: lam(0x6b6f76), gold: lam(0xc9a437),
    panelOff: lam(0x1a2230), screen: new THREE.MeshLambertMaterial({ color: 0x14202c, emissive: 0x2a5b8a, emissiveIntensity: 0.9 }),
    ledG: new THREE.MeshLambertMaterial({ color: 0x1b3b1e, emissive: 0x39d353, emissiveIntensity: 1.2 }),
    ledR: new THREE.MeshLambertMaterial({ color: 0x3b1b1b, emissive: 0xff3b30, emissiveIntensity: 2.0 }),
    lampW: new THREE.MeshLambertMaterial({ color: 0x555555, emissive: 0xffd9a0, emissiveIntensity: 0.8 }),
    bar: new THREE.MeshLambertMaterial({ color: 0x0f2a3a, emissive: 0x4fc3f7, emissiveIntensity: 1.0 }),
    barFe: new THREE.MeshLambertMaterial({ color: 0x3a1010, emissive: 0xff7043, emissiveIntensity: 1.1 }),
    dot: new THREE.MeshLambertMaterial({ color: 0x102010, emissive: 0x9cff57, emissiveIntensity: 1.5 }),
    regolith: lam(0x9e6a44),
  };
  const nightMats = [M.screen, M.ledG, M.lampW, M.bar, M.barFe, M.dot];
  const blinkMats = [M.ledR];
  // ---------- 工具 ----------
  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const cyl = (rt, rb, h, mat, x, y, z, seg = 24, parent, open = false) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat); m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5); m.lookAt(_bb); (parent || g).add(m); return m;
  };
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);

  // ---------- 基座:压实风化土板 + 顶面斑驳 ----------
  const slab = box(4.6, 0.4, 4.6, M.slab, 0, 0.2, 0);
  {
    const geo = slab.geometry; const pos = geo.attributes.position; const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(0xa8967f), cB = new THREE.Color(0x8d7a64), t = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const n = 0.6 * vnoise(pos.getX(i) * 1.3, pos.getY(i) * 1.3, pos.getZ(i) * 1.3) + 0.4 * vnoise(pos.getX(i) * 4.1, 3, pos.getZ(i) * 4.1);
      t.copy(cA).lerp(cB, Math.min(1, Math.max(0, n))); col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); slab.material = new THREE.MeshLambertMaterial({ vertexColors: true });
  }
  box(4.9, 0.08, 4.9, M.slabDark, 0, 0.04, 0);               // 裙边

  // ---------- 桅杆:格构塔 0.9 m 方,3.2 m 高 ----------
  const mastH = 3.2, mastW = 0.9, mastY0 = 0.4;
  const mast = new THREE.Group(); mast.position.set(-0.6, mastY0, -0.4); g.add(mast);
  const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of legs) beam(sx * mastW / 2, 0, sz * mastW / 2, sx * mastW / 2 * 0.8, mastH, sz * mastW / 2 * 0.8, 0.07, M.steel, mast);
  for (let k = 0; k <= 4; k++) {
    const y = k * mastH / 4, f = 1 - 0.2 * (y / mastH), hw = mastW / 2 * f;
    for (let i = 0; i < 4; i++) {
      const a = legs[i], b = legs[(i + 1) % 4];
      beam(a[0] * hw, y, a[1] * hw, b[0] * hw, y, b[1] * hw, 0.045, M.steel, mast);
      if (k < 4) {
        const y2 = (k + 1) * mastH / 4, f2 = 1 - 0.2 * (y2 / mastH), hw2 = mastW / 2 * f2;
        beam(a[0] * hw, y, a[1] * hw, b[0] * hw2, y2, b[1] * hw2, 0.035, M.grey, mast);
      }
    }
  }
  for (const [sx, sz] of legs) box(0.3, 0.06, 0.3, M.dark, -0.6 + sx * mastW / 2, mastY0 + 0.03, -0.4 + sz * mastW / 2);   // 基脚板
  // 塔顶平台 + 护栏
  const topY = mastY0 + mastH;
  box(1.5, 0.08, 1.5, M.grey, -0.6, topY + 0.04, -0.4);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(0.05, 0.9, 0.05, M.orange, -0.6 + sx * 0.72, topY + 0.53, -0.4 + sz * 0.72);
  for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]])
    beam(-0.6 + a[0] * 0.72, topY + 0.95, -0.4 + a[1] * 0.72, -0.6 + b[0] * 0.72, topY + 0.95, -0.4 + b[1] * 0.72, 0.04, M.orange);
  // 爬梯
  for (let i = 0; i < 9; i++) box(0.4, 0.03, 0.03, M.steel, -0.6 - mastW / 2 - 0.12, mastY0 + 0.3 + i * 0.35, -0.4);
  box(0.03, mastH, 0.03, M.steel, -0.6 - mastW / 2 - 0.12 - 0.2, mastY0 + mastH / 2, -0.4);
  box(0.03, mastH, 0.03, M.steel, -0.6 - mastW / 2 - 0.12 + 0.2, mastY0 + mastH / 2, -0.4);

  // ---------- 探测头:主望远镜(朝天),真尺寸叠层在壳内,壳体开 1/4 剖切 ----------
  const head = new THREE.Group(); head.name = 'head'; head.position.set(-0.6, topY + 0.08, -0.4); g.add(head);
  // 壳体:Ø0.62 × 0.85 m,四分之一扇区切开(用 thetaLength 3π/2 的开口筒 + 两块径向封板)
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.85, 32, 1, true, Math.PI * 0.5, Math.PI * 1.5), lam(0xe8e4dc, { side: THREE.DoubleSide }));
  shell.position.set(0, 0.425, 0); head.add(shell);
  const capTop = new THREE.Mesh(new THREE.CircleGeometry(0.31, 32, Math.PI * 0.5, Math.PI * 1.5), lam(0xd9cfc0, { side: THREE.DoubleSide }));
  capTop.rotation.x = Math.PI / 2; capTop.position.set(0, 0.85, 0); head.add(capTop);   // +π/2 maps circle y -> +z, so its open quarter faces +X+Z like the shell's
  cyl(0.31, 0.31, 0.06, M.whiteDust, 0, 0.03, 0, 32, head);                         // 底盘
  // 剖切面的两块径向封板,沿开口两条边(+Z 边与 +X 边)。首版把它们横在开口正前方,把剖切挡死了(2026-09-13 预览截图发现)
  const cutMat = lam(0xcfc6b6, { side: THREE.DoubleSide });
  box(0.01, 0.85, 0.31, cutMat, 0, 0.425, 0.155, head);
  box(0.31, 0.85, 0.01, cutMat, 0.155, 0.425, 0, head);
  // 叠层外壳管(Ø0.12 × 0.24 m,同样开四分之一):真尺寸叠层只有 6 cm 高,管让剖切在城里看得见
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 24, 1, true, Math.PI * 0.5, Math.PI * 1.5), lam(0x9aa0a8, { side: THREE.DoubleSide }));
  housing.position.set(0, 0.56, 0); housing.name = 'stack_housing'; head.add(housing);
  cyl(0.065, 0.065, 0.015, M.dark, 0, 0.685, 0, 24, head);       // 外壳顶法兰
  for (let i = 0; i < 4; i++) { const cb = cyl(0.006, 0.006, 0.28, M.copper, 0.03 * Math.cos(i * 1.3 + 3.6), 0.33, 0.03 * Math.sin(i * 1.3 + 3.6), 8, head); }   // 各层信号线下到前放板
  // 入射窗(顶盖上的薄钛窗)
  cyl(0.06, 0.06, 0.02, M.dark, 0, 0.86, 0, 24, head);
  // 叠层(真尺寸,单位 m):A/B/C Ø3 cm 300 µm(画 2 mm 厚以便看见),A 顶,B 下 2 cm,C 下 4 cm;D CsI Ø4 cm × 3 cm;E 塑闪 Ø4 × 2 cm;F 反符合壳
  const stackY = 0.62;   // A 层高度(壳内)
  const stack = new THREE.Group(); stack.name = 'stack'; stack.position.set(0, stackY, 0); head.add(stack);
  for (const [name, dy] of [['A', 0], ['B', -0.02], ['C', -0.04]]) { const d = cyl(0.015, 0.015, 0.002, M.si, 0, dy, 0, 20, stack); d.name = 'det_' + name; }
  const D = cyl(0.02, 0.02, 0.03, M.csi, 0, -0.06, 0, 20, stack); D.name = 'det_D';
  const E = cyl(0.02, 0.02, 0.02, M.pvt, 0, -0.086, 0, 20, stack); E.name = 'det_E';
  const F = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.06, 20, 1, true, Math.PI * 0.5, Math.PI * 1.5), lam(0x6b6f76, { side: THREE.DoubleSide }));
  F.position.set(0, -0.073, 0); F.name = 'det_F'; stack.add(F);
  // 探测器座与前置放大板(铜色)
  box(0.12, 0.02, 0.12, M.copper, 0, -0.11, 0, stack);
  box(0.2, 0.15, 0.02, M.dark, 0.0, -0.2, -0.16, stack);
  // 低能段望远镜 L(朝天,Ø1 cm² 的小筒,壳外肩部)
  const lowe = new THREE.Group(); lowe.name = 'lowe_up'; lowe.position.set(0.42, 0.55, 0.0); head.add(lowe);
  cyl(0.05, 0.05, 0.3, M.whiteDust, 0, 0.15, 0, 20, lowe);
  cyl(0.02, 0.02, 0.01, M.dark, 0, 0.305, 0, 16, lowe);
  const t0 = cyl(0.0056, 0.0056, 0.001, M.si, 0, 0.28, 0, 12, lowe); t0.name = 'det_T0';
  beam(0.42, 0.25, 0, 0.3, 0.1, 0, 0.03, M.steel, head);
  // 低能段望远镜 L↓(朝地,设计修订项:账 3 反事实 —— 反照质子只能从下方看见);挂在塔顶平台下方
  const loweDown = new THREE.Group(); loweDown.name = 'lowe_down'; loweDown.position.set(0.15, topY - 0.05, 0.35); g.add(loweDown);
  cyl(0.05, 0.05, 0.3, M.yellow, 0, -0.15, 0, 20, loweDown);      // 未涂装的底漆黄:标它是修订项
  cyl(0.02, 0.02, 0.01, M.dark, 0, -0.305, 0, 16, loweDown);
  beam(0.15, topY - 0.02, 0.35, 0.15, topY + 0.02, 0.0, 0.03, M.steel);
  // 遮阳/防尘罩环
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.12, 32, 1, true), lam(0xe0b02a, { side: THREE.DoubleSide }));
  shade.position.set(0, 0.95, 0); head.add(shade);
  // 头部到电子箱的走线
  beam(-0.6 + 0.2, topY + 0.1, -0.4, -0.6 + 0.2, mastY0 + 0.05, -0.4, 0.035, M.dark);
  beam(-0.6 + 0.2, mastY0 + 0.05, -0.4, 1.0, mastY0 + 0.05, -0.4, 0.035, M.dark);

  // ---------- 电子箱(读出链):1.4 × 1.2 × 0.9,密封门,散热鳍,状态灯 ----------
  const ex = 1.4, ez = -0.6;
  box(1.4, 1.2, 0.9, M.white, ex, 0.4 + 0.6, ez);
  box(1.5, 0.05, 1.0, M.whiteDust, ex, 0.4 + 1.225, ez);                 // 顶盖压条
  box(1.5, 0.06, 1.0, M.dark, ex, 0.43, ez);                              // 底裙
  // 门(+Z 面)
  box(0.62, 0.9, 0.05, M.orange, ex - 0.25, 0.4 + 0.6, ez + 0.47);
  box(0.52, 0.8, 0.06, M.whiteDust, ex - 0.25, 0.4 + 0.6, ez + 0.47);
  box(0.06, 0.16, 0.05, M.dark, ex - 0.06, 0.4 + 0.6, ez + 0.5);
  box(0.09, 0.07, 0.04, M.dark, ex - 0.52, 0.4 + 0.95, ez + 0.5);
  box(0.09, 0.07, 0.04, M.dark, ex - 0.52, 0.4 + 0.25, ez + 0.5);
  // 散热鳍(−X 面)
  for (let i = 0; i < 6; i++) box(0.12, 1.0, 0.03, M.grey, ex - 0.7 - 0.06, 0.4 + 0.6, ez - 0.35 + i * 0.14);
  // 状态灯:绿=链自检通过,红=SEP 红警(闪),橙=单增益回退
  box(0.08, 0.08, 0.03, M.ledG, ex + 0.45, 0.4 + 1.05, ez + 0.47);
  const red = box(0.08, 0.08, 0.03, M.ledR, ex + 0.57, 0.4 + 1.05, ez + 0.47); red.name = 'blink_sep';
  // 双增益铭牌(门旁)
  box(0.3, 0.12, 0.01, M.steel, ex + 0.35, 0.4 + 0.75, ez + 0.455);
  // 外墙导管 + 接线箱
  cyl(0.03, 0.03, 1.0, M.dark, ex + 0.65, 0.9, ez + 0.2, 12); cyl(0.03, 0.03, 1.0, M.dark, ex + 0.65, 0.9, ez - 0.1, 12);
  box(0.2, 0.3, 0.25, M.grey, ex + 0.7, 1.55, ez + 0.05);
  // 校准源柜(黄,三叶标)
  box(0.6, 1.0, 0.6, M.yellow, ex + 0.2, 0.9, ez + 1.3);
  box(0.62, 0.04, 0.62, M.dark, ex + 0.2, 1.42, ez + 1.3);
  cyl(0.12, 0.12, 0.01, M.dark, ex + 0.2, 1.0, ez + 1.605, 24).rotation.x = Math.PI / 2;
  cyl(0.06, 0.06, 0.012, M.yellow, ex + 0.2, 1.0, ez + 1.606, 24).rotation.x = Math.PI / 2;
  // 太阳板(小,过夜电池在电子箱)
  const pv = box(1.6, 0.05, 1.0, lam(0x1b2a4a), ex - 0.2, 2.05, ez - 0.2); pv.rotation.x = -0.35; pv.name = 'pv';
  beam(ex - 0.2, 1.65, ez - 0.2, ex - 0.2, 1.95, ez - 0.2, 0.05, M.steel);

  // ---------- 展示墙:LET 谱产品面板 + ΔE–E 香蕉图 + 质子族牌 + SEU 表牌(正面 +Z,可走近读) ----------
  const wallZ = 1.75;
  box(3.2, 0.12, 0.5, M.grey, -0.4, 0.46, wallZ);                            // 展示台基
  // LET 谱面板(左)
  const panel = box(1.5, 1.0, 0.08, M.panelOff, -1.2, 1.05, wallZ); panel.name = 'let_panel';
  box(1.42, 0.92, 0.02, M.screen, -1.2, 1.05, wallZ + 0.045);
  // 24 箱谱形示意:MIP 峰 → 幂律下落 → Fe 组抬升(形状是产品的**示意**,卡上明写;高度由 Landau 峰/幂律/Fe 组三段生成)
  for (let i = 0; i < 24; i++) {
    const x = -1.2 - 0.66 + i * (1.32 / 23);
    const li = -1 + i * (4 / 23);                     // log10 LET 0.1..1000
    let h = Math.exp(-Math.pow((li + 0.35) / 0.25, 2)) * 1.0 + Math.max(0, 0.55 - 0.28 * (li + 0.35)) * (li > -0.2 ? 1 : 0) + Math.exp(-Math.pow((li - 2.35) / 0.18, 2)) * 0.22;
    h = Math.max(0.03, Math.min(0.8, h)) * 0.8;
    box(0.04, h, 0.02, li > 2.0 ? M.barFe : M.bar, x, 0.62 + h / 2, wallZ + 0.06);
  }
  // ΔE–E 香蕉图(中):四条质量线 p/d/t/He 的点阵 + 事件闪点由 animate 驱动
  const banana = box(1.0, 1.0, 0.08, M.panelOff, 0.45, 1.05, wallZ); banana.name = 'banana_panel';
  box(0.92, 0.92, 0.02, M.screen, 0.45, 1.05, wallZ + 0.045);
  // ΔE·E ∝ m z²:在对数坐标里四条质量线是平行直线,偏移 log10(m z²) = 0 / 0.30 / 0.48 / 1.20(p/d/t/⁴He)。
  // 首版用线性坐标并截顶在 0.85,⁴He 线顶出一段平台,读起来像物理(2026-09-13 预览截图发现,已改)
  const bananaY = (logk, u) => 0.06 + 0.48 * (1 - u / 0.8) + 0.30 * logk;   // u: 0..0.8 = log E 横跨一个十倍程
  const lines = [[0.0, M.bar], [0.30, M.bar], [0.48, M.bar], [1.20, M.barFe]];
  for (const [lk, mat] of lines) for (let i = 0; i < 14; i++) {
    const u = 0.02 + i * 0.058;
    box(0.02, 0.02, 0.015, mat, 0.45 - 0.42 + u * 1.05, 0.62 + bananaY(lk, u), wallZ + 0.06);
  }
  const dots = []; for (let i = 0; i < 10; i++) { const d = box(0.03, 0.03, 0.018, M.dot, 0.45, 1.05, wallZ + 0.062); d.visible = false; dots.push(d); }
  // 质子族牌(右上)与 SEU 表牌(右下):三色区间牌 + 五行表
  box(0.9, 0.42, 0.06, M.white, 1.55, 1.42, wallZ); box(0.84, 0.36, 0.01, M.dark, 1.55, 1.42, wallZ + 0.035);
  box(0.26, 0.1, 0.012, M.bar, 1.29, 1.42, wallZ + 0.04); box(0.26, 0.1, 0.012, M.dot, 1.55, 1.42, wallZ + 0.04); box(0.26, 0.1, 0.012, M.barFe, 1.81, 1.42, wallZ + 0.04);
  box(0.9, 0.48, 0.06, M.white, 1.55, 0.86, wallZ); box(0.84, 0.42, 0.01, M.dark, 1.55, 0.86, wallZ + 0.035);
  for (let i = 0; i < 5; i++) { box(0.7, 0.03, 0.012, M.steel, 1.55, 0.7 + i * 0.075, wallZ + 0.04); box(0.16, 0.03, 0.014, i >= 3 ? M.barFe : M.bar, 1.28, 0.7 + i * 0.075, wallZ + 0.042); }
  // 展台照明灯(夜)
  box(0.1, 0.05, 0.1, M.lampW, -1.2, 1.65, wallZ + 0.25); box(0.1, 0.05, 0.1, M.lampW, 1.1, 1.65, wallZ + 0.25);
  beam(-1.2, 1.55, wallZ + 0.02, -1.2, 1.64, wallZ + 0.22, 0.025, M.steel); beam(1.1, 1.66, wallZ + 0.02, 1.1, 1.64, wallZ + 0.22, 0.025, M.steel);
  beam(-1.2, 1.55, wallZ - 0.02, -1.2, 1.55, wallZ + 0.02, 0.03, M.steel); box(0.03, 0.12, 0.03, M.steel, 1.1, 1.6, wallZ);

  // ---------- 10× 剖切教具:叠层放大模型(展示墙右侧,走近可读每一层) ----------
  const cut = new THREE.Group(); cut.name = 'cutaway10x'; cut.position.set(-1.9, 0.4, -1.4); g.add(cut);
  cyl(0.28, 0.32, 0.06, M.dark, 0, 0.03, 0, 24, cut);                                   // 底座
  const cA = cyl(0.15, 0.15, 0.02, M.si, 0, 0.62, 0, 24, cut); cA.name = 'cut_A';
  cyl(0.15, 0.15, 0.02, M.si, 0, 0.42, 0, 24, cut); cyl(0.15, 0.15, 0.02, M.si, 0, 0.22, 0, 24, cut);
  const cD = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 24, 1, false, Math.PI * 0.5, Math.PI * 1.5), lam(0xf1e7c9, { side: THREE.DoubleSide })); cD.position.set(0, -0.10, 0); cD.name = 'cut_D'; cut.add(cD);
  const cE = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 24, 1, false, Math.PI * 0.5, Math.PI * 1.5), lam(0x5aa3d8, { side: THREE.DoubleSide })); cE.position.set(0, -0.36, 0); cut.add(cE);
  const cF = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.56, 24, 1, true, Math.PI * 0.5, Math.PI * 1.5), lam(0x6b6f76, { side: THREE.DoubleSide })); cF.position.set(0, -0.23, 0); cut.add(cF);
  for (let i = 0; i < 3; i++) beam(0.22, 0.62 - i * 0.2, 0.22, 0.22, 0.62 - i * 0.2 - 0.2, 0.22, 0.02, M.steel, cut);   // 支撑柱
  cyl(0.02, 0.02, 1.15, M.steel, -0.22, 0.05, 0.22, 10, cut);
  // 入射粒子箭头:一根穿过 A/B/C 停在 D 里的橙棒(停止质子),一根穿透到底的红棒(相对论 Fe)
  const arrowP = cyl(0.012, 0.012, 0.75, M.orange, 0.05, 0.28, 0.05, 10, cut); arrowP.rotation.z = 0.12;
  cyl(0.03, 0.001, 0.06, M.orange, 0.05 + 0.045, 0.28 + 0.36, 0.05, 10, cut).rotation.z = 0.12 + Math.PI;
  const arrowFe = cyl(0.014, 0.014, 1.15, M.barFe, -0.06, 0.12, -0.05, 10, cut); arrowFe.rotation.z = -0.08;
  cut.position.y = 0.4 + 0.5;

  // ---------- 接驳:走廊方向的短导管 + 法兰(+X 侧,朝 sci-rad-01 组团) ----------
  cyl(0.06, 0.06, 1.2, M.dark, 2.3 + 0.6, 0.55, -0.2, 12).rotation.z = Math.PI / 2;
  cyl(0.1, 0.1, 0.06, M.steel, 2.9, 0.55, -0.2, 16).rotation.z = Math.PI / 2;
  box(0.25, 0.35, 0.25, M.grey, 2.2, 0.575, -0.2);

  // ---------- 作业痕迹:车辙 + 散落砾石 ----------
  for (const dz of [-0.35, 0.35]) box(3.0, 0.03, 0.5, M.slabDark, 0.6, 0.015, 3.1 + dz);
  for (let i = 0; i < 26; i++) {
    const a = rnd() * 6.283, d = 2.6 + rnd() * 1.6, s = 0.06 + rnd() * 0.12;
    const r = new THREE.Mesh(rockGeo, lam(rnd() < 0.5 ? 0x8d6b4a : 0x6f5238));
    r.position.set(Math.cos(a) * d, -0.3 * s * 0.7 + 1.618 * s * 0.7, Math.sin(a) * d);
    r.scale.set(s, s * 0.7, s); r.rotation.y = rnd() * 6.28; g.add(r);
  }

  // ---------- POI 锚点(全部挂在 root 的静态坐标) ----------
  const poi = (id, x, y, z) => { const a = new THREE.Object3D(); a.name = 'poi_' + id; a.position.set(x, y, z); g.add(a); };
  poi('head', -0.6, topY + 0.6, -0.4);
  poi('lowe', -0.6 + 0.42, topY + 0.7, -0.4);
  poi('ebox', ex, 1.3, ez);
  poi('let', -1.2, 1.1, wallZ);
  poi('family', 1.55, 1.42, wallZ);
  poi('seu', 1.55, 0.86, wallZ);
  poi('cutaway', -1.9, 1.3, -1.4);
  poi('cal', ex + 0.2, 1.0, ez + 1.3);

  // ---------- 尘膜 pass ----------
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.whiteDust, M.grey, M.orange, M.yellow, M.steel, M.slab, M.slabDark].forEach(m => m.color.lerp(dust, 0.05));

  // ---------- 动画:香蕉图上的事件闪点(纯 t 函数,确定性) ----------
  g.userData.nightMats = nightMats;
  g.userData.blinkMats = blinkMats;
  g.userData.lights = [{ color: 0xffd9a0, pos: [-0.2, 1.9, wallZ + 0.6], range: 8 }];
  g.userData.animate = (t, dt, ctx) => {
    // 每 0.4 s 一个"事件":落在某条质量线附近(hash 决定种类与位置),0.3 s 后消失
    for (let i = 0; i < dots.length; i++) {
      const k = Math.floor(t / 0.4) - i;               // 第 k 个事件用第 i 个点
      const age = t - k * 0.4;
      const h = hash3(k, 3.1, 7.7), h2 = hash3(k, 9.3, 1.1);
      const lk = h < 0.75 ? 0.0 : (h < 0.87 ? 0.30 : (h < 0.93 ? 0.48 : 1.20));   // 事件种类的相对频度只是示意
      const u = 0.02 + h2 * 0.76;
      dots[i].visible = age >= 0 && age < 0.3;
      dots[i].position.set(0.45 - 0.42 + u * 1.05, 0.62 + bananaY(lk, u), wallZ + 0.062);
    }
  };
  return g;
}
