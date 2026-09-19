// ops-polymer-01 聚合物线(CO₂ + H₂ → 甲醇 → 烯烃 → HDPE)
// 1 单位 = 1 米;原点在场地中心地面,+Y 向上,工艺剖切面朝 +Z。
// 工艺流向沿 +X:CO₂/水 → SOXE + 电解 → 合成气压缩 → 甲醇塔 → MTO 流化床 → 冷箱分离 → 气相聚合釜 → 脱气 → 挤出造粒 → 料仓。
// 同色因果链:青=CO₂ · 蓝=水 · 白=O₂(副产,出厂)· 橙红=H₂ · 琥珀=甲醇 · 紫=烯烃 · 乳白=PE 粒料。
// 账:mars-polymer 358d389(账 1–5);铭牌 50 kg PE/sol(井压的),全线舱外,唯一增压体是控制间(账 4)。

export const meta = {
  id: 'ops-polymer-01',
  name: '聚合物线(CO₂+H₂ → 甲醇 → 烯烃 → HDPE)',
  name_en: 'Polymer Line (CO2 + H2 -> methanol -> olefins -> HDPE)',
  size_m: 58.3,                // 实测包围盒长边 58.25(validate_unit 复核,填 manifest),禁止整体缩放
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = 'ops-polymer-01';

  // ---------- 材质 ----------
  const M = {
    pad:      new THREE.MeshLambertMaterial({ color: 0x8a6047 }),   // 压实场地
    padDS:    new THREE.MeshLambertMaterial({ color: 0x8a6047, side: THREE.DoubleSide }),
    slab:     new THREE.MeshLambertMaterial({ color: 0x6d6a60 }),   // 硫混凝土地坪
    white:    new THREE.MeshLambertMaterial({ color: 0xe8e8e4 }),
    whiteDust:new THREE.MeshLambertMaterial({ color: 0xd9d2c8 }),
    whiteDS:  new THREE.MeshLambertMaterial({ color: 0xe8e8e4, side: THREE.DoubleSide }),
    grey:     new THREE.MeshLambertMaterial({ color: 0x9a9a96 }),
    greyDS:   new THREE.MeshLambertMaterial({ color: 0x9a9a96, side: THREE.DoubleSide }),
    dark:     new THREE.MeshLambertMaterial({ color: 0x3a3a3c }),
    iron:     new THREE.MeshLambertMaterial({ color: 0x5c5a58 }),   // 球铁压力壳(res-foundry-01)
    ironDS:   new THREE.MeshLambertMaterial({ color: 0x5c5a58, side: THREE.DoubleSide }),
    steel:    new THREE.MeshLambertMaterial({ color: 0xb0aca4 }),   // 进口钢件(冷箱、压缩机)
    orange:   new THREE.MeshLambertMaterial({ color: 0xe07020 }),   // 安全橙
    rockwool: new THREE.MeshLambertMaterial({ color: 0xcfc6b4, side: THREE.DoubleSide }), // 岩棉保温(res-glass-01)
    caststone:new THREE.MeshLambertMaterial({ color: 0x2f2b2a, side: THREE.DoubleSide }), // 铸石衬里
    co2:      new THREE.MeshLambertMaterial({ color: 0x3aa6a0 }),   // 青:CO₂
    water:    new THREE.MeshLambertMaterial({ color: 0x2f6fd0 }),   // 蓝:水
    o2:       new THREE.MeshLambertMaterial({ color: 0xf2f2f0 }),   // 白:O₂
    h2:       new THREE.MeshLambertMaterial({ color: 0xd8502a }),   // 橙红:H₂
    meoh:     new THREE.MeshLambertMaterial({ color: 0xd8a23a }),   // 琥珀:甲醇
    olefin:   new THREE.MeshLambertMaterial({ color: 0x8a5fd0 }),   // 紫:烯烃
    pe:       new THREE.MeshLambertMaterial({ color: 0xf4f1e6 }),   // 乳白:PE 粒料
    peDS:     new THREE.MeshLambertMaterial({ color: 0xf4f1e6, side: THREE.DoubleSide }),
    cat:      new THREE.MeshLambertMaterial({ color: 0x8c8474 }),   // SAPO-34 催化剂(浅褐)
    cuCat:    new THREE.MeshLambertMaterial({ color: 0x3f4a3a }),   // Cu/ZnO 催化剂管(墨绿)
    regolith: new THREE.MeshLambertMaterial({ color: 0xa8674a }),   // 打印土壳(控制间)
    radiator: new THREE.MeshLambertMaterial({ color: 0x1e1e20 }),
    pv:       new THREE.MeshLambertMaterial({ color: 0x1c2a52 }),
  };
  // 夜光/自发光件 -> userData.nightMats(引擎随昼夜调 emissiveIntensity)
  const winMat  = new THREE.MeshStandardMaterial({ color: 0x332a18, emissive: 0xffc46a, emissiveIntensity: 1.2, roughness: 0.6 });
  const ledMat  = new THREE.MeshStandardMaterial({ color: 0x0a2a0a, emissive: 0x35e055, emissiveIntensity: 1.4, roughness: 0.5 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, emissive: 0xfff0d8, emissiveIntensity: 1.5, roughness: 0.5 });
  const bedMat  = new THREE.MeshStandardMaterial({ color: 0x6a3416, emissive: 0xff7a1e, emissiveIntensity: 0.9, roughness: 0.8, side: THREE.DoubleSide }); // 450 °C 流化床
  const soxeMat = new THREE.MeshStandardMaterial({ color: 0x5a2a12, emissive: 0xff5a10, emissiveIntensity: 1.0, roughness: 0.8 }); // 800 °C 堆芯缝
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x0c1a2a, emissive: 0x2c8cff, emissiveIntensity: 0.9, roughness: 0.5 });
  // 闪烁件:固定 emissive 只进 blinkMats(坑账 20)
  const beaconMat = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 2.0, roughness: 0.5 });

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); (parent || group).add(m); return m;
  };
  const cyl = (rt, rb, h, mat, x, y, z, seg, parent, open) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24, 1, !!open), mat);
    m.position.set(x, y, z); (parent || group).add(m); return m;
  };
  const sph = (r, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat);
    m.position.set(x, y, z); (parent || group).add(m); return m;
  };
  let _seed = 20260913;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);   // 顶点半径 φ≈1.618(坑账 1)
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5); m.lookAt(_bb); (parent || group).add(m); return m;
  };
  const pipe = (ax, ay, az, bx, by, bz, r, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, _ba.distanceTo(_bb), 10), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _bb.clone().sub(_ba).normalize());
    (parent || group).add(m); return m;
  };
  const railing = (x0, z0, x1, z1, y, parent) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.4));
    for (let i = 0; i <= n; i++) { const t = i / n; box(0.07, 1.0, 0.07, M.orange, x0 + (x1 - x0) * t, y + 0.5, z0 + (z1 - z0) * t, parent); }
    beam(x0, y + 1.0, z0, x1, y + 1.0, z1, 0.07, M.orange, parent);
  };
  const ladder = (x, z, y0, y1, parent) => {
    for (const s of [-1, 1]) box(0.06, y1 - y0, 0.06, M.dark, x + s * 0.22, (y0 + y1) / 2, z, parent);
    for (let y = y0 + 0.3; y < y1; y += 0.32) box(0.46, 0.05, 0.05, M.dark, x, y, z, parent);
  };
  const door = (x, zFace, mat) => {                       // 密封门:框+扇+闩+双铰链
    box(1.06, 2.02, 0.07, M.orange, x, 1.29, zFace + 0.04);
    box(0.90, 1.86, 0.09, mat || M.whiteDust, x, 1.29, zFace);
    box(0.10, 0.26, 0.08, M.dark, x + 0.32, 1.28, zFace + 0.06);
    box(0.14, 0.10, 0.06, M.dark, x - 0.37, 1.92, zFace + 0.04);
    box(0.14, 0.10, 0.06, M.dark, x - 0.37, 0.66, zFace + 0.04);
  };
  // 竖式压力容器(可带前向剖切:从 +Z 侧切掉 100° 扇形露内部)
  const vessel = (r, h, x, y0, z, mat, cut, parent) => {
    const g = new THREE.Group(); g.position.set(x, y0, z); (parent || group).add(g);
    if (cut) {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32, 1, true, Math.PI * 0.30, Math.PI * 1.40), mat.side === THREE.DoubleSide ? mat : M.ironDS);
      shell.position.y = h / 2; g.add(shell);
      const capB = cyl(r, r, 0.12, mat, 0, 0.06, 0, 32, g); const capT = cyl(r, r, 0.12, mat, 0, h - 0.06, 0, 32, g);
      void capB; void capT;
    } else {
      cyl(r, r, h, mat, 0, h / 2, 0, 28, g);
    }
    sph(r, mat, 0, h, 0, g); cyl(r * 1.06, r * 1.06, 0.14, M.dark, 0, 0.07, 0, 28, g);
    return g;
  };
  const spinners = [], oscillators = [], lights = [];

  // ---------- 场地:压实土平台 + 设备基础 ----------
  // 登记站址 (40,130) 处地形在足迹内 起伏 1.48 m(1 m 格双线性,mars-polymer ledger/data/terrain_sites.json,引擎内实测)。
  // 城内地形网格不能开挖,所以平台按「填方」画:底面贴最低点(manifest sink_m 1.10),顶面高出最高点 0.16 m。
  // 设计意图是就地挖填平衡(账 5 earthwork),全填方画法是声明的资产债,不是设计。
  const PL = 1.65;
  const plinth = box(58, PL, 38, M.pad, 1.0, PL / 2, -2.5); plinth.name = 'plinth';
  const Y0 = PL;                                              // 设备落在平台面
  const FOOT = [                                              // [x, z, w, d] 重设备基础,硫混凝土 0.3 m,顶面略高于平台;账 5 从这里量体积
    [-19, -8, 3.6, 3.4], [-14.5, -8, 3.0, 2.6], [-6, -8, 2.0, 2.0], [2.3, -8, 5.0, 2.6],
    [8.5, -10, 4.0, 3.4], [15, -8, 2.8, 2.8], [20, -3.5, 2.4, 2.4], [24.5, -3.5, 5.6, 1.6],
    [21.5, 7.5, 4.4, 4.4], [27.5, 7.5, 4.4, 4.4],
  ];
  FOOT.forEach(([x, z, w, d], k) => { const f = box(w, 0.3, d, M.slab, x, PL - 0.15 + 0.015, z); f.name = 'footing_' + k; });
  // 拖车坡道(+Z 前沿,1:6.7):楔形,底面贴地 y=0(非索引几何 + 平面法线)
  {
    const x0 = 22.2, x1 = 25.8, zA = 16.5, zB = 27.5;
    const v = [x0, 0, zA, x1, 0, zA, x1, PL, zA, x0, PL, zA, x0, 0, zB, x1, 0, zB];
    const idx = [0, 2, 1, 0, 3, 2, 0, 1, 5, 0, 5, 4, 3, 4, 5, 3, 5, 2, 0, 4, 3, 1, 2, 5];
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); wg.setIndex(idx);
    const wf = wg.toNonIndexed(); wf.computeVertexNormals();
    const ramp = new THREE.Mesh(wf, M.padDS); ramp.name = 'ramp'; group.add(ramp);
  }
  // 车辙(拖车从坡道上平台)
  for (const dx of [-0.9, 0.9]) box(0.5, 0.03, 22, M.dark, 24 + dx, PL + 0.015, 3);
  // 散落砾石(确定性,前场空地)
  for (let i = 0; i < 26; i++) {
    const s = 0.12 + rnd() * 0.2, sy = s * 0.7, rk = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.pad : M.dark);
    rk.position.set(rnd() * 18, PL - 0.3 * sy + 1.618 * sy, 13.5 + rnd() * 2.5); rk.scale.set(s, sy, s); rk.rotation.y = rnd() * 6.28; group.add(rk);
  }

  // ---------- 防尘棚(不增压,与 res-glass-01 同形):铸铁框架,+Z 面敞开 ----------
  const SH = { x0: -22, x1: 20, z0: -14, z1: 6, h: 11 };
  for (let x = SH.x0; x <= SH.x1; x += 7) {
    box(0.4, SH.h, 0.4, M.iron, x, Y0 + SH.h / 2, SH.z0);
    box(0.4, SH.h, 0.4, M.iron, x, Y0 + SH.h / 2, SH.z1);
    beam(x, Y0 + SH.h, SH.z0, x, Y0 + SH.h + 1.6, (SH.z0 + SH.z1) / 2, 0.3, M.iron);   // 双坡屋架
    beam(x, Y0 + SH.h, SH.z1, x, Y0 + SH.h + 1.6, (SH.z0 + SH.z1) / 2, 0.3, M.iron);
  }
  beam(SH.x0, Y0 + SH.h + 1.6, (SH.z0 + SH.z1) / 2, SH.x1, Y0 + SH.h + 1.6, (SH.z0 + SH.z1) / 2, 0.3, M.iron);   // 脊梁
  beam(SH.x0, Y0 + SH.h, SH.z0, SH.x1, Y0 + SH.h, SH.z0, 0.3, M.iron);
  beam(SH.x0, Y0 + SH.h, SH.z1, SH.x1, Y0 + SH.h, SH.z1, 0.3, M.iron);
  // 屋面板只盖后半坡(前坡开着,剖切露设备)+ 背墙(挡尘,不密封)
  const roofB = box(SH.x1 - SH.x0 + 0.6, 0.08, 10.6, M.whiteDust, (SH.x0 + SH.x1) / 2, Y0 + SH.h + 0.85, SH.z0 + 5.0);
  roofB.rotation.x = Math.atan2(1.6, 10);
  box(SH.x1 - SH.x0 + 0.6, SH.h, 0.12, M.whiteDust, (SH.x0 + SH.x1) / 2, Y0 + SH.h / 2, SH.z0 - 0.3);
  box(SH.x1 - SH.x0 + 1.0, 0.2, 0.5, M.grey, (SH.x0 + SH.x1) / 2, Y0 + 0.1, SH.z0 - 0.3);   // 底裙边

  // ---------- 1. 合成气撬:CO₂ 接入 + SOXE 热箱 + 水电解 + 整流柜(x −20…−12) ----------
  // CO₂ 接管:从 −Z 场地边(总控走廊方向)进来的短接管,停在门口(MODELS.md §3 各修一半)
  pipe(-19, Y0 + 1.2, -21, -19, Y0 + 1.2, -12, 0.16, M.co2); box(0.5, 0.5, 0.5, M.co2, -19, Y0 + 1.2, -21.2);
  pipe(-16, Y0 + 0.9, -21, -16, Y0 + 0.9, -12, 0.10, M.water); box(0.4, 0.4, 0.4, M.water, -16, Y0 + 0.9, -21.2);
  // SOXE 热箱:白色岩棉外壳,前面剖开露 800 °C 堆缝
  box(3.2, 3.0, 3.0, M.rockwool, -19, Y0 + 1.5, -8);
  box(2.4, 2.2, 0.3, M.dark, -19, Y0 + 1.5, -6.4);
  for (let i = 0; i < 6; i++) box(2.2, 0.08, 0.1, soxeMat, -19, Y0 + 0.6 + i * 0.34, -6.3);
  pipe(-17.4, Y0 + 2.5, -8, -13, Y0 + 2.5, -8, 0.08, M.o2);            // 白:O₂ 出
  pipe(-19, Y0 + 3.0, -8, -19, Y0 + 5.5, -8, 0.10, M.grey);             // CO 出(灰,舱外)
  // 水电解撬:蓝色分离器罐 ×2 + 堆箱
  box(2.6, 1.8, 2.2, M.white, -14.5, Y0 + 0.9, -8);
  cyl(0.45, 0.45, 1.6, M.h2, -13.4, Y0 + 2.7, -8.6, 20); cyl(0.45, 0.45, 1.6, M.o2, -15.6, Y0 + 2.7, -8.6, 20);
  pipe(-13.4, Y0 + 3.5, -8.6, -13.4, Y0 + 5.5, -8.6, 0.08, M.h2);
  // 整流柜排(进口:电子)
  for (let i = 0; i < 3; i++) { box(1.1, 2.1, 0.8, M.grey, -20.5 + i * 1.25, Y0 + 1.05, -12.2); box(0.6, 0.1, 0.05, ledMat, -20.5 + i * 1.25, Y0 + 1.9, -11.77); }
  pipe(-13, Y0 + 5.5, -8.6, 30, Y0 + 5.5, -8.6, 0.06, M.h2);            // 顶部管架上的 H₂/CO 干管(向下游)
  pipe(-19, Y0 + 5.5, -8, 30, Y0 + 5.5, -8.0, 0.08, M.grey);

  // ---------- 2. 合成气压缩机(spinner 飞轮)+ 甲醇塔(20 bar 球铁,剖切)+ 冷凝器 + 甲醇罐(x −10…−3) ----------
  box(2.4, 1.2, 1.6, M.steel, -10, Y0 + 0.6, -10);
  const fly1 = cyl(0.55, 0.55, 0.25, M.dark, -8.6, Y0 + 1.2, -10, 24); fly1.rotation.z = Math.PI / 2; fly1.name = 'comp_syngas';
  for (let i = 0; i < 4; i++) { const sp = box(0.9, 0.08, 0.08, M.orange, 0, 0, 0, fly1); sp.rotation.y = i * Math.PI / 4; }
  spinners.push({ node: 'comp_syngas', axis: 'x', rpm: 40 });
  // 甲醇塔:Ø1.2 × 6 m,20 bar 球铁本地;前向剖切露 Cu/ZnO 催化剂管束
  const mv = vessel(0.6, 6, -6, Y0, -8, M.iron, true);
  for (let i = -2; i <= 2; i++) cyl(0.07, 0.07, 5.2, M.cuCat, i * 0.2, 3.1, -0.05, 8, mv);
  ladder(-6.8, -8, Y0, Y0 + 6.2); railing(-7.2, -6.8, -4.8, -6.8, Y0 + 6.3); box(2.4, 0.08, 1.4, M.grey, -6, Y0 + 6.25, -7.5);
  // 冷凝分离器(卧式)+ 甲醇罐(舱外,≤1 sol 存量 272 kg → Ø1.2 m)
  const cond = cyl(0.5, 0.5, 2.6, M.iron, -3.5, Y0 + 1.4, -11, 20); cond.rotation.z = Math.PI / 2;
  cyl(0.6, 0.6, 1.6, M.meoh, -3.5, Y0 + 0.8, -6.5, 20); pipe(-3.5, Y0 + 1.6, -6.5, -3.5, Y0 + 3.6, -6.5, 0.06, M.meoh);
  pipe(-6, Y0 + 5.9, -8, -3.5, Y0 + 5.9, -8, 0.08, M.meoh); pipe(-3.5, Y0 + 5.9, -8, 0.5, Y0 + 5.9, -8, 0.08, M.meoh);
  box(0.9, 0.9, 0.9, M.co2, -1.5, Y0 + 0.45, -6.2);                     // 回收水/未反应气循环小撬

  // ---------- 3. MTO 流化床 + 再生器(450 °C,2 bar,铸石衬里铁壳,剖切露床)(x −1…4) ----------
  const mto = vessel(0.9, 8, 1, Y0, -8, M.iron, true);
  cyl(0.82, 0.82, 7.6, M.caststone, 0, 3.9, 0, 32, mto, true);          // 铸石衬里(开口圆筒,DoubleSide)
  cyl(0.72, 0.72, 2.6, bedMat, 0, 1.6, 0, 24, mto);                     // 灼热流化床
  for (let i = 0; i < 2; i++) cyl(0.28, 0.12, 0.9, M.grey, -0.5 + i * 1.0, 8.6, 0, 12, mto);   // 顶部旋风
  const regen = vessel(0.6, 6, 3.6, Y0, -8, M.iron, false);
  pipe(3.6, Y0 + 5.0, -8, 1.9, Y0 + 4.0, -8, 0.12, M.cat);              // 立管:催化剂循环
  pipe(1.9, Y0 + 2.0, -8, 3.6, Y0 + 1.2, -8, 0.12, M.cat);
  pipe(3.6, Y0 + 0.8, -8, 3.6, Y0 + 0.8, -11.5, 0.08, M.o2);            // 再生烧焦用 O₂
  pipe(3.6, Y0 + 6.3, -8, 3.6, Y0 + 7.5, -8, 0.08, M.co2);              // 再生尾气 CO₂ 回收
  ladder(0.05, -8, Y0, Y0 + 8.2); railing(-0.3, -6.7, 4.6, -6.7, Y0 + 8.3); box(5.2, 0.08, 1.6, M.grey, 2.1, Y0 + 8.25, -7.4);
  pipe(1, Y0 + 8.3, -9.2, 7, Y0 + 8.3, -9.2, 0.10, M.olefin);           // 紫:烯烃产品气 → 冷箱
  void regen;

  // ---------- 4. 冷箱(进口钢件,−100 °C,岩棉外壳)+ 级联制冷压缩机(x 6…11) ----------
  box(3.6, 10, 3.0, M.rockwool, 8.5, Y0 + 5, -10);
  box(2.9, 8.8, 0.25, M.dark, 8.5, Y0 + 5, -8.45);                      // 前面开检修板露三塔
  for (let i = 0; i < 3; i++) cyl(0.32, 0.32, 8.0, M.steel, 7.6 + i * 0.9, Y0 + 4.6, -8.3, 16);
  box(2.2, 1.1, 1.6, M.steel, 12.2, Y0 + 0.55, -11);
  const fly2 = cyl(0.45, 0.45, 0.2, M.dark, 13.4, Y0 + 1.1, -11, 24); fly2.rotation.z = Math.PI / 2; fly2.name = 'comp_refrig';
  for (let i = 0; i < 3; i++) { const sp = box(0.75, 0.07, 0.07, M.orange, 0, 0, 0, fly2); sp.rotation.y = i * Math.PI / 3; }
  spinners.push({ node: 'comp_refrig', axis: 'x', rpm: 60 });
  pipe(8.5, Y0 + 10.2, -10, 8.5, Y0 + 10.8, -10, 0.08, M.olefin); pipe(8.5, Y0 + 10.8, -10, 14, Y0 + 10.8, -10, 0.08, M.olefin);   // 聚合级乙烯 → 釜
  pipe(10.3, Y0 + 2.0, -10, 10.3, Y0 + 2.0, -13.5, 0.07, M.olefin);    // 丙烯副产出(紫,去向未定:账 4)
  box(0.6, 0.6, 0.6, M.olefin, 10.3, Y0 + 2.0, -13.6);

  // ---------- 5. 气相聚合釜(20 bar/90 °C 球铁,剖切露 PE 粉床)+ 循环气冷却器 + 循环压缩机(x 13…18) ----------
  const pr = vessel(0.75, 9, 15, Y0, -8, M.iron, true);
  cyl(1.05, 1.05, 2.0, M.iron, 0, 8.6, 0, 28, pr);                      // 扩大段(沉降)
  cyl(0.68, 0.68, 4.0, M.peDS, 0, 2.3, 0, 24, pr);                      // 白色 PE 粉床
  cyl(0.62, 0.62, 0.15, M.dark, 0, 0.35, 0, 24, pr);                    // 分布板
  ladder(14.2, -8, Y0, Y0 + 9.5); railing(13.5, -6.7, 16.5, -6.7, Y0 + 9.6); box(3.2, 0.08, 1.6, M.grey, 15, Y0 + 9.55, -7.4);
  const cool = cyl(0.42, 0.42, 3.2, M.iron, 18.2, Y0 + 6.5, -10.5, 20); cool.rotation.x = Math.PI / 2;
  pipe(15, Y0 + 10.7, -8, 18.2, Y0 + 10.7, -8, 0.14, M.olefin); pipe(18.2, Y0 + 10.7, -8, 18.2, Y0 + 8.1, -10.5, 0.14, M.olefin);
  pipe(18.2, Y0 + 4.9, -10.5, 18.2, Y0 + 1.6, -10.5, 0.14, M.olefin);
  box(1.6, 1.0, 1.4, M.steel, 18.2, Y0 + 0.5, -10.5);
  const fly3 = cyl(0.4, 0.4, 0.18, M.dark, 19.1, Y0 + 1.0, -10.5, 24); fly3.rotation.z = Math.PI / 2; fly3.name = 'comp_cycle';
  for (let i = 0; i < 3; i++) { const sp = box(0.66, 0.07, 0.07, M.orange, 0, 0, 0, fly3); sp.rotation.y = i * Math.PI / 3; }
  spinners.push({ node: 'comp_cycle', axis: 'x', rpm: 75 });
  pipe(18.2, Y0 + 1.6, -10.5, 15, Y0 + 0.9, -8, 0.14, M.olefin);        // 循环气回釜底
  box(0.7, 1.3, 0.7, M.grey, 13.3, Y0 + 0.65, -10.6);                   // 催化剂加料器(进口)

  // ---------- 6. 脱气仓(CO₂ 吹扫)+ 挤出造粒棚(剖切露螺杆)+ 料仓 ×2 + 输送(x 18…28,前场) ----------
  const dg = vessel(0.9, 4.5, 20, Y0, -3.5, M.iron, false); void dg;
  pipe(15, Y0 + 3.0, -8, 20, Y0 + 4.8, -3.5, 0.12, M.pe);               // 粉 → 脱气仓
  pipe(20, Y0 + 0.9, -6.5, 20, Y0 + 0.9, -4.5, 0.08, M.co2);            // CO₂ 吹扫进
  // 造粒棚:三面墙 + 顶,+Z 面开
  const PX = 24.5, PZ = -3.5;
  box(7, 4, 0.25, M.white, PX, Y0 + 2, PZ - 3); box(0.25, 4, 6, M.white, PX - 3.4, Y0 + 2, PZ); box(0.25, 4, 6, M.white, PX + 3.4, Y0 + 2, PZ);
  box(7.4, 0.25, 6.4, M.whiteDust, PX, Y0 + 4.1, PZ); box(7.6, 0.15, 0.4, M.grey, PX, Y0 + 4.25, PZ + 3.2);
  box(0.25, 4, 0.25, M.white, PX - 3.4, Y0 + 2, PZ + 3); box(0.25, 4, 0.25, M.white, PX + 3.4, Y0 + 2, PZ + 3);
  // 挤出机:料斗 + 机筒(铸造厂机加)+ 螺杆(进口,spinner)+ 切粒头
  cyl(0.5, 0.2, 0.9, M.pe, PX - 2.2, Y0 + 2.4, PZ, 16, undefined, true);
  const barrel = cyl(0.28, 0.28, 4.4, M.ironDS, PX, Y0 + 1.3, PZ, 20, undefined, true); barrel.rotation.z = Math.PI / 2;
  const screw = new THREE.Group(); screw.name = 'extruder_screw'; screw.position.set(PX, Y0 + 1.3, PZ); group.add(screw);
  const core = cyl(0.12, 0.12, 4.3, M.steel, 0, 0, 0, 12, screw); core.rotation.z = Math.PI / 2;
  for (let i = 0; i < 14; i++) { const f = box(0.06, 0.46, 0.1, M.steel, -2.0 + i * 0.3, 0, 0, screw); f.rotation.x = i * 0.9; }
  spinners.push({ node: 'extruder_screw', axis: 'x', rpm: 30 });
  box(1.2, 1.0, 1.0, M.steel, PX - 2.9, Y0 + 1.3, PZ);                   // 驱动电机(进口)
  const cutter = cyl(0.36, 0.36, 0.25, M.dark, PX + 2.5, Y0 + 1.3, PZ, 20); cutter.rotation.z = Math.PI / 2; cutter.name = 'pelletiser';
  for (let i = 0; i < 6; i++) { const k = box(0.6, 0.05, 0.05, M.orange, 0, 0, 0, cutter); k.rotation.y = i * Math.PI / 6; }
  spinners.push({ node: 'pelletiser', axis: 'x', rpm: 120 });
  box(1.4, 0.8, 1.4, M.water, PX + 2.4, Y0 + 0.4, PZ + 1.6);           // 水下切粒循环水槽
  // 粒料气力输送管 → 料仓
  pipe(PX + 3.2, Y0 + 1.3, PZ, PX + 3.2, Y0 + 10.5, PZ, 0.08, M.pe); pipe(PX + 3.2, Y0 + 10.5, PZ, PX + 3.2, Y0 + 10.5, 7.5, 0.08, M.pe);
  // 料仓 ×2(硫混凝土/打印,Ø4 × 9 m,锥底 + 下料阀 oscillator)
  const silos = [];
  for (const sx of [21.5, 27.5]) {
    const sb = cyl(2.0, 2.0, 6.5, M.white, sx, Y0 + 5.75, 7.5, 28); sb.name = 'silo_body_' + sx;
    const sc = cyl(2.0, 0.3, 2.2, M.white, sx, Y0 + 1.4, 7.5, 28); sc.name = 'silo_cone_' + sx;
    cyl(2.15, 2.15, 0.2, M.grey, sx, Y0 + 9.1, 7.5, 28);
    for (const a of [0, 1, 2, 3]) box(0.25, 2.5, 0.25, M.iron, sx + Math.cos(a * Math.PI / 2 + 0.785) * 1.9, Y0 + 1.25, 7.5 + Math.sin(a * Math.PI / 2 + 0.785) * 1.9);
    const valve = box(0.5, 0.35, 0.5, M.orange, sx, Y0 + 0.28, 7.5); valve.name = 'silo_valve_' + sx; silos.push(valve);
    oscillators.push({ node: valve.name, axis: 'y', prop: 'rotation', amp: 0.6, period: 5 + (sx - 21.5) / 3 });
    box(0.25, 0.25, 0.25, ledMat, sx + 2.05, Y0 + 8.6, 7.5);
  }
  pipe(21.5, Y0 + 10.5, 7.5, 27.5, Y0 + 10.5, 7.5, 0.08, M.pe);
  railing(19.3, 10.2, 29.7, 10.2, Y0 + 9.2); ladder(21.5, 9.6, Y0, Y0 + 9.2); box(11, 0.1, 1.2, M.grey, 24.5, Y0 + 9.15, 9.7);
  // 装袋台 + 托盘上的粒料袋(出厂形态)+ 拖车
  box(3, 0.4, 2, M.grey, 24.5, Y0 + 0.2, 12.5);
  for (let i = 0; i < 6; i++) box(0.55, 0.32, 0.4, M.pe, 23.4 + (i % 3) * 0.7, Y0 + 0.4 + 0.18 + Math.floor(i / 3) * 0.34, 12.5);

  // ---------- 7. 副产:O₂ 出厂管 + 丙烯集气 + 辐射板场(棚后,−Z 侧)(账 2/4) ----------
  pipe(-13, Y0 + 5.5, -12.2, -13, Y0 + 1.0, -12.2, 0.10, M.o2); pipe(-13, Y0 + 1.0, -12.2, -13, Y0 + 1.0, -21, 0.10, M.o2);
  box(0.5, 0.5, 0.5, M.o2, -13, Y0 + 1.0, -21.2);                       // O₂ 短接管停在门口(→ res-cryo-01 / 氧网)
  pipe(10.3, Y0 + 2.0, -13.6, 10.3, Y0 + 2.0, -21, 0.07, M.olefin); box(0.5, 0.5, 0.5, M.olefin, 10.3, Y0 + 2.0, -21.2);   // 丙烯接口(去向未定)
  pipe(-19, Y0 + 5.5, -8, -19, Y0 + 5.5, -12.5, 0.08, M.grey);
  // 辐射板场:6 × (6 × 3 m) 倾 70° 朝北一排,108 m²(账 2 缩放到 50 kg/sol)
  const rad = new THREE.Group(); rad.position.set(0, Y0, -19); group.add(rad);
  for (let i = 0; i < 6; i++) {
    const x = -17.5 + i * 7;
    const p = box(6, 3, 0.12, M.radiator, x, 2.0, 0, rad); p.rotation.x = -(Math.PI / 2 - 70 * Math.PI / 180);
    beam(x - 2.6, 0, 1.0, x - 2.6, 3.4, -0.5, 0.12, M.iron, rad); beam(x + 2.6, 0, 1.0, x + 2.6, 3.4, -0.5, 0.12, M.iron, rad);
    box(0.5, 0.1, 0.5, M.grey, x - 2.6, 0.05, 1.0, rad); box(0.5, 0.1, 0.5, M.grey, x + 2.6, 0.05, 1.0, rad);
  }
  pipe(-20.5, 0.35, -0.6, 20.5, 0.35, -0.6, 0.09, M.dark, rad);         // 底部集管
  box(1.6, 0.8, 1.0, M.steel, 0, 0.4, 1.8, rad);                        // 工质泵撬
  railing(-21, -17.2, 21, -17.2, Y0);

  // ---------- 8. 控制间(唯一增压体,打印土壳)+ 气闸 + 中控屏(前场右侧)(账 4) ----------
  const CR = { x: -18, z: 11 };
  box(8, 3.4, 5, M.regolith, CR.x, Y0 + 1.7, CR.z);
  box(8.4, 0.35, 5.4, M.regolith, CR.x, Y0 + 3.55, CR.z); box(8.6, 0.2, 5.6, M.grey, CR.x, Y0 + 0.1, CR.z);
  for (const dx of [-2.4, 0, 2.4]) { box(1.2, 0.9, 0.1, winMat, CR.x + dx, Y0 + 2.0, CR.z + 2.55); box(1.36, 1.06, 0.06, M.dark, CR.x + dx, Y0 + 2.0, CR.z + 2.52); }
  box(2.2, 2.6, 2.2, M.white, CR.x + 5.1, Y0 + 1.3, CR.z + 1.0); door(CR.x + 5.1, CR.z + 2.11, M.whiteDust);   // 气闸
  box(0.3, 0.5, 0.3, lampMat, CR.x + 5.1, Y0 + 2.75, CR.z + 2.3);
  cyl(0.12, 0.12, 2.0, M.grey, CR.x - 3.5, Y0 + 4.7, CR.z - 1.5, 10); box(0.6, 0.6, 0.6, M.grey, CR.x - 3.5, Y0 + 5.8, CR.z - 1.5);   // 进风口(≥30 m 离 CO/甲醇,朝 +Z 场外)
  // 户外中控屏:全线流程 mimic(路线卡锚)
  box(4.2, 2.6, 0.3, M.grey, -6, Y0 + 2.2, 13); box(4.4, 0.4, 0.9, M.grey, -6, Y0 + 3.7, 12.8); box(0.3, 0.9, 0.3, M.grey, -7.5, Y0 + 0.45, 13); box(0.3, 0.9, 0.3, M.grey, -4.5, Y0 + 0.45, 13);
  box(3.9, 2.3, 0.06, screenMat, -6, Y0 + 2.2, 13.18);
  const mimic = [[M.co2, -7.6], [M.h2, -7.0], [M.meoh, -6.4], [M.olefin, -5.8], [M.pe, -5.2], [M.o2, -4.6]];
  for (const [mt, x] of mimic) box(0.4, 0.4, 0.04, mt, x, Y0 + 2.6, 13.22);
  for (let i = 0; i < 5; i++) box(0.22, 0.04, 0.03, M.white, -7.3 + i * 0.6, Y0 + 2.6, 13.22);
  for (let i = 0; i < 6; i++) box(0.12, 0.12, 0.03, ledMat, -7.6 + i * 0.6, Y0 + 1.9, 13.22);

  // ---------- 9. 放空立管(blink 信标)+ 进口件木箱(造还是运的锚) ----------
  cyl(0.18, 0.18, 12, M.grey, -25, Y0 + 6, -14, 12); cyl(0.3, 0.18, 0.5, M.orange, -25, Y0 + 12.2, -14, 12);
  const beacon = box(0.3, 0.3, 0.3, beaconMat, -25, Y0 + 12.6, -14);
  for (const s of [-1, 1]) beam(-25, Y0 + 8, -14, -25 + s * 2.2, Y0, -14, 0.08, M.grey);
  box(3.0, 1.6, 2.0, M.whiteDust, -14, Y0 + 0.8, 14); box(3.1, 0.12, 2.1, M.dark, -14, Y0 + 1.66, 14);
  for (let i = 0; i < 3; i++) box(0.12, 1.6, 2.1, M.dark, -15.2 + i * 1.2, Y0 + 0.8, 14);
  box(1.0, 0.5, 0.05, M.orange, -14, Y0 + 0.9, 15.03);                 // 进口件箱:10 t/线(账 5)
  box(1.4, 1.0, 1.2, M.whiteDust, -10.5, Y0 + 0.5, 14.5); box(1.5, 0.1, 1.3, M.dark, -10.5, Y0 + 1.05, 14.5);   // 催化剂桶架

  // ---------- 10. 场地灯柱 ----------
  for (const [x, z] of [[-24, 8], [30, -14], [30, 14]]) { cyl(0.08, 0.1, 7, M.grey, x, Y0 + 3.5, z, 8); box(0.5, 0.2, 0.3, lampMat, x, Y0 + 7.0, z); lights.push({ color: 0xffd9a0, pos: [x, Y0 + 6.8, z], range: 30 }); }

  // ---------- POI 锚点(静态,10 张卡) ----------
  const anchor = (n, x, y, z) => { const a = new THREE.Object3D(); a.name = n; a.position.set(x, y, z); group.add(a); };
  anchor('poi_route', -6, Y0 + 3.2, 13);
  anchor('poi_syngas', -16.5, Y0 + 3.6, -8);
  anchor('poi_methanol', -6, Y0 + 6.8, -8);
  anchor('poi_mto', 1.8, Y0 + 8.9, -8);
  anchor('poi_separation', 8.5, Y0 + 10.6, -10);
  anchor('poi_polymer', 15, Y0 + 11.2, -8);
  anchor('poi_pellets', 24.5, Y0 + 9.6, 7.5);
  anchor('poi_byproducts', -5, Y0 + 3.6, -19);
  anchor('poi_safety', -18, Y0 + 4.2, 11);
  anchor('poi_make', -14, Y0 + 2.2, 14);

  // ---------- 尘膜 pass ----------
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.whiteDust, M.whiteDS, M.pad, M.padDS, M.grey, M.greyDS, M.orange, M.steel, M.iron, M.ironDS, M.rockwool, M.pe, M.peDS, M.regolith, M.radiator].forEach(m => m.color.lerp(dust, 0.05));

  group.userData.spinners = spinners;                 // 合成气/制冷/循环压缩机飞轮、挤出螺杆、切粒头
  group.userData.oscillators = oscillators;           // 料仓下料阀往复
  group.userData.nightMats = [winMat, ledMat, lampMat, bedMat, soxeMat, screenMat];
  group.userData.blinkMats = [beaconMat];
  group.userData.lights = lights;
  void beacon; void silos;
  return group;
}
