import * as motion from "motion/react-client";
import type { IconType } from "react-icons";
import { CiWavePulse1 } from "react-icons/ci";
import { PiBriefcase, PiCalendarStar, PiCode, PiLightbulb, PiStudent } from "react-icons/pi";

const kpis: { Icon: IconType; title: string; sub: string }[] = [
  { Icon: CiWavePulse1, title: "Activity", sub: "Pushes, Repos" },
  { Icon: PiStudent, title: "Talent", sub: "Training Numbers" },
  { Icon: PiCode, title: "OSS Projects", sub: "Public Goods" },
  { Icon: PiCalendarStar, title: "Events", sub: "Community reach" },
  { Icon: PiLightbulb, title: "Innovation", sub: "GII Impact" },
  { Icon: PiBriefcase, title: "Employment", sub: "Hirings" },
];

export function KpiSection() {
  return (
    <section className="border-t border-b border-line bg-surface py-24">
      <div className="mx-auto max-w-300 px-8 text-center">
        <h2 className="mb-2 font-outfit text-[2.5rem] font-bold">National KPI Framework</h2>
        <p className="mx-auto mb-12 max-w-xl text-xl text-lo">
          Tracking our progress across multiple dimensions of the digital ecosystem.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
              className="glass cursor-default rounded-xl p-6 transition-colors"
            >
              <kpi.Icon className="mx-auto mb-2 text-[2rem] text-hi" size={32} />
              <h4 className="mb-1 font-outfit text-sm font-bold">{kpi.title}</h4>
              <p className="text-xs text-lo">{kpi.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
