import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';
import { RigidBody, CylinderCollider, CuboidCollider } from '@react-three/rapier';
import { TREES, TREE_FILES, BUSHES, GRASS, ROCKS, PATH_DISCS, PEBBLES, PATCHES, PROPS, type Inst, type InstC } from './villageLayout';

interface Prim { geom: THREE.BufferGeometry; mat: THREE.Material }

/** GLTF asset rendered as one InstancedMesh per primitive; matrices set once. */
function InstancedAsset({ url, items, castShadow = false, receiveShadow = false, tints }: {
  url: string; items: Inst[]; castShadow?: boolean; receiveShadow?: boolean; tints?: number[];
}) {
  const gltf = useLoader(GLTFLoader, url);
  const prims = useMemo<Prim[]>(() => {
    const out: Prim[] = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      // bake node transform (rotation/scale often baked in KayKit nodes)
      let geom = m.geometry;
      const nm = m.matrix;
      if (!nm.elements.every((v, i) => v === new THREE.Matrix4().elements[i])) geom = geom.clone().applyMatrix4(nm);
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) out.push({ geom, mat });
    });
    return out;
  }, [gltf]);
  // one InstancedMesh per (primitive slot); geometry+material shared across instances
  return (
    <group>
      {prims.map((p, i) => (
        <InstMesh key={i} prim={p} items={items} castShadow={castShadow} receiveShadow={receiveShadow}
          tints={tints && prims.length === 1 ? tints : undefined} />
      ))}
    </group>
  );
}

function InstMesh({ prim, items, castShadow, receiveShadow, tints }: {
  prim: Prim; items: Inst[]; castShadow: boolean; receiveShadow: boolean; tints?: number[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => (prim.mat as THREE.MeshStandardMaterial).clone(), [prim]);
  useLayoutEffect(() => {
    const im = ref.current; if (!im) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      d.position.set(it.pos[0], it.pos[1], it.pos[2]);
      d.rotation.set(0, it.rotY, 0);
      d.scale.setScalar(it.scale);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
      if (tints) { const t = tints[i]; im.setColorAt(i, new THREE.Color(t, t, t)); }
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
  }, [items, tints]);
  return <instancedMesh ref={ref} args={[prim.geom, mat, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} frustumCulled={false} />;
}

function tintOf(list: InstC[]) { return list.map((i) => i.tint); }

/** All instanced village scatter. */
export function VillageScenery() {
  const treeByKind = [0, 1, 2].map((k) => TREES.filter((t) => t.kind === k));
  return (
    <group>
      <Suspense fallback={null}>
        <InstancedAsset url="/models/env/Grass_1_A_Color1.gltf" items={GRASS} />
        <InstancedAsset url="/models/env/Bush_1_A_Color1.gltf" items={BUSHES} />
        <InstancedAsset url="/models/env/Rock_1_A_Color1.gltf" items={ROCKS} tints={tintOf(ROCKS)} />
        <InstancedAsset url="/models/props/stone.gltf" items={PEBBLES} />
        <TreeRow kind={0} items={treeByKind[0]} />
        <TreeRow kind={1} items={treeByKind[1]} />
        <TreeRow kind={2} items={treeByKind[2]} />
        <GroundPatches items={PATH_DISCS} color="#5a4a33" />
        <GroundPatches items={PATCHES} color="#2f5c3a" />
      </Suspense>
      <EnvColliders />
    </group>
  );
}

function TreeRow({ kind, items }: { kind: number; items: Inst[] }) {
  return <InstancedAsset url={TREE_FILES[kind]} items={items} castShadow receiveShadow />;
}

/** Flat instanced discs slightly above ground with per-instance tint (dirt/moss). */
function GroundPatches({ items, color }: { items: InstC[]; color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(() => new THREE.CircleGeometry(1, 9), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color }), [color]);
  useLayoutEffect(() => {
    const im = ref.current; if (!im) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < items.length; i++) {
      d.position.set(items[i].pos[0], items[i].pos[1], items[i].pos[2]);
      d.rotation.set(-Math.PI / 2, 0, items[i].rotY);
      d.scale.set(items[i].scale * (1 + (i % 3) * 0.12), items[i].scale, 1);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
      im.setColorAt(i, new THREE.Color().setScalar(items[i].tint));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geom, mat, items.length]} receiveShadow frustumCulled={false} />;
}

/** Static environment collision: tree trunks (< r32), large rocks, structures. */
export function EnvColliders() {
  return (
    <RigidBody type="fixed" colliders={false}>
      {TREES.filter((t) => t.collider).map((t, i) => (
        <CylinderCollider key={`t${i}`} args={[2.2 * t.scale, 0.42 * t.scale]} position={[t.pos[0], 2.2 * t.scale, t.pos[2]]} />
      ))}
      {ROCKS.filter((r) => r.scale > 1.7).map((r, i) => (
        <CylinderCollider key={`r${i}`} args={[0.3 * r.scale, 0.5 * r.scale]} position={[r.pos[0], 0.3, r.pos[2]]} />
      ))}
      {PROPS.map((p, i) => {
        if (p.file.includes('wall_gated')) return <CuboidCollider key={`p${i}`} args={[2, 2, 0.5]} position={[p.pos[0], 2, p.pos[2]]} rotation={[0, p.rotY, 0]} />;
        if (p.file.includes('pillar')) return <CylinderCollider key={`p${i}`} args={[2 * p.scale, 0.7 * p.scale]} position={[p.pos[0], 2 * p.scale, p.pos[2]]} />;
        if (p.file.includes('shrine')) return <CuboidCollider key={`p${i}`} args={[0.6 * p.scale, 0.45 * p.scale, 0.3 * p.scale]} position={[p.pos[0], 0.45 * p.scale, p.pos[2]]} rotation={[0, p.rotY, 0]} />;
        if (p.file.includes('banner')) return <CuboidCollider key={`p${i}`} args={[0.12, 1.9 * p.scale, 0.12]} position={[p.pos[0], 1.9 * p.scale, p.pos[2]]} />;
        return null;
      })}
    </RigidBody>
  );
}
