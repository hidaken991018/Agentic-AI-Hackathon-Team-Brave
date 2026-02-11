import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-primary py-10 text-muted">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            <span className="text-lg font-bold tracking-wide text-primary-foreground">
              Life Compass
            </span>
          </div>
          <p className="text-sm text-muted/70">
            Agentic AI Hackathon 2025 — Team Brave
          </p>
          <p className="text-xs text-muted/40">
            Google Cloud × Vertex AI で構築
          </p>
        </div>
      </div>
    </footer>
  );
}
