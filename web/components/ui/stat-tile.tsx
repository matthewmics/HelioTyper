import { cn } from "@/lib/cn";

export type StatTileProps = {
  value: React.ReactNode;
  label: string;
  /** Tints the value, for stats worth calling out. */
  tone?: "default" | "success" | "gold" | "danger";
};

const TONES = {
  default: "text-ink",
  success: "text-success",
  gold: "text-gold",
  danger: "text-danger",
} as const;

export function StatTile({ value, label, tone = "default" }: StatTileProps) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3.5">
      <b
        className={cn(
          "mb-1 block font-display text-xl leading-none",
          TONES[tone],
        )}
      >
        {value}
      </b>
      <span className="text-2xs uppercase tracking-[0.09em] text-ink-dim">
        {label}
      </span>
    </div>
  );
}

/** Responsive strip of stat tiles: four across, two on narrow screens. */
export function StatTileGrid({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}
      {...props}
    />
  );
}
