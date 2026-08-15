// sci-swir-01 — 短波红外勘探/气辉相机站(InGaAs 0.9-1.7 um 科学相机城市化部署)
// 契约 MODELS.md §4:1u=1m、原点=基座地面点、+Y 上、正面朝 +Z、THREE 由查看器传入。
// 器件真源:E:\Codex\2026-07-04\InGaAs(640x512/15um InGaAs/InP PIN + CTIA ROIC,
//   TEC -40C,COMSOL 物理热模型 3.85A 定版签核);火星化五本账:E:\Claude\mars-swir。
// 相机机身按真机 1:1(70x70x120 mm)装云台;站体(桅杆/柜/标定板)为城市化部署件。
// 动画:云台方位=声明式 oscillator 缓扫;俯仰=animate 昼低仰角(扫矿区)/夜高仰角
//   (朝天测 1.27um 气辉)平滑切换;滤光轮 spinner;§4c 感知通道假彩色 SWIR 小屏
//   (引擎回填像素->伪彩 LUT;无通道时纯 t 合成图样,同文件优雅降级)。
// 互引:res-rodwell-01/res-mine-01(找水选址)、sci-weather-01(tau 运营)、
//   sci-rad-01(宇宙线帧差)、com-station-01(回传)。

export const meta = {
  id: 'sci-swir-01',
  name: '短波红外勘探/气辉相机站',
  name_en: 'SWIR Prospecting & Airglow Camera Station',
  size_m: 5.01,              // 实测包围盒长边(validate INFO x=5.01 校准)
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

const COL = {
  steel: 0x9aa0a6, dark: 0x565b61, white: 0xe9ebec, orange: 0xe8621f,
  cabin: 0xdfe2e3, box: 0x6a6f74, pad: 0x6f635a, copper: 0x9a6a3a,
  body: 0x23262a, gold: 0xd8b356, pcb: 0x2e6b3f, glow: 0xffd9a0,
};

export function build(THREE) {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group();
  root.name = meta.id;
  const nightMats = [], blinkMats = [];

  let _seed = 20260807;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  const matte = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.1, ...extra });
  const mSteel = matte(COL.steel, { metalness: 0.35, roughness: 0.6 });
  const mDark = matte(COL.dark, { metalness: 0.3, roughness: 0.65 });
  const mWhite = matte(COL.white, { roughness: 0.78 });
  const mOrange = matte(COL.orange);
  const mCabin = matte(COL.cabin, { roughness: 0.85 });
  const mBox = matte(COL.box, { metalness: 0.25 });
  const mPad = matte(COL.pad, { roughness: 1.0 });
  const mCopper = matte(COL.copper, { metalness: 0.55, roughness: 0.5 });
  const mBody = matte(COL.body, { metalness: 0.4, roughness: 0.45 });
  const mGold = matte(COL.gold, { metalness: 0.25, roughness: 0.55 });   // MLI(高 metalness 会发黑,heli 坑账)
  const mPCB = matte(COL.pcb, { roughness: 0.8 });
  const mRock = matte(0x8a5a3c, { roughness: 1.0 });
  const mRockB = matte(0x6e4630, { roughness: 1.0 });
  // 标定板灰阶(找水通道平场/辐射定标)
  const mCal = [matte(0xf2f2f2), matte(0xbdbdbd), matte(0x7a7a7a), matte(0x3c3c3c)];
  // 滤光轮 5 通道色标(与知识卡同色因果链:F1 气辉紫/F2 基线灰/F3 CO2 冰白/
  // F4 H2O 冰青/F5 右基线橙)
  const mF = [matte(0x8d6bd6), matte(0xb9bec3), matte(0xf4f6f8), matte(0x4fd0c7), matte(0xe8933f)];

  const winMat = new THREE.MeshStandardMaterial({
    color: COL.glow, emissive: COL.glow, emissiveIntensity: 0.3, roughness: 0.4 });
  nightMats.push(winMat);
  const ledGreen = new THREE.MeshStandardMaterial({
    color: 0x46ff92, emissive: 0x46ff92, emissiveIntensity: 0.3, roughness: 0.4 });
  nightMats.push(ledGreen);
  const ledAmber = new THREE.MeshStandardMaterial({
    color: 0xffb020, emissive: 0xcc8010, emissiveIntensity: 2.0, roughness: 0.4 });
  blinkMats.push(ledAmber);                          // 尘暴运营警示(tau 卡联动,只进 blink)

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
  function tube(a, b, r, mat, parent, seg = 10) {
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

  // ── 支腿平台:1.6x1.6 甲板 @0.45 + 4 组 A 字腿 + 调平脚 + 防尘裙 ──
  box(1.6, 0.07, 1.6, mSteel, 0, 0.45, 0);
  box(1.7, 0.03, 1.7, mDark, 0, 0.49, 0);                       // 甲板压条
  const LEG = 0.62;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(s => {
    const lx = s[0] * LEG, lz = s[1] * LEG;
    beam(lx * 1.25, 0.06, lz * 1.25, lx * 0.8, 0.44, lz * 0.8, 0.06, mSteel);
    beam(lx * 0.75, 0.06, lz * 1.25, lx * 0.8, 0.44, lz * 0.8, 0.045, mDark);  // 斜撑
    box(0.2, 0.05, 0.2, mPad, lx * 1.25, 0.025, lz * 1.25);     // 调平脚垫
    box(0.05, 0.12, 0.05, mDark, lx * 1.25, 0.1, lz * 1.25);    // 调平丝杠
  });
  // 甲板边警示条 + 检修踏步
  box(1.6, 0.025, 0.06, mOrange, 0, 0.505, 0.82);
  box(0.5, 0.05, 0.24, mDark, 0, 0.2, 1.0);
  poi('poi_platform', 0, 0.5, 0.9);

  // ── 桅杆:D140x5 钢管 2.0 m + 电缆导管 + 接线箱(账 5:EI 9.7e5,尘暴裕度 23x)──
  const mastTop = 2.45;
  tube(V3(0, 0.48, 0), V3(0, mastTop, 0), 0.07, mWhite);
  tube(V3(0.09, 0.5, 0.02), V3(0.09, mastTop - 0.1, 0.02), 0.022, mDark);   // 外走线导管
  box(0.16, 0.22, 0.1, mBox, -0.1, 1.1, 0.06);                  // 接线箱
  box(0.22, 0.05, 0.22, mSteel, 0, 0.5, 0);                     // 桅杆法兰
  box(0.2, 0.04, 0.2, mSteel, 0, mastTop + 0.02, 0);            // 顶法兰

  // ── 双轴云台:方位转盘(声明式缓扫) + 俯仰耳轴(animate 昼/夜切换) ──
  const az = new THREE.Group(); az.name = 'gimbal_az';
  az.position.y = mastTop + 0.06; root.add(az);
  const azDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 16), mCabin);
  azDrum.position.y = 0.02; az.add(azDrum);
  box(0.05, 0.34, 0.14, mCabin, -0.13, 0.22, 0, az);            // 叉臂 x2
  box(0.05, 0.34, 0.14, mCabin, 0.13, 0.22, 0, az);
  box(0.07, 0.07, 0.05, mDark, 0.13, 0.33, 0.09, az);           // 俯仰电机盒
  const el = new THREE.Group(); el.name = 'gimbal_el';
  el.position.y = 0.33; el.rotation.x = 0.10;                    // 基准=昼:低仰角俯扫矿区
  az.add(el);
  tube(V3(-0.13, 0, 0), V3(0.13, 0, 0), 0.028, mDark, el);       // 耳轴

  // ── 相机本体(真机 1:1,70x70x120 mm):C-mount 镜筒+遮光罩+滤光鼓+散热鳍 ──
  const cam = new THREE.Group(); cam.position.y = -0.005; el.add(cam);
  box(0.07, 0.07, 0.12, mBody, 0, 0, 0, cam);                    // 密封机身(6061 黑阳极化)
  box(0.074, 0.03, 0.124, mGold, 0, 0.0, 0, cam);                // MLI 保温带(冷腔段)
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.055, 14), mDark);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0, 0.087); cam.add(barrel);
  box(0.03, 0.03, 0.012, mSteel, 0, 0, 0.061, cam);               // C-mount 法兰(Invar 隔圈,账 11)
  // 滤光轮:**必须前置在镜头之前**(账 11):20 nm 窄带放在 f/1.4 会聚光路里,
  //   锥半角 19.65° 使中心波长蓝移 23.7 nm = 带宽的 118%(叠边缘视场 42.5 nm = 212%),
  //   窄带会完全错开 1.27 µm 气辉线。远物物方近平行,前置后只剩 ±7° 视场角 → 漂移 3.1 nm(15%)。
  //   代价:通光孔要覆盖前口径 Ø45 → 5 孔分度盘放大到 Ø140(轮心偏轴 42 mm,一孔对光轴)。
  const fw = new THREE.Group(); fw.name = 'filter_drum';           // 轮心偏轴,绕光轴(局部 z)转
  fw.position.set(-0.042, 0, 0.135); cam.add(fw);
  const fwDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.070, 0.014, 24), mCabin);
  fwDisk.rotation.x = Math.PI / 2; fw.add(fwDisk);
  for (let i = 0; i < 5; i++) {                                    // 5 通光孔(F1..F5 同色因果链)
    const a = (i / 5) * Math.PI * 2;
    const px = Math.cos(a) * 0.042, py = Math.sin(a) * 0.042;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.0255, 0.0255, 0.016, 14), mBox);
    ring.rotation.x = Math.PI / 2; ring.position.set(px, py, 0); fw.add(ring);   // 孔座
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.0225, 0.0225, 0.006, 14), mF[i]);
    gl.rotation.x = Math.PI / 2; gl.position.set(px, py, 0.006); fw.add(gl);     // 滤光片
  }
  // 轮壳(只露工作孔)+ 分度电机 + 编码器
  const fwCase = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.026, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: COL.box, roughness: 0.8, side: THREE.DoubleSide }));
  fwCase.rotation.x = Math.PI / 2; fwCase.position.set(-0.042, 0, 0.135); cam.add(fwCase);
  box(0.048, 0.048, 0.05, mBox, -0.042, -0.088, 0.135, cam);       // 分度电机(轮下方)
  box(0.03, 0.022, 0.03, mDark, -0.042, -0.058, 0.152, cam);       // 编码器
  // 遮光罩移到滤光轮之前(杂光最前拦,账 9 PST 1e-4 的几何身份)
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.036, 0.06, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: COL.body, roughness: 0.6, side: THREE.DoubleSide }));
  hood.rotation.x = Math.PI / 2; hood.position.set(0, 0, 0.185); cam.add(hood);
  [0.168, 0.196].forEach((hz, i) => {                              // 罩内消光挡板环
    const bf = new THREE.Mesh(new THREE.TorusGeometry(0.036 - i * 0.004, 0.004, 6, 16), mDark);
    bf.position.z = hz; cam.add(bf);
  });
  // 后部:76mm 散热板 + 5 鳍 + 双热管桥 + TEC 排风口(热签核几何蒸馏)
  box(0.076, 0.076, 0.008, mSteel, 0, 0, -0.064, cam);
  for (let i = 0; i < 5; i++) box(0.07, 0.052, 0.003, mSteel, 0, -0.004, -0.072 - i * 0.007, cam);
  tube(V3(0.03, 0.032, -0.02), V3(0.03, 0.032, -0.066), 0.004, mCopper, cam);  // 热管桥 x2
  tube(V3(-0.03, 0.032, -0.02), V3(-0.03, 0.032, -0.066), 0.004, mCopper, cam);
  box(0.024, 0.012, 0.02, mDark, 0, -0.042, -0.058, cam);        // TEC 排风百叶
  box(0.012, 0.006, 0.004, ledGreen, 0.026, 0.03, 0.061, cam);   // 状态 LED
  // 配重杆(俯仰平衡):Ø140 前置滤光轮把重心前移,配重加大并后移(账 11 的机械后果)
  tube(V3(0, -0.03, -0.09), V3(0, -0.095, -0.175), 0.010, mDark, cam);
  box(0.055, 0.055, 0.055, mDark, 0, -0.112, -0.195, cam);
  // §4c 感知相机:沿光轴装(引擎回填像素,喂假彩色小屏)
  const eye = new THREE.PerspectiveCamera(24, 1, 0.2, 600);
  eye.rotation.y = Math.PI;                                      // three 相机看 -Z,翻向 +Z 光轴
  cam.add(eye);
  poi('poi_camera', 0.25, mastTop + 0.35, 0.2);
  poi('poi_filter', -0.26, mastTop + 0.3, 0.3);
  poi('poi_thermal', 0.15, mastTop + 0.42, -0.35);
  poi('poi_roic', -0.22, mastTop + 0.5, -0.18);
  poi('poi_airglow', 0, mastTop + 0.95, 0);

  // ── 设备柜(+X 侧):TEC/加热控制 + 数采 + 假彩色 SWIR 小屏 + 回传天线 ──
  const cab = new THREE.Group(); cab.position.set(1.45, 0, -0.15); root.add(cab);
  box(0.95, 0.12, 0.75, mPad, 0, 0.06, 0, cab);                  // 基础
  box(0.72, 0.95, 0.5, mCabin, 0, 0.6, 0, cab);                  // 柜体
  box(0.76, 0.05, 0.54, mBox, 0, 1.1, 0, cab);                   // 顶盖压条
  box(0.76, 0.08, 0.54, mBox, 0, 0.17, 0, cab);                  // 底裙边
  // 检修门(-Z 面)半开,露 TEC 驱动/加热控制电子架——核心不做黑盒
  const door = new THREE.Group(); door.position.set(-0.36, 0.6, -0.25); cab.add(door);
  door.rotation.y = -1.25;
  box(0.03, 0.8, 0.42, mOrange, 0, 0, 0.21, door);
  box(0.03, 0.1, 0.05, mDark, -0.03, 0, 0.38, door);             // 门把
  box(0.5, 0.66, 0.03, mDark, 0, 0.58, -0.235, cab);             // 舱内背板
  box(0.4, 0.14, 0.02, mPCB, 0, 0.76, -0.22, cab);               // TEC 驱动板(MAX1978 类)
  box(0.4, 0.14, 0.02, mPCB, 0, 0.56, -0.22, cab);               // 数采/加热控制板
  box(0.07, 0.05, 0.025, mDark, -0.1, 0.76, -0.205, cab);
  box(0.07, 0.05, 0.025, mDark, 0.08, 0.56, -0.205, cab);
  box(0.05, 0.03, 0.02, ledGreen, 0.14, 0.76, -0.205, cab);      // TEC 状态灯
  box(0.28, 0.1, 0.1, mBox, 0, 0.34, -0.18, cab);                // 加热器电阻箱(夜间保温档)
  // 假彩色 SWIR 小屏(+Z 面):DataTexture,animate 里喂像素
  const SW = 64, SH = 64;
  const scrData = new Uint8Array(SW * SH * 4);
  const scrTex = new THREE.DataTexture(scrData, SW, SH);
  scrTex.needsUpdate = true;
  const scrMat = new THREE.MeshBasicMaterial({ map: scrTex });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.28), scrMat);
  screen.position.set(-0.02, 0.78, 0.262); cab.add(screen);      // 屏面在框前(遮挡坑)
  box(0.4, 0.34, 0.02, mDark, -0.02, 0.78, 0.245, cab);          // 屏框
  box(0.09, 0.025, 0.02, ledGreen, 0.24, 0.62, 0.252, cab);      // 链路灯
  const storm = box(0.09, 0.025, 0.02, ledAmber, 0.24, 0.56, 0.252, cab);
  storm.name = 'blink_storm';                                    // 尘暴运营警示
  const win = box(0.2, 0.14, 0.02, winMat, -0.18, 0.42, 0.252, cab);  // 夜光状态窗
  // 顶部:对基站小碟(朝 com-station-01,西南) + UHF 鞭
  tube(V3(0.22, 1.12, 0.12), V3(0.22, 1.42, 0.12), 0.02, mSteel, cab);
  const dishG = new THREE.Group(); dishG.position.set(0.22, 1.45, 0.12);
  dishG.rotation.y = 2.4; dishG.rotation.x = -0.45; cab.add(dishG);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 3),
    new THREE.MeshStandardMaterial({ color: COL.white, roughness: 0.75, side: THREE.DoubleSide }));
  dish.rotation.x = Math.PI / 2; dishG.add(dish);
  tube(V3(0, 0, 0), V3(0, 0, -0.14), 0.01, mDark, dishG);
  tube(V3(-0.28, 1.12, -0.15), V3(-0.28, 1.75, -0.15), 0.008, mDark, cab);  // UHF 鞭
  poi('poi_cabinet', 1.45, 1.0, 0.45);
  poi('poi_screen', 1.4, 0.85, 0.6);

  // ── 辐射定标板:灰阶四阶 + 支杆(帧差/平场业务件,面向相机) ──
  const cal = new THREE.Group(); cal.position.set(-1.35, 0, 1.45); cal.rotation.y = 0.55;
  root.add(cal);
  box(0.5, 0.08, 0.4, mPad, 0, 0.04, 0, cal);
  tube(V3(0, 0.08, 0), V3(0, 0.62, 0), 0.022, mSteel, cal);
  box(0.5, 0.4, 0.03, mDark, 0, 0.85, 0, cal);                   // 板框
  for (let i = 0; i < 4; i++)
    box(0.11, 0.34, 0.012, mCal[i], -0.17 + i * 0.113, 0.85, 0.02, cal);
  poi('poi_caltarget', -1.35, 1.0, 1.45);

  // ── 电缆槽:桅杆→设备柜、柜→城网方向 ──
  box(0.9, 0.05, 0.14, mBox, 0.72, 0.03, -0.1);
  box(0.14, 0.05, 0.9, mBox, 1.5, 0.03, -0.85);
  box(0.18, 0.14, 0.12, mBox, 0.35, 0.09, -0.1);                 // 接线箱

  // ── 作业痕迹:巡检车辙 + 散落砾石 ──
  box(0.45, 0.03, 3.0, mRockB, -1.85, 0.015, -0.4).rotation.y = 0.1;
  box(0.45, 0.03, 3.0, mRockB, -2.5, 0.015, -0.25).rotation.y = 0.1;
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);          // 顶点半径 φ≈1.618
  for (let i = 0; i < 18; i++) {
    const a = rnd() * Math.PI * 2, d = 1.2 + rnd() * 1.3, s = 0.04 + rnd() * 0.09;
    const sy = s * (0.55 + rnd() * 0.45);
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? mRock : mRockB);
    rock.position.set(Math.cos(a) * d, -0.3 * sy + 1.618 * sy, Math.sin(a) * d);
    rock.scale.set(s, sy, s);
    rock.rotation.y = rnd() * 6.28;                              // 只绕 Y(贴地可控)
    root.add(rock);
  }

  // ── 尘膜 pass ──
  const dustC = new THREE.Color(0x9e5b3d);
  [mSteel, mDark, mWhite, mOrange, mCabin, mBox, mPad, mCopper, mBody, mGold]
    .forEach(m => m.color.lerp(dustC, 0.05));

  // ── 假彩色 SWIR 屏:LUT(暗=深蓝 亮=青白,冰亮/土暗的勘探伪彩) ──
  const lut = v => {                                             // v 0..1 -> [r,g,b]
    const c = Math.max(0, Math.min(1, v));
    if (c < 0.35) { const k = c / 0.35; return [8 + 30 * k, 12 + 60 * k, 45 + 120 * k]; }
    if (c < 0.7) { const k = (c - 0.35) / 0.35; return [38 + 180 * k, 72 + 110 * k, 165 - 60 * k]; }
    const k = (c - 0.7) / 0.3; return [218 + 37 * k, 182 + 73 * k, 105 + 150 * k];
  };
  const paintSynth = t => {                                      // 无传感器:纯 t 合成地形扫描
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const u = x / SW, w = y / SH;
      let v = 0.5 + 0.28 * Math.sin(u * 9 + t * 0.15) * Math.sin(w * 6 - t * 0.11)
            + 0.22 * (hash(x * 0.35 + ((t * 0.4) | 0), y * 0.35) - 0.5);
      if (Math.abs(w - ((t * 0.05) % 1)) < 0.02) v = 1.0;        // 扫描行
      const [r, g, b] = lut(v);
      const o = (y * SW + x) * 4;
      scrData[o] = r; scrData[o + 1] = g; scrData[o + 2] = b; scrData[o + 3] = 255;
    }
    scrTex.needsUpdate = true;
  };
  paintSynth(0);

  // ── §4c 传感器声明 + animate:俯仰昼/夜切换 + 小屏刷新 ──
  root.userData.sensors = [{ id: 'swir', camera: eye, width: 64, height: 64, hz: 1 }];
  const EL_DAY = 0.10, EL_NIGHT = -1.22;                         // 昼:俯扫矿区;夜:仰角 70° 朝天
  let elNow = EL_DAY, lastScr = -1, lastFrame = 0;
  root.userData.animate = (t, dt, ctx) => {
    const n = ctx ? (typeof ctx.night === 'number' ? ctx.night : (ctx.night ? 1 : 0)) : 0;
    const target = EL_DAY + (EL_NIGHT - EL_DAY) * n;
    const k = Math.min(1, (dt || 0.016) * 0.5);                  // ~2 s 时间常数缓动
    elNow += (target - elNow) * k;
    el.rotation.x = elNow + 0.03 * Math.sin((t * 2 * Math.PI) / 37);  // 微量点头(巡扫感)
    // 小屏 ~4 Hz 节流:有传感器帧走伪彩,无通道走合成图样(优雅降级)
    if (t - lastScr > 0.25) {
      lastScr = t;
      const sen = root.userData.sensors[0];
      if (sen && sen.frame > 0 && sen.data) {
        if (sen.frame !== lastFrame) {
          lastFrame = sen.frame;
          for (let i = 0; i < SW * SH; i++) {
            const o = i * 4;
            const lum = (sen.data[o] * 0.35 + sen.data[o + 1] * 0.45 + sen.data[o + 2] * 0.2) / 255;
            const [r, g, b] = lut(lum);
            scrData[o] = r; scrData[o + 1] = g; scrData[o + 2] = b; scrData[o + 3] = 255;
          }
          scrTex.needsUpdate = true;
        }
      } else paintSynth(t);
    }
  };

  // ── 声明式动画 + 夜光/闪烁/灯光 ──
  root.userData.spinners = [
    { node: 'filter_drum', axis: 'z', rpm: 0.4 },   // 分度盘绕光轴换挡(轮心偏轴,局部 z=光轴)
  ];
  root.userData.oscillators = [
    { node: 'gimbal_az', axis: 'y', prop: 'rotation', amp: 0.6, period: 48 },  // 方位缓扫
  ];
  root.userData.nightMats = nightMats;
  root.userData.blinkMats = blinkMats;
  root.userData.lights = [{ color: 0xffd9a0, pos: [1.45, 1.3, 0.4], range: 7 }];

  return root;
}
