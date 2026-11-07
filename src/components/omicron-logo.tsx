import Image from "next/image";

/** Decorative: it always sits beside text that names Omicron. */
export function OmicronLogo() {
  return <Image src="/omicron.svg" alt="" width={20} height={20} unoptimized className="size-5" />;
}
