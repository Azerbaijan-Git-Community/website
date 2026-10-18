"use client";

import { AnimatePresence, motion } from "motion/react";
import { type KeyboardEvent, useState } from "react";
import { PiCaretLeftBold, PiCaretRightBold } from "react-icons/pi";
import { formatMonthKey } from "@/lib/utils.client";

type MonthSelectorProps = {
  months: string[];
  month: string;
  onMonthChange: (monthKey: string) => void;
};

const arrowClassName =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-lo transition-colors hover:bg-overlay hover:text-hi focus-visible:ring-2 focus-visible:ring-blue focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-lo";

export function MonthSelector({ months, month, onMonthChange }: MonthSelectorProps) {
  const sorted = months.toSorted();
  const index = sorted.indexOf(month);
  const older = index > 0 ? sorted[index - 1] : undefined;
  const newer = index !== -1 && index < sorted.length - 1 ? sorted[index + 1] : undefined;
  // Slide direction: 1 = moving to a newer month, -1 = older
  const [direction, setDirection] = useState(0);

  const go = (target: string | undefined, dir: number) => {
    if (!target) return;
    setDirection(dir);
    onMonthChange(target);
  };

  const handleArrowKeys = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft") go(older, -1);
    if (e.key === "ArrowRight") go(newer, 1);
  };

  return (
    <fieldset aria-label="Month" className="glass mx-auto flex w-fit items-center gap-1 rounded-lg p-1">
      <button
        type="button"
        aria-label="Previous month"
        disabled={!older}
        onClick={() => go(older, -1)}
        onKeyDown={handleArrowKeys}
        className={arrowClassName}
      >
        <PiCaretLeftBold className="size-4" />
      </button>

      <div className="relative flex h-9 w-36 items-center justify-center overflow-hidden" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={month}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="font-outfit text-base font-medium whitespace-nowrap text-lo"
          >
            {formatMonthKey(month)}
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        aria-label="Next month"
        disabled={!newer}
        onClick={() => go(newer, 1)}
        onKeyDown={handleArrowKeys}
        className={arrowClassName}
      >
        <PiCaretRightBold className="size-4" />
      </button>
    </fieldset>
  );
}
