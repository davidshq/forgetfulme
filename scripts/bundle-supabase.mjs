/**
 * Bundles @supabase/supabase-js for MV3 CSP compliance (local script, no CDN).
 * Output is imported as ESM by supabase-config.js.
 * Run via: npm run bundle:supabase
 */
import * as esbuild from 'esbuild';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(
  readFileSync('node_modules/@supabase/supabase-js/package.json', 'utf8'),
);

await esbuild.build({
  entryPoints: ['scripts/supabase-global-entry.mjs'],
  outfile: 'supabase-js.min.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['chrome109'],
  minify: true,
  sourcemap: false,
  logLevel: 'info',
  banner: {
    js: `/* @supabase/supabase-js@${pkg.version} — rebuild: npm run bundle:supabase */`,
  },
});

console.log(
  `Bundled @supabase/supabase-js@${pkg.version} to supabase-js.min.js`,
);
