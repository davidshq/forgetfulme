// Minimal popup bootstrap
import { getActiveTabUrl } from '../utils/url.js';
import { listRecent, toggleReadForUrl } from '../utils/supabase.js';

const statusEl = document.getElementById('status-pill');
const toggleBtn = document.getElementById('toggle-btn');
const recentList = document.getElementById('recent-list');
const searchInput = document.getElementById('search');

async function renderRecent(query = '') {
  const items = await listRecent(query);
  recentList.innerHTML = '';
  for (const it of items) {
    const li = document.createElement('li');
    li.textContent = it.title || it.url;
    recentList.appendChild(li);
  }
}

async function init() {
  const url = await getActiveTabUrl();
  statusEl.textContent = url ? 'Unknown' : 'No tab';
  await renderRecent();
}

toggleBtn.addEventListener('click', async () => {
  const url = await getActiveTabUrl();
  if (!url) return;
  await toggleReadForUrl(url);
  statusEl.textContent = 'Toggled';
  await renderRecent(searchInput.value || '');
});

searchInput.addEventListener('input', () => renderRecent(searchInput.value || ''));

init();

