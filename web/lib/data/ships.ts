import type { Ship } from "@/lib/types";

export const SHIPS: Ship[] = [
  {
    id: "vanguard",
    name: "Vanguard",
    rarity: "common",
    hull: "#e6e9f7",
    fin: "#4fd8ff",
    finShadow: "#2a9fc2",
    stats: { Thrust: 60, "Decay resist": 60, Hull: 60 },
    owned: true,
    perk: "Balanced starter",
    perkText:
      "No bonuses and no penalties. The baseline every other ship is measured against.",
  },
  {
    id: "needle",
    name: "Needle",
    rarity: "rare",
    hull: "#dfe6ff",
    fin: "#a678ff",
    finShadow: "#6f4fc4",
    stats: { Thrust: 88, "Decay resist": 30, Hull: 45 },
    owned: true,
    perk: "Glass cannon",
    perkText:
      "Builds thrust noticeably faster, but it bleeds away faster too. Rewards sustained rhythm and punishes any pause.",
  },
  {
    id: "bulwark",
    name: "Bulwark",
    rarity: "rare",
    hull: "#f2e9d8",
    fin: "#4dffb4",
    finShadow: "#22a06b",
    stats: { Thrust: 42, "Decay resist": 70, Hull: 95 },
    owned: true,
    perk: "Extra plating",
    perkText:
      "One additional hull segment. Slower to get moving, but survives the mistakes that end other runs.",
  },
  {
    id: "ember",
    name: "Ember",
    rarity: "epic",
    hull: "#ffe3d1",
    fin: "#ff8a4d",
    finShadow: "#c9451f",
    stats: { Thrust: 72, "Decay resist": 78, Hull: 50 },
    owned: true,
    perk: "Afterburn",
    perkText:
      "After 20 consecutive correct characters, decay pauses briefly. Combo chasing becomes the main play.",
  },
  {
    id: "phantom",
    name: "Phantom",
    rarity: "epic",
    hull: "#d5dcf0",
    fin: "#4fd8ff",
    finShadow: "#1d5f77",
    stats: { Thrust: 65, "Decay resist": 65, Hull: 55 },
    owned: false,
    cost: 1800,
    perk: "Soft landing",
    perkText:
      "A mistake cuts thrust by 60 percent instead of dropping it to zero. Less punishing, but never reaches top speed as easily.",
  },
  {
    id: "halcyon",
    name: "Halcyon",
    rarity: "legend",
    hull: "#fff4d6",
    fin: "#ffb84d",
    finShadow: "#c98b1f",
    stats: { Thrust: 80, "Decay resist": 82, Hull: 70 },
    owned: false,
    cost: 5000,
    perk: "Second wind",
    perkText:
      "Once per race, the first hull segment lost is restored after 10 clean seconds. Rewards recovering instead of tilting.",
  },
];

export const DEFAULT_SHIP_ID = "vanguard";

export function getShip(id: string): Ship {
  return SHIPS.find((ship) => ship.id === id) ?? SHIPS[0];
}
