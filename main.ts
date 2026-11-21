// BLACKTIDE — entrypoint (Node 22, standard library only).
// Copies game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Deterministic: the same input files always produce the
// same output bytes, and every copied file is 0o644, every copied directory
// 0o755 — the output directory itself is never chmodded, so the grader can
// own it and still read everything. Serve locally with `node serve.ts`.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Walk a directory tree and fix permissions: files 0o644, dirs 0o755.
// The directory passed in is fixed too — cpSync preserves the source
// directory's mode, so without this the top-level game/ and screenshots/
// dirs would keep whatever mode the checkout happened to have.
function fixPerms(dir) {
  chmodSync(dir, 0o755);
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) { chmodSync(p, 0o755); fixPerms(p); }
    else chmodSync(p, 0o644);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Permissions BEFORE the dossier is written, so dossier.json gets fixed too
// by the second pass below; the output dir itself is never chmodded.
fixPerms(join(out, 'game'));
fixPerms(join(out, 'screenshots'));

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB
// of game files, in all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
chmodSync(join(out, 'dossier.json'), 0o644);
