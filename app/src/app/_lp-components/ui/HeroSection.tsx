import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { CompassRose } from "./CompassRose";
import { GridPattern } from "./GridPattern";
import { ParallaxLayer, ScrollDownButton } from "./HeroClient";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-primary text-primary-foreground">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 40%, var(--secondary) 0%, var(--primary) 70%)",
        }}
      />
      <GridPattern />

      <ParallaxLayer
        className="absolute right-[-5%] top-[10%] h-[500px] w-[500px] opacity-60 md:right-[5%] md:h-[600px] md:w-[600px]"
        translateFactor={0.08}
        rotateFactor={0.02}
      >
        <CompassRose className="pointer-events-none h-full w-full text-muted" />
      </ParallaxLayer>

      <ParallaxLayer
        className="absolute bottom-[20%] left-[5%] hidden h-[200px] w-[200px] opacity-30 md:block"
        translateFactor={-0.05}
        rotateFactor={-0.03}
      >
        <CompassRose className="pointer-events-none h-full w-full text-muted" />
      </ParallaxLayer>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-muted/20 bg-white/5 px-5 py-2 backdrop-blur-sm">
          <Compass className="h-4 w-4 text-muted" />
          <span className="text-sm font-medium tracking-widest text-muted">
            LIFE COMPASS
          </span>
        </div>

        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          AIがあなたの
          <br />
          <span className="relative">
            人生設計
            <span className="absolute -bottom-1 left-0 h-[3px] w-full bg-destructive/70 md:-bottom-2 md:h-1" />
          </span>
          を
          <span className="text-muted">サポート</span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          プロのFPの知見 × AIの分析力で、
          <br className="hidden sm:block" />
          あなただけのライフプランを
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-13 rounded-full bg-destructive px-8 text-base font-semibold text-white shadow-lg shadow-destructive/25 transition-all hover:bg-destructive/90 hover:shadow-xl hover:shadow-destructive/30"
          >
            <Link href="/hearing">
              無料で診断する
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <span className="text-xs tracking-wide text-muted/60">
            登録不要 ・ 約5分で完了
          </span>
        </div>
      </div>

      <ScrollDownButton targetId="pain-points" />
    </section>
  );
}
