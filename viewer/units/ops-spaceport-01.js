// ops-spaceport-01 —— 火箭发射回收站(veh-rocket-01 星舰的专用场站)
// 契约:1 单位 = 1 米;原点在着陆坪圆心地面点,+Y 向上,场区出入口朝 +Z。
// 不 import three;无外部贴图;MeshStandard;夜光 emissiveIntensity 0 起步。
// 自 mars_rocket 沙盒迁移并适配:① 删 30m 占位火箭(真箭 veh-rocket-01 经
// manifest mate 落坪心);② 服务塔 35→45 m、双摆臂对准星舰 QD 板(y≈5)与
// 乘员舱门(y≈36.8),臂长缩至 10.5 避开 Ø9 m 筒身;③ 信标转 blinkMats;
// ④ 场站设计已被羽流 L2 独立验证(EQUIPMENT.md §9【C6】:烧结坪覆盖触地
// 羽流足印、4 m 土堤拦截 ≤6.3° 低角喷砂、站距压住弹道射程)。

export const meta = {
  id: 'ops-spaceport-01',
  name: '火箭发射回收站',
  name_en: 'Launch & Recovery Pad',
  size_m: 120, size_axis: 'width',   // 场区长边;自检用,引擎不缩放
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = 'ops-spaceport-01';

  // ---------- 材质(哑光;朝天/大面构件的颜色统一压暗并偏铁锈 5~10% 表达尘膜) ----------
  const RUST = new THREE.Color(0x8a4a30);
  function mat(hex, dust = 0.05, rough = 0.9) {
    const c = new THREE.Color(hex).lerp(RUST, dust).multiplyScalar(0.96);
    return new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0.08 });
  }
  const M = {
    pad:    mat(0x565a5e, 0.12),   // 烧结坪:深灰,顶面尘膜重
    scorch: mat(0x1b1815, 0.0),    // 烧灼痕
    soil:   mat(0xa04f30, 0.10),   // 防爆土堤:铁锈红土
    steel:  mat(0xd8d6cf, 0.05),   // 结构钢灰白
    white:  mat(0xeceae4, 0.04),   // 储罐白
    dark:   mat(0x3a3d42, 0.05),   // 深灰构件
    orange: mat(0xd96a2b, 0.04),   // 安全橙
    green:  mat(0x2f9e5b, 0.0),    // CH4 环带
    blue:   mat(0x2b6fd9, 0.0),    // LOX 环带
    wheel:  mat(0x141414, 0.0),
    concrete: mat(0x8f8c85, 0.12), // 掩体/车库
  };
  M.soil.side = THREE.DoubleSide;

  // 发光材质:白天灭(intensity 0),引擎随夜色拉亮;信标走 blinkMats 红闪通道
  const beaconRed  = new THREE.MeshStandardMaterial({ color: 0x40100c, emissive: 0xff2a1a, emissiveIntensity: 0.0, roughness: 0.6 });
  const windowGlow = new THREE.MeshStandardMaterial({ color: 0x2a2317, emissive: 0xffd9a0, emissiveIntensity: 0.0, roughness: 0.6 });
  const floodGlow  = new THREE.MeshStandardMaterial({ color: 0x2a2a24, emissive: 0xfff3d0, emissiveIntensity: 0.0, roughness: 0.6 });
  const padLight   = new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0xffe9b8, emissiveIntensity: 0.0, roughness: 0.6 });

  // ---------- 小工具 ----------
  function box(w, h, d, material, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  }
  function cyl(rTop, rBot, h, material, x = 0, y = 0, z = 0, seg = 16) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), material);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  }
  const UP = new THREE.Vector3(0, 1, 0);
  function strut(ax, ay, az, bx, by, bz, w, material, parent = group) {
    const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), material);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(UP, dir.normalize());
    parent.add(m);
    return m;
  }

  // ========== 1. 烧结着陆坪:直径 40 m,高出地面 0.5 m,边缘斜坡 ==========
  const PAD_TOP = 0.5;
  cyl(20, 21.5, 0.5, M.pad, 0, 0.25, 0, 48);
  const scorchRings = [[0, 1.4], [2.2, 3.2], [4.4, 5.2], [6.4, 7.2]];
  for (const [r0, r1] of scorchRings) {
    const g = r0 === 0 ? new THREE.CircleGeometry(r1, 32) : new THREE.RingGeometry(r0, r1, 48);
    const m = new THREE.Mesh(g, M.scorch);
    m.rotation.x = -Math.PI / 2;
    m.position.y = PAD_TOP + 0.02;
    group.add(m);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const s = box(0.6, 0.03, 5.5, M.scorch, Math.sin(a) * 5.0, PAD_TOP + 0.015, Math.cos(a) * 5.0);
    s.rotation.y = a;
  }
  for (let i = 0; i < 8; i++) {                                  // 坪缘警示灯
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.sin(a) * 19, z = Math.cos(a) * 19;
    box(0.3, 0.5, 0.3, M.dark, x, PAD_TOP + 0.25, z);
    box(0.34, 0.3, 0.34, padLight, x, PAD_TOP + 0.6, z);
  }

  // ========== 2. 防爆土堤:内径 60 m,高 4 m,顶宽 3 m,+Z 留 12 m 开口 ==========
  const GAP_HALF = 0.20;
  const bermProfile = [
    new THREE.Vector2(30, 0), new THREE.Vector2(33, 4),
    new THREE.Vector2(36, 4), new THREE.Vector2(42, 0),
  ];
  const berm = new THREE.Mesh(
    new THREE.LatheGeometry(bermProfile, 96, GAP_HALF, Math.PI * 2 - GAP_HALF * 2),
    M.soil,
  );
  group.add(berm);
  const capShape = new THREE.Shape();
  capShape.moveTo(30, 0); capShape.lineTo(33, 4); capShape.lineTo(36, 4); capShape.lineTo(42, 0);
  capShape.closePath();
  for (const phi of [GAP_HALF, -GAP_HALF]) {
    const cap = new THREE.Mesh(new THREE.ShapeGeometry(capShape), M.soil);
    cap.rotation.y = phi - Math.PI / 2;
    group.add(cap);
  }

  // ========== 3. 导航信标:土堤顶均布 10 根(红闪 → blinkMats) ==========
  for (let i = 0; i < 10; i++) {
    const phi = GAP_HALF + 0.15 + (Math.PI * 2 - GAP_HALF * 2 - 0.3) * (i + 0.5) / 10;
    const x = Math.sin(phi) * 34.5, z = Math.cos(phi) * 34.5;
    cyl(0.13, 0.13, 1.5, M.white, x, 4 + 0.75, z, 8);
    box(0.32, 0.32, 0.32, beaconRed, x, 4 + 1.66, z);
  }

  // ========== 4. 服务塔:-X 侧坪缘,45 m(适配 50 m 星舰),粗实心杆桁架 ==========
  const TH = 45;                // 塔高
  const TX = -18;               // 塔中心
  const TB = PAD_TOP;           // 塔基在坪面上
  for (const sx of [-2, 2]) for (const sz of [-2, 2])
    box(0.6, TH, 0.6, M.steel, TX + sx, TB + TH / 2, sz);  // 四角立柱
  for (let lv = 1; lv <= 8; lv++) {                        // 横撑框
    const y = TB + lv * 5;
    box(4.6, 0.35, 0.35, M.steel, TX, y, -2);
    box(4.6, 0.35, 0.35, M.steel, TX, y, 2);
    box(0.35, 0.35, 4.6, M.steel, TX - 2, y, 0);
    box(0.35, 0.35, 4.6, M.steel, TX + 2, y, 0);
  }
  for (let lv = 0; lv < 9; lv++) {                         // ±Z 面交替斜撑
    const y0 = TB + lv * 5, y1 = Math.min(y0 + 5, TB + TH), flip = lv % 2 ? 1 : -1;
    strut(TX - 2 * flip, y0, -2, TX + 2 * flip, y1, -2, 0.3, M.steel);
    strut(TX + 2 * flip, y0, 2, TX - 2 * flip, y1, 2, 0.3, M.steel);
  }
  // 塔顶吊机房 + 小臂 + 航空障碍灯 + 避雷针;塔身电梯井、中部障碍灯
  box(3.2, 2.4, 3.2, M.orange, TX, TB + TH + 1.2, 0);
  box(5.5, 0.45, 0.45, M.steel, TX + 3.5, TB + TH + 1.2, 0);
  box(0.3, 0.3, 0.3, beaconRed, TX, TB + TH + 2.55, 0);
  cyl(0.13, 0.13, 4, M.steel, TX + 1.2, TB + TH + 4.4, 1.2, 6);
  box(1.5, TH - 1, 1.5, M.dark, TX, TB + TH / 2, -2.8);
  box(0.28, 0.28, 0.28, beaconRed, TX - 2, TB + 25.2, -2);
  box(0.28, 0.28, 0.28, beaconRed, TX + 2, TB + 25.2, 2);
  // 双摆臂(pivot 子组):快断臂对星舰 QD 板(y≈5),人员臂对舱门(y≈36.8)
  // 臂长 10.5:平台外缘距 Ø9 m 筒身面(x=-4.5)留 ~0.8 m 间隙
  function swingArm(y, isCrew) {
    const arm = new THREE.Group();
    arm.name = isCrew ? 'arm-crew' : 'arm-qd';
    arm.position.set(TX + 2, y, 0);
    group.add(arm);
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, isCrew ? 2.2 : 1.2, isCrew ? 2 : 1.5), isCrew ? M.white : M.steel);
    beam.position.x = 5.25; arm.add(beam);
    const platY = isCrew ? -1.2 : -0.7;
    const plat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.35, 3), M.steel);
    plat.position.set(9.7, platY, 0); arm.add(plat);
    for (const rz of [-1.35, 1.35]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2, 0.26, 0.26), M.orange);
      rail.position.set(9.7, platY + 1.05, rz); arm.add(rail);
      for (const rx of [8.85, 10.55]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.0, 0.26), M.orange);
        post.position.set(rx, platY + 0.55, rz); arm.add(post);
      }
    }
    if (!isCrew) for (const pz of [-0.45, 0.45]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 9.5, 8), M.dark);
      p.rotation.z = Math.PI / 2; p.position.set(4.75, -0.85, pz); arm.add(p);
    }
    return arm;
  }
  swingArm(TB + 5.0, false);    // 下:推进剂快断臂(星舰 QD 板高度)
  swingArm(TB + 37.0, true);    // 上:人员通道臂(平台面≈35.8,对舱门 36.8)

  // ========== 6. 推进剂区(土堤外 -X):两条卧式低温储罐 + 双排保温管线 ==========
  function tank(x, bandMat) {
    const t = new THREE.Mesh(new THREE.CapsuleGeometry(1.75, 8.5, 4, 16), M.white);
    t.rotation.x = Math.PI / 2;
    t.position.set(x, 2.4, 0);
    group.add(t);
    for (const sz of [-3.5, 3.5]) box(3.2, 1.3, 0.8, M.concrete, x, 0.65, sz);
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.78, 0.1, 8, 24), bandMat);
    band.position.set(x, 2.4, 2.2);
    group.add(band);
  }
  tank(-48, M.green);   // CH4
  tank(-53, M.blue);    // LOX
  box(2.4, 1.2, 5.6, M.dark, -46.6, 0.6, 0);
  for (const pz of [-0.7, 0.7]) {
    const p1 = cyl(0.2, 0.2, 4.8, M.steel, -43.9, 0.35, pz, 10); p1.rotation.z = Math.PI / 2;
    const p2 = cyl(0.2, 0.2, 8.4, M.steel, -25.7, 0.35, pz, 10); p2.rotation.z = Math.PI / 2;
  }
  box(1.4, 1.6, 2.4, M.dark, -21.2, 0.8, 0);

  // ========== 7. 控制掩体(土堤外 +X 后方):半埋拱顶 + 观察窗缝 + 天线 + 雷达 ==========
  const BX = 62;
  box(5, 2.6, 9, M.concrete, BX, 1.1, 0);
  const arch = cyl(2.5, 2.5, 8.6, M.soil, BX, 2.4, 0, 20);
  arch.rotation.x = Math.PI / 2;
  box(0.15, 0.38, 5.2, windowGlow, BX - 2.55, 1.8, 0);
  cyl(0.13, 0.13, 7, M.steel, BX + 1.5, 8.4, -3, 8);
  box(0.9, 0.13, 0.13, M.steel, BX + 1.5, 10.5, -3);
  box(0.6, 0.13, 0.13, M.steel, BX + 1.5, 11.6, -3);
  box(0.8, 0.9, 0.8, M.concrete, BX, 5.2, 2.5);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.28, 0.5, 16), M.white);
  dish.position.set(BX - 0.4, 6.1, 2.5);
  dish.rotation.z = Math.PI / 4;
  group.add(dish);
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), M.steel);
  feed.position.copy(dish.position).add(new THREE.Vector3(-0.35, 0.35, 0));
  feed.rotation.z = Math.PI / 4;
  group.add(feed);

  // ========== 8. 消防车库(+Z 通道旁)+ 橙色救援车 ==========
  const GX = 12, GZ = 37;
  box(0.35, 4.2, 7, M.concrete, GX + 4, 2.1, GZ);
  box(8, 4.2, 0.35, M.concrete, GX, 2.1, GZ - 3.5);
  box(8, 4.2, 0.35, M.concrete, GX, 2.1, GZ + 3.5);
  box(8.8, 0.35, 7.8, mat(0x8f8c85, 0.14), GX, 4.4, GZ);
  {
    const vx = GX - 0.5;
    box(4.4, 1.3, 2.2, M.orange, vx, 1.5, GZ);
    box(1.5, 1.0, 2.2, M.orange, vx - 2.4, 1.4, GZ);
    box(3.0, 0.5, 1.6, M.steel, vx + 0.4, 2.4, GZ);
    for (const wx of [-2.2, -0.4, 1.6]) for (const wz of [-1.15, 1.15]) {
      const w = cyl(0.5, 0.5, 0.4, M.wheel, vx + wx, 0.5, GZ + wz, 12);
      w.rotation.x = Math.PI / 2;
    }
  }

  // ========== 9. 泛光灯塔:土堤外四角 8 m 灯杆,双层灯箱 ==========
  for (const [fx, fz] of [[34, 34], [34, -34], [-34, 34], [-34, -34]]) {
    cyl(0.16, 0.2, 8, M.steel, fx, 4, fz, 8);
    const head = box(1.0, 0.5, 0.65, floodGlow, fx, 8.2, fz);
    head.rotation.y = Math.atan2(-fx, -fz);
    head.rotation.x = -0.35;
    const head2 = box(1.0, 0.5, 0.65, floodGlow, fx, 8.8, fz);
    head2.rotation.y = head.rotation.y + 0.5;
    head2.rotation.x = -0.25;
  }

  // ========== 11. 细化层 ==========
  const roadMat = mat(0x5e5c58, 0.10);
  for (let i = 0; i < 12; i++) {                                  // 坪面 r=16 白色虚线圆
    const a = (i / 12) * Math.PI * 2;
    const d = box(2.4, 0.04, 0.5, M.white, Math.sin(a) * 16, PAD_TOP + 0.02, Math.cos(a) * 16);
    d.rotation.y = a;
  }
  // ---- 通道口挡墙(traverse)+ 折线绕行道路 ----
  // 土堤在 +Z 留了 12 m 开口(±11.5°),那是全场唯一没有遮挡的方向:低角喷砂
  // 可沿开口长驱直出(见 scripts/sim_ejecta_shadow_ops_spaceport_01.py)。
  // 于开口外 z=52 m 设 26 m 长挡墙,遮断角 ±14° > 开口 ±11.5°,视线全断;
  // 道路折向东侧绕行,绕行车位方位角 17~21°,仍在主堤遮挡内。
  {
    const bafShape = new THREE.Shape();          // 对称梯形断面:底宽 12、顶宽 3、高 4
    bafShape.moveTo(-6, 0); bafShape.lineTo(-1.5, 4);
    bafShape.lineTo(1.5, 4); bafShape.lineTo(6, 0);
    bafShape.closePath();
    const baf = new THREE.Mesh(
      new THREE.ExtrudeGeometry(bafShape, { depth: 26, bevelEnabled: false }), M.soil);
    baf.rotation.y = Math.PI / 2;                // 截面立在 x-y,只转 y 让长度沿世界 X
    // 注:Extrude 沿局部 +Z 从 0 挤到 depth,转 y 后变成世界 X 的 0→26,
    // 故 x 要给 -13 才对中开口(给 +13 会整体偏到 x∈[13,39],开口全漏)
    baf.position.set(-13, 0, 52);
    group.add(baf);
    for (const sx of [-11, 0, 11])               // 墙顶红闪警示桩
      box(0.3, 0.3, 0.3, beaconRed, sx, 4.5, 52);
  }
  box(9, 0.12, 22, roadMat, 0, 0.06, 32);                         // 通道硬化路面(直段,止于挡墙前)
  for (const lx of [-4.2, 4.2]) box(0.3, 0.04, 22, M.orange, lx, 0.14, 32);
  {                                                               // 绕行折线:东折 → 北出
    const legA = box(9, 0.12, 16, roadMat, 9.5, 0.06, 45);
    legA.rotation.y = -0.62;
    const legB = box(9, 0.12, 20, roadMat, 18, 0.06, 58);
    legB.rotation.y = -0.15;
  }
  const fan = new THREE.Mesh(new THREE.CircleGeometry(56, 12, -Math.PI / 2 - 0.16, 0.32), mat(0x6b3a24, 0));
  fan.rotation.x = -Math.PI / 2;                                  // +Z 羽流冲刷扇
  fan.position.y = 0.03;
  group.add(fan);
  for (let k = 0; k < 6; k++) {                                   // 土堤登顶台阶 ×2
    const r = 30.2 + k * 0.5, y = 0.34 + k * 0.66;
    box(0.6, 0.68, 1.4, M.concrete, r, y, 0);
    box(1.4, 0.68, 0.6, M.concrete, 0, y, -r);
  }
  for (const sx of [-6.8, 6.8]) box(0.8, 2.6, 0.8, M.orange, sx, 1.3, 40.5);  // 出入口门柱
  cyl(0.13, 0.13, 6, M.steel, -13, 3, 44, 8);                     // 风向标(oscillator 驱动)
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.5, 2.2, 10, 1, true), M.orange);
  sock.name = 'windsock';
  sock.material.side = THREE.DoubleSide;
  sock.rotation.z = -Math.PI / 2 + 0.12;
  sock.position.set(-11.8, 5.75, 44);
  group.add(sock);
  box(6, 2.6, 2.6, M.orange, 20, 1.3, 31);                        // 物资集装箱 ×3
  box(6, 2.6, 2.6, M.white, 20, 1.3, 34.4);
  const c3 = box(5, 2.4, 2.4, M.dark, 19.4, 1.2, 26.6);
  c3.rotation.y = 0.18;
  for (const px of [-45.6, -43.4, -29.2, -26.2, -23.2]) box(0.35, 0.25, 1.9, M.concrete, px, 0.13, 0);
  for (const tx of [-48, -53]) {                                  // 罐顶人孔/阀桩
    cyl(0.5, 0.5, 0.35, M.steel, tx, 4.25, 0, 12);
    cyl(0.13, 0.13, 0.8, M.steel, tx, 4.4, 1.1, 8);
  }
  cyl(0.14, 0.14, 5, M.steel, -50.5, 2.5, -7.5, 8);               // 放空立管
  box(0.9, 0.26, 0.26, M.steel, -50.1, 4.9, -7.5);
  box(2.2, 1.2, 1.6, M.dark, -46.6, 0.6, 3.2);                    // 泵撬
  const pump = cyl(0.45, 0.45, 1.4, M.steel, -46.6, 1.5, 3.2, 12);
  pump.rotation.z = Math.PI / 2;
  for (const fz of [-8.5, 8.5]) {                                 // 储罐区低护栏
    box(16, 0.26, 0.26, M.steel, -50, 1.25, fz);
    for (const fx of [-58, -50, -42]) cyl(0.13, 0.13, 1.3, M.steel, fx, 0.65, fz, 6);
  }
  for (const fx of [-58, -42]) {
    box(0.26, 0.26, 17, M.steel, fx, 1.25, 0);
    cyl(0.13, 0.13, 1.3, M.steel, fx, 0.65, 0, 6);
  }
  box(0.3, 2.8, 2.4, M.steel, 64.55, 1.4, 0);                     // 掩体防爆门
  box(0.3, 2.3, 1.8, M.dark, 64.75, 1.15, 0);
  for (const wz of [-1.6, 1.6]) box(2.6, 1.2, 0.35, M.concrete, 66.2, 0.6, wz);
  for (const vz of [-2.6, 2.6]) {                                 // 拱顶通风筒
    cyl(0.3, 0.3, 1.5, M.concrete, 61.3, 5.0, vz, 10);
    cyl(0.5, 0.5, 0.18, M.steel, 61.3, 5.85, vz, 10);
  }
  box(0.4, 0.6, 7, M.concrete, GX - 4, 4.0, GZ);                  // 车库门楣/角灯
  box(0.3, 0.3, 0.3, beaconRed, GX - 4, 4.6, GZ - 3.4);
  box(0.9, 0.22, 1.6, beaconRed, GX - 2.9, 2.0, GZ);              // 救援车警灯条
  const cannon = cyl(0.14, 0.14, 1.2, M.steel, GX - 0.1, 2.95, GZ, 8);
  cannon.rotation.z = -0.9;                                       // 水炮
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);           // 场区散石(确定性伪随机)
  const rockMat = mat(0x7c4630, 0.05);
  for (let i = 0; i < 18; i++) {
    const h = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const h2 = Math.abs(Math.sin(i * 78.233) * 12543.21) % 1;
    const a = (i / 18) * Math.PI * 2 + h * 0.3;
    const r = 46 + h2 * 30;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (z > 30 && Math.abs(x) < 14) continue;
    if (x < -40 && Math.abs(z) < 11) continue;
    if (x > 52 && Math.abs(z) < 9) continue;
    const rock = new THREE.Mesh(rockGeo, rockMat);
    const s = 0.35 + h * 0.9;
    rock.scale.set(s * (1 + h2 * 0.6), s * 0.7, s);
    rock.position.set(x, s * 0.28, z);
    rock.rotation.set(h * 3, h2 * 6, h * 2);
    group.add(rock);
  }

  // ========== POI 锚点(卡片见 ops-spaceport-01.info.json) ==========
  for (const [n, x, y, z] of [
    ['sinter-pad',    0, 1.0, 0],       // 烧结着陆坪
    ['berm',          0, 4.0, -34.5],   // 防爆土堤
    ['service-tower', -18, 22, 0],      // 服务塔与摆臂
    ['prop-farm',     -50, 3, 0],       // 推进剂区
    ['bunker',        62, 3, 0],        // 控制掩体
    ['fire-garage',   12, 2.5, 37],     // 消防车库
  ]) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + n;
    a.position.set(x, y, z);
    group.add(a);
  }

  // ========== 10. 引擎接口 ==========
  group.userData.nightMats = [windowGlow, floodGlow, padLight];
  group.userData.blinkMats = [beaconRed];
  group.userData.oscillators = [{ node: 'windsock', axis: 'y', amp: 0.35, period: 5 }];
  group.userData.lights = [
    { color: 0xfff0d8, pos: [0, 12, 0], range: 60 },    // 着陆坪上方
    { color: 0xffe2b8, pos: [-18, 24, 0], range: 40 },  // 服务塔中部
  ];
  group.userData.beams = [];

  return group;
}
