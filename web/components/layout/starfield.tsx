const STAR_COUNT = 120;
const SEED = 20260816;

/** Deterministic PRNG, so the server and client render identical stars. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const random = mulberry32(SEED);
  return Array.from({ length: STAR_COUNT }, () => {
    const size = random() * 2 + 0.5;
    return {
      size,
      left: random() * 100,
      top: random() * 100,
      opacity: random() * 0.5 + 0.12,
      duration: 2 + random() * 4,
      delay: -random() * 5,
    };
  });
})();

/** Fixed, non-interactive star backdrop behind every page. */
export function Starfield() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(ellipse_at_50%_120%,#161d45_0%,var(--color-void)_65%)]"
    >
      {STARS.map((star, i) => (
        <div
          key={i}
          className="absolute animate-twinkle rounded-full bg-white"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            left: `${star.left}%`,
            top: `${star.top}%`,
            opacity: star.opacity,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
