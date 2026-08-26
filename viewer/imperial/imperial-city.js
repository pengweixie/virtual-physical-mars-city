// viewer/imperial/imperial-city.js
// Tian Gong City / The Celestial Palace — Mars viewer third-layer module.
//
// Contract (MODELS.md section 4a precedent):
//   build(ctx), ctx = {
//     THREE, group, anims, lights, sampleHeight, renderer, T, sunDirUniform
//   }
// All geometry is parented to ctx.group. The module creates no terrain and no
// ambient/directional light. One unit equals one metre. The ceremonial axis
// runs due north; in this module -Z is north and +Z is the southern entrance.

export const meta = {
  id: 'imperial-city',
  name: '天宫城',
  name_en: 'The Celestial Palace',
  kind: 'layer',
};

export function build(ctx) {
  const {
    THREE,
    group,
    anims,
    lights,
    sampleHeight,
    renderer,
    T,
    sunDirUniform,
  } = ctx;

  void renderer;
  void T;
  void sunDirUniform;

  group.name = 'imperialCity';
  group.userData.name = '天宫城';
  group.userData.name_en = 'The Celestial Palace';
  group.userData.nightMats = [];

  const NORTH = new THREE.Vector3(0, 0, -1);
  const SITE_X = 0;
  const SITE_Z = 0;
  const TERRAIN_Y = sampleHeight(SITE_X, SITE_Z);

  // Small procedural tile atlas: clean repeated ribs and courses, with no
  // external texture dependency or stochastic noise. Roof UVs below are in
  // metre-based units so the tile rhythm stays consistent across hall sizes.
  const tileTexSize = 32;
  const tilePixels = new Uint8Array(tileTexSize * tileTexSize * 4);
  for (let py = 0; py < tileTexSize; py++) {
    for (let px = 0; px < tileTexSize; px++) {
      const index = (py * tileTexSize + px) * 4;
      const rib = px <= 2 || px >= tileTexSize - 2;
      const course = py <= 1 || py >= tileTexSize - 1;
      const highlight = px >= 5 && px <= 8;
      const value = rib ? 184 : highlight ? 255 : course ? 214 : 238;
      tilePixels[index] = value;
      tilePixels[index + 1] = value;
      tilePixels[index + 2] = value;
      tilePixels[index + 3] = 255;
    }
  }
  const roofTileTexture = new THREE.DataTexture(
    tilePixels,
    tileTexSize,
    tileTexSize,
    THREE.RGBAFormat,
  );
  roofTileTexture.wrapS = THREE.RepeatWrapping;
  roofTileTexture.wrapT = THREE.RepeatWrapping;
  roofTileTexture.magFilter = THREE.LinearFilter;
  roofTileTexture.minFilter = THREE.LinearMipmapLinearFilter;
  roofTileTexture.colorSpace = THREE.SRGBColorSpace;
  roofTileTexture.needsUpdate = true;

  // Deterministic stream. Later stages use the same stream for tree placement
  // and light variation, so repeated screenshots remain comparable.
  const rnd = (() => {
    let state = 0x7469616e;
    return () => {
      state = state + 0x6d2b79f5 | 0;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  })();
  void rnd;

  // -------------------------------------------------------------------------
  // Palette: all daylight response comes from the viewer's sun/hemi setup.
  const mats = {
    rammedRed: new THREE.MeshStandardMaterial({
      color: 0x8f2f22,
      roughness: 0.85,
      metalness: 0.02,
      flatShading: false,
    }),
    redShadow: new THREE.MeshLambertMaterial({
      color: 0x6b2319,
    }),
    marble: new THREE.MeshStandardMaterial({
      color: 0xe8e2d6,
      roughness: 0.7,
      metalness: 0.0,
    }),
    marbleShade: new THREE.MeshLambertMaterial({
      color: 0xd9d4ca,
    }),
    stairShade: new THREE.MeshStandardMaterial({
      color: 0xcfc7b8,
      roughness: 0.74,
      metalness: 0.0,
    }),
    yellowTile: new THREE.MeshStandardMaterial({
      color: 0xd9a72e,
      roughness: 0.35,
      metalness: 0.06,
    }),
    vermilion: new THREE.MeshStandardMaterial({
      color: 0x8f2f22,
      roughness: 0.85,
      metalness: 0.02,
    }),
    lacquerDark: new THREE.MeshLambertMaterial({
      color: 0x241c19,
    }),
    towerVoid: new THREE.MeshLambertMaterial({
      color: 0x120d0b,
      side: THREE.DoubleSide,
    }),
    timber: new THREE.MeshStandardMaterial({
      color: 0x533027,
      roughness: 0.82,
      metalness: 0.0,
    }),
    roofGold: new THREE.MeshStandardMaterial({
      color: 0xd9a72e,
      map: roofTileTexture,
      roughness: 0.35,
      metalness: 0.08,
      side: THREE.DoubleSide,
    }),
    roofUnder: new THREE.MeshLambertMaterial({
      color: 0x31251f,
      side: THREE.DoubleSide,
    }),
    dougong: new THREE.MeshLambertMaterial({
      color: 0x3a2a1e,
    }),
    dripTile: new THREE.MeshStandardMaterial({
      color: 0xb77f22,
      roughness: 0.42,
      metalness: 0.04,
    }),
    bronze: new THREE.MeshStandardMaterial({
      color: 0x4f5a43,
      roughness: 0.62,
      metalness: 0.72,
    }),
    water: new THREE.MeshStandardMaterial({
      color: 0x244f5d,
      roughness: 0.15,
      metalness: 0.28,
      envMapIntensity: 1.25,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    waterReflection: new THREE.MeshStandardMaterial({
      color: 0xd9a72e,
      emissive: 0x4a2d08,
      emissiveIntensity: 0.34,
      roughness: 0.15,
      metalness: 0.18,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    archVoid: new THREE.MeshLambertMaterial({
      color: 0x18343b,
      side: THREE.DoubleSide,
    }),
    pineVertex: new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
      side: THREE.DoubleSide,
    }),
    earth: new THREE.MeshLambertMaterial({
      color: 0x8b6e4a,
    }),
    gardenBed: new THREE.MeshLambertMaterial({
      color: 0x29412f,
    }),
    tealTrim: new THREE.MeshStandardMaterial({
      color: 0x2f665a,
      roughness: 0.66,
      metalness: 0.04,
    }),
    roofRib: new THREE.MeshStandardMaterial({
      color: 0xefc34a,
      roughness: 0.3,
      metalness: 0.06,
      side: THREE.DoubleSide,
    }),
    pavingLine: new THREE.MeshLambertMaterial({
      color: 0xa99f91,
    }),
    roadDark: new THREE.MeshStandardMaterial({
      color: 0x544b43,
      roughness: 0.82,
      metalness: 0.0,
    }),
    railPost: new THREE.MeshLambertMaterial({
      color: 0xe8e2d6,
      side: THREE.DoubleSide,
    }),
  };

  // -------------------------------------------------------------------------
  // Shared primitive batching. Stage 1 is almost entirely boxes. Keeping them
  // in per-material InstancedMesh batches gives one draw call per material,
  // even after later stages add hundreds of rail posts, walls and stair blocks.
  const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
  // Column ends are always buried in podiums/beams, so open caps halve their
  // triangle cost without changing any visible surface.
  const UNIT_COLUMN = new THREE.CylinderGeometry(0.5, 0.56, 1, 8, 1, true);
  const boxBatches = new Map();
  const columnBatches = new Map();
  const matrixObject = new THREE.Object3D();

  function batchKey(material) {
    return material.uuid;
  }

  function box(material, x, y, z, sx, sy, sz, ry = 0, name = '') {
    const key = batchKey(material);
    if (!boxBatches.has(key)) {
      boxBatches.set(key, { material, entries: [] });
    }
    boxBatches.get(key).entries.push({
      x,
      y,
      z,
      sx,
      sy,
      sz,
      ry,
      name,
    });
  }

  function flushBoxes() {
    for (const { material, entries } of boxBatches.values()) {
      const mesh = new THREE.InstancedMesh(
        UNIT_BOX,
        material,
        entries.length,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = true;
      mesh.name = `imperial-boxes-${material.uuid.slice(0, 8)}`;
      entries.forEach((e, index) => {
        matrixObject.position.set(e.x, e.y, e.z);
        matrixObject.rotation.set(0, e.ry, 0);
        matrixObject.scale.set(e.sx, e.sy, e.sz);
        matrixObject.updateMatrix();
        mesh.setMatrixAt(index, matrixObject.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }
    boxBatches.clear();
  }

  function column(material, x, y, z, radius, height, name = '') {
    const key = batchKey(material);
    if (!columnBatches.has(key)) {
      columnBatches.set(key, { material, entries: [] });
    }
    columnBatches.get(key).entries.push({
      x,
      y,
      z,
      radius,
      height,
      name,
    });
  }

  function flushColumns() {
    for (const { material, entries } of columnBatches.values()) {
      const mesh = new THREE.InstancedMesh(
        UNIT_COLUMN,
        material,
        entries.length,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `imperial-columns-${material.uuid.slice(0, 8)}`;
      entries.forEach((entry, index) => {
        matrixObject.position.set(entry.x, entry.y, entry.z);
        matrixObject.rotation.set(0, 0, 0);
        matrixObject.scale.set(
          entry.radius * 2,
          entry.height,
          entry.radius * 2,
        );
        matrixObject.updateMatrix();
        mesh.setMatrixAt(index, matrixObject.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }
    columnBatches.clear();
  }

  // A curved hipped roof expressed as four low-poly swept surfaces. The long
  // eaves use eight line segments, and the corner lift is a sixth-power curve:
  // broad and quiet through the centre, then visibly upturned at the wing tips.
  function hipRoofGeometry(width, depth, rise, cornerLift, segments = 8) {
    const positions = [];
    const uvs = [];
    const indices = [];
    const rows = 6;

    function vertex(x, y, z, u, v) {
      positions.push(x, y, z);
      uvs.push(u, v);
      return positions.length / 3 - 1;
    }

    function addLongSide(sign) {
      const grid = [];
      for (let row = 0; row <= rows; row++) {
        const t = row / rows;
        const strip = [];
        for (let i = 0; i <= segments; i++) {
          const u = i / segments;
          const x0 = (u - 0.5) * width;
          const ridgeHalf = width * 0.24;
          const x1 = THREE.MathUtils.clamp(x0, -ridgeHalf, ridgeHalf);
          const x = THREE.MathUtils.lerp(x0, x1, t);
          const z = sign * depth * 0.5 * (1 - t);
          const edge = Math.pow(Math.abs(x0) / (width * 0.5), 6);
          const concave = 0.16 * t + 0.84 * Math.pow(t, 1.65);
          const y = rise * concave
            + cornerLift * edge * Math.pow(1 - t, 2);
          strip.push(vertex(x, y, z, (x + width * 0.5) / 7.5, t * 3.0));
        }
        grid.push(strip);
      }
      for (let row = 0; row < rows; row++) {
        for (let i = 0; i < segments; i++) {
          const a = grid[row][i];
          const b = grid[row][i + 1];
          const c = grid[row + 1][i];
          const d = grid[row + 1][i + 1];
          if (sign > 0) indices.push(a, b, c, b, d, c);
          else indices.push(a, c, b, b, c, d);
        }
      }
    }

    function addEnd(sign) {
      const endSegments = 6;
      const grid = [];
      for (let row = 0; row <= rows; row++) {
        const t = row / rows;
        const strip = [];
        for (let i = 0; i <= endSegments; i++) {
          const u = i / endSegments;
          const z0 = (u - 0.5) * depth;
          const x = sign * width * (0.5 - 0.26 * t);
          const z = THREE.MathUtils.lerp(z0, 0, t);
          const edge = Math.pow(Math.abs(z0) / (depth * 0.5), 6);
          const concave = 0.16 * t + 0.84 * Math.pow(t, 1.65);
          const y = rise * concave
            + cornerLift * edge * Math.pow(1 - t, 2);
          strip.push(vertex(x, y, z, (z + depth * 0.5) / 7.5, t * 3.0));
        }
        grid.push(strip);
      }
      for (let row = 0; row < rows; row++) {
        for (let i = 0; i < endSegments; i++) {
          const a = grid[row][i];
          const b = grid[row][i + 1];
          const c = grid[row + 1][i];
          const d = grid[row + 1][i + 1];
          if (sign > 0) indices.push(a, c, b, b, c, d);
          else indices.push(a, b, c, b, d, c);
        }
      }
    }

    addLongSide(1);
    addLongSide(-1);
    addEnd(1);
    addEnd(-1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(uvs, 2),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function roofMesh({
    x,
    y,
    z,
    w,
    d,
    rise,
    cornerLift,
    segments = 8,
    rotationY = 0,
    name,
  }) {
    const geometry = hipRoofGeometry(w, d, rise, cornerLift, segments);
    const roof = new THREE.Mesh(geometry, mats.roofGold);
    roof.position.set(x, y, z);
    roof.rotation.y = rotationY;
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.name = name;
    group.add(roof);
    return roof;
  }

  function octagonalRoofMesh({ x, y, z, radius, rise, rotationY = 0, name }) {
    const geometry = new THREE.ConeGeometry(radius, rise, 8, 2, true);
    geometry.translate(0, rise * 0.5, 0);
    const roof = new THREE.Mesh(geometry, mats.roofGold);
    roof.position.set(x, y, z);
    roof.rotation.y = rotationY + Math.PI * 0.125;
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.name = name;
    group.add(roof);
    return roof;
  }

  // R5 tower openings and instruments are collected by hall() and flushed as
  // shared instance batches after all five tower families are assembled.
  const towerArchEntries = [];
  const towerInstrumentEntries = [];
  const instancedHallRoofEntries = [];

  // R4 roof relief: a single instanced ribbon geometry supplies the raised
  // glazed-tile ribs that the reference reads as fine parallel highlights.
  // Only detailed halls receive them, so the city gains close-view scale cues
  // without modelling individual tiles or adding one draw call per roof.
  const roofRibEntries = [];
  const roofRibPositions = [];
  const roofRibIndices = [];
  const roofRibRows = 6;
  for (let row = 0; row <= roofRibRows; row++) {
    const t = row / roofRibRows;
    const y = 0.16 * t + 0.84 * Math.pow(t, 1.65);
    const z = 1 - t;
    roofRibPositions.push(-0.5, y, z, 0.5, y, z);
    if (row < roofRibRows) {
      const a = row * 2;
      roofRibIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const UNIT_ROOF_RIB = new THREE.BufferGeometry();
  UNIT_ROOF_RIB.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(roofRibPositions, 3),
  );
  UNIT_ROOF_RIB.setIndex(roofRibIndices);
  UNIT_ROOF_RIB.computeVertexNormals();

  function addRoofRibs({ x, y, z, w, d, rise, rotationY = 0, count = 10 }) {
    const c = Math.cos(rotationY);
    const s = Math.sin(rotationY);
    const ridgeHalf = w * 0.22;
    for (let rib = 0; rib < count; rib++) {
      const localX = count === 1
        ? 0
        : THREE.MathUtils.lerp(-ridgeHalf, ridgeHalf, rib / (count - 1));
      const px = x + localX * c;
      const pz = z - localX * s;
      for (const side of [-1, 1]) {
        roofRibEntries.push({
          x: px,
          y: y + 0.1,
          z: pz,
          rotationY,
          width: 0.22,
          rise: rise + 0.08,
          depth: side * d * 0.5,
        });
      }
    }
  }

  function flushRoofRibs() {
    if (!roofRibEntries.length) return;
    const mesh = new THREE.InstancedMesh(
      UNIT_ROOF_RIB,
      mats.roofRib,
      roofRibEntries.length,
    );
    mesh.name = 'imperial-instanced-glazed-roof-ribs';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    roofRibEntries.forEach((entry, index) => {
      matrixObject.position.set(entry.x, entry.y, entry.z);
      matrixObject.rotation.set(0, entry.rotationY, 0);
      matrixObject.scale.set(entry.width, entry.rise, entry.depth);
      matrixObject.updateMatrix();
      mesh.setMatrixAt(index, matrixObject.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  function perimeterPosts({ x, y, z, w, d, rotationY = 0, spacing = 8 }) {
    const countX = Math.max(2, Math.round(w / spacing));
    const countZ = Math.max(2, Math.round(d / spacing));
    const c = Math.cos(rotationY);
    const s = Math.sin(rotationY);
    const world = (lx, lz) => ({
      x: x + lx * c + lz * s,
      z: z - lx * s + lz * c,
    });
    const seen = new Set();
    const add = (lx, lz) => {
      const key = `${lx.toFixed(2)}:${lz.toFixed(2)}`;
      if (seen.has(key)) return;
      seen.add(key);
      const p = world(lx, lz);
      box(mats.marble, p.x, y + 0.8, p.z, 0.52, 1.6, 0.52, rotationY);
    };
    for (let i = 0; i <= countX; i++) {
      const lx = -w * 0.5 + w * i / countX;
      add(lx, -d * 0.5);
      add(lx, d * 0.5);
    }
    for (let i = 0; i <= countZ; i++) {
      const lz = -d * 0.5 + d * i / countZ;
      add(-w * 0.5, lz);
      add(w * 0.5, lz);
    }
    box(mats.marble, x, y + 1.55, z - d * 0.5, w, 0.22, 0.24, rotationY);
    box(mats.marble, x, y + 1.55, z + d * 0.5, w, 0.22, 0.24, rotationY);
    box(mats.marble, x - w * 0.5, y + 1.55, z, 0.24, 0.22, d, rotationY);
    box(mats.marble, x + w * 0.5, y + 1.55, z, 0.24, 0.22, d, rotationY);
    // Low solid rails turn the post-and-cap outline into a legible white-stone
    // balustrade, especially on the enlarged multi-course gate podiums.
    box(mats.marbleShade, x, y + 0.56, z - d * 0.5, w, 0.52, 0.2, rotationY);
    box(mats.marbleShade, x, y + 0.56, z + d * 0.5, w, 0.52, 0.2, rotationY);
    box(mats.marbleShade, x - w * 0.5, y + 0.56, z, 0.2, 0.52, d, rotationY);
    box(mats.marbleShade, x + w * 0.5, y + 0.56, z, 0.2, 0.52, d, rotationY);
  }

  // -------------------------------------------------------------------------
  // Stage 2 core — every gate tower, corner tower, gallery and great hall is a
  // specialization of this one generator. The public acceptance signature is
  // preserved at the front of the options object: hall({bays,eaves,podium,w,d}).
  function hall({
    bays = 7,
    eaves = 1,
    podium = 1,
    w = 72,
    d = 34,
    x = 0,
    y = TERRAIN_Y,
    z = 0,
    rotationY = 0,
    name = 'imperial-hall',
    wallColor = mats.vermilion,
    heightScale = 1,
    buildingType = 'hall',
    roofSegments = 8,
    roofPitch = 0.255,
    cornerScale = 0.07,
    stackCompression = 1,
    facadeDetail = null,
    ornaments = false,
    gateOpening = 0,
    stairEnabled = true,
    podiumRail = true,
    pierHeight = 0,
    pierTaper = 0.12,
    crossRidge = false,
    roofStyle = 'hip',
    finial = false,
    archTopStory = false,
    instrument = null,
    nightOutline = false,
    nightWindows = false,
    instanceRoof = false,
    podiumCourseHeight = 1.68,
    podiumRailSpacing = null,
    stairRails = false,
    stairRiserTarget = null,
    stairTread = null,
    stairFrontOffset = 5.2,
  }) {
    const podiumLayers = THREE.MathUtils.clamp(Math.round(podium), 1, 3);
    const eaveCount = THREE.MathUtils.clamp(Math.round(eaves), 1, 3);
    const baseStepH = podiumCourseHeight;
    const railInset = 3.2;
    let cursorY = y;
    const c = Math.cos(rotationY);
    const s = Math.sin(rotationY);
    const worldPoint = (lx, lz) => ({
      x: x + lx * c + lz * s,
      z: z - lx * s + lz * c,
    });

    // 1–3 marble platform courses. Each upper course is slightly smaller, as
    // in the reference's white-stone stair arrays.
    for (let layerIndex = 0; layerIndex < podiumLayers; layerIndex++) {
      const inset = layerIndex * 2.6;
      const layerW = w + 18 - inset * 2;
      const layerD = d + 16 - inset * 2;
      box(
        mats.marble,
        x,
        cursorY + baseStepH * 0.5,
        z,
        layerW,
        baseStepH,
        layerD,
        rotationY,
        `${name}-podium-${layerIndex + 1}`,
      );
      cursorY += baseStepH;
      if (podiumRail) {
        perimeterPosts({
          x,
          y: cursorY,
          z,
          w: layerW - railInset * 2,
          d: layerD - railInset * 2,
          rotationY,
          spacing: podiumRailSpacing ?? Math.max(7, layerW / (bays * 2)),
        });
      }
    }

    // Broad central stair on the south/front side. It does not cross the city
    // axis; it is the final climb onto the hall's own podium.
    const podiumRise = cursorY - y;
    const stairCount = stairRiserTarget
      ? Math.max(4, Math.ceil(podiumRise / stairRiserTarget))
      : 7 * podiumLayers;
    const stairDepth = stairTread
      ?? (d * 0.28 + podiumLayers * 2.5) / stairCount;
    const stairWidth = buildingType === 'summitHall'
      ? Math.min(w * 0.5, 96)
      : Math.min(w * 0.34, 38);
    if (stairEnabled) {
      const totalPodiumH = cursorY - y;
      const singleStepH = totalPodiumH / stairCount;
      for (let i = 0; i < stairCount; i++) {
        const k = (i + 1) / stairCount;
        const stairZ = z + d * 0.5 + stairFrontOffset - i * stairDepth;
        box(
          mats.marble,
          x,
          y + totalPodiumH * k - singleStepH * 0.5,
          stairZ,
          stairWidth,
          Math.max(0.28, singleStepH),
          stairDepth + 0.35,
          rotationY,
        );
        if (stairRails) {
          for (const side of [-1, 1]) {
            const rail = worldPoint(side * (stairWidth * 0.5 + 1.15), stairZ - z);
            box(
              mats.marble,
              rail.x,
              y + totalPodiumH * k + 0.48,
              rail.z,
              0.28,
              0.96,
              stairDepth + 0.3,
              rotationY,
            );
          }
        }
      }
    }

    // R4.1 raises the timber frame by ten percent. Roof width is unchanged, so
    // the halls gain the taller, more ceremonial column proportion requested
    // without becoming broader or encroaching on the clear centre axis.
    const bodyH = Math.max(8.5, d * 0.34) * heightScale * 1.1;
    const bodyW = w * 0.78;
    const bodyD = d * 0.67;
    if (pierHeight > 0) {
      const pierLevels = 3;
      for (let level = 0; level < pierLevels; level++) {
        const levelH = pierHeight / pierLevels;
        const shrink = 1 - pierTaper * level / Math.max(1, pierLevels - 1);
        box(
          wallColor,
          x,
          cursorY + levelH * (level + 0.5),
          z,
          bodyW * 1.04 * shrink,
          levelH + 0.08,
          bodyD * 1.06 * shrink,
          rotationY,
          `${name}-tapered-pier-${level + 1}`,
        );
      }
      box(
        mats.redShadow,
        x,
        cursorY + pierHeight * 0.09,
        z,
        bodyW * 1.05,
        pierHeight * 0.18,
        bodyD * 1.07,
        rotationY,
      );
      cursorY += pierHeight;
    }
    const bodyBase = cursorY + 0.35;

    // Red inner wall core with a 15%-high false-AO base course. Gate towers
    // split this core into two jambs plus a lintel, leaving a real 6 m void.
    const coreW = bodyW * 0.9;
    const coreH = bodyH * 0.82;
    const coreD = bodyD * 0.88;
    const coreBottomY = bodyBase + bodyH * 0.05;
    function wallSection(lx, sectionW, sectionH, bottomY, sectionName) {
      const point = worldPoint(lx, 0);
      const shadowH = sectionH * 0.15;
      box(
        mats.redShadow,
        point.x,
        bottomY + shadowH * 0.5,
        point.z,
        sectionW,
        shadowH,
        coreD + 0.06,
        rotationY,
        `${sectionName}-ao`,
      );
      box(
        wallColor,
        point.x,
        bottomY + shadowH + (sectionH - shadowH) * 0.5,
        point.z,
        sectionW,
        sectionH - shadowH,
        coreD,
        rotationY,
        sectionName,
      );
    }
    if (gateOpening > 0) {
      const openingW = Math.min(gateOpening, coreW * 0.28);
      const jambW = (coreW - openingW) * 0.5;
      const jambOffset = openingW * 0.5 + jambW * 0.5;
      wallSection(-jambOffset, jambW, coreH, coreBottomY, `${name}-west-jamb`);
      wallSection(jambOffset, jambW, coreH, coreBottomY, `${name}-east-jamb`);
      const openingH = bodyH * 0.58;
      wallSection(
        0,
        openingW,
        coreH - openingH,
        coreBottomY + openingH,
        `${name}-gate-lintel`,
      );
    } else {
      wallSection(0, coreW, coreH, coreBottomY, `${name}-wall-core`);
    }

    const colR = THREE.MathUtils.clamp(w / bays * 0.085, 0.55, 1.35);
    const colH = bodyH;
    const front = worldPoint(0, bodyD * 0.5);
    const back = worldPoint(0, -bodyD * 0.5);
    for (let bay = 0; bay <= bays; bay++) {
      const lx = -bodyW * 0.5 + bodyW * bay / bays;
      for (const localZ of [bodyD * 0.5, -bodyD * 0.5]) {
        const point = worldPoint(lx, localZ);
        column(
          mats.vermilion,
          point.x,
          bodyBase + colH * 0.5,
          point.z,
          colR,
          colH,
          `${name}-column`,
        );
        if (localZ > 0) {
          column(
            mats.marbleShade,
            point.x,
            bodyBase + 0.27,
            point.z,
            colR * 1.38,
            0.54,
            `${name}-column-base`,
          );
        }
      }
    }
    const sideBays = Math.max(2, Math.round(bays * d / w));
    for (let sideBay = 1; sideBay < sideBays; sideBay++) {
      const localZ = -bodyD * 0.5 + bodyD * sideBay / sideBays;
      const c = Math.cos(rotationY);
      const s = Math.sin(rotationY);
      for (const lx of [-bodyW * 0.5, bodyW * 0.5]) {
        const point = worldPoint(lx, localZ);
        column(
          mats.vermilion,
          point.x,
          bodyBase + colH * 0.5,
          point.z,
          colR,
          colH,
          `${name}-side-column`,
        );
      }
    }

    // Horizontal timber beams and one compressed dark dougong belt. The belt
    // is deliberately a colour/relief strip, never individual bracket sets.
    box(
      mats.timber,
      front.x,
      bodyBase + bodyH * 0.82,
      front.z,
      bodyW + 2.5,
      0.72,
      0.72,
      rotationY,
    );
    box(
      mats.timber,
      back.x,
      bodyBase + bodyH * 0.82,
      back.z,
      bodyW + 2.5,
      0.72,
      0.72,
      rotationY,
    );

    // Recessed door and lattice-window rhythm. These are shallow colour planes
    // batched with the rest of the city, so close axial views gain depth while
    // the facade still costs only shared box draw calls.
    const showFacadeDetail = facadeDetail ?? (d >= 22 && heightScale >= 0.85);
    if (showFacadeDetail) {
      const bayW = bodyW / bays;
      for (let bay = 0; bay < bays; bay++) {
        const lx = -bodyW * 0.5 + bayW * (bay + 0.5);
        if (gateOpening > 0 && Math.abs(lx) < gateOpening * 0.5 + bayW * 0.4) continue;
        const panel = worldPoint(lx, bodyD * 0.5 + 0.08);
        box(
          mats.lacquerDark,
          panel.x,
          bodyBase + bodyH * 0.46,
          panel.z,
          bayW * 0.68,
          bodyH * 0.52,
          0.3,
          rotationY,
          `${name}-lattice-panel`,
        );
        const mullion = worldPoint(lx, bodyD * 0.5 + 0.28);
        box(
          mats.vermilion,
          mullion.x,
          bodyBase + bodyH * 0.46,
          mullion.z,
          0.22,
          bodyH * 0.56,
          0.24,
          rotationY,
        );
      }
      const sill = worldPoint(0, bodyD * 0.5 + 0.32);
      box(
        mats.tealTrim,
        sill.x,
        bodyBase + bodyH * 0.69,
        sill.z,
        bodyW + 1.6,
        0.42,
        0.36,
        rotationY,
      );
      // Continuous painted beam and a hairline gold separator reproduce the
      // blue-green/red/gold cadence visible beneath imperial eaves at range.
      for (const localZ of [bodyD * 0.5 + 0.34, -bodyD * 0.5 - 0.34]) {
        const band = worldPoint(0, localZ);
        box(
          mats.tealTrim,
          band.x,
          bodyBase + bodyH * 0.76,
          band.z,
          bodyW + 1.8,
          0.5,
          0.34,
          rotationY,
        );
        box(
          mats.yellowTile,
          band.x,
          bodyBase + bodyH * 0.72,
          band.z,
          bodyW + 1.2,
          0.12,
          0.38,
          rotationY,
        );
        for (let bracket = 0; bracket <= bays; bracket++) {
          const localX = -bodyW * 0.5 + bodyW * bracket / bays;
          const bracketPoint = worldPoint(localX, localZ);
          box(
            mats.tealTrim,
            bracketPoint.x,
            bodyBase + bodyH - 0.88,
            bracketPoint.z,
            Math.max(0.72, colR * 1.8),
            0.34,
            1.15,
            rotationY,
          );
          box(
            mats.dougong,
            bracketPoint.x,
            bodyBase + bodyH - 0.52,
            bracketPoint.z,
            Math.max(0.52, colR * 1.28),
            0.38,
            1.7,
            rotationY,
          );
        }
      }
    }
    box(
      mats.dougong,
      x,
      bodyBase + bodyH - 0.26,
      z,
      bodyW + 5.5,
      0.52,
      bodyD + 4.8,
      rotationY,
      `${name}-dougong-band`,
    );

    // One to three stacked hipped roofs. Upper stories contract so each eave
    // remains legible from the long axial camera.
    let roofY = bodyBase + bodyH;
    let highestRoofTop = roofY;
    let topStoryCenterY = bodyBase + bodyH * 0.5;
    let topStoryW = bodyW;
    let topStoryD = bodyD;
    let outlineRoofW = 0;
    let outlineRoofD = 0;
    let outlineY = roofY;
    for (let eave = 0; eave < eaveCount; eave++) {
      const shrink = 1 - eave * 0.15;
      const roofW = Math.max(w + 9, bodyW * 1.24) * shrink;
      const roofD = Math.max(d + 8, bodyD * 1.24) * shrink;
      const roofRise = Math.max(4.8, roofD * roofPitch);
      const cornerLift = Math.max(1.3, roofD * cornerScale);
      // A four-sided fascia replaces the former solid dark slab. The thinner
      // silhouette reads as a real projecting eave instead of stacked plates.
      for (const localZ of [-roofD * 0.5 + 0.42, roofD * 0.5 - 0.42]) {
        const edge = worldPoint(0, localZ);
        box(mats.roofUnder, edge.x, roofY - 0.18, edge.z, roofW, 0.64, 0.9, rotationY);
        box(mats.dougong, edge.x, roofY - 0.6, edge.z, roofW - 1.2, 0.5, 0.62, rotationY);
        box(mats.dripTile, edge.x, roofY + 0.05, edge.z, roofW + 0.2, 0.28, 0.74, rotationY);
      }
      for (const localX of [-roofW * 0.5 + 0.42, roofW * 0.5 - 0.42]) {
        const edge = worldPoint(localX, 0);
        box(mats.roofUnder, edge.x, roofY - 0.18, edge.z, 0.9, 0.64, roofD - 1.4, rotationY);
        box(mats.dougong, edge.x, roofY - 0.6, edge.z, 0.62, 0.5, roofD - 2.2, rotationY);
        box(mats.dripTile, edge.x, roofY + 0.05, edge.z, 0.74, 0.28, roofD - 1.0, rotationY);
      }
      if (instanceRoof && roofStyle === 'hip') {
        instancedHallRoofEntries.push({
          x,
          y: roofY,
          z,
          w: roofW,
          d: roofD,
          rise: roofRise,
          cornerLift,
          segments: roofSegments,
          rotationY,
        });
        if (crossRidge) {
          instancedHallRoofEntries.push({
            x,
            y: roofY + 0.06,
            z,
            w: roofW,
            d: roofD,
            rise: roofRise,
            cornerLift,
            segments: roofSegments,
            rotationY: rotationY + Math.PI * 0.5,
          });
        }
      } else if (roofStyle === 'octagonal') {
        octagonalRoofMesh({
          x,
          y: roofY,
          z,
          radius: Math.max(roofW, roofD) * 0.52,
          rise: roofRise,
          rotationY,
          name: `${name}-octagonal-roof-${eave + 1}`,
        });
      } else {
        roofMesh({
          x,
          y: roofY,
          z,
          w: roofW,
          d: roofD,
          rise: roofRise,
          cornerLift,
          segments: roofSegments,
          rotationY,
          name: `${name}-roof-${eave + 1}`,
        });
        if (crossRidge) {
          roofMesh({
            x,
            y: roofY + 0.06,
            z,
            w: roofW,
            d: roofD,
            rise: roofRise,
            cornerLift,
            segments: roofSegments,
            rotationY: rotationY + Math.PI * 0.5,
            name: `${name}-cross-roof-${eave + 1}`,
          });
        }
      }
      highestRoofTop = Math.max(highestRoofTop, roofY + roofRise + 2.2);
      if (eave === 0) {
        outlineRoofW = roofW;
        outlineRoofD = roofD;
        outlineY = roofY - 0.22;
      }
      if (showFacadeDetail && (eave === 0 || buildingType === 'summitHall')) {
        addRoofRibs({
          x,
          y: roofY,
          z,
          w: roofW,
          d: roofD,
          rise: roofRise,
          rotationY,
          count: THREE.MathUtils.clamp(Math.round(roofW / 7.8), 7, 24),
        });
      }

      // Ridge and simplified kiss-beasts at its ends.
      if (roofStyle !== 'octagonal') {
        box(
          mats.roofGold,
          x,
          roofY + roofRise + 0.34,
          z,
          roofW * 0.46,
          0.68,
          0.74,
          rotationY,
          `${name}-ridge-${eave + 1}`,
        );
        for (const sign of [-1, 1]) {
          const localX = sign * roofW * 0.235;
          const ridgePoint = worldPoint(localX, 0);
          box(
            mats.yellowTile,
            ridgePoint.x,
            roofY + roofRise + 1.1,
            ridgePoint.z,
            1.35,
            1.8,
            1.1,
            rotationY,
            `${name}-ridge-beast`,
          );
          const head = worldPoint(localX + sign * 0.72, 0);
          box(
            mats.yellowTile,
            head.x,
            roofY + roofRise + 1.95,
            head.z,
            0.82,
            0.78,
            0.82,
            rotationY,
            `${name}-ridge-beast-head`,
          );
        }
        if (crossRidge) {
          box(
            mats.roofGold,
            x,
            roofY + roofRise + 0.4,
            z,
            roofW * 0.46,
            0.68,
            0.74,
            rotationY + Math.PI * 0.5,
            `${name}-cross-ridge-${eave + 1}`,
          );
          for (const sign of [-1, 1]) {
            const localZ = sign * roofW * 0.235;
            const beast = worldPoint(0, localZ);
            box(
              mats.yellowTile,
              beast.x,
              roofY + roofRise + 1.12,
              beast.z,
              1.1,
              1.8,
              1.35,
              rotationY,
              `${name}-cross-ridge-beast`,
            );
          }
        }
      }

      if (ornaments) {
        for (const localX of [-roofW * 0.5, roofW * 0.5]) {
          for (const localZ of [-roofD * 0.5, roofD * 0.5]) {
            const corner = worldPoint(localX, localZ);
            column(
              mats.bronze,
              corner.x,
              roofY + cornerLift + 0.72,
              corner.z,
              0.22,
              1.45,
              `${name}-corner-finial`,
            );
          }
        }
      }

      if (eave < eaveCount - 1) {
        const upperH = Math.max(4.6, bodyH * 0.28);
        roofY += roofRise * stackCompression + upperH;
        const upperBodyW = bodyW * shrink * 0.72;
        const upperBodyD = bodyD * shrink * 0.66;
        topStoryCenterY = roofY - upperH * 0.52;
        topStoryW = upperBodyW;
        topStoryD = upperBodyD;
        box(
          wallColor,
          x,
          roofY - upperH * 0.52,
          z,
          upperBodyW,
          upperH * 0.76,
          upperBodyD,
          rotationY,
          `${name}-upper-wall-${eave + 1}`,
        );
        box(
          mats.dougong,
          x,
          roofY - 0.3,
          z,
          bodyW * shrink * 0.78,
          0.52,
          bodyD * shrink * 0.72,
          rotationY,
        );
        // Upper stories are real colonnaded levels, not anonymous red blocks.
        // A recessed dark facade plus exposed vermilion posts makes the stacked
        // eaves read as palace architecture at both axial and close views.
        for (const localZ of [upperBodyD * 0.5 + 0.06, -upperBodyD * 0.5 - 0.06]) {
          const upperFace = worldPoint(0, localZ);
          box(
            mats.lacquerDark,
            upperFace.x,
            roofY - upperH * 0.52,
            upperFace.z,
            upperBodyW * 0.9,
            upperH * 0.6,
            0.24,
            rotationY,
          );
          const upperPostBays = Math.max(3, Math.ceil(bays * 0.5));
          for (let bay = 0; bay <= upperPostBays; bay++) {
            const localX = -upperBodyW * 0.5 + upperBodyW * bay / upperPostBays;
            const post = worldPoint(localX, localZ);
            column(
              mats.vermilion,
              post.x,
              roofY - upperH * 0.52,
              post.z,
              Math.max(0.34, colR * 0.72),
              upperH * 0.74,
              `${name}-upper-column`,
            );
          }
        }
        const upperFront = worldPoint(0, bodyD * shrink * 0.33 + 0.12);
        box(
          mats.tealTrim,
          upperFront.x,
          roofY - upperH * 0.42,
          upperFront.z,
          bodyW * shrink * 0.66,
          0.42,
          0.34,
          rotationY,
        );
      }
    }

    if (finial) {
      column(
        mats.roofGold,
        x,
        highestRoofTop + 1.05,
        z,
        Math.max(0.36, Math.min(w, d) * 0.018),
        2.1,
        `${name}-roof-finial`,
      );
      box(
        mats.roofGold,
        x,
        highestRoofTop + 2.28,
        z,
        1.05,
        0.52,
        1.05,
        rotationY,
        `${name}-finial-cap`,
      );
      highestRoofTop += 2.55;
    }

    if (archTopStory) {
      const archW = Math.max(2.8, Math.min(4.2, topStoryW * 0.22));
      const archH = Math.max(4.2, Math.min(6.2, bodyH * 0.42));
      for (const sign of [-1, 1]) {
        const frontArch = worldPoint(0, sign * (topStoryD * 0.5 + 0.14));
        towerArchEntries.push({
          x: frontArch.x,
          y: topStoryCenterY,
          z: frontArch.z,
          rotationY,
          sx: archW,
          sy: archH,
        });
        const sideArch = worldPoint(sign * (topStoryW * 0.5 + 0.14), 0);
        towerArchEntries.push({
          x: sideArch.x,
          y: topStoryCenterY,
          z: sideArch.z,
          rotationY: rotationY + Math.PI * 0.5,
          sx: archW,
          sy: archH,
        });
      }
      if (instrument) {
        towerInstrumentEntries.push({
          type: instrument,
          x,
          y: topStoryCenterY - archH * 0.04,
          z,
          rotationY,
          scale: Math.max(2.4, Math.min(w, d) * 0.095),
        });
      }
    }

    return {
      name,
      buildingType,
      x,
      y,
      z,
      w,
      d,
      bays,
      eaves: eaveCount,
      podium: podiumLayers,
      topY: highestRoofTop,
      totalHeight: highestRoofTop - y,
      bodyBase,
      bodyH,
      bodyW,
      bodyD,
      rotationY,
      lanternY: bodyBase + bodyH - 1.45,
      stairCount,
      stairTread: stairDepth,
      stairRiser: podiumRise / stairCount,
      stairFrontOffset,
      nightOutline,
      nightWindows,
      instrument,
      outlineY,
      outlineRoofW,
      outlineRoofD,
    };
  }

  function flushTowerFeatures() {
    if (instancedHallRoofEntries.length) {
      const roofGroups = new Map();
      for (const entry of instancedHallRoofEntries) {
        const key = [
          entry.w,
          entry.d,
          entry.rise,
          entry.cornerLift,
          entry.segments,
        ].map((value) => Number(value).toFixed(3)).join(':');
        if (!roofGroups.has(key)) roofGroups.set(key, []);
        roofGroups.get(key).push(entry);
      }
      let roofBatchIndex = 0;
      for (const entries of roofGroups.values()) {
        const prototype = entries[0];
        const geometry = hipRoofGeometry(
          prototype.w,
          prototype.d,
          prototype.rise,
          prototype.cornerLift,
          prototype.segments,
        );
        const roofMeshBatch = new THREE.InstancedMesh(
          geometry,
          mats.roofGold,
          entries.length,
        );
        roofMeshBatch.name = `imperial-instanced-tower-roofs-${++roofBatchIndex}`;
        entries.forEach((entry, index) => {
          matrixObject.position.set(entry.x, entry.y, entry.z);
          matrixObject.rotation.set(0, entry.rotationY, 0);
          matrixObject.scale.set(1, 1, 1);
          matrixObject.updateMatrix();
          roofMeshBatch.setMatrixAt(index, matrixObject.matrix);
        });
        roofMeshBatch.instanceMatrix.needsUpdate = true;
        group.add(roofMeshBatch);
      }
    }

    if (towerArchEntries.length) {
      const archShape = new THREE.Shape();
      archShape.moveTo(-0.5, -0.5);
      archShape.lineTo(0.5, -0.5);
      archShape.lineTo(0.5, 0);
      archShape.absarc(0, 0, 0.5, 0, Math.PI, false);
      archShape.lineTo(-0.5, -0.5);
      const archGeometry = new THREE.ShapeGeometry(archShape, 6);
      const archMesh = new THREE.InstancedMesh(
        archGeometry,
        mats.towerVoid,
        towerArchEntries.length,
      );
      archMesh.name = 'imperial-tower-arched-openings';
      towerArchEntries.forEach((entry, index) => {
        matrixObject.position.set(entry.x, entry.y, entry.z);
        matrixObject.rotation.set(0, entry.rotationY, 0);
        matrixObject.scale.set(entry.sx, entry.sy, 1);
        matrixObject.updateMatrix();
        archMesh.setMatrixAt(index, matrixObject.matrix);
      });
      archMesh.instanceMatrix.needsUpdate = true;
      group.add(archMesh);
    }

    for (const type of ['bell', 'drum']) {
      const entries = towerInstrumentEntries.filter((entry) => entry.type === type);
      if (!entries.length) continue;
      const geometry = type === 'bell'
        ? new THREE.CylinderGeometry(0.58, 0.92, 1.45, 10, 1, false)
        : new THREE.CylinderGeometry(0.86, 0.86, 1.28, 12, 1, false);
      const mesh = new THREE.InstancedMesh(geometry, mats.bronze, entries.length);
      mesh.name = `imperial-${type}-silhouettes`;
      entries.forEach((entry, index) => {
        matrixObject.position.set(entry.x, entry.y, entry.z);
        matrixObject.rotation.set(
          type === 'drum' ? Math.PI * 0.5 : 0,
          entry.rotationY,
          0,
        );
        matrixObject.scale.setScalar(entry.scale);
        matrixObject.updateMatrix();
        mesh.setMatrixAt(index, matrixObject.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      group.add(mesh);
    }
  }

  // A shared dark inner face sits just inside every real arch opening. It gives
  // the apertures readable depth against the pale bridge body even when the
  // water and distant terrain behind them have similar daylight values.
  const archFaceEntries = [];
  const archFacePositions = [
    -1, 0, 0, 1, 0, 0, 1, 0.55, 0,
    -1, 0, 0, 1, 0.55, 0, -1, 0.55, 0,
  ];
  const archFaceIndices = [0, 1, 2, 3, 4, 5];
  const archFaceSegments = 8;
  const fanCenter = archFacePositions.length / 3;
  archFacePositions.push(0, 0.55, 0);
  for (let i = 0; i <= archFaceSegments; i++) {
    const angle = Math.PI - Math.PI * i / archFaceSegments;
    archFacePositions.push(
      Math.cos(angle),
      0.55 + Math.sin(angle) * 0.45,
      0,
    );
    if (i > 0) {
      archFaceIndices.push(fanCenter, fanCenter + i, fanCenter + i + 1);
    }
  }
  const UNIT_ARCH_FACE = new THREE.BufferGeometry();
  UNIT_ARCH_FACE.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(archFacePositions, 3),
  );
  UNIT_ARCH_FACE.setIndex(archFaceIndices);
  UNIT_ARCH_FACE.computeVertexNormals();

  function flushArchFaces() {
    if (!archFaceEntries.length) return;
    const mesh = new THREE.InstancedMesh(
      UNIT_ARCH_FACE,
      mats.archVoid,
      archFaceEntries.length,
    );
    mesh.name = 'imperial-bridge-arch-depth-faces';
    archFaceEntries.forEach((entry, index) => {
      matrixObject.position.set(entry.x, entry.y, entry.z);
      matrixObject.rotation.set(0, 0, 0);
      matrixObject.scale.set(entry.radius, entry.height, 1);
      matrixObject.updateMatrix();
      mesh.setMatrixAt(index, matrixObject.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  // Five-arch bridge: a single extruded masonry body with real arch openings,
  // rather than torus decorations pasted onto a solid block. The same geometry
  // is reused by the five parallel Golden Water bridges at the southern edge.
  function fiveArchBridgeGeometry(width, length, height) {
    const shape = new THREE.Shape();
    shape.moveTo(-width * 0.5, 0);
    shape.lineTo(width * 0.5, 0);
    shape.lineTo(width * 0.5, height);
    shape.lineTo(-width * 0.5, height);
    shape.closePath();

    const margin = width * 0.045;
    const available = width - margin * 2;
    const bay = available / 5;
    const radius = bay * 0.38;
    const springY = height * 0.44;
    for (let arch = 0; arch < 5; arch++) {
      const cx = -width * 0.5 + margin + bay * (arch + 0.5);
      const hole = new THREE.Path();
      hole.moveTo(cx - radius, 0.08);
      hole.lineTo(cx - radius, springY);
      const segments = 8;
      for (let i = 0; i <= segments; i++) {
        const angle = Math.PI - Math.PI * i / segments;
        hole.lineTo(
          cx + Math.cos(angle) * radius,
          springY + Math.sin(angle) * radius,
        );
      }
      hole.lineTo(cx + radius, 0.08);
      hole.closePath();
      shape.holes.push(hole);
    }

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: length,
      steps: 1,
      bevelEnabled: false,
      curveSegments: 8,
    });
    geometry.translate(0, 0, -length * 0.5);
    geometry.computeVertexNormals();
    return geometry;
  }

  function goldenWaterBridge({ x, z, width, length, topY, archRise = 3.2, name }) {
    const deckY = topY + archRise;
    const height = deckY - TERRAIN_Y - 0.45;
    const bridge = new THREE.Mesh(
      fiveArchBridgeGeometry(width, length, height),
      mats.marble,
    );
    bridge.position.set(x, TERRAIN_Y + 0.35, z);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    bridge.name = name;
    group.add(bridge);

    const margin = width * 0.045;
    const available = width - margin * 2;
    const bay = available / 5;
    const radius = bay * 0.38;
    const openingHeight = height * 0.44 + radius - 0.08;
    for (let arch = 0; arch < 5; arch++) {
      const localX = -width * 0.5 + margin + bay * (arch + 0.5);
      for (const face of [-1, 1]) {
        archFaceEntries.push({
          x: x + localX,
          y: TERRAIN_Y + 0.43,
          z: z + face * (length * 0.5 + 0.025),
          radius,
          height: openingHeight,
        });
      }
    }

    // Solid deck and continuous balustrade rails; sparse posts stay in the
    // shared marble box batch.
    box(mats.marble, x, deckY + 0.18, z, width + 1.8, 0.36, length + 1.0);
    if (Math.abs(x) < 0.01) {
      box(mats.roadDark, x, deckY + 0.395, z, 8, 0.07, length + 1.0);
    }
    for (const side of [-1, 1]) {
      const edgeX = x + side * (width * 0.5 - 0.55);
      box(mats.marble, edgeX, deckY + 1.35, z, 0.32, 0.28, length + 1.0);
      const count = Math.max(4, Math.round(length / 4.5));
      for (let i = 0; i <= count; i++) {
        const pz = z - length * 0.5 + length * i / count;
        box(mats.marble, edgeX, deckY + 0.8, pz, 0.48, 1.6, 0.48);
      }
    }
    const stepCount = 6;
    const approachLength = 10.8;
    const stepDepth = approachLength / stepCount;
    const stepH = archRise / stepCount;
    const approachWidth = Math.max(12, width * 0.28);
    for (const direction of [-1, 1]) {
      for (let step = 0; step < stepCount; step++) {
        const blockH = (step + 1) * stepH;
        const pz = z + direction * (
          length * 0.5 + approachLength - (step + 0.5) * stepDepth
        );
        box(
          mats.marble,
          x,
          topY + blockH * 0.5,
          pz,
          approachWidth,
          blockH,
          stepDepth + 0.12,
        );
        if (Math.abs(x) < 0.01) {
          box(
            mats.roadDark,
            x,
            topY + blockH + 0.035,
            pz,
            8,
            0.07,
            stepDepth + 0.14,
          );
        }
      }
    }
    return bridge;
  }

  // Four double-sided triangles per tree: two tapered crown planes intersect
  // at right angles, preserving the pine silhouette at city scale.
  function pineGeometry(variant = 0) {
    const positions = [];
    const colors = [];
    const crownColors = [
      new THREE.Color(0x213e2d),
      new THREE.Color(0x2b4933),
      new THREE.Color(0x18382b),
    ];
    const crownColor = crownColors[variant % crownColors.length];

    function tri(a, b, c, color) {
      positions.push(...a, ...b, ...c);
      for (let i = 0; i < 3; i++) {
        colors.push(color.r, color.g, color.b);
      }
    }

    function quad(a, b, c, d, color) {
      tri(a, b, c, color);
      tri(a, c, d, color);
    }

    // R6 collapses the former trunk plus three stacked crown tiers into two
    // intersecting tapered quads. Double-sided material keeps the silhouette
    // full from every view for only four triangles per tree.
    const half = 2.05 + variant * 0.18;
    const shoulder = 0.24 + variant * 0.02;
    const height = 7.05 + variant * 0.32;
    quad(
      [-half, 0, 0],
      [half, 0, 0],
      [shoulder, height, 0],
      [-shoulder, height, 0],
      crownColor,
    );
    quad(
      [0, 0, -half],
      [0, 0, half],
      [0, height, shoulder],
      [0, height, -shoulder],
      crownColor.clone().offsetHSL(0, 0, 0.025),
    );

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3),
    );
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  // Minimal geometry merger for the five low-poly fallback statues. It keeps
  // the delivery single-file and avoids importing BufferGeometryUtils.
  function mergeParts(parts) {
    const positions = [];
    const normals = [];
    for (const part of parts) {
      let geometry = part.geometry.clone();
      if (geometry.index) geometry = geometry.toNonIndexed();
      geometry.applyMatrix4(part.matrix);
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      positions.push(...geometry.attributes.position.array);
      normals.push(...geometry.attributes.normal.array);
      geometry.dispose();
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    merged.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normals, 3),
    );
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    return merged;
  }

  function part(geometry, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const object = new THREE.Object3D();
    object.position.set(x, y, z);
    object.rotation.set(rx, ry, rz);
    object.scale.set(sx, sy, sz);
    object.updateMatrix();
    return { geometry, matrix: object.matrix.clone() };
  }

  function placeholderGeometry(type) {
    const pieces = [];
    if (type === 'lion') {
      pieces.push(part(new THREE.BoxGeometry(5.2, 0.8, 4.6), 0, 0.4, 0));
      pieces.push(part(new THREE.IcosahedronGeometry(1, 1), 0, 3.9, 0.1, 2.0, 2.5, 1.75));
      pieces.push(part(new THREE.IcosahedronGeometry(1, 1), 0, 6.7, 0.55, 1.75, 1.65, 1.6));
      pieces.push(part(new THREE.CylinderGeometry(0.55, 0.72, 3.2, 6), -1.15, 2.0, 1.05));
      pieces.push(part(new THREE.CylinderGeometry(0.55, 0.72, 3.2, 6), 1.15, 2.0, 1.05));
      pieces.push(part(new THREE.ConeGeometry(0.48, 1.55, 6), 0, 6.6, 2.15, 1, 1, 1, Math.PI * 0.5, 0, 0));
    } else if (type === 'huabiao') {
      pieces.push(part(new THREE.CylinderGeometry(2.5, 3.0, 1.5, 10), 0, 0.75, 0));
      pieces.push(part(new THREE.CylinderGeometry(1.0, 1.2, 13.5, 10), 0, 8.1, 0));
      pieces.push(part(new THREE.CylinderGeometry(2.2, 2.2, 0.8, 10), 0, 14.9, 0));
      pieces.push(part(new THREE.BoxGeometry(8.2, 1.0, 1.5), 0, 15.3, 0));
      pieces.push(part(new THREE.CylinderGeometry(1.2, 1.45, 1.5, 8), 0, 16.2, 0));
      pieces.push(part(new THREE.IcosahedronGeometry(1, 0), 0, 17.7, 0, 1.25, 1.1, 0.9));
    } else if (type === 'censer') {
      pieces.push(part(new THREE.BoxGeometry(5.8, 0.8, 4.8), 0, 0.4, 0));
      pieces.push(part(new THREE.SphereGeometry(2.4, 10, 7), 0, 4.0, 0, 1, 0.82, 1));
      for (const x of [-1.35, 0, 1.35]) {
        pieces.push(part(new THREE.CylinderGeometry(0.42, 0.62, 2.6, 6), x, 1.75, x === 0 ? -1.2 : 0.75));
      }
      pieces.push(part(new THREE.TorusGeometry(2.55, 0.28, 5, 10), 0, 4.5, 0, 1, 1, 1, Math.PI * 0.5, 0, 0));
      pieces.push(part(new THREE.ConeGeometry(3.2, 2.0, 4), 0, 6.2, 0, 1, 1, 1, 0, Math.PI * 0.25, 0));
      pieces.push(part(new THREE.CylinderGeometry(0.42, 0.55, 1.2, 6), 0, 7.7, 0));
    } else if (type === 'turtle') {
      pieces.push(part(new THREE.BoxGeometry(6.2, 0.7, 5.2), 0, 0.35, 0));
      pieces.push(part(new THREE.SphereGeometry(2.7, 10, 7), 0, 2.8, 0, 1.3, 0.72, 1.0));
      pieces.push(part(new THREE.CylinderGeometry(0.7, 0.9, 3.4, 7), 0, 3.0, 3.0, 1, 1, 1, Math.PI * 0.32, 0, 0));
      pieces.push(part(new THREE.IcosahedronGeometry(0.9, 0), 0, 4.85, 4.05, 1.0, 0.8, 1.1));
      for (const x of [-1.9, 1.9]) {
        for (const z of [-1.35, 1.25]) {
          pieces.push(part(new THREE.CylinderGeometry(0.45, 0.65, 1.5, 6), x, 1.3, z));
        }
      }
    } else if (type === 'crane') {
      pieces.push(part(new THREE.BoxGeometry(4.8, 0.7, 4.0), 0, 0.35, 0));
      pieces.push(part(new THREE.SphereGeometry(1.6, 8, 6), 0, 7.0, 0, 1.0, 1.4, 0.95));
      pieces.push(part(new THREE.CylinderGeometry(0.48, 0.62, 6.2, 7), 0, 11.0, 0.15, 1, 1, 1, 0.12, 0, 0));
      pieces.push(part(new THREE.IcosahedronGeometry(0.85, 0), 0, 14.25, 0.65, 1.0, 0.85, 0.85));
      pieces.push(part(new THREE.ConeGeometry(0.46, 2.4, 6), 0, 14.25, 2.0, 1, 1, 1, Math.PI * 0.5, 0, 0));
      for (const x of [-0.62, 0.62]) {
        pieces.push(part(new THREE.CylinderGeometry(0.23, 0.28, 5.1, 6), x, 3.35, 0));
      }
    }
    return mergeParts(pieces);
  }

  // -------------------------------------------------------------------------
  // Stage 1 — nine red-walled terraces, compressed as they climb northward.
  // The widths/depths/heights are intentionally non-linear: the reference is a
  // mountain-scale palace, not nine copies of the same retaining wall.
  const terraces = [
    { stage: 1, z: 322, width: 1180, depth: 118, top: 6 },
    { stage: 2, z: 232, width: 1090, depth: 112, top: 12 },
    { stage: 3, z: 142, width: 995, depth: 112, top: 19 },
    { stage: 4, z: 52, width: 900, depth: 112, top: 27 },
    { stage: 5, z: -38, width: 810, depth: 112, top: 36 },
    { stage: 6, z: -128, width: 720, depth: 112, top: 46 },
    { stage: 7, z: -218, width: 625, depth: 112, top: 58 },
    { stage: 8, z: -300, width: 525, depth: 100, top: 72 },
    { stage: 9, z: -362, width: 430, depth: 82, top: 90 },
  ];
  const ROAD_W = 48;
  const roadWidthAt = (terraceIndex) => (
    ROAD_W + Math.max(0, terraceIndex - 5) * 14
  );

  // Pitched yellow caps and merged white balustrades are collected first and
  // emitted as two InstancedMeshes. Continuous marble boxes now carry the
  // railing silhouette; sparse 12 m marker posts replace the old 1.2 m grid.
  const parapetCapEntries = [];
  const terraceRailPosts = [];
  const capPositions = [
    -0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5,
    -0.5, 1, 0, 0.5, 1, 0,
  ];
  const capIndices = [
    0, 1, 5, 0, 5, 4,
    2, 4, 5, 2, 5, 3,
    0, 2, 3, 0, 3, 1,
    0, 4, 2, 1, 3, 5,
  ];
  const UNIT_PARAPET_CAP = new THREE.BufferGeometry();
  UNIT_PARAPET_CAP.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(capPositions, 3),
  );
  UNIT_PARAPET_CAP.setIndex(capIndices);
  UNIT_PARAPET_CAP.computeVertexNormals();

  function addPitchedCap(x, y, z, length, rotationY = 0) {
    parapetCapEntries.push({ x, y, z, length, rotationY });
  }

  function addBalustradeLine(x1, z1, x2, z2, baseY) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    if (length < 0.5) return;
    const rotationY = Math.atan2(-dz, dx);
    const cx = (x1 + x2) * 0.5;
    const cz = (z1 + z2) * 0.5;
    box(mats.marble, cx, baseY + 0.48, cz, length, 0.72, 0.16, rotationY);
    box(mats.marble, cx, baseY + 1.28, cz, length + 0.12, 0.2, 0.3, rotationY);
    const count = Math.max(1, Math.ceil(length / 12));
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      terraceRailPosts.push({
        x: THREE.MathUtils.lerp(x1, x2, t),
        y: baseY + 0.8,
        z: THREE.MathUtils.lerp(z1, z2, t),
        rotationY,
      });
    }
  }

  function splitRedWall(x, yBottom, z, sx, sy, sz, rotationY = 0, name = '') {
    const shadowH = sy * 0.15;
    box(mats.redShadow, x, yBottom + shadowH * 0.5, z, sx, shadowH, sz, rotationY, `${name}-ao`);
    box(
      mats.rammedRed,
      x,
      yBottom + shadowH + (sy - shadowH) * 0.5,
      z,
      sx,
      sy - shadowH,
      sz,
      rotationY,
      name,
    );
  }

  function parapetSegment(x, z, length, platformTopY, rotationY = 0) {
    const wallH = 5;
    splitRedWall(
      x,
      platformTopY + 0.24,
      z,
      length,
      wallH,
      2.2,
      rotationY,
      'terrace-vermilion-parapet',
    );
    addPitchedCap(x, platformTopY + wallH + 0.24, z, length, rotationY);
  }

  // The terrain can vary under the future integration site. We sample the
  // centre of every stage, then keep each platform's visible top at the design
  // elevation above that local sample. No terrain mesh is created here.
  for (const terrace of terraces) {
    const groundY = sampleHeight(SITE_X, SITE_Z + terrace.z);
    const platformTopY = groundY + terrace.top;
    terrace.groundY = groundY;
    terrace.y = platformTopY;

    // Structural fill and red-cliff retaining faces with a 15% false-AO base.
    box(
      mats.earth,
      SITE_X,
      groundY + terrace.top * 0.5 - 0.35,
      SITE_Z + terrace.z,
      terrace.width - 8,
      terrace.top - 0.7,
      terrace.depth - 8,
    );
    // The south retaining face must open at the imperial road. A full-width
    // red wall made the stair flights look like disconnected white platforms
    // even though the transition geometry existed behind it.
    const stageRoadW = roadWidthAt(terrace.stage - 1);
    const frontOpeningW = stageRoadW + 16;
    const frontSideW = Math.max(8, (terrace.width - frontOpeningW) * 0.5);
    const frontWallZ = SITE_Z + terrace.z + terrace.depth * 0.5 - 3.25;
    for (const side of [-1, 1]) {
      const frontWallX = SITE_X + side * (frontOpeningW + frontSideW) * 0.5;
      splitRedWall(
        frontWallX,
        groundY,
        frontWallZ,
        frontSideW,
        terrace.top,
        6.5,
        0,
        `terrace-${terrace.stage}-front-${side < 0 ? 'west' : 'east'}`,
      );
    }
    // White-stone lining closes the exposed earth core inside the opening.
    // The incoming stair flight sits immediately in front of this face.
    box(
      mats.marbleShade,
      SITE_X,
      groundY + terrace.top * 0.5,
      frontWallZ + 0.12,
      frontOpeningW,
      terrace.top,
      0.72,
    );

    // Deep side returns make the red face read as a buildable retaining wall.
    splitRedWall(
      SITE_X - terrace.width * 0.5 + 3.25,
      groundY,
      SITE_Z + terrace.z,
      6.5,
      terrace.top,
      terrace.depth,
      0,
      `terrace-${terrace.stage}-west`,
    );
    splitRedWall(
      SITE_X + terrace.width * 0.5 - 3.25,
      groundY,
      SITE_Z + terrace.z,
      6.5,
      terrace.top,
      terrace.depth,
      0,
      `terrace-${terrace.stage}-east`,
    );

    // Quiet pale-stone platform surface.
    box(
      mats.marbleShade,
      SITE_X,
      platformTopY + 0.16,
      SITE_Z + terrace.z,
      terrace.width - 14,
      0.32,
      terrace.depth - 13,
    );

    // White-stone base course under the red cliff.
    const faceZ = SITE_Z + terrace.z + terrace.depth * 0.5 + 0.18;
    for (const side of [-1, 1]) {
      const frontBaseX = SITE_X + side * (frontOpeningW + frontSideW) * 0.5;
      box(
        mats.marble,
        frontBaseX,
        groundY + 0.75,
        faceZ,
        frontSideW + 0.8,
        1.5,
        1.15,
      );
    }

    // Four-sided 5 m vermilion parapet with pitched yellow cap. North/south
    // edges split around the imperial road; dense white railings sit above.
    const railGap = roadWidthAt(terrace.stage - 1) + 8;
    const innerHalf = terrace.width * 0.5 - 7;
    const railHalfW = Math.max(4, innerHalf - railGap * 0.5);
    const southZ = SITE_Z + terrace.z + terrace.depth * 0.5 - 6;
    const northZ = SITE_Z + terrace.z - terrace.depth * 0.5 + 6;
    const westX = SITE_X - terrace.width * 0.5 + 6;
    const eastX = SITE_X + terrace.width * 0.5 - 6;
    for (const side of [-1, 1]) {
      const railX = side * (railGap * 0.5 + railHalfW * 0.5);
      parapetSegment(railX, southZ, railHalfW, platformTopY, 0);
      parapetSegment(railX, northZ, railHalfW, platformTopY, 0);
      const x1 = side < 0 ? -innerHalf : railGap * 0.5;
      const x2 = side < 0 ? -railGap * 0.5 : innerHalf;
      addBalustradeLine(x1, southZ, x2, southZ, platformTopY + 5.58);
      addBalustradeLine(x1, northZ, x2, northZ, platformTopY + 5.58);
    }
    const sideLength = terrace.depth - 12;
    parapetSegment(westX, terrace.z, sideLength, platformTopY, Math.PI * 0.5);
    parapetSegment(eastX, terrace.z, sideLength, platformTopY, Math.PI * 0.5);
    addBalustradeLine(westX, northZ, westX, southZ, platformTopY + 5.58);
    addBalustradeLine(eastX, northZ, eastX, southZ, platformTopY + 5.58);
  }

  // Large courtyards in the reference are not blank slabs: restrained stone
  // joints establish human scale while preserving broad ceremonial emptiness.
  for (let terraceIndex = 0; terraceIndex < terraces.length; terraceIndex++) {
    const terrace = terraces[terraceIndex];
    const stageRoadW = roadWidthAt(terraceIndex);
    const courtHalfW = Math.max(20, (terrace.width - stageRoadW - 86) * 0.5);
    for (const side of [-1, 1]) {
      const courtX = side * (stageRoadW * 0.5 + 24 + courtHalfW * 0.5);
      for (let joint = 1; joint <= 4; joint++) {
        box(
          mats.pavingLine,
          courtX,
          terrace.y + 0.345,
          terrace.z - terrace.depth * 0.5 + terrace.depth * joint / 5,
          courtHalfW,
          0.045,
          0.28,
        );
      }
      for (const lane of [-0.24, 0.24]) {
        box(
          mats.pavingLine,
          courtX + courtHalfW * lane,
          terrace.y + 0.345,
          terrace.z,
          0.28,
          0.045,
          terrace.depth - 24,
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // Continuous imperial avenue. There is no gate, roof, arch or prop on the
  // centre line. A walk from the south bridge position to the summit requires
  // only flat paving, landings and stairs.
  const AXIS_RISER_TARGET = 0.6;
  const AXIS_TREAD = 1.8;
  const axisStairFlights = [];
  for (let i = 0; i < terraces.length; i++) {
    const terrace = terraces[i];
    const stageRoadW = roadWidthAt(i);
    box(
      mats.marble,
      SITE_X,
      terrace.y + 0.42,
      SITE_Z + terrace.z,
      stageRoadW,
      0.84,
      terrace.depth - 6,
    );
    box(
      mats.roadDark,
      SITE_X,
      terrace.y + 0.875,
      SITE_Z + terrace.z,
      8,
      0.07,
      terrace.depth - 6.5,
    );
    for (const side of [-1, 1]) {
      const railX = side * (stageRoadW * 0.5 + 2.0);
      addBalustradeLine(
        railX,
        terrace.z - terrace.depth * 0.5 + 7,
        railX,
        terrace.z + terrace.depth * 0.5 - 7,
        terrace.y + 0.92,
      );
    }
    for (const side of [-1, 1]) {
      box(
        mats.pavingLine,
        side * (stageRoadW * 0.5 - 1.25),
        terrace.y + 0.865,
        SITE_Z + terrace.z,
        0.42,
        0.05,
        terrace.depth - 7,
      );
    }
    for (let joint = 1; joint <= 4; joint++) {
      box(
        mats.pavingLine,
        SITE_X,
        terrace.y + 0.87,
        SITE_Z + terrace.z - terrace.depth * 0.5 + terrace.depth * joint / 5,
        stageRoadW - 2.4,
        0.06,
        0.38,
      );
    }

    if (i === terraces.length - 1) continue;
    const next = terraces[i + 1];
    const rise = next.y - terrace.y;
    const transitionRoadW = Math.max(stageRoadW, roadWidthAt(i + 1)) + 8;
    const steps = Math.max(6, Math.ceil(rise / AXIS_RISER_TARGET));
    const riser = rise / steps;
    const length = steps * AXIS_TREAD;
    const upperLandingZ = next.z + next.depth * 0.5 - 4;
    const lowerLandingZ = upperLandingZ + length;
    axisStairFlights.push({
      fromStage: terrace.stage,
      toStage: next.stage,
      lowerZ: lowerLandingZ,
      upperZ: upperLandingZ,
      lowerY: terrace.y + 0.84,
      upperY: next.y + 0.84,
      steps,
      riser,
      tread: AXIS_TREAD,
      slope: rise / length,
    });
    for (let step = 0; step < steps; step++) {
      const z = lowerLandingZ - (step + 0.5) * AXIS_TREAD;
      const y = terrace.y + 0.84 + riser * (step + 1);
      box(
        step % 2 === 0 ? mats.marble : mats.stairShade,
        SITE_X,
        y - rise / steps * 0.5,
        SITE_Z + z,
        transitionRoadW,
        Math.max(0.34, riser),
        AXIS_TREAD + 0.12,
      );
      box(
        mats.roadDark,
        SITE_X,
        y + 0.025,
        SITE_Z + z,
        8,
        0.05,
        AXIS_TREAD + 0.14,
      );
      for (const side of [-1, 1]) {
        const railX = side * (transitionRoadW * 0.5 + 2.0);
        if (step % 4 === 0 || step === steps - 1) {
          terraceRailPosts.push({
            x: railX,
            y: y + 1.02,
            z: SITE_Z + z,
            rotationY: Math.PI * 0.5,
          });
        }
        box(
          mats.marble,
          railX,
          y + 0.65,
          SITE_Z + z,
          0.28,
          0.98,
          AXIS_TREAD + 0.22,
        );
      }
    }
  }

  // Southern approach extends to the future Golden Water River crossing.
  const first = terraces[0];
  const approachSouth = 398;
  const approachNorth = first.z + first.depth * 0.5 - 6;
  box(
    mats.marble,
    SITE_X,
    first.y + 0.42,
    SITE_Z + (approachSouth + approachNorth) * 0.5,
    ROAD_W,
    0.84,
    approachSouth - approachNorth,
  );
  box(
    mats.roadDark,
    SITE_X,
    first.y + 0.875,
    SITE_Z + (approachSouth + approachNorth) * 0.5,
    8,
    0.07,
    approachSouth - approachNorth,
  );
  for (const side of [-1, 1]) {
    const railX = side * (ROAD_W * 0.5 + 2.0);
    addBalustradeLine(railX, approachNorth, railX, approachSouth, first.y + 0.92);
  }

  const parapetCapMesh = new THREE.InstancedMesh(
    UNIT_PARAPET_CAP,
    mats.yellowTile,
    parapetCapEntries.length,
  );
  parapetCapMesh.name = 'imperial-pitched-parapet-caps';
  parapetCapEntries.forEach((entry, index) => {
    matrixObject.position.set(entry.x, entry.y, entry.z);
    matrixObject.rotation.set(0, entry.rotationY, 0);
    matrixObject.scale.set(entry.length, 0.62, 3.4);
    matrixObject.updateMatrix();
    parapetCapMesh.setMatrixAt(index, matrixObject.matrix);
  });
  parapetCapMesh.instanceMatrix.needsUpdate = true;
  group.add(parapetCapMesh);

  const railPostGeometry = new THREE.PlaneGeometry(0.38, 1.78, 1, 1);
  const terraceRailMesh = new THREE.InstancedMesh(
    railPostGeometry,
    mats.railPost,
    terraceRailPosts.length,
  );
  terraceRailMesh.name = 'imperial-merged-balustrades-with-12m-markers';
  terraceRailPosts.forEach((entry, index) => {
    matrixObject.position.set(entry.x, entry.y, entry.z);
    matrixObject.rotation.set(0, entry.rotationY, 0);
    matrixObject.scale.set(1, 1, 1);
    matrixObject.updateMatrix();
    terraceRailMesh.setMatrixAt(index, matrixObject.matrix);
  });
  terraceRailMesh.instanceMatrix.needsUpdate = true;
  group.add(terraceRailMesh);

  // Independent building prototypes. Each archetype owns its proportions,
  // roof curve, facade density and ornament level, then is assembled at a
  // named anchor. Repeated structural subparts still share batches so the
  // visual refinement does not sacrifice the draw-call budget.
  const buildingBlueprints = {
    summitHall: {
      bays: 11, eaves: 3, podium: 3, w: 212, d: 92,
      heightScale: 1.12, roofSegments: 12, roofPitch: 0.285,
      cornerScale: 0.1, stackCompression: 0.56,
      facadeDetail: true, ornaments: true,
      podiumCourseHeight: 2.5, podiumRailSpacing: 5, stairRails: true,
      stairRiserTarget: 0.6, stairTread: 1.8,
      // The 13-step flight terminates on a 25 m arrival court south of the
      // facade instead of running beneath the hall body.
      stairFrontOffset: 47.5,
    },
    ceremonialSideHall: {
      bays: 7, eaves: 1, podium: 1, w: 82, d: 31,
      roofSegments: 10, roofPitch: 0.27, cornerScale: 0.085,
      facadeDetail: true, ornaments: true,
    },
    gateTower: {
      bays: 5, eaves: 1, podium: 1, w: 58, d: 28,
      roofSegments: 8, roofPitch: 0.285, cornerScale: 0.09,
      stackCompression: 0.7, facadeDetail: true, ornaments: true,
    },
    cornerTower: {
      bays: 3, eaves: 2, podium: 1, w: 38, d: 29,
      roofSegments: 8, roofPitch: 0.3, cornerScale: 0.105,
      stackCompression: 0.62, facadeDetail: true, ornaments: true,
    },
    gallery: {
      bays: 9, eaves: 1, podium: 1, w: 120, d: 14,
      heightScale: 0.7, roofSegments: 6, roofPitch: 0.2,
      cornerScale: 0.045, facadeDetail: false, ornaments: false,
    },
    outerCornerTower: {
      bays: 5, eaves: 3, podium: 2, w: 42, d: 30,
      heightScale: 1.24, roofSegments: 6, roofPitch: 0.29,
      cornerScale: 0.115, stackCompression: 0.58,
      facadeDetail: true, ornaments: true, crossRidge: true,
      finial: true, nightOutline: true, instanceRoof: true,
    },
    queTower: {
      bays: 3, eaves: 1, podium: 1, w: 36, d: 24,
      heightScale: 0.88, roofSegments: 6, roofPitch: 0.27,
      cornerScale: 0.09, facadeDetail: true, ornaments: true,
      pierHeight: 10.5, pierTaper: 0.16,
    },
    bellDrumTower: {
      bays: 5, eaves: 3, podium: 2, w: 44, d: 34,
      heightScale: 1.0, roofSegments: 6, roofPitch: 0.27,
      cornerScale: 0.09, stackCompression: 0.57,
      facadeDetail: true, ornaments: true, archTopStory: true,
      nightWindows: true,
    },
    upperPagoda: {
      bays: 5, eaves: 3, podium: 2, w: 46, d: 40,
      heightScale: 1.04, roofSegments: 8, roofPitch: 0.3,
      cornerScale: 0.08, stackCompression: 0.56,
      facadeDetail: true, ornaments: true, roofStyle: 'octagonal',
      finial: true,
    },
    terraceCornerPavilion: {
      bays: 3, eaves: 1, podium: 1, w: 18, d: 15,
      heightScale: 0.55, roofSegments: 3, roofPitch: 0.24,
      cornerScale: 0.085, facadeDetail: false, ornaments: false,
      stairEnabled: false, podiumRail: false, finial: true,
      instanceRoof: true,
    },
  };
  const buildingAssemblyAnchors = [];
  const pendingEntryCount = (batches) => (
    [...batches.values()].reduce((sum, batch) => sum + batch.entries.length, 0)
  );
  function assembleBuilding(type, overrides) {
    const blueprint = buildingBlueprints[type];
    if (!blueprint) throw new Error(`Unknown imperial building prototype: ${type}`);
    const boxesBefore = pendingEntryCount(boxBatches);
    const columnsBefore = pendingEntryCount(columnBatches);
    const roofRibsBefore = roofRibEntries.length;
    const instancedRoofsBefore = instancedHallRoofEntries.length;
    const childrenBefore = group.children.length;
    const spec = hall({ ...blueprint, ...overrides, buildingType: type });
    const directTriangles = group.children.slice(childrenBefore).reduce((sum, child) => {
      if (!child.isMesh || !child.geometry?.attributes?.position) return sum;
      const count = child.geometry.index
        ? child.geometry.index.count
        : child.geometry.attributes.position.count;
      return sum + count / 3;
    }, 0);
    const instancedRoofTriangles = instancedHallRoofEntries
      .slice(instancedRoofsBefore)
      .reduce((sum, entry) => sum + 24 * entry.segments + 144, 0);
    spec.estimatedTriangles = Math.round(
      (pendingEntryCount(boxBatches) - boxesBefore) * 12
      + (pendingEntryCount(columnBatches) - columnsBefore) * 16
      + (roofRibEntries.length - roofRibsBefore) * 12
      + instancedRoofTriangles
      + directTriangles,
    );
    const node = new THREE.Object3D();
    node.name = `imperial-building-${spec.name}`;
    node.position.set(spec.x, spec.y, spec.z);
    node.rotation.y = spec.rotationY;
    node.userData = {
      imperialBuilding: true,
      prototype: type,
      geometryName: spec.name,
      bays: spec.bays,
      eaves: spec.eaves,
      podium: spec.podium,
      estimatedTriangles: spec.estimatedTriangles,
    };
    group.add(node);
    buildingAssemblyAnchors.push(node);
    return spec;
  }

  // Reference-faithful core set. All remain clear of the open imperial road.
  const hallRegistry = [];
  hallRegistry.push(assembleBuilding('summitHall', {
    x: 0,
    y: terraces[8].y + 0.3,
    z: terraces[8].z - 20,
    name: 'summit-triple-eave-hall',
  }));

  for (const side of [-1, 1]) {
    hallRegistry.push(assembleBuilding('ceremonialSideHall', {
      x: side * 215,
      y: terraces[5].y + 0.3,
      z: terraces[5].z - 2,
      name: `archive-side-hall-${side < 0 ? 'west' : 'east'}`,
    }));
  }

  for (const side of [-1, 1]) {
    hallRegistry.push(assembleBuilding('gallery', {
      w: 148,
      d: 19,
      heightScale: 0.74,
      x: side * 392,
      y: terraces[1].y + 0.3,
      z: terraces[1].z,
      rotationY: Math.PI * 0.5,
      name: `southern-gallery-${side < 0 ? 'west' : 'east'}`,
    }));
  }

  for (const side of [-1, 1]) {
    for (const dz of [-24, 24]) {
      hallRegistry.push(assembleBuilding('cornerTower', {
        x: side * 218,
        y: terraces[7].y + 0.3,
        z: terraces[7].z + dz,
        name: `upper-corner-tower-${side}-${dz}`,
      }));
    }
  }

  // -------------------------------------------------------------------------
  // Stage 3 — southern Golden Water threshold and the five open gate stages.
  // Three raised white-stone arch bridges cross the 42 m Golden Water River. The
  // centre bridge carries the imperial road; two flanking bridges serve courts.
  const bridgeZ = 392;
  const bridgeSpecs = [
    { x: -150, width: 34, archRise: 3.6 },
    { x: 0, width: ROAD_W, archRise: 3.2 },
    { x: 150, width: 34, archRise: 3.6 },
  ];
  const goldenBridges = bridgeSpecs.map((spec, index) => goldenWaterBridge({
    x: spec.x,
    z: bridgeZ,
    width: spec.width,
    length: 54,
    topY: first.y + 0.2,
    archRise: spec.archRise,
    name: `golden-water-bridge-${index + 1}`,
  }));

  // -----------------------------------------------------------------------
  // R5 vertical punctuation. Every member is still a hall() specialization;
  // the family registry only enforces the skyline cap and records placement.
  const towerRegistry = [];
  const summitSpec = hallRegistry[0];
  const summitTotalHeight = summitSpec.totalHeight;
  const towerHeightCap = summitTotalHeight * 0.75;
  function assembleTower(family, type, overrides) {
    const spec = assembleBuilding(type, overrides);
    const heightRatio = spec.totalHeight / summitTotalHeight;
    if (spec.totalHeight > towerHeightCap + 0.001 || spec.topY >= summitSpec.topY) {
      throw new Error(
        `R5 skyline cap exceeded by ${spec.name}: ${(heightRatio * 100).toFixed(1)}%`,
      );
    }
    if (family === 'outerCornerTowers' && spec.estimatedTriangles > 6000) {
      throw new Error(
        `R5 corner-tower budget exceeded by ${spec.name}: ${spec.estimatedTriangles} triangles`,
      );
    }
    spec.towerFamily = family;
    spec.heightRatio = heightRatio;
    towerRegistry.push(spec);
    return spec;
  }

  // Four nameplate corner towers sit inside the outermost wall corners. Their
  // crossed hipped roofs and four-way ridge beasts stay subordinate to the
  // mountain hall while remaining readable in the 45-degree light view.
  for (const sideX of [-1, 1]) {
    for (const sideZ of [-1, 1]) {
      assembleTower('outerCornerTowers', 'outerCornerTower', {
        x: sideX * 535,
        y: terraces[0].y + 0.32,
        z: terraces[0].z + sideZ * 35,
        rotationY: sideX * sideZ < 0 ? Math.PI * 0.5 : 0,
        name: `outer-corner-tower-${sideX < 0 ? 'west' : 'east'}-${sideZ < 0 ? 'north' : 'south'}`,
      });
    }
  }

  // A paired que threshold before the Golden Water bridges.
  for (const side of [-1, 1]) {
    const x = side * 92;
    const z = 452;
    assembleTower('queTowers', 'queTower', {
      x,
      y: sampleHeight(x, z) + 0.25,
      z,
      name: `forecourt-que-${side < 0 ? 'west' : 'east'}`,
    });
  }

  // Bell and drum towers punctuate the otherwise horizontal fourth terrace.
  for (const side of [-1, 1]) {
    assembleTower('bellDrumTowers', 'bellDrumTower', {
      x: side * 142,
      y: terraces[3].y + 0.3,
      z: terraces[3].z + 5,
      instrument: side < 0 ? 'bell' : 'drum',
      name: side < 0 ? 'middle-bell-tower' : 'middle-drum-tower',
    });
  }

  // Octagonal triple-eave pavilions stand on the seventh terrace shoulders.
  for (const side of [-1, 1]) {
    assembleTower('upperPagodas', 'upperPagoda', {
      x: side * 230,
      y: terraces[6].y + 0.3,
      z: terraces[6].z + 28,
      rotationY: side < 0 ? -Math.PI * 0.125 : Math.PI * 0.125,
      name: `upper-octagonal-pagoda-${side < 0 ? 'west' : 'east'}`,
    });
  }

  // Twelve low-cost corner pavilions make a restrained tooth rhythm on three
  // terrace tiers. Their boxes and columns share the global instance batches.
  for (const terraceIndex of [1, 3, 4]) {
    const terrace = terraces[terraceIndex];
    for (const sideX of [-1, 1]) {
      for (const sideZ of [-1, 1]) {
        assembleTower('terraceCornerPavilions', 'terraceCornerPavilion', {
          x: sideX * (terrace.width * 0.5 - 22),
          y: terrace.y + 0.28,
          z: terrace.z + sideZ * (terrace.depth * 0.5 - 18),
          rotationY: sideX * sideZ < 0 ? Math.PI * 0.5 : 0,
          name: `terrace-${terrace.stage}-corner-pavilion-${sideX < 0 ? 'west' : 'east'}-${sideZ < 0 ? 'north' : 'south'}`,
        });
      }
    }
  }
  flushTowerFeatures();

  // The enormous forecourt is mostly empty; its paired sculpture locations are
  // represented by named empty anchors until Stage 5 mounts Rodin GLBs.
  box(
    mats.marble,
    0,
    first.y + 0.34,
    first.z + 1,
    570,
    0.68,
    first.depth - 14,
  );

  const statueAnchors = [];
  function anchor(type, side, x, y, z, rotationY = 0, scale = 1) {
    const node = new THREE.Object3D();
    node.name = `imperial-anchor-${type}-${side}`;
    node.position.set(x, y, z);
    node.rotation.y = rotationY;
    node.userData = {
      imperialAnchor: true,
      type,
      side,
      scale,
    };
    group.add(node);
    statueAnchors.push(node);
    return node;
  }

  anchor('huabiao', 'west', -72, first.y + 0.7, first.z + 20, 0, 1.0);
  anchor('huabiao', 'east', 72, first.y + 0.7, first.z + 20, Math.PI, 1.0);
  anchor('lion', 'west', -42, first.y + 0.7, first.z - 22, 0.12, 1.0);
  anchor('lion', 'east', 42, first.y + 0.7, first.z - 22, -0.12, 1.0);
  anchor('censer', 'west', -128, terraces[6].y + 0.7, terraces[6].z + 16, 0, 0.92);
  anchor('censer', 'east', 128, terraces[6].y + 0.7, terraces[6].z + 16, Math.PI, 0.92);
  anchor('turtle', 'west', -136, terraces[4].y + 0.7, terraces[4].z - 12, 0.08, 0.78);
  anchor('turtle', 'east', 136, terraces[4].y + 0.7, terraces[4].z - 12, -0.08, 0.78);
  anchor('crane', 'west', -176, terraces[5].y + 0.7, terraces[5].z - 14, 0.06, 0.72);
  anchor('crane', 'east', 176, terraces[5].y + 0.7, terraces[5].z - 14, -0.06, 0.72);

  // Five gate stages are paired east/west towers. Their roofs, podiums and
  // walls remain entirely outside the 48 m road plus a 9.5 m minimum buffer;
  // nothing architectural crosses or overhangs the centre axis.
  const gateStages = [
    { terrace: 0, bays: 3, eaves: 1, podium: 2, w: 46, d: 25, heightScale: 1.22 },
    { terrace: 2, bays: 5, eaves: 1, podium: 2, w: 60, d: 29, heightScale: 1.32 },
    { terrace: 4, bays: 5, eaves: 2, podium: 2, w: 70, d: 33, heightScale: 1.4 },
    { terrace: 6, bays: 7, eaves: 2, podium: 2, w: 80, d: 35, heightScale: 1.4 },
    { terrace: 7, bays: 7, eaves: 2, podium: 3, w: 96, d: 41, heightScale: 1.58 },
  ];
  const flankingGateTowers = [];
  gateStages.forEach((spec, gateIndex) => {
    const terrace = terraces[spec.terrace];
    const offset = roadWidthAt(spec.terrace) * 0.5 + spec.w * 0.5 + 14;
    for (const side of [-1, 1]) {
      flankingGateTowers.push(assembleBuilding('gateTower', {
        bays: spec.bays,
        eaves: spec.eaves,
        podium: spec.podium,
        w: spec.w,
        d: spec.d,
        x: side * offset,
        y: terrace.y + 0.35,
        z: terrace.z - 1,
        name: `flanking-gate-tower-${gateIndex + 1}-${side < 0 ? 'west' : 'east'}`,
        heightScale: spec.heightScale,
        gateOpening: 0,
      }));
    }
  });

  // -------------------------------------------------------------------------
  // Stage 4 — water, courtyard pine forest and a restrained gallery set.
  // Cross galleries are split into
  // east/west halves so the open road never passes through a building.
  const corridorRegistry = [];
  for (const terraceIndex of [5, 6]) {
    const terrace = terraces[terraceIndex];
    for (const side of [-1, 1]) {
      corridorRegistry.push(assembleBuilding('gallery', {
        bays: 9,
        eaves: 1,
        podium: 1,
        w: terrace.depth - 18,
        d: 14,
        x: side * (terrace.width * 0.5 - 24),
        y: terrace.y + 0.32,
        z: terrace.z,
        rotationY: Math.PI * 0.5,
        name: `perimeter-gallery-${terraceIndex}-${side}`,
        heightScale: 0.72,
      }));
    }
  }
  for (const terraceIndex of [2, 4, 6]) {
    const terrace = terraces[terraceIndex];
    const stageRoadW = roadWidthAt(terraceIndex);
    const halfW = (terrace.width - stageRoadW - 76) * 0.5;
    for (const side of [-1, 1]) {
      corridorRegistry.push(assembleBuilding('gallery', {
        bays: 11,
        eaves: 1,
        podium: 1,
        w: halfW,
        d: 14,
        x: side * (stageRoadW * 0.5 + 19 + halfW * 0.5),
        y: terrace.y + 0.32,
        z: terrace.z - terrace.depth * 0.29,
        name: `cross-gallery-${terraceIndex}-${side}`,
        heightScale: 0.7,
      }));
    }
  }

  // R6 first-person inspection path. Dense 5 m samples drive the preview;
  // 50 m checkpoints are exported for deterministic screenshot acceptance.
  const bridgeDeckFloorY = first.y + 0.2 + 3.2 + 0.43;
  const bridgeNorthEdge = bridgeZ - 27;
  const bridgeNorthApproach = bridgeNorthEdge - 10.8;
  const summitPodiumRise = summitSpec.bodyBase - 0.35 - summitSpec.y;
  const summitStairSteps = summitSpec.stairCount;
  const summitStairTread = summitSpec.stairTread;
  const summitStairLowerZ = summitSpec.z + summitSpec.d * 0.5
    + summitSpec.stairFrontOffset + summitStairTread * 0.5;
  const summitStairUpperZ = summitStairLowerZ - summitStairSteps * summitStairTread;
  const summitStairRiser = summitSpec.stairRiser;

  function axisSurfaceFloorY(z) {
    if (z >= bridgeNorthEdge && z <= bridgeZ + 27) return bridgeDeckFloorY;
    if (z >= bridgeNorthApproach && z < bridgeNorthEdge) {
      const t = (z - bridgeNorthApproach) / (bridgeNorthEdge - bridgeNorthApproach);
      return THREE.MathUtils.lerp(first.y + 0.82, bridgeDeckFloorY, t);
    }
    if (z <= summitStairLowerZ && z >= summitStairUpperZ) {
      const distance = summitStairLowerZ - z;
      const step = THREE.MathUtils.clamp(
        Math.ceil(distance / summitStairTread),
        0,
        summitStairSteps,
      );
      return summitSpec.y + summitStairRiser * step;
    }
    for (const flight of axisStairFlights) {
      if (z <= flight.lowerZ && z >= flight.upperZ) {
        const distance = flight.lowerZ - z;
        const step = THREE.MathUtils.clamp(
          Math.ceil(distance / flight.tread),
          0,
          flight.steps,
        );
        return flight.lowerY + flight.riser * step;
      }
    }
    let floorY = first.y + 0.84;
    for (const terrace of terraces) {
      const south = terrace.z + terrace.depth * 0.5 - 3;
      const north = terrace.z - terrace.depth * 0.5 + 3;
      if (z <= south && z >= north) floorY = Math.max(floorY, terrace.y + 0.84);
    }
    return floorY;
  }

  const axisInspectionStartZ = bridgeZ + 18;
  const axisInspectionEndZ = summitStairUpperZ;
  function makeInspectionPoint(z, distance) {
    return {
      distance,
      x: SITE_X,
      y: axisSurfaceFloorY(z),
      z,
    };
  }
  const axisInspectionPoints = [];
  for (let z = axisInspectionStartZ; z > axisInspectionEndZ; z -= 5) {
    axisInspectionPoints.push(makeInspectionPoint(z, axisInspectionStartZ - z));
  }
  axisInspectionPoints.push(makeInspectionPoint(
    axisInspectionEndZ,
    axisInspectionStartZ - axisInspectionEndZ,
  ));
  const axisInspectionCheckpoints = [];
  for (let z = axisInspectionStartZ; z > axisInspectionEndZ; z -= 50) {
    axisInspectionCheckpoints.push(makeInspectionPoint(z, axisInspectionStartZ - z));
  }
  axisInspectionCheckpoints.push(makeInspectionPoint(
    axisInspectionEndZ,
    axisInspectionStartZ - axisInspectionEndZ,
  ));

  const axisBuildingObstructions = [
    ...hallRegistry.slice(1),
    ...flankingGateTowers,
    ...corridorRegistry,
    ...towerRegistry,
  ].filter((spec) => (
    Math.abs(spec.x) < spec.w * 0.5 + 4
    && spec.z + spec.d * 0.5 >= axisInspectionEndZ
    && spec.z - spec.d * 0.5 <= axisInspectionStartZ
  ));
  const maxInspectionHeightDelta = axisInspectionPoints.reduce((max, point, index) => {
    if (index === 0) return max;
    return Math.max(max, Math.abs(point.y - axisInspectionPoints[index - 1].y));
  }, 0);
  const axisMaximumRiser = Math.max(
    3.2 / 6,
    summitStairRiser,
    ...axisStairFlights.map((flight) => flight.riser),
  );
  const axisPlatformGapCount = axisStairFlights.filter((flight, index) => {
    const lower = terraces[index];
    const upper = terraces[index + 1];
    const lowerSouth = lower.z + lower.depth * 0.5 - 3;
    const lowerNorth = lower.z - lower.depth * 0.5 + 3;
    const upperSouth = upper.z + upper.depth * 0.5 - 3;
    const upperNorth = upper.z - upper.depth * 0.5 + 3;
    return flight.lowerZ > lowerSouth
      || flight.lowerZ < lowerNorth
      || flight.upperZ > upperSouth
      || flight.upperZ < upperNorth;
  }).length;

  // Water is a single instanced standard-material batch. This mirrors the
  // viewer's lightweight translucent-water practice and needs no external
  // normal map or shader import.
  const waterRects = [
    { x: 0, y: TERRAIN_Y + 0.28, z: bridgeZ, w: 760, d: 42, name: 'golden-water-river' },
    { x: -292, y: terraces[1].y + 0.38, z: terraces[1].z + 4, w: 182, d: 28, name: 'west-lower-water-court' },
    { x: 292, y: terraces[1].y + 0.38, z: terraces[1].z + 4, w: 182, d: 28, name: 'east-lower-water-court' },
    { x: -248, y: terraces[2].y + 0.38, z: terraces[2].z + 6, w: 158, d: 28, name: 'west-middle-water-court' },
    { x: 248, y: terraces[2].y + 0.38, z: terraces[2].z + 6, w: 158, d: 28, name: 'east-middle-water-court' },
    { x: -210, y: terraces[3].y + 0.38, z: terraces[3].z + 8, w: 165, d: 26, name: 'west-reflecting-pool-1' },
    { x: 210, y: terraces[3].y + 0.38, z: terraces[3].z + 8, w: 165, d: 26, name: 'east-reflecting-pool-1' },
    { x: -172, y: terraces[4].y + 0.38, z: terraces[4].z + 8, w: 120, d: 22, name: 'west-reflecting-pool-2' },
    { x: 172, y: terraces[4].y + 0.38, z: terraces[4].z + 8, w: 120, d: 22, name: 'east-reflecting-pool-2' },
    { x: -145, y: terraces[5].y + 0.38, z: terraces[5].z + 6, w: 84, d: 18, name: 'west-reflecting-pool-3' },
    { x: 145, y: terraces[5].y + 0.38, z: terraces[5].z + 6, w: 84, d: 18, name: 'east-reflecting-pool-3' },
  ];
  // R6 merges all eleven four-box pool rims into one top-only frame mesh.
  // Each court now costs eight triangles instead of forty-eight.
  const waterFramePositions = [];
  const waterFrameIndices = [];
  function addWaterFrameQuad(a, b, c, d) {
    const start = waterFramePositions.length / 3;
    waterFramePositions.push(...a, ...b, ...c, ...d);
    waterFrameIndices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  for (const rect of waterRects) {
    const border = rect.name === 'golden-water-river' ? 2.1 : 1.45;
    const y = rect.y + 0.09;
    const outerX = rect.w * 0.5 + border;
    const outerZ = rect.d * 0.5 + border;
    const innerX = rect.w * 0.5;
    const innerZ = rect.d * 0.5;
    addWaterFrameQuad(
      [rect.x - outerX, y, rect.z - outerZ],
      [rect.x + outerX, y, rect.z - outerZ],
      [rect.x + innerX, y, rect.z - innerZ],
      [rect.x - innerX, y, rect.z - innerZ],
    );
    addWaterFrameQuad(
      [rect.x - innerX, y, rect.z + innerZ],
      [rect.x + innerX, y, rect.z + innerZ],
      [rect.x + outerX, y, rect.z + outerZ],
      [rect.x - outerX, y, rect.z + outerZ],
    );
    addWaterFrameQuad(
      [rect.x - outerX, y, rect.z - outerZ],
      [rect.x - innerX, y, rect.z - innerZ],
      [rect.x - innerX, y, rect.z + innerZ],
      [rect.x - outerX, y, rect.z + outerZ],
    );
    addWaterFrameQuad(
      [rect.x + innerX, y, rect.z - innerZ],
      [rect.x + outerX, y, rect.z - outerZ],
      [rect.x + outerX, y, rect.z + outerZ],
      [rect.x + innerX, y, rect.z + innerZ],
    );
  }
  const waterFrameGeometry = new THREE.BufferGeometry();
  waterFrameGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(waterFramePositions, 3),
  );
  waterFrameGeometry.setIndex(waterFrameIndices);
  waterFrameGeometry.computeVertexNormals();
  const waterFrameMesh = new THREE.Mesh(waterFrameGeometry, mats.marble);
  waterFrameMesh.name = 'imperial-merged-water-court-rims';
  waterFrameMesh.receiveShadow = true;
  group.add(waterFrameMesh);
  const unitWater = new THREE.PlaneGeometry(1, 1, 1, 1);
  unitWater.rotateX(-Math.PI * 0.5);
  const waterMesh = new THREE.InstancedMesh(
    unitWater,
    mats.water,
    waterRects.length,
  );
  waterMesh.name = 'imperial-water-surfaces';
  waterMesh.renderOrder = 1;
  waterRects.forEach((rect, index) => {
    matrixObject.position.set(rect.x, rect.y, rect.z);
    matrixObject.rotation.set(0, 0, 0);
    matrixObject.scale.set(rect.w, 1, rect.d);
    matrixObject.updateMatrix();
    waterMesh.setMatrixAt(index, matrixObject.matrix);
  });
  waterMesh.instanceMatrix.needsUpdate = true;
  group.add(waterMesh);

  // Restrained golden roof reflections: two low-opacity tier bands per court
  // sit just above the water and shimmer with the same slow phase as the pool.
  const reflectionEntries = [];
  for (const rect of waterRects.filter((entry) => entry.name !== 'golden-water-river')) {
    for (const tier of [-1, 1]) {
      reflectionEntries.push({
        x: rect.x,
        y: rect.y + 0.025,
        z: rect.z + tier * rect.d * 0.13,
        w: rect.w * (tier < 0 ? 0.24 : 0.16),
        d: rect.d * 0.2,
      });
    }
  }
  const reflectionMesh = new THREE.InstancedMesh(
    unitWater,
    mats.waterReflection,
    reflectionEntries.length,
  );
  reflectionMesh.name = 'imperial-golden-roof-water-reflections';
  reflectionMesh.renderOrder = 2;
  reflectionEntries.forEach((entry, index) => {
    matrixObject.position.set(entry.x, entry.y, entry.z);
    matrixObject.rotation.set(0, 0, 0);
    matrixObject.scale.set(entry.w, 1, entry.d);
    matrixObject.updateMatrix();
    reflectionMesh.setMatrixAt(index, matrixObject.matrix);
  });
  reflectionMesh.instanceMatrix.needsUpdate = true;
  group.add(reflectionMesh);
  anims.push((t) => {
    mats.water.opacity = 0.84 + Math.sin(t * 0.32) * 0.025;
    mats.waterReflection.opacity = 0.32 + Math.sin(t * 0.32 + 0.8) * 0.04;
  });

  function pointInsideWater(x, z) {
    return waterRects.some((rect) => (
      Math.abs(x - rect.x) < rect.w * 0.56
      && Math.abs(z - rect.z) < rect.d * 0.72
    ));
  }

  function pointInsideHall(x, z) {
    return [
      ...hallRegistry,
      ...flankingGateTowers,
      ...corridorRegistry,
      ...towerRegistry,
    ].some((spec) => (
      Math.abs(x - spec.x) < spec.w * 0.62 + 7
      && Math.abs(z - spec.z) < spec.d * 0.72 + 6
    ));
  }

  // R4 forest: the requested half-count is retained, but broader crossed-plane
  // crowns and fuller wall-side belts make the thousand trees read as gardens
  // rather than scattered spikes. Courtyard centres and the road remain open.
  const TREE_TARGET = 1000;
  const treeClusterCenters = [];
  for (let terraceIndex = 1; terraceIndex <= 7; terraceIndex++) {
    const terrace = terraces[terraceIndex];
    const clusterCount = 3 + terraceIndex % 3;
    for (let cluster = 0; cluster < clusterCount; cluster++) {
      const side = cluster % 2 === 0 ? -1 : 1;
      const front = cluster % 4 < 2 ? -1 : 1;
      treeClusterCenters.push({
        terraceIndex,
        x: side * terrace.width * (0.18 + 0.06 * (cluster % 3)),
        z: terrace.z + front * terrace.depth * 0.23,
      });
    }
  }
  for (const cluster of treeClusterCenters) {
    const terrace = terraces[cluster.terraceIndex];
    if (pointInsideWater(cluster.x, cluster.z)) continue;
    if (pointInsideHall(cluster.x, cluster.z)) continue;
    box(
      mats.gardenBed,
      cluster.x,
      terrace.y + 0.36,
      cluster.z,
      110,
      0.1,
      42,
    );
  }
  const treeEntries = [[], [], []];
  let treeAttempts = 0;
  let treePlaced = 0;
  while (treePlaced < TREE_TARGET && treeAttempts < TREE_TARGET * 80) {
    treeAttempts++;
    const cluster = treeClusterCenters[Math.floor(rnd() * treeClusterCenters.length)];
    const terraceIndex = cluster.terraceIndex;
    const terrace = terraces[terraceIndex];
    const x = cluster.x + (rnd() + rnd() - 1) * 58;
    const z = cluster.z + (rnd() + rnd() - 1) * 23;
    if (Math.abs(x) < roadWidthAt(terraceIndex) * 0.5 + 26) continue;
    if (pointInsideWater(x, z)) continue;
    if (pointInsideHall(x, z)) continue;
    const variant = treePlaced % 3;
    treeEntries[variant].push({
      x,
      y: terrace.y + 0.52,
      z,
      rotationY: rnd() * Math.PI * 2,
      scale: (0.8 + rnd() * 0.62) * 2.1,
    });
    treePlaced++;
  }

  const treeMeshes = treeEntries.map((entries, variant) => {
    const mesh = new THREE.InstancedMesh(
      pineGeometry(variant),
      mats.pineVertex,
      entries.length,
    );
    mesh.name = `imperial-pines-variant-${variant + 1}`;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    entries.forEach((entry, index) => {
      matrixObject.position.set(entry.x, entry.y, entry.z);
      matrixObject.rotation.set(0, entry.rotationY, 0);
      matrixObject.scale.setScalar(entry.scale);
      matrixObject.updateMatrix();
      mesh.setMatrixAt(index, matrixObject.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    return mesh;
  });

  // Small ceremonial groups provide scale without recreating the disliked
  // single-file procession. Ninety-six figures gather in asymmetric side
  // clusters; the central road stays empty and walkable.
  const figureBodyGeometry = new THREE.ConeGeometry(0.46, 2.15, 4, 1, false);
  const figureHeadGeometry = new THREE.TetrahedronGeometry(0.42, 0);
  const figureMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    vertexColors: true,
  });
  const figureCourts = [
    { terrace: 0, x: -178, z: 330 },
    { terrace: 0, x: 182, z: 318 },
    { terrace: 2, x: -156, z: 150 },
    { terrace: 2, x: 166, z: 134 },
    { terrace: 4, x: -328, z: -28 },
    { terrace: 4, x: 318, z: -52 },
  ];
  const figureEntries = [];
  const figureColours = [0x772d2a, 0x314459, 0xb28232, 0x403633];
  for (const court of figureCourts) {
    const terrace = terraces[court.terrace];
    let placed = 0;
    let attempts = 0;
    while (placed < 16 && attempts < 160) {
      attempts++;
      const x = court.x + (rnd() - 0.5) * 54;
      const z = court.z + (rnd() - 0.5) * 34;
      if (Math.abs(x) < ROAD_W * 0.5 + 18) continue;
      if (pointInsideWater(x, z) || pointInsideHall(x, z)) continue;
      figureEntries.push({
        x,
        y: terrace.y + 0.58,
        z,
        ry: rnd() * Math.PI * 2,
        scale: 0.82 + rnd() * 0.28,
        colour: figureColours[(placed + court.terrace) % figureColours.length],
      });
      placed++;
    }
  }
  const figureBodies = new THREE.InstancedMesh(
    figureBodyGeometry,
    figureMaterial,
    figureEntries.length,
  );
  const figureHeads = new THREE.InstancedMesh(
    figureHeadGeometry,
    figureMaterial,
    figureEntries.length,
  );
  figureBodies.name = 'imperial-ceremonial-groups-bodies';
  figureHeads.name = 'imperial-ceremonial-groups-heads';
  figureEntries.forEach((entry, index) => {
    matrixObject.position.set(entry.x, entry.y + 1.08 * entry.scale, entry.z);
    matrixObject.rotation.set(0, entry.ry, 0);
    matrixObject.scale.setScalar(entry.scale);
    matrixObject.updateMatrix();
    figureBodies.setMatrixAt(index, matrixObject.matrix);
    matrixObject.position.set(entry.x, entry.y + 2.38 * entry.scale, entry.z);
    matrixObject.rotation.set(0, entry.ry, 0);
    matrixObject.scale.setScalar(entry.scale);
    matrixObject.updateMatrix();
    figureHeads.setMatrixAt(index, matrixObject.matrix);
    const colour = new THREE.Color(entry.colour);
    figureBodies.setColorAt(index, colour);
    figureHeads.setColorAt(index, colour.clone().offsetHSL(0, -0.16, 0.16));
  });
  figureBodies.instanceMatrix.needsUpdate = true;
  figureHeads.instanceMatrix.needsUpdate = true;
  if (figureBodies.instanceColor) figureBodies.instanceColor.needsUpdate = true;
  if (figureHeads.instanceColor) figureHeads.instanceColor.needsUpdate = true;
  group.add(figureBodies, figureHeads);

  // -------------------------------------------------------------------------
  // Stage 5 — five stable sculpture interfaces. One fallback InstancedMesh is
  // kept per type. Successful GLB loading hides that type's fallback and mounts
  // a normalized clone at every named anchor; failures are intentionally quiet.
  const sculptureTypes = ['lion', 'huabiao', 'censer', 'turtle', 'crane'];
  const sculptureFiles = {
    lion: '../models/imperial/lion.glb',
    huabiao: '../models/imperial/huabiao.glb',
    censer: '../models/imperial/censer.glb',
    turtle: '../models/imperial/turtle.glb',
    crane: '../models/imperial/crane.glb',
  };
  const sculptureTargetSize = {
    lion: 8.0,
    huabiao: 20.0,
    censer: 9.0,
    turtle: 7.0,
    crane: 16.0,
  };
  const placeholderMeshes = {};

  for (const type of sculptureTypes) {
    const matching = statueAnchors.filter((node) => node.userData.type === type);
    const material = type === 'lion' || type === 'huabiao'
      ? mats.marble
      : mats.bronze;
    const mesh = new THREE.InstancedMesh(
      placeholderGeometry(type),
      material,
      matching.length,
    );
    mesh.name = `imperial-placeholder-${type}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    matching.forEach((node, index) => {
      matrixObject.position.copy(node.position);
      matrixObject.rotation.copy(node.rotation);
      matrixObject.scale.setScalar(node.userData.scale || 1);
      matrixObject.updateMatrix();
      mesh.setMatrixAt(index, matrixObject.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    placeholderMeshes[type] = mesh;
  }

  async function loadImperialSculptures() {
    let GLTFLoader;
    try {
      ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
    } catch {
      return { loaded: [], skipped: [...sculptureTypes] };
    }
    const loader = new GLTFLoader();
    const loaded = [];
    const skipped = [];

    await Promise.all(sculptureTypes.map(async (type) => {
      try {
        const gltf = await loader.loadAsync(sculptureFiles[type]);
        const source = gltf.scene;
        source.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(source);
        const size = bounds.getSize(new THREE.Vector3());
        const centre = bounds.getCenter(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z, 0.001);
        const baseScale = sculptureTargetSize[type] / maxSize;
        const matching = statueAnchors.filter((node) => node.userData.type === type);

        for (const node of matching) {
          const wrapper = new THREE.Group();
          wrapper.name = `imperial-sculpture-${type}-${node.userData.side}`;
          wrapper.position.copy(node.position);
          wrapper.rotation.copy(node.rotation);
          const clone = source.clone(true);
          const scale = baseScale * (node.userData.scale || 1);
          clone.scale.setScalar(scale);
          clone.position.set(
            -centre.x * scale,
            -bounds.min.y * scale,
            -centre.z * scale,
          );
          clone.traverse((object) => {
            if (!object.isMesh) return;
            object.castShadow = true;
            object.receiveShadow = true;
          });
          wrapper.add(clone);
          group.add(wrapper);
        }
        placeholderMeshes[type].visible = false;
        loaded.push(type);
      } catch {
        skipped.push(type);
      }
    }));

    return { loaded, skipped };
  }

  const sculptureLoadPromise = loadImperialSculptures();

  // -------------------------------------------------------------------------
  // Stage 6 — night vocabulary: instanced lanterns, warm window apertures,
  // eight engine-driven point lights and two thin incense-smoke columns.
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0x8f2d1f,
    roughness: 0.48,
    metalness: 0.02,
    emissive: 0xff7a25,
    emissiveIntensity: 0.08,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x5f3420,
    roughness: 0.56,
    metalness: 0.0,
    emissive: 0xffa13a,
    emissiveIntensity: 0.08,
  });
  const towerOutlineMat = new THREE.MeshStandardMaterial({
    color: 0x6b4a22,
    roughness: 0.52,
    metalness: 0.04,
    emissive: 0xffa33f,
    emissiveIntensity: 0.05,
  });
  group.userData.nightMats.push(lanternMat, windowMat, towerOutlineMat);

  for (const spec of towerRegistry.filter((entry) => entry.nightOutline)) {
    const c = Math.cos(spec.rotationY || 0);
    const s = Math.sin(spec.rotationY || 0);
    const world = (lx, lz) => ({
      x: spec.x + lx * c + lz * s,
      z: spec.z - lx * s + lz * c,
    });
    for (const localZ of [-spec.outlineRoofD * 0.5, spec.outlineRoofD * 0.5]) {
      const edge = world(0, localZ);
      box(
        towerOutlineMat,
        edge.x,
        spec.outlineY,
        edge.z,
        spec.outlineRoofW,
        0.28,
        0.34,
        spec.rotationY || 0,
      );
    }
    for (const localX of [-spec.outlineRoofW * 0.5, spec.outlineRoofW * 0.5]) {
      const edge = world(localX, 0);
      box(
        towerOutlineMat,
        edge.x,
        spec.outlineY,
        edge.z,
        0.34,
        0.28,
        spec.outlineRoofD,
        spec.rotationY || 0,
      );
    }
  }

  const litHalls = [
    ...hallRegistry,
    ...flankingGateTowers,
    ...corridorRegistry,
    ...towerRegistry.filter((spec) => spec.nightWindows),
  ];
  const lanternEntries = [];
  const windowEntries = [];

  for (const spec of litHalls) {
    const c = Math.cos(spec.rotationY || 0);
    const s = Math.sin(spec.rotationY || 0);
    const lanternCount = Math.max(4, spec.bays + 1);
    for (let i = 0; i < lanternCount; i++) {
      const lx = -spec.bodyW * 0.46 + spec.bodyW * 0.92 * i / Math.max(1, lanternCount - 1);
      const lz = spec.bodyD * 0.5 + 0.75;
      lanternEntries.push({
        x: spec.x + lx * c + lz * s,
        y: spec.lanternY,
        z: spec.z - lx * s + lz * c,
        rotationY: spec.rotationY || 0,
        scale: spec.name.includes('summit') ? 1.45 : 0.86,
      });
    }

    const windowCount = Math.max(3, spec.bays);
    for (let i = 0; i < windowCount; i++) {
      const lx = -spec.bodyW * 0.39 + spec.bodyW * 0.78 * (i + 0.5) / windowCount;
      const lz = spec.bodyD * 0.445;
      windowEntries.push({
        x: spec.x + lx * c + lz * s,
        y: spec.bodyBase + spec.bodyH * 0.44,
        z: spec.z - lx * s + lz * c,
        rotationY: spec.rotationY || 0,
        sx: Math.max(0.8, spec.bodyW / windowCount * 0.38),
        sy: Math.max(1.45, spec.bodyH * 0.24),
      });
    }
  }

  const lanternGeometry = new THREE.CylinderGeometry(0.48, 0.42, 1.25, 6, 1, false);
  const lanternMesh = new THREE.InstancedMesh(
    lanternGeometry,
    lanternMat,
    lanternEntries.length,
  );
  lanternMesh.name = 'imperial-lantern-array';
  lanternEntries.forEach((entry, index) => {
    matrixObject.position.set(entry.x, entry.y, entry.z);
    matrixObject.rotation.set(0, entry.rotationY, 0);
    matrixObject.scale.setScalar(entry.scale);
    matrixObject.updateMatrix();
    lanternMesh.setMatrixAt(index, matrixObject.matrix);
  });
  lanternMesh.instanceMatrix.needsUpdate = true;
  group.add(lanternMesh);

  const windowMesh = new THREE.InstancedMesh(
    UNIT_BOX,
    windowMat,
    windowEntries.length,
  );
  windowMesh.name = 'imperial-warm-windows';
  windowEntries.forEach((entry, index) => {
    matrixObject.position.set(entry.x, entry.y, entry.z);
    matrixObject.rotation.set(0, entry.rotationY, 0);
    matrixObject.scale.set(entry.sx, entry.sy, 0.24);
    matrixObject.updateMatrix();
    windowMesh.setMatrixAt(index, matrixObject.matrix);
  });
  windowMesh.instanceMatrix.needsUpdate = true;
  group.add(windowMesh);

  const pointLightSites = [
    [-62, terraces[6].y + 8, terraces[6].z + 16],
    [62, terraces[6].y + 8, terraces[6].z + 16],
    [-92, terraces[7].y + 12, terraces[7].z],
    [92, terraces[7].y + 12, terraces[7].z],
    [-46, terraces[8].y + 19, terraces[8].z + 18],
    [46, terraces[8].y + 19, terraces[8].z + 18],
    ...towerRegistry
      .filter((spec) => spec.instrument)
      .map((spec) => [spec.x, spec.bodyBase + spec.bodyH + 6, spec.z]),
  ];
  for (const site of pointLightSites) {
    const point = new THREE.PointLight(0xffb45f, 0, 92, 2);
    point.position.set(...site);
    point.name = 'imperial-night-point';
    group.add(point);
    lights.push(point);
  }

  // Two censers × eighteen low-poly wisps. The spheres stretch and drift upward
  // in one dynamic InstancedMesh: one draw call and no Points/ShaderMaterial.
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0xc7c0b2,
    roughness: 1.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.17,
    depthWrite: false,
  });
  const smokeGeometry = new THREE.IcosahedronGeometry(0.42, 0);
  const censerAnchors = statueAnchors.filter((node) => node.userData.type === 'censer');
  const smokeStates = [];
  for (const node of censerAnchors) {
    for (let i = 0; i < 18; i++) {
      smokeStates.push({
        origin: node.position.clone().add(new THREE.Vector3(0, 7.4, 0)),
        phase: i / 18,
        drift: (rnd() - 0.5) * 1.6,
        sway: rnd() * Math.PI * 2,
      });
    }
  }
  const smokeMesh = new THREE.InstancedMesh(
    smokeGeometry,
    smokeMat,
    smokeStates.length,
  );
  smokeMesh.name = 'imperial-censer-smoke';
  smokeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  smokeMesh.frustumCulled = false;
  group.add(smokeMesh);
  anims.push((t) => {
    smokeStates.forEach((state, index) => {
      const u = (state.phase + t * 0.035) % 1;
      const y = u * 34;
      matrixObject.position.set(
        state.origin.x + Math.sin(t * 0.22 + state.sway + u * 5.0) * (0.4 + u * 2.2) + state.drift * u,
        state.origin.y + y,
        state.origin.z + Math.cos(t * 0.18 + state.sway + u * 4.0) * (0.35 + u * 1.6),
      );
      matrixObject.rotation.set(t * 0.05 + state.sway, u * 2.0, 0);
      matrixObject.scale.set(
        0.5 + u * 2.1,
        1.7 + u * 4.2,
        0.5 + u * 2.1,
      );
      matrixObject.updateMatrix();
      smokeMesh.setMatrixAt(index, matrixObject.matrix);
    });
    smokeMesh.instanceMatrix.needsUpdate = true;
  });

  flushBoxes();
  flushColumns();
  flushRoofRibs();
  flushArchFaces();

  // Contract arrays are consumed directly by the viewer.
  group.userData.imperial = {
    stage: 6,
    visualRevision: '6',
    north: NORTH.toArray(),
    bounds: {
      width: 1200,
      depth: 800,
      south: 400,
      north: -400,
      baseY: TERRAIN_Y,
    },
    terraces: terraces.map((t) => ({
      stage: t.stage,
      z: t.z,
      width: t.width,
      depth: t.depth,
      topY: t.y,
    })),
    roadWidth: ROAD_W,
    imperialRoadDarkBandWidth: 8,
    terraceVisuals: {
      parapetHeight: 5,
      pitchedCaps: parapetCapEntries.length,
      balustradeSpacing: 12,
      balustradePosts: terraceRailPosts.length,
      wallBaseAOMultiplier: 0.75,
      wallBaseAOHeightRatio: 0.15,
    },
    halls: hallRegistry,
    flankingGateTowers,
    towerFamilies: {
      outerCornerTowers: towerRegistry.filter((spec) => spec.towerFamily === 'outerCornerTowers').length,
      queTowers: towerRegistry.filter((spec) => spec.towerFamily === 'queTowers').length,
      bellDrumTowers: towerRegistry.filter((spec) => spec.towerFamily === 'bellDrumTowers').length,
      upperPagodas: towerRegistry.filter((spec) => spec.towerFamily === 'upperPagodas').length,
      terraceCornerPavilions: towerRegistry.filter((spec) => spec.towerFamily === 'terraceCornerPavilions').length,
      heightCapRatio: 0.75,
      tallestRatio: Math.max(...towerRegistry.map((spec) => spec.heightRatio)),
      cornerTowerTriangleLimit: 6000,
      cornerTowerMaxTriangles: Math.max(
        ...towerRegistry
          .filter((spec) => spec.towerFamily === 'outerCornerTowers')
          .map((spec) => spec.estimatedTriangles),
      ),
      summitTopY: summitSpec.topY,
      towers: towerRegistry.map((spec) => ({
        name: spec.name,
        family: spec.towerFamily,
        topY: spec.topY,
        heightRatio: spec.heightRatio,
        estimatedTriangles: spec.estimatedTriangles,
      })),
    },
    axisClearance: {
      roadWidthSouth: ROAD_W,
      roadWidthSummit: roadWidthAt(terraces.length - 1),
      minimumBuildingBuffer: 9.5,
      gateLayout: 'five paired east-west towers; no central architecture',
      retainingWallsSplitAtAxis: true,
      terraceFrontOpeningMargin: 8,
      continuousStairFlights: terraces.length - 1,
    },
    axisInspectionPath: {
      points: axisInspectionPoints,
      checkpoints: axisInspectionCheckpoints,
      totalDistance: axisInspectionStartZ - axisInspectionEndZ,
      sampleSpacing: 5,
      checkpointSpacing: 50,
      eyeHeight: 1.72,
      stairFlights: axisStairFlights,
      targetRiser: AXIS_RISER_TARGET,
      targetTread: AXIS_TREAD,
      maximumRiser: axisMaximumRiser,
      maximumSampleHeightDelta: maxInspectionHeightDelta,
      platformGapCount: axisPlatformGapCount,
      obstructionCount: axisBuildingObstructions.length,
      obstructionNames: axisBuildingObstructions.map((spec) => spec.name),
      summitStair: {
        steps: summitStairSteps,
        riser: summitStairRiser,
        tread: summitStairTread,
        lowerZ: summitStairLowerZ,
        upperZ: summitStairUpperZ,
      },
    },
    architecturalDetail: {
      glazedRoofRibs: roofRibEntries.length,
      roofProfileRows: 6,
      columnHeightMultiplier: 1.1,
      podiumCourseHeight: 1.68,
      summitPodiumCourseHeight: 2.5,
      frontColumnBases: 'white-stone drum bases on every detailed front column',
      bracketRhythm: 'paired teal and dark blocks at every detailed facade bay',
      gatePodiums: 'two to three white-stone courses with solid balustrade rails',
      waterCourts: waterRects.length,
      waterRoughness: 0.15,
      mergedWaterFrameTriangles: waterFrameIndices.length / 3,
      goldenReflectionBands: reflectionEntries.length,
    },
    corridors: corridorRegistry,
    buildingAssembly: {
      prototypes: Object.keys(buildingBlueprints),
      placed: buildingAssemblyAnchors.length,
      anchors: buildingAssemblyAnchors.map((node) => ({
        name: node.name,
        prototype: node.userData.prototype,
        geometryName: node.userData.geometryName,
      })),
    },
    water: waterRects.map((rect) => rect.name),
    trees: {
      requested: TREE_TARGET,
      placed: treePlaced,
      variants: treeMeshes.length,
      trianglesPerTree: 4,
    },
    figures: {
      placed: figureEntries.length,
      arrangement: 'asymmetric side-court groups; central axis clear',
    },
    sculptureFiles,
    sculptureLoadPromise,
    sculpturePlaceholders: sculptureTypes,
    night: {
      lanterns: lanternEntries.length,
      windows: windowEntries.length,
      pointLights: pointLightSites.length,
      smokeWisps: smokeStates.length,
    },
    bridges: goldenBridges.map((bridge) => bridge.name),
    bridgeDetail: {
      count: goldenBridges.length,
      archesPerBridge: 5,
      riverWidth: 42,
      centreRise: 3.2,
      flankRise: 3.6,
      steppedApproaches: true,
    },
    anchors: statueAnchors.map((node) => ({
      name: node.name,
      type: node.userData.type,
      side: node.userData.side,
      position: node.position.toArray(),
    })),
    hallGenerator: {
      signature: 'hall({ bays, eaves, podium, w, d })',
      notes: 'R5 tower families remain hall() specializations using cross-ridge, octagonal-roof, tapered-pier, arched-story and finial parameters.',
    },
    budget: {
      triangles: 170000,
      drawCalls: 120,
      pointLights: 8,
    },
    statsHint: 'Use dev preview HUD for measured triangles and draw calls.',
  };

  group.userData.anims = anims;
  group.userData.lights = lights;
  console.info('[imperial-city] stage 6 visual revision 6 closure pass built', group.userData.imperial);
}
