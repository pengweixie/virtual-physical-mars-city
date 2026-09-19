// 计算中心 ops-compute-01 —— 细化轮(2026-09-06,mars-bigram 设计册)
//
// v0 的闭环单元:大屏上 live 跑字符级 bigram,架里插着同一算法的硅实现 MB-1。
// 本轮把它做成「在火星上算得出账」的计算中心——每一块几何都由账本给尺寸:
//   * 辐射散热场(西侧三排 12 m × 4.5 m 双面板,倾 70° 朝北,排距 6.5 m):
//     ledger/03_thermal.json —— 积尘 α0.68/ε0.90、板温 320 K、天空 210 K、最坏正午
//     每 m² 板面净排 570 W(夜 889);55 kW 峰值 × PUE 1.08 需 104 m²,建 3 板 = 162 m²。
//     v0 那面 0.9 m 间距的东西向竖鳍墙被视因子账推翻(内面 60% 互视),已撤。
//   * 机架 8 台(0.8 × 1.2 × 2.2 m,42U 级)= 电网册登记的装机容量 40/55 kW,
//     ledger/01_load.json 说明:没有任何城卡把算力负荷落在本站,登记值是「容量」不是「负荷」。
//   * 液冷:机架冷板/后门换热 → CDU(西墙内)→ 穿墙管 → 户外辐射回路(330 K 供 / 310 K 回),
//     无冷水机,PUE 1.08(ledger/02_power.json)。
//   * 大屏:与 MB-1 逐比特一致的采样器(同 LFSR、同钳位逆 CDF、同 4096×16 位表),
//     表由 ./mb1-cdf-data.js 给(mars-bigram/tools/build_screen_data.py 生成),开机对拍
//     220 字符对 Python 金标准,PASS/FAIL 打在屏上——一道能在浏览器里变红的闸。
//   * MB-1 刀片:仍在 2 号机架(复用 mb1-demo-board.js);知识卡如实写「设计,无硅片」。
//   * r1.1(2026-09-13):收编 ops-roster-01 的「花名册与配额」看板部件(roster-board.js + roster-data.js,
//     数据归它,本模块不转抄任何数);立在机房东侧正对气闸门,前脸朝 +Z。
//     见 dev/REPLY_ops-compute-01_to_ops-roster-01_board.md。
//   * 可走入:南面气闸门 → 机房内部(地面/吊顶/墙都有内表面)。不做独立 interior 单元:
//     一块屏、一份 animate、且保留昼夜(屏光夜洒机房是 v0 的证据);理由见交付文件。
// 契约(MODELS.md §4):1 单位 = 1 m,原点 = 基座中心地面点,+Y 上,正面朝 +Z;不 import three;
// 两个 import 都是纯数据/纯几何 helper(references/eda-to-3d.md 的合规写法)。
// Node 校验(无 DOM)时:canvas 纹理与刀片降级为纯色/占位盒,几何包络与三角形数不变量级。
import { buildBoard } from './mb1-demo-board.js';
import { MB1 } from './mb1-cdf-data.js';
import { RosterBoard } from './roster-board.js';
import { ROSTER } from './roster-data.js';

export const meta = {
  id: 'ops-compute-01', name: '计算中心',
  name_en: 'Compute Center',
  size_m: 42, size_axis: 'width', effects: ['glow_windows', 'blink'],
};

// ---- MB-1 bit-exact core (mirrors mars-bigram/tools/mb1_model.py, which mirrors rtl/) ----
const V = 64, FULL = 0xFFFF;
const lfsrNext = (s) => { const fb = ((s >>> 31) ^ (s >>> 21) ^ (s >>> 1) ^ s) & 1; return ((s << 1) | fb) >>> 0; };
const lfsrSeed = (seed) => ((seed >>> 0) === 0 ? 1 : (seed >>> 0));
function parseCdf(hex) {
  const cdf = new Uint16Array(V * V);
  for (let i = 0; i < V * V; i++) cdf[i] = parseInt(hex.substr(i * 4, 4), 16);
  return cdf;
}
function makeSampler(cdf, alphabet, seed, temp, start) {
  let lf = lfsrSeed(seed), state = start & (V - 1);
  return () => {
    let rEff = (lf & FULL) >>> temp;
    if (rEff === 0) rEff = 1;                          // clamp: r=0 would pick a zero-prob symbol
    let b = V - 1;
    const row = state * V;
    for (let i = 0; i < V; i++) if (cdf[row + i] >= rEff) { b = i; break; }
    state = b; lf = lfsrNext(lf);
    return alphabet[b];
  };
}

export function build(THREE) {
  const hasDOM = typeof document !== 'undefined';
  const root = new THREE.Group();                 // origin = pad centre at ground (y = 0)
  const g = new THREE.Group();                    // everything above the pad, lifted by the pad thickness
  const PAD_T = 0.4;
  g.position.y = PAD_T; root.add(g);
  // emissive helper: engine drives nightMats via emissiveIntensity (MODELS.md section 4 rule 4), so
  // every self-lit part is a MeshStandardMaterial with an emissive colour, not a MeshBasicMaterial
  const lit = (hex, k = 1.0) => new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: hex, emissiveIntensity: k, roughness: 0.6 });
  const M = {
    hull: new THREE.MeshStandardMaterial({ color: 0x2a2e36, roughness: 0.8, side: THREE.DoubleSide }),
    pad: new THREE.MeshStandardMaterial({ color: 0x3a3630, roughness: 0.95 }),
    pale: new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.7 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x3b3f47, roughness: 0.6, side: THREE.DoubleSide }),
    ceil: new THREE.MeshStandardMaterial({ color: 0x8d9299, roughness: 0.85, side: THREE.DoubleSide }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.6 }),
    rackSide: new THREE.MeshStandardMaterial({ color: 0x1d2027, roughness: 0.55, metalness: 0.3 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.5, metalness: 0.5 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x6f757c, roughness: 0.45, metalness: 0.6 }),
    rad: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.9, side: THREE.DoubleSide }),
    radDust: new THREE.MeshStandardMaterial({ color: 0x2b1d17, roughness: 0.95, side: THREE.DoubleSide }),
    hot: new THREE.MeshStandardMaterial({ color: 0xb8442c, roughness: 0.5, metalness: 0.3 }),
    cold: new THREE.MeshStandardMaterial({ color: 0x2f6fb0, roughness: 0.5, metalness: 0.3 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xd9782a, roughness: 0.6 }),
    white: new THREE.MeshStandardMaterial({ color: 0xe6e2da, roughness: 0.7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fd0e0, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.28, side: THREE.DoubleSide }),
  };
  const nightMats = [], blinkMats = [];
  const box = (w, h, d, mat, x, y, z, parent) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const cyl = (r, len, mat, x, y, z, axis, parent) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
    if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z); (parent || g).add(m); return m;
  };
  const anchor = (id, x, y, z) => { const a = new THREE.Object3D(); a.name = 'poi_' + id; a.position.set(x, y, z); g.add(a); };

  // =====================================================================
  // 1. pad + hall (hall x -5..19, z -8..8, H 6; pad 42 x 20 centred on origin)
  // =====================================================================
  const PW = 42, PD = 20, H = 6;
  const HX0 = -5, HX1 = 19, HZ0 = -8, HZ1 = 8;
  const HX = (HX0 + HX1) / 2, HW = HX1 - HX0, HD = HZ1 - HZ0;
  box(PW, PAD_T, PD, M.pad, 0, PAD_T / 2 - PAD_T, 0, root).position.y = PAD_T / 2;   // pad 0..0.4 in root
  box(PW + 0.4, 0.12, PD + 0.4, M.steel, 0, 0.02, 0);                 // skirt / kerb on the pad top
  const T = 0.3;
  box(HW, H, T, M.hull, HX, H / 2, HZ0 + T / 2);                        // north wall (screen wall)
  box(T, H, HD, M.hull, HX0 + T / 2, H / 2, 0);                          // west wall (pipe penetrations)
  box(T, H, HD, M.hull, HX1 - T / 2, H / 2, 0);                          // east wall
  // south face: glass band x -5..13 (with a sill), solid door bay x 13..19 built as piers + lintel
  box(18, H - 1.5, 0.12, M.glass, HX0 + 9, H / 2 + 0.75, HZ1 - 0.1);
  box(18, 1.5, T, M.hull, HX0 + 9, 0.75, HZ1 - T / 2);
  const AX = 16, AZ = HZ1 + 1.3;                                         // airlock axis
  box(2.3, H, T, M.hull, 14.15, H / 2, HZ1 - T / 2);                     // pier west of the door
  box(2.3, H, T, M.hull, 17.85, H / 2, HZ1 - T / 2);                     // pier east of the door
  box(1.4, H - 2.3, T, M.hull, AX, (H + 2.3) / 2, HZ1 - T / 2);          // lintel over a 1.4 x 2.3 m doorway
  box(HW, T, HD, M.ceil, HX, H - T / 2, 0);                              // roof slab (ceiling inside)
  box(HW + 0.4, 0.35, HD + 0.4, M.metal, HX, H + 0.1, 0);                // roof trim
  box(HW, 0.05, HD, M.floor, HX, 0.03, 0);                               // raised floor plate
  // roof service: dosimeter node (radiation card anchor)
  box(0.5, 0.5, 0.5, M.white, 8, H + 0.55, -2); cyl(0.04, 1.2, M.metal, 8, H + 1.4, -2, 'y');
  box(0.16, 0.16, 0.16, M.orange, 8, H + 2.05, -2);
  // airlock vestibule outside the door (walk-in): open shell 2.4 x 2.6 x 2.6 (two side walls + roof),
  // door frames + latches at both ends, no slab across the walking line
  box(0.15, 2.6, 2.6, M.pale, AX - 1.2, 1.3, AZ);
  box(0.15, 2.6, 2.6, M.pale, AX + 1.2, 1.3, AZ);
  box(2.55, 0.2, 2.8, M.steel, AX, 2.7, AZ);
  for (const zf of [HZ1 + 0.02, AZ + 1.31]) {
    box(1.56, 0.12, 0.10, M.orange, AX, 2.36, zf);                       // head
    box(0.08, 2.36, 0.10, M.orange, AX - 0.74, 1.18, zf);                // jambs
    box(0.08, 2.36, 0.10, M.orange, AX + 0.74, 1.18, zf);
    box(0.10, 0.24, 0.07, M.metal, AX + 0.55, 1.1, zf + 0.06);           // latch
  }

  // =====================================================================
  // 2. server racks: 2 rows x 4, 0.8 x 2.2 x 1.2 m (42U class) — installed capacity 8 racks
  // =====================================================================
  const leds = [];
  const rackPos = [];
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const x = -1 + i * 2.0, z = r === 0 ? -3.6 : 0.6;               // fronts meet at the aisle z ~ -1.5
    const front = r === 0 ? 1 : -1;
    rackPos.push({ x, z, front });
    box(0.8, 2.2, 1.2, M.rackSide, x, 1.1, z);
    box(0.76, 2.1, 0.03, M.dark, x, 1.12, z + front * 0.6);          // front door panel
    box(0.82, 0.06, 1.24, M.metal, x, 2.23, z);                      // top cap
    for (let k = 0; k < 8; k++) {
      const m = lit(k % 2 ? 0x59ff8f : 0x40b0ff);
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), m);
      led.position.set(x - 0.3 + (k % 4) * 0.2, 0.55 + Math.floor(k / 4) * 1.0, z + front * 0.63);
      g.add(led); leds.push({ m, base: m.emissive.clone(), ph: (i * 8 + k) * 0.7 });
    }
    cyl(0.03, 0.3, M.hot, x - 0.2, 0.35, z - front * 0.62, 'z');     // rear-door HX couplings
    cyl(0.03, 0.3, M.cold, x + 0.2, 0.35, z - front * 0.62, 'z');
  }
  for (const z of [-4.5, 1.5]) { cyl(0.05, 8.2, M.hot, 2.0, 2.6, z, 'x'); cyl(0.05, 8.2, M.cold, 2.0, 2.8, z, 'x'); }
  box(8.4, 0.05, 0.3, M.metal, 2.0, 2.5, -1.5);                         // cable tray over the aisle

  // =====================================================================
  // 3. MB-1 evaluation-board blade in rack 2 (row A, second rack): design, no silicon fitted
  // =====================================================================
  const R2 = rackPos[1];
  let blade;
  try {
    blade = buildBoard(THREE);
    blade.scale.setScalar(0.7);
    blade.position.set(R2.x, 1.3, R2.z + 0.9);
    g.add(blade);
  } catch (e) {
    blade = box(0.7, 0.024, 0.48, M.pale, R2.x, 1.3, R2.z + 0.9);      // no DOM: placeholder tray
  }
  box(0.78, 0.06, 0.62, M.steel, R2.x, 1.27, R2.z + 0.9);
  box(0.06, 0.4, 0.02, M.orange, R2.x + 0.42, 1.5, R2.z + 0.62);
  const cablePts = [];
  const SX = 7, SY = 3.3, SZ = HZ0 + 0.35;
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    cablePts.push(new THREE.Vector3(R2.x + 0.3 + (SX - 2.5 - R2.x) * u, 1.35 + 1.1 * Math.sin(Math.PI * u) + (SY - 1.35) * u * u,
      R2.z + 0.9 + (SZ + 0.2 - R2.z - 0.9) * u));
  }
  const cableMat = lit(0x2affc8);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePts), 40, 0.02, 6), cableMat));
  nightMats.push(cableMat);

  // =====================================================================
  // 4. CDU at the west wall + wall penetrations; switchboard/UPS; fibre entry
  // =====================================================================
  const CX = HX0 + 1.2, CZ = -5.0;
  box(1.6, 2.0, 1.0, M.white, CX, 1.0, CZ);
  box(1.2, 0.5, 0.02, M.dark, CX, 1.5, CZ + 0.51);
  const cduPumpA = cyl(0.22, 0.5, M.steel, CX - 0.4, 0.5, CZ + 0.4, 'z'); cduPumpA.name = 'cdu_pump_a';
  const cduPumpB = cyl(0.22, 0.5, M.steel, CX + 0.4, 0.5, CZ + 0.4, 'z'); cduPumpB.name = 'cdu_pump_b';
  cyl(0.06, 4.4, M.hot, CX, 2.6, CZ + 0.4, 'z'); cyl(0.06, 4.4, M.cold, CX, 2.8, CZ + 0.4, 'z');
  cyl(0.06, 2.0, M.hot, CX, 1.7, CZ, 'y'); cyl(0.06, 2.0, M.cold, CX + 0.3, 1.8, CZ, 'y');
  for (const [mat, y] of [[M.hot, 1.2], [M.cold, 0.8]]) {
    cyl(0.08, 1.6, mat, HX0, y, CZ, 'x');
    box(0.5, 0.5, 0.5, M.steel, HX0 - 0.25, y, CZ);
  }
  box(1.4, 2.0, 0.6, M.pale, HX1 - 1.0, 1.0, -5.5); box(1.0, 0.3, 0.02, M.dark, HX1 - 1.0, 1.7, -5.19);
  box(1.4, 2.0, 0.6, M.pale, HX1 - 1.0, 1.0, -3.9); box(1.0, 0.3, 0.02, M.dark, HX1 - 1.0, 1.7, -3.59);
  const upsLed = lit(0x59ff8f);
  const upsLedMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), upsLed);
  upsLedMesh.position.set(HX1 - 1.4, 1.2, -3.58); g.add(upsLedMesh); nightMats.push(upsLed);
  box(0.9, 1.8, 0.5, M.orange, HX1 - 0.8, 0.9, 4.5); box(0.6, 0.25, 0.02, M.dark, HX1 - 0.8, 1.5, 4.76);
  cyl(0.06, 1.0, M.steel, HX1 - 0.8, 0.5, 4.9, 'y');

  // =====================================================================
  // 5. workstation + die plate on a plinth (rendered from the GDS layout; no silicon exists)
  // =====================================================================
  box(3.0, 0.12, 1.2, M.pale, 12.5, 1.05, 4.0);
  for (const dx of [-1.3, 1.3]) box(0.1, 1.0, 0.1, M.metal, 12.5 + dx, 0.5, 4.0);
  const monM = lit(0x1a3a2a);
  box(1.5, 0.9, 0.06, monM, 12.5, 1.75, 3.7); nightMats.push(monM);
  box(0.3, 0.6, 0.3, M.dark, 13.9, 0.3, 4.2);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.9, 20), M.metal); plinth.position.set(16.5, 0.45, 3.0); g.add(plinth);
  let plateMat = M.dark;
  if (hasDOM) {
    const cv = document.createElement('canvas'); cv.width = 332; cv.height = 216;
    const c = cv.getContext('2d');
    c.fillStyle = '#1b1c22'; c.fillRect(0, 0, 332, 216);
    c.strokeStyle = '#c8a24a'; c.lineWidth = 3; c.strokeRect(3, 3, 326, 210);
    c.fillStyle = '#3d4658';
    for (const [x, y] of [[14, 14], [182, 14], [14, 118], [182, 118]]) c.fillRect(x, y, 136, 84);   // 4 macros, 0.2 px/um
    c.fillStyle = '#c8a24a'; c.fillRect(158, 100, 16, 16);                                          // logic core
    c.fillStyle = '#e9e2d0'; c.font = 'bold 13px monospace';
    c.fillText('MB-1 sky130  1660 x 1080 um  (design)', 14, 208); c.fillText('SRAM', 60, 60); c.fillText('SRAM', 228, 60);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    plateMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.3 });
  }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.02, 0.43), [M.dark, M.dark, plateMat, M.dark, M.dark, M.dark]);
  plate.position.set(16.5, 0.92, 3.0); g.add(plate);

  // =====================================================================
  // 5b. roster board (ops-roster-01 part, hosted here since r1.1): free-standing, faces the airlock door (+Z).
  //     Data = roster-data.js as generated by its owner; null renders as an empty frame, never as zero.
  //     Clearances: switchboard back row z <= -3.6, plinth z >= 2.4, racks x <= 5.4.
  // =====================================================================
  const RBX = 17.0, RBZ = -2.0;
  const roster = RosterBoard(THREE, ROSTER);
  roster.position.set(RBX, 0, RBZ); g.add(roster);
  nightMats.push(...roster.userData.nightMats);

  // =====================================================================
  // 6. HERO screen (north wall, faces +Z): MB-1 bit-exact sampler, self-test on boot
  // =====================================================================
  let canvas, ctx, screenTex;
  if (hasDOM) {
    canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 576;
    ctx = canvas.getContext('2d');
    screenTex = new THREE.CanvasTexture(canvas); screenTex.colorSpace = THREE.SRGBColorSpace;
  }
  // the screen is self-lit: emissive map = the live canvas (engine scales emissiveIntensity at night)
  const screenM = hasDOM
    ? new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 1.0, roughness: 0.4 })
    : lit(0x0e1c14);
  nightMats.push(screenM);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(7.1, 4.0), screenM);
  screen.position.set(SX, SY, SZ); g.add(screen);
  box(7.6, 4.5, 0.2, M.dark, SX, SY, SZ - 0.11);

  const cdf = parseCdf(MB1.cdfHex);
  const alphabet = MB1.alphabet;
  let selfTest = 'FAIL';
  {
    const s = makeSampler(cdf, alphabet, MB1.seed, 0, 0);
    let out = ''; for (let i = 0; i < MB1.n_golden; i++) out += s();
    selfTest = out === MB1.golden ? 'PASS' : 'FAIL';
  }
  // (self-test result is stored on root.userData below)
  const live = makeSampler(cdf, alphabet, MB1.seed, 0, 0);
  const boot = [
    'MARS COMPUTE CENTER  r1', '', '$ python hello_mars.py', 'HELLO MARS', '',
    '$ mb1 selftest --table mb1-cdf-data --seed 0x' + MB1.seed.toString(16),
    'MB-1 bit-exact vs python golden: ' + selfTest + ' (' + MB1.n_golden + ' chars)',
    '$ spi probe rack2/mb1-eval', 'MB-1 blade: board design present, no silicon fitted',
    '', '$ mb1 run --table mb1-cdf-data --temp 0', '',
  ];
  let lines = [], cur = '', phase = 0, timer = 0, gen = 0;
  function draw() {
    if (!hasDOM) return;
    ctx.fillStyle = '#0e1c14'; ctx.fillRect(0, 0, 1024, 576);
    ctx.strokeStyle = '#2a7a45'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 1018, 570);
    ctx.fillStyle = '#1a5c2e'; ctx.fillRect(0, 0, 1024, 58);
    ctx.fillStyle = '#b6ffd4'; ctx.font = 'bold 34px "Consolas", monospace';
    ctx.fillText('MARS COMPUTE CENTER  //  MB-1 bigram (bit-exact)', 22, 42);
    ctx.font = 'bold 34px "Consolas", monospace';
    const all = [...lines, cur + (Math.floor(gen * 2) % 2 ? '_' : '')];
    const vis = all.slice(-12);
    vis.forEach((ln, i) => { ctx.fillStyle = /FAIL/.test(ln) ? '#ff5c5c' : '#4dff9f'; ctx.fillText(ln, 26, 108 + i * 40); });
    screenTex.needsUpdate = true;
  }
  draw();

  // =====================================================================
  // 7. radiator field (ledger/03_thermal.json): 3 panels 12 x 4.5 m, tilt 70 deg, top face north
  // =====================================================================
  const TILT = THREE.MathUtils.degToRad(20);       // from vertical about x: normal (0, sin20, -cos20) = up + north
  const PX = -14, PL = 12, PH = 4.5, PT = 0.15;
  for (const z of [-6.5, 0, 6.5]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(PL, PH, PT), M.rad);
    p.rotation.x = TILT; p.position.set(PX, 0.35 + PH / 2 * Math.cos(TILT), z + PH / 2 * Math.sin(TILT)); g.add(p);
    const skin = new THREE.Mesh(new THREE.PlaneGeometry(PL - 0.2, PH - 0.2), M.radDust);   // dust film on the north face
    skin.rotation.x = TILT + Math.PI; skin.position.copy(p.position).add(new THREE.Vector3(0, Math.sin(TILT) * 0.09, -Math.cos(TILT) * 0.09)); g.add(skin);
    for (let k = 0; k <= 4; k++) {                                       // A-frame struts on the south side
      const x = PX - PL / 2 + k * 3;
      const top = new THREE.Vector3(x, 0.35 + PH * Math.cos(TILT), z + PH * Math.sin(TILT));
      const foot = new THREE.Vector3(x, 0.1, z + 2.4);
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, top.distanceTo(foot)), M.steel);
      strut.position.copy(top).lerp(foot, 0.5); strut.lookAt(top); g.add(strut);
      box(0.4, 0.2, 0.4, M.steel, x, 0.1, z + 2.4);
      box(0.4, 0.2, 0.4, M.steel, x, 0.1, z);
    }
    cyl(0.07, PL + 0.4, M.hot, PX, 0.28, z - 0.25, 'x');               // foot headers, north side
    cyl(0.07, PL + 0.4, M.cold, PX, 0.28, z - 0.45, 'x');
    cyl(0.07, 6.6, M.hot, PX + PL / 2 + 3.2, 0.28, z - 0.25, 'x');       // branch to the trunk
    cyl(0.07, 6.6, M.cold, PX + PL / 2 + 3.2, 0.28, z - 0.45, 'x');
  }
  cyl(0.09, 14.4, M.hot, HX0 - 0.5, 0.28, 0.0, 'z'); cyl(0.09, 14.4, M.cold, HX0 - 0.9, 0.28, 0.0, 'z');
  cyl(0.09, 1.6, M.hot, HX0 - 0.5, 0.75, CZ, 'y'); cyl(0.09, 1.6, M.cold, HX0 - 0.9, 0.55, CZ, 'y');
  for (const z of [-6.5, -3.2, 0, 3.2, 6.5]) box(0.7, 0.16, 0.3, M.steel, HX0 - 0.7, 0.08, z);
  for (const [x, z] of [[-20.5, -9.5], [-8.0, -9.5], [-20.5, 9.5], [-8.0, 9.5]]) box(0.1, 1.1, 0.1, M.orange, x, 0.55, z);
  for (const x of [-20.5, -8.0]) box(0.06, 0.06, 19, M.orange, x, 1.05, 0);
  for (const z of [-9.5, 9.5]) box(12.5, 0.06, 0.06, M.orange, -14.25, 1.05, z);
  cyl(0.05, 5, M.metal, -20.5, 2.5, -9.5, 'y');
  const lampM = new THREE.MeshStandardMaterial({ color: 0xff3020, emissive: 0xff3020, emissiveIntensity: 0.8, roughness: 0.5 }); blinkMats.push(lampM);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), lampM); lamp.position.set(-20.5, 5.1, -9.5); g.add(lamp);

  // =====================================================================
  // 8. work marks: ruts to the airlock, scattered rocks (deterministic)
  // =====================================================================
  let _seed = 20260906; const rnd = () => { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; };
  for (const dx of [-0.6, 0.6]) box(0.5, 0.03, 6.5, M.dark, AX + dx, 0.01, PD / 2 - 3.0);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 26; i++) {
    const s = 0.08 + rnd() * 0.16;
    const rock = new THREE.Mesh(rockGeo, new THREE.MeshLambertMaterial({ color: rnd() < 0.5 ? 0x8a5a3c : 0x5d3d2c }));
    const x = -PW / 2 + rnd() * PW, z = (rnd() < 0.5 ? -1 : 1) * (PD / 2 - 0.4 - rnd() * 0.8);
    rock.position.set(x, 0.04 + 1.62 * s * 0.6 - 0.3 * s * 0.6, z); rock.scale.set(s, s * 0.6, s); rock.rotation.y = rnd() * 6.28;
    g.add(rock);
  }
  const dust = new THREE.Color(0x9e5b3d);
  [M.pale, M.white, M.orange, M.metal, M.steel].forEach(m => m.color.lerp(dust, 0.05));

  // =====================================================================
  // engine hooks
  // =====================================================================
  root.userData.nightMats = nightMats;
  root.userData.blinkMats = blinkMats;
  root.userData.spinners = [{ node: 'cdu_pump_a', axis: 'z', rpm: 90 }, { node: 'cdu_pump_b', axis: 'z', rpm: 90 }];
  root.userData.lights = [
    { color: 0x59ff8f, pos: [SX, SY + PAD_T, SZ + 2], range: 22 },
    { color: 0xbfe0ff, pos: [HX, 5.2 + PAD_T, 0], range: 24 },
    { color: 0xbfffe0, pos: [R2.x, 1.8 + PAD_T, R2.z + 1.4], range: 5 },
    { color: 0xffd9a0, pos: [AX, 2.3 + PAD_T, AZ + 1.6], range: 8 },
  ];
  anchor('screen', SX, 5.6, SZ + 0.6);
  anchor('mb1', R2.x, 2.0, R2.z + 0.9);
  anchor('racks', 3.0, 3.0, -1.5);
  anchor('cdu', CX, 2.6, CZ);
  anchor('radiator', PX, 5.2, 0);
  anchor('power', HX1 - 1.0, 2.6, -4.7);
  anchor('datalink', HX1 - 0.8, 2.4, 4.5);
  anchor('radiation', 8, H + 2.5, -2);
  anchor('die', 16.5, 1.6, 3.0);
  anchor('airlock', AX, 3.4, AZ);
  anchor('roster', RBX, 2.9, RBZ);

  root.userData.mb1SelfTest = selfTest;
  root.userData.roster = roster.userData.roster;       // owner's schema / version / counts, read by the smoke test
  root.userData.animate = (t, dt) => {
    for (const l of leds) l.m.emissive.copy(l.base).multiplyScalar(0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 6 + l.ph)));
    blade.userData && blade.userData.animate && blade.userData.animate(t, dt);
    cableMat.emissive.setHSL(0.45, 1, 0.42 + 0.22 * Math.sin(t * 6));
    gen += dt; timer += dt;
    const step = phase < 900 ? 0.045 : 0.06;
    if (timer < step) return;
    timer = 0;
    if (phase < boot.length) {
      const target = boot[phase];
      if (cur.length < target.length) cur += target[cur.length];
      else { lines.push(cur); cur = ''; phase++; if (phase === boot.length) phase = 999; }
    } else {
      const c = live();
      if (cur.length > 46 && c === ' ') { lines.push(cur); cur = ''; }
      else cur += c;
      if (lines.length > 40) lines = lines.slice(-24);
    }
    draw();
  };
  return root;
}
