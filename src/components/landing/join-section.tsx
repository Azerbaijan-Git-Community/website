import * as motion from "motion/react-client";
import Link from "next/link";
import { PiGithubLogo, PiTelegramLogo } from "react-icons/pi";
import { SiSignal } from "react-icons/si";

export function JoinSection() {
  return (
    <section id="join" className="border-t border-line bg-surface py-32">
      <div className="mx-auto max-w-300 px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mb-6 font-outfit text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            Ready to Push the <span className="text-gradient">Future?</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-lo">
            Join thousands of developers, designers, and innovators building Azerbaijan&apos;s open-source future
            together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="https://github.com/Azerbaijan-Git-Community"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-green px-8 py-4 text-lg font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-lime hover:shadow-[0_0_20px_rgba(46,160,67,0.5)]"
            >
              <PiGithubLogo size={22} />
              Join on GitHub
            </Link>
            <Link
              href="https://t.me/github_azerbaijan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-line px-8 py-4 text-lg font-semibold text-hi transition-all hover:-translate-y-0.5 hover:border-lo hover:bg-overlay"
            >
              <PiTelegramLogo size={22} />
              Telegram Community
            </Link>
            <Link
              href="https://signal.group/#CjQKIGpriH2T1K5xzUWdf_n-i0RV5x18SNfY68gLXhBqRgCqEhCVaDUk4PoGMoeaEo-aZ8ry"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-line px-8 py-4 text-lg font-semibold text-hi transition-all hover:-translate-y-0.5 hover:border-lo hover:bg-overlay"
            >
              <SiSignal size={22} />
              Signal Community
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
