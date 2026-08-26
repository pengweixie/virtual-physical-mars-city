// sci-astro-01 天体生物学实验室
// 设计册:E:\Claude\mars-astro（五十本账 L2–L50 闸全绿 + L1 COSPAR 选址闸）
// 形态:洁净分析翼(白,开口手套箱:NeCu空心阴极+长通滤光+DUV CCD光谱仪+拉曼扫描台双路+标定靶/两台炉+GC程序升温+EPC+衍生化锈色粒与氨基酸微粒+东炉上的衍生化杯+谱图旁白瓶标准品+MTBSTFA 1+1安瓿+地球氦瓶+毛细限流+EI双灯丝1+1+四极扫描+SIM驻留针+先扫后钉+未接电双杯+真空罐内通道倍增器1+1灌封穿墙+涡轮穿舱/钢柱单峰+青柱双峰+Chirasil 1+1备件匣/免疫三列+LDChip 1+1密封匣/见证管5支切封)
//      + 负压样品核(暗青,双 HEPA 褶皱栈)+ 半埋岩芯库（每孔浅赭深青） + 双门传递窗与钛罐 + 残样进核罐孔 + 西墙人气闸（坪口不是气闸）+ 城廊短接对接环（朝城不是走出去） + 桅杆采样头（开口+滤盒，不是 ISO 5） + 交接坪接罐柜（不是开管） + 屋顶白筒正压外泄（白口不是采火星气）
export const meta = {
  id: 'sci-astro-01',
  name: '天体生物学实验室',
  name_en: 'Astrobiology Laboratory',
  size_m: 39.1,
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;

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
    white:  new THREE.MeshLambertMaterial({ color: 0xdcd8d0 }),
    wDust:  new THREE.MeshLambertMaterial({ color: 0xc8c0b4 }),
    steel:  new THREE.MeshLambertMaterial({ color: 0x8a9096 }),
    dark:   new THREE.MeshLambertMaterial({ color: 0x3a3d42 }),
    orange: new THREE.MeshLambertMaterial({ color: 0xd97b2f }),
    rust:   new THREE.MeshLambertMaterial({ color: 0x8a4a2a }),
    pad:    new THREE.MeshLambertMaterial({ color: 0x4a4038 }),
    conc:   new THREE.MeshLambertMaterial({ color: 0x8a8074 }),
    berm:   new THREE.MeshLambertMaterial({ color: 0x7a5340 }),
    core:   new THREE.MeshLambertMaterial({ color: 0x2c4a52 }),   // 负压核外壳
    core2:  new THREE.MeshLambertMaterial({ color: 0x3a5c64 }),
    glass:  new THREE.MeshLambertMaterial({ color: 0x9bb8c8, transparent: true, opacity: 0.35 }),
    ti:     new THREE.MeshLambertMaterial({ color: 0xb8b0a4 }),   // 样品管钛
    raman:  new THREE.MeshLambertMaterial({ color: 0x6a7ec8 }),   // L1 拉曼
    gcms:   new THREE.MeshLambertMaterial({ color: 0xd4a03a }),   // L2 GC-MS
    immuno: new THREE.MeshLambertMaterial({ color: 0x3aa090 }),   // L3 免疫
    he:     new THREE.MeshLambertMaterial({ color: 0x5c2e22 }),   // 地球进口氦瓶（工业棕，不是火星锈）
    iso:    new THREE.MeshLambertMaterial({ color: 0xe8e4dc }),   // 翼内未蒙尘白（ISO 5 箱区）
    gown:   new THREE.MeshLambertMaterial({ color: 0xb8b4ae }),   // ISO 7 更衣，不蒙尘
    hall:   new THREE.MeshLambertMaterial({ color: 0xd4d0c8 }),   // ISO 6 走廊，不蒙尘
    media:  new THREE.MeshLambertMaterial({ color: 0xf2efe6 }),   // HEPA 滤材，不蒙尘
  };
  const G = {
    lamp:   new THREE.MeshLambertMaterial({ color: 0xffe8c0, emissive: 0xffc878, emissiveIntensity: 0.55 }),
    isoG:   new THREE.MeshLambertMaterial({ color: 0x88e0ff, emissive: 0x44c8ee, emissiveIntensity: 0.7 }),
    neg:    new THREE.MeshLambertMaterial({ color: 0x44dd88, emissive: 0x22bb55, emissiveIntensity: 0.85 }),
    pos:    new THREE.MeshLambertMaterial({ color: 0x88aaff, emissive: 0x4466dd, emissiveIntensity: 0.8 }),
    beacon: new THREE.MeshLambertMaterial({ color: 0xff3020, emissive: 0xcc1810, emissiveIntensity: 0.85 }),
    win:    new THREE.MeshLambertMaterial({ color: 0xffd9a0, emissive: 0xffb050, emissiveIntensity: 0.3 }),
    tube:   new THREE.MeshLambertMaterial({ color: 0xd8c090, emissive: 0xaa8844, emissiveIntensity: 0.25 }),
    laser:  new THREE.MeshLambertMaterial({ color: 0x88e8ff, emissive: 0x44c8ee, emissiveIntensity: 0.9 }),
    fluo:   new THREE.MeshLambertMaterial({ color: 0xa8ffee, emissive: 0x55eedd, emissiveIntensity: 1.0 }),
    hot:    new THREE.MeshLambertMaterial({ color: 0xff7a28, emissive: 0xee5510, emissiveIntensity: 0.75 }),
  };
  const nightMats = [G.lamp, G.isoG, G.neg, G.pos, G.win, G.tube, G.laser, G.fluo, G.hot];
  const blinkMats = [G.beacon];
  const spinners = [];
  const oscillators = [];

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const cyl = (rT, rB, h, mat, x, y, z, seg, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg || 12), mat);
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
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = name;
    a.position.set(x, y, z);
    group.add(a);
    return a;
  };
  const door = (x, y, z, faceZ) => {
    box(1.06, 2.02, 0.07, M.orange, x, y, z + faceZ * 0.04);
    box(0.90, 1.86, 0.09, M.white, x, y, z);
    box(0.10, 0.26, 0.08, M.dark, x + 0.32, y, z - faceZ * 0.06);
    box(0.14, 0.10, 0.06, M.dark, x - 0.37, y + 0.63, z - faceZ * 0.04);
    box(0.14, 0.10, 0.06, M.dark, x - 0.37, y - 0.62, z - faceZ * 0.04);
  };
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);

  // =====================================================================
  // 1. 交接坪（+Z）——毅力号样品管叙事锚
  // =====================================================================
  {
    box(18, 0.08, 12, M.pad, 0, 0.04, 11);
    // 防尘裙
    box(18.4, 0.18, 0.22, M.dark, 0, 0.12, 16.9);
    box(18.4, 0.18, 0.22, M.dark, 0, 0.12, 5.1);
    box(0.22, 0.18, 12.2, M.dark, -9.1, 0.12, 11);
    box(0.22, 0.18, 12.2, M.dark, 9.1, 0.12, 11);
    // 样品管交接架。账 39：5 支见证。账 42：帽在=密封。金帽/钛帽是密封件，不是整根涂金。
    box(2.4, 1.15, 0.7, M.steel, -3.2, 0.62, 14.2);
    box(2.5, 0.08, 0.8, M.dark, -3.2, 1.22, 14.2);
    for (let i = 0; i < 10; i++) {
      const x = -4.05 + i * 0.19;
      const witness = i >= 5;
      const h = witness ? 0.48 : 0.62;
      cyl(0.04, 0.04, h, witness ? G.tube : M.ti, x, 1.22 + h / 2, 14.2, 8);
      cyl(0.042, 0.038, 0.04, witness ? G.tube : M.steel, x, 1.22 + h + 0.02, 14.2, 8);
    }
    // 账 41：坪上是接罐不是开管。玻璃工作面 + 青灯把 ISO 5 涂在尘里，撤回。
    box(1.6, 1.4, 1.1, M.steel, 1.6, 0.85, 13.8);
    box(1.72, 0.08, 1.18, M.dark, 1.6, 1.58, 13.8);
    box(0.18, 0.26, 0.08, M.orange, 1.6, 1.18, 14.38);
    box(0.10, 0.10, 0.08, M.dark, 2.18, 1.48, 14.38);
    // 车辙
    box(8, 0.03, 0.45, M.rust, -1.2, 0.09, 10.2);
    box(8, 0.03, 0.45, M.rust, 0.1, 0.09, 10.2);
    poi('poi_pad', -3.2, 1.4, 14.2);
    poi('poi_why', 4.5, 1.2, 14.5);
    // 耶泽罗铭牌
    box(1.8, 1.1, 0.08, M.dark, 4.5, 1.0, 16.5);
    box(1.6, 0.85, 0.04, G.win, 4.5, 1.0, 16.56);
  }

  // =====================================================================
  // 2. 洁净分析翼（白, +Z 剖切露手套箱链）
  //    中心 (−4, 0)，14 × 10 × 5.2，开口朝 +Z（交接坪）
  // =====================================================================
  const WX = -4, WZ = 0, WW = 14, WD = 10, WH = 5.2;
  {
    const x0 = WX, z0 = WZ;
    // 三面墙 + 顶 + 开口边柱（剖切样板）
    box(WW, WH, 0.28, M.white, x0, WH / 2, z0 - WD / 2 + 0.14);          // 背墙 −Z
    box(0.28, WH, WD, M.white, x0 - WW / 2 + 0.14, WH / 2, z0);          // 西墙
    box(0.28, WH, WD, M.white, x0 + WW / 2 - 0.14, WH / 2, z0);          // 东墙（贴传递窗）
    box(WW + 0.4, 0.28, WD + 0.4, M.wDust, x0, WH + 0.14, z0);           // 顶盖
    box(WW + 0.5, 0.18, WD + 0.5, M.wDust, x0, 0.09, z0);                // 裙边
    box(0.32, WH, 0.32, M.white, x0 - WW / 2 + 0.16, WH / 2, z0 + WD / 2 - 0.16);
    box(0.32, WH, 0.32, M.white, x0 + WW / 2 - 0.16, WH / 2, z0 + WD / 2 - 0.16);
    // 顶盖压条
    for (let i = 0; i < 5; i++)
      box(0.12, 0.08, WD + 0.2, M.steel, x0 - 5.6 + i * 2.8, WH + 0.32, z0);
    // 背墙密封门（对人，对岩芯库方向。样品走传递窗，账 35）
    door(x0 - 3, 1.29, z0 - WD / 2, -1);
    // 账 44：人气闸在西墙。坪口色带当气闸，撤回。
    box(2.4, 2.8, 2.6, M.steel, -12.35, 1.5, -0.5);
    box(2.2, 0.05, 2.4, M.rust, -12.35, 0.16, -0.5);
    box(2.5, 0.12, 2.7, M.dark, -12.35, 2.96, -0.5);
    box(0.08, 2.02, 1.06, M.orange, -13.52, 1.29, -0.5);
    box(0.09, 1.86, 0.90, M.white, -13.58, 1.29, -0.5);
    box(0.08, 0.26, 0.10, M.dark, -13.62, 1.29, -0.18);
    door(x0 - WW / 2, 1.29, -0.5, -1);
    box(0.12, 0.12, 0.12, G.lamp, -12.35, 2.4, 0.55);
    // 账 46：城廊只出几米。白门对短接内；西端是对接环+封板，不是开向尘的门。
    box(2.8, 2.4, 2.2, M.steel, -14.95, 1.30, -0.5);
    box(2.6, 0.10, 2.0, M.dark, -14.95, 2.55, -0.5);
    box(2.6, 0.04, 2.0, M.hall, -14.95, 0.16, -0.5);
    cyl(0.85, 0.85, 0.18, M.orange, -16.40, 1.35, -0.5, 16).rotation.z = Math.PI / 2;
    cyl(0.72, 0.72, 0.08, M.steel, -16.52, 1.35, -0.5, 16).rotation.z = Math.PI / 2;
    box(0.06, 1.55, 1.55, M.dark, -16.62, 1.35, -0.5);
    // 西墙检修管线（气闸北侧，不穿闸）
    cyl(0.05, 0.05, 4.2, M.steel, x0 - WW / 2 - 0.12, 2.3, z0 - 2, 8);
    cyl(0.05, 0.05, 4.2, M.steel, x0 - WW / 2 - 0.12, 2.3, z0 + 2, 8);
    box(0.22, 0.5, 0.4, M.dark, x0 - WW / 2 - 0.22, 1.4, z0 + 2.4);

    // 地板 ISO 级联：更衣灰贴西门，走廊浅，箱区近白。尘膜不是级联（账 48）。
    box(1.8, 0.04, 3.2, M.gown, x0 - WW / 2 + 1.2, 0.14, -0.5);
    box(WW - 0.6, 0.04, 2.2, M.hall, x0, 0.14, z0 + 0.2);
    box(WW - 0.6, 0.04, 3.4, M.iso, x0, 0.14, z0 - 2.4);

    // ---- 手套箱链：开口壳体（实心盒会把仪器埋死）+ 箱内真仪器 ----
    const gbZ = z0 - 1.6;
    const shell = (x, roofMat, lamp) => {
      const w = 2.4, h = 1.8, d = 1.5, t = 0.06, y = 1.55;
      box(w, h, t, M.iso, x, y, gbZ - d / 2 + t / 2);
      box(t, h, d, M.iso, x - w / 2 + t / 2, y, gbZ);
      box(t, h, d, M.iso, x + w / 2 - t / 2, y, gbZ);
      box(w, t, d, M.iso, x, y - h / 2 + t / 2, gbZ);
      box(w + 0.1, 0.08, d + 0.1, roofMat, x, y + h / 2, gbZ);
      box(w, 0.22, t, M.iso, x, y - h / 2 + 0.14, gbZ + d / 2 - t / 2);
      box(w - 0.55, h - 0.55, 0.04, M.glass, x, y + 0.12, gbZ + d / 2 + 0.02);
      cyl(0.09, 0.07, 0.35, M.dark, x - 0.35, 1.45, gbZ + 0.95, 8).rotation.x = Math.PI / 2;
      cyl(0.09, 0.07, 0.35, M.dark, x + 0.35, 1.45, gbZ + 0.95, 8).rotation.x = Math.PI / 2;
      box(0.18, 0.12, 0.12, lamp, x + 0.9, 2.25, gbZ + 0.7);
    };

    // L1 拉曼：248.6 nm 两路（账 9）+ XY 扫描台（账 11）+ 标定靶（账 36）+ NeCu 空心阴极（账 31）+ 长通 LIF（账 33）+ DUV CCD（账 32）。光路钉死，岩片动。青束是身份漆。
    {
      const x = -8.2;
      shell(x, M.raman, G.isoG);
      // 账 31：源是 NeCu 空心阴极，不是发光二极管方块。248.6 nm 在管内；青束留给看的人。
      box(0.32, 0.22, 0.22, M.dark, x - 0.78, 1.68, gbZ + 0.05);
      cyl(0.05, 0.05, 0.18, M.steel, x - 0.58, 1.68, gbZ + 0.05, 8).rotation.z = Math.PI / 2;
      box(0.04, 0.08, 0.08, M.glass, x - 0.46, 1.68, gbZ + 0.05);
      box(0.055, 0.055, 0.055, G.neg, x - 0.78, 1.82, gbZ + 0.05);
      box(0.50, 0.025, 0.025, G.laser, x - 0.16, 1.68, gbZ + 0.05);
      box(0.04, 0.04, 0.04, G.laser, x + 0.12, 1.68, gbZ + 0.05);
      box(0.12, 0.12, 0.12, M.iso, x + 0.38, 1.68, gbZ + 0.05);
      // 备件氖铜管：1+1 进口，ops-fab 种不出（账 31）。
      cyl(0.035, 0.035, 0.16, M.dark, x - 0.92, 1.36, gbZ + 0.32, 8).rotation.z = Math.PI / 2;
      box(0.05, 0.05, 0.05, M.steel, x - 0.92, 1.36, gbZ + 0.22);
      box(0.08, 0.08, 0.45, G.fluo, x + 0.38, 1.78, gbZ + 0.32);
      cyl(0.16, 0.16, 0.22, M.steel, x + 0.38, 1.78, gbZ + 0.58, 10).rotation.x = Math.PI / 2;
      box(0.18, 0.18, 0.12, G.fluo, x + 0.38, 1.78, gbZ + 0.72);
      box(0.03, 0.03, 0.35, M.raman, x + 0.38, 1.55, gbZ - 0.18);
      // 账 33：进缝前长通。8 µJ = 1e13 个激光光子；LIF 50% @ 253.18 nm 对齐 800 cm⁻¹。反射进倾泻，不是第二根光栅。
      const lif = box(0.14, 0.18, 0.012, M.glass, x + 0.40, 1.58, gbZ - 0.22);
      lif.rotation.y = 0.40;
      box(0.08, 0.08, 0.08, M.dark, x + 0.28, 1.72, gbZ - 0.16);
      box(0.03, 0.03, 0.03, G.laser, x + 0.28, 1.72, gbZ - 0.16);
      // 账 32：一根光栅 + 焦面上 DUV CCD。四块斜板是身份。青条=拉曼窗，荧光绿=荧光窗，同一芯片。
      box(0.55, 0.32, 0.28, M.dark, x + 0.55, 1.48, gbZ - 0.42);
      box(0.42, 0.22, 0.03, M.glass, x + 0.55, 1.48, gbZ - 0.26);
      const grate = box(0.28, 0.18, 0.012, M.steel, x + 0.52, 1.48, gbZ - 0.38);
      grate.rotation.y = 0.35;
      box(0.20, 0.12, 0.02, M.dark, x + 0.55, 1.48, gbZ - 0.54);
      box(0.07, 0.09, 0.008, G.laser, x + 0.50, 1.48, gbZ - 0.53);
      box(0.07, 0.09, 0.008, G.fluo, x + 0.60, 1.48, gbZ - 0.53);
      box(0.04, 0.04, 0.04, G.isoG, x + 0.55, 1.58, gbZ - 0.54);
      const scanZ = new THREE.Group();
      scanZ.name = 'ramanScanZ';
      scanZ.position.set(x + 0.12, 1.42, gbZ + 0.05);
      group.add(scanZ);
      box(0.50, 0.04, 0.10, M.steel, 0, 0, 0, scanZ);
      const scanX = new THREE.Group();
      scanX.name = 'ramanScanX';
      scanX.position.set(0, 0.05, 0);
      scanZ.add(scanX);
      box(0.22, 0.04, 0.22, M.dark, 0, 0, 0, scanX);
      cyl(0.11, 0.11, 0.05, M.dark, 0, 0.06, 0, 10, scanX);
      box(0.14, 0.04, 0.14, M.raman, 0, 0.10, 0, scanX);
      // 账 36：标定靶骑在台上。白片=聚碳酸酯 1600 cm⁻¹，锈片=SaU 008。未知岩片不能钉波长轴。
      box(0.10, 0.016, 0.08, M.steel, 0.14, 0.108, 0, scanX);
      box(0.028, 0.012, 0.028, M.iso, 0.125, 0.122, 0.018, scanX);
      box(0.028, 0.012, 0.028, M.rust, 0.155, 0.122, 0.018, scanX);
      box(0.028, 0.012, 0.028, M.dark, 0.140, 0.122, -0.018, scanX);
      oscillators.push({ node: scanZ, axis: 'z', prop: 'position', amp: 0.055, period: 11, phase: 0.2 });
      oscillators.push({ node: scanX, axis: 'x', prop: 'position', amp: 0.07, period: 7, phase: 0.0 });
    }

    // L2 GC-MS：两台炉（账 6）+ 程序升温双线圈（账 12/13/17）+ 钢柱单峰/青柱双峰（账 22）+ Chirasil 1+1 备件匣（账 38）+ SIM 驻留针（账 23）+ 先扫后钉（账 24）+ 未接电双杯（账 25）+ 衍生化未洗净（账 26）+ 75 °C 浸泡不是进样（账 27）+ 2.4% 是标准品不是锈杯（账 28）+ MTBSTFA 1+1 安瓿（账 29）+ 喇叭口进真空罐（账 30）+ EPC（账 18）+ 地球氦瓶（账 14）+ 毛细限流（账 16）+ EI 双灯丝（账 10/37）+ 四极扫描（账 19）+ 通道倍增器 1+1（账 20/21）+ 涡轮穿舱（账 15）。
    {
      const x = -5.0;
      shell(x, M.gcms, G.lamp);
      cyl(0.18, 0.18, 0.42, M.steel, x - 0.55, 1.48, gbZ + 0.32, 12);
      box(0.08, 0.08, 0.08, G.neg, x - 0.72, 1.62, gbZ + 0.32);
      cyl(0.05, 0.05, 0.08, M.ti, x - 0.55, 1.74, gbZ + 0.32, 8);
      cyl(0.18, 0.18, 0.42, M.gcms, x + 0.55, 1.48, gbZ + 0.32, 12);
      box(0.22, 0.28, 0.22, G.hot, x + 0.55, 1.50, gbZ + 0.32);
      cyl(0.05, 0.05, 0.08, M.ti, x + 0.55, 1.74, gbZ + 0.32, 8);
      // 账 27：75 °C 是浸泡不是进样。衍生化杯坐在东炉上挥发进柱（同一台炉，不是第三台）。
      cyl(0.045, 0.045, 0.10, M.immuno, x + 0.55, 1.86, gbZ + 0.32, 8);
      box(0.035, 0.025, 0.035, M.rust, x + 0.55, 1.90, gbZ + 0.32);
      cyl(0.01, 0.01, 0.50, M.steel, x + 0.28, 1.72, gbZ + 0.36, 6).rotation.z = Math.PI / 2;
      // 衍生化：手性柱的前提。西炉先报不是洗净（账 26）。75 °C 是浸泡不是进样（账 27）。
      // 锈色块=10 mg 氧化剂存货；青微粒=2 ng LOD 全算氨基酸（不是比例尺）。托盘瓶子是工作液。
      box(0.36, 0.14, 0.20, M.dark, x, 1.36, gbZ + 0.40);
      cyl(0.04, 0.04, 0.10, M.immuno, x - 0.08, 1.50, gbZ + 0.40, 8);
      cyl(0.04, 0.04, 0.10, M.iso, x + 0.08, 1.50, gbZ + 0.40, 8);
      box(0.10, 0.06, 0.08, M.rust, x - 0.06, 1.45, gbZ + 0.50);
      box(0.012, 0.012, 0.012, M.immuno, x + 0.10, 1.45, gbZ + 0.50);
      // 账 29：MTBSTFA 地球进口。9.4 mL 战役，一支 10 mL 只有 1.06×。1+1 密封安瓿，不是托盘工作液。
      cyl(0.032, 0.032, 0.14, M.dark, x - 0.78, 1.18, gbZ + 0.38, 8);
      cyl(0.014, 0.014, 0.035, M.immuno, x - 0.78, 1.27, gbZ + 0.38, 6);
      cyl(0.032, 0.032, 0.14, M.dark, x - 0.68, 1.18, gbZ + 0.38, 8);
      cyl(0.014, 0.014, 0.035, M.immuno, x - 0.68, 1.27, gbZ + 0.38, 6);
      cyl(0.025, 0.025, 0.42, M.steel, x - 0.28, 1.62, gbZ + 0.18, 6).rotation.z = Math.PI / 2;
      cyl(0.025, 0.025, 0.42, M.steel, x + 0.28, 1.62, gbZ + 0.18, 6).rotation.z = Math.PI / 2;
      cyl(0.025, 0.025, 0.22, M.steel, x, 1.62, gbZ + 0.22, 6).rotation.x = Math.PI / 2;
      box(0.78, 0.42, 0.06, M.gcms, x, 1.52, gbZ - 0.10);
      box(0.06, 0.42, 0.28, M.gcms, x - 0.39, 1.52, gbZ + 0.02);
      box(0.06, 0.42, 0.28, M.gcms, x + 0.39, 1.52, gbZ + 0.02);
      box(0.78, 0.06, 0.28, M.gcms, x, 1.32, gbZ + 0.02);
      box(0.78, 0.06, 0.28, M.gcms, x, 1.72, gbZ + 0.02);
      box(0.03, 0.30, 0.22, M.dark, x, 1.52, gbZ + 0.02);
      // 程序升温：炉底加热条 + 走动的温度针（账 17）。常亮灯不是斜坡；东炉 850 °C 是热解。
      box(0.58, 0.03, 0.16, G.hot, x, 1.355, gbZ + 0.02);
      const gauge = box(0.14, 0.14, 0.04, M.dark, x - 0.28, 1.80, gbZ + 0.08);
      const pivot = new THREE.Group();
      pivot.position.set(x - 0.28, 1.80, gbZ + 0.11);
      group.add(pivot);
      box(0.09, 0.012, 0.012, G.hot, 0.04, 0, 0, pivot);
      oscillators.push({ node: pivot, axis: 'z', prop: 'rotation', amp: 0.85, period: 18, phase: 0.15 });
      box(0.05, 0.05, 0.05, G.lamp, x + 0.28, 1.80, gbZ + 0.08);
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 6, 12), M.steel);
        ring.position.set(x - 0.16, 1.46 + i * 0.05, gbZ + 0.04);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }
      for (let i = 0; i < 2; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 6, 12), M.immuno);
        ring.position.set(x + 0.16, 1.48 + i * 0.05, gbZ + 0.04);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }
      // 账 38：Chirasil 备件匣。炉内仍两根。相死则 α=1.02，Rs<1.5。ops-fab 涂不出缬氨酸二酰胺。
      box(0.16, 0.12, 0.16, M.dark, x + 0.72, 1.18, gbZ + 0.38);
      box(0.16, 0.012, 0.04, G.pos, x + 0.72, 1.26, gbZ + 0.38);
      const spareCoil = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.010, 6, 12), M.immuno);
      spareCoil.position.set(x + 0.72, 1.20, gbZ + 0.38);
      spareCoil.rotation.x = Math.PI / 2;
      group.add(spareCoil);
      // 对映体是两次到达（账 22）。青环只是身份漆。钢柱一峰=共流出；青柱两峰同色=同一分子。
      // 上迹 2:1 是教学用 ee，不是耶泽罗测量；下迹 1:1 是消旋时钟，不是生命否证。
      box(0.20, 0.10, 0.03, M.dark, x - 0.16, 1.64, gbZ + 0.18);
      box(0.16, 0.006, 0.012, M.steel, x - 0.16, 1.605, gbZ + 0.20);
      box(0.030, 0.055, 0.014, M.steel, x - 0.16, 1.636, gbZ + 0.20);
      box(0.28, 0.16, 0.03, M.dark, x + 0.18, 1.66, gbZ + 0.18);
      box(0.24, 0.005, 0.010, M.steel, x + 0.18, 1.708, gbZ + 0.20);
      box(0.024, 0.050, 0.012, M.immuno, x + 0.10, 1.736, gbZ + 0.20);
      box(0.024, 0.025, 0.012, M.immuno, x + 0.24, 1.723, gbZ + 0.20);
      box(0.24, 0.005, 0.010, M.steel, x + 0.18, 1.618, gbZ + 0.20);
      box(0.024, 0.030, 0.012, M.immuno, x + 0.10, 1.636, gbZ + 0.20);
      box(0.024, 0.030, 0.012, M.immuno, x + 0.24, 1.636, gbZ + 0.20);
      // 账 28：2.4% 是 20 pg 标准品的地板。白瓶喂教学 2:1；东炉锈杯没有这个数。
      cyl(0.032, 0.032, 0.09, M.iso, x + 0.38, 1.78, gbZ + 0.22, 8);
      box(0.04, 0.012, 0.04, G.pos, x + 0.38, 1.84, gbZ + 0.22);
      cyl(0.006, 0.006, 0.16, M.iso, x + 0.28, 1.74, gbZ + 0.21, 6).rotation.z = Math.PI / 2;
      box(0.14, 0.10, 0.12, M.steel, x, 1.38, gbZ - 0.08);
      box(0.06, 0.06, 0.06, G.neg, x - 0.16, 1.38, gbZ - 0.08);
      box(0.06, 0.06, 0.06, G.pos, x + 0.16, 1.38, gbZ - 0.08);
      // 毛细限流：柱内径才是压降（账 16）。粗管当气路会把整柱抽成真空。
      box(0.05, 0.05, 0.05, M.steel, x, 1.52, gbZ - 0.08);
      cyl(0.006, 0.006, 0.22, M.ti, x, 1.52, gbZ - 0.18, 8).rotation.x = Math.PI / 2;
      box(0.05, 0.05, 0.05, M.steel, x, 1.52, gbZ - 0.28);
      box(0.04, 0.04, 0.04, G.isoG, x + 0.08, 1.58, gbZ - 0.18);
      box(0.40, 0.34, 0.28, M.steel, x, 1.52, gbZ - 0.28);
      box(0.30, 0.22, 0.04, M.glass, x, 1.52, gbZ - 0.12);
      cyl(0.018, 0.018, 0.20, G.hot, x - 0.10, 1.52, gbZ - 0.28, 6).rotation.z = Math.PI / 2;
      // 账 37：SAM 双灯丝。亮丝断则 I_e=0。暗丝是备件；不发明小时数。中途开罐会丢掉 1e-4 Pa。
      cyl(0.018, 0.018, 0.20, M.dark, x + 0.10, 1.52, gbZ - 0.28, 6).rotation.z = Math.PI / 2;
      box(0.07, 0.07, 0.07, G.lamp, x + 0.14, 1.68, gbZ - 0.28);
      // 真空罐加长包住喇叭口（账 30）。70 kPa 下 2.5 kV 帕邢窗 6.1 µm–0.60 mm；裸针打火，厘米级城内部件不是这扇窗。
      box(0.72, 0.48, 0.62, M.dark, x, 1.45, gbZ - 0.71);
      box(0.62, 0.38, 0.04, M.glass, x, 1.45, gbZ - 0.38);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
        const rf = sx === sy;
        cyl(0.035, 0.035, 0.36, rf ? G.pos : M.steel, x + sx * 0.12, 1.45 + sy * 0.1, gbZ - 0.55, 8)
          .rotation.x = Math.PI / 2;
      });
      // 质量轴=电压轴（sci-lab G3）。游标是 dV/dt：Golay 峰 FWHM ~1.7 s，2 s/张会收成棍子（账 19）。
      box(0.54, 0.03, 0.05, M.dark, x, 1.72, gbZ - 0.48);
      for (let i = 0; i < 5; i++) {
        box(0.012, 0.055, 0.02, i === 0 ? G.neg : M.steel, x - 0.22 + i * 0.11, 1.76, gbZ - 0.48);
      }
      const mzScan = new THREE.Group();
      mzScan.position.set(x, 1.78, gbZ - 0.46);
      group.add(mzScan);
      box(0.045, 0.08, 0.04, G.pos, 0, 0, 0, mzScan);
      oscillators.push({ node: mzScan, axis: 'x', prop: 'position', amp: 0.20, period: 3.0, phase: 0.4 });
      // SIM 驻留才有对映体比（账 23）。全扫看得到两次到达，1/533 的离子不够投 ee。
      // 青针钉在中质量，不是 m/z 4 缺口，不是蓝游标。钢柱那次扫，青柱那次钉。
      box(0.022, 0.11, 0.03, M.immuno, x + 0.11, 1.84, gbZ - 0.46);
      // 票 (c) 是确认不是发现（账 24）。蓝→青：先扫后钉。不是一次 RF 程序既扫又钉。
      box(0.045, 0.045, 0.04, G.pos, x - 0.18, 1.92, gbZ - 0.46);
      box(0.14, 0.012, 0.012, M.steel, x - 0.03, 1.92, gbZ - 0.46);
      box(0.045, 0.045, 0.04, M.immuno, x + 0.11, 1.92, gbZ - 0.46);
      // 通道倍增器：杆后才是电流（账 20）。喇叭口在罐内（账 30）：舱气打火窗是亚毫米，高压是灌封穿墙，不是舱内灯。
      cyl(0.08, 0.022, 0.14, M.steel, x, 1.45, gbZ - 0.76, 10).rotation.x = Math.PI / 2;
      for (let i = 0; i < 5; i++) {
        box(0.12 - i * 0.014, 0.10 - i * 0.012, 0.018, i % 2 ? M.dark : G.lamp,
            x, 1.45, gbZ - 0.86 - i * 0.022);
      }
      box(0.12, 0.08, 0.12, M.dark, x + 0.22, 1.73, gbZ - 0.88);
      cyl(0.012, 0.012, 0.10, M.steel, x + 0.22, 1.68, gbZ - 0.88, 6);
      box(0.045, 0.045, 0.045, G.neg, x + 0.22, 1.80, gbZ - 0.88);
      // 备件喇叭口 + 低质量缺口：扫 He+ 会吃掉通道（账 21）。跳过 m/z 4，不是前置杆截止。
      cyl(0.055, 0.018, 0.10, M.dark, x - 0.28, 1.22, gbZ - 0.76, 8).rotation.x = Math.PI / 2;
      box(0.09, 0.04, 0.08, M.steel, x - 0.28, 1.22, gbZ - 0.86);
      box(0.05, 0.05, 0.05, G.isoG, x - 0.28, 1.32, gbZ - 0.86);
      // 同位素‰不是这台四极杆（账 25）。双杯是 IRMS 身份，这里不接电、不亮。
      // QMS 在 f=0.01 上 σ(δ)=106‰；CSIA 要 ng，船上 20 pg。票 (c) 画的仍是手性确认。
      box(0.16, 0.10, 0.08, M.dark, x + 0.32, 1.22, gbZ - 0.76);
      box(0.03, 0.06, 0.04, M.steel, x + 0.27, 1.22, gbZ - 0.70);
      box(0.03, 0.06, 0.04, M.steel, x + 0.37, 1.22, gbZ - 0.70);
      // 地球进口氦瓶：载气身份（账 14）。不是船体 scoop，不是 sci-lab-01 的电解氢箱。
      const bx = x - 0.98, by = 1.08, bz = gbZ + 0.22;
      cyl(0.09, 0.09, 0.62, M.he, bx, by, bz, 12);
      cyl(0.10, 0.10, 0.08, M.steel, bx, by - 0.35, bz, 10);
      cyl(0.035, 0.035, 0.10, M.steel, bx, by + 0.36, bz, 8);
      box(0.10, 0.08, 0.10, G.isoG, bx, by + 0.46, bz);
      box(0.14, 0.10, 0.08, M.steel, bx + 0.12, by + 0.40, bz);
      cyl(0.012, 0.012, 0.72, M.steel, bx + 0.48, 1.48, bz, 6).rotation.z = Math.PI / 2;
      cyl(0.012, 0.012, 0.28, M.steel, x - 0.39, 1.50, (bz + gbZ - 0.10) / 2, 6).rotation.x = Math.PI / 2;
      // EPC：斜坡上稳住 1 sccm（账 18）。不是钢瓶减压阀，不是柱尾针阀。针与炉温同周期。
      box(0.20, 0.16, 0.14, M.dark, x - 0.62, 1.52, bz);
      box(0.06, 0.06, 0.06, G.pos, x - 0.62, 1.64, bz);
      const epcPivot = new THREE.Group();
      epcPivot.position.set(x - 0.62, 1.52, bz + 0.09);
      group.add(epcPivot);
      box(0.07, 0.012, 0.012, G.isoG, 0.03, 0, 0, epcPivot);
      oscillators.push({ node: epcPivot, axis: 'z', prop: 'rotation', amp: 0.55, period: 18, phase: 0.15 });
      // 宽域涡轮：行星就是前级（账 15）。排气穿舱去火星，不进翼、不进双 HEPA。
      const tx = x + 0.42, ty = 1.84, tz = gbZ - 0.58;
      const turbo = cyl(0.12, 0.12, 0.22, M.steel, tx, ty, tz, 12);
      const rotor = cyl(0.07, 0.02, 0.05, M.dark, 0, 0.05, 0, 8, turbo);
      box(0.12, 0.015, 0.03, M.gcms, 0, 0.05, 0, rotor);
      box(0.03, 0.015, 0.12, M.gcms, 0, 0.05, 0, rotor);
      spinners.push({ node: rotor, axis: 'y', rpm: 42 });
      box(0.08, 0.08, 0.08, G.neg, tx + 0.18, ty, tz);
      box(0.11, 0.13, 0.11, M.orange, tx, ty - 0.20, tz);
      box(0.11, 0.13, 0.11, M.orange, tx, 1.42, tz - 0.22);
      cyl(0.028, 0.028, 0.40, M.steel, tx, 1.42, tz - 0.42, 8).rotation.x = Math.PI / 2;
      cyl(0.028, 0.028, 2.6, M.steel, tx, 1.15, (tz - 0.62 + (WZ - WD / 2)) / 2, 8).rotation.x = Math.PI / 2;
    }

    // L3 免疫：同芯片三列 样品 | 过程空白 | 地球阳对照（账 8）+ LDChip 1+1 密封匣（账 34）。方垫不是细胞。
    {
      const x = -1.8;
      shell(x, M.immuno, G.neg);
      box(1.15, 0.06, 0.62, M.dark, x, 1.40, gbZ + 0.18);
      box(0.28, 0.04, 0.5, M.immuno, x - 0.32, 1.45, gbZ + 0.18);
      box(0.28, 0.04, 0.5, M.iso, x, 1.45, gbZ + 0.18);
      box(0.28, 0.04, 0.5, M.steel, x + 0.32, 1.45, gbZ + 0.18);
      box(0.02, 0.06, 0.5, M.dark, x - 0.16, 1.48, gbZ + 0.18);
      box(0.02, 0.06, 0.5, M.dark, x + 0.16, 1.48, gbZ + 0.18);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 2; c++) {
          const z = gbZ + 0.02 + r * 0.11;
          box(0.07, 0.03, 0.07, M.immuno, x - 0.40 + c * 0.14, 1.49, z);
          box(0.07, 0.025, 0.07, M.iso, x - 0.07 + c * 0.14, 1.49, z);
          const lit = (r === 1 && c === 0) || (r === 2 && c === 1);
          box(0.07, 0.03, 0.07, lit ? G.pos : M.steel, x + 0.26 + c * 0.14, 1.49, z);
        }
      }
      cyl(0.055, 0.055, 0.12, M.rust, x - 0.32, 1.58, gbZ + 0.48, 8);
      cyl(0.055, 0.055, 0.12, M.iso, x, 1.58, gbZ + 0.48, 8);
      cyl(0.055, 0.055, 0.12, G.pos, x + 0.32, 1.58, gbZ + 0.48, 8);
      // 账 34：LDChip 地球进口。18×1.2=22 片，一匣只有 1.02×。1+1 密封匣，不是三只发光杯。
      box(0.16, 0.10, 0.22, M.dark, x - 0.52, 1.22, gbZ + 0.42);
      box(0.16, 0.10, 0.22, M.dark, x - 0.52, 1.22, gbZ + 0.16);
      box(0.16, 0.012, 0.04, G.pos, x - 0.52, 1.28, gbZ + 0.42);
      box(0.16, 0.012, 0.04, G.pos, x - 0.52, 1.28, gbZ + 0.16);
      box(0.10, 0.008, 0.08, M.iso, x - 0.52, 1.34, gbZ + 0.42);
      box(0.10, 0.008, 0.08, M.iso, x - 0.52, 1.35, gbZ + 0.42);
      box(0.10, 0.008, 0.08, M.iso, x - 0.52, 1.36, gbZ + 0.42);
    }

    // L4 空白/见证：开管污染地板。账 42：开管是切封。帽躺托盘上，管口朝上。不是免疫过程空白（账 8）。
    {
      const x = 1.4;
      shell(x, M.steel, G.pos);
      box(1.15, 0.05, 0.45, M.iso, x, 1.42, gbZ + 0.15);
      for (let i = 0; i < 5; i++) {
        const xi = x - 0.40 + i * 0.20;
        cyl(0.035, 0.035, 0.40, G.tube, xi, 1.64, gbZ + 0.15, 8);
        cyl(0.022, 0.022, 0.02, M.dark, xi, 1.85, gbZ + 0.15, 8);
        const cap = cyl(0.032, 0.032, 0.028, G.tube, xi, 1.50, gbZ + 0.36, 8);
        cap.rotation.z = Math.PI / 2;
      }
    }

    [[-8.2, -5.0], [-5.0, -1.8], [-1.8, 1.4]].forEach(([a, b]) => {
      box(0.9, 0.25, 0.25, M.steel, (a + b) / 2, 1.7, gbZ);
    });
    // 账 35：手套箱后壁收罐。钛罐与库侧传递窗同色；2 m 前室仍是人孔。
    box(0.55, 0.42, 0.48, M.steel, -6.6, 1.22, gbZ - 0.95);
    box(0.48, 0.34, 0.04, M.glass, -6.6, 1.22, gbZ - 0.72);
    box(0.62, 0.06, 0.06, M.orange, -6.6, 1.44, gbZ - 0.72);
    cyl(0.035, 0.035, 0.22, M.ti, -6.6, 1.18, gbZ - 0.95, 8).rotation.z = Math.PI / 2;
    box(0.04, 0.04, 0.04, G.isoG, -6.42, 1.40, gbZ - 0.95);
    poi('poi_chain', -5.0, 2.0, gbZ);
    // 账 43：开管后的残样进核。2 m 前室仍是人孔。「唯一的孔」撤回。
    box(0.55, 0.42, 0.48, M.steel, 2.55, 1.22, gbZ - 0.95);
    box(0.48, 0.34, 0.04, M.glass, 2.55, 1.22, gbZ - 0.72);
    box(0.62, 0.06, 0.06, M.orange, 2.55, 1.44, gbZ - 0.72);
    cyl(0.035, 0.035, 0.22, M.dark, 2.55, 1.18, gbZ - 0.95, 8).rotation.z = Math.PI / 2;
    box(0.04, 0.04, 0.04, G.neg, 2.73, 1.40, gbZ - 0.95);
    cyl(0.04, 0.04, 3.7, M.steel, 4.55, 1.22, -2.20, 8).rotation.z = Math.PI / 2;

    // 账 49：层流顶栅要滤材。钢板不是 HEPA。不发明翼 ACH。
    for (let i = 0; i < 6; i++) {
      const gx = x0 - 5.5 + i * 2.2;
      box(1.8, 0.06, 1.2, M.steel, gx, WH - 0.45, z0 + 1.5);
      for (let k = 0; k < 6; k++)
        box(0.22, 0.20, 0.018, M.media, gx - 0.75 + k * 0.30, WH - 0.58, z0 + 2.08);
    }

    // 账 50：白口不是采火星气。屋顶白筒是正压外泄（滤材+封盖）。补气从西墙城侧。
    cyl(0.35, 0.38, 0.8, M.white, x0 - 4, WH + 0.7, z0 - 2, 12);
    cyl(0.28, 0.28, 0.08, M.media, x0 - 4, WH + 1.08, z0 - 2, 12);
    cyl(0.32, 0.32, 0.10, M.steel, x0 - 4, WH + 1.20, z0 - 2, 12);
    box(0.14, 0.14, 0.14, G.pos, x0 - 4, WH + 1.38, z0 - 2);
    // 西墙内、气闸门顶上：城侧 70 kPa 补气格。滤材朝更衣，不挡西窗。
    box(0.08, 0.28, 0.44, M.steel, x0 - WW / 2 + 0.32, 3.22, -0.5);
    box(0.04, 0.18, 0.32, M.media, x0 - WW / 2 + 0.38, 3.22, -0.5);
    box(0.07, 0.07, 0.07, G.pos, x0 - WW / 2 + 0.48, 3.42, -0.5);

    // 未剖切侧窗（西/北）夜光
    for (let i = 0; i < 3; i++)
      box(0.08, 0.7, 1.1, G.win, x0 - WW / 2 + 0.22, 2.4, z0 - 3 + i * 2.4);
  }

  // =====================================================================
  // 3. 三重密封传递前室 —— 翼–核的人孔。残样走罐（账 43），不穿这三道门。
  // =====================================================================
  {
    const tx = 4.2, tz = 0;
    box(3.2, 3.6, 3.4, M.steel, tx, 1.9, tz);
    box(3.4, 0.16, 3.6, M.dark, tx, 3.78, tz);
    // 三道密封框：橙 / 琥珀 / 红 = 联锁「最多开一道」
    const seals = [
      { z: tz + 1.35, mat: M.orange, w: 1.5 },
      { z: tz + 0.15, mat: G.lamp,   w: 1.35 },
      { z: tz - 1.05, mat: G.beacon, w: 1.2 },
    ];
    seals.forEach(s => {
      box(s.w + 0.16, 2.2, 0.08, s.mat, tx, 1.5, s.z);
      box(s.w, 2.0, 0.05, M.dark, tx, 1.5, s.z - 0.04);
    });
    // 压差灯：翼侧蓝正压 / 核侧绿负压
    box(0.14, 0.14, 0.08, G.pos, tx - 1.3, 3.2, tz + 1.5);
    box(0.14, 0.14, 0.08, G.neg, tx + 1.3, 3.2, tz - 1.5);
    poi('poi_hvac', tx, 2.2, tz);
  }

  // =====================================================================
  // 4. 负压样品核（独立小体量, 暗青, 无窗）
  // =====================================================================
  {
    const cx = 10.2, cz = 0, cw = 8, cd = 8, ch = 5.0;
    box(cw, ch, 0.3, M.core, cx, ch / 2, cz - cd / 2 + 0.15);     // 北
    // +Z 墙与分析翼同一观察向剖开，露出双 HEPA 褶皱（光筒迎风不够走 12 ACH）
    box(2.4, ch, 0.3, M.core, cx - 2.8, ch / 2, cz + cd / 2 - 0.15);
    box(2.4, ch, 0.3, M.core, cx + 2.8, ch / 2, cz + cd / 2 - 0.15);
    box(cw, 1.4, 0.3, M.core, cx, ch - 0.7, cz + cd / 2 - 0.15);
    box(cw, 0.5, 0.3, M.core, cx, 0.25, cz + cd / 2 - 0.15);
    box(0.3, ch, cd, M.core, cx + cw / 2 - 0.15, ch / 2, cz);     // 东（实墙无窗）
    box(0.3, ch, cd - 3.2, M.core, cx - cw / 2 + 0.15, ch / 2, cz - 2.4); // 西，留传递口
    box(0.3, ch, 2.2, M.core, cx - cw / 2 + 0.15, ch / 2, cz + 2.9);
    // 账 43：核西墙收残样罐。人走前室，罐走这扇小窗。不是焚烧口。
    box(0.55, 0.42, 0.48, M.steel, cx - cw / 2 + 0.12, 1.22, -2.20);
    box(0.04, 0.34, 0.40, M.glass, cx - cw / 2 - 0.08, 1.22, -2.20);
    box(0.06, 0.06, 0.50, M.orange, cx - cw / 2 + 0.12, 1.44, -2.20);
    box(0.04, 0.04, 0.04, G.neg, cx - cw / 2 + 0.28, 1.40, -2.20);
    box(cw + 0.4, 0.28, cd + 0.4, M.core2, cx, ch + 0.14, cz);
    box(cw + 0.5, 0.2, cd + 0.5, M.core2, cx, 0.1, cz);
    // 琥珀警示色带（密闭核 / containment 身份）
    box(cw + 0.1, 0.18, 0.12, M.orange, cx, 3.4, cz + cd / 2 + 0.08);
    box(cw + 0.1, 0.18, 0.12, M.orange, cx, 3.4, cz - cd / 2 - 0.08);
    // 双 HEPA：开口罐 + 8 褶滤材（账 7）。拦截在褶皱上，不热销毁样品。
    const hepaCan = (x, y, z) => {
      cyl(0.46, 0.46, 0.08, M.steel, x, y - 0.48, z, 16);
      cyl(0.46, 0.46, 0.08, M.steel, x, y + 0.48, z, 16);
      box(0.9, 0.88, 0.08, M.steel, x, y, z - 0.42);
      box(0.08, 0.88, 0.72, M.steel, x - 0.42, y, z + 0.04);
      box(0.08, 0.88, 0.72, M.steel, x + 0.42, y, z + 0.04);
      for (let k = 0; k < 8; k++) {
        const pz = -0.28 + k * 0.08;
        box(0.28, 0.85, 0.022, M.media, x, y, z + pz);
        box(0.28, 0.85, 0.01, M.dark, x, y, z + pz + 0.032);
      }
    };
    const hx = cx, hz = cz + 2.15;
    hepaCan(hx, 1.15, hz);
    hepaCan(hx, 2.28, hz);
    cyl(0.08, 0.08, 0.22, M.dark, hx, 1.72, hz, 8);
    cyl(0.09, 0.09, 0.5, M.dark, hx, 0.52, hz, 8);
    box(0.22, 0.12, 0.22, G.neg, hx, 2.84, hz);
    box(0.14, 0.14, 4.4, M.steel, hx, 3.22, (hz + cz - 2.2) / 2);
    box(1.3, 0.14, 0.14, M.steel, (hx + cx + 1.2) / 2, 3.22, cz - 2.2);
    box(0.14, 1.9, 0.14, M.steel, cx + 1.2, 4.15, cz - 2.2);
    // 独立排气栈（暗青, 排给火星。翼顶白筒是正压外泄，不是采气，账 50）
    cyl(0.42, 0.48, 3.2, M.core, cx + 1.2, ch + 1.7, cz - 2.2, 12);
    cyl(0.55, 0.55, 0.2, M.steel, cx + 1.2, ch + 3.4, cz - 2.2, 12);
    const fan = cyl(0.32, 0.32, 0.12, M.steel, cx + 1.2, ch + 3.55, cz - 2.2, 10);
    fan.name = 'coreFan';
    // 风扇叶片
    box(0.7, 0.04, 0.08, M.orange, 0, 0.08, 0, fan);
    box(0.08, 0.04, 0.7, M.orange, 0, 0.08, 0, fan);
    spinners.push({ node: fan, axis: 'y', rpm: 18 });
    // 信标
    cyl(0.07, 0.07, 0.35, G.beacon, cx, ch + 0.55, cz + 3.4, 8);
    poi('poi_core', cx, 2.5, cz);
    // 账 47：核东不是城廊。电力在西，排气是屋顶栈。东法兰会绕开三重人孔，撤回。
  }

  // =====================================================================
  // 5. 半埋岩芯库（−Z）
  // =====================================================================
  {
    const lx = -3, lz = -12.5, lw = 14, ld = 8, lh = 2.6;
    const yFloor = -2.2;
    // 五面埋入：底、三墙、顶露出 0.4 m
    box(lw, 0.25, ld, M.conc, lx, yFloor + 0.12, lz);
    box(lw, lh, 0.3, M.conc, lx, yFloor + lh / 2, lz - ld / 2 + 0.15);   // 背
    box(0.3, lh, ld, M.conc, lx - lw / 2 + 0.15, yFloor + lh / 2, lz);
    box(0.3, lh, ld, M.conc, lx + lw / 2 - 0.15, yFloor + lh / 2, lz);
    // +Z 面剖切露岩芯架（朝分析翼/观察者）
    box(0.3, lh, 0.3, M.conc, lx - lw / 2 + 0.15, yFloor + lh / 2, lz + ld / 2 - 0.15);
    box(0.3, lh, 0.3, M.conc, lx + lw / 2 - 0.15, yFloor + lh / 2, lz + ld / 2 - 0.15);
    box(lw + 0.4, 0.22, ld + 0.4, M.conc, lx, yFloor + lh + 0.1, lz);
    // 岩芯架：6 层 × 6 孔。账 40：每孔浅段赭（1.9/8）+ 深段灰青。k<3 整根当花园井，撤回。
    const Lvis = 1.10, Lg = Lvis * (1.9 / 8), Ld = Lvis - Lg;
    for (let row = 0; row < 6; row++) {
      const y = yFloor + 0.45 + row * 0.35;
      box(lw - 1.2, 0.06, 0.5, M.steel, lx, y, lz + 0.5);
      for (let k = 0; k < 6; k++) {
        const xk = lx - 4.4 + k * 1.76;
        const yc = y + 0.10, zc = lz + 0.5;
        cyl(0.035, 0.035, Lg, M.rust, xk - Lvis / 2 + Lg / 2, yc, zc, 8).rotation.z = Math.PI / 2;
        cyl(0.035, 0.035, Ld, M.core2, xk + Lvis / 2 - Ld / 2, yc, zc, 8).rotation.z = Math.PI / 2;
      }
    }
    poi('poi_vault', lx, 0.6, lz);
    poi('poi_drill', lx, 0.3, lz + 1.5);
    // 覆土丘（值噪声锥）
    const bermAt = (x, z, r, h) => {
      const geo = new THREE.ConeGeometry(r, h, 24, 4);
      const pos = geo.attributes.position;
      const col = new Float32Array(pos.count * 3);
      const cA = new THREE.Color(0x7a5340), cB = new THREE.Color(0x9e6b4d), tmp = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        let px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
        if (Math.hypot(px, pz) > 0.05 && py < h / 2 - 0.05) {
          const k = 1 + (vnoise(px * 1.4 + x, py * 1.4, pz * 1.4 + z) - 0.5) * 0.18;
          px *= k; pz *= k; pos.setX(i, px); pos.setZ(i, pz);
        }
        const n = vnoise(px * 2 + x, py * 2, pz * 2 + z);
        tmp.copy(cA).lerp(cB, n);
        col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.computeVertexNormals();
      const p = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
      p.position.set(x, h / 2 - 0.15, z);
      group.add(p);
    };
    bermAt(lx - 8.5, lz, 3.2, 1.8);
    bermAt(lx + 8.5, lz, 3.2, 1.8);
    bermAt(lx, lz - 5.5, 4.0, 2.1);
    // 库顶到分析翼的短保温廊（几米，门口规矩）。人走廊；样品走传递窗（账 35）。
    box(2.2, 1.6, 2.8, M.wDust, -4, 0.9, -7.2);
    box(2.4, 0.12, 3.0, M.steel, -4, 1.76, -7.2);
    // 账 35：双门传递窗。2 g = 0.87 cm³ 进钛罐；8 m 档案留在 219 K。走道不是样品滑梯。
    box(0.70, 0.50, 0.62, M.steel, -4, 1.15, -7.2);
    box(0.62, 0.42, 0.04, M.glass, -4, 1.15, -6.90);
    box(0.62, 0.42, 0.04, M.glass, -4, 1.15, -7.50);
    box(0.78, 0.08, 0.08, M.orange, -4, 1.42, -6.90);
    box(0.78, 0.08, 0.08, M.orange, -4, 1.42, -7.50);
    cyl(0.04, 0.04, 0.28, M.ti, -4, 1.12, -7.2, 8).rotation.z = Math.PI / 2;
    box(0.05, 0.05, 0.05, G.isoG, -4.22, 1.38, -7.2);
    box(0.05, 0.05, 0.05, G.neg, -3.78, 1.38, -7.2);
  }

  // =====================================================================
  // 6. 屋顶污染监测桅杆（10 m 格构）
  // =====================================================================
  {
    const mx = -4, mz = -2, my = 5.5;
    // 四柱 + 斜撑
    const half = 0.45;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      beam(mx + sx * half, my, mz + sz * half,
           mx + sx * half * 0.4, my + 9.2, mz + sz * half * 0.4, 0.07, M.steel);
    });
    for (let lv = 1; lv <= 4; lv++) {
      const y = my + lv * 2.1;
      const s = half * (1 - lv * 0.15);
      beam(mx - s, y, mz - s, mx + s, y, mz - s, 0.06, M.steel);
      beam(mx + s, y, mz - s, mx + s, y, mz + s, 0.06, M.steel);
      beam(mx + s, y, mz + s, mx - s, y, mz + s, 0.06, M.steel);
      beam(mx - s, y, mz + s, mx - s, y, mz - s, 0.06, M.steel);
    }
    // 顶：风杯 + 风向标 + 粒子采样头
    cyl(0.08, 0.08, 0.5, M.dark, mx, my + 9.5, mz, 8);
    const cups = new THREE.Group();
    cups.name = 'anemometer';
    cups.position.set(mx, my + 9.85, mz);
    group.add(cups);
    for (let i = 0; i < 3; i++) {
      const a = i * 2.094;
      const arm = box(0.55, 0.04, 0.04, M.orange, 0.28, 0, 0, cups);
      arm.rotation.y = a;
      const cup = cyl(0.08, 0.08, 0.1, M.orange, 0.55, 0, 0, 8, cups);
      cup.position.set(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55);
    }
    spinners.push({ node: cups, axis: 'y', rpm: 24 });
    const vane = new THREE.Group();
    vane.name = 'windvane';
    vane.position.set(mx, my + 9.4, mz);
    group.add(vane);
    box(0.7, 0.04, 0.12, M.white, 0.2, 0, 0, vane);
    oscillators.push({ node: vane, axis: 'y', prop: 'rotation', amp: 0.7, period: 11, phase: 0.4 });
    // 账 45：采样要进气口。青灯是身份漆。ISO 5 是舱规，不是 10 m 开外。
    cyl(0.12, 0.16, 0.4, M.steel, mx + 0.55, my + 8.6, mz, 10);
    cyl(0.035, 0.035, 0.28, M.steel, mx + 0.38, my + 8.70, mz, 8).rotation.z = Math.PI / 2;
    cyl(0.022, 0.022, 0.03, M.dark, mx + 0.22, my + 8.70, mz, 8).rotation.z = Math.PI / 2;
    box(0.20, 0.14, 0.24, M.dark, mx + 0.55, my + 8.32, mz);
    box(0.10, 0.04, 0.12, M.white, mx + 0.55, my + 8.22, mz);
    box(0.08, 0.08, 0.08, G.lamp, mx + 0.72, my + 8.32, mz);
    poi('poi_siting', mx, my + 6, mz);
  }

  // =====================================================================
  // 7. 护栏 / 场地痕迹 / 短接电力柜
  // =====================================================================
  {
    // 坪侧安全橙护栏
    for (let i = 0; i < 7; i++) {
      const x = -8.5 + i * 2.8;
      box(0.07, 1.05, 0.07, M.orange, x, 0.55, 5.35);
    }
    box(17, 0.07, 0.07, M.orange, 0, 1.08, 5.35);
    // 砾石
    for (let i = 0; i < 18; i++) {
      const a = rnd() * 6.283, d = 14 + rnd() * 8;
      const s = 0.07 + rnd() * 0.1;
      const rock = new THREE.Mesh(rockGeo,
        new THREE.MeshLambertMaterial({ color: rnd() < 0.5 ? 0x8a5a3a : 0x6e4a30 }));
      rock.position.set(Math.cos(a) * d * 0.85, -0.3 * s + 1.618 * s, Math.sin(a) * d * 0.55 + 2);
      rock.scale.set(s, s * (0.55 + rnd() * 0.4), s);
      rock.rotation.y = rnd() * 6.28;
      group.add(rock);
    }
    // 西侧电力接入柜（门口短接,总控走廊来）
    box(1.2, 1.6, 0.7, M.dark, -12.4, 0.85, 2.5);
    box(1.3, 0.1, 0.8, M.steel, -12.4, 1.7, 2.5);
    box(0.12, 0.12, 0.08, G.pos, -12.4, 1.35, 2.88);
    cyl(0.07, 0.07, 2.2, M.steel, -12.4, 0.5, 1.2, 8).rotation.x = Math.PI / 2;
    cyl(0.14, 0.14, 0.08, M.steel, -12.4, 0.5, 0.1, 10).rotation.x = Math.PI / 2;
    // 质谱穿舱排气（账 15）：北墙外短接，排给火星。不是城真空母管，不是核 HEPA。
    box(0.36, 0.36, 0.22, M.dark, -4.58, 1.15, -5.28);
    box(0.12, 0.14, 0.12, M.orange, -4.58, 1.15, -5.50);
    cyl(0.05, 0.05, 0.55, M.steel, -4.58, 1.15, -5.70, 8).rotation.x = Math.PI / 2;
    cyl(0.10, 0.10, 0.08, M.steel, -4.58, 1.15, -6.00, 10).rotation.x = Math.PI / 2;
  }

  // 尘膜：外壳涂装蒙尘。级联地板 / 手套箱 / 滤材不蒙（账 48）。
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.wDust, M.steel, M.dark, M.orange, M.conc, M.core, M.core2, M.pad]
    .forEach(m => m.color.lerp(dust, 0.05));

  group.userData.spinners = spinners;
  group.userData.oscillators = oscillators;
  group.userData.nightMats = nightMats;
  group.userData.blinkMats = blinkMats;
  group.userData.lights = [
    { color: 0xffe0b0, pos: [-4, 4.6, 1.5], range: 14 },
    { color: 0x66ffaa, pos: [10.2, 4.2, 0], range: 10 },
  ];
  return group;
}
