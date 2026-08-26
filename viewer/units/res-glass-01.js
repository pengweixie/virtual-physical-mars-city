// res-glass-01 —— 玻璃厂(玄武岩纤维·铸石·浮法)
// 两条产线:黑色系(玄武岩直熔→CBF 纤维+岩棉+铸石板,150 kg/sol,物料 100% 本地)
// 透明系(三角洲硅层酸浸→钠钙窗玻璃,项目制战役,稳态 16 sol/火星年)。
// 设计册:E:\Claude\mars-glass(11 本账 / 72 闸)。契约:MODELS.md §4。
//
// 第二轮几何按账回填的五处:
//  ① 熔池缩到 1.2×0.7 m,墙厚 0.79 m 三层分色露出(账 8:炉子的体积大部分是保温不是玻璃)
//  ② 拉丝塔紧贴熔窑东侧(账 8:前炉共壳比加厚保温更省 4.2 kW)
//  ③ 漏板 29 孔 + 熔线抬 13 cm + 闭式 CO₂ 冷却气罩 + 排线器(账 9)
//  ④ 浮法出口在线热解镀膜段(账 10:火星低辐射率镀膜收益是地球的 14 倍)
//  ⑤ 硫基体拉挤筋线(账 11:补上第一轮悄悄假设的进口树脂)
export const meta = {
  id: 'res-glass-01',
  name: '玻璃厂(玄武岩纤维·铸石·浮法)',
  name_en: 'Glassworks (basalt fiber / cast stone / float line)',
  size_m: 48,
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();

  // ---------- 工具 ----------
  let _seed = 20260821;
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
    steel: new THREE.MeshLambertMaterial({ color: 0x8a8f96 }),
    steelDark: new THREE.MeshLambertMaterial({ color: 0x5a5e64 }),
    white: new THREE.MeshLambertMaterial({ color: 0xd8d4cc }),
  };
  M.whiteDust = new THREE.MeshLambertMaterial({ color: 0xcfc6b8 });
  M.dark = new THREE.MeshLambertMaterial({ color: 0x33363b });
  M.orange = new THREE.MeshLambertMaterial({ color: 0xd2691e });
  M.azs = new THREE.MeshLambertMaterial({ color: 0x6e4a3a });        // AZS 熔接触层(进口)
  M.ifb = new THREE.MeshLambertMaterial({ color: 0xd9c9a3 });        // 保温砖(进口)
  M.wool = new THREE.MeshLambertMaterial({ color: 0xb9b2a6 });       // 本厂岩棉(冷侧,自产)
  M.ore = new THREE.MeshLambertMaterial({ color: 0x9a5b38 });
  M.rejGrey = new THREE.MeshLambertMaterial({ color: 0x8e8578 });
  M.silica = new THREE.MeshLambertMaterial({ color: 0xd9cfc0 });
  M.castBlack = new THREE.MeshLambertMaterial({ color: 0x1d1f22 });
  M.bronze = new THREE.MeshLambertMaterial({ color: 0x8a6a3a });
  M.tin = new THREE.MeshLambertMaterial({ color: 0xc9ccd2, emissive: 0x30333a, emissiveIntensity: 0.25 });
  M.glass = new THREE.MeshLambertMaterial({ color: 0xbfe3dd, transparent: true, opacity: 0.28 });
  M.glassLowE = new THREE.MeshLambertMaterial({ color: 0x9fc8e8, transparent: true, opacity: 0.34 });
  M.meltGlow = new THREE.MeshLambertMaterial({ color: 0xff7518, emissive: 0xff5a00, emissiveIntensity: 1.0 });
  M.amberGlow = new THREE.MeshLambertMaterial({ color: 0xffb347, emissive: 0xff8c1a, emissiveIntensity: 0.8 });
  M.lehrGlow = new THREE.MeshLambertMaterial({ color: 0xff9a4d, emissive: 0xd94f00, emissiveIntensity: 0.55 });
  M.sulfur = new THREE.MeshLambertMaterial({ color: 0xe8c33a, emissive: 0x6a4c05, emissiveIntensity: 0.35 });
  M.bar = new THREE.MeshLambertMaterial({ color: 0x4a4230 });        // 硫基体纤维筋(暗黄褐)
  M.screen = new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x3fa7e0, emissiveIntensity: 0.8 });
  M.winGlow = new THREE.MeshLambertMaterial({ color: 0xffe2b0, emissive: 0xffc060, emissiveIntensity: 0.7 });
  M.beacon = new THREE.MeshLambertMaterial({ color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 1.0 });
  M.green = new THREE.MeshLambertMaterial({ color: 0x2f9e44, emissive: 0x1e7a30, emissiveIntensity: 0.5 });
  M.pipe = new THREE.MeshLambertMaterial({ color: 0x777d85 });
  M.gasBlue = new THREE.MeshLambertMaterial({ color: 0x3a6ea5 });
  M.co2 = new THREE.MeshLambertMaterial({ color: 0x6f8f7a });        // CO₂ 罩(本地气,绿灰)
  M.shroud = new THREE.MeshLambertMaterial({ color: 0x9aa6a0, transparent: true, opacity: 0.42 });
  M.glassSample = new THREE.MeshLambertMaterial({ color: 0xc8e6e0, transparent: true, opacity: 0.44 });
  M.glassSampleE = new THREE.MeshLambertMaterial({ color: 0x9fc8e8, transparent: true, opacity: 0.50 });

  const nightMats = [M.meltGlow, M.amberGlow, M.lehrGlow, M.screen, M.winGlow, M.green, M.sulfur];
  const blinkMats = [M.beacon];

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const cyl = (r1, r2, h, seg, mat, x, y, z, rx, rz, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (rz) m.rotation.z = rz;
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
  // 矩形环(用来把炉墙每一层的断面画成一圈可读的色带)
  const ring = (w, h, band, depth, mat, x, y, z, parent) => {
    box(w, band, depth, mat, x, y + h / 2 - band / 2, z, parent);
    box(w, band, depth, mat, x, y - h / 2 + band / 2, z, parent);
    box(band, h - band * 2, depth, mat, x - w / 2 + band / 2, y, z, parent);
    box(band, h - band * 2, depth, mat, x + w / 2 - band / 2, y, z, parent);
  };
  const rail = (x0, z0, x1, z1, parent) => {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz);
    const n = Math.max(2, Math.round(L / 1.4));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      box(0.07, 1.0, 0.07, M.orange, x0 + dx * t, 0.5, z0 + dz * t, parent);
    }
    beam(x0, 1.0, z0, x1, 1.0, z1, 0.07, M.orange, parent);
  };
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = name; a.position.set(x, y, z);
    group.add(a);
  };
  // 水平圆环(做框/口沿:环不是盘——盘会把里面的东西全遮住)
  const torus = (R, t, mat, x, y, z, seg) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, t, 5, seg || 22), mat);
    m.position.set(x, y, z); m.rotation.x = Math.PI / 2;
    group.add(m); return m;
  };
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const makePile = (x, z, r, h, hexA, hexB) => {
    const geo = new THREE.ConeGeometry(r, h, 24, 4);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(hexA), cB = new THREE.Color(hexB), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      let px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      if (Math.hypot(px, pz) > 0.05 && py < h / 2 - 0.05) {
        const k = 1 + (vnoise(px * 1.6 + x, py * 1.6, pz * 1.6 + z) - 0.5) * 0.17;
        px *= k; pz *= k; pos.setX(i, px); pos.setZ(i, pz);
      }
      const n = 0.6 * vnoise(px * 2.1 + x, py * 2.1, pz * 2.1 + z) + 0.4 * vnoise(px * 4.7, py * 4.7 + 5, pz * 4.7);
      tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n * 0.85 + 0.2 * (1 - (py + h / 2) / h))));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const pile = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    pile.position.set(x, 0.12 + h / 2, z);
    group.add(pile);
  };

  // ---------- 场坪 ----------
  const pad = box(47, 0.12, 27, M.whiteDust, 0, 0.06, 0);
  pad.material = new THREE.MeshLambertMaterial({ color: 0xb9a894 });
  box(9, 0.03, 0.5, M.steelDark, 20, 0.14, 8.6);
  box(9, 0.03, 0.5, M.steelDark, 20, 0.14, 10.1);
  for (let i = 0; i < 22; i++) {
    const s = 0.08 + rnd() * 0.1;
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.ore : M.steelDark);
    rock.position.set(-23 + rnd() * 46, 0.12 - 0.3 * s + 1.618 * s, -13 + rnd() * 26);
    rock.scale.set(s, s * 0.7, s);
    rock.rotation.y = rnd() * 6.28;
    group.add(rock);
  }

  // ---------- 1 原料斗 ----------
  const hopper = (x, z, fillMat, w) => {
    const g2 = new THREE.Group(); g2.position.set(x, 0, z); group.add(g2);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
      beam(sx * w * 0.55, 0.1, sz * w * 0.55, sx * w * 0.62, 3.2, sz * w * 0.62, 0.14, M.steel, g2);
    beam(-w * 0.55, 1.6, -w * 0.55, w * 0.55, 1.6, w * 0.55, 0.1, M.steel, g2);
    beam(-w * 0.55, 1.6, w * 0.55, w * 0.55, 1.6, -w * 0.55, 0.1, M.steel, g2);
    cyl(w * 0.72, 0.28, 1.7, 8, M.steel, 0, 3.0, 0, 0, 0, g2);
    box(w * 1.5, 0.16, w * 1.5, M.steel, 0, 3.95, 0, g2);
    const wall = 0.09;
    box(w * 1.5, 0.7, wall, M.steel, 0, 4.3, -w * 0.7, g2);
    box(w * 1.5, 0.7, wall, M.steel, 0, 4.3, w * 0.7, g2);
    box(wall, 0.7, w * 1.5, M.steel, -w * 0.7, 4.3, 0, g2);
    box(wall, 0.7, w * 1.5, M.steel, w * 0.7, 4.3, 0, g2);
    cyl(w * 0.62, w * 0.62, 0.28, 8, fillMat, 0, 4.55, 0, 0, 0, g2);
    cyl(0.02, w * 0.4, 0.5, 8, fillMat, 0, 4.9, 0, 0, 0, g2);
    cyl(0.24, 0.24, 1.2, 8, M.steelDark, 0, 1.6, 0, 0, 0, g2);
    return g2;
  };
  hopper(-21, -7, M.ore, 2.2);
  hopper(-17.2, -7, M.rejGrey, 2.2);
  hopper(-15.5, -11, M.silica, 1.4);
  makePile(-21.2, -11.5, 1.6, 1.1, 0x9a5b38, 0x6e4227);
  makePile(-18.4, -11.6, 1.4, 1.0, 0x8e8578, 0x6d6558);

  // ---------- 2 配合料预热塔(400 °C 排气段) ----------
  box(2.6, 6.2, 2.6, M.white, -12.6, 3.22, -8);
  box(2.9, 0.2, 2.9, M.whiteDust, -12.6, 6.4, -8);
  box(2.9, 0.5, 2.9, M.white, -12.6, 0.37, -8);
  cyl(0.16, 0.16, 3.0, 8, M.pipe, -11.9, 7.6, -8.6);
  box(0.5, 0.34, 0.4, M.steelDark, -12.0, 6.7, -8.6);
  box(0.9, 1.6, 0.07, M.winGlow, -12.6, 3.4, -6.68);
  box(1.06, 2.02, 0.07, M.orange, -13.4, 1.25, -6.66);
  box(0.9, 1.86, 0.09, M.whiteDust, -13.4, 1.25, -6.7);
  box(0.1, 0.26, 0.08, M.dark, -13.1, 1.24, -6.62);
  const belt = new THREE.Group(); belt.position.set(-15.5, 0, -7.4); group.add(belt);
  beam(-2.2, 4.4, -0.4, 2.4, 5.2, -0.6, 0.9, M.steel, belt);
  box(0.5, 0.06, 0.7, M.dark, 0, 5.35, -0.55, belt);
  cyl(0.2, 0.2, 3.0, 8, M.pipe, -10.6, 4.2, -7.7, 0, Math.PI / 2 - 0.4);

  /* ================= 3 连续电熔窑 =================
     账 8 的可视化:熔池只有 1.2 × 0.7 m,而墙厚 0.79 m——炉子的体积大部分是保温。
     朝 +Z 剖开,三层墙的断面画成三圈色带:
       外圈 灰白 = 本厂岩棉(自产,只能站 700 °C 以下的冷侧)
       中圈 米黄 = 保温砖(进口,承担 750 K 温降的主力)
       内圈 褐   = AZS 熔接触层(进口,0.15 m,8 火星年一代)
     炉体东端向 +X 伸出 0.8 m 前炉延伸段——与熔池共壳(账 8:比加厚保温省 4.2 kW)。 */
  const FX = -6.2, FZ = -7.6;
  const F = new THREE.Group(); F.position.set(FX, 0, FZ); group.add(F);
  const CH_X = 2.0, CH_Z = 0.7, CH_Y = 0.8;            // 内腔(熔池 1.2 + 前炉 0.8)
  const T_AZS = 0.15, T_IFB = 0.50, T_WOOL = 0.14;
  const oAZS = [CH_X + 2 * T_AZS, CH_Y + 2 * T_AZS, CH_Z + 2 * T_AZS];
  const oIFB = [oAZS[0] + 2 * T_IFB, oAZS[1] + 2 * T_IFB, oAZS[2] + 2 * T_IFB];
  const oW = [oIFB[0] + 2 * T_WOOL, oIFB[1] + 2 * T_WOOL, oIFB[2] + 2 * T_WOOL];
  const BY = 0.35 + oW[1] / 2;                          // 炉体中心高(坐 0.35 m 墩上)
  box(oW[0] + 0.5, 0.7, oW[2] + 0.5, M.steelDark, 0, 0.35, 0, F);        // 基墩
  // 三层壳:背/左/右/顶(+Z 敞开)
  const shell = (o, mat) => {
    const [w, h, d] = o;
    box(w, h, 0.14, mat, 0, BY, -d / 2 + 0.07, F);
    box(0.14, h, d, mat, -w / 2 + 0.07, BY, 0, F);
    box(0.14, h, d, mat, w / 2 - 0.07, BY, 0, F);
    box(w, 0.14, d, mat, 0, BY + h / 2 - 0.07, 0, F);
  };
  shell(oW, M.wool); shell(oIFB, M.ifb); shell(oAZS, M.azs);
  // 剖口断面色带(三圈,由外到内逐层收进)
  ring(oW[0], oW[1], T_WOOL, 0.12, M.wool, 0, BY, oW[2] / 2 - 0.06, F);
  ring(oIFB[0], oIFB[1], T_IFB, 0.12, M.ifb, 0, BY, oIFB[2] / 2 - 0.06, F);
  ring(oAZS[0], oAZS[1], T_AZS, 0.12, M.azs, 0, BY, oAZS[2] / 2 - 0.06, F);
  // 熔池:1.2 × 0.7,液面在内腔下部;前炉段熔线低 0.13 m(账 9 的头压)
  const BATH_Y = BY - CH_Y / 2 + 0.30;
  box(1.2, 0.34, CH_Z, M.meltGlow, -0.4, BATH_Y, 0, F);                  // 熔池(橙红)
  box(0.8, 0.30, CH_Z, M.meltGlow, 0.6, BATH_Y - 0.13, 0, F);            // 前炉段(低 13 cm)
  box(0.10, 0.20, CH_Z, M.azs, 0.18, BATH_Y - 0.02, 0, F);               // 池与前炉之间的挡砖
  // 三支钼电极
  for (let i = -1; i <= 1; i++) {
    cyl(0.05, 0.05, 0.62, 6, M.steelDark, -0.4 + i * 0.38, BATH_Y + 0.42, 0.0, 0, 0, F);
    box(0.16, 0.12, 0.16, M.steelDark, -0.4 + i * 0.38, BY + oAZS[1] / 2 - 0.1, 0.0, F);
  }
  // 尺度标注件:炉前站一只 0.5 m 检修凳(给"池小墙厚"一个参照)
  box(0.42, 0.45, 0.3, M.steelDark, -1.3, 0.34, oW[2] / 2 + 0.5, F);
  // 加料口与排气
  cyl(0.18, 0.18, 0.8, 8, M.steel, -1.4, BY + oW[1] / 2 + 0.4, -0.4, 0, 0, F);
  cyl(0.26, 0.26, 3.4, 10, M.steel, -1.4, BY + oW[1] / 2 + 2.0, -0.9, 0, 0, F);
  cyl(0.11, 0.11, 0.22, 8, M.beacon, -1.4, BY + oW[1] / 2 + 3.8, -0.9, 0, 0, F);
  cyl(0.05, 0.05, 2.2, 6, M.pipe, oW[0] / 2 + 0.12, BY, -0.5, 0, 0, F);
  box(0.2, 0.5, 0.4, M.dark, oW[0] / 2 + 0.16, BY - 0.9, -0.1, F);
  // 耐火砖备件垛(进口件,0.23 t/会合窗口)
  for (let i = 0; i < 6; i++)
    box(0.5, 0.16, 0.32, M.azs, FX - 2.9 + (i % 3) * 0.55, 0.2 + Math.floor(i / 3) * 0.17, FZ + 2.6);
  box(0.6, 0.05, 0.4, M.orange, FX - 2.35, 0.47, FZ + 2.6);
  poi('poi_melter', FX, BY + oW[1] / 2 + 0.6, FZ);

  /* ================= 4 拉丝塔(紧贴熔窑东侧) =================
     账 9:漏板挂在前炉东端,29 孔,熔线在其上 13 cm;
     纤维出孔后靠**闭式 CO₂ 气罩**冷却(火星没有免费空气,纯辐射要 1.5~5.9 m 塔)。 */
  const TX = FX + oW[0] / 2 + 0.55, TZ = FZ;
  const T = new THREE.Group(); T.position.set(TX, 0, TZ); group.add(T);
  const BUSH_Y = BY - CH_Y / 2 + 0.05;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    beam(sx * 0.85, 0.1, sz * 0.85, sx * 0.85, BUSH_Y + 0.7, sz * 0.85, 0.11, M.steel, T);
    beam(sx * 0.85, 0.9, sz * 0.85, sx * 0.3, 1.8, sz * 0.85, 0.07, M.steel, T);
  }
  beam(-0.85, BUSH_Y + 0.7, -0.85, 0.85, BUSH_Y + 0.7, -0.85, 0.08, M.steel, T);
  beam(-0.85, BUSH_Y + 0.7, 0.85, 0.85, BUSH_Y + 0.7, 0.85, 0.08, M.steel, T);
  box(0.72, 0.34, 0.5, M.azs, 0, BUSH_Y + 0.2, 0, T);                    // 漏板炉体(接前炉)
  box(0.62, 0.06, 0.4, M.amberGlow, 0, BUSH_Y, 0, T);                    // Pt/Rh 漏板底面
  // 29 孔阵列(账 9 定版孔数)
  const fibreMat = new THREE.MeshLambertMaterial({ color: 0xc7a15a, emissive: 0x40300e, emissiveIntensity: 0.35 });
  const tipRows = [10, 10, 9];
  let placed = 0;
  for (let r = 0; r < 3; r++) for (let i = 0; i < tipRows[r]; i++) {
    const fx = -0.26 + i * 0.058, fz = -0.11 + r * 0.11;
    cyl(0.008, 0.006, 0.05, 4, M.bronze, fx, BUSH_Y - 0.05, fz, 0, 0, T);
    if (placed % 2 === 0) beam(fx, BUSH_Y - 0.07, fz, 0, BUSH_Y - 0.95, 0.30, 0.012, fibreMat, T);
    placed++;
  }
  // 闭式 CO₂ 冷却气罩(账 9:25 mm 冷却段,气源=压缩火星大气)
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 12, 1, true), M.shroud);
  shroud.material.side = THREE.DoubleSide;
  shroud.position.set(0, BUSH_Y - 0.32, 0.06); T.add(shroud);
  box(0.42, 0.26, 0.3, M.co2, 0.58, BUSH_Y - 0.32, 0.06, T);             // 罩体循环风机
  beam(0.42, BUSH_Y - 0.32, 0.06, 0.2, BUSH_Y - 0.32, 0.06, 0.05, M.co2, T);
  // CO₂ 压缩撬(600 Pa → 50 kPa,取自火星大气,0.23 kWh/kg)
  const CO = new THREE.Group(); CO.position.set(TX + 1.5, 0, TZ + 1.6); group.add(CO);
  cyl(0.3, 0.3, 1.1, 10, M.co2, 0, 0.68, 0, 0, 0, CO);
  box(0.7, 0.4, 0.5, M.steelDark, 0, 0.2, 0, CO);
  cyl(0.1, 0.1, 0.7, 8, M.pipe, 0, 1.55, 0, 0, 0, CO);
  box(0.5, 0.5, 0.1, M.steel, 0.0, 1.0, -0.4, CO);                        // 进气过滤格栅
  beam(0, 1.0, 0.3, TX + 0.6 - (TX + 1.5), 1.0, TZ + 0.3 - (TZ + 1.6), 0.05, M.co2, CO);
  // 集束轮 + 上浆 + 双卷绕轮(282 rpm,账 9)+ 排线器
  cyl(0.08, 0.08, 0.4, 8, M.steelDark, 0, BUSH_Y - 1.0, 0.32, Math.PI / 2, 0, T);
  box(0.34, 0.22, 0.22, M.gasBlue, 0.42, BUSH_Y - 1.0, 0.32, T);
  const WY = 0.95, WZ = TZ + 1.9;
  box(2.1, 0.44, 1.0, M.steelDark, TX, 0.28, WZ);
  const mkWinder = (dx) => {
    const g2 = new THREE.Group(); g2.position.set(TX + dx, WY, WZ); group.add(g2);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.6, 14), M.bronze);
    drum.rotation.z = Math.PI / 2; g2.add(drum);
    box(0.64, 0.08, 0.08, M.dark, 0, 0, 0, g2);
    box(0.08, 0.64, 0.08, M.dark, 0, 0, 0, g2);
    return g2;
  };
  const wind1 = mkWinder(-0.6), wind2 = mkWinder(0.6);
  const traverse = new THREE.Group(); traverse.position.set(TX, WY + 0.52, WZ - 0.1); group.add(traverse);
  box(0.2, 0.09, 0.13, M.orange, 0, 0, 0, traverse);
  beam(TX - 1.0, WY + 0.52, WZ - 0.1, TX + 1.0, WY + 0.52, WZ - 0.1, 0.05, M.steel);
  beam(TX, BUSH_Y - 1.05, TZ + 0.4, TX - 0.6, WY + 0.38, WZ - 0.05, 0.014, fibreMat);
  beam(TX, BUSH_Y - 1.05, TZ + 0.4, TX + 0.6, WY + 0.38, WZ - 0.05, 0.014, fibreMat);
  poi('poi_fiber', TX, BUSH_Y + 1.2, TZ);

  /* ---- 防尘工棚(账 8:厂房不增压——它是防尘壳,不是压力容器) ----
     敞开式钢棚:柱 + 桁架屋面 + 迎风侧百叶挡尘墙,南侧全开。
     全厂唯一的增压体积在控制间那只气闸后面(见第 10 节)。 */
  // 棚南移让开熔窑剖口(窑露天排热、丝与筋在棚下防尘——两件设备的需求正好相反)
  const CAN_X0 = -5.4, CAN_X1 = 9.0, CAN_Z0 = -5.55, CAN_Z1 = -1.4, CAN_H = 4.6;
  const colX = [CAN_X0, -1.2, 3.0, CAN_X1];
  for (const cx of colX) for (const cz of [CAN_Z0, CAN_Z1]) {
    beam(cx, 0.1, cz, cx, CAN_H, cz, 0.16, M.steel);
    beam(cx, CAN_H - 1.1, cz, cx + (cx < 3 ? 0.9 : -0.9), CAN_H, cz, 0.08, M.steel);   // 角撑
  }
  for (const cz of [CAN_Z0, CAN_Z1]) {                       // 纵梁 + 格构腹杆
    beam(CAN_X0, CAN_H, cz, CAN_X1, CAN_H, cz, 0.16, M.steel);
    beam(CAN_X0, CAN_H - 0.55, cz, CAN_X1, CAN_H - 0.55, cz, 0.1, M.steel);
    for (let x = CAN_X0; x < CAN_X1 - 0.1; x += 1.6)
      beam(x, CAN_H - 0.55, cz, x + 1.6, CAN_H, cz, 0.07, M.steel);
  }
  for (let x = CAN_X0; x <= CAN_X1 + 0.01; x += 2.4) {       // 横梁 + 屋面板
    beam(x, CAN_H, CAN_Z0, x, CAN_H, CAN_Z1, 0.12, M.steel);
    box(2.35, 0.07, CAN_Z1 - CAN_Z0 - 0.1, M.whiteDust, x + 1.2, CAN_H + 0.11, (CAN_Z0 + CAN_Z1) / 2);
  }
  box(CAN_X1 - CAN_X0 + 0.5, 0.16, 0.28, M.orange, (CAN_X0 + CAN_X1) / 2, CAN_H + 0.22, CAN_Z0 - 0.1); // 檐口压条
  for (let x = CAN_X0 + 0.5; x < CAN_X1; x += 1.45)          // 迎风侧百叶挡尘墙(北)
    for (let k = 0; k < 3; k++) {
      const lv = box(1.3, 0.34, 0.06, M.steel, x + 0.6, 2.4 + k * 0.62, CAN_Z0 - 0.02);
      lv.rotation.x = -0.5;
    }
  box(0.9, 0.5, 0.06, M.orange, CAN_X1 - 1.0, 4.0, CAN_Z0 - 0.05);   // 棚号牌

  /* ================= 5 岩棉单元(同样紧贴熔窑,西侧) ================= */
  const WX = FX - oW[0] / 2 - 1.3;
  const W = new THREE.Group(); W.position.set(WX, 0, FZ); group.add(W);
  box(1.8, 2.0, 2.0, M.white, 0, 1.15, 0, W);
  box(2.05, 0.14, 2.25, M.whiteDust, 0, 2.22, 0, W);
  box(1.1, 1.0, 0.1, M.dark, 0, 1.2, 1.02, W);
  box(0.6, 0.22, 0.3, M.azs, 0.95, 1.55, 0, W);                          // 短流槽(接熔窑)
  box(0.5, 0.08, 0.22, M.meltGlow, 0.95, 1.62, 0, W);
  const woolWheel = new THREE.Group(); woolWheel.position.set(WX, 1.2, FZ + 0.9); group.add(woolWheel);
  const ww = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 12), M.steelDark);
  ww.rotation.x = Math.PI / 2; woolWheel.add(ww);
  box(0.62, 0.07, 0.05, M.orange, 0, 0, 0.1, woolWheel);
  cyl(0.12, 0.12, 1.6, 8, M.pipe, WX - 1.3, 1.0, FZ + 0.8, 0, Math.PI / 2 - 0.5);
  for (let i = 0; i < 4; i++)
    box(0.9, 0.7, 0.7, M.wool, WX - 2.4 - (i % 2) * 1.0, 0.47 + Math.floor(i / 2) * 0.75, FZ + 1.2);

  /* ================= 6 硫基体拉挤筋线(账 11 新增) =================
     纤维卷架 → 140 °C 液硫浸渍槽(琥珀)→ 成型模 → 牵引 → 定长切断 → 筋捆。
     这是第一轮那个洞的补丁:BFRP 的基体不是进口树脂,是硫厂的硫。 */
  const PX = 3.0, PZ = -3.6;
  const P = new THREE.Group(); P.position.set(PX, 0, PZ); group.add(P);
  box(8.4, 0.24, 1.4, M.steelDark, 0, 0.24, 0, P);                       // 机座
  // 纱架:立式 A 形架,9 只纱团(丝来自西侧卷绕轮)
  for (const sz of [-0.5, 0.5]) {
    beam(-3.9, 0.15, sz, -3.9, 2.3, sz, 0.1, M.steel, P);
    beam(-2.7, 0.15, sz, -2.7, 2.3, sz, 0.1, M.steel, P);
    beam(-3.9, 2.3, sz, -2.7, 2.3, sz, 0.09, M.steel, P);
    beam(-3.9, 1.2, sz, -2.7, 2.3, sz, 0.06, M.steel, P);
  }
  for (let i = 0; i < 9; i++)
    cyl(0.19, 0.19, 0.42, 10, M.bronze, -3.75 + (i % 3) * 0.5, 0.55 + Math.floor(i / 3) * 0.62, 0, Math.PI / 2, 0, P);
  for (let i = 0; i < 5; i++)                                            // 导丝梳 → 浸渍槽
    beam(-2.6, 1.55, -0.2 + i * 0.1, -1.5, 0.92, -0.16 + i * 0.08, 0.012, fibreMat, P);
  box(0.9, 0.08, 0.7, M.steel, -2.5, 1.62, 0, P);                        // 导丝梳板
  // 液硫浸渍槽(伴热,开口露琥珀液面)
  box(1.6, 0.5, 1.0, M.steel, -1.9, 0.6, 0, P);
  box(1.4, 0.08, 0.8, M.sulfur, -1.9, 0.83, 0, P);
  box(1.7, 0.08, 1.1, M.orange, -1.9, 0.34, 0, P);                       // 伴热带
  cyl(0.07, 0.07, 1.0, 6, M.pipe, -1.9, 1.3, -0.4, 0, 0, P);             // 硫供料(来自硫厂)
  box(0.3, 0.22, 0.26, M.dark, -1.9, 1.85, -0.4, P);
  // 成型模 + 牵引 + 切断
  box(0.5, 0.42, 0.42, M.steelDark, -0.5, 0.65, 0, P);
  box(0.34, 0.3, 0.3, M.amberGlow, -0.24, 0.65, 0, P);
  box(0.9, 0.36, 0.6, M.steel, 0.8, 0.62, 0, P);
  cyl(0.16, 0.16, 0.5, 10, M.steelDark, 0.8, 0.86, 0, Math.PI / 2, 0, P);
  box(0.5, 0.5, 0.5, M.steelDark, 2.1, 0.7, 0, P);
  box(0.1, 0.34, 0.34, M.orange, 2.36, 0.7, 0, P);
  // 出筋:三根连续筋 + 成捆成品 + 「此构件不得重熔」警示牌(账 11 的硬冲突)
  for (let i = -1; i <= 1; i++) cyl(0.05, 0.05, 2.6, 6, M.bar, 3.1, 0.66 + i * 0.09, i * 0.12, 0, Math.PI / 2, P);
  for (let i = 0; i < 3; i++) {
    const bundle = new THREE.Group(); bundle.position.set(PX + 3.9, 0.42 + i * 0.26, PZ - 0.35 + (i % 2) * 0.6);
    group.add(bundle);
    for (let j = 0; j < 4; j++) cyl(0.05, 0.05, 2.2, 6, M.bar, 0, j * 0.02, -0.16 + j * 0.105, 0, Math.PI / 2, bundle);
    box(0.1, 0.16, 0.5, M.orange, 0.6, 0.03, 0, bundle);
  }
  beam(PX + 3.9, 0.1, PZ + 1.0, PX + 3.9, 1.9, PZ + 1.0, 0.07, M.steel);
  box(0.75, 0.42, 0.05, M.orange, PX + 3.9, 2.0, PZ + 1.0);
  poi('poi_pultrude', PX - 1.9, 2.5, PZ);

  /* ================= 7 铸石线:浇包单轨 → 模排 → 批式析晶窑 =================
     账 8:析晶窑改批式(1.2×1.0×1.0 内腔),不是 8.4 m 隧道——120 kg/sol 装不满隧道。 */
  beam(FX + 1.2, 3.9, FZ + 1.6, FX + 1.2, 3.9, 3.4, 0.22, M.steel);
  beam(FX + 1.2, 3.9, 3.4, FX + 1.2, 0.9, 4.3, 0.16, M.steel);
  box(0.22, 0.8, 0.22, M.steel, FX + 1.2, 4.3, FZ + 1.8);
  const trolley = new THREE.Group(); trolley.position.set(FX + 1.2, 3.66, -1.0); group.add(trolley);
  box(0.46, 0.28, 0.62, M.steelDark, 0, 0, 0, trolley);
  cyl(0.3, 0.2, 0.58, 10, M.azs, 0, -0.7, 0, 0, 0, trolley);
  cyl(0.19, 0.19, 0.1, 8, M.meltGlow, 0, -0.45, 0, 0, 0, trolley);
  for (let i = 0; i < 4; i++) {
    box(1.05, 0.36, 0.76, M.steelDark, FX - 0.6 + i * 1.25, 0.4, 3.4);
    box(0.82, 0.09, 0.54, i === 0 ? M.meltGlow : M.castBlack, FX - 0.6 + i * 1.25, 0.58, 3.4);
  }
  // 批式析晶窑 + 装料车
  const CL = new THREE.Group(); CL.position.set(0.4, 0, 3.5); group.add(CL);
  box(2.2, 2.0, 2.0, M.ifb, 0, 1.15, 0, CL);
  box(2.5, 0.16, 2.3, M.whiteDust, 0, 2.23, 0, CL);
  box(2.4, 0.34, 2.2, M.wool, 0, 0.3, 0, CL);
  box(0.12, 1.2, 1.2, M.lehrGlow, -1.1, 1.05, 0, CL);                    // 炉门(开缝辉光)
  box(0.16, 1.5, 1.5, M.steelDark, -1.22, 1.15, 0, CL);
  cyl(0.08, 0.08, 0.6, 6, M.pipe, 0.6, 2.5, 0, 0, 0, CL);
  const car = new THREE.Group(); car.position.set(-2.6, 0, 3.5); group.add(car);
  box(1.3, 0.3, 1.2, M.steelDark, 0, 0.35, 0, car);
  for (let i = 0; i < 4; i++) box(1.1, 0.07, 0.9, M.castBlack, 0, 0.55 + i * 0.14, 0, car);
  for (const sx of [-0.5, 0.5]) for (const sz of [-0.45, 0.45]) cyl(0.1, 0.1, 0.08, 8, M.dark, sx, 0.12, sz, 0, Math.PI / 2, car);
  box(3.6, 0.06, 0.12, M.steelDark, -2.0, 0.14, 3.05);
  box(3.6, 0.06, 0.12, M.steelDark, -2.0, 0.14, 3.95);
  box(3.0, 0.2, 1.4, M.steelDark, 3.2, 0.6, 3.5);
  for (let i = 0; i < 5; i++) box(1.4, 0.09, 0.95, M.castBlack, 5.4, 0.2 + i * 0.11, 3.5);
  poi('poi_cast', 0.4, 2.6, 3.5);
  rail(-4.4, 5.0, 6.4, 5.0);

  /* ================= 8 透明线:酸浸撬 + 日池窑 + 浮法 + 镀膜 + 退火 ================= */
  const A = new THREE.Group(); A.position.set(14.6, 0, -8.6); group.add(A);
  cyl(0.8, 0.8, 2.2, 12, M.white, -1.6, 1.4, 0, 0, 0, A);
  cyl(0.8, 0.8, 2.2, 12, M.white, 0.4, 1.4, 0, 0, 0, A);
  cyl(0.5, 0.7, 4.6, 10, M.steel, 2.3, 2.5, 0, 0, 0, A);
  cyl(0.1, 0.1, 1.6, 6, M.pipe, 2.3, 5.5, 0, 0, 0, A);
  beam(-1.6, 2.6, 0, 2.3, 4.4, 0, 0.08, M.pipe, A);
  beam(0.4, 2.6, 0, 2.3, 4.0, 0, 0.08, M.pipe, A);
  box(1.2, 0.9, 0.9, M.silica, -0.6, 0.6, 1.5, A);
  poi('poi_clear', 14.6, 3.4, -8.6);
  const D = new THREE.Group(); D.position.set(9.8, 0, -1.6); group.add(D);
  box(2.2, 2.0, 2.2, M.ifb, 0, 1.12, 0, D);
  box(2.5, 0.16, 2.5, M.whiteDust, 0, 2.26, 0, D);
  box(2.4, 0.3, 2.4, M.wool, 0, 0.3, 0, D);
  box(0.7, 0.5, 0.1, M.meltGlow, 0, 1.35, 1.12, D);
  cyl(0.14, 0.14, 2.2, 8, M.steel, 0.8, 3.3, -0.6, 0, 0, D);
  const FB = new THREE.Group(); FB.position.set(14.9, 0, 0.6); group.add(FB);
  box(7.6, 1.0, 2.0, M.steel, 0, 0.62, 0, FB);
  box(7.9, 0.2, 2.3, M.steelDark, 0, 1.22, 0, FB);
  box(2.6, 0.26, 2.3, M.steelDark, -0.4, 1.5, 0, FB);
  box(2.2, 0.08, 1.5, M.tin, -0.4, 1.16, 0, FB);
  box(2.2, 0.05, 0.9, M.glass, -0.4, 1.22, 0, FB);
  box(0.6, 0.5, 0.5, M.steelDark, -3.9, 1.0, 0, FB);
  for (let i = 0; i < 3; i++) cyl(0.06, 0.06, 0.5, 6, M.pipe, -2.5 + i * 2.4, 1.6, 0.8, 0, 0, FB);
  poi('poi_float', 14.9, 1.9, 0.6);
  // 在线热解镀膜段(账 10):锡浴出口的镀膜罩 + 前驱体罐 + 排风
  const CT = new THREE.Group(); CT.position.set(18.9, 0, 0.6); group.add(CT);
  box(1.5, 0.7, 2.0, M.steelDark, 0, 1.35, 0, CT);                       // 镀膜罩
  box(1.2, 0.1, 1.4, M.glassLowE, 0, 1.02, 0, CT);                       // 罩下走的带(已镀,泛蓝)
  cyl(0.09, 0.09, 0.9, 8, M.pipe, -0.4, 2.1, 0, 0, 0, CT);
  cyl(0.09, 0.09, 0.9, 8, M.pipe, 0.4, 2.1, 0, 0, 0, CT);
  cyl(0.26, 0.26, 1.0, 10, M.tin, 1.25, 0.62, -0.8, 0, 0, CT);           // 锡前驱体罐
  cyl(0.2, 0.2, 0.9, 10, M.gasBlue, 1.25, 0.57, 0.3, 0, 0, CT);          // 氟源(来自 fab HF 中和支线)
  beam(1.25, 1.15, -0.8, 0.5, 1.5, -0.4, 0.05, M.pipe, CT);
  beam(1.25, 1.05, 0.3, 0.5, 1.5, 0.2, 0.05, M.pipe, CT);
  box(0.5, 0.34, 0.4, M.dark, -0.95, 0.5, 0.9, CT);
  poi('poi_coater', 18.9, 2.4, 0.6);
  /* 同压防尘罩(账 18):熔窑→锡浴→退火窑整条透明线路径都要罩起来同压吹扫,
     不能只密封锡浴本体——落在 1050 °C 玻璃带上的每一粒尘都是永久缺陷点。
     600 Pa 下这层罩几乎不花钱:同体积保护气只有地球的 1/166。 */
  const HD = new THREE.Group(); HD.position.set(14.2, 0, -0.4); group.add(HD);
  for (const sx of [-5.6, -1.9, 1.9, 5.6]) {            // 罩体立柱
    beam(sx, 0.15, -2.6, sx, 2.15, -2.6, 0.09, M.steel, HD);
    beam(sx, 0.15, 2.6, sx, 2.15, 2.6, 0.09, M.steel, HD);
  }
  for (const sz of [-2.6, 2.6]) {                        // 罩壁(半透,能看见里面的带)
    const w = box(11.6, 1.7, 0.05, M.shroud, 0, 1.15, sz, HD);
    w.material.side = THREE.DoubleSide;
  }
  box(11.8, 0.06, 5.3, M.shroud, 0, 2.02, 0, HD);        // 罩顶
  box(11.8, 0.14, 0.2, M.orange, 0, 2.12, -2.65, HD);    // 檐压条
  cyl(0.12, 0.12, 1.1, 8, M.gasBlue, -4.6, 2.6, -2.2, 0, 0, HD);   // 吹扫气支管
  cyl(0.12, 0.12, 1.1, 8, M.gasBlue, 1.6, 2.6, -2.2, 0, 0, HD);
  box(0.42, 0.3, 0.3, M.dark, 4.8, 1.7, -2.67, HD);      // 压差表盘
  box(0.3, 0.22, 0.04, M.screen, 4.8, 1.7, -2.83, HD);

  const GS = new THREE.Group(); GS.position.set(20.6, 0, -2.6); group.add(GS);
  for (let i = 0; i < 3; i++) {
    cyl(0.22, 0.22, 1.5, 10, M.gasBlue, -0.5 + i * 0.5, 0.9, 0, 0, 0, GS);
    cyl(0.14, 0.14, 0.2, 8, i === 2 ? M.beacon : M.steel, -0.5 + i * 0.5, 1.75, 0, 0, 0, GS);
  }
  box(1.9, 0.2, 0.8, M.steelDark, 0, 0.2, 0, GS);
  beam(20.0, 1.4, -2.4, 18.6, 1.4, 0.2, 0.06, M.pipe);
  const L = new THREE.Group(); L.position.set(14.2, 0, 4.8); group.add(L);
  box(6.0, 1.5, 1.9, M.ifb, 0, 1.07, 0, L);
  box(6.3, 0.14, 2.2, M.whiteDust, 0, 1.89, 0, L);
  box(6.2, 0.3, 2.1, M.wool, 0, 0.3, 0, L);
  box(0.1, 0.8, 1.1, M.lehrGlow, -2.96, 1.0, 0, L);
  box(0.1, 0.8, 1.1, M.dark, 2.96, 1.0, 0, L);
  for (let i = 0; i < 4; i++) box(0.28, 0.1, 2.24, M.steelDark, -2.1 + i * 1.4, 1.89, 0, L);
  box(1.4, 0.16, 3.2, M.steelDark, 18.2, 0.7, 2.8);
  // 光学件小退火炉(账 15:50 mm 坯 22 天,插在两场战役之间)
  const OA = new THREE.Group(); OA.position.set(11.0, 0, 7.6); group.add(OA);
  box(1.5, 1.3, 1.3, M.ifb, 0, 0.78, 0, OA);
  box(1.7, 0.12, 1.5, M.whiteDust, 0, 1.49, 0, OA);
  box(1.6, 0.26, 1.4, M.wool, 0, 0.22, 0, OA);
  box(0.09, 0.7, 0.7, M.lehrGlow, -0.76, 0.75, 0, OA);
  box(0.34, 0.24, 0.2, M.screen, 0.55, 1.15, 0.66, OA);
  for (let i = 0; i < 3; i++) cyl(0.11, 0.11, 0.05, 12, M.glassLowE, -0.35 + i * 0.35, 1.58, 0, 0, 0, OA);
  poi('poi_lehr', 14.2, 1.8, 4.8);

  /* ================= 9 成品架:黑板 / 透明板 / 镀膜板 / 球冠端窗 / 纤维卷 ================= */
  const rackA = (x, z, mats, tilt) => {
    const g2 = new THREE.Group(); g2.position.set(x, 0, z); group.add(g2);
    beam(-1.4, 0.1, 0, -0.2, 2.3, 0, 0.14, M.steel, g2);
    beam(1.4, 0.1, 0, 0.2, 2.3, 0, 0.14, M.steel, g2);
    beam(-1.4, 0.1, -1.2, -0.2, 2.3, -1.2, 0.14, M.steel, g2);
    beam(1.4, 0.1, -1.2, 0.2, 2.3, -1.2, 0.14, M.steel, g2);
    beam(-0.2, 2.3, 0.2, -0.2, 2.3, -1.4, 0.12, M.steel, g2);
    beam(0.2, 2.3, 0.2, 0.2, 2.3, -1.4, 0.12, M.steel, g2);
    for (let i = 0; i < mats.length; i++) {
      const p = box(0.06, 2.1, 1.15, mats[i], -0.75 + i * 0.14, 1.15, -0.6, g2);
      p.rotation.z = tilt;
    }
    return g2;
  };
  rackA(20.6, 8.0, [M.castBlack, M.castBlack, M.castBlack, M.castBlack], 0.42);
  rackA(20.6, 4.6, [M.glass, M.glass, M.glassLowE, M.glassLowE], 0.42);
  // 球冠端窗成品(账 3/7 的招牌:⌀3.1 m 球冠,一片成型)
  /* 窗组件样件(第三轮:账 12/13/14 三本账做成一件展品)
     双层球冠(每片 11.2 mm 各自独立承 70 kPa)+ 腔面镀膜与静电幕电极 +
     热断开框(账 12:真正的热断裂风险在框不在玻璃)+ 掀开的覆土窗盖(账 14)。*/
  const CAP_PHI = 0.66, CAP_X = 14.0, CAP_Z = 10.2;
  const mkCap = (R, mat, y) => {
    const g2 = new THREE.SphereGeometry(R, 18, 7, 0, Math.PI * 2, 0, CAP_PHI);
    g2.translate(0, -R * Math.cos(CAP_PHI), 0);
    const m = new THREE.Mesh(g2, mat);
    m.material.side = THREE.DoubleSide;
    m.position.set(CAP_X, y, CAP_Z);
    group.add(m);
    return m;
  };
  mkCap(2.50, M.glassSample, 0.78);                        // 外片(牺牲层,账 13)
  mkCap(2.42, M.glassSampleE, 0.62);                       // 内片(承压主片,腔面镀膜=泛蓝)
  torus(1.53, 0.055, M.dark, CAP_X, 0.72, CAP_Z);          // 间隔框(中空腔口沿)
  torus(1.60, 0.075, M.wool, CAP_X, 0.55, CAP_Z);          // **热断开框**(浅色=非金属)
  torus(1.68, 0.065, M.steelDark, CAP_X, 0.43, CAP_Z);     // 外框与托架接口
  for (let i = 0; i < 6; i++) {                            // 腔面静电幕电极(只在内区,细)
    const a2 = i * Math.PI / 6;
    beam(CAP_X + Math.cos(a2) * 0.95, 0.745, CAP_Z + Math.sin(a2) * 0.95,
         CAP_X - Math.cos(a2) * 0.95, 0.745, CAP_Z - Math.sin(a2) * 0.95, 0.009, M.bronze);
  }
  torus(0.95, 0.012, M.bronze, CAP_X, 0.745, CAP_Z, 16);
  box(0.26, 0.18, 0.14, M.dark, CAP_X + 1.72, 0.60, CAP_Z);  // 电极接线盒
  for (let i = 0; i < 4; i++) {                            // 托架腿
    const a3 = i * Math.PI / 2 + 0.4;
    beam(CAP_X + Math.cos(a3) * 1.5, 0.41, CAP_Z + Math.sin(a3) * 1.5,
         CAP_X + Math.cos(a3) * 1.5, 0.08, CAP_Z + Math.sin(a3) * 1.5, 0.085, M.steel);
  }
  // 覆土窗盖(账 14:绕框边铰链掀开 60° 展示;打印壳 + 风化层填料,~420 kg/扇)
  const lid = new THREE.Group();
  lid.position.set(CAP_X, 0.52, CAP_Z - 1.62);      // 铰链轴在框边
  lid.rotation.x = -1.05;
  group.add(lid);
  cyl(1.58, 1.58, 0.09, 20, M.whiteDust, 0, 1.62, 0.0, Math.PI / 2, 0, lid);
  cyl(1.50, 1.50, 0.28, 20, M.ore, 0, 1.62, -0.19, Math.PI / 2, 0, lid);   // 风化层填料
  cyl(1.58, 1.58, 0.07, 20, M.steelDark, 0, 1.62, -0.37, Math.PI / 2, 0, lid);
  for (let i = 0; i < 4; i++) {                                            // 盖面辐射肋
    const a4 = i * Math.PI / 4;
    beam(Math.cos(a4) * 1.4, 1.62 + Math.sin(a4) * 1.4, 0.07,
         -Math.cos(a4) * 1.4, 1.62 - Math.sin(a4) * 1.4, 0.07, 0.07, M.steelDark, lid);
  }
  box(0.46, 0.11, 0.11, M.orange, 0, 3.06, -0.18, lid);                    // 提手
  beam(CAP_X - 0.55, 0.52, CAP_Z - 1.62, CAP_X + 0.55, 0.52, CAP_Z - 1.62, 0.10, M.steel);  // 铰链轴
  box(0.62, 0.05, 0.42, M.orange, CAP_X - 1.9, 0.5, CAP_Z);              // 铭牌
  poi('poi_window', CAP_X, 2.0, CAP_Z);
  // 双层中空单元样件(两片 + 间隔条)
  box(0.05, 1.1, 0.9, M.glassLowE, 17.6, 0.75, 6.4);
  box(0.05, 1.1, 0.9, M.glass, 17.72, 0.75, 6.4);
  box(0.12, 0.06, 0.9, M.dark, 17.66, 1.27, 6.4);
  box(0.12, 0.06, 0.9, M.dark, 17.66, 0.23, 6.4);
  const SR = new THREE.Group(); SR.position.set(20.8, 0, -6.0); group.add(SR);
  for (const yy of [0.5, 1.3, 2.1]) box(2.6, 0.08, 1.0, M.steel, 0, yy, 0, SR);
  for (const sx of [-1.2, 1.2]) {
    beam(sx, 0.05, -0.45, sx, 2.4, -0.45, 0.09, M.steel, SR);
    beam(sx, 0.05, 0.45, sx, 2.4, 0.45, 0.09, M.steel, SR);
  }
  for (let i = 0; i < 9; i++)
    cyl(0.24, 0.24, 0.5, 10, M.bronze, -0.85 + (i % 3) * 0.85, 0.82 + Math.floor(i / 3) * 0.8, 0, Math.PI / 2, 0, SR);
  poi('poi_racks', 20.6, 2.6, 2.6);
  rail(18.9, 6.8, 18.9, 9.2);

  /* ================= 10 控制间 + 增压检修间(厂房不增压,账 8) ================= */
  const C = new THREE.Group(); C.position.set(-13.6, 0, 5.6); group.add(C);
  box(4.2, 2.9, 3.0, M.white, 0, 1.57, 0, C);
  box(4.5, 0.18, 3.3, M.whiteDust, 0, 3.1, 0, C);
  box(4.2, 0.4, 3.3, M.white, 0, 0.32, 0, C);
  box(1.06, 2.02, 0.07, M.orange, 1.1, 1.25, 1.54, C);
  box(0.9, 1.86, 0.09, M.whiteDust, 1.1, 1.25, 1.5, C);
  box(0.1, 0.26, 0.08, M.dark, 1.38, 1.24, 1.58, C);
  box(1.6, 0.9, 0.07, M.winGlow, -0.8, 1.9, 1.54, C);
  box(2.2, 1.2, 0.12, M.screen, 0, 2.0, -1.56, C);
  cyl(0.07, 0.07, 1.2, 6, M.steel, -1.9, 3.7, 0, 0, 0, C);
  cyl(0.09, 0.09, 0.16, 8, M.green, -1.9, 4.34, 0, 0, 0, C);
  cyl(0.09, 0.09, 0.16, 8, M.beacon, -1.9, 4.14, 0, 0, 0, C);
  // 气闸(全厂唯一的增压体积:控制间 + 检修间;车间本体是防尘壳)
  box(1.6, 2.4, 1.6, M.white, -2.6, 1.32, 1.0, C);
  box(1.75, 0.14, 1.75, M.whiteDust, -2.6, 2.56, 1.0, C);
  cyl(0.45, 0.45, 2.0, 12, M.steelDark, -2.6, 1.2, 2.0, 0, 0, C);
  box(0.5, 1.5, 0.08, M.winGlow, -2.6, 1.15, 2.47, C);
  box(0.7, 0.1, 0.5, M.orange, -2.6, 2.05, 2.0, C);
  poi('poi_control', -13.6, 2.8, 5.6);

  // ---------- 尘膜 pass ----------
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.whiteDust, M.steel, M.steelDark, M.orange, M.pipe, M.wool, M.silica,
   M.gasBlue, M.ifb, M.co2].forEach(m => m.color.lerp(dust, 0.05));

  // ---------- 声明 ----------
  group.userData.nightMats = nightMats;
  group.userData.blinkMats = blinkMats;
  // 卷绕轮 282 rpm = 账 9 的真实拉丝线速 12.4 m/s ÷ R 0.42 m(第一轮 25 rpm 慢了 11 倍)
  group.userData.spinners = [
    { node: wind1, axis: 'x', rpm: 282 },
    { node: wind2, axis: 'x', rpm: -282 },
    { node: woolWheel, axis: 'z', rpm: 40 },
  ];
  group.userData.oscillators = [
    { node: trolley, prop: 'position', axis: 'z', amp: 2.2, period: 12 },
    { node: traverse, prop: 'position', axis: 'x', amp: 0.35, period: 2.4 },
  ];
  group.userData.lights = [
    { color: 0xff7a30, pos: [FX, BY, FZ + 2.0], range: 16 },
    { color: 0xffb060, pos: [14.9, 2.2, 0.6], range: 12 },
  ];
  return group;
}
