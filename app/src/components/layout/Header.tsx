import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-primary/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Life Compass" width={28} height={28} />
          <span className="text-lg font-bold tracking-wide text-primary-foreground">
            Life Compass
          </span>
        </Link>
      </div>
    </header>
  );
}
