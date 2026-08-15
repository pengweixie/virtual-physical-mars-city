// sci-ir-01 — 热红外成像站(8-14 µm VOx 微测辐射热计 640×512 / 锗 f/1 / 云台塔站)
// 契约 MODELS.md §4:1u=1m、原点=基座地面点、+Y 上、正面朝 +Z、THREE 由查看器传入。
// 设计册 E:\Claude\mars-ir(五本账):像元热模型 NETD 47.3mK/τ7.7ms(FD 交叉验证 +9.9%)、
// 锗 f/1 光学 FOV 30.7°、场景辐射 180-290K 昼夜对比度反转、TEC vs MCT 51:1 功率账、
// 无快门 NUC 残差预算 55mK。知识卡 sim 字段全部引用 mars-ir/out/*.json。
// 动画:云台方位/俯仰=oscillators 缓扫,柜风扇=spinner;animate 只管热图屏——
// §4c sensors 声明镜后 64×64 感知相机,引擎回填帧→亮度→ironbow 伪彩顶点色;
// 引擎无通道时退回纯 t 程序化热场(优雅降级,同文件两用)。
// 剖切(核心不做黑盒):机头 +X 侧开壁,露 镜筒→FPA(墨蓝 die)→TEC(白瓷)→铜热管→尾鳍
// 同色因果链;热走到哪颜色跟到哪。

export const meta = {
  id: 'sci-ir-01',
  name: '热红外成像站',
  name_en: 'Thermal IR Imaging Station',
  size_m: 7.39,            // 实测包围盒长边(y 高 7.39 含 -0.6 入地裙边;俯角翻正后尾鳍略抬,validate INFO)
  size_axis: 'height',
  effects: ['glow_windows', 'blink'],
};

const COL = {
  steel: 0x9aa0a6, darkStl: 0x565b61, white: 0xe9ebec, orange: 0xe8621f,
  box: 0x6a6f74, pad: 0x6f635a, pv: 0x1b2a49, copper: 0x9a6a3a,
  gold: 0xcaa24a, glow: 0xffd9a0, beacon: 0xff2a1e,
};

export function build(THREE) {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group();
  root.name = meta.id;
  const nightMats = [], blinkMats = [];

  // 确定性伪随机(资产可复现)
  let _seed = 20260806;
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

  const matte = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.08, ...extra });
  const mSteel  = matte(COL.steel,  { metalness: 0.35, roughness: 0.6 });
  const mDark   = matte(COL.darkStl,{ metalness: 0.35, roughness: 0.65 });
  const mWhite  = matte(COL.white,  { roughness: 0.75 });
  const mOrange = matte(COL.orange);
  const mBox    = matte(COL.box,    { metalness: 0.25 });
  const mPad    = matte(COL.pad,    { roughness: 1.0 });
  const mPV     = matte(COL.pv,     { metalness: 0.5, roughness: 0.35 });
  const mCopper = matte(COL.copper, { metalness: 0.6, roughness: 0.5 });
  const mGold   = matte(COL.gold,   { metalness: 0.55, roughness: 0.45 });
  const mRock   = matte(0x8a5a3c,   { roughness: 1.0 });
  const mRockB  = matte(0x6e4630,   { roughness: 1.0 });
  const mLens   = matte(0x0a0c10,   { metalness: 0.6, roughness: 0.25 });  // 锗:可见光下纯黑
  const mHoodIn = matte(0x14171b,   { roughness: 0.95, side: THREE.DoubleSide });
  const mDie    = matte(0x1a2a52,   { roughness: 0.5,                       // FPA die 墨蓝
    emissive: 0x1a2a52, emissiveIntensity: 0.25 });
  const mTEC    = matte(0xe8e4da,   { roughness: 0.7,                       // TEC 白瓷
    emissive: 0xe8e4da, emissiveIntensity: 0.12 });
  const mPCB    = matte(0x2e6b3f,   { roughness: 0.8 });

  const winMat = new THREE.MeshStandardMaterial({
    color: COL.glow, emissive: COL.glow, emissiveIntensity: 0.3, roughness: 0.4 });
  nightMats.push(winMat);
  const ledGreen = new THREE.MeshStandardMaterial({
    color: 0x46ff92, emissive: 0x46ff92, emissiveIntensity: 0.3, roughness: 0.4 });
  nightMats.push(ledGreen);
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
    o.name = name; o.position.set(x, y, z);
    (parent || root).add(o);
    return o;
  }

  // ── 基座:打印圆台 + 裙边 + 锚栓 ─────────────────────────────
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.2, 0.32, 24), mPad);
  plinth.position.y = 0.16; plinth.receiveShadow = true; root.add(plinth);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.7, 0.13, 24), mRock);
  skirt.position.y = 0.065; root.add(skirt);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    box(0.09, 0.1, 0.09, mDark, Math.cos(a) * 0.78, 0.35, Math.sin(a) * 0.78);
  }

  // ── 格构塔 5.2 m:4 腿锥度 + 横档 + 交叉斜撑 ─────────────────
  const H = 5.2, NP = 5, wTop = 0.26, wBot = 0.5;
  const legW = 0.075;
  const wAt = f => wBot + (wTop - wBot) * f;
  for (let s = 0; s < 4; s++) {
    const sx = s < 2 ? 1 : -1, sz = s % 2 ? 1 : -1;
    beam(sx * wBot, 0.3, sz * wBot, sx * wTop, 0.3 + H, sz * wTop, legW, mSteel);
  }
  for (let p = 0; p <= NP; p++) {
    const f = p / NP, y = 0.3 + H * f, w = wAt(f);
    // 横档四边
    beam(-w, y, -w,  w, y, -w, 0.05, mSteel);
    beam(-w, y,  w,  w, y,  w, 0.05, mSteel);
    beam(-w, y, -w, -w, y,  w, 0.05, mSteel);
    beam( w, y, -w,  w, y,  w, 0.05, mSteel);
    if (p < NP) {                                   // 交叉斜撑(每面一根,方向交替)
      const f2 = (p + 1) / NP, y2 = 0.3 + H * f2, w2 = wAt(f2);
      const d = p % 2 ? 1 : -1;
      beam(-w * d, y, -w, w2 * d, y2, -w2, 0.045, mSteel);
      beam(-w * d, y,  w, w2 * d, y2,  w2, 0.045, mSteel);
      beam(-w, y, -w * d, -w2, y2, w2 * d, 0.045, mSteel);
      beam( w, y, -w * d,  w2, y2, w2 * d, 0.045, mSteel);
    }
  }
  // 检修爬梯(-Z 面)+ 护笼圈
  const ladZ = -wBot - 0.12;
  tube(V3(-0.18, 0.4, ladZ), V3(-0.18, 0.3 + H, ladZ * 0.55), 0.03, mSteel);
  tube(V3( 0.18, 0.4, ladZ), V3( 0.18, 0.3 + H, ladZ * 0.55), 0.03, mSteel);
  for (let i = 0; i < 16; i++) {
    const f = i / 16, y = 0.5 + (H - 0.35) * f;
    box(0.36, 0.035, 0.035, mSteel, 0, y, ladZ + (ladZ * 0.55 - ladZ) * ((y - 0.4) / (H - 0.1)));
  }

  // ── 顶平台 + 安全橙护栏 ────────────────────────────────────
  const platY = 0.3 + H + 0.04;
  box(1.15, 0.08, 1.15, mDark, 0, platY, 0);
  for (let i = 0; i < 4; i++) {
    const sx = i < 2 ? 1 : -1, sz = i % 2 ? 1 : -1;
    box(0.05, 0.55, 0.05, mOrange, sx * 0.55, platY + 0.31, sz * 0.55);
  }
  const rY = platY + 0.56;
  beam(-0.55, rY, -0.55, 0.55, rY, -0.55, 0.045, mOrange);
  beam(-0.55, rY, 0.55, 0.55, rY, 0.55, 0.045, mOrange);
  beam(-0.55, rY, -0.55, -0.55, rY, 0.55, 0.045, mOrange);
  beam(0.55, rY, -0.55, 0.55, rY, 0.55, 0.045, mOrange);
  // 航空信标(闪烁)
  const bcn = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), beaconMat);
  bcn.position.set(-0.45, rY + 0.16, -0.45); root.add(bcn);
  tube(V3(-0.45, rY, -0.45), V3(-0.45, rY + 0.12, -0.45), 0.02, mDark);

  // ── 云台:方位座 → 方位叉臂(oscillator y) → 俯仰耳轴(oscillator x) → 机头 ──
  const pedY = platY + 0.04;
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.38, 16), mWhite);
  ped.position.set(0, pedY + 0.19, 0); root.add(ped);

  const az = new THREE.Group(); az.name = 'gimbal_az';
  az.position.set(0, pedY + 0.42, 0); root.add(az);
  const azDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.09, 20), mDark);
  azDisc.position.y = 0.0; az.add(azDisc);
  // 叉臂 ×2
  box(0.08, 0.5, 0.16, mWhite, -0.24, 0.28, 0, az);
  box(0.08, 0.5, 0.16, mWhite,  0.24, 0.28, 0, az);
  box(0.5, 0.06, 0.18, mWhite, 0, 0.06, 0, az);      // 叉臂底梁

  const el = new THREE.Group(); el.name = 'gimbal_el';
  el.position.set(0, 0.5, 0); az.add(el);
  // 基准姿态:俯视城。three.js rotation.x **正**方向才是前向(+z)压低
  // (实证:front(0,0,1) 经 rx=+0.16 旋转后 y=-0.159 即向下)。首版写成 -0.16
  // 让相机仰视 9°,城内热屏天空占 2/3——fable review 抓出并翻转。
  // oscillator ±0.10 绕此振荡 → 俯角范围 +0.06..+0.26 rad(3°..15° 下俯)。
  el.rotation.x = 0.16;
  // 耳轴端盖
  const trun1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 14), mDark);
  trun1.rotation.z = Math.PI / 2; trun1.position.set(-0.245, 0, 0); el.add(trun1);
  const trun2 = trun1.clone(); trun2.position.x = 0.245; el.add(trun2);

  // ── 机头:保温壳 + 锗镜头/遮光罩 + 尾部 TEC 鳍 + (+X 剖切) ────
  const head = new THREE.Group(); head.name = 'ir_head'; el.add(head);
  const HL = 0.74, HW = 0.36, HH = 0.32;              // 壳外形(z 长)
  // 壳:底/顶/-X 侧/后端留鳍孔 → 用面板拼(+X 敞开=剖切面)
  box(HW, 0.03, HL, mWhite, 0, -HH / 2 + 0.015, 0, head);
  box(HW, 0.03, HL, mWhite, 0,  HH / 2 - 0.015, 0, head);
  box(0.03, HH - 0.06, HL, mWhite, -HW / 2 + 0.015, 0, 0, head);
  box(HW, HH - 0.06, 0.03, mWhite, 0, 0, -HL / 2 + 0.015, head);   // 后端板
  // +X 剖切面:边柱壳体(上/下边梁 + 前后角柱),内部露出
  box(0.03, 0.05, HL, mWhite, HW / 2 - 0.015, HH / 2 - 0.055, 0, head);
  box(0.03, 0.05, HL, mWhite, HW / 2 - 0.015, -HH / 2 + 0.055, 0, head);
  box(0.03, HH - 0.06, 0.06, mWhite, HW / 2 - 0.015, 0, HL / 2 - 0.05, head);
  box(0.03, HH - 0.06, 0.06, mWhite, HW / 2 - 0.015, 0, -HL / 2 + 0.05, head);
  // 遮阳顶盖(略大,白)
  box(HW + 0.1, 0.025, HL + 0.14, mWhite, 0, HH / 2 + 0.045, -0.02, head);
  box(0.05, 0.05, HL * 0.8, mSteel, 0, HH / 2 + 0.02, 0, head);    // 顶盖支条

  // 内部因果链(剖切可读,+X 侧前→后):镜筒→FPA→TEC→热管→尾鳍
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.2, 18), mDark);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0, HL / 2 - 0.16); head.add(barrel);
  box(0.02, 0.2, 0.2, mPCB, 0.02, 0, HL / 2 - 0.34, head);          // FPA 板(绿 PCB)
  const die = box(0.012, 0.09, 0.11, mDie, 0.035, 0, HL / 2 - 0.34, head); // VOx die 墨蓝
  box(0.03, 0.12, 0.14, mTEC, 0.06, 0, HL / 2 - 0.34, head);        // TEC 白瓷片
  tube(V3(0.06, 0, HL / 2 - 0.36, 0), V3(0.06, 0, -HL / 2 + 0.06), 0.018, mCopper, head); // 热管
  box(0.03, 0.16, 0.28, mPCB, -0.1, 0, -0.06, head);                // 读出/NUC 电子板
  box(0.1, 0.1, 0.16, mGold, -0.05, -0.06, HL / 2 - 0.5, head);     // MLI 金膜包电源块

  // 尾部散热鳍阵(TEC 热端,10 片)
  for (let i = 0; i < 10; i++)
    box(HW - 0.06, 0.2, 0.016, mDark, 0, 0, -HL / 2 - 0.02 - i * 0.033, head);
  tube(V3(0, -0.13, -HL / 2 + 0.02), V3(0, -0.3, -HL / 2 + 0.1), 0.02, mGold, head); // 尾缆(金 MLI)

  // 锗镜头 + 遮光罩:黑色物镜盘(锗可见光不透)+ 罩内消光
  const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 20), mWhite);
  bezel.rotation.x = Math.PI / 2; bezel.position.set(0, 0, HL / 2 + 0.015); head.add(bezel);
  const ge = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.02, 20), mLens);
  ge.rotation.x = Math.PI / 2; ge.position.set(0, 0, HL / 2 + 0.035); head.add(ge);
  const hood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.105, 0.26, 20, 1, true), mHoodIn);
  hood.rotation.x = Math.PI / 2; hood.position.set(0, 0, HL / 2 + 0.17); head.add(hood);
  const hoodRim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.014, 8, 20), mWhite);
  hoodRim.position.set(0, 0, HL / 2 + 0.3); head.add(hoodRim);

  // §4c 感知相机:镜后视轴,看向机头 +Z(相机 -Z 朝前 → 转 π)
  const irCam = new THREE.PerspectiveCamera(28, 1.0, 0.5, 2000);
  irCam.rotation.order = 'YXZ';
  irCam.rotation.y = Math.PI;
  irCam.position.set(0, 0, HL / 2 + 0.05);
  head.add(irCam);
  const sensor = { id: 'ir', camera: irCam, width: 64, height: 64, hz: 2,
                   data: null, frame: 0, stamp: 0 };

  // ── 设备柜(塔东 +X)+ 伪彩热图屏操作台 ───────────────────────
  const cab = new THREE.Group(); cab.position.set(1.75, 0, 0.1); root.add(cab);
  box(1.5, 0.14, 1.0, mPad, 0, 0.07, 0, cab);                        // 柜基座板
  box(1.3, 0.6, 0.85, mPad, 0, -0.3, 0, cab);                        // 入地裙边(斜坡防悬空)
  box(1.06, 1.32, 0.62, mBox, -0.14, 0.14 + 0.66, 0, cab);           // 柜体
  box(1.14, 0.05, 0.7, mDark, -0.14, 1.51, 0, cab);                  // 顶盖压条
  // 密封检修门(+Z 面):框+扇+闩+双铰链
  box(0.62, 1.06, 0.05, mOrange, -0.14, 0.85, 0.30, cab);
  box(0.52, 0.94, 0.06, mWhite, -0.14, 0.85, 0.31, cab);
  box(0.07, 0.16, 0.05, mDark, 0.05, 0.83, 0.34, cab);
  box(0.09, 0.07, 0.04, mDark, -0.36, 1.18, 0.33, cab);
  box(0.09, 0.07, 0.04, mDark, -0.36, 0.52, 0.33, cab);
  // 状态灯 + 小窗(夜光)
  box(0.05, 0.05, 0.03, ledGreen, -0.14, 1.38, 0.32, cab);
  box(0.2, 0.14, 0.03, winMat, 0.22, 1.3, 0.32, cab);
  // 通风格栅 + 风扇(spinner)
  box(0.3, 0.3, 0.03, mDark, -0.14, 0.85, -0.30, cab);
  const fan = new THREE.Group(); fan.name = 'vent_fan';
  fan.position.set(1.61, 0.99, -0.22); fan.rotation.y = Math.PI; root.add(fan);
  for (let i = 0; i < 4; i++) {
    const bl = box(0.02, 0.11, 0.03, mSteel, 0, 0.055, 0, fan);
    bl.rotation.z = (i / 4) * Math.PI * 2; bl.position.set(0, 0, 0);
    bl.geometry.translate(0, 0.055 / 0.11 * 0.11, 0);
  }
  // 柜顶小 PV 板(朝南补电)
  const pv = box(0.9, 0.03, 0.62, mPV, -0.14, 1.64, -0.02, cab);
  pv.rotation.x = 0.30;                               // 前(+Z)缘压低,后缘垫高
  box(0.05, 0.12, 0.05, mSteel, -0.5, 1.58, -0.24, cab);
  box(0.05, 0.12, 0.05, mSteel, 0.24, 1.58, -0.24, cab);
  box(0.05, 0.04, 0.05, mSteel, -0.5, 1.55, 0.2, cab);
  box(0.05, 0.04, 0.05, mSteel, 0.24, 1.55, 0.2, cab);

  // 伪彩热图屏操作台(柜前,面向 +Z 微仰):32×24 顶点色网格 = "城里第一台在看的热像仪"
  const console_ = new THREE.Group(); console_.position.set(1.55, 0, 0.95); root.add(console_);
  box(0.16, 1.15, 0.14, mDark, 0, 0.175, -0.05, console_);           // 立柱(下探 0.4 入地)
  box(0.5, 0.06, 0.4, mPad, 0, 0.03, -0.05, console_);               // 柱脚板
  const scrTilt = -0.32;
  const scrFrame = box(0.72, 0.56, 0.05, mDark, 0, 0.92, 0, console_);
  scrFrame.rotation.x = scrTilt;
  const SGX = 32, SGY = 24;
  const scrGeo = new THREE.PlaneGeometry(0.64, 0.48, SGX, SGY);
  const nVert = (SGX + 1) * (SGY + 1);
  const scrCol = new Float32Array(nVert * 3);
  scrGeo.setAttribute('color', new THREE.BufferAttribute(scrCol, 3));
  const scr = new THREE.Mesh(scrGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true }));
  scr.position.set(0, 0.92, 0.03); scr.rotation.x = scrTilt;
  console_.add(scr);
  // 色标条(ironbow 静态渐变,竖条)
  const barGeo = new THREE.PlaneGeometry(0.05, 0.48, 1, 16);
  const barCol = new Float32Array(2 * 17 * 3);
  const barPos = barGeo.attributes.position;
  for (let i = 0; i < barPos.count; i++) {
    const f = (barPos.getY(i) + 0.24) / 0.48;
    const c = ironbow(f);
    barCol[i * 3] = c[0]; barCol[i * 3 + 1] = c[1]; barCol[i * 3 + 2] = c[2];
  }
  barGeo.setAttribute('color', new THREE.BufferAttribute(barCol, 3));
  const bar = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  bar.position.set(0.40, 0.92, 0.03); bar.rotation.x = scrTilt;
  console_.add(bar);

  // 电缆:机头尾缆 → 塔腿 → 柜(分段管)
  tube(V3(0.3, platY, 0.3), V3(wBot * 0.9, 0.4, wBot * 0.9), 0.025, mDark);
  tube(V3(wBot * 0.9, 0.4, wBot * 0.9), V3(1.2, 0.18, 0.35), 0.025, mDark);
  tube(V3(1.2, 0.18, 0.35), V3(1.55, 0.18, 0.3), 0.025, mDark);
  box(0.2, 0.42, 0.14, mBox, 0.62, 0.21, 0.62);                      // 塔脚接线箱

  // ── 作业痕迹:车辙 + 散石 ───────────────────────────────────
  box(0.5, 0.03, 3.4, mRockB, -1.3, 0.015, 1.6);
  box(0.5, 0.03, 3.4, mRockB, -2.1, 0.015, 1.7);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 10; i++) {
    const a = rnd() * Math.PI * 2, d = 1.6 + rnd() * 1.6, s = 0.06 + rnd() * 0.1;
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? mRock : mRockB);
    rock.position.set(Math.cos(a) * d, -0.3 * s + 1.618 * s * 0.55, Math.sin(a) * d);
    rock.scale.set(s, s * 0.55, s);
    rock.rotation.y = rnd() * 6.28;
    root.add(rock);
  }

  // ── POI 锚点 ───────────────────────────────────────────────
  // 机头三锚**不挂 head**:引擎在加载时一次性烘焙锚点世界坐标(main.js addPois),
  // updatePois 之后不再重读;而 addPois 前有 await fetch(info.json)——挂在会动的
  // 云台上会在随机扫描相位上烘焙,标签飘到机头 0.7 m 外。故按"移动件锚静态起始位"
  // 约定,取机头基准姿态(az=0, el=+0.16 俯视)下的等效 root 局部坐标。
  const headY = pedY + 0.42 + 0.5;                 // 机头原点高度(az 座 + 叉臂)
  const cE = Math.cos(0.16), sE = Math.sin(0.16);
  const headPoi = (name, hx, hy, hz) =>            // 机头局部 → root 局部(仅 el 俯仰)
    poi(name, hx, headY + hy * cE - hz * sE, hy * sE + hz * cE);
  headPoi('poi_fpa', 0.15, 0, -0.05);              // 剖切侧看 FPA/TEC 链
  headPoi('poi_lens', 0, 0, HL / 2 + 0.35);
  headPoi('poi_tec', 0, 0, -HL / 2 - 0.2);
  poi('poi_gimbal', 0, pedY + 0.55, 0.4);
  poi('poi_screen', 1.55, 1.15, 1.25);
  poi('poi_cabinet', 1.75, 1.0, 0.6);
  poi('poi_tower', 0, 2.6, 0.7);

  // ── ironbow 伪彩(6 段查找,x∈[0,1] → [r,g,b]) ────────────────
  function ironbow(x) {
    const S = [[0, 0, 0], [0.15, 0, 0.28], [0.45, 0, 0.55], [0.78, 0.15, 0.22],
               [1, 0.55, 0], [1, 0.9, 0.2], [1, 1, 0.95]];
    const f = Math.min(1, Math.max(0, x)) * (S.length - 1);
    const i = Math.min(S.length - 2, Math.floor(f)), u = f - i;
    return [S[i][0] + (S[i + 1][0] - S[i][0]) * u,
            S[i][1] + (S[i + 1][1] - S[i][1]) * u,
            S[i][2] + (S[i + 1][2] - S[i][2]) * u];
  }

  // ── animate:热图屏(sensors 供帧→伪彩;无通道→纯 t 程序化热场) ──
  const scrPos = scrGeo.attributes.position;
  const scrAttr = scrGeo.attributes.color;
  let lastFrame = 0, lastQ = -1, autoOn = false;
  let emaLo = 0.15, emaHi = 0.6;                     // 自动量程(EMA,仅传感器模式用)
  function paintSensor(data) {
    let lo = 1, hi = 0;
    const lum = new Float32Array(nVert);
    for (let i = 0; i < scrPos.count; i++) {
      const u = (scrPos.getX(i) + 0.32) / 0.64;
      const v = (scrPos.getY(i) + 0.24) / 0.48;
      const gx = Math.min(63, Math.round(u * 63));
      const gy = Math.min(63, Math.round(v * 63));    // data 原点左下,与 v 同向
      const k = (gy * 64 + gx) * 4;
      // 亮度作温度代理 + 行先验压低天空(8-14 µm 火星天空亮温 ≪ 地表,
      // 但可见光里白天天空反而最亮 — 不压会把天映成热)
      let L = (data[k] * 0.4 + data[k + 1] * 0.45 + data[k + 2] * 0.15) / 255;
      L *= 1 - 0.62 * v * v;
      lum[i] = L;
      if (L < lo) lo = L; if (L > hi) hi = L;
    }
    emaLo += (lo - emaLo) * 0.15; emaHi += (hi - emaHi) * 0.15;
    const span = Math.max(0.08, emaHi - emaLo);
    for (let i = 0; i < nVert; i++) {
      const c = ironbow((lum[i] - emaLo) / span);
      scrAttr.setXYZ(i, c[0], c[1], c[2]);
    }
    scrAttr.needsUpdate = true;
  }
  function paintBaked(t) {
    // 程序化"火星热场":上冷天空梯度 + 暖地表 + 两个热源斑(缓慢漂移,周期 60s)
    const tt = (t % 60) / 60;
    for (let i = 0; i < scrPos.count; i++) {
      const u = (scrPos.getX(i) + 0.32) / 0.64;
      const v = (scrPos.getY(i) + 0.24) / 0.48;
      let L = v > 0.62 ? 0.12 - (v - 0.62) * 0.2 : 0.42 - v * 0.25;
      L += (vnoise(u * 5, v * 5, 7.3) - 0.5) * 0.1;
      const bx = 0.25 + 0.5 * tt, by = 0.3;
      const d1 = Math.hypot(u - bx, v - by);
      L += 0.5 * Math.exp(-d1 * d1 / 0.004);          // 移动热源(巡逻车)
      const d2 = Math.hypot(u - 0.72, v - 0.42);
      L += 0.35 * Math.exp(-d2 * d2 / 0.01);          // 固定热源(舱体漏热)
      const c = ironbow(Math.min(1, Math.max(0, L)));
      scrAttr.setXYZ(i, c[0], c[1], c[2]);
    }
    scrAttr.needsUpdate = true;
  }
  paintBaked(0);                                      // 初始画面

  root.userData.sensors = [sensor];
  root.userData.animate = (t, dt, ctx) => {
    if (sensor.frame > 0) autoOn = true;              // 引擎供帧 → 真热像(粘性)
    if (autoOn) {
      if (sensor.frame !== lastFrame && sensor.data) {
        lastFrame = sensor.frame;
        paintSensor(sensor.data);
      }
    } else {
      const q = Math.floor(t * 5);                    // 5 Hz 重画,纯 t 确定性
      if (q !== lastQ) { lastQ = q; paintBaked(t); }
    }
  };

  // ── 声明式动画:云台缓扫 + 柜风扇 ────────────────────────────
  root.userData.spinners = [{ node: 'vent_fan', axis: 'z', rpm: 24 }];
  root.userData.oscillators = [
    { node: 'gimbal_az', axis: 'y', prop: 'rotation', amp: 1.05, period: 60, phase: 0 },
    { node: 'gimbal_el', axis: 'x', prop: 'rotation', amp: 0.10, period: 20, phase: 1.3 },
  ];
  root.userData.nightMats = nightMats;
  root.userData.blinkMats = blinkMats;
  root.userData.lights = [{ color: 0xffd9a0, pos: [1.55, 1.6, 1.0], range: 8 }];

  // ── 尘膜 pass ──────────────────────────────────────────────
  const dust = new THREE.Color(0x9e5b3d);
  [mSteel, mDark, mWhite, mOrange, mBox, mPV, mPad].forEach(m => m.color.lerp(dust, 0.05));

  return root;
}
