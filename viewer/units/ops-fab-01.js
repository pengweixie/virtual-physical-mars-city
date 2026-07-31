// ops-fab-01 —— 地下城芯片厂(洁净室,一厂三线)
// 契约(室内场景 §4b):米制;原点=厅中心地面;入口朝 +Z;引擎平地 y=0。
// 设计真源(知识卡数字全部有锚点):
//   数字线  E:\Claude\mars-bigram   MB-1 sky130 RTL→GDS(die 1660×1080 µm,~2100 单元)
//   模拟线  E:\Claude\mars_spad_rox TSMC CRN65LP(DRC 29 轮/LVS 11 CORRECT/PEX 3/后仿 4)
//   超导线  E:\Claude\quantum-computing QP-20(双角度蒸发结/修调 σ≤0.5%/311 空气桥)
// 核心不做黑盒:蒸发台开腔露出倾斜样品台+双蒸发源(「双角度」直接可读);
//   因果链 = 晶圆盒 → 涂胶轨道(黄光区) → 光刻机 → 刻蚀/沉积 → 探针测试 → 划片键合
//   → 下游:计算中心 MB-1 机架 + 玄枢 QP-20 制冷机。
export const meta = {
  id: 'ops-fab-01',
  name: '地下城芯片厂(洁净室)',
  name_en: 'Undercity Chip Fab (cleanroom)',
  kind: 'interior',
  size_m: 19.6,          // 实测包围盒最大边(validate_unit: x=19.60)
};

export function build(THREE) {
  const group = new THREE.Group();
  const M = {
    floor:  new THREE.MeshStandardMaterial({ color: 0xb9bdc2, roughness: 0.5, metalness: 0.05 }),  // 防静电地板
    tile:   new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.55 }),                  // 高架孔板缝
    wall:   new THREE.MeshStandardMaterial({ color: 0xdde1e4, roughness: 0.85 }),                  // 洁净板墙
    wallDim: new THREE.MeshStandardMaterial({ color: 0xc6ccd0, roughness: 0.9 }),
    hepa:   new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.9 }),                   // 层流顶
    steel:  new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: 0.45, metalness: 0.7 }),
    frame:  new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.55, metalness: 0.55 }),
    tool:   new THREE.MeshStandardMaterial({ color: 0xd4d8db, roughness: 0.5, metalness: 0.2 }),   // 设备白
    toolB:  new THREE.MeshStandardMaterial({ color: 0x6d7680, roughness: 0.5, metalness: 0.4 }),   // 设备灰蓝
    panel:  new THREE.MeshStandardMaterial({ color: 0x21242a, roughness: 0.5, metalness: 0.2 }),
    chamber: new THREE.MeshStandardMaterial({ color: 0xaab2b8, roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb0653a, roughness: 0.35, metalness: 0.85 }),
    hazardY: new THREE.MeshStandardMaterial({ color: 0xc7a03c, roughness: 0.7 }),
    hazardK: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 }),
    glass:  new THREE.MeshStandardMaterial({ color: 0x9fc8d8, roughness: 0.1, metalness: 0.1,
      transparent: true, opacity: 0.25, side: THREE.DoubleSide }),
    yglass: new THREE.MeshStandardMaterial({ color: 0xd8b45a, roughness: 0.1, metalness: 0.1,
      transparent: true, opacity: 0.3, side: THREE.DoubleSide }),                                   // 黄光区隔断
    suit:   new THREE.MeshStandardMaterial({ color: 0xe4e8ea, roughness: 0.8 }),                   // 洁净服
    wafer:  new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.15, metalness: 0.9 }),  // 晶圆
    foupA:  new THREE.MeshStandardMaterial({ color: 0x7c5a9e, roughness: 0.4, transparent: true, opacity: 0.85 }),
    foupB:  new THREE.MeshStandardMaterial({ color: 0x4a7c9e, roughness: 0.4, transparent: true, opacity: 0.85 }),
  };
  const G = {
    lampW:  new THREE.MeshStandardMaterial({ color: 0x2a2c22, emissive: 0xf2f6ff, emissiveIntensity: 2.0 }), // 白光带
    lampY:  new THREE.MeshStandardMaterial({ color: 0x2a2612, emissive: 0xffc832, emissiveIntensity: 2.2 }), // 黄光带
    teal:   new THREE.MeshStandardMaterial({ color: 0x0a2a30, emissive: 0x4fd8e8, emissiveIntensity: 2.0 }),
    ledG:   new THREE.MeshStandardMaterial({ color: 0x11220f, emissive: 0x4fe86a, emissiveIntensity: 2.2 }),
    ledA:   new THREE.MeshStandardMaterial({ color: 0x2a1c08, emissive: 0xffb050, emissiveIntensity: 2.0 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x060a0e, emissive: 0x0d1a22, emissiveIntensity: 1.4 }),
    dieOK:  new THREE.MeshStandardMaterial({ color: 0x0d2210, emissive: 0x3fe86a, emissiveIntensity: 1.6 }), // 晶圆图良品
    dieNG:  new THREE.MeshStandardMaterial({ color: 0x2a0808, emissive: 0xff4030, emissiveIntensity: 1.8 }), // 坏品
    gds1:   new THREE.MeshStandardMaterial({ color: 0x101a2a, emissive: 0x4a7ce8, emissiveIntensity: 1.5 }), // GDS 色块
    gds2:   new THREE.MeshStandardMaterial({ color: 0x2a101a, emissive: 0xe84a9e, emissiveIntensity: 1.5 }),
    gds3:   new THREE.MeshStandardMaterial({ color: 0x1a2a10, emissive: 0x9ee84a, emissiveIntensity: 1.5 }),
    sign:   new THREE.MeshStandardMaterial({ color: 0x2a2016, emissive: 0xffc878, emissiveIntensity: 2.0 }),
    beam:   new THREE.MeshStandardMaterial({ color: 0x2a2612, emissive: 0xffdc60, emissiveIntensity: 1.4,
      transparent: true, opacity: 0.5 }),                                                          // 光刻曝光光束
    evapGlow: new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0xff8c40, emissiveIntensity: 1.6 }), // 蒸发源辉光
  };

  function box(w, h, d, mat, x, y, z, rx = 0, rz = 0, parent = group) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (rz) m.rotation.z = rz;
    parent.add(m);
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

  /* ==========================================================
   * 1. 洁净室壳体:净 19×17,洁净板墙 h4.6 + 层流平顶 y5.6
   *    x ∈ [-9.5,9.5], z ∈ [-9,8];黄光区 = x<-2 的后半场
   * ========================================================== */
  box(19.6, 0.3, 17.8, M.floor, 0, -0.14, -0.5);
  // 高架孔板地面缝(两向细条)
  for (let i = -4; i <= 4; i++) box(0.04, 0.02, 17.2, M.tile, i * 2.2, 0.02, -0.5);
  for (let j = -3; j <= 3; j++) box(19.0, 0.02, 0.04, M.tile, 0, 0.02, j * 2.4 - 0.5);
  // 四墙(平板洁净墙 + 压条)
  box(0.35, 5.9, 17.8, M.wall, -9.55, 2.95, -0.5);
  box(0.35, 5.9, 17.8, M.wall,  9.55, 2.95, -0.5);
  box(19.6, 5.9, 0.35, M.wall, 0, 2.95, -9.35);
  box(7.3, 5.9, 0.35, M.wall, -6.1, 2.95, 8.15);       // 前墙左段
  box(7.3, 5.9, 0.35, M.wall,  6.1, 2.95, 8.15);       // 前墙右段
  box(4.9, 2.9, 0.35, M.wallDim, 0, 4.35, 8.15);      // 门楣
  for (const wy of [1.5, 3.0]) {                       // 墙面压条
    box(0.06, 0.08, 17.6, M.wallDim, -9.36, wy, -0.5);
    box(0.06, 0.08, 17.6, M.wallDim,  9.36, wy, -0.5);
    box(19.4, 0.08, 0.06, M.wallDim, 0, wy, -9.16);
  }
  // 层流平顶 + HEPA 格栅肋 + 灯带(黄光区黄,其余白)
  box(19.6, 0.25, 17.8, M.hepa, 0, 5.72, -0.5);
  for (let i = -4; i <= 4; i++) box(0.1, 0.1, 17.4, M.wallDim, i * 2.2, 5.56, -0.5);
  for (let j = -3; j <= 3; j++) box(19.2, 0.1, 0.1, M.wallDim, 0, 5.56, j * 2.4 - 0.5);
  for (const [lx, lz] of [[-6, -5], [-6, 0.5], [2, -5], [2, 0.5], [6.5, -5], [6.5, 0.5], [0, 5.5], [-6, 5.5], [6.5, 5.5]]) {
    const yellow = lx < -2 && lz < 2;                  // 黄光区判定
    box(3.0, 0.06, 0.3, yellow ? G.lampY : G.lampW, lx, 5.5, lz);
  }

  /* ==========================================================
   * 2. 入口门组(+Z 通玄关)+ 更衣段 + 地表电梯龛(-X 侧)
   * ========================================================== */
  box(0.3, 3.0, 0.24, M.frame, -2.15, 1.5, 7.9);
  box(0.3, 3.0, 0.24, M.frame,  2.15, 1.5, 7.9);
  box(4.6, 0.3, 0.24, M.frame, 0, 3.0, 7.9);
  box(1.9, 2.75, 0.14, M.steel, -1.0, 1.38, 7.96);     // 双扇滑门
  box(1.9, 2.75, 0.14, M.steel,  1.0, 1.38, 7.96);
  box(2.6, 0.5, 0.12, G.sign, 0, 3.55, 7.95);          // 发光门牌
  for (let i = 0; i < 5; i++) {
    box(0.6, 0.02, 1.2, i % 2 === 0 ? M.hazardY : M.hazardK, -1.5 + i * 0.62, 0.03, 6.9);
  }
  // 更衣段:玻璃隔断(z=5.2,留 1.6 m 门口)+ 洁净服挂架 + 风淋门框
  box(6.9, 3.2, 0.08, M.glass, -4.75, 1.6, 5.2);
  box(6.9, 3.2, 0.08, M.glass,  4.75, 1.6, 5.2);
  box(0.12, 3.2, 0.12, M.steel, -1.3, 1.6, 5.2);
  box(0.12, 3.2, 0.12, M.steel,  1.3, 1.6, 5.2);
  box(2.6, 0.3, 0.16, M.steel, 0, 3.35, 5.2);          // 风淋门楣
  box(0.7, 0.06, 0.06, G.teal, 0, 3.15, 5.16);
  for (let k = 0; k < 4; k++) {                        // 洁净服(白胶囊)挂在左侧隔断前
    const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 4, 10), M.suit);
    s.position.set(-6.8 + k * 0.7, 1.6, 5.65);
    group.add(s);
  }
  box(3.0, 0.06, 0.6, M.steel, -6, 0.45, 6.6);         // 换鞋凳
  for (const bx of [-7.2, -4.8]) box(0.06, 0.45, 0.5, M.frame, bx, 0.22, 6.6);
  // 地表电梯龛(exitZone,前墙左端)
  box(0.16, 2.7, 2.4, M.frame, -6.2, 1.35, 7.95);
  box(1.0, 2.3, 0.08, M.steel, -6.7, 1.15, 8.02);
  box(1.0, 2.3, 0.08, M.steel, -5.7, 1.15, 8.02);
  box(1.7, 0.35, 0.07, G.sign, -6.2, 2.95, 8.0);

  /* ==========================================================
   * 3. 黄光区(x<-2,z<2):涂胶显影轨道 + 光刻机 + 晶圆盒架
   *    黄光区玻璃隔断(x=-2)把黄/白光带分开
   * ========================================================== */
  box(0.06, 3.4, 10.6, M.yglass, -2, 1.7, -3.9);       // 琥珀隔断(z -9.2..1.3)
  box(0.1, 3.4, 0.1, M.steel, -2, 1.7, 1.3);
  box(0.1, 3.4, 0.1, M.steel, -2, 1.7, -9.1);
  // 3a. 涂胶显影轨道(低长机 + 两个装载口 + 旋涂窗)
  box(3.4, 1.25, 1.5, M.tool, -6.6, 0.63, 0.2);
  box(3.4, 0.08, 1.55, M.toolB, -6.6, 1.3, 0.2);
  for (const px of [-7.6, -6.8]) {                     // 前置装载口(晶圆盒圆座)
    cyl(0.22, 0.22, 0.14, M.toolB, px, 1.4, 0.55, 14);
    cyl(0.18, 0.18, 0.2, M.foupB, px, 1.57, 0.55, 14);
  }
  box(0.8, 0.55, 0.06, M.glass, -5.6, 0.75, 0.96);     // 旋涂观察窗
  const chuck = new THREE.Group();                     // 旋涂吸盘(spinner)
  chuck.position.set(-5.6, 0.55, 0.55);
  group.add(chuck);
  const chuckDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 18), M.wafer);
  chuck.add(chuckDisc);
  const chuckMark = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.18), M.copper); // 转痕标记(可见旋转)
  chuckMark.position.set(0.1, 0.025, 0);
  chuck.add(chuckMark);
  // 3b. 光刻机(照明塔 + 镜筒 + 工作台 + 控制屏 + 曝光光束)
  box(2.4, 2.5, 2.2, M.tool, -7.4, 1.25, -4.6);        // 主体
  box(0.9, 1.4, 0.9, M.toolB, -7.4, 3.2, -4.6);        // 照明塔
  cyl(0.3, 0.38, 0.9, M.toolB, -7.4, 2.1, -3.2, 16);   // 投影镜筒(前伸)
  const beam = cyl(0.1, 0.26, 0.5, G.beam, -7.4, 1.4, -3.2, 12, true); // 曝光光束(呼吸)
  box(1.0, 0.08, 1.0, M.steel, -7.4, 1.1, -3.2);       // 晶圆工作台
  cyl(0.2, 0.2, 0.025, M.wafer, -7.4, 1.16, -3.2, 18); // 台上晶圆
  box(0.9, 0.6, 0.06, G.teal, -6.2, 1.7, -4.2, 0, -0.3); // 侧控制屏
  const stepperLeds = [];
  for (let k = 0; k < 5; k++) {                        // 状态灯柱(animate 流水)
    const led = box(0.05, 0.05, 0.02, G.ledG.clone(), -6.18, 0.6 + k * 0.24, -4.9);
    stepperLeds.push(led.material);
  }
  box(0.7, 0.5, 0.5, M.toolB, -8.9, 0.9, -3.1);        // 掩模版库(小柜)
  // 3c. 晶圆盒货架(黄光区后墙)
  box(2.6, 0.06, 0.55, M.steel, -6.5, 1.0, -8.8);
  box(2.6, 0.06, 0.55, M.steel, -6.5, 1.8, -8.8);
  for (let k = 0; k < 6; k++) {
    const mat = k % 2 === 0 ? M.foupA : M.foupB;
    box(0.34, 0.42, 0.4, mat, -7.5 + k * 0.42, k < 3 ? 1.28 : 2.08, -8.8);
  }
  poi('track', -6.6, 1.4, 0.9);
  poi('stepper', -7.0, 2.0, -3.6);

  /* ==========================================================
   * 4. 晶圆传送机器人(黄光区中央,轨道 + 摆臂 oscillator)
   * ========================================================== */
  box(3.6, 0.12, 0.3, M.frame, -5.6, 0.06, -1.6);      // 地轨
  const botBase = cyl(0.18, 0.22, 0.5, M.toolB, -5.6, 0.3, -1.6, 14);
  const armPivot = new THREE.Group();                  // 摆臂关节(oscillator yaw)
  armPivot.position.set(-5.6, 0.62, -1.6);
  group.add(armPivot);
  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.9), M.steel);
  arm1.position.set(0, 0, 0.42);
  armPivot.add(arm1);
  const endEff = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.3), M.toolB);
  endEff.position.set(0, 0.05, 0.86);
  armPivot.add(endEff);
  const held = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 18), M.wafer);
  held.position.set(0, 0.08, 0.86);
  armPivot.add(held);

  /* ==========================================================
   * 5. 白光区(x>-2):蒸发台(开腔双角度)+ RIE + 溅射台
   * ========================================================== */
  // 5a. 双角度蒸发台:柜体 + 开口钟罩(前开 40%)+ 倾斜样品台 + 双蒸发源
  box(1.5, 1.05, 1.2, M.tool, 1.2, 0.53, -7.6);
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 1.5, 20, 1, true, Math.PI * 0.7, Math.PI * 1.6), M.chamber);
  bell.position.set(1.2, 1.85, -7.6);
  group.add(bell);
  cyl(0.6, 0.6, 0.08, M.chamber, 1.2, 2.63, -7.6, 20); // 罩顶
  const tiltStage = box(0.5, 0.04, 0.4, M.copper, 1.2, 2.2, -7.6, 0.5);   // 倾斜样品台(双角度可读)
  cyl(0.14, 0.14, 0.03, M.wafer, 1.2, 2.28, -7.52, 14).rotation.x = 0.5;  // 台上芯片片
  for (const sx of [-0.22, 0.22]) {                    // 双蒸发源坩埚(辉光)
    cyl(0.07, 0.09, 0.1, M.copper, 1.2 + sx, 1.28, -7.6, 10);
    cyl(0.04, 0.05, 0.03, G.evapGlow, 1.2 + sx, 1.34, -7.6, 10);
  }
  cyl(0.14, 0.14, 0.5, M.steel, 2.05, 1.0, -7.6, 12);  // 涡轮泵
  box(0.5, 0.4, 0.06, G.teal, 0.4, 1.35, -6.95, 0, -0.2); // 控制屏
  // 5b. RIE 刻蚀机:柜体 + 卧式圆腔 + 圆门 + RF 匹配盒
  box(1.6, 1.8, 1.2, M.tool, 4.6, 0.9, -8.2);
  const rie = cyl(0.5, 0.5, 0.9, M.chamber, 4.6, 1.15, -7.35, 18);
  rie.rotation.x = Math.PI / 2;
  cyl(0.54, 0.54, 0.1, M.steel, 4.6, 1.15, -6.9, 18).rotation.x = Math.PI / 2; // 腔门法兰
  cyl(0.2, 0.2, 0.04, M.glass, 4.6, 1.15, -6.84, 14).rotation.x = Math.PI / 2; // 观察窗
  box(0.5, 0.35, 0.5, M.toolB, 4.6, 2.15, -8.2);       // RF 匹配盒
  box(0.05, 0.05, 0.02, G.ledA, 4.15, 1.9, -7.58);
  // 5c. 磁控溅射台(α-Ta 基膜):立式腔 + 靶法兰 + 气路
  box(1.4, 1.0, 1.1, M.tool, 7.6, 0.5, -8.1);
  cyl(0.45, 0.45, 1.1, M.chamber, 7.6, 1.6, -8.1, 18);
  cyl(0.5, 0.5, 0.12, M.copper, 7.6, 2.2, -8.1, 18);   // Ta 靶法兰(铜色)
  for (let k = 0; k < 3; k++) cyl(0.02, 0.02, 0.8, M.steel, 8.3, 1.7, -8.5 + k * 0.3, 6);
  box(0.5, 0.4, 0.06, G.teal, 6.7, 1.3, -7.5, 0, -0.2);
  poi('evap', 1.2, 1.9, -6.9);
  poi('etch', 5.6, 1.4, -7.2);

  /* ==========================================================
   * 6. 测试与封装区(右前):探针台 + 划片机 + 键合机
   * ========================================================== */
  // 6a. 探针台:桌 + 显微镜柱 + 载台 + 晶圆图小屏
  box(1.7, 0.06, 1.0, M.tool, 6.8, 0.85, 1.6);
  for (const [lx, lz] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) {
    box(0.07, 0.85, 0.07, M.frame, 6.8 + lx, 0.42, 1.6 + lz);
  }
  cyl(0.3, 0.34, 0.12, M.toolB, 6.8, 0.95, 1.6, 16);   // 载台
  cyl(0.19, 0.19, 0.02, M.wafer, 6.8, 1.03, 1.6, 18);  // 被测晶圆
  box(0.12, 0.8, 0.12, M.toolB, 7.35, 1.3, 1.3);       // 显微镜柱
  const lens = cyl(0.09, 0.11, 0.3, M.panel, 7.1, 1.55, 1.55, 12);  // 镜头(斜指载台)
  lens.rotation.x = 0.5;
  box(0.7, 0.45, 0.05, G.teal, 6.1, 1.6, 0.9, 0, -0.25); // 晶圆图小屏
  // 6b. 划片机:小柜 + 主轴刀片(spinner)
  box(1.2, 1.0, 0.9, M.tool, 8.6, 0.5, 3.6);
  const bladePivot = new THREE.Group();
  bladePivot.position.set(8.25, 1.12, 3.6);
  bladePivot.rotation.z = Math.PI / 2;
  group.add(bladePivot);
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 20), M.steel);
  bladePivot.add(blade);
  box(0.5, 0.04, 0.5, M.toolB, 8.6, 1.02, 3.6);        // 切割台
  // 6c. 键合机:小柜 + 悬臂 + 显微镜
  box(1.2, 0.95, 0.9, M.tool, 8.6, 0.48, 5.6);
  box(0.5, 0.08, 0.3, M.toolB, 8.5, 1.2, 5.6);
  box(0.06, 0.35, 0.06, M.steel, 8.4, 1.35, 5.6);
  box(0.3, 0.2, 0.06, G.ledA, 8.75, 1.35, 5.3);
  poi('probe', 6.4, 1.2, 1.6);
  poi('bond', 8.4, 1.1, 4.6);

  /* ==========================================================
   * 7. 尾墙大屏:晶圆图(良品/坏品闪烁)+ MB-1 GDS 色块图
   * ========================================================== */
  box(6.4, 3.0, 0.12, M.panel, 2.2, 2.7, -9.1);
  box(6.1, 2.7, 0.06, G.screen, 2.2, 2.7, -9.02);
  const dieMats = [];
  for (let ix = 0; ix < 7; ix++) {                     // 晶圆图 7×7 圆内格点
    for (let iy = 0; iy < 7; iy++) {
      const dx = ix - 3, dy = iy - 3;
      if (dx * dx + dy * dy > 10.5) continue;
      const bad = (ix * 31 + iy * 17) % 11 === 0;      // 确定性坏品分布
      const m = (bad ? G.dieNG : G.dieOK).clone();
      box(0.24, 0.24, 0.03, m, 0.2 + ix * 0.3, 1.75 + iy * 0.3, -8.98);
      if (bad) dieMats.push(m);
    }
  }
  // GDS 色块(右侧:MB-1 版图示意——4 SRAM 宏 + 逻辑区 + PDN 条)
  box(2.2, 2.4, 0.05, G.gds1, 4.35, 2.7, -8.99);
  for (const [gx, gy] of [[-0.55, 0.6], [0.55, 0.6], [-0.55, -0.6], [0.55, -0.6]]) {
    box(0.85, 0.9, 0.04, G.gds2, 4.35 + gx, 2.7 + gy, -8.95);   // SRAM 宏 ×4
  }
  box(1.9, 0.35, 0.04, G.gds3, 4.35, 2.7, -8.94);      // 中缝逻辑区
  poi('screen', 2.2, 2.4, -8.4);
  poi('cleanroom', 0, 2.2, 3.4);

  /* ==========================================================
   * 8. 声明:灯光 / 动画 / 出入口
   * ========================================================== */
  group.userData.lights = [
    { color: 0xf2f6ff, pos: [4.5, 5.0, -4], range: 18 },        // 白光区
    { color: 0xf2f6ff, pos: [4.5, 5.0, 3], range: 18 },
    { color: 0xf2f6ff, pos: [-4.5, 5.0, 6.2], range: 14 },      // 更衣段
    { color: 0xffc040, pos: [-6, 4.8, -2], range: 15 },         // 黄光区(琥珀)
    { color: 0xffc040, pos: [-6, 4.8, -7], range: 13 },
  ];
  group.userData.spinners = [
    { node: chuck, axis: 'y', rpm: 180 },              // 旋涂吸盘
    { node: bladePivot, axis: 'y', rpm: 240 },         // 划片刀
  ];
  group.userData.oscillators = [
    { node: armPivot, axis: 'y', prop: 'rotation', amp: 1.15, period: 7 }, // 传送臂扫摆
  ];
  group.userData.animate = (t) => {
    for (let i = 0; i < stepperLeds.length; i++) {     // 光刻机状态灯流水
      stepperLeds[i].emissiveIntensity = 0.6 + (Math.sin(t * 2.4 + i * 1.1) > 0.2 ? 1.8 : 0);
    }
    G.beam.opacity = 0.25 + 0.3 * Math.max(0, Math.sin(t * 1.8));          // 曝光呼吸
    G.evapGlow.emissiveIntensity = 1.2 + 0.7 * Math.max(0, Math.sin(t * 2.6)); // 蒸发源辉光
    for (const m of dieMats) m.emissiveIntensity = 1.2 + 0.9 * Math.sin(t * 2.0); // 坏品闪烁
  };
  group.userData.entry = { pos: [0, 0, 6.6], yaw: 0 };
  group.userData.exitZone = { pos: [-6.2, 7.3], radius: 1.2 };   // 地表电梯龛
  return group;
}
