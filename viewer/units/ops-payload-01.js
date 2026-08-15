// ops-payload-01 —— 载荷处理厂房（洁净总装 · 加注 · 合罩 · 转运）
// 补的是 ops-depot-01（集装箱物流）与 ops-vab-01（箭体总装）之间的空白：
// 货到城里之后、装上箭之前，载荷要在这里开箱、测试、加注、装进整流罩、
// 封进转运容器。全城此前"整流罩"三个字只出现在火箭自己的知识卡里，
// 地面上没有任何对应设施。
//
// 核心不做黑盒：洁净高间朝 +Z 整面剖开——里面是三轴支架上的卫星（太阳翼
// 收拢=发射状态）、立在支架上的**整流罩两半**（开口朝内、DoubleSide 露内壁
// 与消声衬层）、顶部小桥吊；屋顶 FFU 风机组与粗风管外露（洁净室的动力核心）；
// 门口转运车位上停着一只端门敞开的空载荷容器——装好的那只已被
// veh-ground-01 的平板车拉走（蓝环同色因果链）。
//
// 契约：1u=1m；原点 = 主洁净间基座中心地面；+Y 上；出货口/剖开面朝 +Z。
// 动画：桥吊小车往复 + 加注间风向标（oscillators）、屋顶航障灯（blinkMats）。
// POI：poi_cleanroom / poi_fairing / poi_fuel / poi_ffu / poi_dock

export const meta = {
  id: 'ops-payload-01',
  name: '载荷处理厂房',
  name_en: 'Payload Processing Facility',
  size_m: 62,                 // 实测最大边（含装卸台与场区灯杆）——manifest 同值
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

const DEG = Math.PI / 180;

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'ops-payload-01';

  let _seed = 20260720;
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
    wall:    std(0xeceef0, 0.8),        // 洁净厂房白
    wallTop: dusted(0xeceef0),
    blue:    std(0x2b7cc9, 0.7, 0.15),  // 蓝环/腰带 = 载荷容器同色链
    rib:     std(0xc9ced3, 0.8),
    steel:   std(0x8e979e, 0.8),
    dark:    std(0x4a4e54, 0.75),
    safety:  std(0xc0662a, 0.8),
    conc:    std(0xb9a48c, 0.98),
    concTop: dusted(0xb9a48c),
    berm:    std(0xa08a6e, 1.0),        // 加注间防爆土堤
    fairing: std(0xf4f2ee, 0.6, 0.1),   // 整流罩外壳
    liner:   std(0x6f7378, 0.95),       // 罩内消声衬层
    sat:     std(0xd8dce0, 0.55, 0.3),  // 卫星本体
    gold:    std(0xc9a24a, 0.45, 0.55), // 多层隔热（MLI）金
    panel:   std(0x2a3550, 0.45, 0.35), // 太阳翼（收拢）
    duct:    std(0xb4bac0, 0.6, 0.25),  // 洁净风管
    tread:   std(0x5a4536, 0.98),
  };
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xd8f0ff, emissive: 0xcfe8ff, emissiveIntensity: 1.0, roughness: 0.3 });
  const cleanLamp = new THREE.MeshStandardMaterial({
    color: 0xf2fbff, emissive: 0xe8f6ff, emissiveIntensity: 1.0, roughness: 0.35 });
  const litGreen = new THREE.MeshStandardMaterial({
    color: 0x54ff7a, emissive: 0x3fe864, emissiveIntensity: 1.0, roughness: 0.4 });
  const blinkMat = new THREE.MeshStandardMaterial({
    color: 0xff4030, emissive: 0xff2515, emissiveIntensity: 2.0, roughness: 0.4 });
  g.userData.nightMats = [windowMat, cleanLamp, litGreen];
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
  const cyl = (r, h, mat, x, yc, z, seg = 12, parent = g) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, yc, z);
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
  const railing = (x0, z0, x1, z1, y, parent = g) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2.4));
    beam(x0, y + 1.05, z0, x1, y + 1.05, z1, 0.09, M.safety, parent);
    for (let i = 0; i <= n; i++)
      box(0.09, 1.05, 0.09, M.safety, x0 + (x1 - x0) * i / n, y, z0 + (z1 - z0) * i / n, 0, parent);
  };
  const hatch = (x, y0, zFace) => {
    box(1.06, 2.02, 0.07, M.safety, x, y0, zFace + 0.04);
    box(0.90, 1.86, 0.09, M.wall, x, y0 + 0.08, zFace);
    box(0.10, 0.26, 0.08, M.dark, x + 0.32, y0 + 0.9, zFace - 0.06);
    box(0.14, 0.10, 0.06, M.dark, x - 0.37, y0 + 1.55, zFace - 0.04);
    box(0.14, 0.10, 0.06, M.dark, x - 0.37, y0 + 0.3, zFace - 0.04);
  };
  const anchor = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); g.add(a);
  };

  // ================================================================
  // 0. 场地：硬化坪 + 转运车位标线 + 车辙 + 砾石
  // ================================================================
  boxT(58, 0.35, 52, M.conc, M.concTop, -2, -0.2, 8);
  for (const s of [-1, 1]) box(0.2, 0.04, 20, M.rib, 2 + s * 3.4, 0.15, 24);   // 车位标线
  for (const tx of [-1.0, 5.0]) box(0.5, 0.03, 22, M.tread, tx, 0.15, 26);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 18; i++) {
    const rx = -34 + rnd() * 64, rz = -22 + rnd() * 62;
    if (rx > -31 && rx < 27 && rz > -18 && rz < 34) continue;
    const s = 0.14 + rnd() * 0.2, sy = s * (0.55 + rnd() * 0.45);
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.conc : M.rib);
    rock.position.set(rx, -0.05 - 0.3 * sy + 1.618 * sy, rz);
    rock.scale.set(s, sy, s);
    rock.rotation.y = rnd() * 6.28;
    g.add(rock);
  }

  // ================================================================
  // 1. 洁净总装测试高间 26×22×22，朝 +Z 整面剖开（三面墙+顶盖+边柱）
  // ================================================================
  const HW = 13, HD = 11, HH = 22;
  box(HW * 2, HH, 0.6, M.wall, 0, 0, -HD);                        // 背墙
  box(0.6, HH, HD * 2, M.wall, -HW, 0, 0);                        // 侧墙 ×2
  box(0.6, HH, HD * 2, M.wall, HW, 0, 0);
  boxT(HW * 2 + 1.2, 0.9, HD * 2 + 1.2, M.wall, M.wallTop, 0, HH, 0);   // 顶盖
  for (const sx of [-1, 1]) box(0.8, HH, 0.8, M.wall, sx * HW, 0, HD);  // 开口面边柱
  box(HW * 2 + 1.0, 2.6, 0.8, M.wall, 0, HH - 2.6, HD);           // 开口面门楣
  box(HW * 2 + 1.3, 1.5, HD * 2 + 1.3, M.blue, 0, 16.5, 0);       // 蓝色腰带
  box(HW * 2 + 1.4, 0.9, HD * 2 + 1.4, M.rib, 0, 0, 0);           // 裙边
  for (let i = -2; i <= 2; i++) box(0.45, HH, 0.22, M.rib, i * 5, 0, -HD - 0.35);  // 背墙压条
  // 洁净室灯棚（顶部满铺 FFU 出风面，夜光）
  for (let i = -2; i <= 2; i++)
    box(4.2, 0.25, 18, cleanLamp, i * 5, HH - 0.45, 0);
  // 内部地坪（洁净环氧，浅色）+ 安全线
  box(HW * 2 - 1.2, 0.2, HD * 2 - 1.2, M.rib, 0, 0.15, 0);
  box(HW * 2 - 1.2, 0.03, 0.3, M.safety, 0, 0.35, HD - 1.4);

  // ---- 卫星：三轴支架上，太阳翼收拢（发射状态）----
  const sat = new THREE.Group();
  sat.position.set(-6.5, 0, -1);
  g.add(sat);
  box(3.2, 1.2, 3.2, M.steel, 0, 0.35, 0, 0, sat);                // 三轴支架底座
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    beam(sx * 1.3, 1.55, sz * 1.3, sx * 0.7, 3.1, sz * 0.7, 0.22, M.steel, sat);
  box(2.6, 2.8, 2.4, M.sat, 0, 3.1, 0, 0, sat);                   // 星体
  box(2.68, 0.9, 2.48, M.gold, 0, 4.2, 0, 0, sat);                // MLI 金箔带
  for (const sx of [-1, 1])                                        // 收拢的太阳翼（贴壁）
    box(0.28, 2.4, 2.0, M.panel, sx * 1.44, 3.3, 0, 0, sat);
  cyl(0.75, 0.16, M.rib, 0, 6.05, 0, 14, sat);                    // 通信碟（收拢朝天）
  cyl(0.1, 0.5, M.dark, 0, 5.75, 0, 6, sat);
  box(0.5, 0.5, 0.5, M.dark, 0, 5.9, 0.9, 0, sat);                // 推进模块示意
  // 环绕检修平台（工作面）
  box(7.4, 0.25, 1.2, M.steel, -6.5, 4.6, 2.6);
  railing(-10, 3.2, -3, 3.2, 4.85);
  for (const sx of [-1, 1]) box(0.3, 4.6, 0.3, M.steel, -6.5 + sx * 3.4, 0, 3.0);

  // ---- 整流罩两半：立在支架上，开口朝内（DoubleSide 露内壁与消声衬层）----
  const fairMat = new THREE.MeshStandardMaterial({
    color: 0xf4f2ee, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide });
  const linerMat = new THREE.MeshStandardMaterial({
    color: 0x6f7378, roughness: 0.95, side: THREE.DoubleSide, emissive: 0x22262a, emissiveIntensity: 0.2 });
  // 局部系：开口一律朝 +Z（thetaStart=π/2 的半壳向 -Z 鼓出），再整体绕 Y 外张
  const fairHalf = (px, pz, yaw) => {
    const h = new THREE.Group();
    h.position.set(px, 0, pz);
    h.rotation.y = yaw;
    g.add(h);
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.6, 7.5, 18, 1, true, Math.PI / 2, Math.PI), fairMat);
    barrel.position.set(0, 4.6, 0);
    h.add(barrel);
    const lin = new THREE.Mesh(                                   // 内壁消声衬层
      new THREE.CylinderGeometry(2.42, 2.42, 7.2, 18, 1, true, Math.PI / 2, Math.PI), linerMat);
    lin.position.set(0, 4.6, 0);
    h.add(lin);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2.6, 5.0, 18, 1, true, Math.PI / 2, Math.PI), fairMat);
    cone.position.set(0, 10.85, 0);
    h.add(cone);
    // 分离面纵梁（沿开口两侧竖边）+ 底环 + 支架
    for (const sx of [-1, 1]) box(0.3, 12.4, 0.34, M.rib, sx * 2.5, 0.85, 0.02, 0, h);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.13, 6, 18, Math.PI), M.rib);
    ring.position.set(0, 0.9, 0);
    ring.rotation.x = -Math.PI / 2;
    h.add(ring);
    box(6.0, 0.9, 1.4, M.steel, 0, 0, -0.6, 0, h);                // 支架
    for (const sx of [-1, 1]) box(0.5, 0.9, 0.5, M.steel, sx * 2.2, 0, -2.0, 0, h);
    return h;
  };
  fairHalf(4.8, -3.6, 26 * DEG);   // 左半罩，开口朝观察侧外张
  fairHalf(11.6, -3.6, -26 * DEG); // 右半罩
  box(1.2, 0.9, 1.2, M.safety, 8.7, 0, -6.4);                     // 合罩对中工装
  box(0.35, 6, 0.35, M.steel, 8.7, 0.9, -6.4);

  // ---- 顶部小桥吊（动力核心可见）----
  const trolley = new THREE.Group();
  trolley.name = 'pl_trolley';
  trolley.position.set(0, 19.4, -2);
  g.add(trolley);
  box(2.4, 1.2, 2.6, M.safety, 0, -0.6, 0, 0, trolley);
  cyl(0.07, 4.5, M.dark, 0, -3.2, 0, 6, trolley);
  box(0.7, 0.6, 0.35, M.safety, 0, -5.7, 0, 0, trolley);
  for (const sz of [-1, 1]) {
    beam(-HW + 1, 20.0, -2 + sz * 1.8, HW - 1, 20.0, -2 + sz * 1.8, 0.7, M.safety);
    box(HW * 2 - 2, 0.3, 0.25, M.rib, 0, 20.5, -2 + sz * 1.8);
  }

  // ================================================================
  // 2. 气闸 / 更衣风淋通道（+Z 面右侧，人员进出洁净区的唯一路径）
  // ================================================================
  const AL = 9;
  boxT(8, 5.0, 7, M.wall, M.wallTop, AL, 0, HD + 3.5);
  box(8.4, 0.5, 7.4, M.rib, AL, 5.0, HD + 3.5);
  box(5.4, 0.9, 0.25, windowMat, AL, 2.6, HD + 7.1);              // 通道窗带
  hatch(AL, 0.15, HD + 7.05);
  box(0.6, 0.55, 0.16, litGreen, AL + 2.2, 3.3, HD + 7.08);       // 压差合格指示（绿）
  box(1.4, 0.5, 1.4, M.duct, AL, 5.5, HD + 1.5);                  // 风淋机组
  cyl(0.45, 2.2, M.duct, AL, 6.6, HD + 1.5, 10);

  // ================================================================
  // 3. 加注间（-X 侧独立小间 + 三面防爆土堤）
  // ================================================================
  const FX = -22;
  box(12, 9, 0.6, M.wall, FX, 0, -7);
  box(0.6, 9, 14, M.wall, FX - 6, 0, 0);
  box(12, 9, 0.6, M.wall, FX, 0, 7);
  boxT(12.8, 0.8, 14.8, M.wall, M.wallTop, FX, 9, 0);
  box(0.8, 9, 0.8, M.wall, FX + 6, 0, 6.6);                       // 朝主间的连接墙垛
  box(12.4, 1.2, 14.4, M.blue, FX, 7.2, 0);
  hatch(FX, 0.15, 7.35);
  box(3.0, 0.8, 0.25, windowMat, FX - 3, 5.4, 7.32);
  // 防爆土堤（U 形，向 +Z 出口敞开）
  box(22, 2.6, 3.5, M.berm, FX - 1, 0, -11);
  box(3.5, 2.6, 20, M.berm, FX - 9.5, 0, -2);
  // 推进剂/气瓶组（氙气与绿色单组元，两组分色）+ 集管
  for (let i = 0; i < 4; i++)
    cyl(0.42, 2.6, i < 2 ? M.blue : M.safety, FX - 4 + i * 1.4, 1.5, 9.6, 10);
  box(6.4, 0.35, 0.35, M.rib, FX - 1.9, 3.0, 9.6);
  box(1.2, 1.6, 1.0, M.dark, FX + 3.4, 0.15, 9.6);                // 加注控制柜
  box(0.8, 0.35, 0.12, windowMat, FX + 3.4, 1.2, 10.11);
  // 风向标（加注区必备，oscillator 摆动）
  const vane = new THREE.Group();
  vane.name = 'wind_vane';
  vane.position.set(FX - 8.5, 7.4, 9);
  g.add(vane);
  box(0.18, 0.18, 2.2, M.safety, 0, 0, 0.9, 0, vane);
  box(0.06, 0.9, 1.1, M.safety, 0, 0, 2.1, 0, vane);
  box(0.3, 7.4, 0.3, M.rib, FX - 8.5, 0, 9);

  // ================================================================
  // 4. 控制/办公附楼（+X 侧）+ 屋顶 FFU 洁净机房与风管
  // ================================================================
  const CX = 21;
  boxT(12, 8, 16, M.wall, M.wallTop, CX, 0, -3);
  box(12.6, 0.7, 16.6, M.rib, CX, 8, -3);
  box(12.4, 0.9, 16.4, M.rib, CX, 0, -3);
  box(0.25, 1.2, 11, windowMat, CX + 6.1, 3.0, -3);               // 东立面窗带
  box(9, 1.2, 0.25, windowMat, CX, 3.0, 5.1);                     // 朝装卸口窗带（看转运）
  box(9, 1.2, 0.25, windowMat, CX, 5.6, 5.1);
  hatch(CX - 3.5, 0.15, 5.15);
  // 屋顶 FFU/HEPA 机房 + 粗风管下行接洁净间（洁净室的动力核心，外露）
  boxT(14, 3.4, 10, M.duct, dusted(0xb4bac0), -1, HH + 0.9, -4);
  for (const sx of [-1, 1]) cyl(1.0, 2.0, M.rib, -1 + sx * 4, HH + 5.4, -4, 10);  // 进风罩
  for (const dz of [-7.5, 0.5]) {                                  // 竖向风管（贴 -X 侧墙外）
    const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 20, 12), M.duct);
    duct.position.set(-HW - 1.3, 10.5, dz);
    g.add(duct);
    box(2.0, 1.0, 2.0, M.rib, -HW - 1.3, 20.2, dz);                // 弯头
    box(1.6, 0.8, 1.6, M.rib, -HW - 1.3, 1.0, dz);                 // 落地接口
  }
  box(0.6, 20, 0.6, M.rib, -HW - 2.9, 0.15, -3.5);                 // 风管支架柱
  // 屋顶航障灯 + 避雷针
  cyl(0.22, 5, M.rib, -1, HH + 6.8, -4, 8);
  const bl = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), blinkMat);
  bl.position.set(-1, HH + 9.6, -4);
  g.add(bl);

  // ================================================================
  // 5. 出货口：转运车位 + 端门敞开的空载荷容器（装好的已被平板车拉走）
  // ================================================================
  const DK = 20;
  boxT(16, 0.5, 12, M.conc, M.concTop, 2, 0.15, DK);              // 装卸台
  railing(-6, DK + 6, -6, DK - 6, 0.65);
  box(16.4, 0.4, 0.4, M.safety, 2, 0.65, DK - 6.1);               // 台缘防撞梁
  // 空容器（端门开启，露内部支架——开口容器手法）
  const cont = new THREE.Group();
  cont.position.set(2, 0.65, DK);
  g.add(cont);
  box(4.6, 0.5, 13.4, M.steel, 0, 0, 0, 0, cont);                 // 底架
  box(4.6, 4.2, 0.3, M.wall, 0, 0.5, -6.7, 0, cont);              // 后端板
  box(0.3, 4.2, 13.4, M.wall, -2.15, 0.5, 0, 0, cont);            // 两侧壁
  box(0.3, 4.2, 13.4, M.wall, 2.15, 0.5, 0, 0, cont);
  boxT(4.8, 0.3, 13.6, M.wall, dusted(0xeceef0), 0, 4.7, 0, cont);
  for (const sz of [-1, 0, 1])                                    // 三道整圈蓝色带（与平板车上那只同色）
    box(4.85, 4.55, 0.45, M.blue, 0, 0.45, sz * 5.6, 0, cont);
  // 端门敞开（铰在 +X 侧，向外转 100°）
  const door = new THREE.Group();
  door.position.set(2.15, 0.5, 6.7);
  door.rotation.y = -100 * DEG;
  cont.add(door);
  box(4.4, 4.2, 0.22, M.wall, -2.2, 0, 0, 0, door);
  box(0.5, 0.5, 0.26, M.blue, -2.2, 1.9, 0.13, 0, door);
  box(0.16, 0.9, 0.16, M.dark, -0.35, 1.6, 0.16, 0, door);        // 门闩
  // 内部支架 + 空置指示灯
  for (const sz of [-1, 1]) box(3.6, 0.7, 0.9, M.steel, 0, 0.5, sz * 3.4, 0, cont);
  box(0.35, 0.28, 0.35, litGreen, 1.6, 4.75, -5.4, 0, cont);
  // 场区灯杆
  for (const lx of [-9, 13]) {
    box(0.3, 7, 0.3, M.rib, lx, 0.15, DK + 8);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.7), windowMat);
    hd.position.set(lx, 7.2, DK + 8);
    hd.lookAt(2, 0, 4);
    g.add(hd);
  }

  // ---------------------------------------------------------------- POI
  anchor('poi_cleanroom', -6.5, 7, -1);
  anchor('poi_fairing', 8.7, 9, -2);
  anchor('poi_fuel', FX, 6, 2);
  anchor('poi_ffu', -1, HH + 4, -4);
  anchor('poi_dock', 2, 5, DK);

  // ---------------------------------------------------------------- 引擎接口
  g.userData.lights = [
    { color: 0xeaf6ff, pos: [0, 14, 2], range: 40 },      // 洁净高间
    { color: 0xffd9a0, pos: [FX, 5, 4], range: 24 },      // 加注间
    { color: 0xdfe8ff, pos: [2, 8, DK], range: 30 },      // 装卸口
  ];
  g.userData.beams = [];
  g.userData.oscillators = [
    { node: 'pl_trolley', prop: 'position', axis: 'x', amp: 8, period: 26 },
    { node: 'wind_vane', prop: 'rotation', axis: 'y', amp: 0.55, period: 9 },
  ];

  // ---------------------------------------------------------------- 尘膜 pass
  const dust = new THREE.Color(0x9e5b3d);
  [M.wall, M.wallTop, M.blue, M.rib, M.steel, M.dark, M.safety, M.duct,
   M.fairing, M.sat, M.gold, M.panel].forEach(m => m.color.lerp(dust, 0.05));
  fairMat.color.lerp(dust, 0.05);

  return g;
}
