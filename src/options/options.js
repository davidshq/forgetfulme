import { getConfig, setConfig, testConnection } from '../utils/supabase.js';

const form = document.getElementById('config-form');
const urlEl = document.getElementById('sb-url');
const keyEl = document.getElementById('sb-key');
const privacyEl = document.getElementById('privacy');
const statusEl = document.getElementById('status');
const testBtn = document.getElementById('test');

async function load() {
  const cfg = await getConfig();
  urlEl.value = cfg.url || '';
  keyEl.value = cfg.key || '';
  privacyEl.checked = !!cfg.privacy;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  await setConfig({ url: urlEl.value, key: keyEl.value, privacy: privacyEl.checked });
  statusEl.textContent = 'Saved';
});

testBtn.addEventListener('click', async () => {
  statusEl.textContent = 'Testing...';
  const ok = await testConnection();
  statusEl.textContent = ok ? 'Connected' : 'Failed';
});

load();

