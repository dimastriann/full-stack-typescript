#!/usr/bin/env node
/**
 * Fails when the production bundle exceeds the committed budgets.
 * Sizes are gzip-compressed because that reflects what users download.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGETS = {
  totalJsGzipKb: Number(process.env.BUNDLE_BUDGET_TOTAL_JS_KB ?? 750),
  totalCssGzipKb: Number(process.env.BUNDLE_BUDGET_TOTAL_CSS_KB ?? 40),
  largestChunkGzipKb: Number(process.env.BUNDLE_BUDGET_LARGEST_CHUNK_KB ?? 140),
};

const assetsDir = join(process.cwd(), 'dist', 'assets');

let files;
try {
  files = readdirSync(assetsDir).filter((file) => /\.(js|css)$/.test(file));
} catch {
  console.error(`No build output at ${assetsDir}. Run "npm run build" first.`);
  process.exit(1);
}

if (files.length === 0) {
  console.error(`No JS/CSS assets found in ${assetsDir}.`);
  process.exit(1);
}

let totalJs = 0;
let totalCss = 0;
let largest = { file: '', gzipBytes: 0 };
for (const file of files) {
  const contents = readFileSync(join(assetsDir, file));
  const gzipBytes = gzipSync(contents, { level: 9 }).length;
  if (file.endsWith('.js')) {
    totalJs += gzipBytes;
    if (gzipBytes > largest.gzipBytes) largest = { file, gzipBytes };
  } else {
    totalCss += gzipBytes;
  }
}

const kb = (bytes) => Math.round(bytes / 1024);
const checks = [
  { name: 'total JS (gzip)', actual: kb(totalJs), budget: BUDGETS.totalJsGzipKb },
  { name: 'total CSS (gzip)', actual: kb(totalCss), budget: BUDGETS.totalCssGzipKb },
  {
    name: `largest chunk ${largest.file} (gzip)`,
    actual: kb(largest.gzipBytes),
    budget: BUDGETS.largestChunkGzipKb,
  },
];

let failed = false;
for (const check of checks) {
  const status = check.actual <= check.budget ? 'ok  ' : 'FAIL';
  if (check.actual > check.budget) failed = true;
  console.log(
    `[${status}] ${check.name}: ${check.actual} KB (budget ${check.budget} KB)`,
  );
}

if (failed) {
  console.error(
    '\nBundle budget exceeded. Reduce the bundle or raise the budget deliberately (and explain why in the commit).',
  );
  process.exit(1);
}
