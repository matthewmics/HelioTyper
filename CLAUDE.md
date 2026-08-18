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
- Decay bottoms out at a cruise floor (`minSpeed`), not at zero: speed is only truly 0 when the ship is cold on the pad before the first keystroke, locked out by a stall, or finished. `prototype.html` still decays to a dead stop; the floor was added in the ExcaliburJS port because over a full solar-system run a motionless scene reads as the game having frozen rather than as lost speed.

**Mistakes and hull**
- A wrong keydown fires once: `speed` drops to the cruise floor (0 in the prototype), `hull -= 1`, the prompt flashes red, and the ship shakes. The character index does not advance.
- Hull reaching zero does not destroy the ship. It stalls instead: input locks out, physics freeze, sparks burst, and the prompt goes dead with a live countdown (`STALL_DURATION`). After the countdown, hull refills, speed resets to the cruise floor, and typing resumes on the same character.
- WPM is elapsed correct characters over elapsed run time, and stall time is excluded from that clock: since input is locked out during a stall, no keystrokes could have landed anyway, so counting that time would only drag the average down for something the player couldn't affect.
- The prototype replaced the prompt with a "HULL BREACH - REBOOTING" panel; the ExcaliburJS port instead keeps the whole sentence on screen and greys it out, with arcs flickering around the panel border and the countdown on a chip straddling its top edge. Hiding the text is worst exactly when the player most wants to see where they will resume.
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
2. Port to ExcaliburJS (camera lock-to-actor, particle system, the full outbound run to the heliopause); see [_prototypes/heliotyper-game-prototype/](_prototypes/heliotyper-game-prototype/) for the in-progress port.
3. NestJS gateway with a server-authoritative loop, starting single-player against the server.
4. Multiplayer: lobby, room codes, countdown, minimap, multiple rockets.
5. Persistence (Postgres/Prisma) for race history and leaderboards.

## Local Development

This is a pnpm workspace (`pnpm-workspace.yaml` at the repo root) with two packages: [api/](api/) (NestJS) and [web/](web/) (Next.js). Run `pnpm install` at the repo root, not inside either package.

**Hosts file**, add these entries (already added on the primary dev machine):
```
127.0.0.1 heliotyper.local
127.0.0.1 admin.heliotyper.local
127.0.0.1 pgadmin.heliotyper.local
127.0.0.1 api.heliotyper.local
127.0.0.1 mail.heliotyper.local
```
`admin.heliotyper.local` is reserved for a future admin project that doesn't exist yet, it isn't dockerized or routed.

**Docker**: both `api/` and `web/` are containerized. `docker-compose.yml` at the repo root brings up:
- `api`, built from [api/Dockerfile](api/Dockerfile), source bind-mounted with webpack HMR for hot reload (see below), routed at `api.heliotyper.local`.
- `web`, built from [web/Dockerfile](web/Dockerfile), source bind-mounted, routed at `heliotyper.local`.
- `postgres` (Postgres 18), internal only, also published on host port 5432.
- `redis`, internal only, also published on host port 6379.
- `mailpit`, an SMTP catcher for local email testing, routed at `mail.heliotyper.local`, SMTP published on host port 1025.
- `pgadmin`, routed at `pgadmin.heliotyper.local`.
- `traefik`, the reverse proxy that resolves the `*.heliotyper.local` hostnames above to the right container, dashboard on `localhost:8080`.

Copy `.env.example` to `.env` before first run, then `docker compose up -d`.

**Prisma** (v7, `api/` only): schema in [api/prisma/schema.prisma](api/prisma/schema.prisma), CLI config in [api/prisma.config.ts](api/prisma.config.ts). One model so far, `User`. [api/src/prisma/prisma.module.ts](api/src/prisma/prisma.module.ts) is `@Global()`, so injecting `PrismaService` anywhere needs no extra import.

Notes specific to v7:
- There is no Rust query engine, so connections go through a driver adapter (`@prisma/adapter-pg`), constructed in [api/src/prisma/prisma.service.ts](api/src/prisma/prisma.service.ts).
- The CLI no longer auto-loads `.env`. `prisma.config.ts` does it with `import 'dotenv/config'`, reading `api/.env` (copy `api/.env.example` to `api/.env`), which points at `localhost:5432` for host-side CLI runs. In the container `docker-compose.yml` already sets `DATABASE_URL` to the `postgres` service, and dotenv does not override an existing value.
- The client is generated into `api/src/generated/prisma` (gitignored) rather than `node_modules`, so it has to be built before the API compiles: `pnpm --filter api prisma:generate`, and again after every schema change. [api/Dockerfile](api/Dockerfile) runs it too, so a fresh image works even though the dev bind mount then shadows it with the host copy. Output is plain TypeScript with no platform-specific artifacts, so host-generated files run fine in the Linux container.
- The generator is pinned to `moduleFormat = "cjs"` with `importFileExtension = ""`. Inferred from `tsconfig.json`'s `module: nodenext` it would emit ESM using `import.meta.url` and `.js` specifiers, which neither `nest build` (CJS) nor the webpack dev build can resolve.
- `prisma.config.ts` sits at the package root and is excluded in [api/tsconfig.build.json](api/tsconfig.build.json). Without that exclusion tsc widens `rootDir` to the package root and emits `dist/src/main.js`, breaking `start:prod`.
- Migrations: `pnpm --filter api prisma:migrate --name <name>` from the host, or `docker compose exec api pnpm prisma:migrate --name <name>`.

**Hot reload**: `api/start:dev` uses NestJS's webpack HMR recipe (https://docs.nestjs.com/recipes/hot-reload), not `nest start --watch`, see [api/webpack-hmr.config.js](api/webpack-hmr.config.js). Inside Docker, webpack's file watcher is set to poll (`watchOptions.poll`) because native filesystem change events don't reliably cross the bind mount from the Windows host into the Linux container.

`web` normally runs on Turbopack (`next dev`, the `web/package.json` `dev` script, used for host-side dev), but as of Next.js 16 Turbopack has no documented polling mode, so it never sees changes through the same bind mount. The `web` container's `Dockerfile` CMD overrides this to `next dev --webpack` with `WATCHPACK_POLLING=true` instead, webpack HMR with polling, same fix as `api`, just Turbopack-only in Docker specifically. Host-side `pnpm --filter web dev` is unaffected and still uses Turbopack.

Getting webpack to recompile on file changes was only half the fix. The browser tab also needs the dev server to push it a message over `/_next/hmr` so it knows to Fast Refresh, and Next's dev server blocks that push by default for any origin other than `localhost`, silently, with only a log line in the container ("Cross-origin access to Next.js dev resources is blocked by default for safety"). Since we load the app at `heliotyper.local` through Traefik, this blocked every push, edits compiled fine server-side but never reached the open tab, so it looked like hot reload wasn't working until a manual refresh. Fixed via `allowedDevOrigins: ["heliotyper.local"]` in [web/next.config.ts](web/next.config.ts) (requires a dev server restart to take effect, config isn't hot-reloaded).