// ops-spaceport-02 —— 长十乙发射工位（海南商发二号工位语汇 · 火星适配）
// 实照参照（2026-07-10 长十乙首飞新闻图）：蓝色密格桁架勤务塔（满面 X 撑）、
//   橙色发射台、白色细格避雷塔 ×4；回收为**网系**——"领航者"号构型：
//   四根内倾重型格构柱撑起顶部矩形环框，"井"字主缆 + 下垂网兜，
//   箭体无着陆腿、以 4 只轻型挂钩挂缆，网口收紧完成捕获（火星无海，
//   移植为地面网架阵位，见 info.json poi_net）。
// 组件：勤务塔 85 m（回转平台 5 组微开 15° + 摆杆 ×3 + 吊机房）·
//   发射台 25×25 + 单面斜坡导流槽 40 m 喇叭口（无水声抑制）·
//   转运轨道（+Z 正面）· 避雷塔 ×4（塔尖障碍灯 blinkMats）·
//   加注区（土堤 + LOX 球罐 ×2 + CH4 卧罐 ×2 + 阀站 + 桥架）·
//   网式回收阵位（46×36 台面 + 4 格构柱 + 环框 + 井字缆网 + 张紧绞车）·
//   测发楼 + 气象塔（风杯 spinner）+ 摄影塔位 ×2
// 动画：actions['发射准备'] 状态机（平台 15°→100° → 摆杆 0→78°，14 s），
//   '合拢复位' 反向；避雷塔/网架障碍灯 blinkMats；气象塔风杯 spinners。
// POI：poi_tower / poi_trench / poi_lightning / poi_tank / poi_net
// 契约：1u=1m；原点=发射台圆心地面；+Y 上；正面 +Z；导流槽 -X；≤5 万面。

export const meta = {
  id: 'ops-spaceport-02',
  name: '长十乙发射工位',
  size_m: 140,
  size_axis: 'width',
  effects: ['glow_windows', 'blink'],
};

const DEG = Math.PI / 180;

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'ops-spaceport-02';

  // ---------- 材质 ----------
  const std = (color, roughness = 0.85, metalness = 0.05) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const dusted = (hex, roughness = 0.95) => {         // 朝天面尘膜：调暗偏红
    const c = new THREE.Color(hex);
    c.r *= 0.97; c.g *= 0.92; c.b *= 0.90;
    return new THREE.MeshStandardMaterial({ color: c, roughness, metalness: 0.02 });
  };
  const M = {
    conc:     std(0xb9a48c, 0.98),          // 烧结风化层混凝土
    concTop:  dusted(0xb9a48c),
    scorch:   std(0x453c34, 0.95),          // 羽流烧蚀面
    blue:     std(0x2b7cc9, 0.7, 0.15),     // 勤务塔蓝（商发二号工位涂装）
    blueTop:  dusted(0x2b7cc9, 0.8),
    white:    std(0xeceff1, 0.8),           // 平台板/包板白
    whiteTop: dusted(0xeceff1),
    steel:    std(0xdfe3e6, 0.75),          // 避雷塔浅灰白
    truss:    std(0x8e979e, 0.8),
    heavy:    std(0x3d444c, 0.7, 0.2),      // 回收网架重型格构（深钢灰）
    launch:   std(0xd4671f, 0.75, 0.1),     // 发射台橙
    launchTop: dusted(0xd4671f, 0.85),
    dark:     std(0x4a4e54, 0.75),
    orange:   std(0xc0662a, 0.8),
    red:      std(0xa8382e, 0.8),
    pipe:     std(0xa9adb2, 0.6, 0.3),
    cable:    std(0x2e3338, 0.6, 0.3),      // 主缆/网索
    lox:      std(0xf2f0ea, 0.6),
    ch4:      std(0xc8b98a, 0.7),
    berm:     std(0xa08a6e, 1.0),
    rail:     std(0x6e7378, 0.55, 0.4),
  };

  // 夜光 / 闪烁材质
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xd8f0ff, emissive: 0xcfe8ff, emissiveIntensity: 1.0, roughness: 0.3 });
  const floodMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e0, emissive: 0xffedc4, emissiveIntensity: 1.0, roughness: 0.4 });
  const padLampMat = new THREE.MeshStandardMaterial({
    color: 0x9fd8ff, emissive: 0x7fc4ff, emissiveIntensity: 1.0, roughness: 0.4 });
  const blinkMat = new THREE.MeshStandardMaterial({
    color: 0xff4030, emissive: 0xff2515, emissiveIntensity: 1.2, roughness: 0.4 });
  g.userData.nightMats = [windowMat, floodMat, padLampMat];
  g.userData.blinkMats = [blinkMat];

  // ---------- 几何助手（y0 = 底面高度） ----------
  const box = (w, h, d, mat, x, y0, z, ry = 0, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y0 + h / 2, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  };
  const boxT = (w, h, d, side, top, x, y0, z, ry = 0, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      [side, side, top, side, side, side]);
    m.position.set(x, y0 + h / 2, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);   // 修复:避雷塔顶平台以第 10 参传 parent 曾被忽略,悬浮在 (0,95,0)
    return m;
  };
  const cyl = (r, h, mat, x, yc, z, seg = 12, parent = g) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, yc, z);
    parent.add(m);
    return m;
  };
  const sph = (r, mat, x, y, z, w = 16, hseg = 12, parent = g) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, w, hseg), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  // 两点连杆（缆索/斜杆通用）
  const strut = (p0, p1, r, mat, seg = 8, parent = g) => {
    const v = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
    const len = v.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
    m.position.set((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
    parent.add(m);
    return m;
  };
  const anchor = (name, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = name; a.position.set(x, y, z); g.add(a);
  };

  // ============================================================
  // 1. 发射台：混凝土基座 25×25 + 橙色发射台面（中央 8×8 导流口）
  //    + 牵制墩 + 台缘栏杆 + 台面轮廓灯 + 转运轨道（+Z 正面）
  // ============================================================
  const DECK = 5.0;
  // 台面四块板围出 8×8 导流口（橙色钢结构台面）
  boxT(25, 1.8, 8.5, M.launch, M.launchTop, 0, DECK - 1.8, 8.25);
  boxT(25, 1.8, 8.5, M.launch, M.launchTop, 0, DECK - 1.8, -8.25);
  boxT(8.5, 1.8, 8, M.launch, M.launchTop, 8.25, DECK - 1.8, 0);
  boxT(8.5, 1.8, 8, M.launch, M.launchTop, -8.25, DECK - 1.8, 0);
  // 支承墙（混凝土，-X 向导流槽敞开）
  box(2, 3.2, 25, M.conc, 11.5, 0, 0);
  box(21, 3.2, 2, M.conc, -1, 0, 11.5);
  box(21, 3.2, 2, M.conc, -1, 0, -11.5);
  // 台缘白色栏杆（四边，-X 边留导流缺口）
  for (const [w, d, x, z] of [[25, 0.25, 0, 12.4], [25, 0.25, 0, -12.4], [0.25, 25, 12.4, 0]]) {
    box(w, 0.15, d, M.white, x, DECK + 1.05, z);
    const n = Math.round(Math.max(w, d) / 3);
    for (let i = 0; i <= n; i++)
      box(0.12, 1.05, 0.12, M.white,
        w > d ? -w / 2 + (w * i) / n : x, DECK, w > d ? z : -d / 2 + (d * i) / n);
  }
  // 导流锥（单面斜坡，向 -X 偏折）
  const defl = new THREE.Mesh(new THREE.BoxGeometry(9, 0.8, 7.6), M.scorch);
  defl.position.set(-1.5, 2.4, 0);
  defl.rotation.z = 38 * DEG;
  g.add(defl);
  // 牵制墩 ×4 + 橙色托架框（箭体落座面 y≈8.1）
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    box(1.3, 2.3, 1.3, M.dark, sx * 3.3, DECK, sz * 3.3);
  box(8, 0.8, 1.2, M.orange, 0, DECK + 2.3, 3.3);
  box(8, 0.8, 1.2, M.orange, 0, DECK + 2.3, -3.3);
  box(1.2, 0.8, 5.4, M.orange, 3.3, DECK + 2.3, 0);
  box(1.2, 0.8, 5.4, M.orange, -3.3, DECK + 2.3, 0);
  // 台面轮廓灯 ×4（夜光）
  for (const [lx, lz] of [[11.8, 11.8], [11.8, -11.8], [-11.8, 11.8], [-11.8, -11.8]])
    box(0.6, 0.6, 0.6, padLampMat, lx, DECK, lz);
  // 转运轨道（发射台 → +Z 转运方向：路基 + 双轨 + 轨枕）
  boxT(7, 0.5, 46, M.conc, M.concTop, 7, 0, 36);
  box(0.35, 0.4, 46, M.rail, 4.6, 0.5, 36);
  box(0.35, 0.4, 46, M.rail, 9.4, 0.5, 36);
  for (let i = 0; i < 10; i++)
    box(6.2, 0.18, 0.5, M.dark, 7, 0.5, 15.5 + i * 4.6);
  // 台侧检修梯塔（+Z 正面两侧）
  for (const sx of [-1, 1]) {
    box(1.6, DECK, 1.6, M.launch, sx * 10.5, 0, 13.2);
    box(2.0, 0.3, 2.0, M.white, sx * 10.5, DECK, 13.2);
  }

  // ============================================================
  // 2. 导流槽：-X 向 40 m 单面斜坡 + 内壁分段肋 + 喇叭口
  // ============================================================
  const floor = new THREE.Mesh(new THREE.BoxGeometry(40, 0.6, 10), M.conc);
  floor.position.set(-32.5, 0.9, 0);
  floor.rotation.z = -1.9 * DEG;
  g.add(floor);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(38, 0.2, 6), M.scorch);
  strip.position.set(-32.5, 1.28, 0);
  strip.rotation.z = -1.9 * DEG;
  g.add(strip);
  boxT(30, 4, 2, M.conc, M.concTop, -27.5, 0, 6);
  boxT(30, 4, 2, M.conc, M.concTop, -27.5, 0, -6);
  // 内壁分段肋（每 7.5 m 一道）
  for (let i = 0; i < 4; i++) for (const sz of [-1, 1])
    box(0.6, 4.4, 0.5, M.conc, -18 - i * 7.5, 0, sz * 4.85);
  // 喇叭形出口段（外撇 22°，与直段搭接）
  boxT(14, 4, 2, M.conc, M.concTop, -48.0, 0, 8.6, -22 * DEG);
  boxT(14, 4, 2, M.conc, M.concTop, -48.0, 0, -8.6, 22 * DEG);

  // ============================================================
  // 3. 固定勤务塔：蓝色密格桁架（实照涂装），z=-16 中心，12×10 足印
  //    满面 X 撑 + 白色包板层 + 电梯井窗带 + 吊机房 + 回转平台/摆杆
  // ============================================================
  const TW = 85;
  const legX = 5.4, legZF = -11.6, legZB = -20.4, NL = 15, LH = TW / NL; // 5.67
  for (const sx of [-1, 1]) {
    box(1.4, TW, 1.4, M.blue, sx * legX, 0, legZF);
    box(1.4, TW, 1.4, M.blue, sx * legX, 0, legZB);
  }
  // 水平环带每层 + 四面 X 撑（前面 0~3 层留门洞不加撑）
  for (let i = 1; i <= NL; i++) {
    const y1 = i * LH, y0 = y1 - LH;
    box(12, 0.6, 0.6, M.blue, 0, y1 - 0.3, legZF);
    box(12, 0.6, 0.6, M.blue, 0, y1 - 0.3, legZB);
    box(0.6, 0.6, 9.6, M.blue, legX, y1 - 0.3, -16);
    box(0.6, 0.6, 9.6, M.blue, -legX, y1 - 0.3, -16);
    // X 撑：背面 + 两侧全高；正面从第 4 层起（下部留设备通道）
    strut([-legX, y0, legZB], [legX, y1, legZB], 0.28, M.blue, 6);
    strut([-legX, y1, legZB], [legX, y0, legZB], 0.28, M.blue, 6);
    for (const sx of [-1, 1]) {
      strut([sx * legX, y0, legZF], [sx * legX, y1, legZB], 0.28, M.blue, 6);
      strut([sx * legX, y1, legZF], [sx * legX, y0, legZB], 0.28, M.blue, 6);
    }
    if (i >= 4) {
      strut([-legX, y0, legZF], [legX, y1, legZF], 0.28, M.blue, 6);
      strut([-legX, y1, legZF], [legX, y0, legZF], 0.28, M.blue, 6);
    }
  }
  // 白色包板层（设备舱段，实照塔身夹层）×3
  for (const y of [22.7, 45.3, 68]) boxT(12.6, 5.7, 10.4, M.white, M.whiteTop, 0, y - 5.7, -16);
  // 内部工作层板 ×5
  for (let i = 1; i <= 5; i++)
    boxT(11.5, 0.5, 9.5, M.white, M.whiteTop, 0, i * 17 - 0.5, -16);
  // 电梯井（白色包板 + 竖向窗带夜光）
  box(3, TW - 5, 3, M.white, 8.2, 0, -18);
  box(0.5, TW - 12, 0.15, windowMat, 8.2, 4, -16.42);
  // 顶部吊机房 + 吊机梁 + 避雷针 + 障碍灯
  boxT(13, 5, 8.5, M.white, M.whiteTop, 0, TW, -16.5);
  box(9, 1.0, 0.25, windowMat, 0, TW + 2.6, -12.1);
  box(1.6, 1.4, 10, M.orange, 3.5, TW + 1.2, -8);
  cyl(0.3, 10, M.steel, 0, TW + 10, -16);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 8), M.steel);
  tip.position.set(0, TW + 16.1, -16);
  g.add(tip);
  sph(0.55, blinkMat, 0, TW + 14.2, -16, 10, 8);

  // ---- 回转平台 5 组（白色，铰点塔前缘两角，交付微开 15°） ----
  const plats = [];
  for (let i = 0; i < 5; i++) {
    const y = 18 + i * 12.5;
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 5.8, y, -11);
      pivot.rotation.y = side * 15 * DEG;
      g.add(pivot);
      box(4.6, 0.7, 11.5, M.white, -side * 1.6, 0, 6.1, 0, pivot);
      box(0.25, 1.2, 11.5, M.truss, -side * 3.8, 0.7, 6.1, 0, pivot);
      box(4.6, 0.25, 0.25, M.truss, -side * 1.6, 1.65, 11.7, 0, pivot);
      // 栏杆立柱
      for (let k = 0; k < 4; k++)
        box(0.18, 1.2, 0.18, M.truss, -side * 3.8, 0.7, 1.2 + k * 3.3, 0, pivot);
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 7.5), M.blue);
      st.position.set(-side * 1.2, -1.8, 3.2);
      st.rotation.x = -28 * DEG;
      pivot.add(st);
      plats.push({ pivot, side });
    }
  }

  // ---- 摆杆 ×3（加注/供气脐带） ----
  const arms = [];
  [[26, -1], [44, 1], [62, -1]].forEach(([y, side]) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 2.4, y, -11.3);
    g.add(pivot);
    box(0.7, 0.9, 10.5, M.orange, 0, -0.45, 5.2, 0, pivot);
    box(0.35, 0.35, 9.5, M.pipe, side * 0.6, -0.1, 5.0, 0, pivot);
    box(1.6, 2.2, 0.6, M.dark, 0, -1.1, 10.6, 0, pivot);
    arms.push({ pivot, side });
  });

  // ============================================================
  // 4. 避雷塔 ×4（白色锥形桁架 + 分段 X 撑，塔尖红色障碍灯）
  // ============================================================
  const ltPos = [[42, 42], [42, -42], [-42, 42], [-42, -42]];
  const lattice = (px, pz) => {
    const t = new THREE.Group();
    t.position.set(px, 0, pz);
    g.add(t);
    const stage = (y0, y1, w0, w1, sec) => {
      const h = y1 - y0, tilt = Math.atan2(w0 - w1, h);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(sec, h / Math.cos(tilt) + sec, sec), M.steel);
        leg.position.set(sx * (w0 + w1) / 2, (y0 + y1) / 2, sz * (w0 + w1) / 2);
        leg.rotation.z = -sx * tilt;
        leg.rotation.x = sz * tilt;
        t.add(leg);
      }
    };
    stage(0, 55, 3.5, 1.5, 0.8);
    stage(55, 95, 1.5, 0.5, 0.6);
    // 环带 + 相邻环带间单斜撑（方向交替）
    const rings = [[0, 3.5], [18, 2.85], [36, 2.2], [55, 1.5], [75, 1.0]];
    for (const [y, w] of rings.slice(1)) {
      box(w * 2 + 0.5, 0.5, 0.5, M.steel, 0, y, w, 0, t);
      box(w * 2 + 0.5, 0.5, 0.5, M.steel, 0, y, -w, 0, t);
      box(0.5, 0.5, w * 2 + 0.5, M.steel, w, y, 0, 0, t);
      box(0.5, 0.5, w * 2 + 0.5, M.steel, -w, y, 0, 0, t);
    }
    for (let i = 0; i < rings.length - 1; i++) {
      const [ya, wa] = rings[i], [yb, wb] = rings[i + 1], s = i % 2 ? 1 : -1;
      strut([s * wa, ya + 0.3, -wa], [-s * wb, yb, -wb], 0.22, M.steel, 6, t);
      strut([-s * wa, ya + 0.3, wa], [s * wb, yb, wb], 0.22, M.steel, 6, t);
    }
    boxT(2.6, 0.4, 2.6, M.steel, dusted(0xdfe3e6), 0, 95, 0, 0, t); // 顶平台
    box(1.8, 1.0, 1.8, M.steel, 0, 95.4, 0, 0, t);
    cyl(0.3, 12, M.red, 0, 95 + 6.5, 0, 8, t);          // 泄放尖杆（红）
    sph(0.6, blinkMat, 0, 108, 0, 10, 8, t);
    sph(0.45, blinkMat, 1.5, 55.8, 1.5, 8, 6, t);
    return t;
  };
  for (const [px, pz] of ltPos) lattice(px, pz);

  // ============================================================
  // 5. 加注区（土堤隔离）：LOX 球罐 ×2 + CH4 卧罐 ×2 + 汇管 + 阀站 + 桥架
  // ============================================================
  box(30, 2.5, 4, M.berm, -50, 0, -35);
  box(4, 2.5, 24, M.berm, -65, 0, -24);
  box(4, 2.5, 14, M.berm, -35, 0, -29);
  for (const z of [-20, -30]) {
    cyl(2.6, 2.6, M.dark, -56, 1.3, z);
    sph(4, M.lox, -56, 5.2, z);
    box(0.6, 2.2, 0.6, M.pipe, -52.6, 0, z);
  }
  for (const z of [-20, -30]) {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 8, 12), M.ch4);
    body.position.set(-44, 2.8, z);
    body.rotation.z = Math.PI / 2;
    g.add(body);
    sph(2, M.ch4, -40, 2.8, z, 12, 8);
    sph(2, M.ch4, -48, 2.8, z, 12, 8);
    box(3.6, 1.0, 1.2, M.conc, -46, 0, z);
    box(3.6, 1.0, 1.2, M.conc, -42, 0, z);
  }
  // 汇管：罐间纵向集管 + 竖向立管接入
  const header = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 16, 8), M.pipe);
  header.position.set(-50, 1.1, -25);
  header.rotation.x = Math.PI / 2;
  g.add(header);
  for (const z of [-20, -30]) {
    cyl(0.22, 2.2, M.pipe, -52.6, 2.2, z, 8);
    cyl(0.22, 1.6, M.pipe, -46, 1.0, z, 8);
  }
  // 阀站小屋（桥架起点，夜光窗）
  box(3.2, 2.6, 2.6, M.white, -40, 0, -16);
  box(2.4, 0.6, 0.15, windowMat, -40, 1.5, -14.68);
  // 管线桥架：直线沿 z=-18，双管 + 门架
  {
    const x0 = -44, x1 = -9, zr = -18, len = x1 - x0, mx = (x0 + x1) / 2;
    for (const [r, yy, off] of [[0.35, 3.1, -0.55], [0.3, 3.55, 0.55]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), M.pipe);
      p.position.set(mx, yy, zr + off);
      p.rotation.z = Math.PI / 2;
      g.add(p);
    }
    const n = Math.round(len / 6.5);
    for (let i = 0; i <= n; i++) {
      const px = x0 + (len * i) / n;
      box(0.6, 2.7, 0.6, M.truss, px, 0, zr);
      box(0.6, 0.4, 2.4, M.truss, px, 2.7, zr);
    }
  }

  // ============================================================
  // 6. 网式回收阵位（+X 侧，"领航者"号地面版）：台面 46×36 +
  //    四根内倾格构柱 + 顶部环框走道 + "井"字主缆 + 下垂网兜 +
  //    张紧绞车 ×4 + 泛光杆 + 障碍灯
  // ============================================================
  const NC = [58, 12], NH = 34;              // 阵位中心 / 环框高（避开避雷塔基座）
  boxT(46, 1.2, 36, M.conc, M.concTop, NC[0], 0, NC[1]);
  const scorch2 = new THREE.Mesh(new THREE.CircleGeometry(4, 20), M.scorch);
  scorch2.rotation.x = -Math.PI / 2;
  scorch2.position.set(NC[0], 1.26, NC[1]);
  g.add(scorch2);
  // 四角内倾格构柱（底 3.6 → 顶 2.0，缩到环框角点）
  const cOff = [[-17, -12], [17, -12], [-17, 12], [17, 12]];  // 柱脚
  const topOff = [[-14, -9.5], [14, -9.5], [-14, 9.5], [14, 9.5]]; // 柱顶=环框角
  cOff.forEach(([ox, oz], ci) => {
    const [tx, tz] = topOff[ci];
    const bx = NC[0] + ox, bz = NC[1] + oz, ex = NC[0] + tx, ez = NC[1] + tz;
    // 4 根小腿组成一根格构柱（随柱身整体内倾）
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      strut([bx + sx * 1.5, 1.2, bz + sz * 1.5], [ex + sx * 0.85, NH, ez + sz * 0.85],
        0.4, M.heavy, 6);
    // 柱身水平缀条 3 道 + 面内单斜撑
    for (let k = 1; k <= 3; k++) {
      const f = k / 4, y = 1.2 + (NH - 1.2) * f;
      const cx = bx + (ex - bx) * f, cz = bz + (ez - bz) * f;
      const w = 1.5 - 0.65 * f;
      box(2 * w + 0.5, 0.4, 0.4, M.heavy, cx, y, cz - w);
      box(2 * w + 0.5, 0.4, 0.4, M.heavy, cx, y, cz + w);
      box(0.4, 0.4, 2 * w + 0.5, M.heavy, cx - w, y, cz);
      box(0.4, 0.4, 2 * w + 0.5, M.heavy, cx + w, y, cz);
    }
    boxT(3.2, 0.8, 3.2, M.heavy, dusted(0x3d444c), ex, NH, ez);   // 柱顶节点板
    // 柱脚张紧绞车（橙色小车 + 卷筒，短轨）
    const wx = bx + (ox > 0 ? -4.5 : 4.5), wz = bz + (oz > 0 ? -3 : 3);
    box(5, 0.3, 1.2, M.rail, wx, 1.2, wz);
    box(2.0, 1.4, 1.6, M.orange, wx, 1.5, wz);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 10), M.dark);
    drum.position.set(wx, 3.2, wz);
    drum.rotation.z = Math.PI / 2;
    g.add(drum);
    strut([wx, 3.2, wz], [ex, NH + 0.4, ez], 0.12, M.cable, 6);   // 张紧索
  });
  // 顶部环框（走道梁）+ 栏杆
  const NB = NH + 0.8;
  boxT(31.2, 1.6, 2.0, M.heavy, dusted(0x3d444c), NC[0], NH, NC[1] - 9.5);
  boxT(31.2, 1.6, 2.0, M.heavy, dusted(0x3d444c), NC[0], NH, NC[1] + 9.5);
  boxT(2.0, 1.6, 17.4, M.heavy, dusted(0x3d444c), NC[0] - 14, NH, NC[1]);
  boxT(2.0, 1.6, 17.4, M.heavy, dusted(0x3d444c), NC[0] + 14, NH, NC[1]);
  for (const sz of [-1, 1]) {
    box(30, 0.12, 0.12, M.white, NC[0], NB + 1.0, NC[1] + sz * 10.4);
    for (let k = 0; k <= 8; k++)
      box(0.12, 1.0, 0.12, M.white, NC[0] - 15 + k * 3.75, NB, NC[1] + sz * 10.4);
  }
  // "井"字主缆（环框内两横两纵，r0.25）
  const nx0 = NC[0] - 13.5, nx1 = NC[0] + 13.5, nz0 = NC[1] - 9, nz1 = NC[1] + 9;
  for (const dz of [-4.5, 4.5]) strut([nx0, NB, NC[1] + dz], [nx1, NB, NC[1] + dz], 0.25, M.cable);
  for (const dx of [-5.5, 5.5]) strut([NC[0] + dx, NB, nz0], [NC[0] + dx, NB, nz1], 0.25, M.cable);
  // 下垂网兜：中心下凹 6 m，V 形粗化网索（沿 X 7 道 + 沿 Z 5 道）
  const dip = 6, mid = NB - dip;
  for (let k = 0; k < 7; k++) {
    const z = nz0 + (k * (nz1 - nz0)) / 6;
    const sag = mid + 2.2 * Math.abs(k - 3) / 3;      // 边缘索下垂浅
    strut([nx0, NB, z], [NC[0], sag, z], 0.09, M.cable, 6);
    strut([NC[0], sag, z], [nx1, NB, z], 0.09, M.cable, 6);
  }
  for (let k = 0; k < 5; k++) {
    const x = nx0 + (k * (nx1 - nx0)) / 4;
    const sag = mid + 2.2 * Math.abs(k - 2) / 2;
    strut([x, NB, nz0], [x, sag, NC[1]], 0.09, M.cable, 6);
    strut([x, sag, NC[1]], [x, NB, nz1], 0.09, M.cable, 6);
  }
  // 环框角障碍灯 ×2（对角）+ 泛光杆 ×4（台面外角，夜光）
  sph(0.5, blinkMat, NC[0] - 14, NH + 2.2, NC[1] - 9.5, 8, 6);
  sph(0.5, blinkMat, NC[0] + 14, NH + 2.2, NC[1] + 9.5, 8, 6);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const px = NC[0] + sx * 21, pz = NC[1] + sz * 16;
    cyl(0.25, 6, M.dark, px, 3 + 1.2, pz, 8);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 0.7), floodMat);
    head.position.set(px, 7.4, pz);
    head.lookAt(NC[0], NH - 10, NC[1]);
    g.add(head);
  }

  // ============================================================
  // 7. 测发楼（半掩体）+ 气象塔 + 摄影塔位 ×2
  // ============================================================
  boxT(18, 4.5, 9, M.conc, M.concTop, 30, 0, -40);
  box(14, 1.0, 0.3, windowMat, 30, 2.6, -35.4);
  box(20, 2.5, 3, M.berm, 30, 0, -33.5);
  cyl(0.3, 5, M.pipe, 36, 7, -42, 8);
  box(2.2, 0.4, 2.2, M.dark, 24, 4.5, -42);
  // 屋顶测控碟形天线（朝天倾斜）
  const dish = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16), M.steel);
  dish.position.set(24, 5.6, -42);
  dish.rotation.x = -55 * DEG;
  g.add(dish);
  // 气象塔（20 m 桅杆 + 仪器臂 + 风杯 spinner）
  const WX = [20, 46];
  box(0.8, 20, 0.8, M.truss, WX[0], 0, WX[1]);
  box(3.2, 0.4, 0.4, M.pipe, WX[0] + 1.2, 10, WX[1]);
  box(3.2, 0.4, 0.4, M.pipe, WX[0] - 1.2, 16, WX[1]);
  const anem = new THREE.Group();
  anem.name = 'anemometer';
  anem.position.set(WX[0], 20.6, WX[1]);
  g.add(anem);
  for (const a of [0, 120, 240]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), M.dark);
    arm.position.set(0.7 * Math.cos(a * DEG), 0, 0.7 * Math.sin(a * DEG));
    arm.rotation.y = -a * DEG;
    anem.add(arm);
    sph(0.22, M.dark, 1.4 * Math.cos(a * DEG), 0, 1.4 * Math.sin(a * DEG), 8, 6, anem);
  }
  // 摄影塔位 ×2
  for (const [cx, cz] of [[34, 54], [-30, 34]]) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      box(0.45, 12, 0.45, M.truss, cx + sx * 1.1, 0, cz + sz * 1.1);
    boxT(3.4, 0.5, 3.4, M.steel, dusted(0xdfe3e6), cx, 12, cz);
    const cam = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.7), M.dark);
    cam.position.set(cx, 13.1, cz);
    cam.lookAt(0, 8, 0);
    g.add(cam);
  }

  // ---------- POI 锚点 ----------
  anchor('poi_tower', 0, 45, -16);
  anchor('poi_trench', -32, 3, 0);
  anchor('poi_lightning', 42, 55, -42);
  anchor('poi_tank', -50, 5, -25);
  anchor('poi_net', NC[0], 18, NC[1]);

  // ---------- 灯 / 光束 / 旋转件 ----------
  g.userData.lights = [
    { color: 0xfff2d8, pos: [0, 32, -6], range: 70 },
    { color: 0xdfe8ff, pos: [NC[0], 22, NC[1]], range: 55 },
    { color: 0xffd9a0, pos: [30, 5, -37], range: 30 },
  ];
  g.userData.beams = [];
  g.userData.spinners = [{ node: 'anemometer', axis: 'y', rpm: 45 }];

  // ---------- 发射准备状态机 ----------
  const seq = { mode: 'idle', p: 0 };
  const DUR = 14;
  g.userData.actions = {
    '发射准备': () => { seq.mode = 'opening'; },
    '合拢复位': () => { seq.mode = 'closing'; },
  };
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => x * x * (3 - 2 * x);
  g.userData.animate = (t, dt) => {
    if (seq.mode === 'opening') {
      seq.p = Math.min(1, seq.p + dt / DUR);
      if (seq.p >= 1) seq.mode = 'idle';
    } else if (seq.mode === 'closing') {
      seq.p = Math.max(0, seq.p - dt / DUR);
      if (seq.p <= 0) seq.mode = 'idle';
    } else return;
    const platA = ease(clamp01(seq.p / 0.55));
    const armA = ease(clamp01((seq.p - 0.45) / 0.55));
    for (const { pivot, side } of plats)
      pivot.rotation.y = side * (15 + 85 * platA) * DEG;
    for (const { pivot, side } of arms)
      pivot.rotation.y = side * 78 * armA * DEG;
  };

  return g;
}
