import Image from "next/image";

/**
 * Decorative: it always sits beside text that names Omicron. The drawing is tall, so it stands
 * 24px high in a 20px-wide slot, and the negative margin keeps it from making its row taller.
 */
export function OmicronLogo() {
  return <Image src="/omicron.svg" alt="" width={20} height={24} unoptimized className="-my-0.5 h-6 w-5 shrink-0" />;
}
