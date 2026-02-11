import { FEATURES } from "@/app/_lp-components/constant";

import { FadeIn } from "./FadeIn";

export function FeaturesSection() {
  return (
    <section className="relative bg-white py-24 md:py-32">
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-muted to-transparent" />

      <div className="mx-auto max-w-5xl px-6">
        <FadeIn>
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-secondary">
            Features
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Life Compassの特徴
          </h2>
        </FadeIn>

        <div className="grid gap-8 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div className="group text-center">
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-muted/40 transition-transform duration-700 group-hover:rotate-180" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <f.icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold text-primary">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
