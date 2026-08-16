// viewer/units/veh-uav-01.js
// 火星复合翼 VTOL 无人机与起降坪 —— **本文件由 unmanned-aerial-vehicle/cad/make_city_unit.py 生成**
// 几何全部来自设计册 out/*.json。改设计后重跑生成器,别手改这里。
//
// 核心机理(MODELS.md §3 "核心不做黑盒"):
//   复合翼过渡 —— 四个升力旋翼把飞机举起来,巡航桨把它推快,
//   机翼接管升力后旋翼停转。这是本机唯一难的地方,做成 T=72 s 烘焙回路。
//   机身朝观察侧剖开,露出**双温区**:航电舱(浅)+ 电池分舱(深,厚保温)——
//   那是"火星上过夜比飞行更费电"这条结论的物理载体。

export const meta = {
  id: 'veh-uav-01',
  name: '复合翼无人机与起降坪',
  size_m: 8.23,          // 实测包围盒最大边,生成器写入
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const G = new THREE.Group();
  const nightMats = [], blinkMats = [], spinners = [], oscillators = [];

  // ── 设计常数(生成器注入,勿手改)
  const P = {"h_gear": 0.67, "D_fus": 0.1529, "L_fus": 1.0706, "span": 6.3586, "chord": 0.6359, "taper": 0.65, "R_rot": 0.7672, "y_boom": 0.9037, "dx_rotor": 1.6345, "z_rot": -0.18, "D_prop": 1.4, "track": 0.2715, "ailFrac": 0.22, "hDust": 5.0};

  const M = (c, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
  const mat = {
    skin:   M(0x2b2f36),           // 碳布本色 —— R15 决定不刷白漆
    wing:   M(0x3a4049),
    pv:     M(0x1b2a4a),           // 太阳翼
    pvGrid: M(0x2f4a7a),
    ti:     M(0xb8b2a6),           // 钛接头
    gold:   M(0xc9a227),           // MLI 保温
    aero:   M(0xd8d2c4),           // 气凝胶
    batt:   M(0x3c6e47),
    pcb:    M(0x1e4d33),
    rotor:  M(0x22262c),
    hub:    M(0x8a8f98),
    gear:   M(0x4a4f57),
    pad:    M(0x6b4a3a),
    padLine:M(0xd9d2c6),
    rail:   M(0xd2691e),           // 安全橙
    steel:  M(0x7d838c),
    soil:   M(0x8a5540),
    rock:   M(0x6f4635),
  };
  const glow = (c, i) => {
    const m = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: i });
    nightMats.push(m); return m;
  };

  // 确定性伪随机 —— 作业痕迹要可复现
  let _s = 20240814;
  const rnd = () => { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };

  const box = (w, h, d, m, x, y, z, ry) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z); if (ry) o.rotation.y = ry; return o;
  };
  const cyl = (r1, r2, h, m, x, y, z, seg) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 12), m);
    o.position.set(x, y, z); return o;
  };
  // 两点放方梁 —— 质感基线第一招,桁架全靠它
  const beam = (a, b, t, m) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const o = new THREE.Mesh(new THREE.BoxGeometry(t, d.length(), t), m);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return o;
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ══════════════════════════════════════════ 起降坪
  const PAD_R = 2.60;
  const pad = new THREE.Group(); G.add(pad);
  {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(PAD_R, PAD_R + 0.25, 0.22, 40), mat.pad);
    disc.position.y = 0.11;
    // 值噪声:土面两尺度顶点色,免得像塑料圆盘
    const g = disc.geometry; g.setAttribute('color',
      new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
    const col = g.attributes.color, pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const n = 0.82 + 0.18 * Math.sin(pos.getX(i) * 3.1 + pos.getZ(i) * 2.3)
                     + 0.06 * Math.sin(pos.getX(i) * 11.0 - pos.getZ(i) * 9.0);
      col.setXYZ(i, 0.42 * n, 0.29 * n, 0.23 * n);
    }
    disc.material = M(0xffffff, { vertexColors: true });
    pad.add(disc);

    // H 标线 + 触地圈
    pad.add(box(0.28, 0.03, 2.6, mat.padLine, -0.9, 0.23, 0));
    pad.add(box(0.28, 0.03, 2.6, mat.padLine,  0.9, 0.23, 0));
    pad.add(box(1.8, 0.03, 0.28, mat.padLine, 0, 0.23, 0));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 6, 36), mat.padLine);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.235; pad.add(ring);

    // 四角进近灯(blink)
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      const bm = glow(0xff3b30, 0.9); blinkMats.push(bm);
      pad.add(cyl(0.07, 0.07, 0.34, mat.steel, Math.cos(a) * (PAD_R - 0.5), 0.17, Math.sin(a) * (PAD_R - 0.5), 8));
      pad.add(cyl(0.09, 0.09, 0.1, bm, Math.cos(a) * (PAD_R - 0.5), 0.39, Math.sin(a) * (PAD_R - 0.5), 8));
    }

    // 安全橙护栏(质感基线第四招):后半圈,不挡观察侧
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * (0.08 + 0.84 * i / 10);
      const x = Math.cos(a) * (PAD_R + 0.35), z = -Math.abs(Math.sin(a)) * (PAD_R + 0.35);
      pad.add(cyl(0.045, 0.045, 1.0, mat.rail, x, 0.5, z, 6));
      if (i) {
        const a0 = Math.PI * (0.08 + 0.84 * (i - 1) / 10);
        pad.add(beam(V(Math.cos(a0) * (PAD_R + 0.35), 0.98, -Math.abs(Math.sin(a0)) * (PAD_R + 0.35)),
                     V(x, 0.98, z), 0.05, mat.rail));
      }
    }

    // 作业痕迹:车辙 + 散落砾石
    for (let i = 0; i < 2; i++)
      pad.add(box(0.36, 0.02, PAD_R * 2.1, M(0x74513f), -1.5 + i * 3.0, 0.225, PAD_R * 0.6));
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2, r = PAD_R * (1.02 + rnd() * 0.5), s = 0.05 + rnd() * 0.09;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat.rock);
      // 坑账 §8-3:DodecahedronGeometry(1,0) 的顶点半径是 φ≈1.618 不是 1,
      // 贴地公式是 y = 地面 + 1.62·s。我先写了 1.62 又乘 0.5,等于只用一半 ——
      // 结果 32 颗砾石全都陷进地面 6~12 mm,把整个资产的包络拉到 −0.063。
      st.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      st.rotation.y = rnd() * 3.14;
      // **让几何自己报最低点**,而不是套一个记不准的系数。
      // 坑账 §8-3 说 Dodecahedron 的顶点半径是 φ·s 不是 s;我按 1.62·s 摆过一次,
      // 仍然陷地 —— 因为还叠了旋转。与其继续猜系数,不如实测后抬:
      // 这样换任何几何体、任何旋转都成立,而且不会再错第三次。
      st.updateMatrixWorld(true);
      st.position.y -= new THREE.Box3().setFromObject(st).min.y;
      pad.add(st);
    }

    // 充电/数据桩 —— 输入从哪来的一半(另一半是太阳翼)
    const dock = new THREE.Group(); dock.position.set(-PAD_R + 0.6, 0, -PAD_R + 0.9); pad.add(dock);
    dock.add(box(0.7, 1.15, 0.5, mat.steel, 0, 0.575, 0));
    dock.add(box(0.62, 0.3, 0.03, glow(0x39d353, 0.8), 0, 0.9, 0.26));   // SoC 屏
    for (let i = 0; i < 5; i++) dock.add(box(0.04, 0.5, 0.42, mat.gear, -0.28 + i * 0.14, 0.35, -0.27));
    dock.add(beam(V(0, 0.05, 0.25), V(1.4, 0.05, 2.2), 0.09, mat.gear));  // 埋地电缆槽
  }

  // ══════════════════════════════════════════ 飞行器(整体挂 AC,便于烘焙回路)
  const AC = new THREE.Group(); AC.name = 'aircraft'; G.add(AC);
  const AC_Y0 = P.h_gear + 0.29;                 // 停在坪上时机身轴线高度
  AC.position.y = AC_Y0;

  // ── 机身:朝 +Z 剖开,露双温区(§3 剖切)
  {
    const R = P.D_fus / 2, L = P.L_fus;
    // 上/下/背三面壳,观察侧(+Z)敞开
    const shellSeg = 16;
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R * 0.72, L, shellSeg, 1, false, Math.PI * 0.18, Math.PI * 1.64), mat.skin);
    shell.rotation.z = Math.PI / 2; shell.rotation.y = Math.PI / 2;
    AC.add(shell);
    // 头锥 + 尾锥
    const nose = cyl(R * 0.12, R, 0.30, mat.skin, -L / 2 - 0.15, 0, 0, 16);
    nose.rotation.z = Math.PI / 2; AC.add(nose);
    const tail = cyl(R * 0.55, R * 0.72, 0.26, mat.skin, L / 2 + 0.13, 0, 0, 16);
    tail.rotation.z = -Math.PI / 2; AC.add(tail);

    // **双温区** —— R17 的核心结论,用几何说
    // 航电舱:薄保温(浅色一层)
    AC.add(cyl(R * 0.86, R * 0.86, L * 0.42, mat.aero, -L * 0.22, 0, 0, 14).rotateZ ? (() => {
      const c = cyl(R * 0.86, R * 0.86, L * 0.42, mat.aero, -L * 0.22, 0, 0, 14);
      c.rotation.z = Math.PI / 2; return c; })() : null);
    const fcc = box(0.11, 0.012, 0.084, mat.pcb, -L * 0.22, -0.01, 0.02);
    AC.add(fcc);
    for (let i = 0; i < 3; i++) AC.add(box(0.016, 0.006, 0.016, mat.hub, -L * 0.26 + i * 0.03, 0.002, 0.02));
    AC.add(box(0.05, 0.02, 0.05, glow(0x66ccff, 0.7), -L * 0.14, 0.0, 0.03));   // 载荷相机

    // 电池分舱:**厚保温**(53 mm,R23 的结论),金 MLI + 气凝胶两层
    const bz = new THREE.Group(); bz.position.set(L * 0.12, -0.006, 0); AC.add(bz);
    const aer = cyl(R * 0.80, R * 0.80, L * 0.34, mat.aero, 0, 0, 0, 14); aer.rotation.z = Math.PI / 2; bz.add(aer);
    const mli = cyl(R * 0.84, R * 0.84, L * 0.345, mat.gold, 0, 0, 0, 14); mli.rotation.z = Math.PI / 2; bz.add(mli);
    // 电芯:露出来才算不黑盒
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const cell = cyl(0.0092, 0.0092, 0.065, mat.batt, -0.10 + c * 0.05, -0.022 + r * 0.022, 0.018, 8);
      cell.rotation.z = Math.PI / 2; bz.add(cell);
    }
    bz.add(box(0.09, 0.008, 0.05, mat.pcb, 0.02, 0.03, 0.02));                  // BMS
    bz.add(box(0.10, 0.004, 0.06, M(0xb5651d), 0.0, -0.038, 0.02));             // 加热膜

    // 检修口盖 + 铰链(工业细节语法)
    AC.add(box(0.24, 0.006, 0.02, mat.ti, -L * 0.22, R * 0.94, 0.055));
    for (let i = 0; i < 2; i++) AC.add(box(0.02, 0.02, 0.02, mat.hub, -L * 0.28 + i * 0.12, R * 0.93, 0.06));
  }

  // ── 机翼(梯形,含 20% 副翼 + 上翼面太阳翼)
  {
    const b = P.span, c0 = 2 * P.chord / (1 + P.taper), c1 = c0 * P.taper;
    const mkPanel = (sgn) => {
      const g = new THREE.Group(); AC.add(g);
      const N = 5;
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N;
        const cA = c0 + (c1 - c0) * t0, cB = c0 + (c1 - c0) * t1;
        const cm = (cA + cB) / 2, ym = (t0 + t1) / 2;
        const seg = box(cm, 0.09 * cm, (b / 2) / N, mat.wing,
                        (c0 - cm) * 0.12, 0, 0);
        seg.position.set(0.25 * (c0 - cm), 0, sgn * ((b / 2) * (t0 + t1) / 2));
        g.add(seg);
        // 上翼面太阳翼:占前 21% 弦长
        const pv = box(cm * 0.55, 0.006, (b / 2) / N * 0.94, mat.pv,
                       0, 0.048 * cm, sgn * ((b / 2) * ym));
        pv.position.x = 0.25 * (c0 - cm) - cm * 0.16;
        g.add(pv);
        if (i % 2 === 0) {
          const gd = box(cm * 0.55, 0.008, 0.012, mat.pvGrid, pv.position.x, 0.052 * cm, pv.position.z);
          g.add(gd);
        }
        // 副翼(外侧两段,20% 翼面积 —— R23 的结论)
        if (i >= N - 2) {
          const ail = box(cm * P.ailFrac * 2.4, 0.055 * cm, (b / 2) / N * 0.92, mat.ti,
                          0.25 * (c0 - cm) + cm * 0.40, 0, sgn * ((b / 2) * ym));
          ail.name = 'ail_' + (sgn > 0 ? 'r' : 'l') + i;
          g.add(ail);
          oscillators.push({ node: ail.name, prop: 'rotation', axis: 'z',
                             amp: 0.10, period: 9.0, phase: sgn > 0 ? 0 : Math.PI });
        }
      }
      return g;
    };
    mkPanel(+1); mkPanel(-1);
    // 翼尖小翼
    for (const s of [1, -1]) AC.add(box(0.10, 0.22, 0.03, mat.wing, 0.06, 0.11, s * P.span / 2));
  }

  // ── 短舱 + 四升力旋翼(交班的一侧)
  const rotors = [];
  {
    const R = P.R_rot;
    let k = 0;
    for (const sx of [-P.dx_rotor / 2, P.dx_rotor / 2])
      for (const sy of [-P.y_boom, P.y_boom]) {
        // 挂架 + 短舱(R14 的钛接头 + 胶接过渡件)
        AC.add(beam(V(sx * 0.5, 0, sy), V(sx, P.z_rot + 0.06, sy), 0.032, mat.ti));
        AC.add(cyl(0.055, 0.048, 0.20, mat.skin, sx, P.z_rot + 0.10, sy, 10));
        AC.add(cyl(0.062, 0.062, 0.05, mat.hub, sx, P.z_rot + 0.20, sy, 10));
        const rot = new THREE.Group(); rot.name = 'rotor' + k;
        rot.position.set(sx, P.z_rot + 0.235, sy); AC.add(rot);
        for (let bl = 0; bl < 2; bl++) {
          const a = bl * Math.PI;
          const blade = box(0.085, 0.010, R * 0.86, mat.rotor, 0, 0, 0);
          blade.position.set(Math.sin(a) * 0, 0, 0);
          const pv = new THREE.Group(); pv.rotation.y = a; pv.add(blade);
          blade.position.z = R * 0.5; blade.rotation.x = 0.11;      // 桨距
          pv.add(box(0.03, 0.03, R * 0.14, mat.hub, 0, 0, R * 0.09));
          rot.add(pv);
        }
        rotors.push(rot);
        // 交替旋向 —— 偏航靠反扭矩差动(R21 发现 86)
        spinners.push({ node: rot.name, axis: 'y', rpm: (k % 2 ? 1 : -1) * 268 });
        k++;
      }
  }

  // ── 巡航桨(交班的另一侧)
  const pusher = new THREE.Group(); pusher.name = 'pusher';
  pusher.position.set(P.L_fus / 2 + 0.30, 0, 0); AC.add(pusher);
  {
    const Rp = P.D_prop / 2;
    AC.add(cyl(0.05, 0.05, 0.34, mat.skin, P.L_fus / 2 + 0.14, 0, 0, 10).rotateZ ? (() => {
      const c = cyl(0.05, 0.05, 0.34, mat.skin, P.L_fus / 2 + 0.14, 0, 0, 10);
      c.rotation.z = Math.PI / 2; return c; })() : null);
    for (let bl = 0; bl < 3; bl++) {
      const pv = new THREE.Group(); pv.rotation.x = bl * 2 * Math.PI / 3;
      const blade = box(0.012, Rp * 0.86, 0.075, mat.rotor, 0, Rp * 0.5, 0);
      blade.rotation.z = 0.30;                                       // 38° 根部扭转的示意
      pv.add(blade); pusher.add(pv);
    }
    pusher.add(cyl(0.045, 0.045, 0.06, mat.hub, 0, 0, 0, 10));
    spinners.push({ node: 'pusher', axis: 'x', rpm: 336 });
  }

  // ── 尾翼 + 方向舵(偏航在巡航段靠它,R21 发现 87)
  AC.add(beam(V(P.L_fus / 2 * 0.6, 0, 0), V(P.L_fus / 2 + 0.05, 0.30, 0), 0.04, mat.skin));
  AC.add(box(0.26, 0.44, 0.03, mat.wing, P.L_fus / 2 - 0.02, 0.42, 0));
  AC.add(box(0.42, 0.03, 0.62, mat.wing, P.L_fus / 2 - 0.02, 0.60, 0));

  // ── 起落架(四腿,轮距 = 抗掀翻裕度 3.1× 的那个值)
  {
    const t = P.track / 2, h = P.h_gear;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const foot = V(sx * (t + 0.10), -h, sz * (t + 0.10));
      AC.add(beam(V(sx * 0.06, -0.02, sz * 0.06), V(sx * t, -h * 0.55, sz * t), 0.026, mat.gear));
      AC.add(beam(V(sx * t, -h * 0.55, sz * t), foot, 0.022, mat.gear));
      const pd = cyl(0.055, 0.065, 0.035, mat.rail, foot.x, foot.y - 0.02, foot.z, 10);
      AC.add(pd);
    }
  }

  // ══════════════════════════════════════════ 感知通道(§4c):下视 VIO
  // 契约要的是**真的 PerspectiveCamera 对象**,不是一个描述字典。
  // 相机挂在机身腹部并随 AC 一起动 —— 烘焙回路飞起来时它真的在往下看。
  const vioCam = new THREE.PerspectiveCamera(60, 1, 0.2, 200);
  vioCam.position.set(0, -P.D_fus * 0.5 - 0.02, 0.02);
  vioCam.rotation.x = -Math.PI / 2;                 // 下视
  AC.add(vioCam);
  const sensors = [{ id: 'vio_down', camera: vioCam, width: 64, height: 64, hz: 2 }];
  const vioLed = glow(0x66ccff, 0.5);
  AC.add(box(0.03, 0.012, 0.03, vioLed, 0.06, -P.D_fus * 0.5 - 0.01, 0.02));

  // ══════════════════════════════════════════ 烘焙过渡回路
  // 纯 t 分段,不累积状态:任意 t 跳入都成立、首尾闭合。
  // 这是本资产的**核心机理展示** —— 旋翼与机翼的交班。
  const T = 72;
  const seg = {"spinup": 5, "climb": 14, "trans": 26, "cruise": 46, "back": 56, "descend": 67, "hCruise": 6.0, "xCruise": 26.0, "radius": 9.0};
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  G.userData = {
    nightMats, blinkMats, spinners, oscillators, sensors,
    animate(t, dt, ctx) {
      const tt = t % T;
      // 高度 / 前进 / 姿态 / 两侧转速比例,全部由 tt 分段给出
      let h = 0, x = 0, pitch = 0, roll = 0, rotorSpin = 0, pushSpin = 0;
      if (tt < seg.spinup) {                       // 起转
        rotorSpin = sstep(0, seg.spinup, tt);
      } else if (tt < seg.climb) {                 // 垂直爬升
        rotorSpin = 1;
        h = sstep(seg.spinup, seg.climb, tt) * seg.hCruise;
      } else if (tt < seg.trans) {                 // **过渡:旋翼退、巡航桨进**
        const u = sstep(seg.climb, seg.trans, tt);
        h = seg.hCruise;
        // 按动压交班(R19 发现 81):旋翼比例 = clamp((L_need − q·k)/L_roll)
        rotorSpin = Math.max(0, 1 - u * 1.25);
        pushSpin = u;
        x = u * u * seg.xCruise * 0.30;
        pitch = -0.10 * Math.sin(Math.PI * u);
      } else if (tt < seg.cruise) {                // 巡航(绕坪一圈)
        const u = sstep(seg.trans, seg.cruise, tt);
        h = seg.hCruise; pushSpin = 1;
        x = seg.xCruise * (0.30 + 0.70 * u);
        roll = 0.34 * Math.sin(u * Math.PI * 2);
      } else if (tt < seg.back) {                  // 反向过渡
        const u = sstep(seg.cruise, seg.back, tt);
        h = seg.hCruise;
        rotorSpin = u; pushSpin = Math.max(0, 1 - u * 1.3);
        x = seg.xCruise * (1 - u * 0.35);
        pitch = 0.13 * Math.sin(Math.PI * u);
      } else if (tt < seg.descend) {               // 进场 + 尘区匀速垂降
        const u = sstep(seg.back, seg.descend, tt);
        rotorSpin = 1;
        x = seg.xCruise * 0.65 * (1 - u);
        h = seg.hCruise * (1 - u);
      } else {                                     // 触地 + 停转
        rotorSpin = Math.max(0, 1 - sstep(seg.descend, T, tt));
      }

      // 绕坪飞行:把 x 折成圆周
      const ang = x / Math.max(1e-6, seg.radius);
      AC.position.set(Math.sin(ang) * seg.radius, AC_Y0 + h, Math.cos(ang) * seg.radius - seg.radius);
      AC.rotation.set(pitch, ang, roll);

      // 旋翼:animate 同帧覆盖 spinner,实现起停(veh-heli-01 同法)
      for (let i = 0; i < rotors.length; i++) {
        const dir = (i % 2 ? 1 : -1);
        rotors[i].rotation.y = dir * t * 28.17 * rotorSpin;
        rotors[i].visible = rotorSpin > 0.02;
      }
      pusher.rotation.x = t * 35.21 * pushSpin;
      pusher.visible = pushSpin > 0.02;

      // 感知通道:有帧就用,没有就退烘焙 —— 同文件优雅降级是硬要求。
      // 这里用平均亮度驱动指示灯,并留一个探针给城内验证。
      const sen = sensors[0];
      if (sen && sen.frame > 0 && sen.data) {
        let sum = 0, n = 0;
        for (let i = 0; i < sen.data.length; i += 256) { sum += sen.data[i]; n++; }
        const b = sum / Math.max(1, n) / 255;
        vioLed.emissiveIntensity = 0.3 + 1.5 * b;
        G.userData.vioBrightness = b;
      } else {
        vioLed.emissiveIntensity = 0.5;
      }

      // 尘区:低于扬尘高度时坪上起尘(核心机理之一,R22 发现 94)
      if (dustRing) {
        const dusty = h < P.hDust && h > 0.02 && rotorSpin > 0.3;
        dustRing.visible = dusty;
        // **只在水平面上铺开,不要 setScalar** —— 均匀缩放会把管径也放大,
        // 把环压到地面以下(实测把整个资产包络拉到 −0.063)。
        // 物理上也是这样:下洗把尘往外推,不会把尘柱拉高。
        if (dusty) {
          const k = 1.0 + 0.8 * (1 - h / P.hDust);
          // 环绕 X 旋转了 90°,所以**局部 Z 才是世界 Y**:
          // 要缩主半径就缩局部 XY,管径(局部 Z)保持 1。
          // 先写成 (k,1,k) 反而把管径放大到世界竖直方向,更糟(−0.136)。
          dustRing.scale.set(k, k, 1);
        }
      }
    },
  };

  // 尘环(过渡到尘区时可见)
  const dustRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.60 * 0.75, 0.28, 6, 28),
    M(0xa9714f, { transparent: true, opacity: 0.35 }));
  dustRing.rotation.x = Math.PI / 2; dustRing.position.y = 0.30;
  dustRing.visible = false; G.add(dustRing);

  // 尘膜 pass —— 质感基线第六招
  G.traverse((o) => {
    if (o.isMesh && o.material && o.material.color && !nightMats.includes(o.material))
      o.material.color.lerp(new THREE.Color(0x9e5b3d), 0.05);
  });

  return G;
}
