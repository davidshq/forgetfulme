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
    li.textContent = it.title || it.url;
    recentList.appendChild(li);
  }
}

async function init() {
  const user = await getUser();
  const url = await getActiveTabUrl();
  if (user) {
    authSection.hidden = true;
    appSection.hidden = false;
    const st = url ? await getStatusForUrl(url) : null;
    statusEl.textContent = st || (url ? 'Unknown' : 'No tab');
    await renderRecent();
  } else {
    appSection.hidden = true;
    authSection.hidden = false;
  }
}

toggleBtn.addEventListener('click', async () => {
  const url = await getActiveTabUrl();
  if (!url) return;
  await toggleReadForUrl(url);
  const st = await getStatusForUrl(url);
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
