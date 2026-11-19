// Solmar Bay Cover Studio entry program (Node 22, standard library only):
// copies app/ and screenshots/ from this repository to the output directory
// (MAKEFUN_OUTPUT_DIR, or /output) and writes /output/dossier.json with
// buildDossier from vendor/makefun-app.ts. Both runs write the same bytes.

import { cp, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = (process.env.MAKEFUN_OUTPUT_DIR || '').trim() || '/output';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

async function main() {
  await mkdir(outDir, { recursive: true });
  await cp(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  await cp(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outDir, caps);
  await writeFile(join(outDir, 'dossier.json'), dossier);
  const sha = createHash('sha256').update(dossier).digest('hex');
  const limit = 1572864;
  if (dossier.length > limit) {
    throw new Error(`dossier.json is ${dossier.length} bytes, over the ${limit} allowed`);
  }
  console.log(`dossier.json: ${dossier.length} bytes, sha256 ${sha}`);
  console.log(`output written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
