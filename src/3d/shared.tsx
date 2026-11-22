import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { getRenderQuality } from "../utils/capabilities";

/* ---------------- Error boundary: a broken GL context must never blank the page ---------------- */

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface SceneCanvasProps {
  children: ReactNode;
  label: string;
  className?: string;
  fallback?: ReactNode;
  camera?: { position: [number, number, number]; fov?: number };
}

/** Shared R3F canvas with adaptive DPR, transparent background and graceful failure. */
export function SceneCanvas({ children, label, className, fallback = null, camera }: SceneCanvasProps) {
  const quality = useMemo(() => getRenderQuality(), []);
  return (
    <SceneBoundary fallback={fallback}>
      <Canvas
        role="img"
        aria-label={label}
        className={className}
        dpr={quality.dpr}
        camera={{ position: camera?.position ?? [0, 0, 8], fov: camera?.fov ?? 45 }}
        gl={{ antialias: quality.tier !== "low", alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }: RootState) => {
          gl.setClearColor(0x000000, 0);
        }}
        shadows={quality.shadows}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </SceneBoundary>
  );
}

/* ---------------- Lighting kit: warm key, cool rim, soft ambient ---------------- */

export function StudioLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.45 * intensity} color="#dfe7ff" />
      <directionalLight position={[5, 8, 6]} intensity={1.4 * intensity} color="#fff3e4" />
      <directionalLight position={[-6, -3, -4]} intensity={0.6 * intensity} color="#7f9cff" />
    </>
  );
}

export function AmbientDust({ count, color = "#d6e0ff", scale = [16, 9, 16] }: { count: number; color?: string; scale?: [number, number, number] }) {
  return <Sparkles count={count} scale={scale} size={2.2} speed={0.25} color={color} opacity={0.55} />;
}

/* ---------------- Camera fly-to for selected objects ---------------- */

interface FlyToProps {
  targetId: string | null;
  registry: Map<string, THREE.Object3D>;
  controls: { current: { target: THREE.Vector3 } | null };
  flying: { current: boolean };
  offset?: [number, number, number];
}

/**
 * Smoothly moves the orbit target and camera toward the selected object.
 * Flight stops as soon as the user starts dragging, so exploration is never fought.
 */
export function FlyTo({ targetId, registry, controls, flying, offset = [0, 1.2, 3.4] }: FlyToProps) {
  const vectors = useMemo(
    () => ({ world: new THREE.Vector3(), want: new THREE.Vector3(), off: new THREE.Vector3(...offset) }),
    [offset]
  );

  useEffect(() => {
    flying.current = Boolean(targetId);
  }, [targetId, flying]);

  useFrame(({ camera }) => {
    const ctrl = controls.current;
    if (!ctrl || !targetId || !flying.current) return;
    const obj = registry.get(targetId);
    if (!obj) return;
    obj.getWorldPosition(vectors.world);
    ctrl.target.lerp(vectors.world, 0.09);
    vectors.want.copy(vectors.world).add(vectors.off);
    camera.position.lerp(vectors.want, 0.06);
    if (camera.position.distanceTo(vectors.want) < 0.04) flying.current = false;
  });

  return null;
}

/* ---------------- Shared geometry helpers ---------------- */

export function orbitPoints(radius: number, segments = 96): [number, number, number][] {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return [Math.cos(a) * radius, 0, Math.sin(a) * radius] as [number, number, number];
  });
}
