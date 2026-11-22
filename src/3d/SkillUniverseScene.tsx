import { Html, OrbitControls, Stars, Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";
import { SKILL_CATEGORIES, type Skill, type SkillCategory } from "../types";
import { CATEGORY_COLORS } from "../data/palette";
import { getRenderQuality } from "../utils/capabilities";
import { AmbientDust, FlyTo, SceneCanvas, StudioLights } from "./shared";

interface NodeProps {
  skill: Skill;
  position: [number, number, number];
  visible: boolean;
  selected: boolean;
  registry: Map<string, THREE.Object3D>;
  onSelect: (id: string) => void;
}

function SkillNode({ skill, position, visible, selected, registry, onSelect }: NodeProps) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const color = CATEGORY_COLORS[skill.category];
  // Node size reflects self-assessed proficiency so the universe reads at a glance.
  const radius = 0.14 + (skill.proficiency / 100) * 0.12;

  useEffect(() => {
    const g = group.current;
    if (g) registry.set(skill.id, g);
    return () => {
      registry.delete(skill.id);
    };
  }, [skill.id, registry]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const target = selected ? 1.5 : hover ? 1.25 : 1;
    const s = mesh.current.scale.x + (target - mesh.current.scale.x) * Math.min(1, delta * 10);
    mesh.current.scale.setScalar(s);
  });

  return (
    <group ref={group} position={position} visible={visible}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(skill.id);
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
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.9 : hover ? 0.6 : 0.28}
          roughness={0.25}
          metalness={0.25}
          clearcoat={1}
        />
      </mesh>
      {selected && (
        <Billboard>
          <mesh>
            <ringGeometry args={[radius * 2.1, radius * 2.4, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </Billboard>
      )}
      {(selected || hover) && (
        <Html center position={[0, radius + 0.35, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur">
            {skill.name} · {skill.proficiency}%
          </div>
        </Html>
      )}
    </group>
  );
}

interface RingProps {
  index: number;
  category: SkillCategory;
  skills: Skill[];
  radius: number;
  visibleIds: Set<string>;
  selectedId: string | null;
  reduced: boolean;
  registry: Map<string, THREE.Object3D>;
  onSelect: (id: string) => void;
}

function CategoryRing({ index, category, skills, radius, visibleIds, selectedId, reduced, registry, onSelect }: RingProps) {
  const spin = useRef<THREE.Group>(null);
  const speed = 0.06 / (1 + index * 0.35);
  const tilt = (((index % 3) - 1) * 0.22);
  const color = CATEGORY_COLORS[category];

  useFrame(({ clock }) => {
    if (spin.current && !reduced) spin.current.rotation.y = clock.elapsedTime * speed + index;
  });

  return (
    <group rotation={[0, 0, tilt]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.006, 8, 200]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <group ref={spin}>
        {skills.map((s, j) => {
          const a = (j / Math.max(1, skills.length)) * Math.PI * 2 + index * 0.7;
          return (
            <SkillNode
              key={s.id}
              skill={s}
              position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}
              visible={visibleIds.has(s.id)}
              selected={selectedId === s.id}
              registry={registry}
              onSelect={onSelect}
            />
          );
        })}
      </group>
      <Html position={[radius, 0.32, 0]} center>
        <span className="pointer-events-none whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-white/55">{category}</span>
      </Html>
    </group>
  );
}

export function Sun() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.7, 48, 48]} />
        <meshStandardMaterial color="#fff3e0" emissive="#ffd9a8" emissiveIntensity={1.4} roughness={0.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.08, 32, 32]} />
        <meshBasicMaterial color="#ffd9a8" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <pointLight color="#ffd9a8" intensity={30} distance={30} decay={2} />
    </group>
  );
}

interface UniverseProps {
  skills: Skill[];
  visibleIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  reduced: boolean;
}

export default function SkillUniverseScene({ skills, visibleIds, selectedId, onSelect, reduced }: UniverseProps) {
  const quality = useMemo(() => getRenderQuality(), []);
  const registry = useMemo(() => new Map<string, THREE.Object3D>(), []);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const flying = useRef(false);

  const rings = useMemo(
    () => SKILL_CATEGORIES.map((category, index) => ({ category, index, list: skills.filter((s) => s.category === category) })),
    [skills]
  );

  return (
    <SceneCanvas
      label="Interactive 3D skill universe. Drag to rotate, scroll to zoom, and select a skill node to see its proof."
      className="h-full w-full"
      camera={{ position: [0, 8, 15], fov: 45 }}
    >
      <StudioLights />
      <Sun />
      {rings.map((r) => (
        <CategoryRing
          key={r.category}
          index={r.index}
          category={r.category}
          skills={r.list}
          radius={2.6 + r.index * 0.95}
          visibleIds={visibleIds}
          selectedId={selectedId}
          reduced={reduced}
          registry={registry}
          onSelect={onSelect}
        />
      ))}
      <Stars radius={70} depth={40} count={quality.stars} factor={3} saturation={0} fade speed={reduced ? 0 : 0.4} />
      <AmbientDust count={quality.particles} scale={[24, 12, 24]} />
      <FlyTo targetId={selectedId} registry={registry} controls={controls} flying={flying} offset={[0, 1.6, 3.6]} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        enableZoom
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={32}
        autoRotate={!reduced && !selectedId}
        autoRotateSpeed={0.35}
        onStart={() => {
          flying.current = false;
        }}
      />
      <Background onClick={() => onSelect(null)} />
    </SceneCanvas>
  );
}

/** Invisible sphere that catches empty-space clicks to clear the selection. */
function Background({ onClick }: { onClick: () => void }) {
  return (
    <mesh onClick={onClick} scale={60}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
    </mesh>
  );
}
