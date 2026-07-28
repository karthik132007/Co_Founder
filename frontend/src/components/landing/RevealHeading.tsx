"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Lightweight SplitText — splits a heading into per-word <span> masks and
 * animates them upward on scroll. We avoid the paid GSAP SplitText plugin
 * and roll our own to keep dependencies free.
 */
export function RevealHeading({
  text,
  as: Tag = "h2",
  className,
  delay = 0,
  stagger = 0.08,
  start = "top 80%",
}: {
  text: string;
  as?: React.ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>(".line-inner");
    gsap.set(words, { yPercent: 110 });
    const tween = gsap.to(words, {
      yPercent: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger,
      delay,
      scrollTrigger: { trigger: el, start },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay, stagger, start]);

  const words = text.split(" ");
  const Comp = Tag as any;
  return (
    <Comp ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} className="line-mask">
          <span className="line-inner">{w}&nbsp;</span>
        </span>
      ))}
    </Comp>
  );
}
