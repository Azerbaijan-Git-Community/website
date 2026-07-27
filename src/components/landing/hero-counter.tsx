"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration: number, inView: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;
    let start: number | null = null;
    let raf = 0;

    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setValue(Math.floor(ease * target));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return value;
}

export function HeroCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const value = useCountUp(target, 2.5, inView);

  return (
    <span ref={ref} className="font-outfit text-3xl leading-none font-extrabold">
      {value.toLocaleString()}
    </span>
  );
}
