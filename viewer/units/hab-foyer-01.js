// hab-foyer-01 —— 地下城玄关（车辆气闸厅 + 观景窗一瞥城市空腔）
// 契约（内部场景变体）：米制；原点 = 车辆气闸大门【内侧】地面中心；
//   厅体向 -Z 延伸（+Z 方向即 hab-tunnel-01 的大门背面）；y >= 0.2；<=5 万面。
// 设计：玩家不真进城——气闸厅左壁一面观景窗，窗外是发光点阵伪造的
//   城市空腔剪影（diorama），"透过窗看见地下城灯火"。
// userData.nightMats = 发光材质数组（城内常亮）；userData.lights = 点光源锚点。

export const meta = {
  id: 'hab-foyer-01',
  name: '地下城玄关',
  size_m: 45,
  size_axis: 'width',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260713);

  /* ---------------- 材质 ---------------- */
  const M = {
    print:     new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93 }), // 打印土层墙
    printDim:  new THREE.MeshStandardMaterial({ color: 0xa8895f, roughness: 0.94 }),
    floor:     new THREE.MeshStandardMaterial({ color: 0x6f6257, roughness: 0.9 }),  // 压实地坪
    vault:     new THREE.MeshStandardMaterial({ color: 0xb0916b, roughness: 0.95 }), // 拱顶
    doorMetal: new THREE.MeshStandardMaterial({ color: 0x3b3f45, roughness: 0.58, metalness: 0.55 }),
    doorTrim:  new THREE.MeshStandardMaterial({ color: 0x26292d, roughness: 0.5,  metalness: 0.6 }),
    steel:     new THREE.MeshStandardMaterial({ color: 0x555a61, roughness: 0.55, metalness: 0.65 }),
    hazardY:   new THREE.MeshStandardMaterial({ color: 0xd9a422, roughness: 0.7 }),
    hazardK:   new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.7 }),
    white:     new THREE.MeshStandardMaterial({ color: 0xd9d5cb, roughness: 0.8 }),
    red:       new THREE.MeshStandardMaterial({ color: 0x9c2f24, roughness: 0.75 }),
    cave:      new THREE.MeshStandardMaterial({ color: 0x241510, roughness: 1.0 }),  // 城市空腔岩壁
    tower:     new THREE.MeshStandardMaterial({ color: 0x1a1310, roughness: 0.95 }), // 塔楼剪影
    glass:     new THREE.MeshStandardMaterial({ color: 0xbfd8ee, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.16 }),
  };
  const G = {
    lamp:  new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0xfff0d0, emissiveIntensity: 2.2, roughness: 0.6 }), // 厅内顶灯带
    sign:  new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0, roughness: 0.6 }), // 内门标志板
    port:  new THREE.MeshStandardMaterial({ color: 0x241d12, emissive: 0xffe2b0, emissiveIntensity: 2.2, roughness: 0.5 }),
    ledR:  new THREE.MeshStandardMaterial({ color: 0x1a0806, emissive: 0xff4034, emissiveIntensity: 2.0, roughness: 0.5 }),
    ledG:  new THREE.MeshStandardMaterial({ color: 0x061a0a, emissive: 0x3ee06a, emissiveIntensity: 2.0, roughness: 0.5 }),
    cityWin: new THREE.MeshStandardMaterial({ color: 0x110d08, emissive: 0xffd9a0, emissiveIntensity: 1.8, roughness: 0.6 }), // 城市窗点阵
    skyBand: new THREE.MeshStandardMaterial({ color: 0x181410, emissive: 0xffe6bb, emissiveIntensity: 1.6, roughness: 0.6 }), // 人造天穹光带
    street:  new THREE.MeshStandardMaterial({ color: 0x110d08, emissive: 0xffc070, emissiveIntensity: 2.0, roughness: 0.6 }), // 街灯点
    lift:    new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xffb030, emissiveIntensity: 2.0, roughness: 0.5 }), // 电梯指示琥珀
  };
  nightMats.push(G.lamp, G.sign, G.port, G.ledR, G.ledG, G.cityWin, G.skyBand, G.street, G.lift);

  function box(w, h, d, mat, x, y, z, rz = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rz) m.rotation.z = rz;
    group.add(m);
    return m;
  }

  /* ==========================================================
   * 1. 气闸厅壳体：净宽 12 × 长 20，侧墙 5.5 + 折面拱顶（净高 ~8.2）
   * ========================================================== */
  function layeredWall(len, height, thick, mat) {
    const g = new THREE.Group();
    const layerH = 0.5;
    const n = Math.round(height / layerH);
    for (let i = 0; i < n; i++) {
      const t = (i % 2 === 0 ? thick : thick * 0.76) + (rng() - 0.5) * 0.05;
      const l = len + (rng() - 0.5) * 0.1;
      const layer = new THREE.Mesh(new THREE.BoxGeometry(l, layerH * 1.04, t), mat);
      layer.position.y = (i + 0.5) * layerH + 0.011;
      g.add(layer);
    }
    return g;
  }
  // 地坪（顶面 y=0.5）
  box(13.4, 0.3, 20.9, M.floor, 0, 0.35, -10.2);
  // 右墙：整段打印层墙
  const wallR = layeredWall(20.6, 5, 0.7, M.print);
  wallR.rotation.y = Math.PI / 2;
  wallR.position.set(6.35, 0.5, -10.1);
  group.add(wallR);
  // 左墙：z 0..-12.6 打印层墙 + z -12.6..-20 观景窗墙段
  const wallL = layeredWall(12.6, 5, 0.7, M.print);
  wallL.rotation.y = Math.PI / 2;
  wallL.position.set(-6.35, 0.5, -6.3);
  group.add(wallL);
  // 观景窗墙段（洞口 z -13.5..-18.5 × y 1.6..3.8）
  box(0.7, 1.1, 7.4, M.printDim, -6.35, 1.05, -16.3);   // 窗台下
  box(0.7, 1.7, 7.4, M.printDim, -6.35, 4.65, -16.3);   // 窗楣上
  box(0.7, 2.2, 0.9, M.printDim, -6.35, 2.7, -13.05);   // 左侧窗肩
  box(0.7, 2.2, 1.5, M.printDim, -6.35, 2.7, -19.25);   // 右侧窗肩
  // 窗框（钢）+ 玻璃
  box(0.22, 0.16, 5.3, M.steel, -6.15, 1.68, -16.0);
  box(0.22, 0.16, 5.3, M.steel, -6.15, 3.72, -16.0);
  box(0.22, 2.2, 0.16, M.steel, -6.15, 2.7, -13.42);
  box(0.22, 2.2, 0.16, M.steel, -6.15, 2.7, -18.58);
  box(0.06, 2.2, 5.0, M.glass, -6.3, 2.7, -16.0);
  // 折面拱顶：两块斜板 + 平顶板
  box(4.7, 0.35, 20.9, M.vault, -4.2, 6.9, -10.2,  0.66);
  box(4.7, 0.35, 20.9, M.vault,  4.2, 6.9, -10.2, -0.66);
  box(5.8, 0.35, 20.9, M.vault,  0, 8.4, -10.2);
  // 前端墙（z=0，外门背面所在）：门洞两侧 + 门楣上方
  box(3.4, 5.0, 0.6, M.printDim, -4.3, 2.95, -0.3);
  box(3.4, 5.0, 0.6, M.printDim,  4.3, 2.95, -0.3);
  box(12.7, 3.6, 0.6, M.printDim, 0, 7.15, -0.3);
  // 外门背面（简化双扇 + 中缝条纹）
  box(2.98, 5, 0.2, M.doorMetal, -1.51, 2.95, -0.42);
  box(2.98, 5, 0.2, M.doorMetal,  1.51, 2.95, -0.42);
  for (let i = 0; i < 10; i++) {
    box(0.3, 0.5, 0.05, i % 2 === 0 ? M.hazardY : M.hazardK, 0, 0.75 + i * 0.5, -0.54);
  }
  // 尾端墙（z=-20）：内门所在
  box(12.7, 8.8, 0.6, M.printDim, 0, 4.6, -20.4);

  /* ==========================================================
   * 2. 内侧气闸大门 6×5（通往城内）+ 人员门 + 标志板
   * ========================================================== */
  const g2x = -1.2;
  box(2.98, 5, 0.22, M.doorMetal, g2x - 1.51, 2.95, -20.0);
  box(2.98, 5, 0.22, M.doorMetal, g2x + 1.51, 2.95, -20.0);
  for (const side of [-1.51, 1.51]) {
    for (const ry of [1.35, 2.35, 3.35, 4.35]) {
      box(2.7, 0.22, 0.1, M.doorTrim, g2x + side, ry, -19.86);
    }
  }
  for (let i = 0; i < 10; i++) {
    box(0.34, 0.5, 0.05, i % 2 === 0 ? M.hazardY : M.hazardK, g2x, 0.7 + i * 0.5, -19.88);
  }
  box(6.8, 0.5, 0.3, M.doorTrim, g2x, 5.7, -19.95);            // 门楣
  for (let i = 0; i < 8; i++) {                                 // 状态灯（内门常绿多）
    box(0.18, 0.18, 0.08, i < 3 ? G.ledR : G.ledG, g2x + (i - 3.5) * 0.45, 5.7, -19.82);
  }
  box(3.2, 0.55, 0.12, G.sign, g2x, 6.4, -19.9);                // 发光标志板（城名）
  // 人员门 + 舷窗
  const pdX = 3.9;
  box(1.5, 2.55, 0.16, M.printDim, pdX, 1.72, -20.02);
  box(1.2, 2.2, 0.14, M.doorMetal, pdX, 1.55, -19.9);
  const port = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 20), G.port);
  port.rotation.x = Math.PI / 2;
  port.position.set(pdX, 1.85, -19.82);
  group.add(port);

  /* ==========================================================
   * 3. 厅内设施：车道标线、警示斑马、顶灯带、管线、设备
   * ========================================================== */
  box(0.12, 0.02, 19, M.hazardY, -2.2, 0.515, -10);   // 车道边线
  box(0.12, 0.02, 19, M.hazardY,  2.2, 0.515, -10);
  for (let i = 0; i < 6; i++) {                        // 内门前警示斑马
    box(0.55, 0.02, 1.6, i % 2 === 0 ? M.hazardY : M.hazardK, g2x - 1.65 + i * 0.66, 0.515, -18.6);
  }
  for (const lz of [-4, -10, -16]) {                   // 顶灯带 ×3 → nightMats
    box(6.0, 0.12, 0.35, G.lamp, 0, 8.16, lz);
    box(6.4, 0.08, 0.5, M.steel, 0, 8.24, lz);
  }
  for (const py of [4.35, 4.8]) {                      // 右墙管线
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 19.8, 10), M.steel);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(5.85, py, -10.1);
    group.add(pipe);
  }
  for (const vz of [-5, -11, -17]) {                   // 管线阀箱
    box(0.5, 0.7, 0.4, M.white, 5.75, 4.55, vz);
  }
  /* —— 3b. 城际电梯门组（右墙，直通地表电梯站 hab-lift-01）—— */
  box(0.16, 2.7, 2.6, M.doorTrim, 5.92, 1.85, -15.5);   // 门套（凸出墙内面）
  box(0.06, 2.3, 1.06, M.steel, 5.86, 1.65, -14.96);    // 双扇不锈钢门（缝 0.04）
  box(0.06, 2.3, 1.06, M.steel, 5.86, 1.65, -16.04);
  box(0.05, 0.22, 0.6, G.lift, 5.85, 3.02, -15.5);      // 门楣楼层指示屏
  box(0.06, 0.35, 1.8, G.sign, 5.9, 3.5, -15.5);        // "↑ 地面" 发光标志板
  box(0.05, 0.3, 0.14, M.doorTrim, 5.88, 1.35, -14.05); // 呼梯面板
  box(0.04, 0.06, 0.06, G.lift, 5.85, 1.42, -14.05);    // 呼梯上行灯
  box(0.04, 0.06, 0.06, G.lift, 5.85, 1.28, -14.05);
  for (let i = 0; i < 6; i++) {                         // 门前黄黑警示垫
    box(0.9, 0.02, 0.42, i % 2 === 0 ? M.hazardY : M.hazardK, 5.5, 0.515, -16.55 + i * 0.42);
  }
  {
    const a = new THREE.Object3D();
    a.name = 'poi_lift';
    a.position.set(5.9, 1.65, -15.5);
    group.add(a);
  }

  box(1.6, 2.2, 0.8, M.white, 5.6, 1.6, -6);           // CO2 洗涤器机柜
  for (let i = 0; i < 4; i++) {
    box(1.66, 0.1, 0.7, M.steel, 5.6, 0.9 + i * 0.5, -6);
  }
  box(0.5, 0.8, 0.3, M.red, 5.95, 1.4, -12);           // 消防柜
  box(1.1, 0.02, 2.2, M.hazardK, -4.9, 0.515, -3);     // 人行道黑垫
  box(1.1, 0.02, 2.2, M.hazardK, -4.9, 0.515, -6);

  /* ==========================================================
   * 4. 城市空腔 diorama（观景窗外，x -6.7..-34，常暗 + 发光点阵）
   * ========================================================== */
  // 空腔壳（岩壁）
  box(0.6, 15.4, 22.8, M.cave, -34.3, 7.9, -17);       // 远壁
  box(27.6, 0.6, 22.8, M.cave, -20.5, 15.4, -17);      // 腔顶
  box(27.6, 0.3, 22.8, M.cave, -20.5, 0.35, -17);      // 腔底
  box(27.6, 15.4, 0.6, M.cave, -20.5, 7.9, -5.9);      // 前壁（z=-6 侧）
  box(27.6, 15.4, 0.6, M.cave, -20.5, 7.9, -28.1);     // 后壁（z=-28 侧）
  // 近壁补板（厅墙未覆盖的缺口 + 厅墙上方）
  box(0.6, 15.4, 7.0, M.cave, -6.9, 7.9, -9.4);        // z -6..-12.9（窗墙之前）
  box(0.6, 15.4, 8.3, M.cave, -6.9, 7.9, -24.0);       // z -19.9..-28（窗墙之后）
  box(0.6, 9.7, 22.8, M.cave, -6.9, 10.75, -17);       // 厅墙顶以上 y 5.9..15.4
  // 塔楼剪影 + 窗点阵（面向 +X，即面向观景窗）
  const TOWERS = [ // [x, z, w(z向), h]
    [-30, -9.5, 3.6, 11], [-31, -14, 4.4, 13.5], [-29.5, -19, 3.2, 9],
    [-31.5, -24, 4.0, 12], [-25, -11.5, 2.6, 7], [-24.5, -17, 3.0, 8.5],
    [-25.5, -22.5, 2.8, 6.5], [-19, -14, 2.2, 5], [-18.5, -20, 2.4, 5.8],
  ];
  const winGeo = new THREE.PlaneGeometry(0.26, 0.18);
  for (const [tx, tz, tw, th] of TOWERS) {
    box(2.4, th, tw, M.tower, tx, 0.5 + th / 2, tz);
    // 窗点阵贴在 +X 面
    const rows = Math.floor(th / 0.85), cols = Math.floor(tw / 0.62);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng() < 0.42) continue; // 部分窗熄灯
        const w = new THREE.Mesh(winGeo, G.cityWin);
        w.position.set(tx + 1.21, 1.3 + r * 0.85, tz - tw / 2 + 0.45 + c * 0.62);
        w.rotation.y = Math.PI / 2;
        group.add(w);
      }
    }
  }
  // 人造天穹光带（纵贯腔顶）
  box(0.6, 0.15, 20, G.skyBand, -20, 14.9, -17);
  box(1.0, 0.1, 20.4, M.steel, -20, 15.05, -17);
  // 街灯点阵（地面）
  for (let i = 0; i < 14; i++) {
    const sx = -10 - rng() * 20, sz = -8 - rng() * 18;
    box(0.12, 0.12, 0.12, G.street, sx, 0.9, sz);
    box(0.05, 0.7, 0.05, M.steel, sx, 0.55, sz);
  }

  /* ---------------- 贴地归一化（房规：y=0 即地面） ---------------- */
  const bb = new THREE.Box3().setFromObject(group);
  const dy = isFinite(bb.min.y) ? bb.min.y : 0;
  if (Math.abs(dy) > 1e-4) for (const c of group.children) c.position.y -= dy;

  /* ---------------- 5. 点光源锚点 & 夜光材质表 ---------------- */
  group.userData = {
    lights: [
      { color: 0xffd9a0, pos: [0, 6 - dy, -10], range: 25 },    // 气闸厅
      { color: 0xffb060, pos: [-20, 10 - dy, -17], range: 45 }, // 城市空腔
    ],
    beams: [],
    nightMats,
    // 穿门契约（MODELS.md §4b）：进门落在外门内侧 3.2 m、面向厅内(-Z)；
    // 走回外门口即返回地表
    entry: { pos: [0, 0, -3.2], yaw: 0 },
    exitZone: { pos: [0, -1.2], radius: 1.8 },
  };
  return group;
}
