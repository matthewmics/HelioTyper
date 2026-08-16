import { RocketMark } from "@/components/rocket-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MeterRow } from "@/components/ui/meter";
import { cn } from "@/lib/cn";
import { RARITY_TEXT, STAT_FILL } from "@/lib/rarity";
import type { Ship, ShipStat } from "@/lib/types";

export type ShipDetailProps = {
  ship: Ship;
  equipped: boolean;
  onEquip: (id: string) => void;
};

export function ShipDetail({ ship, equipped, onEquip }: ShipDetailProps) {
  return (
    <Card>
      <div className="mb-4 grid h-45 place-items-center rounded-xl border border-line bg-[radial-gradient(ellipse_at_50%_78%,rgba(79,216,255,0.15),transparent_68%),var(--color-well)]">
        <RocketMark
          detail="full"
          hull={ship.hull}
          fin={ship.fin}
          finShadow={ship.finShadow}
          className="w-19.5 animate-float"
        />
      </div>

      <b className="block font-display text-lg">{ship.name}</b>
      <span
        className={cn(
          "mb-4 block font-display text-2xs font-bold uppercase tracking-[0.13em]",
          RARITY_TEXT[ship.rarity],
        )}
      >
        {ship.rarity}
      </span>

      {(Object.entries(ship.stats) as [ShipStat, number][]).map(
        ([stat, value]) => (
          <MeterRow
            key={stat}
            label={stat}
            value={value}
            meter={value}
            fill={STAT_FILL[stat]}
          />
        ),
      )}

      <div className="mt-4 rounded-lg border border-line bg-panel-hi px-3 py-2.5 text-xs leading-relaxed text-ink-dim">
        <b className="mb-0.5 block font-display text-xs tracking-[0.04em] text-accent">
          {ship.perk}
        </b>
        {ship.perkText}
      </div>

      <div className="mt-4">
        {!ship.owned ? (
          <Button variant="ghost" block>
            Unlock · {ship.cost?.toLocaleString()} ◈
          </Button>
        ) : equipped ? (
          <Button variant="ghost" block disabled>
            Equipped
          </Button>
        ) : (
          <Button block onClick={() => onEquip(ship.id)}>
            Equip
          </Button>
        )}
      </div>
    </Card>
  );
}
