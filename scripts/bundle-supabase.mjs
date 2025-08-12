import esbuild from 'esbuild';

const entry = 'node_modules/@supabase/supabase-js/dist/module/index.js';
await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: 'src/lib/supabase.bundle.js',
  minify: true,
  sourcemap: false,
  logLevel: 'info'
});

console.log('Bundled supabase-js to src/lib/supabase.bundle.js');

