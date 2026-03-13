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
      <div className="mx-auto max-w-300 px-8 text-center">
        <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
          Strategic Plan
        </span>
        <h2 className="mb-2 font-outfit text-[2.5rem] font-bold">
          The Path to <span className="text-gradient">5,000,000</span>
        </h2>
        <p className="mx-auto mb-16 max-w-xl text-xl text-lo">
          A structured 5-stage national movement for digital transformation.
        </p>

        <div className="relative mx-auto max-w-2xl py-8">
          <div className="timeline-line" />

          <div className="space-y-12">
            {stages.map((stage, i) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative"
              >
                <div
                  className={`absolute top-0 left-5 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-2 transition-all md:left-1/2 ${
                    stage.highlight
                      ? "border-lime bg-lime shadow-[0_0_15px_rgba(63,185,80,0.6)]"
                      : "border-dim bg-surface"
                  }`}
                />

                <div
                  className={`glass ml-15 rounded-xl p-6 text-left shadow-[0_8px_32px_rgba(0,0,0,0.2)] md:ml-0 md:w-[calc(50%-40px)] ${
                    i % 2 === 0 ? "md:ml-auto" : "md:mr-auto md:text-right"
                  } ${
                    stage.highlight
                      ? "relative overflow-hidden border-[rgba(137,87,229,0.4)] before:absolute before:top-0 before:right-0 before:left-0 before:h-1 before:bg-linear-to-r before:from-blue before:to-purple"
                      : ""
                  }`}
                >
                  <span
                    className={`mb-2 block text-xs font-semibold tracking-widest uppercase ${
                      stage.highlight ? "text-gradient" : "text-lo"
                    }`}
                  >
                    {stage.label}
                  </span>
                  <h3 className="mb-2 font-outfit text-xl font-bold">{stage.title}</h3>
                  <p className={stage.highlight ? "font-semibold text-lime" : "text-lo"}>{stage.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
