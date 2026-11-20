[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/isnalestari09/solmar-bay-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/isnalestari09/solmar-bay-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Solmar Bay Cover Studio

A GTA-style cover-art maker for the fictional city of Solmar Bay. Pick a
cover size, fill three diagonal panels with procedurally drawn scenes or
your own photos, write the title, subtitle and tagline, pick a colour
grade, and export the cover as a PNG — all offline, in your browser.

All artwork is original and drawn in code on canvas. No Rockstar Games
logo, artwork or font is used anywhere.

Built for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01)
on make.fun.

## How to use

1. Pick a cover size: landscape 1280×720, portrait 1024×1280, or square
   1080×1080.
2. For each of the three diagonal panels, choose one of four drawn
   scenes — Dani at Sunset, Boat Chase, Lighthouse Docks, Neon Street —
   or load your own photo (upload, or drag it onto the panel). Drag a
   loaded photo to reposition it and use the zoom slider to frame it.
3. Edit the title, subtitle and tagline.
4. Pick a colour grade: Sunset, Neon Nights, or Vice Gold.
5. Press **Export PNG** to download the finished cover at full size.
   Press **R** for a random cover, **E** to export.

## Run locally

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. The app is static
files under `app/` and makes no network requests.

## Screenshots

`screenshots/` holds four renders of this build:

- `1-cover.jpg` — an exported landscape cover (1280×720).
- `2-editor.jpg` — the editor with a photo loaded in panel 2.
- `3-cover.jpg` — an exported portrait cover (1024×1280).
- `4-cover.jpg` — an exported square cover (1080×1080).

They are taken with the app's own `?shot=cover` and `?photoN=sample`
presets (see `app/src/shots.js`).

## How it works

- `app/src/scenes.js` — four procedural scene painters (sunset skyline,
  night boat chase, lighthouse docks, neon street), all drawn in code.
- `app/src/cover.js` — the cover renderer: diagonal panel clipping,
  photo placement with zoom and pan, lettering, and colour grades.
- `app/src/main.js` — editor state, controls, photo upload and drag,
  PNG export.
- `app/src/shots.js` — URL presets (`?size=…&scene1=…&grade=…`,
  `?shot=cover`) used to take the screenshots.
- `main.ts` — copies `app/` and `screenshots/` into the output
  directory and writes `dossier.json` with `buildDossier`.

## License

MIT — see [LICENSE](LICENSE).
