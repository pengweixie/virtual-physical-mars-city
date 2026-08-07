// hab-village-01 —— 掩土居住舱村(地面过渡居住区)
// 契约(MODELS.md §4):1u=1m;原点=村心广场地面点;+Y 上;THREE 传入;纯色材质。
// 使命:密度资产 —— 一个母体 ×16 变体实例(标准/端头气闸/L 角舱/公共舱),
//   三排联排覆土舱 + 短廊网 + 村心广场,读作"一片聚落"不是拼色积木。
// 设计输入(mars-village design_accounts.json 五本账):
//   2 m 覆土 GCR 234→6.2 mSv/yr(38×) · 昼夜温波 2 m=55 皮肤深度全灭 ·
//   半圆柱膜应力 0.7 mm vs 方盒平板 53 mm(76×) · 覆土压重仅内压 17% ·
//   短廊并 16 舱为一个气压域(全村 2 气闸,互引 hab-tunnel gate 卡) ·
//   0.38 g 骑行 30 km/h 仅 31 W 但刹车距离 2.64×。
// 动画全声明式:nightMats(亮窗/广场灯/门灯) + blinkMats(公告屏) +
//   spinners(公共舱通风扇);不写 animate,无人物。

export const meta = {
  id: 'hab-village-01',
  name: '掩土居住舱村',
  name_en: 'Earth-Sheltered Hab Village',
  size_m: 71.5,            // validate 实测包围盒(x 71.53)
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];
  const blinkMats = [];

  /* ---------------- 确定性伪随机(禁 Math.random) ---------------- */
  const hash = (k) => { const s = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
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

  /* ---------------- 材质 ---------------- */
  // 舱壳 5 档色阶(±5% 明度,克制 —— 村子读作"一片")
  const hullMats = [];
  for (let i = 0; i < 5; i++) {
    const c = new THREE.Color(0xd6d1c6);
    c.offsetHSL(0, 0, (i - 2) * 0.025);
    hullMats.push(new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 }));
  }
  const M = {
    trim:    new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.55, metalness: 0.4 }),
    steel:   new THREE.MeshStandardMaterial({ color: 0x6a7076, roughness: 0.5, metalness: 0.6 }),
    corridor:new THREE.MeshStandardMaterial({ color: 0xbcb6a8, roughness: 0.7 }),
    orange:  new THREE.MeshStandardMaterial({ color: 0xe07020, roughness: 0.65 }),
    dark:    new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.7 }),
    concrete:new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.95 }),
    plazaA:  new THREE.MeshStandardMaterial({ color: 0xa5765a, roughness: 1.0 }),
    rock:    new THREE.MeshStandardMaterial({ color: 0x9e6b48, roughness: 1.0 }),
    track:   new THREE.MeshStandardMaterial({ color: 0x6e4a33, roughness: 1.0 }),
    berm:    new THREE.MeshLambertMaterial({ vertexColors: true }),
    plaza:   new THREE.MeshLambertMaterial({ vertexColors: true }),
    suit:    new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.6 }),
    suitOr:  new THREE.MeshStandardMaterial({ color: 0xd86a28, roughness: 0.6 }),
    green:   new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.8 }),
    soilBox: new THREE.MeshStandardMaterial({ color: 0x5a3d2a, roughness: 1.0 }),
    binBlue: new THREE.MeshStandardMaterial({ color: 0x3a6a9a, roughness: 0.7 }),
    binGrn:  new THREE.MeshStandardMaterial({ color: 0x4a8a4a, roughness: 0.7 }),
    flag:    new THREE.MeshStandardMaterial({ color: 0xc84b32, roughness: 0.8, side: THREE.DoubleSide }),
    bike:    new THREE.MeshStandardMaterial({ color: 0xb03a30, roughness: 0.5, metalness: 0.4 }),
    bike2:   new THREE.MeshStandardMaterial({ color: 0x3a6a9a, roughness: 0.5, metalness: 0.4 }),
    tire:    new THREE.MeshStandardMaterial({ color: 0x1c1e20, roughness: 0.9 }),
    pv:      new THREE.MeshStandardMaterial({ color: 0x1e2a44, roughness: 0.4, metalness: 0.3 }),
  };
  // 发光族
  const winLit  = new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffc37a, emissiveIntensity: 0.8, roughness: 0.5 });
  const winBig  = new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffd9a0, emissiveIntensity: 1.1, roughness: 0.5 });
  const winDim  = new THREE.MeshStandardMaterial({ color: 0x201a12, emissive: 0x6a5030, emissiveIntensity: 0.12, roughness: 0.5 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffd9a0, emissiveIntensity: 1.0, roughness: 0.5 });
  const porchMat = new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffc37a, emissiveIntensity: 0.6, roughness: 0.5 });
  const ledG    = new THREE.MeshStandardMaterial({ color: 0x061a0a, emissive: 0x3ee06a, emissiveIntensity: 1.6, roughness: 0.5 });
  // 底色亮青:引擎 blink 只调 color(×0.28 暗相),白天靠底色缓闪、夜里 emissive 托底
  const screenM = new THREE.MeshStandardMaterial({ color: 0x3f96aa, emissive: 0x4ac8e0, emissiveIntensity: 1.1, roughness: 0.5 });
  const signM   = new THREE.MeshStandardMaterial({ color: 0x201a12, emissive: 0xffb060, emissiveIntensity: 0.9, roughness: 0.5 });
  nightMats.push(winLit, winBig, lampMat, ledG, signM, porchMat);
  blinkMats.push(screenM);

  function box(parent, w, h, d, mat, x, y, z, ry = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  }
  function cyl(parent, r, h, mat, x, y, z, seg = 10, rz = 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, y, z);
    if (rz) m.rotation.z = rz;
    parent.add(m);
    return m;
  }

  /* ---------------- 共享几何(预算的关键:16 舱不重建) ---------------- */
  // 半圆柱壳:轴沿 Z、拱顶朝 +Y、底边贴 y=0
  const mkHalfShell = (r, len, seg) => {
    const g = new THREE.CylinderGeometry(r, r, len, seg, 1, true, 0, Math.PI);
    g.rotateX(Math.PI / 2);       // 轴 Y→Z,半拱在 +X 侧
    g.rotateZ(Math.PI / 2);       // +X 侧→+Y 侧(拱顶朝上)
    return g;
  };
  const geoHull  = mkHalfShell(2, 8, 14);
  const geoHullC = mkHalfShell(3, 10, 16);
  const geoCap   = new THREE.CircleGeometry(2, 14, 0, Math.PI);   // 半圆端盖(上半)
  const geoCapC  = new THREE.CircleGeometry(3, 16, 0, Math.PI);
  const geoWin   = new THREE.CircleGeometry(0.8, 12);
  const geoWinFrm= new THREE.CircleGeometry(0.92, 12);
  const geoWinC  = new THREE.CircleGeometry(1.55, 16);
  const geoWinCF = new THREE.CircleGeometry(1.7, 16);
  const rockGeo  = new THREE.DodecahedronGeometry(1, 0);

  // 覆土坡:单位半球 + 值噪声粗糙 + 双色顶点斑驳,两个噪声变体防复读
  const mkBerm = (seed) => {
    const g = new THREE.SphereGeometry(1, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(0xac7a58), cB = new THREE.Color(0x7d5843), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      let px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      if (py < 0.92) {                               // 保土脊顶,只糙坡面
        const k = 1 + (vnoise(px * 2.3 + seed, py * 2.3, pz * 2.3 + seed * 2) - 0.5) * 0.22;
        px *= k; pz *= k;
        pos.setX(i, px); pos.setZ(i, pz);
      }
      const n = 0.55 * vnoise(px * 2.6 + seed, py * 2.6, pz * 2.6) +
                0.45 * vnoise(px * 7.3, py * 7.3 + seed, pz * 7.3);
      tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n * 1.1 + 0.15 * (1 - py))));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  };
  const geoBermA = mkBerm(3.7), geoBermB = mkBerm(9.2);

  /* ==========================================================
   * 母体舱构建器:kind = 'std' | 'end' | 'commons'
   * 局部:原点=壳中心地面点,正面(端窗)朝 +Z,后端 -Z 接短廊。
   * stubLen = 后短廊长度(自壳后端 z=-L/2 起)。
   * ========================================================== */
  function buildCabin(kind, tint, seed, stubLen, lit) {
    const c = new THREE.Group();
    const big = kind === 'commons';
    const R = big ? 3 : 2, L = big ? 10 : 8;
    const hullMat = hullMats[tint];

    // 壳 + 端盖
    const hull = new THREE.Mesh(big ? geoHullC : geoHull, hullMat);
    c.add(hull);
    const capF = new THREE.Mesh(big ? geoCapC : geoCap, hullMat);
    capF.position.z = L / 2; c.add(capF);
    const capB = new THREE.Mesh(big ? geoCapC : geoCap, hullMat);
    capB.position.z = -L / 2; capB.rotation.y = Math.PI; c.add(capB);

    // 覆土坡(压在壳上,前端面从土里探出)
    const berm = new THREE.Mesh(seed % 2 ? geoBermA : geoBermB, M.berm);
    if (big) berm.scale.set(5.3, R + 0.95, L * 0.66);
    else berm.scale.set(3.8, R + 0.9, L * 0.7);
    berm.position.set(0, -0.18, -1.45);              // 后撤留一圈裸壳;多沉 0.18 吃地形起伏
    berm.rotation.y = (hash(seed * 7.7) - 0.5) * 0.24;
    c.add(berm);

    // 端窗(圆窗+深色框) —— 公共舱大端窗夜里最亮
    const wy = big ? 1.7 : 1.15;
    const frm = new THREE.Mesh(big ? geoWinCF : geoWinFrm, M.trim);
    frm.position.set(0, wy, L / 2 + 0.02); c.add(frm);
    const win = new THREE.Mesh(big ? geoWinC : geoWin, big ? winBig : (lit ? winLit : winDim));
    win.position.set(0, wy, L / 2 + 0.04); c.add(win);
    // 门廊套环(挡土立面):两立柱 + 门楣
    const pw = big ? 3.3 : 2.3;
    box(c, 0.24, big ? 3.1 : 2.15, 0.3, M.concrete, -pw / 2, (big ? 3.1 : 2.15) / 2, L / 2 + 0.05);
    box(c, 0.24, big ? 3.1 : 2.15, 0.3, M.concrete, pw / 2, (big ? 3.1 : 2.15) / 2, L / 2 + 0.05);
    box(c, pw + 0.24, 0.24, 0.3, M.concrete, 0, big ? 3.15 : 2.2, L / 2 + 0.05);
    // 外走线 + 接线箱(工业细节语法)
    cyl(c, 0.025, wy + 0.5, M.dark, pw / 2 - 0.35, (wy + 0.5) / 2, L / 2 + 0.12, 6);
    box(c, 0.18, 0.24, 0.12, M.steel, pw / 2 - 0.35, 0.42, L / 2 + 0.16);
    // 门廊小灯(共享 porchMat 进 nightMats:夜里每户门前一点暖光)
    box(c, 0.18, 0.06, 0.08, M.trim, 0, (big ? 3.02 : 2.07), L / 2 + 0.16);
    box(c, 0.14, 0.045, 0.05, porchMat, 0, (big ? 2.99 : 2.04), L / 2 + 0.19);
    // 通风竖管(掩土舱的呼吸口——覆土顶探出,打破土脊轮廓)
    if (!big) {
      const vx = 0.7, vz = -2.6;
      cyl(c, 0.11, 0.95, M.steel, vx, 2.72, vz, 10);
      box(c, 0.34, 0.1, 0.34, M.trim, vx, 3.26, vz);           // 防尘帽
      box(c, 0.26, 0.07, 0.26, M.dark, vx, 3.18, vz);          // 百叶缝
    }
    // 门前碎石垫(重复出现的"用过的场地")
    if (kind === 'std') box(c, 1.9, 0.09, 1.15, M.plazaA, 0.1, 0.045, L / 2 + 0.85);

    // 后短廊(2×2 方管钻出土坡接脊廊)
    if (stubLen > 0)
      box(c, 1.5, 2, stubLen + 0.3, M.corridor, 0, 1.0, -L / 2 - stubLen / 2 + 0.15);

    if (kind === 'end') {
      // 端头舱:前门斗气闸(全村仅两座 —— 气闸经济学的几何表达)
      box(c, 2.5, 2.5, 1.9, hullMat, 0, 1.25, L / 2 + 1.0);
      box(c, 2.7, 0.2, 2.1, M.trim, 0, 2.6, L / 2 + 1.0);       // 顶压条
      box(c, 2.7, 0.18, 2.1, M.trim, 0, 0.09, L / 2 + 1.0);     // 底裙边
      // 密封门语法:框+扇+闩+双铰链
      box(c, 1.14, 2.06, 0.08, M.orange, 0, 1.12, L / 2 + 1.97);
      box(c, 0.96, 1.9, 0.1, hullMats[4], 0, 1.12, L / 2 + 1.99);
      box(c, 0.1, 0.26, 0.09, M.dark, 0.34, 1.1, L / 2 + 2.05);
      box(c, 0.14, 0.1, 0.07, M.dark, -0.42, 1.7, L / 2 + 2.02);
      box(c, 0.14, 0.1, 0.07, M.dark, -0.42, 0.55, L / 2 + 2.02);
      box(c, 0.09, 0.09, 0.05, ledG, 0.42, 2.05, L / 2 + 1.99); // 气闸状态灯
      box(c, 1.6, 0.12, 0.9, M.concrete, 0, 0.06, L / 2 + 2.45); // 门口踏板
      // 门口储物箱
      box(c, 0.7, 0.55, 0.5, M.steel, 1.7, 0.275, L / 2 + 1.6, 0.2);
    }
    if (kind === 'commons') {
      // 公共舱:通风扇(spinner) + 屋顶排风帽
      cyl(c, 0.34, 0.5, M.steel, 1.8, R + 0.78, -2.2, 10);
      const fan = new THREE.Group();
      fan.name = 'fan_commons';
      fan.position.set(1.8, R + 1.08, -2.2);
      for (let i = 0; i < 3; i++)
        box(fan, 0.56, 0.04, 0.13, M.dark, 0, 0, 0, i * Math.PI / 3);
      c.add(fan);
      cyl(c, 0.06, 0.5, M.steel, 1.8, R + 1.16, -2.2, 6);
      box(c, 0.9, 0.06, 0.9, M.steel, 1.8, R + 1.4, -2.2);      // 雨帽(防尘帽)
      // 通信桅(UHF 上行 com-station,村对外的天线)
      cyl(c, 0.04, 2.0, M.steel, -1.8, R + 1.7, -3.0, 8);
      box(c, 0.5, 0.05, 0.05, M.dark, -1.8, R + 2.55, -3.0);    // 横臂
      box(c, 0.3, 0.3, 0.07, M.steel, -1.65, R + 2.4, -3.0, 0.5); // 小碟
      cyl(c, 0.02, 2.4, M.dark, -1.72, R + 0.7, -2.95, 5);      // 馈线下行
      // 门口长凳
      box(c, 1.6, 0.12, 0.42, M.steel, -2.3, 0.36, L / 2 + 0.7);
      box(c, 0.12, 0.3, 0.36, M.trim, -2.9, 0.15, L / 2 + 0.7);
      box(c, 0.12, 0.3, 0.36, M.trim, -1.7, 0.15, L / 2 + 0.7);
    }
    return c;
  }

  /* ==========================================================
   * L 形角舱(东北角,连接 A 排与 C 排):双壳共土
   * ========================================================== */
  function buildCorner(tint) {
    const c = new THREE.Group();                    // 原点=角点 (21.5,-16)
    const h1 = new THREE.Mesh(geoHull, hullMats[tint]);
    h1.position.set(-2.5, 0, 1.5); c.add(h1);      // 臂 1 沿 z,前端朝 +Z
    const cap1 = new THREE.Mesh(geoCap, hullMats[tint]);
    cap1.position.set(-2.5, 0, 5.5); c.add(cap1);
    const h2 = new THREE.Mesh(geoHull, hullMats[(tint + 2) % 5]);
    h2.rotation.y = Math.PI / 2;
    h2.position.set(2.5, 0, -1.0); c.add(h2);      // 臂 2 沿 x,前端朝 +X
    const cap2 = new THREE.Mesh(geoCap, hullMats[(tint + 2) % 5]);
    cap2.rotation.y = Math.PI / 2;
    cap2.position.set(6.5, 0, -1.0); c.add(cap2);
    // 角部大土坡盖住双壳后身
    const berm = new THREE.Mesh(geoBermB, M.berm);
    berm.scale.set(6.4, 3.05, 5.6);
    berm.position.set(-0.6, -0.06, -1.2);
    c.add(berm);
    // 臂 1 前端面:窗+套环(朝广场);臂 2 东端面只出廊管(不开窗)
    {
      const fw = new THREE.Group();
      fw.position.set(-2.5, 0, 5.5);
      const frm = new THREE.Mesh(geoWinFrm, M.trim); frm.position.set(0, 1.15, 0.02); fw.add(frm);
      const win = new THREE.Mesh(geoWin, winDim); win.position.set(0, 1.15, 0.04); fw.add(win);
      box(fw, 0.24, 2.15, 0.3, M.concrete, -1.15, 1.075, 0.05);
      box(fw, 0.24, 2.15, 0.3, M.concrete, 1.15, 1.075, 0.05);
      box(fw, 2.54, 0.24, 0.3, M.concrete, 0, 2.2, 0.05);
      c.add(fw);
    }
    box(c, 0.3, 2.3, 1.9, M.concrete, 6.6, 1.15, -1.0);  // 臂 2 端墙压条(廊管从中穿出)
    // 角坡通风竖管
    cyl(c, 0.11, 0.95, M.steel, 0.4, 2.95, -2.4, 10);
    box(c, 0.34, 0.1, 0.34, M.trim, 0.4, 3.49, -2.4);
    box(c, 0.26, 0.07, 0.26, M.dark, 0.4, 3.41, -2.4);
    // 臂 2 后端(西)钻进土里,臂 1 后端接 A 脊廊短管
    box(c, 1.5, 2, 3.2, M.corridor, -2.5, 1.0, -4.4);
    box(c, 1.5, 2, 4.4, M.corridor, 9.2, 1.0, -1.0, Math.PI / 2);  // 东臂接 C 脊
    return c;
  }

  /* ==========================================================
   * 三排布点(错半节距;jitter=聚落感,军营式正交是反面教材)
   * ========================================================== */
  const cabins = [];   // {kind,x,z,ry,tint,lit}
  const P = 7;         // 节距:覆土坡相接成连续土脊
  // A 排(北,面朝广场 +Z→局部 ry=0),脊廊 z=-22
  cabins.push({ kind: 'end', x: -24.5, z: -14, ry: 0, tint: 1, lit: false, stub: 4 });
  [-17.5, -10.5, -3.5, 3.5, 10.5].forEach((x, i) =>
    cabins.push({ kind: 'std', x, z: -14, ry: 0, tint: (i * 2 + 1) % 5, lit: i === 1 || i === 4, stub: 4 }));
  // B 排(南,面朝广场 -Z→ry=π),错半节距,脊廊 z=+22
  cabins.push({ kind: 'end', x: -28, z: 14, ry: Math.PI, tint: 3, lit: false, stub: 4 });
  [-21, -14, -7].forEach((x, i) =>
    cabins.push({ kind: 'std', x, z: 14, ry: Math.PI, tint: (i * 3 + 2) % 5, lit: i === 1, stub: 4 }));
  cabins.push({ kind: 'commons', x: 1.5, z: 14, ry: Math.PI, tint: 2, lit: true, stub: 4 });
  cabins.push({ kind: 'std', x: 9.5, z: 14, ry: Math.PI, tint: 0, lit: false, stub: 4 });
  // C 排(东,面朝广场 -X→ry=-π/2),脊廊 x=+32.5
  [-4, 3, 10].forEach((z, i) =>
    cabins.push({ kind: 'std', x: 24.5, z, ry: -Math.PI / 2, tint: (i * 2 + 3) % 5, lit: i === 0, stub: 4 }));

  let poiHullRef = null, poiEndRef = null, poiCommonsRef = null;
  cabins.forEach((cb, i) => {
    const jit = (hash(i * 17.3) - 0.5) * 1.6;          // 轴向 ±0.8
    const jry = (hash(i * 31.7) - 0.5) * 0.1;          // 偏航 ±3°
    const c = buildCabin(cb.kind, cb.tint, i + 1, cb.stub, cb.lit);
    const alongZ = Math.abs(Math.sin(cb.ry)) < 0.5;    // ry≈0/π→轴沿 z
    // jitter 主沿舱轴 ±0.8(错落),排向 ±0.32(节距基本守住)
    c.position.set(alongZ ? cb.x + jit * 0.4 : cb.x + jit, 0,
      alongZ ? cb.z + jit : cb.z + jit * 0.4);
    c.rotation.y = cb.ry + jry;
    group.add(c);
    if (cb.kind === 'std' && !poiHullRef) poiHullRef = c;
    if (cb.kind === 'end' && !poiEndRef) poiEndRef = c;
    if (cb.kind === 'commons') poiCommonsRef = c;
  });
  const corner = buildCorner(4);
  corner.position.set(21.5, 0, -15.5);
  group.add(corner);

  /* ==========================================================
   * 脊廊网(2×2 方管):A z=-22 · B z=+22 · C x=+30.5 · 东南肘管
   * 西侧不设廊 = 村口(朝 hub 来向敞开)
   * ========================================================== */
  const tube = (x1, z1, x2, z2) => {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
    box(group, 2, 2, len + 2, M.corridor, (x1 + x2) / 2, 1.0, (z1 + z2) / 2, Math.atan2(dx, dz));
    // 基裙(埋进地形,吃东侧 ~0.5 m 起伏,防悬空缝)
    box(group, 1.7, 0.9, len + 1.6, M.concrete, (x1 + x2) / 2, -0.3, (z1 + z2) / 2, Math.atan2(dx, dz));
    // 分段密封环(每 ~6 m 一道,同色系浅箍,别抢戏)
    const n = Math.floor(len / 6);
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1);
      box(group, 2.12, 2.12, 0.22, M.steel, x1 + dx * t, 1.0, z1 + dz * t, Math.atan2(dx, dz));
    }
  };
  tube(-26, -22, 19, -22);        // A 脊
  tube(-30, 22, 13, 22);          // B 脊
  tube(32.5, -16.5, 32.5, 21.5);  // C 脊
  tube(13, 22, 31.5, 22);         // 东南肘管(B 脊 ↔ C 脊)
  // 端头堵板 + 廊窗点缀
  for (const [x, z, ry] of [[-26, -22, Math.PI / 2], [-30, 22, Math.PI / 2], [32.5, -17.2, 0]])
    box(group, 2.1, 2.1, 0.2, M.trim, x, 1.0, z, ry);
  for (const [x, z] of [[-8, -22], [4, -22], [-16, 22], [7.5, 22]])
    box(group, 0.9, 0.5, 0.06, winDim, x, 1.3, z + (z > 0 ? 1.05 : -1.05));

  /* ==========================================================
   * 村心广场(r≈8):压实土坪 + 旗杆 + 公告屏 + 长椅 + 物资 + 灯杆
   * ========================================================== */
  // 广场 = 平整夯筑高台(顶面 y=0.55,压住地形起伏)
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(8.25, 8.6, 1.15, 28), M.concrete);
  plinth.position.y = 0.55 - 1.15 / 2 + 0.001;
  group.add(plinth);
  const PY = 0.55;                                   // 广场顶面高
  const plazaGeo = new THREE.CircleGeometry(8, 28);
  {
    const pos = plazaGeo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(0xa5765a), cB = new THREE.Color(0x8a5f47), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), py = pos.getY(i);
      const n = 0.55 * vnoise(px * 0.5, py * 0.5, 7) + 0.45 * vnoise(px * 2.2, py * 2.2, 3);
      tmp.copy(cA).lerp(cB, n);
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    plazaGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const plaza = new THREE.Mesh(plazaGeo, M.plaza);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = PY + 0.01;
  group.add(plaza);
  // 场界石(压边)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.1;
    box(group, 0.5, 0.14, 0.24, M.concrete, Math.cos(a) * 8.05, PY + 0.07, Math.sin(a) * 8.05, -a);
  }
  // 广场台阶(朝西村口 + 朝各排三向)
  for (const a of [Math.PI, 0.1, -Math.PI / 2 + 0.2, Math.PI / 2 - 0.2]) {
    box(group, 2.4, 0.18, 1.1, M.concrete, Math.cos(a) * 8.9, 0.36, Math.sin(a) * 8.9, -a);
    box(group, 2.4, 0.18, 1.0, M.concrete, Math.cos(a) * 9.5, 0.14, Math.sin(a) * 9.5, -a);
  }
  // 旗杆 + 旗(oscillator 慢摆——稀薄大气里的低频摇曳)
  box(group, 0.7, 0.25, 0.7, M.concrete, 0, PY + 0.125, 0);
  cyl(group, 0.05, 7, M.steel, 0, PY + 3.5, 0, 8);
  {
    const fp = new THREE.Group();
    fp.name = 'flag_main';
    fp.position.set(0, PY + 6.35, 0);
    box(fp, 1.15, 0.72, 0.03, M.flag, 0.6, 0, 0);
    group.add(fp);
  }
  // 公告屏(blinkMats 缓闪,朝南广场面)
  {
    const g2 = new THREE.Group(); g2.position.set(-2.2, PY, -7.4);
    box(g2, 0.14, 2.3, 0.14, M.steel, -0.75, 1.15, 0);
    box(g2, 0.14, 2.3, 0.14, M.steel, 0.75, 1.15, 0);
    box(g2, 1.9, 1.15, 0.1, M.trim, 0, 1.75, 0.02);
    box(g2, 1.7, 0.95, 0.03, screenM, 0, 1.75, 0.09);
    group.add(g2);
  }
  // 长椅 ×3(朝旗杆围坐)
  for (const [bx, bz, ba] of [[-4.6, 3.4, 0.63], [4.9, 2.9, -0.53], [3.7, -4.6, 2.47]]) {
    const b = new THREE.Group(); b.position.set(bx, PY, bz); b.rotation.y = ba;
    box(b, 1.7, 0.09, 0.42, M.steel, 0, 0.42, 0);
    box(b, 0.12, 0.42, 0.38, M.trim, -0.65, 0.21, 0);
    box(b, 0.12, 0.42, 0.38, M.trim, 0.65, 0.21, 0);
    group.add(b);
  }
  // 物资箱堆(空投配给)
  for (const [cx, cz, cw, ch, cry] of [[2.6, 5.8, 0.9, 0.6, 0.3], [3.6, 5.5, 0.7, 0.5, -0.2],
    [2.9, 5.9, 0.6, 0.5, 0.8], [3.1, 5.6, 0.8, 0.4, 0.1]]) {
    box(group, cw, ch, cw * 0.8, hash(cx * 9) > 0.5 ? M.steel : M.binBlue,
      cx, PY + ch / 2 + (cry > 0.5 ? 0.5 : 0.02), cz, cry);
  }
  // 广场灯杆(夜)
  cyl(group, 0.06, 4.6, M.steel, 5.8, PY + 2.3, -4.6, 8);
  box(group, 0.5, 0.12, 0.34, M.trim, 5.8, PY + 4.66, -4.6);
  box(group, 0.42, 0.05, 0.26, lampMat, 5.8, PY + 4.58, -4.6);

  /* ==========================================================
   * 生活痕迹(作业痕迹加强版)
   * ========================================================== */
  // EVA 服 ×2 晾在 B1 门口廊架(x=-28,z=+10 前)
  {
    const rack = new THREE.Group(); rack.position.set(-25.2, 0.3, 8.2); rack.rotation.y = 0.25;
    cyl(rack, 0.05, 2.2, M.steel, -1.0, 1.1, 0, 6);
    cyl(rack, 0.05, 2.2, M.steel, 1.0, 1.1, 0, 6);
    cyl(rack, 0.04, 2.1, M.steel, 0, 2.2, 0, 6, Math.PI / 2);
    for (const sx of [-0.45, 0.4]) {
      const s = new THREE.Group(); s.position.set(sx, 0, 0);
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), M.suit);
      helm.position.set(0, 1.92, 0); s.add(helm);
      box(s, 0.44, 0.58, 0.26, M.suit, 0, 1.45, 0);
      box(s, 0.46, 0.12, 0.28, M.suitOr, 0, 1.62, 0);          // 肩橙条
      box(s, 0.13, 0.5, 0.2, M.suit, -0.28, 1.38, 0, 0.12);
      box(s, 0.13, 0.5, 0.2, M.suit, 0.28, 1.38, 0, -0.12);
      box(s, 0.16, 0.62, 0.2, M.suit, -0.11, 0.85, 0);
      box(s, 0.16, 0.62, 0.2, M.suit, 0.11, 0.85, 0);
      box(s, 0.4, 0.34, 0.14, M.suitOr, 0, 1.4, -0.2);         // 背包
      rack.add(s);
    }
    group.add(rack);
  }
  // 菜箱 ×3(A3/A4 前檐下 + 公共舱旁;火星第一茬绿色)
  for (const [vx, vz, vry] of [[-11.6, -8.6, 0.15], [-4.4, -8.4, -0.1], [4.4, 8.6, 0.2]]) {
    const vb = new THREE.Group(); vb.position.set(vx, 0, vz); vb.rotation.y = vry;
    box(vb, 1.5, 0.4, 0.6, M.soilBox, 0, 0.26, 0);
    box(vb, 1.4, 0.06, 0.5, M.track, 0, 0.48, 0);
    for (let i = 0; i < 5; i++)
      box(vb, 0.1, 0.22, 0.1, M.green, -0.55 + i * 0.27, 0.6, (hash(i * 3 + vx) - 0.5) * 0.3);
    // 保温小拱(半透明感用细框示意)
    box(vb, 1.54, 0.05, 0.05, M.steel, 0, 0.78, -0.28);
    box(vb, 1.54, 0.05, 0.05, M.steel, 0, 0.78, 0.28);
    group.add(vb);
  }
  // 火星自行车构建器(架上 ×3 + 门前侧倒 ×1)
  const mkBike = (mat) => {
    const bk = new THREE.Group();
    for (const wx of [-0.52, 0.52]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.035, 14), M.tire);
      wheel.rotation.x = Math.PI / 2;                            // 轴放平:滚动沿 x
      wheel.position.set(wx, 0.34, 0); bk.add(wheel);
    }
    box(bk, 0.5, 0.05, 0.04, mat, -0.05, 0.62, 0);              // 上管
    const dt = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.045, 0.04), mat);
    dt.position.set(0.02, 0.48, 0); dt.rotation.z = 0.5; bk.add(dt);   // 斜管
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.04), mat);
    st.position.set(-0.32, 0.55, 0); st.rotation.z = 0.25; bk.add(st); // 座管
    box(bk, 0.2, 0.05, 0.08, M.dark, -0.36, 0.76, 0);           // 座
    const fk = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.04), mat);
    fk.position.set(0.48, 0.52, 0); fk.rotation.z = -0.25; bk.add(fk); // 前叉
    box(bk, 0.05, 0.05, 0.36, M.dark, 0.42, 0.72, 0);           // 车把
    return bk;
  };
  // 自行车架 + 3 辆(广场东缘)
  {
    const ra = new THREE.Group(); ra.position.set(6.5, PY, 1.6); ra.rotation.y = -0.35;
    box(ra, 2.4, 0.08, 0.08, M.steel, 0, 0.55, 0);
    box(ra, 0.08, 0.55, 0.08, M.steel, -1.1, 0.275, 0);
    box(ra, 0.08, 0.55, 0.08, M.steel, 1.1, 0.275, 0);
    for (let i = 0; i < 3; i++) {
      const bk = mkBike(i === 1 ? M.bike2 : M.bike);
      bk.position.set(-0.75 + i * 0.75, 0, 0.45);
      bk.rotation.y = Math.PI / 2 + (hash(i * 8.8) - 0.5) * 0.24;
      bk.rotation.z = 0.1;                                      // 靠架微倾
      ra.add(bk);
    }
    group.add(ra);
  }
  // 第 4 辆:A5 门口侧倒的小车(孩子扔下就跑)
  {
    const fb = mkBike(M.bike2);
    fb.scale.setScalar(0.8);
    fb.position.set(4.7, 0.13, -8.0);
    fb.rotation.set(1.15, -0.7, 0);
    group.add(fb);
  }
  // 跳房子格(0.38 g 一格能跳很远——格距画大)+ 皮球
  {
    const hs = new THREE.Group(); hs.position.set(-2.4, PY + 0.012, 3.6); hs.rotation.y = 0.35;
    const cells = [[0, 0, 1], [0.55, 0, 2], [1.1, 0, 1], [1.65, 0, 2], [2.2, 0, 1]];
    let ci = 0;
    for (const [cx, cz, n] of cells) {
      for (let j = 0; j < n; j++)
        box(hs, 0.44, 0.008, 0.44, (ci++ % 2) ? M.orange : hullMats[4],
          cx, 0, cz + (n === 2 ? (j - 0.5) * 0.5 : 0));
    }
    group.add(hs);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M.bike);
    ball.position.set(-3.4, PY + 0.13, 5.2);
    group.add(ball);
  }
  // 儿童涂鸦板(长椅旁)
  {
    const db = new THREE.Group(); db.position.set(-5.6, PY, 1.6); db.rotation.y = 0.9;
    box(db, 0.1, 0.9, 0.1, M.trim, -0.6, 0.45, 0);
    box(db, 0.1, 0.9, 0.1, M.trim, 0.6, 0.45, 0);
    box(db, 1.4, 0.8, 0.05, hullMats[4], 0, 0.75, 0);
    // 涂鸦:几笔彩色小块(太阳/房子/火箭的抽象)
    box(db, 0.16, 0.16, 0.02, M.orange, -0.4, 0.95, 0.035);
    box(db, 0.2, 0.12, 0.02, M.binGrn, 0.05, 0.72, 0.035);
    box(db, 0.09, 0.24, 0.02, M.bike, 0.42, 0.8, 0.035);
    box(db, 0.3, 0.05, 0.02, M.binBlue, -0.05, 0.55, 0.035);
    box(db, 1.3, 0.06, 0.1, M.trim, 0, 0.32, 0.04);            // 粉笔槽
    group.add(db);
  }
  // 舱门口储物箱(散布在几个前檐)
  for (const [sx, sz, sry] of [[-18.9, -8.9, 0.3], [2.2, -8.7, -0.2], [-15.4, 8.8, 0.1], [22.3, 4.2, 1.4]])
    box(group, 0.64, 0.5, 0.44, M.steel, sx, 0.25, sz, sry);

  /* ==========================================================
   * 边缘件:村口标志牌(西) + 垃圾分类站 + 气瓶架 + 防尘矮墙
   * ========================================================== */
  {
    const sign = new THREE.Group(); sign.position.set(-33.5, 0.35, 0); sign.rotation.y = -Math.PI / 2;
    box(sign, 0.14, 2.6, 0.14, M.steel, -0.9, 1.3, 0);
    box(sign, 0.14, 2.6, 0.14, M.steel, 0.9, 1.3, 0);
    box(sign, 2.2, 1.0, 0.1, hullMats[3], 0, 2.0, 0);
    box(sign, 2.0, 0.16, 0.03, signM, 0, 2.24, 0.06);           // 发光村名条
    box(sign, 1.6, 0.4, 0.03, M.trim, 0, 1.78, 0.06);           // 信息板
    group.add(sign);
  }
  {
    const ws = new THREE.Group(); ws.position.set(8.2, 0, 8.8); ws.rotation.y = 2.6;
    for (let i = 0; i < 3; i++)
      box(ws, 0.6, 0.75, 0.55, [M.binGrn, M.binBlue, M.orange][i], -0.7 + i * 0.7, 0.375, 0);
    box(ws, 2.4, 0.08, 0.8, M.steel, 0, 1.15, -0.05);
    box(ws, 0.1, 1.1, 0.1, M.steel, -1.1, 0.575, -0.3);
    box(ws, 0.1, 1.1, 0.1, M.steel, 1.1, 0.575, -0.3);
    group.add(ws);
  }
  {
    // 备用气瓶架(A1 气闸旁 —— 应急 O2/N2)
    const gr = new THREE.Group(); gr.position.set(-28.6, 0.35, -9.0); gr.rotation.y = 0.5;
    box(gr, 2.0, 0.12, 0.8, M.steel, 0, 0.06, 0);
    box(gr, 2.0, 0.08, 0.08, M.steel, 0, 1.25, -0.3);
    for (let i = 0; i < 4; i++)
      cyl(gr, 0.17, 1.3, i < 2 ? M.orange : M.steel, -0.72 + i * 0.48, 0.77, 0, 10);
    box(gr, 0.3, 0.24, 0.16, M.trim, 0.85, 0.9, 0.3);           // 汇流阀箱
    group.add(gr);
  }
  {
    // 应急 PV 桌 + 配电箱(村口动力角:市电断供时给气闸/门灯兜底)
    const pv = new THREE.Group(); pv.position.set(-31.6, 0.35, -13.2); pv.rotation.y = 0.55;
    for (const sx of [-1.05, 1.05]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.15, 0.07), M.steel);
      leg.position.set(sx, 0.55, 0.25); leg.rotation.x = 0.35; pv.add(leg);
      box(pv, 0.07, 0.72, 0.07, M.steel, sx, 0.36, -0.32);
    }
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.06, 1.25), M.pv);
    panel.position.set(0, 0.95, 0); panel.rotation.x = -0.42; pv.add(panel);
    box(pv, 2.3, 0.04, 0.08, M.steel, 0, 0.72, 0.5);
    box(pv, 0.42, 0.5, 0.22, M.steel, 1.35, 0.25, 0.1);         // 配电箱
    box(pv, 0.05, 0.05, 0.03, ledG, 1.35, 0.42, 0.22);
    box(pv, 0.08, 0.04, 3.4, M.dark, 0.4, 0.02, 2.2);           // 电缆槽去 A 脊
    group.add(pv);
  }
  {
    // 防尘矮墙(西北来风侧,护村口)
    const dw = new THREE.Group(); dw.position.set(-27, 0.35, -20.5); dw.rotation.y = 0.7;
    box(dw, 9.5, 1.25, 0.5, M.concrete, 0, 0.625, 0);
    box(dw, 9.7, 0.18, 0.62, M.trim, 0, 1.32, 0);
    for (let i = 0; i < 4; i++) box(dw, 0.3, 1.45, 0.62, M.concrete, -4.2 + i * 2.8, 0.725, 0);
    group.add(dw);
  }

  /* ---------------- 作业痕迹:车辙 + 散石 ---------------- */
  // 村口车辙(自西门进广场,双条平行;西侧地形略高,抬到 0.45)
  for (const off of [-0.85, 0.85]) {
    box(group, 24, 0.04, 0.5, M.track, -21, 0.45, off * 1.2 + off * 0.4, 0.06);
  }
  box(group, 6, 0.025, 0.4, M.track, 2.8, PY + 0.02, 1.0, -0.25);  // 自行车辙去车架(广场面)
  const rocks = [];
  for (let i = 0; i < 26; i++) {
    const a = hash(i * 3.3) * Math.PI * 2, r = 26 + hash(i * 7.1) * 12;
    const s = 0.07 + hash(i * 5.9) * 0.14;
    const m = new THREE.Mesh(rockGeo, M.rock);
    m.scale.set(s, s * (0.55 + hash(i * 9.7) * 0.4), s);
    m.position.set(Math.cos(a) * r * 1.05, 1.62 * s * 0.7 - 0.3 * s - 0.1, Math.sin(a) * r * 0.72);
    m.rotation.y = hash(i * 13.1) * Math.PI;
    group.add(m); rocks.push(m);
  }

  /* ---------------- POI 锚点 ---------------- */
  const poi = (id, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(x, y, z);
    group.add(a);
  };
  poi('berm', -3.5, 2.8, -15);        // 覆土坡(A4)
  poi('hull', -10.5, 1.2, -9.6);      // 标准舱端面(A3)
  poi('corridor', -3, 1.6, -22);      // A 脊廊
  poi('airlock', -24.5, 1.4, -7.6);   // A1 端头气闸
  poi('commons', 1.5, 2.4, 8.6);      // 公共舱大端窗
  poi('plaza', 0, 3.5, 0);            // 村心广场
  poi('bike', 6.5, 1.5, 1.6);         // 自行车架(广场台面上)

  /* ---------------- 尘膜 pass ---------------- */
  const dust = new THREE.Color(0x9e5b3d);
  [...hullMats, M.trim, M.steel, M.corridor, M.orange, M.concrete,
    M.suit, M.suitOr, M.binBlue, M.binGrn, M.bike, M.bike2].forEach((m) => m.color.lerp(dust, 0.05));

  /* ---------------- 声明 ---------------- */
  group.userData.nightMats = nightMats;
  group.userData.blinkMats = blinkMats;
  group.userData.spinners = [{ node: 'fan_commons', axis: 'y', rpm: 22 }];
  group.userData.oscillators = [
    { node: 'flag_main', axis: 'y', prop: 'rotation', amp: 0.16, period: 2.8 },  // 旗慢摆
  ];
  group.userData.lights = [
    { color: 0xffd9a0, pos: [5.8, 4.95, -4.6], range: 26 },     // 广场灯
    { color: 0xffd0a0, pos: [1.5, 2.6, 6.5], range: 15 },       // 公共舱大端窗夜间泛光
  ];
  return group;
}
