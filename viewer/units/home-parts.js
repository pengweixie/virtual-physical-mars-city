// home-parts.js —— 火星城家电部件库(hab-home-01 设计册,E:\Claude\mars-home)
// 契约:不 import three(THREE 由调用方传入),纯几何+纯色材质,米制,每件原点 = 其底面中心,+Z 为正面。
// 每个构建函数返回 Group;能动的件把 {node, axis, rpm} 放进 group.userData.spinners,由宿主合并进
// 自己的 userData.spinners(引擎只读顶层)。尺寸与功率来自账本(mars-home ledger/out/*.json,提交 036a7e8):
//   账 1 灶(3 kW 2 眼、烤箱 2.5 kW、微波 1.2 kW、压力锅)、账 2 冰箱(200+60 L,岩棉 50 mm,冷凝器面积 ×1.67)、
//   账 3 洗衣 7 kg / 热泵烘干 / 洗碗 12 套、账 4 真空马桶(86 mL 冲洗)/ 再循环淋浴(10 L 回路)/ 热水器 50 L、
//   账 5 吸尘器(旋风 + H13)、账 6 48 V 插座面板、账 8 材料(铸铁壳 / 岩棉 / 铸石台面 / 打印塑料内胆)。
// 用法:import { HomeParts } from './home-parts.js'; const P = HomeParts(THREE); const fridge = P.fridge(); group.add(fridge);
//       group.userData.spinners.push(...(fridge.userData.spinners || []));
// 复用方(hab-quarter-01 / hab-village-01)放不放、放哪里由它们自己定;本文件不改任何别人的资产。

export function HomeParts(THREE, palette = {}) {
  const std = (c, r = 0.7, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const M = Object.assign({
    iron:    std(0x3a3f45, 0.55, 0.6),     // 铸铁壳(res-foundry-01)
    ironLt:  std(0x8f959b, 0.5, 0.65),     // 机加钢件
    white:   std(0xe6e2da, 0.75),          // 搪瓷/打印白
    cream:   std(0xd9d2c4, 0.8),           // 打印塑料内胆
    stone:   std(0x2c2a28, 0.35),          // 铸石台面(res-glass-01,莫氏 8)
    glassDk: std(0x101418, 0.2, 0.3),      // 黑玻璃(res-glass-01)
    glass:   new THREE.MeshStandardMaterial({ color: 0x9fc3d0, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.45 }),
    rubber:  std(0x1a1a1a, 0.95),
    copper:  std(0xb87333, 0.45, 0.7),
    orange:  std(0xd8742a, 0.6),           // 安全橙(400 V 固定接线标识)
    blue:    std(0x2a6aa8, 0.6),           // 48 V 插座蓝
    wood:    std(0x7a5a3a, 0.8),
    fabric:  std(0x4a6a8a, 0.95),
  }, palette);
  const G = {
    led:   new THREE.MeshStandardMaterial({ color: 0x11220f, emissive: 0x4fe86a, emissiveIntensity: 2.0 }),
    amber: new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0 }),
    red:   new THREE.MeshStandardMaterial({ color: 0x2a0a0a, emissive: 0xff4a3a, emissiveIntensity: 1.8 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0a2a30, emissive: 0x4fd8e8, emissiveIntensity: 1.6 }),
    heat:  new THREE.MeshStandardMaterial({ color: 0x2a0a0a, emissive: 0xff6a2a, emissiveIntensity: 1.5 }),
    uv:    new THREE.MeshStandardMaterial({ color: 0x140a24, emissive: 0x8a5aff, emissiveIntensity: 1.8 }),
  };
  function box(w, h, d, mat, x, y, z, parent, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m;
  }
  function cyl(r1, r2, h, mat, x, y, z, parent, seg = 14, rx = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z); m.rotation.set(rx, 0, rz); parent.add(m); return m;
  }
  function spinnerOf(g, node, axis, rpm) {
    (g.userData.spinners = g.userData.spinners || []).push({ node, axis, rpm });
  }
  const P = {};

  // ---- 电磁灶(2 眼 3 kW,铸石面板,账 1/6/8):固定接线 400 V,橙色接线盒 ---------------------
  P.hob = () => {
    const g = new THREE.Group();
    box(0.60, 0.05, 0.52, M.stone, 0, 0.025, 0, g);                    // 铸石面板
    for (const x of [-0.14, 0.14]) {                                    // 两眼:铜色线圈环(印在面板上)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 6, 24), M.copper);
      ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.052, 0); g.add(ring);
    }
    box(0.30, 0.012, 0.05, G.screen, 0, 0.052, 0.20, g);                // 触控条
    box(0.07, 0.05, 0.05, M.orange, -0.33, 0.025, 0.18, g);             // 400 V 接线盒(橙)
    g.userData.nightMats = [G.screen];
    return g;
  };
  // ---- 烤箱(2.5 kW 50 L,铸铁壳 + 岩棉 + 黑玻璃门,带对流风机 spinner 账 1) ------------------
  P.oven = () => {
    const g = new THREE.Group();
    box(0.60, 0.60, 0.55, M.iron, 0, 0.30, 0, g);
    box(0.52, 0.42, 0.02, M.glassDk, 0, 0.27, 0.285, g);                 // 门玻璃
    box(0.56, 0.03, 0.03, M.ironLt, 0, 0.50, 0.30, g);                   // 把手
    box(0.50, 0.08, 0.02, M.ironLt, 0, 0.55, 0.28, g);                   // 控制条
    box(0.06, 0.03, 0.01, G.amber, -0.18, 0.55, 0.29, g);
    const fan = new THREE.Group(); fan.position.set(0, 0.30, -0.22); g.add(fan);
    for (let k = 0; k < 5; k++) { const b = box(0.02, 0.10, 0.01, M.ironLt, 0, 0.06, 0, fan); b.rotation.z = (k / 5) * Math.PI * 2; b.position.set(Math.sin(b.rotation.z) * 0.06 * -1, Math.cos(b.rotation.z) * 0.06, 0); }
    cyl(0.03, 0.03, 0.02, M.ironLt, 0, 0, 0, fan, 10, Math.PI / 2);
    box(0.40, 0.02, 0.36, G.heat, 0, 0.08, 0.02, g);                     // 底部发热元件辉光(进口 NiCr)
    spinnerOf(g, fan, 'z', 90);
    g.userData.nightMats = [G.amber, G.heat];
    return g;
  };
  // ---- 微波炉(1.2 kW,打印壳,48 V 插座件) ---------------------------------------------------
  P.microwave = () => {
    const g = new THREE.Group();
    box(0.50, 0.30, 0.38, M.white, 0, 0.15, 0, g);
    box(0.30, 0.22, 0.015, M.glassDk, -0.06, 0.15, 0.195, g);
    box(0.10, 0.24, 0.015, M.cream, 0.18, 0.15, 0.195, g);
    box(0.06, 0.04, 0.01, G.screen, 0.18, 0.24, 0.20, g);
    g.userData.nightMats = [G.screen];
    return g;
  };
  // ---- 冰箱-冷冻(200+60 L,铸铁壳/岩棉 50 mm/打印内胆;背部冷凝器面积 ×1.67,风扇 spinner 账 2) ----
  P.fridge = () => {
    const g = new THREE.Group();
    box(0.62, 1.75, 0.66, M.white, 0, 0.875, 0, g);                      // 壳(铸铁搪瓷)
    box(0.60, 1.10, 0.02, M.cream, 0, 1.18, 0.335, g);                   // 冷藏门
    box(0.60, 0.56, 0.02, M.cream, 0, 0.31, 0.335, g);                   // 冷冻门
    box(0.03, 0.60, 0.03, M.ironLt, 0.26, 1.18, 0.36, g);                // 把手
    box(0.03, 0.30, 0.03, M.ironLt, 0.26, 0.31, 0.36, g);
    // 背部冷凝器:0.6 × 1.5 m 蛇管板(账 2:面积 ×1.67 才回到地球 COP)
    for (let k = 0; k < 9; k++) cyl(0.008, 0.008, 0.56, M.iron, 0, 0.25 + k * 0.16, -0.345, g, 6, 0, Math.PI / 2);
    for (const x of [-0.26, 0.26]) cyl(0.008, 0.008, 1.40, M.iron, x, 0.90, -0.345, g, 6);
    const fan = new THREE.Group(); fan.position.set(0, 0.16, -0.36); g.add(fan);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; const b = box(0.02, 0.09, 0.008, M.ironLt, Math.sin(a) * 0.05, Math.cos(a) * 0.05, 0, fan); b.rotation.z = -a; }
    box(0.09, 0.07, 0.10, M.iron, 0.18, 0.06, -0.24, g);                 // 压缩机(进口,CO2 跨临界)
    box(0.05, 0.02, 0.01, G.led, -0.22, 1.66, 0.34, g);
    spinnerOf(g, fan, 'z', 60);
    g.userData.nightMats = [G.led];
    return g;
  };
  // ---- 洗衣机(7 kg,前置滚筒 spinner;铸铁配重;400 V 固定接线) ---------------------------------
  P.washer = (rpm = 50) => {
    const g = new THREE.Group();
    box(0.60, 0.85, 0.60, M.white, 0, 0.425, 0, g);
    box(0.56, 0.06, 0.58, M.stone, 0, 0.88, 0, g);                       // 铸石顶板
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 8, 24), M.ironLt);
    ring.position.set(0, 0.40, 0.305); g.add(ring);
    const glass = cyl(0.17, 0.17, 0.02, M.glass, 0, 0.40, 0.31, g, 20, Math.PI / 2);
    const drum = new THREE.Group(); drum.position.set(0, 0.40, 0.10); g.add(drum);
    cyl(0.16, 0.16, 0.34, M.ironLt, 0, 0, 0, drum, 18, Math.PI / 2);
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; box(0.03, 0.30, 0.05, M.iron, Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0, drum, 0, 0, a); }
    box(0.36, 0.05, 0.01, M.cream, 0, 0.75, 0.305, g);                   // 面板
    box(0.06, 0.03, 0.01, G.screen, 0.14, 0.75, 0.31, g);
    box(0.07, 0.05, 0.05, M.orange, -0.26, 0.05, 0.28, g);               // 400 V 接线盒
    spinnerOf(g, drum, 'z', rpm);
    g.userData.nightMats = [G.screen];
    g.userData.glass = glass;
    return g;
  };
  // ---- 热泵烘干(7 kg,滚筒 spinner,CO2 热泵,冷凝水回收桶) -----------------------------------
  P.dryer = () => {
    const g = P.washer(40);
    g.traverse((o) => { if (o.material === M.orange) o.material = M.orange; });
    box(0.20, 0.12, 0.14, M.cream, -0.18, 0.06, 0.24, g);                // 冷凝水桶(账 3:水回收不丢)
    box(0.12, 0.10, 0.10, M.iron, 0.20, 0.08, -0.22, g);                 // 热泵压缩机(进口)
    return g;
  };
  // ---- 洗碗机(12 套,铸铁壳,岩棉隔声,打印喷臂 spinner) -----------------------------------------
  P.dishwasher = () => {
    const g = new THREE.Group();
    box(0.60, 0.82, 0.58, M.iron, 0, 0.41, 0, g);
    box(0.58, 0.72, 0.02, M.white, 0, 0.38, 0.295, g);                   // 门
    box(0.56, 0.03, 0.03, M.ironLt, 0, 0.72, 0.31, g);
    box(0.05, 0.02, 0.01, G.led, 0.24, 0.79, 0.30, g);
    const arm = new THREE.Group(); arm.position.set(0, 0.20, 0.0); g.add(arm);   // 喷臂(壳内,门半透不露;留作复用方剖切用)
    box(0.40, 0.015, 0.03, M.cream, 0, 0, 0, arm);
    spinnerOf(g, arm, 'y', 30);
    g.userData.nightMats = [G.led];
    return g;
  };
  // ---- 真空马桶(尿粪分离,86 mL 冲洗;铸石便器,打印分离件;真空泵在后箱) ---------------------------
  P.toilet = () => {
    const g = new THREE.Group();
    box(0.40, 0.40, 0.55, M.white, 0, 0.20, 0.05, g);                    // 座体(铸石/打印)
    cyl(0.17, 0.12, 0.10, M.cream, 0, 0.42, 0.10, g, 18);                // 便器口(尿分离前段浅碟)
    box(0.36, 0.03, 0.42, M.ironLt, 0, 0.455, 0.10, g);                  // 座圈
    box(0.40, 0.45, 0.22, M.iron, 0, 0.60, -0.28, g);                    // 真空泵/阀箱(进口)
    box(0.20, 0.10, 0.01, G.led, 0, 0.72, -0.16, g);
    cyl(0.03, 0.03, 0.30, M.iron, 0.12, 0.15, -0.40, g, 8);              // 去尿处理(res-recycle-01 VCD)管——橙色标预处理
    cyl(0.04, 0.04, 0.10, M.orange, 0.12, 0.35, -0.40, g, 8);            // 预处理投加罐(酸化,账 4:投加量不能闭合)
    g.userData.nightMats = [G.led];
    return g;
  };
  // ---- 再循环淋浴(10 L 回路,MF+UV;打印板隔间,铸石底盘;循环泵 spinner) -------------------------
  P.shower = () => {
    const g = new THREE.Group();
    box(1.0, 0.08, 1.0, M.stone, 0, 0.04, 0, g);                         // 铸石底盘
    box(0.05, 2.2, 1.0, M.cream, -0.475, 1.18, 0, g);                    // 打印板后墙
    box(1.0, 2.2, 0.05, M.cream, 0, 1.18, -0.475, g);
    box(0.02, 2.0, 0.9, M.glass, 0.49, 1.1, 0, g);                       // 玻璃门
    cyl(0.02, 0.02, 1.9, M.ironLt, -0.40, 1.15, -0.40, g, 8);            // 立管
    cyl(0.08, 0.08, 0.03, M.ironLt, -0.25, 2.05, -0.25, g, 12);          // 花洒
    box(0.30, 0.40, 0.30, M.iron, 0.30, 0.30, -0.30, g);                 // 回路撬:泵+MF+UV(壳)
    cyl(0.03, 0.03, 0.25, G.uv, 0.30, 0.60, -0.30, g, 8);                // UV 灯管露头
    const pump = new THREE.Group(); pump.position.set(0.47, 0.25, -0.30); g.add(pump);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; box(0.01, 0.06, 0.02, M.ironLt, 0, Math.cos(a) * 0.04, Math.sin(a) * 0.04, pump); }
    cyl(0.05, 0.05, 0.02, M.iron, 0.47, 0.25, -0.30, g, 12, 0, Math.PI / 2);
    spinnerOf(g, pump, 'x', 120);
    g.userData.nightMats = [G.uv];
    return g;
  };
  // ---- 热水器(50 L,铸铁罐 + 岩棉,2 kW 元件,400 V 固定接线) -----------------------------------
  P.waterHeater = () => {
    const g = new THREE.Group();
    cyl(0.22, 0.22, 0.60, M.white, 0, 0.30, 0, g, 18);
    cyl(0.22, 0.22, 0.02, M.iron, 0, 0.61, 0, g, 18);
    cyl(0.02, 0.02, 0.20, M.copper, -0.10, 0.70, 0, g, 8);
    cyl(0.02, 0.02, 0.20, M.copper, 0.10, 0.70, 0, g, 8);
    box(0.08, 0.06, 0.04, M.orange, 0, 0.12, 0.22, g);
    box(0.04, 0.02, 0.01, G.amber, 0, 0.20, 0.225, g);
    g.userData.nightMats = [G.amber];
    return g;
  };
  // ---- 吸尘器(48 V,旋风筒 + H13 滤芯;打印壳;进口电机) ---------------------------------------
  P.vacuum = () => {
    const g = new THREE.Group();
    cyl(0.07, 0.09, 0.30, M.cream, 0, 0.15, 0, g, 14);                   // 旋风筒(打印,透明筒简化为奶白)
    cyl(0.09, 0.09, 0.12, M.iron, 0, 0.36, 0, g, 14);                    // 电机头
    box(0.06, 0.05, 0.05, M.blue, 0, 0.45, 0.05, g);                     // 48 V 接口(蓝)
    cyl(0.012, 0.012, 0.70, M.ironLt, 0, 0.77, 0, g, 6);                 // 杆
    box(0.24, 0.05, 0.10, M.iron, 0, 0.025, 0.12, g);                    // 刷头(账 5:静电尘要刷头不要风量)
    box(0.05, 0.03, 0.10, M.white, 0.12, 0.30, 0, g);                    // H13 滤芯窗
    return g;
  };
  // ---- 抽油烟机(风机 spinner,机加可洗滤网) -------------------------------------------------------
  P.rangeHood = () => {
    const g = new THREE.Group();
    box(0.90, 0.12, 0.50, M.ironLt, 0, 0.06, 0, g);
    box(0.80, 0.01, 0.40, M.iron, 0, -0.005, 0, g);                      // 滤网面
    cyl(0.12, 0.12, 0.40, M.ironLt, 0, 0.32, -0.10, g, 14);              // 风管(到 ECLSS 回风)
    const fan = new THREE.Group(); fan.position.set(0, 0.13, -0.10); g.add(fan);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; box(0.02, 0.02, 0.09, M.iron, Math.cos(a) * 0.055, 0, Math.sin(a) * 0.055, fan, 0, -a, 0); }
    box(0.30, 0.02, 0.05, G.amber, 0, 0.0, 0.22, g);                     // 照明条
    spinnerOf(g, fan, 'y', 400);
    g.userData.nightMats = [G.amber];
    return g;
  };
  // ---- 压力锅(6 L;Ti 或搪瓷铸铁;账 1:主粮必需件) ----------------------------------------------
  P.pressureCooker = () => {
    const g = new THREE.Group();
    cyl(0.11, 0.10, 0.15, M.ironLt, 0, 0.075, 0, g, 18);
    cyl(0.115, 0.115, 0.02, M.iron, 0, 0.16, 0, g, 18);
    cyl(0.012, 0.012, 0.04, M.iron, 0.04, 0.19, 0, g, 8);                // 泄压阀(+100 kPa 表压 → 115 °C)
    box(0.12, 0.02, 0.03, M.rubber, -0.16, 0.10, 0, g);                  // 把手
    return g;
  };
  // ---- 48 V 插座面板 + 400 V 固定接线标识(账 6:两级;先导触点插座) ------------------------------
  P.socketPanel = () => {
    const g = new THREE.Group();
    box(0.30, 0.16, 0.03, M.blue, 0, 0.08, 0, g);                        // 48 V 蓝面板
    for (let k = 0; k < 3; k++) box(0.05, 0.07, 0.01, M.rubber, -0.09 + k * 0.09, 0.08, 0.02, g);
    box(0.30, 0.03, 0.005, G.led, 0, 0.005, 0.02, g);                    // 握手指示条(先握手后上电)
    g.userData.nightMats = [G.led];
    return g;
  };
  P.materials = M; P.glow = G;
  return P;
}
