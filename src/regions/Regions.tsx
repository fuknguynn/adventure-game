import { KayKitModel } from '../game/Model';
import { useProgress } from '../stores/stores';

/** Hub-and-spoke miniature world. All dressing = vendored verified KayKit glTF (+bin). */
export function Regions() {
  const { worldRestored, solvedPuzzles } = useProgress();
  const groveDone = solvedPuzzles.includes('spirit_path');
  const lakeDone = solvedPuzzles.includes('rune_sequence');
  const ruinsDone = solvedPuzzles.includes('light_reflection');
  const bloom = worldRestored ? 2.2 : 1;

  const trees: Array<[number, number, number, number]> = [
    [-8, 0, -6, 0.4], [8, 0, -8, 1.2], [-12, 0, 6, 2.1], [12, 0, 8, 0.9],
    [-6, 0, -22, 0.2], [6, 0, -24, 1.7], [-16, 0, -16, 2.6], [18, 0, -28, 0.8],
    [26, 0, -22, 1.9], [34, 0, -26, 0.3], [-26, 0, -2, 1.1], [-32, 0, 8, 2.4],
    [26, 0, 10, 0.7], [36, 0, 2, 1.8], [-8, 0, 26, 0.5], [8, 0, 28, 1.4], [0, 0, 36, 0.1],
  ];
  const bushes: Array<[number, number]> = [[-4, 2], [5, 3], [-3, -12], [4, -10], [20, -20], [-20, 0], [24, 8], [-6, 30]];
  const rocks: Array<[number, number]> = [[-10, -2], [10, -4], [-24, 6], [28, 6], [2, 20]];
  const gems: Array<[number, number, number, number]> = [[-28, 0, 4, lakeDone ? 1.6 : 0.7], [-30, 0, 8, lakeDone ? 1.6 : 0.7], [30, 0, -24, groveDone ? 1.8 : 0.8]];

  return (
    <group>
      {/* ground discs per region + path strips */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[46, 48]} />
        <meshStandardMaterial color={worldRestored ? '#2f6b46' : '#274d38'} />
      </mesh>
      <PathStrip from={[0, -2]} to={[0, -30]} />
      <PathStrip from={[0, 0]} to={[28, -22]} />
      <PathStrip from={[0, 2]} to={[-28, 4]} />
      <PathStrip from={[0, 4]} to={[30, 4]} />
      <PathStrip from={[0, 8]} to={[0, 30]} />
      {/* water: crystal lake disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-29, 0.02, 6]}>
        <circleGeometry args={[7, 32]} />
        <meshStandardMaterial color={lakeDone ? '#5fd4e8' : '#2e7f96'} transparent opacity={0.9} emissive={lakeDone ? '#2fb9d4' : '#0c3542'} emissiveIntensity={lakeDone ? 0.9 : 0.3} />
      </mesh>
      {/* scatter verified foliage */}
      {trees.map(([x, y, z, r], i) => (
        <KayKitModel key={`t${i}`} url={i % 3 === 0 ? '/models/env/Tree_1_A_Color1.gltf' : i % 3 === 1 ? '/models/env/Tree_1_B_Color1.gltf' : '/models/env/Tree_1_C_Color1.gltf'} position={[x, y, z]} rotationY={r} scale={1.4} />
      ))}
      {bushes.map(([x, z], i) => <KayKitModel key={`b${i}`} url="/models/env/Bush_1_A_Color1.gltf" position={[x, 0, z]} scale={1.2} />)}
      {rocks.map(([x, z], i) => <KayKitModel key={`r${i}`} url="/models/env/Rock_1_A_Color1.gltf" position={[x, 0, z]} scale={1.1} />)}
      <KayKitModel url="/models/env/Grass_1_A_Color1.gltf" position={[-2, 0, -6]} scale={2} />
      <KayKitModel url="/models/env/Grass_1_A_Color1.gltf" position={[14, 0, -14]} scale={2} />
      {/* village dressing */}
      <KayKitModel url="/models/env/shrine_green.gltf" position={[-5, 0, -2]} rotationY={0.6} scale={1.2} />
      <KayKitModel url="/models/props/barrel.gltf" position={[4.5, 0, -1]} scale={1} />
      <KayKitModel url="/models/props/chest.gltf" position={[5.5, 0, 1.5]} scale={1} />
      <KayKitModel url="/models/props/lantern.gltf" position={[-3.5, 0, 3]} scale={1.1} />
      <KayKitModel url="/models/props/lantern.gltf" position={[3.5, 0, 5]} scale={1.1} />
      <KayKitModel url="/models/env/banner_blue.gltf" position={[0, 0, -4]} scale={1.1} />
      {/* grove: luminous gems */}
      {gems.map(([x, y, z, e], i) => (
        <group key={`g${i}`} position={[x, y, z]}>
          <KayKitModel url="/models/props/Gem_Medium.gltf" position={[0, 0.6, 0]} scale={1.6} />
          <pointLight color={groveDone ? '#c084fc' : '#7df0d4'} intensity={4 * bloom * e} distance={8} decay={2} position={[0, 1.6, 0]} />
        </group>
      ))}
      {/* ruins dressing */}
      <KayKitModel url="/models/env/pillar.gltf" position={[28, 0, 2]} scale={1.4} />
      <KayKitModel url="/models/env/pillar.gltf" position={[32, 0, 8]} scale={1.4} />
      <KayKitModel url="/models/env/wall_gated.gltf" position={[34, 0, 5]} rotationY={-0.4} scale={1.2} />
      <KayKitModel url="/models/props/stone.gltf" position={[30, 0, 5]} scale={ruinsDone ? 1.4 : 1} />
      {/* ancient tree: grand verified tree + shrine + light */}
      <KayKitModel url="/models/env/Tree_1_A_Color1.gltf" position={[0, 0, 34]} scale={4.2} />
      <KayKitModel url="/models/env/shrine_green.gltf" position={[0, 0, 30]} scale={1.4} />
      <pointLight color={worldRestored ? '#ffe9a8' : '#9ff5e8'} intensity={worldRestored ? 30 : 10} distance={22} decay={2} position={[0, 5, 32]} />
      {/* fireflies (procedural points, not fake fauna) */}
      <Fireflies restored={worldRestored} />
    </group>
  );
}

function PathStrip({ from, to }: { from: [number, number]; to: [number, number] }) {
  const dx = to[0] - from[0], dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const ang = Math.atan2(dx, dz);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(from[0] + to[0]) / 2, 0.01, (from[1] + to[1]) / 2]}>
      <planeGeometry args={[3.2, len]} />
      <meshStandardMaterial color="#6b5b3e" />
    </mesh>
  );
}

function Fireflies({ restored }: { restored: boolean }) {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < (restored ? 90 : 50); i++) {
    const a = (i / 50) * Math.PI * 2;
    pts.push([Math.sin(a) * (8 + (i % 5) * 5), 1 + (i % 7) * 0.4, Math.cos(a) * (8 + (i % 4) * 6)]);
  }
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color={restored ? '#ffe9a8' : '#b8ffe9'} />
        </mesh>
      ))}
    </group>
  );
}
