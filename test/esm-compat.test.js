import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

test('id-broker source uses ESM import instead of require', () => {
  const source = read('src/utils/id-broker.js');
  assert.match(source, /import\s+shortid\s+from\s+["']shortid["']/);
  assert.doesNotMatch(source, /require\(["']shortid["']\)/);
});

test('graph helpers source uses ESM default exports', () => {
  const graph = read('src/utils/graph.js');
  const edges = read('src/utils/get-edges-of-subgraphs.js');
  const cycles = read('src/utils/graph-cycles.js');

  assert.match(graph, /export default Graph;/);
  assert.doesNotMatch(graph, /module\.exports\s*=\s*Graph/);

  assert.match(edges, /export default getEdgesOfSubgraphs;/);
  assert.doesNotMatch(edges, /module\.exports\s*=\s*getEdgesOfSubgraphs/);

  assert.match(cycles, /export default find_inner_cycles;/);
  assert.doesNotMatch(cycles, /module\.exports\s*=\s*find_inner_cycles/);
});

test('viewer2d source avoids circular imports through export barrel', () => {
  const scene = read('src/components/viewer2d/scene.jsx');
  const layer = read('src/components/viewer2d/layer.jsx');
  const viewer2d = read('src/components/viewer2d/viewer2d.jsx');

  assert.doesNotMatch(scene, /from ["']\.\/export["']/);
  assert.doesNotMatch(layer, /from ["']\.\/export["']/);
  assert.doesNotMatch(viewer2d, /from ["']\.\/export["']/);
});

test('viewer3d loader source uses ESM imports and exports', () => {
  const mtl = read('src/components/viewer3d/libs/mtl-loader.js');
  const obj = read('src/components/viewer3d/libs/obj-loader.js');
  const orbit = read('src/components/viewer3d/libs/orbit-controls.js');
  const pointer = read('src/components/viewer3d/libs/pointer-lock-controls.js');

  for (const source of [mtl, obj, orbit, pointer]) {
    assert.match(source, /import\s+\*\s+as\s+THREE_MODULE\s+from\s+["']three["']/);
    assert.doesNotMatch(source, /require\(["']three["']\)/);
  }

  assert.match(mtl, /export default MTLLoader;/);
  assert.match(obj, /export default OBJLoader;/);
  assert.match(orbit, /export default OrbitControls;/);
  assert.match(pointer, /export default PointerLockControls;/);
});
