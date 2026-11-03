import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const files = readdirSync(new URL('../dist/assets/', import.meta.url));
const budgets = [
  { pattern: /^index-.*\.js$/, maxGzipKiB: 180, label: 'main JavaScript' },
  { pattern: /^index-.*\.css$/, maxGzipKiB: 30, label: 'site CSS' },
  { pattern: /^supabase-.*\.js$/, maxGzipKiB: 75, label: 'lazy-loaded Supabase SDK' },
];
let failed = false;
for (const { pattern, maxGzipKiB, label } of budgets) {
  const file = files.find(name => pattern.test(name));
  if (!file) {
    console.error(`Missing build asset: ${label}`);
    failed = true;
    continue;
  }
  const bytes = gzipSync(readFileSync(new URL(`../dist/assets/${file}`, import.meta.url))).length;
  const kib = bytes / 1024;
  console.log(`${label}: ${kib.toFixed(1)} KiB gzip (budget ${maxGzipKiB} KiB)`);
  if (kib > maxGzipKiB) {
    console.error(`Asset budget exceeded: ${label}`);
    failed = true;
  }
}
if (failed) process.exitCode = 1;
