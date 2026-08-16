"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/hangar", label: "Hangar" },
  { href: "/rankings", label: "Rankings" },
  { href: "/lobby", label: "Lobby" },
  { href: "/profile", label: "Profile" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-1 flex gap-0.5 overflow-x-auto px-1">
      {LINKS.map(({ href, label }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring shrink-0 rounded-md px-3.5 py-2 font-display text-sm font-semibold uppercase tracking-[0.1em] transition-colors duration-150",
              active
                ? "bg-accent/10 text-accent"
                : "text-ink-dim hover:bg-panel hover:text-ink",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
