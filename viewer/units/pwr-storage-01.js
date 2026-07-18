// pwr-storage-01 —— 储能场（"挖掘干净"版 · 已按 L0~L3 仿真链闭环校准）
// 两级储能：电池柜阵（昼夜循环）+ 再生燃料电池链 RFC（尘暴长储）。
// 设计点（analysis/design_point_final.json）：标称 833 kW · PCS 2 MW（橇×2）
//   · 电芯往返 99.45%（PyBaMM 实测）· 平均废热 31.4 kW < 37 kW 辐射能力
//   · 尘暴生存包线 145 kW @ 15% 残余。修改清单五条已全部执行：
//   ① O₂ 球缩至 d2.2 m（化学计量配平） ② 逆变器橇×2（PCS 扩容）
//   ③ 冷却主回路挂 PCS 橇（热主角） ④ SOC 灯柱数据化（userData.socCurve）
//   ⑤ 辐射板 6 块维持（散热瓶颈解除）
// 子设备标注：7 个 poi_ 空节点锚点，知识卡在 pwr-storage-01.info.json
// 四个被挖开的核心：
//   ① 存了多少电 —— 掀盖电池柜 + 模组抽屉 + SOC 灯柱（nightMats）
//   ② 电往哪流   —— 裸母线桥（电池阵 → 变压器），充/放端子蓝进橙出
//   ③ 热往哪去   —— 热/冷双色管线 + 泵组飞轮（spinners）→ 辐射板阵
//   ④ 尘暴怎么活 —— 电解槽 → H₂(白)/O₂(橙) 球罐(液位标尺) → 燃料电池 → 母线
// 契约：1 单位 = 1 米；原点 = 场区中心地面；+Y 上；出线走廊朝 +Z；
//       无贴图；MeshStandard；所有几何 y ≥ 0.2；最细独立构件 ≥ 25 cm。

export const meta = {
  id: 'pwr-storage-01',
  name: '储能场',
  size_m: 60,             // 场区长边，1 单位 = 1 米，禁止整体缩放
  effects: ['glow_windows', 'spinners'],
};

export function build(THREE) {
  const group = new THREE.Group();
  group.name = 'pwr-storage-01';

  // ---------- 材质 ----------
  const std = (color, roughness = 0.85, metalness = 0.05) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });

  // 朝天面尘膜：调暗、偏红 5%
  const dusted = (hex, roughness = 0.95) => {
    const c = new THREE.Color(hex);
    c.r *= 0.97; c.g *= 0.92; c.b *= 0.90;
    return new THREE.MeshStandardMaterial({ color: c, roughness, metalness: 0.02 });
  };

  const M = {
    white:    std(0xf2f0ea, 0.88),
    whiteTop: dusted(0xf2f0ea),
    module:   std(0xd9dde1, 0.7),    // 电芯模组
    grey:     std(0x8b9095, 0.8),
    greyTop:  dusted(0x8b9095),
    dark:     std(0x4a4e54, 0.75),
    darkTop:  dusted(0x4a4e54),
    black:    std(0x22252a, 0.6, 0.15),
    blackTop: dusted(0x22252a),
    base:     std(0xb9a48c, 0.98),   // 烧结硬化基座 / 隔堤
    baseTop:  dusted(0xb9a48c),
    orange:   std(0xc0662a, 0.8),    // 安全橙（支架 / 放电端子 / O₂）
    blue:     std(0x3f6fb5, 0.7),    // 充电端子
    copper:   std(0xb0764a, 0.45, 0.5), // 裸母线
    hot:      std(0xc75742, 0.6),    // 热回路
    cold:     std(0x4f86c9, 0.6),    // 冷回路
    h2:       std(0xe8ecef, 0.6),    // H₂ 白
    grille:   dusted(0xb8b4aa, 0.9),
    pipe:     std(0xa9adb2, 0.6, 0.3),
    socOff:   std(0x2c3136, 0.6),
  };

  // 夜间发光材质 → userData.nightMats
  const stripMat = new THREE.MeshStandardMaterial({
    color: 0x5cffd9, emissive: 0x4dffcf, emissiveIntensity: 1.0, roughness: 0.4,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xd8fff0, emissive: 0xcfffe9, emissiveIntensity: 1.0, roughness: 0.3,
  });
  const socGreen = new THREE.MeshStandardMaterial({
    color: 0x54ff7a, emissive: 0x3fe864, emissiveIntensity: 1.0, roughness: 0.4,
  });
  const socYellow = new THREE.MeshStandardMaterial({
    color: 0xffd94f, emissive: 0xf0c43a, emissiveIntensity: 1.0, roughness: 0.4,
  });
  group.userData.nightMats = [stripMat, windowMat, socGreen, socYellow];
  group.userData.spinners = [];   // { obj, axis: 'y'(局部), rpm }

  // ---------- 几何助手（y0 = 底面高度，所有 y0 ≥ 0.2） ----------
  const box = (w, h, d, mat, x, y0, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y0 + h / 2, z);
    if (ry) m.rotation.y = ry;
    group.add(m);
    return m;
  };
  // 顶面带尘膜的箱体（BoxGeometry 面序：+x,-x,+y,-y,+z,-z）
  const boxT = (w, h, d, side, top, x, y0, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      [side, side, top, side, side, side]);
    m.position.set(x, y0 + h / 2, z);
    if (ry) m.rotation.y = ry;
    group.add(m);
    return m;
  };
  const cyl = (r, h, mat, x, yc, z, rx = 0, seg = 12) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.position.set(x, yc, z);
    if (rx) m.rotation.x = rx;
    group.add(m);
    return m;
  };

  // ============================================================
  // 1. 电池柜阵：2 排 × 4 台（7 × 1.6 × 2.5），排间距 4 m
  //    后排(-Z)闭合柜 + 状态灯带；前排(+Z)掀盖挖开柜 + 模组抽屉
  //    每台配 SOC 灯柱；柜间防爆隔堤
  // ============================================================
  const cabX = i => -4 + (i - 1.5) * 9.5; // 柜距 9.5 m，阵列中心 x = -4
  const socBack = [3, 5, 2, 4], socFront = [4, 2, 5, 3];

  // SOC 灯柱：5 段指示，已充段绿色、满格段黄色（发光 → nightMats）
  // 灯段 mesh 汇入 userData.socColumns，viewer 可按 socCurve 实时驱动
  const socColumns = [];
  const socColumn = (px, z, lit) => {
    const zs = Math.sign(z);
    box(0.25, 2.3, 0.25, M.dark, px, 0.5, z + zs * 1.1);
    const blocks = [];
    for (let i = 0; i < 5; i++) {
      const m = i < lit ? (i === 4 ? socYellow : socGreen) : M.socOff;
      blocks.push(box(0.3, 0.32, 0.3, m, px, 0.68 + i * 0.42, z + zs * 1.15));
    }
    socColumns.push({ pos: [px, z], blocks });
  };

  for (const z of [-2.8, 2.8]) {
    // 条形基座（高 0.3）
    boxT(37, 0.3, 2.4, M.base, M.baseTop, -4, 0.2, z);
    for (let i = 0; i < 4; i++) {
      const cx = cabX(i);
      if (z < 0) {
        // ---- 闭合柜（后排）----
        boxT(7, 2.5, 1.6, M.white, M.whiteTop, cx, 0.5, z);
        box(0.15, 2.2, 0.08, stripMat, cx + 2.9, 0.6, z - 0.84); // 竖向状态灯带
        for (let k = 0; k < 8; k++) {                            // 柜顶散热格栅
          box(0.3, 0.08, 1.3, M.grille, cx + (k - 3.5) * 0.8, 3.0, z);
        }
        socColumn(cx - 3.8, z, socBack[i]);
      } else {
        // ---- 挖开柜（前排，面向 +Z 走廊）----
        boxT(7, 0.5, 1.6, M.white, M.whiteTop, cx, 0.5, z);      // 底部 BMS 托架
        box(7, 2.0, 0.25, M.white, cx, 1.0, 2.13);               // 背板
        box(0.3, 2.0, 1.6, M.white, cx - 3.35, 1.0, z);          // 端板 ×2
        box(0.3, 2.0, 1.6, M.white, cx + 3.35, 1.0, z);
        // 掀开的顶盖（铰链在背侧，向内侧仰起）
        const lid = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 1.6),
          [M.white, M.white, M.whiteTop, M.white, M.white, M.white]);
        lid.rotation.x = 0.6;
        lid.position.set(cx, 3.45, 1.39);
        group.add(lid);
        // 模组抽屉 3 层 × 8（第 2 层第 3 只抽出）
        for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) {
          const pull = (r === 1 && k === 2) ? 0.55 : 0;
          box(0.74, 0.55, 1.25, M.module,
            cx + (k - 3.5) * 0.8, 1.05 + r * 0.65, 2.93 + pull);
        }
        socColumn(cx - 3.8, z, socFront[i]);
      }
    }
    // 柜间防爆隔堤 ×3
    for (const mx of [-13.5, -4, 5.5]) {
      boxT(0.3, 2.9, 2.0, M.base, M.baseTop, mx, 0.5, z);
    }
  }

  // ============================================================
  // 2. 功率变换站（-X 端）：逆变器橇（发光窗）+ 鳍片变压器
  //    裸母线桥：三相铜排从电池阵上空爬向功率站，蓝进橙出端子
  // ============================================================
  // 逆变器橇 ×2（PCS 2 MW，L0v2 扩容解除充电卡口）
  for (const iz of [-2.2, 5.6]) {
    boxT(3.2, 0.35, 2.4, M.base, M.baseTop, -26.5, 0.2, iz);
    boxT(3, 2.2, 2, M.grey, M.greyTop, -26.5, 0.55, iz);
    box(2.5, 0.4, 0.08, M.dark, -26.5, 0.85, iz + 1.02);      // 通风带
    box(0.9, 0.5, 0.06, windowMat, -26.5, 1.7, iz + 1.03);    // 变流器厅发光窗
  }
  // 变压器箱（四面竖鳍 + 顶部套管）
  boxT(2.4, 0.3, 2.4, M.base, M.baseTop, -26.5, 0.2, 2.3);
  boxT(2, 2, 2, M.dark, M.darkTop, -26.5, 0.5, 2.3);
  for (const o of [-0.72, -0.24, 0.24, 0.72]) {
    box(0.3, 1.5, 0.25, M.dark, -26.5 - 1.13, 0.7, 2.3 + o);
    box(0.3, 1.5, 0.25, M.dark, -26.5 + 1.13, 0.7, 2.3 + o);
    box(0.25, 1.5, 0.3, M.dark, -26.5 + o, 0.7, 2.3 - 1.13);
    box(0.25, 1.5, 0.3, M.dark, -26.5 + o, 0.7, 2.3 + 1.13);
  }
  cyl(0.15, 0.45, M.grey, -26.9, 2.6, 2.3);
  cyl(0.15, 0.45, M.grey, -26.1, 2.6, 2.3);

  // 裸母线桥：三相铜排（z = -0.5 / 0 / +0.5），架在橙色门形支架上
  for (const bz of [-0.5, 0, 0.5]) {
    box(26.5, 0.25, 0.25, M.copper, -13.25, 2.3, bz);           // 水平铜排
    box(0.25, 1.9, 0.25, M.copper, -26.3, 0.6, bz);             // 端头垂直下引
  }
  boxT(1.4, 1.2, 1.8, M.dark, M.darkTop, -26.3, 0.2, 0);        // 端子箱
  // 充/放端子色码：电池阵引下立管，蓝进橙出
  box(0.4, 2.1, 0.4, M.blue, -8.75, 0.2, 0);
  box(0.4, 2.1, 0.4, M.orange, 0.75, 0.2, 0);

  // ============================================================
  // 3. 热管理：热/冷双色管线 → 泵组（飞轮 spinner）→ 辐射板阵(-Z)
  // ============================================================
  // 主回路 热(橙红)/冷(蓝)：从 PCS 橇南缘通向散热排母管
  // （L1 标定：废热主角是 PCS 与辅助系统，电化学仅占 10%）
  for (const [px, mat] of [[-26.1, M.hot], [-24.9, M.cold]]) {
    cyl(0.2, 17.5, mat, px, 1.0, -12.15, Math.PI / 2);   // z -3.4 → -20.9
    cyl(0.2, 3.1, mat, px, 1.0, -23.65, Math.PI / 2);    // z -22.1 → -25.2
  }
  // 电池阵支路（次要负荷，灰色细管）
  cyl(0.15, 21, M.pipe, -2, 1.0, -14.7, Math.PI / 2);    // z -4.2 → -25.2
  // 泵组橇：两台泵串在主回路上，前端飞轮可转（spinners）
  boxT(2.6, 0.4, 1.6, M.base, M.baseTop, -25.5, 0.2, -21.5);
  for (const px of [-26.1, -24.9]) {
    cyl(0.32, 1.2, M.grey, px, 1.0, -21.5, Math.PI / 2); // 泵体（轴向 Z）
    const fw = new THREE.Group();                        // 飞轮：局部 +Y = 旋转轴
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.22, 16), M.orange);
    fw.add(disc);
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.2), M.dark);
    s1.position.y = 0.14; fw.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.85), M.dark);
    s2.position.y = 0.14; fw.add(s2);
    fw.rotation.x = Math.PI / 2;                         // 轴指向 +Z
    fw.position.set(px, 1.0, -20.7);
    group.add(fw);
    group.userData.spinners.push({ obj: fw, axis: 'y', rpm: 90 });
  }
  // 辐射板阵：6 块黑色平板（4 × 2），V 形支架，后仰 15°
  // （L0v2 复核：平均废热 31.4 kW < 37 kW 持续散热能力，维持 6 块不扩）
  const radX = [-20, -12, -4, 4, 12, 20];
  for (const x of radX) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.25),
      [M.black, M.black, M.blackTop, M.black, M.black, M.black]);
    p.position.set(x, 2.05, -26);
    p.rotation.x = 0.26;
    group.add(p);
    for (const xo of [-1.4, 1.4]) {
      const l1 = box(0.28, 2.0, 0.28, M.grey, x + xo, 0.2, -25.68);
      l1.rotation.x = 0.35;
      l1.position.y = 1.19;   // 倾斜后底端仍 ≥ 0.2
      const l2 = box(0.28, 2.0, 0.28, M.grey, x + xo, 0.2, -26.32);
      l2.rotation.x = -0.35;
      l2.position.y = 1.19;
    }
  }
  // 冷却剂母管（沿 X，西延至 PCS 主回路落点）+ 垫块
  const header = cyl(0.2, 50, M.pipe, -2, 0.75, -25.2, 0, 12);
  header.rotation.z = Math.PI / 2;
  for (const x of [...radX, -25.5]) box(0.3, 0.55, 0.3, M.base, x, 0.2, -25.2);

  // ============================================================
  // 4. 再生燃料电池链（+X）：电解槽 → H₂/O₂ 球罐 → 燃料电池 → 母线
  //    球罐配液位标尺；罐区防爆隔堤；方舱外侧泄压口
  // ============================================================
  // 电解槽集装箱（z = -8）/ 燃料电池集装箱（z = +8）
  for (const cz of [-8, 8]) {
    boxT(6.4, 0.3, 2.9, M.base, M.baseTop, 22, 0.2, cz);
    boxT(6, 2.5, 2.5, M.white, M.whiteTop, 22, 0.5, cz);
    box(0.1, 1.6, 1.8, M.grey, 18.94, 0.8, cz);          // -X 端标识板
    box(0.08, 0.8, 0.8, M.dark, 25.04, 1.6, cz);         // 泄压口（朝 +X 无人侧）
  }
  // 立式球罐 ×2：H₂ d3.0 白环带 / O₂ d2.2 橙环带（L0 化学计量配平:
  // 336 kg H₂ 只需 2668 kg O₂ ≈ 5.5 m³ @350 bar，原 d3.0 体积过剩 2.6×）
  for (const [tx, band, fill, r, cy] of
       [[19.5, M.h2, 1.8, 1.5, 2.7], [24.5, M.orange, 1.6, 1.1, 2.3]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), M.white);
    s.position.set(tx, cy, 0);
    group.add(s);
    cyl(r + 0.03, 0.45, band, tx, cy, 0, 0, 24);         // 赤道环带
    const legH = cy - Math.sqrt(r * r - 0.81) + 0.1 - 0.2;
    for (const [lx, lz] of [[0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]]) {
      cyl(0.14, legH, M.grey, tx + lx, 0.2 + legH / 2, lz, 0, 8);  // 4 支腿
    }
    cyl(0.15, 0.5, M.pipe, tx, cy + r + 0.15, 0, 0, 8);  // 顶部阀口
    // 液位标尺：下段实色 = 当前储量，上段深色 = 余量
    box(0.3, fill, 0.3, band, tx, 0.2, 1.7);
    box(0.3, 2.6 - fill, 0.3, M.socOff, tx, 0.2 + fill, 1.7);
    // 连接管（0.4 m 管径）：电解槽 → 罐 → 燃料电池
    cyl(0.2, 6.7, M.pipe, tx, 1.0, -3.35, Math.PI / 2);
    cyl(0.2, 6.7, M.pipe, tx, 1.0, 3.35, Math.PI / 2);
    cyl(0.2, 0.7, M.pipe, tx, 1.15, 0);                  // 罐底立管
  }
  // 罐区防爆隔堤（高 0.7，管线从堤顶越过；+X 侧留人行豁口）
  box(9.9, 0.7, 0.3, M.base, 22, 0.2, -2.8);
  box(9.9, 0.7, 0.3, M.base, 22, 0.2, 2.8);
  box(0.3, 0.7, 5.9, M.base, 17.2, 0.2, 0);
  box(0.3, 0.7, 2.1, M.base, 26.8, 0.2, -1.9);
  box(0.3, 0.7, 2.1, M.base, 26.8, 0.2, 1.9);

  // ============================================================
  // 5. 电缆桥架：燃料电池 / 出线走廊，0.4 见方封闭箱形 + 门形支架
  // ============================================================
  boxT(0.4, 0.4, 28.8, M.grey, M.greyTop, 0, 2.3, 14.6);        // 出线段沿 +Z
  boxT(0.6, 0.5, 0.6, M.grey, M.greyTop, 0, 2.25, 0);           // 母线转角箱
  boxT(18.8, 0.4, 0.4, M.grey, M.greyTop, 9.6, 2.3, 8);         // 燃料电池支线
  boxT(0.6, 0.5, 0.6, M.grey, M.greyTop, 0, 2.25, 8);           // 支线接入箱
  box(0.4, 2.1, 0.4, M.grey, 0, 0.2, 28.8);                     // 出线端落地立管
  // 门形支架（安全橙）
  const portal = (x, z, ry) => {
    box(1.6, 0.25, 0.3, M.orange, x, 2.05, z, ry);
    const dx = Math.cos(ry) * 0.65, dz = Math.sin(ry) * 0.65;
    box(0.3, 1.85, 0.3, M.orange, x - dz, 0.2, z - dx, ry);
    box(0.3, 1.85, 0.3, M.orange, x + dz, 0.2, z + dx, ry);
  };
  for (const x of [-24, -18, -12, -6]) portal(x, 0, 0);          // 托母线桥
  for (const z of [4, 10, 16, 22, 28]) portal(0, z, Math.PI / 2);
  for (const x of [5, 10, 15]) portal(x, 8, 0);                  // 托燃料电池支线

  // ============================================================
  // 6. 飞轮储能桶 ×2（短时调频，顶部转子 spinner）
  // ============================================================
  boxT(2.2, 0.3, 5.6, M.base, M.baseTop, -23, 0.2, 8);
  for (const fz of [6.5, 9.5]) {
    cyl(0.8, 2.0, M.dark, -23, 1.5, fz, 0, 16);          // 真空桶体
    const rotor = new THREE.Group();                     // 顶部转子：轴 = 局部 +Y
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.25, 16), M.orange);
    rotor.add(disc);
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.22), M.dark);
    s1.position.y = 0.16; rotor.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 1.1), M.dark);
    s2.position.y = 0.16; rotor.add(s2);
    rotor.position.set(-23, 2.65, fz);
    group.add(rotor);
    group.userData.spinners.push({ obj: rotor, axis: 'y', rpm: 240 });
  }

  // ============================================================
  // 7. 控制亭（出线桥架旁），正面发光小窗
  // ============================================================
  boxT(2, 2.5, 2, M.white, M.whiteTop, 2.8, 0.2, 12);
  box(0.06, 1.8, 0.8, M.dark, 1.77, 0.35, 11.55);
  box(0.06, 0.6, 0.8, windowMat, 1.77, 1.45, 12.5);

  // ============================================================
  // 8. 围界标桩：四角红顶白桩（高 1.2 m）
  // ============================================================
  for (const [sx, sz] of [[-29, -29], [29, -29], [-29, 29], [29, 29]]) {
    cyl(0.13, 0.9, M.white, sx, 0.65, sz, 0, 10);
    cyl(0.14, 0.3, std(0xc03a2e, 0.7), sx, 1.25, sz, 0, 10);
  }

  // ============================================================
  // 9. 点光源锚点 + 数据驱动接口
  // ============================================================
  group.userData.lights = [{ color: 0xd8fff0, pos: [0, 8, 0], range: 40 }];

  // SOC 灯柱驱动接口：viewer 按 socCurve 取当前 soc，
  //   lit = Math.round(soc*5)，block[i].material = i<lit ?
  //   (i===4 && soc>0.96 ? socMats.full : socMats.on) : socMats.off
  group.userData.socColumns = socColumns;
  group.userData.socMats = { on: socGreen, full: socYellow, off: M.socOff };
  // 一个 sol 的 SOC 曲线（L0v2 校准调度, 833 kW 设计点, t=0 为黎明）
  group.userData.socCurve = { dt_h: 0.5, values: [
    0.4446, 0.428, 0.4208, 0.4227, 0.4329, 0.4509, 0.476, 0.5076, 0.5448,
    0.5867, 0.6322, 0.6802, 0.7286, 0.7769, 0.8253, 0.8726, 0.9169, 0.9572,
    0.9925, 1.0, 1.0, 1.0, 1.0, 0.9981, 0.9875, 0.968, 0.9465, 0.925,
    0.9034, 0.8819, 0.8604, 0.8389, 0.8174, 0.7958, 0.7743, 0.7528, 0.7313,
    0.7097, 0.6882, 0.6667, 0.6452, 0.6237, 0.6021, 0.5806, 0.5591, 0.5376,
    0.516, 0.4945, 0.473, 0.4515,
  ] };
  // 子设备 POI 锚点（poi_<id> 空节点，知识卡在 pwr-storage-01.info.json）
  // 引擎按距离 LOD 显示：点 → 名称 → 详情卡；7 个核心子设备
  const poi = (id, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = 'poi_' + id;
    a.position.set(x, y, z);
    group.add(a);
  };
  poi('battery',      -4,   3.6,  0);     // 电池柜阵
  poi('pcs',        -26.5,  2.9,  1.7);   // 功率变换站（PCS+变压器居中）
  poi('thermal',    -12,    2.2, -24);    // 热管理（辐射排/泵组重心）
  poi('electrolyzer', 22,   2.9, -8);     // 电解槽
  poi('tanks',        22,   4.4,  0);     // 双球罐
  poi('fuelcell',     22,   2.9,  8);     // 燃料电池
  poi('flywheel',    -23,   3.0,  8);     // 飞轮储能桶

  // 科学城解说牌数据（全部经 L0~L3 仿真链验证）
  group.userData.plaque = {
    p_nom_kW: 833, pcs_MW: 2, battery_MWh: 31.2, pv_peak_kW: 2902,
    eta_cell_rt: 0.9945, heat_avg_kW: 31.4, radiator_kW: 37,
    h2_kg: 336, storm_survival_kW_at15pct: 145,
  };

  group.traverse(o => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });

  return group;
}
