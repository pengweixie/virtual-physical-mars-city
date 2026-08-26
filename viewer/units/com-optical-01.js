// com-optical-01 — 深空光通信终端(1550 nm 下行 20 W / 40 cm 跟踪望远镜 / SNSPD 光子计数)
// 契约 MODELS.md §4:1u=1m、原点=基座地面点、+Y 上、正面朝 +Z、THREE 由查看器传入。
// 动画全部声明式(oscillators/blinkMats/nightMats),无 animate。
// 设计真源 E:\Claude\mars-optical(十三本账 42 闸全绿,程序化清点):2.67 AU 净 52 Mbps /
// 0.38 AU 封顶 832 Mbps;长期可用率 93.3%(τ 时序蒙卡)→ 定位=科学回传高速斜坡,主链路永远是射频。

export const meta = {
  id: 'com-optical-01',
  name: '深空光通信终端',
  name_en: 'Deep-Space Optical Terminal',
  size_m: 17.15,           // 实测包围盒长边(validate 实测:x15.06 y11.35 z17.15)
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

const COL = {
  white: 0xe9ebec, steel: 0x8a9098, dark: 0x565b61, orange: 0xe8621f,
  tube: 0xdfe3e6, shell: 0xcfd4d8, gold: 0xcaa24a, copper: 0x9a6a3a,
  box: 0x6a6f74, pad: 0x6f635a, osr: 0x23282e, glow: 0xffd9a0,
  beacon: 0xff2a1e, pv: 0x1b2a49, green: 0x3f7a52, honey: 0xb99a63,
};

export function build(THREE) {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group();
  root.name = meta.id;
  const nightMats = [], blinkMats = [];

  let _seed = 20260819;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };

  const matte = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.08, ...extra });
  const M = {
    white: matte(COL.white, { roughness: 0.85 }),
    tube: matte(COL.tube, { roughness: 0.6, metalness: 0.2 }),
    shell: matte(COL.shell, { roughness: 0.7, metalness: 0.15, side: THREE.DoubleSide }),
    steel: matte(COL.steel, { metalness: 0.35, roughness: 0.6 }),
    dark: matte(COL.dark, { metalness: 0.35, roughness: 0.65 }),
    orange: matte(COL.orange),
    gold: matte(COL.gold, { metalness: 0.55, roughness: 0.45 }),
    copper: matte(COL.copper, { metalness: 0.6, roughness: 0.5 }),
    box: matte(COL.box, { metalness: 0.25 }),
    pad: matte(COL.pad, { roughness: 1.0 }),
    osr: matte(COL.osr, { metalness: 0.4, roughness: 0.35 }),
    pv: matte(COL.pv, { metalness: 0.5, roughness: 0.35 }),
    green: matte(COL.green),
    honey: matte(COL.honey, { roughness: 0.98, metalness: 0.05 }),
    shellIn: matte(0xa8adb2, { roughness: 0.8, metalness: 0.15, side: THREE.DoubleSide }),
  };
  const winMat = new THREE.MeshStandardMaterial({
    color: COL.glow, emissive: COL.glow, emissiveIntensity: 0.3, roughness: 0.4 });
  nightMats.push(winMat);
  const ledGreen = new THREE.MeshStandardMaterial({
    color: 0x46ff92, emissive: 0x46ff92, emissiveIntensity: 0.35, roughness: 0.4 });
  nightMats.push(ledGreen);
  const ledAmber = new THREE.MeshStandardMaterial({
    color: 0xffb020, emissive: 0xcc8010, emissiveIntensity: 2.0, roughness: 0.4 });
  blinkMats.push(ledAmber);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: COL.beacon, emissive: 0xff2a1a, emissiveIntensity: 2.0, roughness: 0.4 });
  blinkMats.push(beaconMat);
  // 夜景:上行信标光柱(沿光轴一束极细的 1550 nm 出光,克制)
  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x2a140a, emissive: 0xff7040, emissiveIntensity: 0.0, transparent: true,
    opacity: 0.10, depthWrite: false, side: THREE.DoubleSide });
  nightMats.push(beamMat);

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
    (parent || root).add(m); return m;
  };
  const cyl = (r1, r2, h, mat, x, y, z, seg, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 16), mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
    (parent || root).add(m); return m;
  };
  const strut = (a, b, r, mat, parent) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 8), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
    m.castShadow = true; (parent || root).add(m); return m;
  };
  const poi = (name, x, y, z, parent) => {
    const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z);
    (parent || root).add(o); return o;
  };

  // ════ 1. 望远镜围壁 + 烧结圆坪(中心 (0,0,-2.2)) ════
  const TC = V3(0, 0, -2.2);                     // 望远镜组中心
  const padMesh = cyl(3.2, 3.4, 0.24, M.pad, TC.x, 0.12, TC.z, 40);
  padMesh.receiveShadow = true;
  // 环形围壁(挡近地尘幕,顶缘泛白)
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.2, 1.35, 32, 1, true), M.white);
  wall.position.set(TC.x, 0.9, TC.z); wall.castShadow = wall.receiveShadow = true; root.add(wall);
  const wallIn = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 1.3, 32, 1, true),
    matte(0x9aa0a5, { side: THREE.BackSide }));
  wallIn.position.set(TC.x, 0.9, TC.z); root.add(wallIn);
  const wallCap = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.09, 8, 32), M.steel);
  wallCap.rotation.x = Math.PI / 2; wallCap.position.set(TC.x, 1.58, TC.z); root.add(wallCap);

  // ════ 2. 蛤壳护尘罩 ×2(夹层瓣 + 连续铰链条,oscillator 缓慢开合呼吸) ════
  //     开合围绕「全开」基准 ±7°,任意相位都不进镜筒包络(全循环扫描验证)。
  //     构型由 o10 COMSOL 壳模态判决:裸 3 mm 铝一阶仅 7.99 Hz,距 25 m/s 涡脱
  //     6.25 Hz 只有 1.28× —— 共振区,不合格;定版 0.6 mm 蒙皮 + 20 mm 蜂窝芯
  //     夹层(一阶 45.2 Hz = 7.2×)。故此处刻意做成「看得见的夹层」:双层壳面 +
  //     瓣缘封边露芯 + 加粗环肋 + 径向肋。rim 连续铰链条同样是账的产物(模型边界
  //     = rim 全固支 → 两点铰链不许用)。
  const mkShell = (sx, name) => {
    const hinge = new THREE.Group(); hinge.name = name;
    hinge.position.set(TC.x + sx * 2.05, 1.55, TC.z);
    const phiS = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    // 夹层双层壳:外蒙皮 R=2.00 / 内蒙皮 R=1.979(20.6 mm 夹层厚度,真实米制)
    const skinOut = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 26, 10, phiS, Math.PI, 0, Math.PI / 2), M.shell);
    skinOut.position.set(-sx * 2.05, 0, 0); skinOut.castShadow = true;
    hinge.add(skinOut);
    const skinIn = new THREE.Mesh(
      new THREE.SphereGeometry(1.9794, 20, 8, phiS, Math.PI, 0, Math.PI / 2), M.shellIn);
    skinIn.position.set(-sx * 2.05, 0, 0);
    hinge.add(skinIn);
    // 瓣缘封边条(rim 与子午缘):把「这是夹层板不是铁皮」摆到边上给人看
    const edgeRim = new THREE.Mesh(new THREE.TorusGeometry(1.988, 0.026, 6, 26, Math.PI), M.honey);
    edgeRim.rotation.y = sx * (Math.PI / 2);
    edgeRim.position.set(-sx * 2.05, 0, 0);
    hinge.add(edgeRim);
    const edgeMer = new THREE.Mesh(new THREE.TorusGeometry(1.988, 0.026, 6, 20, Math.PI), M.honey);
    edgeMer.rotation.x = Math.PI / 2; edgeMer.rotation.z = -Math.PI / 2;
    edgeMer.position.set(-sx * 2.05, 0, 0);
    hinge.add(edgeMer);
    // 环肋 ×2(加粗:o10 判决后它们是合格线不是装饰)+ 径向肋 ×3
    for (let i = 0; i < 2; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.96, 0.07, 6, 20, Math.PI), M.steel);
      rib.rotation.y = sx * (Math.PI / 2);
      rib.rotation.z = (i - 0.5) * 0.62;
      rib.position.set(-sx * 2.05, 0, 0);
      hinge.add(rib);
    }
    for (let k = 0; k < 3; k++) {
      const a = (k - 1) * 0.55;
      const rrib = new THREE.Mesh(new THREE.TorusGeometry(1.955, 0.05, 6, 14, Math.PI / 2.1), M.steel);
      rrib.rotation.z = sx * Math.PI / 2;
      rrib.rotation.x = a + (sx > 0 ? 0 : Math.PI);
      rrib.position.set(-sx * 2.05, 0, 0);
      hinge.add(rrib);
    }
    hinge.rotation.z = -sx * 2.55;              // 全开基准(~146° 外翻,壳瓣挂在围壁外侧)
    root.add(hinge);
    return hinge;
  };
  mkShell(1, 'shellR'); mkShell(-1, 'shellL');
  // 连续铰链条(沿 rim 弧,非两点铰链——o10 的模型边界即设计要求)+ 分布锁扣
  [-1, 1].forEach(sx => {
    for (let k = 0; k < 5; k++) {
      const a = (k - 2) * 0.30;
      const knu = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 10), M.dark);
      knu.rotation.x = Math.PI / 2;
      knu.position.set(TC.x + sx * 2.1, 1.55, TC.z + a * 2.0);
      root.add(knu);                                        // 铰链节(共轴一条线)
      if (k % 2 === 0)                                      // 开位锁扣(隔一布一)
        box(0.16, 0.2, 0.16, M.orange, TC.x + sx * 2.2, 1.78, TC.z + a * 2.0);
    }
    // 铰链条基梁
    box(0.16, 0.14, 2.6, M.steel, TC.x + sx * 2.1, 1.38, TC.z);
  });
  poi('poi_shell', TC.x - 2.1, 1.7, TC.z);

  // ════ 3. 方位-俯仰跟踪望远镜(40 cm) ════
  const optAz = new THREE.Group(); optAz.name = 'optAz';
  optAz.position.set(TC.x, 0.24, TC.z); root.add(optAz);
  cyl(0.62, 0.75, 0.9, M.steel, 0, 0.45, 0, 24, optAz);            // 基墩
  const gear = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.07, 8, 28), M.dark);
  gear.rotation.x = Math.PI / 2; gear.position.y = 0.2; optAz.add(gear);
  // 叉臂 ×2
  [-1, 1].forEach(s => {
    box(0.22, 1.15, 0.34, M.tube, s * 0.5, 1.45, 0, optAz);
    box(0.3, 0.16, 0.42, M.dark, s * 0.5, 2.06, 0, optAz);
  });
  cyl(0.12, 0.12, 1.24, M.dark, 0, 2.0, 0, 12, optAz).rotation.z = Math.PI / 2;   // 俯仰轴
  // 伺服电机盒(方位/俯仰)
  box(0.34, 0.3, 0.3, M.orange, 0.72, 0.7, 0.3, optAz);
  box(0.26, 0.26, 0.26, M.orange, -0.58, 2.0, 0.28, optAz);
  poi('poi_mountdrv', 0.72, 0.7, 0.3, optAz);

  const optEl = new THREE.Group(); optEl.name = 'optEl';
  optEl.position.set(0, 2.0, 0); optAz.add(optEl);
  // 镜筒(Ø0.56×1.7,光轴=本地 +Z)
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.7, 24), M.tube);
  tube.rotation.x = Math.PI / 2; tube.castShadow = true; optEl.add(tube);
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.5, 24, 1, true), M.dark);
  hood.rotation.x = Math.PI / 2; hood.position.z = 1.0; optEl.add(hood);          // 遮光罩
  const aper = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24),
    matte(0x101418, { metalness: 0.6, roughness: 0.2 }));
  aper.position.z = 0.86; optEl.add(aper);                                        // 入瞳(黑镜面)
  cyl(0.3, 0.32, 0.28, M.steel, 0, 0, 0, 24, optEl).rotation.x = Math.PI / 2;     // 中环抱箍
  // 后端箱:FSM/分束/收发合一(激光进+SNSPD 光纤出)
  box(0.5, 0.44, 0.5, M.box, 0, 0, -1.1, optEl);
  box(0.2, 0.16, 0.1, M.copper, 0.18, 0.14, -1.38, optEl);                        // 点前 FSM 驱动
  const trkLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), ledGreen);
  trkLed.position.set(-0.16, 0.16, -1.36); optEl.add(trkLed);                     // 精跟锁定灯
  const bcnLed = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), ledAmber);
  bcnLed.position.set(0, 0.3, -1.1); optEl.add(bcnLed);                           // 信标捕获指示(闪)
  // 光纤走线(后端箱 → 俯仰轴 → 叉臂)
  strut(V3(0, -0.2, -1.3), V3(0, -0.55, -0.5), 0.03, M.gold, optEl);
  strut(V3(0, -0.55, -0.5), V3(0.45, -0.9, 0), 0.03, M.gold, optEl);
  // 夜景:上行信标光柱(沿光轴,极细,克制)
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 10, 10, 1, true), beamMat);
  beam.rotation.x = Math.PI / 2; beam.position.z = 6.0; optEl.add(beam);
  optEl.rotation.x = -0.96;                    // 基准仰角 ~55°(对地球方向,振荡绕此)
  poi('poi_scope', 0, 0.4, 0.6, optEl);
  poi('poi_paa', 0, 0, -1.15, optEl);

  // ════ 4. SNSPD 制冷小间(剖切:三面墙+顶,开口朝 +Z 露制冷机与光纤链) ════
  const CB = V3(-4.6, 0, 1.6);
  box(4.2, 0.25, 3.0, M.pad, CB.x, 0.125, CB.z);                                  // 基座
  box(4.2, 2.6, 0.24, M.white, CB.x, 1.55, CB.z - 1.38);                          // 背墙(北)
  box(0.24, 2.6, 3.0, M.white, CB.x - 1.98, 1.55, CB.z);                          // 侧墙 ×2
  box(0.24, 2.6, 3.0, M.white, CB.x + 1.98, 1.55, CB.z);
  box(4.4, 0.22, 3.2, M.white, CB.x, 2.96, CB.z);                                 // 顶盖
  box(0.24, 2.6, 0.24, M.white, CB.x - 1.98, 1.55, CB.z + 1.38);                  // 开口面边柱
  box(0.24, 2.6, 0.24, M.white, CB.x + 1.98, 1.55, CB.z + 1.38);
  box(4.5, 0.12, 3.3, M.steel, CB.x, 0.28, CB.z);                                 // 底裙边
  // 杜瓦:金色恒温器,三级色环(4 K → 1 K 吸附级 → SNSPD 焦面)
  const dewar = cyl(0.42, 0.42, 1.5, M.gold, CB.x - 0.9, 1.15, CB.z + 0.2, 22);
  cyl(0.46, 0.46, 0.1, M.steel, CB.x - 0.9, 0.45, CB.z + 0.2, 22);
  cyl(0.34, 0.34, 0.12, M.copper, CB.x - 0.9, 1.95, CB.z + 0.2, 18);             // 4 K 级
  cyl(0.26, 0.26, 0.1, M.white, CB.x - 0.9, 2.06, CB.z + 0.2, 16);               // 1 K 吸附级
  cyl(0.16, 0.3, 0.24, M.dark, CB.x - 0.9, 2.24, CB.z + 0.2, 16);                // 脉管冷头
  // 光纤链:望远镜方向进墙 → 杜瓦顶(尘密封穿墙套管)
  strut(V3(CB.x + 1.98, 1.1, CB.z + 0.9), V3(CB.x + 0.4, 1.6, CB.z + 0.5), 0.045, M.gold);
  strut(V3(CB.x + 0.4, 1.6, CB.z + 0.5), V3(CB.x - 0.75, 2.3, CB.z + 0.2), 0.045, M.gold);
  cyl(0.09, 0.09, 0.3, M.orange, CB.x + 2.0, 1.1, CB.z + 0.92, 10).rotation.z = Math.PI / 2;
  // 读出电子学机柜 + 氦气瓶 ×2(链条锁墙位,闭循环纪律)
  box(0.8, 1.5, 0.6, M.box, CB.x + 1.2, 0.95, CB.z - 0.7);
  const rdLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), ledGreen);
  rdLed.position.set(CB.x + 1.2, 1.5, CB.z - 0.38); root.add(rdLed);
  [0, 1].forEach(i => cyl(0.14, 0.14, 0.9, M.green, CB.x + 0.3 + i * 0.36, 0.75, CB.z - 1.1, 12));
  poi('poi_snspd', CB.x - 0.9, 1.6, CB.z + 0.2);
  // 辐射排热面(o06:需 12.1 m²,设计 15 m²):北墙 OSR 板 + 顶板
  for (let i = 0; i < 4; i++)
    box(0.96, 2.3, 0.08, M.osr, CB.x - 1.53 + i * 1.02, 1.6, CB.z - 1.56);
  for (let i = 0; i < 3; i++) {
    const rp = box(1.3, 0.06, 1.5, M.osr, CB.x - 1.35 + i * 1.35, 3.12, CB.z - 0.5);
    rp.rotation.x = -0.18;
  }
  poi('poi_power', CB.x, 2.2, CB.z - 1.6);

  // 压缩机撬块(独立基座 + 绿色弹性垫——o03:为像质,顺带合规 1000×)
  const CS = V3(-4.6, 0, 4.4);
  box(1.6, 0.2, 1.1, M.pad, CS.x, 0.1, CS.z);
  [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].forEach(([dx, dz]) =>
    box(0.18, 0.1, 0.18, M.green, CS.x + dx, 0.25, CS.z + dz));
  box(1.2, 0.75, 0.8, M.box, CS.x, 0.68, CS.z);
  for (let i = 0; i < 4; i++)
    box(0.02, 0.6, 0.7, M.steel, CS.x + 0.62, 0.68, CS.z - 0.26 + i * 0.17);
  strut(V3(CS.x - 0.3, 1.05, CS.z - 0.4), V3(CB.x - 0.5, 2.3, CB.z + 1.2), 0.05, M.steel);
  strut(V3(CS.x + 0.3, 1.05, CS.z - 0.4), V3(CB.x - 0.2, 2.2, CB.z + 1.3), 0.05, M.steel);
  poi('poi_cryo', CS.x, 0.9, CS.z);

  // ════ 5. 电子间(调制解调/基带/授时;EMC 屏蔽壳) ════
  const EB = V3(4.4, 0, 1.6);
  box(3.2, 0.25, 2.7, M.pad, EB.x, 0.125, EB.z);
  box(3.0, 2.4, 2.4, M.white, EB.x, 1.45, EB.z - 0.1);
  box(3.2, 0.18, 2.6, M.steel, EB.x, 2.72, EB.z - 0.1);                           // 顶压条
  box(3.3, 0.12, 2.8, M.steel, EB.x, 0.31, EB.z - 0.1);                           // 底裙边
  // 密封门(框+扇+闩+双铰链,朝 +Z 步道)
  box(1.02, 1.96, 0.07, M.orange, EB.x - 0.5, 1.25, EB.z + 1.14);
  box(0.86, 1.8, 0.09, M.white, EB.x - 0.5, 1.25, EB.z + 1.11);
  box(0.1, 0.24, 0.08, M.dark, EB.x - 0.2, 1.24, EB.z + 1.17);
  box(0.12, 0.1, 0.06, M.dark, EB.x - 0.85, 1.85, EB.z + 1.15);
  box(0.12, 0.1, 0.06, M.dark, EB.x - 0.85, 0.66, EB.z + 1.15);
  // 夜窗 ×2 + 状态灯(绿=链路,琥珀闪=τ>3 尘暴切换预告——sci-weather 联动)
  [0.55, 1.05].forEach(dx => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.36), winMat);
    w.position.set(EB.x + dx, 1.6, EB.z + 1.111); root.add(w);
  });
  const lnkLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), ledGreen);
  lnkLed.position.set(EB.x + 0.8, 2.15, EB.z + 1.13); root.add(lnkLed);
  const tauLed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), ledAmber);
  tauLed.position.set(EB.x + 1.0, 2.15, EB.z + 1.13); root.add(tauLed);
  // 外墙导管 ×2 + 接线箱(工业细节语法)
  cyl(0.05, 0.05, 1.8, M.steel, EB.x + 1.52, 1.2, EB.z + 0.4, 8);
  cyl(0.05, 0.05, 1.4, M.steel, EB.x + 1.52, 1.0, EB.z - 0.5, 8);
  box(0.2, 0.5, 0.4, M.box, EB.x + 1.56, 0.55, EB.z + 0.0);
  poi('poi_modem', EB.x, 1.5, EB.z);
  // 波导/光纤桥架:电子间 → 望远镜围壁(离地 0.5)
  strut(V3(EB.x - 1.5, 0.5, EB.z), V3(TC.x + 2.2, 0.5, TC.z + 0.6), 0.06, M.gold);
  strut(V3(TC.x + 2.2, 0.5, TC.z + 0.6), V3(TC.x + 0.8, 0.5, TC.z + 0.2), 0.06, M.gold);

  // ════ 6. 尘密封步道(电子间门 → +Z 路网方向)+ 护栏 ════
  const walk = box(1.5, 0.16, 4.6, M.steel, EB.x - 0.5, 0.32, EB.z + 3.6);
  walk.receiveShadow = true;
  for (let i = 0; i < 4; i++) {
    const z = EB.z + 1.6 + i * 1.3;
    [-0.72, 0.72].forEach(sx => strut(V3(EB.x - 0.5 + sx, 0.4, z), V3(EB.x - 0.5 + sx, 1.3, z), 0.035, M.orange));
  }
  [-0.72, 0.72].forEach(sx =>
    strut(V3(EB.x - 0.5 + sx, 1.3, EB.z + 1.6), V3(EB.x - 0.5 + sx, 1.3, EB.z + 5.5), 0.035, M.orange));
  // 联络步道:电子间 ↔ 制冷小间前
  box(1.2, 0.14, 1.6, M.steel, 0.2, 0.3, 1.9);
  box(1.2, 0.14, 6.0, M.steel, -1.9, 0.3, 1.9).rotation.y = Math.PI / 2;

  // ════ 7. 门口短接:接入柜 + 电缆沟头(走廊本体归总控,HANDOFF 写明) ════
  const JB = V3(4.9, 0, 6.6);
  box(0.7, 0.9, 0.5, M.orange, JB.x, 0.45, JB.z);
  box(0.76, 0.08, 0.56, M.dark, JB.x, 0.94, JB.z);
  box(0.5, 0.2, 2.4, M.dark, JB.x, 0.1, JB.z + 1.6);                              // 沟头短段
  cyl(0.1, 0.1, 2.4, M.steel, JB.x, 0.18, JB.z + 1.6, 8).rotation.x = Math.PI / 2;
  strut(V3(EB.x + 1.56, 0.3, EB.z + 0.2), V3(JB.x, 0.4, JB.z - 0.3), 0.05, M.copper);
  poi('poi_site', JB.x, 0.8, JB.z);

  // ════ 8. 信标桅杆(航空障碍,红闪)+ 太阳光度计互引位 ════
  const BM = V3(-6.9, 0, -4.6);
  strut(V3(BM.x, 0, BM.z), V3(BM.x, 5.2, BM.z), 0.11, M.dark);
  [[1.6, 0], [-0.8, 1.4], [-0.8, -1.4]].forEach(([gx, gz]) =>
    strut(V3(BM.x + gx, 0, BM.z + gz), V3(BM.x, 4.7, BM.z), 0.035, M.steel));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), beaconMat);
  lamp.position.set(BM.x, 5.35, BM.z); root.add(lamp);
  // τ 联动指示牌(朝向气象站方向的小天光监测头——链路调度吃 sci-weather 的 τ)
  box(0.3, 0.3, 0.3, M.box, BM.x, 1.5, BM.z);
  cyl(0.06, 0.09, 0.3, M.dark, BM.x, 1.78, BM.z, 10).rotation.x = -0.9;
  poi('poi_dust', BM.x, 1.6, BM.z);
  poi('poi_day', TC.x, 3.3, TC.z);

  // ════ 9. 作业痕迹 + 散落砾石 + 尘膜 pass ════
  box(0.5, 0.03, 5.5, matte(0x74513a), 2.6, 0.03, 4.2);
  box(0.5, 0.03, 5.5, matte(0x74513a), 4.1, 0.03, 4.2);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2, d = 4.5 + rnd() * 3.5, s = 0.08 + rnd() * 0.12;
    const rock = new THREE.Mesh(rockGeo, matte(rnd() < 0.5 ? 0x8a5a3c : 0x74513a));
    rock.position.set(Math.cos(a) * d, -0.3 * s + 1.62 * s * 0.55, Math.sin(a) * d - 1);
    rock.scale.set(s, s * 0.55, s);
    rock.rotation.y = rnd() * 6.28;
    root.add(rock);
  }
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.tube, M.shell, M.steel, M.orange, M.box, M.pad, M.pv].forEach(m => m.color.lerp(dust, 0.05));

  // ════ 声明式接线(MODELS.md §4) ════
  root.userData.nightMats = nightMats;
  root.userData.blinkMats = blinkMats;
  root.userData.lights = [{ color: 0xffd9a0, pos: [4.4, 3.2, 2.4], range: 26 }];
  root.userData.oscillators = [
    { node: 'optAz', axis: 'y', amp: 0.42, period: 170 },              // 方位慢跟踪 ±24°
    { node: 'optEl', axis: 'x', amp: 0.10, period: 95, phase: 1.2 },   // 俯仰 ±5.7°(绕 55° 基准)
    { node: 'shellR', axis: 'z', amp: 0.12, period: 36 },              // 护罩呼吸(全开 ±7°)
    { node: 'shellL', axis: 'z', amp: 0.12, period: 36, phase: Math.PI }, // 对称相位
  ];

  return root;
}
