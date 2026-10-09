// Throwaway: authored world-AABB (w,h,d) at scale 1 for every village-referenced gltf,
// + per-mesh breakdown for multi-mesh files. Node-only, no DOM: parses gltf JSON and
// composes node TRS with three's Matrix4/Box3 (equivalent to GLTFLoader world AABB —
// none of these files use skins/morphs; extensionsUsed is printed to confirm).
// Usage: node scripts/probe-village.mjs
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

const ROOT = path.resolve(import.meta.dirname, '..', 'public', 'models');
const FILES = [
  'village/barracks.gltf', 'village/home_a.gltf', 'village/home_b.gltf', 'village/market.gltf',
  'village/tent.gltf', 'village/watchtower.gltf', 'village/well.gltf',
  'env/Bush_1_A_Color1.gltf', 'env/Grass_1_A_Color1.gltf', 'env/Grass_2_A_Color1.gltf',
  'env/Rock_1_A_Color1.gltf', 'env/Tree_1_A_Color1.gltf', 'env/Tree_1_B_Color1.gltf',
  'env/Tree_1_C_Color1.gltf', 'env/Tree_2_A_Color1.gltf', 'env/Tree_3_A_Color1.gltf',
  'env/Tree_5_B_Color1.gltf', 'env/Tree_Bare_1_A_Color1.gltf', 'env/banner_blue.gltf',
  'env/column.gltf', 'env/fence_wood.gltf', 'env/pillar.gltf', 'env/rubble_large.gltf',
  'env/shrine_green.gltf', 'env/wall_archedwindow_open.gltf', 'env/wall_broken.gltf',
  'env/wall_gated.gltf', 'env/waterlily.gltf', 'env/waterplant.gltf',
  'props/Gem_Large.gltf', 'props/Gem_Medium.gltf', 'props/anvil.gltf', 'props/barrel.gltf',
  'props/bench.gltf', 'props/chest.gltf', 'props/crate_open.gltf', 'props/grave_a.gltf',
  'props/gravestone.gltf', 'props/lantern.gltf', 'props/mushroom.gltf', 'props/post_lantern.gltf',
  'props/post_skull.gltf', 'props/sack.gltf', 'props/sign_left.gltf', 'props/sign_right.gltf',
  'props/stone.gltf', 'props/torch_lit.gltf',
];

function readBuffer(dir, uri) {
  if (!uri) return Buffer.alloc(0);
  if (uri.startsWith('data:')) return Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64');
  return fs.readFileSync(path.join(dir, uri));
}
const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5124: Int32Array, 5125: Uint32Array, 5126: Float32Array };
const COMPS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };

function nodeLocalMatrix(node) {
  const m = new THREE.Matrix4();
  if (node.matrix) m.fromArray(node.matrix);
  else {
    const t = new THREE.Vector3(...(node.translation ?? [0, 0, 0]));
    const q = new THREE.Quaternion(...(node.rotation ?? [0, 0, 0, 1]));
    const s = new THREE.Vector3(...(node.scale ?? [1, 1, 1]));
    m.compose(t, q, s);
  }
  return m;
}

// min/max of a POSITION accessor (authored min/max preferred; scan as fallback).
function accMinMax(json, buffers, idx) {
  const a = json.accessors[idx];
  const view = json.bufferViews[a.bufferView];
  const buf = buffers[view?.buffer ?? 0];
  const comps = COMPS[a.type];
  if (a.min && a.max) return { min: a.min.slice(0, 3), max: a.max.slice(0, 3) };
  const Ctor = CT[a.componentType];
  const el = (buf.byteOffset + (view.byteOffset ?? 0) + (a.byteOffset ?? 0)) / Ctor.BYTES_PER_ELEMENT;
  const arr = new Ctor(buf.buffer, el, a.count * comps);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < a.count; i++) for (let c = 0; c < 3; c++) {
    const v = arr[i * comps + c];
    if (v < min[c]) min[c] = v;
    if (v > max[c]) max[c] = v;
  }
  return { min, max };
}

const out = [];
for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { out.push({ file: rel, error: 'missing' }); continue; }
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const buffers = (json.buffers ?? []).map((b) => readBuffer(path.dirname(file), b.uri));
  const world = new THREE.Box3();
  const meshesSeen = new Map(); // mesh index -> {name, instances, world Box3}
  const visit = (ni, parent) => {
    const node = json.nodes[ni];
    const mat = parent.clone().multiply(nodeLocalMatrix(node));
    if (node.mesh !== undefined) {
      const mesh = json.meshes[node.mesh];
      let entry = meshesSeen.get(node.mesh);
      if (!entry) {
        entry = {
          name: mesh.name ?? `mesh_${node.mesh}`,
          instances: 0,
          prims: mesh.primitives.map((p) => accMinMax(json, buffers, p.attributes.POSITION)),
          world: new THREE.Box3(),
        };
        meshesSeen.set(node.mesh, entry);
      }
      entry.instances++;
      for (const { min, max } of entry.prims) {
        const wb = new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)).applyMatrix4(mat);
        world.union(wb);
        entry.world.union(wb);
      }
    }
    for (const c of node.children ?? []) visit(c, mat);
  };
  const referenced = new Set();
  for (const n of json.nodes) for (const c of n.children ?? []) referenced.add(c);
  let roots = new Set();
  for (const s of json.scenes ?? []) for (const n of s.nodes ?? []) roots.add(n);
  if (!roots.size) for (let i = 0; i < json.nodes.length; i++) if (!referenced.has(i)) roots.add(i);
  const ident = new THREE.Matrix4();
  for (const r of roots) visit(r, ident);

  const size = world.getSize(new THREE.Vector3());
  const meshList = [...meshesSeen.values()].map((m) => {
    const s = m.world.getSize(new THREE.Vector3());
    return {
      name: m.name,
      instances: m.instances,
      w: +s.x.toFixed(3), h: +s.y.toFixed(3), d: +s.z.toFixed(3),
      yMin: +m.world.min.y.toFixed(3), yMax: +m.world.max.y.toFixed(3),
    };
  });
  out.push({
    file: rel,
    ext: json.extensionsUsed ?? [],
    w: +size.x.toFixed(3), h: +size.y.toFixed(3), d: +size.z.toFixed(3),
    yMin: +world.min.y.toFixed(3), yMax: +world.max.y.toFixed(3),
    meshCount: meshesSeen.size,
    meshes: meshList,
  });
}
console.log(JSON.stringify(out, null, 1));
