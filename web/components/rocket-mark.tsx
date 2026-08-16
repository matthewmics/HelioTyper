import { cn } from "@/lib/cn";

export type RocketMarkProps = {
  /** Body color. */
  hull?: string;
  /** Near fin and porthole color. */
  fin?: string;
  /** Far fin color, normally a darker shade of `fin`. */
  finShadow?: string;
  /** `full` adds the exhaust glow, body shading, and engine band. */
  detail?: "simple" | "full";
  className?: string;
};

/**
 * The single rocket silhouette used for the brand mark, the hero decoration,
 * and every ship in the hangar. Ships differ only by their three fill colors.
 */
export function RocketMark({
  hull = "#e6e9f7",
  fin = "#4fd8ff",
  finShadow = "#2a9fc2",
  detail = "simple",
  className,
}: RocketMarkProps) {
  return (
    <svg viewBox="0 0 60 100" className={cn("block", className)} aria-hidden>
      {detail === "full" && (
        <ellipse cx="30" cy="88" rx="7" ry="12" fill={fin} opacity="0.35" />
      )}
      <path
        d="M30 4C42 18 46 40 46 62v16H14V62C14 40 18 18 30 4Z"
        fill={hull}
      />
      {detail === "full" && (
        <path
          d="M30 4C42 18 46 40 46 62v16H30Z"
          fill="rgba(0,0,0,0.14)"
        />
      )}
      <path d="M14 62c-8 4-10 16-8 26l8-10Z" fill={fin} />
      <path d="M46 62c8 4 10 16 8 26l-8-10Z" fill={finShadow} />
      <circle cx="30" cy="40" r="8" fill="#131832" />
      <circle cx="30" cy="40" r="4.5" fill={fin} />
      {detail === "full" && (
        <rect x="14" y="76" width="32" height="5" fill="rgba(0,0,0,0.22)" />
      )}
    </svg>
  );
}
