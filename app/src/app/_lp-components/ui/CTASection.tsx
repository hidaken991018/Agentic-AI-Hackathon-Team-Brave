import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { FadeIn } from "./FadeIn";

export function CTASection() {
  return (
    <section className="relative bg-background py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <FadeIn>
          <div className="relative mx-auto mb-8 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-destructive/10" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Compass className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary md:text-4xl">
            まずは気軽に
            <br className="sm:hidden" />
            始めてみましょう
          </h2>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="mb-10 text-muted-foreground">
            登録不要・無料でお試しいただけます
          </p>
        </FadeIn>

        <FadeIn delay={300}>
          <Button
            asChild
            size="lg"
            className="h-14 rounded-full bg-destructive px-10 text-base font-semibold text-white shadow-lg shadow-destructive/25 transition-all hover:bg-destructive/90 hover:shadow-xl hover:shadow-destructive/30"
          >
            <Link href="/hearing">
              無料で診断する
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}
