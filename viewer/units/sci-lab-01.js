// sci-lab-01 —— 地下城分析测试中心（全城仪器共享平台）
// 契约（内部场景变体，MODELS.md §4b）：米制；原点 = 地面中心（引擎按
//   ±size_m/2 以原点为中心夹取行走范围——入口原点+深房间会让后区不可达，
//   故与 sci-cryoem-01/ops-fab-01 同口径取地面中心）；门开口朝 +Z（z=+11
//   端墙），房间向 -Z 延伸至 z=-11；y >= 0（室内地面 y=0）；<=5 万面。
// 布局：前区收样台+标物柜；中区六台仪器各占一隔间（左：GC-MS/拉曼/水质线，
//   右：ICP-OES/XRD/SEM）；后区气瓶间（H2 红/Ar 深绿，EN 1089-3 色标）+
//   真空泵间（穿舱真空管线 = 「行星当前级泵」的几何回答）。
// 账本源：E:\Claude\mars-analytic\sim\lab_ledgers.py（17 闸全绿）。
// userData.nightMats = 常亮发光；blinkMats = XRD X-RAY ON / 穿舱 VENT 灯；
// spinners = GC 自动进样转盘。

export const meta = {
  id: 'sci-lab-01',
  name: '分析测试中心',
  name_en: 'Analytical Test Center',
  size_m: 23,            // 引擎室内夹取半径口径 = 实测最大边（纵深 22.7）
  size_axis: 'depth',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [], blinkMats = [];

  /* ---------------- 材质 ---------------- */
  const M = {
    wall:    new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.85 }),
    wallLow: new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93 }), // 打印土层裙脚
    floor:   new THREE.MeshStandardMaterial({ color: 0xcfd4d6, roughness: 0.35, metalness: 0.05 }),
    floorLn: new THREE.MeshStandardMaterial({ color: 0x3f6fae, roughness: 0.4 }),  // 送样动线蓝条
    ceil:    new THREE.MeshStandardMaterial({ color: 0xdedcd6, roughness: 0.9 }),
    trim:    new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.5, metalness: 0.4 }),
    steel:   new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.7 }),
    dark:    new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.4 }),
    bench:   new THREE.MeshStandardMaterial({ color: 0xd8dadd, roughness: 0.55 }),
    benchTop:new THREE.MeshStandardMaterial({ color: 0x30343a, roughness: 0.3, metalness: 0.2 }), // 环氧台面
    shellW:  new THREE.MeshStandardMaterial({ color: 0xe6e8ec, roughness: 0.3, metalness: 0.05 }), // 仪器白壳
    shellG:  new THREE.MeshStandardMaterial({ color: 0xc9cdd3, roughness: 0.4, metalness: 0.1 }),
    glass:   new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.12, metalness: 0.2 }),
    winGlass:new THREE.MeshStandardMaterial({ color: 0xbfd8d8, roughness: 0.1, transparent: true, opacity: 0.3 }),
    granite: new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.7 }),  // SEM 惯性块
    orange:  new THREE.MeshStandardMaterial({ color: 0xd97a1e, roughness: 0.55 }), // 隔振/安全橙
    yellow:  new THREE.MeshStandardMaterial({ color: 0xd9b021, roughness: 0.6 }),
    red:     new THREE.MeshStandardMaterial({ color: 0xb03024, roughness: 0.55 }), // H2 色标
    greenAr: new THREE.MeshStandardMaterial({ color: 0x1e5c38, roughness: 0.55 }), // Ar 深绿(EN 1089-3)
    blue:    new THREE.MeshStandardMaterial({ color: 0x2b5fa8, roughness: 0.55 }), // 水质线蓝
    pipe:    new THREE.MeshStandardMaterial({ color: 0x7d838a, roughness: 0.45, metalness: 0.6 }),
    copper:  new THREE.MeshStandardMaterial({ color: 0xa9663a, roughness: 0.4, metalness: 0.7 }),
  };
  const G = {  // 发光 → nightMats
    panel: new THREE.MeshStandardMaterial({ color: 0x2a2a24, emissive: 0xfff4d8, emissiveIntensity: 1.6, roughness: 0.7 }),
    scr:   new THREE.MeshStandardMaterial({ color: 0x081018, emissive: 0x4aa6ff, emissiveIntensity: 1.7, roughness: 0.5 }),
    scrGn: new THREE.MeshStandardMaterial({ color: 0x0a1410, emissive: 0x38d878, emissiveIntensity: 1.5, roughness: 0.5 }),
    board: new THREE.MeshStandardMaterial({ color: 0x181104, emissive: 0xffb030, emissiveIntensity: 1.6, roughness: 0.5 }), // 排队看板琥珀
    torch: new THREE.MeshStandardMaterial({ color: 0x14082a, emissive: 0x8a5cff, emissiveIntensity: 2.8, roughness: 0.4 }), // ICP 炬管蓝紫
    laser: new THREE.MeshStandardMaterial({ color: 0x041808, emissive: 0x35e05a, emissiveIntensity: 2.2, roughness: 0.4 }), // 拉曼绿光路
    lampG: new THREE.MeshStandardMaterial({ color: 0x03180a, emissive: 0x30e060, emissiveIntensity: 1.8, roughness: 0.5 }), // 运行绿灯
    exit:  new THREE.MeshStandardMaterial({ color: 0x04180a, emissive: 0x30e060, emissiveIntensity: 1.8, roughness: 0.5 }),
    plaque:new THREE.MeshStandardMaterial({ color: 0x0a1a1c, emissive: 0x25d8e6, emissiveIntensity: 1.2, roughness: 0.5 }),
  };
  for (const k in G) nightMats.push(G[k]);
  const B = {  // 闪烁 → blinkMats（引擎接管 ~0.8s 红闪）
    xray: new THREE.MeshStandardMaterial({ color: 0x200404, emissive: 0xff3020, emissiveIntensity: 1.5, roughness: 0.5 }),
    vent: new THREE.MeshStandardMaterial({ color: 0x200404, emissive: 0xff3020, emissiveIntensity: 1.5, roughness: 0.5 }),
  };
  blinkMats.push(B.xray, B.vent);

  /* ---------------- 工具 ---------------- */
  function box(parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    parent.add(m); return m;
  }
  function cyl(parent, rt, rb, h, seg, mat, x, y, z, axis = 'Y') {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    if (axis === 'Z') m.rotation.x = Math.PI / 2;
    else if (axis === 'X') m.rotation.z = Math.PI / 2;
    parent.add(m); return m;
  }
  function torus(parent, R, r, arc, mat, x, y, z, rx = 0, ry = 0, rz = 0, seg = 32) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 10, seg, arc), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    parent.add(m); return m;
  }
  function poi(parent, name, x, y, z) {
    const a = new THREE.Object3D(); a.name = 'poi_' + name; a.position.set(x, y, z);
    parent.add(a); return a;
  }
  // 实验椅：圆盘座 + 立柱 + 五爪略 + 靠背
  function chair(parent, x, z, ry = 0) {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry;
    cyl(c, 0.17, 0.17, 0.04, 12, M.dark, 0, 0.5, 0);
    cyl(c, 0.03, 0.03, 0.5, 8, M.steel, 0, 0.26, 0);
    cyl(c, 0.16, 0.2, 0.04, 10, M.dark, 0, 0.02, 0);
    box(c, 0.32, 0.36, 0.04, M.dark, 0, 0.78, -0.17);
    parent.add(c); return c;
  }

  /* ==========================================================
   * A. 房间外壳 16 × 22 × 3.4，门洞 +Z 居中（宽 2.6 高 2.4）
   * ========================================================== */
  const RW = 16, RD = 22, RH = 3.4, T = 0.3;
  const xL = -RW / 2, xR = RW / 2, zBack = -RD;
  box(group, RW + 2 * T, 0.1, RD + T, M.floor, 0, -0.05, -RD / 2 + 0.15);
  box(group, RW + 2 * T, 0.2, RD + T, M.ceil, 0, RH + 0.1, -RD / 2 + 0.15);
  // 送样动线蓝条（收样台 → 中央走道）
  box(group, 0.5, 0.012, 15.5, M.floorLn, 0, 0.006, -8.5);
  function skirt(x, z, w, d) { box(group, w, 0.5, d, M.wallLow, x, 0.25, z); }
  box(group, T, RH, RD, M.wall, xL - T / 2, RH / 2, -RD / 2); skirt(xL - T / 2, -RD / 2, T, RD);
  box(group, T, RH, RD, M.wall, xR + T / 2, RH / 2, -RD / 2); skirt(xR + T / 2, -RD / 2, T, RD);
  box(group, RW + 2 * T, RH, T, M.wall, 0, RH / 2, zBack - T / 2); skirt(0, zBack - T / 2, RW, T);
  const doorW = 2.6, doorH = 2.4;
  box(group, (RW - doorW) / 2, RH, T, M.wall, -(doorW / 2 + (RW - doorW) / 4), RH / 2, 0.3 - T / 2);
  box(group, (RW - doorW) / 2, RH, T, M.wall, (doorW / 2 + (RW - doorW) / 4), RH / 2, 0.3 - T / 2);
  box(group, doorW, RH - doorH, T, M.wall, 0, doorH + (RH - doorH) / 2, 0.3 - T / 2);
  box(group, doorW + 0.3, 0.16, 0.16, M.trim, 0, doorH + 0.08, 0.3);
  box(group, 0.5, 0.28, 0.06, G.exit, 0, doorH + 0.35, 0.28);
  // 门侧铭牌「分析测试中心」
  box(group, 0.9, 0.24, 0.04, G.plaque, doorW / 2 + 1.0, 1.9, 0.3);

  /* ==========================================================
   * B. 前区：收样台 + 排队看板 + 样品柜 + 标物柜
   * ========================================================== */
  // 收样台（右侧 L 形柜台）
  box(group, 2.6, 0.95, 0.55, M.bench, 3.4, 0.475, -2.2);
  box(group, 2.8, 0.06, 0.7, M.benchTop, 3.4, 0.99, -2.2);
  box(group, 0.55, 0.95, 1.6, M.bench, 4.9, 0.475, -3.3);
  box(group, 0.7, 0.06, 1.8, M.benchTop, 4.9, 0.99, -3.3);
  box(group, 0.4, 0.26, 0.03, G.scrGn, 3.0, 1.35, -2.45);          // 台上登记屏
  cyl(group, 0.05, 0.05, 0.32, 8, M.steel, 3.0, 1.15, -2.4);
  // 排队看板（右墙，琥珀大屏：六台仪器 × 排队深度）
  box(group, 0.08, 1.1, 2.4, M.dark, xR - 0.06, 1.9, -2.6);
  box(group, 0.04, 0.95, 2.2, G.board, xR - 0.11, 1.9, -2.6);
  poi(group, 'intake', 3.6, 1.4, -2.4);
  // 样品柜（左墙格口柜：4×6 格）
  box(group, 0.5, 2.0, 3.0, M.bench, xL + 0.3, 1.0, -2.6);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++)
    box(group, 0.06, 0.34, 0.4, M.dark, xL + 0.56, 0.5 + r * 0.42, -1.45 - c * 0.46);
  // 标物柜（左墙近门：冷藏柜 + 母液瓶架 + 砝码盒 + 固定点封装）
  box(group, 0.6, 1.9, 1.1, M.shellG, xL + 0.35, 0.95, -4.6);
  box(group, 0.05, 1.0, 0.7, M.winGlass, xL + 0.66, 1.25, -4.6);   // 玻璃门
  for (let i = 0; i < 5; i++)
    cyl(group, 0.05, 0.05, 0.18, 10, i < 3 ? M.yellow : M.blue, xL + 0.5, 1.62, -4.35 - i * 0.13);
  box(group, 0.34, 0.12, 0.24, M.copper, xL + 0.5, 0.9, -4.45);    // 熔点固定点封装(In/Zn)
  box(group, 0.26, 0.1, 0.2, M.dark, xL + 0.5, 0.9, -4.85);        // 砝码盒
  box(group, 0.04, 0.3, 0.6, G.plaque, xL + 0.62, 2.2, -4.6);      // 「标准物质」牌
  poi(group, 'standards', xL + 0.7, 1.4, -4.6);

  /* ==========================================================
   * C. 中区六隔间（隔断矮墙 + 靠墙工作台）
   *    左 x<0：GC-MS(-6.3) 拉曼(-10.3) 水质线(-14.2)
   *    右 x>0：ICP(-6.3) XRD(-10.3) SEM(-14.2)
   * ========================================================== */
  for (const zx of [-4.4, -8.4, -12.4, -16.0]) {   // 隔断矮墙(两侧)
    box(group, 2.6, 1.35, 0.12, M.wall, xL + 1.45, 0.675, zx);
    box(group, 2.6, 0.06, 0.16, M.trim, xL + 1.45, 1.38, zx);
    box(group, 2.6, 1.35, 0.12, M.wall, xR - 1.45, 0.675, zx);
    box(group, 2.6, 0.06, 0.16, M.trim, xR - 1.45, 1.38, zx);
  }

  /* --- C1 GC-MS（左1，z=-6.3）：柱温箱+四极杆罩+自动进样转盘+H2 发生器 --- */
  {
    const g = new THREE.Group(); g.position.set(-6.0, 0, -6.3); group.add(g);
    box(g, 2.6, 0.85, 1.0, M.bench, 0, 0.425, 0); box(g, 2.8, 0.06, 1.1, M.benchTop, 0, 0.88, 0);
    // 柱温箱：门板微凸 + 拉手 + 观察窗内可见铜色毛细柱环
    box(g, 1.0, 0.8, 0.85, M.shellW, -0.6, 1.31, 0);
    box(g, 0.86, 0.68, 0.03, M.shellG, -0.6, 1.31, 0.44);          // 门板
    box(g, 0.05, 0.3, 0.03, M.steel, -0.22, 1.31, 0.46);           // 门拉手
    box(g, 0.44, 0.36, 0.02, M.glass, -0.66, 1.38, 0.455);         // 窗框玻璃(暗)
    torus(g, 0.13, 0.022, Math.PI * 2, M.copper, -0.66, 1.38, 0.47, 0, 0, 0, 28); // 毛细柱环
    torus(g, 0.09, 0.018, Math.PI * 2, M.copper, -0.66, 1.38, 0.475, 0, 0, 0, 22);
    box(g, 0.9, 0.12, 0.8, M.shellG, -0.6, 1.77, 0);               // 顶盖(进样口座)
    cyl(g, 0.05, 0.05, 0.16, 10, M.steel, -0.75, 1.9, 0.1);        // 分流进样口
    cyl(g, 0.065, 0.065, 0.03, 10, M.copper, -0.75, 1.985, 0.1);   // 隔垫压帽
    cyl(g, 0.035, 0.035, 0.12, 8, M.steel, -0.45, 1.88, 0.1);      // 第二进样口(备)
    cyl(g, 0.015, 0.015, 0.3, 6, M.pipe, -0.9, 1.86, -0.2, 'Z');   // 分流放空细管
    // 自动进样转盘（spinner 节点,瓶盖红白相间可读旋转）
    const car = new THREE.Group(); car.name = 'gc_carousel';
    car.position.set(-0.75, 2.0, 0.1); g.add(car);
    cyl(car, 0.16, 0.16, 0.05, 20, M.shellG, 0, 0, 0);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      cyl(car, 0.02, 0.02, 0.07, 6, M.glass, 0.11 * Math.cos(a), 0.05, 0.11 * Math.sin(a));
      cyl(car, 0.022, 0.022, 0.015, 6, i % 2 ? M.red : M.shellW,
        0.11 * Math.cos(a), 0.09, 0.11 * Math.sin(a));             // 瓶盖
    }
    cyl(g, 0.02, 0.02, 0.14, 6, M.steel, -0.75, 2.12, 0.1);        // 取样臂立轴
    box(g, 0.16, 0.02, 0.03, M.steel, -0.69, 2.18, 0.1);           // 取样臂
    // 传输线（柱箱 → MS,加热套色）
    cyl(g, 0.03, 0.03, 0.22, 8, M.orange, -0.05, 1.55, 0, 'X');
    // 四极杆罩（水平圆筒 + 端盖法兰 + 检测器盒）
    cyl(g, 0.17, 0.17, 0.85, 18, M.shellG, 0.35, 1.45, 0, 'X');
    cyl(g, 0.19, 0.19, 0.05, 18, M.steel, 0.75, 1.45, 0, 'X');     // 端法兰
    box(g, 0.35, 0.4, 0.42, M.shellW, 0.95, 1.35, 0);
    for (const dz of [-0.12, 0, 0.12])
      box(g, 0.3, 0.02, 0.06, M.dark, 0.95, 1.13, dz);             // 侧散热格栅
    // 涡轮泵(翅片) + 真空规
    cyl(g, 0.07, 0.07, 0.26, 12, M.steel, 0.35, 0.72, -0.28);
    torus(g, 0.085, 0.012, Math.PI * 2, M.dark, 0.35, 0.78, -0.28, Math.PI / 2, 0, 0, 16);
    torus(g, 0.085, 0.012, Math.PI * 2, M.dark, 0.35, 0.7, -0.28, Math.PI / 2, 0, 0, 16);
    cyl(g, 0.05, 0.05, 0.3, 8, M.pipe, 0.95, 0.7, -0.3);           // 前级线 → 泵间
    cyl(g, 0.035, 0.035, 0.08, 8, M.steel, 0.62, 1.68, -0.1);      // 真空规头
    box(g, 0.07, 0.05, 0.02, G.scrGn, 0.62, 1.62, 0.0);            // 规读数
    // 工作站：屏 + 键盘
    box(g, 0.34, 0.3, 0.03, G.scr, 1.15, 1.5, 0.35, 0, 0.5, 0);
    cyl(g, 0.03, 0.03, 0.55, 8, M.steel, 1.15, 1.18, 0.3);
    box(g, 0.3, 0.02, 0.12, M.dark, 1.12, 0.92, 0.42, 0, 0.5, 0);  // 键盘
    // H2 发生器(红标) + 补水瓶 + 显示
    box(g, 0.3, 0.22, 0.24, M.red, -1.1, 1.26, -0.25);
    box(g, 0.1, 0.06, 0.02, G.scrGn, -1.1, 1.3, -0.12);
    cyl(g, 0.05, 0.05, 0.16, 10, M.winGlass, -1.1, 1.45, -0.25);   // 去离子水瓶
    // H2 传感器(账 G5:10% LEL 报警 1.4 min,联锁断电解——柱箱顶红环小盒)
    cyl(g, 0.04, 0.04, 0.04, 10, M.red, -0.35, 1.75, 0.3);
    cyl(g, 0.03, 0.03, 0.015, 10, M.dark, -0.35, 1.78, 0.3);
    cyl(g, 0.025, 0.025, 0.06, 8, M.yellow, 1.02, 1.62, 0.12);     // PFTBA 调谐瓶(琥珀)
    box(g, 0.05, 0.05, 0.03, G.lampG, -0.6, 1.72, 0.44);           // 运行绿灯
    chair(g, 1.15, 0.85, Math.PI);
    poi(g, 'gcms', 0, 1.6, 0.4);
  }

  /* --- C2 ICP-OES（右1，z=-6.3）：炬管辉光+雾化室+蠕动泵+排风 --- */
  {
    const g = new THREE.Group(); g.position.set(6.0, 0, -6.3); group.add(g);
    box(g, 2.6, 0.85, 1.0, M.bench, 0, 0.425, 0); box(g, 2.8, 0.06, 1.1, M.benchTop, 0, 0.88, 0);
    box(g, 1.7, 1.0, 0.9, M.shellW, -0.3, 1.41, 0);                // 主机
    box(g, 0.9, 0.34, 0.86, M.shellG, -0.6, 2.05, -0.02);          // 分光室鼓包(顶后)
    box(g, 0.56, 0.56, 0.03, M.dark, -0.75, 1.5, 0.455);           // 炬室窗框
    cyl(g, 0.055, 0.055, 0.34, 12, G.torch, -0.75, 1.5, 0.47);     // 炬管辉光(半嵌出壳面)
    cyl(g, 0.09, 0.05, 0.08, 12, M.copper, -0.75, 1.71, 0.47);     // 采样锥(炬顶)
    box(g, 0.5, 0.5, 0.03, M.winGlass, -0.75, 1.5, 0.53);          // 观察玻璃(前置)
    cyl(g, 0.1, 0.06, 0.2, 12, M.shellG, -0.75, 1.85, 0.3);        // 炬室烟囱
    cyl(g, 0.09, 0.09, 0.75, 10, M.pipe, -0.75, 2.55, 0.3);        // 排风立管
    cyl(g, 0.09, 0.09, 0.5, 10, M.pipe, -0.75, 2.92, 0.08, 'Z');   // 排风弯头横段
    // 样品导入链：蠕动泵(带滚轮) → 雾化器 → 旋流雾化室(玻璃) → 炬
    // 射频发生器柜(账 D-M3):1350 W 射频前面是一台约 70% 效率的固态功放,
    // 也就是 1929 W 上墙、579 W 在这个柜子里变成热——而在这一轮之前,
    // 全册没有任何一本账跨过功放,几何里也没有这个柜子。
    box(g, 0.62, 0.95, 0.45, M.shellG, 0.62, 0.475, -0.82);        // 功放柜
    box(g, 0.5, 0.03, 0.02, M.dark, 0.62, 0.80, -0.60);            // 前面板槽
    box(g, 0.1, 0.05, 0.02, G.scrGn, 0.42, 0.68, -0.60);           // 正向/反射功率表
    box(g, 0.1, 0.05, 0.02, G.lampG, 0.62, 0.68, -0.60);           // RF ON
    for (let i = 0; i < 6; i++)                                     // 柜顶排热格栅
      box(g, 0.5, 0.012, 0.03, M.trim, 0.62, 0.955, -0.95 + i * 0.05);
    cyl(g, 0.045, 0.045, 0.42, 10, M.copper, 0.2, 0.86, -0.82, 'X');// 同轴馈线
    cyl(g, 0.045, 0.045, 0.5, 10, M.copper, -0.02, 1.05, -0.82);   // 上行至匹配网络
    box(g, 0.24, 0.2, 0.18, M.shellW, -0.02, 1.25, -0.7);          // 匹配网络盒
    box(g, 0.3, 0.24, 0.2, M.shellG, 0.45, 1.14, 0.35);            // 蠕动泵体
    cyl(g, 0.09, 0.09, 0.08, 12, M.dark, 0.45, 1.14, 0.47, 'Z');   // 泵头
    for (const a of [0, 2.1, 4.2])
      cyl(g, 0.02, 0.02, 0.09, 6, M.steel,
        0.45 + 0.05 * Math.cos(a), 1.14 + 0.05 * Math.sin(a), 0.47, 'Z'); // 滚轮
    cyl(g, 0.06, 0.06, 0.22, 12, M.winGlass, 0.1, 1.2, 0.4);       // 旋流雾化室
    cyl(g, 0.02, 0.02, 0.12, 6, M.winGlass, 0.1, 1.05, 0.4);       // 排液尾
    cyl(g, 0.018, 0.018, 0.14, 6, M.steel, 0.22, 1.28, 0.4, 'X');  // 雾化器
    cyl(g, 0.012, 0.012, 0.5, 6, M.pipe, -0.3, 1.42, 0.44, 'X');   // 样品毛细管→炬
    cyl(g, 0.05, 0.05, 0.14, 8, M.yellow, 0.45, 0.95, 0.42);       // 废液瓶(台下)
    // 自动进样器(独立小台 + 摆臂 oscillator 节点 icp_arm)
    box(g, 0.7, 0.78, 0.55, M.bench, 1.15, 0.39, 0.5);
    box(g, 0.62, 0.05, 0.46, M.shellG, 1.15, 0.84, 0.5);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++)
      cyl(g, 0.02, 0.02, 0.1, 6, M.winGlass, 0.95 + i * 0.1, 0.92, 0.38 + j * 0.12);
    const arm = new THREE.Group(); arm.name = 'icp_arm';
    arm.position.set(1.15, 1.02, 0.5); g.add(arm);
    box(arm, 0.05, 0.18, 0.05, M.steel, 0, 0.09, -0.28);           // 臂座
    box(arm, 0.04, 0.03, 0.34, M.steel, 0, 0.16, -0.1);            // 悬臂
    cyl(arm, 0.008, 0.008, 0.12, 6, M.dark, 0, 0.06, 0.06);        // 取样针
    // 循环水冷机(格栅+软管×2)
    box(g, 0.5, 0.5, 0.4, M.shellG, 1.0, 1.28, -0.2);
    for (const dy of [-0.08, 0.04]) box(g, 0.42, 0.02, 0.02, M.dark, 1.0, 1.28 + dy, 0.005);
    cyl(g, 0.02, 0.02, 0.42, 6, M.blue, 0.6, 1.5, -0.15, 'X');     // 冷却软管
    cyl(g, 0.02, 0.02, 0.42, 6, M.red, 0.6, 1.42, -0.22, 'X');
    box(g, 0.34, 0.3, 0.03, G.scr, 0.9, 1.6, 0.4, 0, -0.4, 0);     // 工作站屏
    cyl(g, 0.03, 0.03, 0.6, 8, M.steel, 0.9, 1.25, 0.35);
    box(g, 0.05, 0.05, 0.03, G.lampG, -0.3, 1.86, 0.44);
    box(g, 0.16, 0.1, 0.02, M.yellow, 0.05, 1.75, 0.46);           // 高温警示标
    chair(g, 0.55, 1.15, Math.PI);
    poi(g, 'icp', -0.5, 1.6, 0.5);
  }

  /* --- C3 拉曼（左2，z=-10.3）：光路桌+激光器+显微塔 --- */
  {
    const g = new THREE.Group(); g.position.set(-6.0, 0, -10.3); group.add(g);
    box(g, 2.4, 0.12, 1.2, M.dark, 0, 0.86, 0);                    // 光学面包板
    for (const lx of [-1.0, 1.0]) for (const lz of [-0.45, 0.45])
      cyl(g, 0.06, 0.06, 0.8, 8, M.steel, lx, 0.4, lz);            // 桌腿
    box(g, 0.5, 0.22, 0.28, M.shellG, -0.85, 1.03, -0.25);         // 532 nm 激光器
    cyl(g, 0.03, 0.03, 0.04, 8, M.dark, -0.58, 1.03, -0.25, 'X');  // 出射口
    box(g, 0.04, 0.03, 0.02, G.lampG, -0.85, 1.16, -0.12);         // 激光运行灯
    box(g, 0.06, 0.06, 0.04, M.steel, -0.5, 1.03, -0.25);          // 安全快门
    // 扩束镜组(两只透镜柱) + 光路
    box(g, 0.28, 0.035, 0.035, G.laser, -0.32, 1.03, -0.25);
    for (const lx of [-0.18, -0.02]) {
      cyl(g, 0.02, 0.02, 0.12, 6, M.steel, lx, 0.96, -0.25);       // 镜柱
      cyl(g, 0.045, 0.045, 0.02, 10, M.shellG, lx, 1.03, -0.25, 'X'); // 透镜框
    }
    box(g, 0.42, 0.035, 0.035, G.laser, 0.1, 1.03, -0.25);         // 扩束后光路
    box(g, 0.07, 0.09, 0.07, M.steel, 0.22, 1.02, -0.25, 0, Math.PI / 4, 0); // 转折镜 45°
    box(g, 0.035, 0.035, 0.45, G.laser, 0.22, 1.03, 0.0);          // 折向显微塔
    box(g, 0.08, 0.08, 0.06, M.dark, 0.22, 1.03, 0.24);            // 陷波滤光立方
    // 显微塔：塔身 + 物镜转塔(三物镜) + XY 载物台 + 样品
    cyl(g, 0.1, 0.1, 0.55, 12, M.shellW, 0.22, 1.35, 0.28);
    cyl(g, 0.09, 0.09, 0.05, 10, M.shellG, 0.22, 1.06, 0.28);      // 转塔盘
    for (const a of [0, 2.1, 4.2])
      cyl(g, 0.022, 0.03, 0.07, 8, M.dark, 0.22 + 0.05 * Math.cos(a), 1.0, 0.28 + 0.05 * Math.sin(a));
    box(g, 0.3, 0.16, 0.3, M.shellG, 0.22, 0.94, 0.28);            // 载物台体
    box(g, 0.2, 0.02, 0.2, M.steel, 0.22, 1.03, 0.28);             // 样品平台... 与物镜留隙
    cyl(g, 0.03, 0.03, 0.05, 8, M.winGlass, 0.22, 1.06, 0.36);     // 样品瓶
    for (const dz of [0.14, -0.14])
      cyl(g, 0.025, 0.025, 0.06, 8, M.dark, 0.4, 0.94, 0.28 + dz, 'X'); // XY 手轮
    // 光谱仪盒(研究级 f=750——账 R3:巴桑石/无水石膏 2 cm⁻¹ 判据把
    // 紧凑 320 mm 判了不及格,一档台阶给箱子定了尺寸) + 狭缝管 + 光纤
    box(g, 0.85, 0.32, 0.4, M.shellW, 1.02, 1.09, 0.12);
    cyl(g, 0.03, 0.03, 0.1, 8, M.dark, 0.56, 1.1, 0.15, 'X');      // 狭缝管
    cyl(g, 0.012, 0.012, 0.3, 6, M.orange, 0.44, 1.18, 0.2, 'X');  // 光纤段1
    cyl(g, 0.012, 0.012, 0.16, 6, M.orange, 0.3, 1.26, 0.24);      // 光纤段2(下弯)
    // CCD 杜瓦 + 常抽支路(账 D-C5,本轮自我推翻的产物):设定点 −71 °C,
    // 干氩吹扫壳不够——10 Pa 以上气体导热与压强无关,吹扫壳带 123 mW 进冷头,
    // 三级珀尔帖只抬得动 87 mW。所以是真杜瓦,而且不密封+吸气剂,是常抽:
    // 涡轮直排、前级泵消失(账 A),支路阀挂本馆已有真空线,26 个月重抽消失。
    cyl(g, 0.075, 0.075, 0.13, 12, M.shellG, 1.44, 1.09, 0.12, 'X');  // 杜瓦筒
    cyl(g, 0.055, 0.055, 0.02, 10, M.winGlass, 1.52, 1.09, 0.12, 'X');// 冷窗
    for (let i = 0; i < 5; i++)                                        // 冷头散热鳍
      box(g, 0.012, 0.11, 0.1, M.steel, 1.42 + i * 0.014, 1.20, 0.12);
    cyl(g, 0.018, 0.018, 0.34, 8, M.steel, 1.44, 0.92, 0.12);          // 常抽支管(下行)
    cyl(g, 0.018, 0.018, 0.5, 8, M.steel, 1.44, 0.76, 0.36, 'Z');      // 支管转向泵间
    cyl(g, 0.032, 0.032, 0.05, 10, M.orange, 1.44, 0.76, 0.58, 'Z');   // 支路隔离阀
    box(g, 0.1, 0.02, 0.14, M.dark, -0.15, 0.93, 0.45);            // 激光护目镜(桌角)
    box(g, 0.14, 0.1, 0.02, M.yellow, -1.1, 1.32, -0.25);          // 激光警示牌(桌尾)
    box(g, 0.3, 0.24, 0.03, G.scr, -0.5, 1.5, 0.55, 0, 0, 0);      // 屏(谱库比对)
    cyl(g, 0.03, 0.03, 0.5, 8, M.steel, -0.5, 1.15, 0.52);
    box(g, 0.05, 0.05, 0.03, G.lampG, -0.85, 1.2, -0.1);
    chair(g, -0.5, 1.1, Math.PI);
    poi(g, 'raman', 0.1, 1.3, 0.4);
  }

  /* --- C4 XRD（右2，z=-10.3）：测角仪圆弧+辐射防护柜+琥珀窗 --- */
  {
    const g = new THREE.Group(); g.position.set(6.0, 0, -10.3); group.add(g);
    // 防护柜：开前脸壳体（背板/侧板/顶底/框），测角仪可见
    box(g, 1.5, 0.5, 1.1, M.shellG, -0.4, 0.25, 0);                // 底柜
    box(g, 1.5, 1.5, 0.08, M.shellW, -0.4, 1.25, -0.51);           // 背板
    box(g, 0.08, 1.5, 1.1, M.shellW, -1.11, 1.25, 0);              // 左侧板
    box(g, 0.08, 1.5, 1.1, M.shellW, 0.31, 1.25, 0);               // 右侧板
    box(g, 1.5, 0.1, 1.1, M.shellW, -0.4, 2.0, 0);                 // 顶板
    box(g, 0.14, 1.5, 0.08, M.shellW, -1.01, 1.25, 0.51);          // 前框左
    box(g, 0.14, 1.5, 0.08, M.shellW, 0.21, 1.25, 0.51);           // 前框右
    box(g, 1.5, 0.22, 0.08, M.shellW, -0.4, 0.61, 0.51);           // 前框下
    box(g, 1.08, 0.5, 0.03, M.winGlass, -0.4, 1.35, 0.52);         // 铅玻璃(上半窗)
    box(g, 0.3, 0.04, 0.5, G.panel, -0.4, 1.93, 0, 0);             // 柜内照明条
    // 测角仪：θ-θ 圆弧 + Co 靶管臂(账 X1:富铁行星选钴,CheMin 同解;
    //   首轮卡误写 Cu——地球目录默认值,已按账修正) + Fe Kβ 滤片 + 双侧索拉
    //   狭缝 + Si 条带探测器(账 X4:172× 加速) + 样品旋台(账 X5:晶粒统计)
    torus(g, 0.42, 0.03, Math.PI, M.steel, -0.4, 1.25, -0.1, 0, 0, 0);
    cyl(g, 0.06, 0.06, 0.12, 10, M.dark, -0.4, 1.25, -0.1, 'Z');   // 样品台座
    const spn = new THREE.Group(); spn.name = 'xrd_spinner';
    spn.position.set(-0.4, 1.25, -0.03); g.add(spn);
    spn.rotation.x = Math.PI / 2;                                  // 盘面朝前
    cyl(spn, 0.045, 0.045, 0.015, 16, M.shellG, 0, 0, 0);          // 旋转样品盘
    box(spn, 0.06, 0.004, 0.012, M.dark, 0, 0.01, 0);              // 盘面标记(读转动)
    box(g, 0.11, 0.3, 0.13, M.copper, -0.76, 1.44, -0.1, 0, 0, 0.7);   // 管臂座(铜体 Co 靶)
    cyl(g, 0.05, 0.05, 0.2, 10, M.steel, -0.68, 1.38, -0.1, 'X');  // 射线管壳(横柱)
    box(g, 0.05, 0.06, 0.05, M.dark, -0.6, 1.36, -0.1);            // 快门块
    box(g, 0.035, 0.05, 0.02, M.greenAr, -0.565, 1.345, -0.1, 0, 0, 0.7); // Fe Kβ 滤片插槽(17 µm)
    box(g, 0.06, 0.05, 0.06, M.shellG, -0.53, 1.325, -0.1, 0, 0, 0.7);   // 入射索拉狭缝盒
    box(g, 0.06, 0.05, 0.06, M.shellG, -0.27, 1.325, -0.1, 0, 0, -0.7);  // 接收索拉狭缝盒
    cyl(g, 0.014, 0.014, 0.24, 6, M.red, -0.82, 1.62, -0.1);       // 高压电缆上引
    box(g, 0.11, 0.3, 0.13, M.dark, -0.04, 1.44, -0.1, 0, 0, -0.7);    // 探测器臂
    box(g, 0.15, 0.08, 0.05, M.shellW, -0.09, 1.55, -0.1, 0, 0, -0.7); // Si 条带模块(192 通道)
    box(g, 0.13, 0.02, 0.015, M.dark, -0.095, 1.545, -0.035, 0, 0, -0.7); // 条带窗(1D 阵)
    // 单级 Peltier 冷头 + 散热片(器件账 D-S3:漏电每 7.5 K 翻倍,冷到 253 K
    // 把最优成形时间拉长 7×,线宽 270→151 eV——冷却买的是积分时间不是噪声)
    box(g, 0.1, 0.09, 0.07, M.copper, -0.02, 1.62, -0.1, 0, 0, -0.7);
    for (let i = 0; i < 4; i++)
      box(g, 0.09, 0.008, 0.05, M.steel, 0.02 + i * 0.012, 1.66 + i * 0.006, -0.1, 0, 0, -0.7);
    box(g, 0.16, 0.1, 0.06, B.xray, -0.4, 2.08, 0.5);              // X-RAY ON 闪烁灯(框顶)
    box(g, 0.24, 0.18, 0.04, M.yellow, -0.9, 1.8, 0.56);           // 辐射三叶标
    box(g, 0.1, 0.06, 0.04, M.steel, 0.12, 1.0, 0.53);             // 柜门拉手
    cyl(g, 0.025, 0.025, 0.04, 8, M.dark, -0.95, 0.5, 0.52, 'Z');  // 联锁钥匙开关
    // 高压发生器(落地箱,油浸罐——70 kPa 舱内 Paschen 降额账 X2 的答案) + 水冷机
    box(g, 0.45, 0.6, 0.5, M.shellG, -1.45, 0.3, -0.15);
    box(g, 0.14, 0.1, 0.02, M.yellow, -1.45, 0.42, 0.11);          // 高压警示
    box(g, 0.08, 0.05, 0.02, G.scrGn, -1.45, 0.25, 0.11);          // kV/mA 读数
    const hvc = cyl(g, 0.016, 0.016, 0.5, 6, M.red, -1.15, 0.78, -0.15); // 高压缆斜上
    hvc.rotation.z = 0.5;
    box(g, 0.4, 0.4, 0.4, M.shellW, -1.45, 0.2, -0.85);            // 水冷机(接城网冷却环路)
    poi(g, 'xrdsrc', -1.3, 1.0, 0.1);
    // 前端电子学机箱(读出 ASIC——器件账 D-F1:传感器进口、电子学本地,
    // 65 nm 模拟线做得出读出芯片,却长不出 4 kΩ·cm 区熔硅)
    box(g, 0.5, 0.22, 0.42, M.shellG, 0.85, 0.12, -0.5);
    for (let i = 0; i < 5; i++)
      box(g, 0.02, 0.16, 0.4, M.dark, 0.66 + i * 0.09, 0.12, -0.5);
    box(g, 0.06, 0.04, 0.02, G.lampG, 1.06, 0.2, -0.29);
    // 控制台 + 键盘 + 椅
    box(g, 0.8, 0.85, 0.8, M.bench, 0.85, 0.425, 0);
    box(g, 0.34, 0.3, 0.03, G.scr, 0.85, 1.35, 0.3, 0, 0, 0);
    cyl(g, 0.04, 0.04, 0.4, 8, M.steel, 0.85, 1.1, 0.25);
    box(g, 0.3, 0.02, 0.12, M.dark, 0.85, 0.87, 0.32);             // 键盘
    chair(g, 0.85, 0.95, Math.PI);
    poi(g, 'xrd', -0.4, 1.5, 0.7);
  }

  /* --- C5 水质线（左3，z=-14.2）：离子色谱×2+自动进样架+淋洗液+蓝色调 --- */
  {
    const g = new THREE.Group(); g.position.set(-6.0, 0, -14.2); group.add(g);
    box(g, 2.6, 0.85, 1.0, M.bench, 0, 0.425, 0); box(g, 2.8, 0.06, 1.1, M.benchTop, 0, 0.88, 0);
    for (const dx of [-0.95, -0.35]) {                             // 两台 IC 主机(阴/阳离子)
      box(g, 0.5, 0.75, 0.6, M.shellW, dx, 1.29, -0.1);
      box(g, 0.42, 0.16, 0.03, M.blue, dx, 1.55, 0.21);            // 蓝色标条
      box(g, 0.3, 0.3, 0.02, M.winGlass, dx, 1.22, 0.21);          // 柱室窗
      for (const cx of [-0.07, 0.07]) {
        cyl(g, 0.016, 0.016, 0.24, 6, M.shellG, dx + cx, 1.22, 0.19); // 分离柱×2
        cyl(g, 0.02, 0.02, 0.03, 6, M.steel, dx + cx, 1.35, 0.19);
      }
      box(g, 0.08, 0.05, 0.02, G.scrGn, dx - 0.14, 1.55, 0.215);   // 电导读数
      box(g, 0.05, 0.05, 0.03, G.lampG, dx + 0.16, 1.05, 0.21);
    }
    // 阳离子捕集柱(账 D-M2d):耶泽罗卤水 300 mg/L 的 Ca+Mg,配上账 W1 红闸
    // 逼出来的 500 µL 大定量环,约 11 sol 就能把抑制器膜喂饱——两轮的结论
    // 互相顶住,解法是在柱前拦一道。这根柱子此前不在本馆的耗材单上。
    cyl(g, 0.028, 0.028, 0.13, 10, M.orange, -0.52, 1.06, 0.30);   // 捕集柱
    cyl(g, 0.01, 0.01, 0.1, 6, M.blue, -0.52, 1.16, 0.30);         // 进液短管
    box(g, 0.24, 0.18, 0.3, M.shellG, -0.65, 1.0, 0.28);           // 在线脱气盒
    // RFIC 淋洗液发生器(账 W3:淋洗液=水+电+K⁺ 滤芯,不进补给单)
    box(g, 0.2, 0.24, 0.2, M.shellW, -0.4, 1.03, 0.32);
    cyl(g, 0.05, 0.05, 0.14, 10, M.greenAr, -0.4, 1.22, 0.32);     // K⁺ 滤芯
    box(g, 0.06, 0.04, 0.02, G.scrGn, -0.4, 1.05, 0.43);           // mM 读数
    cyl(g, 0.012, 0.012, 0.56, 6, M.blue, -0.65, 1.62, -0.05, 'X'); // 两机间淋洗管
    // 淋洗液上架(吊架 + 3 桶) —— 重力供液
    box(g, 0.7, 0.04, 0.4, M.steel, 1.0, 1.75, -0.15);
    for (const dz of [-0.28, -0.15, -0.02])
      cyl(g, 0.07, 0.07, 0.26, 10, M.blue, 1.0, 1.92, dz);
    for (const dz of [-0.28, -0.02])
      cyl(g, 0.01, 0.01, 0.5, 6, M.blue, 0.65, 1.62, dz, 'X');     // 下行供液管
    // 自动进样架(6×4 样品瓶阵,蓝盖)
    box(g, 0.7, 0.06, 0.5, M.shellG, 0.5, 0.94, 0.1);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      cyl(g, 0.025, 0.025, 0.09, 6, M.winGlass, 0.28 + i * 0.09, 1.02, -0.05 + j * 0.11);
      cyl(g, 0.027, 0.027, 0.014, 6, M.blue, 0.28 + i * 0.09, 1.07, -0.05 + j * 0.11);
    }
    box(g, 0.34, 0.28, 0.24, M.blue, 1.75, 0.14, 0.55);            // 送样冷藏箱(落地)
    box(g, 0.36, 0.04, 0.26, M.shellW, 1.75, 0.31, 0.55);          // 白盖
    // 清洗小水槽 + 弯管龙头(台尾)
    box(g, 0.3, 0.08, 0.3, M.steel, -1.15, 0.87, 0.32);
    cyl(g, 0.015, 0.015, 0.2, 6, M.steel, -1.28, 1.0, 0.32);
    cyl(g, 0.015, 0.015, 0.12, 6, M.steel, -1.23, 1.1, 0.32, 'X');
    box(g, 0.3, 0.24, 0.03, G.scr, 1.15, 1.5, 0.3, 0, -0.5, 0);
    cyl(g, 0.03, 0.03, 0.55, 8, M.steel, 1.15, 1.18, 0.26);        // 屏支杆
    box(g, 0.12, 0.16, 0.015, M.shellW, 1.44, 1.1, 0.6, 0, -Math.PI / 2, 0); // 采样单夹板(挂栏杆)
    chair(g, 0.4, 0.85, Math.PI);
    // 治理隔离：独立复核区蓝栏杆 + 发光牌
    for (const dz of [-1.0, 1.0]) cyl(g, 0.03, 0.03, 0.9, 8, M.blue, 1.45, 0.45, dz);
    box(g, 0.04, 0.06, 2.0, M.blue, 1.45, 0.9, 0);
    box(g, 0.04, 0.22, 0.62, G.plaque, 1.42, 1.42, 0);             // 「第三方复核」牌
    poi(g, 'water', 0.2, 1.3, 0.5);
  }

  /* --- C6 SEM（右3，z=-14.2）：惯性块+隔振腿+立柱+样品室+操作屏 --- */
  {
    const g = new THREE.Group(); g.position.set(5.8, 0, -14.2); group.add(g);
    // 三级隔振：橙色气浮腿 ×3 + 花岗岩惯性块（露出来讲账）
    for (const [dx, dz] of [[-0.7, -0.45], [0.7, -0.45], [0, 0.55]])
      cyl(g, 0.12, 0.14, 0.28, 12, M.orange, dx, 0.14, dz);
    box(g, 2.0, 0.35, 1.5, M.granite, 0, 0.46, 0);                 // 惯性块
    box(g, 0.9, 0.75, 0.9, M.shellW, -0.3, 1.01, 0);               // 样品室
    box(g, 0.4, 0.45, 0.05, M.shellG, -0.3, 1.0, 0.47);            // 交换舱门
    for (const dy of [-0.14, 0.14])
      box(g, 0.04, 0.08, 0.03, M.steel, -0.52, 1.0 + dy, 0.48);    // 门铰链×2
    box(g, 0.06, 0.12, 0.03, M.dark, -0.12, 1.0, 0.49);            // 门把
    cyl(g, 0.055, 0.055, 0.02, 12, M.winGlass, -0.3, 1.22, 0.485, 'Z'); // 观察舷窗
    cyl(g, 0.16, 0.16, 0.22, 14, M.steel, -0.3, 1.5, 0);           // 柱基
    cyl(g, 0.13, 0.13, 0.5, 14, M.shellW, -0.3, 1.86, 0);          // 电子光学柱
    for (const dy of [1.68, 1.94])
      torus(g, 0.135, 0.012, Math.PI * 2, M.steel, -0.3, dy, 0, Math.PI / 2, 0, 0, 18); // 透镜段环
    for (const s of [-1, 1])
      cyl(g, 0.02, 0.02, 0.08, 6, M.dark, -0.3 + s * 0.15, 1.78, 0, 'X'); // 光阑旋钮
    cyl(g, 0.17, 0.17, 0.16, 14, M.shellG, -0.3, 2.19, 0);         // 电子枪帽(Schottky FEG,
    //   账 S1:18,000 h 发射体寿命 ≈ 26 个月补给窗——唯一不用等船的灯丝)
    box(g, 0.1, 0.12, 0.08, M.steel, -0.14, 2.12, -0.1);           // 枪区离子泵(密封免排气)
    const ht = cyl(g, 0.022, 0.022, 0.3, 6, M.dark, -0.3, 2.36, -0.12); // HT 电缆(斜后)
    ht.rotation.x = 0.6;
    cyl(g, 0.022, 0.022, 0.5, 6, M.dark, -0.3, 2.4, -0.42, 'Z');
    // EDS 探测器(斜插样品室左肩) + 杜瓦帽
    const eds = cyl(g, 0.045, 0.045, 0.34, 10, M.steel, -0.72, 1.42, -0.1);
    eds.rotation.z = 0.9;
    cyl(g, 0.09, 0.09, 0.12, 12, M.shellG, -0.9, 1.56, -0.1);      // 探头尾罩
    // 涡轮泵(翅片)吊在样品室下 → 前级线去泵间
    cyl(g, 0.09, 0.09, 0.24, 12, M.steel, -0.3, 0.72, -0.32);
    for (const dy of [0.66, 0.78])
      torus(g, 0.105, 0.012, Math.PI * 2, M.dark, -0.3, dy, -0.32, Math.PI / 2, 0, 0, 16);
    cyl(g, 0.08, 0.08, 0.2, 10, M.pipe, 0.15, 0.85, -0.35, 'X');   // 真空口 → 泵间管线
    // VP 进气线(账 S4:600 Pa 火星 CO₂ 就是 ESEM 成像气体)——穿舱线倒灌:
    // 滤尘罐 → 针阀 → 样品室;硫酸盐绝缘样免镀膜成像
    cyl(g, 0.025, 0.025, 1.5, 6, M.greenAr, -1.15, 0.5, -1.45, 'Z');
    cyl(g, 0.05, 0.05, 0.16, 8, M.shellW, -1.15, 0.5, -1.9);       // HEPA 滤尘罐
    box(g, 0.07, 0.09, 0.07, M.greenAr, -1.15, 0.5, -0.62);        // 针阀(CO₂ 绿标)
    cyl(g, 0.02, 0.02, 0.42, 6, M.greenAr, -1.15, 0.74, -0.55);    // 立管
    cyl(g, 0.02, 0.02, 0.42, 6, M.greenAr, -0.93, 0.95, -0.4, 'X');// 横段入样品室
    box(g, 0.05, 0.05, 0.03, G.lampG, -0.3, 1.36, 0.47);
    // 溅射镀膜仪(绝缘样先镀膜——SEM 卡的注脚设备)
    box(g, 0.36, 0.3, 0.3, M.shellG, 0.6, 0.79, 0.5);
    cyl(g, 0.09, 0.09, 0.14, 12, M.winGlass, 0.6, 1.01, 0.5);      // 镀膜玻璃罩
    cyl(g, 0.1, 0.1, 0.02, 12, M.steel, 0.6, 1.09, 0.5);           // 罩顶
    box(g, 0.06, 0.04, 0.02, G.scrGn, 0.6, 0.85, 0.66);            // 读数
    box(g, 0.12, 0.03, 0.1, M.dark, 0.88, 0.66, 0.42);             // 样品桩盒
    // 操作桌（双屏+键盘+操纵杆,在隔振块之外——人手不碰镜体）
    box(g, 1.1, 0.06, 0.6, M.benchTop, 1.35, 0.76, 0.1);
    for (const dz of [-0.15, 0.35]) box(g, 0.05, 0.75, 0.6, M.bench, 1.35 + (dz < 0 ? -0.5 : 0.5), 0.38, 0.1);
    for (const dz of [-0.1, 0.32]) box(g, 0.03, 0.3, 0.4, G.scr, 1.3, 1.15, dz, 0, -0.9, 0);
    box(g, 0.26, 0.02, 0.1, M.dark, 1.42, 0.8, 0.1, 0, -0.9, 0);   // 键盘
    box(g, 0.08, 0.04, 0.08, M.shellG, 1.5, 0.81, -0.14);          // 操纵杆座
    cyl(g, 0.012, 0.012, 0.08, 6, M.dark, 1.5, 0.87, -0.14);       // 台移动杆
    chair(g, 1.75, 0.1, Math.PI / 2);
    poi(g, 'sem', -0.3, 1.6, 0.5);
    poi(g, 'plinth', 0.6, 0.5, 0.8);
  }

  /* ==========================================================
   * D. 后区（z=-16.5 隔墙）：左气瓶间 / 右真空泵间
   * ========================================================== */
  const zP = -16.6;
  // 横隔墙（留两个门洞 x=-4.5 / x=4.5，宽 1.2）+ 观察窗
  box(group, 2.9, RH, 0.18, M.wall, -6.55, RH / 2, zP);             // 左段 x -8..-5.1
  box(group, 3.9, RH, 0.18, M.wall, -1.95, RH / 2, zP);             // 中段 x -3.9..0
  box(group, 3.9, RH, 0.18, M.wall, 1.95, RH / 2, zP);              // 中段 x 0..3.9
  box(group, 2.9, RH, 0.18, M.wall, 6.55, RH / 2, zP);              // 右段 x 5.1..8
  box(group, 1.2, RH - 2.2, 0.18, M.wall, -4.5, 2.2 + (RH - 2.2) / 2, zP); // 门楣左
  box(group, 1.2, RH - 2.2, 0.18, M.wall, 4.5, 2.2 + (RH - 2.2) / 2, zP);  // 门楣右
  box(group, 1.6, 0.9, 0.06, M.winGlass, -2.0, 1.8, zP);            // 气瓶间观察窗
  box(group, 1.6, 0.9, 0.06, M.winGlass, 2.0, 1.8, zP);             // 泵间观察窗
  box(group, 0.18, RH, 5.4 - 0.2, M.wall, 0, RH / 2, zP - 2.8);     // 中央分隔墙

  /* --- D1 气瓶间（左）：H2 红 ×3 / Ar 深绿 ×4 + 汇流排 + 顶部配管 --- */
  {
    const g = new THREE.Group(); g.position.set(-4.2, 0, -19.3); group.add(g);
    const bottle = (mat, x, z) => {
      cyl(g, 0.14, 0.14, 1.5, 12, M.steel, x, 0.75, z);
      cyl(g, 0.14, 0.14, 0.22, 12, mat, x, 1.55, z);                // 肩环色标
      cyl(g, 0.04, 0.04, 0.12, 8, M.dark, x, 1.72, z);              // 阀
    };
    for (let i = 0; i < 3; i++) bottle(M.red, -2.6 + i * 0.45, -0.7);      // H2
    for (let i = 0; i < 4; i++) bottle(M.greenAr, -0.4 + i * 0.45, -0.7);  // Ar
    box(g, 3.6, 0.9, 0.1, M.yellow, -1.2, 0.45, -1.05);             // 防倒链档板(黄)
    box(g, 1.6, 0.5, 0.25, M.steel, -1.2, 2.1, -0.95);              // 汇流排箱
    box(g, 0.4, 0.24, 0.04, M.red, -1.9, 2.1, -0.8);
    box(g, 0.4, 0.24, 0.04, M.greenAr, -0.5, 2.1, -0.8);
    // 每瓶一根盘尾软管斜上接汇流排 + 排上压力表
    for (let i = 0; i < 3; i++) {
      const t = cyl(g, 0.012, 0.012, 0.55, 6, M.red, -2.35 + i * 0.45, 2.0, -0.85);
      t.rotation.z = 0.55 - i * 0.18;
    }
    for (let i = 0; i < 4; i++) {
      const t = cyl(g, 0.012, 0.012, 0.5, 6, M.greenAr, -0.35 + i * 0.45, 2.0, -0.85);
      t.rotation.z = 0.15 + i * 0.14;                              // 顶端倒向汇流排(左)
    }
    for (const dx of [-1.75, -1.45, -0.85, -0.55])
      cyl(g, 0.035, 0.035, 0.03, 10, M.shellW, dx, 2.28, -0.82, 'Z'); // 压力表盘
    box(g, 0.5, 0.14, 0.04, M.yellow, -1.2, 2.5, -0.9);             // 「可燃气体」警条
    box(g, 0.5, 0.3, 0.03, G.scrGn, 1.3, 1.5, -0.9, 0, -0.5, 0);    // 面板:制耗闭合读数
    poi(g, 'gas', -1.0, 1.6, 0);
  }

  /* --- D2 真空泵间（右）：干泵×2(橙支座) + 穿舱管线 + 双阀 + VENT 灯 --- */
  {
    const g = new THREE.Group(); g.position.set(4.4, 0, -19.3); group.add(g);
    for (const dx of [-1.2, 0.0]) {                                 // 干泵撬(弹性支座)
      for (const [px, pz] of [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]])
        cyl(g, 0.05, 0.06, 0.12, 8, M.orange, dx + px, 0.06, pz);
      box(g, 0.75, 0.45, 0.55, M.shellG, dx, 0.36, 0);
      cyl(g, 0.08, 0.08, 0.3, 10, M.dark, dx, 0.68, 0);
      box(g, 0.05, 0.05, 0.03, G.lampG, dx + 0.3, 0.5, 0.29);
    }
    // 来自 SEM/GC-MS 的细管汇入
    cyl(g, 0.05, 0.05, 2.6, 8, M.pipe, -1.7, 0.85, 1.3, 'Z');
    // 穿舱主管线：粗管 → 阀1 → 阀2 → 后墙法兰（危险条纹）
    cyl(g, 0.09, 0.09, 1.9, 12, M.pipe, 1.4, 0.85, -0.4, 'Z');
    for (const dz of [-0.0, -0.8]) {
      box(g, 0.3, 0.36, 0.26, M.orange, 1.4, 0.85, dz);             // 常闭气动阀×2
      cyl(g, 0.1, 0.1, 0.12, 10, M.dark, 1.4, 1.12, dz);
    }
    cyl(g, 0.2, 0.2, 0.1, 16, M.steel, 1.4, 0.85, -2.05, 'Z');     // 穿舱法兰
    for (let i = 0; i < 8; i++) {                                   // 法兰螺栓圈
      const a = i / 8 * Math.PI * 2;
      cyl(g, 0.014, 0.014, 0.04, 6, M.dark, 1.4 + 0.16 * Math.cos(a), 0.85 + 0.16 * Math.sin(a), -2.06, 'Z');
    }
    cyl(g, 0.05, 0.05, 0.035, 12, M.shellW, 1.05, 1.25, -0.4, 'Z'); // 管线压力表
    cyl(g, 0.004, 0.004, 0.036, 4, M.red, 1.06, 1.26, -0.42, 'Z');  // 表针
    box(g, 1.0, 1.0, 0.05, M.yellow, 1.4, 0.9, -2.32);              // 舱壁警示板
    box(g, 0.22, 0.12, 0.05, B.vent, 1.4, 1.6, -2.3);               // VENT 闪烁灯
    box(g, 0.5, 0.35, 0.04, G.scrGn, -0.4, 1.6, -2.3);              // 「行星=前级泵」示意屏
    box(g, 0.7, 0.4, 0.5, M.steel, -1.6, 0.66, -1.9);               // 备件架
    box(g, 0.6, 0.34, 0.42, M.shellG, -1.6, 1.05, -1.9);            // 备用干泵(整泵备件)
    box(g, 0.2, 0.06, 0.02, M.yellow, -1.6, 1.0, -1.63);            // 备件标签
    poi(g, 'vacuum', 1.0, 1.2, -1.2);
  }

  /* ---------------- 中央制样岛（研磨/筛分/天平——排队卡的「制样瓶颈」实体） ---------------- */
  {
    const g = new THREE.Group(); g.position.set(0, 0, -9.6); group.add(g);
    box(g, 2.6, 0.85, 1.3, M.bench, 0, 0.425, 0);
    box(g, 2.8, 0.06, 1.45, M.benchTop, 0, 0.88, 0);
    box(g, 0.4, 0.3, 0.35, M.shellG, -0.9, 1.06, -0.2);            // 行星式研磨机
    cyl(g, 0.1, 0.1, 0.12, 12, M.dark, -0.9, 1.28, -0.2);
    for (let i = 0; i < 3; i++)                                    // 筛分塔(叠层筛)
      cyl(g, 0.14 - i * 0.01, 0.14 - i * 0.01, 0.07, 14, M.steel, -0.15, 0.97 + i * 0.08, -0.25);
    // 分析天平(玻璃风罩——隔振账在天平上也成立)
    box(g, 0.4, 0.05, 0.35, M.granite, 0.7, 0.94, -0.15);          // 天平石台
    box(g, 0.3, 0.3, 0.26, M.winGlass, 0.7, 1.12, -0.15);          // 风罩
    box(g, 0.12, 0.02, 0.1, M.steel, 0.7, 1.0, -0.15);             // 秤盘
    for (let i = 0; i < 5; i++)                                    // 送检样品杯一排
      cyl(g, 0.035, 0.035, 0.08, 8, M.winGlass, -0.6 + i * 0.28, 0.95, 0.42);
    cyl(g, 0.07, 0.05, 0.07, 12, M.steel, 0.25, 0.95, -0.3);       // 研钵
    const pst = cyl(g, 0.015, 0.02, 0.12, 6, M.steel, 0.32, 1.0, -0.26);
    pst.rotation.z = 0.7;                                          // 杵(斜靠)
    box(g, 0.16, 0.015, 0.1, M.dark, -0.4, 0.92, 0.15);            // 称量勺盘
    chair(g, -0.9, 0.95, Math.PI); chair(g, 0.9, -0.95, 0);
  }
  // 侧墙电缆桥架(两侧,U 槽 = 底板+两翼)
  for (const sx of [-1, 1]) {
    const bx = sx * (RW / 2 - 0.22);
    box(group, 0.24, 0.03, 15.6, M.trim, bx, 2.72, -8.4);
    box(group, 0.03, 0.1, 15.6, M.trim, bx - sx * 0.1, 2.78, -8.4);
    box(group, 0.03, 0.1, 15.6, M.trim, bx + sx * 0.1, 2.78, -8.4);
  }

  /* ---------------- 顶部管线（同色因果链） ---------------- */
  // H2 红管：气瓶间 → GC-MS；Ar 绿管：气瓶间 → ICP
  cyl(group, 0.035, 0.035, 10.6, 8, M.red, -5.6, RH - 0.15, -11.5, 'Z');
  cyl(group, 0.035, 0.035, 1.35, 8, M.red, -5.6, RH - 0.82, -6.25);       // 落管到 GC
  cyl(group, 0.035, 0.035, 9.2, 8, M.greenAr, -3.0, RH - 0.25, -12.2, 'Z');
  cyl(group, 0.035, 0.035, 17.6, 8, M.greenAr, 5.6, RH - 0.25, -8.0 - 0.5, 'Z'); // 右侧干线
  cyl(group, 0.035, 0.035, 8.6, 8, M.greenAr, 1.3, RH - 0.25, -16.3, 'X');       // 横渡段
  cyl(group, 0.035, 0.035, 1.2, 8, M.greenAr, 5.6, RH - 0.85, -6.25);            // 落管到 ICP
  // 接线箱两只（工业细节语法）
  box(group, 0.24, 0.3, 0.12, M.trim, -5.6, RH - 0.5, -9.0);
  box(group, 0.24, 0.3, 0.12, M.trim, 5.6, RH - 0.5, -11.0);

  /* ---------------- 顶灯板阵 ---------------- */
  for (const gx of [-4.5, 0, 4.5]) {
    for (const gz of [-2.2, -6.4, -10.4, -14.3, -19]) {
      box(group, 1.2, 0.06, 0.6, G.panel, gx, RH - 0.12, gz);
      box(group, 1.3, 0.05, 0.7, M.trim, gx, RH - 0.06, gz);
    }
  }

  /* ------- 坐标口径：整体 +Z 平移 11，使原点落在地面中心（夹取口径） ------- */
  const ZOFF = 11;
  for (const c of group.children) c.position.z += ZOFF;

  /* ---------------- 贴地归一化 + userData ---------------- */
  const bb = new THREE.Box3().setFromObject(group);
  const dy = isFinite(bb.min.y) ? bb.min.y : 0;
  if (Math.abs(dy) > 1e-4) for (const c of group.children) c.position.y -= dy;

  group.userData = {
    lights: [
      { color: 0xfff4d8, pos: [0, 3.1 - dy, ZOFF - 2.5], range: 11 },     // 前区
      { color: 0xfff4d8, pos: [-4, 3.1 - dy, ZOFF - 9], range: 12 },      // 中区左
      { color: 0xfff4d8, pos: [4, 3.1 - dy, ZOFF - 13], range: 12 },      // 中区右
      { color: 0xfff4d8, pos: [0, 3.0 - dy, ZOFF - 19], range: 10 },      // 后区
      { color: 0x8a5cff, pos: [5.2, 1.6 - dy, ZOFF - 5.8], range: 3.5 },  // ICP 炬管辉光
      { color: 0x35e05a, pos: [-5.8, 1.3 - dy, ZOFF - 10.2], range: 2.5 },// 拉曼绿光路
    ],
    beams: [],
    nightMats,
    blinkMats,
    spinners: [
      { node: 'gc_carousel', axis: 'y', rpm: 6 },
      { node: 'xrd_spinner', axis: 'y', rpm: 15 },   // 样品旋台(局部 y=盘法线)
    ],
    oscillators: [
      { node: 'icp_arm', prop: 'position', axis: 'x', amp: 0.18, period: 5 }, // 进样摆臂
    ],
    entry: { pos: [0, 0, ZOFF - 1.8], yaw: 0 },     // 门内 1.8 m，面向 -Z 仪器区
    exitZone: { pos: [0, ZOFF - 0.1], radius: 1.0 }, // 门洞处；总控接门对后可禁用
  };
  return group;
}
