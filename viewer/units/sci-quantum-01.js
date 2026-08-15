// sci-quantum-01 —— 地下城量子计算中心「玄枢」(QP-20, 20 比特超导 transmon)
// 契约(室内场景 §4b):米制;原点=厅中心地面;入口朝 +Z;引擎平地 y=0,尺寸夹取 size_m/2。
// 设计真源:E:\Claude\quantum-computing\DESIGN.md (L1 冻结 + L2 scqubits/QuTiP 12 脚本
//   + L3 HFSS 全波 9 工程 + GDS v7 版图) —— 知识卡数字全部出自该台账。
// 核心不做黑盒:稀释制冷机以「检修态」呈现——真空罐由天车吊离,300K→MXC 六级
//   镀金板吊灯、同轴走线、磁屏蔽内的 QP-20 芯片全部裸露;读出链(TWPA/隔离器/HEMT)
//   逐级可见;因果链 = 机柜(室温电子学) → 线缆桥架 → 制冷机 → 芯片 → 大屏(表面码)。
export const meta = {
  id: 'sci-quantum-01',
  name: '量子计算中心「玄枢」',
  name_en: 'Quantum Computing Center',
  kind: 'interior',
  size_m: 19.9,          // 实测包围盒最大边(validate_unit: z=19.91)
};

export function build(THREE) {
  const group = new THREE.Group();
  const M = {
    floor:  new THREE.MeshStandardMaterial({ color: 0x565b63, roughness: 0.4,  metalness: 0.08 }), // 环氧地坪
    print:  new THREE.MeshStandardMaterial({ color: 0x8d7a66, roughness: 0.92 }),                  // 打印层墙
    printDim: new THREE.MeshStandardMaterial({ color: 0x77685a, roughness: 0.95 }),
    vault:  new THREE.MeshStandardMaterial({ color: 0x6e6257, roughness: 0.9 }),
    // 金属度上限 0.5:场景无环境贴图(引擎不设 scene.environment),metalness>0.7 的
    // PBR 金属没有可反射的环境 → 只剩镜面高光,室内一律发黑。六级镀金板另加暗琥珀
    // 自发光托底,保证"金色吊灯"这一识别特征在暗厅里不被压死。
    steel:  new THREE.MeshStandardMaterial({ color: 0xa8b0b6, roughness: 0.5,  metalness: 0.45 }),
    frame:  new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.55, metalness: 0.5 }),  // 支架深钢
    gold:   new THREE.MeshStandardMaterial({ color: 0xe0b356, roughness: 0.42, metalness: 0.3,
      emissive: 0x3d2c0b, emissiveIntensity: 0.85 }),                                              // 镀金板
    copper: new THREE.MeshStandardMaterial({ color: 0xc07446, roughness: 0.45, metalness: 0.4 }),
    mu:     new THREE.MeshStandardMaterial({ color: 0x545963, roughness: 0.45, metalness: 0.4, side: THREE.DoubleSide }), // 磁屏蔽
    can:    new THREE.MeshStandardMaterial({ color: 0xc3c9ce, roughness: 0.38, metalness: 0.45, side: THREE.DoubleSide }), // 真空罐
    rack:   new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.6,  metalness: 0.3 }),
    panel:  new THREE.MeshStandardMaterial({ color: 0x21242a, roughness: 0.5,  metalness: 0.2 }),
    white:  new THREE.MeshStandardMaterial({ color: 0xd8dde0, roughness: 0.6 }),
    hazardY: new THREE.MeshStandardMaterial({ color: 0xc7a03c, roughness: 0.7 }),
    hazardK: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
    rail:   new THREE.MeshStandardMaterial({ color: 0xc06a28, roughness: 0.6 }),                   // 安全橙
    glass:  new THREE.MeshStandardMaterial({ color: 0x9fc8d8, roughness: 0.1, metalness: 0.1,
      transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
    die:    new THREE.MeshStandardMaterial({ color: 0x1d2b33, roughness: 0.35, metalness: 0.4 }),  // 芯片衬底
    bottle: new THREE.MeshStandardMaterial({ color: 0x5f7c6a, roughness: 0.5, metalness: 0.4 }),
  };
  const G = {
    lamp:   new THREE.MeshStandardMaterial({ color: 0x2a2c22, emissive: 0xfff2d8, emissiveIntensity: 2.2 }),
    teal:   new THREE.MeshStandardMaterial({ color: 0x0a2a30, emissive: 0x4fd8e8, emissiveIntensity: 2.0 }),
    ledG:   new THREE.MeshStandardMaterial({ color: 0x11220f, emissive: 0x4fe86a, emissiveIntensity: 2.2 }),
    ledA:   new THREE.MeshStandardMaterial({ color: 0x2a1c08, emissive: 0xffb050, emissiveIntensity: 2.0 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x060a0e, emissive: 0x0d1a22, emissiveIntensity: 1.4 }),
    qData:  new THREE.MeshStandardMaterial({ color: 0x1a1608, emissive: 0xe8c25a, emissiveIntensity: 1.8 }), // 数据比特
    qAncX:  new THREE.MeshStandardMaterial({ color: 0x08202a, emissive: 0x4fd8e8, emissiveIntensity: 1.8 }), // X 稳定子
    qAncZ:  new THREE.MeshStandardMaterial({ color: 0x1a0a24, emissive: 0xb06ae8, emissiveIntensity: 1.8 }), // Z 稳定子
    qErr:   new THREE.MeshStandardMaterial({ color: 0x2a0808, emissive: 0xff4030, emissiveIntensity: 2.2 }), // 误差链
    sign:   new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0 }),
    chip:   new THREE.MeshStandardMaterial({ color: 0x0a1a10, emissive: 0x3fe8c0, emissiveIntensity: 1.6 }), // 芯片微光
  };

  function box(w, h, d, mat, x, y, z, rx = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (rz) m.rotation.z = rz;
    group.add(m);
    return m;
  }
  function cyl(r1, r2, h, mat, x, y, z, seg = 14, open = false, parent = group) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg, 1, open), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function poi(id, x, y, z) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(x, y, z);
    group.add(a);
  }
  // 确定性 rnd(打印墙层错缝用)
  let seed = 42;
  const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* ==========================================================
   * 1. 洞室壳体:净 18 × 18,打印层墙 h5 + 折面拱顶(净高 ~7)
   *    x ∈ [-9,9], z ∈ [-10,8],入口门在 +Z 墙中央
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
  box(18.9, 0.3, 18.9, M.floor, 0, -0.14, -1);          // 地坪(顶面 y≈0.01)
  const wallL = layeredWall(18.4, 5, 0.7, M.print);      // 左墙 x=-9.3
  wallL.rotation.y = Math.PI / 2;
  wallL.position.set(-9.3, 0, -1);
  group.add(wallL);
  const wallR = layeredWall(18.4, 5, 0.7, M.print);      // 右墙 x=+9.3
  wallR.rotation.y = Math.PI / 2;
  wallR.position.set(9.3, 0, -1);
  group.add(wallR);
  const wallB = layeredWall(19.2, 5, 0.7, M.print);      // 尾墙 z=-10.3
  wallB.position.set(0, 0, -10.3);
  group.add(wallB);
  // 前墙(z=+8.3):门洞两侧 + 门楣上
  const wallF1 = layeredWall(7.2, 5, 0.7, M.print);
  wallF1.position.set(-5.6, 0, 8.3);
  group.add(wallF1);
  const wallF2 = layeredWall(7.2, 5, 0.7, M.print);
  wallF2.position.set(5.6, 0, 8.3);
  group.add(wallF2);
  box(4.2, 2.2, 0.7, M.printDim, 0, 3.9, 8.3);           // 门楣
  // 折面拱顶
  box(7.0, 0.35, 19.3, M.vault, -6.1, 5.9, -1,  0, 0.5);
  box(7.0, 0.35, 19.3, M.vault,  6.1, 5.9, -1,  0, -0.5);
  box(7.4, 0.35, 19.3, M.vault,  0, 7.45, -1);
  // 顶灯带 ×3
  for (const lz of [-7, -1, 5]) {
    box(5.6, 0.12, 0.35, G.lamp, 0, 7.2, lz);
    box(6.0, 0.08, 0.5, M.steel, 0, 7.28, lz);
  }

  /* ==========================================================
   * 2. 入口门组(+Z 墙中央,双扇滑门,通玄关)+ 地表电梯龛(+Z 墙右)
   * ========================================================== */
  box(0.3, 3.0, 0.24, M.frame, -2.15, 1.5, 8.0);         // 门套立柱
  box(0.3, 3.0, 0.24, M.frame,  2.15, 1.5, 8.0);
  box(4.6, 0.3, 0.24, M.frame, 0, 3.0, 8.0);             // 门套横梁
  box(1.9, 2.75, 0.14, M.steel, -1.0, 1.38, 8.06);       // 双扇滑门
  box(1.9, 2.75, 0.14, M.steel,  1.0, 1.38, 8.06);
  box(2.6, 0.5, 0.12, G.sign, 0, 3.55, 8.05);            // 发光门牌「玄枢」
  box(0.9, 0.06, 0.06, G.teal, 0, 2.86, 7.95);           // 门楣状态灯
  for (let i = 0; i < 5; i++) {                          // 门前警示垫
    box(0.6, 0.02, 1.4, i % 2 === 0 ? M.hazardY : M.hazardK, -1.5 + i * 0.62, 0.03, 6.9);
  }
  // 地表电梯龛(exitZone 落点):门套 + 双扇钢门 + 「↑ 地表」发光牌
  box(0.16, 2.7, 2.4, M.frame, 6.2, 1.35, 8.05);
  box(1.0, 2.3, 0.08, M.steel, 5.7, 1.15, 8.12);
  box(1.0, 2.3, 0.08, M.steel, 6.7, 1.15, 8.12);
  box(1.7, 0.35, 0.07, G.sign, 6.2, 2.95, 8.1);
  for (let i = 0; i < 4; i++) {
    box(0.85, 0.02, 0.4, i % 2 === 0 ? M.hazardY : M.hazardK, 6.2, 0.03, 7.3 + i * 0.0 - i * 0.42);
  }

  /* ==========================================================
   * 3. 稀释制冷机(检修态)——核心装置,中央偏左 (-3.2, -2.5)
   *    龙门吊架 + 真空罐吊离 + 六级镀金板吊灯全裸露
   * ========================================================== */
  const FX = -3.2, FZ = -2.5;
  // 3a. 龙门吊架:4 柱 + 顶框 + 工字横轨 + 吊车小车
  for (const [cx, cz] of [[-2.1, -1.7], [2.9, -1.7], [-2.1, 1.7], [2.9, 1.7]]) {
    box(0.16, 5.6, 0.16, M.frame, FX + cx, 2.8, FZ + cz);
    box(0.36, 0.06, 0.36, M.frame, FX + cx, 0.05, FZ + cz);   // 柱脚板
  }
  box(5.4, 0.2, 0.16, M.frame, FX + 0.4, 5.62, FZ - 1.7);
  box(5.4, 0.2, 0.16, M.frame, FX + 0.4, 5.62, FZ + 1.7);
  box(0.16, 0.2, 3.6, M.frame, FX - 2.1, 5.62, FZ);
  box(0.16, 0.2, 3.6, M.frame, FX + 2.9, 5.62, FZ);
  box(5.2, 0.12, 0.3, M.steel, FX + 0.4, 5.45, FZ);            // 工字横轨
  box(0.5, 0.28, 0.42, M.rail, FX + 2.0, 5.28, FZ);            // 吊车小车(安全橙)
  // 3b. 真空罐(吊离态,悬在制冷机东侧):吊链 + 开底圆罐
  cyl(0.012, 0.012, 1.15, M.steel, FX + 2.0, 4.6, FZ, 6);      // 吊链(简化为杆)
  const can = cyl(0.78, 0.78, 3.0, M.can, FX + 2.0, 2.5, FZ, 22, true);
  can.geometry = can.geometry;                                  // 侧壁开底
  cyl(0.8, 0.8, 0.1, M.can, FX + 2.0, 4.02, FZ, 22);           // 罐顶盖
  cyl(0.84, 0.84, 0.12, M.steel, FX + 2.0, 1.02, FZ, 22);      // 罐底法兰圈
  // 3c. 制冷机塔本体(挂在吊架下,底部离地——板级吊灯)
  const plates = [
    { y: 4.55, r: 0.66, t: 0.07, m: M.steel  },   // 300K 顶法兰
    { y: 3.95, r: 0.62, t: 0.05, m: M.gold   },   // 50K
    { y: 3.35, r: 0.58, t: 0.05, m: M.gold   },   // 4K
    { y: 2.80, r: 0.52, t: 0.04, m: M.gold   },   // Still 0.8K
    { y: 2.35, r: 0.47, t: 0.04, m: M.gold   },   // CP 0.1K
    { y: 1.95, r: 0.42, t: 0.04, m: M.gold   },   // MXC 20mK
  ];
  for (const p of plates) cyl(p.r, p.r, p.t, p.m, FX, p.y, FZ, 24);
  for (let i = 0; i < plates.length - 1; i++) {                 // 级间支撑杆 ×3
    const a = plates[i], b = plates[i + 1];
    for (let k = 0; k < 3; k++) {
      const th = (k / 3) * Math.PI * 2 + 0.5;
      const rr = b.r * 0.82;
      cyl(0.022, 0.022, a.y - b.y, M.steel,
        FX + Math.cos(th) * rr, (a.y + b.y) / 2, FZ + Math.sin(th) * rr, 8);
    }
  }
  // 吊架悬挂横担 → 顶法兰
  box(1.6, 0.1, 0.12, M.frame, FX, 5.0, FZ - 0.5);
  box(1.6, 0.1, 0.12, M.frame, FX, 5.0, FZ + 0.5);
  for (const sz of [-0.5, 0.5]) cyl(0.03, 0.03, 0.42, M.steel, FX, 4.8, FZ + sz, 8);
  // 3d. 脉管冷头(顶法兰上)+ 氦软管弯向左墙压缩机
  cyl(0.12, 0.12, 0.55, M.steel, FX - 0.25, 4.9, FZ + 0.1, 12);
  cyl(0.08, 0.08, 0.45, M.steel, FX + 0.15, 4.85, FZ - 0.15, 10);
  const hose1 = cyl(0.045, 0.045, 3.6, M.frame, FX - 1.9, 5.4, FZ + 0.1, 8);
  hose1.rotation.z = 1.12;
  const hose2 = cyl(0.045, 0.045, 3.4, M.frame, FX - 1.85, 5.25, FZ - 0.35, 8);
  hose2.rotation.z = 1.2;
  // 3e. 同轴走线束:入线 12 根(300K→MXC 周向阵列)+ 4K 以下半刚铜线 6 根
  for (let k = 0; k < 12; k++) {
    const th = (k / 12) * Math.PI * 2 + 0.13;
    const rr = 0.30;
    cyl(0.016, 0.016, 2.72, M.steel,
      FX + Math.cos(th) * rr, 3.19, FZ + Math.sin(th) * rr, 6);
  }
  for (let k = 0; k < 6; k++) {
    const th = (k / 6) * Math.PI * 2 + 0.6;
    const rr = 0.2;
    cyl(0.013, 0.013, 1.4, M.copper,
      FX + Math.cos(th) * rr, 2.62, FZ + Math.sin(th) * rr, 6);
  }
  // 3f. 读出链硬件:MXC 下 TWPA(铜圆筒)+ 双隔离器(黑盒)+ 4K HEMT(金盒)
  cyl(0.06, 0.06, 0.3, M.copper, FX - 0.22, 1.72, FZ + 0.12, 10);   // TWPA
  box(0.14, 0.1, 0.1, M.panel, FX + 0.1, 1.74, FZ + 0.22);          // 隔离器 ×2
  box(0.14, 0.1, 0.1, M.panel, FX + 0.26, 1.74, FZ + 0.1);
  box(0.16, 0.12, 0.12, M.gold, FX + 0.2, 3.22, FZ - 0.28);         // 4K HEMT
  // 3g. 磁屏蔽(开口朝 +Z 的半开圆筒)+ 冷指 + QP-20 芯片封装
  const shieldGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.55, 20, 1, true, Math.PI * 0.62, Math.PI * 1.76);
  const shield = new THREE.Mesh(shieldGeo, M.mu);
  shield.position.set(FX, 1.55, FZ);
  group.add(shield);
  cyl(0.32, 0.32, 0.03, M.mu, FX, 1.85, FZ, 20);                    // 屏蔽顶盖
  box(0.05, 0.32, 0.05, M.copper, FX, 1.72, FZ);                    // 冷指
  box(0.2, 0.035, 0.16, M.gold, FX, 1.52, FZ);                      // 样品盒(金)
  box(0.11, 0.012, 0.09, G.chip, FX, 1.55, FZ);                     // QP-20 芯片(微光,11×9 mm 按比例)
  // 3h. 底部围栏(安全橙,开口朝 +Z)+ 地面警示方框
  for (const [rx, rz, rl, vert] of [[-1.6, 0, 3.0, 0], [1.6, 0, 3.0, 0], [0, -1.5, 3.2, 1]]) {
    if (vert) box(rl, 0.06, 0.06, M.rail, FX + rx, 1.0, FZ + rz);
    else box(0.06, 0.06, rl, M.rail, FX + rx, 1.0, FZ + rz);
  }
  for (const [px, pz] of [[-1.6, -1.5], [1.6, -1.5], [-1.6, 1.5], [1.6, 1.5]]) {
    box(0.07, 1.0, 0.07, M.rail, FX + px, 0.5, FZ + pz);
  }
  box(3.6, 0.02, 0.14, M.hazardY, FX, 0.03, FZ - 1.85);
  box(3.6, 0.02, 0.14, M.hazardY, FX, 0.03, FZ + 1.85);
  box(0.14, 0.02, 3.6, M.hazardY, FX - 1.85, 0.03, FZ);
  box(0.14, 0.02, 3.6, M.hazardY, FX + 1.85, 0.03, FZ);
  poi('fridge', FX - 0.8, 3.3, FZ + 0.8);
  poi('chip', FX, 1.55, FZ + 0.5);
  poi('readout', FX - 0.3, 1.75, FZ + 0.4);

  /* ==========================================================
   * 4. RFSoC 控制机柜 ×5(右墙)+ 线缆桥架 → 制冷机
   * ========================================================== */
  const rackLeds = [];                       // animate 里做流水灯
  for (let i = 0; i < 5; i++) {
    const rz = -6 + i * 2.0;
    box(0.72, 2.1, 0.88, M.rack, 8.1, 1.05, rz);
    box(0.66, 2.0, 0.04, M.panel, 7.64, 1.05, rz);               // 前面板
    for (let s = 0; s < 6; s++) {                                 // 槽位压条
      box(0.6, 0.03, 0.02, M.steel, 7.61, 0.35 + s * 0.3, rz);
    }
    for (let s = 0; s < 4; s++) {                                 // 状态灯(流水)
      const led = box(0.05, 0.05, 0.02, G.ledG.clone(), 7.6, 0.5 + s * 0.42, rz - 0.22);
      rackLeds.push(led.material);
    }
    box(0.05, 0.05, 0.02, G.ledA, 7.6, 1.9, rz - 0.22);           // 顶部常亮琥珀
    cyl(0.05, 0.05, 1.0, M.frame, 8.0, 2.65, rz, 8);              // 出柜线缆束
  }
  // 桥架:机柜顶 → 制冷机吊架(y3.2 高度横跨)
  box(0.5, 0.08, 10.2, M.steel, 7.9, 3.2, -2.0);
  const bridge = box(10.6, 0.08, 0.5, M.steel, 2.2, 3.2, FZ + 0.0);
  bridge.rotation.y = 0.05;
  for (let k = 0; k < 3; k++) {                                   // 桥架吊杆
    cyl(0.03, 0.03, 2.2, M.frame, 6.5 - k * 3.4, 4.3, FZ, 8);
  }
  poi('racks', 7.3, 1.4, -2);

  /* ==========================================================
   * 5. 芯片展示台(旋转)——QP-20 版图放大模型,x=3.2,z=-6
   * ========================================================== */
  cyl(0.42, 0.5, 0.9, M.frame, 3.2, 0.45, -6, 18);                // 台座
  cyl(0.46, 0.46, 0.04, M.steel, 3.2, 0.92, -6, 18);
  const diePivot = new THREE.Group();                             // 旋转关节
  diePivot.position.set(3.2, 1.35, -6);
  group.add(diePivot);
  const dieSlab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.9), M.die);
  diePivot.add(dieSlab);
  // 20 比特(4×5 金十字)+ 31 耦合器(短棒)+ 周边键合盘
  for (let ix = 0; ix < 5; ix++) {
    for (let iz = 0; iz < 4; iz++) {
      const qx = -0.4 + ix * 0.2, qz = -0.27 + iz * 0.18;
      const q = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.022), M.gold);
      q.position.set(qx, 0.035, qz);
      diePivot.add(q);
      const q2 = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.02, 0.07), M.gold);
      q2.position.set(qx, 0.035, qz);
      diePivot.add(q2);
      if (ix < 4) {                                               // 横向耦合器
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.016, 0.014), M.copper);
        c.position.set(qx + 0.1, 0.032, qz);
        diePivot.add(c);
      }
      if (iz < 3) {                                               // 纵向耦合器
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.016, 0.08), M.copper);
        c.position.set(qx, 0.032, qz + 0.09);
        diePivot.add(c);
      }
    }
  }
  for (let k = 0; k < 20; k++) {                                  // 键合盘(两长边)
    const px = -0.48 + (k % 10) * 0.106;
    const pz = k < 10 ? -0.41 : 0.41;
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.014, 0.035), M.steel);
    p.position.set(px, 0.03, pz);
    diePivot.add(p);
  }
  const case1 = cyl(0.62, 0.62, 1.0, M.glass, 3.2, 1.45, -6, 20, true);  // 玻璃罩
  cyl(0.64, 0.64, 0.04, M.steel, 3.2, 1.97, -6, 20);
  poi('die', 3.2, 1.35, -6);

  /* ==========================================================
   * 6. 表面码大屏(尾墙)—— d=3 旋转表面码格点 + 误差链
   * ========================================================== */
  box(6.2, 3.2, 0.12, M.panel, 0, 2.7, -9.8);                     // 屏框
  box(5.9, 2.9, 0.06, G.screen, 0, 2.7, -9.72);                   // 底屏
  // 5×5 交错格点:数据比特(金) / X 稳定子(青) / Z 稳定子(紫),右下 2 格误差链(红)
  for (let ix = 0; ix < 5; ix++) {
    for (let iy = 0; iy < 5; iy++) {
      if ((ix + iy) % 2 === 0 && (ix % 2 === 1 || iy % 2 === 1)) continue; // 缺角
      let mat;
      if (ix % 2 === 0 && iy % 2 === 0) mat = G.qData;
      else if ((ix + iy) % 2 === 1) mat = (ix % 2 === 1) ? G.qAncX : G.qAncZ;
      else continue;
      if (ix === 3 && iy === 1) mat = G.qErr;                     // 误差链高亮
      if (ix === 4 && iy === 2) mat = G.qErr;
      box(0.34, 0.34, 0.03, mat, -1.9 + ix * 0.62, 1.75 + iy * 0.55, -9.68);
    }
  }
  box(1.9, 2.4, 0.05, G.teal, 2.55, 2.6, -9.7);                   // 侧栏:量子体积柱状(简化)
  for (let k = 0; k < 5; k++) {
    box(1.4 - k * 0.22, 0.16, 0.04, G.qData, 2.4, 1.7 + k * 0.42, -9.66);
  }
  poi('screen', 0, 2.4, -9.2);

  /* ==========================================================
   * 7. 气体处理面板 + 氦瓶组 + 压缩机撬块(左墙)
   * ========================================================== */
  box(0.14, 1.7, 2.6, M.white, -8.85, 1.7, -4);                   // GHS 面板
  for (let k = 0; k < 5; k++) {                                   // 阀组 + 手轮
    const vz = -5.0 + k * 0.5;
    cyl(0.05, 0.05, 0.12, M.steel, -8.74, 1.4, vz, 10);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 6, 14), M.rail);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(-8.66, 1.4, vz);
    group.add(wheel);
    cyl(0.02, 0.02, 0.9, M.steel, -8.78, 2.2, vz, 6);             // 面板上行管
  }
  box(0.1, 0.5, 1.8, G.teal, -8.84, 2.75, -4);                    // 面板状态屏
  for (let k = 0; k < 3; k++) {                                   // 氦瓶 ×3 + 链
    cyl(0.17, 0.17, 1.6, M.bottle, -8.6, 0.8, -1.4 + k * 0.5, 14);
    cyl(0.06, 0.06, 0.2, M.steel, -8.6, 1.7, -1.4 + k * 0.5, 8);
  }
  box(0.06, 0.06, 1.3, M.steel, -8.62, 1.15, -0.9);
  // 压缩机撬块 + 风扇(spinner)+ 软管上墙
  box(1.5, 1.05, 1.0, M.frame, -8.2, 0.55, 2.6);
  box(1.55, 0.08, 1.05, M.rail, -8.2, 0.06, 2.6);                 // 撬块底座
  const fanPivot = new THREE.Group();
  fanPivot.position.set(-7.42, 0.62, 2.6);
  fanPivot.rotation.z = Math.PI / 2;
  group.add(fanPivot);
  for (let k = 0; k < 5; k++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.3), M.steel);
    blade.rotation.y = (k / 5) * Math.PI * 2;
    blade.position.y = 0;
    const arm = new THREE.Group();
    arm.rotation.y = (k / 5) * Math.PI * 2;
    blade.position.set(0, 0, 0.16);
    blade.rotation.y = 0;
    arm.add(blade);
    fanPivot.add(arm);
  }
  cyl(0.3, 0.3, 0.04, M.panel, -7.44, 0.62, 2.6, 16).rotation.z = Math.PI / 2;
  cyl(0.045, 0.045, 2.8, M.frame, -8.3, 2.5, 2.6, 8);             // 软管上行(接吊架软管)
  poi('ghs', -8.2, 1.4, -2);

  /* ==========================================================
   * 8. 操作台 ×2(入口右前)+ 杂物
   * ========================================================== */
  for (const [dx, dz, ry] of [[4.4, 4.6, -0.5], [6.2, 3.2, -0.9]]) {
    const desk = new THREE.Group();
    desk.position.set(dx, 0, dz);
    desk.rotation.y = ry;
    group.add(desk);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.8), M.white);
    top.position.y = 0.78;
    desk.add(top);
    for (const [lx, lz] of [[-0.75, -0.3], [0.75, -0.3], [-0.75, 0.3], [0.75, 0.3]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.06), M.frame);
      leg.position.set(lx, 0.39, lz);
      desk.add(leg);
    }
    const mon = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.04), G.teal);
    mon.position.set(0, 1.25, -0.25);
    mon.rotation.x = -0.12;
    desk.add(mon);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), M.frame);
    stand.position.set(0, 0.98, -0.28);
    desk.add(stand);
  }
  // 地面走线槽:机柜排 → 制冷机
  box(0.5, 0.05, 0.02, M.hazardY, 2.2, 0.04, -2.5);
  box(9.4, 0.04, 0.36, M.steel, 2.6, 0.02, -2.5);

  /* ==========================================================
   * 9. 声明:灯光 / 动画 / 出入口
   * ========================================================== */
  group.userData.lights = [
    { color: 0xeaf2ff, pos: [-4.5, 6.4, -5], range: 22 },
    { color: 0xeaf2ff, pos: [ 4.5, 6.4, -5], range: 22 },
    { color: 0xeaf2ff, pos: [ 0,   6.4,  4], range: 22 },
    { color: 0xffd8a4, pos: [FX, 3.2, FZ + 1.3], range: 11 },  // 制冷机暖光键光(冷青光会把镀金板洗成灰蓝)
    { color: 0x66d6e6, pos: [FX - 0.2, 1.5, FZ + 1.0], range: 5 }, // 冷色补光只留在 MXC/芯片段
    { color: 0xdfe8ee, pos: [6.8, 4.6, -2], range: 13 },       // 机柜排工作灯
  ];
  group.userData.spinners = [
    { node: diePivot, axis: 'y', rpm: 1.2 },       // 芯片展示台慢转
    { node: fanPivot, axis: 'y', rpm: 55 },        // 压缩机风扇
  ];
  // 机柜流水灯 + 芯片微光呼吸(读出脉冲意象)
  group.userData.animate = (t) => {
    for (let i = 0; i < rackLeds.length; i++) {
      const phase = (t * 2.2 + i * 0.37) % (rackLeds.length * 0.09);
      rackLeds[i].emissiveIntensity = 0.6 + (Math.sin(t * 2.2 + i * 0.9) > 0.3 ? 1.8 : 0);
    }
    G.chip.emissiveIntensity = 1.2 + 0.8 * Math.max(0, Math.sin(t * 1.4));
    G.qErr.emissiveIntensity = 1.6 + 0.9 * Math.sin(t * 3.1);
  };
  group.userData.entry = { pos: [0, 0, 6.4], yaw: 0 };
  group.userData.exitZone = { pos: [6.2, 7.4], radius: 1.2 };    // 地表电梯龛
  return group;
}
