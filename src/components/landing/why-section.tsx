import * as motion from "motion/react-client";
import { PiUsersThree, PiGitBranch, PiTrendUp } from "react-icons/pi";
import type { IconType } from "react-icons";

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
      <div className="max-w-300 mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="font-outfit text-[2.5rem] font-bold mb-2">
            Why It Matters?
          </h2>
          <p className="text-xl text-lo max-w-xl mx-auto">
            Addressing the core challenges in Azerbaijan&apos;s digital
            ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -5 }}
              className={`glass rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-colors ${
                card.highlight
                  ? "border-[rgba(137,87,229,0.4)] relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-blue before:to-purple"
                  : ""
              }`}
            >
              <card.Icon className="text-[2.5rem] text-blue mb-4" />
              {card.stat && (
                <div className="font-outfit text-5xl font-extrabold text-white mb-2 leading-none">
                  {card.stat}
                </div>
              )}
              <h3 className="font-outfit text-xl font-bold mb-3">
                {card.title}
              </h3>
              <p className="text-lo">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
