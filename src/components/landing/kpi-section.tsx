import * as motion from "motion/react-client";
import {
  // PiActivity,
  PiStudent,
  PiCode,
  PiCalendarStar,
  PiLightbulb,
  PiBriefcase,
} from "react-icons/pi";
import type { IconType } from "react-icons";

const kpis: { Icon: IconType; title: string; sub: string }[] = [
  { Icon: PiStudent, title: "Activity", sub: "Pushes, Repos" },
  { Icon: PiStudent, title: "Talent", sub: "Training Numbers" },
  { Icon: PiCode, title: "OSS Projects", sub: "Public Goods" },
  { Icon: PiCalendarStar, title: "Events", sub: "Community reach" },
  { Icon: PiLightbulb, title: "Innovation", sub: "GII Impact" },
  { Icon: PiBriefcase, title: "Employment", sub: "Hirings" },
];

export function KpiSection() {
  return (
    <section className="py-24 bg-surface border-t border-b border-line">
      <div className="max-w-300 mx-auto px-8 text-center">
        <h2 className="font-outfit text-[2.5rem] font-bold mb-2">
          National KPI Framework
        </h2>
        <p className="text-xl text-lo max-w-xl mx-auto mb-12">
          Tracking our progress across multiple dimensions of the digital
          ecosystem.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: i * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -5, borderColor: "var(--color-blue)" }}
              className="glass rounded-xl p-6 transition-colors cursor-default"
            >
              <kpi.Icon
                className="text-[2rem] text-hi mb-2 mx-auto"
                size={32}
              />
              <h4 className="font-outfit font-bold text-sm mb-1">
                {kpi.title}
              </h4>
              <p className="text-xs text-lo">{kpi.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
