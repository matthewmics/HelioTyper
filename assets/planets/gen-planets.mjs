/**
 * HelioTyper planets generator: the bodies the rocket passes on the way out.
 *
 * Run with:  node assets/planets/gen-planets.mjs
 *
 * Outbound order: moon → mars → jupiter → saturn → uranus → neptune → pluto.
 * (Mercury and Venus are sunward, so they never appear on this trip.)
 *
 * SIZES ARE NOT TO SCALE, deliberately. Real radii span Pluto 1,188km to
 * Jupiter 69,911km — a 59× range that would make Pluto a dot next to a body
 * that cannot fit on screen. These are tuned so each planet is readable at a
 * glance and the size *ordering* still reads correctly. Apparent size in game
 * comes from the draw scale anyway, since each body is passed at a different
 * distance.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SS, mulberry32, seedOf, Layer, blur, hex, Ctx, newCell, profilePoly,
  packSections, writeSheet, writeAtlasGlobal,
} from '../lib/raster.mjs';

const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WHITE = [1, 1, 1];

// cell specs — bodies with rings need room the disc alone would not
const STD = { w: 320, h: 320, ax: 160, ay: 160 };
const URA = { w: 400, h: 400, ax: 200, ay: 200 };
const JUP = { w: 448, h: 448, ax: 224, ay: 224 };
const SAT = { w: 720, h: 400, ax: 360, ay: 200 };

/* ------------------------------------------------------------------ *
 * Sphere helpers
 * ------------------------------------------------------------------ */

/** Half-width profile of a circle — lets profilePoly cut bands to the disc. */
const discHw = (r) => (y) => Math.sqrt(Math.max(0, r * r - y * y));

/** Multiply one layer's coverage by another's alpha (premultiplied-safe). */
function maskBy(L, mask) {
  for (let i = 0; i < L.d.length; i += 4) {
    const m = mask.d[i + 3];
    L.d[i] *= m; L.d[i + 1] *= m; L.d[i + 2] *= m; L.d[i + 3] *= m;
  }
}

/**
 * Limb darkening plus a light direction from the upper left. This is the single
 * thing that turns a flat coloured circle into a sphere, so every body gets it
 * *after* its surface detail is painted on.
 */
function shadeSphere(L, spec, r, { ambient = 0.42, falloff = 3.2, rim = 0.14 } = {}) {
  L.shade((px, py) => {
    const x = px / SS - spec.ax, y = py / SS - spec.ay;
    const d = Math.hypot(x, y) / r;
    if (d > 1) return 1;                       // leave the atmosphere halo alone
    const lit = (-x - y) / (r * 1.6);
    return Math.max(ambient, 1 - Math.pow(d, falloff) * 0.75 + lit * rim);
  });
}

/**
 * Standard body build: atmosphere halo behind, base disc, surface detail
 * clipped to the disc, then spherical shading over the lot.
 */
function buildBody(spec, r, base, drawDetail, { atmo = null, atmoA = 0.4, shade = {} } = {}) {
  const { L, c } = newCell(spec);
  if (atmo) c.softDisc(0, 0, r * 1.3, atmo, atmoA, 2.6, 'add');
  c.disc(0, 0, r, base);

  const mask = new Layer(L.w, L.h);
  new Ctx(mask, spec.ax, spec.ay).disc(0, 0, r, WHITE, 1);

  const det = new Layer(L.w, L.h);
  drawDetail(new Ctx(det, spec.ax, spec.ay));
  maskBy(det, mask);                            // keeps blotches off the limb
  L.drawLayer(det);

  shadeSphere(L, spec, r, shade);
  return L;
}

/** Horizontal band clipped to the disc. `y0`/`y1` are fractions of r. */
function band(c, r, y0, y1, col, alpha = 1) {
  c.poly(profilePoly(discHw(r), y0 * r, y1 * r, -1, 1, 64), col, alpha);
}

/** Smeared cloud cells along a band, which is what stops bands reading as tape. */
function turbulence(c, r, yFrac, col, rnd, count, sizeK, alpha = 0.35) {
  for (let i = 0; i < count; i++) {
    const y = yFrac * r + (rnd() - 0.5) * r * 0.07;
    const span = Math.sqrt(Math.max(0, r * r - y * y));
    const x = (rnd() * 2 - 1) * span * 0.95;
    c.ellipse(x, y, r * sizeK * (0.5 + rnd()), r * sizeK * 0.3 * (0.5 + rnd()), col, alpha);
  }
}

/**
 * Elliptical ring band, as one even-odd annulus polygon.
 *
 * Both loops run 0..steps INCLUSIVE so each closes on itself. Stopping at
 * steps-1 leaves the outer loop open and the jump to the inner ring cuts a thin
 * unfilled slit along the +x axis — visible as a hairline through the rings.
 * The two connecting edges are then exactly horizontal, so they contribute no
 * scanline crossings and the even-odd fill stays correct.
 */
function annulus(rxOut, ryOut, rxIn, ryIn, steps = 200) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    pts.push([Math.cos(t) * rxOut, Math.sin(t) * ryOut]);
  }
  for (let i = steps; i >= 0; i--) {
    const t = (i / steps) * Math.PI * 2;
    pts.push([Math.cos(t) * rxIn, Math.sin(t) * ryIn]);
  }
  return pts;
}

/** Zero out one half of a layer, so rings can be split around the planet. */
function keepHalf(L, spec, top) {
  const cy = spec.ay * SS;
  for (let y = 0; y < L.h; y++) {
    const drop = top ? y >= cy : y < cy;
    if (!drop) continue;
    for (let x = 0; x < L.w; x++) {
      const i = (y * L.w + x) * 4;
      L.d[i] = L.d[i + 1] = L.d[i + 2] = L.d[i + 3] = 0;
    }
  }
}

/* ------------------------------------------------------------------ *
 * The bodies
 * ------------------------------------------------------------------ */

const MOON_R = 130;

function renderMoon() {
  const rnd = mulberry32(seedOf('moon'));
  return buildBody(STD, MOON_R, hex('#e8ecff'), (c) => {
    const mid = hex('#c2c8e4'), dark = hex('#9aa1c4');

    for (let i = 0; i < 5; i++) {                    // maria
      const a = rnd() * Math.PI * 2, d = rnd() * MOON_R * 0.6;
      c.softDisc(Math.cos(a) * d, Math.sin(a) * d, 28 + rnd() * 40, dark, 0.22, 1.1, 'over');
    }
    // Craters: shadow on the NEAR wall, light on the FAR wall. The other way
    // round and they read as bumps rather than holes.
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * MOON_R * 0.86;
      const x = Math.cos(a) * d, y = Math.sin(a) * d, r = 4 + rnd() * 16;
      c.disc(x - r * 0.13, y - r * 0.13, r * 1.09, WHITE, 0.38);
      c.disc(x, y, r, mid, 0.8);
      c.disc(x - r * 0.18, y - r * 0.18, r * 0.8, dark, 0.42);
      c.disc(x + r * 0.26, y + r * 0.26, r * 0.5, WHITE, 0.24);
    }
  });
}

const MARS_R = 90;

function renderMars() {
  const rnd = mulberry32(seedOf('mars'));
  return buildBody(STD, MARS_R, hex('#c1502e'), (c) => {
    const dark = hex('#7e3620'), light = hex('#e0794a'), ice = hex('#eef3ff');

    for (let i = 0; i < 7; i++) {                    // dark albedo features
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * MARS_R * 0.8;
      c.softDisc(Math.cos(a) * d, Math.sin(a) * d,
        16 + rnd() * 30, dark, 0.3, 1.2, 'over');
    }
    for (let i = 0; i < 5; i++) {                    // dust-bright highlands
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * MARS_R * 0.75;
      c.softDisc(Math.cos(a) * d, Math.sin(a) * d,
        14 + rnd() * 22, light, 0.22, 1.3, 'over');
    }
    for (let i = 0; i < 9; i++) {                    // craters
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * MARS_R * 0.85;
      const x = Math.cos(a) * d, y = Math.sin(a) * d, r = 3 + rnd() * 7;
      c.disc(x - r * 0.15, y - r * 0.15, r * 1.1, light, 0.3);
      c.disc(x, y, r, dark, 0.35);
    }
    // polar caps — the north one is the giveaway that this is Mars
    c.ellipse(0, -MARS_R * 0.88, MARS_R * 0.42, MARS_R * 0.2, ice, 0.92);
    c.ellipse(0, MARS_R * 0.93, MARS_R * 0.3, MARS_R * 0.13, ice, 0.75);
  }, { atmo: hex('#ff8f5a'), atmoA: 0.28 });
}

const JUP_R = 200;

function renderJupiter() {
  const rnd = mulberry32(seedOf('jupiter'));
  const cream = hex('#e6d2ae'), tan = hex('#c99a68'), rust = hex('#a9673f');
  const pale = hex('#f2e6cd'), polar = hex('#9c8f92');

  return buildBody(JUP, JUP_R, hex('#d9b48c'), (c) => {
    const zones = [
      [-1.00, -0.78, polar, 0.55], [-0.78, -0.62, tan, 0.9], [-0.62, -0.5, pale, 0.9],
      [-0.5, -0.34, rust, 0.85], [-0.34, -0.18, cream, 0.95], [-0.18, -0.05, tan, 0.85],
      [-0.05, 0.1, pale, 0.95], [0.1, 0.24, rust, 0.8], [0.24, 0.4, cream, 0.9],
      [0.4, 0.56, tan, 0.85], [0.56, 0.74, pale, 0.8], [0.74, 1.0, polar, 0.5],
    ];
    for (const [y0, y1, col, a] of zones) band(c, JUP_R, y0, y1, col, a);
    for (const [y0, y1, col] of zones) {
      turbulence(c, JUP_R, (y0 + y1) / 2, col, rnd, 7, 0.1, 0.3);
    }

    // Great Red Spot
    const sx = JUP_R * 0.3, sy = JUP_R * 0.3;
    c.ellipse(sx, sy, JUP_R * 0.25, JUP_R * 0.13, hex('#8f4630'), 0.8);
    c.ellipse(sx, sy, JUP_R * 0.21, JUP_R * 0.105, hex('#c4553c'), 0.95);
    c.ellipse(sx - JUP_R * 0.03, sy - JUP_R * 0.015, JUP_R * 0.12, JUP_R * 0.055,
      hex('#e08a63'), 0.6);
  }, { atmo: hex('#ffca8a'), atmoA: 0.3 });
}

const SAT_R = 170;

/**
 * Saturn is the one body that cannot be a single disc: the rings pass BEHIND
 * the planet at the top and IN FRONT at the bottom. Built as three stacked
 * layers — far rings, planet, near rings — composited into one frame.
 */
function renderSaturn() {
  const rnd = mulberry32(seedOf('saturn'));
  const { L } = newCell(SAT);

  const rings = new Layer(L.w, L.h);
  const rc = new Ctx(rings, SAT.ax, SAT.ay);
  const TILT = 0.3;
  const bandsOf = [
    [1.62, 1.95, hex('#c9b291'), 0.85],   // A ring
    // 1.55–1.62 left empty: the Cassini division
    [1.28, 1.55, hex('#e3cfad'), 0.95],   // B ring, the bright one
    [1.13, 1.28, hex('#a2937c'), 0.5],  // C ring, sheer
  ];
  for (const [i0, i1, col, a] of bandsOf) {
    rc.poly(annulus(SAT_R * i1, SAT_R * i1 * TILT, SAT_R * i0, SAT_R * i0 * TILT), col, a);
  }
  // fine ringlets
  for (let i = 0; i < 16; i++) {
    const t = 1.14 + rnd() * 0.8;
    if (t > 1.55 && t < 1.62) continue;
    const w = 0.006 + rnd() * 0.014;
    rc.poly(
      annulus(SAT_R * (t + w), SAT_R * (t + w) * TILT, SAT_R * t, SAT_R * t * TILT),
      rnd() > 0.5 ? WHITE : hex('#8d7f6a'), 0.16
    );
  }

  const far = rings.clone(); keepHalf(far, SAT, true);
  const near = rings.clone(); keepHalf(near, SAT, false);

  const planet = buildBody(SAT, SAT_R, hex('#e3c99a'), (c) => {
    const pale = hex('#f2e2be'), tan = hex('#d3b184'), dark = hex('#b8955f');
    const zones = [
      [-1.0, -0.72, hex('#b3a58f'), 0.5], [-0.72, -0.5, tan, 0.75],
      [-0.5, -0.28, pale, 0.8], [-0.28, -0.06, tan, 0.6],
      [-0.06, 0.16, pale, 0.75], [0.16, 0.4, dark, 0.6],
      [0.4, 0.66, tan, 0.7], [0.66, 1.0, hex('#b3a58f'), 0.45],
    ];
    for (const [y0, y1, col, a] of zones) band(c, SAT_R, y0, y1, col, a);
    for (const [y0, y1, col] of zones) turbulence(c, SAT_R, (y0 + y1) / 2, col, rnd, 4, 0.09, 0.22);
  }, { atmo: hex('#ffe0a8'), atmoA: 0.26 });

  L.drawLayer(far);
  L.drawLayer(planet);
  L.drawLayer(near);
  return L;
}

const URA_R = 110;

/**
 * Uranus is tipped ~98°, so its rings appear almost VERTICAL. That is the
 * detail that makes it instantly readable as Uranus rather than "small blue
 * planet #1", so it is worth the bigger cell.
 */
function renderUranus() {
  const rnd = mulberry32(seedOf('uranus'));
  const { L } = newCell(URA);

  const rings = new Layer(L.w, L.h);
  const rc = new Ctx(rings, URA.ax, URA.ay);
  const SQUASH = 0.26;
  for (const [i0, i1, a] of [[1.58, 1.66, 0.5], [1.72, 1.76, 0.3], [1.42, 1.46, 0.22]]) {
    rc.poly(annulus(URA_R * i1 * SQUASH, URA_R * i1, URA_R * i0 * SQUASH, URA_R * i0),
      hex('#9fd9e6'), a);
  }

  const left = rings.clone();   // rings are vertical, so split left/right
  const right = rings.clone();
  for (let y = 0; y < L.h; y++) {
    for (let x = 0; x < L.w; x++) {
      const i = (y * L.w + x) * 4;
      const target = x < URA.ax * SS ? right : left;
      target.d[i] = target.d[i + 1] = target.d[i + 2] = target.d[i + 3] = 0;
    }
  }

  const planet = buildBody(URA, URA_R, hex('#93d7e2'), (c) => {
    for (const [y0, y1, a] of [[-0.7, -0.4, 0.16], [-0.15, 0.15, 0.2], [0.45, 0.75, 0.14]]) {
      band(c, URA_R, y0, y1, hex('#b6e6ee'), a);
    }
    for (let i = 0; i < 4; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * URA_R * 0.6;
      c.softDisc(Math.cos(a) * d, Math.sin(a) * d, 22 + rnd() * 26, hex('#7cc4d4'), 0.14, 1.4, 'over');
    }
  }, { atmo: hex('#a7e6f2'), atmoA: 0.32, shade: { ambient: 0.5, falloff: 2.6 } });

  L.drawLayer(left);
  L.drawLayer(planet);
  L.drawLayer(right);
  return L;
}

const NEP_R = 125;

function renderNeptune() {
  const rnd = mulberry32(seedOf('neptune'));
  return buildBody(STD, NEP_R, hex('#3a5bd9'), (c) => {
    const deep = hex('#2743ad'), pale = hex('#6f8ef0');
    for (const [y0, y1, col, a] of [
      [-1.0, -0.66, deep, 0.4], [-0.5, -0.24, pale, 0.28],
      [-0.05, 0.18, pale, 0.22], [0.36, 0.62, deep, 0.35], [0.72, 1.0, deep, 0.45],
    ]) band(c, NEP_R, y0, y1, col, a);

    for (let i = 0; i < 6; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * NEP_R * 0.7;
      c.softDisc(Math.cos(a) * d, Math.sin(a) * d, 18 + rnd() * 26, deep, 0.2, 1.3, 'over');
    }

    // Great Dark Spot, with the bright methane cirrus that trails it
    c.ellipse(-NEP_R * 0.26, -NEP_R * 0.16, NEP_R * 0.26, NEP_R * 0.14, hex('#1b2f80'), 0.75);
    c.ellipse(-NEP_R * 0.26, -NEP_R * 0.2, NEP_R * 0.19, NEP_R * 0.07, hex('#16256a'), 0.5);
    for (let i = 0; i < 5; i++) {
      c.ellipse(NEP_R * (0.05 + rnd() * 0.45), NEP_R * (0.2 + rnd() * 0.4),
        NEP_R * (0.06 + rnd() * 0.12), NEP_R * 0.028, WHITE, 0.3);
    }
  }, { atmo: hex('#5c86ff'), atmoA: 0.32 });
}

const PLU_R = 70;

/** Heart curve — Tombaugh Regio is what makes Pluto instantly recognisable. */
function heartPoly(cx, cy, s, steps = 72) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push([cx + (x * s) / 16, cy + (y * s) / 16]);
  }
  return pts;
}

function renderPluto() {
  const rnd = mulberry32(seedOf('pluto'));
  return buildBody(STD, PLU_R, hex('#b6a48c'), (c) => {
    const dark = hex('#6d5847'), rust = hex('#8d6b4f'), cream = hex('#f0e4cf');

    for (let i = 0; i < 8; i++) {                     // mottled crust
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * PLU_R * 0.85;
      c.softDisc(Math.cos(a) * d, Math.sin(a) * d,
        10 + rnd() * 22, rnd() > 0.5 ? dark : rust, 0.3, 1.2, 'over');
    }
    // The heart, softened over a few passes so it reads as terrain not a decal.
    // Sized to sit inside the disc — any bigger and the mask clips the lobes,
    // which is exactly the shape that makes it recognisable.
    for (const [k, a] of [[1.1, 0.22], [1.0, 0.5], [0.84, 0.4]]) {
      c.poly(heartPoly(PLU_R * 0.04, PLU_R * 0.04, PLU_R * 0.72 * k), cream, a);
    }
    for (let i = 0; i < 5; i++) {                     // craters over the top
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * PLU_R * 0.8;
      const x = Math.cos(a) * d, y = Math.sin(a) * d, r = 2.5 + rnd() * 5;
      c.disc(x, y, r, dark, 0.3);
    }
  }, { shade: { ambient: 0.38 } });
}

/**
 * Landing beacon for the moon — a separate overlay on the moon's cell.
 * Now that the race runs to the edge of the solar system this is flavour
 * ("humanity got this far") rather than a finish line, so it stays optional.
 */
function renderBeacon(frame) {
  const { L } = newCell(STD);
  const fx = new Layer(L.w, L.h);
  const c = new Ctx(fx, STD.ax, STD.ay);

  const a = Math.PI * 1.30;
  const bx = Math.cos(a) * (MOON_R - 4), by = Math.sin(a) * (MOON_R - 4);
  const ux = Math.cos(a), uy = Math.sin(a);
  const tx = bx + ux * 34, ty = by + uy * 34;

  c.thickLine([[bx, by], [tx, ty]], 3, hex('#1a1f31'));
  c.thickLine([[bx, by], [tx, ty]], 1.2, hex('#c2c8e4'), 0.8);
  c.poly([
    [tx, ty], [tx - uy * 22 - ux * 4, ty + ux * 22 - uy * 4], [tx - ux * 13, ty - uy * 13],
  ], hex('#ff8a3c'));

  const pulse = [1, 0.55, 0.25, 0.62][frame];
  c.softDisc(tx, ty, 10 + pulse * 16, hex('#ffb02e'), 0.3 * pulse + 0.1, 2, 'add');
  c.softDisc(tx, ty, 4 + pulse * 4, WHITE, 0.5 * pulse + 0.2, 2, 'add');
  c.disc(tx, ty, 2.6, WHITE, 0.85);

  L.addLayer(blur(fx, Math.round(2 * SS)), 0.55);
  L.addLayer(fx, 1);
  return L;
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

console.log('drawing planets…');

// outbound order, which is also the order the game should reveal them
const ORDER = ['moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

const std = [
  { name: 'moon', layer: renderMoon() },
  { name: 'mars', layer: renderMars() },
  { name: 'neptune', layer: renderNeptune() },
  { name: 'pluto', layer: renderPluto() },
];
for (let f = 0; f < 4; f++) std.push({ name: `beacon_${f}`, layer: renderBeacon(f) });

const { sheet, frames, size } = packSections([
  { cols: 3, spec: STD, cells: std },
  { cols: 2, spec: URA, cells: [{ name: 'uranus', layer: renderUranus() }] },
  { cols: 2, spec: JUP, cells: [{ name: 'jupiter', layer: renderJupiter() }] },
  { cols: 1, spec: SAT, cells: [{ name: 'saturn', layer: renderSaturn() }] },
]);

const atlas = {
  id: 'planets',
  image: 'planets.png',
  note: 'Draw at (x - ax, y - ay); every body is anchored at its centre, including Saturn and Uranus whose rings extend past the disc. Sizes are readable-not-physical.',
  size,
  order: ORDER,
  radii: {
    moon: MOON_R, mars: MARS_R, jupiter: JUP_R, saturn: SAT_R,
    uranus: URA_R, neptune: NEP_R, pluto: PLU_R,
  },
  frames,
  animations: {
    beacon: { frames: ['beacon_0', 'beacon_1', 'beacon_2', 'beacon_3'], fps: 6, loop: true },
  },
};

const bytes = writeSheet(OUT_DIR, 'planets', sheet, atlas);
writeAtlasGlobal(OUT_DIR, 'atlas.js', { PLANET_ATLAS: atlas }, 'gen-planets.mjs');

console.log(
  `  planets.png  ${size.w}×${size.h}  ` +
  `${Object.keys(frames).length} frames  ${(bytes / 1024).toFixed(0)} KB`
);
