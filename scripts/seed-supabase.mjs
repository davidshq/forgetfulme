import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, serviceKey);

async function main() {
  // Create or find a test user; for simplicity, assume you will sign in separately.
  // Insert seed data for a given user_id via env var.
  const userId = process.env.SEED_USER_ID;
  if (!userId) {
    console.error('Set SEED_USER_ID to an existing auth.users id');
    process.exit(1);
  }
  const rows = [
    {
      user_id: userId,
      url: 'https://example.com/a',
      title: 'Example Article',
      domain: 'example.com',
      status: 'read'
    },
    {
      user_id: userId,
      url: 'https://example.com/b',
      title: 'Another Read',
      domain: 'example.com',
      status: 'unread'
    }
  ];

  for (const r of rows) {
    const { error } = await sb.from('reads')
      .insert(r)
      .onConflict('user_id,url')
      .ignore();
    if (error) console.error('Insert error', error);
  }
  console.log('Seed complete');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

