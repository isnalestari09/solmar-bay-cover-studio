// Solmar Bay Cover Studio — entry program.
//
// Copies app/ and screenshots/ into the output directory and writes
// /output/dossier.json with buildDossier from vendor/makefun-app.ts.
//
// The output directory itself is NEVER removed: only its app/ and
// screenshots/ subdirectories are refreshed. That keeps the program
// working when /output is a bind mount owned by the grader (removing
// the mount point itself fails there), while still making each run
// deterministic: stale files from an earlier run cannot leak into the
// dossier, so two runs write byte-identical output.
import { buildDossier } from './vendor/makefun-app.ts';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly, before copying anything, when the entry is incomplete.
for (const sub of ['app', 'screenshots']) {
  if (!existsSync(join(repoDir, sub))) {
    throw new Error(`main.ts: missing ${sub}/ in the repository`);
  }
}

// The output directory itself stays put; only its children are rebuilt.
mkdirSync(outDir, { recursive: true });
for (const sub of ['app', 'screenshots']) {
  const target = join(outDir, sub);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(join(repoDir, sub), target, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`dossier.json written: ${dossier.length} bytes`);
