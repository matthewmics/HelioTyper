# Environment

Clouds, ground layers and the launch pad. One sheet, `environment.png`,
1024×1440, 12 frames, ~140KB.

Celestial bodies live in [`../planets/`](../planets/) — the moon moved there when
the race was extended to the edge of the solar system.

```
node assets/environment/gen-environment.mjs
```

Open `preview.html` directly in a browser — it renders the real dusk-to-space
sky with an altitude slider, so you can watch the ground fall away, the clouds
stream past. No server needed.

| File | What it is |
|---|---|
| `environment.png` / `.json` | the sheet + frame rects |
| `atlas.js` | the atlas as `window.ENV_ATLAS`, for `file://` loading |
| `gen-environment.mjs` | the generator — source of truth for the art |
| `preview.html` | animated viewer |

---

## What is deliberately NOT here

**The sky gradient and the starfield stay in code.** `protoype.md` already
records that stacked/cross-faded gradient art reads as a muddy smear, and that
the single gradient with lerped stop colours is the thing that works. Replacing
it with sprites would undo that. Same for the 220-dot starfield — though
`effects/star` is there if you want softer dots than `arc()`.

---

## Anchors

Not all centred — each frame is anchored where it's naturally positioned:

| Frame | Anchor | Draw it at |
|---|---|---|
| `cloud_*` | centre | the cloud's position |
| `pad` | **deck surface, centred** | the point the rocket stands on |
| `hills_*`, `skyline` | **left edge, on the horizon line** | `(tileX, horizonY)` |

The pad anchor means you place it at the same y the ship's base sits at and it
lines up — no fiddling with slab thickness.

---

## Frames

### Clouds — `cloud_0..3` + `cloud_0_rim..3_rim` (320×160)

Four cumulus shapes with flat bases. **White with form shading baked in
(lit from above), meant to be tinted** — the prototype uses two different cloud
colours, near silhouettes (`rgba(26,28,48)`) and far haze (`rgba(66,70,104)`),
and one tintable texture covers both. Listed under `tintable` in the atlas.

Each cloud has a matching `_rim` overlay: the warm sunset edge, as a **separate
additive frame drawn at the same position**, so you can fade it out with
altitude the way [prototype.html:498](../../prototype.html#L498) already does.
It's authored at full strength — scale its alpha down, don't scale it up.

The rim is derived from the cloud's own silhouette (shift the alpha up, subtract)
rather than placed per-lobe. Per-lobe rim blobs leave gaps between lobes and
read as a string of lights.

### Ground — `hills_near`, `hills_far` (1024×256), `skyline` (1024×192)

Three parallax strips, all **tileable horizontally** (`tileableX` in the atlas).
The ridges are sums of sines at *integer* frequencies over the cell width, so
`x=0` and `x=1024` evaluate identically and the seam is invisible — scroll them
at different rates for parallax.

Each carries a thin warm backlight along its top edge, because the sun is
setting behind them. The skyline has sparse lit windows and a few antennae.

### Launch pad — `pad` (512×256)

Deck slab with hazard striping, two lattice gantry towers with cross bracing,
service arms and amber beacon lights. Replaces the five `fillRect`s at
[prototype.html:434](../../prototype.html#L434).

Sized so a rocket sits on the deck with room either side — the deck is 232 units
wide against the ships' ~68-unit fin span.

---

## Tweaking

Near the top of `gen-environment.mjs`:

- `PAL` — every colour
- `CLOUD` / `PAD` / `HILLS` / `SKYLINE` — cell sizes and anchors
- `cloudLobes` — cloud silhouettes
- `ridgeFn` — hill wave amplitudes (keep frequencies integer or tiling breaks)
- `renderPad`, `renderHills`, `renderSkyline` — the props
