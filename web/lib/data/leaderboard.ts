import type { RankedPilot } from "@/lib/types";

export const LEADERBOARD: RankedPilot[] = [
  { name: "kernelpanic", wpm: 142, accuracy: "99.1%", races: 412, delta: 2 },
  { name: "orbital_ash", wpm: 138, accuracy: "98.4%", races: 388, delta: -1 },
  { name: "mizuchi", wpm: 134, accuracy: "98.9%", races: 501, delta: 1 },
  { name: "quietstorm", wpm: 129, accuracy: "97.6%", races: 277, delta: 3 },
  { name: "delta_vee", wpm: 127, accuracy: "98.2%", races: 344, delta: 0 },
  { name: "nullpointer", wpm: 124, accuracy: "97.1%", races: 190, delta: -2 },
  { name: "sable", wpm: 121, accuracy: "98.7%", races: 455, delta: 1 },
];

export const LEADERBOARD_SCOPES = ["Global", "This week", "Friends", "Country"];
