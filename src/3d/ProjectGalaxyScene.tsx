import { Html, OrbitControls, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";
import type { Project } from "../types";
import { getRenderQuality } from "../utils/capabilities";
import { AmbientDust, FlyTo, SceneCanvas, StudioLights } from "./shared";
import { Sun } from "./SkillUniverseScene";

interface PlanetProps {
  project: Project;
  radius: number;
  speed: number;
  offset: number;
  tilt: number;
  visible: boolean;
  selected: boolean;
  reduced: boolean;
  registry: Map<string, THREE.Object3D>;
  onSelect: (id: string) => void;
}

function Planet({ project, radius, speed, offset, tilt, visible, selected, reduced, registry, onSelect }: PlanetProps) {
  const spin = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const size = project.featured ? 0.42 : 0.3;

  useEffect(() => {
    const g = body.current;
    if (g) registry.set(project.id, g);
    return () => {
      registry.delete(project.id);
    };
  }, [project.id, registry]);

  useFrame(({ clock }) => {
    if (spin.current && !reduced) spin.current.rotation.y = offset + clock.elapsedTime * speed;
    else if (spin.current) spin.current.rotation.y = offset;
    if (body.current) {
      const target = selected ? 1.35 : hover ? 1.2 : 1;
      body.current.scale.setScalar(body.current.scale.x + (target - body.current.scale.x) * 0.15);
    }
  });

  return (
    <group rotation={[tilt, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.005, 8, 180]} />
        <meshBasicMaterial color="#c9ced8" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <group ref={spin}>
        <group position={[radius, 0, 0]} visible={visible}>
          <group ref={body}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelect(project.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHover(true);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHover(false);
                document.body.style.cursor = "";
              }}
            >
              <sphereGeometry args={[size, 40, 40]} />
              <meshPhysicalMaterial color={project.color} emissive={project.color} emissiveIntensity={selected ? 0.35 : 0.08} roughness={0.55} metalness={0.08} clearcoat={0.4} clearcoatRoughness={0.4} />
            </mesh>
            {project.featured && (
              <mesh rotation={[1.1, 0.2, 0]}>
                <torusGeometry args={[size * 1.7, 0.025, 8, 96]} />
                <meshBasicMaterial color={project.color} transparent opacity={0.55} depthWrite={false} />
              </mesh>
            )}
            {(selected || hover) && (
              <Html center position={[0, size + 0.3, 0]}>
                <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                  {project.name} · {project.status}
                </div>
              </Html>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}

interface GalaxyProps {
  projects: Project[];
  visibleIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  reduced: boolean;
}

export default function ProjectGalaxyScene({ projects, visibleIds, selectedId, onSelect, reduced }: GalaxyProps) {
  const quality = useMemo(() => getRenderQuality(), []);
  const registry = useMemo(() => new Map<string, THREE.Object3D>(), []);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const flying = useRef(false);

  return (
    <SceneCanvas
      label="Interactive 3D project galaxy. Drag to orbit, scroll to zoom, and select a planet to open its project."
      className="h-full w-full"
      camera={{ position: [0, 7, 13], fov: 45 }}
    >
      <StudioLights />
      <Sun />
      {projects.map((p, i) => (
        <Planet
          key={p.id}
          project={p}
          radius={2.8 + i * 0.85}
          speed={0.22 / (1 + i * 0.25)}
          offset={i * 1.3}
          tilt={i % 2 ? 0.16 : -0.12}
          visible={visibleIds.has(p.id)}
          selected={selectedId === p.id}
          reduced={reduced}
          registry={registry}
          onSelect={onSelect}
        />
      ))}
      <Stars radius={70} depth={40} count={quality.stars} factor={3} saturation={0} fade speed={reduced ? 0 : 0.4} />
      <AmbientDust count={quality.particles} color="#e6dcff" scale={[22, 10, 22]} />
      <FlyTo targetId={selectedId} registry={registry} controls={controls} flying={flying} offset={[0, 1.4, 3.2]} />
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={30}
        autoRotate={!reduced && !selectedId}
        autoRotateSpeed={0.3}
        onStart={() => {
          flying.current = false;
        }}
      />
      <mesh onClick={() => onSelect(null)} scale={60}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </SceneCanvas>
  );
}
