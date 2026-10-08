// Fix-up: preserve upstream relative dependency filenames for every vendored glTF.
// Root cause of shrine_green crash: gltf references building_shrine_green.bin,
// but vendor saved it as shrine_green.bin; textures were never vendored at all.
// This script downloads each missing buffer/image dep from its upstream pack dir
// under the EXACT referenced name. Run: node scripts/vendor-deps.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV = 'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main';
const PROPS = 'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main';

// upstream directory holding each gltf's sibling deps
const UPSTREAM_DIR = {
  'Tree_1_A_Color1.gltf': `${ENV}/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1`,
  'Tree_1_B_Color1.gltf': `${ENV}/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1`,
  'Tree_1_C_Color1.gltf': `${ENV}/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1`,
  'Bush_1_A_Color1.gltf': `${ENV}/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1`,
  'Grass_1_A_Color1.gltf': `${ENV}/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1`,
  'Rock_1_A_Color1.gltf': `${ENV}/assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1`,
  'pillar.gltf': `${ENV}/assets/kaykit/dungeon-remastered-1.1/Assets/gltf`,
  'banner_blue.gltf': `${ENV}/assets/kaykit/dungeon-remastered-1.1/Assets/gltf`,
  'wall_gated.gltf': `${ENV}/assets/kaykit/dungeon-remastered-1.1/Assets/gltf`,
  'shrine_green.gltf': `${ENV}/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/green`,
  'barrel.gltf': `${PROPS}/assets/kaykit/block-bits-1.0/Assets/gltf`,
  'chest.gltf': `${PROPS}/assets/kaykit/block-bits-1.0/Assets/gltf`,
  'stone.gltf': `${PROPS}/assets/kaykit/block-bits-1.0/Assets/gltf`,
  'Gem_Medium.gltf': `${PROPS}/assets/kaykit/resource-bits-1.0/Assets/gltf`,
  'lantern.gltf': `${PROPS}/assets/kaykit/holiday-bits-1.0/Assets/gltf`,
};

// shared pack textures live under fbx(unity) dirs upstream; gltfs reference them by bare filename
const TEXTURE_UPSTREAM = {
  'forest_texture.png': `${ENV}/assets/kaykit/forest-nature-pack-1.0/Assets/fbx(unity)/Color1/forest_texture.png`,
  'dungeon_texture.png': `${ENV}/assets/kaykit/dungeon-remastered-1.1/Assets/fbx(unity)/dungeon_texture.png`,
  'hexagons_medieval.png': `${ENV}/assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/fbx(unity)/buildings/blue/hexagons_medieval.png`,
  'block_bits_texture.png': `${PROPS}/assets/kaykit/block-bits-1.0/Assets/fbx(unity)/block_bits_texture.png`,
  'resource_bits_texture.png': `${PROPS}/assets/kaykit/resource-bits-1.0/Assets/fbx(unity)/resource_bits_texture.png`,
  'holiday_bits_texture.png': `${PROPS}/assets/kaykit/holiday-bits-1.0/Assets/fbx(unity)/holiday_bits_texture.png`,
};

async function fetchBuf(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const gltfs = walk(join(root, 'public/models')).filter((f) => f.endsWith('.gltf'));
let fixed = 0;
for (const f of gltfs) {
  const name = f.split(/[/\\]/).pop();
  const base = UPSTREAM_DIR[name];
  if (!base) { console.log('no upstream map for', name); continue; }
  const g = JSON.parse(readFileSync(f, 'utf8'));
  const deps = [...(g.buffers || []).map((b) => b.uri), ...(g.images || []).map((i) => i.uri).filter((u) => u && !u.startsWith('data:'))];
  for (const dep of new Set(deps)) {
    const local = join(dirname(f), dep);
    if (existsSync(local) && statSync(local).size > 500) continue;
    // 1) same-name file already vendored under a different name (shrine bin case) → copy
    const sameBytes = walk(join(root, 'public/models')).find(
      (c) => c.endsWith('.bin') && statSync(c).size === (g.buffers.find((b) => b.uri === dep)?.byteLength ?? -1),
    );
    if (sameBytes && dep.endsWith('.bin')) {
      copyFileSync(sameBytes, local);
      console.log(`copied ${sameBytes} -> ${local}`);
      fixed++;
      continue;
    }
    // 2) download: textures from TEXTURE_UPSTREAM, bins from sibling upstream dir
    const url = dep.endsWith('.png') ? TEXTURE_UPSTREAM[dep] : `${base}/${dep}`;
    if (!url) throw new Error(`no upstream URL for ${dep}`);
    mkdirSync(dirname(local), { recursive: true });
    writeFileSync(local, await fetchBuf(url));
    console.log(`downloaded ${dep} -> ${local}`);
    fixed++;
  }
}
console.log(`done, fixed ${fixed} deps`);
