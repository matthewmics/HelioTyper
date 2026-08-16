import type { Rarity, ShipStat } from "@/lib/types";

export const RARITY_TEXT: Record<Rarity, string> = {
  common: "text-ink-dim",
  rare: "text-accent",
  epic: "text-special",
  legend: "text-gold",
};

export const STAT_FILL: Record<ShipStat, string> = {
  Thrust: "bg-accent",
  "Decay resist": "bg-special",
  Hull: "bg-success",
};
