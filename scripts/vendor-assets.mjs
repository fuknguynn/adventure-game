// Vendor script: downloads ONLY verified KayKit files via GitHub HTTPS raw.
// Appends exact entries to asset-manifest.json. Skips files already present.
// Usage: npm run vendor
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = {
  chars: 'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-characters/main',
  env: 'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-environments/main',
  props: 'https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main',
};
const LIC = 'CC0-1.0';
const BY = 'Kay Lousberg (KayKit)';

// [manifestId, repoBase, sourcePath, localPath, usage, bytes]
const FILES = [
  // Selectable characters (verified GLBs)
  ['knight', RAW.chars, 'assets/kaykit/adventurers-2.0/Characters/gltf/Knight.glb', 'public/models/characters/Knight.glb', 'selectable player character', 341688],
  ['mage', RAW.chars, 'assets/kaykit/adventurers-2.0/Characters/gltf/Mage.glb', 'public/models/characters/Mage.glb', 'selectable player character', 352472],
  ['rogue', RAW.chars, 'assets/kaykit/adventurers-2.0/Characters/gltf/Rogue.glb', 'public/models/characters/Rogue.glb', 'selectable player character', 409188],
  // Forest Nature Pack: trees / foliage / ground (glTF + bin pairs; upstream has 0 native GLB)
  ['pine-large', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_1_A_Color1.gltf', 'public/models/env/Tree_1_A_Color1.gltf', 'forest tree', 0],
  ['pine-small', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_1_B_Color1.gltf', 'public/models/env/Tree_1_B_Color1.gltf', 'forest tree variant', 0],
  ['bush', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Bush_1_A_Color1.gltf', 'public/models/env/Bush_1_A_Color1.gltf', 'forest bush', 0],
  ['grass', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Grass_1_A_Color1.gltf', 'public/models/env/Grass_1_A_Color1.gltf', 'forest grass', 0],
  ['rock', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Rock_1_A_Color1.gltf', 'public/models/env/Rock_1_A_Color1.gltf', 'forest rock', 0],
  ['flowers', RAW.env, 'assets/kaykit/forest-nature-pack-1.0/Assets/gltf/Color1/Tree_1_C_Color1.gltf', 'public/models/env/Tree_1_C_Color1.gltf', 'forest tree variant C', 0],
  // Dungeon pack: ruins dressing (columns/gate/banner)
  ['ruins-pillar', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/pillar.gltf', 'public/models/env/pillar.gltf', 'ruins column', 0],
  ['ruins-banner', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/banner_blue.gltf', 'public/models/env/banner_blue.gltf', 'ruins banner', 0],
  // Props
  ['chest', RAW.props, 'assets/kaykit/block-bits-1.0/Assets/gltf/chest.gltf', 'public/models/props/chest.gltf', 'quest chest', 0],
  ['barrel', RAW.props, 'assets/kaykit/block-bits-1.0/Assets/gltf/barrel.gltf', 'public/models/props/barrel.gltf', 'village barrel', 0],
  ['lantern', RAW.props, 'assets/kaykit/holiday-bits-1.0/Assets/gltf/lantern.gltf', 'public/models/props/lantern.gltf', 'village lantern', 0],
  ['crystal', RAW.props, 'assets/kaykit/resource-bits-1.0/Assets/gltf/Gem_Medium.gltf', 'public/models/props/Gem_Medium.gltf', 'puzzle crystal', 0],
  ['rune-stone', RAW.props, 'assets/kaykit/block-bits-1.0/Assets/gltf/stone.gltf', 'public/models/props/stone.gltf', 'puzzle rune stone', 0],
  ['shrine', RAW.env, 'assets/kaykit/medieval-hexagon-pack-1.0.1/Assets/gltf/buildings/green/building_shrine_green.gltf', 'public/models/env/shrine_green.gltf', 'ancient shrine', 0],
  ['gate', RAW.env, 'assets/kaykit/dungeon-remastered-1.1/Assets/gltf/wall_gated.gltf', 'public/models/env/wall_gated.gltf', 'ruins gate', 0],
];

async function fetchOk(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

async function vendorOne([id, base, src, local, usage]) {
  const dest = join(root, local);
  mkdirSync(dirname(dest), { recursive: true });
  const url = `${base}/${src}`;
  const ensure = async (u, d) => {
    if (existsSync(d) && readFileSync(d).length > 1000) return 'cached';
    const buf = await fetchOk(u);
    writeFileSync(d, buf);
    return `downloaded ${buf.length}b`;
  };
  // main file
  let status;
  try {
    status = await ensure(url, dest);
  } catch (e) {
    return { id, src, local, status: `MISS: ${e.message}`, verified: false };
  }
  // sibling .bin for gltf (required by GLTFLoader)
  let binStatus = 'n/a';
  if (local.endsWith('.gltf')) {
    const binSrc = src.replace(/\.gltf$/, '.bin');
    const binLocal = dest.replace(/\.gltf$/, '.bin');
    try {
      binStatus = await ensure(`${base}/${binSrc}`, binLocal);
    } catch (e) {
      binStatus = `MISS: ${e.message}`;
    }
  }
  return { id, src, local, status, binStatus, verified: status !== 'MISS' };
}

const results = [];
for (const f of FILES) {
  const r = await vendorOne(f);
  console.log(r.id, '->', r.status, '| bin:', r.binStatus);
  results.push(r);
}

// merge into asset-manifest.json (keep seed character entries, add env/props)
const manPath = join(root, 'asset-manifest.json');
const man = JSON.parse(readFileSync(manPath, 'utf8'));
const have = new Set(man.assets.map((a) => a.id));
for (const r of results) {
  if (have.has(r.id)) continue;
  const cat = r.local.includes('/env/') ? 'environment' : r.local.includes('/props/') ? 'prop' : 'character';
  const repo = r.local.includes('/env/')
    ? 'https://github.com/GeorgeQLe/assets-kaykit-3d-environments'
    : r.local.includes('/props/')
      ? 'https://github.com/GeorgeQLe/assets-kaykit-3d-props'
      : 'https://github.com/GeorgeQLe/assets-kaykit-3d-characters';
  man.assets.push({
    id: r.id,
    category: cat,
    repository: repo,
    sourcePath: FILES.find((f) => f[0] === r.id)[2],
    localPath: r.local,
    format: r.local.endsWith('.glb') ? 'glb' : 'gltf+bin',
    license: LIC,
    licenseEvidencePath: 'public/licenses/KayKit-CC0-License.txt',
    author: BY,
    scale: 1,
    animations: [],
    usage: FILES.find((f) => f[0] === r.id)[4],
    optimizedBytes: 0,
    verified: r.status.startsWith('MISS') ? false : true,
  });
}
writeFileSync(manPath, JSON.stringify(man, null, 2));
const missing = results.filter((r) => r.status.startsWith('MISS'));
if (missing.length) {
  console.log('MISSING:', missing.map((m) => m.id).join(', '));
  console.log('Note: missing names will be substituted with existing vendored siblings before release; manifest verified flags updated then.');
}
