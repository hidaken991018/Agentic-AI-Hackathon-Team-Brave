export function CompassRose({ className }: { className?: string }) {
  const ticks = Array.from({ length: 36 }).map((_, i) => {
    const angle = (i * 10 * Math.PI) / 180;
    const r1 = i % 9 === 0 ? 85 : 88;
    const r2 = 92;
    return (
      <line
        key={i}
        x1={100 + r1 * Math.sin(angle)}
        y1={100 - r1 * Math.cos(angle)}
        x2={100 + r2 * Math.sin(angle)}
        y2={100 - r2 * Math.cos(angle)}
        stroke="currentColor"
        strokeWidth={i % 9 === 0 ? "0.8" : "0.3"}
        opacity={i % 9 === 0 ? "0.3" : "0.15"}
      />
    );
  });

  return (
    <svg viewBox="0 0 200 200" fill="none" className={className}>
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
      <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="0.3" opacity="0.1" />
      <line x1="100" y1="5" x2="100" y2="195" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
      <line x1="5" y1="100" x2="195" y2="100" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
      <line x1="27" y1="27" x2="173" y2="173" stroke="currentColor" strokeWidth="0.2" opacity="0.1" />
      <line x1="173" y1="27" x2="27" y2="173" stroke="currentColor" strokeWidth="0.2" opacity="0.1" />
      <polygon points="100,10 106,45 100,35 94,45" fill="currentColor" opacity="0.25" />
      {ticks}
    </svg>
  );
}
