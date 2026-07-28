"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { useScramble } from "@/lib/useScramble";

/**
 * Text that scrambles into its target on mount or on hover. Used for nav
 * links, eyebrows and headline accents.
 */
export function ScrambleText({
  text,
  as: Tag = "span",
  hover = false,
  delay = 0,
  className,
}: {
  text: string;
  as?: ElementType;
  hover?: boolean;
  delay?: number;
  className?: string;
}) {
  const { ref, scramble } = useScramble();

  const trigger = () => scramble(text, { delay });

  const Comp = Tag as any;
  return (
    <Comp
      ref={ref}
      className={className}
      onMouseEnter={hover ? trigger : undefined}
      data-scramble
    >
      {text}
    </Comp>
  );
}
