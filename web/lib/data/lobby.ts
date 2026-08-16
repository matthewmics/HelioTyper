import type { LobbyPilot } from "@/lib/types";

export const LOBBY_CAPACITY = 5;

export const LOBBY_PILOTS: LobbyPilot[] = [
  { name: "jaydee", detail: "Lv 14 · 87 wpm", ready: false, isYou: true },
  { name: "orbital_ash", detail: "Lv 31 · 138 wpm", ready: true },
  { name: "sable", detail: "Lv 22 · 121 wpm", ready: true },
  { name: "quietstorm", detail: "Lv 27 · 129 wpm", ready: false },
];

export const ROOM_CODE = "VEGA-7B";

export const ROOM_SETTINGS = [
  { label: "Hull segments", value: "5" },
  { label: "Paragraph length", value: "Medium · 240ch" },
  { label: "Difficulty", value: "Standard" },
  { label: "Punctuation", value: "On" },
];
