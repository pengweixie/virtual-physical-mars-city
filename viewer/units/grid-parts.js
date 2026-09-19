// grid-parts.js —— 火星城舱内配电部件库(pwr-grid-01 设计册 r2,E:\Claude\mars-grid)
// 契约:不 import three(THREE 由调用方传入),纯几何 + 纯色材质,米制,每件原点 = 底面中心,+Z 为正面。
// 每个构建函数返回 Group;发光材质放在 group.userData.nightMats,由宿主合并进自己的 userData.nightMats(引擎只读顶层)。
// 尺寸与电气口径来自账本(mars-grid out/13_cabin_distribution.json、14_dc_arc_protection.json、15_mixed_gas_paschen.json):
//   账 13 两级分界:48 V 插座级 ≤1.54 kW(32 A 插头族)/ 400 V 固定接线;85 人公共区 20 路 48 V 插座回路(25 mm² 铝)+ 400 V 馈线 16 mm²
//   账 14 保护:故障电流 = 变流器限流 1.5–2×,热磁断路器磁脱扣永不动作 → 固态断路器(SSCB)+ 电子熔断;
//          400 V 侧禁止带载空气分闸;48 V 插座先握手后上电、断电后分离(48 V 弧 12–79 mm,条件式结论,见账 14)
//   账 14 「地」:IT 制延伸进舱,压力壳 = 等电位参考(绿黄联结排),绝缘监测(IMD)+ 剩余电流监测(RCM),第一故障报警不跳
// 用法:import { GridParts } from './grid-parts.js'; const P = GridParts(THREE); const b = P.cabinBoard(); group.add(b);
//       group.userData.nightMats.push(...(b.userData.nightMats || []));
// 复用方(hab-quarter-01 / hab-home-01 / hab-village-01)放不放、放哪里由它们自己定;本文件不改任何别人的资产。
// 颜色约定与 pwr-grid-01 / home-parts.js 一致:橙 = 400 V 固定接线,蓝 = 48 V 插座级,绿黄 = 等电位联结,红/蓝 = ±10 kV 极(此处不出现)。

export function GridParts(THREE, palette = {}) {
  const std = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const M = Object.assign({
    steel:  std(0x9aa0a8, 0.5, 0.45),      // 柜体钢板(res-foundry-01 铸/轧件)
    dark:   std(0x22262c, 0.6),            // 模块外壳
    white:  std(0xe6e2d8, 0.62),           // 铭牌
    orange: std(0xd8742a, 0.6),            // 400 V 固定接线
    blue:   std(0x2a6aa8, 0.6),            // 48 V 插座级
    bond:   std(0x86b03a, 0.6),            // 等电位联结(绿)
    bondY:  std(0xd8c832, 0.6),            // 等电位联结(黄)
    copper: std(0xb87333, 0.42, 0.7),      // 母排
    fin:    std(0x8d9298, 0.55, 0.5),      // 变流器散热片
    rubber: std(0x1a1a1a, 0.95),
  }, palette);
  const G = {
    green: new THREE.MeshStandardMaterial({ color: 0x11220f, emissive: 0x4fe86a, emissiveIntensity: 1.8 }),   // IMD 绝缘正常 / 回路合
    amber: new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 1.8 }),   // 握手中 / 第一故障报警
    red:   new THREE.MeshStandardMaterial({ color: 0x2a0a0a, emissive: 0xff4a3a, emissiveIntensity: 1.6 }),   // SSCB 已分断
    screen: new THREE.MeshStandardMaterial({ color: 0x0a2a30, emissive: 0x4fd8e8, emissiveIntensity: 1.4 }),  // 绝缘电阻屏
  };
  function box(w, h, d, mat, x, y, z, parent, ry = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
  }
  function cyl(r, h, mat, x, y, z, parent, seg = 10, rx = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, y, z); m.rotation.set(rx, 0, rz); parent.add(m); return m;
  }
  const night = (g, ...mats) => { (g.userData.nightMats = g.userData.nightMats || []).push(...mats); };
  const P = {};

  // ---- 固态断路器模块(SSCB):账 14 —— 变流器限流下热磁断路器永不脱扣,舱内保护只能是电子的 --------------
  // 尺寸 0.045 w × 0.09 h × 0.07 d;tier 'orange'|'blue' 决定色条;state 'on'|'trip'|'shake'
  P.sscb = (tier = 'orange', state = 'on') => {
    const g = new THREE.Group();
    box(0.045, 0.09, 0.07, M.dark, 0, 0.045, 0, g);
    box(0.040, 0.012, 0.004, tier === 'orange' ? M.orange : M.blue, 0, 0.078, 0.037, g);       // 电压级色条
    const led = state === 'trip' ? G.red : (state === 'shake' ? G.amber : G.green);
    box(0.010, 0.010, 0.004, led, 0.012, 0.055, 0.037, g);                                          // 状态灯
    box(0.018, 0.020, 0.006, M.rubber, -0.008, 0.035, 0.038, g);                                     // 隔离手柄(µs 封锁之后才允许拉)
    night(g, led);
    return g;
  };

  // ---- 等电位联结排(账 14 「地」):绿黄相间,螺柱数由长度定;不是接地极,是壳体参考 --------------------------
  P.bondingBar = (length = 0.6) => {
    const g = new THREE.Group();
    const n = Math.max(2, Math.round(length / 0.10));
    for (let i = 0; i < n; i++)
      box(length / n, 0.03, 0.006, i % 2 ? M.bondY : M.bond, -length / 2 + (i + 0.5) * length / n, 0.015, 0, g);
    for (let i = 0; i < n; i += 2)
      cyl(0.006, 0.02, M.copper, -length / 2 + (i + 0.5) * length / n, 0.015, 0.012, g, 8, Math.PI / 2);   // 螺柱
    for (const s of [-1, 1]) box(0.02, 0.05, 0.02, M.rubber, s * (length / 2 - 0.02), 0.025, -0.012, g);   // 绝缘子座
    return g;
  };

  // ---- 48 V 插座(账 13/14):蓝面板,先导触点握手灯;≤1.54 kW,32 A ------------------------------------------
  P.socketOutlet48 = () => {
    const g = new THREE.Group();
    box(0.12, 0.12, 0.03, M.blue, 0, 0.06, 0, g);
    box(0.05, 0.05, 0.006, M.dark, 0, 0.055, 0.016, g);                                             // 插孔座
    for (const x of [-0.012, 0.012]) box(0.006, 0.02, 0.004, M.copper, x, 0.055, 0.019, g);           // 两极
    box(0.004, 0.012, 0.004, M.copper, 0, 0.038, 0.019, g);                                          // 先导触点(先握手后上电)
    const led = G.amber;
    box(0.010, 0.006, 0.004, led, 0.035, 0.10, 0.017, g);                                            // 握手灯
    night(g, led);
    return g;
  };

  // ---- 舱内两级配电柜(账 13/14/15):橙 400 V 固定接线列 + 蓝 48 V 插座级列 + 绿黄联结排 + IMD 屏 ------------
  // 0.80 w × 1.20 h × 0.25 d;原点底面中心,+Z 正面。开门露模块。
  P.cabinBoard = (opts = {}) => {
    const o = Object.assign({ feeders400: 6, circuits48: 20, tripped: 0, shaking: 1 }, opts);
    const g = new THREE.Group();
    const W = 0.80, H = 1.20, D = 0.25;
    box(W, H, 0.02, M.steel, 0, H / 2, -D / 2 + 0.01, g);                                            // 背板(贴壳)
    box(0.02, H, D, M.steel, -W / 2 + 0.01, H / 2, 0, g);
    box(0.02, H, D, M.steel, W / 2 - 0.01, H / 2, 0, g);
    box(W, 0.02, D, M.steel, 0, H - 0.01, 0, g);
    box(W, 0.02, D, M.steel, 0, 0.01, 0, g);
    box(0.36, H - 0.04, 0.015, M.steel, -W / 2 - 0.16, H / 2, D / 2 - 0.01, g, -1.9);               // 左门开 ~110°
    box(0.36, H - 0.04, 0.015, M.steel, W / 2 + 0.16, H / 2, D / 2 - 0.01, g, 1.9);                  // 右门
    box(W - 0.06, 0.06, 0.01, M.white, 0, H - 0.07, D / 2 - 0.02, g);                                // 铭牌:两级配电 / IT 制
    box(0.30, 0.012, 0.004, M.orange, -0.18, H - 0.07, D / 2 - 0.013, g);
    box(0.30, 0.012, 0.004, M.blue, 0.18, H - 0.07, D / 2 - 0.013, g);
    // 400 V 列(左,橙):进线 SSCB + IMD + 馈线 SSCB
    const xL = -0.22, y0 = H - 0.16;
    box(0.30, 0.008, 0.02, M.copper, xL, y0 + 0.02, -0.06, g);                                       // 400 V 母排 +
    box(0.30, 0.008, 0.02, M.copper, xL, y0 - 0.01, -0.06, g);                                       // 400 V 母排 −
    const inc = P.sscb('orange', 'on'); inc.scale.set(1.6, 1.4, 1.2); inc.position.set(xL - 0.09, y0 - 0.16, -0.02); g.add(inc);
    const imd = new THREE.Group();                                                                     // 绝缘监测(IMD)+ RCM
    box(0.11, 0.12, 0.07, M.dark, 0, 0.06, 0, imd);
    box(0.08, 0.04, 0.004, G.screen, 0, 0.085, 0.037, imd);                                          // 绝缘电阻屏(MΩ)
    box(0.010, 0.010, 0.004, G.green, -0.03, 0.03, 0.037, imd);                                       // 绝缘正常
    box(0.010, 0.010, 0.004, G.amber, 0.03, 0.03, 0.037, imd);                                        // 第一故障:报警不跳
    imd.position.set(xL + 0.09, y0 - 0.19, -0.02); g.add(imd);
    for (let i = 0; i < o.feeders400; i++) {
      const s = P.sscb('orange', i < o.tripped ? 'trip' : 'on');
      s.position.set(xL - 0.15 + (i % 3) * 0.06 + 0.02, y0 - 0.34 - Math.floor(i / 3) * 0.11, -0.02); g.add(s);
    }
    // 48 V 列(右,蓝):400→48 V 变流器(散热片)+ 20 路插座回路 SSCB(4×5)
    const xR = 0.22;
    const conv = new THREE.Group();
    box(0.26, 0.14, 0.12, M.dark, 0, 0.07, 0, conv);
    for (let i = 0; i < 9; i++) box(0.24, 0.10, 0.004, M.fin, 0, 0.07, -0.058 + i * 0.012, conv);   // 散热片(舱内 0.60× 对流,账 hab-home)
    box(0.20, 0.010, 0.004, M.blue, 0, 0.125, 0.061, conv);
    box(0.010, 0.010, 0.004, G.green, 0.09, 0.03, 0.061, conv);
    conv.position.set(xR, y0 - 0.14, -0.04); g.add(conv);
    for (let i = 0; i < o.circuits48; i++) {
      const st = i < o.shaking ? 'shake' : 'on';
      const s = P.sscb('blue', st); s.scale.set(0.8, 0.8, 0.9);
      s.position.set(xR - 0.13 + (i % 5) * 0.052 + 0.026, y0 - 0.30 - Math.floor(i / 5) * 0.085, -0.02); g.add(s);
    }
    // 底部:等电位联结排(绿黄)+ 壳体联结带 + 出线孔
    const bar = P.bondingBar(0.62); bar.position.set(0, 0.06, D / 2 - 0.05); g.add(bar);
    box(0.03, 0.03, 0.12, M.bond, 0.30, 0.045, -0.04, g);                                             // 到压力壳的联结带
    for (let i = 0; i < 6; i++) cyl(0.012, 0.03, M.rubber, -0.25 + i * 0.10, 0.015, 0.06, g, 8, Math.PI / 2);   // 出线密封套
    // 收集夜光材质
    const mats = [];
    g.traverse((n) => { if (n.userData && n.userData.nightMats) mats.push(...n.userData.nightMats); });
    night(g, G.screen, G.green, G.amber, ...mats);
    g.userData.nightMats = Array.from(new Set(g.userData.nightMats));
    return g;
  };

  return P;
}
