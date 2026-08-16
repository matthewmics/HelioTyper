"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { DEFAULT_MODE_ID, GAME_MODES } from "@/lib/data/modes";

export function ModeList() {
  const [selected, setSelected] = useState(DEFAULT_MODE_ID);

  return (
    <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Game mode">
      {GAME_MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="radio"
          aria-checked={mode.id === selected}
          onClick={() => setSelected(mode.id)}
          className={cn(
            "focus-ring flex items-center gap-3.5 rounded-xl border p-3.5 text-left transition duration-150",
            mode.id === selected
              ? "border-accent bg-accent/[0.07]"
              : "border-line bg-panel-hi hover:translate-x-[3px] hover:border-line-hi",
          )}
        >
          <span className="grid size-8.5 shrink-0 place-items-center rounded-lg border border-line bg-panel text-base">
            {mode.glyph}
          </span>
          <span className="min-w-0 flex-1">
            <b className="mb-0.5 block font-display text-base">{mode.name}</b>
            <span className="block text-xs text-ink-dim">{mode.blurb}</span>
          </span>
          {mode.tag && <Badge tone={mode.tag.tone}>{mode.tag.label}</Badge>}
        </button>
      ))}
    </div>
  );
}
