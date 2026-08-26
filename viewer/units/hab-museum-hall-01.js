// hab-museum-hall-01 —— 火星城博物馆·室内馆(五展区 + 空墙)
// 契约(内部场景变体,同 hab-clinic-01 / MODELS.md §4b):米制;原点=入口地面中心;
//   房间向 -Z 延伸,门开口朝 +Z;室内地面 y=0;灯常亮(室内无昼夜);面数 ≤3 万。
// 动线(逆时针):门厅 → 1 起源厅(西墙七格漫画 + 手稿恒湿柜) → 5 保存科学角 →
//   4 火星物质厅(西后) → 空墙(后墙正中) → 2 毅力号厅(东后,1:1 复制品+实时数据屏) →
//   3 建城纪年厅(东墙时间轴 + 文物底座) → 出口。
// 红线(用户定):第七格 51/49 只提问不作答;「眼镜」/"headset" 永远带引号(第 3 格
//   的引号做成了几何——面罩两侧各一对刻线);数据署名 NASA/JPL/University of Arizona。
// 数据屏:sol/里程/途经点折线来自 data/mission/mission.json(交付时点 sol 1947,
//   11.9 km)——城市查看器任务图层本来就是 NASA 公开 API 实时数据,博物馆里的
//   「实时展品」在数字孪生里是真实时。红色车标点走 blinkMats(引擎驱动脉动)。

export const meta = {
  id: 'hab-museum-hall-01',
  name: '火星城博物馆·室内馆',
  name_en: 'Mars City Museum — Main Hall',
  kind: 'interior',
  size_m: 30.7,            // validate 实测包围盒(x)
  size_axis: 'width',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];
  const blinkMats = [];

  /* ---------------- 材质 ---------------- */
  const M = {
    wall:   new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.88 }),   // 展墙白
    wallLow:new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93 }),   // 打印土裙脚(城市语言)
    floor:  new THREE.MeshStandardMaterial({ color: 0xc9c4b8, roughness: 0.6 }),
    zone:   new THREE.MeshStandardMaterial({ color: 0xa8917a, roughness: 0.7 }),    // 分区地面嵌条
    ceil:   new THREE.MeshStandardMaterial({ color: 0xdedcd6, roughness: 0.9 }),
    trim:   new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.55, metalness: 0.4 }),
    steel:  new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.45, metalness: 0.6 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.7 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xe07020, roughness: 0.65 }),
    glass:  new THREE.MeshStandardMaterial({ color: 0xbfd8d8, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.25 }),
    white:  new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.8 }),
    page:   new THREE.MeshStandardMaterial({ color: 0xf5f0e2, roughness: 0.9 }),    // 手稿纸
    band:   new THREE.MeshStandardMaterial({ color: 0xa85a34, roughness: 0.8 }),    // 时间轴带(锈)
    // 毅力号
    rvBody: new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.55 }),
    rvDeck: new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 0.7 }),
    rvWheel:new THREE.MeshStandardMaterial({ color: 0x2e3033, roughness: 0.8 }),
    rvHub:  new THREE.MeshStandardMaterial({ color: 0xc8b06a, roughness: 0.5, metalness: 0.5 }),
    rvRtg:  new THREE.MeshStandardMaterial({ color: 0x6a6e72, roughness: 0.5, metalness: 0.5 }),
    rvGold: new THREE.MeshStandardMaterial({ color: 0xb08830, roughness: 0.4, metalness: 0.8 }),
    // 展品
    brick:  new THREE.MeshStandardMaterial({ color: 0xa5765a, roughness: 0.95 }),
    tps:    new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 0.9 }),
    water:  new THREE.MeshStandardMaterial({ color: 0x63b4d8, roughness: 0.2, transparent: true, opacity: 0.7 }),
    wafer:  new THREE.MeshStandardMaterial({ color: 0x9aa4b8, roughness: 0.25, metalness: 0.8 }),
    fiber:  new THREE.MeshStandardMaterial({ color: 0x3a4a3a, roughness: 0.7 }),
    slag:   new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.4, metalness: 0.3 }),
    meteor: new THREE.MeshStandardMaterial({ color: 0x3c3a38, roughness: 0.35, metalness: 0.7 }),
    coreA:  new THREE.MeshStandardMaterial({ color: 0x9a6a4a, roughness: 0.9 }),
    coreB:  new THREE.MeshStandardMaterial({ color: 0x7d5238, roughness: 0.9 }),
    silica: new THREE.MeshStandardMaterial({ color: 0xe0aa48, roughness: 0.8 }),
  };
  // 发光族 → nightMats(室内常亮)
  const G = {
    panel:  new THREE.MeshStandardMaterial({ color: 0x2a2a24, emissive: 0xfff4d8, emissiveIntensity: 1.5, roughness: 0.7 }), // 顶灯板
    lbox:   new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xffe6c0, emissiveIntensity: 1.1, roughness: 0.6 }), // 漫画背光
    lboxQ:  new THREE.MeshStandardMaterial({ color: 0x101a20, emissive: 0x63b4d8, emissiveIntensity: 1.2, roughness: 0.5 }), // 第七格青
    amber:  new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xe0aa48, emissiveIntensity: 1.3, roughness: 0.5 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x060a12, emissive: 0x123058, emissiveIntensity: 1.2, roughness: 0.5 }), // 数据屏底(深蓝)
    sol:    new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xffb030, emissiveIntensity: 2.2, roughness: 0.5 }), // sol 数字
    way:    new THREE.MeshStandardMaterial({ color: 0x081018, emissive: 0x4aa6ff, emissiveIntensity: 1.8, roughness: 0.5 }), // 途经点
    envOk:  new THREE.MeshStandardMaterial({ color: 0x04180a, emissive: 0x30e060, emissiveIntensity: 1.6, roughness: 0.5 }), // 环控绿
    exit:   new THREE.MeshStandardMaterial({ color: 0x04180a, emissive: 0x30e060, emissiveIntensity: 1.8, roughness: 0.5 }),
    uvC:    new THREE.MeshStandardMaterial({ color: 0x14061a, emissive: 0xa97fd8, emissiveIntensity: 1.5, roughness: 0.5 }), // UV-C 紫(sci-uv 色码)
    uvB:    new THREE.MeshStandardMaterial({ color: 0x061018, emissive: 0x4aa6ff, emissiveIntensity: 1.5, roughness: 0.5 }), // UV-B 蓝
    uvA:    new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xe0aa48, emissiveIntensity: 1.5, roughness: 0.5 }), // UV-A 琥珀
    spot:   new THREE.MeshStandardMaterial({ color: 0x2a2013, emissive: 0xfff0d0, emissiveIntensity: 0.9, roughness: 0.5 }), // 射灯头
  };
  for (const k in G) nightMats.push(G[k]);
  const roverDot = new THREE.MeshStandardMaterial({ color: 0x400808, emissive: 0xff3020, emissiveIntensity: 2.0, roughness: 0.5 });
  blinkMats.push(roverDot);   // 数据屏上的「毅力号现在位置」红点——活的

  /* ---------------- 工具 ---------------- */
  function box(w, h, d, mat, x, y, z, ry = 0, parent = group) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    parent.add(m); return m;
  }
  function cyl(rt, rb, h, seg, mat, x, y, z, axis = 'Y', parent = group) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    if (axis === 'Z') m.rotation.x = Math.PI / 2;
    else if (axis === 'X') m.rotation.z = Math.PI / 2;
    parent.add(m); return m;
  }
  function poi(name, x, y, z) {
    const a = new THREE.Object3D(); a.name = 'poi_' + name; a.position.set(x, y, z);
    group.add(a); return a;
  }

  /* ==========================================================
   * A. 房间外壳 30 × 22 × 4.6(门朝 +Z 居中)
   * ========================================================== */
  const RW = 30, RD = 22, RH = 4.6, T = 0.35;
  const xL = -RW / 2, xR = RW / 2, zB = -RD;
  box(RW + 2 * T, 0.12, RD + T, M.floor, 0, -0.06, -RD / 2 + 0.1);
  box(RW + 2 * T, 0.2, RD + T, M.ceil, 0, RH + 0.1, -RD / 2 + 0.1);
  function skirt(x, z, w, d) { box(w, 0.5, d, M.wallLow, x, 0.25, z); }
  box(T, RH, RD, M.wall, xL - T / 2, RH / 2, -RD / 2); skirt(xL - T / 2, -RD / 2, T + 0.06, RD);   // 西墙
  box(T, RH, RD, M.wall, xR + T / 2, RH / 2, -RD / 2); skirt(xR + T / 2, -RD / 2, T + 0.06, RD);   // 东墙
  box(RW + 2 * T, RH, T, M.wall, 0, RH / 2, zB - T / 2); skirt(0, zB - T / 2, RW, T + 0.06);        // 后墙
  // 前墙(门洞 2.6 × 2.5 居中)
  const dw = 2.6, dh = 2.5;
  for (const s of [-1, 1]) box((RW - dw) / 2, RH, T, M.wall, s * (dw / 2 + (RW - dw) / 4), RH / 2, 0.2 - T / 2);
  box(dw, RH - dh, T, M.wall, 0, dh + (RH - dh) / 2, 0.2 - T / 2);
  box(dw + 0.3, 0.16, 0.2, M.trim, 0, dh + 0.08, 0.22);          // 门楣
  box(0.55, 0.26, 0.06, G.exit, 0, dh + 0.42, 0.16);             // 出口标志(朝内)
  // 分区地面嵌条(三条横向,把大厅读成前/中/后三带)
  for (const zz of [-5.5, -12.5]) box(RW - 1.2, 0.015, 0.18, M.zone, 0, 0.065, zz);

  /* ==========================================================
   * B. 门厅:接待台 + 总导览牌
   * ========================================================== */
  box(2.4, 0.95, 0.7, M.white, 4.0, 0.48, -2.2);
  box(2.5, 0.06, 0.8, M.trim, 4.0, 0.98, -2.2);
  box(1.4, 1.9, 0.14, M.trim, -3.6, 0.95, -1.1);                 // 导览牌
  box(1.24, 1.5, 0.05, G.amber, -3.6, 1.05, -1.02);

  /* ==========================================================
   * C. 展区 1 起源厅(西墙 z -1.4 ~ -10.4):七格漫画 + 手稿恒湿柜
   *    红线几何化:第 3 格「眼镜」两侧引号刻线;第 7 格 51/49 双条只提问
   * ========================================================== */
  const cwx = xL + 0.28;                        // 画面贴西墙内侧,朝 +X
  const pz0 = -1.9, pitch = 1.28, PW = 1.02, PH = 1.4, PY = 1.95;
  for (let i = 0; i < 7; i++) {
    const zz = pz0 - i * pitch;
    box(0.1, PH + 0.16, PW + 0.16, M.trim, cwx, PY, zz);          // 框
    const face = (i === 6) ? G.lboxQ : G.lbox;
    box(0.06, PH, PW, face, cwx + 0.06, PY, zz);                  // 背光面
    // 格内抽象构图(盒子拼贴,叙事在知识卡)
    if (i === 0) {            // 1 造世界:大框套小框
      box(0.05, 0.8, 0.6, M.dark, cwx + 0.1, PY, zz);
      box(0.05, 0.42, 0.3, G.lbox, cwx + 0.13, PY + 0.04, zz);
    } else if (i === 1) {     // 2 嵌套:三层
      for (let k = 0; k < 3; k++) box(0.04, 0.8 - k * 0.24, 0.6 - k * 0.18, k % 2 ? G.lbox : M.dark, cwx + 0.1 + k * 0.03, PY, zz);
    } else if (i === 2) {     // 3 「眼镜」:头 + 面罩 + 两对引号刻线(红线的几何形)
      cyl(0.16, 0.16, 0.05, 16, M.dark, cwx + 0.1, PY + 0.1, zz, 'X');
      box(0.06, 0.1, 0.3, G.lboxQ, cwx + 0.12, PY + 0.12, zz);    // 面罩(青,存疑色)
      for (const sq of [-1, 1]) for (const q of [0, 1])
        box(0.04, 0.1, 0.03, M.dark, cwx + 0.1, PY + 0.34, zz + sq * (0.22 + q * 0.05));
    } else if (i === 3) {     // 4 B 里造 C:斜嵌套
      box(0.05, 0.6, 0.44, M.dark, cwx + 0.1, PY - 0.05, zz);
      const c = box(0.05, 0.3, 0.22, G.lbox, cwx + 0.13, PY, zz);
      c.rotation.x = 0.3;
    } else if (i === 4) {     // 5 找裂缝:放大镜
      cyl(0.15, 0.15, 0.04, 16, M.dark, cwx + 0.1, PY + 0.12, zz + 0.06, 'X');
      const h = box(0.04, 0.34, 0.07, M.dark, cwx + 0.1, PY - 0.18, zz - 0.12);
      h.rotation.x = -0.7;
    } else if (i === 5) {     // 6 move(x',t'):一行「代码」色块
      for (let k = 0; k < 4; k++) box(0.04, 0.09, 0.16, k === 0 ? G.lboxQ : M.dark, cwx + 0.1, PY + 0.12 - k * 0.16, zz + 0.1 - k * 0.04);
    } else {                  // 7 51/49 之问:两条几乎等长,不给答案
      box(0.05, 0.14, 0.62, G.lbox, cwx + 0.1, PY + 0.16, zz - 0.01);   // 51(琥珀,略长)
      box(0.05, 0.14, 0.58, M.dark, cwx + 0.1, PY - 0.10, zz + 0.01);   // 49(暗,略短)
    }
    box(0.05, 0.12, 0.22, M.trim, cwx + 0.02, PY - PH / 2 - 0.2, zz);   // 编号小牌
  }
  // 手稿恒湿展柜(独立柜,页面微倾;环控单元绿灯)
  const vx = -11.6, vz = -5.6;
  box(1.3, 0.85, 0.95, M.trim, vx, 0.43, vz);                    // 柜身
  box(1.36, 0.05, 1.0, M.steel, vx, 0.88, vz);                   // 台口
  box(1.2, 0.62, 0.85, M.glass, vx, 1.22, vz);                   // 玻璃罩
  const pg = box(0.52, 0.02, 0.72, M.page, vx, 1.06, vz);        // 手稿页
  pg.rotation.x = -0.28;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++)        // 页面淡格(七格手稿的影子,页面局部坐标)
    box(0.2, 0.006, 0.28, M.wallLow, -0.13 + c * 0.26, 0.012, -0.22 + r * 0.24, 0, pg);
  box(0.4, 0.5, 0.5, M.steel, vx + 0.9, 0.25, vz);               // 环控单元
  box(0.2, 0.1, 0.03, G.envOk, vx + 0.9, 0.56, vz + 0.26);       // RH/T 正常绿窗
  box(0.6, 0.3, 0.04, M.white, vx, 0.55, vz + 0.5);              // 规格展签

  /* ==========================================================
   * D. 展区 5 保存科学角(西墙 z -11 ~ -14)
   * ========================================================== */
  // 环控展柜剖切(展示「柜子本身」:玻璃-密封-缓冲三层)
  const cx5 = xL + 1.1, cz5 = -11.8;
  box(1.6, 1.5, 0.16, M.trim, cx5, 1.1, cz5, Math.PI / 2);       // 背板(贴西墙,朝 +X)
  box(0.06, 1.1, 0.5, M.glass, cx5 + 0.22, 1.15, cz5 - 0.3);     // 层1 UV 滤除玻璃
  box(0.06, 1.1, 0.5, M.orange, cx5 + 0.1, 1.15, cz5 + 0.32);    // 层2 密封框
  box(0.4, 0.12, 0.5, M.silica, cx5 + 0.3, 0.5, cz5 + 0.3);      // 层3 硅胶缓冲盘
  box(0.16, 0.08, 0.16, M.steel, cx5 + 0.3, 0.62, cz5 - 0.3);    // 温湿传感器块
  // UV 三通道柱(与 sci-uv-01 同色码:紫/蓝/琥珀)
  const ux = xL + 0.9, uz = -13.4;
  cyl(0.09, 0.11, 1.5, 10, M.steel, ux, 0.75, uz);
  cyl(0.1, 0.1, 0.09, 12, G.uvC, ux, 1.28, uz);
  cyl(0.1, 0.1, 0.09, 12, G.uvB, ux, 1.12, uz);
  cyl(0.1, 0.1, 0.09, 12, G.uvA, ux, 0.96, uz);
  box(0.9, 0.5, 0.05, M.white, xL + 0.35, 1.9, -13.0, Math.PI / 2); // 「天堂/地狱」展签

  /* ==========================================================
   * E. 展区 4 火星物质厅(西后角 + 后墙西半)
   * ========================================================== */
  // 岩芯架(2 列 × 4 层,展示级复制芯——监管链原芯在 sci-astro-01)
  const kx = -11.5, kz = zB + 0.75;
  box(2.4, 2.0, 0.5, M.steel, kx, 1.0, kz);
  box(2.5, 0.08, 0.6, M.trim, kx, 2.06, kz);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++)
    cyl(0.045, 0.045, 0.85, 10, r % 2 ? M.coreA : M.coreB, kx - 0.55 + c * 1.1, 0.4 + r * 0.45, kz + 0.28, 'X');
  // 风化层剖面柱(玻璃管内 6 层)
  const sx4 = -13.2, sz4 = -17.5;
  cyl(0.3, 0.34, 0.25, 14, M.trim, sx4, 0.12, sz4);
  const layers = [0x9a6a4a, 0x8a5f44, 0x7d5238, 0x6e4a33, 0x4a4038, 0x35302c];
  for (let i = 0; i < 6; i++)
    cyl(0.2, 0.2, 0.3, 14, new THREE.MeshStandardMaterial({ color: layers[i], roughness: 0.95 }), sx4, 0.4 + i * 0.3, sz4);
  cyl(0.24, 0.24, 1.95, 14, M.glass, sx4, 1.25, sz4);
  // 陨石(铁镍,独立底座 + 玻璃罩)
  const mx4 = -9.0, mz4 = -17.5;
  box(0.6, 1.0, 0.6, M.white, mx4, 0.5, mz4);
  const met = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), M.meteor);
  met.position.set(mx4, 1.36, mz4); met.scale.set(1, 0.75, 0.9); met.rotation.y = 0.7;
  group.add(met);
  box(0.55, 0.55, 0.55, M.glass, mx4, 1.42, mz4);
  // 尘暴滤芯对比(新/半程/尘暴后)
  const fx4 = -6.2, fz4 = zB + 0.7;
  box(1.9, 1.4, 0.3, M.steel, fx4, 1.1, fz4);
  const fcols = [0xf2efe8, 0xb08868, 0x7d3f28];
  for (let i = 0; i < 3; i++)
    cyl(0.13, 0.13, 0.5, 12, new THREE.MeshStandardMaterial({ color: fcols[i], roughness: 0.9 }), fx4 - 0.55 + i * 0.55, 1.15, fz4 + 0.28, 'X');
  box(0.8, 0.3, 0.04, M.white, fx4, 0.5, fz4 + 0.2);             // 分工展签(展示件 vs 研究件)

  /* ==========================================================
   * F. 空墙(后墙正中):全馆情感锚点
   *    一整面留白 + 一块小展签 + 一条长凳 + 一盏射灯——认真做的「什么都没有」
   * ========================================================== */
  box(6.0, 3.4, 0.14, M.white, 0, 1.85, zB + 0.1);               // 留白面(微凸出后墙)
  box(6.3, 0.12, 0.2, M.trim, 0, 3.62, zB + 0.12);               // 上压条
  box(6.3, 0.12, 0.2, M.trim, 0, 0.1, zB + 0.12);                // 下压条
  box(0.44, 0.2, 0.04, M.white, 0, 1.25, zB + 0.2);              // 小展签(唯一的字在卡里)
  box(0.5, 0.24, 0.02, M.trim, 0, 1.25, zB + 0.18);
  // 射灯(顶轨 + 灯头斜指空墙)
  box(1.6, 0.08, 0.12, M.trim, 0, RH - 0.1, zB + 1.6);
  const sp = cyl(0.09, 0.12, 0.3, 10, M.dark, 0, RH - 0.3, zB + 1.55);
  sp.rotation.x = 0.5;
  box(0.12, 0.03, 0.03, G.spot, 0, RH - 0.42, zB + 1.48);
  // 长凳(面朝空墙)
  box(2.2, 0.09, 0.5, M.white, 0, 0.46, zB + 3.2);
  for (const s of [-1, 1]) box(0.12, 0.42, 0.45, M.trim, s * 0.85, 0.21, zB + 3.2);

  /* ==========================================================
   * G. 展区 2 毅力号厅(东后):1:1 复制品 + 实时数据屏
   * ========================================================== */
  function makeRover() {
    const g = new THREE.Group();   // 本地:轮底 y=0,车头朝 +Z
    // 车体(WEB 结构):底盘 + 侧板 + 顶甲板
    box(2.2, 0.55, 1.65, M.rvBody, 0, 0.95, 0, 0, g);
    box(2.3, 0.06, 1.75, M.rvDeck, 0, 1.26, 0, 0, g);
    box(0.5, 0.12, 0.5, M.rvGold, -0.6, 1.33, -0.2, 0, g);       // 甲板上 MMRTG 窗/设备箱
    box(0.4, 0.18, 0.3, M.rvBody, 0.5, 1.36, 0.3, 0, g);
    // MMRTG(尾部,8 片散热鳍)
    const rtg = new THREE.Group(); rtg.position.set(0, 1.05, -1.15); rtg.rotation.x = -0.15; g.add(rtg);
    cyl(0.32, 0.32, 0.66, 12, M.rvRtg, 0, 0, 0, 'Z', rtg);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const fin = box(0.05, 0.5, 0.5, M.rvRtg, Math.cos(a) * 0.3, Math.sin(a) * 0.3, -0.02, 0, rtg);
      fin.rotation.z = a + Math.PI / 2;
    }
    // 桅杆(前左)+ 遥感头(双目)
    cyl(0.05, 0.06, 1.05, 10, M.rvBody, -0.55, 1.85, 0.55, 'Y', g);
    box(0.42, 0.18, 0.2, M.rvBody, -0.55, 2.45, 0.55, 0, g);
    for (const s of [-1, 1]) cyl(0.035, 0.035, 0.06, 10, M.dark, -0.55 + s * 0.12, 2.45, 0.66, 'Z', g);
    box(0.1, 0.12, 0.1, M.dark, -0.55, 2.32, 0.62, 0, g);        // SuperCam 下颌
    // 高增益天线(六边形碟,后甲板)+ UHF 螺旋
    cyl(0.05, 0.05, 0.35, 8, M.steel, 0.7, 1.45, -0.55, 'Y', g);
    const hga = cyl(0.28, 0.28, 0.05, 6, M.rvGold, 0.7, 1.7, -0.55, 'Y', g);
    hga.rotation.x = 0.5;
    cyl(0.08, 0.08, 0.4, 10, M.rvBody, -0.75, 1.5, -0.65, 'Y', g);
    // 机械臂(折叠于车头):肩-肘-腕三段 + 转塔
    box(0.14, 0.14, 0.7, M.rvBody, 0.35, 0.85, 0.95, 0, g);
    box(0.12, 0.12, 0.6, M.rvBody, -0.15, 0.8, 1.05, 0.3, g);
    cyl(0.16, 0.16, 0.22, 10, M.rvDeck, -0.45, 0.8, 1.0, 'Z', g);
    // 摇臂转向架 + 6 轮(r 0.2625)
    const wy = 0.2625, wz = [1.05, 0.15, -0.95];
    for (const s of [-1, 1]) {
      const rk = new THREE.Group(); rk.position.set(s * 0.95, 0, 0); g.add(rk);
      // 摇臂(粗盒近似)
      box(0.09, 0.09, 1.15, M.rvBody, s * 0.06, 0.75, 0.62, 0.35 * s === 0 ? 0 : 0, rk);
      const arm1 = box(0.09, 0.09, 1.3, M.rvBody, s * 0.06, 0.7, 0.55, 0, rk); arm1.rotation.x = 0.35;
      const arm2 = box(0.09, 0.09, 1.1, M.rvBody, s * 0.06, 0.62, -0.5, 0, rk); arm2.rotation.x = -0.3;
      for (let i = 0; i < 3; i++) {
        cyl(wy, wy, 0.42, 16, M.rvWheel, s * 0.12, wy, wz[i], 'X', rk);
        cyl(0.1, 0.1, 0.44, 10, M.rvHub, s * 0.12, wy, wz[i], 'X', rk);
        cyl(0.04, 0.04, 0.5, 8, M.rvBody, s * 0.12, wy + 0.34, wz[i], 'Y', rk); // 轮柱
      }
    }
    return g;
  }
  const rover = makeRover();
  rover.position.set(8.2, 0.16, -16.2);
  rover.rotation.y = -0.6;
  group.add(rover);
  // 低台 + 护栏(安全橙立柱 + 顶杆)
  box(6.2, 0.16, 5.2, M.floor, 8.2, 0.08, -16.2);
  box(6.4, 0.05, 5.4, M.trim, 8.2, 0.025, -16.2);
  {
    const px = [5.3, 11.1], pz = [-13.8, -18.6];
    const posts = [];
    for (const zz of pz) for (let i = 0; i < 4; i++) posts.push([px[0] + i * (px[1] - px[0]) / 3, zz]);
    for (const xx of px) posts.push([xx, -16.2]);
    for (const [xx, zz] of posts) cyl(0.035, 0.035, 0.75, 6, M.orange, xx, 0.38, zz);
    for (const zz of pz) box(px[1] - px[0], 0.06, 0.06, M.orange, 8.2, 0.78, zz);
    for (const xx of px) box(0.06, 0.06, pz[0] - pz[1], M.orange, xx, 0.78, -16.2);
  }

  // —— 实时数据屏(东墙 z -13 ~ -19,朝 -X):sol + 里程 + 途经点折线 + 署名牌 ——
  const scx = xR - 0.22, scz = -16.0;
  box(0.12, 3.0, 6.4, M.trim, scx, 2.0, scz);                    // 屏框
  box(0.06, 2.7, 6.1, G.screen, scx - 0.06, 2.0, scz);           // 深蓝屏底
  // sol 数字(七段,4 位:1947)
  // 七段(屏面 y-z 平面,面朝 -X;观者右手 = +Z):横段 h=Tk/w=L,竖段 h=L/w=Tk
  const SEG = { 1: 'bc', 4: 'bcfg', 7: 'abc', 9: 'abcdfg' };
  function digit(n, dy, dz, s) {
    const L = s, Tk = s * 0.16;
    const segs = { a: [L, 0, Tk, L], d: [-L, 0, Tk, L], g: [0, 0, Tk, L],
                   b: [L / 2, L / 2, L, Tk], c: [-L / 2, L / 2, L, Tk],
                   e: [-L / 2, -L / 2, L, Tk], f: [L / 2, -L / 2, L, Tk] };
    for (const k of (SEG[n] || '')) {
      const [oy, oz, h, w] = segs[k];
      box(0.03, h, w, G.sol, scx - 0.1, dy + oy, dz + oz);
    }
  }
  const solDigits = [1, 9, 4, 7];   // 左→右 = z 增方向
  for (let i = 0; i < 4; i++) digit(solDigits[i], 2.9, scz + 0.5 + i * 0.62, 0.24);
  box(0.03, 0.06, 1.6, G.amber, scx - 0.1, 2.25, scz + 1.7);     // 「sol」标签条
  box(0.03, 0.06, 1.1, G.amber, scx - 0.1, 2.1, scz + 1.95);     // 里程条(11.9 km 刻度)
  // 途经点折线(mission.json waypoints 归一化到 2.6(z) × 1.9(y) 面板;终点红点=现在)
  const WPS = [ // [x, z] 火星本地坐标(米),取 in=true 主干 24 点
    [570, -894], [645, -850], [485, -565], [640, -26], [335, -7], [119, -262],
    [25, -185], [627, -661], [658, -851], [766, -1153], [1206, -1631], [1270, -1852],
    [89, -2136], [-455, -1899], [-1279, -1532], [-1855, -1456], [-2260, -1246],
    [-1930, -1361], [-1839, -1650], [-2175, -1904], [-2680, -2716], [-2926, -2660],
    [-3259, -2410], [-3638, -2477],
  ];
  {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const [wx, wz] of WPS) { x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz); }
    const szn = 2.6 / (x1 - x0), syn = 1.9 / (z1 - z0);
    for (let i = 0; i < WPS.length; i++) {
      const [wx, wz] = WPS[i];
      const pz = scz - 1.5 + (wx - x0) * szn;                    // 火星 x → 屏横向
      const py = 0.65 + (wz - z0) * syn;                          // 火星 z → 屏纵向
      box(0.03, 0.055, 0.055, i === WPS.length - 1 ? roverDot : G.way, scx - 0.1, py, pz);
      if (i === WPS.length - 1) box(0.03, 0.14, 0.14, roverDot, scx - 0.11, py, pz); // 现在位置放大
    }
  }
  // 署名牌(NASA/JPL/University of Arizona · Mars 2020 公开 API——文字在知识卡)
  box(0.1, 0.5, 2.6, M.trim, scx, 0.45, scz);
  box(0.04, 0.34, 2.4, M.white, scx - 0.08, 0.45, scz);
  box(0.03, 0.06, 2.2, G.way, scx - 0.11, 0.58, scz);

  /* ==========================================================
   * H. 展区 3 建城纪年厅(东墙 z -1.5 ~ -11.5):时间轴 + 文物底座
   * ========================================================== */
  const twx = xR - 0.24;
  box(0.08, 0.5, 10.2, M.band, twx, 1.72, -6.6);                 // 锈色时间轴带
  box(0.08, 0.06, 10.2, M.trim, twx, 2.02, -6.6);
  box(0.08, 0.06, 10.2, M.trim, twx, 1.42, -6.6);
  // 12 块里程碑牌(区域码配色小芯片:pwr 琥珀/veh 红/res 青/hab 绿/ops 紫)
  const MST = [ // [z 位, 芯片色] 顺序=DESIGN.md §5
    0xe0aa48, 0xd86153, 0xa97fd8, 0x63b4d8, 0xd86153, 0x7fb069,
    0xa97fd8, 0x7fb069, 0x7fb069, 0xe0aa48, 0xe0aa48, 0x63b4d8,
  ];
  for (let i = 0; i < 12; i++) {
    const zz = -1.9 - i * 0.855;
    box(0.1, 0.42, 0.58, M.trim, twx - 0.02, 2.55, zz);
    box(0.05, 0.34, 0.5, M.white, twx - 0.08, 2.55, zz);
    box(0.04, 0.09, 0.09, new THREE.MeshStandardMaterial({ color: MST[i], roughness: 0.6 }), twx - 0.12, 2.62, zz + 0.16);
    box(0.06, 0.16, 0.04, M.band, twx - 0.04, 1.72, zz);          // 轴上日期刻
  }
  // 留白延伸段(时间轴继续,但还没有牌子——与空墙呼应)
  box(0.08, 0.5, 1.6, M.wallLow, twx, 1.72, -12.5);
  box(0.1, 0.42, 0.58, M.trim, twx - 0.02, 2.55, -12.5);          // 空牌(只有框)
  // 6 座文物底座(玻璃罩;沿东墙内侧一列)
  const artifacts = [
    (x, z) => box(0.34, 0.13, 0.17, M.brick, x, 1.18, z, 0.3),                       // 1 首砖 001
    (x, z) => { const t = cyl(0.16, 0.16, 0.06, 6, M.tps, x, 1.16, z); t.rotation.x = 0.25; }, // 2 烧蚀防热瓦
    (x, z) => { cyl(0.05, 0.05, 0.26, 10, M.glass, x, 1.25, z); cyl(0.042, 0.042, 0.16, 10, M.water, x, 1.21, z); }, // 3 首罐井水
    (x, z) => { const w = cyl(0.11, 0.11, 0.012, 24, M.wafer, x, 1.16, z); w.rotation.x = -0.5; }, // 4 MB-1 晶圆
    (x, z) => { const s = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.045, 8, 18), M.fiber); s.position.set(x, 1.2, z); s.rotation.x = 1.57; group.add(s); cyl(0.03, 0.03, 0.16, 8, M.steel, x, 1.2, z); }, // 5 玄武岩纤维卷
    (x, z) => { const g2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), M.slag); g2.position.set(x, 1.2, z); g2.scale.set(1, 0.7, 0.9); group.add(g2); }, // 6 熔渣样
  ];
  for (let i = 0; i < 6; i++) {
    const zz = -2.3 - i * 1.75, xx = xR - 1.65;
    box(0.5, 1.05, 0.5, M.white, xx, 0.53, zz);
    box(0.56, 0.05, 0.56, M.trim, xx, 1.08, zz);
    artifacts[i](xx, zz);
    box(0.44, 0.44, 0.44, M.glass, xx, 1.33, zz);
    box(0.3, 0.12, 0.03, M.white, xx, 0.7, zz + 0.27);            // 底座小签
  }

  /* ==========================================================
   * I. 顶灯板阵 + 贴地归一化 + userData
   * ========================================================== */
  for (const gx of [-10, -3.5, 3.5, 10]) {
    for (const gz of [-3, -8.5, -14, -19]) {
      box(1.3, 0.06, 0.65, G.panel, gx, RH - 0.12, gz);
      box(1.4, 0.05, 0.75, M.trim, gx, RH - 0.06, gz);
    }
  }

  /* ---------------- POI 锚点 ---------------- */
  poi('origin', xL + 1.2, 1.9, -5.8);        // 起源厅(七格墙+手稿柜)
  poi('conserve', xL + 1.2, 1.5, -12.6);     // 保存科学角
  poi('materials', -9.5, 1.4, -18.5);        // 火星物质厅
  poi('emptywall', 0, 1.7, zB + 1.2);        // 空墙
  poi('rover', 8.2, 1.6, -16.2);             // 毅力号厅
  poi('timeline', xR - 1.2, 1.9, -6.6);      // 建城纪年厅

  /* ---------------- 贴地归一化 ---------------- */
  const bb = new THREE.Box3().setFromObject(group);
  const dy = isFinite(bb.min.y) ? bb.min.y : 0;
  if (Math.abs(dy) > 1e-4) for (const c of group.children) c.position.y -= dy;

  group.userData = {
    nightMats,
    blinkMats,
    lights: [
      { color: 0xfff4d8, pos: [0, 4.0 - dy, -3], range: 14 },       // 门厅
      { color: 0xffe6c0, pos: [-12, 3.2 - dy, -6], range: 10 },     // 起源厅暖
      { color: 0xfff4d8, pos: [-10, 3.6 - dy, -17], range: 12 },    // 物质厅
      { color: 0xfff0d0, pos: [0, 3.6 - dy, -19.5], range: 8 },     // 空墙射灯
      { color: 0xcfe0ff, pos: [8, 3.8 - dy, -16], range: 12 },      // 毅力号厅冷白
      { color: 0x4aa6ff, pos: [13.5, 2.2 - dy, -16], range: 6 },    // 数据屏蓝辉
      { color: 0xffe6c0, pos: [13, 3.4 - dy, -6], range: 10 },      // 纪年厅
    ],
    beams: [],
    entry: { pos: [0, 0, -2.0], yaw: 0 },
    exitZone: { pos: [0, 0.5], radius: 1.0 },
  };
  return group;
}
