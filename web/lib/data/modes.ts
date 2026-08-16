import type { GameMode } from "@/lib/types";

export const GAME_MODES: GameMode[] = [
  {
    id: "quick",
    name: "Quick match",
    blurb: "Up to 5 pilots, random paragraph",
    glyph: "⚡",
    tag: { label: "Live", tone: "success" },
  },
  {
    id: "ranked",
    name: "Ranked ascent",
    blurb: "Placement affects your global rank",
    glyph: "◈",
    tag: { label: "Live", tone: "success" },
  },
  {
    id: "trial",
    name: "Time trial",
    blurb: "Solo run, chase your own best",
    glyph: "◐",
    tag: { label: "Solo", tone: "special" },
  },
  {
    id: "sudden",
    name: "Sudden death",
    blurb: "One mistake and you are gone",
    glyph: "☠",
    tag: { label: "New", tone: "gold" },
  },
  {
    id: "private",
    name: "Private room",
    blurb: "Invite friends with a room code",
    glyph: "⌸",
  },
];

export const DEFAULT_MODE_ID = "quick";
