/**
 * Typosphere finish line — the heliopause.
 *
 * Run with:  node assets/finish/gen-finish.mjs
 *
 * The real boundary where the solar wind stalls against interstellar space.
 * Drawn as a shimmering aurora curtain standing across the whole screen.
 *
 * WHY A WALL AND NOT ANOTHER SPHERE: every landmark on the run — moon, Mars,
 * Jupiter, Saturn, Uranus, Neptune, Pluto — is a disc. If the finish line is
 * also a disc it reads as "one more planet" and the payoff lands flat. A
 * full-width boundary you cross is a different kind of object, so arriving at
 * it reads as arriving at an edge.
 *
 * It is TILEABLE horizontally: the curtain field is a sum of sines at integer
 * frequencies over the cell width, so x=0 and x=1024 evaluate identically and
 * the strip repeats at any viewport width. Animating the phase shifts the
 * pattern without breaking that.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SS, mulberry32, seedOf, Layer, blur, hex, Ctx, newCell, mixColor,
  packSections, writeSheet, writeAtlasGlobal,
} from '../lib/raster.mjs';

const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));

// anchor: left edge, on the shock front itself — same convention as the
// ground strips, so you draw it at (tileX, finishLineY)
const FIN = { w: 1024, h: 320, ax: 0, ay: 250 };
const FRAMES = 6;

const COL = {
  hot: hex('#ffffff'),
  core: hex('#9df6ff'),
  cyan: hex('#3fd2ff'),
  teal: hex('#31efc4'),
  violet: hex('#8a6bff'),
  deep: hex('#2a3bd0'),
};

/**
 * Periodic 1-D field from an explicit list of INTEGER frequencies — integer is
 * what keeps it seamless across the tile. `t` advances the phase so the curtain
 * shimmers between frames without breaking that.
 */
function field(seed, freqs) {
  const rnd = mulberry32(seedOf(seed));
  const waves = freqs.map((f, i) => ({
    f,
    amp: 1 / (i + 1),
    phase: rnd() * Math.PI * 2,
    spd: (rnd() - 0.5) * 1.8,
  }));
  const norm = waves.reduce((s, w) => s + w.amp, 0);
  return (x, t) => {
    let v = 0;
    for (const w of waves) {
      v += w.amp * Math.sin((x / FIN.w) * Math.PI * 2 * w.f + w.phase + w.spd * t);
    }
    return v / norm;                                  // -1..1
  };
}

// Low frequencies shape the overall height of the curtain...
const shapeBack = field('curtain-back', [1, 2, 3, 5, 8]);
const shapeMid = field('curtain-mid', [2, 3, 5, 7, 11]);
const shapeFront = field('curtain-front', [2, 4, 6, 9, 13]);
// ...high ones cut it into individual rays. Without these the curtain is a
// smooth sheet, which both loses the aurora read and shows 8-bit banding as
// contour lines across the flat gradient.
const raysBack = field('rays-back', [23, 31, 43, 59, 79]);
const raysMid = field('rays-mid', [29, 41, 53, 73, 101]);
const raysFront = field('rays-front', [37, 47, 67, 89, 127]);
const frontMod = field('shock-front', [1, 2, 3, 5, 8]);

/** Cheap deterministic dither, to break banding in the faint flat gradients. */
function dither(x, y) {
  const h = Math.imul(x * 73856093 ^ y * 19349663, 0x45d9f3b) >>> 0;
  return (h / 4294967296) - 0.5;
}

/**
 * One curtain layer: a wall of vertical rays whose height and brightness follow
 * the field. Drawn per-column straight into the layer — stacking quads leaves
 * banding, and the field is smooth enough that neighbouring columns blend.
 */
function drawCurtain(L, t, cfg) {
  const baseY = FIN.ay * SS;
  const H = cfg.height * SS;

  for (let x = 0; x < L.w; x++) {
    const u = x / SS;
    // ray brightness is sharpened into peaks, so bright rays sit in darker
    // gaps instead of merging into one flat sheet
    const ray = Math.pow(0.5 + 0.5 * cfg.rays(u, t * 1.3), 2.1);
    const hFrac = cfg.min + (0.5 + 0.5 * cfg.shape(u, t)) * (1 - cfg.min)
      * (0.55 + 0.45 * ray);
    const bright = cfg.bright * (0.16 + 0.84 * ray);
    const top = baseY - H * hFrac;
    const span = baseY - top;
    if (span <= 1) continue;

    for (let y = Math.max(0, Math.floor(top)); y <= baseY && y < L.h; y++) {
      const k = (baseY - y) / span;                   // 0 at the front, 1 at the tip
      // no dither here — the ray structure already breaks up banding, and
      // per-pixel noise across this much translucent area wrecks PNG size
      const a = bright * Math.pow(1 - k, cfg.falloff);
      if (a <= 0.002) continue;
      L.add(x, y, mixColor(cfg.hot, cfg.tip, Math.pow(k, 0.75)), a);
    }
  }
}

function renderHeliopause(frame) {
  const { L } = newCell(FIN);
  const t = (frame / FRAMES) * Math.PI * 2;
  const fx = new Layer(L.w, L.h);
  const c = new Ctx(fx, FIN.ax, FIN.ay);
  const baseY = FIN.ay * SS;

  // Three depth layers, tallest and coolest at the back. The back layer is kept
  // dim with a soft falloff and a low `min`: give it a bright, sharply-topped
  // envelope and its tip edge reads as a hard contour line across the sky.
  drawCurtain(fx, t, {
    shape: shapeBack, rays: raysBack, height: 245, min: 0.12, falloff: 1.9,
    bright: 0.24, hot: COL.teal, tip: COL.violet,
  });
  drawCurtain(fx, t * 1.15 + 0.7, {
    shape: shapeMid, rays: raysMid, height: 170, min: 0.2, falloff: 1.7,
    bright: 0.4, hot: COL.cyan, tip: COL.teal,
  });
  drawCurtain(fx, t * 0.85 + 1.9, {
    shape: shapeFront, rays: raysFront, height: 105, min: 0.22, falloff: 2.0,
    bright: 0.5, hot: COL.core, tip: COL.cyan,
  });

  // the shock front itself — the bright compressed line the curtain stands on
  const sigma = 5.5 * SS;
  for (let x = 0; x < fx.w; x++) {
    const u = x / SS;
    const m = 0.55 + 0.45 * (0.5 + 0.5 * frontMod(u, t));
    for (let dy = -Math.round(sigma * 3); dy <= Math.round(sigma * 2); dy++) {
      const y = baseY + dy;
      if (y < 0 || y >= fx.h) continue;
      const g = Math.exp(-(dy * dy) / (2 * sigma * sigma));
      fx.add(x, y, COL.core, 0.5 * m * g);
      fx.add(x, y, COL.hot, 0.32 * m * Math.pow(g, 3.5));
    }
  }

  // soft underglow on the approach side, so the boundary lights the ship
  const under = 62 * SS;
  for (let dy = 0; dy < under; dy++) {
    const y = baseY + dy;
    if (y >= fx.h) break;
    const a = 0.085 * Math.pow(1 - dy / under, 2.3);
    for (let x = 0; x < fx.w; x++) {
      const u = x / SS;
      fx.add(x, y, COL.teal,
        a * (0.6 + 0.4 * (0.5 + 0.5 * frontMod(u, t))) * (1 + 0.2 * dither(x, y)));
    }
  }

  // Bright knots riding along the front. Drawn three times — at u, u-w and u+w
  // — so a knot near either edge wraps instead of being clipped. Clipping it is
  // the one thing here that would break horizontal tiling.
  const knotRnd = mulberry32(seedOf(`knots${frame}`));
  for (let i = 0; i < 9; i++) {
    const u = ((i + 0.5) / 9) * FIN.w + knotRnd() * 40 - 20;
    const m = 0.5 + 0.5 * frontMod(u, t);
    const y = -2 - knotRnd() * 10;
    const rOuter = 16 + knotRnd() * 16;
    const rInner = 5 + knotRnd() * 4;
    if (m < 0.55) continue;
    for (const wrap of [-FIN.w, 0, FIN.w]) {
      c.softDisc(u + wrap, y, rOuter, COL.core, 0.3 * m, 2, 'add');
      c.softDisc(u + wrap, y, rInner, COL.hot, 0.55 * m, 2, 'add');
    }
  }

  L.addLayer(blur(fx, Math.round(1.6 * SS)), 0.45);
  L.addLayer(fx, 1);
  return L;
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

console.log('drawing finish line…');

const cells = [];
for (let f = 0; f < FRAMES; f++) {
  cells.push({ name: `heliopause_${f}`, layer: renderHeliopause(f) });
}

const { sheet, frames, size } = packSections([
  { cols: 1, spec: FIN, cells },
]);

const atlas = {
  id: 'finish',
  image: 'finish.png',
  note: 'The heliopause. Anchored at the LEFT EDGE on the shock front, so draw at (tileX, finishLineY) and repeat horizontally to fill the viewport.',
  size,
  tileableX: cells.map((c) => c.name),
  frames,
  animations: {
    heliopause: { frames: cells.map((c) => c.name), fps: 6, loop: true },
  },
};

const bytes = writeSheet(OUT_DIR, 'finish', sheet, atlas);
writeAtlasGlobal(OUT_DIR, 'atlas.js', { FINISH_ATLAS: atlas }, 'gen-finish.mjs');

console.log(
  `  finish.png  ${size.w}×${size.h}  ` +
  `${Object.keys(frames).length} frames  ${(bytes / 1024).toFixed(0)} KB`
);
