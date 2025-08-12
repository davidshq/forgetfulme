// Minimal popup bootstrap
import { getActiveTabUrl } from '../utils/url.js';
import {
  listRecent,
  toggleReadForUrl,
  getUser,
  signInWithPassword,
  signOut,
  getStatusForUrl
} from '../utils/supabase.js';

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const statusEl = document.getElementById('status-pill');
const toggleBtn = document.getElementById('toggle-btn');
const signoutBtn = document.getElementById('signout-btn');
const recentList = document.getElementById('recent-list');
const searchInput = document.getElementById('search');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authStatus = document.getElementById('auth-status');

async function renderRecent(query = '') {
  const items = await listRecent(query);
  recentList.innerHTML = '';
  for (const it of items) {
    const li = document.createElement('li');
    const title = document.createElement('div');
    title.textContent = it.title || it.url;
    const meta = document.createElement('div');
    meta.className = 'meta';
    const chip = document.createElement('span');
    const st = (it.status || '').toLowerCase();
    chip.className = `chip ${st}`;
    chip.textContent = st || 'unknown';
    const when = document.createElement('span');
    if (it.last_read_at) {
      try {
        when.textContent = ' • ' + new Date(it.last_read_at).toLocaleString();
      } catch {}
    }
    meta.appendChild(chip);
    meta.appendChild(when);
    li.appendChild(title);
    li.appendChild(meta);
    recentList.appendChild(li);
  }
}

function isMockSignedIn() {
  try {
    const p = new URLSearchParams(location.search);
    return p.get('mock') === 'signedin';
  } catch { return false; }
}

const mockState = {
  status: 'read',
  recent: [
    { title: 'Example Article', url: 'https://example.com/a', status: 'read', last_read_at: new Date().toISOString() },
    { title: 'Another Read', url: 'https://example.com/b', status: 'unread', last_read_at: new Date(Date.now()-3600_000).toISOString() }
  ]
};

async function init() {
  const url = await getActiveTabUrl();
  const mock = isMockSignedIn();
  const user = mock ? { id: 'mock' } : await getUser();
  if (user) {
    authSection.hidden = true;
    appSection.hidden = false;
    const st = mock ? mockState.status : (url ? await getStatusForUrl(url) : null);
    statusEl.textContent = st || (url ? 'Unknown' : 'No tab');
    if (mock) {
      recentList.innerHTML = '';
      for (const it of mockState.recent) {
        const li = document.createElement('li');
        const title = document.createElement('div');
        title.textContent = it.title || it.url;
        const meta = document.createElement('div');
        meta.className = 'meta';
        const chip = document.createElement('span');
        const st = (it.status || '').toLowerCase();
        chip.className = `chip ${st}`;
        chip.textContent = st || 'unknown';
        const when = document.createElement('span');
        when.textContent = ' • ' + new Date(it.last_read_at).toLocaleString();
        meta.appendChild(chip);
        meta.appendChild(when);
        li.appendChild(title);
        li.appendChild(meta);
        recentList.appendChild(li);
      }
    } else {
      await renderRecent();
    }
  } else {
    appSection.hidden = true;
    authSection.hidden = false;
  }
}

toggleBtn.addEventListener('click', async () => {
  const url = await getActiveTabUrl();
  if (!url) return;
  const mock = isMockSignedIn();
  if (mock) {
    mockState.status = mockState.status === 'read' ? 'unread' : 'read';
  } else {
    await toggleReadForUrl(url);
  }
  const st = mock ? mockState.status : await getStatusForUrl(url);
  statusEl.textContent = st || 'Unknown';
  await renderRecent(searchInput.value || '');
});

searchInput.addEventListener('input', () => renderRecent(searchInput.value || ''));

signoutBtn?.addEventListener('click', async () => {
  await signOut();
  authSection.hidden = false;
  appSection.hidden = true;
});

authForm?.addEventListener('submit', async e => {
  e.preventDefault();
  authStatus.textContent = 'Signing in...';
  const { error } = await signInWithPassword(authEmail.value, authPassword.value);
  if (error) {
    authStatus.textContent = 'Sign-in failed';
    return;
  }
  authStatus.textContent = 'Signed in';
  await init();
});

init();
