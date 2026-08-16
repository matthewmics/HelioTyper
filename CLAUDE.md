## Formatting Rules

- Never use em dashes (—) anywhere in any output: not in prose, code, comments, docstrings, commit messages, file names, or documentation.
- This applies universally, no exceptions for "just this once" or informal contexts.
- Use alternatives instead, depending on context: a comma, a period (splitting into two sentences), a colon, parentheses, or a connecting word like "and," "but," or "so."

## Game Mechanics

HelioTyper is a typing race game: type a stream of sentences correctly to accelerate a rocket out of the solar system, all the way to the heliopause, the boundary where the solar wind stalls against interstellar space. Core mechanics were prototyped in [prototype.html](prototype.html) (single-file canvas, no build step) and are considered locked; see [protoype.md](protoype.md) for the full prototype log. The generated art in [assets/](assets/) has since evolved the finish beyond that prototype, see "The outbound run" below.

**Typing**
- Endless. Sentences are drawn at random from a pool (never the same one twice in a row) and keep coming until the player reaches the finish, there is no "end of text."
- One sentence shown at a time, with per-character coloring for typed, current, and pending characters.
- Backspace is unhandled by design; this is still an open decision.

**Speed and progress**
- Each correct keystroke adds `accel` to `speed`, capped at `maxSpeed`.
- `speed` decays continuously via half-life exponential decay (`halfLife`), clamped to zero below a small epsilon.
- `progress` is purely the integral of speed over time (`speed * dt` accumulated), divided by `moonDistance` (named for the prototype's single-landmark placeholder; conceptually this is total distance to the heliopause). Typing never moves the ship directly, only speed does.
- `moonDistance` is the single race-length knob, since typing is endless there is no paragraph length to calibrate against.

**Mistakes and hull**
- A wrong keydown fires once: `speed` resets to 0, `hull -= 1`, the prompt flashes red, and the ship shakes. The character index does not advance.
- Hull reaching zero does not destroy the ship. It stalls instead: input locks out, physics freeze, sparks burst, and the prompt becomes a red glitching "HULL BREACH - REBOOTING" panel with a live countdown (`STALL_DURATION`). After the countdown, hull refills, speed resets to 0, and typing resumes on the same character.
- Losing outright ("rocket destroyed") is currently unreachable; the only way a run ends is by reaching the finish.

**Blastoff**
- The ship sits cold on the pad until the first correct keystroke.
- Ignition triggers a brief flame flare (`LAUNCH_DURATION`) that decays into the normal speed-driven exhaust plume, plus a billowing smoke cloud, ignition sparks, and screen shake.

**The outbound run (finish design, per [assets/README.md](assets/README.md))**
- `launch pad -> clouds -> moon -> mars -> jupiter -> saturn -> uranus -> neptune -> pluto -> THE HELIOPAUSE`.
- Every intermediate body (moon, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto) is drawn as a disc landmark the ship passes, sized for readability rather than real-world scale; see [assets/planets/README.md](assets/planets/README.md).
- The finish itself is deliberately not a disc: the heliopause is a full-width shimmering aurora curtain spanning the screen, so reaching it reads as crossing an edge rather than passing one more planet; see [assets/finish/README.md](assets/finish/README.md).
- `prototype.html` still implements only the earlier, single-landmark version of this idea (the moon standing in as the one and only finish target). The multi-landmark run to the heliopause is a currently unported design captured at the asset level, expected to land during the ExcaliburJS port.

**Camera and framing**
- The camera never moves. Each landmark is a fixed screen-position element that never scrolls or slides once revealed.
- The ship is the only thing that moves; its screen position interpolates toward the current landmark, driven by `progress`.
- In the prototype, the (sole) landmark is not present at the start. It fades in at `MOON_REVEAL_AT` (75% progress) at the exact spot it will always occupy, like a level's goal coming into view late.
- Starfield drift is cosmetic only, decoupled from actual position.

**Atmosphere**
- Ground: dusk scene with hill silhouette, backlit skyline, launch pad and gantry, falling away in the first few percent of the climb.
- Clouds: real cloud objects at fixed altitudes with parallax depth stream past the ship; a portion draw in front of the rocket for depth.
- Sky: one gradient whose stop colors lerp through keyframes from dusk to black space. Two cross-fading gradients were tried and rejected, they read as a muddy smear.
- Stars: invisible at ground level, fade in as altitude increases.

**HUD**
- Player name pill above the ship's nose.
- Hull segments and a speed bar below the fins, both easing downward to stay clear of the growing exhaust plume.

**Design lessons locked in**
- Progress must be speed-driven, not keystroke-driven; tying progress directly to characters typed made the ship feel like it teleported.
- A fixed landmark must never move toward the ship; only the ship moves.
- A temporary stall reads better than permanent destruction on hull zero, it keeps pressure without ending the session.
- The finish must read as a different kind of object than everything passed en route: every landmark before it is a disc, so the heliopause is a full-width boundary instead, to avoid landing as "one more planet."

**Still undecided**
- Backspace behavior.
- Whether difficulty tiers change decay rate, hull, or race distance.
- Matchmaking model (room codes vs. public quick-match).
- Whether hull regenerates outside of stall recovery.
- How the multi-landmark outbound run (moon through Pluto to the heliopause) replaces the prototype's single moon-as-finish placeholder in actual gameplay code.

**Roadmap**
1. Real sprite art now that mechanics are locked, already generated for rockets, planets, the heliopause finish, effects, and environment; see [assets/](assets/).
2. Port to ExcaliburJS (camera lock-to-actor, particle system, the full outbound run to the heliopause); see [_prototypes/typosphere/](_prototypes/typosphere/) for the in-progress port.
3. NestJS gateway with a server-authoritative loop, starting single-player against the server.
4. Multiplayer: lobby, room codes, countdown, minimap, multiple rockets.
5. Persistence (Postgres/Prisma) for race history and leaderboards.