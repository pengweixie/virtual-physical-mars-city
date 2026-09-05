// Layer-specific validation. Run from any directory: node <this file>.
// Counts all procedural instances, independent of visibility/frustum culling.
import * as THREE from 'three';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { build } from '../../../viewer/imperial/imperial-city.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const metadata = JSON.parse(await readFile(resolve(root, 'data/processed/meta.json'), 'utf8'));
const heightBytes = await readFile(resolve(root, 'data/processed/heights.bin'));
const heights = new Uint16Array(heightBytes.buffer, heightBytes.byteOffset, heightBytes.byteLength / 2);
const card = JSON.parse(await readFile(resolve(root, 'viewer/imperial/imperial-city.info.json'), 'utf8'));
function terrain(x, z) {
  const { grid, size_m, elev_max_m, elev_min_m } = metadata;
  const fx = THREE.MathUtils.clamp((x / size_m + .5) * (grid - 1), 0, grid - 1.001);
  const fz = THREE.MathUtils.clamp((z / size_m + .5) * (grid - 1), 0, grid - 1.001);
  const c = Math.floor(fx), r = Math.floor(fz), tx = fx - c, tz = fz - r;
  const h = (rr, cc) => heights[rr * grid + cc] / 65535 * (elev_max_m - elev_min_m);
  return (h(r,c) * (1-tx) + h(r,c+1) * tx) * (1-tz)
    + (h(r+1,c) * (1-tx) + h(r+1,c+1) * tx) * tz;
}
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
function meshBounds(group, animatedOnly = false) {
  const total = new THREE.Box3(), box = new THREE.Box3();
  const instance = new THREE.Matrix4(), matrix = new THREE.Matrix4();
  group.updateWorldMatrix(true, true);
  group.traverse(node => {
    if (!node.isMesh || (animatedOnly && node.name !== 'imperial-censer-smoke')) return;
    node.geometry.computeBoundingBox();
    for (let i = 0; i < (node.isInstancedMesh ? node.count : 1); i++) {
      if (node.isInstancedMesh) { node.getMatrixAt(i, instance); matrix.multiplyMatrices(node.matrixWorld, instance); }
      else matrix.copy(node.matrixWorld);
      total.union(box.copy(node.geometry.boundingBox).applyMatrix4(matrix));
    }
  });
  return total;
}
const serialBox = box => ({ min: box.min.toArray(), max: box.max.toArray(), size: box.getSize(new THREE.Vector3()).toArray() });
async function inspect(label, site, sampleHeight) {
  const group = new THREE.Group(), anims = [], lights = [];
  const parent = new THREE.Group();
  parent.add(group);
  group.position.set(...site);
  const originalInfo = console.info;
  console.info = () => {};
  try { build({ THREE, group, anims, lights, sampleHeight, sunDirUniform: { value: new THREE.Vector3(-.78,.423,.46).normalize() } }); }
  finally { console.info = originalInfo; }
  const sculptures = await group.userData.imperial.sculptureLoadPromise;
  anims.forEach(fn => fn(0, 0));
  group.updateWorldMatrix(true, true);
  const data = group.userData.imperial, path = data.axisInspectionPath;
  let triangles = 0, meshes = 0;
  const forbiddenLights = [], invalidMaterials = [], colliders = [];
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const instance = new THREE.Matrix4(), matrix = new THREE.Matrix4(), box = new THREE.Box3();
  group.traverse(node => {
    if (node.isLight && !node.isPointLight) forbiddenLights.push(node.type);
    if (!node.isMesh) return;
    meshes++;
    triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3 * (node.isInstancedMesh ? node.count : 1);
    for (const mat of [].concat(node.material)) if (!mat.isMeshStandardMaterial && !mat.isMeshLambertMaterial) invalidMaterials.push(mat.type);
    node.geometry.computeBoundingBox();
    for (let i = 0; i < (node.isInstancedMesh ? node.count : 1); i++) {
      if (node.isInstancedMesh) { node.getMatrixAt(i, instance); matrix.multiplyMatrices(node.matrixWorld, instance); }
      else matrix.copy(node.matrixWorld);
      box.copy(node.geometry.boundingBox).applyMatrix4(matrix);
      if (box.min.x > site[0] || box.max.x < site[0] || box.min.z > site[2] + path.points[0].z || box.max.z < site[2] + path.points.at(-1).z) continue;
      const mesh = new THREE.Mesh(node.geometry, material);
      mesh.matrixAutoUpdate = false;
      mesh.matrixWorld.copy(matrix);
      mesh.name = node.name;
      colliders.push(mesh);
    }
  });
  const ray = new THREE.Raycaster();
  function hitAt(z, ceiling = data.towerFamilies.summitTopY + 100) {
    ray.set(new THREE.Vector3(site[0], ceiling + site[1], site[2] + z), new THREE.Vector3(0,-1,0));
    return ray.intersectObjects(colliders, false).find(hit => Math.abs(hit.face?.normal.y ?? 0) > .5);
  }
  const mismatches = [...path.points, ...path.checkpoints].filter(p => {
    const hit = hitAt(p.z, p.y + .4);
    return !hit || Math.abs(hit.point.y - site[1] - p.y) > .08;
  });
  let previous = null, previousMesh = '', maxStep = 0, terrainIntrusions = 0, tested = 0;
  const gaps = [];
  for (let z = path.points[0].z; z >= path.points.at(-1).z; z -= .1) {
    tested++;
    const hit = hitAt(z);
    if (!hit) { gaps.push({ z, reason: 'no mesh' }); previous = null; continue; }
    if (previous !== null) {
      const delta = Math.abs(hit.point.y - previous);
      maxStep = Math.max(delta, maxStep);
      if (delta > .45) gaps.push({ z, delta, from:previousMesh, to:hit.object.name, fromY:previous, toY:hit.point.y });
    }
    if (sampleHeight(0,z) > hit.point.y - site[1] + .05) terrainIntrusions++;
    previous = hit.point.y;
    previousMesh = hit.object.name;
  }
  const initialBounds = meshBounds(group);
  const envelope = initialBounds.clone();
  const smokeEnvelope = new THREE.Box3();
  let finiteAnimation = true;
  for (let frame = 0; frame <= 600; frame++) {
    anims.forEach(fn => fn(frame / 10, .1));
    const smoke = meshBounds(group, true);
    smokeEnvelope.union(smoke);
    finiteAnimation &&= [...smoke.min.toArray(), ...smoke.max.toArray()].every(Number.isFinite);
  }
  envelope.union(smokeEnvelope);
  const anchorChecks = card.pois.map(p => ({ id:p.id, exists:!!group.getObjectByName('poi_'+p.id), bilingual: ['label','label_en','detail','detail_en','specs','specs_en','sim','sim_en'].every(key => !!p[key]) }));
  check(triangles <= 170000, label + ': triangle budget');
  check(lights.length <= 8 && forbiddenLights.length === 0, label + ': lights contract');
  check(invalidMaterials.length === 0, label + ': materials contract');
  check(data.halls[0].eaves === 3 && data.towerFamilies.tallestRatio <= .75, label + ': skyline contract');
  check(mismatches.length === 0 && gaps.length === 0, label + ': mesh traversal');
  check(terrainIntrusions === 0, label + ': terrain above axis');
  check(finiteAnimation && anims.length > 0, label + ': animation finite');
  check(card.pois.length >= 3 && card.pois.length <= 8 && anchorChecks.every(p => p.exists && p.bilingual), label + ': cards');
  return { label, siteTranslation: site, baseY: data.bounds.baseY, revision:data.visualRevision,
    triangles, meshes, lights:lights.length, anims:anims.length, nightMats:group.userData.nightMats.length,
    forbiddenLights, invalidMaterials, anchorChecks, optionalSculptures:sculptures,
    boundsWorldAtT0:serialBox(initialBounds), animationEnvelopeWorld60s:serialBox(envelope),
    smokeEnvelopeWorld60s:serialBox(smokeEnvelope), animationDt:.1, finiteAnimation,
    skyline:{summitTopY:data.towerFamilies.summitTopY, tallestTowerRatio:data.towerFamilies.tallestRatio},
    axis:{length:path.totalDistance, checkedEveryMetres:.1, tested, pathSamples:path.points.length,
      checkpoints:path.checkpoints.length, mismatches:mismatches.length, gaps:gaps.slice(0,20),
      maxHeightChangePer10cm:maxStep, terrainIntrusions},
    checkpointPositions:path.checkpoints };
}
const runs = [await inspect('flat-origin', [0,0,0], () => 0),
  await inspect('main-site-real-terrain', [1100,0,-800], (x,z) => terrain(x+1100,z-800))];
const hashes = {};
for (const path of ['viewer/imperial/imperial-city.js', 'viewer/imperial/imperial-city.info.json', 'viewer/main.js', 'data/processed/heights.bin']) {
  hashes[path] = createHash('sha256').update(await readFile(resolve(root,path))).digest('hex');
}
const result = { timestamp:new Date().toISOString(), passed:failures.length === 0, failures, hashes, runs,
  scope:'CPU validation of delivered module; instance-multiplied triangles and real mesh raycasts. GPU draws/FPS require browser smoke. Animation envelope is sampled for 60 s at 0.1 s, not an analytic all-time bound.' };
await writeFile(resolve(here,'validate-r7.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:result.passed,failures,runs:runs.map(({checkpointPositions,...run}) => run)},null,2));
if (failures.length) process.exitCode = 1;
