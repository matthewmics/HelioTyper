import type { Metadata } from "next";
import { LeaderboardTable } from "@/components/rankings/leaderboard-table";
import { Podium } from "@/components/rankings/podium";
import { DesignNote } from "@/components/ui/design-note";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { LEADERBOARD, LEADERBOARD_SCOPES } from "@/lib/data/leaderboard";
import { PILOT } from "@/lib/data/profile";

export const metadata: Metadata = { title: "Rankings · HelioTyper" };

export default function RankingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Season 1"
        title="Rankings"
        subtitle="Ranked by average WPM across your last 20 races, with accuracy as the tiebreaker."
      />

      <Tabs options={LEADERBOARD_SCOPES} />

      <Podium pilots={LEADERBOARD} />

      <LeaderboardTable
        pilots={LEADERBOARD}
        you={{
          name: PILOT.handle,
          wpm: PILOT.wpm,
          accuracy: PILOT.accuracy,
          races: PILOT.races,
          delta: 14,
          rank: PILOT.globalRank,
        }}
      />

      <DesignNote title="Design thought.">
        Averaging the last 20 races instead of showing an all-time peak keeps
        the board about current form and makes a single lucky run much harder to
        camp on. Worth storing every race result server side regardless, so the
        ranking formula can change later without losing history.
      </DesignNote>
    </>
  );
}
