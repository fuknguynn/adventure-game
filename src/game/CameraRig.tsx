import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { camOrbit, JOY_ZONE } from './input';
import { playerPos } from './Player';
import { useSettings } from '../stores/stores';

/** Smooth follow/orbit camera with pitch clamp + drag orbit. Never clips below ground. */
export function CameraRig() {
  const { gl } = useThree();
  const dragging = useRef(false);
  const last = useRef<[number, number]>([0, 0]);
  const dist = useRef(8);
  const pos = useRef(new THREE.Vector3(6, 5, 12));
  const look = useRef(new THREE.Vector3());

  useRef(false);
  const { reducedMotion } = useSettings();

  // attach drag handlers once
  useRef(true);
  if (!(gl.domElement as HTMLCanvasElement).dataset.orbitBound) {
    (gl.domElement as HTMLCanvasElement).dataset.orbitBound = '1';
    gl.domElement.addEventListener('pointerdown', (e) => {
      // Left-zone touches belong to the virtual joystick (TouchControls), not orbit.
      if (e.pointerType === 'touch' && e.clientX < window.innerWidth * JOY_ZONE) return;
      dragging.current = true; last.current = [e.clientX, e.clientY]; (e.target as Element).setPointerCapture?.(e.pointerId);
    });
    gl.domElement.addEventListener('pointermove', (e) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current[0], dy = e.clientY - last.current[1];
      last.current = [e.clientX, e.clientY];
      camOrbit.yaw -= dx * 0.005;
      camOrbit.pitch = THREE.MathUtils.clamp(camOrbit.pitch + dy * 0.004, 0.12, 1.25);
    });
    const up = () => { dragging.current = false; };
    gl.domElement.addEventListener('pointerup', up);
    gl.domElement.addEventListener('pointercancel', up);
    gl.domElement.addEventListener('wheel', (e) => { dist.current = THREE.MathUtils.clamp(dist.current + (e as WheelEvent).deltaY * 0.01, 4.5, 14); }, { passive: true });
  }

  useFrame((state, dt) => {
    const t = playerPos;
    const want = new THREE.Vector3(
      t.x + Math.sin(camOrbit.yaw) * Math.cos(camOrbit.pitch) * dist.current,
      Math.max(1.2, t.y + Math.sin(camOrbit.pitch) * dist.current + 1.2),
      t.z + Math.cos(camOrbit.yaw) * Math.cos(camOrbit.pitch) * dist.current,
    );
    const k = reducedMotion ? 1 : 1 - Math.exp(-6 * Math.min(dt, 0.05));
    pos.current.lerp(want, k);
    look.current.lerp(new THREE.Vector3(t.x, t.y + 1.2, t.z), reducedMotion ? 1 : 1 - Math.exp(-8 * Math.min(dt, 0.05)));
    state.camera.position.copy(pos.current);
    state.camera.lookAt(look.current);
  });
  return null;
}
