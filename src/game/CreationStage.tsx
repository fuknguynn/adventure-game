import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';
import { KayKitModel } from './Model';
import { frameObject, measureModel } from './fitModel';

const GOLD = '#d8bb78';

/** Procedural idle: character GLBs ship with no embedded clips (verified),
 *  so breathing is synthesized — never claimed as a KayKit clip. */
function useIdle(group: React.RefObject<THREE.Group | null>, baseY: number) {
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.position.y = baseY + Math.sin(t * 1.7) * 0.035;
    g.rotation.x = Math.sin(t * 0.9) * 0.008;
  });
}

function FramedCharacter({ url, onFitted }: { url: string; onFitted: (tgt: THREE.Vector3) => void }) {
  const gltf = useLoader(GLTFLoader, url);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const group = useRef<THREE.Group>(null);
  const goal = useRef<{ pos: THREE.Vector3; tgt: THREE.Vector3 } | null>(null);

  const model = useMemo(() => {
    const obj = gltf.scene.clone();
    obj.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = false;
        o.frustumCulled = false; // auto-fit guarantees visibility; never cull mid-frame
      }
    });
    const m = measureModel(obj);
    // normalize: feet on y=0, centered on x/z — no arbitrary scaling
    obj.position.x -= m.center.x;
    obj.position.z -= m.center.z;
    obj.position.y -= m.minY;
    obj.updateMatrixWorld(true);
    return { obj, metrics: m };
  }, [gltf]);

  // Fit camera whenever the model or viewport aspect changes.
  // Target is lifted to the parent declaratively (no race with OrbitControls mount).
  useEffect(() => {
    const az = camera.position.clone().sub(new THREE.Vector3(0, model.metrics.size.y * 0.5, 0));
    const { pos, tgt } = frameObject(camera, model.obj, az.lengthSq() > 1e-4 ? az : new THREE.Vector3(0.55, 0, 1));
    goal.current = { pos, tgt };
    camera.position.copy(pos);
    camera.lookAt(tgt);
    controls?.target.copy(tgt);
    controls?.update();
    onFitted(tgt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, size.width, size.height]);

  useIdle(group, 0);

  // smooth dolly toward goal after switches (transition, not a snap)
  useFrame((_, dt) => {
    const g = goal.current;
    if (!g) return;
    const k = 1 - Math.exp(-5 * Math.min(dt, 0.05));
    camera.position.lerp(g.pos, k);
    controls?.target.lerp(g.tgt, k);
    if (camera.position.distanceTo(g.pos) < 0.02) goal.current = null;
  });

  return (
    <group ref={group}>
      <primitive object={model.obj} />
    </group>
  );
}

function Fireflies({ count = 42, spread = 9 }: { count?: number; spread?: number }) {
  const pts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (i % 3);
      arr.push([Math.sin(a) * spread * (0.4 + ((i * 7) % 10) / 16), 0.4 + ((i * 13) % 30) / 10, Math.cos(a) * spread * (0.4 + ((i * 5) % 10) / 16)]);
    }
    return arr;
  }, [count, spread]);
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.children.forEach((c, i) => {
      c.position.y += Math.sin(t * 1.3 + i) * 0.0009;
    });
  });
  return (
    <group ref={ref}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color={i % 3 ? '#ffe9a8' : '#9ff5e8'} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function PauseAutoRotate() {
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  useEffect(() => {
    if (!controls) return;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      controls.autoRotate = false;
      if (timer) clearTimeout(timer);
    };
    const start = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        controls.autoRotate = true;
      }, 2500);
    };
    controls.addEventListener('start', stop);
    controls.addEventListener('end', start);
    return () => {
      controls.removeEventListener('start', stop);
      controls.removeEventListener('end', start);
      if (timer) clearTimeout(timer);
    };
  }, [controls]);
  return null;
}

/** Cinematic stage: key/fill/rim light, fog, KayKit grove, soft shadow. */
export function CreationStage({ modelUrl }: { modelUrl: string }) {
  // Declarative orbit target — set by the fitted model; OrbitControls picks
  // it up as a prop whenever it mounts, so there is no mount-order race.
  const [target, setTarget] = useState<[number, number, number]>([0, 1.2, 0]);
  return (
    <Canvas
      camera={{ fov: 32, near: 0.1, far: 120, position: [1.6, 1.6, 5.2] }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: 'none' }}
    >
      <fog attach="fog" args={['#0e1a15', 10, 30]} />
      {/* key: warm gold from front-right-top */}
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#ffe6b8" />
      {/* fill: cool teal from front-left */}
      <directionalLight position={[-5, 3, 4]} intensity={0.9} color="#7fd4c1" />
      {/* rim: arcane green from back-top for silhouette pop */}
      <directionalLight position={[-1, 5, -6]} intensity={1.8} color="#9ff5e8" />
      <ambientLight intensity={0.5} color="#cfe3d4" />
      <pointLight position={[0, 0.4, 2.4]} intensity={2.2} color={GOLD} distance={7} decay={2} />

      {/* grove floor + dressing from verified vendored KayKit */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[16, 40]} />
        <meshStandardMaterial color="#1d3a2c" roughness={1} />
      </mesh>
      <KayKitModel url="/models/env/Tree_1_A_Color1.gltf" position={[-4.6, 0, -4.2]} scale={1.5} rotationY={0.5} />
      <KayKitModel url="/models/env/Tree_1_B_Color1.gltf" position={[4.8, 0, -5]} scale={1.7} rotationY={2.2} />
      <KayKitModel url="/models/env/Bush_1_A_Color1.gltf" position={[-3.1, 0, -1.4]} scale={1.1} />
      <KayKitModel url="/models/env/Bush_1_A_Color1.gltf" position={[3.2, 0, -1.8]} scale={1.3} rotationY={1.4} />
      <KayKitModel url="/models/props/lantern.gltf" position={[-2.2, 0, 1.6]} scale={1} />
      <KayKitModel url="/models/props/lantern.gltf" position={[2.3, 0, 1.4]} scale={1} />
      <Fireflies />
      <pointLight position={[-2.2, 1.4, 1.6]} intensity={5} color="#ffca7a" distance={6} decay={2} />
      <pointLight position={[2.3, 1.4, 1.4]} intensity={5} color="#ffca77" distance={6} decay={2} />

      <Suspense fallback={null}>
        <FramedCharacter key={modelUrl} url={modelUrl} onFitted={(t) => setTarget([t.x, t.y, t.z])} />
      </Suspense>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.55} scale={6} blur={2.6} far={3} color="#06110c" />
      <OrbitControls
        makeDefault
        target={target}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={0.9}
        maxPolarAngle={1.62}
        minAzimuthAngle={-Infinity}
        maxAzimuthAngle={Infinity}
        enableDamping
      />
      <PauseAutoRotate />
    </Canvas>
  );
}

/** 3D thumbnail: real model, auto-framed. Tiny always-on canvas (no render-race). */
export function ThumbCanvas({ modelUrl, label }: { modelUrl: string; label: string }) {
  return (
    <Canvas
      camera={{ fov: 30, near: 0.1, far: 60, position: [0.9, 1.1, 3.4] }}
      dpr={1}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      style={{ pointerEvents: 'none' }}
      aria-label={`3D thumbnail: ${label}`}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 4]} intensity={2} color="#ffe6b8" />
      <directionalLight position={[-2, 3, -4]} intensity={1} color="#9ff5e8" />
      <Suspense fallback={null}>
        <ThumbModel url={modelUrl} />
      </Suspense>
    </Canvas>
  );
}

function ThumbModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const obj = useMemo(() => {
    const o = gltf.scene.clone();
    const m = measureModel(o);
    o.position.x -= m.center.x;
    o.position.z -= m.center.z;
    o.position.y -= m.minY;
    o.updateMatrixWorld(true);
    return o;
  }, [gltf]);
  useEffect(() => {
    const { pos, tgt } = frameObject(camera, obj, new THREE.Vector3(0.35, 0, 1));
    camera.position.copy(pos);
    camera.lookAt(tgt);
  }, [obj, camera]);
  return <primitive object={obj} />;
}
