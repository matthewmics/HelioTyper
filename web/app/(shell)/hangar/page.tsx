import type { Metadata } from "next";
import { HangarBrowser } from "@/components/hangar/hangar-browser";
import { DesignNote } from "@/components/ui/design-note";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Hangar · HelioTyper" };

export default function HangarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Loadout"
        title="Hangar"
        subtitle="Ships change how the run feels, not how fast you can type. Each one trades something away."
      />

      <HangarBrowser />

      <DesignNote title="Balance thought.">
        Keep ship effects small and sideways rather than straight upgrades, so a
        new player on the starter ship is never simply outgunned. Cosmetic-only
        is also a defensible option, and it sidesteps the balance problem
        entirely for a portfolio build.
      </DesignNote>
    </>
  );
}
