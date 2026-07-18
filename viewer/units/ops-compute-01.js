// 计算中心 —— 火星城 v0 的收官单元。大屏上真实运行一个字符级 bigram
// 语言模型（nanoGPT 教程的起点模型），在浏览器里 live 生成火星文本：
// 真实世界 → 建模进虚拟世界 → 虚拟世界里的计算中心真的在跑 AI 代码，闭环。
//
// 闭环的另一半（07-18 接入）：大屏跑的这个 bigram 算法已被做成真芯片 MB-1
// （RTL→FPGA→sky130 GDS，mars-bigram 项目），一块 MB-1 评估板作为刀片插在
// 2 号机架上——软件孪生在屏上，硅片本体在架里，同一个算法两种实现。
// 板 3D 复用 mb1-demo-board.js（纹理绘自真实版图,不 import three,契约合规）。
import { buildBoard } from './mb1-demo-board.js';

export const meta = {
  id: 'ops-compute-01', name: '计算中心',
  size_m: 26, size_axis: 'width', effects: ['glow_windows', 'blink'],
};

export function build(THREE) {
  const g = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: 0x2a2e36, roughness: 0.8,
    side: THREE.DoubleSide });                    // visible from inside too (room)
  const pale = new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.6 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.5, metalness: 0.5 });
  const rad = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc8a24a, roughness: 0.4, metalness: 0.7 });
  const nightMats = [];

  // ---- platform + hall ----
  const W = 26, D = 18, H = 6;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), hull);
  pad.position.y = -0.2; g.add(pad);
  const hall = new THREE.Mesh(new THREE.BoxGeometry(W - 2, H, D - 2), hull);
  hall.position.y = H / 2; g.add(hall);
  // glass front (viewing the screen from outside), +Z
  const glassM = new THREE.MeshStandardMaterial({ color: 0x9fd0e0, roughness: 0.1,
    metalness: 0.2, transparent: true, opacity: 0.28 });
  const glass = new THREE.Mesh(new THREE.BoxGeometry(W - 4, H - 1.5, 0.1), glassM);
  glass.position.set(0, H / 2, (D - 2) / 2 + 0.02); g.add(glass);
  const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(W - 1.6, 0.4, D - 1.6), metal);
  roofTrim.position.y = H; g.add(roofTrim);

  // ---- server rack rows on the LEFT, leaving a central aisle to the screen ----
  const leds = [];
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 4; i++) {
      const rk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.4, 1.0), dark);
      const x = -9 + r * 1.8, z = -3 + i * 1.9;     // two columns, along -X wall
      rk.position.set(x, 1.9, z); g.add(rk);
      for (let k = 0; k < 6; k++) {                  // front LED strip (blinks)
        const m = new THREE.MeshBasicMaterial({ color: k % 2 ? 0x59ff8f : 0x40b0ff });
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), m);
        led.position.set(x + 0.75, 1.2 + Math.floor(k / 3) * 0.5, z - 0.35 + (k % 3) * 0.35);
        g.add(led); leds.push({ m, base: m.color.clone(), ph: Math.random() * 6.28 });
      }
    }
  }

  // ---- cooling radiator wall (Mars: reject heat by radiation) ----
  for (let i = 0; i < 10; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.5, 4.0), rad);
    fin.position.set(-(W - 2) / 2 - 0.5, 2.4, -4 + i * 0.9); g.add(fin);
  }

  // ---- MB-1 评估板：作为刀片插进 2 号机架前脸(x=-7.2 那列, z=0.8 的机架) ----
  // 大屏跑的 bigram 的硅实现,就插在算它的机器里。板面朝 +X(走道侧)。
  const blade = buildBoard(THREE);
  blade.scale.setScalar(1.15);
  blade.rotation.z = Math.PI / 2;
  blade.rotation.y = Math.PI / 2;
  blade.position.set(-6.0, 2.0, 0.8);      // 半插入 rack(-7.2,z=0.8),露出朝走道(+X)
  g.add(blade);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.0, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x0a0b0e, roughness: 0.5 }));
  slot.position.set(-6.5, 2.0, 0.8); g.add(slot);
  // 数据脉冲光缆:板 -> 大屏(表示"板算 bigram 喂给 nanogpt.py")
  const cablePts = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    cablePts.push(new THREE.Vector3(-6.4 + u * 8.4, 1.95 - 0.5 * Math.sin(Math.PI * u) + u * 1.3,
      0.8 - u * 6.6));
  }
  const cableMat = new THREE.MeshBasicMaterial({ color: 0x2affc8 });
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePts), 40, 0.025, 6), cableMat);
  g.add(cable); nightMats.push(cableMat);

  // ---- workstation + chip on display pedestal (RIGHT side) ----
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 1.4), pale);
  desk.position.set(7, 1.1, 3); g.add(desk);
  for (const dx of [-1.4, 1.4]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), metal);
    leg.position.set(7 + dx, 0.55, 3); g.add(leg);
  }
  const monM = new THREE.MeshBasicMaterial({ color: 0x1a3a2a });
  const mon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 0.08), monM);
  mon.position.set(7, 1.85, 2.7); g.add(mon); nightMats.push(monM);
  // chip package on a lit pedestal — the "芯片" on display
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.9, 20), metal);
  ped.position.set(9.5, 0.45, 3); g.add(ped);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), dark);
  chip.position.set(9.5, 0.96, 3); g.add(chip);
  const die = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.13, 0.4), gold);
  die.position.set(9.5, 0.98, 3); g.add(die);
  for (const sx of [-1, 1]) {                   // gold pins on two sides
    const pins = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.6), gold);
    pins.position.set(9.5 + sx * 0.37, 0.9, 3); g.add(pins);
  }

  // ---- HERO screen: live AI program ----
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 576;
  const ctx = canvas.getContext('2d');
  const screenTex = new THREE.CanvasTexture(canvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const SX = 2, SY = 3.3, SZ = -(D - 2) / 2 + 0.15;   // back-center, faces +Z
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(7.1, 4.0), screenMat);
  screen.position.set(SX, SY, SZ); g.add(screen);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(7.6, 4.5, 0.2), dark);
  bezel.position.set(SX, SY, SZ - 0.06); g.add(bezel);

  // --- the AI: char-level bigram model (nanoGPT's starting model) ---
  // trained (counted) live from a small Mars corpus, then samples char by char
  const corpus = (
    'hello mars. the red planet turns beneath a butterscotch sky. ' +
    'jezero crater remembers an ancient river and its patient delta. ' +
    'dust settles on solar panels while reactors hum in the cold. ' +
    'we model the real world and mirror it into a virtual one. ' +
    'a small mind wakes in silicon and dreams of water and light. ' +
    'from orbit the relays whisper home across the dark. ' +
    'life, if it is here, hides deep beneath the rust and ice. '
  ).repeat(3);
  const model = {};
  for (let i = 0; i < corpus.length - 1; i++) {
    const a = corpus[i], b = corpus[i + 1];
    (model[a] ??= {}); model[a][b] = (model[a][b] || 0) + 1;
  }
  const sample = (a) => {
    const m = model[a] || model[' '];
    let tot = 0; for (const k in m) tot += m[k];
    let r = Math.random() * tot;
    for (const k in m) { r -= m[k]; if (r <= 0) return k; }
    return ' ';
  };

  const boot = [
    'MARS COMPUTE CENTER  v0', '', '$ python hello_mars.py',
    'HELLO MARS', '', '$ spi probe rack2/mb1-eval', 'MB-1 ASIC  OK  (bigram in silicon)',
    '', '$ python nanogpt.py  --model bigram  --sample', '',
  ];
  let lines = [], cur = '', last = ' ', phase = 0, bi = 0, timer = 0, gen = 0;
  function draw() {
    ctx.fillStyle = '#0e1c14'; ctx.fillRect(0, 0, 1024, 576);
    ctx.strokeStyle = '#2a7a45'; ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 1018, 570);                          // screen border
    ctx.fillStyle = '#1a5c2e'; ctx.fillRect(0, 0, 1024, 58);  // title bar
    ctx.fillStyle = '#b6ffd4'; ctx.font = 'bold 34px "Consolas", monospace';
    ctx.fillText('MARS COMPUTE CENTER  //  nanogpt.py', 22, 42);
    ctx.fillStyle = '#4dff9f'; ctx.font = 'bold 34px "Consolas", monospace';
    const all = [...lines, cur + (Math.floor(gen * 2) % 2 ? '_' : '')];
    const vis = all.slice(-12);
    vis.forEach((ln, i) => ctx.fillText(ln, 26, 108 + i * 40));
    screenTex.needsUpdate = true;
  }
  draw();

  // ---- night glow + light hooks ----
  g.userData.nightMats = nightMats;
  g.userData.lights = [
    { color: 0x59ff8f, pos: [2, 3.3, -5], range: 22 },    // screen wash
    { color: 0xbfe0ff, pos: [0, 5, 2], range: 26 },
    { color: 0xbfffe0, pos: [-6.0, 2.3, 1.3], range: 6 }, // MB-1 刀片提示光
  ];
  // ---- POI knowledge cards ----
  // (poi_ anchors so the engine can float labels / cards)
  const anchor = (id, x, y, z) => {
    const a = new THREE.Object3D(); a.name = 'poi_' + id;
    a.position.set(x, y, z); g.add(a);
  };
  anchor('screen', 2, 5.6, -5);
  anchor('racks', -8, 4, -1);
  anchor('chip', 9.5, 1.6, 3);
  anchor('cooling', -(W - 2) / 2 - 0.5, 5, -1.5);
  anchor('mb1', -6.2, 3.0, 0.8);                  // MB-1 评估板刀片

  // ---- animation: LED blink + run the AI program on the screen ----
  g.userData.animate = (t, dt) => {
    for (const l of leds)                         // rack activity blink
      l.m.color.copy(l.base).multiplyScalar(0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 6 + l.ph)));
    blade.userData.animate && blade.userData.animate(t, dt);   // MB-1 心跳灯
    cableMat.color.setHSL(0.45, 1, 0.42 + 0.22 * Math.sin(t * 6));   // 数据脉冲
    gen += dt;
    timer += dt;
    const step = phase < 2 ? 0.045 : 0.06;        // typing speed
    if (timer < step) return;
    timer = 0;
    if (phase < boot.length) {                    // type the boot lines
      // reveal boot line char by char via cur
      const target = boot[phase];
      if (cur.length < target.length) cur += target[cur.length];
      else { lines.push(cur); cur = ''; phase++; if (phase === boot.length) phase = 999; }
    } else {                                      // stream the bigram model
      const c = sample(last); last = c;
      if (c === '\n' || cur.length > 46) { lines.push(cur); cur = ''; }
      else cur += c;
      if (lines.length > 40) lines = lines.slice(-24);
    }
    draw();
  };
  return g;
}
