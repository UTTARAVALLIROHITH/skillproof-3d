import { Float, Html, OrbitControls, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";
import type { Certificate } from "../types";
import { VERIFICATION_COLORS } from "../data/palette";
import { useReducedMotion } from "../hooks/useEnvironment";
import { AmbientDust, SceneCanvas, StudioLights } from "./shared";
import { getRenderQuality } from "../utils/capabilities";

interface CardProps {
  cert: Certificate;
  angle: number;
  radius: number;
  selected: boolean;
  reduced: boolean;
  onSelect: (id: string) => void;
}

function VaultCard({ cert, angle, radius, selected, reduced, onSelect }: CardProps) {
  const group = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const color = VERIFICATION_COLORS[cert.verification];
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = selected ? 1.12 : hover ? 1.06 : 1;
    const s = group.current.scale.x + (target - group.current.scale.x) * Math.min(1, delta * 9);
    group.current.scale.setScalar(s);
  });

  return (
    <Float speed={reduced ? 0 : 1.1} rotationIntensity={reduced ? 0 : 0.15} floatIntensity={reduced ? 0 : 0.5} floatingRange={[-0.06, 0.06]}>
      <group ref={group} position={[x, 0, z]} rotation={[0, angle, 0]}>
        <group
          onClick={(e) => {
            e.stopPropagation();
            onSelect(cert.id);
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
          <RoundedBox args={[1.5, 1.95, 0.05]} radius={0.06} smoothness={4}>
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={selected ? 0.42 : 0.24}
              roughness={0.08}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.05}
              emissive={color}
              emissiveIntensity={selected ? 0.22 : 0.05}
              depthWrite={false}
            />
          </RoundedBox>
          <mesh position={[0, 0.55, 0.036]}>
            <planeGeometry args={[1.1, 0.1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
          </mesh>
          <mesh position={[-0.2, 0.3, 0.036]}>
            <planeGeometry args={[0.8, 0.05]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
          <mesh position={[-0.25, -0.1, 0.036]}>
            <planeGeometry args={[0.7, 0.05]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
          <mesh position={[0.45, -0.72, 0.04]}>
            <circleGeometry args={[0.11, 32]} />
            <meshBasicMaterial color={color} />
          </mesh>
          {selected && (
            <Html center position={[0, 1.25, 0]}>
              <div className="pointer-events-none max-w-[220px] rounded-2xl border border-white/10 bg-black/65 px-3 py-2 text-center text-[11px] leading-snug text-white backdrop-blur">
                <strong className="block text-xs">{cert.title}</strong>
                <span className="text-white/70">{cert.verification}</span>
              </div>
            </Html>
          )}
        </group>
      </group>
    </Float>
  );
}

interface VaultProps {
  certs: Certificate[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function VaultScene({ certs, selectedId, onSelect }: VaultProps) {
  const reduced = useReducedMotion();
  const quality = useMemo(() => getRenderQuality(), []);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const step = certs.length > 1 ? Math.min(0.42, 2.3 / (certs.length - 1)) : 0;

  return (
    <SceneCanvas label="3D certificate vault. Drag to look around and select a certificate to inspect it." className="h-full w-full" camera={{ position: [0, 0.6, 10], fov: 40 }}>
      <StudioLights />
      <pointLight position={[0, 1, 4]} intensity={14} color="#dfe8ff" distance={14} decay={2} />

      {/* Vault arch and plinth */}
      <mesh position={[0, 0.2, -1.4]}>
        <torusGeometry args={[4.4, 0.05, 16, 160, Math.PI]} />
        <meshStandardMaterial color="#c9ced8" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <ringGeometry args={[4.1, 4.18, 128]} />
        <meshBasicMaterial color="#c9ced8" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {certs.map((c, i) => (
        <VaultCard
          key={c.id}
          cert={c}
          angle={(i - (certs.length - 1) / 2) * step}
          radius={5}
          selected={selectedId === c.id}
          reduced={reduced}
          onSelect={onSelect}
        />
      ))}

      <AmbientDust count={Math.round(quality.particles / 2)} color="#dfe8ff" scale={[14, 8, 10]} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={6}
        maxDistance={14}
        minAzimuthAngle={-0.9}
        maxAzimuthAngle={0.9}
        minPolarAngle={1.0}
        maxPolarAngle={2.0}
      />
      <mesh onClick={() => onSelect(null)} scale={60}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </SceneCanvas>
  );
}
