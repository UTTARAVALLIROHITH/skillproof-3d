import { ContactShadows, Float, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "../hooks/useEnvironment";
import { getRenderQuality } from "../utils/capabilities";
import { AmbientDust, SceneCanvas, StudioLights } from "./shared";

const ORBITS = [
  { color: "#9fb8ff", radius: 2.2, speed: 0.22, tilt: 0.25, offset: 0.0 },
  { color: "#c9b8ff", radius: 2.6, speed: -0.16, tilt: -0.5, offset: 1.6 },
  { color: "#8fd6cc", radius: 2.9, speed: 0.12, tilt: 0.8, offset: 3.1 },
  { color: "#f0cf9b", radius: 3.3, speed: -0.1, tilt: -0.15, offset: 4.4 },
  { color: "#e8b0c4", radius: 3.6, speed: 0.08, tilt: 0.55, offset: 2.2 },
  { color: "#bfe3a6", radius: 3.9, speed: -0.07, tilt: -0.85, offset: 5.2 },
  { color: "#aab6cc", radius: 4.2, speed: 0.06, tilt: 0.1, offset: 0.9 },
];

const PROJECT_CARDS = [
  { angle: 0.4, radius: 4.9, y: 0.9, color: "#9fb8ff" },
  { angle: 1.6, radius: 5.2, y: -0.6, color: "#c9b8ff" },
  { angle: 2.9, radius: 4.7, y: 1.4, color: "#8fd6cc" },
  { angle: 4.1, radius: 5.0, y: -1.2, color: "#f0cf9b" },
  { angle: 5.3, radius: 5.1, y: 0.2, color: "#e8b0c4" },
];

function OrbitNode({ color, radius, speed, tilt, offset, reduced }: (typeof ORBITS)[number] & { reduced: boolean }) {
  const spin = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (spin.current) spin.current.rotation.y = offset + (reduced ? 0 : clock.elapsedTime * speed);
  });
  return (
    <group rotation={[tilt, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.008, 8, 180]} />
        <meshBasicMaterial color="#cfd6e6" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <group ref={spin}>
        <group position={[radius, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.25} metalness={0.2} clearcoat={1} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.36, 24, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.06} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function ProjectCard({ angle, radius, y, color }: (typeof PROJECT_CARDS)[number]) {
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return (
    <Float speed={1.3} rotationIntensity={0.4} floatIntensity={0.9} floatingRange={[-0.12, 0.12]}>
      <group position={[x, y, z]} rotation={[0.15, -angle + Math.PI / 2, 0.08]}>
        <RoundedBox args={[1.0, 0.62, 0.05]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial color="#eef2fb" metalness={0.15} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} transparent opacity={0.9} />
        </RoundedBox>
        <mesh position={[-0.3, 0.1, 0.035]}>
          <planeGeometry args={[0.26, 0.2]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0.12, 0.12, 0.035]}>
          <planeGeometry args={[0.46, 0.035]} />
          <meshBasicMaterial color="#6b7385" />
        </mesh>
        <mesh position={[0.05, -0.02, 0.035]}>
          <planeGeometry args={[0.6, 0.025]} />
          <meshBasicMaterial color="#9aa4b8" />
        </mesh>
      </group>
    </Float>
  );
}

function HeroUniverse({ reduced, shiftX }: { reduced: boolean; shiftX: number }) {
  const root = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ camera, clock }) => {
    // Scroll drives the camera: it dollies in and descends as the visitor moves down the page.
    const progress = Math.min(1, window.scrollY / (window.innerHeight * 1.1));
    const px = reduced ? 0 : pointer.current.x;
    const py = reduced ? 0 : pointer.current.y;
    target.set(px * 0.6, 0.6 - progress * 2.4 + py * 0.35, 9 - progress * 4.2);
    camera.position.lerp(target, 0.06);
    look.set(shiftX * 0.25, -progress * 0.9, 0);
    camera.lookAt(look);

    const t = clock.elapsedTime;
    if (root.current) {
      root.current.rotation.y = (reduced ? 0 : t * 0.05) + progress * 1.1;
      root.current.rotation.x = py * 0.05;
    }
    if (core.current && !reduced) core.current.rotation.y = t * 0.12;
  });

  return (
    <group ref={root} position={[shiftX, 0, 0]}>
      <mesh ref={core}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial color="#d6dff2" emissive="#1b2540" metalness={0.45} roughness={0.22} clearcoat={1} clearcoatRoughness={0.06} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.22, 32, 32]} />
        <meshBasicMaterial color="#8fa8ff" transparent opacity={0.07} depthWrite={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.7, 2]} />
        <meshBasicMaterial color="#b7c8ff" wireframe transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <pointLight color="#9fb8ff" intensity={18} distance={14} decay={2} />

      {[
        { r: 2.2, rot: [0.4, 0, 0.2] as [number, number, number] },
        { r: 3.0, rot: [1.1, 0.3, 0] as [number, number, number] },
        { r: 3.8, rot: [-0.5, 0.6, 0.4] as [number, number, number] },
      ].map((ring) => (
        <mesh key={ring.r} rotation={ring.rot}>
          <torusGeometry args={[ring.r, 0.01, 8, 200]} />
          <meshBasicMaterial color="#c9ced8" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      ))}

      {ORBITS.map((o, i) => (
        <OrbitNode key={i} {...o} reduced={reduced} />
      ))}
      {PROJECT_CARDS.map((c, i) => (
        <ProjectCard key={i} {...c} />
      ))}
    </group>
  );
}

export default function HeroScene() {
  const reduced = useReducedMotion();
  const quality = useMemo(() => getRenderQuality(), []);
  const shiftX = typeof window !== "undefined" && window.innerWidth >= 1024 ? 2.3 : 0;
  return (
    <SceneCanvas label="Decorative 3D universe of skills and projects" className="pointer-events-none absolute inset-0" camera={{ position: [0, 0.6, 9], fov: 42 }}>
      <StudioLights />
      <HeroUniverse reduced={reduced} shiftX={shiftX} />
      {quality.tier === "high" && (
        <ContactShadows position={[shiftX, -4.2, 0]} opacity={0.32} scale={18} blur={2.8} far={8} color="#000000" />
      )}
      <AmbientDust count={quality.particles} />
    </SceneCanvas>
  );
}
