// viewer/units/res-recycle-01.js
// 水与固废回收厂 —— 全城唯一的"出口"：人体废物、固废、废金属、fab 危废都在这里落地。
// 设计册：E:\Claude\mars-eclss（L2 闭环率账 / L3 废物账）
// 几何叙事（核心不做黑盒）：
//   同色因果链 1（水）：污水褐 → 沉降棕黄 → 膜后浅青 → UV 后清蓝，一条串列从左看到右，
//                       颜色本身就是回收率的收据。
//   同色因果链 2（堆肥）：赭黄进料 → 深褐发酵 → 黑褐腐熟，转鼓剖开可见三段料色。
//   危废间刻意独立成屋、独立排风立管：HF 与酸废不共管，这条红线用几何表达。
export const meta = {
  id: 'res-recycle-01',
  name: '水与固废回收厂',
  name_en: 'Water & Solid Waste Recycling Plant',
  size_m: 44,
  effects: ['glow_windows'],
};

export function build(THREE) {
  const g = new THREE.Group();

  let _seed = 20260810;
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

  const lam = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const M = {
    white:    lam(0xd6d2c8),
    whiteDust:lam(0xbfb9ac),
    grey:     lam(0x8b8881),
    dark:     lam(0x38352f),
    steel:    lam(0x9aa0a6),
    orange:   lam(0xd97a2b),
    // 水的四段颜色（同色因果链 1）
    wRaw:     lam(0x5a4632),        // 污水：褐
    wSettle:  lam(0x8f7a45),        // 沉降后：棕黄
    wMem:     lam(0x6fae9e),        // 膜后：浅青
    wClean:   lam(0x3f8fd0),        // UV 后：清蓝（出水）
    // 堆肥三段（同色因果链 2）
    cIn:      lam(0xb0913f),        // 进料：赭黄（作物残体+粪+调理料）
    cMid:     lam(0x6b4a2a),        // 发酵中：深褐
    cOut:     lam(0x33261b),        // 腐熟：黑褐
    // 固废分色料仓
    binPlas:  lam(0xc9a227),        // 塑料/包装
    binTex:   lam(0x7a5ba6),        // 织物（→堆肥调理料）
    binFilt:  lam(0x4f7d4a),        // 滤材
    binMed:   lam(0xb0403a),        // 医疗/实验（生物危害，不入堆肥）
    metal:    lam(0x7d8288),        // 废金属块
    hazA:     lam(0xc86a1e),        // 酸废（食人鱼）
    hazF:     lam(0x9b3fb5),        // HF（紫 = 独立回路的警示色）
    hazC:     lam(0x5c6d75),        // CMP 浆料
    gypsum:   lam(0xd8d2c0),        // 石膏（回硫厂）
    pipeH2O:  lam(0x2f6fb0),
    pipeCO2:  lam(0x3f9d92),
    pipeO2:   lam(0xeceff1),
    glowWin:  lam(0xffd9a0, { emissive: 0xffd9a0, emissiveIntensity: 0.0 }),
    glowScr:  lam(0x9fe8dc, { emissive: 0x9fe8dc, emissiveIntensity: 0.0 }),
    glowUV:   lam(0x9a7bff, { emissive: 0x9a7bff, emissiveIntensity: 0.6 }),
    blink:    lam(0xd8422b, { emissive: 0xd8422b, emissiveIntensity: 2.0 }),
    soil:     lam(0x9e5b3d),
  };

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const cyl = (r1, r2, h, mat, x, y, z, seg, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 10), mat);
    m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5); m.lookAt(_bb);
    (parent || g).add(m); return m;
  };
  const pipeX = (x0, x1, y, z, r, mat, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), 8), mat);
    m.rotation.z = Math.PI / 2; m.position.set((x0 + x1) / 2, y, z);
    (parent || g).add(m); return m;
  };
  const pipeZ = (z0, z1, y, x, r, mat, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.abs(z1 - z0), 8), mat);
    m.rotation.x = Math.PI / 2; m.position.set(x, y, (z0 + z1) / 2);
    (parent || g).add(m); return m;
  };
  const anchor = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); g.add(a); return a;
  };
  const rail = (x0, x1, y, z, parent) => {
    const n = Math.max(2, Math.round(Math.abs(x1 - x0) / 1.7));
    for (let i = 0; i <= n; i++)
      box(0.07, 1.0, 0.07, M.orange, x0 + (x1 - x0) * i / n, y + 0.5, z, parent);
    box(Math.abs(x1 - x0), 0.07, 0.07, M.orange, (x0 + x1) / 2, y + 1.0, z, parent);
    box(Math.abs(x1 - x0), 0.06, 0.06, M.orange, (x0 + x1) / 2, y + 0.55, z, parent);
  };
  // 开口池：无盖圆筒（DoubleSide）+ 内液面
  const basin = (x, z, r, h, wall, liquid, parent) => {
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 14, 1, true),
      new THREE.MeshLambertMaterial({ color: wall, side: THREE.DoubleSide }));
    shell.position.set(x, h / 2 + 0.35, z); (parent || g).add(shell);
    const surf = new THREE.Mesh(new THREE.CircleGeometry(r * 0.96, 14), liquid);
    surf.rotation.x = -Math.PI / 2;
    surf.position.set(x, h * 0.78 + 0.35, z); (parent || g).add(surf);
    cyl(r * 1.04, r * 1.04, 0.4, M.grey, x, 0.2, z, 14, parent);      // 池座
    cyl(r * 1.06, r * 1.06, 0.14, M.steel, x, h + 0.38, z, 14, parent); // 沿口压边
    return shell;
  };

  const nightMats = [M.glowWin, M.glowScr, M.glowUV];
  const blinkMats = [M.blink];
  const spinners = [];

  // ======================================================================
  // 0. 场坪
  // ======================================================================
  {
    const W = 44, D = 28;
    const geo = new THREE.PlaneGeometry(W, D, 14, 10);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(0x87695a), cB = new THREE.Color(0xa5836c), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), pz = pos.getZ(i);
      pos.setY(i, (vnoise(px * 0.35, 0, pz * 0.35) - 0.5) * 0.09);
      const n = 0.6 * vnoise(px * 0.15, 0, pz * 0.15) + 0.4 * vnoise(px * 0.95, 3, pz * 0.95);
      tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n)));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const pad = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    pad.position.y = 0.06; g.add(pad);
    box(0.55, 0.03, 24, M.dark, 13.2, 0.10, 2.0);
    box(0.55, 0.03, 24, M.dark, 15.1, 0.10, 2.0);
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    for (let i = 0; i < 14; i++) {
      const s = 0.10 + rnd() * 0.12, sy = s * (0.55 + rnd() * 0.45);
      const rk = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.soil : M.whiteDust);
      rk.scale.set(s, sy, s); rk.rotation.y = rnd() * 6.283;
      rk.position.set(-21 + rnd() * 42, 0.12 - 0.2 * sy + 1.618 * sy, -13 + rnd() * 26);
      g.add(rk);
    }
  }

  // ======================================================================
  // 1. 中水处理串列（沉降 → 膜 → UV）：四段水色从左到右由褐变蓝
  // ======================================================================
  {
    const WZ = -6.5;
    // 进水集水井（褐）
    basin(-18.5, WZ, 1.5, 1.9, 0xa8a094, M.wRaw);
    box(1.0, 0.5, 0.9, M.dark, -18.5, 2.6, WZ - 1.7);           // 进水阀站
    pipeZ(WZ - 6.0, WZ - 1.6, 2.3, -18.5, 0.16, M.pipeH2O);     // 城来污水管

    // 沉降池（棕黄）+ 刮泥机（动力核心可见，转）
    basin(-14.0, WZ, 2.0, 2.0, 0xa8a094, M.wSettle);
    const scr = new THREE.Group(); scr.position.set(-14.0, 2.5, WZ); g.add(scr);
    scr.name = 'settler_rake';
    box(4.1, 0.16, 0.28, M.steel, 0, 0, 0, scr);
    box(0.28, 0.16, 4.1, M.steel, 0, 0, 0, scr);
    for (const [dx, dz] of [[1.4, 0], [-1.4, 0], [0, 1.4], [0, -1.4]])
      box(0.5, 0.5, 0.1, M.dark, dx, -0.3, dz, scr);
    cyl(0.22, 0.22, 0.9, M.dark, 0, 0.5, 0, 8, scr);
    box(2.0, 0.10, 0.16, M.orange, 1.05, 0.12, 0, scr);      // 单侧橙标记臂=转向可读
    spinners.push({ node: 'settler_rake', axis: 'y', rpm: 1.2 });
    box(0.9, 1.1, 0.9, M.grey, -14.0, 3.2, WZ);                 // 驱动头
    // 排泥斗（污泥去堆肥）
    cyl(0.55, 0.25, 0.9, M.wSettle, -14.0, 0.45, WZ + 2.6, 10);

    // 膜撬（MF/RO）：三只卧式压力容器 + 泵组，浅青
    for (let i = 0; i < 3; i++) {
      const y = 1.15 + i * 0.75;
      const v = cyl(0.34, 0.34, 5.2, M.white, -8.2, y, WZ, 10);
      v.rotation.z = Math.PI / 2;
      cyl(0.37, 0.37, 0.3, M.wMem, -5.7, y, WZ, 10).rotation.z = Math.PI / 2;
      cyl(0.37, 0.37, 0.3, M.wMem, -10.7, y, WZ, 10).rotation.z = Math.PI / 2;
    }
    box(6.0, 0.5, 1.6, M.grey, -8.2, 0.55, WZ);
    for (const dx of [-2.6, 2.6]) {
      beam(-8.2 + dx, 0.8, WZ - 0.8, -8.2 + dx, 3.3, WZ - 0.8, 0.14, M.steel);
      beam(-8.2 + dx, 0.8, WZ + 0.8, -8.2 + dx, 3.3, WZ + 0.8, 0.14, M.steel);
      beam(-8.2 + dx, 3.3, WZ - 0.8, -8.2 + dx, 3.3, WZ + 0.8, 0.10, M.steel);
    }
    // 高压泵（带飞轮）
    box(1.6, 1.0, 1.1, M.white, -12.0, 0.9, WZ + 2.2);
    box(1.0, 0.8, 0.9, M.dark, -13.1, 0.85, WZ + 2.2);
    const pwPivot = new THREE.Group();
    pwPivot.position.set(-11.0, 0.9, WZ + 2.2);
    pwPivot.rotation.z = Math.PI / 2; g.add(pwPivot);
    const pw = cyl(0.42, 0.42, 0.18, M.steel, 0, 0, 0, 12, pwPivot);
    pw.name = 'ro_pump';
    for (let k = 0; k < 2; k++)
      box(0.07, 0.22, 0.76, M.dark, 0, 0, 0, pw).rotation.y = k * Math.PI / 2;
    spinners.push({ node: 'ro_pump', axis: 'y', rpm: 90 });
    // 浓水（RO reject）支线 → 卤水固化
    pipeX(-11.2, -5.4, 0.85, WZ + 3.0, 0.09, M.wSettle);

    // UV 消毒柱（紫光，夜里最显眼）：三支立柱
    for (let i = 0; i < 3; i++) {
      const x = -3.4 + i * 1.3;
      cyl(0.3, 0.3, 2.6, M.white, x, 1.65, WZ, 10);
      cyl(0.13, 0.13, 2.2, M.glowUV, x, 1.65, WZ, 8);
      cyl(0.33, 0.33, 0.2, M.steel, x, 3.05, WZ, 10);
    }
    box(4.6, 0.4, 1.2, M.grey, -2.1, 0.2, WZ);
    pipeX(-5.4, -3.9, 1.6, WZ, 0.13, M.wMem);
    pipeX(-1.0, 2.6, 1.6, WZ, 0.13, M.wClean);

    // 出水清水池（清蓝）+ 送城泵撬
    basin(4.2, WZ, 1.6, 1.9, 0xbdb6a8, M.wClean);
    box(1.4, 0.9, 1.0, M.white, 6.6, 0.75, WZ);
    pipeZ(WZ - 6.0, WZ - 1.8, 2.0, 4.2, 0.15, M.pipeH2O);       // 出水回城

    // 串列旁的水色图例条（褐→棕黄→浅青→清蓝，把因果链写在地上）
    for (let i = 0; i < 4; i++) {
      const mats = [M.wRaw, M.wSettle, M.wMem, M.wClean];
      box(2.6, 0.05, 0.55, mats[i], -16.0 + i * 6.6, 0.13, WZ + 4.2);
    }
    rail(-19.5, 6.0, 0.12, WZ + 5.0);
    anchor('poi_water', -8.0, 2.6, WZ + 4.6);
  }

  // ======================================================================
  // 2. 尿处理串列（VCD 蒸馏 + 卤水处理器）—— 与中水分开，先预处理再进
  // ======================================================================
  {
    const UX = -18.0, UZ = 3.5;
    box(7.2, 0.4, 4.6, M.grey, UX + 1.4, 0.2, UZ);
    // 预处理罐（酸化+氧化剂）—— 橙色警示，标出"这一步不是可选项"
    cyl(0.62, 0.62, 2.2, M.white, UX - 0.6, 1.5, UZ - 1.2, 10);
    cyl(0.65, 0.65, 0.28, M.orange, UX - 0.6, 2.5, UZ - 1.2, 10);
    box(0.5, 0.4, 0.1, M.glowScr, UX - 0.6, 1.4, UZ - 0.55);
    // VCD 蒸馏器（卧式转鼓 + 压缩机）
    const vcd = cyl(0.85, 0.85, 3.2, M.white, UX + 2.2, 1.6, UZ - 0.6, 12);
    vcd.rotation.z = Math.PI / 2;
    cyl(0.88, 0.88, 0.25, M.wMem, UX + 3.7, 1.6, UZ - 0.6, 12).rotation.z = Math.PI / 2;
    box(1.1, 0.9, 0.9, M.dark, UX + 0.3, 1.6, UZ - 0.6);
    const vfwPivot = new THREE.Group();
    vfwPivot.position.set(UX + 0.9, 1.6, UZ - 0.6);
    vfwPivot.rotation.z = Math.PI / 2; g.add(vfwPivot);
    const vfw = cyl(0.34, 0.34, 0.16, M.steel, 0, 0, 0, 10, vfwPivot);
    vfw.name = 'vcd_fw';
    for (let k = 0; k < 2; k++)
      box(0.06, 0.20, 0.62, M.dark, 0, 0, 0, vfw).rotation.y = k * Math.PI / 2;
    spinners.push({ node: 'vcd_fw', axis: 'y', rpm: 70 });
    // 卤水处理器（BPA）：小型加热干燥箱 + 干盐出料抽屉（抽出半格）
    box(1.9, 1.5, 1.6, M.white, UX + 4.6, 1.05, UZ + 1.3);
    box(2.04, 0.16, 1.74, M.orange, UX + 4.6, 1.86, UZ + 1.3);
    box(1.5, 0.45, 0.7, M.steel, UX + 4.6, 0.62, UZ + 2.35);    // 抽屉抽出
    box(1.3, 0.18, 0.55, M.gypsum, UX + 4.6, 0.88, UZ + 2.35);  // 干盐
    pipeX(UX + 5.6, UX + 8.5, 2.0, UZ + 1.3, 0.10, M.wClean);   // 回收水并入中水
    anchor('poi_urine', UX + 2.0, 2.4, UZ + 3.0);
  }

  // ======================================================================
  // 3. 堆肥反应器（卧式转鼓，朝观察侧剖开：翻抛叶片 + 三段料色）
  //    三个接口都露出来：耗 O2（白管）/ 放 CO2（青管）/ 出水（蓝管）
  // ======================================================================
  {
    const DX = 5.5, DZ = -6.0;
    box(12.0, 0.5, 4.0, M.grey, DX, 0.25, DZ);                  // 基座
    // 转鼓：只做背半壳（露出前半的料床）——剖切样板
    const drumBack = new THREE.Mesh(
      // theta: 0=+Z(观察侧)，0.5pi=+Y(上)。壳体覆盖 上→后→下，把 +Z 那一面整个让出来
      new THREE.CylinderGeometry(1.7, 1.7, 9.6, 16, 1, true, Math.PI * 0.60, Math.PI * 1.08),
      new THREE.MeshLambertMaterial({ color: 0xcfc9bc, side: THREE.DoubleSide }));
    drumBack.rotation.z = Math.PI / 2;
    drumBack.rotation.y = 0;
    drumBack.position.set(DX, 2.5, DZ - 0.55);
    g.add(drumBack);
    // 端板
    for (const dx of [-4.85, 4.85]) {
      const ep = new THREE.Mesh(new THREE.CircleGeometry(1.7, 16), M.whiteDust);
      ep.rotation.y = Math.PI / 2;
      ep.position.set(DX + dx, 2.5, DZ - 0.55); g.add(ep);
      cyl(1.78, 1.78, 0.2, M.steel, DX + dx * 0.82, 2.5, DZ - 0.55, 16).rotation.z = Math.PI / 2;
    }
    // 料床三段（赭黄 → 深褐 → 黑褐）：进料端到出料端的因果链
    const segMat = [M.cIn, M.cMid, M.cOut];
    for (let i = 0; i < 3; i++) {
      box(3.0, 0.42, 2.4, segMat[i], DX - 3.2 + i * 3.2, 1.55, DZ - 0.35);
      // 料面小起伏
      box(2.6, 0.18, 1.9, segMat[i], DX - 3.2 + i * 3.2 + 0.3, 1.82, DZ - 0.2);
    }
    // 翻抛叶片（转起来的那部分：一根轴 + 6 片桨）
    const paddle = new THREE.Group();
    paddle.position.set(DX, 2.5, DZ - 0.55);
    paddle.name = 'compost_paddles';
    g.add(paddle);
    cyl(0.16, 0.16, 9.4, M.dark, 0, 0, 0, 8, paddle).rotation.z = Math.PI / 2;
    // 抄板做大并贴近筒壁：真实堆肥转鼓的翻抛板本就接近内径，小板子在剖口外根本看不见
    // （螺旋排布——每片沿轴前移，所以整组没有 6 重对称，视觉周期是整整一转 24 s）
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, x = -3.9 + i * 1.56;
      const p = box(1.5, 1.40, 0.16, M.steel, x, 0, 0, paddle);
      p.position.set(x, Math.cos(a) * 0.95, Math.sin(a) * 0.95);
      p.rotation.x = -a;
    }
    spinners.push({ node: 'compost_paddles', axis: 'x', rpm: 2.5 });
    // 齿圈传动 + 电机（动力核心可见）
    const gear = cyl(1.9, 1.9, 0.26, M.dark, DX - 3.6, 2.5, DZ - 0.55, 20);
    gear.rotation.z = Math.PI / 2; gear.name = 'compost_gear';
    for (let k = 0; k < 14; k++) {                    // 齿（朝向 z 与自转 x 正交，此处不会摆）
      const a = k / 14 * Math.PI * 2;
      box(0.20, 0.32, 0.20, M.steel,
        Math.cos(a) * 1.96, 0, Math.sin(a) * 1.96, gear).rotation.y = -a;
    }
    spinners.push({ node: 'compost_gear', axis: 'x', rpm: 2.5 });
    box(1.2, 1.0, 1.0, M.grey, DX - 3.6, 0.95, DZ + 1.3);
    beam(DX - 3.6, 1.4, DZ + 1.3, DX - 3.6, 2.5, DZ + 0.2, 0.16, M.steel);
    // 进料斗（赭黄，开口）
    const hop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 0.42, 1.5, 12, 1, true),
      new THREE.MeshLambertMaterial({ color: 0xb9b3a6, side: THREE.DoubleSide }));
    hop.position.set(DX - 4.4, 5.2, DZ - 0.55); g.add(hop);
    const hl = new THREE.Mesh(new THREE.CircleGeometry(0.92, 12), M.cIn);
    hl.rotation.x = -Math.PI / 2; hl.position.set(DX - 4.4, 5.7, DZ - 0.55); g.add(hl);
    for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]])
      beam(DX - 4.4 + dx, 0.5, DZ - 0.55 + dz, DX - 4.4 + dx * 0.4, 4.5, DZ - 0.55 + dz * 0.4, 0.13, M.steel);
    // 三条接口管，颜色即用途
    cyl(0.14, 0.14, 2.0, M.pipeO2, DX + 1.2, 5.2, DZ - 1.9, 8);      // 好氧供氧（自 eclss）
    cyl(0.16, 0.16, 2.4, M.pipeCO2, DX + 3.0, 5.4, DZ - 1.9, 8);     // CO2 去 Sabatier
    cyl(0.10, 0.10, 1.4, M.pipeH2O, DX + 4.4, 4.6, DZ - 1.9, 8);     // 冷凝水回中水
    box(1.3, 0.9, 0.7, M.white, DX + 3.0, 6.9, DZ - 1.9);            // 排气冷凝器
    // 腐熟出料 → 装袋垛（送 res-dome-hall-01）
    box(1.5, 1.1, 1.3, M.grey, DX + 5.6, 0.75, DZ + 0.4);
    for (let i = 0; i < 6; i++) {
      const r = Math.floor(i / 3);
      box(0.8, 0.5, 0.6, M.cOut, DX + 6.9 + (i % 3) * 0.9, 0.32 + r * 0.52, DZ + 0.9);
    }
    box(1.4, 0.12, 0.9, M.dark, DX + 7.8, 0.06, DZ + 0.9);
    box(0.9, 0.55, 0.08, M.glowScr, DX, 4.6, DZ + 1.5);              // 堆体温度屏（55~65 C）
    rail(DX - 5.4, DX + 5.4, 0.5, DZ + 2.1);
    anchor('poi_compost', DX, 3.2, DZ + 2.6);
  }

  // ======================================================================
  // 4. 固废分选线（传送带 + 四色料仓 + 塑料热解制丝材）
  // ======================================================================
  {
    const SX = 0.0, SZ = 5.5;
    // 输送带：带面 + 侧梁 + 检修天窗（证明"里面是转的带"）
    box(14.0, 0.35, 1.5, M.grey, SX, 1.55, SZ);
    box(13.4, 0.10, 1.15, M.dark, SX, 1.76, SZ);
    for (let i = 0; i < 5; i++)
      box(1.2, 0.06, 0.95, M.steel, SX - 5.2 + i * 2.6, 1.83, SZ);   // 天窗露带面
    for (let i = 0; i <= 6; i++) {
      const x = SX - 6.5 + i * 2.17;
      beam(x, 0.1, SZ - 0.6, x, 1.4, SZ - 0.6, 0.13, M.steel);
      beam(x, 0.1, SZ + 0.6, x, 1.4, SZ + 0.6, 0.13, M.steel);
      beam(x, 1.4, SZ - 0.6, x, 1.4, SZ + 0.6, 0.09, M.steel);
    }
    // 头尾滚筒（转）
    for (let i = 0; i < 2; i++) {
      // 朝向进 pivot、自转进网格自身 y 轴：原写法（rotation.x 朝向 + 绕 z 自转）
      // 在欧拉复合下会让滚筒翻跟头而不是打转——光面圆柱看不出，加了条纹就露馅。
      const dPivot = new THREE.Group();
      dPivot.position.set(SX - 7.0 + i * 14.0, 1.55, SZ);
      dPivot.rotation.x = Math.PI / 2; g.add(dPivot);
      const d = cyl(0.32, 0.32, 1.3, M.dark, 0, 0, 0, 10, dPivot);
      d.name = 'sort_drum_' + i;
      box(0.10, 1.34, 0.68, M.orange, 0, 0, 0, d);   // 纵向橙条纹=滚筒在转的证据
      spinners.push({ node: 'sort_drum_' + i, axis: 'y', rpm: 22 });
    }
    box(1.1, 1.0, 1.0, M.grey, SX + 7.9, 1.3, SZ);                   // 驱动电机
    // 上料斗（城内垃圾进厂）
    const hop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 0.5, 1.4, 12, 1, true),
      new THREE.MeshLambertMaterial({ color: 0xb9b3a6, side: THREE.DoubleSide }));
    hop.position.set(SX - 6.6, 2.9, SZ); g.add(hop);
    for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]])
      beam(SX - 6.6 + dx, 0.1, SZ + dz, SX - 6.6 + dx * 0.45, 2.3, SZ + dz * 0.45, 0.12, M.steel);
    // 四色分选料仓（颜色 = 去向）
    const bins = [[M.binPlas, -4.6], [M.binTex, -1.4], [M.binFilt, 1.8], [M.binMed, 5.0]];
    for (const [mat, dx] of bins) {
      const bx = SX + dx, bz = SZ + 2.4;
      box(2.4, 1.5, 2.0, M.whiteDust, bx, 0.75, bz);
      box(2.55, 0.16, 2.15, mat, bx, 1.58, bz);                      // 色标顶沿
      box(2.0, 0.12, 1.6, mat, bx, 1.48, bz);                        // 仓内料面
      box(0.8, 0.9, 0.08, M.dark, bx, 0.75, bz + 1.05);              // 仓门
      // 溜槽从带面落料到仓（斜板，最低角按公式校）
      const ang = 42 * Math.PI / 180, L = 1.9;
      const ch = box(0.9, 0.09, L, M.steel, bx, 1.35, bz - 1.35);
      ch.rotation.x = ang;
    }
    // 塑料热解制丝材（binPlas 的下游）：小型热解炉 + 丝盘
    box(2.0, 1.8, 1.6, M.white, SX - 4.6, 0.9, SZ + 5.2);
    box(2.14, 0.16, 1.74, M.binPlas, SX - 4.6, 1.86, SZ + 5.2);
    cyl(0.2, 0.2, 1.2, M.dark, SX - 4.6, 2.5, SZ + 5.2, 8);
    for (let i = 0; i < 3; i++) {
      const sp = cyl(0.42, 0.42, 0.26, M.binPlas, SX - 2.9 + i * 1.0, 0.55, SZ + 5.2, 12);
      sp.rotation.x = Math.PI / 2;
    }
    box(0.7, 0.45, 0.08, M.glowScr, SX - 4.6, 1.2, SZ + 4.35);
    anchor('poi_sort', SX, 2.4, SZ + 1.6);
  }

  // ======================================================================
  // 5. 废金属打包（打包机 + 分牌号块垛 + "待熔"标牌）
  // ======================================================================
  {
    const MX = 15.5, MZ = 6.0;
    box(5.0, 0.4, 4.4, M.grey, MX, 0.2, MZ);
    // 剪切/打包机
    box(2.6, 2.0, 2.2, M.white, MX - 0.8, 1.4, MZ);
    box(2.76, 0.18, 2.36, M.orange, MX - 0.8, 2.5, MZ);
    box(1.2, 1.4, 0.9, M.dark, MX + 0.9, 1.1, MZ - 0.7);             // 液压站
    cyl(0.16, 0.16, 1.3, M.steel, MX - 0.8, 3.0, MZ, 8);            // 压头柱塞
    box(1.6, 0.2, 1.2, M.metal, MX - 0.8, 0.55, MZ + 1.5);          // 出块口
    // 金属块垛（0.6 m 立方，两垛按牌号分开）
    for (let i = 0; i < 5; i++) {
      const r = Math.floor(i / 3), c = i % 3;
      box(0.6, 0.6, 0.6, M.metal, MX + 2.6 + c * 0.66, 0.32 + r * 0.64, MZ - 1.0);
    }
    for (let i = 0; i < 4; i++) {
      const r = Math.floor(i / 2), c = i % 2;
      box(0.6, 0.6, 0.6, M.steel, MX + 2.6 + c * 0.66, 0.32 + r * 0.64, MZ + 1.0);
    }
    // "待熔" 标牌（诚实：城里还没有冶炼线）
    for (const dx of [-0.55, 0.55]) beam(MX + 3.0 + dx, 0.1, MZ + 2.4, MX + 3.0 + dx, 1.5, MZ + 2.4, 0.09, M.steel);
    box(1.5, 0.5, 0.08, M.dark, MX + 3.0, 1.7, MZ + 2.4);
    box(1.32, 0.34, 0.05, M.glowScr, MX + 3.0, 1.7, MZ + 2.46);
    anchor('poi_metal', MX + 1.5, 1.8, MZ + 3.0);
  }

  // ======================================================================
  // 6. 危废中和间（独立成屋 + 独立排风立管 + HF 独立紫色回路）
  // ======================================================================
  {
    const HX = 15.0, HZ = -6.5;
    // 房：三面墙 + 顶（朝 +Z 开放，看得见里面的槽）+ 实体隔墙（与堆肥间之间）
    const t = 0.28, W = 9.0, D = 6.0, H = 4.2;
    box(W, H, t, M.white, HX, H / 2, HZ - D / 2);
    box(t, H, D, M.white, HX - W / 2, H / 2, HZ);
    box(t, H, D, M.white, HX + W / 2, H / 2, HZ);
    box(W + 0.4, 0.28, D + 0.4, M.whiteDust, HX, H + 0.14, HZ);
    box(W + 0.7, 0.14, D + 0.7, M.grey, HX, H + 0.34, HZ);
    box(t, H, t, M.white, HX - W / 2, H / 2, HZ + D / 2);
    box(t, H, t, M.white, HX + W / 2, H / 2, HZ + D / 2);
    box(W, 0.45, t, M.orange, HX, H - 0.22, HZ + D / 2);             // 橙色警示过梁
    box(W + 0.5, 0.3, D + 0.5, M.grey, HX, 0.15, HZ);
    for (let i = 0; i < 3; i++)
      box(1.2, 0.6, 0.1, M.glowWin, HX - 2.8 + i * 2.8, 3.1, HZ - D / 2 + 0.18);
    // 防溢堤（整间地面抬起一圈）
    box(W - 0.6, 0.35, 0.25, M.orange, HX, 0.47, HZ + D / 2 - 0.4);

    // 酸废中和槽（食人鱼 → 石膏）：橙槽 + 搅拌器 + 加灰斗
    box(2.4, 1.3, 2.0, M.whiteDust, HX - 2.8, 0.95, HZ - 0.6);
    box(2.1, 0.12, 1.7, M.hazA, HX - 2.8, 1.55, HZ - 0.6);
    const stir = cyl(0.10, 0.10, 1.5, M.steel, HX - 2.8, 2.2, HZ - 0.6, 8);
    stir.name = 'acid_stir';
    spinners.push({ node: 'acid_stir', axis: 'y', rpm: 40 });
    box(0.7, 0.14, 0.14, M.steel, 0, -0.6, 0, stir);   // 桨叶必须挂在轴上,否则轴转桨不动
    box(0.14, 0.14, 0.7, M.steel, 0, -0.6, 0, stir);
    box(0.8, 0.7, 0.7, M.grey, HX - 2.8, 3.0, HZ - 0.6);             // 搅拌电机
    cyl(0.42, 0.2, 0.8, M.gypsum, HX - 1.4, 2.9, HZ - 1.5, 10);      // Ca(OH)2 加灰斗
    // 石膏滤饼出料（回 res-sulfur-01！）
    box(1.2, 0.6, 0.9, M.gypsum, HX - 2.8, 0.5, HZ + 1.6);
    box(1.0, 0.16, 0.75, M.gypsum, HX - 2.8, 0.88, HZ + 1.6);

    // HF 独立槽：紫色，物理隔开，自带小隔墙 + 独立排风罩
    box(0.2, 2.6, 3.4, M.white, HX - 0.55, 1.3, HZ - 0.4);           // 隔墙（红线的几何表达）
    box(1.8, 1.2, 1.6, M.whiteDust, HX + 0.6, 0.9, HZ - 0.8);
    box(1.55, 0.12, 1.35, M.hazF, HX + 0.6, 1.45, HZ - 0.8);
    box(2.0, 0.5, 1.8, M.hazF, HX + 0.6, 2.6, HZ - 0.8);             // 独立排风罩
    cyl(0.18, 0.18, 1.6, M.hazF, HX + 0.6, 3.6, HZ - 0.8, 8);
    box(0.5, 0.7, 0.22, M.hazF, HX + 0.6, 1.9, HZ + 0.3);            // 葡萄糖酸钙急救柜
    box(0.42, 0.2, 0.06, M.glowScr, HX + 0.6, 2.12, HZ + 0.43);
    // CaF2 沉淀桶
    cyl(0.4, 0.4, 0.9, M.gypsum, HX + 1.9, 0.6, HZ + 1.2, 10);

    // CMP 浆料混凝沉降柱 + 滤饼
    cyl(0.55, 0.55, 2.4, M.white, HX + 3.2, 1.4, HZ - 0.9, 10);
    cyl(0.58, 0.58, 0.24, M.hazC, HX + 3.2, 2.5, HZ - 0.9, 10);
    box(1.1, 0.45, 0.9, M.hazC, HX + 3.2, 0.42, HZ + 0.9);
    // TMAH 电化学氧化柜（单独一台，出水不进城市回路）
    box(1.4, 1.6, 1.0, M.dark, HX + 3.4, 0.95, HZ + 1.9);
    box(1.5, 0.14, 1.1, M.hazF, HX + 3.4, 1.8, HZ + 1.9);
    box(0.6, 0.4, 0.07, M.glowScr, HX + 3.4, 1.25, HZ + 2.42);

    // 独立排风立管（与堆肥间不共竖井 —— 这是设计红线，几何上就分开）
    box(1.2, 0.35, 1.2, M.grey, HX + 4.2, 0.35, HZ - 2.6);
    cyl(0.24, 0.24, 8.0, M.steel, HX + 4.2, 4.4, HZ - 2.6, 10);
    cyl(0.36, 0.36, 0.5, M.orange, HX + 4.2, 8.4, HZ - 2.6, 10);
    box(0.3, 0.3, 0.3, M.blink, HX + 4.2, 8.9, HZ - 2.6);
    for (const dz of [-0.9, 0.9]) beam(HX + 4.2, 0.4, HZ - 2.6 + dz, HX + 4.2, 4.0, HZ - 2.6 + dz * 0.2, 0.09, M.steel);
    // fab 危废进厂管（三色分管，从 +X 侧管廊来）—— 三条各走各的，不合流
    pipeX(HX + 5.0, 21.0, 2.2, HZ - 1.2, 0.09, M.hazA);
    pipeX(HX + 5.0, 21.0, 1.9, HZ - 1.2, 0.09, M.hazF);
    pipeX(HX + 5.0, 21.0, 1.6, HZ - 1.2, 0.09, M.hazC);
    anchor('poi_hazmat', HX, 2.6, HZ + 3.4);
  }

  // ======================================================================
  // 7. 压块出口（不可回收压块 → hab-tunnel-01 覆土丘）+ 站前状态屏
  // ======================================================================
  {
    // 压块机与砖垛
    const BX = -17.0, BZ = 9.0;
    box(3.0, 1.8, 2.2, M.white, BX, 1.0, BZ);
    box(3.16, 0.16, 2.36, M.grey, BX, 1.96, BZ);
    box(1.0, 0.6, 0.8, M.dark, BX + 1.9, 0.5, BZ);
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3), c = i % 3;
      box(0.85, 0.42, 0.7, M.whiteDust, BX + 2.6 + c * 0.95, 0.28 + r * 0.46, BZ + 0.2);
    }
    // 去覆土丘的运输标线 + 牌
    box(0.4, 0.03, 8.0, M.orange, BX + 4.2, 0.10, BZ + 3.6);
    for (const dx of [-0.5, 0.5]) beam(BX + 4.2 + dx, 0.1, BZ + 7.4, BX + 4.2 + dx, 1.4, BZ + 7.4, 0.08, M.steel);
    box(1.4, 0.45, 0.07, M.dark, BX + 4.2, 1.6, BZ + 7.4);
    box(1.24, 0.3, 0.05, M.glowScr, BX + 4.2, 1.6, BZ + 7.45);

    // 站前状态屏（闭环率四条）
    const SX = 6.0, SZ = 11.0;
    for (const dx of [-2.4, 2.4]) beam(SX + dx, 0, SZ, SX + dx, 2.8, SZ, 0.17, M.steel);
    box(5.4, 2.2, 0.2, M.dark, SX, 3.5, SZ);
    box(5.0, 1.85, 0.08, M.glowScr, SX, 3.5, SZ + 0.13);
    box(4.2, 0.2, 0.05, M.wClean, SX - 0.3, 4.1, SZ + 0.19);       // 水 98%
    box(0.4, 0.2, 0.05, M.cOut, SX - 2.2, 3.7, SZ + 0.19);         // 氧回收 0%
    box(0.4, 0.2, 0.05, M.binTex, SX - 2.2, 3.3, SZ + 0.19);       // 缓冲气 0%
    box(0.9, 0.2, 0.05, M.cIn, SX - 2.0, 2.9, SZ + 0.19);          // 食物 8%
    box(5.7, 0.15, 0.28, M.grey, SX, 4.68, SZ);
    anchor('poi_screen', SX, 3.5, SZ + 1.4);
  }

  // ======================================================================
  // 8. 站间管廊（污水进 / 中水出 / CO2 出 / O2 进 / fab 危废进）
  // ======================================================================
  {
    for (let i = 0; i <= 4; i++) {
      const x = -19 + i * 10;
      box(0.55, 2.0, 0.55, M.grey, x, 1.0, -12.6);
      box(0.9, 0.2, 0.9, M.dark, x, 2.0, -12.6);
    }
    pipeX(-21, 21, 2.32, -12.85, 0.15, M.pipeH2O);     // 污水进
    pipeX(-21, 21, 2.32, -12.35, 0.13, M.wClean);      // 中水出
    pipeX(-21, 21, 2.06, -12.85, 0.11, M.pipeCO2);     // 堆肥 CO2 去 Sabatier
    pipeX(-21, 21, 2.06, -12.35, 0.10, M.pipeO2);      // 好氧供氧自 eclss
    pipeZ(-12.3, -8.6, 2.32, -18.5, 0.13, M.pipeH2O);
    pipeZ(-12.3, -8.6, 2.06, 6.7, 0.10, M.pipeO2);
  }

  // ---------- 尘膜 pass ----------
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.whiteDust, M.grey, M.orange, M.steel, M.metal, M.gypsum,
   M.pipeH2O, M.pipeCO2, M.pipeO2, M.wRaw, M.wSettle, M.wMem, M.wClean,
   M.cIn, M.cMid, M.cOut, M.binPlas, M.binTex, M.binFilt, M.binMed,
   M.hazA, M.hazF, M.hazC].forEach(m => m.color.lerp(dust, 0.05));

  g.userData.spinners = spinners;
  g.userData.nightMats = nightMats;
  g.userData.blinkMats = blinkMats;
  g.userData.lights = [
    { color: 0xbfe6ff, pos: [-8, 3.4, -6.5], range: 24 },   // 中水串列
    { color: 0xffd9a0, pos: [5.5, 4.4, -6.0], range: 22 },  // 堆肥反应器
    { color: 0xffd9a0, pos: [15, 3.4, -6.0], range: 18 },   // 危废间
  ];
  return g;
}
