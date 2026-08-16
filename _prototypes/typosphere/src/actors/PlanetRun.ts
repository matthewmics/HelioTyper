import { Actor, type Animation, type Scene, vec } from 'excalibur';
import type { Atlas } from '../atlas';
import { PLANET_SPREAD, RUN, Z, type Leg } from '../config';
import type { View } from '../view';

interface Body {
  leg: Leg;
  actor: Actor;
  /** Only the moon has one: the mast and pennant on its upper-left limb. */
  beacon?: Actor;
}

/**
 * The outbound run: moon, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.
 *
 * These are the things you *pass*, which is why they move and the finish line does
 * not. Each sits at a fixed point along the run and streams by with its own
 * parallax factor, so they read as bodies at different distances rather than a
 * row of stickers at the same depth.
 *
 * Sizes in the sheet are readable rather than physical (a real Jupiter beside a
 * real Pluto is a 59x spread). `scale` on top of that is how close you pass.
 */
export class PlanetRun {
  private readonly _bodies: Body[] = [];
  private readonly _beaconAnim: Animation;

  constructor(scene: Scene, planets: Atlas) {
    this._beaconAnim = planets.animation('beacon');

    for (const leg of RUN) {
      const sprite = planets.sprite(leg.body);
      sprite.scale.setTo(leg.scale, leg.scale);

      const actor = new Actor({ name: leg.body, pos: vec(0, 0), z: Z.planets });
      actor.graphics.anchor = planets.anchorOf(leg.body);
      actor.graphics.use(sprite);

      scene.add(actor);
      const body: Body = { leg, actor };

      if (leg.body === 'moon') {
        // Flavour, not a finish line any more: humanity got this far. It sits on
        // the moon's own cell, so the same position lines it up exactly.
        this._beaconAnim.scale.setTo(leg.scale, leg.scale);
        const beacon = new Actor({ name: 'moonBeacon', pos: vec(0, 0), z: Z.planets + 1 });
        beacon.graphics.anchor = planets.anchorOf('beacon_0');
        beacon.graphics.use(this._beaconAnim);
        scene.add(beacon);
        body.beacon = beacon;
      }

      this._bodies.push(body);
    }
  }

  sync(view: View): void {
    for (const b of this._bodies) {
      const { leg } = b;
      // Level with the ship at `leg.at`, above it before, below it after.
      const y = view.shipY + (view.progress - leg.at) * PLANET_SPREAD * leg.depth;
      const x = leg.x * view.w;

      const half = (b.actor.graphics.current?.height ?? 0) / 2 + 80;
      const onScreen = y > -half && y < view.h + half;

      b.actor.graphics.visible = onScreen;
      if (b.beacon) b.beacon.graphics.visible = onScreen;
      if (!onScreen) continue;

      b.actor.pos.setTo(x, y);
      b.beacon?.pos.setTo(x, y);
    }
  }
}
