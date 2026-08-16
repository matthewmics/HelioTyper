import { cn } from "@/lib/cn";
import type { RaceResult } from "@/lib/types";

function placeTone(place: string) {
  if (place === "1st") return "text-gold";
  if (place === "DNF") return "text-danger";
  return "text-ink-dim";
}

export function RaceHistoryList({ races }: { races: RaceResult[] }) {
  return (
    <ul>
      {races.map((race, i) => (
        <li
          key={i}
          className="flex items-center gap-3 border-b border-line py-3 text-sm last:border-b-0"
        >
          <span
            className={cn(
              "w-8 shrink-0 font-display font-bold",
              placeTone(race.place),
            )}
          >
            {race.place}
          </span>
          <span className="flex-1 truncate text-xs text-ink-dim">
            {race.detail}
          </span>
          <span className="shrink-0 font-display font-bold">{race.score}</span>
        </li>
      ))}
    </ul>
  );
}
