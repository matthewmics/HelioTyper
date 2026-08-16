import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { LobbyPilot } from "@/lib/types";

export function PilotSlot({ pilot }: { pilot: LobbyPilot }) {
  return (
    <li className="mb-2.5 flex items-center gap-3 rounded-xl border border-line bg-panel-hi px-4 py-3">
      <Avatar name={pilot.name} size="lg" />
      <div className="min-w-0">
        <b className="block font-display text-base">
          {pilot.name}
          {pilot.isYou && (
            <span className="ml-1 text-2xs text-accent">(you)</span>
          )}
        </b>
        <span className="text-2xs text-ink-dim">{pilot.detail}</span>
      </div>
      <Badge tone={pilot.ready ? "success" : "gold"} className="ml-auto">
        {pilot.ready ? "Ready" : "Waiting"}
      </Badge>
    </li>
  );
}

export function EmptySlot({ label }: { label: string }) {
  return (
    <li className="mb-2.5 flex items-center justify-center rounded-xl border border-dashed border-line bg-panel-hi px-4 py-5 text-xs text-ink-dim opacity-45">
      {label}
    </li>
  );
}
