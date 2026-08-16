"use client";

import { useEffect, useState } from "react";

/**
 * Mock launch clock. It loops instead of reaching zero, since nothing is wired
 * up to start a race yet.
 */
export function Countdown({ from = 8 }: { from?: number }) {
  const [seconds, setSeconds] = useState(from);

  useEffect(() => {
    const timer = setInterval(
      () => setSeconds((current) => (current <= 1 ? from : current - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [from]);

  return (
    <div className="pb-1.5 pt-6 text-center">
      <div
        className="font-display text-4xl font-bold text-accent [text-shadow:0_0_26px_rgba(79,216,255,0.45)]"
        aria-live="off"
      >
        {seconds}
      </div>
      <p className="mt-1.5 text-2xs uppercase tracking-[0.16em] text-ink-dim">
        Launching in
      </p>
    </div>
  );
}
