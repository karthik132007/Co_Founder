"use client";

import { useEffect, useRef } from "react";

/**
 * Tracks the normalized mouse position (-1..1 on both axes) plus a smoothed
 * velocity. Used by 3D scenes for parallax and by micro-interactions for
 * velocity-based effects. Updates via rAF, not React state, to avoid re-renders.
 */
export function useMouse() {
  const mouse = useRef({ x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    const onMove = (e: MouseEvent) => {
      lastX = (e.clientX / window.innerWidth) * 2 - 1;
      lastY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const tick = () => {
      const m = mouse.current;
      m.px = m.x;
      m.py = m.y;
      // smooth follow
      m.x += (lastX - m.x) * 0.08;
      m.y += (lastY - m.y) * 0.08;
      m.vx = m.x - m.px;
      m.vy = m.y - m.py;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return mouse;
}
