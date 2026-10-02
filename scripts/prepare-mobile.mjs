import { cp, mkdir, rm, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const out = join(root, 'www');

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const files = [
  'index.html',
  'style.css',
  'app.js',
  'ui-v2.js',
  'detail-v3.js',
  'recommendations.js',
  'sw.js',
  'manifest.webmanifest'
];

const dirs = ['data', 'assets'];

for (const file of files) {
  await cp(join(root, file), join(out, file));
}

for (const dir of dirs) {
  await cp(join(root, dir), join(out, dir), { recursive: true });
}

console.log('Brawl Helper mobile web bundle prepared in ./www');
