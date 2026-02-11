import { PAIN_POINTS } from "@/app/_lp-components/constant";

import { FadeIn } from "./FadeIn";

export function PainPointsSection() {
  return (
    <section id="pain-points" className="relative bg-background py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <FadeIn>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-secondary">
            Problem
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight text-primary md:text-4xl">
            こんなお悩みありませんか？
          </h2>
        </FadeIn>

        <div className="grid gap-6 md:grid-cols-3">
          {PAIN_POINTS.map((item, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div className="group relative rounded-2xl border border-border/50 bg-white/60 p-8 backdrop-blur-sm transition-all hover:border-secondary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-colors group-hover:bg-destructive/15">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-primary">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
