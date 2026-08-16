import { DailyContract } from "@/components/home/daily-contract";
import { Hero } from "@/components/home/hero";
import { ModeList } from "@/components/home/mode-list";
import { RaceHistoryList } from "@/components/race-history-list";
import { Card, CardStack, CardTitle } from "@/components/ui/card";
import { DesignNote } from "@/components/ui/design-note";
import { StatTile, StatTileGrid } from "@/components/ui/stat-tile";
import { PILOT, RECENT_RACES } from "@/lib/data/profile";

export default function HomePage() {
  return (
    <>
      <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
        <CardStack>
          <Hero />

          <StatTileGrid>
            <StatTile value={PILOT.wpm} label="Your WPM" />
            <StatTile value={PILOT.accuracy} label="Accuracy" tone="success" />
            <StatTile value={`#${PILOT.globalRank}`} label="Global rank" />
            <StatTile value={PILOT.wins} label="Races won" />
          </StatTileGrid>

          <DailyContract />
        </CardStack>

        <CardStack>
          <Card>
            <CardTitle>Game modes</CardTitle>
            <ModeList />
          </Card>

          <Card>
            <CardTitle>Recent races</CardTitle>
            <RaceHistoryList races={RECENT_RACES} />
          </Card>
        </CardStack>
      </div>

      <DesignNote title="Prototype note.">
        Everything here is static mock data with no backend. Nav, ship
        selection, mode selection, and the lobby countdown are wired up so you
        can click through the flow, but nothing persists on reload.
      </DesignNote>
    </>
  );
}
