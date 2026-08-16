# HelioTyper: Prototype Progress

Single-file canvas prototype: [prototype.html](prototype.html). No build step, no
dependencies, no server. Open it in a browser and it runs.

Purpose was to get the mechanics feeling right before committing to the real stack.
Mechanics are now locked enough to build on.

---

## What's working

**Typing**

- Endless. Sentences are drawn at random from a pool (never repeating back to back)
  and keep coming until the player reaches the moon. There is no "end of text."
- One sentence on screen at a time, bottom of the viewport. Per-character
  colouring: typed / current / pending.
- Content is currently short placeholder sentences for fast dev iteration. Swap
  back to real 200–260 char paragraphs before it ships.

**Speed / progress**

- Correct char adds `accel` to `speed`, capped at `maxSpeed`.
- `speed` decays continuously via half-life exponential decay, clamped to zero
  below epsilon.
- `progress` is purely the integral of speed over time (`speed * dt` accumulated),
  divided by `moonDistance`. Nothing else touches it — typing does not move the
  ship directly, only speed does.
- `moonDistance` is the single race-length knob. Because typing is endless there is
  no paragraph length to calibrate against.

**Mistakes / hull**

- Fires once per wrong keydown. `speed = 0` instantly, `hull -= 1`, prompt flashes
  red, ship shakes. Character index does not advance.
- **Hull zero no longer destroys the ship.** It stalls: input locked out, physics
  frozen, spark burst, and the prompt box turns into a red glitching
  "HULL BREACH — REBOOTING" panel with a live countdown. After `STALL_DURATION`
  the hull refills, speed resets to 0, and typing resumes on the same character.
- The "rocket destroyed" end state is currently unreachable. Only way a run ends is
  reaching the moon.
- Backspace still unhandled (unchanged from spec — still an open decision).

**Blastoff**

- Ship starts sitting on the pad. Flame is completely cold until the first correct
  keystroke.
- On ignition: ~1.1s flame flare that decays into the normal speed-driven plume,
  billowing exhaust cloud that expands as it dissipates, ignition sparks, screen
  shake.

**Camera / framing (the part that took the most iteration)**

- The camera never moves. The **moon is a fixed landmark** at a constant screen
  position and never scrolls, slides, or animates its position.
- The **ship is the only thing that moves.** Its screen Y interpolates from near the
  bottom up to the moon's position, driven by `progress`.
- The moon is **not present at the start.** It fades in at `MOON_REVEAL_AT` (75%) at
  the exact spot it will always occupy — like the castle coming into view late in a
  Mario level.
- Starfield drift is cosmetic only (eased `camSpeed`), decoupled from actual position.

**Atmosphere**

- Ground: dusk (~6pm). Hill silhouette, backlit city skyline, warm orange horizon
  glow, launch pad + gantry. Falls away in the first few percent of the climb.
- Clouds: 22 real cloud objects at fixed altitudes that physically stream past the
  ship. Each has a parallax `depth`; ~25% are foreground and draw *in front of* the
  rocket. Warm sunset rim on top that fades as you climb above the light.
- Sky: **one** gradient whose stop colours lerp through 5 keyframes
  (dusk → last light → upper atmosphere → edge of space → black).
- Stars: invisible at ground level, fade in between 26%–68% progress.

**Ship HUD**

- Player name ("Player1") on a pill above the nose.
- Hull segments below the fins.
- Speed bar below that — track + fill, `speed / maxSpeed`, gradient spans the whole
  track so a given speed always reads the same colour. Glows amber at max.
- Both bars slide down together to stay clear of the exhaust plume as it grows,
  tracking the flame's actual bezier tip. Eased so it glides.

**Dev panel** — live sliders for accel, decay half-life, hull segments, distance to
moon, max speed. Restart button.

---

## Current defaults

| Setting | Value | Notes |
|---|---|---|
| `accel` (per correct char) | `0.09` | slider 0.02 – 0.30 |
| `halfLife` (decay) | `1.4s` | slider 0.4 – 4.0 |
| `maxHull` | `5` | slider 1 – 10 |
| `moonDistance` | `14` | slider 4 – 60, the race-length knob |
| `maxSpeed` | `1.2` | slider 0.2 – 3.0 |
| `STALL_DURATION` | `5s` | |
| `MOON_REVEAL_AT` | `0.75` | |
| `LAUNCH_DURATION` | `1.1s` | |

---

## Lessons confirmed / added

- **Stacked cross-fading CSS gradients for atmosphere: still a dead end.** The
  atmosphere works now because it's drawn layers in canvas — real cloud objects with
  parallax, a receding ground silhouette, a star fade — with a *single* gradient
  whose stop colours are lerped. Two gradients fading over each other is what read
  as a muddy smear.
- **The finish line must not move.** Every version where the moon animated toward
  the ship felt wrong. Fixed landmark + moving ship is the correct read.
- **Progress must be speed-driven, not keystroke-driven.** Any version where
  progress was tied to `correctChars / totalChars` made typing itself feel like it
  teleported the ship, which kills the whole point of the decay mechanic.
- **Stall reads better than destruction.** Losing the run outright on hull zero was
  punishing and ended the session; a 5s lockout with a visibly broken input panel
  keeps the pressure without ending things.

---

## Still undecided

- Backspace behaviour
- Whether difficulty tiers change decay rate, hull, or moon distance
- Matchmaking model: room codes only, or public quick-match
- Whether hull regenerates outside of stall recovery
- Finish-line art — moon works, but a beacon/flag on it (or a station/portal) would
  give the reveal a stronger payoff than a plain circle

---

## Next steps

1. Real sprite art now that mechanics are locked.
2. Port to ExcaliburJS scene (camera lock-to-actor, particle system).
3. NestJS gateway + server-authoritative loop, single-player against the server.
4. Multiplayer: lobby, room codes, countdown, minimap, multiple rockets.
5. Persistence (Postgres/Prisma) for race history and leaderboards.
