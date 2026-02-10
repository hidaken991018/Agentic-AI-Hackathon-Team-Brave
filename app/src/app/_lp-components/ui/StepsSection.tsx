import { STEPS } from "@/app/_lp-components/constant";

import { FadeIn } from "./FadeIn";

export function StepsSection() {
  return (
    <section className="relative overflow-hidden bg-muted/15 py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <FadeIn>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-secondary">
            How it works
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight text-primary md:text-4xl">
            かんたん3ステップ
          </h2>
        </FadeIn>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute left-[16.67%] right-[16.67%] top-[52px] hidden h-px bg-gradient-to-r from-muted via-secondary to-primary md:block" />

          {STEPS.map((step, i) => (
            <FadeIn key={i} delay={i * 150}>
              <div className="relative text-center">
                <div className="relative mx-auto mb-6 flex h-[104px] w-[104px] items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-secondary/20 bg-white shadow-sm" />
                  <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
                    {i + 1}
                  </div>
                  <step.icon className="relative h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-primary">
                  {step.title}
                </h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
