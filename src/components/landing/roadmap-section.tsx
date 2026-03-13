import * as motion from "motion/react-client";

const stages = [
  {
    label: "Stage 1",
    title: "Launch & Onboarding",
    body: "GitHub Azerbaijan established, chapters formed, pilot programs initiated, and GitHub Global onboarding.",
    highlight: false,
  },
  {
    label: "Stage 2",
    title: "Expansion",
    body: "Launch of OSS projects, initial government integrations, and expansion into regional chapters.",
    highlight: false,
  },
  {
    label: "Stage 3",
    title: "National Hub",
    body: "Establishment of the National OSS hub, unlocking full perks, and launching the GitHub certification track.",
    highlight: false,
  },
  {
    label: "Stage 4",
    title: "Scaling & AI",
    body: "AI integrations (Digital Cemetery), country-wide participation, and mass skill assessments.",
    highlight: false,
  },
  {
    label: "Stage 5",
    title: "The Goal Achieved",
    body: "5,000,000 pushes and a strong GII improvement.",
    highlight: true,
  },
];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="py-24">
      <div className="max-w-300 mx-auto px-8 text-center">
        <span className="inline-block px-3 py-1 rounded-full border border-line text-sm font-medium text-lo bg-[rgba(48,54,61,0.5)] mb-4">
          Strategic Plan
        </span>
        <h2 className="font-outfit text-[2.5rem] font-bold mb-2">
          The Path to <span className="text-gradient">5,000,000</span>
        </h2>
        <p className="text-xl text-lo max-w-xl mx-auto mb-16">
          A structured 5-stage national movement for digital transformation.
        </p>

        {/* Timeline */}
        <div className="relative max-w-2xl mx-auto py-8">
          {/* Vertical line */}
          <div className="timeline-line" />

          <div className="space-y-12">
            {stages.map((stage, i) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative"
              >
                {/* Dot */}
                <div
                  className={`absolute top-0 left-5 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10 transition-all ${
                    stage.highlight
                      ? "bg-lime border-lime shadow-[0_0_15px_rgba(63,185,80,0.6)]"
                      : "bg-surface border-dim"
                  }`}
                />

                {/* Card */}
                <div
                  className={`ml-15 md:ml-0 md:w-[calc(50%-40px)] glass rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-left ${
                    i % 2 === 0 ? "md:ml-auto" : "md:mr-auto md:text-right"
                  } ${
                    stage.highlight
                      ? "border-[rgba(137,87,229,0.4)] relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-blue before:to-purple"
                      : ""
                  }`}
                >
                  <span
                    className={`text-xs font-semibold uppercase tracking-widest mb-2 block ${
                      stage.highlight ? "text-gradient" : "text-lo"
                    }`}
                  >
                    {stage.label}
                  </span>
                  <h3 className="font-outfit text-xl font-bold mb-2">
                    {stage.title}
                  </h3>
                  <p
                    className={
                      stage.highlight ? "text-lime font-semibold" : "text-lo"
                    }
                  >
                    {stage.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
