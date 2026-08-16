const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const BASELINE = 0.06;

export function KeyHeatmap({ rates }: { rates: Record<string, number> }) {
  return (
    <div>
      {KEY_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="mb-1 flex gap-1"
          style={{ paddingLeft: `${rowIndex * 11}px` }}
        >
          {row.map((key) => {
            const rate = rates[key] ?? BASELINE;

            return (
              <div
                key={key}
                title={`${key} · ${Math.round(rate * 100)}% of hull damage`}
                className="grid aspect-square flex-1 place-items-center rounded-sm border font-display text-2xs font-bold"
                style={{
                  background: `rgba(255,77,132,${(rate * 0.72).toFixed(2)})`,
                  borderColor:
                    rate > 0.3 ? "rgba(255,77,132,0.55)" : "var(--color-line)",
                  color: rate > 0.4 ? "#fff" : "var(--color-ink-dim)",
                }}
              >
                {key}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
