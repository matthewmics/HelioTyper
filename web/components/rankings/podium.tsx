import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { RankedPilot } from "@/lib/types";

/** Left to right the podium reads 2nd, 1st, 3rd, so the winner sits centered. */
const DISPLAY_ORDER = [1, 0, 2];

const PLACE_STYLES = [
  {
    card: "border-gold bg-[radial-gradient(circle_at_50%_0%,rgba(255,184,77,0.14),transparent_62%),var(--color-panel)]",
    rank: "text-gold",
  },
  { card: "border-silver", rank: "text-silver" },
  { card: "border-bronze", rank: "text-bronze" },
];

export function Podium({ pilots }: { pilots: RankedPilot[] }) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {DISPLAY_ORDER.map((index) => {
        const pilot = pilots[index];
        const style = PLACE_STYLES[index];

        return (
          <div
            key={pilot.name}
            className={cn(
              "rounded-2xl border bg-panel px-4 py-5 text-center",
              style.card,
            )}
          >
            <div
              className={cn(
                "mb-2 font-display text-2xl font-bold leading-none",
                style.rank,
              )}
            >
              {index + 1}
            </div>
            <Avatar name={pilot.name} size="xl" className="mx-auto mb-2.5" />
            <b className="mb-1 block font-display text-base">{pilot.name}</b>
            <div className="font-display text-lg font-bold text-accent">
              {pilot.wpm}
            </div>
            <p className="mt-1 text-2xs text-ink-dim">
              {pilot.accuracy} accuracy · {pilot.races} races
            </p>
          </div>
        );
      })}
    </div>
  );
}
