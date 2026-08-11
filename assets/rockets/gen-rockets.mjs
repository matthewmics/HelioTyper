/**
 * Typosphere sprite generator.
 *
 * Draws the rockets procedurally and writes one self-contained sheet per
 * rocket (<id>.png + <id>.json), plus index.json and atlas.js, alongside this
 * file in assets/rockets/.
 * Zero dependencies — software rasteriser, PNG encoded by hand over node:zlib.
 * Run with:  node assets/rockets/gen-rockets.mjs
 *
 * Output is deterministic: rerunning produces byte-identical files, and adding
 * a rocket to ROSTER does not disturb any existing sheet.
 *
 * Everything is authored in *game units*, the same scale drawRocket() already
 * uses in prototype.html (nose at y=-46, hull base at y=30, fin tips at x=±34),
 * so a sprite drawn at its anchor lands exactly where the vector ship was.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SS, mulberry32, seedOf, makeNoise, Layer, blur, dilateAlpha, hex, Ctx,
  profilePoly, lerpProfile, newCell, packSections, writeSheet, writeAtlasGlobal,
} from '../lib/raster.mjs';

const OUT_DIR = path.dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ *
 * Palettes
 * ------------------------------------------------------------------ */

const OUTLINE = hex('#12142a');

const SHIPS = {
  A: {
    name: 'vanguard',
    hullLight: hex('#f4f6ff'), hullMid: hex('#d3d8ee'), hullDark: hex('#9099bd'),
    accent: hex('#ff5d6c'), accentDark: hex('#c2374a'),
    metal: hex('#3a4160'), metalDark: hex('#232841'),
    glass: hex('#63d2ff'), glassDark: hex('#1d5b91'),
  },
  B: {
    name: 'kestrel',
    hullLight: hex('#eef2f8'), hullMid: hex('#c3ccdd'), hullDark: hex('#7d88a4'),
    accent: hex('#2fe3c8'), accentDark: hex('#0f9b88'),
    metal: hex('#39415e'), metalDark: hex('#212639'),
    glass: hex('#ffcf66'), glassDark: hex('#9a5f16'),
  },
  // Gunmetal rather than true black: the sky goes to near-black at the top of
  // the climb, and a genuinely dark hull would lose its silhouette up there.
  C: {
    name: 'marauder',
    hullLight: hex('#7c87ae'), hullMid: hex('#59617f'), hullDark: hex('#363c53'),
    accent: hex('#ff2d4b'), accentDark: hex('#a2122e'),
    metal: hex('#232838'), metalDark: hex('#141723'),
    glass: hex('#ff7a4a'), glassDark: hex('#7d2312'),
  },
};

const FLAME = {
  A: {
    outer: hex('#ff4d18'), mid: hex('#ff8c2b'),
    inner: hex('#ffc94d'), core: hex('#fff2cf'), hot: hex('#ffffff'),
  },
  B: {
    outer: hex('#2a6cff'), mid: hex('#38a6ff'),
    inner: hex('#7cefff'), core: hex('#dcffff'), hot: hex('#ffffff'),
  },
  // Third distinct exhaust colour — orange / blue / violet stay separable at a
  // glance, which is what identifies players in a crowded race.
  C: {
    outer: hex('#8c14ff'), mid: hex('#e03cff'),
    inner: hex('#ff9cf5'), core: hex('#ffd9fb'), hot: hex('#ffffff'),
  },
};

const ARC = { core: hex('#ffffff'), mid: hex('#a6f2ff'), outer: hex('#38a8ff') };

/* ------------------------------------------------------------------ *
 * Ship geometry
 * ------------------------------------------------------------------ */

const shipA = {
  hw(y) {
    if (y < -18) { const t = (y + 18) / -28; return 17 * Math.sqrt(Math.max(0, 1 - t * t)); }
    if (y < 20) return 17;
    return 17 + 5 * Math.pow((y - 20) / 10, 1.4);
  },
  top: -46, bottom: 30,
  // `main` nozzles get the mach diamonds and the white-hot core; `exhaust` is
  // the single point the blastoff cloud, flash and sparks radiate from.
  nozzles: [{ x: 0, y: 38, lenK: 1, widK: 1, alpha: 1, main: true }],
  exhaust: { x: 0, y: 38 },
  // Points lightning is allowed to attach to.
  arcPoints: [
    [0, -44], [-8, -30], [8, -30], [-17, -12], [17, -12], [-17, 6], [17, 6],
    [-19, 22], [19, 22], [-33, 31], [33, 31], [-13, 37], [13, 37], [0, -20],
  ],
};

const shipB = {
  hw(y) {
    if (y < -16) { const t = (y + 16) / -34; return 12 * Math.sqrt(Math.max(0, 1 - t * t)); }
    if (y < 24) return 12;
    return 12 + 2 * ((y - 24) / 6);
  },
  top: -50, bottom: 30,
  nozzles: [
    { x: 0, y: 40, lenK: 1, widK: 1, alpha: 1, main: true },
    { x: -19, y: 37, lenK: 0.52, widK: 0.5, alpha: 0.95, main: false },
    { x: 19, y: 37, lenK: 0.52, widK: 0.5, alpha: 0.95, main: false },
  ],
  exhaust: { x: 0, y: 40 },
  arcPoints: [
    [0, -48], [-6, -32], [6, -32], [-12, -12], [12, -12], [-12, 10], [12, 10],
    [-19, -12], [19, -12], [-26, 4], [26, 4], [-26, 26], [26, 26],
    [-34, 33], [34, 33], [-19, 36], [19, 36], [0, 39],
  ],
};

/**
 * Ships are drawn as a back-to-front stack of `part(fn)` calls. Each part is
 * rasterised into its own layer and gets its own dark keyline before being
 * composited, so overlapping pieces (fins behind hull, boosters beside
 * fuselage) stay separated instead of fusing into one pale mass.
 */
function drawShipA(part) {
  const p = SHIPS.A, hw = shipA.hw;

  part((c) => { // engine bell
    c.poly([[-12, 24], [12, 24], [16, 40], [-16, 40]], p.metal);
    c.poly([[-16, 40], [16, 40], [14, 43], [-14, 43]], p.metalDark);
    c.ellipse(0, 39, 13, 3.2, p.metalDark);
  });

  part((c) => { // fins
    for (const s of [-1, 1]) {
      c.poly([[16 * s, 2], [34 * s, 32], [16 * s, 26]], p.accent);
      c.poly([[24 * s, 18], [34 * s, 32], [20 * s, 25]], p.accentDark, 0.85);
    }
  });

  part((c) => { // hull
    c.poly(profilePoly(hw, shipA.top, 30), p.hullMid);
    c.poly(profilePoly(hw, shipA.top, 30, -1, -0.28), p.hullLight);
    c.poly(profilePoly(hw, shipA.top, 30, 0.42, 1), p.hullDark, 0.55);

    // red nose cap and waist band
    c.poly(profilePoly(hw, shipA.top, -22), p.accent);
    c.poly(profilePoly(hw, shipA.top, -22, -1, -0.28), p.accent, 0.45);
    c.poly(profilePoly(hw, shipA.top, -22, 0.42, 1), p.accentDark, 0.5);
    c.poly(profilePoly(hw, 12, 20), p.accent);
    c.poly(profilePoly(hw, 12, 20, 0.42, 1), p.accentDark, 0.5);

    // panel lines
    c.poly(profilePoly(hw, -1.2, 0.4), p.hullDark, 0.35);
    c.poly(profilePoly(hw, 23.5, 25), p.hullDark, 0.3);

    // window
    c.disc(0, -8, 10, p.metal);
    c.disc(0, -8, 8.2, p.glassDark);
    c.disc(0.8, -6.8, 7.2, p.glass);
    c.disc(-2.2, -10.5, 3, [1, 1, 1], 0.8);
    c.disc(2.6, -4.4, 1.6, [1, 1, 1], 0.35);

    for (const s of [-1, 1]) c.disc(11 * s, 27, 1.4, p.hullDark, 0.6);
  });
}

/**
 * Kestrel — a strapped-booster interceptor. Deliberately a different
 * silhouette from the Vanguard rather than a recolour: narrow fuselage,
 * two full-length side boosters, winglets outboard of them.
 */
function drawShipB(part) {
  const p = SHIPS.B, hw = shipB.hw;
  const bhw = (y) => (y < -2 ? 7 * Math.sqrt(Math.max(0, 1 - Math.pow((y + 2) / 14, 2))) : 7);

  part((c) => { // winglets, outboard of the boosters
    for (const s of [-1, 1]) {
      c.poly([[22 * s, 8], [38 * s, 36], [22 * s, 30]], p.accent);
      c.poly([[31 * s, 24], [38 * s, 36], [26 * s, 31]], p.accentDark, 0.9);
    }
  });

  part((c) => { // main engine bell, behind the fuselage
    c.poly([[-9, 28], [9, 28], [13, 40], [-13, 40]], p.metal);
    c.poly([[-13, 40], [13, 40], [11, 43], [-11, 43]], p.metalDark);
    c.ellipse(0, 39.5, 10.5, 2.6, p.metalDark);
  });

  for (const s of [-1, 1]) {
    part((c) => { // strapped booster
      const bx = 19 * s;
      const shift = (pts) => pts.map(([x, y]) => [x + bx, y]);
      c.poly([[bx - 5.5, 28], [bx + 5.5, 28], [bx + 7.5, 38], [bx - 7.5, 38]], p.metal);
      c.ellipse(bx, 37.5, 7, 2, p.metalDark);
      c.poly(shift(profilePoly(bhw, -16, 30)), p.hullMid);
      c.poly(shift(profilePoly(bhw, -16, 30, -1, -0.2)), p.hullLight, 0.95);
      c.poly(shift(profilePoly(bhw, -16, 30, 0.35, 1)), p.hullDark, 0.6);
      c.poly(shift(profilePoly(bhw, -16, -6)), p.accent);       // teal nose cone
      c.poly(shift(profilePoly(bhw, -16, -6, 0.35, 1)), p.accentDark, 0.5);
      c.poly(shift(profilePoly(bhw, 18, 22)), p.metal, 0.55);   // band
    });
  }

  part((c) => { // fuselage
    c.poly(profilePoly(hw, shipB.top, 32), p.hullMid);
    c.poly(profilePoly(hw, shipB.top, 32, -1, -0.25), p.hullLight);
    c.poly(profilePoly(hw, shipB.top, 32, 0.4, 1), p.hullDark, 0.55);

    // graphite nose, teal waist band
    c.poly(profilePoly(hw, shipB.top, -22), p.metal);
    c.poly(profilePoly(hw, shipB.top, -22, -1, -0.25), p.metal, 0.4);
    c.poly(profilePoly(hw, 8, 15), p.accent);
    c.poly(profilePoly(hw, 8, 15, 0.4, 1), p.accentDark, 0.5);
    c.poly(profilePoly(hw, 26.5, 28), p.hullDark, 0.35);

    // hex canopy — amber glass, to read apart from the Vanguard's blue
    const hexAt = (r, cx, cy) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
      return pts;
    };
    c.poly(hexAt(9.5, 0, -8), p.metal);
    c.poly(hexAt(7.8, 0, -8), p.glassDark);
    c.poly(hexAt(6.8, 0.5, -9), p.glass);
    c.poly(hexAt(2.8, -2.2, -11), [1, 1, 1], 0.75);
  });
}

/**
 * Marauder — the aggressive one. Everything about it is a deliberate inversion
 * of the other two: faceted straight-line hull instead of curved profiles, dark
 * gunmetal instead of pale cream, a visor slit instead of a round porthole,
 * forward barbs, huge raked scythe wings, and twin engines instead of one.
 */
const shipC = {
  hw: lerpProfile([[-50, 0], [-38, 4.5], [-30, 6.5], [-10, 8], [10, 10], [24, 14.5], [32, 14.5]]),
  top: -50, bottom: 32,
  // Two full-strength engines, but at reduced alpha: the plumes overlap and
  // additive blending would otherwise sum the centre to flat white, throwing
  // away the violet that identifies this ship.
  nozzles: [
    { x: -8, y: 41, lenK: 0.86, widK: 0.78, alpha: 0.78, main: true },
    { x: 8, y: 41, lenK: 0.86, widK: 0.78, alpha: 0.78, main: true },
  ],
  exhaust: { x: 0, y: 41 },
  arcPoints: [
    [0, -48], [-5, -34], [5, -34], [-8, -12], [8, -12], [-10, 8], [10, 8],
    [-14, 26], [14, 26], [-17, -21], [17, -21],
    [-40, 28], [40, 28], [-32, 36], [32, 36], [-24, 20], [24, 20],
    [-8, 40], [8, 40],
  ],
};

function drawShipC(part) {
  const p = SHIPS.C, hw = shipC.hw;

  // raked scythe wings — the widest, meanest part of the silhouette
  for (const s of [-1, 1]) {
    part((c) => {
      c.poly([[9 * s, -6], [40 * s, 28], [32 * s, 36], [11 * s, 24]], p.hullMid);
      c.poly([[40 * s, 28], [32 * s, 36], [21 * s, 27]], p.hullDark, 0.85);
      // crimson leading edge — kept a thin accent so the gunmetal armour reads
      // as the dominant colour, not a second red ship
      c.poly([[9 * s, -6], [40 * s, 28], [38.2 * s, 29.6], [7.2 * s, -4.4]], p.accent);
      c.poly([[28 * s, 17], [40 * s, 28], [38.2 * s, 29.6], [26.5 * s, 18.6]], p.accentDark, 0.6);
    });
  }

  // forward barbs
  for (const s of [-1, 1]) {
    part((c) => {
      c.poly([[5 * s, -31], [18 * s, -21], [6 * s, -16]], p.accent);
      c.poly([[18 * s, -21], [6 * s, -16], [9 * s, -19]], p.accentDark, 0.7);
    });
  }

  // twin engine block
  part((c) => {
    c.poly([[-16, 21], [16, 21], [15, 28], [-15, 28]], p.metalDark);
    for (const s of [-1, 1]) {
      c.poly([[2 * s, 26], [15 * s, 26], [14 * s, 42], [3 * s, 42]], p.metal);
      c.ellipse(8.5 * s, 41.5, 5.5, 1.9, p.metalDark);
    }
  });

  // faceted hull
  part((c) => {
    c.poly(profilePoly(hw, shipC.top, 32), p.hullMid);
    c.poly(profilePoly(hw, shipC.top, 32, -1, -0.3), p.hullLight);
    c.poly(profilePoly(hw, shipC.top, 32, 0.35, 1), p.hullDark, 0.6);
    c.poly(profilePoly(hw, shipC.top, 32, -0.16, 0.16), p.hullLight, 0.5); // spine ridge

    // dark armoured nose with a crimson spike tip
    c.poly(profilePoly(hw, shipC.top, -28), p.metal);
    c.poly(profilePoly(hw, shipC.top, -28, -1, -0.3), p.metal, 0.45);
    c.poly(profilePoly(hw, shipC.top, -39), p.accent);
    c.poly(profilePoly(hw, shipC.top, -39, 0.35, 1), p.accentDark, 0.55);
    c.poly([[-10, 4], [0, 0], [10, 4], [10, 9], [0, 5], [-10, 9]], p.accent);
    c.poly(profilePoly(hw, 25, 29), p.metalDark, 0.8);

    // hazard slashes low on the hull
    for (const s of [-1, 1]) {
      c.poly([[3 * s, 13], [8 * s, 13], [11 * s, 21], [6 * s, 21]], p.accentDark, 0.75);
    }

    // visor slit — a hostile squint instead of a friendly porthole
    c.poly([[-6.6, -19], [6.6, -19], [5.0, -6.6], [-5.0, -6.6]], p.metal);
    c.poly([[-5.4, -17.6], [5.4, -17.6], [4.0, -8.2], [-4.0, -8.2]], p.glassDark);
    c.poly([[-4.9, -16.9], [4.9, -16.9], [3.7, -9.8], [-3.7, -9.8]], p.glass);
    c.poly([[-4.5, -16.4], [-0.5, -16.4], [-1.5, -10.6], [-3.7, -10.6]], [1, 1, 1], 0.55);
  });
}

const SHIP_DEF = {
  A: { geo: shipA, draw: drawShipA, pal: SHIPS.A },
  B: { geo: shipB, draw: drawShipB, pal: SHIPS.B },
  C: { geo: shipC, draw: drawShipC, pal: SHIPS.C },
};

/* ------------------------------------------------------------------ *
 * Flame
 * ------------------------------------------------------------------ */

// Speed tiers: the plume gets longer, wider and hotter as speed climbs.
const TIERS = [
  { len: 16, wid: 8, diamonds: 0, sparks: 0, whiteCore: false, glow: 0.35 },
  { len: 30, wid: 11, diamonds: 0, sparks: 3, whiteCore: false, glow: 0.5 },
  { len: 46, wid: 14, diamonds: 2, sparks: 6, whiteCore: false, glow: 0.65 },
  { len: 64, wid: 17, diamonds: 3, sparks: 11, whiteCore: true, glow: 0.85 },
  { len: 82, wid: 21, diamonds: 4, sparks: 18, whiteCore: true, glow: 1.0 },
];

/**
 * One plume, drawn into `c`. Layered widest-and-coolest to
 * narrowest-and-hottest, all additive, so overlaps blow out to white.
 */
function drawPlume(c, ox, oy, len, wid, pal, noise, seedPhase, opts = {}) {
  const { diamonds = 0, whiteCore = false, scale = 1, alpha = 1 } = opts;
  const L = len * scale, W = wid * scale;

  // half-width along the plume, s from 0 (nozzle) to 1 (tip)
  const hwAt = (s) => {
    const base = Math.pow(Math.max(0, 1 - Math.pow(s, 1.7)), 0.55);
    const bulge = 1 + 0.22 * Math.sin(Math.min(1, s * 1.6) * Math.PI);
    const flick = 1 + 0.16 * noise(s * 5 + seedPhase) * Math.min(1, s * 3);
    return W * base * bulge * flick;
  };

  const shell = (k, sMax, color, a) => {
    const pts = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const s = (sMax * i) / steps;
      pts.push([ox - hwAt(s) * k, oy + s * L]);
    }
    for (let i = steps; i >= 0; i--) {
      const s = (sMax * i) / steps;
      pts.push([ox + hwAt(s) * k, oy + s * L]);
    }
    c.poly(pts, color, a * alpha, 'add');
  };

  // nozzle glow hides the seam where the sprite meets the engine bell
  c.softDisc(ox, oy + W * 0.15, W * 1.5, pal.inner, 0.45 * alpha, 2, 'add');

  // Additive layers saturate, so the alphas are tuned to land the shells on
  // deep-orange -> orange -> amber -> near-white rather than blowing the whole
  // plume out to a white blob.
  shell(1.55, 1.0, pal.outer, 0.42);
  shell(1.0, 1.0, pal.mid, 0.46);
  shell(0.58, 0.86, pal.inner, 0.40);
  shell(0.28, 0.62, pal.core, 0.38);
  if (whiteCore) shell(0.12, 0.40, pal.hot, 0.5);

  // mach diamonds in the supersonic core
  for (let i = 0; i < diamonds; i++) {
    const s = 0.1 + i * 0.15;
    const r = W * (0.26 - i * 0.04);
    if (r <= 0) continue;
    c.softDisc(ox, oy + s * L, r * 2.2, pal.core, 0.3 * alpha, 2.2, 'add');
    c.poly([
      [ox, oy + s * L - r * 1.5], [ox + r, oy + s * L],
      [ox, oy + s * L + r * 1.5], [ox - r, oy + s * L],
    ], pal.hot, 0.45 * alpha, 'add');
  }
}

function drawSparks(c, ox, oy, len, wid, pal, rnd, count, alpha = 1) {
  for (let i = 0; i < count; i++) {
    const s = 0.25 + rnd() * 0.95;
    const x = ox + (rnd() - 0.5) * wid * (0.8 + s * 1.8);
    const y = oy + s * len;
    const r = 0.7 + rnd() * 1.5;
    const col = rnd() > 0.55 ? pal.hot : pal.inner;
    c.softDisc(x, y, r * 2.2, col, 0.5 * alpha, 2, 'add');
    c.disc(x, y, r, col, 0.9 * alpha, 'add');
  }
}

/* ------------------------------------------------------------------ *
 * Cell rendering
 * ------------------------------------------------------------------ */

const CELL = { w: 96, h: 176, ax: 48, ay: 52 };   // ship / thruster / arc frames
const BIG = { w: 192, h: 224, ax: 96, ay: 52 };   // blastoff frames

/** Render the ship art, each part carrying its own dark keyline. */
function renderShip(which) {
  const { L, spec } = newCell(CELL);
  const art = new Layer(L.w, L.h);
  const r = Math.round(1.5 * SS);

  const part = (fn) => {
    const piece = new Layer(L.w, L.h);
    fn(new Ctx(piece, spec.ax, spec.ay));
    const mask = dilateAlpha(piece, r);
    const outlined = new Layer(L.w, L.h);
    for (let y = 0; y < L.h; y++)
      for (let x = 0; x < L.w; x++) {
        const a = mask[y * L.w + x];
        if (a > 0.02) outlined.over(x, y, OUTLINE, a);
      }
    outlined.drawLayer(piece);
    art.drawLayer(outlined);
  };

  SHIP_DEF[which].draw(part);
  L.drawLayer(art);
  return { full: L, art };
}

function renderThruster(which, tier, frame) {
  const { L, c } = newCell(CELL);
  const geo = SHIP_DEF[which].geo;
  const pal = FLAME[which];
  const t = TIERS[tier];
  const seed = 9001 + tier * 71 + frame * 13 + seedOf(which);
  const rnd = mulberry32(seed);
  const noise = makeNoise(seed);
  const phase = frame * 3.7;

  // per-frame flicker keeps a 4-frame loop from looking like a still image
  const wobble = 1 + (frame % 2 === 0 ? 0.05 : -0.05) + noise(frame * 1.3) * 0.05;

  const fl = new Layer(L.w, L.h);
  const fc = new Ctx(fl, CELL.ax, CELL.ay);

  for (const n of geo.nozzles) {
    drawPlume(fc, n.x, n.y, t.len * n.lenK, t.wid * n.widK, pal, noise, phase + n.x, {
      diamonds: n.main ? t.diamonds : 0,
      whiteCore: n.main && t.whiteCore,
      scale: wobble,
      alpha: n.alpha,
    });
  }
  if (t.sparks) drawSparks(fc, geo.exhaust.x, geo.exhaust.y, t.len, t.wid, pal, rnd, t.sparks);

  // wide soft halo so the plume lights up the sky around it — kept low and
  // wide, otherwise it stacks onto the core and washes the colour out
  if (t.glow > 0) L.addLayer(blur(fl, Math.round(5 * SS)), t.glow * 0.5);
  L.addLayer(fl, 1);
  return L;
}

/**
 * Electrocution overlay — drawn on top of the ship sprite while hull damage
 * has the rocket paralysed. Six frames, strobing so it never looks static.
 */
function renderArc(which, frame, shipArt) {
  const { L, c } = newCell(CELL);
  const geo = SHIP_DEF[which].geo;
  const seed = 4400 + frame * 37 + seedOf(which);
  const rnd = mulberry32(seed);
  // strobe hard between frames — a steady glow reads as "shielded", a
  // stuttering one reads as "shorting out"
  const intensity = [1, 0.35, 0.85, 0.2, 1, 0.45][frame];

  const fx = new Layer(L.w, L.h);
  const cc = new Ctx(fx, CELL.ax, CELL.ay);

  // rim discharge: the ship's own silhouette, dilated and lit up
  const dil = dilateAlpha(shipArt, Math.round(2.2 * SS));
  const rim = new Layer(L.w, L.h);
  for (let y = 0; y < L.h; y++)
    for (let x = 0; x < L.w; x++) {
      const outer = dil[y * L.w + x];
      const inner = shipArt.d[(y * L.w + x) * 4 + 3];
      const edge = Math.max(0, outer - inner);
      if (edge > 0.02) rim.add(x, y, ARC.outer, edge * 0.5 * intensity);
      // keep the body tint very light, otherwise the hull colours wash out and
      // the player can't tell which rocket is theirs
      if (inner > 0.02) rim.add(x, y, ARC.mid, inner * 0.035 * intensity);
    }
  fx.addLayer(blur(rim, Math.round(1.5 * SS)), 0.7);
  fx.addLayer(rim, 0.85);

  // arcs jumping between hull attachment points
  const pts = geo.arcPoints;
  const arcCount = 2 + Math.round(rnd() * 2 + intensity);
  for (let a = 0; a < arcCount; a++) {
    const p0 = pts[Math.floor(rnd() * pts.length)];
    const p1 = pts[Math.floor(rnd() * pts.length)];
    if (p0 === p1) continue;
    const path = jaggedPath(p0, p1, 6, 5.5, rnd);
    cc.thickLine(path, 3.4, ARC.outer, 0.4 * intensity, 'add');
    cc.thickLine(path, 1.8, ARC.mid, 0.75 * intensity, 'add');
    cc.thickLine(path, 0.8, ARC.core, 1 * intensity, 'add');

    // branch off the middle of the bolt
    if (rnd() > 0.45) {
      const mid = path[Math.floor(path.length / 2)];
      const tip = [mid[0] + (rnd() - 0.5) * 26, mid[1] + (rnd() - 0.5) * 26];
      const br = jaggedPath(mid, tip, 4, 4, rnd);
      cc.thickLine(br, 1.6, ARC.mid, 0.5 * intensity, 'add');
      cc.thickLine(br, 0.7, ARC.core, 0.8 * intensity, 'add');
    }
    for (const p of [p0, p1]) cc.softDisc(p[0], p[1], 7, ARC.mid, 0.5 * intensity, 2, 'add');
  }

  // loose sparks flying off
  for (let i = 0; i < 6 + Math.round(intensity * 8); i++) {
    const p = pts[Math.floor(rnd() * pts.length)];
    const x = p[0] + (rnd() - 0.5) * 22, y = p[1] + (rnd() - 0.5) * 22;
    cc.softDisc(x, y, 3, ARC.mid, 0.45 * intensity, 2, 'add');
    cc.disc(x, y, 0.9, ARC.core, 0.9 * intensity, 'add');
  }

  L.addLayer(blur(fx, Math.round(2.5 * SS)), 0.3 * intensity);
  L.addLayer(fx, 1);
  return L;
}

function jaggedPath(p0, p1, segments, jitter, rnd) {
  const path = [p0];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = p0[0] + (p1[0] - p0[0]) * t + (rnd() - 0.5) * jitter * 2;
    const y = p0[1] + (p1[1] - p0[1]) * t + (rnd() - 0.5) * jitter * 2;
    path.push([x, y]);
  }
  path.push(p1);
  return path;
}

/**
 * Blastoff — 8 frames covering the ~1.1s ignition flare, from the first spark
 * through the peak flare and billowing exhaust, settling into the cruise plume.
 */
function renderBlastoff(which, frame) {
  const { L, c } = newCell(BIG);
  const geo = SHIP_DEF[which].geo;
  const pal = FLAME[which];
  const seed = 7700 + frame * 53 + seedOf(which);
  const rnd = mulberry32(seed);
  const noise = makeNoise(seed);
  const t = frame / 7; // 0..1 through the launch

  // flare spikes hard on frame 1-2 then relaxes into the tier-4 cruise plume
  const flareCurve = [0.15, 0.85, 1.0, 0.92, 0.8, 0.7, 0.62, 0.55][frame];
  const smokeCurve = [0.0, 0.18, 0.45, 0.72, 0.92, 1.0, 0.82, 0.55][frame];
  const len = 34 + flareCurve * 96;
  const wid = 10 + flareCurve * 20;

  // ---- exhaust cloud, behind the flame ----
  // Built as billowing lobes rolling outward from the pad: each lobe is a
  // cluster of overlapping soft discs, which gives the cauliflower edge a
  // scatter of loose puffs never produces.
  const smoke = new Layer(L.w, L.h);
  const sc = new Ctx(smoke, BIG.ax, BIG.ay);
  if (smokeCurve > 0.01) {
    const base = geo.exhaust.y + 20;
    const puffs = [];

    // two arms rolling outward from the pad
    const ARMS = 4;
    for (const side of [-1, 1]) {
      for (let l = 0; l < ARMS; l++) {
        const f = (l + 0.5) / ARMS;                       // 0..1 outward
        const armX = side * smokeCurve * (14 + f * 52) * (0.85 + rnd() * 0.3);
        const armY = base + 12 - f * smokeCurve * 20;     // curls up as it rolls
        const R = (12 + f * 10) * (0.5 + smokeCurve * 0.9);
        for (let i = 0; i < 9; i++) {
          const a2 = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * R * 0.85;
          puffs.push({
            x: armX + Math.cos(a2) * rr,
            y: armY + Math.sin(a2) * rr * 0.85,
            r: R * (0.42 + rnd() * 0.45),
            shade: 0.7 + rnd() * 0.55,
          });
        }
      }
    }
    // dense column boiling out directly under the nozzle
    for (let i = 0; i < 16; i++) {
      const a2 = rnd() * Math.PI * 2;
      const rr = Math.sqrt(rnd()) * 30 * (0.5 + smokeCurve);
      puffs.push({
        x: Math.cos(a2) * rr,
        y: base + 12 + Math.sin(a2) * rr * 0.7,
        r: 10 + rnd() * 12,
        shade: 0.9 + rnd() * 0.5,
      });
    }

    // biggest first so the small crisp puffs land on top and keep the edge legible
    puffs.sort((a, b) => b.r - a.r);
    for (const pf of puffs) {
      const heat = Math.max(0, 1 - Math.hypot(pf.x, pf.y - base) / 58);
      const col = [
        Math.min(1, (0.5 + heat * 0.5) * pf.shade),
        Math.min(1, (0.52 + heat * 0.2) * pf.shade),
        Math.min(1, (0.62 - heat * 0.25) * pf.shade),
      ];
      // near-solid discs (low falloff exponent) — a soft falloff here just
      // averages the whole cloud into a flat fog bank
      sc.softDisc(pf.x, pf.y, pf.r, col, 0.4 * smokeCurve * (1 - t * 0.35), 0.55, 'over');
    }
  }
  L.drawLayer(blur(smoke, Math.max(1, Math.round(0.6 * SS))), 1);

  // ---- flare ----
  const fl = new Layer(L.w, L.h);
  const fc = new Ctx(fl, BIG.ax, BIG.ay);

  // ignition flash on the first frame
  if (frame === 0) {
    fc.softDisc(geo.exhaust.x, geo.exhaust.y + 4, 30, pal.hot, 0.9, 2, 'add');
    fc.softDisc(geo.exhaust.x, geo.exhaust.y + 4, 54, pal.inner, 0.35, 2.5, 'add');
  }

  for (const n of geo.nozzles) {
    drawPlume(fc, n.x, n.y, len * n.lenK, wid * n.widK, pal, noise, frame * 4.1 + n.x, {
      diamonds: n.main ? (frame >= 2 ? 4 : 2) : 0,
      whiteCore: n.main || frame < 4,
      alpha: n.alpha,
    });
  }

  // debris and sparks kicked out by the launch
  drawSparks(fc, geo.exhaust.x, geo.exhaust.y, len, wid, pal, rnd, 26 - frame * 2);
  const streaks = Math.round(14 * (1 - t * 0.6));
  for (let i = 0; i < streaks; i++) {
    const ang = (rnd() * Math.PI * 0.9) + Math.PI * 0.05;
    const dist = 20 + rnd() * 70 * (0.3 + smokeCurve);
    const x = geo.exhaust.x + Math.cos(ang) * dist * (rnd() > 0.5 ? 1 : -1);
    const y = geo.exhaust.y + Math.sin(ang) * dist * 0.5 + 6;
    const l = 3 + rnd() * 9;
    fc.thickLine([[x, y], [x + (x > 0 ? l : -l), y + l * 0.5]], 1.6,
      rnd() > 0.5 ? pal.hot : pal.inner, 0.8, 'add');
  }

  L.addLayer(blur(fl, Math.round(4 * SS)), 1.5 * (0.5 + flareCurve));
  L.addLayer(fl, 1);
  return L;
}

/* ------------------------------------------------------------------ *
 * Sheet assembly — one self-contained sheet per rocket
 * ------------------------------------------------------------------ */

// The roster. Adding a rocket is: define its geometry + draw fn above, add it
// to SHIP_DEF, then add a line here. It gets its own PNG; no existing sheet is
// re-laid-out, so cached art for other rockets stays valid.
const ROSTER = [
  { key: 'A', id: 'vanguard', label: 'Vanguard' },
  { key: 'B', id: 'kestrel', label: 'Kestrel' },
  { key: 'C', id: 'marauder', label: 'Marauder' },
];

/**
 * Frame names are unqualified (`ship`, `thrust_t3_1`, `zap_0`, `blastoff_5`)
 * because the file already identifies the rocket. Every rocket therefore
 * exposes exactly the same animation names, so the loader and the render code
 * never branch on which rocket it is.
 */
function buildRocket({ key, id, label }) {
  const frames = {};
  const animations = {};
  const small = [];   // CELL-sized frames
  const big = [];     // BIG-sized frames

  const { full, art } = renderShip(key);
  small.push({ name: 'ship', layer: full });
  animations.ship = { frames: ['ship'] };

  for (let tier = 0; tier < TIERS.length; tier++) {
    const names = [];
    for (let f = 0; f < 4; f++) {
      const name = `thrust_t${tier}_${f}`;
      small.push({ name, layer: renderThruster(key, tier, f) });
      names.push(name);
    }
    animations[`thrust_t${tier}`] = { frames: names, fps: 24, loop: true };
  }

  {
    const names = [];
    for (let f = 0; f < 6; f++) {
      const name = `zap_${f}`;
      small.push({ name, layer: renderArc(key, f, art) });
      names.push(name);
    }
    animations.zap = { frames: names, fps: 18, loop: true };
  }

  {
    const names = [];
    for (let f = 0; f < 8; f++) {
      const name = `blastoff_${f}`;
      big.push({ name, layer: renderBlastoff(key, f) });
      names.push(name);
    }
    animations.blastoff = { frames: names, fps: 7, loop: false };
  }

  // pack: small cells in an 8-wide grid up top, big cells in a 4-wide grid below
  const packed = packSections([
    { cols: 8, spec: CELL, cells: small },
    { cols: 4, spec: BIG, cells: big },
  ]);
  const { sheet, size } = packed;
  Object.assign(frames, packed.frames);

  const atlas = {
    id,
    label,
    image: `${id}.png`,
    note: 'Draw at (shipX - ax, shipY - ay). Every frame shares the ship-centre anchor, so thruster/zap/blastoff frames line up with the ship frame at the same position.',
    size,
    tiers: TIERS.length,
    frames,
    animations,
  };

  return { atlas, sheet, count: small.length + big.length };
}

/* ------------------------------------------------------------------ *
 * Write
 * ------------------------------------------------------------------ */

const atlases = {};

for (const entry of ROSTER) {
  console.log(`drawing ${entry.id}…`);
  const { atlas, sheet, count } = buildRocket(entry);
  const bytes = writeSheet(OUT_DIR, entry.id, sheet, atlas);
  atlases[entry.id] = atlas;
  console.log(
    `  ${entry.id}.png  ${atlas.size.w}×${atlas.size.h}  ` +
    `${count} frames  ${(bytes / 1024).toFixed(0)} KB`
  );
}

// Roster index — the lobby reads this to know what exists, then loads only the
// sheets for the rockets actually in the race.
const index = {
  rockets: ROSTER.map(({ id, label }) => ({
    id, label, atlas: `${id}.json`, image: `${id}.png`,
  })),
};
fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2));

// Every atlas as a plain global too, so preview.html can run straight off the
// filesystem — fetch() is blocked under file://.
writeAtlasGlobal(OUT_DIR, 'atlas.js', {
  ROCKET_INDEX: index,
  ROCKET_ATLASES: atlases,
}, 'gen-rockets.mjs');

console.log(`wrote ${ROSTER.length} rockets + index.json, atlas.js`);
