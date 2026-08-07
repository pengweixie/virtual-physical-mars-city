// TT-1「听涛」空间引力波探测星 — 外观结构 code 资产（契约按 mars/MODELS.md §4）。
//
// 设计输入（全部取自本项目仿真战役, 见 gravity-wave\docs\）:
//   * 无拖曳阻力自由平台 —— **全星无一个转动部件**（太阳翼体装、无 SADA、无动量轮,
//     微推力器直接抵消光压）: 这是 spinners 为空的物理原因, 不是偷懒。
//   * 双 MOSA 望远镜, 口径 0.40 m, 夹角 60°(星座内角), 遮光罩外伸;
//     呼吸角 ±0.94° 由罩内"在视场内指向"机构吸收 —— 外观上孔径固定。
//   * 十二棱柱体, 对角 ~2.9 m, 高 0.9 m; 顶甲板朝日, GaAs 电池环(需 1.52 m², 富余布满);
//     侧壁金色 MLI, 背日三面黑色 OSR 辐射器(热控 uK 级的散热面)。
//   * 胶体微推力器 4 组 ×2 喷头(25 uN 量程, 0.1 uN 分辨率), 下缘均布。
//   * 对地 X 频段中增益天线 Ø0.35 m, 双轴稳像(唯一的活动件, 进 oscillators);
//     拖尾 20° -> 地距 0.35 AU。星敏 ×2 装底面(避日), 上下各一 LGA。
//   * 科学城原则·剖切: +60° 侧壁整面开放, 露出 MOSA-A 纵剖 —— 望远镜筒、
//     Zerodur 光学平台、GRS 电极笼内 46 mm Au-Pt 检验质量金立方,
//     1064 nm 激光路用深红发光线表意(实为红外, 知识卡注明)。
//
// ORBITAL ASSET — kind:'orbital', 不进 manifest(先例: com-relay-01)。
// 1 单位 = 1 米。原点 = 星体质心。坐标: +Y 朝日(顶甲板法线), 星座平面 = XZ 面,
// 两望远镜孔径朝 az=±30°(az 自 +Z 起算)。THREE 由参数注入, 无 import 无贴图。
// 粗轮廓方针: 细杆截面 ≥0.07 m(轨道视角会整体缩小)。

export const meta = {
  id: 'tt1-sat-01',
  name: 'TT-1「听涛」引力波探测星',
  name_en: 'TT-1 Gravitational-Wave Observatory Spacecraft',
  size_m: 3.74,             // 实测包围盒最大边(validate 回填); 展区变体原点=地面
  size_axis: 'width',
  kind: 'exhibit',          // 地面展区交付(原 orbital 质心原点已由托架抬升)
};

export function build(THREE) {
  const root = new THREE.Group();
  root.name = 'tt1-sat-01';

  // ---------------------------------------------------------------- 材质
  const L = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const S = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, ...o });
  const M = {
    mliGold: L(0xb9902f),
    mliSeam: L(0x9a7826),
    osr: S(0x0c0d11, { metalness: 0.35, roughness: 0.5 }),
    frame: L(0xa6a8ab),
    steel: L(0x8a8d92),
    dark: L(0x3a3d42),
    innerDark: L(0x2b2f36, { emissive: 0x2b2f36, emissiveIntensity: 0.35 }),
    shield: L(0xd9dade),
    cells: L(0x162542),
    zerodur: L(0xc3cec9),
    apBlack: L(0x05060a),
    reflector: L(0xe9e9ec, { side: THREE.DoubleSide }),
    horn: L(0xcaa43c),
    tmGold: S(0xd4af37, { metalness: 0.85, roughness: 0.32,
      emissive: 0x594410, emissiveIntensity: 0.55 }),
    cage: L(0x6b6f76, { emissive: 0x6b6f76, emissiveIntensity: 0.25 }),
    zerodurI: L(0xc3cec9, { emissive: 0xc3cec9, emissiveIntensity: 0.22 }),
    steelI: L(0x8a8d92, { emissive: 0x8a8d92, emissiveIntensity: 0.2 }),
    darkI: L(0x3a3d42, { emissive: 0x3a3d42, emissiveIntensity: 0.22 }),
    hornI: L(0xcaa43c, { emissive: 0xcaa43c, emissiveIntensity: 0.22 }),
  };
  // 1064 nm 实为红外; 展示约定用深红发光线表意(知识卡注明)
  const laserMat = L(0x2a070c, { emissive: 0xff2d3d, emissiveIntensity: 0.95 });
  const beaconMat = L(0x2a0606, { emissive: 0xff2a1e, emissiveIntensity: 0.0 });

  // ---------------------------------------------------------------- 工具
  function box(w, h, d, mat, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  }
  function cyl(rT, rB, h, mat, x, y, z, seg, parent) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg || 16), mat);
    m.position.set(x, y, z);
    (parent || root).add(m);
    return m;
  }
  function poi(name, x, y, z) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + name;
    a.position.set(x, y, z);
    root.add(a);
  }
  const D2R = Math.PI / 180;

  // ---------------------------------------------------------------- 体壳
  const NF = 12, RC = 1.45, H = 0.9;
  const AP = RC * Math.cos(Math.PI / NF);            // 内切半径 1.4006
  const FW = 2 * RC * Math.sin(Math.PI / NF);        // 棱面宽 0.7506
  const BAY_KS = new Set([2, 3]);                    // az=60/90° 双面剖切舱
  const OSR_K = new Set([5, 6, 7]);                  // az=150/180/210 辐射器
  for (let k = 0; k < NF; k++) {
    if (BAY_KS.has(k)) continue;                     // 剖切面留空
    const az = k * 30 * D2R;
    const mat = OSR_K.has(k) ? M.osr : M.mliGold;
    const f = box(FW, H, 0.06, mat,
      Math.sin(az) * AP, 0, Math.cos(az) * AP);
    f.rotation.y = az;
    if (OSR_K.has(k)) {                              // OSR 面板分格压条
      const t1 = box(FW, 0.05, 0.02, M.frame,
        Math.sin(az) * (AP + 0.035), 0, Math.cos(az) * (AP + 0.035));
      t1.rotation.y = az;
    }
  }
  // 棱线密封压条(MLI 接缝) ×12
  for (let k = 0; k < NF; k++) {
    const az = (k * 30 + 15) * D2R;
    const r = box(0.07, H + 0.03, 0.07, M.mliSeam,
      Math.sin(az) * (RC - 0.01), 0, Math.cos(az) * (RC - 0.01));
    r.rotation.y = az;
  }
  // 上下箍环(棱面对齐的横压条) ×12×2
  for (let k = 0; k < NF; k++) {
    if (BAY_KS.has(k)) continue;
    const az = k * 30 * D2R;
    for (const sy of [0.44, -0.44]) {
      const g = box(FW + 0.02, 0.08, 0.08, M.frame,
        Math.sin(az) * (AP + 0.02), sy, Math.cos(az) * (AP + 0.02));
      g.rotation.y = az;
    }
  }

  // ---------------------------------------------------------------- 顶甲板(朝日)
  cyl(1.5, 1.5, 0.06, M.frame, 0, 0.48, 0, NF);                 // 甲板基板
  const pv = new THREE.Mesh(
    new THREE.CylinderGeometry(1.32, 1.32, 0.05, NF),
    [M.frame, M.cells, M.frame]);                               // 侧/顶/底
  pv.position.y = 0.535;
  root.add(pv);
  cyl(0.68, 0.68, 0.07, M.shield, 0, 0.56, 0, NF);              // 中央热屏蔽区
  // PV 分区辐条 ×6(屏蔽区边 r=0.68 -> PV 外缘 r=1.32)
  for (let k = 0; k < 6; k++) {
    const az = k * 60 * D2R;
    const s = box(0.05, 0.02, 0.64, M.frame,
      Math.sin(az) * 1.0, 0.565, Math.cos(az) * 1.0);
    s.rotation.y = az;
  }
  // 太阳敏感器 ×3 + 顶 LGA + 信标
  for (let k = 0; k < 3; k++) {
    const az = (30 + k * 120) * D2R;
    box(0.08, 0.05, 0.08, M.dark, Math.sin(az) * 0.5, 0.62, Math.cos(az) * 0.5);
  }
  cyl(0.015, 0.05, 0.16, M.shield, 0.18, 0.66, -0.12, 10);      // 顶 LGA 锥
  const beacon = cyl(0.035, 0.035, 0.07, beaconMat, -0.3, 0.63, 0.22, 8);
  beacon.name = 'blink_beacon';

  // ---------------------------------------------------------------- 底部
  cyl(1.44, 1.44, 0.05, M.dark, 0, -0.475, 0, NF);
  cyl(0.60, 0.63, 0.16, M.steel, 0, -0.56, 0, 24);              // 发射适配环
  for (let k = 0; k < 4; k++) {                                  // 分离支架
    const az = (45 + k * 90) * D2R;
    box(0.10, 0.10, 0.24, M.dark, Math.sin(az) * 0.61, -0.55, Math.cos(az) * 0.61)
      .rotation.y = az;
  }
  // 星敏感器 ×2(底面, 避日, 外倾 35°)
  for (const az of [115 * D2R, 245 * D2R]) {
    const st = new THREE.Group();
    st.position.set(Math.sin(az) * 0.92, -0.50, Math.cos(az) * 0.92);
    st.rotation.y = az;
    st.rotation.x = Math.PI - 35 * D2R;                          // 朝下外
    root.add(st);
    cyl(0.09, 0.11, 0.26, M.dark, 0, 0.13, 0, 14, st);
    cyl(0.10, 0.10, 0.04, M.steel, 0, 0.27, 0, 14, st);          // 遮光沿
  }
  cyl(0.015, 0.05, 0.16, M.shield, -0.9, -0.56, 0.35, 10)        // 底 LGA
    .rotation.x = Math.PI;

  // ---------------------------------------------------------------- MOSA ×2
  // 望远镜遮光罩(两个都有); 剖切内部只做 A 侧
  function mosaBaffle(azDeg) {
    const g = new THREE.Group();
    g.rotation.y = azDeg * D2R;
    root.add(g);
    const bf = cyl(0.34, 0.38, 0.55, M.mliGold, 0, 0, AP + 0.22, 20, g);
    bf.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.045, 8, 20), M.frame);
    rim.position.z = AP + 0.50;
    g.add(rim);
    const ap = cyl(0.20, 0.20, 0.03, M.apBlack, 0, 0, AP + 0.485, 20, g);
    ap.rotation.x = Math.PI / 2;
    // 罩口上方遮阳檐(顶甲板日照斜入的防护) + 双撑
    const visor = box(0.78, 0.04, 0.48, M.mliGold, 0, 0.52, AP + 0.30, g);
    visor.rotation.x = -20 * D2R;
    box(0.07, 0.30, 0.07, M.steel, -0.29, 0.40, AP + 0.18, g);
    box(0.07, 0.30, 0.07, M.steel, 0.29, 0.40, AP + 0.18, g);
    return g;
  }
  mosaBaffle(30);
  mosaBaffle(-30);

  // ---------------------------------------------------------------- 剖切舱(az=60+90 双面)
  (function bay() {
    for (const azD of [45, 105]) {                               // 开口两端边柱
      const az = azD * D2R;
      const c = box(0.09, H + 0.03, 0.09, M.frame,
        Math.sin(az) * (RC - 0.02), 0, Math.cos(az) * (RC - 0.02));
      c.rotation.y = az;
    }
    for (const azD of [60, 90]) {                                // 上下门楣 + 灯带
      const az = azD * D2R;
      for (const sy of [0.42, -0.42]) {
        const l = box(FW, 0.09, 0.09, M.frame,
          Math.sin(az) * (AP - 0.01), sy, Math.cos(az) * (AP - 0.01));
        l.rotation.y = az;
      }
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(FW - 0.1, 0.03, 0.05),
        new THREE.MeshLambertMaterial({ color: 0x777c85,
          emissive: 0xcfd8e6, emissiveIntensity: 0.85 }));
      lamp.position.set(Math.sin(az) * (AP - 0.10), 0.36, Math.cos(az) * (AP - 0.10));
      lamp.rotation.y = az;
      root.add(lamp);
    }
    // **修正留档**: 初版在 r=0.68 放"内衬底板", 恰好横在开口与 MOSA 内构之间
    // 把台子全遮死(截图目检抓出)。棱面盒子自带内表面, 无需衬板 —— 删。
    // 只保留设备地板(内构支座落脚)
    const az = 75 * D2R;
    const floor = box(1.5, 0.04, 1.3, M.innerDark,
      Math.sin(az) * 0.62, -0.42, Math.cos(az) * 0.62);
    floor.rotation.y = az;
  })();

  // ---------------------------------------------------------------- MOSA-A 内构
  // 局部系: +z 沿 az=30 向外; 开面(az=60)在局部 +x 侧 -> GRS 开口朝 +x
  const mosa = new THREE.Group();
  mosa.rotation.y = 30 * D2R;
  root.add(mosa);
  (function mosaInner() {
    const tube = cyl(0.26, 0.26, 0.55, M.steelI, 0, 0, 1.10, 18, mosa);
    tube.rotation.x = Math.PI / 2;
    cyl(0.28, 0.28, 0.06, M.darkI, 0, 0, 0.84, 18, mosa)         // M1 镜室
      .rotation.x = Math.PI / 2;
    cyl(0.24, 0.24, 0.02, M.hornI, 0, 0, 0.815, 18, mosa)        // M1 金膜示意
      .rotation.x = Math.PI / 2;
    box(0.55, 0.10, 0.50, M.zerodurI, 0.10, -0.10, 0.50, mosa);  // Zerodur 光学平台
    // 平台支座 ×2(CFRP 撑)
    box(0.08, 0.24, 0.08, M.darkI, -0.06, -0.28, 0.42, mosa);
    box(0.08, 0.24, 0.08, M.darkI, 0.26, -0.28, 0.60, mosa);
    // 台上光学件(粗块): 分束镜座/准直器/折转镜/参考腔
    box(0.10, 0.12, 0.10, M.steelI, -0.08, 0.01, 0.40, mosa);
    box(0.08, 0.10, 0.08, M.darkI, 0.24, 0.0, 0.56, mosa);
    cyl(0.045, 0.045, 0.12, M.hornI, 0.08, 0.01, 0.32, 12, mosa);
    box(0.14, 0.09, 0.09, M.darkI, 0.02, -0.005, 0.64, mosa);
    // GRS 前端电子学箱 + UV 放电小盒(因果链: 电容读出/静电致动/电荷管理)
    box(0.26, 0.18, 0.16, M.steelI, 0.55, -0.32, 0.30, mosa);
    box(0.10, 0.08, 0.08, M.hornI, 0.42, -0.05, 0.16, mosa);
    // GRS: 五面壳体, +x 面开(朝剖切口), 内见电极笼 + Au-Pt 金立方
    const G = new THREE.Group();
    G.position.set(0.30, 0, 0.22);                             // 台边, 靠向剖切口
    G.rotation.y = -45 * D2R;                                  // 开面转向观察口(az75)
    mosa.add(G);
    const t = 0.02, R2 = 0.13;
    box(2 * R2, 2 * R2, t, M.darkI, 0, 0, R2, G);                // ±z
    box(2 * R2, 2 * R2, t, M.darkI, 0, 0, -R2, G);
    box(2 * R2, t, 2 * R2, M.darkI, 0, R2, 0, G);                // ±y
    box(2 * R2, t, 2 * R2, M.darkI, 0, -R2, 0, G);
    box(t, 2 * R2, 2 * R2, M.darkI, -R2, 0, 0, G);               // -x(闭); +x 开
    // 电极笼开口框: 2 竖柱 + 2 横梁(+x 开面内缘)
    for (const sz of [-1, 1])
      box(0.016, 0.20, 0.016, M.cage, 0.09, 0, sz * 0.08, G);
    for (const sy of [-1, 1])
      box(0.016, 0.016, 0.18, M.cage, 0.09, sy * 0.09, 0, G);
    box(0.046, 0.046, 0.046, M.tmGold, 0, 0, 0, G);              // 46 mm 检验质量
    // 激光路(展示约定深红): 平台 -> 望远镜轴 -> 出瞳; 平台 -> GRS
    box(0.03, 0.03, 1.30, laserMat, 0, 0, 1.20, mosa);           // 主测量光路
    box(0.03, 0.03, 0.22, laserMat, 0.06, 0, 0.42, mosa);        // TM 干涉支路
    box(0.03, 0.12, 0.03, laserMat, 0, -0.04, 0.30, mosa);       // 垂直折转示意
  })();

  // ---------------------------------------------------------------- 微推力器
  // LPF 式 3 组 ×120°(每组 2 喷头)。**修正留档**: 初版 4 组含 az90 —— 该面
  // 后来剖掉, 泵组悬空(截图目检抓出); 改 3 组并避开剖切/遮光罩棱面。
  for (const azDeg of [0, 120, 240]) {
    const g = new THREE.Group();
    g.rotation.y = azDeg * D2R;
    root.add(g);
    box(0.26, 0.20, 0.14, M.steel, 0, -0.30, AP + 0.06, g);      // 胶体推力器泵组
    for (const sx of [-0.07, 0.07]) {
      const n = cyl(0.02, 0.05, 0.12, M.dark, sx, -0.30, AP + 0.18, 10, g);
      n.rotation.x = Math.PI / 2 + 20 * D2R;                     // 外倾喷头
    }
    box(0.10, 0.06, 0.05, M.dark, 0.16, -0.42, AP + 0.04, g);    // 供给阀箱
  }

  // ---------------------------------------------------------------- 对地 MGA
  // 唯一的活动件: 双轴稳像座(oscillators), 拖尾 20° 对地 0.35 AU
  const mgaRoot = new THREE.Group();
  mgaRoot.position.set(Math.sin(Math.PI) * 0.9, -0.50, Math.cos(Math.PI) * 0.9);
  root.add(mgaRoot);
  box(0.10, 0.26, 0.10, M.steel, 0, -0.12, 0, mgaRoot);          // 短撑杆
  const mgaYaw = new THREE.Group();
  mgaYaw.name = 'mga_yaw';
  mgaYaw.position.set(0, -0.30, 0);
  mgaRoot.add(mgaYaw);
  cyl(0.07, 0.07, 0.10, M.dark, 0, 0, 0, 14, mgaYaw);            // 方位鼓
  const mgaPitch = new THREE.Group();
  mgaPitch.name = 'mga_pitch';
  mgaPitch.position.set(0, -0.09, 0);
  mgaYaw.add(mgaPitch);
  (function dish() {
    const R = 0.175, f = 0.11;
    const prof = [];
    for (let i = 0; i <= 8; i++) {
      const r = (i / 8) * R;
      prof.push(new THREE.Vector2(r, (r * r) / (4 * f)));
    }
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(prof, 22), M.reflector);
    mgaPitch.add(bowl);
    cyl(0.02, 0.035, 0.10, M.horn, 0, f, 0, 10, mgaPitch);       // 馈源
    mgaPitch.rotation.x = -125 * D2R;                            // 指向侧下(对地)
  })();

  // ---------------------------------------------------------------- 舱面细节
  // 走线导管 + 接线箱(az=120 面); 接地片
  (function harness() {
    const az = 270 * D2R;                                        // 避开推力器组
    const g = new THREE.Group();
    g.rotation.y = az;
    root.add(g);
    box(0.20, 0.14, 0.06, M.dark, 0.12, 0.18, AP + 0.05, g);     // 接线箱
    for (const sx of [0.04, 0.20]) {
      cyl(0.025, 0.025, 0.62, M.steel, sx, -0.12, AP + 0.045, 8, g);
    }
    box(0.10, 0.03, 0.05, M.horn, -0.22, -0.40, AP + 0.045, g);  // 接地片
  })();

  // ---------------------------------------------------------------- POI 锚点
  const azA = 30 * D2R;
  poi('mosa_aperture', Math.sin(azA) * (AP + 0.5), 0, Math.cos(azA) * (AP + 0.5));
  poi('grs_tm', Math.sin(azA) * 0.16, 0, Math.cos(azA) * 0.16);
  poi('bench', Math.sin(azA) * 0.50, -0.16, Math.cos(azA) * 0.50);
  poi('solar_deck', 0, 0.56, 0);
  poi('osr_radiator', Math.sin(Math.PI) * AP, 0, Math.cos(Math.PI) * AP);
  poi('thruster', Math.sin(90 * D2R) * AP, -0.30, Math.cos(90 * D2R) * AP);
  poi('mga', 0, -0.9, -0.95);
  poi('star_tracker', Math.sin(115 * D2R) * 0.92, -0.6, Math.cos(115 * D2R) * 0.92);

  // ---------------------------------------------------------------- 展示台架
  // mars 城地表交付变体: 契约原点=地面(y=0)。把整星抬到托架上, minY>=0。
  (function exhibitStand() {
    const LIFT = 1.95;
    const craft = new THREE.Group();
    craft.name = 'craft';
    for (const ch of [...root.children]) craft.add(ch);
    craft.position.y = LIFT;
    root.add(craft);
    const sM = new THREE.MeshLambertMaterial({ color: 0x8a8d92 });
    const dM = new THREE.MeshLambertMaterial({ color: 0x4a4d52 });
    const oM = new THREE.MeshLambertMaterial({ color: 0xc26a1d });   // 安全橙
    const st = (g2, x, y, z, p2) => { const m = new THREE.Mesh(g2, sM);
      m.position.set(x, y, z); (p2 || root).add(m); return m; };
    // 基座 + 立柱 + 三爪托环
    st(new THREE.CylinderGeometry(1.05, 1.2, 0.22, 24), 0, 0.11, 0);
    st(new THREE.CylinderGeometry(0.16, 0.20, 0.65, 12), 0, 0.5, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 8, 24), dM);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.86; root.add(ring);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.5;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.6, 0.10), dM);
      arm.position.set(Math.sin(a) * 0.72, 1.05, Math.cos(a) * 0.72);
      arm.rotation.y = a; root.add(arm);
    }
    // 展牌(正面 +Z 外 1.6 m)
    st(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), 0, 0.45, 2.1);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.05), dM);
    board.position.set(0, 1.05, 2.1); board.rotation.x = -0.25; root.add(board);
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.02),
      new THREE.MeshLambertMaterial({ color: 0xd8d2c4 }));
    face.position.set(0, 1.06, 2.13); face.rotation.x = -0.25; root.add(face);
    // 护栏桩 x4 (安全橙)
    for (const [px, pz] of [[1.5, 1.5], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5]]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 8), oM);
      m.position.set(px, 0.375, pz); root.add(m);
    }
  })();

  // ---------------------------------------------------------------- userData
  root.userData = {
    // 无拖曳平台: 全星零转动部件 -> spinners 留空是**设计特征**
    oscillators: [
      { node: 'mga_yaw', axis: 'y', amp: 0.38, period: 13 },
      { node: 'mga_pitch', axis: 'x', amp: 0.12, period: 9, phase: 1.3 },
    ],
    blinkMats: [beaconMat],
    nightMats: [beaconMat],
  };
  return root;
}
