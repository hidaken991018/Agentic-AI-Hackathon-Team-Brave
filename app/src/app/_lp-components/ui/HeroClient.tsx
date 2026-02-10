"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { ChevronDown } from "lucide-react";

/**
 * Parallax wrapper for hero decorative elements.
 * Listens to scroll and applies transform based on scrollY.
 */
export function ParallaxLayer({
  children,
  className,
  translateFactor,
  rotateFactor,
}: {
  children: ReactNode;
  className?: string;
  translateFactor: number;
  rotateFactor: number;
}) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={className}
      style={{
        transform: `translateY(${scrollY * translateFactor}px) rotate(${scrollY * rotateFactor}deg)`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Scroll-down indicator button that smooth-scrolls to the target element.
 */
export function ScrollDownButton({ targetId }: { targetId: string }) {
  const handleClick = useCallback(() => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
  }, [targetId]);

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted/40 transition-colors hover:text-muted/70"
      aria-label="Scroll down"
    >
      <ChevronDown className="h-6 w-6" />
    </button>
  );
}
