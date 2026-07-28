"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Background neural network — a set of nodes scattered in 3D space with
 * lines connecting nearby pairs. Slowly rotates and pulses. Rendered as a
 * LineSegments (GPU cheap) plus a Points cloud for the nodes.
 */
export function NeuralNet({ nodeCount = 90, maxDist = 2.4 }: { nodeCount?: number; maxDist?: number }) {
  const group = useRef<THREE.Group>(null);

  const { positions, linePositions, nodeSizes } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const r = 4 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pts.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
      );
    }
    const positions = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });

    const lineArr: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < maxDist) {
          lineArr.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
        }
      }
    }
    const linePositions = new Float32Array(lineArr);
    const nodeSizes = new Float32Array(pts.length).fill(0.04);
    return { positions, linePositions, nodeSizes };
  }, [nodeCount, maxDist]);

  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#3a4170"),
        transparent: true,
        opacity: 0.35,
      }),
    []
  );
  const pointMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color("#7c8cff"),
        size: 0.05,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
      }),
    []
  );

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.015;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <primitive object={pointMat} attach="material" />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <primitive object={lineMat} attach="material" />
      </lineSegments>
    </group>
  );
}
