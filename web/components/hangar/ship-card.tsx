import { RocketMark } from "@/components/rocket-mark";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { RARITY_TEXT } from "@/lib/rarity";
import type { Ship } from "@/lib/types";

export type ShipCardProps = {
  ship: Ship;
  selected: boolean;
  equipped: boolean;
  onSelect: (id: string) => void;
};

export function ShipCard({
  ship,
  selected,
  equipped,
  onSelect,
}: ShipCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(ship.id)}
      className={cn(
        "focus-ring relative rounded-2xl border bg-panel px-3 pb-3 pt-4 text-center transition duration-150",
        selected
          ? "border-accent bg-accent/[0.06] shadow-[0_0_0_1px_var(--color-accent),0_8px_26px_rgba(79,216,255,0.16)]"
          : "border-line hover:-translate-y-[3px] hover:border-line-hi",
        !ship.owned && "opacity-50 hover:translate-y-0",
      )}
    >
      {equipped && (
        <Badge tone="accent" solid className="absolute right-2 top-2">
          Equipped
        </Badge>
      )}

      <RocketMark
        detail="full"
        hull={ship.hull}
        fin={ship.fin}
        finShadow={ship.finShadow}
        className="mx-auto mb-3 h-19.5 w-13"
      />

      <b className="mb-1 block font-display text-base">{ship.name}</b>
      <span
        className={cn(
          "font-display text-2xs font-bold uppercase tracking-[0.13em]",
          RARITY_TEXT[ship.rarity],
        )}
      >
        {ship.rarity}
      </span>

      {!ship.owned && (
        <span className="absolute inset-0 grid place-items-center rounded-2xl bg-void/70 text-lg">
          🔒
        </span>
      )}
    </button>
  );
}
