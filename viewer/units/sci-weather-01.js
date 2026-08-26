// sci-weather-01 — 气象监控站(Perseverance MEDA + InSight APSS 城市化放大版)
// 契约 MODELS.md §4:1u=1m、原点=基座地面点、+Y 上、正面朝 +Z、THREE 由查看器传入。
// 动画全部声明式(spinners/oscillators/blinkMats/nightMats),无 animate。
// 设计轮账本(6 脚本+6 图)见 E:\Claude\mars-weather:热膜 Nu-Re/杯式启动/τ 反演/
// 桅杆差胀/气压膜盒挠度(40 µm 定版防触底)/设备舱 WEB 夜间热平衡(舱中舱构型)。
// 器件深挖轮(v2):气压计舱与设备舱剖切开放、光度计滤光轮、热膜加热区——核心不做黑盒。
// 城市联动:τ>3 触发 res-dome-01 LED 补光;尘暴预警发 pwr-storage-01/res-tank-02/
// ops-spaceport-01/02;数据回传 com-station-01。

export const meta = {
  id: 'sci-weather-01',
  name: '气象监控站',
  name_en: 'Weather Monitoring Station',
  size_m: 11.4,            // 实测包围盒长边(拉线锚距+车辙),validate INFO x=11.38
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

const COL = {
  steel: 0x9aa0a6, darkStl: 0x565b61, white: 0xe9ebec, orange: 0xe8621f,
  cabin: 0xdfe2e3, box: 0x6a6f74, pv: 0x1b2a49, pad: 0x6f635a,
  copper: 0x9a6a3a, glow: 0xffd9a0, beacon: 0xff2a1e, glass: 0x22303c,
};

export function build(THREE) {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group();
  root.name = meta.id;
  const nightMats = [], blinkMats = [];

  // 确定性伪随机(资产可复现)
  let _seed = 20260803;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };

  const matte = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.08, ...extra });

  const mSteel  = matte(COL.steel,  { metalness: 0.35, roughness: 0.6 });
  const mDark   = matte(COL.darkStl,{ metalness: 0.35, roughness: 0.65 });
  const mWhite  = matte(COL.white,  { roughness: 0.75 });
  const mOrange = matte(COL.orange);
  const mCabin  = matte(COL.cabin,  { roughness: 0.85 });
  const mBox    = matte(COL.box,    { metalness: 0.25 });
  const mPV     = matte(COL.pv,     { metalness: 0.5, roughness: 0.35 });
  const mPad    = matte(COL.pad,    { roughness: 1.0 });
  const mCopper = matte(COL.copper, { metalness: 0.6, roughness: 0.5 });
  const mGlass  = matte(COL.glass,  { metalness: 0.4, roughness: 0.25 });
  const mRock   = matte(0x8a5a3c,   { roughness: 1.0 });
  const mRockB  = matte(0x6e4630,   { roughness: 1.0 });
  const mAero   = matte(0xd8d4cc,   { roughness: 1.0,                   // 气凝胶保温壳
    emissive: 0xd8d4cc, emissiveIntensity: 0.12 });                      // 舱内背光托底(坑账 2 同款)
  const mBatt   = matte(0xd97a2a,   { roughness: 0.85,
    emissive: 0x8a4a12, emissiveIntensity: 0.15 });                      // 电池箱(舱内可读)
  const mPCB    = matte(0x2e6b3f,   { roughness: 0.8 });                 // 电路板绿
  const mGold   = matte(0xcaa24a,   { metalness: 0.55, roughness: 0.45 });

  // 夜光 → nightMats;闪烁 → blinkMats(emissive 常亮托底,引擎只调 color)
  const winMat = new THREE.MeshStandardMaterial({
    color: COL.glow, emissive: COL.glow, emissiveIntensity: 0.3, roughness: 0.4 });
  nightMats.push(winMat);
  const ledGreen = new THREE.MeshStandardMaterial({
    color: 0x46ff92, emissive: 0x46ff92, emissiveIntensity: 0.3, roughness: 0.4 });
  nightMats.push(ledGreen);
  const ledAmber = new THREE.MeshStandardMaterial({
    color: 0xffb020, emissive: 0xcc8010, emissiveIntensity: 2.0, roughness: 0.4 });
  blinkMats.push(ledAmber);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: COL.beacon, emissive: 0xff2a1a, emissiveIntensity: 2.0, roughness: 0.4 });
  blinkMats.push(beaconMat);

  function box(w, h, d, mat, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    (parent || root).add(m);
    return m;
  }
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  function beam(ax, ay, az, bx, by, bz, w, mat, parent) {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    m.castShadow = m.receiveShadow = true;
    (parent || root).add(m);
    return m;
  }
  function tube(a, b, r, mat, parent, seg = 8) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), seg), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
    m.castShadow = m.receiveShadow = true;
    (parent || root).add(m);
    return m;
  }
  function poi(name, x, y, z, parent) {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    (parent || root).add(o);
    return o;
  }

  // ── 基座:防尘裙边圆台 + 锚栓环 ──────────────────────────────
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 0.35, 24), mPad);
  plinth.position.y = 0.175; plinth.receiveShadow = true; root.add(plinth);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.85, 0.14, 24), mRock);
  skirt.position.y = 0.07; root.add(skirt);          // 裙边压住风蚀掏空
  for (let i = 0; i < 8; i++) {                       // 锚栓
    const a = (i / 8) * Math.PI * 2;
    box(0.09, 0.1, 0.09, mDark, Math.cos(a) * 0.85, 0.39, Math.sin(a) * 0.85);
  }
  poi('poi_base', 0, 0.5, 1.2);

  // ── 主桅杆:10 m 方格构塔(锥度 0.28→0.16 半宽),8 节斜撑 ──────
  const mast = new THREE.Group(); mast.name = 'mast'; mast.position.y = 0.35;
  root.add(mast);
  const H = 9.65;                                     // 塔身(基座 0.35 + 塔 9.65 = 10 m 顶平台)
  const NP = 8, wAt = f => 0.28 - 0.12 * f;
  const corner = (f, i) => {
    const w = wAt(f), s = [[1, 1], [1, -1], [-1, -1], [-1, 1]][i];
    return V3(s[0] * w, f * H, s[1] * w);
  };
  for (let p = 0; p < NP; p++) {
    const f0 = p / NP, f1 = (p + 1) / NP;
    for (let i = 0; i < 4; i++) {
      const a = corner(f0, i), b = corner(f1, i);
      beam(a.x, a.y, a.z, b.x, b.y, b.z, 0.055, mSteel, mast);          // 立柱
      const c = corner(f1, (i + 1) % 4);
      beam(b.x, b.y, b.z, c.x, c.y, c.z, 0.04, mSteel, mast);           // 横撑
      const d0 = corner(f0, (i + 1) % 4);
      if ((p + i) % 2 === 0) beam(a.x, a.y, a.z, c.x, c.y, c.z, 0.032, mDark, mast);
      else beam(d0.x, d0.y, d0.z, b.x, b.y, b.z, 0.032, mDark, mast);   // 斜撑交替
    }
  }
  // 塔内电缆导管
  tube(V3(0.1, 0, 0.1), V3(0.1, H, 0.1), 0.03, mDark, mast);
  poi('poi_mast', 0, 5.2, 0.5);

  // ── 三高度测风臂:2 / 5 / 10 m 热膜风速仪(MEDA 式) ────────────
  function hotfilmBoom(y, az) {
    const g = new THREE.Group();
    g.position.y = y; g.rotation.y = az; mast.add(g);
    const w = wAt(Math.min(1, (y - 0.35) / H));
    tube(V3(0, 0, w), V3(0, 0, w + 1.15), 0.035, mSteel, g);            // 臂杆
    beam(0, -0.35, w + 0.05, 0, 0, w + 0.7, 0.03, mDark, g);            // 斜拉
    const head = new THREE.Group(); head.position.set(0, 0, w + 1.15); g.add(head);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 8, 20), mWhite);
    ring.rotation.x = Math.PI / 2; head.add(ring);                       // 环形护罩
    for (let i = 0; i < 3; i++) {                                        // 3 片热膜芯片板+镀金加热区
      const a = (i / 3) * Math.PI * 2;
      const fin = box(0.016, 0.09, 0.05, mCopper, 0, 0, 0, head);
      fin.position.set(Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1);
      fin.rotation.y = -a;
      const film = box(0.006, 0.05, 0.03, mGold, 0, 0, 0, head);
      film.position.set(Math.cos(a) * 0.112, 0.01, Math.sin(a) * 0.112);
      film.rotation.y = -a;
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 10), mBox);
    head.add(hub);
    box(0.09, 0.06, 0.11, mBox, 0, -0.09, w + 0.98, g);                  // 前端电子盒
    return g;
  }
  hotfilmBoom(1.65, 0);                    // 2 m 高度(含基座) → 朝 +Z
  hotfilmBoom(4.65, (2 * Math.PI) / 3);    // 5 m
  hotfilmBoom(9.35, (4 * Math.PI) / 3);    // 10 m(顶平台下方)
  poi('poi_hotfilm', 0, 1.65, 1.6);

  // ── 塔顶:平台 + 大杯风速计(展示) + 风向标 + 障碍信标 ──────────
  const top = new THREE.Group(); top.position.y = H; mast.add(top);
  box(0.6, 0.05, 0.6, mSteel, 0, 0.03, 0, top);                          // 顶平台
  tube(V3(0, 0.05, 0), V3(0, 0.75, 0), 0.03, mSteel, top);               // 顶短杆
  const rotor = new THREE.Group(); rotor.name = 'cup_rotor';
  rotor.position.y = 0.78; top.add(rotor);
  const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12), mDark);
  rotor.add(rotorHub);
  for (let i = 0; i < 3; i++) {                                          // 展示级大杯 D20cm R35cm
    const a = (i / 3) * Math.PI * 2;
    const arm = tube(V3(0, 0, 0), V3(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35), 0.015, mSteel, rotor);
    const cup = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mOrange);
    cup.material = new THREE.MeshStandardMaterial({
      color: COL.orange, roughness: 0.85, side: THREE.DoubleSide });
    cup.position.set(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35);
    cup.rotation.z = Math.PI / 2;
    cup.rotation.y = -a + Math.PI / 2;                                    // 开口切向
    rotor.add(cup);
  }
  // 风向标(独立小杆,oscillator 小幅摆)
  tube(V3(0.28, 0.05, -0.28), V3(0.28, 0.55, -0.28), 0.02, mSteel, top);
  const vane = new THREE.Group(); vane.name = 'vane';
  vane.position.set(0.28, 0.55, -0.28); vane.rotation.y = -0.5; top.add(vane);
  tube(V3(0, 0, -0.22), V3(0, 0, 0.3), 0.012, mDark, vane);
  const tail = box(0.012, 0.14, 0.2, mWhite, 0, 0, 0.28, vane);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 8), mOrange);
  nose.rotation.x = -Math.PI / 2; nose.position.z = -0.26; vane.add(nose);
  // 航空障碍信标(blink)
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), beaconMat);
  beacon.name = 'blink_beacon'; beacon.position.set(-0.24, 0.16, 0.24); top.add(beacon);
  tube(V3(-0.24, 0.05, 0.24), V3(-0.24, 0.12, 0.24), 0.015, mDark, top);
  poi('poi_wind', 0, 10.4, 0.6);

  // ── 拉线锚固 ×3(差胀预紧 285 N 账见设计轮 #4) ─────────────────
  const attachY = 7.0;
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI / 6) + (i * 2 * Math.PI) / 3;   // 30°/150°/270°,避开 +Z 正面
    const ax = Math.cos(a) * 6.0, az = Math.sin(a) * 6.0;
    const wf = wAt((attachY - 0.35) / H);
    tube(V3(Math.cos(a) * wf, attachY, Math.sin(a) * wf), V3(ax, 0.35, az), 0.014, mDark);
    // 锚块 + 花篮螺栓 + 安全橙警示套管
    box(0.55, 0.35, 0.55, mPad, ax, 0.14, az);
    box(0.08, 0.22, 0.08, mCopper, ax - Math.cos(a) * 0.18, 0.42, az - Math.sin(a) * 0.18);
    const sleeve = tube(V3(ax - Math.cos(a) * 0.9, 1.35, az - Math.sin(a) * 0.9),
                        V3(ax - Math.cos(a) * 0.35, 0.5, az - Math.sin(a) * 0.35), 0.035, mOrange);
    sleeve.castShadow = false;
  }
  poi('poi_guy', Math.cos(Math.PI / 6) * 6, 0.8, Math.sin(Math.PI / 6) * 6);

  // ── 气压计舱 + 温度百叶罩杆组(西侧) ────────────────────────────
  const met = new THREE.Group(); met.position.set(-2.15, 0, 1.25); root.add(met);
  box(1.0, 0.12, 0.8, mPad, 0, 0.06, 0, met);                            // 基础板
  // 气压计舱:剖切开放(三面墙+顶盖+边柱,朝 +Z 观察侧)——核心不做黑盒
  box(0.5, 0.04, 0.4, mBox, -0.2, 0.14, 0, met);                         // 底板
  box(0.5, 0.38, 0.04, mCabin, -0.2, 0.33, -0.18, met);                  // 背墙
  box(0.04, 0.38, 0.4, mCabin, -0.43, 0.33, 0, met);                     // 侧墙 ×2
  box(0.04, 0.38, 0.4, mCabin, 0.03, 0.33, 0, met);
  box(0.5, 0.03, 0.4, mCabin, -0.2, 0.535, 0, met);                      // 顶板
  box(0.05, 0.38, 0.05, mCabin, -0.42, 0.33, 0.175, met);                // 开口面边柱 ×2
  box(0.05, 0.38, 0.05, mCabin, 0.02, 0.33, 0.175, met);
  box(0.54, 0.05, 0.44, mBox, -0.2, 0.57, 0, met);                       // 顶盖压条
  // 内构:恒温铜块 + 双硅膜盒(真空参考电容式) + 进气缓冲腔 + 加热片 + PCB
  box(0.2, 0.07, 0.14, mCopper, -0.22, 0.21, -0.02, met);                // 恒温块
  box(0.22, 0.015, 0.16, mDark, -0.22, 0.165, -0.02, met);               // 加热片
  [-0.28, -0.16].forEach(cx => {                                          // 膜盒 ×2(叠盘)
    for (let k = 0; k < 3; k++) {
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.035 - k * 0.004, 0.035 - k * 0.004, 0.016, 12), mWhite);
      disk.position.set(cx, 0.255 + k * 0.018, -0.02); met.add(disk);
    }
  });
  const buf = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.1, 12), mCopper);
  buf.position.set(-0.06, 0.26, -0.1); met.add(buf);                     // 进气缓冲腔
  tube(V3(-0.2, 0.5, 0.14), V3(-0.06, 0.32, -0.1), 0.012, mSteel, met);  // 进气内管(立管→缓冲腔)
  tube(V3(-0.1, 0.28, -0.06), V3(-0.2, 0.28, -0.02), 0.008, mCopper, met); // 缓冲腔→膜盒
  box(0.3, 0.2, 0.02, mPCB, -0.2, 0.34, -0.15, met);                     // 采集 PCB(CDC 电容读出)
  box(0.05, 0.03, 0.015, mDark, -0.26, 0.36, -0.135, met);
  box(0.04, 0.04, 0.015, mDark, -0.14, 0.32, -0.135, met);
  tube(V3(-0.2, 0.54, 0.18), V3(-0.2, 0.78, 0.18), 0.022, mSteel, met);  // 进气立管
  const gooseneck = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 12, Math.PI), mSteel);
  gooseneck.position.set(-0.2, 0.78, 0.12); gooseneck.rotation.y = Math.PI / 2; met.add(gooseneck);
  box(0.03, 0.05, 0.08, ledGreen, -0.46, 0.45, 0.05, met);               // 状态灯(侧墙挂装)
  // 温度杆:1.8 m,每高度两套体制并列——
  //   主:裸细丝热电偶三元组(120° 三方位,取最冷) 副:叠盘百叶罩(互校)
  // 依据设计轮 #15:610 Pa 下百叶罩正午偏 +4.4 K、夜间 −2.1 K(反号),
  // 裸线只偏 0.53 K(自身吸阳),梯度差模残差 0.023 K vs 罩体 0.30 K。
  tube(V3(0.28, 0.12, 0), V3(0.28, 1.92, 0), 0.028, mSteel, met);
  [0.85, 1.3, 1.75].forEach(hy => {
    const arm = tube(V3(0.28, hy, 0), V3(0.55, hy, 0), 0.018, mSteel, met);
    for (let k = 0; k < 5; k++) {                                        // 5 叠盘百叶罩(副)
      const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.085 - k * 0.004, 0.095 - k * 0.004, 0.014, 14), mWhite);
      disk.position.set(0.62, hy - 0.045 + k * 0.024, 0); met.add(disk);
    }
    tube(V3(0.62, hy - 0.06, 0), V3(0.62, hy + 0.07, 0), 0.012, mDark, met);
    // 主:三根细支臂朝背罩侧 120° 散开,臂端一段裸铂丝(镀金端子)
    for (let i = 0; i < 3; i++) {
      const a = Math.PI + (i - 1) * (2 * Math.PI / 3) * 0.5;             // 背向百叶罩一侧
      const ex = 0.28 + Math.cos(a) * 0.2, ez = Math.sin(a) * 0.2;
      tube(V3(0.28, hy, 0), V3(ex, hy, ez), 0.006, mDark, met, 5);       // 细支臂
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.055, 5), mGold);
      wire.rotation.z = Math.PI / 2;
      wire.rotation.y = -a;
      wire.position.set(ex, hy, ez); met.add(wire);                      // 裸丝敏感段
      box(0.018, 0.016, 0.018, mCopper, ex, hy - 0.022, ez, met);        // 冷端接线柱
    }
  });
  poi('poi_pressure', -2.35, 0.6, 1.45);
  poi('poi_ats', -1.5, 1.4, 1.25);

  // ── 太阳光度计 τ 观测头(东南,对日跟踪双轴云台) ─────────────────
  const photo = new THREE.Group(); photo.position.set(2.05, 0, -1.55); root.add(photo);
  box(0.8, 0.1, 0.8, mPad, 0, 0.05, 0, photo);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.85, 14), mCabin);
  ped.position.y = 0.52; photo.add(ped);
  box(0.26, 0.1, 0.2, mBox, 0, 0.99, 0, photo);                          // 方位驱动盒
  const az = new THREE.Group(); az.name = 'photo_az'; az.position.y = 1.06; photo.add(az);
  box(0.05, 0.3, 0.16, mCabin, -0.11, 0.13, 0, az);                      // 叉臂 ×2
  box(0.05, 0.3, 0.16, mCabin, 0.11, 0.13, 0, az);
  const el = new THREE.Group(); el.name = 'photo_el'; el.position.y = 0.24;
  el.rotation.x = -0.9; az.add(el);                                      // 基准仰角 ~52°
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.42, 14), mWhite);
  barrel.rotation.x = Math.PI / 2; el.add(barrel);                       // 880nm 光度计镜筒
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.058, 0.12, 14), mDark);
  hood.rotation.x = Math.PI / 2; hood.position.z = -0.26; el.add(hood);  // 遮光罩
  const quad = tube(V3(0.1, 0.05, 0.1), V3(0.1, 0.05, -0.18), 0.022, mCopper, el); // 跟踪四象限管
  box(0.12, 0.08, 0.1, mBox, 0, -0.12, 0.12, el);                        // 探测器盒
  [-0.24, -0.3].forEach((zz, i) => {                                     // 遮光罩内消杂光挡板环
    const bf = new THREE.Mesh(new THREE.TorusGeometry(0.048 - i * 0.006, 0.007, 6, 14), mDark);
    bf.position.z = zz; el.add(bf);
  });
  const fwHouse = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16), mBox);
  fwHouse.rotation.x = Math.PI / 2; fwHouse.position.set(0, -0.1, 0.01); el.add(fwHouse);
  const fwheel = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.014, 16), mDark);
  fwheel.name = 'filter_wheel';                                          // 滤光轮半露(880nm+近红外+中性密度…)
  fwheel.rotation.x = Math.PI / 2; fwheel.position.set(0, -0.1, 0.032); el.add(fwheel);
  [mWhite, mOrange, mCopper, mPV, mGold, mGlass].forEach((fm, i) => {
    const a = (i / 6) * Math.PI * 2;                                     // 轮盘局部坐标(随轮转)
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 8), fm);
    dot.position.set(Math.cos(a) * 0.036, 0.009, Math.sin(a) * 0.036);
    fwheel.add(dot);
  });
  poi('poi_photometer', 2.05, 1.35, -1.55);

  // ── SkyCam 全天相机 + 尘通量/静电杆(西南) ─────────────────────
  const sky = new THREE.Group(); sky.position.set(-2.0, 0, -1.6); root.add(sky);
  box(0.9, 0.1, 0.7, mPad, 0, 0.05, 0, sky);
  tube(V3(-0.15, 0.1, 0), V3(-0.15, 1.35, 0), 0.035, mSteel, sky);
  const head = new THREE.Group(); head.name = 'skycam_head';
  head.position.set(-0.15, 1.42, 0); sky.add(head);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.14, 16), mCabin);
  head.add(drum);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mGlass);
  dome.position.y = 0.07; head.add(dome);                                // 鱼眼朝天
  const wiper = box(0.02, 0.03, 0.24, mOrange, 0, 0.1, 0, head);         // 除尘刮臂(随头缓转)
  wiper.position.set(0, 0.11, 0.0);
  // 尘通量/静电传感杆:双细杆 + 环电极
  tube(V3(0.32, 0.1, 0.1), V3(0.32, 1.0, 0.1), 0.014, mSteel, sky);
  [0.45, 0.65, 0.85].forEach(hy => {
    const el2 = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 14), mCopper);
    el2.rotation.x = Math.PI / 2; el2.position.set(0.32, hy, 0.1); sky.add(el2);
  });
  tube(V3(0.32, 0.1, -0.18), V3(0.32, 0.75, -0.18), 0.012, mDark, sky);  // 静电探针
  const probe = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mCopper);
  probe.position.set(0.32, 0.78, -0.18); sky.add(probe);
  poi('poi_skycam', -2.15, 1.6, -1.6);

  // ── 设备舱(东侧):数据机+电池+对基站天线,夜里状态灯 ─────────────
  const cab = new THREE.Group(); cab.position.set(2.45, 0, 0.75); root.add(cab);
  box(2.0, 0.16, 1.5, mPad, 0, 0.08, 0, cab);                            // 基础
  box(0.14, 0.14, 1.3, mDark, -0.7, 0.23, 0, cab);                       // 滑橇 ×2
  box(0.14, 0.14, 1.3, mDark, 0.7, 0.23, 0, cab);
  // 舱体:+X 检修面敞开(检修盖板外翻),露出舱中舱 WEB——夜间热平衡账的几何答案
  box(1.7, 0.06, 1.15, mBox, 0, 0.33, 0, cab);                           // 舱底板
  box(0.06, 1.1, 1.15, mCabin, -0.82, 0.85, 0, cab);                     // -X 墙
  box(1.7, 1.1, 0.06, mCabin, 0, 0.85, 0.545, cab);                      // +Z 墙(门/窗面)
  box(1.7, 1.1, 0.06, mCabin, 0, 0.85, -0.545, cab);                     // -Z 墙
  box(1.7, 0.06, 1.15, mCabin, 0, 1.37, 0, cab);                         // 顶棚
  box(0.07, 1.1, 0.07, mCabin, 0.815, 0.85, 0.51, cab);                  // 开口边柱 ×2
  box(0.07, 1.1, 0.07, mCabin, 0.815, 0.85, -0.51, cab);
  const hatch = new THREE.Group(); hatch.position.set(0.84, 0.85, -0.55); cab.add(hatch);
  hatch.rotation.y = 2.0;                                                // 检修盖板外翻 ~115°
  box(0.05, 1.0, 1.05, mOrange, 0, 0, 0.55, hatch);
  box(0.1, 0.16, 0.05, mDark, -0.05, 0, 0.85, hatch);                    // 盖板把手
  box(1.78, 0.08, 1.23, mBox, 0, 1.44, 0, cab);                          // 顶盖压条
  box(1.78, 0.1, 1.23, mBox, 0, 0.35, 0, cab);                           // 底裙边
  // WEB 舱中舱:6 cm 气凝胶壳(开口朝 +X)+ 双电池箱 + 数采机 + 加热板
  const web = new THREE.Group(); web.position.set(0.05, 0, -0.05); cab.add(web);
  box(0.95, 0.05, 0.66, mAero, 0, 0.385, 0, web);                        // 壳底
  box(0.95, 0.05, 0.66, mAero, 0, 1.0, 0, web);                          // 壳顶
  box(0.05, 0.56, 0.66, mAero, -0.45, 0.69, 0, web);                     // -X 端
  box(0.95, 0.56, 0.05, mAero, 0, 0.69, -0.305, web);                    // ±Z 壁
  box(0.95, 0.56, 0.05, mAero, 0, 0.69, 0.305, web);
  box(0.62, 0.025, 0.55, mCopper, 0.05, 0.425, 0, web);                  // 加热板(15 W 补热)
  box(0.26, 0.28, 0.24, mBatt, 0.12, 0.58, -0.14, web);                  // LiFePO4 电池箱 ×2(750 Wh)
  box(0.26, 0.28, 0.24, mBatt, 0.12, 0.58, 0.14, web);
  box(0.34, 0.24, 0.5, mBox, -0.2, 0.85, 0, web);                        // 数采机(DAQ)
  box(0.02, 0.14, 0.32, ledGreen, -0.02, 0.85, 0, web);                  // 状态屏(夜光)
  tube(V3(0.15, 0.85, 0.25), V3(0.5, 0.55, 0.5), 0.02, mDark, web);      // 线束出舱
  // 密封门(+Z 面):框+扇+闩+双铰链
  box(0.62, 0.88, 0.05, mOrange, -0.35, 0.85, 0.59, cab);
  box(0.5, 0.76, 0.06, mWhite, -0.35, 0.85, 0.6, cab);
  box(0.07, 0.16, 0.05, mDark, -0.18, 0.84, 0.63, cab);
  box(0.09, 0.07, 0.04, mDark, -0.58, 1.12, 0.61, cab);
  box(0.09, 0.07, 0.04, mDark, -0.58, 0.58, 0.61, cab);
  // 夜光窗 + 状态灯排
  const win = box(0.44, 0.3, 0.03, winMat, 0.42, 1.05, 0.585, cab);
  box(0.5, 0.36, 0.02, mDark, 0.42, 1.05, 0.575, cab);
  box(0.07, 0.05, 0.03, ledGreen, 0.2, 0.62, 0.59, cab);                 // 链路正常(常亮夜光)
  const amber = box(0.07, 0.05, 0.03, ledAmber, 0.32, 0.62, 0.59, cab);  // 尘暴预警(闪烁)
  amber.name = 'blink_storm';
  // 顶部:PV 板 + 对基站小碟(指向 com-station-01 方向,西偏南)
  const pv = box(1.2, 0.04, 0.9, mPV, -0.15, 1.62, 0.05, cab);
  pv.rotation.z = 0.28;                                                  // 倾角朝赤道
  box(0.06, 0.1, 0.06, mSteel, -0.68, 1.52, -0.25, cab);                 // 低边支脚 ×2
  box(0.06, 0.1, 0.06, mSteel, -0.68, 1.52, 0.35, cab);
  box(0.06, 0.42, 0.06, mSteel, 0.38, 1.62, -0.25, cab);                 // 高边支腿 ×2
  box(0.06, 0.42, 0.06, mSteel, 0.38, 1.62, 0.35, cab);
  tube(V3(0.62, 1.48, -0.35), V3(0.62, 1.95, -0.35), 0.03, mSteel, cab);
  const dishG = new THREE.Group(); dishG.position.set(0.62, 1.98, -0.35);
  dishG.rotation.y = 2.4; dishG.rotation.x = -0.5; cab.add(dishG);       // 朝西南低仰角
  const mDish = matte(COL.white, { roughness: 0.75, side: THREE.DoubleSide });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), mDish);
  dish.rotation.x = Math.PI / 2; dishG.add(dish);
  tube(V3(0, 0, 0), V3(0, 0, -0.2), 0.015, mDark, dishG);
  const feed2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mCopper);
  feed2.position.z = -0.2; dishG.add(feed2);
  // UHF 鞭状天线
  tube(V3(-0.75, 1.48, -0.45), V3(-0.75, 2.35, -0.45), 0.012, mDark, cab);
  // 侧面散热鳍片 ×5(辐射排热,移背阳 -X 侧;+X 是检修开口)
  for (let i = 0; i < 5; i++) box(0.03, 0.7, 0.16, mWhite, -0.87, 0.9, -0.42 + i * 0.2, cab);
  poi('poi_cabin', 2.45, 1.2, 1.45);
  poi('poi_web', 2.35, 0.7, 0.7);

  // ── 电缆导管:桅杆→设备舱、各仪器→设备舱 ─────────────────────
  box(1.15, 0.06, 0.16, mBox, 1.05, 0.05, 0.5);                          // 地面槽盒
  box(0.16, 0.06, 1.6, mBox, -1.4, 0.05, 0.2);
  box(0.2, 0.18, 0.14, mBox, 0.6, 0.12, 0.5);                            // 接线箱
  box(0.14, 0.16, 0.2, mBox, -1.4, 0.11, -0.7);

  // ── 作业痕迹:车辙 + 散落砾石 ──────────────────────────────────
  box(0.5, 0.03, 5.5, mRockB, 3.9, 0.015, 0.2).rotation.y = 0.12;        // 巡检车辙 ×2
  box(0.5, 0.03, 5.5, mRockB, 5.1, 0.015, 0.4).rotation.y = 0.12;
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);                  // 顶点半径 φ≈1.618
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, d = 2.0 + rnd() * 4.2, s = 0.05 + rnd() * 0.1;
    const sy = s * (0.55 + rnd() * 0.45);
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? mRock : mRockB);
    rock.position.set(Math.cos(a) * d, -0.3 * sy + 1.618 * sy, Math.sin(a) * d);
    rock.scale.set(s, sy, s);
    rock.rotation.y = rnd() * 6.28;                                      // 只绕 Y(贴地可控)
    root.add(rock);
  }

  // ── 尘膜 pass:所有涂装材质罩一层火星尘 ────────────────────────
  const dustC = new THREE.Color(0x9e5b3d);
  [mSteel, mDark, mWhite, mOrange, mCabin, mBox, mPV, mPad, mCopper, mGlass]
    .forEach(m => m.color.lerp(dustC, 0.05));

  // ── 声明式动画 + 昼夜/闪烁/灯光 ───────────────────────────────
  root.userData.spinners = [
    { node: 'cup_rotor', axis: 'y', rpm: 16 },        // 火星风下低转速
    { node: 'skycam_head', axis: 'y', rpm: 0.4 },     // 除尘刮臂缓转
    { node: 'filter_wheel', axis: 'y', rpm: 0.6 },    // 滤光轮换挡(展示节奏)
  ];
  root.userData.oscillators = [
    { node: 'vane', axis: 'y', prop: 'rotation', amp: 0.38, period: 9 },      // 风向小幅摆
    { node: 'photo_az', axis: 'y', prop: 'rotation', amp: 0.55, period: 26 }, // 对日方位跟踪
    { node: 'photo_el', axis: 'x', prop: 'rotation', amp: 0.13, period: 26, phase: 1.57 },
  ];
  root.userData.nightMats = nightMats;
  root.userData.blinkMats = blinkMats;
  root.userData.lights = [{ color: 0xffd9a0, pos: [2.45, 1.7, 1.5], range: 9 }];

  return root;
}
