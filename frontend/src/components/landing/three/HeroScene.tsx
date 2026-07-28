"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { AICore } from "./AICore";
import { ParticleField } from "./ParticleField";
import { NeuralNet } from "./NeuralNet";
import { useMouse } from "@/lib/useMouse";

/** Read the active landing theme's scene colors from CSS variables. */
function useSceneColors() {
  const [colors, setColors] = useState({ bg: "#05060a", fog: "#05060a" });
  useEffect(() => {
    const read = () => {
      const root = document.querySelector("[data-landing]");
      if (!root) return;
      const cs = getComputedStyle(root);
      setColors({
        bg: cs.getPropertyValue("--color-scene-bg").trim() || "#05060a",
        fog: cs.getPropertyValue("--color-scene-fog").trim() || "#05060a",
      });
    };
    read();
    const obs = new MutationObserver(read);
    const root = document.querySelector("[data-landing]");
    if (root) obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return colors;
}

/**
 * The full hero 3D scene. Canvas is wrapped in Suspense + lazy-loaded at the
 * page level so the heavy Three.js bundle never blocks initial paint.
 */
export function HeroScene() {
  const mouse = useMouse();
  const { bg, fog } = useSceneColors();

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[fog, 6, 16]} />

      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color="#7c8cff" />
      <pointLight position={[-4, -2, 2]} intensity={0.8} color="#b388ff" />

      <Suspense fallback={null}>
        <NeuralNet />
        <ParticleField count={1400} />
        <AICore mouse={mouse} />
      </Suspense>

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.5}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
