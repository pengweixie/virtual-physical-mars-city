// Export each code-asset unit to a temp GLB for a visual preview render.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

globalThis.FileReader = class {
  readAsArrayBuffer(b) { b.arrayBuffer().then((r) => { this.result = r; this.onloadend && this.onloadend(); }); }
  readAsDataURL(b) { b.arrayBuffer().then((r) => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(r).toString('base64'); this.onloadend && this.onloadend(); }); }
};

const OUT = process.argv[2] || '.';
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..', 'viewer', 'units');

for (const id of ['pwr-fusion-01', 'pwr-radiator-01']) {
  const { build } = await import(pathToFileURL(path.join(dir, id + '.js')).href);
  const g = build(THREE);
  await new Promise((res, rej) => {
    new GLTFExporter().parse(g, (r) => {
      fs.writeFileSync(path.join(OUT, id + '.glb'), Buffer.from(r));
      console.log('wrote', id + '.glb');
      res();
    }, rej, { binary: true });
  });
}
