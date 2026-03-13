"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start: number | null = null;

    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
      else setValue(target);
    };

    requestAnimationFrame(step);
  }, [active, target, duration]);

  return value;
}

export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const current = useCountUp(700_000, 2.5, inView);
  const goal = useCountUp(5_000_000, 2.5, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
    >
      <div className="mb-6">
        <h3 className="font-outfit font-bold text-xl mb-1">
          National 5-Year Target
        </h3>
        <p className="text-sm text-lo">Growing GitHub Activity</p>
      </div>

      <div className="flex justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-lo mb-1">
            Current
          </span>
          <span className="font-outfit text-3xl font-extrabold leading-none">
            {current.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-xs uppercase tracking-widest text-lo mb-1">
            Goal
          </span>
          <span className="text-gradient font-outfit text-3xl font-extrabold leading-none">
            {goal.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="h-3 rounded-full bg-overlay overflow-hidden relative">
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background:
              "linear-gradient(135deg, var(--color-green), var(--color-lime))",
          }}
          initial={{ width: "0%" }}
          animate={inView ? { width: "14%" } : { width: "0%" }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        >
          <div
            className="absolute top-0 right-0 bottom-0 w-5 opacity-50"
            style={{ background: "white", filter: "blur(5px)" }}
          />
        </motion.div>
      </div>

      <p className="text-center mt-4 text-sm text-lo">
        Increasing GitHub activity directly increases national innovation
        output.
      </p>
    </motion.div>
  );
}
