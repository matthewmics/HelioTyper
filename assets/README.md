# Assets

Grouped by subject, one folder each. A group owns its art, its atlas, its
generator and its preview, so nothing outside the folder needs to change when
you add to it.

| Group | What's in it |
|---|---|
| [`rockets/`](rockets/) | the playable rockets — one spritesheet per rocket, plus the roster index |

Art here is **generated, not hand-drawn**. Each group ships a `gen-*.mjs` that
writes its own output alongside itself, with no dependencies and no build step —
plain `node`, same as the prototype's no-install ethos. The generator is the
source of truth: edit it and rerun, don't touch the PNGs.

Output is deterministic, so rerunning a generator produces byte-identical files
and only real changes show up in a diff.
