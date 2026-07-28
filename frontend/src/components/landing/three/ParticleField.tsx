"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Orbiting particle field around the AI core. Uses a single InstancedMesh
 * for performance — thousands of points on the GPU. Particles drift along
 * their orbit radius with per-instance phase, giving an organic swarm.
 */
export function ParticleField({ count = 1400 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const speeds = useRef<Float32Array>(new Float32Array());
  const radii = useRef<Float32Array>(new Float32Array());
  const phases = useRef<Float32Array>(new Float32Array());
  const tilts = useRef<Float32Array>(new Float32Array());

  const { geometry, material } = useMemo(() => {
    const g = new THREE.SphereGeometry(0.012, 6, 6);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#9aa6ff"),
      transparent: true,
      opacity: 0.85,
    });
    return { geometry: g, material: m };
  }, []);

  useMemo(() => {
    const s = new Float32Array(count);
    const r = new Float32Array(count);
    const p = new Float32Array(count);
    const t = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s[i] = 0.05 + Math.random() * 0.25;
      r[i] = 1.6 + Math.random() * 2.4;
      p[i] = Math.random() * Math.PI * 2;
      t[i] = (Math.random() - 0.5) * 0.9;
    }
    speeds.current = s;
    radii.current = r;
    phases.current = p;
    tilts.current = t;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const inst = mesh.current;
    if (!inst) return;
    for (let i = 0; i < count; i++) {
      const ang = phases.current[i] + t * speeds.current[i];
      const rad = radii.current[i];
      const tilt = tilts.current[i];
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      const y = Math.sin(ang * 0.5 + tilt * 4) * rad * tilt;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.6 + 0.4 * Math.sin(t * 2 + i));
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.rotation.y = t * 0.02;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
