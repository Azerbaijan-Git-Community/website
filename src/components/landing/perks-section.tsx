import * as motion from "motion/react-client";
import { PiCheckCircleFill } from "react-icons/pi";

const perks = [
  {
    title: "Tech Product Benefits",
    body: "GitHub Pro, Codespaces, AI tools, free hosting, Figma, Notion & more.",
  },
  {
    title: "Partner Discounts & Support",
    body: "Discounts from partners and study support via 4SIM (Udemy, Coursera).",
  },
  {
    title: "Job Support & Development",
    body: "Development guidance, mentorships, hiring assistance, and internships.",
  },
];

const tags = [
  "#GitHubPro",
  "#Codespaces",
  "#AI_Tools",
  "#DevSecOps",
  "#CI/CD",
  "#FreeHosting",
];
const stats = [
  { val: "01", label: "FREE Services" },
  { val: "02", label: "Support" },
  { val: "03", label: "Training" },
  { val: "04", label: "Collaboration" },
];

export function PerksSection() {
  return (
    <section id="perks" className="py-24">
      <div className="max-w-300 mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-3 py-1 rounded-full border border-line text-sm font-medium text-lo bg-[rgba(48,54,61,0.5)] mb-4">
              Ecosystem Perks
            </span>
            <h2 className="font-outfit text-[2.5rem] font-bold mb-4 leading-tight">
              Fueling Your <br />
              <span className="text-gradient">Growth</span>
            </h2>
            <p className="text-xl text-lo mb-8">
              We provide the tools and support needed for the startup ecosystem,
              beginners, and corporate innovators.
            </p>

            <ul className="space-y-6">
              {perks.map((perk) => (
                <li key={perk.title} className="flex gap-4 items-start">
                  <PiCheckCircleFill className="text-gradient text-2xl mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-outfit font-bold mb-1">{perk.title}</h4>
                    <p className="text-sm text-lo">{perk.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              {/* Window chrome */}
              <div className="flex gap-2 px-4 py-3 bg-[rgba(48,54,61,0.5)] border-b border-line">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="p-8 bg-overlay">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm px-3 py-1 rounded-full border border-[rgba(88,166,255,0.2)] bg-[rgba(88,166,255,0.1)] text-blue"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((s) => (
                    <div
                      key={s.val}
                      className="bg-[rgba(13,17,23,0.5)] p-4 rounded-lg border border-line"
                    >
                      <div className="font-outfit text-2xl font-bold text-lime">
                        {s.val}
                      </div>
                      <div className="text-xs uppercase tracking-wider text-lo mt-1">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
