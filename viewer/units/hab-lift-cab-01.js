// hab-lift-cab-01 —— 地下城人员电梯轿厢（乘梯过程的室内场景）
// 契约（MODELS.md §4b）：kind:interior、原点 = 轿厢地板中心、+Y 上、门朝 +Z；
// 1 单位 = 1 米；传入 THREE；无外部资源；灯常亮。
// 用法：引擎的电梯乘坐序列（main.js rideLift）在乘梯期间把玩家放进这间轿厢，
// 每帧调 group.userData.ride.set({ depth, v, doors, refuge })：
//   depth  当前深度 m（地表 0，向下为负）      v  当前速度 m/s（向下为负）
//   doors  门开度 0..1                          refuge  0..1，经过避难龛时的门缝闪光
// 数字来源：hab-lift-01 卡四本解析账（井深 3000 m、额定 12 m/s、气柱 Δp≈ρgh、
// 避难龛每 500 m×6、轿顶 0.2 m 含硼聚乙烯屏蔽塞）。乘梯时间按城内动画惯例压缩，
// 压缩倍数印在指示屏上，不冒充实时。

export const meta = {
  id: 'hab-lift-cab-01',
  name: '电梯轿厢',
  name_en: 'Lift cab',
  kind: 'interior',
  size_m: 2.6,             // 轿厢内径（越过 ±(size/2−0.6) 引擎会夹回）
  size_axis: 'width',
  effects: [],
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = meta.id;
  const R = 1.3, H = 2.4;

  const M = {
    steel:  new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.45, metalness: 0.7, side: THREE.BackSide }),
    steelF: new THREE.MeshStandardMaterial({ color: 0xa4aab0, roughness: 0.4, metalness: 0.7 }),
    dark:   new THREE.MeshStandardMaterial({ color: 0x26292d, roughness: 0.55, metalness: 0.6 }),
    grate:  new THREE.MeshStandardMaterial({ color: 0x6d6a63, roughness: 0.85, metalness: 0.3 }),
    rail:   new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.3, metalness: 0.8 }),
    plug:   new THREE.MeshStandardMaterial({ color: 0xe9e2c8, roughness: 0.9 }),   // 含硼聚乙烯
    hazY:   new THREE.MeshStandardMaterial({ color: 0xd9a422, roughness: 0.7 }),
    hazK:   new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.7 }),
    lamp:   new THREE.MeshStandardMaterial({ color: 0xfff4e0, emissive: 0xfff0d8, emissiveIntensity: 1.6 }),
    amber:  new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xffb030, emissiveIntensity: 2.0 }),
    ledG:   new THREE.MeshStandardMaterial({ color: 0x061a0a, emissive: 0x3ee06a, emissiveIntensity: 2.0 }),
    ledR:   new THREE.MeshStandardMaterial({ color: 0x1a0806, emissive: 0xff4034, emissiveIntensity: 2.0 }),
    slot:   new THREE.MeshStandardMaterial({ color: 0x0a0806, emissive: 0xffb060, emissiveIntensity: 0.0 }), // 门缝外的龛光
  };
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); g.add(m); return m;
  };

  // ---- 壳体：地板格栅、筒壁（BackSide，从内看）、顶板与灯 ----
  add(new THREE.CylinderGeometry(R, R, 0.06, 32), M.grate, 0, 0.03, 0);
  add(new THREE.CylinderGeometry(R + 0.02, R + 0.02, H, 32, 1, true), M.steel, 0, H / 2, 0);
  const ceil = add(new THREE.CylinderGeometry(R + 0.02, R + 0.02, 0.05, 32), M.dark, 0, H + 0.025, 0);
  ceil.material = M.dark;
  add(new THREE.CylinderGeometry(0.55, 0.55, 0.02, 24), M.lamp, 0, H - 0.02, 0);          // 顶灯盘
  // 轿顶屏蔽塞：0.2 m 含硼聚乙烯（hab-lift-01 卡「井口屏蔽帽」），从舱内看见的是它的检修口盖
  add(new THREE.CylinderGeometry(R - 0.05, R - 0.05, 0.2, 32), M.plug, 0, H + 0.15, 0);
  add(new THREE.TorusGeometry(0.32, 0.03, 8, 24), M.rail, 0.75, H - 0.01, -0.5).rotation.x = Math.PI / 2; // 检修口环
  // 扶手（三面，门侧留空）
  const rail = add(new THREE.TorusGeometry(R - 0.08, 0.025, 8, 40, Math.PI * 1.5), M.rail, 0, 0.95, 0);
  rail.rotation.x = Math.PI / 2; rail.rotation.z = Math.PI * 0.25;
  // 踢脚黄黑
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    if (Math.abs(Math.sin(a)) < 0.35 && Math.cos(a) < 0) continue;   // 门口不画
    const m = add(new THREE.BoxGeometry(0.62, 0.08, 0.03), i % 2 ? M.hazK : M.hazY,
      Math.sin(a) * (R - 0.03), 0.1, Math.cos(a) * (R - 0.03));
    m.rotation.y = a;
  }

  // ---- 门（+Z），双扇对开；门缝后一条会亮的龛光条 ----
  const doorL = add(new THREE.BoxGeometry(0.66, 2.2, 0.06), M.steelF, -0.34, 1.1, R - 0.05);
  const doorR = add(new THREE.BoxGeometry(0.66, 2.2, 0.06), M.steelF, 0.34, 1.1, R - 0.05);
  add(new THREE.BoxGeometry(1.5, 0.12, 0.08), M.dark, 0, 2.26, R - 0.06);            // 门楣
  add(new THREE.BoxGeometry(0.03, 2.2, 0.02), M.slot, 0, 1.1, R + 0.02);            // 门缝（在门后）
  add(new THREE.BoxGeometry(0.16, 0.16, 0.04), M.ledR, -0.25, 2.26, R - 0.1);       // 门楣灯：红=运行
  add(new THREE.BoxGeometry(0.16, 0.16, 0.04), M.ledG, 0.25, 2.26, R - 0.1);        // 绿=可开门
  const ledRun = g.children[g.children.length - 2], ledOpen = g.children[g.children.length - 1];

  // ---- 指示屏（−Z 壁）：深度 / 速度 / 舱压差 / 下一避难龛 ----
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 288;
  const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const panel = add(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ map: tex }), 0, 1.55, -(R - 0.06));
  add(new THREE.BoxGeometry(1.0, 0.6, 0.04), M.dark, 0, 1.55, -(R - 0.03));
  add(new THREE.BoxGeometry(0.08, 1.6, 0.03), M.amber, 0.8, 1.2, -(R - 0.05));       // 琥珀层位条（与站房同款）
  add(new THREE.BoxGeometry(0.4, 0.14, 0.03), M.amber, -0.75, 2.0, -(R - 0.05));    // 站名小牌
  add(new THREE.BoxGeometry(0.4, 0.26, 0.03), M.dark, -0.75, 1.6, -(R - 0.05));     // 呼梯面板

  const state = { depth: 0, v: 0, doors: 0, refuge: 0, dir: 0, ratio: 1 };
  let lastText = '';
  function draw() {
    const d = state.depth, v = state.v;
    const dp = 1.2 * 3.71 * Math.max(0, -d) / 1000;                     // 气柱自重 kPa（hab-lift-01 卡）
    const nextRef = state.dir < 0
      ? Math.ceil((-d + 1e-6) / 500) * 500 : Math.floor((-d - 1e-6) / 500) * 500;
    const toRef = Math.abs(-d - Math.min(3000, Math.max(0, nextRef)));
    const key = `${Math.round(d)}|${Math.round(v * 10)}|${state.doors > 0.5}|${Math.round(toRef)}`;
    if (key === lastText) return;
    lastText = key;
    cx.fillStyle = '#0b0d10'; cx.fillRect(0, 0, 512, 288);
    cx.fillStyle = '#ffb030'; cx.font = 'bold 26px monospace';
    cx.fillText('HAB-LIFT-01', 24, 40);
    cx.fillStyle = '#7c8590'; cx.font = '20px monospace';
    cx.fillText(state.doors > 0.5 ? 'DOORS OPEN' : (v < -0.05 ? 'DESCENDING' : v > 0.05 ? 'ASCENDING' : 'STOPPED'), 300, 40);
    cx.fillStyle = '#e8f0ff'; cx.font = 'bold 84px monospace';
    cx.fillText(`${Math.round(d)}`, 24, 140);
    cx.fillStyle = '#7c8590'; cx.font = '22px monospace';
    cx.fillText('m  depth', 330, 140);
    cx.font = '24px monospace'; cx.fillStyle = '#c8d0da';
    cx.fillText(`v ${Math.abs(v).toFixed(1)} m/s   Δp +${dp.toFixed(1)} kPa`, 24, 195);
    cx.fillText(`refuge in ${Math.round(toRef)} m   pressurised`, 24, 232);
    cx.fillStyle = '#556070'; cx.font = '18px monospace';
    cx.fillText(`rated 12 m/s · 3000 m in 4.2 min · time ×${state.ratio.toFixed(0)}`, 24, 268);
    tex.needsUpdate = true;
  }

  g.userData.ride = {
    set({ depth, v, doors, refuge, ratio }) {
      if (depth !== undefined) { state.dir = Math.sign(depth - state.depth) || state.dir; state.depth = depth; }
      if (v !== undefined) state.v = v;
      if (doors !== undefined) state.doors = doors;
      if (refuge !== undefined) state.refuge = refuge;
      if (ratio !== undefined) state.ratio = ratio;
      const o = 0.62 * state.doors;
      doorL.position.x = -0.34 - o; doorR.position.x = 0.34 + o;
      M.slot.emissiveIntensity = 2.4 * state.refuge;
      ledRun.material = state.doors > 0.5 ? M.dark : M.ledR;
      ledOpen.material = state.doors > 0.5 ? M.ledG : M.dark;
      draw();
    },
  };
  draw();

  // ---- POI 锚 ----
  const poi = (name, x, y, z) => { const a = new THREE.Object3D(); a.name = 'poi_' + name; a.position.set(x, y, z); g.add(a); };
  poi('panel', 0, 1.55, -(R - 0.2));
  poi('doors', 0, 1.2, R - 0.3);
  poi('plug', 0, H - 0.2, -0.5);
  poi('rail', 0, 0.95, 0.2);

  // ---- §4b 契约 ----
  g.userData.lights = [{ color: 0xfff0d8, pos: [0, H - 0.3, 0], range: 6 }];
  g.userData.entry = { pos: [0, 0, 0.35], yaw: 0 };          // 面向指示屏（−Z）
  g.userData.exitZone = { pos: [0, 9], radius: 0.5 };         // 乘梯中不可达；出口由乘坐序列决定
  g.userData.nightMats = [];
  // 运行感：加压笼子没有窗,动感只来自三处——指示屏、门缝龛光、以及这里的轻微振动与灯闪。
  // 幅度随 |v|/12 缩放:地板级 ±6 mm、约 9 Hz 的竖向抖动叠一点低频晃,顶灯 ±8% 的闪烁。
  // 停站时归零,所以站着不动看不出来;这是感觉,不是账,卡上不写数。
  let jt = 0;
  g.userData.animate = (t, dt) => {
    const k = Math.min(1, Math.abs(state.v) / 12);
    if (k < 0.01) { if (g.position.y !== 0) { g.position.y = 0; g.rotation.z = 0; } M.lamp.emissiveIntensity = 1.6; return; }
    jt += dt;
    g.position.y = k * (0.006 * Math.sin(jt * 2 * Math.PI * 9) + 0.003 * Math.sin(jt * 2 * Math.PI * 1.3));
    g.rotation.z = k * 0.0025 * Math.sin(jt * 2 * Math.PI * 0.7);
    M.lamp.emissiveIntensity = 1.6 + k * 0.13 * Math.sin(jt * 2 * Math.PI * 11) + (state.refuge ? -0.2 : 0);
  };
  return g;
}
