// ops-drill-01 —— 太阳质子事件演习控制台(地表,环境预警组团)
// 契约:米制;原点 = 基座中心地面点;正面朝 +Z;贴地 minY=0;≤5 万面;THREE 由参数传入。
// 这是 `userData.alarm` 响应钩子的参考实现(规格见 mars-drill/dev/HOOK_SPEC_alarm.md):
//   alarm.set(level, frame, ctx) 改自己的三色灯与看板;告警灯不进 blinkMats/nightMats(引擎会抢驱动)。
//   引擎没有演习播放器时,actions['演习开始'] 置标志,animate 用内嵌的 drill.json 摘要
//   (ops-drill-01.data.js,由 ledger/gen_data_module.py 生成)以 60× 压缩自演一遍——同文件优雅降级。
// 数字全部来自 mars-drill ledger/out/*.json;看板上的六根条 = 每分钟全城位置计数(origin/transit/queue/lock/lift/sheltered)。
import { DRILL } from './ops-drill-01.data.js';

export const meta = {
  id: 'ops-drill-01',
  name: 'SEP 演习控制台',
  name_en: 'SEP Drill Console',
  size_m: 4.37,             // 实测包围盒最大边(validate_unit.mjs):高 4.37 m
  size_axis: 'height',
  effects: ['glow_windows'],
};

export function build(THREE) {
  const g = new THREE.Group();
  g.name = meta.id;
  const nightMats = [];
  const DUST = new THREE.Color(0x9e5b3d);

  const M = {
    print: new THREE.MeshStandardMaterial({ color: 0xbfa079, roughness: 0.93 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x8f959b, roughness: 0.45, metalness: 0.7 }),
    dark:  new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.55, metalness: 0.5 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x1b1f24, roughness: 0.6, metalness: 0.3 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xd8742c, roughness: 0.7 }),
    white: new THREE.MeshStandardMaterial({ color: 0xd9d5cb, roughness: 0.8 }),
    plaque: new THREE.MeshStandardMaterial({ color: 0x6b6f75, roughness: 0.5, metalness: 0.6 }),
  };
  for (const m of [M.print, M.orange, M.white]) m.color.lerp(DUST, 0.05);   // 尘膜 pass
  // 看板常亮件(nightMats:引擎按昼夜调 emissive)——告警灯不在此列
  const G = {
    strip: new THREE.MeshStandardMaterial({ color: 0x1a1206, emissive: 0xffc878, emissiveIntensity: 1.6, roughness: 0.5 }),
    text:  new THREE.MeshStandardMaterial({ color: 0x102030, emissive: 0x63b4d8, emissiveIntensity: 1.4, roughness: 0.5 }),
  };
  nightMats.push(G.strip, G.text);
  // 告警灯与计数条:自驱材质(不进 nightMats / blinkMats)
  const LAMP = {
    green:  new THREE.MeshStandardMaterial({ color: 0x0a2a10, emissive: 0x3ee06a, emissiveIntensity: 1.8, roughness: 0.4 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0x2a1e06, emissive: 0xffb030, emissiveIntensity: 0.15, roughness: 0.4 }),
    red:    new THREE.MeshStandardMaterial({ color: 0x2a0806, emissive: 0xff3020, emissiveIntensity: 0.15, roughness: 0.4 }),
  };
  const BAR_COLORS = [0x8d8a80, 0xe0aa48, 0xe07a48, 0xd86153, 0x63b4d8, 0x7fb069];   // origin/transit/queue/lock/lift/sheltered
  const barMats = BAR_COLORS.map((c) => new THREE.MeshStandardMaterial({ color: 0x101214, emissive: c, emissiveIntensity: 1.2, roughness: 0.5 }));

  function box(w, h, d, mat, x, y, z, ry = 0, parent = g) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); if (ry) m.rotation.y = ry; parent.add(m); return m;
  }
  function cyl(rt, rb, h, mat, x, y, z, seg = 12, parent = g) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z); parent.add(m); return m;
  }

  /* ---------------- 基座:打印土坪 + 顶盖压条 + 底裙边 ---------------- */
  box(3.0, 0.30, 2.0, M.print, 0, 0.15, 0);
  box(3.1, 0.06, 2.1, M.printDim || M.dark, 0, 0.03, 0);          // 底裙边
  box(3.0, 0.04, 2.0, M.dark, 0, 0.32, 0);                       // 顶压条
  // 车辙/砾石:两条车辙条
  box(1.2, 0.02, 0.12, M.dark, -0.9, 0.31, 0.75); box(1.2, 0.02, 0.12, M.dark, 0.9, 0.31, 0.75);

  /* ---------------- 警报桅杆:钢管 + 三色灯柱 + 警笛 ---------------- */
  const mast = new THREE.Group(); mast.name = 'mast'; mast.position.set(-1.05, 0.30, -0.55); g.add(mast);
  cyl(0.06, 0.08, 4.0, M.steel, 0, 2.0, 0, 10, mast);
  cyl(0.16, 0.20, 0.10, M.dark, 0, 0.05, 0, 12, mast);            // 法兰
  // 灯柱:三段圆柱灯罩(下绿中黄上红),各 0.28 m
  const lampHousing = cyl(0.13, 0.13, 0.92, M.dark, 0, 3.55, 0, 12, mast);
  const lampG = cyl(0.115, 0.115, 0.26, LAMP.green, 0, 3.24, 0, 14, mast); lampG.name = 'lamp_green';
  const lampY = cyl(0.115, 0.115, 0.26, LAMP.yellow, 0, 3.55, 0, 14, mast); lampY.name = 'lamp_yellow';
  const lampR = cyl(0.115, 0.115, 0.26, LAMP.red, 0, 3.86, 0, 14, mast); lampR.name = 'lamp_red';
  cyl(0.14, 0.14, 0.06, M.dark, 0, 4.04, 0, 12, mast);            // 顶帽
  // 警笛喇叭(锥),朝 +Z
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 14, 1, true), M.steel);
  horn.rotation.x = -Math.PI / 2; horn.position.set(0.28, 2.9, 0.18); mast.add(horn);
  box(0.16, 0.16, 0.22, M.dark, 0.28, 2.9, -0.1, 0, mast);
  // 接线箱 + 导管(工业细节语法)
  box(0.22, 0.30, 0.12, M.dark, 0.0, 1.2, 0.10, 0, mast);
  cyl(0.02, 0.02, 1.0, M.dark, 0.0, 0.7, 0.10, 6, mast);

  /* ---------------- 看板:钢框 + 面板 + 六根计数条 + 等级带 + 进度条 ---------------- */
  const board = new THREE.Group(); board.name = 'board'; board.position.set(0.45, 0.30, -0.35); g.add(board);
  cyl(0.05, 0.05, 1.3, M.steel, -1.0, 0.65, 0, 8, board); cyl(0.05, 0.05, 1.3, M.steel, 1.0, 0.65, 0, 8, board);
  box(2.4, 1.5, 0.08, M.panel, 0, 2.05, 0, 0, board);
  box(2.5, 0.06, 0.12, M.orange, 0, 2.83, 0, 0, board); box(2.5, 0.06, 0.12, M.orange, 0, 1.27, 0, 0, board);   // 橙色压条
  box(2.2, 0.06, 0.02, G.strip, 0, 2.72, 0.05, 0, board);          // 标题发光条
  // 六根计数条(高度 ∝ 人数/N,满 1.0 m),底端固定在 y=1.42
  const bars = [];
  for (let i = 0; i < 6; i++) {
    const x = -0.95 + i * 0.36;
    box(0.26, 1.02, 0.02, M.dark, x, 1.93, 0.045, 0, board);        // 槽
    const bar = box(0.22, 1.0, 0.03, barMats[i], x, 1.42 + 0.5, 0.06, 0, board);
    bar.geometry.translate(0, 0.5, 0); bar.position.y = 1.42;      // 原点在底端,scale.y 拉伸
    bar.scale.y = 0.001; bar.name = 'bar_' + DRILL.flow_keys[i]; bars.push(bar);
    box(0.26, 0.05, 0.02, G.text, x, 1.36, 0.05, 0, board);         // 标签牌(发光)
  }
  // 等级带:三格 LED(与桅杆灯同材质)
  const ledG = box(0.16, 0.10, 0.03, LAMP.green, 0.72, 2.60, 0.06, 0, board);
  const ledY = box(0.16, 0.10, 0.03, LAMP.yellow, 0.90, 2.60, 0.06, 0, board);
  const ledR = box(0.16, 0.10, 0.03, LAMP.red, 1.08, 2.60, 0.06, 0, board);
  // 进度条:t / T_end
  box(2.2, 0.05, 0.02, M.dark, 0, 2.52, 0.045, 0, board);
  const prog = box(2.2, 0.04, 0.03, G.text, -1.1 + 1.1, 2.52, 0.06, 0, board);
  prog.geometry.translate(1.1, 0, 0); prog.position.x = -1.1; prog.scale.x = 0.001; prog.name = 'progress';
  // 时间压缩铭牌
  box(0.7, 0.10, 0.02, M.plaque, 0.85, 2.40, 0.05, 0, board);

  /* ---------------- 规程铭牌(POI:红警即回舱) + 护栏 ---------------- */
  const plaque = box(0.9, 0.6, 0.04, M.plaque, -0.95, 0.9, 0.85, 0.0);
  box(0.8, 0.5, 0.005, M.white, -0.95, 0.9, 0.873);
  cyl(0.03, 0.03, 0.9, M.steel, -0.95, 0.45 + 0.3, 0.85, 8);
  for (const x of [-1.45, 1.45]) { cyl(0.03, 0.03, 1.0, M.orange, x, 0.8, -0.95, 8); }
  box(2.9, 0.04, 0.04, M.orange, 0, 1.28, -0.95);

  /* ---------------- POI 锚点 ---------------- */
  const poi = (name, x, y, z) => { const a = new THREE.Object3D(); a.name = 'poi_' + name; a.position.set(x, y, z); g.add(a); };
  poi('mast', -1.05, 3.9, -0.55);
  poi('board', 0.45, 2.3, -0.35);
  poi('siren', -0.77, 3.2, -0.37);
  poi('plaque', -0.95, 0.9, 0.85);
  poi('hook', 0.45, 1.0, -0.35);

  /* ---------------- 响应钩子(参考实现) ---------------- */
  const setLamp = (which) => {
    LAMP.green.emissiveIntensity = which === 'green' ? 1.8 : 0.15;
    LAMP.yellow.emissiveIntensity = which === 'yellow' ? 1.8 : 0.15;
    LAMP.red.emissiveIntensity = which === 'red' ? 2.2 : 0.15;
  };
  const N = DRILL.N_surface || 1;
  const setBars = (counts) => { for (let i = 0; i < 6; i++) bars[i].scale.y = Math.max(0.001, counts[i] / N); };
  const flowAt = (tMin) => {
    const i = Math.max(0, Math.min(DRILL.flow.length - 1, Math.floor(tMin)));
    return DRILL.flow[i].c;
  };
  const alarm = {
    levels: ['green', 'yellow', 'red'],
    level: 'green',
    set(level, frame, ctx) {
      this.level = level;
      setLamp(level);
      if (frame && frame.t_min !== undefined) {
        setBars(flowAt(frame.t_min));
        prog.scale.x = Math.max(0.001, Math.min(1, frame.t_min / DRILL.T_end_min));
      }
      if (level === 'green' && !frame) { setBars([N, 0, 0, 0, 0, 0]); prog.scale.x = 0.001; }
    },
  };
  g.userData.alarm = alarm;
  alarm.set('green', null, null);

  /* ---------------- 自演播放器(引擎无播放器时的降级) ---------------- */
  const RATIO = 60;                       // 压缩比:1 真实分钟 = 1 秒(印在铭牌 POI 上)
  const drill = { DRILL, t_min: 0, running: false, ratio: RATIO, siren: 0 };
  g.userData.drill = drill;
  g.userData.actions = {
    '演习开始': () => { drill.running = true; drill.t_min = 0; },
    '复位': () => { drill.running = false; drill.t_min = 0; alarm.set('green', null, null); horn.rotation.z = 0; },
  };
  let sirenPhase = 0;
  g.userData.animate = (t, dt, ctx) => {
    if (ctx && ctx.drill) return;         // 引擎播放器接管时不自演
    if (!drill.running) return;
    drill.t_min += dt * RATIO / 60;
    const lvl = drill.t_min < DRILL.T_end_min ? 'red' : 'green';
    alarm.set(lvl, { t_min: Math.min(drill.t_min, DRILL.T_end_min) }, ctx);
    sirenPhase += dt * 6;                  // 警笛喇叭小幅摆动(红时)
    horn.rotation.z = lvl === 'red' ? Math.sin(sirenPhase) * 0.12 : 0;
    if (drill.t_min >= DRILL.T_end_min + 5) { drill.running = false; alarm.set('green', null, null); horn.rotation.z = 0; }
  };

  g.userData.nightMats = nightMats;
  g.userData.lights = [{ color: 0xffd9a0, pos: [0.45, 2.6, 0.6], range: 6 }];
  return g;
}
