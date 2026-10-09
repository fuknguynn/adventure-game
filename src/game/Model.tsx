import React, { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';

/** One bad scenery file must never crash the game: isolate load failures per model. */
class ModelErrorBoundary extends React.Component<{ url: string; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) {
    console.warn(`[Eldergrove] scenery model failed, skipped: ${this.props.url}`, err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Loads a vendored KayKit glTF/GLB with explicit loading + error states. Never a blank mesh.
 *  `colorize` (optional) multiplies a hex tint into the model's materials; the
 *  tinted instance gets private material clones so the shared gltf cache stays pristine. */
export function KayKitModel({ url, position = [0, 0, 0], scale = 1, rotationY = 0, colorize }: { url: string; position?: [number, number, number]; scale?: number; rotationY?: number; colorize?: string }) {
  return (
    <ModelErrorBoundary url={url}>
      <Suspense fallback={null}>
        <Inner url={url} position={position} scale={scale} rotationY={rotationY} colorize={colorize} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function Inner(props: { url: string; position: [number, number, number]; scale: number; rotationY: number; colorize?: string }) {
  const [failed, setFailed] = useState(false);
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const gltf = useLoader(GLTFLoader, props.url);
  useEffect(() => {
    let alive = true;
    try {
      const clone = gltf.scene.clone();
      clone.position.set(...props.position);
      clone.scale.setScalar(props.scale);
      clone.rotation.y = props.rotationY;
      clone.traverse((o) => { o.frustumCulled = true; });
      if (props.colorize) {
        const tint = new THREE.Color(props.colorize);
        clone.traverse((o) => {
          const mesh = o as THREE.Mesh;
          const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (!m) return;
          const list = Array.isArray(m) ? m : [m];
          const tinted = list.map((mat) => { const c = mat.clone(); const sm = c as THREE.MeshStandardMaterial; if (sm.color) sm.color.multiply(tint); return c; });
          mesh.material = Array.isArray(m) ? tinted : tinted[0];
        });
      }
      if (alive) setScene(clone);
    } catch {
      if (alive) setFailed(true);
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf, props.url]);
  if (failed || !scene) return null;
  return <primitive object={scene} />;
}

/** Standalone error-tested loader for player character (reports failure to parent). */
export function usePlayerModel(url: string, onError: (msg: string) => void) {
  const [ok, setOk] = useState(true);
  let scene: THREE.Group | null = null;
  try {
    const gltf = useLoader(GLTFLoader, url);
    scene = gltf.scene;
  } catch {
    useEffect(() => { onError(`Could not load character model. Check connection and retry.`); setOk(false); }, [url]);
  }
  void ok;
  return scene;
}
