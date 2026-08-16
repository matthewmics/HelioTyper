"use client";

import Link from "next/link";
import { useState } from "react";
import { Countdown } from "@/components/lobby/countdown";
import { EmptySlot, PilotSlot } from "@/components/lobby/pilot-slot";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { LOBBY_CAPACITY, LOBBY_PILOTS } from "@/lib/data/lobby";

export function LaunchBay() {
  const [pilots, setPilots] = useState(LOBBY_PILOTS);
  const you = pilots.find((pilot) => pilot.isYou);

  function toggleReady() {
    setPilots((current) =>
      current.map((pilot) =>
        pilot.isYou ? { ...pilot, ready: !pilot.ready } : pilot,
      ),
    );
  }

  const emptySlots = Math.max(0, LOBBY_CAPACITY - pilots.length);

  return (
    <Card>
      <CardTitle>
        Pilots · {pilots.length} of {LOBBY_CAPACITY}
      </CardTitle>

      <ul>
        {pilots.map((pilot) => (
          <PilotSlot key={pilot.name} pilot={pilot} />
        ))}
        {Array.from({ length: emptySlots }, (_, i) => (
          <EmptySlot
            key={i}
            label={
              emptySlots === 1
                ? "Waiting for one more pilot…"
                : "Waiting for pilots…"
            }
          />
        ))}
      </ul>

      <Countdown />

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button
          variant={you?.ready ? "ghost" : "primary"}
          onClick={toggleReady}
        >
          {you?.ready ? "Cancel ready" : "Ready up"}
        </Button>
        <Link href="/" className={buttonStyles({ variant: "ghost" })}>
          Leave
        </Link>
      </div>
    </Card>
  );
}
