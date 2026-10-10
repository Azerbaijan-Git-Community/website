import type { CSSProperties } from "react";
import { PiCheckCircleFill, PiInfoFill, PiWarningCircleFill, PiXCircleFill } from "react-icons/pi";
import { Toaster as Sonner } from "sonner";

// Sonner's own palette is driven by these variables; point them at our design tokens.
const themeVars = {
  "--normal-bg": "var(--color-overlay)",
  "--normal-border": "var(--color-line)",
  "--normal-text": "var(--color-hi)",
  "--border-radius": "var(--radius-lg)",
  fontFamily: "inherit",
} as CSSProperties;

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      style={themeVars}
      icons={{
        success: <PiCheckCircleFill className="size-4 text-lime" />,
        error: <PiXCircleFill className="size-4 text-[#f85149]" />,
        warning: <PiWarningCircleFill className="size-4 text-icon-orange" />,
        info: <PiInfoFill className="size-4 text-blue" />,
      }}
      toastOptions={{
        classNames: {
          toast: "shadow-[0_8px_32px_rgba(0,0,0,0.3)]!",
          title: "font-semibold! text-hi",
          description: "text-lo!",
        },
      }}
    />
  );
}
