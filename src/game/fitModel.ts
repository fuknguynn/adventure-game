import * as THREE from 'three';

export interface ModelMetrics {
  size: THREE.Vector3;
  center: THREE.Vector3;
  minY: number;
}

/** Measure world-space bounds of a model (handles any height/proportion). */
export function measureModel(obj: THREE.Object3D): ModelMetrics {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return { size, center, minY: box.min.y };
}

/**
 * Distance that frames the whole model (head to feet) with margin.
 * Never hides overflow or squashes the model — pure camera math.
 */
export function fitDistance(size: THREE.Vector3, fovDeg: number, aspect: number, margin = 1.28): number {
  const half = (fovDeg * Math.PI) / 360;
  const fitH = size.y / (2 * Math.tan(half));
  const fitW = size.x / (2 * Math.tan(half) * Math.max(aspect, 0.5));
  return Math.max(fitH, fitW, size.z * 0.8) * margin;
}

const _corner = new THREE.Vector3();
const _box = new THREE.Box3();

/**
 * Frame a normalized model (feet at y=0, centered on x/z) so its entire
 * bounding box projects inside |ndc| <= limit. Starts from the analytic
 * fitDistance, then grows the distance until all 8 corners verify on-screen.
 * Self-correcting: immune to FOV/aspect/rig surprises.
 */
export function frameObject(
  camera: THREE.PerspectiveCamera,
  obj: THREE.Object3D,
  azimuth: THREE.Vector3,
  elevation = 0.16,
  limit = 0.88,
): { pos: THREE.Vector3; tgt: THREE.Vector3 } {
  _box.setFromObject(obj);
  const size = _box.getSize(new THREE.Vector3());
  const tgt = new THREE.Vector3(0, size.y * 0.5, 0);
  const aspect = camera.aspect || 1;
  let dist = fitDistance(size, camera.fov, aspect, 1.3);

  const dir = azimuth.clone();
  dir.y = 0;
  if (dir.lengthSq() < 1e-4) dir.set(0.4, 0, 1);
  dir.normalize();
  // slight downward look for a cinematic feel (kept small so feet stay framed)
  const look = new THREE.Vector3(dir.x, 0, dir.z);

  camera.updateMatrixWorld();
  for (let i = 0; i < 10; i++) {
    const pos = tgt.clone().addScaledVector(look, dist).add(new THREE.Vector3(0, dist * elevation, 0));
    camera.position.copy(pos);
    camera.lookAt(tgt);
    camera.updateMatrixWorld();
    let worst = 0;
    for (let c = 0; c < 8; c++) {
      // _box is already in world space; project corners directly
      _corner.set(c & 1 ? _box.max.x : _box.min.x, c & 2 ? _box.max.y : _box.min.y, c & 4 ? _box.max.z : _box.min.z);
      _corner.project(camera);
      worst = Math.max(worst, Math.abs(_corner.x), Math.abs(_corner.y));
    }
    if (worst <= limit) return { pos, tgt };
    dist *= 1 + (worst - limit) * 0.9 + 0.06;
  }
  const pos = tgt.clone().addScaledVector(look, dist).add(new THREE.Vector3(0, dist * elevation, 0));
  return { pos, tgt };
}
