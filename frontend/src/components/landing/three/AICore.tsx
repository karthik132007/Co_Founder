"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The AI Core — a procedural icosahedron displaced by a custom noise shader.
 * Pulses subtly, reacts to cursor proximity via a uniform, and emits a soft
 * fresnel rim. This is the centerpiece of the hero scene.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform float uMouse;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplace;

  // Classic Perlin 3D noise (Ashima)
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }

  float cnoise(vec3 P){
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000,n100,n010,n110), vec4(n001,n101,n011,n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    float n = cnoise(position * 1.6 + uTime * 0.18);
    float n2 = cnoise(position * 3.2 - uTime * 0.12);
    float displace = n * 0.18 + n2 * 0.06;
    displace *= (1.0 + uPulse * 0.4 + uMouse * 0.6);
    vDisplace = displace;
    vec3 pos = position + normal * displace;
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplace;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
    vec3 base = mix(uColorA, uColorB, vDisplace * 2.0 + 0.5);
    vec3 col = base + fresnel * uColorB * 1.4;
    col += uColorB * uPulse * 0.3;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function AICore({ mouse }: { mouse: React.RefObject<{ x: number; y: number; vx: number; vy: number }> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uMouse: { value: 0 },
      uColorA: { value: new THREE.Color("#0a0c18") },
      uColorB: { value: new THREE.Color("#7c8cff") },
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (mat.current) {
      mat.current.uniforms.uTime.value = t;
      mat.current.uniforms.uPulse.value = 0.5 + 0.5 * Math.sin(t * 0.8);
      const m = mouse.current;
      const target = Math.min(1, Math.hypot(m.vx, m.vy) * 18);
      mat.current.uniforms.uMouse.value +=
        (target - mat.current.uniforms.uMouse.value) * 0.1;
    }
    if (mesh.current) {
      // subtle parallax toward cursor
      const m = mouse.current;
      mesh.current.rotation.y += 0.0015;
      mesh.current.rotation.x = THREE.MathUtils.lerp(
        mesh.current.rotation.x,
        m.y * 0.25,
        0.04
      );
      mesh.current.position.x = THREE.MathUtils.lerp(
        mesh.current.position.x,
        m.x * 0.3,
        0.04
      );
    }
  });

  const scale = Math.min(1.6, viewport.width * 0.22);

  return (
    <mesh ref={mesh} scale={scale}>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
