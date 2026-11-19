[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/isnalestari09/solmar-bay-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/isnalestari09/solmar-bay-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Solmar Bay Cover Studio

A GTA-style cover art maker that runs offline in your browser — an entry for
make.fun's **Make GTA 6 Cover Art** bounty (`gta6-cover-art-01`). Pick a post
size, fill each of the three diagonal panels with a drawn Solmar Bay scene or
your own photo (drag to pan, zoom slider to crop), write the title, subtitle
and tagline, pick a colour grade, and export a PNG to share.

The cover is for the fictional game **Solmar Bay** — Dani Reyes, getaway driver,
coastal sunset, lighthouse docks, boat chase. All art is original and drawn in
code; no Rockstar Games logo, artwork or font is used anywhere.

## How it works

1. **Size** — Square 1080 × 1080, Portrait 1080 × 1350, or Wide 1920 × 1080.
2. **Panels** — click a panel, then choose one of four drawn scenes (Dani at
   Sunset, Boat Chase, Lighthouse Docks, Neon Street) or upload your own photo,
   or use a kit sample (Pier, Boulevard). One photo can fill several panels.
3. **Words** — edit the title, subtitle and tagline; the lettering re-draws live.
4. **Grade** — Sunset, Neon Nights, or Vice Gold.
5. **Export PNG** — the cover is rendered at full post size and downloaded.

Everything runs from static files under `app/` — no network request, no upload,
photos never leave your machine.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Deterministic screenshots: `?shot=cover&size=wide|square|portrait` draws a cover
full-frame; `?shot=editor` opens the editor with the pier sample photo loaded.

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.

## Screenshots

- `1-cover.jpg` — wide cover (1920 × 1080 export)
- `2-editor.jpg` — editor with the pier sample photo loaded
- `3-cover.jpg` — portrait cover (1080 × 1350 export)
- `4-cover.jpg` — square cover (1080 × 1080 export)

## License

MIT — see `LICENSE`.
