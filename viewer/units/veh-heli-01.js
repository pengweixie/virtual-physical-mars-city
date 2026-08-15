// veh-heli-01 「Jezero Scout」侦察直升机 + 停机坪/机库
// Ingenuity → Mars Science Helicopter 路线的城市化侦察型:共轴双旋翼 ⌀1.8 m,5 kg 级。
// 设计轮账本:E:\Claude\mars-heli\out\results.json(悬停 604 W 轴功率 / 1698 rpm@Ma0.667
// / Re 1.9e4 / 131 Wh → 10.6 min)。展示转速 240 rpm = 真实值 ÷7.1(知识卡写双数)。
//
// 飞行回路 = 纯 t 分段时间线 T=80 s(契约 §6 烘焙规则):
//   0-3 停机 | 3-9 旋翼起转 | 9-17 垂直爬升 32 m | 17-63 巡航(切线出航→绕矿场
//   73 m 半径全圆→切线返场,航向连续)| 63-71 消速下降 | 71-75.5 旋翼停转 | 75.5-80 停机
// 旋翼:spinners×2(±240 rpm,上下反转)是声明层/降级通道;animate 同帧后执行,
// 以闭式 Θ(t) 绝对赋值接管(起转抛物线→匀速→停转抛物线,全循环恰 269 整圈,首尾无缝)。
// 感知(§4c 可选):腹部导航相机 64×64@2Hz;sensor.frame>0 时消费亮度驱动状态灯,
// 引擎无通道时同文件退回纯 t 脉冲——优雅降级。
export const meta = {
  id: 'veh-heli-01',
  name: '侦察直升机与停机坪',
  name_en: 'Recon Helicopter & Helipad',
  size_m: 18.4,               // 停机态实测 18.37(validate INFO 校准;飞行超出 bbox 属允许)
  effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const group = new THREE.Group();

  // ---- 确定性伪随机 + 值噪声(质感基线 §0) ----
  let _seed = 20260803;
  const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  const hash3 = (x, y, z) => {
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  const vnoise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    let a = 0;
    for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 1; dy++) for (let dz = 0; dz <= 1; dz++)
      a += hash3(xi + dx, yi + dy, zi + dz) * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    return a;
  };

  // ---- 材质 ----
  const L = (c, extra) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, extra));
  const S = (c, met, rgh, extra) => new THREE.MeshStandardMaterial(
    Object.assign({ color: c, metalness: met, roughness: rgh }, extra));
  const M = {
    gold:   L(0xe3aa3f),               // MLI 保温金膜(Ingenuity 同款;Lambert 保亮度)
    goldHi: L(0xf0c25e),               // 金膜高光条(假反光,打破大平面)
    silver: S(0xc6ccd4, 0.4, 0.32),
    carbon: L(0x1a1d20),
    padSide: L(0x5c4030),
    apron:   L(0x8a6a52),
    white:   L(0xd8d2c6),
    whiteDust: L(0xc2b8a8),
    orange:  L(0xd97a2e),
    grey:    L(0x8d9298),
    dark:    L(0x3a3f45),
    alu:     L(0xc4cad2),
    panel:   L(0x55606c),
    solar:   L(0x1d2f4a),
    blade:   L(0x22262b),
    tip:     L(0xe07b39),
    leg:     L(0x2e3238),
    screen:  L(0x0a2a30, { emissive: 0x3fd8c8, emissiveIntensity: 0.9 }),
    screenAmber: L(0x2e2308, { emissive: 0xe0aa48, emissiveIntensity: 0.9 }),
    copper:  L(0x9a6a3a),
    hv:      L(0x6b4a86),              // 高压侧 400 V(紫)——与低压铜色分色
    ferrite: L(0x2b2b30),              // 变压器磁芯
    pcb:     L(0x1f4a34),              // 控制/功率板
    dockInd: L(0x123016, { emissive: 0x39e05a, emissiveIntensity: 0.9 }),
    strip:   L(0x40381f, { emissive: 0xffd9a0, emissiveIntensity: 0.7 }),
    navRed:  L(0x401010, { emissive: 0xff3b30, emissiveIntensity: 0.9 }),
    navGrn:  L(0x0d3512, { emissive: 0x35e04a, emissiveIntensity: 0.9 }),
    blinkRed: L(0x8a1d16, { emissive: 0xff4038, emissiveIntensity: 2.0 }),
    camLed:  L(0x102030, { emissive: 0x4aa8ff, emissiveIntensity: 0.6 }),
    sock:    L(0xd97a2e, { side: THREE.DoubleSide }),
    sockW:   L(0xd8d2c6, { side: THREE.DoubleSide }),
    dustFx:  L(0xb07a4e, { transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  };

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
  const _ba = new THREE.Vector3(), _bb = new THREE.Vector3();
  const beam = (ax, ay, az, bx, by, bz, w, mat, parent) => {
    _ba.set(ax, ay, az); _bb.set(bx, by, bz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, w, _ba.distanceTo(_bb) + w * 0.6), mat);
    m.position.copy(_ba).lerp(_bb, 0.5);
    m.lookAt(_bb);
    (parent || group).add(m);
    return m;
  };
  const poi = (name, x, y, z) => {
    const a = new THREE.Object3D();
    a.name = name; a.position.set(x, y, z); group.add(a);
  };

  // ================= 1. 停机坪(烧结 regolith 圆坪) =================
  const PAD_R = 5.0, PAD_TOP = 0.22;
  {
    // 坪体:顶面 r5 → 底缘 r5.9 的斜裙边一体成型;顶面双尺度顶点色打破塑料感
    const geo = new THREE.CylinderGeometry(PAD_R, PAD_R + 0.9, PAD_TOP, 48, 1);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const cA = new THREE.Color(0x6b4a38), cB = new THREE.Color(0x8a6a50), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      const n = 0.55 * vnoise(px * 0.5, py, pz * 0.5) + 0.45 * vnoise(px * 2.3, py + 7, pz * 2.3);
      tmp.copy(cA).lerp(cB, Math.min(1, Math.max(0, n)));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pad = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    pad.position.y = PAD_TOP / 2;
    group.add(pad);
    // 外圈防尘围裙(压平的环,盖住坪缘到原地面的接缝)
    const skirt = new THREE.Mesh(new THREE.RingGeometry(PAD_R + 0.85, PAD_R + 1.7, 48), M.apron);
    skirt.rotation.x = -Math.PI / 2; skirt.position.y = 0.015;
    group.add(skirt);
    // H 标线 + 外圆环线(白漆,略浮出顶面)
    const yM = PAD_TOP + 0.006;
    box(0.32, 0.012, 2.2, M.white, -0.75, yM, 0);
    box(0.32, 0.012, 2.2, M.white, 0.75, yM, 0);
    box(1.20, 0.012, 0.32, M.white, 0, yM, 0);
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.35, 3.6, 48), M.white);
    ring.rotation.x = -Math.PI / 2; ring.position.y = yM;
    group.add(ring);
    // 四角进近灯(blink)+ 橙色标桩
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2;
      const x = Math.cos(a) * (PAD_R + 1.15), z = Math.sin(a) * (PAD_R + 1.15);
      cyl(0.035, 0.045, 0.55, 8, M.dark, x, 0.28, z);
      box(0.16, 0.14, 0.16, M.blinkRed, x, 0.62, z);
      const b = a + Math.PI / 4;
      cyl(0.03, 0.035, 0.4, 6, M.orange,
        Math.cos(b) * (PAD_R + 1.15), 0.2, Math.sin(b) * (PAD_R + 1.15));
    }
  }

  // ================= 2. 机库 / 充电坞 =================
  const HX = -8.3, HZ = 1.2;          // 机库中心;开口朝 +X(面向坪)
  {
    const W = 4.2, D = 3.4, H = 2.55; // 内空
    box(0.16, H, D, M.whiteDust, HX - W / 2, H / 2, HZ);              // 背墙
    box(W, H, 0.16, M.whiteDust, HX, H / 2, HZ - D / 2);              // 侧墙 ×2
    box(W, H, 0.16, M.whiteDust, HX, H / 2, HZ + D / 2);
    box(W + 0.3, 0.14, D + 0.3, M.white, HX, H + 0.07, HZ);           // 顶盖
    box(W + 0.44, 0.1, D + 0.44, M.grey, HX, H + 0.19, HZ);           // 顶压条
    box(0.2, H, 0.2, M.orange, HX + W / 2 - 0.1, H / 2, HZ - D / 2 + 0.1); // 开口边柱
    box(0.2, H, 0.2, M.orange, HX + W / 2 - 0.1, H / 2, HZ + D / 2 - 0.1);
    box(W + 0.5, 0.22, D + 0.5, M.grey, HX, 0.06, HZ);                // 底裙边/地坪
    cyl(0.09, 0.09, D, 12, M.alu, HX + W / 2 - 0.05, H - 0.12, HZ)    // 卷帘门轴(半开)
      .rotation.x = Math.PI / 2;
    box(0.06, 0.5, D - 0.3, M.panel, HX + W / 2 - 0.03, H - 0.42, HZ);// 垂下的帘板一截
    // 状态屏(挂南侧墙外面朝坪,夜光)
    box(0.9, 0.6, 0.08, M.dark, HX + 1.3, 1.75, HZ - D / 2 - 0.12);
    box(0.8, 0.5, 0.07, M.screen, HX + 1.3, 1.75, HZ - D / 2 - 0.14);
    box(0.06, 0.5, 0.9, M.strip, HX - W / 2 + 0.11, H - 0.35, HZ);    // 库内顶灯条
    // 备件:桨叶备件架(A 形架 + 2 支备用桨叶)
    const rx = HX - 0.6, rz = HZ + 0.9;
    beam(rx - 0.5, 0, rz, rx, 1.15, rz, 0.06, M.grey);
    beam(rx + 0.5, 0, rz, rx, 1.15, rz, 0.06, M.grey);
    beam(rx - 0.5, 0, rz - 0.8, rx, 1.15, rz - 0.8, 0.06, M.grey);
    beam(rx + 0.5, 0, rz - 0.8, rx, 1.15, rz - 0.8, 0.06, M.grey);
    beam(rx, 1.15, rz + 0.1, rx, 1.15, rz - 0.9, 0.06, M.grey);
    for (let i = 0; i < 2; i++) {
      const b = box(0.83, 0.014, 0.1, M.blade, rx - 0.2, 0.95 - i * 0.22, rz - 0.4);
      b.rotation.z = 0.62; b.rotation.y = Math.PI / 2;
      box(0.1, 0.014, 0.1, M.tip, rx - 0.2 - Math.sin(0.62) * 0, 0.95 - i * 0.22, rz - 0.4);
    }
    box(0.6, 0.4, 0.4, M.orange, HX + 0.9, 0.42, HZ - 1.1);           // 工具箱
    box(0.56, 0.08, 0.36, M.dark, HX + 0.9, 0.66, HZ - 1.1);
    // 备件箱(库外)
    box(0.8, 0.5, 0.55, M.whiteDust, HX + 1.2, 0.5, HZ + 2.3);
    box(0.84, 0.06, 0.59, M.orange, HX + 1.2, 0.78, HZ + 2.3);
  }

  // ================= 2b. 充电装备(电极坪 + 功率机柜 + 缓冲柜 + 接地) =================
  // 几何来自 heli_charge_sim.py:导体带 100 mm / 绝缘缝 15 mm / 周期 230 mm;
  // 足垫触点 12 mm(必须 < 缝宽,否则单触点桥接两极短路——首版 110 mm 平足垫
  // 76.7% 短路的返工结论),每垫两点相距半周期 115 mm、腿 1/3 与 2/4 触点对正交;
  // 每触点各自二极管进母线 → 落地朝向任意、99.4% 一次接通(σ=0.25 m 着陆散布)。
  const CHG = { band: 0.10, gap: 0.015, R: 1.7 };
  const chargeBars = [];                     // 充电流光(自管材质,不进 blink/night)
  const socLeds = [];                        // 机柜 SoC 进度条
  const CBX = -5.6, CBZ = -1.5;              // 功率机柜位置(坪西缘外)
  {
    // ---- 电极坪:交替极性条带,裁进 r=1.7 圆 ----
    const yF = PAD_TOP + 0.005;
    const step = CHG.band + CHG.gap;
    const n = Math.ceil(CHG.R / step);
    for (let i = -n; i <= n; i++) {
      const xc = i * step;
      const half = Math.sqrt(Math.max(0, CHG.R * CHG.R - (Math.abs(xc) + CHG.band / 2) ** 2));
      if (half < 0.08) continue;
      const pos = ((i % 2) + 2) % 2 === 0;
      const mat = new THREE.MeshLambertMaterial({
        color: pos ? 0x9a6a3a : 0x40525f,
        emissive: pos ? 0xe0902e : 0x4fa8d8, emissiveIntensity: 0,
      });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(CHG.band, 0.007, half * 2), mat);
      bar.position.set(xc, yF, 0);
      bar.name = 'chg_bar';
      group.add(bar);
      chargeBars.push({ mat, phase: Math.abs(xc) / CHG.R });
    }
    // 汇流端子箱(两极母线在坪西缘汇合后走地槽去机柜)
    box(0.34, 0.16, 0.5, M.grey, -CHG.R - 0.28, PAD_TOP + 0.08, 0);
    box(0.30, 0.03, 0.44, M.alu, -CHG.R - 0.28, PAD_TOP + 0.17, 0);
    box(0.06, 0.05, 0.34, M.copper, -CHG.R - 0.16, PAD_TOP + 0.06, 0.06);
    box(0.06, 0.05, 0.34, M.dark, -CHG.R - 0.16, PAD_TOP + 0.06, -0.06);

    // ---- 功率机柜:朝坪面剖开,核心不做黑盒(契约 §3 剖切样板) ----
    // heli_dock_core.py 的三条结论直接写进几何:
    //  · 610 Pa 下自然对流 h=0.27 W/m²K,84.8% 的热靠辐射走 → **拆掉散热鳍**
    //    (原来那排鳍在火星是装饰),换成背面高发射率黑辐射板;
    //  · 隔离式 LLC 单级 400 V → 21.6 V,效率 97.1%(原假设 0.92 已作废);
    //  · 高压侧紫、低压侧铜,铜色与坪面正极同色 = 同色因果链。
    box(0.62, 0.20, 0.52, M.grey, CBX, 0.10, CBZ);                 // 基座
    box(0.05, 1.05, 0.44, M.white, CBX - 0.25, 0.72, CBZ);         // 背墙
    box(0.55, 1.05, 0.05, M.white, CBX, 0.72, CBZ - 0.20);         // 侧墙 ×2
    box(0.55, 1.05, 0.05, M.white, CBX, 0.72, CBZ + 0.20);
    box(0.60, 0.07, 0.49, M.grey, CBX, 1.28, CBZ);                 // 顶盖
    box(0.06, 1.05, 0.06, M.orange, CBX + 0.245, 0.72, CBZ - 0.19); // 开口面边柱 ×2
    box(0.06, 1.05, 0.06, M.orange, CBX + 0.245, 0.72, CBZ + 0.19);
    box(0.02, 0.86, 0.40, M.carbon, CBX - 0.275, 0.74, CBZ);       // 背面辐射板(ε≈0.85)
    // 层 1(上):高压侧 400 V 输入——紫色端子排 + 输入滤波 + 熔断器
    box(0.34, 0.05, 0.30, M.hv, CBX - 0.02, 1.14, CBZ);
    box(0.10, 0.09, 0.10, M.dark, CBX + 0.10, 1.14, CBZ - 0.10);
    // 层 2:隔离变压器(磁芯 + 绕组)——高压与低压之间的那道墙
    box(0.13, 0.045, 0.15, M.ferrite, CBX - 0.02, 1.035, CBZ);     // EE 磁芯上轭
    box(0.13, 0.045, 0.15, M.ferrite, CBX - 0.02, 0.905, CBZ);     // 下轭
    box(0.035, 0.09, 0.15, M.ferrite, CBX - 0.02, 0.97, CBZ);      // 中柱
    box(0.05, 0.085, 0.115, M.hv, CBX - 0.075, 0.97, CBZ);         // 原边绕组(高压侧)
    box(0.05, 0.085, 0.115, M.copper, CBX + 0.035, 0.97, CBZ);     // 副边绕组(低压侧)
    // 层 3:功率级 PCB + 开关管散热块 + 同步整流
    box(0.32, 0.012, 0.28, M.pcb, CBX - 0.02, 0.84, CBZ);
    for (let i = 0; i < 4; i++)
      box(0.03, 0.05, 0.03, M.dark, CBX - 0.12 + i * 0.07, 0.87, CBZ + 0.09);
    box(0.16, 0.06, 0.05, M.alu, CBX - 0.02, 0.88, CBZ - 0.10);    // 管夹散热块
    // 层 4:低压母排(与坪面正极同色)+ 接触器 + 分流器
    box(0.30, 0.02, 0.05, M.copper, CBX - 0.02, 0.74, CBZ - 0.06);
    box(0.30, 0.02, 0.05, M.dark, CBX - 0.02, 0.74, CBZ + 0.06);
    box(0.11, 0.10, 0.09, M.grey, CBX + 0.10, 0.68, CBZ);          // 接触器(零电流分断)
    box(0.05, 0.03, 0.05, M.orange, CBX + 0.10, 0.74, CBZ);
    // 层 5:控制板 + 绝缘监测(坪面是裸露导体,对地阻抗常测)
    box(0.30, 0.012, 0.26, M.pcb, CBX - 0.02, 0.58, CBZ);
    box(0.08, 0.05, 0.08, M.panel, CBX - 0.12, 0.61, CBZ - 0.07);
    box(0.03, 0.02, 0.03, M.camLed, CBX - 0.12, 0.645, CBZ - 0.07); // 绝缘监测指示
    box(0.30, 0.02, 0.26, M.strip, CBX - 0.02, 0.52, CBZ);          // 柜内加热片(冷启动)
    box(0.30, 0.22, 0.03, M.dark, CBX + 0.28, 0.98, CBZ);          // 屏框(朝坪)
    box(0.26, 0.18, 0.03, M.screenAmber, CBX + 0.295, 0.98, CBZ);
    for (let i = 0; i < 6; i++) {                                   // SoC 进度条 6 段
      const m = new THREE.MeshLambertMaterial({
        color: 0x25301c, emissive: 0x39e05a, emissiveIntensity: 0,
      });
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.02), m);
      led.position.set(CBX + 0.29, 0.70, CBZ - 0.15 + i * 0.06);
      group.add(led);
      socLeds.push(m);
    }
    box(0.16, 0.24, 0.02, M.orange, CBX + 0.285, 0.44, CBZ + 0.13); // 断路器手柄板
    box(0.05, 0.05, 0.05, M.dockInd, CBX + 0.29, 0.44, CBZ - 0.13); // 供电指示
    box(0.34, 0.36, 0.30, M.whiteDust, CBX, 0.30, CBZ + 0.44);      // 缓冲电池柜(200 Wh)
    box(0.36, 0.05, 0.32, M.orange, CBX, 0.50, CBZ + 0.44);
    // 埋地电缆槽:机柜 → 坪缘汇流条(盖板一段段)
    for (let i = 0; i < 6; i++)
      box(0.5, 0.035, 0.22, M.padSide, CBX + 0.55 + i * 0.52, 0.03, CBZ + i * 0.22);
    beam(CBX + 0.3, 0.12, CBZ, CBX + 0.9, 0.06, CBZ + 0.2, 0.05, M.dark);
    // 静电接地棒(尘暴带电,呼应气象站静电探针)+ 铜接地板
    cyl(0.018, 0.022, 1.15, 8, M.alu, CBX - 0.55, 0.57, CBZ - 0.35);
    box(0.16, 0.02, 0.16, M.copper, CBX - 0.55, 0.03, CBZ - 0.35);
    beam(CBX - 0.28, 0.62, CBZ - 0.18, CBX - 0.55, 0.72, CBZ - 0.35, 0.03, M.copper);
  }
  // ================= 3. 风向袋杆(气象叙事;稀薄大气袋是垂的) =================
  const SKX = 6.6, SKZ = -3.6;
  {
    cyl(0.04, 0.055, 3.4, 8, M.grey, SKX, 1.7, SKZ);
    box(0.1, 0.06, 0.1, M.dark, SKX, 3.42, SKZ);
    const pivot = new THREE.Group();
    pivot.name = 'sock_pivot';
    pivot.position.set(SKX, 3.4, SKZ);
    pivot.rotation.y = -1.1;             // 基准风向(oscillator 绕此摆)
    group.add(pivot);
    const sock = new THREE.Group();
    sock.name = 'sock_cone';
    // q=½ρv² 在火星 8 m/s 只有 0.54 Pa,吹不满 → 袋身下垂 ~42°
    sock.rotation.z = -0.73;
    pivot.add(sock);
    const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.42, 10, 1, true), M.sock);
    s1.rotation.z = Math.PI / 2; s1.position.x = 0.28; sock.add(s1);
    const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.34, 10, 1, true), M.sockW);
    s2.rotation.z = Math.PI / 2; s2.position.x = 0.66; sock.add(s2);
    const s3 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.3, 10, 1, true), M.sock);
    s3.rotation.z = Math.PI / 2; s3.position.x = 0.98; sock.add(s3);
  }

  // ================= 4. 直升机本体(停机态 = t0 姿态) =================
  const heli = new THREE.Group();
  heli.name = 'heli';
  heli.position.set(0, PAD_TOP, 0);
  group.add(heli);
  const att = new THREE.Group();        // 姿态关节(俯仰/滚转 pivot,≈重心高)
  att.name = 'heli_att';
  att.position.y = 0.55;
  heli.add(att);
  const H = (w, h, d, mat, x, y, z) => box(w, h, d, mat, x, y - 0.55, z, att); // att 局部
  {
    // ---- 机身:金色 MLI 保温盒 + 碳板上下盖 + 银包角(Ingenuity 语法) ----
    H(0.42, 0.24, 0.50, M.gold, 0, 0.46, 0);          // MLI 主体
    H(0.43, 0.05, 0.505, M.goldHi, 0, 0.52, 0);       // 金膜高光条(假反光)
    H(0.46, 0.025, 0.54, M.carbon, 0, 0.585, 0);      // 顶碳板
    H(0.46, 0.025, 0.54, M.carbon, 0, 0.335, 0);      // 底碳板
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]])
      H(0.035, 0.245, 0.035, M.silver, sx * 0.208, 0.46, sz * 0.248); // 包角压条 ×4
    // 侧散热板(银,居中小板)+ 黑肋 ×2
    for (const s of [1, -1]) {
      H(0.015, 0.13, 0.30, M.silver, s * 0.215, 0.45, 0);
      H(0.02, 0.11, 0.018, M.carbon, s * 0.222, 0.45, -0.06);
      H(0.02, 0.11, 0.018, M.carbon, s * 0.222, 0.45, 0.06);
    }
    // 前脸相机板:彩色地形相机镜筒 + 导航相机黑窗
    H(0.24, 0.15, 0.03, M.carbon, 0, 0.45, 0.26);
    cyl(0.028, 0.032, 0.05, 10, M.silver, 0.07, 0.49 - 0.55, 0.29, att)
      .rotation.x = Math.PI / 2;
    H(0.07, 0.05, 0.02, M.dark, -0.07, 0.44, 0.285);
    // 电池舱(机腹金盒)+ 激光高度计(朝下镜筒)
    H(0.28, 0.09, 0.32, M.gold, 0, 0.29, 0);
    H(0.30, 0.015, 0.34, M.carbon, 0, 0.242, 0);
    cyl(0.018, 0.022, 0.06, 8, M.carbon, -0.10, 0.30 - 0.55, 0.20, att);
    // 航行灯:左红右绿尾白 + 天线鞭(基座锥)
    H(0.05, 0.05, 0.05, M.navRed, -0.235, 0.58, 0.12);
    H(0.05, 0.05, 0.05, M.navGrn, 0.235, 0.58, 0.12);
    H(0.05, 0.05, 0.05, M.white, 0, 0.60, -0.30);
    cyl(0.01, 0.025, 0.04, 8, M.dark, 0.16, 0.615 - 0.55, -0.2, att);
    cyl(0.008, 0.008, 0.5, 6, M.dark, 0.16, 0.90 - 0.55, -0.2, att);
    // ---- 四条弹性腿:根座 + 两段折线碳管 + 足垫(带双充电触点) ----
    // 触点 12 mm < 坪面绝缘缝 15 mm(charge_sim 的硬规则),每垫两点相距半周期
    // 115 mm;腿 1/3 触点对沿机体 x、腿 2/4 沿机体 z(正交冗余,任意航向都接得上)
    let legIdx = 0;
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      H(0.05, 0.06, 0.05, M.silver, sx * 0.19, 0.40, sz * 0.21);       // 腿根座
      beam(sx * 0.19, 0.40 - 0.55, sz * 0.21, sx * 0.33, 0.14 - 0.55, sz * 0.35, 0.028, M.leg, att);
      beam(sx * 0.33, 0.14 - 0.55, sz * 0.35, sx * 0.42, 0.035 - 0.55, sz * 0.44, 0.024, M.leg, att);
      H(0.13, 0.026, 0.13, M.carbon, sx * 0.42, 0.02, sz * 0.44);      // 足垫(略放大容触点)
      const along = legIdx % 2 === 0;                                  // 触点对方向
      for (const s2 of [-1, 1]) {
        const ox = along ? s2 * 0.0575 : 0, oz = along ? 0 : s2 * 0.0575;
        H(0.014, 0.008, 0.014, M.copper, sx * 0.42 + ox, 0.004, sz * 0.44 + oz);
      }
      legIdx++;
    }
    // ---- 桅杆传动系:下电机舱 + 主杆 + 层间电机 + 变距盘 ×2(swashplate+连杆) ----
    cyl(0.05, 0.058, 0.14, 12, M.carbon, 0, 0.655 - 0.55, 0, att);     // 下电机舱鼓包
    cyl(0.035, 0.045, 0.55, 10, M.grey, 0, 0.85 - 0.55, 0, att);       // 主杆
    cyl(0.048, 0.048, 0.055, 12, M.carbon, 0, 0.96 - 0.55, 0, att);    // 层间电机
    const swash = (y, yHub) => {                                       // 变距盘 + 3 连杆
      cyl(0.075, 0.075, 0.018, 12, M.silver, 0, y - 0.55, 0, att);
      for (let k = 0; k < 3; k++) {
        const a = k * Math.PI * 2 / 3 + 0.5;
        beam(Math.cos(a) * 0.068, y - 0.55, Math.sin(a) * 0.068,
             Math.cos(a) * 0.045, yHub - 0.55, Math.sin(a) * 0.045, 0.012, M.dark, att);
      }
    };
    swash(0.84, 0.885);            // 下旋翼变距盘(盘→毂下缘)
    swash(1.10, 1.055);            // 上旋翼变距盘(桅顶倒挂→毂上缘)
    // ---- 共轴双旋翼(pivot Group 名字给 spinners/animate 用) ----
    // 桨叶三段:根/主/尖,锥度+扭转(根 11.5°→尖 5°)+ 上反 3°,尖段橙
    const mkRotor = (name, y, pitchSign) => {
      const r = new THREE.Group();
      r.name = name; r.position.set(0, y - 0.55, 0);
      att.add(r);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.06, 12), M.dark);
      r.add(hub);
      for (const side of [1, -1]) {
        const bg = new THREE.Group();                  // 叶组:上反锥角
        if (side < 0) bg.rotation.y = Math.PI;
        bg.rotation.z = 0.05;
        r.add(bg);
        const seg = (len, th, ch, x, pitch, mat) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(len, th, ch), mat);
          m.position.x = x; m.rotation.x = pitchSign * pitch;
          bg.add(m);
          return m;
        };
        seg(0.30, 0.014, 0.13, 0.215, 0.20, M.blade);  // 根段:宽弦大桨距
        seg(0.42, 0.011, 0.105, 0.51, 0.13, M.blade);  // 主段
        seg(0.15, 0.009, 0.082, 0.79, 0.09, M.tip);    // 尖段(橙,细弦小桨距)
        // 变距摇臂(根部小块)
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.055), M.silver);
        arm.position.set(0.085, -0.01 * pitchSign, 0.02);
        bg.add(arm);
      }
      return r;
    };
    mkRotor('rotor_upper', 1.02, 1);
    mkRotor('rotor_lower', 0.90, -1).rotation.y = Math.PI / 2;  // 初相错 90° 更可读
    // ---- 太阳能顶板:电池板 + 背肋 + 中央鼓包 + 下机身线束 ----
    cyl(0.02, 0.02, 0.1, 6, M.grey, 0, 1.12 - 0.55, 0, att);
    H(0.62, 0.02, 0.5, M.solar, 0, 1.18, 0);
    H(0.66, 0.015, 0.54, M.grey, 0, 1.17, 0);
    H(0.55, 0.016, 0.035, M.silver, 0, 1.158, -0.12);
    H(0.55, 0.016, 0.035, M.silver, 0, 1.158, 0.12);
    cyl(0.04, 0.045, 0.03, 10, M.carbon, 0, 1.15 - 0.55, 0, att);
    beam(0.10, 1.155 - 0.55, 0.05, 0.17, 0.90 - 0.55, 0.03, 0.016, M.carbon, att);
    beam(0.17, 0.90 - 0.55, 0.03, 0.14, 0.60 - 0.55, -0.04, 0.016, M.carbon, att);
    // 相机云台(机腹前,gimbal_pan 关节 = oscillator 慢扫)
    const gim = new THREE.Group();
    gim.name = 'gimbal_pan';
    gim.position.set(0, 0.24 - 0.55, 0.22);
    att.add(gim);
    const gball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), M.dark);
    gim.add(gball);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.05, 10), M.panel);
    lens.rotation.x = 1.2; lens.position.set(0, -0.03, 0.05);
    gim.add(lens);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.02), M.camLed);
    led.position.set(0.05, 0, 0.02);
    gim.add(led);
    // §4c 导航相机:引擎回填像素;无通道时 animate 内退回纯 t 脉冲
    const navCam = new THREE.PerspectiveCamera(62, 1, 0.05, 400);
    navCam.rotation.x = -1.22;          // 朝下偏前
    gim.add(navCam);
    group.userData.sensors = [{ id: 'nav', camera: navCam, width: 64, height: 64, hz: 2 }];
  }

  // 旋翼下洗尘环(起降低高度时可见;火星旋翼扬尘是 Ingenuity 实测现象)
  const dustFx = new THREE.Mesh(new THREE.RingGeometry(1.0, 3.1, 32), M.dustFx);
  dustFx.rotation.x = -Math.PI / 2;
  dustFx.position.y = PAD_TOP + 0.04;
  group.add(dustFx);

  // ================= 5. 作业痕迹:车辙 + 砾石 =================
  {
    box(0.5, 0.02, 5.2, M.padSide, -4.6, 0.03, 2.4).rotation.y = 0.5;
    box(0.5, 0.02, 5.2, M.padSide, -5.4, 0.03, 1.6).rotation.y = 0.5;
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);   // 顶点半径 φ≈1.618!
    for (let i = 0; i < 12; i++) {
      const a = rnd() * 6.283, d = PAD_R + 1.6 + rnd() * 1.6, s = 0.08 + rnd() * 0.1;
      const rock = new THREE.Mesh(rockGeo, rnd() < 0.5 ? M.padSide : M.apron);
      rock.position.set(Math.cos(a) * d, 1.3 * 0.6 * s, Math.sin(a) * d);
      rock.scale.set(s, 0.6 * s, s);
      rock.rotation.y = rnd() * 6.28;                       // 只绕 Y(坑账 3)
      group.add(rock);
    }
  }

  // ================= POI 锚点(卡片在 info.json) =================
  poi('poi_heli', 0, 1.3, 0);
  poi('poi_rotor', 0, 2.3, 0);
  poi('poi_pad', 3.2, 0.6, 3.2);
  poi('poi_dock', HX + 3.0, 1.2, HZ - 0.6);
  poi('poi_charge', CBX + 0.5, 1.0, CBZ);
  poi('poi_electrode', 1.1, 0.35, 1.1);
  poi('poi_windsock', SKX, 3.2, SKZ);
  poi('poi_route', 4.6, 0.8, -4.6);

  // ================= 声明式运动 =================
  group.userData.spinners = [                       // 共轴反转(声明层/降级通道)
    { node: 'rotor_upper', axis: 'y', rpm: 240 },   // 真实 1698 rpm,展示 ÷7.1
    { node: 'rotor_lower', axis: 'y', rpm: -240 },
  ];
  group.userData.oscillators = [
    { node: 'gimbal_pan', axis: 'y', amp: 0.55, period: 9 },          // 云台慢扫
    { node: 'sock_pivot', axis: 'y', amp: 0.35, period: 6.5, phase: 1.7 },
    { node: 'sock_cone', axis: 'z', amp: 0.05, period: 1.8, phase: 0.4 }, // 袋口颤动
  ];
  group.userData.blinkMats = [M.blinkRed];
  group.userData.nightMats = [M.screen, M.dockInd, M.strip, M.navRed, M.navGrn];
  group.userData.lights = [{ color: 0xffd9a0, pos: [HX + 0.6, 2.2, HZ], range: 9 }];

  // ================= 烘焙飞行回路(纯 t,任意 t 跳入成立) =================
  // 局部坐标:坪心 (0,0);巡检圆心 = res-mine-01 实测包围盒中心(世界 (174.5,-114.6)
  // − 本资产 (150,-40) = (24.5,-74.6)),半径 73 m = 矿区 bbox 角点 52.9 m + 侧向避让
  // 20 m(城内实测,2026-08)。巡航高 32 m:航线地形最高 48.7 m(@131,-162),坪基
  // 40.7 m → 巡航绝对 72.7 m,高出地形最高点 24 m(≥15 m 达标)。manifest 必须
  // rotation_deg=0(航线按世界坐标差烘焙)。
  const FL = (() => {
    const T = 80, ALT = 32, Y0 = PAD_TOP;
    const Mx = 24.5, Mz = -74.6, Rc = 73;
    const d = Math.hypot(Mx, Mz);                       // 85.44
    const phiMP = Math.atan2(-Mz, -Mx);                 // M→P 方向角
    const thT = Math.acos(Rc / d);
    const phi1 = phiMP + thT, arc = 2 * Math.PI - 2 * thT;
    const Ltan = Math.sqrt(d * d - Rc * Rc);            // 55.45
    const Larc = Rc * arc;                              // 316.7
    const S = 2 * Ltan + Larc;                          // 427.6
    const vC = S / 39;                                  // 10.96 m/s(≈设计巡航 12)
    const E1x = Mx + Rc * Math.cos(phi1), E1z = Mz + Rc * Math.sin(phi1);
    const d1x = E1x / Ltan, d1z = E1z / Ltan;           // P=(0,0) → dir1 = E1/|E1|
    const phi2 = phi1 + arc;
    const E2x = Mx + Rc * Math.cos(phi2), E2z = Mz + Rc * Math.sin(phi2);
    const d3x = -E2x / Ltan, d3z = -E2z / Ltan;
    const yawOut = -phi1, yawIn = -phi2;                // 航向 = −φ(切线连续)
    const yawPark = Math.round(yawIn / (2 * Math.PI)) * 2 * Math.PI; // 最近的 0 (mod 2π)
    return { T, ALT, Y0, Mx, Mz, Rc, phi1, arc, Ltan, Larc, S, vC,
             d1x, d1z, d3x, d3z, E2x, E2z, yawOut, yawIn, yawPark };
  })();

  const ss = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
  const s5 = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * u * (u * (u * 6 - 15) + 10); };
  // 巡航沿程 s(t):梯形速度,7 s smoothstep 匀加减(17–24 加速 / 24–56 匀速 / 56–63 减速)
  const arcLen = (t) => {
    const v = FL.vC;
    if (t <= 17) return 0;
    if (t < 24) { const u = (t - 17) / 7; return v * 7 * (u * u * u - 0.5 * u * u * u * u); }
    if (t < 56) return v * 3.5 + v * (t - 24);
    if (t < 63) { const u = (t - 56) / 7; return v * 3.5 + v * 32 + v * 7 * (u - u * u * u + 0.5 * u * u * u * u); }
    return FL.S;
  };
  const speed = (t) => {
    const v = FL.vC;
    if (t < 17 || t >= 63) return 0;
    if (t < 24) return v * ss((t - 17) / 7);
    if (t < 56) return v;
    return v * (1 - ss((t - 56) / 7));
  };
  const accel = (t) => {                                // 解析加速度(俯仰用)
    const v = FL.vC;
    if (t >= 17 && t < 24) { const u = (t - 17) / 7; return v * 6 * u * (1 - u) / 7; }
    if (t >= 56 && t < 63) { const u = (t - 56) / 7; return -v * 6 * u * (1 - u) / 7; }
    return 0;
  };
  // 旋翼总角 Θ(t) 闭式:起转抛物线(3–9)→ 匀速(9–71)→ 停转抛物线(71–75.5)
  // 全循环 4 rev/s × (3+62+2.25) s = 269 整圈 → 首尾无缝
  const OMEGA = 240 / 60 * 2 * Math.PI;                 // 展示角速度 rad/s
  const rotorTheta = (t) => {
    if (t < 3) return 0;
    if (t < 9) { const x = t - 3; return OMEGA * x * x / 12; }
    if (t < 71) return OMEGA * 3 + OMEGA * (t - 9);
    if (t < 75.5) { const x = t - 71; return OMEGA * 65 + OMEGA * (x - x * x / 9); }
    return OMEGA * 65 + OMEGA * 2.25;
  };
  const rotorOmega = (t) => {
    if (t < 3 || t >= 75.5) return 0;
    if (t < 9) return OMEGA * (t - 3) / 6;
    if (t < 71) return OMEGA;
    return OMEGA * (1 - (t - 71) / 4.5);
  };

  const rotU = att.getObjectByName('rotor_upper');
  const rotD = att.getObjectByName('rotor_lower');

  // 拍摄相位钩子:外部(如 capture_gif --eval)置 off 使 tt 对齐循环起点;默认 0
  group.userData.heliPhase = { off: 0 };
  group.userData.animate = (t) => {
    const tt = (t + group.userData.heliPhase.off) % FL.T;
    // ---- 旋翼(绝对赋值,覆盖引擎 spinner 增量 → 起停可见且确定性成立) ----
    const th = rotorTheta(tt);
    rotU.rotation.y = th;
    rotD.rotation.y = Math.PI / 2 - th;
    // ---- 位置 / 航向 ----
    let x = 0, z = 0, y = FL.Y0, yaw = 0;
    if (tt < 9) {                                       // 停机 + 起转
      yaw = 0;
    } else if (tt < 17) {                               // 垂直爬升 + 转向出航
      y = FL.Y0 + (FL.ALT - FL.Y0) * s5((tt - 9) / 8);
      yaw = FL.yawOut * ss((tt - 11) / 5);
    } else if (tt < 63) {                               // 巡航:切线→全圆→切线
      const s = arcLen(tt);
      y = FL.ALT;
      if (s < FL.Ltan) {
        x = FL.d1x * s; z = FL.d1z * s; yaw = FL.yawOut;
      } else if (s < FL.Ltan + FL.Larc) {
        const phi = FL.phi1 + (s - FL.Ltan) / FL.Rc;
        x = FL.Mx + FL.Rc * Math.cos(phi); z = FL.Mz + FL.Rc * Math.sin(phi);
        yaw = -phi;
      } else {
        const q = s - FL.Ltan - FL.Larc;
        x = FL.E2x + FL.d3x * q; z = FL.E2z + FL.d3z * q; yaw = FL.yawIn;
      }
    } else if (tt < 71) {                               // 消速下降 + 回位停机航向
      y = FL.Y0 + (FL.ALT - FL.Y0) * (1 - s5((tt - 63) / 8));
      yaw = FL.yawIn + (FL.yawPark - FL.yawIn) * ss((tt - 63.5) / 5.5);
    } else {                                            // 着陆:弹性腿蹲一下
      yaw = FL.yawPark;
      if (tt < 72.5) y = FL.Y0 - 0.03 * Math.sin(Math.PI * (tt - 71) / 1.5);
    }
    heli.position.set(x, y, z);
    heli.rotation.y = yaw;
    // ---- 姿态:加减速俯仰 + 圆弧压坡(trim 仿真锚定,heli_trim_sim.py) ----
    // 巡航配平 0.9°≈0.016 rad 按物理值展示;加速倾角物理值 atan(a/g)=32°@2.35m/s²,
    // 展示压到 ~14°(0.10·a)——展示约定,与旋翼 ÷7.1 同类,卡里写双数
    att.rotation.x = 0.10 * accel(tt) + 0.016 * speed(tt) / FL.vC;
    const s = arcLen(tt);
    const rIn = ss((s - FL.Ltan) / 22), rOut = ss((FL.Ltan + FL.Larc - s) / 22);
    att.rotation.z = -0.28 * Math.min(rIn, rOut);       // 入弯压坡(CCW 弧 → 右倾)
    // ---- 下洗尘环:旋翼转速 × 低高度 ----
    const lowF = Math.max(0, 1 - (y - FL.Y0) / 6);
    M.dustFx.opacity = 0.32 * (rotorOmega(tt) / OMEGA) * lowF;
    dustFx.rotation.z = tt * 0.9;
    dustFx.position.x = x; dustFx.position.z = z;       // 跟机(仅低空可见)
    // ---- 充电:着陆后到下次起转前的停机窗(跨循环边界,11 s 代表 138 min 周转) ----
    // 时序来自 heli_charge_sim.py:先 20 W 预热 23 min(最冷芯判据)再 C/2 充 65 min
    // + CV 收尾 51 min;展示层压缩成一段连续的流光 + 6 段 SoC 条。
    const cw = tt >= 71.5 ? (tt - 71.5) / 11 : (tt < 2.5 ? (8.5 + tt) / 11 : -1);
    const heating = cw >= 0 && cw < 0.17;             // 预热段:只有母线待机微亮
    for (const b of chargeBars) {
      b.mat.emissiveIntensity = cw < 0 ? 0
        : heating ? 0.12
        : 0.35 + 0.45 * Math.max(0, Math.sin((cw * 6 - b.phase * 2.2) * Math.PI * 2));
    }
    for (let i = 0; i < socLeds.length; i++)
      socLeds[i].emissiveIntensity = cw < 0 ? 0 : (cw > (i + 0.5) / socLeds.length ? 1.5 : 0.05);
    M.screenAmber.emissiveIntensity = cw < 0 ? 0.35 : 0.9 + 0.35 * Math.sin(tt * 3.1);
    // ---- §4c 感知消费:导航相机亮度 → 云台状态灯;无通道退回纯 t 脉冲 ----
    const sen = group.userData.sensors[0];
    if (sen && sen.frame > 0 && sen.data) {
      let sum = 0, n = 0;
      for (let i = 0; i < sen.data.length; i += 256) { sum += sen.data[i]; n++; }
      const b = sum / Math.max(1, n) / 255;
      M.camLed.emissiveIntensity = 0.4 + 1.6 * b;
      group.userData.navBrightness = b;                 // 验证/叙事探针
    } else {
      M.camLed.emissiveIntensity = 0.6 + 0.4 * Math.sin(tt * 2.1);
    }
  };

  // ---- 尘膜 pass ----
  const dust = new THREE.Color(0x9e5b3d);
  [M.white, M.whiteDust, M.grey, M.orange, M.alu, M.panel, M.padSide, M.apron]
    .forEach((m) => m.color.lerp(dust, 0.05));
  [M.gold, M.silver].forEach((m) => m.color.lerp(dust, 0.03)); // 金属件轻蒙

  return group;
}
