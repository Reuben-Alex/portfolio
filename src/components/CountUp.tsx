"use client";

import { useLayoutEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

interface Props {
  /** The final text, e.g. "3rd of 245". This is what the server renders. */
  value: string;
  /** The number inside `value` that counts up from zero. */
  count: number;
}

export function CountUp({ value, count }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (reduced || !el) return;
    const show = (n: number) => {
      el.textContent = value.replace(String(count), String(Math.round(n)));
    };
    show(0);
    const controls = animate(0, count, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: show,
      onComplete: () => show(count),
    });
    return () => {
      controls.stop();
      el.textContent = value;
    };
  }, [value, count, reduced]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}
