[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/isnalestari09/solmar-bay-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/isnalestari09/solmar-bay-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Solmar Bay Cover Studio

A GTA-style cover art maker for the fictional game **Solmar Bay** — Dani Reyes, getaway driver, coastal sunset, lighthouse docks, boat chase. Pick a size, fill three diagonal panels with drawn Solmar Bay scenes or your own photos (upload, drag to pan, zoom to crop), edit the title, subtitle and tagline, pick a colour grade, and export a PNG to share.

All art is original and drawn in code. No Rockstar Games logo, artwork or font.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` from any static file server. The app works fully offline — every script, style and image it loads is a file under `app/`, and your photos are read on your own machine, never uploaded.

## What it does

- **Three diagonal panels** per cover, split by slanted dividers with an accent edge.
- **Four procedural scenes**, all painted in code: Dani at Sunset, Boat Chase, Lighthouse Docks, Neon Street.
- **Any photo**: upload your own, or use the two free sample photos (pier, boulevard). Drag to position, zoom slider to crop, one photo per panel or the same photo in several.
- **Three colour grades**: Sunset, Neon Nights, Vice Gold — a wash plus vignette over the whole cover.
- **Bold caption lettering** on a slanted title band: title, subtitle and tagline, all editable live.
- **Three post sizes**: Landscape 1920 × 1080, Square 1080 × 1080, Portrait 1080 × 1350.
- **One-click PNG export** at full size, plus deterministic `?shot=` presets (`cover`, `editor`, `portrait`, `square`) for reproducible screenshots.

## Screenshots

- `1-cover.jpg` — the wide landscape cover the app exports.
- `2-editor.jpg` — the editor with the pier sample photo loaded in panel 2.
- `3-cover.jpg` — the portrait cover in the Neon Nights grade.
- `4-cover.jpg` — the square cover in the Vice Gold grade.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`. It never removes the output directory itself, so it runs cleanly where the output path is a bind mount.

## Entry

Built for the [make.fun GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01) by [@isnalestari09](https://github.com/isnalestari09). Try make.fun yourself: https://make.fun/r/7fcw42xg
