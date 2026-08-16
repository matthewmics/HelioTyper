import { cn } from "@/lib/cn";
import type { Achievement } from "@/lib/types";

export function AchievementList({ items }: { items: Achievement[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li
          key={item.name}
          className={cn(
            "flex items-center gap-3 border-b border-line py-3 last:border-b-0",
            !item.unlocked && "opacity-45",
          )}
        >
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg border text-base",
              item.unlocked
                ? "border-gold bg-gold/[0.13]"
                : "border-line bg-panel-hi",
            )}
          >
            {item.glyph}
          </span>
          <div className="min-w-0">
            <b className="block font-display text-sm">{item.name}</b>
            <span className="text-2xs text-ink-dim">{item.requirement}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
