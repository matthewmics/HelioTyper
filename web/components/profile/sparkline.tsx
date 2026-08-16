const WIDTH = 600;
const HEIGHT = 130;
const PADDING = 9;
/** Fixed bounds rather than data-derived, so the line does not rescale each race. */
const FLOOR = 60;
const CEILING = 110;

export type SparklineProps = {
  /** Values in chronological order. */
  data: number[];
  /** Unique id, needed because the fill gradient is referenced by id. */
  id?: string;
};

export function Sparkline({ data, id = "sparkline" }: SparklineProps) {
  const peak = Math.max(...data);

  const points = data.map((value, i) => {
    const x = (i * WIDTH) / (data.length - 1);
    const clamped = (value - FLOOR) / (CEILING - FLOOR);
    const y = HEIGHT - clamped * (HEIGHT - PADDING * 2) - PADDING;
    return { x, y, value };
  });

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="h-32 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4fd8ff" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#4fd8ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke="#4fd8ff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {points
        .filter((p) => p.value === peak)
        .map((p) => (
          <circle
            key={p.x}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r="4"
            fill="#ffb84d"
          />
        ))}
    </svg>
  );
}
