/**
 * HelioTyper environment generator: clouds, ground layers, launch pad.
 *
 * Run with:  node assets/environment/gen-environment.mjs
 *
 * These replace the shapes prototype.html draws by hand: circle-puff clouds, a
 * bezier hill, and fillRect skyline and pad. Celestial bodies (the moon and the
 * planets) live in assets/planets/ instead.
 *
 * NOT replaced, deliberately: the sky gradient and the starfield. The prototype
 * already learned that stacked/blended gradient art reads as a muddy smear, and
 * the single lerped gradient in code is the thing that works. Baking sky into
 * sprites would be a regression.
 *
 * Clouds are white with form shading baked in, to be tinted at runtime — the
 * prototype uses two different cloud colours (near silhouette vs far haze) and
 * one tintable texture covers both.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SS, mulberry32, seedOf, Layer, blur, hex, Ctx, newCell,
  packSections, writeSheet, writeAtlasGlobal,
} from '../lib/raster.mjs';

const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));

const WHITE = [1, 1, 1];
const WARM = hex('#ffa468');      // the prototype's dusk rim colour

const PAL = {
  steel: hex('#2b3149'), steelDark: hex('#1a1f31'), steelBlack: hex('#10131e'),
  amber: hex('#ffb02e'), hazard: hex('#ff8a3c'),
  rock: hex('#e8ecff'), rockMid: hex('#c2c8e4'), rockDark: hex('#9aa1c4'),
  hillNear: hex('#080a12'), hillFar: hex('#12131f'), city: hex('#12131f'),
  window: hex('#ffb46e'),
};

const CLOUD = { w: 320, h: 160, ax: 160, ay: 80 };
const PAD = { w: 512, h: 256, ax: 256, ay: 168 };  // anchor = deck surface, centred
const HILLS = { w: 1024, h: 256, ax: 0, ay: 96 };  // anchor = horizon line, left edge
const SKYLINE = { w: 1024, h: 192, ax: 0, ay: 170 };

/** Scale every channel below a device-space Y, cutting a soft flat edge. */
function fadeBelow(L, deviceY, feather) {
  for (let y = Math.max(0, Math.floor(deviceY)); y < L.h; y++) {
    const k = Math.max(0, 1 - (y - deviceY) / feather);
    for (let x = 0; x < L.w; x++) {
      const i = (y * L.w + x) * 4;
      L.d[i] *= k; L.d[i + 1] *= k; L.d[i + 2] *= k; L.d[i + 3] *= k;
    }
  }
}

/* ------------------------------------------------------------------ *
 * Clouds — 4 shapes, each with a separate warm rim overlay
 * ------------------------------------------------------------------ */

function cloudLobes(variant) {
  const rnd = mulberry32(seedOf(`cloud${variant}`));
  const lobes = [];
  const n = 5 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    // fat in the middle, tapering to the ends — a cumulus, not a sausage
    const bulge = Math.sin(t * Math.PI);
    lobes.push({
      x: (t - 0.5) * (150 + rnd() * 60),
      y: 14 - bulge * (18 + rnd() * 16) + (rnd() - 0.5) * 8,
      r: 16 + bulge * 20 + rnd() * 10,
    });
  }
  return lobes;
}

/**
 * Returns the cloud and its warm rim together, because the rim is derived from
 * the cloud's own silhouette: shift the alpha down and subtract, and what's
 * left is exactly the top edge. Placing rim blobs at the lobe centres instead
 * leaves gaps between lobes and reads as a string of lights.
 */
function buildCloud(variant) {
  const { L, c } = newCell(CLOUD);
  // fairly solid discs with a tight falloff — a soft falloff plus blur turns
  // the whole thing into fog and loses the cauliflower edge
  for (const l of cloudLobes(variant)) {
    c.softDisc(l.x, l.y, l.r, WHITE, 0.85, 0.32, 'over');
  }

  // flat base — cumulus sit on a shelf, blobs of circles do not
  fadeBelow(L, (CLOUD.ay + 24) * SS, 4 * SS);

  const cloud = blur(L, Math.max(1, Math.round(0.45 * SS)));

  // lit from above
  const top = (CLOUD.ay - 42) * SS, bot = (CLOUD.ay + 26) * SS;
  cloud.shade((x, y) => {
    const t = Math.max(0, Math.min(1, (y - top) / (bot - top)));
    return 1 - t * 0.52;
  });

  // warm sunset rim, kept as a separate additive overlay so the game can fade
  // it out with altitude the way the prototype already does
  const rim = new Layer(cloud.w, cloud.h);
  const shift = Math.round(6 * SS);
  for (let y = 0; y < cloud.h; y++) {
    for (let x = 0; x < cloud.w; x++) {
      // sample ABOVE: present here, absent higher up == the top edge
      const e = cloud.alphaAt(x, y) - cloud.alphaAt(x, y - shift);
      // drawn at full strength; the game scales it down as altitude climbs
      if (e > 0.02) rim.add(x, y, WARM, e * 1.4);
    }
  }

  return { cloud, rim: blur(rim, Math.max(1, Math.round(0.8 * SS))) };
}

/* ------------------------------------------------------------------ *
 * Launch pad + gantry
 * ------------------------------------------------------------------ */

function renderPad() {
  const { L, c } = newCell(PAD);
  const p = PAL;

  // concrete base and flame trench, below the deck
  c.poly([[-96, 20], [96, 20], [74, 84], [-74, 84]], p.steelBlack);
  c.poly([[-96, 20], [96, 20], [90, 34], [-90, 34]], p.steelDark);
  c.ellipse(0, 22, 40, 9, [0, 0, 0], 0.55);

  // deck slab
  c.rect(-116, 0, 232, 13, p.steel);
  c.rect(-116, 13, 232, 9, p.steelDark);
  c.rect(-116, 0, 232, 2.5, [1, 1, 1], 0.12);          // top edge catch-light

  // hazard stripes along the deck lip
  for (let i = 0; i < 16; i++) {
    const x = -116 + i * 14.5;
    c.poly([[x, 13], [x + 7, 13], [x + 3, 22], [x - 4, 22]], i % 2 ? p.hazard : p.steelBlack, 0.85);
  }

  // two lattice towers
  for (const s of [-1, 1]) {
    const bx = 132 * s;
    const top = -152;
    c.rect(bx - 13, top, 5.5, 152, p.steelDark);        // rails
    c.rect(bx + 8, top, 5.5, 152, p.steelDark);
    for (let y = top + 8; y < 0; y += 19) {             // cross bracing
      c.thickLine([[bx - 9, y], [bx + 11, y + 19]], 2.4, p.steelBlack);
      c.thickLine([[bx + 11, y], [bx - 9, y + 19]], 2.4, p.steelBlack);
      c.rect(bx - 11, y - 1.6, 22, 2.6, p.steel, 0.9);
    }
    c.rect(bx - 15, top - 7, 30, 8, p.steel);           // tower cap
    c.rect(bx - 13, top, 1.8, 152, WARM, 0.28);         // warm dusk rim on the rail
  }

  // service arms reaching in toward the rocket
  for (const s of [-1, 1]) {
    const inner = 44 * s, outer = 124 * s;
    const x0 = Math.min(inner, outer), w = Math.abs(outer - inner);
    c.rect(x0, -108, w, 7, p.steel);
    c.rect(x0, -108, w, 1.8, WARM, 0.22);
    c.rect(x0, -101, w, 3, p.steelBlack, 0.8);
  }

  // beacon lights
  for (const [lx, ly] of [[-132, -160], [132, -160], [-116, -2], [116, -2]]) {
    c.softDisc(lx, ly, 11, PAL.amber, 0.5, 2, 'add');
    c.disc(lx, ly, 2.4, PAL.amber, 1);
  }

  return L;
}

/* ------------------------------------------------------------------ *
 * Ground silhouettes — tileable strips
 *
 * The ridge is a sum of sines at INTEGER frequencies over the cell width, so
 * x=0 and x=w evaluate identically and the strip repeats seamlessly.
 * ------------------------------------------------------------------ */

function ridgeFn(seed, amps) {
  const rnd = mulberry32(seedOf(seed));
  const waves = amps.map((amp, i) => ({ f: i + 1, amp, phase: rnd() * Math.PI * 2 }));
  return (x) => {
    let h = 0;
    for (const wv of waves) h += Math.sin((x / HILLS.w) * Math.PI * 2 * wv.f + wv.phase) * wv.amp;
    return h;
  };
}

function renderHills(which) {
  const { L, c } = newCell(HILLS);
  const near = which === 'near';
  const ridge = ridgeFn(`hills_${which}`, near ? [26, 13, 7, 3.5] : [15, 8, 4, 2]);
  const base = near ? 4 : -26;   // far hills sit higher up, behind the near ones

  const steps = 256;
  const crest = [];
  for (let i = 0; i <= steps; i++) {
    const x = (HILLS.w * i) / steps;
    crest.push([x, base - ridge(x)]);
  }

  c.poly([...crest, [HILLS.w, HILLS.h], [0, HILLS.h]], near ? PAL.hillNear : PAL.hillFar);

  // Thin warm backlight along the ridge — the sun is setting behind it. Drawn
  // as a filled band rather than a polyline: thickLine round-joins every sample
  // and additive overlap beads them into a dashed stroke.
  const band = near ? 2.2 : 1.6;
  c.poly(
    [...crest, ...crest.map(([x, y]) => [x, y + band]).reverse()],
    WARM, near ? 0.3 : 0.2, 'add'
  );

  return L;
}

function renderSkyline() {
  const { L, c } = newCell(SKYLINE);
  const rnd = mulberry32(seedOf('skyline'));

  let x = 6;
  while (x < SKYLINE.w - 60) {
    const w = 20 + rnd() * 46;
    const h = 28 + rnd() * 118;
    c.rect(x, -h, w, h + 22, PAL.city);
    c.rect(x, -h, w, 2, WARM, 0.18);                 // backlit top edge

    // sparse lit windows
    const cols = Math.max(1, Math.floor(w / 9));
    const rows = Math.max(1, Math.floor(h / 12));
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        if (rnd() > 0.18) continue;
        c.rect(x + 3 + cx * 9, -h + 6 + cy * 12, 3.2, 4.2, PAL.window, 0.5 + rnd() * 0.4);
      }
    }

    // the odd antenna
    if (rnd() < 0.3) {
      const ax = x + w / 2;
      c.rect(ax - 0.9, -h - 20 - rnd() * 16, 1.8, 22, PAL.city);
      c.softDisc(ax, -h - 22, 4, PAL.hazard, 0.5, 2, 'add');
    }

    x += w + 4 + rnd() * 16;
  }

  return L;
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

console.log('drawing environment…');

const clouds = [];
const rims = [];
for (let i = 0; i < 4; i++) {
  const { cloud, rim } = buildCloud(i);
  clouds.push({ name: `cloud_${i}`, layer: cloud });
  rims.push({ name: `cloud_${i}_rim`, layer: rim });
}
clouds.push(...rims);

const pad = [{ name: 'pad', layer: renderPad() }];
const hills = [
  { name: 'hills_far', layer: renderHills('far') },
  { name: 'hills_near', layer: renderHills('near') },
];
const skyline = [{ name: 'skyline', layer: renderSkyline() }];

const { sheet, frames, size } = packSections([
  { cols: 3, spec: CLOUD, cells: clouds },
  { cols: 2, spec: PAD, cells: pad },
  { cols: 1, spec: HILLS, cells: hills },
  { cols: 1, spec: SKYLINE, cells: skyline },
]);

const atlas = {
  id: 'environment',
  image: 'environment.png',
  note: 'Draw at (x - ax, y - ay). Clouds anchor at their centre; pad anchors at the deck surface; hills and skyline anchor at their left edge on the horizon line, and tile horizontally.',
  size,
  tintable: ['cloud_0', 'cloud_1', 'cloud_2', 'cloud_3'],
  tileableX: ['hills_near', 'hills_far', 'skyline'],
  frames,
  animations: {},
};

const bytes = writeSheet(OUT_DIR, 'environment', sheet, atlas);
writeAtlasGlobal(OUT_DIR, 'atlas.js', { ENV_ATLAS: atlas }, 'gen-environment.mjs');

console.log(
  `  environment.png  ${size.w}×${size.h}  ` +
  `${Object.keys(frames).length} frames  ${(bytes / 1024).toFixed(0)} KB`
);
