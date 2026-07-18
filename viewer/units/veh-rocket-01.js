// veh-rocket-01 —— 星舰(着陆状态,仅上面级)— 代码资产,MODELS.md §4 契约。
// 真实米制:Ø9 m 筒体,全高 ~50 m;原点 = 基座中心地面点(着陆腿底贴 y=0),
// +Y 向上,正面(舷窗/舱门/QD 板)朝 +Z,防热瓦面朝 -Z(向风面)。
// THREE 由查看器注入,不 import;纯几何 + 材质,无外部资源。
//
// 动画接口(引擎侧可按需接线):
//   - 命名子组 'engines':全部 6 台猛禽;'flap-fore-l/r'、'flap-aft-l/r':
//     翼面铰点 Group,原点在铰线上,旋转即收放。
//   - userData.flames = [{ pos:[x,y,z], r, type:'sl'|'rvac' }] —— 每台引擎
//     喷管出口(资产本地坐标),供发射羽流特效挂点。与 beams 一样属
//     "契约存在、引擎渲染未实装"的规划接口,不依赖也不报错。

export const meta = {
  id: 'veh-rocket-01',
  name: '星舰(着陆状态)',
  name_en: 'Starship (landed)',
  size_m: 50, size_axis: 'height',   // 自检用,引擎不缩放
  effects: ['glow_windows'],
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = 'veh-rocket-01';
  const nightMats = [];

  // ---------------------------------------------------------------- 材质
  // 注:场景无环境贴图,高 metalness 反射不到东西会整体发黑,
  // 故不用交接文档建议的 0.7,降到 0.35 让基色主导(实测对比后定值)
  const steel = new THREE.MeshStandardMaterial({ color: 0xe3e6e8, metalness: 0.35, roughness: 0.4 });
  const steelDark = new THREE.MeshStandardMaterial({ color: 0xb2b7ba, metalness: 0.35, roughness: 0.45 });
  const seam = new THREE.MeshStandardMaterial({ color: 0x9da2a5, metalness: 0.35, roughness: 0.5 });
  const tile = new THREE.MeshStandardMaterial({ color: 0x24282c, metalness: 0.2, roughness: 0.85, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: 0x26292d, metalness: 0.4, roughness: 0.7 });
  const copper = new THREE.MeshStandardMaterial({ color: 0x8a5a34, metalness: 0.5, roughness: 0.5 });
  // 夜光:舷窗带 + 发动机舱指示灯 + QD 状态灯(白天灭,引擎随夜色拉 emissiveIntensity)
  const glowWin = new THREE.MeshStandardMaterial({ color: 0x0e1a2a, emissive: 0xffd9a0, emissiveIntensity: 0.0 });
  const glowInd = new THREE.MeshStandardMaterial({ color: 0x1c1206, emissive: 0xffb347, emissiveIntensity: 0.0 });
  const glowStat = new THREE.MeshStandardMaterial({ color: 0x061a0c, emissive: 0x5aff9a, emissiveIntensity: 0.0 });
  nightMats.push(glowWin, glowInd, glowStat);

  const UP = new THREE.Vector3(0, 1, 0);
  const radial = (phi) => new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi));

  // ---------------------------------------------------------------- 船体(旋成体:筒段 + 尖拱鼻锥,细分轮廓)
  const BASE = 1.2;   // 裙底高度(着陆腿把船体撑离地面)
  // 船体半径函数(筒段 4.5,32 m 起尖拱收口)——翼面/舷窗定位也用它
  function hullR(y) {
    if (y <= 32) return 4.5;
    const t = (y - 32) / 18;                       // 0..1
    return 4.5 * Math.sqrt(Math.max(0, 1 - t * t)) * (1 - 0.08 * t) + 0.02;
  }
  // 蒙皮独立成组:隐藏/剖切 'hull-shell' 即可露出 'interior'(剖视模式用)
  const shell = new THREE.Group();
  shell.name = 'hull-shell';
  g.add(shell);
  const profile = [new THREE.Vector2(4.5, BASE)];
  for (let y = 32; y <= 49.8; y += 1.1) profile.push(new THREE.Vector2(hullR(y), y));
  profile.push(new THREE.Vector2(0.03, 50));
  shell.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 48), steel));
  // 防热瓦半壳(向风面,-Z 半周),同轮廓放大 1.4%
  const tilePts = profile.map((p) => new THREE.Vector2(p.x * 1.014 + 0.005, p.y));
  shell.add(new THREE.Mesh(new THREE.LatheGeometry(tilePts, 28, Math.PI / 2, Math.PI), tile));
  // 环焊缝:真实 1.8 m 环段(筒段范围)
  for (let wy = BASE + 2.4; wy < 32; wy += 1.8) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(4.512, 4.512, 0.07, 48, 1, true), seam);
    ring.position.y = wy;
    shell.add(ring);
  }
  // 鼻锥帽(略深色)
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.52, 1.3, 20), steelDark);
  cap.position.y = 49.32;
  shell.add(cap);
  // 发动机舱封板
  const bay = new THREE.Mesh(new THREE.CylinderGeometry(4.42, 4.42, 0.25, 32), dark);
  bay.position.y = BASE + 0.3;
  shell.add(bay);
  // 裙部排气/泄压口一圈(避开 +Z 电缆槽)
  for (let i = 0; i < 8; i++) {
    const a = (i + 0.5) / 8 * Math.PI * 2 + 0.2;
    if (Math.abs(Math.sin(a / 2)) < 0.18) continue;
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.12), dark);
    v.position.copy(radial(a)).multiplyScalar(4.47).setY(2.5);
    v.rotation.y = a;
    g.add(v);
  }

  // ---------------------------------------------------------------- 筒身外设:电缆槽、QD 脱插区、状态灯
  const RW = 0.28;                                                     // 电缆槽方位(偏离 QD 区 16°)
  const raceway = new THREE.Mesh(new THREE.BoxGeometry(0.55, 30.2, 0.4), dark);
  raceway.position.copy(radial(RW)).multiplyScalar(4.56).setY(BASE + 15.4);
  raceway.rotation.y = RW; g.add(raceway);                             // 主电缆槽(贯穿筒段)
  const rwCap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.34), dark);
  rwCap.position.copy(radial(RW)).multiplyScalar(4.44).setY(32.15);
  rwCap.rotation.set(-0.25, RW, 0); g.add(rwCap);                      // 槽顶收口斜块
  const qdPanel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.25), dark);
  qdPanel.position.set(0, 5, 4.42); g.add(qdPanel);                    // QD 凹板
  for (const sx of [-0.55, 0.55]) {                                    // 双脐带接口板(CH4/LOX+电气)
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.95, 0.3), steelDark);
    plate.position.set(sx, 4.75, 4.5); g.add(plate);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.6, 8), copper);
    pipe.position.set(sx, 3.2, 4.45); g.add(pipe);                     // 接口下行管线到裙部
  }
  const stat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.12), glowStat);
  stat.position.set(1.55, 6.2, 4.44); stat.rotation.y = 0.34; g.add(stat);   // QD 状态灯(绿)
  const ind = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.26, 0.14), glowInd);
  ind.position.set(0, 2.3, 4.48); g.add(ind);                          // 发动机舱指示灯(琥珀)

  // ---------------------------------------------------------------- 气动翼面(铰点 Group,可做收放动画)
  // ExtrudeGeometry 截面立在 x-y 平面(x=展向外,y=竖直),只做 rotation.y 转向
  function flap(name, rootY, rootLen, tipLen, span, phi, droop) {
    const hingeR = hullR(rootY + rootLen / 2) * 0.97;
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.copy(radial(phi)).multiplyScalar(hingeR).setY(rootY);
    pivot.rotateY(phi - Math.PI / 2);   // 展向对准径向朝外
    pivot.rotateZ(-droop);              // 着陆姿态微下垂(动画:绕本地 Z 收放)
    g.add(pivot);
    const inset = (rootLen - tipLen) / 2;
    const s = new THREE.Shape();        // 翼尖带倒角的梯形
    s.moveTo(0, 0);
    s.lineTo(span - 0.55, inset);
    s.lineTo(span, inset + 0.9);
    s.lineTo(span, inset + tipLen - 0.7);
    s.lineTo(span - 0.75, inset + tipLen + 0.35);
    s.lineTo(0, rootLen);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.45, bevelEnabled: false });
    geo.translate(0, 0, -0.225);
    pivot.add(new THREE.Mesh(geo, tile));
    // 铰线整流罩(贴船体,不随翼面转)
    const fair = new THREE.Mesh(new THREE.BoxGeometry(0.6, rootLen + 0.7, 0.75), tile);
    fair.position.copy(radial(phi)).multiplyScalar(hingeR + 0.08).setY(rootY + rootLen / 2);
    fair.rotation.y = phi - Math.PI / 2;
    g.add(fair);
    return pivot;
  }
  const WIND = Math.PI;                 // 向风面中心 -Z
  flap('flap-aft-l', 2.2, 8.6, 4.8, 3.6, WIND + 0.96, 0.16);
  flap('flap-aft-r', 2.2, 8.6, 4.8, 3.6, WIND - 0.96, 0.16);
  flap('flap-fore-l', 38.5, 6.0, 3.2, 2.6, WIND + 0.96, 0.12);
  flap('flap-fore-r', 38.5, 6.0, 3.2, 2.6, WIND - 0.96, 0.12);

  // ---------------------------------------------------------------- 发动机组:猛禽 ×6(海平面×3 + 真空版×3)
  // 每台 = 万向节 + 铜色再生冷却燃烧室 + 双涡轮泵(斜挂,带预燃器管路)+
  // 钟形喷管(flatShading 表达冷却槽棱线,出口加强环 + 环带)。
  // 海平面版带 2 根橙色万向节作动器拉回承力锥;真空版固定,3 根撑杆斜拉裙部内壁。
  // 单台命名 'raptor-sl' / 'raptor-vac',羽流挂点进 userData.flames。
  const engines = new THREE.Group();
  engines.name = 'engines';
  g.add(engines);
  const flames = [];
  {
    // 发动机舱常年处在裙部阴影里,同内构一样加微自发光保证可读
    const chamberM = new THREE.MeshStandardMaterial({ color: 0xa8683a, emissive: 0xa8683a, emissiveIntensity: 0.18, metalness: 0.55, roughness: 0.4 });
    const bellSLM = new THREE.MeshStandardMaterial({ color: 0x4a4036, emissive: 0x4a4036, emissiveIntensity: 0.1, metalness: 0.6, roughness: 0.45, flatShading: true, side: THREE.DoubleSide });
    const bellVacM = new THREE.MeshStandardMaterial({ color: 0x41454c, emissive: 0x41454c, emissiveIntensity: 0.1, metalness: 0.6, roughness: 0.5, flatShading: true, side: THREE.DoubleSide });
    const pumpM = new THREE.MeshStandardMaterial({ color: 0x94999e, emissive: 0x94999e, emissiveIntensity: 0.15, metalness: 0.5, roughness: 0.45 });
    const actM = new THREE.MeshStandardMaterial({ color: 0xd97a35, emissive: 0xd97a35, emissiveIntensity: 0.2, metalness: 0.4, roughness: 0.5 });
    const ringM = new THREE.MeshStandardMaterial({ color: 0x2b2e33, emissive: 0x2b2e33, emissiveIntensity: 0.12, metalness: 0.5, roughness: 0.5 });
    // 共享几何(3+3 台复用)
    const bellShape = (throat, exitR, len, seg) => {
      const pts = [];
      for (let k = 0; k <= 7; k++) {
        const t = k / 7;
        pts.push(new THREE.Vector2(throat + (exitR - throat) * Math.pow(t, 0.6), -len * t));
      }
      return new THREE.LatheGeometry(pts, seg);
    };
    const bellR = (throat, exitR, t) => throat + (exitR - throat) * Math.pow(t, 0.6);
    const slBellGeo = bellShape(0.15, 0.6, 1.15, 22);
    const vacBellGeo = bellShape(0.2, 1.05, 2.0, 26);
    const chamberGeo = new THREE.CylinderGeometry(0.27, 0.19, 0.55, 14);
    const gimbalGeo = new THREE.BoxGeometry(0.34, 0.24, 0.34);
    const pumpGeo = new THREE.CylinderGeometry(0.155, 0.155, 0.62, 10);
    const capGeo = new THREE.SphereGeometry(0.155, 10, 8);
    const epipe = (parent, x1, y1, z1, x2, y2, z2, r, m) => {
      const a = new THREE.Vector3(x1, y1, z1), d = new THREE.Vector3(x2, y2, z2).sub(a);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), m);
      p.position.copy(a).addScaledVector(d, 0.5);
      p.quaternion.setFromUnitVectors(UP, d.clone().normalize());
      parent.add(p);
    };
    const etorus = (parent, r, tube, m, y) => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, 18), m);
      t.rotation.x = Math.PI / 2; t.position.y = y; parent.add(t);
    };
    function raptor(phi, ringR, vac) {
      const x = Math.sin(phi) * ringR, z = Math.cos(phi) * ringR;
      const topY = vac ? 3.05 : 2.3;
      const eg = new THREE.Group();
      eg.name = vac ? 'raptor-vac' : 'raptor-sl';
      eg.position.set(x, topY, z);
      eg.rotation.y = phi;                                 // 泵组统一朝径向,姿态有变化
      engines.add(eg);
      const gim = new THREE.Mesh(gimbalGeo, pumpM);
      gim.position.y = -0.08; eg.add(gim);                 // 万向节块
      const ch = new THREE.Mesh(chamberGeo, chamberM);
      ch.position.y = -0.44; eg.add(ch);                   // 燃烧室(铜)
      for (const s of [-1, 1]) {                           // 双涡轮泵 + 端部球盖 + 预燃器管
        const pump = new THREE.Mesh(pumpGeo, pumpM);
        pump.position.set(s * 0.3, -0.38, 0.08);
        pump.rotation.z = s * 0.5;
        eg.add(pump);
        const capMesh = new THREE.Mesh(capGeo, pumpM);
        capMesh.position.set(s * 0.44, -0.66, 0.08);
        eg.add(capMesh);
        epipe(eg, s * 0.32, -0.18, 0.08, 0, -0.12, 0, 0.05, chamberM);
        epipe(eg, s * 0.42, -0.62, 0.08, s * 0.12, -0.76, 0, 0.05, pumpM);
      }
      const bell = new THREE.Mesh(vac ? vacBellGeo : slBellGeo, vac ? bellVacM : bellSLM);
      bell.position.y = -0.72; eg.add(bell);               // 钟形喷管
      const throat = vac ? 0.2 : 0.15, exitR = vac ? 1.05 : 0.6, len = vac ? 2.0 : 1.15;
      etorus(eg, exitR + 0.01, 0.035, ringM, -0.72 - len); // 出口加强环
      for (const t of (vac ? [0.35, 0.62, 0.86] : [0.5, 0.8]))
        etorus(eg, bellR(throat, exitR, t) + 0.015, 0.03, ringM, -0.72 - len * t);
      if (vac) {                                           // 固定安装撑杆 ×3 → 裙部内壁
        for (const da of [-0.5, 0, 0.5])
          epipe(engines, x + Math.sin(phi + da) * 0.5, 2.2, z + Math.cos(phi + da) * 0.5,
            Math.sin(phi + da * 0.6) * 4.35, 2.85, Math.cos(phi + da * 0.6) * 4.35, 0.06, pumpM);
      } else {                                             // 万向节作动器 ×2(橙)→ 承力锥
        for (const da of [-0.6, 0.6])
          epipe(engines, x + Math.sin(phi + da) * 0.26, 1.95, z + Math.cos(phi + da) * 0.26,
            Math.sin(phi + da) * 1.85, 2.75, Math.cos(phi + da) * 1.85, 0.06, actM);
      }
      const exitY = topY - 0.72 - len;
      flames.push({ pos: [x, +exitY.toFixed(2), z], r: exitR, type: vac ? 'rvac' : 'sl' });
    }
    for (let i = 0; i < 3; i++) {
      raptor((i / 3) * Math.PI * 2, 1.15, false);
      raptor((i / 3) * Math.PI * 2 + Math.PI / 3, 2.75, true);
    }
  }

  // ---------------------------------------------------------------- 着陆腿 ×6(主撑+副撑+脚垫+裙部收放铰整流罩)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const dir = radial(a);
    const from = dir.clone().multiplyScalar(4.15).setY(4.6);
    const to = dir.clone().multiplyScalar(5.9).setY(0.35);
    const legDir = to.clone().sub(from);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1, 0.42), steelDark);
    leg.scale.y = legDir.length();
    leg.position.copy(from).addScaledVector(legDir, 0.5);
    leg.quaternion.setFromUnitVectors(UP, legDir.clone().normalize());
    g.add(leg);
    const bFrom = dir.clone().multiplyScalar(4.3).setY(2.0);
    const bDir = dir.clone().multiplyScalar(5.3).setY(1.15).sub(bFrom);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), steelDark);
    brace.scale.y = bDir.length();
    brace.position.copy(bFrom).addScaledVector(bDir, 0.5);
    brace.quaternion.setFromUnitVectors(UP, bDir.clone().normalize());
    g.add(brace);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.26, 12), dark);
    foot.position.copy(dir).multiplyScalar(5.9).setY(0.13);
    g.add(foot);
    const fair = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.0, 0.5), steelDark);   // 收放铰整流罩
    fair.position.copy(dir).multiplyScalar(4.38).setY(5.9);
    fair.rotation.y = a;
    g.add(fair);
  }

  // ---------------------------------------------------------------- 鼻锥细部:舷窗带、观景窗、舱门、吊装点、头罐排气
  for (const phi of [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75]) {         // 舷窗带 ×6(+Z 弧面)
    const r = hullR(40.5) + 0.06;
    const win = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 12), glowWin);
    win.position.copy(radial(phi)).multiplyScalar(r).setY(40.5);
    win.quaternion.setFromUnitVectors(UP, radial(phi));
    g.add(win);
  }
  const cupola = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.95, 0.3), glowWin);     // 观景舷窗(舷窗带上方)
  cupola.position.set(0, 42.6, hullR(42.6) + 0.02);
  cupola.rotation.x = 0.12;
  g.add(cupola);
  const hatchFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.18), steelDark);
  hatchFrame.position.set(0, 36.8, hullR(36.8) + 0.02); g.add(hatchFrame);
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.24), dark);
  hatch.position.set(0, 36.8, hullR(36.8) + 0.06); g.add(hatch);       // 乘员舱门(带框)
  for (const s of [-1, 1]) {                                           // 吊装点 ×2
    const lug = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.32), dark);
    lug.position.copy(radial(s * 0.55)).multiplyScalar(hullR(46) + 0.08).setY(46);
    g.add(lug);
  }
  for (const s of [-1, 1]) {                                           // 头罐排气口 + 挡板
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 8), steelDark);
    vent.position.set(s * 0.5, 48.9, 0.6); g.add(vent);
    const def = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.4), steelDark);
    def.position.set(s * 0.5, 49.3, 0.62); g.add(def);
  }

  // ---------------------------------------------------------------- 内部结构('interior' 命名组;平时被蒙皮罩住,
  // 剖视/入舱模式隐藏或剖切 'hull-shell' 即可见。布局对齐真实星舰:
  // 推力结构→LOX 主罐→共底→CH4 主罐(中轴下输管)→仪器段→乘员四层甲板→鼻锥头罐)
  const interior = new THREE.Group();
  interior.name = 'interior';
  g.add(interior);
  {
    // 内构材质带恒定微自发光:蒙皮封闭时不可见,剖视时不至于陷在阴影里
    const im = (hex, e = 0.22, rough = 0.6, metal = 0.25) => new THREE.MeshStandardMaterial({
      color: hex, emissive: hex, emissiveIntensity: e, metalness: metal, roughness: rough,
    });
    const inner = im(0xd6dadd);
    const loxM = im(0x8fb4d6, 0.18);
    const ch4M = im(0xa5c2ab, 0.18);
    const deckM = im(0xc2c6c9);
    const equip = im(0x848a90);
    const equipDk = im(0x565b60, 0.15);
    const accent = im(0xd97a35, 0.25);            // 栏杆/爬梯/扶手安全橙
    const podM = im(0xe8e9e6, 0.28);
    const seatM = im(0x4a6fa5, 0.25);
    const screenM = new THREE.MeshStandardMaterial({ color: 0x0d2320, emissive: 0x6fd8c8, emissiveIntensity: 0.55, roughness: 0.4 });
    const stripM = new THREE.MeshStandardMaterial({ color: 0x2a2418, emissive: 0xffe9c8, emissiveIntensity: 0.7, roughness: 0.5 });
    const add = (mesh) => { interior.add(mesh); return mesh; };
    const ibox = (w, h, d, m, x, y, z, ry = 0) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      o.position.set(x, y, z); if (ry) o.rotation.y = ry; return add(o);
    };
    const icyl = (rt, rb, h, m, x, y, z, seg = 16, open = false) => {
      const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), m);
      o.position.set(x, y, z); return add(o);
    };
    const iring = (r, tube, m, y, seg = 24) => {
      const o = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, seg), m);
      o.rotation.x = Math.PI / 2; o.position.y = y; return add(o);
    };
    const ipipe = (x1, y1, z1, x2, y2, z2, r, m = copper) => {
      const from = new THREE.Vector3(x1, y1, z1), dir = new THREE.Vector3(x2, y2, z2).sub(from);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 8), m);
      p.position.copy(from).addScaledVector(dir, 0.5);
      p.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
      return add(p);
    };
    // 储罐:圆筒 + 压扁半球封头 + 内壁环向加强筋 + 中部防晃挡板 + 封头人孔
    function tank(mat, r, y0, y1, domeH, ribYs) {
      const cylH = y1 - y0;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, cylH, 28, 1, true), mat);
      c.position.y = y0 + cylH / 2; add(c);
      for (const [yy, flip] of [[y1, 1], [y0, -1]]) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat);
        dome.scale.y = (domeH / r) * flip;
        dome.position.y = yy;
        add(dome);
      }
      for (const ry of ribYs) iring(r - 0.08, 0.055, inner, ry, 28);
      const baffle = new THREE.Mesh(new THREE.RingGeometry(r - 0.85, r - 0.12, 28), inner);
      baffle.rotation.x = -Math.PI / 2;
      baffle.position.y = (y0 + y1) / 2;
      baffle.material = baffle.material.clone();
      baffle.material.side = THREE.DoubleSide;
      add(baffle);
      icyl(0.38, 0.38, 0.16, inner, 0.9, y1 + domeH * 0.82, 0, 14);   // 人孔盖
    }
    // ============ 推力段(1.5–3.8):承力锥、径向梁、COPV、集液槽、每台发动机输送管
    const puck = icyl(1.5, 3.9, 1.3, dark, 0, 2.15, 0, 24, true);
    puck.material = puck.material.clone();
    puck.material.side = THREE.DoubleSide;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      ibox(0.35, 0.6, 2.6, equip, Math.sin(a) * 2.6, 2.4, Math.cos(a) * 2.6, a);
      const copv = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), inner);
      copv.position.set(Math.sin(a + 0.6) * 3.1, 3.1, Math.cos(a + 0.6) * 3.1);
      add(copv);
      ibox(0.14, 0.9, 0.14, equip, Math.sin(a + 0.6) * 3.1, 2.45, Math.cos(a + 0.6) * 3.1); // COPV 支座
    }
    icyl(0.55, 0.55, 0.6, loxM, 0, 2.75, 0, 14);                     // LOX 集液槽
    iring(1.15, 0.12, loxM, 2.45, 20);                               // SL 供给环管
    iring(2.75, 0.12, ch4M, 2.75, 24);                               // RVac 供给环管
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      ipipe(0, 2.6, 0, Math.sin(a) * 1.15, 2.15, Math.cos(a) * 1.15, 0.1, loxM);
      const av = a + Math.PI / 3;
      ipipe(Math.sin(av) * 0.4, 2.7, Math.cos(av) * 0.4, Math.sin(av) * 2.75, 2.85, Math.cos(av) * 2.75, 0.1, ch4M);
      // 燃气发生器/万向节作动器(每台海平面机 ×2)
      for (const s of [-0.22, 0.22])
        ibox(0.13, 0.7, 0.13, accent, Math.sin(a) * 1.15 + s, 2.6, Math.cos(a) * 1.15 + Math.abs(s) * 0.5, a);
    }
    // ============ 主罐:LOX(下)/ CH4(上),环筋+防晃板+人孔
    tank(loxM, 4.15, 4.0, 15.0, 1.8, [5.6, 7.5, 9.4, 11.3, 13.2]);
    tank(ch4M, 4.15, 18.5, 28.5, 1.8, [20.2, 22.1, 24.0, 25.9, 27.4]);
    // 甲烷下输管(穿 LOX 罐)+ 管路卡箍 + CH4 头罐 + 头罐下引管
    const down = icyl(0.4, 0.4, 15.9, ch4M, 0, 10.55, 0, 14);
    for (const cy of [5, 9, 13, 17]) iring(0.48, 0.06, inner, cy, 14);
    const ch4h = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), ch4M);
    ch4h.position.y = 30.6; add(ch4h);
    ipipe(0, 29.4, 0, 0, 28.4, 0, 0.16, ch4M);
    // LOX 头罐(鼻锥内)+ 增压小气瓶 ×2 + 沿-Z内壁下行的输送/增压管
    icyl(1.0, 1.0, 1.9, loxM, 0, 45.6, 0, 16);
    for (const [yy, flip] of [[46.55, 1], [44.65, -1]]) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(1.0, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), loxM);
      d.scale.y = 0.5 * flip; d.position.y = yy; add(d);
    }
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8), inner);
      b.position.set(s * 0.9, 44.1, -0.8); add(b);
    }
    for (const sx of [-0.3, 0.3]) {
      ipipe(sx, 44.6, -2.0, sx, 32.0, -3.9, 0.14);
      ipipe(sx, 32.0, -3.9, sx, 17.0, -3.95, 0.14);
    }
    // ============ 前隔框 + 仪器段:机柜环 ×8 + 线缆桥架
    icyl(4.42, 4.42, 0.12, inner, 0, 31.9, 0, 32);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      ibox(1.05, 1.0, 0.5, equip, Math.sin(a) * 3.5, 31.25, Math.cos(a) * 3.5, a);
      ibox(0.85, 0.6, 0.06, equipDk, Math.sin(a) * 3.72, 31.3, Math.cos(a) * 3.72, a);   // 面板
    }
    iring(3.15, 0.07, accent, 31.78, 24);                            // 桥架环
    // ============ 乘员段:四层甲板(径向梁+边缘环)、中央井+爬梯、层间照明
    const DECKS = [33.0, 36.2, 39.4, 42.4];
    for (const dy of DECKS) {
      const r = hullR(dy) - 0.28;
      icyl(r, r, 0.14, deckM, 0, dy, 0, 28);
      iring(r - 0.06, 0.07, inner, dy - 0.14, 28);                   // 甲板边缘环梁
      for (let i = 0; i < 3; i++)                                    // 甲板下径向梁
        ibox(r * 2 - 0.5, 0.16, 0.18, inner, 0, dy - 0.16, 0, (i / 3) * Math.PI);
      for (const a of [0.9, 2.6, 4.2]) {                             // 天花照明条(挂上层甲板底)
        const sr = r * 0.62;
        ibox(1.5, 0.05, 0.2, stripM, Math.sin(a) * sr, dy + 2.85, Math.cos(a) * sr, a);
      }
    }
    const shaft = icyl(0.75, 0.75, 10.9, inner, 0, 37.75, 0, 16, true);
    shaft.material = shaft.material.clone();
    shaft.material.side = THREE.DoubleSide;                          // 中央通行井(32.3–43.2)
    for (const s of [-1, 1]) ibox(0.1, 10.9, 0.1, accent, s * 0.32, 37.75, -0.62); // 井内爬梯双轨
    for (let k = 0; k < 21; k++) ibox(0.56, 0.06, 0.06, accent, 0, 32.6 + k * 0.5, -0.62); // 踏杆
    // —— 货舱层 33.0:货运托盘/箱组 + ECLSS 机柜
    ibox(1.6, 1.9, 0.8, equip, -2.55, 34.1, 1.35, 0.5);
    ibox(1.34, 0.5, 0.06, equipDk, -2.32, 34.35, 1.68, 0.5);
    ibox(1.6, 1.9, 0.8, equip, 2.55, 34.1, -1.35, 0.5);
    const CRATES = [
      [1.2, 1.0, 1.2, 1.8, 33.6, 1.9, 0.2], [0.9, 0.7, 0.9, 2.8, 33.45, 0.6, 0.7],
      [1.4, 0.6, 1.0, 0.6, 33.4, -2.6, 1.2], [0.8, 0.8, 0.8, -0.9, 33.5, -2.9, 0.4],
      [1.0, 1.3, 1.0, -3.0, 33.75, -0.7, 0.9],
    ];
    for (const [w, h, d, x, y, z, ry] of CRATES) ibox(w, h, d, equipDk, x, y, z, ry);
    // —— 居住层 36.2:圆筒气闸(带圆门+手轮)、厨房台、餐桌凳、储物柜
    const lock = icyl(1.0, 1.0, 2.35, podM, 0, 37.4, 2.85, 20);
    const lockDoor = icyl(0.55, 0.55, 0.08, equipDk, 0, 37.3, 1.82, 16);
    lockDoor.rotation.x = Math.PI / 2;
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 16), accent);
    wheel.position.set(0, 37.3, 1.74); add(wheel);
    ibox(1.9, 0.95, 0.62, equip, -2.5, 36.75, -1.15, 1.05);          // 厨房台
    ibox(1.9, 0.1, 0.7, inner, -2.5, 37.26, -1.15, 1.05);            //   台面
    icyl(0.58, 0.58, 0.06, inner, 1.95, 37.15, -1.7, 16);            // 餐桌
    icyl(0.09, 0.09, 0.9, equip, 1.95, 36.7, -1.7, 8);
    for (const a of [0.4, 1.8, 3.4]) icyl(0.24, 0.24, 0.42, seatM, 1.95 + Math.sin(a) * 0.95, 36.5, -1.7 + Math.cos(a) * 0.95, 10);
    for (const a of [2.4, 2.9, 3.4]) ibox(0.62, 1.85, 0.5, podM, Math.sin(a) * 3.55, 37.2, Math.cos(a) * 3.55, a); // 储物柜排
    // —— 铺位层 39.4:睡眠舱 ×4(带舱口暗面)+ 隔断 + 个人柜
    for (const [sx, sz, ry] of [[-2.15, 0.75, 0], [-2.15, -0.75, 0], [2.15, 0.75, Math.PI], [2.15, -0.75, Math.PI]]) {
      ibox(2.0, 0.95, 1.05, podM, sx, 40.0 + (sz > 0 ? 0 : 1.1), sz, ry);
      ibox(0.06, 0.6, 0.7, equipDk, sx - Math.cos(ry) * 1.0, 40.05 + (sz > 0 ? 0 : 1.1), sz, ry);
    }
    ibox(0.12, 2.2, 2.6, inner, 0.0, 40.6, -2.6, 1.1);               // 隔断板
    for (const s of [-1, 1]) ibox(0.55, 1.7, 0.45, equip, s * 1.1, 40.35, 3.1, s * 0.35); // 个人柜
    // —— 驾驶层 42.4:环形驾驶台(3 屏)+ 座椅 ×2,朝观景窗
    for (const a of [-0.55, 0, 0.55]) {
      const cx = Math.sin(a) * 2.15, cz = Math.cos(a) * 2.15;
      ibox(1.25, 0.72, 0.5, equip, cx, 42.95, cz, a);
      const scr = ibox(1.0, 0.42, 0.05, screenM, cx * 1.0, 43.25, cz * 1.0 - 0.0, a);
      scr.position.x -= Math.sin(a) * 0.24; scr.position.z -= Math.cos(a) * 0.24;
      scr.rotation.x = -0.35;
    }
    for (const s of [-0.7, 0.7]) {
      icyl(0.11, 0.11, 0.5, equip, s, 42.72, 0.6, 8);
      ibox(0.55, 0.12, 0.55, seatM, s, 43.0, 0.6);
      ibox(0.55, 0.72, 0.12, seatM, s, 43.4, 0.32);
    }
  }

  // ---------------------------------------------------------------- POI 锚点(卡片见 veh-rocket-01.info.json)
  for (const [n, x, y, z] of [
    ['raptor-bay',   0, 1.6, 0],      // 发动机舱
    ['main-tanks',   0, 16, 0],       // 主推进剂罐(LOX/CH4 共底附近)
    ['header-tanks', 0, 45.6, 0],     // 鼻锥 LOX 头罐
    ['flaps',        0, 40, 4.6],     // 前翼铰点外侧
    ['crew-decks',   0, 38, 0],       // 乘员段中部
    ['landing-legs', 5.9, 0.6, 0],    // 着陆腿脚垫处
  ]) {
    const a = new THREE.Object3D();
    a.name = 'poi_' + n;
    a.position.set(x, y, z);
    g.add(a);
  }

  // ---------------------------------------------------------------- 引擎接口
  g.userData.nightMats = nightMats;
  g.userData.lights = [{ color: 0xffd9a0, pos: [0, 40.5, 4.8], range: 30 }]; // 舷窗带外侧
  g.userData.beams = [];
  g.userData.flames = flames;
  return g;
}
