"use client";

import { useEffect, useRef } from "react";

/**
 * Text scramble effect — iteratively replaces characters with random glyphs
 * before settling on the target string. Used for hover labels and headline
 * reveals. Returns a ref to attach to the element and an `scramble` trigger.
 */
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!<>-_\\/[]{}=+*^?#________";

export function useScramble() {
  const ref = useRef<HTMLElement | null>(null);
  const frame = useRef<number>(0);

  const scramble = (target: string, opts?: { speed?: number; delay?: number }) => {
    const el = ref.current;
    if (!el) return;
    const speed = opts?.speed ?? 0.5;
    const delay = opts?.delay ?? 0;
    cancelAnimationFrame(frame.current);

    let iter = 0;
    const max = target.length * 8;
    const start = performance.now() + delay;

    const tick = (now: number) => {
      if (now < start) {
        frame.current = requestAnimationFrame(tick);
        return;
      }
      const progress = iter / max;
      el.textContent = target
        .split("")
        .map((c, i) => {
          if (c === " ") return " ";
          if (i < progress * target.length) return target[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");
      iter += 1 + speed * 2;
      if (iter >= max) {
        el.textContent = target;
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return { ref, scramble };
}
