import { Actor, Color, type Scene, vec } from 'excalibur';
import type { Atlas } from '../atlas';
import { STAR_COUNT, Z } from '../config';
import { rand } from '../util';
import { smoothstep } from '../util';
import type { View } from '../view';

interface Star {
  actor: Actor;
  /** Base y in a band three viewports tall, so scrolling can wrap it. */
  y: number;
  /** 1 is the far layer (dim, slow), 2 is near (bright, fast). */
  layer: 1 | 2;
}

/**
 * Stars are invisible at ground level and fade in through the middle of the climb.
 *
 * The drift is cosmetic. It runs off the eased camera speed rather than actual
 * position, because the ship's real travel is already sold by its screen y and by
 * the planets going past.
 *
 * Uses `effects/star` rather than filled circles: the sprite is a soft glow, which
 * reads better than a hard `arc()` dot at these sizes.
 */
export class Starfield {
  private readonly _stars: Star[] = [];
  private _width = 0;
  private _height = 0;

  constructor(scene: Scene, effects: Atlas) {
    for (let i = 0; i < STAR_COUNT; i++) {
      const layer: 1 | 2 = Math.random() < 0.7 ? 1 : 2;
      const r = rand(0.3, 1.9);

      const sprite = effects.sprite('star');
      sprite.tint = Color.White;
      sprite.scale.setTo(r / 7, r / 7);

      const actor = new Actor({ name: `star${i}`, pos: vec(0, 0), z: Z.stars });
      actor.graphics.anchor = effects.anchorOf('star');
      actor.graphics.use(sprite);
      actor.graphics.opacity = 0;

      this._stars.push({ actor, y: 0, layer });
      scene.add(actor);
    }
  }

  /** Scatter across the current viewport. Called on start and on resize. */
  layout(width: number, height: number): void {
    this._width = width;
    this._height = height;
    for (const s of this._stars) {
      s.actor.pos.x = Math.random() * width;
      s.y = Math.random() * height * 3 - height;
    }
  }

  sync(view: View): void {
    if (view.w !== this._width || view.h !== this._height) this.layout(view.w, view.h);

    const alpha = smoothstep(0.26, 0.68, view.atmo);
    const band = view.h * 3;

    for (const s of this._stars) {
      s.actor.graphics.opacity = (s.layer === 1 ? 0.4 : 0.9) * alpha;
      if (alpha <= 0.01) continue;

      const drift = view.worldScroll * (s.layer === 1 ? 0.4 : 1);
      let y = (s.y + drift) % band;
      if (y < 0) y += band;
      s.actor.pos.y = y - view.h;
    }
  }
}
