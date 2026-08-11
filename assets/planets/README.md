# Planets

The bodies the rocket passes on its way to the edge of the solar system. One
sheet, `planets.png`, 960×2208, 11 frames, ~360KB.

```
node assets/planets/gen-planets.mjs
```

Open `preview.html` directly in a browser to fly the whole outbound sequence. No
server needed.

| File | What it is |
|---|---|
| `planets.png` / `.json` | the sheet + frame rects |
| `atlas.js` | the atlas as `window.PLANET_ATLAS`, for `file://` loading |
| `gen-planets.mjs` | the generator — source of truth for the art |
| `preview.html` | animated viewer |

Every body is anchored at its **centre** — including Saturn and Uranus, whose
rings extend well past the disc. Draw at `(x - ax, y - ay)`.

---

## The outbound run

`order` in the atlas is the sequence, so the game can drive the whole run off
one array:

| # | Body | Sprite radius | Why it reads |
|---|---|---|---|
| 1 | `moon` | 130 | cratered, close, familiar — the first "you left" beat |
| 2 | `mars` | 90 | rust, dark albedo patches, white polar caps |
| 3 | `jupiter` | 200 | banded, turbulent, Great Red Spot. The biggest thing in the run |
| 4 | `saturn` | 170 | rings, with the Cassini division |
| 5 | `uranus` | 110 | pale cyan, **vertical** rings |
| 6 | `neptune` | 125 | deep blue, Great Dark Spot, methane cirrus |
| 7 | `pluto` | 70 | mottled, with Tombaugh Regio — the heart |

Mercury and Venus are sunward, so they never appear on an outbound trip.

**Sizes are readable, not physical.** Real radii run from Pluto at 1,188km to
Jupiter at 69,911km — a 59× spread that would make Pluto a single pixel beside a
body too big for the screen. These preserve the size *ordering* while keeping
every planet legible. Apparent size in game comes from your draw scale anyway,
since each body is passed at a different distance. The radii are in the atlas
under `radii` if you want to drive scaling off them.

---

## The two that aren't just discs

**Saturn** is built as three stacked layers baked into one frame: far rings,
planet, near rings. The rings pass *behind* the planet at the top and *in front*
at the bottom, which is the whole reason Saturn reads as a 3D object rather than
a sticker. You get it as a single sprite — no layering needed at the call site.

**Uranus** is tipped ~98°, so its rings appear almost vertical. That is the
detail that makes it instantly readable as Uranus instead of "small blue planet
#1", and it's why it gets a taller cell than its disc needs.

---

## Moon beacon

`beacon_0..3` is an optional overlay on the moon's cell (4 frames, 6fps, loops):
a mast and pennant on the upper-left limb with a pulsing light.

It was built when the moon was the finish line. Now that the race runs to the
edge of the solar system it's flavour — "humanity got this far" — so draw it or
don't. It sits on the moon's cell, so drawing it at the moon's position lines it
up exactly.

---

## Tweaking

Near the top of `gen-planets.mjs`:

- `STD` / `URA` / `JUP` / `SAT` — cell sizes and anchors
- `*_R` constants — the sprite radii
- `buildBody` — the shared pipeline: atmosphere halo → base disc → surface
  detail masked to the disc → spherical shading
- `band` / `turbulence` — gas-giant banding
- `annulus` / `keepHalf` — ring construction and the front/back split

Three things that were wrong on the first pass and are worth not re-breaking:

- **Surface detail is masked to the disc.** Blotches drawn near the limb spill
  outside the circle otherwise, and you get blobs floating off the planet.
- **The annulus polygon closes both loops** (`0..steps` inclusive, not
  `0..steps-1`). Leaving the outer loop open cuts a hairline slit through
  Saturn's rings along the +x axis.
- **`shadeSphere` runs last and skips `d > 1`**, so it shades the planet without
  dimming the atmosphere halo behind it.
