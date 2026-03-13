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

const tags = ["#GitHubPro", "#Codespaces", "#AI_Tools", "#DevSecOps", "#CI/CD", "#FreeHosting"];
const stats = [
  { val: "01", label: "FREE Services" },
  { val: "02", label: "Support" },
  { val: "03", label: "Training" },
  { val: "04", label: "Collaboration" },
];

export function PerksSection() {
  return (
    <section id="perks" className="py-24">
      <div className="mx-auto max-w-300 px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="mb-4 inline-block rounded-full border border-line bg-[rgba(48,54,61,0.5)] px-3 py-1 text-sm font-medium text-lo">
              Ecosystem Perks
            </span>
            <h2 className="mb-4 font-outfit text-[2.5rem] leading-tight font-bold">
              Fueling Your <br />
              <span className="text-gradient">Growth</span>
            </h2>
            <p className="mb-8 text-xl text-lo">
              We provide the tools and support needed for the startup ecosystem, beginners, and corporate innovators.
            </p>

            <ul className="space-y-6">
              {perks.map((perk) => (
                <li key={perk.title} className="flex items-start gap-4">
                  <PiCheckCircleFill className="text-gradient mt-0.5 shrink-0 text-2xl" />
                  <div>
                    <h4 className="mb-1 font-outfit font-bold">{perk.title}</h4>
                    <p className="text-sm text-lo">{perk.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <div className="flex gap-2 border-b border-line bg-[rgba(48,54,61,0.5)] px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
              </div>
              <div className="bg-overlay p-8">
                <div className="mb-6 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[rgba(88,166,255,0.2)] bg-[rgba(88,166,255,0.1)] px-3 py-1 text-sm text-blue"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((s) => (
                    <div key={s.val} className="rounded-lg border border-line bg-[rgba(13,17,23,0.5)] p-4">
                      <div className="font-outfit text-2xl font-bold text-lime">{s.val}</div>
                      <div className="mt-1 text-xs tracking-wider text-lo uppercase">{s.label}</div>
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
