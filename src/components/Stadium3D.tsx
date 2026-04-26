import { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";

const colorForDensity = (density) => {
  if (density >= 0.75) return "#FF1744";
  if (density >= 0.45) return "#FFD600";
  return "#00E676";
};

const standDefinitions = [
  { id: "pavilion", label: "Pavilion", position: [-2.5, 0, -1], width: 2.4, depth: 5, tier: 2 },
  { id: "l", label: "Stand L", position: [2.8, 0, -1], width: 2.4, depth: 5, tier: 2 },
  { id: "m", label: "Stand M", position: [-2.5, 0, 2.5], width: 2.4, depth: 5, tier: 2 },
  { id: "n", label: "Stand N", position: [2.8, 0, 2.5], width: 2.4, depth: 5, tier: 2 },
  { id: "general", label: "General", position: [0, 0, 6.2], width: 7, depth: 3, tier: 1 },
];

function Stand({ stand, density, onHover, onMove, onOut }) {
  const height = stand.tier === 2 ? 1.8 : 1.2;
  const color = colorForDensity(density);

  return (
    <mesh
      position={[stand.position[0], height / 2, stand.position[2]]}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover({ id: stand.id, label: stand.label, density });
      }}
      onPointerMove={(event) => {
        event.stopPropagation();
        onMove(event);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onOut();
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[stand.width, height, stand.depth]} />
      <meshStandardMaterial color={color} metalness={0.2} roughness={0.6} emissive={color} emissiveIntensity={0.05} />
    </mesh>
  );
}

export function Stadium3D({ densities = {} }) {
  const controlsRef = useRef<any>(null);
  const [hovered, setHovered] = useState<any>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const stands = useMemo(
    () =>
      standDefinitions.map((stand) => ({
        ...stand,
        density: densities[stand.id] ?? 0.35,
      })),
    [densities]
  );

  const handleResetCamera = () => {
    controlsRef.current?.reset?.();
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-[#0A1628]">
      <Canvas shadows style={{ width: "100%", height: "100%" }} camera={{ position: [0, 8, 18], fov: 35 }}>
        <color attach="background" args={["#0A1628"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <group rotation={[-0.2, 0.4, 0]}>
          {stands.map((stand) => (
            <Stand
              key={stand.id}
              stand={stand}
              density={stand.density}
              onHover={setHovered}
              onMove={(event) => {
                setPointer({ x: event.clientX, y: event.clientY });
              }}
              onOut={() => setHovered(null)}
            />
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[25, 25]} />
            <meshStandardMaterial color="#08101E" />
          </mesh>
        </group>
        <OrbitControls ref={controlsRef} enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleResetCamera}
          className="bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-[0.2em] px-3 py-2 rounded-full border border-white/10 shadow-lg"
        >
          Reset Camera
        </button>
      </div>

      {hovered && (
        <div
          className="pointer-events-none absolute z-30 rounded-xl border border-white/10 bg-[#112240]/95 px-3 py-2 text-xs text-white shadow-2xl"
          style={{ left: pointer.x + 12, top: pointer.y + 12, minWidth: 160 }}
        >
          <div className="font-semibold text-sm">{hovered.label}</div>
          <div className="text-white/70 text-[11px]">Density: {Math.round(hovered.density * 100)}%</div>
        </div>
      )}
    </div>
  );
}
