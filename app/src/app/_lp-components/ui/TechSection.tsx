import { ArrowRight } from "lucide-react";

import { TECHS } from "@/app/_lp-components/constant";

import { FadeIn } from "./FadeIn";

export function TechSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground md:py-32">
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tech-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tech-dots)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <FadeIn>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-muted">
            Technology
          </p>
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tight md:text-4xl">
            最先端AIテクノロジー
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-sm leading-relaxed text-muted">
            2つのAIエージェントが連携するマルチエージェントアーキテクチャ。
            <br className="hidden sm:block" />
            FPの専門知識をAIが学習し、パーソナライズされた分析を提供します。
          </p>
        </FadeIn>

        <div className="grid gap-6 md:grid-cols-3">
          {TECHS.map((t, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div className="group rounded-2xl border border-secondary/30 bg-secondary/10 p-6 backdrop-blur-sm transition-all hover:border-muted/40 hover:bg-secondary/15">
                <t.icon className="mb-4 h-8 w-8 text-muted" />
                <h3 className="mb-1 text-base font-bold">{t.label}</h3>
                <p className="text-sm text-muted/80">{t.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={200}>
          <div className="mt-12 flex items-center justify-center gap-3 text-xs text-muted/60">
            <span className="rounded-full border border-muted/20 px-3 py-1">
              ユーザー入力
            </span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full border border-muted/30 bg-secondary/20 px-3 py-1">
              FP Agent
            </span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full border border-muted/30 bg-secondary/20 px-3 py-1">
              JSON Agent
            </span>
            <ArrowRight className="h-3 w-3" />
            <span className="rounded-full border border-muted/20 px-3 py-1">
              ライフプラン
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
