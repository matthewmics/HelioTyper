import { cn } from "@/lib/cn";

export type MeterProps = React.ComponentProps<"div"> & {
  /** Fill percentage, 0 to 100. */
  value: number;
  /** Utility classes for the fill, e.g. `bg-accent` or a gradient. */
  fill?: string;
};

export function Meter({ value, fill = "bg-accent", className, ...props }: MeterProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-1.5 overflow-hidden rounded-sm border border-line bg-well",
        className,
      )}
      {...props}
    >
      <div
        className={cn("h-full rounded-sm", fill)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/** A label/value line, optionally over a meter. Used for ship stats and room settings. */
export function MeterRow({
  label,
  value,
  meter,
  fill,
}: {
  label: string;
  value: React.ReactNode;
  meter?: number;
  fill?: string;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex justify-between text-xs text-ink-dim">
        <span>{label}</span>
        <b className="font-display text-ink">{value}</b>
      </div>
      {meter !== undefined && <Meter value={meter} fill={fill} />}
    </div>
  );
}
