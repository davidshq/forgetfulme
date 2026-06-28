import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createClient } from '../../supabase-js.min.js';

const pinnedVersion = JSON.parse(
  readFileSync('node_modules/@supabase/supabase-js/package.json', 'utf8'),
).version;

describe('supabase-js.min.js bundle', () => {
  it('exports createClient', () => {
    expect(typeof createClient).toBe('function');
  });

  it('createClient returns a client with from()', () => {
    const client = createClient('https://example.supabase.co', 'anon-key');
    expect(typeof client.from).toBe('function');
  });

  it('banner version matches pinned @supabase/supabase-js', () => {
    const banner = readFileSync('supabase-js.min.js', 'utf8').split('\n')[0];
    expect(banner).toContain(`@supabase/supabase-js@${pinnedVersion}`);
  });
});
