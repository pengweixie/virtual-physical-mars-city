import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { build as buildComRelay, meta as comRelayMeta }
  from './units/com-relay-01.js';
import { build as buildPan, meta as panMeta } from './units/sci-pan-01.js';
import { build as buildComPolar, meta as comPolarMeta } from './units/com-polar-01.js';
import { build as buildComL4, meta as comL4Meta } from './units/com-l4-01.js';
import { build as buildMagicCity } from './magic/magic-city.js';

// ---------------------------------------------------------------- data

const loadingEl = document.getElementById('loading');
const status = (msg) => { if (loadingEl) loadingEl.textContent = msg; };
const q = new URLSearchParams(location.search);

// ---- language (zh / en) -----------------------------------------------------
// Fixed per page-load: everything (UI chrome, tags, cards) localizes at
// creation time; the corner button just persists the choice and reloads.
// Content fields support optional *_en twins (labels, details, meta names).
const LANG = (q.get('lang') || localStorage.getItem('mars_lang') || 'zh')
  .toLowerCase() === 'en' ? 'en' : 'zh';
const pick = (obj, key) =>
  (LANG === 'en' && obj && obj[key + '_en']) ? obj[key + '_en'] : obj?.[key];
const T = LANG === 'en' ? {
  hudTitle: 'Jezero Crater · Perseverance Landing Site',
  hudSub: 'Jezero Crater 18.4°N 77.4°E — real HiRISE terrain, 1 m/px<br>Data: NASA/JPL/University of Arizona',
  hint: 'Click to enter · WASD move · Shift sprint · F fly/walk · Space/Q up-down when flying · N name tags · V inspect · M orbit · U undercity · P to Perseverance · headset: Enter VR',
  orbit: '↑ Orbit view', orbitBack: '↓ Back to surface',
  colony: (on) => `🌱 Future Mars: ${on ? 'ON' : 'OFF'}`,
  magic: (on) => `🔮 Magic Mars: ${on ? 'ON' : 'OFF'}`,
  imperial: (on) => `🏯 Celestial Palace: ${on ? 'ON' : 'OFF'}`,
  under: '⬇ Undercity', now: 'Live', langBtn: '中文',
  music: (on) => `♪ Music: ${on ? 'ON' : 'OFF'}`,
  mission: (sol, utc, n) => `Perseverance sol ${sol} · data ${utc} UTC · ${n} new photos`,
  timeInfo: (hh, mm, live, ls) => `Jezero true solar time ${hh}:${mm}${live ? ' (live)' : ''} · Ls ${ls}°`,
  posSurface: (x, z, e, fly) => `${x}, ${z} m · elev ${e} m · ${fly ? 'flying' : 'walking'}`,
  posOrbit: (alt) => `Orbit altitude ${alt} km · drag to rotate · scroll to zoom`,
  orbLbl: {
    spare: 'Hot spare',
    coverage: 'Areostationary limit ±71° - the caps belong to the polar ring',
    polar: 'Polar-cap ring x3 · 20,428 km polar orbit · closes the ±71° blind zone',
    l4: 'L4 conjunction relay · Sun-Mars L4 · blackout 14 d -> 0 (scale break, 1.52 AU)',
    earth: '→ Earth',
    relay: 'Relay constellation: 3 primary + 1 spare · areostationary, 17,032 km',
    lowOrbiter: 'Science orbiter · 400 km · relays ground data',
    cmb: 'CMB polarization survey station · Sun-Mars L2',
    cmbDist: '1.08 million km from Mars · schematic, not to scale',
    phobos: 'Phobos · 9,376 km · 7.65 h - crosses the sky twice a sol, west to east',
    deimos: 'Deimos · 23,463 km · 30.3 h - near-stationary, hangs for 2.5 sols',
    convoy: 'Methalox export convoy · ~515 ship-loads per synodic window',
    optical: 'Optical uplink · 1550 nm (com-optical-01)',
    inbound: 'Import ship · aerocapture · ~100 t per window, half of it food',
    phobosBase: 'Phobos forward post',
    elevator: 'The space elevator Phobos vetoed - it crosses the tether every 11 h',
  },
  posInterior: (n) => `${n} · indoors`,
  inspectHint: (n) => `Inspect: ${n} · drag to rotate · scroll to zoom · V to exit`,
  interiorHint: (n) => `${n} · WASD to walk · reach the exit or press Esc to return`,
  pressE: (l) => `Press E — enter ${l}`,
  timeWait: 'Computing Martian time…',
} : {
  hudTitle: '耶泽罗撞击坑 · 毅力号着陆区',
  hudSub: 'Jezero Crater 18.4°N 77.4°E — HiRISE 1 m/px 真实地形<br>数据：NASA/JPL/University of Arizona',
  hint: '点击进入 · WASD 移动 · Shift 加速 · F 飞行/行走 · 飞行时 Space/Q 升降 · N 名称标签 · V 环视设备 · M 轨道视角 · U 地下城 · P 传送到毅力号 · 头显点 Enter VR',
  orbit: '↑ 轨道视角', orbitBack: '↓ 返回地表',
  colony: (on) => `🌱 未来火星：${on ? '开' : '关'}`,
  magic: (on) => `🔮 魔幻火星：${on ? '开' : '关'}`,
  imperial: (on) => `🏯 天宫城：${on ? '开' : '关'}`,
  under: '⬇ 地下城', now: '实时', langBtn: 'EN',
  music: (on) => `♪ 音乐：${on ? '开' : '关'}`,
  mission: (sol, utc, n) => `毅力号任务日 Sol ${sol} · 数据更新 ${utc} UTC · 最新照片 ${n} 张`,
  timeInfo: (hh, mm, live, ls) => `耶泽罗真太阳时 ${hh}:${mm}${live ? '（实时）' : ''} · Ls ${ls}°`,
  posSurface: (x, z, e, fly) => `坐标 ${x}, ${z} m · 海拔 ${e} m · ${fly ? '飞行' : '行走'}模式`,
  posOrbit: (alt) => `轨道高度 ${alt} km · 拖动旋转 · 滚轮缩放`,
  orbLbl: {
    spare: '备份星',
    coverage: '静止轨道覆盖极限 ±71°——极帽已由极轨星接管',
    polar: '极轨补盲三星 · 20,428 km 极轨 · 封住 ±71° 盲区',
    l4: 'L4 合日中继 · 日火 L4 · 黑障 14 天 → 0(比例断裂,1.52 AU)',
    earth: '→ 地球',
    relay: '中继星 ×3 主 + 1 备份 · 火星静止轨道 17,032 km',
    lowOrbiter: '科学轨道器 · 400 km · 代传地面数据',
    cmb: 'CMB 偏振巡天站 · 日-火 L2',
    cmbDist: '距火星 108万 km · 示意未按比例',
    phobos: '火卫一 · 9,376 km · 7.65 h——每 sol 过境两次,西升东落',
    deimos: '火卫二 · 23,463 km · 30.3 h——近乎驻留,一挂两天半',
    convoy: '甲烷氧出口船队 · 每会合窗口约 515 船',
    optical: '光通信上行 · 1550 nm(com-optical-01)',
    inbound: '进口船 · 气动捕获 · 每窗口 ~100 t,一半是粮食',
    phobosBase: '火卫一前哨',
    elevator: '被火卫一否决的太空电梯——每 11 h 撞缆一次',
  },
  posInterior: (n) => `${n} · 室内`,
  inspectHint: (n) => `环视：${n} · 拖动旋转 · 滚轮缩放 · V 退出`,
  interiorHint: (n) => `${n} · WASD 走动 · 走到出口或按 Esc 返回地表`,
  pressE: (l) => `按 E 进入 ${l}`,
  timeWait: '火星时间计算中…',
};
let musicSetScene = () => {};  // assigned in the UI block, called by toggleMagic
{
  document.querySelector('#hud h1').textContent = T.hudTitle;
  document.querySelector('#hud .dim').innerHTML = T.hudSub;
  document.getElementById('hint').textContent = T.hint;
  document.getElementById('orbitBtn').textContent = T.orbit;
  document.getElementById('underBtn').textContent = T.under;
  document.getElementById('colonyBtn').textContent = T.colony(false);
  document.getElementById('magicBtn').textContent = T.magic(false);
  document.getElementById('imperialBtn').textContent = T.imperial(false);
  document.getElementById('timeNow').textContent = T.now;
  document.getElementById('timeInfo').textContent = T.timeWait;
  const lb = document.getElementById('langBtn');
  lb.textContent = T.langBtn;
  lb.addEventListener('click', () => {
    const next = LANG === 'en' ? 'zh' : 'en';
    localStorage.setItem('mars_lang', next);
    const u = new URL(location.href);
    u.searchParams.set('lang', next);
    // Switching language reloads the page, so carry the current view across -
    // otherwise the reader is dumped back at the default spawn, which is
    // especially jarring from orbit view or from inside an interior.
    for (const [k, v] of Object.entries(captureViewState())) {
      if (v === null || v === undefined) u.searchParams.delete(k);
      else u.searchParams.set(k, v);
    }
    location.href = u.toString();
  });
  // Ambient scores: "Quiet Infrastructure" for the city, "Glass Moon Halo"
  // for Magic Mars - toggling magic crossfades between them. Autoplay policy
  // blocks sound before a gesture, so the track arms on the first
  // click/keypress; the button is the standing preference and survives
  // reloads (language switch included).
  const mb = document.getElementById('musicBtn');
  const tracks = {
    city: new Audio('audio/quiet-infrastructure.m4a'),
    magic: new Audio('audio/glass-moon-halo.m4a'),
    under: new Audio('audio/bedrock-pulse.m4a'),
    imperial: new Audio('audio/dawn-over-marble-terraces.m4a'),
  };
  for (const a of Object.values(tracks)) { a.loop = true; a.volume = 0; a.preload = 'auto'; }
  let musicOn = localStorage.getItem('mars_music') !== '0';
  let scene = 'city';
  mb.textContent = T.music(musicOn);
  const faders = new Map();
  const fadeTo = (a, target) => {
    clearInterval(faders.get(a));
    const id = setInterval(() => {
      a.volume = Math.max(0, Math.min(0.35, a.volume + (target > a.volume ? 0.02 : -0.05)));
      if (Math.abs(a.volume - target) < 0.02) {
        a.volume = target;
        clearInterval(id);
        if (target === 0) a.pause();
      }
    }, 120);
    faders.set(a, id);
  };
  const current = () => tracks[scene];
  const startMusic = () => {
    if (!musicOn || !current().paused) return;
    current().play().then(() => fadeTo(current(), 0.35)).catch(() => {});
  };
  addEventListener('pointerdown', startMusic);
  addEventListener('keydown', startMusic);
  musicSetScene = (s) => {
    if (s === scene || !tracks[s]) return;
    const prev = current();
    scene = s;
    if (musicOn && !prev.paused) {
      fadeTo(prev, 0);
      current().play().then(() => fadeTo(current(), 0.35)).catch(() => {});
    }
  };
  mb.addEventListener('click', (e) => {
    e.stopPropagation();
    musicOn = !musicOn;
    localStorage.setItem('mars_music', musicOn ? '1' : '0');
    mb.textContent = T.music(musicOn);
    if (musicOn) { current().play().then(() => fadeTo(current(), 0.35)).catch(() => {}); }
    else fadeTo(current(), 0);
  });
}

status('正在下载地形数据…');
const meta = await (await fetch('../data/processed/meta.json')).json();
const heightsRaw = new Uint16Array(
  await (await fetch('../data/processed/heights.bin')).arrayBuffer());

const GRID = meta.grid;                      // vertices per side
const SIZE = meta.size_m;                    // terrain edge length, meters
const RELIEF = meta.elev_max_m - meta.elev_min_m;

// bilinear height lookup; x/z in world meters, origin at terrain center
function sampleHeight(x, z) {
  const fx = THREE.MathUtils.clamp((x / SIZE + 0.5) * (GRID - 1), 0, GRID - 1.001);
  const fz = THREE.MathUtils.clamp((z / SIZE + 0.5) * (GRID - 1), 0, GRID - 1.001);
  const c = Math.floor(fx), r = Math.floor(fz);
  const tx = fx - c, tz = fz - r;
  const h = (rr, cc) => heightsRaw[rr * GRID + cc] / 65535 * RELIEF;
  return (h(r, c) * (1 - tx) + h(r, c + 1) * tx) * (1 - tz)
       + (h(r + 1, c) * (1 - tx) + h(r + 1, c + 1) * tx) * tz;
}

// ---------------------------------------------------------------- scene

status('正在初始化渲染器…');
const scene = new THREE.Scene();
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (err) {
  throw new Error(`WebGL 初始化失败（${err.message}）`);
}
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
// only surface the VR entry when WebXR is actually available — otherwise
// three.js renders a permanent "VR NOT SUPPORTED" badge over the page
if (navigator.xr) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
    if (ok) document.body.appendChild(VRButton.createButton(renderer));
  }).catch(() => {});
}

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 30000);
const rig = new THREE.Group();               // player: rig sits on the ground
rig.add(camera);
camera.position.y = 1.7;                     // desktop eye height
scene.add(rig);

// everything surface-scale (meters) lives in this group; orbit view swaps it out
const surfaceGroup = new THREE.Group();
scene.add(surfaceGroup);

// dusty butterscotch sky + haze
const DUST = new THREE.Color(0xd9a97f);
const dustFog = new THREE.Fog(DUST, 1500, 14000);
scene.fog = dustFog;
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(15000, 32, 15),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      horizon: { value: new THREE.Color(0xe6b184) },
      zenith: { value: new THREE.Color(0x6e4a33) },
      sunDir: { value: new THREE.Vector3(0.5, 0.35, -0.8).normalize() },
      glowColor: { value: new THREE.Color(1.0, 0.85, 0.7) },
      glowK: { value: 0.35 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 horizon, zenith, sunDir, glowColor;
      uniform float glowK;
      varying vec3 vDir;
      void main() {
        float t = smoothstep(-0.05, 0.45, vDir.y);
        vec3 col = mix(horizon, zenith, t);
        float glow = pow(max(dot(normalize(vDir), sunDir), 0.0), 32.0);
        col += glowColor * glow * glowK;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
sky.onBeforeRender = () => sky.position.copy(rig.position);
surfaceGroup.add(sky);

const sunDir = sky.material.uniforms.sunDir.value;
const sun = new THREE.DirectionalLight(0xffe0c0, 2.4);
sun.position.copy(sunDir).multiplyScalar(1000);
scene.add(sun);
const hemi = new THREE.HemisphereLight(0xc8967a, 0x4a3020, 0.9);
scene.add(hemi);

// ---------------------------------------------------------------- terrain

const texture = new THREE.TextureLoader().load('../data/processed/texture.jpg');
texture.colorSpace = THREE.SRGBColorSpace;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

status('正在构建地形网格（210 万三角形）…');
{
  const n = GRID * GRID;
  const pos = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const i = r * GRID + c;
      pos[i * 3] = (c / (GRID - 1) - 0.5) * SIZE;
      pos[i * 3 + 1] = heightsRaw[i] / 65535 * RELIEF;
      pos[i * 3 + 2] = (r / (GRID - 1) - 0.5) * SIZE;
      uv[i * 2] = c / (GRID - 1);
      uv[i * 2 + 1] = 1 - r / (GRID - 1);
    }
  }
  const idx = new Uint32Array((GRID - 1) * (GRID - 1) * 6);
  let k = 0;
  for (let r = 0; r < GRID - 1; r++) {
    for (let c = 0; c < GRID - 1; c++) {
      const a = r * GRID + c, b = a + 1, d = a + GRID, e = d + 1;
      idx[k++] = a; idx[k++] = d; idx[k++] = b;
      idx[k++] = b; idx[k++] = d; idx[k++] = e;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  surfaceGroup.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: texture })));
}

// ---------------------------------------------------------------- orbit view

const ORBIT_R = 3389.5;                      // Mars mean radius; 1 unit = 1 km here
let moonTick = () => {};                     // assigned by the orbit block; ltst-driven
const polarSats = [];                        // com-polar-01 x3, moved by moonTick
let polarPosFn = null;
const orbitGroup = new THREE.Group();
orbitGroup.visible = false;
scene.add(orbitGroup);

const globeTex = new THREE.TextureLoader().load('assets/mars_globe.jpg');
globeTex.colorSpace = THREE.SRGBColorSpace;
globeTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
orbitGroup.add(new THREE.Mesh(
  new THREE.SphereGeometry(ORBIT_R, 128, 64),
  new THREE.MeshLambertMaterial({ map: globeTex })));

{ // starfield
  const n = 4000, p = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.randomDirection().multiplyScalar(150000);
    p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  orbitGroup.add(new THREE.Points(g, new THREE.PointsMaterial(
    { color: 0xffffff, size: 1.5, sizeAttenuation: false, fog: false })));
}

// lat/lon -> position matching three.js equirect sphere UVs
const latLon = (latDeg, lonDeg, r) => {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  return new THREE.Vector3(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    -r * Math.cos(lat) * Math.sin(lon));
};

const jezero = latLon(18.4, 77.4, ORBIT_R);
{ // marker + label over Jezero
  const dot = new THREE.Mesh(new THREE.SphereGeometry(35, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0x7fd4ff }));
  dot.position.copy(jezero).multiplyScalar(1.002);
  orbitGroup.add(dot);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.font = '44px system-ui, sans-serif';
  ctx.fillStyle = '#cfe9ff';
  ctx.textAlign = 'center';
  ctx.fillText('Jezero · 你在这里', 256, 80);
  const label = new THREE.Sprite(new THREE.SpriteMaterial(
    { map: new THREE.CanvasTexture(c), transparent: true }));
  label.scale.set(1100, 275, 1);
  label.position.copy(jezero).multiplyScalar(1.2);
  orbitGroup.add(label);
}

// ---------------------------------------------------------------- mission

// helper: billboard sprite with text
function textSprite(text, px = 44, color = '#cfe9ff') {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.font = `${px}px system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,.8)';
  ctx.shadowBlur = 8;
  ctx.fillText(text, 512, 84);
  const s = new THREE.Sprite(new THREE.SpriteMaterial(
    { map: new THREE.CanvasTexture(c), transparent: true }));
  s.material.map.colorSpace = THREE.SRGBColorSpace;
  s.raycast = () => {};      // labels are UI: never raycast targets (asset
  return s;                  // lidars sweep the scene; Sprite.raycast needs
}                            // raycaster.camera and crashes the frame loop)

// stylized low-poly Perseverance (~3 m long)
function buildRover() {
  const g = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color: 0xd8d2c4 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
  const gold = new THREE.MeshLambertMaterial({ color: 0xb08d57 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.0, 3.0), white);
  body.position.y = 1.15;
  g.add(body);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 2.8), dark);
  deck.position.y = 1.7;
  g.add(deck);
  for (const sx of [-1, 1]) {
    for (const [zi, z] of [-1.25, 0, 1.25].entries()) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 0.42, 20), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx * 1.55, 0.52, z);
      g.add(wheel);
      const strut = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, zi === 1 ? 0.9 : 0.7, 0.1), white);
      strut.position.set(sx * 1.55, 0.9, z);
      g.add(strut);
    }
  }
  const mastPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 1.5, 10), white);
  mastPole.position.set(0.6, 2.4, 1.1);
  g.add(mastPole);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.3), white);
  head.position.set(0.6, 3.2, 1.1);
  g.add(head);
  for (const ex of [-0.16, 0.16]) {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10), dark);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(0.6 + ex, 3.2, 1.27);
    g.add(eye);
  }
  const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 8), gold);
  rtg.rotation.x = Math.PI / 2.6;
  rtg.position.set(0, 1.5, -1.8);
  g.add(rtg);
  return g;
}

let mission = null;
try {
  mission = await (await fetch('../data/mission/mission.json')).json();
} catch { /* no cached mission data yet — layer stays off */ }

let roverAt = null;
if (mission) {
  status('正在铺设毅力号轨迹…');
  const missionGroup = new THREE.Group();
  surfaceGroup.add(missionGroup);
  const HALF = SIZE / 2;

  // traverse line, clipped to the patch, draped on the terrain
  const segs = [];
  let seg = null;
  for (const [x, z] of mission.traverse) {
    if (Math.abs(x) <= HALF && Math.abs(z) <= HALF) {
      (seg ??= []).push(new THREE.Vector3(x, sampleHeight(x, z) + 1.0, z));
    } else if (seg) { segs.push(seg); seg = null; }
  }
  if (seg) segs.push(seg);
  const lineMat = new THREE.LineBasicMaterial(
    { color: 0x9fdcff, transparent: true, opacity: 0.85 });
  for (const s of segs) {
    if (s.length > 1) missionGroup.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(s), lineMat));
  }

  // rover stands at its position if inside the patch, else where it last was
  const wIn = mission.waypoints.filter((w) => w.in);
  roverAt = mission.rover.in ? mission.rover : wIn[wIn.length - 1] ?? null;
  if (roverAt) {
    const ry = sampleHeight(roverAt.x, roverAt.z);
    const rover = buildRover();
    rover.position.set(roverAt.x, ry, roverAt.z);
    missionGroup.add(rover);

    // beacon pillar so it can be spotted from across the crater
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 90, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x9fdcff, transparent: true,
        opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
    beacon.position.set(roverAt.x, ry + 45, roverAt.z);
    missionGroup.add(beacon);

    const tag = mission.rover.in
      ? (LANG === 'en' ? `Perseverance · Sol ${mission.rover.sol}`
        : `毅力号 · Sol ${mission.rover.sol}`)
      : (LANG === 'en'
        ? `Perseverance passed here on Sol ${roverAt.sol} · now ${mission.rover.dist_km} km away`
        : `毅力号 Sol ${roverAt.sol} 曾经过此处 · 现距此 ${mission.rover.dist_km} km`);
    const label = textSprite(tag);
    label.scale.set(26, 3.2, 1);
    label.position.set(roverAt.x, ry + 7.5, roverAt.z);
    missionGroup.add(label);

    // photo wall: latest raw images in an arc behind the rover
    const texLoader = new THREE.TextureLoader();
    mission.photos.slice(0, 9).forEach((p, i) => {
      const t = texLoader.load('../data/mission/' + p.file);
      t.colorSpace = THREE.SRGBColorSpace;
      const photo = new THREE.Mesh(
        new THREE.PlaneGeometry(4.6, 3.45),
        new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
      const ang = (i - 4) * 0.36;
      photo.position.set(
        roverAt.x + Math.sin(ang) * 13,
        ry + 3.4,
        roverAt.z - Math.cos(ang) * 13);
      photo.lookAt(roverAt.x, ry + 3.0, roverAt.z);
      missionGroup.add(photo);
      const cap = textSprite(`Sol ${p.sol} · ${p.camera} · ${p.utc} UTC`, 40, '#f3d9bf');
      cap.scale.set(9, 1.1, 1);
      cap.position.copy(photo.position);
      cap.position.y = ry + 1.15;
      missionGroup.add(cap);
    });
  }

  document.getElementById('missionInfo').textContent =
    T.mission(mission.rover.sol, mission.updated_utc, mission.photos.length);
}

// teleport next to the rover / photo wall
addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' && roverAt && !orbitMode) {
    rig.position.set(roverAt.x + 6, 0, roverAt.z + 6);
    rig.position.y = sampleHeight(rig.position.x, rig.position.z);
    yaw = Math.PI * 0.75; pitch = 0;
  }
});

// ---------------------------------------------------------------- colony (vision mode)

const colonyGroup = new THREE.Group();
colonyGroup.visible = false;
surfaceGroup.add(colonyGroup);
const colonyLights = [];
let haulTick = null;              // ore-hauler animator, registered with unitAnims below

{
  const CX = -350, CZ = -100;                 // flat spot on the crater floor
  const gY = (x, z) => sampleHeight(x, z);
  const mat = {
    hull: new THREE.MeshLambertMaterial({ color: 0xded6c8 }),
    trim: new THREE.MeshLambertMaterial({ color: 0x8a8378 }),
    glass: new THREE.MeshLambertMaterial({ color: 0xa8d8cc, transparent: true,
      opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
    road: new THREE.MeshLambertMaterial({ color: 0x3d312a }),
    panel: new THREE.MeshLambertMaterial({ color: 0x1c2c4e }),
    metal: new THREE.MeshLambertMaterial({ color: 0x9aa0a8 }),
    pad: new THREE.MeshLambertMaterial({ color: 0x35302c }),
    soil: new THREE.MeshLambertMaterial({ color: 0x7a4f36 }),
    window: new THREE.MeshBasicMaterial({ color: 0xffd9a0 }),
    red: new THREE.MeshBasicMaterial({ color: 0xff4433 }),
    greens: [0x2f7d32, 0x3f9142, 0x57a05a, 0x6fae4e].map(
      (c) => new THREE.MeshLambertMaterial({ color: c })),
  };

  // ribbon road draped on the terrain
  function road(x1, z1, x2, z2, w = 5) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(2, Math.ceil(len / 8));
    const dx = (x2 - x1) / len, dz = (z2 - z1) / len;
    const px = -dz * w / 2, pz = dx * w / 2;
    const pos = new Float32Array((n + 1) * 6);
    for (let i = 0; i <= n; i++) {
      const x = x1 + (x2 - x1) * i / n, z = z1 + (z2 - z1) * i / n;
      pos.set([x - px, gY(x - px, z - pz) + 0.15, z - pz,
               x + px, gY(x + px, z + pz) + 0.15, z + pz], i * 6);
    }
    const idx = [];
    for (let i = 0; i < n; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    colonyGroup.add(new THREE.Mesh(g, mat.road));
  }

  // central dome
  const domeY = gY(CX, CZ);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat.hull);
  dome.position.set(CX, domeY, CZ);
  colonyGroup.add(dome);
  const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(15, 15.5, 1.2, 32), mat.trim);
  domeBase.position.set(CX, domeY + 0.6, CZ);
  colonyGroup.add(domeBase);
  const domeBerm = new THREE.Mesh(new THREE.CylinderGeometry(16.5, 20, 2.4, 32), mat.soil);
  domeBerm.position.set(CX, domeY + 1.2, CZ);
  colonyGroup.add(domeBerm);
  for (let i = 0; i < 8; i++) {                // lit windows around the dome
    const a = i / 8 * Math.PI * 2;
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.2), mat.window);
    win.position.set(CX + Math.cos(a) * 13.6, domeY + 3.4, CZ + Math.sin(a) * 13.6);
    win.lookAt(CX, domeY + 3.4, CZ);
    colonyGroup.add(win);
  }

  // habitat modules + connecting tubes
  const up = new THREE.Vector3(0, 1, 0);
  for (const a of [0.4, 1.5, 2.7, 3.9, 5.1]) {
    const mx = CX + Math.cos(a) * 40, mz = CZ + Math.sin(a) * 40;
    const my = gY(mx, mz);
    // half-buried in a regolith mound: free radiation shielding
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), mat.soil);
    mound.scale.set(6.5, 2.0, 9.0);
    mound.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
    mound.position.set(mx, my + 0.2, mz);
    colonyGroup.add(mound);
    const mod = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 10, 20), mat.hull);
    mod.quaternion.setFromUnitVectors(up,
      new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)));
    mod.position.set(mx, my + 2.3, mz);
    colonyGroup.add(mod);
    for (const e of [-5, 5]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 12), mat.hull);
      cap.position.set(mx - Math.sin(a) * e, my + 2.3, mz + Math.cos(a) * e);
      colonyGroup.add(cap);
    }
    // airlock at the far end
    const lock = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 2.2), mat.trim);
    lock.position.set(mx - Math.sin(a) * 7.2, my + 1.3, mz + Math.cos(a) * 7.2);
    lock.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
    colonyGroup.add(lock);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 3.4), mat.window);
    win.position.set(mx + Math.cos(a) * 3.25, my + 2.8, mz + Math.sin(a) * 3.25);
    win.lookAt(mx, my + 2.8, mz);
    colonyGroup.add(win);
    // corridor to the dome
    const from = new THREE.Vector3(CX + Math.cos(a) * 14, 0, CZ + Math.sin(a) * 14);
    const to = new THREE.Vector3(mx - Math.cos(a) * 3, 0, mz - Math.sin(a) * 3);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(
      1.5, 1.5, from.distanceTo(to), 12), mat.trim);
    tube.quaternion.setFromUnitVectors(up, to.clone().sub(from).normalize());
    tube.position.set(mid.x, gY(mid.x, mid.z) + 1.6, mid.z);
    colonyGroup.add(tube);
  }

  // greenhouses with plants inside, warm glow at night
  for (const gi of [-1, 0, 1]) {
    const gx = CX + 72, gz = CZ + gi * 16;
    const gy = gY(gx, gz);
    // half-cylinder tunnel, axis along z, open side down
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(
      5, 5, 26, 20, 1, true, Math.PI / 2, Math.PI), mat.glass);
    shell.rotation.x = Math.PI / 2;
    shell.position.set(gx, gy + 0.4, gz);
    colonyGroup.add(shell);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.5, 26), mat.trim);
    floor.position.set(gx, gy + 0.25, gz);
    colonyGroup.add(floor);
    for (const e of [-13, 13]) {              // glass end walls
      const capG = new THREE.Mesh(new THREE.CircleGeometry(5, 16, 0, Math.PI), mat.glass);
      capG.position.set(gx, gy + 0.4, gz + e);
      if (e < 0) capG.rotation.y = Math.PI;
      colonyGroup.add(capG);
    }
    for (let i = 0; i < 14; i++) {              // plants
      const px = gx + (Math.random() - 0.5) * 7;
      const pz = gz + (Math.random() - 0.5) * 22;
      const green = mat.greens[i % mat.greens.length];
      const plant = Math.random() < 0.5
        ? new THREE.Mesh(new THREE.ConeGeometry(0.5 + Math.random() * 0.3,
            1.2 + Math.random() * 1.4, 8), green)
        : new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.4, 10, 8), green);
      plant.position.set(px, gy + 1.2, pz);
      colonyGroup.add(plant);
    }
    const glow = new THREE.PointLight(0xd8ffd0, 0, 45, 2);
    glow.position.set(gx, gy + 4, gz);
    colonyGroup.add(glow);
    colonyLights.push(glow);
  }

  // solar farm
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      const sx = CX + 40 + c * 9, sz = CZ + 70 + r * 8;
      const p = new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 4), mat.panel);
      p.rotation.x = -0.35;                     // tilted toward the southern sun
      p.position.set(sx, gY(sx, sz) + 1.6, sz);
      colonyGroup.add(p);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.6, 6), mat.metal);
      leg.position.set(sx, gY(sx, sz) + 0.8, sz);
      colonyGroup.add(leg);
    }
  }

  // fission power unit, kept at a respectful distance
  const rx = CX - 90, rz = CZ - 70, ryy = gY(rx, rz);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3.6, 16), mat.metal);
  core.position.set(rx, ryy + 1.8, rz);
  colonyGroup.add(core);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.6, 0.15), mat.trim);
    fin.position.set(rx + Math.cos(a) * 3.6, ryy + 4.6, rz + Math.sin(a) * 3.6);
    fin.rotation.y = -a;
    colonyGroup.add(fin);
  }
  const warn = new THREE.Mesh(new THREE.CylinderGeometry(2.24, 2.24, 0.4, 16), mat.red);
  warn.position.set(rx, ryy + 3.3, rz);
  colonyGroup.add(warn);

  // landing pad + rocket
  const lx = CX + 160, lz = CZ - 45, ly = gY(lx, lz);
  const padMesh = new THREE.Mesh(new THREE.CylinderGeometry(18, 19, 0.8, 32), mat.pad);
  padMesh.position.set(lx, ly + 0.4, lz);
  colonyGroup.add(padMesh);
  for (let i = 0; i < 8; i++) {                // pad edge lights
    const a = i / 8 * Math.PI * 2;
    const dotL = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat.red);
    dotL.position.set(lx + Math.cos(a) * 17, ly + 1.0, lz + Math.sin(a) * 17);
    colonyGroup.add(dotL);
  }
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 16, 20), mat.hull);
  stage.position.set(lx, ly + 8.8, lz);
  colonyGroup.add(stage);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5, 20), mat.hull);
  nose.position.set(lx, ly + 19.3, lz);
  colonyGroup.add(nose);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.5, 2.6), mat.trim);
    fin.position.set(lx + Math.cos(a) * 2.9, ly + 2.8, lz + Math.sin(a) * 2.9);
    fin.rotation.y = -a;
    colonyGroup.add(fin);
  }

  // comms dish with a red beacon
  const ax = CX - 25, az = CZ + 45, ay = gY(ax, az);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 9, 8), mat.metal);
  mast.position.set(ax, ay + 4.5, az);
  colonyGroup.add(mast);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8, 0, Math.PI * 2, 0, 0.45), mat.metal);
  dish.position.set(ax, ay + 9.5, az);
  dish.rotation.x = -0.8;
  colonyGroup.add(dish);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mat.red);
  beacon.position.set(ax, ay + 9.2, az);
  colonyGroup.add(beacon);

  // parked pressurized rover by the dome
  const vx = CX + 20, vz = CZ - 16, vy = gY(vx, vz);
  const vbody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.5, 3.6), mat.hull);
  vbody.position.set(vx, vy + 1.35, vz);
  colonyGroup.add(vbody);
  const vwin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.2), mat.window);
  vwin.position.set(vx, vy + 1.75, vz + 1.85);
  colonyGroup.add(vwin);
  for (const wx of [-1, 1]) {
    for (const wz of [-1.2, 1.2]) {
      const wl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 14), mat.pad);
      wl.rotation.z = Math.PI / 2;
      wl.position.set(vx + wx * 1.35, vy + 0.55, vz + wz);
      colonyGroup.add(wl);
    }
  }

  // floodlight poles at the pad corners
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + Math.PI / 4;
    const fx = lx + Math.cos(a) * 21, fz = lz + Math.sin(a) * 21;
    const fy = gY(fx, fz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7, 8), mat.metal);
    pole.position.set(fx, fy + 3.5, fz);
    colonyGroup.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.45), mat.window);
    head.position.set(fx, fy + 7, fz);
    head.lookAt(lx, fy, lz);
    colonyGroup.add(head);
  }

  // roads: hub to pad / solar / greenhouses / reactor, plus the long
  // "memorial highway" out to where Perseverance last drove through
  road(CX, CZ, lx, lz, 6);
  road(CX, CZ, CX + 58, CZ + 92, 4);
  road(CX, CZ, CX + 64, CZ, 4);
  road(CX, CZ, rx, rz, 4);
  if (roverAt) {
    road(CX, CZ, roverAt.x, roverAt.z, 5);
    // marker posts alternating along the highway, like a real haul road
    const dx = roverAt.x - CX, dz = roverAt.z - CZ;
    const len = Math.hypot(dx, dz), n = Math.floor(len / 80);
    for (let i = 1; i < n; i++) {
      const t = i / n, side = i % 2 ? 1 : -1;
      const x = CX + dx * t - dz / len * side * 4.5;
      const z = CZ + dz * t + dx / len * side * 4.5;
      const y = gY(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.4, 6), mat.hull);
      post.position.set(x, y + 0.7, z);
      colonyGroup.add(post);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), mat.red);
      top.position.set(x, y + 1.5, z);
      colonyGroup.add(top);
    }
  }

  // warm plaza light for the night
  const plaza = new THREE.PointLight(0xffd9a0, 0, 70, 2);
  plaza.position.set(CX, domeY + 12, CZ);
  colonyGroup.add(plaza);
  colonyLights.push(plaza);

  // ---- densification pass: eastern trunk + spurs ---------------------------
  // (segments mirrored in scripts/audit_layout.mjs — update BOTH places)
  const SPURS = [
    [-190, -145, 100, -125, 5],   // east trunk: landing pad -> mine-west junction
    [100, -125, 148, -52, 4],     // heli spur (ends short of the pad apron)
    [100, -125, 150, -190, 4],    // environmental spur leg 1 (skirts the mine south)
    [150, -190, 285, -278, 4],    // environmental spur leg 2 -> weather/rad cluster
    [62, 18, 83, 10, 4],          // ISRU -> print works link (doorstep, exempt)
    [95, 20, 95, 44, 4],          // print works -> greenhouse porch
    [-350, -100, -290, -55, 4],   // village spur: hub -> hab-village west mouth (doorstep, exempt)
    [178, -40, 705, 220, 5],      // launch highway: heli apron -> CZ-10B (doorstep, exempt)
    [100, -125, 138, -122, 5],    // mine spur: trunk end -> pit load-out (doorstep, exempt)
    [100, -125, 100, -14, 5],     // industry link: trunk -> print works / ISRU zone
    // launch campus: the crawlerway is the widest road in town because the
    // crawler is the heaviest thing that moves - VAB -> pad, plus the park
    // spur, the payload-building link and the tie-in to the launch highway
    [600, 300, 750, 250, 12],     // crawlerway: VAB -> CZ-10B pad (doorstep, exempt)
    [600, 300, 700, 370, 12],     // crawlerway park spur -> transporter stand
    [480, 320, 600, 300, 6],      // payload building -> VAB transfer link
    [636, 190, 600, 300, 5],      // campus tie-in from the launch highway
    // fission service road (HANDOFF_FISSION section 2): trunk west end to the
    // plant's west gate, kept west of the G-R trench to avoid running on it -
    // HALEU casks and the spent-module road both use this, so it is a real
    // road, not the off-road access the handoff was resigned to
    [-190, -145, -210, -690, 4],  // fission spur leg 1
    [-210, -690, -180, -778, 4],  // fission spur leg 2 (doorstep, exempt)
    // acceptance-wave spurs (each handoff's doorstep rule, section 2):
    [-100, -142, -100, -486, 4],  // astro spur: trunk -> handover apron, east of G-R1
    [150, -190, 148, -252, 4],    // foundry ore spur: env node -> west intake
    [150, -190, 124, -214, 4],    // glass feed spur: same node -> batch hoppers
  ];
  for (const [x1, z1, x2, z2, w] of SPURS) road(x1, z1, x2, z2, w);
  // roadside furniture: alternating light masts and marker posts
  for (const [x1, z1, x2, z2] of SPURS) {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
    const n = Math.max(1, Math.floor(len / 70));
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1), side = i % 2 ? 1 : -1;
      const x = x1 + dx * t - dz / len * side * 4.5;
      const z = z1 + dz * t + dx / len * side * 4.5;
      const y = gY(x, z);
      if (i % 2) {                              // light mast
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5, 6), mat.metal);
        pole.position.set(x, y + 2.5, z);
        colonyGroup.add(pole);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.3), mat.window);
        head.position.set(x, y + 5, z);
        colonyGroup.add(head);
      } else {                                  // marker post
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.4, 6), mat.hull);
        post.position.set(x, y + 0.7, z);
        colonyGroup.add(post);
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), mat.red);
        top.position.set(x, y + 1.5, z);
        colonyGroup.add(top);
      }
    }
  }
  // laydown yards at the two big junctions: container stacks + crates
  const cargo = [0x7c5a3e, 0x5a6a7c, 0x6a7c5a, 0x8a4a3a].map(
    (c) => new THREE.MeshLambertMaterial({ color: c }));
  function yard(cx, cz, rot) {
    const yy = gY(cx, cz);
    const g = new THREE.Group();
    g.position.set(cx, yy, cz);
    g.rotation.y = rot;
    for (let i = 0; i < 7; i++) {               // container rows, some stacked
      const row = Math.floor(i / 3), col = i % 3;
      const box = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 2.5), cargo[i % 4]);
      box.position.set(col * 6.6 - 6.6, 1.2 + (i > 4 ? 2.5 : 0), row * 3.2 - 1.6);
      if (i > 4) box.position.x = (i - 5) * 6.6 - 3.3;
      g.add(box);
    }
    for (let i = 0; i < 4; i++) {               // loose crates
      const c = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), mat.trim);
      c.position.set(-9 + i * 1.7, 0.55, 4.2 + (i % 2) * 0.9);
      g.add(c);
    }
    colonyGroup.add(g);
  }
  yard(200, -160, 0.4);                         // mine-gate junction yard
  yard(58, 34, -0.35);                          // ISRU-side yard

  // ---- electrolyser expansion + roast-condensate surge tank -----------------
  // Integrator ruling (see CHECKLIST, res-isru-01 / res-sulfur-01): the sulfate
  // kiln returns ~9 kg/h of water that must be re-split, but the original
  // 13-plate stack (2.9 kg/h) is fully committed to the Sabatier recycle loop —
  // so the bank goes to 4 stacks, not 3, and hangs on fusion baseload because a
  // kiln with 9 t of refractory cannot cycle with the sun.
  function electrolyserBank(cx, cz, rot) {
    const g = new THREE.Group();
    g.position.set(cx, gY(cx, cz), cz);
    g.rotation.y = rot;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 11), mat.pad);
    pad.position.y = 0.15;
    g.add(pad);
    for (let i = 0; i < 4; i++) {               // stack 0 = the original skid
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.8, 2.6),
        i ? mat.hull : mat.trim);
      body.position.set(i * 5 - 7.5, 1.7, -1.5);
      g.add(body);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 2.8), mat.metal);
      cap.position.set(i * 5 - 7.5, 3.2, -1.5);
      g.add(cap);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.1), mat.window);
      lamp.position.set(i * 5 - 7.5, 2.9, -0.18);
      g.add(lamp);
    }
    const header = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 21, 10), pmat.small);
    header.rotation.z = Math.PI / 2;
    header.position.set(-1, 3.6, -1.5);         // hydrogen header back to the reactor
    g.add(header);
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 7, 10), mat.metal);
    vent.position.set(10, 3.5, -1.5);           // oxygen vent / fill stack
    g.add(vent);
    const surge = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 3.4, 14), pmat.h2o);
    surge.position.set(-9.5, 1.9, 3);           // 1 m3 roast-condensate buffer
    g.add(surge);
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.4, 14), mat.trim);
    skirt.position.set(-9.5, 0.35, 3);
    g.add(skirt);
    const rect = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.4, 2.2), mat.hull);
    rect.position.set(4, 1.5, 3.4);             // rectifier: electrolysis eats DC
    g.add(rect);
    for (let i = 0; i < 3; i++) {               // cable tray toward the grid
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 2.6), mat.metal);
      t.position.set(4 + i * 0.1, 0.62, 5.6 + i * 2.6);
      g.add(t);
    }
    colonyGroup.add(g);
  }
  // (called below, after the pipe palette it borrows exists)

  // ---- ore load-out: where the mine's three graded piles wait for a truck ----
  // The pit screens its own soil into fines / medium / coarse (res-mine-01,
  // screener card); this is the stockpile-and-load-out apron on the spur, the
  // start of the only bulk-freight route in town.
  const oreMat = [0xa9764f, 0x8e6440, 0x6f4e33].map(
    (c) => new THREE.MeshLambertMaterial({ color: c }));
  function orePiles(cx, cz, rot) {
    const g = new THREE.Group();
    g.position.set(cx, gY(cx, cz), cz);
    g.rotation.y = rot;
    const apron = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 17), mat.pad);
    apron.position.y = 0.12;
    g.add(apron);
    for (let i = 0; i < 3; i++) {               // graded stockpiles, coarse tallest
      const r = 4.2 - i * 0.45, h = 2.6 + i * 0.5;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 12), oreMat[i]);
      cone.position.set(i * 9 - 9, h / 2 + 0.2, -2.4);
      g.add(cone);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.5), mat.hull);
      plate.position.set(i * 9 - 9, 0.9, -2.4 + r + 0.9);
      g.add(plate);                             // grade placard at each pile
    }
    const stack = new THREE.Mesh(new THREE.BoxGeometry(14, 0.7, 1.2), mat.metal);
    stack.position.set(2, 4.4, -8);             // radial stacker off the pit belt
    stack.rotation.z = -0.16;
    g.add(stack);
    for (const lx of [-4, 8]) {                 // stacker trestles
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.2, 6), mat.metal);
      leg.position.set(lx, 2.1, -8);
      g.add(leg);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(9, 0.25, 4), mat.trim);
    bridge.position.set(9, 0.32, 4.5);          // weighbridge at the exit
    g.add(bridge);
    const kiosk = new THREE.Mesh(new THREE.BoxGeometry(2, 2.4, 2), mat.hull);
    kiosk.position.set(13.5, 1.2, 4.5);
    g.add(kiosk);
    const kw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 1.1), mat.window);
    kw.position.set(12.45, 1.5, 4.5);
    g.add(kw);
    colonyGroup.add(g);
  }
  orePiles(122, -110, 0.08);

  // haul truck: flat-deck ore hauler, the only vehicle that actually drives.
  // Route = pit load-out -> trunk junction -> print works, then back empty.
  function haulTruck() {
    const t = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.5, 2.6), mat.metal);
    deck.position.y = 1.35;
    t.add(deck);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2, 1.7, 2.4), mat.hull);
    cab.position.set(2.4, 2.45, 0);
    t.add(cab);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 1.9), mat.glass);
    glass.position.set(3.42, 2.7, 0);
    t.add(glass);
    const bed = new THREE.Group();
    bed.name = 'ore_bed';                       // load appears/disappears per leg
    const heap = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 2.2), oreMat[1]);
    heap.position.set(-1.2, 2.05, 0);
    bed.add(heap);
    t.add(bed);
    for (const wx of [-2.2, 0.2, 2.6]) for (const wz of [-1.45, 1.45]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.5, 10), mat.pad);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.78, wz);
      t.add(w);
    }
    colonyGroup.add(t);
    return t;
  }
  const truck = haulTruck();
  const HAUL = [[136, -122], [100, -125], [100, -16]];   // polyline, pit -> works
  const legLen = HAUL.slice(1).map((p, i) =>
    Math.hypot(p[0] - HAUL[i][0], p[1] - HAUL[i][1]));
  const haulLen = legLen.reduce((a, b) => a + b, 0);
  const SPEED = 6, DWELL = 9;                   // m/s and load/unload pause, s
  const CYCLE = 2 * (haulLen / SPEED + DWELL);
  haulTick = (time) => {
    let s = (time % CYCLE) / CYCLE * (2 * (haulLen + SPEED * DWELL));
    const dwellS = SPEED * DWELL;
    let dist, laden, back = false;
    if (s < haulLen) { dist = s; laden = true; }               // outbound, loaded
    else if (s < haulLen + dwellS) { dist = haulLen; laden = true; }  // tipping
    else if (s < 2 * haulLen + dwellS) {
      dist = 2 * haulLen + dwellS - s; laden = false; back = true;    // return
    } else { dist = 0; laden = false; }                        // loading at the pit
    let leg = 0, d = dist;
    while (leg < legLen.length - 1 && d > legLen[leg]) { d -= legLen[leg]; leg++; }
    const a = HAUL[leg], b = HAUL[leg + 1];
    const k = legLen[leg] ? d / legLen[leg] : 0;
    const x = a[0] + (b[0] - a[0]) * k, z = a[1] + (b[1] - a[1]) * k;
    truck.position.set(x, gY(x, z) + 0.1, z);
    const head = Math.atan2(b[0] - a[0], b[1] - a[1]) + (back ? Math.PI : 0);
    truck.rotation.y = head - Math.PI / 2;
    truck.getObjectByName('ore_bed').visible = laden;
  };

  // ---- utility corridors: elevated pipe racks --------------------------------
  // (routes mirrored in scripts/audit_layout.mjs — update BOTH places)
  const pmat = {
    ch4:  new THREE.MeshLambertMaterial({ color: 0xc2c8ce }),  // methane, bare steel
    heat: new THREE.MeshLambertMaterial({ color: 0x54453c }),  // insulated heat loop
    h2o:  new THREE.MeshLambertMaterial({ color: 0x5f8494 }),  // water, teal
    lox:  new THREE.MeshLambertMaterial({ color: 0xe8eef2 }),  // LOX, white MLI jacket
    o2:   new THREE.MeshLambertMaterial({ color: 0xdfe9e2 }),  // breathing O2, warm white
    co2:  new THREE.MeshLambertMaterial({ color: 0x4a8a80 }),  // CO2, cyan-green
    sew:  new THREE.MeshLambertMaterial({ color: 0x3d5566 }),  // sewage, dark slate
    rec:  new THREE.MeshLambertMaterial({ color: 0x84aebe }),  // reclaimed water
    hazA: new THREE.MeshLambertMaterial({ color: 0xa03a2a }),  // fab piranha line
    hazB: new THREE.MeshLambertMaterial({ color: 0xb08020 }),  // fab HF line (own pipe!)
    hazC: new THREE.MeshLambertMaterial({ color: 0x7a5a9a }),  // fab CMP slurry
    small: new THREE.MeshLambertMaterial({ color: 0x8a9096 }), // return/utility lane
  };
  // ends: which extremities get a tie-in. A logical corridor built from several
  // pipeRack legs must only terminate at its true ends, so pass 'start' / 'none'
  // / 'end' along the chain; a single-leg run keeps the default 'both'.
  function pipeRack(x1, z1, x2, z2, lanes, loopEvery = 0, ends = 'both') {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
    const px = -dz / len, pz = dx / len;        // across-track unit
    const barRot = Math.atan2(-pz, px);
    const n = Math.max(2, Math.round(len / 14));
    const tops = [];
    for (let i = 0; i <= n; i++) {
      const x = x1 + dx * i / n, z = z1 + dz * i / n;
      const y = gY(x, z);
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.26, 2.5, 0.26), mat.metal);
      col.position.set(x, y + 1.25, z);
      colonyGroup.add(col);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.3), mat.metal);
      bar.position.set(x, y + 2.5, z);
      bar.rotation.y = barRot;
      colonyGroup.add(bar);
      tops.push([x, y + 2.62, z]);
    }
    const UP = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < n; i++) {
      const [ax, ay, az] = tops[i], [bx, by, bz] = tops[i + 1];
      for (const ln of lanes) {
        const seg = new THREE.Vector3(bx - ax, by - ay, bz - az);
        const c = new THREE.Mesh(
          new THREE.CylinderGeometry(ln.r, ln.r, seg.length() + 0.2, 8), ln.m);
        c.position.set((ax + bx) / 2 + px * ln.o, (ay + by) / 2 + ln.r,
                       (az + bz) / 2 + pz * ln.o);
        c.quaternion.setFromUnitVectors(UP, seg.normalize());
        colonyGroup.add(c);
      }
      // thermal expansion loop: main lane rises over a squared U
      if (loopEvery && i > 0 && i % loopEvery === 0) {
        const [lx2, ly2, lz2] = tops[i];
        const o = lanes[0].o, r = lanes[0].r;
        for (const s of [-0.9, 0.9]) {
          const v = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.5, 8), lanes[0].m);
          v.position.set(lx2 + px * o + dx / len * s, ly2 + 0.75, lz2 + pz * o + dz / len * s);
          colonyGroup.add(v);
        }
        const h = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2.0, 8), lanes[0].m);
        h.position.set(lx2 + px * o, ly2 + 1.5, lz2 + pz * o);
        h.quaternion.setFromUnitVectors(UP, new THREE.Vector3(dx / len, 0, dz / len));
        colonyGroup.add(h);
      }
    }
    // valve skid + service light at the midpoint
    const mi = Math.floor(n / 2);
    const [vx, vy, vz] = tops[mi];
    const skid = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 1.6), mat.hull);
    skid.position.set(vx + px * 2.6, gY(vx + px * 2.6, vz + pz * 2.6) + 0.75, vz + pz * 2.6);
    skid.rotation.y = barRot;
    colonyGroup.add(skid);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.25), mat.window);
    lamp.position.set(vx + px * 2.6, skid.position.y + 1.05, vz + pz * 2.6);
    colonyGroup.add(lamp);
    // Tie-in at the extremities: without this the lanes simply stop in mid-air
    // 2.6 m up, which is what made every corridor look unconnected. Each end
    // drops a riser per lane to a grade-level tie-in block - the interface a
    // building's own nozzle meets. The corridor stops at the doorstep by
    // design - see the junction rule in MODELS.md.
    const wantStart = ends === 'both' || ends === 'start';
    const wantEnd = ends === 'both' || ends === 'end';
    for (const [want, ti] of [[wantStart, 0], [wantEnd, n]]) {
      if (!want) continue;
      const [tx, ty, tz] = tops[ti];
      const gy = gY(tx, tz);
      for (const ln of lanes) {
        const h = Math.max(0.6, ty + ln.r - gy - 0.5);
        const riser = new THREE.Mesh(
          new THREE.CylinderGeometry(ln.r, ln.r, h, 8), ln.m);
        riser.position.set(tx + px * ln.o, gy + 0.5 + h / 2, tz + pz * ln.o);
        colonyGroup.add(riser);
      }
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.0, 1.2), mat.trim);
      box.position.set(tx, gy + 0.5, tz);
      box.rotation.y = barRot;
      colonyGroup.add(box);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 1.9), mat.pad);
      pad.position.set(tx, gy + 0.08, tz);
      pad.rotation.y = barRot;
      colonyGroup.add(pad);
    }
  }
  // CH4 fueling line: ISRU Sabatier plant -> CZ-10B launch complex
  pipeRack(52, 32, 725, 235,
    [{ o: -0.45, r: 0.3, m: pmat.ch4 }, { o: 0.45, r: 0.3, m: pmat.ch4 },
     { o: 0, r: 0.12, m: pmat.small }], 10);
  // heat-transfer loop: fusion plant -> radiator field (fat insulated pair);
  // three legs thread between the neutron-sentinel arc and the compute center
  const heatLanes = [{ o: -0.5, r: 0.38, m: pmat.heat }, { o: 0.5, r: 0.38, m: pmat.heat }];
  pipeRack(-140, 58, -109, 70, heatLanes, 0, 'start');
  pipeRack(-109, 70, -109, 132, heatLanes, 0, 'none');
  pipeRack(-109, 132, -84, 352, heatLanes, 8, 'end');
  // LOX line: same ISRU -> CZ-10B run on its own rack ~10 m south of the methane.
  // Methalox burns at O/F ~3.5, so the oxidiser is the fat pipe, not the fuel —
  // and fuel and oxidiser ride separate racks by fire-separation rule.
  pipeRack(55, 22, 728, 225,
    [{ o: -0.55, r: 0.42, m: pmat.lox }, { o: 0.55, r: 0.16, m: pmat.small }], 10);
  // water line: Rodwell well -> greenhouse dome (supply + slim return)
  pipeRack(2, 106, 80, 72,
    [{ o: -0.3, r: 0.22, m: pmat.h2o }, { o: 0.35, r: 0.1, m: pmat.small }], 0);
  // ...and the branch that feeds the Sabatier: every kg of methane starts as
  // Rodwell water, electrolysed for its hydrogen. Without this tee the whole
  // propellant chain has an outlet and no inlet.
  pipeRack(63, 79, 44, 45,
    [{ o: -0.25, r: 0.18, m: pmat.h2o }], 0);
  // roast condensate: the sulfate kiln's ~9 kg/h of water walking back to the
  // electrolyser bank that has to re-split it into the hydrogen the kiln eats
  pipeRack(68, -50, 50, -2,
    [{ o: -0.22, r: 0.16, m: pmat.h2o }], 0);
  electrolyserBank(48, -4, 0.12);

  // ---- life-support corridors (res-eclss-01 / res-recycle-01 interchange) ----
  // baseload oxygen: the sulfur kiln's 200 kg/sol by-product is the city's
  // primary metabolic supply (1.57x demand) — this is the oxygen aorta
  const o2Main = [{ o: -0.3, r: 0.3, m: pmat.o2 }, { o: 0.3, r: 0.1, m: pmat.small }];
  // foundry oxygen: metal-oxide reduction's byproduct joins the city O2 net at
  // the sulfur-plant junction (integrator ruling on HANDOFF_FOUNDRY section 3-2:
  // one aorta, two producers - same bus, same bookkeeping)
  pipeRack(173, -280, 85, -300, [{ o: 0, r: 0.22, m: pmat.o2 }], 0, 'start');
  pipeRack(85, -300, 28, -200, [{ o: 0, r: 0.22, m: pmat.o2 }], 8, 'none');
  pipeRack(28, -200, 28, -90, [{ o: 0, r: 0.22, m: pmat.o2 }], 8, 'none');
  pipeRack(28, -90, 70, -70, [{ o: 0, r: 0.22, m: pmat.o2 }], 0, 'none');
  pipeRack(70, -70, 0, 20, o2Main, 8, 'start');        // west of the ISRU footprint
  pipeRack(0, 20, 5, 60, o2Main, 0, 'end');
  // oxygen to the undercity gate: the south line, three legs riding the road
  // corridor and passing the hab village's west corner (future branch tee)
  const o2Lane = [{ o: 0, r: 0.26, m: pmat.o2 }];
  pipeRack(5, 60, -105, -25, o2Lane, 10, 'start');     // north of the cryo farm
  pipeRack(-105, -25, -250, -105, o2Lane, 10, 'none');
  pipeRack(-250, -105, -330, -70, o2Lane, 10, 'none');
  pipeRack(-330, -70, -330, -38, o2Lane, 0, 'end');
  // CO2 home: intake-tower frost + city exhale, back to the Sabatier it feeds
  pipeRack(5, 60, 40, 25, [{ o: 0, r: 0.2, m: pmat.co2 }], 0);
  // sewage out / reclaim back on one trestle, plus the fab's three hazmat
  // lines — piranha, HF and slurry never share a pipe (L3 red line), only posts
  pipeRack(-330, -30, -300, 40,
    [{ o: -0.55, r: 0.24, m: pmat.sew }, { o: -0.15, r: 0.2, m: pmat.rec },
     { o: 0.35, r: 0.09, m: pmat.hazA }, { o: 0.55, r: 0.09, m: pmat.hazB },
     { o: 0.75, r: 0.09, m: pmat.hazC }], 0);

  // ---- the grid: buried cable trenches (Paschen rules out bare towers) ------
  // Routes mirror mars-grid/out/03_corridors.json — 16 runs, 7,024 m. Buried
  // cable reads on the surface as a dark trench-cover line plus voltage-coded
  // marker posts; the only overhead span is G-A, the 72 m pressurized-CO2
  // busbar duct from the fusion plant (13.8 kV AC lives at 100 kPa, not 600 Pa).
  const vmat = {
    ac:   new THREE.MeshLambertMaterial({ color: 0xd8a840 }),  // 13.8 kV AC amber
    dc10: new THREE.MeshLambertMaterial({ color: 0xa04030 }),  // ±10 kV DC red
    dc15: new THREE.MeshLambertMaterial({ color: 0x3a8a96 }),  // 1.5 kV DC cyan
    dc04: new THREE.MeshLambertMaterial({ color: 0x4a8a4a }),  // 400 V DC green
  };
  function cableTrench(x1, z1, x2, z2, m) {
    road(x1, z1, x2, z2, 1.2);                 // the trench-cover line itself
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
    const n = Math.max(1, Math.floor(len / 110));
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0;
      const x = x1 + dx * t, z = z1 + dz * t, y = gY(x, z);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.1, 6), mat.hull);
      post.position.set(x + 1.1 * (dz / len), y + 0.55, z - 1.1 * (dx / len));
      colonyGroup.add(post);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.22, 6), m);
      band.position.set(post.position.x, y + 0.95, post.position.z);
      colonyGroup.add(band);
    }
  }
  // G-A feeder: the one overhead run, fusion -> substation
  pipeRack(-140, 40, -205, 10, [{ o: 0, r: 0.45, m: vmat.ac }], 0);
  const NW = [-350, -100], NN = [-90, 120], NE = [45, 15], NS = [150, -120];
  cableTrench(-205, 10, -230, 90, vmat.dc10);              // G-B storage tie
  cableTrench(-205, 10, -160, -5, vmat.dc10);              // G-C north trunk...
  cableTrench(-160, -5, -100, -5, vmat.dc10);              // ...skirting the
  cableTrench(-100, -5, NN[0], NN[1], vmat.dc10);          // fusion plant south
  cableTrench(-205, 10, -300, 10, vmat.dc10);              // G-D west trunk...
  cableTrench(-300, 10, NW[0], NW[1], vmat.dc10);          // ...north of village
  cableTrench(-205, 10, NE[0], NE[1], vmat.dc10);          // G-E east trunk
  cableTrench(NE[0], NE[1], NS[0], NS[1], vmat.dc10);      // G-F south trunk
  cableTrench(NS[0], NS[1], 750, 250, vmat.dc10);          // G-G launch trunk
  cableTrench(NS[0], NS[1], 500, 700, vmat.dc10);          // G-H pad one spur
  cableTrench(NW[0], NW[1], -350, -280, vmat.dc15);        // G-J comms spur
  cableTrench(NW[0], NW[1], -684, -220, vmat.dc04);        // G-K1 seismic leg 1
  cableTrench(-684, -220, -700, -520, vmat.dc04);          // G-K2 the dogleg
  cableTrench(NW[0], NW[1], -250, -46, vmat.dc15);         // G-L village spur
  cableTrench(NW[0], NW[1], -372, -18, vmat.dc10);         // G-M shaft-head spur
  // (G-Q rides the lift shaft 3,000 m straight down — no surface footprint)
  cableTrench(NW[0], NW[1], -560, -220, vmat.dc04);        // G-N observatory spur
  cableTrench(NS[0], NS[1], 300, -300, vmat.dc04);         // G-P environment spur
  // G-R fission main tie: enters the substation from the south, 110 degrees
  // from G-A's northeast approach, so no single corridor event can take both
  // power sources - the whole reason the fission plant exists.
  cableTrench(-140, -780, -200, -120, vmat.dc10);          // G-R1 fission trunk
  cableTrench(-200, -120, -205, 10, vmat.dc10);            // G-R2 south approach
  // G-S survival bypass, normally open: fission straight to the undercity
  // 1500 V node, closing only if the substation itself is lost - both sources
  // on one busbar would rebuild the single point of failure.
  cableTrench(-140, -780, -345, -110, vmat.dc15);          // G-S1 bypass trunk
  cableTrench(-345, -110, -330, -30, vmat.dc15);           // G-S2 shaft approach
  // acceptance-wave spurs: astro taps a 400 V branch beside the G-R1 trench
  // (10 kV never enters the lab), glass taps G-P, optical rides the
  // com-station trench for its 39 m
  cableTrench(-165, -500, -113, -498, vmat.dc04);          // G-T astro branch
  cableTrench(225, -210, 122, -222, vmat.dc04);            // G-U glass branch
  cableTrench(-350, -280, -385, -262, vmat.dc04);          // G-V optical fibre+power
}

// ------------------------------------------------------------- imperial city
// Third toggle layer (Codex-built module, accepted R6). The palace thinks in
// local metres with its axis on -Z; the whole 1200 x 800 m envelope sits on
// the empty northeast quadrant, entrance facing the science city. The ctx
// sampleHeight is offset-wrapped so the module keeps believing it lives at
// the origin.
const imperialGroup = new THREE.Group();
imperialGroup.visible = false;
const IMPERIAL_SITE = [1100, -800];
imperialGroup.position.set(IMPERIAL_SITE[0], 0, IMPERIAL_SITE[1]);
surfaceGroup.add(imperialGroup);
const imperialAnims = [];
const imperialLights = [];
let imperialLoadP = null;
function loadImperial() {
  imperialLoadP ??= import('./imperial/imperial-city.js').then((mod) => {
    mod.build({ THREE, group: imperialGroup, anims: imperialAnims,
      lights: imperialLights,
      sampleHeight: (x, z) =>
        sampleHeight(x + IMPERIAL_SITE[0], z + IMPERIAL_SITE[1]),
      renderer, T, sunDirUniform: sky.material.uniforms.sunDir });
    imperialGroup.position.y = 0;   // module anchors to sampled terrain height
    unitNightMats.push(...(imperialGroup.userData.nightMats || []));
    collectColliders(imperialGroup, 2);   // terraces/stairs become walkable
  }).catch((e) => { console.warn('[imperial] load failed', e); });
  return imperialLoadP;
}

// ---------------------------------------------------------------- magic city

const magicGroup = new THREE.Group();
magicGroup.visible = false;
surfaceGroup.add(magicGroup);
const magicLights = [];
const magicAnims = [];                       // per-frame animators (t, dt)
const crystalTime = { value: 0 };            // shared crystal shader uniforms
const crystalDay = { value: 1 };
const cryGlowMats = [];                      // base glow discs, opacity by night
const cityPbrMats = [];                      // crystal city materials, glow at night

// —— 魔幻城已剥离为独立模块(viewer/magic/magic-city.js),这里只做接线 ——
buildMagicCity({ THREE, group: magicGroup, anims: magicAnims, lights: magicLights,
  sampleHeight, renderer, T, sunDirUniform: sky.material.uniforms.sunDir,
  crystalTime, crystalDay, cryGlowMats, cityPbrMats });

// which score the surface deserves right now - interiors override via enterInterior
function surfaceScene() {
  return imperialGroup.visible ? 'imperial'
    : magicGroup.visible ? 'magic' : 'city';
}

function toggleMagic(force) {
  magicGroup.visible = force ?? !magicGroup.visible;
  const btn = document.getElementById('magicBtn');
  btn.textContent = T.magic(magicGroup.visible);
  musicSetScene(surfaceScene());
  if (magicGroup.visible) magicGroup.userData.loadCity?.();
}
document.getElementById('magicBtn').addEventListener('click', () => toggleMagic());
document.getElementById('underBtn').addEventListener('click', () => {
  if (!inInterior && !orbitMode && !inspectUnit) enterInterior('hab-foyer-01', null);
});
if (q.get('magic') === '1') toggleMagic(true);

function toggleImperial(force) {
  imperialGroup.visible = force ?? !imperialGroup.visible;
  document.getElementById('imperialBtn').textContent =
    T.imperial(imperialGroup.visible);
  musicSetScene(surfaceScene());
  if (imperialGroup.visible) loadImperial();
}
document.getElementById('imperialBtn').addEventListener('click', () => toggleImperial());
if (q.get('imperial') === '1') toggleImperial(true);

function toggleColony(force) {
  colonyGroup.visible = force ?? !colonyGroup.visible;
  const btn = document.getElementById('colonyBtn');
  btn.textContent = T.colony(colonyGroup.visible);
}
document.getElementById('colonyBtn').addEventListener('click', () => toggleColony());
if (q.get('colony') === '1') toggleColony(true);

// ------------------------------------------- city assets (models/manifest.json)

const unitNightMats = [];                    // window/indicator mats, night-driven
const unitLights = [];                       // PointLights from userData.lights
const unitAnims = [];                        // (t, dt, night) animators
const orbitAnims = [];                       // same, for orbit-view assets (relay sats)
const playerPos = [0, 0, 0];                 // rig position handed to animate ctx.player
const unitSensors = [];                      // perception cameras (userData.sensors)
const pois = [];                             // sub-device knowledge points
const units = [];                            // placed units, for inspect mode
const mixers = [];                           // glTF AnimationMixers (loop_* clips)
const scheduled = [];                        // {g, action, ltst, lastSol} auto-triggers
let lastNight = 0;                           // written by updateSun each frame
const poiCardEl = document.getElementById('poiCard');
// the colony fabric is built before this array exists, so its one moving part
// (the ore hauler) hands its animator over here
if (haulTick) unitAnims.push(haulTick);

const poiDotTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const rg = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  rg.addColorStop(0, 'rgba(200,238,255,1)');
  rg.addColorStop(0.45, 'rgba(140,200,255,0.55)');
  rg.addColorStop(1, 'rgba(140,200,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

function placeUnit(g, a) {
  const bb = new THREE.Box3().setFromObject(g);
  const sz = bb.getSize(new THREE.Vector3());
  if (a.size_m) {
    const dim = a.size_axis === 'height' ? sz.y : Math.max(sz.x, sz.z);
    const s = a.size_m / dim;
    if (Math.abs(s - 1) > 0.02) g.scale.setScalar(s);
  }
  const s = g.scale.x;
  const [x, z] = a.pos;
  g.position.set(x, sampleHeight(x, z) - (a.sink_m || 0) - bb.min.y * s, z);
  g.rotation.y = (a.rotation_deg || 0) * Math.PI / 180;
  colonyGroup.add(g);
  g.updateMatrixWorld(true);
  const wbb = new THREE.Box3().setFromObject(g);
  const sph = wbb.getBoundingSphere(new THREE.Sphere());
  units.push({ id: a.id, name: pick(a, 'name'), group: g,
    center: sph.center.clone(), radius: Math.max(sph.radius, 2.5) });
  // one name tag per facility (far-view label; sub-device tags stay inspect-only)
  const nameTag = makeDeviceTag(pick(a, 'name'), true);
  nameTag.position.set(sph.center.x, wbb.max.y + 6, sph.center.z);
  colonyGroup.add(nameTag);
  unitNameTags.push({ spr: nameTag, unitId: a.id, center: sph.center.clone() });
  registerMotion(g);                          // unified animation (MODELS.md §4)
  if (g.userData.nightMats) unitNightMats.push(...g.userData.nightMats);
  for (const l of g.userData.lights || []) {
    const pl = new THREE.PointLight(l.color ?? 0xffd9a0, 0, l.range ?? 40, 2);
    pl.position.set(l.pos[0], l.pos[1], l.pos[2]);
    g.add(pl);
    unitLights.push(pl);
  }
  collectDeviceExtras(g, Math.max(300, (a.size_m || 60) * 3), a.id);
}

// ---- unified animation vocabulary (MODELS.md §4) --------------------------
// One place every animated building declares motion; engine drives all of them
// each frame with the same ctx {t, dt, night} while their layer is visible.
//   userData.spinners    = [{ node, axis, rpm }]                continuous spin
//   userData.oscillators = [{ node, axis, prop, amp, period, phase }]  back-forth
//   userData.animate(t,dt,ctx)                                   custom per-frame
//   userData.blinkMats / blink_ nodes  → blink (via collectDeviceExtras)
//   userData.actions / meta.schedule   → one-shot (elsewhere)
const TAU = Math.PI * 2;
function resolveNode(g, n) {
  return typeof n === 'string' ? g.getObjectByName(n) : n;
}
function registerMotion(g, anims = unitAnims) {
  const ud = g.userData;
  for (const s of ud.spinners || []) {         // continuous rotation
    const node = resolveNode(g, s.node);
    if (!node) continue;
    const rate = (s.rpm || 1) * TAU / 60;
    const ax = s.axis || 'y';
    anims.push((t, dt) => { node.rotation[ax] += rate * dt; });
  }
  for (const o of ud.oscillators || []) {      // sinusoidal back-and-forth
    const node = resolveNode(g, o.node);
    if (!node) continue;
    const prop = o.prop || 'rotation', ax = o.axis || 'y';
    const base = node[prop][ax];
    const w = TAU / (o.period || 4), amp = o.amp || 0.3, ph = o.phase || 0;
    anims.push((t) => { node[prop][ax] = base + amp * Math.sin(t * w + ph); });
  }
  if (typeof ud.animate === 'function') {       // custom logic
    const fn = ud.animate;
    anims.push((t, dt, night) => fn(t, dt, { t, dt, night, player: playerPos }));
  }
  for (const s of ud.sensors || []) {           // perception cameras (MODELS.md §4c)
    const cam = resolveNode(g, s.camera);
    if (!cam || !cam.isCamera) continue;
    s._cam = cam;
    s._root = g;                                // for visibility gating
    s.width = s.width || 64;
    s.height = s.height || 64;
    cam.aspect = s.width / s.height;
    cam.updateProjectionMatrix();
    s.data = null;                              // engine fills: RGBA, origin bottom-left
    s.frame = 0;                                // increments per captured frame
    s.stamp = 0;                                // capture time t
    s._rt = null;
    s._next = 0;
    unitSensors.push(s);
  }
}

// perception sensor scheduler: renders declared cameras to offscreen targets and
// hands pixels back to the asset via sensor.data/frame. Budget: at most ONE
// sensor render per engine frame (round-robin among due sensors); paused in XR.
let sensorRR = 0;
function driveSensors(t) {
  const n = unitSensors.length;
  for (let k = 0; k < n; k++) {
    const i = (sensorRR + k) % n;
    const s = unitSensors[i];
    let vo = s._root, hidden = false;          // skip sensors on hidden branches
    while (vo) { if (!vo.visible) { hidden = true; break; } vo = vo.parent; }
    if (hidden) continue;
    if (t < s._next) continue;
    s._next = t + 1 / (s.hz || 5);
    if (!s._rt) {
      s._rt = new THREE.WebGLRenderTarget(s.width, s.height);
      s.data = new Uint8Array(s.width * s.height * 4);
    }
    renderer.setRenderTarget(s._rt);
    renderer.render(scene, s._cam);
    renderer.readRenderTargetPixels(s._rt, 0, 0, s.width, s.height, s.data);
    renderer.setRenderTarget(null);
    s.frame++;
    s.stamp = t;
    sensorRR = (i + 1) % n;
    return;                                     // one per frame
  }
}

// floating sub-device tags (userData.label) + blink beacons (blink_ nodes or
// userData.blinkMats) — shared by placed units and scattered props
function collectDeviceExtras(g, range, owner) {
  hangDeviceTags(g, range, owner);
  g.traverse((o) => {
    if (o.isMesh && o.name.startsWith('blink_')) assetBlinks.push(o);
  });
  for (const m of g.userData.blinkMats || []) {
    m.userData.baseColor = m.color.clone();
    assetBlinkMats.push(m);
  }
}

async function loadPois(g, a) {
  const url = a.type === 'code'
    ? `units/${a.id}.info.json` : `../models/${a.id}/info.json`;
  let info;
  try {
    const r = await fetch(url);
    if (!r.ok) return;
    info = await r.json();
  } catch { return; }
  for (const p of info.pois || []) {
    let wp = null;
    const anchor = p.id && g.getObjectByName('poi_' + p.id);
    if (anchor) wp = anchor.getWorldPosition(new THREE.Vector3());
    else if (p.pos) wp = g.localToWorld(new THREE.Vector3(...p.pos));
    if (!wp) continue;
    const dot = new THREE.Sprite(new THREE.SpriteMaterial(
      { map: poiDotTex, transparent: true, depthWrite: false }));
    dot.scale.set(0.6, 0.6, 1);
    dot.position.copy(wp);
    dot.visible = false;
    dot.raycast = () => {};
    colonyGroup.add(dot);
    const tag = textSprite(pick(p, 'label'), 40, '#dff2ff');
    tag.scale.set(10, 1.25, 1);
    tag.position.copy(wp).add(new THREE.Vector3(0, 0.9, 0));
    tag.visible = false;
    colonyGroup.add(tag);
    pois.push({ wp, dot, tag, g, range: p.range ?? 25, label: pick(p, 'label'),
      detail: pick(p, 'detail') || '', specs: (LANG === 'en' && p.specs_en) || p.specs,
      physics: pick(p, 'physics'), sim: pick(p, 'sim'),
      unit: pick(a, 'name') });
  }
}

function applyEffects(g, a) {
  const eff = a.effects || [];
  if (eff.includes('beam_nir')) {            // 905 nm NIR beam, viz-enhanced
    // anchors from the module contract (userData.beams, MODELS.md §4 rule 5);
    // legacy fallback keeps old GLB assets working if no anchor is exported
    const anchors = (g.userData.beams && g.userData.beams.length)
      ? g.userData.beams
      : [{ pos: [-0.19, 2.25, -0.04], dir: [0, 0.94, 0.342] }];
    const LEN = 900;
    for (const b of anchors) {
      const dir = new THREE.Vector3(...b.dir).normalize();
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.06, LEN, 8, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true,
          opacity: 0.04, blending: THREE.AdditiveBlending,
          depthWrite: false, side: THREE.DoubleSide }));
      beam.position.set(...b.pos).addScaledVector(dir, LEN / 2);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      g.add(beam);
      unitAnims.push((t, dt, night) => {
        beam.material.opacity = 0.02 + night * 0.10
          + Math.sin(t * 9.5) * 0.006;       // faint pulse, nod to 9.5 kHz PRF
      });
    }
  }
  if (eff.includes('observatory')) {         // opens at dusk, tracks, seals at dawn
    const shutter = g.getObjectByName('shutter_leaf');
    const domeA = g.getObjectByName('dome_assembly');
    const mount = g.getObjectByName('mount_azimuth');
    const ota = g.getObjectByName('ota_elevation');
    unitAnims.push((t, dt, night) => {
      const open = THREE.MathUtils.clamp(night * 1.8 - 0.2, 0, 1);
      if (shutter) shutter.rotation.x = THREE.MathUtils.lerp(
        shutter.rotation.x, -1.35 * open, Math.min(dt * 0.6, 1));
      if (domeA && open > 0.9) {
        domeA.rotation.y += dt * 0.02;
        // telescope azimuth follows the dome so the OTA keeps looking out
        // the slit (both frames share the asset root, same-y alignment)
        if (mount) mount.rotation.y = domeA.rotation.y;
      }
      if (ota) ota.rotation.x = THREE.MathUtils.lerp(
        ota.rotation.x, -0.5 * open, Math.min(dt * 0.3, 1));
    });
  }
}

// -------- inspect mode: orbit the camera around one unit to see it whole
let inspectUnit = null;
const inspectSaved = { pos: new THREE.Vector3(), yaw: 0, pitch: 0 };
const hintEl = document.getElementById('hint');
const hintDefault = hintEl.textContent;

function enterInspect(u) {
  if (orbitMode || inspectUnit) return;
  inspectUnit = u;
  inspectSaved.pos.copy(rig.position);
  inspectSaved.yaw = yaw;
  inspectSaved.pitch = pitch;
  if (document.pointerLockElement) document.exitPointerLock();
  rig.position.set(0, 0, 0);
  rig.rotation.y = 0;
  camera.rotation.set(0, 0, 0);
  const d = u.radius * 2.4;
  camera.position.copy(u.center)
    .add(new THREE.Vector3(d * 0.75, d * 0.55, d * 0.75));
  orbitControls.target.copy(u.center);
  orbitControls.minDistance = u.radius * 1.15;
  orbitControls.maxDistance = u.radius * 8;
  orbitControls.enabled = true;
  hintEl.textContent = T.inspectHint(u.name);
  buildActionBar(u);
}

// one-shot triggers authored by the module (MODELS.md §4): userData.actions is
// { 名称: fn } — surfaced as buttons only while inspecting that unit
const actionBar = document.getElementById('actionBar');
function buildActionBar(u) {
  const acts = u.group.userData.actions;
  actionBar.innerHTML = '';
  if (!acts) { actionBar.style.display = 'none'; return; }
  for (const [name, fn] of Object.entries(acts)) {
    if (typeof fn !== 'function') continue;
    const b = document.createElement('button');
    b.textContent = '▶ ' + name;
    b.onclick = () => { try { fn(); } catch (e) { console.warn('action', name, e); } };
    actionBar.appendChild(b);
  }
  actionBar.style.display = actionBar.children.length ? 'flex' : 'none';
}

function exitInspect() {
  if (!inspectUnit) return;
  inspectUnit = null;
  actionBar.style.display = 'none';
  orbitControls.enabled = false;
  rig.position.copy(inspectSaved.pos);
  yaw = inspectSaved.yaw;
  pitch = inspectSaved.pitch;
  camera.position.set(0, 1.7, 0);
  camera.rotation.set(0, 0, 0);
  hintEl.textContent = hintDefault;
}

addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (inInterior) { exitInterior(); return; }
    if (inspectUnit) exitInspect();
  }
  if (e.code === 'KeyV') {
    if (inInterior) return;
    if (inspectUnit) { exitInspect(); return; }
    if (orbitMode || !colonyGroup.visible) return;
    let bu = null, bd = Infinity;
    for (const u of units) {
      const d = rig.position.distanceTo(u.center);
      if (d < Math.max(60, u.radius * 3) && d < bd) { bd = d; bu = u; }
    }
    if (bu) enterInspect(bu);
  }
  if (e.code === 'KeyE' && inInterior && nearDoor) {
    switchInterior(nearDoor);
    return;
  }
  if (e.code === 'KeyU' && !inInterior && !orbitMode && !inspectUnit) {
    enterInterior('hab-foyer-01', null);       // undercity shortcut (also ⬇ button)
    return;
  }
  if (e.code === 'KeyE' && nearPortal && !inInterior) {
    enterInterior(nearPortal.interior, nearPortal);
  }
});

// ---------------- interior scenes (穿门加载到独立室内场景) ----------------
const interiorGroup = new THREE.Group();
interiorGroup.visible = false;
scene.add(interiorGroup);
const interiorAmbient = new THREE.HemisphereLight(0xffffff, 0x404040, 0);
scene.add(interiorAmbient);
const interiorCache = {};
let inInterior = null;                        // active interior record or null
let interiorExiting = false;                  // exitInterior re-entrancy guard
// single manifest fetch shared by loadUnits and the interior loader
const manifestP = fetch('../models/manifest.json')
  .then((r) => r.json()).catch(() => ({ assets: [] }));
let nearPortal = null;                        // surface portal in range (for 'E')
const savedEnv = {};
// surface trigger zones: walk near -> press E to enter (tied to hab-tunnel door)
const PORTALS = [
  { pos: [-330, -12], radius: 7, interior: 'hab-foyer-01', label: '地下城', label_en: 'Undercity' },
  { pos: [-372, -18], radius: 5, interior: 'hab-foyer-01', label: '地下城（电梯）', label_en: 'Undercity (lift)' },
  // 温室穹顶气闸门廊(res-dome-01 @ (95,70) rot180,门廊朝城)
  { pos: [95, 53], radius: 5.5, interior: 'res-dome-hall-01', label: '温室穹顶', label_en: 'Greenhouse dome' },
  { pos: [-262, -159.4], radius: 4.5, interior: 'hab-museum-hall-01', label: '博物馆', label_en: 'Museum' },
  // FEL access shaft: sited by the delivering session at 625 m from the seismic
  // station (its 400 m quiet radius) and inside the undercity gate cluster
  { pos: [-395, 25], radius: 5.5, interior: 'sci-fel-01',
    label: '自由电子激光装置', label_en: 'Free-electron laser' },
];
// interior-to-interior doors (E-gated, no auto-trigger): the foyer's inner
// personnel door leads to the clinic; the clinic's +Z opening leads back
const INTERIOR_DOORS = [
  { from: 'hab-foyer-01', pos: [3.9, -18.8], radius: 1.7, to: 'hab-clinic-01',
    label: '医务室', label_en: 'Clinic', entry: { pos: [0, 0, -1.6], yaw: 0 } },
  { from: 'hab-clinic-01', pos: [0, -0.1], radius: 1.5, to: 'hab-foyer-01',
    label: '玄关', label_en: 'Foyer', entry: { pos: [3.9, 0, -18.2], yaw: Math.PI } },
  // foyer lift doors descend 3000 m to the deep dark-matter lab
  { from: 'hab-foyer-01', pos: [5.4, -15.5], radius: 1.6, to: 'sci-deeplab-01',
    label: '深地实验室（电梯 −3000 m）', label_en: 'Deep lab (lift, −3000 m)' },
  { from: 'sci-deeplab-01', pos: [0, 3.2], radius: 1.6, to: 'hab-foyer-01',
    label: '玄关（电梯 ↑）', label_en: 'Foyer (lift up)',
    entry: { pos: [4.6, 0, -15.5], yaw: Math.PI } },
  // 玄关左墙 → 量子计算中心「玄枢」(QP-20)
  { from: 'hab-foyer-01', pos: [-5.4, -8], radius: 1.6, to: 'sci-quantum-01',
    label: '量子计算中心', label_en: 'Quantum computing center' },
  { from: 'sci-quantum-01', pos: [0, 7.5], radius: 1.5, to: 'hab-foyer-01',
    label: '玄关', label_en: 'Foyer',
    entry: { pos: [-4.6, 0, -8], yaw: -Math.PI / 2 } },
  // 玄关右墙 → 芯片厂(一厂三线:sky130 数字 / 65nm 模拟 / 超导 JJ)
  { from: 'hab-foyer-01', pos: [5.4, -2.5], radius: 1.6, to: 'ops-fab-01',
    label: '芯片厂', label_en: 'Chip fab' },
  { from: 'ops-fab-01', pos: [0, 7.5], radius: 1.5, to: 'hab-foyer-01',
    label: '玄关', label_en: 'Foyer',
    entry: { pos: [4.6, 0, -2.5], yaw: Math.PI / 2 } },
  // 玄关左墙前段 → 居住区(舱室+水培农场+公共区+B 世界休息舱)
  { from: 'hab-foyer-01', pos: [-5.4, -3.5], radius: 1.6, to: 'hab-quarter-01',
    label: '居住区', label_en: 'Residential quarter' },
  { from: 'hab-quarter-01', pos: [0, 7.5], radius: 1.5, to: 'hab-foyer-01',
    label: '玄关', label_en: 'Foyer',
    entry: { pos: [-4.6, 0, -3.5], yaw: -Math.PI / 2 } },
  // 玄关左墙后段 → 娱乐中心(低重力半场/攀岩/台球/影院/酒吧/街机)
  { from: 'hab-foyer-01', pos: [-5.4, -13], radius: 1.6, to: 'hab-rec-01',
    label: '娱乐中心', label_en: 'Recreation hall' },
  { from: 'hab-rec-01', pos: [0, 0.5], radius: 1.5, to: 'hab-foyer-01',
    label: '玄关', label_en: 'Foyer',
    entry: { pos: [-4.6, 0, -13], yaw: -Math.PI / 2 } },
  // 玄关左墙末段 → 分析测试中心(六台仪器共享平台,全城的送样终点)
  { from: 'hab-foyer-01', pos: [-5.4, -18], radius: 1.6, to: 'sci-lab-01',
    label: '分析测试中心', label_en: 'Analytical core facility',
    entry: { pos: [0, 0, 9.2], yaw: 0 } },
  { from: 'sci-lab-01', pos: [0, 10.2], radius: 1.5, to: 'hab-foyer-01',
    label: '玄关', label_en: 'Foyer',
    entry: { pos: [-4.6, 0, -18], yaw: -Math.PI / 2 } },
  // 玄关右墙中段 → 冷冻电镜实验室(300 kV,城市的分子之眼);其自带的
  // 门龛标着「返回玄关」,故 exitZone 已在 manifest 里禁用,回程走这道门
  { from: 'hab-foyer-01', pos: [5.4, -9.0], radius: 1.6, to: 'sci-cryoem-01',
    label: '冷冻电镜实验室', label_en: 'Cryo-EM lab' },
  { from: 'sci-cryoem-01', pos: [-6.4, 9.4], radius: 1.5, to: 'hab-foyer-01',
    label: '玄关', label_en: 'Foyer',
    entry: { pos: [4.6, 0, -9.0], yaw: Math.PI / 2 } },
];
let nearDoor = null;

// enterable-spot markers: breathing ring + falling chevrons + light pillar +
// floating name tag at every E-key zone; amber variant marks the way back out.
// Driven from PORTALS / INTERIOR_DOORS, so new doors get marked automatically.
function makePortalMarker(label, color, r = 1.9, h = 4.6, tagColor = '#bfeaff') {
  const g = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true,
    opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.78, r, 40), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.07;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 0.74, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1,
      side: THREE.DoubleSide, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.05;
  const coneMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
  const chevrons = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.62, 4), coneMat);
    c.rotation.x = Math.PI;
    c.position.y = i * 0.8;
    chevrons.add(c);
  }
  chevrons.position.y = h * 0.52;
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.3, h, 12, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  pillar.position.y = h / 2;
  const tag = textSprite(label, 40, tagColor);
  tag.scale.set(4.6, 0.58, 1);
  tag.position.y = h + 0.5;
  g.add(ring, disc, chevrons, pillar, tag);
  g.traverse((o) => { o.raycast = () => {}; });
  g.userData.markerAnim = (t) => {
    ringMat.opacity = 0.4 + 0.25 * Math.sin(t * 2.4);
    chevrons.position.y = h * 0.52 + 0.18 * Math.sin(t * 2.4);
  };
  return g;
}
const fadeEl = document.getElementById('fade');
const portalPromptEl = document.getElementById('portalPrompt');

async function getInterior(id) {
  if (interiorCache[id]) return interiorCache[id];
  // interiors are manifest-registered code assets (kind:'interior', module in
  // units/ — MODELS.md §4b); ./interiors/ kept as a legacy fallback path
  const a = ((await manifestP).assets || [])
    .find((x) => x.id === id && x.kind === 'interior');
  const mod = await import(a?.module ? `./${a.module}` : `./interiors/${id}.js`);
  const group = mod.build(THREE);
  group.visible = false;
  interiorGroup.add(group);
  const lights = [];
  for (const l of group.userData.lights || []) {
    const pl = new THREE.PointLight(l.color ?? 0xffffff, 0, l.range ?? 20, 2);
    pl.position.set(l.pos[0], l.pos[1], l.pos[2]);
    pl.userData.base = 2 + (l.range ?? 20) * 0.3;
    group.add(pl);
    lights.push(pl);
  }
  // interior-companion assets (manifest kind:'interior-companion', host=this
  // interior): residents mounted inside the scene at host_pos; their motion
  // registers into a per-interior registry driven only while inside
  const anims = [];
  registerMotion(group, anims);   // interior's own animate/spinners (e.g. deeplab event FSM)
  const pois = [];
  await loadInteriorPois(pois, group, id,
    pick({ ...mod.meta, name_en: mod.meta?.name_en || a?.name_en }, 'name') || id);
  for (const c of (await manifestP).assets || []) {
    if (c.kind !== 'interior-companion' || c.host !== id) continue;
    try {
      const cm = await import(`./${c.module || `units/${c.id}.js`}`);
      const cg = cm.build(THREE);
      if (c.host_pos) cg.position.set(...c.host_pos);
      group.add(cg);
      registerMotion(cg, anims);
      for (const m of cg.userData?.nightMats || [])   // interiors: lights always on
        m.emissiveIntensity = Math.max(m.emissiveIntensity, 1.6);
      await loadInteriorPois(pois, cg, c.id,
        pick({ ...cm.meta, name_en: cm.meta?.name_en || c.name_en }, 'name') || c.id);
      console.info('[interior-companion] mounted', c.id, 'in', id);
    } catch (err) { console.warn('[interior-companion] failed', c.id, err); }
  }
  for (const d of INTERIOR_DOORS) {          // mark this interior's doors
    if (d.from !== id) continue;
    const mk = makePortalMarker(pick(d, 'label'), 0x3ec8ff, 1.1, 2.6);
    mk.position.set(d.pos[0], 0.02, d.pos[1]);
    group.add(mk);
    anims.push(mk.userData.markerAnim);
  }
  {                                          // amber marker on the way out
    const ez = a?.exitZone || group.userData.exitZone || { pos: [0, 0], radius: 3 };
    const mk = makePortalMarker(LANG === 'en' ? 'To surface' : '返回地表',
      0xffb050, Math.min(ez.radius * 0.6, 1.4), 2.4, '#ffe2b0');
    mk.position.set(ez.pos[0], 0.02, ez.pos[1]);
    group.add(mk);
    anims.push(mk.userData.markerAnim);
  }
  const rec = { id, group, lights, anims, pois,
    meta: { ...mod.meta, name_en: mod.meta?.name_en || a?.name_en },
    entry: a?.entry || group.userData.entry || { pos: [0, 0, 0], yaw: 0 },
    exitZone: a?.exitZone || group.userData.exitZone || { pos: [0, 0], radius: 3 } };
  return (interiorCache[id] = rec);
}

// interior knowledge cards: sprites ride the poi_ anchor nodes themselves
// (companions move — a bot's cards walk with it); proximity handled per frame
async function loadInteriorPois(pois, g, id, unitName) {
  let info;
  try {
    const r = await fetch(`units/${id}.info.json`);
    if (!r.ok) return;
    info = await r.json();
  } catch { return; }
  for (const p of info.pois || []) {
    let node = p.id && g.getObjectByName('poi_' + p.id);
    if (!node && p.pos) {
      node = new THREE.Object3D();
      node.position.set(...p.pos);
      g.add(node);
    }
    if (!node) continue;
    const dot = new THREE.Sprite(new THREE.SpriteMaterial(
      { map: poiDotTex, transparent: true, depthWrite: false }));
    dot.scale.set(0.22, 0.22, 1);
    dot.visible = false;
    dot.raycast = () => {};
    node.add(dot);
    const tag = textSprite(pick(p, 'label'), 40, '#dff2ff');
    tag.scale.set(2.6, 0.33, 1);
    tag.position.y = 0.32;
    tag.visible = false;
    node.add(tag);
    pois.push({ node, dot, tag, label: pick(p, 'label'), detail: pick(p, 'detail') || '',
      specs: (LANG === 'en' && p.specs_en) || p.specs, physics: pick(p, 'physics'),
      sim: pick(p, 'sim'), unit: unitName,
      range: Math.min(p.range ?? 8, 10) });
  }
}

const _ipTmp = new THREE.Vector3();
function updateInteriorPois() {
  let best = null, bd = 2.6;
  for (const p of inInterior.pois) {
    const wp = p.node.getWorldPosition(_ipTmp);
    const d = Math.hypot(wp.x - rig.position.x, wp.z - rig.position.z);
    const show = d < p.range;
    p.dot.visible = show && d >= 2.6;
    p.tag.visible = show && d < 6;
    if (d < bd) { bd = d; best = p; }
  }
  const cid = best ? 'int:' + best.label : '';
  if (best && poiCardEl.dataset.id !== cid) {
    const lines = (icon, val, cls) => (Array.isArray(val) ? val : [val])
      .map((s) => `<p class="${cls}">${icon} ${s}</p>`).join('');
    let h = `<h3>${best.label}</h3><div class="u">${best.unit}</div>`;
    if (best.detail) h += `<p>${best.detail}</p>`;
    if (best.specs) h += '<table>' + Object.entries(best.specs).map(
      ([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') + '</table>';
    if (best.physics) h += lines('🔬', best.physics, 'phys');
    if (best.sim) h += lines('📐', best.sim, 'sim');
    poiCardEl.dataset.id = cid;
    poiCardEl.innerHTML = h;
    poiCardEl.style.display = 'block';
  } else if (!best && (poiCardEl.dataset.id || '').startsWith('int:')) {
    poiCardEl.style.display = 'none';
    poiCardEl.dataset.id = '';
  }
}

// hop between interiors through a declared door (keeps savedEnv: Esc still
// returns to the original surface spot)
async function switchInterior(door) {
  if (!inInterior || interiorExiting) return;
  const from = inInterior;
  interiorExiting = true;                     // block exit-zone races during fade
  await fade(1);
  from.group.visible = false;
  for (const pl of from.lights) pl.intensity = 0;
  const rec = await getInterior(door.to);
  rec.exitArmed = false;
  rec.group.visible = true;
  for (const pl of rec.lights) pl.intensity = pl.userData.base;
  const en = door.entry || rec.entry;
  rig.position.set(en.pos[0], 0, en.pos[2]);
  yaw = en.yaw || 0; pitch = 0;
  inInterior = rec;
  interiorExiting = false;
  nearDoor = null;
  portalPromptEl.style.display = 'none';
  if (poiCardEl.dataset.id.startsWith('int:')) {
    poiCardEl.style.display = 'none'; poiCardEl.dataset.id = '';
  }
  hintEl.textContent = T.interiorHint(pick(rec.meta, 'name'));
  await fade(0);
}

function fade(to) {
  return new Promise((res) => {
    fadeEl.style.opacity = to;
    setTimeout(res, 280);
  });
}

async function enterInterior(id, portal) {
  if (inInterior || orbitMode || inspectUnit) return;
  await fade(1);
  const rec = await getInterior(id);
  savedEnv.pos = rig.position.clone();
  savedEnv.yaw = yaw; savedEnv.pitch = pitch; savedEnv.fly = flying;
  savedEnv.fog = scene.fog; savedEnv.bg = scene.background;
  surfaceGroup.visible = false;              // hides terrain/sky/colony/magic
  scene.fog = null;
  scene.background = new THREE.Color(0x0a0806);
  sun.intensity = 0.12; hemi.intensity = 0.08;
  interiorGroup.visible = true;
  rec.group.visible = true;
  for (const pl of rec.lights) pl.intensity = pl.userData.base;
  interiorAmbient.intensity = 0.45;
  flying = false; pitch = 0;
  camera.rotation.set(0, 0, 0);       // defensive: shed any stale roll/yaw residue
  rig.position.set(rec.entry.pos[0], 0, rec.entry.pos[2]);
  yaw = rec.entry.yaw || 0;
  if (document.pointerLockElement) canvas.requestPointerLock();
  rec.exitArmed = false;                     // re-arm the exit zone each entry
  inInterior = rec;
  // the greenhouse dome is a surface interior - it keeps the surface score
  musicSetScene(id === 'res-dome-hall-01' ? surfaceScene() : 'under');
  nearPortal = null;
  portalPromptEl.style.display = 'none';
  hintEl.textContent = T.interiorHint(pick(rec.meta, 'name'));
  await fade(0);
}

async function exitInterior() {
  if (!inInterior || interiorExiting) return;  // fade is async: block re-entry
  interiorExiting = true;
  await fade(1);
  inInterior.group.visible = false;
  for (const pl of inInterior.lights) pl.intensity = 0;
  interiorGroup.visible = false;
  interiorAmbient.intensity = 0;
  surfaceGroup.visible = true;
  scene.fog = savedEnv.fog;
  scene.background = savedEnv.bg;
  rig.position.copy(savedEnv.pos);
  yaw = savedEnv.yaw; pitch = savedEnv.pitch; flying = savedEnv.fly;
  inInterior = null;
  musicSetScene(surfaceScene());
  interiorExiting = false;
  nearDoor = null;
  portalPromptEl.style.display = 'none';
  if (poiCardEl.dataset.id.startsWith('int:')) {
    poiCardEl.style.display = 'none'; poiCardEl.dataset.id = '';
  }
  hintEl.textContent = hintDefault;
  await fade(0);
}

function updateInterior(dt) {
  // flat floor: keep feet at y=0; simple room-bounds clamp; exit-zone check
  const half = (inInterior.meta.size_m || 24) / 2 - 0.6;
  rig.position.x = THREE.MathUtils.clamp(rig.position.x, -half, half);
  rig.position.z = THREE.MathUtils.clamp(rig.position.z, -half, half);
  rig.position.y = 0;
  // exit zone only fires after the player has been outside it once — a direct
  // ?interior= entry (or a module without entry/exitZone) may spawn inside it
  const ez = inInterior.exitZone;
  const inZone =
    Math.hypot(rig.position.x - ez.pos[0], rig.position.z - ez.pos[1]) < ez.radius;
  if (!inZone) inInterior.exitArmed = true;
  else if (inInterior.exitArmed) { exitInterior(); return; }
  // interior doors: E-gated, so standing in the zone just shows the prompt
  let dbest = null;
  for (const d of INTERIOR_DOORS) {
    if (d.from !== inInterior.id) continue;
    if (Math.hypot(rig.position.x - d.pos[0], rig.position.z - d.pos[1]) < d.radius)
      { dbest = d; break; }
  }
  if (dbest !== nearDoor) {
    nearDoor = dbest;
    portalPromptEl.textContent = dbest ? T.pressE(pick(dbest, 'label')) : '';
    portalPromptEl.style.display = dbest ? 'block' : 'none';
  }
}

function updatePortals() {                    // surface: detect nearby door
  if (inInterior || orbitMode || inspectUnit || renderer.xr.isPresenting) {
    if (nearPortal) { nearPortal = null; portalPromptEl.style.display = 'none'; }
    return;
  }
  let p = null;
  for (const pt of PORTALS) {
    if (Math.hypot(rig.position.x - pt.pos[0], rig.position.z - pt.pos[1]) < pt.radius)
      { p = pt; break; }
  }
  if (p !== nearPortal) {
    nearPortal = p;
    portalPromptEl.textContent = p ? T.pressE(pick(p, 'label')) : '';
    portalPromptEl.style.display = p ? 'block' : 'none';
  }
}

// scatter packs: instantiate each builder at listed spots. Placements come
// from the manifest entry ("placements": [[builder, x, z, rot?], ...]) so any
// pack can ship its own layout; env-scatter-01 keeps its legacy built-in list.
async function loadScatter(a) {
  const mod = await import(`./units/${a.id}.js`);
  const B = mod.builders || {};
  const spots = a.placements || [
    ['weatherMast', -260, -40], ['weatherMast', 210, -260],
    ['navBeacon', -60, -140], ['navBeacon', 90, 250], ['navBeacon', -340, 120],
    ['monument', -430, 60], ['heatshield', 470, -360], ['paraDebris', 520, -300],
    ['helicopter', -300, -560], ['cairn', 320, 420], ['cairn', -520, -300],
    ['cairn', 160, -470], ['supplyCache', -120, 210], ['supplyCache', 400, 120],
  ];
  for (const [name, x, z, rot] of spots) {
    const fn = B[name];
    if (!fn) continue;
    const g = fn(THREE);
    g.position.set(x, sampleHeight(x, z), z);
    g.rotation.y = rot ?? (x * 0.7 + z);       // varied heading
    colonyGroup.add(g);
    if (g.userData.nightMats) unitNightMats.push(...g.userData.nightMats);
    collectDeviceExtras(g, 40);
  }
}

async function loadUnits() {
  const mf = await manifestP;
  for (const pt of PORTALS) {                // mark every surface E-portal
    const mk = makePortalMarker(pick(pt, 'label'), 0x3ec8ff);
    mk.position.set(pt.pos[0], sampleHeight(pt.pos[0], pt.pos[1]) + 0.05, pt.pos[1]);
    colonyGroup.add(mk);
    unitAnims.push(mk.userData.markerAnim);
  }
  for (const a of mf.assets || []) {
    if (!a.type) continue;                   // registered but not deliverable yet
    if (a.kind === 'scatter') {              // wilderness prop pack (many instances)
      try { await loadScatter(a); console.info('[scatter] placed', a.id); }
      catch (err) { console.warn('[scatter] failed', a.id, err); }
      continue;
    }
    if (!a.pos) continue;
    try {
      let g;
      if (a.type === 'code') {
        const mod = await import(`./units/${a.id}.js`);
        g = mod.build(THREE);
        if (mod.meta?.schedule) scheduled.push({ g, ...mod.meta.schedule });
      } else {
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const gltf = await new Promise((res, rej) => new GLTFLoader().load(
          `../models/${a.id}/model.glb`, res, undefined, rej));
        g = gltf.scene;
        if (gltf.animations?.length) {           // auto-play loop_* glTF clips
          const mixer = new THREE.AnimationMixer(g);
          for (const clip of gltf.animations) {
            if (clip.name.startsWith('loop_') || gltf.animations.length === 1)
              mixer.clipAction(clip).play();
          }
          mixers.push(mixer);
        }
      }
      placeUnit(g, a);
      await loadPois(g, a);
      applyEffects(g, a);
      console.info('[unit] placed', a.id);
      if (q.has('debug')) document.getElementById('missionInfo')
        .textContent += ` ✓${a.id}`;
    } catch (err) {
      console.warn('[unit] failed', a.id, err);
      if (q.has('debug')) document.getElementById('missionInfo')
        .textContent += ` ✗${a.id}: ${err.message}`;
    }
  }
  const ins = q.get('inspect');              // ?inspect=sci-lidar-01
  if (ins) {
    const u = units.find((x) => x.id === ins);
    if (u) {
      toggleColony(true);
      enterInspect(u);
    }
  }
}
loadUnits()
  .catch((e) => console.warn('[units] loader rejected', e))
  .then(() => {
    try { collectColliders(colonyGroup, 1); }
    catch (e) { console.warn('[collide] colony collect failed', e); }
  });

// ------------------------------------------------------------- collision
// Static AABB colliders derived at load time from geometry that already
// exists - zero bytes added to any asset file. Three-way classification per
// box against the walker: tops within step height are mountable (stairs,
// pads, palace terraces), bottoms above head height are walk-under (eaves,
// pipe lanes, lintels), the rest block. Instanced meshes (trees, posts,
// balustrades) are deliberately transparent to walking.
// Triangle-classified height/wall grids, 2 m cells. Mesh-level AABBs fail on
// merged batches (one palace mesh spans hundreds of metres), so every
// triangle is sorted once at load: up-facing ones (ny > 0.55) stamp platform
// heights into a floor grid, steep ones (|ny| < 0.55) stamp [minY,maxY]
// blocking spans into a wall grid. Risers below step height never block, so
// stairs climb; eaves above head height never block, so doors and pipe lanes
// pass. Instanced meshes (trees, posts, balustrades) stay transparent.
const COL_CELL = 2, COL_STEP = 0.65, COL_HEAD = 1.7, COL_R = 0.35;
// per-layer grids so a hidden layer stops colliding (1 = colony, 2 = imperial)
const colGrids = { 1: { floor: new Map(), wall: new Map() },
                   2: { floor: new Map(), wall: new Map() } };
function colActiveGrids() {
  const out = [];
  if (colonyGroup.visible) out.push(colGrids[1]);
  if (imperialGroup.visible) out.push(colGrids[2]);
  return out;
}
let colTris = 0;
const colKey = (x, z) => Math.floor(x / COL_CELL) * 200000 + Math.floor(z / COL_CELL);
function collectColliders(root, tag) {
  const t0 = performance.now();
  const colFloor = colGrids[tag].floor, colWall = colGrids[tag].wall;
  root.updateMatrixWorld(true);
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSprite) return;
    const g = o.geometry, pos = g.getAttribute('position');
    if (!pos) return;
    const idx = g.getIndex();
    const triN = (idx ? idx.count : pos.count) / 3;
    for (let i = 0; i < triN; i++) {
      const a = idx ? idx.getX(i * 3) : i * 3;
      const b = idx ? idx.getX(i * 3 + 1) : i * 3 + 1;
      const c = idx ? idx.getX(i * 3 + 2) : i * 3 + 2;
      va.fromBufferAttribute(pos, a).applyMatrix4(o.matrixWorld);
      vb.fromBufferAttribute(pos, b).applyMatrix4(o.matrixWorld);
      vc.fromBufferAttribute(pos, c).applyMatrix4(o.matrixWorld);
      n.crossVectors(ab.subVectors(vb, va), ac.subVectors(vc, va));
      const len = n.length();
      if (len < 1e-8) continue;
      const ny = Math.abs(n.y / len);
      const up = ny > 0.55, wall = ny < 0.55;
      const minX = Math.min(va.x, vb.x, vc.x), maxX = Math.max(va.x, vb.x, vc.x);
      const minZ = Math.min(va.z, vb.z, vc.z), maxZ = Math.max(va.z, vb.z, vc.z);
      const minY = Math.min(va.y, vb.y, vc.y), maxY = Math.max(va.y, vb.y, vc.y);
      colTris++;
      for (let cx = Math.floor(minX / COL_CELL); cx <= Math.floor(maxX / COL_CELL); cx++)
        for (let cz = Math.floor(minZ / COL_CELL); cz <= Math.floor(maxZ / COL_CELL); cz++) {
          const k = cx * 200000 + cz;
          if (up) {
            let f = colFloor.get(k);
            if (!f) colFloor.set(k, f = []);
            let dup = false;                       // quantize: merge near-equal levels
            for (let j = 0; j < f.length; j++) if (Math.abs(f[j] - maxY) < 0.35) { dup = true; if (maxY > f[j]) f[j] = maxY; break; }
            if (!dup && f.length < 10) { f.push(maxY); f.sort((p, q) => p - q); }
          }
          if (wall) {
            let w = colWall.get(k);
            if (!w) colWall.set(k, w = []);
            let merged = false;                    // merge overlapping spans
            for (let j = 0; j < w.length; j += 2)
              if (minY < w[j + 1] + 0.3 && maxY > w[j] - 0.3) {
                w[j] = Math.min(w[j], minY); w[j + 1] = Math.max(w[j + 1], maxY);
                merged = true; break;
              }
            if (!merged && w.length < 16) w.push(minY, maxY);
          }
        }
    }
  });
  console.info('[collide]', colTris, 'tris ->', colFloor.size, 'floor cells,',
    colWall.size, 'wall cells,', Math.round(performance.now() - t0), 'ms');
}
function colFloorAt(px, pz, feet) {
  let best = sampleHeight(px, pz);
  for (const g of colActiveGrids()) {
    const f = g.floor.get(colKey(px, pz));
    if (f) for (let j = f.length - 1; j >= 0; j--)
      if (f[j] <= feet + COL_STEP) { if (f[j] > best) best = f[j]; break; }
  }
  return best;
}
function colBlocked(px, pz, feet, floor) {
  for (const g of colActiveGrids())
    for (const dx of [-COL_R, COL_R]) for (const dz of [-COL_R, COL_R]) {
      const w = g.wall.get(colKey(px + dx, pz + dz));
      if (!w) continue;
      for (let j = 0; j < w.length; j += 2)
        if (w[j + 1] > floor + COL_STEP && w[j] < feet + COL_HEAD
            && w[j + 1] - w[j] > 0.2) return true;
    }
  return false;
}
window.__col = { colGrids, colFloorAt, colBlocked, colKey };   // debug handle
// walker resolve: axis-separated slide - blocked moves cancel per axis
function collideWalk(dt, px0, pz0) {
  const feet = rig.position.y;
  let nx = rig.position.x, nz = rig.position.z;
  let floor = colFloorAt(nx, nz, feet);
  if (colBlocked(nx, nz, feet, floor)) {
    if (!colBlocked(nx, pz0, feet, colFloorAt(nx, pz0, feet))) nz = pz0;
    else if (!colBlocked(px0, nz, feet, colFloorAt(px0, nz, feet))) nx = px0;
    else { nx = px0; nz = pz0; }
    rig.position.x = nx; rig.position.z = nz;
    floor = colFloorAt(nx, nz, feet);
  }
  const dy = floor - feet;                         // snap up steps, fall smoothly
  rig.position.y = dy < -1.0 ? feet - Math.min(-dy, 22 * dt) : floor;
}

const _cp = new THREE.Vector3();
function updatePois() {
  if (!pois.length) return;
  const show = !orbitMode && colonyGroup.visible;
  camera.getWorldPosition(_cp);
  const vis = [];
  for (const p of pois) {
    p.d = _cp.distanceTo(p.wp);
    p.ins = inspectUnit && p.g === inspectUnit.group;
    if (!show || (!p.ins && p.d > p.range * 1.5)) {
      p.dot.visible = p.tag.visible = false;
      continue;
    }
    vis.push(p);
  }
  vis.sort((x, y) => x.d - y.d);
  let best = null;
  vis.forEach((p) => {
    // floating name tags only in inspect mode; main page stays label-free
    p.tag.visible = p.ins;
    p.dot.visible = false;
    if (!best && p.d < Math.min(9, p.range * 0.5)) best = p;   // proximity card
  });
  if (best) {
    if (poiCardEl.dataset.id !== best.label) {
      poiCardEl.dataset.id = best.label;
      // string | string[] → one <p> per line (mechanism vs calculation layers)
      const lines = (icon, val, cls) => (Array.isArray(val) ? val : [val])
        .map((s) => `<p class="${cls}">${icon} ${s}</p>`).join('');
      let html = `<h3>${best.label}</h3><div class="u">${best.unit}</div>`;
      if (best.detail) html += `<p>${best.detail}</p>`;
      if (best.specs) html += '<table>' + Object.entries(best.specs).map(
        ([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') + '</table>';
      if (best.physics) html += lines('🔬', best.physics, 'phys');
      if (best.sim) html += lines('📐', best.sim, 'sim');
      poiCardEl.innerHTML = html;
    }
    poiCardEl.style.display = 'block';
  } else {
    poiCardEl.style.display = 'none';
    poiCardEl.dataset.id = '';
  }
}

// ---------------------------------------------------------------- mars time

const JEZ_LAT = 18.4447 * Math.PI / 180;
const JEZ_LON = 77.4509;                    // degrees east

// Allison & McEwen (2000) approximation: Mars solar time and declination
function marsSolar(dateMs) {
  const jdTT = 2440587.5 + dateMs / 86400000 + 69.184 / 86400;
  const d = jdTT - 2451545.0;
  const M = THREE.MathUtils.degToRad(
    THREE.MathUtils.euclideanModulo(19.3871 + 0.52402073 * d, 360));
  const aFMS = 270.3871 + 0.524038496 * d;
  const eoc = (10.691 + 3.0e-7 * d) * Math.sin(M) + 0.623 * Math.sin(2 * M)
            + 0.050 * Math.sin(3 * M) + 0.005 * Math.sin(4 * M);
  const Ls = THREE.MathUtils.euclideanModulo(aFMS + eoc, 360);
  const LsR = THREE.MathUtils.degToRad(Ls);
  const eotDeg = 2.861 * Math.sin(2 * LsR) - 0.071 * Math.sin(4 * LsR)
               + 0.002 * Math.sin(6 * LsR) - eoc;
  const msd = (jdTT - 2405522.0028779) / 1.0274912517;
  const mtc = THREE.MathUtils.euclideanModulo(24 * msd, 24);
  const lmst = THREE.MathUtils.euclideanModulo(mtc + JEZ_LON / 15, 24);
  const ltst = THREE.MathUtils.euclideanModulo(lmst + eotDeg / 15, 24);
  const dec = Math.asin(0.42565 * Math.sin(LsR)) + 0.00436 * Math.sin(LsR);
  return { ltst, dec, Ls };
}

// stars over the surface at night (separate from the orbit starfield)
const nightStars = (() => {
  const n = 2500, p = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    do v.randomDirection(); while (v.y < 0.03);
    v.multiplyScalar(14200);
    p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial(
    { color: 0xfff4e0, size: 1.6, sizeAttenuation: false,
      transparent: true, opacity: 0, fog: false }));
  pts.onBeforeRender = () => pts.position.copy(rig.position);
  surfaceGroup.add(pts);
  return pts;
})();

const timeInfoEl = document.getElementById('timeInfo');
const timeSlider = document.getElementById('timeSlider');
const timeNowBtn = document.getElementById('timeNow');
let realTime = true;
timeSlider.addEventListener('input', () => {
  realTime = false;
  timeNowBtn.classList.remove('active');
});
timeNowBtn.addEventListener('click', () => {
  realTime = true;
  timeNowBtn.classList.add('active');
});
if (q.has('t')) {                      // ?t=18.5 pins Mars local time
  realTime = false;
  timeSlider.value = q.get('t');
  timeNowBtn.classList.remove('active');
}

const pal = {
  dayHor: new THREE.Color(0xe6b184), dayZen: new THREE.Color(0x6e4a33),
  duskHor: new THREE.Color(0x8a4a2c), duskZen: new THREE.Color(0x241310),
  nightHor: new THREE.Color(0x140b08), nightZen: new THREE.Color(0x030202),
  dayGlow: new THREE.Color(0xffd9b3), duskGlow: new THREE.Color(0x9cc4ff),
};
const _hor = new THREE.Color(), _zen = new THREE.Color(), _glow = new THREE.Color();
const skyU = sky.material.uniforms;

function updateSun() {
  const s = marsSolar(Date.now());
  const ltst = realTime ? s.ltst : parseFloat(timeSlider.value);
  updateClockText(s, ltst);
  if (orbitMode) moonTick(ltst);             // Phobos/Deimos ride the same clock
  // scheduled auto-triggers (meta.schedule): fire once when local time reaches it
  for (const sc of scheduled) {
    const near = Math.abs(ltst - sc.ltst) < 0.05;
    if (near && sc.armed !== false && colonyGroup.visible) {
      sc.armed = false;
      try { sc.g.userData.actions?.[sc.action]?.(); } catch { /* ignore */ }
    } else if (Math.abs(ltst - sc.ltst) > 0.3) {
      sc.armed = true;                            // re-arm once time moves away
    }
  }
  // blink beacons: ~0.8 s red pulse (blink_ meshes and userData.blinkMats).
  // Runs in every mode — orbit assets (MiniPAN TOF trigger LEDs) blink too,
  // so this sits above the orbit-mode early return.
  if (assetBlinks.length || assetBlinkMats.length) {
    const on = (performance.now() % 1600) < 800;
    for (const b of assetBlinks) {
      b.material.color.copy(on ? BLINK_LIT : BLINK_DIM);
      b.scale.setScalar(on ? 1.35 : 1.0);
    }
    for (const m of assetBlinkMats) {
      m.color.copy(m.userData.baseColor).multiplyScalar(on ? 1.0 : 0.28);
    }
  }
  if (orbitMode) return;                        // orbit view keeps fixed lighting
  const H = (ltst - 12) * 15 * Math.PI / 180;   // hour angle
  const sinEl = Math.sin(JEZ_LAT) * Math.sin(s.dec)
              + Math.cos(JEZ_LAT) * Math.cos(s.dec) * Math.cos(H);
  const east = -Math.cos(s.dec) * Math.sin(H);
  const north = Math.cos(JEZ_LAT) * Math.sin(s.dec)
              - Math.sin(JEZ_LAT) * Math.cos(s.dec) * Math.cos(H);
  const dir = new THREE.Vector3(east, sinEl, -north).normalize();
  skyU.sunDir.value.copy(dir);
  sun.position.copy(dir).multiplyScalar(1000);

  const elDeg = Math.asin(sinEl) * 180 / Math.PI;
  const day = THREE.MathUtils.smoothstep(elDeg, 0, 18);
  const night = THREE.MathUtils.smoothstep(-elDeg, 2, 12);
  _hor.lerpColors(pal.duskHor, pal.dayHor, day).lerp(pal.nightHor, night);
  _zen.lerpColors(pal.duskZen, pal.dayZen, day).lerp(pal.nightZen, night);
  _glow.lerpColors(pal.duskGlow, pal.dayGlow,
    THREE.MathUtils.smoothstep(elDeg, 4, 24));
  skyU.horizon.value.copy(_hor);
  skyU.zenith.value.copy(_zen);
  skyU.glowColor.value.copy(_glow);
  skyU.glowK.value = 0.55 * (1 - night);        // blue halo pops at dusk
  sun.intensity = 2.4 * THREE.MathUtils.smoothstep(elDeg, -1, 12);
  hemi.intensity = 0.1 + 0.85 * THREE.MathUtils.smoothstep(elDeg, -4, 16);
  dustFog.color.copy(_hor);
  nightStars.material.opacity = night;
  for (const l of colonyLights) l.intensity = colonyGroup.visible ? 350 * night : 0;
  for (const m of unitNightMats) m.emissiveIntensity = 0.25 + 1.3 * night;
  for (const l of unitLights) l.intensity = colonyGroup.visible ? 300 * night : 0;
  lastNight = night;
  for (const l of magicLights) l.intensity = magicGroup.visible ? 40 + 500 * night : 0;
  for (const l of imperialLights) l.intensity = imperialGroup.visible ? 30 + 260 * night : 0;
  crystalDay.value = day;
  for (const m of cryGlowMats) m.opacity = 0.1 + 0.35 * night;
  for (const m of cityPbrMats) m.emissiveIntensity = 0.05 + 0.4 * night;
  // sub-device tags: only in 环视(inspect) mode, and only the inspected unit's
  // own tags (owner match — a big unit's radius must not pull in neighbours)
  for (const s of assetLabels) {
    s.visible = !!inspectUnit && (s.userData.owner
      ? s.userData.owner === inspectUnit.id
      : inspectUnit.center.distanceTo(s.position) < inspectUnit.radius * 1.6);
  }
  // Facility name tags. With 47 placed assets a plain distance cutoff turned
  // the horizon into a band of overlapping text, so they are decluttered three
  // ways: a far cut, a cap on how many may show at once (nearest win), and a
  // screen-space overlap test so a nearer tag suppresses the ones behind it.
  camera.getWorldPosition(_camW);
  if (!nameTagsOn || !colonyGroup.visible) {
    for (const t of unitNameTags) t.spr.visible = false;
    return;
  }
  const NEAR_FADE = 40, FAR = 320, MAX_TAGS = 7;
  const shown = [];
  const cands = [];
  for (const t of unitNameTags) {
    t.spr.visible = false;
    if (inspectUnit && inspectUnit.id === t.unitId) continue;
    const d = _camW.distanceTo(t.center);
    if (d > FAR) continue;
    cands.push({ t, d });
  }
  cands.sort((a, b) => a.d - b.d);
  for (const { t, d } of cands) {
    if (shown.length >= MAX_TAGS) break;
    _tagV.copy(t.center).project(camera);
    if (_tagV.z > 1 || Math.abs(_tagV.x) > 1.1 || Math.abs(_tagV.y) > 1.1) continue;
    // suppress if it would land on top of a nearer tag already on screen
    let clash = false;
    for (const s of shown) {
      if (Math.abs(_tagV.x - s.x) < 0.20 && Math.abs(_tagV.y - s.y) < 0.055) {
        clash = true; break;
      }
    }
    if (clash) continue;
    // fade in as you approach the far edge, and out again when right on top
    const fade = Math.min(1, (FAR - d) / 90) * Math.min(1, d / NEAR_FADE);
    if (fade <= 0.05) continue;
    t.spr.material.opacity = fade;
    t.spr.visible = true;
    shown.push({ x: _tagV.x, y: _tagV.y });
  }
}

function updateClockText(s, ltst) {
  if (realTime) timeSlider.value = ltst.toFixed(2);
  const hh = String(Math.floor(ltst)).padStart(2, '0');
  const mm = String(Math.floor((ltst % 1) * 60)).padStart(2, '0');
  timeInfoEl.textContent = T.timeInfo(hh, mm, realTime, s.Ls.toFixed(0));
}

// relay constellation: 3 areostationary sats + 1 low science orbiter
const AREO = 20428;                          // areostationary orbit radius, km
// Real com-relay-01 model (1 unit = 1 m), exaggerated for orbit-view visibility
// like the old placeholder was; its +Z is the Mars-nadir face.
// Scale is chosen against apparent size, not realism: the bus is 30 m across,
// so the old x18 put it at 540 km - four pixels beside a 6779 km planet, which
// is why nothing up here could be read. x60 lands it near 1800 km, the same
// order as the CMB station's x320, and the constellation finally looks like
// spacecraft rather than dust. Distances stay true; only the hardware is
// enlarged, the same convention the TT-1 exhibit and the L2 station declare.
function relaySat(scale = 60) {
  const g = buildComRelay(THREE);
  g.scale.setScalar(scale);
  return g;
}
let relayAnchor = null, relayCardHTML = '';   // orbit-view knowledge card state
const relayPoiAnchors = [];                   // poi_* nodes of the Jezero primary
const relayPoiCards = {};                     // poi id -> full card HTML
const _relayTmp = new THREE.Vector3();
function buildSat(scale = 1) {                // still used by the low orbiter
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(70, 70, 110),
    new THREE.MeshLambertMaterial({ color: 0xd8d8e0 })));
  const wingMat = new THREE.MeshLambertMaterial(
    { color: 0x2c4a8a, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(300, 6, 90), wingMat);
    wing.position.x = s * 210;
    g.add(wing);
  }
  const dishS = new THREE.Mesh(
    new THREE.SphereGeometry(55, 12, 6, 0, Math.PI * 2, 0, 0.5),
    new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: THREE.DoubleSide }));
  dishS.position.z = 80;
  dishS.rotation.x = -Math.PI / 2;
  g.add(dishS);
  g.scale.setScalar(scale);
  return g;
}
{
  const ringPts = [];
  for (let i = 0; i <= 128; i++) ringPts.push(latLon(0, i / 128 * 360, AREO));
  orbitGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ringPts),
    new THREE.LineBasicMaterial({ color: 0x88bbee, transparent: true, opacity: 0.3 })));
  for (const off of [0, 120, 240]) {         // 3 primary, one above Jezero
    const sat = relaySat();
    sat.position.copy(latLon(0, 77.4 + off, AREO));
    sat.lookAt(0, 0, 0);                     // aims -Z at Mars...
    sat.rotateY(Math.PI);                    // ...model's nadir face is +Z
    orbitGroup.add(sat);
    registerMotion(sat, orbitAnims);         // SADA wings + Earth-dish gimbal
    if (off === 0) {                         // Jezero primary: per-POI inspect
      sat.traverse((o) => {
        if (o.name?.startsWith('poi_')) relayPoiAnchors.push(o);
      });
      // MiniPAN particle-analyser payload rides the primary only — bolted to
      // the zenith (-Z) deck corner, telescope axis along z (open sky above,
      // Mars albedo below). Model only, per Codex/PAN geometry; no analysis.
      const pan = buildPan(THREE);
      pan.rotation.x = -Math.PI / 2;         // bracket face onto the deck,
      pan.position.set(0.55, 0.45, -1.46);   // telescope axis horizontal —
      // the analyser is 0.28 m against a 30 m bus, so riding the bus scale
      // alone leaves it sub-pixel from any useful vantage. Give the payload a
      // further x7 so the instrument reads as hardware; it is the one thing up
      // here a reader is meant to look AT, not just past.
      pan.scale.setScalar(7);
      sat.add(pan);                          // both apertures see open sky
      // v2: PAN's own POI anchors + declared motion (event flash) + blink LEDs
      // ride the same orbit-view channels as the relay bus (added after the
      // sat-level registration above, so wire them explicitly here)
      pan.traverse((o) => {
        if (o.name?.startsWith('poi_')) relayPoiAnchors.push(o);
      });
      registerMotion(pan, orbitAnims);
      queueMicrotask(() => {                 // assetBlinkMats is declared later
        for (const m of pan.userData.blinkMats || []) {   // in the module (TDZ
          m.userData.baseColor = m.color.clone();         // here) — defer wiring
          assetBlinkMats.push(m);                         // past module eval
        }
      });
    }
  }
  const spare = relaySat(53);                // co-located hot spare (redundancy)
  spare.position.copy(latLon(0, 77.4 + 16, AREO));
  spare.lookAt(0, 0, 0);
  spare.rotateY(Math.PI);
  orbitGroup.add(spare);
  registerMotion(spare, orbitAnims);
  const spLbl = textSprite(T.orbLbl.spare, 34, '#c8b49a');
  spLbl.scale.set(2600, 340, 1);
  spLbl.position.copy(latLon(0, 77.4 + 16, AREO)).add(new THREE.Vector3(0, 1100, 0));
  orbitGroup.add(spLbl);

  // areostationary coverage limit: ±71° latitude at 10° min elevation — the
  // caps beyond are the polar blind zone the calc flagged (need polar sats)
  for (const lat of [71, -71]) {
    const ring = [];
    for (let i = 0; i <= 96; i++) ring.push(latLon(lat, i / 96 * 360, ORBIT_R + 20));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ring),
      new THREE.LineDashedMaterial({ color: 0xffb060, dashSize: 180,
        gapSize: 140, transparent: true, opacity: 0.5 }));
    line.computeLineDistances();
    orbitGroup.add(line);
  }
  const covLbl = textSprite(T.orbLbl.coverage, 34, '#ffcf9f');
  covLbl.scale.set(4600, 460, 1);
  covLbl.position.copy(latLon(80, 77.4, ORBIT_R + 900));
  orbitGroup.add(covLbl);

  // ---- polar-cap ring (com-polar-01 x3): circular polar orbit at the same
  // radius as the areostationary ring, plane through the rotation axis on the
  // city meridian (display choice; coverage is longitude-blind per its s02).
  // Unlike the stationary ring these three MOVE - one lap per sidereal sol,
  // driven from the same ltst clock as the moons.
  {
    const eEq = latLon(0, 77.4, 1).normalize();
    const jAx = new THREE.Vector3(0, 1, 0);
    const polarPos = (uDeg) => {
      const u = uDeg * Math.PI / 180;
      return eEq.clone().multiplyScalar(Math.cos(u) * AREO)
        .addScaledVector(jAx, Math.sin(u) * AREO);
    };
    const ring = [];
    for (let i = 0; i <= 128; i++) ring.push(polarPos(i / 128 * 360));
    orbitGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ring),
      new THREE.LineBasicMaterial({ color: 0x88eebb, transparent: true, opacity: 0.28 })));
    for (let k = 0; k < 3; k++) {
      const sat = buildComPolar(THREE);
      sat.scale.setScalar(60);                 // same convention as relaySat
      sat.position.copy(polarPos(120 * k));
      sat.lookAt(0, 0, 0);
      sat.rotateY(Math.PI);
      orbitGroup.add(sat);
      registerMotion(sat, orbitAnims);
      sat.traverse((o) => { if (o.name?.startsWith('poi_')) relayPoiAnchors.push(o); });
      polarSats.push(sat);
    }
    polarPosFn = polarPos;
    const pLbl = textSprite(T.orbLbl.polar, 36, '#a0e8c0');
    pLbl.scale.set(6600, 730, 1);
    pLbl.position.copy(polarPos(90)).add(new THREE.Vector3(0, 1800, 0));
    orbitGroup.add(pLbl);
  }

  // ---- L4 conjunction relay (com-l4-01): 1.52 AU does not fit a km stage,
  // so it sits at a declared scale break in the far corner toward
  // Earth-direction + 60 degrees, same not-to-scale treatment as the L2
  // station. Its coronagraph is the storm-season sun sentinel upstream of
  // the polar ring's 76-minute particle warning.
  {
    const earthD = latLon(0, 77.4, 1).normalize();
    const l4Dir = earthD.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3);
    const sat = buildComL4(THREE);
    sat.scale.setScalar(200);
    sat.position.copy(l4Dir.clone().multiplyScalar(55000));
    sat.lookAt(sat.position.clone().addScaledVector(earthD, -1000));  // HGA toward Earth
    orbitGroup.add(sat);
    registerMotion(sat, orbitAnims);
    sat.traverse((o) => { if (o.name?.startsWith('poi_')) relayPoiAnchors.push(o); });
    const dash = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        [l4Dir.clone().multiplyScalar(30000), l4Dir.clone().multiplyScalar(52000)]),
      new THREE.LineDashedMaterial({ color: 0x9adcc8, dashSize: 500, gapSize: 380,
        transparent: true, opacity: 0.5 }));
    dash.computeLineDistances();
    orbitGroup.add(dash);
    const lLbl = textSprite(T.orbLbl.l4, 34, '#a0e0cc');
    lLbl.scale.set(7200, 800, 1);
    lLbl.position.copy(l4Dir.clone().multiplyScalar(55000)).add(new THREE.Vector3(0, 2400, 0));
    orbitGroup.add(lLbl);
  }

  // ---- the two real moons. Distances and periods are true; the potatoes are
  // enlarged by the standing convention (hardware exaggerated, orbits not).
  // The orbit view sits in the Mars-fixed rotating frame (the areo sats hang
  // still), so each moon moves at its synodic rate: Phobos orbits faster than
  // Mars rotates and sweeps +32.4 deg/h - rising in the west, twice a sol;
  // Deimos nearly matches the rotation and creeps -2.7 deg/h, hanging in the
  // sky for two and a half sols. Driven from updateSun's ltst so the time
  // slider scrubs them.
  const potato = (rKm, scale, squash, seed) => {
    const geo = new THREE.IcosahedronGeometry(rKm * scale, 2);
    const p = geo.getAttribute('position');
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const bump = [];
    for (let i = 0; i < 8; i++) bump.push([rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1, 0.75 + rnd() * 0.5]);
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = v.clone().normalize();
      let m = 1;
      for (const [bx, by, bz, k] of bump)
        m += 0.09 * Math.sin(k * 7 * (n.x * bx + n.y * by + n.z * bz));
      p.setXYZ(i, v.x * m, v.y * m * squash, v.z * m);
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x8a7f74 }));
  };
  const moon = (rKm, sizeKm, scale, squash, seed, incDeg, labelKey, labelW) => {
    const pivot = new THREE.Group();
    pivot.rotation.z = incDeg * Math.PI / 180;
    orbitGroup.add(pivot);
    const body = potato(sizeKm, scale, squash, seed);
    body.position.x = rKm;
    pivot.add(body);
    const ring = [];
    for (let i = 0; i <= 128; i++) {
      const a = i / 128 * Math.PI * 2;
      ring.push(new THREE.Vector3(Math.cos(a) * rKm, 0, Math.sin(a) * rKm));
    }
    pivot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),
      new THREE.LineBasicMaterial({ color: 0xb0a090, transparent: true, opacity: 0.22 })));
    const lbl = textSprite(T.orbLbl[labelKey], 34, '#d8c8b4');
    lbl.scale.set(labelW, labelW / 8, 1);
    body.add(lbl);
    lbl.position.set(0, sizeKm * scale * 1.6 + 500, 0);
    return { pivot, body, rKm };
  };
  const phobos = moon(9376, 13, 9, 0.82, 11, 1.1, 'phobos', 5600);
  const deimos = moon(23463, 8, 14, 0.88, 23, 1.8, 'deimos', 5600);
  {                                            // forward post on Phobos: the
    const base = new THREE.Group();            // staging camp rides the moon
    const bm = new THREE.MeshLambertMaterial({ color: 0xc8ccd4 });
    const hab = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 30, 10), bm);
    const hab2 = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 24, 10), bm);
    hab2.position.set(38, -4, 8);
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(16, 10, 5, 0, Math.PI * 2, 0, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xf0f0f0, side: THREE.DoubleSide }));
    dish.position.set(-30, 16, -6);
    dish.rotation.x = -1.1;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(5, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0xffd890 }));
    glow.position.set(0, 22, 0);
    base.add(hab, hab2, dish, glow);
    base.position.set(0, 96, 0);               // perched on the potato's pole
    phobos.body.add(base);
    const bLbl = textSprite(T.orbLbl.phobosBase, 30, '#ffd8a0');
    bLbl.scale.set(2200, 275, 1);
    bLbl.position.set(0, 340, 0);
    phobos.body.add(bLbl);
  }
  // the space elevator that never got built: an areostationary tether from the
  // city's longitude - vetoed by Phobos itself, whose orbit sits below the
  // balance point and crosses the tether line every ~11 hours. Kept on the
  // map as a dashed ghost with a red X at the collision radius, in the same
  // honest tradition as every What-broke section on the site.
  {
    const foot = latLon(0, 77.4, ORBIT_R + 5);
    const top = latLon(0, 77.4, AREO);
    const ghost = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([foot, top]),
      new THREE.LineDashedMaterial({ color: 0xc87878, dashSize: 260,
        gapSize: 200, transparent: true, opacity: 0.4 }));
    ghost.computeLineDistances();
    orbitGroup.add(ghost);
    const cross = textSprite('✕', 64, '#ff5040');
    cross.scale.set(900, 900, 1);
    cross.position.copy(latLon(0, 77.4, 9376));
    orbitGroup.add(cross);
    const eLbl = textSprite(T.orbLbl.elevator, 32, '#e8a0a0');
    eLbl.scale.set(6200, 775, 1);
    eLbl.position.copy(latLon(0, 77.4, 13400)).add(new THREE.Vector3(0, -1500, 0));
    orbitGroup.add(eLbl);
  }
  moonTick = (ltst) => {                       // called from updateSun
    const ph = (77.4 + 140 + 32.36 * ltst) * Math.PI / 180;
    phobos.body.position.set(Math.cos(ph) * phobos.rKm, 0, -Math.sin(ph) * phobos.rKm);
    phobos.body.rotation.y = ph;               // tidally locked
    const dm = (77.4 + 55 - 2.72 * ltst) * Math.PI / 180;
    deimos.body.position.set(Math.cos(dm) * deimos.rKm, 0, -Math.sin(dm) * deimos.rKm);
    deimos.body.rotation.y = dm;
    if (polarPosFn) for (let k = 0; k < polarSats.length; k++) {
      // one lap per sidereal sol in the fixed meridian plane
      polarSats[k].position.copy(polarPosFn(120 * k + 360 * ltst / 24.62));
      polarSats[k].lookAt(0, 0, 0);
      polarSats[k].rotateY(Math.PI);
    }
  };
  moonTick(12);

  // ---- the export convoy: what 99.6% of the reactor is for. Three ships on
  // an outbound spiral from low orbit toward Earth, plus the dashed arc.
  {
    const earthDir = latLon(0, 77.4, 1).normalize();
    const upDir = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(upDir, earthDir).normalize();
    const arc = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const r = 3789 + t * t * 26000;          // LMO 400 km out to escape
      const a = t * 2.4;                       // two-thirds of a wind-up turn
      arc.push(earthDir.clone().multiplyScalar(Math.cos(a) * -1 * r)
        .addScaledVector(side, Math.sin(a) * r)
        .addScaledVector(upDir, t * 2200));
    }
    arc.reverse();                             // ends pointing at Earth
    const arcLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arc),
      new THREE.LineDashedMaterial({ color: 0xd8b478, dashSize: 420,
        gapSize: 300, transparent: true, opacity: 0.55 }));
    arcLine.computeLineDistances();
    orbitGroup.add(arcLine);
    const shipMat = new THREE.MeshLambertMaterial({ color: 0xd8dde4 });
    for (const t of [0.35, 0.55, 0.78]) {
      const p = arc[Math.round(t * 60)];
      const dir = arc[Math.min(60, Math.round(t * 60) + 1)].clone().sub(p).normalize();
      const ship = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(90, 90, 520, 10), shipMat);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(90, 190, 10), shipMat);
      nose.position.y = 355;
      ship.add(hull, nose);
      ship.position.copy(p);
      ship.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      orbitGroup.add(ship);
    }
    const cvLbl = textSprite(T.orbLbl.convoy, 36, '#e8cc9a');
    cvLbl.scale.set(6200, 700, 1);
    cvLbl.position.copy(arc[Math.round(0.55 * 60)]).add(new THREE.Vector3(0, 1600, 0));
    orbitGroup.add(cvLbl);

    // the return traffic: one import ship on an aerocapture pass - approach
    // from Earthward space, a bright skim through the upper atmosphere at
    // periapsis, and a captured ellipse out the other side. Mirrored off the
    // export spiral's plane so the two flows read as separate lanes.
    const inb = [];
    for (let i = 0; i <= 70; i++) {
      const t = i / 70;
      const r = 3489 + Math.pow(Math.abs(t - 0.55) / 0.55, 1.7) * 30000;
      const a = -0.5 - t * 2.6;                // sweeps past the planet's far side
      inb.push(earthDir.clone().multiplyScalar(Math.cos(a) * r)
        .addScaledVector(side, Math.sin(a) * -r)
        .addScaledVector(upDir, (0.5 - t) * 1600));
    }
    orbitGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(inb),
      new THREE.LineBasicMaterial({ color: 0x9ab8d8, transparent: true, opacity: 0.45 })));
    // plasma skim: the few points nearest periapsis, drawn hot
    const peri = inb.slice(34, 44);
    orbitGroup.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(peri),
      new THREE.LineBasicMaterial({ color: 0xffa050, transparent: true, opacity: 0.95 })));
    const inbShip = new THREE.Group();
    const ih = new THREE.Mesh(new THREE.CylinderGeometry(90, 90, 520, 10), shipMat);
    const inose = new THREE.Mesh(new THREE.ConeGeometry(90, 190, 10), shipMat);
    inose.position.y = 355;
    inbShip.add(ih, inose);
    inbShip.position.copy(inb[24]);
    inbShip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0),
      inb[25].clone().sub(inb[24]).normalize());
    orbitGroup.add(inbShip);
    const inLbl = textSprite(T.orbLbl.inbound, 34, '#b8d0e8');
    inLbl.scale.set(5800, 725, 1);
    inLbl.position.copy(inb[20]).add(new THREE.Vector3(0, -1700, 0));
    orbitGroup.add(inLbl);
  }

  const sat0 = latLon(0, 77.4, AREO);
  const beamMat = new THREE.LineBasicMaterial(
    { color: 0x9fdcff, transparent: true, opacity: 0.35 });
  orbitGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([jezero, sat0]), beamMat));
  orbitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
    [sat0, sat0.clone().normalize().multiplyScalar(48000)]), beamMat));
  const earthLbl = textSprite(T.orbLbl.earth, 48);
  earthLbl.scale.set(2600, 325, 1);
  earthLbl.position.copy(sat0.clone().normalize().multiplyScalar(27000));
  orbitGroup.add(earthLbl);
  // optical uplink: the lasercom terminal's thin thread from the city straight
  // past the relay ring toward Earth - the RF beam's quiet, faster sibling
  orbitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
    [jezero, jezero.clone().normalize().multiplyScalar(46000)]),
    new THREE.LineBasicMaterial({ color: 0xb0ffd8, transparent: true, opacity: 0.28 })));
  const optLbl = textSprite(T.orbLbl.optical, 32, '#b0e8c8');
  optLbl.scale.set(4400, 550, 1);
  optLbl.position.copy(jezero.clone().normalize().multiplyScalar(9500))
    .add(new THREE.Vector3(0, -1400, 0));
  orbitGroup.add(optLbl);
  const satLbl = textSprite(T.orbLbl.relay, 44);
  satLbl.scale.set(7400, 775, 1);
  satLbl.position.copy(sat0).add(new THREE.Vector3(0, 1500, 0));
  orbitGroup.add(satLbl);
  relayAnchor = sat0.clone();                // for the orbit-view knowledge card
}

// relay knowledge card (orbit view, CMB-card pattern): built from the unit's
// info.json — the asset is orbital, so its POI cards aren't reachable through
// the surface proximity system; this surfaces the key numbers when the camera
// pans to the constellation.
fetch('units/com-relay-01.info.json').then((r) => r.json()).then((info) => {
  const poi = (id) => info.pois.find((p) => p.id === id) || {};
  const specsOf = (p) => (LANG === 'en' && p.specs_en) || p.specs || {};
  const bus = poi('bus');
  const EN = LANG === 'en';
  const rows = [
    [EN ? 'Mars-face antenna' : '对火天线', specsOf(poi('ka'))[EN ? 'Gain' : '增益']],
    [EN ? 'Half-power beam' : '半功率波束', specsOf(poi('ka'))[EN ? 'Half-power beamwidth' : '半功率波束']],
    [EN ? 'Earth return' : '对地回传', specsOf(poi('dte'))[EN ? 'Return rate' : '回传速率']],
    [EN ? 'Power' : '电源', specsOf(poi('solar'))[EN ? 'BOL power' : 'BOL 功率']],
    [EN ? 'Radiators' : '辐射面', specsOf(poi('thermal'))[EN ? 'Operating temperature (COMSOL)' : '工作温度(COMSOL)']],
    [EN ? 'Wing first mode' : '太阳翼模态', specsOf(poi('adcs'))[EN ? 'Wing first mode (COMSOL)' : '太阳翼一阶模态(COMSOL)']],
  ].filter(([, v]) => v);
  relayCardHTML =
    `<h3>${pick(comRelayMeta, 'name')}</h3><div class="u">com-relay-01 · ${EN ? '3 primary + 1 spare' : '3 主 + 1 备份'}</div>` +
    `<p>${pick(bus, 'detail') || ''}</p>` +
    '<table>' + rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') +
    '</table>' +
    `<p class="phys">🔭 ${EN ? 'Keep zooming in for per-device knowledge cards' : '继续拉近可逐个查看子设备知识卡'}</p>`;
  // full per-POI cards (same layout as surface proximity cards)
  const lines = (icon, val, cls) => (Array.isArray(val) ? val : [val])
    .map((s) => `<p class="${cls}">${icon} ${s}</p>`).join('');
  for (const p of info.pois) {
    let h = `<h3>${pick(p, 'label')}</h3><div class="u">${pick(comRelayMeta, 'name')}</div>`;
    const d = pick(p, 'detail'), sp = specsOf(p);
    if (d) h += `<p>${d}</p>`;
    if (p.specs) h += '<table>' + Object.entries(sp).map(
      ([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') + '</table>';
    if (p.physics) h += lines('🔬', pick(p, 'physics'), 'phys');
    if (p.sim) h += lines('📐', pick(p, 'sim'), 'sim');
    relayPoiCards[p.id] = h;
  }
}).catch(() => {});
// MiniPAN payload cards (sci-pan-01 v2): same per-POI layout, keyed pan_* so the
// inspect tier resolves them through the shared relayPoiAnchors nearest-match
fetch('units/sci-pan-01.info.json').then((r) => r.json()).then((info) => {
  const lines = (icon, val, cls) => (Array.isArray(val) ? val : [val])
    .map((s) => `<p class="${cls}">${icon} ${s}</p>`).join('');
  for (const p of info.pois) {
    let h = `<h3>${pick(p, 'label')}</h3><div class="u">${pick(panMeta, 'name')} · sci-pan-01</div>`;
    const d = pick(p, 'detail'), sp = (LANG === 'en' && p.specs_en) || p.specs;
    if (d) h += `<p>${d}</p>`;
    if (sp) h += '<table>' + Object.entries(sp).map(
      ([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') + '</table>';
    if (p.physics) h += lines('🔬', pick(p, 'physics'), 'phys');
    if (p.sim) h += lines('📐', pick(p, 'sim'), 'sim');
    relayPoiCards[p.id] = h;
  }
}).catch(() => {});
// polar ring + L4 relay cards (com-gap delivery): same per-POI pipeline
for (const [file, m] of [['units/com-polar-01.info.json', comPolarMeta],
                         ['units/com-l4-01.info.json', comL4Meta]]) {
  fetch(file).then((r) => r.json()).then((info) => {
    const lines = (icon, val, cls) => (Array.isArray(val) ? val : [val])
      .map((s) => `<p class="${cls}">${icon} ${s}</p>`).join('');
    for (const p of info.pois) {
      let h = `<h3>${pick(p, 'label')}</h3><div class="u">${pick(m, 'name')} · ${info.id}</div>`;
      const d = pick(p, 'detail'), sp = (LANG === 'en' && p.specs_en) || p.specs;
      if (d) h += `<p>${d}</p>`;
      if (sp) h += '<table>' + Object.entries(sp).map(
        ([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') + '</table>';
      if (p.physics) h += lines('🔬', pick(p, 'physics'), 'phys');
      if (p.sim) h += lines('📐', pick(p, 'sim'), 'sim');
      relayPoiCards[p.id] = h;
    }
  }).catch(() => {});
}
const loSpin = new THREE.Group();            // low orbiter, animated
{
  const loTilt = new THREE.Group();
  loTilt.rotation.x = 0.65;
  orbitGroup.add(loTilt);
  loTilt.add(loSpin);
  const LO_R = ORBIT_R + 400;
  const lo = buildSat(1.9);                  // low orbiter, matched to the relays
  lo.position.set(LO_R, 0, 0);
  loSpin.add(lo);
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = i / 128 * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * LO_R, 0, Math.sin(a) * LO_R));
  }
  loTilt.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xffcf9f, transparent: true, opacity: 0.25 })));
  const loLbl = textSprite(T.orbLbl.lowOrbiter, 40);
  loLbl.scale.set(4200, 525, 1);
  loLbl.position.set(LO_R, 900, 0);
  loSpin.add(loLbl);
}

// CMB survey observatory at Sun-Mars L2 (schematic distance, real: 1.08M km)
const cmbSpin = new THREE.Group();
let cmbAnchor = null;
const cmbCardHTML =
  '<h3>CMB 偏振巡天站</h3><div class="u">日-火 L2 晕轨道 · 距火星 108 万 km</div>' +
  '<p>TES 阵列宇宙微波背景 B 模偏振巡天。选址 L2 而非火星轨道：需单侧遮阳、' +
  '热稳定、避开行星微波前景——三者在近火轨道都不成立。</p>' +
  '<table>' +
  '<tr><td>科学目标</td><td>σ(r) &lt; 1×10⁻³（全天 B 模）</td></tr>' +
  '<tr><td>载荷</td><td>3 望远镜 · 15 频段 40–402 GHz</td></tr>' +
  '<tr><td>探测器</td><td>4068 TES · Tc 171 mK · μMUX 读出</td></tr>' +
  '<tr><td>制冷链</td><td>V-groove→Stirling→JT→ADR/稀释 100 mK（无液氦）</td></tr>' +
  '<tr><td>调制</td><td>连续旋转 HWP（LFT 20K / MFT·HFT 4.8K）</td></tr>' +
  '<tr><td>扫描</td><td>α45°/β50° 双角，一年全天 100% 覆盖</td></tr>' +
  '<tr><td>数据链</td><td>5 Mbps · Ka 波段每日下行（经静止中继）</td></tr>' +
  '</table>' +
  '<p class="sim">📐 σ(r) 总预算 ~8×10⁻⁴ 闭环；真实天空(PySM)交叉验证 ' +
  'Δr=7.7×10⁻⁴ @ fsky 0.66 ✅（前景 T_d 空间变化四级管线）</p>';
{
  const antiSun = new THREE.Vector3(-0.5, -0.35, 0.8).normalize();
  const anchor = new THREE.Group();
  anchor.position.copy(antiSun).multiplyScalar(42000);
  anchor.lookAt(0, 0, 0);                    // local +Z looks back at Mars/Sun
  orbitGroup.add(anchor);

  const dash = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      [new THREE.Vector3(0, 0, 0), anchor.position]),
    new THREE.LineDashedMaterial({ color: 0xffd9a0, dashSize: 900,
      gapSize: 600, transparent: true, opacity: 0.4 }));
  dash.computeLineDistances();
  orbitGroup.add(dash);

  const HALO_R = 3200;                       // halo orbit around the L2 point
  const pts = [];
  for (let i = 0; i <= 64; i++) {
    const a = i / 64 * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * HALO_R, Math.sin(a) * HALO_R, 0));
  }
  anchor.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial(
      { color: 0x9fdcff, transparent: true, opacity: 0.3 })));

  anchor.add(cmbSpin);
  // LiteBIRD-style observatory, real-scale metres (~4.7 m tall) x320 for
  // orbit-view visibility — same pattern as the relay (real model, scaled).
  function buildCmbObs() {
    const g = new THREE.Group();
    const M = {
      mli:  new THREE.MeshLambertMaterial({ color: 0xc9a050 }),
      vg:   new THREE.MeshLambertMaterial({ color: 0xdde2ea,
              emissive: 0x23262c, side: THREE.DoubleSide }),
      tube: new THREE.MeshLambertMaterial({ color: 0xe8ecf2 }),
      dark: new THREE.MeshLambertMaterial({ color: 0x14161a,
              side: THREE.DoubleSide }),
      grey: new THREE.MeshLambertMaterial({ color: 0x8a90a0 }),
      cell: new THREE.MeshLambertMaterial({ color: 0x2c4a8a,
              side: THREE.DoubleSide }),
      hwp:  new THREE.MeshLambertMaterial({ color: 0x9db8e8,
              emissive: 0x2b3c5e }),
    };
    // solar skirt (sun-facing ring) + spokes
    const skirt = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.7, 0.07, 48), M.cell);
    skirt.position.y = -0.05; g.add(skirt);
    for (let i = 0; i < 12; i++) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.02, 0.05),
        M.grey);
      const a = i * Math.PI / 6;
      sp.position.set(Math.cos(a) * 1.3, -0.005, -Math.sin(a) * 1.3);
      sp.rotation.y = a; g.add(sp);
    }
    // gold MLI bus (octagon)
    const bus = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.25, 1.0, 8), M.mli);
    bus.position.y = 0.5; g.add(bus);
    // V-groove x3: flared aluminium shields (dominant silhouette)
    [[1.05, 2.30, 0.40], [1.38, 2.05, 0.34], [1.68, 1.80, 0.28]]
      .forEach(([y, r, h]) => {
        const c = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r * 0.55, h, 48, 1, true), M.vg);
        c.position.y = y; g.add(c);
      });
    // 2K shield tub (telescopes half-sunk)
    const tub = new THREE.Mesh(
      new THREE.CylinderGeometry(1.42, 1.15, 0.9, 48, 1, true), M.vg);
    tub.position.y = 2.35; g.add(tub);
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.16, 1.16, 0.06, 48), M.grey);
    floor.position.y = 1.95; g.add(floor);
    // tilted optical bench with three telescopes
    const bench = new THREE.Group();
    bench.position.y = 2.15; bench.rotation.z = 0.38; g.add(bench);
    function scope(r, len, x, z, boxy) {
      const t = new THREE.Group();
      const hoodLen = r * 1.5;
      if (boxy) {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(r * 2.2, len, r * 1.9), M.tube);
        body.position.y = len / 2; t.add(body);
        const mk = (rt, rb, mat, dl) => {
          const m = new THREE.Mesh(new THREE.CylinderGeometry(
            rt, rb, hoodLen - dl, 4, 1, true), mat);
          m.rotation.y = Math.PI / 4; m.position.y = len + hoodLen / 2;
          return m;
        };
        t.add(mk(r * 1.62, r * 1.28, M.vg.clone(), 0));
        t.add(mk(r * 1.58, r * 1.24, M.dark, 0.02));
        const hb = new THREE.Mesh(
          new THREE.BoxGeometry(r * 1.5, 0.05, r * 1.4), M.hwp);
        hb.position.y = len + 0.06; t.add(hb);
      } else {
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 1.12, r * 1.18, len, 32), M.tube);
        body.position.y = len / 2; t.add(body);
        const hood = new THREE.Mesh(new THREE.CylinderGeometry(
          r * 1.32, r * 1.12, hoodLen, 32, 1, true), M.tube.clone());
        hood.material.side = THREE.DoubleSide;
        hood.position.y = len + hoodLen / 2; t.add(hood);
        const inner = new THREE.Mesh(new THREE.CylinderGeometry(
          r * 1.29, r * 1.09, hoodLen - 0.02, 32, 1, true), M.dark);
        inner.position.y = len + hoodLen / 2 - 0.01; t.add(inner);
        const hwp = new THREE.Mesh(
          new THREE.CylinderGeometry(r, r, 0.05, 32), M.hwp);
        hwp.position.y = len + 0.06; t.add(hwp);
      }
      t.position.set(x, 0, z);
      return t;
    }
    bench.add(scope(0.46, 1.05, -0.58, 0, true));    // LFT 40 cm box
    bench.add(scope(0.35, 0.92, 0.42, -0.52));       // MFT 30 cm
    bench.add(scope(0.25, 0.80, 0.52, 0.58));        // HFT 20 cm
    // Ka dish toward Mars (+local -Y after mounting -> keep on bus side)
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2.4),
      M.vg.clone());
    dish.rotation.x = Math.PI; dish.position.set(1.05, -0.18, 0.4);
    g.add(dish);
    return g;
  }
  const obs = buildCmbObs();
  obs.scale.setScalar(320);
  obs.rotation.x = -Math.PI / 2;   // stack axis -> Z, solar skirt sunward (+Z)
  obs.position.x = HALO_R;
  cmbSpin.add(obs);

  // data relay: L2 -> areostationary constellation
  orbitGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      [anchor.position, latLon(0, 77.4, AREO)]),
    new THREE.LineBasicMaterial(
      { color: 0x9fdcff, transparent: true, opacity: 0.22 })));

  const lbl = textSprite(T.orbLbl.cmb, 44);
  lbl.scale.set(5600, 700, 1);
  lbl.position.copy(anchor.position).add(new THREE.Vector3(0, 2800, 0));
  orbitGroup.add(lbl);
  const lbl2 = textSprite(T.orbLbl.cmbDist, 36, '#c8b49a');
  lbl2.scale.set(4200, 525, 1);
  lbl2.position.copy(anchor.position).add(new THREE.Vector3(0, 1600, 0));
  orbitGroup.add(lbl2);

  cmbAnchor = anchor.position.clone();       // for the orbit-view knowledge card
}

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enabled = false;
orbitControls.enableDamping = true;
orbitControls.minDistance = ORBIT_R * 1.1;
orbitControls.maxDistance = ORBIT_R * 15;

let orbitMode = false;
const saved = { pos: new THREE.Vector3(), yaw: 0, pitch: 0 };

function setOrbitMode(on) {
  if (renderer.xr.isPresenting || inInterior) return;
  if (on && typeof exitInspect === 'function') exitInspect();
  orbitMode = on;
  surfaceGroup.visible = !on;
  orbitGroup.visible = on;
  orbitControls.enabled = on;
  scene.fog = on ? null : dustFog;
  poiCardEl.style.display = 'none';          // drop any stale card on mode switch
  poiCardEl.dataset.id = '';
  if (on) {  // orbit view keeps its own fixed lighting
    sun.intensity = 2.4;
    hemi.intensity = 0.9;
    sun.position.set(0.5, 0.35, -0.8).multiplyScalar(1000);
  }
  if (document.pointerLockElement) document.exitPointerLock();
  if (on) {
    saved.pos.copy(rig.position);
    saved.yaw = yaw; saved.pitch = pitch;
    rig.position.set(0, 0, 0);
    rig.rotation.y = 0;
    camera.rotation.set(0, 0, 0);
    camera.near = 5; camera.far = 600000;
    camera.position.copy(latLon(
      +(q.get('lat') ?? 18.4), +(q.get('lon') ?? 77.4), ORBIT_R * 7.4));
    orbitControls.target.set(0, 0, 0);
    orbitControls.minDistance = ORBIT_R * 1.1;   // inspect mode may have changed
    orbitControls.maxDistance = ORBIT_R * 15;    // these — restore planet scale
  } else {
    rig.position.copy(saved.pos);
    yaw = saved.yaw; pitch = saved.pitch;
    camera.near = 0.1; camera.far = 30000;
    camera.position.set(0, 1.7, 0);
    // OrbitControls wrote all three camera Euler axes (often the z=PI inverted
    // branch); the walk loop only re-stamps x, so clear y/z or the world stays
    // upside-down after returning (exitInspect already does this)
    camera.rotation.set(0, 0, 0);
  }
  camera.updateProjectionMatrix();
  document.getElementById('orbitBtn').textContent = on ? '↓ 返回地表' : '↑ 轨道视角';
}

document.getElementById('orbitBtn').addEventListener('click',
  () => setOrbitMode(!orbitMode));

// ---------------------------------------------------------------- controls

let yaw = 0, pitch = 0, flying = false;
const keys = new Set();
const canvas = renderer.domElement;

canvas.addEventListener('click', () => {
  if (!orbitMode && !inspectUnit) canvas.requestPointerLock();
});
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= e.movementX * 0.002;
  pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.002, -1.5, 1.5);
});
addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'KeyF' && !inInterior) flying = !flying;
  if (e.code === 'KeyN') nameTagsOn = !nameTagsOn;   // declutter the horizon
  if (e.code === 'Space' && flying) e.preventDefault();
  if (inInterior) return;                     // indoors: only Esc/WASD (handled elsewhere)
  if (e.code === 'KeyM') setOrbitMode(!orbitMode);
  if (e.code === 'KeyC') toggleColony();
  if (e.code === 'KeyX') toggleMagic();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// start on the delta front looking across the crater floor;
// override with ?x=&z=&y=&yaw=&pitch=&fly=1 (meters / radians)
rig.position.set(+(q.get('x') ?? -SIZE * 0.15), 0, +(q.get('z') ?? -SIZE * 0.1));
yaw = +(q.get('yaw') ?? Math.PI * 0.75);
pitch = +(q.get('pitch') ?? 0);
flying = q.get('fly') === '1';
rig.position.y = q.has('y') ? +q.get('y')
  : sampleHeight(rig.position.x, rig.position.z);

const vel = new THREE.Vector3();
let snapCooldown = 0;

let _px0 = 0, _pz0 = 0;
function moveDesktop(dt) {
  _px0 = rig.position.x; _pz0 = rig.position.z;
  rig.rotation.y = yaw;
  camera.rotation.x = pitch;
  const speed = (keys.has('ShiftLeft') ? 40 : 8) * (flying ? 4 : 1);
  const f = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
  const s = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  // flying: Space/Q hold altitude independently of where you look, so an aerial
  // framing survives moving around. Holding either one also stops pitch from
  // bleeding into forward motion, which is what made a level flight impossible.
  const up = flying ? ((keys.has('Space') ? 1 : 0) - (keys.has('KeyQ') ? 1 : 0)) : 0;
  if (f || s) {
    const fwd = (flying && !up)
      ? new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch),
                          -Math.cos(yaw) * Math.cos(pitch))
      : new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    vel.copy(fwd).multiplyScalar(f).addScaledVector(right, s).normalize();
    rig.position.addScaledVector(vel, speed * dt);
  }
  if (up) rig.position.y += up * speed * dt;
  if (!flying) {
    if (!inInterior && colTris) collideWalk(dt, _px0, _pz0);
    else rig.position.y = sampleHeight(rig.position.x, rig.position.z);
  }
}

function moveVR(dt) {
  const session = renderer.xr.getSession();
  if (!session) return;
  snapCooldown = Math.max(0, snapCooldown - dt);
  for (const src of session.inputSources) {
    const ax = src.gamepad?.axes;
    if (!ax || ax.length < 4) continue;
    if (src.handedness === 'left') {
      // move where the headset looks
      const head = new THREE.Vector3();
      camera.getWorldDirection(head);
      const fwd = new THREE.Vector3(head.x, 0, head.z).normalize();
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      rig.position.addScaledVector(fwd, -ax[3] * 6 * dt);
      rig.position.addScaledVector(right, ax[2] * 6 * dt);
      rig.position.y = sampleHeight(rig.position.x, rig.position.z);
    } else if (src.handedness === 'right' && snapCooldown === 0 && Math.abs(ax[2]) > 0.7) {
      rig.rotation.y -= Math.sign(ax[2]) * Math.PI / 6;
      snapCooldown = 0.35;
    }
  }
}

// ---------------------------------------------------------------- manifest assets
// Load code-asset units (MODELS.md §4): dynamic import -> build(THREE) -> a
// real-metric Group. Scale to size_m, sit on terrain, sink, orient, and wire
// its nightMats/lights into the day-night ramp above. Unplaced (pos:null)
// assets fall back to a hand-picked power zone east of spawn.
const PWR_ZONE = {
  'pwr-fusion-01': { x: 300, z: 140 },
  'pwr-radiator-01': { x: 300, z: 360 },
};
// blink_* hook (MODELS.md §5): red warning beacons on code assets pulse ~0.8 s
const assetBlinks = [];                       // meshes named blink_*
const assetBlinkMats = [];                    // materials from userData.blinkMats
const BLINK_DIM = new THREE.Color(0x7a1512);
const BLINK_LIT = new THREE.Color(0xff3020);

// floating sub-device tags: canvas sprite per labeled group (ISRU convention:
// userData.{label, level}); constant screen size, distance-culled in the loop
const assetLabels = [];
const unitNameTags = [];                      // one name sprite per facility
let nameTagsOn = true;                        // N key: hide every facility tag
const _tagV = new THREE.Vector3();            // scratch for screen-space declutter
const _camW = new THREE.Vector3();
function makeDeviceTag(text, big = false) {
  const fs = 42, padX = 20, padY = 12;
  const c = document.createElement('canvas');
  let ctx = c.getContext('2d');
  ctx.font = `${fs}px "Microsoft YaHei", sans-serif`;
  c.width = Math.ceil(ctx.measureText(text).width) + padX * 2;
  c.height = fs + padY * 2;
  ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(12,16,20,0.66)';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#ffd9a0';
  ctx.fillRect(0, c.height - 4, c.width, 4);
  ctx.font = `${fs}px "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = '#f3e9d8';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2 - 1);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, sizeAttenuation: false, depthTest: false }));
  const k = big ? 0.026 : 0.032;                // name tags a touch smaller/denser
  spr.scale.set(k * c.width / c.height, k, 1);
  spr.renderOrder = big ? 9 : 10;
  spr.raycast = () => {};                       // labels never take raycasts
  return spr;
}
function hangDeviceTags(group, range, owner) {
  group.updateMatrixWorld(true);
  const bb = new THREE.Box3();
  group.traverse((o) => {
    if (!o.isGroup || !o.userData?.label) return;
    bb.setFromObject(o);
    if (bb.isEmpty()) return;
    const spr = makeDeviceTag(pick(o.userData, 'label'));
    spr.position.set((bb.min.x + bb.max.x) / 2, bb.max.y + 2.5,
                     (bb.min.z + bb.max.z) / 2);
    spr.userData.range = range;
    spr.userData.owner = owner;                 // tags belong to their unit only
    colonyGroup.add(spr);
    assetLabels.push(spr);
  });
}

// Snapshot of where the reader currently is, as URL params. Used by the
// language switch, which has to reload the page to re-localize everything.
function captureViewState() {
  const s = { colony: colonyGroup.visible ? '1' : null,
              magic: magicGroup.visible ? '1' : null,
              imperial: imperialGroup.visible ? '1' : null,
              interior: null, view: null, inspect: null,
              x: null, z: null, y: null, yaw: null, pitch: null, fly: null };
  if (inInterior) { s.interior = inInterior.id; return s; }
  if (orbitMode) {
    s.view = 'orbit';
    // orbit uses OrbitControls, so hand back the camera's own lat/lon/range
    const p = camera.position;
    s.lat = (Math.asin(THREE.MathUtils.clamp(p.y / p.length(), -1, 1)) * 180 / Math.PI).toFixed(2);
    s.lon = (Math.atan2(p.x, p.z) * 180 / Math.PI).toFixed(2);
    return s;
  }
  // While inspecting, the rig is parked at the origin and the camera belongs to
  // OrbitControls - so read the walk-position that enterInspect stashed away,
  // otherwise switching language mid-inspect strands you at (0,0) on exit.
  const p = inspectUnit ? inspectSaved.pos : rig.position;
  if (inspectUnit) s.inspect = inspectUnit.id;
  s.x = p.x.toFixed(1);
  s.z = p.z.toFixed(1);
  s.yaw = (inspectUnit ? inspectSaved.yaw : yaw).toFixed(3);
  s.pitch = (inspectUnit ? inspectSaved.pitch : pitch).toFixed(3);
  if (flying) { s.fly = '1'; s.y = p.y.toFixed(1); }
  return s;
}

// ---------------------------------------------------------------- loop

const posEl = document.getElementById('pos');
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  playerPos[0] = rig.position.x; playerPos[1] = rig.position.y;
  playerPos[2] = rig.position.z;
  if (orbitMode) {
    orbitControls.update();
    loSpin.rotation.y -= dt * (Math.PI * 2 / 45);   // ~2h orbit, sped up
    cmbSpin.rotation.z += dt * (Math.PI * 2 / 90);  // L2 halo, sped up
    for (const f of orbitAnims) f(clock.elapsedTime, dt, lastNight);
    updateSun();
    if (cmbAnchor) {                          // show CMB card when panned toward L2
      const near = camera.position.distanceTo(cmbAnchor) < 26000;
      if (near && poiCardEl.dataset.id !== 'cmb') {
        poiCardEl.dataset.id = 'cmb';
        poiCardEl.innerHTML = cmbCardHTML;
        poiCardEl.style.display = 'block';
      } else if (!near && poiCardEl.dataset.id === 'cmb') {
        poiCardEl.style.display = 'none';
        poiCardEl.dataset.id = '';
      }
    }
    updateRelayCards();
    posEl.textContent = T.posOrbit((camera.position.length() - ORBIT_R).toFixed(0));
  } else if (inInterior) {                    // underground/indoor scene
    moveDesktop(dt);                          // walk; y is pinned in updateInterior
    updateInterior(dt);
    if (inInterior) {                         // may have exited during update
      if (!renderer.xr.isPresenting) driveSensors(clock.elapsedTime);
      for (const f of inInterior.anims || []) f(clock.elapsedTime, dt, 1);
      updateInteriorPois();
      posEl.textContent = T.posInterior(pick(inInterior.meta, 'name'));
    }
  } else {
    updateSun();
    if (magicGroup.visible) {
      const t = clock.elapsedTime;
      for (const f of magicAnims) f(t, dt);
  if (imperialGroup.visible) for (const f of imperialAnims) f(t, dt);
    }
    if (colonyGroup.visible) {
      if (!renderer.xr.isPresenting) driveSensors(clock.elapsedTime);
      for (const f of unitAnims) f(clock.elapsedTime, dt, lastNight);
      for (const m of mixers) m.update(dt);
    }
    updatePois();
    updatePortals();
    if (inspectUnit) orbitControls.update();
    else if (renderer.xr.isPresenting) moveVR(dt);
    else moveDesktop(dt);
    posEl.textContent = T.posSurface(rig.position.x.toFixed(0),
      rig.position.z.toFixed(0), (meta.elev_min_m + rig.position.y).toFixed(1), flying);
  }
  renderer.render(scene, camera);
});

if (q.get('interior')) enterInterior(q.get('interior'), null).then(() => {
  // interior deep-link camera override (capture/tests) — mirrors the surface
  // ?x=&z=&yaw=&pitch= params; &eye= lifts the camera above the pinned floor
  if (q.has('x')) rig.position.x = +q.get('x');
  if (q.has('z')) rig.position.z = +q.get('z');
  if (q.has('yaw')) yaw = +q.get('yaw');
  if (q.has('pitch')) pitch = +q.get('pitch');
  if (q.has('eye')) camera.position.y = +q.get('eye');
});

// relay cards, two proximity tiers (named so ?debug=1 can pump it headless —
// hidden tabs suspend rAF and the whole loop with it)
function updateRelayCards() {
  if (!relayAnchor || !relayCardHTML) return;
  const dRel = camera.position.distanceTo(relayAnchor);
  let id = null, html = null;
  if (dRel < 2500 && relayPoiAnchors.length) {
    // inspect tier: nearest sub-device card follows the camera
    let best = null, bd = Infinity;
    for (const a of relayPoiAnchors) {
      const d = camera.position.distanceTo(
        a.getWorldPosition(_relayTmp));
      if (d < bd) { bd = d; best = a; }
    }
    const pid = best.name.slice(4);
    if (relayPoiCards[pid]) { id = 'relay:' + pid; html = relayPoiCards[pid]; }
  } else if (dRel < 8000) {
    id = 'relay'; html = relayCardHTML;       // summary tier
  }
  if (id && poiCardEl.dataset.id !== id) {
    poiCardEl.dataset.id = id;
    poiCardEl.innerHTML = html;
    poiCardEl.style.display = 'block';
  } else if (!id && poiCardEl.dataset.id.startsWith('relay')) {
    poiCardEl.style.display = 'none';
    poiCardEl.dataset.id = '';
  }
}

// ?debug=1 暴露内窥句柄（真浏览器验证用，STATUS「已知事项」约定）
if (q.has('debug')) {
  window.__mars = { units, unitSensors, unitAnims, orbitAnims, colonyGroup, scene,
    renderer, camera, rig, driveSensors, clock, sampleHeight, updateRelayCards,
    updateSun, orbitControls, get inInterior() { return inInterior; } };
  // turntable helper for headless capture: park the flying rig on a circle
  // around (cx,cz) at angDeg, aim at the centre, and render synchronously so
  // the very next CDP screenshot sees this exact frame (headless background
  // pages throttle rAF to ~1 Hz, so captures cannot wait for the loop).
  window.__shot = (cx, cz, r, alt, angDeg) => {
    const a = angDeg * Math.PI / 180;
    const px = cx + Math.sin(a) * r, pz = cz + Math.cos(a) * r;
    flying = true;
    rig.position.set(px, sampleHeight(cx, cz) + alt, pz);
    const fx = cx - px, fz = cz - pz;
    yaw = Math.atan2(-fx, -fz);
    pitch = -Math.atan2(alt * 0.8, Math.hypot(fx, fz));
    rig.rotation.y = yaw;
    camera.rotation.x = pitch;
    renderer.render(scene, camera);
    return 1;
  };
}
if (q.get('view') === 'orbit') setOrbitMode(true);
if (q.get('view') === 'cmb' && cmbAnchor) {  // jump to the L2 station
  setOrbitMode(true);
  camera.position.copy(cmbAnchor).add(new THREE.Vector3(6000, 3500, 6000));
  orbitControls.target.copy(cmbAnchor);
  orbitControls.maxDistance = 80000;
  orbitControls.update();
}

loadingEl.remove();
