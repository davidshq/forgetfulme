/**
 * Bundles the MV3 background service worker from ES module sources.
 * Run via: npm run build:background
 */
import * as esbuild from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });

await esbuild.build({
  entryPoints: ['background/entry.js'],
  outfile: 'dist/background.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome109'],
  logLevel: 'info',
});

console.log('Built dist/background.js');
