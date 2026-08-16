"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type TabsProps = {
  options: string[];
  /** Uncontrolled: the tabs remember their own selection. */
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export function Tabs({ options, defaultValue, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultValue ?? options[0]);

  return (
    <div className="mb-5 flex flex-wrap gap-1.5" role="tablist">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={option === active}
          onClick={() => {
            setActive(option);
            onChange?.(option);
          }}
          className={cn(
            "focus-ring rounded-lg border px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.07em] transition-colors duration-150",
            option === active
              ? "border-accent bg-accent/10 text-accent"
              : "border-line bg-panel text-ink-dim hover:text-ink",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
