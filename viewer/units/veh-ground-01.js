// veh-ground-01 —— 地面车辆队与保障场
// 补的是全城"账本点名要、但资产不存在"的三台车：
//   ① 低温推进剂罐车——res-cryo-01 头条账的主角（12.8 m³ 可用 = 14.6 t LOX
//      或 5.4 t LCH₄；整备 7.3 t / 总重 21.9 t；35 min 往返；规范操作 1.0 %/趟）。
//      罐区那头已建好鹤管与泊位，车一直缺席，这里补上。
//   ② 重型模块平板车——载荷转运容器与一子级筒段共用的那台（网捕回收的箭
//      放倒后靠它进 ops-vab-01 检修线）。
//   ③ 多用途牵引工程车——挂接/吊装/场地清尘。
// 核心不做黑盒：罐车顶部快接盘/回气接口朝上敞开（鹤管就接这儿）、罐体断面
// 露真空夹套内胆、平板车驮着的正是 ops-payload-01 出厂的那只载荷转运容器
// （同色因果链：容器蓝环 = 载荷厂房洁净间蓝环）；充电桩状态灯分色（绿=满/黄=充电中/暗=空位）。
//
// 契约：1u=1m；原点 = 保障场硬化坪中心地面；+Y 上；场区出口朝 +Z。
// 动画：牵引车顶警示灯（blinkMats）；无循环运动（车辆停放态，转运由剧情承担）。
// POI：poi_tanker / poi_flatbed / poi_utility / poi_charge

export const meta = {
  id: 'veh-ground-01',
  name: '地面车辆队与保障场',
  name_en: 'Ground Vehicle Fleet & Support Apron',
  size_m: 51,                 // 实测最大边（含场区灯杆与散落砾石）——manifest 同值
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'veh-ground-01';

  let _seed = 20260719;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };

  // ---------------------------------------------------------------- 材质
  const std = (color, roughness = 0.85, metalness = 0.05) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const dusted = (hex, roughness = 0.95) => {
    const c = new THREE.Color(hex);
    c.r *= 0.97; c.g *= 0.92; c.b *= 0.90;
    return new THREE.MeshStandardMaterial({ color: c, roughness, metalness: 0.02 });
  };
  const M = {
    conc:    std(0xb9a48c, 0.98),
    concTop: dusted(0xb9a48c),
    body:    std(0xe8e4dc, 0.7, 0.1),    // 车身白
    cab:     std(0xd4671f, 0.7, 0.1),    // 驾驶室橙（场区可视度）
    jacket:  std(0xf2f0ea, 0.55, 0.2),   // 罐体真空夹套外壳
    inner:   std(0xc2cad1, 0.45, 0.5),   // 内胆（断面露出）
    blue:    std(0x2b7cc9, 0.7, 0.15),   // 蓝环 = 载荷容器同色链
    steel:   std(0x8e979e, 0.8),
    dark:    std(0x4a4e54, 0.75),
    tyre:    std(0x2a2d31, 0.95),
    safety:  std(0xc0662a, 0.8),
    rib:     std(0xc9ced3, 0.8),
    tread:   std(0x5a4536, 0.98),
  };
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xd8f0ff, emissive: 0xcfe8ff, emissiveIntensity: 1.0, roughness: 0.3 });
  const litGreen = new THREE.MeshStandardMaterial({
    color: 0x54ff7a, emissive: 0x3fe864, emissiveIntensity: 1.0, roughness: 0.4 });
  const litAmber = new THREE.MeshStandardMaterial({
    color: 0xffd94f, emissive: 0xf0c43a, emissiveIntensity: 1.0, roughness: 0.4 });
  const blinkMat = new THREE.MeshStandardMaterial({
    color: 0xff9020, emissive: 0xff7a10, emissiveIntensity: 2.0, roughness: 0.4 });
  g.userData.nightMats = [windowMat, litGreen, litAmber];
  g.userData.blinkMats = [blinkMat];

  // ---------------------------------------------------------------- 助手
  const box = (w, h, d, mat, x, y0, z, ry = 0, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y0 + h / 2, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  };
  const boxT = (w, h, d, side, top, x, y0, z, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, side, side, side]);
    m.position.set(x, y0 + h / 2, z);
    parent.add(m);
    return m;
  };
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent = g) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    parent.add(m);
    return m;
  };
  // 火星低压大轮胎（轮轴沿 X）
  const wheel = (x, y, z, r, w, parent = g) => {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 12), M.tyre);
    t.position.set(x, y, z); t.rotation.z = Math.PI / 2;
    parent.add(t);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, w + 0.06, 8), M.rib);
    hub.position.set(x, y, z); hub.rotation.z = Math.PI / 2;
    parent.add(hub);
    return t;
  };
  const anchor = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); g.add(a);
  };

  // ================================================================
  // 0. 保障场：硬化坪 + 车位标线 + 车辙 + 散落砾石
  // ================================================================
  boxT(46, 0.35, 32, M.conc, M.concTop, 0, -0.2, 0);
  for (const [lx, lw] of [[-4, 4.2], [12, 6.4]])                  // 车位标线（白）
    for (const s of [-1, 1])
      box(0.2, 0.04, 24, M.rib, lx + s * lw, 0.15, 1);
  for (const tx of [-5.6, -2.4, 10.2, 13.8])                      // 出口车辙（朝 +Z）
    box(0.5, 0.03, 15, M.tread, tx, 0.15, 21);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 20; i++) {
    const rx = -26 + rnd() * 52, rz = -20 + rnd() * 42;
    if (Math.abs(rx) < 23 && Math.abs(rz) < 16) continue;          // 坪外才撒
    const s = 0.14 + rnd() * 0.2, sy = s * (0.55 + rnd() * 0.45);
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.conc : M.rib);
    rock.position.set(rx, -0.05 - 0.3 * sy + 1.618 * sy, rz);
    rock.scale.set(s, sy, s);
    rock.rotation.y = rnd() * 6.28;
    g.add(rock);
  }

  // ================================================================
  // 1. 低温推进剂罐车（res-cryo-01 账本主角）——车头朝 +Z 待发
  //    12.8 m³ 可用内胆：Ø1.9 × 5.3 m ≈ 15 m³ 毛容，外套真空夹套 Ø2.4 × 6.2
  // ================================================================
  const TK = -4;                                                   // 车位中心 x
  const tanker = new THREE.Group();
  tanker.position.set(TK, 0, -1);
  g.add(tanker);
  // 车架
  box(2.5, 0.45, 10.2, M.steel, 0, 0.95, 0.4, 0, tanker);
  // 加压驾驶室（火星车：小窗 + 密封门 + 顶部生保包）
  box(2.6, 2.3, 3.2, M.cab, 0, 1.4, 4.2, 0, tanker);
  box(2.2, 0.85, 0.18, windowMat, 0, 2.55, 5.82, 0, tanker);       // 前窗
  for (const sx of [-1, 1])
    box(0.18, 0.8, 1.5, windowMat, sx * 1.31, 2.5, 4.3, 0, tanker); // 侧窗
  box(1.5, 0.55, 1.2, M.rib, 0, 3.7, 3.6, 0, tanker);              // 顶部生保/散热包
  box(0.9, 1.6, 0.12, M.safety, -1.32, 1.5, 3.1, 0, tanker);       // 密封门（左）
  box(2.7, 0.35, 0.3, M.safety, 0, 1.05, 5.9, 0, tanker);          // 前保险杠
  for (const sx of [-1, 1]) box(0.28, 0.28, 0.28, windowMat, sx * 1.0, 1.5, 5.92, 0, tanker); // 前灯
  // 真空夹套罐体（横卧，轴沿 Z）
  const jak = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 6.2, 16), M.jacket);
  jak.position.set(0, 2.55, -1.4); jak.rotation.x = Math.PI / 2;
  tanker.add(jak);
  for (const sz of [-1, 1]) {                                      // 封头
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 8), M.jacket);
    cap.position.set(0, 2.55, -1.4 + sz * 3.1);
    tanker.add(cap);
  }
  // 罐尾断面：露出内胆 + 夹套间隙（核心不做黑盒）
  const shell = new THREE.Mesh(new THREE.RingGeometry(1.02, 1.2, 20), M.inner);
  shell.position.set(0, 2.55, -4.52); shell.rotation.y = Math.PI;
  tanker.add(shell);
  const innerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 5.3, 14), M.inner);
  innerCap.position.set(0, 2.55, -1.4); innerCap.rotation.x = Math.PI / 2;
  tanker.add(innerCap);
  box(2.5, 0.35, 0.35, M.blue, 0, 3.6, -1.4, 0, tanker);           // 顶部走台边梁
  // 顶部快接盘 ×2（LOX/LCH₄）+ 回气接口（鹤管接这儿——罐区泊位的对接件）
  for (const [ox, mat, lbl] of [[-0.62, M.blue, 1], [0.62, M.rib, 1]]) {
    box(0.62, 0.3, 0.62, M.steel, ox, 3.75, -0.4, 0, tanker);
    box(0.44, 0.22, 0.44, mat, ox, 4.05, -0.4, 0, tanker);         // 快接盘面（蓝=LOX/灰=CH₄）
  }
  box(0.5, 0.26, 0.5, M.safety, 0, 3.75, -2.6, 0, tanker);         // 回气接口
  box(0.16, 0.9, 0.16, M.safety, 0, 4.01, -2.6, 0, tanker);        // 回气立管
  // 双标牌（同一 12.8 m³ 罐两用，装哪种换牌）
  box(1.5, 0.5, 0.1, M.blue, -1.22, 2.4, -1.4, Math.PI / 2, tanker);
  // 后部泵撬 + 计量柜
  box(2.3, 1.5, 1.5, M.rib, 0, 1.4, -5.3, 0, tanker);
  box(1.0, 0.4, 0.14, windowMat, 0, 2.2, -6.07, 0, tanker);
  box(0.55, 0.55, 0.55, M.dark, 0.85, 1.0, -5.3, 0, tanker);       // 泵壳
  // 轮组：前 2 + 后 4（每侧），Ø1.3 大轮
  for (const sx of [-1, 1]) {
    wheel(sx * 1.35, 0.65, 4.0, 0.65, 0.44, tanker);
    wheel(sx * 1.35, 0.65, -2.9, 0.65, 0.44, tanker);
    wheel(sx * 1.35, 0.65, -4.5, 0.65, 0.44, tanker);
  }
  box(2.9, 0.12, 1.3, M.dark, 0, 1.32, -3.7, 0, tanker);           // 后挡泥板

  // ================================================================
  // 2. 重型模块平板车（载荷容器 / 一子级筒段共用）
  //    8 轴线液压模块，平板长 24；此刻驮着 ops-payload-01 出厂的载荷转运容器
  // ================================================================
  const FB = 12;
  const flat = new THREE.Group();
  flat.position.set(FB, 0, 0);
  g.add(flat);
  box(5.4, 0.9, 24, M.steel, 0, 0.75, 0, 0, flat);                 // 平板梁架
  box(5.8, 0.2, 24.4, M.rib, 0, 1.65, 0, 0, flat);                 // 台面板
  for (let k = 0; k < 8; k++) {                                    // 8 轴线（每轴双轮×两侧）
    const bz = -10.5 + k * 3.0;
    box(5.0, 0.55, 1.5, M.dark, 0, 0.2, bz, 0, flat);              // 摆臂/液压悬架
    for (const sx of [-1, 1]) { wheel(sx * 2.1, 0.55, bz, 0.55, 0.34, flat); wheel(sx * 2.7, 0.55, bz, 0.55, 0.34, flat); }
  }
  box(2.6, 1.4, 1.8, M.cab, 0, 1.85, 11.4, 0, flat);               // 端部操控台（无人随行操作）
  box(1.9, 0.5, 0.14, windowMat, 0, 2.6, 12.32, 0, flat);
  box(0.9, 0.5, 0.9, M.rib, 0, 1.85, -11.4, 0, flat);              // 尾端接口箱
  // 载荷转运容器（封闭式，蓝环 = 载荷厂房洁净间同色链）
  for (const sz of [-1, 1]) box(5.2, 0.7, 1.4, M.safety, 0, 1.85, sz * 5.2, 0, flat);  // 鞍座/固定架
  boxT(4.6, 4.4, 13.5, M.body, dusted(0xe8e4dc), 0, 2.55, 0, flat);
  for (const sz of [-1, 0, 1])                                    // 三道整圈蓝色带（同色因果链）
    box(4.85, 4.5, 0.45, M.blue, 0, 2.5, sz * 5.6, 0, flat);
  box(1.3, 1.3, 0.14, M.rib, 0, 4.0, 6.78, 0, flat);               // 容器端门
  box(0.5, 0.5, 0.16, M.blue, 0, 4.4, 6.82, 0, flat);
  box(0.8, 0.35, 0.8, M.dark, 1.5, 6.95, -4.5, 0, flat);           // 容器顶环控/记录仪
  box(0.3, 0.24, 0.3, litGreen, 1.5, 7.3, -4.5, 0, flat);          // 容器状态灯（绿=洁净保持）

  // ================================================================
  // 3. 多用途牵引工程车（棚下停放）
  // ================================================================
  const UT = -17;
  const util = new THREE.Group();
  util.position.set(UT, 0, -2);
  g.add(util);
  box(2.3, 0.4, 5.2, M.steel, 0, 0.7, 0, 0, util);
  box(2.3, 1.9, 2.3, M.cab, 0, 1.1, 1.1, 0, util);
  box(1.9, 0.75, 0.16, windowMat, 0, 2.1, 2.3, 0, util);
  for (const sx of [-1, 1]) box(0.16, 0.7, 1.1, windowMat, sx * 1.16, 2.05, 1.1, 0, util);
  box(1.5, 0.4, 1.0, M.rib, 0, 3.0, 0.9, 0, util);                 // 顶部工具箱
  const bl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.3), blinkMat);
  bl.position.set(0, 3.31, 0.9);
  util.add(bl);                                                     // 顶部橙色警示灯
  // 后部小吊臂（折叠态）
  box(0.5, 0.5, 2.6, M.safety, 0, 1.1, -1.6, 0, util);
  beam(0, 1.5, -2.4, 0, 2.9, -0.2, 0.34, M.safety, util);
  box(0.35, 0.35, 0.35, M.dark, 0, 2.95, -0.2, 0, util);
  box(1.9, 0.5, 0.6, M.safety, 0, 0.75, -2.7, 0, util);            // 后挂钩梁
  for (const sx of [-1, 1]) { wheel(sx * 1.2, 0.55, 1.5, 0.55, 0.4, util); wheel(sx * 1.2, 0.55, -1.2, 0.55, 0.4, util); }

  // ================================================================
  // 4. 维护棚（单开间，朝 +X 敞开——剖切露内部）+ 充电桩 + 工具墙
  // ================================================================
  const SH = -18;
  box(13, 0.5, 15, M.rib, SH, 0.15, -2);                            // 棚内地坪
  box(0.5, 6.0, 15, M.body, SH - 6.5, 0.15, -2);                    // 背墙（-X）
  box(13, 6.0, 0.5, M.body, SH, 0.15, -9.5);                        // 侧墙 ×2
  box(13, 6.0, 0.5, M.body, SH, 0.15, 5.5);
  boxT(14, 0.5, 16, M.body, dusted(0xe8e4dc), SH, 6.15, -2);        // 顶盖
  for (const sz of [-1, 1]) box(0.5, 6.0, 0.5, M.body, SH + 6.5, 0.15, -2 + sz * 7.25);  // 开口面边柱
  box(13.4, 0.4, 0.4, M.blue, SH, 6.0, 5.7);                        // 檐口蓝条
  box(1.6, 0.35, 12, windowMat, SH - 3, 6.05, -2);                  // 顶部采光带（夜光）
  // 工具墙（背墙上）+ 检修坑护栏
  for (let i = 0; i < 5; i++) box(0.5, 1.5, 0.3, M.steel, SH - 6.15, 2.2, -7.5 + i * 2.6);
  box(1.2, 0.9, 0.6, M.safety, SH - 5.6, 0.65, 3.4);                // 工具车
  // 充电桩 ×3（状态灯分色：绿=满 / 黄=充电中 / 暗=空位）
  [[-10.5, -12.5, litGreen], [-1.0, -12.5, litAmber], [7.5, -12.5, M.dark]].forEach(([cx, cz, lit]) => {
    box(0.8, 2.2, 0.6, M.rib, cx, 0.15, cz);
    box(0.55, 0.45, 0.12, lit, cx, 1.55, cz + 0.32);
    box(0.3, 0.3, 0.3, M.dark, cx, 0.5, cz + 0.35);
    beam(cx, 2.35, cz, cx + 1.6, 1.5, cz + 1.4, 0.12, M.dark);      // 充电缆
  });
  // 场区灯杆 ×2
  for (const lx of [-21, 16]) {
    box(0.35, 7, 0.35, M.rib, lx, 0.15, 13);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.7), windowMat);
    hd.position.set(lx, 7.2, 13);
    hd.lookAt(lx * 0.3, 0, -2);
    g.add(hd);
  }

  // ---------------------------------------------------------------- POI
  anchor('poi_tanker', TK, 4.6, -1);
  anchor('poi_flatbed', FB, 7.6, 0);
  anchor('poi_utility', UT, 3.8, -2);
  anchor('poi_charge', -1.0, 2.6, -12.5);

  // ---------------------------------------------------------------- 引擎接口
  g.userData.lights = [
    { color: 0xffe8c0, pos: [SH, 5, -2], range: 26 },     // 棚内
    { color: 0xdfe8ff, pos: [4, 8, 8], range: 34 },       // 场区
  ];
  g.userData.beams = [];

  // ---------------------------------------------------------------- 尘膜 pass
  const dust = new THREE.Color(0x9e5b3d);
  [M.body, M.cab, M.jacket, M.inner, M.blue, M.steel, M.dark, M.rib,
   M.safety, M.tyre].forEach(m => m.color.lerp(dust, 0.05));

  return g;
}
