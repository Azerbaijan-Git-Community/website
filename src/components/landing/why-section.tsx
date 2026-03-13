import * as motion from "motion/react-client";
import type { IconType } from "react-icons";
import { PiGitBranch, PiTrendUp, PiUsersThree } from "react-icons/pi";

const cards: {
  Icon: IconType;
  title: string;
  body: string;
  stat?: string;
  highlight: boolean;
}[] = [
  {
    Icon: PiUsersThree,
    title: "Talent is Scattered",
    body: "Azerbaijan needs unified digital talent development. Currently, collaboration is fragmented across the country.",
    highlight: false,
  },
  {
    Icon: PiGitBranch,
    title: "No Open-Source Culture",
    body: "OSS communities do not exist in the country. We are building the culture from zero.",
    highlight: false,
  },
  {
    Icon: PiTrendUp,
    title: "Global Innovation Index (2025)",
    body: "Low innovation output indicates a strong need for digital contribution and participation.",
    stat: "94 / 139",
    highlight: true,
  },
];

export function WhySection() {
  return (
    <section id="about" className="py-24">
      <div className="mx-auto max-w-300 px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-2 font-outfit text-[2.5rem] font-bold">Why It Matters?</h2>
          <p className="mx-auto max-w-xl text-xl text-lo">
            Addressing the core challenges in Azerbaijan&apos;s digital ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -5 }}
              className={`glass rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-colors ${
                card.highlight
                  ? "relative overflow-hidden border-[rgba(137,87,229,0.4)] before:absolute before:top-0 before:right-0 before:left-0 before:h-1 before:bg-linear-to-r before:from-blue before:to-purple"
                  : ""
              }`}
            >
              <card.Icon className="mb-4 text-[2.5rem] text-blue" />
              {card.stat && (
                <div className="mb-2 font-outfit text-5xl leading-none font-extrabold text-white">{card.stat}</div>
              )}
              <h3 className="mb-3 font-outfit text-xl font-bold">{card.title}</h3>
              <p className="text-lo">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
