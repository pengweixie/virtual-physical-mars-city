import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { build as buildComRelay, meta as comRelayMeta }
  from './units/com-relay-01.js';
import { build as buildPan } from './units/sci-pan-01.js';

// ---------------------------------------------------------------- data

const loadingEl = document.getElementById('loading');
const status = (msg) => { if (loadingEl) loadingEl.textContent = msg; };
const q = new URLSearchParams(location.search);

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
document.body.appendChild(VRButton.createButton(renderer));

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
  return s;
}

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
      ? `毅力号 · Sol ${mission.rover.sol}`
      : `毅力号 Sol ${roverAt.sol} 曾经过此处 · 现距此 ${mission.rover.dist_km} km`;
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
    `毅力号任务日 Sol ${mission.rover.sol} · 数据更新 ${mission.updated_utc} UTC` +
    ` · 最新照片 ${mission.photos.length} 张`;
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

{
  const MX = -150, MZ = -520;                // second flat site, south of spawn
  const gY = (x, z) => sampleHeight(x, z);
  const stone = new THREE.MeshLambertMaterial({ color: 0xcfc4e0 });
  const rock = new THREE.MeshLambertMaterial({ color: 0x96755a, flatShading: true });
  const stoneDark = new THREE.MeshLambertMaterial({ color: 0x7a6e94, flatShading: true });
  const stonePale = new THREE.MeshLambertMaterial({ color: 0xcfc4e0, flatShading: true });
  const glowWin = new THREE.MeshBasicMaterial({ color: 0xbfe8ff });

  // jittered icosahedron: craggy rock, no two alike
  function cragGeometry(radius, detail, rough) {
    const g = new THREE.IcosahedronGeometry(radius, detail);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const s = 1 + (Math.random() - 0.5) * rough;
      p.setXYZ(i, p.getX(i) * s,
               p.getY(i) * s * (0.9 + Math.random() * 0.2), p.getZ(i) * s);
    }
    g.computeVertexNormals();
    return g;
  }
  // faceted crystal shader: flat facets + fresnel rim + pulsing inner glow
  const cryShaderMats = [0x8fe8ff, 0xff9fe0, 0xbfa8ff, 0xffd98f].map((c) =>
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(c) },
        uSunDir: sky.material.uniforms.sunDir,   // shared with the sky
        uTime: crystalTime,
        uDay: crystalDay,
      },
      vertexShader: /* glsl */`
        attribute float aH;
        varying vec3 vWorldPos;
        varying float vH;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vH = aH;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor, uSunDir;
        uniform float uTime, uDay;
        varying vec3 vWorldPos;
        varying float vH;
        void main() {
          vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
          vec3 v = normalize(cameraPosition - vWorldPos);
          if (dot(n, v) < 0.0) n = -n;
          float diff = max(dot(n, uSunDir), 0.0);
          float fres = pow(1.0 - max(dot(n, v), 0.0), 2.2);
          float pulse = 0.75 + 0.25 * sin(uTime * 1.4
            + vWorldPos.x * 0.35 + vWorldPos.z * 0.27);
          vec3 base = uColor * (0.20 + 0.55 * diff * uDay);
          vec3 core = uColor * (0.35 + 0.65 * (1.0 - vH))
            * 0.5 * pulse * (1.4 - uDay * 0.7);
          vec3 rim = mix(uColor, vec3(1.0), 0.55) * fres
            * (0.9 + (1.0 - uDay) * 1.5) * pulse;
          gl_FragColor = vec4(base + core + rim, 0.82 + fres * 0.15);
        }`,
    }));

  // hexagonal shaft + pyramid tip, per-vertex jitter so no two look alike
  function crystalGeometry(r, h, tip) {
    const ring0 = [], ring1 = [];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const j0 = 1 + (Math.random() - 0.5) * 0.25;
      const j1 = 1 + (Math.random() - 0.5) * 0.35;
      ring0.push([Math.cos(a) * r * j0, 0, Math.sin(a) * r * j0]);
      ring1.push([Math.cos(a) * r * 0.78 * j1,
        h * (1 + (Math.random() - 0.5) * 0.12),
        Math.sin(a) * r * 0.78 * j1]);
    }
    const apex = [(Math.random() - 0.5) * r * 0.5, h + tip,
                  (Math.random() - 0.5) * r * 0.5];
    const H = h + tip;
    const pos = [], aH = [];
    const tri = (...ps) => ps.forEach((p) => {
      pos.push(...p);
      aH.push(Math.max(p[1], 0) / H);
    });
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      tri(ring0[i], ring0[j], ring1[j]);
      tri(ring0[i], ring1[j], ring1[i]);
      tri(ring1[i], ring1[j], apex);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('aH', new THREE.BufferAttribute(new Float32Array(aH), 1));
    return g;
  }

  // glowing walkway ribbon draped on the terrain
  const pathMat = new THREE.MeshLambertMaterial(
    { color: 0x9fdcff, emissive: 0x2f7fa8, emissiveIntensity: 0.9 });
  function glowPath(x1, z1, x2, z2, w = 2.6) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(2, Math.ceil(len / 8));
    const dx = (x2 - x1) / len, dz = (z2 - z1) / len;
    const px = -dz * w / 2, pz = dx * w / 2;
    const pos = new Float32Array((n + 1) * 6);
    for (let i = 0; i <= n; i++) {
      const x = x1 + (x2 - x1) * i / n, z = z1 + (z2 - z1) * i / n;
      pos.set([x - px, gY(x - px, z - pz) + 0.2, z - pz,
               x + px, gY(x + px, z + pz) + 0.2, z + pz], i * 6);
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
    magicGroup.add(new THREE.Mesh(g, pathMat));
  }

  // crystal mage tower: fluted lathe body, helical ramp, spiral of lit
  // windows, embedded crystal shards and a crystal crown under the orb
  const ty = gY(MX, MZ);
  const TH = 46;
  const plinth = new THREE.Mesh(cragGeometry(11, 1, 0.4), stoneDark);
  plinth.scale.y = 0.38;
  plinth.position.set(MX, ty + 1.2, MZ);
  magicGroup.add(plinth);
  {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const r = 8.6 * (1 - 0.62 * t) * (1 + 0.055 * Math.sin(t * Math.PI * 7));
      pts.push(new THREE.Vector2(r, t * TH));
    }
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), stonePale);
    body.position.set(MX, ty + 2, MZ);
    magicGroup.add(body);
  }
  {
    const helix = new THREE.Curve();
    helix.getPoint = (t) => {
      const a = t * Math.PI * 6.5;
      const r = 9.6 * (1 - 0.6 * t) + 0.9;
      return new THREE.Vector3(Math.cos(a) * r, 2.5 + t * (TH - 7), Math.sin(a) * r);
    };
    const ramp = new THREE.Mesh(new THREE.TubeGeometry(helix, 160, 0.75, 7), stoneDark);
    ramp.position.set(MX, ty, MZ);
    magicGroup.add(ramp);
  }
  for (let i = 0; i < 11; i++) {               // windows follow the ramp
    const t = 0.12 + i * 0.075;
    const a = t * Math.PI * 6.5 + Math.PI / 5;
    const r = 8.6 * (1 - 0.62 * t) + 0.12;
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.22), glowWin);
    win.position.set(MX + Math.cos(a) * r, ty + 2 + t * TH, MZ + Math.sin(a) * r);
    win.lookAt(MX, win.position.y, MZ);
    magicGroup.add(win);
  }
  for (let i = 0; i < 6; i++) {                // crystal shards grown into it
    const t = 0.22 + (i * 37 % 52) / 100;
    const a = i * 2.4;
    const r = 8.6 * (1 - 0.62 * t) * 0.92;
    const sh = new THREE.Mesh(
      crystalGeometry(0.7, 3.2 + (i % 3), 1.8), cryShaderMats[i % 4]);
    sh.position.set(MX + Math.cos(a) * r, ty + 2 + t * TH, MZ + Math.sin(a) * r);
    sh.rotation.set(Math.sin(a) * 0.9, a, -Math.cos(a) * 0.9);
    magicGroup.add(sh);
  }
  {
    const topR = 8.6 * 0.38 + 0.6;             // crown of crystals
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2;
      const c = new THREE.Mesh(crystalGeometry(0.9, 5.5, 2.5), cryShaderMats[i % 4]);
      c.position.set(MX + Math.cos(a) * topR, ty + 1.2 + TH, MZ + Math.sin(a) * topR);
      c.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      magicGroup.add(c);
    }
    const orb = new THREE.Mesh(new THREE.SphereGeometry(3.0, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0xaef4ff }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(4.3, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0xaef4ff, transparent: true,
        opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
    magicGroup.add(orb, halo);
    magicAnims.push((t) => {
      const y = ty + TH + 8 + Math.sin(t * 0.8) * 1.4;
      orb.position.set(MX, y, MZ);
      halo.position.set(MX, y, MZ);
      halo.scale.setScalar(1 + Math.sin(t * 1.7) * 0.08);
    });
  }

  // ring of floating stones orbiting the tower
  const stoneRing = new THREE.Group();
  stoneRing.position.set(MX, ty + 33, MZ);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2;
    const st = new THREE.Mesh(cragGeometry(1.1 + (i % 3) * 0.4, 0, 0.55), rock);
    st.position.set(Math.cos(a) * 16, Math.sin(i * 2.1) * 1.8, Math.sin(a) * 16);
    st.rotation.set(i, i * 2.3, 0);
    stoneRing.add(st);
  }
  magicGroup.add(stoneRing);
  magicAnims.push((t, dt) => { stoneRing.rotation.y += dt * 0.25; });

  // crystal garden: clustered formations, each a main shaft with satellites
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2 + Math.sin(i * 7) * 0.4;
    const r = 26 + (i * 37 % 46);
    const cx = MX + Math.cos(a) * r, cz = MZ + Math.sin(a) * r;
    const cy = gY(cx, cz);
    const matC = cryShaderMats[i % 4];
    const mainR = 0.9 + (i * 11 % 7) * 0.12;
    const mainH = 6 + (i * 13 % 14);
    const main = new THREE.Mesh(crystalGeometry(mainR, mainH, mainH * 0.4), matC);
    main.position.set(cx, cy - 0.4, cz);
    main.rotation.set(Math.sin(i * 3) * 0.12, i * 1.1, Math.cos(i * 5) * 0.12);
    magicGroup.add(main);
    const kids = 2 + (i % 3);
    for (let k = 0; k < kids; k++) {
      const ka = (k / kids + i * 0.13) * Math.PI * 2;
      const s = 0.3 + (k * 7 % 4) * 0.08;                 // child scale
      const kid = new THREE.Mesh(
        crystalGeometry(mainR * (0.5 + s), mainH * s, mainH * s * 0.5), matC);
      const kx = cx + Math.cos(ka) * mainR * 2.2;
      const kz = cz + Math.sin(ka) * mainR * 2.2;
      kid.position.set(kx, gY(kx, kz) - 0.3, kz);
      kid.rotation.set(Math.cos(ka) * 0.45, ka, -Math.sin(ka) * 0.45);
      magicGroup.add(kid);
    }
    // soft light spill on the ground
    const glowM = new THREE.MeshBasicMaterial({
      color: cryShaderMats[i % 4].uniforms.uColor.value, transparent: true,
      opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(mainR * 5, 20), glowM);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(cx, cy + 0.22, cz);
    magicGroup.add(disc);
    cryGlowMats.push(glowM);
  }
  magicAnims.push((t) => { crystalTime.value = t; });

  // ---- imported crystal city (models/crystal/2/base_basic_pbr.glb) ----
  // lazy-loaded on first activation; real PBR textures from the asset, plus
  // a faint diffuse-driven self-glow that ramps up at night
  magicGroup.userData.loadCity = async () => {
    magicGroup.userData.loadCity = null;             // run once
    const btn = document.getElementById('magicBtn');
    try {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const gltf = await new Promise((res, rej) => new GLTFLoader().load(
        '../models/crystal/2/base_tex.glb', res, (e) => {
          if (e.total) btn.textContent =
            `🔮 水晶城加载 ${(e.loaded / e.total * 100).toFixed(0)}%`;
        }, rej));
      const city = gltf.scene;
      city.traverse((o) => {
        if (o.isMesh && o.material) {
          if (o.material.map) {
            o.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
          }
          o.material.emissiveMap = o.material.map;
          o.material.emissive = new THREE.Color(0xffffff);
          o.material.emissiveIntensity = 0.05;
          cityPbrMats.push(o.material);
        }
      });
      const bb = new THREE.Box3().setFromObject(city);
      const sz = bb.getSize(new THREE.Vector3());
      const S = 280 / Math.max(sz.x, sz.z);          // ~280 m footprint
      const cx2 = MX - 20, cz2 = MZ - 210;
      city.scale.setScalar(S);
      city.position.set(
        cx2 - (bb.min.x + bb.max.x) / 2 * S,
        gY(cx2, cz2) - bb.min.y * S - 1.5,
        cz2 - (bb.min.z + bb.max.z) / 2 * S);
      magicGroup.add(city);
      glowPath(MX, MZ, cx2, cz2, 3.2);               // walkway from the tower
      const glowM = new THREE.MeshBasicMaterial({ color: 0xbfa8ff,
        transparent: true, opacity: 0.15,
        blending: THREE.AdditiveBlending, depthWrite: false });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(170, 32), glowM);
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(cx2, gY(cx2, cz2) + 0.3, cz2);
      magicGroup.add(disc);
      cryGlowMats.push(glowM);
      const l = new THREE.PointLight(0xbfa8ff, 0, 800, 2);
      l.position.set(cx2, gY(cx2, cz2) + 120, cz2);
      magicGroup.add(l);
      magicLights.push(l);
    } catch (err) {
      console.error('crystal city load failed:', err);
    } finally {
      btn.textContent = '🔮 魔幻火星：开';
    }
  };

  // glowing mushrooms scattered between the crystals
  const capMats = [0xff9fe0, 0xbfa8ff, 0x8fe8ff].map((c) =>
    new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.7 }));
  const gillMats = [0xff9fe0, 0xbfa8ff, 0x8fe8ff].map((c) =>
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39996;                   // golden angle scatter
    const r = 18 + (i * 29 % 70);
    const mx2 = MX + Math.cos(a) * r, mz2 = MZ + Math.sin(a) * r;
    const my2 = gY(mx2, mz2);
    const hgt = 0.7 + (i % 4) * 0.35;
    const capR = 0.45 + (i % 3) * 0.2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, hgt, 6),
      new THREE.MeshLambertMaterial({ color: 0xd8cfc0 }));
    stem.position.set(mx2, my2 + hgt / 2, mz2);
    magicGroup.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(
      capR, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), capMats[i % 3]);
    cap.position.set(mx2, my2 + hgt, mz2);
    magicGroup.add(cap);
    const gill = new THREE.Mesh(new THREE.CircleGeometry(capR * 0.85, 12),
      gillMats[i % 3]);
    gill.rotation.x = Math.PI / 2;             // faces the ground, lights it
    gill.position.set(mx2, my2 + hgt - 0.04, mz2);
    magicGroup.add(gill);
  }
  for (let i = 0; i < 3; i++) {                // elder mushrooms
    const a = 1.3 + i * 2.1;
    const r = 42 + i * 23;
    const mx2 = MX + Math.cos(a) * r, mz2 = MZ + Math.sin(a) * r;
    const my2 = gY(mx2, mz2);
    const hgt = 2.6 + i * 0.5, capR = 1.35 + i * 0.25;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, hgt, 9),
      new THREE.MeshLambertMaterial({ color: 0xd8cfc0 }));
    stem.position.set(mx2, my2 + hgt / 2, mz2);
    magicGroup.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(
      capR, 16, 9, 0, Math.PI * 2, 0, Math.PI / 2), capMats[i]);
    cap.scale.y = 0.72;
    cap.position.set(mx2, my2 + hgt, mz2);
    magicGroup.add(cap);
    const gill = new THREE.Mesh(new THREE.CircleGeometry(capR * 0.9, 16),
      gillMats[i]);
    gill.rotation.x = Math.PI / 2;
    gill.position.set(mx2, my2 + hgt - 0.06, mz2);
    magicGroup.add(gill);
  }

  // floating islands with luminous trees
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * Math.PI * 2 + 0.6;
    const ix = MX + Math.cos(a) * (72 + i * 14);
    const iz = MZ + Math.sin(a) * (72 + i * 14);
    const base = gY(ix, iz) + 32 + i * 10;
    const isl = new THREE.Group();
    const chunk = new THREE.Mesh(cragGeometry(7 + i * 1.4, 1, 0.5), rock);
    chunk.scale.y = 0.62;
    isl.add(chunk);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a4632 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 4.5, 7), trunkMat);
    trunk.position.y = 6.2;
    isl.add(trunk);
    for (const [bx, by, tilt] of [[1.2, 8.2, 0.7], [-1.0, 8.6, -0.6]]) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, 2.6, 6), trunkMat);
      br.position.set(bx, by, 0.3);
      br.rotation.z = tilt;
      isl.add(br);
    }
    const folMat = new THREE.MeshLambertMaterial({ color: 0x7fffd4,
      emissive: 0x2fbf9f, emissiveIntensity: 0.8, flatShading: true });
    for (const [fx, fy, fz, fr] of
         [[0, 10.4, 0, 2.6], [2.0, 9.3, 0.4, 1.5], [-1.8, 9.7, 0.6, 1.3]]) {
      const fol = new THREE.Mesh(cragGeometry(fr, 1, 0.35), folMat);
      fol.position.set(fx, fy, fz);
      isl.add(fol);
    }
    for (let v = 0; v < 4; v++) {            // light vines under the island
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3 + v, 4),
        capMats[v % 3]);
      vine.position.set(Math.sin(v * 2.7) * 3, -5 - v * 0.6, Math.cos(v * 2.7) * 3);
      isl.add(vine);
    }
    for (let h = 0; h < 3; h++) {            // crystals hanging from the bottom
      const hc = new THREE.Mesh(
        crystalGeometry(0.7, 2.5 + h, 1.4), cryShaderMats[(i + h) % 4]);
      hc.rotation.x = Math.PI;
      hc.position.set(Math.sin(h * 2.1 + i) * 3.2, -2.2, Math.cos(h * 2.1 + i) * 3.2);
      isl.add(hc);
    }
    isl.position.set(ix, base, iz);
    magicGroup.add(isl);
    const groundY2 = gY(ix, iz);             // faint light shaft to the ground
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 6.5, base - groundY2, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x7fffd4, transparent: true,
        opacity: 0.028, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide }));
    shaft.position.set(ix, groundY2 + (base - groundY2) / 2, iz);
    magicGroup.add(shaft);
    magicAnims.push((t, dt) => {
      isl.position.y = base + Math.sin(t * 0.4 + i * 1.7) * 2.5;
      isl.rotation.y += dt * 0.05;
    });
  }

  // portal: ring of rune-carved standing stones with a spinning inner sigil
  const px2 = MX - 81, pz2 = MZ + 27;
  const py2 = gY(px2, pz2);
  const ga = Math.atan2(-0.95, 0.32) + Math.PI / 2;
  const gateG = new THREE.Group();
  gateG.position.set(px2, py2, pz2);
  gateG.rotation.y = ga;
  magicGroup.add(gateG);
  for (let i = 0; i < 13; i++) {
    const a = i / 13 * Math.PI * 2;
    const blk = new THREE.Mesh(cragGeometry(1.05, 0, 0.55), stoneDark);
    blk.scale.set(1, 1.55, 0.62);
    blk.position.set(Math.cos(a) * 7, 7.2 + Math.sin(a) * 7, 0);
    blk.rotation.z = a;
    gateG.add(blk);
    if (i % 3 === 0) {
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.12), glowWin);
      rune.position.set(Math.cos(a) * 7, 7.2 + Math.sin(a) * 7, 0.72);
      gateG.add(rune);
    }
  }
  for (const sx of [-1, 1]) {                  // rough pillar bases
    const pb = new THREE.Mesh(cragGeometry(1.6, 0, 0.4), stoneDark);
    pb.scale.set(1.2, 0.7, 1);
    pb.position.set(sx * 6.6, 0.7, 0);
    gateG.add(pb);
  }
  const sigil = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.09, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false }));
  sigil.position.set(0, 7.2, 0);
  gateG.add(sigil);
  const film = new THREE.Mesh(new THREE.CircleGeometry(6.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.3,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  film.position.set(0, 7.2, 0);
  gateG.add(film);
  magicAnims.push((t, dt) => {
    sigil.rotation.z -= dt * 0.7;
    film.material.opacity = 0.22 + Math.sin(t * 1.6) * 0.12;
  });

  // luminous walkways: portal -> tower -> island anchors
  glowPath(px2, pz2, MX, MZ, 3.2);
  glowPath(MX, MZ, MX + 60, MZ + 46);
  glowPath(MX, MZ, MX - 40, MZ - 58);

  // colored night lights
  for (const [c, lx2, lz2, ly2] of [
    [0x9fe8ff, MX, MZ, ty + TH + 10],
    [0xff9fe0, MX + 42, MZ + 30, gY(MX + 42, MZ + 30) + 8],
    [0x7fffd4, px2, pz2, py2 + 9],
  ]) {
    const l = new THREE.PointLight(c, 0, 130, 2);
    l.position.set(lx2, ly2, lz2);
    magicGroup.add(l);
    magicLights.push(l);
  }
}

function toggleMagic(force) {
  magicGroup.visible = force ?? !magicGroup.visible;
  const btn = document.getElementById('magicBtn');
  btn.textContent = magicGroup.visible ? '🔮 魔幻火星：开' : '🔮 魔幻火星：关';
  if (magicGroup.visible) magicGroup.userData.loadCity?.();
}
document.getElementById('magicBtn').addEventListener('click', () => toggleMagic());
if (q.get('magic') === '1') toggleMagic(true);

function toggleColony(force) {
  colonyGroup.visible = force ?? !colonyGroup.visible;
  const btn = document.getElementById('colonyBtn');
  btn.textContent = colonyGroup.visible ? '🌱 未来火星：开' : '🌱 未来火星：关';
}
document.getElementById('colonyBtn').addEventListener('click', () => toggleColony());
if (q.get('colony') === '1') toggleColony(true);

// ------------------------------------------- city assets (models/manifest.json)

const unitNightMats = [];                    // window/indicator mats, night-driven
const unitLights = [];                       // PointLights from userData.lights
const unitAnims = [];                        // (t, dt, night) animators
const orbitAnims = [];                       // same, for orbit-view assets (relay sats)
const unitSensors = [];                      // perception cameras (userData.sensors)
const pois = [];                             // sub-device knowledge points
const units = [];                            // placed units, for inspect mode
const mixers = [];                           // glTF AnimationMixers (loop_* clips)
const scheduled = [];                        // {g, action, ltst, lastSol} auto-triggers
let lastNight = 0;                           // written by updateSun each frame
const poiCardEl = document.getElementById('poiCard');

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
  const sph = new THREE.Box3().setFromObject(g)
    .getBoundingSphere(new THREE.Sphere());
  units.push({ id: a.id, name: a.name, group: g,
    center: sph.center.clone(), radius: Math.max(sph.radius, 2.5) });
  registerMotion(g);                          // unified animation (MODELS.md §4)
  if (g.userData.nightMats) unitNightMats.push(...g.userData.nightMats);
  for (const l of g.userData.lights || []) {
    const pl = new THREE.PointLight(l.color ?? 0xffd9a0, 0, l.range ?? 40, 2);
    pl.position.set(l.pos[0], l.pos[1], l.pos[2]);
    g.add(pl);
    unitLights.push(pl);
  }
  collectDeviceExtras(g, Math.max(300, (a.size_m || 60) * 3));
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
    anims.push((t, dt, night) => fn(t, dt, { t, dt, night }));
  }
  for (const s of ud.sensors || []) {           // perception cameras (MODELS.md §4c)
    const cam = resolveNode(g, s.camera);
    if (!cam || !cam.isCamera) continue;
    s._cam = cam;
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
function collectDeviceExtras(g, range) {
  hangDeviceTags(g, range);
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
    colonyGroup.add(dot);
    const tag = textSprite(p.label, 40, '#dff2ff');
    tag.scale.set(10, 1.25, 1);
    tag.position.copy(wp).add(new THREE.Vector3(0, 0.9, 0));
    tag.visible = false;
    colonyGroup.add(tag);
    pois.push({ wp, dot, tag, g, range: p.range ?? 25, label: p.label,
      detail: p.detail || '', specs: p.specs, physics: p.physics, sim: p.sim,
      unit: a.name });
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
  hintEl.textContent = `环视：${u.name} · 拖动旋转 · 滚轮缩放 · V 退出`;
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
  { pos: [-330, -12], radius: 7, interior: 'hab-foyer-01', label: '地下城' },
  { pos: [-372, -18], radius: 5, interior: 'hab-foyer-01', label: '地下城（电梯）' },
];
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
  const rec = { id, group, meta: mod.meta, lights,
    entry: group.userData.entry || { pos: [0, 0, 0], yaw: 0 },
    exitZone: group.userData.exitZone || { pos: [0, 0], radius: 3 } };
  return (interiorCache[id] = rec);
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
  rig.position.set(rec.entry.pos[0], 0, rec.entry.pos[2]);
  yaw = rec.entry.yaw || 0;
  if (document.pointerLockElement) canvas.requestPointerLock();
  rec.exitArmed = false;                     // re-arm the exit zone each entry
  inInterior = rec;
  nearPortal = null;
  portalPromptEl.style.display = 'none';
  hintEl.textContent = `${rec.meta.name} · WASD 走动 · 走到出口或按 Esc 返回地表`;
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
  interiorExiting = false;
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
  else if (inInterior.exitArmed) exitInterior();
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
    portalPromptEl.textContent = p ? `按 E 进入 ${p.label}` : '';
    portalPromptEl.style.display = p ? 'block' : 'none';
  }
}

// wilderness scatter pack: instantiate each builder at hand-picked spots,
// clear of the tech-city (east) and science zone (west)
async function loadScatter(a) {
  const mod = await import(`./units/${a.id}.js`);
  const B = mod.builders || {};
  const spots = [
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
loadUnits();

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
  crystalDay.value = day;
  for (const m of cryGlowMats) m.opacity = 0.1 + 0.35 * night;
  for (const m of cityPbrMats) m.emissiveIntensity = 0.05 + 0.4 * night;
  // sub-device tags: only in 环视(inspect) mode, for the inspected unit —
  // the main walking page stays clean (per user request)
  for (const s of assetLabels) {
    s.visible = !!inspectUnit
      && inspectUnit.center.distanceTo(s.position) < inspectUnit.radius * 1.6;
  }
  // blink beacons: ~0.8 s red pulse (blink_ meshes and userData.blinkMats)
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
}

function updateClockText(s, ltst) {
  if (realTime) timeSlider.value = ltst.toFixed(2);
  const hh = String(Math.floor(ltst)).padStart(2, '0');
  const mm = String(Math.floor((ltst % 1) * 60)).padStart(2, '0');
  timeInfoEl.textContent =
    `耶泽罗真太阳时 ${hh}:${mm}${realTime ? '（实时）' : ''}` +
    ` · Ls ${s.Ls.toFixed(0)}°`;
}

// relay constellation: 3 areostationary sats + 1 low science orbiter
const AREO = 20428;                          // areostationary orbit radius, km
// real com-relay-01 model (1 unit = 1 m), exaggerated for orbit-view visibility
// like the old placeholder was; its +Z is the Mars-nadir face
function relaySat(scale = 18) {
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
      sat.add(pan);                          // both apertures see open sky
    }
  }
  const spare = relaySat(16);                // co-located hot spare (redundancy)
  spare.position.copy(latLon(0, 77.4 + 16, AREO));
  spare.lookAt(0, 0, 0);
  spare.rotateY(Math.PI);
  orbitGroup.add(spare);
  registerMotion(spare, orbitAnims);
  const spLbl = textSprite('备份星', 34, '#c8b49a');
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
  const covLbl = textSprite('静止轨道覆盖极限 ±71° · 极区盲区', 34, '#ffcf9f');
  covLbl.scale.set(4600, 460, 1);
  covLbl.position.copy(latLon(80, 77.4, ORBIT_R + 900));
  orbitGroup.add(covLbl);

  const sat0 = latLon(0, 77.4, AREO);
  const beamMat = new THREE.LineBasicMaterial(
    { color: 0x9fdcff, transparent: true, opacity: 0.35 });
  orbitGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([jezero, sat0]), beamMat));
  orbitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
    [sat0, sat0.clone().normalize().multiplyScalar(48000)]), beamMat));
  const earthLbl = textSprite('→ 地球', 48);
  earthLbl.scale.set(2600, 325, 1);
  earthLbl.position.copy(sat0.clone().normalize().multiplyScalar(27000));
  orbitGroup.add(earthLbl);
  const satLbl = textSprite('中继星 ×3 主 + 1 备份 · 火星静止轨道 17,032 km', 44);
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
  const bus = poi('bus');
  const rows = [
    ['对火天线', poi('ka').specs?.['增益']],
    ['半功率波束', poi('ka').specs?.['半功率波束']],
    ['对地回传', poi('dte').specs?.['回传速率']],
    ['电源', poi('solar').specs?.['BOL 功率']],
    ['辐射面', poi('thermal').specs?.['工作温度(COMSOL)']],
    ['太阳翼模态', poi('adcs').specs?.['太阳翼一阶模态(COMSOL)']],
  ].filter(([, v]) => v);
  relayCardHTML =
    `<h3>${comRelayMeta.name}</h3><div class="u">com-relay-01 · 3 主 + 1 备份</div>` +
    `<p>${bus.detail || ''}</p>` +
    '<table>' + rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') +
    '</table>' +
    '<p class="phys">🔭 继续拉近可逐个查看子设备知识卡</p>';
  // full per-POI cards (same layout as surface proximity cards)
  const lines = (icon, val, cls) => (Array.isArray(val) ? val : [val])
    .map((s) => `<p class="${cls}">${icon} ${s}</p>`).join('');
  for (const p of info.pois) {
    let h = `<h3>${p.label}</h3><div class="u">${comRelayMeta.name}</div>`;
    if (p.detail) h += `<p>${p.detail}</p>`;
    if (p.specs) h += '<table>' + Object.entries(p.specs).map(
      ([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('') + '</table>';
    if (p.physics) h += lines('🔬', p.physics, 'phys');
    if (p.sim) h += lines('📐', p.sim, 'sim');
    relayPoiCards[p.id] = h;
  }
}).catch(() => {});
const loSpin = new THREE.Group();            // low orbiter, animated
{
  const loTilt = new THREE.Group();
  loTilt.rotation.x = 0.65;
  orbitGroup.add(loTilt);
  loTilt.add(loSpin);
  const LO_R = ORBIT_R + 400;
  const lo = buildSat(0.55);
  lo.position.set(LO_R, 0, 0);
  loSpin.add(lo);
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = i / 128 * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * LO_R, 0, Math.sin(a) * LO_R));
  }
  loTilt.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xffcf9f, transparent: true, opacity: 0.25 })));
  const loLbl = textSprite('科学轨道器 · 400 km · 代传地面数据', 40);
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
  const obs = new THREE.Group();             // LiteBIRD-style, display scale
  const shieldMat = new THREE.MeshLambertMaterial(
    { color: 0xd8d8e0, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {              // stacked sunshields face sunward
    const sh = new THREE.Mesh(
      new THREE.ConeGeometry(820 - i * 130, 300, 20, 1, true), shieldMat);
    sh.rotation.x = Math.PI / 2;
    sh.position.z = 500 + i * 260;
    obs.add(sh);
  }
  // three refracting telescopes (LFT / MFT / HFT), off-axis spin-scan boresight
  const tubeMat = new THREE.MeshLambertMaterial({ color: 0x8a90a0 });
  const apMat = new THREE.MeshLambertMaterial({ color: 0x1a1c22 });
  const scopes = [[330, 760, -230], [235, 640, 0], [180, 560, 220]];
  for (const [r, h, sx] of scopes) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), tubeMat);
    tube.rotation.x = Math.PI / 2 + 0.35;
    tube.position.set(sx, 0, -160);
    obs.add(tube);
    const ap = new THREE.Mesh(new THREE.CircleGeometry(r * 0.92, 16), apMat);
    ap.position.set(sx - 130, 0, -160 + Math.cos(0.35) * h / 2);
    ap.rotation.x = -0.35;
    obs.add(ap);
  }
  const bus = new THREE.Mesh(new THREE.BoxGeometry(820, 420, 380),
    new THREE.MeshLambertMaterial({ color: 0xb0885a }));
  bus.position.z = 160;
  obs.add(bus);
  obs.position.x = HALO_R;
  cmbSpin.add(obs);

  // data relay: L2 -> areostationary constellation
  orbitGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      [anchor.position, latLon(0, 77.4, AREO)]),
    new THREE.LineBasicMaterial(
      { color: 0x9fdcff, transparent: true, opacity: 0.22 })));

  const lbl = textSprite('CMB 偏振巡天站 · 日-火 L2', 44);
  lbl.scale.set(5600, 700, 1);
  lbl.position.copy(anchor.position).add(new THREE.Vector3(0, 2800, 0));
  orbitGroup.add(lbl);
  const lbl2 = textSprite('距火星 108万 km · 示意未按比例', 36, '#c8b49a');
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

function moveDesktop(dt) {
  rig.rotation.y = yaw;
  camera.rotation.x = pitch;
  const speed = (keys.has('ShiftLeft') ? 40 : 8) * (flying ? 4 : 1);
  const f = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
  const s = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  if (f || s) {
    // camera forward: pitch counts only when flying
    const fwd = flying
      ? new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch),
                          -Math.cos(yaw) * Math.cos(pitch))
      : new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    vel.copy(fwd).multiplyScalar(f).addScaledVector(right, s).normalize();
    rig.position.addScaledVector(vel, speed * dt);
  }
  if (!flying) {
    rig.position.y = sampleHeight(rig.position.x, rig.position.z);
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
function makeDeviceTag(text) {
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
  const k = 0.032;                              // ~3% of screen height
  spr.scale.set(k * c.width / c.height, k, 1);
  spr.renderOrder = 10;
  return spr;
}
function hangDeviceTags(group, range) {
  group.updateMatrixWorld(true);
  const bb = new THREE.Box3();
  group.traverse((o) => {
    if (!o.isGroup || !o.userData?.label) return;
    bb.setFromObject(o);
    if (bb.isEmpty()) return;
    const spr = makeDeviceTag(o.userData.label);
    spr.position.set((bb.min.x + bb.max.x) / 2, bb.max.y + 2.5,
                     (bb.min.z + bb.max.z) / 2);
    spr.userData.range = range;
    colonyGroup.add(spr);
    assetLabels.push(spr);
  });
}

// ---------------------------------------------------------------- loop

const posEl = document.getElementById('pos');
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
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
    if (relayAnchor && relayCardHTML) {       // relay cards, two proximity tiers
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
        id = 'relay'; html = relayCardHTML;   // summary tier
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
    posEl.textContent =
      `轨道高度 ${(camera.position.length() - ORBIT_R).toFixed(0)} km · ` +
      `拖动旋转 · 滚轮缩放`;
  } else if (inInterior) {                    // underground/indoor scene
    moveDesktop(dt);                          // walk; y is pinned in updateInterior
    updateInterior(dt);
    posEl.textContent = `${inInterior.meta.name} · 室内`;
  } else {
    updateSun();
    if (magicGroup.visible) {
      const t = clock.elapsedTime;
      for (const f of magicAnims) f(t, dt);
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
    posEl.textContent =
      `坐标 ${rig.position.x.toFixed(0)}, ${rig.position.z.toFixed(0)} m · ` +
      `海拔 ${(meta.elev_min_m + rig.position.y).toFixed(1)} m · ` +
      `${flying ? '飞行' : '行走'}模式`;
  }
  renderer.render(scene, camera);
});

if (q.get('interior')) enterInterior(q.get('interior'), null);

// ?debug=1 暴露内窥句柄（真浏览器验证用，STATUS「已知事项」约定）
if (q.has('debug')) {
  window.__mars = { units, unitSensors, unitAnims, colonyGroup, scene, renderer, camera, rig,
    driveSensors, clock };
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
