// res-foundry-01 冶金与机加工车间
// 设计册:E:\Claude\mars-foundry(14 本账 / 63 闸全绿,四轮)
// 工艺链:矿(res-mine-01)→ 磨矿 → H2 竖炉还原 900 °C 全量入炉
//        → **炉后磁选**(账 11:铁锁在硅酸盐里,分金属不分矿)→ 渗碳(ISRU 甲烷)
//        → 二段精选(账 12:精矿洁净度决定铸铁牌号)→ 感应熔炼
//        → 球化(本地皮江法镁)→ 铸造坪 → 机加工翼(车/铣/EBM)
//        炉气先过 ZnO 脱硫床(H2S 660 ppm vs SOEC 容限 1 ppm),H2S 去硫厂
//        FFC 熔盐电解 Si/Ti(Ellingham 下半区只能电解)
//        渣回 ops-printer-01(含 CaS,干态使用);O2 副产 8.3 kg/sol 并城网
export const meta = {
  id: 'res-foundry-01',
  name: '冶金与机加工车间',
  name_en: 'Foundry & Machine Shop',
  size_m: 56.5,
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();

  // ---------- 工具 ----------
  let _seed = 20260819;
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

  const M = {
    steel:  new THREE.MeshLambertMaterial({ color: 0x8a8f96 }),
    dark:   new THREE.MeshLambertMaterial({ color: 0x3a3d42 }),
    white:  new THREE.MeshLambertMaterial({ color: 0xd8d4cc }),
    wDust:  new THREE.MeshLambertMaterial({ color: 0xc4bcae }),
    orange: new THREE.MeshLambertMaterial({ color: 0xd97b2f }),
    rust:   new THREE.MeshLambertMaterial({ color: 0x8a4a2a }),
    refrac: new THREE.MeshLambertMaterial({ color: 0xb0a08a }),
    copper: new THREE.MeshLambertMaterial({ color: 0xb0703a }),
    pipeH2: new THREE.MeshLambertMaterial({ color: 0x6a8aa0 }),
    pipeO2: new THREE.MeshLambertMaterial({ color: 0x7aa07a }),
    salt:   new THREE.MeshLambertMaterial({ color: 0xe8e2d0 }),
  };
  // 自发光(常亮工艺辉光——厂子 24 h 连转,不随昼夜)
  const G = {
    melt:  new THREE.MeshLambertMaterial({ color: 0xff7722, emissive: 0xff5511, emissiveIntensity: 0.95 }),
    taph:  new THREE.MeshLambertMaterial({ color: 0xffaa33, emissive: 0xff6611, emissiveIntensity: 0.9 }),
    ingot: new THREE.MeshLambertMaterial({ color: 0xff8833, emissive: 0xdd4400, emissiveIntensity: 0.7 }),
    ebm:   new THREE.MeshLambertMaterial({ color: 0x99ccff, emissive: 0x4488ee, emissiveIntensity: 0.8 }),
    lampG: new THREE.MeshLambertMaterial({ color: 0x44dd66, emissive: 0x22bb44, emissiveIntensity: 0.9 }),
  };
  const win = new THREE.MeshLambertMaterial({ color: 0xffd9a0, emissive: 0xffb050, emissiveIntensity: 0.25 });
  const beaconRed = new THREE.MeshLambertMaterial({ color: 0xff3020, emissive: 0xcc1810, emissiveIntensity: 0.8 });

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const cyl = (rT, rB, h, mat, x, y, z, seg, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg || 16), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    (parent || group).add(m);
    return m;
  };
  const pipe = (ax, ay, az, bx, by, bz, r, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const L = _ba.distanceTo(_bb);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    m.rotateX(Math.PI / 2);
    (parent || group).add(m);
    return m;
  };
  // 两点之间架矩形截面构件(输送桥/溜槽——beam 是方截面,这个可扁)
  const slab = (ax, ay, az, bx, by, bz, w, h, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, _ba.distanceTo(_bb)), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    (parent || group).add(m);
    return m;
  };
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);   // 顶点半径 φ≈1.618
  const makePile = (x, z, r, h, hexA, hexB, baseY, chunks) => {
    const geo = new THREE.ConeGeometry(r, h, 32, 6);
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
    const pile = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    pile.position.set(x, baseY + h / 2, z);
    group.add(pile);
    for (let i = 0; i < (chunks || 0); i++) {
      const a = rnd() * 6.283, d = r * (0.85 + rnd() * 0.4), s = 0.08 + rnd() * 0.1;
      const rock = new THREE.Mesh(rockGeo, new THREE.MeshLambertMaterial({ color: rnd() < 0.5 ? hexA : hexB }));
      rock.position.set(x + Math.cos(a) * d, baseY - 0.3 * s + 1.618 * s, z + Math.sin(a) * d);
      rock.scale.setScalar(s);
      rock.rotation.y = rnd() * 6.28;
      group.add(rock);
    }
    return pile;
  };
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); group.add(a);
  };
  const rail = (x0, z0, x1, z1) => {   // 安全橙护栏:立柱+顶杆
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(L / 1.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      box(0.07, 1.0, 0.07, M.orange, x0 + (x1 - x0) * t, 0.5, z0 + (z1 - z0) * t);
    }
    beam(x0, 1.0, z0, x1, 1.0, z1, 0.07, M.orange);
  };
  const door = (x, z, face) => {       // 密封检修门(face: 0=+Z, 1=+X, 2=-Z, 3=-X)
    const rot = [0, Math.PI / 2, Math.PI, -Math.PI / 2][face];
    const d = new THREE.Group(); d.position.set(x, 0, z); d.rotation.y = rot; group.add(d);
    box(1.06, 2.02, 0.07, M.orange, 0, 1.29, 0.04, d);
    box(0.90, 1.86, 0.09, M.wDust, 0, 1.29, 0, d);
    box(0.10, 0.26, 0.08, M.dark, 0.32, 1.28, 0.06, d);
    box(0.14, 0.10, 0.06, M.dark, -0.37, 1.92, 0.05, d);
    box(0.14, 0.10, 0.06, M.dark, -0.37, 0.66, 0.05, d);
    return d;
  };

  const spinners = [], oscillators = [], nightMats = [win], blinkMats = [beaconRed];

  // =====================================================================
  // 1. 受料与预抛磁选(西前,x-22 z+8)——矿从矿场支线来。
  //    账 11 改判:此处磁鼓只预抛已有磁铁矿(全铁的 ~19%),不是品位杠杆;
  //    真正的分选在炉后(5b)。
  // =====================================================================
  {
    const hx = -22, hz = 8;
    // 受料斗(开口,内见来料)
    const hop = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 0.7, 2.2, 4, 1, true),
      new THREE.MeshLambertMaterial({ color: 0x9a9fa6, side: THREE.DoubleSide }));
    hop.rotation.y = Math.PI / 4; hop.position.set(hx, 3.1, hz); group.add(hop);
    const ore = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.18, 4),
      new THREE.MeshLambertMaterial({ color: 0x7a4a30 }));
    ore.rotation.y = Math.PI / 4; ore.position.set(hx, 3.9, hz); group.add(ore);
    // 斗腿 A 字排架 ×4 + 角撑
    [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([dx, dz]) => {
      beam(hx + dx, 0, hz + dz, hx + dx * 0.55, 2.2, hz + dz * 0.55, 0.14, M.steel);
      box(0.5, 0.1, 0.5, M.dark, hx + dx, 0.05, hz + dz);
    });
    beam(hx - 1.1, 1.2, hz - 1.1, hx + 1.1, 1.2, hz + 1.1, 0.08, M.steel);
    beam(hx - 1.1, 1.2, hz + 1.1, hx + 1.1, 1.2, hz - 1.1, 0.08, M.steel);
    // 磁选鼓(spinner)骑在斗下出料口,壳体半开露鼓面
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.5, 18), M.dark);
    drum.name = 'magdrum';
    drum.rotation.z = Math.PI / 2;
    drum.position.set(hx, 1.55, hz); group.add(drum);
    spinners.push({ node: 'magdrum', axis: 'y', rpm: 10 });   // 圆柱局部 y = 鼓轴
    box(1.7, 0.5, 0.9, M.steel, hx, 2.1, hz);                  // 磁选机罩(上半)
    // 两条溜槽:精矿(深灰,去竖炉料仓)/ 磁尾(锈红,去渣场)——同色因果链
    const chuteC = box(0.7, 0.12, 3.6, M.dark, hx - 1.6, 1.0, hz - 2.0);
    chuteC.rotation.x = 0.42; chuteC.rotation.y = 0.5;
    const chuteT = box(0.7, 0.12, 3.4, M.rust, hx + 1.7, 1.0, hz + 1.9);
    chuteT.rotation.x = -0.40; chuteT.rotation.y = 0.45;
    // 精矿小仓(竖炉旁提升机取料处)
    box(1.4, 1.2, 1.4, M.dark, hx - 3.2, 0.6, hz - 3.6);
  }

  // =====================================================================
  // 2. 氢还原竖炉(西后,x-22 z-8)——Fe 的还原核心,24 h 基荷
  // =====================================================================
  {
    const fx = -22, fz = -8;
    // 炉体:下锥+筒身+顶锥,耐火色带分段
    // 还原段做 57° 楔形剖切(开口朝 +Z 观察侧)——科学城原则:还原核心不做黑盒
    const GAP = 1.0;                                            // 剖切张角(rad)
    const THC = -0.55;                     // 开口中心朝 +Z 偏西——避开东侧提升机斜轨
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.9, 5.2, 24, 1, true, THC + GAP / 2, Math.PI * 2 - GAP),
      new THREE.MeshLambertMaterial({ color: M.refrac.color.getHex(), side: THREE.DoubleSide }));
    shell.position.set(fx, 4.4, fz); group.add(shell);
    // 剖切面 ×2(露出耐火墙厚)
    [THC + GAP / 2, THC - GAP / 2].forEach(th => {
      const f = box(0.14, 5.2, 1.75, M.refrac, fx + Math.sin(th) * 0.9, 4.4,
                    fz + Math.cos(th) * 0.9);
      f.rotation.y = th;
    });
    // 下行料柱四段:矿红(生料)→ 褐(升温)→ 深灰(还原中)→ 灼热还原段
    // 颜色梯度 = 脱氧进程的可视证据(同硫厂尾料赭黄→灰白的手法)
    const burden = [
      [0xff7722, 0.9, 2.35, true],   // 底:灼热还原段(辉光)
      [0x4a4640, 1.2, 3.4, false],   // 还原中(金属灰)
      [0x6e4a30, 1.2, 4.6, false],   // 升温段(褐)
      [0x8a4a2a, 1.3, 5.85, false],  // 顶:生料(与受料斗矿色同色)
    ];
    burden.forEach(([hex, h, y, glow]) => {
      const m = glow
        ? new THREE.MeshLambertMaterial({ color: hex, emissive: 0xff4400, emissiveIntensity: 0.85 })
        : new THREE.MeshLambertMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.12 });
      const r = 1.15 + (5.85 - y) * 0.07;                       // 随外壳锥度收放(下宽上窄)
      cyl(r, r, h, m, fx, y, fz, 18);
    });
    cyl(1.5, 1.5, 3.0, M.steel, fx, 8.5, fz, 20);
    cyl(0.6, 1.5, 1.4, M.steel, fx, 10.7, fz, 20);
    cyl(1.95, 1.4, 1.8, M.rust, fx, 0.9, fz, 20);              // 下部还原段裙
    // 环箍 ×3
    [3.2, 5.6, 7.6].forEach(y => cyl(1.98, 1.98, 0.18, M.dark, fx, y, fz, 20));
    // 【第三轮修正】直接还原的产物是**固态**海绵铁,不是铁水——原来那个
    // 出铁口+接料槽是高炉语汇,画错了。改成:热料卸料箱(900 °C 固体在发光)
    // + 封闭斜输送到炉后磁选(架构改判:磁选分金属,不分矿)
    box(1.0, 0.8, 0.5, M.dark, fx, 1.15, fz + 1.85);            // 卸料螺旋箱
    box(0.62, 0.42, 0.06, G.taph, fx, 1.15, fz + 2.12);         // 热海绵铁辉光口
    // 封闭输送桥:从卸料箱(-21.6, 1.15, -5.9)直上磁选撬给料口(-14.4, 2.6, 4.6)
    const cA = [fx + 0.4, 1.15, fz + 2.1], cB = [-14.4, 2.6, 4.6];
    slab(cA[0], cA[1], cA[2], cB[0], cB[1], cB[2], 0.85, 0.42, M.steel);
    // 检修天窗(证明里面是转的带)——沿桥等分三处
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      box(0.5, 0.1, 0.7, M.dark,
          cA[0] + (cB[0] - cA[0]) * t, cA[1] + (cB[1] - cA[1]) * t + 0.26,
          cA[2] + (cB[2] - cA[2]) * t);
    }
    // 桥下支撑排架 ×2
    [0.35, 0.7].forEach(t => {
      const px = cA[0] + (cB[0] - cA[0]) * t, py = cA[1] + (cB[1] - cA[1]) * t,
            pz = cA[2] + (cB[2] - cA[2]) * t;
      beam(px, 0, pz, px, py - 0.2, pz, 0.12, M.steel);
    });
    // 顶部煤气(H2/H2O)出管 → 冷凝器(卧罐) → 电解撬
    pipe(fx, 11.3, fz, fx + 4.6, 9.6, fz - 2.2, 0.28, M.pipeH2);
    const cond = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.6, 14), M.steel);
    cond.rotation.z = Math.PI / 2; cond.position.set(fx + 6.4, 2.2, fz - 2.6); group.add(cond);
    beam(fx + 5.2, 0, fz - 2.6, fx + 5.2, 1.6, fz - 2.6, 0.12, M.steel);
    beam(fx + 7.6, 0, fz - 2.6, fx + 7.6, 1.6, fz - 2.6, 0.12, M.steel);
    // 【账 12】ZnO 脱硫床:矿含 5.5 wt% SO3,炉气 H2S 约 660 ppm,而 SOEC 的
    // Ni 电极 ~1 ppm 即中毒 —— 脱硫床必须在冷凝器与电解撬之**前**
    const gx = fx + 4.6, gz = fz - 4.6;
    cyl(0.58, 0.58, 3.0, M.steel, gx, 1.9, gz, 14);
    cyl(0.66, 0.66, 0.16, M.dark, gx, 3.30, gz, 14);           // 顶法兰
    cyl(0.66, 0.66, 0.16, M.dark, gx, 0.50, gz, 14);           // 底法兰
    box(0.34, 0.9, 0.1, M.salt, gx + 0.6, 2.0, gz);            // 视窗:ZnO 床料
    pipe(fx + 4.6, 9.6, fz - 2.2, gx, 3.5, gz, 0.28, M.pipeH2);   // 炉气进床
    pipe(gx, 1.0, gz, fx + 6.4, 3.2, fz - 2.6, 0.28, M.pipeH2);   // 出床去冷凝器
    // H2S 出厂界短管(去 res-sulfur-01 的 Claus 段:对我们是毒,对邻厂是料)
    const M_H2S = new THREE.MeshLambertMaterial({ color: 0xc8b050 });
    pipe(gx - 0.6, 2.4, gz, gx - 3.2, 2.4, gz - 1.2, 0.11, M_H2S);
    pipe(gx - 3.2, 2.4, gz - 1.2, gx - 3.2, 0.7, gz - 1.2, 0.11, M_H2S);
    pipe(gx - 3.2, 0.7, gz - 1.2, gx - 3.2, 0.7, gz - 3.0, 0.11, M_H2S);
    cyl(0.2, 0.2, 0.1, M.steel, gx - 3.2, 0.7, gz - 3.0, 12).rotation.x = Math.PI / 2;
    beam(gx - 3.2, 0, gz - 2.6, gx - 3.2, 0.6, gz - 2.6, 0.1, M.steel);
    box(0.5, 0.35, 0.06, M.white, gx - 3.2, 1.25, gz - 3.0);   // 去向标识牌
    M.h2s = M_H2S;
    poi('poi_desulf', gx, 3.6, gz);
    // 电解撬块(SOEC:水回 H2+O2——账 2 的氧从这里出来)
    box(2.6, 1.8, 1.8, M.white, fx + 10.2, 0.95, fz - 2.6);
    box(2.7, 0.15, 1.9, M.dark, fx + 10.2, 1.93, fz - 2.6);
    pipe(fx + 7.9, 1.8, fz - 2.6, fx + 8.9, 1.4, fz - 2.6, 0.14, M.steel);   // 冷凝水→电解
    pipe(fx + 10.2, 2.0, fz - 2.6, fx + 10.2, 3.4, fz - 2.6, 0.1, M.pipeH2); // H2 回炉立管
    pipe(fx + 10.2, 3.4, fz - 2.6, fx + 0.9, 3.4, fz - 1.2, 0.1, M.pipeH2);
    // 料斗提升机:斜轨从地面料坑靠上炉肩(顶端搭在炉体上),料车 oscillator
    const skipG = new THREE.Group();
    skipG.position.set(fx + 5.6, 0.3, fz + 1.2);   // 基座在外,+0.3 斜轨最低角不埋地
    skipG.rotation.z = 0.62;                        // 局部 +Y 沿斜轨向上,倒向炉体
    group.add(skipG);
    box(0.9, 11.0, 0.28, M.steel, 0, 5.5, 0, skipG);            // 轨桥
    const skip = box(0.8, 0.9, 0.7, M.dark, 0, 5.5, 0.55, skipG);
    skip.name = 'skip_car';
    box(0.62, 0.22, 0.52, M.rust, 0, 0.5, 0, skip);   // 斗内精矿(随车升降)
    oscillators.push({ node: 'skip_car', prop: 'position', axis: 'y', amp: 4.4, period: 11 });
    // 轨桥中部支撑排架 + 底部受料坑
    beam(fx + 2.6, 0, fz + 0.4, fx + 3.3, 3.4, fz + 1.2, 0.12, M.steel);
    beam(fx + 2.6, 0, fz + 2.0, fx + 3.3, 3.4, fz + 1.2, 0.12, M.steel);
    box(1.3, 0.7, 1.1, M.dark, fx + 5.9, 0.35, fz + 1.2);
    // 桁架抱箍(炉体检修平台 + 斜撑)
    beam(fx - 2.6, 0, fz - 2.6, fx - 1.4, 6.4, fz - 1.4, 0.14, M.steel);
    beam(fx + 2.6, 0, fz - 2.6, fx + 1.4, 6.4, fz - 1.4, 0.14, M.steel);
    box(3.2, 0.12, 1.2, M.steel, fx, 6.5, fz - 1.9);
    rail(fx - 1.6, fz - 2.5, fx + 1.6, fz - 2.5);
    // 顶部红色信标(blink)
    cyl(0.09, 0.09, 0.3, beaconRed, fx, 11.55, fz, 8);
    poi('poi_furnace', fx, 6.5, fz);
    poi('poi_magsep', -22, 3.5, 8);
  }

  // =====================================================================
  // 3. FFC 熔盐电解棚(中后,x-2 z-12)——剖切露 4 槽电解阵
  // =====================================================================
  {
    const cx = -2, cz = -12, W = 14, H = 4.6, D = 7;
    // 开放壳体:背墙+侧墙+顶盖+开口边柱(开口朝 +Z)
    box(W, H, 0.3, M.white, cx, H / 2, cz - D / 2);
    box(0.3, H, D, M.white, cx - W / 2, H / 2, cz);
    box(0.3, H, D, M.white, cx + W / 2, H / 2, cz);
    box(W + 0.35, 0.3, D + 0.35, M.wDust, cx, H + 0.15, cz);
    box(W + 0.4, 0.25, D + 0.4, M.wDust, cx, 0.12, cz);         // 底裙边
    box(0.3, H, 0.3, M.white, cx - W / 2, H / 2, cz + D / 2);
    box(0.3, H, 0.3, M.white, cx + W / 2, H / 2, cz + D / 2);
    // 4 只电解槽:三只运行(盐面+辉光缝),四号检修态(盐已放空,
    // 阴极氧化物压块与惰性阳极板露出来——盐面之下不做黑盒,兼状态对照)
    for (let i = 0; i < 4; i++) {
      const ex = cx - 5.1 + i * 3.4;
      const maint = (i === 3);
      if (!maint) {
        box(2.6, 1.5, 3.2, M.steel, ex, 0.75, cz);
        box(2.3, 0.1, 2.9, M.salt, ex, 1.52, cz);
        box(2.0, 0.06, 0.5, G.melt, ex, 1.57, cz + 0.6);        // 辉光缝(靠开口侧)
      } else {
        // 检修槽:四壁+底,开口见内部
        box(2.6, 0.2, 3.2, M.steel, ex, 0.1, cz);
        box(0.15, 1.4, 3.2, M.steel, ex - 1.22, 0.9, cz);
        box(0.15, 1.4, 3.2, M.steel, ex + 1.22, 0.9, cz);
        box(2.6, 1.4, 0.15, M.steel, ex, 0.9, cz - 1.52);
        box(2.6, 1.4, 0.15, M.steel, ex, 0.9, cz + 1.52);
        box(1.2, 0.3, 0.9, M.dark, ex, 0.4, cz + 0.4);          // 阴极氧化物压块
        box(0.06, 0.9, 0.8, M.steel, ex - 0.6, 0.85, cz - 0.3); // 惰性阳极板 ×2
        box(0.06, 0.9, 0.8, M.steel, ex + 0.6, 0.85, cz - 0.3);
        const lid = box(3.0, 0.08, 2.4, M.wDust, ex + 0.1, 1.2, cz - 2.9);
        lid.rotation.x = -1.32;                                  // 盖板斜靠背墙(检修中)
      }
      // 阴极吊杆 ×2 + 上方母排
      box(0.12, 1.4, 0.12, M.dark, ex - 0.6, 2.3, cz);
      box(0.12, 1.4, 0.12, M.dark, ex + 0.6, 2.3, cz);
      box(0.5, 0.12, 0.5, M.copper, ex, 3.05, cz);
      // O2 集气罩短管(去汇管——惰性阳极,氧从这儿出)
      pipe(ex, 1.7, cz - 1.4, ex, 3.6, cz - 2.4, 0.09, M.pipeO2);
      // 槽前状态灯(运行绿 / 检修琥珀——矿场充电棚同一套色语)
      const lamp = maint
        ? new THREE.MeshLambertMaterial({ color: 0xffb020, emissive: 0xcc7700, emissiveIntensity: 0.9 })
        : G.lampG;
      box(0.1, 0.1, 0.06, lamp, ex + 1.1, 1.3, cz + 1.62);
    }
    // 母排干线(铜色)贯通 4 槽 + O2 汇管沿背墙
    box(11.5, 0.14, 0.3, M.copper, cx, 3.1, cz);
    pipe(cx - 5.1, 3.6, cz - 2.4, cx + 5.1, 3.6, cz - 2.4, 0.12, M.pipeO2);
    // 外墙导管 + 接线箱(工业细节语法)
    pipe(cx + W / 2 + 0.18, 0.3, cz + 1.5, cx + W / 2 + 0.18, 3.6, cz + 1.5, 0.06, M.dark);
    box(0.25, 0.5, 0.4, M.dark, cx + W / 2 + 0.2, 1.6, cz + 0.6);
    door(cx - W / 2 - 0.18, cz + 1.8, 3);
    // 屋顶排风机 + 背墙百叶箱(槽气抽排)
    box(1.1, 0.5, 1.1, M.steel, cx - 3.5, H + 0.55, cz);
    cyl(0.42, 0.42, 0.28, M.dark, cx - 3.5, H + 0.94, cz, 12);
    box(1.6, 1.0, 0.14, M.dark, cx + 3.0, 2.4, cz - D / 2 - 0.2);
    poi('poi_ffc', cx, 2.5, cz);
  }

  // =====================================================================
  // 4. 铸造坪(中前,x0 z+3)——感应炉 + 单轨浇包(oscillator)+ 锭模阵
  // =====================================================================
  {
    const px = 0, pz = 3;
    // 硬化坪
    box(15, 0.12, 9, M.wDust, px + 0.5, 0.06, pz + 1.5);
    // 感应熔炼炉:线圈环 ×4 + 炉口辉光(还原铁精料在此熔分)
    const ix = px - 5.4, iz = pz + 0.5;
    cyl(1.05, 1.2, 1.9, M.steel, ix, 0.95, iz, 16);
    [0.5, 0.95, 1.4].forEach(y => cyl(1.28, 1.28, 0.16, M.copper, ix, y, iz, 16));
    cyl(0.8, 0.8, 0.1, G.melt, ix, 1.95, iz, 16);               // 炉口熔池辉光
    box(1.6, 0.1, 1.6, M.dark, ix, 0.05, iz);
    // 倾炉液压柱 ×2
    beam(ix - 1.0, 0, iz + 1.0, ix - 0.5, 1.2, iz + 0.5, 0.1, M.orange);
    beam(ix + 1.0, 0, iz + 1.0, ix + 0.5, 1.2, iz + 0.5, 0.1, M.orange);
    // 浇注单轨:双立柱 + 工字梁,浇包小车沿 x 往复(炉→锭模)
    const my = 4.2;
    beam(ix, 0, iz - 1.6, ix, my, iz - 1.6, 0.18, M.steel);
    beam(px + 6.5, 0, iz - 1.6, px + 6.5, my, iz - 1.6, 0.18, M.steel);
    beam(ix - 0.6, my, iz - 1.6, px + 7.1, my, iz - 1.6, 0.22, M.orange);
    const trolley = new THREE.Group();
    trolley.name = 'ladle_trolley';
    trolley.position.set(px + 0.5, my - 0.15, iz - 1.6);
    group.add(trolley);
    box(0.6, 0.3, 0.5, M.dark, 0, 0, 0, trolley);
    beam(0, -0.15, 0, 0, -1.3, 0, 0.09, M.steel, trolley);
    const ladle = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.8, 14, 1, true),
      new THREE.MeshLambertMaterial({ color: 0x5a5148, side: THREE.DoubleSide }));
    ladle.position.set(0, -1.8, 0); trolley.add(ladle);
    const melt = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 14), G.melt);
    melt.position.set(0, -1.55, 0); trolley.add(melt);
    oscillators.push({ node: 'ladle_trolley', prop: 'position', axis: 'x', amp: 5.0, period: 16 });
    // 锭模阵 3×4(近端两只刚浇的亮着——状态对照)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const mx0 = px + 4.6 + c * 0.9, mz0 = iz - 0.4 + r * 1.0;
      box(0.7, 0.35, 0.8, M.dark, mx0, 0.28, mz0);
      box(0.5, 0.06, 0.6, (r === 0 && c < 2) ? G.ingot : M.steel, mx0, 0.49, mz0);
    }
    // 成品锭垛(冷锭,钢色)
    for (let i = 0; i < 6; i++)
      box(0.9, 0.22, 0.28, M.steel, px + 3.2 + (i % 2) * 0.0, 0.11 + Math.floor(i / 2) * 0.24,
          pz + 4.6 + (i % 2) * 0.34 - 0.17);
    rail(ix - 1.8, iz + 2.6, px + 7.2, iz + 2.6);
    poi('poi_cast', px + 0.5, 2.0, pz + 0.5);
  }

  // =====================================================================
  // 5. 机加工厂房(东,x+18 z-1)——剖切露车/铣/EBM 三机
  // =====================================================================
  {
    const cx = 18.5, cz = -1, W = 15, H = 5.2, D = 10;
    box(W, H, 0.3, M.white, cx, H / 2, cz - D / 2);
    box(0.3, H, D, M.white, cx - W / 2, H / 2, cz);
    box(0.3, H, D, M.white, cx + W / 2, H / 2, cz);
    box(W + 0.35, 0.3, D + 0.35, M.wDust, cx, H + 0.15, cz);
    box(W + 0.4, 0.25, D + 0.4, M.wDust, cx, 0.12, cz);
    box(0.3, H, 0.3, M.white, cx - W / 2, H / 2, cz + D / 2);
    box(0.3, H, 0.3, M.white, cx + W / 2, H / 2, cz + D / 2);
    // 背墙高窗带(夜光)
    for (let i = 0; i < 5; i++)
      box(2.0, 0.9, 0.08, win, cx - 5.6 + i * 2.8, 3.9, cz - D / 2 + 0.2);
    // --- 车床(西侧):床身+主轴箱+卡盘(spinner)+尾座+工件棒 ---
    const lx = cx - 4.8, lz = cz + 1.2;
    box(3.4, 0.5, 1.1, M.steel, lx, 0.85, lz);
    box(0.9, 1.1, 1.1, M.dark, lx - 1.5, 1.55, lz);
    const chuck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), M.dark);
    chuck.name = 'lathe_chuck';
    chuck.rotation.z = Math.PI / 2;
    chuck.position.set(lx - 0.9, 1.6, lz); group.add(chuck);
    spinners.push({ node: 'lathe_chuck', axis: 'y', rpm: 60 });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.4, 10), M.steel);
    bar.rotation.z = Math.PI / 2; bar.position.set(lx, 1.6, lz); group.add(bar);
    box(0.5, 0.8, 0.6, M.steel, lx + 1.3, 1.4, lz);
    box(0.35, 0.1, 0.9, M.orange, lx, 0.55, lz + 0.7);          // 踏板
    // --- 立式铣(中):底座+立柱+主轴头+工作台 ---
    const mx = cx + 0.6, mz = cz + 0.8;
    box(1.6, 0.6, 1.6, M.steel, mx, 0.3, mz);
    box(0.7, 2.6, 0.9, M.dark, mx, 1.9, mz - 0.5);
    box(1.9, 0.25, 1.0, M.steel, mx, 1.15, mz + 0.3);
    box(0.5, 0.9, 0.5, M.steel, mx, 2.4, mz + 0.15);
    cyl(0.1, 0.1, 0.5, M.dark, mx, 1.75, mz + 0.15, 10);
    // --- EBM 电子束打印(东):壳板围合+大观察窗开洞,窗内露粉床/半成件/束斑 ---
    const ex = cx + 5.0, ez = cz + 0.6;
    box(0.15, 2.6, 2.0, M.white, ex - 0.93, 1.3, ez);           // 左右壳板
    box(0.15, 2.6, 2.0, M.white, ex + 0.93, 1.3, ez);
    box(2.0, 0.15, 2.0, M.white, ex, 2.53, ez);                 // 顶/底
    box(2.0, 0.35, 2.0, M.dark, ex, 0.18, ez);
    box(2.0, 2.6, 0.15, M.white, ex, 1.3, ez - 0.93);           // 背板
    box(2.0, 0.75, 0.15, M.white, ex, 0.73, ez + 0.93);         // 前脸:窗下/窗上/窗侧
    box(2.0, 0.45, 0.15, M.white, ex, 2.23, ez + 0.93);
    box(0.35, 0.9, 0.15, M.white, ex - 0.83, 1.55, ez + 0.93);
    box(0.35, 0.9, 0.15, M.white, ex + 0.83, 1.55, ez + 0.93);
    box(1.35, 0.06, 0.9, M.salt, ex, 1.13, ez - 0.1);           // 粉床(钛粉浅色)
    box(0.5, 0.18, 0.5, M.steel, ex, 1.25, ez - 0.1);           // 半成件(阶梯)
    box(0.34, 0.14, 0.34, M.steel, ex, 1.41, ez - 0.1);
    box(0.05, 0.85, 0.05, G.ebm, ex, 1.95, ez - 0.1);           // 束斑柱(枪→件)
    box(1.32, 0.87, 0.02, new THREE.MeshLambertMaterial({
      color: 0x99ccff, transparent: true, opacity: 0.28 }), ex, 1.55, ez + 0.88); // 观察玻璃
    box(0.9, 0.7, 0.7, M.dark, ex + 1.5, 0.35, ez - 0.4);       // 真空泵撬
    pipe(ex + 1.0, 1.0, ez - 0.4, ex + 1.5, 0.75, ez - 0.4, 0.08, M.dark);
    cyl(0.28, 0.28, 0.8, M.steel, ex, 2.95, ez, 12);            // 电子枪塔
    // 料架(棒料/板料,门口)
    box(2.6, 0.12, 0.9, M.steel, cx - 4.2, 0.9, cz + 4.2);
    [[0, 0.14], [0.3, 0.14], [-0.3, 0.14]].forEach(([dz]) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 8), M.rust);
      b.rotation.z = Math.PI / 2; b.position.set(cx - 4.2, 1.05, cz + 4.2 + dz); group.add(b);
    });
    beam(cx - 5.3, 0, cz + 4.2, cx - 5.3, 0.9, cz + 4.2, 0.1, M.steel);
    beam(cx - 3.1, 0, cz + 4.2, cx - 3.1, 0.9, cz + 4.2, 0.1, M.steel);
    door(cx + W / 2 + 0.18, cz + 3.0, 1);
    // 外墙导管 + 接线箱
    pipe(cx - W / 2 - 0.18, 0.3, cz - 2.0, cx - W / 2 - 0.18, 3.8, cz - 2.0, 0.06, M.dark);
    box(0.25, 0.5, 0.4, M.dark, cx - W / 2 - 0.2, 1.5, cz - 1.2);
    // 屋顶风机 ×2 + 背墙百叶箱 ×2(排屑集尘风路,破背立面)
    [-3.5, 3.5].forEach(dx => {
      box(1.1, 0.5, 1.1, M.steel, cx + dx, H + 0.55, cz);
      cyl(0.42, 0.42, 0.28, M.dark, cx + dx, H + 0.94, cz, 12);
    });
    [-4.5, 1.5].forEach(dx =>
      box(1.6, 1.0, 0.14, M.dark, cx + dx, 2.6, cz - D / 2 - 0.2));
    poi('poi_machine', cx, 2.6, cz);
  }

  // =====================================================================
  // 5b. 炉后磁选撬(账 11 的架构改判:磁选分金属铁,不分矿)
  // =====================================================================
  {
    const sx = -14.2, sz = 6.4;
    box(3.2, 0.35, 2.4, M.wDust, sx, 0.18, sz);                 // 基础垫
    // 机架 + 磁鼓(spinner)+ 上方给料溜槽
    beam(sx - 1.4, 0.35, sz - 1.0, sx - 1.4, 2.2, sz - 1.0, 0.14, M.steel);
    beam(sx + 1.4, 0.35, sz - 1.0, sx + 1.4, 2.2, sz - 1.0, 0.14, M.steel);
    beam(sx - 1.4, 2.2, sz - 1.0, sx + 1.4, 2.2, sz - 1.0, 0.12, M.steel);
    const sep = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.9, 18), M.dark);
    sep.name = 'sep_drum';
    sep.rotation.z = Math.PI / 2;
    sep.position.set(sx, 1.55, sz);
    group.add(sep);
    spinners.push({ node: 'sep_drum', axis: 'y', rpm: 14 });
    box(2.2, 0.5, 1.1, M.steel, sx, 2.05, sz);                  // 上罩
    // 给料口:桥端 → 鼓上方
    slab(-14.4, 2.55, 4.6, sx - 0.1, 2.25, sz - 0.5, 0.7, 0.12, M.dark);
    // 两条产物溜槽,颜色 = 去向(同色因果链)
    // ① 金属铁精矿(钢色)→ 东南,落进料箱等装炉
    slab(sx + 0.55, 1.5, sz + 0.2, sx + 2.9, 0.75, sz - 1.0, 0.6, 0.12, M.steel);
    box(1.1, 0.7, 1.1, M.steel, sx + 3.3, 0.35, sz - 1.3);      // 精矿料箱
    box(0.86, 0.1, 0.86, G.ingot, sx + 3.3, 0.72, sz - 1.3);    // 箱内热料
    // ② 脱铁脉石(灰)→ 南,直通渣堆脚
    slab(sx - 0.55, 1.5, sz + 0.2, -13.7, 0.6, 11.0, 0.6, 0.12,
         new THREE.MeshLambertMaterial({ color: 0x8f8a80 }));
    // 【账 12/13】二段精选鼓:一段 75% 品位时夹带脉石带进 0.091 wt% 硫,
    // 只够灰铸铁;精选到 94% 才够球铁(0.0175%)。规格取整朝安全侧(反解值 93.2)。
    const c2x = sx + 0.3, c2z = sz + 2.6;
    box(2.0, 0.28, 1.6, M.wDust, c2x, 0.14, c2z);
    beam(c2x - 0.85, 0.28, c2z - 0.6, c2x - 0.85, 1.5, c2z - 0.6, 0.11, M.steel);
    beam(c2x + 0.85, 0.28, c2z - 0.6, c2x + 0.85, 1.5, c2z - 0.6, 0.11, M.steel);
    const sep2 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.3, 16), M.dark);
    sep2.name = 'sep_drum2';
    sep2.rotation.z = Math.PI / 2;
    sep2.position.set(c2x, 1.12, c2z);
    group.add(sep2);
    spinners.push({ node: 'sep_drum2', axis: 'y', rpm: 18 });
    box(1.5, 0.36, 0.8, M.steel, c2x, 1.46, c2z);              // 上罩
    slab(sx + 0.2, 1.35, sz + 0.6, c2x - 0.1, 1.55, c2z - 0.55, 0.5, 0.1, M.dark);
    // 精选后的洁净金属 → 料箱;中矿 → 并回脉石溜槽
    slab(c2x + 0.5, 1.05, c2z, sx + 3.0, 0.75, sz - 0.9, 0.5, 0.1, M.steel);
    slab(c2x - 0.5, 1.05, c2z + 0.2, sx - 0.3, 0.85, sz + 2.2, 0.4, 0.1,
         new THREE.MeshLambertMaterial({ color: 0x8f8a80 }));
    // 状态灯(两台各一)
    box(0.1, 0.1, 0.06, G.lampG, sx + 1.05, 1.2, sz + 1.22);
    box(0.1, 0.1, 0.06, G.lampG, c2x + 0.72, 1.1, c2z + 0.42);
    poi('poi_sep', sx, 2.4, sz);
  }

  // =====================================================================
  // 5c. 渗碳竖罐(账 9:海绵铁无碳不可铸,ISRU 甲烷渗碳并放氢回炉)
  // =====================================================================
  {
    const rx = -8.6, rz = 1.2;
    cyl(0.52, 0.6, 2.4, M.refrac, rx, 1.2, rz, 14);             // 罐体
    cyl(0.64, 0.64, 0.14, M.dark, rx, 0.55, rz, 14);
    cyl(0.64, 0.64, 0.14, M.dark, rx, 1.95, rz, 14);
    cyl(0.34, 0.34, 0.3, M.steel, rx, 2.55, rz, 12);            // 顶盖法兰
    box(0.36, 0.2, 0.12, G.taph, rx, 0.7, rz + 0.58);           // 出料口辉光
    // CH4 进气(棕黄)+ H2 出气(蓝灰,回竖炉循环)
    const M_CH4 = new THREE.MeshLambertMaterial({ color: 0xa8894a });
    pipe(rx - 2.6, 1.7, rz - 0.4, rx - 0.5, 1.7, rz - 0.4, 0.09, M_CH4);
    pipe(rx - 0.5, 1.7, rz - 0.4, rx - 0.5, 1.5, rz, 0.09, M_CH4);
    box(0.5, 0.6, 0.5, M.dark, rx - 3.0, 0.3, rz - 0.4);        // 计量撬
    pipe(rx, 2.7, rz, rx, 3.3, rz, 0.08, M.pipeH2);             // 放氢立管
    pipe(rx, 3.3, rz, -21.2, 3.3, rz, 0.08, M.pipeH2);          // west 回竖炉
    pipe(-21.2, 3.3, rz, -21.2, 3.4, -9.2, 0.08, M.pipeH2);
    M.ch4 = M_CH4;
  }

  // =====================================================================
  // 5d. 皮江法制镁卧罐 + 球化处理包(账 13:球铁的两件必需品都本地产)
  // =====================================================================
  {
    const px = -8.4, pz = 4.6;
    // 卧式还原罐(皮江法的标志形状)+ 加热套 + 罐口冷凝端 + 真空泵撬
    const retort = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 3.4, 14), M.refrac);
    retort.rotation.z = Math.PI / 2;
    retort.position.set(px, 1.15, pz);
    group.add(retort);
    box(2.2, 1.0, 1.0, M.wDust, px - 0.3, 1.15, pz);           // 加热套(炉膛)
    box(0.3, 0.5, 0.5, G.taph, px - 0.3, 0.55, pz + 0.52);     // 炉膛观察口辉光
    cyl(0.26, 0.26, 0.7, M.steel, px + 1.9, 1.15, pz, 12).rotation.z = Math.PI / 2;
    box(0.5, 0.5, 0.5, M.salt, px + 2.5, 1.15, pz);            // 冷凝端:镁晶体
    box(0.7, 0.5, 0.6, M.dark, px + 2.5, 0.3, pz - 0.9);       // 真空泵撬
    pipe(px + 2.5, 0.9, pz, px + 2.5, 0.55, pz - 0.9, 0.07, M.dark);
    beam(px - 1.2, 0, pz - 0.5, px - 1.2, 0.65, pz - 0.5, 0.11, M.steel);
    beam(px + 1.2, 0, pz - 0.5, px + 1.2, 0.65, pz - 0.5, 0.11, M.steel);
    // 进料:MgO/CaO 来自矿(锈红小斗),Si 来自 FFC 翼(浅色小斗)
    box(0.5, 0.5, 0.5, M.rust, px - 1.6, 0.9, pz + 0.7);
    box(0.4, 0.4, 0.4, M.salt, px - 1.6, 0.85, pz - 0.7);
    // 球化处理包(带钟罩压入法):加盖的小包 + 压杆
    const bx = -3.6, bz = 5.4;
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.36, 0.8, 14, 1, true),
      new THREE.MeshLambertMaterial({ color: 0x5a5148, side: THREE.DoubleSide }));
    bell.position.set(bx, 0.4, bz); group.add(bell);
    cyl(0.4, 0.4, 0.06, G.melt, bx, 0.66, bz, 14);             // 包内铁水
    box(1.0, 0.08, 1.0, M.dark, bx, 0.86, bz);                 // 处理盖
    beam(bx, 0.86, bz, bx, 2.1, bz, 0.09, M.steel);            // 压入杆
    box(0.34, 0.2, 0.34, M.dark, bx, 2.2, bz);
    box(0.1, 0.1, 0.06, G.lampG, bx + 0.55, 0.5, bz + 0.4);
  }

  // =====================================================================
  // 5e. 石灰煅烧窑(账 15:酸性渣吃不住硫 —— 熔剂不是可选项)
  // =====================================================================
  {
    const kx = -8.4, kz = -1.8;
    cyl(0.5, 0.62, 2.8, M.refrac, kx, 1.4, kz, 14);              // 立窑
    [0.75, 1.45, 2.15].forEach(y => cyl(0.68, 0.68, 0.1, M.dark, kx, y, kz, 14));
    box(0.34, 0.3, 0.1, G.taph, kx, 0.75, kz + 0.6);             // 出料口辉光
    cyl(0.2, 0.2, 0.5, M.steel, kx, 3.05, kz, 12);               // CO2 排气筒(排大气)
    // 碳酸盐进料斗(耶泽罗碳酸盐,矿场支线来)+ 生石灰料仓(白)
    const hop = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.26, 0.9, 4, 1, true),
      new THREE.MeshLambertMaterial({ color: 0x9a8f80, side: THREE.DoubleSide }));
    hop.rotation.y = Math.PI / 4; hop.position.set(kx, 3.4, kz); group.add(hop);
    box(0.7, 0.9, 0.7, M.white, kx + 1.5, 0.45, kz);             // 生石灰仓
    box(0.72, 0.1, 0.72, M.salt, kx + 1.5, 0.92, kz);            // 仓内石灰(白)
    slab(kx + 0.35, 0.8, kz + 0.3, kx + 1.4, 0.95, kz, 0.4, 0.1, M.steel);
    // 熔剂加料溜槽 → 感应炉(铸造坪 ix=-5.4, iz=4.0)
    slab(kx + 1.5, 0.9, kz + 0.35, -5.9, 1.9, 3.3, 0.36, 0.1, M.steel);
    box(0.1, 0.1, 0.06, G.lampG, kx + 0.62, 1.1, kz + 0.55);
  }

  // =====================================================================
  // 5f. 型砂间(账 16:CO2 硬化 + 预焙 + 回用;绿砂在这颗行星上不成立)
  // =====================================================================
  {
    const nx = 9.8, nz = 9.2;
    box(6.4, 0.16, 4.6, M.wDust, nx, 0.08, nz);                  // 硬化坪
    // 混砂机:碗 + 旋臂(spinner)
    cyl(1.05, 1.05, 0.75, M.steel, nx - 2.0, 0.55, nz + 1.0, 16);
    cyl(0.95, 0.95, 0.1, new THREE.MeshLambertMaterial({ color: 0x8d7f6c }),
        nx - 2.0, 0.95, nz + 1.0, 16);                            // 碗内砂
    const arm = new THREE.Group();
    arm.name = 'muller_arm';
    arm.position.set(nx - 2.0, 1.12, nz + 1.0);
    group.add(arm);
    box(1.7, 0.12, 0.14, M.dark, 0, 0, 0, arm);
    box(0.2, 0.3, 0.3, M.dark, 0.7, -0.16, 0, arm);
    box(0.2, 0.3, 0.3, M.dark, -0.7, -0.16, 0, arm);
    spinners.push({ node: 'muller_arm', axis: 'y', rpm: 22 });
    beam(nx - 2.0, 1.2, nz + 1.0, nx - 2.0, 1.85, nz + 1.0, 0.12, M.steel);
    // CO2 硬化台:平台 + 气瓶架三支(硬化气就是大气)
    box(2.0, 0.5, 1.6, M.steel, nx + 0.6, 0.35, nz + 1.1);
    box(1.5, 0.35, 1.1, new THREE.MeshLambertMaterial({ color: 0x8d7f6c }),
        nx + 0.6, 0.75, nz + 1.1);                                // 台上砂型
    box(0.6, 0.12, 0.5, M.dark, nx + 0.6, 0.95, nz + 1.1);        // 通气罩
    [-0.4, 0, 0.4].forEach((d, i) => {
      cyl(0.14, 0.14, 0.9, new THREE.MeshLambertMaterial({ color: 0x6a7a86 }),
          nx + 2.2, 0.55, nz + 1.4 + d, 10);
      box(0.1, 0.12, 0.1, M.dark, nx + 2.2, 1.06, nz + 1.4 + d);
    });
    box(0.9, 0.9, 0.12, M.steel, nx + 2.2, 0.55, nz + 2.1);       // 瓶架背板
    // 预焙炉:卧式短窑 + 炉口辉光(脱高氯酸盐,否则型腔放氧)
    const bake = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 2.2, 14), M.refrac);
    bake.rotation.z = Math.PI / 2;
    bake.position.set(nx - 0.4, 1.6, nz - 1.4);
    group.add(bake);
    box(0.3, 0.34, 0.1, G.taph, nx + 0.75, 1.6, nz - 1.4);
    beam(nx - 1.3, 0.16, nz - 1.4, nx - 1.3, 1.4, nz - 1.4, 0.12, M.steel);
    beam(nx + 0.5, 0.16, nz - 1.4, nx + 0.5, 1.4, nz - 1.4, 0.12, M.steel);
    pipe(nx - 1.5, 1.6, nz - 1.4, nx - 2.6, 1.6, nz - 1.4, 0.09, M.pipeO2);  // 焙烧放氧接氧网
    pipe(nx - 2.6, 1.6, nz - 1.4, nx - 2.6, 2.6, nz - 1.4, 0.09, M.pipeO2);
    // 旧砂回用斗(砂 90% 回用是水账成立的前提)
    box(1.3, 1.0, 1.3, M.dark, nx + 2.4, 0.5, nz - 1.5);
    box(1.32, 0.1, 1.32, new THREE.MeshLambertMaterial({ color: 0x7d6f5c }),
        nx + 2.4, 1.02, nz - 1.5);
    slab(nx + 1.8, 1.0, nz - 1.5, nx - 1.1, 1.35, nz + 1.0, 0.42, 0.1, M.dark);
    box(0.1, 0.1, 0.06, G.lampG, nx + 1.68, 0.7, nz + 1.1);
    poi('poi_sand', nx, 2.2, nz);
  }

  // =====================================================================
  // 6. 渣场(西南,x-13 z+13)——磁尾(锈红)+ 还原渣(灰)双堆,同色因果链
  // =====================================================================
  {
    makePile(-13.5, 13.5, 2.6, 1.7, 0x8a4a2a, 0x6e3a22, 0, 5);   // 磁尾 = 磁尾溜槽色
    makePile(-9.0, 14.2, 2.2, 1.4, 0x8f8a80, 0x6f6a62, 0, 4);    // 还原渣(贫铁硅酸盐)
    // 装车台肩 + 去打印机的转运标识桩
    box(2.2, 0.5, 1.4, M.wDust, -11.2, 0.25, 11.2);
    box(0.12, 1.3, 0.12, M.orange, -6.8, 0.65, 14.6);
    box(0.5, 0.35, 0.06, M.white, -6.8, 1.45, 14.6);
    // 【账 12 纠错】渣含 CaS/MgS(矿 5.5 wt% SO3 在氢气氛下被还原),遇水放 H2S
    // → 与 res-sulfur-01 尾料同规则:干态使用,远离水线与温室。黄黑警示桩两支。
    [[-11.6, 16.2], [-8.4, 16.6]].forEach(([wx, wz]) => {
      box(0.1, 1.15, 0.1, M.orange, wx, 0.58, wz);
      box(0.62, 0.42, 0.05, new THREE.MeshLambertMaterial({ color: 0xd8c24a }),
          wx, 1.28, wz);
      box(0.5, 0.1, 0.06, M.dark, wx, 1.28, wz + 0.03);
    });
  }

  // =====================================================================
  // 7. 氧气接出柜(北缘,x+3 z-17.5)——O2 汇管出厂界,朝 -Z 停在门口
  // =====================================================================
  {
    const ox = 3, oz = -17.2;
    box(1.8, 2.2, 1.1, M.white, ox, 1.1, oz);
    box(1.9, 0.15, 1.2, M.dark, ox, 2.27, oz);
    box(0.5, 0.7, 0.08, M.dark, ox - 0.4, 1.3, oz + 0.6);        // 仪表面板
    box(0.1, 0.1, 0.06, G.lampG, ox + 0.5, 1.7, oz + 0.58);      // 通气绿灯
    cyl(0.45, 0.45, 2.6, M.pipeO2, ox + 1.6, 1.3, oz, 14);       // 缓冲立罐
    cyl(0.47, 0.47, 0.12, M.steel, ox + 1.6, 2.62, oz, 14);
    // 来自 FFC 汇管与电解撬的两路进气(横平竖直,贴墙走管)
    pipe(3, 3.6, -14.4, 3, 3.6, oz + 0.2, 0.1, M.pipeO2);        // FFC 汇管穿背墙
    pipe(3, 3.6, oz + 0.2, 3, 2.2, oz + 0.2, 0.1, M.pipeO2);
    pipe(-11.8, 2.0, -10.6, -11.8, 2.6, -10.6, 0.09, M.pipeO2);  // 电解撬立管
    pipe(-11.8, 2.6, -10.6, -11.8, 2.6, -16.4, 0.09, M.pipeO2);  // 沿棚西侧向北
    pipe(-11.8, 2.6, -16.4, ox - 0.9, 2.6, -16.4, 0.09, M.pipeO2); // 向东贴棚背
    pipe(ox - 0.9, 2.6, -16.4, ox - 0.9, 1.6, oz + 0.4, 0.09, M.pipeO2);
    // 出厂界短管:法兰两片,停在门口(-Z 朝城网,总控走廊来接)
    pipe(ox, 0.6, oz - 0.6, ox, 0.6, oz - 2.6, 0.13, M.pipeO2);
    cyl(0.22, 0.22, 0.1, M.steel, ox, 0.6, oz - 2.6, 12).rotation.x = Math.PI / 2;
    beam(ox, 0, oz - 2.2, ox, 0.5, oz - 2.2, 0.1, M.steel);
    poi('poi_o2', ox, 1.8, oz);
    poi('poi_slag', -11.5, 1.5, 13.5);
  }

  // =====================================================================
  // 8. 控制间(东南角,x+16 z+9)——头条卡(备件覆盖率)锚在这
  // =====================================================================
  {
    const kx = 16, kz = 9.5;
    box(5.5, 2.9, 3.6, M.white, kx, 1.45, kz);
    box(5.8, 0.25, 3.9, M.wDust, kx, 2.95, kz);
    box(5.9, 0.2, 4.0, M.wDust, kx, 0.1, kz);
    for (let i = 0; i < 3; i++) box(1.1, 0.7, 0.08, win, kx - 1.6 + i * 1.6, 1.9, kz + 1.85);
    door(kx - 2.3, kz + 1.85, 0);
    cyl(0.04, 0.04, 1.6, M.dark, kx + 2.2, 3.85, kz - 1.2, 8);
    box(0.3, 0.2, 0.05, M.white, kx + 2.2, 4.5, kz - 1.2);
    poi('poi_control', kx, 2.0, kz);
  }

  // =====================================================================
  // 场地:车辙 + 散落砾石(作业痕迹)
  // =====================================================================
  {
    // 车辙两组:矿石进厂(西)/ 渣出厂(南)
    [[-27, 9, 0.0], [-27, 10.1, 0.0], [-14, 16.8, 0.35], [-13.1, 17.6, 0.35]].forEach(([x, z, ry]) => {
      const r = box(6.5, 0.03, 0.5, M.rust, x, 0.03, z);
      r.rotation.y = ry;
    });
    for (let i = 0; i < 22; i++) {
      const a = rnd() * 6.283, d = 12 + rnd() * 14;
      const s = 0.06 + rnd() * 0.09;
      const rock = new THREE.Mesh(rockGeo,
        new THREE.MeshLambertMaterial({ color: rnd() < 0.5 ? 0x8a5a3a : 0x6e4a30 }));
      rock.position.set(Math.cos(a) * d, -0.3 * s + 1.618 * s, Math.sin(a) * d * 0.62);
      rock.scale.set(s, s * (0.6 + rnd() * 0.4), s);
      rock.rotation.y = rnd() * 6.28;
      group.add(rock);
    }
  }

  // 尘膜 pass:涂装材质统一蒙一层火星尘
  const dust = new THREE.Color(0x9e5b3d);
  [M.steel, M.dark, M.white, M.wDust, M.orange, M.refrac, M.copper,
   M.pipeH2, M.pipeO2, M.salt, M.ch4, M.h2s].forEach(m => m && m.color.lerp(dust, 0.05));

  group.userData.spinners = spinners;
  group.userData.oscillators = oscillators;
  group.userData.nightMats = nightMats;
  group.userData.blinkMats = blinkMats;
  group.userData.lights = [
    { color: 0xffb060, pos: [0.5, 3.5, 3.5], range: 16 },      // 铸造坪暖光
  ];
  return group;
}
