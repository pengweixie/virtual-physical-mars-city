// hab-tunnel-01 —— 地下城入口（人造覆土山丘 + 平进坡道门廊）
// 契约：米制；原点 = 坡道口地面中心；坡道开口朝 +Z（丘体向 -Z 延伸）；
//       所有几何 y >= 0.2；三角面 <= 50k；build(THREE) 返回 THREE.Group。
// userData.nightMats = 夜间发光材质数组；userData.lights = 点光源锚点。

export const meta = {
  id: 'hab-tunnel-01',
  name: '地下城入口',
  size_m: 60,               // 覆土山丘宽 60 m（实建尺寸自检用；1 单位 = 1 米）
  size_axis: 'width',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];

  /* ---------------- 确定性随机 ---------------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20260712);
  // 基于位置的哈希噪声（接缝安全：同位置同扰动）
  function vnoise(x, y, z) {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s) - 0.5;
  }

  /* ---------------- 材质（哑光 + 尘膜） ---------------- */
  const M = {
    mound:     new THREE.MeshStandardMaterial({ color: 0x8f4a32, roughness: 0.98, metalness: 0.0, flatShading: true }), // 铁锈红覆土
    rock:      new THREE.MeshStandardMaterial({ color: 0x6e3d2a, roughness: 0.96, metalness: 0.0, flatShading: true }),
    print:     new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93, metalness: 0.0 }), // 打印土层·浅土黄
    printDim:  new THREE.MeshStandardMaterial({ color: 0xa8895f, roughness: 0.94, metalness: 0.0 }),
    doorMetal: new THREE.MeshStandardMaterial({ color: 0x3b3f45, roughness: 0.58, metalness: 0.55 }), // 门体深灰
    doorTrim:  new THREE.MeshStandardMaterial({ color: 0x26292d, roughness: 0.5,  metalness: 0.6 }),
    steel:     new THREE.MeshStandardMaterial({ color: 0x555a61, roughness: 0.55, metalness: 0.65 }),
    hazardY:   new THREE.MeshStandardMaterial({ color: 0xd9a422, roughness: 0.7,  metalness: 0.1 }),
    hazardK:   new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.7,  metalness: 0.1 }),
    white:     new THREE.MeshStandardMaterial({ color: 0xd9d5cb, roughness: 0.8,  metalness: 0.1 }), // 塔体白
    grille:    new THREE.MeshStandardMaterial({ color: 0x8e8a80, roughness: 0.75, metalness: 0.3 }),
  };
  // 夜光材质 → nightMats
  const G = {
    strip:  new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffd9a0, emissiveIntensity: 2.4, roughness: 0.6 }), // 门内暖光带
    sign:   new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0, roughness: 0.6 }), // 龙门架标志板
    port:   new THREE.MeshStandardMaterial({ color: 0x241d12, emissive: 0xffe2b0, emissiveIntensity: 2.2, roughness: 0.5 }), // 舷窗
    ledR:   new THREE.MeshStandardMaterial({ color: 0x1a0806, emissive: 0xff4034, emissiveIntensity: 2.0, roughness: 0.5 }),
    ledG:   new THREE.MeshStandardMaterial({ color: 0x061a0a, emissive: 0x3ee06a, emissiveIntensity: 2.0, roughness: 0.5 }),
    beacon: new THREE.MeshStandardMaterial({ color: 0x1a0806, emissive: 0xff3326, emissiveIntensity: 2.0, roughness: 0.5 }),
  };
  nightMats.push(G.strip, G.sign, G.port, G.ledR, G.ledG, G.beacon);

  /* ---------------- 小工具 ---------------- */
  function box(w, h, d, mat, x, y, z, ry = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    group.add(m);
    return m;
  }
  function cyl(rt, rb, h, seg, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  }

  /* ==========================================================
   * 1. 覆土山丘 —— 多块椭球土丘叠合（顶部削平、底部截平于 y=0.2）
   * ========================================================== */
  // [cx, cy, cz, rx, ry, rz, capY(顶部削平), minY(底部截平), amp(起伏), seed]
  const LUMPS = [
    [   0,   0, -30,   24, 15.5, 16,   14.5, 0.2, 0.050,  1], // 中央主丘（顶部平台，放塔）
    [   0,  11.5, -13, 11,  6.0, 10,   13.6, 7.4, 0.015,  2], // 门廊上方眉丘（底截平 7.4 护通道净空；顶 13.6 低于主丘成台地）
    [ -17,   0, -13,   12, 13.0, 15,   99,   0.2, 0.035,  3], // 左前翼丘
    [  17,   0, -13,   12, 13.0, 15,   99,   0.2, 0.035,  4], // 右前翼丘
    [ -8.6,  0,  -7,  3.5,  9.5,  8,   99,   0.2, 0.020,  5], // 左肩丘（贴门廊外墙）
    [  8.6,  0,  -7,  3.5,  9.5,  8,   99,   0.2, 0.020,  6], // 右肩丘
    [ -7.5,  0,  -4.5, 3.2, 12,   5.5, 99,   0.2, 0.020,  7], // 左门楣补丘（封门脸两侧缝）
    [  7.5,  0,  -4.5, 3.2, 12,   5.5, 99,   0.2, 0.020,  8], // 右门楣补丘
    [ -11,   0, -33,   14, 14.2, 12,   13.6, 0.2, 0.050,  9], // 左后丘
    [  12,   0, -31,   13, 13.6, 11,   13.2, 0.2, 0.050, 10], // 右后丘
    [ -22,   0, -22,    8,  8.5, 10,   99,   0.2, 0.050, 11], // 左侧缘丘
    [  21,   0, -19,    8,  7.5,  9,   99,   0.2, 0.050, 12], // 右侧缘丘
    [ -14,   0,  -5,    5,  3.5,  4.5, 99,   0.2, 0.060, 13], // 左前趾丘
    [  15,   0,  -7,  5.5,  3.2,  5,   99,   0.2, 0.060, 14], // 右前趾丘
  ];
  for (const [cx, cy, cz, rx, ry, rz, capY, minY, amp, seed] of LUMPS) {
    const geo = new THREE.SphereGeometry(1, 22, 15);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = vnoise(v.x * 3.1 + seed * 17, v.y * 3.1, v.z * 3.1)
              + 0.5 * vnoise(v.x * 7.7 + seed * 17, v.y * 7.7, v.z * 7.7);
      const r = 1 + amp * n * 2;
      const wx = v.x * r * rx + cx;
      let   wy = v.y * r * ry + cy;
      const wz = v.z * r * rz + cz;
      wy = Math.min(wy, capY);  // 顶部略平
      wy = Math.max(wy, minY);  // 底部截平（契约 y>=0.2）
      pos.setXYZ(i, wx, wy, wz);
    }
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, M.mound));
  }

  // 丘面碎岩
  const ROCKS = [ // [x, z, 表面高, 半径]
    [ -9, -14, 13.6, 0.9], [7.5, -17, 13.6, 0.7], [-18, -27, 10.0, 1.1],
    [ 16, -24, 10.0, 0.8], [-24, -19,  7.8, 0.6], [  2, -41, 11.2, 0.8],
    [ 10,  -8,  9.6, 0.55], [-12, -6.5, 10.4, 0.7], [24, -14, 10.5, 0.75],
  ];
  for (const [x, z, sy, r] of ROCKS) {
    const geo = new THREE.IcosahedronGeometry(r, 1);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const s = 1 + 0.3 * vnoise(v.x * 5 + x, v.y * 5 + z, v.z * 5);
      pos.setXYZ(i, v.x * s, v.y * s * 0.75, v.z * s);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, M.rock);
    m.position.set(x, Math.max(sy - 0.3 * r, 0.2 + r * 0.6), z);
    m.rotation.set(rng() * 0.6, rng() * Math.PI * 2, rng() * 0.6);
    group.add(m);
  }

  /* ==========================================================
   * 2. 坡道门廊 —— 打印土层挡土墙（水平层脊，呼应 3D 打印工地）
   * ========================================================== */
  function layeredWall(len, height, thick, mat, taper = 0) {
    const g = new THREE.Group();
    const layerH = 0.5;
    const n = Math.round(height / layerH);
    for (let i = 0; i < n; i++) {
      const t = (i % 2 === 0 ? thick : thick * 0.76) + (rng() - 0.5) * 0.05; // 强化打印层脊
      const l = len - i * taper + (rng() - 0.5) * 0.12;
      const layer = new THREE.Mesh(new THREE.BoxGeometry(l, layerH * 1.04, t), mat);
      layer.position.y = (i + 0.5) * layerH + 0.011; // 层间微重叠但不下探墙基

      g.add(layer);
    }
    return g;
  }
  // 通道净宽 8m（内壁 x=±4），进深 12m，墙高 6m
  const wallL = layeredWall(12.9, 6.25, 0.8, M.print);
  wallL.rotation.y = Math.PI / 2;
  wallL.position.set(-4.4, 0.2, -6.05);
  group.add(wallL);
  const wallR = layeredWall(12.9, 6.25, 0.8, M.print);
  wallR.rotation.y = Math.PI / 2;
  wallR.position.set(4.4, 0.2, -6.05);
  group.add(wallR);
  // 八字翼墙（向外张开 ~40°，长 7m）
  const wingR = new THREE.Group();
  const wingRWall = layeredWall(7, 6, 1.05, M.print);
  wingRWall.position.x = 3.5;
  wingR.add(wingRWall);
  wingR.position.set(4.4, 0.2, 0.4);
  wingR.rotation.y = -0.7;
  group.add(wingR);
  const wingL = new THREE.Group();
  const wingLWall = layeredWall(7, 6, 1.05, M.print);
  wingLWall.position.x = 3.5;
  wingL.add(wingLWall);
  wingL.position.set(-4.4, 0.2, 0.4);
  wingL.rotation.y = Math.PI + 0.7;
  group.add(wingL);
  // 门脸头墙（洞口上方，逐层收分的批坡砌层）
  const headwall = layeredWall(15, 5, 0.8, M.print, 0.5);
  headwall.position.set(0, 6.45, -0.8);
  group.add(headwall);
  // 通道顶板 + 地坪（门口外延散水坪）
  box(10.0, 0.8, 12.9, M.printDim, 0, 6.85, -6.15);      // 顶板 y 6.45..7.25
  box(9.6, 0.25, 15.2, M.printDim, 0, 0.325, -5.0);      // 地坪 z -12.6..+2.6，顶面 y 0.45
  // 通道尽端背墙（大门嵌入其中）
  box(9.6, 7.0, 0.7, M.printDim, 0, 3.7, -12.55);

  /* ==========================================================
   * 3. 车辆气闸大门 6×5 —— 推拉双扇 + 横肋 + 中缝黄黑 + 门楣状态灯
   * ========================================================== */
  const gateCX = -0.8; // 门中心（右侧留出人员气闸位）
  box(2.98, 5, 0.22, M.doorMetal, gateCX - 1.51, 2.95, -11.9); // 左扇（y 0.45..5.45）
  box(2.98, 5, 0.22, M.doorMetal, gateCX + 1.51, 2.95, -11.9); // 右扇
  for (const side of [-1.51, 1.51]) {                          // 横向加强筋（每扇 4 道）
    for (const ry of [1.35, 2.35, 3.35, 4.35]) {
      box(2.7, 0.22, 0.1, M.doorTrim, gateCX + side, ry, -11.74);
    }
  }
  for (let i = 0; i < 10; i++) {                               // 中缝黄黑警示条纹（竖列 10 段）
    box(0.34, 0.5, 0.05, i % 2 === 0 ? M.hazardY : M.hazardK, gateCX, 0.7 + i * 0.5, -11.76);
  }
  box(6.8, 0.5, 0.3, M.doorTrim, gateCX, 5.7, -12.0);          // 门楣横带
  for (let i = 0; i < 8; i++) {                                // 状态灯：左 4 红、右 4 绿
    box(0.18, 0.18, 0.08, i < 4 ? G.ledR : G.ledG, gateCX + (i - 3.5) * 0.45, 5.7, -11.82);
  }
  box(7.4, 0.18, 0.35, M.steel, gateCX, 5.5, -11.6);           // 推拉门吊轨
  for (const hx of [-2.6, -0.4, 0.4, 2.6]) {                   // 吊挂件
    box(0.16, 0.3, 0.2, M.steel, gateCX + hx, 5.53, -11.75);
  }
  box(6.4, 0.06, 0.24, M.doorTrim, gateCX, 0.48, -11.85);      // 地面导轨

  /* ==========================================================
   * 4. 人员气闸 —— 大门右侧独立小门 1.2×2.2 + 发光舷窗
   * ========================================================== */
  const pdX = 3.25;
  box(1.5, 2.55, 0.16, M.printDim, pdX, 1.72, -11.98);          // 门框
  box(1.2, 2.2, 0.14, M.doorMetal, pdX, 1.55, -11.86);          // 门扇（y 0.45..2.65）
  const port = cyl(0.19, 0.19, 0.06, 20, G.port, pdX, 1.85, -11.78); // 舷窗（发光）
  port.rotation.x = Math.PI / 2;
  const portRim = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.035, 8, 20), M.steel);
  portRim.position.set(pdX, 1.85, -11.77);
  group.add(portRim);
  box(0.08, 0.34, 0.1, M.steel, pdX - 0.44, 1.5, -11.77);       // 门把手

  /* ==========================================================
   * 5. 门廊龙门架 —— 通道口上方门形标志架 + 发光标志板
   * ========================================================== */
  box(0.35, 7.8, 0.35, M.steel, -5.2, 4.1, 0.2);                // 左立柱
  box(0.35, 7.8, 0.35, M.steel,  5.2, 4.1, 0.2);                // 右立柱
  box(11.0, 0.4, 0.4, M.steel, 0, 7.75, 0.2);                   // 横梁
  box(0.12, 0.34, 0.1, M.steel, -2.2, 7.38, 0.3);               // 吊耳
  box(0.12, 0.34, 0.1, M.steel,  2.2, 7.38, 0.3);
  box(5.0, 0.68, 0.14, G.sign, 0, 7.05, 0.32);                  // 发光标志板（0.68m 高长条）
  box(5.2, 0.08, 0.2, M.doorTrim, 0, 7.42, 0.32);               // 板顶檐
  box(5.2, 0.08, 0.2, M.doorTrim, 0, 6.68, 0.32);               // 板底檐

  /* ==========================================================
   * 6. 通风塔组 —— 丘顶两座排风塔 + 一座进风塔（白色）
   * ========================================================== */
  function exhaustTower(x, baseY, z) {
    cyl(1.2, 1.3, 0.3, 20, M.grille, x, baseY + 0.15, z);        // 基座环
    cyl(0.75, 0.78, 4, 20, M.white, x, baseY + 2.15, z);         // 塔身 φ1.5 h4
    for (let i = 0; i < 3; i++) {                                // 百叶帽：叠环
      cyl(0.95, 0.95, 0.1, 20, M.grille, x, baseY + 3.55 + i * 0.28, z);
    }
    cyl(1.05, 1.05, 0.14, 20, M.white, x, baseY + 4.4, z);       // 顶盖
  }
  exhaustTower(-5.5, 13.9, -29);
  exhaustTower( 4.5, 13.9, -32);
  // 进风塔：方形滤箱底座 + 塔身 + 顶部进气格栅
  box(2.3, 1.5, 2.3, M.white, -0.5, 14.55, -35.5);               // 滤箱（沉入丘顶）
  for (let i = 0; i < 3; i++) {
    box(2.36, 0.12, 2.36, M.grille, -0.5, 14.15 + i * 0.45, -35.5); // 滤箱棱线
  }
  box(1.1, 3.0, 1.1, M.white, -0.5, 16.7, -35.5);                // 塔身
  box(1.5, 0.35, 1.5, M.grille, -0.5, 18.35, -35.5);             // 顶格栅
  box(1.6, 0.1, 1.6, M.white, -0.5, 18.6, -35.5);                // 顶盖板

  /* ==========================================================
   * 7. 应急出口舱盖 —— 侧坡 φ1.5 圆盖（黄边环 + 中央转轮）
   * ========================================================== */
  const hatch = new THREE.Group();
  {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.12, 24), M.printDim);
    collar.position.y = 0.06;
    hatch.add(collar);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.78, 0.22, 24), M.doorMetal);
    body.position.y = 0.2;
    hatch.add(body);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.doorMetal);
    dome.scale.y = 0.35;
    dome.position.y = 0.31;
    hatch.add(dome);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.07, 10, 24), M.hazardY); // 黄色边环
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.28;
    hatch.add(rim);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 20), M.steel);  // 中央转轮
    wheel.rotation.x = Math.PI / 2;
    wheel.position.y = 0.6;
    hatch.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 10), M.steel);
    hub.position.y = 0.56;
    hatch.add(hub);
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.05), M.steel);
      spoke.position.y = 0.6;
      spoke.rotation.y = (i * Math.PI) / 3;
      hatch.add(spoke);
    }
  }
  // 贴在右前翼丘侧坡：表面点 ≈ (24.9, 8.06, -6.7)，外法线 ≈ (0.70, 0.61, 0.36)
  const hn = new THREE.Vector3(0.70, 0.61, 0.36).normalize();
  hatch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hn);
  hatch.position.set(24.9, 8.06, -6.7).addScaledVector(hn, -0.5);
  group.add(hatch);

  /* ==========================================================
   * 8. 通信桅杆 —— 丘顶 6m 桅杆 + 小碟形天线 + 顶部信标
   * ========================================================== */
  const mastX = 8.5, mastBase = 13.6, mastZ = -27;
  cyl(0.5, 0.6, 0.5, 12, M.steel, mastX, mastBase + 0.25, mastZ);      // 基座
  cyl(0.06, 0.09, 6, 10, M.steel, mastX, mastBase + 3.5, mastZ);       // 桅杆
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), M.white);
  dish.position.set(mastX + 0.35, mastBase + 5.0, mastZ + 0.1);
  dish.rotation.set(Math.PI * 0.62, 0, -0.5);                          // 碟口斜指天际
  group.add(dish);
  cyl(0.03, 0.03, 0.5, 6, M.steel, mastX + 0.5, mastBase + 5.15, mastZ + 0.15); // 馈源杆
  box(0.14, 0.14, 0.14, G.beacon, mastX, mastBase + 6.55, mastZ);      // 桅顶红色信标

  /* ==========================================================
   * 9. 门内光带 —— 门廊两侧墙脚嵌入式暖光带（夜里门洞透暖光）
   * ========================================================== */
  box(0.22, 0.16, 11.5, G.strip, -3.86, 0.53, -6.35);
  box(0.22, 0.16, 11.5, G.strip,  3.86, 0.53, -6.35);

  /* ---------------- 贴地归一化 ----------------
   * 房规（mars/MODELS.md §4）：原点=地面点、y=0 即地表、几何贴地，
   * 埋入由 manifest 的 sink_m 负责。把整体最低点落到 y=0。 */
  const bb = new THREE.Box3().setFromObject(group);
  const dy = isFinite(bb.min.y) ? bb.min.y : 0;
  if (Math.abs(dy) > 1e-4) for (const c of group.children) c.position.y -= dy;

  /* ---------------- 10. 点光源锚点 & 夜光材质表 ---------------- */
  group.userData = {
    lights: [{ color: 0xffd9a0, pos: [0, 5 - dy, 6], range: 30 }], // 门廊内暖光
    beams: [], // 无光束，但保留数组以符合 validate_units 契约
    nightMats,
  };
  return group;
}
