import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { RocketMark } from "@/components/rocket-mark";
import { Avatar } from "@/components/ui/avatar";
import { PILOT } from "@/lib/data/profile";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-15 shrink-0 items-center gap-4 border-b border-line bg-void/85 px-6 backdrop-blur-md md:gap-7">
      <Link href="/" className="focus-ring flex shrink-0 items-center gap-2.5">
        <RocketMark className="size-5.5" />
        <div>
          <b className="font-display text-lg font-bold tracking-[0.16em]">
            HELIOTYPER
          </b>
          <small className="-mt-0.75 block text-2xs tracking-[0.2em] text-ink-faint">
            to the heliopause
          </small>
        </div>
      </Link>

      <MainNav />

      <div className="ml-auto flex shrink-0 items-center gap-4">
        <div
          className="hidden items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 font-display text-sm font-bold sm:flex"
          title="Credits"
        >
          <i className="size-1.75 rounded-full bg-gold shadow-[0_0_7px_var(--color-gold)]" />
          {PILOT.credits.toLocaleString()}
        </div>

        <Link href="/profile" className="focus-ring flex items-center gap-2.5">
          <Avatar name={PILOT.handle} />
          <div className="hidden lg:block">
            <b className="block font-display text-sm">{PILOT.handle}</b>
            <span className="text-2xs text-ink-dim">
              Lv {PILOT.level} · {PILOT.wpm} WPM
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
