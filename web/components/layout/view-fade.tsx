"use client";

import { usePathname } from "next/navigation";

/**
 * Replays the rise-and-fade animation on every route change. Keyed on the
 * pathname because a layout's DOM persists across navigations, so the animation
 * would otherwise only play on first paint.
 */
export function ViewFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-rise">
      {children}
    </div>
  );
}
