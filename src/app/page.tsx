import { HeroSection } from "@/components/landing/hero-section";
import { ImpactSection } from "@/components/landing/impact-section";
import { JoinSection } from "@/components/landing/join-section";
import { KpiSection } from "@/components/landing/kpi-section";
import { PerksSection } from "@/components/landing/perks-section";
import { RoadmapSection } from "@/components/landing/roadmap-section";
import { WhySection } from "@/components/landing/why-section";

export default function HomePage() {
  return (
    <>
      <img />
      <HeroSection />
      <WhySection />
      <ImpactSection />
      <PerksSection />
      <KpiSection />
      <RoadmapSection />
      <JoinSection />
    </>
  );
}
