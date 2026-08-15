// viewer/magic/magic-city.js — 魔幻城(X 键图层),从 main.js 剥离的独立模块。
// 契约:引擎调用 build(ctx) 一次;模块不 import three、不碰引擎其他部分。
// ctx = {
//   THREE,                    三方库单例(勿自行 import)
//   group,                    magicGroup —— 全部几何挂这里,随 X 键显隐
//   anims,                    push (t, dt) 每帧回调(图层可见时驱动)
//   lights,                   push PointLight —— 引擎按夜色统一调强度
//   sampleHeight(x, z),       地形采样(全城平原海拔 ~42 m)
//   renderer,                 仅用于纹理各向异性上限查询
//   T,                        i18n 文案表(水晶城加载进度按钮)
//   crystalTime, crystalDay,  水晶着色器共享 uniform(引擎每帧/每昼夜写值)
//   cryGlowMats,              push 发光盘材质 —— 引擎按夜色调 opacity
//   cityPbrMats,              【本层已不再使用】原本是水晶王城 GLB 的 PBR 材质
//                             通道;王城改为程序化自建后本层没有 GLB,此数组保持
//                             为空(引擎侧空转,契约字段保留)。renderer / T 同理。
//   player,                   【可选,引擎未提供时自动降级】{ position:Vector3,
//                             teleport?(x, z, yaw) } —— 见文件尾"总控待办"
// }
// 场址:MX,MZ = (-150,-520),城南第二平地;水晶王城在 (-170,-730) 程序化自建
// (2026-08-14 起不再懒加载 Rodin GLB —— 整层零外部资产、零加载等待)。
//
// ── 本层的自建子系统(2026-08-13 艺术轮) ─────────────────────────────
// 1. 水晶着色器:平面切面 + 色散菲涅尔边缘 + 折射视差内芯(视线折射后按
//    通道分深度采样脉络场)+ 破土生长(uGrow 波)+ 受击涟漪(uHit)。
//    4 个材质共享全部 uniform 对象,InstancedMesh 走 instanceColor。
// 2. 传送门做戏:玩家穿过符印面 → 粒子涌出(Points)+ 冲击壳 + 相机前
//    畸变闪光 + 全场水晶涟漪 + 步道涌流;真传送需要 ctx.player.teleport。
// 3. 王城活化:GLB 表面采样出的窗火点阵(呼吸明灭)、环城飞光(样条上的
//    精灵点)、王城⇄法师塔之间的能量束脉冲。
// 4. 地形融合:魔幻区外围的发光苔藓斑 + 渐密水晶碎屑(都是 InstancedMesh)
//    + 地面光晕环 + 低矮雾罩,把"科学半球→魔法半球"摊成梯度。
// 5. 确定性:本文件不使用 Math.random —— 统一走 mulberry32 确定性流 rnd()。
//
// 性能:新增几何 ~8.3k 三角形(见 dev/dev-preview-magic.html 的 HUD 实测),
// 粒子全部是 Points / InstancedMesh,ShaderMaterial 共 9 个(4 水晶 + 3 精灵
// + 能量束 + 冲击壳),不随实例数增长。
export const meta = { id: 'magic-city', name: '魔幻城', name_en: 'Magic City' };

export function build(ctx) {
  const { THREE, group: magicGroup, anims: magicAnims, lights: magicLights,
          sampleHeight, renderer, T, sunDirUniform, crystalTime, crystalDay,
          cryGlowMats, cityPbrMats } = ctx;
  const MX = -150, MZ = -520;                // second flat site, south of spawn
  const CX = MX - 20, CZ = MZ - 210;         // crystal palace (lazy GLB) centre
  const gY = (x, z) => sampleHeight(x, z);
  magicGroup.name = 'magicCity';             // handle for ?debug=1 / capture

  // deterministic stand-in for Math.random (MODELS.md: no bare rng in assets).
  // one stream, fixed seed, fixed call order -> the city is byte-identical
  // every load, so screenshots and captures are comparable across sessions.
  const rnd = (() => {
    let a = 0x9a61c1;
    return () => {
      a = a + 0x6d2b79f5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  })();

  // masonry carries a faint violet self-glow at night (driven below): with only
  // point lights the tower and the capital fall to flat black silhouettes after
  // dusk, and the built structure stops reading against its own crystal
  const rock = new THREE.MeshLambertMaterial({ color: 0x96755a, flatShading: true,
    emissive: 0x2a2338 });
  const stoneDark = new THREE.MeshLambertMaterial({ color: 0x7a6e94, flatShading: true,
    emissive: 0x2e2942 });
  const stonePale = new THREE.MeshLambertMaterial({ color: 0xcfc4e0, flatShading: true,
    emissive: 0x413a5c });
  const nightStone = [rock, stoneDark, stonePale];
  // three window materials so the tower's lit spiral flickers out of step
  const WIN_BASE = new THREE.Color(0xbfe8ff);
  const winMats = [0, 1, 2].map(() =>
    new THREE.MeshBasicMaterial({ color: WIN_BASE.clone() }));
  const runeMat = new THREE.MeshBasicMaterial({ color: 0xbfe8ff });

  // ---- shared crystal uniforms (all four materials + the instanced debris) --
  const uGrow = { value: 0 };                          // 0→1 emergence wave
  const uHit = { value: new THREE.Vector4(0, -999, 0, -1000) };  // xyz + t fired

  // jittered icosahedron: craggy rock, no two alike
  function cragGeometry(radius, detail, rough) {
    const g = new THREE.IcosahedronGeometry(radius, detail);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const s = 1 + (rnd() - 0.5) * rough;
      p.setXYZ(i, p.getX(i) * s,
               p.getY(i) * s * (0.9 + rnd() * 0.2), p.getZ(i) * s);
    }
    g.computeVertexNormals();
    return g;
  }

  // ---- faceted crystal shader ---------------------------------------------
  // flat facets (screen-space derivative normals) + chromatic fresnel rim +
  // a parallaxed inner vein field read through a refracted view ray (three
  // depths, one per channel = dispersion) + growth + strike ripple.
  const cryVert = /* glsl */`
    attribute float aH;
    uniform vec3 uColor;
    uniform float uGrow;
    varying vec3 vWorldPos, vRel, vTint;
    varying float vH, vG;
    float h11(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
    void main() {
      mat4 m = modelMatrix;
      #ifdef USE_INSTANCING
        m = modelMatrix * instanceMatrix;
      #endif
      vTint = uColor;
      #ifdef USE_INSTANCING_COLOR
        vTint = instanceColor;
      #endif
      vec3 org = m[3].xyz;                        // this crystal's world origin
      float seed = h11(org.x * 0.317 + org.z * 1.131 + org.y * 0.071);
      float g = clamp((uGrow - seed * 0.45) / 0.55, 0.0, 1.0);
      g = g * g * (3.0 - 2.0 * g);                // smoothstep ease
      vG = g;
      vec3 p = position;
      p.y *= g * (1.0 + 0.14 * sin(g * 3.14159)); // slight overshoot on break-out
      p.xz *= mix(0.22, 1.0, g);
      vec4 wp = m * vec4(p, 1.0);
      vWorldPos = wp.xyz;
      vRel = wp.xyz - org;                        // vein field rides the crystal
      vH = aH;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const cryFrag = /* glsl */`
    uniform vec3 uSunDir;
    uniform float uTime, uDay;
    uniform vec4 uHit;
    varying vec3 vWorldPos, vRel, vTint;
    varying float vH, vG;
    float vein(vec3 p) {
      return 0.5 + 0.5 * sin(p.x * 1.7 + p.y * 0.9)
                       * sin(p.z * 1.3 - p.y * 1.1)
                       * sin(p.y * 0.7 + p.x * 0.5);
    }
    void main() {
      vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
      vec3 v = normalize(cameraPosition - vWorldPos);
      if (dot(n, v) < 0.0) n = -n;
      float diff = max(dot(n, uSunDir), 0.0);
      float ndv = max(dot(n, v), 0.0);
      vec3 fres3 = vec3(pow(1.0 - ndv, 1.95), pow(1.0 - ndv, 2.25),
                        pow(1.0 - ndv, 2.75));    // rim splits into colour
      vec3 rd = refract(-v, n, 0.66);             // n≈1.5 glass
      vec3 q = vRel + rd * (1.4 + 3.2 * (1.0 - ndv));
      vec3 disp = vec3(vein(q * 0.85), vein(q * 0.85 + rd * 0.55),
                       vein(q * 0.85 + rd * 1.10));
      disp = pow(disp, vec3(2.4)) * (0.7 + 0.3 * vein(q * 2.6));
      float pulse = 0.75 + 0.25 * sin(uTime * 1.4
        + vWorldPos.x * 0.35 + vWorldPos.z * 0.27);
      float age = uTime - uHit.w;                 // struck: ring through the lattice
      float dh = distance(vWorldPos, uHit.xyz);
      float w = age * 30.0 - dh;
      float ring = exp(-w * w * 0.05) * exp(-age * 1.3) * exp(-dh * 0.010)
                 * step(0.0, age) * step(age, 4.0);
      vec3 base = vTint * (0.20 + 0.55 * diff * uDay);
      vec3 core = vTint * (0.35 + 0.65 * (1.0 - vH)) * 0.5 * pulse * (1.4 - uDay * 0.7);
      vec3 inner = mix(vTint, vec3(1.0), 0.30) * disp * (0.75 + (1.0 - uDay) * 0.95);
      vec3 rim = mix(vTint, vec3(1.0), 0.55) * fres3
               * (0.9 + (1.0 - uDay) * 1.5) * pulse;
      vec3 hit = mix(vTint, vec3(1.0), 0.75) * ring * 2.4;
      vec3 born = mix(vTint, vec3(1.0), 0.55) * (1.0 - vG) * vG * 3.2;  // molten
      float a = 0.80 + fres3.g * 0.15 + ring * 0.45 + (1.0 - vG) * vG * 0.5;
      gl_FragColor = vec4(base + core + inner + rim + hit + born,
                          clamp(a, 0.0, 1.0) * smoothstep(0.0, 0.10, vG));
    }`;
  const cryUniforms = (c) => ({
    uColor: { value: new THREE.Color(c) },
    uSunDir: sunDirUniform,                  // shared with the engine sky
    uTime: crystalTime,
    uDay: crystalDay,
    uGrow,
    uHit,
  });
  const cryShaderMats = [0x8fe8ff, 0xff9fe0, 0xbfa8ff, 0xffd98f].map((c) =>
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide,
      uniforms: cryUniforms(c), vertexShader: cryVert, fragmentShader: cryFrag,
    }));
  // one more instance for the instanced debris (per-instance colour via
  // instanceColor; keeping it separate leaves the four garden mats untouched)
  const cryInstMat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide,
    uniforms: cryUniforms(0xbfa8ff), vertexShader: cryVert, fragmentShader: cryFrag,
  });

  // Prismatic shaft + pyramid tip, per-vertex jitter so no two look alike.
  // `sides` / `tiers` are for the hero crystals: more facets give the refraction
  // shader more to break up, and each extra tier drifts sideways, so a 90 m
  // shaft kinks like real growth instead of reading as a clean extrusion.
  // The defaults reproduce the original 18-triangle crystal.
  function crystalGeometry(r, h, tip, sides = 6, tiers = 1) {
    const rings = [];
    let ox = 0, oz = 0;
    for (let t = 0; t <= tiers; t++) {
      const u = t / tiers;
      const rr = r * (1 - 0.22 * u);
      if (t > 0) {
        ox += (rnd() - 0.5) * r * 0.34;
        oz += (rnd() - 0.5) * r * 0.34;
      }
      const ring = [];
      for (let i = 0; i < sides; i++) {
        const a = i / sides * Math.PI * 2;
        const j = 1 + (rnd() - 0.5) * (t === 0 ? 0.25 : 0.35);
        ring.push([ox + Math.cos(a) * rr * j,
          t === 0 ? 0 : h * u * (1 + (rnd() - 0.5) * 0.12),
          oz + Math.sin(a) * rr * j]);
      }
      rings.push(ring);
    }
    const apex = [ox + (rnd() - 0.5) * r * 0.5, h + tip,
                  oz + (rnd() - 0.5) * r * 0.5];
    const H = h + tip;
    const pos = [], aH = [];
    const tri = (...ps) => ps.forEach((p) => {
      pos.push(...p);
      aH.push(Math.max(p[1], 0) / H);
    });
    for (let t = 0; t < tiers; t++) {
      const lo = rings[t], hi = rings[t + 1];
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        tri(lo[i], lo[j], hi[j]);
        tri(lo[i], hi[j], hi[i]);
      }
    }
    const top = rings[tiers];
    for (let i = 0; i < sides; i++) tri(top[i], top[(i + 1) % sides], apex);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('aH', new THREE.BufferAttribute(new Float32Array(aH), 1));
    return g;
  }

  // ---- sprite-point shader (window fire / fly-lights / portal burst) -------
  // one source, three instances. mode 0 = breathe in place, mode 1 = burst
  // outward from the spawn point along aDir.
  const sparkVert = /* glsl */`
    attribute float aPhase;
    attribute vec3 aDir;
    uniform float uTime, uT0, uSize, uSpread, uBurst;
    varying float vA;
    void main() {
      vec3 p = position;
      float a;
      if (uBurst > 0.5) {
        float age = max(uTime - uT0, 0.0);
        float k = age * (0.45 + aPhase * 1.15);
        p += aDir * uSpread * k * (1.0 - 0.3 * min(k, 1.0));
        p.y -= 2.2 * k * k;                      // they arc and fall back
        a = exp(-age * 1.05) * step(age, 5.0);
      } else {
        a = 0.42 + 0.58 * sin(uTime * (1.1 + aPhase * 2.6) + aPhase * 31.4);
        a *= a;
      }
      vA = a;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp(uSize * (260.0 / max(-mv.z, 1.0)), 1.0, 24.0);
      gl_Position = projectionMatrix * mv;
    }`;
  const sparkFrag = /* glsl */`
    uniform vec3 uColor;
    uniform float uDay, uNightOnly;
    varying float vA;
    void main() {
      vec2 d = gl_PointCoord - 0.5;
      float r2 = dot(d, d);
      if (r2 > 0.25) discard;
      float f = exp(-r2 * 13.0) - 0.075;
      float night = mix(1.0, 1.0 - 0.72 * uDay, uNightOnly);
      gl_FragColor = vec4(uColor * (0.55 + 1.45 * f), max(f, 0.0) * vA * night);
    }`;
  function sparkMaterial(color, size, opts = {}) {
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: sparkVert, fragmentShader: sparkFrag,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: crystalTime, uDay: crystalDay,
        uT0: { value: -1000 }, uSize: { value: size },
        uSpread: { value: opts.spread ?? 0 },
        uBurst: { value: opts.burst ? 1 : 0 },
        uNightOnly: { value: opts.nightOnly === false ? 0 : 1 },
      },
    });
  }
  // Points geometry helper: positions + per-point phase (+ burst directions)
  function sparkGeometry(pts, dirs) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    const n = pts.length / 3;
    const ph = new Float32Array(n);
    for (let i = 0; i < n; i++) ph[i] = rnd();
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    g.setAttribute('aDir', new THREE.BufferAttribute(
      new Float32Array(dirs || new Float32Array(n * 3)), 3));
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

  // ---- where is the player? -----------------------------------------------
  // ctx has no player handle yet (MODELS.md §4a+). Until the engine supplies
  // one, read the camera three.js hands every renderable object in
  // onBeforeRender — a one-vertex invisible Points costs nothing and keeps the
  // probe inside this module. ctx.player wins whenever it shows up.
  const playerPos = new THREE.Vector3();
  const camQuat = new THREE.Quaternion();
  let probeSeen = false;
  {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([MX, gY(MX, MZ) + 2, MZ]), 3));
    const probe = new THREE.Points(g, new THREE.PointsMaterial(
      { size: 0, transparent: true, opacity: 0, depthWrite: false }));
    probe.frustumCulled = false;              // must render to report the camera
    probe.renderOrder = -1;
    probe.onBeforeRender = (r, s, cam) => {
      cam.getWorldPosition(playerPos);
      cam.getWorldQuaternion(camQuat);
      probeSeen = true;
    };
    magicGroup.add(probe);
  }
  const havePlayer = () => {
    if (ctx.player?.position) { playerPos.copy(ctx.player.position); return true; }
    return probeSeen;
  };
  const strike = (x, y, z, t) => uHit.value.set(x, y, z, t);   // ripple origin

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
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.22), winMats[i % 3]);
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
  const orb = new THREE.Mesh(new THREE.SphereGeometry(3.0, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xaef4ff }));
  {
    const topR = 8.6 * 0.38 + 0.6;             // crown of crystals
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2;
      const c = new THREE.Mesh(crystalGeometry(0.9, 5.5, 2.5, 7, 2), cryShaderMats[i % 4]);
      c.position.set(MX + Math.cos(a) * topR, ty + 1.2 + TH, MZ + Math.sin(a) * topR);
      c.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45);
      magicGroup.add(c);
    }
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
  const ORB_Y = ty + TH + 8;                   // beam anchor (mean orb height)

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
  const clusters = [];                         // {x, y, z} — strike targets
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2 + Math.sin(i * 7) * 0.4;
    const r = 26 + (i * 37 % 46);
    const cx = MX + Math.cos(a) * r, cz = MZ + Math.sin(a) * r;
    const cy = gY(cx, cz);
    const matC = cryShaderMats[i % 4];
    const mainR = 0.9 + (i * 11 % 7) * 0.12;
    const mainH = 6 + (i * 13 % 14);
    const main = new THREE.Mesh(crystalGeometry(mainR, mainH, mainH * 0.4, 8, 3), matC);
    main.position.set(cx, cy - 0.4, cz);
    main.rotation.set(Math.sin(i * 3) * 0.12, i * 1.1, Math.cos(i * 5) * 0.12);
    magicGroup.add(main);
    clusters.push({ x: cx, y: cy + mainH * 0.5, z: cz });
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

  // ---- growth clock -------------------------------------------------------
  // anims only tick while the layer is visible, so a gap in t means the player
  // just pressed X: replay the emergence from bare ground every time.
  const GROW_SECS = 4.2;
  let growT = 0, lastT = -1e9, winFlick = 0;
  magicAnims.push((t, dt) => {
    crystalTime.value = t;
    if (t - lastT > 0.5) growT = 0;            // layer was hidden -> regrow
    lastT = t;
    growT = Math.min(1, growT + dt / GROW_SECS);
    uGrow.value = growT;
    // tower windows: three phases, dimmed in daylight
    winFlick += dt;
    const dayF = crystalDay.value;
    for (const m of nightStone) m.emissiveIntensity = (1 - dayF) * 0.9;
    for (let i = 0; i < 3; i++) {
      const f = 0.62 + 0.38 * Math.sin(winFlick * (1.7 + i * 0.6) + i * 2.1)
                     * Math.sin(winFlick * 0.37 + i);
      winMats[i].color.copy(WIN_BASE).multiplyScalar(
        (0.35 + 0.65 * (1 - dayF)) * f * growT);
    }
  });

  // ---- ambient strike: the crystals notice you --------------------------
  {
    let nextStrike = 0;
    magicAnims.push((t) => {
      if (t < nextStrike || !havePlayer()) return;
      for (const c of clusters) {
        const d = Math.hypot(playerPos.x - c.x, playerPos.z - c.z);
        if (d < 5.5) { strike(c.x, c.y, c.z, t); nextStrike = t + 3.5; return; }
      }
    });
  }

  // ---- crystal palace — built here, no longer imported --------------------
  // It used to be a Rodin photoscan GLB (models/crystal/2/base_tex.glb, 1.0 M
  // triangles / 50 MB, lazy-loaded on first X). Two rounds of shader grafting
  // got it close, but a warm photoscan will never be the same object as a
  // faceted low-poly layer, and it cost a 40 s stall on first open. So the
  // capital is written in the layer's own vocabulary instead — the mage
  // tower's grammar at ten times the scale: fluted lathes, a helical ramp, lit
  // windows spiralling up, and faceted crystal grown straight through the
  // masonry. The layer now opens instantly and has no imported parts at all.
  // (The GLB path is recoverable from git — see dev/HANDOFF_magic-city.md.)
  const palace = new THREE.Group();
  palace.name = 'magicPalace';
  magicGroup.add(palace);
  const winPts = [];                            // window-fire seeds, world space
  let palaceGroundY = 0, palaceTopY = 0, palaceGate = null;
  {
    const NW = 12, R_WALL = 96, PHI = -Math.PI / 12, GATE = 3;
    const vA = (i) => i * Math.PI / 6 + PHI;    // wall vertex angles
    let baseY = gY(CX, CZ);                     // sit on the lowest ground we cover
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      baseY = Math.min(baseY, gY(CX + Math.cos(a) * 104, CZ + Math.sin(a) * 104));
    }
    baseY -= 1.5;
    palace.position.set(CX, baseY, CZ);         // everything below is local

    // Placement helper. A capital detailed down to arrow slits is ~1000 small
    // meshes = ~1000 draw calls, which is a worse bill than the triangles. So
    // every static part built from one of the batchable materials is *not*
    // added to the scene: its geometry is banked with its matrix and the whole
    // material's worth is merged into a single mesh at the end (below).
    // Crystals stay individual — their shader reads each object's own origin
    // for the growth stagger and the vein field, and merging would fuse them.
    const batches = new Map();
    let batchable = null;                       // filled once the mats exist
    const put = (mesh, x, y, z, ry = 0) => {
      mesh.position.set(x, y, z);
      mesh.rotation.y = ry;
      if (batchable && batchable.has(mesh.material)) {
        mesh.updateMatrix();
        let arr = batches.get(mesh.material);
        if (!arr) batches.set(mesh.material, arr = []);
        arr.push({ g: mesh.geometry, m: mesh.matrix.clone() });
        return mesh;                            // deliberately not in the graph
      }
      palace.add(mesh);
      return mesh;
    };
    function flushBatches() {
      for (const [mat, parts] of batches) {
        let n = 0;
        const flat = parts.map(({ g, m }) => {
          const q = g.index ? g.toNonIndexed() : g.clone();
          q.applyMatrix4(m);                    // transforms normals too
          n += q.attributes.position.count;
          return q;
        });
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
        let o = 0;
        for (const q of flat) {
          pos.set(q.attributes.position.array, o * 3);
          if (q.attributes.normal) nor.set(q.attributes.normal.array, o * 3);
          o += q.attributes.position.count;
          q.dispose();
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        palace.add(new THREE.Mesh(g, mat));
      }
      batches.clear();
    }
    // a window: lit box on the facade + a seed for the window-fire sprites
    // (winPts.length is always a multiple of 3, so it can't pick the phase)
    let nWin = 0;
    const UNIT = new THREE.BoxGeometry(1, 1, 1);
    const window = (x, y, z, ry, w = 1.6, h = 3.4) => {
      put(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), winMats[nWin++ % 3]),
        x, y, z, ry);
      // A lit box on a blank wall is a sticker. The surround — reveal, sill,
      // pointed head — is what makes it read as an opening, and it is the
      // detail the player is closest to.
      const c = Math.cos(ry), s0 = Math.sin(ry);
      for (const s of [-1, 1]) {
        const j = new THREE.Mesh(UNIT, trimMat);
        j.scale.set(0.42, h + 0.7, 0.85);
        const d = s * (w / 2 + 0.28);
        put(j, x + d * c, y, z - d * s0, ry);
      }
      const sill = new THREE.Mesh(UNIT, trimMat);
      sill.scale.set(w + 1.6, 0.42, 1.25);
      put(sill, x, y - h / 2 - 0.3, z, ry);
      const head = new THREE.Mesh(ARCH_HEAD, trimMat);
      head.scale.set(w / 2 + 0.28, w * 0.85, 5.4);
      put(head, x, y + h / 2, z, ry);
      const r = Math.hypot(x, z) || 1;
      winPts.push(CX + x + x / r * 1.2, baseY + y, CZ + z + z / r * 1.2);
    };

    // -- the vocabulary the capital is detailed with. Three extra materials
    //    cost nothing and do more against "crude" than any amount of geometry:
    //    roofs read as roofs, cornices catch the eye, slits read as dark.
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x565080,
      flatShading: true, emissive: 0x1c1930 });
    const trimMat = new THREE.MeshLambertMaterial({ color: 0xe6dff7,
      flatShading: true, emissive: 0x4c4576 });
    const slitMat = new THREE.MeshLambertMaterial({ color: 0x241f33 });
    nightStone.push(roofMat, trimMat);
    batchable = new Set([stonePale, stoneDark, rock, roofMat, trimMat, slitMat,
      pathMat, winMats[0], winMats[1], winMats[2]]);

    // a pointed arch (two jambs + a stretched half-torus head). Arcades are the
    // cheapest thing that reads as *architecture* rather than as boxes.
    const ARCH_HEAD = new THREE.TorusGeometry(1, 0.085, 3, 7, Math.PI);
    const JAMB = new THREE.BoxGeometry(1, 1, 1);
    const arch = (x, y, z, ry, w, h, d, mat) => {
      const c = Math.cos(ry), s0 = Math.sin(ry);
      for (const s of [-1, 1]) {                     // jambs, rotated into place
        const j = new THREE.Mesh(JAMB, mat);
        j.scale.set(w * 0.16, h, d);
        put(j, x + s * (w / 2) * c, y + h / 2, z - s * (w / 2) * s0, ry);
      }
      const head = new THREE.Mesh(ARCH_HEAD, mat);
      head.scale.set(w / 2, w * 0.72, d / 0.17);     // stretched = pointed
      put(head, x, y + h, z, ry);
    };

    // Hanging banners. Cloth is the one thing a fortress has that is not
    // stone, and the sway is what stops the whole capital from reading as a
    // frozen model — one anim drives every banner in the city.
    const bannerMats = [0x8f6fd8, 0xd86f9f, 0x6fa8d8, 0xd8b06f].map((c) =>
      new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide,
        emissive: c, emissiveIntensity: 0.45, flatShading: true }));
    // deliberately NOT in nightStone: the masonry ramp would drive cloth to
    // 0.9 and the banners would read as neon strips after dusk
    const banners = [];
    const BANNER = (() => {                      // a strip with a baked ripple
      const g = new THREE.PlaneGeometry(8.5, 24, 3, 6);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const u = p.getX(i) / 8.5, v = (p.getY(i) / 24) + 0.5;
        p.setZ(i, Math.sin(u * 5.2 + v * 3.1) * 0.8 * (1 - v * 0.55));
        if (v < 0.12) p.setX(i, p.getX(i) * (0.55 + v * 3.6));   // tapered foot
      }
      g.computeVertexNormals();
      return g;
    })();
    const banner = (x, y, z, ry, seed) => {
      const b = new THREE.Mesh(BANNER, bannerMats[seed % 4]);
      b.position.set(x, y - 12, z);
      b.rotation.y = ry;
      b.userData.ry = ry;
      b.userData.ph = seed * 1.7;
      palace.add(b);
      banners.push(b);
    };
    magicAnims.push((t) => {
      for (const b of banners) {
        b.rotation.y = b.userData.ry + Math.sin(t * 0.9 + b.userData.ph) * 0.16;
        b.rotation.z = Math.sin(t * 1.3 + b.userData.ph) * 0.05;
      }
    });

    // a tower top: corbel band, parapet, steep spire, finial. Reused by both
    // the wall towers and the flanking towers so the capital has one language.
    // Three roof types, dealt round the wall. One repeated silhouette is what
    // made the first pass read as a toy; the eye counts shapes, not triangles.
    const spireTop = (x, z, r, y, tint, kind = 0) => {
      for (let m = 0; m < 8; m++) {                  // corbel table
        const ma = m / 8 * Math.PI * 2 + 0.2;
        put(new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, 1.1, r * 0.42), trimMat),
          x + Math.cos(ma) * r * 1.12, y - 0.4, z + Math.sin(ma) * r * 1.12, -ma);
      }
      put(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.28, r * 1.06, 2.6, 10),
        trimMat), x, y + 1.5, z);                    // machicolated ring
      for (let m = 0; m < 6; m++) {                  // parapet
        const ma = m / 6 * Math.PI * 2 + 0.4;
        put(new THREE.Mesh(new THREE.BoxGeometry(r * 0.62, 2.6, r * 0.62), stoneDark),
          x + Math.cos(ma) * r * 1.06, y + 4.1, z + Math.sin(ma) * r * 1.06, -ma);
        put(new THREE.Mesh(new THREE.BoxGeometry(r * 0.7, 0.4, r * 0.7), trimMat),
          x + Math.cos(ma) * r * 1.06, y + 5.5, z + Math.sin(ma) * r * 1.06, -ma);
      }
      const top = y + 5.6;
      if (kind === 1) {                              // onion dome + lantern rod
        const pts = [];
        for (let i = 0; i <= 9; i++) {
          const t = i / 9;
          const rr = Math.sin(t * Math.PI * 0.96) * (1 + 0.42 * Math.sin(t * Math.PI))
                   * (1 - t * 0.06);
          pts.push(new THREE.Vector2(Math.max(rr * r * 0.92, 0.05), t * r * 2.4));
        }
        put(new THREE.Mesh(new THREE.LatheGeometry(pts, 10), roofMat), x, top, z);
        put(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, r * 0.9, 5),
          trimMat), x, top + r * 2.4 + r * 0.45, z);
        const fin = new THREE.Mesh(crystalGeometry(r * 0.22, r * 1.0, r * 0.8),
          cryShaderMats[tint % 4]);
        put(fin, x, top + r * 3.3, z);
      } else if (kind === 2) {                       // open lantern + spire
        put(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.72, r * 1.5, 8),
          stonePale), x, top + r * 0.75, z);
        for (let m = 0; m < 4; m++) {                // lantern openings
          const ma = m / 4 * Math.PI * 2 + 0.5;
          arch(x + Math.cos(ma) * r * 0.66, top + 0.2, z + Math.sin(ma) * r * 0.66,
            -ma + Math.PI / 2, r * 0.62, r * 0.85, 0.5, trimMat);
        }
        put(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r * 0.7, 0.7, 8),
          trimMat), x, top + r * 1.6, z);
        put(new THREE.Mesh(new THREE.ConeGeometry(r * 0.78, r * 2.6, 8), roofMat),
          x, top + r * 1.9 + r * 1.3, z);
        const fin = new THREE.Mesh(crystalGeometry(r * 0.2, r * 0.9, r * 0.7),
          cryShaderMats[tint % 4]);
        put(fin, x, top + r * 3.4, z);
      } else {                                       // steep spire + skirt
        put(new THREE.Mesh(new THREE.ConeGeometry(r * 1.22, 3.4, 10), roofMat),
          x, top - 1.2, z);
        put(new THREE.Mesh(new THREE.ConeGeometry(r * 0.97, r * 3.8, 10), roofMat),
          x, top + 0.4 + r * 1.9, z);
        const fin = new THREE.Mesh(crystalGeometry(r * 0.26, r * 1.2, r * 0.9),
          cryShaderMats[tint % 4]);
        put(fin, x, top + 0.4 + r * 3.8, z);
      }
    };

    // -- L0 stepped rock plinth: the castle stands on its own mesa, which is
    //    also what keeps a 200 m footprint from cutting a hard line in the dirt
    //    (scale.y is a *fraction of the radius* — 0.3 on a 128 m disc is a 38 m
    //     dome that swallows the whole curtain wall. Drive the half-height.)
    for (const [r, top, mat] of [[126, 7, rock], [104, 12, rock], [84, 16, stoneDark]]) {
      const HALF = 11;
      const step = new THREE.Mesh(cragGeometry(r, 1, 0.22), mat);
      step.scale.y = HALF / r;
      put(step, 0, top - HALF, 0);
    }

    // -- L0b the mesa is engineered, not a boulder: a battered retaining wall
    //    round each terrace, a rubble apron at its foot, and a switchback ramp
    //    cut into the north face for anything that cannot use the great stair
    for (const [rr, top, seg] of [[84, 16, 18], [104, 12, 22]]) {
      for (let i = 0; i < seg; i++) {
        const a = i / seg * Math.PI * 2;
        const ch = 2 * rr * Math.sin(Math.PI / seg);
        const ap = rr * Math.cos(Math.PI / seg);
        put(new THREE.Mesh(new THREE.BoxGeometry(ch + 1, 7, 4.5), stoneDark),
          Math.cos(a) * ap, top - 2.6, Math.sin(a) * ap, -a);
        put(new THREE.Mesh(new THREE.BoxGeometry(ch + 1.6, 0.7, 5.6), trimMat),
          Math.cos(a) * ap, top + 1.1, Math.sin(a) * ap, -a);
      }
    }
    {                                            // rubble apron, one draw call
      const RB = 150;
      const rub = new THREE.InstancedMesh(cragGeometry(1, 0, 0.7), rock, RB);
      rub.name = 'magicRubble';
      rub.frustumCulled = false;
      const mm = new THREE.Matrix4(), mq = new THREE.Quaternion();
      const mv = new THREE.Vector3(), ms = new THREE.Vector3();
      let n = 0;
      for (let i = 0; n < RB && i < RB * 4; i++) {
        const a = i * 2.39996 + 0.4;
        const band = i % 3;
        const rr = [88, 108, 128][band] + (rnd() - 0.5) * 13;
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        if (Math.abs(x) < 24 && z > 60) continue;      // the road stays clear
        const s = 1.1 + rnd() * 3.4;
        mq.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 6.28, rnd() * 3));
        ms.set(s, s * (0.5 + rnd() * 0.5), s);
        mv.set(x, [16, 12, 7][band] - 5 + rnd() * 2.5, z);
        mm.compose(mv, mq, ms);
        rub.setMatrixAt(n++, mm);
      }
      rub.count = n;
      rub.instanceMatrix.needsUpdate = true;
      palace.add(rub);
    }
    for (let k = 0; k < 9; k++) {                // switchback ramp, north face
      const leg = k % 2 ? -1 : 1;
      const a0 = -Math.PI / 2 - leg * 0.42, a1 = -Math.PI / 2 + leg * 0.42;
      const y0 = 5 + k * 1.35, rr = 122 - k * 4.4;
      for (let s2 = 0; s2 < 8; s2++) {
        const a = a0 + (a1 - a0) * (s2 + 0.5) / 8;
        put(new THREE.Mesh(new THREE.BoxGeometry(9, 1.5, 7), stoneDark),
          Math.cos(a) * rr, y0 + s2 * 0.17, Math.sin(a) * rr, -a + Math.PI / 2);
      }
    }

    // -- L1 curtain wall: 12-gon, one side left open for the gate. A plain
    //    extruded ring reads as a toy; what sells a wall is the vertical
    //    articulation — battered base, string course, buttresses, slits.
    const chord = 2 * R_WALL * Math.sin(Math.PI / NW);
    const apo = R_WALL * Math.cos(Math.PI / NW);      // apothem: wall mid-face
    for (let i = 0; i < NW; i++) {
      if (i === GATE) continue;
      const a0 = vA(i), a1 = vA(i + 1), am = (a0 + a1) / 2;
      const mx = Math.cos(am) * apo, mz = Math.sin(am) * apo;
      const ox = -Math.sin(am), oz = Math.cos(am);    // along the wall face
      const nx = Math.cos(am), nz = Math.sin(am);     // outward normal
      put(new THREE.Mesh(new THREE.BoxGeometry(chord + 1.5, 17, 6), stonePale),
        mx, 24.5, mz, -am);
      put(new THREE.Mesh(new THREE.BoxGeometry(chord + 2.5, 6, 8.4), stoneDark),
        mx + nx * 0.6, 19, mz + nz * 0.6, -am);       // battered base course
      put(new THREE.Mesh(new THREE.BoxGeometry(chord + 2, 0.9, 7.2), trimMat),
        mx + nx * 0.5, 28.5, mz + nz * 0.5, -am);     // string course
      for (const s of [-1, 1]) {                      // buttresses
        put(new THREE.Mesh(new THREE.BoxGeometry(3, 13, 3.4), stonePale),
          mx + ox * s * chord * 0.27 + nx * 2.6, 22.5,
          mz + oz * s * chord * 0.27 + nz * 2.6, -am);
      }
      for (let s = -1; s <= 1; s++) {                 // arrow slits
        put(new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.4, 0.5), slitMat),
          mx + ox * s * chord * 0.28 + nx * 3.05, 26,
          mz + oz * s * chord * 0.28 + nz * 3.05, -am);
      }
      // machicolation: a corbel table carrying an overhanging parapet. This is
      // the band the eye reads as "fortress" from 200 m out.
      for (let k = 0; k < 7; k++) {
        const u = (k + 0.5) / 7 - 0.5;
        put(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 2.4), trimMat),
          mx + ox * chord * u + nx * 3.7, 31.3, mz + oz * chord * u + nz * 3.7, -am);
      }
      put(new THREE.Mesh(new THREE.BoxGeometry(chord + 1.5, 2.6, 8.6), stonePale),
        mx + nx * 1.3, 33.6, mz + nz * 1.3, -am);     // overhanging parapet
      put(new THREE.Mesh(new THREE.BoxGeometry(chord - 1, 2.2, 1.4), stoneDark),
        mx - nx * 2.3, 33.6, mz - nz * 2.3, -am);     // inner parapet: a walkway
      // glowing rune seam along the parapet — same material as the walkways,
      // so it surges with them when the portal fires
      put(new THREE.Mesh(new THREE.BoxGeometry(chord, 0.5, 1.6), pathMat),
        mx + nx * 4.6, 34.4, mz + nz * 4.6, -am);
      for (let m = 0; m < 5; m++) {                   // crenellations
        const u = (m + 0.5) / 5 - 0.5;
        put(new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.4, 8.6), stoneDark),
          mx + ox * chord * u + nx * 1.3, 36.6, mz + oz * chord * u + nz * 1.3, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.5, 9), trimMat),
          mx + ox * chord * u + nx * 1.3, 38.5, mz + oz * chord * u + nz * 1.3, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 0.5), slitMat),
          mx + ox * chord * u + nx * 5.6, 36.4,
          mz + oz * chord * u + nz * 5.6, -am);       // merlon loophole
      }
    }
    // wall towers on every vertex — slimmer and much taller than the wall, so
    // the skyline has rhythm instead of one flat band
    for (let i = 0; i < NW; i++) {
      const a = vA(i), gt = i === GATE || i === GATE + 1;
      const r = gt ? 8.6 : 6.8, hgt = gt ? 42 : 34 + (i % 3) * 4;
      const x = Math.cos(a) * R_WALL, z = Math.sin(a) * R_WALL;
      put(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.16, hgt, 10), stonePale),
        x, 16 + hgt / 2, z, a);
      put(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.24, 1.6, 10),
        trimMat), x, 21.5, z, a);                     // plinth moulding
      for (const sy of [0.42, 0.74]) {                // string courses up the shaft
        put(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.7, 10),
          trimMat), x, 16 + hgt * sy, z, a);
      }
      spireTop(x, z, r, 16 + hgt, i, i % 3);
      for (let w = 0; w < 2; w++) {
        window(x * (1 - 0.02), 25 + w * 10, z * (1 - 0.02), a + Math.PI / 2, 1.3, 2.8);
      }
      put(new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.6, 0.5), slitMat),
        x * (1 + 0.055), 38 + (i % 3) * 3, z * (1 + 0.055), a + Math.PI / 2);
      if (i % 4 === 1) {                              // bartizan on some towers
        const ba = a + 0.9;
        const bx = x + Math.cos(ba) * r * 0.95, bz = z + Math.sin(ba) * r * 0.95;
        put(new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.5, 7), trimMat),
          bx, 16 + hgt * 0.58, bz);                   // corbel under it
        put(new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 7, 7), stonePale),
          bx, 16 + hgt * 0.58 + 5.6, bz);
        put(new THREE.Mesh(new THREE.ConeGeometry(3.0, 5, 7), roofMat),
          bx, 16 + hgt * 0.58 + 11.5, bz);
        put(new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5), slitMat),
          bx + Math.cos(ba) * 2.5, 16 + hgt * 0.58 + 5.6, bz + Math.sin(ba) * 2.5,
          ba + Math.PI / 2);
      }
      // a lamp hung between this tower and the next
      const an = vA(i + 1), lam = (a + an) / 2;
      const lc = new THREE.Mesh(crystalGeometry(0.75, 3.4, 1.6), cryShaderMats[(i + 2) % 4]);
      lc.rotation.x = Math.PI;
      put(lc, Math.cos(lam) * (R_WALL + 3.4), 31, Math.sin(lam) * (R_WALL + 3.4));
      if (i !== GATE) banner(Math.cos(lam) * (R_WALL + 3.4), 37,
        Math.sin(lam) * (R_WALL + 3.4), -lam + Math.PI / 2, i);
    }
    {                                            // -- the great gate, facing the tower
      const am = (vA(GATE) + vA(GATE + 1)) / 2;
      const gx = Math.cos(am) * R_WALL * Math.cos(Math.PI / NW);
      const gz = Math.sin(am) * R_WALL * Math.cos(Math.PI / NW);
      // a gatehouse, not two posts: solid block either side of a 19 m opening,
      // a lintel over it, and a lit membrane in the gap so the eye finds the
      // door from the far end of the walkway
      const ox = -Math.sin(am), oz = Math.cos(am);        // along the wall
      const nx2 = Math.cos(am), nz2 = Math.sin(am);       // outward, down the road
      for (const s of [-1, 1]) {                          // jambs
        put(new THREE.Mesh(new THREE.BoxGeometry(11, 30, 9), stonePale),
          gx + ox * s * 15, 31, gz + oz * s * 15, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(11, 0.5, 2), pathMat),
          gx + ox * s * 15, 46.3, gz + oz * s * 15, -am);
        for (let m = 0; m < 3; m++) {                     // merlons on the jamb
          put(new THREE.Mesh(new THREE.BoxGeometry(2.8, 3, 9), stoneDark),
            gx + ox * (s * 15 + (m - 1) * 3.8), 47.5,
            gz + oz * (s * 15 + (m - 1) * 3.8), -am);
        }
      }
      put(new THREE.Mesh(new THREE.BoxGeometry(41, 8, 9), stonePale),
        gx, 42, gz, -am);                                 // lintel
      put(new THREE.Mesh(new THREE.BoxGeometry(41, 0.6, 2), pathMat),
        gx, 46.3, gz, -am);
      for (const s of [-1, 1]) {                          // finials over the arch
        const c = new THREE.Mesh(crystalGeometry(1.4, 9, 4), cryShaderMats[s > 0 ? 0 : 2]);
        put(c, gx + ox * s * 6, 46.5, gz + oz * s * 6);
      }
      const film = new THREE.Mesh(new THREE.PlaneGeometry(19, 22),
        new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true,
          opacity: 0.3, side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending, depthWrite: false }));
      put(film, gx, 27, gz, -am);                // the hall breathes through it
      magicAnims.push((t) => {
        film.material.opacity = (0.16 + Math.sin(t * 0.9) * 0.08)
          * (1.35 - crystalDay.value);
      });
      // crystals flanking the road in — nothing on the centreline, or you walk
      // up to the capital with a 17 m shaft parked in front of the door
      const flank = [-27, -15, 15, 27];
      for (let i = 0; i < flank.length; i++) {
        const s = flank[i];
        const c = new THREE.Mesh(crystalGeometry(1.4, 9 + (i % 3) * 4, 5, 7, 2),
          cryShaderMats[i % 4]);
        const cx2 = gx - Math.sin(am) * s + Math.cos(am) * 18;
        const cz2 = gz + Math.cos(am) * s + Math.sin(am) * 18;
        put(c, cx2, gY(CX + cx2, CZ + cz2) - baseY - 0.6, cz2);
      }
      // two guardians on the gate piers. Abstract — a robed lathe under a
      // crystal head — but a figure at human scale is what tells the eye how
      // big everything else is.
      for (const s2 of [-1, 1]) {
        // at the head of the stair, flanking the road — not against the wall,
        // where the gate towers already are
        const gx2 = gx + ox * s2 * 16 + nx2 * 7, gz2 = gz + oz * s2 * 16 + nz2 * 7;
        put(new THREE.Mesh(new THREE.BoxGeometry(7, 6, 7), stoneDark), gx2, 17.5, gz2, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.6, 7.8), trimMat),
          gx2, 20.8, gz2, -am);
        const pts = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8;
          pts.push(new THREE.Vector2(
            2.7 * (1 - t * 0.62) * (1 + 0.22 * Math.sin(t * Math.PI * 2.2)), t * 13));
        }
        put(new THREE.Mesh(new THREE.LatheGeometry(pts, 9), stonePale), gx2, 21, gz2);
        put(new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.6, 2.4), stonePale),
          gx2, 31, gz2, -am);                    // shoulders
        const head = new THREE.Mesh(crystalGeometry(1.1, 3.2, 1.6, 8, 2),
          cryShaderMats[s2 > 0 ? 0 : 2]);
        put(head, gx2, 32.9, gz2);
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 17, 5),
          stoneDark);
        put(staff, gx2 + ox * s2 * 3.6, 28.5, gz2 + oz * s2 * 3.6);
        const orb2 = new THREE.Mesh(crystalGeometry(0.9, 2.6, 1.3, 7, 2),
          cryShaderMats[s2 > 0 ? 3 : 1]);
        put(orb2, gx2 + ox * s2 * 3.6, 37, gz2 + oz * s2 * 3.6);
      }
      // a stair up the mesa and a barbican either side of it: the capital used
      // to be enterable only by levitation
      for (let s2 = 0; s2 < 11; s2++) {
        const u = s2 / 10;
        put(new THREE.Mesh(new THREE.BoxGeometry(23, 1.9, 5.4), stoneDark),
          gx + nx2 * (42 - u * 40), 6.4 + u * 10.4, gz + nz2 * (42 - u * 40), -am);
      }
      for (const s2 of [-1, 1]) {
        put(new THREE.Mesh(new THREE.BoxGeometry(3.4, 7, 40), stonePale),
          gx + ox * s2 * 14 + nx2 * 24, 13, gz + oz * s2 * 14 + nz2 * 24, -am);
        put(new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 40), pathMat),
          gx + ox * s2 * 14 + nx2 * 24, 16.8, gz + oz * s2 * 14 + nz2 * 24, -am);
        for (let m = 0; m < 7; m++) {            // the barbican gets a parapet
          const d2 = 24 + (m - 3) * 5.4;
          put(new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 2.8), stoneDark),
            gx + ox * s2 * 14 + nx2 * d2, 18.4, gz + oz * s2 * 14 + nz2 * d2, -am);
          put(new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.4, 3.2), trimMat),
            gx + ox * s2 * 14 + nx2 * d2, 19.9, gz + oz * s2 * 14 + nz2 * d2, -am);
        }
        for (let p = 0; p < 3; p++) {            // pylons along the barbican
          const c = new THREE.Mesh(crystalGeometry(1.0, 6, 2.6),
            cryShaderMats[(p + (s2 > 0 ? 1 : 3)) % 4]);
          put(c, gx + ox * s2 * 14 + nx2 * (10 + p * 14), 17,
            gz + oz * s2 * 14 + nz2 * (10 + p * 14));
        }
      }
    }

    // -- L1b the courtyard is inhabited: a ring of small halls whose roofs
    //    just clear the parapet. Nothing says "capital" like rooflines behind
    //    a wall, and at 20 triangles each they are the cheapest thing here.
    // two rings of houses, tall enough that their roofs break the parapet
    // line. A bailey with nothing in it is just a gap between two cylinders.
    for (let ring = 0; ring < 2; ring++) {
      const N = ring ? 16 : 13, R0h = ring ? 84 : 66;
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2 + (ring ? 0.19 : 0.42);
        let d = Math.abs(a - Math.PI / 2);
        d = Math.min(d, Math.PI * 2 - d);
        if (d < 0.30) continue;                 // leave the gate street open
        const r = R0h + ((i * 5) % 3) * 3.5;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const w = 8 + ((i * 7) % 3) * 3.5, dep = 7 + ((i * 3) % 2) * 2.5;
        const h = 10 + ((i * 11) % 4) * 5;      // 10..25 → some clear the wall
        put(new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), stonePale),
          x, 16 + h / 2, z, -a);
        put(new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.6, dep + 1.2), trimMat),
          x, 16 + h + 0.2, z, -a);              // eaves
        const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, 5 + h * 0.16, 4),
          roofMat);
        roof.scale.set(1, 1, dep / w);
        put(roof, x, 16 + h + 2.6 + h * 0.08, z, -a + Math.PI / 4);
        put(new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.5, 1.6), stoneDark),
          x + Math.cos(a + 1.2) * w * 0.28, 16 + h + 4, z + Math.sin(a + 1.2) * w * 0.28,
          -a);                                  // chimney
        window(x + Math.cos(a) * (dep / 2 + 0.3), 16 + h * 0.45,
          z + Math.sin(a) * (dep / 2 + 0.3), a + Math.PI / 2, 1.5, 2.6);
        if (h > 18) {
          window(x + Math.cos(a) * (dep / 2 + 0.3), 16 + h * 0.78,
            z + Math.sin(a) * (dep / 2 + 0.3), a + Math.PI / 2, 1.4, 2.2);
        }
      }
    }
    {                                            // the gate street and its market
      const am = Math.PI / 2;
      for (let k = 0; k < 9; k++) {
        const r = 76 + k * 2.4;
        put(new THREE.Mesh(new THREE.BoxGeometry(19, 0.5, 2.6), stoneDark),
          0, 16.3, Math.sin(am) * r);
      }
      put(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 22), pathMat), -9, 16.5, 86);
      put(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 22), pathMat), 9, 16.5, 86);
      for (let k = 0; k < 8; k++) {              // stalls under awnings
        const s2 = k % 2 ? 1 : -1, zz = 78 + Math.floor(k / 2) * 6.5;
        put(new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 3.6), stoneDark),
          s2 * 13.5, 17.5, zz);
        put(new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 5), roofMat),
          s2 * 13.5, 19.4, zz);
        const lc = new THREE.Mesh(crystalGeometry(0.5, 1.8, 0.9),
          cryShaderMats[k % 4]);
        put(lc, s2 * 13.5, 19.8, zz);
      }
      for (let k = 0; k < 6; k++) {              // steps up onto the terrace
        put(new THREE.Mesh(new THREE.BoxGeometry(16, 1.1, 3), stoneDark),
          0, 16.6 + k * 1.05, 74 - k * 2.4);
      }
    }

    // -- L1d the courtyard floor: a stepped terrace skirting the drum, so the
    //    bailey is a place rather than a gap between two cylinders
    for (const [r0, y0, h0] of [[70, 16, 3.2], [64, 19, 3.2], [59, 22, 3.6]]) {
      put(new THREE.Mesh(new THREE.CylinderGeometry(r0, r0 + 1.4, h0, 28),
        stoneDark), 0, y0 + h0 / 2, 0);
      put(new THREE.Mesh(new THREE.CylinderGeometry(r0 + 0.4, r0 + 0.4, 0.5, 28),
        trimMat), 0, y0 + h0, 0);
    }
    for (let i = 0; i < 6; i++) {                // lamp posts round the terrace
      const a = i / 6 * Math.PI * 2 + 0.5;
      const x = Math.cos(a) * 74, z = Math.sin(a) * 74;
      put(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 7, 5), stoneDark),
        x, 19.5, z);
      const lc = new THREE.Mesh(crystalGeometry(1.1, 3.2, 1.6), cryShaderMats[i % 4]);
      put(lc, x, 23, z);
    }

    // -- L2 inner ward: a fluted drum lifting the keep clear of the wall
    {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const r = 58 * (1 - 0.10 * t) * (1 + 0.045 * Math.sin(t * Math.PI * 6));
        pts.push(new THREE.Vector2(r, 8 + t * 34));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(pts, 20), stonePale), 0, 0, 0);
      // the only part of the drum that clears the curtain wall is its top 9 m,
      // so all of its detail money goes there: a corbel arcade under a
      // parapet, which is what turns a smooth cylinder into a building
      for (let i = 0; i < 20; i++) {
        const a = i / 20 * Math.PI * 2, r = 53.6;
        arch(Math.cos(a) * r, 31, Math.sin(a) * r, -a + Math.PI / 2,
          8.4, 4.6, 1.6, trimMat);
        put(new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.4, 2.2), stoneDark),
          Math.cos(a + Math.PI / 20) * r, 42.6, Math.sin(a + Math.PI / 20) * r,
          -a - Math.PI / 20 + Math.PI / 2);
      }
      put(new THREE.Mesh(new THREE.TorusGeometry(53, 1.4, 6, 24)
        .rotateX(Math.PI / 2), pathMat), 0, 40.8, 0);       // lit cornice
      for (let i = 0; i < 20; i++) {             // two rows of ward windows
        const a = i / 20 * Math.PI * 2;
        for (const [y, r] of [[20, 56.5], [36, 54.0]]) {
          window(Math.cos(a) * r, y, Math.sin(a) * r, a + Math.PI / 2);
        }
      }
    }

    // -- L3 the keep: the mage tower's own profile, grown to capital scale
    const WARD = 42, KEEP_H = 96;
    {
      const pts = [];
      for (let i = 0; i <= 26; i++) {
        const t = i / 26;
        const r = 27 * (1 - 0.60 * t) * (1 + 0.05 * Math.sin(t * Math.PI * 9));
        pts.push(new THREE.Vector2(r, t * KEEP_H));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(pts, 24), stonePale), 0, WARD, 0);
      const helix = new THREE.Curve();           // the ramp, echoing the tower
      helix.getPoint = (t) => {
        const a = t * Math.PI * 5.5;
        const r = 29 * (1 - 0.58 * t) + 1.6;
        return new THREE.Vector3(Math.cos(a) * r, t * (KEEP_H - 10), Math.sin(a) * r);
      };
      const ramp = new THREE.Mesh(new THREE.TubeGeometry(helix, 96, 1.7, 5), stoneDark);
      put(ramp, 0, WARD + 3, 0);
      for (let i = 0; i < 15; i++) {             // windows follow the ramp
        const t = 0.10 + i * 0.058;
        const a = t * Math.PI * 5.5 + Math.PI / 4;
        const r = 27 * (1 - 0.60 * t) + 0.2;
        window(Math.cos(a) * r, WARD + t * KEEP_H, Math.sin(a) * r,
          a + Math.PI / 2, 1.7, 3.8);
      }
      // -- the keep's own articulation. A bare lathe is a chimney; pilasters
      //    give it vertical rhythm, the lit tracery between them gives it the
      //    layer's magic, and a corbelled crown gives it a head.
      const kr = (t) => 27 * (1 - 0.60 * t);     // keep radius at height t
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + 0.31;
        for (const [t0, t1] of [[0.02, 0.42], [0.44, 0.82]]) {
          const rm = kr((t0 + t1) / 2) + 0.5, hh = (t1 - t0) * KEEP_H;
          put(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.7, hh, 4), stonePale),
            Math.cos(a) * rm, WARD + (t0 + t1) / 2 * KEEP_H, Math.sin(a) * rm, a);
        }
        const rt = kr(0.24) + 0.9;               // lit tracery between pilasters
        put(new THREE.Mesh(new THREE.BoxGeometry(0.6, KEEP_H * 0.34, 0.6), pathMat),
          Math.cos(a + 0.31) * rt, WARD + KEEP_H * 0.26, Math.sin(a + 0.31) * rt);
      }
      {                                          // gallery arcade round the base
        const r = kr(0.06) + 0.6;
        for (let i = 0; i < 14; i++) {
          const a = i / 14 * Math.PI * 2;
          arch(Math.cos(a) * r, WARD + 5, Math.sin(a) * r, -a + Math.PI / 2,
            9, 7.5, 1.8, trimMat);
        }
      }
      {                                          // machicolated crown
        const r = kr(0.97);
        put(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.34, r * 1.02, 3.2, 24),
          trimMat), 0, WARD + KEEP_H - 2.6, 0);
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2;
          put(new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.4, 2.4), stoneDark),
            Math.cos(a) * r * 1.2, WARD + KEEP_H + 1.4, Math.sin(a) * r * 1.2, -a);
        }
      }
      {                                          // rose window, facing the gate
        const a = Math.PI / 2, r = kr(0.20) + 0.4;
        const rose = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.42, 3, 12),
          trimMat);
        rose.rotation.y = -a + Math.PI / 2;
        put(rose, Math.cos(a) * r, WARD + KEEP_H * 0.22, Math.sin(a) * r);
        const pane = new THREE.Mesh(new THREE.CircleGeometry(4.4, 12),
          new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true,
            opacity: 0.5, side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending, depthWrite: false }));
        put(pane, Math.cos(a) * r, WARD + KEEP_H * 0.22, Math.sin(a) * r,
          -a + Math.PI / 2);
        magicAnims.push((t) => {
          pane.material.opacity = (0.28 + Math.sin(t * 1.1 + 2) * 0.12)
            * (1.3 - crystalDay.value);
        });
      }
      for (let i = 0; i < 9; i++) {              // crown of crystals
        const a = i / 9 * Math.PI * 2;
        const rr = 27 * 0.40 + 1.2;
        const c = new THREE.Mesh(crystalGeometry(1.9, 13, 6, 7, 2), cryShaderMats[i % 4]);
        c.position.set(Math.cos(a) * rr, WARD + KEEP_H + 1, Math.sin(a) * rr);
        c.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
        palace.add(c);
      }
      {                                          // crowning lantern: the keep
        // needs a head, not just a flat top under a ring of crystal
        const ly = WARD + KEEP_H + 2;
        put(new THREE.Mesh(new THREE.CylinderGeometry(7.6, 8.4, 13, 8), stonePale),
          0, ly + 6.5, 0);
        for (let m = 0; m < 8; m++) {
          const ma = m / 8 * Math.PI * 2 + 0.39;
          arch(Math.cos(ma) * 7.8, ly + 1, Math.sin(ma) * 7.8, -ma + Math.PI / 2,
            4.4, 8, 0.7, trimMat);
          put(new THREE.Mesh(new THREE.BoxGeometry(1.5, 13, 1.5), stonePale),
            Math.cos(ma + Math.PI / 8) * 8.1, ly + 6.5,
            Math.sin(ma + Math.PI / 8) * 8.1, -ma);
        }
        put(new THREE.Mesh(new THREE.CylinderGeometry(9.6, 7.8, 1.6, 8), trimMat),
          0, ly + 13.6, 0);
        put(new THREE.Mesh(new THREE.ConeGeometry(9.0, 24, 8), roofMat),
          0, ly + 14.4 + 12, 0);
        const fin = new THREE.Mesh(crystalGeometry(2.0, 11, 5, 8, 2), cryShaderMats[1]);
        put(fin, 0, ly + 26, 0);
        put(new THREE.Mesh(new THREE.BoxGeometry(0.5, 9, 0.5), pathMat),
          0, ly + 30, 0);
      }
      // real flying buttresses: pier on the ward, arc up to the keep, pinnacle
      // on top. A cathedral silhouette is mostly this.
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2 + Math.PI / 8;
        let dg = Math.abs(a - Math.PI / 2); dg = Math.min(dg, Math.PI * 2 - dg);
        let dh = Math.abs(a - Math.PI); dh = Math.min(dh, Math.PI * 2 - dh);
        if (dg < 0.4 || dh < 0.4) continue;      // clear the rose window & hall
        const pr = 48, px2 = Math.cos(a) * pr, pz2 = Math.sin(a) * pr;
        put(new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 22, 6), stonePale),
          px2, WARD + 11, pz2, a);
        put(new THREE.Mesh(new THREE.ConeGeometry(2.6, 7, 6), roofMat),
          px2, WARD + 25, pz2, a);
        const fin = new THREE.Mesh(crystalGeometry(0.8, 5, 2.4), cryShaderMats[i % 4]);
        put(fin, px2, WARD + 29, pz2);
        const arc2 = new THREE.CatmullRomCurve3([
          new THREE.Vector3(px2, WARD + 20, pz2),
          new THREE.Vector3(Math.cos(a) * 38, WARD + 34, Math.sin(a) * 38),
          new THREE.Vector3(Math.cos(a) * (kr(0.34) + 1), WARD + KEEP_H * 0.34,
            Math.sin(a) * (kr(0.34) + 1)),
        ]);
        put(new THREE.Mesh(new THREE.TubeGeometry(arc2, 14, 1.15, 5), stonePale),
          0, 0, 0);
      }
    }

    // -- L3b the great hall and the annex. Three concentric drums is a
    //    generator's silhouette; a building looks designed when something
    //    sticks out of it asymmetrically.
    // a wing that projects past the ward's rim, carried on piers down to the
    // courtyard — that overhang is what breaks the concentric-drum reading
    const wing = (a, len, wid, hgt, apse) => {
      const c = Math.cos(a), s0 = Math.sin(a);
      const P = (rad, tan, y) => [c * rad - s0 * tan, y, s0 * rad + c * tan];
      // the inner end starts at 44 so most of the wing clears the drum's 52 m
      // rim — buried inside it, a projecting wing projects nothing
      const mid = 44 + len / 2;
      let p = P(mid, 0, 0);
      put(new THREE.Mesh(new THREE.BoxGeometry(len, hgt, wid), stonePale),
        p[0], WARD + hgt / 2, p[2], -a);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(wid * 0.78, hgt * 0.52, 4),
        roofMat);
      roof.scale.set(len / wid * 0.92, 1, 1);
      put(roof, p[0], WARD + hgt + hgt * 0.2, p[2], -a + Math.PI / 4);
      put(new THREE.Mesh(new THREE.BoxGeometry(len + 1.5, 0.8, wid + 1.5), trimMat),
        p[0], WARD + hgt + 0.4, p[2], -a);
      for (const sd of [-1, 1]) {                // aisle bays: window + buttress
        for (let k = -1; k <= 1; k++) {
          const wp = P(mid + k * len * 0.28, sd * (wid / 2 + 0.2), 0);
          window(wp[0], WARD + hgt * 0.55, wp[2], a + (sd > 0 ? 0 : Math.PI),
            wid * 0.14, hgt * 0.5);
          const bp = P(mid + k * len * 0.28 + len * 0.14, sd * (wid / 2 + 1.5), 0);
          put(new THREE.Mesh(new THREE.BoxGeometry(2.8, hgt * 0.9, 3.6), stonePale),
            bp[0], WARD + hgt * 0.45, bp[2], -a);
        }
      }
      for (const sd of [-1, 1]) {                // piers carrying the overhang
        for (const rd of [mid + len * 0.18, mid + len * 0.44]) {
          const pp = P(rd, sd * (wid / 2 - 1.5), 0);
          put(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.6, WARD - 16, 6),
            stonePale), pp[0], 16 + (WARD - 16) / 2, pp[2], -a);
        }
      }
      if (apse) {                                // rounded east end
        const pts = [];
        for (let k = 0; k <= 8; k++) {
          const t = k / 8;
          pts.push(new THREE.Vector2(wid / 2 * Math.sqrt(1 - t * t * 0.55) || 0.1,
            t * hgt));
        }
        p = P(mid + len / 2, 0, 0);
        put(new THREE.Mesh(new THREE.LatheGeometry(pts, 10), stonePale),
          p[0], WARD, p[2]);
      }
      p = P(44 + len + 2, 0, 0);                 // great window on the end wall
      window(p[0], WARD + hgt * 0.5, p[2], a + Math.PI / 2, wid * 0.3, hgt * 0.6);
    };
    wing(Math.PI, 40, 24, 25, false);            // the great hall, west
    wing(Math.PI * 1.5, 26, 17, 19, true);       // the chapel with its apse, south
    {                                            // the annex: a slim signal tower
      const a = 0, tx = Math.cos(a) * 36, tz = Math.sin(a) * 36;
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const r = 6.6 * (1 - 0.26 * t) * (1 + 0.05 * Math.sin(t * Math.PI * 4));
        pts.push(new THREE.Vector2(r, t * 58));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(pts, 10), stonePale), tx, WARD, tz);
      for (let k = 0; k < 4; k++) {
        window(tx + Math.cos(a + k * 1.6) * 6.4, WARD + 12 + k * 12,
          tz + Math.sin(a + k * 1.6) * 6.4, a + k * 1.6 + Math.PI / 2, 1.5, 3.4);
      }
      spireTop(tx, tz, 5.4, WARD + 58, 3, 1);
    }

    // -- L4 four flanking towers on the ward
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(a) * 40, z = Math.sin(a) * 40;
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const r = 11 * (1 - 0.38 * t) * (1 + 0.05 * Math.sin(t * Math.PI * 5));
        pts.push(new THREE.Vector2(r, t * 46));
      }
      put(new THREE.Mesh(new THREE.LatheGeometry(pts, 14), stonePale), x, WARD - 4, z);
      spireTop(x, z, 7.4, WARD + 42, i + 1);     // same head as the wall towers
      for (let w = 0; w < 3; w++) {
        const wa = a + w * 2.1;
        window(x + Math.cos(wa) * 9.6, WARD + 8 + w * 12, z + Math.sin(wa) * 9.6,
          wa + Math.PI / 2, 1.4, 3.0);
      }
      // -- L6 flying bridge from the keep to each tower, plus a thinner rib
      //    below it — one arc alone reads as a wire, a pair reads as structure
      const arc = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * 20, WARD + 40, Math.sin(a) * 20),
        new THREE.Vector3(Math.cos(a) * 30, WARD + 50, Math.sin(a) * 30),
        new THREE.Vector3(x, WARD + 34, z),
      ]);
      put(new THREE.Mesh(new THREE.TubeGeometry(arc, 20, 1.5, 5), stoneDark), 0, 0, 0);
      for (let k = 1; k < 10; k++) {             // balustrade, so it reads as a
        const p = arc.getPoint(k / 10);          // bridge and not as a cable
        put(new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.7), trimMat),
          p.x, p.y + 1.9, p.z, a);
      }
      const rib = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(a) * 17, WARD + 16, Math.sin(a) * 17),
        new THREE.Vector3(Math.cos(a) * 29, WARD + 34, Math.sin(a) * 29),
        new THREE.Vector3(x, WARD + 20, z),
      ]);
      put(new THREE.Mesh(new THREE.TubeGeometry(rib, 14, 0.85, 4), trimMat), 0, 0, 0);
    }

    // -- L5 the main vein: crystal grown straight through the masonry. This is
    //    what makes it a crystal capital and not a castle with crystals on it.
    //    (kept just clear of the keep's own crown — taller and the architecture
    //     disappears into a thicket and the capital stops reading as built)
    const VEIN = [                               // x, z, radius, height, tilt
      [0, 0, 6.0, 88, 0.00], [-19, 11, 4.2, 60, 0.13], [17, -13, 3.8, 54, -0.15],
      [9, 24, 3.2, 42, 0.18], [-25, -18, 3.6, 46, -0.12], [31, 8, 2.9, 36, 0.20],
      [-34, 21, 2.5, 31, -0.22],
    ];
    for (let i = 0; i < VEIN.length; i++) {
      const [vx, vz, vr, vh, tilt] = VEIN[i];
      const a = Math.atan2(vz, vx);
      const c = new THREE.Mesh(crystalGeometry(vr, vh, vh * 0.34, 9, 3), cryShaderMats[i % 4]);
      c.position.set(vx, WARD + 6, vz);
      c.rotation.set(Math.sin(a) * tilt, i * 1.3, -Math.cos(a) * tilt);
      palace.add(c);
      for (let k = 0; k < 3; k++) {              // satellites at its foot
        const ka = a + (k - 1) * 1.1 + rnd() * 0.5;
        const kd = vr * (2.2 + rnd() * 1.6);
        const kid = new THREE.Mesh(
          crystalGeometry(vr * 0.36, vh * (0.18 + rnd() * 0.2), vh * 0.1),
          cryShaderMats[(i + k) % 4]);
        kid.position.set(vx + Math.cos(ka) * kd, WARD + 5, vz + Math.sin(ka) * kd);
        kid.rotation.set(Math.cos(ka) * 0.4, ka, -Math.sin(ka) * 0.4);
        palace.add(kid);
      }
    }

    // -- L8 a ring of stones adrift over the keep (the tower has one too —
    //    the capital's is wider, slower, and made of broken crystal)
    const crownRing = new THREE.Group();
    crownRing.position.set(0, WARD + KEEP_H + 26, 0);
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * Math.PI * 2;
      const st = new THREE.Mesh(cragGeometry(2.0 + (i % 3) * 0.8, 0, 0.5), rock);
      st.position.set(Math.cos(a) * 34, Math.sin(i * 1.9) * 4, Math.sin(a) * 34);
      st.rotation.set(i, i * 2.1, 0);
      crownRing.add(st);
      if (i % 2 === 0) {
        const sh = new THREE.Mesh(crystalGeometry(1.1, 5, 2.4), cryShaderMats[i % 4]);
        sh.rotation.x = Math.PI;
        sh.position.set(Math.cos(a) * 34, Math.sin(i * 1.9) * 4 - 2, Math.sin(a) * 34);
        crownRing.add(sh);
      }
    }
    palace.add(crownRing);
    magicAnims.push((t, dt) => { crownRing.rotation.y -= dt * 0.11; });

    flushBatches();                              // ~950 parts → 10 draw calls
    palaceTopY = baseY + WARD + KEEP_H + 26;
    palaceGroundY = baseY;
  }

  // ---- the capital wakes --------------------------------------------------
  // Window fire on the facades, fly-lights orbiting, a beam answering the mage
  // tower, crystal roots in the ground around it. All of this used to wait on
  // a 50 MB download; it is just geometry now, so it is up on the first frame.
  {
    const groundY = palaceGroundY, topY = palaceTopY;
    const gate = palaceGate = [CX, CZ + 132];    // outside the curtain wall
    glowPath(MX, MZ, gate[0], gate[1], 3.2);     // walkway from the tower

    // -- window fire: the windows are ours now, so the sprites sit exactly on
    //    them instead of being guessed off a photoscan's vertices
    if (winPts.length) {
      const winFire = new THREE.Points(sparkGeometry(winPts),
        sparkMaterial(0xffd58a, 6.2));
      winFire.frustumCulled = false;
      magicGroup.add(winFire);
    }

    // -- fly-lights: sprites drifting along a closed spline around the capital
    const ctrl = [];
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      const r = 128 + Math.sin(i * 2.3) * 34;
      const x = CX + Math.cos(a) * r, z = CZ + Math.sin(a) * r;
      ctrl.push(new THREE.Vector3(x, gY(x, z) + 56 + Math.sin(i * 1.7) * 38, z));
    }
    const loop = new THREE.CatmullRomCurve3(ctrl, true, 'catmullrom', 0.4);
    const SAMP = 512;
    const path = loop.getSpacedPoints(SAMP - 1);
    const NFLY = 90;
    const fly = new THREE.Points(sparkGeometry(new Float32Array(NFLY * 3)),
      sparkMaterial(0xd8f0ff, 6.0));
    fly.frustumCulled = false;
    magicGroup.add(fly);
    const flyAttr = fly.geometry.attributes.position;
    const flySpeed = [];
    for (let i = 0; i < NFLY; i++) flySpeed.push(0.006 + rnd() * 0.010);
    magicAnims.push((t) => {
      for (let i = 0; i < NFLY; i++) {
        const u = (i / NFLY + t * flySpeed[i]) % 1;
        const f = u * SAMP;
        const i0 = Math.floor(f) % SAMP, i1 = (i0 + 1) % SAMP, k = f - Math.floor(f);
        const p0 = path[i0], p1 = path[i1];
        flyAttr.setXYZ(i, p0.x + (p1.x - p0.x) * k,
          p0.y + (p1.y - p0.y) * k + Math.sin(t * 1.3 + i) * 1.6,
          p0.z + (p1.z - p0.z) * k);
      }
      flyAttr.needsUpdate = true;
    });

    // -- energy beam: mage tower orb <-> the keep's crown, pulses along the arc
    const beamEnd = new THREE.Vector3(CX, topY - 20, CZ);
    const beamCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(MX, ORB_Y, MZ),
      new THREE.Vector3((MX + CX) / 2, (ORB_Y + beamEnd.y) / 2 + 34, (MZ + CZ) / 2),
      beamEnd,
    ]);
    const beam = new THREE.Mesh(
      new THREE.TubeGeometry(beamCurve, 72, 1.5, 6, false),
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color(0xbfe8ff) },
                    uTime: crystalTime, uDay: crystalDay },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uColor;
          uniform float uTime, uDay;
          varying vec2 vUv;
          void main() {
            float pulse = 0.0;
            for (int i = 0; i < 3; i++) {
              float ph = fract(uTime * 0.19 + float(i) * 0.3333);
              float d = abs(fract(vUv.x - ph + 0.5) - 0.5);
              pulse += exp(-d * d * 900.0);
            }
            float base = 0.16 + 0.08 * sin(vUv.x * 46.0 - uTime * 2.6);
            float a = (base + pulse) * (1.25 - uDay * 0.85);
            gl_FragColor = vec4(mix(uColor, vec3(1.0), min(pulse, 1.0) * 0.65),
                                clamp(a, 0.0, 1.0) * 0.6);
          }`,
      }));
    beam.frustumCulled = false;
    magicGroup.add(beam);

    // -- crystal roots: the garden's own crystals break out of the ground all
    //    round the walls, in clumps — evenly spaced shafts read as a fence
    {
      const SK = 96;
      const skirt = new THREE.InstancedMesh(crystalGeometry(1, 1, 0.5), cryInstMat, SK);
      skirt.name = 'magicSkirt';
      skirt.frustumCulled = false;
      const mm = new THREE.Matrix4(), mq = new THREE.Quaternion();
      const mv = new THREE.Vector3(), ms = new THREE.Vector3(), mc = new THREE.Color();
      const COL = [0x8fe8ff, 0xff9fe0, 0xbfa8ff, 0xffd98f];
      let n = 0;
      for (let c = 0; c < 14 && n < SK; c++) {
        const ca = c * 2.39996 + 0.7;
        const cr = 112 + rnd() * 66;
        const ccx = CX + Math.cos(ca) * cr, ccz = CZ + Math.sin(ca) * cr;
        if (Math.hypot(ccx - gate[0], ccz - gate[1]) < 34) continue;   // door stays clear
        const big = 1.2 + rnd() * 3.6;           // this outcrop's headline size
        const kids = 5 + Math.floor(rnd() * 6);
        for (let k = 0; k < kids && n < SK; k++) {
          const ka = rnd() * 6.283, kd = Math.pow(rnd(), 0.7) * 19;
          const x = ccx + Math.cos(ka) * kd, z = ccz + Math.sin(ka) * kd;
          // keep the whole approach corridor clear, not just a disc round the
          // gate — a clump centre 40 m away still throws a 15 m shaft into it
          if (Math.abs(x - CX) < 25 && z > CZ + 70 && z < CZ + 205) continue;
          const s = big * (k === 0 ? 1 : 0.25 + Math.pow(rnd(), 1.8) * 0.8);
          const lean = 0.10 + rnd() * 0.26;      // splayed away from the walls
          mq.setFromEuler(new THREE.Euler(Math.sin(ca) * lean, rnd() * 6.283,
            -Math.cos(ca) * lean));
          ms.set(s * 0.6, s * (1.7 + rnd() * 1.7), s * 0.6);
          mv.set(x, gY(x, z) - 0.9, z);
          mm.compose(mv, mq, ms);
          skirt.setMatrixAt(n, mm);
          skirt.setColorAt(n, mc.setHex(COL[(c + k) % 4]));
          n++;
        }
      }
      skirt.count = n;
      skirt.instanceMatrix.needsUpdate = true;
      if (skirt.instanceColor) skirt.instanceColor.needsUpdate = true;
      magicGroup.add(skirt);
    }

    const l = new THREE.PointLight(0xbfa8ff, 0, 800, 2);
    l.position.set(CX, groundY + 120, CZ);
    magicGroup.add(l);
    magicLights.push(l);
    for (const [c, dx, dz] of [[0x8fe8ff, -58, 74], [0xff9fe0, 58, 74]]) {
      const gl2 = new THREE.PointLight(c, 0, 300, 2);   // colour on the walls
      gl2.position.set(CX + dx, groundY + 26, CZ + dz);
      magicGroup.add(gl2);
      magicLights.push(gl2);
    }
  }

  // glowing mushrooms scattered between the crystals
  const capMats = [0xff9fe0, 0xbfa8ff, 0x8fe8ff].map((c) =>
    new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.7 }));
  const gillMats = [0xff9fe0, 0xbfa8ff, 0x8fe8ff].map((c) =>
    new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  const stemMat = new THREE.MeshLambertMaterial({ color: 0xd8cfc0 });
  for (let i = 0; i < 22; i++) {
    const a = i * 2.39996;                   // golden angle scatter
    const r = 18 + (i * 29 % 70);
    const mx2 = MX + Math.cos(a) * r, mz2 = MZ + Math.sin(a) * r;
    const my2 = gY(mx2, mz2);
    const hgt = 0.7 + (i % 4) * 0.35;
    const capR = 0.45 + (i % 3) * 0.2;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, hgt, 6), stemMat);
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
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.45, hgt, 9), stemMat);
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
      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.12), runeMat);
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

  // ---- portal event: walk through the sigil and the gate answers ----------
  const BURST_N = 260;
  const burstPts = new Float32Array(BURST_N * 3);
  const burstDir = new Float32Array(BURST_N * 3);
  for (let i = 0; i < BURST_N; i++) {
    const u = rnd() * Math.PI * 2, w = rnd();
    const rr = Math.sqrt(w) * 5.6;                    // spawn across the film
    burstPts.set([Math.cos(u) * rr, 7.2 + Math.sin(u) * rr, 0], i * 3);
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
    burstDir.set([Math.sin(ph) * Math.cos(th) * 0.55,
                  Math.abs(Math.cos(ph)) * 0.7 + 0.25,
                  Math.sin(ph) * Math.sin(th) * 1.6], i * 3);   // mostly forward
  }
  const burstMat = sparkMaterial(0xd8f4ff, 4.0,
    { burst: true, spread: 22, nightOnly: false });
  const burst = new THREE.Points(sparkGeometry(burstPts, burstDir), burstMat);
  burst.frustumCulled = false;
  burst.visible = false;
  gateG.add(burst);

  const shock = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(0xcfe8ff) }, uA: { value: 0 } },
      vertexShader: /* glsl */`
        varying vec3 vN, vW;
        void main() {
          vN = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vW = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor;
        uniform float uA;
        varying vec3 vN, vW;
        void main() {
          vec3 v = normalize(cameraPosition - vW);
          float f = pow(1.0 - abs(dot(normalize(vN), v)), 4.5);
          gl_FragColor = vec4(mix(uColor, vec3(1.0), f * 0.7), f * uA);
        }`,
    }));
  shock.position.set(0, 7.2, 0);
  shock.visible = false;
  gateG.add(shock);

  // camera-locked warp flash — no post-processing in the engine, so the
  // "space bends" beat is a chromatic ring card held in front of the eye
  // 1.15×0.68 at 0.4 m ≈ the 70° viewport: any bigger and only the flat centre
  // of the ring pattern is on screen, which reads as a plain colour wash
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.68),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uA: { value: 0 }, uT: { value: 0 } },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform float uA, uT;
        varying vec2 vUv;
        void main() {
          vec2 d = (vUv - 0.5) * vec2(1.5, 1.0);
          float r = length(d) * 2.0;
          float ring = sin(r * 30.0 - uT * 20.0);
          vec3 c = vec3(0.62 + 0.38 * ring,
                        0.74 + 0.26 * sin(r * 30.0 - uT * 20.0 + 0.9), 1.0);
          float m = exp(-r * r * 4.0) * uA * (0.2 + 0.8 * abs(ring));
          gl_FragColor = vec4(c, clamp(m, 0.0, 1.0));
        }`,
    }));
  flash.renderOrder = 999;
  flash.frustumCulled = false;
  flash.visible = false;
  magicGroup.add(flash);

  let portalT = -1000, sidePrev = 0, pathSurge = 0;
  const _fwd = new THREE.Vector3(), _lp = new THREE.Vector3();
  function firePortal(t) {
    portalT = t ?? crystalTime.value;
    burst.visible = true;
    burstMat.uniforms.uT0.value = portalT;
    shock.visible = true;
    flash.visible = true;
    pathSurge = 1;
    const wp = gateG.localToWorld(new THREE.Vector3(0, 7.2, 0));
    strike(wp.x, wp.y, wp.z, portalT);           // every crystal rings
    const gate = palaceGate;
    if (gate && ctx.player?.teleport) {          // real teleport, when offered
      ctx.player.teleport(gate[0], gate[1], Math.atan2(CX - gate[0], CZ - gate[1]));
    }
  }
  magicAnims.push((t, dt) => {
    sigil.rotation.z -= dt * 0.7;
    film.material.opacity = 0.22 + Math.sin(t * 1.6) * 0.12;
    runeMat.color.setRGB(0.75, 0.91, 1).multiplyScalar(
      0.6 + 0.4 * Math.sin(t * 2.2) + 2.2 * Math.max(0, 1 - (t - portalT)));
    // walkways surge toward the palace after a crossing
    if (pathSurge > 0) pathSurge = Math.max(0, pathSurge - dt * 0.55);
    pathMat.emissiveIntensity = 0.9 + 2.0 * pathSurge;

    const age = t - portalT;
    if (age < 5.2) {                             // event playback
      shock.scale.setScalar(1 + age * 46);
      shock.material.uniforms.uA.value = Math.max(0, 0.55 * (1 - age / 1.6));
      shock.visible = age < 1.6;
      const fa = Math.max(0, 1 - age / 0.9);
      flash.material.uniforms.uA.value = fa * fa;
      flash.material.uniforms.uT.value = age;
      flash.visible = age < 0.9;
      if (flash.visible && havePlayer()) {       // pin the card to the eye
        _fwd.set(0, 0, -1).applyQuaternion(camQuat);
        flash.position.copy(playerPos).addScaledVector(_fwd, 0.4);
        flash.quaternion.copy(camQuat);
      }
      burst.visible = true;
    } else if (shock.visible || flash.visible || burst.visible) {
      shock.visible = flash.visible = burst.visible = false;
    }

    // crossing test, in the gate's own frame: inside the sigil disc and the
    // sign of z flips = the player went through it
    if (!havePlayer()) return;
    _lp.copy(playerPos);
    gateG.worldToLocal(_lp);
    const rad = Math.hypot(_lp.x, _lp.y - 7.2);
    const near = rad < 8 && Math.abs(_lp.z) < 4;
    const side = _lp.z >= 0 ? 1 : -1;
    if (near && rad < 6 && sidePrev !== 0 && side !== sidePrev && t - portalT > 6) {
      firePortal(t);
    }
    sidePrev = near ? side : 0;
  });

  // luminous walkways: portal -> tower -> island anchors
  glowPath(px2, pz2, MX, MZ, 3.2);
  glowPath(MX, MZ, MX + 60, MZ + 46);
  glowPath(MX, MZ, MX - 40, MZ - 58);

  // ---- transition band: science half -> magic half ------------------------
  // the boundary used to be a hard edge. three layers of gradient now: a
  // ground halo ring, glowing moss patches, and crystal debris that thickens
  // as you walk in — all instanced, all night-ramped by the engine.
  const BX = MX - 10, BZ = MZ - 105;             // band centre (tower..palace)
  const R0 = 45, R1 = 300;
  const nearness = (x, z) => {                   // 1 in the core, 0 at the rim
    const d = Math.min(Math.hypot(x - MX, z - MZ), Math.hypot(x - CX, z - CZ));
    return Math.max(0, Math.min(1, 1 - (d - 35) / 235));
  };
  {                                              // ground halo — a full disc:
    // an annulus leaves a hard-edged hole over the core (measured, 08-13), so
    // the falloff comes from `nearness` (distance to tower *or* palace), which
    // also gives the halo the peanut shape the two anchors deserve.
    const NA = 64, NR = 8;
    const pos = [], col = [], idx = [];
    const tint = new THREE.Color(0xa98fff);
    for (let ri = 0; ri <= NR; ri++) {
      const u = ri / NR;
      const r = R1 * Math.pow(u, 1.4);            // denser rings inside
      for (let ai = 0; ai <= NA; ai++) {
        const a = ai / NA * Math.PI * 2;
        const x = BX + Math.cos(a) * r, z = BZ + Math.sin(a) * r;
        pos.push(x, gY(x, z) + 0.35, z);
        const blotch = 0.65 + 0.35 * Math.sin(a * 5 + r * 0.06)
                            * Math.sin(a * 3.1 - r * 0.031);
        const w = Math.pow(nearness(x, z), 1.3) * blotch * 0.36;
        col.push(tint.r * w, tint.g * w, tint.b * w);
      }
    }
    for (let ri = 0; ri < NR; ri++) {
      for (let ai = 0; ai < NA; ai++) {
        const a0 = ri * (NA + 1) + ai, a1 = a0 + 1;
        const b0 = a0 + NA + 1, b1 = b0 + 1;
        idx.push(a0, b0, a1, a1, b0, b1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    g.setIndex(idx);
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true,
      opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false,
      side: THREE.DoubleSide });
    const halo = new THREE.Mesh(g, m);
    halo.name = 'magicHalo';
    magicGroup.add(halo);
    cryGlowMats.push(m);
  }
  // violet mist standing on the band's rim. A dome would be the obvious move,
  // but its open bottom clips against the terrain and leaves a hard elliptical
  // seam on the ground (measured, 08-13) — a curtain has no such rim: seen from
  // the science city it is a glow around the magic half, seen from inside it is
  // the far wall of the world.
  for (const [rad, hgt, amp] of [[R1, 42, 0.21]]) {   // one curtain: two read as rings
    const g = new THREE.CylinderGeometry(rad, rad, hgt, 48, 4, true);
    const p = g.attributes.position;
    const col = new Float32Array(p.count * 3);
    const tint = new THREE.Color(0xb9a0ff);
    for (let i = 0; i < p.count; i++) {
      const u = (p.getY(i) / hgt) + 0.5;          // 0 at the base, 1 at the top
      const a = Math.atan2(p.getZ(i), p.getX(i));
      // zero at the base: a curtain that is brightest where it meets the
      // ground draws a hard seam along that intersection
      const w = Math.pow(u, 0.55) * Math.pow(1 - u, 2.0) * 2.6 * amp
              * (0.65 + 0.35 * Math.sin(a * 4 + rad * 0.05));
      col.set([tint.r * w, tint.g * w, tint.b * w], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mist = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    mist.name = 'magicMist';
    mist.position.set(BX, gY(BX, BZ) + hgt / 2 - 2, BZ);
    magicGroup.add(mist);
    cryGlowMats.push(mist.material);
  }
  {                                              // glowing moss patches
    const disc = new THREE.CircleGeometry(1, 14);
    disc.rotateX(-Math.PI / 2);
    const dp = disc.attributes.position;
    const dc = new Float32Array(dp.count * 3);
    for (let i = 0; i < dp.count; i++) {         // bright centre, rim to zero
      const v = i === 0 ? 1 : 0;
      dc.set([v, v, v], i * 3);
    }
    disc.setAttribute('color', new THREE.BufferAttribute(dc, 3));
    const mossMat = new THREE.MeshBasicMaterial({ vertexColors: true,
      transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending,
      depthWrite: false });
    const MOSS = 160;
    const moss = new THREE.InstancedMesh(disc, mossMat, MOSS);
    moss.name = 'magicMoss';
    moss.frustumCulled = false;
    const mm = new THREE.Matrix4(), mc = new THREE.Color();
    const MOSS_COL = [0x7fffd4, 0xbfa8ff, 0xff9fe0];   // mushroom palette, not ice
    let placed = 0;
    for (let i = 0; placed < MOSS && i < MOSS * 12; i++) {
      const a = i * 2.39996;
      const r = R0 * 0.6 + Math.sqrt((i % 137) / 137) * (R1 - R0 * 0.6);
      const x = BX + Math.cos(a) * r, z = BZ + Math.sin(a) * r;
      const w = nearness(x, z);
      if (rnd() > 0.15 + w * 0.85) continue;
      const s = 1.4 + w * 3.4 + rnd() * 1.8;
      mm.makeScale(s, 1, s);
      mm.setPosition(x, gY(x, z) + 0.12, z);
      moss.setMatrixAt(placed, mm);
      moss.setColorAt(placed, mc.setHex(MOSS_COL[(i * 7) % 3])
        .multiplyScalar(0.11 + w * 0.30));
      placed++;
    }
    moss.count = placed;
    moss.instanceMatrix.needsUpdate = true;
    if (moss.instanceColor) moss.instanceColor.needsUpdate = true;
    magicGroup.add(moss);
    cryGlowMats.push(mossMat);
  }
  {                                              // crystal debris, thickening in
    const DEB = 240;
    const deb = new THREE.InstancedMesh(crystalGeometry(1, 1, 0.45), cryInstMat, DEB);
    deb.name = 'magicDebris';
    deb.frustumCulled = false;
    const mm = new THREE.Matrix4(), mq = new THREE.Quaternion();
    const mv = new THREE.Vector3(), ms = new THREE.Vector3(), mc = new THREE.Color();
    const DEB_COL = [0x8fe8ff, 0xff9fe0, 0xbfa8ff, 0xffd98f];
    let placed = 0;
    for (let i = 0; placed < DEB && i < DEB * 14; i++) {
      const a = i * 2.39996 + 1.1;
      const r = R0 * 0.75 + Math.sqrt((i % 211) / 211) * (R1 - R0 * 0.75);
      const x = BX + Math.cos(a) * r, z = BZ + Math.sin(a) * r;
      const w = nearness(x, z);
      if (rnd() > 0.08 + w * 0.92) continue;
      const s = 0.18 + w * 0.55 + rnd() * 0.3;
      mq.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.7, rnd() * 6.28,
        (rnd() - 0.5) * 0.7));
      ms.set(s, s * (0.8 + rnd() * 1.4), s);
      mv.set(x, gY(x, z) - 0.15, z);
      mm.compose(mv, mq, ms);
      deb.setMatrixAt(placed, mm);
      deb.setColorAt(placed, mc.setHex(DEB_COL[(i * 5) % 4]));
      placed++;
    }
    deb.count = placed;
    deb.instanceMatrix.needsUpdate = true;
    if (deb.instanceColor) deb.instanceColor.needsUpdate = true;
    magicGroup.add(deb);
  }

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

  // ---- layer API ----------------------------------------------------------
  // ?debug=1 → __mars.scene.getObjectByName('magicCity').userData.magic
  // 总控待办:传送门真传送需要引擎在 ctx 里给 player(§4c sensors 的同类通道):
  //   ctx.player = { position: THREE.Vector3,          // 只读,世界坐标
  //                  teleport(x, z, yaw) }             // 落点由引擎贴地
  // 有 teleport 时下面 firePortal 自动把玩家送到王城门口(palaceGate),
  // 没有时降级为"只做戏不搬人",本模块两条路径都已跑通。
  magicGroup.userData.magic = {
    firePortal: () => firePortal(crystalTime.value),
    strike,
    get lastPortal() { return portalT; },        // t of the last crossing
    get playerAt() { return havePlayer() ? playerPos.toArray() : null; },
    get palaceGate() { return palaceGate; },     // teleport target at the door
    gate: [px2, pz2],
    tower: [MX, MZ],
  };
}
