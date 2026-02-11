import { CTASection } from "@/app/_lp-components/ui/CTASection";
import { FeaturesSection } from "@/app/_lp-components/ui/FeaturesSection";
import { Footer } from "@/app/_lp-components/ui/Footer";
import { HeroSection } from "@/app/_lp-components/ui/HeroSection";
import { PainPointsSection } from "@/app/_lp-components/ui/PainPointsSection";
import { StepsSection } from "@/app/_lp-components/ui/StepsSection";
import { TechSection } from "@/app/_lp-components/ui/TechSection";

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <PainPointsSection />
      <FeaturesSection />
      <StepsSection />
      <TechSection />
      <CTASection />
      <Footer />
    </main>
  );
}
