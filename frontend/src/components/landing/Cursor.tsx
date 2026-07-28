"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor — a small dot that follows instantly and a ring that lags
 * with easing. Grows on hover over interactive elements. Hidden on touch
 * devices via CSS media query.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pos };
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (dot.current) {
        dot.current.style.transform = `translate(${pos.x - 3}px, ${pos.y - 3}px)`;
      }
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest("a, button, [data-cursor='hover']");
      if (ring.current) {
        if (interactive) {
          ring.current.style.width = "64px";
          ring.current.style.height = "64px";
          ring.current.style.opacity = "0.9";
        } else {
          ring.current.style.width = "36px";
          ring.current.style.height = "36px";
          ring.current.style.opacity = "0.6";
        }
      }
    };

    const tick = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      if (ring.current) {
        const w = parseFloat(ring.current.style.width || "36");
        ring.current.style.transform = `translate(${ringPos.x - w / 2}px, ${ringPos.y - w / 2}px)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  );
}
