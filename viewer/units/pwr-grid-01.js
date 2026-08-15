// pwr-grid-01 —— 主变电站与配电枢纽 / Main substation and distribution hub
//
// 火星城有 848 MW 的聚变堆，却一根电缆也没有。这座站是缺失的那一环：
// 把发电机端的 13.8 kV 交流整流成 ±10 kV 直流，交给全城 16 条埋地走廊。
//
// 几何即账本（设计册 E:\Claude\mars-grid，10 本账 71 闸全绿）：
//   · 没有铁塔 —— 6 mbar CO₂ 里 20 kV 裸导线要 123 mm 直径才不电晕（账2）
//     所以本站没有一根架空裸线，只有充压母线管廊 + 埋地电缆沟
//   · 唯一的交流只有 72 m —— 同步发电机产生交流，别无办法；进厅就整流（账3）
//   · 电缆沟不是「不挖就烧穿」—— 账 9 用完整 IEC 60287 推翻了账 3 那句：
//     6 回路 30 cm 直埋其实 315 K 通过（账 3 把互热乘 N，高估 2 倍）。
//     沟真正买的是**间距**（15 cm 挤着 343 K / 30 cm 315 K / 沟内 247 K）
//     加检修通道。几何不变，理由变了。
//   · 「接地网」其实是等电位联结网 —— 火星要 5 Ω 接地极需半径 5000 km，
//     比行星本身还大（账2）。全城 IT 制不接地系统 + 绝缘监测
//   · 阀塔里是压接式 IGBT 不是晶闸管 —— 账 3 说「故障靠叫停变流器来清」，
//     这句话只有电压源换流器（VSC）才成立，晶闸管封不住直流侧故障（账7）
//   · 两台 4 MVA 而不是 12 MVA —— N-1 只需盖住 2.6 MW 战役工况；12 MVA 的
//     变压器铁损 24 h 常烧，每火星年多 243 MWh（账7）
//
// 同色因果链：琥珀=13.8 kV 交流进 · 红=+10 kV 极 · 蓝=−10 kV 极 ·
//             绿黄=等电位联结 —— 一眼读完整座站的拓扑。
export const meta = {
  id: 'pwr-grid-01',
  name: '主变电站与配电枢纽',
  name_en: 'Main Substation & Distribution Hub',
  size_m: 46.8, size_axis: 'width',      // 实测包围盒最大边（validate_unit 实测值）
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const g = new THREE.Group();

  // ---- 材质 --------------------------------------------------------
  const M = (c, o = {}) => new THREE.MeshStandardMaterial(
    Object.assign({ color: c, roughness: 0.78 }, o));
  const pad = M(0x8a7566);                       // 烧结土坪
  const padDark = M(0x6f5c50);
  const hull = M(0xcfc7b8);                      // 厅体外壳
  const hullIn = M(0x9aa0a8, { side: THREE.DoubleSide });
  const trim = M(0x6d7278);
  const steel = M(0x9aa0a8, { roughness: 0.5, metalness: 0.45 });
  const dark = M(0x22262c);
  const rad = M(0x0d0d0f, { roughness: 0.92 });
  const white = M(0xe6e2d8, { roughness: 0.62 });
  const AMBER = M(0xd9a441, { roughness: 0.55, metalness: 0.25 });   // 13.8 kV AC
  const POSR = M(0xc0392b, { roughness: 0.5, metalness: 0.3 });      // +10 kV
  const NEGB = M(0x2f6fb0, { roughness: 0.5, metalness: 0.3 });      // −10 kV
  const BOND = M(0x86b03a, { roughness: 0.6 });                      // 等电位联结
  const BONDY = M(0xd8c832, { roughness: 0.6 });
  const copper = M(0xb87333, { roughness: 0.42, metalness: 0.7 });
  const porc = M(0xdedad0, { roughness: 0.35 });                     // 瓷套
  const orange = M(0xd4762a, { roughness: 0.62 });                   // 安全橙
  const nightMats = [], blinkMats = [], allMats = [];

  const reg = (m) => { allMats.push(m); return m; };
  [pad, padDark, hull, hullIn, trim, steel, dark, rad, white, AMBER, POSR, NEGB,
    BOND, BONDY, copper, porc, orange].forEach(reg);

  const box = (w, h, d, m, x, y, z, ry) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z); if (ry) o.rotation.y = ry; g.add(o); return o;
  };
  const cyl = (r1, r2, h, seg, m, x, y, z, rot) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m);
    o.position.set(x, y, z);
    if (rot) o.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    g.add(o); return o;
  };
  const emissive = (c, i) => {
    const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i,
      roughness: 0.4 });
    nightMats.push(m); allMats.push(m); return m;
  };
  // 确定性伪随机（作业痕迹用，禁 Math.random 保证每次一致）
  let _s = 20260809;
  const rnd = () => { _s = (_s * 1664525 + 1013904223) % 4294967296; return _s / 4294967296; };

  // =================================================================
  // 0. 站坪 + 作业痕迹
  //    坪被电缆沟切开 —— 沟是真的沟，不是画在地上的线。北坪整块，
  //    南坪按三条分支沟断开，人可以直接看进沟里的电缆。
  // =================================================================
  const TZ = 8.2, TW = 1.9;                               // 电缆沟中心线与净宽
  const TN = TZ - TW / 2 - 0.15, TS = TZ + TW / 2 + 0.15; // 沟两侧坪边
  box(46, 0.5, TN + 15, pad, 0, 0.15, (TN - 15) / 2);     // 北坪（含厅、柜列、管廊）
  const BRX = [-16, -3, 11];                              // 三条分支沟中心
  const SEG = [[-23, -16.95], [-15.05, -3.95], [-2.05, 10.05], [11.95, 23]];
  for (const [x0, x1] of SEG)                             // 南坪：被分支沟断开
    box(x1 - x0, 0.5, 15 - TS, pad, (x0 + x1) / 2, 0.15, (TS + 15) / 2);
  box(46.6, 0.22, 30.6, padDark, 0, 0.02, 0);             // 裙边
  for (let i = 0; i < 2; i++)                             // 车辙
    box(1.1, 0.03, 20, padDark, 8 + i * 3.0, 0.41, -3);
  for (let i = 0; i < 34; i++) {                          // 散落砾石
    const s = 0.10 + rnd() * 0.16;
    const gz = -14 + rnd() * 28;
    if (gz > TN - 0.6 && gz < TS + 0.6) continue;         // 别掉沟里
    box(s, s * 0.6, s, padDark, -22 + rnd() * 44, 0.42, gz, rnd() * 3);
  }

  // =================================================================
  // 1. 整流/变压厅 —— 朝 +Z 整面剖开，露出变压器与阀厅
  //    24(x) × 9(y) × 13(z)，中心 (-7, ., -5)
  // =================================================================
  const HX = -7, HZ = -5, HW = 24, HD = 13, HH = 9;
  box(HW, 0.35, HD, trim, HX, 0.55, HZ);                                  // 厅内地坪
  box(HW, HH, 0.35, hull, HX, 0.4 + HH / 2, HZ - HD / 2);                 // 后墙
  box(0.35, HH, HD, hull, HX - HW / 2, 0.4 + HH / 2, HZ);                 // 左墙
  box(0.35, HH, HD, hull, HX + HW / 2, 0.4 + HH / 2, HZ);                 // 右墙
  box(HW + 0.9, 0.45, HD + 0.9, hull, HX, 0.4 + HH + 0.22, HZ);           // 顶盖
  box(HW + 1.3, 0.18, HD + 1.3, trim, HX, 0.4 + HH + 0.52, HZ);           // 顶盖压条
  for (const sx of [-1, 1])                                               // 前角柱
    box(0.55, HH, 0.55, trim, HX + sx * HW / 2, 0.4 + HH / 2, HZ + HD / 2);
  box(HW, 0.7, 0.5, trim, HX, 0.4 + HH - 0.35, HZ + HD / 2);              // 前檐梁
  // 内壁（从前面看得见里面）
  box(HW - 0.7, HH - 0.4, 0.05, hullIn, HX, 0.6 + (HH - 0.4) / 2, HZ - HD / 2 + 0.25);

  // --- 两个变流单元（N-1）：A 台带壳，B 台开盖露阀塔 ---------------
  const bays = [{ x: HX - 6, open: false }, { x: HX + 6, open: true }];
  const valveGlow = emissive(0x63b4d8, 0.9);
  bays.forEach((b, bi) => {
    // 变流变压器：本体 + 双侧散热片 + 三只套管
    box(5.4, 4.2, 4.2, steel, b.x, 2.6, HZ - 3.6);
    box(5.9, 0.35, 4.7, trim, b.x, 4.85, HZ - 3.6);                       // 顶板
    for (let s = -1; s <= 1; s += 2)
      for (let i = 0; i < 9; i++)
        box(0.10, 3.2, 0.9, trim, b.x + s * 2.85, 2.5, HZ - 5.4 + i * 0.45);
    for (let i = 0; i < 3; i++) {                                          // 交流侧套管（琥珀）
      const bx = b.x - 1.6 + i * 1.6;
      cyl(0.16, 0.16, 1.5, 10, porc, bx, 5.7, HZ - 3.6);
      for (let k = 0; k < 4; k++)
        cyl(0.30, 0.30, 0.09, 10, porc, bx, 5.15 + k * 0.42, HZ - 3.6);
      cyl(0.10, 0.10, 0.5, 8, AMBER, bx, 6.6, HZ - 3.6);
    }
    box(1.4, 0.5, 0.4, dark, b.x + 2.2, 1.2, HZ - 1.4);                    // 接线箱
    cyl(0.09, 0.09, 1.6, 8, trim, b.x + 2.2, 1.2, HZ - 0.7, [Math.PI / 2, 0, 0]);

    // 阀塔（VSC 整流）：3 层压接式 IGBT 阀模块 + 冷却歧管（账7：必须是 VSC）
    const vx = b.x, vz = HZ + 3.0;
    box(4.6, 6.4, 2.6, b.open ? dark : white, vx, 3.6, vz);
    box(5.0, 0.3, 3.0, trim, vx, 6.9, vz);
    if (b.open) {                                                          // 开盖：露阀模块
      for (let t = 0; t < 3; t++) {
        box(4.0, 1.5, 2.0, steel, vx, 1.5 + t * 2.05, vz + 0.15);
        for (let k = 0; k < 4; k++)                                        // 压接式 IGBT 阀堆
          cyl(0.26, 0.26, 1.1, 10, copper, vx - 1.4 + k * 0.95,
            1.5 + t * 2.05, vz + 0.15, [Math.PI / 2, 0, 0]);
        box(4.2, 0.16, 0.16, valveGlow, vx, 2.32 + t * 2.05, vz + 1.2);    // 阀位指示带
      }
      cyl(0.13, 0.13, 6.2, 8, NEGB, vx - 2.5, 3.6, vz + 0.9);              // 冷却歧管
      cyl(0.13, 0.13, 6.2, 8, POSR, vx + 2.5, 3.6, vz + 0.9);
    } else {
      box(4.62, 2.4, 0.06, emissive(0x2b3038, 0.35), vx, 4.4, vz + 1.33);  // 闭壳：检修窗
      box(4.7, 0.12, 0.12, trim, vx, 3.15, vz + 1.36);
      for (const s of [-1, 1]) {                                           // 双铰链密封门
        box(0.10, 1.0, 0.10, steel, vx + s * 1.9, 1.6, vz + 1.36);
        box(0.10, 1.0, 0.10, steel, vx + s * 1.9, 2.6, vz + 1.36);
      }
      box(0.28, 0.10, 0.12, steel, vx + 1.1, 2.1, vz + 1.40);              // 门闩
    }
    // 直流极母线：阀塔顶 → 前檐 → 下到电缆沟出线头墙（z = 5.6）
    box(0.34, 0.34, 7.5, POSR, vx - 1.0, 7.6, vz + 3.85);
    box(0.34, 0.34, 7.5, NEGB, vx + 1.0, 7.6, vz + 3.85);
    box(0.34, 6.6, 0.34, POSR, vx - 1.0, 4.3, vz + 7.6);
    box(0.34, 6.6, 0.34, NEGB, vx + 1.0, 4.3, vz + 7.6);
    for (let k = 0; k < 3; k++) {                                          // 支柱绝缘子
      cyl(0.22, 0.22, 0.10, 10, porc, vx - 1.0, 5.2 + k * 1.1, vz + 7.6);
      cyl(0.22, 0.22, 0.10, 10, porc, vx + 1.0, 5.2 + k * 1.1, vz + 7.6);
    }
    const lamp = emissive(bi === 0 ? 0x59ff8f : 0xffb347, 1.5);            // A 运行 / B 检修
    box(0.30, 0.30, 0.10, lamp, vx, 7.4, vz + 1.4);
    box(1.6, 0.5, 0.08, white, vx, 6.4, vz + 1.36);                        // 铭牌
  });

  // =================================================================
  // 2. 13.8 kV 交流进线 —— 充压 CO₂ 母线管廊（全城唯一的交流，72 m）
  //    朝 +X/+Z 指向聚变站 (-140,40)
  // =================================================================
  for (let i = 0; i < 4; i++)                                              // 管段
    cyl(0.50, 0.50, 4.4, 12, AMBER, 7.5 + i * 4.6, 5.2, -2.0, [0, 0, Math.PI / 2]);
  for (let i = 0; i < 3; i++) {                                            // 法兰 + 波纹补偿
    cyl(0.62, 0.62, 0.34, 12, steel, 9.8 + i * 4.6, 5.2, -2.0, [0, 0, Math.PI / 2]);
    for (let k = 0; k < 3; k++)
      cyl(0.60, 0.60, 0.10, 12, trim, 9.55 + i * 4.6 + k * 0.12, 5.2, -2.0,
        [0, 0, Math.PI / 2]);
  }
  for (const px of [9.0, 15.5, 22.0]) {                                    // 支墩 + 抱箍
    box(0.75, 4.4, 0.75, trim, px, 2.6, -2.0);
    box(1.25, 0.35, 1.25, padDark, px, 0.55, -2.0);
    box(1.15, 0.20, 0.30, steel, px, 4.85, -2.0);
  }
  box(1.0, 1.3, 0.7, white, 20.0, 6.4, -2.0);                              // CO₂ 充气/监压盘
  box(0.9, 0.55, 0.06, emissive(0x59ff8f, 0.8), 20.0, 6.55, -2.36);
  cyl(0.24, 0.24, 1.5, 10, steel, 21.4, 1.5, -2.0);                        // 充气瓶
  box(1.1, 0.34, 0.06, white, 20.0, 5.6, -2.36);                           // 「CO₂ 2 bar」牌

  // =================================================================
  // 3. 开关柜列 —— 密封真空断路器；一台开门露真空灭弧室
  // =================================================================
  for (let i = 0; i < 8; i++) {
    const cx = -18.5 + i * 2.0, opened = (i === 3);
    box(1.8, 2.7, 1.5, white, cx, 1.75, 2.6);
    box(1.9, 0.16, 1.6, trim, cx, 3.18, 2.6);                              // 柜顶压条
    box(1.86, 0.14, 1.56, trim, cx, 0.48, 2.6);                            // 底裙
    box(0.36, 0.36, 0.09, emissive(i % 3 === 1 ? 0xffb347 : 0x59ff8f, 1.4),
      cx + 0.55, 2.85, 3.36);                                              // 状态灯
    box(1.1, 0.26, 0.05, white, cx, 0.95, 3.36);                           // 回路铭牌
    if (opened) {                                                          // 开门：真空灭弧室
      box(1.7, 2.3, 0.08, hullIn, cx - 0.85, 1.75, 3.36, -Math.PI / 2.4);
      for (let k = 0; k < 3; k++) {
        const bz = 3.30, by = 1.0 + k * 0.62;
        cyl(0.17, 0.17, 0.56, 12, porc, cx - 0.45 + k * 0.45, by, bz);     // 陶瓷瓶
        cyl(0.21, 0.21, 0.08, 12, steel, cx - 0.45 + k * 0.45, by + 0.30, bz);
        cyl(0.21, 0.21, 0.08, 12, steel, cx - 0.45 + k * 0.45, by - 0.30, bz);
      }
      box(1.4, 0.10, 0.10, copper, cx, 2.42, 3.30);
    } else {
      box(1.5, 1.0, 0.05, emissive(0x2b3038, 0.3), cx, 2.15, 3.36);        // 观察窗
      box(0.24, 0.10, 0.10, steel, cx + 0.75, 1.6, 3.38);                  // 门闩
      for (const dy of [1.0, 2.6]) box(0.09, 0.28, 0.09, steel, cx - 0.88, dy, 3.36);
    }
  }
  box(17.0, 0.30, 2.0, padDark, -14.5, 0.50, 2.6);                         // 柜列基座

  // =================================================================
  // 4. 变流废热辐射排（12 MW 设计负荷 → 180 kW 损耗 → 270 m² 板面）
  // =================================================================
  for (let i = 0; i < 9; i++)
    box(0.13, 4.5, 3.6, rad, 9.0 + i * 1.15, 2.9, -10.5);
  cyl(0.20, 0.20, 11.0, 10, POSR, 14.0, 5.3, -9.0, [0, 0, Math.PI / 2]);   // 热管
  cyl(0.20, 0.20, 11.0, 10, NEGB, 14.0, 0.9, -9.0, [0, 0, Math.PI / 2]);   // 冷管
  box(2.6, 1.5, 1.8, white, 7.2, 1.2, -8.6);                               // 泵撬
  const pumps = [];
  for (const s of [-1, 1]) {
    const p = cyl(0.45, 0.45, 0.30, 12, steel, 7.2 + s * 0.75, 1.2, -7.62,
      [Math.PI / 2, 0, 0]);
    p.name = s < 0 ? 'pump_a' : 'pump_b';
    for (let k = 0; k < 5; k++)                                            // 叶轮辐板（看得见在转）
      box(0.10, 0.72, 0.05, trim, 7.2 + s * 0.75, 1.2, -7.48).rotation.z = k * 0.628;
    pumps.push(p.name);
  }

  // =================================================================
  // 5. 电缆沟（电缆沟出线口）—— 3 段掀盖露电缆，红/蓝/绿黄同色因果
  //    TZ / TW / BRX 在 §0 已定义（坪就是按它们切开的）
  // =================================================================
  // 沟壁（露 0.12 m 侧石，沟沿读得出来）+ 沟底
  for (const s of [-1, 1])
    box(46, 1.25, 0.30, padDark, 0, -0.10, TZ + s * (TW / 2 + 0.15));
  box(46, 0.18, TW + 0.6, padDark, 0, -0.62, TZ);                          // 沟底
  const OPEN = [-16, -3, 11];                                              // 掀盖段中心（对齐分支）
  for (let i = 0; i < 23; i++) {
    const lx = -22 + i * 2.0;
    if (OPEN.some((o) => Math.abs(lx - o) < 2.2)) continue;
    box(1.94, 0.16, TW + 0.34, trim, lx, 0.44, TZ);                        // 沟盖板
    box(0.30, 0.05, 0.30, steel, lx, 0.53, TZ);                            // 吊装孔
  }
  OPEN.forEach((ox, oi) => {
    for (let r = 0; r < 3; r++)                                            // 三层电缆支架
      for (const s of [-1, 1])
        box(0.14, 0.09, 0.90, steel, ox + s * 1.6, -0.26 + r * 0.28, TZ - 0.25);
    // 同色因果链：红 +10 kV · 蓝 −10 kV · 绿 等电位联结导体
    // 靠远侧壁码放：视线越过近侧侧石正好看进沟里
    const lay = [[POSR, -0.46], [NEGB, -0.20], [BOND, 0.06]];
    lay.forEach(([m, zo], li) => {
      for (let c = 0; c < 2; c++)
        cyl(0.062, 0.062, 4.2, 6, m, ox, -0.22 + li * 0.28, TZ + zo + c * 0.13,
          [0, 0, Math.PI / 2]);
    });
    if (oi === 1) {                                                        // 检修爬梯（兼比例尺）
      for (const s of [-1, 1])
        box(0.06, 1.30, 0.06, steel, ox + 1.95 + s * 0.20, -0.10, TZ + 0.55);
      for (let k = 0; k < 4; k++)
        box(0.46, 0.05, 0.05, steel, ox + 1.95, -0.58 + k * 0.34, TZ + 0.55);
    }
    for (const s of [-1, 1]) {                                             // 安全橙护栏
      box(4.2, 0.07, 0.07, orange, ox, 1.42, TZ + s * (TW / 2 + 0.42));
      box(4.2, 0.05, 0.05, orange, ox, 0.92, TZ + s * (TW / 2 + 0.42));
      for (let k = 0; k < 3; k++)
        box(0.09, 1.05, 0.09, orange, ox - 1.9 + k * 1.9, 0.93,
          TZ + s * (TW / 2 + 0.42));
    }
  });
  // 出线头墙：母线从厅前下来，穿墙入沟（沟沿正上方）
  for (const bx of [HX - 6, HX + 6]) {
    box(3.4, 2.0, 1.3, padDark, bx, 0.55, TZ - 2.3);
    box(3.6, 0.22, 1.5, trim, bx, 1.63, TZ - 2.3);
    box(0.34, 1.6, 0.34, POSR, bx - 1.0, 1.0, TZ - 2.3);
    box(0.34, 1.6, 0.34, NEGB, bx + 1.0, 1.0, TZ - 2.3);
    // 出线弯头：立母线 → 水平入沟（说明电缆是从这儿下去的）
    box(0.30, 0.30, 2.4, POSR, bx - 1.0, 0.10, TZ - 1.35);
    box(0.30, 0.30, 2.4, NEGB, bx + 1.0, 0.10, TZ - 1.35);
    box(2.6, 0.28, 0.06, white, bx, 1.42, TZ - 1.68);                      // 回路编号牌
  }

  // --- 三条分支沟 + 接线井（走廊起点）------------------------------
  BRX.forEach((bx) => {
    for (const s of [-1, 1])                                               // 分支沟壁
      box(0.26, 1.25, 6.0, padDark, bx + s * 1.05, -0.10, TZ + 3.9);
    box(1.9, 0.18, 6.0, padDark, bx, -0.62, TZ + 3.9);                     // 分支沟底
    box(1.94, 0.16, 3.0, trim, bx, 0.44, TZ + 5.4);                        // 分支盖板（近端留口）
    const m = [POSR, NEGB, BOND];                                          // 电缆拐进分支
    for (let li = 0; li < 3; li++)
      cyl(0.062, 0.062, 5.4, 6, m[li], bx, -0.22 + li * 0.28,
        TZ + 3.6 + (li - 1) * 0.16, [Math.PI / 2, 0, 0]);
    cyl(1.05, 1.05, 1.1, 14, padDark, bx, 0.10, TZ + 7.4);                 // 接线井
    cyl(0.92, 0.92, 0.14, 14, trim, bx, 0.68, TZ + 7.4);
    cyl(0.16, 0.16, 0.07, 8, steel, bx, 0.78, TZ + 7.4);                   // 吊耳
    cyl(0.05, 0.05, 0.22, 6, BOND, bx + 0.7, 0.78, TZ + 7.4);              // 联结柱
    box(0.60, 0.05, 0.24, POSR, bx, 0.76, TZ + 7.72);                      // 井盖色带
  });

  // =================================================================
  // 6. 走向标桩 —— 色带 = 电压等级，人字形 = 走向
  // =================================================================
  const POSTS = [
    { x: -19.5, band: POSR, dir: -0.5 }, { x: -12.5, band: POSR, dir: -0.35 },
    { x: -6.0, band: NEGB, dir: 0.0 }, { x: 1.5, band: AMBER, dir: 0.25 },
    { x: 8.0, band: POSR, dir: 0.45 }, { x: 15.0, band: M(0x63b4d8), dir: 0.6 },
  ];
  POSTS.forEach((p) => {
    box(0.30, 1.55, 0.30, white, p.x, 1.05, TZ + 10.6);
    box(0.44, 0.16, 0.44, trim, p.x, 1.90, TZ + 10.6);                      // 桩帽
    box(0.50, 0.34, 0.05, p.band, p.x, 1.55, TZ + 9.62);                   // 电压色带
    box(0.42, 0.42, 0.05, dark, p.x, 1.10, TZ + 9.62, p.dir);              // 人字走向牌
    box(0.34, 0.10, 0.05, white, p.x, 0.62, TZ + 9.62);                    // 里程号
    box(0.44, 0.24, 0.40, padDark, p.x, 0.38, TZ + 10.6);                   // 桩基
  });

  // =================================================================
  // 7. SCADA 控制间 —— 屏上实时潮流图（确定性动画）
  // =================================================================
  const CX = 16.5, CZ = 7.0;
  box(9.0, 4.2, 6.0, hull, CX, 2.5, CZ);
  box(9.6, 0.35, 6.6, trim, CX, 4.75, CZ);
  box(9.9, 0.16, 6.9, trim, CX, 5.02, CZ);
  box(9.2, 0.24, 6.2, padDark, CX, 0.52, CZ);
  const winMat = emissive(0xffd9a0, 0.55);
  box(6.4, 1.9, 0.10, winMat, CX, 3.0, CZ + 3.05);                         // 观察窗
  box(6.8, 0.14, 0.16, trim, CX, 4.02, CZ + 3.08);
  box(6.8, 0.14, 0.16, trim, CX, 1.98, CZ + 3.08);
  // 密封门（框 + 扇 + 闩 + 双铰链）
  box(1.5, 2.3, 0.16, trim, CX - 3.2, 1.55, CZ + 3.05);
  box(1.2, 2.05, 0.10, white, CX - 3.2, 1.52, CZ + 3.14);
  box(0.22, 0.10, 0.10, steel, CX - 2.72, 1.5, CZ + 3.20);
  for (const dy of [0.85, 2.2]) box(0.09, 0.26, 0.09, steel, CX - 3.72, dy, CZ + 3.14);
  box(1.6, 0.10, 0.35, trim, CX - 3.2, 0.46, CZ + 3.25);                   // 踏板
  // 潮流屏（朝 +Z，透窗可读）
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.5),
    emissive(0x0d1a24, 0.5));
  scr.position.set(CX, 3.0, CZ + 2.6); g.add(scr);
  const flowBars = [];
  const FLOW = [
    { c: 0xd9a441, x: -2.0 }, { c: 0xc0392b, x: -1.1 }, { c: 0x2f6fb0, x: -0.2 },
    { c: 0x59ff8f, x: 0.7 }, { c: 0x63b4d8, x: 1.6 },
  ];
  FLOW.forEach((f, i) => {
    const m = new THREE.MeshStandardMaterial({ color: f.c, emissive: f.c,
      emissiveIntensity: 1.1, roughness: 0.4 });
    nightMats.push(m); allMats.push(m);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9, 0.04), m);
    bar.position.set(CX + f.x, 2.75, CZ + 2.62);
    bar.scale.y = 0.5; g.add(bar);
    flowBars.push({ bar, ph: i * 1.13 });
  });
  box(4.7, 0.07, 0.05, trim, CX, 2.28, CZ + 2.62);                         // 屏底轴线
  box(3.2, 0.9, 1.4, dark, CX, 0.95, CZ + 1.2);                            // 值班台
  box(3.4, 0.10, 1.6, trim, CX, 1.42, CZ + 1.2);

  // =================================================================
  // 8. 等电位联结网标识（不是接地极 —— 账 2）
  // =================================================================
  box(22.0, 0.18, 0.14, BOND, -8.0, 0.55, 13.6);                           // 联结主导体
  box(22.0, 0.09, 0.15, BONDY, -8.0, 0.65, 13.6);                          // 绿黄双色
  for (let i = 0; i < 7; i++) {                                            // 测试端子
    const sx = -17 + i * 3.0;
    cyl(0.09, 0.09, 0.30, 8, copper, sx, 0.79, 13.6);
    box(0.26, 0.08, 0.26, steel, sx, 0.66, 13.6);
  }
  for (let r = 0; r < 3; r++)                                              // 网格标记板
    for (let c = 0; c < 5; c++)
      box(0.46, 0.04, 0.46, BOND, -14 + c * 7.0, 0.42, -11 + r * 7.6);
  box(2.4, 1.0, 0.10, white, -8.0, 1.6, 13.9);                             // 说明牌
  box(2.2, 0.30, 0.05, BOND, -8.0, 1.85, 13.96);
  for (const sx of [-9.0, -7.0]) box(0.10, 1.1, 0.10, trim, sx, 1.05, 13.9);

  // =================================================================
  // 9. 顶部信标 + 站牌 + 灯柱
  // =================================================================
  const beacon = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30,
    emissiveIntensity: 1.6, roughness: 0.4 });
  blinkMats.push(beacon); allMats.push(beacon);
  cyl(0.26, 0.26, 0.45, 10, beacon, HX, 0.4 + HH + 0.75, HZ);
  cyl(0.13, 0.13, 0.7, 8, trim, HX, 0.4 + HH + 0.35, HZ);
  box(7.2, 1.05, 0.12, white, HX, 0.4 + HH - 0.4, HZ + HD / 2 + 0.08);     // 站名牌
  box(6.8, 0.26, 0.05, AMBER, HX, 0.4 + HH - 0.72, HZ + HD / 2 + 0.15);
  for (const lx of [-21.5, 21.5]) {                                        // 场区灯柱
    box(0.24, 6.0, 0.24, trim, lx, 3.2, 12.0);
    box(0.9, 0.22, 0.5, trim, lx, 6.25, 12.0);
    box(0.8, 0.10, 0.42, emissive(0xffe6b0, 1.1), lx, 6.10, 12.0);
  }

  // =================================================================
  // POI 锚点
  // =================================================================
  const anchor = (id, x, y, z) => {
    const a = new THREE.Object3D(); a.name = 'poi_' + id;
    a.position.set(x, y, z); g.add(a);
  };
  anchor('ledger', HX, 6.2, HZ + HD / 2 + 1.5);      // 头条：全城用电台账
  anchor('valvehall', HX + 6, 4.2, HZ + 3.0);        // 电压等级 / MVDC / 损耗
  anchor('busduct', 15.5, 5.8, -2.0);                // 帕邢：为什么没有铁塔
  anchor('trench', -3, 0.9, TZ);                     // 电缆沟与埋地热陷阱
  anchor('bonding', -8.0, 1.4, 13.9);                // 火星没有「地」
  anchor('switchgear', -12.5, 2.8, 3.4);             // 孤岛与减载阶梯
  anchor('scada', CX, 3.4, CZ + 3.4);                // 风暴季应急序列
  anchor('seisfeed', BRX[0], 1.0, TZ + 7.4);         // 火震站埋地低压支线

  // =================================================================
  // 尘膜 pass（六招收尾）
  // =================================================================
  for (const m of allMats) if (m.color) m.color.lerp(new THREE.Color(0x9e5b3d), 0.05);

  // =================================================================
  // 引擎接口
  // =================================================================
  g.userData.nightMats = nightMats;
  g.userData.blinkMats = blinkMats;
  g.userData.spinners = pumps.map((n) => ({ node: n, axis: 'y', rpm: 90 }));
  g.userData.lights = [
    { color: 0xffd9a0, pos: [CX, 3.4, CZ + 3.6], range: 26 },
    { color: 0x9fd0ff, pos: [HX + 6, 4.5, HZ + 3.0], range: 30 },
  ];
  // 潮流屏：纯 t 分段，无累积状态，任意 t 跳入都成立。
  // 两个分量的周期都整除 12 s，泵 90 rpm 在 12 s 内正好 18 转
  // —— 整件资产的动态在 T=12 s 上首尾闭合（MODELS.md §6a 动图约定）。
  const W1 = Math.PI * 2 / 12, W2 = Math.PI * 2 / 4;
  g.userData.animate = (t) => {
    for (let i = 0; i < flowBars.length; i++) {
      const f = flowBars[i];
      const v = 0.34 + 0.30 * Math.sin(W1 * t + f.ph)
        + 0.16 * Math.sin(W2 * t + f.ph * 2.1);
      f.bar.scale.y = v;
      f.bar.position.y = 2.75 + (v - 0.5) * 0.45;
    }
  };
  return g;
}
