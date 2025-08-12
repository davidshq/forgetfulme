import { get, set, remove } from './storage.js';
import { normalizeUrl, domainOf } from './url.js';

let cachedClient = null;

// Storage adapter for Supabase auth in MV3 background/popup
const AuthStorageAdapter = {
  async getItem(key) {
    const res = await get(key);
    return res?.[key] ?? null;
  },
  async setItem(key, value) {
    await set({ [key]: value });
  },
  async removeItem(key) {
    await remove(key);
  }
};

export async function getConfig() {
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key, PRIVACY_MODE: privacy } = await get([
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'PRIVACY_MODE'
  ]);
  return { url, key, privacy };
}

export async function setConfig({ url, key, privacy }) {
  cachedClient = null; // reset client when config changes
  await set({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key, PRIVACY_MODE: !!privacy });
}

async function getClient() {
  if (cachedClient) return cachedClient;
  const { url, key } = await getConfig();
  if (!url || !key) return null;
  // Lazy import local bundled ESM to satisfy MV3 CSP (see bundle:supabase script)
  let createClient;
  try {
    ({ createClient } = await import('../lib/supabase.bundle.js'));
  } catch (e) {
    console.warn('Supabase bundle not found. Run: npm run bundle:supabase');
    return null;
  }
  cachedClient = createClient(url, key, {
    auth: {
      storage: AuthStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });
  return cachedClient;
}

export async function testConnection() {
  const client = await getClient();
  return Boolean(client);
}

export async function listRecent(query = '', page = 1, pageSize = 10) {
  const client = await getClient();
  if (!client) return { items: [], hasMore: false };
  const from = (page - 1) * pageSize;
  const to = from + pageSize; // request one extra to detect hasMore
  let q = client
    .from('reads')
    .select('url,title,domain,status,last_read_at')
    .order('last_read_at', { ascending: false })
    .range(from, to);
  if (query) {
    const esc = query.replace(/%/g, '\\%').replace(/_/g, '\\_');
    q = q.or(`title.ilike.%${esc}%,domain.ilike.%${esc}%`);
  }
  const { data, error } = await q;
  if (error) return { items: [], hasMore: false };
  const items = (data || []).slice(0, pageSize);
  const hasMore = (data || []).length > pageSize;
  return { items, hasMore };
}

export async function toggleReadForUrl(rawUrl, title = null) {
  const client = await getClient();
  if (!client) return null;
  const url = normalizeUrl(rawUrl);
  const domain = domainOf(url);
  const { data, error } = await client.rpc('toggle_read', {
    p_url: url,
    p_title: title,
    p_domain: domain
  });
  if (error) return null;
  return data;
}

export async function getUser() {
  const client = await getClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data?.user || null;
}

export async function signInWithPassword(email, password) {
  const client = await getClient();
  if (!client) return { error: 'no-client' };
  const { error } = await client.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signOut() {
  const client = await getClient();
  if (!client) return;
  await client.auth.signOut();
}

export async function getStatusForUrl(rawUrl) {
  const client = await getClient();
  if (!client) return null;
  const url = normalizeUrl(rawUrl);
  const { data, error } = await client
    .from('reads')
    .select('status')
    .eq('url', url)
    .maybeSingle();
  if (error) return null;
  return data?.status || null;
}
