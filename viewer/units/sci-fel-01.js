// sci-fel-01 — 紧凑型红外/太赫兹自由电子激光装置（地下城，kind:'interior'）
// 设计册真源：E:\Claude\mars-fel（8 本解析账 + Python 数值，3 道已知答案闸全绿）
//   账1 共振与调谐 λ = λu/(2γ²)(1+K²/2)；闸 A：FELIX λu=65 mm 复现 3–150 µm
//   账2 增益：Pierce ρ / Ming Xie（闸 B：LCLS Lg=3.39 m vs 公布 3.3 m）+ 一维摆方程
//        （闸 C：数值 G 与解析 Madey 公式比值 1.0000）
//   账3 发射度判据 εn ≤ γλ/4π：红外裕度 2.6–31×，X 射线 0.7× → 选红外的物理依据
//   账4 1.0 GHz 常温铜 linac，2×8 MW klystron，全站 74 kW = 全城 176 MWe 的 0.042%
//   账5 dump 屏蔽 11.95 十倍层（需 10.06，裕度 77×）；⁴¹Ar 活化是火星特有账
//   账6 波荡器磁吸力 5.9 吨（与重力无关）；腔长靠共模化压到 24 nm rms
//   账7 两条光束线：ISRU 远红外光谱站 + fab 泵浦-探测站
//   账8 30 m 岩日波衰减 e^-326 → 外部热强迫为零；火星无氦 → 只能常温铜机
//
// 契约（MODELS.md §4b）：1 单位 = 1 米；THREE 由引擎传入；无外部资源；
//   室内灯常亮；面数 ≤8 万；原点在洞室地面中心，+Y 上。
// 坐标：+X = 束流方向（枪在 -X 端），+Z = 实验厅侧，机器轴 z = -2.00，束高 y = 1.40。
//   洞室 56(X) × 20(Z) × 12(Y)。

export const meta = {
  id: 'sci-fel-01',
  name: '红外/太赫兹自由电子激光装置（10–150 µm）',
  name_en: 'Infrared / Terahertz Free-Electron Laser (10–150 µm)',
  kind: 'interior',
  size_m: 56,                 // 洞室最长跨度：引擎按此夹取行走范围
  size_axis: 'width',
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = meta.id;
  g.userData.lights = [];
  g.userData.nightMats = [];
  g.userData.blinkMats = [];

  let _s = 20260809;
  const rnd = () => { _s = (_s * 16807) % 2147483647; return _s / 2147483647; };

  // ================================================================= 材质
  const std = (c, r, m, o) => new THREE.MeshStandardMaterial(
    Object.assign({ color: c, roughness: r, metalness: m || 0 }, o || {}));
  const M = {
    rock:     std(0x3a3a40, 0.98, 0, { side: THREE.BackSide }),
    floor:    std(0x33333a, 0.97),
    shot:     std(0x4a4a4e, 0.95),          // 喷射混凝土
    bolt:     std(0x707478, 0.6, 0.5),
    conc:     std(0x8d8b84, 0.92),          // 普通混凝土
    heavy:    std(0x7c7466, 0.93),          // 重混凝土（dump 墙 ρ=3.5）
    steel:    std(0x555b62, 0.55, 0.6),
    ss:       std(0xc0c5ca, 0.35, 0.72),
    ssD:      std(0x9aa0a6, 0.55, 0.5),
    cu:       std(0xb87333, 0.38, 0.8),     // 铜 = RF（因果链一号色）
    cuD:      std(0x8d5726, 0.55, 0.6),
    alu:      std(0xb8bcc0, 0.5, 0.5),
    lead:     std(0x5b616d, 0.7, 0.35),
    poly:     std(0xe6e0cf, 0.9),           // 含硼聚乙烯
    magN:     std(0xd0453a, 0.6, 0.1, { emissive: 0x5a1c17, emissiveIntensity: 1 }),
    magS:     std(0x3663c8, 0.6, 0.1, { emissive: 0x162a56, emissiveIntensity: 1 }),
    pole:     std(0xd3d7dc, 0.4, 0.7, { emissive: 0x4a4e53, emissiveIntensity: 1 }),
    gold:     std(0xd8b148, 0.18, 0.9),     // 金 = 光路（因果链二号色）
    goldD:    std(0x9c7f34, 0.4, 0.7),
    orange:   std(0xdd7a2a, 0.7),
    dark:     std(0x2a2d31, 0.8),
    cab:      std(0x8e9499, 0.62),          // 机柜浅灰
    cabD:     std(0x646a70, 0.7),
    pipeW:    std(0x3f7fbf, 0.6, 0.3),      // 冷却水管（蓝）
    invar:    std(0x3d4247, 0.45, 0.55),    // 殷钢光学台
    glass:    new THREE.MeshStandardMaterial({ color: 0xbcd6cf, roughness: 0.06,
      metalness: 0.0, transparent: true, opacity: 0.26, side: THREE.DoubleSide }),
    hazard:   std(0xd8c02a, 0.8),
    white:    std(0xd8d9d4, 0.8),
  };
  const emis = (c, i) => new THREE.MeshStandardMaterial(
    { color: c, roughness: 0.4, emissive: new THREE.Color(c), emissiveIntensity: i });
  const basic = (c, o) => new THREE.MeshBasicMaterial(
    Object.assign({ color: c }, o || {}));

  // ================================================================= 工具
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
  const SPH = new THREE.SphereGeometry(1, 12, 9);
  const box = (w, h, d, mat, x, y, z, p) => {
    const m = new THREE.Mesh(BOX, mat);
    m.scale.set(w, h, d); m.position.set(x, y, z);
    (p || g).add(m); return m;
  };
  // 轴向圆柱：ax 'x'|'y'|'z'
  const cyl = (r, len, mat, x, y, z, ax, p) => {
    const m = new THREE.Mesh(CYL, mat);
    m.scale.set(r, len, r); m.position.set(x, y, z);
    if (ax === 'x') m.rotation.z = Math.PI / 2;
    if (ax === 'z') m.rotation.x = Math.PI / 2;
    (p || g).add(m); return m;
  };
  const sph = (r, mat, x, y, z, p) => {
    const m = new THREE.Mesh(SPH, mat);
    m.scale.setScalar(r); m.position.set(x, y, z);
    (p || g).add(m); return m;
  };
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, p) => {
    _a.set(ax, ay, az); _b.set(bx, by, bz);
    const m = new THREE.Mesh(BOX, mat);
    m.scale.set(w, w, _a.distanceTo(_b) + w * 0.6);
    m.position.copy(_a).lerp(_b, 0.5);
    m.lookAt(_b);
    (p || g).add(m); return m;
  };
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D(); a.name = 'poi_' + name;
    a.position.set(x, y, z); g.add(a); return a;
  };
  const light = (c, x, y, z, r) => g.userData.lights.push({ color: c, pos: [x, y, z], range: r });

  const HX = 28, HZ = 10, HY = 12;      // 半长 / 半宽 / 洞高
  const BY = 1.40;                      // 束流高度
  const AZ = -2.00;                     // 光轴 z
  const EZ = -2.45;                     // 腔外电子线 z

  // ============================================================ 岩体洞室
  {
    const shell = new THREE.Mesh(new THREE.BoxGeometry(2 * HX + 0.4, HY, 2 * HZ + 0.4), M.rock);
    shell.position.set(0, HY / 2 - 0.05, 0);
    g.add(shell);
    // 地面（分两色：机器区深灰环氧 / 实验厅浅色）
    box(2 * HX, 0.1, 2 * HZ, M.floor, 0, -0.05, 0);
    box(52, 0.02, 8.6, std(0x3c4045, 0.85), -1, 0.012, -4.5);       // 加速器厅环氧地坪
    box(46, 0.02, 9.0, std(0x4b4f52, 0.8), 3, 0.012, 5.2);          // 实验厅地坪
    // 拱顶肋 + 岩栓 + 喷混补丁
    for (let i = -6; i <= 6; i++) {
      const x = i * 4.4;
      box(0.5, 0.35, 2 * HZ - 0.4, M.shot, x, HY - 0.28, 0);
    }
    for (let i = 0; i < 120; i++) {
      const s = rnd() < 0.5 ? -1 : 1;
      const x = (rnd() - 0.5) * 54, y = 1.2 + rnd() * 8.6;
      cyl(0.05, 0.34, M.bolt, x, y, s * (HZ - 0.18), 'z');
      box(0.26, 0.26, 0.06, M.shot, x, y, s * (HZ - 0.03));
    }
    for (let i = 0; i < 26; i++) {                                   // 端墙岩栓
      const s = rnd() < 0.5 ? -1 : 1;
      const z = (rnd() - 0.5) * 18, y = 1.2 + rnd() * 8.0;
      cyl(0.05, 0.34, M.bolt, s * (HX - 0.18), y, z, 'x');
    }
    // 排水沟 + 电缆槽（沿两侧）
    box(54, 0.1, 0.5, M.dark, 0, 0.06, -HZ + 0.55);
    box(54, 0.1, 0.5, M.dark, 0, 0.06, HZ - 0.55);
    for (let i = -12; i <= 12; i++) box(0.5, 0.22, 0.62, M.cabD, i * 2.2, 0.2, HZ - 0.55);
  }

  // ============================================== 人员迷道（西北角）+ 出入口
  {
    const wx = -HX + 0.6;
    box(0.6, 3.2, 5.4, M.conc, wx + 1.9, 1.6, 7.0);      // 迷道内壁 1
    box(4.6, 3.2, 0.6, M.conc, wx + 2.6, 1.6, 4.6);      // 迷道内壁 2
    box(0.6, 3.2, 3.0, M.conc, wx + 4.6, 1.6, 8.6);      // 迷道内壁 3
    box(3.4, 0.3, 5.6, M.conc, wx + 1.5, 3.3, 7.2);      // 迷道顶
    // 门组与警示
    box(0.14, 2.2, 1.3, M.orange, wx + 1.9, 1.1, 9.2);
    box(0.1, 2.0, 1.1, M.hazard, wx + 1.83, 1.05, 9.2);
    const sign = box(0.06, 0.8, 1.6, emis(0xffd27a, 1.4), wx + 2.25, 2.3, 7.0);
    g.userData.nightMats.push(sign.material);
    light(0xfff0d0, wx + 2.2, 2.9, 7.2, 12);
  }

  // ================================================ 屏蔽墙（加速器 ↔ klystron 廊）
  {
    for (let x = -24; x < -7; x += 3.0) {
      const w = Math.min(3.0, -7 - x) - 0.08;
      box(w, 2.6, 1.5, M.conc, x + w / 2, 1.3, -5.65);
      box(w, 0.14, 1.62, M.cabD, x + w / 2, 2.68, -5.65);       // 压顶
    }
    for (let x = -24; x <= -7; x += 5.66) box(0.7, HY - 0.6, 1.5, M.conc, x, (HY - 0.6) / 2, -5.65);
    // 波导跨墙（铜 = RF 因果链）：两台 klystron → 两节结构
    const wgArc = (x0, zA, zB) => {
      const top = 4.2;
      beam(x0, 2.9, zA, x0, top, zA - 0.4, 0.2, M.cu);
      beam(x0, top, zA - 0.4, x0, top, zB + 0.4, 0.2, M.cu);
      beam(x0, top, zB + 0.4, x0, 2.2, zB, 0.2, M.cu);
      box(0.34, 0.34, 0.34, M.cuD, x0, top, (zA + zB) / 2);
    };
    wgArc(-19.8, -7.2, -3.0);
    wgArc(-13.0, -7.2, -3.0);
  }

  // ==================================================== klystron 廊（-Z 侧）
  {
    const zg = -7.9;
    box(18.0, 0.03, 3.0, std(0x44484c, 0.85), -15.5, 0.03, zg);   // 廊地坪
    const station = (x0, tag) => {
      // 调制器机柜排（固态 Marx，33 kJ 电容组）
      for (let i = 0; i < 4; i++) {
        box(0.9, 2.1, 1.0, M.cab, x0 - 2.6 + i * 1.0, 1.05, zg - 1.0);
        box(0.86, 0.34, 0.06, M.dark, x0 - 2.6 + i * 1.0, 1.85, zg - 1.53);
        const led = box(0.1, 0.1, 0.05, emis(0x46d97a, 1.6), x0 - 2.95 + i * 1.0, 1.45, zg - 1.54);
        g.userData.nightMats.push(led.material);
      }
      // 电容组（可见的储能：账 4 的 33 kJ）
      for (let i = 0; i < 6; i++) {
        cyl(0.16, 0.7, M.ssD, x0 - 2.9 + i * 0.42, 0.35, zg + 0.15, 'y');
        cyl(0.05, 0.12, M.cu, x0 - 2.9 + i * 0.42, 0.76, zg + 0.15, 'y');
      }
      box(3.0, 0.1, 0.7, M.cuD, x0 - 1.6, 0.86, zg + 0.15);        // 母排
      // 脉冲变压器油箱
      box(1.4, 1.5, 1.3, M.steel, x0 + 1.1, 0.75, zg + 0.1);
      box(1.5, 0.12, 1.4, M.cabD, x0 + 1.1, 1.56, zg + 0.1);
      // klystron 立管 + 聚焦螺线管（账 4：直流常开 12 kW）
      cyl(0.34, 2.4, M.ss, x0 + 2.6, 1.2, zg + 0.1, 'y');
      for (let i = 0; i < 5; i++) cyl(0.46, 0.28, M.cuD, x0 + 2.6, 0.45 + i * 0.42, zg + 0.1, 'y');
      cyl(0.5, 0.5, M.steel, x0 + 2.6, 2.6, zg + 0.1, 'y');        // 集电极
      cyl(0.2, 0.9, M.ssD, x0 + 2.6, 3.2, zg + 0.1, 'y');
      // 输出波导 → 跨墙
      beam(x0 + 2.6, 2.3, zg + 0.35, x0 + 2.6, 2.9, -7.2, 0.2, M.cu);
      // 冷却水支管
      cyl(0.07, 3.2, M.pipeW, x0 + 0.4, 3.6, zg - 0.6, 'x');
      return tag;
    };
    station(-19.8, 'K1');
    station(-13.0, 'K2');
    // 冷却水撬块（板换 + 泵 + 精密控温）
    box(3.4, 2.0, 2.4, M.cab, -25.4, 1.0, zg - 0.4);
    cyl(0.42, 1.1, M.ssD, -24.0, 0.55, zg + 1.2, 'y');
    cyl(0.42, 1.1, M.ssD, -25.2, 0.55, zg + 1.2, 'y');
    cyl(0.09, 22.0, M.pipeW, -14.0, 3.9, zg - 1.35, 'x');
    cyl(0.09, 22.0, M.pipeW, -14.0, 3.62, zg - 1.35, 'x');
    light(0xdfe6ff, -19.8, 5.2, zg, 22);
    light(0xdfe6ff, -12.0, 5.2, zg, 22);
    poi('linac', -16.4, 3.4, -6.6);
  }

  // ================================================== 电子枪 + 注入器（-X 端）
  {
    const x0 = -26.2;
    // 100 kV 高压台（陶瓷绝缘柱 + 屏蔽球）
    box(2.2, 0.5, 2.0, M.cab, x0 - 0.9, 0.25, EZ);
    for (let i = 0; i < 4; i++)
      cyl(0.11, 1.0, M.white, x0 - 1.6 + (i % 2) * 1.4, 1.0, EZ - 0.7 + Math.floor(i / 2) * 1.4, 'y');
    sph(0.55, M.alu, x0 - 0.9, 1.9, EZ);
    // 枪本体剖切：阴极（暖橙）→ 栅（细网）→ 阳极（不锈钢锥）
    const gunG = new THREE.Group(); gunG.position.set(x0, BY, EZ); g.add(gunG);
    cyl(0.30, 0.62, M.ssD, -0.30, 0, 0, 'x', gunG);
    const cath = cyl(0.10, 0.05, emis(0xff9a3c, 1.9), -0.52, 0, 0, 'x', gunG);
    g.userData.nightMats.push(cath.material);
    for (let i = 0; i < 5; i++) box(0.012, 0.2, 0.012, M.pole, -0.44, 0, -0.09 + i * 0.045, gunG);
    const anode = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.26, 14, 1, true), M.ss);
    anode.rotation.z = -Math.PI / 2; anode.position.set(-0.20, 0, 0);
    anode.material = M.ss; gunG.add(anode);
    cyl(0.06, 0.6, M.ss, 0.10, 0, 0, 'x', gunG);
    // 次谐波聚束腔（250 MHz，铜）
    cyl(0.30, 0.34, M.cu, -25.0, BY, EZ, 'x');
    cyl(0.30, 0.34, M.cu, -24.5, BY, EZ, 'x');
    // 1 GHz 预聚束腔（账 15：单级 SHB 喂不出 1 GHz 俘获要的相宽，两级是必需）
    cyl(0.17, 0.16, M.cu, -23.0, BY, EZ, 'x');
    cyl(0.06, 0.22, M.cuD, -23.0, BY + 0.24, EZ, 'y');
    // 聚束段 + 螺线管
    cyl(0.10, 1.5, M.ss, -23.4, BY, EZ, 'x');
    for (let i = 0; i < 3; i++) cyl(0.26, 0.24, M.cuD, -23.9 + i * 0.5, BY, EZ, 'x');
    // 支撑台架
    for (let x = -26.6; x <= -22.6; x += 1.3) {
      box(0.16, BY - 0.2, 0.16, M.steel, x, (BY - 0.2) / 2, EZ - 0.3);
      box(0.16, BY - 0.2, 0.16, M.steel, x, (BY - 0.2) / 2, EZ + 0.3);
    }
    box(4.6, 0.14, 0.8, M.steel, -24.6, BY - 0.14, EZ);
    light(0xffe9c8, -25.0, 4.4, EZ + 1.5, 20);
    poi('gun', -25.6, 2.6, EZ + 0.9);
  }

  // ==================================== 常温铜直线加速器两节（剖切露虹膜盘荷）
  const linacSeg = (xa, xb) => {
    const n = Math.round((xb - xa) / 0.30);
    for (let i = 0; i < n; i++) {
      const x = xa + 0.15 + i * 0.30;
      cyl(0.155, 0.26, M.cu, x, BY, EZ, 'x');                       // 腔胞外壁
      cyl(0.175, 0.035, M.cuD, x + 0.145, BY, EZ, 'x');             // 虹膜盘
      if (i % 4 === 0) {                                            // 冷却水套管
        cyl(0.035, 0.30, M.pipeW, x, BY + 0.21, EZ - 0.02, 'x');
        cyl(0.035, 0.30, M.pipeW, x, BY - 0.21, EZ - 0.02, 'x');
      }
    }
    // 上半剖开：只在 -Z 侧留半壳，+Z 侧露腔胞（用薄挡板示意被切掉的壳）
    box(xb - xa, 0.06, 0.4, M.cuD, (xa + xb) / 2, BY + 0.20, EZ - 0.24);
    // 支撑与调平
    for (let x = xa; x <= xb; x += 1.1) {
      box(0.18, BY - 0.16, 0.18, M.steel, x, (BY - 0.16) / 2, EZ - 0.34);
      box(0.18, BY - 0.16, 0.18, M.steel, x, (BY - 0.16) / 2, EZ + 0.34);
      cyl(0.05, 0.12, M.ssD, x, 0.06, EZ - 0.34, 'y');
    }
    box(xb - xa + 0.4, 0.14, 0.9, M.steel, (xa + xb) / 2, BY - 0.22, EZ);
    // 相位灯条（RF 行波可视化，animate 自驱——不进 nightMats/blinkMats）
    const lamps = [];
    const nl = Math.round((xb - xa) / 0.6);
    for (let i = 0; i < nl; i++) {
      const mt = emis(0xffb040, 0.15);
      box(0.2, 0.05, 0.05, mt, xa + 0.3 + i * 0.6, BY + 0.30, EZ + 0.30);
      lamps.push({ mat: mt, x: xa + 0.3 + i * 0.6 });
    }
    return lamps;
  };
  const rfLamps = [].concat(linacSeg(-22.0, -17.6), linacSeg(-15.2, -10.9));

  // 诊断 / 四极三元组
  const quad = (x, z) => {
    const q = new THREE.Group(); q.position.set(x, BY, z); g.add(q);
    box(0.30, 0.30, 0.28, M.steel, 0, 0, 0, q);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      box(0.10, 0.10, 0.24, M.cuD, Math.cos(a) * 0.155, Math.sin(a) * 0.155, 0, q);
    }
    cyl(0.055, 0.34, M.ss, 0, 0, 0, 'x', q);
    return q;
  };
  [-17.3, -16.6, -15.9, -10.3, -9.6, -4.9, -4.2, -3.6].forEach((x) => quad(x, EZ));
  // 能谱诊断（偏转磁铁 + 荧光靶臂）
  box(0.5, 0.34, 0.6, M.steel, -8.9, BY, EZ);
  box(0.22, 0.5, 0.22, M.cabD, -8.9, BY + 0.42, EZ);
  cyl(0.05, 0.9, M.ssD, -8.9, BY - 0.5, EZ + 0.6, 'y');

  // ================================================== 磁压缩 chicane（4 偶极）
  {
    const dz = -0.11;   // 账 15 重定：R56 ~30 mm（两级聚束后）→ 偏置 110 mm（账 4 原 282）
    const dip = (x, z) => {
      box(0.44, 0.34, 0.5, M.steel, x, BY, z);
      box(0.46, 0.09, 0.52, M.cuD, x, BY + 0.20, z);
      box(0.46, 0.09, 0.52, M.cuD, x, BY - 0.20, z);
      box(0.16, 0.7, 0.16, M.steel, x, 0.35, z);
    };
    dip(-8.0, EZ); dip(-7.1, EZ + dz); dip(-6.3, EZ + dz); dip(-5.4, EZ);
    // 束流轨迹（视觉：金属波纹管随偏置走）
    beam(-8.0, BY, EZ, -7.1, BY, EZ + dz, 0.055, M.ss);
    cyl(0.055, 0.8, M.ss, -6.7, BY, EZ + dz, 'x');
    beam(-6.3, BY, EZ + dz, -5.4, BY, EZ, 0.055, M.ss);
    box(2.9, 0.12, 1.1, M.steel, -6.7, BY - 0.24, EZ - 0.14);
    poi('chicane', -6.7, 2.2, EZ + 0.9);
  }

  // ======================================= 束管 + 离子泵（全线，账 8 的 12 只）
  {
    const seg = (xa, xb, z) => cyl(0.045, xb - xa, M.ss, (xa + xb) / 2, BY, z, 'x');
    seg(-22.6, -22.0, EZ); seg(-17.6, -17.2, EZ); seg(-15.6, -15.2, EZ);
    seg(-10.9, -8.2, EZ); seg(-5.4, -3.3, EZ); seg(2.2, 9.0, EZ);
    for (let i = 0; i < 12; i++) {
      const x = -24 + i * 2.6;
      if (x > -3.4 && x < 2.4) continue;
      const z = EZ;
      box(0.34, 0.30, 0.34, std(0x3f4d63, 0.6, 0.4), x, BY - 0.42, z);
      cyl(0.045, 0.28, M.ss, x, BY - 0.22, z, 'y');
    }
  }

  // ================== 腔外→腔内 dogleg（合并/引出）：账文里 24–33° 小偏转
  {
    const dg = (xa, xb, za, zb) => {
      box(0.34, 0.3, 0.42, M.steel, xa, BY, za);
      box(0.34, 0.3, 0.42, M.steel, xb, BY, zb);
      beam(xa, BY, za, xb, BY, zb, 0.05, M.ss);
    };
    dg(-2.9, -2.2, EZ, AZ);
    dg(1.5, 2.2, AZ, EZ);
  }

  // ====================================================== 波荡器（剖切 + 永磁）
  const undK = { jawTop: null };
  {
    const LU = 2.60, LAM = 0.065, NP = 40, GAP = 0.028;
    const uz = AZ;
    const root = new THREE.Group(); root.position.set(0, BY, uz); g.add(root);

    // 磁阵：每周期每颚 2 磁块 + 2 极靴，宽 λu/4
    const bw = LAM / 4 * 0.92, bh = 0.075, bd = 0.075;
    const mkJaw = (sign) => {
      const jaw = new THREE.Group();
      jaw.position.set(0, sign * (GAP / 2 + bh / 2), 0);
      const gN = new THREE.BoxGeometry(bw, bh, bd);
      const iN = new THREE.InstancedMesh(gN, M.magN, NP);
      const iS = new THREE.InstancedMesh(gN, M.magS, NP);
      const iP = new THREE.InstancedMesh(new THREE.BoxGeometry(bw, bh, bd * 1.06), M.pole, NP * 2);
      const mtx = new THREE.Matrix4();
      for (let i = 0; i < NP; i++) {
        const x0 = -LU / 2 + i * LAM;
        mtx.makeTranslation(x0 + LAM * 0.125, 0, 0); iN.setMatrixAt(i, mtx);
        mtx.makeTranslation(x0 + LAM * 0.625, 0, 0); iS.setMatrixAt(i, mtx);
        mtx.makeTranslation(x0 + LAM * 0.375, 0, 0); iP.setMatrixAt(2 * i, mtx);
        mtx.makeTranslation(x0 + LAM * 0.875, 0, 0); iP.setMatrixAt(2 * i + 1, mtx);
      }
      iN.instanceMatrix.needsUpdate = iS.instanceMatrix.needsUpdate = true;
      iP.instanceMatrix.needsUpdate = true;
      jaw.add(iN, iS, iP);
      // 背铁 + 颚梁（账 6：0.40×0.55 m 才扛得住 5.9 吨磁吸力）
      box(LU + 0.2, 0.05, 0.22, M.steel, 0, sign * (bh / 2 + 0.028), 0, jaw);
      box(LU + 0.3, 0.42, 0.30, M.steel, 0, sign * 0.30, -0.10, jaw);
      return jaw;
    };
    const jawT = mkJaw(1), jawB = mkJaw(-1);
    root.add(jawT, jawB);
    jawT.name = 'und_jaw_top';
    undK.jawTop = jawT;

    // C 形机架（只在 -Z 侧立柱 → +Z 侧全开 = 剖切）
    for (let i = -1; i <= 1; i++) {
      box(0.34, 1.9, 0.34, M.steel, i * 1.15, -BY + 0.95, -0.42, root);
      box(0.34, 0.30, 0.34, M.steel, i * 1.15, 0.72, -0.42, root);
    }
    box(3.1, 0.22, 0.9, M.steel, 0, -BY + 0.11, -0.30, root);        // 底座
    // 间隙驱动丝杠（可见的调谐旋钮）
    for (let i = -1; i <= 1; i += 2) {
      cyl(0.045, 1.5, M.ssD, i * 1.15, 0.05, -0.42, 'y', root);
      cyl(0.12, 0.14, M.cuD, i * 1.15, 0.80, -0.42, 'y', root);
    }
    beam(-1.15, 0.86, -0.42, 1.15, 0.86, -0.42, 0.07, M.ssD, root);  // 同步轴
    // 真空室（薄扁盒，穿过间隙）
    box(LU + 0.5, GAP * 0.72, 0.16, std(0xcfd4d8, 0.3, 0.6), 0, 0, 0, root);
    // 长波平行板波导（账 10d）：两块**水平**铜板，间距 10 mm，装在滑轨上
    // —— E 平行于板 = TE 分支，α ~1e-5 Np/m；转 90° 变 TEM 就是 0.2 Np/m，差 4 个量级
    {
      const wg = new THREE.Group();
      wg.position.set(0, 0, 0.62);                 // 待命位：让在光轴 +Z 侧
      box(3.0, 0.018, 0.30, M.cu, 0, 0.005, 0, wg);
      box(3.0, 0.018, 0.30, M.cu, 0, -0.005, 0, wg);
      for (let i = -2; i <= 2; i++)
        box(0.08, 0.05, 0.34, M.ssD, i * 0.7, 0, 0, wg);
      box(3.2, 0.05, 0.10, M.ssD, 0, -0.05, -0.20, wg);          // 滑轨
      box(0.22, 0.22, 0.22, M.cuD, 1.7, -0.02, -0.20, wg);       // 推杆电机
      const tag = emis(0x2fb5a8, 1.2);
      box(0.5, 0.10, 0.03, tag, -1.1, 0.16, 0.18, wg);
      g.userData.nightMats.push(tag);
      root.add(wg);
    }
    // 间隙/波长牌（emissive 色带 = 调谐范围的几何身份）
    const bandC = [0x7a3ad8, 0x3a6fd8, 0x2fb5a8, 0x86c93a, 0xe0b93a, 0xdd7a2a, 0xd0453a];
    for (let i = 0; i < 7; i++) {
      const mt = emis(bandC[i], 1.2);
      box(0.22, 0.1, 0.03, mt, -0.66 + i * 0.22, 1.15, 0.34, root);
      g.userData.nightMats.push(mt);
    }
    box(1.7, 0.05, 0.05, M.cabD, 0, 1.06, 0.34, root);
    // ---- 放大 6× 的三周期剖切教学台（真机间隙只有 28 mm，读不出来）----
    const TS = 6, tx = 2.0, tz = 0.9;
    box(1.9, 0.75, 1.0, M.cabD, tx, 0.375, tz);
    box(2.0, 0.08, 1.1, M.ssD, tx, 0.79, tz);
    const tg = new THREE.Group(); tg.position.set(tx, 1.28, tz); g.add(tg);
    const bw6 = LAM / 4 * 0.92 * TS, bh6 = 0.075 * TS, gap6 = GAP * TS;
    for (let s2 = -1; s2 <= 1; s2 += 2) {
      for (let i = 0; i < 3; i++) {
        const x0 = -1.5 * LAM * TS + i * LAM * TS;
        box(bw6, bh6, 0.34, s2 > 0 ? M.magN : M.magS, x0 + LAM * TS * 0.125,
          s2 * (gap6 / 2 + bh6 / 2), 0, tg);
        box(bw6, bh6, 0.36, M.pole, x0 + LAM * TS * 0.375,
          s2 * (gap6 / 2 + bh6 / 2), 0, tg);
        box(bw6, bh6, 0.34, s2 > 0 ? M.magS : M.magN, x0 + LAM * TS * 0.625,
          s2 * (gap6 / 2 + bh6 / 2), 0, tg);
        box(bw6, bh6, 0.36, M.pole, x0 + LAM * TS * 0.875,
          s2 * (gap6 / 2 + bh6 / 2), 0, tg);
      }
      box(LAM * TS * 3.1, 0.05, 0.36, M.steel, 0,
        s2 * (gap6 / 2 + bh6 + 0.025), 0, tg);
    }
    // 摆动轨迹（正弦折线，与真机 K 摆幅同相位）
    for (let i = 0; i < 24; i++) {
      const u0 = -LAM * TS * 1.5 + i * (LAM * TS * 3 / 24);
      const u1 = u0 + LAM * TS * 3 / 24;
      const yy = (u) => 0.055 * Math.sin((u + LAM * TS * 1.5) / (LAM * TS) * 6.283);
      beam(u0, yy(u0), 0, u1, yy(u1), 0, 0.028, emis(0xffd25a, 1.5), tg);
    }
    box(1.8, 0.05, 0.05, M.cabD, tx, 2.02, tz);
    const tl = emis(0xc9e6ff, 1.2);
    box(0.9, 0.16, 0.03, tl, tx - 0.4, 2.14, tz);
    g.userData.nightMats.push(tl);
    box(0.4, 0.16, 0.03, emis(0xd0453a, 1.2), tx + 0.42, 2.14, tz);
    box(0.4, 0.16, 0.03, emis(0x3663c8, 1.2), tx + 0.86, 2.14, tz);
    box(0.09, 1.05, 0.09, M.orange, tx - 1.05, 0.52, tz + 0.62);
    box(0.09, 1.05, 0.09, M.orange, tx + 1.05, 0.52, tz + 0.62);
    box(2.2, 0.07, 0.07, M.orange, tx, 1.02, tz + 0.62);

    poi('undulator', 0, 2.35, AZ + 0.6);
    poi('teach', tx, 2.4, tz + 0.4);
    light(0xcfe0ff, 0, 4.6, AZ + 1.6, 18);
    light(0xdfeaff, 2.0, 2.9, 1.6, 14);
  }

  // ============================================ 光学谐振腔（殷钢台 + 两面金镜）
  const optic = { pulse: null, glow: null, outBeam: null };
  {
    const M1X = -3.60, M2X = 2.40;
    // 殷钢/花岗岩共模台（账 6：共模化把 119 nm 压到 24 nm）
    box(7.4, 0.34, 1.1, M.invar, (M1X + M2X) / 2, BY - 0.55, AZ);
    for (let i = -3; i <= 3; i++) box(0.22, 0.4, 0.9, M.steel, (M1X + M2X) / 2 + i * 1.1, 0.2, AZ);
    box(7.6, 0.16, 1.3, M.conc, (M1X + M2X) / 2, 0.08, AZ);          // 独立浇筑基础
    // 镜座（六自由度 + 压电）
    // 账 10 定版：金镀金刚石车削铜球面镜 ⌀100 mm，R = 3.188 m（g = -0.882 近共心）
    const mirror = (x, hole) => {
      const grp = new THREE.Group(); grp.position.set(x, BY, AZ); g.add(grp);
      cyl(0.055, 0.12, M.ssD, 0, 0, 0, 'x', grp);          // 镜体（⌀110 座）
      cyl(hole ? 0.050 : 0.050, 0.02, M.gold, x < 0 ? 0.065 : -0.065, 0, 0, 'x', grp);
      if (hole) cyl(0.0021, 0.06, M.dark, -0.065, 0, 0, 'x', grp);  // ⌀4.1 mm 取出孔(20 µm 档)
      box(0.24, 0.5, 0.3, M.cabD, x < 0 ? -0.14 : 0.14, -0.1, 0, grp);
      for (let i = 0; i < 3; i++) {
        const a = i * 2.094;
        cyl(0.03, 0.14, M.cu, x < 0 ? -0.06 : 0.06, Math.sin(a) * 0.12, Math.cos(a) * 0.12, 'x', grp);
      }
      cyl(0.05, 0.30, M.pipeW, x < 0 ? -0.2 : 0.2, 0.22, 0.12, 'y', grp);  // 镜片水冷
      return grp;
    };
    mirror(M1X, false); mirror(M2X, true);
    // 取出孔径轮（账 14 三维改判）：定 T名义≈0.10、按波长换档——
    // ⌀2.1/4.1/6.5/9.2/11.3 mm ↔ 5/20/50/100/150 µm（a∝√λ 使 N_F 恒 0.036，
    // 全部在衍射区；大孔档已废，面积公式在 N_F≪1 不成立）
    {
      const wheel = new THREE.Group();
      wheel.position.set(M2X + 0.16, BY, AZ);
      wheel.rotation.z = Math.PI / 2;
      cyl(0.155, 0.024, M.cabD, 0, 0, 0, 'y', wheel);
      const dia = [0.0021, 0.0041, 0.0065, 0.0092, 0.0113];
      for (let i = 0; i < 5; i++) {
        const a = i * 1.2566;
        cyl(dia[i] / 2, 0.03, M.dark,
          Math.cos(a) * 0.095, 0, Math.sin(a) * 0.095, 'y', wheel);
      }
      cyl(0.028, 0.10, M.ssD, 0, -0.06, 0, 'y', wheel);
      g.add(wheel);
      box(0.16, 0.16, 0.16, M.cuD, M2X + 0.16, BY - 0.30, AZ);   // 分度电机
    }
    // 腔长干涉仪（He-Ne，第二道防线）
    box(0.4, 0.16, 0.2, std(0xb03a3a, 0.5), M1X - 0.5, BY + 0.34, AZ + 0.42);
    beam(M1X - 0.5, BY + 0.34, AZ + 0.42, M2X + 0.3, BY + 0.34, AZ + 0.42, 0.012,
      basic(0xff5a5a));
    // 腔内光斑（animate 驱动：往返 + 增益建立）
    const pmat = basic(0xffd98a, { transparent: true, opacity: 0.0 });
    optic.pulse = sph(0.09, pmat, 0, BY, AZ);
    optic.pulse.material = pmat;
    // 波荡器段的增益辉光（沿波荡器伸长的椭球）
    const gmat = basic(0xffe6a0, { transparent: true, opacity: 0.0 });
    optic.glow = new THREE.Mesh(SPH, gmat);
    optic.glow.scale.set(1.3, 0.10, 0.10);
    optic.glow.position.set(0, BY, AZ);
    g.add(optic.glow);
    poi('cavity', M2X + 0.4, 2.3, AZ + 0.8);
  }

  // ===================================== 电子束 → dump（90° 双偶极 + 屏蔽 vault）
  const dumpG = { redMats: [] };
  {
    // 引出后沿 +X 至 x=8.4，两只 45° 偶极转向 -Z
    box(0.44, 0.34, 0.5, M.steel, 8.4, BY, EZ);
    box(0.5, 0.34, 0.44, M.steel, 9.0, BY, -3.05);
    beam(8.4, BY, EZ, 9.0, BY, -3.05, 0.05, M.ss);
    cyl(0.05, 1.2, M.ss, 9.0, BY, -3.7, 'z');
    // ---- dump vault：重混凝土 2.0 m（账 5：光子 6.62 十倍层）----
    const VX0 = 4.0, VX1 = 14.0, VZ0 = -9.8, VZ1 = -3.8, VH = 4.6, T = 2.0;
    box(VX1 - VX0, VH, T, M.heavy, (VX0 + VX1) / 2, VH / 2, VZ0 + T / 2);        // 南墙
    box(T, VH, VZ1 - VZ0, M.heavy, VX1 - T / 2, VH / 2, (VZ0 + VZ1) / 2);        // 东墙
    box(T, VH, VZ1 - VZ0 - T, M.heavy, VX0 + T / 2, VH / 2, (VZ0 + VZ1 - T) / 2); // 西墙
    box(4.4, 1.0, T, M.heavy, VX1 - 2.2, 0.5, VZ1 - T / 2);                      // 北墙（剖切→矮墙）
    box(0.9, VH, T, M.heavy, 10.2, VH / 2, VZ1 - T / 2);                         // 北墙残段（露断面）
    box(VX1 - VX0, 0.9, VZ1 - VZ0, M.heavy, (VX0 + VX1) / 2, VH + 0.45, (VZ0 + VZ1) / 2); // 顶板
    // 断面骨料纹（重混凝土身份）
    for (let i = 0; i < 40; i++)
      box(0.1 + rnd() * 0.12, 0.1 + rnd() * 0.1, 0.03, std(0x615a4d, 0.95),
        4.2 + rnd() * 5.6, 0.1 + rnd() * 0.85, VZ1 - T + 0.015);
    // 束流穿墙孔（北墙）
    cyl(0.05, T + 0.3, M.ss, 9.0, BY, VZ1 - T / 2, 'z');
    cyl(0.14, T + 0.1, M.dark, 9.0, BY, VZ1 - T / 2, 'z');
    // ---- dump 本体：五层同色因果链（铝→钢→铅→含硼PE→混凝土）----
    const cutCyl = (r, len, mat) => {
      const geo = new THREE.CylinderGeometry(r, r, len, 20, 1, false,
        Math.PI * 1.5, Math.PI * 1.5);
      const m = new THREE.Mesh(geo, mat);
      m.material.side = THREE.DoubleSide;
      m.rotation.x = Math.PI / 2;
      m.position.set(9.0, BY, -6.9);
      g.add(m); return m;
    };
    const layMat = (base, em) => {
      const m = base.clone();
      m.emissive = new THREE.Color(em); m.emissiveIntensity = 1;
      return m;
    };
    cutCyl(0.65, 1.90, layMat(M.poly, 0x4c483c));    // 含硼聚乙烯（中子）
    cutCyl(0.50, 1.65, layMat(M.lead, 0x1d2029));    // 铅（硬光子尾巴）
    cutCyl(0.40, 1.45, layMat(M.steel, 0x1c1f22));   // 钢
    cutCyl(0.20, 1.00, layMat(M.alu, 0x43464a));     // 铝芯 11 X0（簇射主体）
    box(1.6, 0.5, 2.2, M.steel, 9.0, 0.45, -6.9);                 // dump 台架
    cyl(0.06, 3.0, M.pipeW, 8.2, BY + 0.75, -6.9, 'z');           // 冷却水（3 L/min）
    cyl(0.06, 3.0, M.pipeW, 9.8, BY + 0.75, -6.9, 'z');
    // 红区地面 + 警示灯（互锁）
    box(5.6, 0.02, 2.0, std(0x7a2a26, 0.9), 7.2, 0.03, -2.75);
    for (let i = 0; i < 6; i++)
      box(0.34, 0.03, 2.0, M.hazard, 4.8 + i * 1.0, 0.035, -2.75);
    for (let i = 0; i < 4; i++) {
      const mt = emis(0xd0453a, 0.2);
      box(0.16, 0.16, 0.08, mt, 4.9 + i * 1.6, 1.1, -3.72);
      dumpG.redMats.push(mt);
    }
    box(0.12, 1.15, 5.6, M.orange, 4.5, 0.58, -2.75);             // 红区护栏
    for (let i = 0; i < 5; i++) box(0.14, 1.15, 0.14, M.orange, 4.5, 0.58, -0.1 - i * 1.3);
    light(0xffd9b0, 9.0, 3.4, -5.2, 20);
    light(0xffe3c0, 8.4, 2.3, -6.9, 12);
    poi('dump', 9.0, 2.6, -3.2);
  }

  // ============================================ 光路输运 + 切换站 + 两条光束线
  const bl = { shutterA: null, shutterB: null, flip: null, tubeA: null, tubeB: null };
  {
    const OY = BY;
    // M2 → +X → 45° 转向箱 (4.0, AZ) → +Z 至 (4.0, 5.5)
    cyl(0.09, 1.5, M.goldD, 3.25, OY, AZ, 'x');
    box(0.44, 0.44, 0.44, M.goldD, 4.0, OY, AZ);
    cyl(0.09, 7.2, M.goldD, 4.0, OY, 1.6, 'z');
    for (let i = 0; i < 4; i++) box(0.16, OY - 0.1, 0.16, M.steel, 4.0, (OY - 0.1) / 2, -1.0 + i * 2.0);
    // CO₂ 种子注入（账 22 播种账：10.6 µm 货架线与 10 µm 边界点近重合，经取出孔
    // 反向注入把三维建立 9.0→4.0 µs、平均功率 ×1.46；账 21 关死宏脉冲拉长后，
    // 播种是唯一的建立期旋钮）
    box(0.26, 0.26, 0.26, M.goldD, 2.85, OY, AZ);                   // 注入耦合箱（内 45° 分束片）
    box(0.55, 0.20, 0.22, M.cabD, 2.85, OY, AZ - 0.62);             // CO₂ 种子激光头
    for (let i = 0; i < 3; i++)
      box(0.48, 0.02, 0.016, M.ssD, 2.85, OY + 0.12, AZ - 0.70 + i * 0.07);  // 散热鳍
    box(0.16, 0.28, 0.16, M.steel, 2.85, 1.16, AZ - 0.62);          // 台座（落殷钢台）
    box(0.05, 0.16, 0.03, M.ssD, 2.85, OY, AZ - 0.38);              // 注入快门
    beam(2.85, OY, AZ - 0.50, 2.85, OY, AZ - 0.14, 0.008, basic(0xff9a55));  // 种子光路
    sph(0.018, basic(0xff8a3a), 2.62, OY + 0.08, AZ - 0.54);        // 出光指示
    // 中继离轴抛物面镜箱（账 10：每 4 m 一只，把 150 µm 的光斑重新聚回 w≈15 mm）
    [[4.0, -0.2], [4.0, 3.6]].forEach(([rx, rz]) => {
      box(0.34, 0.34, 0.34, M.goldD, rx, OY, rz);
      cyl(0.10, 0.02, M.gold, rx, OY, rz, 'y');
      box(0.14, 0.5, 0.14, M.cabD, rx, OY - 0.55, rz);
    });
    // 低屏蔽墙 + 光路穿墙迷道
    for (let x = -8; x < 18; x += 3.0) {
      if (x > 2.5 && x < 5.5) continue;
      box(2.9, 1.1, 0.7, M.conc, x + 1.45, 0.55, 2.4);
    }
    box(1.2, 1.1, 0.7, M.conc, 3.1, 0.55, 2.4);
    box(1.2, 1.1, 0.7, M.conc, 4.9, 0.55, 2.4);
    // 切换站（翻转镜）
    box(0.7, 0.7, 0.7, M.goldD, 4.0, OY, 5.5);
    const flip = new THREE.Group(); flip.position.set(4.0, OY, 5.5); g.add(flip);
    box(0.03, 0.26, 0.26, M.gold, 0, 0, 0, flip);
    bl.flip = flip;
    // 两条支线
    cyl(0.075, 3.2, M.goldD, 2.2, OY, 5.5, 'x');
    cyl(0.075, 3.6, M.goldD, 6.0, OY, 5.5, 'x');
    // 快门（animate 驱动的滑块）
    const shutter = (x) => {
      box(0.22, 0.5, 0.34, M.cabD, x, OY, 5.5);
      const bldm = new THREE.Mesh(BOX, M.ss);
      bldm.scale.set(0.03, 0.26, 0.26); bldm.position.set(x, OY, 5.5);
      g.add(bldm); return bldm;
    };
    bl.shutterA = shutter(1.2);
    bl.shutterB = shutter(7.4);
    // 支线光管（束流可见段：animate 调透明度）
    const tube = (xa, xb) => {
      const mt = basic(0xffcf6a, { transparent: true, opacity: 0.0 });
      const m = cyl(0.028, Math.abs(xb - xa), mt, (xa + xb) / 2, OY, 5.5, 'x');
      m.material = mt; return m;
    };
    bl.tubeA = tube(0.9, -2.4);
    bl.tubeB = tube(7.7, 11.0);
  }

  // ---------------------------------- 光束线 1：THz/远红外光谱站（ISRU 与水）
  {
    const cx = -3.6, cz = 6.4;
    box(5.6, 0.20, 3.2, M.invar, cx, 0.92, cz);                    // 光学台
    for (let i = -2; i <= 2; i++) box(0.2, 0.9, 0.2, M.steel, cx + i * 1.2, 0.45, cz - 1.3);
    for (let i = -2; i <= 2; i++) box(0.2, 0.9, 0.2, M.steel, cx + i * 1.2, 0.45, cz + 1.3);
    // 样品真空腔（开视窗，露内部样品杯）
    cyl(0.46, 0.7, M.ssD, cx - 0.6, 1.37, cz, 'y');
    cyl(0.42, 0.04, M.glass, cx - 0.6, 1.73, cz, 'y');
    cyl(0.12, 0.06, std(0x8a5a3a, 0.95), cx - 0.6, 1.16, cz, 'y');  // 风化层样品
    cyl(0.10, 0.05, M.gold, cx - 0.24, 1.30, cz - 0.30, 'y');
    // 脉管冷头（100 K 冰样品）—— 火星上唯一允许的低温：百克级闭循环
    cyl(0.20, 0.55, M.ss, cx - 0.6, 2.0, cz, 'y');
    cyl(0.28, 0.18, M.ssD, cx - 0.6, 2.36, cz, 'y');
    box(0.7, 0.5, 0.5, M.cab, cx - 0.6, 0.35, cz + 1.9);
    // 可变衰减器：线栅偏振片对（账 12a：20 µm 微区必须衰减 ~1000 倍，否则一发烧样品）
    {
      const at = new THREE.Group(); at.position.set(cx - 2.15, 1.30, cz); g.add(at);
      for (let i = 0; i < 2; i++) {
        cyl(0.085, 0.02, std(0x6a707a, 0.35, 0.6), i * 0.22 - 0.11, 0, 0, 'x', at);
        cyl(0.10, 0.03, M.cabD, i * 0.22 - 0.11, 0, 0, 'x', at);
        for (let k = 0; k < 9; k++)
          box(0.004, 0.15, 0.004, M.gold, i * 0.22 - 0.11 + 0.012,
            0, -0.07 + k * 0.0175, at);
      }
      cyl(0.05, 0.16, M.cuD, 0.11, -0.16, 0, 'y', at);        // 旋转台电机
      const l = emis(0xffb347, 1.2);
      box(0.18, 0.05, 0.03, l, 0, 0.15, 0.09, at);
      g.userData.nightMats.push(l);
    }
    // 分束器 + 参考探测器（账 12b：单光路做不了痕量，双光路比值是硬要求）
    {
      const bs = new THREE.Group(); bs.position.set(cx - 1.45, 1.30, cz); g.add(bs);
      box(0.14, 0.20, 0.14, M.goldD, 0, 0, 0, bs);
      const sp = new THREE.Mesh(BOX, M.glass);
      sp.scale.set(0.015, 0.13, 0.13); sp.rotation.y = Math.PI / 4;
      bs.add(sp);
      cyl(0.02, 0.9, basic(0xffcf6a, { transparent: true, opacity: 0.35 }),
        0, 0, 0.45, 'z', bs);                                  // 参考支路
      box(0.20, 0.18, 0.20, std(0x2f3a44, 0.6, 0.3), 0, 0, 0.95, bs);
      box(0.26, 0.10, 0.26, M.cabD, 0, -0.16, 0.95, bs);
      const rl = emis(0x62e0ff, 1.3);
      box(0.10, 0.04, 0.03, rl, 0, 0.12, 0.82, bs);
      g.userData.nightMats.push(rl);
    }
    // 光栅单色器 + 探测器（Golay/热释电）
    box(0.8, 0.4, 0.7, M.cabD, cx + 1.0, 1.22, cz);
    box(0.34, 0.30, 0.34, std(0x2f3a44, 0.6, 0.3), cx + 1.9, 1.17, cz);
    // 筛分样品架（sci-swir 定标实验室的几何身份：4 级粒径 = 4 色）
    const sc = [0x9b6a44, 0xa8794f, 0xb98a5c, 0xc79a6c];
    for (let i = 0; i < 4; i++) {
      box(0.5, 0.06, 0.5, M.ssD, cx + 2.3, 1.06 + i * 0.16, cz + 1.05);
      box(0.44, 0.045, 0.44, std(sc[i], 0.95), cx + 2.3, 1.10 + i * 0.16, cz + 1.05);
    }
    box(0.6, 0.05, 0.6, M.cabD, cx + 2.3, 1.02, cz + 1.05);
    // 谱线屏（顶点色谱带：五条 ISRU 特征线的位置）
    const scr = box(1.7, 0.9, 0.05, basic(0x10161c), cx + 0.3, 2.35, cz + 1.55);
    const peaks = [[-0.62, 0xff8a3a], [-0.30, 0x66d0ff], [0.0, 0x8affa0],
                   [0.34, 0xffd45a], [0.66, 0xd08aff]];
    peaks.forEach(([px, c], i) => {
      box(0.055, 0.16 + 0.14 * ((i * 7) % 3), 0.02, basic(c),
        cx + 0.3 + px, 2.16 + (0.16 + 0.14 * ((i * 7) % 3)) / 2, cz + 1.52);
    });
    box(1.6, 0.02, 0.02, basic(0x5a6a78), cx + 0.3, 2.14, cz + 1.52);
    box(1.8, 0.06, 0.08, M.cabD, cx + 0.3, 1.86, cz + 1.55);
    // 机柜与护栏
    box(0.9, 1.9, 0.8, M.cab, cx - 2.9, 0.95, cz + 1.1);
    light(0xe6f0ff, cx, 4.4, cz, 16);
    poi('bl1', cx - 0.6, 2.9, cz - 1.2);
  }

  // ------------------------------------ 光束线 2：泵浦-探测站（fab 材料表征）
  const stB = { stage: null };
  {
    const cx = 9.6, cz = 6.4;
    box(6.4, 0.20, 3.4, M.invar, cx, 0.92, cz);
    for (let i = -2; i <= 2; i++) box(0.2, 0.9, 0.2, M.steel, cx + i * 1.4, 0.45, cz - 1.4);
    for (let i = -2; i <= 2; i++) box(0.2, 0.9, 0.2, M.steel, cx + i * 1.4, 0.45, cz + 1.4);
    // 分束器
    box(0.16, 0.24, 0.16, M.goldD, cx - 2.4, 1.16, cz);
    box(0.02, 0.2, 0.2, M.glass, cx - 2.4, 1.16, cz);
    // 延迟线（长导轨 + 滑车角反射器）—— 声明式 oscillator 驱动
    box(3.2, 0.08, 0.22, M.ssD, cx - 0.6, 1.06, cz - 1.05);
    const stage = new THREE.Group(); stage.position.set(cx - 0.6, 1.20, cz - 1.05); g.add(stage);
    box(0.34, 0.22, 0.34, M.cabD, 0, 0, 0, stage);
    box(0.2, 0.2, 0.02, M.gold, 0, 0.02, 0.17, stage);
    box(0.02, 0.2, 0.2, M.gold, -0.1, 0.02, 0, stage);
    stage.name = 'pp_delay_stage';
    stB.stage = stage;
    cyl(0.03, 3.2, M.ssD, cx - 0.6, 1.14, cz - 1.35, 'x');          // 丝杠
    box(0.24, 0.24, 0.24, M.cuD, cx + 1.1, 1.14, cz - 1.35);        // 步进电机
    // 样品台（fab 晶圆）+ 低温杜瓦
    cyl(0.34, 0.36, M.ssD, cx + 0.9, 1.20, cz + 0.5, 'y');
    cyl(0.30, 0.012, std(0x6f7a86, 0.25, 0.85), cx + 0.9, 1.39, cz + 0.5, 'y');
    cyl(0.075, 0.014, std(0x2b3138, 0.4, 0.6), cx + 0.82, 1.40, cz + 0.44, 'y');
    box(0.5, 0.5, 0.5, M.cab, cx + 0.9, 0.35, cz + 1.5);
    // 探测器（MCT/HgCdTe 罐 + 前放）
    cyl(0.16, 0.34, M.ss, cx + 2.4, 1.24, cz + 0.5, 'y');
    box(0.3, 0.24, 0.3, M.cabD, cx + 2.4, 1.52, cz + 0.5);
    // 瞬态屏（顶点色衰减曲线）
    const scr = box(1.6, 0.9, 0.05, basic(0x0f151b), cx + 0.4, 2.35, cz + 1.65);
    for (let i = 0; i < 26; i++) {
      const u = i / 25, h = 0.62 * Math.exp(-u * 2.6);
      box(0.05, Math.max(h, 0.015), 0.02, basic(0x62e0ff),
        cx + 0.4 - 0.72 + u * 1.44, 2.03 + Math.max(h, 0.015) / 2, cz + 1.62);
    }
    box(1.5, 0.02, 0.02, basic(0x5a6a78), cx + 0.4, 2.01, cz + 1.62);
    box(1.7, 0.06, 0.08, M.cabD, cx + 0.4, 1.86, cz + 1.65);
    box(0.9, 1.9, 0.8, M.cab, cx + 3.3, 0.95, cz + 1.1);
    light(0xe6f0ff, cx, 4.4, cz, 16);
    poi('bl2', cx + 0.9, 2.9, cz - 1.2);
  }

  // ================================================= 铅玻璃控制室（+Z 西侧）
  const ctrl = { tower: [] };
  {
    const x0 = -24.5, x1 = -15.5, z0 = 3.8, z1 = 9.4, H = 3.4;
    box(x1 - x0, 0.25, z1 - z0, M.conc, (x0 + x1) / 2, 0.125, (z0 + z1) / 2);
    box(x1 - x0 + 0.4, 0.25, z1 - z0 + 0.4, M.conc, (x0 + x1) / 2, H + 0.12, (z0 + z1) / 2);
    box(0.3, H, z1 - z0, M.conc, x0, H / 2 + 0.25, (z0 + z1) / 2);
    box(x1 - x0, H, 0.3, M.conc, (x0 + x1) / 2, H / 2 + 0.25, z1);
    // 铅玻璃观察窗墙（面向机器）
    box(x1 - x0, 0.9, 0.3, M.conc, (x0 + x1) / 2, 0.7, z0);
    box(x1 - x0, 0.55, 0.3, M.conc, (x0 + x1) / 2, H + 0.02, z0);
    box(x1 - x0 - 0.2, 1.95, 0.10, M.glass, (x0 + x1) / 2, 2.13, z0);
    for (let i = 1; i < 4; i++) box(0.14, 1.95, 0.22, M.cabD, x0 + i * 2.25, 2.13, z0);
    box(x1 - x0, 0.16, 0.34, M.cabD, (x0 + x1) / 2, 1.2, z0 - 0.05);
    // 东侧门
    box(0.3, H - 1.0, 1.4, M.conc, x1, (H - 1.0) / 2 + 0.25, z1 - 1.2);
    box(0.14, 2.1, 1.1, M.orange, x1, 1.3, z1 - 3.0);
    // 控制台（三联屏 + 键台）
    for (let i = 0; i < 3; i++) {
      const bx = x0 + 1.8 + i * 2.4;
      box(1.8, 0.75, 0.8, M.cab, bx, 0.62, z0 + 1.3);
      box(1.7, 0.06, 0.7, M.cabD, bx, 1.02, z0 + 1.3);
      for (let k = 0; k < 2; k++) {
        const sm = basic(k ? 0x123044 : 0x14361f);
        const s = box(0.76, 0.5, 0.04, sm, bx - 0.42 + k * 0.84, 1.34, z0 + 1.05);
        s.rotation.x = -0.12;
        for (let r2 = 0; r2 < 5; r2++)
          box(0.5 + 0.12 * ((r2 * 5 + i) % 3), 0.035, 0.02,
            basic(k ? 0x4fc3f7 : 0x7ee787), bx - 0.42 + k * 0.84 - 0.08, 1.5 - r2 * 0.08, z0 + 1.03);
      }
      box(0.5, 0.06, 0.24, M.dark, bx, 1.03, z0 + 0.98);
    }
    // 机柜排（DAQ / 定时 / 互锁 PLC）
    for (let i = 0; i < 5; i++) {
      box(0.7, 2.0, 0.85, M.cab, x0 + 1.2 + i * 0.78, 1.25, z1 - 0.9);
      const l = emis(i === 4 ? 0xffb347 : 0x46d97a, 1.6);
      box(0.1, 0.1, 0.04, l, x0 + 1.2 + i * 0.78 - 0.25, 2.05, z1 - 1.33);
      g.userData.nightMats.push(l);
    }
    // 互锁塔灯（绿/琥珀/红，animate 状态机自驱，不进 blinkMats）
    const tower = (tx, tz) => {
      cyl(0.06, 2.2, M.ssD, tx, 1.1, tz, 'y');
      const cols = [0x46d97a, 0xffb347, 0xd0453a];
      const set = [];
      for (let i = 0; i < 3; i++) {
        const mt = emis(cols[i], 0.15);
        cyl(0.11, 0.16, mt, tx, 2.34 - i * 0.18, tz, 'y');
        set.push(mt);
      }
      ctrl.tower.push(set);
    };
    tower(-15.0, 3.2); tower(-1.0, 2.2); tower(11.0, 2.2);
    light(0xfff1d6, -20.0, 3.0, 6.5, 16);
    poi('control', -20.0, 2.8, 3.1);
    poi('siting', -26.6, 3.0, 3.0);
  }

  // 设施铭牌（siting 卡的几何身份）：波段色带 + 「30 m 岩」剖面小图
  {
    const px = -HX + 0.35, py = 3.0, pz = 2.4;
    box(0.12, 2.0, 3.6, M.cabD, px, py, pz);
    const bandC = [0x7a3ad8, 0x3a6fd8, 0x2fb5a8, 0x86c93a, 0xe0b93a, 0xdd7a2a, 0xd0453a];
    for (let i = 0; i < 7; i++) {
      const mt = emis(bandC[i], 1.3);
      box(0.05, 0.34, 0.42, mt, px + 0.09, py + 0.5, pz - 1.45 + i * 0.48);
      g.userData.nightMats.push(mt);
    }
    // 岩层剖面：地表 → 30 m 岩 → 洞室
    for (let i = 0; i < 6; i++)
      box(0.05, 0.13, 2.6, std(0x6d5a44 + i * 0x040404, 0.95), px + 0.09, py - 0.05 - i * 0.14, pz);
    box(0.05, 0.10, 2.6, std(0x9a5f3c, 0.9), px + 0.09, py + 0.16, pz);
    box(0.05, 0.16, 0.9, emis(0x8ad0ff, 0.9), px + 0.09, py - 0.92, pz);
  }

  // ============================================== 换热井井口（账 8：8×20 m）
  {
    for (let i = 0; i < 8; i++) {
      const x = 18.5 + (i % 4) * 1.3, z = 6.0 + Math.floor(i / 4) * 1.4;
      cyl(0.17, 0.55, M.ssD, x, 0.28, z, 'y');
      cyl(0.20, 0.08, M.cabD, x, 0.58, z, 'y');
      cyl(0.05, 1.3, M.pipeW, x, 0.72, z + 0.7, 'z');
    }
    box(6.0, 0.06, 0.16, M.pipeW, 20.4, 0.78, 7.6);
    box(1.4, 1.6, 1.0, M.cab, 23.4, 0.8, 7.0);
    box(0.14, 1.0, 3.6, M.orange, 17.6, 0.5, 6.7);
  }

  // ============================================== 真空/气路机组 + 备件区（东端）
  {
    box(2.6, 1.9, 1.6, M.cab, 24.2, 0.95, -2.0);
    cyl(0.30, 0.5, M.ss, 22.6, 0.9, -1.2, 'y');
    cyl(0.30, 0.5, M.ss, 22.6, 0.9, -2.8, 'y');
    cyl(0.08, 6.0, M.ss, 20.0, 1.9, -2.0, 'x');
    box(0.5, 1.4, 0.5, std(0x9a4b3a, 0.7), 21.4, 0.7, -0.6);        // 火星 CO₂ 回充瓶
    box(0.5, 1.4, 0.5, std(0x9a4b3a, 0.7), 22.0, 0.7, -0.6);
    // 备件与工装
    for (let i = 0; i < 4; i++) box(1.6, 0.08, 0.9, M.ssD, 25.4, 0.5 + i * 0.55, 1.6);
    for (let i = 0; i < 5; i++)
      box(0.4 + rnd() * 0.3, 0.3, 0.4, M.cabD, 24.9 + rnd() * 0.9, 0.72 + (i % 3) * 0.55, 1.4 + rnd() * 0.4);
  }

  // ---------------------------------------------------- 洞室照明与氛围
  // 吊装式灯具（吊杆把光源降到 6.4 m —— 12 m 洞顶直挂等于没有光）
  const hallLights = [-24, -17.5, -11, -4.5, 2, 8.5, 15, 21.5];
  hallLights.forEach((x, i) => {
    cyl(0.05, HY - 6.9, M.cabD, x, HY - (HY - 6.9) / 2 - 0.3, -1.2, 'y');
    box(1.8, 0.16, 0.55, M.cabD, x, 6.62, -1.2);
    const l = emis(0xfff4de, 1.7);
    box(1.6, 0.07, 0.40, l, x, 6.50, -1.2);
    g.userData.nightMats.push(l);
    if (i % 2 === 0) light(0xfff2dc, x, 6.1, -1.2, 40);
  });
  [-19, -8, 3, 14].forEach((x) => {
    cyl(0.05, HY - 6.9, M.cabD, x, HY - (HY - 6.9) / 2 - 0.3, 6.2, 'y');
    box(1.6, 0.14, 0.5, M.cabD, x, 6.62, 6.2);
    const l = emis(0xf2f6ff, 1.6);
    box(1.4, 0.07, 0.36, l, x, 6.50, 6.2);
    g.userData.nightMats.push(l);
    light(0xeef4ff, x, 6.1, 6.2, 34);
  });
  // 工位灯（低悬，真正照亮核心）
  const taskLight = (x, y, z, r, c) => {
    cyl(0.035, 1.0, M.cabD, x, y + 0.5, z, 'y');
    box(0.5, 0.1, 0.3, M.cabD, x, y, z);
    const l = emis(c || 0xfff0d8, 1.8);
    box(0.42, 0.05, 0.24, l, x, y - 0.07, z);
    g.userData.nightMats.push(l);
    light(c || 0xfff0d8, x, y - 0.4, z, r);
  };
  taskLight(0.0, 3.3, -0.9, 22, 0xdfeaff);       // 波荡器
  taskLight(-3.4, 3.3, -0.9, 20, 0xdfeaff);      // 上游腔镜
  taskLight(-19.8, 3.6, -7.0, 24);               // klystron K1
  taskLight(-13.0, 3.6, -7.0, 24);               // klystron K2
  taskLight(8.6, 3.4, -4.6, 22);                 // dump 前红区
  taskLight(-3.6, 3.2, 6.4, 20, 0xeaf2ff);       // 光束线 1
  taskLight(9.6, 3.2, 6.4, 20, 0xeaf2ff);        // 光束线 2
  taskLight(-25.0, 3.2, -7.4, 18);               // 冷却水撬块

  // 顶部电缆桥架
  box(52, 0.1, 0.7, M.cabD, -1, HY - 1.15, -3.4);
  box(46, 0.1, 0.6, M.cabD, 3, HY - 1.15, 4.2);
  for (let i = -11; i <= 11; i++) {
    beam(i * 2.4, HY - 1.1, -3.4, i * 2.4, HY - 0.45, -3.4, 0.06, M.steel);
  }

  // 安全橙护栏（实验厅边界）
  for (let i = 0; i < 12; i++) box(0.09, 1.05, 0.09, M.orange, -9 + i * 2.4, 0.52, 3.0);
  box(27.0, 0.08, 0.08, M.orange, 4.2, 1.02, 3.0);

  // 地面作业痕迹 + 散落工具（"用过的场地"）
  for (let i = 0; i < 26; i++) {
    const x = (rnd() - 0.5) * 50, z = -8.5 + rnd() * 16;
    box(0.5 + rnd() * 1.4, 0.012, 0.16, std(0x2a2c30, 0.95), x, 0.026, z);
  }
  for (let i = 0; i < 8; i++)
    box(0.5, 0.35, 0.4, M.cabD, -22 + rnd() * 44, 0.18, -0.9 + rnd() * 1.4);

  // =============================================== 尘膜 pass（地下也有细尘）
  const dust = new THREE.Color(0x9e5b3d);
  [M.conc, M.heavy, M.cab, M.cabD, M.ssD, M.steel, M.orange, M.white, M.poly]
    .forEach((m) => m.color.lerp(dust, 0.045));

  // ==================================================== 声明式动画
  g.userData.oscillators = [
    // 泵浦-探测延迟线滑车（±1.2 m，24 s）
    { node: 'pp_delay_stage', prop: 'position', axis: 'x', amp: 1.2, period: 24, phase: 0 },
    // 波荡器上颚：间隙调谐呼吸（±12 mm，48 s）—— 账 1 的三旋钮之一
    { node: 'und_jaw_top', prop: 'position', axis: 'y', amp: 0.012, period: 48, phase: 0 },
  ];

  // ==================================================== animate：纯 t 时间线
  // 主循环 T = 12 s：搜索(0–2) → 就绪(2–3) → 出束(3–10) → 停束(10–12)
  // 束团循环 1.0 s，在出束段内跑 7 趟；腔内光斑往返 0.25 s 并按饱和曲线增亮。
  const T = 12.0, TB = 1.0;
  const P0 = -26.2, P1 = 9.0;             // 束团 x 起止
  const smooth = (a) => a * a * (3 - 2 * a);
  const lerp = (a, b, u) => a + (b - a) * u;

  g.userData.animate = (t) => {
    const tt = ((t % T) + T) % T;
    const beamOn = tt >= 3.0 && tt < 10.0;
    const armed = tt >= 2.0 && tt < 10.0;

    // ---- 互锁塔灯（三色状态机；自管，不进 blink/night 数组）----
    let gI = 0.12, aI = 0.12, rI = 0.12;
    if (tt < 2.0) aI = 1.9;                                  // 搜索
    else if (tt < 3.0) { gI = 1.9; aI = 0.5; }               // 就绪
    else if (tt < 10.0) { gI = 1.9; rI = 1.6; }              // 出束
    else aI = 1.9;                                           // 停束
    for (const set of ctrl.tower) {
      set[0].emissiveIntensity = gI;
      set[1].emissiveIntensity = aI;
      set[2].emissiveIntensity = rI;
    }
    // dump 红区灯：出束时缓闪
    const blinkP = 0.5 + 0.5 * Math.sin(tt * 6.283 / 0.8);
    for (let i = 0; i < dumpG.redMats.length; i++)
      dumpG.redMats[i].emissiveIntensity = beamOn ? 0.25 + 1.7 * blinkP : 0.12;

    // ---- RF 相位灯行波（结构充能：2.5 s 起、10.5 s 落）----
    const rfOn = tt >= 2.5 && tt < 10.5;
    const rfAmp = rfOn ? Math.min(1, (tt - 2.5) / 0.6) * Math.min(1, (10.5 - tt) / 0.6) : 0;
    for (let i = 0; i < rfLamps.length; i++) {
      const L = rfLamps[i];
      const ph = (L.x * 1.7 - t * 9.0);
      rfLamps[i].mat.emissiveIntensity = 0.12 + 2.0 * rfAmp * Math.pow(
        0.5 + 0.5 * Math.sin(ph), 6);
    }

    // ---- 束团光点：枪 → 腔 → chicane → 波荡器（锯齿摆动）→ dump ----
    let px = P0, pz = EZ, py = BY, vis = 0, gain = 0;
    if (beamOn) {
      const u = ((tt - 3.0) % TB) / TB;                     // 0..1 单趟
      vis = 1;
      px = lerp(P0, P1, smooth(u));
      if (px < -2.9) pz = EZ;
      else if (px < -2.2) pz = lerp(EZ, AZ, (px + 2.9) / 0.7);
      else if (px < 1.5) pz = AZ;
      else if (px < 2.2) pz = lerp(AZ, EZ, (px - 1.5) / 0.7);
      else pz = EZ;
      // chicane 段的横向偏置
      if (px > -7.1 && px < -6.3) pz += -0.11;
      else if (px > -8.0 && px <= -7.1) pz += -0.11 * (px + 8.0) / 0.9;
      else if (px >= -6.3 && px < -5.4) pz += -0.11 * (-5.4 - px) / 0.9;
      // 波荡器段：锯齿摆动 + 增益增亮（K 摆幅按 λu/(2πγ) 放大 60× 可见）
      if (px > -1.3 && px < 1.3) {
        pz += 0.055 * Math.sin((px + 1.3) / 0.065 * 6.283);
        gain = (px + 1.3) / 2.6;
      } else if (px >= 1.3) gain = 1;
      // 引出后转 -Z 段
      if (px > 8.4) { pz = lerp(EZ, -3.05, (px - 8.4) / 0.6); }
      if (px > 9.0) { px = 9.0; pz = lerp(-3.05, -6.4, Math.min(1, (u - 0.94) / 0.06)); }
    }
    optic.pulse.position.set(px, py, pz);
    optic.pulse.material.opacity = vis ? 0.55 + 0.45 * gain : 0.0;
    optic.pulse.scale.setScalar(0.09 * (1 + 1.1 * gain));

    // ---- 腔内光场：往返 + 建立（增益可视化的第二层）----
    const build = beamOn ? 1 - Math.exp(-(tt - 3.0) / 1.6) : Math.max(0, 1 - (tt - 10.0) / 0.5);
    const alive = tt >= 3.0 && tt < 10.5 ? build : 0;
    const rt = ((t % 0.25) / 0.25);
    const tri = rt < 0.5 ? rt * 2 : 2 - rt * 2;
    optic.glow.position.x = lerp(-3.6, 2.4, tri);
    optic.glow.material.opacity = 0.10 + 0.42 * alive;
    optic.glow.scale.set(1.3, 0.06 + 0.10 * alive, 0.06 + 0.10 * alive);

    // ---- 用户站快门与出光（A：3–6.5 s，B：6.5–10 s）----
    const aOpen = tt >= 3.2 && tt < 6.5, bOpen = tt >= 6.6 && tt < 10.0;
    bl.shutterA.position.y = BY + (aOpen ? 0.30 : 0.0);
    bl.shutterB.position.y = BY + (bOpen ? 0.30 : 0.0);
    bl.flip.rotation.y = aOpen ? -0.79 : (bOpen ? 0.79 : 0.0);
    bl.tubeA.material.opacity = aOpen ? 0.30 + 0.45 * alive : 0.0;
    bl.tubeB.material.opacity = bOpen ? 0.30 + 0.45 * alive : 0.0;
  };

  // 起始姿态（t=0 的确定性状态）
  g.userData.animate(0);

  // ==================================================== 出入口契约
  g.userData.entry = { pos: [-21.0, 0, 1.2], yaw: -Math.PI / 2 };
  g.userData.exitZone = { pos: [-26.2, 7.4], radius: 1.8 };

  return g;
}
