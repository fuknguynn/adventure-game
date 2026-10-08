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

/** Loads a vendored KayKit glTF/GLB with explicit loading + error states. Never a blank mesh. */
export function KayKitModel({ url, position = [0, 0, 0], scale = 1, rotationY = 0 }: { url: string; position?: [number, number, number]; scale?: number; rotationY?: number }) {
  return (
    <ModelErrorBoundary url={url}>
      <Suspense fallback={null}>
        <Inner url={url} position={position} scale={scale} rotationY={rotationY} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function Inner(props: { url: string; position: [number, number, number]; scale: number; rotationY: number }) {
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
