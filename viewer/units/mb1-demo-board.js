// MB1-DEMO 演示板 3D —— 由真实版图几何生成(mars-bigram 项目交付)。
// 铜线/焊盘纹理直接绘自 EasyEDA 导出的 467 段走线;DIP-24 插座里插着
// MB-1 陶瓷金盖工程样片。buildBoard() 返回 group,内建 userData.animate
// (心跳 LED 按 MB-1 HEARTBEAT 语义闪烁)。单位:米,板长约 1 米(展品比例),
// 用 group.scale 自行缩放。
import { GEO } from './mb1-demo-geo.js';

export function buildBoard(THREE, opts = {}) {
  const g = new THREE.Group();
  const MIL = 1 / 2600;              // 板长 2600mil -> 1m
  const W = 2600 * MIL, D = 1800 * MIL, T = 0.024;   // 板厚(展品比例)

  // ---- PCB 顶面纹理:真实铜线 + 焊盘 ----
  const cw = 2048, ch = Math.round(2048 * 1800 / 2600);
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const c = cv.getContext('2d');
  const px = (x) => x / 2600 * cw;
  const py = (y) => (-y) / 1800 * ch;          // y 负向下 -> 画布向下
  c.fillStyle = '#0d3b26'; c.fillRect(0, 0, cw, ch);
  // L2 走线(板下,透过阻焊隐约可见)
  c.strokeStyle = '#0a2f1e'; c.lineCap = 'round';
  for (const [L, w, x1, y1, x2, y2] of GEO.tracks) {
    if (L !== 2) continue;
    c.lineWidth = Math.max(2, w / 2600 * cw * 0.9);
    c.beginPath(); c.moveTo(px(x1), py(y1)); c.lineTo(px(x2), py(y2)); c.stroke();
  }
  // L1 走线(阻焊下铜色泛亮)
  c.strokeStyle = '#1d6b3e';
  for (const [L, w, x1, y1, x2, y2] of GEO.tracks) {
    if (L !== 1) continue;
    c.lineWidth = Math.max(2.5, w / 2600 * cw);
    c.beginPath(); c.moveTo(px(x1), py(y1)); c.lineTo(px(x2), py(y2)); c.stroke();
  }
  // 焊盘(沉金)
  for (const [x, y, w, h, th] of GEO.pads) {
    c.fillStyle = th ? '#d9b545' : '#c9a83c';
    c.fillRect(px(x) - w / 2600 * cw / 2, py(y) - h / 1800 * ch / 2,
               Math.max(3, w / 2600 * cw), Math.max(3, h / 1800 * ch));
    if (th) {
      c.fillStyle = '#111';
      c.beginPath();
      c.arc(px(x), py(y), Math.max(2, Math.min(w, h) / 2600 * cw * 0.28), 0, 6.29);
      c.fill();
    }
  }
  // 过孔
  for (const [x, y] of GEO.vias) {
    c.fillStyle = '#d9b545';
    c.beginPath(); c.arc(px(x), py(y), 5, 0, 6.29); c.fill();
    c.fillStyle = '#0d3b26';
    c.beginPath(); c.arc(px(x), py(y), 2.2, 0, 6.29); c.fill();
  }
  // 丝印
  c.fillStyle = '#e8e8e8'; c.font = 'bold 46px monospace';
  c.fillText('MB1-DEMO revA', 60, ch - 40);
  c.font = '30px monospace';
  c.fillText('MARS BIGRAM ASIC EVAL', 60, ch - 90);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  // ---- 板体 ----
  const pcbTop = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
  const pcbSide = new THREE.MeshStandardMaterial({ color: 0x0a3320, roughness: 0.7 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(W, T, D),
    [pcbSide, pcbSide, pcbTop, pcbSide, pcbSide, pcbSide]);
  board.position.y = -T / 2;
  g.add(board);

  // 器件坐标 -> 板面局部 (板中心为原点, y=0 为板顶面)
  const lx = (x) => (x - 1300) * MIL;
  const lz = (y) => (-y - 900) * MIL;

  // ---- 材质 ----
  const black = new THREE.MeshStandardMaterial({ color: 0x17181d, roughness: 0.5 });
  const ceramic = new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 0.8 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8b545, roughness: 0.35, metalness: 0.75 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.35, metalness: 0.8 });
  const boxAt = (mat, ref, w, h, d, dy = 0) => {
    const [x, y] = GEO.comps[ref];
    const m = new THREE.Mesh(new THREE.BoxGeometry(w * MIL, h * MIL, d * MIL), mat);
    m.position.set(lx(x), (h * MIL) / 2 + dy, lz(y));
    g.add(m); return m;
  };

  // ---- 器件 ----
  boxAt(black, 'U1', 290, 55, 290);                 // LQFP-48 本体
  for (const [sx, sz, w, d] of [[1,0,60,240],[-1,0,60,240],[0,1,240,60],[0,-1,240,60]]) {
    const [x, y] = GEO.comps['U1'];
    const pins = new THREE.Mesh(new THREE.BoxGeometry((w||60) * MIL, 8 * MIL, (d||60) * MIL), gold);
    pins.position.set(lx(x) + sx * 165 * MIL, 6 * MIL, lz(y) + sz * 165 * MIL);
    g.add(pins);
  }
  boxAt(black, 'U2', 200, 60, 150);                 // CH340N SOP-8
  boxAt(black, 'LDO1', 120, 45, 65);                // SOT-23-5
  const usb = boxAt(steel, 'USB1', 300, 110, 220);  // Micro-USB 屏蔽壳
  usb.position.z += 30 * MIL;

  // 排针(黑座 + 金针)
  const header = (ref, n, vertical) => {
    const [x, y] = GEO.comps[ref];
    const len = n * 100;
    const base = new THREE.Mesh(new THREE.BoxGeometry(
      (vertical ? 100 : len) * MIL, 100 * MIL, (vertical ? len : 100) * MIL), black);
    base.position.set(lx(x), 50 * MIL, lz(y)); g.add(base);
    for (let i = 0; i < n; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(25 * MIL, 240 * MIL, 25 * MIL), gold);
      const o = (i - (n - 1) / 2) * 100;
      pin.position.set(lx(x) + (vertical ? 0 : o * MIL), 150 * MIL,
                       lz(y) + (vertical ? o * MIL : 0));
      g.add(pin);
    }
  };
  header('H1', 12, true);
  header('H2', 12, true);
  header('H3', 4, false);
  header('H4', 6, false);

  // ---- MB-1 陶瓷金盖样片,插在 H1/H2 之间的 DIP-24 座上 ----
  const h1 = GEO.comps['H1'], h2 = GEO.comps['H2'];
  const mcx = (h1[0] + h2[0]) / 2, mcy = (h1[1] + h2[1]) / 2;
  const mb1 = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(520 * MIL, 120 * MIL, 1150 * MIL), ceramic);
  body.position.y = 200 * MIL; mb1.add(body);
  // 金盖 + 刻字
  const lidCv = document.createElement('canvas');
  lidCv.width = 256; lidCv.height = 512;
  const lc = lidCv.getContext('2d');
  lc.fillStyle = '#d8b545'; lc.fillRect(0, 0, 256, 512);
  lc.fillStyle = '#6b5416'; lc.font = 'bold 84px monospace';
  lc.save(); lc.translate(128, 256); lc.rotate(Math.PI / 2);
  lc.textAlign = 'center'; lc.fillText('MB-1', 0, 10);
  lc.font = '30px monospace'; lc.fillText('MARS BIGRAM · sky130', 0, 58);
  lc.restore();
  const lidTex = new THREE.CanvasTexture(lidCv);
  lidTex.colorSpace = THREE.SRGBColorSpace;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(330 * MIL, 14 * MIL, 760 * MIL),
    new THREE.MeshStandardMaterial({ map: lidTex, roughness: 0.3, metalness: 0.7 }));
  lid.position.y = 267 * MIL; mb1.add(lid);
  for (const s of [-1, 1]) {                        // 两排 DIP 引脚
    const row = new THREE.Mesh(new THREE.BoxGeometry(30 * MIL, 160 * MIL, 1150 * MIL), gold);
    row.position.set(s * 285 * MIL, 90 * MIL, 0); mb1.add(row);
  }
  mb1.position.set(lx(mcx), 0, lz(mcy));
  g.add(mb1);

  // ---- LED(HB 心跳 / PWR / USER)----
  const mkLed = (ref, color) => {
    const m = new THREE.MeshBasicMaterial({ color });
    const led = new THREE.Mesh(new THREE.BoxGeometry(60 * MIL, 35 * MIL, 35 * MIL), m);
    const [x, y] = GEO.comps[ref];
    led.position.set(lx(x), 20 * MIL, lz(y));
    g.add(led); return m;
  };
  const hb = mkLed('LED2', 0xffb03a);
  const pwr = mkLed('LED1', 0x59ff8f);
  const usr = mkLed('LED3', 0x40b0ff);

  // 心跳:MB-1 每吐一字翻转 HEARTBEAT —— 用吐字节奏闪烁
  g.userData.animate = (t) => {
    const beat = Math.floor(t * 15) % 2;            // ~15 字/秒(演示节流)
    hb.color.setHex(beat ? 0xffb03a : 0x402a08);
    pwr.color.setHex(0x59ff8f);
    usr.color.setHex(Math.floor(t * 2) % 2 ? 0x40b0ff : 0x102a3a);
  };
  g.userData.leds = { hb, pwr, usr };
  return g;
}
