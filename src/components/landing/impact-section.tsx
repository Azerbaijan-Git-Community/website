import * as motion from "motion/react-client";
import {
  PiChartLineUp,
  PiGlobeHemisphereEast,
  PiLaptop,
  PiGitMerge,
  PiTarget,
} from "react-icons/pi";
import type { IconType } from "react-icons";

const impacts: {
  Icon: IconType;
  color: string;
  title: string;
  body: string;
}[] = [
  {
    Icon: PiChartLineUp,
    color: "bg-[rgba(88,166,255,0.1)] text-icon-blue",
    title: "Boost GII Ranking",
    body: "Measurable innovation growth to significantly improve Azerbaijan's Global Innovation Index.",
  },
  {
    Icon: PiGlobeHemisphereEast,
    color: "bg-[rgba(137,87,229,0.1)] text-icon-purple",
    title: "Unite Talent Nationwide",
    body: "Connecting programmers, designers, DevOps, and AI engineers across all regions.",
  },
  {
    Icon: PiLaptop,
    color: "bg-[rgba(63,185,80,0.1)] text-icon-green",
    title: "Create a Digital Culture",
    body: "Fostering a shared code culture and digital participation from zero.",
  },
  {
    Icon: PiGitMerge,
    color: "bg-[rgba(210,153,34,0.1)] text-icon-orange",
    title: "Expand Open-Source",
    body: "Building free public products, reusable national tools, and contributor missions.",
  },
  {
    Icon: PiTarget,
    color: "bg-[rgba(247,120,186,0.1)] text-icon-pink",
    title: "Build Innovation Metrics",
    body: "Establishing clear KPIs for IDDA and tracking community-wide mobilization.",
  },
];

export function ImpactSection() {
  return (
    <section
      id="impact"
      className="py-24 bg-surface border-t border-b border-line"
    >
      <div className="max-w-300 mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="font-outfit text-[2.5rem] font-bold mb-2">
            National Impact Goals
          </h2>
          <p className="text-xl text-lo max-w-xl mx-auto">
            How 5,000,000 pushes will transform the nation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {impacts.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -5 }}
              className="glass rounded-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${item.color}`}
              >
                <item.Icon size={24} />
              </div>
              <h3 className="font-outfit text-xl font-bold mb-2">
                {item.title}
              </h3>
              <p className="text-lo text-sm leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
