import { HeroSection } from "@/components/landing/hero-section";
import { WhySection } from "@/components/landing/why-section";
import { ImpactSection } from "@/components/landing/impact-section";
import { PerksSection } from "@/components/landing/perks-section";
import { KpiSection } from "@/components/landing/kpi-section";
import { RoadmapSection } from "@/components/landing/roadmap-section";
import { JoinSection } from "@/components/landing/join-section";

export default function HomePage() {
  return (
    <>
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
