# Rating mechanics and matchmaking

Working design doc. Nothing here is implemented. Status tags: **[settled]** means we agreed and it should hold unless something new breaks it, **[proposed]** means Claude's suggestion awaiting a call, **[open]** means genuinely undecided.

This is revision 5. Two earlier revisions worked through a hidden Elo, a no-loss seasonal points ladder, divisions, credits, and skill-based matchmaking bands. Revision 3 parked all of that and shipped two simple all-time leaderboards instead. Revision 4 narrowed to one leaderboard with a rolling recency window, scored by best single race in the window. This revision changes the scoring itself, from best-of-window to average-of-window. Nothing from the earlier revisions is discarded, it's preserved in section 4. See History at the bottom for the full sequence.

---

## 1. What's live for v1 **[settled]**

One leaderboard: **Fastest Completion**, scored as a player's average completion time across their own most recent 10 qualifying races.

### 1.1 Fastest Completion leaderboard

- **Metric**: `AVG(completionMs)` across a player's most recent 10 qualifying races, ascending (lower average wins). Not a single-race record and not a best-of-window peak, a rolling average that rewards sustained pace over one lucky run.
- **Why average, not best-of-window**: taking the minimum of the window doesn't actually average out luck, since `MIN` grabs the single best value no matter how many races fed into it, so the eligibility floor below would be doing all the anti-luck work by itself. Averaging does that work directly: one outlier race, good or bad, gets diluted by the other nine instead of either dominating the score or being irrelevant to it.
- **Eligibility floor**: a player needs at least 10 qualifying races total before appearing on the board at all. Under an averaged metric this isn't a separate rule bolted on, it's the same number as the window size for a real reason: an average over fewer than 10 races is a noisier, less meaningful statistic, and the floor is what guarantees every entry on the board represents a full window.
- **Why rolling instead of all-time**: an all-time record set once, months ago, by a player who no longer plays sits at #1 forever with nothing to dislodge it, which is a dead end for a leaderboard in a small-playerbase game. A rolling last-10 average means a player has to keep performing to stay near the top, since older races roll out of the window and get replaced. This does the same job the parked day/week/month windowing idea (4.6) was reaching for, just anchored to race count instead of calendar time, and it needs no extra UI (no tabs to switch between).
- **Qualification per race** (unchanged from revision 3): must finish (no DNF), standard queue settings only, not a custom private-room config. A DNF or non-standard race has no comparable completion time, so it neither consumes a "last 10" slot nor counts toward the 10-races-to-qualify threshold.
- **Table columns**: Rank, Pilot, Avg completion time, Avg WPM, Most-used ship, Avg accuracy, all computed over the same last-10 window, so every column in a row describes the same set of races. Ship is the one column that can't be literally averaged, "most-used in the window" is the proposed stand-in; open to showing something else instead.
- **Showing the ship is transparency, not an endorsement.** If a ship ever has stat-affecting perks (extra hull segment, softened mistake penalty, decay pause on combo, per the Hangar's current design in the web prototype), which ship a top racer favors is visible right in the row rather than hidden. Doesn't resolve the fairness question by itself (see parked 4.7), but makes it legible instead of invisible.

## 2. Schema sketch (v1) **[proposed]**

```prisma
model Race {
  id           String   @id @default(uuid())
  mode         RaceMode
  standard     Boolean  @default(true)  // false for private-room custom configs
  moonDistance Float                    // must be fixed for standard races or completion times aren't comparable
  createdAt    DateTime @default(now())
  finishedAt   DateTime?
  participants RaceParticipant[]
}

model RaceParticipant {
  id                String  @id @default(uuid())
  raceId            String
  userId            String
  shipId            String  // which ship was flown, shown on the board
  placement         Int     // 1-based; DNF sorts last, still recorded for profile history
  dnf               Boolean @default(false)
  wpm               Float
  accuracy          Float
  completionMs      Int?    // null if dnf
  hullBreaches      Int
  qualifiesForBoard Boolean @default(false)  // finished + standard settings

  @@unique([raceId, userId])
}
```

The board itself is a query, not a stored table: per user, take their most recent 10 `qualifiesForBoard` rows ordered by `race.finishedAt` descending, then `AVG(completionMs)`, `AVG(wpm)`, and `AVG(accuracy)` across those 10, plus the most frequent `shipId` among them, then rank all eligible users (10+ qualifying races) by the average ascending. The "most frequent ship" part needs a small group-and-count over the same 10 rows rather than a plain aggregate, cheap at this scale, either in the query or in application code. Fine to compute live at this scale; only worth caching a per-user summary row if read volume ever makes the live query slow.

Profile wins is still `count(*) where placement = 1`, unchanged from revision 3, and still shown on the profile only, not as its own leaderboard.

## 3. UI implications for the web prototype

Against `_prototypes/heliotyper-web-prototype/web-prototype.jsx`:

- **Rankings page is a single table now**, not tabs. Columns: `# · Pilot · Avg completion time · Avg WPM · Most-used ship · Avg accuracy`. Drop the Global/Week/Friends/Country tab row and the podium/tier language from earlier revisions, none of it applies here.
- **Below-threshold players need a visible state**, not just an absence. Something like "6 of 10 races completed" on their own profile, so the eligibility floor reads as a goal to reach rather than a silent exclusion.
- **Profile page** keeps the race history feed and "Races won" tile from revision 3, and is worth adding one more tile for the player's own current last-10 average completion time, so they can see where they'd land on the board without opening it.
- **Results screen** (still doesn't exist, still the first thing to build) shows completion time, WPM, ship flown, placement, and how the race moved the player's rolling average, up, down, or a callout if it's now their best average ever recorded.
- **No ranked mode, no skill-based matchmaking**, unchanged from revision 3. The queue just fills a lobby up to 6 and waterfalls down to fewer after a timeout.

## 4. Parked for later

Not dropped, kept in enough detail to resume without re-deriving it.

### 4.1 Matchmaking rating (Elo-style, revision 2 direction)

Start at 1500. Pairwise-decomposed Elo across the lobby, so placement-based gain/loss (top half gains, bottom half loses, extremes swing more) emerges from the math instead of a hand-tuned table, and beating a higher-rated opponent is worth more than beating a lower-rated one:

```
for each pair (i, j) in the lobby:
    expected_i = 1 / (1 + 10^((rating_j - rating_i) / 400))
    actual_i   = 1 if i placed better than j else 0
    delta_i   += (K / (n-1)) * (actual_i - expected_i)
```

K = 32 to start, flat. Floor the rating around 100 so it can't go negative or silly-looking.

### 4.2 Skill-based matchmaking bands

Bands must be multiplicative (percentage of rating), not a flat WPM window, since race time scales with `1 / speed` and closeness is a ratio, not a difference (20 vs 30 WPM is a blowout, 100 vs 110 is close, same 10 WPM gap). Widening-over-time sketch:

```
band = max(rating * pct, 5)   // flat floor of 5 WPM

t=0s    pct=0.12
t=10s   pct=0.20
t=20s   pct=0.30
t=30s   pct=0.45   + allow starting at 4 players
t=45s   pct=0.70   + allow starting at 3, or bots
```

### 4.3 Credits and Top Earners board

Existing in-game currency (◈), extended into a leaderboard ranked by total earned (not current balance, so spending on ships doesn't drop your rank), fed by daily tasks and quests. Explicitly the "played a lot" track, meant to coexist with a skill-measured board rather than compete with it. Needs a `CreditTransaction` ledger (amount, reason, timestamp) rather than a mutable balance field, so "total earned" is a sum, not something spending can corrupt.

### 4.4 Divisions / tiers

Named bands of rating using the outbound run (`Suborbital -> ... -> Heliopause`), with existing art in `assets/planets/`. Only useful once there's a rating number to bucket. Still open whether these are worth keeping as pure cosmetic flavor even without a leaderboard behind them.

### 4.5 Seasons

A seasonal reset requires something that resets, i.e. a rating or points total. Parked along with 4.1 and 4.3.

### 4.6 Calendar-windowed leaderboard (day/week/month)

Superseded in spirit by the rolling-last-10-races design in section 1, which solves the same staleness problem (an old record sitting unchallenged forever) without needing separate tabs. Worth reviving only if race-count windowing turns out to feel wrong in practice, e.g. if very active players' windows roll over too fast to feel stable.

### 4.7 Integrity gating for the leaderboard

Section 1 already requires finishing on standard settings. Additional hardening considered but not built: minimum accuracy floor, server-verified keystroke timing rather than trusting client-reported WPM, and disqualifying (or clearly flagging, per the new "Ship flown" column) any race where a stat-affecting ship perk was active, so purchased power doesn't silently inflate a leaderboard time.

**Real anti-cheat is explicitly out of scope for v1.** Keystrokes are validated client-side for feel (see 4.9: input has to be local-authoritative or fast typists feel every round trip). That means a modified client or injected input events can lie to the server, and the keystroke-log-replay pipeline in 4.9 doesn't catch that, it only makes the *reported numbers* internally consistent, not necessarily *true*. Full anti-cheat, replaying keystrokes against the actual assigned sentence server-side, statistical outlier detection across the playerbase, rate-limiting, a reporting/trust system, is a real project of its own and isn't worth building against a threat model where nothing but a leaderboard row is at stake. Worth building the log pipeline anyway, since it's the exact infrastructure real anti-cheat would need later, so deferring the detection logic doesn't mean deferring the plumbing.

### 4.8 Ready check queue flow (Dota style)

Match found modal, 15 second accept timer, live "4 of 6 accepted" counter, gentle decline penalties (first free, then short cooldowns). Independent of rating and worth keeping as the eventual queue UX; just doesn't need a band-widening display until 4.2 exists.

### 4.9 Real-time input and server verification (netcode)

Answers "how does the client stay instantly responsive while the server still ends up with a trustworthy number," which is what 4.7's "server-verified keystroke timing" actually depends on.

**Every keystroke is validated and applied locally, with no network round trip.** Correct/wrong, character coloring, hull, speed, and progress are computed client-side on keydown, exactly as `CLAUDE.md` already describes the mechanics. This isn't optional: at 100+ WPM a key lands roughly every 120ms, well inside typical WebSocket round-trip time, so gating feedback on the server would make typing feel sluggish for exactly the players who'd notice most.

There are then three separate network flows out of the client, carrying very different levels of trust and very different timing needs:

- **Periodic position/speed snapshot**, roughly every 50-100ms (10-20Hz), telling the lobby "here's my current progress and speed." Receiving clients interpolate between the last two snapshots rather than snapping to each one, the standard technique for smooth remote-entity motion in any real-time multiplayer game, so the update rate matters far less than the interpolation, and there's no need to push this at 60Hz. A remote player's thruster plume doesn't need its own synced field at all: since it's already purely speed-driven per `CLAUDE.md`, it falls out of the same rendering code once the interpolated speed is available locally.
- **Discrete event stream**, pushed immediately the instant something happens, not on the snapshot cadence: launch ignition, stall entered, stall recovered, hull breach, finish. These are one-shot animation triggers (flame flare, spark burst, the dead-prompt countdown panel), and waiting for the next scheduled snapshot to relay them would make them feel laggy even if the snapshot rate is fast, since a state transition reads as "instant" or it reads as broken, there's no comfortable middle ground the way there is for continuous position.
- **Timestamped keystroke log**, batched and flushed asynchronously (say every 200-500ms or ~20 events), fire-and-forget, never blocking input. At race end the server replays this log itself and computes WPM, completion time, and placement from it directly.

The first two flows are purely cosmetic. Never recorded, never scored, never touch the leaderboard. If a cheater lies in either one, their own rocket looks wrong on other people's screens and nothing else happens. Only the keystroke log feeds anything that gets stored or ranked.

The distinction that matters: **the client's own on-screen WPM during a race is a preview of what the server will derive, not the source of truth.** The server is never told "I finished at 87 WPM" and asked to believe it, it's told what happened, character by character, and does the arithmetic itself. That closes the naive "just report a big number" cheat without requiring any input to wait on the network. It does not close a client that fabricates a plausible-looking log instead of a true one, that gap is the real anti-cheat problem and is deliberately parked in 4.7.

## 5. Open questions

- Is `moonDistance` fixed for the standard queue, or could it ever become a per-lobby setting? The whole leaderboard depends on the answer, since it's a wall-clock time.
- Minimum players to start a race without a rating system to justify a wait: 3? 4?
- Backspace behavior, still unresolved from `CLAUDE.md`, and it affects WPM measurement, which is one of the leaderboard's displayed columns.
- Tie-breaking when two players post the exact same average completion time: accuracy, or earliest-achieved?
- Does the eligibility floor (10 qualifying races) ever get raised or lowered once there's real usage data on how long 10 races takes an average player to complete?
- Is "most-used ship in the window" the right stand-in for a ship column, or should it show the currently-equipped ship, or drop the column entirely?

## History

- **Revision 1**: hidden Elo replaced by measured WPM, a no-loss seasonal Season Points ladder scoped per division to avoid volume beating skill.
- **Revision 2**: Season Points removed. Replaced with Peak WPM (windowed, global, unscoped) as the headline board plus Credits/Top Earners as the explicit volume track, since one great race can't be grinded the way a monotonic points total can.
- **Revision 3**: all rating, ladder, division, credit, and skill-matchmaking thinking parked. Live surface became Best WPM (all-time) plus Fastest Completion (all-time) as two separate boards, and wins on the profile.
- **Revision 4**: collapsed to a single Fastest Completion board, scored as a player's best time within their own last 10 qualifying races rather than an all-time record, with a 10-race eligibility floor before a player appears at all. WPM and ship flown became columns on that one table instead of their own board.
- **Revision 5 (this one)**: scoring changed from best-of-last-10 to average-of-last-10. Best-of-window didn't actually average out luck, since `MIN` ignores everything but the single best race regardless of window size, so the eligibility floor was doing all the anti-luck work alone. Averaging does that work directly and rewards sustained pace over one peak. WPM and accuracy columns became window averages to match; ship became "most-used in the window" since there's no longer one race to point at. Nothing from revisions 1 through 4 was discarded, it lives in section 4.
