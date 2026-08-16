export type Rarity = "common" | "rare" | "epic" | "legend";

export type ShipStat = "Thrust" | "Decay resist" | "Hull";

export type Ship = {
  id: string;
  name: string;
  rarity: Rarity;
  /** Fill colors for the ship mark: body, near fin, far fin. */
  hull: string;
  fin: string;
  finShadow: string;
  stats: Record<ShipStat, number>;
  owned: boolean;
  /** Unlock price, only meaningful while `owned` is false. */
  cost?: number;
  perk: string;
  perkText: string;
};

export type GameMode = {
  id: string;
  name: string;
  blurb: string;
  glyph: string;
  tag?: { label: string; tone: "success" | "special" | "gold" };
};

export type RankedPilot = {
  name: string;
  wpm: number;
  accuracy: string;
  races: number;
  /** Places gained (+) or lost (-) since the last board. */
  delta: number;
};

export type LobbyPilot = {
  name: string;
  detail: string;
  ready: boolean;
  isYou?: boolean;
};

export type RaceResult = {
  /** Finishing place, or "DNF" when the run ended early. */
  place: string;
  detail: string;
  score: string;
};

export type Achievement = {
  name: string;
  requirement: string;
  glyph: string;
  unlocked: boolean;
};
