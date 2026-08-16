import type { Metadata } from "next";
import { LaunchBay } from "@/components/lobby/launch-bay";
import { LoadoutPanel, RoomPanel } from "@/components/lobby/room-panel";
import { CardStack } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Lobby · HelioTyper" };

export default function LobbyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Quick match"
        title="Launch bay"
        subtitle="Waiting for pilots. Race starts when everyone is ready or the timer runs out."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <LaunchBay />
        <CardStack>
          <RoomPanel />
          <LoadoutPanel />
        </CardStack>
      </div>
    </>
  );
}
