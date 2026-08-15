// ops-vab-01 —— 垂直总装测试厂房（总装线 + 回收检修线合一）
// 补的是 ops-spaceport-02 转运轨道那一头的空白：箭在这里竖立总装、测试，
// 由活动发射平台驮出大门沿轨道去工位；网捕回收下来的一子级放倒推进
// -X 低跨检修线拆检，换件后回到总装线——早期基地只养得起一栋大跨厂房，
// 两条线共用桥吊与门前轨道（真实发射场是分建的，这里是火星版精简）。
//
// 核心不做黑盒（MODELS.md 科学城原则）：大门常开、内部工作平台逐层错位前伸，
// 从 +Z 一眼读三条线——左（-X）卧着拆检的一子级+拆下的发动机/栅格舵/网捕挂钩，
// 中间立着在总装的芯级筒段，门口橙色活动发射平台正待发（橙色 = 工位发射台同色）。
//
// 契约：1u=1m；原点 = 主厂房基座中心地面；+Y 上；**大门朝 +Z**（落位时旋转对准工位）。
// 动画：桥吊小车沿主梁往复（oscillators）、屋顶障碍灯（blinkMats）。
// POI：poi_highbay / poi_refurb / poi_mlp / poi_crane / poi_control

export const meta = {
  id: 'ops-vab-01',
  name: '垂直总装测试厂房',
  name_en: 'Vertical Assembly & Refurbishment Building',
  size_m: 101,                // 实测最大边（高，含避雷针尖）——manifest 同值，禁止缩放
  size_axis: 'height',
  effects: ['glow_windows', 'blink'],
};

const DEG = Math.PI / 180;

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'ops-vab-01';

  // 确定性伪随机（资产必须可复现）
  let _seed = 20260718;
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
    wall:     std(0xe6e9ec, 0.82),      // 厂房白色压型钢板
    wallTop:  dusted(0xe6e9ec),
    band:     std(0x2b7cc9, 0.7, 0.15), // 蓝色腰带（与勤务塔同族涂装）
    rib:      std(0xc9ced3, 0.8),       // 墙面压条/柱
    steel:    std(0x8e979e, 0.8),       // 结构钢灰
    dark:     std(0x4a4e54, 0.75),
    orange:   std(0xd4671f, 0.75, 0.1), // 活动发射平台 / 护栏（= 工位发射台橙）
    safety:   std(0xc0662a, 0.8),
    conc:     std(0xb9a48c, 0.98),      // 烧结风化层硬化坪
    concTop:  dusted(0xb9a48c),
    rail:     std(0x6e7378, 0.55, 0.4),
    rocket:   std(0xf2f0ea, 0.6, 0.15), // 箭体白（与 veh-rocket-02 同色）
    engine:   std(0xb0b6bc, 0.5, 0.35), // 发动机金属
    nozzle:   std(0x8a6a4a, 0.55, 0.3), // 喷管内壁烧蚀铜
    grid:     std(0x9aa0a6, 0.6, 0.3),  // 栅格舵
    tread:    std(0x5a4536, 0.98),      // 车辙
  };

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xd8f0ff, emissive: 0xcfe8ff, emissiveIntensity: 1.0, roughness: 0.3 });
  const bayLampMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e0, emissive: 0xffedc4, emissiveIntensity: 1.0, roughness: 0.4 });
  const blinkMat = new THREE.MeshStandardMaterial({
    color: 0xff4030, emissive: 0xff2515, emissiveIntensity: 2.0, roughness: 0.4 });
  g.userData.nightMats = [windowMat, bayLampMat];
  g.userData.blinkMats = [blinkMat];

  // ---------------------------------------------------------------- 助手
  const box = (w, h, d, mat, x, y0, z, ry = 0, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y0 + h / 2, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  };
  const boxT = (w, h, d, side, top, x, y0, z, parent = g) => {   // 顶面带尘膜
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      [side, side, top, side, side, side]);
    m.position.set(x, y0 + h / 2, z);
    parent.add(m);
    return m;
  };
  const cyl = (r, h, mat, x, yc, z, seg = 12, parent = g) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, yc, z);
    parent.add(m);
    return m;
  };
  // 两点方梁（质感六招 #1：桁架/斜撑的积木）
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent = g) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    parent.add(m);
    return m;
  };
  // 安全橙护栏（质感六招 #4）
  const railing = (x0, z0, x1, z1, y, parent = g) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2.4));
    beam(x0, y + 1.05, z0, x1, y + 1.05, z1, 0.09, M.safety, parent);
    for (let i = 0; i <= n; i++)
      box(0.09, 1.05, 0.09, M.safety, x0 + (x1 - x0) * i / n, y, z0 + (z1 - z0) * i / n, 0, parent);
  };
  // 密封检修门（质感六招 #3：框+扇+闩+双铰链）
  const hatch = (x, y0, zFace, s = 1) => {
    box(1.06 * s, 2.02 * s, 0.07, M.safety, x, y0, zFace + 0.04);
    box(0.90 * s, 1.86 * s, 0.09, M.wall, x, y0 + 0.08 * s, zFace);
    box(0.10, 0.26, 0.08, M.dark, x + 0.32 * s, y0 + 0.9 * s, zFace - 0.06);
    box(0.14, 0.10, 0.06, M.dark, x - 0.37 * s, y0 + 1.55 * s, zFace - 0.04);
    box(0.14, 0.10, 0.06, M.dark, x - 0.37 * s, y0 + 0.3 * s, zFace - 0.04);
  };
  const anchor = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); g.add(a);
  };

  // ================================================================
  // 0. 场地：硬化坪 + 车辙 + 散落砾石（质感六招 #6 作业痕迹）
  // ================================================================
  boxT(96, 0.35, 78, M.conc, M.concTop, -8, -0.2, 12);
  for (const tx of [-3.2, 3.2])                                  // 门前双条车辙
    box(0.55, 0.03, 34, M.tread, tx, 0.15, 38);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);          // 顶点半径 φ≈1.618（坑账 1）
  for (let i = 0; i < 26; i++) {
    const rx = -52 + rnd() * 88, rz = -14 + rnd() * 70;
    if (Math.abs(rx + 8) < 46 && rz < 18 && rz > -16) continue;  // 不撒进厂房占地
    const s = 0.16 + rnd() * 0.2, sy = s * (0.55 + rnd() * 0.45);
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.conc : M.rib);
    rock.position.set(rx, 0.15 - 0.3 * sy + 1.618 * sy, rz);
    rock.scale.set(s, sy, s);
    rock.rotation.y = rnd() * 6.28;                              // 只绕 Y（坑账 1）
    g.add(rock);
  }

  // ================================================================
  // 1. 主厂房（总装高间）42×34×86，大门朝 +Z 常开
  //    开放壳体：背墙 + 两侧墙 + 顶盖 + 门洞两侧墙垛（quality.md §6）
  // ================================================================
  const HW = 21, HD = 17, HH = 86;          // 半宽 / 半深 / 高
  const DW = 11, DH = 74;                   // 门洞半宽 / 门洞高
  box(HW * 2, HH, 0.7, M.wall, 0, 0, -HD);                       // 背墙
  box(0.7, HH, HD * 2, M.wall, -HW, 0, 0);                       // 侧墙 -X
  box(0.7, HH, HD * 2, M.wall, HW, 0, 0);                        // 侧墙 +X
  boxT(HW * 2 + 1.4, 1.2, HD * 2 + 1.4, M.wall, M.wallTop, 0, HH, 0);  // 顶盖（带压条外挑）
  // +Z 立面：门洞两侧墙垛 + 门楣
  box((HW - DW), HH, 0.7, M.wall, -(DW + HW) / 2, 0, HD);
  box((HW - DW), HH, 0.7, M.wall, (DW + HW) / 2, 0, HD);
  box(DW * 2, HH - DH, 0.7, M.wall, 0, DH, HD);
  // 立面竖向压条（工业细节语法）
  for (let i = -4; i <= 4; i++) {
    if (Math.abs(i * 4.5) < DW + 1) continue;
    box(0.5, HH, 0.25, M.rib, i * 4.5, 0, HD + 0.42);
  }
  for (let i = -4; i <= 4; i++) box(0.5, HH, 0.25, M.rib, i * 4.5, 0, -HD - 0.42);
  // 蓝色腰带 + 底部裙边 + 顶部压条（收边）
  box(HW * 2 + 0.9, 2.2, HD * 2 + 0.9, M.band, 0, 60, 0);
  box(HW * 2 + 1.1, 1.0, HD * 2 + 1.1, M.rib, 0, 0, 0);
  // 门楣上的厂房名牌（蓝底白条示意）
  box(14, 2.4, 0.3, M.band, 0, DH + 3.5, HD + 0.5);
  box(11, 0.5, 0.35, M.wall, 0, DH + 4.4, HD + 0.6);
  // 大门：4 扇推拉门扇已推到两侧（常开态），门槽轨
  for (let k = 0; k < 4; k++) {
    const side = k < 2 ? -1 : 1, off = (k % 2) * 0.55;
    box(5.4, DH - 1, 0.5, M.rib, side * (DW + 2.9 + off * 0.2), 0.4, HD + 0.55 + off);
    box(5.4, 0.4, 0.55, M.safety, side * (DW + 2.9 + off * 0.2), DH - 0.6, HD + 0.55 + off);
  }
  box(DW * 2 + 12, 0.35, 1.2, M.rail, 0, 0.15, HD + 1.4);        // 门槽轨

  // ---- 内部：工作平台层（朝 +Z 逐层错位前伸，门洞外也能看见前缘）----
  const PLAT_Y = [12, 24, 36, 48, 60, 70];
  PLAT_Y.forEach((y, i) => {
    const front = -4 + i * 2.6;                                  // 逐层错位（quality.md §6）
    for (const sx of [-1, 1]) {
      box(12, 0.45, 20, M.steel, sx * 13.5, y, front - 4);
      railing(sx * 7.5, front + 6, sx * 7.5, front - 14, y + 0.45);
    }
    beam(-19, y + 0.2, front - 12, 19, y + 0.2, front - 12, 0.45, M.steel);
  });
  // 内部照明灯带（夜光）
  for (const y of [30, 56, 78]) for (const sx of [-1, 1])
    box(0.7, 0.3, 16, bayLampMat, sx * 17, y, -2);
  // 柱网与屋架（桁架，质感六招 #1）
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(1.5, HH, 1.5, M.steel, sx * (HW - 1.2), 0, sz * (HD - 1.2));
    for (let k = 0; k < 6; k++) {
      const y0 = 0.6 + k * 14, y1 = y0 + 14;                     // 首道斜撑抬离地面
      beam(sx * (HW - 1.2), y0, sz * (HD - 1.2), sx * (HW - 1.2), y1, -sz * (HD - 1.2), 0.4, M.steel);
    }
  }
  for (let i = -2; i <= 2; i++)                                  // 屋架横梁
    beam(-HW + 1.2, HH - 1.5, i * 6.5, HW - 1.2, HH - 1.5, i * 6.5, 0.6, M.steel);

  // ---- 总装线：立着的芯级筒段（Ø5 × 32）+ 抱箭工装 ----
  cyl(2.5, 32, M.rocket, 0, 16.5, -4, 20);
  cyl(2.55, 0.5, M.band, 0, 30.5, -4, 20);                       // 级间环标
  cyl(2.55, 0.5, M.band, 0, 8.5, -4, 20);
  for (const y of [14, 26])                                      // 抱箭工装环（两半）
    for (const sx of [-1, 1]) {
      box(0.6, 1.2, 7, M.safety, sx * 3.4, y, -4);
      beam(sx * 3.4, y + 0.6, -4, sx * 8, y + 0.6, -4, 0.4, M.steel);
    }
  cyl(2.2, 1.6, M.dark, 0, 0.8, -4, 20);                         // 总装底座支墩

  // ---- 桥式起重机（动力核心可见）：主梁 + 小车 + 吊钩，小车往复 ----
  const crane = new THREE.Group();
  crane.name = 'crane_trolley';
  crane.position.set(0, 79, -4);
  g.add(crane);
  box(4.2, 2.0, 5.0, M.orange, 0, -1.0, 0, 0, crane);            // 小车
  box(1.0, 0.6, 1.0, M.dark, 0, -1.6, 0, 0, crane);              // 卷筒壳
  cyl(0.09, 7, M.dark, 0, -5.2, 0, 6, crane);                    // 吊索
  box(1.1, 0.9, 0.5, M.safety, 0, -9.4, 0, 0, crane);            // 吊钩组
  for (const sz of [-1, 1]) {                                    // 主梁（双梁）
    beam(-HW + 1.5, 79.5, -4 + sz * 3.2, HW - 1.5, 79.5, -4 + sz * 3.2, 1.1, M.orange);
    box(HW * 2 - 3, 0.5, 0.35, M.rail, 0, 80.6, -4 + sz * 3.2);  // 大车轨
  }

  // ================================================================
  // 2. 低跨检修线（-X 侧）30×26×22：网捕回收的一子级在这里拆检
  //    大门朝 +Z 常开，内部卧放筒段 + 拆下的发动机/栅格舵/挂钩
  // ================================================================
  const RX = -36, RW = 15, RD = 13, RH = 22;                     // 中心 x / 半宽 / 半深 / 高
  box(RW * 2, RH, 0.6, M.wall, RX, 0, -RD);                      // 背墙
  box(0.6, RH, RD * 2, M.wall, RX - RW, 0, 0);                   // 外侧墙
  boxT(RW * 2 + 1.2, 1.0, RD * 2 + 1.2, M.wall, M.wallTop, RX, RH, 0);
  box(6, RH, 0.6, M.wall, RX - RW + 3, 0, RD);                   // +Z 立面：门洞两侧
  box(6, RH, 0.6, M.wall, RX + RW - 3, 0, RD);
  box(RW * 2 - 12, RH - 14, 0.6, M.wall, RX, 14, RD);            // 门楣（门洞 18×14）
  box(RW * 2 + 0.8, 1.6, RD * 2 + 0.8, M.band, RX, 16.5, 0);     // 腰带
  box(RW * 2 + 1.0, 0.9, RD * 2 + 1.0, M.rib, RX, 0, 0);         // 裙边
  hatch(RX - RW + 3, 0.15, RD + 0.35);                           // 检修线人员门（门洞左墙垛）
  for (let i = -2; i <= 2; i++) box(0.45, RH, 0.22, M.rib, RX + i * 5.5, 0, -RD - 0.35);
  // 内部照明 + 屋架
  box(0.6, 0.25, 18, bayLampMat, RX - 9, 20.2, 0);
  box(0.6, 0.25, 18, bayLampMat, RX + 9, 20.2, 0);
  for (let i = -2; i <= 2; i++)
    beam(RX - RW + 1, RH - 1.2, i * 5.5, RX + RW - 1, RH - 1.2, i * 5.5, 0.45, M.steel);

  // ---- 卧放的一子级筒段（Ø5 × 22）+ 鞍座 ×2，尾段朝 +Z 露发动机安装法兰 ----
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 22, 20), M.rocket);
  stage.position.set(RX - 1, 4.6, 1);
  stage.rotation.x = Math.PI / 2;
  g.add(stage);
  cyl(2.55, 0.4, M.band, RX - 1, 4.6, 1, 20).rotation.x = Math.PI / 2;   // 环标（横放）
  for (const sz of [-1, 1]) {                                     // 鞍座
    box(5.6, 2.2, 1.6, M.steel, RX - 1, 0, 1 + sz * 7);
    box(6.2, 0.5, 2.0, M.safety, RX - 1, 2.2, 1 + sz * 7);
  }
  box(5.2, 5.2, 0.25, M.dark, RX - 1, 2.0, 11.9);                 // 尾段发动机安装法兰盘（竖直朝门）
  for (let k = 0; k < 6; k++) {                                   // 法兰上的 6 个安装座
    const a = k * 60 * DEG;
    box(0.7, 0.5, 0.5, M.engine, RX - 1 + 1.7 * Math.cos(a), 4.4 + 1.7 * Math.sin(a), 12.0);
  }
  // ---- 拆下来的东西（"这里在拆检"的证据链）----
  for (let k = 0; k < 2; k++) {                                   // 发动机 ×2 上架
    const ex = RX + 8, ez = -6 + k * 7;
    box(3.0, 0.5, 2.6, M.steel, ex, 1.2, ez);                     // 架子
    for (const sx of [-1, 1]) box(0.3, 1.2, 0.3, M.steel, ex + sx * 1.2, 0, ez);
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.05, 2.4, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.55, metalness: 0.3, side: THREE.DoubleSide }));
    noz.position.set(ex, 2.9, ez);                                // 开口容器 → DoubleSide（坑账 5）
    g.add(noz);
    cyl(0.62, 1.3, M.engine, ex, 4.6, ez, 12);                    // 涡轮泵/燃烧室
    box(0.9, 0.5, 0.9, M.engine, ex, 5.2, ez);
  }
  // 栅格舵立在检查架上（长十乙特征件）
  const fin = new THREE.Group();
  fin.position.set(RX - 11, 0, -7);
  g.add(fin);
  box(0.5, 3.2, 0.5, M.steel, 0, 0, 0, 0, fin);                   // 检查架柱
  box(2.6, 0.3, 1.2, M.steel, 0, 3.2, 0, 0, fin);
  box(3.2, 0.35, 0.3, M.grid, 0, 3.5, 0, 0, fin);                 // 舵面外框
  box(3.2, 0.35, 0.3, M.grid, 0, 6.3, 0, 0, fin);
  for (const sx of [-1, 1]) box(0.3, 3.15, 0.3, M.grid, sx * 1.45, 3.5, 0, 0, fin);
  for (let i = -1; i <= 1; i++) box(0.16, 2.8, 0.22, M.grid, i * 0.85, 3.6, 0, 0, fin);  // 格栅
  for (let i = 0; i < 3; i++) box(2.9, 0.16, 0.22, M.grid, 0, 4.2 + i * 0.85, 0, 0, fin);
  // 网捕挂钩 ×2 在检查台上（与 ops-spaceport-02 网架直接呼应）
  box(3.4, 0.9, 1.8, M.steel, RX + 10, 0, 7);
  for (const sx of [-1, 1]) {
    const hk = new THREE.Group();
    hk.position.set(RX + 10 + sx * 0.9, 0.9, 7);
    g.add(hk);
    box(0.34, 1.5, 0.34, M.safety, 0, 0, 0, 0, hk);
    beam(0, 1.45, 0, 0, 1.95, sx * 0.75, 0.32, M.safety, hk);     // 钩尖
  }
  railing(RX - RW + 1.5, RD - 1.5, RX + RW - 1.5, RD - 1.5, 0);   // 门内安全线护栏

  // ================================================================
  // 3. 测试控制附楼（+X 侧）14×20×11，发光窗带
  // ================================================================
  const CX = 28;
  boxT(14, 11, 20, M.wall, M.wallTop, CX, 0, -2);
  box(14.6, 0.8, 20.6, M.rib, CX, 11, -2);                        // 顶盖压条
  box(14.4, 0.9, 20.4, M.rib, CX, 0, -2);                         // 裙边
  box(0.3, 1.3, 14, windowMat, CX + 7.1, 4.2, -2);                // 朝东窗带
  box(11, 1.3, 0.3, windowMat, CX, 4.2, 8.1);                     // 朝门口窗带（看转运）
  box(11, 1.3, 0.3, windowMat, CX, 7.6, 8.1);
  hatch(CX - 3, 0.15, 8.15);
  box(1.6, 0.5, 1.6, M.dark, CX + 4, 11.8, -8);                   // 屋顶设备
  cyl(0.2, 4, M.rib, CX + 4, 13.8, -8, 8);                        // 天线杆
  // 外墙管线（工业细节语法）
  for (const dx of [-1.6, -1.2]) cyl(0.05, 9, M.rib, CX + dx, 4.5, 10.05, 6);
  box(0.2, 0.5, 0.4, M.dark, CX - 1.4, 9.2, 10.1);

  // ================================================================
  // 4. 门前转运轨道 + 活动发射平台（转运环节的答案）
  // ================================================================
  boxT(26, 0.4, 40, M.conc, M.concTop, 0, -0.05, 38);             // 轨道路基
  for (const sx of [-1, 1]) {
    box(0.4, 0.45, 40, M.rail, sx * 3.2, 0.35, 38);               // 双轨（轨距 6.4）
    box(0.4, 0.45, 40, M.rail, sx * 9.6, 0.35, 38);               // 外侧承重轨（重型四轨制）
  }
  for (let i = 0; i < 13; i++) box(21, 0.2, 0.6, M.dark, 0, 0.35, 20 + i * 3.1);  // 轨枕
  // 活动发射平台（橙色 = 工位发射台同色，"驮着箭出去"的因果链）
  const MLP = 34;
  boxT(17, 2.6, 15, M.orange, dusted(0xd4671f, 0.85), 0, 2.2, MLP);
  box(6.4, 0.5, 6.4, M.dark, 0, 4.8, MLP);                        // 台面导流口盖
  for (const sx of [-1, 1]) for (const sz of [-1, 1])             // 四组牵制点（与工位托架对应）
    box(1.1, 1.5, 1.1, M.safety, sx * 3.4, 4.8, MLP + sz * 3.4);
  railing(-8.5, MLP + 7.5, 8.5, MLP + 7.5, 4.8);
  railing(-8.5, MLP - 7.5, 8.5, MLP - 7.5, 4.8);
  for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) {         // 台车轮组（4 轴 × 2 侧 × 双轮）
    const bz = MLP - 5.4 + k * 3.6;
    box(2.4, 1.4, 2.6, M.dark, sx * 6.4, 0.35, bz);
    for (const o of [-0.8, 0.8]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.7, 12), M.rail);
      wh.position.set(sx * (6.4 + o * 0.9), 0.85, bz);
      wh.rotation.z = Math.PI / 2;
      g.add(wh);
    }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1])             // 液压支腿（停放态放下）
    box(0.8, 2.2, 0.8, M.steel, sx * 7.8, 0, MLP + sz * 6.2);
  box(2.2, 3.2, 1.6, M.dark, 0, 4.8, MLP - 6.6);                  // 平台配电/液压柜
  box(1.6, 0.4, 0.25, windowMat, 0, 6.6, MLP - 5.75);

  // ================================================================
  // 5. 屋顶设备层 + 排风罩 + 避雷针与障碍灯
  // ================================================================
  boxT(16, 3.2, 12, M.wall, M.wallTop, -6, HH + 1.2, -6);
  box(6, 2.0, 5, M.rib, 8, HH + 1.2, -8);
  for (const sx of [-1, 1]) cyl(1.1, 2.6, M.rib, 8 + sx * 2, HH + 4.5, -8, 10);   // 排风罩
  cyl(0.28, 9, M.steel, -6, HH + 8.9, -6, 8);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.8, 8), M.steel);
  tip.position.set(-6, HH + 14.3, -6);
  g.add(tip);
  const blink1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), blinkMat);
  blink1.position.set(-6, HH + 13.0, -6);
  g.add(blink1);
  const blink2 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), blinkMat);
  blink2.position.set(18, HH + 1.9, 14);
  g.add(blink2);
  // 屋顶泛光灯（照大门前场）
  for (const sx of [-1, 1]) {
    const hd = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.8), bayLampMat);
    hd.position.set(sx * 15, HH - 1.5, HD + 0.9);
    hd.lookAt(sx * 8, 0, MLP);
    g.add(hd);
  }

  // ---------------------------------------------------------------- POI
  anchor('poi_highbay', 0, 44, -4);
  anchor('poi_refurb', RX, 9, 1);
  anchor('poi_mlp', 0, 6, MLP);
  anchor('poi_crane', 0, 76, -4);
  anchor('poi_control', CX, 8, 4);

  // ---------------------------------------------------------------- 引擎接口
  g.userData.lights = [
    { color: 0xfff2d8, pos: [0, 40, 6], range: 60 },      // 高间内
    { color: 0xffe8c0, pos: [RX, 14, 4], range: 34 },     // 检修线
    { color: 0xdfe8ff, pos: [0, 10, MLP], range: 40 },    // 门前转运区
  ];
  g.userData.beams = [];
  // 桥吊小车沿主梁往复（声明式优先；base = 注册时 position.x = 0，坑账 21）
  g.userData.oscillators = [
    { node: 'crane_trolley', prop: 'position', axis: 'x', amp: 13, period: 34 },
  ];

  // ---------------------------------------------------------------- 尘膜 pass
  const dust = new THREE.Color(0x9e5b3d);
  [M.wall, M.wallTop, M.rib, M.band, M.steel, M.orange, M.safety, M.rocket,
   M.engine, M.grid, M.rail, M.dark].forEach(m => m.color.lerp(dust, 0.05));

  return g;
}
