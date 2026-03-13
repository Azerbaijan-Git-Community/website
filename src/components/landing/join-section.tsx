import * as motion from "motion/react-client";
import Link from "next/link";
import { PiGithubLogo, PiTelegramLogo } from "react-icons/pi";

export function JoinSection() {
  return (
    <section id="join" className="py-32 bg-surface border-t border-line">
      <div className="max-w-300 mx-auto px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="font-outfit text-[clamp(2.5rem,5vw,4rem)] font-bold mb-6 leading-tight">
            Ready to Push the <span className="text-gradient">Future?</span>
          </h2>
          <p className="text-xl text-lo max-w-2xl mx-auto mb-10">
            Join thousands of developers, designers, and innovators building
            Azerbaijan&apos;s open-source future together.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="https://github.com/Azerbaijan-Git-Community"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-md text-white bg-green hover:bg-lime hover:shadow-[0_0_20px_rgba(46,160,67,0.5)] transition-all hover:-translate-y-0.5"
            >
              <PiGithubLogo size={22} />
              Join on GitHub
            </Link>
            <Link
              href="https://t.me/github_azerbaijan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-md border border-line text-hi hover:border-lo hover:bg-overlay transition-all hover:-translate-y-0.5"
            >
              <PiTelegramLogo size={22} />
              Telegram Community
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
