// viewer/units/sci-cray-01.js — 高能宇宙线测量站(膝区直接测量)
// 设计册 E:\Claude\mars-cray(七本解析账 + Python 蒙卡,29 道闸全绿)
//
// 单资产内摆阵(非 scatter):本站的几何**就是**仪器,每一个尺寸都由账反推 ——
//   24×24 m 取样板   ← 账 3:火星没有簇射足迹,孔径 = 探测器物理面积本身
//   5.0 m 井深/6 层  ← 账 2:风化层 λ_I=104.6 g/cm²,膝区簇射极大在 2.67 m
//   8 口天线井 ⌀ 8 m ← 账 5:切伦科夫几何 r = (d−z_max)·tan53.6°
//   外围桩 r=145 m   ← 账 7:自发射合规哨 + 全场符合否决,不承担孔径职责
//   场界 r=160 m
// 引擎随机撒放会把这些关系全部打散,所以走单资产内摆阵(同 sci-radio-01 先例)。
//
// 零转动部件是设计特征(与 sci-radio-01 / sci-seis-01 同族):没有指向机构,
// 因为原初粒子直接打到地面,不需要跟踪任何东西。
//
// 同色因果链:
//   蓝灰 = 地表电荷组(读 Z,dE/dx ∝ Z²)   青 = 径迹对(读 θ,给电荷做路径改正)
//   琥珀 = 埋深能量层(读 E,纵向剖面)     紫 = Askaryan 射电链(独立能标)
//   白   = 授时链(OCXO/铷钟/1 PPS)        黄绿 = 光纤(全场没有一根射频铜缆,账 7)

export const meta = {
  id: 'sci-cray-01',
  name: '高能宇宙线测量站',
  name_en: 'High-Energy Cosmic-Ray Station (knee-region direct measurement)',
  size_m: 318.88,              // 实测包围盒(validate 回填)
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();

  // ---- 确定性伪随机(禁 Math.random)----
  let _seed = 20260809;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash1 = (x) => { const s = Math.sin(x * 127.1) * 43758.5453; return s - Math.floor(s); };
  const hash2 = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  // ---- 材质 ----
  const M = {
    alu:    new THREE.MeshLambertMaterial({ color: 0xb9bfc4 }),
    dark:   new THREE.MeshLambertMaterial({ color: 0x3a3f46 }),
    darker: new THREE.MeshLambertMaterial({ color: 0x24272c }),
    white:  new THREE.MeshLambertMaterial({ color: 0xdfd9d2 }),
    whiteD: new THREE.MeshLambertMaterial({ color: 0xcac2b8 }),
    orange: new THREE.MeshLambertMaterial({ color: 0xd4772a }),
    pv:     new THREE.MeshLambertMaterial({ color: 0x24344e }),
    pier:   new THREE.MeshLambertMaterial({ color: 0x8d7663 }),
    pcb:    new THREE.MeshLambertMaterial({ color: 0x2c6b45 }),
    // 因果链四色
    chg:    new THREE.MeshLambertMaterial({ color: 0x4a6b8a }),   // 电荷组(Z)
    trk:    new THREE.MeshLambertMaterial({ color: 0x3f9e9e }),   // 径迹对(θ)
    cal:    new THREE.MeshLambertMaterial({ color: 0xc8892e }),   // 能量层(E)
    rf:     new THREE.MeshLambertMaterial({ color: 0x7a5aa8 }),   // Askaryan 射电链
    fib:    new THREE.MeshLambertMaterial({ color: 0xa8c24a }),   // 光纤(无射频铜缆)
    // 地层
    soilA:  new THREE.MeshLambertMaterial({ color: 0xb08055 }),
    soilB:  new THREE.MeshLambertMaterial({ color: 0x6d452f }),
    soilC:  new THREE.MeshLambertMaterial({ color: 0x66442c }),
    rock:   new THREE.MeshLambertMaterial({ color: 0x9a6a4a }),
    rockB:  new THREE.MeshLambertMaterial({ color: 0x7d5238 }),
    earth:  new THREE.MeshLambertMaterial({ color: 0x3f7fa8 }),   // 对照:地球大气柱
    mars:   new THREE.MeshLambertMaterial({ color: 0xb1462f }),   // 对照:火星大气柱
  };
  // 夜光(引擎接管,别在别处驱动)
  const winMat = new THREE.MeshLambertMaterial({ color: 0xffe6b8, emissive: 0xffc873, emissiveIntensity: 0.5 });
  const ledMat = new THREE.MeshLambertMaterial({ color: 0x9fe8c0, emissive: 0x53c98a, emissiveIntensity: 0.9 });
  const tipMat = new THREE.MeshLambertMaterial({ color: 0xb9a0e8, emissive: 0x7a5aa8, emissiveIntensity: 0.6 });
  const beaconMat = new THREE.MeshLambertMaterial({ color: 0xff5540, emissive: 0xff3322, emissiveIntensity: 2.0 });
  // 自管材质(animate 自驱,两个数组都不进 —— 防双驱动)
  const hitMats = [];                                    // 16 块地表模块的命中辉光
  for (let i = 0; i < 16; i++)
    hitMats.push(new THREE.MeshLambertMaterial({ color: 0x4a6b8a, emissive: 0x6fb8ef, emissiveIntensity: 0.0 }));
  const layerMats = [];                                  // 剖切柱 6 层的级联下行
  for (let i = 0; i < 6; i++)
    layerMats.push(new THREE.MeshLambertMaterial({ color: 0xc8892e, emissive: 0xffb14a, emissiveIntensity: 0.05 }));
  const rfMat = new THREE.MeshLambertMaterial({ color: 0x7a5aa8, emissive: 0xa070ff, emissiveIntensity: 0.08 });

  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };
  const cyl = (rt, rb, h, seg, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    (parent || group).add(m);
    return m;
  };

  // ================================================================
  // 1. 地表地毯:24×24 m 取样面,分 16 块 6×6 m 模块(账 3/4)
  // ================================================================
  const PLATE = 24, MOD = 6, NMOD = 4;
  // 夯实基垫(回填后压实的 ρ=1.6 面)
  box(PLATE + 1.6, 0.5, PLATE + 1.6, M.soilA, 0, -0.05, 0);
  box(PLATE + 2.4, 0.6, PLATE + 2.4, M.soilB, 0, -0.55, 0);   // 裙边下延防坡侧悬空
  const carpet = new THREE.Group(); group.add(carpet);
  const modCentres = [];
  for (let i = 0; i < NMOD; i++) for (let j = 0; j < NMOD; j++) {
    const k = i * NMOD + j;
    const cx = -PLATE / 2 + MOD / 2 + i * MOD, cz = -PLATE / 2 + MOD / 2 + j * MOD;
    modCentres.push([cx, cz]);
    const g = new THREE.Group(); g.position.set(cx, 0, cz); carpet.add(g);
    box(MOD - 0.12, 0.20, MOD - 0.12, M.darker, 0, 0.30, 0, g);        // 模块箱体(3 面电荷组+1 面径迹)
    box(MOD - 0.20, 0.06, MOD - 0.20, hitMats[k], 0, 0.43, 0, g);      // 顶面 = 电荷组读出面
    box(MOD - 0.06, 0.10, 0.10, M.trk, 0, 0.47, -MOD / 2 + 0.35, g);   // 青条 = 径迹面的条方向标识
    box(0.10, 0.10, MOD - 0.06, M.trk, -MOD / 2 + 0.35, 0.47, 0, g);   // 正交视图
    for (let s = 1; s <= 2; s++) {                                     // 1 m 分块的接缝(示意)
      box(MOD - 0.20, 0.02, 0.05, M.dark, 0, 0.47, -MOD / 2 + s * MOD / 3, g);
      box(0.05, 0.02, MOD - 0.20, M.dark, -MOD / 2 + s * MOD / 3, 0.47, 0, g);
    }
    box(0.42, 0.34, 0.30, M.whiteD, MOD / 2 - 0.42, 0.37, MOD / 2 - 0.32, g);  // 模块读出盒(CRN65LP ASIC)
    box(0.10, 0.05, 0.04, ledMat, MOD / 2 - 0.42, 0.55, MOD / 2 - 0.32, g);
    box(0.06, 0.05, 0.9, M.fib, MOD / 2 - 0.42, 0.14, MOD / 2 - 0.9, g);       // 光纤出线(黄绿)
    for (const [ex, ez] of [[-1, 0], [1, 0], [0, -1], [0, 1]])                 // 边框
      box(ex ? 0.12 : MOD, 0.16, ez ? 0.12 : MOD, M.alu, ex * MOD / 2, 0.28, ez * MOD / 2, g);
  }
  // 中央光纤主干槽(黄绿,汇向 +Z 的方舱)
  box(0.5, 0.08, PLATE + 12, M.fib, 0, 0.03, 6);

  // ---- 8 口 Askaryan 天线井口(账 5:井深 8 m,±6/±12 m 十字+方阵)----
  const WELLS = [[-6, -6], [6, -6], [-6, 6], [6, 6], [-12, 0], [12, 0], [0, -12], [0, 12]];
  for (const [wx, wz] of WELLS) {
    cyl(0.36, 0.36, 0.34, 8, M.rf, wx, 0.62, wz);                     // 井口套管
    cyl(0.30, 0.30, 0.08, 8, tipMat, wx, 0.81, wz);                   // 井盖(夜微光)
    box(0.06, 0.06, 0.8, M.fib, wx, 0.5, wz + 0.6);                   // 光纤引出
  }

  // ================================================================
  // 2. 剖切展示井:抬升的 1:1 地层柱(坑账 3 —— 地下坑会被地形挡死)
  //    柱顶 = 地面基准,往下 1:1 保留 5.0 m 井深与 8 m 天线井
  // ================================================================
  const SH = new THREE.Group(); SH.position.set(-22, 0, 6); SH.rotation.y = 0.30; group.add(SH);
  // 柱宽 8.6 m 不是画面需要:天线井到簇射轴的水平距离 7.2 m = (8−2.67)·tan53.6°
  // 是账 5 的切伦科夫几何,**这块展台是 1:1 的**(横向与纵向同一比例)。
  const CW = 8.6, CD = 3.0, CH = 9.3, AX = -3.6, ANT = 3.6;
  const TOPY = 8.9;                                  // 地面基准面在柱上的高度
  box(CW, CH, CD, M.soilC, 0, CH / 2 - 0.4, 0, SH);                    // 柱体(深层结壳)
  box(CW + 0.02, 3.0, CD + 0.02, M.soilB, 0, TOPY - 1.5, 0, SH);       // 中层
  box(CW + 0.04, 0.55, CD + 0.04, M.soilA, 0, TOPY - 0.27, 0, SH);     // 表层松散风化层
  box(CW + 0.08, 0.10, CD + 0.08, M.rockB, 0, TOPY + 0.05, 0, SH);     // 地表面
  // 地表探测器叠层样件(青 ×1 径迹面在最上 + 蓝灰 ×3 电荷面),正对簇射轴
  box(3.0, 0.09, CD * 0.8, M.trk, AX, TOPY + 0.36, 0, SH);
  for (let i = 0; i < 3; i++)
    box(3.0, 0.07, CD * 0.8, M.chg, AX, TOPY + 0.25 - i * 0.09, 0, SH);
  // 6 个埋深能量层(账 2 的真实深度,1:1)
  const LAYD = [0.35, 0.90, 1.60, 2.40, 3.40, 4.70];
  LAYD.forEach((d, i) => {
    box(CW + 0.10, 0.11, CD + 0.16, layerMats[i], 0, TOPY - d, 0, SH);   // 前后都探出 = 剖面读得出
    box(0.62, 0.05, 0.06, M.white, CW / 2 + 0.48, TOPY - d, CD / 2 + 0.14, SH);  // 深度刻度牌
  });
  box(CW + 0.10, 0.08, CD + 0.16, M.trk, 0, TOPY - 4.82, 0, SH);        // 最深层背面 = 第二块径迹面
  // 簇射轴:自地表向下的级联(极大在 2.67 m —— 正好落在第 4、5 层之间)
  const axisMats = [];
  for (let i = 0; i < 9; i++) {
    const am = new THREE.MeshLambertMaterial({ color: 0xffd08a, emissive: 0xffa040, emissiveIntensity: 0.06 });
    axisMats.push(am);
    box(0.14 + 0.10 * Math.exp(-Math.pow((i * 0.62 - 2.67) / 1.6, 2)), 0.42, 0.14,
        am, AX, TOPY - 0.2 - i * 0.62, CD / 2 + 0.22, SH);
  }
  // 8 m 处的 Askaryan 埋入天线(紫)+ 剖开的井筒(半剖:开口朝 +Z 观察侧)
  box(0.46, 8.2, 0.34, M.darker, ANT, TOPY - 4.1, CD / 2 + 0.10, SH);  // 井筒(剖面)
  box(0.11, 1.15, 0.11, rfMat, ANT, TOPY - 8.0, CD / 2 + 0.24, SH);    // 偶极子
  box(0.70, 0.08, 0.08, rfMat, ANT, TOPY - 8.0, CD / 2 + 0.24, SH);
  box(0.30, 0.28, 0.22, M.rf, ANT, TOPY - 7.2, CD / 2 + 0.24, SH);     // 井下前置放大
  box(0.06, 7.0, 0.06, M.fib, ANT + 0.30, TOPY - 3.6, CD / 2 + 0.24, SH);  // 光纤上引
  // 切伦科夫射线杆(53.6°,自簇射极大 2.67 m 指向 8 m 深的天线)—— 真角度
  const dxc = ANT - AX, dyc = 8.0 - 2.67, Lc = Math.hypot(dxc, dyc);
  const chk = box(0.09, Lc, 0.09, M.rf, (AX + ANT) / 2, TOPY - (2.67 + 8.0) / 2, CD / 2 + 0.22, SH);
  chk.rotation.z = Math.atan2(dxc, dyc);   // 上端=簇射极大(−x 侧),下端=8 m 深的天线(+x 侧)
  // 全反射示意:地面折射临界角 36.4° 的短杆(信号出不去 = 天线必须埋)
  const cri = box(0.07, 1.5, 0.07, M.alu, AX + 1.4, TOPY + 0.65, CD / 2 + 0.22, SH);
  cri.rotation.z = -Math.atan(Math.tan(36.4 * Math.PI / 180));
  // 台座 + 安全护栏
  box(CW + 1.2, 0.4, CD + 1.2, M.pier, 0, -0.35, 0, SH);
  for (const sx of [-1, 1]) {
    box(0.1, 1.05, 0.1, M.orange, sx * (CW / 2 + 0.5), TOPY + 0.6, CD / 2 + 0.5, SH);
    box(0.1, 1.05, 0.1, M.orange, sx * (CW / 2 + 0.5), TOPY + 0.6, -CD / 2 - 0.5, SH);
  }
  // 说明牌(四色图例 = 因果链)
  box(0.1, 1.6, 0.1, M.dark, -CW / 2 - 0.9, 0.8, CD / 2 + 0.4, SH);
  box(1.5, 1.0, 0.06, M.white, -CW / 2 - 0.9, 2.0, CD / 2 + 0.4, SH);
  const leg = [M.chg, M.trk, M.cal, M.rf];
  leg.forEach((m, i) => box(1.15, 0.13, 0.02, m, -CW / 2 - 0.9, 2.36 - i * 0.22, CD / 2 + 0.44, SH));

  // ================================================================
  // 3. 大气厚度对照台(账 1 的头条:1 m 柱高 = 100 g/cm²,1:1 真比例)
  // ================================================================
  const AT = new THREE.Group(); AT.position.set(-20, 0, -9); AT.rotation.y = -0.25; group.add(AT);
  box(3.4, 0.35, 1.6, M.pier, 0, 0.17, 0, AT);
  const SCALE = 1 / 100;                                    // m per (g/cm²)
  const H_EARTH = 1033.2 * SCALE, H_MARS = 16.44 * SCALE, H_XMAX = 787.2 * SCALE;
  box(0.10, H_EARTH + 0.9, 0.10, M.dark, -1.25, (H_EARTH + 0.9) / 2 + 0.34, 0, AT);  // 立柱
  box(0.10, H_EARTH + 0.9, 0.10, M.dark, 1.25, (H_EARTH + 0.9) / 2 + 0.34, 0, AT);
  box(0.62, H_EARTH, 0.34, M.earth, -0.72, H_EARTH / 2 + 0.35, 0, AT);               // 地球大气柱 10.33 m
  box(0.62, H_MARS, 0.34, M.mars, 0.72, H_MARS / 2 + 0.35, 0, AT);                   // 火星 0.164 m
  box(0.86, 0.10, 0.42, M.orange, -0.72, H_XMAX + 0.35, 0, AT);                      // 地球 X_max 环 @787
  box(0.86, 0.05, 0.42, M.white, 0.72, 0.367 + H_MARS, 0, AT);                       // 火星地面
  for (let g = 100; g <= 1000; g += 100)                                             // 100 g/cm² 刻度
    box(0.22, 0.03, 0.12, M.whiteD, -1.42, g * SCALE + 0.35, 0, AT);
  box(2.9, 0.5, 0.08, M.white, 0, H_EARTH + 1.05, 0, AT);                            // 顶牌
  box(0.9, 0.10, 0.03, M.earth, -0.72, H_EARTH + 1.05, 0.06, AT);
  box(0.9, 0.10, 0.03, M.mars, 0.72, H_EARTH + 1.05, 0.06, AT);
  // 火星柱只有 16.4 cm —— 旁边补一根 ×10 放大件(沿用 sci-seis-01 6× / sci-uv-01 400× 先例)
  box(0.34, H_MARS * 10, 0.22, M.mars, 1.45, H_MARS * 5 + 0.35, 0, AT);
  box(0.5, 0.05, 0.3, M.whiteD, 1.45, H_MARS * 10 + 0.38, 0, AT);
  box(0.42, 0.28, 0.03, M.white, 1.45, 2.35, 0.12, AT);                 // 「×10」标牌
  box(0.30, 0.05, 0.02, M.mars, 1.45, 2.42, 0.14, AT);
  box(0.10, 1.75, 0.06, M.dark, 1.45, 1.15, 0.10, AT);
  // 月球:0 g/cm²,只留一根空框
  box(0.62, 0.06, 0.34, M.alu, 0.0, 0.40, 0.75, AT);
  box(0.62, 0.05, 0.05, M.alu, 0.0, 0.72, 0.75, AT);

  // ================================================================
  // 4. 中心数据方舱(+Z 面整面开放 = 核心不做黑盒)
  // ================================================================
  const DS = new THREE.Group(); DS.position.set(0, 0, 22); group.add(DS);
  box(7.2, 0.20, 4.2, M.darker, 0, 0.12, 0, DS);
  box(7.2, 3.0, 0.16, M.white, 0, 1.72, -2.02, DS);                    // 背墙
  box(0.16, 3.0, 4.2, M.white, -3.52, 1.72, 0, DS);
  box(0.16, 3.0, 4.2, M.white, 3.52, 1.72, 0, DS);
  box(7.2, 0.16, 4.2, M.whiteD, 0, 3.3, 0, DS);                        // 顶盖
  box(7.6, 0.12, 4.5, M.whiteD, 0, 3.44, 0, DS);                       // 顶盖压条
  box(7.6, 0.24, 4.5, M.whiteD, 0, 0.13, 0, DS);                       // 底裙边
  box(0.16, 3.0, 0.16, M.orange, -3.52, 1.72, 2.02, DS);
  box(0.16, 3.0, 0.16, M.orange, 3.52, 1.72, 2.02, DS);
  // 屏蔽室内胆(≥60 dB):铝壳五面板,**朝观察侧 +Z 整面剖开**(核心不做黑盒),
  // 只有光纤与直流穿墙;铜色密封压条 = 60 dB 的那一圈接缝
  box(4.6, 0.08, 2.6, M.alu, -0.7, 2.62, -0.7, DS);                    // 顶板
  box(4.6, 0.08, 2.6, M.alu, -0.7, 0.24, -0.7, DS);                    // 底板
  box(4.6, 2.4, 0.08, M.alu, -0.7, 1.42, -1.96, DS);                   // 背板
  box(0.08, 2.4, 2.6, M.alu, -2.96, 1.42, -0.7, DS);                   // 侧板 ×2
  box(0.08, 2.4, 2.6, M.alu, 1.56, 1.42, -0.7, DS);
  box(4.8, 0.10, 0.10, M.orange, -0.7, 2.66, 0.58, DS);                // 开口面密封压条
  box(4.8, 0.10, 0.10, M.orange, -0.7, 0.20, 0.58, DS);
  box(0.10, 2.5, 0.10, M.orange, -3.0, 1.42, 0.58, DS);
  box(0.10, 2.5, 0.10, M.orange, 1.60, 1.42, 0.58, DS);
  const shDoor = box(1.9, 2.3, 0.10, M.whiteD, 0, 1.42, 0, DS);        // 外翻的屏蔽门扇
  shDoor.rotation.y = -1.95; shDoor.position.set(2.72, 1.42, 0.55);
  // 门内机柜三联(剖开可见)
  const rack = (rx, panelMat, name) => {
    box(0.9, 1.9, 0.6, M.dark, rx, 1.15, -1.45, DS);
    box(0.8, 1.7, 0.05, panelMat, rx, 1.15, -1.12, DS);
    for (let i = 0; i < 4; i++)
      box(0.11, 0.05, 0.04, ledMat, rx - 0.26 + i * 0.17, 1.9, -1.10, DS);
    const an = new THREE.Object3D(); an.name = name; an.position.set(rx, 2.2, -1.2); DS.add(an);
  };
  rack(-2.15, M.chg, 'rack_fe');        // 4140 路前端/ADC(CRN65LP ASIC)
  rack(-0.70, M.cal, 'rack_trig');      // 触发与剖面拟合
  rack(0.75, M.white, 'rack_clock');    // OCXO 授时单元(白 = 授时链)
  box(0.5, 0.36, 0.42, M.white, 0.75, 0.45, -0.45, DS);                 // OCXO 恒温槽
  box(0.12, 0.05, 0.05, ledMat, 0.75, 0.69, -0.24, DS);
  // 光纤配线架(黄绿):4140 路进来,一根铜都没有
  box(1.5, 0.85, 0.28, M.fib, -2.15, 0.66, 0.16, DS);
  for (let i = 0; i < 6; i++)
    box(0.06, 0.06, 0.7, M.fib, -2.85 + i * 0.26, 0.35, 0.6, DS);
  box(0.9, 0.5, 0.35, M.pcb, 2.5, 0.4, -1.2, DS);                      // 直流馈入(滤波穿墙件)
  box(0.24, 0.3, 0.24, M.rf, 2.5, 1.1, -1.2, DS);                      // 射电通道数字化机箱
  // 侧窗(夜光)+ 空调 + 信标
  box(0.10, 0.9, 1.3, M.orange, 3.58, 2.1, 0.6, DS);
  box(0.08, 0.72, 1.12, winMat, 3.62, 2.1, 0.6, DS);
  box(0.9, 0.42, 0.7, M.whiteD, 2.4, 3.6, -0.8, DS);
  box(0.10, 0.10, 0.10, beaconMat, -3.0, 3.62, -1.6, DS);
  // 授时天线(朝 com-station-01;1 PPS + UHF,账 6)
  cyl(0.05, 0.07, 3.2, 6, M.alu, 3.1, 4.9, -1.4, DS);
  box(0.55, 0.06, 0.55, M.white, 3.1, 6.4, -1.4, DS);
  box(0.10, 0.30, 0.10, M.white, 3.1, 6.6, -1.4, DS);
  // 去射电阵的光纤授时链(黄绿,朝 -Z 出场)
  box(0.24, 0.06, 6.0, M.fib, -1.5, 0.05, -5.2, DS);

  // ================================================================
  // 5. 事例显示屏(确定性哈希调度;纯 t 分段,无累积状态)
  // ================================================================
  const SC = new THREE.Group(); SC.position.set(-8.8, 0, 23.2); SC.rotation.y = 0.42; group.add(SC);
  box(0.14, 2.5, 0.14, M.dark, -2.0, 1.25, 0, SC);
  box(0.14, 2.5, 0.14, M.dark, 2.0, 1.25, 0, SC);
  box(4.1, 2.5, 0.10, M.darker, 0, 2.35, 0, SC);
  box(4.2, 0.10, 0.22, M.dark, 0, 3.65, 0, SC);                        // 遮阳檐

  // ---- 屏面:四块面板,统一顶点色四边形 ----
  const quads = [];                     // {x0,y0,x1,y1}
  const panel = (x0, y0, x1, y1, nx, ny) => {
    const start = quads.length;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const ax = x0 + (x1 - x0) * i / nx, bx = x0 + (x1 - x0) * (i + 1) / nx;
      const ay = y0 + (y1 - y0) * j / ny, by = y0 + (y1 - y0) * (j + 1) / ny;
      quads.push([ax + 0.006, ay + 0.006, bx - 0.006, by - 0.006]);
    }
    return { start, nx, ny };
  };
  const P_PLAN = panel(-1.92, -1.10, -0.22, 0.60, 8, 8);      // 阵列平面图(命中位置)
  const P_GAUGE = panel(-1.92, 0.72, -0.22, 1.12, 20, 2);     // 能量 / 电荷 双标尺
  const P_SKY = panel(-0.06, 0.10, 0.86, 1.12, 9, 9);         // 到达方向天图
  const P_PROF = panel(-0.06, -1.10, 1.92, -0.02, 16, 6);     // 纵向剖面 6 层
  const P_RAD = panel(1.00, 0.10, 1.92, 1.12, 12, 4);         // 射电波形(独立能标)

  const NQ = quads.length;
  const pos = new Float32Array(NQ * 18), col = new Float32Array(NQ * 18);
  for (let q = 0; q < NQ; q++) {
    const [x0, y0, x1, y1] = quads[q];
    const v = [[x0, y0], [x1, y0], [x1, y1], [x0, y0], [x1, y1], [x0, y1]];
    for (let k = 0; k < 6; k++) {
      pos[q * 18 + k * 3] = v[k][0];
      pos[q * 18 + k * 3 + 1] = v[k][1];
      pos[q * 18 + k * 3 + 2] = 0;
    }
  }
  const scGeo = new THREE.BufferGeometry();
  scGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  // MeshBasic + 顶点色:昼夜一致可读,且是给数百格逐格着色的唯一低耗做法
  const scMesh = new THREE.Mesh(scGeo, new THREE.MeshBasicMaterial({ vertexColors: true }));
  scMesh.position.set(0, 2.35, 0.06);
  SC.add(scMesh);
  // 面板色标条
  box(1.7, 0.05, 0.02, M.chg, -1.07, 3.02, 0.07, SC);
  box(0.92, 0.05, 0.02, M.trk, 0.4, 3.02, 0.07, SC);
  box(0.92, 0.05, 0.02, M.rf, 1.46, 3.02, 0.07, SC);
  box(1.98, 0.05, 0.02, M.cal, 0.93, 1.22, 0.07, SC);

  // ================================================================
  // 6. 弃土堤(3380 m³ 挖方的去处 = 朝射电阵一侧的防尘/遮挡堤,账 7)
  // ================================================================
  // 3380 m³ 挖方不外运:堆成朝射电阵(−Z)一侧的三级土堤,兼作防尘与电磁遮挡
  const BERM = new THREE.Group(); group.add(BERM);
  for (let i = 0; i < 27; i++) {
    const a = -1.50 + i * 0.115;                       // 朝 −Z 的 172° 弧,4.8 m 一段(重叠成连续脊)
    const r = 42;
    const bx = Math.sin(a) * r, bz = -Math.cos(a) * r;
    const tiers = [[8.0, 1.00, 9.4, -0.05, M.soilB],
                   [8.0, 0.85, 7.0, 0.85, M.soilB],
                   [8.0, 0.85, 4.8, 1.68, M.soilA],
                   [8.0, 0.75, 2.6, 2.45, M.soilA]];
    for (const [w, h, d, y, mt] of tiers) {
      const seg = box(w, h, d, mt, bx, y, bz, BERM);
      seg.rotation.y = a;
    }
  }

  // ================================================================
  // 7. 外围桩 ×8(r=145 m):地表闪烁体 + 太阳板 + 授时天线 + RFI 监测环
  // ================================================================
  const R_OUT = 145;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + 0.19;
    const ox = Math.cos(a) * R_OUT, oz = Math.sin(a) * R_OUT;
    const g = new THREE.Group(); g.position.set(ox, 0, oz); g.rotation.y = -a; group.add(g);
    box(1.5, 0.4, 1.5, M.pier, 0, 0.2, 0, g);
    box(1.4, 0.5, 1.4, M.pier, 0, -1.4, 0, g);                          // 沉箱下延(远郊地形高差)
    box(1.15, 0.26, 1.15, M.darker, 0, 0.52, 0, g);                     // 闪烁体箱(否决用)
    box(1.0, 0.05, 1.0, M.chg, 0, 0.67, 0, g);
    box(0.34, 0.3, 0.26, M.whiteD, 0.55, 0.55, 0.4, g);                 // 读出盒
    box(0.06, 0.04, 0.03, ledMat, 0.55, 0.71, 0.4, g);
    cyl(0.05, 0.06, 3.4, 6, M.alu, -0.5, 1.9, 0, g);                    // 桅杆
    const pvp = box(1.5, 0.06, 1.0, M.pv, -0.5, 1.35, 0.75, g); pvp.rotation.x = -0.45;
    box(0.4, 0.05, 0.4, M.white, -0.5, 3.5, 0, g);                      // 授时天线(1 PPS)
    // 0.5–10 MHz RFI 监测环(朝射电阵方向)—— 合规不是算出来的,是量出来的
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 4, 12), M.rf);
    loop.position.set(0.5, 1.5, 0); loop.rotation.y = Math.PI / 2; g.add(loop);
    box(0.18, 0.16, 0.14, M.rf, 0.5, 1.02, 0, g);
    box(0.05, 0.05, 1.3, M.fib, 0, 0.06, -0.9, g);                      // 光纤回中心
    box(0.07, 0.07, 0.07, tipMat, -0.5, 3.75, 0, g);                    // 桩顶微光
  }

  // ---- 场界桩 ×12(r=160 m)----
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6 + 0.09;
    const bx = Math.cos(a) * 160, bz = Math.sin(a) * 160;
    box(0.10, 3.4, 0.10, M.orange, bx, -0.5, bz);
    box(0.18, 0.16, 0.03, M.white, bx, 1.05, bz);
  }

  // ================================================================
  // 8. 供电:城网接入柱(主供)+ 应急太阳板(账 4:90 W)
  // ================================================================
  const PW = new THREE.Group(); PW.position.set(9.5, 0, 21); group.add(PW);
  box(1.0, 0.35, 1.0, M.pier, 0, 0.17, 0, PW);
  box(0.7, 1.5, 0.5, M.whiteD, 0, 1.05, 0, PW);                         // 双路配电箱
  box(0.62, 0.34, 0.03, M.pcb, 0, 1.45, 0.27, PW);                      // 绿 = 城网主供
  box(0.62, 0.24, 0.03, M.orange, 0, 1.05, 0.27, PW);                   // 琥珀 = PV 备份
  box(0.24, 0.06, 3.2, M.dark, 0, 0.05, -2.0, PW);                      // 埋地进线
  for (let r = 0; r < 2; r++) {
    const px = 2.6 + r * 2.9;
    const p = box(2.4, 0.07, 2.6, M.pv, px, 1.05, 0, PW); p.rotation.z = 0.40;
    box(0.12, 0.7, 0.12, M.dark, px - 0.9, 0.35, -1.0, PW);
    box(0.12, 1.4, 0.12, M.dark, px + 0.9, 0.7, -1.0, PW);
    box(0.12, 0.7, 0.12, M.dark, px - 0.9, 0.35, 1.0, PW);
    box(0.12, 1.4, 0.12, M.dark, px + 0.9, 0.7, 1.0, PW);
  }
  box(0.9, 1.0, 0.7, M.white, 0.2, 0.5, 2.0, PW);                       // 应急电池柜

  // ================================================================
  // 9. 曝光/定位牌(账 3 的诚实告示)+ 作业痕迹
  // ================================================================
  const SG = new THREE.Group(); SG.position.set(13, 0, 14); SG.rotation.y = -0.5; group.add(SG);
  box(0.1, 1.9, 0.1, M.dark, -0.85, 0.95, 0, SG);
  box(0.1, 1.9, 0.1, M.dark, 0.85, 0.95, 0, SG);
  box(2.0, 1.15, 0.06, M.white, 0, 2.0, 0, SG);
  box(1.7, 0.16, 0.02, M.cal, 0, 2.34, 0.04, SG);                       // 覆盖能段(亮)
  box(0.5, 0.16, 0.02, M.darker, 0.6, 2.10, 0.04, SG);                  // 够不着的踝区(暗)
  box(1.7, 0.06, 0.02, M.whiteD, 0, 1.85, 0.04, SG);
  box(0.9, 0.10, 0.02, M.chg, -0.4, 1.68, 0.04, SG);

  // 进场车辙(自城区方向 +Z)+ 散石
  box(0.6, 0.03, 46, M.rockB, -1.5, 0.015, 44);
  box(0.6, 0.03, 46, M.rockB, 0.3, 0.015, 44);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 16; i++) {
    const a = rnd() * 6.283, d = 20 + rnd() * 90, s = 0.1 + rnd() * 0.2;
    const r = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.rock : M.rockB);
    r.position.set(Math.cos(a) * d, -0.3 * s + 1.618 * s * 0.62, Math.sin(a) * d);
    r.scale.set(s, s * 0.62, s);
    r.rotation.y = rnd() * 6.28;                                        // 只绕 Y(坑账 3)
    group.add(r);
  }

  // ---- POI 锚点 ----
  const poi = (name, x, y, z) => {
    const o = new THREE.Object3D(); o.name = name; o.position.set(x, y, z); group.add(o);
  };
  poi('poi_atmos', -20, 6.0, -9);        // 大气厚度对照台(账 1 头条)
  poi('poi_carpet', 0, 1.4, 0);          // 地表地毯:直接读电荷(账 1/4)
  poi('poi_shaft', -22, 5.2, 8.4);       // 剖切地层柱:土壤当量热量计(账 2)
  poi('poi_aperture', 13, 2.6, 14);      // 曝光与定位牌(账 3)
  poi('poi_shelter', 0, 3.0, 22);        // 数据方舱 / 城内闭环(账 4/7)
  poi('poi_screen', -8.8, 3.2, 23.2);       // 事例显示屏
  poi('poi_readout', -1.9, 1.5, 21.3);     // 读出链与前端电路(账 8–14,Spectre 实跑)
  poi('poi_radio', 6.4, 1.2, 6.4);       // Askaryan 天线井(账 5)
  poi('poi_edge', Math.cos(0.19) * R_OUT, 3.2, Math.sin(0.19) * R_OUT);  // 外围桩(账 6/7)

  // ---- 尘膜 pass ----
  const dust = new THREE.Color(0x9e5b3d);
  [M.alu, M.dark, M.darker, M.white, M.whiteD, M.orange, M.pv, M.pier, M.pcb,
   M.chg, M.trk, M.cal, M.rf, M.fib, M.soilA, M.soilB, M.soilC, M.earth, M.mars]
    .forEach(m => m.color.lerp(dust, 0.05));

  // ================================================================
  // 10. 事例调度(确定性,纯 t 分段;T=150 s 超循环,首尾闭合)
  // ================================================================
  // 真实通量的等待时间:>10^13 eV 35 s · >10^14 29 min · >10^15 24 h ·
  // >10^16 73 d · >3×10^16 1.8 yr(账 3)。屏上把每十倍程的事例数压缩了 ~20×,
  // 否则一个膝区事例要等一整天。能量在各十倍程内按真实积分谱的分位数取,形状是真的。
  const T = 150;
  const CLASS = [                          // [十倍程下界 dex, 个数]
    [11, 26], [12, 11], [13, 5], [14, 3], [15, 2], [16, 1],
  ];
  const EVENTS = [];
  let idx = 0;
  for (const [dex, n] of CLASS) {
    for (let k = 0; k < n; k++) {
      const h = hash1(idx * 3.77 + 1.3);
      // 十倍程内按积分谱 J∝E^-1.7 的分位数取能量(形状真实)
      const u = (k + 0.5) / n;
      const E = dex + Math.log10(Math.pow(1 - u * (1 - Math.pow(10, -1.7)), -1 / 1.7));
      EVENTS.push({
        t: h * T,
        dex: E,
        mx: Math.floor(hash2(idx * 1.7, 4.2) * 8),      // 阵列平面 8×8 格
        mz: Math.floor(hash2(idx * 2.9, 8.1) * 8),
        th: hash2(idx * 5.1, 2.2) * 0.85,               // 天顶角(0~48°)
        ph: hash2(idx * 7.3, 6.6) * 6.2832,
        Z: 1 + Math.floor(Math.pow(hash2(idx * 4.4, 1.1), 2.4) * 26),
        hold: 0.9 + (E - 11) * 0.55,                    // 高能事例在屏上停久些
      });
      idx++;
    }
  }
  EVENTS.sort((a, b) => a.t - b.t);

  // 颜色梯
  const cOff = new THREE.Color(0x0b1018), cGrid = new THREE.Color(0x16202c);
  const cDim = new THREE.Color(0x1d3b52), cMid = new THREE.Color(0x2e7fb0);
  const cHot = new THREE.Color(0xffe6a8), cCal = new THREE.Color(0xd8922e);
  const cRF = new THREE.Color(0xa070ff), cTrk = new THREE.Color(0x5fd0d0);
  const tmp = new THREE.Color();

  const setQ = (q, c) => {
    const b = q * 18;
    for (let k = 0; k < 6; k++) { col[b + k * 3] = c.r; col[b + k * 3 + 1] = c.g; col[b + k * 3 + 2] = c.b; }
  };

  // 埋深层的取样值(Gaisser-Hillas,X_max 随 log10E 走 —— 账 2 的 255→539 g/cm²)
  const LAYG = LAYD.map(d => d * 100 * 1.6);
  const ghSample = (dex) => {
    const Xmax = 255 + (dex - 12) * 47;                 // g/cm²
    const lam = 200;
    return LAYG.map(X => {
      const a = Math.max(X / Xmax, 1e-6);
      return Math.pow(a, Xmax / lam) * Math.exp((Xmax - X) / lam);
    });
  };

  const paint = (t) => {
    const tt = ((t % T) + T) % T;
    // 找当前事例(纯 t:任意时刻只取「最近一个已发生的」)
    let cur = EVENTS[EVENTS.length - 1], age = tt + (T - cur.t);
    for (let i = 0; i < EVENTS.length; i++) {
      if (EVENTS[i].t <= tt) { cur = EVENTS[i]; age = tt - EVENTS[i].t; }
    }
    const live = Math.max(0, 1 - age / cur.hold);
    const glow = live * live;

    // --- 平面图:命中格 + 邻域淡辉 ---
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const q = P_PLAN.start + j * 8 + i;
      const dd = Math.hypot(i - cur.mx, j - cur.mz);
      let v = 0.06 + 0.05 * hash2(i * 1.7, j * 2.3);
      if (dd < 0.1) v = 0.25 + 0.75 * glow;
      else if (dd < 1.5) v = 0.10 + 0.30 * glow;
      tmp.copy(cGrid).lerp(v > 0.5 ? cHot : cMid, Math.min(1, v));
      setQ(q, tmp);
    }
    // --- 双标尺:上=能量(11~17 dex)、下=电荷(Z 1~26)---
    for (let i = 0; i < 20; i++) {
      const eFill = (cur.dex - 11) / 6 * 20;
      tmp.copy(cGrid).lerp(cCal, i < eFill ? 0.35 + 0.65 * glow : 0.0);
      setQ(P_GAUGE.start + 20 + i, tmp);
      const zFill = cur.Z / 26 * 20;
      tmp.copy(cGrid).lerp(cMid, i < zFill ? 0.35 + 0.65 * glow : 0.0);
      setQ(P_GAUGE.start + i, tmp);
    }
    // --- 天图:到达方向(中心=天顶),重建点 ---
    const sx = 4 + Math.cos(cur.ph) * cur.th * 4.6, sy = 4 + Math.sin(cur.ph) * cur.th * 4.6;
    for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) {
      const q = P_SKY.start + j * 9 + i;
      const rr = Math.hypot(i - 4, j - 4);
      let v = (Math.abs(rr - 2) < 0.5 || Math.abs(rr - 4) < 0.5) ? 0.16 : 0.05;
      const dd = Math.hypot(i - sx, j - sy);
      if (dd < 1.0) v = Math.max(v, 0.30 + 0.70 * glow * (1 - dd));
      tmp.copy(cGrid).lerp(v > 0.4 ? cHot : cTrk, Math.min(1, v));
      setQ(q, tmp);
    }
    // --- 纵向剖面:6 层,级联自上而下逐层点亮(0.10 s/层)---
    const prof = ghSample(cur.dex);
    const pmax = Math.max.apply(null, prof);
    for (let j = 0; j < 6; j++) {
      const arrive = Math.max(0, Math.min(1, (age - j * 0.10) / 0.16));
      const w = prof[5 - j] / pmax * 16 * arrive;       // 屏上第 0 行 = 最深层
      for (let i = 0; i < 16; i++) {
        const q = P_PROF.start + j * 16 + i;
        const on = i < w;
        tmp.copy(cGrid).lerp(cCal, on ? 0.30 + 0.70 * (0.35 + 0.65 * glow) : 0.0);
        setQ(q, tmp);
      }
    }
    // --- 射电通道:Askaryan 脉冲波形(独立能标)---
    const rfOn = cur.dex >= 14.4 ? 1 : 0;               // 阈 ~2.4e14 eV(账 5)
    for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) {
      const q = P_RAD.start + j * 12 + i;
      const u = (i - 4.5) * 0.9 - age * 3.0;
      const amp = rfOn * Math.exp(-u * u * 0.55) * Math.cos(u * 2.3) * glow;
      const lvl = Math.abs(amp) * (j === 1 || j === 2 ? 1.0 : 0.45);
      tmp.copy(cGrid).lerp(cRF, Math.min(1, lvl));
      setQ(q, tmp);
    }
    scGeo.attributes.color.needsUpdate = true;

    // --- 实物联动:命中的地表模块亮,剖切柱 6 层依次亮 ---
    const hitMod = Math.min(15, Math.floor(cur.mx / 2) * 4 + Math.floor(cur.mz / 2));
    for (let k = 0; k < 16; k++)
      hitMats[k].emissiveIntensity = (k === hitMod) ? 0.05 + 1.5 * glow : 0.0;
    for (let j = 0; j < 6; j++) {
      const arrive = Math.max(0, Math.min(1, (age - j * 0.10) / 0.16));
      layerMats[j].emissiveIntensity = 0.05 + 1.2 * glow * arrive * (prof[j] / pmax);
    }
    rfMat.emissiveIntensity = 0.08 + 1.4 * rfOn * glow;
    for (let i = 0; i < axisMats.length; i++) {         // 簇射轴自上而下点亮(0.10 s/层)
      const arrive = Math.max(0, Math.min(1, (age - i * 0.067) / 0.12));
      axisMats[i].emissiveIntensity = 0.06 + 1.6 * glow * arrive
        * Math.exp(-Math.pow((i * 0.62 - (1.6 + (cur.dex - 12) * 0.29)) / 1.8, 2));
    }
  };
  paint(0);

  group.userData.animate = (t) => paint(t);

  // ---- 引擎声明(零 spinners / 零 oscillators = 零转动部件是设计特征)----
  group.userData.nightMats = [winMat, ledMat, tipMat];
  group.userData.blinkMats = [beaconMat];
  group.userData.lights = [
    { color: 0xffd9a0, pos: [0, 3.0, 24], range: 26 },
    { color: 0xbfd8ff, pos: [-22, 6.5, 13], range: 15 },   // 剖切柱工作灯:拉远压低量程,避免在柱面上烧出白斑
  ];
  return group;
}
