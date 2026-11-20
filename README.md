# Solmar Bay Cover Studio

![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)
![rank](https://make.fun/badge/gta6-cover-art-01/isnalestari09/solmar-bay-cover-studio/rank.svg)
![reward](https://make.fun/badge/gta6-cover-art-01/isnalestari09/solmar-bay-cover-studio/reward.svg)

A free offline web app that turns your photo and a caption into GTA-style
cover art for the fictional city of Solmar Bay. Pick a size, fill three
diagonal panels with hand-drawn scenes or your own photos, write the title,
pick a colour grade, and export a PNG to share. Everything runs in your
browser — no uploads, no account, no network.

## What it does

- **Three sizes** — landscape 1280×720, portrait 1024×1280, square 1080×1080.
- **Three diagonal panels** — each holds one of four scenes drawn in code
  (*Dani at Sunset*, *Boat Chase*, *Lighthouse Docks*, *Neon Street*) or
  your own photo, which you can upload, drag to position, and zoom.
- **Cover lettering** — title, subtitle and tagline in bold game-cover type.
- **Three colour grades** — Sunset, Neon Nights, Vice Gold.
- **One-click PNG export** at full resolution, plus a random-cover button.
  Keyboard: `E` exports, `R` randomises.
- **Shareable presets** — the URL carries the whole setup
  (`?size=&grade=&scenes=&title=…`), so a link opens the exact cover.
  `?view=cover` shows only the cover, edge to edge — how the cover
  screenshots are taken.

All art is original and drawn in code with canvas gradients and paths.
Solmar Bay is fictional; the app uses no Rockstar logo, no GTA artwork,
and no licensed assets. Photos stay on your machine.

## Run it

```sh
node serve.ts
# open http://localhost:8080/
```

Build the entry (copies `app/` and `screenshots/` to the output directory
and writes `dossier.json`):

```sh
MAKEFUN_OUTPUT_DIR=/tmp/solmar-out node main.ts
```

## Screenshots

Rendered from this build in headless Chrome: `1-cover.jpg` (landscape
cover), `2-editor.jpg` (editor with a photo loaded), `3-cover.jpg`
(portrait cover), `4-cover.jpg` (square cover).
