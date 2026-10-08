import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three-stdlib';
import type { CharacterDef } from '../data/gameData';

export function CharacterPreview({ char }: { char: CharacterDef }) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      style={{ height: 220, borderRadius: 12, overflow: 'hidden', background: '#0f1c17', touchAction: 'none' }}
      onPointerDown={() => setDrag(true)}
      onPointerUp={() => setDrag(false)}
      onPointerLeave={() => setDrag(false)}
      aria-label={`3D preview of ${char.name}. Drag to rotate.`}
    >
      <Canvas camera={{ position: [0, 1.4, 3.2], fov: 40 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <PreviewModel url={char.file} autoRotate={!drag} />
        </Suspense>
        <OrbitControls enableZoom enablePan={false} autoRotate={!drag} autoRotateSpeed={1.6} minPolarAngle={0.6} maxPolarAngle={1.65} />
      </Canvas>
    </div>
  );
}

function PreviewModel({ url, autoRotate }: { url: string; autoRotate: boolean }) {
  const gltf = useLoader(GLTFLoader, url);
  const ref = useRef<THREE.Group>(null);
  void autoRotate;
  return (
    <group ref={ref} position={[0, -0.9, 0]}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}
