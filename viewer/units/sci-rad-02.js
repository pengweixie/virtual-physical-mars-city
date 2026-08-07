// sci-rad-02 —— 聚变围界中子哨兵组(4H-SiC ×3)
// 契约(MODELS.md §4):1u=1m;原点=组中心地面点;+Y 上;THREE 传入;纯色材质。
// 落位:pwr-fusion-01 (-140,40) 南侧弧线,组中心 (-140,98),三柱沿 R=55 m
//   弧线朝堆弯(柱间弧长 ~25 m),各柱 -Z 面(慢化帽)对准堆心。
// 设计输入(mars_rad_sic 四本账):
//   探测叠层 = HDPE 慢化帽 → ⁶LiF 转换层 30 µm(效率峰 4.72%,账1)
//   → 4H-SiC PiN 片 ×4(2 热道贴 LiF + 2 裸快道)→ 铜读出板 → 前放。
//   预期计数 0.21 cps(账2:泄漏 1.9e14 → 生物屏蔽 1e-8 → 55 m 1/r²),
//   屏显"有节奏地跳"(~5 s 周期,确定性哈希,禁 Math.random)。
//   器件与 LGAD 同外延栈(PiN 版免增益层)——同源器件、两种部署。
// 动画约定:animate 只驱动 blip 点/心跳(专属材质);屏底/状态灯进 nightMats
//   (引擎昼夜接管);塔顶信标进 blinkMats——三通道互不重叠(坑账 20/21)。

export const meta = {
  id: 'sci-rad-02',
  name: '聚变围界中子哨兵组(4H-SiC ×3)',
  name_en: 'Fusion-Perimeter Neutron Sentinels (4H-SiC ×3)',
  size_m: 51.1,           // validate 实测包围盒(x 51.08)
  size_axis: 'width',
  effects: [],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = meta.id;
  const nightMats = [];
  const blinkMats = [];

  /* ---------------- 确定性伪随机(禁 Math.random) ---------------- */
  const hash = (k) => { const s = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };

  /* ---------------- 材质 ---------------- */
  const M = {
    concrete: new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.95 }),
    body:     new THREE.MeshStandardMaterial({ color: 0xcfd2cd, roughness: 0.7 }),   // 柱身浅灰白
    trim:     new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.55, metalness: 0.5 }),
    steel:    new THREE.MeshStandardMaterial({ color: 0x6a7076, roughness: 0.5, metalness: 0.6 }),
    orange:   new THREE.MeshStandardMaterial({ color: 0xe07020, roughness: 0.65 }),  // 安全橙
    dark:     new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.7 }),
    hdpe:     new THREE.MeshStandardMaterial({ color: 0xe9e7de, roughness: 0.85 }),  // 慢化帽
    lif:      new THREE.MeshStandardMaterial({ color: 0xf0e2b8, roughness: 0.8 }),   // LiF 转换层(米白偏黄)
    sic:      new THREE.MeshStandardMaterial({ color: 0x25311f, roughness: 0.35, metalness: 0.3 }), // SiC 墨绿
    copper:   new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.4, metalness: 0.7 }),
    cableK:   new THREE.MeshStandardMaterial({ color: 0x191b1e, roughness: 0.8 }),
    rock:     new THREE.MeshStandardMaterial({ color: 0x9e6b48, roughness: 1.0 }),
  };
  // 发光族:屏底/率条/状态灯 → nightMats;blip 点 → animate 专属;信标 → blinkMats
  const mkScreen = () => new THREE.MeshStandardMaterial({ color: 0x0a1410, emissive: 0x2bd478, emissiveIntensity: 0.7, roughness: 0.5 });
  const mkBlip   = () => new THREE.MeshStandardMaterial({ color: 0x1a0d02, emissive: 0xffa030, emissiveIntensity: 0.2, roughness: 0.5 });
  const mkBar    = () => new THREE.MeshStandardMaterial({ color: 0x0c2014, emissive: 0x3ee08a, emissiveIntensity: 1.4, roughness: 0.5 });
  const ledG     = new THREE.MeshStandardMaterial({ color: 0x061a0a, emissive: 0x3ee06a, emissiveIntensity: 1.8, roughness: 0.5 });
  const beaconR  = new THREE.MeshStandardMaterial({ color: 0x2a0806, emissive: 0xff3428, emissiveIntensity: 1.6, roughness: 0.5 });
  nightMats.push(ledG);
  blinkMats.push(beaconR);

  function box(parent, w, h, d, mat, x, y, z, ry = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    parent.add(m);
    return m;
  }
  function cyl(parent, r, h, mat, x, y, z, seg = 10) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  /* ==========================================================
   * 哨兵柱构建器(共享几何;03/04 变体同款主体)
   * 前面 = +Z(计数屏/剖切开口朝巡查路径);-Z 面 = 慢化帽朝辐射源。
   * 返回 {col, blipMat, glowRef} 供 animate 驱动。
   * ========================================================== */
  const litBarsPerimeter = 6;   // 率条 8 段亮 6 = 围界"活跃"的静态身份
  function buildSentinel(seed) {
    const col = new THREE.Group();

    // 基础:混凝土墩(半埋) + 台面
    box(col, 1.3, 0.5, 1.3, M.concrete, 0, 0.25, 0);
    box(col, 0.9, 0.08, 0.9, M.steel, 0, 0.54, 0);
    // 柱身 + 四角包边
    box(col, 0.42, 1.55, 0.42, M.body, 0, 1.355, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      box(col, 0.05, 1.55, 0.05, M.trim, sx * 0.2, 1.355, sz * 0.2);
    // 检修门语法(+Z 面):框 + 扇 + 闩 + 双铰链
    box(col, 0.32, 0.66, 0.03, M.trim, 0, 1.05, 0.215);
    box(col, 0.26, 0.56, 0.04, M.body, 0, 1.05, 0.225);
    box(col, 0.04, 0.09, 0.05, M.dark, 0.09, 1.03, 0.235);
    box(col, 0.05, 0.04, 0.04, M.dark, -0.125, 1.24, 0.23);
    box(col, 0.05, 0.04, 0.04, M.dark, -0.125, 0.86, 0.23);
    // 外走线:-X 侧导管 + 接线箱
    cyl(col, 0.03, 1.5, M.cableK, -0.24, 1.35, 0.1, 8);
    box(col, 0.16, 0.22, 0.12, M.steel, -0.26, 0.75, 0.1);

    // —— 探测舱(剖切开放壳体:顶/底/双侧板,+Z 面敞开露叠层) ——
    const hy = 2.36;                        // 舱中心高
    box(col, 0.62, 0.05, 0.54, M.trim, 0, hy + 0.23, 0);   // 顶板
    box(col, 0.62, 0.05, 0.54, M.trim, 0, hy - 0.23, 0);   // 底板
    box(col, 0.05, 0.41, 0.54, M.body, -0.285, hy, 0);     // 左壁
    box(col, 0.05, 0.41, 0.54, M.body, 0.285, hy, 0);      // 右壁
    box(col, 0.04, 0.41, 0.04, M.trim, -0.27, hy, 0.25);   // 开口面边柱 ×2
    box(col, 0.04, 0.41, 0.04, M.trim, 0.27, hy, 0.25);
    // 叠层因果链(自 -Z 至 +Z,逐层错位露前缘):
    box(col, 0.5, 0.36, 0.12, M.hdpe, 0, hy, -0.31);       // ① HDPE 慢化帽(朝堆,外凸)
    box(col, 0.44, 0.3, 0.02, M.lif, -0.0, hy, -0.14);     // ② ⁶LiF 转换层 30 µm(示意板)
    for (const sx of [-1, 1]) for (const sy of [-1, 1])    // ③ SiC PiN 片 2×2(左列热道/右列快道)
      box(col, 0.17, 0.12, 0.016, M.sic, sx * 0.105, hy + sy * 0.075, -0.07);
    box(col, 0.46, 0.32, 0.014, M.copper, 0, hy, 0.01);    // ④ 铜读出板
    box(col, 0.13, 0.09, 0.07, M.dark, 0.14, hy - 0.12, 0.09); // ⑤ 前放盒
    box(col, 0.02, 0.28, 0.02, M.cableK, -0.18, hy - 0.32, 0.12); // 排线下行

    // —— 计数屏(柱身 +Z 面):框 + 屏底(nightMats) + blip 点(animate) + 率条 ——
    const screenMat = mkScreen(); nightMats.push(screenMat);
    const blipMat = mkBlip();
    box(col, 0.36, 0.26, 0.04, M.trim, 0, 1.74, 0.22);
    box(col, 0.3, 0.2, 0.02, screenMat, 0, 1.74, 0.245);
    box(col, 0.06, 0.06, 0.015, blipMat, 0.08, 1.77, 0.258);
    for (let i = 0; i < 8; i++) {
      const lit = i < litBarsPerimeter;
      const m = lit ? mkBar() : M.dark;
      if (lit) nightMats.push(m);
      box(col, 0.028, 0.024, 0.014, m, -0.115 + i * 0.033, 1.675, 0.258);
    }
    box(col, 0.05, 0.05, 0.02, ledG, -0.12, 1.9, 0.23);    // 状态灯(常绿)

    // —— 桅杆 + 航空信标(blinkMats) ——
    cyl(col, 0.025, 0.5, M.steel, 0, 2.84, 0, 8);
    box(col, 0.08, 0.09, 0.08, beaconR, 0, 3.12, 0);

    // —— 安全橙围栏 1.9×1.9(+Z 侧留检修口) ——
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      box(col, 0.07, 0.95, 0.07, M.orange, sx * 0.95, 0.475, sz * 0.95);
    for (const sz of [-1, 1])
      box(col, 1.9, 0.06, 0.06, M.orange, 0, 0.9, sz * 0.95);
    for (const sx of [-1, 1])
      box(col, 0.06, 0.06, 1.9, M.orange, sx * 0.95, 0.9, 0);
    box(col, 1.9, 0.05, 0.05, M.orange, 0, 0.5, -0.95);    // -Z 中栏
    for (const sx of [-1, 1])
      box(col, 0.05, 0.05, 1.9, M.orange, sx * 0.95, 0.5, 0);

    return { col, blipMat, screenMat, seed };
  }

  /* ==========================================================
   * 三柱沿弧布置:堆心在本地 (0,-58),R=58,柱间弧长 ~25 m
   * 各柱 yaw 使 -Z(慢化帽)指向堆心。
   * ========================================================== */
  const R_ARC = 58, DTH = 25 / R_ARC;    // 弧长 25 m → 0.431 rad
  const sentinels = [];
  const colPos = [];
  for (let i = -1; i <= 1; i++) {
    const th = i * DTH;
    const px = R_ARC * Math.sin(th);
    const pz = -R_ARC + R_ARC * Math.cos(th);   // 中柱 z=0,侧柱 z≈-5.3
    const s = buildSentinel(11 + i * 7);
    s.col.position.set(px, 0, pz);
    s.col.rotation.y = th;                       // -Z 指向 (0,-58)
    group.add(s.col);
    sentinels.push(s);
    colPos.push([px, pz]);
  }

  /* ---------------- 柱间电缆槽 + 中柱汇流箱 ---------------- */
  for (const k of [0, 2]) {
    const [x1, z1] = colPos[1], [x2, z2] = colPos[k];
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz) - 2.2;
    box(group, 0.26, 0.05, len, M.cableK, (x1 + x2) / 2, 0.025, (z1 + z2) / 2, Math.atan2(dx, dz));
  }
  box(group, 0.5, 0.6, 0.3, M.steel, 1.4, 0.3, 0.9);       // 汇流/供电箱
  box(group, 0.04, 0.04, 0.03, ledG, 1.4, 0.52, 1.06);

  /* ---------------- 作业痕迹:确定性散落砾石 ---------------- */
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 18; i++) {
    const a = hash(i * 3.1) * Math.PI * 2, r = 2.5 + hash(i * 7.7) * 26;
    const s = 0.06 + hash(i * 5.3) * 0.12;
    const m = new THREE.Mesh(rockGeo, M.rock);
    m.scale.set(s, s * (0.55 + hash(i * 9.1) * 0.4), s);
    m.position.set(Math.sin(a) * r, 1.62 * s * 0.7 - 0.3 * s, -3 + Math.cos(a) * r * 0.4);
    m.rotation.y = hash(i * 13.7) * Math.PI;
    group.add(m);
  }

  /* ---------------- POI 锚点(中柱) ---------------- */
  for (const [id, y, z] of [
    ['cabin', 2.36, 0.3], ['screen', 1.74, 0.35], ['column', 1.05, 0.4], ['net', 3.1, 0],
  ]) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(0, y, z);
    group.add(a);
  }

  /* ---------------- 尘膜 pass ---------------- */
  const dust = new THREE.Color(0x9e5b3d);
  [M.body, M.trim, M.steel, M.orange, M.concrete, M.hdpe].forEach((m) => m.color.lerp(dust, 0.05));

  /* ==========================================================
   * 动画:确定性计数 blip(围界节奏 ~5 s;账2 = 0.21 cps 的屏上化身)
   * 只驱动 blipMat(专属材质),不碰 nightMats/blinkMats。
   * ========================================================== */
  function blipLevel(t, T, p, seed) {
    const k = Math.floor(t / T);
    if (hash(k * 2.71 + seed + 13.7) > p) return 0;
    const o = hash(k * 1.618 + seed) * (T - 0.9);
    const dt = t - k * T - o;
    return dt >= 0 && dt < 0.8 ? Math.exp(-dt / 0.16) : 0;
  }
  group.userData.animate = (t) => {
    for (const s of sentinels) {
      const lv = blipLevel(t, 5.0, 0.95, s.seed);
      s.blipMat.emissiveIntensity = 0.2 + 3.2 * lv;
    }
  };

  group.userData.nightMats = nightMats;
  group.userData.blinkMats = blinkMats;
  group.userData.lights = [];
  return group;
}
