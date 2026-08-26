// viewer/units/sci-radio-01.js — 低频射电天文阵（0.5–10 MHz）
// 设计册 E:\Claude\mars-radio（二十本解析账）
// 单资产内摆阵（非 scatter）：干涉阵的基线就是仪器本身——28 桩坐标由设计册
// sim/02_array.py 确定性生成（种子 20260806，最小间距 18 m），缆道电长实测标定，
// 不能交给引擎随机撒放。全阵无转动部件（指向纯电子波束合成）＝spinners 留空是设计特征。
//
// v2 深挖（几何全部由账反推）：
//   刀片臂        ← 账5：短偶极子是电容分压高阻探头，C_a 是唯一几何杠杆（+46% / +1.06 dB）
//                   臂长 2.5 m（5 m 翼展）＝账5 建模的那副天线本身：10 MHz 上 0.17λ，
//                   短偶极子框架成立；08-09 前误建成 5.3 m 臂（0.35λ 近谐振，账1/账5 公式失效）
//   桩顶 LNA 盒   ← 账5：放大器必须在天线端子上（挪到桩下 C_in 10→25 pF，0.5 MHz 损失 12%→24%）
//   桩基剖切单元  ← 账5/6/9：射频分配（偏置 T + 共模扼流 + 带定滤波罐）+ 定标注入耦合器 + 电源
//                   馈线定版同轴（非模拟光纤）：账6 的 50 ppm/K 与 duct 卡的铜束由此自洽；
//                   代价是 160 m 尺度上 28 根屏蔽层的地环路 → 每桩一只共模扼流圈
//   缆沟剖切      ← 账6：埋深 0.35 m，火星昼夜热波趋肤深度只有 3.6 cm
//   动态谱瀑布屏  ← 账3/7：截止暗带 + III 型暴群 + II 型暴基频/谐频，纯 t 120 s 超循环
//   SEP 警报灯    ← 账7：II 型暴出现 = 给 sci-rad-01 警报塔的 27–105 min 提前量
//   对城零陷方位牌← 账4：常驻零陷指向城区扇区（+Z 侧，与进场车辙同向）
//   紫色定标注入链← 账6/15/18：夜里没有强点源可做自定标（账18 B），全阵相位
//                   基准就落在这条链的等臂功分器上——它不是偏振细节，是夜班基准

export const meta = {
  id: 'sci-radio-01',
  name: '低频射电天文阵',
  name_en: 'Low-Frequency Radio Array (0.5-10 MHz)',
  size_m: 166.95,              // 实测包围盒（validate INFO 回填）
  effects: ['glow_windows', 'blink'],
};

// 桩位 = 设计册 out/array.json layout_xz_m（勿手改——改阵列先改 02_array.py）
const LAYOUT = [[-47.1, -37.6], [-41.3, 60.9], [-61.1, 26.8], [-20.2, 28.7],
  [29.5, -58.5], [-21.4, -17.1], [-16.7, -43.3], [-22.5, 51.9], [6.8, 71.7],
  [40.7, -5.6], [32.9, 28.0], [-7.7, -77.0], [-55.8, 0.4], [-61.2, -51.2],
  [35.3, 55.3], [15.1, 9.0], [31.9, -31.3], [66.0, 42.4], [10.7, -50.9],
  [52.7, -32.8], [1.4, -33.2], [-64.2, -22.7], [62.3, 24.0], [2.7, 34.9],
  [-1.1, -5.8], [59.0, -4.9], [-42.4, 18.4], [72.3, -24.9]];

const CUTAWAY = 15;            // 剖切示范桩（LAYOUT[15] = [15.1, 9.0]，poi_mast 锚点）

export function build(THREE) {
  const group = new THREE.Group();

  // 确定性伪随机
  let _seed = 20260806;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash2 = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  // ---- 材质 ----
  const M = {
    alu:    new THREE.MeshLambertMaterial({ color: 0xb9bfc4 }),   // 天线杆铝
    blade:  new THREE.MeshLambertMaterial({ color: 0xa9b0b6, side: THREE.DoubleSide }),
    dark:   new THREE.MeshLambertMaterial({ color: 0x3a3f46 }),
    darker: new THREE.MeshLambertMaterial({ color: 0x24272c }),
    white:  new THREE.MeshLambertMaterial({ color: 0xdfd9d2 }),
    whiteD: new THREE.MeshLambertMaterial({ color: 0xcac2b8 }),
    orange: new THREE.MeshLambertMaterial({ color: 0xd4772a }),
    copper: new THREE.MeshLambertMaterial({ color: 0x8a5a33 }),   // 缆道=电长标定馈线
    pv:     new THREE.MeshLambertMaterial({ color: 0x24344e }),
    pier:   new THREE.MeshLambertMaterial({ color: 0x8d7663 }),
    green:  new THREE.MeshLambertMaterial({ color: 0x3d6b4f }),
    pcb:    new THREE.MeshLambertMaterial({ color: 0x2c6b45 }),
    violet: new THREE.MeshLambertMaterial({ color: 0x6b4f8a }),   // 定标注入链（全阵同色）
    soilA:  new THREE.MeshLambertMaterial({ color: 0xb08055 }),   // 剖面：表层松散风化层（浅）
    soilB:  new THREE.MeshLambertMaterial({ color: 0x5c3a29 }),   // 剖面：下层结壳（深）
    rock:   new THREE.MeshLambertMaterial({ color: 0x9a6a4a }),
    rockB:  new THREE.MeshLambertMaterial({ color: 0x7d5238 }),
  };
  // 夜光/闪烁材质（引擎接管，勿在别处驱动——坑账 20）
  const winMat = new THREE.MeshLambertMaterial({ color: 0xffe6b8, emissive: 0xffc873, emissiveIntensity: 0.5 });
  const tipMat = new THREE.MeshLambertMaterial({ color: 0x9fd8ff, emissive: 0x6fb8ef, emissiveIntensity: 0.6 });
  const ledMat = new THREE.MeshLambertMaterial({ color: 0x9fe8c0, emissive: 0x53c98a, emissiveIntensity: 0.9 });
  const beaconMat = new THREE.MeshLambertMaterial({ color: 0xff5540, emissive: 0xff3322, emissiveIntensity: 2.0 });
  // 自管材质（animate 自驱，两个数组都不进——避免双驱动）
  const alertMat = new THREE.MeshLambertMaterial({ color: 0x2a0a08, emissive: 0xff3a20, emissiveIntensity: 0.05 });
  // 账17：触发器状态灯——值守(暗绿)/命中转储(亮白)/风暴限速(琥珀)。自管，不进两数组
  const trigMat  = new THREE.MeshLambertMaterial({ color: 0x0d1a12, emissive: 0x53c98a, emissiveIntensity: 0.25 });
  const calMat   = new THREE.MeshLambertMaterial({ color: 0x1a1024, emissive: 0xa070ff, emissiveIntensity: 0.15 });

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };

  // ---- 偶极子桩：交叉倒 V 刀片偶极子（LWA blade 体制）----
  // 账5：刀片有效半径 = w/4，C_a 17.7→25.8 pF（+46%，账13 矩量法实解 35.4 pF），分压比 0.639→0.721（+1.06 dB）
  // 账16：刀片只有宽度进电学账，厚度纯属结构——0.5 mm 薄板每桩省 10 kg、
  //       固有频率 1.87→2.71 Hz、天线场 2.26→1.98 t（几何按薄板画）
  const poleGeo   = new THREE.CylinderGeometry(0.055, 0.07, 4.8, 6, 1, true);
  const bladeX    = new THREE.BoxGeometry(0.25, 2.5, 0.012);   // ±x 臂：刀面在 x-y 竖直面
  const bladeZ    = new THREE.BoxGeometry(0.012, 2.5, 0.25);   // ±z 臂：刀面在 y-z 竖直面
  const ARM_TILT  = Math.atan2(1.62, 1.90);   // 40.5°，2.5 m 臂：水平 1.62 / 落差 1.90
  const mast = (mx, mz, cut) => {
    const g = new THREE.Group();
    g.position.set(mx, 0, mz);
    group.add(g);
    box(0.55, 0.5, 0.55, M.pier, 0, 0.25, 0, g);                  // 基墩
    box(0.42, 2.8, 0.42, M.pier, 0, -1.4, 0, g);                  // 沉箱下延（地形高差 ~4 m）
    const pole = new THREE.Mesh(poleGeo, M.alu);
    pole.position.y = 2.9; g.add(pole);
    box(0.27, 0.24, 0.27, M.white, 0, 5.02, 0, g);                // 桩顶 LNA 盒（账5：必须在端子上）
    for (let k = 0; k < 4; k++) {
      const dx = [1, -1, 0, 0][k], dz = [0, 0, 1, -1][k];
      const arm = new THREE.Mesh(dx ? bladeX : bladeZ, M.blade);
      arm.position.set(dx * 0.81, 4.07, dz * 0.81);
      if (dx) arm.rotation.z = dx * ARM_TILT;
      else    arm.rotation.x = -dz * ARM_TILT;
      g.add(arm);
      box(0.07, 5.0, 0.07, M.darker, dx * 1.62, 0.62, dz * 1.62, g); // 端锚桩（顶 3.12 接臂尖，下延 2 m）
    }
    box(0.08, 0.08, 0.08, tipMat, 0, 5.38, 0, g);                 // 桩顶微光（夜）
    // 桩基接收单元：端子后的第一段链路（偏置 T / 定标注入 / 共模扼流 / 电源）
    if (!cut) {
      box(0.36, 0.5, 0.3, M.whiteD, 0.42, 0.3, 0, g);             // 闭合机箱
      box(0.06, 0.16, 0.02, M.violet, 0.6, 0.42, 0.16, g);        // 定标注入口（全阵同色）
    } else {
      // ---- 剖切示范桩：+Z 面整面打开 ----
      box(0.36, 0.5, 0.02, M.whiteD, 0.42, 0.3, -0.15, g);        // 背板
      box(0.02, 0.5, 0.3, M.whiteD, 0.25, 0.3, 0, g);             // 侧板 ×2
      box(0.02, 0.5, 0.3, M.whiteD, 0.59, 0.3, 0, g);
      box(0.36, 0.02, 0.3, M.whiteD, 0.42, 0.55, 0, g);           // 顶板
      box(0.36, 0.02, 0.3, M.darker, 0.42, 0.06, 0, g);           // 底板
      box(0.3, 0.02, 0.24, M.pcb, 0.42, 0.44, -0.02, g);          // 射频分配板（偏置 T：同线送电取信号）
      box(0.05, 0.03, 0.05, ledMat, 0.32, 0.47, 0.06, g);         // 链路灯
      box(0.12, 0.1, 0.11, M.violet, 0.52, 0.22, 0.05, g);        // 定标注入定向耦合器（前排可见）
      box(0.13, 0.13, 0.09, M.dark, 0.31, 0.22, -0.06, g);        // 电源调理（后排）
      const flt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.13, 6), M.alu);
      flt.position.set(0.33, 0.4, 0.07); flt.rotation.z = Math.PI / 2;
      g.add(flt);                                                 // 带定滤波器罐（账9：滤波必须在 LNA 之后
                                                                  // ——放输入端会增加 C_in,直接吃灵敏度）
      box(0.02, 0.34, 0.02, M.copper, 0.42, 0.3, 0.09, g);        // 端子引下同轴
      const choke = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.026, 4, 10), M.darker);
      choke.position.set(0.42, 0.12, 0.075);                      // 共模扼流圈（选同轴的代价：切地环路）
      choke.rotation.x = Math.PI / 2; g.add(choke);
      box(0.02, 0.1, 0.02, M.copper, 0.42, 0.12, 0.075, g);       // 穿心同轴
      const door = box(0.34, 0.5, 0.025, M.orange, 0.7, 0.3, 0.24, g); // 外翻门扇
      door.rotation.y = -1.15;
      box(0.03, 0.03, 0.14, M.copper, 0.42, 0.07, 0.2, g);        // 同轴入沟（埋深 0.35 m）
    }
  };
  LAYOUT.forEach(([mx, mz], i) => mast(mx, mz, i === CUTAWAY));

  // ---- 缆道（电长标定馈线）：方舱辐射到每桩（地面盖板/标识条，实缆埋 0.35 m）----
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  for (const [mx, mz] of LAYOUT) {
    const d = Math.hypot(mx, mz);
    if (d < 4) continue;
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, d - 3.2), M.copper);
    _a.set(0, 0.05, 0); _b.set(mx, 0.05, mz);
    tray.position.copy(_a).lerp(_b, 0.5);
    tray.lookAt(_b);
    group.add(tray);
  }

  // ---- 缆沟剖切（账6：埋深 0.35 m vs 昼夜热波趋肤 3.6 cm）----
  const TR = new THREE.Group();
  { const u = new THREE.Vector2(-20.2, 28.7).normalize();
    TR.position.set(u.x * 8.2, 0, u.y * 8.2);
    TR.rotation.y = Math.atan2(u.x, u.y); }
  group.add(TR);
  // 地面以下的坑会被地形整个挡死（坑账 3），所以做成「抬升的地层剖面展台」：
  // 把一段地柱整体提到地面上、两侧切面敞开，埋深关系 1:1 保留（台顶 = 地面基准）
  const PW = 1.05, PL = 2.2, PH = 0.62, DUCT_D = 0.35;            // 埋深 0.35 m
  const yDuct = PH - DUCT_D;
  box(PW, PH, PL, M.soilB, 0, PH / 2 - 0.06, 0, TR);              // 地柱本体（下层结壳）
  box(PW + 0.01, 0.14, PL + 0.01, M.soilA, 0, PH - 0.13, 0, TR);  // 表层松散风化层
  box(PW + 0.02, 0.03, PL + 0.02, M.rockB, 0, PH - 0.05, 0, TR);  // 地表面
  for (const sx of [-1, 1]) {                                     // 两侧切面：导管+缆束外露
    box(0.06, 0.14, PL * 0.96, M.dark, sx * (PW / 2 + 0.02), yDuct, 0, TR);
    box(0.05, 0.06, PL * 0.96, M.copper, sx * (PW / 2 + 0.045), yDuct, 0, TR);
    box(0.03, DUCT_D, 0.03, M.white, sx * (PW / 2 + 0.03), PH - DUCT_D / 2, -PL / 2 + 0.18, TR);
  }
  box(0.16, 0.05, PL + 0.4, M.copper, 0, PH - 0.02, 0, TR);       // 台顶地面标识条（与全场缆道同色）
  box(0.24, 0.16, 0.55, M.dark, 0, yDuct + 0.06, PL / 2 - 0.1, TR); // 上折出沟段
  box(PW + 0.1, 0.05, 0.06, M.orange, 0, PH + 0.03, PL / 2 + 0.05, TR); // 安全边框
  box(PW + 0.1, 0.05, 0.06, M.orange, 0, PH + 0.03, -PL / 2 - 0.05, TR);
  box(0.08, 1.05, 0.08, M.dark, -0.78, 0.52, PL / 2 + 0.1, TR);   // 标牌
  box(0.55, 0.36, 0.04, M.white, -0.78, 1.14, PL / 2 + 0.1, TR);
  box(0.44, 0.06, 0.02, M.violet, -0.78, 1.22, PL / 2 + 0.13, TR);
  box(0.3, 0.05, 0.02, M.soilA, -0.78, 1.09, PL / 2 + 0.13, TR);

  // ---- 中心电子方舱（+Z 面整面开放＝核心不做黑盒）----
  const SH = new THREE.Group(); group.add(SH);
  box(4.4, 0.16, 3.2, M.darker, 0, 0.1, 0, SH);                   // 底板
  box(4.4, 2.5, 0.14, M.white, 0, 1.43, -1.53, SH);               // 背墙
  box(0.14, 2.5, 3.2, M.white, -2.13, 1.43, 0, SH);               // 侧墙 ×2
  box(0.14, 2.5, 3.2, M.white, 2.13, 1.43, 0, SH);
  box(4.4, 0.14, 3.2, M.whiteD, 0, 2.75, 0, SH);                  // 顶盖
  box(4.7, 0.12, 3.5, M.whiteD, 0, 2.87, 0, SH);                  // 顶盖压条
  box(4.7, 0.22, 3.5, M.whiteD, 0, 0.11, 0, SH);                  // 底裙边
  box(0.14, 2.5, 0.14, M.orange, -2.13, 1.43, 1.53, SH);          // 开口面边柱
  box(0.14, 2.5, 0.14, M.orange, 2.13, 1.43, 1.53, SH);
  // 机柜三联：采集(铜色输入板=缆道同色因果链) / 波束合成 / 时钟基准
  const rack = (rx, panelMat, name) => {
    box(0.78, 1.9, 0.62, M.dark, rx, 1.13, -1.05, SH);
    box(0.7, 1.7, 0.05, panelMat, rx, 1.13, -0.72, SH);
    for (let i = 0; i < 4; i++)
      box(0.1, 0.05, 0.04, ledMat, rx - 0.22 + i * 0.15, 1.85, -0.7, SH);
    const an = new THREE.Object3D(); an.name = name;
    an.position.set(rx, 2.1, -1.0); SH.add(an);
  };
  rack(-1.35, M.copper, 'rack_adc');                              // 56 路 14 bit @50 MS/s
  box(0.16, 0.09, 0.05, trigMat, -1.35, 0.68, -0.7, SH);          // 触发器状态灯（账17）
  box(0.62, 0.3, 0.18, M.alu, -1.35, 0.32, -0.78, SH);            // 抗混叠滤波盘（账9：6 阶,50 MS/s 才建得出来）
  for (let i = 0; i < 4; i++)
    box(0.06, 0.06, 0.05, M.darker, -1.55 + i * 0.13, 0.32, -0.68, SH);
  rack(0, M.green, 'rack_beam');                                  // F+X 引擎 605 GFLOP/s + 147 GB DRAM 环
  rack(1.35, M.whiteD, 'rack_clock');                             // 铷钟
  box(0.34, 0.5, 0.4, M.violet, 1.35, 0.35, -0.2, SH);            // 定标注入源（紫链起点）
  box(0.09, 0.06, 0.05, calMat, 1.35, 0.62, -0.2, SH);            // 注入指示（animate 自驱）
  // 侧窗（夜光）+ 密封门
  box(0.1, 0.88, 1.12, M.orange, 2.19, 1.7, 0.35, SH);
  box(0.08, 0.7, 0.95, winMat, 2.23, 1.7, 0.35, SH);
  box(0.08, 2.0, 1.04, M.orange, -2.21, 1.15, 0.3, SH);
  box(0.1, 1.86, 0.9, M.whiteD, -2.25, 1.15, 0.3, SH);
  box(0.08, 0.24, 0.1, M.dark, -2.31, 1.12, 0.62, SH);
  box(0.06, 0.1, 0.14, M.dark, -2.29, 1.78, -0.05, SH);
  box(0.06, 0.1, 0.14, M.dark, -2.29, 0.55, -0.05, SH);
  // 背墙导管 + 接线箱 + 顶部小空调
  box(0.1, 2.2, 0.1, M.dark, -0.9, 1.3, -1.62, SH);
  box(0.1, 2.2, 0.1, M.dark, 1.1, 1.3, -1.62, SH);
  box(0.5, 0.42, 0.2, M.orange, 0.1, 1.5, -1.66, SH);
  box(0.8, 0.4, 0.6, M.whiteD, 1.4, 3.0, -0.6, SH);
  // 屋顶定标基准单极子（紫链终点：账6 注入源 → 28 桩）
  box(0.26, 0.3, 0.26, M.violet, -1.7, 3.02, 0.4, SH);
  const calWhip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 4, 1, true), M.alu);
  calWhip.position.set(-1.7, 3.92, 0.4); SH.add(calWhip);

  // ---- 太阳板（账8：17.7 m² → 晴天 9.8 kWh/sol，尘暴 2.6）----
  const PV = new THREE.Group(); PV.position.set(-7.5, 0, 1.0); group.add(PV);
  for (let r = 0; r < 2; r++) {
    const px = r * -3.1;
    const panel = box(2.6, 0.08, 3.4, M.pv, px, 1.15, 0, PV);
    panel.rotation.z = 0.42;
    for (const sz of [-1.2, 1.2]) {
      box(0.12, 0.72, 0.12, M.dark, px - 1.0, 0.36, sz, PV);
      box(0.12, 1.52, 0.12, M.dark, px + 1.0, 0.76, sz, PV);
    }
    box(2.4, 0.05, 0.1, M.alu, px, 1.2, -1.68, PV).rotation.z = 0.42;
    box(2.4, 0.05, 0.1, M.alu, px, 1.2, 1.68, PV).rotation.z = 0.42;
  }
  box(0.9, 1.1, 0.7, M.white, 1.9, 0.55, -1.4, PV);               // 夜班电池柜（2.3 kWh 可用 / 2.9 装机）
  box(4.4, 0.06, 0.16, M.copper, -4.3, 0.05, 0.35, group);

  // ---- 通讯桅（0.33 Mbit/s 动态谱回传；原始电压走 SSD 而非链路）----
  const CM = new THREE.Group(); CM.position.set(5.6, 0, -2.2); group.add(CM);
  box(0.5, 0.4, 0.5, M.pier, 0, 0.2, 0, CM);
  const cpole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 5.6, 6, 1, true), M.alu);
  cpole.position.y = 3.2; CM.add(cpole);
  const dishPivot = new THREE.Group();
  dishPivot.position.set(0, 5.15, 0.18);
  dishPivot.rotation.x = -1.05;
  CM.add(dishPivot);
  dishPivot.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.09, 0.24, 12),
    new THREE.MeshLambertMaterial({ color: 0xd8d3cc })));
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 4, 1, true), M.dark);
  feed.position.y = 0.35; dishPivot.add(feed);
  box(0.1, 0.1, 0.1, M.dark, 0, 0.62, 0, dishPivot);
  box(0.2, 0.28, 0.24, M.dark, 0, 4.3, 0.1, CM);
  box(0.09, 0.09, 0.09, beaconMat, 0, 6.12, 0, CM);               // 信标（blinkMats）

  // ---- 观测时刻表牌（账3：昼窗 >4 MHz / 夜窗全开）----
  const SG = new THREE.Group(); SG.position.set(3.4, 0, 3.6); group.add(SG);
  box(0.1, 1.5, 0.1, M.dark, -0.55, 0.75, 0, SG);
  box(0.1, 1.5, 0.1, M.dark, 0.55, 0.75, 0, SG);
  box(1.4, 0.85, 0.06, M.white, 0, 1.55, 0, SG);
  box(1.2, 0.16, 0.02, M.green, 0, 1.75, 0.035, SG);              // 夜窗全开
  box(1.2, 0.16, 0.02, M.orange, 0, 1.5, 0.035, SG);              // 昼窗 >4 MHz
  box(0.5, 0.1, 0.02, M.darker, -0.3, 1.3, 0.035, SG);

  // ---- 动态谱瀑布屏（账3 截止暗带 + 账7 II/III 型暴）----
  const SC = new THREE.Group(); SC.position.set(-4.0, 0, 3.4); group.add(SC);
  box(0.12, 1.9, 0.12, M.dark, -1.36, 0.95, 0, SC);
  box(0.12, 1.9, 0.12, M.dark, 1.36, 0.95, 0, SC);
  box(2.86, 1.66, 0.1, M.darker, 0, 1.86, 0, SC);                 // 屏框
  box(2.9, 0.1, 0.16, M.dark, 0, 2.72, 0, SC);                    // 遮阳檐
  const COLS = 36, ROWS = 16, SW = 2.6, SHH = 1.42;
  const F_LO = 0.5, F_HI = 10.0, CUTOFF = 0.63;                   // 账3 夜间截止
  const rowF = [], rowBg = [];
  const tsky = (f) => {                                            // 账1 Cane 1979
    const tau = 5.0 * Math.pow(f, -2.1);
    const I = 2.48e-20 * Math.pow(f, -0.52) * (1 - Math.exp(-tau)) / tau
            + 1.06e-20 * Math.pow(f, -0.80) * Math.exp(-tau);
    return I * 8.988e16 / (2 * 1.380649e-23 * (f * 1e6) * (f * 1e6));
  };
  for (let j = 0; j < ROWS; j++) {
    const f = F_LO * Math.pow(F_HI / F_LO, (j + 0.5) / ROWS);
    rowF.push(f);
    rowBg.push(Math.max(0, Math.min(1, (Math.log10(tsky(f)) - 5.15) / 2.35)));
  }
  const nQuad = COLS * ROWS, pos = new Float32Array(nQuad * 18), col = new Float32Array(nQuad * 18);
  let p = 0;
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    const x0 = -SW / 2 + i * SW / COLS, x1 = x0 + SW / COLS;
    const y0 = -SHH / 2 + j * SHH / ROWS, y1 = y0 + SHH / ROWS;
    const q = [[x0, y0], [x1, y0], [x1, y1], [x0, y0], [x1, y1], [x0, y1]];
    for (const [x, y] of q) { pos[p * 3] = x; pos[p * 3 + 1] = y; pos[p * 3 + 2] = 0; p++; }
  }
  const scGeo = new THREE.BufferGeometry();
  scGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // 屏幕自发光：MeshBasic 不吃场景光（等价 sci-rad-01 的黑漫反射+emissive 惯例，
  // 但支持 576 格逐格着色），昼夜一致可读
  const scMesh = new THREE.Mesh(scGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  scMesh.position.set(0, 1.86, 0.06);
  SC.add(scMesh);
  // 频标刻度（1 / 3 / 10 MHz）与图例
  for (const [f, c] of [[1, M.whiteD], [3, M.whiteD], [10, M.whiteD]]) {
    const y = 1.86 - SHH / 2 + SHH * Math.log(f / F_LO) / Math.log(F_HI / F_LO);
    box(0.1, 0.03, 0.03, c, -SW / 2 - 0.12, y, 0.07, SC);
  }
  box(0.34, 0.07, 0.02, M.orange, -1.0, 0.99, 0.07, SC);
  box(0.34, 0.07, 0.02, M.green, -0.4, 0.99, 0.07, SC);
  // SEP 警报灯（账7：II 型暴 → 给 sci-rad-01 的 27–105 min 提前量）
  const AL = new THREE.Group(); AL.position.set(-2.15, 0, 3.5); group.add(AL);
  box(0.14, 2.0, 0.14, M.dark, 0, 1.0, 0, AL);
  box(0.34, 0.3, 0.26, M.darker, 0, 2.12, 0, AL);
  box(0.26, 0.2, 0.06, alertMat, 0, 2.12, 0.15, AL);              // animate 自驱
  box(0.3, 0.1, 0.1, M.orange, 0, 2.34, 0.02, AL);

  // ---- 对城零陷方位牌（账4：常驻零陷指向城区扇区 = +Z，与进场车辙同向）----
  const NM = new THREE.Group(); NM.position.set(-0.2, 0, 11.5); group.add(NM);
  box(0.1, 1.15, 0.1, M.dark, -0.62, 0.58, 0, NM);
  box(0.1, 1.15, 0.1, M.dark, 0.62, 0.58, 0, NM);
  box(1.5, 0.5, 0.05, M.white, 0, 1.3, 0, NM);
  box(1.1, 0.2, 0.02, M.darker, 0, 1.3, 0.032, NM);               // 零陷=暗带
  const arrow = box(0.5, 0.06, 0.5, M.orange, 0, 1.62, 0, NM);    // 指向城区
  arrow.rotation.y = Math.PI / 4;

  // ---- 场界标桩 ×8（r=84 m 静默区界）----
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + 0.12;
    const bx = Math.cos(a) * 84, bz = Math.sin(a) * 84;
    box(0.09, 3.3, 0.09, M.orange, bx, -0.55, bz);
    box(0.16, 0.14, 0.03, M.white, bx, 1.0, bz);
  }

  // ---- 作业痕迹：进场车辙（自城区方向 +Z 来）+ 散石 ----
  box(0.55, 0.03, 14, M.rockB, -1.0, 0.015, 9.5);
  box(0.55, 0.03, 14, M.rockB, 0.6, 0.015, 9.5);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 12; i++) {
    const a = rnd() * 6.283, d = 4 + rnd() * 9, s = 0.08 + rnd() * 0.14;
    const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.rock : M.rockB);
    rock.position.set(Math.cos(a) * d, -0.3 * s + 1.618 * s * 0.62, Math.sin(a) * d);
    rock.scale.set(s, s * 0.62, s);
    rock.rotation.y = rnd() * 6.28;                               // 只绕 Y（坑账 1）
    group.add(rock);
  }

  // ---- POI 锚点 ----
  const poi = (name, x, y, z) => {
    const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z); group.add(o);
  };
  poi('poi_mast', 15.1, 3.4, 9.6);        // 剖切桩：短偶极子+前端（账1/5）
  poi('poi_array', -30, 3.0, 28);         // 阵列波束（账2）
  poi('poi_shelter', 0, 2.6, 0);          // 采集/波束合成/对城零陷（账2/4/5）
  poi('poi_duct', TR.position.x, 1.3, TR.position.z + 1.0);  // 地层剖面台：埋深+定标（账6）
  poi('poi_screen', -4.0, 2.6, 3.4);      // 动态谱：这个波段在看什么（账3/7）
  poi('poi_alert', -2.15, 2.5, 3.5);      // SEP 预警（账7，三层联动 sci-rad-01）
  poi('poi_sched', 3.4, 1.9, 3.6);        // 电离层窗口时刻表（账3）
  poi('poi_comm', 5.6, 4.6, -2.2);        // 数据链/功率/地月对比（账8）

  // ---- 尘膜 pass ----
  const dust = new THREE.Color(0x9e5b3d);
  [M.alu, M.blade, M.dark, M.darker, M.white, M.whiteD, M.orange, M.copper,
   M.pv, M.pier, M.green, M.pcb, M.violet, M.soilA, M.soilB]
    .forEach(m => m.color.lerp(dust, 0.05));

  // ---- 动态谱超循环（纯 t，T=120 s 屏时 ≈ 40 min 真时，×20 压缩）----
  // 26–55 s: III 型暴群（电子束 0.3c，10→0.5 MHz 用 3.4 s 屏时=68 s 真时）
  // 58–100 s: II 型暴（1500 km/s 激波，基频 2.0→1.0 MHz + 2× 谐频），警报灯亮
  const T = 120, DT = 0.5, NCOL = Math.round(T / DT);             // 240 列/循环，整数闭环
  const T3 = [26.0, 33.5, 41.0, 48.5], T3A = [1.0, 0.72, 1.0, 0.86];
  const TAU3 = 0.808, TAU2 = 95.7, T2A = 58.0, T2B = 100.0;
  const cA = new THREE.Color(0x0b1220), cBg = new THREE.Color(0x5c2418);
  const cMid = new THREE.Color(0xd8792a), cHot = new THREE.Color(0xfff2c8);
  const tmp = new THREE.Color();
  const cellVal = (tc, j, cMod) => {
    const f = rowF[j];
    if (f < CUTOFF) return -1;                                    // 电离层截止暗带
    let v = rowBg[j] * 0.42;
    // III 型：束流到达该频率的时刻 t_pass（f ∝ r^-1.81，束速 0.3c）
    for (let b = 0; b < T3.length; b++) {
      const tp = T3[b] + TAU3 * (Math.pow(F_HI / f, 1 / 1.81) - 1);
      let dt = tc - tp;
      if (dt < -60) dt += T; else if (dt > 60) dt -= T;            // 跨循环边界
      if (dt > -0.22 && dt < 0.95)
        v += T3A[b] * (dt < 0 ? 1 + dt / 0.22 : Math.exp(-dt / 0.34));
    }
    // 木星 Io-DAM 弧（账10）：带顶一条数小时的弯拱，跨循环接缝连续=首尾闭合的活证明；
    // 内部毫秒级 S 暴在 0.1 s 转储里被抹平，只有触发环缓存留得下（账8）
    const uJ = (tc + 14) % T;
    if (uJ < 30) {
      const fJ = 3.2 + 5.4 * Math.sin(Math.PI * uJ / 30);       // 3.2→8.6→3.2 MHz 拱形
      const dlJ = Math.log(f / fJ);                              // 30 s 屏时 ≈ 10 min 真时
      if (Math.abs(dlJ) < 0.15) {                                // = Io 弧顶点结构的时标
        const edge = Math.min(1, uJ / 3) * Math.min(1, (30 - uJ) / 3);
        v += 0.52 * edge * (1 - Math.abs(dlJ) / 0.15)
             * (0.72 + 0.55 * hash2(cMod * 0.91, j * 2.7));   // S 暴精细结构
      }
    }
    // II 型：基频 + 谐频，慢漂
    let d2 = tc - T2A;
    if (d2 < -60) d2 += T;
    if (d2 > 0 && tc < T2B + 4) {
      const fF = 2.0 * Math.pow(1 + d2 / TAU2, -1.81);
      const env = Math.min(1, d2 / 3) * Math.min(1, (T2B + 3 - tc) / 4);
      for (const [fc, amp] of [[fF, 0.62], [2 * fF, 0.44]]) {
        const dl = Math.log(f / fc);
        // 半带宽 0.12 (ln) 必须 ≥ 行间距之半 0.093，否则带心落在两行之间时整段消失
        if (Math.abs(dl) < 0.12) v += amp * env * (1 - Math.abs(dl) / 0.12);
      }
    }
    return v;
  };
  const paint = (t) => {
    const c0 = Math.floor(t / DT);
    for (let i = 0; i < COLS; i++) {
      const cAbs = c0 - (COLS - 1 - i);
      const cMod = ((cAbs % NCOL) + NCOL) % NCOL;                  // 噪声斑驳也按周期重复=首尾精确闭合
      const tc = ((cAbs * DT) % T + T) % T;
      for (let j = 0; j < ROWS; j++) {
        let v = cellVal(tc, j, cMod);
        if (v < 0) { tmp.copy(cA); }
        else {
          v *= 0.82 + 0.36 * hash2(cMod * 0.37, j * 1.13);        // 噪声斑驳
          v = Math.max(0, Math.min(1.35, v));
          if (v < 0.5) tmp.copy(cA).lerp(cBg, v / 0.5);
          else if (v < 0.9) tmp.copy(cBg).lerp(cMid, (v - 0.5) / 0.4);
          else tmp.copy(cMid).lerp(cHot, Math.min(1, (v - 0.9) / 0.45));
        }
        const base = (i * ROWS + j) * 18;
        for (let k = 0; k < 6; k++) {
          col[base + k * 3] = tmp.r; col[base + k * 3 + 1] = tmp.g; col[base + k * 3 + 2] = tmp.b;
        }
      }
    }
    scGeo.attributes.color.needsUpdate = true;
  };
  paint(0);

  group.userData.animate = (t) => {
    paint(t);
    const tc = ((t % T) + T) % T;
    // SEP 警报：II 型暴出现即置警（账7：27–105 min 提前量交给 sci-rad-01）
    const on = tc > T2A && tc < T2B + 6;
    alertMat.emissiveIntensity = on ? 0.5 + 1.9 * (0.5 + 0.5 * Math.sin(t * 6.5)) : 0.05;
    // 定标注入（账6 精度 0.006°；账18 定周期）：巡天模式 300 s 一次——
    // 比任何漂移快 300 倍，占空代价 1.75%→0.12%。屏上超循环 120 s，
    // 故此处按 60 s 演示节奏呈现，实机为 300 s。
    const ci = ((t % 60) + 60) % 60;
    calMat.emissiveIntensity = ci < 0.35 ? 1.6 : 0.15;
    // 账17 触发器：III 型暴群里每次命中闪白转储，II 型段亮琥珀=风暴限速生效
    let hit = 0;
    for (const tb of T3) { const d = tc - tb; if (d > 0 && d < 0.55) hit = 1 - d / 0.55; }
    if (on) { trigMat.color.setHex(0x3a2a08); trigMat.emissive.setHex(0xffb020); trigMat.emissiveIntensity = 1.1; }
    else if (hit > 0) { trigMat.color.setHex(0x1a1a1a); trigMat.emissive.setHex(0xffffff); trigMat.emissiveIntensity = 0.4 + 2.2 * hit; }
    else { trigMat.color.setHex(0x0d1a12); trigMat.emissive.setHex(0x53c98a); trigMat.emissiveIntensity = 0.25; }
  };

  // ---- 引擎声明 ----
  group.userData.nightMats = [winMat, tipMat, ledMat];
  group.userData.blinkMats = [beaconMat];
  group.userData.lights = [{ color: 0xffd9a0, pos: [0, 2.6, 2.2], range: 22 }];
  return group;
}
