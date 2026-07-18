// com-station-01 — 地面通讯基站（对头顶静止轨道中继星 Ka/X + 上合期对地直连备份）
// 契约 MODELS.md §4：1u=1m、原点=基座地面点、+Y 上、THREE 由查看器传入。
// 动画全部声明式（oscillators/blinkMats/nightMats），无 animate。
// 源设计与逐级链路预算见 mars-com-station（G/T 51.8 dB/K，下行余量 24.7 dB）。

export const meta = {
  id: 'com-station-01',
  name: '通讯基站',
  size_m: 17.7,            // 全站含出站管沟的占地长边实测值（主碟口径 12 m）
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

const COL = {
  antenna: 0xeef0f2, steel: 0x8a9098, darkStl: 0x565b61, orange: 0xe8621f,
  shelter: 0xe7e9ea, rust: 0xb08a6a, box: 0x6a6f74, pv: 0x1b2a49,
  padCol: 0x6f635a, glow: 0xffd9a0, beacon: 0xff2a1e,
};

export function build(THREE) {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group();
  root.name = meta.id;
  const nightMats = [];
  const blinkMats = [];

  const matte = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.08, ...extra });

  const mAntenna = matte(COL.antenna, { roughness: 0.7, side: THREE.DoubleSide });
  const mSteel   = matte(COL.steel,   { metalness: 0.35, roughness: 0.6 });
  const mDark    = matte(COL.darkStl, { metalness: 0.35, roughness: 0.65 });
  const mOrange  = matte(COL.orange);
  const mShelter = matte(COL.shelter, { roughness: 0.85 });
  const mRust    = matte(COL.rust,    { roughness: 1.0 });
  const mBox     = matte(COL.box,     { metalness: 0.25 });
  const mPad     = matte(COL.padCol,  { roughness: 1.0 });
  const mPV      = matte(COL.pv,      { metalness: 0.5, roughness: 0.35 });
  const mFrame   = matte(COL.darkStl);
  const mGold    = matte(0xcaa24a,    { metalness: 0.55, roughness: 0.45 });
  const mCopper  = matte(0x9a6a3a,    { metalness: 0.6,  roughness: 0.5 });

  // 夜窗/常亮指示 → nightMats（引擎按昼夜调 emissiveIntensity）
  const winMat = new THREE.MeshStandardMaterial({
    color: COL.glow, emissive: COL.glow, emissiveIntensity: 0.3, roughness: 0.4 });
  nightMats.push(winMat);
  const ledGreen = new THREE.MeshStandardMaterial({
    color: 0x46ff92, emissive: 0x46ff92, emissiveIntensity: 0.3, roughness: 0.4 });
  nightMats.push(ledGreen);
  // 闪烁 → blinkMats（引擎 ~0.8s 脉冲调 color；emissive 常亮托底）
  const ledAmber = new THREE.MeshStandardMaterial({
    color: 0xffb020, emissive: 0xcc8010, emissiveIntensity: 2.0, roughness: 0.4 });
  blinkMats.push(ledAmber);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: COL.beacon, emissive: 0xff2a1a, emissiveIntensity: 2.0, roughness: 0.4 });
  blinkMats.push(beaconMat);

  function strut(a, b, r, mat) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize());
    m.castShadow = m.receiveShadow = true;
    return m;
  }
  function poi(name, x, y, z, parent) {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    (parent || root).add(o);
    return o;
  }

  // ── 抛物面天线（boresight=本地 +Z；含馈电网络+低温前端） ──
  function makeDish(D, f) {
    const g = new THREE.Group();
    const R = D / 2, STEPS = 18, pts = [];
    for (let i = 0; i <= STEPS; i++) {
      const r = (R * i) / STEPS;
      pts.push(new THREE.Vector2(r, (r * r) / (4 * f)));
    }
    pts.push(new THREE.Vector2(R, (R * R) / (4 * f) + 0.12));
    const lathe = new THREE.LatheGeometry(pts, 48);
    const reflector = new THREE.Mesh(lathe, mAntenna);
    reflector.rotation.x = -Math.PI / 2;
    reflector.castShadow = reflector.receiveShadow = true;
    g.add(reflector);
    const dustMat = mRust.clone(); dustMat.side = THREE.BackSide;
    const dust = new THREE.Mesh(lathe, dustMat);
    dust.rotation.x = -Math.PI / 2; dust.scale.setScalar(0.985);
    g.add(dust);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.8, 16), mDark);
    hub.rotation.x = Math.PI / 2; hub.position.z = -0.5; g.add(hub);
    const rimZ = (R * R) / (4 * f);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.add(strut(V3(Math.cos(a) * 0.4, Math.sin(a) * 0.4, -0.7),
                  V3(Math.cos(a) * (R - 0.3), Math.sin(a) * (R - 0.3), rimZ - 0.15), 0.09, mSteel));
    }
    const feed = V3(0, 0, f);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      g.add(strut(V3(Math.cos(a) * (R - 0.5), Math.sin(a) * (R - 0.5), rimZ), feed, 0.13, mSteel));
    }
    const subR = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), mAntenna);
    subR.position.copy(feed); subR.rotation.x = Math.PI; g.add(subR);
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, 0.8, 20), mOrange);
    horn.rotation.x = Math.PI / 2; horn.position.set(0, 0, f - 0.55); g.add(horn);

    if (D >= 6) {
      // 馈电网络：极化器 + OMT/双工器 + 发射支路端口 + 单脉冲耦合器
      const polar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16), mCopper);
      polar.rotation.x = Math.PI / 2; polar.position.set(0, 0, f - 0.85); g.add(polar);
      const diplex = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.42), mCopper);
      diplex.position.set(0, 0, f - 1.05); g.add(diplex);
      const txport = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.4, 10), mCopper);
      txport.rotation.z = Math.PI / 2; txport.position.set(0.3, 0, f - 1.05); g.add(txport);
      const coupler = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 8, 16), mDark);
      coupler.rotation.x = Math.PI / 2; coupler.position.set(0, 0, f - 1.28); g.add(coupler);
      // 低温 LNA 杜瓦 + 冷头 + 馈线
      const dewar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.0, 20), mGold);
      dewar.rotation.x = Math.PI / 2; dewar.position.set(0, 0, f - 1.75); g.add(dewar);
      const coldhead = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.5, 16), mDark);
      coldhead.rotation.x = Math.PI / 2; coldhead.position.set(0, 0, f - 2.4); g.add(coldhead);
      const back = V3(0, 0, -0.6);
      g.add(strut(V3(0, 0, f - 2.55), back, 0.11, mCopper));
      g.add(strut(V3(0.18, 0.05, f - 2.3), V3(0.25, 0.05, -0.55), 0.05, mSteel));
      g.add(strut(V3(-0.18, -0.05, f - 2.3), V3(-0.25, -0.05, -0.55), 0.05, mSteel));
      g.userData.feedNode = back.clone();
    } else {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.5, 14), mDark);
      can.rotation.x = Math.PI / 2; can.position.set(0, 0, f - 1.05); g.add(can);
    }
    g.userData.feedLocal = feed.clone();
    g.userData.rimZ = rimZ;
    return g;
  }

  // ── 烧结圆坪 + 方位转台 ──
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.25, 40), mPad);
  pad.position.y = 0.125; pad.receiveShadow = true; root.add(pad);

  const azMount = new THREE.Group();
  azMount.name = 'azMount';
  azMount.position.y = 0.25;
  root.add(azMount);

  const turntable = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 1.0, 32), mSteel);
  turntable.position.y = 0.5; turntable.castShadow = turntable.receiveShadow = true;
  azMount.add(turntable);
  const gearRing = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.14, 8, 40), mDark);
  gearRing.rotation.x = Math.PI / 2; gearRing.position.y = 0.15; azMount.add(gearRing);
  poi('poi_mount', 0, 0.5, 0, azMount);

  // 驱动柜 ×2（方位/俯仰伺服）
  [0, Math.PI].forEach((a, k) => {
    const cab = new THREE.Group();
    cab.position.set(Math.cos(a) * 1.75, 0, Math.sin(a) * 1.75);
    cab.rotation.y = -a;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.7), mOrange);
    body.position.y = 0.55; body.castShadow = true; cab.add(body);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 14), mDark);
    motor.rotation.x = Math.PI / 2; motor.position.set(0, 0.2, -0.35); cab.add(motor);
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.8, 0.6), mSteel);
      fin.position.set(0.46, 0.55, -0.2 + i * 0.13); cab.add(fin);
    }
    azMount.add(cab);
    if (k === 0) poi('poi_drive', Math.cos(a) * 1.75, 0.55, Math.sin(a) * 1.75, azMount);
  });

  // ── 发射链：HPA 功放柜 + 上行波导 + 旋转关节 ──
  const hpa = new THREE.Group();
  hpa.position.set(1.7, 0, 1.35); hpa.rotation.y = -0.5;
  const hpaBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.75), mBox);
  hpaBody.position.y = 0.65; hpaBody.castShadow = true; hpa.add(hpaBody);
  for (let i = 0; i < 5; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.0, 0.65), mSteel);
    fin.position.set(0.52, 0.65, -0.26 + i * 0.13); hpa.add(fin);
  }
  const hpaFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.25, 12), mCopper);
  hpaFlange.position.set(0, 1.35, 0); hpa.add(hpaFlange);
  azMount.add(hpa);
  poi('poi_hpa', 1.7, 0.65, 1.35, azMount);

  // ── 俯仰轭架 + 枢轴 ──
  const PIVOT_Y = 6.0;
  const armX = 2.6;
  [-1, 1].forEach((s) => {
    azMount.add(strut(V3(s * armX, 1.0, 0), V3(s * armX, PIVOT_Y, 0), 0.22, mSteel));
    azMount.add(strut(V3(s * 1.4, 1.0, 1.2), V3(s * armX, PIVOT_Y - 0.4, 0), 0.14, mSteel));
    azMount.add(strut(V3(s * 1.4, 1.0, -1.2), V3(s * armX, PIVOT_Y - 0.4, 0), 0.14, mSteel));
  });
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, armX * 2 + 0.4, 16), mDark);
  axle.rotation.z = Math.PI / 2; axle.position.y = PIVOT_Y; azMount.add(axle);

  const wgR = 0.09;
  azMount.add(strut(V3(1.7, 1.35, 1.35), V3(2.55, 1.3, 0.25), wgR, mCopper));
  azMount.add(strut(V3(2.55, 1.3, 0.25), V3(2.55, PIVOT_Y - 0.3, 0.15), wgR, mCopper));
  azMount.add(strut(V3(2.55, PIVOT_Y - 0.3, 0.15), V3(0.45, PIVOT_Y, 0.05), wgR, mCopper));
  const elJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), mDark);
  elJoint.rotation.z = Math.PI / 2; elJoint.position.set(0.15, PIVOT_Y, 0);
  azMount.add(elJoint);
  const azJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.1, 16), mDark);
  azJoint.position.set(0, 0.8, 0); root.add(azJoint);
  const azCollar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 8, 24), mCopper);
  azCollar.rotation.x = Math.PI / 2; azCollar.position.set(0, 1.15, 0); root.add(azCollar);

  const elPivot = new THREE.Group();
  elPivot.name = 'elPivot';
  elPivot.position.set(0, PIVOT_Y, 0);
  azMount.add(elPivot);

  const dish = makeDish(12, 4.8);
  dish.position.set(0, 0, -0.7);
  elPivot.add(dish);
  elPivot.rotation.x = -Math.PI / 3;          // 指向偏天顶 30°（振荡围绕此基准）

  poi('poi_dish', 0, 0, 1.0, elPivot);
  poi('poi_feed', 0, 0, dish.userData.feedLocal.z - 0.7, elPivot);
  poi('poi_diplexer', 0.3, 0, dish.userData.feedLocal.z - 0.7 - 1.05, elPivot);

  // 自动跟踪接收机（碟背）
  const trk = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.32), mBox);
  trk.position.set(0.9, 0.0, -1.2); elPivot.add(trk);
  const trkLed = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), ledGreen);
  trkLed.position.set(0.9, 0.18, -1.03); elPivot.add(trkLed);
  elPivot.add(strut(V3(0, 0, dish.userData.feedLocal.z - 0.7 - 1.28), V3(0.9, 0.0, -1.2), 0.03, mSteel));
  poi('poi_track', 0.9, 0.0, -1.2, elPivot);
  const fn = dish.userData.feedNode || V3(0, 0, -0.6);
  elPivot.add(strut(V3(0, 0, 0), V3(fn.x, fn.y, fn.z - 0.7), wgR, mCopper));

  // ── 对地直连碟（3 m，上合期备份） ──
  const dteBase = new THREE.Group();
  dteBase.position.set(5.5, 0, -3.0);
  root.add(dteBase);
  const DTE_PIVOT_Y = 2.4;
  const dteTable = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 2.0, 24), mSteel);
  dteTable.position.y = 1.0; dteBase.add(dteTable);
  const dtePivot = new THREE.Group();
  dtePivot.name = 'dtePivot';
  dtePivot.position.set(0, DTE_PIVOT_Y, 0);
  dteBase.add(dtePivot);
  const dteDish = makeDish(3, 1.2);
  dteDish.position.set(0, 0, -0.25);
  dtePivot.add(dteDish);
  dtePivot.rotation.x = -Math.PI / 6;
  dtePivot.rotation.y = 0.5;                  // 振荡围绕此基准
  dteBase.add(strut(V3(0, 2.0, 0), V3(0, DTE_PIVOT_Y, 0), 0.18, mSteel));
  poi('poi_dte', 5.5, DTE_PIVOT_Y, -3.0);

  // ── 设备舱 + 核心机电 ──
  function makeRack(w, h, d) {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mBox);
    shell.position.y = h / 2; shell.castShadow = true; g.add(shell);
    const face = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, h * 0.94, 0.05), mDark);
    face.position.set(0, h / 2, d / 2 + 0.02); g.add(face);
    for (let i = 0; i < 3; i++) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.03, 0.02), mSteel);
      v.position.set(0, h * 0.25 + i * 0.13, d / 2 + 0.05); g.add(v);
    }
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
      const on = ((r * 5 + c) % 4 !== 0);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), on ? ledGreen : ledAmber);
      led.position.set(-w * 0.3 + c * (w * 0.15), h * 0.72 + r * 0.11, d / 2 + 0.05);
      g.add(led);
    }
    return g;
  }

  const shelter = new THREE.Group();
  shelter.position.set(-4.2, 0, 3.2);
  root.add(shelter);
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.5), mShelter);
  box.position.y = 1.25; box.castShadow = box.receiveShadow = true; shelter.add(box);
  const wg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5.2, 12), mCopper);
  wg.position.set(1.2, 2.7, 0); wg.rotation.z = -0.5; wg.rotation.y = 0.4; shelter.add(wg);
  const cryo = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.7, 18), mDark);
  cryo.position.set(-0.6, 2.85, 0.5); shelter.add(cryo);
  const cryoTop = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 18), mSteel);
  cryoTop.position.set(-0.6, 3.25, 0.5); shelter.add(cryoTop);
  const radTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.2), mGold);
  radTop.position.set(0.3, 2.62, -0.5); radTop.rotation.z = 0.12; shelter.add(radTop);
  const radSide = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.8, 2.0), mGold);
  radSide.position.set(-1.32, 1.4, 0); shelter.add(radSide);
  const patch = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.12), mOrange);
  patch.position.set(-1.28, 0.9, 0.8); patch.rotation.y = Math.PI / 2; shelter.add(patch);
  for (let i = 0; i < 2; i++) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), winMat);
    win.position.set(-0.55 + i * 1.1, 1.5, 1.251); shelter.add(win);
  }
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), mOrange);
  door.position.set(0, 0.8, 1.251); shelter.add(door);
  poi('poi_shelter', -4.2, 1.25, 3.2);

  // 核心撬装：调制解调/基带/电源调理 + 频标柜
  const core = new THREE.Group();
  core.position.set(-6.6, 0, 3.2);
  root.add(core);
  const skid = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 3.0), mDark);
  skid.position.y = 0.1; skid.receiveShadow = true; core.add(skid);
  for (let i = 0; i < 3; i++) {
    const rk = makeRack(1.0, 1.5, 0.8);
    rk.position.set(0, 0.2, -1.0 + i * 1.0);
    rk.rotation.y = Math.PI / 2;
    core.add(rk);
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 3.1), mShelter);
  canopy.position.set(0, 2.0, 0); core.add(canopy);
  [[-0.6, -1.4], [-0.6, 1.4], [0.6, -1.4], [0.6, 1.4]].forEach(([x, z]) =>
    core.add(strut(V3(x, 0.2, z), V3(x, 2.0, z), 0.06, mFrame)));
  const tray = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.35), mFrame);
  tray.position.set(-5.5, 0.5, 3.2); root.add(tray);
  poi('poi_core', -6.6, 1.5, 3.2);

  // 频率/时间基准（氢钟/USO 恒温频标柜，LOCK 常亮）
  const freq = new THREE.Group();
  freq.position.set(-1.05, 0, 0.3);
  [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]].forEach(([x, z]) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.2, 10), mDark);
    foot.position.set(x, 0.1, z); freq.add(foot);
  });
  const vault = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.95, 0.9), mGold);
  vault.position.y = 0.68; vault.castShadow = true; freq.add(vault);
  const fpanel = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.78, 0.04), mDark);
  fpanel.position.set(0, 0.68, 0.46); freq.add(fpanel);
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.02), ledGreen);
  lock.position.set(0, 1.0, 0.47); freq.add(lock);
  core.add(freq);
  core.add(strut(V3(-0.59, 0.68, 0.3), V3(-0.4, 0.9, 0.0), 0.04, mCopper));
  poi('poi_timing', -7.65, 0.68, 3.5);

  // 数据出站：接线箱 + 埋设管沟（朝 +Z 基地方向）
  const jbox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), mOrange);
  jbox.position.set(-6.9, 0.35, 5.0); root.add(jbox);
  const trench = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 6.0), mDark);
  trench.position.set(-6.9, 0.11, 8.2); root.add(trench);
  const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.0, 10), mSteel);
  conduit.rotation.x = Math.PI / 2; conduit.position.set(-6.9, 0.2, 8.2); root.add(conduit);
  root.add(strut(V3(-6.9, 0.5, 4.2), V3(-6.9, 0.4, 4.75), 0.05, mCopper));
  poi('poi_backhaul', -6.9, 0.5, 5.0);

  // ── 配电 + 信标塔 ──
  const power = new THREE.Group();
  power.position.set(4.0, 0, 4.2);
  root.add(power);
  for (let i = 0; i < 2; i++) {
    const panel = new THREE.Group();
    panel.position.set(i * 2.2, 0, 0);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 1.3), mPV);
    glass.position.y = 1.1; glass.rotation.x = -0.5; panel.add(glass);
    panel.add(strut(V3(0, 0, 0.4), V3(0, 1.0, 0.0), 0.09, mFrame));
    panel.add(strut(V3(0, 0, -0.4), V3(0, 1.3, -0.3), 0.09, mFrame));
    power.add(panel);
  }
  const xfmr = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.0), mBox);
  xfmr.position.set(-1.4, 0.7, 0); xfmr.castShadow = true; power.add(xfmr);

  const beacon = new THREE.Group();
  beacon.position.set(-5.0, 0, -4.0);
  root.add(beacon);
  beacon.add(strut(V3(0, 0, 0), V3(0, 6.0, 0), 0.14, mDark));
  [[2, 0], [-1, 1.7], [-1, -1.7]].forEach(([gx, gz]) => {
    beacon.add(strut(V3(gx, 0, gz), V3(0, 5.4, 0), 0.05, mSteel));
  });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), beaconMat);
  lamp.position.y = 6.1;
  beacon.add(lamp);
  poi('poi_beacon', -5.0, 6.1, -4.0);

  // ── 声明式接线（MODELS.md §4） ──
  root.userData.nightMats = nightMats;
  root.userData.blinkMats = blinkMats;
  root.userData.lights = [{ color: 0xffd9a0, pos: [0, 6, 0], range: 40 }];
  root.userData.oscillators = [
    { node: 'azMount',  axis: 'y', amp: 0.31,  period: 120 },            // 方位慢扫 ±18°
    { node: 'elPivot',  axis: 'x', amp: 0.087, period: 80, phase: 1.0 }, // 俯仰 ±5°
    { node: 'dtePivot', axis: 'y', amp: 0.12,  period: 140 },            // 对地碟微动
  ];

  return root;
}
