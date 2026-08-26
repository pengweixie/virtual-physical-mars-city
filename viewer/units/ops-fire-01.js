// ops-fire-01 —— 应急消防站(两开间车库 + 火星消防车 + 训练塔 + CO2 充填站)
// 设计册 E:\Claude\mars-fire(6 本账 / 24 闸);契约 MODELS.md §4
// 1 单位 = 1 米;原点 = 基座中心地面点;正面(车库门)朝 +Z
export const meta = {
  id: 'ops-fire-01',
  name: '应急消防站',
  name_en: 'Emergency Fire Station',
  size_m: 24.8,              // 实测包围盒最大边(validate_unit 校核)
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;

  // ---- 确定性伪随机 ----
  let _seed = 20260819;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };

  // ---- 材质 ----
  const M = {
    white:  new THREE.MeshStandardMaterial({ color: 0xd8d2c8, roughness: 0.85 }),
    shell:  new THREE.MeshStandardMaterial({ color: 0xcfc9be, roughness: 0.9 }),
    grey:   new THREE.MeshStandardMaterial({ color: 0x8d9298, roughness: 0.6, metalness: 0.3 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.7 }),
    red:    new THREE.MeshStandardMaterial({ color: 0xb03a2e, roughness: 0.55, metalness: 0.15 }),
    redDk:  new THREE.MeshStandardMaterial({ color: 0x7e2a21, roughness: 0.7 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.8 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0xaab0b6, roughness: 0.4, metalness: 0.55 }),
    co2:    new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.45, metalness: 0.5 }),
    water:  new THREE.MeshStandardMaterial({ color: 0x3f6f9e, roughness: 0.5, metalness: 0.2 }),
    glass:  new THREE.MeshStandardMaterial({ color: 0x27343e, roughness: 0.2, metalness: 0.6 }),
    ground: new THREE.MeshLambertMaterial({ color: 0x8a4f33 }),
    tread:  new THREE.MeshLambertMaterial({ color: 0x6f4028 }),
    doorMat:new THREE.MeshStandardMaterial({ color: 0xb9b2a6, roughness: 0.75 }),
  };
  // 夜光材质
  const NM = {
    win:    new THREE.MeshStandardMaterial({ color: 0x2b2f36, emissive: 0xffc978, emissiveIntensity: 0.0 }),
    bayGlow:new THREE.MeshStandardMaterial({ color: 0xbdb5a7, emissive: 0xffb45e, emissiveIntensity: 0.0, side: THREE.DoubleSide }),
    beaconR:new THREE.MeshStandardMaterial({ color: 0x551512, emissive: 0xff2a1a, emissiveIntensity: 0.9 }),
    lampW:  new THREE.MeshStandardMaterial({ color: 0x4a4a42, emissive: 0xfff2cf, emissiveIntensity: 0.0 }),
  };

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const cyl = (rt, rb, h, seg, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
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

  // =====================================================================
  // 场坪:混凝土坪 + 出车坡口朝 +Z
  // =====================================================================
  const apron = box(23.4, 0.24, 15.2, M.ground, 0, 0.12, 0);
  box(7.0, 0.06, 3.6, M.tread, -4.6, 0.27, 5.4);            // 出车道面(场坪内)
  // 车辙两条(压过道面向门口)
  box(0.55, 0.04, 4.6, M.tread, -6.4, 0.31, 4.8);
  box(0.55, 0.04, 4.6, M.tread, -3.6, 0.31, 4.8);

  // =====================================================================
  // 主体:两开间车库 12×9×5.2,背靠 -Z;左间(x<0)卷帘门,右间开放剖面
  // =====================================================================
  const GX = -2.5, GZ = -2.2;                                // 车库中心
  const W = 12.6, D = 9.4, H = 5.0;
  // 背墙 / 左墙 / 中柱 / 右墙(右间开口面无门)
  box(W, H, 0.35, M.shell, GX, H / 2 + 0.2, GZ - D / 2);     // 背墙
  box(0.35, H, D, M.shell, GX - W / 2, H / 2 + 0.2, GZ);     // 左墙
  box(0.35, H, D, M.shell, GX + W / 2, H / 2 + 0.2, GZ);     // 右墙
  box(0.5, H, 0.5, M.shell, GX, H / 2 + 0.2, GZ + D / 2);    // 中柱(两开间分界)
  // 顶盖 + 压条 + 底裙边
  box(W + 0.5, 0.35, D + 0.5, M.white, GX, H + 0.35, GZ);
  box(W + 0.8, 0.18, D + 0.8, M.grey, GX, H + 0.6, GZ);      // 顶压条
  box(W + 0.6, 0.3, D + 0.6, M.grey, GX, 0.35, GZ);          // 底裙边
  // 门楣横梁(前立面)
  box(W + 0.4, 0.6, 0.4, M.red, GX, H + 0.0, GZ + D / 2);    // 红色站带
  // 站名条(红底,门楣上方)
  box(4.6, 0.5, 0.1, M.redDk, GX - 3.0, H - 0.75, GZ + D / 2 + 0.22);

  // 左开间卷帘门(oscillator: y 往复 = 开合演示)
  const doorW = 5.2, doorH = 4.2;
  const bayL = GX - 3.05, bayR = GX + 3.05;
  // 短帘幕(3 片)挂在卷筒下,底沿 2.0~3.0 m 往复——几何始终在屋内
  const door = new THREE.Group();
  door.name = 'bay_door';
  door.position.set(bayL, doorH + 0.1, GZ + D / 2 - 0.1);     // 挂点 = 门楣
  for (let i = 0; i < 3; i++) {
    box(doorW, 0.5, 0.1, M.doorMat, 0, -0.27 - i * 0.52, 0, door);
  }
  box(doorW, 0.16, 0.14, M.orange, 0, -0.27 - 3 * 0.52, 0, door); // 底沿橙条
  group.add(door);
  // 门轨
  box(0.16, doorH + 0.7, 0.16, M.dark, bayL - doorW / 2 - 0.1, (doorH + 0.6) / 2, GZ + D / 2 - 0.1);
  box(0.16, doorH + 0.7, 0.16, M.dark, bayL + doorW / 2 + 0.1, (doorH + 0.6) / 2, GZ + D / 2 - 0.1);
  // 卷帘箱
  cyl(0.32, 0.32, doorW + 0.3, 12, M.grey, bayL, doorH + 0.42, GZ + D / 2 - 0.1).rotation.z = Math.PI / 2;

  // 车库内暖光面(顶棚发光板,夜亮)
  const glowL = box(4.8, 0.06, 7.5, NM.bayGlow, bayL, H - 0.1, GZ);
  const glowR = box(4.8, 0.06, 7.5, NM.bayGlow, bayR, H - 0.1, GZ);

  // 左立面观察窗 ×3(值班室,夜亮)
  for (let i = 0; i < 3; i++)
    box(0.08, 0.7, 1.0, NM.win, GX - W / 2 - 0.03, 3.1, GZ - 2.6 + i * 2.4);

  // =====================================================================
  // 右开间:器材墙(账 6 人员账的物化——16 套兼职战斗服 + 手持水雾架)
  // =====================================================================
  const rackZ = GZ - D / 2 + 1.1;
  box(5.4, 2.8, 0.25, M.redDk, bayR, 1.6, rackZ);             // 器材背板(红,与壳体分色)
  box(5.6, 0.08, 2.2, M.dark, bayR, 0.28, rackZ + 1.0);       // 器材区地面条
  for (let i = 0; i < 8; i++) {                               // 战斗服挂位(两排×8)
    const sx = bayR - 2.35 + i * 0.67;
    box(0.42, 0.95, 0.22, i % 2 ? M.orange : M.red, sx, 1.95, rackZ + 0.26);
    box(0.42, 0.6, 0.2, M.white, sx, 0.85, rackZ + 0.26);     // 靴/氧瓶格
  }
  // 手持水雾灭火器排架(蓝头白身,账 3 首选剂)
  for (let i = 0; i < 6; i++) {
    const fx = bayR - 1.8 + i * 0.72;
    cyl(0.11, 0.11, 0.6, 10, M.white, fx, 0.55, rackZ + 1.1);
    cyl(0.06, 0.06, 0.12, 8, M.water, fx, 0.9, rackZ + 1.1);
  }
  // 担架 + 破拆工具柜
  box(0.6, 0.12, 2.0, M.orange, bayR + 2.2, 0.6, GZ + 0.6);
  box(1.2, 1.4, 0.6, M.red, bayR + 2.2, 0.9, GZ - 1.6);

  // =====================================================================
  // 火星消防车(左开间,车头探出门口)—— 账 3 矩阵的物化
  // 7.2 m 长 × 2.5 m 宽:加压驾驶舱 + CO2 罐组 + 水雾模组 + 破拆臂
  // =====================================================================
  const truck = new THREE.Group();
  truck.name = 'truck';
  truck.position.set(bayL, 0, GZ + 1.2);                      // 车头朝 +Z
  group.add(truck);
  const TW = 2.4;
  // 底盘 + 6 轮
  box(TW, 0.5, 7.0, M.dark, 0, 0.85, 0, truck);
  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 14);
  [[-2.5], [0.2], [2.5]].forEach(([wz]) => {
    [-1, 1].forEach(s => {
      const w = new THREE.Mesh(wheelGeo, M.dark);
      w.rotation.z = Math.PI / 2;
      w.position.set(s * (TW / 2 + 0.05), 0.55, wz);
      truck.add(w);
    });
  });
  // 加压驾驶舱(红,圆角感用叠盒)
  box(TW, 1.5, 1.9, M.red, 0, 1.85, 2.45, truck);
  box(TW - 0.3, 0.5, 1.7, M.red, 0, 2.75, 2.4, truck);
  box(TW - 0.4, 0.62, 0.1, M.glass, 0, 2.15, 3.42, truck);    // 前风挡
  box(0.1, 0.5, 0.9, M.glass, -TW / 2 + 0.02, 2.1, 2.3, truck);
  box(0.1, 0.5, 0.9, M.glass, TW / 2 - 0.02, 2.1, 2.3, truck);
  // 车顶警灯杆(blink)
  box(1.6, 0.12, 0.3, M.dark, 0, 3.12, 2.4, truck);
  const b1 = box(0.35, 0.22, 0.26, NM.beaconR, -0.5, 3.3, 2.4, truck);
  const b2 = box(0.35, 0.22, 0.26, NM.beaconR, 0.5, 3.3, 2.4, truck);
  // CO2 罐组(4 横卧灰罐,肩部白环 = EN 1089-3 本城口径)
  const co2rk = box(TW, 0.15, 2.2, M.grey, 0, 1.5, 0.1, truck);
  for (let i = 0; i < 4; i++) {
    const cx = -0.85 + i * 0.57;
    const t = cyl(0.26, 0.26, 2.1, 12, M.co2, cx, 1.85, 0.1, truck);
    t.rotation.x = Math.PI / 2;
    const ring = cyl(0.27, 0.27, 0.18, 12, M.white, cx, 1.85, 0.95, truck);
    ring.rotation.x = Math.PI / 2;
  }
  // 水雾模组(蓝罐 + 卷盘)
  const wt = cyl(0.55, 0.55, 1.6, 14, M.water, 0, 1.9, -1.9, truck);
  wt.rotation.z = Math.PI / 2;
  const reel = cyl(0.4, 0.4, 0.25, 12, M.orange, TW / 2 - 0.15, 2.0, -3.0, truck);
  reel.rotation.z = Math.PI / 2;
  box(0.5, 0.8, 0.7, M.grey, -TW / 2 + 0.3, 1.75, -3.0, truck); // 泵撬
  // 破拆臂(车尾,双节 pivot——姿态即关节角)
  const armBase = new THREE.Group();
  armBase.name = 'arm_base';
  armBase.position.set(0, 2.15, -3.25);
  truck.add(armBase);
  cyl(0.28, 0.34, 0.5, 10, M.dark, 0, 0, 0, armBase);
  const arm1 = new THREE.Group();
  arm1.name = 'arm_seg1';
  arm1.position.set(0, 0.25, 0);
  arm1.rotation.x = -0.85;                                    // 收拢姿态基准
  armBase.add(arm1);
  box(0.22, 1.7, 0.22, M.orange, 0, 0.85, 0, arm1);
  const arm2 = new THREE.Group();
  arm2.name = 'arm_seg2';
  arm2.position.set(0, 1.7, 0);
  arm2.rotation.x = 2.1;
  arm1.add(arm2);
  box(0.18, 1.3, 0.18, M.orange, 0, 0.65, 0, arm2);
  box(0.3, 0.3, 0.14, M.dark, 0, 1.35, 0, arm2);              // 破拆钳头
  // POI 锚:车
  const poiTruck = new THREE.Object3D();
  poiTruck.name = 'poi_truck';
  poiTruck.position.set(bayL, 3.4, GZ + 2.0);
  group.add(poiTruck);

  // =====================================================================
  // 器材间附楼(左侧,-X):密封门 + 外墙导管 + 接线箱 + 屋顶风机(spinner)
  // =====================================================================
  const AX = GX - W / 2 - 2.15, AZ = GZ + 0.6;
  box(4.0, 3.2, 6.4, M.shell, AX, 1.8, AZ);
  box(4.3, 0.2, 6.7, M.grey, AX, 3.5, AZ);                    // 顶压条
  box(4.2, 0.28, 6.6, M.grey, AX, 0.34, AZ);                  // 裙边
  // 密封检修门(框+扇+闩+双铰链)
  const dz = AZ + 6.4 / 2;
  box(1.06, 2.02, 0.07, M.orange, AX, 1.31, dz + 0.02);
  box(0.90, 1.86, 0.09, M.white, AX, 1.31, dz + 0.05);
  box(0.10, 0.26, 0.08, M.dark, AX + 0.32, 1.30, dz + 0.1);
  box(0.14, 0.10, 0.06, M.dark, AX - 0.37, 1.94, dz + 0.08);
  box(0.14, 0.10, 0.06, M.dark, AX - 0.37, 0.68, dz + 0.08);
  // 外墙导管 ×2 + 接线箱
  cyl(0.05, 0.05, 3.0, 8, M.grey, AX - 1.4, 1.6, dz + 0.06);
  cyl(0.05, 0.05, 3.0, 8, M.grey, AX - 1.15, 1.6, dz + 0.06);
  box(0.5, 0.4, 0.2, M.dark, AX - 1.28, 2.3, dz + 0.1);
  // 屋顶排风机(spinner)
  cyl(0.5, 0.55, 0.4, 10, M.grey, AX, 3.75, AZ - 1.2);
  const fan = new THREE.Group();
  fan.name = 'roof_fan';
  fan.position.set(AX, 3.98, AZ - 1.2);
  group.add(fan);
  for (let i = 0; i < 3; i++) {
    const bl = box(0.75, 0.04, 0.16, M.dark, 0, 0, 0, fan);
    bl.position.set(Math.cos(i * 2.094) * 0.2, 0, Math.sin(i * 2.094) * 0.2);
    bl.rotation.y = -i * 2.094;
  }
  const poiCache = new THREE.Object3D();
  poiCache.name = 'poi_cache';
  poiCache.position.set(AX, 3.4, AZ + 2.2);
  group.add(poiCache);

  // =====================================================================
  // CO2 充填站(右前,+X +Z):进气帽 + 压缩撬 + 立瓶排 —— 账 5 的物化
  // "舱外唯一与火有关的东西,是灭火剂的原料"
  // =====================================================================
  const CX2 = 8.2, CZ2 = 3.4;
  box(4.6, 0.18, 3.4, M.grey, CX2, 0.3, CZ2);                 // 撬座
  // 进气塔 + 尘帽(呼应 res-eclss-01 进气帽)
  cyl(0.28, 0.28, 2.6, 10, M.steel, CX2 - 1.6, 1.7, CZ2 - 0.9);
  cyl(0.62, 0.42, 0.5, 10, M.dark, CX2 - 1.6, 3.15, CZ2 - 0.9);
  // 压缩机撬(方箱+散热格栅条)
  box(1.5, 1.1, 1.2, M.steel, CX2 - 0.2, 0.95, CZ2 - 0.7);
  for (let i = 0; i < 4; i++)
    box(0.05, 0.8, 1.0, M.dark, CX2 - 0.85 + 0.03, 0.95, CZ2 - 0.7 - 0.45 + i * 0.3);
  // 立瓶排 ×5(灰身白肩环)
  for (let i = 0; i < 5; i++) {
    const bx = CX2 - 1.3 + i * 0.65;
    cyl(0.22, 0.22, 1.7, 10, M.co2, bx, 1.25, CZ2 + 0.9);
    cyl(0.23, 0.23, 0.16, 10, M.white, bx, 1.95, CZ2 + 0.9);
  }
  // 充装软管弧(管桥)
  beam(CX2 + 0.55, 1.5, CZ2 - 0.7, CX2 + 0.6, 1.9, CZ2 + 0.9, 0.07, M.orange);
  const poiCO2 = new THREE.Object3D();
  poiCO2.name = 'poi_co2';
  poiCO2.position.set(CX2, 3.0, CZ2);
  group.add(poiCO2);

  // =====================================================================
  // 训练塔(右后,+X -Z):8.5 m 桁架塔 + 两层平台 + 干燥横杆 + 橙护栏
  // 账 2 的物化——0.38 g 的火要重新学
  // =====================================================================
  const TX = 8.6, TZ = -4.2;
  const legR = 1.15;
  // 四腿桁架
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
    beam(TX + sx * legR, 0.2, TZ + sz * legR, TX + sx * 0.75, 8.5, TZ + sz * 0.75, 0.18, M.steel);
  // 横撑 + 斜撑(三层)
  for (let lv = 0; lv < 3; lv++) {
    const y = 2.4 + lv * 2.6, k = 1.15 - (y / 8.5) * 0.38;
    beam(TX - k, y, TZ - k, TX + k, y, TZ - k, 0.1, M.steel);
    beam(TX - k, y, TZ + k, TX + k, y, TZ + k, 0.1, M.steel);
    beam(TX - k, y, TZ - k, TX - k, y, TZ + k, 0.1, M.steel);
    beam(TX + k, y, TZ - k, TX + k, y, TZ + k, 0.1, M.steel);
    if (lv < 2) {                                       // 顶层不加斜撑(会戳出塔顶)
      beam(TX - k, y, TZ - k, TX + k * 0.82, y + 2.4, TZ - k * 0.82, 0.07, M.steel);
      beam(TX + k, y, TZ + k, TX - k * 0.82, y + 2.4, TZ + k * 0.82, 0.07, M.steel);
    }
  }
  // 两层平台 + 橙护栏
  for (const py of [4.95, 7.6]) {
    const k = 1.15 - (py / 8.5) * 0.38 + 0.15;
    box(2 * k, 0.12, 2 * k, M.grey, TX, py, TZ);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
      box(0.07, 1.0, 0.07, M.orange, TX + sx * k, py + 0.55, TZ + sz * k);
    for (const s of [-1, 1]) {
      box(2 * k, 0.07, 0.07, M.orange, TX, py + 1.05, TZ + s * k);
      box(0.07, 0.07, 2 * k, M.orange, TX + s * k, py + 1.05, TZ);
    }
  }
  // 干燥横杆(水带 3 条垂挂——训练塔兼干燥架)
  beam(TX - 1.3, 6.4, TZ + 1.55, TX + 1.3, 6.4, TZ + 1.55, 0.09, M.steel);
  for (let i = 0; i < 3; i++)
    box(0.16, 2.6 + (i === 1 ? 0.8 : 0), 0.05, i === 1 ? M.white : M.orange,
        TX - 0.7 + i * 0.7, 6.4 - (2.6 + (i === 1 ? 0.8 : 0)) / 2, TZ + 1.55);
  // 塔顶航空障碍灯(blink)
  const b3 = box(0.2, 0.2, 0.2, NM.beaconR, TX, 8.75, TZ);
  const poiTower = new THREE.Object3D();
  poiTower.name = 'poi_tower';
  poiTower.position.set(TX, 6.5, TZ);
  group.add(poiTower);

  // =====================================================================
  // 站顶了望/通信桅(车库顶,-X 侧)
  // =====================================================================
  const MX = GX - 3.6, MZ = GZ - 2.8, MY = H + 0.55;
  box(1.3, 0.9, 1.3, M.grey, MX, MY + 0.45, MZ);              // 桅基房
  cyl(0.09, 0.12, 5.2, 8, M.steel, MX, MY + 3.4, MZ);         // 主桅
  beam(MX - 0.55, MY + 0.9, MZ - 0.55, MX, MY + 3.2, MZ, 0.06, M.steel);
  beam(MX + 0.55, MY + 0.9, MZ + 0.55, MX, MY + 3.2, MZ, 0.06, M.steel);
  // 鞭天线 ×2 + 平板阵
  cyl(0.02, 0.03, 1.6, 6, M.dark, MX - 0.25, MY + 6.6, MZ);
  cyl(0.02, 0.03, 1.3, 6, M.dark, MX + 0.28, MY + 6.4, MZ - 0.1);
  box(0.5, 0.7, 0.08, M.white, MX + 0.05, MY + 5.3, MZ + 0.15);
  // 桅顶警示灯(blink)+ 泛光灯(夜亮)
  const b4 = box(0.16, 0.16, 0.16, NM.beaconR, MX, MY + 6.05, MZ);
  const flood = box(0.4, 0.22, 0.3, NM.lampW, MX, MY + 4.4, MZ + 0.25);
  flood.rotation.x = 0.5;
  const poiMast = new THREE.Object3D();
  poiMast.name = 'poi_mast';
  poiMast.position.set(MX, MY + 4.5, MZ);
  group.add(poiMast);

  // 站本体 POI(账 1 立项)
  const poiS = new THREE.Object3D();
  poiS.name = 'poi_station';
  poiS.position.set(GX, H + 1.0, GZ + D / 2);
  group.add(poiS);

  // =====================================================================
  // 作业痕迹:散落砾石(确定性)
  // =====================================================================
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 14; i++) {
    const a = rnd() * 6.283, d = 8.5 + rnd() * 3.5, s = 0.08 + rnd() * 0.1;
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.ground : M.tread);
    rock.position.set(Math.cos(a) * d, 0.24 - 0.3 * s + 1.618 * s, Math.sin(a) * d * 0.62);
    rock.scale.set(s, s * 0.7, s);
    rock.rotation.y = rnd() * 6.28;
    group.add(rock);
  }

  // ---- 尘膜 pass ----
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.shell, M.grey, M.red, M.orange, M.steel, M.co2, M.water, M.doorMat]
    .forEach(m => m.color.lerp(dust, 0.05));

  // =====================================================================
  // 声明式动画 + 夜光
  // =====================================================================
  group.userData.spinners = [{ node: 'roof_fan', axis: 'y', rpm: 26 }];
  // 卷帘门:围绕注册姿态(y=0 关)正弦抬升演示——amp 取半开幅
  door.position.y = doorH + 0.35;                             // 基准:幕底 ~2.8 m
  group.userData.oscillators = [
    { node: 'bay_door', prop: 'position', axis: 'y', amp: 0.5, period: 14 },
  ];
  group.userData.blinkMats = [NM.beaconR];
  group.userData.nightMats = [NM.win, NM.bayGlow, NM.lampW];
  group.userData.lights = [
    { color: 0xffb45e, pos: [bayL, H - 0.4, GZ + 1.5], range: 16 },
  ];
  group.userData.label = '应急消防站';

  return group;
}
