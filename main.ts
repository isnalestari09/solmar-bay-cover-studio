// main.ts — Solmar Bay Cover Studio entry point (Node 22, stdlib only).
//
// Copies app/ and screenshots/ from this repository into the output directory
// and writes /output/dossier.json with the kit's buildDossier.
//
// The output directory itself is NEVER removed: on the grader it is a bind
// mount, and removing it fails the run. This program only creates the
// directory (mkdir recursive) and clears its CONTENTS before copying in.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// The scorer's caps for this bounty (from the kit's gate): at most 4
// screenshots of 256 KiB each, 993 app entries, 48 MiB of app files, paths
// under 1000 bytes, and a dossier text of 163,840 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

// Remove everything INSIDE a directory, never the directory itself.
function clearContents(dir: string): void {
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  clearContents(OUT_DIR);

  const appSrc = join(REPO_ROOT, 'app');
  if (!existsSync(appSrc) || !statSync(appSrc).isDirectory()) {
    throw new Error('app/ is missing from the repository');
  }
  cpSync(appSrc, join(OUT_DIR, 'app'), { recursive: true });

  const shotsSrc = join(REPO_ROOT, 'screenshots');
  let shotCount = 0;
  if (existsSync(shotsSrc) && statSync(shotsSrc).isDirectory()) {
    const shots = readdirSync(shotsSrc).filter((f) => /\.(png|jpe?g)$/i.test(f));
    if (shots.length === 0) throw new Error('screenshots/ has no images to hand in');
    shotCount = shots.length;
    cpSync(shotsSrc, join(OUT_DIR, 'screenshots'), { recursive: true });
  } else {
    throw new Error('screenshots/ is missing from the repository');
  }

  const dossier = buildDossier(OUT_DIR, CAPS);
  writeFileSync(join(OUT_DIR, 'dossier.json'), dossier);
  const appCount = readdirSync(join(OUT_DIR, 'app'), { recursive: true }).length;
  console.log(`Solmar Bay Cover Studio: app (${appCount} entries) + ${shotCount} screenshots -> ${join(OUT_DIR, 'dossier.json')} (${dossier.length} bytes)`);
}

main();
